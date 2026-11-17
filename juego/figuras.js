// Math World — figuras para las preguntas de geometría y estadística.
// Cada función devuelve un SVG (texto) armado con los mismos números de la pregunta; una variante lo
// agrega como d.figura y el juego lo muestra bajo el enunciado. Solo se usan números generados por el
// propio juego (nunca texto escrito por usuarios), así que el SVG es seguro de insertar.
(function (global) {
  'use strict';
  const P = global.Preguntas;
  if (!P) return;
  const TINTA = '#1d2a22', SUAVE = '#9fb3a8', ACENTO = '#d1361f', AZUL = '#1f6fd1', RELLENO = '#cfe8dc';
  const n = (x) => String(Math.round(x * 100) / 100).replace('.', ',').replace('-', '−');
  const svg = (w, h, cuerpo, titulo) => `<svg class="fig" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${titulo}" xmlns="http://www.w3.org/2000/svg" font-family="Nunito, sans-serif" font-size="13">${cuerpo}</svg>`;
  const txt = (x, y, t, o = {}) => `<text x="${x}" y="${y}" fill="${o.color || TINTA}" font-size="${o.tam || 13}" font-weight="${o.peso || 700}" text-anchor="${o.ancla || 'middle'}" dominant-baseline="middle">${t}</text>`;

  // Plano cartesiano de −R a R con puntos [{x, y, nombre, color}] y vectores [{x1, y1, x2, y2}]
  function plano({ R = 6, puntos = [], vectores = [], titulo = 'Plano cartesiano' } = {}) {
    const W = 260, c = W / 2, u = (W - 30) / (2 * R), X = (x) => c + x * u, Y = (y) => c - y * u;
    let s = `<rect width="${W}" height="${W}" rx="10" fill="#fffdf4"/>`;
    for (let i = -R; i <= R; i++) s += `<line x1="${X(i)}" y1="${Y(-R)}" x2="${X(i)}" y2="${Y(R)}" stroke="#e3ddcd"/><line x1="${X(-R)}" y1="${Y(i)}" x2="${X(R)}" y2="${Y(i)}" stroke="#e3ddcd"/>`;
    s += `<line x1="${X(-R)}" y1="${c}" x2="${X(R)}" y2="${c}" stroke="${TINTA}" stroke-width="1.6"/><line x1="${c}" y1="${Y(-R)}" x2="${c}" y2="${Y(R)}" stroke="${TINTA}" stroke-width="1.6"/>`;
    s += txt(X(R) - 4, c - 9, 'x', { ancla: 'end' }) + txt(c + 9, Y(R) + 6, 'y');
    for (let i = -R; i <= R; i += 2) if (i) s += txt(X(i), c + 11, n(i), { tam: 10, peso: 400, color: '#5b6b62' }) + txt(c - 10, Y(i), n(i), { tam: 10, peso: 400, color: '#5b6b62', ancla: 'end' });
    for (const v of vectores) {
      const ang = Math.atan2(Y(v.y2) - Y(v.y1), X(v.x2) - X(v.x1)), a = 9;
      s += `<line x1="${X(v.x1)}" y1="${Y(v.y1)}" x2="${X(v.x2)}" y2="${Y(v.y2)}" stroke="${AZUL}" stroke-width="2.6"/>`;
      s += `<polygon fill="${AZUL}" points="${X(v.x2)},${Y(v.y2)} ${X(v.x2) - a * Math.cos(ang - 0.4)},${Y(v.y2) - a * Math.sin(ang - 0.4)} ${X(v.x2) - a * Math.cos(ang + 0.4)},${Y(v.y2) - a * Math.sin(ang + 0.4)}"/>`;
    }
    for (const p of puntos) s += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="5" fill="${p.color || ACENTO}" stroke="#fff" stroke-width="1.5"/>${p.nombre ? txt(X(p.x) + 10, Y(p.y) - 10, p.nombre, { color: p.color || ACENTO }) : ''}`;
    return svg(W, W, s, titulo);
  }

  // Polígono regular de k lados (opcional: marca de ángulo interior en un vértice)
  function poligono({ lados, rotulo = '', marcarAngulo = false, titulo = 'Polígono' }) {
    const W = 220, c = W / 2, r = 82, pts = [];
    for (let i = 0; i < lados; i++) { const a = -Math.PI / 2 + (2 * Math.PI * i) / lados; pts.push([c + r * Math.cos(a), c + 4 + r * Math.sin(a)]); }
    let s = `<rect width="${W}" height="${W}" rx="10" fill="#fffdf4"/><polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="${RELLENO}" stroke="${TINTA}" stroke-width="2.4" stroke-linejoin="round"/>`;
    for (const [x, y] of pts) s += `<circle cx="${x}" cy="${y}" r="3" fill="${TINTA}"/>`;
    if (marcarAngulo) {
      const [x0, y0] = pts[0], [x1, y1] = pts[1], [xn, yn] = pts[lados - 1], R0 = 20;
      const a1 = Math.atan2(y1 - y0, x1 - x0), a2 = Math.atan2(yn - y0, xn - x0);
      s += `<path d="M ${x0 + R0 * Math.cos(a1)} ${y0 + R0 * Math.sin(a1)} A ${R0} ${R0} 0 0 0 ${x0 + R0 * Math.cos(a2)} ${y0 + R0 * Math.sin(a2)}" fill="none" stroke="${ACENTO}" stroke-width="2.4"/>${txt(x0, y0 + 34, '?', { color: ACENTO, tam: 15 })}`;
    }
    if (rotulo) s += txt(c, W - 10, rotulo, { tam: 12 });
    return svg(W, W, s, titulo);
  }

  // Círculo con radio o diámetro rotulado
  function circulo({ medida, unidad = 'cm', diametro = false, titulo = 'Círculo' }) {
    const W = 220, c = W / 2, r = 80;
    let s = `<rect width="${W}" height="${W}" rx="10" fill="#fffdf4"/><circle cx="${c}" cy="${c}" r="${r}" fill="${RELLENO}" stroke="${TINTA}" stroke-width="2.4"/><circle cx="${c}" cy="${c}" r="3.5" fill="${TINTA}"/>`;
    if (diametro) s += `<line x1="${c - r}" y1="${c}" x2="${c + r}" y2="${c}" stroke="${ACENTO}" stroke-width="2.6"/>${txt(c, c - 13, `d = ${n(medida)} ${unidad}`, { color: ACENTO })}`;
    else s += `<line x1="${c}" y1="${c}" x2="${c + r}" y2="${c}" stroke="${ACENTO}" stroke-width="2.6"/>${txt(c + r / 2, c - 13, `r = ${n(medida)} ${unidad}`, { color: ACENTO })}`;
    return svg(W, W, s, titulo);
  }

  // Triángulo con base y altura rotuladas (la altura punteada)
  function triangulo({ base, altura, unidad = 'cm', titulo = 'Triángulo' }) {
    const W = 260, H = 200, k = Math.min(200 / base, 140 / altura), b = base * k, h = altura * k;
    const x0 = (W - b) / 2, y0 = H - 34, xv = x0 + b * 0.35;
    let s = `<rect width="${W}" height="${H}" rx="10" fill="#fffdf4"/><polygon points="${x0},${y0} ${x0 + b},${y0} ${xv},${y0 - h}" fill="${RELLENO}" stroke="${TINTA}" stroke-width="2.4" stroke-linejoin="round"/>`;
    s += `<line x1="${xv}" y1="${y0 - h}" x2="${xv}" y2="${y0}" stroke="${AZUL}" stroke-width="2" stroke-dasharray="5 4"/><rect x="${xv}" y="${y0 - 10}" width="10" height="10" fill="none" stroke="${AZUL}" stroke-width="1.5"/>`;
    s += txt(x0 + b / 2, y0 + 16, `b = ${n(base)} ${unidad}`, { color: ACENTO }) + txt(xv + 12, y0 - h / 2, `h = ${n(altura)} ${unidad}`, { color: AZUL, ancla: 'start' });
    return svg(W, H, s, titulo);
  }

  // Gráfico de barras: datos [[etiqueta, valor]]
  function barras({ datos, titulo = 'Gráfico de barras', eje = '' }) {
    const W = 300, H = 210, max = Math.max(...datos.map(([, v]) => v)), top = Math.ceil(max / 5) * 5 || 5, x0 = 34, y0 = H - 30, alto = H - 60, ancho = (W - x0 - 14) / datos.length;
    let s = `<rect width="${W}" height="${H}" rx="10" fill="#fffdf4"/>`;
    for (let v = 0; v <= top; v += top / 5) { const y = y0 - (v / top) * alto; s += `<line x1="${x0}" y1="${y}" x2="${W - 10}" y2="${y}" stroke="#e3ddcd"/>${txt(x0 - 6, y, n(v), { tam: 10, peso: 400, ancla: 'end', color: '#5b6b62' })}`; }
    datos.forEach(([e, v], i) => { const h = (v / top) * alto, x = x0 + i * ancho + ancho * 0.18; s += `<rect x="${x}" y="${y0 - h}" width="${ancho * 0.64}" height="${h}" rx="3" fill="${['#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#8ab17d', '#6d9dc5'][i % 6]}" stroke="${TINTA}" stroke-width="1.2"/>${txt(x + ancho * 0.32, y0 + 13, e, { tam: 11 })}`; });
    s += `<line x1="${x0}" y1="${y0}" x2="${W - 10}" y2="${y0}" stroke="${TINTA}" stroke-width="1.6"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 - alto - 6}" stroke="${TINTA}" stroke-width="1.6"/>`;
    if (eje) s += txt(W / 2, 14, eje, { tam: 12 });
    return svg(W, H, s, titulo);
  }

  // Diagrama de cajón: [mín, Q1, mediana, Q3, máx]
  function cajon({ cinco, titulo = 'Diagrama de cajón' }) {
    const [mn, q1, me, q3, mx] = cinco, W = 300, H = 120, lo = Math.floor(mn), hi = Math.ceil(mx), X = (v) => 24 + ((v - lo) / (hi - lo || 1)) * (W - 48), y = 50;
    let s = `<rect width="${W}" height="${H}" rx="10" fill="#fffdf4"/>`;
    s += `<line x1="${X(mn)}" y1="${y}" x2="${X(q1)}" y2="${y}" stroke="${TINTA}" stroke-width="2"/><line x1="${X(q3)}" y1="${y}" x2="${X(mx)}" y2="${y}" stroke="${TINTA}" stroke-width="2"/>`;
    s += `<line x1="${X(mn)}" y1="${y - 10}" x2="${X(mn)}" y2="${y + 10}" stroke="${TINTA}" stroke-width="2"/><line x1="${X(mx)}" y1="${y - 10}" x2="${X(mx)}" y2="${y + 10}" stroke="${TINTA}" stroke-width="2"/>`;
    s += `<rect x="${X(q1)}" y="${y - 18}" width="${X(q3) - X(q1)}" height="36" fill="${RELLENO}" stroke="${TINTA}" stroke-width="2"/><line x1="${X(me)}" y1="${y - 18}" x2="${X(me)}" y2="${y + 18}" stroke="${ACENTO}" stroke-width="3"/>`;
    s += `<line x1="22" y1="${y + 34}" x2="${W - 22}" y2="${y + 34}" stroke="${SUAVE}"/>`;
    for (const v of cinco) s += txt(X(v), y + 48, n(v), { tam: 11 });
    return svg(W, H, s, titulo);
  }

  P.fig = { plano, poligono, circulo, triangulo, barras, cajon };
})(window);
