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

-- Cuántos estudiantes conectados hay en cada mundo y grupo de un nivel (para elegir grupo)
create or replace function public.mw_grupos(p_token uuid, p_nivel text)
returns json language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_estudiante(p_token) is null and mw_sesion_docente(p_token) is null then return null; end if;
  return (select coalesce(json_object_agg(zona, n), '{}'::json) from (
    select zona, count(*) as n from estudiantes
     where left(curso, 1) = p_nivel and ultimo_ping > now() - interval '75 seconds' and zona like 'u_-g%'
     group by zona) t);
end $$;
revoke all on function public.mw_grupos(uuid, text) from public, authenticated;
grant execute on function public.mw_grupos(uuid, text) to anon;

-- Abrir y cerrar el juego por curso desde el portal docente
create table if not exists public.cursos (
  curso text primary key check (curso in ('7A', '7B', '8A', '8B')),
  abierto boolean not null default true,
  actualizado timestamptz not null default now()
);
alter table public.cursos enable row level security;
revoke all on public.cursos from anon, authenticated;
insert into public.cursos (curso) values ('7A'), ('7B'), ('8A'), ('8B') on conflict (curso) do nothing;

create or replace function public.mw_curso_abierto(p_curso text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select abierto from cursos where curso = p_curso), true);
$$;

create or replace function public.mw_estudiante_estado(p_rut text, p_nivel text)
returns json language plpgsql security definer set search_path = public as $$
declare e estudiantes;
begin
  select * into e from estudiantes where rut = mw_rut(p_rut) and left(curso, 1) = p_nivel;
  if not found then return json_build_object('existe', false); end if;
  return json_build_object('existe', true, 'tiene_clave', e.clave_hash is not null,
    'nombre', split_part(e.nombre, ' ', 3), 'curso', e.curso, 'abierto', mw_curso_abierto(e.curso));
end $$;

create or replace function public.mw_estudiante_entrar(p_rut text, p_nivel text, p_clave text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare e estudiantes; t uuid;
begin
  select * into e from estudiantes where rut = mw_rut(p_rut) and left(curso, 1) = p_nivel;
  if not found then return json_build_object('ok', false, 'error', 'no_esta'); end if;
  if not mw_curso_abierto(e.curso) then return json_build_object('ok', false, 'error', 'cerrado'); end if;
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

-- Guardar sigue funcionando con el juego cerrado (para no perder avance), pero no marca "en línea".
create or replace function public.mw_guardar(p_token uuid, p_progreso jsonb, p_zona text)
returns boolean language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token);
begin
  if id_e is null then return false; end if;
  if pg_column_size(p_progreso) > 200000 then return false; end if;
  update estudiantes set progreso = p_progreso, zona = left(p_zona, 20), actualizado = now(),
    ultimo_ping = case when mw_curso_abierto(curso) then now() else ultimo_ping end
  where id = id_e;
  return true;
end $$;

-- Latido del juego: marca en línea y avisa si el docente cerró el curso.
create or replace function public.mw_latido(p_token uuid, p_zona text)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso into c from estudiantes where id = id_e;
  if not mw_curso_abierto(c) then
    update estudiantes set ultimo_ping = now() - interval '1 hour' where id = id_e;
    return json_build_object('ok', true, 'abierto', false);
  end if;
  update estudiantes set zona = left(p_zona, 20), ultimo_ping = now() where id = id_e;
  return json_build_object('ok', true, 'abierto', true);
end $$;

