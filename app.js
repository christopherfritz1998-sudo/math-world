// Math World — página principal (portada del juego) y material de clases por curso y unidad.
// El material vive en contenido.json: para habilitar una unidad, cambiar "habilitada" a true;
// para agregar material, sumar un objeto a "materiales".
// Para activar un acceso que hoy dice «Pronto», cambiar activo: false por activo: true (y su enlace) en ACCESOS.

const $ = (id) => document.getElementById(id);
const esc = (s) => (s ?? '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const QUIETO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PJ = 'juego/assets/pj/';
$('year').textContent = new Date().getFullYear();

// ------------------------------------------------------------------ datos de la portada
const MUNDOS = [
  { id: 'u1', nombre: 'Bosque de los Enteros', unidad: 'Unidad 1 · Números', color: '#5fb35a', jefe: 'Troll Guardián del Bosque', extra: 'Bosque profundo y el Rey Jabalí Ancestral', icono: '🌲',
    cosas: ['Tala, pica y pesca resolviendo ejercicios', 'Construye el puente al Bosque profundo con tu grupo', 'Luciérnagas, colmenas y cofres escondidos'] },
  { id: 'u2', nombre: 'Desierto Algebraico', unidad: 'Unidad 2 · Álgebra y funciones', color: '#e0a64a', jefe: 'Rey Lagarto de las Dunas', extra: 'Valle de la Esfinge', icono: '🏜️',
    cosas: ['Excavaciones arqueológicas y álbum de gemas', 'Laberintos de la Esfinge que cambian cada vez', 'Montacargas cooperativo para subir al valle'] },
  { id: 'u3', nombre: 'Mina de las Formas', unidad: 'Unidad 3 · Geometría', color: '#a07ad6', jefe: 'Minotauro de las Profundidades', extra: 'Profundidades y el Coloso de Magma', icono: '⛏️',
    cosas: ['Carrera de vagonetas contra tus compañeros', 'Rompecabezas de cristales y espejos', 'Elevador a las profundidades de la mina'] },
  { id: 'u4', nombre: 'Glaciar de los Datos', unidad: 'Unidad 4 · Probabilidad y estadística', color: '#6fc3ea', jefe: 'Yeti, Rey de la Escarcha', extra: 'Cima del Glaciar y el Dragón de la Aurora', icono: '🏔️',
    cosas: ['Escala el glaciar sin caer respondiendo bien', 'Guerra de bolas de nieve y hielo movedizo', 'Álbum de copos de nieve exclusivos'] },
];
const GALERIA = [
  ['g_arena', '⚔️ Arena PvP', 'Duelos 1 contra 1 con tu espada y tu armadura.'],
  ['g_dragon', '🐉 Jefes finales', 'Vence al Dragón de la Aurora respondiendo bien bajo presión.'],
  ['g_cristales', '💎 Rompecabezas de cristales', 'Gira los espejos para llevar la luz a todos los cristales.'],
  ['g_bolas', '☃️ Guerra de bolas de nieve', 'Apunta, lanza y fabrica más bolas resolviendo ejercicios.'],
  ['g_carrera', '🛤️ Carrera de vagonetas', 'Salta y agáchate en una carrera contra tu grupo.'],
  ['g_esfinge', '🏛️ La Gran Esfinge', 'Entra al laberinto que cambia cada vez que lo visitas.'],
  ['g_excava', '🏺 Excavaciones', 'Descubre fósiles, tesoros y gemas en el Valle de la Esfinge.'],
  ['g_cima', '🏔️ La Cima del Glaciar', 'Escala, baja en rapel y encuentra el trono del dragón.'],
  ['g_leyendas', '👑 Leyendas del nivel 100', 'Llega al nivel 100 y juega como una leyenda, con su aura dorada.'],
  ['g_clanes', '🏕️ Clanes y guerras', 'Cada victoria en la guerra de clanes mejora la carpa: color, estandarte y trofeos.'],
];
// Personajes: los 8 iniciales y los 10 especiales que se desbloquean por nivel, cada uno con su habilidad especial
// [id, nombre, nivel, habilidad, daño, leyenda]
const PERSONAJES = [['zorro', 'Zorro'], ['luna', 'Luna'], ['puma', 'Puma'], ['copihue', 'Copihue'], ['condor', 'Cóndor'], ['huemul', 'Huemul'], ['pudu', 'Pudú'], ['lobo', 'Lobo'],
  ['fenix', 'Fénix Llameante', 30, '🔥 Llamarada del Fénix', 10], ['trueno', 'Centinela del Trueno', 40, '⚡ Rayo Celestial', 20],
  ['sombra', 'Caballero de las Sombras', 50, '🌑 Golpe Sombrío', 30], ['bosque', 'Guardiana del Bosque', 60, '🌿 Furia de la Naturaleza', 35],
  ['cazadora', 'Cazadora Élfica', 70, '🏹 Lluvia de Flechas', 40], ['ninja', 'Ninja Carmesí', 80, '🗡️ Danza de Katanas', 45],
  ['archimago', 'Archimago Celestial', 90, '🔮 Tormenta Arcana', 50],
  ['emperador', 'Emperador Dorado', 100, '👑 Juicio del Emperador', 60, 1], ['esqueleto', 'Rey Esqueleto', 100, '💀 Ejército de Huesos', 60, 1], ['minotauro', 'Minotauro Titán', 100, '🐂 Embestida del Titán', 60, 1]];
const MASCOTAS = [['buho', 'Búho'], ['fenec', 'Fénec'], ['topo', 'Topo minero'], ['pinguino', 'Pingüino'], ['jabato', 'Jabato'], ['ajolote', 'Ajolote de lava'], ['dragon', 'Dragoncito'], ['grifo', 'Grifo (nivel 50)'], ['fenix', 'Fénix (nivel 70)'], ['unicornio', 'Unicornio (nivel 90)']];
const NOVEDADES = [
  ['🎲', '11 minijuegos nuevos', 'Puente de troncos, Balanza de frutos, Balanza de la caravana, Canales del oasis, Tallado de gemas, Rayo de luz, Carga exacta, Trineo del azar, Estación meteorológica, Mercado y Cerradura del grupo: la matemática es la mecánica, con versión de 7° y 8°.'],
  ['🏛️', 'El Altar de los Dioses', 'Al reunir todas las gemas aparece el quinto mundo: cinco jefes dormidos en sus altares y, al final, el jefe más poderoso del juego.'],
  ['📦', 'Cofre comunitario', 'Todo tu grupo comparte un cofre: lo que cada uno recolecta lo pueden usar todos. Haz pedidos al grupo y revisa el historial del cofre.'],
  ['🏆', 'Meta y ranking de grupos', 'Cada semana tu grupo tiene una meta de respuestas correctas y compite en el ranking del curso por promedio por integrante.'],
  ['🧭', 'Diagnóstico inicial', '12 preguntas sin nota para que el juego sepa qué reforzar contigo desde el primer día.'],
  ['📝', 'Evaluaciones con nota', 'Tu profesor puede lanzar evaluaciones de hasta 20 preguntas, con tiempo y nota de 1,0 a 7,0.'],
  ['🔒', 'Recolectar con cuidado', 'Si te equivocas 3 veces seguidas en un mismo recurso, se bloquea por 5 minutos: piensa antes de responder.'],
  ['📈', 'Nivel 100 alcanzable', 'Nueva curva de experiencia: el nivel 100 se puede lograr durante el año escolar.'],
  ['📱', 'Celular y pantalla completa', 'El juego se ve ordenado en vertical y horizontal, con botón ⛶ de pantalla completa y carga más rápida.'],
  ['♿', 'Accesibilidad', 'Texto grande, colores para daltonismo, alto contraste, letra de lectura fácil y lectura en voz alta de las preguntas.'],
  ['👪', 'Informe para apoderados', 'Tu profesor puede compartir con tu familia un enlace con tu avance: temas que dominas, los que te cuestan y tu evolución semanal.'],
  ['✨', 'Personajes y leyendas', 'Del nivel 30 al 100 se desbloquean personajes especiales con habilidad propia y, en el nivel 100, las 3 leyendas.'],
];
// Accesos de la página: activo:true se puede abrir; activo:false muestra «Pronto»
const ACCESOS = [
  { ico: '🎮', titulo: 'Juego Math World', texto: 'Entra a tu base y sigue tu aventura.', href: 'juego/', activo: true, destacado: true },
  { ico: '📚', titulo: 'Material de clases', texto: 'Guías, presentaciones y controles por curso y unidad.', href: '#/material', activo: true },
  { ico: '🎓', titulo: 'Portal docente', texto: 'Para el profesor: cursos, grupos, desafíos y reportes.', href: 'juego/#docente', activo: true },
  { ico: '❓', titulo: 'Ayuda', texto: 'Preguntas frecuentes sobre el juego.', href: '#ayuda', activo: true },
  { ico: '📝', titulo: 'Evaluaciones', texto: 'Controles y pruebas en línea con sus fechas.', activo: false },
  { ico: '📅', titulo: 'Calendario', texto: 'Pruebas, entregas y actividades del curso.', activo: false },
  { ico: '🏆', titulo: 'Salón de la fama', texto: 'Clanes campeones y logros de cada curso.', href: '#salon', activo: true },
  { ico: '📣', titulo: 'Avisos del profesor', texto: 'Novedades del curso sin entrar al juego.', activo: false },
  { ico: '🧮', titulo: 'Herramientas', texto: 'Calculadora, graficador y conversor de fracciones.', activo: false },
  { ico: '👨‍👩‍👧', titulo: 'Para apoderados', texto: 'Qué es Math World y cómo apoyar en casa.', activo: false },
  { ico: '✉️', titulo: 'Contacto', texto: 'Escríbele a tu profesor.', activo: false },
];
const FAQ = [
  ['¿Cómo entro al juego por primera vez?', 'Presiona «Jugar ahora», elige tu nivel, escribe tu RUT, crea una clave de al menos 4 caracteres y elige tu personaje. Después escribe el código de tu grupo que te da tu profesor.'],
  ['No estoy en la lista del curso, ¿puedo jugar?', 'Sí, como invitado. Presiona «Jugar ahora», abre la pestaña «Invitado» y elige «Pedir acceso»: escribe tu nombre, crea un usuario y una clave. Cuando tu profesor acepte tu solicitud entrarás a la sala de invitados, un solo grupo de hasta 10 jugadores.'],
  ['Olvidé mi clave, ¿qué hago?', 'Pídele a tu profesor que la restablezca desde el portal docente. La próxima vez que entres podrás crear una clave nueva y conservarás todo tu avance.'],
  ['¿Cómo desbloqueo los personajes especiales?', 'Subiendo de nivel. En el nivel 30 se desbloquea el Fénix Llameante y luego uno nuevo cada 10 niveles. En el nivel 100 se desbloquean las 3 leyendas. Cuando llegues al nivel, el juego te avisa y lo puedes elegir en Equipo (tecla Q).'],
  ['¿Cómo funciona la habilidad especial?', 'Los personajes especiales tienen una habilidad que se carga con 5 respuestas correctas seguidas. Cuando está lista, aparece un botón en el combate: al usarla le quita una cantidad fija de vida al enemigo o al jefe. Si te equivocas en una pregunta, la carga vuelve a 0.'],
  ['¿Qué pasa si me equivoco al recolectar?', 'No pierdes vida: ves la respuesta correcta con su explicación y aparece otra pregunta para que lo vuelvas a intentar.'],
  ['Me equivoqué de grupo', 'Avísale a tu profesor: él te puede cambiar de grupo desde su portal. Tu avance personal (nivel, recursos, logros) no se pierde.'],
  ['¿Puedo jugar desde el celular?', 'Sí. El juego tiene una vista especial para teléfonos con un menú ☰. Se ve mejor con el celular en horizontal.'],
  ['¿Por qué no puedo entrar a un mundo?', 'Cada mundo corresponde a una unidad y tu profesor lo abre cuando la empiezan a estudiar en clases. Las zonas especiales se abren construyendo obras con tu grupo.'],
  ['El juego dice que está cerrado', 'Tu profesor abre y cierra el juego para cada curso. Cuando lo abra podrás seguir donde quedaste: tu avance queda guardado.'],
  ['Encontré un error o tengo una idea', 'Dentro del juego usa el botón ⚠️ para reportar un problema o 💡 Novedades para enviar una idea. Le llegan directo a tu profesor.'],
];

// ------------------------------------------------------------------ utilidades
const toast = (txt) => { const t = $('toast-web'); t.textContent = txt; t.classList.add('ver'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('ver'), 2600); };
function inclinar(el, fuerza = 10) {
  if (QUIETO || window.matchMedia('(pointer: coarse)').matches) return;
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-y * fuerza).toFixed(2)}deg) rotateY(${(x * fuerza).toFixed(2)}deg) translateY(-6px)`;
    el.style.setProperty('--mx', `${(x + 0.5) * 100}%`); el.style.setProperty('--my', `${(y + 0.5) * 100}%`);
  });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
}
function onda(e) {
  const b = e.currentTarget, r = b.getBoundingClientRect(), s = document.createElement('span');
  s.className = 'onda'; s.style.left = `${e.clientX - r.left}px`; s.style.top = `${e.clientY - r.top}px`;
  b.appendChild(s); setTimeout(() => s.remove(), 650);
}
const sprite = (id, cls = '') => `<span class="sprite ${cls}" style="background-image:url('${PJ}${id}_nada.png')"></span>`;
const mascota = (i, cls = '') => `<span class="masc ${cls}" style="--fila:${i}"></span>`;

// ------------------------------------------------------------------ portada
function portada() {
  // letras del título que saltan
  $('letras').innerHTML = [...'Math World'].map((c, i) => c === ' ' ? '<span class="esp"> </span>' : `<span style="--i:${i}">${c}</span>`).join('');
  // símbolos matemáticos flotando
  const S = ['π', '∑', '√', '÷', '∞', '%', '×', '±', '½', 'x²', '≠', '∠', 'Δ', '7', '8', '+', '='];
  $('simbolos').innerHTML = Array.from({ length: 22 }, (_, i) => `<span style="--x:${(i * 47) % 100}%;--d:${8 + (i % 7) * 2}s;--r:${(i % 2 ? -1 : 1) * (10 + i * 7)}deg;--t:${0.8 + (i % 4) * 0.35}rem;animation-delay:-${i * 1.3}s">${S[i % S.length]}</span>`).join('');
  // desfile de personajes con sus mascotas
  const fila = [['zorro', 0], ['luna', 3], ['emperador', 7], ['copihue', 1], ['minotauro', 6], ['cazadora', 4], ['archimago', 9], ['fenix', 5], ['esqueleto', 8], ['ninja', 2]];
  $('desfile').innerHTML = fila.map(([p, m], i) => `<div class="caminante" style="--d:${26 + (i % 3) * 4}s;--retraso:-${i * 3.1}s;--y:${(i % 3) * 10}px">${sprite(p, 'camina')}${mascota(m, 'sigue')}</div>`).join('');
  // fondo con movimiento suave al mover el mouse
  if (!QUIETO) window.addEventListener('pointermove', (e) => {
    const x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
    $('hero-fondo').style.transform = `scale(1.12) translate(${-x * 18}px, ${-y * 12}px)`;
    $('simbolos').style.transform = `translate(${x * 26}px, ${y * 18}px)`;
  });
}
function contadores() {
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    const b = en.target, fin = Number(b.dataset.contar), t0 = performance.now();
    const paso = (t) => { const k = Math.min(1, (t - t0) / 1400); b.textContent = `${Math.round(fin * (1 - Math.pow(1 - k, 3)))}${b.hasAttribute('data-mas') && k >= 1 ? '+' : ''}`; if (k < 1) requestAnimationFrame(paso); };
    requestAnimationFrame(paso);
  }));
  document.querySelectorAll('[data-contar]').forEach((b) => io.observe(b));
}

// ------------------------------------------------------------------ mundos
function mundos() {
  $('lista-mundos').innerHTML = MUNDOS.map((m, i) => `
    <button type="button" class="mundo aparece" style="--c:${m.color};--retraso:${i * 90}ms" aria-expanded="false">
      <span class="mundo-img" style="background-image:url('img/mundo_${m.id}.jpg')"></span>
      <span class="mundo-brillo"></span>
      <span class="mundo-cara">
        <span class="mundo-ico">${m.icono}</span>
        <small>${esc(m.unidad)}</small>
        <strong>${esc(m.nombre)}</strong>
        <span class="mundo-ver">Toca para ver más</span>
      </span>
      <span class="mundo-detalle">
        <small>${esc(m.unidad)}</small>
        <strong>${m.icono} ${esc(m.nombre)}</strong>
        <ul>${m.cosas.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
        <span class="mundo-jefe">👹 Jefe: ${esc(m.jefe)}</span>
        <span class="mundo-jefe">✨ Zona secreta: ${esc(m.extra)}</span>
      </span>
    </button>`).join('');
  document.querySelectorAll('.mundo').forEach((b) => {
    inclinar(b, 8);
    b.addEventListener('click', () => { const on = b.classList.toggle('abierto'); b.setAttribute('aria-expanded', String(on)); });
  });
}

// ------------------------------------------------------------------ galería (carrusel)
function galeria() {
  const pista = $('pista'), n = GALERIA.length;
  pista.innerHTML = GALERIA.map(([img, t, d], i) => `<figure class="diapo" aria-roledescription="diapositiva" aria-label="${i + 1} de ${n}"><img src="img/${img}.jpg" alt="${esc(t)}" loading="lazy"><figcaption><b>${esc(t)}</b><span>${esc(d)}</span></figcaption></figure>`).join('');
  $('car-puntos').innerHTML = GALERIA.map((_, i) => `<button type="button" aria-label="Ir a la imagen ${i + 1}" data-ir="${i}"></button>`).join('');
  let i = 0, auto = null;
  const ir = (k) => {
    i = (k + n) % n;
    pista.style.transform = `translateX(-${i * 100}%)`;
    document.querySelectorAll('.diapo').forEach((d, j) => d.classList.toggle('activa', j === i));
    document.querySelectorAll('[data-ir]').forEach((b, j) => b.setAttribute('aria-current', String(j === i)));
  };
  const reiniciar = () => { clearInterval(auto); if (!QUIETO) auto = setInterval(() => ir(i + 1), 4500); };
  $('car-izq').addEventListener('click', () => { ir(i - 1); reiniciar(); });
  $('car-der').addEventListener('click', () => { ir(i + 1); reiniciar(); });
  document.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => { ir(Number(b.dataset.ir)); reiniciar(); }));
  $('carrusel').addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') { ir(i - 1); reiniciar(); } if (e.key === 'ArrowRight') { ir(i + 1); reiniciar(); } });
  let x0 = null;
  $('carrusel').addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  $('carrusel').addEventListener('pointerup', (e) => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) { ir(i + (dx < 0 ? 1 : -1)); reiniciar(); } });
  $('carrusel').addEventListener('mouseenter', () => clearInterval(auto));
  $('carrusel').addEventListener('mouseleave', reiniciar);
  ir(0); reiniciar();
}

// ------------------------------------------------------------------ personajes y mascotas
function elenco() {
  $('elenco').innerHTML = PERSONAJES.map(([id, nombre, nivel, hab, dano, leyenda], i) => `
    <button type="button" class="pj ${nivel ? 'esp' : ''} ${leyenda ? 'rey' : ''} aparece" style="--retraso:${i * 40}ms" aria-label="${esc(nombre)}${nivel ? `, se desbloquea en el nivel ${nivel}` : ''}" ${nivel ? `data-info="${esc(`${nombre} · nivel ${nivel} · ${hab}: quita ${dano}`)}"` : ''}>
      ${leyenda ? '<span class="corona">⭐</span>' : ''}${nivel ? `<span class="nv">Nv. ${nivel}</span>` : ''}${sprite(id)}<small>${esc(nombre)}</small>${nivel ? `<em>${esc(hab.split(' ')[0])} −${dano}</em>` : ''}
    </button>`).join('');
  document.querySelectorAll('.pj').forEach((b) => {
    const s = b.querySelector('.sprite');
    const caminar = () => { s.classList.add('camina'); };
    const parar = () => { s.classList.remove('camina'); };
    b.addEventListener('pointerenter', caminar); b.addEventListener('pointerleave', parar);
    b.addEventListener('click', () => { b.classList.remove('salta'); void b.offsetWidth; b.classList.add('salta'); s.classList.toggle('camina'); if (b.dataset.info) toast(`✨ ${b.dataset.info}`); });
  });
  $('corral').innerHTML = `<span class="etq">Mascotas</span><div class="mascotas-fila">${MASCOTAS.map(([id, nombre], i) => `<button type="button" class="m-chip" style="--retraso:${i * 60}ms" aria-label="${esc(nombre)}">${mascota(i)}<small>${esc(nombre)}</small></button>`).join('')}</div>`;
  document.querySelectorAll('.m-chip').forEach((b) => b.addEventListener('click', () => { b.classList.remove('salta'); void b.offsetWidth; b.classList.add('salta'); }));
}

// ------------------------------------------------------------------ novedades, accesos y ayuda
function novedades() {
  $('lista-novedades').innerHTML = NOVEDADES.map(([ico, t, d], i) => `<article class="novedad aparece" style="--retraso:${i * 70}ms"><span class="nov-ico">${ico}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join('');
  document.querySelectorAll('.novedad').forEach((el) => inclinar(el, 6));
}
function accesos() {
  $('lista-accesos').innerHTML = ACCESOS.map((a, i) => {
    const cuerpo = `<span class="acc-ico">${a.ico}</span><span class="acc-txt"><strong>${esc(a.titulo)}</strong><small>${esc(a.texto)}</small></span>${a.activo ? '<span class="acc-flecha">→</span>' : '<span class="acc-pronto">Pronto</span>'}`;
    return a.activo
      ? `<a class="acceso ${a.destacado ? 'destacado' : ''} aparece" style="--retraso:${i * 45}ms" href="${esc(a.href)}">${cuerpo}</a>`
      : `<button type="button" class="acceso bloqueado aparece" style="--retraso:${i * 45}ms" data-pronto="${esc(a.titulo)}">${cuerpo}</button>`;
  }).join('');
  document.querySelectorAll('.acceso').forEach((el) => { inclinar(el, 5); el.addEventListener('pointerdown', onda); });
  document.querySelectorAll('[data-pronto]').forEach((b) => b.addEventListener('click', () => {
    b.classList.remove('sacude'); void b.offsetWidth; b.classList.add('sacude');
    toast(`🚧 «${b.dataset.pronto}» estará disponible muy pronto`);
  }));
}
function ayuda() {
  $('faq').innerHTML = FAQ.map(([p, r], i) => `<details class="preg aparece" style="--retraso:${i * 50}ms"><summary>${esc(p)}<span class="mas" aria-hidden="true"></span></summary><p>${esc(r)}</p></details>`).join('');
}

