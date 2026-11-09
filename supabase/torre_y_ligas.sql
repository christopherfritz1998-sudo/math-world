-- ===================================================================
-- Torre de los Dioses (ranking semanal por curso) y ligas semanales
-- Solo se muestran nombres cortos (nombre + inicial) a los compañeros del mismo curso.
-- ===================================================================
create table if not exists public.torre_semana (
  estudiante_id uuid not null references public.estudiantes (id) on delete cascade,
  semana text not null,
  piso int not null default 0,
  actualizado timestamptz not null default now(),
  primary key (estudiante_id, semana)
);
alter table public.torre_semana enable row level security;
revoke all on public.torre_semana from anon, authenticated;

create or replace function public.mw_torre_registrar(p_token uuid, p_piso int) returns json
language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); s text := mw_semana_actual(); k int := least(greatest(coalesce(p_piso, 0), 0), 500);
begin
  if id_e is null then return json_build_object('ok', false); end if;
  insert into torre_semana (estudiante_id, semana, piso) values (id_e, s, k)
    on conflict (estudiante_id, semana) do update set piso = greatest(torre_semana.piso, excluded.piso), actualizado = now();
  return json_build_object('ok', true);
end $$;

create or replace function public.mw_torre_ranking(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; s text := mw_semana_actual();
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso into c from estudiantes where id = id_e;
  return json_build_object('ok', true, 'semana', s, 'lista', coalesce((select json_agg(x) from (
    select mw_nombre_corto(e.nombre) as nombre, t.piso, e.id = id_e as yo
    from torre_semana t join estudiantes e on e.id = t.estudiante_id
    where e.curso = c and t.semana = s and t.piso > 0 order by t.piso desc, t.actualizado asc limit 10) x), '[]'::json));
end $$;

-- Ligas: aciertos de esta semana y de la anterior (de la misión semanal) y la liga guardada en el progreso
create or replace function public.mw_liga(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; s text := mw_semana_actual();
  sa text := to_char((now() - interval '7 days') at time zone 'America/Santiago', 'IYYY-"S"IW');
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso into c from estudiantes where id = id_e;
  return json_build_object('ok', true, 'semana', s, 'lista', coalesce((select json_agg(x) from (
    select mw_nombre_corto(e.nombre) as nombre, e.id = id_e as yo,
      coalesce((e.progreso->'liga'->>'tier')::int, 0) as tier,
      coalesce((select n from aportes_semana a where a.estudiante_id = e.id and a.semana = s), 0) as n,
      coalesce((select n from aportes_semana a where a.estudiante_id = e.id and a.semana = sa), 0) as anterior
    from estudiantes e where e.curso = c and e.progreso is not null) x), '[]'::json));
end $$;

revoke all on function public.mw_torre_registrar(uuid, int), public.mw_torre_ranking(uuid), public.mw_liga(uuid) from public, authenticated;
grant execute on function public.mw_torre_registrar(uuid, int), public.mw_torre_ranking(uuid), public.mw_liga(uuid) to anon;
