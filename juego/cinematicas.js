// Math World — Cinemáticas: aparición de los jefes, movimiento especial de los personajes, entradas del Altar de los Dioses
// (con los cambios de fase de Hades) y la derrota de cada jefe. Se dibujan en un canvas y con HTML sobre el juego;
// se saltan con un toque o Enter. juego.js las llama con window.Cine.
(() => {
'use strict';
// ===================== Motor de dibujo de las cinemáticas (canvas) =====================
const IMG = {};
// 'ruta#fila' recorta el primer cuadro de esa fila de una hoja LPC (64 × 64); sin '#' es una imagen suelta
const img = (src) => {
  if (IMG[src]) return IMG[src];
  const [ruta, fila] = src.split('#'), i = new Image();
  if (fila === undefined) { i.src = ruta; return (IMG[src] = i); }
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; c.complete = false;
  i.onload = () => { const o = c.getContext('2d'); o.imageSmoothingEnabled = false; o.drawImage(i, 0, Number(fila) * 64, 64, 64, 0, 0, 64, 64); c.complete = true; };
  i.onerror = () => { c.complete = true; };
  i.src = ruta;
  return (IMG[src] = c);
};
const azar = (a, b) => a + Math.random() * (b - a);
const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const rango = (t, a, b) => clamp01((t - a) / (b - a));
// Partículas
function part(o) { return Object.assign({ x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0, vida: 1, t: 0, r: 3, c: '#fff', tipo: 'circ', rot: 0, vr: 0, a: 1, brillo: false }, o); }
function pasar(ps, dt) { for (const p of ps) { p.t += dt; p.vx += p.ax * dt; p.vy += p.ay * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; } return ps.filter((p) => p.t < p.vida); }
function pintar(ctx, ps) {
  for (const p of ps) {
    const al = p.a * (1 - p.t / p.vida);
    ctx.save(); ctx.globalAlpha = Math.max(0, al); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    if (p.brillo) ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = p.c; ctx.strokeStyle = p.c;
    switch (p.tipo) {
      case 'circ': { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r); g.addColorStop(0, p.c2 || '#fff'); g.addColorStop(0.35, p.c); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 7); ctx.fill(); break; }
      case 'punto': ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 7); ctx.fill(); break;
      case 'cuad': ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2); break;
      case 'hoja': ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.45, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-p.r, 0); ctx.lineTo(p.r, 0); ctx.stroke(); break;
      case 'raya': { const v = Math.hypot(p.vx, p.vy) || 1; ctx.rotate(Math.atan2(p.vy, p.vx) - p.rot); ctx.lineCap = 'round'; ctx.lineWidth = p.r; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-v * (p.largo || 0.05), 0); ctx.stroke(); break; }
      case 'esquirla': ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.lineTo(p.r * 0.6, p.r * 0.7); ctx.lineTo(-p.r * 0.5, p.r * 0.4); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1; ctx.stroke(); break;
      case 'texto': ctx.font = `700 ${p.r}px "Pixelify Sans", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = p.c; ctx.shadowBlur = p.r * 0.6; ctx.fillText(p.txt, 0, 0); break;
      case 'hueso': ctx.lineCap = 'round'; ctx.lineWidth = p.r * 0.5; ctx.strokeStyle = '#efe6d2'; ctx.beginPath(); ctx.moveTo(-p.r, 0); ctx.lineTo(p.r, 0); ctx.stroke(); ctx.fillStyle = '#efe6d2'; for (const s of [-1, 1]) for (const k of [-1, 1]) { ctx.beginPath(); ctx.arc(s * p.r, k * p.r * 0.28, p.r * 0.3, 0, 7); ctx.fill(); } break;
      case 'flecha': { ctx.rotate(Math.atan2(p.vy, p.vx) - p.rot); ctx.lineWidth = Math.max(2, p.r * 0.18); ctx.strokeStyle = '#d9c08a'; ctx.beginPath(); ctx.moveTo(-p.r * 2, 0); ctx.lineTo(p.r * 0.6, 0); ctx.stroke(); ctx.fillStyle = '#e8f2ff'; ctx.beginPath(); ctx.moveTo(p.r, 0); ctx.lineTo(p.r * 0.4, -p.r * 0.3); ctx.lineTo(p.r * 0.4, p.r * 0.3); ctx.fill(); ctx.fillStyle = p.c; ctx.beginPath(); ctx.moveTo(-p.r * 2, 0); ctx.lineTo(-p.r * 1.5, -p.r * 0.35); ctx.lineTo(-p.r * 1.2, 0); ctx.lineTo(-p.r * 1.5, p.r * 0.35); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = p.c; ctx.globalAlpha *= 0.5; ctx.lineWidth = p.r * 0.5; ctx.beginPath(); ctx.moveTo(-p.r * 2, 0); ctx.lineTo(-p.r * 6, 0); ctx.stroke(); break; }
      case 'petalo': ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.quadraticCurveTo(p.r, 0, 0, p.r); ctx.quadraticCurveTo(-p.r, 0, 0, -p.r); ctx.fill(); break;
      case 'aro': ctx.lineWidth = p.ancho || 4; ctx.beginPath(); ctx.arc(0, 0, p.r * (0.2 + (p.t / p.vida) * (p.crece || 1)), 0, 7); ctx.stroke(); break;
    }
    ctx.restore();
  }
}
// Sprite del jefe/héroe dibujado al canvas: oscurecido (silueta) y/o con resplandor
function sprite(ctx, src, x, y, tam, { sombra = 0, brillo = 0, color = '#fff', alfa = 1, voltear = false, clipY = null, rot = 0 } = {}) {
  const im = img(src); if (!im.complete) return;
  const off = sprite.off || (sprite.off = document.createElement('canvas'));
  off.width = 64; off.height = 64; const o = off.getContext('2d'); o.imageSmoothingEnabled = false; o.clearRect(0, 0, 64, 64); o.drawImage(im, 0, 0);
  if (sombra > 0) { o.globalCompositeOperation = 'source-atop'; o.fillStyle = `rgba(0,0,0,${sombra})`; o.fillRect(0, 0, 64, 64); }
  if (brillo > 0) { o.globalCompositeOperation = 'source-atop'; o.globalAlpha = brillo; o.fillStyle = color; o.fillRect(0, 0, 64, 64); o.globalAlpha = 1; }
  o.globalCompositeOperation = 'source-over';
  tam *= 1.25;
  ctx.save(); ctx.globalAlpha = alfa; ctx.imageSmoothingEnabled = false;
  if (clipY !== null) { ctx.beginPath(); ctx.rect(x - tam, -9999, tam * 2, clipY + 9999); ctx.clip(); }
  ctx.translate(x, y); if (rot) ctx.rotate(rot); if (voltear) ctx.scale(-1, 1);
  ctx.drawImage(off, -tam / 2, -tam / 2, tam, tam); ctx.restore();
}
function ojos(ctx, x, y, s, color, a) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
  for (const dx of [-1, 1]) { const g = ctx.createRadialGradient(x + dx * s, y, 0, x + dx * s, y, s * 1.6); g.addColorStop(0, '#fff'); g.addColorStop(0.3, color); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + dx * s, y, s * 1.6, 0, 7); ctx.fill(); }
  ctx.restore();
}
function rayo(ctx, x1, y1, x2, y2, color, ancho, desv) {
  const pts = [[x1, y1]]; const n = 9;
  for (let i = 1; i < n; i++) { const k = i / n; pts.push([x1 + (x2 - x1) * k + azar(-desv, desv), y1 + (y2 - y1) * k + azar(-desv * 0.3, desv * 0.3)]); }
  pts.push([x2, y2]);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const [w, c, a] of [[ancho * 4, color, 0.25], [ancho * 1.8, color, 0.6], [ancho * 0.7, '#fff', 1]]) {
    ctx.globalAlpha = a; ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  }
  ctx.restore();
}
function brilloRadial(ctx, x, y, r, color, a) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); }

// ===================== Entradas de los jefes según su ambiente =====================
// t: segundos desde el inicio (sin cámara lenta). Cada función dibuja el fondo, el jefe que aparece y sus partículas.
// La fase ambiental dura de 0 a 1,9 s; después la pantalla pasa al VS.
const AMB = {
  u1: { // Bosque: los árboles se sacuden, caen hojas y el troll se levanta entre los arbustos
    fondo: ['#0f2a14', '#2b5a2a'], hojas: ['#5fae3c', '#8fd14a', '#c9a23a', '#3e8a2e'],
    dibujar(ctx, W, H, t, st, j) {
      const tiembla = t > 0.55 && t < 1.4 ? Math.sin(t * 60) * W * 0.004 * (1 - rango(t, 0.55, 1.4)) : 0;
      for (const [x0, h, s] of [[0.04, 0.9, 1], [0.16, 0.75, 0.8], [0.84, 0.82, 1], [0.95, 0.7, 0.8]]) arbol(ctx, W * x0 + tiembla * s * 3, H, H * h, '#123d1c');
      if (t > 0.35 && st.n++ % 2 === 0) st.ps.push(part({ x: azar(0, W), y: -10, vx: azar(-20, 20), vy: azar(40, 90), ax: Math.sin(t) * 20, vida: 2.5, r: W * azar(0.006, 0.012), tipo: 'hoja', c: this.hojas[st.n % 4], vr: azar(-4, 4) }));
      const sube = ease(rango(t, 0.6, 1.35));
      const y = H * (1.05 - 0.5 * sube) + tiembla;
      sprite(ctx, j.frente, W / 2 + tiembla, y, H * 0.75, { sombra: 0.85 - 0.6 * rango(t, 1.2, 1.8) });
      ojos(ctx, W / 2, y - H * 0.1, W * 0.012, j.color, rango(t, 1.0, 1.25));
      for (const dx of [-0.16, 0.16]) arbusto(ctx, W / 2 + W * dx * (1 + sube * 0.5), H * 0.98, W * 0.13, '#1f5a24');
      if (t > 0.6 && t < 0.9) for (let i = 0; i < 3; i++) st.ps.push(part({ x: W / 2 + azar(-W * 0.15, W * 0.15), y: H * 0.9, vx: azar(-120, 120), vy: azar(-260, -120), ay: 400, vida: 1.2, r: W * 0.01, tipo: 'hoja', c: this.hojas[i], vr: azar(-6, 6) }));
    },
  },
  u2: { // Dunas: tormenta de arena al atardecer y el lagarto emerge de la duna
    fondo: ['#e88a3a', '#f7d28a'],
    dibujar(ctx, W, H, t, st, j) {
      sol(ctx, W * 0.72, H * 0.34, H * 0.18, '#ffe3a0');
      const linea = H * 0.72;
      duna(ctx, W, H, H * 0.62, '#d79a52', 0.8, t);
      const sube = ease(rango(t, 0.55, 1.35));
      sprite(ctx, j.frente, W / 2, linea + H * 0.42 - sube * H * 0.5, H * 0.75, { sombra: 0.8 - 0.6 * rango(t, 1.1, 1.7), clipY: linea + H * 0.02 });
      ojos(ctx, W / 2, linea + H * 0.42 - sube * H * 0.5 - H * 0.1, W * 0.012, '#ff6a2a', rango(t, 0.95, 1.2));
      duna(ctx, W, H, linea, '#e0a85e', 1.4, t);
      for (let i = 0; i < 4; i++) st.ps.push(part({ x: -10, y: azar(0, H), vx: azar(500, 900), vy: azar(-20, 40), vida: 1.6, r: azar(1, 2.5), largo: 0.03, tipo: 'raya', c: i % 2 ? '#f3cf8c' : '#c48a46', a: 0.8 }));
      if (t > 0.55 && t < 1.2) for (let i = 0; i < 4; i++) st.ps.push(part({ x: W / 2 + azar(-W * 0.12, W * 0.12), y: linea, vx: azar(-200, 200), vy: azar(-300, -80), ay: 500, vida: 1, r: azar(2, 5), tipo: 'cuad', c: '#e8b46a' }));
    },
  },
  u3: { // Mina: oscuridad, vigas de madera, derrumbe y el minotauro embiste desde el fondo del túnel
    fondo: ['#07060a', '#1d1622'],
    dibujar(ctx, W, H, t, st, j) {
      tunel(ctx, W, H);
      const viene = ease(rango(t, 0.45, 1.45));
      const sh = t > 1.3 && t < 1.7 ? Math.sin(t * 70) * W * 0.006 : 0;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(W / 2, -H * 0.1, 0, W / 2, H * 0.4, H * 0.9); g.addColorStop(0, 'rgba(255,200,110,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(W * 0.45, 0); ctx.lineTo(W * 0.55, 0); ctx.lineTo(W * 0.78, H); ctx.lineTo(W * 0.22, H); ctx.fill(); ctx.restore();
      sprite(ctx, j.frente, W / 2 + sh, H * (0.42 + 0.14 * viene), H * (0.18 + 0.62 * viene), { sombra: 0.9 - 0.65 * rango(t, 1.2, 1.8) });
      ojos(ctx, W / 2 + sh, H * (0.42 + 0.14 * viene) - H * 0.11 * (0.2 + viene), W * (0.004 + 0.009 * viene), '#ff3020', rango(t, 0.3, 0.6));
      if (t > 0.5 && st.n++ % 3 === 0) st.ps.push(part({ x: azar(W * 0.1, W * 0.9), y: -10, vy: azar(100, 200), ay: 900, vida: 1.4, r: W * azar(0.006, 0.016), tipo: 'cuad', c: ['#5a4a42', '#7a6a5a', '#3e3434'][st.n % 3], vr: azar(-3, 3) }));
      if (t > 1.3 && t < 1.5) for (let i = 0; i < 6; i++) st.ps.push(part({ x: W / 2 + azar(-W * 0.2, W * 0.2), y: H * 0.95, vx: azar(-260, 260), vy: azar(-120, -20), vida: 1.2, r: W * azar(0.03, 0.06), tipo: 'circ', c: 'rgba(140,120,110,.6)', c2: 'rgba(180,160,150,.7)', a: 0.7 }));
    },
  },
  u4: { // Glaciar: ventisca, un bloque de hielo se agrieta y el yeti lo rompe
    fondo: ['#7fb2d6', '#e6f4ff'],
    dibujar(ctx, W, H, t, st, j) {
      montanas(ctx, W, H, '#b9d6ea', '#f4fbff');
      const rompe = t > 1.2;
      if (!rompe) {
        sprite(ctx, j.frente, W / 2, H * 0.55, H * 0.75, { sombra: 0.55, brillo: 0.35, color: '#bfe8ff' });
        ctx.save(); ctx.globalAlpha = 0.7; const g = ctx.createLinearGradient(0, H * 0.15, 0, H * 0.95); g.addColorStop(0, '#d8f3ff'); g.addColorStop(1, '#7cc4f0'); ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(W * 0.38, H * 0.95); ctx.lineTo(W * 0.35, H * 0.3); ctx.lineTo(W * 0.45, H * 0.14); ctx.lineTo(W * 0.62, H * 0.2); ctx.lineTo(W * 0.66, H * 0.95); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        const k = rango(t, 0.6, 1.2); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.beginPath();
        for (const [ax, ay, bx, by] of [[0.5, 0.5, 0.42, 0.3], [0.5, 0.5, 0.6, 0.32], [0.5, 0.5, 0.44, 0.8], [0.5, 0.5, 0.63, 0.7], [0.42, 0.3, 0.37, 0.4]]) { ctx.moveTo(W * ax, H * ay); ctx.lineTo(W * (ax + (bx - ax) * k), H * (ay + (by - ay) * k)); }
        ctx.stroke(); ctx.restore();
      } else {
        if (!st.roto) { st.roto = true; for (let i = 0; i < 40; i++) { const a = azar(0, 6.28), v = azar(250, 700); st.ps.push(part({ x: W / 2 + azar(-W * 0.1, W * 0.1), y: H * azar(0.25, 0.85), vx: Math.cos(a) * v, vy: Math.sin(a) * v - 150, ay: 900, vida: 1.2, r: W * azar(0.01, 0.03), tipo: 'esquirla', c: 'rgba(200,238,255,.9)', vr: azar(-10, 10) })); } }
        const sh = t < 1.5 ? Math.sin(t * 80) * W * 0.006 : 0;
        sprite(ctx, j.frente, W / 2 + sh, H * 0.55, H * 0.78, { sombra: 0.4 * (1 - rango(t, 1.2, 1.7)) });
        ojos(ctx, W / 2, H * 0.44, W * 0.012, '#7fe0ff', 1 - rango(t, 1.5, 1.9));
      }
      for (let i = 0; i < 5; i++) st.ps.push(part({ x: azar(-W * 0.2, W), y: -10, vx: azar(250, 450), vy: azar(220, 380), vida: 1.6, r: azar(1.5, 3.5), tipo: 'punto', c: '#fff', a: 0.9 }));
    },
  },
  rey: { // Bosque profundo: noche, luciérnagas y raíces que brotan del suelo; el jabalí sale de entre ellas
    fondo: ['#050d0a', '#11301e'],
    dibujar(ctx, W, H, t, st, j) {
      for (const [x0, h] of [[0.08, 1], [0.22, 0.85], [0.78, 0.9], [0.92, 1]]) arbol(ctx, W * x0, H, H * h, '#07180e');
      if (st.n++ % 3 === 0) st.ps.push(part({ x: azar(0, W), y: azar(H * 0.2, H), vx: azar(-20, 20), vy: azar(-30, 10), vida: 2.2, r: W * 0.012, tipo: 'circ', c: '#d8ff6a', c2: '#ffffe0', brillo: true }));
      const k = rango(t, 0.3, 1.2);
      ctx.save(); ctx.strokeStyle = '#4a2e1a'; ctx.lineCap = 'round';
      for (let i = 0; i < 7; i++) {
        const x0 = W * (0.2 + i * 0.1), dir = i < 3.5 ? 1 : -1; ctx.lineWidth = W * (0.012 + (i % 3) * 0.004);
        ctx.beginPath(); ctx.moveTo(x0, H); ctx.quadraticCurveTo(x0 + dir * W * 0.05, H * (1 - 0.4 * k), x0 + dir * W * 0.12 * k, H * (1 - 0.65 * k)); ctx.stroke();
      }
      ctx.restore();
      const sube = ease(rango(t, 0.75, 1.45));
      sprite(ctx, j.frente, W / 2, H * (1.0 - 0.45 * sube), H * 0.78, { sombra: 0.85 - 0.6 * rango(t, 1.3, 1.85) });
      ojos(ctx, W / 2, H * (1.0 - 0.45 * sube) - H * 0.11, W * 0.012, '#9aff4a', rango(t, 1.1, 1.3));
      if (t > 0.75 && t < 1.3 && st.n % 2 === 0) st.ps.push(part({ x: W / 2 + azar(-W * 0.15, W * 0.15), y: H, vx: azar(-80, 80), vy: azar(-200, -90), vida: 1.4, r: W * 0.01, tipo: 'circ', c: '#7aff6a', brillo: true }));
    },
  },
  faraon: { // Valle de la Esfinge: noche dorada, el sarcófago se abre, salen vendas y polvo de oro
    fondo: ['#0b0f2a', '#3a2a40'],
    dibujar(ctx, W, H, t, st, j) {
      ctx.fillStyle = '#1b1630'; ctx.beginPath(); ctx.moveTo(W * 0.02, H); ctx.lineTo(W * 0.2, H * 0.45); ctx.lineTo(W * 0.38, H); ctx.fill(); ctx.beginPath(); ctx.moveTo(W * 0.7, H); ctx.lineTo(W * 0.86, H * 0.52); ctx.lineTo(W * 1.02, H); ctx.fill();
      brilloRadial(ctx, W / 2, H * 0.55, H * 0.6, '#ffcf5a', 0.15 + 0.35 * rango(t, 0.6, 1.2));
      sprite(ctx, j.frente, W / 2, H * 0.56, H * 0.74, { sombra: 0.85 - 0.6 * rango(t, 1.15, 1.8) });
      ojos(ctx, W / 2, H * 0.45, W * 0.011, '#4aa8ff', rango(t, 0.9, 1.1));
      const abre = ease(rango(t, 0.45, 1.1));
      sarcofago(ctx, W / 2 - abre * W * 0.3, H * 0.55, W * 0.17, H * 0.82, 1 - rango(t, 1.1, 1.5));
      if (t > 0.6 && t < 1.4 && st.n++ % 2 === 0) st.ps.push(part({ x: W / 2 + azar(-W * 0.05, W * 0.05), y: H * azar(0.3, 0.8), vx: azar(-300, 300), vy: azar(-160, 60), vida: 1.3, r: W * 0.009, tipo: 'raya', largo: 0.09, c: '#eadfc4', vr: 0 }));
      if (st.n % 2 === 0) st.ps.push(part({ x: azar(0, W), y: H + 5, vy: azar(-120, -50), vx: azar(-20, 20), vida: 2, r: W * 0.006, tipo: 'circ', c: '#ffd27a', brillo: true }));
      if (t > 0.7 && t < 1.3 && st.n % 4 === 0) st.ps.push(part({ x: W / 2 + azar(-W * 0.25, W * 0.25), y: H * azar(0.25, 0.7), vy: -30, vida: 1.2, r: W * 0.035, tipo: 'texto', txt: ['☥', '☀', '◬', '⌘'][st.n % 4], c: '#ffd27a', brillo: true }));
    },
  },
  coloso: { // Profundidades: grietas de lava, brasas y el coloso emerge del magma
    fondo: ['#120302', '#3a0d05'],
    dibujar(ctx, W, H, t, st, j) {
      const k = rango(t, 0.2, 0.9);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#ff7a1a'; ctx.shadowColor = '#ff5a00'; ctx.shadowBlur = 14; ctx.lineWidth = 3;
      for (let i = 0; i < 9; i++) { const a = -Math.PI + (i / 8) * Math.PI; ctx.beginPath(); ctx.moveTo(W / 2, H * 0.86); let x = W / 2, y = H * 0.86; for (let s = 0; s < 4; s++) { x += Math.cos(a + Math.sin(i * 7 + s) * 0.5) * W * 0.06 * k; y += Math.abs(Math.sin(a)) * H * 0.02 * k + H * 0.01 * k; ctx.lineTo(x, y); } ctx.stroke(); }
      ctx.restore();
      ctx.save(); const lg = ctx.createRadialGradient(W / 2, H * 0.88, 0, W / 2, H * 0.88, W * 0.22); lg.addColorStop(0, '#fff1a0'); lg.addColorStop(0.4, '#ff8a1a'); lg.addColorStop(1, 'rgba(120,20,0,0)'); ctx.fillStyle = lg; ctx.globalAlpha = 0.3 + 0.7 * k; ctx.beginPath(); ctx.ellipse(W / 2, H * 0.88, W * 0.24, H * 0.1, 0, 0, 7); ctx.fill(); ctx.restore();
      const sube = ease(rango(t, 0.6, 1.4));
      sprite(ctx, j.frente, W / 2, H * (1.1 - 0.55 * sube), H * 0.78, { sombra: 0.5 - 0.5 * rango(t, 1.2, 1.8), brillo: 0.45 * (1 - rango(t, 1.1, 1.8)), color: '#ff6a00', clipY: H * 0.9 });
      ojos(ctx, W / 2, H * (1.1 - 0.55 * sube) - H * 0.11, W * 0.012, '#ffd020', rango(t, 0.9, 1.1));
      if (st.n++ % 1 === 0) st.ps.push(part({ x: azar(0, W), y: H + 5, vx: azar(-30, 30), vy: azar(-260, -100), vida: 1.6, r: W * azar(0.004, 0.009), tipo: 'circ', c: '#ff7a1a', c2: '#ffe08a', brillo: true }));
      if (t > 0.6 && t < 1.1) for (let i = 0; i < 3; i++) st.ps.push(part({ x: W / 2 + azar(-W * 0.12, W * 0.12), y: H * 0.86, vx: azar(-220, 220), vy: azar(-420, -200), ay: 900, vida: 1, r: W * azar(0.008, 0.016), tipo: 'circ', c: '#ff8a1a', c2: '#fff6b0', brillo: true }));
    },
  },
  dragon: { // Cima del glaciar: cielo nocturno con aurora, el dragón desciende y su aleteo levanta nieve
    fondo: ['#020616', '#0d2140'],
    dibujar(ctx, W, H, t, st, j) {
      if (!st.estrellas) st.estrellas = Array.from({ length: 70 }, () => [Math.random(), Math.random() * 0.7, Math.random()]);
      for (const [x, y, f] of st.estrellas) { ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * Math.abs(Math.sin(t * 3 + f * 10))})`; ctx.fillRect(x * W, y * H, 2, 2); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let b = 0; b < 3; b++) { const g = ctx.createLinearGradient(0, H * 0.05, 0, H * 0.6); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, b === 1 ? 'rgba(170,90,255,.35)' : 'rgba(80,255,180,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, H * 0.6); for (let x = 0; x <= W; x += W / 30) ctx.lineTo(x, H * (0.25 + b * 0.07) + Math.sin(x / W * 6 + t * 1.6 + b) * H * 0.08); ctx.lineTo(W, H * 0.6); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      montanas(ctx, W, H, '#16304f', '#dceeff');
      const baja = ease(rango(t, 0.35, 1.3));
      const aleteo = Math.sin(t * 18) * H * 0.015 * (1 - rango(t, 1.25, 1.5));
      sprite(ctx, j.frente, W / 2, -H * 0.3 + baja * H * 0.85 + aleteo, H * (0.5 + 0.3 * baja), { sombra: 0.8 - 0.6 * rango(t, 1.1, 1.8) });
      ojos(ctx, W / 2, -H * 0.3 + baja * H * 0.85 - H * 0.1 + aleteo, W * 0.011, '#7affd8', rango(t, 0.4, 0.7));
      if (t > 1.25 && !st.aterriza) { st.aterriza = true; for (let i = 0; i < 50; i++) { const s = Math.random() < 0.5 ? -1 : 1; st.ps.push(part({ x: W / 2 + s * azar(0, W * 0.1), y: H * azar(0.85, 0.98), vx: s * azar(200, 700), vy: azar(-200, -20), ay: 300, vida: 1.2, r: azar(2, 5), tipo: 'punto', c: '#fff' })); } }
      if (st.n++ % 2 === 0) st.ps.push(part({ x: azar(0, W), y: -10, vx: azar(-30, 30), vy: azar(50, 110), vida: 3, r: azar(1, 2.5), tipo: 'punto', c: '#fff', a: 0.8 }));
    },
  },
};
function arbol(ctx, x, H, h, color) { ctx.fillStyle = color; for (let k = 0; k < 4; k++) { const w = h * (0.34 - k * 0.06), y = H - h * (0.15 + k * 0.22); ctx.beginPath(); ctx.moveTo(x - w, y + h * 0.18); ctx.lineTo(x, y - h * 0.2); ctx.lineTo(x + w, y + h * 0.18); ctx.fill(); } ctx.fillRect(x - h * 0.03, H - h * 0.18, h * 0.06, h * 0.18); }
function arbusto(ctx, x, y, w, color) { ctx.fillStyle = color; for (const [dx, dy, r] of [[-0.5, 0, 0.45], [0, -0.25, 0.55], [0.5, 0, 0.45]]) { ctx.beginPath(); ctx.arc(x + dx * w, y + dy * w, r * w, 0, 7); ctx.fill(); } }
function sol(ctx, x, y, r, c) { brilloRadial(ctx, x, y, r * 2.4, c, 0.5); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, 7); ctx.fill(); }
function duna(ctx, W, H, y0, color, amp, t) { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += W / 40) ctx.lineTo(x, y0 + Math.sin(x / W * 5 * amp + 1) * H * 0.04); ctx.lineTo(W, H); ctx.fill(); }
function montanas(ctx, W, H, c, nieve) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, H); const pts = [[0, 0.75], [0.15, 0.48], [0.3, 0.7], [0.45, 0.55], [0.62, 0.74], [0.8, 0.45], [1, 0.7]]; pts.forEach(([x, y]) => ctx.lineTo(W * x, H * y)); ctx.lineTo(W, H); ctx.fill(); ctx.fillStyle = nieve; for (const [x, y] of [[0.15, 0.48], [0.45, 0.55], [0.8, 0.45]]) { ctx.beginPath(); ctx.moveTo(W * (x - 0.04), H * (y + 0.06)); ctx.lineTo(W * x, H * y); ctx.lineTo(W * (x + 0.04), H * (y + 0.06)); ctx.fill(); } }
function tunel(ctx, W, H) { ctx.fillStyle = '#3a2614'; for (const x of [0.12, 0.84]) ctx.fillRect(W * x, 0, W * 0.04, H); ctx.fillRect(W * 0.1, H * 0.06, W * 0.8, H * 0.05); ctx.strokeStyle = '#1e140a'; ctx.lineWidth = 3; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(W * 0.2 + i * W * 0.08, H); ctx.lineTo(W / 2, H * 0.4); ctx.stroke(); } }
function sarcofago(ctx, x, y, w, h, a) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y);
  ctx.fillStyle = '#c99a2a'; ctx.beginPath(); ctx.moveTo(-w * 0.5, -h * 0.42); ctx.quadraticCurveTo(0, -h * 0.62, w * 0.5, -h * 0.42); ctx.lineTo(w * 0.42, h * 0.48); ctx.lineTo(-w * 0.42, h * 0.48); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2a4fb8'; for (let i = 0; i < 5; i++) ctx.fillRect(-w * 0.42, -h * 0.1 + i * h * 0.1, w * 0.84, h * 0.04);
  ctx.fillStyle = '#e8c86a'; ctx.beginPath(); ctx.ellipse(0, -h * 0.3, w * 0.22, h * 0.13, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#1a1a2a'; ctx.fillRect(-w * 0.12, -h * 0.32, w * 0.08, h * 0.02); ctx.fillRect(w * 0.04, -h * 0.32, w * 0.08, h * 0.02);
  ctx.restore();
}

