// Math World — ampliación del banco de preguntas.
// Agrega a cada tema nuevas variantes para cubrir todas sus propiedades y tipos de ejercicio.
// Cada variante es una función (dif, titulo, tema) que devuelve un desafío con el mismo formato.
(function (global) {
  'use strict';
  const P = global.Preguntas || (typeof module !== 'undefined' ? require('./preguntas_u234.js') : null);
  const { rnd, pick, gcd, num, par, frac, fracTxt, cerca, desafio, redondear, shuffle } = P.h;
  // Relleno para preguntas de ordenar: otras permutaciones de los mismos números
  const permutar = (textos) => () => shuffle([...textos]).join(' < ');
  const pm = () => pick([-1, 1]);
  const pot = (b, e) => `${b}^${e}`;
  const potN = (b, e) => (b < 0 ? `(${num(b)})^${e}` : `${num(b)}^${e}`);
  const ftxt = (n, d) => fracTxt(frac(n, d));

  // Reemplaza gen() del tema por uno que elige entre la versión original y las nuevas variantes.
  function ampliar(curso, unidad, tema, extras, pesoOrig = 1) {
    const t = P.BANCO[curso] && P.BANCO[curso][unidad] && P.BANCO[curso][unidad][tema];
    if (!t) throw new Error(`Tema inexistente: ${curso} ${unidad} ${tema}`);
    const orig = t.gen.bind(t);
    const lista = [...Array(pesoOrig).fill(orig), ...extras.map((f) => (dif) => f(dif, t.titulo, tema))];
    t.gen = function (dif) { return pick(lista)(dif); };
  }

  // =====================================================================
  // POTENCIAS (8° básico): todas las propiedades
  // =====================================================================
  ampliar('8basico', 'u1', 'potencias', [
    // Potencia de una potencia
    (dif, T, k) => {
      const a = pick([2, 3, 5, 7, 10]), m = rnd(2, 5), n = rnd(2, 4);
      return desafio(k, T, `Escribe como una sola potencia: (${pot(a, m)})^${n}`,
        pot(a, m * n), [pot(a, m + n), pot(a, m ** n === m * n ? m * n + 1 : m ** n), pot(a * n, m)], (j) => pot(a, m * n + j),
        'Potencia de una potencia: se conserva la base y se multiplican los exponentes.',
        `(${pot(a, m)})^${n} = ${pot(a, m * n)}, porque ${m} · ${n} = ${m * n}.`);
    },
    // Multiplicación de potencias de igual exponente
    (dif, T, k) => {
      const a = rnd(2, 5), b = rnd(2, 5), n = rnd(2, 5);
      return desafio(k, T, `Escribe como una sola potencia: ${pot(a, n)} · ${pot(b, n)}`,
        pot(a * b, n), [pot(a * b, 2 * n), pot(a + b, n), `${a * b}^${n * n}`], (j) => pot(a * b, n + j),
        'Si los exponentes son iguales, se multiplican las bases y se conserva el exponente.',
        `${pot(a, n)} · ${pot(b, n)} = (${a} · ${b})^${n} = ${pot(a * b, n)}.`);
    },
    // División de potencias de igual exponente
    (dif, T, k) => {
      const b = rnd(2, 5), q = rnd(2, 5), a = b * q, n = rnd(2, 5);
      return desafio(k, T, `Escribe como una sola potencia: ${pot(a, n)} : ${pot(b, n)}`,
        pot(q, n), [pot(q, 0), pot(a - b, n), pot(q, 2 * n)], (j) => pot(q, n + j),
        'Si los exponentes son iguales, se dividen las bases y se conserva el exponente.',
        `${pot(a, n)} : ${pot(b, n)} = (${a} : ${b})^${n} = ${pot(q, n)}.`);
    },
    // Potencia de un producto
    (dif, T, k) => {
      const a = rnd(2, 4), b = rnd(2, 4) * (dif >= 2 ? pm() : 1), n = rnd(2, 3);
      const r = (a * b) ** n;
      return desafio(k, T, `Calcula: (${a} · ${par(b)})^${n}`,
        num(r), [num(a * b * n), num(a ** n + b ** n), num(-r)], cerca(r),
        'Potencia de un producto: (a · b)^n = a^n · b^n. También puedes multiplicar primero y después elevar.',
        `(${a} · ${par(b)})^${n} = ${potN(a * b, n)} = ${num(r)}.`);
    },
    // Potencia de una fracción
    (dif, T, k) => {
      const a = rnd(1, 4), b = rnd(a + 1, 6), n = rnd(2, 3);
      const sg = dif >= 2 && n === 3 ? pm() : 1;
      const res = ftxt(sg * a ** n, b ** n);
      return desafio(k, T, `Calcula: (${sg < 0 ? '−' : ''}${a}/${b})^${n}`,
        res, [ftxt(sg * a * n, b * n), ftxt(sg * a ** n, b), ftxt(-sg * a ** n, b ** n)], (j) => ftxt(sg * (a ** n + j), b ** n),
        'Potencia de una fracción: se elevan el numerador y el denominador.',
        `(${sg < 0 ? '−' : ''}${a}/${b})^${n} = ${sg < 0 ? '−' : ''}${a}^${n}/${b}^${n} = ${res}.`);
    },
    // Exponente cero
    (dif, T, k) => {
      const base = pick([`${rnd(2, 99)}`, `(−${rnd(2, 40)})`, `(${rnd(1, 7)}/${rnd(8, 15)})`, `(${rnd(2, 9)},${rnd(1, 9)})`]);
      return desafio(k, T, `¿Cuánto es ${base}^0?`,
        '1', ['0', base.replace(/[()]/g, ''), '−1'], null,
        'Toda potencia de base distinta de cero y exponente 0 es igual a 1.',
        `${base}^0 = 1. Por ejemplo, 5^3 : 5^3 = 5^0 y también es igual a 1.`);
    },
    // Exponente uno y ceros combinados
    (dif, T, k) => {
      const a = rnd(2, 9), b = rnd(10, 30), c = rnd(2, 6);
      const r = a + 1 + c * c;
      return desafio(k, T, `Calcula: ${a}^1 + ${b}^0 + ${c}^2`,
        num(r), [num(a + b + c * 2), num(a + c * c), num(1 + 0 + c * c)], cerca(r),
        'Recuerda: a^1 = a y a^0 = 1 (si a no es cero).',
        `${a}^1 + ${b}^0 + ${c}^2 = ${a} + 1 + ${c * c} = ${r}.`);
    },
    // Propiedades combinadas
    (dif, T, k) => {
      const a = pick([2, 3, 5]), m = rnd(3, 6), n = rnd(2, 5), p = rnd(2, m + n - 1);
      const e = m + n - p;
      return desafio(k, T, `Escribe como una sola potencia: ${pot(a, m)} · ${pot(a, n)} : ${pot(a, p)}`,
        pot(a, e), [pot(a, m + n + p), pot(a, m * n - p), pot(a, (m * n) / p | 0 || 1)], (j) => pot(a, e + j + 1),
        'Primero multiplica (suma los exponentes) y después divide (resta el exponente).',
        `${m} + ${n} − ${p} = ${e}, entonces el resultado es ${pot(a, e)}.`);
    },
    // Calcular el valor de una potencia
    (dif, T, k) => {
      const [a, n] = pick([[2, 5], [2, 6], [3, 3], [3, 4], [4, 3], [5, 3], [2, 7], [6, 2], [10, 4], [2, 10]]);
      const r = a ** n;
      return desafio(k, T, `¿Cuál es el valor de ${pot(a, n)}?`,
        num(r), [num(a * n), num(n ** a), num(a ** (n - 1))], (j) => num(r + j * a),
        `${pot(a, n)} significa multiplicar ${a} por sí mismo ${n} veces; no es ${a} · ${n}.`,
        `${pot(a, n)} = ${Array(n).fill(a).join(' · ')} = ${num(r)}.`);
    },
    // Distinguir propiedades correctas
    (dif, T, k) => {
      const a = pick([2, 3, 5]), m = rnd(2, 5);
      let n = rnd(2, 5); while (n === m) n = rnd(2, 5);
      const correctas = [`${pot(a, m)} · ${pot(a, n)} = ${pot(a, m + n)}`, `(${pot(a, m)})^${n} = ${pot(a, m * n)}`, `${pot(a, m + n)} : ${pot(a, n)} = ${pot(a, m)}`];
      const c = pick(correctas);
      return desafio(k, T, '¿Cuál de estas igualdades es correcta?',
        c, [`${pot(a, m)} · ${pot(a, n)} = ${pot(a, m * n)}`, `(${pot(a, m)})^${n} = ${pot(a, m + n)}`, `${pot(a, m)} + ${pot(a, n)} = ${pot(a, m + n)}`], null,
        'Multiplicar potencias de igual base: se suman exponentes. Potencia de potencia: se multiplican. La suma de potencias no tiene una propiedad así.',
        `La correcta es ${c}.`);
    },
    // Exponente negativo (desafío avanzado)
    (dif, T, k) => {
      if (dif < 3) return null;
      const a = pick([2, 3, 4, 5, 10]), n = rnd(1, 3);
      return desafio(k, T, `Desafío avanzado: ¿cuánto es ${a}^−${n}?`,
        ftxt(1, a ** n), [num(-(a ** n)), ftxt(-1, a ** n), ftxt(1, a * n)], (j) => ftxt(1, a ** n + j),
        'Un exponente negativo indica el inverso: a^−n = 1/a^n.',
        `${a}^−${n} = 1/${a}^${n} = ${ftxt(1, a ** n)}.`);
    },
  ], 3);

  // =====================================================================
  // POTENCIAS DE BASE 10 (7° básico)
  // =====================================================================
  ampliar('7basico', 'u1', 'potencias10', [
    (dif, T, k) => {
      const m = rnd(1, 6), n = rnd(1, 5);
      return desafio(k, T, `Escribe como una sola potencia: 10^${m} · 10^${n}`,
        `10^${m + n}`, [`10^${m * n === m + n ? m * n + 1 : m * n}`, `100^${m + n}`, `20^${m + n}`], (j) => `10^${m + n + j}`,
        'Al multiplicar potencias de base 10 se suman los exponentes.', `10^${m} · 10^${n} = 10^${m + n}.`);
    },
    (dif, T, k) => {
      const m = rnd(4, 9), n = rnd(1, m - 1);
      return desafio(k, T, `Escribe como una sola potencia: 10^${m} : 10^${n}`,
        `10^${m - n}`, [`10^${m + n}`, `1^${m - n}`, `10^${m * n}`], (j) => `10^${m - n + j}`,
        'Al dividir potencias de base 10 se restan los exponentes.', `10^${m} : 10^${n} = 10^${m - n}.`);
    },
    (dif, T, k) => {
      const m = rnd(2, 4), n = rnd(2, 3);
      return desafio(k, T, `Escribe como una sola potencia: (10^${m})^${n}`,
        `10^${m * n}`, [`10^${m + n}`, `100^${m}`, `10^${m ** n}`], (j) => `10^${m * n + j}`,
        'Potencia de una potencia: se multiplican los exponentes.', `(10^${m})^${n} = 10^${m * n}.`);
    },
    (dif, T, k) => desafio(k, T, '¿Cuánto es 10^0?', '1', ['0', '10', '100'], null,
      'Toda potencia de exponente 0 (con base distinta de cero) vale 1.', '10^0 = 1, por ejemplo 10^3 : 10^3 = 10^0 = 1.'),
    (dif, T, k) => {
      const a = pick([4.7, 35, 0.82, 126, 2.5]), n = rnd(1, 3);
      const r = redondear(a / 10 ** n);
      return desafio(k, T, `Calcula: ${num(a)} : 10^${n}`,
        num(r), [num(redondear(a * 10 ** n)), num(redondear(a / 10 ** (n + 1))), num(redondear(a / 10 ** Math.max(0, n - 1)))], (j) => num(redondear(r * 10 ** (j + 1))),
        `Dividir por 10^${n} corre la coma ${n} lugares a la izquierda.`, `${num(a)} : 10^${n} = ${num(r)}.`);
    },
    (dif, T, k) => {
      const c = [rnd(1, 9), rnd(0, 9), rnd(1, 9), rnd(0, 9)];
      const N = c[0] * 1000 + c[1] * 100 + c[2] * 10 + c[3];
      const forma = `${c[0]} · 10^3 + ${c[1]} · 10^2 + ${c[2]} · 10^1 + ${c[3]} · 10^0`;
      return desafio(k, T, `¿Qué número representa ${forma}?`,
        num(N), [num(c[3] * 1000 + c[2] * 100 + c[1] * 10 + c[0]), num(c[0] + c[1] + c[2] + c[3]), num(N * 10)], (j) => num(N + j * 10),
        'Cada término indica el valor de una posición: unidades de mil, centenas, decenas y unidades.', `${forma} = ${num(N)}.`);
    },
    (dif, T, k) => {
      const a = rnd(2, 9), b = rnd(2, 9), m = rnd(3, 6);
      const mayor = `${a} · 10^${m + 1}`, menor = `${b} · 10^${m}`;
      return desafio(k, T, `¿Cuál de estos números es el mayor?`,
        mayor, [menor, `${a} · 10^${m - 1}`, `${b} · 10^${m - 1}`, `${a} · 10^${m}`, `${b} · 10^${m - 2}`], null,
        'Compara primero los exponentes: la potencia de 10 más grande indica el número mayor.',
        `${mayor} = ${num(a * 10 ** (m + 1))} es el mayor.`);
    },
  ], 3);

  // =====================================================================
  // RAÍZ CUADRADA (8° básico)
  // =====================================================================
  ampliar('8basico', 'u1', 'raiz', [
    (dif, T, k) => {
      const a = pick([4, 9, 16, 25]), b = pick([4, 9, 16, 25, 36, 49].filter((x) => x !== a));
      const r = Math.sqrt(a) * Math.sqrt(b);
      return desafio(k, T, `Calcula: √(${a} · ${b})`,
        num(r), [num(Math.sqrt(a) + Math.sqrt(b)), num(a * b / 2), num(r * 2)], cerca(r),
        'Raíz de un producto: √(a · b) = √a · √b.', `√(${a} · ${b}) = √${a} · √${b} = ${Math.sqrt(a)} · ${Math.sqrt(b)} = ${r}.`);
    },
    (dif, T, k) => {
      const q = rnd(2, 12); let p = rnd(1, q - 1);
      while (gcd(p, q) !== 1) p = rnd(1, q - 1);
      return desafio(k, T, `Calcula: √(${p * p}/${q * q})`,
        ftxt(p, q), [ftxt(p * p, q), ftxt(p, q * q), ftxt(p * 2, q * 2 + 1)], (j) => ftxt(p + j, q),
        'Raíz de una fracción: se calcula la raíz del numerador y la del denominador.', `√(${p * p}/${q * q}) = √${p * p}/√${q * q} = ${ftxt(p, q)}.`);
    },
    (dif, T, k) => {
      const [x, r] = pick([[0.25, 0.5], [0.36, 0.6], [0.49, 0.7], [0.81, 0.9], [1.44, 1.2], [0.04, 0.2], [2.25, 1.5], [0.09, 0.3]]);
      return desafio(k, T, `Calcula: √${num(x)}`,
        num(r), [num(x / 2), num(r / 10), num(r * 10)], (j) => num(redondear(r + j * 0.1)),
        'Busca el decimal que multiplicado por sí mismo dé el número. Puedes pensar en fracciones: 0,25 = 25/100.', `${num(r)} · ${num(r)} = ${num(x)}, entonces √${num(x)} = ${num(r)}.`);
    },
    (dif, T, k) => {
      const a = rnd(3, 25);
      const forma = pick([`(√${a})^2`, `√(${a}^2)`]);
      return desafio(k, T, `Calcula: ${forma}`,
        num(a), [num(a * a), num(2 * a), num(Math.round(Math.sqrt(a)))], cerca(a),
        'La raíz cuadrada y el cuadrado son operaciones inversas: se anulan.', `${forma} = ${a}.`);
    },
    (dif, T, k) => {
      const a = rnd(2, 12), b = rnd(2, 12);
      const r = a + b;
      return desafio(k, T, `Calcula: √${a * a} + √${b * b}`,
        num(r), [num(Math.round(Math.sqrt(a * a + b * b) * 100) / 100), num(a * a + b * b), num(a * b)], cerca(r),
        'Calcula cada raíz por separado. Ojo: √(a + b) no es igual a √a + √b.', `√${a * a} + √${b * b} = ${a} + ${b} = ${r}.`);
    },
    (dif, T, k) => {
      const a = rnd(2, 15), A = a * a;
      return desafio(k, T, `Un cuadrado de piedra tiene área ${A} m². ¿Cuál es su perímetro?`,
        `${4 * a} m`, [`${a} m`, `${A / 2} m`, `${2 * a} m`], (j) => `${4 * a + 4 * j} m`,
        'Primero calcula el lado con la raíz cuadrada del área; luego suma los 4 lados.', `Lado = √${A} = ${a} m. Perímetro = 4 · ${a} = ${4 * a} m.`);
    },
  ], 3);

  // =====================================================================
  // 8° BÁSICO · resto de la Unidad 1
  // =====================================================================
  ampliar('8basico', 'u1', 'multdiv', [
    (dif, T, k) => { // prioridad de operaciones
      const a = rnd(-9, 9) || 3, b = rnd(2, 6), c = rnd(-6, 6) || -2;
      const r = a + b * c;
      return desafio(k, T, `Calcula respetando la prioridad de las operaciones: ${num(a)} + ${b} · ${par(c)}`,
        num(r), [num((a + b) * c), num(a - b * c), num(a + b + c)], cerca(r),
        'Primero se multiplica y después se suma.', `${b} · ${par(c)} = ${num(b * c)}; luego ${num(a)} + ${par(b * c)} = ${num(r)}.`);
    },
    (dif, T, k) => {
      const q = rnd(2, 6) * pm(), d = rnd(2, 6) * pm(), m = rnd(2, 5) * pm(), D = q * d;
      const r = q * m;
      return desafio(k, T, `Calcula de izquierda a derecha: ${par(D)} : ${par(d)} · ${par(m)}`,
        num(r), [num(D / (d * m) | 0 || 1), num(-r), num(q + m)], cerca(r),
        'La división y la multiplicación tienen la misma prioridad: se resuelven de izquierda a derecha.', `${par(D)} : ${par(d)} = ${num(q)}; ${par(q)} · ${par(m)} = ${num(r)}.`);
    },
    (dif, T, k) => {
      const a = rnd(2, 6), b = rnd(-8, 8) || 4, c = rnd(-8, 8) || -3;
      const r = -a * (b - c);
      return desafio(k, T, `Calcula: −${a} · (${num(b)} − ${par(c)})`,
        num(r), [num(-a * b - c), num(a * (b - c)), num(-a * (b + c))], cerca(r),
        'Resuelve primero el paréntesis y después multiplica, cuidando la regla de signos.', `${num(b)} − ${par(c)} = ${num(b - c)}; −${a} · ${par(b - c)} = ${num(r)}.`);
    },
    (dif, T, k) => {
      const n = rnd(3, 7), sg = n % 2 === 0;
      return desafio(k, T, `Si multiplicas ${n} números negativos entre sí, ¿qué signo tiene el resultado?`,
        sg ? 'Positivo' : 'Negativo', [sg ? 'Negativo' : 'Positivo', 'Depende de los números', 'Es cero'], null,
        'Cada par de factores negativos da un producto positivo.', `Con ${n} factores negativos (${sg ? 'cantidad par' : 'cantidad impar'}), el resultado es ${sg ? 'positivo' : 'negativo'}.`);
    },
  ], 3);

  ampliar('8basico', 'u1', 'racionales', [
    (dif, T, k) => {
      const b = rnd(2, 7), d = rnd(2, 7), s = pm();
      let a = rnd(1, b - 1), c = rnd(1, d - 1);
      while (gcd(a, b) !== 1) a = rnd(1, b - 1);
      while (gcd(c, d) !== 1) c = rnd(1, d - 1);
      const r = frac(s * a * d, b * c);
      return desafio(k, T, `Calcula: ${s < 0 ? '−' : ''}${a}/${b} : ${c}/${d}`,
        fracTxt(r), [ftxt(s * a * c, b * d), ftxt(-s * a * d, b * c), ftxt(s * b * c, a * d)], (j) => fracTxt(frac(r.n + j, r.d)),
        'Dividir por una fracción es multiplicar por su inverso; luego aplica la regla de signos.', `${s < 0 ? '−' : ''}${a}/${b} · ${d}/${c} = ${fracTxt(r)}.`);
    },
    (dif, T, k) => {
      const vals = [[-0.5, '−0,5'], [-1 / 3, '−1/3'], [0.25, '0,25'], [-3 / 4, '−3/4'], [1 / 2, '1/2'], [-1.2, '−1,2'], [0.8, '0,8']];
      const el = [];
      while (el.length < 3) { const v = pick(vals); if (!el.includes(v)) el.push(v); }
      const orden = [...el].sort((x, y) => x[0] - y[0]).map((x) => x[1]).join(' < ');
      return desafio(k, T, `Ordena de menor a mayor: ${el.map((x) => x[1]).join(' ; ')}`,
        orden, [[...el].sort((x, y) => y[0] - x[0]).map((x) => x[1]).join(' < '), [...el].sort((x, y) => Math.abs(x[0]) - Math.abs(y[0])).map((x) => x[1]).join(' < '), el.map((x) => x[1]).join(' < ')], permutar(el.map((x) => x[1])),
        'Pasa todos a decimal para compararlos. Entre negativos, es menor el que está más lejos del cero.', `En decimal: ${el.map((x) => `${x[1]} = ${num(redondear(x[0], 3))}`).join(', ')}. Orden: ${orden}.`);
    },
    (dif, T, k) => {
      const [x, f] = pick([[0.75, '3/4'], [0.4, '2/5'], [0.125, '1/8'], [1.5, '3/2'], [0.35, '7/20'], [2.25, '9/4'], [0.6, '3/5']]);
      const neg = dif >= 2 && Math.random() < 0.5;
      return desafio(k, T, `¿Qué fracción irreducible es igual a ${neg ? '−' : ''}${num(x)}?`,
        (neg ? '−' : '') + f, [(neg ? '' : '−') + f, `${String(x).replace('.', '')}/10`, `1/${num(x)}`.replace(',', '')], null,
        'Escribe el decimal como fracción con denominador 10, 100 o 1000 y simplifica.', `${neg ? '−' : ''}${num(x)} = ${neg ? '−' : ''}${f}.`);
    },
    (dif, T, k) => {
      const b = pick([2, 4, 5]), d = pick([3, 6]);
      let a = rnd(1, b - 1), c = rnd(1, d - 1);
      while (gcd(a, b) !== 1) a = rnd(1, b - 1);
      while (gcd(c, d) !== 1) c = rnd(1, d - 1);
      const r = frac(a * d - b * c, b * d);
      return desafio(k, T, `Calcula: ${a}/${b} − ${c}/${d}`,
        fracTxt(r), [ftxt(a - c, b - d || 1), ftxt(a - c, b + d), ftxt(a * d + b * c, b * d)], (j) => fracTxt(frac(r.n + j, r.d)),
        'Usa un denominador común antes de restar.', `${a}/${b} − ${c}/${d} = ${a * d}/${b * d} − ${b * c}/${b * d} = ${fracTxt(r)}.`);
    },
  ], 3);

  ampliar('8basico', 'u1', 'variacion', [
    (dif, T, k) => {
      const P0 = 100 * rnd(1, 9), p1 = pick([10, 20, 50]), p2 = pick([10, 20, 25]);
      const r = P0 * (1 + p1 / 100) * (1 - p2 / 100);
      return desafio(k, T, `Una espada cuesta ${P0} de madera. Sube un ${p1} % y luego baja un ${p2} %. ¿Cuál es el precio final?`,
        num(redondear(r, 2)), [num(P0 * (1 + (p1 - p2) / 100)), num(P0), num(redondear(P0 * (1 - p1 / 100) * (1 + p2 / 100), 2) + 1)], (j) => num(redondear(r + j * 5, 2)),
        'Las variaciones sucesivas se multiplican: aumento por 1 + p/100 y disminución por 1 − p/100. No basta con restar los porcentajes.',
        `${P0} · ${num(1 + p1 / 100)} · ${num(1 - p2 / 100)} = ${num(redondear(r, 2))}.`);
    },
    (dif, T, k) => {
      const p = pick([10, 20, 25, 50]), F = 20 * rnd(2, 8) * (100 + p) / 100;
      if (!Number.isInteger(F)) return null;
      const P0 = F / (1 + p / 100);
      return desafio(k, T, `Después de un aumento del ${p} %, un hacha cuesta ${num(F)} de madera. ¿Cuánto costaba antes?`,
        num(P0), [num(F - (F * p) / 100), num(F * (1 + p / 100)), num(F - p)], cerca(P0, num, 2),
        `El precio final es el ${100 + p} % del original: divide por ${num(1 + p / 100)}.`, `${num(F)} : ${num(1 + p / 100)} = ${num(P0)}.`);
    },
    (dif, T, k) => {
      const p = pick([5, 12, 15, 30, 40]), sube = Math.random() < 0.5;
      const f = sube ? 1 + p / 100 : 1 - p / 100;
      return desafio(k, T, `¿Por qué número multiplicas una cantidad para ${sube ? 'aumentarla' : 'disminuirla'} en un ${p} %?`,
        num(f), [num(sube ? 1 - p / 100 : 1 + p / 100), num(p / 100), num(p)], null,
        `Aumentar un p % es multiplicar por (1 + p/100); disminuir un p % es multiplicar por (1 − p/100).`, `El factor es ${num(f)}.`);
    },
    (dif, T, k) => {
      const C = 100 * rnd(1, 10), i = pick([2, 3, 5]), t = rnd(2, 5);
      const I = (C * i * t) / 100;
      return desafio(k, T, `Guardas ${C} cristales en un banco que paga ${i} % de interés simple por año. ¿Cuántos cristales de interés ganas en ${t} años?`,
        num(I), [num((C * i) / 100), num(C + I), num(C * (1 + i / 100) ** t - C | 0)], cerca(I, num, 5),
        'Interés simple: capital · tasa · tiempo : 100.', `${C} · ${i} · ${t} : 100 = ${num(I)} cristales.`);
    },
  ], 3);

  // =====================================================================
  // 7° BÁSICO · resto de la Unidad 1
  // =====================================================================
  ampliar('7basico', 'u1', 'enteros', [
    (dif, T, k) => {
      const a = rnd(-15, 15) || 7;
      const pregunta = pick(['valor absoluto', 'opuesto']);
      const r = pregunta === 'opuesto' ? -a : Math.abs(a);
      return desafio(k, T, `¿Cuál es el ${pregunta} de ${num(a)}?`,
        num(r), [num(-r), num(pregunta === 'opuesto' ? Math.abs(a) : a), num(r + 1)], cerca(r),
        pregunta === 'opuesto' ? 'El opuesto está a la misma distancia del cero, al otro lado.' : 'El valor absoluto es la distancia al cero: nunca es negativo.',
        `El ${pregunta} de ${num(a)} es ${num(r)}.`);
    },
    (dif, T, k) => {
      const xs = []; while (xs.length < 4) { const v = rnd(-12, 12); if (!xs.includes(v)) xs.push(v); }
      const orden = [...xs].sort((a, b) => a - b).map(num).join(' < ');
      return desafio(k, T, `Ordena de menor a mayor: ${xs.map(num).join(' ; ')}`,
        orden, [[...xs].sort((a, b) => Math.abs(a) - Math.abs(b)).map(num).join(' < '), [...xs].sort((a, b) => b - a).map(num).join(' < '), xs.map(num).join(' < ')], permutar(xs.map(num)),
        'En la recta numérica, los números a la izquierda son menores. Entre negativos, −10 es menor que −2.', `Orden: ${orden}.`);
    },
    (dif, T, k) => {
      const a = rnd(-10, 10), b = rnd(-10, 10), c = rnd(-10, 10);
      const r = a - (b - c);
      return desafio(k, T, `Calcula: ${num(a)} − (${num(b)} − ${par(c)})`,
        num(r), [num(a - b - c), num(a + b - c), num(-r)], cerca(r),
        'Resuelve primero el paréntesis. Restar un número es sumar su opuesto.', `${num(b)} − ${par(c)} = ${num(b - c)}; ${num(a)} − ${par(b - c)} = ${num(r)}.`);
    },
    (dif, T, k) => {
      const piso = rnd(-5, -1), sube = rnd(3, 12), baja = rnd(2, 9);
      const r = piso + sube - baja;
      return desafio(k, T, `Un ascensor de la mina está en el piso ${num(piso)}. Sube ${sube} pisos y después baja ${baja}. ¿En qué piso queda?`,
        num(r), [num(piso - sube + baja), num(sube - baja), num(piso + sube + baja)], cerca(r),
        'Subir es sumar y bajar es restar.', `${num(piso)} + ${sube} − ${baja} = ${num(r)}.`);
    },
  ], 2);

  ampliar('7basico', 'u1', 'fracdec', [
    (dif, T, k) => {
      const e1 = rnd(1, 3), b = pick([2, 3, 4]), n1 = rnd(1, b - 1), c = rnd(2, 4);
      const r = frac((e1 * b + n1) * c, b);
      const mixto = `${e1} ${n1}/${b}`;
      return desafio(k, T, `Calcula: ${mixto} · ${c}`,
        fracTxt(r), [ftxt(e1 * c * b + n1, b), ftxt((e1 + n1) * c, b), ftxt(e1 * b + n1, b * c)], (j) => fracTxt(frac(r.n + j, r.d)),
        'Transforma el número mixto a fracción impropia y luego multiplica.', `${mixto} = ${e1 * b + n1}/${b}; ${e1 * b + n1}/${b} · ${c} = ${fracTxt(r)}.`);
    },
    (dif, T, k) => {
      const a = rnd(1, 9), b = rnd(2, 9);
      if (gcd(a, b) !== 1) return null;
      return desafio(k, T, `¿Cuál es el inverso multiplicativo de ${a}/${b}?`,
        ftxt(b, a), [ftxt(-a, b), ftxt(a, b), ftxt(1, a * b), ftxt(-b, a)], null,
        'El inverso multiplicativo es el número que al multiplicarlo da 1: se da vuelta la fracción.', `${a}/${b} · ${b}/${a} = 1, entonces el inverso es ${ftxt(b, a)}.`);
    },
    (dif, T, k) => {
      const [f, d] = pick([['1/4', 0.25], ['3/5', 0.6], ['7/8', 0.875], ['3/20', 0.15], ['9/4', 2.25], ['1/8', 0.125]]);
      return desafio(k, T, `¿Qué número decimal es igual a ${f}?`,
        num(d), [num(Number(f.split('/')[0]) / 10), num(redondear(d * 10)), num(redondear(1 / d, 3))], (j) => num(redondear(d + j * 0.05)),
        'Divide el numerador por el denominador.', `${f.replace('/', ' : ')} = ${num(d)}.`);
    },
    (dif, T, k) => {
      const x = pick([3.6, 4.8, 7.5, 1.26, 9.6]), y = pick([1.2, 0.3, 0.6, 2.4]);
      const r = redondear(x / y, 3);
      if (!Number.isInteger(r * 100)) return null;
      return desafio(k, T, `Calcula: ${num(x)} : ${num(y)}`,
        num(r), [num(redondear(r / 10, 3)), num(redondear(r * 10, 3)), num(redondear(x * y, 3))], (j) => num(redondear(r + j, 3)),
        'Multiplica dividendo y divisor por 10 (o 100) para que el divisor no tenga coma.', `${num(x)} : ${num(y)} = ${num(redondear(x * 10))} : ${num(redondear(y * 10))} = ${num(r)}.`);
    },
  ], 3);

  ampliar('7basico', 'u1', 'porcentajes', [
    (dif, T, k) => {
      const [p, f, d] = pick([[25, '1/4', 0.25], [50, '1/2', 0.5], [75, '3/4', 0.75], [20, '1/5', 0.2], [10, '1/10', 0.1], [40, '2/5', 0.4]]);
      const forma = pick(['fracción', 'decimal']);
      return desafio(k, T, `¿Qué ${forma} representa el ${p} %?`,
        forma === 'fracción' ? f : num(d), forma === 'fracción' ? [`${p}/10`, `1/${p}`, `${p}/1000`, `${100 - p}/100`] : [num(p), num(d * 10), num(d / 10), num(redondear(1 - d))],
        forma === 'fracción' ? (j) => `${p + j}/100` : (j) => num(redondear(d + j * 0.05)),
        `El ${p} % es ${p}/100: simplifica o escríbelo como decimal.`, `${p} % = ${p}/100 = ${forma === 'fracción' ? f : num(d)}.`);
    },
    (dif, T, k) => {
      const p = pick([10, 20, 25, 50]), parte = rnd(2, 12) * (p === 25 ? 1 : 1);
      const total = (parte * 100) / p;
      return desafio(k, T, `${parte} cristales son el ${p} % de tu cofre. ¿Cuántos cristales hay en total?`,
        num(total), [num((parte * p) / 100), num(parte + p), num(total / 2)], cerca(total, num, 2),
        `Si ${parte} es el ${p} %, el 100 % es ${100 / p} veces esa cantidad.`, `${parte} · ${num(100 / p)} = ${num(total)}.`);
    },
    (dif, T, k) => {
      const N = 10 * rnd(2, 20), p = pick([110, 125, 150, 200]);
      const r = (N * p) / 100;
      return desafio(k, T, `¿Cuánto es el ${p} % de ${N}?`,
        num(r), [num(N + p), num((N * (p - 100)) / 100), num(N)], cerca(r, num, 5),
        'Un porcentaje mayor que 100 % da un resultado mayor que la cantidad original.', `${N} · ${p} : 100 = ${num(r)}.`);
    },
  ], 3);

  // =====================================================================
  // UNIDADES 2, 3 y 4: más variantes por tema
  // =====================================================================
  const lineal = (a, b, v = 'x') => {
    let t = a === 1 ? v : a === -1 ? '−' + v : a === 0 ? '' : num(a) + v;
    if (b === 0) return t || '0';
    if (!t) return num(b);
    return t + (b > 0 ? ' + ' : ' − ') + Math.abs(b);
  };

  ampliar('7basico', 'u2', 'lenguaje', [
    (dif, T, k) => {
      const b = rnd(1, 9);
      return desafio(k, T, `¿Cómo se escribe "la mitad de un número disminuida en ${b}"?`,
        `x : 2 − ${b}`, [`(x − ${b}) : 2`, `2x − ${b}`, `x − ${b} : 2`], null,
        'Primero se toma la mitad del número y después se le resta.', `La mitad de x es x : 2; disminuida en ${b} queda x : 2 − ${b}.`);
    },
    (dif, T, k) => {
      const n = rnd(2, 9);
      return desafio(k, T, `Si n es un número, ¿cómo se escribe "el sucesor del doble de n"?`,
        '2n + 1', ['2(n + 1)', 'n + 2', '2n − 1'], null,
        'El sucesor de un número es ese número más 1.', 'El doble de n es 2n y su sucesor es 2n + 1.');
    },
  ]);
  ampliar('7basico', 'u2', 'expresiones7', [
    (dif, T, k) => {
      const a = rnd(2, 9), b = rnd(2, 9), x = rnd(1, 6), y = rnd(1, 6);
      const r = a * x - b * y;
      return desafio(k, T, `Valora ${a}x − ${b}y si x = ${x} e y = ${y}.`,
        num(r), [num(a * y - b * x), num(a + x - b - y), num(a * x + b * y)], cerca(r),
        'Reemplaza cada letra por su valor y respeta la prioridad de las operaciones.', `${a} · ${x} − ${b} · ${y} = ${a * x} − ${b * y} = ${num(r)}.`);
    },
    (dif, T, k) => {
      const a = rnd(2, 6), b = rnd(2, 6), c = rnd(1, 5), d = rnd(1, 5);
      return desafio(k, T, `Reduce: ${a}x + ${b}y + ${c}x − ${d}y`,
        `${a + c}x ${b - d >= 0 ? '+' : '−'} ${Math.abs(b - d)}y`.replace(' + 0y', '').replace(' − 0y', ''),
        [`${a + c + b - d}xy`, `${a + c}x + ${b + d}y`, `${a - c}x ${b - d >= 0 ? '+' : '−'} ${Math.abs(b - d)}y`], (j) => `${a + c + j}x + ${b}y`,
        'Solo se pueden sumar términos semejantes: los que tienen la misma letra.', `x: ${a} + ${c} = ${a + c}; y: ${b} − ${d} = ${b - d}.`);
    },
  ]);
  ampliar('7basico', 'u2', 'proporcion', [
    (dif, T, k) => {
      const kk = rnd(2, 9), x = rnd(2, 8);
      return desafio(k, T, `En una tabla de proporcionalidad directa, cuando x = ${x}, y = ${kk * x}. ¿Cuál es la constante de proporcionalidad (y : x)?`,
        num(kk), [num(kk * x), num(x), num(kk + x)], cerca(kk),
        'En la proporcionalidad directa el cociente y : x es siempre el mismo.', `${kk * x} : ${x} = ${kk}.`);
    },
    (dif, T, k) => {
      const esc = pick([100, 500, 1000, 2000]), cm = rnd(2, 9);
      const m = (cm * esc) / 100;
      return desafio(k, T, `En el mapa del mundo, la escala es 1 : ${esc}. Si dos árboles están a ${cm} cm en el mapa, ¿a cuántos metros están en realidad?`,
        `${num(m)} m`, [`${num(cm * esc)} m`, `${num(m / 10)} m`, `${num(cm + esc)} m`], (j) => `${num(m + j * 5)} m`,
        'Multiplica la medida del mapa por la escala y luego pasa de centímetros a metros (divide por 100).', `${cm} · ${esc} = ${num(cm * esc)} cm = ${num(m)} m.`);
    },
  ]);
  ampliar('7basico', 'u2', 'ecuaciones7', [
    (dif, T, k) => {
      const a = rnd(2, 6), x = rnd(2, 15), b = rnd(1, 12);
      return desafio(k, T, `El ${['doble', 'triple', 'cuádruple', 'quíntuple', 'séxtuple'][a - 2]} de un número, más ${b}, es ${a * x + b}. ¿Cuál es el número?`,
        num(x), [num(a * x + b - b * a), num((a * x + b) / a | 0), num(a * x)], cerca(x),
        `Plantea ${a}x + ${b} = ${a * x + b} y despeja x.`, `${a}x = ${a * x}, entonces x = ${x}.`);
    },
    (dif, T, k) => {
      const a = rnd(2, 5), r = rnd(1, 8), b = rnd(1, 9), c = a * r + b;
      return desafio(k, T, `Resuelve la inecuación: ${a}x + ${b} < ${c}`,
        `x < ${r}`, [`x > ${r}`, `x < ${c - b}`, `x = ${r}`], (j) => `x < ${r + j}`,
        `Resta ${b} y divide por ${a}, como en una ecuación. Al dividir por un positivo el signo no cambia.`, `${a}x < ${c - b}, entonces x < ${r}.`);
    },
  ]);

  ampliar('7basico', 'u3', 'angulos', [
    (dif, T, k) => {
      const n = pick([5, 6, 8, 9, 10, 12]);
      const r = ((n - 2) * 180) / n;
      return desafio(k, T, `¿Cuánto mide cada ángulo interior de un polígono regular de ${n} lados?`,
        `${num(r)}°`, [`${num((n - 2) * 180)}°`, `${num(360 / n)}°`, `${num(180 - r + 10)}°`], (j) => `${num(r + j * 5)}°`,
        'Suma de los ángulos interiores: (n − 2) · 180°. En un polígono regular todos miden lo mismo.', `(${n} − 2) · 180° : ${n} = ${num(r)}°.`);
    },
    (dif, T, k) => {
      const a = rnd(15, 75), tipo = pick(['complementario', 'suplementario']);
      const r = (tipo === 'complementario' ? 90 : 180) - a;
      return desafio(k, T, `¿Cuánto mide el ángulo ${tipo} de un ángulo de ${a}°?`,
        `${r}°`, [`${(tipo === 'complementario' ? 180 : 90) - a}°`, `${a}°`, `${360 - a}°`], (j) => `${r + j * 5}°`,
        'Dos ángulos complementarios suman 90°; dos suplementarios suman 180°.', `${tipo === 'complementario' ? 90 : 180}° − ${a}° = ${r}°.`);
    },
  ]);
  ampliar('7basico', 'u3', 'circulo', [
    (dif, T, k) => {
      const r = rnd(2, 10), P = redondear(2 * 3.14 * r, 2);
      return desafio(k, T, `El borde de un pozo circular mide ${num(P)} m (π ≈ 3,14). ¿Cuánto mide su radio?`,
        `${r} m`, [`${2 * r} m`, `${num(redondear(P / 3.14, 2))} m`, `${r + 1} m`], (j) => `${r + j} m`,
        'Perímetro = 2 · π · r. Divide el perímetro por 2 · 3,14.', `${num(P)} : 6,28 = ${r} m.`);
    },
    (dif, T, k) => {
      const d = rnd(2, 10) * 2, A = redondear(3.14 * (d / 2) ** 2, 2);
      return desafio(k, T, `Una alfombra circular tiene ${d} m de diámetro. Con π ≈ 3,14, ¿cuál es su área?`,
        `${num(A)} m²`, [`${num(redondear(3.14 * d * d, 2))} m²`, `${num(redondear(3.14 * d, 2))} m²`, `${num(redondear(2 * 3.14 * (d / 2), 2) + 1)} m²`], (j) => `${num(redondear(A + j, 2))} m²`,
        'El radio es la mitad del diámetro; área = π · r · r.', `r = ${d / 2}; 3,14 · ${d / 2} · ${d / 2} = ${num(A)} m².`);
    },
  ]);
  ampliar('7basico', 'u3', 'areas', [
    (dif, T, k) => {
      const b = rnd(3, 12), h = rnd(2, 10), A = (b * h) / 2;
      return desafio(k, T, `Un triángulo tiene área ${num(A)} cm² y base ${b} cm. ¿Cuánto mide su altura?`,
        `${h} cm`, [`${num(A / b)} cm`, `${num(A - b)} cm`, `${2 * h} cm`], (j) => `${h + j} cm`,
        'Área del triángulo = base · altura : 2. Despeja: altura = 2 · área : base.', `2 · ${num(A)} : ${b} = ${h} cm.`);
    },
  ]);
  ampliar('7basico', 'u4', 'tendencia', [
    (dif, T, k) => {
      const prom = rnd(5, 12), datos = [rnd(prom - 4, prom + 4), rnd(prom - 4, prom + 4), rnd(prom - 4, prom + 4)];
      const falta = prom * 4 - datos.reduce((a, b) => a + b, 0);
      if (falta < 0) return null;
      return desafio(k, T, `Recolectaste ${datos.join(', ')} y un cuarto día más. Si el promedio de los 4 días es ${prom}, ¿cuánto recolectaste el cuarto día?`,
        num(falta), [num(prom), num(falta + prom), num(Math.abs(falta - 4))], cerca(falta),
        'Promedio · cantidad de datos = suma total. Resta lo que ya conoces.', `${prom} · 4 = ${prom * 4}; ${prom * 4} − ${datos.reduce((a, b) => a + b, 0)} = ${falta}.`);
    },
    (dif, T, k) => {
      const a = []; for (let i = 0; i < 6; i++) a.push(rnd(1, 20));
      const o = [...a].sort((x, y) => x - y), m = (o[2] + o[3]) / 2;
      return desafio(k, T, `¿Cuál es la mediana de estos 6 datos? ${a.join(', ')}`,
        num(m), [num(o[2]), num(o[3] + 1), num(redondear(a.reduce((x, y) => x + y, 0) / 6, 1))], (j) => num(m + j),
        'Con una cantidad par de datos, la mediana es el promedio de los dos datos centrales (después de ordenar).', `Ordenados: ${o.join(', ')}. (${o[2]} + ${o[3]}) : 2 = ${num(m)}.`);
    },
  ]);
  ampliar('7basico', 'u4', 'probabilidad7', [
    (dif, T, k) => {
      const t = pick([5, 8, 10, 12]), f = rnd(1, t - 1);
      return desafio(k, T, `La probabilidad de encontrar un cristal en un cofre es ${ftxt(f, t)}. ¿Cuál es la probabilidad de NO encontrarlo?`,
        ftxt(t - f, t), [ftxt(f, t), ftxt(1, t), ftxt(t, t - f), ftxt(f, t + f)], (j) => ftxt(t - f + j, t + j),
        'La probabilidad de que un evento no ocurra es 1 menos la probabilidad de que ocurra.', `1 − ${ftxt(f, t)} = ${ftxt(t - f, t)}.`);
    },
  ]);

  ampliar('8basico', 'u2', 'expresiones8', [
    (dif, T, k) => {
      const a = rnd(2, 9), b = rnd(1, 9);
      return desafio(k, T, `Reduce: ${a}x − (x − ${b})`,
        lineal(a - 1, b), [lineal(a - 1, -b), lineal(a + 1, b), lineal(a, -b)], (j) => lineal(a - 1, b + j),
        'Un signo menos delante del paréntesis cambia el signo de cada término de adentro.', `${a}x − x + ${b} = ${lineal(a - 1, b)}.`);
    },
    (dif, T, k) => {
      const c = rnd(2, 7), a = rnd(1, 6), b = rnd(1, 9);
      return desafio(k, T, `Factoriza sacando factor común: ${c * a}x + ${c * b}`,
        `${c}(${lineal(a, b)})`, [`${c}(${lineal(a * c, b)})`, `x(${c * a} + ${c * b})`, `${c}(${lineal(a, b * c)})`, a > 1 ? `${c * a}(x + ${b})` : null], (j) => `${c}(${lineal(a + j, b)})`,
        'Busca el mayor número que divide a ambos términos y escríbelo fuera del paréntesis.', `${lineal(c * a, c * b)} = ${c} · ${lineal(a, 0)} + ${c} · ${b} = ${c}(${lineal(a, b)}).`);
    },
  ]);
  ampliar('8basico', 'u2', 'funcion', [
    (dif, T, k) => {
      const a = rnd(2, 6), b = rnd(-5, 9), x = rnd(-3, 8), y = a * x + b;
      return desafio(k, T, `Si f(x) = ${lineal(a, b)}, ¿para qué valor de x se cumple f(x) = ${num(y)}?`,
        `x = ${num(x)}`, [`x = ${num(y)}`, `x = ${num(a * y + b)}`, `x = ${num(-x)}`], (j) => `x = ${num(x + j)}`,
        `Plantea la ecuación ${lineal(a, b)} = ${num(y)} y despeja x.`, `${a}x = ${num(y - b)}, entonces x = ${num(x)}.`);
    },
  ]);
  ampliar('8basico', 'u2', 'ecuaciones8', [
    (dif, T, k) => {
      const d = rnd(2, 6), x = d * rnd(1, 8), b = rnd(1, 9);
      return desafio(k, T, `Resuelve: x/${d} + ${b} = ${x / d + b}`,
        `x = ${x}`, [`x = ${x / d}`, `x = ${(x / d + b) * d + b}`, `x = ${x + d}`], (j) => `x = ${x + j * d}`,
        `Resta ${b} a ambos lados y después multiplica por ${d}.`, `x/${d} = ${x / d}, entonces x = ${x / d} · ${d} = ${x}.`);
    },
  ]);
  ampliar('8basico', 'u2', 'linealafin', [
    (dif, T, k) => {
      const x1 = rnd(-3, 3), m = rnd(-4, 4) || 2, n = rnd(-5, 5), x2 = x1 + rnd(1, 4);
      const y1 = m * x1 + n, y2 = m * x2 + n;
      return desafio(k, T, `Una recta pasa por (${num(x1)}, ${num(y1)}) y (${num(x2)}, ${num(y2)}). ¿Cuál es su pendiente?`,
        num(m), [num(-m), num(y2 - y1), num(x2 - x1)], cerca(m),
        'Pendiente = (y₂ − y₁) : (x₂ − x₁).', `(${num(y2)} − ${par(y1)}) : (${num(x2)} − ${par(x1)}) = ${num(y2 - y1)} : ${num(x2 - x1)} = ${num(m)}.`);
    },
    (dif, T, k) => {
      const fijo = rnd(5, 20), por = rnd(2, 6), x = rnd(3, 10);
      return desafio(k, T, `Arrendar una carreta cuesta ${fijo} de madera fijos más ${por} por cada hora. ¿Cuánto cuesta arrendarla ${x} horas?`,
        num(fijo + por * x), [num((fijo + por) * x), num(por * x), num(fijo * x + por)], cerca(fijo + por * x),
        `Es una función afín: costo = ${por} · horas + ${fijo}.`, `${por} · ${x} + ${fijo} = ${fijo + por * x}.`);
    },
  ]);
  ampliar('8basico', 'u3', 'volumen', [
    (dif, T, k) => {
      const b = rnd(2, 8) * 2, h = rnd(2, 8), L = rnd(3, 10), V = (b * h / 2) * L;
      return desafio(k, T, `Un prisma triangular tiene una base triangular de ${b} cm de base y ${h} cm de altura, y mide ${L} cm de largo. ¿Cuál es su volumen?`,
        `${num(V)} cm³`, [`${num(b * h * L)} cm³`, `${num(b + h + L)} cm³`, `${num(b * h / 2)} cm³`], (j) => `${num(V + j * 4)} cm³`,
        'Volumen del prisma = área de la base · largo.', `Base: ${b} · ${h} : 2 = ${b * h / 2} cm²; ${b * h / 2} · ${L} = ${num(V)} cm³.`);
    },
    (dif, T, k) => {
      const r = rnd(1, 5), h = rnd(2, 10), A = redondear(2 * 3.14 * r * h, 2);
      return desafio(k, T, `¿Cuál es el área lateral de un cilindro de radio ${r} m y altura ${h} m? (π ≈ 3,14)`,
        `${num(A)} m²`, [`${num(redondear(3.14 * r * r * h, 2))} m²`, `${num(redondear(3.14 * r * h, 2))} m²`, `${num(redondear(2 * 3.14 * r * (r + h), 2))} m²`], (j) => `${num(redondear(A + j, 2))} m²`,
        'El manto del cilindro es un rectángulo: largo = perímetro de la base (2 · π · r), alto = h.', `2 · 3,14 · ${r} · ${h} = ${num(A)} m².`);
    },
  ]);
  ampliar('8basico', 'u3', 'pitagoras', [
    (dif, T, k) => {
      const [a, b, c] = pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [4, 5, 6], [5, 6, 8], [7, 8, 11]]);
      const es = a * a + b * b === c * c;
      return desafio(k, T, `¿Un triángulo de lados ${a}, ${b} y ${c} cm es rectángulo?`,
        es ? `Sí, porque ${a}² + ${b}² = ${c}²` : `No, porque ${a}² + ${b}² ≠ ${c}²`,
        [es ? `No, porque ${a}² + ${b}² ≠ ${c}²` : `Sí, porque ${a}² + ${b}² = ${c}²`, `Sí, porque ${a} + ${b} > ${c}`, 'No se puede saber sin medir los ángulos'], null,
        'Un triángulo es rectángulo si el cuadrado del lado mayor es igual a la suma de los cuadrados de los otros dos.', `${a * a} + ${b * b} = ${a * a + b * b} y ${c}² = ${c * c}: ${es ? 'son iguales, es rectángulo' : 'no son iguales, no es rectángulo'}.`);
    },
    (dif, T, k) => {
      const [a, b, c] = pick([[6, 8, 10], [9, 12, 15], [5, 12, 13], [12, 16, 20]]);
      return desafio(k, T, `Una puerta rectangular mide ${a} dm de ancho y ${b} dm de alto. ¿Cuánto mide su diagonal?`,
        `${c} dm`, [`${a + b} dm`, `${b - a} dm`, `${num(redondear((a + b) / 2, 1))} dm`], (j) => `${c + j} dm`,
        'La diagonal divide al rectángulo en dos triángulos rectángulos: usa Pitágoras.', `√(${a * a} + ${b * b}) = √${c * c} = ${c} dm.`);
    },
  ]);
  ampliar('8basico', 'u3', 'isometrias', [
    (dif, T, k) => {
      const x = rnd(-6, 6) || 3, y = rnd(-6, 6) || 2;
      return desafio(k, T, `Rotas el punto (${num(x)}, ${num(y)}) en 90° en sentido antihorario, con centro en el origen. ¿Dónde queda?`,
        `(${num(-y)}, ${num(x)})`, [`(${num(y)}, ${num(-x)})`, `(${num(-x)}, ${num(-y)})`, `(${num(y)}, ${num(x)})`, `(${num(x)}, ${num(-y)})`], (j) => `(${num(-y + j)}, ${num(x)})`,
        'Una rotación de 90° antihoraria con centro en el origen lleva (x, y) a (−y, x).', `(${num(x)}, ${num(y)}) → (${num(-y)}, ${num(x)}).`);
    },
  ]);
  ampliar('8basico', 'u4', 'multiplicativo', [
    (dif, T, k) => {
      const n = rnd(3, 6);
      const r = n * (n - 1) * (n - 2);
      return desafio(k, T, `${n} exploradores compiten. ¿De cuántas formas pueden quedar el 1°, 2° y 3° lugar?`,
        num(r), [num(n * n * n), num(n * 3), num(r / 6)], cerca(r, num, 2),
        'Para el 1° lugar hay n opciones, para el 2° quedan n − 1 y para el 3° quedan n − 2.', `${n} · ${n - 1} · ${n - 2} = ${r}.`);
    },
    (dif, T, k) => {
      const d = rnd(2, 4);
      return desafio(k, T, `Un candado tiene ${d} ruedas con los dígitos del 0 al 9. ¿Cuántas claves distintas existen?`,
        num(10 ** d), [num(10 * d), num(9 ** d), num(10 * 9 * (d > 2 ? 8 : 1))], null,
        'En cada rueda hay 10 opciones y pueden repetirse: multiplica 10 por sí mismo tantas veces como ruedas.', `10^${d} = ${num(10 ** d)}.`);
    },
  ]);
  ampliar('8basico', 'u4', 'probabilidad8', [
    (dif, T, k) => {
      const s = rnd(4, 10);
      let fav = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === s) fav++;
      return desafio(k, T, `Lanzas dos dados. ¿Cuál es la probabilidad de que la suma sea ${s}?`,
        ftxt(fav, 36), [ftxt(1, 11), ftxt(fav, 12), ftxt(1, s)], (j) => ftxt(fav + j, 36),
        'Hay 36 resultados posibles (6 · 6). Cuenta los pares que suman lo pedido.', `Hay ${fav} pares que suman ${s}: ${ftxt(fav, 36)}.`);
    },
    (dif, T, k) => {
      const r = rnd(2, 5), a = rnd(2, 5), t = r + a;
      return desafio(k, T, `Una bolsa tiene ${r} gemas rojas y ${a} azules. Sacas dos SIN devolver la primera. ¿Probabilidad de que ambas sean rojas?`,
        ftxt(r * (r - 1), t * (t - 1)), [ftxt(r * r, t * t), ftxt(r, t), ftxt(r - 1, t - 1)], (j) => ftxt(r * (r - 1) + j, t * (t - 1)),
        'Sin devolución, la segunda extracción tiene una gema roja menos y una gema menos en total.', `${r}/${t} · ${r - 1}/${t - 1} = ${ftxt(r * (r - 1), t * (t - 1))}.`);
    },
  ]);

  // Las variantes que devuelven null (no aplican a esa dificultad o a esos números) se reintentan en nuevo().
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
