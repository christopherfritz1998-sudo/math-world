// Math World · Reto en pareja: dos compañeros resuelven juntos 6 problemas.
// En cada ronda uno CALCULA (elige la respuesta) y el otro VERIFICA (la aprueba o la corrige);
// los roles se turnan. Si el equipo acierta 4 o más, ambos ganan premio.
// Módulo aparte de juego.js: usa solo el puente window.MWJ y el canal en tiempo real de coop.js.
(function () {
  'use strict';
  const J = () => window.MWJ;
  const RONDAS = 6, META = 4;
  let P = null;   // estado del reto en curso

  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const codigoNuevo = () => Array.from({ length: 4 }, () => letras[Math.floor(Math.random() * letras.length)]).join('');
  const esc = (s) => J().esc(s), mate = (s) => J().mate(s), $ = (id) => document.getElementById(id);

  function tarjeta() {
    const M = J(); if (!M || M.esDocente() || !M.coop()) return '';
    return `<section class="tarjeta-mision pareja"><div class="fila"><strong>🤝 Reto en pareja</strong><small>Con un compañero de tu curso</small></div>
      <span class="nota">Uno calcula y el otro verifica: 6 problemas, se turnan. Si aciertan 4, ¡ambos ganan premio!</span>
      <button type="button" class="btn pri" data-pareja>Jugar en pareja</button></section>`;
  }

  function salir() {
    if (P && P.canal) { try { P.canal.emitir('par', { t: 'chao' }); P.canal.salir(); } catch (e) { /* */ } }
    P = null;
  }

  function abrirInicio(err) {
    const M = J();
    M.ui.abrir(`<div class="modal-cab"><div><span class="etq">Reto en pareja</span><h2 id="modal-titulo">🤝 Jugar en pareja</h2></div><button type="button" class="btn" id="pa-cerrar">Cerrar</button></div>
      <p class="enunciado" style="font-size:18px">En cada ronda, <b>uno calcula</b> y <b>el otro verifica</b>. Conversen: ¡es trabajo en equipo!</p>
      <section class="tarjeta-mision"><strong>Crear un reto</strong><span class="nota">Te damos un código para que se lo digas a tu compañero.</span><button type="button" class="btn pri" id="pa-crear">Crear reto</button></section>
      <section class="tarjeta-mision"><strong>Unirme a un reto</strong><span class="nota">Escribe el código que te dio tu compañero.</span>
        <input id="pa-codigo" class="du-codigo" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="ABCD" aria-label="Código del reto">
        <button type="button" class="btn" id="pa-unirme">Unirme</button>${err ? `<small class="nota" style="color:#ff9a8a">${esc(err)}</small>` : ''}</section>`, '', () => salir());
    $('pa-cerrar').addEventListener('click', () => M.ui.cerrar());
    $('pa-crear').addEventListener('click', () => conectar(codigoNuevo(), true));
    $('pa-unirme').addEventListener('click', () => {
      const c = String($('pa-codigo').value || '').toUpperCase().replace(/[^A-Z]/g, '');
      if (c.length !== 4) return abrirInicio('El código tiene 4 letras.');
      conectar(c, false);
    });
    $('pa-codigo').addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') $('pa-unirme').click(); });
  }

  function conectar(codigo, anfitrion) {
    const M = J();
    const yo = `${M.nombreJug()}-${Math.random().toString(36).slice(2, 7)}`;
    const canal = new window.Coop.Canal(`mw-par-${M.cursoCanal()}-${codigo}`, yo, { nombre: M.nombreJug(), host: anfitrion });
    P = { codigo, anfitrion, yo, canal, otro: null, otroNombre: '', ronda: -1, puntos: 0, d: null, calc: null, elegida: null, fase: 'espera', hist: [] };
    canal.alCambiarPresencia = (pres) => {
      if (!P || P.canal !== canal) return;
      const otros = Object.entries(pres).filter(([k]) => k !== yo);
      if (P.otro && !otros.some(([k]) => k === P.otro) && P.fase !== 'fin') { const n = P.otroNombre; salir(); return avisoFin(`${n || 'Tu compañero'} salió del reto.`); }
      if (!P.otro && otros.length) {
        const [k, meta] = otros[0];
        if (Boolean(meta.host) === anfitrion) return;   // dos anfitriones o dos invitados con el mismo código: no se emparejan
        P.otro = k; P.otroNombre = meta.nombre || 'Compañero';
        if (anfitrion) setTimeout(() => siguienteRonda(), 900);
        pintar();
      }
    };
    canal.on('par', (m) => recibir(m));
    pintar();
  }

  function recibir(m) {
    if (!P || !m) return;
    if (m.t === 'chao') { const n = P.otroNombre; salir(); return avisoFin(`${n || 'Tu compañero'} salió del reto.`); }
    if (m.t === 'ronda') { P.ronda = m.i; P.d = m.d; P.calc = m.calc; P.elegida = null; P.fase = 'calcular'; pintar(); }
    else if (m.t === 'calc' && m.i === P.ronda) { P.elegida = m.elegida; P.fase = 'verificar'; pintar(); }
    else if (m.t === 'verif' && m.i === P.ronda) cerrarRonda(m.final, m.aprobo);
  }

  // solo el anfitrión genera las preguntas, así ambos ven exactamente lo mismo
  function siguienteRonda() {
    if (!P || !P.anfitrion) return;
    const M = J(), i = P.ronda + 1;
    if (i >= RONDAS) return;
    const d = window.Preguntas.nuevo(M.S().curso, M.unidad(), 2, M.S().stats);
    const msg = { t: 'ronda', i, calc: i % 2 === 0 ? P.yo : P.otro, d: { tema: d.tema, titulo: d.titulo, enunciado: d.enunciado, opciones: d.opciones, correcta: d.correcta, pista: d.pista, explicacion: d.explicacion } };
    P.canal.emitir('par', msg); recibir(msg);
  }

  function elegir(i) {
    if (!P || P.fase !== 'calcular' || P.calc !== P.yo) return;
    P.elegida = i; P.fase = 'verificar';
    J().registrar(P.d.tema, i === P.d.correcta);
    P.canal.emitir('par', { t: 'calc', i: P.ronda, elegida: i });
    pintar();
  }
  function verificar(aprobo, corregida) {
    if (!P || P.fase !== 'verificar' || P.calc === P.yo) return;
    const final = aprobo ? P.elegida : corregida;
    J().registrar(P.d.tema, final === P.d.correcta);
    P.canal.emitir('par', { t: 'verif', i: P.ronda, final, aprobo });
    cerrarRonda(final, aprobo);
  }
  function cerrarRonda(final, aprobo) {
    if (!P || P.fase === 'resultado') return;
    const ok = final === P.d.correcta;
    if (ok) P.puntos += 1;
    P.hist.push(ok); P.fase = 'resultado'; P.final = final; P.aprobo = aprobo;
    J().sfx(ok ? 'acierto' : 'error');
    pintar();
    if (P.ronda + 1 >= RONDAS) setTimeout(() => terminar(), 2600);
    else if (P.anfitrion) setTimeout(() => siguienteRonda(), 3200);
  }

  function terminar() {
    if (!P) return;
    const M = J(), gano = P.puntos >= META, pts = P.puntos, otro = P.otroNombre;
    P.fase = 'fin';
    let txt = '';
    if (gano) { txt = M.darPremio(M.paquete(5, 3, true), 60 + 10 * pts); M.contar('pareja'); M.celebrar(); M.sfx('logro'); }
    salir();
    M.ui.abrir(`<div class="modal-cab"><div><span class="etq">Reto en pareja</span><h2 id="modal-titulo">${gano ? '🏆 ¡Lo lograron!' : '🤝 ¡Buen intento!'}</h2></div></div>
      <p class="enunciado" style="font-size:18px">Tú y ${esc(otro)} acertaron <b>${pts} de ${RONDAS}</b>.${gano ? ` Ganaste: ${esc(txt)}.` : ` Necesitaban ${META} para el premio: ¡inténtenlo otra vez!`}</p>
      <div class="acciones"><span></span><button type="button" class="btn pri" id="pa-ok" data-foco>Cerrar</button></div>`);
    $('pa-ok').addEventListener('click', () => M.ui.cerrar());
  }
  function avisoFin(t) {
    const M = J();
    M.ui.abrir(`<div class="modal-cab"><div><span class="etq">Reto en pareja</span><h2 id="modal-titulo">🤝 Reto terminado</h2></div></div><p class="enunciado" style="font-size:18px">${esc(t)}</p>
      <div class="acciones"><span></span><button type="button" class="btn pri" id="pa-ok" data-foco>Cerrar</button></div>`);
    $('pa-ok').addEventListener('click', () => M.ui.cerrar());
  }

  function pintar() {
    const M = J(); if (!P) return;
    const cab = `<div class="modal-cab"><div><span class="etq">Reto en pareja · código <b>${P.codigo}</b>${P.ronda >= 0 ? ` · ronda ${P.ronda + 1} de ${RONDAS}` : ''}</span><h2 id="modal-titulo">🤝 ${P.otro ? `Con ${esc(P.otroNombre)}` : 'Esperando a tu compañero…'}</h2></div><div class="pildoras"><span class="pildora">Aciertos: ${P.puntos}</span></div></div>`;
    let cuerpo;
    if (!P.otro || !P.d) {
      cuerpo = `<p class="enunciado" style="font-size:20px">${P.anfitrion ? `Dile a tu compañero este código: <b style="font-size:30px;letter-spacing:4px">${P.codigo}</b>` : 'Conectando con el reto…'}</p><p class="nota">Ambos deben estar en el mismo curso. El reto empieza solo cuando se conecten los dos.</p>`;
    } else {
      const d = P.d, calculo = P.calc === P.yo;
      const alts = (marcar) => `<div class="alternativas">${d.opciones.map((o, i) => { const c = marcar(i); return `<button type="button" class="alt ${c === 'pa-correcta' ? 'bien' : c === 'pa-mal' ? 'mal' : ''}" data-pa="${i}" aria-pressed="${c === 'pa-elegida'}" ${c === 'pa-bloq' || c === 'pa-correcta' || c === 'pa-mal' ? 'disabled' : ''}>${mate(o)}</button>`; }).join('')}</div>`;
      const rol = calculo ? '🧮 Te toca <b>calcular</b>: elige la respuesta.' : `🔎 Te toca <b>verificar</b>: ${esc(P.otroNombre)} calcula y tú revisas.`;
      let zona;
      if (P.fase === 'calcular') zona = calculo ? alts(() => '') : `${alts(() => 'pa-bloq')}<p class="nota">Esperando la respuesta de ${esc(P.otroNombre)}… ¡pueden conversarlo!</p>`;
      else if (P.fase === 'verificar') {
        zona = calculo ? `${alts((i) => (i === P.elegida ? 'pa-elegida' : 'pa-bloq'))}<p class="nota">${esc(P.otroNombre)} está revisando tu respuesta…</p>`
          : `${alts((i) => (i === P.elegida ? 'pa-elegida' : ''))}<p class="enunciado" style="font-size:17px">${esc(P.otroNombre)} eligió la marcada. ¿Está bien?</p>
             <div class="acciones"><button type="button" class="btn pri" id="pa-bien">✔ Está bien</button><span class="nota">Si está mal, toca la alternativa correcta.</span></div>`;
      } else {
        const ok = P.final === d.correcta;
        zona = `${alts((i) => (i === d.correcta ? 'pa-correcta' : i === P.final ? 'pa-mal' : 'pa-bloq'))}
          ${ok ? `<div class="mensaje bien" role="status">✅ ¡Correcto${P.aprobo === false ? ' gracias a la corrección' : ''}! ${mate(d.explicacion || '')}</div>` : M.pasoAPaso(d, P.aprobo === false ? 'La corrección tampoco era.' : 'No era esa.', '')}`;
      }
      cuerpo = `<p class="nota">${rol}</p><p class="enunciado">${mate(d.enunciado)}</p>${zona}`;
    }
    M.ui.abrir(`${cab}${cuerpo}<div class="acciones"><span></span><button type="button" class="btn" id="pa-salir">Salir del reto</button></div>`, 'pareja-modal', () => salir());
    $('pa-salir').addEventListener('click', () => M.ui.cerrar());
    document.querySelectorAll('#modal [data-pa]').forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.pa);
      if (P.fase === 'calcular') elegir(i);
      else if (P.fase === 'verificar' && P.calc !== P.yo && i !== P.elegida) verificar(false, i);
    }));
    const bb = $('pa-bien'); if (bb) bb.addEventListener('click', () => verificar(true));
    M.ui.teclas = (e) => { if (/^[1-4]$/.test(e.key)) { const b = document.querySelector(`#modal [data-pa="${Number(e.key) - 1}"]`); if (b) b.click(); } };
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-pareja]'); if (!b) return;
    const M = J(); if (!M || !window.Coop || !M.coop()) return;
    abrirInicio();
  });
  window.MWPareja = { tarjeta };
})();
