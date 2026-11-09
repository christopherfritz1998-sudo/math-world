// Math World — portal docente: conectados y progreso por curso.
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const CURSOS = [{ id: '7A', nombre: '7° A', nivel: '7basico' }, { id: '7B', nombre: '7° B', nivel: '7basico' }, { id: '8A', nombre: '8° A', nivel: '8basico' }, { id: '8B', nombre: '8° B', nivel: '8basico' }, { id: 'INV', nombre: 'Invitados', nivel: null, inv: true }];
  const CURSOS_G = CURSOS.filter((c) => !c.inv);   // cursos con 8 grupos y códigos
  const MAX_INV = 10;
  // nivel de ejercicios de cada jugador (los invitados eligen 7° u 8°)
  const nivelDe = (e) => (e.curso === 'INV' ? (e.nivel === '8' ? '8basico' : '7basico') : CURSOS.find((c) => c.id === e.curso).nivel);
  const usuarioInv = (e) => String(e.rut || '').replace(/^INV-/, '');
  const ZONAS_BASE = { base: 'En su base', pieza: 'En su pieza', u1: 'Unidad 1', u2: 'Unidad 2', u3: 'Unidad 3', u4: 'Unidad 4' };

  // ---------- Menú horizontal: se ve una sección a la vez ----------
  const VISTAS = ['curso', 'analisis', 'tema', 'ticket', 'desafios', 'guerra', 'grupos', 'acceso', 'com'];
  let vista = 'curso';
  try { const v = localStorage.getItem('mw_doc_vista'); if (VISTAS.includes(v)) vista = v; } catch (e) { /* sin almacenamiento */ }
  function irVista(v) {
    if (!VISTAS.includes(v)) return;
    vista = v;
    document.querySelectorAll('[data-vista]').forEach((el) => el.classList.toggle('vista-oculta', !el.dataset.vista.split(' ').includes(v)));
    document.querySelectorAll('#vistas [data-v]').forEach((b) => { if (b.dataset.v === v) { b.setAttribute('aria-current', 'page'); b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } else b.removeAttribute('aria-current'); });
    try { localStorage.setItem('mw_doc_vista', v); } catch (e) { /* sin almacenamiento */ }
  }
  document.querySelectorAll('#vistas [data-v]').forEach((b) => b.addEventListener('click', () => { irVista(b.dataset.v); window.scrollTo({ top: 0 }); }));
  irVista(vista);
  // Punto rojo en las secciones con algo en curso (desafío, guerra, ticket, tema o solicitudes de invitados)
  function marcarVistas() {
    const hay = (id, re) => { const el = $(id); return Boolean(el && re.test(el.textContent)); };
    const visible = (id) => { const el = $(id); return Boolean(el && !el.hidden); };
    const estado = {
      desafios: Boolean($('des-nada') && $('des-nada').hidden),
      guerra: Boolean($('guerra-nada') && $('guerra-nada').hidden),
      ticket: hay('ticket-cuerpo', /Ticket abierto/),
      tema: hay('foco-cuerpo', /Activo en/),
      acceso: visible('aviso-inv'),
    };
    document.querySelectorAll('#vistas [data-v]').forEach((b) => b.classList.toggle('activo', Boolean(estado[b.dataset.v])));
  }
  setInterval(marcarVistas, 2000);
  // "u1-g3" -> "Unidad 1 · Grupo 3"
  const ZONAS = new Proxy({}, { get: (_, z) => { const [u, g] = String(z || '').split('-g'); return ZONAS_BASE[u] ? ZONAS_BASE[u] + (g ? ` · Grupo ${g}` : '') : undefined; } });
  const MEJORAS = { pico: 'Pico', balde: 'Balde', cana: 'Caña de pescar', ahumador: 'Ahumador', hacha3: 'Hacha ancestral', amuleto: 'Amuleto ancestral', espada: 'Espada de piedra', hacha2: 'Hacha de hierro', armadura: 'Armadura de cuero', pico2: 'Pico reforzado', espada2: 'Espada de cristal', armadura2: 'Armadura de cristal', cantimplora: 'Cantimplora', pico3: 'Pico de cobre', espada3: 'Espada de oro', armadura3: 'Armadura de oro', casco: 'Casco de minero', pico4: 'Pico de plata', espada4: 'Espada de amatista', armadura4: 'Armadura de plata', abrigo: 'Abrigo de piel', pico5: 'Pico de escarcha', espada5: 'Espada de hielo', armadura5: 'Armadura de escarcha', espada6: 'Espada prismática', armadura6: 'Armadura prismática', pala: 'Pala de arqueólogo', pala2: 'Pala de obsidiana', antorcha_esfinge: 'Antorcha de la esfinge', guantes: 'Guantes térmicos', cincel: 'Cincel de cristal', pico_magma: 'Pico de magma', corazon_cristal: 'Corazón de cristal', piolet: 'Piolet de escarcha', crampones: 'Crampones de hielo', frasco_aurora: 'Frasco de aurora', pico_eterno: 'Pico de hielo eterno', cetro_aurora: 'Cetro de la aurora' };
  let token = null, datos = [], curso = '7A', abiertos = null, mundos = null;
  try { token = sessionStorage.getItem('mw_docente'); } catch (e) { /* */ }
  if (!token || !Nube.activo) { location.replace('./'); return; }

  const titulos = {};
  for (const n of ['7basico', '8basico']) for (const u of ['u1', 'u2', 'u3', 'u4']) titulos[`${n}:${u}`] = Preguntas.titulos(n, u);
  const nombreTema = (nivel, tema) => {
    for (const n of nivel ? [nivel] : ['7basico', '8basico']) for (const u of ['u1', 'u2', 'u3', 'u4']) { const t = titulos[`${n}:${u}`]; if (t && t[tema]) return { unidad: u, titulo: t[tema] }; }
    return { unidad: '', titulo: (Preguntas.tituloDe ? Preguntas.tituloDe(tema) : tema) };
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
    $('titulo-lista').textContent = curso === 'INV' ? 'Jugadores invitados' : `Estudiantes de ${CURSOS.find((c) => c.id === curso).nombre}`;

    const q = $('buscar').value.trim().toLowerCase();
    const solo = $('solo-online').checked;
    const filas = lista.map((e, i) => ({ e, r: rs[i] }))
      .filter(({ e }) => (!q || e.nombre.toLowerCase().includes(q) || e.rut.toLowerCase().includes(q)) && (!solo || e.conectado))
      .sort((a, b) => (b.e.conectado - a.e.conectado) || a.e.nombre.localeCompare(b.e.nombre));
    $('filas').innerHTML = filas.length ? filas.map(({ e, r }) => {
      const nivel = nivelDe(e);
      const peor = r.peor ? nombreTema(nivel, r.peor.k).titulo : '–';
      return `<tr class="fila" data-id="${e.id}" tabindex="0">
        <td><strong>${esc(e.nombre)}</strong>${e.curso === 'INV' ? `<br><small class="muted">${esc(usuarioInv(e))} · ${e.nivel === '8' ? '8°' : '7°'} básico</small>${e.aprobado === false ? ' <span class="etq-inv" style="background:#fff3d6;color:#8a5a00">Por aprobar</span>' : ''}` : e.tiene_clave ? '' : '<br><small class="muted">Aún no entra</small>'}</td>
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
    pintarInvitados();
  }

  // ---------- Sala de invitados: aprobar, rechazar y eliminar perfiles ----------
  let invAvisoOculto = false;
  function pintarInvitados() {
    const lista = datos.filter((e) => e.curso === 'INV');
    const pend = lista.filter((e) => e.aprobado === false).sort((a, b) => String(a.creado).localeCompare(String(b.creado)));
    const act = lista.filter((e) => e.aprobado !== false).sort((a, b) => (b.conectado - a.conectado) || a.nombre.localeCompare(b.nombre));
    $('inv-cupos').innerHTML = `<span>${lista.length} de ${MAX_INV} cupos</span><span class="cupos" aria-hidden="true">${Array.from({ length: MAX_INV }, (_, i) => `<i class="${i < act.length ? 'ok' : i < lista.length ? 'esp' : ''}"></i>`).join('')}</span>`;
    const quien = (e, extra) => `<span class="quien"><b>${e.conectado ? '<span class="punto"></span> ' : ''}${esc(e.nombre)}</b><small>Usuario: ${esc(usuarioInv(e))} · ${e.nivel === '8' ? '8°' : '7°'} básico${extra ? ' · ' + extra : ''}</small></span>`;
    $('inv-pend').innerHTML = pend.length ? pend.map((e) => `<div class="inv-fila pend">${quien(e, `pidió acceso ${esc(hace(e.creado).toLowerCase())}`)}
        <span class="acc"><button type="button" class="btn pri mini" data-inv-ok="${e.id}">✔ Aceptar</button><button type="button" class="btn peligro mini" data-inv-del="${e.id}">✖ Rechazar</button></span></div>`).join('')
      : '<p class="muted" style="margin:0">No hay solicitudes nuevas.</p>';
    $('inv-act').innerHTML = act.length ? act.map((e) => { const r = resumen(e); return `<div class="inv-fila">${quien(e, e.conectado ? `en línea · ${esc(ZONAS[e.zona] || '')}` : r.nivel ? `nivel ${r.nivel} · ${esc(hace(e.ultimo).toLowerCase())}` : 'aún no entra a jugar')}
        <span class="acc"><button type="button" class="btn mini" data-inv-ver="${e.id}">Ver avance</button><button type="button" class="btn peligro mini" data-inv-del="${e.id}">Eliminar</button></span></div>`; }).join('')
      : '<p class="muted" style="margin:0">Todavía no hay invitados aceptados.</p>';
    document.querySelectorAll('[data-inv-ok]').forEach((b) => b.addEventListener('click', () => accionInvitado(datos.find((x) => x.id === b.dataset.invOk), 'aprobar')));
    document.querySelectorAll('[data-inv-del]').forEach((b) => b.addEventListener('click', () => accionInvitado(datos.find((x) => x.id === b.dataset.invDel), 'eliminar')));
    document.querySelectorAll('[data-inv-ver]').forEach((b) => b.addEventListener('click', () => detalle(b.dataset.invVer)));
    // aviso arriba cuando hay solicitudes esperando
    const av = $('aviso-inv');
    if (!pend.length) { av.hidden = true; invAvisoOculto = false; return; }
    av.innerHTML = `<span><span class="ico">🙋</span>${pend.length === 1 ? `<b>${esc(pend[0].nombre)}</b> pidió` : `<b>${pend.length} personas</b> pidieron`} acceso a la sala de invitados.</span><span style="display:flex;gap:8px"><button type="button" class="btn pri" id="av-inv-ver">Revisar solicitudes</button><button type="button" class="btn" id="av-inv-ocultar">Más tarde</button></span>`;
    av.hidden = invAvisoOculto;
    $('av-inv-ver').addEventListener('click', () => { irVista('acceso'); $('sec-invitados').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    $('av-inv-ocultar').addEventListener('click', () => { av.hidden = true; invAvisoOculto = true; });
  }
  async function accionInvitado(e, accion) {
    if (!e) return false;
    if (accion === 'eliminar') {
      const pendiente = e.aprobado === false;
      if (!confirm(pendiente ? `¿Rechazar la solicitud de ${e.nombre}?` : `¿Eliminar el perfil de ${e.nombre}?\n\nSe borra todo su avance y, si está jugando, saldrá del juego en unos segundos. Su cupo queda libre.`)) return false;
    }
    const msg = (t, err) => { $('inv-msg').innerHTML = `<div class="${err ? 'err' : 'msg'}">${esc(t)}</div>`; clearTimeout(msg.t); msg.t = setTimeout(() => { $('inv-msg').innerHTML = ''; }, 6000); };
    try {
      const r = await Nube.docenteInvitado(token, e.id, accion);
      if (!r || !r.ok) { msg('No se pudo completar la acción. Actualiza e inténtalo otra vez.', true); cargar(); return false; }
      if (accion === 'aprobar') { e.aprobado = true; e.grupo = 1; msg(`${e.nombre} ya puede jugar en la sala de invitados.`); }
      else { datos = datos.filter((x) => x.id !== e.id); msg(e.aprobado === false ? `Solicitud de ${e.nombre} rechazada.` : `Perfil de ${e.nombre} eliminado. Su cupo quedó libre.`); }
      pintar();
      return true;
    } catch (err) { msg('Sin conexión. Inténtalo otra vez.', true); return false; }
  }

  function detalle(id) {
    const e = datos.find((x) => x.id === id); if (!e) return;
    const p = e.progreso || {}, r = resumen(e);
    const nivel = nivelDe(e);
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
        <div><h3 id="det-nombre">${esc(e.nombre)}</h3><span class="muted">${e.curso === 'INV' ? `Invitado · usuario ${esc(usuarioInv(e))} · ejercicios de ${e.nivel === '8' ? '8°' : '7°'} básico` : `RUT ${esc(e.rut)} · ${esc(CURSOS.find((c) => c.id === e.curso).nombre)}`}</span></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn" id="det-informe">📄 Informe del estudiante</button><button type="button" class="btn" id="det-cerrar">Cerrar</button></div>
      </div>
      <div class="chips">
        <span class="chip">${e.conectado ? 'En línea · ' + esc(ZONAS[e.zona] || '') : 'Última vez: ' + esc(hace(e.ultimo))}</span>
        <span class="chip">${e.grupo ? `Grupo ${e.grupo}` : 'Sin grupo'}</span>
        <span class="chip">Nivel ${r.nivel || '–'}</span>
        <span class="chip">Acierto ${r.acierto === null ? '–' : r.acierto + ' %'} (${r.intentos} intentos)</span>
        <span class="chip">Enemigos vencidos: ${r.vencidos}</span>
        <span class="chip">Derrotas: ${r.muertes}</span>
        ${p.diagnostico && p.diagnostico.n ? `<span class="chip">🧭 Diagnóstico: ${p.diagnostico.a} de ${p.diagnostico.n}</span>` : '<span class="chip">🧭 Sin diagnóstico</span>'}
        ${alertas[e.id] ? '<span class="chip" style="background:#fde2dc">⚠️ Posible alteración</span>' : ''}
      </div>
      ${alertasHTML(e)}
      ${unidades || '<p class="muted">Todavía no responde desafíos.</p>'}
      ${profundidadHTML(e)}
      ${erroresAltHTML(e)}
      ${refuerzoHTML(e)}
      ${enlaceHTML(e)}
      <h4>Equipo y recursos</h4>
      <div class="muted">Equipo: ${(p.mejoras || []).map((m) => esc(MEJORAS[m] || m)).join(', ') || 'Solo el hacha inicial'}</div>
      <div class="muted">Cofre: ${rec(p.cofre)}</div>
      <div class="muted">Objetos colocados: ${(p.colocados || []).length} en su base · ${(p.pieza || []).length} en su pieza</div>
      <h4>Misiones</h4>
      <div class="muted">Logros: ${Object.keys(p.logros || {}).length}${p.tituloTxt ? ` · Título equipado: «${esc(p.tituloTxt)}»` : ''}</div>
      <div class="muted">Misión diaria: ${p.diaria ? `${p.diaria.cobrada ? 'cumplida y cobrada' : p.diaria.p >= p.diaria.n ? 'cumplida (sin cobrar)' : `${p.diaria.p} de ${p.diaria.n}`} (${esc(p.diaria.fecha)})` : 'sin registro'}</div>
      <div class="muted">Jefes desbloqueados: ${['u1', 'u2', 'u3', 'u4'].map((u) => { const m = (p.misiones || {})[u]; return m ? `${ZONAS[u]}: ${m.ok ? 'listo' : `${m.lista.filter((x) => x.p >= x.n).length} de ${m.lista.length} misiones`}` : null; }).filter(Boolean).join(' · ') || 'aún no recibe misiones'}</div>
      <div class="muted">Jefes vencidos: ${Object.values(p.jefes || {}).reduce((a, b) => a + b, 0)}${p.reyVencido || p.faraonVencido || p.colosoVencido || p.dragonVencido ? ` · Ancestrales: ${(p.reyVencido || 0) + (p.faraonVencido || 0) + (p.colosoVencido || 0) + (p.dragonVencido || 0)}` : ''}${p.mascota ? ` · Mascota: ${esc(p.mascota)}` : ''}</div>
      <h4>Clave</h4>
      ${e.tiene_clave ? `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="muted">Si el estudiante olvidó su clave, restablécela: la próxima vez que entre creará una nueva.</span>
        <button type="button" class="btn peligro" id="det-reset">Restablecer clave</button></div>` : '<span class="muted">Aún no crea su clave.</span>'}
      ${e.curso === 'INV' ? `<h4>Perfil de invitado</h4><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="muted">${e.aprobado === false ? 'Esta persona pidió acceso y espera tu aprobación.' : 'Puede seguir jugando o puedes eliminar su perfil para liberar el cupo (se borra todo su avance).'}</span>
        ${e.aprobado === false ? '<button type="button" class="btn pri" id="det-aprobar">Aceptar</button>' : ''}<button type="button" class="btn peligro" id="det-eliminar">${e.aprobado === false ? 'Rechazar' : 'Eliminar perfil'}</button></div>` : ''}
      <div id="det-msg"></div>`;
    $('det-cerrar').addEventListener('click', () => $('detalle').close());
    $('det-informe').addEventListener('click', () => informeEstudiante(e));
    conectarEnlace(e);
    conectarRefuerzo(e);
    if ($('det-aprobar')) $('det-aprobar').addEventListener('click', () => accionInvitado(e, 'aprobar').then((ok) => { if (ok) $('detalle').close(); }));
    if ($('det-eliminar')) $('det-eliminar').addEventListener('click', () => accionInvitado(e, 'eliminar').then((ok) => { if (ok) $('detalle').close(); }));
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
  $('jugar-pj').innerHTML = [['zorro', 'Zorro'], ['luna', 'Luna'], ['puma', 'Puma'], ['copihue', 'Copihue'], ['condor', 'Cóndor'], ['huemul', 'Huemul'], ['pudu', 'Pudú'], ['lobo', 'Lobo'], ['fenix', 'Fénix'], ['trueno', 'Trueno'], ['sombra', 'Sombras'], ['bosque', 'Guardiana'], ['cazadora', 'Cazadora'], ['ninja', 'Ninja'], ['archimago', 'Archimago'], ['emperador', 'Emperador'], ['esqueleto', 'R. Esqueleto'], ['minotauro', 'Minotauro']].map(([id, n]) =>
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
        <div class="pie"><span class="dur">${d.seg < 60 ? d.seg + ' s' : mmss(d.seg * 1000) + ' min'}${d.lugar === 'base' ? ' · 🏠 En la base' : d.lugar === 'mundos' ? ' · 🌍 En los mundos' : ''}</span><button type="button" class="btn pri mini" data-lanzar="${d.id}" ${desOcupado ? 'disabled' : ''}>Lanzar</button></div>
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
        const niv = [[d.meta, '🥉 Bronce'], [Math.round(d.meta * 11 / 9), '🥈 Plata'], [Math.round(d.meta * 13 / 9), '🥇 Oro'], [Math.round(d.meta * 16 / 9), '💎 Diamante']].filter(([n]) => d.total >= n).pop();
        extra = `<div class="fila-d"><span>${d.total} de ${d.meta} respuestas correctas</span><strong>${niv ? `¡Lograda! ${niv[1]}` : pct + ' %'}</strong></div><div class="meta"><i style="width:${pct}%"></i></div><span class="muted">${d.participantes} participantes</span>`;
      }
      return `<div class="des-vivo ${fase}">
        <div class="fila-d"><strong>${c.nombre} · ${D.icono} ${esc(D.nombre)}</strong>${fase !== 'fin' ? `<button type="button" class="btn peligro mini" data-detener="${c.id}">Detener</button>` : ''}</div>
        <div class="fila-d"><span class="reloj">${reloj}</span><span class="muted">${d.conectados} en línea</span></div>
        ${extra}</div>`;
    }).join('');
    $('des-estado').innerHTML = tarjetas;
    $('des-estado').hidden = !tarjetas;
    $('des-nada').hidden = Boolean(tarjetas);
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
      if ($('desafios-dlg').open) $('desafios-dlg').close();
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
  $('btn-desafios').addEventListener('click', () => { pintarDesafios(); $('desafios-dlg').showModal(); });
  $('dd-cerrar').addEventListener('click', () => $('desafios-dlg').close());

  // ---------- Tema de la clase ----------
  let focos = {}, focoCurso = CURSOS_G[0].id, focoUnidad = 'u1', focoSel = new Set(), focoMin = 90, focoDif = 0;
  async function cargarFocos() {
    try { const r = await Nube.docenteFocos(token); if (r) { focos = r.cursos || {}; focoDif = r.ahora - Date.now(); } } catch (e) { /* aún sin la actualización de la base de datos */ }
    pintarFoco();
  }
  function pintarFoco() {
    const c = CURSOS_G.find((x) => x.id === focoCurso), nivel = c.nivel, F = focos[focoCurso];
    const titulos = Preguntas.titulos(nivel, focoUnidad);
    const quedan = F ? Math.max(0, Math.round((F.hasta - (Date.now() + focoDif)) / 60000)) : 0;
    $('foco-cuerpo').innerHTML = `<div class="foco-fila"><span>Curso:</span>${CURSOS_G.map((x) => `<button type="button" class="chk" data-fc="${x.id}" aria-pressed="${x.id === focoCurso}">${x.nombre}${focos[x.id] ? ' <small>📚</small>' : ''}</button>`).join('')}</div>
      ${F ? `<div class="foco-activo"><span>📚 Activo en ${c.nombre}: ${esc((F.titulos || []).join(', '))} · quedan ${quedan} min</span><button type="button" class="btn mini" id="foco-quitar">Quitar tema</button></div>` : `<p class="muted">${c.nombre} no tiene un tema fijado: las preguntas salen de toda la unidad del mundo donde juegan.</p>`}
      <div class="foco-fila"><label>Unidad <select id="foco-u">${['u1', 'u2', 'u3', 'u4'].map((u) => `<option value="${u}" ${u === focoUnidad ? 'selected' : ''}>${ZONAS_BASE[u]}</option>`).join('')}</select></label>
        <label>Duración <select id="foco-min">${[[45, '45 min'], [90, '90 min'], [180, '3 horas'], [600, 'Todo el día']].map(([m, t]) => `<option value="${m}" ${m === focoMin ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
      <div class="foco-temas">${Object.entries(titulos).map(([k, t]) => `<label><input type="checkbox" data-ft="${k}" ${focoSel.has(k) ? 'checked' : ''}> ${esc(t)}</label>`).join('')}</div>
      <div class="foco-fila"><button type="button" class="btn pri" id="foco-fijar" ${focoSel.size ? '' : 'disabled'}>📚 Fijar ${focoSel.size > 1 ? `${focoSel.size} temas` : 'tema'} en ${c.nombre}</button><span class="muted">Puedes elegir más de un tema.</span></div>`;
    $('foco-cuerpo').querySelectorAll('[data-fc]').forEach((b) => b.addEventListener('click', () => { focoCurso = b.dataset.fc; focoSel = new Set(); pintarFoco(); }));
    $('foco-u').addEventListener('change', (e) => { focoUnidad = e.target.value; focoSel = new Set(); pintarFoco(); });
    $('foco-min').addEventListener('change', (e) => { focoMin = Number(e.target.value); });
    $('foco-cuerpo').querySelectorAll('[data-ft]').forEach((x) => x.addEventListener('change', () => { if (x.checked) focoSel.add(x.dataset.ft); else focoSel.delete(x.dataset.ft); pintarFoco(); }));
    const fijar = async (foco) => {
      try { await Nube.docenteFoco(token, [focoCurso], foco); $('error').hidden = true; } catch (e) { $('error').textContent = 'No se pudo guardar el tema de la clase.'; $('error').hidden = false; }
      cargarFocos();
    };
    $('foco-fijar').addEventListener('click', () => fijar({ unidad: focoUnidad, temas: [...focoSel], titulos: [...focoSel].map((k) => titulos[k]), min: focoMin }));
    const q = $('foco-quitar'); if (q) q.addEventListener('click', () => fijar(null));
  }
  cargarFocos();
  setInterval(cargarFocos, 60000);

  // ---------- Maestría, historia y errores escritos (detalle del estudiante) ----------
  function profundidadHTML(e) {
    const p = e.progreso || {}, nivel = nivelDe(e), M = p.maestria || {};
    const rango = (m) => (m.g ? 3 : m.p >= 25 ? 2 : m.p >= 8 ? 1 : 0);
    const c = [0, 0, 0, 0], porRango = { 3: [], 2: [] };
    for (const [k, m] of Object.entries(M)) { const r = rango(m || {}); c[r] += 1; if (r >= 2) porRango[r].push(nombreTema(nivel, k).titulo); }
    const E = p.escritas || {};
    const errores = Object.entries(E).filter(([, l]) => l && l.length).map(([k, l]) => `<li><b>${esc(nombreTema(nivel, k).titulo)}:</b> ${l.slice(-3).map((x) => `escribió <code>${esc(x.r)}</code> (era <code>${esc(x.c)}</code>)`).join(' · ')}</li>`);
    const H = p.historia || {}, T = p.talentos || {};
    const tal = [['fuerza', '⚔️'], ['vitalidad', '❤️'], ['sabio', '📖'], ['suerte', '🍀']].filter(([id]) => T[id]).map(([id, ico]) => `${ico} ${T[id]}`).join(' · ');
    if (!Object.keys(M).length && !errores.length) return '';
    return `<h4>Maestría por tema</h4>
      <p>🥇 ${c[3]} oro · 🥈 ${c[2]} plata · 🥉 ${c[1]} bronce${porRango[3].length ? `<br><small class="muted">Oro: ${esc(porRango[3].join(', '))}</small>` : ''}${porRango[2].length ? `<br><small class="muted">Plata: ${esc(porRango[2].join(', '))}</small>` : ''}</p>
      <p class="muted">Modo historia: ${H.cap >= 4 ? 'completado 🎉' : `capítulo ${(H.cap || 0) + 1} de 4`}${tal ? ` · Talentos: ${tal}` : ''}</p>
      ${errores.length ? `<h4>Errores al escribir el resultado</h4><p class="muted">Respuestas escritas incorrectas más recientes (sin alternativas): sirven para ver el error típico.</p><ul class="errores-escritos">${errores.join('')}</ul>` : ''}`;
  }

  // ---------- Ticket de salida ----------
  let tickets = {}, ticketCurso = CURSOS_G[0].id, ticketUnidad = 'u1', ticketSel = new Set(), ticketN = 3, ticketMin = 15, ticketDif = 0, ticketTick = 0, ticketTocado = false, ticketEx = false;
  // Nota chilena (1,0 a 7,0) con 60 % de exigencia
  const notaDe = (a, t) => { const p = t ? a / t : 0; return Math.round((p >= 0.6 ? 4 + (3 * (p - 0.6)) / 0.4 : 1 + (3 * p) / 0.6) * 10) / 10; };
  const fmtNota = (n) => n.toFixed(1).replace('.', ',');
  function descargarNotas(T, c) {
    const R = T.respuestas || [];
    const filas = [['Estudiante', 'Correctas', 'Preguntas', 'Nota']];
    datos.filter((e) => e.curso === ticketCurso).sort((a, b) => a.nombre.localeCompare(b.nombre)).forEach((e) => {
      const r = R.find((x) => x.id === e.id);
      filas.push(r ? [e.nombre, r.aciertos, r.total, fmtNota(notaDe(r.aciertos, r.total))] : [e.nombre, '', '', 'No rindió']);
    });
    const csv = '﻿' + filas.map((f) => f.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `Evaluacion ${c.nombre} ${new Date(T.creado).toLocaleDateString('es-CL').replace(/\//g, '-')}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  }
  async function cargarTickets() {
    try { const r = await Nube.docenteTickets(token); if (r) { tickets = r.cursos || {}; ticketDif = r.ahora - Date.now(); } } catch (e) { /* aún sin la actualización de la base de datos */ }
    pintarTicket();
  }
  const ticketActivo = (T) => Boolean(T && T.activo && T.hasta > Date.now() + ticketDif);
  function ticketResultadosHTML(T, c) {
    const R = T.respuestas || [], activo = ticketActivo(T);
    const perf = R.filter((r) => r.aciertos === r.total).length;
    const prom = R.length ? Math.round((R.reduce((a, r) => a + r.aciertos / r.total, 0) / R.length) * 100) : null;
    const quedan = activo ? Math.max(0, Math.ceil((T.hasta - (Date.now() + ticketDif)) / 60000)) : 0;
    const falta = activo ? datos.filter((e) => e.curso === ticketCurso && e.conectado && !R.some((r) => r.id === e.id)) : [];
    const temas = {};
    R.forEach((r) => (r.detalle || []).forEach((x) => { const t = temas[x.tema] || (temas[x.tema] = { a: 0, i: 0 }); t.i += 1; if (x.ok) t.a += 1; }));
    const hora = new Date(T.creado).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    return `<div class="foco-activo"><span>${T.examen ? '📝' : '🎟️'} ${activo ? `${T.examen ? 'Evaluación abierta' : 'Ticket abierto'} en ${c.nombre} · se cierra en ${quedan} min` : `${T.examen ? 'Última evaluación' : 'Último ticket'} de ${c.nombre} (${hora})`}: ${esc((T.titulos || []).join(', '))}</span>${activo ? '<button type="button" class="btn mini" id="ticket-cerrar">Cerrar ticket</button>' : ''}</div>
      <div class="ticket-cifras"><span><b>${R.length}</b>respondieron</span><span><b>${perf}</b>todo correcto</span><span><b>${prom === null ? '–' : `${prom} %`}</b>acierto promedio</span>${T.examen && R.length ? `<span><b>${fmtNota(R.reduce((a, r) => a + notaDe(r.aciertos, r.total), 0) / R.length)}</b>nota promedio</span><span><b>${R.filter((r) => notaDe(r.aciertos, r.total) >= 4).length} de ${R.length}</b>aprobados (nota 4,0 o más)</span>` : ''}</div>
      ${Object.keys(temas).length > 1 ? `<div class="ticket-temas">${Object.entries(temas).map(([k, t]) => `<span>📘 ${esc(nombreTema(c.nivel, k).titulo)}: <b>${Math.round((t.a / t.i) * 100)} %</b></span>`).join('')}</div>` : ''}
      ${R.length ? `<div class="ticket-lista">${[...R].sort((a, b) => a.aciertos / a.total - b.aciertos / b.total || a.nombre.localeCompare(b.nombre)).map((r) => `<span class="ticket-est ${r.aciertos === r.total ? 'ok' : r.aciertos === 0 ? 'mal' : 'medio'}">${esc(r.nombre)} <b>${r.aciertos}/${r.total}${T.examen ? ` · ${fmtNota(notaDe(r.aciertos, r.total))}` : ''}</b></span>`).join('')}</div>` : '<p class="muted">Aún no llegan respuestas.</p>'}
      ${T.examen && R.length ? auditoriaHTML(R) : ''}
      ${T.examen && R.length ? '<p><button type="button" class="btn mini" id="ticket-csv">⬇️ Descargar notas (CSV para Excel)</button> <span class="muted">Incluye a todo el curso; quienes no respondieron aparecen como «No rindió».</span></p>' : ''}
      ${falta.length ? `<p class="muted">Conectados que aún no responden (${falta.length}): ${falta.map((e) => esc(e.nombre)).join(', ')}</p>` : ''}`;
  }
  function pintarTicket() {
    const el = $('ticket-cuerpo'); if (!el) return;
    const c = CURSOS_G.find((x) => x.id === ticketCurso), T = tickets[ticketCurso], F = focos[ticketCurso];
    // por defecto, el ticket es del tema de la clase
    if (!ticketTocado && !ticketSel.size && F && F.temas) { ticketSel = new Set(F.temas); ticketUnidad = F.unidad || ticketUnidad; }
    const titulos = Preguntas.titulos(c.nivel, ticketUnidad);
    el.innerHTML = `<div class="foco-fila"><span>Curso:</span>${CURSOS_G.map((x) => `<button type="button" class="chk" data-tc="${x.id}" aria-pressed="${x.id === ticketCurso}">${x.nombre}${ticketActivo(tickets[x.id]) ? ' <small>🎟️</small>' : ''}</button>`).join('')}</div>
      ${T ? ticketResultadosHTML(T, c) : `<p class="muted">${c.nombre} todavía no tiene tickets de salida.</p>`}
      <details ${T && ticketActivo(T) ? '' : 'open'}><summary><b>Lanzar un ticket o una evaluación</b></summary>
        <div class="foco-fila"><label><input type="checkbox" id="ticket-ex" ${ticketEx ? 'checked' : ''}> 📝 <b>Modo evaluación</b>: hasta 20 preguntas, sin pistas, con tiempo y nota (60 % de exigencia). El estudiante puede pausar y seguir donde quedó.</label></div>
        <div class="foco-fila"><label>Unidad <select id="ticket-u">${['u1', 'u2', 'u3', 'u4'].map((u) => `<option value="${u}" ${u === ticketUnidad ? 'selected' : ''}>${ZONAS_BASE[u]}</option>`).join('')}</select></label>
          <label>Preguntas <select id="ticket-n">${(ticketEx ? [5, 8, 10, 12, 15, 20] : [3, 4, 5]).map((n) => `<option value="${n}" ${n === ticketN ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <label>Abierto por <select id="ticket-min">${(ticketEx ? [[20, '20 min'], [30, '30 min'], [45, '45 min'], [60, '60 min'], [90, '90 min']] : [[10, '10 min'], [15, '15 min'], [30, '30 min']]).map(([m, t]) => `<option value="${m}" ${m === ticketMin ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
        <div class="foco-temas">${Object.entries(titulos).map(([k, t]) => `<label><input type="checkbox" data-tt="${k}" ${ticketSel.has(k) ? 'checked' : ''}> ${esc(t)}</label>`).join('')}</div>
        <div class="foco-fila"><button type="button" class="btn pri" id="ticket-lanzar" ${ticketSel.size ? '' : 'disabled'}>${ticketEx ? '📝 Lanzar evaluación' : '🎟️ Lanzar ticket'} en ${c.nombre}</button><span class="muted">Le aparece a cada estudiante apenas esté libre en el juego (no interrumpe combates).</span></div>
      </details>`;
    el.querySelectorAll('[data-tc]').forEach((b) => b.addEventListener('click', () => { ticketCurso = b.dataset.tc; ticketSel = new Set(); ticketTocado = false; pintarTicket(); }));
    $('ticket-u').addEventListener('change', (e) => { ticketUnidad = e.target.value; ticketSel = new Set(); ticketTocado = true; pintarTicket(); });
    $('ticket-n').addEventListener('change', (e) => { ticketN = Number(e.target.value); });
    $('ticket-min').addEventListener('change', (e) => { ticketMin = Number(e.target.value); });
    $('ticket-ex').addEventListener('change', (e) => { ticketEx = e.target.checked; ticketN = ticketEx ? 10 : 3; ticketMin = ticketEx ? 45 : 15; pintarTicket(); });
    el.querySelectorAll('[data-tt]').forEach((x) => x.addEventListener('change', () => { ticketTocado = true; if (x.checked) ticketSel.add(x.dataset.tt); else ticketSel.delete(x.dataset.tt); pintarTicket(); }));
    const enviar = async (ticket) => {
      try { const r = await Nube.docenteTicket(token, [ticketCurso], ticket); if (r) { tickets = r.cursos || {}; ticketDif = r.ahora - Date.now(); } $('error').hidden = true; }
      catch (e) { $('error').textContent = 'No se pudo guardar el ticket de salida.'; $('error').hidden = false; }
      pintarTicket();
    };
    $('ticket-lanzar').addEventListener('click', () => {
      const sel = [...ticketSel];
      if (ticketActivo(T) && !confirm('Ya hay un ticket abierto en este curso. ¿Cerrarlo y lanzar uno nuevo?')) return;
      enviar({ temas: sel, titulos: sel.map((k) => titulos[k] || nombreTema(c.nivel, k).titulo), n: ticketN, min: ticketMin, examen: ticketEx });
    });
    const q = $('ticket-cerrar'); if (q) q.addEventListener('click', () => enviar(null));
    const csv = $('ticket-csv'); if (csv && T) csv.addEventListener('click', () => descargarNotas(T, c));
  }
  cargarTickets();
  // mientras haya un ticket abierto se actualiza cada 5 segundos; si no, cada minuto
  setInterval(() => { ticketTick += 1; if (Object.values(tickets).some(ticketActivo) || ticketTick % 12 === 0) cargarTickets(); }, 5000);

  // ---------- Refuerzo personalizado (desde el detalle de cada estudiante) ----------
  let refuerzos = {};
  async function cargarRefuerzos() {
    try { const r = await Nube.docenteRefuerzos(token); if (r) refuerzos = r; } catch (e) { /* aún sin la actualización */ }
  }
  cargarRefuerzos(); setInterval(cargarRefuerzos, 60000);

  // ---------- Guardados sospechosos (el servidor no los guarda y deja el aviso) ----------
  let alertas = {};
  async function cargarAlertas() {
    try { const r = await Nube.docenteAlertas(token); if (r) { alertas = r; if (vista === 'analisis') pintarAnalisis(); } } catch (e) { /* aún sin la actualización */ }
  }
  cargarAlertas(); setInterval(cargarAlertas, 120000);
  const textoAlerta = (a) => {
    const d = a.detalle || {}, f = new Date(a.t).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    return a.tipo === 'nivel' ? `${f}: intentó pasar del nivel ${d.antes} al ${d.ahora} en ${d.seg} s`
      : a.tipo === 'respuestas' ? `${f}: intentó sumar ${d.ahora - d.antes} respuestas en ${d.seg} s`
      : `${f}: envió más aciertos que intentos en un tema`;
  };
  function alertasHTML(e) {
    const l = alertas[e.id]; if (!l || !l.length) return '';
    return `<div class="refuerzo-caja" style="border-color:#e76f51"><h4 style="margin:0 0 6px">⚠️ Posible alteración del progreso</h4>
      <p class="muted">El juego recibió un avance que no es posible jugando y <b>no lo guardó</b> (su progreso real sigue intacto). Puede ser un intento de trampa o, rara vez, dos pestañas abiertas a la vez.</p>
      <ul class="errores-escritos">${l.slice(0, 5).map((a) => `<li>${esc(textoAlerta(a))}</li>`).join('')}</ul></div>`;
  }
  // ---------- Errores típicos: qué alternativa incorrecta eligen ----------
  function erroresAltHTML(e) {
    const E = (e.progreso || {}).errAlt || {}, nivel = nivelDe(e);
    const filas = Object.entries(E).filter(([, l]) => l && l.length).map(([k, l]) => `<li><b>${esc(nombreTema(nivel, k).titulo)}:</b> ${l.map((x) => `«${esc(x.e)}» → eligió <code>${esc(x.r)}</code>`).join(' · ')}</li>`);
    return filas.length ? `<h4>Alternativas incorrectas que eligió</h4><p class="muted">Últimos errores por tema: muestran el razonamiento equivocado detrás de la respuesta.</p><ul class="errores-escritos">${filas.join('')}</ul>` : '';
  }
  function erroresCursoHTML(lista, temas, nivel) {
    const dificiles = temas.filter((t) => t.i >= 5).slice(0, 6);
    const bloques = dificiles.map((t) => {
      const ej = [];
      for (const e of lista) for (const x of (((e.progreso || {}).errAlt || {})[t.k] || [])) ej.push(x);
      for (const e of lista) for (const x of (((e.progreso || {}).escritas || {})[t.k] || []).slice(-2)) ej.push({ e: `(respuesta escrita; lo correcto era ${x.c})`, r: x.r });
      if (!ej.length) return '';
      // las respuestas equivocadas más repetidas primero
      const cuenta = {}; ej.forEach((x) => { cuenta[x.r] = (cuenta[x.r] || 0) + 1; });
      const rep = Object.entries(cuenta).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 3);
      return `<li><b>${esc(t.titulo)}</b> <span class="muted">(${t.pct} % de acierto)</span>${rep.length ? `<br><span class="muted">Respuestas equivocadas que más se repiten:</span> ${rep.map(([r, n]) => `<code>${esc(r)}</code> ×${n}`).join(' · ')}` : ''}
        <ul>${ej.slice(-5).map((x) => `<li>«${esc(x.e)}» → <code>${esc(x.r)}</code></li>`).join('')}</ul></li>`;
    }).filter(Boolean);
    return `<h2>🔎 Errores típicos del curso</h2><span class="muted">En los temas con menor acierto, qué preguntaron y qué respondieron mal: sirve para ver el error conceptual y retomarlo en la pizarra.</span>
      ${bloques.length ? `<ul class="errores-escritos">${bloques.join('')}</ul>` : '<p class="muted">Aún no hay errores registrados: se empiezan a guardar desde esta actualización, a medida que los estudiantes jueguen.</p>'}`;
  }
  // ---------- Enlace de solo lectura para apoderados ----------
  const urlInforme = (k) => `${location.origin}/juego/informe.html?c=${k}`;
  function enlaceHTML(e) {
    if (e.curso === 'INV') return '';
    return `<h4>Informe para apoderados</h4>
      ${e.enlace ? `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input type="text" readonly id="enl-url" value="${esc(urlInforme(e.enlace))}" style="flex:1;min-width:220px;padding:6px 8px">
          <button type="button" class="btn pri" id="enl-copiar">Copiar enlace</button><button type="button" class="btn" data-enl="renovar">Cambiar enlace</button><button type="button" class="btn peligro" data-enl="quitar">Desactivar</button></div>
          <span class="muted">Quien tenga este enlace ve solo el informe de este estudiante (sin RUT ni clave) y no puede entrar al juego. Si lo cambias o lo desactivas, el enlace anterior deja de funcionar.</span>`
        : '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="muted">Crea un enlace de solo lectura para enviarle al apoderado: verá el informe del estudiante siempre actualizado, sin clave.</span><button type="button" class="btn" data-enl="crear">🔗 Crear enlace</button></div>'}`;
  }
  function conectarEnlace(e) {
    document.querySelectorAll('#det [data-enl]').forEach((b) => b.addEventListener('click', async () => {
      if (b.dataset.enl === 'quitar' && !confirm('¿Desactivar el enlace? El apoderado ya no podrá ver el informe.')) return;
      try { const r = await Nube.docenteEnlace(token, e.id, b.dataset.enl); if (r && r.ok) e.enlace = r.enlace; } catch (err) { alert('No se pudo cambiar el enlace. Inténtalo otra vez.'); }
      detalle(e.id);
    }));
    const c = $('enl-copiar');
    if (c) c.addEventListener('click', async () => {
      const u = $('enl-url'); u.select();
      try { await navigator.clipboard.writeText(u.value); c.textContent = '¡Copiado!'; } catch (err) { document.execCommand('copy'); c.textContent = '¡Copiado!'; }
    });
  }
  // ---------- Evaluación: respuestas pregunta por pregunta ----------
  function auditoriaHTML(R) {
    const conDet = R.filter((r) => (r.detalle || []).some((x) => x.e));
    if (!conDet.length) return '';
    return `<details><summary><b>🔎 Revisar respuestas pregunta por pregunta</b></summary>${conDet.map((r) => {
      const D = r.detalle || [], seg = D.reduce((n, x) => n + (x.s || 0), 0), prom = D.length ? seg / D.length : 0;
      return `<details style="margin:6px 0 6px 12px"><summary>${esc(r.nombre)} · ${r.aciertos}/${r.total} · ${Math.round(seg / 60)} min${prom < 4 ? ' · ⚡ <b>respondió muy rápido</b> (menos de 4 s por pregunta)' : ''}</summary>
        <ol class="errores-escritos">${D.map((x) => `<li>${x.ok ? '✅' : '❌'} ${esc(x.e || '(sin responder)')}${x.e ? ` → respondió <code>${esc(x.r)}</code>${x.ok ? '' : ` (correcta: <code>${esc(x.c)}</code>)`} <span class="muted">${x.s || 0} s</span>` : ''}</li>`).join('')}</ol></details>`;
    }).join('')}</details>`;
  }
  function refuerzoHTML(e) {
    if (e.curso === 'INV') return '';
    const nivel = nivelDe(e), R = refuerzos[e.id];
    const stats = Object.entries((e.progreso || {}).stats || {}).filter(([, s]) => s.i > 0).map(([k, s]) => ({ k, t: nombreTema(nivel, k).titulo, pct: Math.round((s.a / s.i) * 100), i: s.i })).sort((a, b) => a.pct - b.pct);
    const todos = [];
    for (const u of ['u1', 'u2', 'u3', 'u4']) for (const [k, t] of Object.entries(Preguntas.titulos(nivel, u))) if (!stats.some((s) => s.k === k)) todos.push({ k, t });
    const opciones = stats.map((s) => `<option value="${s.k}">${esc(s.t)} · ${s.pct} % (${s.i} resp.)</option>`).join('') + (todos.length ? `<optgroup label="Temas que aún no practica">${todos.map((s) => `<option value="${s.k}">${esc(s.t)}</option>`).join('')}</optgroup>` : '');
    return `<div class="refuerzo-caja"><h4 style="margin:0 0 6px">🎯 Refuerzo personalizado</h4>
      ${R && !R.completado ? `<p><b>Asignado:</b> ${esc(R.titulo)} · ${R.meta} respuestas correctas · <span class="muted">pendiente</span> <button type="button" class="btn mini" id="ref-quitar">Quitar</button></p>`
        : R && R.completado ? `<p>✅ Completó su último refuerzo: <b>${esc(R.titulo)}</b> (${esc(hace(R.completado))}).</p>` : '<p class="muted">El estudiante verá una misión con premio extra, y las preguntas de ese tema le aparecerán más seguido en todo el juego.</p>'}
      <div class="foco-fila"><select id="ref-tema">${opciones}</select><select id="ref-meta">${[5, 8, 12, 20].map((n) => `<option value="${n}" ${n === 8 ? 'selected' : ''}>${n} correctas</option>`).join('')}</select>
        <button type="button" class="btn pri" id="ref-asignar">Asignar refuerzo</button></div></div>`;
  }
  function conectarRefuerzo(e) {
    const asignar = $('ref-asignar'); if (!asignar) return;
    const titulo = () => { const s = $('ref-tema'); return s.options[s.selectedIndex] ? s.options[s.selectedIndex].text.replace(/ · \d+ %.*$/, '') : s.value; };
    asignar.addEventListener('click', async () => {
      try { const r = await Nube.docenteRefuerzo(token, e.id, $('ref-tema').value, titulo(), Number($('ref-meta').value), 'asignar'); if (r) refuerzos = r; } catch (err) { alert('No se pudo asignar el refuerzo. ¿Está aplicada la actualización de la base de datos?'); }
      detalle(e.id); pintarAnalisis();
    });
    const q = $('ref-quitar');
    if (q) q.addEventListener('click', async () => { try { const r = await Nube.docenteRefuerzo(token, e.id, '', '', 0, 'quitar'); if (r) refuerzos = r; } catch (err) { /* */ } detalle(e.id); pintarAnalisis(); });
  }

  // ---------- Informe de cada estudiante (para imprimir, guardar como PDF o mostrar a apoderados) ----------
  const datosInforme = (e) => ({ nombre: e.nombre, cursoNombre: (CURSOS.find((c) => c.id === e.curso) || {}).nombre || e.curso, p: e.progreso || {}, nombreTema: (k) => nombreTema(nivelDe(e), k), zonas: ZONAS_BASE });
  function informeEstudiante(e) {
    const w = window.open('', '_blank');
    if (!w) { alert('El navegador bloqueó la ventana del informe. Permite las ventanas emergentes para este sitio.'); return; }
    w.document.write(InformeMW.pagina(datosInforme(e))); w.document.close();
  }

  // ---------- Informe del curso (para imprimir o guardar como PDF) ----------
  function informeCurso() {
    const c = CURSOS.find((x) => x.id === curso), lista = datos.filter((e) => e.curso === curso), rs = lista.map(resumen);
    const hoy = new Date(), semana = Date.now() - 7 * 86400000;
    const activos = lista.filter((e) => e.ultimo && new Date(e.ultimo).getTime() > semana);
    const sinEntrar = lista.filter((e) => !e.ultimo || new Date(e.ultimo).getTime() <= semana);
    const conAcierto = rs.filter((r) => r.acierto !== null);
    const prom = conAcierto.length ? Math.round(conAcierto.reduce((s, r) => s + r.acierto, 0) / conAcierto.length) : null;
    const jugando = rs.filter((r) => r.nivel > 0);
    const promNivel = jugando.length ? (jugando.reduce((s, r) => s + r.nivel, 0) / jugando.length).toFixed(1).replace('.', ',') : '–';
    const temas = c.nivel ? temasDe(lista, c.nivel) : [];
    const apoyo = c.nivel ? apoyoDe(lista, c.nivel) : [];
    const top = lista.map((e, i) => ({ e, r: rs[i] })).sort((a, b) => b.r.nivel - a.r.nivel).slice(0, 5);
    const fila = (a) => `<tr>${a.map((x) => `<td>${x}</td>`).join('')}</tr>`;
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Informe ${esc(c.nombre)} · Math World</title>
      <style>body{font-family:system-ui,sans-serif;color:#1d2b25;margin:28px;max-width:900px} h1{margin:0 0 4px} h2{margin:22px 0 8px;font-size:18px;border-bottom:2px solid #2a9d8f;padding-bottom:4px}
      .cifras{display:grid;grid-template-columns:repeat(4,1fr);gap:10px} .cifras div{border:1px solid #cfe3dc;border-radius:10px;padding:10px} .cifras b{display:block;font-size:24px}
      table{width:100%;border-collapse:collapse;font-size:14px} td,th{border-bottom:1px solid #e3ece8;padding:5px 6px;text-align:left} .muted{color:#667} @media print{button{display:none}}</style></head><body>
      <button onclick="print()" style="float:right;padding:8px 14px">🖨️ Imprimir o guardar como PDF</button>
      <h1>Informe de ${esc(c.nombre)}</h1><div class="muted">Math World · ${hoy.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      <h2>Resumen</h2><div class="cifras"><div><span>Estudiantes</span><b>${lista.length}</b></div><div><span>Jugaron esta semana</span><b>${activos.length}</b></div><div><span>Nivel promedio</span><b>${promNivel}</b></div><div><span>Acierto promedio</span><b>${prom === null ? '–' : prom + ' %'}</b></div></div>
      <h2>Temas más difíciles para el curso</h2>${temas.length ? `<table><tr><th>Tema</th><th>Acierto</th><th>Respuestas</th><th>Con dificultad</th></tr>${temas.slice(0, 8).map((t) => fila([esc(t.titulo), `${t.pct} %`, t.i, t.dif])).join('')}</table>` : '<p class="muted">Aún no hay respuestas.</p>'}
      <h2>Estudiantes que necesitan apoyo</h2>${apoyo.length ? `<table><tr><th>Estudiante</th><th>Acierto</th><th>Temas bajos</th><th>Refuerzo</th></tr>${apoyo.map(({ e, r, debil }) => fila([esc(e.nombre), `${r.acierto ?? '–'} %`, esc(debil.slice(0, 3).map((d) => `${d.t} (${d.pct} %)`).join(', ') || `${r.intentos} respuestas`), refuerzos[e.id] ? (refuerzos[e.id].completado ? '✅ Completado' : `🎯 ${esc(refuerzos[e.id].titulo)}`) : '—'])).join('')}</table>` : '<p class="muted">Nadie bajo los umbrales. 🎉</p>'}
      <h2>Mayor avance</h2><table><tr><th>Estudiante</th><th>Nivel</th><th>Acierto</th><th>Respuestas</th></tr>${top.map(({ e, r }) => fila([esc(e.nombre), r.nivel || '–', `${r.acierto ?? '–'} %`, r.intentos])).join('')}</table>
      <h2>No han jugado en los últimos 7 días (${sinEntrar.length})</h2><p>${sinEntrar.length ? sinEntrar.map((e) => `${esc(e.nombre)}${e.ultimo ? ` <span class="muted">(${esc(hace(e.ultimo))})</span>` : ' <span class="muted">(nunca)</span>'}`).join(' · ') : 'Todos jugaron esta semana. 🎉'}</p>
      </body></html>`;
    const w = window.open('', '_blank');
    if (!w) { alert('El navegador bloqueó la ventana del informe. Permite las ventanas emergentes para este sitio.'); return; }
    w.document.write(html); w.document.close();
  }
  $('btn-informe').addEventListener('click', informeCurso);
  // ---------- Torneo PvP del curso (llaves de eliminación entre los campeones de cada clan) ----------
  const tKey = (c) => `mw_torneo_${c}`;
  const leerTorneo = (c) => { try { return JSON.parse(localStorage.getItem(tKey(c)) || 'null'); } catch (e) { return null; } };
  const guardarTorneo = (c, t) => { try { if (t) localStorage.setItem(tKey(c), JSON.stringify(t)); else localStorage.removeItem(tKey(c)); } catch (e) { /* */ } };
  function crearTorneo(grupos) {
    const g = [...grupos].sort(() => Math.random() - 0.5);
    let n = 1; while (n < g.length) n *= 2;
    const r1 = [];
    for (let i = 0; i < n / 2; i++) r1.push({ a: g[i] || null, b: g[n - 1 - i] || null, gan: null, duelo: null });
    r1.forEach((p) => { if (!p.a || !p.b) p.gan = p.a || p.b; });   // pase directo cuando no hay rival
    const rondas = [r1]; let k = r1.length;
    while (k > 1) { k /= 2; rondas.push(Array.from({ length: k }, () => ({ a: null, b: null, gan: null, duelo: null }))); }
    const t = { rondas, campeon: null }; avanzarTorneo(t); return t;
  }
  function avanzarTorneo(t) {
    for (let r = 0; r < t.rondas.length - 1; r++) t.rondas[r].forEach((p, i) => { if (p.gan) { const s = t.rondas[r + 1][Math.floor(i / 2)]; if (i % 2 === 0) s.a = p.gan; else s.b = p.gan; } });
    for (let r = 1; r < t.rondas.length; r++) t.rondas[r].forEach((p) => { if (!p.gan && ((p.a && !p.b && t.rondas[r - 1].every((x) => x.gan)) || (p.b && !p.a && t.rondas[r - 1].every((x) => x.gan)))) p.gan = p.a || p.b; });
    const final = t.rondas[t.rondas.length - 1][0]; t.campeon = final.gan || null;
  }
  const siguientePartido = (t) => { for (let r = 0; r < t.rondas.length; r++) for (let i = 0; i < t.rondas[r].length; i++) { const p = t.rondas[r][i]; if (!p.gan && p.a && p.b) return [r, i, p]; } return null; };
  function revisarTorneo(W) {
    const t = leerTorneo(gCurso); if (!t || !W || !W.duelo) return;
    const D = W.duelo, sp = siguientePartido(t); if (!sp) return;
    const [, , p] = sp;
    if (p.duelo === D.id && D.fase === 'fin' && D.ganador) { p.gan = String(D.ganador) === String(p.a) ? p.a : p.b; avanzarTorneo(t); guardarTorneo(gCurso, t); }
  }
  function torneoHTML(W, clanes) {
    const t = leerTorneo(gCurso);
    const nom = (g) => (g ? nomClan(W, g) : '—');
    if (!t) return `<div class="gd-bloque"><h4>🏆 Torneo PvP del curso</h4><p class="muted">Elige los clanes que participan: se arman llaves de eliminación y lanzas cada duelo con un botón. El ganador de cada duelo pasa a la siguiente ronda.</p>
      <div class="gd-fila" style="justify-content:flex-start">${clanes.map((k) => `<label class="chk"><input type="checkbox" data-tclan="${k.grupo}" ${k.conectados ? 'checked' : ''}> ${esc(k.nombre || `Grupo ${k.grupo}`)} <small>(${k.conectados} en línea)</small></label>`).join('')}</div>
      <button type="button" class="btn pri" id="t-crear">Crear torneo</button></div>`;
    const sp = siguientePartido(t), D = W.duelo, enCurso = D && ['eligiendo', 'lucha'].includes(D.fase);
    return `<div class="gd-bloque"><div class="gd-fila"><h4 style="margin:0">🏆 Torneo PvP del curso</h4><button type="button" class="btn mini" id="t-borrar">Borrar torneo</button></div>
      <div class="torneo">${t.rondas.map((ronda, r) => `<div class="ronda"><small class="muted">${r === t.rondas.length - 1 ? 'Final' : r === t.rondas.length - 2 ? 'Semifinal' : `Ronda ${r + 1}`}</small>${ronda.map((p) => `<div class="partido ${sp && sp[2] === p ? 'actual' : ''}"><div class="${p.gan ? (p.gan === p.a ? 'gana' : 'pierde') : ''}">${esc(nom(p.a))}</div><div class="${p.gan ? (p.gan === p.b ? 'gana' : 'pierde') : ''}">${esc(nom(p.b))}</div></div>`).join('')}</div>`).join('')}</div>
      ${t.campeon ? `<p><b>🏆 Campeón del torneo: ${esc(nom(t.campeon))}</b> <button type="button" class="btn mini" id="t-bono">+50 puntos de bono</button></p>`
        : sp ? `<div class="gd-fila"><span>Siguiente: <b>${esc(nom(sp[2].a))}</b> vs <b>${esc(nom(sp[2].b))}</b></span><span>${enCurso ? '<span class="muted">Hay un duelo en curso…</span>' : `<button type="button" class="btn pri" id="t-lanzar">⚔️ Lanzar duelo del torneo</button>`}
          <button type="button" class="btn mini" data-tgan="a">Gana ${esc(nom(sp[2].a))}</button><button type="button" class="btn mini" data-tgan="b">Gana ${esc(nom(sp[2].b))}</button></span></div><span class="muted">Si un duelo se cancela o termina sin ganador, puedes repetirlo o marcar al ganador a mano.</span>` : ''}</div>`;
  }
  function conectarTorneo(W) {
    const crear = $('t-crear');
    if (crear) crear.addEventListener('click', () => {
      const g = [...document.querySelectorAll('[data-tclan]')].filter((x) => x.checked).map((x) => x.dataset.tclan);
      if (g.length < 2) { alert('Elige al menos dos clanes.'); return; }
      guardarTorneo(gCurso, crearTorneo(g)); pintarGuerra();
    });
    const borrar = $('t-borrar'); if (borrar) borrar.addEventListener('click', () => { if (confirm('¿Borrar el torneo?')) { guardarTorneo(gCurso, null); pintarGuerra(); } });
    const t = leerTorneo(gCurso); if (!t) return;
    const sp = siguientePartido(t);
    const lanzar = $('t-lanzar');
    if (lanzar && sp) lanzar.addEventListener('click', async () => {
      const [r, , p] = sp;
      await opGuerra([gCurso], { op: 'duelo', a: String(p.a), b: String(p.b), gana: Number(gSel.gana) || 0, pierde: Number(gSel.pierde) || 0, torneo: { ronda: r + 1 } });
      const D = gEstado[gCurso] && gEstado[gCurso].guerra && gEstado[gCurso].guerra.duelo;
      if (D) { p.duelo = D.id; guardarTorneo(gCurso, t); }
      pintarGuerra();
    });
    document.querySelectorAll('[data-tgan]').forEach((b) => b.addEventListener('click', () => { const [, , p] = sp; p.gan = b.dataset.tgan === 'a' ? p.a : p.b; avanzarTorneo(t); guardarTorneo(gCurso, t); pintarGuerra(); }));
    const bono = $('t-bono'); if (bono) bono.addEventListener('click', () => { opGuerra([gCurso], { op: 'puntos', grupo: t.campeon, delta: 50 }); bono.disabled = true; });
  }
  // ---------- Guerra de clanes ----------
  let gEstado = {}, gDif = 0, gCurso = CURSOS_G[0].id, gT = null, gOcupado = false;
  const gSel = { a: '', b: '', gana: 30, pierde: 15, dur: {} };
  const gAhora = () => Date.now() + gDif;
  const nomClan = (W, g) => { const r = W && (W.ranking || []).find((x) => String(x.grupo) === String(g)); return r ? r.nombre : `Grupo ${g}`; };
  const tareaViva = (W) => (W && W.activa && W.tarea && gAhora() < W.tarea.hasta ? W.tarea : null);
  async function cargarGuerras() {
    clearTimeout(gT);
    try { const r = await Nube.docenteGuerras(token); if (r) { gDif = r.ahora - Date.now(); gEstado = r.cursos || {}; } } catch (e) { /* se reintenta */ }
    revisarTorneo(gEstado[gCurso] && gEstado[gCurso].guerra);
    pintarGuerraResumen();
    if ($('guerra-dlg').open) pintarGuerra();
    const activa = Object.values(gEstado).some((c) => c && c.guerra && c.guerra.activa);
    gT = setTimeout(cargarGuerras, activa ? 3000 : 20000);
  }
  async function opGuerra(cursos, op) {
    gOcupado = true; pintarGuerra();
    try {
      const r = await Nube.docenteGuerra(token, cursos, op);
      if (r) { gDif = r.ahora - Date.now(); gEstado = r.cursos || {}; }
      $('error').hidden = true;
    } catch (e) { $('error').textContent = 'No se pudo actualizar la guerra de clanes. Revisa tu conexión e inténtalo otra vez.'; $('error').hidden = false; }
    gOcupado = false; pintarGuerra(); pintarGuerraResumen(); cargarGuerras();
  }
  async function opClan(grupo, accion) {
    gOcupado = true; pintarGuerra();
    try { const r = await Nube.docenteClan(token, gCurso, grupo, accion); if (r) { gDif = r.ahora - Date.now(); gEstado = r.cursos || {}; } } catch (e) { $('error').textContent = 'No se pudo cambiar el clan.'; $('error').hidden = false; }
    gOcupado = false; pintarGuerra();
  }
  function pintarGuerraResumen() {
    const html = CURSOS_G.map((c) => {
      const W = gEstado[c.id] && gEstado[c.id].guerra; if (!W || !W.activa) return '';
      const T = tareaViva(W), top = (W.ranking || [])[0];
      return `<div class="des-vivo activo"><div class="fila-d"><strong>${c.nombre} · ⚔️ Guerra en curso</strong><button type="button" class="btn mini" data-gabrir="${c.id}">Administrar</button></div>
        <div class="fila-d"><span>${T ? `${T.icono} ${esc(T.nombre)} · <span class="reloj" data-greloj="${c.id}">${mmss(T.hasta - gAhora())}</span>` : '<span class="muted">Sin tarea en curso</span>'}</span>${top ? `<span>🥇 ${esc(top.nombre)} · ${top.puntos} pts</span>` : ''}</div></div>`;
    }).join('');
    $('guerra-estado').innerHTML = html; $('guerra-estado').hidden = !html; $('guerra-nada').hidden = Boolean(html);
    $('guerra-estado').querySelectorAll('[data-gabrir]').forEach((b) => b.addEventListener('click', () => { gCurso = b.dataset.gabrir; pintarGuerra(); $('guerra-dlg').showModal(); }));
  }
  function pintarGuerra() {
    $('gd-cursos').innerHTML = '<span class="lbl">Curso:</span>' + CURSOS_G.map((c) => {
      const W = gEstado[c.id] && gEstado[c.id].guerra;
      return `<button type="button" class="chk" data-gc="${c.id}" aria-pressed="${gCurso === c.id}">${c.nombre}${W && W.activa ? ' <small>⚔️ en guerra</small>' : ''}</button>`;
    }).join('');
    $('gd-cursos').querySelectorAll('[data-gc]').forEach((b) => b.addEventListener('click', () => { gCurso = b.dataset.gc; gSel.a = ''; gSel.b = ''; pintarGuerra(); }));
    const C = gEstado[gCurso] || {}, W = C.guerra, activa = Boolean(W && W.activa), clanes = C.clanes || [];
    const dis = gOcupado ? 'disabled' : '';
    let h = '';
    if (!activa) {
      h += `<div class="gd-bloque"><div class="gd-fila"><span>No hay una guerra en curso en ${esc(CURSOS_G.find((c) => c.id === gCurso).nombre)}.</span><button type="button" class="btn pri" id="gd-iniciar" ${dis}>⚔️ Iniciar guerra de clanes</button></div></div>`;
      if (W && W.resultado) h += `<div class="gd-bloque"><h4>Resultado de la última guerra</h4><ol>${W.resultado.map((r) => `<li><strong>${esc(r.nombre)}</strong> · ${r.puntos} pts</li>`).join('')}</ol><span class="muted">Cada integrante que participó recibe su premio al entrar al juego (mejor lugar, mejor premio).</span></div>`;
    } else {
      const T = tareaViva(W), D = W.duelo && ['eligiendo', 'lucha'].includes(W.duelo.fase) ? W.duelo : null;
      h += `<div class="gd-bloque"><div class="gd-fila"><strong>⚔️ Guerra en curso</strong><button type="button" class="btn peligro" id="gd-terminar" ${dis}>🏁 Terminar guerra y repartir premios</button></div></div>`;
      h += `<div class="gd-bloque"><h4>Tarea en vivo</h4>${T ? `<div class="gd-actual gd-fila"><span>${T.icono} ${esc(T.nombre)} · +${T.pts} por acción</span><span><span class="reloj" id="gd-reloj">${mmss(T.hasta - gAhora())}</span> <button type="button" class="btn mini" id="gd-detener" ${dis}>Detener</button></span></div>` : '<p class="muted">Ninguna tarea en curso. Lanza una del banco:</p>'}
        <div class="gd-tareas" style="margin-top:10px">${TAREAS_GUERRA.map((t) => {
          const dur = gSel.dur[t.id] || t.seg;
          return `<div class="gd-tarea"><strong>${t.icono} ${esc(t.nombre)}</strong><p>${esc(t.desc)} <b>+${t.pts}</b> c/u.</p>
            <div class="pie"><select data-gdur="${t.id}" aria-label="Duración">${[60, 120, 180, 300, 600].map((s) => `<option value="${s}" ${s === dur ? 'selected' : ''}>${s / 60} min</option>`).join('')}${[60, 120, 180, 300, 600].includes(dur) ? '' : `<option value="${dur}" selected>${mmss(dur * 1000)} min</option>`}</select>
            <button type="button" class="btn pri mini" data-gtarea="${t.id}" ${dis}>Lanzar</button></div></div>`;
        }).join('')}</div></div>`;
      const opc = (sel) => `<option value="">Elegir…</option>` + clanes.map((k) => `<option value="${k.grupo}" ${String(sel) === String(k.grupo) ? 'selected' : ''}>${esc(k.nombre || `Grupo ${k.grupo}`)} (${k.conectados} en línea)</option>`).join('');
      h += `<div class="gd-bloque gd-duelo"><h4>Duelo PvP entre clanes</h4>
        ${D ? `<div class="gd-actual gd-fila"><span>⚔️ ${esc(nomClan(W, D.a))} vs ${esc(nomClan(W, D.b))} · ${D.fase === 'eligiendo' ? `los líderes eligen campeón (${mmss(D.hasta - gAhora())})` : 'luchando en la arena'}</span><button type="button" class="btn mini" id="gd-cduelo" ${dis}>Cancelar duelo</button></div>`
          : `${W.duelo && W.duelo.fase === 'fin' ? `<p class="muted">Último duelo: ${W.duelo.ganador ? `ganó <b>${esc(nomClan(W, W.duelo.ganador))}</b>` : 'sin ganador'}.</p>` : ''}
          <div class="gd-fila" style="justify-content:flex-start"><select id="gd-a">${opc(gSel.a)}</select><span>vs</span><select id="gd-b">${opc(gSel.b)}</select>
          <label>Gana <input type="number" id="gd-gana" min="0" max="200" value="${gSel.gana}"></label><label>Pierde <input type="number" id="gd-pierde" min="0" max="200" value="${gSel.pierde}"></label>
          <button type="button" class="btn pri" id="gd-lduelo" ${dis}>Lanzar duelo</button></div>
          <p class="muted">El líder de cada clan tiene 35 segundos para elegir a su campeón (si no, se elige a alguien conectado al azar). Los campeones entran directo a la arena y el resto del curso puede mirar.</p>`}</div>`;
      h += `<div class="gd-bloque"><h4>Ranking en vivo</h4><table class="gd-tabla"><thead><tr><th>Lugar</th><th>Clan</th><th>Puntos</th><th>Ajustar</th></tr></thead><tbody>${(W.ranking || []).map((r, i) => `<tr><td>${['🥇', '🥈', '🥉'][i] || i + 1}</td><td>${esc(r.nombre)}</td><td class="num">${r.puntos}</td>
        <td class="acc"><button type="button" class="btn mini" data-gpts="${r.grupo}" data-d="10" ${dis}>+10</button><button type="button" class="btn mini" data-gpts="${r.grupo}" data-d="-10" ${dis}>−10</button></td></tr>`).join('')}</tbody></table></div>`;
    }
    if (activa) h += torneoHTML(W, clanes);
    h += `<div class="gd-bloque"><h4>Clanes del curso</h4><table class="gd-tabla"><thead><tr><th>Grupo</th><th>Nombre del clan</th><th>Líder</th><th>Votos</th><th>En línea</th><th></th></tr></thead><tbody>${clanes.map((k) => `<tr><td>${k.grupo}</td><td>${k.nombre ? esc(k.nombre) : '<span class="muted">Sin nombre</span>'}</td><td>${k.lider ? esc(k.lider) : '<span class="muted">Votando…</span>'}</td><td>${k.votos}/${k.miembros}</td><td>${k.conectados}</td>
      <td class="acc">${k.nombre ? `<button type="button" class="btn mini" data-gclan="${k.grupo}" data-acc="borrar_nombre" ${dis}>Borrar nombre</button>` : ''}${!k.lider && k.votos ? `<button type="button" class="btn mini" data-gclan="${k.grupo}" data-acc="cerrar_voto" ${dis}>Cerrar votación</button>` : ''}${k.lider || k.votos ? `<button type="button" class="btn peligro mini" data-gclan="${k.grupo}" data-acc="reiniciar" ${dis}>Reiniciar</button>` : ''}</td></tr>`).join('')}</tbody></table>
      <span class="muted">«Cerrar votación» nombra líder a quien tiene más votos. «Reiniciar» borra el líder, el nombre y los votos del clan.</span></div>`;
    $('gd-cuerpo').innerHTML = h;
    if (activa) conectarTorneo(W);
    const on = (id, f) => { const el = $(id); if (el) el.addEventListener('click', f); };
    on('gd-iniciar', () => opGuerra([gCurso], { op: 'iniciar' }));
    on('gd-terminar', () => { if (confirm('¿Terminar la guerra de clanes? Se cerrará el ranking y cada clan recibirá su premio según su lugar.')) opGuerra([gCurso], { op: 'terminar' }); });
    on('gd-detener', () => opGuerra([gCurso], { op: 'detener_tarea' }));
    on('gd-cduelo', () => opGuerra([gCurso], { op: 'cancelar_duelo' }));
    on('gd-lduelo', () => {
      if (!gSel.a || !gSel.b || gSel.a === gSel.b) { alert('Elige dos clanes distintos.'); return; }
      opGuerra([gCurso], { op: 'duelo', a: String(gSel.a), b: String(gSel.b), gana: Number(gSel.gana) || 0, pierde: Number(gSel.pierde) || 0 });
    });
    const val = (id, k) => { const el = $(id); if (el) el.addEventListener('change', () => { gSel[k] = el.value; }); };
    val('gd-a', 'a'); val('gd-b', 'b'); val('gd-gana', 'gana'); val('gd-pierde', 'pierde');
    $('gd-cuerpo').querySelectorAll('[data-gdur]').forEach((s) => s.addEventListener('change', () => { gSel.dur[s.dataset.gdur] = Number(s.value); }));
    $('gd-cuerpo').querySelectorAll('[data-gtarea]').forEach((b) => b.addEventListener('click', () => {
      const t = TAREAS_GUERRA.find((x) => x.id === b.dataset.gtarea);
      const W2 = gEstado[gCurso] && gEstado[gCurso].guerra;
      if (tareaViva(W2) && !confirm(`Ya hay una tarea en curso. ¿Reemplazarla por «${t.nombre}»?`)) return;
      opGuerra([gCurso], { op: 'tarea', seg: gSel.dur[t.id] || t.seg, tarea: { id: t.id, nombre: t.nombre, icono: t.icono, acciones: t.acciones, pts: t.pts, desc: t.desc } });
    }));
    $('gd-cuerpo').querySelectorAll('[data-gpts]').forEach((b) => b.addEventListener('click', () => opGuerra([gCurso], { op: 'puntos', grupo: b.dataset.gpts, delta: Number(b.dataset.d) })));
    $('gd-cuerpo').querySelectorAll('[data-gclan]').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.acc === 'reiniciar' && !confirm('¿Reiniciar este clan? Se borran su líder, su nombre y los votos.')) return;
      opClan(Number(b.dataset.gclan), b.dataset.acc);
    }));
  }
  setInterval(() => {
    for (const c of CURSOS_G) {
      const W = gEstado[c.id] && gEstado[c.id].guerra, T = tareaViva(W);
      document.querySelectorAll(`[data-greloj="${c.id}"]`).forEach((el) => { el.textContent = T ? mmss(T.hasta - gAhora()) : '—'; });
      if (c.id === gCurso) { const r = $('gd-reloj'); if (r) r.textContent = T ? mmss(T.hasta - gAhora()) : '—'; }
    }
  }, 1000);
  $('btn-guerra').addEventListener('click', () => { pintarGuerra(); $('guerra-dlg').showModal(); cargarGuerras(); });
  $('gd-cerrar').addEventListener('click', () => $('guerra-dlg').close());
  cargarGuerras();
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
    $('grupos-cursos').innerHTML = CURSOS_G.map((c) => {
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
      <div class="tabs">${CURSOS_G.map((x) => `<button type="button" class="tab" data-gt="${x.id}" aria-selected="${x.id === grupoCurso}">${x.nombre}</button>`).join('')}</div>
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
    $('apoyo').innerHTML = ap.length ? ap.slice(0, 15).map(({ e, r, debil }) => `<button type="button" data-apoyo="${e.id}"><span><b>${esc(e.nombre)}${refuerzos[e.id] && !refuerzos[e.id].completado ? '<span class="etq-refuerzo">🎯 refuerzo</span>' : ''}</b><small>${debil.length ? `Bajo en: ${debil.slice(0, 2).map((d) => `${esc(d.t)} (${d.pct} %)`).join(', ')}` : `${r.intentos} respuestas`}</small></span><span class="dificil">${r.acierto ?? '–'} %</span></button>`).join('')
      + (ap.length > 15 ? `<span class="muted">y ${ap.length - 15} más (están en el Excel).</span>` : '')
      : '<span class="muted">Nadie bajo los umbrales por ahora. 🎉</span>';
    $('apoyo').querySelectorAll('[data-apoyo]').forEach((b) => b.addEventListener('click', () => detalle(b.dataset.apoyo)));
    pintarCalor(lista, temas, c);
    // errores típicos del curso y avisos de guardados sospechosos, bajo el mapa de calor
    const mc = $('mapa-calor');
    if (mc && mc.parentNode) {
      let ec = $('errores-curso');
      if (!ec) { ec = document.createElement('div'); ec.id = 'errores-curso'; ec.style.marginTop = '18px'; mc.parentNode.appendChild(ec); }
      const sosp = lista.filter((e) => alertas[e.id]);
      ec.innerHTML = erroresCursoHTML(lista, temas, c.nivel)
        + (sosp.length ? `<h2 style="margin-top:18px">⚠️ Posibles alteraciones del progreso</h2><span class="muted">El servidor recibió avances imposibles y no los guardó. Haz clic para ver el detalle.</span><div class="apoyo-lista">${sosp.map((e) => `<button type="button" class="btn mini" data-sosp="${e.id}">${esc(e.nombre)} (${alertas[e.id].length})</button>`).join(' ')}</div>` : '');
      ec.querySelectorAll('[data-sosp]').forEach((b) => b.addEventListener('click', () => detalle(b.dataset.sosp)));
    }
  }
  // Mapa de calor: estudiantes × temas, con el porcentaje de acierto en cada celda
  function pintarCalor(lista, temas, c) {
    const el = $('mapa-calor'); if (!el) return;
    if (!temas.length) { el.innerHTML = '<p class="muted" style="padding:12px">Todavía no hay respuestas en este curso.</p>'; return; }
    const orden = [...temas].sort((a, b) => (a.unidad + a.titulo).localeCompare(b.unidad + b.titulo));
    const ests = [...lista].filter((e) => Object.keys((e.progreso || {}).stats || {}).length).sort((a, b) => a.nombre.localeCompare(b.nombre));
    const clase = (p) => (p === null ? 'c-nada' : p >= 70 ? 'c-alto' : p >= 40 ? 'c-medio' : 'c-bajo');
    const celda = (s, nombre, t) => {
      const p = s && s.i ? Math.round((s.a / s.i) * 100) : null;
      return `<td class="c ${clase(p)}" title="${esc(nombre)} · ${esc(t.titulo)}: ${p === null ? 'sin respuestas' : `${p} % (${s.a} de ${s.i})`}">${p === null ? '·' : p}</td>`;
    };
    el.innerHTML = `<table><thead><tr><th class="nom"><span style="writing-mode:horizontal-tb;transform:none">Estudiante (${ests.length})</span></th>${orden.map((t) => `<th title="${esc(`${ZONAS[t.unidad] || ''} · ${t.titulo}`)}"><span>${esc(t.titulo)}</span></th>`).join('')}</tr></thead>
      <tbody>${ests.map((e) => { const st = (e.progreso || {}).stats || {}; return `<tr><td class="nom"><button type="button" data-calor="${e.id}">${esc(e.nombre)}</button></td>${orden.map((t) => celda(st[t.k], e.nombre, t)).join('')}</tr>`; }).join('')}</tbody>
      <tfoot><tr><td class="nom" style="padding:5px 8px">Curso</td>${orden.map((t) => celda({ a: t.a, i: t.i }, c.nombre, t)).join('')}</tr></tfoot></table>`;
    el.querySelectorAll('[data-calor]').forEach((b) => b.addEventListener('click', () => detalle(b.dataset.calor)));
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
        filas.push([e.nombre, e.curso === 'INV' ? `Invitado: ${usuarioInv(e)} (${e.nivel || 7}°)` : e.rut, c.nombre, e.grupo || '', e.tiene_clave ? 'Sí' : 'No', e.conectado ? 'En línea' : fecha(e.ultimo), r.nivel || '', r.acierto ?? '', r.intentos,
          r.peor ? nombreTema(c.nivel, r.peor.k).titulo : '', r.peor ? Math.round(r.peor.pct * 100) : '', r.vencidos, r.muertes,
          Object.values(p.jefes || {}).reduce((a, b) => a + b, 0) + (p.reyVencido || 0) + (p.faraonVencido || 0) + (p.colosoVencido || 0) + (p.dragonVencido || 0),
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
      for (const c of CURSOS_G) for (let n = 1; n <= 8; n++) {
        const g = grupos[c.id] || {}, ob = (g.obras || {})[n] || {}, m = datos.filter((e) => e.curso === c.id && e.grupo === n);
        fg.push([c.nombre, n, (g.codigos || {})[n] || '', m.length, ...OBRAS_D.map(([id]) => pctO(ob[id])), m.map((e) => e.nombre).join(', ')]);
      }
      hojas.push({ nombre: 'Grupos y obras', filas: fg, anchos: [7, 7, 14, 11, 12, 15, 12, 15, 90] });
    }
    hojas.splice(0, 0, { nombre: 'Resumen por tema', filas: resumenT, anchos: [8, 11, 44, 12, 11, 10, 14, 14] });
    if (reportes.length) hojas.push({ nombre: 'Buzón', filas: [['Fecha', 'Curso', 'Estudiante', 'Tipo', 'Categoría', 'Mensaje', 'Zona', 'Leído'], ...reportes.map((r) => [fecha(r.creado), (CURSOS.find((c) => c.id === r.curso) || {}).nombre || r.curso, r.nombre, r.tipo === 'idea' ? 'Idea' : r.tipo === 'error' ? 'Error automático' : 'Problema', r.categoria || '', r.texto, r.zona || '', r.leido ? 'Sí' : 'No'])], anchos: [17, 7, 30, 10, 24, 70, 18, 7] });
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
    $('buzon-tabs').innerHTML = [['problema', '⚠️ Problemas'], ['idea', '💡 Ideas'], ['error', '🐞 Errores automáticos']].map(([t, nom]) => `<button type="button" class="tab" data-bt="${t}" aria-selected="${buzonTab === t}">${nom}${n(t) ? ` <span class="etq-r nuevo">${n(t)} sin leer</span>` : ''}</button>`).join('')
      + `<select id="buzon-curso" aria-label="Filtrar por curso" style="height:44px;border-radius:10px;border:1px solid #c9c0ae;font:inherit;font-weight:700;padding:0 8px"><option value="">Todos los cursos</option>${CURSOS.map((c) => `<option value="${c.id}" ${buzonCurso === c.id ? 'selected' : ''}>${c.nombre}</option>`).join('')}</select>`
      + '<span style="flex:1"></span><button type="button" class="btn mini" id="buzon-todos">Marcar todo como leído</button>';
    const lista = reportes.filter((r) => r.tipo === buzonTab && (!buzonCurso || r.curso === buzonCurso));
    $('buzon-lista').innerHTML = lista.length ? lista.map((r) => `<div class="rep ${r.leido ? '' : 'nuevo'}">
        <div class="cab-r"><span><b style="color:var(--text)">${esc(r.nombre)}</b> · ${esc((CURSOS.find((c) => c.id === r.curso) || {}).nombre || r.curso)}${r.zona ? ` · ${esc(r.zona)}` : ''}</span><span>${esc(fecha(r.creado))}</span></div>
        ${r.tipo === 'problema' && r.categoria ? `<span><span class="etq-r">${esc(r.categoria)}</span></span>` : ''}
        <p>${esc(r.texto)}</p>
        <div class="pie-r">${r.leido ? '<span class="muted" style="font-size:13px">Leído</span>' : '<span class="etq-r nuevo">Nuevo</span>'}<button type="button" class="btn mini" data-leer="${r.id}" data-v="${!r.leido}">${r.leido ? 'Marcar como no leído' : 'Marcar como leído'}</button></div>
      </div>`).join('') : `<div class="vacio">${buzonTab === 'error' ? 'No hay errores automáticos registrados. 👍' : buzonTab === 'idea' ? 'Aún no llegan ideas.' : 'No hay problemas reportados. 👍'}</div>`;
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
