-- ===================================================================
-- Revisión del 17-11-2026 (idempotente: se puede ejecutar más de una vez).
-- Este archivo no contiene datos de estudiantes ni claves.
--
-- BLOQUE A · Seguridad y datos de estudiantes
--  A1. mw_estudiante_estado ya no entrega nombre ni curso; límite de consultas fallidas por nivel;
--      el primer ingreso (crear la clave) exige un código de 6 caracteres por estudiante que ve el docente
--      y que se renueva al restablecer la clave.
--  A2. mw_guardar exige 'v', valida tipos antes de calcular, agrega topes acumulados por hora y devuelve
--      false cuando rechaza (null si hubo un error interno: no se toca lo guardado).
--  A3. mw_cofre_grupo2 valida lo compartido contra el cofre personal que el servidor tiene guardado.
--  A4. El buzón marca (no borra) mensajes con insultos o con nombres de compañeros del curso.
-- ===================================================================

-- ---------- A1. Código de primer ingreso ----------
-- 6 caracteres sin los que se confunden (0/O, 1/I/L)
create or replace function public.mw_codigo6() returns text
language sql volatile set search_path = public, extensions as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + (get_byte(b, i) % 31), 1), '')
  from (select extensions.gen_random_bytes(6) as b) s, generate_series(0, 5) i;
$$;
revoke all on function public.mw_codigo6() from public, anon, authenticated;

alter table public.estudiantes add column if not exists codigo_ingreso text;
alter table public.estudiantes alter column codigo_ingreso set default public.mw_codigo6();
update public.estudiantes set codigo_ingreso = public.mw_codigo6() where clave_hash is null and codigo_ingreso is null;

-- Consultas fallidas (RUT que no está, código incorrecto): máximo 10 por minuto en cada nivel
create table if not exists public.intentos_ingreso (
  id bigserial primary key,
  nivel text not null,
  creado timestamptz not null default now()
);
create index if not exists intentos_ingreso_nivel on public.intentos_ingreso (nivel, creado);
alter table public.intentos_ingreso enable row level security;
revoke all on public.intentos_ingreso from anon, authenticated;

create or replace function public.mw_ingreso_limitado(p_nivel text) returns boolean
language sql stable security definer set search_path = public as $$
  select count(*) >= 10 from intentos_ingreso where nivel = coalesce(p_nivel, '') and creado > now() - interval '1 minute';
$$;
create or replace function public.mw_ingreso_fallido(p_nivel text) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into intentos_ingreso (nivel) values (left(coalesce(p_nivel, ''), 2));
  if random() < 0.05 then delete from intentos_ingreso where creado < now() - interval '1 day'; end if;
end $$;
revoke all on function public.mw_ingreso_limitado(text), public.mw_ingreso_fallido(text) from public, anon, authenticated;

-- Solo lo mínimo para la pantalla de ingreso: si existe, si ya tiene clave y si su curso está abierto
create or replace function public.mw_estudiante_estado(p_rut text, p_nivel text)
returns json language plpgsql security definer set search_path = public as $$
declare e estudiantes;
begin
  if mw_ingreso_limitado(p_nivel) then return json_build_object('existe', false, 'error', 'espera'); end if;
  select * into e from estudiantes where rut = mw_rut(p_rut) and left(curso, 1) = p_nivel;
  if not found then
    perform mw_ingreso_fallido(p_nivel);
    return json_build_object('existe', false);
  end if;
  return json_build_object('existe', true, 'tiene_clave', e.clave_hash is not null, 'abierto', mw_curso_abierto(e.curso));
end $$;

