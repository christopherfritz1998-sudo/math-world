-- ===================================================================
-- Validación en el servidor y cofre del grupo más transparente
--  * mw_cofre_grupo2: un depósito no puede superar lo que se alcanza a recolectar en el tiempo transcurrido
--    (antes se podía sumar cualquier cantidad); si lo supera, se descarta y queda una alerta para el docente.
--    Además devuelve los últimos movimientos de los compañeros (para avisar «Ana usó 30 madera»).
--  * mw_cofre_historial: agrega cuánto aportó y cuánto usó cada integrante.
--  * mw_guardar: también revisa saltos imposibles de recursos cuando el cofre no es comunitario.
--  * mw_trotamundos (en trotamundos.sql): como máximo un golpe cada 1,2 s.
-- ===================================================================
create or replace function public.mw_cofre_grupo2(p_token uuid, p_envio bigint, p_delta jsonb, p_inicial boolean default false)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint; act jsonb; ult bigint;
  k text; v text; d int; dep bigint := 0; uso bigint := 0; limpio jsonb := '{}'::jsonb; resto int; parte int; pd pedidos%rowtype; ayude int := 0;
  seg numeric; tope bigint; positivo bigint := 0; rechazado boolean := false;
begin
  if id_e is null then return json_build_object('ok', false, 'error', 'sesion'); end if;
  select curso, grupo into c, g from estudiantes where id = id_e;
  if g is null then return json_build_object('ok', false, 'error', 'sin_grupo'); end if;
  insert into cofres_grupo (curso, grupo) values (c, g) on conflict do nothing;
  select recursos into act from cofres_grupo where curso = c and grupo = g for update;
  insert into cofre_aportes (curso, grupo, estudiante_id) values (c, g, id_e) on conflict do nothing;
  select ultimo_envio into ult from cofre_aportes where curso = c and grupo = g and estudiante_id = id_e;
  if coalesce(p_envio, 0) > ult and p_delta is not null and jsonb_typeof(p_delta) = 'object' then
    -- tope: lo que se alcanza a juntar desde el último depósito (la primera unión al cofre comunitario no tiene tope)
    select extract(epoch from now() - max(creado)) into seg from cofre_movs where curso = c and grupo = g and estudiante_id = id_e;
    tope := least(20000, 1500 + coalesce(seg, 3600) * 8)::bigint;   -- medido con los depósitos reales: ningún juego normal lo supera
    for k, v in select * from jsonb_each_text(p_delta) loop
      continue when k !~ '^[a-z_]{1,24}$' or v !~ '^-?[0-9]{1,6}$';
      if v::int > 0 then positivo := positivo + v::int; end if;
    end loop;
    if positivo > tope and not (coalesce(p_inicial, false) and ult = 0) then
      rechazado := true;
      if not exists (select 1 from alertas where estudiante_id = id_e and tipo = 'cofre' and creado > now() - interval '30 minutes') then
        insert into alertas (estudiante_id, tipo, detalle) values (id_e, 'cofre', jsonb_build_object('deposito', positivo, 'tope', tope));
      end if;
      update cofre_aportes set ultimo_envio = p_envio where curso = c and grupo = g and estudiante_id = id_e;
    end if;
  end if;
  if not rechazado and coalesce(p_envio, 0) > ult and p_delta is not null and jsonb_typeof(p_delta) = 'object' then
    for k, v in select * from jsonb_each_text(p_delta) loop
      continue when k !~ '^[a-z_]{1,24}$' or v !~ '^-?[0-9]{1,6}$';
      d := v::int;
      continue when d = 0;
      act := act || jsonb_build_object(k, greatest(0, coalesce((act->>k)::int, 0) + d));
      limpio := limpio || jsonb_build_object(k, d);
      if d > 0 then
        dep := dep + d;
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
  return json_build_object('ok', true, 'grupo', g, 'recursos', act, 'ayude', ayude, 'pedidos', mw_pedidos_info(c, g, id_e), 'rechazado', rechazado,
    'top', coalesce((select json_agg(x) from (select mw_nombre_corto(e.nombre) as nombre, a.aportado, (a.estudiante_id = id_e) as yo
                     from cofre_aportes a join estudiantes e on e.id = a.estudiante_id
                     where a.curso = c and a.grupo = g and e.grupo = g and a.aportado > 0
                     order by a.aportado desc limit 6) x), '[]'::json),
    'movs', coalesce((select json_agg(x) from (select m.id, mw_nombre_corto(e.nombre) as nombre, m.delta
                     from cofre_movs m join estudiantes e on e.id = m.estudiante_id
                     where m.curso = c and m.grupo = g and m.estudiante_id <> id_e and m.creado > now() - interval '3 minutes'
                     order by m.id desc limit 8) x), '[]'::json));
end $$;

