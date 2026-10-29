// Math World — portal docente: conectados y progreso por curso.
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const CURSOS = [{ id: '7A', nombre: '7° A', nivel: '7basico' }, { id: '7B', nombre: '7° B', nivel: '7basico' }, { id: '8A', nombre: '8° A', nivel: '8basico' }, { id: '8B', nombre: '8° B', nivel: '8basico' }];
  const ZONAS_BASE = { base: 'En su base', pieza: 'En su pieza', u1: 'Unidad 1', u2: 'Unidad 2', u3: 'Unidad 3', u4: 'Unidad 4' };
  // "u1-g3" -> "Unidad 1 · Grupo 3"
  const ZONAS = new Proxy({}, { get: (_, z) => { const [u, g] = String(z || '').split('-g'); return ZONAS_BASE[u] ? ZONAS_BASE[u] + (g ? ` · Grupo ${g}` : '') : undefined; } });
  const MEJORAS = { pico: 'Pico', balde: 'Balde', cana: 'Caña de pescar', ahumador: 'Ahumador', hacha3: 'Hacha ancestral', amuleto: 'Amuleto ancestral', espada: 'Espada de piedra', hacha2: 'Hacha de hierro', armadura: 'Armadura de cuero', pico2: 'Pico reforzado', espada2: 'Espada de cristal', armadura2: 'Armadura de cristal', cantimplora: 'Cantimplora', pico3: 'Pico de cobre', espada3: 'Espada de oro', armadura3: 'Armadura de oro', casco: 'Casco de minero', pico4: 'Pico de plata', espada4: 'Espada de amatista', armadura4: 'Armadura de plata', abrigo: 'Abrigo de piel', pico5: 'Pico de escarcha', espada5: 'Espada de hielo', armadura5: 'Armadura de escarcha', espada6: 'Espada prismática', armadura6: 'Armadura prismática', pala: 'Pala de arqueólogo', pala2: 'Pala de obsidiana', antorcha_esfinge: 'Antorcha de la esfinge', guantes: 'Guantes térmicos', cincel: 'Cincel de cristal', pico_magma: 'Pico de magma', corazon_cristal: 'Corazón de cristal', piolet: 'Piolet de escarcha', crampones: 'Crampones de hielo', frasco_aurora: 'Frasco de aurora', pico_eterno: 'Pico de hielo eterno', cetro_aurora: 'Cetro de la aurora' };
  let token = null, datos = [], curso = '7A', abiertos = null, mundos = null;
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
      const [r, a, m] = await Promise.all([Nube.docenteResumen(token), Nube.docenteCursos(token).catch(() => null), Nube.docenteMundos(token).catch(() => null)]);
      if (r === null) { try { sessionStorage.removeItem('mw_docente'); } catch (e) { /* */ } location.replace('./'); return; }
      datos = r; if (a) abiertos = a; if (m) mundos = m; $('error').hidden = true;
      pintarAcceso(); pintarMundos(); pintarDesafios();
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
        <td>${e.grupo ? `G${e.grupo}` : '<span class="muted">–</span>'}</td>
        <td><span class="est"><span class="punto ${e.conectado ? '' : 'off'}"></span>${e.conectado ? 'En línea' : esc(hace(e.ultimo))}</span></td>
        <td>${e.conectado ? esc(ZONAS[e.zona] || '–') : '<span class="muted">–</span>'}</td>
        <td>${r.nivel || '–'}</td>
        <td>${r.acierto === null ? '<span class="muted">Sin intentos</span>' : `<span class="barra"><i style="width:${r.acierto}%"></i></span>${r.acierto} %`}</td>
        <td>${esc(peor)}</td>
        <td>${r.vencidos}</td>
        <td>${r.muertes}</td>
      </tr>`;
    }).join('') : '<tr><td colspan="9" class="vacio">No hay estudiantes que coincidan.</td></tr>';
    document.querySelectorAll('tr.fila').forEach((tr) => {
      tr.addEventListener('click', () => detalle(tr.dataset.id));
      tr.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') detalle(tr.dataset.id); });
    });
    pintarAnalisis();
    pintarGruposCursos();
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
    const rec = (o) => ['madera', 'piedra', 'agua', 'cristal', 'resina', 'miel', 'fibra', 'arenisca', 'cobre', 'oro', 'carbon', 'plata', 'amatista', 'hongo', 'baya', 'hielo', 'escarcha', 'zafiro', 'obsidiana', 'fosil', 'magma', 'cristal_eco', 'hielo_eterno', 'aurora', 'prisma', 'luciernaga'].filter((k, i) => i < 4 || (o || {})[k]).map((k) => `${(o || {})[k] || 0} ${k}`).join(' · ');
    $('det').innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
        <div><h3 id="det-nombre">${esc(e.nombre)}</h3><span class="muted">RUT ${esc(e.rut)} · ${esc(CURSOS.find((c) => c.id === e.curso).nombre)}</span></div>
        <button type="button" class="btn" id="det-cerrar">Cerrar</button>
      </div>
      <div class="chips">
        <span class="chip">${e.conectado ? 'En línea · ' + esc(ZONAS[e.zona] || '') : 'Última vez: ' + esc(hace(e.ultimo))}</span>
        <span class="chip">${e.grupo ? `Grupo ${e.grupo}` : 'Sin grupo'}</span>
        <span class="chip">Nivel ${r.nivel || '–'}</span>
        <span class="chip">Acierto ${r.acierto === null ? '–' : r.acierto + ' %'} (${r.intentos} intentos)</span>
        <span class="chip">Enemigos vencidos: ${r.vencidos}</span>
        <span class="chip">Derrotas: ${r.muertes}</span>
      </div>
      ${unidades || '<p class="muted">Todavía no responde desafíos.</p>'}
      <h4>Equipo y recursos</h4>
      <div class="muted">Equipo: ${(p.mejoras || []).map((m) => esc(MEJORAS[m] || m)).join(', ') || 'Solo el hacha inicial'}</div>
      <div class="muted">Cofre: ${rec(p.cofre)}</div>
      <div class="muted">Objetos colocados: ${(p.colocados || []).length} en su base · ${(p.pieza || []).length} en su pieza</div>
      <h4>Misiones</h4>
      <div class="muted">Logros: ${Object.keys(p.logros || {}).length}${p.tituloTxt ? ` · Título equipado: «${esc(p.tituloTxt)}»` : ''}</div>
      <div class="muted">Misión diaria: ${p.diaria ? `${p.diaria.cobrada ? 'cumplida y cobrada' : p.diaria.p >= p.diaria.n ? 'cumplida (sin cobrar)' : `${p.diaria.p} de ${p.diaria.n}`} (${esc(p.diaria.fecha)})` : 'sin registro'}</div>
      <div class="muted">Jefes desbloqueados: ${['u1', 'u2', 'u3', 'u4'].map((u) => { const m = (p.misiones || {})[u]; return m ? `${ZONAS[u]}: ${m.ok ? 'listo' : `${m.lista.filter((x) => x.p >= x.n).length} de ${m.lista.length} misiones`}` : null; }).filter(Boolean).join(' · ') || 'aún no recibe misiones'}</div>
      <div class="muted">Jefes vencidos: ${Object.values(p.jefes || {}).reduce((a, b) => a + b, 0)}${p.reyVencido || p.colosoVencido || p.dragonVencido ? ` · Ancestrales: ${(p.reyVencido || 0) + (p.colosoVencido || 0) + (p.dragonVencido || 0)}` : ''}${p.mascota ? ` · Mascota: ${esc(p.mascota)}` : ''}</div>
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
  $('jugar-pj').innerHTML = [['zorro', 'Zorro'], ['luna', 'Luna'], ['puma', 'Puma'], ['copihue', 'Copihue'], ['condor', 'Cóndor'], ['huemul', 'Huemul'], ['pudu', 'Pudú'], ['lobo', 'Lobo']].map(([id, n]) =>
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
  // Abrir y cerrar mundos (unidades) por curso
  const UNIDADES = [
    { id: 'u2', n: 2, t: { 7: 'Álgebra y funciones', 8: 'Álgebra y funciones' } },
    { id: 'u3', n: 3, t: { 7: 'Geometría', 8: 'Geometría' } },
    { id: 'u4', n: 4, t: { 7: 'Probabilidad y estadística', 8: 'Probabilidad y estadística' } },
  ];
  function pintarMundos() {
    const cont = $('mundos');
    if (!mundos) { cont.innerHTML = '<span class="muted">No se pudo leer qué mundos están abiertos.</span>'; return; }
    const abierta = (c, u) => (mundos[c] || []).includes(u);
    cont.innerHTML = `<table><thead><tr><th>Curso</th><th>Unidad 1</th>${UNIDADES.map((u) => `<th>Unidad ${u.n}<small>${esc(u.t[7])}</small></th>`).join('')}</tr></thead><tbody>
      ${CURSOS.map((c) => `<tr><td><strong>${c.nombre}</strong></td><td><span class="siempre">Siempre abierta</span></td>${UNIDADES.map((u) => {
        const on = abierta(c.id, u.id);
        return `<td><button type="button" class="interruptor" role="switch" aria-checked="${on}" aria-label="Unidad ${u.n} de ${c.nombre}: ${on ? 'abierta' : 'cerrada'}" data-mc="${c.id}" data-mu="${u.id}"></button></td>`;
      }).join('')}</tr>`).join('')}
      <tr><td class="muted">Todos los cursos</td><td></td>${UNIDADES.map((u) => `<td><div class="todos"><button type="button" class="btn pri mini" data-tu="${u.id}" data-ta="1">Abrir</button><button type="button" class="btn peligro mini" data-tu="${u.id}" data-ta="0">Cerrar</button></div></td>`).join('')}</tr>
      </tbody></table>`;
    cont.querySelectorAll('[data-mc]').forEach((b) => b.addEventListener('click', () => cambiarMundo([b.dataset.mc], b.dataset.mu, !abierta(b.dataset.mc, b.dataset.mu))));
    cont.querySelectorAll('[data-tu]').forEach((b) => b.addEventListener('click', () => cambiarMundo(CURSOS.map((c) => c.id), b.dataset.tu, b.dataset.ta === '1')));
  }
  async function cambiarMundo(cursos, unidad, abrir) {
    $('mundos').querySelectorAll('button').forEach((b) => { b.disabled = true; });
    try {
      const r = await Nube.docenteMundo(token, cursos, unidad, abrir);
      if (r) mundos = r;
      $('error').hidden = true;
    } catch (e) {
      $('error').textContent = 'No se pudo cambiar el mundo. Revisa tu conexión e inténtalo otra vez.';
      $('error').hidden = false;
    }
    pintarMundos();
  }


  // ---------- Desafíos en vivo ----------
  const desSel = new Set();
  let desEstado = {}, desDif = 0, desT = null, desOcupado = false;
  const ahoraSrv = () => Date.now() + desDif;
  const defDes = (id) => DESAFIOS.find((d) => d.id === id) || { nombre: id, icono: '❓' };
  const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const vivo = (d) => d && ahoraSrv() < d.fin;
  async function cargarDesafios() {
    clearTimeout(desT);
    try {
      const r = await Nube.docenteDesafios(token);
      if (r) { desDif = r.ahora - Date.now(); desEstado = r.cursos || {}; }
    } catch (e) { /* se reintenta */ }
    pintarDesafios();
    const reciente = Object.values(desEstado).some((d) => d && ahoraSrv() < d.fin + 20000);
    desT = setTimeout(cargarDesafios, reciente ? 2000 : 15000);
  }
  function pintarDesafios() {
    if (!desSel.size) desSel.add(curso);
    $('des-cursos').innerHTML = '<span class="lbl">Lanzar en:</span>' + CURSOS.map((c) => {
      const on = datos.filter((e) => e.curso === c.id && e.conectado).length;
      return `<button type="button" class="chk" data-dc="${c.id}" aria-pressed="${desSel.has(c.id)}">${c.nombre} <small>${on} en línea</small></button>`;
    }).join('');
    $('des-cursos').querySelectorAll('[data-dc]').forEach((b) => b.addEventListener('click', () => {
      if (desSel.has(b.dataset.dc)) { if (desSel.size > 1) desSel.delete(b.dataset.dc); } else desSel.add(b.dataset.dc);
      pintarDesafios();
    }));
    pintarEstadoDesafios();
    $('des-lista').innerHTML = DESAFIOS.map((d) => `<div class="des-card" style="--c:${d.color}">
        <div class="cab-d"><span class="ico" aria-hidden="true">${d.icono}</span><strong>${esc(d.nombre)}</strong></div>
        <p>${esc(d.resumen)}</p>
        <div class="pie"><span class="dur">${d.seg < 60 ? d.seg + ' s' : mmss(d.seg * 1000) + ' min'}</span><button type="button" class="btn pri mini" data-lanzar="${d.id}" ${desOcupado ? 'disabled' : ''}>Lanzar</button></div>
      </div>`).join('');
    $('des-lista').querySelectorAll('[data-lanzar]').forEach((b) => b.addEventListener('click', () => lanzarDesafio(b.dataset.lanzar)));
  }
  function pintarEstadoDesafios() {
    const t = ahoraSrv();
    const tarjetas = CURSOS.map((c) => {
      const d = desEstado[c.id];
      if (!d || t > d.fin + 120000) return '';
      const D = defDes(d.id);
      const fase = t < d.inicio ? 'espera' : t < d.fin ? 'activo' : 'fin';
      const reloj = fase === 'espera' ? `Comienza en ${Math.ceil((d.inicio - t) / 1000)} s` : fase === 'activo' ? `Quedan ${mmss(d.fin - t)}` : d.detenido ? 'Detenido' : 'Terminó';
      let extra = '';
      if (d.id === 'arena') {
        extra = (d.ranking || []).length ? `<ol>${d.ranking.map((r) => `<li><strong>${esc(r.nombre)}</strong> · ${r.aciertos} ${r.aciertos === 1 ? 'acierto' : 'aciertos'}${r.errores ? ` <span class="muted">(${r.errores} ${r.errores === 1 ? 'error' : 'errores'})</span>` : ''}</li>`).join('')}</ol>` : '<span class="muted">Aún nadie responde.</span>';
        if (fase === 'fin' && d.ganador_nombre) extra = `<div><strong>🏆 Ganó ${esc(d.ganador_nombre)}</strong></div>` + extra;
      } else if (d.id === 'curso') {
        const pct = Math.min(100, Math.round((d.total / Math.max(1, d.meta)) * 100));
        extra = `<div class="fila-d"><span>${d.total} de ${d.meta} respuestas correctas</span><strong>${d.total >= d.meta ? '¡Lograda!' : pct + ' %'}</strong></div><div class="meta"><i style="width:${pct}%"></i></div><span class="muted">${d.participantes} participantes</span>`;
      }
      return `<div class="des-vivo ${fase}">
        <div class="fila-d"><strong>${c.nombre} · ${D.icono} ${esc(D.nombre)}</strong>${fase !== 'fin' ? `<button type="button" class="btn peligro mini" data-detener="${c.id}">Detener</button>` : ''}</div>
        <div class="fila-d"><span class="reloj">${reloj}</span><span class="muted">${d.conectados} en línea</span></div>
        ${extra}</div>`;
    }).join('');
    $('des-estado').innerHTML = tarjetas;
    $('des-estado').hidden = !tarjetas;
    $('des-estado').querySelectorAll('[data-detener]').forEach((b) => b.addEventListener('click', () => detenerDesafio([b.dataset.detener])));
  }
  async function lanzarDesafio(id) {
    const D = defDes(id), cursos = [...desSel];
    const ocupados = cursos.filter((c) => vivo(desEstado[c]));
    const nombres = (l) => l.map((x) => CURSOS.find((c) => c.id === x).nombre).join(', ');
    if (ocupados.length && !confirm(`${nombres(ocupados)} ya tiene un desafío en curso. ¿Reemplazarlo por "${D.nombre}"?`)) return;
    desOcupado = true; pintarDesafios();
    try {
      const r = await Nube.docenteDesafio(token, cursos, id, D.seg);
      if (r) { desDif = r.ahora - Date.now(); desEstado = r.cursos || {}; }
      $('error').hidden = true;
    } catch (e) {
      $('error').textContent = 'No se pudo lanzar el desafío. Revisa tu conexión e inténtalo otra vez.';
      $('error').hidden = false;
    }
    desOcupado = false; cargarDesafios();
  }
  async function detenerDesafio(cursos) {
    try { await Nube.docenteDesafio(token, cursos, null, 0); } catch (e) { /* */ }
    cargarDesafios();
  }
  setInterval(pintarEstadoDesafios, 1000);

  // ---------- Obras cooperativas (puente al Bosque profundo) ----------
  // ---------- Grupos (códigos, integrantes) y obras por curso y grupo ----------
  let grupos = null, grupoCurso = null, grupoMsg = '';
  const OBRAS_D = [['puente_bosque', '🌉 Puente', 'U1'], ['montacargas_valle', '🏗️ Montacargas', 'U2'], ['elevador_mina', '⛓️ Elevador', 'U3'], ['ruta_glaciar', '🧗 Ruta glaciar', 'U4']];
  const pctO = (o) => { if (!o) return 0; if (o.completado) return 100; const m = o.meta || {}, ap = o.aportes || {}; const tot = Object.values(m).reduce((a, b) => a + b, 0); return Math.floor((Object.entries(m).reduce((a, [k, v]) => a + Math.min(v, ap[k] || 0), 0) / Math.max(1, tot)) * 100); };
  async function cargarObras() {
    try { const r = await Nube.docenteGrupos(token); if (r) { grupos = r; pintarGruposCursos(); if ($('grupos-dlg').open) pintarGrupos(); } } catch (e) { /* se reintenta */ }
  }
  function pintarGruposCursos() {
    if (!grupos) return;
    $('grupos-cursos').innerHTML = CURSOS.map((c) => {
      const g = grupos[c.id] || {}, lista = datos.filter((e) => e.curso === c.id), con = lista.filter((e) => e.grupo).length;
      const ob = g.obras || {}; let hechas = 0;
      for (let n = 1; n <= 8; n++) for (const [id] of OBRAS_D) if (ob[n] && ob[n][id] && ob[n][id].completado) hechas++;
      return `<button type="button" class="gc-curso" data-gc="${c.id}"><strong>${c.nombre}</strong>
        <span class="muted">${con} de ${lista.length} estudiantes con grupo${lista.length - con ? ` · <b style="color:var(--coral)">${lista.length - con} sin grupo</b>` : ''}</span>
        <span class="muted">Obras terminadas: ${hechas} de 32</span><span class="meta"><i style="width:${(hechas / 32) * 100}%"></i></span>
        <span class="btn mini pri" style="align-self:flex-start;display:inline-flex;align-items:center">Ver grupos y códigos</span></button>`;
    }).join('');
    $('grupos-cursos').querySelectorAll('[data-gc]').forEach((b) => b.addEventListener('click', () => { grupoCurso = b.dataset.gc; grupoMsg = ''; pintarGrupos(); $('grupos-dlg').showModal(); }));
  }
  function selGrupo(e) {
    return `<select data-mover="${e.id}" aria-label="Grupo de ${esc(e.nombre)}"><option value="">Sin grupo</option>${Array.from({ length: 8 }, (_, i) => `<option value="${i + 1}" ${e.grupo === i + 1 ? 'selected' : ''}>Grupo ${i + 1}</option>`).join('')}</select>`;
  }
  function pintarGrupos() {
    const c = CURSOS.find((x) => x.id === grupoCurso), g = (grupos || {})[grupoCurso] || {};
    const lista = datos.filter((e) => e.curso === grupoCurso).sort((a, b) => a.nombre.localeCompare(b.nombre));
    const sin = lista.filter((e) => !e.grupo);
    const tarjetas = Array.from({ length: 8 }, (_, i) => {
      const n = i + 1, miembros = lista.filter((e) => e.grupo === n), on = miembros.filter((e) => e.conectado).length, ob = (g.obras || {})[n] || {};
      return `<div class="grupo-c"><div class="cab-g"><strong>Grupo ${n}</strong><span class="codigo">${esc((g.codigos || {})[n] || '–')}</span></div>
        <span class="muted" style="font-size:13px">${miembros.length}/6 integrantes${on ? ` · <span class="est"><span class="punto"></span>${on} en línea</span>` : ''}</span>
        <div class="obras-g">${OBRAS_D.map(([id, nom, u]) => { const o = ob[id], p = pctO(o); return `<div class="${p >= 100 ? 'listo' : ''}" title="${esc(`Unidad ${u.slice(1)} · ` + Object.entries((o && o.meta) || {}).map(([k, v]) => `${k}: ${Math.min(v, ((o && o.aportes) || {})[k] || 0)}/${v}`).join(' · '))}"><span class="fila-o"><span>${nom}</span><b>${p >= 100 ? '✓' : p + ' %'}</b></span><span class="barra"><i style="width:${p}%"></i></span></div>`; }).join('')}</div>
        <div class="miembros">${miembros.length ? miembros.map((e) => `<div class="miembro"><span>${e.conectado ? '<span class="punto"></span> ' : ''}${esc(e.nombre)}</span>${selGrupo(e)}</div>`).join('') : '<span class="muted" style="font-size:13px">Nadie todavía.</span>'}</div></div>`;
    }).join('');
    $('grupos-det').innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div><h3 id="gr-titulo">Grupos de ${c.nombre}</h3><span class="muted">${lista.length - sin.length} de ${lista.length} estudiantes con grupo. Para cambiar a alguien de grupo, elige el nuevo grupo en su lista: se moverá en unos segundos y conservará todo su avance personal.</span></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn pri" id="gr-proyectar">📽️ Mostrar códigos en grande</button><button type="button" class="btn peligro" id="gr-renovar">Renovar códigos</button><button type="button" class="btn" id="gr-cerrar">Cerrar</button></div>
      </div>
      <div class="tabs">${CURSOS.map((x) => `<button type="button" class="tab" data-gt="${x.id}" aria-selected="${x.id === grupoCurso}">${x.nombre}</button>`).join('')}</div>
      <div id="gr-msg">${grupoMsg}</div>
      ${sin.length ? `<div><h4>Sin grupo (${sin.length}) <small class="muted">· aún no escriben su código</small></h4><div class="sin-grupo">${sin.map((e) => `<div class="miembro"><span>${esc(e.nombre)}${e.tiene_clave ? '' : ' <small class="muted">(no ha entrado)</small>'}</span>${selGrupo(e)}</div>`).join('')}</div></div>` : ''}
      <div class="grupos">${tarjetas}</div>`;
    $('gr-cerrar').addEventListener('click', () => $('grupos-dlg').close());
    $('grupos-det').querySelectorAll('[data-gt]').forEach((b) => b.addEventListener('click', () => { grupoCurso = b.dataset.gt; pintarGrupos(); }));
    $('gr-proyectar').addEventListener('click', proyectarCodigos);
    $('gr-renovar').addEventListener('click', async () => {
      if (!confirm(`¿Crear códigos nuevos para ${c.nombre}? Los códigos actuales dejarán de funcionar. Quienes ya tienen grupo no cambian.`)) return;
      try { const r = await Nube.docenteCodigos(token, grupoCurso); if (r) grupos = r; } catch (e) { /* */ }
      pintarGrupos(); pintarGruposCursos();
    });
    $('grupos-det').querySelectorAll('[data-mover]').forEach((sel) => sel.addEventListener('change', async () => {
      const e = datos.find((x) => x.id === sel.dataset.mover), nuevo = sel.value ? Number(sel.value) : null, antes = e.grupo || null;
      sel.disabled = true; grupoMsg = '';
      try {
        const r = await Nube.docenteMover(token, e.id, nuevo);
        if (r && r.ok) { e.grupo = nuevo; grupoMsg = `<div class="msg">${esc(e.nombre)} ${nuevo ? `ahora está en el Grupo ${nuevo}` : 'quedó sin grupo: deberá escribir un código al entrar'}.</div>`; }
        else grupoMsg = `<div class="err">${r && r.error === 'lleno' ? 'Ese grupo ya tiene 6 integrantes. Mueve primero a alguien de ese grupo.' : 'No se pudo cambiar el grupo.'}</div>`;
      } catch (err) { grupoMsg = '<div class="err">Sin conexión. Inténtalo otra vez.</div>'; }
      $('gr-msg').innerHTML = grupoMsg;
      if (e.grupo !== antes) { pintarGrupos(); pintarGruposCursos(); pintar(); } else sel.value = antes || '';
      sel.disabled = false;
    }));
  }
  function proyectarCodigos() {
    const c = CURSOS.find((x) => x.id === grupoCurso), cods = ((grupos || {})[grupoCurso] || {}).codigos || {};
    const el = document.createElement('div'); el.className = 'proyector'; el.setAttribute('role', 'dialog');
    el.innerHTML = `<h2>Códigos de grupo · ${c.nombre}</h2><div class="cods">${Array.from({ length: 8 }, (_, i) => `<div class="cod"><span>Grupo ${i + 1}</span><b>${esc(cods[i + 1] || '–')}</b></div>`).join('')}</div>
      <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:20px">Entra al juego, escribe el código de tu grupo y presiona «Entrar al grupo».</span><button type="button" class="btn amarillo">Cerrar (Esc)</button></div>`;
    const cerrar = () => { el.remove(); document.removeEventListener('keydown', tecla); };
    const tecla = (e) => { if (e.key === 'Escape') cerrar(); };
    el.querySelector('button').addEventListener('click', cerrar);
    document.addEventListener('keydown', tecla);
    document.body.appendChild(el);
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  }
  cargarObras();
  setInterval(cargarObras, 30000);

  // ---------- Análisis del curso: resumen por tema y estudiantes que necesitan apoyo ----------
  function temasDe(lista, nivel) {
    const t = {};
    for (const e of lista) for (const [k, s] of Object.entries((e.progreso || {}).stats || {})) {
      if (!s || !s.i) continue;
      const x = t[k] || (t[k] = { k, a: 0, i: 0, est: 0, dif: 0 });
      x.a += s.a; x.i += s.i;
      if (s.i >= 3) { x.est += 1; if (s.a / s.i < 0.5) x.dif += 1; }
    }
    return Object.values(t).map((x) => ({ ...x, ...nombreTema(nivel, x.k), pct: Math.round((x.a / x.i) * 100) })).sort((a, b) => a.pct - b.pct);
  }
  function apoyoDe(lista, nivel) {
    return lista.map((e) => {
      const r = resumen(e);
      const debil = Object.entries((e.progreso || {}).stats || {}).filter(([, s]) => s.i >= 5 && s.a / s.i < 0.4).map(([k, s]) => ({ t: nombreTema(nivel, k).titulo, pct: Math.round((s.a / s.i) * 100) })).sort((a, b) => a.pct - b.pct);
      return { e, r, debil };
    }).filter(({ r, debil }) => (r.intentos >= 10 && r.acierto < 60) || debil.length).sort((a, b) => (a.r.acierto ?? 100) - (b.r.acierto ?? 100));
  }
  function pintarAnalisis() {
    const c = CURSOS.find((x) => x.id === curso), lista = datos.filter((e) => e.curso === curso);
    $('temas-titulo').textContent = `Resumen por tema · ${c.nombre}`;
    const temas = temasDe(lista, c.nivel);
    $('temas-curso').innerHTML = temas.length ? temas.map((t) => `<tr><td>${esc(t.titulo)}<br><small class="muted">${esc(ZONAS[t.unidad] || '')}</small></td>
      <td><span class="barra"><i style="width:${t.pct}%"></i></span>${t.pct} %<br><small class="muted">${t.a} de ${t.i} respuestas</small></td>
      <td>${t.est}</td><td class="${t.dif ? 'dificil' : ''}">${t.dif}</td></tr>`).join('') : '<tr><td colspan="4" class="vacio">Todavía no hay respuestas en este curso.</td></tr>';
    const ap = apoyoDe(lista, c.nivel);
    $('apoyo').innerHTML = ap.length ? ap.slice(0, 15).map(({ e, r, debil }) => `<button type="button" data-apoyo="${e.id}"><span><b>${esc(e.nombre)}</b><small>${debil.length ? `Bajo en: ${debil.slice(0, 2).map((d) => `${esc(d.t)} (${d.pct} %)`).join(', ')}` : `${r.intentos} respuestas`}</small></span><span class="dificil">${r.acierto ?? '–'} %</span></button>`).join('')
      + (ap.length > 15 ? `<span class="muted">y ${ap.length - 15} más (están en el Excel).</span>` : '')
      : '<span class="muted">Nadie bajo los umbrales por ahora. 🎉</span>';
    $('apoyo').querySelectorAll('[data-apoyo]').forEach((b) => b.addEventListener('click', () => detalle(b.dataset.apoyo)));
  }

  // ---------- Exportar a Excel ----------
  const fecha = (d) => (d ? new Date(d).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
  function exportarExcel() {
    if (!window.Planilla) return;
    const hojas = [];
    const resumenT = [['Curso', 'Unidad', 'Tema', 'Acierto del curso %', 'Respuestas', 'Correctas', 'Estudiantes que practicaron', 'Con dificultad (<50 %)']];
    for (const c of CURSOS) {
      const lista = datos.filter((e) => e.curso === c.id).sort((a, b) => a.nombre.localeCompare(b.nombre));
      const filas = [['Estudiante', 'RUT', 'Curso', 'Grupo', 'Entró al juego', 'Última conexión', 'Nivel', 'Acierto %', 'Respuestas', 'Tema más débil', 'Acierto tema débil %', 'Enemigos vencidos', 'Derrotas', 'Jefes vencidos', 'Logros', 'Título equipado', 'Necesita apoyo']];
      const apoyo = new Set(apoyoDe(lista, c.nivel).map((x) => x.e.id));
      for (const e of lista) {
        const p = e.progreso || {}, r = resumen(e);
        filas.push([e.nombre, e.rut, c.nombre, e.grupo || '', e.tiene_clave ? 'Sí' : 'No', e.conectado ? 'En línea' : fecha(e.ultimo), r.nivel || '', r.acierto ?? '', r.intentos,
          r.peor ? nombreTema(c.nivel, r.peor.k).titulo : '', r.peor ? Math.round(r.peor.pct * 100) : '', r.vencidos, r.muertes,
          Object.values(p.jefes || {}).reduce((a, b) => a + b, 0) + (p.reyVencido || 0) + (p.colosoVencido || 0) + (p.dragonVencido || 0),
          Object.keys(p.logros || {}).length, p.tituloTxt || '', apoyo.has(e.id) ? 'Sí' : '']);
      }
      hojas.push({ nombre: `Estudiantes ${c.nombre}`, filas, anchos: [34, 13, 7, 7, 9, 18, 7, 10, 11, 34, 12, 11, 9, 9, 8, 22, 10] });
      const temas = temasDe(lista, c.nivel);
      temas.forEach((t) => resumenT.push([c.nombre, ZONAS[t.unidad] || '', t.titulo, t.pct, t.i, t.a, t.est, t.dif]));
      if (temas.length) {
        const orden = [...temas].sort((a, b) => (a.unidad + a.titulo).localeCompare(b.unidad + b.titulo));
        const m = [['Estudiante', ...orden.map((t) => `${(ZONAS[t.unidad] || '').replace('Unidad ', 'U')} · ${t.titulo}`)]];
        for (const e of lista) { const st = (e.progreso || {}).stats || {}; m.push([e.nombre, ...orden.map((t) => (st[t.k] && st[t.k].i ? Math.round((st[t.k].a / st[t.k].i) * 100) : ''))]); }
        hojas.push({ nombre: `Temas ${c.nombre} (%)`, filas: m, anchos: [34, ...orden.map(() => 16)] });
      }
    }
    if (grupos) {
      const fg = [['Curso', 'Grupo', 'Código', 'Integrantes', ...OBRAS_D.map(([, n, u]) => `${n.replace(/^\S+ /, '')} (${u}) %`), 'Estudiantes']];
      for (const c of CURSOS) for (let n = 1; n <= 8; n++) {
        const g = grupos[c.id] || {}, ob = (g.obras || {})[n] || {}, m = datos.filter((e) => e.curso === c.id && e.grupo === n);
        fg.push([c.nombre, n, (g.codigos || {})[n] || '', m.length, ...OBRAS_D.map(([id]) => pctO(ob[id])), m.map((e) => e.nombre).join(', ')]);
      }
      hojas.push({ nombre: 'Grupos y obras', filas: fg, anchos: [7, 7, 14, 11, 12, 15, 12, 15, 90] });
    }
    hojas.splice(0, 0, { nombre: 'Resumen por tema', filas: resumenT, anchos: [8, 11, 44, 12, 11, 10, 14, 14] });
    if (reportes.length) hojas.push({ nombre: 'Buzón', filas: [['Fecha', 'Curso', 'Estudiante', 'Tipo', 'Categoría', 'Mensaje', 'Zona', 'Leído'], ...reportes.map((r) => [fecha(r.creado), (CURSOS.find((c) => c.id === r.curso) || {}).nombre || r.curso, r.nombre, r.tipo === 'idea' ? 'Idea' : 'Problema', r.categoria || '', r.texto, r.zona || '', r.leido ? 'Sí' : 'No'])], anchos: [17, 7, 30, 10, 24, 70, 18, 7] });
    const hoy = new Date();
    Planilla.descargar(`MathWorld_${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}.xlsx`, hojas);
  }
  $('btn-excel').addEventListener('click', exportarExcel);

  // ---------- Comunicación: mensajes a la clase y chat ----------
  let config = null; const comSel = new Set();
  const RAPIDAS = ['¡Quedan 5 minutos! Guarden sus recursos en el cofre.', 'Vamos a cerrar el juego: terminen lo que están haciendo.', '¡Excelente trabajo, curso! 🎉', 'Miren la pizarra, por favor.', 'Prepárense: lanzaré un desafío en vivo.', 'Trabajen en equipo para vencer al jefe.'];
  async function cargarConfig() { try { const r = await Nube.docenteConfig(token); if (r) { config = r; pintarCom(); } } catch (e) { /* se reintenta */ } }
  function pintarCom() {
    if (!comSel.size) comSel.add(curso);
    $('com-cursos').innerHTML = '<span class="lbl">Para:</span>' + CURSOS.map((c) => `<button type="button" class="chk" data-cc="${c.id}" aria-pressed="${comSel.has(c.id)}">${c.nombre}</button>`).join('')
      + '<button type="button" class="btn mini" id="com-todos">Todos</button>';
    $('com-cursos').querySelectorAll('[data-cc]').forEach((b) => b.addEventListener('click', () => {
      if (comSel.has(b.dataset.cc)) { if (comSel.size > 1) comSel.delete(b.dataset.cc); } else comSel.add(b.dataset.cc);
      pintarCom();
    }));
    $('com-todos').addEventListener('click', () => { CURSOS.forEach((c) => comSel.add(c.id)); pintarCom(); });
    if (!config) { $('com-estado').innerHTML = '<span class="muted">Cargando…</span>'; return; }
    $('com-estado').innerHTML = CURSOS.map((c) => {
      const k = config[c.id] || {}, chat = k.chat !== false, a = k.anuncio;
      return `<div class="com-curso"><div class="fila-d"><strong>${c.nombre}</strong>
        <label class="est" style="gap:10px">Chat <button type="button" class="interruptor" role="switch" aria-checked="${chat}" aria-label="Chat de ${c.nombre}: ${chat ? 'activado' : 'desactivado'}" data-chat="${c.id}"></button></label></div>
        ${a ? `<div class="anuncio"><span>📢 ${esc(a.texto)}<br><small class="muted">Visible hasta las ${new Date(Number(a.hasta)).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</small></span><button type="button" class="btn mini peligro" data-borrar="${c.id}">Quitar</button></div>` : '<span class="muted" style="font-size:13px">Sin mensaje activo</span>'}</div>`;
    }).join('');
    $('com-estado').querySelectorAll('[data-chat]').forEach((b) => b.addEventListener('click', async () => {
      b.disabled = true;
      try { const r = await Nube.docenteChat(token, [b.dataset.chat], (config[b.dataset.chat] || {}).chat === false); if (r) config = r; } catch (e) { comMsg('No se pudo cambiar el chat. Inténtalo otra vez.', true); }
      pintarCom();
    }));
    $('com-estado').querySelectorAll('[data-borrar]').forEach((b) => b.addEventListener('click', async () => {
      try { const r = await Nube.docenteAnuncio(token, [b.dataset.borrar], '', 1); if (r) config = r; } catch (e) { comMsg('No se pudo quitar el mensaje.', true); }
      pintarCom();
    }));
  }
  function comMsg(t, err) { $('com-msg').innerHTML = t ? `<div class="${err ? 'err' : 'msg'}">${esc(t)}</div>` : ''; clearTimeout(comMsg.t); comMsg.t = setTimeout(() => { $('com-msg').innerHTML = ''; }, 5000); }
  $('anuncio-rapidas').innerHTML = RAPIDAS.map((t, i) => `<button type="button" data-rap="${i}">${esc(t)}</button>`).join('');
  $('anuncio-rapidas').querySelectorAll('[data-rap]').forEach((b) => b.addEventListener('click', () => { $('anuncio-texto').value = RAPIDAS[b.dataset.rap]; $('anuncio-texto').focus(); }));
  $('anuncio-enviar').addEventListener('click', async () => {
    const t = $('anuncio-texto').value.trim();
    if (!t) { comMsg('Escribe el mensaje primero.', true); return; }
    const btn = $('anuncio-enviar'); btn.disabled = true;
    try {
      const r = await Nube.docenteAnuncio(token, [...comSel], t, Number($('anuncio-min').value));
      if (r) { config = r; $('anuncio-texto').value = ''; comMsg(`Mensaje enviado a ${[...comSel].map((id) => CURSOS.find((c) => c.id === id).nombre).join(', ')}. Les aparecerá en pantalla en unos segundos.`); }
    } catch (e) { comMsg('No se pudo enviar. Inténtalo otra vez.', true); }
    btn.disabled = false; pintarCom();
  });
  $('anuncio-texto').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('anuncio-enviar').click(); });

  // ---------- Buzón: problemas reportados e ideas ----------
  let reportes = [], buzonTab = 'problema', buzonCurso = '', avisoMostrado = false;
  async function cargarReportes() {
    try { const r = await Nube.docenteReportes(token); if (Array.isArray(r)) { reportes = r; pintarAvisoBuzon(); if ($('buzon').open) pintarBuzon(); } } catch (e) { /* se reintenta */ }
  }
  function pintarAvisoBuzon() {
    const prob = reportes.filter((r) => r.tipo === 'problema' && !r.leido).length, ideas = reportes.filter((r) => r.tipo === 'idea' && !r.leido).length;
    const n = prob + ideas;
    $('buzon-n').hidden = !n; $('buzon-n').textContent = n;
    document.title = `${n ? `(${n}) ` : ''}Portal docente · Math World`;
    const av = $('aviso-buzon');
    if (!n) { av.hidden = true; return; }
    const partes = [];
    if (prob) partes.push(`<b>${prob}</b> ${prob === 1 ? 'problema reportado' : 'problemas reportados'}`);
    if (ideas) partes.push(`<b>${ideas}</b> ${ideas === 1 ? 'idea nueva' : 'ideas nuevas'}`);
    av.innerHTML = `<span><span class="ico">🔔</span>Tienes ${partes.join(' y ')} de tus estudiantes sin leer.</span><span style="display:flex;gap:8px"><button type="button" class="btn pri" id="av-ver">Abrir buzón</button><button type="button" class="btn" id="av-ocultar">Más tarde</button></span>`;
    if (!avisoMostrado || !av.dataset.oculto) av.hidden = false;
    avisoMostrado = true;
    $('av-ver').addEventListener('click', () => abrirBuzon(prob ? 'problema' : 'idea'));
    $('av-ocultar').addEventListener('click', () => { av.hidden = true; av.dataset.oculto = '1'; });
  }
  function abrirBuzon(tab) { if (tab) buzonTab = tab; pintarBuzon(); if (!$('buzon').open) $('buzon').showModal(); }
  function pintarBuzon() {
    const n = (t) => reportes.filter((r) => r.tipo === t && !r.leido).length;
    $('buzon-tabs').innerHTML = [['problema', '⚠️ Problemas'], ['idea', '💡 Ideas']].map(([t, nom]) => `<button type="button" class="tab" data-bt="${t}" aria-selected="${buzonTab === t}">${nom}${n(t) ? ` <span class="etq-r nuevo">${n(t)} sin leer</span>` : ''}</button>`).join('')
      + `<select id="buzon-curso" aria-label="Filtrar por curso" style="height:44px;border-radius:10px;border:1px solid #c9c0ae;font:inherit;font-weight:700;padding:0 8px"><option value="">Todos los cursos</option>${CURSOS.map((c) => `<option value="${c.id}" ${buzonCurso === c.id ? 'selected' : ''}>${c.nombre}</option>`).join('')}</select>`
      + '<span style="flex:1"></span><button type="button" class="btn mini" id="buzon-todos">Marcar todo como leído</button>';
    const lista = reportes.filter((r) => r.tipo === buzonTab && (!buzonCurso || r.curso === buzonCurso));
    $('buzon-lista').innerHTML = lista.length ? lista.map((r) => `<div class="rep ${r.leido ? '' : 'nuevo'}">
        <div class="cab-r"><span><b style="color:var(--text)">${esc(r.nombre)}</b> · ${esc((CURSOS.find((c) => c.id === r.curso) || {}).nombre || r.curso)}${r.zona ? ` · ${esc(r.zona)}` : ''}</span><span>${esc(fecha(r.creado))}</span></div>
        ${r.tipo === 'problema' && r.categoria ? `<span><span class="etq-r">${esc(r.categoria)}</span></span>` : ''}
        <p>${esc(r.texto)}</p>
        <div class="pie-r">${r.leido ? '<span class="muted" style="font-size:13px">Leído</span>' : '<span class="etq-r nuevo">Nuevo</span>'}<button type="button" class="btn mini" data-leer="${r.id}" data-v="${!r.leido}">${r.leido ? 'Marcar como no leído' : 'Marcar como leído'}</button></div>
      </div>`).join('') : `<div class="vacio">${buzonTab === 'idea' ? 'Aún no llegan ideas.' : 'No hay problemas reportados. 👍'}</div>`;
    $('buzon-tabs').querySelectorAll('[data-bt]').forEach((b) => b.addEventListener('click', () => { buzonTab = b.dataset.bt; pintarBuzon(); }));
    $('buzon-curso').addEventListener('change', (e) => { buzonCurso = e.target.value; pintarBuzon(); });
    $('buzon-todos').addEventListener('click', () => marcarLeido(lista.filter((r) => !r.leido).map((r) => r.id), true));
    $('buzon-lista').querySelectorAll('[data-leer]').forEach((b) => b.addEventListener('click', () => marcarLeido([Number(b.dataset.leer)], b.dataset.v === 'true')));
  }
  async function marcarLeido(ids, leido) {
    if (!ids.length) return;
    reportes.forEach((r) => { if (ids.includes(r.id)) r.leido = leido; });
    pintarBuzon(); pintarAvisoBuzon();
    try { await Nube.docenteReporteLeido(token, ids, leido); } catch (e) { cargarReportes(); }
  }
  $('btn-buzon').addEventListener('click', () => abrirBuzon());
  $('buzon-cerrar').addEventListener('click', () => $('buzon').close());
  cargarConfig(); cargarReportes();
  setInterval(cargarConfig, 30000);
  setInterval(cargarReportes, 30000);

  $('abrir-todos').addEventListener('click', () => cambiarAcceso(CURSOS.map((c) => c.id), true));
  $('cerrar-todos').addEventListener('click', () => cambiarAcceso(CURSOS.map((c) => c.id), false));

  $('buscar').addEventListener('input', pintar);
  $('solo-online').addEventListener('change', pintar);
  $('btn-actualizar').addEventListener('click', cargar);
  $('btn-salir').addEventListener('click', () => { try { sessionStorage.removeItem('mw_docente'); } catch (e) { /* */ } location.replace('./'); });
  cargar();
  cargarDesafios();
  setInterval(cargar, 20000);
})();