// ===================== Habilidades especiales =====================
// t0: segundos desde que empieza el ataque (cae a los 0,44 de la cinemática). Impacto a los ~0,7 s.
// (x, y) = centro del jefe. Cada personaje tiene su propio efecto.
const HAB = {
  fenix(ctx, W, H, t, st, x, y) { // un fénix de fuego cruza la pantalla y explota sobre el jefe
    const k = ease(rango(t, 0, 0.6)), bx = W * 0.05 + (x - W * 0.05) * k, by = H * 0.75 - Math.sin(k * Math.PI) * H * 0.45 + (y - H * 0.75) * k;
    if (t < 0.65) {
      for (let i = 0; i < 6; i++) st.ps.push(part({ x: bx + azar(-8, 8), y: by + azar(-8, 8), vx: azar(-80, 20), vy: azar(-60, 60), vida: 0.6, r: W * azar(0.015, 0.035), tipo: 'circ', c: '#ff6a1a', c2: '#fff2a0', brillo: true }));
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) st.ps.push(part({ x: bx - i * W * 0.02, y: by + s * (W * 0.03 + i * W * 0.012) * Math.sin(t * 30 + i), vx: -120, vy: s * azar(40, 120), vida: 0.45, r: W * 0.02, tipo: 'circ', c: '#ff3a00', c2: '#ffd060', brillo: true }));
      brilloRadial(ctx, bx, by, W * 0.12, '#ffb040', 0.7);
    }
    if (t > 0.6 && !st.boom) { st.boom = true; for (let i = 0; i < 70; i++) { const a = azar(0, 6.28), v = azar(150, 650); st.ps.push(part({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 100, ay: -60, vida: azar(0.6, 1.1), r: W * azar(0.015, 0.04), tipo: 'circ', c: '#ff5a00', c2: '#fff2a0', brillo: true })); } for (let i = 0; i < 12; i++) st.ps.push(part({ x: x + azar(-W * 0.08, W * 0.08), y: y + H * 0.15, vy: -azar(200, 400), vida: 0.9, r: W * 0.05, tipo: 'circ', c: '#ff8a1a', c2: '#fff', brillo: true })); }
  },
  trueno(ctx, W, H, t, st, x, y) { // nubes de tormenta y rayos que caen sobre el jefe
    const nube = rango(t, 0, 0.25);
    ctx.save(); ctx.globalAlpha = 0.85 * nube; ctx.fillStyle = '#1c1d33'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(W * (0.35 + i * 0.08), H * 0.08 + Math.sin(i) * H * 0.03, H * 0.13, 0, 7); ctx.fill(); } ctx.restore();
    if (t > 0.2 && t < 0.95 && st.n++ % 3 === 0) { const xx = x + azar(-W * 0.12, W * 0.12); st.rayos.push({ x: xx, vida: 0.12 }); for (let i = 0; i < 10; i++) st.ps.push(part({ x: xx, y: y + H * 0.15, vx: azar(-300, 300), vy: azar(-300, -50), ay: 800, vida: 0.5, r: 2.5, tipo: 'raya', largo: 0.04, c: '#fff6a0', brillo: true })); }
    st.rayos = (st.rayos || []).filter((r) => (r.vida -= st.dt) > 0);
    for (const r of st.rayos) rayo(ctx, r.x + azar(-20, 20), H * 0.1, r.x, y + H * 0.15, '#ffe65a', W * 0.006, W * 0.04);
    if (t > 0.62 && t < 0.75) rayo(ctx, x, 0, x, y + H * 0.15, '#fff8c0', W * 0.016, W * 0.03);
    if (st.rayos.length) { ctx.save(); ctx.globalAlpha = 0.15; ctx.fillStyle = '#fffbd0'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  },
  sombra(ctx, W, H, t, st, x, y) { // la oscuridad lo envuelve y un tajo creciente de sombra lo atraviesa
    ctx.save(); ctx.globalAlpha = 0.6 * rango(t, 0, 0.3) * (1 - rango(t, 0.85, 1.1)); ctx.fillStyle = '#0a0414'; ctx.fillRect(0, 0, W, H); ctx.restore();
    if (t < 0.6) for (let i = 0; i < 4; i++) { const a = azar(0, 6.28), d = W * azar(0.2, 0.35); st.ps.push(part({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: -Math.cos(a) * d * 2.2, vy: -Math.sin(a) * d * 2.2, vida: 0.45, r: W * 0.03, tipo: 'circ', c: '#5a1a9a', c2: '#b07aff', a: 0.8 })); }
    const k = rango(t, 0.5, 0.7);
    if (k > 0 && t < 1.0) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(-0.6); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - rango(t, 0.75, 1.0);
      const r = W * 0.28; ctx.lineCap = 'round';
      for (const [lw, c] of [[W * 0.05, 'rgba(120,40,220,.5)'], [W * 0.022, '#b07aff'], [W * 0.008, '#fff']]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(-r * 0.3, 0, r, -1.1, -1.1 + 2.2 * k); ctx.stroke(); }
      ctx.restore();
    }
    if (t > 0.68 && !st.boom) { st.boom = true; for (let i = 0; i < 40; i++) { const a = azar(0, 6.28), v = azar(100, 500); st.ps.push(part({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 0.9, r: W * azar(0.02, 0.05), tipo: 'circ', c: '#3a0a6a', c2: '#c090ff', a: 0.9 })); } }
  },
  bosque(ctx, W, H, t, st, x, y) { // brotan enredaderas que atrapan al jefe y estalla una tormenta de hojas y flores
    const k = ease(rango(t, 0, 0.55));
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const x0 = x + (i - 2.5) * W * 0.06, s = i % 2 ? 1 : -1;
      ctx.strokeStyle = i % 2 ? '#3f9a3a' : '#2c7a2e'; ctx.lineWidth = W * 0.012;
      ctx.beginPath(); ctx.moveTo(x0, H); ctx.bezierCurveTo(x0 + s * W * 0.12, H * 0.8, x - s * W * 0.1, y + H * 0.1, x + s * W * 0.04 * Math.cos(i), H - (H - (y - H * 0.15)) * k); ctx.stroke();
      if (k > 0.5) { ctx.fillStyle = '#5fd36a'; for (let j = 1; j < 4; j++) { ctx.beginPath(); ctx.ellipse(x0 + s * W * 0.03 * j, H - (H - y) * k * j / 4, W * 0.012, W * 0.006, s, 0, 7); ctx.fill(); } }
    }
    ctx.restore();
    if (t > 0.55 && t < 1.0) for (let i = 0; i < 4; i++) { const a = azar(0, 6.28), d = W * azar(0.05, 0.3); st.ps.push(part({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: -Math.sin(a) * 400, vy: Math.cos(a) * 400, vida: 0.7, r: W * azar(0.008, 0.016), tipo: i % 3 ? 'hoja' : 'petalo', c: ['#6ad35a', '#a3e45a', '#ff9ac2', '#ffe06a'][i], vr: azar(-8, 8) })); }
    if (t > 0.68 && !st.boom) { st.boom = true; for (let i = 0; i < 30; i++) st.ps.push(part({ x: x + azar(-30, 30), y: y + azar(-30, 30), vx: azar(-400, 400), vy: azar(-400, 200), vida: 1, r: W * 0.015, tipo: 'petalo', c: i % 2 ? '#ff9ac2' : '#fff0a0', vr: azar(-8, 8) })); }
  },
  cazadora(ctx, W, H, t, st, x, y) { // una lluvia de flechas verdes cae en arco sobre el jefe
    if (t < 0.65 && st.n++ % 1 === 0) for (let i = 0; i < 2; i++) { const sx = azar(-W * 0.2, W * 0.3), sy = -H * 0.1, tx = x + azar(-W * 0.12, W * 0.12), ty = y + azar(-H * 0.2, H * 0.15), d = 0.35; st.ps.push(part({ x: sx, y: sy, vx: (tx - sx) / d, vy: (ty - sy) / d - 0.5 * 1200 * d, ay: 1200, vida: d, r: W * 0.014, tipo: 'flecha', c: '#9bf06a', fin: true })); }
    for (const p of st.ps) if (p.tipo === 'flecha' && p.t > p.vida - st.dt * 1.5 && !p.hecha) { p.hecha = true; for (let i = 0; i < 4; i++) st.extra.push(part({ x: p.x, y: p.y, vx: azar(-150, 150), vy: azar(-200, 0), ay: 600, vida: 0.4, r: 2, tipo: 'raya', largo: 0.03, c: '#d8ff9a', brillo: true })); }
    if (t > 0.62 && t < 0.9) brilloRadial(ctx, x, y, W * 0.18, '#a8ff6a', 0.5);
  },
  ninja(ctx, W, H, t, st, x, y) { // estelas del ninja y cortes cruzados de katana con pétalos rojos
    const cortes = [[0.05, -0.7], [0.18, 0.6], [0.3, -0.1], [0.42, 1.2], [0.55, -1.3]];
    for (const [t0, ang] of cortes) {
      const k = rango(t, t0, t0 + 0.08), f = 1 - rango(t, t0 + 0.08, t0 + 0.35);
      if (k <= 0 || f <= 0) continue;
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = f;
      const L = W * 0.4; ctx.lineCap = 'round';
      for (const [lw, c] of [[W * 0.03, 'rgba(230,40,60,.45)'], [W * 0.01, '#ff7a8a'], [W * 0.004, '#fff']]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.lineTo(-L / 2 + L * k, 0); ctx.stroke(); }
      ctx.restore();
      if (k > 0.9 && !st['c' + t0]) { st['c' + t0] = true; for (let i = 0; i < 8; i++) st.ps.push(part({ x, y, vx: azar(-300, 300), vy: azar(-300, 300), vida: 0.6, r: 2.5, tipo: 'raya', largo: 0.04, c: '#fff', brillo: true })); }
    }
    if (st.n++ % 2 === 0) st.ps.push(part({ x: azar(W * 0.4, W), y: -10, vx: azar(-120, -40), vy: azar(80, 160), vida: 1.6, r: W * 0.01, tipo: 'petalo', c: '#e8283c', vr: azar(-6, 6) }));
    if (t < 0.6) { ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#e8283c'; for (let i = 0; i < 3; i++) ctx.fillRect(x - W * (0.3 - i * 0.1), y - H * 0.02 + i * 6, W * 0.25, 3); ctx.restore(); }
  },
  archimago(ctx, W, H, t, st, x, y) { // círculo mágico con símbolos matemáticos, orbes que convergen y un rayo arcano
    const k = ease(rango(t, 0, 0.35)), giro = t * 2.5;
    ctx.save(); ctx.translate(x, y + H * 0.18); ctx.scale(1, 0.35); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - rango(t, 0.9, 1.15);
    for (const [r, dir] of [[W * 0.2, 1], [W * 0.15, -1], [W * 0.09, 1]]) { ctx.strokeStyle = '#a87aff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r * k, 0, 7); ctx.stroke(); ctx.save(); ctx.rotate(giro * dir); ctx.fillStyle = '#e0ccff'; ctx.font = `700 ${W * 0.026}px "Pixelify Sans", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const sim = ['π', '√', 'Σ', '∞', '÷', '±', 'x²', '∠']; sim.forEach((s, i) => { const a = (i / sim.length) * 6.28; ctx.fillText(s, Math.cos(a) * r * k * 0.86, Math.sin(a) * r * k * 0.86); }); ctx.restore(); }
    ctx.restore();
    if (t < 0.6) for (let i = 0; i < 2; i++) { const a = azar(0, 6.28), d = W * 0.35; st.ps.push(part({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.6, vx: -Math.cos(a) * d * 2.2, vy: -Math.sin(a) * d * 1.3, vida: 0.45, r: W * 0.02, tipo: 'circ', c: '#8a5aff', c2: '#fff', brillo: true })); }
    if (t > 0.6 && t < 0.95) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(x - W * 0.06, 0, x + W * 0.06, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(220,200,255,.95)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.globalAlpha = 1 - rango(t, 0.8, 0.95); ctx.fillRect(x - W * 0.06, 0, W * 0.12, H); ctx.restore(); }
    if (t > 0.65 && !st.boom) { st.boom = true; for (let i = 0; i < 16; i++) st.ps.push(part({ x, y, vx: azar(-400, 400), vy: azar(-400, 200), vida: 1, r: W * 0.03, tipo: 'texto', txt: ['π', '√', 'Σ', '∞', '%', '½'][i % 6], c: '#cdb4ff', brillo: true })); }
  },
  emperador(ctx, W, H, t, st, x, y) { // un sello solar dorado en el cielo y columnas de luz que caen como juicio
    const k = ease(rango(t, 0, 0.4));
    ctx.save(); ctx.translate(x, H * 0.18); ctx.rotate(t * 1.2); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - rango(t, 0.9, 1.15);
    ctx.strokeStyle = '#ffd25a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, W * 0.09 * k, 0, 7); ctx.stroke();
    for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(W * 0.1 * k, 0); ctx.lineTo(W * 0.15 * k, 0); ctx.stroke(); }
    ctx.restore();
    brilloRadial(ctx, x, H * 0.18, W * 0.14 * k, '#ffd25a', 0.7);
    for (const [t0, dx] of [[0.25, -0.12], [0.35, 0.1], [0.45, -0.04], [0.55, 0.05], [0.62, 0]]) {
      const f = rango(t, t0, t0 + 0.1) * (1 - rango(t, t0 + 0.25, t0 + 0.45)); if (f <= 0) continue;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = f; const cx = x + dx * W, w = dx === 0 ? W * 0.1 : W * 0.05;
      const g = ctx.createLinearGradient(cx - w, 0, cx + w, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(255,240,180,.95)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(cx - w, 0, w * 2, y + H * 0.2); ctx.restore();
      if (!st['p' + t0]) { st['p' + t0] = true; for (let i = 0; i < 10; i++) st.ps.push(part({ x: x + dx * W, y: y + H * 0.18, vx: azar(-200, 200), vy: azar(-260, -60), ay: 400, vida: 0.8, r: W * 0.008, tipo: 'cuad', c: '#ffd25a', vr: azar(-8, 8) })); }
    }
    if (st.n++ % 3 === 0) st.ps.push(part({ x: azar(0, W), y: azar(0, H), vida: 0.6, r: W * 0.012, tipo: 'circ', c: '#ffe08a', c2: '#fff', brillo: true }));
  },
  esqueleto(ctx, W, H, t, st, x, y) { // manos esqueléticas brotan del suelo, llamas espectrales y calaveras que vuelan
    ctx.save(); ctx.globalAlpha = 0.5 * rango(t, 0, 0.2) * (1 - rango(t, 0.9, 1.1)); ctx.fillStyle = '#12051e'; ctx.fillRect(0, 0, W, H); ctx.restore();
    for (let i = 0; i < 7; i++) {
      const t0 = 0.05 + i * 0.07, k = ease(rango(t, t0, t0 + 0.25)) * (1 - rango(t, 0.9, 1.1)); if (k <= 0) continue;
      const bx = x + (i - 3) * W * 0.07, by = H - k * H * 0.25;
      ctx.save(); ctx.translate(bx, by); ctx.scale(1.6, 1.6); ctx.strokeStyle = '#efe6d2'; ctx.lineCap = 'round'; ctx.lineWidth = W * 0.008;
      ctx.beginPath(); ctx.moveTo(0, H * 0.3); ctx.lineTo(0, 0); ctx.stroke();
      for (const a of [-0.5, -0.2, 0.1, 0.4]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a) * W * 0.03, -Math.cos(a) * W * 0.035); ctx.stroke(); }
      ctx.restore();
      if (st.n % 2 === 0) st.ps.push(part({ x: bx, y: by, vx: azar(-20, 20), vy: azar(-120, -60), vida: 0.6, r: W * 0.02, tipo: 'circ', c: '#9a3aff', c2: '#e0b0ff', brillo: true }));
    }
    st.n++;
    if (t > 0.3 && t < 0.7 && st.n % 6 === 0) { const sx = azar(0, W * 0.3); st.ps.push(part({ x: sx, y: azar(H * 0.2, H * 0.6), vx: (x - sx) / 0.4, vy: azar(-40, 40), vida: 0.42, r: W * 0.035, tipo: 'texto', txt: '💀', c: '#c080ff' })); }
    if (t > 0.68 && !st.boom) { st.boom = true; for (let i = 0; i < 18; i++) st.ps.push(part({ x, y, vx: azar(-450, 450), vy: azar(-500, 0), ay: 900, vida: 1.1, r: W * 0.018, tipo: 'hueso', vr: azar(-12, 12) })); }
  },
  minotauro(ctx, W, H, t, st, x, y) { // la embestida del titán: polvo, grietas en el suelo y una onda de choque
    if (t < 0.65) { const px = W * 0.05 + (x - W * 0.05) * ease(rango(t, 0.1, 0.65)); for (let i = 0; i < 3; i++) st.ps.push(part({ x: px - W * 0.05, y: H * 0.85 + azar(-10, 10), vx: azar(-260, -80), vy: azar(-120, -20), vida: 0.8, r: W * azar(0.03, 0.06), tipo: 'circ', c: 'rgba(170,140,110,.6)', c2: 'rgba(210,190,160,.7)', a: 0.8 })); ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#eb7828'; for (let i = 0; i < 5; i++) ctx.fillRect(px - W * (0.1 + i * 0.05), H * (0.55 + i * 0.05), W * 0.08, 3); ctx.restore(); }
    const k = rango(t, 0.62, 0.9);
    if (k > 0) {
      ctx.save(); ctx.strokeStyle = '#ffb060'; ctx.shadowColor = '#ff6a00'; ctx.shadowBlur = 10; ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) { const a = Math.PI + (i / 7) * Math.PI; ctx.beginPath(); ctx.moveTo(x, H * 0.88); ctx.lineTo(x + Math.cos(a) * W * 0.25 * k, H * 0.88 - Math.abs(Math.sin(a)) * H * 0.04 * k); ctx.stroke(); }
      ctx.restore();
    }
    if (t > 0.65 && !st.boom) { st.boom = true; st.ps.push(part({ x, y, vida: 0.6, r: W * 0.6, tipo: 'aro', c: '#ffd0a0', ancho: 8, crece: 1 })); st.ps.push(part({ x, y, vida: 0.8, r: W * 0.4, tipo: 'aro', c: '#eb7828', ancho: 4, crece: 1.2 })); for (let i = 0; i < 26; i++) st.ps.push(part({ x: x + azar(-30, 30), y: H * 0.88, vx: azar(-500, 500), vy: azar(-700, -200), ay: 1400, vida: 1.1, r: W * azar(0.008, 0.02), tipo: 'cuad', c: ['#7a6a5a', '#9a8064', '#5a4a3e'][i % 3], vr: azar(-10, 10) })); }
  },
};