create or replace function public.mw_cofre_historial(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso, grupo into c, g from estudiantes where id = id_e;
  if g is null then return json_build_object('ok', false, 'error', 'sin_grupo'); end if;
  return json_build_object('ok', true, 'lista', coalesce((select json_agg(x) from (
    select mw_nombre_corto(e.nombre) as nombre, m.delta, mw_ms_de(m.creado) as t, (m.estudiante_id = id_e) as yo
      from cofre_movs m join estudiantes e on e.id = m.estudiante_id
     where m.curso = c and m.grupo = g order by m.creado desc limit 15) x), '[]'::json),
    'personas', coalesce((select json_agg(x) from (
    select mw_nombre_corto(e.nombre) as nombre, a.aportado, a.usado, (a.estudiante_id = id_e) as yo
      from cofre_aportes a join estudiantes e on e.id = a.estudiante_id
     where a.curso = c and a.grupo = g and e.grupo = g and (a.aportado > 0 or a.usado > 0)
     order by a.aportado desc limit 8) x), '[]'::json),
    'ahora', mw_ms());
end $$;

create or replace function public.mw_guardar(p_token uuid, p_progreso jsonb, p_zona text)
returns boolean language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); viejo jsonb; desde timestamptz; seg numeric;
  nv int; nn int; iv numeric; inn numeric; rv numeric; rn numeric; motivo text; det jsonb;
begin
  if id_e is null then return false; end if;
  if pg_column_size(p_progreso) > 200000 then return false; end if;
  select progreso, actualizado into viejo, desde from estudiantes where id = id_e;
  begin
    if viejo is not null and viejo ? 'v' and p_progreso ? 'v' then
      seg := least(900, greatest(10, extract(epoch from now() - coalesce(desde, now() - interval '1 day'))));
      nv := coalesce((viejo->>'nivel')::numeric, 1)::int; nn := coalesce((p_progreso->>'nivel')::numeric, 1)::int;
      select coalesce(sum((value->>'i')::numeric), 0) into iv from jsonb_each(case when jsonb_typeof(viejo->'stats') = 'object' then viejo->'stats' else '{}'::jsonb end);
      select coalesce(sum((value->>'i')::numeric), 0) into inn from jsonb_each(case when jsonb_typeof(p_progreso->'stats') = 'object' then p_progreso->'stats' else '{}'::jsonb end);
      if nn - nv > 5 + seg / 60 and not (viejo->'curva2' is null and p_progreso->'curva2' is not null) then
        motivo := 'nivel'; det := jsonb_build_object('antes', nv, 'ahora', nn, 'seg', round(seg));
      elsif nn > 30 and nn - nv > 3 + (inn - iv) and not (viejo->'curva2' is null and p_progreso->'curva2' is not null) then
        -- sobre nivel 30, subir más de 3 niveles sin responder preguntas no es posible jugando
        motivo := 'nivel'; det := jsonb_build_object('antes', nv, 'ahora', nn, 'seg', round(seg));
      elsif inn - iv > 30 + seg / 2 then
        motivo := 'respuestas'; det := jsonb_build_object('antes', iv, 'ahora', inn, 'seg', round(seg));
      elsif exists (select 1 from jsonb_each(case when jsonb_typeof(p_progreso->'stats') = 'object' then p_progreso->'stats' else '{}'::jsonb end)
                    where (value->>'a')::numeric > (value->>'i')::numeric or (value->>'a')::numeric < 0) then
        motivo := 'aciertos'; det := '{}'::jsonb;
      elsif p_progreso->>'cofreGrupo' is null and viejo->>'cofreGrupo' is null then
        -- cofre propio (sin grupo): los recursos no pueden crecer más de lo que se alcanza a juntar
        select coalesce(sum(case when jsonb_typeof(value) = 'number' then (value)::text::numeric else 0 end), 0) into rv
          from (select * from jsonb_each(coalesce(viejo->'cofre', '{}'::jsonb)) union all select * from jsonb_each(coalesce(viejo->'mochila', '{}'::jsonb))) x;
        select coalesce(sum(case when jsonb_typeof(value) = 'number' then (value)::text::numeric else 0 end), 0) into rn
          from (select * from jsonb_each(coalesce(p_progreso->'cofre', '{}'::jsonb)) union all select * from jsonb_each(coalesce(p_progreso->'mochila', '{}'::jsonb))) x;
        if rn - rv > 1500 + seg * 4 then motivo := 'recursos'; det := jsonb_build_object('antes', rv, 'ahora', rn, 'seg', round(seg)); end if;
      end if;
    end if;
  exception when others then motivo := null;
  end;
  if motivo is not null then
    if not exists (select 1 from alertas where estudiante_id = id_e and tipo = motivo and creado > now() - interval '30 minutes') then
      insert into alertas (estudiante_id, tipo, detalle) values (id_e, motivo, det);
    end if;
    update estudiantes set zona = left(p_zona, 20),
      ultimo_ping = case when mw_curso_abierto(curso) then now() else ultimo_ping end where id = id_e;
    return true;
  end if;
  update estudiantes set progreso = p_progreso, zona = left(p_zona, 20), actualizado = now(),
    ultimo_ping = case when mw_curso_abierto(curso) then now() else ultimo_ping end
  where id = id_e;
  return true;
end $$;
