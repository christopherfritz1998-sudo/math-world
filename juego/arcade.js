// Math World · Minijuegos de entretención (sin cálculos): habilidad, reflejos y memoria en cada mundo.
// Módulo aparte de juego.js: usa solo el puente window.MWJ. Cada juego dibuja en un lienzo de 400×300 (lógico)
// y se controla con toques/clic o con el teclado (flechas, espacio). Algunos llenan álbumes de colección.
(function () {
  'use strict';
  const J = () => window.MWJ;
  // azar del juego: en una competencia todos usan la misma semilla, así la partida empieza igual para todos
  let rnd = Math.random;
  const semilla = (s) => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const R =(a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (l) => l[Math.floor(rnd() * l.length)];
  const esc = (s) => J().esc(s);
  const $ = (id) => document.getElementById(id);
  const W = 400, H = 300;
  const FUENTE = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  const PREMIO_COMPLETO = 3, PREMIO_MENOR = 5, XP_DIA = 300, MIN_MS = 8000;

  // ===================================================================
  // Álbumes de colección
  // ===================================================================
  const RAREZAS = { 'Común': 50, 'Poco común': 28, 'Rara': 14, 'Épica': 6, 'Legendaria': 2 };
  const CLASE = { 'Común': 'comun', 'Poco común': 'poco', 'Rara': 'rara', 'Épica': 'epica', 'Legendaria': 'legendaria' };
  const it = (id, nombre, e, rareza, color) => ({ id, nombre, e, rareza, color });
  const ALBUMES = {
    luciernagas: { nombre: 'Álbum de luciérnagas', ico: '✨', juego: 'ar_luciernagas', premio: 'Farol de luciérnagas', items: [
      it('chispa', 'Luciérnaga chispa', '✨', 'Común', '#ffe66b'), it('ambar', 'Luciérnaga ámbar', '✨', 'Común', '#ffb347'),
      it('esmeralda', 'Luciérnaga esmeralda', '✨', 'Poco común', '#7dff9b'), it('celeste', 'Luciérnaga celeste', '✨', 'Poco común', '#7fd6ff'),
      it('rosada', 'Luciérnaga rosada', '✨', 'Rara', '#ff8fd0'), it('violeta', 'Luciérnaga violeta', '✨', 'Rara', '#c49bff'),
      it('plateada', 'Luciérnaga plateada', '✨', 'Épica', '#eef3f8'), it('real', 'Luciérnaga dorada real', '✨', 'Legendaria', '#ffd700')] },
    amuletos: { nombre: 'Álbum de amuletos del desierto', ico: '🪲', juego: 'ar_jeroglificos', premio: 'Cofre del faraón', items: [
      it('escarabajo', 'Escarabajo sagrado', '🪲', 'Común'), it('pluma', 'Pluma de la verdad', '🪶', 'Común'),
      it('cobra', 'Cobra protectora', '🐍', 'Poco común'), it('halcon', 'Halcón del cielo', '🦅', 'Poco común'),
      it('sol', 'Disco solar', '🌞', 'Rara'), it('cocodrilo', 'Cocodrilo del río', '🐊', 'Rara'),
      it('ojo', 'Ojo que todo lo ve', '👁️', 'Épica'), it('llave', 'Llave de la vida', '🗝️', 'Legendaria')] },
    fosiles: { nombre: 'Álbum de fósiles de la mina', ico: '🦴', juego: 'ar_linterna', premio: 'Vitrina de fósiles', items: [
      it('concha', 'Concha antigua', '🐚', 'Común'), it('hueso', 'Hueso petrificado', '🦴', 'Común'),
      it('huella', 'Huella de piedra', '🐾', 'Poco común'), it('diente', 'Diente prehistórico', '🦷', 'Poco común'),
      it('amonite', 'Amonite en espiral', '🌀', 'Rara'), it('escorpion', 'Escorpión en ámbar', '🦂', 'Rara'),
      it('huevo', 'Huevo fosilizado', '🥚', 'Épica'), it('dino', 'Esqueleto de dinosaurio', '🦕', 'Legendaria')] },
    peces_hielo: { nombre: 'Álbum de peces bajo el hielo', ico: '🐟', juego: 'ar_pesca_hielo', premio: 'Pecera de hielo', items: [
      it('plateado', 'Pez plateado', '🐟', 'Común'), it('camaron', 'Camarón polar', '🦐', 'Común'),
      it('payaso', 'Pez payaso polar', '🐠', 'Poco común'), it('cangrejo', 'Cangrejo de hielo', '🦀', 'Poco común'),
      it('globo', 'Pez globo glaciar', '🐡', 'Rara'), it('calamar', 'Calamar de aurora', '🦑', 'Rara'),
      it('pulpo', 'Pulpo de las profundidades', '🐙', 'Épica'), it('ballena', 'Ballena azul', '🐋', 'Legendaria')] },
    cosechas: { nombre: 'Álbum de cosechas del huerto', ico: '🌱', juego: 'ar_huerto', premio: 'Espantapájaros dorado', items: [
      it('zanahoria', 'Zanahoria', '🥕', 'Común'), it('papa', 'Papa', '🥔', 'Común'),
      it('tomate', 'Tomate', '🍅', 'Poco común'), it('choclo', 'Choclo', '🌽', 'Poco común'),
      it('frutilla', 'Frutilla', '🍓', 'Rara'), it('berenjena', 'Berenjena', '🍆', 'Rara'),
      it('zapallo', 'Zapallo gigante', '🎃', 'Épica'), it('girasol', 'Girasol dorado', '🌻', 'Legendaria')] },
  };
  function sortear(items, bonus = 0) {
    // bonus (0..1) hace más probables las rarezas altas
    const pesos = items.map((x) => RAREZAS[x.rareza] * (x.rareza === 'Común' ? 1 - bonus * 0.5 : 1 + bonus));
    let t = rnd() * pesos.reduce((a, b) => a + b, 0);
    for (let i = 0; i < items.length; i++) { t -= pesos[i]; if (t <= 0) return items[i]; }
    return items[items.length - 1];
  }
  const albumDe = (id) => { const S = J().S(); S.arAlb = S.arAlb || {}; return (S.arAlb[id] = S.arAlb[id] || {}); };
  const albumTengo = (id) => { const S = J() && J().S(); return S && S.arAlb && S.arAlb[id] ? ALBUMES[id].items.filter((x) => S.arAlb[id][x.id]).length : 0; };
  // agrega un objeto al álbum; devuelve { item, nuevo, completo }
  function registrar(albumId, item) {
    const A = albumDe(albumId), nuevo = !A[item.id], S = J().S();
    A[item.id] = (A[item.id] || 0) + 1;
    let completo = false;
    S.arAlbPremio = S.arAlbPremio || {};
    if (!S.arAlbPremio[albumId] && ALBUMES[albumId].items.every((x) => A[x.id])) {
      S.arAlbPremio[albumId] = true; completo = true;
      const txt = J().darPremio(J().paquete(8, 4, true), 150);
      setTimeout(() => { J().sfx('logro'); J().celebrar(); J().toast(`📖 ¡Completaste el ${ALBUMES[albumId].nombre}! Premio: ${txt} y 150 de experiencia.`); }, 400);
    }
    return { item, nuevo, completo };
  }
  function abrirAlbum(albumId, volver) {
    const A = ALBUMES[albumId]; if (!A) return;
    const S = J().S(), mio = (S.arAlb || {})[albumId] || {}, tengo = albumTengo(albumId);
    J().ui.abrir(`<div class="modal-cab"><div><span class="etq">Colección · ${tengo} de ${A.items.length}</span><h2 id="modal-titulo">${A.ico} ${esc(A.nombre)}</h2></div><button type="button" class="btn" id="aa-cerrar">Cerrar</button></div>
      <p class="nota">Se consiguen jugando <b>${esc(DEF[A.juego].nombre)}</b> (${esc(J().nombreZona(DEF[A.juego].zona))}). Mientras mejor juegas, más probables son los raros. Premio al completarlo: cofre de recursos y 150 de experiencia.${(S.arAlbPremio || {})[albumId] ? ' <b>¡Ya lo completaste!</b>' : ''}</p>
      <div class="album ar-album">${A.items.map((x) => `<div class="pez-card ${mio[x.id] ? '' : 'falta'}"><span class="ar-ico" style="${x.color ? `--c:${x.color}` : ''}">${mio[x.id] ? x.e : '❔'}</span><strong>${mio[x.id] ? esc(x.nombre) : '???'}</strong><small class="rareza ${CLASE[x.rareza]}">${esc(x.rareza)}</small>${mio[x.id] ? `<small>×${mio[x.id]}</small>` : ''}</div>`).join('')}</div>
      ${volver ? '<div class="acciones"><span></span><button type="button" class="btn sec" id="aa-volver">Volver al minijuego</button></div>' : ''}`, 'ar-album-modal');
    $('aa-cerrar').addEventListener('click', () => J().ui.cerrar());
    const v = $('aa-volver'); if (v) v.addEventListener('click', () => abrir(volver));
  }
  const botonesAlbum = () => `<div class="albumes-avance">${Object.entries(ALBUMES).map(([id, a]) => `<button type="button" class="btn sec" data-ar-album="${id}">${a.ico} ${esc(a.nombre.replace('Álbum de ', '').replace(/^./, (c) => c.toUpperCase()))} (${albumTengo(id)}/${a.items.length})</button>`).join(' ')}</div>`;
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-ar-album]'); if (!b || !J()) return;
    J().ui.cerrar(); abrirAlbum(b.dataset.arAlbum);
  });

  // ===================================================================
  // Utilidades de dibujo
  // ===================================================================
  function emoji(ctx, e, x, y, t = 24) { ctx.font = `${t}px ${FUENTE}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, x, y); }
  function texto(ctx, s, x, y, t = 14, c = '#fff', al = 'center') { ctx.font = `700 ${t}px Fredoka, Nunito, sans-serif`; ctx.textAlign = al; ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(s, x, y); ctx.fillStyle = c; ctx.fillText(s, x, y); }
  function fondo(ctx, a, b) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  function caja(ctx, x, y, w, h, c, r = 10) { ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.fill(); }
  // diana dibujada (anillos rellenos con contorno), sobre un poste de madera
  function diana(ctx, x, y, r) {
    ctx.fillStyle = '#6b4220'; ctx.fillRect(x - 3, y + r - 4, 6, 26 - r * 0.4);
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#2a1408';
    [[1, '#ffffff'], [0.78, '#e8322f'], [0.56, '#ffffff'], [0.34, '#e8322f'], [0.14, '#ffd23a']].forEach(([k, c]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r * k, 0, 7); ctx.fill(); ctx.stroke(); });
  }
  const dentro = (px, py, x, y, r) => (px - x) ** 2 + (py - y) ** 2 <= r * r;
  const corazones = (n, max = 3) => '❤️'.repeat(Math.max(0, n)) + '🖤'.repeat(Math.max(0, max - n));
  // dirección a la que apunta el jugador: flechas o tocar/mantener a un lado del lienzo
  function dirX(G, objX) {
    const k = G.keys;
    if (k.ArrowLeft || k.a) return -1;
    if (k.ArrowRight || k.d) return 1;
    if (G.ptr) return Math.abs(G.ptr.x - objX) < 8 ? 0 : G.ptr.x < objX ? -1 : 1;
    return 0;
  }

  // ===================================================================
  // Los juegos
  // ===================================================================
  const DEF = {
    // ---------------- Bosque ----------------
    ar_luciernagas: { zona: 'u1', ico: '✨', nombre: 'Caza de luciérnagas', album: 'luciernagas', dura: 30,
      desc: 'Toca las luciérnagas antes de que se apaguen. Las doradas valen 3 puntos; las rojas te quitan 2.',
      iniciar(G) { G.st = { bichos: [], spawn: 0 }; },
      paso(G, dt) {
        const st = G.st; st.spawn -= dt;
        if (st.spawn <= 0) {
          st.spawn = Math.max(0.28, 0.6 - G.t * 0.01);
          const tipo = rnd() < 0.12 ? 'd' : rnd() < 0.18 ? 'r' : 'n';
          st.bichos.push({ x: R(30, W - 30), y: R(50, H - 30), vx: R(-40, 40), vy: R(-30, 30), vida: tipo === 'd' ? 1.6 : 2.6, tipo });
        }
        st.bichos.forEach((b) => { b.x += b.vx * dt; b.y += b.vy * dt; b.vida -= dt; if (b.x < 20 || b.x > W - 20) b.vx *= -1; if (b.y < 40 || b.y > H - 20) b.vy *= -1; });
        st.bichos = st.bichos.filter((b) => b.vida > 0);
        if (G.t >= this.dura) G.fin = true;
      },
      toque(G, x, y) {
        const b = G.st.bichos.find((q) => dentro(x, y, q.x, q.y, 22)); if (!b) return;
        b.vida = 0; G.st.bichos = G.st.bichos.filter((q) => q !== b);
        if (b.tipo === 'r') { G.puntos = Math.max(0, G.puntos - 2); J().sfx('error'); } else { G.puntos += b.tipo === 'd' ? 3 : 1; J().sfx('acierto'); }
      },
      dibujar(ctx, G) {
        fondo(ctx, '#0b1430', '#13301f');
        for (let i = 0; i < 9; i++) emoji(ctx, '🌲', 20 + i * 46, H - 18 + (i % 2) * 6, 34);
        G.st.bichos.forEach((b) => {
          const c = b.tipo === 'd' ? '#ffd700' : b.tipo === 'r' ? '#ff4b4b' : '#fff27a', a = Math.min(1, b.vida * 1.5);
          ctx.globalAlpha = a * 0.35; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(b.x, b.y, b.tipo === 'd' ? 20 : 15, 0, 7); ctx.fill();
          ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(b.x, b.y, b.tipo === 'd' ? 7 : 5, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
        });
      } },
    ar_tala: { zona: 'u1', ico: '🪓', nombre: 'Tala a ritmo', vidas: 3,
      desc: 'La marca va y viene sobre la barra: toca (o espacio) cuando esté en la zona verde. 12 hachazos derriban el árbol; justo al centro vale doble.',
      iniciar(G) { G.st = { pos: 0, dir: 1, vel: 0.9, zona: this.nueva(0.26), golpes: 0, flash: 0, combo: 0 }; },
      nueva(ancho) { const c = 0.15 + rnd() * (0.7 - ancho); return [c, c + ancho]; },
      paso(G, dt) {
        const st = G.st; st.pos += st.dir * st.vel * dt; if (st.pos > 1) { st.pos = 1; st.dir = -1; } if (st.pos < 0) { st.pos = 0; st.dir = 1; }
        st.flash = Math.max(0, st.flash - dt);
      },
      toque(G) {
        const st = G.st, [a, b] = st.zona;
        if (st.pos >= a && st.pos <= b) {
          const centro = Math.abs(st.pos - (a + b) / 2) < (b - a) * 0.18;
          st.combo += 1; G.puntos += centro ? 2 : 1; st.golpes += 1; st.flash = 0.25; J().sfx('golpe');
          st.vel = Math.min(2.4, st.vel + 0.12); st.zona = this.nueva(Math.max(0.1, 0.26 - st.golpes * 0.012));
          if (st.golpes >= 12) { G.puntos += 5; G.fin = true; }
        } else { st.combo = 0; G.vidas -= 1; J().sfx('error'); if (G.vidas <= 0) G.fin = true; }
      },
      dibujar(ctx, G) {
        const st = G.st; fondo(ctx, '#bfe6ff', '#4f8a3b');
        const caido = st.golpes / 12;
        ctx.save(); ctx.translate(200, 215); ctx.rotate(G.fin && st.golpes >= 12 ? -1.2 : -caido * 0.15);
        caja(ctx, -18, -150, 36, 150, '#7a4a25', 4); emoji(ctx, '🌳', 0, -165, 90); ctx.restore();
        caja(ctx, 182, 175, 40 * Math.min(1, caido) + 2, 10, '#3b2412', 3);
        emoji(ctx, '🪓', 150 + (st.flash ? 18 : 0), 190, 38);
        caja(ctx, 40, 252, 320, 22, '#2b2b2b', 11); caja(ctx, 40 + st.zona[0] * 320, 252, (st.zona[1] - st.zona[0]) * 320, 22, '#43c463', 11);
        caja(ctx, 40 + st.pos * 320 - 3, 246, 6, 34, '#ffd27a', 3);
        texto(ctx, `Hachazos ${st.golpes}/12`, 200, 238, 13);
      } },
    ar_duende: { zona: 'u1', ico: '🌿', nombre: 'Escondite del duende', vidas: 2,
      desc: 'Mira en qué arbusto se esconde el duende. Los arbustos se mezclan: sigue el correcto con la vista y tócalo.',
      iniciar(G) { G.st = { ronda: 0 }; this.ronda(G); },
      ronda(G) {
        const st = G.st, n = st.ronda >= 6 ? 5 : st.ronda >= 3 ? 4 : 3;
        st.n = n; st.pos = Array.from({ length: n }, (_, i) => i); st.duende = R(0, n - 1); st.fase = 'mostrar'; st.t = 1.2;
        st.swaps = []; for (let k = 0; k < 4 + st.ronda * 2; k++) { const a = R(0, n - 1); let b = R(0, n - 2); if (b >= a) b += 1; st.swaps.push([a, b]); }
        st.dur = Math.max(0.16, 0.45 - st.ronda * 0.035); st.prog = 0; st.res = null;
      },
      xDe(st, slot) { return 200 + (slot - (st.n - 1) / 2) * 76; },
      paso(G, dt) {
        const st = G.st; st.t -= dt;
        if (st.fase === 'mostrar' && st.t <= 0) st.fase = 'mezclar';
        else if (st.fase === 'mezclar') {
          st.prog += dt / st.dur;
          if (st.prog >= 1) { const [a, b] = st.swaps.shift(); const ia = st.pos.indexOf(a), ib = st.pos.indexOf(b); st.pos[ia] = b; st.pos[ib] = a; st.prog = 0; if (!st.swaps.length) st.fase = 'elegir'; }
        } else if (st.fase === 'resultado' && st.t <= 0) { if (G.vidas <= 0) G.fin = true; else { st.ronda += st.res ? 1 : 0; this.ronda(G); } }
      },
      toque(G, x, y) {
        const st = G.st; if (st.fase !== 'elegir' || y < 130) return;
        let mejor = -1, d = 1e9; st.pos.forEach((slot, i) => { const dd = Math.abs(x - this.xDe(st, slot)); if (dd < d) { d = dd; mejor = i; } });
        if (d > 40) return;
        st.res = mejor === st.duende; st.fase = 'resultado'; st.t = 1;
        if (st.res) { G.puntos += 1 + Math.floor(st.ronda / 3); J().sfx('acierto'); } else { G.vidas -= 1; J().sfx('error'); }
      },
      dibujar(ctx, G) {
        const st = G.st; fondo(ctx, '#2f6b3a', '#204a28');
        st.pos.forEach((slot, i) => {
          let x = this.xDe(st, slot), y = 200;
          if (st.fase === 'mezclar' && st.swaps.length) {
            const [a, b] = st.swaps[0];
            if (slot === a || slot === b) { const otro = slot === a ? b : a, x2 = this.xDe(st, otro), p = st.prog; x = x + (x2 - x) * p; y = 200 + Math.sin(p * Math.PI) * (slot === a ? -28 : 28); }
          }
          const ver = (st.fase === 'mostrar' || st.fase === 'resultado') && i === st.duende;
          if (ver) emoji(ctx, '🧝', x, y - 34, 34);
          emoji(ctx, '🌳', x, y, 58);
        });
        texto(ctx, st.fase === 'mostrar' ? '¡Mira dónde se esconde!' : st.fase === 'mezclar' ? 'Síguelo con la vista…' : st.fase === 'elegir' ? '¿Dónde está el duende?' : st.res ? '¡Lo encontraste!' : 'Estaba en el otro arbusto', 200, 70, 18);
        texto(ctx, `Ronda ${st.ronda + 1}`, 200, 100, 13, '#ffd27a');
      } },

    // ---------------- Desierto ----------------
    ar_tormenta: { zona: 'u2', ico: '🌪️', nombre: 'Huida de la tormenta',
      desc: 'Corre delante de la tormenta de arena. Toca (o espacio/flecha arriba) para saltar los cactus y las rocas. Recoge monedas.',
      iniciar(G) { G.st = { y: 0, vy: 0, obs: [], mon: [], vel: 170, dist: 0, prox: 1, proxM: 2 }; },
      paso(G, dt) {
        const st = G.st, piso = 240;
        st.vel = Math.min(380, 170 + G.t * 6); st.dist += st.vel * dt; G.puntos = Math.floor(st.dist / 150) + (st.monedas || 0);
        st.vy += 900 * dt; st.y = Math.min(0, st.y + st.vy * dt); if (st.y === 0) st.vy = 0;
        st.prox -= dt; if (st.prox <= 0) { st.obs.push({ x: W + 20, e: pick(['🌵', '🪨', '🌵']) }); st.prox = Math.max(0.65, 1.5 - G.t * 0.02) + rnd() * 0.7; }
        st.proxM -= dt; if (st.proxM <= 0) { st.mon.push({ x: W + 20, y: piso - R(40, 110) }); st.proxM = 1 + rnd() * 1.5; }
        st.obs.forEach((o) => { o.x -= st.vel * dt; }); st.mon.forEach((m) => { m.x -= st.vel * dt; });
        st.obs = st.obs.filter((o) => o.x > -30); st.mon = st.mon.filter((m) => m.x > -30 && !m.ok);
        const px = 80, py = piso + st.y;
        if (st.obs.some((o) => Math.abs(o.x - px) < 20 && py > piso - 26)) G.fin = true;
        st.mon.forEach((m) => { if (Math.abs(m.x - px) < 20 && Math.abs(m.y - (py - 16)) < 26) { m.ok = true; st.monedas = (st.monedas || 0) + 2; J().sfx('moneda'); } });
      },
      saltar(G) { if (G.st.y === 0) { G.st.vy = -430; J().sfx('lanzar'); } },
      toque(G) { this.saltar(G); }, tecla(G, k) { if (k === ' ' || k === 'ArrowUp' || k === 'w') this.saltar(G); },
      dibujar(ctx, G) {
        const st = G.st; fondo(ctx, '#ffd59a', '#e2a55c');
        ctx.fillStyle = '#c98b45'; ctx.fillRect(0, 252, W, 48);
        for (let i = 0; i < 6; i++) emoji(ctx, '🏜️', ((i * 90 - st.dist * 0.2) % 540 + 540) % 540 - 40, 200, 30);
        ctx.globalAlpha = 0.85; emoji(ctx, '🌪️', 16 + Math.sin(G.t * 5) * 4, 200, 70); ctx.globalAlpha = 1;
        st.obs.forEach((o) => emoji(ctx, o.e, o.x, 236, 30)); st.mon.forEach((m) => emoji(ctx, '🪙', m.x, m.y, 20));
        emoji(ctx, '🏃', 80, 228 + st.y, 32);
      } },
    ar_jeroglificos: { zona: 'u2', ico: '📜', nombre: 'Memoria de jeroglíficos', album: 'amuletos',
      desc: 'La esfinge ilumina los símbolos en un orden. Repítelo tocándolos igual. Cada ronda la secuencia crece.',
      SIM: ['🪲', '👁️', '🐍', '🦅'],
      iniciar(G) { G.st = { sec: [R(0, 3)], fase: 'mostrar', i: 0, t: 0.8, luz: -1, ent: 0 }; },
      celda(i) { return { x: 110 + (i % 2) * 180, y: 105 + Math.floor(i / 2) * 120 }; },
      paso(G, dt) {
        const st = G.st; st.t -= dt;
        if (st.fase === 'mostrar' && st.t <= 0) {
          const vel = Math.max(0.28, 0.62 - st.sec.length * 0.03);
          if (st.luz >= 0) { st.luz = -1; st.t = vel * 0.4; st.i += 1; if (st.i >= st.sec.length) { st.fase = 'jugar'; st.ent = 0; } }
          else { st.luz = st.sec[st.i]; st.t = vel; J().sfx('clic'); }
        } else if (st.fase === 'jugar' && st.luz >= 0 && st.t <= 0) st.luz = -1;
        else if (st.fase === 'bien' && st.t <= 0) { st.sec.push(R(0, 3)); st.fase = 'mostrar'; st.i = 0; st.luz = -1; st.t = 0.5; }
      },
      toque(G, x, y) {
        const st = G.st; if (st.fase !== 'jugar') return;
        const k = [0, 1, 2, 3].find((i) => { const c = this.celda(i); return Math.abs(x - c.x) < 80 && Math.abs(y - c.y) < 52; }); if (k === undefined) return;
        st.luz = k; st.t = 0.18;
        if (k !== st.sec[st.ent]) { J().sfx('error'); G.fin = true; return; }
        st.ent += 1; J().sfx('acierto');
        if (st.ent >= st.sec.length) { G.puntos = st.sec.length; st.fase = 'bien'; st.t = 0.7; }
      },
      dibujar(ctx, G) {
        const st = G.st; fondo(ctx, '#3b2a14', '#6b4a22');
        [0, 1, 2, 3].forEach((i) => { const c = this.celda(i), on = st.luz === i; caja(ctx, c.x - 78, c.y - 50, 156, 100, on ? '#ffd27a' : '#8a6a3a', 14); emoji(ctx, this.SIM[i], c.x, c.y, on ? 50 : 40); });
        texto(ctx, st.fase === 'mostrar' ? 'Observa…' : st.fase === 'jugar' ? `Tu turno: ${st.ent} de ${st.sec.length}` : '¡Bien!', 200, 26, 16);
      } },
    ar_duna: { zona: 'u2', ico: '🏝️', nombre: 'Tesoro en la duna',
      desc: 'Hay un cofre enterrado. Toca la arena para cavar: el color te dice si estás cerca (🔥 caliente) o lejos (🧊 helado). Tienes 6 paladas por cofre.',
      iniciar(G) { G.st = { cofres: 0 }; this.nueva(G); },
      nueva(G) { const st = G.st; st.cx = R(0, 7); st.cy = R(0, 5); st.pal = 6; st.cav = []; st.fase = 'cavar'; st.t = 0; },
      paso(G, dt) { const st = G.st; if (st.fase !== 'cavar') { st.t -= dt; if (st.t <= 0) { if (st.fase === 'hallado') this.nueva(G); else G.fin = true; } } },
      toque(G, x, y) {
        const st = G.st; if (st.fase !== 'cavar') return;
        const gx = Math.floor((x - 40) / 40), gy = Math.floor((y - 50) / 40); if (gx < 0 || gx > 7 || gy < 0 || gy > 5 || st.cav.some((c) => c.x === gx && c.y === gy)) return;
        const d = Math.max(Math.abs(gx - st.cx), Math.abs(gy - st.cy));
        st.cav.push({ x: gx, y: gy, d }); st.pal -= 1; J().sfx('pica');
        if (d === 0) { st.cofres += 1; G.puntos += 2 + st.pal; st.fase = 'hallado'; st.t = 1.1; J().sfx('logro'); }
        else if (st.pal <= 0) { st.fase = 'perdido'; st.t = 1.6; }
      },
      dibujar(ctx, G) {
        const st = G.st; fondo(ctx, '#f6d28b', '#e8b866');
        const col = (d) => (d <= 1 ? '#ff4d2e' : d === 2 ? '#ff9a3c' : d <= 4 ? '#7fc6ff' : '#2f6fd6'), ico = (d) => (d <= 1 ? '🔥' : d === 2 ? '♨️' : d <= 4 ? '❄️' : '🧊');
        for (let gx = 0; gx < 8; gx++) for (let gy = 0; gy < 6; gy++) {
          const c = st.cav.find((q) => q.x === gx && q.y === gy);
          caja(ctx, 42 + gx * 40, 52 + gy * 40, 36, 36, c ? col(c.d) : '#e9c27a', 8);
          if (c) emoji(ctx, c.d === 0 ? '💰' : ico(c.d), 60 + gx * 40, 70 + gy * 40, 20);
        }
        if (st.fase === 'perdido') emoji(ctx, '💰', 60 + st.cx * 40, 70 + st.cy * 40, 22);
        texto(ctx, `Paladas: ${'⛏️'.repeat(st.pal)} · Cofres: ${st.cofres}`, 200, 26, 14);
      } },

    // ---------------- Mina ----------------
    ar_vagoneta: { zona: 'u3', ico: '🛤️', nombre: 'Vagoneta desbocada',
      desc: 'La vagoneta va sin frenos por tres rieles. Cambia de riel (toca a la izquierda o derecha, o usa las flechas) para esquivar las rocas y juntar gemas.',
      iniciar(G) { G.st = { riel: 1, obs: [], vel: 160, dist: 0, prox: 0.8, gemas: 0 }; },
      xR(r) { return 120 + r * 80; },
      paso(G, dt) {
        const st = G.st; st.vel = Math.min(420, 160 + G.t * 7); st.dist += st.vel * dt;
        st.prox -= dt;
        if (st.prox <= 0) {
          const libre = R(0, 2);
          [0, 1, 2].forEach((r) => { if (r !== libre && rnd() < 0.55) st.obs.push({ r, y: -20, e: pick(['🪨', '🪨', '💥']) }); });
          if (rnd() < 0.5) st.obs.push({ r: libre, y: -60, e: '💎', gema: true });
          st.prox = Math.max(0.5, 1.15 - G.t * 0.012);
        }
        st.obs.forEach((o) => { o.y += st.vel * dt; });
        st.obs.forEach((o) => { if (!o.ok && o.r === st.riel && Math.abs(o.y - 240) < 22) { if (o.gema) { o.ok = true; st.gemas += 1; J().sfx('moneda'); } else G.fin = true; } });
        st.obs = st.obs.filter((o) => o.y < H + 30 && !o.ok);
        G.puntos = Math.floor(st.dist / 150) + st.gemas * 2;
      },
      mover(G, d) { G.st.riel = Math.max(0, Math.min(2, G.st.riel + d)); },
      toque(G, x) { this.mover(G, x < this.xR(G.st.riel) ? -1 : 1); },
      tecla(G, k) { if (k === 'ArrowLeft' || k === 'a') this.mover(G, -1); if (k === 'ArrowRight' || k === 'd') this.mover(G, 1); },
      dibujar(ctx, G) {
        const st = G.st; fondo(ctx, '#2a2420', '#14100d');
        [0, 1, 2].forEach((r) => { const x = this.xR(r); ctx.fillStyle = '#6b5a4a'; ctx.fillRect(x - 22, 0, 4, H); ctx.fillRect(x + 18, 0, 4, H); for (let y = (st.dist % 30) - 30; y < H; y += 30) ctx.fillRect(x - 26, y, 52, 5); });
        st.obs.forEach((o) => emoji(ctx, o.e, this.xR(o.r), o.y, 30));
        emoji(ctx, '🛒', this.xR(st.riel), 240, 40);
      } },
    ar_linterna: { zona: 'u3', ico: '🔦', nombre: 'Linterna en la oscuridad', album: 'fosiles', dura: 40,
      desc: 'Solo ves lo que alumbra tu linterna. Muévela (arrastra el dedo, mueve el mouse o usa las flechas) y toca los 6 fósiles escondidos antes de que se acabe la batería.',
      iniciar(G) {
        const fos = []; while (fos.length < 6) { const p = { x: R(30, W - 30), y: R(50, H - 25) }; if (fos.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > 60)) fos.push(p); }
        G.st = { lx: 200, ly: 170, fos: fos.map((p) => ({ ...p, e: pick(['🦴', '🐚', '🦷', '🐾']) })), halla: 0, rocas: Array.from({ length: 18 }, () => ({ x: R(0, W), y: R(40, H), e: pick(['🪨', '🪨', '💎']) })) };
      },
      paso(G, dt) {
        const st = G.st, k = G.keys, v = 180 * dt;
        if (G.ptr) { st.lx += (G.ptr.x - st.lx) * Math.min(1, dt * 10); st.ly += (G.ptr.y - st.ly) * Math.min(1, dt * 10); }
        if (k.ArrowLeft) st.lx -= v; if (k.ArrowRight) st.lx += v; if (k.ArrowUp) st.ly -= v; if (k.ArrowDown) st.ly += v;
        st.lx = Math.max(0, Math.min(W, st.lx)); st.ly = Math.max(30, Math.min(H, st.ly));
        if (G.t >= this.dura) G.fin = true;
      },
      radio(G) { return Math.max(34, 70 - G.t * 0.8); },
      toque(G, x, y) {
        const st = G.st, r = this.radio(G);
        const f = st.fos.find((q) => !q.ok && dentro(x, y, q.x, q.y, 24) && dentro(q.x, q.y, st.lx, st.ly, r + 6)); if (!f) return;
        f.ok = true; st.halla += 1; G.puntos += 2; J().sfx('acierto');
        if (st.halla >= st.fos.length) { G.puntos += Math.max(0, Math.floor((this.dura - G.t) / 3)); G.fin = true; }
      },
      dibujar(ctx, G) {
        const st = G.st, r = this.radio(G);
        fondo(ctx, '#3a3127', '#2a221b');
        st.rocas.forEach((q) => emoji(ctx, q.e, q.x, q.y, 18));
        st.fos.forEach((q) => { if (!q.ok) emoji(ctx, q.e, q.x, q.y, 24); });
        ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.94)'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(st.lx, st.ly, r, 0, Math.PI * 2, true); ctx.fill('evenodd'); ctx.restore();
        const g = ctx.createRadialGradient(st.lx, st.ly, r * 0.6, st.lx, st.ly, r); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.7)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(st.lx, st.ly, r, 0, 7); ctx.fill();
        texto(ctx, `Fósiles: ${st.halla}/6 · 🔋 ${Math.max(0, Math.ceil(this.dura - G.t))} s`, 200, 26, 14);
      } },
    ar_derrumbe: { zona: 'u3', ico: '🪨', nombre: 'Derrumbe', vidas: 3,
      desc: '¡Se cae el techo de la mina! Muévete a los lados (mantén el dedo hacia donde quieres ir o usa las flechas) para esquivar las rocas. Atrapa las gemas.',
      iniciar(G) { G.st = { x: 200, caen: [], prox: 0, inv: 0 }; },
      paso(G, dt) {
        const st = G.st; st.x = Math.max(20, Math.min(W - 20, st.x + dirX(G, st.x) * 230 * dt)); st.inv = Math.max(0, st.inv - dt);
        st.prox -= dt;
        if (st.prox <= 0) { const gema = rnd() < 0.15; st.caen.push({ x: R(15, W - 15), y: -20, v: R(120, 170) + G.t * 4, gema }); st.prox = Math.max(0.18, 0.7 - G.t * 0.012); }
        st.caen.forEach((c) => { c.y += c.v * dt; });
        st.caen.forEach((c) => {
          if (!c.ok && Math.abs(c.x - st.x) < 22 && Math.abs(c.y - 255) < 20) {
            c.ok = true;
            if (c.gema) { G.extra = (G.extra || 0) + 3; J().sfx('moneda'); } else if (!st.inv) { G.vidas -= 1; st.inv = 1; J().sfx('dano'); if (G.vidas <= 0) G.fin = true; }
          }
        });
        st.caen = st.caen.filter((c) => c.y < H + 20 && !c.ok);
        G.puntos = Math.floor(G.t) + (G.extra || 0);
      },
      dibujar(ctx, G) {
        const st = G.st; fondo(ctx, '#4a3b2c', '#2a2017');
        ctx.fillStyle = '#20180f'; ctx.fillRect(0, 270, W, 30);
        st.caen.forEach((c) => emoji(ctx, c.gema ? '💎' : '🪨', c.x, c.y, c.gema ? 22 : 28));
        if (!st.inv || Math.floor(st.inv * 10) % 2) emoji(ctx, '👷', st.x, 252, 34);
      } },

    // ---------------- Glaciar ----------------
    ar_trineo_bajada: { zona: 'u4', ico: '🛷', nombre: 'Trineo cuesta abajo', vidas: 3,
      desc: 'Bájate la ladera en trineo: gira a los lados (mantén el dedo o usa las flechas) para esquivar pinos y rocas, y junta copos de nieve.',
      iniciar(G) { G.st = { x: 200, cosas: [], vel: 140, dist: 0, prox: 0, copos: 0, inv: 0 }; },
      paso(G, dt) {
        const st = G.st; st.vel = Math.min(360, 140 + G.t * 6); st.dist += st.vel * dt; st.inv = Math.max(0, st.inv - dt);
        st.x = Math.max(20, Math.min(W - 20, st.x + dirX(G, st.x) * 240 * dt));
        st.prox -= dt;
        if (st.prox <= 0) { const copo = rnd() < 0.3; st.cosas.push({ x: R(15, W - 15), y: H + 20, copo, e: copo ? '❄️' : pick(['🌲', '🌲', '🪨']) }); st.prox = Math.max(0.22, 0.6 - G.t * 0.01); }
        st.cosas.forEach((c) => { c.y -= st.vel * dt; });
        st.cosas.forEach((c) => {
          if (!c.ok && Math.abs(c.x - st.x) < 20 && Math.abs(c.y - 80) < 20) {
            c.ok = true; if (c.copo) { st.copos += 1; J().sfx('moneda'); } else if (!st.inv) { G.vidas -= 1; st.inv = 1.2; J().sfx('dano'); if (G.vidas <= 0) G.fin = true; }
          }
        });
        st.cosas = st.cosas.filter((c) => c.y > -30 && !c.ok);
        G.puntos = Math.floor(st.dist / 200) + st.copos;
      },
      dibujar(ctx, G) {
        const st = G.st; fondo(ctx, '#f4fbff', '#d7ecf7');
        st.cosas.forEach((c) => emoji(ctx, c.e, c.x, c.y, c.copo ? 20 : 30));
        if (!st.inv || Math.floor(st.inv * 10) % 2) emoji(ctx, '🛷', st.x, 80, 34);
      } },
    ar_pesca_hielo: { zona: 'u4', ico: '🎣', nombre: 'Pesca en el hielo', album: 'peces_hielo', dura: 45,
      desc: 'Por debajo del hielo nadan peces. Toca (o espacio) para bajar el anzuelo: atrapa el primero que toque. Los más profundos son más raros… y más rápidos.',
      PROF: [{ y: 130, items: ['plateado', 'camaron'], v: [50, 80] }, { y: 185, items: ['payaso', 'cangrejo', 'globo'], v: [70, 110] }, { y: 245, items: ['calamar', 'pulpo', 'ballena'], v: [100, 150] }],
      iniciar(G) { G.st = { peces: [], prox: 0, anz: 0, baja: 0, atrapados: [] }; },
      paso(G, dt) {
        const st = G.st; st.prox -= dt;
        if (st.prox <= 0) {
          const nivel = rnd() < 0.5 ? 0 : rnd() < 0.65 ? 1 : 2, P = this.PROF[nivel], izq = rnd() < 0.5;
          let id = pick(P.items); if (id === 'ballena' && rnd() < 0.75) id = 'pulpo'; if (id === 'pulpo' && rnd() < 0.4) id = 'calamar';
          const item = ALBUMES.peces_hielo.items.find((x) => x.id === id);
          st.peces.push({ x: izq ? -20 : W + 20, y: P.y + R(-10, 10), v: R(P.v[0], P.v[1]) * (izq ? 1 : -1), item, nivel });
          st.prox = 0.5 + rnd() * 0.6;
        }
        st.peces.forEach((p) => { p.x += p.v * dt; }); st.peces = st.peces.filter((p) => p.x > -40 && p.x < W + 40);
        if (st.baja) {
          st.anz += st.baja * 260 * dt;
          if (st.baja > 0) { const p = st.peces.find((q) => Math.abs(q.x - 200) < 18 && Math.abs(q.y - (80 + st.anz)) < 16); if (p) { st.peces = st.peces.filter((q) => q !== p); st.atrapados.push(p.item); G.puntos += 1 + p.nivel * 2; J().sfx('acierto'); st.baja = -1; st.pez = p.item; } }
          if (st.anz >= 190) st.baja = -1;
          if (st.anz <= 0) { st.anz = 0; st.baja = 0; st.pez = null; }
        }
        if (G.t >= this.dura) G.fin = true;
      },
      toque(G) { if (!G.st.baja) G.st.baja = 1; }, tecla(G, k) { if (k === ' ' || k === 'ArrowDown') this.toque(G); },
      dibujar(ctx, G) {
        const st = G.st; fondo(ctx, '#bfe3f5', '#0e3a5c');
        ctx.fillStyle = '#eef8ff'; ctx.fillRect(0, 50, 180, 26); ctx.fillRect(220, 50, 180, 26);
        emoji(ctx, '🧍', 170, 32, 30);
        ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(200, 40); ctx.lineTo(200, 80 + st.anz); ctx.stroke();
        emoji(ctx, st.pez ? st.pez.e : '🪝', 200, 84 + st.anz, st.pez ? 24 : 16);
        st.peces.forEach((p) => { ctx.save(); ctx.translate(p.x, p.y); if (p.v > 0) ctx.scale(-1, 1); emoji(ctx, p.item.e, 0, 0, 24); ctx.restore(); });
        texto(ctx, `Peces: ${st.atrapados.length} · ⏱️ ${Math.max(0, Math.ceil(this.dura - G.t))} s`, 300, 26, 14);
      } },
    ar_pinguinos: { zona: 'u4', ico: '🐧', nombre: 'Pingüinos a casa', dura: 100,
      desc: 'El pingüino se desliza sobre el hielo hasta chocar con algo. Llévalo al iglú en la menor cantidad de movimientos (flechas o desliza el dedo). Son 3 niveles.',
      COLS: 8, FILAS: 5,
      iniciar(G) { G.st = { nivel: 0 }; this.nuevo(G); },
      deslizar(m, x, y, dx, dy, C, F) { while (true) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= C || ny >= F || m[ny][nx]) return [x, y]; x = nx; y = ny; if (m.meta && x === m.meta[0] && y === m.meta[1]) return [x, y]; } },
      nuevo(G) {
        const C = this.COLS, F = this.FILAS;
        for (let intento = 0; intento < 400; intento++) {
          const m = Array.from({ length: F }, () => Array.from({ length: C }, () => rnd() < 0.22));
          const s = [R(0, C - 1), R(0, F - 1)], g = [R(0, C - 1), R(0, F - 1)]; if (s[0] === g[0] && s[1] === g[1]) continue;
          m[s[1]][s[0]] = false; m[g[1]][g[0]] = false; m.meta = g;
          const vistos = new Map([[s.join(','), 0]]), cola = [s]; let min = -1;
          while (cola.length) {
            const [x, y] = cola.shift(), d = vistos.get(`${x},${y}`);
            if (x === g[0] && y === g[1]) { min = d; break; }
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = this.deslizar(m, x, y, dx, dy, C, F), k = n.join(','); if (!vistos.has(k)) { vistos.set(k, d + 1); cola.push(n); } }
          }
          if (min >= 3 + Math.min(2, G.st.nivel) && min <= 7) { Object.assign(G.st, { m, p: s, g, min, mov: 0, anim: null }); return; }
        }
        G.fin = true;
      },
      mover(G, dx, dy) {
        const st = G.st; if (st.anim || G.fin) return;
        const d = this.deslizar(st.m, st.p[0], st.p[1], dx, dy, this.COLS, this.FILAS); if (d[0] === st.p[0] && d[1] === st.p[1]) return;
        st.mov += 1; st.anim = { de: st.p.slice(), a: d, t: 0 }; J().sfx('clic');
      },
      paso(G, dt) {
        const st = G.st;
        if (st.anim) {
          st.anim.t += dt * 4; if (st.anim.t >= 1) {
            st.p = st.anim.a; st.anim = null;
            if (st.p[0] === st.g[0] && st.p[1] === st.g[1]) { G.puntos += Math.max(1, 5 - (st.mov - st.min)); J().sfx('logro'); st.nivel += 1; if (st.nivel >= 3) G.fin = true; else this.nuevo(G); }
          }
        }
        if (G.t >= this.dura) G.fin = true;
      },
      tecla(G, k) { const m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k]; if (m) this.mover(G, m[0], m[1]); },
      toque(G, x, y) { G.st.ini = [x, y]; },
      suelta(G, x, y) {
        const i = G.st.ini; if (!i) return; G.st.ini = null; let dx = x - i[0], dy = y - i[1];
        if (Math.hypot(dx, dy) < 18) { const c = this.centro(G.st.p); dx = x - c[0]; dy = y - c[1]; }
        if (Math.abs(dx) > Math.abs(dy)) this.mover(G, Math.sign(dx), 0); else this.mover(G, 0, Math.sign(dy));
      },
      centro(p) { return [40 + p[0] * 40 + 20, 60 + p[1] * 44 + 22]; },
      dibujar(ctx, G) {
        const st = G.st; fondo(ctx, '#dff3ff', '#b8dcef'); if (!st.m) return;
        for (let y = 0; y < this.FILAS; y++) for (let x = 0; x < this.COLS; x++) { caja(ctx, 41 + x * 40, 61 + y * 44, 38, 42, '#eaf7ff', 6); if (st.m[y][x]) emoji(ctx, '🧊', 60 + x * 40, 82 + y * 44, 30); }
        const [gx, gy] = this.centro(st.g); emoji(ctx, '🛖', gx, gy, 32);
        let [px, py] = this.centro(st.p); if (st.anim) { const a = this.centro(st.anim.de), b = this.centro(st.anim.a), t = st.anim.t; px = a[0] + (b[0] - a[0]) * t; py = a[1] + (b[1] - a[1]) * t; }
        emoji(ctx, '🐧', px, py, 30);
        texto(ctx, `Nivel ${Math.min(3, st.nivel + 1)}/3 · movimientos ${st.mov} (lo mínimo: ${st.min}) · ⏱️ ${Math.max(0, Math.ceil(this.dura - G.t))}`, 200, 30, 12);
      } },

    // ---------------- Base ----------------
    ar_huerto: { zona: 'base', ico: '🌱', nombre: 'Huerto', album: 'cosechas', huerto: true,
      desc: 'Planta semillas en tus 6 parcelas, riégalas y vuelve cuando estén listas para cosechar. Cada cosecha va a tu álbum y te da recursos.' },
    ar_diana: { zona: 'base', ico: '🎯', nombre: 'Tiro al blanco', dura: 30,
      desc: 'Toca las dianas que se mueven. Las de arriba son más rápidas y valen más. Tienes 15 flechas y 30 segundos.',
      iniciar(G) { G.st = { dianas: [], flechas: 15, prox: 0, impactos: [] }; },
      paso(G, dt) {
        const st = G.st; st.prox -= dt;
        if (st.prox <= 0 && st.dianas.length < 4) { const fila = R(0, 2), izq = rnd() < 0.5; st.dianas.push({ x: izq ? -20 : W + 20, y: 80 + fila * 60, v: (90 - fila * 22 + G.t * 2) * (izq ? 1 : -1) * (fila === 0 ? 1.6 : fila === 1 ? 1.25 : 1), val: 3 - fila }); st.prox = 0.6; }
        st.dianas.forEach((d) => { d.x += d.v * dt; }); st.dianas = st.dianas.filter((d) => d.x > -30 && d.x < W + 30 && !d.ok);
        st.impactos.forEach((i) => { i.t -= dt; }); st.impactos = st.impactos.filter((i) => i.t > 0);
        if (G.t >= this.dura || st.flechas <= 0) G.fin = true;
      },
      toque(G, x, y) {
        const st = G.st; if (st.flechas <= 0) return; st.flechas -= 1;
        const d = st.dianas.find((q) => dentro(x, y, q.x, q.y, 20));
        if (d) { d.ok = true; const centro = dentro(x, y, d.x, d.y, 7); G.puntos += d.val + (centro ? 2 : 0); st.impactos.push({ x, y, t: 0.6, txt: `+${d.val + (centro ? 2 : 0)}` }); J().sfx('golpe'); } else { st.impactos.push({ x, y, t: 0.4, txt: '·' }); J().sfx('clic'); }
      },
      dibujar(ctx, G) {
        const st = G.st; fondo(ctx, '#a6d98a', '#6aa851');
        // tres carriles de madera (sólidos) donde corren las dianas
        [80, 140, 200].forEach((y, i) => { caja(ctx, 0, y - 24, W, 48, ['#c98f52', '#b97f45', '#a9703a'][i], 0); ctx.fillStyle = '#5a3418'; ctx.fillRect(0, y + 20, W, 4); ctx.fillRect(0, y - 24, W, 2); texto(ctx, `${3 - i} pts`, 22, y, 11, '#fff3c4'); });
        st.dianas.forEach((d) => diana(ctx, d.x, d.y, 19));
        st.impactos.forEach((i) => texto(ctx, i.txt, i.x, i.y - (0.6 - i.t) * 30, 16, '#ffd27a'));
        texto(ctx, `🏹 ${st.flechas} · ⏱️ ${Math.max(0, Math.ceil(this.dura - G.t))} s`, 200, 30, 15);
      } },
    ar_mascotas: { zona: 'base', ico: '🐾', nombre: 'Carrera de mascotas',
      desc: '¡Anima a tu mascota! Toca muchas veces (o aprieta espacio) para que corra más rápido. Gana quien llegue primero a la meta.',
      iniciar(G) {
        const rivales = ['🐰', '🦊', '🐢'].map((e, i) => ({ e, x: 30, v: 0, base: R(46, 58) + i * 2 }));
        G.st = { yo: { e: '🐶', x: 30, v: 0 }, rivales, toques: [], fase: 'cuenta', t: 3, lugar: 0 };
      },
      paso(G, dt) {
        const st = G.st;
        if (st.fase === 'cuenta') { st.t -= dt; if (st.t <= 0) { st.fase = 'corre'; st.t0 = G.t; } return; }
        if (st.fase === 'fin') { st.t -= dt; if (st.t <= 0) G.fin = true; return; }
        const ahora = G.t; st.toques = st.toques.filter((t) => ahora - t < 1);
        st.yo.v = 22 + Math.min(10, st.toques.length) * 9;
        st.rivales.forEach((r) => { r.v = r.base + Math.sin(ahora * 2 + r.base) * 12; });
        [st.yo, ...st.rivales].forEach((c) => { c.x += c.v * dt; });
        const meta = 360, todos = [st.yo, ...st.rivales];
        if (st.yo.x >= meta) {
          st.lugar = 1 + st.rivales.filter((r) => r.x >= meta).length;
          G.puntos = [0, 10, 6, 3, 1][st.lugar]; st.fase = 'fin'; st.t = 1.2; J().sfx(st.lugar === 1 ? 'logro' : 'acierto');
        } else if (st.rivales.every((r) => r.x >= meta)) { st.lugar = 4; G.puntos = 1; st.fase = 'fin'; st.t = 1.2; }
        todos.forEach((c) => { c.x = Math.min(c.x, meta + 5); });
      },
      animar(G) { if (G.st.fase === 'corre') G.st.toques.push(G.t); },
      toque(G) { this.animar(G); }, tecla(G, k) { if (k === ' ' || k === 'Enter') this.animar(G); },
      dibujar(ctx, G) {
        const st = G.st; fondo(ctx, '#7fc463', '#5aa144');
        const carriles = [st.yo, ...st.rivales], COL = ['#ffb43c', '#f2f2f2', '#e8743a', '#5aa86a'];
        carriles.forEach((c, i) => {
          const y = 70 + i * 55;
          // pista de tierra sólida con borde, y la mascota sobre una ficha de color con contorno marcado
          caja(ctx, 0, y - 22, W, 44, i === 0 ? '#e6b873' : '#d2a467', 0);
          ctx.fillStyle = '#7a4f26'; ctx.fillRect(0, y - 22, W, 3); ctx.fillRect(0, y + 19, W, 3);
          ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(c.x, y + 15, 17, 5, 0, 0, 7); ctx.fill();
          ctx.fillStyle = COL[i]; ctx.strokeStyle = '#1d2b25'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c.x, y - 2, 18, 0, 7); ctx.fill(); ctx.stroke();
          emoji(ctx, c.e, c.x, y - 1, 26);
          if (i === 0) texto(ctx, 'TÚ', c.x, y - 28, 11, '#ffd27a');
        });
        for (let y = 48; y < 290; y += 16) { ctx.fillStyle = '#fff'; ctx.fillRect(362, y, 6, 8); ctx.fillStyle = '#1d2b25'; ctx.fillRect(362, y + 8, 6, 8); }
        texto(ctx, st.fase === 'cuenta' ? `${Math.ceil(st.t)}…` : st.fase === 'fin' ? `¡Llegaste ${['', '1.°', '2.°', '3.°', '4.°'][st.lugar]}!` : '¡Toca rápido para animar!', 200, 24, 16);
      } },

    // ---------------- Altar ----------------
    ar_trueno: { zona: 'altar', ico: '⚡', nombre: 'Reflejos del trueno', vidas: 3,
      desc: 'Un rayo cae sobre uno de los cuatro pilares: tócalo antes de que se apague. Cada vez es más rápido. Si tocas otro pilar o llegas tarde, pierdes un corazón.',
      iniciar(G) { G.st = { luz: -1, t: 0.8, ventana: 1.15, flash: 0 }; },
      px(i) { return 65 + i * 90; },
      paso(G, dt) {
        const st = G.st; st.t -= dt; st.flash = Math.max(0, st.flash - dt);
        if (st.t <= 0) {
          if (st.luz >= 0) { G.vidas -= 1; J().sfx('error'); st.luz = -1; st.t = 0.6; if (G.vidas <= 0) G.fin = true; }
          else { st.luz = R(0, 3); st.t = st.ventana; st.flash = 0.15; }
        }
      },
      toque(G, x) {
        const st = G.st, i = [0, 1, 2, 3].find((k) => Math.abs(x - this.px(k)) < 40); if (i === undefined) return;
        if (i === st.luz) { G.puntos += 1; st.luz = -1; st.t = 0.25 + rnd() * 0.5; st.ventana = Math.max(0.42, st.ventana * 0.96); J().sfx('acierto'); }
        else { G.vidas -= 1; J().sfx('error'); if (G.vidas <= 0) G.fin = true; }
      },
      tecla(G, k) { const i = ['1', '2', '3', '4'].indexOf(k); if (i >= 0) this.toque(G, this.px(i)); },
      dibujar(ctx, G) {
        const st = G.st; fondo(ctx, st.flash ? '#5a5a8a' : '#1c1838', '#3a2f55');
        [0, 1, 2, 3].forEach((i) => { const x = this.px(i), on = st.luz === i; caja(ctx, x - 26, 120, 52, 150, on ? '#ffe66b' : '#6b6488', 8); if (on) emoji(ctx, '⚡', x, 90, 44); texto(ctx, String(i + 1), x, 250, 14, on ? '#1c1838' : '#fff'); });
      } },
  };
  Object.values(DEF).forEach((d) => { if (!d.dura && !d.vidas && !d.huerto) d.vidas = 1; });

  // ===================================================================
  // Motor común
  // ===================================================================
  let G = null, raf = 0;
  function dia() {
    const S = J().S(), hoy = new Date().toISOString().slice(0, 10);
    if (!S.arDia || S.arDia.f !== hoy) S.arDia = { f: hoy, n: {}, xp: 0 };
    return S.arDia;
  }
  const rec = (id) => { const S = J() && J().S(); return (S && S.arRec && S.arRec[id]) || 0; };
  const jugados = () => { const S = J() && J().S(); return (S && S.arJugados ? S.arJugados.length : 0); };
  function textoPremio(veces) {
    return veces >= PREMIO_MENOR ? `Hoy ya jugaste ${veces} veces: ahora es práctica libre (sin premio, pero puedes batir tu récord).`
      : veces >= PREMIO_COMPLETO ? `Hoy ya jugaste ${veces} veces: el premio ahora es menor.` : `Premio completo en tus primeras ${PREMIO_COMPLETO} partidas del día (llevas ${veces}).`;
  }

  function abrir(id) {
    const d = DEF[id]; if (!d || !J() || !J().S()) return;
    if (d.huerto) return abrirHuerto();
    const veces = dia().n[id] || 0, r = rec(id);
    J().ui.abrir(`<div class="modal-cab"><div><span class="etq">Minijuego · ${esc(J().nombreZona(d.zona))}</span><h2 id="modal-titulo">${d.ico} ${esc(d.nombre)}</h2></div><button type="button" class="btn" id="ar-no">Cerrar</button></div>
      <div class="ar-portada"><div class="ar-portada-ico" aria-hidden="true">${d.ico}</div><p class="enunciado">${esc(d.desc)}</p>
        <ul class="mjx-fichas"><li><b>🏆 ${r}</b> tu récord</li>${d.dura ? `<li><b>⏱️ ${d.dura} s</b></li>` : ''}${d.vidas > 1 ? `<li><b>${'❤️'.repeat(d.vidas)}</b></li>` : ''}${d.album ? `<li><b>📖 ${albumTengo(d.album)}/${ALBUMES[d.album].items.length}</b> álbum</li>` : ''}</ul>
        <p class="nota">${textoPremio(veces)}${d.album ? ' Al jugar puedes ganar objetos para tu álbum.' : ''}</p></div>
      <div class="acciones">${d.album ? `<button type="button" class="btn sec" id="ar-album">📖 Ver álbum</button>` : '<span></span>'}<div>${puedeCompetir(d) ? '<button type="button" class="btn sec" id="ar-comp">🏁 Competir con compañeros</button> ' : ''}<button type="button" class="btn pri" id="ar-si" data-foco>▶ ¡Jugar!</button></div></div>`, 'ar-modal');
    $('ar-no').addEventListener('click', () => J().ui.cerrar());
    $('ar-si').addEventListener('click', () => empezar(id));
    const cp = $('ar-comp'); if (cp) cp.addEventListener('click', () => abrirComp(id));
    const al = $('ar-album'); if (al) al.addEventListener('click', () => abrirAlbum(d.album, id));
  }

  // El lienzo ocupa todo el espacio libre de la pantalla (sin barras de desplazamiento) y mantiene 4:3;
  // su resolución interna sigue al tamaño real para que se vea nítido en pantallas grandes y celulares.
  function encajarLienzo(cv) {
    const zona = cv.parentElement;
    const ajustar = () => {
      if (!cv.isConnected) { if (ro) ro.disconnect(); return; }
      const w = zona.clientWidth, h = zona.clientHeight; if (w <= 0 || h <= 0) return;
      let ww = w, hh = (w * H) / W; if (hh > h) { hh = h; ww = (h * W) / H; }
      cv.style.width = `${Math.floor(ww)}px`; cv.style.height = `${Math.floor(hh)}px`;
      const k = Math.min(3, window.devicePixelRatio || 1);
      cv.width = Math.max(W, Math.round(ww * k)); cv.height = Math.round((cv.width * H) / W);
    };
    const ro = window.ResizeObserver ? new ResizeObserver(ajustar) : null;
    if (ro) ro.observe(zona); else window.addEventListener('resize', ajustar);
    ajustar();
  }

  function empezar(id, semillaComp) {
    const d = DEF[id];
    parar();
    rnd = semillaComp ? semilla(semillaComp) : Math.random;
    G = { id, d, t: 0, puntos: 0, vidas: d.vidas || 1, fin: false, keys: {}, ptr: null, t0: Date.now(), st: {}, comp: Boolean(semillaComp), envio: 0 };
    J().ui.abrir(`<div class="modal-cab ar-cab"><div><span class="etq">${esc(J().nombreZona(d.zona))}${G.comp ? ' · 🏁 Competencia' : ''}</span><h2 id="modal-titulo">${d.ico} ${esc(d.nombre)}</h2></div>
        <div class="ar-hud"><span id="ar-pts">0</span><span id="ar-vid"></span></div><button type="button" class="btn" id="ar-salir">Salir</button></div>
      ${G.comp ? '<div class="ar-rivales" id="ar-riv" aria-live="off"></div>' : ''}
      <div class="ar-lienzo"><canvas id="ar-cv" width="${W * 2}" height="${H * 2}" tabindex="0" aria-label="${esc(d.nombre)}"></canvas></div>
      <p class="nota ar-ayuda">${esc(d.desc)}</p>`, 'ar-modal ar-juego', () => { parar(); salirComp(); });
    $('ar-salir').addEventListener('click', () => { parar(); J().ui.cerrar(); });
    const cv = $('ar-cv'), ctx = cv.getContext('2d');
    encajarLienzo(cv);
    const coord = (e) => { const r = cv.getBoundingClientRect(); return [((e.clientX - r.left) * W) / r.width, ((e.clientY - r.top) * H) / r.height]; };
    cv.addEventListener('pointerdown', (e) => { if (!G || G.fin) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (er) { /* */ } const [x, y] = coord(e); G.ptr = { x, y }; if (d.toque) d.toque(G, x, y); });
    cv.addEventListener('pointermove', (e) => { if (!G) return; const [x, y] = coord(e); if (G.ptr || e.pointerType === 'mouse') G.ptr = { x, y, raton: e.pointerType === 'mouse' && !G.ptr }; });
    const soltar = (e) => { if (!G) return; const [x, y] = coord(e); if (d.suelta) d.suelta(G, x, y); G.ptr = null; };
    cv.addEventListener('pointerup', soltar); cv.addEventListener('pointercancel', () => { if (G) G.ptr = null; });
    cv.addEventListener('pointerleave', (e) => { if (G && e.pointerType === 'mouse') G.ptr = null; });
    G.kd = (e) => {
      if (!G || !$('ar-cv')) return; const k = e.key;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(k)) e.preventDefault();
      if (e.repeat) return;
      G.keys[k] = true; if (d.tecla && !G.fin) d.tecla(G, k); else if ((k === ' ' || k === 'Enter') && d.toque && !d.tecla && !G.fin && !['ar_luciernagas', 'ar_duende', 'ar_duna', 'ar_jeroglificos', 'ar_diana', 'ar_linterna'].includes(id)) d.toque(G, W / 2, H / 2);
    };
    G.ku = (e) => { if (G) G.keys[e.key] = false; };
    document.addEventListener('keydown', G.kd, true); document.addEventListener('keyup', G.ku, true);
    d.iniciar(G);
    cv.focus();
    let antes = performance.now();
    const ciclo = (ahora) => {
      if (!G || !cv.isConnected) return parar();
      const dt = Math.min(0.05, (ahora - antes) / 1000); antes = ahora;
      if (!G.fin) { G.t += dt; d.paso(G, dt); }
      const k = cv.width / W; ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.clearRect(0, 0, W, H); d.dibujar(ctx, G);
      const p = $('ar-pts'), v = $('ar-vid');
      if (p) p.textContent = `⭐ ${G.puntos}`; if (v) v.textContent = d.vidas > 1 ? corazones(G.vidas, d.vidas) : d.dura ? `⏱️ ${Math.max(0, Math.ceil(d.dura - G.t))}` : '';
      // en competencia se envían los puntos cada medio segundo y se actualiza el marcador
      if (G.comp && (G.t - G.envio >= 0.5 || G.fin)) { G.envio = G.t; compPuntos(G.puntos, false); pintarRivales(); }
      if (G.fin) { const g = G; parar(); setTimeout(() => terminar(g), 450); return; }
      raf = requestAnimationFrame(ciclo);
    };
    raf = requestAnimationFrame(ciclo);
  }
  function parar() {
    cancelAnimationFrame(raf); raf = 0;
    if (G) { document.removeEventListener('keydown', G.kd, true); document.removeEventListener('keyup', G.ku, true); }
    G = null; rnd = Math.random;
  }

  function terminar(g) {
    const M = J(), S = M.S(), d = g.d, id = g.id, D = dia(), veces = D.n[id] || 0, comp = Boolean(g.comp && C);
    D.n[id] = veces + 1;
    const dur = Date.now() - g.t0, valido = dur >= MIN_MS && g.puntos > 0;
    const mult = !valido || veces >= PREMIO_MENOR ? 0 : veces >= PREMIO_COMPLETO ? 0.25 : 1;
    let xp = Math.round(Math.min(45, 8 + g.puntos * 1.2) * mult);
    xp = Math.max(0, Math.min(xp, XP_DIA - (D.xp || 0))); D.xp = (D.xp || 0) + xp;
    const rec0 = (S.arRec || {})[id] || 0, nuevoRec = g.puntos > rec0;
    S.arRec = { ...(S.arRec || {}), [id]: Math.max(rec0, g.puntos) };
    S.arJugados = Array.from(new Set([...(S.arJugados || []), id]));
    const recursos = mult > 0 ? M.paquete(Math.max(1, Math.round((1 + g.puntos * 0.25) * mult)), 2, true) : {};
    const txt = xp || Object.keys(recursos).length ? M.darPremio(recursos, xp) : '';
    M.contar('arcade'); M.contar(`${id}`);
    // álbum: los peces se registran al pescarlos; en los demás, un objeto al azar según qué tan bien jugaste
    let hallazgos = [];
    if (d.album && valido && veces < PREMIO_MENOR) {
      if (id === 'ar_pesca_hielo') hallazgos = (g.st.atrapados || []).map((x) => registrar(d.album, x));
      else if (rnd() < Math.min(0.85, 0.3 + g.puntos / 30)) hallazgos = [registrar(d.album, sortear(ALBUMES[d.album].items, Math.min(1, g.puntos / 40)))];
    }
    const nuevos = hallazgos.filter((h) => h.nuevo), mejor = nuevos[0] || hallazgos[0];
    M.sfx(nuevoRec ? 'logro' : g.puntos ? 'acierto' : 'error'); if (nuevoRec && g.puntos >= 5) M.celebrar();
    M.guardar(true);
    const motivo = !valido ? (g.puntos > 0 ? '⚡ Partida demasiado corta: para ganar premio hay que jugar un poco más.' : 'Sin puntos esta vez: ¡inténtalo otra vez!')
      : mult === 0 ? 'Práctica libre: hoy ya ganaste el premio de este minijuego.' : (D.xp || 0) >= XP_DIA ? `Llegaste al máximo de experiencia de estos minijuegos por hoy (${XP_DIA}).` : mult < 1 ? 'Premio reducido: ya jugaste varias veces hoy.' : '';
    M.ui.abrir(`<div class="modal-cab"><div><span class="etq">${esc(d.nombre)}</span><h2 id="modal-titulo">${nuevoRec ? '🏆 ¡Nuevo récord!' : g.puntos ? '¡Bien jugado!' : '¡A la próxima!'}</h2></div></div>
      <div class="mjx-final ar-final">
        <p class="enunciado">Puntos: <b>${g.puntos}</b> · Récord: <b>${Math.max(rec0, g.puntos)}</b></p>
        <ul class="mjx-fichas premio">${txt ? `<li><b>🎁</b> ${esc(txt)}</li>` : ''}${xp ? `<li><b>⭐ ${xp}</b> de experiencia</li>` : ''}</ul>
        ${mejor ? `<div class="ar-hallazgo"><span class="ar-ico" style="${mejor.item.color ? `--c:${mejor.item.color}` : ''}">${mejor.item.e}</span><div><b>${mejor.nuevo ? '¡Nuevo en tu álbum!' : 'Encontraste'}</b> ${esc(mejor.item.nombre)} <small class="rareza ${CLASE[mejor.item.rareza]}">${esc(mejor.item.rareza)}</small>${hallazgos.length > 1 ? `<br><small>y ${hallazgos.length - 1} más (${nuevos.length} nuevos)</small>` : ''}</div></div>` : ''}
        ${motivo ? `<p class="nota">${motivo}</p>` : ''}
        ${comp ? '<div class="ar-rank" id="ar-rank"></div>' : ''}</div>
      <div class="acciones"><button type="button" class="btn" id="ar-fin" data-foco>${comp ? 'Salir de la sala' : 'Cerrar'}</button><div>${d.album && !comp ? '<button type="button" class="btn sec" id="ar-alb">📖 Álbum</button> ' : ''}${comp ? (C.host ? '<button type="button" class="btn pri" id="ar-revancha">↻ Revancha (misma sala)</button>' : '<span class="nota">El anfitrión puede pedir revancha.</span>') : '<button type="button" class="btn pri" id="ar-otra">↻ Jugar otra vez</button>'}</div></div>`, 'ar-modal', comp ? () => salirComp() : null);
    $('ar-fin').addEventListener('click', () => M.ui.cerrar());
    const ot = $('ar-otra'); if (ot) ot.addEventListener('click', () => abrir(id));
    const rv = $('ar-revancha'); if (rv) rv.addEventListener('click', () => { if (C) { C.canal.emitir('ar', { t: 'sala', de: C.yo }); recibirComp({ t: 'sala', de: C.yo }); } });
    const al = $('ar-alb'); if (al) al.addEventListener('click', () => abrirAlbum(d.album, id));
    if (comp) { compPuntos(g.puntos, true); pintarRanking(); }
  }

  // ===================================================================
  // Modo competencia: varios compañeros juegan la misma partida a la vez (sala con código)
  // ===================================================================
  let C = null;   // sala en curso
  const COMP_MAX = 8;
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const puedeCompetir = (d) => Boolean(d && !d.huerto && J() && J().coop() && !J().esDocente() && window.Coop);
  function salirComp() {
    if (!C) return;
    try { C.canal.emitir('ar', { t: 'chao', de: C.yo }); C.canal.salir(); } catch (e) { /* */ }
    clearTimeout(C.reloj); C = null;
  }
  function abrirComp(id, err) {
    const d = DEF[id], M = J();
    M.ui.abrir(`<div class="modal-cab"><div><span class="etq">Competencia · ${esc(d.nombre)}</span><h2 id="modal-titulo">🏁 Competir con compañeros</h2></div><button type="button" class="btn" id="ac-cerrar">Cerrar</button></div>
      <p class="enunciado">Todos juegan <b>la misma partida a la vez</b> y ven los puntos de los demás en vivo. ¡Gana quien haga más puntos! (De 2 a ${COMP_MAX} jugadores.)</p>
      <section class="tarjeta-mision"><strong>Crear una sala</strong><span class="nota">Te damos un código de 4 letras para que se lo digas a tus compañeros.</span><button type="button" class="btn pri" id="ac-crear">Crear sala</button></section>
      <section class="tarjeta-mision"><strong>Unirme a una sala</strong><span class="nota">Escribe el código que te dio tu compañero.</span>
        <input id="ac-codigo" class="du-codigo" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="ABCD" aria-label="Código de la sala">
        <button type="button" class="btn" id="ac-unirme">Unirme</button>${err ? `<small class="nota" style="color:#ff9a8a">${esc(err)}</small>` : ''}</section>
      <div class="acciones"><button type="button" class="btn sec" id="ac-volver">Volver</button><span class="nota">El premio es el mismo que jugando solo.</span></div>`, 'ar-modal', () => salirComp());
    $('ac-cerrar').addEventListener('click', () => M.ui.cerrar());
    $('ac-volver').addEventListener('click', () => { salirComp(); abrir(id); });
    $('ac-crear').addEventListener('click', () => conectarComp(id, Array.from({ length: 4 }, () => letras[Math.floor(Math.random() * letras.length)]).join(''), true));
    $('ac-unirme').addEventListener('click', () => {
      const c = String($('ac-codigo').value || '').toUpperCase().replace(/[^A-Z]/g, '');
      if (c.length !== 4) return abrirComp(id, 'El código tiene 4 letras.');
      conectarComp(id, c, false);
    });
    $('ac-codigo').addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') $('ac-unirme').click(); });
  }
  function conectarComp(id, codigo, host) {
    salirComp();
    const M = J(), yo = `${M.nombreJug()}-${Math.random().toString(36).slice(2, 7)}`;
    const canal = new window.Coop.Canal(`mw-ar-${M.cursoCanal()}-${id}-${codigo}`, yo, { nombre: M.nombreJug(), host });
    C = { id, codigo, host, yo, canal, fase: 'sala', pres: {}, jug: { [yo]: { nombre: M.nombreJug(), pts: 0, fin: false, host } }, gano: false };
    canal.alEstado = () => { if (C && C.canal === canal && C.fase === 'sala') pintarSala(); };
    canal.alCambiarPresencia = (pres) => {
      if (!C || C.canal !== canal) return;
      C.pres = pres;
      if (C.fase === 'sala') {
        Object.entries(pres).forEach(([k, m]) => { if (!C.jug[k] && Object.keys(C.jug).length < COMP_MAX) C.jug[k] = { nombre: m.nombre || 'Compañero', pts: 0, fin: false, host: Boolean(m.host) }; });
        Object.keys(C.jug).forEach((k) => { if (k !== yo && !pres[k]) delete C.jug[k]; });
        pintarSala();
      } else {
        Object.keys(C.jug).forEach((k) => { if (k !== yo && !pres[k]) C.jug[k].salio = true; });
        pintarRivales(); pintarRanking();
      }
    };
    canal.on('ar', (m) => recibirComp(m));
    pintarSala();
  }
  function pintarSala() {
    if (!C) return;
    const d = DEF[C.id], M = J(), lista = Object.entries(C.jug), conectado = C.canal.est === 'ok';
    const hayHost = C.host || Object.values(C.pres).some((m) => m.host);
    M.ui.abrir(`<div class="modal-cab"><div><span class="etq">Sala de competencia · ${esc(d.nombre)}</span><h2 id="modal-titulo">🏁 Código: <span class="ar-codigo">${C.codigo}</span></h2></div><button type="button" class="btn" id="as-cerrar">Salir</button></div>
      <p class="nota">${!conectado ? '⏳ Conectando…' : C.host ? 'Dile el código a tus compañeros. Cuando estén todos, aprieta «¡Empezar!».' : hayHost ? 'Esperando que el anfitrión empiece la partida…' : '⏳ Buscando la sala: revisa que el código sea el correcto.'}</p>
      <ul class="ar-sala">${lista.map(([k, j]) => `<li>${j.host ? '👑' : '🙂'} <b>${esc(j.nombre)}</b>${k === C.yo ? ' (tú)' : ''}</li>`).join('')}</ul>
      <p class="nota">${lista.length} de ${COMP_MAX} jugadores. Todos juegan ${d.ico} ${esc(d.nombre)} al mismo tiempo.</p>
      <div class="acciones"><span></span>${C.host ? `<button type="button" class="btn pri" id="as-ir" ${lista.length < 2 ? 'disabled' : ''}>¡Empezar!</button>` : ''}</div>`, 'ar-modal', () => salirComp());
    $('as-cerrar').addEventListener('click', () => J().ui.cerrar());
    const ir = $('as-ir');
    if (ir) ir.addEventListener('click', () => {
      if (!C || Object.keys(C.jug).length < 2) return;
      const m = { t: 'go', de: C.yo, seed: Math.floor(Math.random() * 2 ** 31), jug: Object.keys(C.jug) };
      C.canal.emitir('ar', m); recibirComp(m);
    });
  }
  function recibirComp(m) {
    if (!C || !m) return;
    const j = C.jug[m.de];
    if (m.t === 'go') {
      if (C.fase !== 'sala') return;
      if (!m.jug.includes(C.yo)) { salirComp(); return J().toast('La partida de esa sala ya empezó: crea una sala nueva o espera la revancha.', 'alerta'); }
      Object.keys(C.jug).forEach((k) => { if (!m.jug.includes(k)) delete C.jug[k]; });
      m.jug.forEach((k) => { if (!C.jug[k]) C.jug[k] = { nombre: (C.pres[k] && C.pres[k].nombre) || 'Compañero', pts: 0, fin: false }; });
      Object.values(C.jug).forEach((x) => { x.pts = 0; x.fin = false; x.salio = false; });
      C.fase = 'cuenta'; C.seed = m.seed; C.gano = false;
      cuentaComp(3);
    } else if (m.t === 'pts') {
      if (j) { j.pts = m.p; j.fin = Boolean(m.fin); }
      pintarRivales(); pintarRanking();
    } else if (m.t === 'chao') {
      if (j) { if (C.fase === 'sala') delete C.jug[m.de]; else j.salio = true; }
      if (C.fase === 'sala') pintarSala(); else { pintarRivales(); pintarRanking(); }
    } else if (m.t === 'sala') {
      // revancha: todos vuelven a la sala (si alguien sigue jugando, termina su partida antes)
      if (G && G.comp) return;
      C.fase = 'sala';
      Object.keys(C.jug).forEach((k) => { if (k !== C.yo && !C.pres[k]) delete C.jug[k]; else Object.assign(C.jug[k], { pts: 0, fin: false, salio: false }); });
      pintarSala();
    }
  }
  function cuentaComp(n) {
    if (!C || C.fase !== 'cuenta') return;
    if (n <= 0) { C.fase = 'juego'; return empezar(C.id, C.seed); }
    const d = DEF[C.id];
    J().ui.abrir(`<div class="ar-cuenta"><span class="etq">🏁 Competencia · ${esc(d.nombre)}</span><b>${n}</b><p class="nota">${esc(d.desc)}</p></div>`, 'ar-modal', () => salirComp());
    J().sfx('clic');
    C.reloj = setTimeout(() => cuentaComp(n - 1), 1000);
  }
  function compPuntos(p, fin) {
    if (!C) return;
    const yo = C.jug[C.yo]; if (yo) { yo.pts = p; yo.fin = yo.fin || fin; }
    try { C.canal.emitir('ar', { t: 'pts', de: C.yo, p, fin: Boolean(fin) }); } catch (e) { /* */ }
    if (fin) C.fase = 'fin';
  }
  const ordenados = () => Object.entries(C.jug).sort((a, b) => b[1].pts - a[1].pts);
  function pintarRivales() {
    const el = $('ar-riv'); if (!el || !C) return;
    el.innerHTML = ordenados().map(([k, j], i) => `<span class="${k === C.yo ? 'yo' : ''}${j.salio ? ' salio' : ''}">${i + 1}. ${esc(j.nombre)} <b>${j.pts}</b>${j.fin ? ' 🏁' : ''}</span>`).join('');
  }
  function pintarRanking() {
    const el = $('ar-rank'); if (!el || !C) return;
    const lista = ordenados(), terminaron = lista.every(([, j]) => j.fin || j.salio);
    const max = Math.max(...lista.filter(([, j]) => !j.salio).map(([, j]) => j.pts));
    el.innerHTML = `<h3>${terminaron ? '🏆 Resultado de la competencia' : '⏳ Esperando que terminen los demás…'}</h3>
      <ol>${lista.map(([k, j]) => `<li class="${k === C.yo ? 'yo' : ''}">${terminaron && j.pts === max && !j.salio && max > 0 ? '🥇 ' : ''}<b>${esc(j.nombre)}</b> · ${j.pts} pts ${j.salio ? '<small>(salió)</small>' : j.fin ? '' : '<small>(jugando…)</small>'}</li>`).join('')}</ol>`;
    // ganar cuenta para el logro solo si compitieron al menos 2 que terminaron y se hizo algún punto
    const yo = C.jug[C.yo], rivales = lista.filter(([k, j]) => k !== C.yo && j.fin).length;
    if (terminaron && !C.gano && yo && yo.fin && rivales >= 1 && yo.pts === max && max > 0) {
      C.gano = true; J().contar('ar_gana'); J().sfx('logro'); J().celebrar(); J().guardar(true);
      J().toast(`🏆 ¡Ganaste la competencia de ${DEF[C.id].nombre}!`);
    }
  }

  // ===================================================================
  // Huerto (en tiempo real, en la base)
  // ===================================================================
  const CRECE_MS = 2 * 3600000, RIEGO_MS = 30 * 60000, PARCELAS = 6;
  function huerto() { const S = J().S(); S.huerto = Array.isArray(S.huerto) && S.huerto.length === PARCELAS ? S.huerto : Array.from({ length: PARCELAS }, () => null); return S.huerto; }
  const listaEn = (p) => p.t + CRECE_MS - (p.regada ? RIEGO_MS : 0);
  const fmt = (ms) => { const m = Math.ceil(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
  function abrirHuerto() {
    const P = huerto(), ahora = Date.now();
    const celda = (p, i) => {
      if (!p) return `<div class="ar-parcela vacia"><span class="ar-planta">🟫</span><small>Parcela vacía</small><button type="button" class="btn mini pri" data-hu="plantar" data-i="${i}">🌱 Plantar</button></div>`;
      const falta = listaEn(p) - ahora;
      if (falta <= 0) return `<div class="ar-parcela lista"><span class="ar-planta">🧺</span><small>¡Lista para cosechar!</small><button type="button" class="btn mini pri" data-hu="cosechar" data-i="${i}">Cosechar</button></div>`;
      const avance = 1 - falta / (listaEn(p) - p.t);
      return `<div class="ar-parcela"><span class="ar-planta">${avance > 0.5 ? '🌿' : '🌱'}</span><small>Lista en ${fmt(falta)}</small>${p.regada ? '<small>💧 Regada</small>' : `<button type="button" class="btn mini" data-hu="regar" data-i="${i}">💧 Regar (−30 min)</button>`}</div>`;
    };
    J().ui.abrir(`<div class="modal-cab"><div><span class="etq">Tu base · ${albumTengo('cosechas')} de ${ALBUMES.cosechas.items.length} cosechas en el álbum</span><h2 id="modal-titulo">🌱 Huerto</h2></div><button type="button" class="btn" id="hu-cerrar">Cerrar</button></div>
      <p class="nota">Las semillas tardan 2 horas en crecer (30 minutos menos si las riegas). Al cosechar descubres qué creció: ¡algunas son muy raras! Cada cosecha da recursos y experiencia.</p>
      <div class="ar-huerto">${P.map(celda).join('')}</div>
      <div class="acciones"><button type="button" class="btn sec" id="hu-album">📖 Álbum de cosechas</button><span class="nota">Vuelve más tarde: el huerto sigue creciendo aunque no juegues.</span></div>`, 'ar-modal');
    $('hu-cerrar').addEventListener('click', () => J().ui.cerrar());
    $('hu-album').addEventListener('click', () => abrirAlbum('cosechas', 'ar_huerto'));
    document.querySelectorAll('#modal [data-hu]').forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.i), P2 = huerto(), M = J();
      if (b.dataset.hu === 'plantar') { P2[i] = { t: Date.now(), regada: false }; M.sfx('recolectar'); M.contar('ar_huerto_planta'); }
      else if (b.dataset.hu === 'regar' && P2[i]) { P2[i].regada = true; M.sfx('clic'); }
      else if (b.dataset.hu === 'cosechar' && P2[i] && listaEn(P2[i]) <= Date.now()) {
        P2[i] = null;
        const h = registrar('cosechas', sortear(ALBUMES.cosechas.items, 0.1));
        const txt = M.darPremio(M.paquete(2, 2, true), 10);
        M.contar('ar_huerto'); M.sfx('logro');
        M.toast(`🧺 Cosechaste: ${h.item.e} ${h.item.nombre}${h.nuevo ? ' (¡nuevo en tu álbum!)' : ''}. Ganaste ${txt}.`);
        const S = M.S(); S.arRec = { ...(S.arRec || {}), ar_huerto: ((S.arRec || {}).ar_huerto || 0) + 1 };
        S.arJugados = Array.from(new Set([...(S.arJugados || []), 'ar_huerto']));
      }
      M.guardar(true); abrirHuerto();
    }));
  }

  // ===================================================================
  // Objetos del mundo que representan cada minijuego (en vez de un letrero).
  // Se dibujan en un lienzo de 64×60 (la base del objeto toca el borde de abajo, al centro).
  // ===================================================================
  const O = '#1d2b25';
  const P = {
    sombra(c, w = 24) { c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(32, 55, w, 5, 0, 0, 7); c.fill(); },
    rr(c, x, y, w, h, f, r = 3) { c.fillStyle = f; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); c.fill(); c.stroke(); },
    el(c, x, y, rx, ry, f) { c.fillStyle = f; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); c.stroke(); },
    em(c, e, x, y, s = 22) { c.font = `${s}px ${FUENTE}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(e, x, y); },
    tablas(c, y = 40, w = 50) { const x = 32 - w / 2; P.rr(c, x, y, w, 14, '#b07a42', 2); c.fillStyle = '#7a4f26'; for (let i = x + 9; i < x + w - 2; i += 9) c.fillRect(i, y + 1, 2, 12); },
    rieles(c) { c.fillStyle = '#6b4a2a'; for (let x = 6; x < 60; x += 8) c.fillRect(x, 44, 4, 12); c.fillStyle = '#9aa3ad'; c.fillRect(2, 46, 60, 3); c.fillRect(2, 52, 60, 3); },
    monticulo(c, f, f2) { P.el(c, 32, 50, 27, 9, f); c.fillStyle = f2; c.beginPath(); c.ellipse(26, 47, 10, 3, 0, 0, 7); c.fill(); },
    poste(c, x = 32, y = 26, h = 30) { P.rr(c, x - 3, y, 6, h, '#8a5a2c', 1); },
    pilar(c, x = 32, w = 18, h = 40, f = '#8e8aa8') { P.rr(c, x - w / 2, 56 - h, w, h, f, 2); P.rr(c, x - w / 2 - 3, 56 - h - 4, w + 6, 6, f, 2); },
    puesto(c, a, b) { P.rr(c, 8, 34, 48, 22, '#a8743e', 2); for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? b : a; c.fillRect(6 + i * 9, 18, 9, 10); } c.strokeStyle = O; c.lineWidth = 2; c.strokeRect(6, 18, 54, 10); P.poste(c, 9, 26, 10); P.poste(c, 55, 26, 10); },
  };
  const PROPS = {
    // ----- entretención -----
    ar_luciernagas(c) { P.sombra(c, 14); P.rr(c, 20, 22, 24, 32, 'rgba(200,240,255,.55)', 6); P.rr(c, 22, 16, 20, 7, '#8a5a2c', 2); c.fillStyle = '#fff27a'; [[27, 34], [36, 30], [31, 44], [38, 46]].forEach(([x, y]) => { c.globalAlpha = 0.35; c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); c.globalAlpha = 1; c.beginPath(); c.arc(x, y, 2, 0, 7); c.fill(); }); },
    ar_tala(c) { P.sombra(c); P.el(c, 32, 48, 18, 7, '#c9925a'); P.rr(c, 14, 40, 36, 9, '#8a5a2c', 0); P.el(c, 32, 40, 18, 7, '#e8c088'); c.strokeStyle = '#a8743e'; c.beginPath(); c.ellipse(32, 40, 9, 3, 0, 0, 7); c.stroke(); P.em(c, '🪓', 38, 28, 24); },
    ar_duende(c) { P.sombra(c, 26); P.el(c, 20, 42, 14, 12, '#3f8a45'); P.el(c, 44, 42, 14, 12, '#3f8a45'); P.el(c, 32, 36, 15, 14, '#57a85c'); P.em(c, '🧝', 46, 28, 16); P.em(c, '🍄', 16, 48, 14); },
    ar_tormenta(c) { P.monticulo(c, '#e2b36a', '#f3d49a'); P.em(c, '🌪️', 32, 28, 30); },
    ar_jeroglificos(c) { P.sombra(c, 18); P.rr(c, 18, 10, 28, 46, '#c9a46a', 8); c.fillStyle = '#6b4a22'; c.font = `9px ${FUENTE}`; P.em(c, '🪲', 32, 22, 11); P.em(c, '👁️', 32, 34, 11); P.em(c, '🐍', 32, 46, 11); },
    ar_duna(c) { P.monticulo(c, '#e9c27a', '#f6dca4'); P.em(c, '💰', 24, 42, 16); P.em(c, '⛏️', 40, 34, 22); },
    ar_vagoneta(c) { P.rieles(c); P.rr(c, 14, 28, 36, 18, '#6b6f78', 3); c.fillStyle = '#4a4d54'; c.fillRect(16, 31, 32, 3); P.el(c, 21, 47, 4, 4, '#2a2a2a'); P.el(c, 43, 47, 4, 4, '#2a2a2a'); P.em(c, '💎', 26, 26, 12); P.em(c, '🪨', 37, 26, 12); },
    ar_linterna(c) { c.fillStyle = '#3a3127'; c.strokeStyle = O; c.lineWidth = 2; c.beginPath(); c.moveTo(8, 56); c.lineTo(8, 30); c.quadraticCurveTo(32, 2, 56, 30); c.lineTo(56, 56); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#0b0806'; c.beginPath(); c.moveTo(16, 56); c.lineTo(16, 34); c.quadraticCurveTo(32, 14, 48, 34); c.lineTo(48, 56); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,240,150,.35)'; c.beginPath(); c.moveTo(30, 44); c.lineTo(48, 36); c.lineTo(48, 54); c.closePath(); c.fill(); P.em(c, '🔦', 26, 46, 16); },
    ar_derrumbe(c) { P.sombra(c, 26); P.el(c, 20, 46, 13, 9, '#7a6a58'); P.el(c, 43, 47, 12, 8, '#8a7a66'); P.el(c, 31, 36, 12, 9, '#9a8a74'); P.em(c, '⛑️', 46, 30, 16); },
    ar_trineo_bajada(c) { P.monticulo(c, '#eef8ff', '#ffffff'); P.em(c, '🛷', 32, 38, 28); },
    ar_pesca_hielo(c) { P.el(c, 22, 48, 18, 7, '#e6f6ff'); P.el(c, 22, 48, 11, 4, '#1f5f86'); P.tablas(c, 42, 30); c.translate(14, 0); P.poste(c, 32, 46, 10); c.translate(-14, 0); P.em(c, '🎣', 40, 30, 24); },
    ar_pinguinos(c) { P.sombra(c, 26); P.rr(c, 8, 38, 16, 16, '#bfe6ff', 2); P.rr(c, 40, 38, 16, 16, '#bfe6ff', 2); P.em(c, '🛖', 48, 26, 20); P.em(c, '🐧', 24, 30, 22); },
    ar_huerto(c) { P.rr(c, 6, 40, 52, 16, '#6b4220', 3); c.fillStyle = '#4a2d14'; [12, 26, 40].forEach((x) => c.fillRect(x, 44, 10, 3)); P.em(c, '🌱', 17, 36, 14); P.em(c, '🥕', 32, 36, 14); P.em(c, '🌽', 47, 34, 16); },
    ar_diana(c) { P.sombra(c, 16); P.poste(c, 26, 34, 22); P.poste(c, 38, 34, 22); [[16, '#ffffff'], [12.5, '#e8322f'], [9, '#ffffff'], [5.5, '#e8322f'], [2.5, '#ffd23a']].forEach(([r, f]) => P.el(c, 32, 26, r, r, f)); P.em(c, '🏹', 50, 46, 14); },
    ar_mascotas(c) { P.sombra(c, 26); P.poste(c, 10, 18, 38); P.poste(c, 54, 18, 38); for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#fff' : '#1d2b25'; c.fillRect(13 + i * 6.3, 16 + j * 6, 6.3, 6); } c.strokeStyle = O; c.lineWidth = 2; c.strokeRect(13, 16, 38, 12); P.em(c, '🐶', 32, 44, 18); },
    ar_trueno(c) { P.sombra(c, 16); P.pilar(c, 32, 18, 36, '#6b6488'); P.em(c, '⚡', 32, 12, 22); },
    // ----- minijuegos con preguntas -----
    puente(c) { P.el(c, 32, 48, 28, 8, '#2a8fc4'); [16, 28, 40].forEach((x) => P.rr(c, x, 36, 10, 16, '#a8743e', 4)); },
    frutos(c) { P.sombra(c, 18); P.em(c, '⚖️', 32, 32, 34); P.em(c, '🍎', 18, 48, 12); P.em(c, '🍐', 46, 48, 12); },
    caravana(c) { P.monticulo(c, '#e2b36a', '#f3d49a'); P.em(c, '🐫', 28, 32, 28); P.em(c, '⚖️', 48, 40, 14); },
    oasis(c) { P.el(c, 32, 48, 26, 8, '#3fa7d6'); P.em(c, '🌴', 22, 26, 30); P.em(c, '💧', 46, 44, 12); },
    gemas(c) { P.sombra(c); P.rr(c, 12, 38, 40, 16, '#5a5f6a', 3); P.em(c, '💎', 32, 28, 26); },
    rayo(c) { P.sombra(c, 18); P.pilar(c, 22, 10, 26, '#8e8aa8'); P.em(c, '🔦', 22, 22, 14); c.strokeStyle = '#ffe66b'; c.lineWidth = 2; c.beginPath(); c.moveTo(28, 22); c.lineTo(48, 22); c.lineTo(48, 40); c.stroke(); P.rr(c, 42, 38, 12, 14, '#cfe8f5', 2); },
    carga(c) { P.sombra(c, 26); P.rr(c, 8, 36, 20, 20, '#c98f52', 2); P.rr(c, 30, 40, 16, 16, '#b97f45', 2); P.rr(c, 14, 20, 16, 16, '#d9a066', 2); P.em(c, '🛒', 50, 42, 18); },
    trineo(c) { P.monticulo(c, '#eef8ff', '#ffffff'); P.em(c, '🛷', 28, 40, 22); P.em(c, '🎲', 46, 28, 16); },
    meteo(c) { P.sombra(c, 14); P.poste(c, 32, 14, 42); P.rr(c, 22, 30, 20, 12, '#eef3f8', 2); P.em(c, '🌡️', 32, 36, 12); P.em(c, '🌬️', 44, 12, 14); },
    mercado(c) { P.sombra(c, 28); P.puesto(c, '#e8322f', '#ffffff'); P.em(c, '🍎', 20, 40, 12); P.em(c, '🧀', 32, 40, 12); P.em(c, '🥖', 44, 40, 12); },
    cerradura(c) { P.sombra(c); P.rr(c, 12, 26, 40, 30, '#a8743e', 4); P.rr(c, 12, 26, 40, 9, '#c9925a', 4); P.em(c, '🔐', 32, 44, 18); },
  };
  // dibuja el objeto del minijuego en un contexto de 64×60; devuelve false si no hay dibujo propio
  function dibujarProp(ctx, id) { const f = PROPS[id]; if (!f) return false; ctx.save(); f(ctx); ctx.restore(); return true; }

  window.Arcade = {
    dibujarProp,
    de: (zona) => Object.entries(DEF).filter(([, d]) => d.zona === zona).map(([id, d]) => ({ id, ico: d.ico, nombre: d.nombre })),
    abrir, abrirAlbum, botonesAlbum, rec, jugados, albumTengo, prop: (id) => PROPS[id] || null,
    _comp: () => C, _recibirComp: (m) => recibirComp(m),
    total: () => Object.keys(DEF).length,
    albumes: ALBUMES, _def: DEF, _partida: () => G,
  };
})();
