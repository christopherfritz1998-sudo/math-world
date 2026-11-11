#!/usr/bin/env node
// Math World — revisión del banco de preguntas.
// Carga los archivos del banco en el mismo orden que juego/index.html, genera 180 preguntas por
// variante (60 por dificultad) e informa:
//   · variantes que devuelven una pregunta inválida más del 20 % de las veces
//   · variantes con enunciado fijo (siempre la misma pregunta)
//   · variantes que solo salen en algunas dificultades (limitadas a propósito)
// Uso:  node herramientas/revisar_banco.js [--n 60] [--umbral 20] [--json]
// Sale con código 1 si alguna variante falla más que el umbral (sirve para revisar antes de publicar).
'use strict';

const DIFICULTADES = [1, 2, 3];

// Por qué una pregunta no sirve (mismas reglas que Preguntas.valido en juego/banco.js, con el motivo)
function motivo(d, valido) {
  if (!d) return 'no devolvió pregunta';
  if (typeof d.enunciado !== 'string' || !d.enunciado.trim()) return 'sin enunciado';
  if (!Array.isArray(d.opciones) || d.opciones.length !== 4) return 'no tiene 4 alternativas';
  if (new Set(d.opciones).size !== 4) return 'alternativas repetidas';
  if (!(d.correcta >= 0 && d.correcta < 4)) return 'sin alternativa correcta';
  if (/undefined|NaN|Infinity|null/.test(d.enunciado + d.opciones.join('|'))) return 'texto con undefined/NaN';
  if (d.opciones.some((o) => /\d\.\d(?!\d\d)/.test(o))) return 'decimal con punto';
  return valido(d) ? '' : 'inválida';
}

// Revisa todas las variantes de P.BANCO. Devuelve { variantes: [...], total, fallan, fijas }
function revisar(P, { n = 60, umbral = 20 } = {}) {
  const variantes = [];
  for (const [curso, unidades] of Object.entries(P.BANCO)) {
    for (const [unidad, temas] of Object.entries(unidades)) {
      for (const [tema, t] of Object.entries(temas)) {
        (t.variantes || [t.gen.bind(t)]).forEach((fn, i) => {
          const v = { id: `${curso}/${unidad}/${tema}#${i}`, curso, unidad, tema, variante: i, generadas: 0, invalidas: 0, porDif: {}, motivos: {}, enunciados: new Set(), ejemplo: '' };
          for (const dif of DIFICULTADES) {
            let malas = 0;
            for (let k = 0; k < n; k++) {
              let d = null, m = '';
              try { d = fn(dif); m = motivo(d, P.valido); } catch (e) { m = `error: ${e.message}`; }
              v.generadas += 1;
              if (m) { malas += 1; v.invalidas += 1; v.motivos[m] = (v.motivos[m] || 0) + 1; } else { v.enunciados.add(d.enunciado.replace(/\s+/g, ' ').trim()); if (!v.ejemplo) v.ejemplo = d.enunciado; }
            }
            v.porDif[dif] = Math.round((malas / n) * 100);
          }
          v.pct = Math.round((v.invalidas / v.generadas) * 1000) / 10;
          v.distintos = v.enunciados.size;
          // una variante que nunca sale en una dificultad pero funciona bien en otra está limitada a propósito (p. ej. «desafío avanzado»)
          v.soloEnAlgunas = DIFICULTADES.some((x) => v.porDif[x] === 100) && DIFICULTADES.some((x) => v.porDif[x] <= umbral);
          v.falla = v.pct > umbral && !v.soloEnAlgunas;
          v.fija = v.distintos === 1 && v.generadas - v.invalidas >= 10;
          delete v.enunciados;
          variantes.push(v);
        });
      }
    }
  }
  const fallan = variantes.filter((v) => v.falla).sort((a, b) => b.pct - a.pct);
  const fijas = variantes.filter((v) => v.fija);
  const limitadas = variantes.filter((v) => v.soloEnAlgunas);
  return { n, umbral, total: variantes.length, generadas: variantes.reduce((s, v) => s + v.generadas, 0), invalidas: variantes.reduce((s, v) => s + v.invalidas, 0), fallan, fijas, limitadas, variantes };
}

function texto(r) {
  const L = [];
  L.push(`Banco de preguntas: ${r.total} variantes, ${r.generadas} preguntas generadas (${r.n} por dificultad), ${r.invalidas} inválidas (${(Math.round((r.invalidas / r.generadas) * 1000) / 10)} %).`);
  L.push('');
  L.push(`Variantes que fallan más del ${r.umbral} % de las veces: ${r.fallan.length}`);
  for (const v of r.fallan) {
    const mot = Object.entries(v.motivos).sort((a, b) => b[1] - a[1]).map(([m, c]) => `${m} ×${c}`).join(', ');
    L.push(`  ${v.id.padEnd(34)} ${String(v.pct).padStart(5)} %  (dif 1: ${v.porDif[1]} % · 2: ${v.porDif[2]} % · 3: ${v.porDif[3]} %)  ${mot}`);
  }
  L.push('');
  L.push(`Variantes que solo salen en algunas dificultades (a propósito, no cuentan como falla): ${r.limitadas.length}`);
  for (const v of r.limitadas) L.push(`  ${v.id.padEnd(34)} dif 1: ${v.porDif[1]} % · 2: ${v.porDif[2]} % · 3: ${v.porDif[3]} % de inválidas`);
  L.push('');
  L.push(`Variantes con enunciado fijo: ${r.fijas.length}`);
  for (const v of r.fijas) L.push(`  ${v.id.padEnd(34)} «${v.ejemplo.slice(0, 90)}${v.ejemplo.length > 90 ? '…' : ''}»`);
  return L.join('\n');
}

if (typeof module !== 'undefined' && typeof require === 'function' && require.main === module) {
  const fs = require('fs'), path = require('path'), vm = require('vm');
  const juego = path.join(__dirname, '..', 'juego');
  const arg = (nombre, def) => { const i = process.argv.indexOf(`--${nombre}`); return i > 0 ? Number(process.argv[i + 1]) : def; };
  // mismos archivos y mismo orden que juego/index.html
  const html = fs.readFileSync(path.join(juego, 'index.html'), 'utf8');
  const archivos = [...html.matchAll(/<script src="((?:preguntas|banco)[\w.]*\.js)"/g)].map((m) => m[1]);
  if (!archivos.length) { console.error('No se encontraron los archivos del banco en juego/index.html'); process.exit(2); }
  for (const a of archivos) vm.runInThisContext(fs.readFileSync(path.join(juego, a), 'utf8'), { filename: a });
  const r = revisar(globalThis.Preguntas, { n: arg('n', 60), umbral: arg('umbral', 20) });
  if (process.argv.includes('--json')) console.log(JSON.stringify(r, null, 2));
  else { console.log(`Archivos (orden de juego/index.html): ${archivos.join(', ')}\n`); console.log(texto(r)); }
  process.exit(r.fallan.length ? 1 : 0);
} else if (typeof window !== 'undefined') {
  window.RevisarBanco = { revisar, texto };   // para ejecutarlo desde una página que cargue los mismos archivos
}
