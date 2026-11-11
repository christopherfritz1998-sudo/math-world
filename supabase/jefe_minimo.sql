-- Math World · mínimo de jugadores del jefe cooperativo según la actividad reciente del grupo.
--
-- Hasta ahora el jefe final exigía siempre 4 jugadores del grupo con sus misiones cumplidas.
-- El juego (juego/juego.js, jefeMin) ahora pide la mitad, redondeada hacia arriba, de los integrantes
-- del grupo que jugaron en los últimos 7 días, con piso de 2 y techo de 4. Para eso necesita que
-- mw_grupo_estado entregue «activos7». Mientras este archivo no se ejecute, el juego sigue usando 4.
--
-- Qué cambia: solo la función mw_grupo_estado (mismo nombre, mismos parámetros y permisos; agrega un campo
-- al JSON que devuelve). No crea ni modifica tablas ni datos.
-- activos7 = integrantes del mismo curso y grupo con ultimo_ping en los últimos 7 días
--            (quien consulta siempre cuenta, porque está jugando ahora). null si aún no tiene grupo.
--
-- Cómo aplicarlo: pegar y ejecutar una vez en el SQL Editor de Supabase.

create or replace function public.mw_grupo_estado(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare id_e uuid := mw_sesion_estudiante(p_token); c text; g smallint; n int;
begin
  if id_e is null then return json_build_object('ok', false); end if;
  select curso, grupo into c, g from estudiantes where id = id_e;
  if g is not null then
    select count(*) into n from estudiantes
    where curso = c and grupo = g and (id = id_e or ultimo_ping > now() - interval '7 days');
  end if;
  return json_build_object('ok', true, 'grupo', g, 'curso', c, 'activos7', n);
end $$;
