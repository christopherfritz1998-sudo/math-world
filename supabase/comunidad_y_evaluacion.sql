-- ===================================================================
-- (mw_cofre_grupo2 reemplaza a mw_cofre_grupo, que se mantiene para clientes antiguos; comparten el número de envío)
-- Trabajo en grupo (historial del cofre, pedidos al grupo, meta y ranking semanal de grupos)
-- y modo evaluación (ticket largo con nota)
-- ===================================================================

-- ---------- Historial del cofre y pedidos ----------
create table if not exists public.cofre_movs (
  id bigserial primary key,
  curso text not null,
  grupo smallint not null,
  estudiante_id uuid not null references public.estudiantes (id) on delete cascade,
  delta jsonb not null,
  creado timestamptz not null default now()
);
create index if not exists cofre_movs_grupo on public.cofre_movs (curso, grupo, creado desc);
create table if not exists public.pedidos (
  id bigserial primary key,
  curso text not null,
  grupo smallint not null,
  estudiante_id uuid not null references public.estudiantes (id) on delete cascade,
  recurso text not null,
  cantidad int not null,
  entregado int not null default 0,
  creado timestamptz not null default now(),
  cerrado timestamptz,
  cumplido boolean not null default false
);
create index if not exists pedidos_grupo on public.pedidos (curso, grupo, creado);
create table if not exists public.pedido_ayudas (
  pedido_id bigint not null references public.pedidos (id) on delete cascade,
  estudiante_id uuid not null references public.estudiantes (id) on delete cascade,
  n int not null default 0,
  primary key (pedido_id, estudiante_id)
);
alter table public.cofre_movs enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_ayudas enable row level security;
revoke all on public.cofre_movs, public.pedidos, public.pedido_ayudas from anon, authenticated;

-- Pedidos abiertos del grupo y los cerrados en los últimos 3 días
create or replace function public.mw_pedidos_info(c text, g smallint, yo uuid) returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(x order by x.cerrado nulls first, x.id), '[]'::json) from (
    select p.id, mw_nombre_corto(e.nombre) as nombre, p.recurso, p.cantidad, p.entregado, p.cumplido,
           (p.estudiante_id = yo) as mio, case when p.cerrado is null then null else mw_ms_de(p.cerrado) end as cerrado,
           coalesce((select n from pedido_ayudas a where a.pedido_id = p.id and a.estudiante_id = yo), 0) as ayude,
           (select coalesce(json_agg(mw_nombre_corto(e2.nombre) order by a2.n desc), '[]'::json) from pedido_ayudas a2 join estudiantes e2 on e2.id = a2.estudiante_id where a2.pedido_id = p.id) as ayudantes
      from pedidos p join estudiantes e on e.id = p.estudiante_id
     where p.curso = c and p.grupo = g and (p.cerrado is null or p.cerrado > now() - interval '3 days')
     order by p.id desc limit 12) x
$$;

create or replace function public.mw_cofre_grupo2(p_token uuid, p_envio bigint, p_delta jsonb, p_inicial boolean default false)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint; act jsonb; ult bigint;
  k text; v text; d int; dep bigint := 0; uso bigint := 0; limpio jsonb := '{}'::jsonb; resto int; parte int; pd pedidos%rowtype; ayude int := 0;
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
      continue when d = 0;
      act := act || jsonb_build_object(k, greatest(0, coalesce((act->>k)::int, 0) + d));
      limpio := limpio || jsonb_build_object(k, d);
      if d > 0 then
        dep := dep + d;
        -- lo depositado completa los pedidos abiertos del grupo (el más antiguo primero)
        if not coalesce(p_inicial, false) then
          resto := d;
          for pd in select * from pedidos where curso = c and grupo = g and recurso = k and cerrado is null order by creado for update loop
            exit when resto <= 0;
            parte := least(resto, pd.cantidad - pd.entregado);
            continue when parte <= 0;
            update pedidos set entregado = entregado + parte,
              cerrado = case when entregado + parte >= cantidad then now() else null end,
              cumplido = (entregado + parte >= cantidad) where id = pd.id;
            if pd.estudiante_id <> id_e then
              insert into pedido_ayudas (pedido_id, estudiante_id, n) values (pd.id, id_e, parte)
                on conflict (pedido_id, estudiante_id) do update set n = pedido_ayudas.n + parte;
              ayude := ayude + parte;
            end if;
            resto := resto - parte;
          end loop;
        end if;
      else uso := uso - d; end if;
    end loop;
    update cofres_grupo set recursos = act, actualizado = now() where curso = c and grupo = g;
    update cofre_aportes set aportado = aportado + dep, usado = usado + uso, ultimo_envio = p_envio
     where curso = c and grupo = g and estudiante_id = id_e;
    if limpio <> '{}'::jsonb then
      insert into cofre_movs (curso, grupo, estudiante_id, delta) values (c, g, id_e, limpio);
    end if;
    if random() < 0.02 then
      delete from cofre_movs where creado < now() - interval '21 days';
      delete from pedidos where cerrado < now() - interval '14 days';
    end if;
  end if;
  return json_build_object('ok', true, 'grupo', g, 'recursos', act, 'ayude', ayude, 'pedidos', mw_pedidos_info(c, g, id_e),
    'top', coalesce((select json_agg(x) from (select mw_nombre_corto(e.nombre) as nombre, a.aportado, (a.estudiante_id = id_e) as yo
                     from cofre_aportes a join estudiantes e on e.id = a.estudiante_id
                     where a.curso = c and a.grupo = g and e.grupo = g and a.aportado > 0
                     order by a.aportado desc limit 6) x), '[]'::json));
