-- ===================================================================
-- Pruebas de revision_2026_11_17.sql (bloque A). Ejecutar DESPUÉS de aplicar ese archivo.
-- Todo ocurre dentro de una transacción que termina en ROLLBACK: no deja rastros.
-- Usa estudiantes ficticios (RUT inventados que no son válidos para personas reales).
-- Resultado: una tabla con cada caso y "ok" true/false.
-- ===================================================================
begin;

create temp table resultados (n serial, caso text, ok boolean, detalle text) on commit drop;

-- datos ficticios
insert into cursos (curso) values ('7A'), ('8A') on conflict (curso) do nothing;
update cursos set abierto = true where curso in ('7A', '8A');
insert into estudiantes (id, curso, rut, nombre, clave_hash, codigo_ingreso, grupo) values
  ('00000000-0000-0000-0000-0000000000a1', '7A', '1-9', 'Prueba Uno Zacarias', null, 'ABC234', 1),
  ('00000000-0000-0000-0000-0000000000a2', '7A', '2-7', 'Prueba Dos Bartolomeo', extensions.crypt('clave1', extensions.gen_salt('bf')), null, 1);
insert into docentes (rut, clave_hash) values ('3-5', extensions.crypt('x', extensions.gen_salt('bf'))) on conflict do nothing;
insert into sesiones (token, docente_rut, expira) values ('00000000-0000-0000-0000-0000000000d1', '3-5', now() + interval '1 hour');
insert into sesiones (token, estudiante_id, expira) values ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a2', now() + interval '1 hour');
delete from intentos_ingreso where nivel in ('7', '8');

-- ---------- A1: mw_estudiante_estado ----------
do $$ declare r json; begin
  r := mw_estudiante_estado('1-9', '7');
  insert into resultados (caso, ok, detalle) values ('estado: RUT de la lista existe y no tiene clave', (r->>'existe')::boolean and not (r->>'tiene_clave')::boolean, r::text);
  insert into resultados (caso, ok, detalle) values ('estado: no entrega nombre ni curso', r->'nombre' is null and r->'curso' is null, r::text);
  r := mw_estudiante_estado('4-3', '7');
  insert into resultados (caso, ok, detalle) values ('estado: RUT que no está', not (r->>'existe')::boolean, r::text);
end $$;

-- ---------- A1: primer ingreso con código ----------
do $$ declare r json; begin
  r := mw_estudiante_entrar('1-9', '7', 'clave1');
  insert into resultados (caso, ok, detalle) values ('entrar: primera vez sin código se rechaza', r->>'error' = 'codigo', r::text);
  r := mw_estudiante_entrar('1-9', '7', 'clave1', 'ZZZ999');
  insert into resultados (caso, ok, detalle) values ('entrar: código incorrecto se rechaza', r->>'error' = 'codigo', r::text);
  r := mw_estudiante_entrar('1-9', '7', 'clave1', ' abc234 ');
  insert into resultados (caso, ok, detalle) values ('entrar: código correcto (minúsculas y espacios) crea la clave', (r->>'ok')::boolean, left(r::text, 80));
  insert into resultados (caso, ok, detalle) select 'entrar: el código se borra al crear la clave', codigo_ingreso is null and clave_hash is not null, null from estudiantes where id = '00000000-0000-0000-0000-0000000000a1';
  r := mw_estudiante_entrar('1-9', '7', 'clave1');
  insert into resultados (caso, ok, detalle) values ('entrar: con clave ya no pide código', (r->>'ok')::boolean, null);
  r := mw_estudiante_entrar('1-9', '7', 'otra');
  insert into resultados (caso, ok, detalle) values ('entrar: clave incorrecta', r->>'error' = 'clave_incorrecta', r::text);
end $$;

-- ---------- A1: restablecer renueva el código; el docente lo ve ----------
do $$ declare ok boolean; c1 text; c2 json; begin
  ok := mw_docente_restablecer('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000a1');
  select codigo_ingreso into c1 from estudiantes where id = '00000000-0000-0000-0000-0000000000a1';
  insert into resultados (caso, ok, detalle) values ('restablecer: genera código nuevo de 6 caracteres', ok and c1 ~ '^[A-Z2-9]{6}$', c1);
  c2 := mw_docente_codigos_ingreso('00000000-0000-0000-0000-0000000000d1');
  insert into resultados (caso, ok, detalle) values ('docente: ve el código en su lista', c2::text like '%' || c1 || '%', null);
  insert into resultados (caso, ok, detalle) values ('códigos: sin sesión docente no entrega nada', mw_docente_codigos_ingreso(gen_random_uuid()) is null, null);
