-- ===================================================================
-- Guardado con validación (saltos imposibles), evaluaciones auditables y enlace de informe para apoderados
-- ===================================================================

-- ---------- Alertas de guardados sospechosos ----------
create table if not exists public.alertas (
  id bigserial primary key,
  estudiante_id uuid not null references public.estudiantes (id) on delete cascade,
  tipo text not null,
  detalle jsonb,
  creado timestamptz not null default now()
);
create index if not exists alertas_est on public.alertas (estudiante_id, creado desc);
alter table public.alertas enable row level security;
revoke all on public.alertas from anon, authenticated;

-- El progreso lo calcula el navegador, así que el servidor revisa que el salto desde el último guardado sea posible:
--   · nivel: hasta 5 niveles más 1 por minuto transcurrido (máximo 15 minutos)
--   · ejercicios respondidos: hasta 30 más 1 cada 2 segundos transcurridos
--   · ningún tema puede tener más aciertos que intentos
-- Un guardado que no cumple NO se guarda (queda el anterior) y se registra una alerta para el docente.
-- Si la revisión misma falla por un dato inesperado, el guardado se acepta: nunca se pierde avance por un error de la revisión.
create or replace function public.mw_guardar(p_token uuid, p_progreso jsonb, p_zona text)
returns boolean language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); viejo jsonb; desde timestamptz; seg numeric;
  nv int; nn int; iv numeric; inn numeric; motivo text; det jsonb;
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
      elsif inn - iv > 30 + seg / 2 then
        motivo := 'respuestas'; det := jsonb_build_object('antes', iv, 'ahora', inn, 'seg', round(seg));
      elsif exists (select 1 from jsonb_each(case when jsonb_typeof(p_progreso->'stats') = 'object' then p_progreso->'stats' else '{}'::jsonb end)
                    where (value->>'a')::numeric > (value->>'i')::numeric or (value->>'a')::numeric < 0) then
        motivo := 'aciertos'; det := '{}'::jsonb;
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

create or replace function public.mw_docente_alertas(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  return (select coalesce(json_object_agg(estudiante_id, lista), '{}'::json) from (
    select estudiante_id, json_agg(json_build_object('tipo', tipo, 'detalle', detalle, 't', mw_ms_de(creado)) order by creado desc) as lista
      from alertas where creado > now() - interval '30 days' group by estudiante_id) x);
end $$;

-- ---------- Evaluación auditable: la nota sale del detalle pregunta por pregunta ----------
create or replace function public.mw_ticket_responder(p_token uuid, p_id bigint, p_aciertos int, p_total int, p_detalle jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; t tickets; det jsonb; a int; n int;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso into c from estudiantes where id = id_e;
  select * into t from tickets where id = p_id;
  if t.id is null or t.curso <> c then return json_build_object('ok', false); end if;
  det := case when jsonb_typeof(p_detalle) = 'array' and jsonb_array_length(p_detalle) <= 20 and pg_column_size(p_detalle) < 30000 then p_detalle else null end;
  a := least(greatest(coalesce(p_aciertos, 0), 0), t.n); n := least(greatest(coalesce(p_total, 1), 1), t.n);
  if t.examen then
    -- en una evaluación no se confía en el total que envía el navegador: se cuentan las respuestas del detalle sobre el total de preguntas
    n := t.n;
    a := case when det is null then 0 else least(t.n, (select count(*) from jsonb_array_elements(det) x where (x->>'ok')::boolean is true)::int) end;
  end if;
  insert into ticket_respuestas (ticket_id, estudiante_id, aciertos, total, detalle) values (p_id, id_e, a, n, det)
  on conflict do nothing;
  return json_build_object('ok', true);
end $$;

-- ---------- Enlace de solo lectura para apoderados ----------
alter table public.estudiantes add column if not exists enlace uuid unique;

create or replace function public.mw_docente_enlace(p_token uuid, p_estudiante uuid, p_accion text) returns json
language plpgsql security definer set search_path = public as $$
declare k uuid;
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  if p_accion = 'quitar' then update estudiantes set enlace = null where id = p_estudiante;
  elsif p_accion = 'crear' then update estudiantes set enlace = coalesce(enlace, gen_random_uuid()) where id = p_estudiante;
  elsif p_accion = 'renovar' then update estudiantes set enlace = gen_random_uuid() where id = p_estudiante;
  end if;
  select enlace into k from estudiantes where id = p_estudiante;
  return json_build_object('ok', true, 'enlace', k);
end $$;

-- Lo que ve el apoderado: nombre, curso y solo la parte del progreso que usa el informe (sin RUT ni datos de acceso)
create or replace function public.mw_informe(p_enlace uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('ok', true, 'nombre', e.nombre, 'curso', e.curso, 'nivel', e.nivel,
    'progreso', jsonb_build_object('nivel', e.progreso->'nivel', 'stats', e.progreso->'stats', 'semanal', e.progreso->'semanal',
      'maestria', e.progreso->'maestria', 'repaso', e.progreso->'repaso', 'diagnostico', e.progreso->'diagnostico', 'diasSeguidos', e.progreso->'diasSeguidos'))
  from estudiantes e where p_enlace is not null and e.enlace = p_enlace
$$;

create or replace function public.mw_docente_resumen(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  return (select coalesce(json_agg(json_build_object(
      'id', id, 'curso', curso, 'rut', rut, 'nombre', nombre,
      'tiene_clave', clave_hash is not null,
      'conectado', ultimo_ping > now() - interval '75 seconds',
      'ultimo', ultimo_ping, 'zona', zona, 'progreso', progreso, 'grupo', grupo,
      'nivel', nivel, 'aprobado', aprobado, 'creado', creado, 'enlace', enlace
    ) order by curso, nombre), '[]'::json) from estudiantes);
end $$;

revoke all on function public.mw_docente_alertas(uuid), public.mw_docente_enlace(uuid, uuid, text), public.mw_informe(uuid) from public, authenticated;
grant execute on function public.mw_docente_alertas(uuid), public.mw_docente_enlace(uuid, uuid, text), public.mw_informe(uuid) to anon;
