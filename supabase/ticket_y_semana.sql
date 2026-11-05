-- ===================================================================
-- Ticket de salida (el docente lanza preguntas al final de la clase) y misión semanal del curso
-- ===================================================================

-- ---------- Ticket de salida ----------
create table if not exists public.tickets (
  id bigserial primary key,
  curso text not null,
  temas jsonb not null default '[]'::jsonb,
  titulos jsonb not null default '[]'::jsonb,
  n int not null default 3,
  creado timestamptz not null default now(),
  hasta bigint not null,
  activo boolean not null default true
);
create index if not exists tickets_curso on public.tickets (curso, creado desc);
create table if not exists public.ticket_respuestas (
  ticket_id bigint not null references public.tickets (id) on delete cascade,
  estudiante_id uuid not null references public.estudiantes (id) on delete cascade,
  aciertos int not null,
  total int not null,
  detalle jsonb,
  creado timestamptz not null default now(),
  primary key (ticket_id, estudiante_id)
);
alter table public.tickets enable row level security;
alter table public.ticket_respuestas enable row level security;
revoke all on public.tickets, public.ticket_respuestas from anon, authenticated;

create or replace function public.mw_docente_tickets(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  return json_build_object('ahora', mw_ms(), 'cursos', coalesce((select json_object_agg(t.curso, json_build_object(
      'id', t.id, 'temas', t.temas, 'titulos', t.titulos, 'n', t.n, 'hasta', t.hasta, 'creado', mw_ms_de(t.creado),
      'activo', t.activo and t.hasta > mw_ms(),
      'respuestas', (select coalesce(json_agg(json_build_object('id', e.id, 'nombre', e.nombre, 'aciertos', r.aciertos, 'total', r.total, 'detalle', r.detalle) order by e.nombre), '[]'::json)
                     from ticket_respuestas r join estudiantes e on e.id = r.estudiante_id where r.ticket_id = t.id)))
    from (select distinct on (curso) * from tickets order by curso, creado desc) t), '{}'::json));
end $$;

create or replace function public.mw_docente_ticket(p_token uuid, p_cursos text[], p_ticket jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  update tickets set activo = false where curso = any (p_cursos) and activo;
  if p_ticket is not null and jsonb_array_length(coalesce(p_ticket->'temas', '[]'::jsonb)) > 0 then
    foreach c in array p_cursos loop
      insert into tickets (curso, temas, titulos, n, hasta)
      values (c, p_ticket->'temas', coalesce(p_ticket->'titulos', '[]'::jsonb), least(greatest(coalesce((p_ticket->>'n')::int, 3), 1), 5),
              mw_ms() + 60000 * least(greatest(coalesce((p_ticket->>'min')::int, 15), 3), 60));
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
  values (p_id, id_e, least(greatest(coalesce(p_aciertos, 0), 0), 5), least(greatest(coalesce(p_total, 1), 1), 5),
          case when jsonb_typeof(p_detalle) = 'array' and jsonb_array_length(p_detalle) <= 5 then p_detalle else null end)
  on conflict do nothing;
  return json_build_object('ok', true);
end $$;

-- ---------- Misión semanal del curso: respuestas correctas entre todos ----------
create table if not exists public.misiones_curso (
  curso text not null,
  semana text not null,
  total int not null default 0,
  primary key (curso, semana)
);
create table if not exists public.aportes_semana (
  estudiante_id uuid not null references public.estudiantes (id) on delete cascade,
  semana text not null,
  n int not null default 0,
  primary key (estudiante_id, semana)
);
alter table public.misiones_curso enable row level security;
alter table public.aportes_semana enable row level security;
revoke all on public.misiones_curso, public.aportes_semana from anon, authenticated;

create or replace function public.mw_semana_actual() returns text
language sql stable as $$ select to_char(now() at time zone 'America/Santiago', 'IYYY-"S"IW') $$;

create or replace function public.mw_semana_info(c text, id_e uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('semana', mw_semana_actual(),
    'total', coalesce((select total from misiones_curso where curso = c and semana = mw_semana_actual()), 0),
    'meta', greatest(100, 20 * (select count(*) from estudiantes where curso = c)),
    'mio', coalesce((select n from aportes_semana where estudiante_id = id_e and semana = mw_semana_actual()), 0))
$$;

create or replace function public.mw_aportar(p_token uuid, p_n int) returns json
language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; s text := mw_semana_actual(); ya int; k int;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso into c from estudiantes where id = id_e;
  select coalesce((select n from aportes_semana where estudiante_id = id_e and semana = s), 0) into ya;
  k := least(greatest(coalesce(p_n, 0), 0), 20, greatest(0, 400 - ya));
  if k > 0 then
    insert into aportes_semana (estudiante_id, semana, n) values (id_e, s, k)
      on conflict (estudiante_id, semana) do update set n = aportes_semana.n + k;
    insert into misiones_curso (curso, semana, total) values (c, s, k)
      on conflict (curso, semana) do update set total = misiones_curso.total + k;
  end if;
  return json_build_object('ok', true, 'semana', mw_semana_info(c, id_e));
end $$;

-- Estudiante: tema de su curso, refuerzo pendiente, ticket de salida abierto y misión semanal
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
    'ticket', (select json_build_object('id', t.id, 'temas', t.temas, 'titulos', t.titulos, 'n', t.n, 'hasta', t.hasta) from tickets t
               where t.curso = c and t.activo and t.hasta > mw_ms()
                 and not exists (select 1 from ticket_respuestas r where r.ticket_id = t.id and r.estudiante_id = id_e)
               order by t.creado desc limit 1),
    'semana', mw_semana_info(c, id_e));
end $$;

revoke all on function public.mw_docente_tickets(uuid), public.mw_docente_ticket(uuid, text[], jsonb), public.mw_ticket_responder(uuid, bigint, int, int, jsonb),
  public.mw_aportar(uuid, int), public.mw_extra(uuid) from public, authenticated;
grant execute on function public.mw_docente_tickets(uuid), public.mw_docente_ticket(uuid, text[], jsonb), public.mw_ticket_responder(uuid, bigint, int, int, jsonb),
  public.mw_aportar(uuid, int), public.mw_extra(uuid) to anon;
revoke all on function public.mw_semana_info(text, uuid), public.mw_semana_actual() from public, anon, authenticated;