-- Entrar. La primera vez (sin clave) exige el código de primer ingreso que entrega el docente.
drop function if exists public.mw_estudiante_entrar(text, text, text);
create or replace function public.mw_estudiante_entrar(p_rut text, p_nivel text, p_clave text, p_codigo text default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare e estudiantes; t uuid;
begin
  if mw_ingreso_limitado(p_nivel) then return json_build_object('ok', false, 'error', 'espera'); end if;
  select * into e from estudiantes where rut = mw_rut(p_rut) and left(curso, 1) = p_nivel;
  if not found then
    perform mw_ingreso_fallido(p_nivel);
    return json_build_object('ok', false, 'error', 'no_esta');
  end if;
  if not mw_curso_abierto(e.curso) then return json_build_object('ok', false, 'error', 'cerrado'); end if;
  if e.bloqueado_hasta is not null and e.bloqueado_hasta > now() then
    return json_build_object('ok', false, 'error', 'bloqueado');
  end if;
  if e.clave_hash is null then
    if e.codigo_ingreso is null then
      update estudiantes set codigo_ingreso = mw_codigo6() where id = e.id;
      return json_build_object('ok', false, 'error', 'codigo');
    end if;
    if upper(regexp_replace(coalesce(p_codigo, ''), '\s', '', 'g')) <> e.codigo_ingreso then
      perform mw_ingreso_fallido(p_nivel);
      update estudiantes set fallos = fallos + 1,
        bloqueado_hasta = case when fallos + 1 >= 5 then now() + interval '10 minutes' else null end
      where id = e.id;
      return json_build_object('ok', false, 'error', 'codigo');
    end if;
    if length(coalesce(p_clave, '')) < 4 then return json_build_object('ok', false, 'error', 'clave_corta'); end if;
    update estudiantes set clave_hash = crypt(p_clave, gen_salt('bf')), codigo_ingreso = null, fallos = 0, bloqueado_hasta = null where id = e.id;
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
revoke all on function public.mw_estudiante_entrar(text, text, text, text) from public, authenticated;
grant execute on function public.mw_estudiante_entrar(text, text, text, text) to anon;

-- Restablecer la clave también renueva el código de primer ingreso
create or replace function public.mw_docente_restablecer(p_token uuid, p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return false; end if;
  update estudiantes set clave_hash = null, codigo_ingreso = mw_codigo6(), fallos = 0, bloqueado_hasta = null where id = p_id;
  update sesiones set expira = now() where estudiante_id = p_id and expira > now();
  return true;
end $$;

-- Códigos de primer ingreso de quienes aún no crean su clave (solo el docente)
create or replace function public.mw_docente_codigos_ingreso(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  update estudiantes set codigo_ingreso = mw_codigo6() where clave_hash is null and codigo_ingreso is null;
  return coalesce((select json_agg(x) from (
    select id, curso, nombre, codigo_ingreso as codigo from estudiantes
     where clave_hash is null and curso <> 'INV' order by curso, nombre) x), '[]'::json);
end $$;
revoke all on function public.mw_docente_codigos_ingreso(uuid) from public, authenticated;
grant execute on function public.mw_docente_codigos_ingreso(uuid) to anon;

-- ---------- A2. Guardado ----------
-- Experiencia total acumulada (misma curva que juego.js: xpPara(n) = min(620, 60 + 40 n))
create or replace function public.mw_xp_total(p_nivel numeric, p_xp numeric) returns numeric
language sql immutable as $$
  select coalesce(p_xp, 0) + coalesce((select sum(least(620, 60 + 40 * n)) from generate_series(1, least(500, greatest(0, coalesce(p_nivel, 1)::int - 1))) n), 0);
$$;

-- ¿El progreso tiene la forma esperada? (se revisa antes de hacer cuentas con él)
create or replace function public.mw_progreso_valido(p jsonb) returns boolean
language plpgsql immutable as $$
declare x record;
begin
  if p is null or jsonb_typeof(p) <> 'object' or not p ? 'v' or jsonb_typeof(p->'v') <> 'number' then return false; end if;
  if coalesce(jsonb_typeof(p->'nivel'), 'number') <> 'number' or coalesce(jsonb_typeof(p->'xp'), 'number') <> 'number' then return false; end if;
  if coalesce(jsonb_typeof(p->'stats'), 'object') <> 'object' then return false; end if;
  for x in select * from jsonb_each(coalesce(p->'stats', '{}'::jsonb)) loop
    if jsonb_typeof(x.value) <> 'object'
       or coalesce(jsonb_typeof(x.value->'i'), 'number') <> 'number'
       or coalesce(jsonb_typeof(x.value->'a'), 'number') <> 'number' then return false; end if;
  end loop;
  -- recursos: números (un null aparece si el juego produjo NaN; se cuenta como 0)
  if coalesce(jsonb_typeof(p->'cofre'), 'object') <> 'object' or coalesce(jsonb_typeof(p->'mochila'), 'object') <> 'object'
     or coalesce(jsonb_typeof(p->'donPend'), 'object') <> 'object' or coalesce(jsonb_typeof(p->'cofreEnv'), 'null') not in ('object', 'null') then return false; end if;
  if exists (select 1 from (
      select value from jsonb_each(coalesce(p->'cofre', '{}'::jsonb))
      union all select value from jsonb_each(coalesce(p->'mochila', '{}'::jsonb))
      union all select value from jsonb_each(coalesce(p->'donPend', '{}'::jsonb))
      union all select value from jsonb_each(case when jsonb_typeof(p->'cofreEnv'->'don') = 'object' then p->'cofreEnv'->'don' else '{}'::jsonb end)) r
    where jsonb_typeof(value) not in ('number', 'null')) then return false; end if;
  return true;
end $$;

-- Valor numérico de un recurso (null o ausente = 0); se usa solo con progreso ya validado
create or replace function public.mw_num(j jsonb) returns numeric
language sql immutable as $$ select case when jsonb_typeof(j) = 'number' then j::text::numeric else 0 end $$;

-- Recursos que el estudiante tiene: cofre personal + mochila + lo compartido que aún no llega al cofre del grupo
create or replace function public.mw_recursos_total(p jsonb) returns numeric
language sql immutable as $$
  select coalesce(sum(mw_num(value)), 0) from (
    select value from jsonb_each(case when jsonb_typeof(p->'cofre') = 'object' then p->'cofre' else '{}'::jsonb end)
    union all select value from jsonb_each(case when jsonb_typeof(p->'mochila') = 'object' then p->'mochila' else '{}'::jsonb end)
    union all select value from jsonb_each(case when jsonb_typeof(p->'donPend') = 'object' then p->'donPend' else '{}'::jsonb end)
    union all select value from jsonb_each(case when jsonb_typeof(p->'cofreEnv'->'don') = 'object' then p->'cofreEnv'->'don' else '{}'::jsonb end)) r;
$$;
create or replace function public.mw_respuestas(p jsonb) returns numeric
language sql immutable as $$
  select coalesce(sum(mw_num(value->'i')), 0) from jsonb_each(case when jsonb_typeof(p->'stats') = 'object' then p->'stats' else '{}'::jsonb end);
$$;

create or replace function public.mw_alertar(p_id uuid, p_tipo text, p_det jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from alertas where estudiante_id = p_id and tipo = p_tipo and creado > now() - interval '30 minutes') then
    insert into alertas (estudiante_id, tipo, detalle) values (p_id, p_tipo, coalesce(p_det, '{}'::jsonb));
  end if;
end $$;
revoke all on function public.mw_alertar(uuid, text, jsonb) from public, anon, authenticated;

-- Línea base de cada hora: los topes se comparan contra ella, no solo contra el guardado anterior
alter table public.estudiantes add column if not exists base_t timestamptz;
alter table public.estudiantes add column if not exists base_xp numeric;
alter table public.estudiantes add column if not exists base_resp numeric;
alter table public.estudiantes add column if not exists base_rec numeric;

-- Progreso guardado en el servidor (para volver a él cuando se rechaza un guardado)
create or replace function public.mw_progreso(p_token uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token);
begin
  if id_e is null then return null; end if;
  return (select progreso from estudiantes where id = id_e);
end $$;
revoke all on function public.mw_progreso(uuid) from public, authenticated;
grant execute on function public.mw_progreso(uuid) to anon;

-- Devuelve true si guardó, false si la sesión no vale o el guardado fue rechazado (queda alerta para el docente),
-- y null si hubo un error interno (no se toca lo guardado; el juego reintenta).
-- Topes, calibrados con lo medido en ajuste_trineo.sql (9,2 de experiencia por pregunta en la mediana, 11,9 en el p75):
--   por guardado (como antes): niveles 5 + 1 por minuto; respuestas 30 + 1 cada 2 s; recursos 1.500 + 4 por segundo.
--   por hora (línea base): respuestas 60 + 1 cada 3 s; experiencia 1.500 + 30 por respuesta (≈ 2,5 veces el p75,
--   para cubrir eventos x2, reliquias, jefes y los minijuegos del día); recursos 4.000 + 6 por segundo.
create or replace function public.mw_guardar(p_token uuid, p_progreso jsonb, p_zona text)
returns boolean language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); viejo jsonb; desde timestamptz; seg numeric; t numeric;
  bt timestamptz; bxp numeric; bresp numeric; brec numeric;
  nv int; nn int; xn numeric; iv numeric; inn numeric; rv numeric; rn numeric; motivo text; det jsonb;
  migra boolean; aplica_rec boolean;
begin
  if id_e is null then return false; end if;
  if pg_column_size(p_progreso) > 200000 then return false; end if;
  if not mw_progreso_valido(p_progreso) then
    perform mw_alertar(id_e, 'formato', jsonb_build_object('v', coalesce(p_progreso ? 'v', false)));
    return false;
  end if;
  begin
    select progreso, actualizado, base_t, base_xp, base_resp, base_rec into viejo, desde, bt, bxp, bresp, brec from estudiantes where id = id_e;
    migra := viejo->'curva2' is null and p_progreso->'curva2' is not null;
    nn := floor(mw_num(p_progreso->'nivel'))::int; if nn < 1 then nn := 1; end if;
    xn := mw_xp_total(nn, mw_num(p_progreso->'xp'));
    inn := mw_respuestas(p_progreso);
    rn := mw_recursos_total(p_progreso);
    if viejo is not null and mw_progreso_valido(viejo) then
      seg := least(900, greatest(10, extract(epoch from now() - coalesce(desde, now() - interval '1 day'))));
      nv := greatest(1, floor(mw_num(viejo->'nivel'))::int);
      iv := mw_respuestas(viejo);
      aplica_rec := (p_progreso->>'cofreGrupo' is null and viejo->>'cofreGrupo' is null) or (p_progreso ? 'cofreV2' and viejo ? 'cofreV2');
      if nn - nv > 5 + seg / 60 and not migra then
        motivo := 'nivel'; det := jsonb_build_object('antes', nv, 'ahora', nn, 'seg', round(seg));
      elsif nn > 30 and nn - nv > 3 + (inn - iv) and not migra then
        motivo := 'nivel'; det := jsonb_build_object('antes', nv, 'ahora', nn, 'seg', round(seg));
      elsif inn - iv > 30 + seg / 2 then
        motivo := 'respuestas'; det := jsonb_build_object('antes', iv, 'ahora', inn, 'seg', round(seg));
      elsif exists (select 1 from jsonb_each(coalesce(p_progreso->'stats', '{}'::jsonb))
                    where mw_num(value->'a') > mw_num(value->'i') or mw_num(value->'a') < 0) then
        motivo := 'aciertos'; det := '{}'::jsonb;
      elsif aplica_rec then
        rv := mw_recursos_total(viejo);
        if rn - rv > 1500 + seg * 4 then motivo := 'recursos'; det := jsonb_build_object('antes', rv, 'ahora', rn, 'seg', round(seg)); end if;
      end if;
      -- topes acumulados en la hora: evitan encadenar saltos pequeños guardado tras guardado
      if motivo is null and not migra and bt is not null and bt > now() - interval '1 hour' then
        t := greatest(60, extract(epoch from now() - bt));
        if inn - bresp > 60 + t / 3 then
          motivo := 'respuestas'; det := jsonb_build_object('antes', bresp, 'ahora', inn, 'seg', round(t), 'ventana', true);
        elsif xn - bxp > 1500 + 30 * greatest(0, inn - bresp) then
          motivo := 'experiencia'; det := jsonb_build_object('antes', round(bxp), 'ahora', round(xn), 'resp', inn - bresp, 'seg', round(t));
        elsif aplica_rec and rn - brec > 4000 + t * 6 then
          motivo := 'recursos'; det := jsonb_build_object('antes', brec, 'ahora', rn, 'seg', round(t), 'ventana', true);
        end if;
      end if;
    end if;
  exception when others then
    return null;   -- error interno inesperado: no se toca lo guardado
  end;
  if motivo is not null then
    perform mw_alertar(id_e, motivo, det);
    update estudiantes set zona = left(p_zona, 20),
      ultimo_ping = case when mw_curso_abierto(curso) then now() else ultimo_ping end where id = id_e;
    return false;
  end if;
  update estudiantes set progreso = p_progreso, zona = left(p_zona, 20), actualizado = now(),
    ultimo_ping = case when mw_curso_abierto(curso) then now() else ultimo_ping end,
    base_t = case when migra or bt is null or bt <= now() - interval '1 hour' then now() else base_t end,
    base_xp = case when migra or bt is null or bt <= now() - interval '1 hour' then xn else base_xp end,
    base_resp = case when migra or bt is null or bt <= now() - interval '1 hour' then inn else base_resp end,
    base_rec = case when migra or bt is null or bt <= now() - interval '1 hour' then rn else base_rec end
  where id = id_e;
  return true;
end $$;

-- ---------- A3. Cofre del grupo ----------
-- Lo compartido sale del cofre personal: se valida contra lo que el servidor sabe que el estudiante tiene
-- (cofre + mochila + lo compartido pendiente del último guardado aceptado, menos lo ya depositado después),
-- con un margen por lo recolectado desde ese guardado. Sin cofre personal (partidas antiguas) se usa el tope por tiempo.
create or replace function public.mw_cofre_grupo2(p_token uuid, p_envio bigint, p_delta jsonb, p_inicial boolean default false)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint; act jsonb; ult bigint;
  k text; v text; d int; dep bigint := 0; uso bigint := 0; limpio jsonb := '{}'::jsonb; resto int; parte int; pd pedidos%rowtype; ayude int := 0;
  seg numeric; tope bigint; positivo bigint := 0; rechazado boolean := false;
  pr jsonb; act_t timestamptz; tiene numeric; exceso numeric := 0; sabe numeric := 0; margen numeric;
begin
  if id_e is null then return json_build_object('ok', false, 'error', 'sesion'); end if;
  select curso, grupo, progreso, actualizado into c, g, pr, act_t from estudiantes where id = id_e;
  if g is null then return json_build_object('ok', false, 'error', 'sin_grupo'); end if;
  insert into cofres_grupo (curso, grupo) values (c, g) on conflict do nothing;
  select recursos into act from cofres_grupo where curso = c and grupo = g for update;
  insert into cofre_aportes (curso, grupo, estudiante_id) values (c, g, id_e) on conflict do nothing;
  select ultimo_envio into ult from cofre_aportes where curso = c and grupo = g and estudiante_id = id_e;
  if coalesce(p_envio, 0) > ult and p_delta is not null and jsonb_typeof(p_delta) = 'object' and not (coalesce(p_inicial, false) and ult = 0) then
    for k, v in select * from jsonb_each_text(p_delta) loop
      continue when k !~ '^[a-z_]{1,24}$' or v !~ '^-?[0-9]{1,6}$';
      if v::int > 0 then positivo := positivo + v::int; end if;
    end loop;
    if positivo > 0 and pr ? 'cofreV2' and mw_progreso_valido(pr) then
      seg := least(900, greatest(0, extract(epoch from now() - coalesce(act_t, now()))));
      margen := 300 + seg * 8;
      for k, v in select * from jsonb_each_text(p_delta) loop
        continue when k !~ '^[a-z_]{1,24}$' or v !~ '^-?[0-9]{1,6}$';
        d := v::int;
        continue when d <= 0;
        tiene := mw_num(pr->'cofre'->k) + mw_num(pr->'mochila'->k) + mw_num(pr->'donPend'->k) + mw_num(pr->'cofreEnv'->'don'->k)
          - coalesce((select sum(greatest(0, (m.delta->>k)::int)) from cofre_movs m
                       where m.estudiante_id = id_e and m.creado > coalesce(act_t, now()) and m.delta ? k), 0);
        sabe := sabe + greatest(0, tiene);
        exceso := exceso + greatest(0, d - greatest(0, tiene));
      end loop;
      rechazado := exceso > margen;
      tope := (sabe + margen)::bigint;
    elsif positivo > 0 then
      select extract(epoch from now() - max(creado)) into seg from cofre_movs where curso = c and grupo = g and estudiante_id = id_e;
      tope := least(20000, 1500 + coalesce(seg, 3600) * 8)::bigint;
      rechazado := positivo > tope;
    end if;
    if rechazado then
      perform mw_alertar(id_e, 'cofre', jsonb_build_object('deposito', positivo, 'tope', tope));
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

-- ---------- A4. Buzón: marcar mensajes para revisar ----------
alter table public.reportes add column if not exists marcado boolean not null default false;
alter table public.reportes add column if not exists motivo_marca text;

-- Texto en minúsculas y sin tildes
create or replace function public.mw_plano(t text) returns text
language sql immutable as $$ select translate(lower(coalesce(t, '')), 'áéíóúüñàèìòù', 'aeiouunaeiou') $$;

-- Motivo para revisar un mensaje: insultos o nombres de compañeros del mismo curso (null si no hay nada)
create or replace function public.mw_reporte_motivo(p_texto text, p_curso text, p_autor uuid) returns text
language plpgsql stable security definer set search_path = public as $$
declare t text := mw_plano(p_texto); m text := null; nom text;
begin
  if t ~ ('\m(c?huev[oa]n(es|as)?|hue[o]n(a|es|as)?|weon(a|es|as)?|aweona[od]o?s?|wev[oa]s?|culia[od]o?s?|conch[ea]tu?s?(ma|mad)re|ctm|csm|qlo?|'
          || 'maric[oa]n?(es)?|maraco|put[oa]s?|perr[oa]s?|mierda|idiotas?|estupid[oa]s?|imbeciles?|tont[oa]s?|tarad[oa]s?|'
          || 'pendej[oa]s?|retrasad[oa]s?|mongolic[oa]s?|subnormal|gil(es)?|gila|asqueros[oa]s?|feos?|feas?|gord[oa]s?|guaton(a|es)?|'
          || 'basura|inutil(es)?|odio|matar(te|lo|la)?|muerete|mat(ate|enlo|enla)|pegarle|sapo)\M') then
    m := 'posible insulto';
  end if;
  select string_agg(distinct x, ', ') into nom from (
    select regexp_replace(w, '[^a-z]', '', 'g') as x
      from estudiantes e, regexp_split_to_table(mw_plano(e.nombre), '\s+') w
     where e.curso = p_curso and e.id <> coalesce(p_autor, '00000000-0000-0000-0000-000000000000'::uuid)) n
   where length(x) >= 3 and t ~ ('\m' || x || '\M');
  if nom is not null then m := concat_ws(' · ', m, 'nombra a un compañero (' || nom || ')'); end if;
  return m;
end $$;
revoke all on function public.mw_reporte_motivo(text, text, uuid) from public, anon, authenticated;

create or replace function public.mw_reporte_marcar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.tipo <> 'error' then
    new.motivo_marca := mw_reporte_motivo(new.texto, new.curso, new.estudiante_id);
    new.marcado := new.motivo_marca is not null;
  end if;
  return new;
end $$;
drop trigger if exists reportes_marcar on public.reportes;
create trigger reportes_marcar before insert on public.reportes for each row execute function public.mw_reporte_marcar();

-- los mensajes que ya estaban también se revisan
update public.reportes set motivo_marca = public.mw_reporte_motivo(texto, curso, estudiante_id)
 where tipo <> 'error' and motivo_marca is null;
update public.reportes set marcado = motivo_marca is not null where tipo <> 'error';

create or replace function public.mw_docente_reportes(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  return coalesce((select json_agg(x) from (
    select r.id, r.tipo, r.categoria, r.texto, r.zona, r.curso, r.leido, mw_ms_de(r.creado) as creado, e.nombre, r.marcado, r.motivo_marca
    from reportes r join estudiantes e on e.id = r.estudiante_id order by r.creado desc limit 300) x), '[]'::json);
end $$;

-- ===================================================================
-- BLOQUE B · B5. Jefe cooperativo: el juego pide la mitad de los integrantes activos del grupo (entre 2 y 4).
-- mw_grupo_estado entrega cuántos integrantes del grupo jugaron en los últimos 7 días.
-- ===================================================================
create or replace function public.mw_grupo_estado(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token);
begin
  if id_e is null then return json_build_object('ok', false); end if;
  return (select json_build_object('ok', true, 'grupo', e.grupo, 'curso', e.curso,
      'activos', case when e.grupo is null then 0 else (select count(*) from estudiantes x
        where x.curso = e.curso and x.grupo = e.grupo and x.ultimo_ping > now() - interval '7 days') end)
    from estudiantes e where e.id = id_e);
end $$;
