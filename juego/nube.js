// Math World — conexión con la base de datos (Supabase, llamadas RPC sin librerías).
(function (global) {
  'use strict';
  const cfg = global.MW_CONFIG || {};
  const activo = Boolean(cfg.supabaseUrl && cfg.supabaseKey);

  async function rpc(fn, args, opciones = {}) {
    if (!activo) throw new Error('sin_conexion');
    const r = await fetch(`${cfg.supabaseUrl}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: cfg.supabaseKey, Authorization: `Bearer ${cfg.supabaseKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
      keepalive: Boolean(opciones.keepalive),
    });
    if (!r.ok) throw new Error(`error_${r.status}`);
    const txt = await r.text();
    return txt ? JSON.parse(txt) : null;
  }

  // Valida un RUT chileno (módulo 11) y lo devuelve como "12345678-K", o null.
  function rut(texto) {
    const r = String(texto || '').replace(/[^0-9kK]/g, '').toUpperCase();
    if (r.length < 2) return null;
    const cuerpo = r.slice(0, -1), dv = r.slice(-1);
    if (!/^\d{6,9}$/.test(cuerpo)) return null;
    let s = 0, m = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) { s += Number(cuerpo[i]) * m; m = m === 7 ? 2 : m + 1; }
    const res = 11 - (s % 11);
    const esperado = res === 11 ? '0' : res === 10 ? 'K' : String(res);
    return esperado === dv ? `${cuerpo}-${dv}` : null;
  }

  global.Nube = {
    activo,
    rut,
    estado: (r, nivel) => rpc('mw_estudiante_estado', { p_rut: r, p_nivel: nivel }),
    entrar: (r, nivel, clave) => rpc('mw_estudiante_entrar', { p_rut: r, p_nivel: nivel, p_clave: clave }),
    guardar: (token, progreso, zona, keepalive) => rpc('mw_guardar', { p_token: token, p_progreso: progreso, p_zona: zona }, { keepalive }),
    ping: (token, zona) => rpc('mw_ping', { p_token: token, p_zona: zona }),
    latido: (token, zona) => rpc('mw_latido', { p_token: token, p_zona: zona }),
    docenteCursos: (token) => rpc('mw_docente_cursos', { p_token: token }),
    docenteAbrir: (token, cursos, abierto) => rpc('mw_docente_abrir', { p_token: token, p_cursos: cursos, p_abierto: abierto }),
    docenteMundos: (token) => rpc('mw_docente_mundos', { p_token: token }),
    docenteMundo: (token, cursos, unidad, abierta) => rpc('mw_docente_mundo', { p_token: token, p_cursos: cursos, p_unidad: unidad, p_abierta: abierta }),
    desafio: (token) => rpc('mw_desafio', { p_token: token }),
    desafioResponder: (token, n, ok) => rpc('mw_desafio_responder', { p_token: token, p_n: n, p_ok: ok }),
    obra: (token, id, curso, grupo) => rpc('mw_obra', { p_token: token, p_id: id, p_curso: curso || null, p_grupo: grupo || null }),
    grupoEstado: (token) => rpc('mw_grupo_estado', { p_token: token }),
    grupoUnirse: (token, codigo) => rpc('mw_grupo_unirse', { p_token: token, p_codigo: codigo }),
    docenteGrupos: (token) => rpc('mw_docente_grupos', { p_token: token }),
    docenteMover: (token, id, grupo) => rpc('mw_docente_mover', { p_token: token, p_estudiante: id, p_grupo: grupo }),
    docenteCodigos: (token, curso) => rpc('mw_docente_codigos', { p_token: token, p_curso: curso }),
    obraAportar: (token, id, recursos) => rpc('mw_obra_aportar', { p_token: token, p_id: id, p_recursos: recursos }),
    cofreGrupo: (token, envio, delta) => rpc('mw_cofre_grupo', { p_token: token, p_envio: envio, p_delta: delta }),
    cofreGrupo2: (token, envio, delta, inicial) => rpc('mw_cofre_grupo2', { p_token: token, p_envio: envio, p_delta: delta, p_inicial: Boolean(inicial) }),
    pedido: (token, accion, recurso, cantidad, id) => rpc('mw_pedido', { p_token: token, p_accion: accion, p_recurso: recurso, p_cantidad: cantidad, p_id: id }),
    cofreHistorial: (token) => rpc('mw_cofre_historial', { p_token: token }),
    gruposSemana: (token) => rpc('mw_grupos_semana', { p_token: token }),
    informe: (enlace) => rpc('mw_informe', { p_enlace: enlace }),
    cerradura: (token, parte) => rpc('mw_cerradura', { p_token: token, p_parte: parte }),
    trotamundos: (token, n, accion, dano) => rpc('mw_trotamundos', { p_token: token, p_n: n, p_accion: accion, p_dano: dano }),
    docenteEnlace: (token, id, accion) => rpc('mw_docente_enlace', { p_token: token, p_estudiante: id, p_accion: accion }),
    docenteAlertas: (token) => rpc('mw_docente_alertas', { p_token: token }),
    docenteObras: (token) => rpc('mw_docente_obras', { p_token: token }),
    prismaReclamar: (token, n, grupo) => rpc('mw_prisma_reclamar', { p_token: token, p_n: n, p_grupo: grupo }),
    docenteDesafios: (token) => rpc('mw_docente_desafios', { p_token: token }),
    docenteDesafio: (token, cursos, id, seg) => rpc('mw_docente_desafio', { p_token: token, p_cursos: cursos, p_id: id, p_seg: seg }),
    docenteConfig: (token) => rpc('mw_docente_config', { p_token: token }),
    docenteAnuncio: (token, cursos, texto, min) => rpc('mw_docente_anuncio', { p_token: token, p_cursos: cursos, p_texto: texto, p_min: min }),
    docenteChat: (token, cursos, on) => rpc('mw_docente_chat', { p_token: token, p_cursos: cursos, p_on: on }),
    reporteEnviar: (token, tipo, categoria, texto, zona) => rpc('mw_reporte_enviar', { p_token: token, p_tipo: tipo, p_categoria: categoria, p_texto: texto, p_zona: zona }),
    docenteReportes: (token) => rpc('mw_docente_reportes', { p_token: token }),
    docenteReporteLeido: (token, ids, leido) => rpc('mw_docente_reporte_leido', { p_token: token, p_ids: ids, p_leido: leido }),
    comercioListar: (token) => rpc('mw_comercio_listar', { p_token: token }),
    comercioCrear: (token, da, pide) => rpc('mw_comercio_crear', { p_token: token, p_da: da, p_pide: pide }),
    comercioAceptar: (token, id) => rpc('mw_comercio_aceptar', { p_token: token, p_id: id }),
    comercioCancelar: (token, id) => rpc('mw_comercio_cancelar', { p_token: token, p_id: id }),
    comercioCobrar: (token) => rpc('mw_comercio_cobrar', { p_token: token }),
    salir: (token) => rpc('mw_salir', { p_token: token }, { keepalive: true }),
    invitadoRegistrar: (nombre, usuario, nivel, clave, pj) => rpc('mw_invitado_registrar', { p_nombre: nombre, p_usuario: usuario, p_nivel: nivel, p_clave: clave, p_pj: pj }),
    invitadoEntrar: (usuario, clave) => rpc('mw_invitado_entrar', { p_usuario: usuario, p_clave: clave }),
    docenteInvitado: (token, id, accion) => rpc('mw_docente_invitado', { p_token: token, p_id: id, p_accion: accion }),
    base: (token) => rpc('mw_base', { p_token: token }),
    baseCasa: (token, id) => rpc('mw_base_casa', { p_token: token, p_id: id }),
    baseComun: (token, op) => rpc('mw_base_comun', { p_token: token, p_op: op }),
    clan: (token) => rpc('mw_clan', { p_token: token }),
    clanVotar: (token, candidato) => rpc('mw_clan_votar', { p_token: token, p_candidato: candidato }),
    clanNombre: (token, nombre) => rpc('mw_clan_nombre', { p_token: token, p_nombre: nombre }),
    guerra: (token) => rpc('mw_guerra', { p_token: token }),
    guerraSumar: (token, n, tarea, cant) => rpc('mw_guerra_sumar', { p_token: token, p_n: n, p_tarea: tarea, p_cant: cant }),
    guerraCampeon: (token, n, campeon) => rpc('mw_guerra_campeon', { p_token: token, p_n: n, p_campeon: campeon }),
    guerraDueloFin: (token, n, res) => rpc('mw_guerra_duelo_fin', { p_token: token, p_n: n, p_res: res }),
    docenteGuerras: (token) => rpc('mw_docente_guerras', { p_token: token }),
    docenteGuerra: (token, cursos, op) => rpc('mw_docente_guerra', { p_token: token, p_cursos: cursos, p_op: op }),
    docenteClan: (token, curso, grupo, accion) => rpc('mw_docente_clan', { p_token: token, p_curso: curso, p_grupo: grupo, p_accion: accion }),
    extra: (token) => rpc('mw_extra', { p_token: token }),
    refuerzoCompletar: (token, id) => rpc('mw_refuerzo_completar', { p_token: token, p_id: id }),
    docenteFoco: (token, cursos, foco) => rpc('mw_docente_foco', { p_token: token, p_cursos: cursos, p_foco: foco }),
    docenteFocos: (token) => rpc('mw_docente_focos', { p_token: token }),
    docenteRefuerzo: (token, estudiante, tema, titulo, meta, accion) => rpc('mw_docente_refuerzo', { p_token: token, p_estudiante: estudiante, p_tema: tema, p_titulo: titulo, p_meta: meta, p_accion: accion }),
    docenteRefuerzos: (token) => rpc('mw_docente_refuerzos', { p_token: token }),
    salon: () => rpc('mw_salon', {}),
    ticketResponder: (token, id, aciertos, total, detalle) => rpc('mw_ticket_responder', { p_token: token, p_id: id, p_aciertos: aciertos, p_total: total, p_detalle: detalle }),
    aportar: (token, n) => rpc('mw_aportar', { p_token: token, p_n: n }),
    docenteTicket: (token, cursos, ticket) => rpc('mw_docente_ticket', { p_token: token, p_cursos: cursos, p_ticket: ticket }),
    docenteTickets: (token) => rpc('mw_docente_tickets', { p_token: token }),
    torreRegistrar: (token, piso) => rpc('mw_torre_registrar', { p_token: token, p_piso: piso }),
    torreRanking: (token) => rpc('mw_torre_ranking', { p_token: token }),
    liga: (token) => rpc('mw_liga', { p_token: token }),
    docenteEntrar: (r, clave) => rpc('mw_docente_entrar', { p_rut: r, p_clave: clave }),
    docenteResumen: (token) => rpc('mw_docente_resumen', { p_token: token }),
    docenteRestablecer: (token, id) => rpc('mw_docente_restablecer', { p_token: token, p_id: id }),
    grupos: (token, nivel) => rpc('mw_grupos', { p_token: token, p_nivel: nivel }),
    docenteProgreso: (token) => rpc('mw_docente_progreso', { p_token: token }),
    docenteGuardar: (token, progreso, zona, keepalive) => rpc('mw_docente_guardar', { p_token: token, p_progreso: progreso, p_zona: zona }, { keepalive }),
  };
})(window);