// ===================== Bucle de dibujo =====================
function lienzo(cv) { const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); return cv.getContext('2d'); }
const bucles = {};
function correr(nombre, cv, durReal, cuadro) {
  cancelAnimationFrame(bucles[nombre]);
  const ctx = lienzo(cv), W = cv.width, H = cv.height, inicio = performance.now(); let antes = inicio;
  const st = { ps: [], extra: [], rayos: [], n: 0, dt: 0 };
  const paso = (ahora) => {
    const real = (ahora - inicio) / 1000; st.dt = Math.min(0.05, (ahora - antes) / 1000) / velocidad[nombre]; antes = ahora;
    ctx.clearRect(0, 0, W, H);
    const sigue = cuadro(ctx, W, H, real / velocidad[nombre], st);
    st.ps = pasar(st.ps, st.dt); st.extra = pasar(st.extra, st.dt); pintar(ctx, st.ps); pintar(ctx, st.extra);
    if (real < durReal && sigue !== false) bucles[nombre] = requestAnimationFrame(paso); else ctx.clearRect(0, 0, W, H);
  };
  bucles[nombre] = requestAnimationFrame(paso);
}
const velocidad = { a: 1, b: 1, c: 1, d: 1 };

// ===================== Mundo 5: Altar de los Dioses (cinemáticas largas, todo en canvas) =====================
const PX = '"Pixelify Sans", "Courier New", monospace';
function texto(ctx, s, x, y, px, color, a = 1, { borde = '#000', ancho = 0.12, brillo = null, alin = 'center', esp = 0 } = {}) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, a); ctx.font = `700 ${px}px ${PX}`; ctx.textAlign = alin; ctx.textBaseline = 'middle';
  if (esp) ctx.letterSpacing = `${esp}px`;
  if (brillo) { ctx.shadowColor = brillo; ctx.shadowBlur = px * 0.6; }
  ctx.lineJoin = 'round'; ctx.lineWidth = px * ancho; ctx.strokeStyle = borde; ctx.strokeText(s, x, y); ctx.fillStyle = color; ctx.fillText(s, x, y);
  ctx.restore();
}
function bandasCine(ctx, W, H, t, dur) { const h = H * 0.11 * ease(rango(t, 0, 0.4)) * (1 - rango(t, dur - 0.35, dur)); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h); return h; }
// Narración al pie con efecto máquina de escribir
function narrar(ctx, W, H, t, t0, t1, s, color = '#e8dcff') {
  const k = rango(t, t0, t0 + Math.min(1.4, (t1 - t0) * 0.6)), a = rango(t, t0, t0 + 0.2) * (1 - rango(t, t1 - 0.25, t1));
  texto(ctx, s.slice(0, Math.ceil(s.length * k)), W / 2, H * 0.94, W * 0.024, color, a, { ancho: 0.2 });
}
// Cuadro de diálogo de Hades
function dialogo(ctx, W, H, t, t0, t1, quien, s) {
  const a = rango(t, t0, t0 + 0.2) * (1 - rango(t, t1 - 0.25, t1)); if (a <= 0) return;
  const k = rango(t, t0 + 0.15, t0 + Math.min(2.2, (t1 - t0) * 0.7));
  ctx.save(); ctx.globalAlpha = a; const x = W * 0.08, y = H * 0.68, w = W * 0.84, h = H * 0.18;
  ctx.fillStyle = 'rgba(12,2,24,.88)'; ctx.strokeStyle = '#aa4aff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill(); ctx.stroke(); ctx.restore();
  texto(ctx, quien, x + W * 0.02, y + h * 0.22, W * 0.02, '#c89aff', a, { alin: 'left', ancho: 0.15 });
  const px = W * 0.024, vis = s.slice(0, Math.ceil(s.length * k));
  ctx.save(); ctx.font = `700 ${px}px ${PX}`; const lineas = []; let lin = '';
  for (const pal of s.split(' ')) { const prueba = lin ? `${lin} ${pal}` : pal; if (ctx.measureText(prueba).width > w * 0.94 && lin) { lineas.push(lin); lin = pal; } else lin = prueba; }
  lineas.push(lin); ctx.restore();
  let resto = vis.length;
  lineas.forEach((l, i) => { const parte = l.slice(0, Math.max(0, resto)); resto -= l.length + 1; texto(ctx, parte, x + W * 0.02, y + h * (lineas.length > 1 ? 0.5 + i * 0.3 : 0.62), px, '#ffffff', a, { alin: 'left', ancho: 0.15 }); });
}
// Ficha del dios: franja diagonal con nombre, título y regla de combate
function fichaDios(ctx, W, H, t, t0, t1, { etq, nombre, sub, color }) {
  const e = ease(rango(t, t0, t0 + 0.35)), a = 1 - rango(t, t1 - 0.25, t1); if (e <= 0 || a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(W * (1 - e), 0);
  ctx.fillStyle = 'rgba(8,0,16,.86)'; ctx.beginPath(); ctx.moveTo(W * 0.22, H * 0.62); ctx.lineTo(W, H * 0.55); ctx.lineTo(W, H * 0.86); ctx.lineTo(W * 0.18, H * 0.9); ctx.fill();
  ctx.fillStyle = color; ctx.fillRect(W * 0.2, H * 0.62, W, H * 0.008);
  ctx.restore();
  texto(ctx, etq, W * 0.94 + W * (1 - e), H * 0.66, W * 0.018, color, a, { alin: 'right', esp: W * 0.004, ancho: 0.15 });
  texto(ctx, nombre, W * 0.94 + W * (1 - e), H * 0.74, W * 0.04, '#ffffff', a, { alin: 'right', brillo: color });
  texto(ctx, sub, W * 0.94 + W * (1 - e), H * 0.82, W * 0.018, '#e8dcff', a * rango(t, t0 + 0.4, t0 + 0.7), { alin: 'right', ancho: 0.15 });
}
function aLuchar(ctx, W, H, t, t0, t1, txt = '¡A LUCHAR!') {
  const k = rango(t, t0, t0 + 0.18), a = 1 - rango(t, t1 - 0.2, t1); if (k <= 0 || a <= 0) return;
  const esc = 1 + (1 - ease(k)) * 2.2;
  ctx.save(); ctx.translate(W / 2, H * 0.45); ctx.scale(esc, esc); ctx.rotate(-0.05); texto(ctx, txt, 0, 0, W * 0.09, '#ffffff', a * k, { ancho: 0.14 }); ctx.restore();
}
function braseros(ctx, W, H, t, st, color, encender) {
  for (const x of [0.1, 0.9]) {
    ctx.fillStyle = '#2a2230'; ctx.fillRect(W * x - W * 0.02, H * 0.72, W * 0.04, H * 0.2); ctx.fillRect(W * x - W * 0.035, H * 0.7, W * 0.07, H * 0.03);
    if (t > encender) { brilloRadial(ctx, W * x, H * 0.66, W * 0.1, color, 0.6); if (st.n % 2 === 0) st.ps.push(part({ x: W * x + azar(-W * 0.015, W * 0.015), y: H * 0.69, vy: azar(-160, -80), vx: azar(-15, 15), vida: 0.6, r: W * 0.018, tipo: 'circ', c: color, c2: '#fff6d0', brillo: true })); }
  }
}
function murcielago(ctx, x, y, s, aleteo, color) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-s, -s * aleteo, -s * 1.6, s * 0.2); ctx.quadraticCurveTo(-s * 0.8, 0, 0, s * 0.3); ctx.quadraticCurveTo(s * 0.8, 0, s * 1.6, s * 0.2); ctx.quadraticCurveTo(s, -s * aleteo, 0, 0); ctx.fill(); ctx.restore(); }
function sacudir(ctx, st, W, f) { if (f > 0) ctx.translate(azar(-1, 1) * W * 0.008 * f, azar(-1, 1) * W * 0.006 * f); }
const dios = (id) => DATOS.D.find((d) => d.id === id);
const COL5 = ['#ff4a3a', '#ff3a8a', '#ff8a1a', '#4ae0d0', '#5aff8a'];

