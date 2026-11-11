-- ===================================================================
-- Desafío «El trotamundos»: un monstruo gigante (1000 de vida) camina por un mundo al azar.
-- Todo el curso lo enfrenta a la vez: cada acierto le quita vida; un error sin escudo te derriba.
-- Cada estudiante puede caer 2 veces; al derrotarlo, ganan quienes siguen luchando en ese momento.
-- ===================================================================
create table if not exists public.trotamundos (
  curso text not null,
  n bigint not null,
  dano int not null default 0,
  derrotado timestamptz,
  ganadores jsonb not null default '[]'::jsonb,
  primary key (curso, n)
);
create table if not exists public.trotamundos_luchas (
  curso text not null,
  n bigint not null,
  estudiante_id uuid not null references public.estudiantes (id) on delete cascade,
  caidas int not null default 0,
  luchando boolean not null default false,
  golpes int not null default 0,
  ultimo timestamptz not null default now() - interval '1 hour',
  primary key (curso, n, estudiante_id)
);
alter table public.trotamundos enable row level security;
alter table public.trotamundos_luchas enable row level security;
revoke all on public.trotamundos, public.trotamundos_luchas from anon, authenticated;

create or replace function public.mw_trotamundos_estado(c text, p_n bigint, yo uuid, vida int) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('ok', true, 'vida', vida,
    'dano', coalesce((select least(vida, dano) from trotamundos where curso = c and n = p_n), 0),
    'derrotado', (select derrotado is not null from trotamundos where curso = c and n = p_n),
    'gane', coalesce((select ganadores ? yo::text from trotamundos where curso = c and n = p_n), false),
    'mio', (select json_build_object('caidas', caidas, 'luchando', luchando, 'golpes', golpes) from trotamundos_luchas where curso = c and n = p_n and estudiante_id = yo),
    'luchadores', coalesce((select json_agg(x order by x.luchando desc, x.golpes desc) from (
        select mw_nombre_corto(e.nombre) as nombre, l.luchando, l.golpes, l.caidas, (l.estudiante_id = yo) as yo
          from trotamundos_luchas l join estudiantes e on e.id = l.estudiante_id
         where l.curso = c and l.n = p_n limit 60) x), '[]'::json))
$$;

-- p_accion: 'estado' | 'entrar' | 'golpe' (p_dano 1..8) | 'caer' | 'salir'
create or replace function public.mw_trotamundos(p_token uuid, p_n bigint, p_accion text, p_dano int)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; d jsonb; ahora bigint := mw_ms(); vida int; l trotamundos_luchas; t trotamundos;
begin
  if id_e is null then return json_build_object('ok', false, 'error', 'sesion'); end if;
  select e.curso, k.desafio into c, d from estudiantes e join cursos k on k.curso = e.curso where e.id = id_e;
  if d is null or d->>'id' <> 'trotamundos' or (d->>'n')::bigint <> p_n then return json_build_object('ok', false, 'error', 'desafio'); end if;
  vida := coalesce((d->>'vida')::int, 1000);
  insert into trotamundos (curso, n) values (c, p_n) on conflict do nothing;
  if p_accion = 'estado' then return mw_trotamundos_estado(c, p_n, id_e, vida); end if;
  if ahora < (d->>'inicio')::bigint or ahora > (d->>'fin')::bigint + 3000 then
    return (mw_trotamundos_estado(c, p_n, id_e, vida)::jsonb || '{"ok": false, "error": "tiempo"}'::jsonb)::json;
  end if;
  select * into t from trotamundos where curso = c and n = p_n for update;
  insert into trotamundos_luchas (curso, n, estudiante_id) values (c, p_n, id_e) on conflict do nothing;
  select * into l from trotamundos_luchas where curso = c and n = p_n and estudiante_id = id_e for update;
  if p_accion = 'entrar' then
    if t.derrotado is not null then return (mw_trotamundos_estado(c, p_n, id_e, vida)::jsonb || '{"ok": false, "error": "derrotado"}'::jsonb)::json; end if;
    if l.caidas >= 2 then return (mw_trotamundos_estado(c, p_n, id_e, vida)::jsonb || '{"ok": false, "error": "sin_intentos"}'::jsonb)::json; end if;
    update trotamundos_luchas set luchando = true where curso = c and n = p_n and estudiante_id = id_e;
  elsif p_accion = 'golpe' then
    -- solo quien está luchando, como máximo un golpe cada 0,8 s y de 1 a 8 de daño
    if l.luchando and t.derrotado is null and l.ultimo < now() - interval '800 milliseconds' then
      update trotamundos_luchas set golpes = golpes + least(greatest(coalesce(p_dano, 1), 1), 8), ultimo = now()
        where curso = c and n = p_n and estudiante_id = id_e;
      update trotamundos set dano = dano + least(greatest(coalesce(p_dano, 1), 1), 8) where curso = c and n = p_n returning * into t;
      if t.dano >= vida then
        update trotamundos set derrotado = now(),
          ganadores = (select coalesce(jsonb_agg(estudiante_id::text), '[]'::jsonb) from trotamundos_luchas where curso = c and n = p_n and luchando)
          where curso = c and n = p_n;
      end if;
    end if;
  elsif p_accion = 'caer' then
    if l.luchando then update trotamundos_luchas set luchando = false, caidas = caidas + 1 where curso = c and n = p_n and estudiante_id = id_e; end if;
  elsif p_accion = 'salir' then
    update trotamundos_luchas set luchando = false where curso = c and n = p_n and estudiante_id = id_e;
  end if;
  return mw_trotamundos_estado(c, p_n, id_e, vida);
end $$;

-- El docente lanza el desafío: el trotamundos aparece en un mundo abierto al azar, con 1000 de vida
create or replace function public.mw_docente_desafio(p_token uuid, p_cursos text[], p_id text, p_seg int) returns json
language plpgsql security definer set search_path = public as $$
declare c text; meta int; t0 bigint; m text[]; extra jsonb;
begin
  if mw_sesion_docente(p_token) is null then return null; end if;
  if p_id is null then
    update cursos set desafio = desafio || jsonb_build_object('fin', mw_ms(), 'detenido', true)
      where curso = any (p_cursos) and desafio is not null and (desafio->>'fin')::bigint > mw_ms();
  else
    for c in select curso from cursos where curso = any (p_cursos) loop
      meta := case when p_id = 'curso' then 450
                   else greatest(15, 5 * (select count(*) from estudiantes e where e.curso = c and e.ultimo_ping > now() - interval '90 seconds')) end;
      t0 := mw_ms() + 11000;
      extra := '{}'::jsonb;
      if p_id in ('prisma', 'trotamundos') then
        m := mw_curso_mundos(c);
        extra := jsonb_build_object('mundo', m[1 + floor(random() * cardinality(m))::int]);
      end if;
      if p_id = 'trotamundos' then extra := extra || '{"vida": 1000}'::jsonb; end if;
      update cursos set desafio = jsonb_build_object('n', nextval('mw_desafio_n'), 'id', left(p_id, 20), 'inicio', t0,
          'fin', t0 + 1000 * least(greatest(coalesce(p_seg, 60), 10), 600), 'meta', meta) || extra
        where curso = c;
    end loop;
  end if;
  return mw_docente_desafios(p_token);
end $$;

revoke all on function public.mw_trotamundos_estado(text, bigint, uuid, int) from public, anon, authenticated;
revoke all on function public.mw_trotamundos(uuid, bigint, text, int) from public, authenticated;
grant execute on function public.mw_trotamundos(uuid, bigint, text, int) to anon;
