// Math World — banco ampliado de 7° básico: nuevas variantes para cada tema del programa
// (ver banco.js, que arma los temas según el banco de preguntas del profesor).
// Cada variante es una función (dif) que devuelve un desafío; banco.js le pone el tema y el título.
(function (global) {
  'use strict';
  const P = global.Preguntas;
  const { rnd, pick, gcd, shuffle, num, par, frac, fracTxt, cerca, desafio, redondear } = P.h;
  const D = (en, corr, distr, relleno, pista, expl) => desafio('', '', en, corr, distr, relleno, pista, expl);
  // Pregunta conceptual: la correcta y 3 distractores elegidos al azar de una lista
  const C = (en, corr, falsas, pista, expl) => D(en, corr, shuffle([...falsas]).slice(0, 3), null, pista, expl);
  const ftxt = (n, d) => fracTxt(frac(n, d));
  const SUP = { 1: '', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶' };
  // Término algebraico: coef y lista de [letra, exponente]
  function termino(c, lits) {
    const lit = lits.map(([l, e]) => l + SUP[e]).join('');
    if (!lit) return num(c);
    return (c === 1 ? '' : c === -1 ? '−' : num(c)) + lit;
  }
  // a·x + b
  const lin = (a, b, v = 'x') => {
    let t = a === 1 ? v : a === -1 ? '−' + v : a === 0 ? '' : num(a) + v;
    if (b === 0) return t || '0';
    if (!t) return num(b);
    return t + (b > 0 ? ' + ' : ' − ') + num(Math.abs(b));
  };
  const mas = (x) => (x < 0 ? ' − ' + num(-x) : ' + ' + num(x));   // " + 3" / " − 3"
  const nz = (a, b) => { let x = 0; while (x === 0) x = rnd(a, b); return x; };
  const N7 = { u1: {}, u2: {}, u3: {}, u4: {} };

  // =====================================================================
  // UNIDAD 1 · NÚMEROS (contextos del bosque)
  // =====================================================================
  N7.u1.enteros = [
    (dif) => {
      const a = nz(-15, 15), b = nz(-15, 15), op = pick(['+', '−']);
      const r = op === '+' ? a + b : a - b;
      return D(`Calcula: ${num(a)} ${op} ${par(b)}`, num(r), [num(op === '+' ? a - b : a + b), num(-r), num(Math.abs(a) + Math.abs(b))], cerca(r),
        P.h.pistaEnteros(a, b, op === '−'),
        op === '+' ? `${num(a)} + ${par(b)} = ${num(r)}.` : `${num(a)} − ${par(b)} = ${num(a)} + ${par(-b)} = ${num(r)}.`);
    },
    () => {
      const p = rnd(4, 20), s = rnd(2, 12), r = -p + s;
      return D(`Un buzo está a ${p} m bajo el nivel del lago (−${p} m) y sube ${s} m para mirar los peces. ¿A qué profundidad queda?`,
        num(r) + ' m', [num(-p - s) + ' m', num(p - s) + ' m', num(p + s) + ' m'], cerca(r, (x) => num(x) + ' m'),
        'Bajo el agua las posiciones son negativas; subir es sumar.', `−${p} + ${s} = ${num(r)}. El buzo queda a ${num(r)} m.`);
    },
    () => {
      const a = nz(-12, 12), r = nz(-15, 15), x = r - a;
      return D(`¿Qué número debes sumarle a ${num(a)} para obtener ${num(r)}?`, num(x), [num(r + a), num(-x), num(a - r)], cerca(x),
        `Busca x tal que ${num(a)} + x = ${num(r)}: resta ${par(a)} al resultado.`, `${num(r)} − ${par(a)} = ${num(x)}. Comprueba: ${num(a)} + ${par(x)} = ${num(r)}.`);
    },
    () => {
      const max = rnd(2, 18), min = -rnd(3, 16), d = max - min;
      return D(`En la cima del bosque la temperatura máxima del día fue ${max} °C y la mínima ${num(min)} °C. ¿Cuál fue la diferencia entre ambas?`,
        d + ' °C', [(max + min) + ' °C', num(min - max) + ' °C', (max - 1 - min) + ' °C'], cerca(d, (x) => x + ' °C'),
        'La diferencia es máxima − mínima. Restar un negativo es sumar.', `${max} − ${par(min)} = ${max} + ${-min} = ${d} °C.`);
    },
    () => {
      const a = rnd(-8, 8), m = rnd(3, 11), izq = pick([true, false]), r = izq ? a - m : a + m;
      return D(`En la recta numérica estás en el ${num(a)} y avanzas ${m} unidades hacia la ${izq ? 'izquierda' : 'derecha'}. ¿En qué número quedas?`,
        num(r), [num(izq ? a + m : a - m), num(-r), num(m)], cerca(r),
        `Avanzar a la ${izq ? 'izquierda es restar' : 'derecha es sumar'}.`, `${num(a)} ${izq ? '−' : '+'} ${m} = ${num(r)}.`);
    },
    () => {
      const deuda = rnd(5, 30), gana = rnd(2, 25), r = -deuda + gana;
      return D(`Le debes ${deuda} de madera al mercader (saldo −${deuda}). Hoy le pagas ${gana}. ¿Cuál es tu nuevo saldo con él?`,
        num(r), [num(-deuda - gana), num(deuda - gana), num(deuda + gana)], cerca(r),
        'Una deuda es un número negativo; pagar suma a tu saldo.', `−${deuda} + ${gana} = ${num(r)}.`);
    },
  ];

  N7.u1.combinadas7 = [
    (dif) => {
      const a = nz(-12, 12), b = nz(-9, 9), c = nz(-9, 9), d = nz(-9, 9);
      const r = a - (b + c) - d;
      return D(`Calcula: ${num(a)} − (${num(b)} + ${par(c)}) − ${par(d)}`, num(r), [num(a - b + c - d), num(a - (b + c) + d), num(a + b + c - d)], cerca(r),
        'Resuelve primero el paréntesis. Restar un número es sumar su opuesto.', `${num(b)} + ${par(c)} = ${num(b + c)}; luego ${num(a)} − ${par(b + c)} − ${par(d)} = ${num(r)}.`);
    },
    () => {
      const t = [nz(-15, 15), nz(-15, 15), nz(-15, 15), nz(-15, 15)], s = [pick(['+', '−']), pick(['+', '−']), pick(['+', '−'])];
      let r = t[0]; s.forEach((o, i) => { r += o === '+' ? t[i + 1] : -t[i + 1]; });
      const txt = `${num(t[0])} ${s[0]} ${par(t[1])} ${s[1]} ${par(t[2])} ${s[2]} ${par(t[3])}`;
      return D(`Calcula: ${txt}`, num(r), [num(-r), num(t.reduce((a, b) => a + b, 0) === r ? r + 2 : t.reduce((a, b) => a + b, 0)), num(r + 2 * t[3])], cerca(r, num, 2),
        'Transforma cada resta en la suma del opuesto y luego suma de izquierda a derecha.', `${txt} = ${num(r)}.`);
    },
    () => {
      const g1 = rnd(5, 20), p1 = rnd(5, 20), g2 = rnd(3, 15), p2 = rnd(5, 25), r = g1 - p1 + g2 - p2;
      return D(`En un juego del bosque ganas ${g1} puntos, pierdes ${p1}, ganas ${g2} y pierdes ${p2}. Si partiste en 0, ¿cuál es tu puntaje final?`,
        num(r), [num(g1 + p1 + g2 + p2), num(-r), num(g1 + g2 - p1)], cerca(r),
        'Gana = suma, pierde = resta.', `0 + ${g1} − ${p1} + ${g2} − ${p2} = ${num(r)} puntos.`);
    },
    () => {
      const a = nz(-10, 10), b = nz(-10, 10), c = nz(-10, 10), d = nz(-10, 10);
      const r = a - (b - (c - d));
      return D(`Calcula: ${num(a)} − [${num(b)} − (${num(c)} − ${par(d)})]`, num(r), [num(a - b - c + d), num(a - (b - c - d)), num(-r)], cerca(r),
        'Resuelve desde adentro hacia afuera: primero ( ), después [ ].', `(${num(c)} − ${par(d)}) = ${num(c - d)}; [${num(b)} − ${par(c - d)}] = ${num(b - (c - d))}; ${num(a)} − ${par(b - (c - d))} = ${num(r)}.`);
    },
    () => {
      const ini = rnd(-5, 10), cambios = [rnd(3, 9), -rnd(4, 12), rnd(2, 8), -rnd(3, 10)];
      const r = ini + cambios.reduce((x, y) => x + y, 0);
      return D(`El termómetro marca ${num(ini)} °C. Sube ${cambios[0]} °C, baja ${-cambios[1]} °C, sube ${cambios[2]} °C y finalmente baja ${-cambios[3]} °C. ¿Qué temperatura marca?`,
        num(r) + ' °C', [num(r + 2 * cambios[3]) + ' °C', num(-r) + ' °C', num(ini + cambios[0] + cambios[2]) + ' °C'], cerca(r, (x) => num(x) + ' °C'),
        'Subir suma, bajar resta. Hazlo paso a paso.', `${num(ini)} + ${cambios[0]} − ${-cambios[1]} + ${cambios[2]} − ${-cambios[3]} = ${num(r)} °C.`);
    },
  ];

  N7.u1.valorabs = [
    () => {
      const a = nz(-20, 20), b = nz(-20, 20), op = pick(['+', '−']), r = op === '+' ? Math.abs(a) + Math.abs(b) : Math.abs(a) - Math.abs(b);
      return D(`Calcula: |${num(a)}| ${op} |${num(b)}|`, num(r), [num(op === '+' ? a + b : a - b), num(-r), num(op === '+' ? Math.abs(a) - Math.abs(b) : Math.abs(a) + Math.abs(b))], cerca(r),
        'El valor absoluto es la distancia al cero: siempre es positivo o cero.', `|${num(a)}| = ${Math.abs(a)} y |${num(b)}| = ${Math.abs(b)}; ${Math.abs(a)} ${op} ${Math.abs(b)} = ${num(r)}.`);
    },
    () => {
      const d = rnd(2, 25);
      return C(`¿Qué números están a ${d} unidades del cero en la recta numérica?`, `${d} y −${d}`, [`Solo ${d}`, `Solo −${d}`, `0 y ${d}`, `${d * 2} y −${d * 2}`],
        'El valor absoluto mide la distancia al 0, sin importar el lado.', `|${d}| = ${d} y |−${d}| = ${d}: ambos están a ${d} unidades del cero.`);
    },
    () => {
      const xs = shuffle([nz(-30, 30), nz(-30, 30), nz(-30, 30), nz(-30, 30)]);
      const abs = xs.map(Math.abs), m = Math.max(...abs);
      if (abs.filter((v) => v === m).length > 1) return null;
      const c = xs[abs.indexOf(m)];
      return D(`¿Cuál de estos números tiene el MAYOR valor absoluto?`, num(c), xs.filter((v) => v !== c).map(num), null,
        'Ignora el signo y compara las distancias al cero.', `|${num(c)}| = ${m}, la mayor distancia al cero.`);
    },
    () => {
      const a = nz(-15, 15), b = nz(-15, 15), r = Math.abs(a - b);
      if (a === b) return null;
      return D(`Una ardilla está en el punto ${num(a)} y una piña en el punto ${num(b)} de la recta numérica. ¿Cuántas unidades las separan?`,
        String(r), [num(a + b), String(Math.abs(Math.abs(a) - Math.abs(b))), num(a - b === r ? -r : a - b)], cerca(r),
        'La distancia entre dos puntos es el valor absoluto de su diferencia.', `|${num(a)} − ${par(b)}| = |${num(a - b)}| = ${r}.`);
    },
    () => {
      const a = rnd(2, 15);
      const verdad = pick([`|−${a}| = ${a}`, `|${a}| = |−${a}|`, `|−${a}| > −${a}`, `|0| = 0`]);
      return C('¿Cuál de estas afirmaciones es VERDADERA?', verdad, [`|−${a}| = −${a}`, `|${a}| < |−${a}|`, `|−${a}| < 0`, `−|${a}| = ${a}`],
        'El valor absoluto de un número nunca es negativo.', `${verdad} es verdadera porque el valor absoluto es la distancia al cero.`);
    },
    () => {
      const a = rnd(3, 15), b = rnd(3, 15);
      if (a === b) return null;
      const r = -Math.abs(a - b) <= 0 ? Math.abs(-a) - Math.abs(b) : 0;
      return D(`Calcula: |−${a}| − |${b}| + |${num(b - a)}|`, num(r + Math.abs(b - a)), [num(-a - b + (b - a)), num(a + b + Math.abs(b - a)), num(r - Math.abs(b - a))], cerca(r + Math.abs(b - a)),
        'Calcula cada valor absoluto por separado y luego opera.', `${a} − ${b} + ${Math.abs(b - a)} = ${num(r + Math.abs(b - a))}.`);
    },
  ];

  N7.u1.decimales = [
    (dif) => {
      const a = rnd(11, dif === 1 ? 49 : 99) / 10, b = rnd(2, dif === 1 ? 9 : 35) / 10, r = redondear(a * b, 4);
      return D(`Calcula: ${num(a)} · ${num(b)}`, num(r), [num(redondear(a * b * 10, 4)), num(redondear(a * b / 10, 4)), num(redondear(a + b, 4))], cerca(r, num, 0.1),
        'Multiplica como si fueran enteros y cuenta los decimales de ambos factores.', `${num(a)} · ${num(b)} = ${num(r)} (${num(a * 10)} · ${num(b * 10)} = ${num(Math.round(a * b * 100))}, con dos decimales).`);
    },
    () => {
      const q = rnd(12, 95) / 10, n = rnd(2, 9), a = redondear(q * n, 4);
      return D(`Calcula: ${num(a)} : ${n}`, num(q), [num(q * 10), num(redondear(q / 10, 4)), num(redondear(q + 1, 4))], cerca(q, num, 0.1),
        'Divide como con enteros y pon la coma del cociente al bajar la primera cifra decimal.', `${num(a)} : ${n} = ${num(q)}, porque ${num(q)} · ${n} = ${num(a)}.`);
    },
    () => {
      const d = pick([0.2, 0.4, 0.5, 0.25, 0.3, 0.6]), q = rnd(3, 30), a = redondear(q * d, 4);
      return D(`Calcula: ${num(a)} : ${num(d)}`, num(q), [num(redondear(a * d, 4)), num(q / 10), num(q * 10)], cerca(q),
        'Amplifica ambos números por 10 o 100 hasta que el divisor sea entero.', `${num(a)} : ${num(d)} = ${num(a * (d === 0.25 ? 100 : 10))} : ${num(d * (d === 0.25 ? 100 : 10))} = ${q}.`);
    },
    () => {
      const a = rnd(101, 9999) / 100, p = pick([10, 100, 1000, 0.1, 0.01]), r = redondear(a * p, 4);
      return D(`Calcula: ${num(a)} · ${num(p)}`, num(r), [num(redondear(a / p, 4)), num(redondear(a * p * 10, 4)), num(redondear(a * p / 10, 4))], null,
        p >= 10 ? `Multiplicar por ${num(p)} corre la coma ${String(p).length - 1} lugar(es) a la derecha.` : `Multiplicar por ${num(p)} corre la coma ${p === 0.1 ? 1 : 2} lugar(es) a la izquierda.`,
        `${num(a)} · ${num(p)} = ${num(r)}.`);
    },
    () => {
      const precio = pick([1.25, 0.75, 2.5, 1.5, 3.2, 0.8, 4.5]), n = rnd(3, 12), r = redondear(precio * n, 4);
      return D(`Un frasco de miel cuesta ${num(precio)} monedas. ¿Cuánto cuestan ${n} frascos?`, num(r) + ' monedas', [num(redondear(precio + n, 4)) + ' monedas', num(redondear(r * 10, 4)) + ' monedas', num(redondear(r / 10, 4)) + ' monedas'],
        cerca(r, (x) => num(redondear(x, 4)) + ' monedas', 0.5), 'Multiplica el precio de uno por la cantidad.', `${num(precio)} · ${n} = ${num(r)} monedas.`);
    },
    () => {
      const total = rnd(30, 120) / 10, partes = pick([2, 4, 5, 8]), r = redondear(total / partes, 4);
      if (String(r).split('.')[1] && String(r).split('.')[1].length > 3) return null;
      return D(`Una cuerda de ${num(total)} m se corta en ${partes} trozos iguales. ¿Cuánto mide cada trozo?`, num(r) + ' m', [num(redondear(total * partes, 4)) + ' m', num(redondear(r * 10, 4)) + ' m', num(redondear(total - partes, 4)) + ' m'],
        cerca(r, (x) => num(redondear(x, 4)) + ' m', 0.1), 'Repartir en partes iguales es dividir.', `${num(total)} : ${partes} = ${num(r)} m.`);
    },
  ];

  N7.u1.fracciones = [
    (dif) => {
      const a = rnd(1, 8), b = rnd(2, 9), c = rnd(1, 8), d = rnd(2, 9);
      if (a >= b && dif === 1) return null;
      const r = ftxt(a * c, b * d);
      return D(`Calcula: ${a}/${b} · ${c}/${d}`, r, [ftxt(a * d, b * c), ftxt(a + c, b + d), ftxt(a * c, b + d)], null,
        'Multiplica numerador por numerador y denominador por denominador; luego simplifica.', `${a}/${b} · ${c}/${d} = ${a * c}/${b * d}${r !== `${a * c}/${b * d}` ? ' = ' + r : ''}.`);
    },
    () => {
      const a = rnd(1, 8), b = rnd(2, 9), c = rnd(1, 8), d = rnd(2, 9);
      const r = ftxt(a * d, b * c);
      return D(`Calcula: ${a}/${b} : ${c}/${d}`, r, [ftxt(a * c, b * d), ftxt(b * c, a * d), ftxt(a * d, b * d)], null,
        'Dividir por una fracción es multiplicar por su inverso.', `${a}/${b} : ${c}/${d} = ${a}/${b} · ${d}/${c} = ${a * d}/${b * c}${r !== `${a * d}/${b * c}` ? ' = ' + r : ''}.`);
    },
    () => {
      const n = rnd(2, 12), a = rnd(1, 7), b = rnd(2, 9), r = ftxt(n * a, b);
      return D(`Calcula: ${n} · ${a}/${b}`, r, [ftxt(a, n * b), ftxt(n * a, n * b), ftxt(n + a, b)], null,
        'Multiplica el entero solo por el numerador.', `${n} · ${a}/${b} = ${n * a}/${b}${r !== `${n * a}/${b}` ? ' = ' + r : ''}.`);
    },
    () => {
      const b = pick([3, 4, 5, 6, 8]), a = rnd(1, b - 1), N = b * rnd(2, 12), r = (N / b) * a;
      return D(`El bosque tiene ${N} árboles y ${a}/${b} de ellos son pinos. ¿Cuántos pinos hay?`, String(r), [String(N / b), String(N - r), String(N * a)], cerca(r),
        `Divide ${N} en ${b} partes iguales y toma ${a}.`, `${N} : ${b} = ${N / b}; ${N / b} · ${a} = ${r} pinos.`);
    },
    () => {
      const d = pick([2, 3, 4, 5, 6, 8]), a = 1, n = rnd(2, 9), r = n * d;
      return D(`Tienes ${n} kg de semillas y llenas bolsitas de ${a}/${d} kg. ¿Cuántas bolsitas llenas?`, String(r), [ftxt(n, d), String(n + d), String(Math.max(1, Math.round(n / d)) + (n % d === 0 ? 1 : 0))], cerca(r),
        `Divide ${n} por ${a}/${d}: es lo mismo que multiplicar por ${d}.`, `${n} : 1/${d} = ${n} · ${d} = ${r} bolsitas.`);
    },
    () => {
      const a = rnd(1, 5), b = rnd(a + 1, 8), c = rnd(1, 5), d = rnd(c + 1, 8), r = ftxt(a * c, b * d);
      return D(`Usas ${a}/${b} de un tronco y de eso tallas ${c}/${d} para un juguete. ¿Qué fracción del tronco completo es el juguete?`, r,
        [ftxt(a + c, b + d), ftxt(a * d, b * c), ftxt(c, b * d)], null,
        `"${c}/${d} de ${a}/${b}" se calcula multiplicando.`, `${c}/${d} · ${a}/${b} = ${a * c}/${b * d}${r !== `${a * c}/${b * d}` ? ' = ' + r : ''}.`);
    },
  ];

  N7.u1.simplificar = [
    (dif) => {
      const d = rnd(3, 12), n = rnd(1, d - 1); if (gcd(n, d) !== 1) return null;
      const k = pick(dif === 1 ? [2, 3, 4, 5] : [4, 6, 8, 9, 10, 12]);
      const p = [2, 3, 5].find((q) => k % q === 0 && q < k);
      const parcial = p ? `${(n * k) / p}/${(d * k) / p}` : `${n + 1}/${d + 1}`;
      return D(`Simplifica hasta obtener una fracción irreducible: ${n * k}/${d * k}`, `${n}/${d}`, [parcial, `${d}/${n}`, `${n}/${d + 1}`], null,
        `Divide numerador y denominador por su máximo común divisor (${k}).`, `${n * k} : ${k} = ${n} y ${d * k} : ${k} = ${d}; la fracción irreducible es ${n}/${d}.`);
    },
    () => {
      const d = rnd(3, 10), n = rnd(1, d - 1); if (gcd(n, d) !== 1) return null;
      const k = rnd(2, 6);
      return D(`¿Cuál de estas fracciones es equivalente a ${n}/${d}?`, `${n * k}/${d * k}`, [`${n + k}/${d + k}`, `${n * k}/${d + k}`, `${d * k}/${n * k}`], null,
        'Dos fracciones son equivalentes si se obtiene una de la otra multiplicando (o dividiendo) numerador y denominador por el mismo número.', `${n}/${d} = ${n} · ${k} / ${d} · ${k} = ${n * k}/${d * k}.`);
    },
    () => {
      const d = rnd(5, 15), n = rnd(2, d - 1); if (gcd(n, d) !== 1) return null;
      const malas = []; while (malas.length < 3) { const dd = rnd(4, 20), k = pick([2, 3, 5]), nn = k * rnd(1, 6), den = k * rnd(2, 7); if (nn < den && !malas.includes(`${nn}/${den}`)) malas.push(`${nn}/${den}`); void dd; }
      return D('¿Cuál de estas fracciones es IRREDUCIBLE (no se puede simplificar)?', `${n}/${d}`, malas, null,
        'Una fracción es irreducible si numerador y denominador no tienen divisores comunes (además del 1).', `${n} y ${d} no tienen divisores comunes, así que ${n}/${d} es irreducible.`);
    },
    () => {
      const d = rnd(3, 9), n = rnd(1, d - 1), k = rnd(2, 8);
      return D(`Completa para que sean equivalentes: ${n}/${d} = ?/${d * k}`, String(n * k), [String(n + d * k - d), String(n * d), String(d * k - n)], cerca(n * k),
        `El denominador se multiplicó por ${k}; haz lo mismo con el numerador.`, `${d} · ${k} = ${d * k}, entonces ${n} · ${k} = ${n * k}.`);
    },
    () => {
      const k = pick([2, 3, 4, 5, 6, 7, 8, 9, 12]), d0 = rnd(2, 9), n0 = rnd(1, d0 - 1); if (gcd(n0, d0) !== 1) return null;
      return D(`¿Por qué número debes dividir el numerador y el denominador de ${n0 * k}/${d0 * k} para simplificarla al máximo de una vez?`, String(k),
        [String(n0 * k), String(Math.max(2, Math.floor(k / 2)) === k ? k + 1 : Math.max(2, Math.floor(k / 2))), String(d0)], cerca(k),
        'Busca el máximo común divisor (MCD) entre numerador y denominador.', `MCD(${n0 * k}, ${d0 * k}) = ${k}. Queda ${n0}/${d0}.`);
    },
    () => {
      const tot = pick([12, 18, 20, 24, 30, 36, 40, 48]), parte = rnd(2, tot - 2), r = ftxt(parte, tot);
      if (gcd(parte, tot) === 1) return null;
      return D(`De ${tot} hongos recolectados, ${parte} son comestibles. ¿Qué fracción irreducible de los hongos es comestible?`, r, [`${parte}/${tot}`, ftxt(tot - parte, tot), ftxt(tot, parte)], null,
        `Escribe ${parte}/${tot} y simplifica.`, `${parte}/${tot} = ${r} (dividiendo por ${gcd(parte, tot)}).`);
    },
  ];

  N7.u1.porcentajes = [
    () => {
      const p = pick([12, 15, 35, 45, 60, 65, 80, 5]), N = 20 * rnd(2, 15), r = (N * p) / 100;
      if (!Number.isInteger(r)) return null;
      return D(`¿Cuánto es el ${p} % de ${N}?`, num(r), [num(N - r), num(N + r), num(r * 10)], cerca(r, num, 2),
        `Multiplica ${N} por ${p} y divide por 100.`, `${N} · ${p} : 100 = ${num(r)}.`);
    },
    () => {
      const N = pick([20, 25, 40, 50, 80, 200, 400]), p = pick([10, 20, 25, 30, 40, 50, 75]), parte = (N * p) / 100;
      if (!Number.isInteger(parte)) return null;
      return D(`¿Qué porcentaje de ${N} es ${parte}?`, p + ' %', [parte + ' %', (100 - p) + ' %', num(p * 2 > 100 ? p / 2 : p * 2) + ' %'], (k) => (p + 5 * k) + ' %',
        'Divide la parte por el total y multiplica por 100.', `${parte} : ${N} = ${num(parte / N)} → ${p} %.`);
    },
    () => {
      const N = 10 * rnd(3, 30), p = pick([10, 20, 25, 50]), sube = pick([true, false]), r = sube ? N * (1 + p / 100) : N * (1 - p / 100);
      return D(`Una cosecha de ${N} manzanas ${sube ? 'aumenta' : 'disminuye'} un ${p} %. ¿Cuántas manzanas hay ahora?`, num(r), [num((N * p) / 100), num(sube ? N * (1 - p / 100) : N * (1 + p / 100)), num(sube ? N + p : N - p)], cerca(r, num, 2),
        `Calcula el ${p} % de ${N} y ${sube ? 'súmalo' : 'réstalo'}.`, `${p} % de ${N} = ${num((N * p) / 100)}; ${N} ${sube ? '+' : '−'} ${num((N * p) / 100)} = ${num(r)}.`);
    },
  ];

  N7.u1.notacion = [
    (dif) => {
      const m = rnd(11, 99) / 10, e = rnd(dif === 1 ? 3 : 4, dif === 3 ? 11 : 8), n = Math.round(m * 10 ** e);
      return D(`Escribe en notación científica: ${num(n)}`, `${num(m)} · 10^${e}`, [`${num(m * 10)} · 10^${e - 1}`, `${num(m)} · 10^${e - 1}`, `${num(m / 10)} · 10^${e + 1}`], null,
        'En notación científica el primer factor es mayor o igual que 1 y menor que 10.', `${num(n)} = ${num(m)} · 10^${e} (la coma se corre ${e} lugares).`);
    },
    () => {
      const m = rnd(11, 99) / 10, e = rnd(3, 9);
      const malas = [`${num(m * 10)} · 10^${e}`, `${num(m / 10)} · 10^${e}`, `${num(m * 100)} · 10^${e - 1}`, `${num(m)} + 10^${e}`];
      return C('¿Cuál de estos números está escrito correctamente en notación científica?', `${num(m)} · 10^${e}`, malas,
        'El primer factor debe estar entre 1 (incluido) y 10 (sin incluir), multiplicado por una potencia de 10.', `${num(m)} está entre 1 y 10, así que ${num(m)} · 10^${e} está en notación científica.`);
    },
    () => {
      const m = rnd(11, 99) / 10, e = rnd(3, 8), n = Math.round(m * 10 ** e);
      return D(`¿Qué número representa ${num(m)} · 10^${e}?`, num(n), [num(n / 10), num(n * 10), num(m * e)], null,
        `Multiplicar por 10^${e} corre la coma ${e} lugares a la derecha.`, `${num(m)} · 10^${e} = ${num(n)}.`);
    },
    () => {
      const a = rnd(11, 99) / 10, b = rnd(11, 99) / 10, ea = rnd(4, 9), eb = ea + pick([-1, 1, 0]);
      if (ea === eb && a === b) return null;
      const va = a * 10 ** ea, vb = b * 10 ** eb, mayor = va > vb ? `${num(a)} · 10^${ea}` : `${num(b)} · 10^${eb}`;
      return D(`¿Cuál número es mayor: ${num(a)} · 10^${ea} o ${num(b)} · 10^${eb}?`, mayor, [va > vb ? `${num(b)} · 10^${eb}` : `${num(a)} · 10^${ea}`, 'Son iguales', 'No se puede saber'], null,
        'Compara primero los exponentes; si son iguales, compara los primeros factores.', `${mayor} es el mayor.`);
    },
    () => {
      const L = pick([['La distancia de la Tierra al Sol es de unos', 150000000, 'km'], ['En un hormiguero gigante viven unas', 3400000, 'hormigas'], ['La Luna está a unos', 384000, 'km de la Tierra'], ['Un bosque tiene cerca de', 52000000, 'hojas'], ['La población de Chile es de unos', 19500000, 'habitantes'], ['El río más largo del mundo mide unos', 6650000, 'metros']]);
      const [txt, n, u] = L; const e = String(n).length - 1, m = n / 10 ** e;
      return D(`${txt} ${num(n)} ${u}. ¿Cómo se escribe ese número en notación científica?`, `${num(m)} · 10^${e}`, [`${num(m)} · 10^${e + 1}`, `${num(m * 10)} · 10^${e - 1}`, `${num(m)} · 10^${e - 1}`], null,
        'Corre la coma hasta que quede un solo dígito distinto de cero antes de ella y cuenta los lugares.', `${num(n)} = ${num(m)} · 10^${e}.`);
    },
    () => {
      const a = rnd(1, 4), b = rnd(1, 2), ea = rnd(2, 6), eb = rnd(2, 6), m = a * b;
      return D(`Calcula y deja en notación científica: (${a} · 10^${ea}) · (${b} · 10^${eb})`, `${m} · 10^${ea + eb}`, [`${m} · 10^${ea * eb}`, `${a + b} · 10^${ea + eb}`, `${m} · 10^${Math.abs(ea - eb)}`], null,
        'Multiplica los primeros factores y suma los exponentes de las potencias de 10.', `${a} · ${b} = ${m} y 10^${ea} · 10^${eb} = 10^${ea + eb}.`);
    },
  ];

  N7.u1.potencias10 = [
    () => {
      const e = rnd(2, 9);
      return D(`¿Cuál es el valor de 10^${e}?`, num(10 ** e), [num(10 * e), num(10 ** (e - 1)), num(10 ** (e + 1))], null,
        `10^${e} es un 1 seguido de ${e} ceros.`, `10^${e} = ${num(10 ** e)}.`);
    },
    () => {
      const e = rnd(2, 9);
      return D(`¿Qué potencia de 10 es igual a ${num(10 ** e)}?`, `10^${e}`, [`10^${e + 1}`, `10^${e - 1}`, `${e}^10`], null,
        'Cuenta los ceros que siguen al 1.', `${num(10 ** e)} tiene ${e} ceros, entonces es 10^${e}.`);
    },
    () => {
      const dig = [rnd(1, 9), rnd(0, 9), rnd(0, 9), rnd(0, 9)], n = Number(dig.join(''));
      const terms = dig.map((d, i) => [d, 3 - i]).filter(([d]) => d !== 0).map(([d, e]) => `${d} · 10^${e}`).join(' + ');
      const mal1 = dig.map((d, i) => [d, 3 - i]).filter(([d]) => d !== 0).map(([d, e]) => `${d} · 10^${e + 1}`).join(' + ');
      const mal2 = dig.map((d, i) => [d, i]).filter(([d]) => d !== 0).map(([d, e]) => `${d} · 10^${e}`).join(' + ');
      const mal3 = dig.map((d, i) => [d, 3 - i]).filter(([d]) => d !== 0).map(([d, e]) => `${d} · ${10 * e}`).join(' + ');
      return D(`¿Cuál es la descomposición de ${num(n)} en potencias de 10?`, terms, [mal1, mal2, mal3], null,
        'Cada cifra se multiplica por la potencia de 10 de su posición: unidades 10^0, decenas 10^1, centenas 10^2, unidades de mil 10^3.', `${num(n)} = ${terms}.`);
    },
    () => {
      const n = rnd(2, 99), e = rnd(1, 5), r = n * 10 ** e;
      return D(`Calcula: ${n} · 10^${e}`, num(r), [num(n * 10 * e), num(n + 10 ** e), num(r / 10)], null,
        `Multiplicar por 10^${e} agrega ${e} ceros.`, `${n} · 10^${e} = ${num(r)}.`);
    },
    () => {
      const e = rnd(1, 8);
      return D(`¿Cuántos ceros tiene el número 10^${e} escrito sin potencias?`, String(e), [String(e + 1), String(10 * e), String(e - 1)], null,
        '10^n es un 1 seguido de n ceros.', `10^${e} = ${num(10 ** e)}: tiene ${e} ceros.`);
    },
  ];

  // =====================================================================
  // UNIDAD 2 · ÁLGEBRA Y PROPORCIONALIDAD (contextos del desierto)
  // =====================================================================
  const LETRAS = ['x', 'y', 'z', 'a', 'b', 'm', 'n'];
  const terminoAzar = (maxLit = 3) => {
    const k = rnd(1, maxLit), ls = shuffle([...LETRAS]).slice(0, k).sort((p, q) => LETRAS.indexOf(p) - LETRAS.indexOf(q)).map((l) => [l, rnd(1, 4)]);
    return { c: nz(-12, 12), ls };
  };
  N7.u2.termino = [
    () => {
      const t = terminoAzar(); if (Math.abs(t.c) === 1) t.c *= rnd(2, 9);
      return D(`¿Cuál es el coeficiente numérico del término ${termino(t.c, t.ls)}?`, num(t.c), [num(-t.c), termino(1, t.ls), num(t.ls.reduce((s, [, e]) => s + e, 0))], cerca(t.c),
        'El coeficiente numérico es el número que multiplica a las letras (incluye el signo).', `En ${termino(t.c, t.ls)} el coeficiente es ${num(t.c)}.`);
    },
    () => {
      const t = terminoAzar(); if (Math.abs(t.c) === 1) t.c = 5;
      const lit = termino(1, t.ls), otras = [termino(1, t.ls.map(([l, e]) => [l, e === 1 ? 2 : 1])), termino(t.c, t.ls), t.ls.map(([l]) => l).join(''), num(t.c)];
      return C(`¿Cuál es el factor literal del término ${termino(t.c, t.ls)}?`, lit, otras.filter((o) => o !== lit),
        'El factor literal son las letras con sus exponentes.', `El factor literal de ${termino(t.c, t.ls)} es ${lit}.`);
    },
    () => {
      const t = terminoAzar(); const g = t.ls.reduce((s, [, e]) => s + e, 0);
      return D(`¿Cuál es el grado del término ${termino(t.c, t.ls)}?`, String(g), [String(Math.max(...t.ls.map(([, e]) => e))), String(Math.abs(t.c)), String(t.ls.length)].filter((x) => x !== String(g)), cerca(g),
        'El grado de un término es la suma de los exponentes de sus letras.', `${t.ls.map(([l, e]) => `${l}: ${e}`).join(', ')} → grado ${g}.`);
    },
    () => {
      const t = terminoAzar(2); const c2 = nz(-9, 9);
      const correcta = termino(c2 === t.c ? c2 + 1 : c2, t.ls);
      const malas = [termino(t.c, t.ls.map(([l, e]) => [l, e + 1])), termino(t.c, [...t.ls.slice(1), [t.ls[0][0] === 'x' ? 'y' : 'x', 1]].sort((p, q) => LETRAS.indexOf(p[0]) - LETRAS.indexOf(q[0]))), termino(t.c, t.ls.slice(0, 1).map(([l, e]) => [l, e + 1])), termino(t.c, t.ls.map(([l, e]) => [l === 'x' ? 'z' : 'x', e]))];
      return C(`¿Cuál de estos términos es semejante a ${termino(t.c, t.ls)}?`, correcta, [...new Set(malas)].filter((m) => m !== correcta && m !== termino(t.c, t.ls)),
        'Los términos semejantes tienen exactamente el mismo factor literal (mismas letras con los mismos exponentes).', `${correcta} tiene el mismo factor literal ${termino(1, t.ls)}.`);
    },
    () => {
      const t = terminoAzar(); if (Math.abs(t.c) === 1) t.c = -7;
      const g = t.ls.reduce((s, [, e]) => s + e, 0);
      const ver = pick([`Su coeficiente es ${num(t.c)}`, `Su grado es ${g}`, `Su factor literal es ${termino(1, t.ls)}`]);
      return C(`Sobre el término ${termino(t.c, t.ls)}, ¿qué afirmación es correcta?`, ver,
        [`Su coeficiente es ${num(-t.c)}`, `Su grado es ${g + 1}`, `Su factor literal es ${termino(t.c, t.ls)}`, `Su grado es ${t.ls.length === g ? g + 2 : t.ls.length}`, `No tiene factor literal`].filter((x) => x !== ver),
        'Coeficiente: el número con signo. Factor literal: letras con exponentes. Grado: suma de exponentes.', `${ver}.`);
    },
  ];

  N7.u2.semejantes = [
    () => {
      const a = nz(-9, 9), b = nz(-9, 9), c = nz(-9, 9), d = nz(-9, 9);
      const x2 = a + c, x1 = b + d;
      const res = (x2 === 0 && x1 === 0) ? '0' : [x2 ? termino(x2, [['x', 2]]) : '', x1 ? (x2 ? mas(x1).replace(/ ([+−]) (\d+)$/, ' $1 $2') + 'x' : termino(x1, [['x', 1]])) : ''].join('').replace(/ ([+−]) 1x$/, ' $1 x');
      const exp = `${termino(a, [['x', 2]])}${b < 0 ? ' − ' : ' + '}${termino(Math.abs(b), [['x', 1]])}${c < 0 ? ' − ' : ' + '}${termino(Math.abs(c), [['x', 2]])}${d < 0 ? ' − ' : ' + '}${termino(Math.abs(d), [['x', 1]])}`;
      const fmt = (p, q) => (p === 0 && q === 0 ? '0' : `${p ? termino(p, [['x', 2]]) : ''}${q ? (p ? (q < 0 ? ' − ' : ' + ') + termino(Math.abs(q), [['x', 1]]) : termino(q, [['x', 1]])) : ''}`);
      void res;
      return D(`Reduce: ${exp}`, fmt(x2, x1), [fmt(a - c, b - d), fmt(x1, x2), termino(x2 + x1, [['x', 3]])], null,
        'Suma solo los coeficientes de los términos semejantes: los x² con los x², y los x con los x.', `x²: ${num(a)}${mas(c)} = ${num(x2)}; x: ${num(b)}${mas(d)} = ${num(x1)}. Resultado: ${fmt(x2, x1)}.`);
    },
    () => {
      const a = nz(-8, 8), b = nz(-8, 8), c = nz(-8, 8), d = nz(-8, 8);
      const fmt = (p, q) => (p === 0 && q === 0 ? '0' : `${p ? termino(p, [['x', 1], ['y', 1]]) : ''}${q ? (p ? (q < 0 ? ' − ' : ' + ') + termino(Math.abs(q), [['y', 1]]) : termino(q, [['y', 1]])) : ''}`);
      const exp = `${termino(a, [['x', 1], ['y', 1]])}${b < 0 ? ' − ' : ' + '}${termino(Math.abs(b), [['y', 1]])}${c < 0 ? ' − ' : ' + '}${termino(Math.abs(c), [['x', 1], ['y', 1]])}${d < 0 ? ' − ' : ' + '}${termino(Math.abs(d), [['y', 1]])}`;
      return D(`Reduce: ${exp}`, fmt(a + c, b + d), [fmt(a - c, b - d), fmt(a + c + b + d, 0), fmt(b + d, a + c)], null,
        'xy e y NO son semejantes: reduce cada tipo por separado.', `xy: ${num(a)}${mas(c)} = ${num(a + c)}; y: ${num(b)}${mas(d)} = ${num(b + d)}.`);
    },
    () => {
      const a = rnd(2, 9), b = rnd(2, 9), c = rnd(1, 9);
      const r = lin(a - b, c);
      return D(`Reduce: ${a}x − (${b}x − ${c})`, r, [lin(a - b, -c), lin(a + b, -c), lin(a - b + c, 0)], null,
        'Un signo menos delante del paréntesis cambia el signo de todos los términos de adentro.', `${a}x − ${b}x + ${c} = ${r}.`);
    },
    () => {
      const a = rnd(2, 6), b = rnd(1, 9), c = rnd(1, 5), d = rnd(1, 9);
      const r = lin(2 * (a + c), 2 * (b + d));
      return D(`Un corral rectangular del oasis mide (${lin(a, b)}) m de largo y (${lin(c, d)}) m de ancho. ¿Qué expresión representa su perímetro?`, r,
        [lin(a + c, b + d), lin(2 * a + c, 2 * b + d), lin(4 * (a + c), b + d)], null,
        'El perímetro de un rectángulo es 2 · largo + 2 · ancho.', `2(${lin(a, b)}) + 2(${lin(c, d)}) = ${lin(2 * a, 2 * b)} + ${lin(2 * c, 2 * d)} = ${r}.`);
    },
    () => {
      const a = nz(-6, 9), b = nz(-6, 9), c = nz(-6, 9);
      const s = a + b + c;
      if (s === 0) return null;
      return D(`Reduce: ${termino(a, [['a', 1], ['b', 2]])}${b < 0 ? ' − ' : ' + '}${termino(Math.abs(b), [['a', 1], ['b', 2]])}${c < 0 ? ' − ' : ' + '}${termino(Math.abs(c), [['a', 1], ['b', 2]])}`,
        termino(s, [['a', 1], ['b', 2]]), [termino(s, [['a', 3], ['b', 6]]), termino(a + b - c, [['a', 1], ['b', 2]]), termino(-s, [['a', 1], ['b', 2]])], null,
        'Son semejantes: suma los coeficientes y conserva el factor literal.', `${num(a)}${mas(b)}${mas(c)} = ${num(s)} → ${termino(s, [['a', 1], ['b', 2]])}.`);
    },
  ];

  N7.u2.clasificar = [
    () => {
      const pool = [termino(nz(-9, 9), [['x', 2]]), termino(nz(-9, 9), [['x', 1], ['y', 1]]), termino(nz(-9, 9), [['y', 1]]), num(nz(-9, 9)), termino(nz(-9, 9), [['a', 3]]), termino(nz(-9, 9), [['b', 1]])];
      const n = rnd(1, 5), ts = shuffle(pool).slice(0, n);
      const exp = ts.map((t, i) => (i === 0 ? t : t.startsWith('−') ? ' − ' + t.slice(1) : ' + ' + t)).join('');
      const nombre = ['monomio', 'binomio', 'trinomio', 'polinomio de 4 términos', 'polinomio de 5 términos'][n - 1];
      return C(`La expresión ${exp} es un:`, nombre, ['monomio', 'binomio', 'trinomio', 'polinomio de 4 términos', 'polinomio de 5 términos'].filter((x) => x !== nombre),
        'Cuenta los términos (separados por + o −): 1 = monomio, 2 = binomio, 3 = trinomio, más = polinomio.', `Tiene ${n} término${n > 1 ? 's' : ''}: es un ${nombre}.`);
    },
    () => {
      const n = rnd(2, 6), pool = shuffle([termino(nz(-9, 9), [['x', 3]]), termino(nz(-9, 9), [['x', 2]]), termino(nz(-9, 9), [['x', 1]]), num(nz(-9, 9)), termino(nz(-9, 9), [['y', 2]]), termino(nz(-9, 9), [['x', 1], ['y', 1]])]).slice(0, n);
      const exp = pool.map((t, i) => (i === 0 ? t : t.startsWith('−') ? ' − ' + t.slice(1) : ' + ' + t)).join('');
      return D(`¿Cuántos términos tiene la expresión ${exp}?`, String(n), [String(n + 1), String(n - 1), String(n * 2)], cerca(n),
        'Los términos están separados por los signos + y −.', `${exp} tiene ${n} términos.`);
    },
    () => {
      const tipo = pick(['monomio', 'binomio', 'trinomio']);
      const mk = (k) => { const ts = shuffle([termino(nz(-9, 9), [['x', 2]]), termino(nz(-9, 9), [['y', 1]]), num(nz(1, 9)), termino(nz(-9, 9), [['a', 1], ['b', 1]])]).slice(0, k); return ts.map((t, i) => (i === 0 ? t : t.startsWith('−') ? ' − ' + t.slice(1) : ' + ' + t)).join(''); };
      const k = { monomio: 1, binomio: 2, trinomio: 3 }[tipo];
      return D(`¿Cuál de estas expresiones es un ${tipo}?`, mk(k), [1, 2, 3, 4].filter((x) => x !== k).map(mk), null,
        'Monomio: 1 término; binomio: 2; trinomio: 3.', `${tipo === 'monomio' ? 'Un monomio tiene 1 término' : tipo === 'binomio' ? 'Un binomio tiene 2 términos' : 'Un trinomio tiene 3 términos'}.`);
    },
    () => {
      const ts = [[nz(-9, 9), [['x', rnd(1, 4)]]], [nz(-9, 9), [['x', rnd(1, 2)], ['y', rnd(1, 3)]]], [nz(-9, 9), []]];
      const g = Math.max(...ts.map(([, ls]) => ls.reduce((s, [, e]) => s + e, 0)));
      const exp = ts.map(([c, ls], i) => { const t = termino(c, ls); return i === 0 ? t : t.startsWith('−') ? ' − ' + t.slice(1) : ' + ' + t; }).join('');
      return D(`¿Cuál es el grado de la expresión ${exp}?`, String(g), [String(g + 1), String(g - 1 > 0 ? g - 1 : g + 2), String(ts.length)].filter((x) => x !== String(g)), cerca(g),
        'El grado de una expresión es el mayor grado entre sus términos.', `El término de mayor grado tiene grado ${g}.`);
    },
  ];

  N7.u2.valorizar = [
    () => {
      const a = nz(-6, 6), b = nz(-6, 6), c = nz(-6, 6), p = rnd(2, 5), q = rnd(2, 5);
      const r = p * a - q * b + c;
      return D(`Valoriza ${p}a − ${q}b + c si a = ${num(a)}, b = ${num(b)} y c = ${num(c)}.`, num(r), [num(p * a + q * b + c), num(p * a - q * b - c), num(-r)], cerca(r),
        'Reemplaza cada letra por su valor entre paréntesis y respeta los signos.', `${p}·${par(a)} − ${q}·${par(b)} + ${par(c)} = ${num(p * a)}${mas(-q * b)}${mas(c)} = ${num(r)}.`);
    },
    () => {
      const x = nz(-5, 6), b = nz(-6, 6), c = nz(-9, 9), r = x * x + b * x + c;
      return D(`Valoriza x² ${b < 0 ? '−' : '+'} ${Math.abs(b)}x ${c < 0 ? '−' : '+'} ${Math.abs(c)} para x = ${num(x)}.`, num(r), [num(-x * x + b * x + c), num(2 * x + b * x + c), num(x * x - b * x + c)], cerca(r),
        `Recuerda: x² = ${par(x)} · ${par(x)} y el cuadrado de un negativo es positivo.`, `${par(x)}² ${b < 0 ? '−' : '+'} ${Math.abs(b)}·${par(x)} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${x * x}${mas(b * x)}${mas(c)} = ${num(r)}.`);
    },
    () => {
      const F = pick([
        () => { const a = rnd(3, 15), b = rnd(2, 10); return ['El perímetro de un rectángulo es P = 2a + 2b', `a = ${a} m y b = ${b} m`, 2 * a + 2 * b, 'm', `2·${a} + 2·${b} = ${2 * a + 2 * b}`]; },
        () => { const b = rnd(3, 15), h = 2 * rnd(2, 9); return ['El área de un triángulo es A = b · h : 2', `b = ${b} cm y h = ${h} cm`, (b * h) / 2, 'cm²', `${b}·${h} : 2 = ${(b * h) / 2}`]; },
        () => { const v = rnd(3, 12), t = rnd(2, 8); return ['La distancia que recorre un camello es d = v · t', `v = ${v} km/h y t = ${t} h`, v * t, 'km', `${v}·${t} = ${v * t}`]; },
        () => { const n = rnd(4, 20); return ['El número de palmeras del oasis el día n es P = 3n + 5', `n = ${n}`, 3 * n + 5, 'palmeras', `3·${n} + 5 = ${3 * n + 5}`]; },
      ])();
      const [frase, datos, r, u, calc] = F;
      return D(`${frase}. ¿Cuánto vale si ${datos}?`, `${num(r)} ${u}`, [`${num(r + rnd(2, 6))} ${u}`, `${num(r * 2)} ${u}`, `${num(Math.max(1, r - rnd(2, 6)))} ${u}`], null,
        'Reemplaza los valores en la fórmula y calcula.', `${calc} ${u}.`);
    },
    () => {
      const a = nz(-5, 5), b = nz(-5, 5), r = (a + b) * (a + b);
      if (a * b === 0) return null;
      return D(`Valoriza (a + b)² si a = ${num(a)} y b = ${num(b)}.`, num(r), [num(a * a + b * b), num(2 * (a + b)), num(-r)], cerca(r),
        'Primero suma dentro del paréntesis y después eleva al cuadrado.', `(${num(a)} + ${par(b)})² = ${par(a + b)}² = ${num(r)}.`);
    },
    () => {
      const x = 2 * nz(-6, 6), y = nz(-8, 8), r = x / 2 - y;
      return D(`Valoriza x/2 − y si x = ${num(x)} e y = ${num(y)}.`, num(r), [num(x / 2 + y), num(x - y / 2), num((x - y) / 2)].map((v) => (Number.isInteger(Number(String(v).replace('−', '-').replace(',', '.'))) ? v : v)), cerca(r),
        'Divide x por 2 y luego resta y (cuidado con los signos).', `${num(x)} : 2 − ${par(y)} = ${num(x / 2)}${mas(-y)} = ${num(r)}.`);
    },
  ];

  N7.u2.lenguaje = [
    () => {
      const b = rnd(2, 9);
      return D(`¿Cómo se escribe "el cuadrado de un número, disminuido en ${b}"?`, `x² − ${b}`, [`(x − ${b})²`, `2x − ${b}`, `${b} − x²`], null,
        'Primero se eleva el número al cuadrado y después se resta.', `"El cuadrado de un número" es x²; disminuido en ${b} queda x² − ${b}.`);
    },
    () => C('¿Cómo se escribe "la suma de dos números consecutivos"?', 'x + (x + 1)', ['x + x', 'x · (x + 1)', '2x + 2', 'x + 2'],
      'Si un número es x, su consecutivo es x + 1.', 'x + (x + 1) = 2x + 1.'),
    () => {
      const b = rnd(2, 9), k = rnd(2, 5), nom = ['doble', 'triple', 'cuádruple', 'quíntuple'][k - 2];
      return D(`¿Cómo se escribe "el ${nom} de la diferencia entre un número y ${b}"?`, `${k}(x − ${b})`, [`${k}x − ${b}`, `x − ${k * b}`, `${k}(${b} − x)`], null,
        '"La diferencia entre un número y b" va entre paréntesis y luego se multiplica.', `La diferencia es (x − ${b}); su ${nom} es ${k}(x − ${b}).`);
    },
    () => {
      const k = rnd(2, 5), b = rnd(1, 9), nom = ['el doble', 'el triple', 'el cuádruple', 'el quíntuple'][k - 2];
      return C(`¿Qué frase corresponde a la expresión ${k}x + ${b}?`, `${nom[0].toUpperCase() + nom.slice(1)} de un número, aumentado en ${b}`,
        [`${nom[0].toUpperCase() + nom.slice(1)} de un número aumentado en ${b}, todo multiplicado`, `Un número aumentado en ${k + b}`, `${nom[0].toUpperCase() + nom.slice(1)} de la suma de un número y ${b}`, `Un número disminuido en ${b}`],
        `${k}x significa ${nom} de x; + ${b} es "aumentado en ${b}".`, `${k}x + ${b}: ${nom} de un número, aumentado en ${b}.`);
    },
    () => {
      const p = rnd(2, 9);
      return D(`Una caravana lleva x sacos de dátiles. Se venden ${p} sacos y el resto se reparte en partes iguales entre 3 mercaderes. ¿Qué expresión representa lo que recibe cada uno?`,
        `(x − ${p}) : 3`, [`x − ${p} : 3`, `3(x − ${p})`, `(x + ${p}) : 3`], null,
        'Primero se resta lo vendido y ese resultado completo se divide.', `Quedan (x − ${p}) sacos; cada mercader recibe (x − ${p}) : 3.`);
    },
  ];

  N7.u2.ecuaciones7 = [
    () => {
      const x = nz(-12, 12), a = nz(-15, 15), b = x + a;
      return D(`Resuelve: x ${a < 0 ? '−' : '+'} ${Math.abs(a)} = ${num(b)}`, `x = ${num(x)}`, [`x = ${num(b + a)}`, `x = ${num(-x)}`, `x = ${num(a - b)}`].filter((o) => o !== `x = ${num(x)}`), (k) => `x = ${num(x + k)}`,
        `Despeja x ${a < 0 ? 'sumando' : 'restando'} ${Math.abs(a)} a ambos lados.`, `x = ${num(b)} ${a < 0 ? '+' : '−'} ${Math.abs(a)} = ${num(x)}.`);
    },
    () => {
      const x = rnd(-9, 15), a = rnd(5, 25), b = a - x;
      return D(`Resuelve: ${a} − x = ${num(b)}`, `x = ${num(x)}`, [`x = ${num(-x)}`, `x = ${num(a + b)}`, `x = ${num(b - a)}`].filter((o) => o !== `x = ${num(x)}`), (k) => `x = ${num(x + k)}`,
        'Suma x a ambos lados y luego despeja.', `${a} − ${num(b)} = x → x = ${num(x)}.`);
    },
    () => {
      const a = rnd(2, 9), r = nz(-9, 9), x = a * r;
      return D(`Resuelve: x : ${a} = ${num(r)}`, `x = ${num(x)}`, [`x = ${num(r)}`, `x = ${num(r + a)}`, `x = ${num(-x)}`], (k) => `x = ${num(x + a * k)}`,
        `Multiplica ambos lados por ${a}.`, `x = ${num(r)} · ${a} = ${num(x)}.`);
    },
    () => {
      const n = rnd(3, 20), k = rnd(2, 5), s = rnd(1, 15), r = k * n - s;
      const nom = ['el doble', 'el triple', 'el cuádruple', 'el quíntuple'][k - 2];
      return D(`Pienso un número, calculo ${nom} y le resto ${s}. Obtengo ${r}. ¿Qué número pensé?`, String(n), [String(r + s), String(Math.round((r - s) / k)) === String(n) ? String(n + 2) : String(Math.round((r - s) / k)), String(n * k)], cerca(n),
        `Plantea ${k}x − ${s} = ${r} y despeja.`, `${k}x = ${r + s} → x = ${n}.`);
    },
    () => {
      const a = rnd(2, 6), b = rnd(1, 12), c = a * rnd(2, 10) + b + pick([0, 1, 2]), lim = (c - b) / a;
      const sig = pick(['≤', '≥']);
      const sol = Number.isInteger(lim) ? `x ${sig} ${num(lim)}` : `x ${sig} ${num(redondear(lim, 2))}`;
      if (!Number.isInteger(lim)) return null;
      return D(`Resuelve la inecuación: ${a}x + ${b} ${sig} ${c}`, sol, [`x ${sig === '≤' ? '≥' : '≤'} ${num(lim)}`, `x ${sig} ${num(c + b)}`, `x ${sig} ${num((c + b) / a)}`].filter((o) => o !== sol), null,
        'Se despeja igual que una ecuación: resta y divide (por un número positivo no cambia el signo).', `${a}x ${sig} ${c - b} → x ${sig} ${num(lim)}.`);
    },
  ];

  N7.u2.razones = [
    () => {
      const g = rnd(2, 6), a = rnd(1, 7), b = rnd(1, 7); if (gcd(a, b) !== 1 || a === b) return null;
      return D(`En el oasis hay ${a * g} camellos y ${b * g} caballos. ¿Cuál es la razón entre camellos y caballos (simplificada)?`, `${a} : ${b}`, [`${b} : ${a}`, `${a * g} : ${(a + b) * g}`, `${a + 1} : ${b + 1}`], null,
        'Escribe camellos : caballos y simplifica dividiendo por el mismo número.', `${a * g} : ${b * g} = ${a} : ${b} (dividiendo por ${g}).`);
    },
    () => {
      const a = rnd(1, 9), b = rnd(2, 10), k = rnd(2, 8); if (a === b) return null;
      return D(`Resuelve la proporción: ${a} : ${b} = x : ${b * k}`, `x = ${a * k}`, [`x = ${a + b * k - b}`, `x = ${b * k * a}`, `x = ${a * k + 1}`], (j) => `x = ${a * k + j}`,
        'En una proporción, el producto de los extremos es igual al de los medios.', `${a} · ${b * k} = ${b} · x → x = ${a * b * k} : ${b} = ${a * k}.`);
    },
    () => {
      const a = rnd(1, 5), b = rnd(1, 5), k = rnd(3, 15); if (a === b || gcd(a, b) !== 1) return null;
      const T = (a + b) * k;
      return D(`Dos mercaderes se reparten ${T} monedas en la razón ${a} : ${b}. ¿Cuántas recibe el primero?`, String(a * k), [String(b * k), num(T / 2), String(a * T)], cerca(a * k),
        `Divide el total en ${a + b} partes iguales; el primero recibe ${a} de ellas.`, `${T} : ${a + b} = ${k}; ${a} · ${k} = ${a * k} monedas.`);
    },
    () => {
      const a = rnd(1, 6), b = rnd(2, 9), k = rnd(2, 7); if (a === b || gcd(a, b) !== 1) return null;
      return D(`La razón entre el agua y la arena de una mezcla es ${a} : ${b}. Si usas ${a * k} litros de agua, ¿cuántos kilos de arena necesitas?`, `${b * k} kg`, [`${a * b} kg`, `${b + k} kg`, `${a * k + b} kg`], (j) => `${b * k + j} kg`,
        `Si el agua se multiplicó por ${k}, la arena también.`, `${a} : ${b} = ${a * k} : ${b * k}. Necesitas ${b * k} kg.`);
    },
    () => {
      const a = rnd(1, 8), b = rnd(2, 9), k = rnd(2, 6); if (a === b) return null;
      const ok = `${a} : ${b} = ${a * k} : ${b * k}`;
      return C('¿Cuál de estas igualdades es una proporción?', ok, [`${a} : ${b} = ${a + k} : ${b + k}`, `${a} : ${b} = ${b * k} : ${a * k}`, `${a} : ${b} = ${a * k} : ${b + k}`, `${a} : ${b} = ${a * k + 1} : ${b * k}`],
        'En una proporción, los productos cruzados son iguales.', `${a} · ${b * k} = ${b} · ${a * k} = ${a * b * k}.`);
    },
  ];

  N7.u2.proporcion = [
    () => {
      const x = rnd(2, 12), y = rnd(2, 12);
      return D(`x e y son inversamente proporcionales. Si x = ${x} cuando y = ${y}, ¿cuál es la constante de proporcionalidad?`, String(x * y), [String(x + y), ftxt(y, x), ftxt(x, y)], cerca(x * y),
        'En la proporcionalidad inversa, el producto x · y es constante.', `k = ${x} · ${y} = ${x * y}.`);
    },
    () => {
      const k = rnd(2, 9), inv = pick([true, false]);
      const xs = [1, 2, 3, 4].map((v) => v * pick([1, 2])), xsU = [...new Set(xs)].length === 4 ? xs : [1, 2, 3, 6];
      const ys = inv ? xsU.map((v) => (k * 12) / v) : xsU.map((v) => k * v);
      const tabla = xsU.map((v, i) => `x = ${v} → y = ${num(ys[i])}`).join('; ');
      return C(`Observa la tabla: ${tabla}. ¿Qué tipo de proporcionalidad hay entre x e y?`, inv ? 'Inversa' : 'Directa', [inv ? 'Directa' : 'Inversa', 'No hay proporcionalidad', 'Directa e inversa a la vez'],
        'Directa: y : x es constante. Inversa: x · y es constante.', inv ? `x · y = ${k * 12} siempre: es inversa.` : `y : x = ${k} siempre: es directa.`);
    },
    () => {
      const porc = rnd(2, 6), harina = pick([100, 150, 200, 250]), n = rnd(3, 12), r = (harina / porc) * n;
      if (!Number.isInteger(r)) return null;
      return D(`Una receta de pan de dátiles para ${porc} personas usa ${harina} g de harina. ¿Cuántos gramos se necesitan para ${n} personas?`, `${num(r)} g`, [`${num(harina * n)} g`, `${num(harina + n)} g`, `${num((harina * porc) / n)} g`], cerca(r, (v) => `${num(v)} g`, 25),
        'Más personas, más harina: es proporcionalidad directa.', `${harina} : ${porc} = ${num(harina / porc)} g por persona; · ${n} = ${num(r)} g.`);
    },
  ];

  // =====================================================================
  // UNIDAD 3 · GEOMETRÍA (contextos de la mina)
  // =====================================================================
  const pto = (x, y) => `(${num(x)}, ${num(y)})`;
  N7.u3.cartesiano = [
    () => {
      const x = nz(-9, 9), y = nz(-9, 9), cual = pick(['abscisa', 'ordenada']);
      const r = cual === 'abscisa' ? x : y;
      return D(`¿Cuál es la ${cual} del punto ${pto(x, y)}?`, num(r), [num(cual === 'abscisa' ? y : x), num(-r), num(x + y)].filter((v) => v !== num(r)), cerca(r),
        'En (x, y): la abscisa es x (primer número) y la ordenada es y (segundo).', `La ${cual} de ${pto(x, y)} es ${num(r)}.`);
    },
    () => {
      const eje = pick(['x', 'y']), v = nz(-9, 9);
      const ok = eje === 'x' ? pto(v, 0) : pto(0, v);
      return C(`¿Cuál de estos puntos está sobre el eje ${eje}?`, ok, [pto(nz(-9, 9), nz(-9, 9)), eje === 'x' ? pto(0, v) : pto(v, 0), pto(v, v), pto(nz(1, 9), nz(1, 9))],
        `Los puntos del eje ${eje} tienen ${eje === 'x' ? 'ordenada (y)' : 'abscisa (x)'} igual a 0.`, `${ok} tiene ${eje === 'x' ? 'y = 0' : 'x = 0'}.`);
    },
    () => {
      const sx = pick([1, -1]), sy = pick([1, -1]);
      const q = sx > 0 ? (sy > 0 ? 'I' : 'IV') : (sy > 0 ? 'II' : 'III');
      return C(`Un punto tiene abscisa ${sx > 0 ? 'positiva' : 'negativa'} y ordenada ${sy > 0 ? 'positiva' : 'negativa'}. ¿En qué cuadrante está?`, `Cuadrante ${q}`, ['Cuadrante I', 'Cuadrante II', 'Cuadrante III', 'Cuadrante IV'].filter((c) => c !== `Cuadrante ${q}`),
        'I: (+, +), II: (−, +), III: (−, −), IV: (+, −).', `Signos (${sx > 0 ? '+' : '−'}, ${sy > 0 ? '+' : '−'}): cuadrante ${q}.`);
    },
    () => {
      const x1 = rnd(-8, 2), y1 = rnd(-8, 2), w = rnd(2, 7), h = rnd(2, 7);
      return D(`Tres vértices de un rectángulo son ${pto(x1, y1)}, ${pto(x1 + w, y1)} y ${pto(x1 + w, y1 + h)}. ¿Cuál es el cuarto vértice?`, pto(x1, y1 + h), [pto(x1 + w, y1 - h), pto(x1 - w, y1 + h), pto(x1 + h, y1 + w)], null,
        'Los lados de este rectángulo son horizontales y verticales: el cuarto vértice comparte la x de uno y la y de otro.', `El cuarto vértice es ${pto(x1, y1 + h)}.`);
    },
  ];

  N7.u3.vectores = [
    () => {
      const ax = rnd(-7, 7), ay = rnd(-7, 7), vx = nz(-6, 6), vy = nz(-6, 6), bx = ax + vx, by = ay + vy;
      return D(`Un vagón va del punto A${pto(ax, ay)} al punto B${pto(bx, by)}. ¿Qué vector describe su desplazamiento?`, pto(vx, vy), [pto(-vx, -vy), pto(ax + bx, ay + by), pto(vy, vx)], null,
        'El vector desplazamiento es (x final − x inicial, y final − y inicial).', `(${num(bx)} − ${par(ax)}, ${num(by)} − ${par(ay)}) = ${pto(vx, vy)}.`);
    },
    () => {
      const vx = nz(-8, 8), vy = nz(-8, 8);
      return D(`Un minero camina ${Math.abs(vx)} ${Math.abs(vx) === 1 ? 'unidad' : 'unidades'} hacia la ${vx > 0 ? 'derecha' : 'izquierda'} y ${Math.abs(vy)} hacia ${vy > 0 ? 'arriba' : 'abajo'}. ¿Qué vector representa su movimiento?`, pto(vx, vy),
        [pto(vy, vx), pto(-vx, vy), pto(vx, -vy)], null, 'Derecha y arriba son positivos; izquierda y abajo, negativos. Primero va el movimiento horizontal.', `El vector es ${pto(vx, vy)}.`);
    },
    () => C('En un vector, ¿qué elemento indica su longitud?', 'La magnitud (o módulo)', ['La dirección', 'El sentido', 'El origen', 'El extremo'],
      'Un vector tiene magnitud, dirección y sentido.', 'La magnitud o módulo es el largo de la flecha.'),
    () => C('En un vector, ¿qué elemento indica hacia dónde apunta la flecha?', 'El sentido', ['La magnitud', 'La dirección', 'El origen', 'El módulo'],
      'La dirección es la recta sobre la que está el vector; el sentido, hacia cuál de sus dos lados apunta.', 'El sentido indica hacia dónde apunta la flecha.'),
    () => {
      const bx = rnd(-7, 7), by = rnd(-7, 7), vx = nz(-6, 6), vy = nz(-6, 6);
      return D(`Al aplicar el vector ${pto(vx, vy)} a un punto, se llega a ${pto(bx, by)}. ¿Cuál era el punto de partida?`, pto(bx - vx, by - vy), [pto(bx + vx, by + vy), pto(vx - bx, vy - by), pto(bx - vy, by - vx)], null,
        'Para volver al inicio, resta el vector al punto de llegada.', `${pto(bx, by)} − ${pto(vx, vy)} = ${pto(bx - vx, by - vy)}.`);
    },
    () => {
      const v1 = [nz(-5, 5), nz(-5, 5)], v2 = [nz(-5, 5), nz(-5, 5)];
      return D(`Un carro se mueve primero según el vector ${pto(...v1)} y luego según ${pto(...v2)}. ¿Qué único vector equivale a ambos movimientos?`, pto(v1[0] + v2[0], v1[1] + v2[1]),
        [pto(v1[0] - v2[0], v1[1] - v2[1]), pto(v1[0] * v2[0], v1[1] * v2[1]), pto(v1[0] + v2[1], v1[1] + v2[0])], null,
        'Los desplazamientos sucesivos se suman componente a componente.', `${pto(...v1)} + ${pto(...v2)} = ${pto(v1[0] + v2[0], v1[1] + v2[1])}.`);
    },
  ];

  N7.u3.circulo = [
    () => {
      const r = rnd(2, 40), ida = pick([true, false]);
      return ida ? D(`El radio de una rueda mide ${r} cm. ¿Cuánto mide su diámetro?`, `${2 * r} cm`, [`${r / 2} cm`.replace('.', ','), `${num(r * 3.14)} cm`, `${r + 2} cm`], null, 'El diámetro es el doble del radio.', `d = 2 · ${r} = ${2 * r} cm.`)
        : D(`El diámetro de un pozo mide ${2 * r} m. ¿Cuánto mide su radio?`, `${r} m`, [`${4 * r} m`, `${num(2 * r * 3.14)} m`, `${2 * r - 1} m`], null, 'El radio es la mitad del diámetro.', `r = ${2 * r} : 2 = ${r} m.`);
    },
    () => {
      const r = pick([2, 4, 6, 8, 10]), A = redondear((3.14 * r * r) / 2, 2);
      return D(`Una ventana tiene forma de semicírculo de radio ${r} dm. ¿Cuál es su área? (π ≈ 3,14)`, `${num(A)} dm²`, [`${num(redondear(3.14 * r * r, 2))} dm²`, `${num(redondear(3.14 * r, 2))} dm²`, `${num(redondear(3.14 * r * r / 4, 2))} dm²`], null,
        'El área del círculo es π · r²; un semicírculo es la mitad.', `3,14 · ${r}² : 2 = ${num(A)} dm².`);
    },
    () => {
      const r = rnd(2, 10), A = redondear(3.14 * r * r, 2);
      return D(`Un círculo tiene área ${num(A)} m² (π ≈ 3,14). ¿Cuánto mide su radio?`, `${r} m`, [`${2 * r} m`, `${r * r} m`, `${r + 1} m`], null,
        'Divide el área por 3,14 y saca raíz cuadrada.', `${num(A)} : 3,14 = ${r * r}; √${r * r} = ${r} m.`);
    },
  ];

  const NOMBRES = { 3: 'triángulo', 4: 'cuadrilátero', 5: 'pentágono', 6: 'hexágono', 7: 'heptágono', 8: 'octógono', 9: 'eneágono', 10: 'decágono', 11: 'endecágono', 12: 'dodecágono' };
  N7.u3.poligonos = [
    () => {
      const n = rnd(3, 12);
      return C(`¿Cómo se llama un polígono de ${n} lados?`, NOMBRES[n], Object.values(NOMBRES).filter((x) => x !== NOMBRES[n]),
        'Los nombres vienen del griego: penta = 5, hexa = 6, hepta = 7, octo = 8, enea = 9, deca = 10, dodeca = 12.', `Un polígono de ${n} lados es un ${NOMBRES[n]}.`);
    },
    () => {
      const n = rnd(5, 12);
      return D(`¿Cuántos lados tiene un ${NOMBRES[n]}?`, String(n), [String(n - 1), String(n + 1), String(n + 2)], cerca(n),
        'Recuerda los prefijos: penta 5, hexa 6, hepta 7, octo 8, enea 9, deca 10, endeca 11, dodeca 12.', `Un ${NOMBRES[n]} tiene ${n} lados.`);
    },
    () => C('¿Qué es un polígono regular?', 'Un polígono con todos sus lados y todos sus ángulos iguales',
      ['Un polígono con todos sus lados iguales, aunque sus ángulos sean distintos', 'Un polígono con 4 lados', 'Un polígono que tiene un ángulo de más de 180°', 'Un polígono con todos sus ángulos rectos'],
      'Regular = lados iguales Y ángulos iguales.', 'Un polígono regular tiene todos sus lados y ángulos congruentes (por ejemplo, el cuadrado).'),
    () => C('Un polígono que tiene al menos un ángulo interior mayor que 180° se llama:', 'Cóncavo', ['Convexo', 'Regular', 'Equilátero', 'Rectángulo'],
      'En un polígono cóncavo hay un "hundimiento": un ángulo interior mide más de 180°.', 'Es un polígono cóncavo.'),
    () => {
      const n = rnd(4, 12), d = (n * (n - 3)) / 2;
      return D(`¿Cuántas diagonales tiene un polígono de ${n} lados (${NOMBRES[n]})?`, String(d), [String(n * (n - 3)), String(n - 3), String(n)], cerca(d),
        'Desde cada vértice salen (n − 3) diagonales y cada diagonal se cuenta dos veces: n(n − 3) : 2.', `${n} · ${n - 3} : 2 = ${d} diagonales.`);
    },
    () => {
      const T = pick([
        [() => { const a = rnd(3, 12); return [`${a}, ${a} y ${a} cm`, 'Equilátero']; }],
        [() => { const a = rnd(4, 12), b = rnd(2, 2 * a - 1); return b === a ? [`${a}, ${a} y ${a + 1} cm`, 'Isósceles'] : [`${a}, ${a} y ${b} cm`, 'Isósceles']; }],
        [() => { const a = rnd(3, 8), b = a + rnd(1, 3), c = b + rnd(1, 3); return [`${a}, ${b} y ${c} cm`, 'Escaleno']; }],
      ])[0]();
      return C(`Un triángulo tiene lados de ${T[0]}. Según sus lados, es:`, T[1], ['Equilátero', 'Isósceles', 'Escaleno', 'Rectángulo'].filter((x) => x !== T[1]),
        'Equilátero: 3 lados iguales; isósceles: 2 iguales; escaleno: todos distintos.', `Es ${T[1].toLowerCase()}.`);
    },
    () => {
      const Q = pick([['tiene 4 lados iguales y 4 ángulos rectos', 'Cuadrado'], ['tiene 4 lados iguales pero sus ángulos no son rectos', 'Rombo'], ['tiene sus lados opuestos iguales y 4 ángulos rectos, pero no todos los lados iguales', 'Rectángulo'], ['tiene solo un par de lados paralelos', 'Trapecio'], ['no tiene lados paralelos', 'Trapezoide']]);
      return C(`Un cuadrilátero ${Q[0]}. ¿Cómo se llama?`, Q[1], ['Cuadrado', 'Rombo', 'Rectángulo', 'Trapecio', 'Trapezoide', 'Romboide'].filter((x) => x !== Q[1]),
        'Piensa en lados paralelos, lados iguales y ángulos rectos.', `Es un ${Q[1].toLowerCase()}.`);
    },
  ];

  N7.u3.angulos = [
    (dif) => {
      const n = rnd(3, dif === 1 ? 8 : 15), s = (n - 2) * 180;
      return D(`¿Cuánto suman los ángulos interiores de un polígono de ${n} lados?`, `${num(s)}°`, [`${num(n * 180)}°`, `${num((n - 1) * 180)}°`, '360°'].filter((x) => x !== `${num(s)}°`), (k) => `${num(s + 180 * k)}°`,
        'La suma de los ángulos interiores es (n − 2) · 180°.', `(${n} − 2) · 180° = ${num(s)}°.`);
    },
    () => {
      const n = rnd(4, 14), s = (n - 2) * 180;
      return D(`Los ángulos interiores de un polígono suman ${num(s)}°. ¿Cuántos lados tiene?`, String(n), [String(n - 2), String(n + 2), String(n - 1)], cerca(n),
        'Divide la suma por 180 y súmale 2.', `${num(s)} : 180 = ${n - 2}; ${n - 2} + 2 = ${n} lados.`);
    },
    () => {
      const n = pick([4, 5, 6]), s = (n - 2) * 180, angs = []; let rest = s;
      for (let i = 0; i < n - 1; i++) { const a = rnd(60, 150); angs.push(a); rest -= a; }
      if (rest < 40 || rest > 175) return null;
      return D(`Un ${NOMBRES[n]} tiene ${n - 1} ángulos que miden ${angs.join('°, ')}°. ¿Cuánto mide el ángulo que falta?`, `${rest}°`, [`${360 - angs.reduce((a, b) => a + b, 0) > 0 ? 360 - angs.reduce((a, b) => a + b, 0) : rest + 180}°`, `${rest + 180}°`, `${Math.abs(180 - rest) || 90}°`].filter((x) => x !== `${rest}°`), (k) => `${rest + 10 * k}°`,
        `Los ángulos interiores de un ${NOMBRES[n]} suman ${s}°.`, `${s}° − (${angs.join(' + ')})° = ${rest}°.`);
    },
    () => {
      const n = rnd(4, 12);
      return D(`Desde un vértice de un polígono de ${n} lados se trazan todas sus diagonales. ¿En cuántos triángulos queda dividido?`, String(n - 2), [String(n), String(n - 3), String(n - 1)], cerca(n - 2),
        'Desde un vértice se forman (n − 2) triángulos; por eso la suma de ángulos es (n − 2) · 180°.', `${n} − 2 = ${n - 2} triángulos.`);
    },
  ];

  const REG = [3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20];
  N7.u3.angreg = [
    () => {
      const n = pick(REG), a = ((n - 2) * 180) / n;
      return D(`¿Cuánto mide cada ángulo interior de un polígono regular de ${n} lados?`, `${num(a)}°`, [`${num(360 / n)}°`, `${num((n - 2) * 180)}°`, `${num(180 - a / 2)}°`].filter((x) => x !== `${num(a)}°`), (k) => `${num(a + 6 * k)}°`,
        'Calcula la suma (n − 2) · 180° y divídela por n.', `(${n} − 2) · 180° : ${n} = ${num(a)}°.`);
    },
    () => {
      const n = pick(REG), a = ((n - 2) * 180) / n;
      return D(`Cada ángulo interior de un polígono regular mide ${num(a)}°. ¿Cuántos lados tiene?`, String(n), [String(n + 1), String(n - 1), String(Math.round(a / 10))].filter((x) => x !== String(n)), cerca(n),
        'El ángulo exterior es 180° − interior, y n = 360° : ángulo exterior.', `Exterior: 180° − ${num(a)}° = ${num(180 - a)}°; 360 : ${num(180 - a)} = ${n} lados.`);
    },
    () => {
      const n = pick(REG), e = 360 / n;
      return D(`¿Cuánto mide cada ángulo exterior de un polígono regular de ${n} lados?`, `${num(e)}°`, [`${num(180 - e)}°`, `${num(180 / n)}°`, `${num(360 - e)}°`], (k) => `${num(e + 5 * k)}°`,
        'Los ángulos exteriores de cualquier polígono suman 360°.', `360° : ${n} = ${num(e)}°.`);
    },
    () => {
      const n = pick(REG), a = ((n - 2) * 180) / n, e = 360 / n;
      return D(`El ángulo interior de un polígono regular mide ${num(a)}°. ¿Cuánto mide su ángulo exterior?`, `${num(e)}°`, [`${num(360 - a)}°`, `${num(a / 2)}°`, `${num(90 - a / 4)}°`].filter((x) => x !== `${num(e)}°`), (k) => `${num(e + 5 * k)}°`,
        'El ángulo interior y el exterior de un mismo vértice suman 180°.', `180° − ${num(a)}° = ${num(e)}°.`);
    },
  ];

  N7.u3.areas = [
    () => {
      const L = rnd(4, 12), A = rnd(2, 8), h = 2 * rnd(1, 5), r = L * A + (L * h) / 2;
      return D(`La fachada de una casa de la mina es un rectángulo de ${L} m de ancho y ${A} m de alto, con un techo triangular de ${h} m de altura encima. ¿Cuál es el área total de la fachada?`,
        `${num(r)} m²`, [`${num(L * A + L * h)} m²`, `${num(L * A)} m²`, `${num(L * (A + h))} m²`], cerca(r, (v) => `${num(v)} m²`, 2),
        'Suma el área del rectángulo (base · altura) y la del triángulo (base · altura : 2).', `${L}·${A} + ${L}·${h} : 2 = ${L * A} + ${(L * h) / 2} = ${num(r)} m².`);
    },
    () => {
      const b = rnd(3, 15), h = rnd(2, 12), A = b * h;
      return D(`Un paralelogramo tiene área ${A} cm² y altura ${h} cm. ¿Cuánto mide su base?`, `${b} cm`, [`${A * h} cm`, `${(A / h) * 2} cm`, `${A - h} cm`], cerca(b, (v) => `${v} cm`),
        'El área del paralelogramo es base · altura: despeja la base.', `${A} : ${h} = ${b} cm.`);
    },
    () => {
      const B = rnd(8, 20), b = rnd(3, B - 2), h = 2 * rnd(2, 8), A = ((B + b) * h) / 2;
      return D(`Una veta de cobre tiene forma de trapecio con bases de ${B} m y ${b} m, y ${h} m de altura. ¿Cuál es su área?`, `${num(A)} m²`, [`${num((B + b) * h)} m²`, `${num(B * b * h / 2)} m²`, `${num(B * h)} m²`], cerca(A, (v) => `${num(v)} m²`, 2),
        'Área del trapecio = (base mayor + base menor) · altura : 2.', `(${B} + ${b}) · ${h} : 2 = ${num(A)} m².`);
    },
  ];

  N7.u3.construcciones = [
    () => C('¿Cómo se llama la recta perpendicular a un segmento que pasa por su punto medio?', 'Simetral (o mediatriz)', ['Bisectriz', 'Altura', 'Transversal de gravedad', 'Diagonal'],
      'Piensa en la recta que corta al segmento "por la mitad" formando un ángulo recto.', 'La simetral o mediatriz es perpendicular al segmento en su punto medio.'),
    () => C('¿Cómo se llama el rayo que divide un ángulo en dos ángulos iguales?', 'Bisectriz', ['Simetral', 'Altura', 'Mediana', 'Tangente'],
      'Bi = dos; divide el ángulo en dos partes iguales.', 'La bisectriz divide un ángulo en dos ángulos congruentes.'),
    () => C('En un triángulo, el segmento que va desde un vértice y es perpendicular al lado opuesto se llama:', 'Altura', ['Bisectriz', 'Simetral', 'Transversal de gravedad', 'Radio'],
      'Mide qué tan "alto" es el triángulo respecto de ese lado.', 'La altura es perpendicular al lado opuesto (o a su prolongación).'),
    () => C('En un triángulo, el segmento que une un vértice con el punto medio del lado opuesto se llama:', 'Transversal de gravedad', ['Altura', 'Bisectriz', 'Simetral', 'Mediatriz'],
      'Si apoyas el triángulo en ese segmento, queda en equilibrio.', 'La transversal de gravedad une un vértice con el punto medio del lado opuesto.'),
    () => {
      const P = pick([['alturas', 'Ortocentro'], ['bisectrices', 'Incentro'], ['simetrales', 'Circuncentro'], ['transversales de gravedad', 'Centro de gravedad (baricentro)']]);
      return C(`¿Cómo se llama el punto donde se cortan las tres ${P[0]} de un triángulo?`, P[1], ['Ortocentro', 'Incentro', 'Circuncentro', 'Centro de gravedad (baricentro)'].filter((x) => x !== P[1]),
        'Alturas → ortocentro; bisectrices → incentro; simetrales → circuncentro; transversales → baricentro.', `Las ${P[0]} se cortan en el ${P[1].toLowerCase()}.`);
    },
    () => {
      const a = rnd(3, 9), b = rnd(3, 9), okc = rnd(Math.abs(a - b) + 1, a + b - 1);
      const ok = `${a} cm, ${b} cm y ${okc} cm`;
      return C('¿Con cuál de estos tríos de medidas SÍ se puede construir un triángulo?', ok, [`${a} cm, ${b} cm y ${a + b} cm`, `${a} cm, ${b} cm y ${a + b + rnd(1, 4)} cm`, `2 cm, 3 cm y ${rnd(6, 9)} cm`, `1 cm, 1 cm y ${rnd(3, 6)} cm`],
        'Desigualdad triangular: cada lado debe ser menor que la suma de los otros dos.', `En ${ok}, cada lado es menor que la suma de los otros dos.`);
    },
    () => {
      const a = rnd(3, 10), b = rnd(3, 10), min = Math.abs(a - b), max = a + b, ok = rnd(min + 1, max - 1);
      return D(`Dos lados de un triángulo miden ${a} cm y ${b} cm. ¿Cuál de estas medidas puede tener el tercer lado?`, `${ok} cm`, [`${max} cm`, `${max + rnd(1, 5)} cm`, `${min === 0 ? max + 7 : min} cm`], null,
        'El tercer lado debe ser mayor que la diferencia y menor que la suma de los otros dos.', `Debe estar entre ${min} cm y ${max} cm (sin incluirlos): ${ok} cm sirve.`);
    },
    () => C('¿Qué instrumento se usa para trazar circunferencias y copiar medidas en una construcción geométrica?', 'Compás', ['Transportador', 'Escuadra', 'Calculadora', 'Huincha'],
      'Tiene una punta fija y otra que dibuja.', 'El compás traza circunferencias y traslada medidas.'),
    () => C('Para construir un ángulo de 60° solo con regla y compás, se puede construir:', 'Un triángulo equilátero', ['Un cuadrado', 'Un triángulo rectángulo isósceles', 'Un rectángulo', 'Una bisectriz de 90°'],
      '¿Qué triángulo tiene todos sus ángulos de 60°?', 'Los ángulos de un triángulo equilátero miden 60°, y se construye con regla y compás.'),
  ];

  // =====================================================================
  // UNIDAD 4 · ESTADÍSTICA (contextos del glaciar)
  // =====================================================================
  const ESTUDIOS = [
    ['Se quiere saber el deporte favorito de los estudiantes de un colegio. Se encuesta a 60 estudiantes elegidos al azar.', 'Todos los estudiantes del colegio', 'Los 60 estudiantes encuestados', 60],
    ['Para conocer el tiempo que demoran los pingüinos del glaciar en pescar, se observa a 25 pingüinos de una colonia de 800.', 'Los 800 pingüinos de la colonia', 'Los 25 pingüinos observados', 25],
    ['Una fábrica revisa 40 bolsas de cada lote de 2.000 para ver si pesan lo correcto.', 'Las 2.000 bolsas del lote', 'Las 40 bolsas revisadas', 40],
    ['Para saber cuántas horas duermen los niños de una comuna, se pregunta a 150 niños de distintos colegios de esa comuna.', 'Todos los niños de la comuna', 'Los 150 niños consultados', 150],
    ['Un guía quiere conocer la opinión de los 300 turistas que visitaron el glaciar este mes y encuesta a 30 de ellos.', 'Los 300 turistas del mes', 'Los 30 turistas encuestados', 30],
    ['Para medir la temperatura del agua de un lago se toman 12 muestras de agua en distintos puntos.', 'Toda el agua del lago', 'Las 12 muestras de agua', 12],
  ];
  N7.u4.poblacion = [
    () => {
      const E = pick(ESTUDIOS);
      return C(`${E[0]} ¿Cuál es la población del estudio?`, E[1], [E[2], `Solo ${E[3] / 2 >= 1 ? Math.floor(E[3] / 2) : 1} de ellos`, 'Las respuestas obtenidas', 'Quien hace la encuesta'],
        'La población es el conjunto COMPLETO sobre el que se quiere sacar conclusiones.', `La población: ${E[1].toLowerCase()}.`);
    },
    () => {
      const E = pick(ESTUDIOS);
      return C(`${E[0]} ¿Cuál es la muestra?`, E[2], [E[1], 'Las preguntas de la encuesta', 'El resultado promedio', 'Quien hace la encuesta'],
        'La muestra es la parte de la población que realmente se estudia.', `La muestra: ${E[2].toLowerCase()}.`);
    },
    () => {
      const E = pick(ESTUDIOS);
      return D(`${E[0]} ¿Cuál es el tamaño de la muestra?`, String(E[3]), [String(E[3] * 2), String(E[3] + 10), '1'], cerca(E[3], String, 5),
        'El tamaño de la muestra es cuántos elementos se estudiaron.', `Se estudiaron ${E[3]} elementos.`);
    },
    () => C('Para conocer la comida favorita de los 900 estudiantes de un colegio, ¿cuál de estas muestras es la MÁS representativa?', '90 estudiantes elegidos al azar de todos los cursos',
      ['Los 30 estudiantes de un solo curso', 'Los 10 estudiantes que llegan primero', 'Los 15 integrantes del taller de cocina', 'Los amigos de quien hace la encuesta'],
      'Una muestra representativa se elige al azar y considera a toda la población.', 'Elegir al azar en todos los cursos evita favorecer a un grupo.'),
    () => C('¿En qué caso conviene estudiar una MUESTRA en vez de toda la población?', 'Cuando la población es muy grande o estudiarla toda es muy caro',
      ['Siempre que la población tenga menos de 10 elementos', 'Cuando queremos resultados exactos de todos', 'Nunca: siempre se estudia toda la población', 'Cuando la encuesta tiene una sola pregunta'],
      'Piensa en el tiempo y el costo.', 'Se usa una muestra cuando la población es grande o el estudio es costoso.'),
    () => C('Cuando se estudia a TODOS los elementos de una población (como en el Censo), se habla de:', 'Un censo', ['Una muestra', 'Una variable', 'Una frecuencia', 'Un gráfico'],
      'En Chile, el INE realiza uno cada cierto tiempo.', 'Estudiar a toda la población es hacer un censo.'),
  ];

  const VARS = {
    'Cualitativa': ['color favorito', 'deporte que practica', 'comuna donde vive', 'tipo de mascota', 'medio de transporte al colegio', 'sabor de helado preferido', 'nacionalidad', 'estación del año preferida'],
    'Cuantitativa discreta': ['número de hermanos', 'cantidad de mascotas', 'goles en un partido', 'número de libros leídos al año', 'cantidad de pingüinos en una colonia', 'estudiantes por curso'],
    'Cuantitativa continua': ['estatura', 'peso', 'temperatura del glaciar', 'tiempo en recorrer 100 m', 'largo de un pez', 'cantidad de agua de lluvia caída'],
  };
  N7.u4.variables = [
    () => {
      const tipo = pick(Object.keys(VARS)), v = pick(VARS[tipo]);
      return C(`La variable "${v}" es:`, tipo, Object.keys(VARS).filter((t) => t !== tipo).concat(['No es una variable']),
        'Cualitativa: cualidades (palabras). Cuantitativa discreta: se cuenta. Continua: se mide (puede tener decimales).', `"${v}" es ${tipo.toLowerCase()}.`);
    },
    () => {
      const tipo = pick(Object.keys(VARS)), v = pick(VARS[tipo]);
      const otras = Object.keys(VARS).filter((t) => t !== tipo).flatMap((t) => VARS[t]);
      return C(`¿Cuál de estas variables es ${tipo.toLowerCase()}?`, v[0].toUpperCase() + v.slice(1), shuffle(otras).slice(0, 3).map((x) => x[0].toUpperCase() + x.slice(1)),
        'Cualitativa: se responde con palabras. Discreta: se cuenta. Continua: se mide.', `"${v}" es ${tipo.toLowerCase()}.`);
    },
    () => C('¿Qué diferencia a una variable cuantitativa continua de una discreta?', 'La continua puede tomar cualquier valor en un intervalo (con decimales); la discreta se cuenta con números enteros',
      ['La continua se responde con palabras', 'La discreta siempre tiene decimales', 'No hay diferencia', 'La continua solo toma valores negativos'],
      'Piensa en "medir" versus "contar".', 'Continua: se mide (1,52 m). Discreta: se cuenta (3 hermanos).'),
    () => {
      const tipo = pick(Object.keys(VARS)), v = pick(VARS[tipo]);
      const ej = { 'Cualitativa': 'rojo, azul, verde', 'Cuantitativa discreta': '0, 1, 2, 3', 'Cuantitativa continua': '1,52; 1,6; 1,735' }[tipo];
      return C(`Una encuesta pregunta por la variable "${v}". ¿Qué tipo de respuestas se esperan?`, { 'Cualitativa': 'Palabras o categorías (ej: rojo, azul, verde)', 'Cuantitativa discreta': 'Números enteros que se cuentan (ej: 0, 1, 2, 3)', 'Cuantitativa continua': 'Números que se miden y pueden tener decimales (ej: 1,52; 1,6)' }[tipo],
        ['Palabras o categorías (ej: rojo, azul, verde)', 'Números enteros que se cuentan (ej: 0, 1, 2, 3)', 'Números que se miden y pueden tener decimales (ej: 1,52; 1,6)', 'Solo "sí" o "no", siempre'].filter((x) => !x.includes(ej)),
        'Piensa cómo se respondería la pregunta.', `"${v}" es ${tipo.toLowerCase()}.`);
    },
  ];

  const CATS = [['trineo', 'esquí', 'patinaje', 'snowboard'], ['pingüino', 'foca', 'zorro ártico', 'oso polar'], ['chocolate', 'té', 'leche', 'jugo'], ['azul', 'blanco', 'celeste', 'gris']];
  N7.u4.tablas = [
    () => {
      const cats = pick(CATS), datos = []; const f = cats.map(() => rnd(1, 6));
      cats.forEach((c, i) => { for (let k = 0; k < f[i]; k++) datos.push(c); });
      const L = shuffle(datos), i = rnd(0, cats.length - 1);
      return D(`Respuestas de una encuesta en el glaciar: ${L.join(', ')}. ¿Cuál es la frecuencia absoluta de "${cats[i]}"?`, String(f[i]), [String(f[i] + 1), String(L.length), String(Math.max(0, f[i] - 1)) === String(f[i]) ? String(f[i] + 2) : String(Math.max(0, f[i] - 1))], cerca(f[i]),
        'La frecuencia absoluta es cuántas veces aparece el dato.', `"${cats[i]}" aparece ${f[i]} veces.`);
    },
    () => {
      const cats = pick(CATS), f = cats.map(() => rnd(2, 12)), k = rnd(1, 3), F = f.slice(0, k + 1).reduce((a, b) => a + b, 0);
      return D(`En una tabla de frecuencias: ${cats.map((c, i) => `${c}: ${f[i]}`).join('; ')}. ¿Cuál es la frecuencia acumulada hasta "${cats[k]}"?`, String(F), [String(f[k]), String(f.reduce((a, b) => a + b, 0)), String(F - f[0])], cerca(F),
        'La frecuencia acumulada suma las frecuencias desde el primer dato hasta el indicado.', `${f.slice(0, k + 1).join(' + ')} = ${F}.`);
    },
    () => {
      const cats = pick(CATS), N = pick([20, 25, 40, 50]), f = [rnd(2, 8), rnd(2, 8), rnd(2, 8)]; const falta = N - f.reduce((a, b) => a + b, 0);
      if (falta < 1) return null;
      return D(`Se encuestó a ${N} personas sobre: ${cats.slice(0, 4).join(', ')}. ${cats[0]}: ${f[0]}, ${cats[1]}: ${f[1]}, ${cats[2]}: ${f[2]}. ¿Cuántas eligieron ${cats[3]}?`, String(falta), [String(N - f[0] - f[1]), String(falta + f[2]), num(N / 4)], cerca(falta),
        'Las frecuencias absolutas suman el total de datos.', `${N} − ${f.join(' − ')} = ${falta}.`);
    },
    () => {
      const N = pick([20, 25, 40, 50]), p = pick([0.1, 0.2, 0.25, 0.4, 0.5, 0.6]), f = N * p;
      if (!Number.isInteger(f)) return null;
      return D(`De ${N} turistas, ${f} prefieren el kayak. ¿Cuál es la frecuencia relativa de "kayak" escrita como decimal?`, num(p), [num(f), num(redondear(N / f / 10, 2)), num(redondear(p * 100, 2))], null,
        'Frecuencia relativa = frecuencia absoluta : total.', `${f} : ${N} = ${num(p)} (es decir, ${num(p * 100)} %).`);
    },
  ];

  N7.u4.graficos = [
    () => {
      const S = pick([['cómo cambió la temperatura del glaciar durante una semana', 'Gráfico de líneas'], ['qué parte del total representa cada deporte preferido por el curso', 'Gráfico circular'], ['la cantidad de turistas de cada país, para compararlas', 'Gráfico de barras'], ['cuántos animales de cada especie hay, usando dibujos', 'Pictograma']]);
      return C(`¿Qué gráfico es el más adecuado para mostrar ${S[0]}?`, S[1], ['Gráfico de líneas', 'Gráfico circular', 'Gráfico de barras', 'Pictograma'].filter((x) => x !== S[1]),
        'Líneas: cambios en el tiempo. Circular: partes de un todo. Barras: comparar categorías. Pictograma: con dibujos.', `${S[1]}.`);
    },
    () => {
      const p = pick([10, 20, 25, 30, 40, 50, 75, 5, 15]), g = (p * 360) / 100;
      return D(`En un gráfico circular, el ${p} % de los encuestados eligió "trineo". ¿Cuántos grados mide ese sector?`, `${num(g)}°`, [`${p}°`, `${num((p * 180) / 100)}°`, `${num(360 - g)}°`], (k) => `${num(g + 9 * k)}°`,
        'El círculo completo (100 %) mide 360°.', `${p} % de 360° = ${num(g)}°.`);
    },
    () => {
      const cats = pick(CATS), v = cats.map(() => rnd(3, 25)); const i = 0, j = rnd(1, 3);
      if (v[i] === v[j]) return null;
      return D(`Un gráfico de barras muestra: ${cats.map((c, k) => `${c} ${v[k]}`).join(', ')}. ¿Cuántos votos más tiene "${v[i] > v[j] ? cats[i] : cats[j]}" que "${v[i] > v[j] ? cats[j] : cats[i]}"?`, String(Math.abs(v[i] - v[j])), [String(v[i] + v[j]), String(Math.max(v[i], v[j])), String(Math.abs(v[i] - v[j]) + 2)], cerca(Math.abs(v[i] - v[j])),
        'Resta las alturas de las dos barras.', `${Math.max(v[i], v[j])} − ${Math.min(v[i], v[j])} = ${Math.abs(v[i] - v[j])}.`);
    },
    () => {
      const k = pick([2, 4, 5, 10]), n = rnd(3, 9), med = pick([0, 1]);
      const tot = n * k + (med ? k / 2 : 0);
      return D(`En un pictograma, cada 🐧 representa ${k} pingüinos. Una colonia aparece con ${n} 🐧${med ? ' y media figura' : ''}. ¿Cuántos pingüinos tiene?`, num(tot), [String(n), num(n + k), num(tot + k)], cerca(tot, num, k / 2 || 1),
        'Multiplica la cantidad de figuras por lo que vale cada una.', `${n}${med ? ',5' : ''} · ${k} = ${num(tot)} pingüinos.`);
    },
    () => {
      const N = pick([20, 30, 36, 40, 60, 72, 90, 120]), f = rnd(2, N / 2), g = redondear((f * 360) / N, 1);
      if (!Number.isInteger(g)) return null;
      return D(`De ${N} turistas, ${f} prefieren el kayak. En un gráfico circular, ¿cuántos grados le corresponden a "kayak"?`, `${g}°`, [`${f}°`, `${num(redondear((f * 100) / N, 1))}°`, `${360 - g}°`], (k) => `${g + 6 * k}°`,
        'Grados = frecuencia : total · 360°.', `${f} : ${N} · 360° = ${g}°.`);
    },
  ];

  N7.u4.tendencia = [
    () => {
      // se buscan frecuencias que den un promedio entero (antes se descartaba la pregunta 8 de cada 10 veces)
      let vals, f, N, S, k = 0;
      do {
        vals = [rnd(1, 3), rnd(4, 5), rnd(6, 8)]; f = [rnd(1, 6), rnd(1, 6), rnd(1, 6)];
        N = f.reduce((a, b) => a + b, 0); S = vals.reduce((s, v, i) => s + v * f[i], 0);
      } while (S % N && ++k < 400);
      if (S % N) return null;
      return D(`Pescados por turista en el lago congelado: ${vals.map((v, i) => `${v} pescados → ${f[i]} ${f[i] === 1 ? 'turista' : 'turistas'}`).join('; ')}. ¿Cuál es el promedio de pescados por turista?`, num(S / N),
        [num(redondear(vals.reduce((a, b) => a + b, 0) / 3, 2)), num(redondear(S / 3, 2)), num(N)], cerca(S / N),
        'Multiplica cada valor por su frecuencia, suma todo y divide por el total de datos.', `(${vals.map((v, i) => `${v}·${f[i]}`).join(' + ')}) : ${N} = ${S} : ${N} = ${num(S / N)}.`);
    },
    () => C('A un conjunto de datos se le agrega un valor MUY grande (un dato atípico). ¿Qué medida cambia más?', 'La media (promedio)', ['La moda', 'La mediana', 'Ninguna cambia', 'Todas cambian lo mismo'],
      'Piensa cuál medida usa el valor de todos los datos.', 'La media suma todos los valores, así que un dato muy grande la mueve mucho.'),
    () => {
      const vals = [rnd(1, 3), rnd(4, 5), rnd(6, 8), rnd(9, 11)], f = shuffle([rnd(1, 4), rnd(5, 7), rnd(1, 4), rnd(1, 4)]);
      const m = vals[f.indexOf(Math.max(...f))];
      if (f.filter((x) => x === Math.max(...f)).length > 1) return null;
      return D(`Bayas recolectadas: ${vals.map((v, i) => `${v} bayas → ${f[i]} ${f[i] === 1 ? 'jugador' : 'jugadores'}`).join('; ')}. ¿Cuál es la moda?`, `${m} bayas`, vals.filter((v) => v !== m).map((v) => `${v} bayas`), null,
        'La moda es el valor con mayor frecuencia.', `${m} bayas tiene la mayor frecuencia (${Math.max(...f)}).`);
    },
  ];

  P.N7 = N7;
})(typeof window !== 'undefined' ? window : globalThis);