end $$;

-- Crear o cancelar un pedido al grupo
create or replace function public.mw_pedido(p_token uuid, p_accion text, p_recurso text, p_cantidad int, p_id bigint)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint;
begin
  if id_e is null then return json_build_object('ok', false, 'error', 'sesion'); end if;
  select curso, grupo into c, g from estudiantes where id = id_e;
  if g is null then return json_build_object('ok', false, 'error', 'sin_grupo'); end if;
  if p_accion = 'crear' then
    if coalesce(p_recurso, '') !~ '^[a-z_]{1,24}$' or coalesce(p_cantidad, 0) < 5 or p_cantidad > 200 then
      return json_build_object('ok', false, 'error', 'datos'); end if;
    if (select count(*) from pedidos where estudiante_id = id_e and cerrado is null) >= 2 then
      return json_build_object('ok', false, 'error', 'limite'); end if;
    if (select count(*) from pedidos where curso = c and grupo = g and cerrado is null) >= 6 then
      return json_build_object('ok', false, 'error', 'lleno'); end if;
    insert into pedidos (curso, grupo, estudiante_id, recurso, cantidad) values (c, g, id_e, p_recurso, p_cantidad);
  elsif p_accion = 'cancelar' then
    update pedidos set cerrado = now(), cumplido = false where id = p_id and estudiante_id = id_e and cerrado is null;
  end if;
  return json_build_object('ok', true, 'pedidos', mw_pedidos_info(c, g, id_e));
end $$;