const ALTAR = {
  cerbero: {
    nombre: 'Cerbero, Guardián de la Puerta', dur: 6.5,
    escenas: [[0, 1.4, 'La puerta sellada', 'Se encienden los braseros rojos frente a una puerta de piedra encadenada.'], [1.4, 2.4, 'Se rompen las cadenas', 'Las cadenas estallan y la puerta se abre con un resplandor de fuego.'], [2.4, 3.6, 'Tres miradas', 'En la oscuridad se encienden tres pares de ojos, uno por cabeza, con un gruñido que sacude la pantalla.'], [3.6, 4.4, 'Sale el guardián', 'Cerbero cruza la puerta entre llamas.'], [4.4, 6.5, 'Ficha y combate', 'Nombre, regla de las tres cabezas y «¡A LUCHAR!».']],
    dibujar(ctx, W, H, t, st) {
      const D = dios('cerbero'); const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120203'); g.addColorStop(1, '#2a0a08'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save(); sacudir(ctx, st, W, t > 2.5 && t < 3.6 ? 0.7 : t > 1.4 && t < 1.7 ? 1 : 0);
      const ab = ease(rango(t, 1.5, 2.4));
      brilloRadial(ctx, W / 2, H * 0.55, W * 0.35, '#ff3a1a', 0.2 + 0.5 * ab);
      ctx.fillStyle = '#05000a'; ctx.fillRect(W * 0.32, H * 0.15, W * 0.36, H * 0.8);
      for (let k = 0; k < 3; k++) { const on = rango(t, 2.5 + k * 0.3, 2.65 + k * 0.3) * (1 - rango(t, 3.6, 3.9)); ojos(ctx, W * (0.4 + k * 0.1), H * (0.42 - (k === 1 ? 0.06 : 0)), W * 0.01, '#ff2a1a', on); }
      if (t > 3.6) { const s = ease(rango(t, 3.6, 4.3)); sprite(ctx, D.frente, W / 2, H * (0.62 + 0.02 * (1 - s)), H * (0.55 + 0.25 * s), { sombra: 0.8 - 0.8 * s, alfa: s }); }
      for (const s of [-1, 1]) { ctx.save(); ctx.translate(W / 2 + s * (W * 0.09 + ab * W * 0.17), 0); ctx.fillStyle = '#4a3a40'; ctx.fillRect(-W * 0.09, H * 0.15, W * 0.18, H * 0.8); ctx.fillStyle = '#2e2228'; for (let i = 0; i < 4; i++) ctx.fillRect(-W * 0.08, H * (0.2 + i * 0.19), W * 0.16, H * 0.012); ctx.fillStyle = '#8a7a6a'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-s * W * 0.07, H * (0.22 + i * 0.13), W * 0.006, 0, 7); ctx.fill(); } ctx.restore(); }
      ctx.fillStyle = '#3a2a30'; ctx.fillRect(W * 0.28, H * 0.1, W * 0.44, H * 0.07);
      if (t < 1.45) { ctx.strokeStyle = '#9a9aa8'; ctx.lineWidth = W * 0.006; for (const [y0, y1] of [[0.3, 0.55], [0.55, 0.3]]) { ctx.beginPath(); for (let i = 0; i <= 12; i++) { const x = W * (0.32 + i * 0.03), y = H * (y0 + (y1 - y0) * i / 12); ctx.moveTo(x + W * 0.012, y); ctx.arc(x, y, W * 0.012, 0, 7); } ctx.stroke(); } }
      else if (!st.cad) { st.cad = true; for (let i = 0; i < 26; i++) st.ps.push(part({ x: W * azar(0.32, 0.68), y: H * azar(0.3, 0.55), vx: azar(-500, 500), vy: azar(-400, 100), ay: 1200, vida: 1.2, r: W * 0.01, tipo: 'aro', c: '#b0b0c0', ancho: 3, crece: 0 })); }
      braseros(ctx, W, H, t, st, '#ff4a1a', 0.3);
      ctx.restore();
      fichaDios(ctx, W, H, t, 4.4, 5.9, { etq: 'DIOS DEL ALTAR · 1 DE 5', nombre: D.nombre, sub: 'Tres cabezas con su propia vida', color: D.color });
      aLuchar(ctx, W, H, t, 5.8, 6.4);
    },
  },
  vampira: {
    nombre: 'Lilith, Reina de la Noche', dur: 6.5,
    escenas: [[0, 1.4, 'Luna roja', 'Una luna carmesí sube entre la niebla.'], [1.2, 3.2, 'El enjambre', 'Cientos de murciélagos giran en espiral cada vez más cerca del centro.'], [3.2, 4.4, 'Revelación', 'El enjambre estalla en pétalos de rosa oscura y aparece Lilith.'], [4.4, 6.5, 'Ficha y combate', 'Nombre, regla del drenaje y «¡A LUCHAR!».']],
    dibujar(ctx, W, H, t, st) {
      const D = dios('vampira'); const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d0218'); g.addColorStop(1, '#2a0820'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const ly = H * (0.75 - 0.45 * ease(rango(t, 0, 1.4)));
      brilloRadial(ctx, W * 0.7, ly, W * 0.25, '#ff2a4a', 0.5); ctx.fillStyle = '#c8203a'; ctx.beginPath(); ctx.arc(W * 0.7, ly, H * 0.16, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.arc(W * 0.66, ly - H * 0.03, H * 0.04, 0, 7); ctx.arc(W * 0.74, ly + H * 0.05, H * 0.03, 0, 7); ctx.fill();
      ctx.fillStyle = '#0a0410'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += W / 20) ctx.lineTo(x, H * 0.8 - Math.abs(Math.sin(x * 0.03)) * H * 0.12); ctx.lineTo(W, H); ctx.fill();
      if (!st.bats) st.bats = Array.from({ length: 70 }, (_, i) => ({ a: azar(0, 6.28), r: azar(0.3, 0.75), v: azar(2, 4), s: azar(0.6, 1.2) }));
      const junta = rango(t, 1.2, 3.2), vuela = t > 3.2;
      if (t > 1.0 && !vuela) for (const b of st.bats) { const ang = b.a + t * b.v, r = W * b.r * (1 - 0.85 * ease(junta)); murcielago(ctx, W / 2 + Math.cos(ang) * r, H * 0.5 + Math.sin(ang) * r * 0.5, W * 0.014 * b.s, Math.sin(t * 25 + b.a) * 0.8, '#6a1a52'); }
      if (vuela && !st.estalla) { st.estalla = true; for (let i = 0; i < 60; i++) { const a = azar(0, 6.28), v = azar(200, 700); st.ps.push(part({ x: W / 2, y: H * 0.5, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 1.4, r: W * 0.012, tipo: 'petalo', c: i % 3 ? '#8a0a2a' : '#ff3a6a', vr: azar(-8, 8) })); } }
      if (t > 3.1) { const s = ease(rango(t, 3.1, 3.9)); brilloRadial(ctx, W / 2, H * 0.52, W * 0.2, '#ff3a8a', 0.5 * s); sprite(ctx, D.frente, W / 2, H * 0.56, H * 0.8, { sombra: 0.7 * (1 - s), alfa: s }); }
      if (st.n % 3 === 0) st.ps.push(part({ x: azar(0, W), y: H * azar(0.7, 1), vx: azar(-20, 20), vy: -10, vida: 3, r: W * 0.08, tipo: 'circ', c: 'rgba(120,60,140,.25)', c2: 'rgba(160,110,180,.2)', a: 0.6 }));
      fichaDios(ctx, W, H, t, 4.4, 5.9, { etq: 'DIOS DEL ALTAR · 2 DE 5', nombre: D.nombre, sub: 'Tus errores la curan · 3 aciertos seguidos: estaca de luz', color: D.color });
      aLuchar(ctx, W, H, t, 5.8, 6.4);
    },
  },
  ciclope: {
    nombre: 'Polifemo, el Cíclope de Obsidiana', dur: 6.5,
    escenas: [[0, 1.8, 'El ojo', 'En la oscuridad total se abre un ojo gigante.'], [1.8, 2.6, 'Mirada petrificante', 'El ojo brilla y una luz naranja barre la pantalla, que queda gris como piedra.'], [2.6, 4.2, 'La obsidiana', 'Rocas negras vuelan al centro y forman al cíclope.'], [4.2, 6.5, 'Ficha y combate', 'Nombre, regla de la piel de obsidiana y «¡A LUCHAR!».']],
    dibujar(ctx, W, H, t, st) {
      const D = dios('ciclope'); ctx.fillStyle = '#050304'; ctx.fillRect(0, 0, W, H);
      if (t < 2.7) {
        const ab = ease(rango(t, 0.3, 1.6)), zoom = 1 - 0.6 * rango(t, 2.2, 2.7);
        ctx.save(); ctx.translate(W / 2, H * 0.48); ctx.scale(zoom, zoom);
        ctx.fillStyle = '#f2e8d8'; ctx.beginPath(); ctx.ellipse(0, 0, W * 0.3, H * 0.3 * ab, 0, 0, 7); ctx.fill();
        ctx.save(); ctx.clip(); const ir = ctx.createRadialGradient(0, 0, 0, 0, 0, H * 0.22); ir.addColorStop(0, '#ffe08a'); ir.addColorStop(0.5, '#ff8a1a'); ir.addColorStop(1, '#6a2a00'); ctx.fillStyle = ir; ctx.beginPath(); ctx.arc(Math.sin(t * 2) * W * 0.03, 0, H * 0.22, 0, 7); ctx.fill(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(Math.sin(t * 2) * W * 0.03, 0, H * 0.03, H * 0.15, 0, 0, 7); ctx.fill(); ctx.restore();
        ctx.restore();
        if (t > 1.8) brilloRadial(ctx, W / 2, H * 0.48, W * 0.5, '#ff8a1a', 0.6 * (1 - rango(t, 2.2, 2.6)));
      }
      const barre = rango(t, 1.9, 2.4);
      if (barre > 0 && t < 2.8) { ctx.save(); ctx.globalAlpha = 0.55 * (1 - rango(t, 2.5, 2.8)); ctx.fillStyle = '#8a8a8a'; ctx.fillRect(0, 0, W * barre, H); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#ff9a3a'; ctx.fillRect(W * barre - W * 0.02, 0, W * 0.04, H); ctx.restore(); }
      if (t > 2.6) {
        if (!st.rocas) st.rocas = Array.from({ length: 34 }, () => ({ x: azar(-0.2, 1.2), y: azar(-0.3, 1.3), tx: azar(0.42, 0.58), ty: azar(0.3, 0.8), r: azar(0.015, 0.035), rot: azar(0, 6) }));
        const k = ease(rango(t, 2.6, 3.8));
        for (const r of st.rocas) { ctx.save(); ctx.translate(W * (r.x + (r.tx - r.x) * k), H * (r.y + (r.ty - r.y) * k)); ctx.rotate(r.rot * (1 - k)); ctx.globalAlpha = 1 - rango(t, 3.7, 4.0); ctx.fillStyle = '#1c1a22'; ctx.strokeStyle = '#ff8a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -W * r.r); ctx.lineTo(W * r.r, 0); ctx.lineTo(0, W * r.r); ctx.lineTo(-W * r.r * 0.8, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
        const s = rango(t, 3.6, 4.1); if (s > 0) { brilloRadial(ctx, W / 2, H * 0.55, W * 0.22, '#ff8a1a', 0.5); sprite(ctx, D.frente, W / 2, H * 0.56, H * 0.8, { sombra: 0.6 * (1 - s), alfa: s }); }
      }
      fichaDios(ctx, W, H, t, 4.3, 5.9, { etq: 'DIOS DEL ALTAR · 3 DE 5', nombre: D.nombre, sub: 'Piel de obsidiana · mirada petrificante', color: D.color });
      aLuchar(ctx, W, H, t, 5.8, 6.4);
    },
  },
  segador: {
    nombre: 'Tánatos, el Segador de Almas', dur: 6.5,
    escenas: [[0, 2.0, 'El reloj de arena', 'Un reloj de arena gigante deja caer sus granos.'], [2.0, 3.4, 'El tiempo se detiene', 'La arena se congela en el aire y las almas giran a su alrededor.'], [3.4, 4.3, 'La guadaña', 'Un tajo de guadaña cruza la pantalla y revela a Tánatos.'], [4.3, 6.5, 'Ficha y combate', 'Nombre, regla del reloj de 4 minutos y «¡A LUCHAR!».']],
    dibujar(ctx, W, H, t, st) {
      const D = dios('segador'); const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#02100f'); g.addColorStop(1, '#06242a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const quieto = t > 2.0 && t < 3.4, corte = t > 3.4;
      if (!corte) {
        ctx.save(); ctx.translate(W / 2, H * 0.5); ctx.strokeStyle = '#c9a46b'; ctx.lineWidth = W * 0.008; ctx.strokeRect(-W * 0.12, -H * 0.38, W * 0.24, H * 0.76);
        ctx.fillStyle = 'rgba(160,240,235,.18)'; ctx.beginPath(); ctx.moveTo(-W * 0.1, -H * 0.36); ctx.lineTo(W * 0.1, -H * 0.36); ctx.lineTo(W * 0.012, 0); ctx.lineTo(W * 0.1, H * 0.36); ctx.lineTo(-W * 0.1, H * 0.36); ctx.lineTo(-W * 0.012, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#bff4ee'; ctx.lineWidth = 2; ctx.stroke();
        const k = rango(t, 0, 2.0); ctx.fillStyle = '#e6c27a'; ctx.beginPath(); ctx.moveTo(-W * 0.09 * (1 - k), -H * 0.34 + H * 0.3 * k); ctx.lineTo(W * 0.09 * (1 - k), -H * 0.34 + H * 0.3 * k); ctx.lineTo(0, -H * 0.02); ctx.fill(); ctx.beginPath(); ctx.moveTo(-W * 0.09, H * 0.34); ctx.lineTo(W * 0.09, H * 0.34); ctx.lineTo(0, H * 0.34 - H * 0.25 * k); ctx.fill();
        ctx.restore();
        if (!quieto && st.n % 1 === 0) st.ps.push(part({ x: W / 2 + azar(-2, 2), y: H * 0.5, vy: 220, vida: 0.6, r: 2, tipo: 'punto', c: '#e6c27a' }));
      }
      if (quieto) { st.congelado = true; for (const p of st.ps) { p.vx *= 0.8; p.vy *= 0.8; p.ay = 0; p.t -= st.dt; } ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#9af0e6'; ctx.fillRect(0, 0, W, H); ctx.restore(); texto(ctx, '⏳', W * 0.86, H * 0.2, W * 0.05, '#4ae0d0', 1 - rango(t, 3.1, 3.4)); }
      if (t > 1.8 && t < 3.6) for (let i = 0; i < 6; i++) { const a = t * 2.2 + i * 1.05, r = W * 0.22; brilloRadial(ctx, W / 2 + Math.cos(a) * r, H * 0.5 + Math.sin(a) * r * 0.45, W * 0.04, '#4ae0d0', 0.8); }
      if (corte) {
        const k = rango(t, 3.4, 3.62);
        ctx.save(); ctx.translate(W * 0.5, H * 0.5); ctx.rotate(-0.5); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - rango(t, 3.8, 4.2); ctx.lineCap = 'round';
        for (const [lw, c] of [[W * 0.04, 'rgba(74,224,208,.4)'], [W * 0.012, '#bff8f2'], [W * 0.004, '#fff']]) { ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(0, H * 0.6, W * 0.6, -Math.PI * 0.85, -Math.PI * 0.85 + Math.PI * 0.7 * k); ctx.stroke(); }
        ctx.restore();
        const s = rango(t, 3.55, 4.0); brilloRadial(ctx, W / 2, H * 0.55, W * 0.22, '#4ae0d0', 0.4 * s); sprite(ctx, D.frente, W / 2, H * 0.56, H * 0.8, { sombra: 0.6 * (1 - s), alfa: s });
        if (!st.almas) { st.almas = true; for (let i = 0; i < 30; i++) st.ps.push(part({ x: W / 2 + azar(-W * 0.3, W * 0.3), y: H * azar(0.2, 0.8), vx: azar(-80, 80), vy: azar(-160, -40), vida: 1.8, r: W * 0.025, tipo: 'circ', c: '#4ae0d0', c2: '#e8fffc', brillo: true })); }
      }
      fichaDios(ctx, W, H, t, 4.3, 5.9, { etq: 'DIOS DEL ALTAR · 4 DE 5', nombre: D.nombre, sub: 'Un reloj de 4 minutos: aciertos +6 s, errores −12 s', color: D.color });
      aLuchar(ctx, W, H, t, 5.8, 6.4);
    },
  },
  golem: {
    nombre: 'El Gólem de las Almas Perdidas', dur: 6.5,
    escenas: [[0, 2.0, 'Almas perdidas', 'Luces verdes vagan por el altar y empiezan a juntarse.'], [1.5, 3.2, 'Se arma el gólem', 'Bloques de piedra vuelan al centro y encajan uno sobre otro.'], [3.2, 4.3, 'Despierta', 'Se encienden sus runas verdes y ruge con una onda de choque.'], [4.3, 6.5, 'Ficha y combate', 'Nombre, regla del combo y «¡A LUCHAR!».']],
    dibujar(ctx, W, H, t, st) {
      const D = dios('golem'); const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#020c06'); g.addColorStop(1, '#0a2414'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save(); sacudir(ctx, st, W, t > 3.6 && t < 4.2 ? 1 : 0);
      if (!st.almas) st.almas = Array.from({ length: 24 }, () => ({ x: azar(0, 1), y: azar(0.2, 0.9), f: azar(0, 6) }));
      const jn = ease(rango(t, 0.8, 2.6));
      for (const a of st.almas) { const x = W * (a.x + (0.5 - a.x) * jn) + Math.sin(t * 2 + a.f) * W * 0.02, y = H * (a.y + (0.55 - a.y) * jn) + Math.cos(t * 2 + a.f) * H * 0.02; brilloRadial(ctx, x, y, W * 0.035, '#5aff8a', 0.7 * (1 - rango(t, 2.6, 3.0))); }
      if (!st.bloques) st.bloques = Array.from({ length: 14 }, (_, i) => ({ x: azar(-0.3, 1.3), y: azar(-0.4, -0.1), tx: 0.5 + ((i % 3) - 1) * 0.06, ty: 0.85 - Math.floor(i / 3) * 0.12, t0: 1.5 + i * 0.1 }));
      for (const b of st.bloques) { const k = ease(rango(t, b.t0, b.t0 + 0.4)); if (k <= 0) continue; ctx.save(); ctx.globalAlpha = 1 - rango(t, 3.4, 3.7); ctx.translate(W * (b.x + (b.tx - b.x) * k), H * (b.y + (b.ty - b.y) * k)); ctx.fillStyle = '#4a5a4e'; ctx.fillRect(-W * 0.03, -H * 0.055, W * 0.06, H * 0.11); ctx.strokeStyle = '#2a342c'; ctx.lineWidth = 2; ctx.strokeRect(-W * 0.03, -H * 0.055, W * 0.06, H * 0.11); ctx.restore(); if (k >= 1 && !b.polvo) { b.polvo = true; for (let i = 0; i < 4; i++) st.ps.push(part({ x: W * b.tx, y: H * b.ty, vx: azar(-120, 120), vy: azar(-60, 0), vida: 0.6, r: W * 0.02, tipo: 'circ', c: 'rgba(120,140,120,.5)', a: 0.6 })); } }
      if (t > 3.2) { const s = rango(t, 3.2, 3.7); brilloRadial(ctx, W / 2, H * 0.55, W * 0.25, '#5aff8a', 0.5 * s); sprite(ctx, D.frente, W / 2, H * 0.56, H * 0.8, { sombra: 0.5 * (1 - s), alfa: s, brillo: 0.3 * (1 - rango(t, 3.7, 4.2)), color: '#5aff8a' }); }
      if (t > 3.6 && !st.onda) { st.onda = true; st.ps.push(part({ x: W / 2, y: H * 0.55, vida: 0.8, r: W * 0.7, tipo: 'aro', c: '#5aff8a', ancho: 6, crece: 1 })); }
      ctx.restore();
      fichaDios(ctx, W, H, t, 4.3, 5.9, { etq: 'DIOS DEL ALTAR · 5 DE 5', nombre: D.nombre, sub: 'Crece con tus errores · encadena aciertos: ×1,5 ×2 ×3', color: D.color });
      aLuchar(ctx, W, H, t, 5.8, 6.4);
    },
  },
  // ---------------- HADES ----------------
  hades: {
    nombre: 'Hades · Aparición', dur: 12,
    escenas: [[0, 1.8, 'Las almas de los dioses', 'Los cinco altares liberan las almas de los dioses vencidos, cada una con su color.'], [1.8, 3.8, 'El círculo del juicio', 'Las almas vuelan al centro y el pentagrama se dibuja en el suelo con fuego morado.'], [3.8, 5.6, 'El inframundo se abre', 'Terremoto, grietas de luz y una columna de fuego que rasga el cielo.'], [5.6, 7.6, 'Hades', 'Hades sube desde las llamas con su corona de fuego y habla a los jugadores.'], [7.6, 8.2, 'El tridente', 'Golpea el suelo con el tridente: destello y onda de choque.'], [8.2, 10.6, 'Jefe final', '«JEFE FINAL» y las letras de HADES caen una a una; su barra de vida de 3 fases se llena tramo a tramo.'], [10.6, 12, 'Fase 1 · El Juicio', 'Se anuncia la primera fase y empieza el combate.']],
    dibujar(ctx, W, H, t, st) {
      const D = dios('hades'); const cx = W / 2, cy = H * 0.62;
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#06000c'); g.addColorStop(1, '#1a0630'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save(); sacudir(ctx, st, W, (t > 3.8 && t < 5.6 ? 0.6 + 0.4 * Math.sin(t * 3) : 0) + (t > 7.6 && t < 8.1 ? 1.6 : 0));
      // cielo rasgado
      const rasga = rango(t, 4.4, 5.2) * (1 - rango(t, 7.4, 8.2) * 0.6);
      if (rasga > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const rg = ctx.createLinearGradient(cx - W * 0.05, 0, cx + W * 0.05, 0); rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(0.5, 'rgba(210,150,255,.8)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = rg; ctx.globalAlpha = rasga; ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx + W * 0.05, H * 0.25); ctx.lineTo(cx - W * 0.02, H * 0.4); ctx.lineTo(cx + W * 0.03, cy); ctx.lineTo(cx - W * 0.04, cy); ctx.lineTo(cx + W * 0.01, H * 0.38); ctx.lineTo(cx - W * 0.05, H * 0.2); ctx.closePath(); ctx.fill(); ctx.restore(); }
      // altares y almas
      const pos = COL5.map((c, i) => { const a = -Math.PI / 2 + i * (2 * Math.PI / 5); return [cx + Math.cos(a) * W * 0.34, cy + Math.sin(a) * H * 0.26, c]; });
      for (const [x, y] of pos) { ctx.fillStyle = '#241a30'; ctx.fillRect(x - W * 0.03, y - H * 0.02, W * 0.06, H * 0.05); }
      const vuelan = ease(rango(t, 1.8, 3.0));
      for (const [x, y, c] of pos) { const sube = ease(rango(t, 0.3, 1.5)); const ox = x + (cx - x) * vuelan, oy = y - H * 0.15 * sube + (cy - (y - H * 0.15)) * vuelan; if (t < 3.1 && t > 0.3) { brilloRadial(ctx, ox, oy, W * 0.05, c, 0.9); if (st.n % 2 === 0) st.ps.push(part({ x: ox, y: oy, vida: 0.5, r: W * 0.015, tipo: 'circ', c, brillo: true })); } }
      // pentagrama de fuego
      const traza = rango(t, 2.6, 3.8);
      if (traza > 0) {
        ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.38); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#b05aff'; ctx.shadowColor = '#aa4aff'; ctx.shadowBlur = 18; ctx.lineWidth = 5;
        const R = W * 0.28; ctx.beginPath(); ctx.arc(0, 0, R, -Math.PI / 2, -Math.PI / 2 + 6.283 * traza); ctx.stroke();
        const pts = [0, 2, 4, 1, 3, 0].map((k) => { const a = -Math.PI / 2 + k * (2 * Math.PI / 5); return [Math.cos(a) * R * 0.92, Math.sin(a) * R * 0.92]; });
        const tramos = traza * 5; ctx.beginPath(); ctx.moveTo(...pts[0]);
        for (let i = 1; i <= 5; i++) { const f = Math.min(1, Math.max(0, tramos - (i - 1))); if (f <= 0) break; const [ax, ay] = pts[i - 1], [bx, by] = pts[i]; ctx.lineTo(ax + (bx - ax) * f, ay + (by - ay) * f); }
        ctx.stroke(); ctx.restore();
        if (st.n % 2 === 0 && t < 8) st.ps.push(part({ x: cx + azar(-W * 0.28, W * 0.28), y: cy + azar(-H * 0.08, H * 0.08), vy: azar(-120, -40), vida: 0.8, r: W * 0.015, tipo: 'circ', c: '#9a3aff', c2: '#e8c8ff', brillo: true }));
      }
      // grietas de luz
      const gr = rango(t, 3.8, 4.8);
      if (gr > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#d0a0ff'; ctx.shadowColor = '#aa4aff'; ctx.shadowBlur = 10; ctx.lineWidth = 2.5; for (let i = 0; i < 10; i++) { const a = Math.PI * 0.05 + (i / 9) * Math.PI * 0.9 + Math.PI; ctx.beginPath(); ctx.moveTo(cx, cy); let x = cx, y = cy; for (let s = 0; s < 4; s++) { x += Math.cos(a + Math.sin(i * 3 + s) * 0.4) * W * 0.09 * gr; y -= Math.sin(a) * H * 0.03 * gr - H * 0.025 * gr; ctx.lineTo(x, y); } ctx.stroke(); } ctx.restore(); }
      // columna de fuego
      const col = rango(t, 4.4, 5.0) * (1 - rango(t, 5.9, 6.7));
      if (col > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const cg = ctx.createLinearGradient(cx - W * 0.1, 0, cx + W * 0.1, 0); cg.addColorStop(0, 'rgba(0,0,0,0)'); cg.addColorStop(0.5, 'rgba(180,90,255,.9)'); cg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = cg; ctx.globalAlpha = col; ctx.fillRect(cx - W * 0.1, cy - H * col, W * 0.2, H * col); ctx.restore(); for (let i = 0; i < 4; i++) st.ps.push(part({ x: cx + azar(-W * 0.07, W * 0.07), y: cy, vy: azar(-700, -350), vx: azar(-40, 40), vida: 0.9, r: W * azar(0.02, 0.04), tipo: 'circ', c: '#8a2aff', c2: '#f0d8ff', brillo: true, a: col })); }
      // Hades
      if (t > 5.4) {
        const s = ease(rango(t, 5.4, 7.0)), golpe = t > 7.6 && t < 7.75 ? 1 : 0;
        const y = cy + H * 0.45 * (1 - s) - H * 0.05;
        brilloRadial(ctx, cx, y - H * 0.1, W * 0.3, '#aa4aff', 0.5 * s);
        sprite(ctx, D.frente, cx, y - H * 0.14, H * 0.72, { sombra: 0.85 - 0.7 * rango(t, 6.2, 7.4), brillo: golpe ? 0.6 : 0, color: '#fff' });
        ojos(ctx, cx, y - H * 0.27, W * 0.012, '#c86aff', rango(t, 5.9, 6.2) * (1 - rango(t, 7.4, 7.8)));
        if (st.n % 2 === 0) st.ps.push(part({ x: cx + azar(-W * 0.04, W * 0.04), y: y - H * 0.45, vy: azar(-200, -90), vida: 0.6, r: W * 0.02, tipo: 'circ', c: '#aa4aff', c2: '#fff', brillo: true }));
      }
      if (t > 7.6 && !st.tridente) { st.tridente = true; st.ps.push(part({ x: cx, y: cy, vida: 0.9, r: W * 0.8, tipo: 'aro', c: '#e0b8ff', ancho: 10, crece: 1 })); st.ps.push(part({ x: cx, y: cy, vida: 1.1, r: W * 0.6, tipo: 'aro', c: '#aa4aff', ancho: 5, crece: 1.2 })); for (let i = 0; i < 40; i++) st.ps.push(part({ x: cx + azar(-W * 0.1, W * 0.1), y: cy, vx: azar(-600, 600), vy: azar(-500, -100), ay: 1200, vida: 1.2, r: W * 0.01, tipo: 'cuad', c: '#3a2a4a', vr: azar(-10, 10) })); }
      if (t > 7.6 && t < 7.8) { ctx.save(); ctx.globalAlpha = 1 - rango(t, 7.6, 7.8); ctx.fillStyle = '#fff'; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore(); }
      ctx.restore();
      // narración y diálogo
      narrar(ctx, W, H, t, 0.2, 1.8, 'Las almas de los cinco dioses vencidos despiertan…');
      narrar(ctx, W, H, t, 2.0, 3.8, 'El círculo del juicio arde en el centro del altar.');
      narrar(ctx, W, H, t, 4.0, 5.5, 'El inframundo se abre.');
      dialogo(ctx, W, H, t, 6.0, 7.6, 'HADES', '¿Quién se atreve a desafiar mi juicio? Resuelve mis enigmas… ¡o quédate aquí para siempre!');
      // ficha de jefe final
      if (t > 8.2 && t < 10.7) {
        const a = 1 - rango(t, 10.4, 10.7);
        ctx.save(); ctx.globalAlpha = 0.75 * rango(t, 8.2, 8.5) * a; ctx.fillStyle = '#05000a'; ctx.fillRect(0, 0, W, H); ctx.restore();
        texto(ctx, 'JEFE FINAL', W / 2, H * 0.24, W * 0.03, '#ffd27a', rango(t, 8.25, 8.5) * a, { esp: W * 0.012, ancho: 0.15 });
        'HADES'.split('').forEach((l, i) => { const k = rango(t, 8.5 + i * 0.16, 8.68 + i * 0.16); if (k <= 0) return; const e = 1 + (1 - ease(k)) * 3; ctx.save(); ctx.translate(W * (0.3 + i * 0.1), H * 0.43); ctx.scale(e, e); texto(ctx, l, 0, 0, W * 0.12, '#f0dcff', k * a, { brillo: '#aa4aff', ancho: 0.1 }); ctx.restore(); });
        texto(ctx, 'Dios del Inframundo', W / 2, H * 0.6, W * 0.028, '#c89aff', rango(t, 9.4, 9.7) * a, { ancho: 0.15 });
        const bw = W * 0.6, bx = W * 0.2, by = H * 0.7;
        ctx.save(); ctx.globalAlpha = rango(t, 9.4, 9.6) * a; ctx.fillStyle = '#1a0510'; ctx.fillRect(bx, by, bw, H * 0.04); ctx.restore();
        for (let f = 0; f < 3; f++) { const k = rango(t, 9.6 + f * 0.25, 9.85 + f * 0.25); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = ['#ff6a4a', '#d84aff', '#ff2a5a'][f]; ctx.fillRect(bx + f * bw / 3 + 2, by + 2, (bw / 3 - 4) * k, H * 0.04 - 4); ctx.restore(); texto(ctx, ['El Juicio', 'Las almas', 'La Furia'][f], bx + f * bw / 3 + bw / 6, by + H * 0.075, W * 0.016, '#e8dcff', k * a, { ancho: 0.15 }); }
      }
      if (t > 10.6) { const a = 1 - rango(t, 11.7, 12); texto(ctx, 'FASE 1 · EL JUICIO', W / 2, H * 0.28, W * 0.035, '#c89aff', rango(t, 10.6, 10.9) * a, { brillo: '#aa4aff' }); texto(ctx, '18 segundos por pregunta', W / 2, H * 0.36, W * 0.02, '#e8dcff', rango(t, 10.8, 11.1) * a, { ancho: 0.15 }); }
      aLuchar(ctx, W, H, t, 11.0, 11.9);
    },
  },
  hades2: {
    nombre: 'Hades · Fase 2', dur: 4.5,
    escenas: [[0, 0.6, 'Pausa', 'El combate se congela al bajar su vida a dos tercios.'], [0.6, 2.4, 'Escudo de almas', 'Hades ríe y absorbe las almas de los cinco dioses, que quedan girando a su alrededor.'], [2.4, 4.5, 'Fase 2', '«Las almas de los dioses»: escudo de 5 almas y tus errores lo curan.']],
    dibujar(ctx, W, H, t, st) {
      const D = dios('hades'), cx = W / 2, cy = H * 0.52;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.7); g.addColorStop(0, '#2a0a46'); g.addColorStop(1, '#05000a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save(); sacudir(ctx, st, W, t > 0.6 && t < 1.2 ? 0.5 : 0);
      brilloRadial(ctx, cx, cy, W * 0.3, '#aa4aff', 0.5);
      sprite(ctx, D.frente, cx, cy, H * 0.7, {});
      const entra = ease(rango(t, 0.6, 2.0));
      COL5.forEach((c, i) => { const a = t * 2.4 + i * 1.256, r = W * (0.5 - 0.28 * entra); const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.45; brilloRadial(ctx, x, y, W * 0.05, c, 0.95); if (st.n % 2 === 0) st.ps.push(part({ x, y, vida: 0.4, r: W * 0.015, tipo: 'circ', c, brillo: true })); });
      if (t > 2.0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 * rango(t, 2.0, 2.4); ctx.strokeStyle = '#e0c8ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, W * 0.22, H * 0.4, 0, 0, 7); ctx.stroke(); ctx.restore(); }
      ctx.restore();
      dialogo(ctx, W, H, t, 0.5, 2.3, 'HADES', '¡Jajaja! ¿Creíste que los dioses se habían ido? Sus almas me protegen.');
      texto(ctx, 'FASE 2 · LAS ALMAS DE LOS DIOSES', W / 2, H * 0.16, W * 0.034, '#f0dcff', rango(t, 2.4, 2.7) * (1 - rango(t, 4.2, 4.5)), { brillo: '#aa4aff' });
      texto(ctx, 'Escudo de 5 almas · tus errores lo curan', W / 2, H * 0.84, W * 0.022, '#ffd27a', rango(t, 2.6, 2.9) * (1 - rango(t, 4.2, 4.5)), { ancho: 0.15 });
    },
  },
  hades3: {
    nombre: 'Hades · Fase 3', dur: 5,
    escenas: [[0, 0.8, 'Rugido', 'La pantalla se agrieta en rojo y late como un corazón.'], [0.8, 2.6, 'Furia del Inframundo', 'Hades crece envuelto en fuego morado y rojo; se rompen sus cadenas.'], [2.6, 5, 'Fase 3', 'Solo se le hiere con 2 aciertos seguidos y cada error quita 5 corazones.']],
    dibujar(ctx, W, H, t, st) {
      const D = dios('hades'), cx = W / 2, cy = H * 0.55;
      const late = 0.5 + 0.5 * Math.sin(t * 9);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.7); g.addColorStop(0, '#3a0618'); g.addColorStop(1, '#0a0004'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save(); sacudir(ctx, st, W, t > 0.8 && t < 2.6 ? 0.8 : 0);
      const crece = ease(rango(t, 0.8, 2.4));
      brilloRadial(ctx, cx, cy, W * (0.3 + 0.15 * crece), late > 0.5 ? '#ff2a5a' : '#aa4aff', 0.6);
      if (st.n++ % 2 === 0) st.ps.push(part({ x: cx + azar(-W * 0.18, W * 0.18) * (1 + crece), y: cy + H * 0.35, vy: azar(-500, -200), vx: azar(-60, 60), vida: 0.7, r: W * azar(0.015, 0.03), tipo: 'circ', c: st.n % 4 ? '#ff2a5a' : '#8a2aff', c2: '#ffe0f0', brillo: true }));
      sprite(ctx, D.frente, cx, cy, H * (0.62 + 0.22 * crece), { brillo: 0.25 * late, color: '#ff2a5a' });
      if (t > 1.4 && !st.cadenas) { st.cadenas = true; for (let i = 0; i < 24; i++) st.ps.push(part({ x: cx + azar(-W * 0.15, W * 0.15), y: cy + azar(-H * 0.2, H * 0.2), vx: azar(-600, 600), vy: azar(-500, 200), ay: 1200, vida: 1.2, r: W * 0.01, tipo: 'aro', c: '#c0c0d0', ancho: 3, crece: 0 })); }
      ctx.restore();
      ctx.save(); ctx.strokeStyle = `rgba(255,60,90,${0.6 * rango(t, 0, 0.6)})`; ctx.lineWidth = 3;
      for (const [x0, y0, ang] of [[0, 0.1, 0.5], [1, 0.2, 2.6], [0, 0.9, -0.4], [1, 0.85, 3.6]]) { ctx.beginPath(); let x = W * x0, y = H * y0; ctx.moveTo(x, y); for (let s = 0; s < 5; s++) { x += Math.cos(ang + Math.sin(s * 5) * 0.6) * W * 0.05; y += Math.sin(ang + Math.sin(s * 5) * 0.6) * W * 0.05; ctx.lineTo(x, y); } ctx.stroke(); }
      ctx.restore();
      ctx.save(); const v = ctx.createRadialGradient(cx, cy, H * 0.3, cx, cy, W * 0.7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(255,20,60,${0.25 + 0.25 * late})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); ctx.restore();
      texto(ctx, 'FASE 3 · FURIA DEL INFRAMUNDO', W / 2, H * 0.16, W * 0.036, '#ffe0e8', rango(t, 2.6, 2.9) * (1 - rango(t, 4.7, 5)), { brillo: '#ff2a5a' });
      texto(ctx, '2 aciertos seguidos para herirlo · cada error: −5 ❤', W / 2, H * 0.84, W * 0.022, '#ffd27a', rango(t, 2.8, 3.1) * (1 - rango(t, 4.7, 5)), { ancho: 0.15 });
      dialogo(ctx, W, H, t, 0.9, 2.6, 'HADES', '¡BASTA! ¡Conocerán la furia del Inframundo!');
    },
  },
  hadesfin: {
    nombre: 'Hades · Derrota', dur: 6.5,
    escenas: [[0, 1.2, 'Golpe final', 'El último acierto congela a Hades.'], [1.2, 3.0, 'Se agrieta', 'Grietas de luz recorren su cuerpo mientras tiembla.'], [3.0, 4.2, 'Liberación', 'Hades estalla en luz y las almas de los cinco dioses salen volando, libres.'], [4.2, 6.5, 'Victoria', '«¡HADES HA SIDO DERROTADO!» y se anuncia la Torre de los Dioses.']],
    dibujar(ctx, W, H, t, st) {
      const D = dios('hades'), cx = W / 2, cy = H * 0.52;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.7); g.addColorStop(0, t > 3 ? '#3a2a5a' : '#1a0630'); g.addColorStop(1, '#05000a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save(); sacudir(ctx, st, W, t > 1.2 && t < 3.0 ? rango(t, 1.2, 3.0) * 1.4 : 0);
      if (t < 3.05) {
        sprite(ctx, D.frente, cx, cy, H * 0.72, { sombra: t < 1.2 ? 0 : 0.3, brillo: 0.15 + 0.5 * rango(t, 1.2, 3.0), color: '#ffffff' });
        const k = rango(t, 1.2, 2.9); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#fff'; ctx.shadowColor = '#e0c8ff'; ctx.shadowBlur = 12; ctx.lineWidth = 3;
        for (let i = 0; i < 9; i++) { const a = i * 0.7; ctx.beginPath(); ctx.moveTo(cx, cy - H * 0.1); let x = cx, y = cy - H * 0.1; for (let s = 0; s < 4; s++) { x += Math.cos(a + Math.sin(i + s) * 0.5) * W * 0.04 * k; y += Math.sin(a + Math.sin(i * 2 + s) * 0.5) * H * 0.07 * k; ctx.lineTo(x, y); } ctx.stroke(); }
        ctx.restore();
        if (t < 1.2) texto(ctx, '¡GOLPE FINAL!', W / 2, H * 0.16, W * 0.04, '#ffd27a', rango(t, 0.1, 0.3) * (1 - rango(t, 1.0, 1.2)), { brillo: '#ff8a1a' });
      }
      if (t > 3.0 && !st.boom) { st.boom = true; for (let i = 0; i < 90; i++) { const a = azar(0, 6.28), v = azar(150, 800); st.ps.push(part({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: azar(0.8, 1.6), r: W * azar(0.01, 0.03), tipo: 'circ', c: '#c89aff', c2: '#fff', brillo: true })); } COL5.forEach((c, i) => { st.ps.push(part({ x: cx, y: cy, vx: (i - 2) * 160, vy: -azar(300, 420), vida: 3.2, r: W * 0.06, tipo: 'circ', c, c2: '#fff', brillo: true })); }); }
      if (t > 3.0 && t < 3.35) { ctx.save(); ctx.globalAlpha = 1 - rango(t, 3.0, 3.35); ctx.fillStyle = '#fff'; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore(); }
      if (t > 3.3 && st.n % 2 === 0) st.ps.push(part({ x: azar(0, W), y: H + 5, vy: azar(-160, -60), vida: 2.5, r: W * 0.008, tipo: 'circ', c: '#ffe08a', c2: '#fff', brillo: true }));
      ctx.restore();
      const a = 1 - rango(t, 6.2, 6.5);
      texto(ctx, '¡HADES HA SIDO DERROTADO!', W / 2, H * 0.38, W * 0.05, '#ffffff', rango(t, 4.2, 4.5) * a, { brillo: '#c89aff' });
      texto(ctx, 'Las almas de los dioses son libres · se abre la Torre de los Dioses 🗼', W / 2, H * 0.5, W * 0.022, '#ffd27a', rango(t, 4.6, 4.9) * a, { ancho: 0.15 });
    },
  },
};

// ===================== Derrotas: jefes de los mundos, dioses del Altar y Hades =====================
// Fondo de cada mundo (sin el jefe) y cómo reacciona el ambiente cuando el jefe cae
const ENV = {
  u1: { g: ['#0f2a14', '#2b5a2a'], polvo: ['hoja', ['#5fae3c', '#8fd14a', '#c9a23a']], disuelve: '#8fd14a',
    fondo(ctx, W, H, t, st) { for (const [x0, h] of [[0.04, 0.9], [0.16, 0.75], [0.84, 0.82], [0.95, 0.7]]) arbol(ctx, W * x0, H, H * h, '#123d1c'); if (st.n % 3 === 0) st.ps.push(part({ x: azar(0, W), y: -10, vx: azar(-20, 20), vy: azar(40, 90), vida: 2.5, r: W * 0.009, tipo: 'hoja', c: '#6fbf3c', vr: azar(-4, 4) })); } },
  u2: { g: ['#e88a3a', '#f7d28a'], polvo: ['cuad', ['#e8b46a', '#c48a46']], disuelve: '#f3cf8c',
    fondo(ctx, W, H, t, st) { sol(ctx, W * 0.75, H * 0.3, H * 0.16, '#ffe3a0'); duna(ctx, W, H, H * 0.62, '#d79a52', 0.8, t); duna(ctx, W, H, H * 0.8, '#e0a85e', 1.4, t); if (st.n % 1 === 0) st.ps.push(part({ x: -10, y: azar(0, H), vx: azar(500, 800), vida: 1.6, r: 1.5, largo: 0.03, tipo: 'raya', c: '#f3cf8c', a: 0.7 })); } },
  u3: { g: ['#07060a', '#1d1622'], polvo: ['cuad', ['#5a4a42', '#7a6a5a', '#3e3434']], disuelve: '#b49aff',
    fondo(ctx, W, H, t, st) { tunel(ctx, W, H); brilloRadial(ctx, W / 2, 0, H * 0.9, '#ffc870', 0.25); if (st.n % 6 === 0) st.ps.push(part({ x: azar(0, W), y: -10, vy: 150, ay: 600, vida: 1.4, r: W * 0.006, tipo: 'cuad', c: '#5a4a42' })); } },
  u4: { g: ['#7fb2d6', '#e6f4ff'], polvo: ['esquirla', ['rgba(200,238,255,.9)']], disuelve: '#e8f8ff',
    fondo(ctx, W, H, t, st) { montanas(ctx, W, H, '#b9d6ea', '#f4fbff'); for (let i = 0; i < 3; i++) st.ps.push(part({ x: azar(-W * 0.2, W), y: -10, vx: azar(200, 350), vy: azar(200, 300), vida: 1.6, r: 2.5, tipo: 'punto', c: '#fff', a: 0.9 })); } },
  rey: { g: ['#050d0a', '#11301e'], polvo: ['circ', ['#d8ff6a', '#7aff6a']], disuelve: '#b8ff7a',
    fondo(ctx, W, H, t, st) { for (const [x0, h] of [[0.08, 1], [0.22, 0.85], [0.78, 0.9], [0.92, 1]]) arbol(ctx, W * x0, H, H * h, '#07180e'); if (st.n % 3 === 0) st.ps.push(part({ x: azar(0, W), y: azar(H * 0.2, H), vx: azar(-20, 20), vy: azar(-30, 10), vida: 2.2, r: W * 0.012, tipo: 'circ', c: '#d8ff6a', brillo: true })); } },
  faraon: { g: ['#0b0f2a', '#3a2a40'], polvo: ['raya', ['#eadfc4', '#ffd27a']], disuelve: '#ffd27a',
    fondo(ctx, W, H, t, st) { ctx.fillStyle = '#1b1630'; ctx.beginPath(); ctx.moveTo(W * 0.02, H); ctx.lineTo(W * 0.2, H * 0.45); ctx.lineTo(W * 0.38, H); ctx.fill(); ctx.beginPath(); ctx.moveTo(W * 0.7, H); ctx.lineTo(W * 0.86, H * 0.52); ctx.lineTo(W * 1.02, H); ctx.fill(); if (st.n % 2 === 0) st.ps.push(part({ x: azar(0, W), y: H + 5, vy: azar(-120, -50), vida: 2, r: W * 0.006, tipo: 'circ', c: '#ffd27a', brillo: true })); } },
  coloso: { g: ['#120302', '#3a0d05'], polvo: ['circ', ['#ff7a1a', '#ffb030']], disuelve: '#ff8a1a',
    fondo(ctx, W, H, t, st) { ctx.save(); const lg = ctx.createRadialGradient(W / 2, H * 0.92, 0, W / 2, H * 0.92, W * 0.3); lg.addColorStop(0, '#ffb040'); lg.addColorStop(1, 'rgba(120,20,0,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(W / 2, H * 0.92, W * 0.3, H * 0.1, 0, 0, 7); ctx.fill(); ctx.restore(); st.ps.push(part({ x: azar(0, W), y: H + 5, vy: azar(-220, -90), vida: 1.6, r: W * 0.007, tipo: 'circ', c: '#ff7a1a', c2: '#ffe08a', brillo: true })); } },
  dragon: { g: ['#020616', '#0d2140'], polvo: ['punto', ['#ffffff', '#bfe8ff']], disuelve: '#7affd8',
    fondo(ctx, W, H, t, st) { if (!st.estrellas) st.estrellas = Array.from({ length: 60 }, () => [Math.random(), Math.random() * 0.7, Math.random()]); for (const [x, y, f] of st.estrellas) { ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * Math.abs(Math.sin(t * 3 + f * 10))})`; ctx.fillRect(x * W, y * H, 2, 2); } ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let b = 0; b < 2; b++) { const g = ctx.createLinearGradient(0, H * 0.05, 0, H * 0.6); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, b ? 'rgba(170,90,255,.3)' : 'rgba(80,255,180,.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, H * 0.6); for (let x = 0; x <= W; x += W / 30) ctx.lineTo(x, H * (0.25 + b * 0.08) + Math.sin(x / W * 6 + t * 1.6 + b) * H * 0.08); ctx.lineTo(W, H * 0.6); ctx.closePath(); ctx.fill(); } ctx.restore(); montanas(ctx, W, H, '#16304f', '#dceeff'); } },
};
// Pieza común de todas las derrotas: «¡GOLPE FINAL!», K.O. con letras que golpean y el estallido del jefe
function koLetras(ctx, W, H, t, t0, t1, txt = 'K.O.!') {
  const a = 1 - rango(t, t1 - 0.25, t1); if (t < t0 || a <= 0) return;
  const paso = Math.min(0.1, 0.86 / txt.length), tam = W * 0.16 * paso / 0.1, d = Math.min(0.09, 0.6 / txt.length);
  [...txt].forEach((l, i) => { if (l === ' ') return; const k = rango(t, t0 + i * d, t0 + i * d + 0.14); if (k <= 0) return; const e = 1 + (1 - ease(k)) * 3; ctx.save(); ctx.translate(W * (0.5 + (i - (txt.length - 1) / 2) * paso), H * 0.42); ctx.scale(e, e); ctx.rotate(-0.08); texto(ctx, l, 0, 0, tam, i === txt.length - 1 ? '#ff5a3a' : '#ffd23a', k * a, { borde: '#5a0d00', ancho: 0.12 }); ctx.restore(); });
}
function destello(ctx, W, H, t, t0, dur = 0.3, color = '#fff') { if (t < t0 || t > t0 + dur) return; ctx.save(); ctx.globalAlpha = 1 - rango(t, t0, t0 + dur); ctx.fillStyle = color; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore(); }
function estallar(st, x, y, W, n, colores, tipo = 'circ', fuerza = 600) { for (let i = 0; i < n; i++) { const a = azar(0, 6.28), v = azar(fuerza * 0.2, fuerza); st.ps.push(part({ x: x + azar(-W * 0.04, W * 0.04), y: y + azar(-W * 0.06, W * 0.04), vx: Math.cos(a) * v, vy: Math.sin(a) * v - fuerza * 0.2, ay: tipo === 'circ' || tipo === 'punto' ? -40 : 900, vida: azar(0.8, 1.6), r: W * azar(0.008, 0.02), tipo, c: colores[i % colores.length], c2: '#fff', brillo: tipo === 'circ', vr: azar(-8, 8), largo: 0.04 })); } }
function gemaCae(ctx, W, H, t, t0, src, color) {
  if (t < t0) return; const k = ease(rango(t, t0, t0 + 0.7)), y = -H * 0.1 + (H * 0.5 - -H * 0.1) * k + Math.sin((t - t0) * 4) * H * 0.012 * k;
  brilloRadial(ctx, W / 2, y, W * (0.1 + 0.04 * Math.sin(t * 6)), color, 0.7);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35; ctx.translate(W / 2, y); ctx.rotate(t * 1.5); ctx.fillStyle = color; for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.fillRect(0, -2, W * 0.12, 4); } ctx.restore();
  const im = img(src); if (im.complete) { ctx.save(); ctx.imageSmoothingEnabled = false; const s = W * 0.11; ctx.drawImage(im, W / 2 - s / 2, y - s / 2, s, s); ctx.restore(); }
}
// Derrota de un jefe de mundo: misma estructura, cambia el ambiente (5,5 s)
function derrotaJefe(j) {
  const E = ENV[j.id];
  return {
    nombre: `${j.nombre} · Derrota`, dur: 5.5,
    escenas: [[0, 0.5, '¡Golpe final!', 'El último acierto congela la pantalla con un destello.'], [0.5, 1.8, 'Tambaleo', 'El jefe se sacude y parpadea en rojo mientras el ambiente reacciona.'], [1.8, 2.8, 'Cae y K.O.', 'Se desploma, se deshace en partículas de su mundo y golpean las letras K.O.!'], [2.8, 4.4, 'La gema', `Cae su gema (${j.gema}) girando con brillo.`], [4.4, 5.5, '¡Victoria!', 'Mensaje de victoria y vuelta al mundo.']],
    dibujar(ctx, W, H, t, st) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, E.g[0]); g.addColorStop(1, E.g[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      st.n++; E.fondo(ctx, W, H, t, st);
      ctx.save(); sacudir(ctx, st, W, t > 0.5 && t < 1.8 ? 0.8 : t > 1.8 && t < 2.1 ? 1.4 : 0);
      if (t < 2.4) {
        const cae = ease(rango(t, 1.8, 2.3)), rojo = t > 0.5 && t < 1.8 && Math.floor(t * 10) % 2 === 0;
        sprite(ctx, j.frente, W / 2 + (t < 1.8 ? Math.sin(t * 40) * W * 0.006 : 0), H * (0.55 + 0.25 * cae), H * 0.75, { rot: cae * 1.3, brillo: rojo ? 0.5 : t < 0.15 ? 0.8 : 0, color: rojo ? '#ff3020' : '#ffffff', alfa: 1 - rango(t, 2.2, 2.4) });
      }
      if (t > 0.5 && !st.golpe) { st.golpe = true; estallar(st, W / 2, H * 0.5, W, 20, ['#fff6b0', '#ffd23a'], 'raya', 700); }
      if (t > 1.0 && t < 1.8 && st.n % 4 === 0) estallar(st, W / 2, H * 0.75, W, 3, E.polvo[1], E.polvo[0], 350);
      if (t > 2.2 && !st.disuelto) { st.disuelto = true; estallar(st, W / 2, H * 0.65, W, 50, [E.disuelve, '#ffffff'], 'circ', 500); estallar(st, W / 2, H * 0.8, W, 30, E.polvo[1], E.polvo[0], 600); }
      ctx.restore();
      destello(ctx, W, H, t, 0, 0.35); destello(ctx, W, H, t, 2.2, 0.25);
      texto(ctx, '¡GOLPE FINAL!', W / 2, H * 0.2, W * 0.04, '#ffd27a', rango(t, 0.05, 0.2) * (1 - rango(t, 1.5, 1.8)), { brillo: '#ff8a1a' });
      koLetras(ctx, W, H, t, 2.0, 3.2);
      gemaCae(ctx, W, H, t, 3.0, j.gemaImg, j.color);
      const ag = rango(t, 3.6, 3.9) * (1 - rango(t, 5.2, 5.5));
      texto(ctx, j.nueva ? '¡Nueva gema!' : 'Gema del jefe', W / 2, H * 0.2, W * 0.035, '#ffd27a', ag, { brillo: j.color });
      texto(ctx, j.nueva ? j.gema : `${j.gema} · ya está en tu álbum`, W / 2, H * 0.72, W * 0.03, '#ffffff', ag, { brillo: j.color });
      texto(ctx, '¡VICTORIA!', W / 2, H * 0.84, W * 0.026, '#9fe8a8', rango(t, 4.4, 4.7) * (1 - rango(t, 5.2, 5.5)), { ancho: 0.15 });
    },
  };
}

// Derrota de un dios del Altar (7,5 s): colapso propio + su alma va al círculo del juicio + fragmento divino
const RELIQ = { cerbero: ['🐺', 'Collar de Cerbero'], vampira: ['🦇', 'Capa de Lilith'], ciclope: ['👁️', 'Ojo de Polifemo'], segador: ['⏳', 'Reloj de Tánatos'], golem: ['🗿', 'Corazón del Gólem'] };
const COLAPSO = {
  cerbero(ctx, W, H, t, st, D) { // los ojos de las tres cabezas se apagan uno a uno y el fuego se vuelve humo
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120203'); g.addColorStop(1, '#2a0a08'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    braseros(ctx, W, H, t < 2.6 ? 99 : 99, st, '#ff4a1a', t < 2.6 ? 0 : 99);
    if (t > 2.6 && st.n % 2 === 0) for (const x of [0.1, 0.9]) st.ps.push(part({ x: W * x, y: H * 0.68, vy: azar(-90, -40), vx: azar(-10, 10), vida: 1.6, r: W * 0.04, tipo: 'circ', c: 'rgba(90,80,90,.5)', a: 0.6 }));
    if (t < 3.1) sprite(ctx, D.frente, W / 2 + Math.sin(t * 30) * W * 0.004, H * 0.55, H * 0.8, { sombra: 0.4 * rango(t, 0.5, 3.0), alfa: 1 - rango(t, 2.9, 3.1) });
    for (let k = 0; k < 3; k++) { const apaga = 0.8 + k * 0.6, on = 1 - rango(t, apaga, apaga + 0.15); ojos(ctx, W * (0.42 + k * 0.08), H * 0.28 - (k === 1 ? H * 0.04 : 0), W * 0.008, '#ff2a1a', on); if (t > apaga && !st['c' + k]) { st['c' + k] = true; estallar(st, W * (0.42 + k * 0.08), H * 0.28, W, 10, ['rgba(120,110,120,.6)'], 'circ', 120); } }
    if (t > 3.0 && !st.fin) { st.fin = true; estallar(st, W / 2, H * 0.55, W, 60, ['#ff4a3a', '#ffb030'], 'circ', 500); }
  },
  vampira(ctx, W, H, t, st, D) { // la luna roja se vuelve luz de amanecer, los murciélagos huyen y ella se deshace en pétalos
    const am = rango(t, 0.5, 3.0);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, am > 0.5 ? '#3a2a5a' : '#0d0218'); g.addColorStop(1, am > 0.5 ? '#ffb27a' : '#2a0820'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = am; const g2 = ctx.createLinearGradient(0, 0, 0, H); g2.addColorStop(0, '#5a4a8a'); g2.addColorStop(1, '#ffc88a'); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H); ctx.restore();
    const r = Math.round(200 + 55 * am), gg = Math.round(32 + 200 * am), b = Math.round(58 + 170 * am);
    brilloRadial(ctx, W * 0.72, H * 0.3, W * 0.25, `rgb(${r},${gg},${b})`, 0.6); ctx.fillStyle = `rgb(${r},${gg},${b})`; ctx.beginPath(); ctx.arc(W * 0.72, H * 0.3, H * 0.15, 0, 7); ctx.fill();
    if (am > 0.3) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25 * am; ctx.fillStyle = '#fff3c0'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(W * 0.72, H * 0.3); ctx.lineTo(W * (0.1 + i * 0.18), H); ctx.lineTo(W * (0.16 + i * 0.18), H); ctx.fill(); } ctx.restore(); }
    if (!st.bats) st.bats = Array.from({ length: 40 }, () => ({ a: azar(0, 6.28), v: azar(0.6, 1.4), s: azar(0.6, 1.2) }));
    const huye = rango(t, 0.6, 2.6); if (huye < 1) for (const bt of st.bats) { const d = W * (0.12 + huye * 0.8 * bt.v); murcielago(ctx, W / 2 + Math.cos(bt.a) * d, H * 0.5 + Math.sin(bt.a) * d * 0.6, W * 0.013 * bt.s, Math.sin(t * 25 + bt.a) * 0.8, '#5a1a4a'); }
    if (t < 3.0) sprite(ctx, D.frente, W / 2, H * 0.56, H * 0.8, { brillo: 0.5 * am, color: '#ffe8c0', alfa: 1 - rango(t, 2.8, 3.0) });
    if (t > 2.9 && !st.fin) { st.fin = true; estallar(st, W / 2, H * 0.55, W, 70, ['#ff3a6a', '#8a0a2a', '#ffd0e0'], 'petalo', 500); }
  },
  ciclope(ctx, W, H, t, st, D) { // se petrifica a sí mismo, se agrieta y estalla en esquirlas de obsidiana
    ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, W, H); brilloRadial(ctx, W / 2, H * 0.5, W * 0.4, '#ff8a1a', 0.3 * (1 - rango(t, 1, 3)));
    const pet = rango(t, 0.5, 2.0);
    if (t < 3.0) {
      sprite(ctx, D.frente, W / 2 + (t > 2.0 ? Math.sin(t * 60) * W * 0.004 : 0), H * 0.56, H * 0.8, { brillo: 0.65 * pet, color: '#8a8a8a' });
      const k = rango(t, 1.8, 2.9); ctx.save(); ctx.strokeStyle = '#ffb060'; ctx.shadowColor = '#ff6a00'; ctx.shadowBlur = 10; ctx.lineWidth = 2.5;
      for (let i = 0; i < 8; i++) { const a = i * 0.8; ctx.beginPath(); ctx.moveTo(W / 2, H * 0.45); let x = W / 2, y = H * 0.45; for (let s = 0; s < 4; s++) { x += Math.cos(a + Math.sin(i + s)) * W * 0.03 * k; y += Math.sin(a + Math.sin(i * 2 + s)) * H * 0.06 * k; ctx.lineTo(x, y); } ctx.stroke(); }
      ctx.restore();
    }
    if (t > 2.9 && !st.fin) { st.fin = true; estallar(st, W / 2, H * 0.55, W, 60, ['#1c1a22', '#2a2630', '#ff8a1a'], 'esquirla', 700); }
  },
  segador(ctx, W, H, t, st, D) { // el reloj de arena se rompe, el tiempo vuelve a correr y la guadaña cae
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#02100f'); g.addColorStop(1, '#06242a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const rompe = t > 1.6;
    ctx.save(); ctx.translate(W * 0.82, H * 0.5); ctx.strokeStyle = '#c9a46b'; ctx.lineWidth = W * 0.005; ctx.strokeRect(-W * 0.06, -H * 0.2, W * 0.12, H * 0.4);
    if (!rompe) { ctx.fillStyle = 'rgba(160,240,235,.2)'; ctx.fillRect(-W * 0.05, -H * 0.19, W * 0.1, H * 0.38); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; const k = rango(t, 0.7, 1.6); ctx.beginPath(); ctx.moveTo(0, -H * 0.05); ctx.lineTo(-W * 0.03 * k, -H * 0.12 * k); ctx.moveTo(0, -H * 0.05); ctx.lineTo(W * 0.035 * k, H * 0.1 * k); ctx.stroke(); }
    ctx.restore();
    if (rompe && !st.vidrio) { st.vidrio = true; estallar(st, W * 0.82, H * 0.5, W, 30, ['rgba(200,250,245,.9)'], 'esquirla', 500); for (let i = 0; i < 60; i++) st.ps.push(part({ x: W * 0.82 + azar(-W * 0.03, W * 0.03), y: H * 0.5, vx: azar(-150, 150), vy: azar(-100, 50), ay: 700, vida: 1.5, r: 2, tipo: 'punto', c: '#e6c27a' })); }
    if (t < 3.0) sprite(ctx, D.frente, W * 0.45, H * 0.56, H * 0.8, { alfa: 1 - rango(t, 2.2, 3.0), brillo: 0.4 * rango(t, 1.6, 2.6), color: '#4ae0d0' });
    if (t > 2.2 && t < 3.0 && st.n % 1 === 0) st.ps.push(part({ x: W * 0.45 + azar(-W * 0.08, W * 0.08), y: H * azar(0.3, 0.8), vy: azar(-200, -80), vida: 1.4, r: W * 0.02, tipo: 'circ', c: '#4ae0d0', c2: '#fff', brillo: true }));
    const cae = ease(rango(t, 2.4, 2.9)); if (t > 2.3) { ctx.save(); ctx.translate(W * 0.3, H * (0.4 + 0.45 * cae)); ctx.rotate(-0.6 + cae * 1.9); ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = W * 0.008; ctx.beginPath(); ctx.moveTo(0, -H * 0.2); ctx.lineTo(0, H * 0.2); ctx.stroke(); ctx.strokeStyle = '#d8e8e6'; ctx.lineWidth = W * 0.006; ctx.beginPath(); ctx.arc(-W * 0.06, -H * 0.2, W * 0.06, -0.3, Math.PI * 0.4); ctx.stroke(); ctx.restore(); }
  },
  golem(ctx, W, H, t, st, D) { // los bloques se desarman y las almas perdidas quedan libres
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#020c06'); g.addColorStop(1, '#0a2414'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (t < 2.0) sprite(ctx, D.frente, W / 2 + Math.sin(t * 35) * W * 0.005 * rango(t, 0.5, 2), H * 0.56, H * 0.8, { brillo: 0.3 * Math.abs(Math.sin(t * 8)), color: '#5aff8a' });
    if (t > 1.9 && !st.bloques) { st.bloques = true; for (let i = 0; i < 16; i++) st.ps.push(part({ x: W / 2 + ((i % 3) - 1) * W * 0.06, y: H * (0.3 + Math.floor(i / 3) * 0.1), vx: azar(-300, 300), vy: azar(-300, -50), ay: 1300, vida: 1.6, r: W * 0.03, tipo: 'cuad', c: '#4a5a4e', vr: azar(-5, 5) })); }
    if (t > 2.0 && t < 3.6 && st.n % 1 === 0) st.ps.push(part({ x: W / 2 + azar(-W * 0.15, W * 0.15), y: H * azar(0.4, 0.8), vx: azar(-40, 40), vy: azar(-260, -120), vida: 1.6, r: W * 0.025, tipo: 'circ', c: '#5aff8a', c2: '#fff', brillo: true }));
  },
};
function derrotaDios(D, n) {
  const [ico, rel] = RELIQ[D.id];
  return {
    nombre: `${D.nombre} · Derrota`, dur: 7.5,
    escenas: [[0, 0.5, '¡Golpe final!', 'Destello y cámara lenta.'], [0.5, 3.2, 'El colapso', TXT_DERROTA_DIOS[D.id]], [3.2, 4.2, 'Dios vencido', 'Golpean las letras «DIOS VENCIDO».'], [4.2, 5.8, 'Su alma al círculo', `Su alma sube hacia el círculo del juicio: ${n} de 5 almas reunidas.`], [5.8, 7.5, 'Fragmento divino', `Recompensa: fragmento del ${rel}.${n === 5 ? ' Al estar las 5 almas, Hades despierta.' : ''}`]],
    dibujar(ctx, W, H, t, st) {
      st.n++;
      ctx.save(); sacudir(ctx, st, W, t > 0.5 && t < 3.0 ? 0.5 : 0);
      COLAPSO[D.id](ctx, W, H, t, st, D);
      ctx.restore();
      destello(ctx, W, H, t, 0, 0.4, D.color); destello(ctx, W, H, t, 2.95, 0.3);
      texto(ctx, '¡GOLPE FINAL!', W / 2, H * 0.18, W * 0.04, '#ffd27a', rango(t, 0.05, 0.2) * (1 - rango(t, 1.3, 1.6)), { brillo: D.color });
      koLetras(ctx, W, H, t, 3.2, 4.3, 'DIOS VENCIDO');
      // el alma sube al círculo del juicio
      if (t > 4.1 && t < 7.4) {
        const k = ease(rango(t, 4.2, 5.4)), x = W / 2, y = H * 0.62 - k * H * 0.42;
        brilloRadial(ctx, x, y, W * 0.07, D.color, 0.95 * (1 - rango(t, 7.0, 7.4))); if (st.n % 1 === 0 && k < 1) st.ps.push(part({ x, y, vida: 0.6, r: W * 0.02, tipo: 'circ', c: D.color, brillo: true }));
        texto(ctx, 'ALMAS EN EL CÍRCULO DEL JUICIO', W / 2, H * 0.36, W * 0.017, '#e8dcff', rango(t, 4.4, 4.7) * (1 - rango(t, 7.1, 7.4)), { esp: W * 0.004, ancho: 0.15 });
        COL5.forEach((c, i) => { const lleno = i < n - 1 || (i === n - 1 && t > 5.4); ctx.save(); ctx.globalAlpha = rango(t, 4.4, 4.7) * (1 - rango(t, 7.1, 7.4)); ctx.translate(W * (0.4 + i * 0.05), H * 0.43); ctx.rotate(Math.PI / 4); ctx.fillStyle = lleno ? c : '#2c2440'; ctx.strokeStyle = lleno ? '#fff' : '#4a3e66'; ctx.lineWidth = 2; ctx.fillRect(-W * 0.012, -W * 0.012, W * 0.024, W * 0.024); ctx.strokeRect(-W * 0.012, -W * 0.012, W * 0.024, W * 0.024); ctx.restore(); });
      }
      const ar = rango(t, 5.8, 6.1) * (1 - rango(t, 7.2, 7.5));
      texto(ctx, ico, W / 2, H * 0.62, W * 0.07, '#ffffff', ar);
      texto(ctx, `Fragmento divino · ${rel}`, W / 2, H * 0.76, W * 0.026, '#ffd27a', ar, { ancho: 0.15 });
      if (n === 5) texto(ctx, 'El círculo del juicio está completo… algo despierta en el centro del altar', W / 2, H * 0.86, W * 0.018, '#c89aff', rango(t, 6.3, 6.6) * (1 - rango(t, 7.2, 7.5)), { ancho: 0.15 });
    },
  };
}
const TXT_DERROTA_DIOS = { cerbero: 'Los ojos de las tres cabezas se apagan uno a uno, los braseros quedan en humo y Cerbero se deshace en brasas.', vampira: 'La luna roja se vuelve luz de amanecer, los murciélagos huyen y Lilith se deshace en pétalos.', ciclope: 'Su propia mirada lo petrifica: se pone gris, se agrieta y estalla en esquirlas de obsidiana.', segador: 'El reloj de arena se rompe, el tiempo vuelve a correr, Tánatos se vuelve almas y su guadaña cae al suelo.', golem: 'Los bloques de piedra se desarman y las almas perdidas que lo formaban quedan libres.' };

// ---------------- Derrota de Hades: el final del juego (18 s) ----------------
const HADES_FIN = {
  nombre: 'Hades · Derrota final', dur: 18,
  escenas: [
    [0, 1.4, 'El último acierto', 'Todo se congela en cámara lenta: «¡GOLPE FINAL!».'],
    [1.4, 3.2, 'El tridente cae', 'Hades se tambalea, suelta el tridente y se le abren grietas de luz.'],
    [3.2, 5.2, 'Sus últimas palabras', 'Hades cae de rodillas y habla por última vez.'],
    [5.2, 7.4, 'Las almas se liberan', 'Las almas de Cerbero, Lilith, Polifemo, Tánatos y el Gólem salen de él una a una.'],
    [7.4, 8.2, 'Estallido de luz', 'Hades estalla en luz blanca.'],
    [8.2, 10.6, 'Amanece en el Altar', 'El inframundo morado se vuelve un cielo dorado y el pentagrama se apaga.'],
    [10.6, 13.2, 'Fin del juego', '«¡HADES HA SIDO DERROTADO!» y «Completaste Math World».'],
    [13.2, 15.6, 'Recompensas', 'Fragmento del Tridente de Hades, título «Vencedor del Inframundo» y se alza la Torre de los Dioses.'],
    [15.6, 18, '¡Felicidades!', 'Fuegos artificiales con los colores de los cinco dioses.'],
  ],
  dibujar(ctx, W, H, t, st) {
    const D = dios('hades'), cx = W / 2, cy = H * 0.5; st.n++;
    // cielo: de inframundo a amanecer dorado
    const am = ease(rango(t, 8.2, 10.4));
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#06000c'); g.addColorStop(1, '#1a0630'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (am > 0) { ctx.save(); ctx.globalAlpha = am; const g2 = ctx.createLinearGradient(0, 0, 0, H); g2.addColorStop(0, '#5a7ad8'); g2.addColorStop(0.55, '#ffc88a'); g2.addColorStop(1, '#ffe8b0'); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H); ctx.restore(); sol(ctx, W / 2, H * (0.95 - 0.45 * am), H * 0.2, '#fff3c0'); }
    // pentagrama que se apaga
    const penta = 1 - rango(t, 8.2, 9.6);
    if (penta > 0) { ctx.save(); ctx.translate(cx, H * 0.82); ctx.scale(1, 0.3); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = penta; ctx.strokeStyle = '#b05aff'; ctx.shadowColor = '#aa4aff'; ctx.shadowBlur = 16; ctx.lineWidth = 4; const R = W * 0.3; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.stroke(); ctx.beginPath(); [0, 2, 4, 1, 3, 0].forEach((k, i) => { const a = -Math.PI / 2 + k * 1.2566; const x = Math.cos(a) * R * 0.92, y = Math.sin(a) * R * 0.92; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.restore(); }
    ctx.save(); sacudir(ctx, st, W, (t > 1.4 && t < 3.2 ? 0.6 : 0) + (t > 5.2 && t < 7.6 ? 0.4 + rango(t, 5.2, 7.4) : 0));
    // Hades
    if (t < 7.6) {
      const rod = ease(rango(t, 3.2, 3.8)), lento = t < 1.4;
      sprite(ctx, D.frente, cx + (t > 1.4 ? Math.sin(t * 30) * W * 0.004 : 0), cy + H * 0.08 * rod, H * 0.72 * (1 - 0.12 * rod), { brillo: (lento ? 0.25 : 0) + 0.6 * rango(t, 5.2, 7.4), color: '#ffffff', sombra: 0.15 * rango(t, 1.4, 3.0) });
      const k = rango(t, 1.6, 7.2); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#fff'; ctx.shadowColor = '#e0c8ff'; ctx.shadowBlur = 12; ctx.lineWidth = 2 + 2 * k;
      for (let i = 0; i < 12; i++) { const a = i * 0.52; ctx.beginPath(); ctx.moveTo(cx, cy - H * 0.08); let x = cx, y = cy - H * 0.08; for (let s = 0; s < 4; s++) { x += Math.cos(a + Math.sin(i + s) * 0.5) * W * 0.045 * k; y += Math.sin(a + Math.sin(i * 2 + s) * 0.5) * H * 0.07 * k; ctx.lineTo(x, y); } ctx.stroke(); }
      ctx.restore();
      if (t < 1.4) { ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#c8b4ff'; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore(); }
    }
    // el tridente cae y se clava
    if (t > 1.6 && t < 10) { const k = ease(rango(t, 1.6, 2.4)); ctx.save(); ctx.globalAlpha = 1 - rango(t, 8.2, 9.6); ctx.translate(cx + W * 0.2, H * (0.3 + 0.5 * k)); ctx.rotate(0.9 - k * 0.7); ctx.strokeStyle = '#8a7aa6'; ctx.lineWidth = W * 0.008; ctx.beginPath(); ctx.moveTo(0, -H * 0.25); ctx.lineTo(0, H * 0.12); ctx.stroke(); ctx.strokeStyle = '#d8c8ff'; ctx.lineWidth = W * 0.006; ctx.beginPath(); for (const dx of [-1, 0, 1]) { ctx.moveTo(dx * W * 0.025, -H * 0.25); ctx.lineTo(dx * W * 0.025, -H * 0.35); } ctx.moveTo(-W * 0.025, -H * 0.25); ctx.lineTo(W * 0.025, -H * 0.25); ctx.stroke(); ctx.restore(); if (k >= 1 && !st.clava) { st.clava = true; estallar(st, cx + W * 0.2, H * 0.85, W, 20, ['#3a2a4a', '#5a4a6a'], 'cuad', 400); } }
    // almas que salen
    ['Cerbero', 'Lilith', 'Polifemo', 'Tánatos', 'El Gólem'].forEach((nom, i) => {
      const t0 = 5.3 + i * 0.4; if (t < t0) return;
      const k = ease(rango(t, t0, t0 + 1.2)), a = -Math.PI / 2 + (i - 2) * 0.45, x = cx + Math.cos(a) * W * 0.4 * k, y = cy - H * 0.1 + Math.sin(a) * H * 0.55 * k - k * H * 0.1;
      if (t < 10.5) { brilloRadial(ctx, x, y, W * 0.05, COL5[i], 0.95 * (1 - rango(t, 9.8, 10.5))); if (st.n % 2 === 0) st.ps.push(part({ x, y, vida: 0.5, r: W * 0.015, tipo: 'circ', c: COL5[i], brillo: true })); texto(ctx, `${nom} es libre`, x, y + H * 0.08, W * 0.016, COL5[i], rango(t, t0 + 0.3, t0 + 0.6) * (1 - rango(t, 8.0, 8.4)), { ancho: 0.18 }); }
    });
    if (t > 7.4 && !st.boom) { st.boom = true; estallar(st, cx, cy, W, 120, ['#c89aff', '#ffffff', '#e8d8ff'], 'circ', 900); st.ps.push(part({ x: cx, y: cy, vida: 1.2, r: W * 1.2, tipo: 'aro', c: '#ffffff', ancho: 12, crece: 1 })); }
    ctx.restore();
    destello(ctx, W, H, t, 7.4, 0.9);
    if (t > 8.6 && t < 13 && st.n % 2 === 0) st.ps.push(part({ x: azar(0, W), y: H + 5, vy: azar(-140, -60), vida: 2.6, r: W * 0.008, tipo: 'circ', c: '#ffe08a', c2: '#fff', brillo: true }));
    // textos
    texto(ctx, '¡GOLPE FINAL!', W / 2, H * 0.16, W * 0.05, '#ffd27a', rango(t, 0.1, 0.3) * (1 - rango(t, 1.2, 1.5)), { brillo: '#ff8a1a' });
    dialogo(ctx, W, H, t, 3.3, 5.2, 'HADES', 'Imposible… vencido por alguien que domina los números… El inframundo… ya no es mío…');
    narrar(ctx, W, H, t, 8.4, 10.6, 'La luz vuelve al Altar de los Dioses.', '#3a2a10');
    const af = rango(t, 10.6, 11.0) * (1 - rango(t, 12.9, 13.2));
    if (af > 0) { ctx.save(); ctx.translate(W / 2, H * 0.36); const e = 1 + (1 - ease(rango(t, 10.6, 10.9))) * 1.5; ctx.scale(e, e); texto(ctx, '¡HADES HA SIDO DERROTADO!', 0, 0, W * 0.052, '#ffffff', af, { brillo: '#ffb030', borde: '#3a1a00' }); ctx.restore(); }
    texto(ctx, 'Completaste Math World', W / 2, H * 0.5, W * 0.036, '#3a1a00', rango(t, 11.4, 11.8) * (1 - rango(t, 12.9, 13.2)), { borde: '#fff3c0', ancho: 0.1 });
    // recompensas y la Torre
    if (t > 13.2 && t < 18) {
      const a = 1 - rango(t, 17.6, 18), k = ease(rango(t, 13.4, 15.0)), ar = 1 - rango(t, 15.3, 15.6);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#3a3a5a'; const tw = W * 0.08, th = H * 0.62 * k; ctx.fillRect(W * 0.78 - tw / 2, H - th, tw, th); ctx.beginPath(); ctx.moveTo(W * 0.78 - tw * 0.7, H - th); ctx.lineTo(W * 0.78, H - th - H * 0.1 * k); ctx.lineTo(W * 0.78 + tw * 0.7, H - th); ctx.fill(); ctx.fillStyle = '#ffe08a'; for (let i = 0; i < 5; i++) if (H - th + H * (0.06 + i * 0.1) < H) ctx.fillRect(W * 0.78 - W * 0.008, H - th + H * (0.06 + i * 0.1), W * 0.016, H * 0.03); ctx.restore();
      brilloRadial(ctx, W * 0.78, H - H * 0.62 * k - H * 0.05, W * 0.08, '#8fd8ff', 0.6 * k * a);
      texto(ctx, '🔱', W * 0.33, H * 0.38, W * 0.08, '#fff', rango(t, 13.3, 13.6) * ar);
      texto(ctx, 'Fragmento del Tridente de Hades', W * 0.33, H * 0.53, W * 0.024, '#3a1a00', rango(t, 13.4, 13.7) * ar, { borde: '#fff3c0', ancho: 0.12 });
      texto(ctx, 'Título: «Vencedor del Inframundo»', W * 0.33, H * 0.62, W * 0.024, '#3a1a00', rango(t, 14.0, 14.3) * ar, { borde: '#fff3c0', ancho: 0.12 });
      texto(ctx, 'Se alza la Torre de los Dioses', W * 0.33, H * 0.71, W * 0.024, '#3a1a00', rango(t, 14.6, 14.9) * ar, { borde: '#fff3c0', ancho: 0.12 });
    }
    if (t > 15.6) {
      if (st.n % 12 === 0) { const x = azar(W * 0.15, W * 0.85), y = azar(H * 0.12, H * 0.45); estallar(st, x, y, W, 36, [COL5[st.n % 5], '#ffffff'], 'circ', 380); }
      texto(ctx, '¡FELICIDADES!', W / 2, H * 0.55, W * 0.08, '#ffffff', rango(t, 15.7, 16.0) * (1 - rango(t, 17.6, 18)), { brillo: '#ffb030', borde: '#3a1a00' });
      texto(ctx, 'La Torre de los Dioses te espera', W / 2, H * 0.68, W * 0.026, '#3a1a00', rango(t, 16.2, 16.5) * (1 - rango(t, 17.6, 18)), { borde: '#fff3c0', ancho: 0.12 });
    }
  },
};
const DERROTAS = {};
function armarDerrotas() {
  DATOS.J.forEach((j) => { DERROTAS['J' + j.id] = derrotaJefe(j); });
  ['cerbero', 'vampira', 'ciclope', 'segador', 'golem'].forEach((id, i) => { DERROTAS['D' + id] = derrotaDios(dios(id), i + 1); });
  DERROTAS.hades = HADES_FIN;
}


// ===================== En el juego: datos con los sprites reales, superposición y API =====================
// Las hojas de personajes y enemigos son LPC de 9 × 4 cuadros de 64 px: fila 1 mira a la izquierda, 2 al frente y 3 a la derecha.
const FILA = { izq: 1, frente: 2, der: 3 };
const hoja = (ruta, lado) => `${ruta}#${FILA[lado]}`;
const ENE = (n) => `assets/enemigos/${n}.png`;
const JEFES_CINE = [
  // id, hoja, nombre, subtítulo, ancestral, color, gema (icono), nombre de la gema, fases
  ['u1', 'jefe_u1', 'Troll Guardián del Bosque', 'Jefe del mundo · Unidad 1', false, '#6f8f5a', 'troll', 'Esmeralda del Troll'],
  ['u2', 'jefe_u2', 'Rey Lagarto de las Dunas', 'Jefe del mundo · Unidad 2', false, '#c9a46b', 'lagarto', 'Ámbar de las Dunas'],
  ['u3', 'jefe_u3', 'Minotauro de las Profundidades', 'Jefe del mundo · Unidad 3', false, '#8a7aa6', 'minotauro', 'Amatista del Laberinto'],
  ['u4', 'jefe_u4', 'Yeti, Rey de la Escarcha', 'Jefe del mundo · Unidad 4', false, '#9fc6e6', 'yeti', 'Zafiro de Escarcha'],
  ['rey', 'jefe_u1b', 'Rey Jabalí Ancestral', 'Jefe ancestral · Bosque profundo', true, '#7fae4a', 'raices', 'Jade de Raíces', 3],
  ['faraon', 'jefe_u2b', 'Faraón de las Arenas Eternas', 'Jefe ancestral · Valle de la Esfinge', true, '#e0b040', 'faraon', 'Lapislázuli del Faraón', 4],
  ['coloso', 'jefe_u3b', 'Coloso de Magma', 'Jefe ancestral · Profundidades de la mina', true, '#ff6a2a', 'magma', 'Rubí de Magma', 3],
  ['dragon', 'jefe_u4b', 'Dragón de la Aurora', 'Jefe ancestral · Cima del Glaciar', true, '#7ad6c8', 'aurora', 'Ópalo de Aurora', 4],
];
const DIOSES_CINE = [
  ['cerbero', 'Cerbero, Guardián de la Puerta', '#ff4a3a'], ['vampira', 'Lilith, Reina de la Noche', '#ff3a8a'],
  ['ciclope', 'Polifemo, el Cíclope de Obsidiana', '#ff8a1a'], ['segador', 'Tánatos, el Segador de Almas', '#4ae0d0'],
  ['golem', 'El Gólem de las Almas Perdidas', '#5aff8a'], ['hades', 'Hades, Dios del Inframundo', '#aa4aff'],
];
const DATOS = {
  J: JEFES_CINE.map(([id, h, nombre, sub, anc, color, g, gema, fases]) => ({ id, nombre, sub, anc, color, fases, gema, frente: hoja(ENE(h), 'frente'), izq: hoja(ENE(h), 'izq'), gemaImg: `assets/iconos/gjefe_${g}.png`, nueva: true })),
  D: DIOSES_CINE.map(([id, nombre, color]) => ({ id, nombre, color, frente: hoja(ENE(`altar_${id}`), 'frente'), izq: hoja(ENE(`altar_${id}`), 'izq') })),
};
armarDerrotas();

const CSS = "#cine .cine-capa { position: absolute; inset: 0; pointer-events: none; opacity: 0; }\n#cine .pantalla.run .cine-capa { opacity: 1; }\n#cine img.px { image-rendering: pixelated; display: block; }\n#cine .banda { position: absolute; left: 0; right: 0; height: 12%; background: #000; z-index: 20; }\n#cine .banda.arriba { top: 0; transform: translateY(-100%); }\n#cine .banda.abajo { bottom: 0; transform: translateY(100%); }\n\n\n#cine .A .oscuro { position: absolute; inset: 0; background: radial-gradient(ellipse at 62% 55%, rgba(0,0,0,.15), rgba(0,0,0,.92) 70%); opacity: 0; }\n#cine .A .silueta { position: absolute; left: 50%; top: 52%; width: 34cqw; transform: translate(-50%, -50%) scale(.6); filter: brightness(0); opacity: 0; }\n#cine .A .ojos { position: absolute; left: 50%; top: 40%; transform: translateX(-50%); display: flex; gap: 3cqw; opacity: 0; z-index: 3; }\n#cine .A .ojos i { width: 1.4cqw; height: .8cqw; border-radius: 50%; background: var(--jc, #ff3a2a); box-shadow: 0 0 2cqw 1cqw var(--jc, #ff3a2a); }\n#cine .A .lado { position: absolute; top: 0; bottom: 0; width: 58%; display: flex; align-items: center; overflow: hidden; z-index: 4; }\n#cine .A .lado.izq { left: 0; clip-path: polygon(0 0, 100% 0, 86% 100%, 0 100%); background: linear-gradient(120deg, #1d4f6e, #0e2433); transform: translateX(-105%); justify-content: flex-start; padding-left: 4cqw; }\n#cine .A .lado.der { right: 0; clip-path: polygon(14% 0, 100% 0, 100% 100%, 0 100%); background: linear-gradient(240deg, var(--jc2, #6a1e14), #1a0a08); transform: translateX(105%); justify-content: flex-end; padding-right: 3cqw; }\n#cine .A .cine-equipo { display: grid; grid-template-columns: repeat(3, 8.5cqw); gap: .5cqw 1cqw; }\n#cine .A .cine-equipo.solo { grid-template-columns: 20cqw; }\n#cine .A .cine-equipo.solo img { width: 20cqw; }\n#cine .A .cine-equipo img { width: 8.5cqw; filter: drop-shadow(0 .4cqw 0 rgba(0,0,0,.4)); }\n#cine .A .cine-equipo .n { grid-column: 1 / -1; font-family: var(--f-pixel); font-size: 2.2cqw; color: #bfe6ff; text-shadow: 0 .3cqw 0 #000; }\n#cine .A .jefe-gr { width: 34cqw; filter: drop-shadow(0 0 2cqw var(--jc, #f33)); }\n#cine .A .vs { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) scale(5) rotate(-12deg); font-family: var(--f-pixel); font-weight: 700; font-size: 12cqw; color: var(--oro); -webkit-text-stroke: .5cqw #4a1500; paint-order: stroke fill; text-shadow: 0 .8cqw 0 #200; opacity: 0; z-index: 6; }\n#cine .A .ficha { position: absolute; right: 4cqw; bottom: 15%; text-align: right; z-index: 7; opacity: 0; transform: translateX(6cqw); }\n#cine .A .ficha small { display: block; font-family: var(--f-pixel); font-size: 1.8cqw; letter-spacing: .1em; color: var(--jc, #ffb); text-transform: uppercase; }\n#cine .A .ficha b { display: block; font-family: var(--f-pixel); font-size: 4cqw; line-height: 1; text-shadow: 0 .4cqw 0 #000; }\n#cine .A .ficha .vida { margin-top: 1cqw; height: 1.6cqw; width: 34cqw; margin-left: auto; background: #2a0d0a; border: .3cqw solid #000; border-radius: .6cqw; overflow: hidden; }\n#cine .A .ficha .vida i { display: block; height: 100%; width: 0; background: linear-gradient(#ff7a5a, #d22a1a); }\n#cine .A .ficha .fases { margin-top: .8cqw; display: flex; gap: .6cqw; justify-content: flex-end; font-size: 1.6cqw; font-weight: 800; color: var(--oro); }\n#cine .A .ficha .fases span { border: .2cqw solid var(--oro); border-radius: .5cqw; padding: 0 .7cqw; }\n#cine .A .grito { position: absolute; left: 50%; top: 46%; transform: translate(-50%, -50%) scale(3); font-family: var(--f-pixel); font-weight: 700; font-size: 9cqw; color: #fff; -webkit-text-stroke: .5cqw #000; paint-order: stroke fill; opacity: 0; z-index: 9; white-space: nowrap; }\n#cine .A .flash, #cine .B .flash { position: absolute; inset: 0; background: #fff; opacity: 0; z-index: 15; }\n#cine .A .anc { position: absolute; left: 50%; top: 14%; transform: translateX(-50%); font-family: var(--f-pixel); font-size: 2.4cqw; color: var(--oro); letter-spacing: .3em; opacity: 0; z-index: 8; white-space: nowrap; }\n\n#cine .pantalla.A.run .banda.arriba, #cine .pantalla.B.run .banda.arriba { animation: banda-in 4.2s both; }\n#cine .pantalla.A.run .banda.abajo, #cine .pantalla.B.run .banda.abajo { animation: banda-in2 4.2s both; }\n#cine .pantalla.B.run .banda.arriba { animation-duration: 2.6s; } #cine .pantalla.B.run .banda.abajo { animation-duration: 2.6s; }\n#cine .pantalla.B.leyenda.run .banda.arriba, #cine .pantalla.B.leyenda.run .banda.abajo { animation-duration: 3.1s; }\n@keyframes banda-in { 0% { transform: translateY(-100%); } 8%, 90% { transform: translateY(0); } 100% { transform: translateY(-100%); } }\n@keyframes banda-in2 { 0% { transform: translateY(100%); } 8%, 90% { transform: translateY(0); } 100% { transform: translateY(100%); } }\n#cine .A.run .lado.izq { animation: a-izq 4.2s cubic-bezier(.2,.9,.3,1) both; }\n#cine .A.run .lado.der { animation: a-der 4.2s cubic-bezier(.2,.9,.3,1) both; }\n@keyframes a-izq { 0%, 45% { transform: translateX(-105%); } 52%, 84% { transform: translateX(0); } 89%, 100% { transform: translateX(-105%); } }\n@keyframes a-der { 0%, 45% { transform: translateX(105%); } 52%, 84% { transform: translateX(0); } 89%, 100% { transform: translateX(105%); } }\n#cine .A.run .vs { animation: a-vs 4.2s both; }\n@keyframes a-vs { 0%, 51% { opacity: 0; transform: translate(-50%, -50%) scale(5) rotate(-12deg); } 55% { opacity: 1; transform: translate(-50%, -50%) scale(.9) rotate(-8deg); } 58%, 84% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(-8deg); } 87%, 100% { opacity: 0; } }\n#cine .A.run .ficha { animation: a-ficha 4.2s both; }\n@keyframes a-ficha { 0%, 56% { opacity: 0; transform: translateX(6cqw); } 61%, 84% { opacity: 1; transform: none; } 88%, 100% { opacity: 0; } }\n#cine .A.run .ficha .vida i { animation: a-vida 4.2s both; }\n@keyframes a-vida { 0%, 61% { width: 0; } 73%, 100% { width: 100%; } }\n#cine .A.run .anc { animation: a-anc 4.2s both; }\n@keyframes a-anc { 0%, 8% { opacity: 0; letter-spacing: 1em; } 16%, 41% { opacity: 1; letter-spacing: .3em; } 45%, 100% { opacity: 0; } }\n#cine .A.run .grito { animation: a-grito 4.2s both; }\n@keyframes a-grito { 0%, 86% { opacity: 0; transform: translate(-50%, -50%) scale(3); } 89% { opacity: 1; transform: translate(-50%, -50%) scale(.95); } 91%, 97% { opacity: 1; transform: translate(-50%, -50%) scale(1); } 100% { opacity: 0; } }\n#cine .A.run .flash { animation: a-flash 4.2s both; }\n@keyframes a-flash { 0%, 49% { opacity: 0; } 50% { opacity: .9; } 54%, 86% { opacity: 0; } 87% { opacity: .7; } 92%, 100% { opacity: 0; } }\n#cine .cv { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }\n#cine .A .cv { z-index: 2; }\n#cine .B .cv { z-index: 7; }\n\n\n#cine .B .tinte { position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--hc) 35%, transparent), rgba(0,0,0,.85)); opacity: 0; }\n#cine .B .franja { position: absolute; left: -10%; right: -10%; top: 30%; height: 40%; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--hc) 85%, #000) 18%, color-mix(in srgb, var(--hc) 85%, #000) 82%, transparent); transform: skewY(-8deg) scaleX(0); transform-origin: left; overflow: hidden; z-index: 4; }\n#cine .B .velocidad { position: absolute; inset: 0; background: repeating-linear-gradient(0deg, transparent 0 1.6cqw, rgba(255,255,255,.25) 1.6cqw 1.8cqw); animation: vel .25s linear infinite; }\n@keyframes vel { to { background-position: -40cqw 0; } }\n#cine .B .heroe { position: absolute; left: 8%; top: 50%; width: 30cqw; transform: translate(-80cqw, -55%) skewY(8deg); z-index: 5; filter: drop-shadow(0 0 2cqw var(--hc)); }\n#cine .B .nombre-hab { position: absolute; right: 6%; top: 50%; transform: translate(10cqw, -50%) skewY(-8deg); text-align: right; z-index: 6; opacity: 0; }\n#cine .B .nombre-hab em { display: block; font-style: normal; font-family: var(--f-pixel); font-size: 2cqw; color: var(--oro); letter-spacing: .3em; }\n#cine .B .nombre-hab span { font-size: 5cqw; }\n#cine .B .nombre-hab b { display: block; font-family: var(--f-pixel); font-size: 5.2cqw; line-height: 1; color: #fff; -webkit-text-stroke: .35cqw #000; paint-order: stroke fill; }\n#cine .B .nombre-hab small { display: block; font-weight: 800; font-size: 1.8cqw; color: #fff; text-shadow: 0 .2cqw 0 #000; }\n#cine .B .blanco { position: absolute; right: 12%; top: 50%; width: 24cqw; transform: translateY(-50%); opacity: 0; z-index: 3; }\n#cine .B .dano { position: absolute; right: 14%; top: 22%; font-family: var(--f-pixel); font-weight: 700; font-size: 10cqw; color: var(--oro); -webkit-text-stroke: .5cqw #3a0a00; paint-order: stroke fill; opacity: 0; z-index: 12; }\n#cine .B .cine-barra { position: absolute; right: 9%; bottom: 16%; width: 30cqw; height: 1.8cqw; background: #2a0d0a; border: .3cqw solid #000; border-radius: .6cqw; overflow: hidden; z-index: 12; opacity: 0; }\n#cine .B .cine-barra i { display: block; height: 100%; width: 100%; background: linear-gradient(#ff7a5a, #d22a1a); }\n#cine .B .marco { position: absolute; inset: 1.4cqw; border: .8cqw solid var(--oro); border-radius: 1cqw; box-shadow: inset 0 0 4cqw rgba(255,210,122,.6), 0 0 4cqw rgba(255,210,122,.6); opacity: 0; z-index: 11; }\n\n\n#cine .B.run .tinte { animation: b-tinte var(--dur) both; }\n@keyframes b-tinte { 0% { opacity: 0; } 8%, 88% { opacity: 1; } 100% { opacity: 0; } }\n#cine .B.run .franja { animation: b-franja var(--dur) cubic-bezier(.2,.9,.3,1) both; }\n@keyframes b-franja { 0%, 8% { transform: skewY(-8deg) scaleX(0); } 18%, 40% { transform: skewY(-8deg) scaleX(1); opacity: 1; } 46%, 100% { transform: skewY(-8deg) scaleX(1); opacity: 0; } }\n#cine .B.run .heroe { animation: b-heroe var(--dur) cubic-bezier(.2,.9,.3,1) both; }\n@keyframes b-heroe { 0%, 10% { transform: translate(-80cqw, -55%) skewY(8deg); } 20% { transform: translate(0, -55%) skewY(8deg); } 38% { transform: translate(4cqw, -55%) skewY(8deg); opacity: 1; } 46%, 100% { transform: translate(120cqw, -55%) skewY(8deg); opacity: 0; } }\n#cine .B.run .nombre-hab { animation: b-nombre var(--dur) both; }\n@keyframes b-nombre { 0%, 16% { opacity: 0; transform: translate(10cqw, -50%) skewY(-8deg); } 22%, 40% { opacity: 1; transform: translate(0, -50%) skewY(-8deg); } 46%, 100% { opacity: 0; } }\n#cine .B.run .blanco { animation: b-blanco var(--dur) both; }\n@keyframes b-blanco { 0%, 44% { opacity: 0; } 48%, 70% { opacity: 1; transform: translateY(-50%); } 72% { transform: translate(-1.5cqw, -50%); filter: brightness(3); } 74% { transform: translate(1.5cqw, -50%); } 76%, 86% { transform: translateY(-50%); filter: none; opacity: 1; } 94%, 100% { opacity: 0; } }\n@keyframes b-fx { 0%, 46% { opacity: 0; } 50%, 72% { opacity: 1; } 78%, 100% { opacity: 0; } }\n#cine .B.run .flash { animation: b-flash var(--dur) both; }\n@keyframes b-flash { 0%, 69% { opacity: 0; } 70% { opacity: .95; } 76%, 100% { opacity: 0; } }\n#cine .B.run .dano { animation: b-dano var(--dur) both; }\n@keyframes b-dano { 0%, 71% { opacity: 0; transform: scale(2.4); } 75% { opacity: 1; transform: scale(.9); } 78%, 90% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: translateY(-4cqw); } }\n#cine .B.run .cine-barra { animation: b-barra var(--dur) both; }\n@keyframes b-barra { 0%, 46% { opacity: 0; } 50%, 92% { opacity: 1; } 100% { opacity: 0; } }\n#cine .B.run .cine-barra i { animation: b-barra-i var(--dur) both; }\n@keyframes b-barra-i { 0%, 73% { width: 100%; } 84%, 100% { width: var(--queda); } }\n#cine .B.leyenda.run .marco { animation: b-marco var(--dur) both; }\n@keyframes b-marco { 0%, 6% { opacity: 0; } 12%, 88% { opacity: 1; } 100% { opacity: 0; } }\n#cine { position: fixed; inset: 0; z-index: 10000; display: grid; place-items: center; background: rgba(0, 0, 0, .8); cursor: pointer; animation: cine-entra .18s both;\n  --oro: #ffd27a; --menta: #5fd3b5; --f-pixel: \"Pixelify Sans\", \"Courier New\", monospace; color: #e8f1ee; font-family: \"Nunito\", system-ui, sans-serif; -webkit-tap-highlight-color: transparent; }\n#cine.sale { animation: cine-sale .25s both; pointer-events: none; }\n@keyframes cine-entra { from { opacity: 0; } }\n@keyframes cine-sale { to { opacity: 0; } }\n#cine .pantalla { position: relative; width: min(100vw, 177.78vh); aspect-ratio: 16 / 9; overflow: hidden; container-type: inline-size; }\n#cine .pantalla.C { background: #06000c; }\n#cine .cine-saltar { position: absolute; right: 12px; bottom: max(8px, env(safe-area-inset-bottom, 0px)); font-size: 12px; font-weight: 800; color: rgba(255, 255, 255, .75); text-shadow: 0 1px 0 #000; pointer-events: none; }\n/* versión corta de la aparición: solo la ficha del jefe */\n#cine .A.corto .cine-capa { opacity: 1; animation: cine-corto 1.3s both; }\n#cine .A.corto .cine-capa > *, #cine .A.corto .ficha .vida i { animation: none !important; }\n#cine .A.corto .banda, #cine .A.corto .lado.izq, #cine .A.corto .vs, #cine .A.corto .grito, #cine .A.corto .flash, #cine .A.corto .anc, #cine .A.corto .cv { display: none; }\n#cine .A.corto .lado.der { transform: none; }\n#cine .A.corto .ficha { opacity: 1; transform: none; }\n#cine .A.corto .ficha .vida i { width: 100%; }\n@keyframes cine-corto { 0% { opacity: 0; } 15%, 82% { opacity: 1; } 100% { opacity: 0; } }\n";
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sfx = (n) => { if (window.Sonido) window.Sonido.sfx(n); };
const reducir = () => Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
// Espera a que carguen las imágenes que usa la escena (máximo 1,5 s; las hojas casi siempre ya están en caché)
function precargar(srcs) {
  const lista = srcs.filter(Boolean).map(img);
  return new Promise((ok) => {
    const t0 = performance.now();
    const ver = () => (lista.every((i) => i.complete) || performance.now() - t0 > 1500 ? ok() : setTimeout(ver, 40));
    ver();
  });
}
// URL de un cuadro (para las <img> de las escenas hechas con HTML)
const URLS = {};
const url = (src) => { const i = img(src); if (!src.includes('#')) return src; if (!URLS[src] && i.complete) URLS[src] = i.toDataURL(); return URLS[src] || ''; };

let actual = null;
// Abre la superposición, corre la escena y se cierra sola, con un toque o con Enter (también Esc o Espacio)
function reproducir({ clase, html, dur, armar, sonidos = [] }) {
  if (actual) actual.fin();
  if (!document.getElementById('cine-css')) { const s = document.createElement('style'); s.id = 'cine-css'; s.textContent = CSS; document.head.appendChild(s); }
  return new Promise((resolver) => {
    const raiz = document.createElement('div');
    raiz.id = 'cine';
    raiz.innerHTML = `<div class="pantalla ${clase}">${html}</div><small class="cine-saltar">Toca la pantalla o pulsa Enter para saltar</small>`;
    document.body.appendChild(raiz);
    const pant = raiz.firstElementChild, timers = [];
    let hecho = false;
    const tecla = (e) => { e.preventDefault(); e.stopImmediatePropagation(); if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') fin(); };
    const fin = () => {
      if (hecho) return; hecho = true; actual = null;
      timers.forEach(clearTimeout); cancelAnimationFrame(bucles.cine);
      window.removeEventListener('keydown', tecla, true);
      raiz.classList.add('sale'); setTimeout(() => raiz.remove(), 260);
      resolver();
    };
    actual = { fin };
    window.addEventListener('keydown', tecla, true);
    raiz.addEventListener('click', fin);
    void pant.offsetWidth; pant.classList.add('run');
    if (armar) armar(pant);
    sonidos.forEach(([t, n]) => timers.push(setTimeout(() => sfx(n), t * 1000)));
    timers.push(setTimeout(fin, dur * 1000 + 80));
  });
}
const lienzoCine = (pant) => pant.querySelector('canvas.cv');
function escenaCanvas(E, desde = 0, sonidos = []) {
  velocidad.cine = 1;
  const dur = E.dur - desde;
  return reproducir({
    clase: 'C', html: '<canvas class="cv" aria-hidden="true"></canvas>', dur, sonidos: sonidos.map(([t, n]) => [t - desde, n]).filter(([t]) => t >= 0),
    armar: (pant) => correr('cine', lienzoCine(pant), dur, (ctx, W, H, t, st) => { E.dibujar(ctx, W, H, t + desde, st); bandasCine(ctx, W, H, t + desde, E.dur); }),
  });
}

const Cine = {
  // true mientras se ve una cinemática (el juego detiene el reloj de las preguntas)
  activa: () => Boolean(actual),
  // ¡Aparece el jefe! (4,2 s). heroes: hojas de los personajes del lado izquierdo. corto: solo la ficha del jefe (1,3 s).
  async jefe(id, { heroes = [], grupo = '', corto = false } = {}) {
    const j = DATOS.J.find((x) => x.id === id); if (!j) return;
    corto = corto || reducir();
    const lados = heroes.slice(0, 6).map((h) => hoja(h, 'der'));
    await precargar([j.izq, j.frente, ...lados]);
    const fases = j.anc && j.fases ? Array.from({ length: j.fases }, (_, i) => `<span>Fase ${i + 1}</span>`).join('') : '';
    const html = `<div class="cine-capa">
        <div class="banda arriba"></div><div class="banda abajo"></div>
        <canvas class="cv" aria-hidden="true"></canvas>
        ${j.anc ? '<div class="anc">JEFE ANCESTRAL</div>' : ''}
        <div class="lado izq"><div class="cine-equipo ${lados.length === 1 ? 'solo' : ''}">${lados.map((s) => `<img class="px" src="${url(s)}" alt="">`).join('')}<span class="n">${esc(j.anc ? 'Tú' : grupo)}</span></div></div>
        <div class="lado der"><img class="jefe-gr px" src="${url(j.izq)}" alt=""></div>
        <div class="vs">VS</div>
        <div class="ficha"><small>${esc(j.sub)}</small><b>${esc(j.nombre)}</b><div class="vida"><i></i></div><div class="fases">${fases}</div></div>
        <div class="grito">¡A LUCHAR!</div>
        <div class="flash"></div></div>`;
    const A = AMB[j.id];
    return reproducir({
      clase: `A ${corto ? 'corto' : ''}`, html, dur: corto ? 1.3 : 4.2, sonidos: corto ? [[0, 'rugido']] : [[0.4, 'rugido'], [2.1, 'golpe'], [3.7, 'golpe']],
      armar: (pant) => {
        pant.style.setProperty('--jc', j.color); pant.style.setProperty('--jc2', `color-mix(in srgb, ${j.color} 55%, #200)`);
        if (corto || !A) return;
        velocidad.cine = 1;
        const cv = lienzoCine(pant);
        correr('cine', cv, 2.0, (ctx, W, H, t, st) => {
          const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, A.fondo[0]); g.addColorStop(1, A.fondo[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
          A.dibujar(ctx, W, H, t, st, j);
          cv.style.opacity = 1 - rango(t, 1.75, 1.95);
          return t < 2.0;
        });
      },
    });
  },
  // Movimiento especial (3 s; 3,5 s las leyendas). corta: a doble velocidad (enemigos comunes). quien: lo lanzó un compañero (1,3 s).
  async habilidad({ id, nombre, hab, hojaPj, blanco = '', n = 0, quien = '', corta = false, queda = null }) {
    if (!hab || reducir()) return;
    const base = hab.leyenda ? 3.5 : 3.0, vel = quien ? 1.3 / base : corta ? 0.5 : 1, dur = base * vel;
    const heroe = hojaPj ? hoja(hojaPj, 'der') : '';
    await precargar([heroe, blanco]);
    const c = Array.isArray(hab.color) ? `rgb(${hab.color.join(',')})` : hab.color || '#ffd27a';
    const html = `<div class="cine-capa">
        <div class="banda arriba"></div><div class="banda abajo"></div>
        <div class="tinte"></div>
        ${blanco ? `<img class="blanco px" src="${url(blanco)}" alt="">` : ''}
        <div class="franja"><div class="velocidad"></div></div>
        ${heroe ? `<img class="heroe px" src="${url(heroe)}" alt="">` : ''}
        <div class="nombre-hab">${hab.leyenda ? '<em>⭐ LEGENDARIO ⭐</em>' : ''}<span>${hab.icono || ''}</span><b>${esc(hab.nombre)}</b><small>${esc(quien ? `${quien} usó su habilidad · −${n}` : `${nombre} · −${n} de vida`)}</small></div>
        <canvas class="cv" aria-hidden="true"></canvas>
        <div class="flash"></div>
        <div class="dano">−${n}</div>
        ${blanco ? '<div class="cine-barra"><i></i></div>' : ''}
        <div class="marco"></div></div>`;
    return reproducir({
      clase: `B ${hab.leyenda ? 'leyenda' : ''}`, html, dur, sonidos: [[0.08 * dur, 'rugido'], [0.47 * dur, 'golpe'], [0.7 * dur, 'golpe']],
      armar: (pant) => {
        pant.style.setProperty('--hc', c); pant.style.setProperty('--dur', `${dur}s`); pant.style.setProperty('--k', vel);
        pant.style.setProperty('--queda', `${queda === null ? Math.max(8, 100 - n) : Math.max(0, Math.min(100, queda))}%`);
        pant.querySelectorAll('.banda').forEach((b) => { b.style.animationDuration = `${(hab.leyenda ? 3.1 : 2.6) * vel}s`; });
        if (!HAB[id]) return;
        velocidad.cine = vel;
        correr('cine', lienzoCine(pant), dur, (ctx, W, H, t, st) => { const tb = t - base * 0.44; if (tb >= 0) HAB[id](ctx, W, H, tb, st, W * 0.76, H * 0.5); });
      },
    });
  },
  // Entradas del Altar de los Dioses: cerbero, vampira, ciclope, segador, golem, hades; y los cambios de fase hades2 y hades3
  async altar(clave) {
    const E = ALTAR[clave]; if (!E || reducir()) return;
    const D = dios(clave.replace(/[0-9]|fin/g, ''));
    await precargar(D ? [D.frente, D.izq] : []);
    return escenaCanvas(E, 0, clave.startsWith('hades') ? [[0.5, 'rugido'], [E.dur * 0.6, 'rugido']] : [[1.4, 'golpe'], [E.dur * 0.55, 'rugido']]);
  },
  // Derrotas: 'J' + jefe (u1…u4, rey, faraon, coloso, dragon), 'D' + dios del Altar, 'hades' (final de 18 s) y 'hadesCorto'.
  // Devuelve false si no hay cinemática (reducir movimiento o clave desconocida) para que el juego muestre su K.O. de siempre.
  derrota(clave, { nueva = true } = {}) {
    const E = clave === 'hadesCorto' ? ALTAR.hadesfin : DERROTAS[clave];
    if (!E || reducir()) return false;
    const j = clave[0] === 'J' && DATOS.J.find((x) => 'J' + x.id === clave);
    if (j) j.nueva = nueva;
    const D = clave === 'hades' || clave === 'hadesCorto' ? dios('hades') : clave[0] === 'D' && dios(clave.slice(1));
    const sonidos = clave === 'hades' ? [[0, 'golpe'], [1.5, 'rugido'], [7.4, 'golpe'], [10.6, 'victoria'], [13.2, 'logro']]
      : clave === 'hadesCorto' ? [[0, 'golpe'], [3.0, 'golpe'], [4.2, 'victoria']]
      : j ? [[0, 'golpe'], [0.5, 'rugido'], [2.0, 'golpe'], [3.0, nueva ? 'logro' : 'victoria'], [4.4, 'victoria']]
      : [[0, 'golpe'], [0.6, 'rugido'], [3.2, 'golpe'], [5.8, 'logro']];
    precargar(j ? [j.frente, j.gemaImg] : D ? [D.frente] : []).then(() => escenaCanvas(E, 0, sonidos));
    return true;
  },
};
window.Cine = Cine;

})();
