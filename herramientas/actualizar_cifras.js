// Math World — cuenta mundos, personajes, minijuegos y logros directamente del código del juego
// y escribe juego/cifras.js, que usa la portada (index.html) para sus contadores sin cargar juego.js.
// Uso (desde la raíz del repositorio):  node herramientas/actualizar_cifras.js
// Con --revisar no escribe nada: termina con error si juego/cifras.js quedó desactualizado.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const leer = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');

// objeto "comodín": cualquier propiedad o llamada devuelve otro comodín (para cargar módulos del navegador)
function comodin() {
  const f = function () { return comodin(); };
  return new Proxy(f, { get: (t, k) => (k === Symbol.toPrimitive ? () => '' : k in t ? t[k] : comodin()), apply: () => comodin(), construct: () => comodin() });
}
function cargar(archivos) {
  const ventana = { MWJ: comodin(), addEventListener() {}, matchMedia: () => ({ matches: false }) };
  const ctx = vm.createContext({ window: ventana, document: comodin(), navigator: { userAgent: '' }, localStorage: comodin(), console, Math, Date, JSON, setTimeout() {}, setInterval() {}, requestAnimationFrame() {} });
  ventana.window = ventana;
  for (const f of archivos) vm.runInContext(leer(f), ctx, { filename: f });
  return ventana;
}

function contar() {
  const w = cargar(['juego/datos.js', 'juego/minijuegos.js', 'juego/arcade.js']);
  const D = w.MWDatos;
  // logros: entradas L('id', ...) dentro de la lista LOGROS de juego.js
  const j = leer('juego/juego.js');
  const ini = j.indexOf('const LOGROS = [');
  const fin = j.indexOf('\n  ];', ini);
  if (ini < 0 || fin < 0) throw new Error('No se encontró la lista LOGROS en juego/juego.js');
  // más los que se agregan después con LOGROS.push(L(...)) (por ejemplo «El rey del juego»)
  const logros = (j.slice(ini, fin).match(/^\s*L\('[^']+'/gm) || []).length + (j.match(/LOGROS\.push\(L\('/g) || []).length;
  const mate = w.Minijuegos.lista().length;
  const entretencion = w.Arcade.total();
  return {
    mundos: Object.keys(D.MUNDOS).length + 1,   // las 4 unidades + el Altar de los Dioses
    personajes: D.PERSONAJES.length,
    minijuegos: mate + entretencion,
    minijuegosMate: mate,
    minijuegosEntretencion: entretencion,
    logros,
  };
}

const c = contar();
const texto = `// Generado por herramientas/actualizar_cifras.js: no editar a mano.\nwindow.MW_CIFRAS = ${JSON.stringify(c)};\n`;
const destino = path.join(raiz, 'juego/cifras.js');
if (process.argv.includes('--revisar')) {
  const actual = fs.existsSync(destino) ? fs.readFileSync(destino, 'utf8').replace(/\r\n/g, '\n') : '';
  if (actual !== texto) { console.log('juego/cifras.js está desactualizado. Ejecuta: node herramientas/actualizar_cifras.js'); process.exit(1); }
  console.log('juego/cifras.js al día:', c);
} else {
  fs.writeFileSync(destino, texto);
  console.log('juego/cifras.js actualizado:', c);
}
