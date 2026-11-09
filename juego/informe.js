// Math World · Informe de un estudiante. Lo usan el panel docente (para imprimir) y la página de apoderados (informe.html).
(function (global) {
  'use strict';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pct = (s) => (s && s.i ? Math.round((s.a / s.i) * 100) : 0);
  function semanaISO(d) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
    return `${t.getUTCFullYear()}-S${String(Math.ceil(((t - new Date(Date.UTC(t.getUTCFullYear(), 0, 1))) / 86400000 + 1) / 7)).padStart(2, '0')}`;
  }
  // o = { nombre, cursoNombre, p (progreso), nombreTema(k) → { unidad, titulo }, zonas { u1: 'Unidad 1', … }, apoderado }
  function cuerpo(o) {
    const p = o.p || {}, hoy = new Date();
    const temas = Object.entries(p.stats || {}).filter(([, s]) => s && s.i > 0).map(([k, s]) => ({ k, t: o.nombreTema(k), pct: pct(s), i: s.i, a: s.a }));
    const intentos = temas.reduce((n, x) => n + x.i, 0), buenas = temas.reduce((n, x) => n + x.a, 0);
    const acierto = intentos ? Math.round((buenas / intentos) * 100) : null;
    const fuertes = temas.filter((x) => x.i >= 5 && x.pct >= 70).sort((a, b) => b.pct - a.pct || b.i - a.i).slice(0, 5);
    const debiles = temas.filter((x) => x.i >= 3 && x.pct < 70).sort((a, b) => a.pct - b.pct || b.i - a.i).slice(0, 5);
    const sem = Object.entries(p.semanal || {}).sort(([a], [b]) => a.localeCompare(b)).slice(-10);
    const maxI = Math.max(1, ...sem.map(([, s]) => s.i));
    const porU = {};
    temas.forEach((x) => (porU[x.t.unidad] = porU[x.t.unidad] || []).push(x));
    const medallas = [0, 0, 0];
    Object.values(p.maestria || {}).forEach((m) => { if (!m) return; if (m.g) medallas[0] += 1; else if (m.p >= 25) medallas[1] += 1; else if (m.p >= 8) medallas[2] += 1; });
    const repasos = Object.keys(p.repaso || {}).map((k) => o.nombreTema(k).titulo);
    const D = p.diagnostico;
    const rec = [];
    if (debiles[0] && debiles[0].pct < 60) rec.push(`Reforzar <b>${esc(debiles[0].t.titulo)}</b> (${debiles[0].pct} % de acierto).${o.apoderado ? ' Practicar unos minutos al día en el juego ayuda: el juego le vuelve a preguntar lo que falla.' : ' Desde el panel puedes asignarle un refuerzo personalizado de ese tema.'}`);
    if (sem.length >= 2) {
      const a = sem[sem.length - 2][1], b = sem[sem.length - 1][1];
      if (pct(b) >= pct(a) + 10) rec.push(`Va mejorando: su acierto subió de ${pct(a)} % a ${pct(b)} % entre las dos últimas semanas registradas.`);
      else if (pct(b) <= pct(a) - 10) rec.push(`Su acierto bajó de ${pct(a)} % a ${pct(b)} % entre las dos últimas semanas registradas${o.apoderado ? '.' : ': conviene conversar con el estudiante.'}`);
    }
    if (!sem.length || sem[sem.length - 1][0] !== semanaISO(hoy)) rec.push('No registra práctica esta semana.');
    if (acierto !== null && acierto >= 80 && intentos >= 40) rec.push('Muestra buen dominio general de los temas que ha practicado.');
    if (repasos.length >= 4) rec.push(`Tiene ${repasos.length} temas en repaso pendiente: le conviene jugar unos minutos al día para cerrarlos.`);
    if (!rec.length) rec.push('Sin alertas: sigue practicando de forma regular.');
    const fila = (a) => `<tr>${a.map((x) => `<td>${x}</td>`).join('')}</tr>`;
    const barra = (v, max, color) => `<span class="b"><i style="width:${Math.round((100 * v) / max)}%;background:${color}"></i></span>`;
    const color = (v) => (v >= 70 ? '#3bb273' : v >= 50 ? '#f2b544' : '#e76f51');
    let diag = '';
    if (D && D.n) {
      const fall = (D.det || []).filter(([, ok]) => !ok).map(([k]) => k);
      const ahora = [...new Set(fall)].map((k) => { const s = (p.stats || {})[k]; return `${esc(o.nombreTema(k).titulo)}${s && s.i >= 3 ? ` <span class="muted">(ahora ${pct(s)} %)</span>` : ''}`; });
      diag = `<h2>Diagnóstico inicial</h2><p>Lo rindió el ${new Date(D.t).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}: <b>${D.a} de ${D.n}</b> correctas (${Math.round((100 * D.a) / D.n)} %). Acierto general hoy: <b>${acierto === null ? '–' : `${acierto} %`}</b>.</p>
        <p>${ahora.length ? `Temas que falló en el diagnóstico: ${ahora.join(' · ')}.` : 'No falló ningún tema en el diagnóstico.'}</p>`;
    }
    return `<h1>${esc(o.nombre)}</h1><div class="muted">${esc(o.cursoNombre || '')} · Math World · ${hoy.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      <h2>Resumen</h2><div class="cifras"><div><span>Nivel en el juego</span><b>${p.nivel || '–'}</b></div><div><span>Acierto general</span><b>${acierto === null ? '–' : `${acierto} %`}</b></div><div><span>Ejercicios respondidos</span><b>${intentos}</b></div><div><span>Días seguidos jugando</span><b>${p.diasSeguidos || 0}</b></div></div>
      <h2>Recomendaciones</h2><ul>${rec.map((x) => `<li>${x}</li>`).join('')}</ul>
      <div class="cols"><div><h2>Temas que domina</h2>${fuertes.length ? `<table><tr><th>Tema</th><th>Acierto</th></tr>${fuertes.map((x) => fila([esc(x.t.titulo), `${x.pct} % <span class="muted">(${x.i})</span>`])).join('')}</table>` : '<p class="muted">Aún no hay suficientes respuestas.</p>'}</div>
      <div><h2>Temas que le cuestan</h2>${debiles.length ? `<table><tr><th>Tema</th><th>Acierto</th></tr>${debiles.map((x) => fila([esc(x.t.titulo), `${x.pct} % <span class="muted">(${x.i})</span>`])).join('')}</table>` : '<p class="muted">Aún no hay suficientes respuestas.</p>'}</div></div>
      ${diag}
      <h2>Evolución semana a semana</h2>${sem.length ? `<table><tr><th>Semana</th><th>Ejercicios</th><th></th><th>Acierto</th><th></th></tr>${sem.map(([k, s]) => fila([`Semana ${esc(k.split('-S')[1] || k)}`, s.i, barra(s.i, maxI, '#2a9d8f'), `${pct(s)} %`, barra(pct(s), 100, color(pct(s)))])).join('')}</table>` : '<p class="muted">El registro semanal es reciente: aparecerá apenas el estudiante vuelva a practicar.</p>'}
      <h2>Acierto por unidad y tema</h2>${Object.keys(porU).sort().map((u) => `<h3>${esc((o.zonas || {})[u] || 'Otros')}</h3><table>${porU[u].sort((a, b) => a.pct - b.pct).map((x) => fila([esc(x.t.titulo), barra(x.pct, 100, color(x.pct)), `${x.pct} %`, `<span class="muted">${x.a} de ${x.i}</span>`])).join('')}</table>`).join('') || '<p class="muted">Todavía no responde ejercicios.</p>'}
      <h2>Maestría y repaso</h2><p>🥇 ${medallas[0]} temas en oro · 🥈 ${medallas[1]} en plata · 🥉 ${medallas[2]} en bronce</p>
      <p>${repasos.length ? `Temas en repaso (los falló y el juego se los vuelve a preguntar): ${esc(repasos.slice(0, 10).join(', '))}.` : 'No tiene temas pendientes de repaso.'}</p>`;
  }
  const ESTILO = `body{font-family:system-ui,sans-serif;color:#1d2b25;margin:28px auto;padding:0 16px;max-width:900px} h1{margin:0 0 4px} h2{margin:22px 0 8px;font-size:18px;border-bottom:2px solid #2a9d8f;padding-bottom:4px} h3{margin:12px 0 4px;font-size:15px}
    .cifras{display:grid;grid-template-columns:repeat(4,1fr);gap:10px} .cifras div{border:1px solid #cfe3dc;border-radius:10px;padding:10px} .cifras b{display:block;font-size:24px}
    table{width:100%;border-collapse:collapse;font-size:14px} td,th{border-bottom:1px solid #e3ece8;padding:5px 6px;text-align:left} .muted{color:#667}
    .b{display:inline-block;width:140px;max-width:30vw;height:10px;background:#e6efeb;border-radius:5px;overflow:hidden;vertical-align:middle} .b i{display:block;height:100%}
    ul{margin:6px 0;padding-left:20px} li{margin:3px 0} .cols{display:grid;grid-template-columns:1fr 1fr;gap:18px}
    @media (max-width:640px){.cifras{grid-template-columns:1fr 1fr} .cols{grid-template-columns:1fr}} @media print{button{display:none}}`;
  const pagina = (o) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Informe ${esc(o.nombre)} · Math World</title><style>${ESTILO}</style></head><body>
    <button onclick="print()" style="float:right;padding:8px 14px">🖨️ Imprimir o guardar como PDF</button>${cuerpo(o)}</body></html>`;
  global.InformeMW = { cuerpo, pagina, ESTILO };
})(window);
