-- ===================================================================
-- Clanes y Guerra de clanes
-- Cada grupo de un curso es un clan: votan a su líder (mayoría del grupo) y el líder le pone nombre.
-- El docente lanza una guerra por curso con tareas en vivo (cada acción suma puntos al clan),
-- duelos PvP entre clanes y, al terminar, se reparten premios según el lugar.
-- ===================================================================
create table if not exists public.clanes (
  curso text not null,
  grupo smallint not null,
  lider uuid references public.estudiantes (id) on delete set null,
  nombre text,
  votos jsonb not null default '{}'::jsonb,
  actualizado timestamptz not null default now(),
  primary key (curso, grupo)
);
alter table public.clanes enable row level security;
revoke all on public.clanes from anon, authenticated;

create table if not exists public.guerras (
  n bigserial primary key,
  curso text not null,
  inicio timestamptz not null default now(),
  fin timestamptz,
  tarea jsonb,
  duelo jsonb,
  resultado jsonb
);
create index if not exists guerras_curso on public.guerras (curso, n desc);
alter table public.guerras enable row level security;
revoke all on public.guerras from anon, authenticated;

create table if not exists public.guerra_puntos (
  n bigint not null references public.guerras (n) on delete cascade,
  grupo smallint not null,
  puntos int not null default 0,
  primary key (n, grupo)
);
alter table public.guerra_puntos enable row level security;
revoke all on public.guerra_puntos from anon, authenticated;

create table if not exists public.guerra_aportes (
  n bigint not null references public.guerras (n) on delete cascade,
  estudiante_id uuid not null references public.estudiantes (id) on delete cascade,
  puntos int not null default 0,
  ultimo timestamptz not null default now() - interval '1 hour',
  primary key (n, estudiante_id)
);
alter table public.guerra_aportes enable row level security;
revoke all on public.guerra_aportes from anon, authenticated;

-- Nombre de clan: 3 a 20 letras, números o espacios, sin groserías (filtro básico; el docente puede borrarlo)
create or replace function public.mw_clan_nombre_ok(p text) returns boolean language sql immutable as $$
  select p ~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 ]{3,20}$'
     and translate(lower(p), 'áéíóúüñ01345', 'aeiouunoieas') !~ '(puta|puto|mierd|hueon|huevon|weon|weona|chucha|conchetu|concha|maric|cagar|cagad|verga|zorra|idiot|estupid|imbecil|porno|sexo|nazi|hitler|marihuan|cocain|pichul|mamon|mongol|retrasad|ctm|csm)'
     and translate(lower(p), 'áéíóúüñ01345', 'aeiouunoieas') !~ '\m(raja|poto|tula|caca|culo|pene|pico|wn)\M'
$$;

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
    'necesarios', (select count(*) / 2 + 1 from m),
    'miembros', coalesce((select json_agg(json_build_object('id', m.id, 'nombre', m.nombre, 'online', m.online,
        'votos', coalesce((select v.n from v where v.cand = m.id::text), 0), 'yo', m.id = yo) order by m.nombre) from m), '[]'::json))
$$;

create or replace function public.mw_clan(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso, grupo into c, g from estudiantes where id = id_e;
  if g is null or c = 'INV' then return json_build_object('ok', true, 'sin_grupo', true); end if;
  return mw_clan_info(c, g, id_e);
end $$;

-- Votar por un líder (se puede cambiar el voto). Es líder quien tiene los votos de la mayoría del grupo.
create or replace function public.mw_clan_votar(p_token uuid, p_candidato uuid) returns json
language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint; top text; topn int; total int;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso, grupo into c, g from estudiantes where id = id_e;
  if g is null or c = 'INV' then return json_build_object('ok', false, 'error', 'sin_grupo'); end if;
  if not exists (select 1 from estudiantes where id = p_candidato and curso = c and grupo = g) then return json_build_object('ok', false, 'error', 'candidato'); end if;
  insert into clanes (curso, grupo) values (c, g) on conflict do nothing;
  update clanes set votos = votos || jsonb_build_object(id_e::text, p_candidato::text), actualizado = now() where curso = c and grupo = g;
  select x.value, count(*) into top, topn from clanes k, jsonb_each_text(k.votos) x
    where k.curso = c and k.grupo = g and exists (select 1 from estudiantes e where e.id::text = x.key and e.curso = c and e.grupo = g)
    group by x.value order by count(*) desc limit 1;
  select count(*) into total from estudiantes where curso = c and grupo = g;
  if top is not null and topn * 2 > total then update clanes set lider = top::uuid where curso = c and grupo = g; end if;
  return mw_clan_info(c, g, id_e);
end $$;

create or replace function public.mw_clan_nombre(p_token uuid, p_nombre text) returns json
language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint; nom text := regexp_replace(trim(coalesce(p_nombre, '')), '\s+', ' ', 'g');
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso, grupo into c, g from estudiantes where id = id_e;
  if not exists (select 1 from clanes where curso = c and grupo = g and lider = id_e) then return json_build_object('ok', false, 'error', 'no_lider'); end if;
  if not mw_clan_nombre_ok(nom) then return json_build_object('ok', false, 'error', 'nombre'); end if;
  update clanes set nombre = nom, actualizado = now() where curso = c and grupo = g;
  return mw_clan_info(c, g, id_e);
end $$;

-- Ranking de la guerra: todos los grupos con integrantes, con el nombre del clan
create or replace function public.mw_guerra_ranking(p_n bigint, c text) returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('grupo', g.grupo, 'nombre', coalesce(k.nombre, 'Grupo ' || g.grupo), 'clan', k.nombre is not null,
      'puntos', coalesce(p.puntos, 0), 'miembros', g.n) order by coalesce(p.puntos, 0) desc, g.grupo), '[]'::json)
  from (select grupo, count(*) as n from estudiantes where curso = c and grupo is not null group by grupo) g
  left join clanes k on k.curso = c and k.grupo = g.grupo
  left join guerra_puntos p on p.n = p_n and p.grupo = g.grupo
