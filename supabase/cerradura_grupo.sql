-- ===================================================================
-- Cerradura cooperativa de la base: cada día el grupo tiene una cerradura con hasta 4 partes.
-- Cada integrante resuelve una parte distinta (si el grupo es más chico que las partes, alguien puede resolver otra).
-- Cuando todas las partes están resueltas, la cerradura se abre para todo el grupo.
-- ===================================================================
create table if not exists public.cerraduras (
  curso text not null,
  grupo smallint not null,
  dia text not null,
  partes jsonb not null default '{}'::jsonb,   -- { "0": { "id": uuid, "nombre": "Ana P." }, ... }
  primary key (curso, grupo, dia)
);
alter table public.cerraduras enable row level security;
revoke all on public.cerraduras from anon, authenticated;

create or replace function public.mw_cerradura(p_token uuid, p_parte int)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint; d text := to_char(now() at time zone 'America/Santiago', 'YYYY-MM-DD');
  miembros int; n int; pt jsonb; mias int; nom text;
begin
  if id_e is null then return json_build_object('ok', false, 'error', 'sesion'); end if;
  select curso, grupo, mw_nombre_corto(nombre) into c, g, nom from estudiantes where id = id_e;
  if g is null then return json_build_object('ok', false, 'error', 'sin_grupo'); end if;
  select count(*) into miembros from estudiantes where curso = c and grupo = g;
  n := least(4, greatest(2, miembros));
  insert into cerraduras (curso, grupo, dia) values (c, g, d) on conflict do nothing;
  select partes into pt from cerraduras where curso = c and grupo = g and dia = d for update;
  if p_parte is not null then
    if p_parte < 0 or p_parte >= n then return json_build_object('ok', false, 'error', 'parte'); end if;
    if pt ? p_parte::text then return json_build_object('ok', false, 'error', 'resuelta', 'partes', pt, 'n', n, 'dia', d); end if;
    select count(*) into mias from jsonb_each(pt) x where x.value->>'id' = id_e::text;
    -- una parte por integrante, salvo que el grupo tenga menos integrantes que partes por resolver
    if mias >= 1 and miembros >= n then return json_build_object('ok', false, 'error', 'ya_resolviste', 'partes', pt, 'n', n, 'dia', d); end if;
    pt := pt || jsonb_build_object(p_parte::text, jsonb_build_object('id', id_e, 'nombre', nom));
    update cerraduras set partes = pt where curso = c and grupo = g and dia = d;
  end if;
  return json_build_object('ok', true, 'dia', d, 'n', n, 'grupo', g, 'curso', c, 'miembros', miembros,
    'partes', (select coalesce(jsonb_object_agg(k, jsonb_build_object('nombre', v->>'nombre', 'yo', (v->>'id') = id_e::text)), '{}'::jsonb) from jsonb_each(pt) as x(k, v)));
end $$;

revoke all on function public.mw_cerradura(uuid, int) from public, authenticated;
grant execute on function public.mw_cerradura(uuid, int) to anon;
