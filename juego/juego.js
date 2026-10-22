// Math World — juego de mundo abierto (Phaser 3).
// Explora, recolecta recursos resolviendo desafíos matemáticos y mejora tus herramientas y tu base.
// Arte: personajes LPC (ver creditos.html) y Roguelike Pack de Kenney (CC0).
(() => {
  'use strict';

  // ===================================================================
  // Datos del juego
  // ===================================================================
  const PERSONAJES = [
    { id: 'zorro', nombre: 'Zorro' },
    { id: 'luna', nombre: 'Luna' },
    { id: 'puma', nombre: 'Puma' },
    { id: 'copihue', nombre: 'Copihue' },
  ];
  const RECURSOS = [
    { id: 'madera', nombre: 'Madera' },
    { id: 'piedra', nombre: 'Piedra' },
    { id: 'agua', nombre: 'Agua' },
    { id: 'cristal', nombre: 'Cristal' },
  ];
  const ICONO = (id) => `assets/iconos/${id}.png`;
  const MEJORAS = [
    { id: 'pico', nombre: 'Pico de piedra', desc: 'Permite picar rocas para sacar piedra.', icono: 'pickaxe', costo: { madera: 12 } },
    { id: 'balde', nombre: 'Balde', desc: 'Permite sacar agua del lago.', icono: 'agua', costo: { madera: 10, piedra: 4 }, requiere: 'pico' },
    { id: 'hacha2', nombre: 'Hacha de hierro', desc: 'Ganas 2 maderas más por cada árbol.', icono: 'axe', costo: { madera: 25, piedra: 15 }, requiere: 'pico' },
    { id: 'carpa', nombre: 'Campamento con carpa', desc: 'Tu base crece: aparecen una carpa y un cofre.', icono: 'cofre', costo: { madera: 30, piedra: 15, agua: 6 }, requiere: 'balde' },
    { id: 'pico2', nombre: 'Pico reforzado', desc: 'Más piedra y más cristales al picar rocas.', icono: 'pickaxe', costo: { madera: 20, piedra: 25, cristal: 2 }, requiere: 'carpa' },
    { id: 'refugio', nombre: 'Refugio con cerco', desc: 'La base completa: segunda carpa, leña y cerco.', icono: 'fogata', costo: { madera: 60, piedra: 40, agua: 15, cristal: 6 }, requiere: 'pico2' },
  ];
  const NOMBRE_MEJORA = Object.fromEntries(MEJORAS.map((m) => [m.id, m.nombre]));
  const ZONAS = {
    u1: { '7basico': 'Bosque de los Enteros', '8basico': 'Bosque de las Potencias' },
    u2: 'Cumbres Algebraicas',
    u3: 'Valle de las Formas',
    u4: 'Pantano de los Datos',
  };
  const xpPara = (nivel) => 60 + 40 * nivel;

  // ===================================================================
  // Utilidades
  // ===================================================================
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  // Texto matemático: "a/b" como fracción y "x^n" como potencia.
  const mate = (s) => esc(s)
    .replace(/(\d+|\))\^(−?\d+)/g, '$1<sup>$2</sup>')
    .replace(/(−?\d+)\/(\d+)/g, '<span class="frac"><span>$1</span><span>$2</span></span>');

  const almacen = {
    leer(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    escribir(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento: se juega igual */ } },
  };
  const claveGuardado = (curso, apodo) => `mathworld:${curso}:${apodo.toLowerCase()}`;

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.remove('oculto');
    t.style.opacity = '1';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.classList.add('oculto'), 300); }, 2600);
  }

  // ===================================================================
  // Estado del jugador
  // ===================================================================
  let S = null;
  let escena = null;

  function estadoNuevo(curso, apodo, pj) {
    return {
      v: 1, curso, apodo, pj,
      recursos: { madera: 0, piedra: 0, agua: 0, cristal: 0 },
      mejoras: [], herramienta: 'hacha',
      xp: 0, nivel: 1, stats: {}, pos: null, creado: Date.now(),
    };
  }
  const tiene = (id) => S.mejoras.includes(id);
  function guardar() {
    if (!S) return;
    if (escena && escena.jugador) S.pos = { x: Math.round(escena.jugador.x), y: Math.round(escena.jugador.y) };
    almacen.escribir(claveGuardado(S.curso, S.apodo), S);
    almacen.escribir('mathworld:ultimo', { curso: S.curso, apodo: S.apodo, pj: S.pj });
  }

  function sumar(recurso, n) {
    S.recursos[recurso] = (S.recursos[recurso] || 0) + n;
    pintarHUD();
    const el = document.querySelector(`.recurso[data-r="${recurso}"]`);
    if (el) { el.classList.add('sube'); setTimeout(() => el.classList.remove('sube'), 350); }
  }
  function ganarXP(n) {
    S.xp += n;
    while (S.xp >= xpPara(S.nivel)) {
      S.xp -= xpPara(S.nivel);
      S.nivel += 1;
      toast(`¡Subiste a nivel ${S.nivel}!`);
    }
    pintarHUD();
  }
  // Los desafíos se ponen un poco más difíciles al subir de nivel.
  const difPara = (base) => Math.min(3, base + (S.nivel >= 6 ? 1 : 0));

  // ===================================================================
  // Ingreso
  // ===================================================================
  const ingreso = { curso: '7basico', pj: 'zorro' };

  function prepararIngreso() {
    const ultimo = almacen.leer('mathworld:ultimo');
    if (ultimo) {
      ingreso.curso = ultimo.curso || ingreso.curso;
      ingreso.pj = ultimo.pj || ingreso.pj;
      $('apodo').value = ultimo.apodo || '';
    }
    const cont = $('personajes');
    cont.innerHTML = PERSONAJES.map((p) => `
      <button type="button" class="opcion" data-pj="${p.id}" aria-pressed="false" aria-label="Personaje ${p.nombre}">
        <span class="retrato" style="background-image:url('assets/pj/${p.id}_nada.png')"></span>
        <span style="font-size: 12px">${p.nombre}</span>
      </button>`).join('');
    const marcar = () => {
      document.querySelectorAll('[data-curso]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.curso === ingreso.curso)));
      document.querySelectorAll('[data-pj]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pj === ingreso.pj)));
    };
    document.querySelectorAll('[data-curso]').forEach((b) => b.addEventListener('click', () => { ingreso.curso = b.dataset.curso; marcar(); }));
    document.querySelectorAll('[data-pj]').forEach((b) => b.addEventListener('click', () => { ingreso.pj = b.dataset.pj; marcar(); }));
    marcar();

    $('form-ingreso').addEventListener('submit', (e) => {
      e.preventDefault();
      const apodo = $('apodo').value.trim();
      const err = $('error-ingreso');
      if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_]{3,16}$/.test(apodo)) {
        err.textContent = 'El apodo debe tener entre 3 y 16 letras o números, sin espacios.';
        err.classList.remove('oculto');
        return;
      }
      err.classList.add('oculto');
      const previo = almacen.leer(claveGuardado(ingreso.curso, apodo));
      S = previo && previo.v === 1 ? previo : estadoNuevo(ingreso.curso, apodo, ingreso.pj);
      S.pj = ingreso.pj;
      S.apodo = apodo;
      guardar();
      empezar(Boolean(previo));
    });
  }

  function empezar(volviste) {
    $('ingreso').classList.add('oculto');
    $('hud').classList.remove('oculto');
    if (window.matchMedia('(pointer: coarse)').matches) {
      $('tactil').classList.remove('oculto');
      document.querySelectorAll('.btn-hud kbd, .aviso kbd').forEach((k) => k.classList.add('oculto'));
    }
    pintarHUD();
    iniciarPhaser();
    const tactil = window.matchMedia('(pointer: coarse)').matches;
    setTimeout(() => toast(volviste ? `¡Hola de nuevo, ${S.apodo}!` : (tactil ? 'Camina con la palanca hasta un árbol y toca Talar.' : 'Acércate a un árbol y presiona E para talarlo.')), 600);
  }

  // ===================================================================
  // HUD
  // ===================================================================
  function pintarHUD() {
    if (!S) return;
    const foto = $('hud-foto');
    foto.style.backgroundImage = `url('assets/pj/${S.pj}_nada.png')`;
    $('hud-apodo').textContent = S.apodo;
    $('hud-nivel').textContent = `Nivel ${S.nivel}`;
    $('hud-xp').textContent = `${S.xp} / ${xpPara(S.nivel)}`;
    $('hud-xpbar').style.width = `${Math.round((S.xp / xpPara(S.nivel)) * 100)}%`;
    $('hud-recursos').innerHTML = RECURSOS.map((r) => `
      <div class="recurso" data-r="${r.id}">
        <img class="px" src="${ICONO(r.id)}" alt="">
        <span><small>${r.nombre}</small><b>${S.recursos[r.id] || 0}</b></span>
      </div>`).join('');
    const ranuras = [
      { id: 'hacha', icono: 'axe', tecla: '1', ok: true, nombre: tiene('hacha2') ? 'Hacha de hierro' : 'Hacha' },
      { id: 'pico', icono: 'pickaxe', tecla: '2', ok: tiene('pico'), nombre: tiene('pico2') ? 'Pico reforzado' : 'Pico' },
      { id: 'balde', icono: 'agua', tecla: '', ok: tiene('balde'), nombre: 'Balde' },
    ];
    $('hud-herramientas').innerHTML = ranuras.map((r) => `
      <div class="ranura ${S.herramienta === r.id ? 'activa' : ''} ${r.ok ? '' : 'falta'}" title="${r.ok ? r.nombre : r.nombre + ' (fabrícalo en tu base)'}">
        ${r.tecla ? `<small>${r.tecla}</small>` : ''}<img class="px" src="${ICONO(r.icono)}" alt="${esc(r.nombre)}">
      </div>`).join('');
  }

  function equipar(h) {
    if (h === 'pico' && !tiene('pico')) { toast('Primero fabrica un pico en tu base.'); return; }
    S.herramienta = h;
    if (escena) escena.ponerHerramienta(h);
    pintarHUD();
  }

  // ===================================================================
  // Modales
  // ===================================================================
  const ui = {
    abierto: false,
    alCerrar: null,
    abrir(html, clase = '', alCerrar = null) {
      const m = $('modal');
      m.className = 'modal ' + clase;
      m.innerHTML = html;
      $('capa').classList.remove('oculto');
      this.abierto = true;
      this.alCerrar = alCerrar;
      const foco = m.querySelector('[data-foco]') || m.querySelector('button');
      if (foco) foco.focus();
    },
    cerrar() {
      $('capa').classList.add('oculto');
      $('modal').innerHTML = '';
      this.abierto = false;
      const f = this.alCerrar; this.alCerrar = null;
      if (f) f();
    },
  };

  // ---------- Desafío ----------
  function abrirDesafio({ accion, dif, premio, onOk: alAcertar }) {
    let pagado = false;
    const onOk = () => { if (!pagado) { pagado = true; alAcertar(); } };
    let d = Preguntas.nuevo(S.curso, 'u1', dif, S.stats);
    let elegida = null, fallos = 0, resuelto = false, pista = false;
    let fallidas = new Set();

    const pintar = () => {
      let msg = '';
      if (resuelto) msg = `<div class="mensaje bien" role="status">¡Correcto! ${mate(d.explicacion)}</div>`;
      else if (fallos >= 2) msg = `<div class="mensaje mal" role="status">Revisemos juntos: ${mate(d.explicacion)} Puedes elegir esa respuesta o pedir otro desafío. No pierdes recursos.</div>`;
      else if (fallos === 1) msg = `<div class="mensaje mal" role="status">Casi. ${mate(d.pista)} Inténtalo otra vez.</div>`;
      else if (pista) msg = `<div class="mensaje pista">${mate(d.pista)}</div>`;

      ui.abrir(`
        <div class="modal-cab">
          <div>
            <span class="etq">${esc(d.titulo)}</span>
            <h2 id="modal-titulo">${esc(accion)}</h2>
          </div>
          <div class="pildoras">
            <span class="pildora">Dificultad ${dif} de 3</span>
            <span class="pildora premio">${premio}</span>
          </div>
        </div>
        <p class="enunciado">${mate(d.enunciado)}</p>
        <div class="alternativas">
          ${d.opciones.map((o, i) => {
            let cls = '';
            if (resuelto && i === d.correcta) cls = 'bien';
            else if (fallidas.has(i)) cls = 'mal';
            return `<button type="button" class="alt ${cls}" data-i="${i}" aria-pressed="${elegida === i}" ${resuelto || fallidas.has(i) ? 'disabled' : ''}>${mate(o)}</button>`;
          }).join('')}
        </div>
        ${msg}
        <div class="acciones">
          <div>${resuelto ? '' : `<button type="button" class="btn sec" id="d-pista">${pista ? 'Ocultar pista' : 'Ver pista'}</button>`}
               ${!resuelto && fallos >= 2 ? '<button type="button" class="btn sec" id="d-otro">Otro desafío</button>' : ''}</div>
          <div>
            ${resuelto ? '<button type="button" class="btn pri" id="d-seguir" data-foco>¡Seguir!</button>'
              : `<button type="button" class="btn" id="d-salir">Salir</button>
                 <button type="button" class="btn pri" id="d-ok" ${elegida === null ? 'disabled' : ''}>Comprobar</button>`}
          </div>
        </div>`);

      document.querySelectorAll('.alt').forEach((b) => b.addEventListener('click', () => { elegida = Number(b.dataset.i); pintar(); }));
      const on = (id, f) => { const el = $(id); if (el) el.addEventListener('click', f); };
      on('d-pista', () => { pista = !pista; pintar(); });
      on('d-salir', () => ui.cerrar());
      on('d-otro', () => { d = Preguntas.nuevo(S.curso, 'u1', dif, S.stats); elegida = null; fallos = 0; fallidas = new Set(); pista = false; pintar(); });
      on('d-ok', comprobar);
      on('d-seguir', () => { ui.alCerrar = onOk; ui.cerrar(); });
    };

    const comprobar = () => {
      if (elegida === null || resuelto) return;
      const st = S.stats[d.tema] || (S.stats[d.tema] = { a: 0, i: 0 });
      st.i += 1;
      if (elegida === d.correcta) {
        st.a += 1;
        resuelto = true;
        ganarXP(8 + 6 * dif - Math.min(fallos, 2) * 4);
      } else {
        fallos += 1;
        fallidas.add(elegida);
        elegida = null;
      }
      guardar();
      pintar();
    };

    ui.teclas = (e) => {
      if (/^[1-4]$/.test(e.key) && !resuelto) {
        const i = Number(e.key) - 1;
        if (!fallidas.has(i)) { elegida = i; pintar(); }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (resuelto) { ui.alCerrar = onOk; ui.cerrar(); } else comprobar();
      }
    };
    pintar();
  }

  // ---------- Base ----------
  function costoHTML(costo) {
    return Object.entries(costo).map(([r, n]) => `<span class="${(S.recursos[r] || 0) < n ? 'falta' : ''}"><img class="px" src="${ICONO(r)}" alt="">${n} ${r}</span>`).join('');
  }
  function abrirBase() {
    const cerca = escena && escena.cercaDeBase();
    const filas = MEJORAS.map((m) => {
      const hecha = tiene(m.id);
      const bloqueada = m.requiere && !tiene(m.requiere);
      const alcanza = Object.entries(m.costo).every(([r, n]) => (S.recursos[r] || 0) >= n);
      let derecha;
      if (hecha) derecha = '<span class="estado-ok">Fabricado</span>';
      else if (bloqueada) derecha = `<span class="nota" style="max-width: 140px">Primero: ${esc(NOMBRE_MEJORA[m.requiere])}</span>`;
      else derecha = `<button type="button" class="btn pri" data-m="${m.id}" ${alcanza && cerca ? '' : 'disabled'}>Fabricar</button>`;
      return `
        <div class="mejora ${hecha ? 'hecha' : ''}">
          <img class="ico px" src="${ICONO(m.icono)}" alt="">
          <div class="info"><strong>${esc(m.nombre)}</strong><span>${esc(m.desc)}</span><div class="costo">${costoHTML(m.costo)}</div></div>
          ${derecha}
        </div>`;
    }).join('');
    ui.abrir(`
      <div class="modal-cab">
        <div><span class="etq">Tu base</span><h2 id="modal-titulo">Fabricar mejoras</h2></div>
        <button type="button" class="btn" id="b-cerrar">Cerrar</button>
      </div>
      ${cerca ? '<p class="nota">Para fabricar resuelves un desafío. Si te equivocas, no pierdes recursos.</p>'
        : '<div class="mensaje pista">Para fabricar tienes que estar junto a la fogata de tu base. <button type="button" class="btn sec" id="b-volver" style="margin-left: auto">Volver a la base</button></div>'}
      <div class="mejoras">${filas}</div>`);
    $('b-cerrar').addEventListener('click', () => ui.cerrar());
    const v = $('b-volver');
    if (v) v.addEventListener('click', () => { ui.cerrar(); escena.irABase(); });
    document.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => fabricar(MEJORAS.find((m) => m.id === b.dataset.m))));
  }
  function fabricar(m) {
    abrirDesafio({
      accion: `Fabricar: ${m.nombre}`,
      dif: difPara(2),
      premio: 'Premio: la mejora',
      onOk: () => {
        for (const [r, n] of Object.entries(m.costo)) S.recursos[r] -= n;
        S.mejoras.push(m.id);
        if (m.id === 'pico') S.herramienta = 'pico';
        guardar();
        pintarHUD();
        if (escena) { escena.actualizarBase(); escena.ponerHerramienta(S.herramienta); escena.celebrar(); }
        toast(`¡Fabricaste: ${m.nombre}!`);
      },
    });
  }

  // ---------- Mapa ----------
  let contenido = null;
  async function abrirMapa() {
    if (!contenido) {
      try { contenido = await (await fetch('../contenido.json', { cache: 'no-cache' })).json(); } catch (e) { contenido = { cursos: [] }; }
    }
    const curso = (contenido.cursos || []).find((c) => c.id === S.curso);
    const unidades = curso ? curso.unidades : [];
    const zonas = unidades.map((u) => {
      const nombreZona = typeof ZONAS[u.id] === 'string' ? ZONAS[u.id] : (ZONAS[u.id] || {})[S.curso] || 'Zona nueva';
      let estado, clase = '';
      if (u.id === 'u1') { estado = 'Estás aquí'; clase = 'aqui'; }
      else if (u.habilitada) estado = 'Habilitada: esta zona se está construyendo y llegará pronto.';
      else { estado = `Se abre cuando tu profesor habilite la Unidad ${u.numero}.`; clase = 'cerrada'; }
      return `<div class="zona ${clase}"><small>UNIDAD ${u.numero} · ${esc(u.titulo).toUpperCase()}</small><strong>${esc(nombreZona)}</strong><span>${esc(estado)}</span></div>`;
    }).join('');
    const titulos = Preguntas.titulos(S.curso, 'u1');
    const avance = Object.entries(titulos).map(([k, t]) => {
      const s = S.stats[k] || { a: 0, i: 0 };
      const pct = s.i ? Math.round((s.a / s.i) * 100) : 0;
      return `<div><div class="fila"><span>${esc(t)}</span><span>${s.i ? `${s.a} de ${s.i} (${pct} %)` : 'Sin intentos'}</span></div><div class="barra"><i style="width: ${pct}%"></i></div></div>`;
    }).join('');
    ui.abrir(`
      <div class="modal-cab">
        <div><span class="etq">${S.curso === '7basico' ? '7°' : '8°'} básico</span><h2 id="modal-titulo">Mapa del mundo</h2></div>
        <button type="button" class="btn" id="m-cerrar">Cerrar</button>
      </div>
      <div class="zonas">${zonas || '<p class="nota">No se pudo cargar la lista de unidades.</p>'}</div>
      <h2 style="font-size: 20px">Tu avance en esta zona</h2>
      <div class="avance">${avance}</div>
      <div class="acciones"><span class="nota">Progreso guardado en este navegador como <strong>${esc(S.apodo)}</strong>.</span>
        <button type="button" class="btn sec" id="m-salir">Cambiar de jugador</button></div>`);
    $('m-cerrar').addEventListener('click', () => ui.cerrar());
    $('m-salir').addEventListener('click', () => { guardar(); location.reload(); });
  }

  function abrirGuarida() {
    ui.abrir(`
      <div class="modal-cab">
        <div><span class="etq" style="color: var(--coral)">Jefe de curso</span><h2 id="modal-titulo">Guarida del Guardián del Cero</h2></div>
      </div>
      <p class="enunciado" style="font-size: 18px">Este jefe no se puede vencer en solitario. Se necesitan <strong>al menos 4 compañeros conectados</strong> al mismo tiempo: cada uno resuelve una parte de un gran problema y, si todas las partes calzan, el curso lo ataca en conjunto.</p>
      <div class="mensaje pista">El modo multijugador se activará en una próxima actualización. Mientras tanto, junta recursos y mejora tu equipo para estar listo.</div>
      <div class="acciones"><span></span><div><button type="button" class="btn pri" id="g-ok" data-foco>Entendido</button></div></div>`, 'jefe');
    $('g-ok').addEventListener('click', () => ui.cerrar());
  }

  // Teclado global para modales y atajos
  document.addEventListener('keydown', (e) => {
    if (!S || $('hud').classList.contains('oculto')) return;
    if (ui.abierto) {
      if (e.key === 'Escape') ui.cerrar();
      else if (ui.teclas && $('modal').querySelector('.alternativas')) ui.teclas(e);
      return;
    }
    const k = e.key.toLowerCase();
    if (k === 'b') abrirBase();
    else if (k === 'm') abrirMapa();
    else if (k === '1') equipar('hacha');
    else if (k === '2') equipar('pico');
  });
  $('btn-base').addEventListener('click', abrirBase);
  $('btn-mapa').addEventListener('click', abrirMapa);
  $('capa').addEventListener('click', (e) => { if (e.target === $('capa')) ui.cerrar(); });

  // Palanca táctil
  const palanca = { x: 0, y: 0 };
  (() => {
    const base = $('palanca'), perilla = base.querySelector('i');
    let id = null;
    const mover = (e) => {
      const r = base.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const len = Math.hypot(dx, dy), max = 45;
      if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
      perilla.style.transform = `translate(${dx}px, ${dy}px)`;
      palanca.x = dx / max; palanca.y = dy / max;
    };
    base.addEventListener('pointerdown', (e) => { id = e.pointerId; base.setPointerCapture(id); mover(e); });
    base.addEventListener('pointermove', (e) => { if (e.pointerId === id) mover(e); });
    const soltar = () => { id = null; palanca.x = palanca.y = 0; perilla.style.transform = ''; };
    base.addEventListener('pointerup', soltar);
    base.addEventListener('pointercancel', soltar);
    $('btn-accion').addEventListener('pointerdown', (e) => { e.preventDefault(); if (escena && !ui.abierto) escena.interactuar(); });
  })();

  // ===================================================================
  // Mundo (Phaser)
  // ===================================================================
  const TILE = 32;              // 1 casilla = 16 px de Kenney dibujados al doble
  const ANCHO = 64, ALTO = 44;  // casillas
  const COLS = 57;              // columnas de la hoja de Kenney
  const fr = (c, r) => r * COLS + c;
  const BASE = { x: 14, y: 24 };
  const LAGO = { x: 38, y: 30, w: 10, h: 8 };
  const GUARIDA = { x: 53, y: 9 };
  const DIRS = { up: 0, left: 1, down: 2, right: 3 };

  function azar(semilla) { // mulberry32: el mundo es igual para todos
    return () => {
      semilla |= 0; semilla = (semilla + 0x6d2b79f5) | 0;
      let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class Mundo extends Phaser.Scene {
    constructor() { super('mundo'); }

    preload() {
      this.load.image('kenney', 'assets/kenney_roguelike.png');
      for (const h of ['nada', 'hacha', 'pico']) {
        this.load.spritesheet(`pj_${h}`, `assets/pj/${S.pj}_${h}.png`, { frameWidth: 64, frameHeight: 64 });
      }
    }

    create() {
      escena = this;
      this.crearTexturas();
      this.crearSuelo();
      this.obstaculos = this.physics.add.staticGroup();
      this.objetos = [];
      this.ocupado = new Set();
      this.rnd = azar(S.curso === '7basico' ? 7 : 8);
      this.reservarZonas();
      this.crearBordes();
      this.crearBase();
      this.crearGuarida();
      this.crearNaturaleza();
      this.crearJugador();
      this.crearAnimaciones();

      this.physics.world.setBounds(0, 0, ANCHO * TILE, ALTO * TILE);
      this.cameras.main.setBounds(0, 0, ANCHO * TILE, ALTO * TILE);
      this.cameras.main.startFollow(this.jugador, true, 0.15, 0.15);
      this.cameras.main.setRoundPixels(true);
      this.ajustarZoom();
      this.scale.on('resize', () => this.ajustarZoom());

      this.teclas = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE');
      this.teclas.E.on('down', () => { if (!ui.abierto) this.interactuar(); });
      this.teclas.SPACE.on('down', () => { if (!ui.abierto) this.interactuar(); });
      this.dir = 'down';
      this.objetivo = null;
      this.time.addEvent({ delay: 15000, loop: true, callback: guardar });
      this.time.addEvent({ delay: 120, loop: true, callback: () => this.buscarObjetivo() });
      window.addEventListener('beforeunload', guardar);
    }

    // ---------- texturas a partir de la hoja de Kenney ----------
    tex(key, w, h, partes) {
      const src = this.textures.get('kenney').getSourceImage();
      const t = this.textures.createCanvas(key, w * 16, h * 16);
      for (const [c, r, dx, dy] of partes) t.context.drawImage(src, c * 17, r * 17, 16, 16, dx * 16, dy * 16, 16, 16);
      t.refresh();
    }
    crearTexturas() {
      const T = (key, c, r) => this.tex(key, 1, 1, [[c, r, 0, 0]]);
      this.tex('arbol_manzano', 1, 2, [[23, 10, 0, 0], [23, 11, 0, 1]]);
      this.tex('arbol_redondo', 1, 2, [[13, 10, 0, 0], [13, 11, 0, 1]]);
      this.tex('arbol_pino', 1, 2, [[18, 10, 0, 0], [18, 11, 0, 1]]);
      this.tex('arbol_otono', 1, 2, [[14, 10, 0, 0], [14, 11, 0, 1]]);
      this.tex('carpa_b', 2, 2, [[48, 10, 0, 0], [49, 10, 1, 0], [48, 11, 0, 1], [49, 11, 1, 1]]);
      this.tex('carpa_v', 2, 2, [[46, 10, 0, 0], [47, 10, 1, 0], [46, 11, 0, 1], [47, 11, 1, 1]]);
      T('tocon', 53, 19); T('tocon_hacha', 53, 21); T('brote', 22, 11);
      T('roca3', 54, 21); T('roca2', 55, 21); T('roca1', 56, 21); T('roca_cafe', 54, 19); T('roca_musgo', 54, 22);
      T('cofre', 37, 9); T('fogata', 14, 8); T('lena', 13, 8); T('cerco', 52, 23); T('letrero', 19, 0);
      T('calavera', 49, 9); T('arbusto', 19, 9); T('arbusto2', 24, 9);
      [28, 29, 30, 31].forEach((c, i) => T(`flor${i}`, c, 9));
      const g = this.add.graphics();
      [['p_madera', 0x9b6b3f], ['p_piedra', 0x9aa198], ['p_agua', 0x4fa3c7], ['p_brillo', 0xf2e27a], ['p_hoja', 0x4c9a48]].forEach(([k, col]) => {
        g.clear(); g.fillStyle(col, 1); g.fillRect(0, 0, 4, 4); g.generateTexture(k, 4, 4);
      });
      g.destroy();
    }

    crearSuelo() {
      const r = azar(99);
      const data = [];
      for (let y = 0; y < ALTO; y++) {
        const fila = [];
        for (let x = 0; x < ANCHO; x++) fila.push(r() < 0.18 ? fr(5, 1) : fr(5, 0));
        data.push(fila);
      }
      const camino = (x, y) => { if (data[y] && data[y][x] !== undefined) data[y][x] = fr(6, 0); };
      for (let x = 2; x < ANCHO - 2; x++) camino(x, BASE.y + 2);
      for (let y = 2; y < ALTO - 2; y++) camino(30, y);
      for (let x = 30; x <= GUARIDA.x; x++) camino(x, GUARIDA.y + 4);
      for (let y = BASE.y + 2; y < LAGO.y; y++) camino(42, y);
      for (let y = 0; y < LAGO.h; y++) {
        for (let x = 0; x < LAGO.w; x++) {
          const tx = x === 0 ? 0 : x === LAGO.w - 1 ? 2 : 1;
          const ty = y === 0 ? 0 : y === LAGO.h - 1 ? 2 : 1;
          data[LAGO.y + y][LAGO.x + x] = fr(2 + tx, ty);
        }
      }
      this.suelo = data;
      const mapa = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
      const ts = mapa.addTilesetImage('kenney', 'kenney', 16, 16, 0, 1);
      mapa.createLayer(0, ts, 0, 0).setScale(2).setDepth(-10);
      // el agua no se puede cruzar
      const z = this.add.zone((LAGO.x + LAGO.w / 2) * TILE, (LAGO.y + LAGO.h / 2) * TILE, LAGO.w * TILE - 24, LAGO.h * TILE - 24);
      this._zonaLago = z;
    }

    // ---------- ocupación del terreno ----------
    marcar(x, y) { this.ocupado.add(`${x},${y}`); }
    libre(x, y) {
      if (x < 2 || y < 2 || x >= ANCHO - 2 || y >= ALTO - 2) return false;
      if (this.ocupado.has(`${x},${y}`)) return false;
      const t = this.suelo[y][x];
      return t === fr(5, 0) || t === fr(5, 1);
    }
    reservarZonas() {
      this.obstaculos.add(this._zonaLago);
      for (let y = BASE.y - 4; y <= BASE.y + 3; y++) for (let x = BASE.x - 6; x <= BASE.x + 6; x++) this.marcar(x, y);
      for (let y = GUARIDA.y - 3; y <= GUARIDA.y + 3; y++) for (let x = GUARIDA.x - 3; x <= GUARIDA.x + 3; x++) this.marcar(x, y);
      for (let y = LAGO.y - 1; y <= LAGO.y + LAGO.h; y++) for (let x = LAGO.x - 1; x <= LAGO.x + LAGO.w; x++) this.marcar(x, y);
      // los caminos quedan libres de árboles a ambos lados
      for (let y = 0; y < ALTO; y++) for (let x = 0; x < ANCHO; x++) {
        if (this.suelo[y][x] === fr(6, 0)) { this.marcar(x, y); this.marcar(x, y + 1); this.marcar(x - 1, y); this.marcar(x + 1, y); }
      }
    }

    // ---------- objetos ----------
    sprite(key, tx, ty, ox = 0.5) {
      const s = this.add.image(tx * TILE + TILE / 2, (ty + 1) * TILE, key).setOrigin(ox, 1).setScale(2);
      s.setDepth(s.y);
      return s;
    }
    solido(x, y, w, h) {
      const z = this.add.zone(x, y, w, h);
      this.obstaculos.add(z);
      return z;
    }
    crearBordes() {
      for (let y = 0; y < ALTO; y++) for (let x = 0; x < ANCHO; x++) {
        const borde = x < 2 || y < 2 || x >= ANCHO - 2 || y >= ALTO - 2;
        if (!borde) continue;
        if (this.suelo[y][x] === fr(6, 0)) continue;
        this.sprite(this.rnd() < 0.7 ? 'arbol_pino' : 'arbol_redondo', x, y);
      }
      // muro invisible para no salir del bosque
      const W = ANCHO * TILE, H = ALTO * TILE;
      this.solido(W / 2, TILE, W, TILE * 2); this.solido(W / 2, H - TILE, W, TILE * 2);
      this.solido(TILE, H / 2, TILE * 2, H); this.solido(W - TILE, H / 2, TILE * 2, H);
    }

    crearBase() {
      const bx = BASE.x, by = BASE.y;
      this.fogata = this.sprite('fogata', bx, by);
      this.solido(this.fogata.x, this.fogata.y - 10, 24, 14);
      this.add.particles(this.fogata.x, this.fogata.y - 22, 'p_brillo', {
        speedY: { min: -40, max: -20 }, speedX: { min: -8, max: 8 }, lifespan: 700, frequency: 180, scale: { start: 1, end: 0 }, alpha: { start: 0.9, end: 0 },
      }).setDepth(this.fogata.y + 1);
      this.objetos.push({ tipo: 'fogata', x: this.fogata.x, y: this.fogata.y - 8, activo: true });
      this.base = {
        lena: this.sprite('lena', bx + 1, by),
        carpa: this.sprite('carpa_b', bx - 2, by - 1, 1).setVisible(false),
        cofre: this.sprite('cofre', bx + 2, by - 2).setVisible(false),
        carpa2: this.sprite('carpa_v', bx + 5, by - 1, 1).setVisible(false),
        lena2: this.sprite('lena', bx + 2, by).setVisible(false),
        cerco: [],
      };
      for (let x = bx - 5; x <= bx + 5; x++) {
        if (x === bx || x === bx + 1) continue;
        this.base.cerco.push(this.sprite('cerco', x, by + 1).setVisible(false));
      }
      this.base.solidos = {
        carpa: this.solido(this.base.carpa.x - 32, this.base.carpa.y - 16, 56, 28),
        carpa2: this.solido(this.base.carpa2.x - 32, this.base.carpa2.y - 16, 56, 28),
        cofre: this.solido(this.base.cofre.x, this.base.cofre.y - 10, 26, 14),
      };
      this.actualizarBase();
    }
    actualizarBase() {
      const c = tiene('carpa'), r = tiene('refugio');
      this.base.carpa.setVisible(c); this.base.cofre.setVisible(c);
      this.base.carpa2.setVisible(r); this.base.lena2.setVisible(r);
      this.base.cerco.forEach((s) => s.setVisible(r));
      this.base.solidos.carpa.body.enable = c;
      this.base.solidos.cofre.body.enable = c;
      this.base.solidos.carpa2.body.enable = r;
    }
    cercaDeBase() { return this.jugador && Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y, this.fogata.x, this.fogata.y) < 120; }
    irABase() {
      this.jugador.setPosition(BASE.x * TILE + TILE / 2, (BASE.y + 2) * TILE + 20);
      this.cameras.main.flash(250, 18, 32, 26);
    }

    crearGuarida() {
      const gx = GUARIDA.x, gy = GUARIDA.y;
      const anillo = [[-2, -1], [-1, -2], [0, -2], [1, -2], [2, -1], [2, 1], [1, 2], [-1, 2], [-2, 1]];
      for (const [dx, dy] of anillo) {
        const s = this.sprite(this.rnd() < 0.5 ? 'roca_cafe' : 'roca_musgo', gx + dx, gy + dy);
        this.solido(s.x, s.y - 10, 26, 16);
      }
      const cal = this.sprite('calavera', gx, gy);
      this.tweens.add({ targets: cal, y: cal.y - 4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      const letrero = this.sprite('letrero', gx - 1, gy + 3);
      this.solido(letrero.x, letrero.y - 8, 20, 12);
      this.objetos.push({ tipo: 'guarida', x: letrero.x, y: letrero.y - 6, activo: true });
    }

    crearNaturaleza() {
      const lugar = (zona) => {
        for (let i = 0; i < 400; i++) {
          const x = zona ? zona.x + Math.floor(this.rnd() * zona.w) : 2 + Math.floor(this.rnd() * (ANCHO - 4));
          const y = zona ? zona.y + Math.floor(this.rnd() * zona.h) : 3 + Math.floor(this.rnd() * (ALTO - 5));
          if (this.libre(x, y) && this.libre(x, y - 1)) return [x, y];
        }
        return null;
      };
      const reservar = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) this.marcar(x + dx, y + dy); };

      const tipos = ['arbol_manzano', 'arbol_redondo', 'arbol_pino', 'arbol_otono'];
      const nombres = { arbol_manzano: 'manzano', arbol_redondo: 'roble', arbol_pino: 'pino', arbol_otono: 'arce' };
      for (let i = 0; i < 115; i++) {
        const p = lugar(); if (!p) break;
        const key = tipos[Math.floor(this.rnd() * tipos.length)];
        const s = this.sprite(key, p[0], p[1]);
        const z = this.solido(s.x, s.y - 10, 18, 12);
        reservar(p[0], p[1]);
        this.objetos.push({ tipo: 'arbol', key, nombre: nombres[key], s, z, x: s.x, y: s.y - 6, estado: 'arbol', activo: true });
      }
      // cantera al norte y rocas sueltas
      for (let i = 0; i < 46; i++) {
        const p = lugar(i < 28 ? { x: 33, y: 3, w: 26, h: 16 } : null); if (!p) break;
        const s = this.sprite('roca3', p[0], p[1]);
        const z = this.solido(s.x, s.y - 10, 26, 16);
        reservar(p[0], p[1]);
        this.objetos.push({ tipo: 'roca', s, z, x: s.x, y: s.y - 6, nivel: 3, activo: true });
      }
      for (let i = 0; i < 7; i++) {
        const p = lugar(); if (!p) break;
        const s = this.sprite('cofre', p[0], p[1]);
        const z = this.solido(s.x, s.y - 10, 26, 14);
        reservar(p[0], p[1]);
        this.objetos.push({ tipo: 'cofre', s, z, x: s.x, y: s.y - 6, activo: true });
      }
      for (let i = 0; i < 70; i++) {
        const p = lugar(); if (!p) break;
        const deco = this.rnd() < 0.7 ? `flor${Math.floor(this.rnd() * 4)}` : (this.rnd() < 0.5 ? 'arbusto' : 'arbusto2');
        this.sprite(deco, p[0], p[1]).setDepth(deco.startsWith('flor') ? -5 : (p[1] + 1) * TILE);
        this.marcar(p[0], p[1]);
      }
    }

    // ---------- jugador ----------
    crearJugador() {
      const x = S.pos ? S.pos.x : BASE.x * TILE + TILE / 2;
      const y = S.pos ? S.pos.y : (BASE.y + 2) * TILE + 20;
      this.jugador = this.physics.add.sprite(x, y, `pj_${S.herramienta === 'pico' ? 'pico' : 'hacha'}`, DIRS.down * 9);
      this.jugador.setOrigin(0.5, 0.9);
      this.jugador.body.setSize(18, 10).setOffset(23, 50);
      this.jugador.setCollideWorldBounds(true);
      this.physics.add.collider(this.jugador, this.obstaculos);
      this.sombra = null;
    }
    crearAnimaciones() {
      for (const h of ['nada', 'hacha', 'pico']) {
        for (const [d, fila] of Object.entries(DIRS)) {
          this.anims.create({ key: `pj_${h}_${d}`, frames: this.anims.generateFrameNumbers(`pj_${h}`, { start: fila * 9 + 1, end: fila * 9 + 8 }), frameRate: 12, repeat: -1 });
        }
      }
    }
    ponerHerramienta(h) {
      const key = `pj_${h === 'pico' ? 'pico' : 'hacha'}`;
      if (this.jugador.texture.key === key) return;
      const anim = this.jugador.anims.isPlaying;
      this.jugador.setTexture(key, DIRS[this.dir] * 9);
      if (anim) this.jugador.anims.play(`${key}_${this.dir}`, true);
    }
    ajustarZoom() {
      const { width, height } = this.scale;
      const z = Math.max(1, Math.min(3, Math.floor(Math.min(width / 560, height / 315) * 2) / 2));
      this.cameras.main.setZoom(z);
    }

    update() {
      const j = this.jugador;
      if (!j) return;
      let vx = 0, vy = 0;
      if (!ui.abierto) {
        const t = this.teclas;
        if (t.A.isDown || t.LEFT.isDown) vx -= 1;
        if (t.D.isDown || t.RIGHT.isDown) vx += 1;
        if (t.W.isDown || t.UP.isDown) vy -= 1;
        if (t.S.isDown || t.DOWN.isDown) vy += 1;
        if (palanca.x || palanca.y) { vx = palanca.x; vy = palanca.y; }
      }
      const len = Math.hypot(vx, vy);
      const vel = 150;
      if (len > 0.15) {
        j.setVelocity((vx / Math.max(len, 1)) * vel, (vy / Math.max(len, 1)) * vel);
        this.dir = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'left' : 'right') : (vy < 0 ? 'up' : 'down');
        j.anims.play(`${j.texture.key}_${this.dir}`, true);
      } else {
        j.setVelocity(0, 0);
        j.anims.stop();
        j.setFrame(DIRS[this.dir] * 9);
      }
      j.setDepth(j.y);
    }

    // ---------- interacción ----------
    buscarObjetivo() {
      if (!this.jugador) return;
      const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[this.dir];
      const px = this.jugador.x + v[0] * 22, py = this.jugador.y - 6 + v[1] * 18;
      let mejor = null, puntaje = Infinity;
      for (const o of this.objetos) {
        if (!o.activo) continue;
        const d = Phaser.Math.Distance.Between(px, py, o.x, o.y);
        const lim = o.tipo === 'fogata' || o.tipo === 'guarida' ? 48 : 36;
        if (d < lim && d - lim < puntaje) { mejor = o; puntaje = d - lim; }
      }
      if (!mejor) {
        const L = { x: LAGO.x * TILE - 14, y: LAGO.y * TILE - 14, w: LAGO.w * TILE + 28, h: LAGO.h * TILE + 28 };
        if (px > L.x && px < L.x + L.w && py > L.y && py < L.y + L.h) mejor = { tipo: 'agua', x: px, y: py };
      }
      this.objetivo = mejor;
      const aviso = $('aviso');
      const txt = mejor ? this.textoAccion(mejor) : null;
      if (txt && !ui.abierto) {
        $('aviso-txt').textContent = txt;
        aviso.classList.remove('oculto');
      } else aviso.classList.add('oculto');
      $('btn-accion').textContent = txt ? txt.split(' ')[0] : 'Acción';
    }
    textoAccion(o) {
      switch (o.tipo) {
        case 'arbol':
          if (o.estado === 'arbol') return `Talar ${o.nombre}`;
          return o.estado === 'tocon' ? 'Tocón: volverá a crecer' : 'Brote: está creciendo';
        case 'roca': return tiene('pico') ? 'Picar roca' : 'Roca: necesitas un pico';
        case 'agua': return tiene('balde') ? 'Sacar agua' : 'Lago: necesitas un balde';
        case 'cofre': return 'Abrir cofre';
        case 'fogata': return 'Abrir tu base';
        case 'guarida': return 'Guarida del jefe';
        default: return null;
      }
    }
    mirarA(o) {
      const dx = o.x - this.jugador.x, dy = o.y - this.jugador.y;
      this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      this.jugador.setFrame(DIRS[this.dir] * 9);
    }
    interactuar() {
      this.buscarObjetivo();
      const o = this.objetivo;
      if (!o) return;
      if (o.tipo === 'fogata') return abrirBase();
      if (o.tipo === 'guarida') return abrirGuarida();
      if (o.tipo === 'arbol') {
        if (o.estado !== 'arbol') return toast('Este árbol todavía está creciendo.');
        equipar('hacha');
        const cant = 2 + (tiene('hacha2') ? 2 : 0);
        const dif = difPara(1);
        return abrirDesafio({
          accion: `Talar ${o.nombre}`, dif, premio: `Premio: ${cant + dif - 1} madera`,
          onOk: () => this.golpe(o, 'madera', cant + dif - 1),
        });
      }
      if (o.tipo === 'roca') {
        if (!tiene('pico')) return toast('Necesitas un pico. Fabrícalo en tu base (tecla B).');
        equipar('pico');
        const cant = 2 + (tiene('pico2') ? 2 : 0);
        const dif = difPara(2);
        return abrirDesafio({
          accion: 'Picar roca', dif, premio: `Premio: ${cant} piedra + posible cristal`,
          onOk: () => this.golpe(o, 'piedra', cant),
        });
      }
      if (o.tipo === 'agua') {
        if (!tiene('balde')) return toast('Necesitas un balde. Fabrícalo en tu base (tecla B).');
        return abrirDesafio({
          accion: 'Sacar agua del lago', dif: difPara(1), premio: 'Premio: 2 agua',
          onOk: () => this.golpe(o, 'agua', 2),
        });
      }
      if (o.tipo === 'cofre') {
        return abrirDesafio({
          accion: 'Abrir cofre del bosque', dif: 3, premio: 'Premio: 2 cristal + 4 madera',
          onOk: () => { this.golpe(o, 'cristal', 2); sumar('madera', 4); },
        });
      }
    }

    golpe(o, recurso, cant) {
      if (o.s || o.tipo === 'agua') this.mirarA(o);
      const j = this.jugador;
      this.tweens.add({ targets: j, y: j.y - 3, duration: 80, yoyo: true, repeat: 1 });
      const px = { madera: 'p_madera', piedra: 'p_piedra', agua: 'p_agua', cristal: 'p_brillo' }[recurso];
      const em = this.add.particles(o.x, o.y - 14, px, {
        speed: { min: 60, max: 150 }, angle: { min: 200, max: 340 }, gravityY: 320, lifespan: 600, scale: { start: 1.4, end: 0.4 }, emitting: false,
      }).setDepth(o.y + 50);
      em.explode(16);
      this.time.delayedCall(900, () => em.destroy());
      if (o.s) this.tweens.add({ targets: o.s, x: o.s.x + 3, duration: 50, yoyo: true, repeat: 3 });

      sumar(recurso, cant);
      this.flotante(o.x, o.y - 40, `+${cant} ${recurso}`);
      let extra = 0;
      if (o.tipo === 'roca' && this.rnd() < (tiene('pico2') ? 0.35 : 0.15)) {
        extra = 1; sumar('cristal', 1);
        this.time.delayedCall(350, () => this.flotante(o.x, o.y - 58, '+1 cristal', '#9ff0e4'));
      }

      if (o.tipo === 'arbol') {
        o.estado = 'tocon';
        this.time.delayedCall(250, () => { o.s.setTexture('tocon'); this.add.particles(o.x, o.y - 30, 'p_hoja', { speed: { min: 40, max: 110 }, lifespan: 700, gravityY: 200, emitting: false }).setDepth(o.y + 50).explode(14); });
        this.time.delayedCall(45000, () => { o.estado = 'brote'; o.s.setTexture('brote'); });
        this.time.delayedCall(90000, () => { o.estado = 'arbol'; o.s.setTexture(o.key); });
      } else if (o.tipo === 'roca') {
        o.nivel -= 1;
        if (o.nivel > 0) o.s.setTexture(`roca${o.nivel}`);
        else {
          o.activo = false; o.s.setVisible(false); o.z.body.enable = false;
          this.time.delayedCall(90000, () => { o.nivel = 3; o.s.setTexture('roca3').setVisible(true); o.z.body.enable = true; o.activo = true; });
        }
      } else if (o.tipo === 'cofre') {
        o.activo = false;
        this.tweens.add({ targets: o.s, alpha: 0, duration: 500, onComplete: () => { o.s.setVisible(false); o.z.body.enable = false; } });
        this.time.delayedCall(150000, () => { o.s.setAlpha(1).setVisible(true); o.z.body.enable = true; o.activo = true; });
      }
      guardar();
      return extra;
    }

    flotante(x, y, txt, color = '#ffffff') {
      const t = this.add.text(x, y, txt, {
        fontFamily: 'Fredoka, Nunito, sans-serif', fontSize: '15px', fontStyle: 'bold', color, stroke: '#12201a', strokeThickness: 4,
      }).setOrigin(0.5).setResolution(3).setDepth(100000);
      this.tweens.add({ targets: t, y: y - 34, alpha: 0, duration: 1400, ease: 'Cubic.out', onComplete: () => t.destroy() });
    }
    celebrar() {
      const j = this.jugador;
      const em = this.add.particles(j.x, j.y - 40, 'p_brillo', { speed: { min: 80, max: 180 }, lifespan: 900, gravityY: 150, scale: { start: 1.6, end: 0 }, emitting: false }).setDepth(100000);
      em.explode(30);
      this.time.delayedCall(1200, () => em.destroy());
    }
  }

  function iniciarPhaser() {
    new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'juego',
      backgroundColor: '#2f6b47',
      pixelArt: true,
      scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
      physics: { default: 'arcade', arcade: { debug: false } },
      scene: [Mundo],
    });
  }

  // Acceso para pruebas y depuración desde la consola del navegador.
  window.MathWorld = { escena: () => escena, estado: () => S };

  prepararIngreso();
})();