$$;

-- Plazos del duelo: elegir campeón (si el líder no elige, uno al azar conectado) y tiempo máximo de lucha
create or replace function public.mw_guerra_revisar(p_n bigint) returns void
language plpgsql security definer set search_path = public as $$
declare w guerras; d jsonb; ahora bigint := mw_ms(); g text; cand uuid; camp jsonb;
begin
  select * into w from guerras where n = p_n for update;
  d := w.duelo;
  if d is null then return; end if;
  if d->>'fase' = 'eligiendo' and ahora > (d->>'hasta')::bigint then
    camp := coalesce(d->'campeones', '{}'::jsonb);
    foreach g in array array[d->>'a', d->>'b'] loop
      if camp->g is null then
        select id into cand from estudiantes where curso = w.curso and grupo = g::smallint and ultimo_ping > now() - interval '90 seconds' order by random() limit 1;
        if cand is null then
          update guerras set duelo = d || jsonb_build_object('fase', 'cancelado', 'motivo', 'sin_jugadores', 'grupo_sin', g) where n = p_n;
          return;
        end if;
        camp := camp || jsonb_build_object(g, cand::text);
      end if;
    end loop;
    update guerras set duelo = d || jsonb_build_object('campeones', camp, 'fase', 'lucha', 'hasta', ahora + 240000) where n = p_n;
  elsif d->>'fase' = 'lucha' and ahora > (d->>'hasta')::bigint then
    update guerras set duelo = d || jsonb_build_object('fase', 'fin', 'ganador', null, 'motivo', 'tiempo') where n = p_n;
  end if;
end $$;

