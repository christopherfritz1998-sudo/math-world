// Math World — ayudas para resolver ejercicios:
// 1) la pista se lee en voz alta al abrirla (y con el botón 🔊)
// 2) cuaderno con hoja de borrador (dibujar a mano) y calculadora, disponible en cada ejercicio
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const modal = $('modal');
  if (!modal) return;

  // ------------------------------------------------------------ lectura en voz alta
  const hablado = (t) => String(t || '')
    .replace(/(\d)\s*\/\s*(\d)/g, '$1 sobre $2')
    .replace(/−|–/g, ' menos ').replace(/[×·]/g, ' por ').replace(/÷/g, ' dividido en ').replace(/≠/g, ' distinto de ').replace(/≈/g, ' aproximadamente ')
    .replace(/≤/g, ' menor o igual que ').replace(/≥/g, ' mayor o igual que ').replace(/</g, ' menor que ').replace(/>/g, ' mayor que ')
    .replace(/=/g, ' igual a ').replace(/%/g, ' por ciento').replace(/π/g, ' pi ').replace(/√/g, ' raíz de ').replace(/°/g, ' grados')
    .replace(/\s+/g, ' ').trim();
  function textoDe(el) {
    const c = el.cloneNode(true);
    c.querySelectorAll('button').forEach((b) => b.remove());
    c.querySelectorAll('.frac').forEach((f) => { const [a, b] = f.children; f.replaceWith(` ${a ? a.textContent : ''} sobre ${b ? b.textContent : ''} `); });
    c.querySelectorAll('sup').forEach((s) => s.replaceWith(s.textContent === '2' ? ' al cuadrado ' : s.textContent === '3' ? ' al cubo ' : ` elevado a ${s.textContent} `));
    return hablado(c.textContent);
  }
  let voz = null;
  const elegirVoz = () => { const v = window.speechSynthesis ? speechSynthesis.getVoices() : []; voz = v.find((x) => /es[-_]CL/i.test(x.lang)) || v.find((x) => /es[-_](419|MX|US|AR)/i.test(x.lang)) || v.find((x) => /^es/i.test(x.lang)) || null; };
  if (window.speechSynthesis) { elegirVoz(); speechSynthesis.onvoiceschanged = elegirVoz; }
  function leer(texto) {
    if (!window.speechSynthesis || !texto) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    if (voz) u.voice = voz;
    u.lang = voz ? voz.lang : 'es-CL'; u.rate = 0.95; u.pitch = 1.05;
    const vol = window.Sonido && Sonido.cfg && typeof Sonido.cfg.vol === 'number' ? Sonido.cfg.vol : 0.9;
    u.volume = Math.max(0.4, Math.min(1, vol > 1 ? vol / 100 : vol));
    speechSynthesis.speak(u);
  }
  window.MWLeer = leer;
  // al abrir la pista (botones «Ver pista»), se lee sola
  document.addEventListener('click', (e) => {
    const b = e.target.closest('#d-pista, #c-pista');
    if (b) {
      setTimeout(() => { const el = modal.querySelector('.mensaje.pista:not(.rey-fase)'); if (el) leer(textoDe(el)); else if (window.speechSynthesis) speechSynthesis.cancel(); }, 40);
      return;
    }
    const l = e.target.closest('.btn-leer');
    if (l) { e.stopPropagation(); const el = l.closest('.mensaje'); if (el) leer(textoDe(el)); }
  });
  // botón 🔊 en cada pista y la voz se calla al cerrar la ventana
  new MutationObserver(() => {
    modal.querySelectorAll('.mensaje.pista:not(.rey-fase)').forEach((el) => {
      if (el.querySelector('.btn-leer')) return;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn-leer'; b.title = 'Escuchar la pista'; b.setAttribute('aria-label', 'Escuchar la pista'); b.textContent = '🔊';
      el.appendChild(b);
    });
    if (!modal.innerHTML && window.speechSynthesis) speechSynthesis.cancel();
    revisarBoton();
  }).observe(modal, { childList: true, subtree: true });
  const capa = $('capa');
  if (capa) new MutationObserver(() => { if (capa.classList.contains('oculto') && window.speechSynthesis) speechSynthesis.cancel(); revisarBoton(); }).observe(capa, { attributes: true, attributeFilter: ['class'] });

  // ------------------------------------------------------------ cuaderno: borrador + calculadora
  const btn = document.createElement('button');
  btn.type = 'button'; btn.id = 'btn-cuaderno'; btn.className = 'btn-cuaderno oculto';
  btn.innerHTML = '<span>📝</span><b>Cuaderno</b>'; btn.setAttribute('aria-label', 'Abrir cuaderno: borrador y calculadora');
  const panel = document.createElement('div');
  panel.id = 'cuaderno'; panel.className = 'cuaderno oculto'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Cuaderno');
  panel.innerHTML = `
    <div class="cu-cab"><div class="cu-tabs" role="tablist">
      <button type="button" role="tab" data-cu="borrador" aria-selected="true">✏️ Borrador</button>
      <button type="button" role="tab" data-cu="calc" aria-selected="false">🧮 Calculadora</button></div>
      <button type="button" class="cu-x" aria-label="Cerrar cuaderno">✕</button></div>
    <div class="cu-hoja" data-vista="borrador">
      <div class="cu-herr">
        <button type="button" data-lapiz="#1d2a22" aria-pressed="true" title="Lápiz negro"><i style="background:#1d2a22"></i></button>
        <button type="button" data-lapiz="#1f6fd1" aria-pressed="false" title="Lápiz azul"><i style="background:#1f6fd1"></i></button>
        <button type="button" data-lapiz="#d1361f" aria-pressed="false" title="Lápiz rojo"><i style="background:#d1361f"></i></button>
        <button type="button" data-lapiz="goma" aria-pressed="false" title="Goma">🧽</button>
        <span></span>
        <button type="button" class="cu-limpiar" title="Borrar todo">🗑️ Limpiar</button>
      </div>
      <canvas class="cu-lienzo" aria-label="Hoja para hacer cálculos a mano"></canvas>
    </div>
    <div class="cu-calc oculto" data-vista="calc">
      <div class="cu-pantalla"><small id="cu-hist">&nbsp;</small><input id="cu-expr" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="Operación" placeholder="0"></div>
      <div class="cu-teclas">${['C', '⌫', '(', ')', '7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', ',', '^', '+', '√', '%', '±', '='].map((k) => `<button type="button" data-k="${k}" class="${'÷×−+^'.includes(k) ? 'op' : k === '=' ? 'igual' : k === 'C' || k === '⌫' ? 'borra' : ''}">${k}</button>`).join('')}</div>
    </div>`;
  document.body.append(btn, panel);

  const marcar = () => document.body.classList.toggle('cu-abierto', !panel.classList.contains('oculto'));
  new MutationObserver(marcar).observe(panel, { attributes: true, attributeFilter: ['class'] });
  function revisarBoton() {
    const hay = !modal.closest('.oculto') && Boolean(modal.querySelector('.alternativas, .alt'));
    btn.classList.toggle('oculto', !hay);
    if (!hay && !panel.classList.contains('oculto')) panel.classList.add('oculto');
  }
  btn.addEventListener('click', () => { panel.classList.toggle('oculto'); if (!panel.classList.contains('oculto')) ajustarLienzo(); });
  panel.querySelector('.cu-x').addEventListener('click', () => panel.classList.add('oculto'));
  // que las teclas escritas en el cuaderno no respondan el ejercicio ni muevan al personaje
  for (const ev of ['keydown', 'keyup']) panel.addEventListener(ev, (e) => { if (e.key !== 'Escape') e.stopPropagation(); });
  panel.querySelectorAll('[data-cu]').forEach((t) => t.addEventListener('click', () => {
    panel.querySelectorAll('[data-cu]').forEach((x) => x.setAttribute('aria-selected', String(x === t)));
    panel.querySelector('[data-vista="borrador"]').classList.toggle('oculto', t.dataset.cu !== 'borrador');
    panel.querySelector('[data-vista="calc"]').classList.toggle('oculto', t.dataset.cu !== 'calc');
    if (t.dataset.cu === 'borrador') ajustarLienzo(); else $('cu-expr').focus();
  }));

  // ---------- borrador (dibujar con mouse, dedo o lápiz) ----------
  const lienzo = panel.querySelector('.cu-lienzo'), ctx = lienzo.getContext('2d');
  let color = '#1d2a22', dibujando = false, ultimo = null, copia = null;
  function ajustarLienzo() {
    const r = lienzo.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    if (!r.width || !r.height) return;
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (lienzo.width === w && lienzo.height === h) return;
    if (lienzo.width && lienzo.height) { copia = document.createElement('canvas'); copia.width = lienzo.width; copia.height = lienzo.height; copia.getContext('2d').drawImage(lienzo, 0, 0); }
    lienzo.width = w; lienzo.height = h;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (copia) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(copia, 0, 0); ctx.restore(); }
  }
  window.addEventListener('resize', () => { if (!panel.classList.contains('oculto')) ajustarLienzo(); });
  const punto = (e) => { const r = lienzo.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pressure || 0.5 }; };
  lienzo.addEventListener('pointerdown', (e) => { e.preventDefault(); lienzo.setPointerCapture(e.pointerId); dibujando = true; ultimo = punto(e); trazo(ultimo, ultimo); });
  lienzo.addEventListener('pointermove', (e) => { if (!dibujando) return; const p = punto(e); trazo(ultimo, p); ultimo = p; });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) lienzo.addEventListener(ev, () => { dibujando = false; });
  function trazo(a, b) {
    const goma = color === 'goma';
    ctx.globalCompositeOperation = goma ? 'destination-out' : 'source-over';
    ctx.strokeStyle = goma ? '#000' : color; ctx.lineWidth = goma ? 22 : 2.4 + b.p * 1.6;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x + 0.01, b.y); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }
  panel.querySelectorAll('[data-lapiz]').forEach((b) => b.addEventListener('click', () => {
    color = b.dataset.lapiz; panel.querySelectorAll('[data-lapiz]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    lienzo.style.cursor = color === 'goma' ? 'cell' : 'crosshair';
  }));
  panel.querySelector('.cu-limpiar').addEventListener('click', () => { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, lienzo.width, lienzo.height); ctx.restore(); });

  // ---------- calculadora (sin eval: analizador propio) ----------
  const expr = $('cu-expr'), hist = $('cu-hist');
  function calcular(txt) {
    const s = String(txt).replace(/\s+/g, '').replace(/,/g, '.').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/√/g, 'r');
    let i = 0;
    const ver = () => s[i], tomar = (c) => (s[i] === c ? (i++, true) : false);
    function numero() {
      const m = /^\d*\.?\d+(e[+-]?\d+)?/i.exec(s.slice(i)) || /^\d+\.?/.exec(s.slice(i));
      if (!m) throw new Error('número');
      i += m[0].length; return parseFloat(m[0]);
    }
    function primario() {
      if (tomar('(')) { const v = suma(); if (!tomar(')')) throw new Error('paréntesis'); return v; }
      if (tomar('r')) { const v = unario(); if (v < 0) throw new Error('raíz'); return Math.sqrt(v); }
      return numero();
    }
    function potencia() { let b = primario(); if (tomar('%')) b /= 100; if (tomar('^')) b = Math.pow(b, unario()); return b; }
    function unario() { if (tomar('-')) return -unario(); if (tomar('+')) return unario(); return potencia(); }
    function producto() {
      let v = unario();
      for (;;) {
        if (tomar('*')) v *= unario();
        else if (tomar('/')) { const d = unario(); if (d === 0) throw new Error('cero'); v /= d; }
        else if (ver() === '(' || ver() === 'r') v *= unario();   // 2(3+1) o 2√9
        else return v;
      }
    }
    function suma() { let v = producto(); for (;;) { if (tomar('+')) v += producto(); else if (tomar('-')) v -= producto(); else return v; } }
    const v = suma();
    if (i < s.length || !Number.isFinite(v)) throw new Error('sintaxis');
    return v;
  }
  const formato = (v) => { const r = Math.round(v * 1e10) / 1e10; return String(r).replace('.', ','); };
  let recienCalculado = false;
  function tecla(k) {
    const v = expr.value;
    if (k === 'C') { expr.value = ''; hist.innerHTML = '&nbsp;'; }
    else if (k === '⌫') expr.value = v.slice(0, -1);
    else if (k === '=') {
      if (!v.trim()) return;
      try { const r = formato(calcular(v)); hist.textContent = `${v} =`; expr.value = r; recienCalculado = true; expr.classList.remove('error'); return; }
      catch (err) { hist.textContent = err.message === 'cero' ? 'No se puede dividir por cero' : 'Revisa la operación'; expr.classList.add('error'); setTimeout(() => expr.classList.remove('error'), 500); }
    } else if (k === '±') expr.value = v.startsWith('−') ? v.slice(1) : `−${v}`;
    else { if (recienCalculado && /[\d,(√]/.test(k)) expr.value = ''; expr.value += k; }
    recienCalculado = false;
  }
  panel.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => { tecla(b.dataset.k); if (!matchMedia('(pointer: coarse)').matches) expr.focus(); }));
  expr.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); tecla('='); }
    else if (e.key === 'Escape') { panel.classList.add('oculto'); }
    else if (e.key === '*') { e.preventDefault(); tecla('×'); }
    else if (e.key === '/') { e.preventDefault(); tecla('÷'); }
    else if (e.key === '-') { e.preventDefault(); tecla('−'); }
    else if (e.key === '.') { e.preventDefault(); tecla(','); }
    else if (recienCalculado && /^[\d(]$/.test(e.key)) { expr.value = ''; recienCalculado = false; }
    else recienCalculado = false;
  });
  revisarBoton();
})();
