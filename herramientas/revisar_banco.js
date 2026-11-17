// Math World — revisión del banco de preguntas.
// Carga los archivos de preguntas en el mismo orden que juego/index.html, genera 180 preguntas por variante
// (60 por cada dificultad) y reporta:
//   · variantes que fallan al generarse más del 20 % de las veces (la pregunta no pasa Preguntas.valido),
//     tal como se sirven en el juego (con el reintento de banco.js) y, aparte, la variante sola (sin reintento)
//   · variantes con enunciado fijo (siempre el mismo texto)
//   · variantes que producen opciones repetidas
// Uso (desde la raíz del repositorio):  node herramientas/revisar_banco.js [--todas] [--n=180]
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
const args = process.argv.slice(2);
const N = Number((args.find((a) => a.startsWith('--n=')) || '--n=180').slice(4)) || 180;
const TODAS = args.includes('--todas');
const UMBRAL = 0.2;

// archivos de preguntas en el orden de juego/index.html
const html = fs.readFileSync(path.join(raiz, 'juego/index.html'), 'utf8');
const archivos = [...html.matchAll(/<script src="((?:preguntas|banco|figuras)[^"?]*\.js)/g)].map((m) => m[1]);
const ventana = {};
ventana.window = ventana;
const ctx = vm.createContext({ window: ventana, console, Math, Date, JSON, Intl });
for (const f of archivos) vm.runInContext(fs.readFileSync(path.join(raiz, 'juego', f), 'utf8'), ctx, { filename: f });
const P = ventana.Preguntas;
if (!P || !P.BANCO || !P.valido) { console.error('No se pudo cargar Preguntas.BANCO'); process.exit(1); }

const filas = [];
let total = 0, fallidas = 0;
for (const [curso, unidades] of Object.entries(P.BANCO)) {
  for (const [u, temas] of Object.entries(unidades)) {
    for (const [k, tema] of Object.entries(temas)) {
      tema.variantes.forEach((fn, i) => {
        let mal = 0, errores = 0, repetidas = 0, malBase = 0;
        const malDif = [0, 0, 0, 0];
        const enunciados = new Set(), motivos = {};
        for (let n = 0; n < N; n++) {
          const dif = 1 + Math.floor((n * 3) / N);   // 60 por dificultad con N = 180
          let d = null;
          try { d = fn(dif); } catch (e) { errores += 1; motivos[`error: ${e.message}`] = (motivos[`error: ${e.message}`] || 0) + 1; }
          total += 1;
          if (!P.valido(d)) {
            mal += 1; fallidas += 1; malDif[dif] += 1;
            const m = !d ? 'sin pregunta' : !Array.isArray(d.opciones) || d.opciones.length !== 4 ? `${(d.opciones || []).length} opciones`
              : new Set(d.opciones).size !== 4 ? 'opciones repetidas' : /undefined|NaN|Infinity|null/.test(d.enunciado + d.opciones.join('|')) ? 'undefined/NaN' : 'decimal con punto';
            motivos[m] = (motivos[m] || 0) + 1;
          }
          if (d && Array.isArray(d.opciones) && new Set(d.opciones).size < d.opciones.length) repetidas += 1;
          if (d && typeof d.enunciado === 'string') enunciados.add(d.enunciado.replace(/\s+/g, ' ').trim());
          if (fn.base) { let b = null; try { b = fn.base(dif); } catch (e) { b = null; } if (!P.valido(b)) malBase += 1; }
        }
        // variante pensada solo para algunas dificultades: falla siempre en unas y casi nunca en las otras
        const porDif = N / 3, bloq = [1, 2, 3].filter((x) => malDif[x] === porDif), libres = [1, 2, 3].filter((x) => malDif[x] < porDif);
        const soloDif = bloq.length && libres.length && libres.every((x) => malDif[x] / porDif <= UMBRAL) ? libres : null;
        filas.push({ id: `${curso}/${u}/${k} #${i}`, mal, errores, repetidas, distintos: enunciados.size, motivos, malBase, soloDif });
      });
    }
  }
}

const pct = (x) => `${((100 * x) / N).toFixed(0)} %`;
const malas = filas.filter((f) => f.mal / N > UMBRAL && !f.soloDif).sort((a, b) => b.mal - a.mal);
const porNivel = filas.filter((f) => f.soloDif);
const fijas = filas.filter((f) => f.distintos <= 1);
const repes = filas.filter((f) => f.repetidas > 0).sort((a, b) => b.repetidas - a.repetidas);
const motivosTxt = (m) => Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join(', ');

console.log(`Banco de preguntas · ${filas.length} variantes · ${N} preguntas por variante (${N / 3} por dificultad)`);
console.log(`Fallan al generarse: ${fallidas} de ${total} intentos (${((100 * fallidas) / total).toFixed(1)} %)\n`);
console.log(`Variantes que fallan más del ${UMBRAL * 100} %: ${malas.length}`);
for (const f of malas) console.log(`  ${f.id}: ${f.mal} de ${N} (${pct(f.mal)}) → ${motivosTxt(f.motivos)}`);
console.log(`\nVariantes solo para algunas dificultades (intencional; el juego elige otra en las demás): ${porNivel.length}`);
for (const f of porNivel) console.log(`  ${f.id}: solo dificultad ${f.soloDif.join(' y ')}`);
const base = filas.filter((f) => f.malBase / N > UMBRAL).sort((a, b) => b.malBase - a.malBase);
console.log(`\nSin el reintento de banco.js (la variante sola) fallarían más del ${UMBRAL * 100} %: ${base.length} (descartan números al azar a propósito)`);
for (const f of base.slice(0, TODAS ? base.length : 12)) console.log(`  ${f.id}: ${f.malBase} de ${N}`);
if (!TODAS && base.length > 12) console.log(`  … y ${base.length - 12} más (usa --todas)`);
console.log(`\nVariantes con enunciado fijo: ${fijas.length}`);
for (const f of fijas) console.log(`  ${f.id}`);
console.log(`\nVariantes con opciones repetidas: ${repes.length}`);
for (const f of repes.slice(0, TODAS ? repes.length : 25)) console.log(`  ${f.id}: ${f.repetidas} de ${N}`);
if (!TODAS && repes.length > 25) console.log(`  … y ${repes.length - 25} más (usa --todas)`);
if (TODAS) {
  console.log('\nTodas las variantes con algún fallo:');
  for (const f of filas.filter((x) => x.mal).sort((a, b) => b.mal - a.mal)) console.log(`  ${f.id}: ${f.mal} → ${motivosTxt(f.motivos)}`);
}
process.exitCode = malas.length ? 1 : 0;
