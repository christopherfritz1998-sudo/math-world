-- Math World — esquema de la base de datos (Supabase / PostgreSQL).
-- Las tablas no se pueden leer ni escribir directamente desde el navegador:
-- todo pasa por funciones (mw_*) que validan la sesión. Este archivo NO contiene
-- datos personales ni claves: las listas y la cuenta docente se cargan aparte.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.estudiantes (
  id uuid primary key default gen_random_uuid(),
  curso text not null check (curso in ('7A', '7B', '8A', '8B')),
  rut text not null unique,
  nombre text not null,
  clave_hash text,
  progreso jsonb not null default '{}'::jsonb,
  zona text,
  ultimo_ping timestamptz,
  fallos int not null default 0,
  bloqueado_hasta timestamptz,
  creado timestamptz not null default now(),
  actualizado timestamptz
);

create table if not exists public.docentes (
  rut text primary key,
  clave_hash text not null,
  fallos int not null default 0,
  bloqueado_hasta timestamptz
);

create table if not exists public.sesiones (
  token uuid primary key default gen_random_uuid(),
  estudiante_id uuid references public.estudiantes (id) on delete cascade,
  docente_rut text references public.docentes (rut) on delete cascade,
  expira timestamptz not null
);

alter table public.estudiantes enable row level security;
alter table public.docentes enable row level security;
alter table public.sesiones enable row level security;
revoke all on public.estudiantes, public.docentes, public.sesiones from anon, authenticated;

-- RUT sin puntos ni guion y con K mayúscula: "12.345.678-k" -> "12345678-K"
create or replace function public.mw_rut(p text) returns text
language sql immutable as $$
  select case when length(r) < 2 then null else left(r, length(r) - 1) || '-' || right(r, 1) end
  from (select upper(regexp_replace(coalesce(p, ''), '[^0-9kK]', '', 'g')) as r) s;
$$;

create or replace function public.mw_sesion_estudiante(p_token uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select estudiante_id from sesiones where token = p_token and expira > now() and estudiante_id is not null;
$$;

create or replace function public.mw_sesion_docente(p_token uuid) returns text
language sql stable security definer set search_path = public as $$
  select docente_rut from sesiones where token = p_token and expira > now() and docente_rut is not null;
$$;

-- ¿Existe el RUT en el nivel elegido (7 u 8) y ya creó su clave?
create or replace function public.mw_estudiante_estado(p_rut text, p_nivel text)
returns json language plpgsql security definer set search_path = public as $$
declare e estudiantes;
begin
  select * into e from estudiantes where rut = mw_rut(p_rut) and left(curso, 1) = p_nivel;
  if not found then return json_build_object('existe', false); end if;
  return json_build_object('existe', true, 'tiene_clave', e.clave_hash is not null,
    'nombre', split_part(e.nombre, ' ', 3), 'curso', e.curso);
end $$;

-- Entrar. La primera vez, la clave enviada queda como su clave.
create or replace function public.mw_estudiante_entrar(p_rut text, p_nivel text, p_clave text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare e estudiantes; t uuid;
begin
  select * into e from estudiantes where rut = mw_rut(p_rut) and left(curso, 1) = p_nivel;
  if not found then return json_build_object('ok', false, 'error', 'no_esta'); end if;
  if e.bloqueado_hasta is not null and e.bloqueado_hasta > now() then
    return json_build_object('ok', false, 'error', 'bloqueado');
  end if;
  if e.clave_hash is null then
    if length(coalesce(p_clave, '')) < 4 then return json_build_object('ok', false, 'error', 'clave_corta'); end if;
    update estudiantes set clave_hash = crypt(p_clave, gen_salt('bf')), fallos = 0 where id = e.id;
  elsif e.clave_hash <> crypt(coalesce(p_clave, ''), e.clave_hash) then
    update estudiantes set fallos = fallos + 1,
      bloqueado_hasta = case when fallos + 1 >= 5 then now() + interval '10 minutes' else null end
    where id = e.id;
    return json_build_object('ok', false, 'error', 'clave_incorrecta');
  else
    update estudiantes set fallos = 0, bloqueado_hasta = null where id = e.id;
  end if;
  insert into sesiones (estudiante_id, expira) values (e.id, now() + interval '12 hours') returning token into t;
  update estudiantes set ultimo_ping = now() where id = e.id;
  return json_build_object('ok', true, 'token', t, 'nombre', e.nombre, 'curso', e.curso, 'progreso', e.progreso);
end $$;

create or replace function public.mw_guardar(p_token uuid, p_progreso jsonb, p_zona text)
returns boolean language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token);
begin
  if id_e is null then return false; end if;
  if pg_column_size(p_progreso) > 200000 then return false; end if;
  update estudiantes set progreso = p_progreso, zona = left(p_zona, 20), ultimo_ping = now(), actualizado = now() where id = id_e;
  return true;
end $$;

create or replace function public.mw_ping(p_token uuid, p_zona text)
returns boolean language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token);
begin
  if id_e is null then return false; end if;
  update estudiantes set zona = left(p_zona, 20), ultimo_ping = now() where id = id_e;
  return true;
