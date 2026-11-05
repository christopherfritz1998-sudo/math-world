-- ===================================================================
-- Mejoras de noviembre 2026: tema de la clase, refuerzo personalizado, reporte automático de errores,
-- trofeos de los clanes y Salón de la fama (público, sin nombres de estudiantes).
-- ===================================================================

-- ---------- Reporte automático de errores (tipo 'error': hasta 10 por hora por estudiante) ----------
alter table public.reportes drop constraint if exists reportes_tipo_check;
alter table public.reportes add constraint reportes_tipo_check check (tipo in ('problema', 'idea', 'error'));
create or replace function public.mw_reporte_enviar(p_token uuid, p_tipo text, p_categoria text, p_texto text, p_zona text)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; t text := left(btrim(coalesce(p_texto, '')), 500); n int;
begin
  if id_e is null or p_tipo not in ('problema', 'idea', 'error') then return json_build_object('ok', false); end if;
  if char_length(t) < 3 then return json_build_object('ok', false, 'error', 'corto'); end if;
  select count(*) into n from reportes where estudiante_id = id_e and creado > now() - interval '1 hour' and (tipo = 'error') = (p_tipo = 'error');
  if n >= (case when p_tipo = 'error' then 10 else 6 end) then return json_build_object('ok', false, 'error', 'limite'); end if;
  select curso into c from estudiantes where id = id_e;
  insert into reportes (estudiante_id, curso, tipo, categoria, texto, zona) values (id_e, c, p_tipo, left(coalesce(p_categoria, ''), 40), t, left(coalesce(p_zona, ''), 40));
  return json_build_object('ok', true);
end $$;

-- ---------- Tema de la clase (por curso) ----------
alter table public.cursos add column if not exists foco jsonb;

create or replace function public.mw_docente_foco(p_token uuid, p_cursos text[], p_foco jsonb) returns json
language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  update cursos set foco = case when p_foco is null or jsonb_array_length(coalesce(p_foco->'temas', '[]'::jsonb)) = 0 then null
                                else jsonb_build_object('unidad', left(coalesce(p_foco->>'unidad', ''), 10), 'temas', p_foco->'temas',
                                       'titulos', coalesce(p_foco->'titulos', '[]'::jsonb), 'hasta', mw_ms() + 1000 * 60 * least(greatest(coalesce((p_foco->>'min')::int, 90), 10), 600)) end
    where curso = any (p_cursos);
  return (select json_object_agg(curso, foco) from cursos);
end $$;

create or replace function public.mw_docente_focos(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  return json_build_object('ahora', mw_ms(), 'cursos', (select json_object_agg(curso, case when foco is not null and (foco->>'hasta')::bigint > mw_ms() then foco end) from cursos));
end $$;

-- ---------- Refuerzo personalizado (el docente asigna un tema a un estudiante) ----------
create table if not exists public.refuerzos (
  id bigserial primary key,
  estudiante_id uuid not null references public.estudiantes (id) on delete cascade,
  tema text not null,
  titulo text,
  meta int not null default 8,
  creado timestamptz not null default now(),
  completado timestamptz
);
create index if not exists refuerzos_estudiante on public.refuerzos (estudiante_id, completado);
alter table public.refuerzos enable row level security;
revoke all on public.refuerzos from anon, authenticated;

create or replace function public.mw_docente_refuerzo(p_token uuid, p_estudiante uuid, p_tema text, p_titulo text, p_meta int, p_accion text) returns json
language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  if p_accion = 'quitar' then
    delete from refuerzos where estudiante_id = p_estudiante and completado is null;
  else
    delete from refuerzos where estudiante_id = p_estudiante and completado is null;
    insert into refuerzos (estudiante_id, tema, titulo, meta) values (p_estudiante, left(p_tema, 60), left(coalesce(p_titulo, p_tema), 120), least(greatest(coalesce(p_meta, 8), 3), 30));
  end if;
  return mw_docente_refuerzos(p_token);
end $$;

create or replace function public.mw_docente_refuerzos(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  return coalesce((select json_object_agg(estudiante_id, json_build_object('id', id, 'tema', tema, 'titulo', titulo, 'meta', meta,
      'creado', mw_ms_de(creado), 'completado', case when completado is null then null else mw_ms_de(completado) end))
    from (select distinct on (estudiante_id) * from refuerzos order by estudiante_id, creado desc) r), '{}'::json);
end $$;

-- Estudiante: tema de su curso y su refuerzo pendiente
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
                 where estudiante_id = id_e and completado is null order by creado desc limit 1));
