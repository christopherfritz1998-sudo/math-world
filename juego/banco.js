// Math World — banco de preguntas organizado según el programa del profesor (Banco de preguntas 7° y 8° básico).
// Cada tema reúne variantes de los archivos anteriores (preguntas*.js) y las nuevas (banco_7.js, banco_8.js).
// Selección "sin repetición": los temas salen de una bolsa barajada (todos aparecen antes de repetir uno),
// las variantes de cada tema también, y nunca se repite un enunciado reciente.
(function (global) {
  'use strict';
  const P = global.Preguntas;
  const { shuffle } = P.h;
  const VIEJO = P.BANCO;   // banco anterior (se reutilizan sus variantes)

  // [clave, título, fuentes antiguas [tema, índices, filtro], variantes nuevas]
  // filtro: { si: /regex/ } exige que el enunciado coincida; { no: /regex/ } lo excluye
  const v = (tema, idx, filtro) => ({ tema, idx, filtro });
  const E7 = (P.N7 || {}), E8 = (P.N8 || {});
  const PLAN = {
    '7basico': {
      u1: [
        ['enteros', 'Adición y sustracción de números enteros', [v('enteros', [0, 1, 5, 6], { no: /absoluto|opuesto|Ordena/ })], E7.u1.enteros],
        ['combinadas7', 'Operaciones combinadas de números enteros', [v('enteros', [4, 7])], E7.u1.combinadas7],
        ['valorabs', 'Valor absoluto', [v('enteros', [2, 3])], E7.u1.valorabs],
        ['decimales', 'Números decimales: multiplicación y división', [v('fracdec', [0, 1, 2], { si: /\d,\d/, no: /\d\/\d/ }), v('fracdec', [5, 6, 8])], E7.u1.decimales],
        ['fracciones', 'Multiplicación y división de fracciones', [v('fracdec', [0, 1, 2], { si: /\d\/\d/ }), v('fracdec', [3, 4, 7])], E7.u1.fracciones],
        ['simplificar', 'Reducción de fracciones', [], E7.u1.simplificar],
        ['porcentajes', 'Porcentajes', [v('porcentajes', 'todos')], E7.u1.porcentajes],
        ['notacion', 'Notación científica', [v('potencias10', [0, 1, 2, 10])], E7.u1.notacion],
        ['potencias10', 'Potencias de base 10: definición y descomposición', [v('potencias10', [3, 4, 5, 6, 7, 8, 9])], E7.u1.potencias10],
      ],
      u2: [
        ['termino', 'Término algebraico', [v('expresiones7', [6])], E7.u2.termino],
        ['semejantes', 'Reducción de términos semejantes', [v('expresiones7', [0, 2, 4])], E7.u2.semejantes],
        ['clasificar', 'Clasificación de expresiones algebraicas', [], E7.u2.clasificar],
        ['valorizar', 'Valorizar expresiones algebraicas', [v('expresiones7', [1, 3])], E7.u2.valorizar],
        ['lenguaje', 'Lenguaje algebraico', [v('lenguaje', 'todos'), v('expresiones7', [5])], E7.u2.lenguaje],
        ['ecuaciones7', 'Ecuación e inecuación lineal', [v('ecuaciones7', 'todos')], E7.u2.ecuaciones7],
        ['razones', 'Razones y proporciones', [v('proporcion', [2])], E7.u2.razones],
        ['proporcion', 'Proporcionalidad directa e inversa', [v('proporcion', [0, 1, 3, 4, 5, 6])], E7.u2.proporcion],
      ],
      u3: [
        ['cartesiano', 'Coordenadas y plano cartesiano', [v('cartesiano', [0], { si: /cuadrante/ }), v('cartesiano', [2, 3])], E7.u3.cartesiano],
        ['vectores', 'Vectores: elementos y desplazamiento', [v('cartesiano', [0], { no: /cuadrante/ }), v('cartesiano', [1])], E7.u3.vectores],
        ['circulo', 'Área y perímetro del círculo', [v('circulo', 'todos')], E7.u3.circulo],
        ['poligonos', 'Clasificación de polígonos', [], E7.u3.poligonos],
        ['angulos', 'Suma de ángulos interiores de un polígono', [v('angulos', [0, 3, 5])], E7.u3.angulos],
        ['angreg', 'Ángulo interior de un polígono regular', [v('angulos', [1, 4])], E7.u3.angreg],
        ['areas', 'Área de triángulos, trapecios y paralelogramos', [v('areas', 'todos')], E7.u3.areas],
        ['construcciones', 'Construcciones geométricas', [], E7.u3.construcciones],
      ],
      u4: [
        ['poblacion', 'Población y muestra', [], E7.u4.poblacion],
        ['variables', 'Variables estadísticas', [], E7.u4.variables],
        ['tablas', 'Tablas de frecuencia', [v('tablas', 'todos')], E7.u4.tablas],
        ['graficos', 'Gráficos', [], E7.u4.graficos],
        ['tendencia', 'Medidas de tendencia central', [v('tendencia', 'todos')], E7.u4.tendencia],
      ],
    },
    '8basico': {
      u1: [
        ['multdiv', 'Números enteros: adición, sustracción, multiplicación y división', [v('multdiv', [0, 1, 2, 6, 7, 8])], E8.u1.multdiv],
        ['combinadas8', 'Operaciones combinadas de números enteros', [v('multdiv', [3, 4, 5])], E8.u1.combinadas8],
        ['racionalesq', 'Números racionales', [v('racionales', [4])], E8.u1.racionalesq],
        ['decfrac', 'Cambio de decimal a fracción y viceversa', [v('racionales', [5])], E8.u1.decfrac],
        ['racionales', 'Operaciones combinadas con números racionales', [v('racionales', [0, 1, 2, 3, 6, 7])], E8.u1.racionales],
        ['potencias', 'Potencias y sus propiedades', [v('potencias', 'todos')], E8.u1.potencias],
        ['raiz', 'Raíces', [v('raiz', [0, 2], { no: /Entre qué/ }), v('raiz', [1, 3, 4, 5, 6, 7, 8, 9])], E8.u1.raiz],
        ['estimacion', 'Estimación de raíces', [v('raiz', [0, 2], { si: /Entre qué/ })], E8.u1.estimacion],
      ],
      u2: [
        ['ecuaciones8', 'Ecuaciones', [v('ecuaciones8', [0], { no: /inecuación/ }), v('ecuaciones8', [1, 2, 3, 5])], E8.u2.ecuaciones8],
        ['inecuaciones', 'Inecuaciones', [v('ecuaciones8', [0], { si: /inecuación/ }), v('ecuaciones8', [4])], E8.u2.inecuaciones],
        ['expresiones8', 'Reducción de expresiones algebraicas', [v('expresiones8', [0], { si: /^Reduce/ }), v('expresiones8', [1])], E8.u2.expresiones8],
        ['multexp', 'Multiplicación de expresiones algebraicas', [v('expresiones8', [0], { no: /^Reduce/ }), v('expresiones8', [2, 3, 4, 5, 6, 7])], E8.u2.multexp],
        ['funcion', 'Funciones', [v('funcion', 'todos')], E8.u2.funcion],
        ['dominio', 'Dominio y recorrido', [], E8.u2.dominio],
        ['lineal', 'Función lineal', [v('linealafin', [0], { si: /lineal/ }), v('linealafin', [4, 5])], E8.u2.lineal],
        ['linealafin', 'Función afín', [v('linealafin', [0], { no: /lineal/ }), v('linealafin', [1, 2, 3, 6])], E8.u2.linealafin],
      ],
      u3: [
        ['pitagoras', 'Teorema de Pitágoras', [v('pitagoras', [0], { si: /triángulo rectángulo/ }), v('pitagoras', [1])], E8.u3.pitagoras],
        ['pitagorasap', 'Aplicaciones del teorema de Pitágoras', [v('pitagoras', [0], { no: /triángulo rectángulo/ }), v('pitagoras', [2, 3, 4])], E8.u3.pitagorasap],
        ['transformaciones', 'Transformaciones geométricas', [], E8.u3.transformaciones],
        ['isometrias', 'Traslación, rotación y reflexión', [v('isometrias', 'todos')], E8.u3.isometrias],
        ['volumen', 'Área y volumen de prismas y cilindros', [v('volumen', 'todos')], E8.u3.volumen],
      ],
      u4: [
        ['tablas8', 'Tablas de frecuencias', [], E8.u4.tablas8],
        ['graficos8', 'Gráficos', [], E8.u4.graficos8],
        ['tendencia8', 'Medidas de tendencia central', [], E8.u4.tendencia8],
        ['posicion', 'Medidas de posición: cuartiles y percentiles', [v('posicion', 'todos')], E8.u4.posicion],
        ['cajon', 'Diagrama de caja', [v('cajon', 'todos')], E8.u4.cajon],
      ],
    },
  };

  // Títulos de temas que ya no están en el banco (para mostrar bien el avance antiguo en el portal)
  const ANTIGUOS = {
    fracdec: 'Multiplicación y división de fracciones y decimales', expresiones7: 'Expresiones algebraicas', probabilidad7: 'Probabilidad',
    variacion: 'Variaciones porcentuales', multiplicativo: 'Principio multiplicativo', probabilidad8: 'Probabilidad',
  };

  const valido = (d) => d && typeof d.enunciado === 'string' && d.enunciado.trim() && Array.isArray(d.opciones) && d.opciones.length === 4
    && new Set(d.opciones).size === 4 && d.correcta >= 0 && d.correcta < 4
    && !/undefined|NaN|Infinity|null/.test(d.enunciado + d.opciones.join('|'))
    && !d.opciones.some((o) => /\d\.\d(?!\d\d)/.test(o));   // decimales con punto (deben usar coma)

  // Variante antigua (con filtro opcional): reintenta hasta obtener un enunciado del subtema pedido
  function deViejo(fn, filtro) {
    if (!filtro) return (dif) => fn(dif);
    return (dif) => {
      for (let i = 0; i < 40; i++) {
        const d = fn(dif);
        if (d && (!filtro.si || filtro.si.test(d.enunciado)) && (!filtro.no || !filtro.no.test(d.enunciado))) return d;
      }
      return null;
    };
  }

  const BANCO = {};
  for (const [curso, unidades] of Object.entries(PLAN)) {
    BANCO[curso] = {};
    for (const [u, temas] of Object.entries(unidades)) {
      BANCO[curso][u] = {};
      for (const [k, titulo, fuentes, nuevas] of temas) {
        const variantes = [];
        for (const f of fuentes) {
          const t = VIEJO[curso] && VIEJO[curso][u] && VIEJO[curso][u][f.tema];
          if (!t) continue;
          const lista = t.variantes || [t.gen.bind(t)];
          const idx = f.idx === 'todos' ? lista.map((_, i) => i) : f.idx;
          for (const i of idx) if (lista[i]) variantes.push(deViejo(lista[i], f.filtro));
        }
        for (const fn of nuevas || []) variantes.push(fn);
        const tema = {
          titulo, variantes,
          // compatibilidad: una variante al azar
          gen(dif) { for (let i = 0; i < 30; i++) { const d = variantes[Math.floor(Math.random() * variantes.length)](dif); if (valido(d)) return { ...d, tema: k, titulo }; } return null; },
        };
        BANCO[curso][u][k] = tema;
      }
    }
  }

  // ---------------- selección sin repetición ----------------
  const memoria = {};   // por curso y unidad: bolsa de temas, bolsas de variantes y enunciados recientes
  const RECIENTES = 40;
  const firma = (d) => d.enunciado.replace(/\s+/g, ' ').trim();

  function sacarTema(M, claves, stats) {
    if (!M.bolsa.length) {
      // todos los temas una vez; los temas con bajo acierto entran dos veces
      const b = [...claves];
      for (const k of claves) { const s = stats && stats[k]; if (s && s.i >= 4 && s.a / s.i < 0.5) b.push(k); }
      M.bolsa = shuffle(b);
      // que la nueva bolsa no empiece con el último tema que salió
      if (M.bolsa.length > 1 && M.bolsa[M.bolsa.length - 1] === M.ultimo) { const j = Math.floor(Math.random() * (M.bolsa.length - 1)); [M.bolsa[j], M.bolsa[M.bolsa.length - 1]] = [M.bolsa[M.bolsa.length - 1], M.bolsa[j]]; }
    }
    let k = M.bolsa.pop();
    if (k === M.ultimo && M.bolsa.length) { const j = M.bolsa.findIndex((x) => x !== k); if (j >= 0) { const otro = M.bolsa.splice(j, 1)[0]; M.bolsa.push(k); k = otro; } }
    return k;
  }
  function sacarVariante(M, k, n) {
    const B = M.var[k] || (M.var[k] = []);
    if (!B.length) {
      B.push(...shuffle(Array.from({ length: n }, (_, i) => i)));
      if (B.length > 1 && B[B.length - 1] === M.ultVar[k]) { [B[0], B[B.length - 1]] = [B[B.length - 1], B[0]]; }
    }
    const i = B.pop(); M.ultVar[k] = i;
    return i;
  }

  // Repaso de errores: el juego entrega una función que dice qué tema toca repasar (o null)
  let repaso = null;
  function fijarRepaso(fn) { repaso = typeof fn === 'function' ? fn : null; }
  function nuevo(curso, unidad, dif, stats) {
    const temas = BANCO[curso] && BANCO[curso][unidad];
    if (repaso && Math.random() < 0.3) {
      const t = repaso(curso), d = t ? deTema(curso, t, dif) : null;
      if (d) return { ...d, repaso: true };
    }
    if (foco && Math.random() < foco.prob) {
      const d = deTema(curso, foco.temas[Math.floor(Math.random() * foco.temas.length)], dif);
      if (d) return d;
    }
    if (!temas) return null;
    const claves = Object.keys(temas);
    const M = memoria[curso + unidad] || (memoria[curso + unidad] = { bolsa: [], var: {}, ultVar: {}, vistos: [], ultimo: null });
    const nivel = Math.max(1, Math.min(3, dif || 1));
    let respaldo = null;
    for (let intento = 0; intento < 10; intento++) {
      const k = sacarTema(M, claves, stats), t = temas[k];
      // varias variantes del mismo tema hasta encontrar una válida que no haya salido hace poco
      for (let j = 0; j < 6; j++) {
        const i = sacarVariante(M, k, t.variantes.length);
        let d = null;
        for (let r = 0; r < 4 && !valido(d); r++) d = t.variantes[i](r < 2 ? nivel : 1);
        if (!valido(d)) continue;
        d = { ...d, tema: k, titulo: t.titulo };
        if (M.vistos.includes(firma(d))) { respaldo = respaldo || d; continue; }
        M.ultimo = k;
        M.vistos.push(firma(d)); if (M.vistos.length > RECIENTES) M.vistos.shift();
        return d;
      }
    }
    if (respaldo) { M.ultimo = respaldo.tema; return respaldo; }
    return null;
  }

  const titulos = (curso, unidad) => {
    const t = BANCO[curso] && BANCO[curso][unidad];
    return t ? Object.fromEntries(Object.entries(t).map(([k, x]) => [k, x.titulo])) : {};
  };
  function tituloDe(tema) {
    for (const c of Object.values(BANCO)) for (const u of Object.values(c)) if (u[tema]) return u[tema].titulo;
    return ANTIGUOS[tema] || tema;
  }

  // ---------------- tema de la clase y refuerzo ----------------
  // El docente puede fijar uno o más temas para su curso (y a un estudiante, un tema de refuerzo):
  // mientras estén activos, la mayoría de las preguntas de todo el juego salen de esos temas.
  let foco = null;
  function unidadDeTema(curso, tema) {
    const c = BANCO[curso]; if (!c) return null;
    for (const [u, t] of Object.entries(c)) if (t[tema]) return u;
    return null;
  }
  function deTema(curso, tema, dif) {
    const u = unidadDeTema(curso, tema); if (!u) return null;
    const t = BANCO[curso][u][tema];
    const M = memoria[curso + u] || (memoria[curso + u] = { bolsa: [], var: {}, ultVar: {}, vistos: [], ultimo: null });
    const nivel = Math.max(1, Math.min(3, dif || 1));
    let respaldo = null;
    for (let j = 0; j < 8; j++) {
      const i = sacarVariante(M, tema, t.variantes.length);
      let d = null;
      for (let r = 0; r < 4 && !valido(d); r++) d = t.variantes[i](r < 2 ? nivel : 1);
      if (!valido(d)) continue;
      d = { ...d, tema, titulo: t.titulo };
      if (M.vistos.includes(firma(d))) { respaldo = respaldo || d; continue; }
      M.vistos.push(firma(d)); if (M.vistos.length > RECIENTES) M.vistos.shift();
      return d;
    }
    return respaldo;
  }
  function fijarFoco(temas, prob) {
    foco = temas && temas.length ? { temas: [...new Set(temas)], prob: Math.max(0, Math.min(1, prob || 0.75)) } : null;
  }
  P.BANCO_ANTERIOR = VIEJO;
  P.BANCO = BANCO;
  P.nuevo = nuevo;
  P.titulos = titulos;
  P.tituloDe = tituloDe;
  P.deTema = deTema;
  P.unidadDeTema = unidadDeTema;
  P.fijarFoco = fijarFoco;
  P.fijarRepaso = fijarRepaso;
  P.antiguos = ANTIGUOS;
  P.valido = valido;
})(typeof window !== 'undefined' ? window : globalThis);