-- Últimos movimientos del cofre del grupo
create or replace function public.mw_cofre_historial(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso, grupo into c, g from estudiantes where id = id_e;
  if g is null then return json_build_object('ok', false, 'error', 'sin_grupo'); end if;
  return json_build_object('ok', true, 'lista', coalesce((select json_agg(x) from (
    select mw_nombre_corto(e.nombre) as nombre, m.delta, mw_ms_de(m.creado) as t, (m.estudiante_id = id_e) as yo
      from cofre_movs m join estudiantes e on e.id = m.estudiante_id
     where m.curso = c and m.grupo = g order by m.creado desc limit 15) x), '[]'::json), 'ahora', mw_ms());
end $$;

-- ---------- Meta semanal de cada grupo y ranking de grupos del curso ----------
-- Usa las respuestas correctas de la semana (aportes_semana) de los integrantes actuales de cada grupo.
create or replace function public.mw_grupos_semana(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint; s text := mw_semana_actual();
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso, grupo into c, g from estudiantes where id = id_e;
  return json_build_object('ok', true, 'semana', s, 'grupo', g, 'ranking', coalesce((select json_agg(x order by x.prom desc, x.total desc) from (
    select e.grupo, coalesce(cl.nombre, 'Grupo ' || e.grupo) as nombre, count(*)::int as miembros,
           coalesce(sum(a.n), 0)::int as total, round(coalesce(sum(a.n), 0)::numeric / count(*), 1) as prom,
           50 * count(*)::int as meta, (e.grupo = g) as yo
      from estudiantes e
      left join aportes_semana a on a.estudiante_id = e.id and a.semana = s
      left join clanes cl on cl.curso = e.curso and cl.grupo = e.grupo
     where e.curso = c and e.grupo is not null
     group by e.grupo, cl.nombre) x), '[]'::json));
end $$;

-- ---------- Modo evaluación: ticket largo (hasta 20 preguntas y 90 minutos) con nota ----------
alter table public.tickets add column if not exists examen boolean not null default false;

create or replace function public.mw_docente_tickets(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  return json_build_object('ahora', mw_ms(), 'cursos', coalesce((select json_object_agg(t.curso, json_build_object(
      'id', t.id, 'temas', t.temas, 'titulos', t.titulos, 'n', t.n, 'hasta', t.hasta, 'creado', mw_ms_de(t.creado), 'examen', t.examen,
      'activo', t.activo and t.hasta > mw_ms(),
      'respuestas', (select coalesce(json_agg(json_build_object('id', e.id, 'nombre', e.nombre, 'aciertos', r.aciertos, 'total', r.total, 'detalle', r.detalle) order by e.nombre), '[]'::json)
                     from ticket_respuestas r join estudiantes e on e.id = r.estudiante_id where r.ticket_id = t.id)))
    from (select distinct on (curso) * from tickets order by curso, creado desc) t), '{}'::json));
end $$;

create or replace function public.mw_docente_ticket(p_token uuid, p_cursos text[], p_ticket jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare c text; ex boolean := coalesce((p_ticket->>'examen')::boolean, false);
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  update tickets set activo = false where curso = any (p_cursos) and activo;
  if p_ticket is not null and jsonb_array_length(coalesce(p_ticket->'temas', '[]'::jsonb)) > 0 then
    foreach c in array p_cursos loop
      insert into tickets (curso, temas, titulos, n, hasta, examen)
      values (c, p_ticket->'temas', coalesce(p_ticket->'titulos', '[]'::jsonb),
              least(greatest(coalesce((p_ticket->>'n')::int, 3), 1), case when ex then 20 else 5 end),
              mw_ms() + 60000 * least(greatest(coalesce((p_ticket->>'min')::int, 15), 3), case when ex then 90 else 60 end), ex);
    end loop;
  end if;
  return mw_docente_tickets(p_token);
end $$;

create or replace function public.mw_ticket_responder(p_token uuid, p_id bigint, p_aciertos int, p_total int, p_detalle jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; t tickets;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso into c from estudiantes where id = id_e;
  select * into t from tickets where id = p_id;
  if t.id is null or t.curso <> c then return json_build_object('ok', false); end if;
  insert into ticket_respuestas (ticket_id, estudiante_id, aciertos, total, detalle)
  values (p_id, id_e, least(greatest(coalesce(p_aciertos, 0), 0), t.n), least(greatest(coalesce(p_total, 1), 1), t.n),
          case when jsonb_typeof(p_detalle) = 'array' and jsonb_array_length(p_detalle) <= 20 then p_detalle else null end)
  on conflict do nothing;
  return json_build_object('ok', true);
end $$;

create or replace function public.mw_extra(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; f jsonb;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso into c from estudiantes where id = id_e;
  select foco into f from cursos where curso = c;
  if f is not null and (f->>'hasta')::bigint < mw_ms() then f := null; end if;
  return json_build_object('ok', true, 'foco', f,
    'refuerzo', (select json_build_object('id', id, 'tema', tema, 'titulo', titulo, 'meta', meta) from refuerzos
                 where estudiante_id = id_e and completado is null order by creado desc limit 1),
    'ticket', (select json_build_object('id', t.id, 'temas', t.temas, 'titulos', t.titulos, 'n', t.n, 'hasta', t.hasta, 'examen', t.examen) from tickets t
               where t.curso = c and t.activo and t.hasta > mw_ms()
                 and not exists (select 1 from ticket_respuestas r where r.ticket_id = t.id and r.estudiante_id = id_e)
               order by t.creado desc limit 1),
    'semana', mw_semana_info(c, id_e));
end $$;

revoke all on function public.mw_pedidos_info(text, smallint, uuid) from public, anon, authenticated;
revoke all on function public.mw_cofre_grupo2(uuid, bigint, jsonb, boolean), public.mw_pedido(uuid, text, text, int, bigint),
  public.mw_cofre_historial(uuid), public.mw_grupos_semana(uuid) from public, authenticated;
grant execute on function public.mw_cofre_grupo2(uuid, bigint, jsonb, boolean), public.mw_pedido(uuid, text, text, int, bigint),
  public.mw_cofre_historial(uuid), public.mw_grupos_semana(uuid) to anon;
