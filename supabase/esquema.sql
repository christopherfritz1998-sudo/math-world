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