-- Estudiante: estado de la guerra de su curso
create or replace function public.mw_guerra(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint; w guerras; d jsonb; pel jsonb;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso, grupo into c, g from estudiantes where id = id_e;
  select * into w from guerras where curso = c order by n desc limit 1;
  if g is null or c = 'INV' or w.n is null or (w.fin is not null and w.fin < now() - interval '3 days') then
    return json_build_object('ok', true, 'activa', false, 'ahora', mw_ms(), 'grupo', g);
  end if;
  if w.fin is null then
    perform mw_guerra_revisar(w.n);
    select * into w from guerras where n = w.n;
    insert into guerra_aportes (n, estudiante_id) values (w.n, id_e) on conflict do nothing;   -- participó
  end if;
  d := w.duelo;
  if d is not null and d ? 'campeones' then
    select coalesce(jsonb_agg(jsonb_build_object('grupo', e.grupo, 'id', e.id, 'nombre', mw_nombre_corto(e.nombre), 'pj', e.progreso->>'pj', 'armadura', e.progreso->>'armadura')), '[]'::jsonb) into pel
      from estudiantes e where e.id::text in (select value from jsonb_each_text(d->'campeones'));
    d := d || jsonb_build_object('peleadores', pel);
  end if;
  return json_build_object('ok', true, 'activa', w.fin is null, 'n', w.n, 'ahora', mw_ms(), 'grupo', g, 'yo', id_e,
    'tarea', w.tarea, 'duelo', d, 'ranking', mw_guerra_ranking(w.n, c), 'resultado', w.resultado,
    'soy_lider', exists (select 1 from clanes where curso = c and grupo = g and lider = id_e),
    'mis_puntos', coalesce((select puntos from guerra_aportes where n = w.n and estudiante_id = id_e), 0),
    'participe', exists (select 1 from guerra_aportes where n = w.n and estudiante_id = id_e),
    'online', (select coalesce(json_agg(json_build_object('id', id, 'nombre', mw_nombre_corto(nombre))), '[]'::json)
               from estudiantes where curso = c and grupo = g and ultimo_ping > now() - interval '90 seconds'));
end $$;

-- Estudiante: suma lo que hizo su clan en la tarea actual (máx. 30 por llamada, una llamada cada 1,5 s)
create or replace function public.mw_guerra_sumar(p_token uuid, p_n bigint, p_tarea text, p_cant int) returns json
language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint; w guerras; pts int; cant int := least(greatest(coalesce(p_cant, 0), 0), 30); filas int := 0;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso, grupo into c, g from estudiantes where id = id_e;
  select * into w from guerras where n = p_n and curso = c and fin is null;
  if w.n is not null and g is not null and cant > 0 and w.tarea is not null and w.tarea->>'id' = p_tarea
     and mw_ms() <= (w.tarea->>'hasta')::bigint + 5000 then
    pts := cant * greatest(1, least(20, coalesce((w.tarea->>'pts')::int, 1)));
    insert into guerra_aportes (n, estudiante_id) values (p_n, id_e) on conflict do nothing;
    update guerra_aportes set puntos = puntos + pts, ultimo = now() where n = p_n and estudiante_id = id_e and ultimo < now() - interval '1500 milliseconds';
    get diagnostics filas = row_count;
    if filas > 0 then
      insert into guerra_puntos (n, grupo, puntos) values (p_n, g, pts) on conflict (n, grupo) do update set puntos = guerra_puntos.puntos + excluded.puntos;
    end if;
  end if;
  return (mw_guerra(p_token)::jsonb || jsonb_build_object('sumado', filas > 0))::json;
end $$;

-- Líder: elige al campeón de su clan para el duelo
create or replace function public.mw_guerra_campeon(p_token uuid, p_n bigint, p_campeon uuid) returns json
language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint; w guerras; d jsonb; camp jsonb;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso, grupo into c, g from estudiantes where id = id_e;
  select * into w from guerras where n = p_n and curso = c and fin is null for update;
  d := w.duelo;
  if d is null or d->>'fase' <> 'eligiendo' or g::text not in (d->>'a', d->>'b') then return mw_guerra(p_token); end if;
  if not exists (select 1 from clanes where curso = c and grupo = g and lider = id_e) then return mw_guerra(p_token); end if;
  if not exists (select 1 from estudiantes where id = p_campeon and curso = c and grupo = g) then return mw_guerra(p_token); end if;
  camp := coalesce(d->'campeones', '{}'::jsonb) || jsonb_build_object(g::text, p_campeon::text);
  d := d || jsonb_build_object('campeones', camp);
  if camp ? (d->>'a') and camp ? (d->>'b') then d := d || jsonb_build_object('fase', 'lucha', 'hasta', mw_ms() + 240000); end if;
  update guerras set duelo = d where n = p_n;
  return mw_guerra(p_token);
end $$;

-- Campeón: informa el final del duelo ('perdi', 'abandono' si el rival se fue, 'empate')
create or replace function public.mw_guerra_duelo_fin(p_token uuid, p_n bigint, p_res text) returns json
language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint; w guerras; d jsonb; ga text; gb text; gan text; per text;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso, grupo into c, g from estudiantes where id = id_e;
  select * into w from guerras where n = p_n and curso = c and fin is null for update;
  d := w.duelo;
  if d is null or d->>'fase' <> 'lucha' or coalesce(d->'campeones'->>(g::text), '') <> id_e::text then return mw_guerra(p_token); end if;
  ga := d->>'a'; gb := d->>'b';
  if p_res = 'perdi' then per := g::text; gan := case when g::text = ga then gb else ga end;
  elsif p_res = 'abandono' then gan := g::text; per := case when g::text = ga then gb else ga end;
  end if;
  if gan is not null then
    insert into guerra_puntos (n, grupo, puntos) values (p_n, gan::smallint, coalesce((d->>'gana')::int, 30))
      on conflict (n, grupo) do update set puntos = guerra_puntos.puntos + excluded.puntos;
    insert into guerra_puntos (n, grupo, puntos) values (p_n, per::smallint, 0) on conflict do nothing;
    update guerra_puntos set puntos = greatest(0, puntos - coalesce((d->>'pierde')::int, 15)) where n = p_n and grupo = per::smallint;
  end if;
  update guerras set duelo = d || jsonb_build_object('fase', 'fin', 'ganador', gan, 'perdedor', per,
    'motivo', case p_res when 'perdi' then 'ko' when 'abandono' then 'abandono' else 'empate' end) where n = p_n;
  return mw_guerra(p_token);
end $$;

-- Docente: estado de las guerras y de los clanes de cada curso
create or replace function public.mw_docente_guerras(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare wn bigint;
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  for wn in select max(n) from guerras where fin is null group by curso loop perform mw_guerra_revisar(wn); end loop;
  return json_build_object('ahora', mw_ms(), 'cursos', (select json_object_agg(k.curso, json_build_object(
    'guerra', (select case when w.n is null then null else json_build_object('n', w.n, 'activa', w.fin is null, 'inicio', mw_ms_de(w.inicio),
                 'fin', case when w.fin is null then null else mw_ms_de(w.fin) end, 'tarea', w.tarea, 'duelo', w.duelo,
                 'ranking', mw_guerra_ranking(w.n, k.curso), 'resultado', w.resultado) end
               from (select * from guerras where curso = k.curso order by n desc limit 1) w),
    'clanes', (select coalesce(json_agg(json_build_object('grupo', gg.grupo, 'nombre', cl.nombre,
                 'lider', (select mw_nombre_corto(nombre) from estudiantes where id = cl.lider),
                 'votos', coalesce((select count(*) from jsonb_object_keys(cl.votos)), 0), 'miembros', gg.n, 'conectados', gg.conec) order by gg.grupo), '[]'::json)
               from (select grupo, count(*) as n, count(*) filter (where ultimo_ping > now() - interval '90 seconds') as conec
                     from estudiantes where curso = k.curso and grupo is not null group by grupo) gg
               left join clanes cl on cl.curso = k.curso and cl.grupo = gg.grupo)
  )) from cursos k where k.curso <> 'INV'));
end $$;

-- Docente: iniciar, lanzar tareas, duelos, ajustar puntos y terminar la guerra
create or replace function public.mw_docente_guerra(p_token uuid, p_cursos text[], p_op jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare c text; wn bigint; op text := p_op->>'op'; ahora bigint := mw_ms();
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
        'pierde', least(greatest(coalesce((p_op->>'pierde')::int, 15), 0), 200)) where n = wn;
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
    end if;
  end loop;
  return mw_docente_guerras(p_token);
end $$;

-- Docente: moderar un clan
create or replace function public.mw_docente_clan(p_token uuid, p_curso text, p_grupo int, p_accion text) returns json
language plpgsql security definer set search_path = public as $$
declare top text;
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  if p_accion = 'borrar_nombre' then
    update clanes set nombre = null, actualizado = now() where curso = p_curso and grupo = p_grupo;
  elsif p_accion = 'reiniciar' then
    update clanes set lider = null, nombre = null, votos = '{}'::jsonb, actualizado = now() where curso = p_curso and grupo = p_grupo;
  elsif p_accion = 'cerrar_voto' then
    select x.value into top from clanes k, jsonb_each_text(k.votos) x where k.curso = p_curso and k.grupo = p_grupo group by x.value order by count(*) desc limit 1;
    if top is not null then update clanes set lider = top::uuid, actualizado = now() where curso = p_curso and grupo = p_grupo; end if;
  end if;
  return mw_docente_guerras(p_token);
end $$;

revoke all on function public.mw_clan_nombre_ok(text), public.mw_clan_info(text, smallint, uuid), public.mw_guerra_ranking(bigint, text),
  public.mw_guerra_revisar(bigint) from public, anon, authenticated;
revoke all on function public.mw_clan(uuid), public.mw_clan_votar(uuid, uuid), public.mw_clan_nombre(uuid, text), public.mw_guerra(uuid),
  public.mw_guerra_sumar(uuid, bigint, text, int), public.mw_guerra_campeon(uuid, bigint, uuid), public.mw_guerra_duelo_fin(uuid, bigint, text),
  public.mw_docente_guerras(uuid), public.mw_docente_guerra(uuid, text[], jsonb), public.mw_docente_clan(uuid, text, int, text) from public, authenticated;
grant execute on function public.mw_clan(uuid), public.mw_clan_votar(uuid, uuid), public.mw_clan_nombre(uuid, text), public.mw_guerra(uuid),
  public.mw_guerra_sumar(uuid, bigint, text, int), public.mw_guerra_campeon(uuid, bigint, uuid), public.mw_guerra_duelo_fin(uuid, bigint, text),
  public.mw_docente_guerras(uuid), public.mw_docente_guerra(uuid, text[], jsonb), public.mw_docente_clan(uuid, text, int, text) to anon;