end $$;

-- ---------- A2: mw_guardar ----------
update estudiantes set progreso = '{"v":3,"nivel":5,"xp":0,"stats":{"t1":{"i":10,"a":8}},"cofre":{"madera":100},"mochila":{},"cofreV2":1,"curva2":1}',
  actualizado = now() - interval '5 minutes', base_t = null where id = '00000000-0000-0000-0000-0000000000a2';
do $$ declare r boolean; antes jsonb; begin
  select progreso into antes from estudiantes where id = '00000000-0000-0000-0000-0000000000a2';
  r := mw_guardar('00000000-0000-0000-0000-0000000000b2', '{"nivel":6,"stats":{}}', 'u1');
  insert into resultados (caso, ok, detalle) values ('guardar: sin "v" se rechaza (false)', r = false, r::text);
  insert into resultados (caso, ok, detalle) select 'guardar: sin "v" deja alerta formato', exists (select 1 from alertas where estudiante_id = '00000000-0000-0000-0000-0000000000a2' and tipo = 'formato'), null;
  r := mw_guardar('00000000-0000-0000-0000-0000000000b2', '{"v":3,"nivel":5,"xp":0,"stats":{"t1":{"i":"mucho","a":8}},"cofre":{"madera":100},"cofreV2":1,"curva2":1}', 'u1');
  insert into resultados (caso, ok, detalle) values ('guardar: stats con texto se rechaza (false)', r = false, r::text);
  insert into resultados (caso, ok, detalle) select 'guardar: el rechazo no cambia lo guardado', progreso = antes, null from estudiantes where id = '00000000-0000-0000-0000-0000000000a2';
  r := mw_guardar('00000000-0000-0000-0000-0000000000b2', '{"v":3,"nivel":6,"xp":10,"stats":{"t1":{"i":20,"a":15}},"cofre":{"madera":120},"mochila":{},"cofreV2":1,"curva2":1}', 'u1');
  insert into resultados (caso, ok, detalle) values ('guardar: avance normal se acepta (true)', r = true, r::text);
  insert into resultados (caso, ok, detalle) select 'guardar: deja línea base de la hora', base_t is not null and base_resp = 20, base_xp::text from estudiantes where id = '00000000-0000-0000-0000-0000000000a2';
end $$;

-- Salto encadenado: cada guardado sube 5 niveles (pasa el tope por guardado) pero la hora acumula demasiado
do $$ declare r boolean; i int; nv int := 6; rechazado boolean := false; begin
  for i in 1..6 loop
    update estudiantes set actualizado = now() - interval '2 minutes', base_t = now() - interval '12 minutes' where id = '00000000-0000-0000-0000-0000000000a2';
    nv := nv + 5;
    r := mw_guardar('00000000-0000-0000-0000-0000000000b2', jsonb_build_object('v', 3, 'nivel', nv, 'xp', 0, 'stats', jsonb_build_object('t1', jsonb_build_object('i', 20 + i, 'a', 15)),
      'cofre', jsonb_build_object('madera', 120), 'mochila', '{}'::jsonb, 'cofreV2', 1, 'curva2', 1), 'u1');
    if r = false then rechazado := true; exit; end if;
  end loop;
  insert into resultados (caso, ok, detalle) values ('guardar: saltos encadenados de 5 niveles se rechazan por el tope de la hora', rechazado, 'se rechazó en el guardado ' || i);
  insert into resultados (caso, ok, detalle) select 'guardar: el salto encadenado deja alerta experiencia', exists (select 1 from alertas where estudiante_id = '00000000-0000-0000-0000-0000000000a2' and tipo = 'experiencia'), null;
end $$;

do $$ declare r boolean; begin
  r := mw_guardar(gen_random_uuid(), '{"v":3}', 'u1');
  insert into resultados (caso, ok, detalle) values ('guardar: sesión inválida devuelve false', r = false, null);
end $$;

-- ---------- A3: cofre del grupo ----------
update estudiantes set progreso = '{"v":3,"nivel":6,"xp":0,"stats":{},"cofre":{"madera":5000,"piedra":10},"mochila":{},"cofreV2":1,"curva2":1,"cofreGrupo":"7A-1"}',
  actualizado = now() - interval '1 minute' where id = '00000000-0000-0000-0000-0000000000a2';