create or replace function public.mw_docente_cursos(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  return (select json_object_agg(curso, abierto) from cursos);
end $$;

create or replace function public.mw_docente_abrir(p_token uuid, p_cursos text[], p_abierto boolean)
returns json language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  update cursos set abierto = p_abierto, actualizado = now() where curso = any (p_cursos);
  return (select json_object_agg(curso, abierto) from cursos);
end $$;

revoke all on function public.mw_curso_abierto(text) from public, anon, authenticated;
revoke all on function public.mw_latido(uuid, text), public.mw_docente_cursos(uuid), public.mw_docente_abrir(uuid, text[], boolean) from public, authenticated;
grant execute on function public.mw_latido(uuid, text), public.mw_docente_cursos(uuid), public.mw_docente_abrir(uuid, text[], boolean) to anon;

-- Mundos (unidades) habilitados por curso desde el portal docente. La Unidad 1 siempre está abierta.
alter table public.cursos add column if not exists mundos text[] not null default '{u1}';

create or replace function public.mw_curso_mundos(p_curso text) returns text[]
language sql stable security definer set search_path = public as $$
  select coalesce((select mundos from cursos where curso = p_curso), '{u1}');
$$;

create or replace function public.mw_estudiante_entrar(p_rut text, p_nivel text, p_clave text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare e estudiantes; t uuid;
begin
  select * into e from estudiantes where rut = mw_rut(p_rut) and left(curso, 1) = p_nivel;
  if not found then return json_build_object('ok', false, 'error', 'no_esta'); end if;
  if not mw_curso_abierto(e.curso) then return json_build_object('ok', false, 'error', 'cerrado'); end if;
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
  return json_build_object('ok', true, 'token', t, 'nombre', e.nombre, 'curso', e.curso, 'progreso', e.progreso, 'mundos', mw_curso_mundos(e.curso));
end $$;

create or replace function public.mw_latido(p_token uuid, p_zona text)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso into c from estudiantes where id = id_e;
  if not mw_curso_abierto(c) then
    update estudiantes set ultimo_ping = now() - interval '1 hour' where id = id_e;
    return json_build_object('ok', true, 'abierto', false);
  end if;
  update estudiantes set zona = left(p_zona, 20), ultimo_ping = now() where id = id_e;
  return json_build_object('ok', true, 'abierto', true, 'mundos', mw_curso_mundos(c));
end $$;

create or replace function public.mw_docente_mundos(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  return (select json_object_agg(curso, mundos) from cursos);
end $$;

create or replace function public.mw_docente_mundo(p_token uuid, p_cursos text[], p_unidad text, p_abierta boolean)
returns json language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  if p_unidad not in ('u2', 'u3', 'u4') then return (select json_object_agg(curso, mundos) from cursos); end if;
  update cursos set actualizado = now(), mundos = case when p_abierta
      then array(select distinct x from unnest(array_append(mundos, p_unidad)) as x order by x)
      else array_remove(mundos, p_unidad) end
   where curso = any (p_cursos);
  return (select json_object_agg(curso, mundos) from cursos);
end $$;

revoke all on function public.mw_curso_mundos(text) from public, anon, authenticated;
revoke all on function public.mw_estudiante_entrar(text, text, text), public.mw_latido(uuid, text), public.mw_docente_mundos(uuid), public.mw_docente_mundo(uuid, text[], text, boolean) from public, authenticated;
grant execute on function public.mw_estudiante_entrar(text, text, text), public.mw_latido(uuid, text), public.mw_docente_mundos(uuid), public.mw_docente_mundo(uuid, text[], text, boolean) to anon;

-- Desafíos en vivo: el docente lanza un desafío a uno o más cursos; los juegos de los
-- estudiantes lo consultan cada pocos segundos y muestran un contador de 10 segundos.
alter table public.cursos add column if not exists desafio jsonb;
create sequence if not exists public.mw_desafio_n;
revoke all on sequence public.mw_desafio_n from anon, authenticated;

-- Puntaje de cada estudiante en los desafíos de preguntas (duelo y meta del curso)
create table if not exists public.desafio_puntos (
  curso text not null,
  n bigint not null,
  estudiante_id uuid not null references public.estudiantes (id),
  aciertos int not null default 0,
  errores int not null default 0,
  ultimo timestamptz not null default now(),
  primary key (curso, n, estudiante_id)
);
alter table public.desafio_puntos enable row level security;
revoke all on public.desafio_puntos from anon, authenticated;

create or replace function public.mw_ms() returns bigint
language sql stable as $$ select (extract(epoch from clock_timestamp()) * 1000)::bigint $$;

-- "Abdala Leon Gabriel Ignacio" -> "Gabriel A."
create or replace function public.mw_nombre_corto(p text) returns text
language sql immutable as $$
  select case when split_part(p, ' ', 3) <> '' then split_part(p, ' ', 3) || ' ' || left(split_part(p, ' ', 1), 1) || '.'
              else split_part(p, ' ', 1) end
$$;

-- Ranking y totales de un desafío de un curso (uso interno)
create or replace function public.mw_desafio_tabla(p_curso text, p_n bigint, p_lim int, p_yo uuid)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'ranking', coalesce((select json_agg(x) from (
        select mw_nombre_corto(e.nombre) as nombre, p.aciertos, p.errores, (p.estudiante_id = p_yo) as yo
        from desafio_puntos p join estudiantes e on e.id = p.estudiante_id
        where p.curso = p_curso and p.n = p_n
        order by p.aciertos desc, p.errores asc, p.ultimo asc limit p_lim) x), '[]'::json),
    'total', coalesce((select sum(aciertos) from desafio_puntos where curso = p_curso and n = p_n), 0),
    'participantes', (select count(*) from desafio_puntos where curso = p_curso and n = p_n),
    'ganador', (select p.estudiante_id from desafio_puntos p where p.curso = p_curso and p.n = p_n and p.aciertos > 0
                order by p.aciertos desc, p.errores asc, p.ultimo asc limit 1),
    'ganador_nombre', (select mw_nombre_corto(e.nombre) from desafio_puntos p join estudiantes e on e.id = p.estudiante_id
                where p.curso = p_curso and p.n = p_n and p.aciertos > 0
                order by p.aciertos desc, p.errores asc, p.ultimo asc limit 1)
  )
$$;

-- Docente: estado de los desafíos de todos los cursos
create or replace function public.mw_docente_desafios(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare r json;
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  select json_object_agg(c.curso, case when c.desafio is null then null else
      (c.desafio::jsonb || coalesce(mw_desafio_tabla(c.curso, (c.desafio->>'n')::bigint, 10, null)::jsonb, '{}'::jsonb)
        || jsonb_build_object('conectados', (select count(*) from estudiantes e where e.curso = c.curso and e.ultimo_ping > now() - interval '90 seconds')))
      end) into r from cursos c;
  return json_build_object('ahora', mw_ms(), 'cursos', r);
end $$;

-- Docente: lanzar (p_id) o detener (p_id null) un desafío en los cursos elegidos
create or replace function public.mw_docente_desafio(p_token uuid, p_cursos text[], p_id text, p_seg int)
returns json language plpgsql security definer set search_path = public as $$
declare c text; meta int; t0 bigint;
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  if p_id is null then
    update cursos set desafio = desafio || jsonb_build_object('fin', mw_ms(), 'detenido', true)
      where curso = any (p_cursos) and desafio is not null and (desafio->>'fin')::bigint > mw_ms();
  else
    for c in select curso from cursos where curso = any (p_cursos) loop
      meta := greatest(15, 5 * (select count(*) from estudiantes e where e.curso = c and e.ultimo_ping > now() - interval '90 seconds'));
      t0 := mw_ms() + 11000;
      update cursos set desafio = jsonb_build_object('n', nextval('mw_desafio_n'), 'id', left(p_id, 20), 'inicio', t0,
          'fin', t0 + 1000 * least(greatest(coalesce(p_seg, 60), 10), 300), 'meta', meta)
        where curso = c;
    end loop;
  end if;
  return mw_docente_desafios(p_token);
end $$;

-- Estudiante: desafío vigente de su curso (si terminó hace menos de 2 minutos, también)
create or replace function public.mw_desafio(p_token uuid)
returns json language plpgsql stable security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; d jsonb; ahora bigint := mw_ms(); t jsonb; mio desafio_puntos;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select e.curso, k.desafio into c, d from estudiantes e join cursos k on k.curso = e.curso where e.id = id_e;
  if d is null or (d->>'fin')::bigint < ahora - 120000 then return json_build_object('ok', true, 'ahora', ahora); end if;
  if d->>'id' in ('arena', 'curso') then
    t := mw_desafio_tabla(c, (d->>'n')::bigint, 5, id_e)::jsonb;
    select * into mio from desafio_puntos p where p.curso = c and p.n = (d->>'n')::bigint and p.estudiante_id = id_e;
    d := d || jsonb_build_object('ranking', t->'ranking', 'total', t->'total', 'participantes', t->'participantes',
      'aciertos', coalesce(mio.aciertos, 0), 'errores', coalesce(mio.errores, 0));
    if ahora > (d->>'fin')::bigint then
      d := d || jsonb_build_object('gane', (t->>'ganador') = id_e::text, 'ganador_nombre', t->'ganador_nombre');
    end if;
  end if;
  return json_build_object('ok', true, 'ahora', ahora, 'desafio', d);
end $$;

-- Estudiante: registra una respuesta en el duelo o en la meta del curso (máximo una por segundo)
create or replace function public.mw_desafio_responder(p_token uuid, p_n bigint, p_ok boolean)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; d jsonb; ahora bigint := mw_ms();
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select e.curso, k.desafio into c, d from estudiantes e join cursos k on k.curso = e.curso where e.id = id_e;
  if d is not null and (d->>'n')::bigint = p_n and d->>'id' in ('arena', 'curso')
     and ahora >= (d->>'inicio')::bigint and ahora <= (d->>'fin')::bigint + 1500 then
    insert into desafio_puntos (curso, n, estudiante_id, ultimo) values (c, p_n, id_e, now() - interval '1 hour')
      on conflict do nothing;
    update desafio_puntos set aciertos = aciertos + (case when p_ok then 1 else 0 end),
        errores = errores + (case when p_ok then 0 else 1 end), ultimo = now()
      where curso = c and n = p_n and estudiante_id = id_e and ultimo < now() - interval '900 milliseconds';
  end if;
  return mw_desafio(p_token);
end $$;

revoke all on function public.mw_ms(), public.mw_nombre_corto(text), public.mw_desafio_tabla(text, bigint, int, uuid) from public, anon, authenticated;
revoke all on function public.mw_docente_desafios(uuid), public.mw_docente_desafio(uuid, text[], text, int), public.mw_desafio(uuid), public.mw_desafio_responder(uuid, bigint, boolean) from public, authenticated;
grant execute on function public.mw_docente_desafios(uuid), public.mw_docente_desafio(uuid, text[], text, int), public.mw_desafio(uuid), public.mw_desafio_responder(uuid, bigint, boolean) to anon;
-- Desafío "Prisma estelar": aparece en un mundo al azar (entre los abiertos del curso) y
-- solo un jugador por grupo puede llevárselo (el primero que responde bien 5 preguntas).
create table if not exists public.desafio_premios (
  curso text not null,
  n bigint not null,
  grupo text not null,
  estudiante_id uuid not null references public.estudiantes (id),
  creado timestamptz not null default now(),
  primary key (curso, n, grupo)
);
alter table public.desafio_premios enable row level security;
revoke all on public.desafio_premios from anon, authenticated;

create or replace function public.mw_docente_desafio(p_token uuid, p_cursos text[], p_id text, p_seg int)
returns json language plpgsql security definer set search_path = public as $$
declare c text; meta int; t0 bigint; m text[]; extra jsonb;
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  if p_id is null then
    update cursos set desafio = desafio || jsonb_build_object('fin', mw_ms(), 'detenido', true)
      where curso = any (p_cursos) and desafio is not null and (desafio->>'fin')::bigint > mw_ms();
  else
    for c in select curso from cursos where curso = any (p_cursos) loop
      meta := greatest(15, 5 * (select count(*) from estudiantes e where e.curso = c and e.ultimo_ping > now() - interval '90 seconds'));
      t0 := mw_ms() + 11000;
      extra := '{}'::jsonb;
      if p_id = 'prisma' then
        m := mw_curso_mundos(c);
        extra := jsonb_build_object('mundo', m[1 + floor(random() * cardinality(m))::int]);
      end if;
      update cursos set desafio = jsonb_build_object('n', nextval('mw_desafio_n'), 'id', left(p_id, 20), 'inicio', t0,
          'fin', t0 + 1000 * least(greatest(coalesce(p_seg, 60), 10), 300), 'meta', meta) || extra
        where curso = c;
    end loop;
  end if;
  return mw_docente_desafios(p_token);
end $$;

-- Estudiante: reclama el prisma para su grupo (gana el primero; los demás reciben el nombre de quien lo tomó)
create or replace function public.mw_prisma_reclamar(p_token uuid, p_n bigint, p_grupo text)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; d jsonb; g uuid; ahora bigint := mw_ms();
begin
  if id_e is null then return json_build_object('ok', false, 'error', 'sesion'); end if;
  select e.curso, k.desafio into c, d from estudiantes e join cursos k on k.curso = e.curso where e.id = id_e;
  if d is null or d->>'id' <> 'prisma' or (d->>'n')::bigint <> p_n
     or ahora < (d->>'inicio')::bigint or ahora > (d->>'fin')::bigint + 4000 then
    return json_build_object('ok', false, 'error', 'fuera');
  end if;
  insert into desafio_premios (curso, n, grupo, estudiante_id) values (c, p_n, left(coalesce(p_grupo, ''), 60), id_e)
    on conflict do nothing;
  select estudiante_id into g from desafio_premios where curso = c and n = p_n and grupo = left(coalesce(p_grupo, ''), 60);
  return json_build_object('ok', g = id_e, 'nombre', (select mw_nombre_corto(nombre) from estudiantes where id = g));
end $$;

revoke all on function public.mw_prisma_reclamar(uuid, bigint, text) from public, authenticated;
grant execute on function public.mw_prisma_reclamar(uuid, bigint, text) to anon;

-- Obras cooperativas (por nivel: todo 7° o todo 8°): el puente al Bosque profundo.
-- Cada estudiante aporta recursos; el avance se guarda y, una vez completa, queda para siempre.
create table if not exists public.obras (
  nivel text not null,
  id text not null,
  aportes jsonb not null default '{}'::jsonb,
  completado timestamptz,
  primary key (nivel, id)
);
create table if not exists public.obra_aportes (
  nivel text not null,
  obra text not null,
  estudiante_id uuid not null references public.estudiantes (id),
  total int not null default 0,
  primary key (nivel, obra, estudiante_id)
);
alter table public.obras enable row level security;
alter table public.obra_aportes enable row level security;
revoke all on public.obras, public.obra_aportes from anon, authenticated;

create or replace function public.mw_obra_meta(p_id text) returns jsonb
language sql immutable as $$
  select case p_id when 'puente_bosque' then '{"madera": 600, "piedra": 350, "agua": 150, "cristal": 40}'::jsonb
                   when 'montacargas_valle' then '{"fibra": 500, "arenisca": 400, "cobre": 200, "oro": 60}'::jsonb
                   when 'elevador_mina' then '{"carbon": 500, "plata": 300, "hongo": 150, "amatista": 50}'::jsonb
                   when 'ruta_glaciar' then '{"hielo": 500, "escarcha": 260, "baya": 150, "zafiro": 50}'::jsonb else null end
$$;

create or replace function public.mw_obra_estado(p_nivel text, p_id text, p_yo uuid)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', p_id, 'nivel', p_nivel, 'meta', mw_obra_meta(p_id),
    'aportes', coalesce((select aportes from obras where nivel = p_nivel and id = p_id), '{}'::jsonb),
    'completado', (select completado from obras where nivel = p_nivel and id = p_id) is not null,
    'mio', coalesce((select total from obra_aportes where nivel = p_nivel and obra = p_id and estudiante_id = p_yo), 0),
    'top', coalesce((select json_agg(x) from (select mw_nombre_corto(e.nombre) as nombre, a.total from obra_aportes a join estudiantes e on e.id = a.estudiante_id
                     where a.nivel = p_nivel and a.obra = p_id order by a.total desc limit 5) x), '[]'::json),
    'aportantes', (select count(*) from obra_aportes where nivel = p_nivel and obra = p_id)
  )
$$;

-- Ver una obra: estudiantes (su nivel) o docente (el nivel que juega)
create or replace function public.mw_obra(p_token uuid, p_id text, p_nivel text)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); n text;
begin
  if id_e is not null then select left(curso, 1) into n from estudiantes where id = id_e;
  elsif mw_sesion_docente(p_token) is not null then n := left(coalesce(p_nivel, '7'), 1);
  else return json_build_object('ok', false); end if;
  if mw_obra_meta(p_id) is null then return json_build_object('ok', false); end if;
  return (mw_obra_estado(n, p_id, id_e)::jsonb || '{"ok": true}'::jsonb)::json;
end $$;

-- Aportar: solo se acepta lo que falta; devuelve lo aceptado para descontarlo en el juego
create or replace function public.mw_obra_aportar(p_token uuid, p_id text, p_recursos jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); n text; meta jsonb := mw_obra_meta(p_id); act jsonb; acep jsonb := '{}'::jsonb;
  k text; quiere int; falta int; dado int; suma int := 0; listo boolean;
begin
  if id_e is null or meta is null then return json_build_object('ok', false); end if;
  select left(curso, 1) into n from estudiantes where id = id_e;
  insert into obras (nivel, id) values (n, p_id) on conflict do nothing;
  select aportes into act from obras where nivel = n and id = p_id for update;
  if (select completado from obras where nivel = n and id = p_id) is not null then
    return (mw_obra_estado(n, p_id, id_e)::jsonb || jsonb_build_object('ok', true, 'aceptado', '{}'::jsonb))::json;
  end if;
  for k in select jsonb_object_keys(meta) loop
    quiere := greatest(0, least(coalesce((p_recursos->>k)::int, 0), 500));
    falta := greatest(0, (meta->>k)::int - coalesce((act->>k)::int, 0));
    dado := least(quiere, falta);
    if dado > 0 then
      act := act || jsonb_build_object(k, coalesce((act->>k)::int, 0) + dado);
      acep := acep || jsonb_build_object(k, dado); suma := suma + dado;
    end if;
  end loop;
  listo := not exists (select 1 from jsonb_object_keys(meta) k2 where coalesce((act->>k2)::int, 0) < (meta->>k2)::int);
  update obras set aportes = act, completado = case when listo then now() else null end where nivel = n and id = p_id;
  if suma > 0 then
    insert into obra_aportes (nivel, obra, estudiante_id, total) values (n, p_id, id_e, suma)
      on conflict (nivel, obra, estudiante_id) do update set total = obra_aportes.total + excluded.total;
  end if;
  return (mw_obra_estado(n, p_id, id_e)::jsonb || jsonb_build_object('ok', true, 'aceptado', acep))::json;
end $$;

-- Docente: avance de las obras de 7° y 8°
create or replace function public.mw_docente_obras(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  return json_build_object('7', mw_obra_estado('7', 'puente_bosque', null), '8', mw_obra_estado('8', 'puente_bosque', null),
    'valle', json_build_object('7', mw_obra_estado('7', 'montacargas_valle', null), '8', mw_obra_estado('8', 'montacargas_valle', null)),
    'mina', json_build_object('7', mw_obra_estado('7', 'elevador_mina', null), '8', mw_obra_estado('8', 'elevador_mina', null)),
    'cima', json_build_object('7', mw_obra_estado('7', 'ruta_glaciar', null), '8', mw_obra_estado('8', 'ruta_glaciar', null)));
end $$;

revoke all on function public.mw_obra_meta(text), public.mw_obra_estado(text, text, uuid) from public, anon, authenticated;
revoke all on function public.mw_obra(uuid, text, text), public.mw_obra_aportar(uuid, text, jsonb), public.mw_docente_obras(uuid) from public, authenticated;
grant execute on function public.mw_obra(uuid, text, text), public.mw_obra_aportar(uuid, text, jsonb), public.mw_docente_obras(uuid) to anon;
-- ===================================================================
-- Convivencia y comunicación con el docente
-- ===================================================================
-- Configuración por curso: mensaje del docente (anuncio) y chat de emoticones
alter table public.cursos add column if not exists anuncio jsonb;
alter table public.cursos add column if not exists chat boolean not null default true;

create or replace function public.mw_latido(p_token uuid, p_zona text)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; cu cursos%rowtype;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso into c from estudiantes where id = id_e;
  if not mw_curso_abierto(c) then
    update estudiantes set ultimo_ping = now() - interval '1 hour' where id = id_e;
    return json_build_object('ok', true, 'abierto', false);
  end if;
  update estudiantes set zona = left(p_zona, 20), ultimo_ping = now() where id = id_e;
  select * into cu from cursos where curso = c;
  return json_build_object('ok', true, 'abierto', true, 'mundos', mw_curso_mundos(c), 'chat', coalesce(cu.chat, true),
    'anuncio', case when cu.anuncio is not null and (cu.anuncio->>'hasta')::bigint > mw_ms() then cu.anuncio else null end);
end $$;

-- Docente: configuración de todos los cursos (chat y anuncio vigente)
create or replace function public.mw_docente_config(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  return (select json_object_agg(curso, json_build_object('chat', chat, 'anuncio', case when anuncio is not null and (anuncio->>'hasta')::bigint > mw_ms() then anuncio else null end)) from cursos);
end $$;

-- Docente: mensaje para los estudiantes que están jugando (vacío = quitarlo). Dura los minutos indicados.
create or replace function public.mw_docente_anuncio(p_token uuid, p_cursos text[], p_texto text, p_min int)
returns json language plpgsql security definer set search_path = public as $$
declare t text := left(btrim(coalesce(p_texto, '')), 200);
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  update cursos set anuncio = case when t = '' then null
    else jsonb_build_object('n', mw_ms(), 'texto', t, 'hasta', mw_ms() + greatest(1, least(coalesce(p_min, 10), 120)) * 60000) end
  where curso = any (p_cursos);
  return mw_docente_config(p_token);
end $$;

-- Docente: activar o desactivar el chat de emoticones y frases
create or replace function public.mw_docente_chat(p_token uuid, p_cursos text[], p_on boolean)
returns json language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  update cursos set chat = coalesce(p_on, true) where curso = any (p_cursos);
  return mw_docente_config(p_token);
end $$;

-- Reportes de problemas e ideas de los estudiantes (solo los ve el docente)
create table if not exists public.reportes (
  id bigserial primary key,
  estudiante_id uuid not null references public.estudiantes(id) on delete cascade,
  curso text not null,
  tipo text not null check (tipo in ('problema', 'idea')),
  categoria text,
  texto text not null,
  zona text,
  creado timestamptz not null default now(),
  leido boolean not null default false
);
create index if not exists reportes_creado on public.reportes (creado desc);
alter table public.reportes enable row level security;
revoke all on public.reportes from anon, authenticated;

create or replace function public.mw_reporte_enviar(p_token uuid, p_tipo text, p_categoria text, p_texto text, p_zona text)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; t text := left(btrim(coalesce(p_texto, '')), 500); n int;
begin
  if id_e is null or p_tipo not in ('problema', 'idea') then return json_build_object('ok', false); end if;
  if char_length(t) < 3 then return json_build_object('ok', false, 'error', 'corto'); end if;
  select count(*) into n from reportes where estudiante_id = id_e and creado > now() - interval '1 hour';
  if n >= 6 then return json_build_object('ok', false, 'error', 'limite'); end if;
  select curso into c from estudiantes where id = id_e;
  insert into reportes (estudiante_id, curso, tipo, categoria, texto, zona) values (id_e, c, p_tipo, left(coalesce(p_categoria, ''), 40), t, left(coalesce(p_zona, ''), 40));
  return json_build_object('ok', true);
end $$;

create or replace function public.mw_docente_reportes(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  return coalesce((select json_agg(x) from (
    select r.id, r.tipo, r.categoria, r.texto, r.zona, r.curso, r.leido, mw_ms_de(r.creado) as creado, e.nombre
    from reportes r join estudiantes e on e.id = r.estudiante_id order by r.creado desc limit 300) x), '[]'::json);
end $$;

create or replace function public.mw_docente_reporte_leido(p_token uuid, p_ids bigint[], p_leido boolean)
returns json language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  update reportes set leido = coalesce(p_leido, true) where id = any (p_ids);
  return json_build_object('ok', true);
end $$;

create or replace function public.mw_ms_de(t timestamptz) returns bigint language sql immutable as $$ select (extract(epoch from t) * 1000)::bigint $$;

revoke all on function public.mw_docente_config(uuid), public.mw_docente_anuncio(uuid, text[], text, int), public.mw_docente_chat(uuid, text[], boolean),
  public.mw_reporte_enviar(uuid, text, text, text, text), public.mw_docente_reportes(uuid), public.mw_docente_reporte_leido(uuid, bigint[], boolean) from public, authenticated;
grant execute on function public.mw_docente_config(uuid), public.mw_docente_anuncio(uuid, text[], text, int), public.mw_docente_chat(uuid, text[], boolean),
  public.mw_reporte_enviar(uuid, text, text, text, text), public.mw_docente_reportes(uuid), public.mw_docente_reporte_leido(uuid, bigint[], boolean) to anon;
revoke all on function public.mw_ms_de(timestamptz) from public, anon, authenticated;
-- ===================================================================
-- Grupos fijos con código (por curso) y obras cooperativas por curso y grupo
-- ===================================================================
alter table public.estudiantes add column if not exists grupo smallint check (grupo between 1 and 8);
alter table public.estudiantes add column if not exists grupo_fallos int not null default 0;
alter table public.estudiantes add column if not exists grupo_bloqueo timestamptz;

create table if not exists public.grupo_codigos (
  curso text not null,
  grupo smallint not null check (grupo between 1 and 8),
  codigo text not null unique,
  primary key (curso, grupo)
);
alter table public.grupo_codigos enable row level security;
revoke all on public.grupo_codigos from anon, authenticated;

-- Código legible: PALABRA-NN, único en todo el colegio
drop function if exists public.mw_codigo_nuevo();
create or replace function public.mw_codigo_nuevo(p_curso text) returns text language plpgsql as $$
declare p text[] := array['ZORRO','PUMA','CONDOR','HUEMUL','PUDU','LOBO','COPIHUE','LLAMA','ALPACA','VICUNA','CHINCOL','TIUQUE','GUANACO','PICAFLOR','DELFIN','BALLENA','CHUCAO','CISNE','HALCON','TORTUGA','PULPO','JAIBA','ARAUCARIA','QUILLAY'];
  w text; c text;
begin
  loop
    w := p[1 + floor(random() * array_length(p, 1))::int];
    c := w || '-' || (10 + floor(random() * 90))::int::text;
    -- palabra distinta a las de los otros grupos del mismo curso, y código único en todo el colegio
    exit when not exists (select 1 from grupo_codigos where codigo = c)
          and not exists (select 1 from grupo_codigos where curso = p_curso and split_part(codigo, '-', 1) = w);
  end loop;
  return c;
end $$;
create or replace function public.mw_codigos_crear(p_curso text, p_renovar boolean) returns void language plpgsql as $$
declare g int;
begin
  for g in 1..8 loop
    if p_renovar then update grupo_codigos set codigo = mw_codigo_nuevo(p_curso) where curso = p_curso and grupo = g; end if;
    if not exists (select 1 from grupo_codigos where curso = p_curso and grupo = g) then
      insert into grupo_codigos (curso, grupo, codigo) values (p_curso, g, mw_codigo_nuevo(p_curso));
    end if;
  end loop;
end $$;
select mw_codigos_crear(curso, false) from cursos;
create or replace function public.mw_norm_codigo(t text) returns text language sql immutable as $$
  select regexp_replace(upper(translate(coalesce(t, ''), 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')), '[^A-Z0-9]', '', 'g') $$;

-- Estudiante: su grupo actual (null = debe escribir el código)
create or replace function public.mw_grupo_estado(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token);
begin
  if id_e is null then return json_build_object('ok', false); end if;
  return (select json_build_object('ok', true, 'grupo', grupo, 'curso', curso) from estudiantes where id = id_e);
end $$;

-- Estudiante: entra a un grupo con el código que le dio su profesor (una sola vez; después solo el docente lo cambia)
create or replace function public.mw_grupo_unirse(p_token uuid, p_codigo text)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); e estudiantes%rowtype; gc grupo_codigos%rowtype; n int;
begin
  if id_e is null then return json_build_object('ok', false, 'error', 'sesion'); end if;
  select * into e from estudiantes where id = id_e for update;
  if e.grupo is not null then return json_build_object('ok', true, 'grupo', e.grupo); end if;
  if e.grupo_bloqueo is not null and e.grupo_bloqueo > now() then return json_build_object('ok', false, 'error', 'bloqueado'); end if;
  select * into gc from grupo_codigos where mw_norm_codigo(codigo) = mw_norm_codigo(p_codigo);
  if gc.curso is null or gc.curso <> e.curso then
    update estudiantes set grupo_bloqueo = case when grupo_fallos + 1 >= 8 then now() + interval '10 minutes' else null end,
      grupo_fallos = case when grupo_fallos + 1 >= 8 then 0 else grupo_fallos + 1 end
    where id = id_e;
    return json_build_object('ok', false, 'error', case when gc.curso is not null then 'otro_curso' else 'codigo' end);
  end if;
  select count(*) into n from estudiantes where curso = e.curso and grupo = gc.grupo;
  if n >= 6 then return json_build_object('ok', false, 'error', 'lleno'); end if;
  update estudiantes set grupo = gc.grupo, grupo_fallos = 0, grupo_bloqueo = null where id = id_e;
  return json_build_object('ok', true, 'grupo', gc.grupo);
end $$;

-- El latido también informa el grupo (por si el docente lo cambió)
create or replace function public.mw_latido(p_token uuid, p_zona text)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint; cu cursos%rowtype;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso, grupo into c, g from estudiantes where id = id_e;
  if not mw_curso_abierto(c) then
    update estudiantes set ultimo_ping = now() - interval '1 hour' where id = id_e;
    return json_build_object('ok', true, 'abierto', false);
  end if;
  update estudiantes set zona = left(p_zona, 20), ultimo_ping = now() where id = id_e;
  select * into cu from cursos where curso = c;
  return json_build_object('ok', true, 'abierto', true, 'mundos', mw_curso_mundos(c), 'chat', coalesce(cu.chat, true), 'grupo', g,
    'anuncio', case when cu.anuncio is not null and (cu.anuncio->>'hasta')::bigint > mw_ms() then cu.anuncio else null end);
end $$;

-- Conectados por curso, mundo y grupo (para el docente que visita grupos)
create or replace function public.mw_grupos(p_token uuid, p_nivel text)
returns json language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_estudiante(p_token) is null and mw_sesion_docente(p_token) is null then return null; end if;
  return (select coalesce(json_object_agg(k, n), '{}'::json) from (
    select curso || ':' || zona as k, count(*) as n from estudiantes
     where left(curso, 1) = p_nivel and ultimo_ping > now() - interval '75 seconds' and zona like 'u_-g%'
     group by curso, zona) t);
end $$;

-- ---------- Obras por curso y grupo (las tablas estaban vacías: se rehacen) ----------
drop function if exists public.mw_docente_obras(uuid);
drop function if exists public.mw_obra(uuid, text, text);
drop function if exists public.mw_obra_aportar(uuid, text, jsonb);
drop function if exists public.mw_obra_estado(text, text, uuid);
drop table if exists public.obra_aportes;
drop table if exists public.obras;
create table public.obras (
  curso text not null,
  grupo smallint not null,
  id text not null,
  aportes jsonb not null default '{}'::jsonb,
  completado timestamptz,
  primary key (curso, grupo, id)
);
create table public.obra_aportes (
  curso text not null,
  grupo smallint not null,
  obra text not null,
  estudiante_id uuid not null references public.estudiantes(id) on delete cascade,
  total int not null default 0,
  primary key (curso, grupo, obra, estudiante_id)
);
alter table public.obras enable row level security;
alter table public.obra_aportes enable row level security;
revoke all on public.obras, public.obra_aportes from anon, authenticated;

-- Metas para un grupo (~6 estudiantes): algo más bajas que las de todo un nivel, pero siguen tomando tiempo
create or replace function public.mw_obra_meta(p_id text) returns jsonb language sql immutable as $$
  select case p_id when 'puente_bosque' then '{"madera": 360, "piedra": 210, "agua": 90, "cristal": 24}'::jsonb
                   when 'montacargas_valle' then '{"fibra": 300, "arenisca": 240, "cobre": 120, "oro": 36}'::jsonb
                   when 'elevador_mina' then '{"carbon": 300, "plata": 180, "hongo": 90, "amatista": 30}'::jsonb
                   when 'ruta_glaciar' then '{"hielo": 300, "escarcha": 160, "baya": 90, "zafiro": 30}'::jsonb else null end $$;

create or replace function public.mw_obra_estado(p_curso text, p_grupo smallint, p_id text, p_yo uuid)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', p_id, 'curso', p_curso, 'grupo', p_grupo, 'meta', mw_obra_meta(p_id),
    'aportes', coalesce((select aportes from obras where curso = p_curso and grupo = p_grupo and id = p_id), '{}'::jsonb),
    'completado', (select completado from obras where curso = p_curso and grupo = p_grupo and id = p_id) is not null,
    'mio', coalesce((select total from obra_aportes where curso = p_curso and grupo = p_grupo and obra = p_id and estudiante_id = p_yo), 0),
    'top', coalesce((select json_agg(x) from (select mw_nombre_corto(e.nombre) as nombre, a.total from obra_aportes a join estudiantes e on e.id = a.estudiante_id
                     where a.curso = p_curso and a.grupo = p_grupo and a.obra = p_id order by a.total desc limit 5) x), '[]'::json),
    'aportantes', (select count(*) from obra_aportes where curso = p_curso and grupo = p_grupo and obra = p_id)
  ) $$;

-- Ver una obra: el estudiante ve la de su grupo; el docente, la del curso y grupo que visita
create or replace function public.mw_obra(p_token uuid, p_id text, p_curso text, p_grupo int)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint;
begin
  if mw_obra_meta(p_id) is null then return json_build_object('ok', false); end if;
  if id_e is not null then
    select curso, grupo into c, g from estudiantes where id = id_e;
    if g is null then return json_build_object('ok', false, 'error', 'sin_grupo'); end if;
  elsif mw_sesion_docente(p_token) is not null then
    c := p_curso; g := p_grupo;
    if c is null or g is null then return json_build_object('ok', false, 'error', 'sin_grupo'); end if;
  else return json_build_object('ok', false); end if;
  return (mw_obra_estado(c, g, p_id, id_e)::jsonb || '{"ok": true}'::jsonb)::json;
end $$;

create or replace function public.mw_obra_aportar(p_token uuid, p_id text, p_recursos jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint; meta jsonb := mw_obra_meta(p_id); act jsonb; acep jsonb := '{}'::jsonb;
  k text; quiere int; falta int; dado int; suma int := 0; listo boolean;
begin
  if id_e is null or meta is null then return json_build_object('ok', false); end if;
  select curso, grupo into c, g from estudiantes where id = id_e;
  if g is null then return json_build_object('ok', false, 'error', 'sin_grupo'); end if;
  insert into obras (curso, grupo, id) values (c, g, p_id) on conflict do nothing;
  select aportes into act from obras where curso = c and grupo = g and id = p_id for update;
  if (select completado from obras where curso = c and grupo = g and id = p_id) is not null then
    return (mw_obra_estado(c, g, p_id, id_e)::jsonb || jsonb_build_object('ok', true, 'aceptado', '{}'::jsonb))::json;
  end if;
  for k in select jsonb_object_keys(meta) loop
    quiere := greatest(0, least(coalesce((p_recursos->>k)::int, 0), 500));
    falta := greatest(0, (meta->>k)::int - coalesce((act->>k)::int, 0));
    dado := least(quiere, falta);
    if dado > 0 then
      act := act || jsonb_build_object(k, coalesce((act->>k)::int, 0) + dado);
      acep := acep || jsonb_build_object(k, dado); suma := suma + dado;
    end if;
  end loop;
  listo := not exists (select 1 from jsonb_object_keys(meta) k2 where coalesce((act->>k2)::int, 0) < (meta->>k2)::int);
  update obras set aportes = act, completado = case when listo then now() else null end where curso = c and grupo = g and id = p_id;
  if suma > 0 then
    insert into obra_aportes (curso, grupo, obra, estudiante_id, total) values (c, g, p_id, id_e, suma)
      on conflict (curso, grupo, obra, estudiante_id) do update set total = obra_aportes.total + excluded.total;
  end if;
  return (mw_obra_estado(c, g, p_id, id_e)::jsonb || jsonb_build_object('ok', true, 'aceptado', acep))::json;
end $$;

-- ---------- Docente: grupos, códigos y obras de un curso ----------
create or replace function public.mw_docente_grupos(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  return (select json_object_agg(k.curso, json_build_object(
    'codigos', (select json_object_agg(grupo, codigo) from grupo_codigos where curso = k.curso),
    'miembros', (select coalesce(json_object_agg(id, grupo), '{}'::json) from estudiantes where curso = k.curso and grupo is not null),
    'obras', (select coalesce(json_object_agg(g, (select json_object_agg(o, mw_obra_estado(k.curso, g::smallint, o, null))
                from unnest(array['puente_bosque', 'montacargas_valle', 'elevador_mina', 'ruta_glaciar']) o)), '{}'::json)
              from generate_series(1, 8) g)
  )) from cursos k);
end $$;

create or replace function public.mw_docente_mover(p_token uuid, p_estudiante uuid, p_grupo int)
returns json language plpgsql security definer set search_path = public as $$
declare c text; n int;
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  select curso into c from estudiantes where id = p_estudiante;
  if c is null then return json_build_object('ok', false, 'error', 'estudiante'); end if;
  if p_grupo is not null then
    if p_grupo < 1 or p_grupo > 8 then return json_build_object('ok', false, 'error', 'grupo'); end if;
    select count(*) into n from estudiantes where curso = c and grupo = p_grupo and id <> p_estudiante;
    if n >= 6 then return json_build_object('ok', false, 'error', 'lleno'); end if;
  end if;
  update estudiantes set grupo = p_grupo, grupo_fallos = 0, grupo_bloqueo = null where id = p_estudiante;
  return json_build_object('ok', true);
end $$;

create or replace function public.mw_docente_codigos(p_token uuid, p_curso text)
returns json language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  perform mw_codigos_crear(p_curso, true);
  return mw_docente_grupos(p_token);
end $$;

-- El resumen del docente incluye el grupo de cada estudiante
create or replace function public.mw_docente_resumen(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  return (select coalesce(json_agg(json_build_object(
      'id', id, 'curso', curso, 'rut', rut, 'nombre', nombre,
      'tiene_clave', clave_hash is not null,
      'conectado', ultimo_ping > now() - interval '75 seconds',
      'ultimo', ultimo_ping, 'zona', zona, 'progreso', progreso, 'grupo', grupo
    ) order by curso, nombre), '[]'::json) from estudiantes);
end $$;

revoke all on function public.mw_codigo_nuevo(text), public.mw_codigos_crear(text, boolean), public.mw_norm_codigo(text),
  public.mw_obra_meta(text), public.mw_obra_estado(text, smallint, text, uuid) from public, anon, authenticated;
revoke all on function public.mw_grupo_estado(uuid), public.mw_grupo_unirse(uuid, text), public.mw_obra(uuid, text, text, int), public.mw_obra_aportar(uuid, text, jsonb),
  public.mw_docente_grupos(uuid), public.mw_docente_mover(uuid, uuid, int), public.mw_docente_codigos(uuid, text) from public, authenticated;
grant execute on function public.mw_grupo_estado(uuid), public.mw_grupo_unirse(uuid, text), public.mw_obra(uuid, text, text, int), public.mw_obra_aportar(uuid, text, jsonb),
  public.mw_docente_grupos(uuid), public.mw_docente_mover(uuid, uuid, int), public.mw_docente_codigos(uuid, text) to anon;
-- ===================================================================
-- Comercio entre estudiantes del mismo curso (cofre de comercio de la base)
-- Los recursos ofrecidos quedan apartados en el juego del que ofrece hasta que alguien acepta o se cancela.
-- ===================================================================
create table if not exists public.comercio (
  id bigserial primary key,
  curso text not null,
  estudiante_id uuid not null references public.estudiantes(id) on delete cascade,
  da jsonb not null,
  pide jsonb not null,
  estado text not null default 'abierta' check (estado in ('abierta', 'aceptada', 'cancelada')),
  aceptante uuid references public.estudiantes(id) on delete set null,
  cobrada boolean not null default false,
  creado timestamptz not null default now(),
  cerrado timestamptz
);
create index if not exists comercio_curso on public.comercio (curso, estado, creado desc);
alter table public.comercio enable row level security;
revoke all on public.comercio from anon, authenticated;

-- Recursos válidos: 1 a 3 tipos, nombres simples y cantidades de 1 a 200
create or replace function public.mw_recursos_ok(r jsonb) returns boolean language sql immutable as $$
  select jsonb_typeof(r) = 'object'
     and (select count(*) from jsonb_object_keys(r)) between 1 and 3
     and not exists (select 1 from jsonb_each(r) e where e.key !~ '^[a-z_]{2,20}$'
                     or case when (e.value)::text ~ '^[0-9]{1,4}$' then (e.value)::text::int not between 1 and 200 else true end) $$;

create or replace function public.mw_comercio_fila(c comercio, yo uuid) returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object('id', c.id, 'da', c.da, 'pide', c.pide, 'estado', c.estado, 'mia', c.estudiante_id = yo,
    'nombre', (select mw_nombre_corto(nombre) from estudiantes where id = c.estudiante_id),
    'aceptante', (select mw_nombre_corto(nombre) from estudiantes where id = c.aceptante),
    'creado', mw_ms_de(c.creado)) $$;

-- Mercado del curso: ofertas abiertas de los demás y las mías (abiertas o aceptadas recientes)
create or replace function public.mw_comercio_listar(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso into c from estudiantes where id = id_e;
  return json_build_object('ok', true,
    'otras', coalesce((select json_agg(mw_comercio_fila(x, id_e) order by x.creado desc) from (select * from comercio where curso = c and estado = 'abierta' and estudiante_id <> id_e order by creado desc limit 60) x), '[]'::json),
    'mias', coalesce((select json_agg(mw_comercio_fila(x, id_e) order by x.creado desc) from (select * from comercio where estudiante_id = id_e and (estado = 'abierta' or creado > now() - interval '7 days') order by creado desc limit 20) x), '[]'::json));
end $$;

create or replace function public.mw_comercio_crear(p_token uuid, p_da jsonb, p_pide jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; n int; nuevo bigint;
begin
  if id_e is null then return json_build_object('ok', false, 'error', 'sesion'); end if;
  if not mw_recursos_ok(p_da) or not mw_recursos_ok(p_pide) then return json_build_object('ok', false, 'error', 'recursos'); end if;
  select count(*) into n from comercio where estudiante_id = id_e and estado = 'abierta';
  if n >= 3 then return json_build_object('ok', false, 'error', 'limite'); end if;
  select curso into c from estudiantes where id = id_e;
  insert into comercio (curso, estudiante_id, da, pide) values (c, id_e, p_da, p_pide) returning id into nuevo;
  return json_build_object('ok', true, 'id', nuevo);
end $$;

-- Aceptar: solo una persona puede quedarse con la oferta
create or replace function public.mw_comercio_aceptar(p_token uuid, p_id bigint)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; o comercio%rowtype;
begin
  if id_e is null then return json_build_object('ok', false, 'error', 'sesion'); end if;
  select curso into c from estudiantes where id = id_e;
  update comercio set estado = 'aceptada', aceptante = id_e, cerrado = now()
    where id = p_id and estado = 'abierta' and curso = c and estudiante_id <> id_e returning * into o;
  if o.id is null then return json_build_object('ok', false, 'error', 'no_disponible'); end if;
  return json_build_object('ok', true, 'da', o.da, 'pide', o.pide, 'nombre', (select mw_nombre_corto(nombre) from estudiantes where id = o.estudiante_id));
end $$;

create or replace function public.mw_comercio_cancelar(p_token uuid, p_id bigint)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); o comercio%rowtype;
begin
  if id_e is null then return json_build_object('ok', false, 'error', 'sesion'); end if;
  update comercio set estado = 'cancelada', cerrado = now(), cobrada = true
    where id = p_id and estudiante_id = id_e and estado = 'abierta' returning * into o;
  if o.id is null then return json_build_object('ok', false, 'error', 'no_disponible'); end if;
  return json_build_object('ok', true, 'da', o.da);
end $$;

-- El que ofreció recibe lo que pidió cuando alguien aceptó (una sola vez)
create or replace function public.mw_comercio_cobrar(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); r json;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  with x as (update comercio set cobrada = true where estudiante_id = id_e and estado = 'aceptada' and not cobrada returning *)
  select coalesce(json_agg(json_build_object('id', x.id, 'pide', x.pide, 'da', x.da,
      'nombre', (select mw_nombre_corto(nombre) from estudiantes where id = x.aceptante))), '[]'::json) into r from x;
  return json_build_object('ok', true, 'cobros', r);
end $$;

revoke all on function public.mw_recursos_ok(jsonb), public.mw_comercio_fila(comercio, uuid) from public, anon, authenticated;
revoke all on function public.mw_comercio_listar(uuid), public.mw_comercio_crear(uuid, jsonb, jsonb), public.mw_comercio_aceptar(uuid, bigint),
  public.mw_comercio_cancelar(uuid, bigint), public.mw_comercio_cobrar(uuid) from public, authenticated;
grant execute on function public.mw_comercio_listar(uuid), public.mw_comercio_crear(uuid, jsonb, jsonb), public.mw_comercio_aceptar(uuid, bigint),
  public.mw_comercio_cancelar(uuid, bigint), public.mw_comercio_cobrar(uuid) to anon;

-- Obras de los mundos 2, 3 y 4: más recursos para que tomen varias clases (el puente queda igual)
create or replace function public.mw_obra_meta(p_id text) returns jsonb language sql immutable as $$
  select case p_id when 'puente_bosque' then '{"madera": 360, "piedra": 210, "agua": 90, "cristal": 24}'::jsonb
                   when 'montacargas_valle' then '{"fibra": 1000, "arenisca": 800, "cobre": 400, "oro": 120}'::jsonb
                   when 'elevador_mina' then '{"carbon": 1000, "plata": 650, "hongo": 320, "amatista": 110}'::jsonb
                   when 'ruta_glaciar' then '{"hielo": 1000, "escarcha": 560, "baya": 320, "zafiro": 110}'::jsonb else null end $$;
revoke all on function public.mw_obra_meta(text) from public, anon, authenticated;
-- Meta de cada obra según el curso: el puente de 7°B mantiene la meta original; los demás cursos piden más recursos
create or replace function public.mw_obra_meta(p_id text, p_curso text) returns jsonb language sql immutable as $$
  select case when p_id = 'puente_bosque' and coalesce(p_curso, '') <> '7B'
              then '{"madera": 1100, "piedra": 700, "agua": 320, "cristal": 80}'::jsonb
              else mw_obra_meta(p_id) end $$;

create or replace function public.mw_obra_estado(p_curso text, p_grupo smallint, p_id text, p_yo uuid)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', p_id, 'curso', p_curso, 'grupo', p_grupo, 'meta', mw_obra_meta(p_id, p_curso),
    'aportes', coalesce((select aportes from obras where curso = p_curso and grupo = p_grupo and id = p_id), '{}'::jsonb),
    'completado', (select completado from obras where curso = p_curso and grupo = p_grupo and id = p_id) is not null,
    'mio', coalesce((select total from obra_aportes where curso = p_curso and grupo = p_grupo and obra = p_id and estudiante_id = p_yo), 0),
    'top', coalesce((select json_agg(x) from (select mw_nombre_corto(e.nombre) as nombre, a.total from obra_aportes a join estudiantes e on e.id = a.estudiante_id
                     where a.curso = p_curso and a.grupo = p_grupo and a.obra = p_id order by a.total desc limit 5) x), '[]'::json),
    'aportantes', (select count(*) from obra_aportes where curso = p_curso and grupo = p_grupo and obra = p_id)
  ) $$;

create or replace function public.mw_obra_aportar(p_token uuid, p_id text, p_recursos jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint; meta jsonb; act jsonb; acep jsonb := '{}'::jsonb;
  k text; quiere int; falta int; dado int; suma int := 0; listo boolean;
begin
  if id_e is null or mw_obra_meta(p_id) is null then return json_build_object('ok', false); end if;
  select curso, grupo into c, g from estudiantes where id = id_e;
  if g is null then return json_build_object('ok', false, 'error', 'sin_grupo'); end if;
  meta := mw_obra_meta(p_id, c);
  insert into obras (curso, grupo, id) values (c, g, p_id) on conflict do nothing;
  select aportes into act from obras where curso = c and grupo = g and id = p_id for update;
  if (select completado from obras where curso = c and grupo = g and id = p_id) is not null then
    return (mw_obra_estado(c, g, p_id, id_e)::jsonb || jsonb_build_object('ok', true, 'aceptado', '{}'::jsonb))::json;
  end if;
  for k in select jsonb_object_keys(meta) loop
    quiere := greatest(0, least(coalesce((p_recursos->>k)::int, 0), 500));
    falta := greatest(0, (meta->>k)::int - coalesce((act->>k)::int, 0));
    dado := least(quiere, falta);
    if dado > 0 then
      act := act || jsonb_build_object(k, coalesce((act->>k)::int, 0) + dado);
      acep := acep || jsonb_build_object(k, dado); suma := suma + dado;
    end if;
  end loop;
  listo := not exists (select 1 from jsonb_object_keys(meta) k2 where coalesce((act->>k2)::int, 0) < (meta->>k2)::int);
  update obras set aportes = act, completado = case when listo then now() else null end where curso = c and grupo = g and id = p_id;
  if suma > 0 then
    insert into obra_aportes (curso, grupo, obra, estudiante_id, total) values (c, g, p_id, id_e, suma)
      on conflict (curso, grupo, obra, estudiante_id) do update set total = obra_aportes.total + excluded.total;
  end if;
  return (mw_obra_estado(c, g, p_id, id_e)::jsonb || jsonb_build_object('ok', true, 'aceptado', acep))::json;
end $$;
revoke all on function public.mw_obra_meta(text, text) from public, anon, authenticated;