end $$;

create or replace function public.mw_refuerzo_completar(p_token uuid, p_id bigint) returns json
language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); n int;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  update refuerzos set completado = now() where id = p_id and estudiante_id = id_e and completado is null;
  get diagnostics n = row_count;
  return json_build_object('ok', n > 0);
end $$;

-- ---------- Trofeos de los clanes: al terminar cada guerra suman sus puntos y el ganador una victoria ----------
alter table public.clanes add column if not exists trofeos int not null default 0;
alter table public.clanes add column if not exists victorias int not null default 0;

create or replace function public.mw_clan_info(c text, g smallint, yo uuid) returns json
language sql stable security definer set search_path = public as $$
  with m as (select e.id, mw_nombre_corto(e.nombre) as nombre, coalesce(e.ultimo_ping > now() - interval '90 seconds', false) as online
             from estudiantes e where e.curso = c and e.grupo = g),
       k as (select * from clanes where curso = c and grupo = g),
       v as (select x.value as cand, count(*) as n from k, jsonb_each_text(k.votos) x group by x.value)
  select json_build_object('ok', true, 'curso', c, 'grupo', g,
    'nombre', (select nombre from k), 'lider', (select lider from k),
    'lider_nombre', (select m.nombre from m join k on k.lider = m.id),
    'soy_lider', coalesce((select lider = yo from k), false),
    'mi_voto', (select votos->>yo::text from k),
    'trofeos', coalesce((select trofeos from k), 0), 'victorias', coalesce((select victorias from k), 0),
    'necesarios', (select count(*) / 2 + 1 from m),
    'miembros', coalesce((select json_agg(json_build_object('id', m.id, 'nombre', m.nombre, 'online', m.online,
        'votos', coalesce((select v.n from v where v.cand = m.id::text), 0), 'yo', m.id = yo) order by m.nombre) from m), '[]'::json))
$$;