insert into cofre_aportes (curso, grupo, estudiante_id, ultimo_envio) values ('7A', 1, '00000000-0000-0000-0000-0000000000a2', 5) on conflict do nothing;
update cofre_aportes set ultimo_envio = 5 where estudiante_id = '00000000-0000-0000-0000-0000000000a2';
do $$ declare r json; begin
  -- compartir 4.800 de madera teniendo 5.000 en el cofre personal: se acepta (antes se rechazaba por tiempo)
  r := mw_cofre_grupo2('00000000-0000-0000-0000-0000000000b2', 6, '{"madera":4800}', false);
  insert into resultados (caso, ok, detalle) values ('cofre: compartir lo que se tiene en el cofre personal se acepta', (r->>'ok')::boolean and not (r->>'rechazado')::boolean, r->>'recursos');
  -- volver a compartir 4.800 sin haber guardado: ya se depositó, el servidor sabe que no queda
  r := mw_cofre_grupo2('00000000-0000-0000-0000-0000000000b2', 7, '{"madera":4800}', false);
  insert into resultados (caso, ok, detalle) values ('cofre: repetir el depósito sin tener los recursos se rechaza', (r->>'rechazado')::boolean, null);
  -- depositar 9.000 de piedra teniendo 10
  r := mw_cofre_grupo2('00000000-0000-0000-0000-0000000000b2', 8, '{"piedra":9000}', false);
  insert into resultados (caso, ok, detalle) values ('cofre: depósito mayor al cofre personal se rechaza', (r->>'rechazado')::boolean, null);
  insert into resultados (caso, ok, detalle) select 'cofre: el rechazo deja alerta cofre', exists (select 1 from alertas where estudiante_id = '00000000-0000-0000-0000-0000000000a2' and tipo = 'cofre'), null;
  -- usar recursos del grupo (negativo) siempre se acepta
  r := mw_cofre_grupo2('00000000-0000-0000-0000-0000000000b2', 9, '{"madera":-100}', false);
  insert into resultados (caso, ok, detalle) values ('cofre: usar recursos del grupo se acepta', not (r->>'rechazado')::boolean, r->>'recursos');
end $$;

-- ---------- A4: buzón ----------
insert into sesiones (token, estudiante_id, expira) values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', now() + interval '1 hour');
do $$ declare r json; begin
  r := mw_reporte_enviar('00000000-0000-0000-0000-0000000000b1', 'idea', '', 'Que haya más mundos de nieve', 'Base');
  r := mw_reporte_enviar('00000000-0000-0000-0000-0000000000b1', 'problema', 'Otro', 'Bartolomeo es un weon, sáquenlo del grupo', 'Base');
  r := mw_reporte_enviar('00000000-0000-0000-0000-0000000000b1', 'problema', 'Otro', 'Zacarías ganó todo', 'Base');
  insert into resultados (caso, ok, detalle) select 'buzón: mensaje normal no se marca', not marcado, motivo_marca from reportes where texto = 'Que haya más mundos de nieve';
  insert into resultados (caso, ok, detalle) select 'buzón: insulto y nombre de compañero se marcan', marcado and motivo_marca like '%insulto%' and motivo_marca like '%bartolomeo%', motivo_marca from reportes where texto like 'Bartolomeo es%';
  insert into resultados (caso, ok, detalle) select 'buzón: su propio nombre no cuenta', not marcado, motivo_marca from reportes where texto = 'Zacarías ganó todo';
  insert into resultados (caso, ok, detalle) select 'buzón: el docente recibe el campo marcado', mw_docente_reportes('00000000-0000-0000-0000-0000000000d1')::text like '%"marcado" : true%' or mw_docente_reportes('00000000-0000-0000-0000-0000000000d1')::text like '%"marcado":true%', null;
end $$;

-- ---------- A1: límite de consultas fallidas (al final: bloquea el nivel por un minuto) ----------
do $$ declare r json; i int; begin
  for i in 1..10 loop r := mw_estudiante_estado((1000 + i)::text || '-1', '8'); end loop;
  r := mw_estudiante_estado('1-9', '8');
  insert into resultados (caso, ok, detalle) values ('estado: tras 10 consultas fallidas en un minuto pide esperar', r->>'error' = 'espera', r::text);
  r := mw_estudiante_estado('1-9', '7');
  insert into resultados (caso, ok, detalle) values ('estado: el límite es por nivel (7° sigue funcionando)', r->>'error' is null, r::text);
end $$;

select n, ok, caso, detalle from resultados order by n;
select count(*) filter (where ok) as correctas, count(*) filter (where not ok or ok is null) as fallidas from resultados;
rollback;