// ------------------------------------------------------------------ apariciones al hacer scroll y menú
function animarScroll() {
  const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); } }), { threshold: 0.12 });
  document.querySelectorAll('.aparece').forEach((el) => (QUIETO ? el.classList.add('visible') : io.observe(el)));
  const nav = $('nav');
  const fijar = () => nav.classList.toggle('solida', window.scrollY > 40 || !$('app').hidden);
  window.addEventListener('scroll', fijar, { passive: true }); fijar();
  const burger = $('nav-burger');
  burger.addEventListener('click', () => { const on = nav.classList.toggle('abierta'); burger.setAttribute('aria-expanded', String(on)); });
  document.querySelectorAll('.nav-links a').forEach((a) => a.addEventListener('click', () => { nav.classList.remove('abierta'); burger.setAttribute('aria-expanded', 'false'); }));
  document.querySelectorAll('.btn').forEach((b) => b.addEventListener('pointerdown', onda));
}

// ------------------------------------------------------------------ material de clases (#/material, #/7basico, #/7basico/u1)
const app = $('app');
const TIPOS = ['Guía', 'Presentación', 'Control', 'Juego'];
let data = null;
function vistaMaterial() {
  app.innerHTML = `
    <p class="crumbs"><a href="#/">Inicio</a> / Material de clases</p>
    <h2>📚 Material de clases</h2>
    <p class="intro-mat">Elige tu curso para ver las guías, presentaciones y controles de cada unidad. Las unidades se habilitan a medida que avanzamos en clases.</p>
    <div class="cursos">${data.cursos.map((c) => {
      const activas = c.unidades.filter((u) => u.habilitada).length;
      return `<a class="curso" href="#/${c.id}"><span class="curso-num">${esc(c.nombre.split(' ')[0])}</span>
        <span class="curso-txt"><strong>${esc(c.nombre)}</strong><span>${activas} de ${c.unidades.length} unidades disponibles</span></span><span class="arrow" aria-hidden="true">→</span></a>`;
    }).join('')}</div>`;
}
function vistaCurso(curso) {
  app.innerHTML = `
    <p class="crumbs"><a href="#/">Inicio</a> / <a href="#/material">Material</a> / ${esc(curso.nombre)}</p>
    <h2>${esc(curso.nombre)}</h2>
    <div class="unidades">${curso.unidades.map((u, i) => {
      const n = u.materiales.length, M = MUNDOS[i] || {};
      const inner = `<span class="u-num" style="--c:${M.color || '#f2b544'}">Unidad ${u.numero} ${M.icono || ''}</span><h3>${esc(u.titulo)}</h3>
        <ul>${u.temas.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        <span class="u-foot">${u.habilitada ? `${n} ${n === 1 ? 'material' : 'materiales'} →` : '🔒 Próximamente'}</span>`;
      return u.habilitada ? `<a class="unidad" href="#/${curso.id}/${u.id}">${inner}</a>` : `<div class="unidad bloqueada" aria-disabled="true">${inner}</div>`;
    }).join('')}</div>`;
}
function tarjeta(m) {
  const esJuego = m.tipo === 'Juego';
  return `<article class="card"><span class="tag t-${esc(m.tipo)}">${esc(m.tipo)}</span><h4>${esc(m.titulo)}</h4>${m.descripcion ? `<p>${esc(m.descripcion)}</p>` : '<p></p>'}
    <a class="dl" href="${esc(m.archivo)}" ${esJuego ? 'target="_blank" rel="noopener"' : 'download'}>${esJuego ? 'Jugar' : 'Descargar'}</a></article>`;
}
function vistaUnidad(curso, u) {
  if (!u.habilitada) return vistaCurso(curso);
  const grupos = TIPOS.map((t) => [t, u.materiales.filter((m) => m.tipo === t)]).filter(([, l]) => l.length);
  app.innerHTML = `
    <p class="crumbs"><a href="#/">Inicio</a> / <a href="#/material">Material</a> / <a href="#/${curso.id}">${esc(curso.nombre)}</a> / Unidad ${u.numero}</p>
    <h2><span class="u-num">Unidad ${u.numero}</span>${esc(u.titulo)}</h2>
    <p class="temas">${u.temas.map(esc).join(' · ')}</p>
    ${grupos.length ? grupos.map(([t, l]) => `<section class="grupo"><h3>${t === 'Guía' ? 'Guías' : t === 'Presentación' ? 'Presentaciones' : t === 'Control' ? 'Controles' : 'Juegos'}</h3><div class="grid">${l.map(tarjeta).join('')}</div></section>`).join('')
      : '<p class="empty">Pronto habrá materiales en esta unidad. Mientras tanto, ¡practica en el juego! <a href="juego/">Jugar →</a></p>'}`;
}
function router() {
  const h = location.hash;
  // anclas de la portada (#mundos, #ayuda…): mostrar la portada y bajar a la sección
  if (h && !h.startsWith('#/')) {
    $('landing').hidden = false; app.hidden = true; document.body.classList.remove('en-material');
    const el = document.querySelector(h); if (el) setTimeout(() => el.scrollIntoView({ behavior: QUIETO ? 'auto' : 'smooth' }), 30);
    return;
  }
  const [, cId, uId] = h.replace(/^#\/?/, '/').split('/');
  const enMaterial = cId === 'material' || (data && data.cursos.some((c) => c.id === cId));
  $('landing').hidden = enMaterial; app.hidden = !enMaterial; document.body.classList.toggle('en-material', enMaterial);
  $('nav').classList.toggle('solida', enMaterial || window.scrollY > 40);
  if (!enMaterial) { if (!h || h === '#/') window.scrollTo({ top: 0 }); return; }
  if (!data) { app.innerHTML = '<p class="empty">Cargando material…</p>'; return; }
  const curso = data.cursos.find((c) => c.id === cId), unidad = curso && curso.unidades.find((u) => u.id === uId);
  if (curso && unidad) vistaUnidad(curso, unidad); else if (curso) vistaCurso(curso); else vistaMaterial();
  window.scrollTo({ top: 0 });
}

// ------------------------------------------------------------------ inicio
// ------------------------------------------------------------------ salón de la fama (datos públicos: solo clanes y cifras)
async function salon() {
  const el = $('lista-salon'); if (!el) return;
  const cfg = window.MW_CONFIG || {};
  const nombres = { '7A': '7° A', '7B': '7° B', '8A': '8° A', '8B': '8° B' };
  try {
    if (!cfg.supabaseUrl) throw new Error('sin_config');
    const r = await fetch(`${cfg.supabaseUrl}/rest/v1/rpc/mw_salon`, { method: 'POST', headers: { apikey: cfg.supabaseKey, Authorization: `Bearer ${cfg.supabaseKey}`, 'Content-Type': 'application/json' }, body: '{}' });
    if (!r.ok) throw new Error(`error_${r.status}`);
    const d = await r.json(), C = (d && d.cursos) || {}, ids = Object.keys(C).sort();
    if (!ids.length) throw new Error('vacio');
    const fechaCorta = (ms) => new Date(ms).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
    el.innerHTML = ids.map((c, i) => {
      const x = C[c], camp = x.campeones || [], cl = x.clanes || [];
      return `<article class="salon-curso aparece" style="--retraso:${i * 80}ms"><h3>${esc(nombres[c] || c)}</h3>
        <div class="salon-cifras"><span><b>${x.leyendas || 0}</b>leyendas (nivel 100)</span><span><b>${x.nivel50 || 0}</b>sobre nivel 50</span><span><b>${x.obras || 0}</b>obras terminadas</span></div>
        <h4>🏆 Campeones de la guerra de clanes</h4>
        ${camp.length ? `<ol class="salon-lista">${camp.map((k, j) => `<li><span>${j === 0 ? '👑' : '🏆'}</span><b>${esc(k.clan)}</b><small>${k.puntos} pts · ${fechaCorta(k.fecha)}</small></li>`).join('')}</ol>` : '<p class="salon-vacio">Aún no hay guerras de clanes terminadas.</p>'}
        ${cl.length ? `<h4>⭐ Clanes con más victorias</h4><ol class="salon-lista">${cl.map((k) => `<li><span>⭐</span><b>${esc(k.nombre)}</b><small>🏆 ${k.victorias} · ${k.trofeos} trofeos</small></li>`).join('')}</ol>` : ''}
      </article>`;
    }).join('');
    el.querySelectorAll('.aparece').forEach((a) => a.classList.add('visible'));
  } catch (e) {
    el.innerHTML = '<p class="empty">El Salón de la fama se llenará con las primeras guerras de clanes. ¡Vuelve pronto!</p>';
  }
}
portada(); contadores(); mundos(); galeria(); elenco(); novedades(); accesos(); ayuda(); animarScroll(); salon();
window.addEventListener('hashchange', router);
router();
fetch('contenido.json', { cache: 'no-cache' }).then((r) => r.json()).then((d) => { data = d; router(); })
  .catch(() => { if (!app.hidden) app.innerHTML = '<p class="empty">No se pudo cargar el material. Intenta recargar la página.</p>'; });
