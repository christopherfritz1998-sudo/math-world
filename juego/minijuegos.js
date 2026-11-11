// Math World · Minijuegos de los mundos (7° y 8° básico).
// La matemática es la mecánica: ordenar, equilibrar, despejar, trazar, medir y decidir.
// Usa el puente window.MWJ que expone juego.js (ui, premios, estadísticas).
(function () {
  'use strict';
  const J = () => window.MWJ;
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (l) => l[Math.floor(Math.random() * l.length)];
  const mezclar = (l) => { const a = l.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const mcd = (a, b) => (b ? mcd(b, a % b) : Math.abs(a));
  const es8 = () => J().S().curso === '8basico';
  const neg = (s) => String(s).replace(/-/g, '−');
  const num = (n) => neg(Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000).replace('.', ','));
  const frac = (p, q) => { if (q < 0) { p = -p; q = -q; } const g = mcd(p, q) || 1; p /= g; q /= g; return q === 1 ? num(p) : `${p < 0 ? '−' : ''}${Math.abs(p)}/${q}`; };
  const leerNum = (t) => { const s = String(t || '').trim().replace(/\s/g, '').replace(/−/g, '-').replace(',', '.'); if (!s) return NaN; if (/^-?\d+\/\d+$/.test(s)) { const [a, b] = s.split('/').map(Number); return b ? a / b : NaN; } return /^-?\d*\.?\d+$/.test(s) ? Number(s) : NaN; };
  const igual = (a, b) => Math.abs(a - b) < 1e-6;
  const M = (s) => J().mate(s);
  const E = (s) => J().esc(s);

  // ---------- Catálogo ----------
  const MJ = {
    puente: { zona: 'u1', ico: '🪵', nombre: 'Puente de troncos', tema: ['enteros', 'racionalesq'], rondas: 3,
      desc: ['Cruza el río pisando los troncos en orden. Hay enteros, fracciones y decimales.', 'Cruza el río pisando los troncos en orden. Hay números racionales: fracciones, decimales y negativos.'] },
    frutos: { zona: 'u1', ico: '⚖️', nombre: 'Balanza de frutos', tema: ['fracciones', 'potencias'], rondas: 3,
      desc: ['Equilibra la balanza eligiendo canastos cuyo peso sume exactamente lo pedido (fracciones y decimales).', 'Equilibra la balanza eligiendo canastos cuyo peso sume exactamente lo pedido: cada canasto pesa una potencia.'] },
    caravana: { zona: 'u2', ico: '🐫', nombre: 'Balanza de la caravana', tema: ['ecuaciones7', 'ecuaciones8'], rondas: 3,
      desc: ['Descubre cuánto pesa cada caja «x»: quita lo mismo de ambos lados hasta dejar una caja sola.', 'Descubre cuánto pesa cada caja «x»: hay cajas en ambos lados. Quita lo mismo de cada lado y divide hasta dejar una caja sola.'] },
    oasis: { zona: 'u2', ico: '🌴', nombre: 'Canales del oasis', tema: ['proporcion', 'linealafin'], rondas: 3,
      desc: ['Ajusta la constante de proporcionalidad k del canal y = k·x para que el agua pase por los oasis.', 'Ajusta la pendiente m y el coeficiente de posición n del canal y = mx + n para que el agua pase por los oasis.'] },
    gemas: { zona: 'u3', ico: '💎', nombre: 'Tallado de gemas', tema: ['areas', 'pitagoras'], rondas: 3,
      desc: ['Toca los clavos para tallar una gema con el área pedida (cada cuadrito mide 1).', 'Toca dos clavos para tallar un corte con la longitud pedida: usa el teorema de Pitágoras.'] },
    rayo: { zona: 'u3', ico: '🔦', nombre: 'Rayo de luz', tema: ['angulos', 'transformaciones'], rondas: 4,
      desc: ['Calcula el ángulo que falta para orientar el espejo y que el rayo ilumine el cristal.', 'El espejo refleja, gira o traslada el cristal: escribe dónde queda su imagen en el plano.'] },
    carga: { zona: 'u3', ico: '🛒', nombre: 'Carga exacta', tema: ['areas', 'volumen'], rondas: 3,
      desc: ['Elige las placas cuya área suma exactamente el piso de la vagoneta.', 'Elige los bloques cuyo volumen suma exactamente la capacidad de la vagoneta (usa π ≈ 3).'] },
    trineo: { zona: 'u4', ico: '🛷', nombre: 'Trineo del azar', tema: [null, null], rondas: 5,
      desc: ['En cada bifurcación elige el camino con mayor probabilidad de seguir adelante.', 'En cada bifurcación elige el camino con mayor probabilidad: hay dos dados, monedas y urnas.'] },
    meteo: { zona: 'u4', ico: '🌡️', nombre: 'Estación meteorológica', tema: ['tendencia', 'posicion'], rondas: 4,
      desc: ['Calibra el termómetro con la media, la mediana, la moda o el rango de las temperaturas.', 'Calibra el termómetro con los cuartiles y el rango intercuartil de las temperaturas.'] },
    mercado: { zona: 'base', ico: '🏪', nombre: 'Mercado de la base', tema: ['porcentajes', 'racionales'], rondas: 4,
      desc: ['Compra al precio justo: calcula descuentos y porcentajes.', 'Compra al precio justo: aumentos y descuentos sucesivos y porcentajes de porcentajes.'] },
    cerradura: { zona: 'base', ico: '🔐', nombre: 'Cerradura del grupo', tema: [], rondas: 0, desc: ['', ''] },
  };
  const temaDe = (def) => def.tema[es8() ? 1 : 0] || null;

  // ---------- Piezas visuales comunes (cabecera, escena por mundo, confeti) ----------
  const ZFX = { u1: ['🍃', '🌿', '🍂', '✨'], u2: ['✨', '🌟', '☀️', '🌵'], u3: ['💎', '✨', '🔹', '🔸'], u4: ['❄️', '✨', '❄️', '🌟'], base: ['⭐', '✨', '🪙', '🎉'] };
  const clase = (id, extra = '') => `minijuego mj-esc mjg-${id} mz-${MJ[id].zona} ${extra}`;
  const cab = (def, etq, titulo, estado = '') => `<div class="modal-cab mjx-cab"><span class="mjx-insignia" aria-hidden="true">${def.ico}</span><div class="mjx-tit"><span class="etq">${etq}</span><h2 id="modal-titulo">${titulo}</h2></div>${estado}</div>`;
  const confeti = (n, zona) => `<div class="mjx-confeti" aria-hidden="true">${Array.from({ length: n }, () => `<i style="--x:${R(-44, 44)}vw;--y:${R(-38, 42)}vh;--g:${R(-540, 540)}deg;--t:${R(9, 17) / 10}s;--e:${R(0, 20) / 100}s">${pick(ZFX[zona] || ZFX.base)}</i>`).join('')}</div>`;
  // separa el emoji inicial de un texto («🧥 abrigo» → ['🧥', 'abrigo'])
  const partir = (t) => { const i = String(t).indexOf(' '); return i < 0 ? ['', String(t)] : [t.slice(0, i), t.slice(i + 1)]; };

  // ===================================================================
  // Motor común: rondas, corazones, premio
  // ===================================================================
  let P = null;   // partida en curso
  function abrir(id) {
    const def = MJ[id]; if (!def || !J() || !J().S()) return;
    if (id === 'cerradura') return cerradura();
    const D = dia();
    const veces = D.n[id] || 0;
    J().ui.abrir(`${cab(def, `Minijuego · ${E(J().nombreZona(def.zona))}`, E(def.nombre))}
      <div class="mjx-portada"><div class="mjx-portada-ico" aria-hidden="true">${def.ico}</div>
        <p class="enunciado">${E(def.desc[es8() ? 1 : 0])}</p>
        <ul class="mjx-fichas"><li><b>🎯 ${def.rondas}</b> rondas</li><li><b>❤️ 3</b> corazones</li><li><b>🎁 ${veces >= 3 ? 'Premio menor' : `${veces} de 3`}</b> ${veces >= 3 ? 'por hoy' : 'partidas de hoy'}</li></ul>
        <p class="nota">Cada error quita un corazón.${veces >= 3 ? ' Hoy ya jugaste 3 veces: el premio ahora es menor, pero sigue sumando a tus estadísticas.' : ` Premio completo en tus primeras 3 partidas del día (llevas ${veces}).`}</p></div>
      <div class="acciones"><button type="button" class="btn" id="mj-no">Ahora no</button><button type="button" class="btn pri mjx-jugar" id="mj-si" data-foco>▶ ¡Jugar!</button></div>`, clase(id, 'mjx-inicio'));
    J().$('mj-no').addEventListener('click', () => J().ui.cerrar());
    J().$('mj-si').addEventListener('click', () => empezar(id));
    J().ui.teclas = (e) => { if (e.key === 'Enter') { e.preventDefault(); empezar(id); } };
  }
  function dia() {
    const S = J().S(), hoy = new Date().toISOString().slice(0, 10);
    if (!S.mjDia || S.mjDia.f !== hoy) S.mjDia = { f: hoy, n: {} };
    return S.mjDia;
  }
  function empezar(id) {
    P = { id, def: MJ[id], g: JUEGOS[id], ronda: 0, vidas: 3, buenas: 0, msg: '', r: null, ronErr: false, hist: [], fx: '' };
    P.r = P.g.generar(P.ronda);
    pintar();
  }
  const api = {
    pintar: () => pintar(),
    // error dentro de la ronda: pierde un corazón y sigue en la misma ronda
    error(txt) {
      if (!P) return;
      J().sfx('error'); P.vidas -= 1; P.ronErr = true; P.fx = 'mal';
      if (temaDe(P.def)) J().registrar(temaDe(P.def), false);
      P.msg = `<div class="mensaje mal" role="status">${txt}</div>`;
      if (P.vidas <= 0) return terminar(false);
      pintar();
    },
    // ronda terminada (bien o mal) → siguiente
    ronda(ok, txt) {
      if (!P) return;
      J().sfx(ok ? 'acierto' : 'error');
      if (temaDe(P.def) && (ok || !P.ronErr)) J().registrar(temaDe(P.def), ok);
      if (ok) P.buenas += 1; else P.vidas -= 1;
      P.hist.push(ok); P.fx = ok ? 'bien' : 'mal';
      P.msg = `<div class="mensaje ${ok ? 'bien' : 'mal'}" role="status">${txt}</div>`;
      P.ronda += 1; P.ronErr = false;
      if (P.vidas <= 0 || P.ronda >= P.def.rondas) return terminar(P.vidas > 0);
      P.r = P.g.generar(P.ronda);
      pintar();
    },
  };
  function pintar() {
    if (!P) return;
    const { def, g, r } = P;
    const v = g.vista(r), fx = P.fx; P.fx = '';
    const puntos = Array.from({ length: def.rondas }, (_, i) => (i < P.hist.length ? `<li class="${P.hist[i] ? 'ok' : 'no'}">${P.hist[i] ? '✓' : '✕'}</li>` : `<li class="${i === P.ronda ? 'ahora' : ''}">${i + 1}</li>`)).join('');
    const vidas = Array.from({ length: 3 }, (_, i) => `<i class="${i < P.vidas ? '' : 'perdido'}${fx === 'mal' && i === P.vidas ? ' rompe' : ''}">${i < P.vidas ? '❤️' : '🖤'}</i>`).join('');
    const estado = `<div class="mjx-estado"><ol class="mjx-rondas" aria-label="Ronda ${P.ronda + 1} de ${def.rondas}">${puntos}</ol><span class="mjx-vidas" role="img" aria-label="${P.vidas} corazones">${vidas}</span></div>`;
    J().ui.abrir(`${cab(def, `${E(def.nombre)} · ronda ${P.ronda + 1} de ${def.rondas}`, v.titulo, estado)}
      ${P.msg}
      ${v.instr ? `<p class="nota mj-instr"><span aria-hidden="true">💡</span><span>${v.instr}</span></p>` : ''}
      <div class="mj-area" id="mj-area">${v.cuerpo}</div>
      <div class="acciones"><button type="button" class="btn" id="mj-salir">Salir</button><div class="mj-botones">${v.botones || ''}</div></div>
      ${fx === 'bien' ? confeti(14, def.zona) : ''}`, clase(P.id, fx ? `fx-${fx}` : ''), () => { /* al cerrar no se pierde nada */ });
    P.msg = '';
    J().$('mj-salir').addEventListener('click', () => { P = null; J().ui.cerrar(); });
    J().ui.teclas = null;
    g.conectar(r, api, J().$('mj-area'));
  }
  function terminar(completo) {
    const p = P; P = null; if (!p) return;
    const D = dia(), veces = D.n[p.id] || 0; D.n[p.id] = veces + 1;
    const S = J().S();
    S.mjJugados = Array.from(new Set([...(S.mjJugados || []), p.id]));
    const mult = veces < 3 ? 1 : 0.34, perfecto = completo && p.buenas === p.def.rondas;
    const xp = Math.round((12 + 10 * p.buenas + (perfecto ? 20 : 0)) * mult);
    const rec = p.buenas ? J().paquete(Math.max(1, Math.round((2 + 2 * p.buenas) * mult)), 2, true) : {};
    const txt = J().darPremio(rec, xp);
    if (J().avanzar) J().avanzar('minijuego'); else J().contar('minijuego'); J().contar(`mj_${p.id}`); if (perfecto) J().contar('mj_perfecto');
    J().sfx(perfecto ? 'logro' : p.buenas ? 'acierto' : 'error');
    if (perfecto && J().escena()) J().escena().celebrar();
    const est = perfecto ? 3 : completo ? 2 : p.buenas ? 1 : 0;
    J().ui.abrir(`${cab(p.def, E(p.def.nombre), perfecto ? '¡Perfecto!' : completo ? '¡Lo lograste!' : 'Se acabaron los corazones')}
      <div class="mjx-final"><div class="mjx-estrellas" role="img" aria-label="${est} de 3 estrellas">${[0, 1, 2].map((i) => `<i class="${i < est ? 'on' : ''}" style="--i:${i}">★</i>`).join('')}</div>
        ${p.msg}
        <p class="enunciado">Rondas superadas: <b>${p.buenas} de ${p.def.rondas}</b></p>
        <ul class="mjx-fichas premio">${txt ? `<li><b>🎁</b> ${E(txt)}</li>` : ''}<li><b>⭐ ${xp}</b> de experiencia</li></ul>
        ${mult < 1 ? '<p class="nota">Premio reducido: ya jugaste 3 veces hoy.</p>' : ''}</div>
      <div class="acciones"><button type="button" class="btn" id="mj-fin">Cerrar</button><button type="button" class="btn pri" id="mj-otra" data-foco>↻ Jugar otra vez</button></div>
      ${completo ? confeti(perfecto ? 30 : 16, p.def.zona) : ''}`, clase(p.id, `mjx-fin ${completo ? 'gano' : 'perdio'}`));
    J().$('mj-fin').addEventListener('click', () => J().ui.cerrar());
    J().$('mj-otra').addEventListener('click', () => empezar(p.id));
    J().guardar(true);
  }
  // botones con número propio (data-v) dentro del área
  const enArea = (area, sel, f) => area.querySelectorAll(sel).forEach((b) => b.addEventListener('click', () => f(b)));
  const boton = (id, f) => { const b = J().$(id); if (b) b.addEventListener('click', f); };

  // ===================================================================
  // 1 · Puente de troncos (ordenar números)
  // ===================================================================
  function valorPuente(ronda) {
    if (!es8()) {
      const t = pick(ronda === 0 ? ['e', 'e', 'f', 'd'] : ['e', 'f', 'd', 'f']);
      if (t === 'e') { const v = R(-15, 15); return { t: num(v), v }; }
      if (t === 'f') { const q = pick([2, 4, 5, 3]); const p = R(-3 * q, 3 * q); return { t: frac(p, q), v: p / q }; }
      const v = R(-60, 60) / 10; return { t: num(v), v };
    }
    const t = pick(['f', 'f', 'd', 'e', 'm']);
    if (t === 'e') { const v = R(-9, 9); return { t: num(v), v }; }
    if (t === 'd') { const v = R(-400, 400) / 100; return { t: num(v), v }; }
    const q = pick([2, 3, 4, 5, 6, 8]); const p = R(-4 * q, 4 * q); return { t: frac(p, q), v: p / q };
  }
  const puente = {
    generar(ronda) {
      const n = 5 + ronda, items = [];
      let guard = 0;
      while (items.length < n && guard++ < 500) { const x = valorPuente(ronda); if (items.every((y) => Math.abs(y.v - x.v) > 0.05)) items.push(x); }
      const desc = ronda === 2;
      const orden = items.slice().sort((a, b) => (desc ? b.v - a.v : a.v - b.v));
      return { items: mezclar(items), orden, sig: 0, desc };
    },
    vista(r) {
      return { titulo: `Pisa los troncos de ${r.desc ? 'mayor a menor' : 'menor a mayor'}`,
        instr: r.desc ? 'Empieza por el número más grande. Recuerda: entre negativos, es mayor el que está más cerca del 0.' : 'Empieza por el número más pequeño. Si te sirve, piensa dónde va cada uno en la recta numérica.',
        cuerpo: `<div class="mj-rio"><span class="mj-orilla izq ${r.sig ? 'vacia' : ''}" aria-hidden="true">${r.sig ? '' : '🧍'}</span><div class="mj-troncos">${r.items.map((x, i) => {
          const pos = r.orden.indexOf(x), pis = pos < r.sig;
          return `<button type="button" class="mj-tronco ${pis ? 'pisado' : ''} ${pis && pos === r.sig - 1 ? 'aqui' : ''} ${r.mal === i ? 'falla' : ''}" style="--i:${i}" data-i="${i}" ${pis ? 'disabled' : ''}><span class="mj-tv">${M(x.t)}</span>${pis ? `<small>${pos + 1}°</small>` : ''}</button>`;
        }).join('')}</div><span class="mj-orilla der" aria-hidden="true">🏁</span></div>
        <p class="mj-camino"><span>Camino</span>${r.orden.slice(0, r.sig).map((x) => `<b>${M(x.t)}</b>`).join('<i>→</i>') || '<i>pisa el primer tronco…</i>'}</p>` };
    },
    conectar(r, A, area) {
      r.mal = null;
      enArea(area, '.mj-tronco', (b) => {
        const x = r.items[Number(b.dataset.i)], esperado = r.orden[r.sig];
        if (x !== esperado) r.mal = Number(b.dataset.i);
        if (x === esperado) {
          r.sig += 1; J().sfx('acierto');
          if (r.sig >= r.orden.length) return A.ronda(true, `¡Cruzaste! El orden era ${r.orden.map((y) => M(y.t)).join(r.desc ? ' > ' : ' < ')}.`);
          return A.pintar();
        }
        A.error(`¡Splash! ${M(x.t)} no va ahora: falta un número ${r.desc ? 'mayor' : 'menor'}. ${M(x.t)} ${x.v < esperado.v ? '<' : '>'} ${M(esperado.t)}.`);
      });
    },
  };

  // ===================================================================
  // 2 · Balanza de frutos (sumar fracciones · 8°: valorar potencias)
  // ===================================================================
  const POT8 = [];
  for (const [b, emax] of [[2, 7], [3, 4], [4, 3], [5, 3], [6, 2], [7, 2], [10, 2]]) for (let e = 0; e <= emax; e++) POT8.push({ t: `${b}^${e}`, v: b ** e });
  const DOCE = [2, 3, 4, 6, 8, 9, 12, 15, 18, 24];   // en doceavos: 1/6, 1/4, 1/3, 1/2, 2/3, 3/4, 1, 5/4, 3/2, 2
  const txtDoce = (v) => { const dec = { 3: '0,25', 6: '0,5', 9: '0,75', 15: '1,25', 18: '1,5' }; return dec[v] && Math.random() < 0.45 ? dec[v] : frac(v, 12); };
  const frutos = {
    generar(ronda) {
      if (!es8()) {
        const k = ronda === 0 ? 2 : 3;
        const sol = Array.from({ length: k }, () => pick(DOCE));
        const meta = sol.reduce((a, b) => a + b, 0);
        const otros = Array.from({ length: 3 }, () => pick(DOCE));
        return { meta, metaTxt: frac(meta, 12), canastos: mezclar([...sol, ...otros].map((v) => ({ v, t: txtDoce(v) }))), sel: new Set(), unidad: '' };
      }
      for (let k = 0; k < 200; k++) {
        const meta = pick(POT8.filter((p) => p.v >= 8 && p.v <= 128 && !p.t.endsWith('^1')));
        const pares = [];
        POT8.forEach((a, i) => POT8.forEach((b, j) => { if (i < j && a.v + b.v === meta.v && a.t !== meta.t && b.t !== meta.t) pares.push([a, b]); }));
        if (!pares.length) continue;
        const [a, b] = pick(pares);
        const otros = mezclar(POT8.filter((p) => p.v < meta.v && p !== a && p !== b)).slice(0, ronda === 0 ? 2 : 4);
        return { meta: meta.v, metaTxt: meta.t, canastos: mezclar([a, b, ...otros]), sel: new Set(), unidad: '' };
      }
      return frutos.generar(ronda);
    },
    vista(r) {
      const suma = [...r.sel].reduce((s, i) => s + r.canastos[i].v, 0);
      // la balanza se inclina hacia el lado más pesado (la manzana está a la izquierda)
      const ang = Math.max(-14, Math.min(14, ((suma - r.meta) / r.meta) * 20));
      const de = r.ang0 === undefined ? 0 : r.ang0; r.ang0 = ang;
      return { titulo: `La manzana dorada pesa ${M(r.metaTxt)} kg`,
        instr: es8() ? 'Calcula el valor de cada potencia y elige los canastos que sumen exactamente el peso de la manzana dorada.' : 'Elige los canastos que, sumados, pesen exactamente lo mismo que la manzana dorada.',
        cuerpo: `<div class="mj-balanza" style="--a:${ang.toFixed(2)}deg;--de:${de.toFixed(2)}deg">
            <div class="mj-brazo"><div class="mj-cuelga izq"><div class="mj-plato oro"><span class="mj-fruta" aria-hidden="true">🍎</span><b>${M(r.metaTxt)}</b></div></div>
              <div class="mj-cuelga der"><div class="mj-plato">${[...r.sel].map((i) => `<span class="mj-enplato">🧺<b>${M(r.canastos[i].t)}</b></span>`).join('') || '<small>vacío</small>'}</div></div></div>
            <div class="mj-poste" aria-hidden="true"></div><div class="mj-pie" aria-hidden="true"></div></div>
          <div class="mj-opciones canastos">${r.canastos.map((c, i) => `<button type="button" class="mj-op mj-canasto ${r.sel.has(i) ? 'sel' : ''}" data-i="${i}" aria-pressed="${r.sel.has(i)}"><span class="mj-op-ico" aria-hidden="true">🧺</span><span class="mj-op-txt">${M(c.t)}</span></button>`).join('')}</div>`,
        botones: `<button type="button" class="btn pri" id="mj-pesar" ${r.sel.size ? '' : 'disabled'}>⚖️ Pesar</button>` };
    },
    conectar(r, A, area) {
      enArea(area, '.mj-op', (b) => { const i = Number(b.dataset.i); if (r.sel.has(i)) r.sel.delete(i); else r.sel.add(i); A.pintar(); });
      boton('mj-pesar', () => {
        const suma = [...r.sel].reduce((s, i) => s + r.canastos[i].v, 0);
        const txt = [...r.sel].map((i) => M(r.canastos[i].t)).join(' + ');
        const vale = (v) => (es8() ? num(v) : frac(v, 12));
        if (suma === r.meta) return A.ronda(true, `¡Equilibrio perfecto! ${txt} = ${M(vale(r.meta))}.`);
        A.error(`La balanza no se equilibra: ${txt} = ${M(vale(suma))}, y la manzana pesa ${M(vale(r.meta))}. ${suma > r.meta ? 'Te pasaste.' : 'Te falta peso.'}`);
      });
    },
  };

  // ===================================================================
  // 3 · Balanza de la caravana (resolver ecuaciones)
  // ===================================================================
  const caravana = {
    generar(ronda) {
      const s = R(2, 9);
      if (!es8() && ronda < 2) { const a = R(2, 4), b = R(1, 12); return { s, L: { x: a, n: b }, Rr: { x: 0, n: a * s + b }, pasos: 0 }; }
      const a = es8() ? R(3, 6) : R(2, 4), c = R(1, a - 1), b = R(1, 10);
      return { s, L: { x: a, n: b }, Rr: { x: c, n: (a - c) * s + b }, pasos: 0 };
    },
    vista(r) {
      const lado = (q) => `${'<span class="mj-caja">x</span>'.repeat(q.x)}${q.n ? `<span class="mj-pesa"><b>${q.n}</b> kg</span>` : ''}${!q.x && !q.n ? '<small>vacío</small>' : ''}`;
      const ec = (q) => [q.x ? `${q.x === 1 ? '' : q.x}x` : '', q.n ? String(q.n) : ''].filter(Boolean).join(' + ') || '0';
      const quitarX = r.L.x >= 1 && r.Rr.x >= 1;
      return { titulo: `${ec(r.L)} = ${ec(r.Rr)}`,
        instr: 'Lo que hagas en un lado, hazlo también en el otro: así la balanza sigue equilibrada. Meta: una sola caja «x» de un lado y solo pesas del otro.',
        cuerpo: `<div class="mj-desierto"><span class="mj-sol" aria-hidden="true"></span><span class="mj-camello" aria-hidden="true">🐫</span>
            <div class="mj-caravana ${r.pasos ? 'asienta' : ''}"><div class="mj-lado">${lado(r.L)}</div><span class="mj-igual">=</span><div class="mj-lado">${lado(r.Rr)}</div></div>
            <div class="mj-viga" aria-hidden="true"></div><div class="mj-fulcro" aria-hidden="true"></div></div>
          <p class="mj-pasos">Pasos: <b>${r.pasos}</b></p>`,
        botones: `<div class="mj-ops">
          <button type="button" class="btn chico" data-op="x" ${quitarX ? '' : 'disabled'}>− 1 caja x a cada lado</button>
          <button type="button" class="btn chico" data-op="1">− 1 kg a cada lado</button>
          <button type="button" class="btn chico" data-op="5">− 5 kg a cada lado</button>
          <span class="mj-div">÷ ambos lados por ${[2, 3, 4, 5, 6].map((k) => `<button type="button" class="btn chico" data-op="d${k}">${k}</button>`).join('')}</span></div>` };
    },
    conectar(r, A, area) {
      document.querySelectorAll('#modal [data-op]').forEach((b) => b.addEventListener('click', () => {
        const op = b.dataset.op, L = r.L, D = r.Rr;
        if (op === 'x') { L.x -= 1; D.x -= 1; }
        else if (op === '1' || op === '5') {
          const k = Number(op);
          if (L.n < k || D.n < k) return A.error(`No puedes quitar ${k} kg de cada lado: ${L.n < k ? 'a la izquierda' : 'a la derecha'} no hay ${k} kg sueltos.`);
          L.n -= k; D.n -= k;
        } else {
          const k = Number(op.slice(1));
          const solo = (q) => q.n === 0 && q.x > 0, peso = (q) => q.x === 0;
          if (!((solo(L) && peso(D)) || (solo(D) && peso(L)))) return A.error('Para dividir, primero deja solo cajas «x» de un lado y solo pesas del otro (quita las cajas y los kilos que sobran).');
          const cx = solo(L) ? L : D, cp = solo(L) ? D : L;
          if (cx.x % k || cp.n % k) return A.error(`No se puede repartir en ${k} partes iguales: ${cx.x} cajas o ${cp.n} kg no se dividen exacto por ${k}.`);
          cx.x /= k; cp.n /= k;
        }
        r.pasos += 1;
        if (L.x < 0 || D.x < 0) return A.error('No hay cajas para quitar en ambos lados.');
        const una = (q, o) => q.x === 1 && q.n === 0 && o.x === 0;
        if (una(L, D) || una(D, L)) return A.ronda(true, `¡Equilibrio! Cada caja pesa <b>x = ${(una(L, D) ? D : L).n} kg</b> (lo lograste en ${r.pasos} pasos).`);
        J().sfx('acierto'); A.pintar();
      }));
    },
  };

  // ===================================================================
  // 4 · Canales del oasis (proporcionalidad · 8°: función afín)
  // ===================================================================
  const afin = (m, n) => `y = ${m === 0 ? "" : m === 1 ? "x" : m === -1 ? "−x" : `${num(m)}x`}${n === 0 ? (m === 0 ? "0" : "") : `${m === 0 ? "" : n < 0 ? " − " : " + "}${m === 0 ? num(n) : Math.abs(n)}`}`;
  const K7 = [[1, 4], [1, 3], [1, 2], [2, 3], [1, 1], [3, 2], [2, 1], [5, 2], [3, 1], [4, 1]];
  const M8 = [-3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3];
  const oasis = {
    generar() {
      if (!es8()) {
        const ki = R(0, K7.length - 1), [p, q] = K7[ki], xs = [];
        for (let x = 1; x <= 10; x++) if ((p * x) % q === 0 && (p * x) / q <= 10) xs.push(x);
        const pts = mezclar(xs).slice(0, 2).sort((a, b) => a - b).map((x) => [x, (p * x) / q]);
        return { pts, ki: K7.findIndex(([a, b]) => a === 1 && b === 1), sol: ki };
      }
      for (let t = 0; t < 200; t++) {
        const m = pick(M8.filter((v) => v !== 0)), n = R(-4, 4), xs = [];
        for (let x = -6; x <= 6; x++) { const y = m * x + n; if (Number.isInteger(y) && Math.abs(y) <= 6) xs.push(x); }
        if (xs.length < 3) continue;
        const pts = mezclar(xs).slice(0, 2).sort((a, b) => a - b).map((x) => [x, m * x + n]);
        if (Math.abs(pts[0][0] - pts[1][0]) < 2) continue;
        return { pts, m: 1, n: 0, sm: m, sn: n };
      }
      return oasis.generar();
    },
    linea(r) { if (!es8()) { const [p, q] = K7[r.ki]; return (x) => (p * x) / q; } return (x) => r.m * x + r.n; },
    vista(r) {
      const ocho = es8(), lo = ocho ? -6 : 0, hi = ocho ? 6 : 10, W = 300, sc = W / (hi - lo);
      const X = (x) => (x - lo) * sc, Y = (y) => W - (y - lo) * sc, f = oasis.linea(r);
      let grid = '';
      for (let v = lo; v <= hi; v++) grid += `<line x1="${X(v)}" y1="0" x2="${X(v)}" y2="${W}" class="g"/><line x1="0" y1="${Y(v)}" x2="${W}" y2="${Y(v)}" class="g"/>`;
      const ejes = `<line x1="${X(0)}" y1="0" x2="${X(0)}" y2="${W}" class="e"/><line x1="0" y1="${Y(0)}" x2="${W}" y2="${Y(0)}" class="e"/>`;
      const etq = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter((v) => v && v % 2 === 0).map((v) => `<text x="${X(v)}" y="${Y(0) + 12}" class="t">${v}</text><text x="${X(0) - 4}" y="${Y(v) + 4}" class="t" text-anchor="end">${v}</text>`).join('');
      const cl = `x1="${X(lo)}" y1="${Y(f(lo))}" x2="${X(hi)}" y2="${Y(f(hi))}"`;
      const linea = `<line ${cl} class="canal borde"/><line ${cl} class="canal"/><line ${cl} class="canal flujo"/>`;
      const oas = r.pts.map(([x, y]) => `<circle cx="${X(x)}" cy="${Y(y)}" r="13" class="charco"/><circle cx="${X(x)}" cy="${Y(y)}" r="13" class="onda"/><text x="${X(x)}" y="${Y(y) + 7}" class="o" text-anchor="middle">🌴</text><text x="${X(x) + (x > hi - 3 ? -14 : 14)}" y="${Y(y) - 12}" class="t coord" text-anchor="${x > hi - 3 ? 'end' : 'start'}">(${num(x)}, ${num(y)})</text>`).join('');
      const kTxt = !ocho ? frac(...K7[r.ki]) : '';
      const ecu = !ocho ? `y = ${M(kTxt)} · x` : afin(r.m, r.n);
      return { titulo: `Canal: ${ecu}`,
        instr: ocho ? 'La pendiente m dice cuánto sube (o baja) el canal por cada paso a la derecha; n es dónde corta al eje Y.' : 'En una proporcionalidad directa, y = k · x: k es lo que vale y cuando x = 1. Mira un oasis y calcula k = y ÷ x.',
        cuerpo: `<div class="mj-oasis"><svg class="mj-plano" viewBox="-16 -6 ${W + 22} ${W + 22}" role="img" aria-label="Plano con los oasis y el canal">${grid}${ejes}${etq}${linea}${oas}</svg>
          <div class="mj-control">${ocho ? `<span class="mj-paso"><em>pendiente m</em><button type="button" class="btn chico" data-c="m-" aria-label="Bajar m">−</button><b>${num(r.m)}</b><button type="button" class="btn chico" data-c="m+" aria-label="Subir m">+</button></span>
            <span class="mj-paso"><em>posición n</em><button type="button" class="btn chico" data-c="n-" aria-label="Bajar n">−</button><b>${num(r.n)}</b><button type="button" class="btn chico" data-c="n+" aria-label="Subir n">+</button></span>`
            : `<span class="mj-paso"><em>constante k</em><button type="button" class="btn chico" data-c="k-" aria-label="Bajar k">−</button><b>${M(kTxt)}</b><button type="button" class="btn chico" data-c="k+" aria-label="Subir k">+</button></span>`}</div></div>`,
        botones: '<button type="button" class="btn pri" id="mj-agua">💧 Abrir compuertas</button>' };
    },
    conectar(r, A, area) {
      enArea(area, '[data-c]', (b) => {
        const c = b.dataset.c;
        if (c === 'k-') r.ki = Math.max(0, r.ki - 1); if (c === 'k+') r.ki = Math.min(K7.length - 1, r.ki + 1);
        if (c === 'm-') r.m = Math.max(-3, r.m - 0.5); if (c === 'm+') r.m = Math.min(3, r.m + 0.5);
        if (c === 'n-') r.n = Math.max(-6, r.n - 1); if (c === 'n+') r.n = Math.min(6, r.n + 1);
        A.pintar();
      });
      boton('mj-agua', () => {
        const f = oasis.linea(r), malo = r.pts.find(([x, y]) => !igual(f(x), y));
        if (!malo) return A.ronda(true, `¡El agua llegó a todos los oasis! ${es8() ? afin(r.m, r.n) : `k = ${M(frac(...K7[r.ki]))}`}.`);
        A.error(`El agua pasa por (${num(malo[0])}, ${M(num(f(malo[0])))}), pero el oasis está en (${num(malo[0])}, ${num(malo[1])}).`);
      });
    },
  };

  // ===================================================================
  // 5 · Tallado de gemas (área en geoplano · 8°: Pitágoras)
  // ===================================================================
  const areaPol = (v) => Math.abs(v.reduce((s, [x, y], i) => { const [a, b] = v[(i + 1) % v.length]; return s + x * b - a * y; }, 0)) / 2;
  const gemas = {
    generar(ronda) {
      if (!es8()) {
        const tipo = ['rect', 'tri', 'libre'][ronda];
        const meta = tipo === 'rect' ? pick([4, 6, 8, 9, 10, 12]) : tipo === 'tri' ? pick([3, 4, 4.5, 5, 6, 7.5, 8]) : pick([5, 7, 9, 11]);
        return { tipo, meta, v: [], cerrado: false };
      }
      const pares = []; for (let a = 1; a <= 5; a++) for (let b = a; b <= 5; b++) pares.push(a * a + b * b);
      const opciones = [...new Set(pares)].filter((k) => k >= 5);
      return { tipo: 'seg', meta: pick(opciones), v: [] };
    },
    vista(r) {
      const N = 6, S = 46, o = 18, W = o * 2 + S * (N - 1);
      const P2 = ([x, y]) => [o + x * S, o + (N - 1 - y) * S];
      let pegs = '';
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const [px, py] = P2([x, y]); const on = r.v.some(([a, b]) => a === x && b === y); pegs += `<circle cx="${px}" cy="${py}" r="${on ? 9 : 6}" class="clavo ${on ? 'on' : ''}" data-x="${x}" data-y="${y}" tabindex="0" role="button" aria-label="Clavo ${x}, ${y}"/>`; }
      const pts = r.v.map(P2).map((p) => p.join(',')).join(' ');
      const forma = r.v.length >= 2 ? (r.cerrado || r.tipo === 'seg' ? `<polygon points="${pts}" class="gema"/>` : `<polyline points="${pts}" class="gema abierta"/>`) : '';
      const metaTxt = r.tipo === 'seg' ? (Number.isInteger(Math.sqrt(r.meta)) ? `${Math.sqrt(r.meta)}` : `√${r.meta}`) : num(r.meta);
      const titulo = { rect: `Talla un rectángulo de área ${metaTxt}`, tri: `Talla un triángulo de área ${metaTxt}`, libre: `Talla cualquier gema de área ${metaTxt}`, seg: `Haz un corte de longitud ${metaTxt}` }[r.tipo];
      return { titulo,
        instr: r.tipo === 'seg' ? 'Toca dos clavos. La longitud del corte es √(Δx² + Δy²): busca dos números cuyos cuadrados sumen lo pedido.'
          : `Toca los clavos en orden para marcar las esquinas y vuelve a tocar el primero para cerrar la gema. Cada cuadrito mide 1 de área.${r.tipo === 'tri' ? ' Triángulo: base × altura ÷ 2.' : ''}`,
        cuerpo: `<div class="mj-taller"><svg class="mj-geoplano ${r.cerrado ? 'cerrada' : ''}" viewBox="0 0 ${W} ${W}"><defs><linearGradient id="mj-gema-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9ff3ff"/><stop offset=".5" stop-color="#4fb8ff"/><stop offset="1" stop-color="#b98cff"/></linearGradient></defs>${forma}${pegs}</svg>
          <div class="mj-meta"><span aria-hidden="true">${r.tipo === 'seg' ? '📏' : '💎'}</span><em>${r.tipo === 'seg' ? 'Longitud' : 'Área'} pedida</em><b>${metaTxt}</b><small>${r.tipo === 'seg' ? `${r.v.length} de 2 clavos` : r.cerrado ? 'gema cerrada: ¡tállala!' : `${r.v.length} ${r.v.length === 1 ? 'esquina' : 'esquinas'}`}</small></div></div>`,
        botones: `<button type="button" class="btn" id="mj-borrar">↺ Borrar</button><button type="button" class="btn pri" id="mj-tallar" ${(r.tipo === 'seg' ? r.v.length === 2 : r.cerrado) ? '' : 'disabled'}>💎 Tallar</button>` };
    },
    conectar(r, A, area) {
      area.querySelectorAll('.clavo').forEach((c) => {
        const toque = () => {
          const p = [Number(c.dataset.x), Number(c.dataset.y)];
          if (r.tipo === 'seg') { if (r.v.length >= 2) r.v = []; if (!r.v.some(([a, b]) => a === p[0] && b === p[1])) r.v.push(p); return A.pintar(); }
          if (r.cerrado) return;
          if (r.v.length >= 3 && r.v[0][0] === p[0] && r.v[0][1] === p[1]) { r.cerrado = true; return A.pintar(); }
          if (r.v.some(([a, b]) => a === p[0] && b === p[1])) return;
          r.v.push(p); A.pintar();
        };
        c.addEventListener('click', toque);
        c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toque(); } });
      });
      boton('mj-borrar', () => { r.v = []; r.cerrado = false; A.pintar(); });
      boton('mj-tallar', () => {
        if (r.tipo === 'seg') {
          const dx = Math.abs(r.v[0][0] - r.v[1][0]), dy = Math.abs(r.v[0][1] - r.v[1][1]), k = dx * dx + dy * dy;
          const txt = `√(${dx}² + ${dy}²) = √${k}${Number.isInteger(Math.sqrt(k)) ? ` = ${Math.sqrt(k)}` : ''}`;
          r.v = [];
          if (k === r.meta) return A.ronda(true, `¡Corte perfecto! ${txt}.`);
          return A.error(`Tu corte mide ${txt} y necesitas ${Number.isInteger(Math.sqrt(r.meta)) ? Math.sqrt(r.meta) : `√${r.meta}`}.`);
        }
        const ar = areaPol(r.v);
        const esRect = r.v.length === 4 && r.v.every(([x, y], i) => { const [a, b] = r.v[(i + 1) % 4]; return x === a || y === b; });
        const v = r.v; r.v = []; r.cerrado = false;
        if (r.tipo === 'rect' && !esRect) return A.error('Eso no es un rectángulo: usa 4 esquinas con lados horizontales y verticales.');
        if (r.tipo === 'tri' && v.length !== 3) return A.error('Un triángulo tiene exactamente 3 esquinas.');
        if (igual(ar, r.meta)) return A.ronda(true, `¡Gema perfecta! Su área es ${num(ar)}.`);
        A.error(`Tu gema tiene área ${num(ar)} y se pedía ${num(r.meta)}.`);
      });
    },
  };

  // ===================================================================
  // 6 · Rayo de luz (ángulos · 8°: transformaciones isométricas)
  // ===================================================================
  const rayo = {
    generar() {
      if (!es8()) {
        const t = pick(['tri', 'cuad', 'reg', 'suma']);
        if (t === 'tri') { const a = R(25, 95), b = R(20, 150 - a); return { t, dat: [a, b], sol: 180 - a - b, txt: `Dos ángulos del triángulo miden ${a}° y ${b}°. ¿Cuánto mide el tercero?` }; }
        if (t === 'cuad') { const a = R(60, 120), b = R(60, 120), c = R(50, 110); const d = 360 - a - b - c; if (d < 30 || d > 170) return rayo.generar(); return { t, dat: [a, b, c], sol: d, txt: `Tres ángulos del cuadrilátero miden ${a}°, ${b}° y ${c}°. ¿Cuánto mide el cuarto?` }; }
        if (t === 'reg') { const n = pick([3, 4, 5, 6, 8, 9, 10, 12]); return { t, n, sol: (180 * (n - 2)) / n, txt: `¿Cuánto mide cada ángulo interior de un polígono regular de ${n} lados?` }; }
        const n = pick([5, 6, 7, 8, 9, 10, 12]); return { t, n, sol: 180 * (n - 2), txt: `¿Cuánto suman los ángulos interiores de un polígono de ${n} lados?` };
      }
      const t = pick(['ejeX', 'ejeY', 'rot90', 'rot180', 'tras']);
      let x = R(-5, 5), y = R(-5, 5); if (!x) x = 2; if (!y) y = -3;
      if (t === 'ejeX') return { t, p: [x, y], sol: [x, -y], txt: 'El espejo es el <b>eje X</b>: ¿dónde queda el reflejo del cristal?' };
      if (t === 'ejeY') return { t, p: [x, y], sol: [-x, y], txt: 'El espejo es el <b>eje Y</b>: ¿dónde queda el reflejo del cristal?' };
      if (t === 'rot90') return { t, p: [x, y], sol: [-y, x], txt: 'El espejo giratorio <b>rota el cristal 90° en sentido antihorario</b> con centro en el origen. ¿Dónde queda?' };
      if (t === 'rot180') return { t, p: [x, y], sol: [-x, -y], txt: 'El espejo giratorio <b>rota el cristal 180°</b> con centro en el origen. ¿Dónde queda?' };
      const a = R(-4, 4) || 3, b = R(-4, 4) || -2;
      return { t, p: [x, y], v: [a, b], sol: [x + a, y + b], txt: `El rayo <b>traslada el cristal según el vector (${num(a)}, ${num(b)})</b>. ¿Dónde queda?` };
    },
    vista(r) {
      if (!es8()) {
        let fig = '';
        if (r.t === 'reg' || r.t === 'suma') { const n = r.n, c = 80, rad = 62; const pts = Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / n; return `${c + rad * Math.cos(a)},${c + rad * Math.sin(a)}`; }).join(' '); fig = `<polygon points="${pts}" class="pol"/>`; }
        else if (r.t === 'tri') fig = `<polygon points="20,140 150,140 70,25" class="pol"/><text x="34" y="132" class="t">${r.dat[0]}°</text><text x="118" y="132" class="t">${r.dat[1]}°</text><text x="64" y="48" class="t q">?</text>`;
        else fig = `<polygon points="20,140 145,135 130,30 35,45" class="pol"/><text x="30" y="130" class="t">${r.dat[0]}°</text><text x="118" y="126" class="t">${r.dat[1]}°</text><text x="106" y="50" class="t">${r.dat[2]}°</text><text x="44" y="62" class="t q">?</text>`;
        return { titulo: 'Orienta el espejo', instr: 'Recuerda: los ángulos de un triángulo suman 180° y los de un polígono de n lados suman 180° · (n − 2). (Dibujo sin escala).',
          cuerpo: `<div class="mj-rayo"><div class="mj-foco"><svg viewBox="0 0 160 160" class="mj-fig">${fig}</svg></div><div class="mj-tarjeta"><p class="enunciado">${r.txt}</p><label class="mj-entrada"><input type="text" inputmode="decimal" id="mj-ang" autocomplete="off" aria-label="Ángulo en grados"> °</label></div></div>`,
          botones: '<button type="button" class="btn pri" id="mj-disparar">🔦 Disparar el rayo</button>' };
      }
      const W = 240, lo = -9, hi = 9, sc = W / (hi - lo), X = (x) => (x - lo) * sc, Y = (y) => W - (y - lo) * sc;
      let g = ''; for (let v = lo; v <= hi; v++) g += `<line x1="${X(v)}" y1="0" x2="${X(v)}" y2="${W}" class="g"/><line x1="0" y1="${Y(v)}" x2="${W}" y2="${Y(v)}" class="g"/>`;
      const esp = r.t === 'ejeX' ? `<line x1="0" y1="${Y(0)}" x2="${W}" y2="${Y(0)}" class="espejo"/>` : r.t === 'ejeY' ? `<line x1="${X(0)}" y1="0" x2="${X(0)}" y2="${W}" class="espejo"/>` : '';
      const vec = r.v ? `<line x1="${X(r.p[0])}" y1="${Y(r.p[1])}" x2="${X(r.p[0] + r.v[0])}" y2="${Y(r.p[1] + r.v[1])}" class="vec"/>` : '';
      return { titulo: `Cristal en (${num(r.p[0])}, ${num(r.p[1])})`, instr: 'Escribe las coordenadas de la imagen del cristal.',
        cuerpo: `<div class="mj-rayo"><div class="mj-foco"><svg viewBox="0 0 ${W} ${W}" class="mj-fig plano"><defs><marker id="mj-flecha" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10z" class="punta"/></marker></defs> ${g}<line x1="${X(0)}" y1="0" x2="${X(0)}" y2="${W}" class="e"/><line x1="0" y1="${Y(0)}" x2="${W}" y2="${Y(0)}" class="e"/><text x="${W - 4}" y="${Y(0) - 4}" class="t" text-anchor="end">x</text><text x="${X(0) + 5}" y="10" class="t">y</text>${esp}${vec}<circle cx="${X(r.p[0])}" cy="${Y(r.p[1])}" r="12" class="halo"/><text x="${X(r.p[0])}" y="${Y(r.p[1]) + 6}" text-anchor="middle" class="o">💎</text></svg></div>
          <div class="mj-tarjeta"><p class="enunciado">${r.txt}</p><label class="mj-entrada">( <input type="text" inputmode="decimal" id="mj-cx" aria-label="Coordenada x" autocomplete="off"> , <input type="text" inputmode="decimal" id="mj-cy" aria-label="Coordenada y" autocomplete="off"> )</label></div></div>`,
        botones: '<button type="button" class="btn pri" id="mj-disparar">🔦 Disparar el rayo</button>' };
    },
    conectar(r, A) {
      const ir = () => {
        if (!es8()) {
          const v = leerNum(J().$('mj-ang').value); if (Number.isNaN(v)) return;
          if (igual(v, r.sol)) return A.ronda(true, `¡El rayo iluminó el cristal! Eran ${num(r.sol)}°.`);
          const como = r.t === 'tri' ? `180° − ${r.dat[0]}° − ${r.dat[1]}° = ${r.sol}°` : r.t === 'cuad' ? `360° − ${r.dat.join('° − ')}° = ${r.sol}°` : r.t === 'reg' ? `180° · (${r.n} − 2) ÷ ${r.n} = ${num(r.sol)}°` : `180° · (${r.n} − 2) = ${r.sol}°`;
          return A.ronda(false, `El rayo se desvió. Lo correcto: ${como}.`);
        }
        const x = leerNum(J().$('mj-cx').value), y = leerNum(J().$('mj-cy').value); if (Number.isNaN(x) || Number.isNaN(y)) return;
        if (igual(x, r.sol[0]) && igual(y, r.sol[1])) return A.ronda(true, `¡Exacto! La imagen es (${num(r.sol[0])}, ${num(r.sol[1])}).`);
        const regla = { ejeX: 'reflejar en el eje X cambia el signo de y', ejeY: 'reflejar en el eje Y cambia el signo de x', rot90: 'rotar 90° antihorario: (x, y) → (−y, x)', rot180: 'rotar 180°: (x, y) → (−x, −y)', tras: 'trasladar: se suman las coordenadas del vector' }[r.t];
        A.ronda(false, `No era. Regla: ${regla}. La imagen era (${num(r.sol[0])}, ${num(r.sol[1])}).`);
      };
      boton('mj-disparar', ir);
      document.querySelectorAll('#modal .mj-entrada input').forEach((i) => i.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); ir(); } }));
      const f = document.querySelector('#modal .mj-entrada input'); if (f) setTimeout(() => f.focus(), 60);
    },
  };

  // ===================================================================
  // 7 · Carga exacta (áreas · 8°: volúmenes)
  // ===================================================================
  function pieza7() {
    const t = pick(['rect', 'tri', 'trap', 'para']);
    if (t === 'rect') { const a = R(2, 6), b = R(2, 5); return { t: `▭ Rectángulo ${a} × ${b}`, v: a * b }; }
    if (t === 'para') { const b = R(2, 6), h = R(2, 5); return { t: `▱ Paralelogramo base ${b}, altura ${h}`, v: b * h }; }
    if (t === 'tri') { let b = R(2, 8), h = R(2, 6); if ((b * h) % 2) b += 1; return { t: `◺ Triángulo base ${b}, altura ${h}`, v: (b * h) / 2 }; }
    let B = R(4, 8), b = R(2, B - 1), h = R(2, 4); if (((B + b) * h) % 2) h += 1; return { t: `⏢ Trapecio bases ${B} y ${b}, altura ${h}`, v: ((B + b) * h) / 2 };
  }
  function pieza8() {
    const t = pick(['cubo', 'prisma', 'cil', 'tri']);
    if (t === 'cubo') { const a = R(2, 4); return { t: `🧊 Cubo de arista ${a}`, v: a ** 3 }; }
    if (t === 'prisma') { const a = R(2, 5), b = R(2, 4), c = R(1, 3); return { t: `📦 Prisma ${a} × ${b} × ${c}`, v: a * b * c }; }
    if (t === 'cil') { const r = R(1, 3), h = R(1, 4); return { t: `🛢️ Cilindro radio ${r}, altura ${h}`, v: 3 * r * r * h }; }
    let b = R(2, 6), h = R(2, 4), L = R(2, 4); if ((b * h) % 2) b += 1; return { t: `🔺 Prisma triangular: triángulo base ${b} y altura ${h}, largo ${L}`, v: (b * h * L) / 2 };
  }
  function medidas(v, dims) {
    const out = [];
    if (dims === 2) { for (let a = 2; a <= 12; a++) if (v % a === 0 && v / a >= 2 && v / a <= 12) out.push([a, v / a]); }
    else for (let a = 2; a <= 10; a++) for (let b = 2; b <= 10; b++) if (v % (a * b) === 0 && v / (a * b) >= 1 && v / (a * b) <= 10) out.push([a, b, v / (a * b)]);
    return out.length ? pick(out) : null;
  }
  const carga = {
    generar(ronda) {
      const ocho = es8(), gen = ocho ? pieza8 : pieza7;
      for (let t = 0; t < 300; t++) {
        const sol = Array.from({ length: ronda === 0 ? 2 : 3 }, gen), meta = sol.reduce((s, p) => s + p.v, 0);
        const dims = medidas(meta, ocho ? 3 : 2); if (!dims) continue;
        const otros = []; while (otros.length < 3) { const p = gen(); if (p.v !== meta) otros.push(p); }
        return { meta, dims, piezas: mezclar([...sol, ...otros]), sel: new Set() };
      }
      return carga.generar(0);
    },
    vista(r) {
      const ocho = es8();
      return { titulo: ocho ? `Vagoneta de ${r.dims.join(' × ')} (volumen a llenar)` : `Piso de la vagoneta: ${r.dims.join(' × ')}`,
        instr: ocho ? 'Calcula el volumen de la vagoneta (largo × ancho × alto) y el de cada bloque. Cilindro: π · r² · h con π ≈ 3. Prisma triangular: (base × altura ÷ 2) × largo.'
          : 'Calcula el área del piso (largo × ancho) y la de cada placa. Triángulo: b · h ÷ 2. Trapecio: (B + b) · h ÷ 2.',
        cuerpo: `<div class="mj-via"><div class="mj-vagon ${r.sel.size ? 'con-carga' : ''}"><div class="mj-vagon-carga" aria-hidden="true">${[...r.sel].map((i) => `<i>${partir(r.piezas[i].t)[0]}</i>`).join('')}</div>
              <div class="mj-vagon-caja"><b>${r.dims.join(' × ')}</b><small>${ocho ? 'volumen a llenar' : 'área del piso'}</small></div><span class="mj-rueda" aria-hidden="true"></span><span class="mj-rueda" aria-hidden="true"></span></div>
            <p class="mj-elegido">${r.sel.size ? `<b>${r.sel.size}</b> ${r.sel.size === 1 ? 'pieza elegida' : 'piezas elegidas'} · suma sin calcular` : 'Aún no eliges nada'}</p></div>
          <div class="mj-opciones piezas">${r.piezas.map((p, i) => { const [ic, tx] = partir(p.t); return `<button type="button" class="mj-op mj-pieza ${r.sel.has(i) ? 'sel' : ''}" data-i="${i}" aria-pressed="${r.sel.has(i)}"><span class="mj-op-ico" aria-hidden="true">${ic}</span><span class="mj-op-txt">${E(tx)}</span></button>`; }).join('')}</div>`,
        botones: `<button type="button" class="btn pri" id="mj-cargar" ${r.sel.size ? '' : 'disabled'}>🛒 Cargar</button>` };
    },
    conectar(r, A, area) {
      enArea(area, '.mj-op', (b) => { const i = Number(b.dataset.i); if (r.sel.has(i)) r.sel.delete(i); else r.sel.add(i); A.pintar(); });
      boton('mj-cargar', () => {
        const suma = [...r.sel].reduce((s, i) => s + r.piezas[i].v, 0), u = es8() ? '³' : '²';
        const det = [...r.sel].map((i) => r.piezas[i].v).join(' + ');
        if (suma === r.meta) return A.ronda(true, `¡Carga exacta! ${det} = ${r.meta} u${u} = ${r.dims.join(' × ')}.`);
        r.sel.clear();
        A.error(`Cargaste ${det} = ${suma} u${u}, pero la vagoneta necesita ${r.dims.join(' × ')} = ${r.meta} u${u}. ${suma > r.meta ? 'Te pasaste.' : 'Falta.'}`);
      });
    },
  };

  // ===================================================================
  // 8 · Trineo del azar (probabilidad)
  // ===================================================================
  function dispositivo() {
    const ocho = es8() && Math.random() < 0.6;
    if (ocho) {
      const t = pick(['dados7', 'dados_may', 'monedas2', 'monedas1', 'dadoMoneda']);
      if (t === 'dados7') return { txt: '🎲🎲 Lanzas dos dados: avanzas si suman 7', p: [6, 36] };
      if (t === 'dados_may') { const k = R(8, 10); const c = [...Array(36)].filter((_, i) => Math.floor(i / 6) + (i % 6) + 2 > k).length; return { txt: `🎲🎲 Lanzas dos dados: avanzas si suman más de ${k}`, p: [c, 36] }; }
      if (t === 'monedas2') return { txt: '🪙🪙 Lanzas dos monedas: avanzas si salen dos caras', p: [1, 4] };
      if (t === 'monedas1') return { txt: '🪙🪙 Lanzas dos monedas: avanzas si sale al menos una cara', p: [3, 4] };
      return { txt: '🎲🪙 Lanzas un dado y una moneda: avanzas si sale cara y un número par', p: [3, 12] };
    }
    const t = pick(['urna', 'dado', 'ruleta', 'dadoPar']);
    if (t === 'urna') { const a = R(1, 6), b = R(1, 6); return { txt: `🫙 Urna con ${a} bolitas azules y ${b} rojas: avanzas si sacas una azul`, p: [a, a + b] }; }
    if (t === 'dado') { const k = R(1, 5); return { txt: `🎲 Lanzas un dado: avanzas si sale más de ${k}`, p: [6 - k, 6] }; }
    if (t === 'dadoPar') return { txt: '🎲 Lanzas un dado: avanzas si sale un múltiplo de 3', p: [2, 6] };
    const n = pick([4, 5, 8, 10]), m = R(1, n - 1); return { txt: `🎡 Ruleta de ${n} partes iguales, ${m} verdes: avanzas si cae en verde`, p: [m, n] };
  }
  const trineo = {
    generar() {
      for (let t = 0; t < 100; t++) { const a = dispositivo(), b = dispositivo(); if (Math.abs(a.p[0] / a.p[1] - b.p[0] / b.p[1]) > 0.05) return { ops: [a, b] }; }
      return { ops: [{ txt: '🎲 Lanzas un dado: avanzas si sale más de 2', p: [4, 6] }, { txt: '🪙 Lanzas una moneda: avanzas si sale cara', p: [1, 2] }] };
    },
    vista(r) {
      return { titulo: '¿Qué camino tomas?', instr: 'Elige el camino con <b>mayor probabilidad</b> de avanzar. Compara fracciones: casos favorables ÷ casos posibles.',
        cuerpo: `<div class="mj-pista" aria-hidden="true"><i class="mj-trineo" style="--p:${P ? Math.round((P.ronda / P.def.rondas) * 100) : 0}%">🛷</i><span>🏁</span></div>
          <div class="mj-caminos">${r.ops.map((o, i) => { const [ic, tx] = partir(o.txt); return `<button type="button" class="mj-camino-op ${i ? 'der' : 'izq'}" data-i="${i}"><span class="mj-camino-tit">${i ? 'Camino derecho ➡️' : '⬅️ Camino izquierdo'}</span><span class="mj-camino-ico" aria-hidden="true">${ic}</span><span class="mj-camino-txt">${E(tx)}</span></button>`; }).join('<span class="mj-bifurca" aria-hidden="true">o</span>')}</div>` };
    },
    conectar(r, A, area) {
      enArea(area, '.mj-camino-op', (b) => {
        const i = Number(b.dataset.i), o = r.ops[i], x = r.ops[1 - i], pf = (q) => M(frac(q.p[0], q.p[1]));
        const suerte = Math.random() < o.p[0] / o.p[1] ? '🛷 ¡Y además tuviste suerte: avanzaste!' : '🎲 Esta vez el azar no ayudó, pero la decisión fue la correcta.';
        if (o.p[0] / o.p[1] > x.p[0] / x.p[1]) return A.ronda(true, `¡Buena decisión! ${pf(o)} es mayor que ${pf(x)}. ${suerte}`);
        A.ronda(false, `El otro camino era más probable: ${pf(x)} es mayor que ${pf(o)}.`);
      });
    },
  };

  // ===================================================================
  // 9 · Estación meteorológica (tendencia central · 8°: cuartiles)
  // ===================================================================
  const mediana = (l) => { const s = l.slice().sort((a, b) => a - b), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  function cuartiles(l) { const s = l.slice().sort((a, b) => a - b), n = s.length, h = Math.floor(n / 2); return [mediana(s.slice(0, h)), mediana(s), mediana(s.slice(n % 2 ? h + 1 : h))]; }
  const meteo = {
    generar(ronda) {
      if (!es8()) {
        const que = ['media', 'mediana', 'moda', 'rango'][ronda % 4], n = R(5, 7);
        let d = Array.from({ length: n }, () => R(-8, 12));
        if (que === 'media') { const s = d.reduce((a, b) => a + b, 0); d[n - 1] -= s % n; }
        if (que === 'moda') { const m = R(-5, 8); d = d.slice(0, n - 3).filter((v) => v !== m); while (d.length < n - 3) d.push(R(-8, 12)); d = [...new Set(d)].concat([m, m, m]).slice(0, n); if (d.filter((v) => v === m).length < 2) d.push(m); }
        const sol = que === 'media' ? d.reduce((a, b) => a + b, 0) / d.length : que === 'mediana' ? mediana(d) : que === 'moda' ? Number(Object.entries(d.reduce((o, v) => ((o[v] = (o[v] || 0) + 1), o), {})).sort((a, b) => b[1] - a[1])[0][0]) : Math.max(...d) - Math.min(...d);
        return { que, d: mezclar(d), sol };
      }
      const que = ['q1', 'q2', 'q3', 'ric'][ronda % 4], d = Array.from({ length: R(7, 10) }, () => R(-12, 10));
      const [q1, q2, q3] = cuartiles(d);
      return { que, d, sol: { q1, q2, q3, ric: q3 - q1 }[que] };
    },
    vista(r) {
      const nom = { media: 'la media (promedio)', mediana: 'la mediana', moda: 'la moda', rango: 'el rango', q1: 'el primer cuartil (Q₁)', q2: 'el segundo cuartil (Q₂, la mediana)', q3: 'el tercer cuartil (Q₃)', ric: 'el rango intercuartil (Q₃ − Q₁)' }[r.que];
      const ayuda = { media: 'Suma todas y divide por la cantidad de datos.', mediana: 'Ordénalas: es el dato del centro (o el promedio de los dos del centro).', moda: 'Es la temperatura que más se repite.', rango: 'Mayor menos menor.', q1: 'Ordena los datos: Q₁ es la mediana de la mitad inferior.', q2: 'Ordena los datos: Q₂ es la mediana.', q3: 'Ordena los datos: Q₃ es la mediana de la mitad superior.', ric: 'Calcula Q₁ y Q₃ y réstalos.' }[r.que];
      return { titulo: `Calibra con ${nom}`, instr: ayuda,
        cuerpo: `<div class="mj-estacion"><div class="mj-datos">${r.d.map((v, i) => `<span style="--h:${Math.round(215 - Math.max(0, Math.min(1, (v + 12) / 24)) * 195)};--i:${i}"><small aria-hidden="true">${v <= 0 ? '❄️' : v >= 8 ? '☀️' : '⛅'}</small>${num(v)}°</span>`).join('')}</div>
          <div class="mj-termo"><div class="mj-termometro" aria-hidden="true"><div class="mj-escala"><i>20</i><i>10</i><i>0</i><i>−10</i></div><div class="mj-tubo"><i id="mj-merc" style="height:43%"></i></div><span class="mj-bulbo"></span></div>
            <div class="mj-tarjeta"><em>Tu lectura</em><label class="mj-entrada"><input type="text" inputmode="decimal" id="mj-temp" autocomplete="off" aria-label="Temperatura"> °C</label></div></div></div>`,
        botones: '<button type="button" class="btn pri" id="mj-calibrar">🌡️ Calibrar</button>' };
    },
    conectar(r, A) {
      const inp = J().$('mj-temp');
      const mover = () => { const v = leerNum(inp.value); const m = J().$('mj-merc'); if (m && !Number.isNaN(v)) m.style.height = `${Math.max(4, Math.min(100, ((v + 15) / 35) * 100))}%`; };
      inp.addEventListener('input', mover);
      const ir = () => {
        const v = leerNum(inp.value); if (Number.isNaN(v)) return;
        if (igual(v, r.sol)) return A.ronda(true, `¡Termómetro calibrado! Era ${num(r.sol)} °C.`);
        A.ronda(false, `No calza: el valor correcto era ${num(r.sol)} °C. Datos ordenados: ${r.d.slice().sort((a, b) => a - b).map(num).join(', ')}.`);
      };
      boton('mj-calibrar', ir);
      inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); ir(); } });
      setTimeout(() => inp.focus(), 60);
    },
  };

  // ===================================================================
  // 10 · Mercado de la base (porcentajes)
  // ===================================================================
  const COSAS = ['🧥 abrigo', '🎒 mochila', '⛏️ pico', '🪓 hacha', '🧭 brújula', '🔦 linterna', '🥾 botas', '🛡️ escudo'];
  const mercado = {
    generar() {
      const cosa = pick(COSAS);
      if (!es8()) {
        const t = pick(['desc', 'desc', 'pct', 'cuanto']);
        if (t === 'desc') { const d = pick([10, 20, 25, 30, 40, 50, 15]), p = pick([2000, 4000, 6000, 8000, 12000, 1200, 3600]); return { cosa, txt: `${cosa} cuesta <b>$${p.toLocaleString('es-CL')}</b> y tiene <b>${d} % de descuento</b>. ¿Cuánto pagas?`, sol: (p * (100 - d)) / 100, como: `${p} − ${d} % de ${p} = ${p} − ${(p * d) / 100}` }; }
        if (t === 'pct') { const d = pick([10, 20, 25, 50, 75, 5]), p = pick([400, 800, 1200, 2000, 3000]); return { cosa, txt: `Pagas con monedas de oro: el ${d} % de ${p} monedas. ¿Cuántas monedas son?`, sol: (p * d) / 100, como: `${p} · ${d} ÷ 100` }; }
        const p = pick([2000, 4000, 5000, 8000]), d = pick([10, 20, 25, 50]); return { cosa, txt: `${cosa} costaba $${p.toLocaleString('es-CL')} y ahora cuesta $${(p * (100 - d) / 100).toLocaleString('es-CL')}. ¿Qué porcentaje de descuento tiene? (escribe solo el número)`, sol: d, como: `${(p * d) / 100} ÷ ${p} · 100` };
      }
      const t = pick(['suc', 'suc', 'pdp', 'aum']);
      if (t === 'suc') { const a = pick([10, 20, 25, 50]), b = pick([10, 20, 50]), p = pick([4000, 8000, 10000, 20000]); return { cosa, txt: `${cosa} cuesta $${p.toLocaleString('es-CL')}. Primero sube un <b>${a} %</b> y luego baja un <b>${b} %</b>. ¿Cuánto cuesta al final?`, sol: (p * (100 + a) * (100 - b)) / 10000, como: `${p} · ${1 + a / 100} · ${1 - b / 100}`.replace(/\./g, ',') }; }
      if (t === 'pdp') { const a = pick([10, 20, 25, 50]), b = pick([20, 40, 50, 80]), p = pick([2000, 4000, 5000, 10000]); return { cosa, txt: `¿Cuánto es el ${a} % del ${b} % de ${p.toLocaleString('es-CL')} monedas?`, sol: (p * a * b) / 10000, como: `${p} · ${b / 100} · ${a / 100}`.replace(/\./g, ',') }; }
      const a = pick([5, 10, 12, 15, 19, 25]), p = pick([1000, 2000, 4000, 10000, 20000]); return { cosa, txt: `${cosa} cuesta $${p.toLocaleString('es-CL')} más un impuesto del <b>${a} %</b>. ¿Cuánto pagas en total?`, sol: (p * (100 + a)) / 100, como: `${p} · ${1 + a / 100}`.replace(/\./g, ',') };
    },
    vista(r) {
      return { titulo: `Puesto del mercado: ${E(r.cosa)}`, instr: 'Escribe solo el número (sin $ ni puntos de miles).',
        cuerpo: `<div class="mj-puesto"><div class="mj-toldo" aria-hidden="true"></div>
            <div class="mj-mostrador"><span class="mj-producto" aria-hidden="true">${partir(r.cosa)[0]}</span>
              <div class="mj-pizarra"><p class="enunciado">${r.txt}</p><label class="mj-entrada mj-etiqueta">$ <input type="text" inputmode="decimal" id="mj-precio" autocomplete="off" aria-label="Respuesta"></label></div>
              <span class="mj-vendedor" aria-hidden="true">🧑‍🌾</span></div></div>`,
        botones: '<button type="button" class="btn pri" id="mj-comprar">🛍️ Comprar</button>' };
    },
    conectar(r, A) {
      const inp = J().$('mj-precio');
      const ir = () => {
        const v = leerNum(String(inp.value).replace(/\.(?=\d{3}(\D|$))/g, '').replace('$', '')); if (Number.isNaN(v)) return;
        if (igual(v, r.sol)) return A.ronda(true, `¡Trato hecho! Era ${num(r.sol)}.`);
        A.ronda(false, `El vendedor no acepta: era ${num(r.sol)} (${r.como} = ${num(r.sol)}).`);
      };
      boton('mj-comprar', ir);
      inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); ir(); } });
      setTimeout(() => inp.focus(), 60);
    },
  };

  const JUEGOS = { puente, frutos, caravana, oasis, gemas, rayo, carga, trineo, meteo, mercado };

  // ===================================================================
  // 11 · Cerradura del grupo (cooperativa, una vez al día)
  // ===================================================================
  const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % 16000000 + 1; };
  async function cerradura(msg = '') {
    const W = J(), S = W.S(), ses = W.sesion();
    const sinGrupo = (t) => { W.ui.abrir(`${cab(MJ.cerradura, 'Base del grupo', 'Cerradura del grupo')}<div class="mjx-portada"><div class="mjx-portada-ico" aria-hidden="true">🔐</div><p class="enunciado">${t}</p></div><div class="acciones"><span></span><button type="button" class="btn pri" id="ce-ok" data-foco>Cerrar</button></div>`, clase('cerradura', 'mjx-inicio')); W.$('ce-ok').addEventListener('click', () => W.ui.cerrar()); };
    if (W.esDocente()) return sinGrupo('La cerradura es un desafío de los grupos de estudiantes: cada integrante resuelve una parte distinta y, cuando están todas, se abre para el grupo.');
    if (ses.modo !== 'nube' || !ses.grupo || !window.Nube || !Nube.cerradura) return sinGrupo('La cerradura se abre en equipo: necesitas estar conectado y en un grupo.');
    let r = null;
    try { r = await Nube.cerradura(ses.token, null); } catch (e) { r = null; }
    if (!r || !r.ok) return sinGrupo('No se pudo cargar la cerradura. Revisa tu conexión e inténtalo otra vez.');
    const ps = (Preguntas.generarFijo ? Preguntas.generarFijo(S.curso, hash(`${r.curso}|${r.grupo}|${r.dia}`), r.n) : []).slice(0, r.n);
    const partes = r.partes || {}, hechas = Object.keys(partes).length, abierta = hechas >= r.n;
    const mia = Object.values(partes).some((x) => x.yo);
    if (abierta && mia && S.cerrCobrada !== r.dia) {
      S.cerrCobrada = r.dia;
      const txt = W.darPremio(W.paquete(10, 4, true), 120); W.contar('cerradura'); W.sfx('logro'); if (W.escena()) W.escena().celebrar();
      msg = `<div class="mensaje bien" role="status">🔓 ¡Cerradura abierta! Tu premio: <b>${E(txt)}</b> y <b>120</b> de experiencia.</div>`;
      W.guardar(true);
    }
    const espera = Math.max(0, (S.cerrEspera || 0) - Date.now());
    W.ui.abrir(`${cab({ ico: abierta ? '🔓' : '🔐' }, 'Base del grupo · se renueva cada día', abierta ? 'Cerradura abierta' : `Cerradura del grupo (${hechas} de ${r.n})`, `<div class="mjx-estado"><span class="mj-anillo ${abierta ? 'ok' : ''}" style="--p:${Math.round((hechas / Math.max(1, r.n)) * 100)}" role="img" aria-label="${hechas} de ${r.n} partes resueltas"><b>${hechas}/${r.n}</b></span></div>`)}
      ${msg}
      <p class="nota">Cada integrante resuelve <b>una parte distinta</b>. Cuando todas las partes estén resueltas, la cerradura se abre y quienes ayudaron reciben un premio. ¡Organícense!</p>
      <div class="mj-cerradura">${Array.from({ length: r.n }, (_, i) => { const x = partes[i]; return `<div class="mj-dial ${x ? 'ok' : ''}" style="--i:${i}"><span class="mj-num">${x ? '✓' : i + 1}</span>${x ? `<b>✅ ${E(x.nombre)}${x.yo ? ' (tú)' : ''}</b>` : `<button type="button" class="btn chico" data-parte="${i}" ${mia && r.miembros >= r.n ? 'disabled' : ''}>Resolver</button>`}<small>${ps[i] ? E(ps[i].titulo) : ''}</small></div>`; }).join('')}</div>
      ${!abierta && mia && r.miembros >= r.n ? '<p class="nota">Ya resolviste tu parte. Avísale a tu grupo: faltan las demás.</p>' : ''}
      ${espera ? `<p class="nota">Después de un error debes esperar: podrás intentar de nuevo en ${Math.ceil(espera / 60000)} min.</p>` : ''}
      <div class="acciones"><button type="button" class="btn" id="ce-act">Actualizar</button><button type="button" class="btn pri" id="ce-ok" data-foco>Cerrar</button></div>
      ${abierta && /mensaje bien/.test(msg) ? confeti(26, 'base') : ''}`, clase('cerradura', abierta ? 'abierta' : ''));
    W.$('ce-ok').addEventListener('click', () => W.ui.cerrar());
    W.$('ce-act').addEventListener('click', () => cerradura());
    document.querySelectorAll('#modal [data-parte]').forEach((b) => b.addEventListener('click', () => {
      if ((S.cerrEspera || 0) > Date.now()) return W.toast(`Espera ${Math.ceil(((S.cerrEspera || 0) - Date.now()) / 60000)} min para volver a intentar.`, 'alerta');
      const i = Number(b.dataset.parte), d = ps[i]; if (!d) return;
      let elegida = null;
      const pintarP = () => {
        W.ui.abrir(`${cab(MJ.cerradura, `Parte ${i + 1} de ${r.n} · ${E(d.titulo)}`, 'Resuelve tu parte', '<div class="mjx-estado"><span class="pildora">☝️ Un intento</span></div>')}
          <p class="enunciado">${M(d.enunciado)}</p>
          <div class="alternativas">${d.opciones.map((o, k) => `<button type="button" class="alt" data-k="${k}" aria-pressed="${elegida === k}">${M(o)}</button>`).join('')}</div>
          <div class="acciones"><button type="button" class="btn" id="ce-volver">Volver</button><button type="button" class="btn pri" id="ce-resp" ${elegida === null ? 'disabled' : ''}>Responder</button></div>`, clase('cerradura', 'parte'));
        document.querySelectorAll('#modal .alt').forEach((x) => x.addEventListener('click', () => { elegida = Number(x.dataset.k); pintarP(); }));
        W.$('ce-volver').addEventListener('click', () => cerradura());
        W.$('ce-resp').addEventListener('click', async () => {
          const ok = elegida === d.correcta;
          if (d.tema) W.registrar(d.tema, ok);
          if (!ok) { S.cerrEspera = Date.now() + 3 * 60000; W.sfx('error'); W.guardar(); return cerradura(`<div class="mensaje mal" role="status">No era esa: la correcta era <b>${M(d.opciones[d.correcta])}</b>. ${M(d.explicacion || '')} Podrás intentar de nuevo en 3 minutos (o que lo intente otro integrante).</div>`); }
          let x = null; try { x = await Nube.cerradura(ses.token, i); } catch (e) { x = null; }
          W.sfx('acierto');
          const err = x && !x.ok ? x.error : null;
          cerradura(err === 'resuelta' ? '<div class="mensaje pista">¡Bien! Pero un compañero resolvió esta parte justo antes que tú.</div>' : err === 'ya_resolviste' ? '<div class="mensaje pista">¡Bien! Pero ya habías resuelto una parte hoy.</div>' : !x ? '<div class="mensaje mal">No se pudo guardar tu parte: revisa tu conexión.</div>' : '<div class="mensaje bien">✅ ¡Parte resuelta! Tu nombre quedó en la cerradura.</div>');
        });
      };
      pintarP();
    }));
  }

  window.Minijuegos = {
    abrir,
    de: (zona) => Object.entries(MJ).filter(([, d]) => d.zona === zona).map(([id, d]) => ({ id, ico: d.ico, nombre: d.nombre })),
    lista: () => Object.entries(MJ).map(([id, d]) => ({ id, ico: d.ico, nombre: d.nombre, zona: d.zona })),
    _juegos: JUEGOS,
    _partida: () => P,
  };
})();
