-- ===================================================================
-- Cofre comunitario por grupo: todos los integrantes de un grupo comparten un solo cofre en su base.
-- Cada cliente envía solo la diferencia (lo que depositó o gastó desde la última sincronización) con un
-- número de envío creciente: si el mismo envío llega dos veces (reintento o partida recargada), se aplica una sola vez.
-- ===================================================================
create table if not exists public.cofres_grupo (
  curso text not null,
  grupo smallint not null,
  recursos jsonb not null default '{}'::jsonb,
  actualizado timestamptz not null default now(),
  primary key (curso, grupo)
);
create table if not exists public.cofre_aportes (
  curso text not null,
  grupo smallint not null,
  estudiante_id uuid not null references public.estudiantes(id) on delete cascade,
  aportado bigint not null default 0,
  usado bigint not null default 0,
  ultimo_envio bigint not null default 0,
  primary key (curso, grupo, estudiante_id)
);
alter table public.cofres_grupo enable row level security;
alter table public.cofre_aportes enable row level security;
revoke all on public.cofres_grupo, public.cofre_aportes from anon, authenticated;

create or replace function public.mw_cofre_grupo(p_token uuid, p_envio bigint, p_delta jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint; act jsonb; ult bigint;
  k text; v text; d int; dep bigint := 0; uso bigint := 0;
begin
  if id_e is null then return json_build_object('ok', false, 'error', 'sesion'); end if;
  select curso, grupo into c, g from estudiantes where id = id_e;
  if g is null then return json_build_object('ok', false, 'error', 'sin_grupo'); end if;
  insert into cofres_grupo (curso, grupo) values (c, g) on conflict do nothing;
  select recursos into act from cofres_grupo where curso = c and grupo = g for update;
  insert into cofre_aportes (curso, grupo, estudiante_id) values (c, g, id_e) on conflict do nothing;
  select ultimo_envio into ult from cofre_aportes where curso = c and grupo = g and estudiante_id = id_e;
  if coalesce(p_envio, 0) > ult and p_delta is not null and jsonb_typeof(p_delta) = 'object' then
    for k, v in select * from jsonb_each_text(p_delta) loop
      continue when k !~ '^[a-z_]{1,24}$' or v !~ '^-?[0-9]{1,6}$';
      d := v::int;
      act := act || jsonb_build_object(k, greatest(0, coalesce((act->>k)::int, 0) + d));
      if d > 0 then dep := dep + d; else uso := uso - d; end if;
    end loop;
    update cofres_grupo set recursos = act, actualizado = now() where curso = c and grupo = g;
    update cofre_aportes set aportado = aportado + dep, usado = usado + uso, ultimo_envio = p_envio
     where curso = c and grupo = g and estudiante_id = id_e;
  end if;
  return json_build_object('ok', true, 'grupo', g, 'recursos', act,
    'top', coalesce((select json_agg(x) from (select mw_nombre_corto(e.nombre) as nombre, a.aportado, (a.estudiante_id = id_e) as yo
                     from cofre_aportes a join estudiantes e on e.id = a.estudiante_id
                     where a.curso = c and a.grupo = g and e.grupo = g and a.aportado > 0
                     order by a.aportado desc limit 6) x), '[]'::json));
end $$;
revoke all on function public.mw_cofre_grupo(uuid, bigint, jsonb) from public, authenticated;
grant execute on function public.mw_cofre_grupo(uuid, bigint, jsonb) to anon;