end $$;

create or replace function public.mw_salir(p_token uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update estudiantes set ultimo_ping = now() - interval '1 hour'
   where id = (select estudiante_id from sesiones where token = p_token);
  update sesiones set expira = now() where token = p_token;
end $$;

create or replace function public.mw_docente_entrar(p_rut text, p_clave text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare d docentes; t uuid;
begin
  select * into d from docentes where rut = mw_rut(p_rut);
  if not found then return json_build_object('ok', false, 'error', 'datos_incorrectos'); end if;
  if d.bloqueado_hasta is not null and d.bloqueado_hasta > now() then
    return json_build_object('ok', false, 'error', 'bloqueado');
  end if;
  if d.clave_hash <> crypt(coalesce(p_clave, ''), d.clave_hash) then
    update docentes set fallos = fallos + 1,
      bloqueado_hasta = case when fallos + 1 >= 5 then now() + interval '15 minutes' else null end
    where rut = d.rut;
    return json_build_object('ok', false, 'error', 'datos_incorrectos');
  end if;
  update docentes set fallos = 0, bloqueado_hasta = null where rut = d.rut;
  insert into sesiones (docente_rut, expira) values (d.rut, now() + interval '8 hours') returning token into t;
  return json_build_object('ok', true, 'token', t);
end $$;

-- Resumen de todos los cursos para el portal docente.
create or replace function public.mw_docente_resumen(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  return (select coalesce(json_agg(json_build_object(
      'id', id, 'curso', curso, 'rut', rut, 'nombre', nombre,
      'tiene_clave', clave_hash is not null,
      'conectado', ultimo_ping > now() - interval '75 seconds',
      'ultimo', ultimo_ping, 'zona', zona, 'progreso', progreso
    ) order by curso, nombre), '[]'::json) from estudiantes);
end $$;

-- Borra la clave: el estudiante crea una nueva la próxima vez que entre.
create or replace function public.mw_docente_restablecer(p_token uuid, p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return false; end if;
  update estudiantes set clave_hash = null, fallos = 0, bloqueado_hasta = null where id = p_id;
  update sesiones set expira = now() where estudiante_id = p_id and expira > now();
  return true;
end $$;

-- Carga o actualiza una lista: [{ "curso": "7A", "rut": "...", "nombre": "..." }, ...]
create or replace function public.mw_docente_cargar(p_token uuid, p_lista jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if mw_sesion_docente(p_token) is null then return -1; end if;
  insert into estudiantes (curso, rut, nombre)
  select x->>'curso', mw_rut(x->>'rut'), x->>'nombre' from jsonb_array_elements(p_lista) x
  on conflict (rut) do update set curso = excluded.curso, nombre = excluded.nombre;
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.mw_sesion_estudiante(uuid), public.mw_sesion_docente(uuid) from public, anon, authenticated;
grant execute on function
  public.mw_estudiante_estado(text, text), public.mw_estudiante_entrar(text, text, text),
  public.mw_guardar(uuid, jsonb, text), public.mw_ping(uuid, text), public.mw_salir(uuid),
  public.mw_docente_entrar(text, text), public.mw_docente_resumen(uuid),
  public.mw_docente_restablecer(uuid, uuid), public.mw_docente_cargar(uuid, jsonb)
to anon;

-- Partida propia del docente (base y personaje, con recursos ilimitados en el juego)
alter table public.docentes add column if not exists progreso jsonb not null default '{}'::jsonb;
alter table public.docentes add column if not exists zona text;
alter table public.docentes add column if not exists ultimo_ping timestamptz;

create or replace function public.mw_docente_progreso(p_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r text := mw_sesion_docente(p_token);
begin
  if r is null then return null; end if;
  return (select progreso from docentes where rut = r);
end $$;

create or replace function public.mw_docente_guardar(p_token uuid, p_progreso jsonb, p_zona text)
returns boolean language plpgsql security definer set search_path = public as $$
declare r text := mw_sesion_docente(p_token);
begin
  if r is null then return false; end if;
  if pg_column_size(p_progreso) > 200000 then return false; end if;
  update docentes set progreso = p_progreso, zona = left(p_zona, 20), ultimo_ping = now() where rut = r;
  return true;
end $$;

revoke all on function public.mw_docente_progreso(uuid), public.mw_docente_guardar(uuid, jsonb, text) from public, authenticated;
grant execute on function public.mw_docente_progreso(uuid), public.mw_docente_guardar(uuid, jsonb, text) to anon;
