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
    salir: (token) => rpc('mw_salir', { p_token: token }, { keepalive: true }),
    docenteEntrar: (r, clave) => rpc('mw_docente_entrar', { p_rut: r, p_clave: clave }),
    docenteResumen: (token) => rpc('mw_docente_resumen', { p_token: token }),
    docenteRestablecer: (token, id) => rpc('mw_docente_restablecer', { p_token: token, p_id: id }),
    grupos: (token, nivel) => rpc('mw_grupos', { p_token: token, p_nivel: nivel }),
    docenteProgreso: (token) => rpc('mw_docente_progreso', { p_token: token }),
    docenteGuardar: (token, progreso, zona, keepalive) => rpc('mw_docente_guardar', { p_token: token, p_progreso: progreso, p_zona: zona }, { keepalive }),
  };
})(window);
