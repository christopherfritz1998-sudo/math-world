// Math World — navegación por curso y unidad.
// Todo el contenido vive en contenido.json. Para habilitar una unidad,
// cambiar "habilitada" a true; para agregar material, sumar un objeto a "materiales".

const app = document.getElementById('app');
const hero = document.getElementById('hero');
document.getElementById('year').textContent = new Date().getFullYear();

const TIPOS = ['Guía', 'Presentación', 'Control', 'Juego'];
let data = null;

const esc = s => (s ?? '').toString()
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function vistaInicio() {
  hero.classList.remove('compact');
  app.innerHTML = `
    <h2>Elige tu curso</h2>
    <div class="cursos">
      ${data.cursos.map(c => {
        const activas = c.unidades.filter(u => u.habilitada).length;
        return `
        <a class="curso" href="#/${c.id}">
          <span class="curso-num">${esc(c.nombre.split(' ')[0])}</span>
          <span class="curso-txt">
            <strong>${esc(c.nombre)}</strong>
            <span>${activas} de ${c.unidades.length} unidades disponibles</span>
          </span>
          <span class="arrow" aria-hidden="true">→</span>
        </a>`;
      }).join('')}
    </div>`;
}

function vistaCurso(curso) {
  hero.classList.add('compact');
  app.innerHTML = `
    <p class="crumbs"><a href="#/">Inicio</a> / ${esc(curso.nombre)}</p>
    <h2>${esc(curso.nombre)}</h2>
    <div class="unidades">
      ${curso.unidades.map(u => {
        const n = u.materiales.length;
        const inner = `
          <span class="u-num">Unidad ${u.numero}</span>
          <h3>${esc(u.titulo)}</h3>
          <ul>${u.temas.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
          <span class="u-foot">${u.habilitada
            ? `${n} ${n === 1 ? 'material' : 'materiales'} →`
            : '🔒 Próximamente'}</span>`;
        return u.habilitada
          ? `<a class="unidad" href="#/${curso.id}/${u.id}">${inner}</a>`
          : `<div class="unidad bloqueada" aria-disabled="true">${inner}</div>`;
      }).join('')}
    </div>`;
}

function tarjeta(m) {
  const esJuego = m.tipo === 'Juego';
  const attrs = esJuego ? 'target="_blank" rel="noopener"' : 'download';
  return `
    <article class="card">
      <span class="tag t-${esc(m.tipo)}">${esc(m.tipo)}</span>
      <h4>${esc(m.titulo)}</h4>
      ${m.descripcion ? `<p>${esc(m.descripcion)}</p>` : '<p></p>'}
      <a class="dl" href="${esc(m.archivo)}" ${attrs}>${esJuego ? 'Jugar' : 'Descargar'}</a>
    </article>`;
}

function vistaUnidad(curso, u) {
  hero.classList.add('compact');
  if (!u.habilitada) return vistaCurso(curso);
  const grupos = TIPOS
    .map(t => [t, u.materiales.filter(m => m.tipo === t)])
    .filter(([, l]) => l.length);
  app.innerHTML = `
    <p class="crumbs"><a href="#/">Inicio</a> / <a href="#/${curso.id}">${esc(curso.nombre)}</a> / Unidad ${u.numero}</p>
    <h2><span class="u-num">Unidad ${u.numero}</span>${esc(u.titulo)}</h2>
    <p class="temas">${u.temas.map(esc).join(' · ')}</p>
    ${grupos.length ? grupos.map(([t, l]) => `
      <section class="grupo">
        <h3>${t === 'Guía' ? 'Guías' : t === 'Presentación' ? 'Presentaciones' : t === 'Control' ? 'Controles' : 'Juegos'}</h3>
        <div class="grid">${l.map(tarjeta).join('')}</div>
      </section>`).join('')
      : '<p class="empty">Pronto habrá materiales en esta unidad.</p>'}`;
}

function router() {
  if (!data) return;
  const [, cId, uId] = location.hash.replace(/^#\/?/, '/').split('/');
  const curso = data.cursos.find(c => c.id === cId);
  const unidad = curso?.unidades.find(u => u.id === uId);
  if (curso && unidad) vistaUnidad(curso, unidad);
  else if (curso) vistaCurso(curso);
  else vistaInicio();
  window.scrollTo({ top: 0 });
}

fetch('contenido.json', { cache: 'no-cache' })
  .then(r => r.json())
  .then(d => { data = d; router(); })
  .catch(() => { app.innerHTML = '<p class="empty">No se pudo cargar el contenido. Intenta recargar la página.</p>'; });

window.addEventListener('hashchange', router);
