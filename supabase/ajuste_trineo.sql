-- ===================================================================
-- Ajuste de nivel por el abuso del minijuego del trineo (aplicado el 2026-11-16, una sola vez).
-- 26 estudiantes (25 de 7°B y 1 de 8°B) subieron de nivel manteniendo Intro en el trineo.
-- No existe historial de niveles, así que el nivel previo se estimó con su experiencia total:
--   nueva experiencia = el mayor entre
--     · lo que queda al quitar 12 de experiencia por cada partida de trineo sobre 15, con un máximo de
--       11,9 por pregunta respondida (lo que gana un buen jugador honesto, percentil 75), y
--     · 9,2 por pregunta respondida (un jugador honesto típico, mediana), sin superar lo que tenía.
-- Los premios de nivel pendientes quedaron en 0 y se cerraron sus sesiones.
-- El progreso completo anterior quedó en public.respaldo_ajuste_trineo. Para revertir a un estudiante:
--   update estudiantes e set progreso = r.progreso from respaldo_ajuste_trineo r where r.estudiante_id = e.id and e.id = '<id>';
-- ===================================================================
create table if not exists public.respaldo_ajuste_trineo (
  estudiante_id uuid not null, progreso jsonb not null, nivel_antes int, nivel_despues int, creado timestamptz not null default now()
);
alter table public.respaldo_ajuste_trineo enable row level security;
revoke all on public.respaldo_ajuste_trineo from anon, authenticated;

do $$
declare r record; tot numeric; nuevo numeric; lv int; resto numeric;
begin
  for r in select id, progreso, (progreso->>'nivel')::int nivel, coalesce((progreso->>'xp')::numeric, 0) xp,
                  coalesce((progreso->'cont'->>'mj_trineo')::int, 0) trineo,
                  coalesce((select sum((value->>'i')::int) from jsonb_each(progreso->'stats')), 0) resp
             from estudiantes where (progreso->'cont'->>'mj_trineo')::int > 50 for update loop
    select coalesce(sum(least(620, 60 + 40 * l)), 0) + r.xp into tot from generate_series(1, r.nivel - 1) l;
    nuevo := greatest(least(tot - 12 * greatest(r.trineo - 15, 0), 11.9 * r.resp), least(tot, 9.2 * r.resp));
    lv := 1; resto := nuevo;
    while resto >= least(620, 60 + 40 * lv) loop resto := resto - least(620, 60 + 40 * lv); lv := lv + 1; end loop;
    insert into respaldo_ajuste_trineo (estudiante_id, progreso, nivel_antes, nivel_despues) values (r.id, r.progreso, r.nivel, lv);
    update estudiantes set progreso = progreso || jsonb_build_object('nivel', lv, 'xp', floor(resto), 'premiosNivel', 0, 'ajusteTrineo', mw_ms())
     where id = r.id;
  end loop;
  delete from sesiones where estudiante_id in (select estudiante_id from respaldo_ajuste_trineo);
end $$;
