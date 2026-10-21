// Carga materiales.json y los muestra con filtros por curso, tipo y búsqueda.
const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const fCurso = document.getElementById('f-curso');
const fTipo = document.getElementById('f-tipo');
const fQ = document.getElementById('f-q');
document.getElementById('year').textContent = new Date().getFullYear();

let materiales = [];

function norm(s) {
  return (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function render() {
  const curso = fCurso.value, tipo = fTipo.value, q = norm(fQ.value);
  const lista = materiales.filter(m =>
    (!curso || m.curso === curso) &&
    (!tipo || m.tipo === tipo) &&
    (!q || norm(m.titulo + ' ' + m.descripcion + ' ' + m.unidad).includes(q))
  );
  grid.innerHTML = '';
  lista.forEach(m => {
    const el = document.createElement('article');
    el.className = 'card';
    const esJuego = m.tipo === 'Juego';
    el.innerHTML = `
      <span class="tag ${m.tipo}">${m.tipo}</span>
      <h3></h3>
      <p></p>
      <span class="meta"></span>
      <a class="dl" ${esJuego ? 'target="_blank" rel="noopener"' : 'download'}>${esJuego ? 'Jugar' : 'Descargar'}</a>`;
    el.querySelector('h3').textContent = m.titulo;
    el.querySelector('p').textContent = m.descripcion || '';
    el.querySelector('.meta').textContent = [m.curso, m.unidad].filter(Boolean).join(' · ');
    el.querySelector('a').href = m.archivo;
    grid.appendChild(el);
  });
  empty.hidden = lista.length > 0;
}

fetch('materiales.json')
  .then(r => r.json())
  .then(data => {
    materiales = data;
    [...new Set(data.map(m => m.curso))].forEach(c => {
      const o = document.createElement('option');
      o.textContent = c;
      fCurso.appendChild(o);
    });
    render();
  })
  .catch(() => { empty.hidden = false; });

[fCurso, fTipo].forEach(el => el.addEventListener('change', render));
fQ.addEventListener('input', render);
