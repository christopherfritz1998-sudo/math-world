// Math World — juego de mundo abierto (Phaser 3).
// Cada estudiante tiene su propia base; desde el portal viaja a los mundos de cada unidad
// para recolectar recursos y enfrentar enemigos resolviendo ejercicios.
// Arte: personajes LPC (ver creditos.html) y Roguelike Pack de Kenney (CC0).
(() => {
  'use strict';

  // ===================================================================
  // Datos del juego
  // ===================================================================
  const PERSONAJES = [
    { id: 'zorro', nombre: 'Zorro' }, { id: 'luna', nombre: 'Luna' },
    { id: 'puma', nombre: 'Puma' }, { id: 'copihue', nombre: 'Copihue' },
  ];
  const RECURSOS = [
    { id: 'madera', nombre: 'Madera' }, { id: 'piedra', nombre: 'Piedra' },
    { id: 'agua', nombre: 'Agua' }, { id: 'cristal', nombre: 'Cristal' },
  ];
  const ICONO = (id) => `assets/iconos/${id}.png`;

  // Herramientas y equipo (se fabrican una vez)
  const MEJORAS = [
    { id: 'pico', nombre: 'Pico de piedra', desc: 'Permite picar rocas para sacar piedra.', icono: 'pickaxe', costo: { madera: 12 } },
    { id: 'balde', nombre: 'Balde', desc: 'Permite sacar agua de los lagos.', icono: 'agua', costo: { madera: 10, piedra: 4 }, requiere: 'pico' },
    { id: 'espada', nombre: 'Espada de piedra', desc: 'Cada acierto en combate quita 2 de vida.', icono: 'espada', costo: { madera: 15, piedra: 10 }, requiere: 'pico' },
    { id: 'hacha2', nombre: 'Hacha de hierro', desc: 'Ganas 2 maderas más por cada árbol.', icono: 'axe', costo: { madera: 25, piedra: 15 }, requiere: 'pico' },
    { id: 'armadura', nombre: 'Armadura de cuero', desc: 'Tu vida máxima sube a 7 corazones.', icono: 'armadura', costo: { piedra: 25, agua: 6, cristal: 2 }, requiere: 'espada' },
    { id: 'pico2', nombre: 'Pico reforzado', desc: 'Más piedra y más cristales al picar rocas.', icono: 'pickaxe', costo: { madera: 20, piedra: 25, cristal: 2 }, requiere: 'hacha2' },
    { id: 'espada2', nombre: 'Espada de cristal', desc: 'Cada acierto en combate quita 3 de vida.', icono: 'espada', costo: { piedra: 20, cristal: 6 }, requiere: 'armadura' },
    { id: 'armadura2', nombre: 'Armadura de cristal', desc: 'Tu vida máxima sube a 9 corazones.', icono: 'armadura', costo: { agua: 12, cristal: 8 }, requiere: 'espada2' },
  ];
  const NOMBRE_MEJORA = Object.fromEntries(MEJORAS.map((m) => [m.id, m.nombre]));

  // Objetos para decorar la base (se pueden fabricar varias veces)
  const OBJETOS = [
    { id: 'carpa_b', nombre: 'Carpa', tex: 'carpa_b', costo: { madera: 20, piedra: 5 }, solido: [56, 28], ancho: 2 },
    { id: 'carpa_v', nombre: 'Carpa verde', tex: 'carpa_v', costo: { madera: 20, agua: 5 }, solido: [56, 28], ancho: 2 },
    { id: 'cerco', nombre: 'Cerco', tex: 'cerco', costo: { madera: 2 } },
    { id: 'lena', nombre: 'Leña', tex: 'lena', costo: { madera: 3 } },
    { id: 'antorcha', nombre: 'Antorcha', tex: 'antorcha', costo: { madera: 2, cristal: 1 }, solido: [10, 10] },
    { id: 'barril', nombre: 'Barril', tex: 'barril', costo: { madera: 6 }, solido: [22, 14] },
    { id: 'flores', nombre: 'Flores', tex: 'flor1', costo: { agua: 1 } },
    { id: 'arbusto', nombre: 'Arbusto', tex: 'arbusto', costo: { agua: 2 } },
    { id: 'manzano', nombre: 'Manzano', tex: 'arbol_manzano', costo: { madera: 2, agua: 4 }, solido: [18, 12] },
    { id: 'roca', nombre: 'Roca decorativa', tex: 'roca_musgo', costo: { piedra: 4 }, solido: [26, 16] },
  ];
  const OBJ = Object.fromEntries(OBJETOS.map((o) => [o.id, o]));

  // Mundos: uno por unidad
  const MUNDOS = {
    u1: { nombre: { '7basico': 'Bosque de los Enteros', '8basico': 'Bosque de las Potencias' }, semilla: 11, fondo: '#2f6b47',
      suelo: [[5, 0, 1], [5, 1, 0.15]], arboles: ['arbol_manzano', 'arbol_redondo', 'arbol_pino', 'arbol_otono'], nArboles: 110,
      rocas: ['roca3'], nRocas: 30, lagos: 2, cofres: 6, arbustos: 9, nieblas: 3, bichos: 0.18 },
    u2: { nombre: 'Cumbres Algebraicas', semilla: 22, fondo: '#5d6b6f',
      suelo: [[5, 0, 1], [7, 0, 0.35], [5, 1, 0.1]], arboles: ['arbol_pino', 'arbol_pino', 'arbol_redondo'], nArboles: 85,
      rocas: ['roca3', 'roca3', 'roca_cafe3'], nRocas: 55, lagos: 1, cofres: 6, arbustos: 6, nieblas: 7, bichos: 0.12, tinte: [0x506070, 0.18] },
    u3: { nombre: 'Valle de las Formas', semilla: 33, fondo: '#c9b27a',
      suelo: [[8, 0, 1], [5, 0, 0.3], [5, 1, 0.08]], arboles: ['arbol_otono', 'arbol_redondo', 'cactus'], nArboles: 80,
      rocas: ['roca_cafe3', 'roca3'], nRocas: 40, lagos: 1, cofres: 7, arbustos: 10, nieblas: 3, bichos: 0.2 },
    u4: { nombre: 'Pantano de los Datos', semilla: 44, fondo: '#2b4a3a',
      suelo: [[5, 1, 1], [5, 0, 0.3]], arboles: ['arbol_redondo', 'arbol_pino', 'arbol_manzano'], nArboles: 95,
      rocas: ['roca_musgo3', 'roca3'], nRocas: 30, lagos: 5, cofres: 6, arbustos: 8, nieblas: 9, bichos: 0.15, tinte: [0x0f3020, 0.38] },
  };
  const nombreZona = (z) => (z === 'base' ? 'Tu base' : typeof MUNDOS[z].nombre === 'string' ? MUNDOS[z].nombre : MUNDOS[z].nombre[S.curso]);

  const ENEMIGOS = {
    arbusto: { nombre: 'Arbusto gruñón', vida: 3, dif: 1, botin: { madera: 3 }, xp: 15, vel: 58 },
    niebla: { nombre: 'Niebla confusa', vida: 4, dif: 2, botin: { agua: 3, cristal: 1 }, xp: 22, vel: 42 },
    bicho: { nombre: 'Araña del árbol', vida: 2, dif: 1, botin: { madera: 2 }, xp: 10, vel: 85 },
  };
  const xpPara = (nivel) => 60 + 40 * nivel;
  const JEFES = {
    u1: { nombre: 'Guardián del Cero', color: '#7d8a7a' },
    u2: { nombre: 'Coloso de la Incógnita', color: '#8a93a6' },
    u3: { nombre: 'Titán de las Formas', color: '#c9a46b' },
    u4: { nombre: 'Hidra de los Datos', color: '#5d7b55' },
  };
  const JEFE_MIN = 4, JEFE_VIDA_POR_JUGADOR = 6, JEFE_DESCANSO = 5 * 60000;
  const JEFE_PREMIO = { cristal: 5, madera: 10, piedra: 10 };

  // ===================================================================
  // Utilidades
  // ===================================================================
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const mate = (s) => esc(s)
    .replace(/(\d+|\))\^(−?\d+)/g, '$1<sup>$2</sup>')
    .replace(/(−?\d+)\/(\d+)/g, '<span class="frac"><span>$1</span><span>$2</span></span>');
  const almacen = {
    leer(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    escribir(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
  };
  const tactil = () => window.matchMedia('(pointer: coarse)').matches;
  const corazon = (lleno) => `<svg class="cor ${lleno ? '' : 'vacio'}" viewBox="0 0 16 14" aria-hidden="true"><path d="M8 13.5 1.6 7.4A3.9 3.9 0 0 1 8 2.5a3.9 3.9 0 0 1 6.4 4.9z"/></svg>`;
  const corazones = (n, max) => Array.from({ length: max }, (_, i) => corazon(i < n)).join('');

  function toast(msg, tipo = '') {
    const t = $('toast');
    t.textContent = msg;
    t.className = tipo;
    t.style.opacity = '1';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.classList.add('oculto'), 300); }, 2800);
  }

  // ===================================================================
  // Estado, sesión y guardado
  // ===================================================================
  let S = null;            // progreso del jugador (se guarda completo)
  let juegoCerrado = false; // el docente cerró el juego para este curso
  let escena = null;
  const sesion = { modo: 'local', token: null, claveLocal: null, ultimo: '', avisoSinRed: false };

  function estadoNuevo(curso, nombre, pj) {
    return {
      v: 2, curso, nombre, pj, seccion: '',
      mochila: { madera: 0, piedra: 0, agua: 0, cristal: 0 },
      cofre: { madera: 0, piedra: 0, agua: 0, cristal: 0 },
      mejoras: [], herramienta: 'hacha', inventario: {}, colocados: [],
      vida: 5, xp: 0, nivel: 1, stats: {}, vencidos: 0, muertes: 0, zona: 'base', creado: Date.now(),
    };
  }
  function normalizar(p, curso, nombre, pj) {
    if (!p || !p.v) return estadoNuevo(curso, nombre, pj);
    if (p.v === 1) { // partida antigua: los recursos pasan al cofre
      const n = estadoNuevo(p.curso || curso, nombre, p.pj || pj);
      n.cofre = { ...n.cofre, ...(p.recursos || {}) };
      n.mejoras = (p.mejoras || []).filter((m) => NOMBRE_MEJORA[m]);
      n.xp = p.xp || 0; n.nivel = p.nivel || 1; n.stats = p.stats || {};
      return n;
    }
    const base = estadoNuevo(curso, nombre, pj);
    return { ...base, ...p, mochila: { ...base.mochila, ...p.mochila }, cofre: { ...base.cofre, ...p.cofre }, nombre: nombre || p.nombre };
  }

  const tiene = (id) => S.mejoras.includes(id);
  const vidaMax = () => 5 + (tiene('armadura') ? 2 : 0) + (tiene('armadura2') ? 2 : 0);
  const danio = () => (tiene('espada2') ? 3 : tiene('espada') ? 2 : 1);
  const esDocente = () => Boolean(S && S.docente);
  const total = (r) => (esDocente() ? Infinity : (S.mochila[r] || 0) + (S.cofre[r] || 0));
  const alcanza = (costo) => Object.entries(costo).every(([r, n]) => total(r) >= n);
  function pagar(costo) {
    if (esDocente()) return;
    for (const [r, n] of Object.entries(costo)) {
      const delCofre = Math.min(S.cofre[r] || 0, n);
      S.cofre[r] -= delCofre;
      S.mochila[r] -= n - delCofre;
    }
  }

  function guardar(inmediato = false) {
    if (!S) return;
    S.zona = escena ? escena.zona : S.zona;
    if (sesion.modo === 'local') { almacen.escribir(sesion.claveLocal, S); return; }
    if (inmediato) subir();
  }
  // Sube el progreso solo si cambió desde la última vez que se guardó en el sistema.
  async function subir(keepalive = false) {
    if ((sesion.modo !== 'nube' && sesion.modo !== 'docente') || !S) return;
    if (escena) S.zona = escena.zona;
    const txt = JSON.stringify(S);
    if (txt === sesion.ultimo) return;
    try {
      const ok = sesion.modo === 'docente'
        ? await Nube.docenteGuardar(sesion.token, S, zonaRed(), keepalive)
        : await Nube.guardar(sesion.token, S, zonaRed(), keepalive);
      if (ok === false) { sesionVencida(); return; }
      sesion.ultimo = txt;
      sesion.avisoSinRed = false;
    } catch (e) {
      if (!sesion.avisoSinRed) { sesion.avisoSinRed = true; toast('Sin conexión: tu avance se guardará cuando vuelva internet.', 'alerta'); }
    }
  }
  function sesionVencida() {
    const docente = sesion.modo === 'docente';
    ui.abrir(`<h2 id="modal-titulo">Tu sesión terminó</h2><p class="enunciado" style="font-size: 18px">Por seguridad, la sesión dura unas horas. Vuelve a entrar ${docente ? 'al portal docente con tu RUT y tu código' : 'con tu RUT y tu clave'} para seguir donde quedaste.</p>
      <div class="acciones"><span></span><button type="button" class="btn pri" id="sv-ok" data-foco>Volver a entrar</button></div>`);
    $('sv-ok').addEventListener('click', () => { if (docente) { try { sessionStorage.removeItem('mw_docente'); } catch (e) { /* */ } location.href = './'; } else location.reload(); });
  }
  setInterval(() => subir(), 10000);
  setInterval(() => latir(), 20000);
  // Latido: mantiene "en línea" al estudiante y lo saca del juego si el docente cierra su curso.
  async function latir() {
    if (sesion.modo !== 'nube' || !S || juegoCerrado) return;
    try { const r = await Nube.latido(sesion.token, zonaRed()); if (r && r.abierto === false) cerrarPorDocente(); } catch (e) { /* sin red: se reintenta */ }
  }
  async function cerrarPorDocente() {
    if (juegoCerrado) return;
    juegoCerrado = true;
    if (escena && escena.canal) { escena.canal.salir(); escena.canal = null; }
    guardar(true);
    await subir();
    ui.abrir(`<h2 id="modal-titulo">El juego está cerrado</h2>
      <p class="enunciado" style="font-size: 18px">Tu profesor cerró el juego para tu curso. Tu avance quedó guardado: podrás seguir donde quedaste cuando lo vuelva a abrir.</p>
      <div class="acciones"><span></span><button type="button" class="btn pri" id="jc-ok" data-foco>Salir</button></div>`, 'bloqueo');
    $('jc-ok').addEventListener('click', () => location.reload());
  }
  // Zona que ve el docente: "base", "u1" (solo) o "u1-g3" (grupo 3)
  function zonaRed() {
    const z = escena ? escena.zona : (S && S.zona) || 'base';
    return z !== 'base' && S && S.grupo ? `${z}-g${S.grupo}` : z;
  }
  const idJuego = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now();
  const coopActivo = () => Boolean(window.Coop && Coop.disponible && (sesion.modo === 'nube' || sesion.modo === 'docente'));
  const nivelNum = () => (S.curso === '8basico' ? '8' : '7');
  window.addEventListener('pagehide', () => { guardar(); subir(true); });

  function sumar(recurso, n) {
    S.mochila[recurso] = (S.mochila[recurso] || 0) + n;
    pintarHUD();
    const el = document.querySelector(`.recurso[data-r="${recurso}"]`);
    if (el) { el.classList.add('sube'); setTimeout(() => el.classList.remove('sube'), 350); }
  }
  function ganarXP(n) {
    S.xp += n;
    while (S.xp >= xpPara(S.nivel)) { S.xp -= xpPara(S.nivel); S.nivel += 1; toast(`¡Subiste a nivel ${S.nivel}!`); }
    pintarHUD();
  }
  const difPara = (base) => Math.min(3, base + (S.nivel >= 6 ? 1 : 0));
  const unidadActual = () => (escena && escena.zona !== 'base' ? escena.zona : 'u1');

  // ===================================================================
  // Ingreso
  // ===================================================================
  const ingreso = { nivel: '7', pj: 'zorro', rut: null, estado: null };

  function prepararIngreso() {
    const cont = $('personajes');
    cont.innerHTML = PERSONAJES.map((p) => `
      <button type="button" class="opcion" data-pj="${p.id}" aria-pressed="false" aria-label="Personaje ${p.nombre}">
        <span class="retrato" style="background-image:url('assets/pj/${p.id}_nada.png')"></span>
        <span style="font-size: 12px">${p.nombre}</span>
      </button>`).join('');
    const marcar = () => {
      document.querySelectorAll('[data-nivel]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.nivel === ingreso.nivel)));
      document.querySelectorAll('[data-pj]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pj === ingreso.pj)));
    };
    document.querySelectorAll('[data-nivel]').forEach((b) => b.addEventListener('click', () => { ingreso.nivel = b.dataset.nivel; reiniciarPaso(); marcar(); }));
    document.querySelectorAll('[data-pj]').forEach((b) => b.addEventListener('click', () => { ingreso.pj = b.dataset.pj; marcar(); }));
    marcar();

    document.querySelectorAll('[data-pestana]').forEach((b) => b.addEventListener('click', () => {
      document.querySelectorAll('[data-pestana]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      $('form-estudiante').classList.toggle('oculto', b.dataset.pestana !== 'estudiante');
      $('form-docente').classList.toggle('oculto', b.dataset.pestana !== 'docente');
    }));

    if (!Nube.activo) {
      // Sin base de datos configurada: modo local con apodo
      document.querySelectorAll('.solo-nube').forEach((e) => e.classList.add('oculto'));
      document.querySelectorAll('.solo-local').forEach((e) => e.classList.remove('oculto'));
      $('bloque-pj').classList.remove('oculto');
      $('btn-entrar').textContent = 'Entrar al mundo';
    }
    $('rut').addEventListener('input', reiniciarPaso);
    entrarComoDocente();
    $('form-estudiante').addEventListener('submit', enviarEstudiante);
    $('form-docente').addEventListener('submit', enviarDocente);
  }
  function reiniciarPaso() {
    if (!Nube.activo) return;
    ingreso.estado = null;
    $('bloque-clave').classList.add('oculto');
    $('bloque-pj').classList.add('oculto');
    $('btn-entrar').textContent = 'Continuar';
    error('');
  }
  function error(msg, id = 'error-ingreso') {
    const e = $(id);
    e.textContent = msg;
    e.classList.toggle('oculto', !msg);
  }

  async function enviarEstudiante(ev) {
    ev.preventDefault();
    const btn = $('btn-entrar');
    const curso = ingreso.nivel === '7' ? '7basico' : '8basico';
    if (!Nube.activo) {
      const apodo = $('apodo').value.trim();
      if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_]{3,16}$/.test(apodo)) return error('El apodo debe tener entre 3 y 16 letras o números, sin espacios.');
      sesion.modo = 'local';
      sesion.claveLocal = `mathworld2:${curso}:${apodo.toLowerCase()}`;
      S = normalizar(almacen.leer(sesion.claveLocal), curso, apodo, ingreso.pj);
      S.pj = ingreso.pj;
      return empezar();
    }
    const rut = Nube.rut($('rut').value);
    if (!rut) return error('Revisa tu RUT: debe tener el dígito verificador, por ejemplo 12.345.678-5.');
    btn.disabled = true;
    try {
      if (!ingreso.estado || ingreso.rut !== rut) {
        const est = await Nube.estado(rut, ingreso.nivel);
        if (!est || !est.existe) return error(`Tu RUT no está en las listas de ${ingreso.nivel}° básico. Revisa el curso elegido o habla con tu profesor.`);
        if (est.abierto === false) return error(`El juego de ${est.curso[0]}°${est.curso[1]} está cerrado en este momento. Tu profesor lo abrirá en clases.`);
        ingreso.estado = est; ingreso.rut = rut;
        $('saludo').textContent = est.tiene_clave ? `Hola, ${est.nombre}. Escribe tu clave.` : `Hola, ${est.nombre}. Es tu primera vez: crea una clave de al menos 4 caracteres y elige tu personaje.`;
        $('bloque-clave').classList.remove('oculto');
        $('confirmar-fila').classList.toggle('oculto', est.tiene_clave);
        $('bloque-pj').classList.toggle('oculto', est.tiene_clave);
        $('clave').value = ''; $('clave2').value = '';
        btn.textContent = 'Entrar al mundo';
        $('clave').focus();
        return error('');
      }
      const clave = $('clave').value;
      if (!ingreso.estado.tiene_clave) {
        if (clave.length < 4) return error('La clave debe tener al menos 4 caracteres.');
        if (clave !== $('clave2').value) return error('Las dos claves no coinciden.');
      }
      const r = await Nube.entrar(rut, ingreso.nivel, clave);
      if (!r || !r.ok) {
        const msg = { clave_incorrecta: 'Clave incorrecta. Si la olvidaste, pide a tu profesor que la restablezca.', bloqueado: 'Demasiados intentos fallidos. Espera 10 minutos.', clave_corta: 'La clave debe tener al menos 4 caracteres.', cerrado: 'El juego de tu curso está cerrado en este momento. Tu profesor lo abrirá en clases.' };
        return error(msg[r && r.error] || 'No se pudo entrar. Inténtalo otra vez.');
      }
      sesion.modo = 'nube'; sesion.token = r.token;
      const primerNombre = (r.nombre || '').split(' ')[2] || (r.nombre || '').split(' ')[0] || 'Explorador';
      S = normalizar(r.progreso, curso, primerNombre, ingreso.pj);
      S.seccion = r.curso;
      if (!r.progreso || !r.progreso.v) S.pj = ingreso.pj;
      guardar(true);
      empezar();
    } catch (e) {
      error('No hay conexión con el servidor. Revisa internet e inténtalo de nuevo.');
    } finally { btn.disabled = false; }
  }

  // Entrada del docente al juego desde el portal: docente.html → ./?docente=7&pj=zorro
  async function entrarComoDocente() {
    const q = new URLSearchParams(location.search);
    const nivel = q.get('docente');
    if (!nivel || !Nube.activo) return;
    let token = null;
    try { token = sessionStorage.getItem('mw_docente'); } catch (e) { /* */ }
    if (!token) { history.replaceState(null, '', './'); return; }
    $('ingreso').classList.add('oculto');
    try {
      const p = await Nube.docenteProgreso(token);
      if (p === null) { try { sessionStorage.removeItem('mw_docente'); } catch (e) { /* */ } location.replace('./'); return; }
      const curso = nivel === '8' ? '8basico' : '7basico';
      const pj = PERSONAJES.some((x) => x.id === q.get('pj')) ? q.get('pj') : (p.pj || 'zorro');
      sesion.modo = 'docente'; sesion.token = token;
      S = normalizar(p, curso, 'Profe', pj);
      S.curso = curso; S.pj = pj; S.docente = true; S.seccion = 'Docente'; S.nombre = 'Profe';
      history.replaceState(null, '', './');
      guardar(true);
      empezar();
    } catch (e) {
      $('ingreso').classList.remove('oculto');
      error('No hay conexión con el servidor.', 'error-ingreso');
    }
  }

  async function enviarDocente(ev) {
    ev.preventDefault();
    const rut = Nube.rut($('rut-docente').value);
    if (!rut) return error('Revisa el RUT.', 'error-docente');
    try {
      const r = await Nube.docenteEntrar(rut, $('codigo-docente').value);
      if (!r || !r.ok) return error(r && r.error === 'bloqueado' ? 'Demasiados intentos. Espera 15 minutos.' : 'RUT o código incorrecto.', 'error-docente');
      try { sessionStorage.setItem('mw_docente', r.token); } catch (e) { /* */ }
      location.href = 'docente.html';
    } catch (e) { error('No hay conexión con el servidor.', 'error-docente'); }
  }

  function empezar() {
    $('ingreso').classList.add('oculto');
    $('hud').classList.remove('oculto');
    if (tactil()) {
      $('tactil').classList.remove('oculto');
      document.querySelectorAll('.btn-hud kbd, .aviso kbd').forEach((k) => k.classList.add('oculto'));
    }
    S.vida = Math.min(S.vida || vidaMax(), vidaMax());
    pintarHUD();
    iniciarPhaser(S.zona && (S.zona === 'base' || MUNDOS[S.zona]) ? S.zona : 'base');
    setTimeout(() => toast(esDocente() ? 'Modo docente: recursos ilimitados y fabricación sin desafíos.' : S.creado > Date.now() - 60000 ? `¡Bienvenido, ${S.nombre}! Esta es tu base. Camina al portal para viajar.` : `¡Hola de nuevo, ${S.nombre}!`), 700);
  }

  // ===================================================================
  // HUD
  // ===================================================================
  function pintarHUD() {
    if (!S) return;
    const enBase = !escena || escena.zona === 'base';
    $('hud-foto').style.backgroundImage = `url('assets/pj/${S.pj}_nada.png')`;
    $('hud-apodo').textContent = S.nombre;
    $('hud-nivel').textContent = `Nivel ${S.nivel}`;
    $('hud-vida').innerHTML = corazones(S.vida, vidaMax());
    $('hud-vida').setAttribute('aria-label', `Vida: ${S.vida} de ${vidaMax()}`);
    $('hud-xpbar').style.width = `${Math.round((S.xp / xpPara(S.nivel)) * 100)}%`;
    $('hud-zona').textContent = escena ? nombreZona(escena.zona) : '';
    const fuente = enBase ? S.cofre : S.mochila;
    $('hud-recursos').innerHTML = `<span class="rot">${esDocente() ? 'Docente · ilimitado' : enBase ? 'Cofre' : 'Mochila'}</span>` + RECURSOS.map((r) => `
      <div class="recurso" data-r="${r.id}">
        <img class="px" src="${ICONO(r.id)}" alt="">
        <span><small>${r.nombre}</small><b>${esDocente() ? '∞' : fuente[r.id] || 0}</b></span>
      </div>`).join('');
    const ranuras = [
      { id: 'hacha', icono: 'axe', tecla: '1', ok: true, nombre: tiene('hacha2') ? 'Hacha de hierro' : 'Hacha' },
      { id: 'pico', icono: 'pickaxe', tecla: '2', ok: tiene('pico'), nombre: tiene('pico2') ? 'Pico reforzado' : 'Pico' },
      { id: 'espada', icono: 'espada', tecla: '', ok: tiene('espada'), nombre: tiene('espada2') ? 'Espada de cristal' : 'Espada' },
      { id: 'balde', icono: 'agua', tecla: '', ok: tiene('balde'), nombre: 'Balde' },
    ];
    $('hud-herramientas').innerHTML = ranuras.map((r) => `
      <div class="ranura ${S.herramienta === r.id ? 'activa' : ''} ${r.ok ? '' : 'falta'}" title="${esc(r.ok ? r.nombre : r.nombre + ' (fabrícalo en tu base)')}">
        ${r.tecla ? `<small>${r.tecla}</small>` : ''}<img class="px" src="${ICONO(r.icono)}" alt="${esc(r.nombre)}">
      </div>`).join('');
    $('btn-base').classList.toggle('oculto', !enBase);
    $('btn-decorar').classList.toggle('oculto', !enBase);
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
    abierto: false, alCerrar: null, teclas: null,
    abrir(html, clase = '', alCerrar = null) {
      if (juegoCerrado && clase !== 'bloqueo') return;
      const m = $('modal');
      m.className = 'modal ' + clase;
      m.innerHTML = html;
      $('capa').classList.remove('oculto');
      this.abierto = true; this.alCerrar = alCerrar; this.teclas = null;
      const foco = m.querySelector('[data-foco]') || m.querySelector('button');
      if (foco) foco.focus();
    },
    cerrar() {
      $('capa').classList.add('oculto');
      $('modal').innerHTML = '';
      this.abierto = false; this.teclas = null;
      const f = this.alCerrar; this.alCerrar = null;
      if (f) f();
    },
  };
  const unaVez = (f) => { let hecho = false; return (...a) => { if (!hecho) { hecho = true; f(...a); } }; };
  function registrar(tema, acierto) {
    const st = S.stats[tema] || (S.stats[tema] = { a: 0, i: 0 });
    st.i += 1; if (acierto) st.a += 1;
  }
  function alternativasHTML(d, elegida, fallidas, resuelto) {
    return `<div class="alternativas">${d.opciones.map((o, i) => {
      const cls = resuelto && i === d.correcta ? 'bien' : fallidas.has(i) ? 'mal' : '';
      return `<button type="button" class="alt ${cls}" data-i="${i}" aria-pressed="${elegida === i}" ${resuelto || fallidas.has(i) ? 'disabled' : ''}>${mate(o)}</button>`;
    }).join('')}</div>`;
  }

  // ---------- Desafío para recolectar o fabricar ----------
  function abrirDesafio({ accion, dif, premio, unidad, onOk }) {
    const pagarUnaVez = unaVez(onOk);
    const nuevo = () => Preguntas.nuevo(S.curso, unidad || unidadActual(), dif, S.stats);
    let d = nuevo(), elegida = null, fallos = 0, resuelto = false, pista = false, fallidas = new Set();
    const pintar = () => {
      let msg = '';
      if (resuelto) msg = `<div class="mensaje bien" role="status">¡Correcto! ${mate(d.explicacion)}</div>`;
      else if (fallos >= 2) msg = `<div class="mensaje mal" role="status">Revisemos juntos: ${mate(d.explicacion)} Puedes elegir esa respuesta o pedir otro desafío.</div>`;
      else if (fallos === 1) msg = `<div class="mensaje mal" role="status">Casi. ${mate(d.pista)} Inténtalo otra vez.</div>`;
      else if (pista) msg = `<div class="mensaje pista">${mate(d.pista)}</div>`;
      ui.abrir(`
        <div class="modal-cab">
          <div><span class="etq">${esc(d.titulo)}</span><h2 id="modal-titulo">${esc(accion)}</h2></div>
          <div class="pildoras"><span class="pildora">Dificultad ${dif} de 3</span><span class="pildora premio">${premio}</span></div>
        </div>
        <p class="enunciado">${mate(d.enunciado)}</p>
        ${alternativasHTML(d, elegida, fallidas, resuelto)}
        ${msg}
        <div class="acciones">
          <div>${resuelto ? '' : `<button type="button" class="btn sec" id="d-pista">${pista ? 'Ocultar pista' : 'Ver pista'}</button>`}
               ${!resuelto && fallos >= 2 ? '<button type="button" class="btn sec" id="d-otro">Otro desafío</button>' : ''}</div>
          <div>${resuelto ? '<button type="button" class="btn pri" id="d-seguir" data-foco>¡Seguir!</button>'
            : `<button type="button" class="btn" id="d-salir">Salir</button><button type="button" class="btn pri" id="d-ok" ${elegida === null ? 'disabled' : ''}>Comprobar</button>`}</div>
        </div>`);
      document.querySelectorAll('.alt').forEach((b) => b.addEventListener('click', () => { elegida = Number(b.dataset.i); pintar(); }));
      const on = (id, f) => { const el = $(id); if (el) el.addEventListener('click', f); };
      on('d-pista', () => { pista = !pista; pintar(); });
      on('d-salir', () => ui.cerrar());
      on('d-otro', () => { d = nuevo(); elegida = null; fallos = 0; fallidas = new Set(); pista = false; pintar(); });
      on('d-ok', comprobar);
      on('d-seguir', () => { ui.alCerrar = pagarUnaVez; ui.cerrar(); });
      ui.teclas = teclas;
    };
    const comprobar = () => {
      if (elegida === null || resuelto) return;
      const ok = elegida === d.correcta;
      registrar(d.tema, ok);
      if (ok) { resuelto = true; ganarXP(8 + 6 * dif - Math.min(fallos, 2) * 4); }
      else { fallos += 1; fallidas.add(elegida); elegida = null; }
      guardar();
      pintar();
    };
    const teclas = (e) => {
      if (/^[1-4]$/.test(e.key) && !resuelto) { const i = Number(e.key) - 1; if (!fallidas.has(i)) { elegida = i; pintar(); } }
      else if (e.key === 'Enter') { e.preventDefault(); if (resuelto) { ui.alCerrar = pagarUnaVez; ui.cerrar(); } else comprobar(); }
    };
    pintar();
  }

  // ---------- Combate ----------
  function abrirCombate(enemigo, alTerminar) {
    const E = ENEMIGOS[enemigo.clase];
    const dif = difPara(E.dif);
    const nuevo = () => Preguntas.nuevo(S.curso, unidadActual(), dif, S.stats);
    let d = nuevo(), elegida = null, fallidas = new Set(), fase = 'pregunta', ultimo = '', pista = false;
    const retrato = escena.retrato(enemigo.clase);
    const fin = unaVez((r) => alTerminar(r));

    const pintar = () => {
      const vidaE = Math.max(0, enemigo.vida);
      let cuerpo;
      if (fase === 'victoria') {
        cuerpo = `<div class="mensaje bien" role="status">¡Venciste al ${esc(E.nombre.toLowerCase())}! Ganas ${Object.entries(E.botin).map(([r, n]) => `${n} ${r}`).join(' y ')} y ${E.xp} de experiencia.</div>
          <div class="acciones"><span></span><button type="button" class="btn pri" id="c-fin" data-foco>¡Seguir!</button></div>`;
      } else if (fase === 'derrota') {
        cuerpo = `<div class="mensaje mal" role="status">Te quedaste sin corazones. Volverás a tu base y perderás lo que llevabas en la mochila.</div>
          <div class="acciones"><span></span><button type="button" class="btn pri" id="c-fin" data-foco>Volver a mi base</button></div>`;
      } else {
        cuerpo = `
          ${ultimo}
          <p class="enunciado">${mate(d.enunciado)}</p>
          ${alternativasHTML(d, elegida, fallidas, false)}
          ${pista ? `<div class="mensaje pista">${mate(d.pista)}</div>` : ''}
          <div class="acciones">
            <div><button type="button" class="btn sec" id="c-pista">${pista ? 'Ocultar pista' : 'Ver pista'}</button><button type="button" class="btn" id="c-huir">Huir</button></div>
            <div><button type="button" class="btn pri" id="c-ok" ${elegida === null ? 'disabled' : ''}>¡Atacar!</button></div>
          </div>`;
      }
      ui.abrir(`
        <div class="combate-cab">
          <div class="luchador">
            <img class="px" src="${retrato}" alt="" width="72" height="72">
            <div><span class="etq" style="color: var(--coral)">Combate · ${esc(d.titulo)}</span><h2 id="modal-titulo">${esc(E.nombre)}</h2>
              <div class="barra enemigo" role="img" aria-label="Vida del enemigo: ${vidaE} de ${enemigo.vidaMax}"><i style="width: ${(vidaE / enemigo.vidaMax) * 100}%"></i></div></div>
          </div>
          <div class="tu-vida"><span class="etq">Tu vida</span><div class="corazones">${corazones(S.vida, vidaMax())}</div><span class="nota">Tu golpe quita ${danio()}</span></div>
        </div>
        ${cuerpo}`, 'combate');
      document.querySelectorAll('.alt').forEach((b) => b.addEventListener('click', () => { elegida = Number(b.dataset.i); pintar(); }));
      const on = (id, f) => { const el = $(id); if (el) el.addEventListener('click', f); };
      on('c-ok', atacar);
      on('c-pista', () => { pista = !pista; pintar(); });
      on('c-huir', () => { ui.alCerrar = () => fin('huir'); ui.cerrar(); });
      on('c-fin', () => { ui.alCerrar = () => fin(fase); ui.cerrar(); });
      ui.teclas = teclas;
    };
    const atacar = () => {
      if (elegida === null || fase !== 'pregunta') return;
      const ok = elegida === d.correcta;
      registrar(d.tema, ok);
      if (ok) {
        enemigo.vida -= danio();
        ganarXP(4 + 2 * dif);
        escena.golpeEnemigo(enemigo, danio());
        ultimo = `<div class="mensaje bien" role="status">¡Golpe! ${mate(d.explicacion)}</div>`;
        if (enemigo.vida <= 0) fase = 'victoria';
      } else {
        S.vida -= 1;
        escena.dolor();
        pintarHUD();
        ultimo = `<div class="mensaje mal" role="status">¡Te golpeó! La respuesta era ${mate(d.opciones[d.correcta])}. ${mate(d.explicacion)}</div>`;
        if (S.vida <= 0) fase = 'derrota';
      }
      guardar();
      d = nuevo(); elegida = null; fallidas = new Set(); pista = false;
      pintar();
    };
    const teclas = (e) => {
      if (fase !== 'pregunta') { if (e.key === 'Enter') { e.preventDefault(); ui.alCerrar = () => fin(fase); ui.cerrar(); } return; }
      if (/^[1-4]$/.test(e.key)) { elegida = Number(e.key) - 1; pintar(); }
      else if (e.key === 'Enter') { e.preventDefault(); atacar(); }
    };
    pintar();
  }

  // ---------- Jefe final cooperativo ----------
  let jefeUI = null;
  function abrirInfoJefe(zona) {
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq" style="color: var(--coral)">Jefe final</span><h2 id="modal-titulo">${esc(JEFES[zona].nombre)}</h2></div></div>
      <p class="enunciado" style="font-size: 18px">Este jefe no se puede vencer en solitario. Viaja a este mundo con un grupo y reúnan al menos <strong>${JEFE_MIN} jugadores</strong> en su guarida. Cada uno responde sus ejercicios y todos los aciertos le quitan vida.</p>
      <div class="acciones"><span></span><button type="button" class="btn pri" id="ij-ok" data-foco>Entendido</button></div>`, 'jefe');
    $('ij-ok').addEventListener('click', () => ui.cerrar());
  }
  function abrirJefe() {
    const e = escena, J0 = JEFES[e.zona];
    const dif = difPara(2);
    const nuevo = () => Preguntas.nuevo(S.curso, e.zona, dif, S.stats);
    let d = nuevo(), elegida = null, ultimo = '', fase = 'pregunta', pagado = false;
    const retrato = e.textures.getBase64(`jefe_${e.zona}`);
    const equipoHTML = () => e.jefe.part.map((id) => `<span class="pildora">${esc(e.nombreJugador(id))}</span>`).join('');
    const barra = () => { const J = e.jefe; return J.max ? Math.max(0, (J.hp / J.max) * 100) : 0; };
    const pintar = () => {
      let cuerpo;
      if (fase === 'victoria') {
        cuerpo = `<div class="mensaje bien" role="status">¡Su grupo venció al ${esc(J0.nombre.toLowerCase())}! Cada participante gana ${Object.entries(JEFE_PREMIO).map(([r, n]) => `${n} ${r}`).join(', ')} y 80 de experiencia.</div>
          <div class="acciones"><span></span><button type="button" class="btn pri" id="j-fin" data-foco>¡Celebrar!</button></div>`;
      } else if (fase === 'caido') {
        cuerpo = `<div class="mensaje mal" role="status">Te quedaste sin corazones. Tu grupo sigue luchando; tú vuelves a tu base y pierdes lo que llevabas en la mochila.</div>
          <div class="acciones"><span></span><button type="button" class="btn pri" id="j-fin" data-foco>Volver a mi base</button></div>`;
      } else if (fase === 'fin') {
        cuerpo = `<div class="mensaje pista" role="status">El combate terminó porque el grupo se separó. Pueden volver a intentarlo cuando estén ${JEFE_MIN} en la guarida.</div>
          <div class="acciones"><span></span><button type="button" class="btn pri" id="j-fin" data-foco>Cerrar</button></div>`;
      } else {
        cuerpo = `${ultimo}
          <p class="enunciado">${mate(d.enunciado)}</p>
          ${alternativasHTML(d, elegida, new Set(), false)}
          <div class="acciones">
            <div><button type="button" class="btn" id="j-salir">Retirarse</button></div>
            <div><button type="button" class="btn pri" id="j-ok" ${elegida === null ? 'disabled' : ''}>¡Atacar!</button></div>
          </div>`;
      }
      ui.abrir(`
        <div class="combate-cab">
          <div class="luchador">
            <img class="px" src="${retrato}" alt="" width="72" height="72">
            <div><span class="etq" style="color: var(--coral)">Jefe final · ${esc(d.titulo)}</span><h2 id="modal-titulo">${esc(J0.nombre)}</h2>
              <div class="barra enemigo" role="img" aria-label="Vida del jefe"><i id="jefe-barra" style="width: ${barra()}%"></i></div>
              <span class="nota" id="jefe-hp">Vida: ${e.jefe.hp} de ${e.jefe.max}</span></div>
          </div>
          <div class="tu-vida"><span class="etq">Tu vida</span><div class="corazones">${corazones(S.vida, vidaMax())}</div><span class="nota">Tu golpe quita ${danio()}</span></div>
        </div>
        <div class="pildoras" id="jefe-equipo">${equipoHTML()}</div>
        ${cuerpo}`, 'combate');
      document.querySelectorAll('.alt').forEach((b) => b.addEventListener('click', () => { elegida = Number(b.dataset.i); pintar(); }));
      const on = (id, f) => { const el = $(id); if (el) el.addEventListener('click', f); };
      on('j-ok', atacar);
      on('j-salir', () => { e.salirDelJefe(); jefeUI = null; ui.cerrar(); });
      on('j-fin', terminar);
      ui.teclas = (ev) => {
        if (fase !== 'pregunta') { if (ev.key === 'Enter') { ev.preventDefault(); terminar(); } return; }
        if (/^[1-4]$/.test(ev.key)) { elegida = Number(ev.key) - 1; pintar(); } else if (ev.key === 'Enter') { ev.preventDefault(); atacar(); }
      };
    };
    const terminar = () => {
      const f = fase; jefeUI = null; e.enJefe = false; ui.cerrar();
      if (f === 'caido') morir(J0.nombre.toLowerCase());
    };
    const atacar = () => {
      if (elegida === null || fase !== 'pregunta') return;
      const ok = elegida === d.correcta;
      registrar(d.tema, ok);
      if (ok) { ganarXP(4 + 2 * dif); ultimo = `<div class="mensaje bien" role="status">¡Golpe! ${mate(d.explicacion)}</div>`; e.golpeLocal(danio()); }
      else {
        S.vida -= 1; e.dolor(); pintarHUD();
        ultimo = `<div class="mensaje mal" role="status">¡El jefe te golpeó! La respuesta era ${mate(d.opciones[d.correcta])}. ${mate(d.explicacion)}</div>`;
        if (S.vida <= 0) { fase = 'caido'; e.salirDelJefe(); }
      }
      guardar();
      d = nuevo(); elegida = null;
      if (fase === 'pregunta') revisar(); else pintar();
    };
    const revisar = () => {
      const J = e.jefe;
      if (fase === 'pregunta' && J.estado === 'vencido') {
        fase = 'victoria';
        if (!pagado) {
          pagado = true;
          Object.entries(JEFE_PREMIO).forEach(([r, n]) => sumar(r, n));
          ganarXP(80); S.jefes = S.jefes || {}; S.jefes[e.zona] = (S.jefes[e.zona] || 0) + 1; guardar(true);
          e.celebrar(e.jefeSpr ? e.jefeSpr.x : undefined, e.jefeSpr ? e.jefeSpr.y - 60 : undefined);
        }
        pintar(); return;
      }
      if (fase === 'pregunta' && (J.estado === 'libre' || !J.part.includes(idJuego))) { fase = 'fin'; e.enJefe = false; pintar(); return; }
      pintar();
    };
    jefeUI = () => {
      const b = $('jefe-barra'), t = $('jefe-hp'), q = $('jefe-equipo');
      if (b) b.style.width = `${barra()}%`;
      if (t) t.textContent = `Vida: ${e.jefe.hp} de ${e.jefe.max}`;
      if (q) q.innerHTML = equipoHTML();
      if (fase === 'pregunta' && (e.jefe.estado !== 'combate' || !e.jefe.part.includes(idJuego))) revisar();
    };
    pintar();
  }
  function actualizarJefeUI() { if (jefeUI) jefeUI(); }
  function pintarCoop() {
    const el = $('hud-coop'); if (!el) return;
    const e = escena;
    if (!e || e.zona === 'base') { el.classList.add('oculto'); return; }
    el.classList.remove('oculto');
    if (!e.canal) { el.textContent = 'Explorando solo'; return; }
    el.textContent = e.canal.est === 'ok' ? `Grupo ${S.grupo} · ${1 + e.otros.size} en este mundo` : `Grupo ${S.grupo} · conectando…`;
  }

  // ---------- Fabricar (en la base) ----------
  function costoHTML(costo) {
    return Object.entries(costo).map(([r, n]) => `<span class="${total(r) < n ? 'falta' : ''}"><img class="px" src="${ICONO(r)}" alt="">${n} ${r}</span>`).join('');
  }
  function abrirFabricar(pestana = 'equipo') {
    const filasEquipo = MEJORAS.map((m) => {
      const hecha = tiene(m.id), bloq = m.requiere && !tiene(m.requiere);
      const der = hecha ? '<span class="estado-ok">Fabricado</span>'
        : bloq ? `<span class="nota" style="max-width: 150px">Primero: ${esc(NOMBRE_MEJORA[m.requiere])}</span>`
          : `<button type="button" class="btn pri" data-m="${m.id}" ${alcanza(m.costo) ? '' : 'disabled'}>Fabricar</button>`;
      return `<div class="mejora ${hecha ? 'hecha' : ''}"><img class="ico px" src="${ICONO(m.icono)}" alt="">
        <div class="info"><strong>${esc(m.nombre)}</strong><span>${esc(m.desc)}</span><div class="costo">${costoHTML(m.costo)}</div></div>${der}</div>`;
    }).join('');
    const filasObjetos = OBJETOS.map((o) => `<div class="mejora"><img class="ico px" src="${escena.imagenTex(o.tex)}" alt="">
        <div class="info"><strong>${esc(o.nombre)}</strong><span>Tienes ${S.inventario[o.id] || 0} sin colocar</span><div class="costo">${costoHTML(o.costo)}</div></div>
        <button type="button" class="btn pri" data-o="${o.id}" ${alcanza(o.costo) ? '' : 'disabled'}>Fabricar</button></div>`).join('');
    ui.abrir(`
      <div class="modal-cab">
        <div><span class="etq">Tu base · Los recursos se toman del cofre y la mochila</span><h2 id="modal-titulo">Fabricar</h2></div>
        <button type="button" class="btn" id="f-cerrar">Cerrar</button>
      </div>
      <div class="pestanas" role="tablist">
        <button type="button" role="tab" data-p="equipo" aria-selected="${pestana === 'equipo'}">Herramientas y equipo</button>
        <button type="button" role="tab" data-p="objetos" aria-selected="${pestana === 'objetos'}">Objetos para tu base</button>
      </div>
      <div class="mejoras">${pestana === 'equipo' ? filasEquipo : filasObjetos}</div>`);
    $('f-cerrar').addEventListener('click', () => ui.cerrar());
    document.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => abrirFabricar(b.dataset.p)));
    document.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => {
      const m = MEJORAS.find((x) => x.id === b.dataset.m);
      const hacer = () => {
        if (!alcanza(m.costo) || tiene(m.id)) return;
        pagar(m.costo); S.mejoras.push(m.id);
        if (m.id === 'armadura' || m.id === 'armadura2') S.vida = vidaMax();
        guardar(true); pintarHUD(); escena.celebrar();
        toast(`¡Fabricaste: ${m.nombre}!`);
      };
      if (esDocente()) { hacer(); abrirFabricar('equipo'); return; }
      abrirDesafio({ accion: `Fabricar: ${m.nombre}`, dif: difPara(2), premio: 'Premio: la mejora', onOk: hacer });
    }));
    document.querySelectorAll('[data-o]').forEach((b) => b.addEventListener('click', () => {
      const o = OBJ[b.dataset.o];
      if (!alcanza(o.costo)) return;
      pagar(o.costo);
      S.inventario[o.id] = (S.inventario[o.id] || 0) + 1;
      guardar(true); pintarHUD();
      toast(`Fabricaste: ${o.nombre}. Colócalo con Decorar.`);
      abrirFabricar('objetos');
    }));
  }

  // ---------- Decorar ----------
  function abrirDecorar() {
    const items = OBJETOS.filter((o) => S.inventario[o.id] > 0);
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">Tu base</span><h2 id="modal-titulo">Decorar</h2></div><button type="button" class="btn" id="g-cerrar">Cerrar</button></div>
      <p class="nota">Elige un objeto: se colocará justo delante de tu personaje. Para guardar un objeto colocado, acércate y presiona E.</p>
      ${items.length ? `<div class="objetos">${items.map((o) => `<button type="button" class="obj" data-o="${o.id}"><img class="px" src="${escena.imagenTex(o.tex)}" alt=""><span>${esc(o.nombre)}</span><small>× ${S.inventario[o.id]}</small></button>`).join('')}</div>`
        : '<div class="mensaje pista">No tienes objetos sin colocar. Fabrícalos en la fogata, pestaña "Objetos para tu base".</div>'}`);
    $('g-cerrar').addEventListener('click', () => ui.cerrar());
    document.querySelectorAll('.obj').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.o;
      ui.alCerrar = () => { if (escena.colocar(id)) { S.inventario[id] -= 1; guardar(true); } };
      ui.cerrar();
    }));
  }

  // ---------- Portal ----------
  let contenido = null;
  async function cargarContenido() {
    if (!contenido) {
      try { contenido = await (await fetch('../contenido.json', { cache: 'no-cache' })).json(); } catch (e) { contenido = { cursos: [] }; }
    }
    const c = (contenido.cursos || []).find((x) => x.id === S.curso);
    return c ? c.unidades : [];
  }
  async function abrirPortal() {
    const unidades = await cargarContenido();
    const enBase = escena.zona === 'base';
    const tarjetas = unidades.map((u) => {
      const ok = u.habilitada && MUNDOS[u.id];
      const aqui = escena.zona === u.id;
      return `<button type="button" class="zona ${ok ? '' : 'cerrada'} ${aqui ? 'aqui' : ''}" data-z="${u.id}" ${ok && !aqui ? '' : 'disabled'}>
        <small>UNIDAD ${u.numero} · ${esc(u.titulo).toUpperCase()}</small><strong>${esc(MUNDOS[u.id] ? nombreZona(u.id) : 'Zona nueva')}</strong>
        <span>${aqui ? 'Estás aquí' : ok ? 'Viajar a este mundo' : `Se abre cuando tu profesor habilite la Unidad ${u.numero}.`}</span></button>`;
    }).join('');
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">Portal</span><h2 id="modal-titulo">¿A dónde quieres ir?</h2></div><button type="button" class="btn" id="p-cerrar">Cerrar</button></div>
      ${enBase ? '' : `<button type="button" class="zona" id="p-base"><small>TU BASE</small><strong>Volver a tu base</strong><span>Lo que llevas en la mochila se guarda en tu cofre y recuperas toda tu vida.</span></button>`}
      <div class="zonas">${tarjetas}</div>
      ${enBase ? '' : '<p class="nota">Si pierdes un combate en un mundo, vuelves a tu base sin lo que llevabas en la mochila.</p>'}`);
    $('p-cerrar').addEventListener('click', () => ui.cerrar());
    const pb = $('p-base');
    if (pb) pb.addEventListener('click', () => { ui.alCerrar = () => viajar('base'); ui.cerrar(); });
    document.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => {
      if (coopActivo()) elegirGrupo(b.dataset.z);
      else { ui.alCerrar = () => viajar(b.dataset.z, 0); ui.cerrar(); }
    }));
  }
  const MAX_GRUPO = 6, N_GRUPOS = 8;
  async function elegirGrupo(zona) {
    let cuentas = {};
    try { cuentas = (await Nube.grupos(sesion.token, nivelNum())) || {}; } catch (e) { /* sin datos: igual se puede elegir */ }
    const botones = Array.from({ length: N_GRUPOS }, (_, i) => {
      const g = i + 1, n = cuentas[`${zona}-g${g}`] || 0, lleno = n >= MAX_GRUPO && !esDocente();
      return `<button type="button" class="obj grupo" data-g="${g}" ${lleno ? 'disabled' : ''}><strong>Grupo ${g}</strong><small>${lleno ? 'Lleno' : n === 0 ? 'Vacío' : `${n} ${n === 1 ? 'jugador' : 'jugadores'}`}</small></button>`;
    }).join('');
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">${esc(nombreZona(zona))}</span><h2 id="modal-titulo">¿Con qué grupo vas?</h2></div><button type="button" class="btn" id="gr-volver">Volver</button></div>
      <p class="nota">Verás y jugarás con los compañeros de ${S.curso === '8basico' ? '8°' : '7°'} básico que elijan el mismo grupo (máximo ${MAX_GRUPO}). Para enfrentar al jefe final necesitan ser al menos 4 en su guarida.</p>
      <div class="objetos">${botones}</div>
      <div class="acciones"><span></span><button type="button" class="btn sec" id="gr-solo">Explorar solo</button></div>`);
    $('gr-volver').addEventListener('click', () => abrirPortal());
    $('gr-solo').addEventListener('click', () => { ui.alCerrar = () => viajar(zona, 0); ui.cerrar(); });
    document.querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => { ui.alCerrar = () => viajar(zona, Number(b.dataset.g)); ui.cerrar(); }));
  }
  function viajar(zona, grupo = 0) {
    const desde = escena.zona;
    S.grupo = zona === 'base' ? 0 : grupo;
    if (zona === 'base') {
      const guardado = RECURSOS.map((r) => [r.id, S.mochila[r.id] || 0]).filter(([, n]) => n > 0);
      guardado.forEach(([r, n]) => { S.cofre[r] += n; S.mochila[r] = 0; });
      S.vida = vidaMax();
      if (guardado.length) setTimeout(() => toast(`Guardaste en tu cofre: ${guardado.map(([r, n]) => `${n} ${r}`).join(', ')}.`), 600);
    }
    S.zona = zona;
    guardar(true);
    escena.scene.restart({ zona, desde });
  }

  function morir(enemigo) {
    const perdido = RECURSOS.map((r) => [r.id, S.mochila[r.id] || 0]).filter(([, n]) => n > 0);
    RECURSOS.forEach((r) => { S.mochila[r.id] = 0; });
    S.muertes = (S.muertes || 0) + 1;
    S.vida = vidaMax();
    S.zona = 'base'; S.grupo = 0;
    guardar(true);
    escena.scene.restart({ zona: 'base', desde: 'muerte' });
    setTimeout(() => toast(perdido.length ? `El ${enemigo} te venció. Perdiste: ${perdido.map(([r, n]) => `${n} ${r}`).join(', ')}.` : `El ${enemigo} te venció. Vuelves a tu base.`, 'alerta'), 700);
  }

  // ---------- Mapa y avance ----------
  async function abrirMapa() {
    const unidades = await cargarContenido();
    const bloques = unidades.map((u) => {
      const titulos = Preguntas.titulos(S.curso, u.id);
      const filas = Object.entries(titulos).map(([k, t]) => {
        const s = S.stats[k] || { a: 0, i: 0 };
        const pct = s.i ? Math.round((s.a / s.i) * 100) : 0;
        return `<div><div class="fila"><span>${esc(t)}</span><span>${s.i ? `${s.a} de ${s.i} (${pct} %)` : 'Sin intentos'}</span></div><div class="barra"><i style="width: ${pct}%"></i></div></div>`;
      }).join('');
      return `<details ${escena.zona === u.id || (escena.zona === 'base' && u.id === 'u1') ? 'open' : ''}><summary><strong>Unidad ${u.numero} · ${esc(u.titulo)}</strong> ${u.habilitada ? '' : '<span class="nota">(cerrada)</span>'}</summary><div class="avance">${filas}</div></details>`;
    }).join('');
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">${S.curso === '7basico' ? '7°' : '8°'} básico${S.seccion ? ' · ' + esc(S.seccion.slice(1)) : ''}</span><h2 id="modal-titulo">Tu avance</h2></div><button type="button" class="btn" id="m-cerrar">Cerrar</button></div>
      <div class="pildoras"><span class="pildora">Nivel ${S.nivel}</span><span class="pildora">Enemigos vencidos: ${S.vencidos || 0}</span><span class="pildora">Estás en: ${esc(nombreZona(escena.zona))}</span></div>
      <div class="unidades-avance">${bloques}</div>
      <div class="acciones"><span class="nota">${sesion.modo === 'local' ? 'Modo sin conexión: el avance se guarda solo en este navegador.' : 'Tu avance se guarda en el sistema: puedes seguir desde cualquier dispositivo.'}</span>
        <button type="button" class="btn sec" id="m-salir">${esDocente() ? 'Volver al portal docente' : 'Cerrar sesión'}</button></div>`);
    $('m-cerrar').addEventListener('click', () => ui.cerrar());
    $('m-salir').addEventListener('click', async () => {
      guardar(true); await subir();
      if (esDocente()) { location.href = 'docente.html'; return; }
      if (sesion.modo === 'nube') { try { await Nube.salir(sesion.token); } catch (e) { /* */ } }
      try { localStorage.removeItem('mathworld2:cache'); } catch (e) { /* */ }
      location.reload();
    });
  }

  function abrirCofre() {
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">Tu base</span><h2 id="modal-titulo">Cofre</h2></div><button type="button" class="btn" id="k-cerrar">Cerrar</button></div>
      <p class="nota">Aquí se guarda todo lo que traes de los mundos. Lo del cofre está a salvo aunque pierdas un combate.</p>
      <div class="objetos">${RECURSOS.map((r) => `<div class="obj"><img class="px" src="${ICONO(r.id)}" alt=""><span>${r.nombre}</span><small>${S.cofre[r.id] || 0}</small></div>`).join('')}</div>`);
    $('k-cerrar').addEventListener('click', () => ui.cerrar());
  }

  // Teclado global
  document.addEventListener('keydown', (e) => {
    if (!S || $('hud').classList.contains('oculto')) return;
    if (ui.abierto) {
      if (e.key === 'Escape' && !$('modal').classList.contains('combate') && !$('modal').classList.contains('bloqueo')) ui.cerrar();
      else if (ui.teclas) ui.teclas(e);
      return;
    }
    const k = e.key.toLowerCase();
    const enBase = escena && escena.zona === 'base';
    if (k === 'b' && enBase) abrirFabricar();
    else if (k === 'g' && enBase) abrirDecorar();
    else if (k === 'm') abrirMapa();
    else if (k === '1') equipar('hacha');
    else if (k === '2') equipar('pico');
  });
  $('btn-base').addEventListener('click', () => abrirFabricar());
  $('btn-decorar').addEventListener('click', abrirDecorar);
  $('btn-mapa').addEventListener('click', abrirMapa);
  $('capa').addEventListener('click', (e) => { if (e.target === $('capa') && !$('modal').classList.contains('combate') && !$('modal').classList.contains('bloqueo')) ui.cerrar(); });

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
  // Escena (Phaser): base o mundo según la zona
  // ===================================================================
  const TILE = 32;
  const COLS = 57;
  const fr = (c, r) => r * COLS + c;
  const DIRS = { up: 0, left: 1, down: 2, right: 3 };
  const GUARIDA = { x: 49, y: 8 };
  const PASTO = [fr(5, 0), fr(5, 1), fr(7, 0), fr(8, 0)];
  const CAMINO = fr(6, 0);

  function azar(semilla) {
    return () => {
      semilla |= 0; semilla = (semilla + 0x6d2b79f5) | 0;
      let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class Juego extends Phaser.Scene {
    constructor() { super('juego'); }
    init(data) { this.zona = (data && data.zona) || 'base'; this.desde = data && data.desde; }

    preload() {
      if (!this.textures.exists('kenney')) this.load.image('kenney', 'assets/kenney_roguelike.png');
      for (const p of PERSONAJES) for (const h of ['nada', 'hacha', 'pico']) {
        const key = `pj_${p.id}_${h}`;
        if (!this.textures.exists(key)) this.load.spritesheet(key, `assets/pj/${p.id}_${h}.png`, { frameWidth: 64, frameHeight: 64 });
      }
    }

    create() {
      escena = this;
      this.crearTexturas();
      this.crearAnimaciones();
      this.obstaculos = this.physics.add.staticGroup();
      this.objetos = [];
      this.enemigos = [];
      this.lagos = [];
      this.ocupado = new Set();
      if (this.zona === 'base') this.crearBase(); else this.crearMundo(MUNDOS[this.zona]);
      this.crearJugador();
      this.physics.world.setBounds(0, 0, this.ancho * TILE, this.alto * TILE);
      this.cameras.main.setBounds(0, 0, this.ancho * TILE, this.alto * TILE);
      this.cameras.main.startFollow(this.jugador, true, 0.15, 0.15);
      this.cameras.main.setRoundPixels(true);
      this.cameras.main.setBackgroundColor(this.zona === 'base' ? '#2f6b47' : MUNDOS[this.zona].fondo);
      this.cameras.main.fadeIn(350, 18, 32, 26);
      this.ajustarZoom();
      this.scale.on('resize', this.ajustarZoom, this);
      this.events.once('shutdown', () => this.scale.off('resize', this.ajustarZoom, this));

      this.teclas = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE');
      this.teclas.E.on('down', () => { if (!ui.abierto) this.interactuar(); });
      this.teclas.SPACE.on('down', () => { if (!ui.abierto) this.interactuar(); });
      this.dir = 'down';
      this.objetivo = null;
      this.enCombate = false;
      this.time.addEvent({ delay: 120, loop: true, callback: () => this.buscarObjetivo() });
      if (this.zona !== 'base') {
        this.time.addEvent({ delay: 40000, loop: true, callback: () => { if (S.vida < vidaMax() && !this.enCombate) { S.vida += 1; pintarHUD(); } } });
      }
      this.otros = new Map();
      this.cambios = new Map();
      this.canal = null;
      if (this.zona !== 'base' && S.grupo && coopActivo()) this.iniciarCoop();
      this.events.once('shutdown', () => { if (this.canal) { this.canal.salir(); this.canal = null; } pintarCoop(); });
      pintarHUD();
      pintarCoop();
      latir();
    }

    // ---------- texturas ----------
    tex(key, w, h, partes) {
      if (this.textures.exists(key)) return;
      const src = this.textures.get('kenney').getSourceImage();
      const t = this.textures.createCanvas(key, w * 16, h * 16);
      for (const [c, r, dx, dy] of partes) t.context.drawImage(src, c * 17, r * 17, 16, 16, dx * 16, dy * 16, 16, 16);
      t.refresh();
      return t;
    }
    pixeles(key, filas, paleta) {
      if (this.textures.exists(key)) return;
      const t = this.textures.createCanvas(key, filas[0].length, filas.length);
      filas.forEach((f, y) => [...f].forEach((ch, x) => { if (paleta[ch]) { t.context.fillStyle = paleta[ch]; t.context.fillRect(x, y, 1, 1); } }));
      t.refresh();
    }
    crearTexturas() {
      const T = (key, c, r) => this.tex(key, 1, 1, [[c, r, 0, 0]]);
      this.tex('arbol_manzano', 1, 2, [[23, 10, 0, 0], [23, 11, 0, 1]]);
      this.tex('arbol_redondo', 1, 2, [[13, 10, 0, 0], [13, 11, 0, 1]]);
      this.tex('arbol_pino', 1, 2, [[18, 10, 0, 0], [18, 11, 0, 1]]);
      this.tex('arbol_otono', 1, 2, [[14, 10, 0, 0], [14, 11, 0, 1]]);
      this.tex('cactus', 1, 1, [[22, 9, 0, 0]]);
      this.tex('carpa_b', 2, 2, [[48, 10, 0, 0], [49, 10, 1, 0], [48, 11, 0, 1], [49, 11, 1, 1]]);
      this.tex('carpa_v', 2, 2, [[46, 10, 0, 0], [47, 10, 1, 0], [46, 11, 0, 1], [47, 11, 1, 1]]);
      T('tocon', 53, 19); T('brote', 22, 11);
      T('roca3', 54, 21); T('roca2', 55, 21); T('roca1', 56, 21);
      T('roca_cafe3', 54, 19); T('roca_cafe2', 55, 19); T('roca_cafe1', 56, 19);
      T('roca_musgo3', 54, 22); T('roca_musgo2', 55, 22); T('roca_musgo1', 56, 22); T('roca_musgo', 54, 22);
      T('cofre', 37, 9); T('fogata', 14, 8); T('lena', 13, 8); T('cerco', 52, 23); T('letrero', 19, 0);
      T('arbusto', 19, 9); T('arbusto2', 24, 9); T('antorcha', 17, 8); T('barril', 23, 0);
      [28, 29, 30, 31].forEach((c, i) => T(`flor${i}`, c, 9));
      // Arbusto vivo: el mismo arbusto con ojos y boca
      if (!this.textures.exists('arbusto_vivo')) {
        const src = this.textures.get('kenney').getSourceImage();
        const t = this.textures.createCanvas('arbusto_vivo', 16, 16), c = t.context;
        c.drawImage(src, 19 * 17, 9 * 17, 16, 16, 0, 0, 16, 16);
        c.fillStyle = '#ffffff'; c.fillRect(4, 6, 3, 3); c.fillRect(9, 6, 3, 3);
        c.fillStyle = '#1b1a12'; c.fillRect(5, 7, 2, 2); c.fillRect(10, 7, 2, 2); c.fillRect(6, 11, 4, 1);
        c.fillStyle = '#b3261e'; c.fillRect(4, 5, 3, 1); c.fillRect(9, 5, 3, 1);
        t.refresh();
      }
      this.pixeles('bicho', [
        '..x......x..', '...x....x...', 'x...xxxx...x', '.x.xxxxxx.x.', '..xxrxxrxx..',
        '..xxxxxxxx..', '.x.xxxxxx.x.', 'x...xxxx...x', '...x....x...', '..x......x..',
      ], { x: '#2b1f2e', r: '#ff5a4d' });
      for (const [z, J] of Object.entries(JEFES)) this.pixeles(`jefe_${z}`, [
        '.....xxxxxxxx.....', '...xxggggggggxx...', '..xggggggggggggx..', '.xggeeggggggeeggx.', '.xggeeggggggeeggx.',
        '.xggggggggggggggx.', '.xgggmmmmmmmmgggx.', '..xggggggggggggx..', 'xxxxggggggggggxxxx', 'xggxggggggggggxggx',
        'xggxgggxxxxgggxggx', 'xggxggx....xggxggx', '.xx.xgx....xgx.xx.', '....xgx....xgx....', '...xggx....xggx...', '...xxxx....xxxx...',
      ], { x: '#1b1a12', g: J.color, e: '#ffd23f', m: '#3a1f22' });
      this.pixeles('hilo', ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'], { x: '#e8e8e8' });
      this.pixeles('niebla', [
        '......wwwwww........', '....wwwwwwwwww......', '...wwwwwwwwwwwww....', '..wwwwwwwwwwwwwwww..',
        '.wwwwkkwwwwwkkwwwww.', 'wwwwwkkwwwwwkkwwwwww', 'wwwwwwwwwwwwwwwwwwww', 'wwwwwwwkkkkkkwwwwwww',
        '.wwwwwwwwwwwwwwwwww.', '..wwww.wwwwwww.www..', '...ww....www.....w..',
      ], { w: 'rgba(225,230,240,0.92)', k: '#2a2f3a' });
      this.pixeles('portal', [
        '....pppppp....', '..pp......pp..', '.p..tttttt..p.', '.p.t......t.p.', 'p.t..cccc..t.p', 'p.t.cc..cc.t.p',
        'p.t.c....c.t.p', 'p.t.c....c.t.p', 'p.t.cc..cc.t.p', 'p.t..cccc..t.p', '.p.t......t.p.', '.p..tttttt..p.', '..pp......pp..', '....pppppp....',
      ], { p: '#8a5cf6', t: '#5cc8b8', c: '#f2e27a' });
      const g = this.add.graphics();
      [['p_madera', 0x9b6b3f], ['p_piedra', 0x9aa198], ['p_agua', 0x4fa3c7], ['p_brillo', 0xf2e27a], ['p_hoja', 0x4c9a48], ['p_morado', 0xb79ce8], ['p_rojo', 0xee7b61]].forEach(([k, col]) => {
        if (this.textures.exists(k)) return;
        g.clear(); g.fillStyle(col, 1); g.fillRect(0, 0, 4, 4); g.generateTexture(k, 4, 4);
      });
      if (!this.textures.exists('humo')) {
        const t = this.textures.createCanvas('humo', 64, 64), c = t.context;
        const grad = c.createRadialGradient(32, 32, 2, 32, 32, 32);
        grad.addColorStop(0, 'rgba(230,234,240,0.55)'); grad.addColorStop(1, 'rgba(230,234,240,0)');
        c.fillStyle = grad; c.fillRect(0, 0, 64, 64); t.refresh();
        t.setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
      g.destroy();
    }
    imagenTex(key) { return this.textures.getBase64(key); }
    retrato(clase) { return this.textures.getBase64(clase === 'arbusto' ? 'arbusto_vivo' : clase); }

    crearAnimaciones() {
      for (const p of PERSONAJES) for (const h of ['nada', 'hacha', 'pico']) {
        for (const [d, fila] of Object.entries(DIRS)) {
          const key = `pj_${p.id}_${h}_${d}`;
          if (!this.anims.exists(key)) this.anims.create({ key, frames: this.anims.generateFrameNumbers(`pj_${p.id}_${h}`, { start: fila * 9 + 1, end: fila * 9 + 8 }), frameRate: 12, repeat: -1 });
        }
      }
    }

    // ---------- utilidades de construcción ----------
    suelo(data) {
      this.terreno = data;
      const mapa = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
      const ts = mapa.addTilesetImage('kenney', 'kenney', 16, 16, 0, 1);
      mapa.createLayer(0, ts, 0, 0).setScale(2).setDepth(-10);
    }
    marcar(x, y) { this.ocupado.add(`${x},${y}`); }
    libre(x, y) {
      if (x < 2 || y < 2 || x >= this.ancho - 2 || y >= this.alto - 2) return false;
      if (this.ocupado.has(`${x},${y}`)) return false;
      return PASTO.includes(this.terreno[y][x]);
    }
    sprite(key, tx, ty, ox = 0.5) {
      const s = this.add.image(tx * TILE + TILE / 2, (ty + 1) * TILE, key).setOrigin(ox, 1).setScale(2);
      s.setDepth(s.y);
      return s;
    }
    solido(x, y, w, h) { const z = this.add.zone(x, y, w, h); this.obstaculos.add(z); return z; }
    bordes() {
      for (let y = 0; y < this.alto; y++) for (let x = 0; x < this.ancho; x++) {
        if (x < 2 || y < 2 || x >= this.ancho - 2 || y >= this.alto - 2) this.sprite(this.rnd() < 0.7 ? 'arbol_pino' : 'arbol_redondo', x, y);
      }
      const W = this.ancho * TILE, H = this.alto * TILE;
      this.solido(W / 2, TILE, W, TILE * 2); this.solido(W / 2, H - TILE, W, TILE * 2);
      this.solido(TILE, H / 2, TILE * 2, H); this.solido(W - TILE, H / 2, TILE * 2, H);
    }
    lago(data, lx, ly, w, h) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const tx = x === 0 ? 0 : x === w - 1 ? 2 : 1, ty = y === 0 ? 0 : y === h - 1 ? 2 : 1;
        data[ly + y][lx + x] = fr(2 + tx, ty);
      }
      this.obstaculos.add(this.add.zone((lx + w / 2) * TILE, (ly + h / 2) * TILE, w * TILE - 24, h * TILE - 24));
      this.lagos.push({ x: lx * TILE, y: ly * TILE, w: w * TILE, h: h * TILE });
      for (let y = ly - 1; y <= ly + h; y++) for (let x = lx - 1; x <= lx + w; x++) this.marcar(x, y);
    }
    portal(tx, ty) {
      const p = this.add.image(tx * TILE + TILE / 2, ty * TILE + TILE / 2, 'portal').setScale(3).setDepth(-4);
      this.tweens.add({ targets: p, angle: 360, duration: 9000, repeat: -1 });
      this.add.particles(p.x, p.y, 'p_morado', { speed: { min: 10, max: 40 }, lifespan: 900, frequency: 120, scale: { start: 1.2, end: 0 }, alpha: { start: 0.9, end: 0 } }).setDepth(-3);
      const l = this.sprite('letrero', tx - 1, ty);
      this.solido(l.x, l.y - 8, 20, 12);
      this.objetos.push({ tipo: 'portal', x: p.x, y: p.y, activo: true });
      for (let y = ty - 2; y <= ty + 2; y++) for (let x = tx - 2; x <= tx + 2; x++) this.marcar(x, y);
      return p;
    }

    // ---------- base personal ----------
    crearBase() {
      this.ancho = 26; this.alto = 18;
      this.rnd = azar(5);
      const data = [];
      for (let y = 0; y < this.alto; y++) {
        const fila = [];
        for (let x = 0; x < this.ancho; x++) fila.push(this.rnd() < 0.18 ? fr(5, 1) : fr(5, 0));
        data.push(fila);
      }
      for (let x = 6; x <= 20; x++) data[11][x] = CAMINO;
      for (let y = 8; y <= 11; y++) data[y][12] = CAMINO;
      this.suelo(data);
      this.bordes();
      // fogata (fabricar y descansar), cofre y portal
      this.fogata = this.sprite('fogata', 12, 7);
      this.solido(this.fogata.x, this.fogata.y - 10, 24, 14);
      this.add.particles(this.fogata.x, this.fogata.y - 22, 'p_brillo', { speedY: { min: -40, max: -20 }, speedX: { min: -8, max: 8 }, lifespan: 700, frequency: 180, scale: { start: 1, end: 0 }, alpha: { start: 0.9, end: 0 } }).setDepth(this.fogata.y + 1);
      this.objetos.push({ tipo: 'fogata', x: this.fogata.x, y: this.fogata.y - 8, activo: true });
      const cofre = this.sprite('cofre', 15, 7);
      this.solido(cofre.x, cofre.y - 10, 26, 14);
      this.objetos.push({ tipo: 'cofre_base', x: cofre.x, y: cofre.y - 8, activo: true });
      for (let y = 5; y <= 9; y++) for (let x = 10; x <= 16; x++) this.marcar(x, y);
      this.portal(21, 11);
      for (let x = 2; x < this.ancho - 2; x++) this.marcar(x, 11);
      // objetos colocados por el estudiante
      (S.colocados || []).forEach((c) => this.dibujarColocado(c));
      this.inicio = this.desde && this.desde !== 'muerte' ? { x: 20 * TILE + 16, y: 12 * TILE + 24 } : { x: 12 * TILE + 16, y: 9 * TILE + 20 };
    }
    dibujarColocado(c) {
      const o = OBJ[c.k]; if (!o) return;
      const s = this.sprite(o.tex, c.x, c.y, o.ancho === 2 ? 0.75 : 0.5);
      const z = o.solido ? this.solido(s.x - (o.ancho === 2 ? 16 : 0), s.y - o.solido[1] / 2 - 2, o.solido[0], o.solido[1]) : null;
      this.objetos.push({ tipo: 'colocado', c, s, z, x: s.x - (o.ancho === 2 ? 16 : 0), y: s.y - 10, activo: true, nombre: o.nombre });
      this.marcar(c.x, c.y); if (o.ancho === 2) this.marcar(c.x - 1, c.y);
    }
    colocar(id) {
      const o = OBJ[id];
      const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[this.dir];
      const tx = Math.floor(this.jugador.x / TILE) + v[0], ty = Math.floor((this.jugador.y - 4) / TILE) + v[1];
      const libre = (x, y) => x >= 2 && y >= 2 && x < this.ancho - 2 && y < this.alto - 2 && !this.ocupado.has(`${x},${y}`);
      if (!libre(tx, ty) || (o.ancho === 2 && !libre(tx - 1, ty)) || (OBJ[id].tex.startsWith('arbol') && !libre(tx, ty - 1))) {
        toast('No hay espacio libre justo delante. Muévete a un lugar despejado.', 'alerta');
        return false;
      }
      const c = { k: id, x: tx, y: ty };
      S.colocados.push(c);
      this.dibujarColocado(c);
      this.celebrar(this.jugador.x + v[0] * 30, this.jugador.y + v[1] * 30);
      return true;
    }
    quitar(obj) {
      S.colocados = S.colocados.filter((c) => c !== obj.c);
      S.inventario[obj.c.k] = (S.inventario[obj.c.k] || 0) + 1;
      obj.s.destroy(); if (obj.z) obj.z.destroy();
      obj.activo = false;
      this.ocupado.delete(`${obj.c.x},${obj.c.y}`);
      if (OBJ[obj.c.k].ancho === 2) this.ocupado.delete(`${obj.c.x - 1},${obj.c.y}`);
      guardar(true);
      toast(`Guardaste: ${obj.nombre}.`);
    }

    // ---------- mundos ----------
    crearMundo(M) {
      this.ancho = 56; this.alto = 40;
      this.rnd = azar(M.semilla + (S.curso === '8basico' ? 100 : 0));
      // suelo: el primero es la base y los demás se pintan en manchas redondeadas
      const data = [];
      const [c0, r0] = M.suelo[0];
      for (let y = 0; y < this.alto; y++) { const fila = []; for (let x = 0; x < this.ancho; x++) fila.push(fr(c0, r0)); data.push(fila); }
      for (const [c, r, p] of M.suelo.slice(1)) {
        let pintado = 0;
        const meta = p * this.ancho * this.alto;
        while (pintado < meta) {
          const cx = Math.floor(this.rnd() * this.ancho), cy = Math.floor(this.rnd() * this.alto), rad = 2 + this.rnd() * 4;
          for (let y = Math.floor(cy - rad); y <= cy + rad; y++) for (let x = Math.floor(cx - rad); x <= cx + rad; x++) {
            if (y < 0 || x < 0 || y >= this.alto || x >= this.ancho) continue;
            if (Math.hypot(x - cx, y - cy) <= rad + (this.rnd() - 0.5)) { if (data[y][x] !== fr(c, r)) pintado++; data[y][x] = fr(c, r); }
          }
        }
      }
      const P = { x: 6, y: 20 };
      for (let x = 4; x < this.ancho - 3; x++) data[P.y + 2][x] = CAMINO;
      for (let y = 3; y < this.alto - 3; y++) data[y][28] = CAMINO;
      this.terreno = data;
      for (let y = 0; y < this.alto; y++) for (let x = 0; x < this.ancho; x++) if (data[y][x] === CAMINO) { this.marcar(x, y); this.marcar(x, y + 1); }
      for (let y = P.y - 3; y <= P.y + 4; y++) for (let x = P.x - 3; x <= P.x + 5; x++) this.marcar(x, y);
      for (let y = GUARIDA.y - 4; y <= GUARIDA.y + 4; y++) for (let x = GUARIDA.x - 4; x <= GUARIDA.x + 4; x++) this.marcar(x, y);
      for (let i = 0; i < M.lagos; i++) {
        const w = 5 + Math.floor(this.rnd() * 5), h = 4 + Math.floor(this.rnd() * 3);
        for (let t = 0; t < 60; t++) {
          const lx = 4 + Math.floor(this.rnd() * (this.ancho - w - 8)), ly = 4 + Math.floor(this.rnd() * (this.alto - h - 8));
          let ok = true;
          for (let y = ly - 1; y <= ly + h && ok; y++) for (let x = lx - 1; x <= lx + w && ok; x++) if (this.ocupado.has(`${x},${y}`)) ok = false;
          if (ok) { this.lago(data, lx, ly, w, h); break; }
        }
      }
      this.suelo(data);
      if (M.tinte) this.add.rectangle(0, 0, this.ancho * TILE, this.alto * TILE, M.tinte[0], M.tinte[1]).setOrigin(0).setDepth(-9);
      this.bordes();
      this.portal(P.x, P.y);
      this.crearGuarida();
      this.inicio = { x: (P.x + 1) * TILE + 16, y: (P.y + 2) * TILE + 20 };

      const lugar = (alto = 2) => {
        for (let i = 0; i < 400; i++) {
          const x = 2 + Math.floor(this.rnd() * (this.ancho - 4)), y = 3 + Math.floor(this.rnd() * (this.alto - 5));
          if (this.libre(x, y) && (alto < 2 || this.libre(x, y - 1))) return [x, y];
        }
        return null;
      };
      const reservar = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) this.marcar(x + dx, y + dy); };
      const nombres = { arbol_manzano: 'manzano', arbol_redondo: 'roble', arbol_pino: 'pino', arbol_otono: 'arce', cactus: 'cactus' };
      for (let i = 0; i < M.nArboles; i++) {
        const key = M.arboles[Math.floor(this.rnd() * M.arboles.length)];
        const p = lugar(key === 'cactus' ? 1 : 2); if (!p) break;
        const s = this.sprite(key, p[0], p[1]);
        const z = this.solido(s.x, s.y - 10, 18, 12);
        reservar(p[0], p[1]);
        this.objetos.push({ tipo: 'arbol', key, nombre: nombres[key], s, z, x: s.x, y: s.y - 6, estado: 'arbol', activo: true, bicho: key !== 'cactus' && this.rnd() < M.bichos });
      }
      for (let i = 0; i < M.nRocas; i++) {
        const p = lugar(1); if (!p) break;
        const base = M.rocas[Math.floor(this.rnd() * M.rocas.length)].replace(/3$/, '');
        const s = this.sprite(base + '3', p[0], p[1]);
        const z = this.solido(s.x, s.y - 10, 26, 16);
        reservar(p[0], p[1]);
        this.objetos.push({ tipo: 'roca', base, s, z, x: s.x, y: s.y - 6, nivel: 3, activo: true });
      }
      for (let i = 0; i < M.cofres; i++) {
        const p = lugar(1); if (!p) break;
        const s = this.sprite('cofre', p[0], p[1]);
        const z = this.solido(s.x, s.y - 10, 26, 14);
        reservar(p[0], p[1]);
        this.objetos.push({ tipo: 'cofre', s, z, x: s.x, y: s.y - 6, activo: true });
      }
      for (let i = 0; i < 60; i++) {
        const p = lugar(1); if (!p) break;
        const deco = this.rnd() < 0.7 ? `flor${Math.floor(this.rnd() * 4)}` : 'arbusto2';
        this.sprite(deco, p[0], p[1]).setDepth(deco.startsWith('flor') ? -5 : (p[1] + 1) * TILE);
        this.marcar(p[0], p[1]);
      }
      this.objetos.forEach((o, i) => { o.idx = i; });
      // Enemigos: arbustos vivos escondidos y nieblas
      for (let i = 0; i < M.arbustos; i++) {
        const p = lugar(1); if (!p) break;
        if (Math.abs(p[0] - P.x) < 8 && Math.abs(p[1] - P.y) < 8) continue;
        const s = this.sprite('arbusto', p[0], p[1]);
        this.marcar(p[0], p[1]);
        this.enemigos.push(this.nuevoEnemigo('arbusto', s, { despierto: false }));
      }
      for (let i = 0; i < M.nieblas; i++) {
        const p = lugar(1); if (!p) break;
        if (Math.abs(p[0] - P.x) < 10 && Math.abs(p[1] - P.y) < 10) continue;
        const s = this.add.image(p[0] * TILE + 16, p[1] * TILE + 16, 'niebla').setScale(2).setAlpha(0.85);
        this.add.particles(s.x, s.y, 'humo', { x: { min: -90, max: 90 }, y: { min: -60, max: 60 }, lifespan: 4000, frequency: 450, scale: { start: 1.2, end: 2.2 }, alpha: { start: 0.5, end: 0 }, speed: 6 }).setDepth(9000);
        this.tweens.add({ targets: s, y: s.y - 6, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        this.enemigos.push(this.nuevoEnemigo('niebla', s, { despierto: true }));
      }
    }
    crearGuarida() {
      const J = JEFES[this.zona], gx = GUARIDA.x, gy = GUARIDA.y;
      const anillo = [[-3, -1], [-2, -3], [0, -3], [2, -3], [3, -1], [3, 2], [-3, 2]];
      for (const [dx, dy] of anillo) { const r = this.sprite('roca_musgo3', gx + dx, gy + dy); this.solido(r.x, r.y - 10, 26, 16); }
      const cx = gx * TILE + 16, cy = gy * TILE + 30;
      this.add.particles(cx, cy - 20, 'p_morado', { x: { min: -60, max: 60 }, speedY: { min: -30, max: -10 }, lifespan: 1600, frequency: 160, scale: { start: 1.2, end: 0 }, alpha: { start: 0.7, end: 0 } }).setDepth(cy - 1);
      this.jefeSpr = this.add.image(cx, cy, `jefe_${this.zona}`).setOrigin(0.5, 1).setScale(4).setDepth(cy);
      this.tweens.add({ targets: this.jefeSpr, scaleY: 4.15, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.solido(cx, cy - 18, 60, 30);
      this.jefeTag = this.add.text(cx, cy - 104, J.nombre, { fontFamily: 'Fredoka, Nunito, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#ffd27a', stroke: '#12201a', strokeThickness: 4 }).setOrigin(0.5).setResolution(3).setDepth(cy + 1);
      this.guarida = { x: cx, y: cy - 20 };
      this.objetos.push({ tipo: 'jefe', x: cx, y: cy + 4, activo: true });
    }
    nuevoEnemigo(clase, s, extra = {}) {
      const E = ENEMIGOS[clase];
      return { clase, s, vida: E.vida, vidaMax: E.vida, origen: { x: s.x, y: s.y }, activo: true, aturdido: 0, ...extra };
    }

    // ---------- jugador ----------
    crearJugador() {
      this.jugador = this.physics.add.sprite(this.inicio.x, this.inicio.y, `pj_${S.pj}_${S.herramienta === 'pico' && tiene('pico') ? 'pico' : 'hacha'}`, DIRS.down * 9);
      this.jugador.setOrigin(0.5, 0.9);
      this.jugador.body.setSize(18, 10).setOffset(23, 50);
      this.jugador.setCollideWorldBounds(true);
      this.physics.add.collider(this.jugador, this.obstaculos);
    }
    ponerHerramienta(h) {
      const key = `pj_${S.pj}_${h === 'pico' ? 'pico' : 'hacha'}`;
      if (!this.jugador || this.jugador.texture.key === key) return;
      const anim = this.jugador.anims.isPlaying;
      this.jugador.setTexture(key, DIRS[this.dir] * 9);
      if (anim) this.jugador.anims.play(`${key}_${this.dir}`, true);
    }
    ajustarZoom() {
      const { width, height } = this.scale;
      this.cameras.main.setZoom(Math.max(1, Math.min(3, Math.floor(Math.min(width / 560, height / 315) * 2) / 2)));
    }

    update(t, dt) {
      const j = this.jugador;
      if (!j) return;
      let vx = 0, vy = 0;
      if (!ui.abierto) {
        const k = this.teclas;
        if (k.A.isDown || k.LEFT.isDown) vx -= 1;
        if (k.D.isDown || k.RIGHT.isDown) vx += 1;
        if (k.W.isDown || k.UP.isDown) vy -= 1;
        if (k.S.isDown || k.DOWN.isDown) vy += 1;
        if (palanca.x || palanca.y) { vx = palanca.x; vy = palanca.y; }
      }
      const len = Math.hypot(vx, vy);
      if (len > 0.15) {
        j.setVelocity((vx / Math.max(len, 1)) * 150, (vy / Math.max(len, 1)) * 150);
        this.dir = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'left' : 'right') : (vy < 0 ? 'up' : 'down');
        j.anims.play(`${j.texture.key}_${this.dir}`, true);
      } else { j.setVelocity(0, 0); j.anims.stop(); j.setFrame(DIRS[this.dir] * 9); }
      j.setDepth(j.y);
      if (!ui.abierto && !this.enCombate) this.moverEnemigos(dt / 1000);
      if (this.canal) { this.enviarMovimiento(len > 0.15); this.moverOtros(dt / 1000); this.revisarGuarida(); }
    }

    // ---------- enemigos ----------
    moverEnemigos(seg) {
      const j = this.jugador, ahora = this.time.now;
      for (const e of this.enemigos) {
        if (!e.activo || e.cayendo) continue;
        const d = Phaser.Math.Distance.Between(j.x, j.y - 16, e.s.x, e.s.y - 10);
        if (e.aturdido > ahora) continue;
        const E = ENEMIGOS[e.clase];
        if (e.clase === 'arbusto' && !e.despierto) {
          if (d < 80) { e.despierto = true; e.s.setTexture('arbusto_vivo'); this.tweens.add({ targets: e.s, scaleX: 2.3, scaleY: 1.8, duration: 120, yoyo: true }); this.flotante(e.s.x, e.s.y - 40, '¡Grrr!', '#ffb4a3'); }
          continue;
        }
        const persigue = d < (e.clase === 'niebla' ? 150 : 240);
        const destino = persigue ? { x: j.x, y: j.y - 8 } : e.origen;
        const dx = destino.x - e.s.x, dy = destino.y - e.s.y, l = Math.hypot(dx, dy);
        if (l > 4) { e.s.x += (dx / l) * E.vel * seg; e.s.y += (dy / l) * E.vel * seg; }
        if (e.clase !== 'niebla') e.s.setDepth(e.s.y);
        if (!persigue && e.clase === 'arbusto' && l < 6) { e.despierto = false; e.s.setTexture('arbusto'); }
        if (persigue && d < 30) this.empezarCombate(e);
      }
      // arañas que caen de los árboles
      for (const o of this.objetos) {
        if (o.tipo !== 'arbol' || !o.bicho || o.estado !== 'arbol') continue;
        if (Phaser.Math.Distance.Between(j.x, j.y, o.x, o.y) < 56) { o.bicho = false; this.soltarBicho(o); }
      }
    }
    soltarBicho(arbol) {
      const s = this.add.image(arbol.x, arbol.y - 70, 'bicho').setScale(2).setDepth(arbol.y + 60);
      const hilo = this.add.image(arbol.x, arbol.y - 76, 'hilo').setOrigin(0.5, 0).setScale(1, 1).setDepth(arbol.y + 59);
      const e = this.nuevoEnemigo('bicho', s, { cayendo: true });
      this.enemigos.push(e);
      this.flotante(arbol.x, arbol.y - 90, '¡Cuidado!', '#ffb4a3');
      this.tweens.add({ targets: s, y: arbol.y + 4, duration: 650, ease: 'Bounce.out', onUpdate: () => { hilo.setScale(1, Math.max(1, (s.y - hilo.y) / 8 * 2)); },
        onComplete: () => { hilo.destroy(); e.cayendo = false; e.origen = { x: s.x, y: s.y }; } });
      this.time.delayedCall(120000, () => { arbol.bicho = true; });
    }
    empezarCombate(e) {
      if (this.enCombate || this.enJefe) return;
      this.enCombate = true;
      this.jugador.setVelocity(0, 0);
      this.cameras.main.shake(150, 0.004);
      abrirCombate(e, (resultado) => {
        this.enCombate = false;
        const E = ENEMIGOS[e.clase];
        if (resultado === 'victoria') {
          e.activo = false;
          Object.entries(E.botin).forEach(([r, n], i) => { sumar(r, n); this.time.delayedCall(i * 300, () => this.flotante(e.s.x, e.s.y - 40 - i * 18, `+${n} ${r}`)); });
          S.vencidos = (S.vencidos || 0) + 1;
          ganarXP(E.xp);
          this.add.particles(e.s.x, e.s.y - 10, 'p_morado', { speed: { min: 60, max: 160 }, lifespan: 700, scale: { start: 1.5, end: 0 }, emitting: false }).setDepth(99999).explode(24);
          this.tweens.add({ targets: e.s, alpha: 0, scale: 0.5, duration: 400, onComplete: () => e.s.setVisible(false) });
          if (e.clase !== 'bicho') this.time.delayedCall(150000, () => { e.s.setPosition(e.origen.x, e.origen.y).setAlpha(e.clase === 'niebla' ? 0.85 : 1).setScale(2).setVisible(true); if (e.clase === 'arbusto') { e.despierto = false; e.s.setTexture('arbusto'); } e.vida = e.vidaMax; e.activo = true; });
          guardar(true);
        } else if (resultado === 'huir') {
          e.aturdido = this.time.now + 4000;
          const ang = Phaser.Math.Angle.Between(e.s.x, e.s.y, this.jugador.x, this.jugador.y);
          this.jugador.x += Math.cos(ang) * 40; this.jugador.y += Math.sin(ang) * 40;
        } else if (resultado === 'derrota') {
          morir(E.nombre.toLowerCase());
        }
      });
    }
    golpeEnemigo(e, n) {
      this.flotante(e.s.x, e.s.y - 36, `−${n}`, '#ffd27a');
      this.tweens.add({ targets: e.s, x: e.s.x + 4, duration: 50, yoyo: true, repeat: 2 });
    }
    dolor() {
      this.cameras.main.shake(180, 0.006);
      this.cameras.main.flash(160, 180, 40, 30);
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
        const lim = o.tipo === 'jefe' ? 80 : ['fogata', 'portal', 'cofre_base'].includes(o.tipo) ? 50 : 36;
        if (d < lim && d - lim < puntaje) { mejor = o; puntaje = d - lim; }
      }
      if (!mejor) {
        for (const L of this.lagos) {
          if (px > L.x - 14 && px < L.x + L.w + 14 && py > L.y - 14 && py < L.y + L.h + 14) { mejor = { tipo: 'agua', x: px, y: py }; break; }
        }
      }
      this.objetivo = mejor;
      const txt = mejor ? this.textoAccion(mejor) : null;
      const aviso = $('aviso');
      if (txt && !ui.abierto) { $('aviso-txt').textContent = txt; aviso.classList.remove('oculto'); } else aviso.classList.add('oculto');
      $('btn-accion').textContent = txt ? txt.split(' ')[0] : 'Acción';
    }
    textoAccion(o) {
      switch (o.tipo) {
        case 'arbol': return o.estado === 'arbol' ? `Talar ${o.nombre}` : o.estado === 'tocon' ? 'Tocón: volverá a crecer' : 'Brote: está creciendo';
        case 'roca': return tiene('pico') ? 'Picar roca' : 'Roca: necesitas un pico';
        case 'agua': return tiene('balde') ? 'Sacar agua' : 'Lago: necesitas un balde';
        case 'cofre': return 'Abrir cofre';
        case 'fogata': return 'Fabricar y descansar';
        case 'cofre_base': return 'Ver tu cofre';
        case 'portal': return 'Usar el portal';
        case 'jefe': return this.textoJefe();
        case 'colocado': return `Guardar ${o.nombre.toLowerCase()}`;
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
      if (o.tipo === 'fogata') { if (S.vida < vidaMax()) { S.vida = vidaMax(); pintarHUD(); toast('Descansaste junto al fuego: recuperaste tu vida.'); } return abrirFabricar(); }
      if (o.tipo === 'cofre_base') return abrirCofre();
      if (o.tipo === 'portal') return abrirPortal();
      if (o.tipo === 'jefe') return this.pedirJefe();
      if (o.tipo === 'colocado') return this.quitar(o);
      if (o.tipo === 'arbol') {
        if (o.estado !== 'arbol') return toast('Este árbol todavía está creciendo.');
        equipar('hacha');
        const dif = difPara(1), cant = 2 + (tiene('hacha2') ? 2 : 0) + dif - 1;
        return abrirDesafio({ accion: `Talar ${o.nombre}`, dif, premio: `Premio: ${cant} madera`, onOk: () => this.golpe(o, 'madera', cant) });
      }
      if (o.tipo === 'roca') {
        if (!tiene('pico')) return toast('Necesitas un pico. Fabrícalo en la fogata de tu base.');
        equipar('pico');
        const cant = 2 + (tiene('pico2') ? 2 : 0);
        return abrirDesafio({ accion: 'Picar roca', dif: difPara(2), premio: `Premio: ${cant} piedra + posible cristal`, onOk: () => this.golpe(o, 'piedra', cant) });
      }
      if (o.tipo === 'agua') {
        if (!tiene('balde')) return toast('Necesitas un balde. Fabrícalo en la fogata de tu base.');
        return abrirDesafio({ accion: 'Sacar agua del lago', dif: difPara(1), premio: 'Premio: 2 agua', onOk: () => this.golpe(o, 'agua', 2) });
      }
      if (o.tipo === 'cofre') {
        return abrirDesafio({ accion: 'Abrir cofre', dif: 3, premio: 'Premio: 2 cristal + 4 madera', onOk: () => { this.golpe(o, 'cristal', 2); sumar('madera', 4); } });
      }
    }

    golpe(o, recurso, cant) {
      this.mirarA(o);
      const j = this.jugador;
      this.tweens.add({ targets: j, y: j.y - 3, duration: 80, yoyo: true, repeat: 1 });
      const px = { madera: 'p_madera', piedra: 'p_piedra', agua: 'p_agua', cristal: 'p_brillo' }[recurso];
      this.add.particles(o.x, o.y - 14, px, { speed: { min: 60, max: 150 }, angle: { min: 200, max: 340 }, gravityY: 320, lifespan: 600, scale: { start: 1.4, end: 0.4 }, emitting: false }).setDepth(o.y + 50).explode(16);
      if (o.s) this.tweens.add({ targets: o.s, x: o.s.x + 3, duration: 50, yoyo: true, repeat: 3 });
      sumar(recurso, cant);
      this.flotante(o.x, o.y - 40, `+${cant} ${recurso}`);
      if (o.tipo === 'roca' && this.rnd() < (tiene('pico2') ? 0.35 : 0.15)) {
        sumar('cristal', 1);
        this.time.delayedCall(350, () => this.flotante(o.x, o.y - 58, '+1 cristal', '#9ff0e4'));
      }
      if (o.tipo === 'arbol' || o.tipo === 'roca' || o.tipo === 'cofre') {
        const n = o.tipo === 'roca' ? Math.max(0, o.nivel - 1) : o.tipo === 'arbol' ? 'tocon' : 'abierto';
        if (o.tipo === 'arbol') this.time.delayedCall(250, () => this.add.particles(o.x, o.y - 30, 'p_hoja', { speed: { min: 40, max: 110 }, lifespan: 700, gravityY: 200, emitting: false }).setDepth(o.y + 50).explode(14));
        this.aplicarNodo(o, n, 0);
        this.compartirNodo(o, n);
      }
      guardar();
    }
    // Estado de árboles, rocas y cofres; "edad" = ms desde que ocurrió (para compañeros que llegan tarde)
    aplicarNodo(o, n, edad = 0) {
      (o.timers || []).forEach((t) => t.remove(false));
      o.timers = [];
      const espera = (ms, f) => { if (ms > 0) o.timers.push(this.time.delayedCall(ms, f)); else f(); };
      if (o.tipo === 'arbol') {
        const aBrote = 45000 - edad, aArbol = 90000 - edad;
        if (aArbol <= 0) { o.estado = 'arbol'; o.s.setTexture(o.key); return; }
        o.estado = aBrote > 0 ? 'tocon' : 'brote';
        o.s.setTexture(o.estado);
        if (aBrote > 0) espera(aBrote, () => { o.estado = 'brote'; o.s.setTexture('brote'); });
        espera(aArbol, () => { o.estado = 'arbol'; o.s.setTexture(o.key); });
      } else if (o.tipo === 'roca') {
        const volver = () => { o.nivel = 3; o.s.setTexture(`${o.base}3`).setVisible(true); o.z.body.enable = true; o.activo = true; };
        o.nivel = n;
        if (n > 0) { o.s.setTexture(`${o.base}${n}`).setVisible(true); o.z.body.enable = true; o.activo = true; }
        else if (90000 - edad <= 0) volver();
        else { o.activo = false; o.s.setVisible(false); o.z.body.enable = false; espera(90000 - edad, volver); }
      } else if (o.tipo === 'cofre') {
        const volver = () => { o.s.setAlpha(1).setVisible(true); o.z.body.enable = true; o.activo = true; };
        if (150000 - edad <= 0) { volver(); return; }
        o.activo = false; o.z.body.enable = false;
        this.tweens.add({ targets: o.s, alpha: 0, duration: 500, onComplete: () => { if (!o.activo) o.s.setVisible(false); } });
        espera(150000 - edad, volver);
      }
    }
    // ---------- modo cooperativo ----------
    iniciarCoop() {
      const meta = { id: idJuego, nombre: S.docente ? 'Profe' : `${S.nombre}${S.seccion ? ' · ' + S.seccion : ''}`, pj: S.pj, docente: Boolean(S.docente) };
      this.jefe = { estado: 'libre', hp: 0, max: 0, part: [], lider: null, hasta: 0 };
      this.enGuarida = new Set(); this.yoEnGuarida = false; this.enJefe = false;
      this.ultimoMov = { t: 0, x: 0, y: 0, m: false };
      this.primeraPresencia = true;
      const c = new Coop.Canal(`mw-${nivelNum()}-${this.zona}-g${S.grupo}`, idJuego, meta);
      this.canal = c;
      c.alEstado = (e) => {
        if (e === 'ok') { c.emitir('hola', { id: idJuego }); this.ultimoMov.t = 0; if (this.yoEnGuarida) c.emitir('guarida', { id: idJuego, dentro: true }); }
        if (e === 'error') toast('No se pudo conectar con tu grupo: por ahora juegas solo.', 'alerta');
        pintarCoop();
      };
      c.alCambiarPresencia = (p) => this.sincronizarPresencia(p);
      c.on('mov', (d) => this.recibirMov(d));
      c.on('nodo', (d) => { const o = this.objetos[d.i]; if (o && o.idx === d.i) { this.cambios.set(d.i, { n: d.n, t: Date.now() }); this.aplicarNodo(o, d.n, 0); } });
      c.on('hola', (d) => {
        this.ultimoMov.t = 0;
        if (this.yoEnGuarida) c.emitir('guarida', { id: idJuego, dentro: true });
        const otros = Object.keys(c.presencia).filter((k) => k !== d.id).concat(idJuego).sort();
        if (otros[0] !== idJuego) return;
        c.emitir('estado', { para: d.id, nodos: [...this.cambios].map(([i, v]) => [i, v.n, Date.now() - v.t]).filter((x) => x[2] < 150000), jefe: this.jefeParaEnviar() });
      });
      c.on('estado', (d) => {
        if (d.para !== idJuego) return;
        (d.nodos || []).forEach(([i, n, e]) => { const o = this.objetos[i]; if (o && o.idx === i) { this.cambios.set(i, { n, t: Date.now() - e }); this.aplicarNodo(o, n, e); } });
        if (d.jefe) this.recibirJefe(d.jefe);
      });
      c.on('guarida', (d) => { if (d.dentro) this.enGuarida.add(d.id); else this.enGuarida.delete(d.id); });
      c.on('jefe', (d) => this.recibirJefe(d));
      c.on('jefe_pedir', () => this.iniciarJefeSiLider());
      c.on('golpe', (d) => this.golpeAlJefe(d.dmg));
      c.on('caido', (d) => this.sacarDelJefe(d.id));
    }
    sincronizarPresencia(p) {
      const ids = new Set(Object.keys(p));
      if (this.primeraPresencia) {
        this.primeraPresencia = false;
        const otrosEst = Object.entries(p).filter(([id, m]) => id !== idJuego && !m.docente).length;
        if (otrosEst >= MAX_GRUPO && !S.docente) {
          toast(`El grupo ${S.grupo} ya tiene ${MAX_GRUPO} jugadores: exploras solo. Usa el portal para elegir otro grupo.`, 'alerta');
          this.canal.salir(); this.canal = null; S.grupo = 0; pintarCoop(); guardar(true);
          return;
        }
      }
      for (const [id, meta] of Object.entries(p)) if (id !== idJuego && !this.otros.has(id)) this.crearOtro(id, meta);
      for (const id of [...this.otros.keys()]) if (!ids.has(id)) this.quitarOtro(id);
      for (const id of [...this.enGuarida]) if (!ids.has(id)) this.enGuarida.delete(id);
      const J = this.jefe;
      if (J && J.estado === 'combate') {
        const antes = J.lider;
        J.part = J.part.filter((x) => ids.has(x) || x === idJuego);
        if (!J.part.includes(J.lider)) J.lider = [...J.part].sort()[0] || null;
        if (J.lider === idJuego && antes !== idJuego) { if (!J.part.length) J.estado = 'libre'; this.publicarJefe(); }
      }
      pintarCoop();
    }
    crearOtro(id, meta) {
      const pj = PERSONAJES.some((x) => x.id === meta.pj) ? meta.pj : 'zorro';
      const spr = this.add.sprite(this.inicio.x, this.inicio.y, `pj_${pj}_hacha`, DIRS.down * 9).setOrigin(0.5, 0.9).setAlpha(0);
      const tag = this.add.text(spr.x, spr.y - 60, String(meta.nombre || 'Compañero').slice(0, 28), {
        fontFamily: 'Nunito, sans-serif', fontSize: '11px', fontStyle: 'bold', color: meta.docente ? '#ffd27a' : '#ffffff', backgroundColor: 'rgba(18,32,26,0.8)', padding: { x: 4, y: 1 },
      }).setOrigin(0.5).setResolution(3).setDepth(99990).setAlpha(0);
      this.otros.set(id, { spr, tag, meta, pj, obj: { x: spr.x, y: spr.y }, dir: 'down', h: 'hacha', m: false, visto: false });
    }
    quitarOtro(id) {
      const o = this.otros.get(id); if (!o) return;
      o.spr.destroy(); o.tag.destroy(); this.otros.delete(id);
    }
    recibirMov(d) {
      const o = this.otros.get(d.id); if (!o) return;
      const h = d.h === 'pico' ? 'pico' : 'hacha';
      if (h !== o.h) { o.h = h; o.spr.setTexture(`pj_${o.pj}_${h}`, DIRS[o.dir] * 9); }
      o.obj = { x: Number(d.x) || 0, y: Number(d.y) || 0 }; o.dir = DIRS[d.d] !== undefined ? d.d : 'down'; o.m = Boolean(d.m);
      if (!o.visto || Phaser.Math.Distance.Between(o.spr.x, o.spr.y, o.obj.x, o.obj.y) > 400) { o.spr.setPosition(o.obj.x, o.obj.y); o.visto = true; o.spr.setAlpha(1); o.tag.setAlpha(1); }
    }
    moverOtros(seg) {
      for (const o of this.otros.values()) {
        if (!o.visto) continue;
        const dx = o.obj.x - o.spr.x, dy = o.obj.y - o.spr.y, dist = Math.hypot(dx, dy);
        if (dist > 2) {
          const paso = Math.min(dist, 170 * seg);
          o.spr.x += (dx / dist) * paso; o.spr.y += (dy / dist) * paso;
          const dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
          o.spr.anims.play(`pj_${o.pj}_${o.h}_${dir}`, true);
        } else if (!o.m) { o.spr.anims.stop(); o.spr.setFrame(DIRS[o.dir] * 9); }
        o.spr.setDepth(o.spr.y);
        o.tag.setPosition(o.spr.x, o.spr.y - 62);
      }
    }
    enviarMovimiento(moviendo) {
      const c = this.canal; if (!c || c.est !== 'ok') return;
      const u = this.ultimoMov, j = this.jugador, ahora = this.time.now;
      const n = 1 + this.otros.size;
      const intervalo = Math.max(400, Math.min(2000, (1000 * n * n * 0.5) / 12));
      if (u.t && ahora - u.t < intervalo) return;
      const dist = Math.hypot(j.x - u.x, j.y - u.y);
      if (u.t && !moviendo && !u.m && dist < 2) return;
      if (u.t && moviendo && dist < 4) return;
      u.t = ahora; u.x = j.x; u.y = j.y; u.m = moviendo;
      c.emitir('mov', { id: idJuego, x: Math.round(j.x), y: Math.round(j.y), d: this.dir, h: j.texture.key.endsWith('pico') ? 'pico' : 'hacha', m: moviendo });
    }
    compartirNodo(o, n) {
      if (!this.canal || o.idx === undefined) return;
      this.cambios.set(o.idx, { n, t: Date.now() });
      this.canal.emitir('nodo', { i: o.idx, n });
    }

    // ---------- jefe final cooperativo ----------
    revisarGuarida() {
      if (!this.guarida || !this.canal) return;
      const dentro = Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y, this.guarida.x, this.guarida.y) < 170;
      if (dentro !== this.yoEnGuarida) { this.yoEnGuarida = dentro; this.canal.emitir('guarida', { id: idJuego, dentro }); }
    }
    jugadoresEnGuarida() {
      const ids = [...this.enGuarida].filter((id) => this.otros.has(id));
      if (this.yoEnGuarida) ids.push(idJuego);
      return ids;
    }
    jefeDisponible() { const J = this.jefe; return J && (J.estado === 'libre' || (J.estado === 'vencido' && J.hasta <= Date.now())); }
    textoJefe() {
      if (!this.canal) return 'Jefe final: viaja con un grupo';
      const J = this.jefe;
      if (J.estado === 'combate') return J.part.includes(idJuego) ? 'Volver al combate' : 'Tu grupo está luchando';
      if (!this.jefeDisponible()) return `Jefe derrotado: vuelve en ${Math.ceil((J.hasta - Date.now()) / 60000)} min`;
      const n = this.jugadoresEnGuarida().length;
      return n >= JEFE_MIN ? `¡Desafiar al jefe! (${n} jugadores)` : `Jefe final: ${n} de ${JEFE_MIN} jugadores`;
    }
    pedirJefe() {
      if (!this.canal) return abrirInfoJefe(this.zona);
      const J = this.jefe;
      if (J.estado === 'combate') { if (J.part.includes(idJuego) && !this.enJefe) { this.enJefe = true; abrirJefe(); } return; }
      if (!this.jefeDisponible()) return toast('El jefe se está recuperando. Vuelve en unos minutos.');
      const n = this.jugadoresEnGuarida().length;
      if (n < JEFE_MIN) return toast(`Faltan ${JEFE_MIN - n} ${JEFE_MIN - n === 1 ? 'compañero' : 'compañeros'} en la guarida para desafiar al jefe.`);
      this.canal.emitir('jefe_pedir', { id: idJuego });
      this.iniciarJefeSiLider();
    }
    iniciarJefeSiLider() {
      if (!this.jefeDisponible()) return;
      const part = this.jugadoresEnGuarida().sort();
      if (part.length < JEFE_MIN || part[0] !== idJuego) return;
      const max = JEFE_VIDA_POR_JUGADOR * part.length;
      this.jefe = { estado: 'combate', hp: max, max, part, lider: idJuego, hasta: 0 };
      this.publicarJefe();
    }
    jefeParaEnviar() { const J = this.jefe; return { estado: J.estado, hp: J.hp, max: J.max, part: J.part, lider: J.lider, resta: Math.max(0, J.hasta - Date.now()) }; }
    publicarJefe() { if (this.canal) this.canal.emitir('jefe', this.jefeParaEnviar()); this.alCambiarJefe(); }
    recibirJefe(d) {
      this.jefe = { estado: d.estado, hp: d.hp, max: d.max, part: d.part || [], lider: d.lider, hasta: Date.now() + (d.resta || 0) };
      this.alCambiarJefe();
    }
    alCambiarJefe() {
      const J = this.jefe;
      if (J.estado === 'combate' && J.part.includes(idJuego) && !this.enJefe) { this.enJefe = true; abrirJefe(); }
      if (this.jefeSpr) this.jefeSpr.setTint(J.estado === 'vencido' && J.hasta > Date.now() ? 0x666666 : 0xffffff);
      actualizarJefeUI();
    }
    golpeLocal(dmg) {
      if (this.jefe.lider === idJuego) this.golpeAlJefe(dmg);
      else { this.canal.emitir('golpe', { id: idJuego, dmg }); this.jefe.hp = Math.max(0, this.jefe.hp - dmg); actualizarJefeUI(); }
      if (this.jefeSpr) { this.tweens.add({ targets: this.jefeSpr, x: this.jefeSpr.x + 5, duration: 50, yoyo: true, repeat: 2 }); this.flotante(this.jefeSpr.x, this.jefeSpr.y - 90, `−${dmg}`, '#ffd27a'); }
    }
    golpeAlJefe(dmg) {
      const J = this.jefe;
      if (J.lider !== idJuego || J.estado !== 'combate') return;
      J.hp = Math.max(0, J.hp - (Number(dmg) || 0));
      if (J.hp === 0) { J.estado = 'vencido'; J.hasta = Date.now() + JEFE_DESCANSO; }
      this.publicarJefe();
    }
    sacarDelJefe(id) {
      const J = this.jefe;
      if (J.estado !== 'combate' || J.lider !== idJuego) return;
      J.part = J.part.filter((x) => x !== id);
      if (!J.part.length) J.estado = 'libre';
      else if (!J.part.includes(J.lider)) J.lider = [...J.part].sort()[0];
      this.publicarJefe();
    }
    salirDelJefe() {
      this.enJefe = false;
      if (!this.canal) return;
      if (this.jefe.lider === idJuego) this.sacarDelJefe(idJuego);
      else this.canal.emitir('caido', { id: idJuego });
      this.jefe.part = this.jefe.part.filter((x) => x !== idJuego);
    }
    nombreJugador(id) { if (id === idJuego) return 'Tú'; const o = this.otros.get(id); return o ? String(o.meta.nombre || 'Compañero') : 'Compañero'; }

    flotante(x, y, txt, color = '#ffffff') {
      const t = this.add.text(x, y, txt, { fontFamily: 'Fredoka, Nunito, sans-serif', fontSize: '15px', fontStyle: 'bold', color, stroke: '#12201a', strokeThickness: 4 }).setOrigin(0.5).setResolution(3).setDepth(100000);
      this.tweens.add({ targets: t, y: y - 34, alpha: 0, duration: 1400, ease: 'Cubic.out', onComplete: () => t.destroy() });
    }
    celebrar(x, y) {
      const j = this.jugador;
      this.add.particles(x ?? j.x, y ?? j.y - 40, 'p_brillo', { speed: { min: 80, max: 180 }, lifespan: 900, gravityY: 150, scale: { start: 1.6, end: 0 }, emitting: false }).setDepth(100000).explode(30);
    }
  }

  function iniciarPhaser(zona) {
    const juego = new Phaser.Game({
      type: Phaser.AUTO, parent: 'juego', backgroundColor: '#2f6b47', pixelArt: true,
      scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
      physics: { default: 'arcade', arcade: { debug: false } },
    });
    juego.scene.add('juego', Juego, true, { zona });
  }

  // Acceso para pruebas y depuración desde la consola del navegador.
  window.MathWorld = { escena: () => escena, estado: () => S, sesion: () => sesion };

  prepararIngreso();
})();
