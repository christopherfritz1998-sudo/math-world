-- ===================================================================
-- El docente puede entrar a la base de cualquier grupo de cualquier curso (solo para mirar y acompañar).
--  * mw_docente_bases: cursos y grupos con sus integrantes y cuántos están conectados.
--  * mw_docente_base: la base de un grupo (carpa común, exterior y carpas de cada integrante), igual que mw_base.
--  * mw_docente_base_casa: el interior de la carpa de un estudiante.
-- ===================================================================
create or replace function public.mw_docente_bases(p_token uuid) returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return json_build_object('ok', false); end if;
  return json_build_object('ok', true, 'cursos', coalesce((select json_agg(x order by x.curso) from (
    select k.curso, coalesce((select json_agg(y order by y.grupo) from (
        select e.grupo, count(*) as n,
               count(*) filter (where e.ultimo_ping > now() - interval '90 seconds') as conectados,
               json_agg(mw_nombre_corto(e.nombre) order by e.nombre) as nombres
          from estudiantes e where e.curso = k.curso and e.grupo is not null group by e.grupo) y), '[]'::json) as grupos
      from cursos k) x), '[]'::json));
end $$;

create or replace function public.mw_docente_base(p_token uuid, p_curso text, p_grupo int) returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return json_build_object('ok', false); end if;
  return json_build_object('ok', true, 'yo', null,
    'comun', coalesce((select comun from bases where curso = p_curso and grupo = p_grupo), '[]'::jsonb),
    'exterior', coalesce((select exterior from bases where curso = p_curso and grupo = p_grupo), '[]'::jsonb),
    'casas', coalesce((select json_agg(json_build_object('id', e.id, 'nombre', mw_nombre_corto(e.nombre), 'casa', e.progreso->'casa',
                          'n', jsonb_array_length(coalesce(e.progreso->'pieza', '[]'::jsonb))))
                       from estudiantes e where e.curso = p_curso and e.grupo = p_grupo and e.progreso ? 'casa' and jsonb_typeof(e.progreso->'casa') = 'object'), '[]'::json));
end $$;

create or replace function public.mw_docente_base_casa(p_token uuid, p_id uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare o estudiantes;
begin
  if mw_sesion_docente(p_token) is null then return json_build_object('ok', false); end if;
  select * into o from estudiantes where id = p_id;
  if o.id is null then return json_build_object('ok', false, 'error', 'estudiante'); end if;
  return json_build_object('ok', true, 'nombre', mw_nombre_corto(o.nombre), 'pieza', coalesce(o.progreso->'pieza', '[]'::jsonb));
end $$;

revoke all on function public.mw_docente_bases(uuid), public.mw_docente_base(uuid, text, int), public.mw_docente_base_casa(uuid, uuid) from public, authenticated;
grant execute on function public.mw_docente_bases(uuid), public.mw_docente_base(uuid, text, int), public.mw_docente_base_casa(uuid, uuid) to anon;
