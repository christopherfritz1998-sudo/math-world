// Math World — música y efectos de sonido sintetizados en el navegador (Web Audio, estilo 8 bits).
// No usa archivos: cada mundo tiene su propia pieza compuesta a partir de una escala, una progresión
// de acordes y una melodía fija. El sonido parte silenciado y se activa con el botón de sonido.
(function (global) {
  'use strict';
  const CLAVE = 'mw_sonido';
  const cfg = (() => { try { return Object.assign({ on: false, musica: true, efectos: true, vol: 0.6 }, JSON.parse(localStorage.getItem(CLAVE) || '{}')); } catch (e) { return { on: false, musica: true, efectos: true, vol: 0.6 }; } })();
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(cfg)); } catch (e) { /* */ } };
  let ctx = null, master, busM, busE, eco, ruidoBuf;

  function asegurar() {
    if (ctx) return ctx;
    const AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); busM = ctx.createGain(); busE = ctx.createGain();
    // eco suave para la música de los mundos más misteriosos
    eco = ctx.createDelay(1); eco.delayTime.value = 0.32;
    const fb = ctx.createGain(); fb.gain.value = 0.32; const ecoSal = ctx.createGain(); ecoSal.gain.value = 0.5;
    eco.connect(fb); fb.connect(eco); eco.connect(ecoSal); ecoSal.connect(busM);
    busM.connect(master); busE.connect(master); master.connect(comp); comp.connect(ctx.destination);
    ruidoBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = ruidoBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    aplicar();
    return ctx;
  }
  function aplicar() {
    if (!ctx) return;
    const t = ctx.currentTime;
    master.gain.setTargetAtTime(cfg.on ? cfg.vol : 0, t, 0.05);
    busM.gain.setTargetAtTime(cfg.musica ? 0.9 : 0, t, 0.05);
    busE.gain.setTargetAtTime(cfg.efectos ? 0.75 : 0, t, 0.05);
  }
  // el navegador solo permite sonido después de una acción del usuario
  const desbloquear = () => { if (asegurar() && ctx.state === 'suspended') ctx.resume(); };
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => global.addEventListener(ev, desbloquear, { passive: true }));

  // ---------- instrumentos ----------
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function tono(f, t, dur, o = {}) {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.tipo || 'square';
    osc.frequency.setValueAtTime(f, t);
    if (o.a) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.a), t + dur);
    if (o.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.vib; lg.gain.value = f * 0.03; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + 0.05); }
    const v = o.vol ?? 0.2, at = o.ataque ?? 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + at);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let salida = g;
    if (o.filtro) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.filtro; g.connect(fl); salida = fl; }
    osc.connect(g); salida.connect(o.bus || busE);
    if (o.eco) salida.connect(eco);
    osc.start(t); osc.stop(t + dur + 0.02);
  }
  function ruido(t, dur, o = {}) {
    const s = ctx.createBufferSource(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    s.buffer = ruidoBuf; s.loop = true;
    fl.type = o.filtro || 'lowpass'; fl.frequency.setValueAtTime(o.f || 1200, t);
    if (o.a) fl.frequency.exponentialRampToValueAtTime(o.a, t + dur);
    if (o.q) fl.Q.value = o.q;
    const v = o.vol ?? 0.2;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.ataque ?? 0.004)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(o.bus || busE);
    s.start(t); s.stop(t + dur + 0.02);
  }
  const notas = (lista, t0, paso, o) => lista.forEach((m, i) => tono(hz(m), t0 + i * paso, o.dur || paso * 1.6, o));

  // ---------- efectos ----------
  const SFX = {
    clic: (t) => tono(1200, t, 0.03, { vol: 0.05 }),
    talar: (t) => { ruido(t, 0.09, { f: 900, vol: 0.35 }); tono(160, t, 0.12, { tipo: 'triangle', a: 70, vol: 0.4 }); },
    picar: (t) => { tono(1900, t, 0.06, { vol: 0.12 }); tono(2700, t + 0.01, 0.05, { vol: 0.08 }); ruido(t, 0.05, { filtro: 'highpass', f: 3000, vol: 0.15 }); },
    agua: (t) => { ruido(t, 0.3, { filtro: 'bandpass', f: 500, a: 2200, q: 3, vol: 0.35 }); tono(500, t + 0.05, 0.15, { tipo: 'sine', a: 900, vol: 0.12 }); },
    recolectar: (t) => tono(660, t, 0.1, { tipo: 'sine', a: 1050, vol: 0.25 }),
    moneda: (t) => { tono(988, t, 0.06, { vol: 0.1 }); tono(1319, t + 0.06, 0.14, { vol: 0.1 }); },
    acierto: (t) => notas([84, 88, 91], t, 0.07, { tipo: 'triangle', vol: 0.25 }),
    error: (t) => tono(220, t, 0.28, { tipo: 'sawtooth', a: 110, vol: 0.14, filtro: 1800 }),
    golpe: (t) => { ruido(t, 0.07, { f: 2000, vol: 0.3 }); tono(320, t, 0.1, { a: 80, vol: 0.25 }); },
    dano: (t) => { tono(170, t, 0.22, { tipo: 'sawtooth', a: 60, vol: 0.22, filtro: 1200 }); ruido(t, 0.15, { f: 500, vol: 0.25 }); },
    alerta: (t) => { tono(440, t, 0.07, { vol: 0.12 }); tono(660, t + 0.08, 0.1, { vol: 0.12 }); },
    victoria: (t) => notas([79, 84, 88, 91, 96], t, 0.08, { tipo: 'square', vol: 0.14, dur: 0.18 }),
    derrota: (t) => notas([72, 71, 70, 69], t, 0.22, { tipo: 'triangle', vol: 0.25, dur: 0.3 }),
    nivel: (t) => { notas([72, 76, 79, 84, 88, 91, 96], t, 0.06, { vol: 0.12, dur: 0.12 }); [84, 88, 91].forEach((m) => tono(hz(m), t + 0.45, 0.6, { tipo: 'triangle', vol: 0.15 })); },
    mision: (t) => notas([88, 91, 96], t, 0.09, { tipo: 'triangle', vol: 0.25, dur: 0.25 }),
    fabricar: (t) => { [0, 0.13, 0.26].forEach((d) => { ruido(t + d, 0.05, { f: 2500, vol: 0.3 }); tono(400, t + d, 0.06, { a: 200, vol: 0.2 }); }); tono(1568, t + 0.42, 0.4, { tipo: 'triangle', vol: 0.2 }); tono(2093, t + 0.5, 0.4, { tipo: 'triangle', vol: 0.15 }); },
    colocar: (t) => tono(400, t, 0.08, { tipo: 'triangle', a: 640, vol: 0.25 }),
    cofre: (t) => { tono(180, t, 0.18, { tipo: 'sawtooth', a: 300, vol: 0.12, filtro: 900 }); [0.2, 0.26, 0.32, 0.38].forEach((d, i) => tono(hz(91 + i * 2), t + d, 0.15, { tipo: 'sine', vol: 0.12 })); },
    portal: (t) => { ruido(t, 0.7, { filtro: 'bandpass', f: 300, a: 3500, q: 2, vol: 0.3 }); tono(200, t, 0.7, { tipo: 'sine', a: 900, vol: 0.15 }); },
    jefe: (t) => { tono(55, t, 1.4, { tipo: 'sawtooth', vol: 0.35, filtro: 300, ataque: 0.2 }); ruido(t, 1.4, { f: 220, vol: 0.4, ataque: 0.1 }); tono(140, t + 0.5, 0.8, { tipo: 'sawtooth', a: 70, vol: 0.2, vib: 9, filtro: 900 }); },
    rugido: (t) => { tono(130, t, 0.7, { tipo: 'sawtooth', a: 65, vol: 0.25, vib: 11, filtro: 1100 }); ruido(t, 0.6, { f: 700, vol: 0.25 }); },
    tick: (t) => tono(1000, t, 0.06, { tipo: 'sine', vol: 0.25 }),
    vamos: (t) => { tono(1500, t, 0.3, { vol: 0.15 }); tono(hz(84), t, 0.3, { tipo: 'triangle', vol: 0.2 }); },
    inicio: (t) => { [67, 72, 76].forEach((m) => tono(hz(m), t, 0.45, { tipo: 'square', vol: 0.09 })); [72, 76, 79].forEach((m) => tono(hz(m), t + 0.2, 0.6, { tipo: 'square', vol: 0.09 })); },
    brillo: (t) => { tono(2093, t, 0.08, { tipo: 'sine', vol: 0.15 }); tono(2637, t + 0.06, 0.12, { tipo: 'sine', vol: 0.15 }); },
    boom: (t) => { ruido(t, 0.5, { f: 500, a: 80, vol: 0.5 }); tono(90, t, 0.45, { tipo: 'sine', a: 30, vol: 0.45 }); },
    pica: (t) => { tono(1200, t, 0.05, { vol: 0.12 }); tono(1500, t + 0.07, 0.06, { vol: 0.12 }); },
    lanzar: (t) => ruido(t, 0.25, { filtro: 'bandpass', f: 2500, a: 600, q: 4, vol: 0.2 }),
    pesca: (t) => { ruido(t, 0.25, { filtro: 'bandpass', f: 700, a: 2400, q: 2, vol: 0.3 }); notas([84, 88, 91, 96], t + 0.15, 0.07, { tipo: 'triangle', vol: 0.2 }); },
    viento: (t) => { ruido(t, 3.5, { filtro: 'bandpass', f: 400, a: 1400, q: 1.5, vol: 0.25, ataque: 0.8 }); ruido(t + 1, 3, { filtro: 'bandpass', f: 1200, a: 500, q: 1.5, vol: 0.18, ataque: 0.8 }); },
    logro: (t) => { notas([72, 76, 79, 84], t, 0.1, { vol: 0.12, dur: 0.2 }); [79, 84, 88, 91].forEach((m) => tono(hz(m), t + 0.45, 0.9, { tipo: 'triangle', vol: 0.12 })); },
    paso: (t) => ruido(t, 0.04, { f: 500, vol: 0.06 }),
  };
  function sfx(nombre) {
    if (!cfg.on || !cfg.efectos || !SFX[nombre] || !asegurar() || ctx.state !== 'running') return;
    SFX[nombre](ctx.currentTime + 0.01);
  }

  // ---------- música ----------
  const MAYOR = [0, 2, 4, 5, 7, 9, 11], MENOR = [0, 2, 3, 5, 7, 8, 10], DORICA = [0, 2, 3, 5, 7, 9, 10];
  const ARABE = [0, 1, 4, 5, 7, 8, 10], ARMONICA = [0, 2, 3, 5, 7, 8, 11], LIDIA = [0, 2, 4, 6, 7, 9, 11];
  const PISTAS = {
    base: { bpm: 92, raiz: 60, escala: MAYOR, prog: [0, 5, 3, 4], lead: 'triangle', arp: 'square', bat: 'suave', semilla: 3 },
    pieza: { bpm: 72, raiz: 65, escala: MAYOR, prog: [0, 3, 4, 0], lead: 'sine', arp: 'triangle', bat: 'nada', semilla: 8, eco: true },
    bosque: { bpm: 104, raiz: 62, escala: MAYOR, prog: [0, 4, 5, 3], lead: 'square', arp: 'triangle', bat: 'ligera', semilla: 5 },
    profundo: { bpm: 82, raiz: 57, escala: DORICA, prog: [0, 6, 5, 6], lead: 'sine', arp: 'triangle', bat: 'tribal', semilla: 11, eco: true },
    desierto: { bpm: 98, raiz: 62, escala: ARABE, prog: [0, 1, 0, 6], lead: 'sawtooth', arp: 'triangle', bat: 'darbuka', semilla: 7 },
    valle: { bpm: 84, raiz: 57, escala: ARABE, prog: [0, 6, 1, 0], lead: 'triangle', arp: 'sine', bat: 'darbuka', semilla: 29, eco: true, campana: true },
    laberinto: { bpm: 116, raiz: 55, escala: ARMONICA, prog: [0, 1, 0, 4], lead: 'square', arp: 'triangle', bat: 'tribal', semilla: 31, eco: true },
    mina: { bpm: 78, raiz: 52, escala: MENOR, prog: [0, 5, 6, 4], lead: 'triangle', arp: 'square', bat: 'metal', semilla: 13, eco: true },
    glaciar: { bpm: 88, raiz: 64, escala: LIDIA, prog: [0, 1, 5, 4], lead: 'sine', arp: 'sine', bat: 'nieve', semilla: 17, eco: true, campana: true },
    jefe: { bpm: 144, raiz: 57, escala: ARMONICA, prog: [0, 0, 5, 4], lead: 'sawtooth', arp: 'square', bat: 'intensa', semilla: 19 },
    desafio: { bpm: 128, raiz: 60, escala: MAYOR, prog: [0, 4, 5, 3], lead: 'square', arp: 'square', bat: 'baile', semilla: 23 },
  };
  const RITMOS = [
    [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0], [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0], [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0],
    [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], [1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  ];
  function azar(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  const compuestas = {};
  // Compone 8 compases de 16 pasos: melodía (con variación en la segunda mitad), bajo y arpegio
  function componer(id) {
    if (compuestas[id]) return compuestas[id];
    const P = PISTAS[id], rnd = azar(P.semilla * 7919);
    const nota = (grado, oct = 0) => { const n = P.escala.length, g = ((grado % n) + n) % n; return P.raiz + P.escala[g] + 12 * (oct + Math.floor(grado / n)); };
    const mel = [];
    let g = 2;
    const ritmos = [RITMOS[Math.floor(rnd() * RITMOS.length)], RITMOS[Math.floor(rnd() * RITMOS.length)]];
    for (let c = 0; c < 8; c++) {
      const acorde = P.prog[c % 4], r = ritmos[Math.floor(c / 2) % 2];
      const compas = [];
      for (let p = 0; p < 16; p++) {
        if (!r[p]) { compas.push(null); continue; }
        if (p === 0) g = acorde + [0, 2, 4][Math.floor(rnd() * 3)];
        else g += [-2, -1, -1, 1, 1, 2, 0][Math.floor(rnd() * 7)];
        g = Math.max(acorde - 2, Math.min(acorde + 7, g));
        compas.push(nota(g, 1));
      }
      if (c >= 4 && c < 7) mel.push(mel[c - 4].map((n, i) => (i < 8 ? n : compas[i])));   // la segunda mitad repite el inicio y cambia el final
      else mel.push(compas);
    }
    compuestas[id] = { P, mel, nota };
    return compuestas[id];
  }
  let pista = null, paso = 0, prox = 0, timer = 0;
  function programar() {
    if (!ctx || !pista || !cfg.on || !cfg.musica || ctx.state !== 'running') return;
    const { P, mel, nota } = componer(pista), dur = 60 / P.bpm / 4;
    if (prox < ctx.currentTime) prox = ctx.currentTime + 0.05;
    while (prox < ctx.currentTime + 0.15) {
      const c = Math.floor(paso / 16) % 8, p = paso % 16, t = prox, acorde = P.prog[c % 4];
      const m = mel[c][p];
      if (m) tono(hz(P.campana ? m + 12 : m), t, dur * (P.campana ? 4 : 1.8), { tipo: P.lead, vol: P.lead === 'sawtooth' ? 0.12 : P.lead === 'square' ? 0.12 : 0.26, bus: busM, eco: P.eco, filtro: P.lead === 'sawtooth' ? 2200 : 0 });
      if (p % 8 === 0) tono(hz(nota(acorde, -1)), t, dur * 7, { tipo: 'triangle', vol: 0.34, bus: busM });
      if (P.bpm > 100 && p % 8 === 4) tono(hz(nota(acorde + 4, -1)), t, dur * 3, { tipo: 'triangle', vol: 0.24, bus: busM });
      if (p % 2 === 0) tono(hz(nota(acorde + [0, 2, 4, 2][(p / 2) % 4])), t, dur * 1.5, { tipo: P.arp, vol: P.arp === 'square' ? 0.04 : 0.08, bus: busM, eco: P.eco });
      bateria(P.bat, p, t, dur);
      paso = (paso + 1) % 128; prox += dur;
    }
  }
  function bateria(estilo, p, t, d) {
    const B = { bus: busM };
    const bombo = (v = 0.5) => tono(150, t, 0.12, { tipo: 'sine', a: 40, vol: v, bus: busM });
    const caja = (v = 0.2) => { ruido(t, 0.1, { filtro: 'bandpass', f: 1800, vol: v, ...B }); };
    const plato = (v = 0.06) => ruido(t, 0.04, { filtro: 'highpass', f: 6000, vol: v, ...B });
    switch (estilo) {
      case 'suave': if (p === 0 || p === 8) bombo(0.3); if (p % 4 === 2) plato(0.03); break;
      case 'ligera': if (p === 0 || p === 8 || p === 10) bombo(0.35); if (p === 4 || p === 12) caja(0.12); if (p % 2 === 1) plato(0.025); break;
      case 'tribal': if (p === 0 || p === 6 || p === 10) tono(110, t, 0.2, { tipo: 'sine', a: 55, vol: 0.35, bus: busM }); if (p === 12) tono(180, t, 0.12, { tipo: 'sine', a: 90, vol: 0.2, bus: busM }); break;
      case 'darbuka': if (p === 0 || p === 7) tono(130, t, 0.15, { tipo: 'sine', a: 60, vol: 0.35, bus: busM }); if ([3, 4, 10, 12, 14].includes(p)) ruido(t, 0.05, { filtro: 'bandpass', f: 3200, q: 3, vol: 0.12, ...B }); break;
      case 'metal': if (p === 0 || p === 8) bombo(0.3); if (p === 4 || p === 12) tono(1800, t, 0.12, { vol: 0.03, bus: busM }); break;
      case 'nieve': if (p === 0) bombo(0.2); if (p % 4 === 2) ruido(t, 0.08, { filtro: 'highpass', f: 8000, vol: 0.03, ...B }); break;
      case 'intensa': if (p % 4 === 0 || p === 14) bombo(0.45); if (p === 4 || p === 12) caja(0.2); if (p % 2 === 1) plato(0.05); break;
      case 'baile': if (p % 4 === 0) bombo(0.45); if (p === 4 || p === 12) caja(0.16); if (p % 4 === 2) plato(0.06); break;
      default: break;
    }
  }
  function musica(id) {
    if (id === pista) return;
    pista = PISTAS[id] ? id : null;
    paso = 0; prox = 0;
    if (ctx && busM) { busM.gain.setValueAtTime(0, ctx.currentTime); busM.gain.setTargetAtTime(cfg.musica ? 0.9 : 0, ctx.currentTime + 0.1, 0.3); }
  }
  timer = setInterval(programar, 30);

  function config(c) { Object.assign(cfg, c); guardar(); if (cfg.on) desbloquear(); aplicar(); }
  global.Sonido = { sfx, musica, config, _nodo: () => (asegurar() ? { ctx, master } : null), get cfg() { return { ...cfg }; }, get pista() { return pista; } };
})(window);