create or replace function public.mw_docente_guerra(p_token uuid, p_cursos text[], p_op jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare c text; wn bigint; op text := p_op->>'op'; ahora bigint := mw_ms(); r1 jsonb;
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  foreach c in array coalesce(p_cursos, array[]::text[]) loop
    if c = 'INV' then continue; end if;
    select n into wn from guerras where curso = c and fin is null order by n desc limit 1;
    if op = 'iniciar' then
      if wn is null then insert into guerras (curso) values (c); end if;
    elsif wn is null then continue;
    elsif op = 'tarea' then
      update guerras set tarea = (p_op->'tarea') || jsonb_build_object('inicio', ahora,
        'hasta', ahora + 1000 * least(greatest(coalesce((p_op->>'seg')::int, 120), 30), 1800)) where n = wn;
    elsif op = 'detener_tarea' then
      update guerras set tarea = tarea || jsonb_build_object('hasta', ahora) where n = wn and tarea is not null;
    elsif op = 'duelo' then
      update guerras set duelo = jsonb_build_object('id', ahora, 'a', p_op->>'a', 'b', p_op->>'b', 'fase', 'eligiendo', 'hasta', ahora + 35000,
        'campeones', '{}'::jsonb, 'gana', least(greatest(coalesce((p_op->>'gana')::int, 30), 0), 200),
        'pierde', least(greatest(coalesce((p_op->>'pierde')::int, 15), 0), 200), 'torneo', coalesce(p_op->'torneo', 'null'::jsonb)) where n = wn;
    elsif op = 'cancelar_duelo' then
      update guerras set duelo = duelo || jsonb_build_object('fase', 'cancelado', 'motivo', 'docente')
        where n = wn and duelo is not null and duelo->>'fase' in ('eligiendo', 'lucha');
    elsif op = 'puntos' then
      insert into guerra_puntos (n, grupo, puntos) values (wn, (p_op->>'grupo')::smallint, 0) on conflict do nothing;
      update guerra_puntos set puntos = greatest(0, puntos + least(greatest(coalesce((p_op->>'delta')::int, 0), -500), 500))
        where n = wn and grupo = (p_op->>'grupo')::smallint;
    elsif op = 'terminar' then
      update guerras set fin = now(),
        tarea = case when tarea is null then null else tarea || jsonb_build_object('hasta', least((tarea->>'hasta')::bigint, ahora)) end,
        duelo = case when duelo is not null and duelo->>'fase' in ('eligiendo', 'lucha') then duelo || jsonb_build_object('fase', 'cancelado', 'motivo', 'fin_guerra') else duelo end,
        resultado = (select coalesce(jsonb_agg(jsonb_build_object('grupo', (r->>'grupo')::int, 'nombre', r->>'nombre', 'puntos', (r->>'puntos')::int, 'lugar', t.ord) order by t.ord), '[]'::jsonb)
                     from json_array_elements(mw_guerra_ranking(wn, c)) with ordinality as t(r, ord))
      where n = wn;
      -- trofeos: cada clan suma sus puntos; el primero (con puntos) suma una victoria
      insert into clanes (curso, grupo) select c, grupo from guerra_puntos where n = wn on conflict do nothing;
      update clanes k set trofeos = k.trofeos + p.puntos from guerra_puntos p where p.n = wn and k.curso = c and k.grupo = p.grupo;
      select resultado->0 into r1 from guerras where n = wn;
      if r1 is not null and (r1->>'puntos')::int > 0 then update clanes set victorias = victorias + 1 where curso = c and grupo = (r1->>'grupo')::smallint; end if;
    end if;
  end loop;
  return mw_docente_guerras(p_token);
end $$;

-- ---------- Salón de la fama (público): solo nombres de clanes y cantidades, nunca nombres de estudiantes ----------
create or replace function public.mw_salon() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'cursos', (select coalesce(json_object_agg(k.curso, json_build_object(
        'campeones', (select coalesce(json_agg(x), '[]'::json) from (
            select mw_ms_de(g.fin) as fecha, g.resultado->0->>'nombre' as clan, (g.resultado->0->>'puntos')::int as puntos
            from guerras g where g.curso = k.curso and g.fin is not null and g.resultado is not null and jsonb_array_length(g.resultado) > 0
              and (g.resultado->0->>'puntos')::int > 0 order by g.fin desc limit 5) x),
        'clanes', (select coalesce(json_agg(x), '[]'::json) from (
            select coalesce(nombre, 'Grupo ' || grupo) as nombre, victorias, trofeos from clanes
            where curso = k.curso and (victorias > 0 or trofeos > 0) order by victorias desc, trofeos desc limit 8) x),
        'leyendas', (select count(*) from estudiantes e where e.curso = k.curso and coalesce((e.progreso->>'nivel')::int, 0) >= 100),
        'nivel50', (select count(*) from estudiantes e where e.curso = k.curso and coalesce((e.progreso->>'nivel')::int, 0) >= 50),
        'obras', (select count(*) from obras o where o.curso = k.curso and o.completado is not null)
      )), '{}'::json) from cursos k where k.curso <> 'INV'),
    'actualizado', mw_ms())
$$;

revoke all on function public.mw_docente_foco(uuid, text[], jsonb), public.mw_docente_focos(uuid), public.mw_docente_refuerzo(uuid, uuid, text, text, int, text),
  public.mw_docente_refuerzos(uuid), public.mw_extra(uuid), public.mw_refuerzo_completar(uuid, bigint), public.mw_salon() from public, authenticated;
grant execute on function public.mw_docente_foco(uuid, text[], jsonb), public.mw_docente_focos(uuid), public.mw_docente_refuerzo(uuid, uuid, text, text, int, text),
  public.mw_docente_refuerzos(uuid), public.mw_extra(uuid), public.mw_refuerzo_completar(uuid, bigint), public.mw_salon() to anon;
revoke all on function public.mw_clan_info(text, smallint, uuid) from public, anon, authenticated;
