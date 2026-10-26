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
    { id: 'condor', nombre: 'Cóndor' }, { id: 'huemul', nombre: 'Huemul' },
    { id: 'pudu', nombre: 'Pudú' }, { id: 'lobo', nombre: 'Lobo' },
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
    { id: 'espada', nombre: 'Espada de piedra', desc: 'Equipada, cada acierto en combate quita 2 de vida.', icono: 'espada', costo: { madera: 15, piedra: 10 }, requiere: 'pico' },
    { id: 'hacha2', nombre: 'Hacha de hierro', desc: 'Ganas 2 maderas más por cada árbol.', icono: 'axe', costo: { madera: 25, piedra: 15 }, requiere: 'pico' },
    { id: 'armadura', nombre: 'Armadura de cuero', desc: 'Equipada, tu vida máxima sube a 7 corazones.', icono: 'armadura', costo: { piedra: 25, agua: 6, cristal: 2 }, requiere: 'espada' },
    { id: 'pico2', nombre: 'Pico reforzado', desc: 'Más piedra y más cristales al picar rocas.', icono: 'pickaxe', costo: { madera: 20, piedra: 25, cristal: 2 }, requiere: 'hacha2' },
    { id: 'espada2', nombre: 'Espada de cristal', desc: 'Equipada, cada acierto en combate quita 3 de vida.', icono: 'espada', costo: { piedra: 20, cristal: 6 }, requiere: 'armadura' },
    { id: 'armadura2', nombre: 'Armadura de cristal', desc: 'Equipada, tu vida máxima sube a 9 corazones.', icono: 'armadura', costo: { agua: 12, cristal: 8 }, requiere: 'espada2' },
  ];
  const NOMBRE_MEJORA = Object.fromEntries(MEJORAS.map((m) => [m.id, m.nombre]));
  // Equipo que se ve en el personaje
  const ARMAS = { espada: { nombre: 'Espada de piedra', danio: 2 }, espada2: { nombre: 'Espada de cristal', danio: 3 } };
  const ARMADURAS = { armadura: { nombre: 'Armadura de cuero', vida: 2, tex: 'cuero' }, armadura2: { nombre: 'Armadura de cristal', vida: 4, tex: 'cristal' } };
  const cuerpoDe = (pj) => (pj === 'luna' || pj === 'copihue' ? 'thin' : 'male');
  const texArmadura = (id) => (ARMADURAS[id] ? ARMADURAS[id].tex : 'nada');

  // Banco de decorativos y muebles (se pueden fabricar varias veces).
  // t: [columna, fila, ancho, alto] en la hoja ('o' = exterior, 'i' = interior). lugar: base, pieza o ambos.
  // pie: filas que ocupa en el suelo · piso: alfombra (se pisa) · pared: se cuelga · paso: se puede caminar encima
  // excl: solo se obtiene como premio al subir de nivel
  const D = (id, nombre, cat, lugar, h, t, costo, extra = {}) => ({ id, nombre, cat, lugar, h, t, costo, tex: `d_${id}`, ...extra });
  const OBJETOS = [
    // ----- Base (exterior)
    D('carpa_b', 'Carpa', 'Carpas', 'base', 'o', [48, 10, 2, 2], { madera: 20, piedra: 5 }, { carpa: true, pie: 1 }),
    D('carpa_v', 'Carpa verde', 'Carpas', 'base', 'o', [46, 10, 2, 2], { madera: 20, agua: 5 }, { carpa: true, pie: 1 }),
    D('flores', 'Flores rojas', 'Jardín', 'base', 'o', [29, 9, 1, 1], { agua: 1 }, { paso: true }),
    D('flor_a', 'Flores azules', 'Jardín', 'base', 'o', [28, 9, 1, 1], { agua: 1 }, { paso: true }),
    D('flor_m', 'Flores moradas', 'Jardín', 'base', 'o', [30, 9, 1, 1], { agua: 1 }, { paso: true }),
    D('flor_b', 'Flores blancas', 'Jardín', 'base', 'o', [31, 9, 1, 1], { agua: 1 }, { paso: true }),
    D('hongo', 'Hongo', 'Jardín', 'base', 'o', [48, 2, 1, 1], { agua: 1 }, { paso: true }),
    D('hongo2', 'Hongo moteado', 'Jardín', 'base', 'o', [48, 4, 1, 1], { agua: 2 }, { paso: true }),
    D('arbusto', 'Arbusto', 'Jardín', 'base', 'o', [19, 9, 1, 1], { agua: 2 }),
    D('arbusto_o', 'Arbusto otoñal', 'Jardín', 'base', 'o', [20, 9, 1, 1], { agua: 2 }),
    D('arbusto_f', 'Arbusto con frutos', 'Jardín', 'base', 'o', [24, 9, 1, 1], { agua: 3 }),
    D('arbusto_fl', 'Arbusto florido', 'Jardín', 'base', 'o', [25, 10, 1, 1], { agua: 3 }),
    D('manzano', 'Manzano', 'Árboles y rocas', 'base', 'o', [23, 10, 1, 2], { madera: 2, agua: 4 }),
    D('pino', 'Pino', 'Árboles y rocas', 'base', 'o', [18, 10, 1, 2], { madera: 2, agua: 3 }),
    D('arce', 'Arce otoñal', 'Árboles y rocas', 'base', 'o', [14, 10, 1, 2], { madera: 2, agua: 4 }),
    D('cactus', 'Cactus', 'Árboles y rocas', 'base', 'o', [22, 9, 1, 1], { agua: 2, piedra: 1 }),
    D('roca', 'Roca con musgo', 'Árboles y rocas', 'base', 'o', [54, 22, 1, 1], { piedra: 4 }),
    D('roca_gris', 'Roca gris', 'Árboles y rocas', 'base', 'o', [54, 21, 1, 1], { piedra: 3 }),
    D('cerco', 'Cerco', 'Construcción', 'base', 'o', [52, 23, 1, 1], { madera: 2 }),
    D('poste', 'Poste', 'Construcción', 'base', 'o', [50, 23, 1, 1], { madera: 1 }),
    D('letrero', 'Letrero', 'Construcción', 'base', 'o', [19, 0, 1, 1], { madera: 3 }),
    D('lena', 'Leña', 'Construcción', 'base', 'o', [13, 8, 1, 1], { madera: 3 }),
    D('barril', 'Barril', 'Construcción', 'ambos', 'o', [23, 0, 1, 1], { madera: 6 }),
    D('barril2', 'Barril pequeño', 'Construcción', 'ambos', 'o', [24, 0, 1, 1], { madera: 4 }),
    D('cajon', 'Cajón', 'Construcción', 'ambos', 'o', [27, 1, 1, 1], { madera: 5 }),
    D('mesa_ext', 'Mesa de trabajo', 'Construcción', 'base', 'o', [16, 0, 1, 1], { madera: 5 }),
    D('yunque', 'Yunque', 'Taller', 'base', 'o', [15, 0, 1, 1], { piedra: 8 }),
    D('horno', 'Horno de piedra', 'Taller', 'base', 'o', [13, 0, 1, 1], { piedra: 10, madera: 2 }),
    D('antorcha', 'Antorcha', 'Luces y fuego', 'base', 'o', [17, 8, 1, 1], { madera: 2, cristal: 1 }),
    D('fogata2', 'Fogata', 'Luces y fuego', 'base', 'o', [14, 8, 1, 1], { madera: 6, piedra: 2 }),
    D('candelabro', 'Candelabro', 'Luces y fuego', 'ambos', 'o', [19, 8, 1, 1], { piedra: 3, cristal: 1 }),
    D('band_r', 'Estandarte rojo', 'Exclusivos', 'base', 'o', [49, 0, 1, 3], {}, { excl: true }),
    D('band_t', 'Estandarte turquesa', 'Exclusivos', 'base', 'o', [49, 3, 1, 3], {}, { excl: true }),
    D('band_v', 'Estandarte verde', 'Exclusivos', 'base', 'o', [49, 6, 1, 3], {}, { excl: true }),
    D('cristal_g', 'Cristal gigante', 'Exclusivos', 'base', 'o', [50, 9, 1, 1], {}, { excl: true }),
    D('oro', 'Montón de oro', 'Exclusivos', 'ambos', 'o', [43, 11, 1, 1], {}, { excl: true }),
    // ----- Pieza (interior de la carpa)
    D('cama_n', 'Cama naranja', 'Camas', 'pieza', 'i', [14, 9, 1, 2], { madera: 12, agua: 4 }, { pie: 2 }),
    D('cama_v', 'Cama verde', 'Camas', 'pieza', 'i', [14, 11, 1, 2], { madera: 12, agua: 4 }, { pie: 2 }),
    D('mesa_oval', 'Mesa ovalada', 'Mesas y sillas', 'pieza', 'i', [3, 0, 2, 1], { madera: 10 }),
    D('mesa_larga', 'Mesa larga', 'Mesas y sillas', 'pieza', 'i', [0, 0, 3, 1], { madera: 14 }),
    D('mesa_red', 'Mesa redonda', 'Mesas y sillas', 'pieza', 'i', [7, 0, 1, 1], { madera: 6 }),
    D('escritorio', 'Escritorio', 'Mesas y sillas', 'pieza', 'i', [13, 12, 1, 1], { madera: 8 }),
    D('silla', 'Silla', 'Mesas y sillas', 'pieza', 'i', [0, 2, 1, 1], { madera: 3 }, { paso: true }),
    D('silla_l', 'Silla de lado', 'Mesas y sillas', 'pieza', 'i', [2, 2, 1, 1], { madera: 3 }, { paso: true }),
    D('sillon', 'Sillón', 'Mesas y sillas', 'pieza', 'i', [0, 6, 1, 1], { madera: 6, agua: 1 }),
    D('silla_b', 'Silla blanca', 'Mesas y sillas', 'pieza', 'i', [0, 8, 1, 1], { piedra: 3, madera: 1 }, { paso: true }),
    D('cocina', 'Cocina', 'Cocina', 'pieza', 'i', [14, 15, 1, 1], { piedra: 8, cristal: 1 }),
    D('lavaplatos', 'Lavaplatos', 'Cocina', 'pieza', 'i', [8, 12, 1, 1], { piedra: 6, agua: 3 }),
    D('encimera', 'Mueble con frascos', 'Cocina', 'pieza', 'i', [5, 12, 1, 1], { madera: 6, agua: 1 }),
    D('mueble', 'Mueble de cocina', 'Cocina', 'pieza', 'i', [0, 13, 1, 1], { madera: 6 }),
    D('refri', 'Refrigerador', 'Cocina', 'pieza', 'i', [25, 8, 1, 2], { piedra: 8, cristal: 2 }),
    D('olla', 'Olla', 'Cocina', 'pieza', 'i', [21, 4, 1, 1], { piedra: 2 }, { paso: true }),
    D('vela', 'Vela', 'Lámparas', 'pieza', 'i', [16, 6, 1, 1], { madera: 1, cristal: 1 }, { paso: true }),
    D('cand_mesa', 'Lámpara de tres velas', 'Lámparas', 'pieza', 'i', [16, 7, 1, 1], { piedra: 2, cristal: 1 }),
    D('cand_pl', 'Lámpara de plata', 'Lámparas', 'pieza', 'i', [19, 0, 1, 1], { piedra: 3, cristal: 1 }),
    D('pie_pl', 'Lámpara de pie', 'Lámparas', 'pieza', 'i', [19, 4, 1, 2], { piedra: 4, cristal: 2 }),
    D('ant_pared', 'Antorcha de pared', 'Lámparas', 'pieza', 'i', [21, 6, 1, 1], { madera: 2, cristal: 1 }, { pared: true }),
    D('alf_n', 'Alfombra naranja', 'Alfombras', 'pieza', 'i', [16, 8, 3, 2], { agua: 4, madera: 2 }, { piso: true }),
    D('alf_v', 'Alfombra verde', 'Alfombras', 'pieza', 'i', [16, 10, 3, 2], { agua: 4, madera: 2 }, { piso: true }),
    D('alf_oval', 'Alfombra ovalada', 'Alfombras', 'pieza', 'i', [19, 8, 2, 1], { agua: 3 }, { piso: true }),
    D('alf_ovalv', 'Alfombra ovalada verde', 'Alfombras', 'pieza', 'i', [19, 10, 2, 1], { agua: 3 }, { piso: true }),
    D('tapiz', 'Alfombra turquesa', 'Alfombras', 'pieza', 'i', [16, 14, 3, 1], { agua: 3, cristal: 1 }, { piso: true }),
    D('tapiz_n', 'Alfombra dorada', 'Alfombras', 'pieza', 'i', [16, 15, 3, 1], { agua: 3, cristal: 1 }, { piso: true }),
    D('tapiz_v', 'Alfombra de hojas', 'Alfombras', 'pieza', 'i', [16, 16, 3, 1], { agua: 3, cristal: 1 }, { piso: true }),
    D('cuadro_v', 'Cuadro de paisaje', 'Para la pared', 'pieza', 'i', [19, 12, 1, 1], { madera: 2, agua: 2 }, { pared: true }),
    D('cuadro_n', 'Cuadro del atardecer', 'Para la pared', 'pieza', 'i', [19, 13, 1, 1], { madera: 2, agua: 2 }, { pared: true }),
    D('cuadro_t', 'Cuadro del mar', 'Para la pared', 'pieza', 'i', [19, 14, 1, 1], { madera: 2, agua: 2 }, { pared: true }),
    D('escudo', 'Escudo redondo', 'Para la pared', 'pieza', 'i', [22, 8, 1, 1], { piedra: 4 }, { pared: true }),
    D('reloj', 'Reloj cucú', 'Para la pared', 'pieza', 'o', [26, 8, 1, 1], { madera: 6, cristal: 1 }, { pared: true }),
    D('chimenea', 'Chimenea', 'Para la pared', 'pieza', 'o', [54, 8, 1, 1], { piedra: 12, madera: 4 }, { pared: true }),
    D('planta', 'Planta', 'Adornos', 'pieza', 'i', [16, 0, 1, 1], { agua: 3 }),
    D('planta2', 'Helecho', 'Adornos', 'pieza', 'i', [17, 0, 1, 1], { agua: 3 }),
    D('libros', 'Estante con libros', 'Adornos', 'pieza', 'i', [20, 17, 1, 1], { madera: 8 }),
    D('libros2', 'Librero', 'Adornos', 'pieza', 'i', [21, 17, 1, 1], { madera: 8 }),
    D('jarron', 'Jarrón de cobre', 'Adornos', 'pieza', 'i', [16, 4, 1, 1], { piedra: 2, agua: 1 }),
    D('cama_doble', 'Cama doble', 'Exclusivos', 'pieza', 'i', [14, 6, 2, 2], {}, { excl: true, pie: 2 }),
    D('piano', 'Piano', 'Exclusivos', 'pieza', 'i', [23, 8, 2, 2], {}, { excl: true, pie: 2 }),
    D('pie_or', 'Lámpara de oro', 'Exclusivos', 'pieza', 'i', [20, 4, 1, 2], {}, { excl: true }),
    D('jarron_p', 'Jarrón de plata', 'Exclusivos', 'pieza', 'i', [17, 4, 1, 1], {}, { excl: true }),
    D('mapa', 'Mapa enmarcado', 'Exclusivos', 'pieza', 'i', [20, 12, 2, 1], {}, { excl: true, pared: true }),
    D('espejo', 'Espejo', 'Exclusivos', 'pieza', 'i', [22, 14, 1, 2], {}, { excl: true, pared: true }),
    D('escudo2', 'Escudo real', 'Exclusivos', 'pieza', 'i', [22, 10, 1, 1], {}, { excl: true, pared: true }),
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
  const nombreZona = (z) => (z === 'base' ? 'Tu base' : z === 'pieza' ? 'Tu pieza' : typeof MUNDOS[z].nombre === 'string' ? MUNDOS[z].nombre : MUNDOS[z].nombre[S.curso]);

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
      mejoras: [], herramienta: 'hacha', arma: null, armadura: null, inventario: {}, colocados: [], pieza: [],
      misiones: {}, diaria: null, premiosNivel: 0, ofertaNivel: null,
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
    const n = { ...base, ...p, mochila: { ...base.mochila, ...p.mochila }, cofre: { ...base.cofre, ...p.cofre }, nombre: nombre || p.nombre };
    // Partidas anteriores al panel de Equipo: se equipa lo mejor que ya tenían
    const tieneN = (id) => (n.mejoras || []).includes(id);
    if (n.arma === undefined) n.arma = tieneN('espada2') ? 'espada2' : tieneN('espada') ? 'espada' : null;
    if (n.armadura === undefined) n.armadura = tieneN('armadura2') ? 'armadura2' : tieneN('armadura') ? 'armadura' : null;
    if (n.herramienta === 'espada' && !n.arma) n.herramienta = 'hacha';
    if (!PERSONAJES.some((x) => x.id === n.pj)) n.pj = 'zorro';
    return n;
  }

  const tiene = (id) => S.mejoras.includes(id);
  const vidaMax = () => 5 + (S.armadura && ARMADURAS[S.armadura] ? ARMADURAS[S.armadura].vida : 0);
  const danio = () => (S.arma && ARMAS[S.arma] ? ARMAS[S.arma].danio : 1);
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
    let subio = false;
    while (S.xp >= xpPara(S.nivel)) {
      S.xp -= xpPara(S.nivel); S.nivel += 1; subio = true;
      S.premiosNivel = (S.premiosNivel || 0) + 1;
      toast(`¡Subiste a nivel ${S.nivel}! Elige tu recompensa.`);
    }
    if (subio) premioPospuesto = false;
    pintarHUD();
    if (subio) revisarPendientes();
  }
  const difPara = (base) => Math.min(3, base + (S.nivel >= 6 ? 1 : 0));
  const unidadActual = () => (escena && MUNDOS[escena.zona] ? escena.zona : 'u1');
  const enCasa = () => !escena || escena.zona === 'base' || escena.zona === 'pieza';

  // ===================================================================
  // Misiones: 3 al azar por mundo (abren al jefe final) y una misión diaria
  // ===================================================================
  const TIPOS_MISION = {
    talar: { n: [4, 6], txt: (m) => `Tala ${m.n} árboles` },
    picar: { n: [3, 5], txt: (m) => `Pica ${m.n} rocas`, req: () => tiene('pico') },
    agua: { n: [2, 3], txt: (m) => `Saca agua del lago ${m.n} veces`, req: () => tiene('balde') },
    cofre: { n: [1, 2], txt: (m) => (m.n === 1 ? 'Abre 1 cofre del mundo' : `Abre ${m.n} cofres del mundo`) },
    arbusto: { n: [2, 3], txt: (m) => `Vence ${m.n} arbustos gruñones` },
    niebla: { n: [1, 2], txt: (m) => (m.n === 1 ? 'Vence 1 niebla' : `Vence ${m.n} nieblas`) },
    bicho: { n: [1, 1], txt: () => 'Vence 1 bicho que cae de los árboles' },
    acierto: { n: [3, 4], txt: (m) => `Responde bien ${m.n} ejercicios de: ${m.titulo}` },
  };
  const azarEntre = ([a, b]) => a + Math.floor(Math.random() * (b - a + 1));
  const mezclar = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function nuevasMisiones(u) {
    const tipos = mezclar(Object.keys(TIPOS_MISION).filter((t) => !TIPOS_MISION[t].req || TIPOS_MISION[t].req())).slice(0, 3);
    return { lista: tipos.map((t) => {
      const m = { t, n: azarEntre(TIPOS_MISION[t].n), p: 0 };
      if (t === 'acierto') {
        const temas = Object.entries(Preguntas.titulos(S.curso, u));
        const [tema, titulo] = temas[Math.floor(Math.random() * temas.length)] || ['', 'esta unidad'];
        m.tema = tema; m.titulo = titulo;
      }
      return m;
    }), ok: false };
  }
  function misionesDe(u) {
    S.misiones = S.misiones || {};
    if (!S.misiones[u]) S.misiones[u] = nuevasMisiones(u);
    return S.misiones[u];
  }
  const textoMision = (m) => TIPOS_MISION[m.t].txt(m);
  const misionesListas = (u) => esDocente() || Boolean(S.misiones && S.misiones[u] && S.misiones[u].ok);

  const TIPOS_DIARIA = {
    talar: { n: 6, txt: 'Tala 6 árboles en cualquier mundo' },
    picar: { n: 5, txt: 'Pica 5 rocas', req: () => tiene('pico') },
    agua: { n: 3, txt: 'Saca agua del lago 3 veces', req: () => tiene('balde') },
    vencer: { n: 4, txt: 'Vence a 4 enemigos' },
    acierto: { n: 8, txt: 'Responde bien 8 ejercicios' },
    cofre: { n: 2, txt: 'Abre 2 cofres en los mundos' },
    fabricar: { n: 2, txt: 'Fabrica 2 decorativos o muebles' },
    decorar: { n: 3, txt: 'Coloca 3 objetos en tu base o tu pieza' },
  };
  const PREMIOS_DIARIA = [{ madera: 15, piedra: 10 }, { cristal: 4 }, { agua: 8, madera: 10 }, { piedra: 12, cristal: 2 }];
  const hoy = () => { try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date()); } catch (e) { return new Date().toISOString().slice(0, 10); } };
  function diaria() {
    const f = hoy();
    if (!S.diaria || S.diaria.fecha !== f) {
      const tipos = Object.keys(TIPOS_DIARIA).filter((t) => !TIPOS_DIARIA[t].req || TIPOS_DIARIA[t].req());
      const t = tipos[Math.floor(Math.random() * tipos.length)];
      const normales = OBJETOS.filter((o) => !o.excl);
      S.diaria = { fecha: f, t, n: TIPOS_DIARIA[t].n, p: 0, cobrada: false,
        premio: { rec: PREMIOS_DIARIA[Math.floor(Math.random() * PREMIOS_DIARIA.length)], obj: normales[Math.floor(Math.random() * normales.length)].id, xp: 50 } };
    }
    return S.diaria;
  }
  // Se llama cada vez que el jugador hace algo que puede contar para una misión
  function avanzarMision(ev, tema) {
    if (!S) return;
    const u = escena && MUNDOS[escena.zona] ? escena.zona : null;
    if (u) {
      const M = misionesDe(u);
      if (!M.ok) {
        let cambio = false;
        for (const m of M.lista) {
          if (m.p >= m.n || m.t !== ev || (ev === 'acierto' && m.tema !== tema)) continue;
          m.p += 1; cambio = true;
          if (m.p >= m.n) toast(`Misión cumplida: ${textoMision(m)}`);
        }
        if (cambio && M.lista.every((m) => m.p >= m.n)) {
          M.ok = true;
          setTimeout(() => toast(`¡Completaste las misiones! El jefe ${JEFES[u].nombre} ya te puede enfrentar.`), 1200);
          ganarXP(30);
          if (escena) { escena.celebrar(); escena.avisarGuarida(); }
        }
      }
    }
    const Dd = diaria();
    const cuenta = Dd.t === ev || (Dd.t === 'vencer' && ENEMIGOS[ev]);
    if (cuenta && Dd.p < Dd.n) {
      Dd.p += 1;
      if (Dd.p >= Dd.n) setTimeout(() => toast('¡Misión diaria cumplida! Reclama tu recompensa en Misiones (tecla N).'), 900);
    }
    pintarMisiones();
  }
  function pintarMisiones() {
    const el = $('hud-misiones');
    if (!el || !S) return;
    const u = escena && MUNDOS[escena.zona] ? escena.zona : null;
    const Dd = diaria();
    const fila = (txt, p, n) => `<li class="${p >= n ? 'ok' : ''}"><span>${esc(txt)}</span><b>${Math.min(p, n)}/${n}</b></li>`;
    let html = '';
    if (u) {
      const M = misionesDe(u);
      html += `<strong>${M.ok ? 'Jefe final desbloqueado' : 'Misiones para el jefe'}</strong><ul>${M.lista.map((m) => fila(textoMision(m), m.p, m.n)).join('')}</ul>`;
    }
    html += `<strong>Misión diaria${Dd.cobrada ? ' · cobrada' : Dd.p >= Dd.n ? ' · ¡reclámala!' : ''}</strong><ul>${fila(TIPOS_DIARIA[Dd.t].txt, Dd.p, Dd.n)}</ul>`;
    el.innerHTML = html;
    const pend = (Dd.p >= Dd.n && !Dd.cobrada) || (S.premiosNivel || 0) > 0;
    $('btn-misiones').classList.toggle('alerta', pend);
  }
  const recHTML = (rec) => Object.entries(rec).map(([r, n]) => `<span class="pildora premio"><img class="px" src="${ICONO(r)}" alt="">+${n} ${r}</span>`).join('');
  function sumarCofre(rec) { Object.entries(rec).forEach(([r, n]) => { S.cofre[r] = (S.cofre[r] || 0) + n; }); pintarHUD(); }
  function abrirMisiones() {
    const Dd = diaria();
    const u = escena && MUNDOS[escena.zona] ? escena.zona : null;
    const barra = (p, n) => `<div class="barra"><i style="width: ${Math.round((Math.min(p, n) / n) * 100)}%"></i></div>`;
    const lista = (M) => `<ul class="misiones">${M.lista.map((m) => `<li class="${m.p >= m.n ? 'ok' : ''}"><div class="fila"><span>${esc(textoMision(m))}</span><b>${Math.min(m.p, m.n)}/${m.n}</b></div>${barra(m.p, m.n)}</li>`).join('')}</ul>`;
    const mundos = Object.keys(MUNDOS).filter((z) => z !== u && S.misiones && S.misiones[z]).map((z) => `
      <details><summary><strong>${esc(nombreZona(z))}</strong> · ${S.misiones[z].ok ? '<span class="estado-ok">Jefe desbloqueado</span>' : `${S.misiones[z].lista.filter((m) => m.p >= m.n).length} de 3`}</summary>${lista(S.misiones[z])}</details>`).join('');
    const p = Dd.premio;
    const premioD = `${recHTML(p.rec)}<span class="pildora premio"><img class="px" src="${escena.imagenTex(OBJ[p.obj].tex)}" alt="">${esc(OBJ[p.obj].nombre)}</span><span class="pildora premio">+${p.xp} XP</span>`;
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">Misiones</span><h2 id="modal-titulo">Tus misiones</h2></div><button type="button" class="btn" id="mi-cerrar">Cerrar</button></div>
      ${(S.premiosNivel || 0) > 0 ? `<div class="mensaje pista" style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><span>Tienes ${S.premiosNivel === 1 ? 'una recompensa' : `${S.premiosNivel} recompensas`} de nivel por elegir.</span><button type="button" class="btn pri" id="mi-nivel">Elegir</button></div>` : ''}
      <section class="tarjeta-mision diaria">
        <div class="fila"><strong>Misión diaria</strong><small>Se renueva cada día</small></div>
        <div class="fila"><span>${esc(TIPOS_DIARIA[Dd.t].txt)}</span><b>${Math.min(Dd.p, Dd.n)}/${Dd.n}</b></div>${barra(Dd.p, Dd.n)}
        <div class="pildoras">${premioD}</div>
        ${Dd.cobrada ? '<span class="estado-ok">Recompensa cobrada. Vuelve mañana por una nueva misión.</span>'
          : `<button type="button" class="btn pri" id="mi-cobrar" ${Dd.p >= Dd.n ? '' : 'disabled'}>${Dd.p >= Dd.n ? 'Reclamar recompensa' : 'Cúmplela para reclamar'}</button>`}
      </section>
      ${u ? `<section class="tarjeta-mision"><div class="fila"><strong>${esc(nombreZona(u))}: misiones para el jefe final</strong></div>
        <p class="nota">${misionesListas(u) ? `¡Listo! Ve a la guarida de ${esc(JEFES[u].nombre)} con tu grupo (mínimo ${JEFE_MIN} jugadores con sus misiones cumplidas).` : `Cumple tus 3 misiones para poder enfrentar a ${esc(JEFES[u].nombre)}. Cada jugador recibe misiones distintas.`}</p>
        ${lista(misionesDe(u))}</section>`
        : '<p class="nota">Al entrar a cada mundo recibes 3 misiones al azar. Cúmplelas para poder enfrentar al jefe final junto a tu grupo.</p>'}
      ${mundos ? `<div class="unidades-avance">${mundos}</div>` : ''}`);
    $('mi-cerrar').addEventListener('click', () => ui.cerrar());
    const bn = $('mi-nivel'); if (bn) bn.addEventListener('click', () => { premioPospuesto = false; abrirPremioNivel(); });
    const bc = $('mi-cobrar');
    if (bc) bc.addEventListener('click', () => {
      if (Dd.cobrada || Dd.p < Dd.n) return;
      Dd.cobrada = true;
      sumarCofre(p.rec);
      S.inventario[p.obj] = (S.inventario[p.obj] || 0) + 1;
      guardar(true); escena.celebrar();
      toast(`Recompensa en tu cofre y ${OBJ[p.obj].nombre} en tus objetos. ¡Bien hecho!`);
      ganarXP(p.xp);
      pintarMisiones();
      if (ui.abierto) abrirMisiones();
    });
  }

  // ---------- Recompensa al subir de nivel: elegir 1 de 3 ----------
  let premioPospuesto = false;
  const cuantos = (id) => (S.inventario[id] || 0) + (S.colocados || []).filter((c) => c.k === id).length + (S.pieza || []).filter((c) => c.k === id).length;
  function nuevaOferta() {
    const L = S.nivel;
    const paquetes = mezclar([
      { madera: 12 + 3 * L, piedra: 8 + 2 * L }, { cristal: 2 + Math.floor(L / 2) },
      { agua: 8 + 2 * L, madera: 6 + L }, { piedra: 12 + 3 * L, cristal: 1 },
    ]);
    const excl = mezclar(OBJETOS.filter((o) => o.excl && cuantos(o.id) === 0));
    const normales = mezclar(OBJETOS.filter((o) => !o.excl && !o.carpa));
    const ops = [{ tipo: 'rec', rec: paquetes[0] }];
    ops.push(excl.length ? { tipo: 'obj', id: excl[0].id, n: 1, excl: true } : { tipo: 'rec', rec: paquetes[1] });
    const o = normales[0];
    ops.push({ tipo: 'obj', id: o.id, n: Object.values(o.costo).reduce((a, b) => a + b, 0) <= 4 ? 3 : 1 });
    return mezclar(ops);
  }
  function abrirPremioNivel() {
    if (!(S.premiosNivel > 0)) return;
    if (!S.ofertaNivel) { S.ofertaNivel = nuevaOferta(); guardar(); }
    const ops = S.ofertaNivel;
    const tarjeta = (op, i) => {
      if (op.tipo === 'rec') return `<button type="button" class="premio-op" data-op="${i}"><small>RECURSOS AL COFRE</small><div class="iconos">${Object.keys(op.rec).map((r) => `<img class="px" src="${ICONO(r)}" alt="">`).join('')}</div><strong>${Object.entries(op.rec).map(([r, n]) => `${n} ${r}`).join(' + ')}</strong></button>`;
      const o = OBJ[op.id];
      return `<button type="button" class="premio-op ${op.excl ? 'excl' : ''}" data-op="${i}"><small>${op.excl ? 'OBJETO EXCLUSIVO' : 'OBJETO'} · ${o.lugar === 'pieza' ? 'PARA TU PIEZA' : 'PARA TU BASE'}</small><div class="iconos"><img class="px" src="${escena.imagenTex(o.tex)}" alt=""></div><strong>${op.n > 1 ? `${op.n} × ` : ''}${esc(o.nombre)}</strong></button>`;
    };
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">Recompensa del nivel ${S.nivel - S.premiosNivel + 1}</span><h2 id="modal-titulo">¡Subiste de nivel! Elige tu recompensa</h2></div></div>
      <p class="nota">Solo puedes quedarte con una. Los objetos exclusivos no se pueden fabricar: solo se ganan subiendo de nivel.</p>
      <div class="premios">${ops.map(tarjeta).join('')}</div>
      <div class="acciones"><span class="nota">${S.premiosNivel > 1 ? `Te quedan ${S.premiosNivel} recompensas por elegir.` : ''}</span><button type="button" class="btn" id="pn-luego">Elegir más tarde</button></div>`);
    $('pn-luego').addEventListener('click', () => { premioPospuesto = true; ui.cerrar(); pintarMisiones(); });
    document.querySelectorAll('[data-op]').forEach((b) => b.addEventListener('click', () => {
      const op = ops[Number(b.dataset.op)];
      if (op.tipo === 'rec') { sumarCofre(op.rec); toast(`¡Recompensa guardada en tu cofre: ${Object.entries(op.rec).map(([r, n]) => `${n} ${r}`).join(', ')}!`); }
      else { S.inventario[op.id] = (S.inventario[op.id] || 0) + op.n; toast(`¡Ganaste: ${OBJ[op.id].nombre}! Colócalo con Decorar (G).`); }
      S.premiosNivel -= 1; S.ofertaNivel = null;
      guardar(true); escena.celebrar(); pintarMisiones();
      ui.cerrar();
    }));
  }
  // Muestra lo que esté pendiente (recompensa de nivel) cuando no haya otra ventana abierta
  function revisarPendientes() {
    clearTimeout(revisarPendientes._t);
    revisarPendientes._t = setTimeout(() => {
      if (!S || ui.abierto || !escena || !escena.jugador || escena.enCombate || escena.enJefe || juegoCerrado || premioPospuesto) return;
      if ((S.premiosNivel || 0) > 0) abrirPremioNivel();
    }, 600);
  }

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
      // Partida reiniciada (o sin avance) y aún no elige personaje: se le muestra el selector antes de entrar
      if ((!r.progreso || !r.progreso.v) && $('bloque-pj').classList.contains('oculto')) {
        $('bloque-pj').classList.remove('oculto');
        $('saludo').textContent = `Hola, ${ingreso.estado.nombre}. Comienzas una aventura nueva: elige tu personaje y presiona Entrar al mundo.`;
        return error('');
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
    iniciarPhaser(S.zona && (S.zona === 'base' || S.zona === 'pieza' || MUNDOS[S.zona]) ? S.zona : 'base');
    setTimeout(() => toast(esDocente() ? 'Modo docente: recursos ilimitados y fabricación sin desafíos.' : S.creado > Date.now() - 60000 ? `¡Bienvenido, ${S.nombre}! Esta es tu base. Camina al portal para viajar.` : `¡Hola de nuevo, ${S.nombre}!`), 700);
  }

  // ===================================================================
  // HUD
  // ===================================================================
  function pintarHUD() {
    if (!S) return;
    const enBase = enCasa();
    $('hud-foto').style.backgroundImage = `url('assets/pj/${S.pj}_${texArmadura(S.armadura)}.png')`;
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
      { id: 'espada', icono: 'espada', tecla: '3', ok: Boolean(S.arma), nombre: S.arma ? ARMAS[S.arma].nombre : 'Espada (equípala en Equipo)' },
      { id: 'balde', icono: 'agua', tecla: '', ok: tiene('balde'), nombre: 'Balde' },
    ];
    $('hud-herramientas').innerHTML = ranuras.map((r) => `
      <div class="ranura ${S.herramienta === r.id ? 'activa' : ''} ${r.ok ? '' : 'falta'}" title="${esc(r.ok ? r.nombre : r.nombre + ' (fabrícalo en tu base)')}">
        ${r.tecla ? `<small>${r.tecla}</small>` : ''}<img class="px" src="${ICONO(r.icono)}" alt="${esc(r.nombre)}">
      </div>`).join('');
    $('btn-base').classList.toggle('oculto', !enBase);
    $('btn-decorar').classList.toggle('oculto', !enBase);
    $('btn-portal').classList.toggle('oculto', !esDocente());
    pintarMisiones();
  }
  // Lo que lleva en la mano: hacha, pico o la espada equipada
  function equipar(h) {
    if (h === 'pico' && !tiene('pico')) { toast('Primero fabrica un pico en tu base.'); return; }
    if (h === 'espada' && !S.arma) { toast('No tienes una espada equipada. Ábrela en Equipo (tecla Q).'); return; }
    if (S.herramienta === h) return;
    S.herramienta = h;
    if (escena) escena.vestirJugador();
    pintarHUD();
  }
  // Equipar o quitar armas y armaduras fabricadas
  function ponerEquipo(id) {
    if (id && !tiene(id)) return;
    if (ARMAS[id]) { S.arma = id; S.herramienta = 'espada'; toast(`Equipaste: ${ARMAS[id].nombre}. Tu golpe quita ${danio()}.`); }
    else if (ARMADURAS[id]) {
      const antes = vidaMax(); S.armadura = id;
      S.vida = Math.min(vidaMax(), S.vida + Math.max(0, vidaMax() - antes));
      toast(`Equipaste: ${ARMADURAS[id].nombre}. Vida máxima: ${vidaMax()} corazones.`);
    }
    if (escena) escena.vestirJugador();
    guardar(true); pintarHUD();
  }
  function quitarEquipo(tipo) {
    if (tipo === 'arma') { S.arma = null; if (S.herramienta === 'espada') S.herramienta = 'hacha'; }
    else { S.armadura = null; S.vida = Math.min(S.vida, vidaMax()); }
    if (escena) escena.vestirJugador();
    guardar(true); pintarHUD();
  }
  // Vista del personaje con su equipo (capas de la hoja, mirando al frente)
  function figuraHTML(pj, armadura, mano, arma, tam = 128) {
    const capa = (url) => `<span style="background-image:url('${url}');background-size:${tam * 9}px ${tam * 4}px;background-position:0 -${tam * 2}px"></span>`;
    let html = '';
    if (mano === 'espada' && arma) html += capa(`assets/capas/${arma}_bg.png`);
    html += capa(`assets/pj/${pj}_${texArmadura(armadura)}.png`);
    if (mano === 'espada' && arma) html += capa(`assets/capas/${arma}_fg.png`);
    else if (mano === 'hacha' || mano === 'pico') html += capa(`assets/capas/${mano}_${cuerpoDe(pj)}.png`);
    return `<div class="figura" style="width:${tam}px;height:${tam}px" role="img" aria-label="Tu personaje con su equipo">${html}</div>`;
  }
  function abrirEquipo() {
    const fila = (id, info, puesto, tipo) => `
      <div class="mejora ${puesto ? 'puesta' : ''}"><img class="ico px" src="${ICONO(tipo === 'arma' ? 'espada' : 'armadura')}" alt="">
        <div class="info"><strong>${esc(info.nombre)}</strong><span>${tipo === 'arma' ? `Cada acierto en combate quita ${info.danio} de vida` : `Vida máxima: ${5 + info.vida} corazones`}</span></div>
        ${puesto ? `<button type="button" class="btn" data-quitar="${tipo}">Quitar</button>` : `<button type="button" class="btn pri" data-poner="${id}">Equipar</button>`}
      </div>`;
    const armas = Object.entries(ARMAS).filter(([id]) => tiene(id));
    const armaduras = Object.entries(ARMADURAS).filter(([id]) => tiene(id));
    const manos = [['hacha', 'Hacha', 'axe', true], ['pico', 'Pico', 'pickaxe', tiene('pico')], ['espada', 'Espada', 'espada', Boolean(S.arma)]];
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">Tu personaje</span><h2 id="modal-titulo">Equipo</h2></div><button type="button" class="btn" id="eq-cerrar">Cerrar</button></div>
      <div class="equipo">
        <div class="equipo-vista">
          ${figuraHTML(S.pj, S.armadura, S.herramienta, S.arma, 160)}
          <div class="pildoras"><span class="pildora">Golpe: ${danio()}</span><span class="pildora">Vida máx.: ${vidaMax()}</span></div>
        </div>
        <div class="equipo-listas">
          <h3>En la mano</h3>
          <div class="manos">${manos.map(([id, n, ico, ok]) => `<button type="button" class="obj mano" data-mano="${id}" aria-pressed="${S.herramienta === id}" ${ok ? '' : 'disabled'}><img class="px" src="${ICONO(ico)}" alt=""><span>${n}</span></button>`).join('')}</div>
          <h3>Arma</h3>
          ${armas.length ? armas.map(([id, a]) => fila(id, a, S.arma === id, 'arma')).join('') : '<p class="nota">Aún no tienes armas. Fabrica una espada en la fogata de tu base.</p>'}
          <h3>Armadura</h3>
          ${armaduras.length ? armaduras.map(([id, a]) => fila(id, a, S.armadura === id, 'armadura')).join('') : '<p class="nota">Aún no tienes armadura. Fabrícala en la fogata de tu base.</p>'}
        </div>
      </div>`);
    $('eq-cerrar').addEventListener('click', () => ui.cerrar());
    document.querySelectorAll('[data-poner]').forEach((b) => b.addEventListener('click', () => { ponerEquipo(b.dataset.poner); abrirEquipo(); }));
    document.querySelectorAll('[data-quitar]').forEach((b) => b.addEventListener('click', () => { quitarEquipo(b.dataset.quitar); abrirEquipo(); }));
    document.querySelectorAll('[data-mano]').forEach((b) => b.addEventListener('click', () => { equipar(b.dataset.mano); abrirEquipo(); }));
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
      revisarPendientes();
    },
  };
  const unaVez = (f) => { let hecho = false; return (...a) => { if (!hecho) { hecho = true; f(...a); } }; };
  function registrar(tema, acierto) {
    const st = S.stats[tema] || (S.stats[tema] = { a: 0, i: 0 });
    st.i += 1; if (acierto) st.a += 1;
    if (acierto) avanzarMision('acierto', tema);
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
      <p class="enunciado" style="font-size: 18px">Este jefe no se puede vencer en solitario. Viaja a este mundo con un grupo y reúnan al menos <strong>${JEFE_MIN} jugadores</strong> en su guarida, cada uno con sus misiones de este mundo cumplidas. Cada uno responde sus ejercicios y todos los aciertos le quitan vida.</p>
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
          S.jefes = S.jefes || {}; S.jefes[e.zona] = (S.jefes[e.zona] || 0) + 1;
          S.misiones[e.zona] = nuevasMisiones(e.zona);
          ganarXP(80); guardar(true);
          setTimeout(() => { toast('Recibiste nuevas misiones para volver a enfrentar al jefe.'); e.avisarGuarida(); pintarMisiones(); }, 2500);
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
    if (!e || !MUNDOS[e.zona]) { el.classList.add('oculto'); return; }
    el.classList.remove('oculto');
    if (!e.canal) { el.textContent = 'Explorando solo'; return; }
    el.textContent = e.canal.est === 'ok' ? `Grupo ${S.grupo} · ${1 + e.otros.size} en este mundo` : `Grupo ${S.grupo} · conectando…`;
  }

  // ---------- Fabricar (en la base) ----------
  function costoHTML(costo) {
    return Object.entries(costo).map(([r, n]) => `<span class="${total(r) < n ? 'falta' : ''}"><img class="px" src="${ICONO(r)}" alt="">${n} ${r}</span>`).join('');
  }
  const lugarDe = (o) => (o.lugar === 'ambos' ? ['base', 'pieza'] : [o.lugar]);
  function catalogoHTML(lugar) {
    const items = OBJETOS.filter((o) => lugarDe(o).includes(lugar)).sort((x, y) => (x.lugar === 'ambos') - (y.lugar === 'ambos'));
    const cats = [...new Set(items.map((o) => o.cat))];
    return cats.map((cat) => `<h3 class="cat">${esc(cat)}</h3><div class="catalogo">${items.filter((o) => o.cat === cat).map((o) => {
      const n = S.inventario[o.id] || 0;
      const der = o.excl ? `<span class="nota">${cuantos(o.id) ? `Tienes ${cuantos(o.id)}` : 'Premio al subir de nivel'}</span>`
        : `<div class="costo">${costoHTML(o.costo)}</div><button type="button" class="btn pri chico" data-o="${o.id}" ${alcanza(o.costo) ? '' : 'disabled'}>Fabricar</button>`;
      return `<div class="item ${o.excl ? 'excl' : ''}"><img class="px" src="${escena.imagenTex(o.tex)}" alt=""><strong>${esc(o.nombre)}</strong><small>${n ? `${n} sin colocar` : ' '}</small>${der}</div>`;
    }).join('')}</div>`).join('');
  }
  function abrirFabricar(pestana) {
    if (!pestana) pestana = escena && escena.zona === 'pieza' ? 'pieza' : 'equipo';
    const filasEquipo = MEJORAS.map((m) => {
      const hecha = tiene(m.id), bloq = m.requiere && !tiene(m.requiere);
      const equipable = ARMAS[m.id] || ARMADURAS[m.id];
      const puesta = S.arma === m.id || S.armadura === m.id;
      const der = hecha && equipable ? (puesta ? '<span class="estado-ok">Equipada</span>' : `<button type="button" class="btn sec" data-eq="${m.id}">Equipar</button>`)
        : hecha ? '<span class="estado-ok">Fabricado</span>'
        : bloq ? `<span class="nota" style="max-width: 150px">Primero: ${esc(NOMBRE_MEJORA[m.requiere])}</span>`
          : `<button type="button" class="btn pri" data-m="${m.id}" ${alcanza(m.costo) ? '' : 'disabled'}>Fabricar</button>`;
      return `<div class="mejora ${hecha ? 'hecha' : ''}"><img class="ico px" src="${ICONO(m.icono)}" alt="">
        <div class="info"><strong>${esc(m.nombre)}</strong><span>${esc(m.desc)}</span><div class="costo">${costoHTML(m.costo)}</div></div>${der}</div>`;
    }).join('');
    const cuerpo = pestana === 'equipo' ? `<div class="mejoras">${filasEquipo}</div>`
      : `<p class="nota">${pestana === 'base' ? 'Decora el exterior de tu base. Si fabricas una carpa, podrás entrar a tu propia pieza.' : 'Muebles para tu pieza: entra a una carpa de tu base para colocarlos.'} Los objetos fabricados se colocan con Decorar (G).</p>${catalogoHTML(pestana)}`;
    ui.abrir(`
      <div class="modal-cab">
        <div><span class="etq">${escena.zona === 'pieza' ? 'Tu pieza' : 'Tu base'} · Los recursos se toman del cofre y la mochila</span><h2 id="modal-titulo">Fabricar</h2></div>
        <button type="button" class="btn" id="f-cerrar">Cerrar</button>
      </div>
      <div class="pestanas" role="tablist">
        <button type="button" role="tab" data-p="equipo" aria-selected="${pestana === 'equipo'}">Equipo</button>
        <button type="button" role="tab" data-p="base" aria-selected="${pestana === 'base'}">Decorativos</button>
        <button type="button" role="tab" data-p="pieza" aria-selected="${pestana === 'pieza'}">Muebles</button>
      </div>
      ${cuerpo}`, 'ancho');
    $('f-cerrar').addEventListener('click', () => ui.cerrar());
    document.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => abrirFabricar(b.dataset.p)));
    document.querySelectorAll('[data-eq]').forEach((b) => b.addEventListener('click', () => { ponerEquipo(b.dataset.eq); abrirFabricar('equipo'); }));
    document.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => {
      const m = MEJORAS.find((x) => x.id === b.dataset.m);
      const hacer = () => {
        if (!alcanza(m.costo) || tiene(m.id)) return;
        pagar(m.costo); S.mejoras.push(m.id);
        guardar(true); pintarHUD(); escena.celebrar();
        toast(ARMAS[m.id] || ARMADURAS[m.id] ? `¡Fabricaste: ${m.nombre}! Equípala con el botón Equipar.` : `¡Fabricaste: ${m.nombre}!`);
      };
      if (esDocente()) { hacer(); abrirFabricar('equipo'); return; }
      abrirDesafio({ accion: `Fabricar: ${m.nombre}`, dif: difPara(2), premio: 'Premio: la mejora', onOk: hacer });
    }));
    document.querySelectorAll('[data-o]').forEach((b) => b.addEventListener('click', () => {
      const o = OBJ[b.dataset.o];
      if (!o || o.excl || !alcanza(o.costo)) return;
      const scroll = $('modal').scrollTop;
      pagar(o.costo);
      S.inventario[o.id] = (S.inventario[o.id] || 0) + 1;
      guardar(true); pintarHUD();
      toast(`Fabricaste: ${o.nombre}. Colócalo con Decorar (G).`);
      avanzarMision('fabricar');
      abrirFabricar(pestana);
      $('modal').scrollTop = scroll;
    }));
  }

  // ---------- Decorar ----------
  function abrirDecorar() {
    const lugar = escena.zona === 'pieza' ? 'pieza' : 'base';
    const items = OBJETOS.filter((o) => S.inventario[o.id] > 0 && lugarDe(o).includes(lugar));
    const otros = OBJETOS.filter((o) => S.inventario[o.id] > 0 && !lugarDe(o).includes(lugar)).length;
    const obj = escena.objetivo && escena.objetivo.tipo === 'colocado' ? escena.objetivo : null;
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">${lugar === 'pieza' ? 'Tu pieza' : 'Tu base'}</span><h2 id="modal-titulo">Decorar</h2></div><button type="button" class="btn" id="g-cerrar">Cerrar</button></div>
      <p class="nota">Elige un objeto: se colocará justo delante de tu personaje.${lugar === 'pieza' ? ' Los cuadros, espejos y antorchas se cuelgan: párate junto a la pared de arriba mirándola.' : ''} Para guardar un objeto colocado, mira hacia él y presiona R.</p>
      ${obj ? `<button type="button" class="btn sec" id="g-guardar">Guardar ${esc(obj.nombre.toLowerCase())} (el que tienes al frente)</button>` : ''}
      ${items.length ? `<div class="objetos">${items.map((o) => `<button type="button" class="obj" data-o="${o.id}"><img class="px" src="${escena.imagenTex(o.tex)}" alt=""><span>${esc(o.nombre)}</span><small>× ${S.inventario[o.id]}</small></button>`).join('')}</div>`
        : `<div class="mensaje pista">No tienes objetos para ${lugar === 'pieza' ? 'tu pieza' : 'tu base'}. Fabrícalos con B, pestaña "${lugar === 'pieza' ? 'Muebles' : 'Decorativos'}".</div>`}
      ${otros ? `<p class="nota">Tienes ${otros} ${otros === 1 ? 'objeto' : 'objetos'} para ${lugar === 'pieza' ? 'el exterior de tu base' : 'tu pieza (entra a una carpa)'}.</p>` : ''}`);
    $('g-cerrar').addEventListener('click', () => ui.cerrar());
    const bg = $('g-guardar'); if (bg) bg.addEventListener('click', () => { ui.alCerrar = () => escena.quitar(obj); ui.cerrar(); });
    document.querySelectorAll('.obj[data-o]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.o;
      ui.alCerrar = () => { if (escena.colocar(id)) { S.inventario[id] -= 1; guardar(true); avanzarMision('decorar'); } };
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
      return `<details ${escena.zona === u.id || (enCasa() && u.id === 'u1') ? 'open' : ''}><summary><strong>Unidad ${u.numero} · ${esc(u.titulo)}</strong> ${u.habilitada ? '' : '<span class="nota">(cerrada)</span>'}</summary><div class="avance">${filas}</div></details>`;
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
      if (esDocente()) { volverAlPortal(); return; }
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
    const enBase = escena && enCasa();
    if (k === 'b' && enBase) abrirFabricar();
    else if (k === 'g' && enBase) abrirDecorar();
    else if (k === 'n') abrirMisiones();
    else if (k === 'r' && escena && escena.objetivo && escena.objetivo.tipo === 'colocado') escena.quitar(escena.objetivo);
    else if (k === 'm') abrirMapa();
    else if (k === '1') equipar('hacha');
    else if (k === '2') equipar('pico');
    else if (k === '3') equipar('espada');
    else if (k === 'q') abrirEquipo();
  });
  $('btn-equipo').addEventListener('click', abrirEquipo);
  $('btn-base').addEventListener('click', () => abrirFabricar());
  $('btn-decorar').addEventListener('click', abrirDecorar);
  $('btn-mapa').addEventListener('click', abrirMapa);
  $('btn-misiones').addEventListener('click', abrirMisiones);
  $('hud-misiones').addEventListener('click', abrirMisiones);
  $('btn-portal').addEventListener('click', volverAlPortal);
  async function volverAlPortal() {
    const b = $('btn-portal'); b.disabled = true;
    guardar(true); await subir();
    location.href = 'docente.html';
  }
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
  let ultimaCarpa = null;
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
    init(data) { this.zona = (data && data.zona) || 'base'; this.desde = data && data.desde; this.carpa = data && data.carpa; }

    preload() {
      if (!this.textures.exists('kenney')) this.load.image('kenney', 'assets/kenney_roguelike.png');
      if (!this.textures.exists('kenney_in')) this.load.image('kenney_in', 'assets/kenney_indoor.png');
      const hoja = (key, url) => { if (!this.textures.exists(key)) this.load.spritesheet(key, url, { frameWidth: 64, frameHeight: 64 }); };
      for (const p of PERSONAJES) for (const a of ['nada', 'cuero', 'cristal']) hoja(`pj_${p.id}_${a}`, `assets/pj/${p.id}_${a}.png`);
      for (const c of ['hacha_male', 'hacha_thin', 'pico_male', 'pico_thin', 'espada_fg', 'espada_bg', 'espada2_fg', 'espada2_bg']) hoja(`capa_${c}`, `assets/capas/${c}.png`);
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
      if (!MUNDOS[this.zona] && this.zona !== 'pieza') this.zona = 'base';
      if (this.zona === 'base') this.crearBase(); else if (this.zona === 'pieza') this.crearPieza(); else this.crearMundo(MUNDOS[this.zona]);
      this.crearJugador();
      this.physics.world.setBounds(0, 0, this.ancho * TILE, this.alto * TILE);
      this.cameras.main.setBounds(0, 0, this.ancho * TILE, this.alto * TILE);
      this.cameras.main.startFollow(this.jugador, true, 0.15, 0.15);
      this.cameras.main.setRoundPixels(true);
      this.cameras.main.setBackgroundColor(this.zona === 'base' ? '#2f6b47' : this.zona === 'pieza' ? '#140d09' : MUNDOS[this.zona].fondo);
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
      if (MUNDOS[this.zona]) {
        misionesDe(this.zona);
        this.time.addEvent({ delay: 40000, loop: true, callback: () => { if (S.vida < vidaMax() && !this.enCombate) { S.vida += 1; pintarHUD(); } } });
      }
      this.otros = new Map();
      this.cambios = new Map();
      this.canal = null;
      if (MUNDOS[this.zona] && S.grupo && coopActivo()) this.iniciarCoop();
      this.events.once('shutdown', () => { if (this.canal) { this.canal.salir(); this.canal = null; } pintarCoop(); });
      pintarHUD();
      pintarCoop();
      latir();
      if (MUNDOS[this.zona]) this.actualizarSello();
      if (this.zona === 'pieza' && !(S.pieza || []).length) setTimeout(() => toast('¡Esta es tu pieza! Fabrica muebles con B (pestaña Muebles) y colócalos con G.'), 700);
      revisarPendientes();
    }

    // ---------- texturas ----------
    tex(key, w, h, partes, hoja = 'kenney') {
      if (this.textures.exists(key)) return;
      const src = this.textures.get(hoja).getSourceImage();
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
      // Decorativos y muebles del catálogo
      for (const o of OBJETOS) {
        const [c, r, w, h] = o.t, partes = [];
        for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) partes.push([c + dx, r + dy, dx, dy]);
        this.tex(o.tex, w, h, partes, o.h === 'i' ? 'kenney_in' : 'kenney');
      }
      this.tex('tapiz_pared', 1, 1, [[24, 1, 0, 0]], 'kenney_in');
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
      for (const p of PERSONAJES) for (const a of ['nada', 'cuero', 'cristal']) {
        for (const [d, fila] of Object.entries(DIRS)) {
          const key = `pj_${p.id}_${a}_${d}`;
          if (!this.anims.exists(key)) this.anims.create({ key, frames: this.anims.generateFrameNumbers(`pj_${p.id}_${a}`, { start: fila * 9 + 1, end: fila * 9 + 8 }), frameRate: 12, repeat: -1 });
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
      this.limites = { x0: 2, y0: 2, x1: this.ancho - 3, y1: this.alto - 3 };
      this.ocupadoPiso = new Set(); this.ocupadoPared = new Set();
      (S.colocados || []).forEach((c) => this.dibujarColocado(c));
      this.inicio = this.desde && this.desde !== 'muerte' ? { x: 20 * TILE + 16, y: 12 * TILE + 24 } : { x: 12 * TILE + 16, y: 9 * TILE + 20 };
      if (this.desde === 'pieza' && this.carpa && !this.ocupado.has(`${this.carpa.x},${this.carpa.y + 1}`) && this.carpa.y + 1 <= this.limites.y1) {
        this.inicio = { x: this.carpa.x * TILE, y: (this.carpa.y + 1) * TILE + 26 };
      }
    }

    // ---------- pieza (dentro de la carpa) ----------
    crearPieza() {
      this.ancho = 14; this.alto = 11;
      this.rnd = azar(9);
      const PISO = fr(8, 2), PX = 7;
      const data = [];
      for (let y = 0; y < this.alto; y++) {
        const fila = [];
        for (let x = 0; x < this.ancho; x++) fila.push((x >= 1 && x <= 12 && y >= 3 && y <= 9) || (x === PX && y === 10) ? PISO : -1);
        data.push(fila);
      }
      this.suelo(data);
      const W = this.ancho * TILE, H = this.alto * TILE;
      // paredes: tapiz arriba, madera oscura alrededor
      for (let y = 1; y <= 2; y++) for (let x = 1; x <= 12; x++) this.add.image(x * TILE + 16, y * TILE + 16, 'tapiz_pared').setScale(2).setDepth(-9);
      const g = this.add.graphics().setDepth(-8);
      g.fillStyle(0x3b2618, 1);
      g.fillRect(0, 0, W, TILE); g.fillRect(0, 0, TILE, H); g.fillRect(W - TILE, 0, TILE, H);
      g.fillRect(0, 10 * TILE, PX * TILE, TILE); g.fillRect((PX + 1) * TILE, 10 * TILE, W - (PX + 1) * TILE, TILE);
      g.fillStyle(0x24160d, 1); g.fillRect(TILE, 3 * TILE - 4, 12 * TILE, 5);
      g.fillStyle(0x5a3a22, 1); g.fillRect(TILE - 4, TILE - 4, 12 * TILE + 8, 4); g.fillRect(TILE - 4, TILE - 4, 4, 9 * TILE + 8); g.fillRect(13 * TILE, TILE - 4, 4, 9 * TILE + 8);
      g.fillRect(TILE - 4, 10 * TILE, (PX - 1) * TILE + 4, 4); g.fillRect((PX + 1) * TILE, 10 * TILE, 5 * TILE + 4, 4);
      // salida
      this.add.image(PX * TILE + 16, 10 * TILE + 16, 'd_alf_oval').setScale(1.4, 2).setDepth(-7).setAlpha(0.9);
      this.add.text(PX * TILE + 16, 10 * TILE + 16, 'SALIDA', { fontFamily: 'Fredoka, Nunito, sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#fff3d6', stroke: '#24160d', strokeThickness: 3 }).setOrigin(0.5).setResolution(3).setDepth(-6);
      this.solido(W / 2, (3 * TILE - 6) / 2, W, 3 * TILE - 6);
      this.solido(TILE / 2, H / 2, TILE, H); this.solido(W - TILE / 2, H / 2, TILE, H);
      this.solido((PX * TILE) / 2, 10.5 * TILE, PX * TILE, TILE); this.solido((W + (PX + 1) * TILE) / 2, 10.5 * TILE, W - (PX + 1) * TILE, TILE);
      this.objetos.push({ tipo: 'puerta', x: PX * TILE + 16, y: 10 * TILE + 6, activo: true });
      this.limites = { x0: 1, y0: 3, x1: 12, y1: 9 };
      this.ocupadoPiso = new Set(); this.ocupadoPared = new Set();
      this.marcar(PX, 9); this.ocupadoPiso.add(`${PX},9`);
      (S.pieza || []).forEach((c) => this.dibujarColocado(c));
      this.inicio = { x: PX * TILE + 16, y: 9 * TILE + 26 };
    }

    // ---------- objetos colocados (base y pieza) ----------
    // (x, y) es la casilla de abajo a la derecha del objeto
    celdas(o, x, y) {
      const [, , w, h] = o.t, filas = o.pared ? h : o.piso ? h : (o.pie || 1), out = [];
      for (let dy = 0; dy < filas; dy++) for (let dx = 0; dx < w; dx++) out.push([x - dx, y - dy]);
      return out;
    }
    conjunto(o) { return o.pared ? this.ocupadoPared : o.piso ? this.ocupadoPiso : this.ocupado; }
    dibujarColocado(c) {
      const o = OBJ[c.k]; if (!o) return;
      const [, , w, h] = o.t, pie = o.pie || 1;
      const s = this.sprite(o.tex, c.x, c.y, 1 - 1 / (2 * w));
      if (o.piso) s.setDepth(-5); else if (o.pared) s.setDepth(-6);
      const cx = (c.x + 1) * TILE - w * 16;
      let z = null;
      if (!o.piso && !o.pared && !o.paso) {
        const alto = o.carpa ? 28 : pie * TILE - 12;
        z = this.solido(cx, (c.y + 1) * TILE - 2 - alto / 2, o.carpa ? 56 : Math.max(20, w * TILE - 10), alto);
      }
      const celdas = this.celdas(o, c.x, c.y), set = this.conjunto(o);
      celdas.forEach(([x, y]) => set.add(`${x},${y}`));
      const y = o.pared ? 3 * TILE - 4 : o.piso ? (c.y + 1) * TILE - (h * TILE) / 2 : (c.y + 1) * TILE - 10 - (pie - 1) * 16;
      this.objetos.push({ tipo: 'colocado', c, s, z, x: cx, y, activo: true, nombre: o.nombre, carpa: Boolean(o.carpa), piso: Boolean(o.piso), celdas, set });
    }
    colocar(id) {
      const o = OBJ[id];
      const [, , w, h] = o.t;
      const L = this.limites;
      const lista = this.zona === 'pieza' ? (S.pieza = S.pieza || []) : (S.colocados = S.colocados || []);
      const tjx = Math.floor(this.jugador.x / TILE), tjy = Math.floor((this.jugador.y - 4) / TILE);
      let tx, ty;
      if (o.pared) {
        if (this.zona !== 'pieza' || tjy !== L.y0 || this.dir !== 'up') { toast('Esto se cuelga en la pared: párate junto a la pared de arriba y mira hacia ella.', 'alerta'); return false; }
        tx = tjx; ty = 2;
        if (tx - w + 1 < L.x0 && tx + w - 1 <= L.x1) tx = L.x0 + w - 1;
      } else {
        const filas = o.piso ? h : (o.pie || 1);
        tx = this.dir === 'right' ? tjx + w : this.dir === 'left' ? tjx - 1 : tjx + Math.floor((w - 1) / 2);
        ty = this.dir === 'up' ? tjy - 1 : this.dir === 'down' ? tjy + filas : tjy;
      }
      const celdas = this.celdas(o, tx, ty), set = this.conjunto(o);
      const fuera = ([x, y]) => x < L.x0 || x > L.x1 || (o.pared ? y < 1 || y > 2 : y < L.y0 || y > L.y1);
      const bloqueada = ([x, y]) => set.has(`${x},${y}`) || (!o.piso && !o.pared && Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y - 6, x * TILE + 16, y * TILE + 16) < 18);
      if (celdas.some(fuera) || celdas.some(bloqueada) || (!o.piso && !o.pared && ty - h + 1 < 1)) {
        toast(o.pared ? 'No hay espacio en esa parte de la pared. Muévete un poco.' : 'No hay espacio libre justo delante. Muévete a un lugar despejado.', 'alerta');
        return false;
      }
      const c = { k: id, x: tx, y: ty };
      lista.push(c);
      this.dibujarColocado(c);
      this.celebrar((tx + 1) * TILE - w * 16, (ty + 1) * TILE - 20);
      return true;
    }
    quitar(obj) {
      if (!obj || !obj.activo) return;
      if (this.zona === 'pieza') S.pieza = (S.pieza || []).filter((c) => c !== obj.c);
      else S.colocados = S.colocados.filter((c) => c !== obj.c);
      S.inventario[obj.c.k] = (S.inventario[obj.c.k] || 0) + 1;
      obj.s.destroy(); if (obj.z) obj.z.destroy();
      obj.activo = false;
      obj.celdas.forEach(([x, y]) => obj.set.delete(`${x},${y}`));
      guardar(true);
      toast(`Guardaste: ${obj.nombre}. Puedes volver a colocarlo con Decorar (G).`);
    }
    entrarPieza(obj) {
      ultimaCarpa = { x: obj.c.x, y: obj.c.y };
      S.zona = 'pieza';
      guardar(true);
      this.scene.restart({ zona: 'pieza', desde: 'base' });
    }
    salirPieza() {
      S.zona = 'base';
      guardar(true);
      this.scene.restart({ zona: 'base', desde: 'pieza', carpa: ultimaCarpa });
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
      if (S.herramienta === 'pico' && !tiene('pico')) S.herramienta = 'hacha';
      this.jugador = this.physics.add.sprite(this.inicio.x, this.inicio.y, `pj_${S.pj}_${texArmadura(S.armadura)}`, DIRS.down * 9);
      this.jugador.setOrigin(0.5, 0.9);
      this.jugador.body.setSize(18, 10).setOffset(23, 50);
      this.jugador.setCollideWorldBounds(true);
      this.physics.add.collider(this.jugador, this.obstaculos);
      this.capasJ = this.crearCapas();
      this.vestirJugador();
    }
    // Capas que acompañan a un personaje: la parte trasera de la espada y lo que lleva en la mano
    crearCapas() {
      return { atras: this.add.sprite(0, 0, 'capa_espada_bg', 0).setOrigin(0.5, 0.9).setVisible(false), mano: this.add.sprite(0, 0, 'capa_hacha_male', 0).setOrigin(0.5, 0.9).setVisible(false) };
    }
    vestir(base, capas, pj, armadura, mano, arma) {
      const key = `pj_${pj}_${texArmadura(armadura)}`;
      if (base.texture.key !== key) { base.anims.stop(); base.setTexture(key, Number(base.frame.name) || 0); }
      const espada = mano === 'espada' && ARMAS[arma];
      capas.atras.setVisible(Boolean(espada));
      if (espada) capas.atras.setTexture(`capa_${arma}_bg`);
      const tex = espada ? `capa_${arma}_fg` : mano === 'hacha' || mano === 'pico' ? `capa_${mano}_${cuerpoDe(pj)}` : null;
      capas.mano.setVisible(Boolean(tex));
      if (tex) capas.mano.setTexture(tex);
      this.seguir(base, capas);
    }
    seguir(base, capas) {
      const f = base.frame.name;
      for (const [c, dz] of [[capas.atras, -0.01], [capas.mano, 0.01]]) {
        if (!c.visible) continue;
        c.setPosition(base.x, base.y).setFrame(f).setDepth(base.depth + dz).setAlpha(base.alpha);
      }
    }
    vestirJugador() {
      if (!this.jugador) return;
      this.vestir(this.jugador, this.capasJ, S.pj, S.armadura, S.herramienta, S.arma);
      if (this.ultimoMov) this.ultimoMov.t = 0;   // avisar el cambio al grupo
    }
    ajustarZoom() {
      const { width, height } = this.scale;
      const cam = this.cameras.main;
      cam.setZoom(Math.max(1, Math.min(3, Math.floor(Math.min(width / 560, height / 315) * 2) / 2)));
      if (this.zona === 'pieza' && this.jugador) {
        // La pieza es pequeña: si cabe en pantalla, se centra; si no, la cámara sigue al jugador
        const W = this.ancho * TILE, H = this.alto * TILE;
        if (W * cam.zoom <= width && H * cam.zoom <= height - 40) { cam.stopFollow(); cam.removeBounds(); cam.centerOn(W / 2, H / 2 - 10); }
        else { cam.setBounds(0, 0, W, H); cam.startFollow(this.jugador, true, 0.15, 0.15); }
      }
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
      this.seguir(j, this.capasJ);
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
      if (S.arma && S.herramienta !== 'espada') equipar('espada');
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
          avanzarMision(e.clase);
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
        const lim = o.tipo === 'jefe' ? 80 : ['fogata', 'portal', 'cofre_base', 'puerta'].includes(o.tipo) || o.carpa ? 50 : o.piso ? 44 : 36;
        const pena = o.piso ? 30 : 0;
        if (d < lim && d - lim + pena < puntaje) { mejor = o; puntaje = d - lim + pena; }
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
        case 'colocado': return o.carpa ? 'Entrar a tu pieza (R: guardar la carpa)' : `Guardar ${o.nombre.toLowerCase()}`;
        case 'puerta': return 'Salir a tu base';
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
      if (o.tipo === 'colocado') return o.carpa ? this.entrarPieza(o) : this.quitar(o);
      if (o.tipo === 'puerta') return this.salirPieza();
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
      avanzarMision({ arbol: 'talar', roca: 'picar', agua: 'agua', cofre: 'cofre' }[o.tipo]);
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
      this.enGuarida = new Map(); this.yoEnGuarida = false; this.enJefe = false;
      this.ultimoMov = { t: 0, x: 0, y: 0, m: false };
      this.primeraPresencia = true;
      const c = new Coop.Canal(`mw-${nivelNum()}-${this.zona}-g${S.grupo}`, idJuego, meta);
      this.canal = c;
      c.alEstado = (e) => {
        if (e === 'ok') { c.emitir('hola', { id: idJuego }); this.ultimoMov.t = 0; if (this.yoEnGuarida) this.avisarGuarida(); }
        if (e === 'error') toast('No se pudo conectar con tu grupo: por ahora juegas solo.', 'alerta');
        pintarCoop();
      };
      c.alCambiarPresencia = (p) => this.sincronizarPresencia(p);
      c.on('mov', (d) => this.recibirMov(d));
      c.on('nodo', (d) => { const o = this.objetos[d.i]; if (o && o.idx === d.i) { this.cambios.set(d.i, { n: d.n, t: Date.now() }); this.aplicarNodo(o, d.n, 0); } });
      c.on('hola', (d) => {
        this.ultimoMov.t = 0;
        if (this.yoEnGuarida) this.avisarGuarida();
        const otros = Object.keys(c.presencia).filter((k) => k !== d.id).concat(idJuego).sort();
        if (otros[0] !== idJuego) return;
        c.emitir('estado', { para: d.id, nodos: [...this.cambios].map(([i, v]) => [i, v.n, Date.now() - v.t]).filter((x) => x[2] < 150000), jefe: this.jefeParaEnviar() });
      });
      c.on('estado', (d) => {
        if (d.para !== idJuego) return;
        (d.nodos || []).forEach(([i, n, e]) => { const o = this.objetos[i]; if (o && o.idx === i) { this.cambios.set(i, { n, t: Date.now() - e }); this.aplicarNodo(o, n, e); } });
        if (d.jefe) this.recibirJefe(d.jefe);
      });
      c.on('guarida', (d) => { if (d.dentro) this.enGuarida.set(d.id, d.listo !== false); else this.enGuarida.delete(d.id); });
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
      const spr = this.add.sprite(this.inicio.x, this.inicio.y, `pj_${pj}_nada`, DIRS.down * 9).setOrigin(0.5, 0.9).setAlpha(0);
      const capas = this.crearCapas();
      const tag = this.add.text(spr.x, spr.y - 60, String(meta.nombre || 'Compañero').slice(0, 28), {
        fontFamily: 'Nunito, sans-serif', fontSize: '11px', fontStyle: 'bold', color: meta.docente ? '#ffd27a' : '#ffffff', backgroundColor: 'rgba(18,32,26,0.8)', padding: { x: 4, y: 1 },
      }).setOrigin(0.5).setResolution(3).setDepth(99990).setAlpha(0);
      this.otros.set(id, { spr, tag, capas, meta, pj, obj: { x: spr.x, y: spr.y }, dir: 'down', h: 'hacha', a: null, w: null, m: false, visto: false });
      this.vestir(spr, capas, pj, null, 'hacha', null);
    }
    quitarOtro(id) {
      const o = this.otros.get(id); if (!o) return;
      o.spr.destroy(); o.tag.destroy(); o.capas.atras.destroy(); o.capas.mano.destroy(); this.otros.delete(id);
    }
    recibirMov(d) {
      const o = this.otros.get(d.id); if (!o) return;
      const h = ['hacha', 'pico', 'espada'].includes(d.h) ? d.h : 'hacha';
      const a = ARMADURAS[d.a] ? d.a : null, w = ARMAS[d.w] ? d.w : null;
      if (h !== o.h || a !== o.a || w !== o.w) { o.h = h; o.a = a; o.w = w; this.vestir(o.spr, o.capas, o.pj, a, h, w); }
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
          o.spr.anims.play(`${o.spr.texture.key}_${dir}`, true);
        } else if (!o.m) { o.spr.anims.stop(); o.spr.setFrame(DIRS[o.dir] * 9); }
        o.spr.setDepth(o.spr.y);
        this.seguir(o.spr, o.capas);
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
      c.emitir('mov', { id: idJuego, x: Math.round(j.x), y: Math.round(j.y), d: this.dir, h: S.herramienta, a: S.armadura || '', w: S.arma || '', m: moviendo });
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
      if (dentro !== this.yoEnGuarida) { this.yoEnGuarida = dentro; this.avisarGuarida(); }
    }
    // Avisa al grupo si estoy en la guarida y si ya cumplí mis misiones
    avisarGuarida() {
      this.actualizarSello();
      if (this.canal && this.guarida) this.canal.emitir('guarida', { id: idJuego, dentro: this.yoEnGuarida, listo: misionesListas(this.zona) });
    }
    actualizarSello() {
      if (!this.jefeTag || !MUNDOS[this.zona]) return;
      const listo = misionesListas(this.zona);
      this.jefeTag.setText(listo ? JEFES[this.zona].nombre : `${JEFES[this.zona].nombre}\n(sellado: cumple tus misiones)`).setAlign('center');
      if (this.jefeSpr) this.jefeSpr.setAlpha(listo ? 1 : 0.55);
    }
    // Solo cuentan los jugadores que ya cumplieron sus misiones
    jugadoresEnGuarida() {
      const ids = [...this.enGuarida].filter(([id, listo]) => listo && this.otros.has(id)).map(([id]) => id);
      if (this.yoEnGuarida && misionesListas(this.zona)) ids.push(idJuego);
      return ids;
    }
    jefeDisponible() { const J = this.jefe; return J && (J.estado === 'libre' || (J.estado === 'vencido' && J.hasta <= Date.now())); }
    textoJefe() {
      if (!misionesListas(this.zona)) { const M = misionesDe(this.zona); return `Jefe sellado: misiones ${M.lista.filter((m) => m.p >= m.n).length} de ${M.lista.length}`; }
      if (!this.canal) return 'Jefe final: viaja con un grupo';
      const J = this.jefe;
      if (J.estado === 'combate') return J.part.includes(idJuego) ? 'Volver al combate' : 'Tu grupo está luchando';
      if (!this.jefeDisponible()) return `Jefe derrotado: vuelve en ${Math.ceil((J.hasta - Date.now()) / 60000)} min`;
      const n = this.jugadoresEnGuarida().length;
      return n >= JEFE_MIN ? `¡Desafiar al jefe! (${n} jugadores)` : `Jefe final: ${n} de ${JEFE_MIN} jugadores listos`;
    }
    pedirJefe() {
      if (!misionesListas(this.zona)) { toast('El jefe está sellado: primero cumple tus 3 misiones de este mundo.', 'alerta'); return abrirMisiones(); }
      if (!this.canal) return abrirInfoJefe(this.zona);
      const J = this.jefe;
      if (S.arma && S.herramienta !== 'espada') equipar('espada');
      if (J.estado === 'combate') { if (J.part.includes(idJuego) && !this.enJefe) { this.enJefe = true; abrirJefe(); } return; }
      if (!this.jefeDisponible()) return toast('El jefe se está recuperando. Vuelve en unos minutos.');
      const n = this.jugadoresEnGuarida().length;
      if (n < JEFE_MIN) return toast(`Faltan ${JEFE_MIN - n} ${JEFE_MIN - n === 1 ? 'compañero' : 'compañeros'} en la guarida con sus misiones cumplidas para desafiar al jefe.`);
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
  window.MathWorld = { escena: () => escena, estado: () => S, sesion: () => sesion, mision: (ev, tema) => avanzarMision(ev, tema), xp: (n) => ganarXP(n) };

  prepararIngreso();
})();
