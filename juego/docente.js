// Math World — portal docente: conectados y progreso por curso.
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const CURSOS = [{ id: '7A', nombre: '7° A', nivel: '7basico' }, { id: '7B', nombre: '7° B', nivel: '7basico' }, { id: '8A', nombre: '8° A', nivel: '8basico' }, { id: '8B', nombre: '8° B', nivel: '8basico' }];
  const ZONAS_BASE = { base: 'En su base', u1: 'Unidad 1', u2: 'Unidad 2', u3: 'Unidad 3', u4: 'Unidad 4' };
  // "u1-g3" -> "Unidad 1 · Grupo 3"
  const ZONAS = new Proxy({}, { get: (_, z) => { const [u, g] = String(z || '').split('-g'); return ZONAS_BASE[u] ? ZONAS_BASE[u] + (g ? ` · Grupo ${g}` : '') : undefined; } });
  const MEJORAS = { pico: 'Pico', balde: 'Balde', espada: 'Espada de piedra', hacha2: 'Hacha de hierro', armadura: 'Armadura de cuero', pico2: 'Pico reforzado', espada2: 'Espada de cristal', armadura2: 'Armadura de cristal' };
  let token = null, datos = [], curso = '7A', abiertos = null;
  try { token = sessionStorage.getItem('mw_docente'); } catch (e) { /* */ }
  if (!token || !Nube.activo) { location.replace('./'); return; }

  const titulos = {};
  for (const n of ['7basico', '8basico']) for (const u of ['u1', 'u2', 'u3', 'u4']) titulos[`${n}:${u}`] = Preguntas.titulos(n, u);
  const nombreTema = (nivel, tema) => {
    for (const u of ['u1', 'u2', 'u3', 'u4']) { const t = titulos[`${nivel}:${u}`]; if (t && t[tema]) return { unidad: u, titulo: t[tema] }; }
    return { unidad: '', titulo: tema };
  };
  function hace(fecha) {
    if (!fecha) return 'Nunca';
    const s = (Date.now() - new Date(fecha).getTime()) / 1000;
    if (s < 3600) return `Hace ${Math.max(1, Math.round(s / 60))} min`;
    if (s < 86400) return `Hace ${Math.round(s / 3600)} h`;
    return `Hace ${Math.round(s / 86400)} días`;
  }
  function resumen(e) {
    const p = e.progreso || {};
    let a = 0, i = 0, peor = null;
    for (const [k, s] of Object.entries(p.stats || {})) {
      a += s.a; i += s.i;
      if (s.i >= 3) { const pct = s.a / s.i; if (!peor || pct < peor.pct) peor = { k, pct }; }
    }
    return { nivel: p.nivel || (e.tiene_clave ? 1 : 0), acierto: i ? Math.round((a / i) * 100) : null, intentos: i, peor, vencidos: p.vencidos || 0, muertes: p.muertes || 0 };
  }

  async function cargar() {
    try {
      const [r, a] = await Promise.all([Nube.docenteResumen(token), Nube.docenteCursos(token).catch(() => null)]);
      if (r === null) { try { sessionStorage.removeItem('mw_docente'); } catch (e) { /* */ } location.replace('./'); return; }
      datos = r; if (a) abiertos = a; $('error').hidden = true;
      pintarAcceso();
      $('actualizado').textContent = `Actualizado ${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
      pintar();
    } catch (e) {
      $('error').textContent = 'No se pudo conectar con la base de datos. Se reintentará en unos segundos.';
      $('error').hidden = false;
    }
  }

  function pintar() {
    $('tabs').innerHTML = CURSOS.map((c) => {
      const on = datos.filter((e) => e.curso === c.id && e.conectado).length;
      const cerrado = abiertos && abiertos[c.id] === false;
      return `<button type="button" class="tab" role="tab" data-c="${c.id}" aria-selected="${c.id === curso}">${c.nombre} <span class="punto ${on ? '' : 'off'}" aria-hidden="true"></span><span class="muted" style="font-size:13px">${on} en línea</span>${cerrado ? '<span class="cerrado-chip">· Cerrado</span>' : ''}</button>`;
    }).join('');
    document.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => { curso = b.dataset.c; pintar(); }));

    const lista = datos.filter((e) => e.curso === curso);
    const rs = lista.map(resumen);
    const entraron = lista.filter((e) => e.tiene_clave).length;
    const conAcierto = rs.filter((r) => r.acierto !== null);
    const promAcierto = conAcierto.length ? Math.round(conAcierto.reduce((s, r) => s + r.acierto, 0) / conAcierto.length) : null;
    const jugando = rs.filter((r) => r.nivel > 0);
    const promNivel = jugando.length ? (jugando.reduce((s, r) => s + r.nivel, 0) / jugando.length).toFixed(1).replace('.', ',') : '–';
    $('tarjetas').innerHTML = `
      <div class="tarjeta"><span>Conectados ahora</span><b>${lista.filter((e) => e.conectado).length}</b><small>de ${lista.length} estudiantes</small></div>
      <div class="tarjeta"><span>Ya entraron al juego</span><b>${entraron}</b><small>${lista.length - entraron} aún no crean su clave</small></div>
      <div class="tarjeta"><span>Nivel promedio</span><b>${promNivel}</b><small>de quienes ya juegan</small></div>
      <div class="tarjeta"><span>Acierto promedio</span><b>${promAcierto === null ? '–' : promAcierto + ' %'}</b><small>en todos los desafíos</small></div>`;
    $('titulo-lista').textContent = `Estudiantes de ${CURSOS.find((c) => c.id === curso).nombre}`;

    const q = $('buscar').value.trim().toLowerCase();
    const solo = $('solo-online').checked;
    const filas = lista.map((e, i) => ({ e, r: rs[i] }))
      .filter(({ e }) => (!q || e.nombre.toLowerCase().includes(q) || e.rut.toLowerCase().includes(q)) && (!solo || e.conectado))
      .sort((a, b) => (b.e.conectado - a.e.conectado) || a.e.nombre.localeCompare(b.e.nombre));
    $('filas').innerHTML = filas.length ? filas.map(({ e, r }) => {
      const nivel = CURSOS.find((c) => c.id === e.curso).nivel;
      const peor = r.peor ? nombreTema(nivel, r.peor.k).titulo : '–';
      return `<tr class="fila" data-id="${e.id}" tabindex="0">
        <td><strong>${esc(e.nombre)}</strong>${e.tiene_clave ? '' : '<br><small class="muted">Aún no entra</small>'}</td>
        <td><span class="est"><span class="punto ${e.conectado ? '' : 'off'}"></span>${e.conectado ? 'En línea' : esc(hace(e.ultimo))}</span></td>
        <td>${e.conectado ? esc(ZONAS[e.zona] || '–') : '<span class="muted">–</span>'}</td>
        <td>${r.nivel || '–'}</td>
        <td>${r.acierto === null ? '<span class="muted">Sin intentos</span>' : `<span class="barra"><i style="width:${r.acierto}%"></i></span>${r.acierto} %`}</td>
        <td>${esc(peor)}</td>
        <td>${r.vencidos}</td>
        <td>${r.muertes}</td>
      </tr>`;
    }).join('') : '<tr><td colspan="8" class="vacio">No hay estudiantes que coincidan.</td></tr>';
    document.querySelectorAll('tr.fila').forEach((tr) => {
      tr.addEventListener('click', () => detalle(tr.dataset.id));
      tr.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') detalle(tr.dataset.id); });
    });
  }

  function detalle(id) {
    const e = datos.find((x) => x.id === id); if (!e) return;
    const p = e.progreso || {}, r = resumen(e);
    const nivel = CURSOS.find((c) => c.id === e.curso).nivel;
    const porUnidad = {};
    for (const [k, s] of Object.entries(p.stats || {})) {
      const t = nombreTema(nivel, k);
      (porUnidad[t.unidad] = porUnidad[t.unidad] || []).push({ titulo: t.titulo, ...s });
    }
    const unidades = Object.keys(porUnidad).sort().map((u) => `
      <h4>${esc(ZONAS[u] || 'Otros')}</h4>
      <div class="temas">${porUnidad[u].map((t) => {
        const pct = t.i ? Math.round((t.a / t.i) * 100) : 0;
        return `<div class="tema"><span>${esc(t.titulo)}</span><span><span class="barra"><i style="width:${pct}%"></i></span>${t.a} de ${t.i} (${pct} %)</span></div>`;
      }).join('')}</div>`).join('');
    const rec = (o) => ['madera', 'piedra', 'agua', 'cristal'].map((k) => `${(o || {})[k] || 0} ${k}`).join(' · ');
    $('det').innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
        <div><h3 id="det-nombre">${esc(e.nombre)}</h3><span class="muted">RUT ${esc(e.rut)} · ${esc(CURSOS.find((c) => c.id === e.curso).nombre)}</span></div>
        <button type="button" class="btn" id="det-cerrar">Cerrar</button>
      </div>
      <div class="chips">
        <span class="chip">${e.conectado ? 'En línea · ' + esc(ZONAS[e.zona] || '') : 'Última vez: ' + esc(hace(e.ultimo))}</span>
        <span class="chip">Nivel ${r.nivel || '–'}</span>
        <span class="chip">Acierto ${r.acierto === null ? '–' : r.acierto + ' %'} (${r.intentos} intentos)</span>
        <span class="chip">Enemigos vencidos: ${r.vencidos}</span>
        <span class="chip">Derrotas: ${r.muertes}</span>
      </div>
      ${unidades || '<p class="muted">Todavía no responde desafíos.</p>'}
      <h4>Equipo y recursos</h4>
      <div class="muted">Equipo: ${(p.mejoras || []).map((m) => esc(MEJORAS[m] || m)).join(', ') || 'Solo el hacha inicial'}</div>
      <div class="muted">Cofre: ${rec(p.cofre)}</div>
      <div class="muted">Objetos colocados en su base: ${(p.colocados || []).length}</div>
      <h4>Clave</h4>
      ${e.tiene_clave ? `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="muted">Si el estudiante olvidó su clave, restablécela: la próxima vez que entre creará una nueva.</span>
        <button type="button" class="btn peligro" id="det-reset">Restablecer clave</button></div>` : '<span class="muted">Aún no crea su clave.</span>'}
      <div id="det-msg"></div>`;
    $('det-cerrar').addEventListener('click', () => $('detalle').close());
    const rb = $('det-reset');
    if (rb) rb.addEventListener('click', async () => {
      if (!confirm(`¿Restablecer la clave de ${e.nombre}?`)) return;
      try {
        await Nube.docenteRestablecer(token, e.id);
        $('det-msg').innerHTML = '<div class="msg">Clave restablecida. El estudiante creará una nueva al entrar.</div>';
        rb.disabled = true; cargar();
      } catch (err) { $('det-msg').innerHTML = '<div class="err">No se pudo restablecer. Inténtalo otra vez.</div>'; }
    });
    $('detalle').showModal();
  }

  // Jugar con su propio personaje
  const eleccion = { n: '7', pj: 'zorro' };
  $('jugar-pj').innerHTML = [['zorro', 'Zorro'], ['luna', 'Luna'], ['puma', 'Puma'], ['copihue', 'Copihue']].map(([id, n]) =>
    `<button type="button" class="op" data-pj="${id}" aria-pressed="${id === eleccion.pj}"><span class="retrato" style="background-image:url('assets/pj/${id}_nada.png')"></span>${n}</button>`).join('');
  const marcar = () => {
    document.querySelectorAll('#jugar-nivel .op').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.n === eleccion.n)));
    document.querySelectorAll('#jugar-pj .op').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pj === eleccion.pj)));
  };
  document.querySelectorAll('#jugar-nivel .op').forEach((b) => b.addEventListener('click', () => { eleccion.n = b.dataset.n; marcar(); }));
  document.querySelectorAll('#jugar-pj .op').forEach((b) => b.addEventListener('click', () => { eleccion.pj = b.dataset.pj; marcar(); }));
  $('btn-jugar').addEventListener('click', () => $('jugar').showModal());
  $('jugar-cerrar').addEventListener('click', () => $('jugar').close());
  $('jugar-ir').addEventListener('click', () => { location.href = `./?docente=${eleccion.n}&pj=${eleccion.pj}`; });

  // Abrir y cerrar el juego por curso
  function pintarAcceso() {
    const cont = $('acceso-cursos');
    if (!abiertos) { cont.innerHTML = '<span class="muted">No se pudo leer el estado de los cursos.</span>'; return; }
    cont.innerHTML = CURSOS.map((c) => {
      const ab = abiertos[c.id] !== false;
      const on = datos.filter((e) => e.curso === c.id && e.conectado).length;
      return `<div class="curso-acc ${ab ? 'abierto' : 'cerrado'}">
        <div><strong>${c.nombre}</strong><br><span class="est">${ab ? `Abierto · ${on} en línea` : 'Cerrado'}</span></div>
        <button type="button" class="interruptor" role="switch" aria-checked="${ab}" aria-label="Juego de ${c.nombre}: ${ab ? 'abierto' : 'cerrado'}" data-acc="${c.id}"></button>
      </div>`;
    }).join('');
    cont.querySelectorAll('[data-acc]').forEach((b) => b.addEventListener('click', () => cambiarAcceso([b.dataset.acc], abiertos[b.dataset.acc] === false)));
  }
  async function cambiarAcceso(cursos, abrir) {
    if (!abrir) {
      const n = datos.filter((e) => cursos.includes(e.curso) && e.conectado).length;
      const nombres = cursos.map((id) => CURSOS.find((c) => c.id === id).nombre).join(', ');
      if (!confirm(`¿Cerrar el juego para ${nombres}?${n ? `\n\n${n} ${n === 1 ? 'estudiante está jugando y saldrá' : 'estudiantes están jugando y saldrán'} en unos segundos. Su avance queda guardado.` : ''}`)) return;
    }
    document.querySelectorAll('[data-acc], #abrir-todos, #cerrar-todos').forEach((b) => { b.disabled = true; });
    try {
      const r = await Nube.docenteAbrir(token, cursos, abrir);
      if (r) abiertos = r;
      $('error').hidden = true;
    } catch (e) {
      $('error').textContent = 'No se pudo cambiar el acceso. Revisa tu conexión e inténtalo otra vez.';
      $('error').hidden = false;
    }
    document.querySelectorAll('#abrir-todos, #cerrar-todos').forEach((b) => { b.disabled = false; });
    pintarAcceso(); pintar();
  }
  $('abrir-todos').addEventListener('click', () => cambiarAcceso(CURSOS.map((c) => c.id), true));
  $('cerrar-todos').addEventListener('click', () => cambiarAcceso(CURSOS.map((c) => c.id), false));

  $('buscar').addEventListener('input', pintar);
  $('solo-online').addEventListener('change', pintar);
  $('btn-actualizar').addEventListener('click', cargar);
  $('btn-salir').addEventListener('click', () => { try { sessionStorage.removeItem('mw_docente'); } catch (e) { /* */ } location.replace('./'); });
  cargar();
  setInterval(cargar, 20000);
})();
