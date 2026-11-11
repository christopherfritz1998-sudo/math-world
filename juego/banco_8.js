// Math World — banco ampliado de 8° básico: nuevas variantes para cada tema del programa
// (ver banco.js, que arma los temas según el banco de preguntas del profesor).
(function (global) {
  'use strict';
  const P = global.Preguntas;
  const { rnd, pick, gcd, shuffle, num, par, frac, fracTxt, cerca, desafio, redondear } = P.h;
  const D = (en, corr, distr, relleno, pista, expl) => desafio('', '', en, corr, distr, relleno, pista, expl);
  const C = (en, corr, falsas, pista, expl) => D(en, corr, shuffle([...falsas]).slice(0, 3), null, pista, expl);
  const ftxt = (n, d) => fracTxt(frac(n, d));
  const nz = (a, b) => { let x = 0; while (x === 0) x = rnd(a, b); return x; };
  const mas = (x) => (x < 0 ? ' − ' + num(-x) : ' + ' + num(x));
  const lin = (a, b, v = 'x') => {
    let t = a === 1 ? v : a === -1 ? '−' + v : a === 0 ? '' : num(a) + v;
    if (b === 0) return t || '0';
    if (!t) return num(b);
    return t + (b > 0 ? ' + ' : ' − ') + num(Math.abs(b));
  };
  // a·x² + b·x + c
  const cuad = (a, b, c) => {
    let t = a === 0 ? '' : a === 1 ? 'x²' : a === -1 ? '−x²' : `${num(a)}x²`;
    if (b) t += (t ? (b > 0 ? ' + ' : ' − ') : (b < 0 ? '−' : '')) + (Math.abs(b) === 1 ? 'x' : `${num(Math.abs(b))}x`);
    if (c) t += (t ? (c > 0 ? ' + ' : ' − ') : (c < 0 ? '−' : '')) + num(Math.abs(c));
    return t || '0';
  };
  const pto = (x, y) => `(${num(x)}, ${num(y)})`;
  const SUP = { 1: '', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸' };
  const N8 = { u1: {}, u2: {}, u3: {}, u4: {} };

  // =====================================================================
  // UNIDAD 1 · NÚMEROS
  // =====================================================================
  N8.u1.multdiv = [
    () => {
      const a = nz(-25, 25), b = nz(-25, 25), c = nz(-25, 25), r = a + b - c;
      return D(`Calcula: ${num(a)} + ${par(b)} − ${par(c)}`, num(r), [num(a + b + c), num(-r), num(a - b - c)], cerca(r),
        'Restar un número es sumar su opuesto.', `${num(a)} + ${par(b)} + ${par(-c)} = ${num(r)}.`);
    },
    () => {
      const v = rnd(2, 9), t = rnd(3, 12), r = -v * t;
      return D(`Un submarino desciende ${v} m por minuto desde la superficie. ¿En qué posición está después de ${t} minutos?`, `${num(r)} m`, [`${v * t} m`, `${num(-v - t)} m`, `${num(-(v + 1) * t)} m`], cerca(r, (x) => `${num(x)} m`, v),
        'Descender es negativo: multiplica la variación por el tiempo.', `(−${v}) · ${t} = ${num(r)} m.`);
    },
    () => {
      const n = rnd(2, 8), q = rnd(5, 30), D0 = -n * q;
      return D(`Una deuda de ${num(D0)} monedas se reparte en partes iguales entre ${n} amigos. ¿Qué parte le corresponde a cada uno?`, num(-q), [num(q), num(D0 + n), num(-q * 2)], cerca(-q),
        'Un número negativo dividido por uno positivo da negativo.', `${num(D0)} : ${n} = ${num(-q)}.`);
    },
    () => {
      const a = nz(-9, 9), b = nz(-9, 9), c = nz(-9, 9); if ((a * b) % c) return null;
      const r = (a * b) / c;
      return D(`Calcula: ${par(a)} · ${par(b)} : ${par(c)}`, num(r), [num(-r), num(a * b * c), num(a + b + c)], cerca(r),
        'Opera de izquierda a derecha y aplica la regla de los signos en cada paso.', `${par(a)} · ${par(b)} = ${num(a * b)}; ${num(a * b)} : ${par(c)} = ${num(r)}.`);
    },
  ];

  N8.u1.combinadas8 = [
    () => {
      const a = nz(-9, 9), b = nz(-9, 9), c = nz(-9, 9), d = nz(-20, 20), e = pick([1, 2, 3, 4, 5].filter((x) => d % x === 0)) * pick([1, -1]);
      const r = a * (b - c) + d / e;
      return D(`Calcula: ${par(a)} · (${num(b)} − ${par(c)}) + ${par(d)} : ${par(e)}`, num(r), [num(a * b - c + d / e), num((a * (b - c) + d) / e), num(-r)], cerca(r),
        'Primero el paréntesis, luego multiplicaciones y divisiones, y al final sumas.', `${par(a)} · ${par(b - c)} = ${num(a * (b - c))}; ${par(d)} : ${par(e)} = ${num(d / e)}; total ${num(r)}.`);
    },
    () => {
      const a = nz(-15, 15), b = nz(-9, 9), c = nz(-9, 9), d = nz(-15, 15), r = -a + b * c - d;
      return D(`Calcula: −${par(a)} + ${par(b)} · ${par(c)} − ${par(d)}`, num(r), [num(-a + b + c - d), num((-a + b) * c - d), num(a + b * c + d)], cerca(r),
        'La multiplicación va antes que las sumas y restas.', `${num(-a)} + ${num(b * c)}${mas(-d)} = ${num(r)}.`);
    },
    () => {
      const a = nz(-8, 8), b = nz(-8, 8), c = nz(-8, 8), d = nz(-8, 8), r = a - 2 * (b - (c + d));
      return D(`Calcula: ${num(a)} − 2 · [${num(b)} − (${num(c)} + ${par(d)})]`, num(r), [num(a - 2 * b - c - d), num((a - 2) * (b - c - d)), num(a + 2 * (b - c - d))], cerca(r),
        'Resuelve del paréntesis interior hacia afuera.', `(${num(c)} + ${par(d)}) = ${num(c + d)}; [${num(b)} − ${par(c + d)}] = ${num(b - c - d)}; ${num(a)} − 2·${par(b - c - d)} = ${num(r)}.`);
    },
    () => {
      const a = nz(-9, 9), b = nz(-9, 9), c = nz(-9, 9), d = nz(-9, 9), p = (a - b) * (c + d), e = pick([1, 2, 3, 4, 5, 6].filter((x) => p % x === 0)) * pick([1, -1]);
      const r = p / e;
      return D(`Calcula: (${num(a)} − ${par(b)}) · (${num(c)} + ${par(d)}) : ${par(e)}`, num(r), [num(-r), num(p), num(a - b + c + d)], cerca(r),
        'Resuelve los paréntesis y después multiplica y divide de izquierda a derecha.', `${par(a - b)} · ${par(c + d)} = ${num(p)}; ${num(p)} : ${par(e)} = ${num(r)}.`);
    },
  ];

  N8.u1.racionalesq = [
    () => C('¿Cuál de estos números NO es un número racional?', pick(['√2', 'π', '√3', '√5']), ['−3/4', '0,25', '−7', '1,333…', '√9', '5/1'],
      'Un número racional se puede escribir como fracción a/b con a y b enteros (b ≠ 0).', 'Las raíces de números que no son cuadrados perfectos y π no se pueden escribir como fracción.'),
    () => {
      const a = rnd(1, 7), b = rnd(a + 1, 9), c = rnd(1, 7), d = rnd(c + 1, 9);
      const x = -a / b, y = -c / d; if (x === y) return null;
      const mayor = x > y ? `−${a}/${b}` : `−${c}/${d}`;
      return D(`¿Cuál es mayor: −${a}/${b} o −${c}/${d}?`, mayor, [x > y ? `−${c}/${d}` : `−${a}/${b}`, 'Son iguales', 'No se pueden comparar'], null,
        'Entre dos negativos es mayor el que está más cerca del cero.', `−${a}/${b} ≈ ${num(redondear(x, 3))} y −${c}/${d} ≈ ${num(redondear(y, 3))}; el mayor es ${mayor}.`);
    },
    () => {
      const d = rnd(2, 6), n = rnd(d + 1, 5 * d); if (n % d === 0) return null;
      const s = pick([1, -1]), v = (s * n) / d, lo = Math.floor(v);
      return D(`¿Entre qué números enteros consecutivos está ${s < 0 ? '−' : ''}${n}/${d}?`, `${num(lo)} y ${num(lo + 1)}`, [`${num(lo - 1)} y ${num(lo)}`, `${num(lo + 1)} y ${num(lo + 2)}`, `${num(-lo - 1)} y ${num(-lo)}`], null,
        'Divide el numerador por el denominador para ubicarlo en la recta.', `${s < 0 ? '−' : ''}${n}/${d} ≈ ${num(redondear(v, 2))}, que está entre ${num(lo)} y ${num(lo + 1)}.`);
    },
    () => {
      const a = rnd(1, 9), b = rnd(2, 9); if (gcd(a, b) !== 1) return null;
      const s = pick([1, -1]), cual = pick(['opuesto', 'inverso multiplicativo']);
      const corr = cual === 'opuesto' ? (s > 0 ? `−${a}/${b}` : `${a}/${b}`) : (s > 0 ? ftxt(b, a) : '−' + ftxt(b, a));
      return D(`¿Cuál es el ${cual} de ${s < 0 ? '−' : ''}${a}/${b}?`, corr, [cual === 'opuesto' ? ftxt(b, a) : (s > 0 ? `−${a}/${b}` : `${a}/${b}`), cual === 'opuesto' ? '−' + ftxt(b, a) : (s > 0 ? '−' + ftxt(b, a) : ftxt(b, a)), '0'], null,
        cual === 'opuesto' ? 'El opuesto tiene el signo contrario.' : 'El inverso multiplicativo invierte la fracción y conserva el signo (su producto es 1).', `El ${cual} es ${corr}.`);
    },
    () => {
      const a = rnd(1, 5), b = rnd(a + 1, 8), c = rnd(1, 5), d = rnd(c + 1, 8);
      const x = a / b, y = c / d; if (Math.abs(x - y) < 0.05) return null;
      const lo = Math.min(x, y), hi = Math.max(x, y), m = (lo + hi) / 2, mf = frac(Math.round(m * b * d * 2), b * d * 2);
      const corr = fracTxt(mf);
      return D(`¿Qué número está entre ${a}/${b} y ${c}/${d}?`, corr, [fracTxt(frac(Math.round(hi * 2 * 100), 100)), fracTxt(frac(Math.round(lo * 100) - 20 < 0 ? 1 : Math.round(lo * 100) - 20, 100)), num(redondear(hi + 0.3, 2))], null,
        'Escríbelos con igual denominador o como decimal y busca un número intermedio (por ejemplo, el promedio).', `El promedio (${a}/${b} + ${c}/${d}) : 2 = ${corr} está entre ambos.`);
    },
  ];

  N8.u1.decfrac = [
    () => {
      const d = pick([2, 4, 5, 8, 10, 20, 25, 40]), n = rnd(1, 3 * d); if (n % d === 0) return null;
      const r = redondear(n / d, 4), f = frac(n, d);
      return D(`Escribe como número decimal: ${f.n}/${f.d}`, num(r), [num(redondear(f.d / f.n, 4)), num(redondear(r * 10, 4)), `${f.n},${f.d}`], null,
        'Divide el numerador por el denominador.', `${f.n} : ${f.d} = ${num(r)}.`);
    },
    () => {
      const d = pick([3, 9, 11]), n = rnd(1, d - 1); if (gcd(n, d) !== 1 && d !== 9) return null;
      const f = frac(n, d), dec = (n / d).toFixed(6).replace('.', ',').slice(0, 7) + '…';
      return D(`¿Qué fracción irreducible es igual al decimal periódico ${dec}?`, fracTxt(f), [`${n}/10`, `${n}/100`, fracTxt(frac(n + 1, d))], null,
        'Un periódico puro 0,ababab… se escribe como ab/99; si el período tiene 1 cifra, a/9.', `${dec} = ${n}/${d}${fracTxt(f) !== `${n}/${d}` ? ' = ' + fracTxt(f) : ''}.`);
    },
    () => {
      const ab = rnd(10, 98); if (ab % 11 === 0) return null;
      const f = frac(ab, 99), dec = `0,${String(ab).padStart(2, '0').repeat(3)}…`;
      return D(`Escribe como fracción irreducible: ${dec}`, fracTxt(f), [`${ab}/100`, fracTxt(frac(ab, 90)), `${ab}/999`], null,
        'Período de 2 cifras: el período sobre 99.', `${dec} = ${ab}/99${fracTxt(f) !== `${ab}/99` ? ' = ' + fracTxt(f) : ''}.`);
    },
    () => {
      const a = rnd(1, 8), p = rnd(1, 9); if (a === p) return null;
      const f = frac(10 * a + p - a, 90), dec = `0,${a}${String(p).repeat(4)}…`;
      return D(`Escribe como fracción irreducible el decimal semiperiódico ${dec}`, fracTxt(f), [fracTxt(frac(10 * a + p, 99)), fracTxt(frac(10 * a + p, 100)), fracTxt(frac(10 * a + p, 90))].filter((x) => x !== fracTxt(f)), null,
        'Semiperiódico 0,a ppp…: (número completo − parte no periódica) sobre 90.', `(${a}${p} − ${a}) / 90 = ${10 * a + p - a}/90 = ${fracTxt(f)}.`);
    },
    () => {
      const T = pick([[1, 4, 'Decimal finito'], [3, 8, 'Decimal finito'], [7, 20, 'Decimal finito'], [1, 3, 'Periódico puro'], [5, 9, 'Periódico puro'], [2, 11, 'Periódico puro'], [1, 6, 'Semiperiódico'], [5, 12, 'Semiperiódico'], [7, 30, 'Semiperiódico']]);
      return C(`Al escribir ${T[0]}/${T[1]} como decimal, se obtiene un:`, T[2], ['Decimal finito', 'Periódico puro', 'Semiperiódico', 'Número entero'].filter((x) => x !== T[2]),
        'Si el denominador (simplificado) solo tiene factores 2 y 5, es finito; si no tiene 2 ni 5, periódico puro; si tiene ambos tipos, semiperiódico.', `${T[0]}/${T[1]} = ${num(redondear(T[0] / T[1], 6))}… → ${T[2].toLowerCase()}.`);
    },
    () => {
      const dec = pick([0.5, 0.25, 0.75, 0.2, 0.4, 0.6, 0.8, 0.125, 0.375, 1.5, 2.25, 0.05, 0.35]), f = frac(Math.round(dec * 1000), 1000);
      return D(`¿Qué fracción irreducible es igual a ${num(dec)}?`, fracTxt(f), [`${Math.round(dec * 1000)}/1000`.replace(/^(\d+)\/1000$/, (m) => (m === `${f.n}/${f.d}` ? `${f.n}/${f.d * 10}` : m)), fracTxt(frac(f.d, f.n)), fracTxt(frac(f.n + 1, f.d))], null,
        'Escribe el decimal sobre 10, 100 o 1000 y simplifica.', `${num(dec)} = ${Math.round(dec * 1000)}/1000 = ${fracTxt(f)}.`);
    },
  ];

  N8.u1.racionales = [
    () => {
      const [a, b, c, d, e, f] = [rnd(1, 5), rnd(2, 6), rnd(1, 5), rnd(2, 6), rnd(1, 5), rnd(2, 6)];
      const n = a * d * f + b * c * e, den = b * d * f, r = ftxt(n, den);
      return D(`Calcula: ${a}/${b} + ${c}/${d} · ${e}/${f}`, r, [ftxt((a * d + b * c) * e, b * d * f), ftxt(a + c * e, b + d * f), ftxt(n, den + 1)], null,
        'Primero la multiplicación, después la suma.', `${c}/${d} · ${e}/${f} = ${ftxt(c * e, d * f)}; ${a}/${b} + ${ftxt(c * e, d * f)} = ${r}.`);
    },
    () => {
      const [a, b, c, d, e, f] = [rnd(1, 7), rnd(2, 8), rnd(1, 7), rnd(2, 8), rnd(1, 5), rnd(2, 6)];
      const dn = a * d - b * c; if (dn === 0) return null;
      const r = ftxt(dn * f, b * d * e);
      return D(`Calcula: (${a}/${b} − ${c}/${d}) : ${e}/${f}`, r, [ftxt(dn * e, b * d * f), ftxt(-dn * f, b * d * e), ftxt(a - c, (b - d || 1) * e)].filter((x) => x !== r), null,
        'Resuelve el paréntesis y luego divide multiplicando por el inverso.', `${a}/${b} − ${c}/${d} = ${ftxt(dn, b * d)}; · ${f}/${e} = ${r}.`);
    },
    () => {
      const dec = pick([0.5, 0.25, 0.75, 0.2, 1.5]), fd = pick([2, 3, 4, 5]), fn = rnd(1, fd + 2), df = frac(Math.round(dec * 100), 100);
      const r = ftxt(df.n * fd + fn * df.d, df.d * fd);
      return D(`Calcula: ${num(dec)} + ${fn}/${fd}`, r, [ftxt(df.n + fn, df.d + fd), num(redondear(dec + fn + fd, 2)), ftxt(df.n * fn, df.d * fd)], null,
        'Escribe el decimal como fracción y suma con igual denominador.', `${num(dec)} = ${fracTxt(df)}; ${fracTxt(df)} + ${fn}/${fd} = ${r}.`);
    },
    () => {
      const L = rnd(2, 6), a = rnd(1, 3), b = pick([4, 5, 8]); if (a >= b) return null;
      const u = frac(L * a, b), resto = frac(L * b - L * a, b);
      return D(`Tienes ${L} litros de jugo y usas ${a}/${b} de ellos en una receta. ¿Cuántos litros te quedan?`, `${fracTxt(resto)} L`, [`${fracTxt(u)} L`, `${fracTxt(frac(L - a, b))} L`, `${num(L - a)} L`], null,
        `Calcula ${a}/${b} de ${L} y réstalo del total.`, `${a}/${b} · ${L} = ${fracTxt(u)}; ${L} − ${fracTxt(u)} = ${fracTxt(resto)} L.`);
    },
  ];

  N8.u1.potencias = [
    () => {
      const a = pick([2, 3, 5, 10]), m = rnd(2, 6), n = rnd(2, 6), k = rnd(1, Math.min(m + n - 1, 5));
      return D(`Escribe como una sola potencia: (${a}^${m} · ${a}^${n}) : ${a}^${k}`, `${a}^${m + n - k}`, [`${a}^${m * n - k}`, `${a}^${m + n + k}`, `${a}^${Math.round((m * n) / k)}`].filter((x) => x !== `${a}^${m + n - k}`), (j) => `${a}^${m + n - k + j}`,
        'Multiplicación de igual base: se suman exponentes; división: se restan.', `${a}^${m + n} : ${a}^${k} = ${a}^${m + n - k}.`);
    },
    () => {
      const b = pick([2, 3, 4, 5, 10]), e = rnd(1, 3), r = 1 / b ** e, f = frac(1, b ** e);
      void r;
      return D(`Calcula: ${b}^−${e}`, fracTxt(f), [num(-(b ** e)), num(-b * e), String(b ** e)], null,
        'Un exponente negativo invierte la base: a^−n = 1 / a^n.', `${b}^−${e} = 1/${b}^${e} = ${fracTxt(f)}.`);
    },
    () => {
      const s = pick([-1, 1]), b = rnd(2, 5) * s, e = rnd(2, 5), r = b ** e;
      const txt = b < 0 ? `(${num(b)})^${e}` : `${b}^${e}`;
      return D(`Calcula: ${txt}`, num(r), [num(-r), num(b * e), num(Math.abs(b) ** (e - 1) * Math.sign(r))].filter((x) => x !== num(r)), null,
        'Base negativa con exponente par da positivo; con exponente impar, negativo.', `${txt} = ${num(r)}.`);
    },
  ];

  N8.u1.raiz = [
    () => {
      const n = rnd(2, 6) * pick([1, -1]), c = n ** 3;
      return D(`Calcula: ∛${num(c)}`, num(n), [num(-n), num(c / 3), num(n * n)], cerca(n),
        'La raíz cúbica de x es el número que elevado al cubo da x.', `${par(n)}³ = ${num(c)}, entonces ∛${num(c)} = ${num(n)}.`);
    },
    () => {
      const a = rnd(2, 9), b = rnd(2, 9);
      return D(`Calcula: √${a * a} · √${b * b}`, String(a * b), [String(a + b), String(a * a * b * b), String(a * b * 2)], cerca(a * b),
        'Calcula cada raíz y multiplica.', `√${a * a} = ${a} y √${b * b} = ${b}; ${a} · ${b} = ${a * b}.`);
    },
    () => {
      const a = rnd(2, 12), b = rnd(2, 8);
      return D(`Calcula: √(${a * a * b * b} : ${b * b})`, String(a), [String(a * b), String(b), String(a * a)], cerca(a),
        'La raíz de un cociente es el cociente de las raíces (o divide primero).', `${a * a * b * b} : ${b * b} = ${a * a}; √${a * a} = ${a}.`);
    },
    () => {
      const l = rnd(3, 15), V = l ** 3;
      return D(`Una caja cúbica tiene un volumen de ${num(V)} cm³. ¿Cuánto mide su arista?`, `${l} cm`, [`${num(V / 3)} cm`.replace(/,\d+/, ''), `${l * l} cm`, `${l + 1} cm`], null,
        'El volumen del cubo es arista³: usa la raíz cúbica.', `∛${num(V)} = ${l} cm.`);
    },
  ];

  N8.u1.estimacion = [
    () => {
      const n = rnd(2, 14), N = n * n + rnd(1, 2 * n), r = Math.sqrt(N);
      const ap = redondear(r, 1);
      return D(`¿Cuál es la mejor aproximación de √${N} a la décima?`, num(ap), [num(redondear(ap + 0.3, 1)), num(redondear(ap - 0.4, 1)), num(redondear(N / 2, 1))].filter((x) => x !== num(ap)), null,
        `Está entre ${n} y ${n + 1}; prueba elevando al cuadrado números con un decimal.`, `${num(ap)}² ≈ ${num(redondear(ap * ap, 2))}, muy cerca de ${N}.`);
    },
    () => {
      const n = rnd(3, 15), N = n * n + rnd(-n + 1, n), cerc = Math.round(Math.sqrt(N));
      return D(`¿Cuál es el número entero más cercano a √${N}?`, String(cerc), [String(cerc + 1), String(cerc - 1), String(Math.round(N / 2))].filter((x) => x !== String(cerc)), cerca(cerc),
        'Busca el cuadrado perfecto más cercano.', `${cerc}² = ${cerc * cerc} es el cuadrado perfecto más cercano a ${N}.`);
    },
    () => {
      const k = rnd(3, 12), N = k * k + pick([-rnd(1, k), rnd(1, k)]);
      const mayor = Math.sqrt(N) > k ? `√${N}` : String(k);
      return D(`¿Qué número es mayor: √${N} o ${k}?`, mayor, [Math.sqrt(N) > k ? String(k) : `√${N}`, 'Son iguales', 'No se puede saber'], null,
        `Compara ${N} con ${k}² = ${k * k}.`, `${k}² = ${k * k} ${N > k * k ? '<' : '>'} ${N}, así que el mayor es ${mayor}.`);
    },
    () => {
      const a = rnd(10, 60), b = rnd(10, 60), k = rnd(3, 8); if (a === b || a === k * k || b === k * k) return null;
      const vals = [[`√${a}`, Math.sqrt(a)], [`√${b}`, Math.sqrt(b)], [String(k), k]].sort((p, q) => p[1] - q[1]);
      const ok = vals.map((v) => v[0]).join(' < ');
      return D(`Ordena de menor a mayor: √${a} ; ${k} ; √${b}`, ok, [vals.map((v) => v[0]).reverse().join(' < '), [vals[1][0], vals[0][0], vals[2][0]].join(' < '), [vals[0][0], vals[2][0], vals[1][0]].join(' < ')], null,
        'Eleva todo al cuadrado para comparar.', `${vals.map((v) => `${v[0]} ≈ ${num(redondear(v[1], 2))}`).join('; ')}.`);
    },
  ];

  // =====================================================================
  // UNIDAD 2 · ÁLGEBRA Y FUNCIONES
  // =====================================================================
  N8.u2.ecuaciones8 = [
    () => {
      const x = nz(-9, 9), a = nz(-8, 8), c = nz(-8, 8); if (a === c) return null;
      const b = nz(-15, 15), d = (a - c) * x + b;
      return D(`Resuelve: ${lin(a, b)} = ${lin(c, d)}`, `x = ${num(x)}`, [`x = ${num(-x)}`, `x = ${num(x + 1)}`, `x = ${num(x + 2)}`].filter((o) => o !== `x = ${num(x)}`), (k) => `x = ${num(x + k)}`,
        'Agrupa los términos con x a un lado y los números al otro.', `${num(a - c)}x = ${num(d - b)} → x = ${num(x)}.`);
    },
    () => {
      const x = nz(-8, 8), a = rnd(2, 5), c = rnd(2, 5), b = rnd(1, 6); if (a === c) return null;
      const d0 = a * (x - b) / c - x; if (!Number.isInteger(d0)) return null;
      return D(`Resuelve: ${a}(x − ${b}) = ${c}(x ${d0 < 0 ? '−' : '+'} ${Math.abs(d0)})`, `x = ${num(x)}`, [`x = ${num(-x)}`, `x = ${num(x + 2)}`, `x = ${num(b)}`].filter((o) => o !== `x = ${num(x)}`), (k) => `x = ${num(x + k)}`,
        'Desarrolla los paréntesis y luego despeja.', `${a}x − ${a * b} = ${c}x${mas(c * d0)} → ${a - c}x = ${num(c * d0 + a * b)} → x = ${num(x)}.`);
    },
    () => {
      const e = rnd(8, 15), k = rnd(2, 4), dif = rnd(15, 30), padre = e * k; void dif;
      return D(`La edad de un explorador es ${k} veces la de su hija. Si juntos suman ${padre + e} años, ¿cuántos años tiene la hija?`, `${e} años`, [`${padre} años`, `${Math.round((padre + e) / 2)} años`, `${e + k} años`], cerca(e, (v) => `${v} años`),
        `Si la hija tiene x años, el explorador tiene ${k}x: x + ${k}x = ${padre + e}.`, `${k + 1}x = ${padre + e} → x = ${e} años.`);
    },
    () => {
      const n = rnd(5, 40), r = 3 * n + 3;
      return D(`La suma de tres números consecutivos es ${r}. ¿Cuál es el menor?`, String(n), [String(n + 1), String(r / 3), String(n - 1)], cerca(n),
        'Si el menor es x: x + (x + 1) + (x + 2).', `3x + 3 = ${r} → x = ${n}.`);
    },
  ];

  N8.u2.inecuaciones = [
    () => {
      const a = nz(-6, 6), lim = nz(-8, 8), b = nz(-10, 10), c = a * lim + b;
      const sig = pick(['<', '>', '≤', '≥']), inv = { '<': '>', '>': '<', '≤': '≥', '≥': '≤' };
      const s2 = a < 0 ? inv[sig] : sig;
      const sol = `x ${s2} ${num(lim)}`;
      return D(`Resuelve: ${lin(a, b)} ${sig} ${num(c)}`, sol, [`x ${inv[s2]} ${num(lim)}`, `x ${s2} ${num(-lim)}`, `x ${s2} ${num(c - b)}`].filter((o) => o !== sol), null,
        a < 0 ? 'Al dividir por un número negativo, el signo de la desigualdad se invierte.' : 'Despeja x como en una ecuación.', `${num(a)}x ${sig} ${num(c - b)} → x ${s2} ${num(lim)}.`);
    },
    () => {
      const tiene = rnd(20, 80), precio = rnd(3, 9), fijo = rnd(2, 10), max = Math.floor((tiene - fijo) / precio);
      if (max < 1) return null;
      return D(`Tienes ${tiene} monedas. La entrada al oasis cuesta ${fijo} monedas y cada bebida ${precio}. ¿Cuántas bebidas puedes comprar como MÁXIMO?`, String(max), [String(max + 1), String(Math.floor(tiene / precio)), String(max - 1 > 0 ? max - 1 : max + 2)].filter((x) => x !== String(max)), cerca(max),
        `Plantea ${fijo} + ${precio}x ≤ ${tiene}.`, `${precio}x ≤ ${tiene - fijo} → x ≤ ${num(redondear((tiene - fijo) / precio, 2))}; como máximo ${max} bebidas.`);
    },
    () => {
      const a = rnd(2, 5), b = nz(-6, 6), c = rnd(5, 25), lim = (c - b) / a;
      const vals = [Math.floor(lim) + 1, Math.floor(lim), Math.floor(lim) - 2, Math.floor(lim) - 4];
      const ok = vals.find((v) => a * v + b > c);
      return D(`¿Cuál de estos valores cumple la inecuación ${lin(a, b)} > ${c}?`, `x = ${num(ok)}`, vals.filter((v) => v !== ok).map((v) => `x = ${num(v)}`), null,
        'Reemplaza cada valor y comprueba si la desigualdad es verdadera.', `${a}·${par(ok)}${mas(b)} = ${a * ok + b} > ${c}.`);
    },
    () => {
      const v = nz(-9, 9), T = pick([['x > ', `]${num(v)}, +∞[`], ['x ≥ ', `[${num(v)}, +∞[`], ['x < ', `]−∞, ${num(v)}[`], ['x ≤ ', `]−∞, ${num(v)}]`]]);
      return C(`¿Qué intervalo representa la solución ${T[0]}${num(v)}?`, T[1], [`]${num(v)}, +∞[`, `[${num(v)}, +∞[`, `]−∞, ${num(v)}[`, `]−∞, ${num(v)}]`].filter((x) => x !== T[1]),
        'Corchete hacia adentro [ incluye el número; hacia afuera ] lo excluye. El infinito siempre va abierto.', `${T[0]}${num(v)} se escribe ${T[1]}.`);
    },
  ];

  N8.u2.expresiones8 = [
    () => {
      const a = nz(-7, 7), b = nz(-7, 7), c = nz(-7, 7), d = nz(-7, 7), e = nz(-7, 7), f = nz(-7, 7);
      const r = cuad(a + d, b + e, c + f);
      return D(`Reduce: (${cuad(a, b, c)}) + (${cuad(d, e, f)})`, r, [cuad(a - d, b - e, c - f), cuad(a + d, b + e, c - f), cuad(a + d + b + e, 0, c + f)].filter((x) => x !== r), null,
        'Suma los coeficientes de los términos semejantes: x² con x², x con x y números con números.', `x²: ${num(a + d)}; x: ${num(b + e)}; número: ${num(c + f)}.`);
    },
    () => {
      const a = rnd(2, 9), k = rnd(2, 5), b = rnd(1, 9), r = lin(a - k, k * b);
      return D(`Reduce: ${a}x − ${k}(x − ${b})`, r, [lin(a - k, -k * b), lin(a - k, -b), lin(a + k, k * b)].filter((x) => x !== r), null,
        `Multiplica −${k} por cada término del paréntesis (cuidado: −${k} · −${b} = +${k * b}).`, `${a}x − ${k}x + ${k * b} = ${r}.`);
    },
    () => {
      const a = rnd(2, 6), b = rnd(1, 8), c = rnd(1, 5), d = rnd(1, 8);
      const r = lin(a - c, d - b + 2 * d - d);
      return D(`Reduce: ${a}x − [${b} + (${c}x − ${2 * d})] + ${d}`, lin(a - c, -b + 2 * d + d), [lin(a + c, -b - 2 * d + d), lin(a - c, -b - 2 * d + d), lin(a - c, b + 2 * d + d)].filter((x) => x !== lin(a - c, -b + 2 * d + d)), null,
        'Elimina primero el paréntesis interior y después el corchete, cambiando signos donde hay un menos delante.', `${a}x − ${b} − ${c}x + ${2 * d} + ${d} = ${lin(a - c, -b + 3 * d)}.`.replace(r, r));
    },
    () => {
      const a = rnd(2, 7), b = rnd(1, 9), c = rnd(1, 6), d = rnd(1, 9);
      const r = lin(2 * (a + c), 2 * (b + d));
      return D(`Un terreno rectangular mide (${lin(a, b)}) m de largo y (${lin(c, d)}) m de ancho. ¿Qué expresión reducida representa su perímetro?`, r, [lin(a + c, b + d), lin(2 * a + c, 2 * b + d), cuad(a * c, a * d + b * c, b * d)], null,
        'Perímetro = 2·largo + 2·ancho; luego reduce.', `2(${lin(a, b)}) + 2(${lin(c, d)}) = ${r}.`);
    },
  ];

  N8.u2.multexp = [
    () => {
      const a = nz(-6, 6), b = nz(-6, 6), m = rnd(1, 4), n = rnd(1, 3), p = rnd(1, 3), q = rnd(1, 4);
      const t1 = `${a === 1 ? '' : a === -1 ? '−' : num(a)}x${SUP[m]}y${SUP[n]}`, t2 = `${b === 1 ? '' : b === -1 ? '−' : num(b)}x${SUP[p]}y${SUP[q]}`;
      const c = a * b, r = `${c === 1 ? '' : c === -1 ? '−' : num(c)}x${SUP[m + p]}y${SUP[n + q]}`;
      return D(`Multiplica: (${t1}) · (${t2})`, r, [`${num(a + b)}x${SUP[m + p]}y${SUP[n + q]}`, `${num(c)}x${SUP[m * p] || ''}y${SUP[n * q] || ''}`, `${num(-c)}x${SUP[m + p]}y${SUP[n + q]}`].filter((x) => x !== r), null,
        'Multiplica los coeficientes y suma los exponentes de las letras iguales.', `${num(a)}·${par(b)} = ${num(c)}; x: ${m} + ${p} = ${m + p}; y: ${n} + ${q} = ${n + q}.`);
    },
    () => {
      const k = nz(-6, 6), a = nz(-6, 6), b = nz(-9, 9);
      const r = cuad(k * a, k * b, 0);
      return D(`Multiplica: ${k === -1 ? '−' : num(k)}x(${lin(a, b)})`, r, [cuad(k * a, b, 0), cuad(k * a, 0, k * b), cuad(k + a, k * b, 0)].filter((x) => x !== r), null,
        'Multiplica el monomio por cada término del paréntesis.', `${num(k)}x · ${lin(a, 0)} = ${cuad(k * a, 0, 0)}; ${num(k)}x · ${par(b)} = ${cuad(0, k * b, 0)}.`);
    },
    () => {
      const a = rnd(1, 5), b = nz(-9, 9), c = rnd(1, 5), d = nz(-9, 9);
      const r = cuad(a * c, a * d + b * c, b * d);
      return D(`Desarrolla: (${lin(a, b)})(${lin(c, d)})`, r, [cuad(a * c, 0, b * d), cuad(a * c, a * d - b * c, b * d), cuad(a + c, a * d + b * c, b + d)].filter((x) => x !== r), null,
        'Multiplica cada término del primer paréntesis por cada término del segundo y reduce.', `${cuad(a * c, 0, 0)}${mas(a * d)}x${mas(b * c)}x${mas(b * d)} = ${r}.`);
    },
    () => {
      const a = nz(-9, 9), r = cuad(1, 2 * a, a * a);
      return D(`Desarrolla el cuadrado de binomio: (${lin(1, a)})²`, r, [cuad(1, 0, a * a), cuad(1, a, a * a), cuad(1, 2 * a, 2 * a)].filter((x) => x !== r), null,
        '(a + b)² = a² + 2ab + b².', `x² + 2·x·${par(a)} + ${par(a)}² = ${r}.`);
    },
  ];

  N8.u2.funcion = [
    () => {
      const m = nz(-5, 5), n = nz(-9, 9), xs = [0, 1, 2, 3];
      const tabla = xs.map((x) => `x = ${x} → y = ${num(m * x + n)}`).join('; ');
      return D(`Una función tiene esta tabla: ${tabla}. ¿Cuál es su fórmula?`, `f(x) = ${lin(m, n)}`, [`f(x) = ${lin(n, m)}`, `f(x) = ${lin(m, -n)}`, `f(x) = ${lin(m + 1, n - 1)}`], null,
        'Mira cuánto cambia y cada vez que x aumenta en 1, y cuánto vale y cuando x = 0.', `y aumenta ${num(m)} cada vez y vale ${num(n)} en x = 0: f(x) = ${lin(m, n)}.`);
    },
    () => {
      const m = nz(-4, 5), n = nz(-9, 9), a = nz(-5, 5), b = nz(-5, 5); if (a === b) return null;
      const r = m * a + n + m * b + n;
      return D(`Si f(x) = ${lin(m, n)}, ¿cuánto es f(${num(a)}) + f(${num(b)})?`, num(r), [num(m * (a + b) + n), num(m * a + n), num(-r)], cerca(r),
        'Calcula cada imagen por separado y luego súmalas.', `f(${num(a)}) = ${num(m * a + n)}; f(${num(b)}) = ${num(m * b + n)}; suma ${num(r)}.`);
    },
    () => C('En la función f(3) = 10, ¿qué es el número 10?', 'La imagen de 3', ['La preimagen de 3', 'El dominio', 'La pendiente', 'La variable independiente'],
      'En f(x) = y, x es la preimagen y y es la imagen.', 'f(3) = 10: el 10 es la imagen de 3 (y 3 es la preimagen de 10).'),
  ];

  N8.u2.dominio = [
    () => {
      const xs = shuffle([nz(-9, 9), nz(-9, 9), nz(-9, 9), nz(-9, 9)]).filter((v, i, a) => a.indexOf(v) === i); if (xs.length < 4) return null;
      const ys = xs.map(() => rnd(-9, 9)), pares = xs.map((x, i) => pto(x, ys[i])).join(', ');
      const dom = `{${[...xs].sort((p, q) => p - q).map(num).join(', ')}}`, rec = `{${[...new Set(ys)].sort((p, q) => p - q).map(num).join(', ')}}`;
      if (dom === rec) return null;
      return D(`La función f está formada por los pares: ${pares}. ¿Cuál es su dominio?`, dom, [rec, `{${[...xs, ...ys].sort((p, q) => p - q).slice(0, 4).map(num).join(', ')}}`, `{${xs.map((x) => num(-x)).sort().join(', ')}}`].filter((x) => x !== dom), null,
        'El dominio es el conjunto de las primeras componentes (los valores de x).', `Dominio = ${dom}.`);
    },
    () => {
      const m = nz(-4, 4), n = nz(-6, 6), dom = [0, 1, 2, 3].map((x) => x + rnd(-2, 0));
      const d = [...new Set(dom)]; if (d.length < 3) return null;
      const rec = [...new Set(d.map((x) => m * x + n))].sort((p, q) => p - q);
      return D(`Si f(x) = ${lin(m, n)} y su dominio es {${d.map(num).join(', ')}}, ¿cuál es su recorrido?`, `{${rec.map(num).join(', ')}}`, [`{${d.map(num).join(', ')}}`, `{${rec.map((v) => num(v + 1)).join(', ')}}`, `{${rec.map((v) => num(-v)).sort().join(', ')}}`], null,
        'El recorrido son todas las imágenes: calcula f(x) para cada x del dominio.', `Imágenes: ${d.map((x) => `f(${num(x)}) = ${num(m * x + n)}`).join(', ')}.`);
    },
    () => {
      const a = nz(-9, 9);
      return D(`¿Qué número NO pertenece al dominio de f(x) = 1 : (x ${a < 0 ? '+' : '−'} ${Math.abs(a)})?`, num(a), [num(-a), '0', '1'].filter((x) => x !== num(a)), null,
        'No se puede dividir por cero: busca el valor de x que anula el denominador.', `Si x = ${num(a)}, el denominador es 0. Por eso ${num(a)} no está en el dominio.`);
    },
    () => C('¿Qué es el recorrido de una función?', 'El conjunto de todas las imágenes (valores que toma y)', ['El conjunto de valores que puede tomar x', 'La pendiente de la recta', 'El punto donde corta al eje y', 'La cantidad de pares ordenados'],
      'Dominio: valores de x. Recorrido: valores de y.', 'El recorrido es el conjunto de imágenes.'),
    () => {
      const d = [-2, -1, 0, 1, 2], rec = [...new Set(d.map((x) => x * x))].sort((p, q) => p - q);
      return D('Si f(x) = x² y su dominio es {−2, −1, 0, 1, 2}, ¿cuál es su recorrido?', `{${rec.join(', ')}}`, ['{−4, −1, 0, 1, 4}', '{−2, −1, 0, 1, 2}', '{0, 2, 4}'], null,
        'Calcula el cuadrado de cada número y no repitas resultados.', '(−2)² = 4, (−1)² = 1, 0² = 0: recorrido {0, 1, 4}.');
    },
  ];

  N8.u2.lineal = [
    () => {
      const k = nz(-6, 7), x = nz(1, 9);
      return D(`Una función lineal pasa por el punto ${pto(x, k * x)}. ¿Cuál es su constante de proporcionalidad?`, num(k), [num(k * x), ftxt(x, k * x), num(x)].filter((v) => v !== num(k)), cerca(k),
        'En f(x) = kx, k = y : x.', `k = ${num(k * x)} : ${x} = ${num(k)}.`);
    },
    () => {
      const a = rnd(1, 6), k = nz(-5, 6), b = rnd(2, 9);
      return D(`f es una función lineal y f(${a}) = ${num(k * a)}. ¿Cuánto vale f(${b})?`, num(k * b), [num(k * a + b), num(k * b + 1), num(b * a)].filter((v) => v !== num(k * b)), cerca(k * b),
        'Primero encuentra k = f(a) : a.', `k = ${num(k * a)} : ${a} = ${num(k)}; f(${b}) = ${num(k)} · ${b} = ${num(k * b)}.`);
    },
    () => {
      const k = nz(2, 6);
      const ok = [1, 2, 3].map((x) => `(${x}, ${k * x})`).join(' ');
      return C('¿Qué tabla de pares (x, y) corresponde a una función LINEAL?', ok, [[1, 2, 3].map((x) => `(${x}, ${k * x + 1})`).join(' '), [1, 2, 3].map((x) => `(${x}, ${x * x})`).join(' '), [1, 2, 3].map((x) => `(${x}, ${k + x})`).join(' ')],
        'En una función lineal, y : x es siempre el mismo número.', `En ${ok}, y : x = ${k} siempre.`);
    },
    () => C('¿Por qué punto pasa SIEMPRE el gráfico de una función lineal f(x) = kx?', 'Por el origen (0, 0)', ['Por (1, 1)', 'Por (0, 1)', 'Por (1, 0)', 'Por (k, 0)'],
      'Calcula f(0).', 'f(0) = k · 0 = 0: siempre pasa por el origen.'),
  ];

  N8.u2.linealafin = [
    () => {
      const m = nz(-5, 5), n = nz(-9, 9), x1 = rnd(-5, 2), x2 = x1 + rnd(1, 4);
      return D(`Una recta pasa por ${pto(x1, m * x1 + n)} y ${pto(x2, m * x2 + n)}. ¿Cuál es su ecuación?`, `y = ${lin(m, n)}`, [`y = ${lin(m, -n)}`, `y = ${lin(-m, n)}`, `y = ${lin(m, n + m)}`], null,
        'Calcula la pendiente m = (y₂ − y₁) : (x₂ − x₁) y luego n reemplazando un punto.', `m = ${num(m * (x2 - x1))} : ${x2 - x1} = ${num(m)}; n = ${num(m * x1 + n)} − ${par(m)}·${par(x1)} = ${num(n)}.`);
    },
    () => {
      const fijo = rnd(500, 2000), porKm = rnd(100, 600);
      return C(`Un taxi cobra $${num(fijo)} al subir y $${num(porKm)} por cada kilómetro. Si y es el costo y x los kilómetros, ¿qué función lo representa?`, `y = ${num(porKm)}x + ${num(fijo)}`,
        [`y = ${num(fijo)}x + ${num(porKm)}`, `y = ${num(porKm + fijo)}x`, `y = ${num(porKm)}x − ${num(fijo)}`], 'La pendiente es lo que cambia por kilómetro; el coeficiente de posición es el cobro fijo.', `y = ${num(porKm)}x + ${num(fijo)}.`);
    },
    () => {
      const m = nz(-5, 5), n = nz(-9, 9), x = nz(-6, 6), sí = pick([true, false]), y = m * x + n + (sí ? 0 : nz(-3, 3));
      return C(`¿El punto ${pto(x, y)} pertenece a la recta y = ${lin(m, n)}?`, sí ? 'Sí' : 'No', sí ? ['No', 'Solo si x es positivo', 'No se puede saber'] : ['Sí', 'Solo si x es positivo', 'No se puede saber'],
        'Reemplaza x en la ecuación y compara con la y del punto.', `${num(m)}·${par(x)}${mas(n)} = ${num(m * x + n)} ${sí ? '=' : '≠'} ${num(y)}.`);
    },
    () => {
      const m = nz(-5, 5), n = nz(-9, 9), x = nz(-6, 6);
      return D(`Si f(x) = ${lin(m, n)}, ¿cuánto es f(${num(x)})?`, num(m * x + n), [num(m * x - n), num(m + x + n), num(-(m * x) + n)].filter((v) => v !== num(m * x + n)), cerca(m * x + n),
        'Reemplaza x por su valor.', `${num(m)}·${par(x)}${mas(n)} = ${num(m * x + n)}.`);
    },
  ];

  // =====================================================================
  // UNIDAD 3 · GEOMETRÍA
  // =====================================================================
  const TRIOS = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];
  const trio = () => { const t = pick(TRIOS), k = pick(t[2] > 20 ? [1] : [1, 2, 3]); return t.map((v) => v * k); };
  N8.u3.pitagoras = [
    () => {
      const [a, b, c] = trio();
      return D(`Los catetos de un triángulo rectángulo miden ${a} cm y ${b} cm. ¿Cuánto mide la hipotenusa?`, `${c} cm`, [`${a + b} cm`, `${num(redondear(Math.sqrt(Math.abs(b * b - a * a)), 1))} cm`, `${c + 1} cm`].filter((x) => x !== `${c} cm`), cerca(c, (v) => `${v} cm`),
        'c² = a² + b².', `${a}² + ${b}² = ${a * a + b * b}; √${a * a + b * b} = ${c} cm.`);
    },
    () => {
      const [a, b, c] = trio();
      return D(`Un triángulo rectángulo tiene hipotenusa ${c} m y un cateto de ${b} m. ¿Cuánto mide el otro cateto?`, `${a} m`, [`${c - b} m`, `${num(redondear(Math.sqrt(c * c + b * b), 1))} m`, `${a + 2} m`].filter((x) => x !== `${a} m`), cerca(a, (v) => `${v} m`),
        'Cateto² = hipotenusa² − otro cateto².', `${c}² − ${b}² = ${c * c - b * b}; √${c * c - b * b} = ${a} m.`);
    },
    () => {
      const [a, b, c] = trio();
      return C('¿Cuál de estos tríos de números es un trío pitagórico?', `${a}, ${b} y ${c}`, [`${a}, ${b} y ${c + 1}`, `${a + 1}, ${b} y ${c}`, `${a}, ${a} y ${2 * a}`, `${b}, ${c} y ${b + c}`],
        'Un trío pitagórico cumple a² + b² = c².', `${a}² + ${b}² = ${a * a + b * b} = ${c}².`);
    },
    () => {
      const [a, b, c] = trio();
      return D(`Un triángulo rectángulo tiene hipotenusa ${c} cm y un cateto de ${a} cm. ¿Cuál es su área?`, `${num((a * b) / 2)} cm²`, [`${num((a * c) / 2)} cm²`, `${num(a * b)} cm²`, `${num((b * c) / 2)} cm²`], null,
        'Primero calcula el otro cateto con Pitágoras; el área es cateto · cateto : 2.', `Otro cateto: √(${c}² − ${a}²) = ${b}; área = ${a}·${b} : 2 = ${num((a * b) / 2)} cm².`);
    },
  ];

  N8.u3.pitagorasap = [
    () => {
      const [a, b, c] = trio(), x1 = rnd(-5, 3), y1 = rnd(-5, 3), sx = pick([1, -1]), sy = pick([1, -1]);
      return D(`¿Cuál es la distancia entre los puntos ${pto(x1, y1)} y ${pto(x1 + sx * a, y1 + sy * b)}?`, String(c), [String(a + b), String(Math.abs(a - b)), String(c + 2)], cerca(c),
        'Forma un triángulo rectángulo con las diferencias en x y en y.', `Δx = ${a}, Δy = ${b}; √(${a}² + ${b}²) = ${c}.`);
    },
    () => {
      const [a, b, c] = trio();
      return D(`Un volantín está atado a una cuerda de ${c} m. El niño que lo sostiene está a ${a} m horizontalmente del punto que queda justo bajo el volantín. ¿A qué altura vuela (desde la mano del niño)?`, `${b} m`, [`${c - a} m`, `${c + a} m`, `${b + 3} m`], cerca(b, (v) => `${v} m`),
        'La cuerda es la hipotenusa.', `√(${c}² − ${a}²) = √${c * c - a * a} = ${b} m.`);
    },
    () => {
      const [a, b, c] = trio(); const base = 2 * a;
      return D(`Un triángulo isósceles tiene lados iguales de ${c} cm y base de ${base} cm. ¿Cuánto mide su altura?`, `${b} cm`, [`${c} cm`, `${num(redondear(Math.sqrt(c * c + a * a), 1))} cm`, `${c - a} cm`], cerca(b, (v) => `${v} cm`),
        'La altura divide la base por la mitad y forma un triángulo rectángulo.', `√(${c}² − ${a}²) = ${b} cm.`);
    },
    () => {
      const l = rnd(2, 12), d = redondear(l * Math.SQRT2, 1);
      return D(`¿Cuánto mide aproximadamente la diagonal de un cuadrado de lado ${l} cm?`, `${num(d)} cm`, [`${2 * l} cm`, `${num(redondear(l * 1.7, 1))} cm`, `${l * l} cm`], null,
        'La diagonal es la hipotenusa de un triángulo con catetos iguales al lado.', `√(${l}² + ${l}²) = ${l}√2 ≈ ${num(d)} cm.`);
    },
    () => {
      const [a, b, c] = trio();
      return D(`Una rampa sube ${a} m de altura a lo largo de ${b} m horizontales. ¿Cuánto mide la rampa?`, `${c} m`, [`${a + b} m`, `${num(redondear(Math.sqrt(Math.abs(b * b - a * a)), 1))} m`, `${c - 1} m`], cerca(c, (v) => `${v} m`),
        'La rampa es la hipotenusa.', `√(${a}² + ${b}²) = ${c} m.`);
    },
  ];

  N8.u3.transformaciones = [
    () => C('¿Qué tienen en común todas las transformaciones isométricas?', 'Conservan la forma y el tamaño de la figura', ['Agrandan la figura', 'Cambian la forma de la figura', 'Siempre invierten la figura', 'Achican la figura a la mitad'],
      'Iso = igual, métrica = medida.', 'Las isometrías no cambian ni la forma ni el tamaño.'),
    () => {
      const T = pick([['La figura se desliza 5 unidades a la derecha sin girar', 'Traslación'], ['La figura gira 90° en torno a un punto fijo', 'Rotación'], ['La figura se ve como en un espejo respecto de una recta', 'Reflexión'], ['La figura gira 180° alrededor del origen', 'Rotación'], ['Cada punto se mueve según el vector (−2, 3)', 'Traslación'], ['La figura se voltea respecto del eje y', 'Reflexión']]);
      return C(`${T[0]}. ¿Qué transformación es?`, T[1], ['Traslación', 'Rotación', 'Reflexión', 'Homotecia'].filter((x) => x !== T[1]),
        'Traslación: desliza. Rotación: gira. Reflexión: espejo.', `Es una ${T[1].toLowerCase()}.`);
    },
    () => C('¿Cuál de estas transformaciones NO es isométrica?', 'Una ampliación al doble (homotecia)', ['Una traslación', 'Una rotación de 90°', 'Una reflexión respecto del eje x', 'Una rotación de 180°'],
      'Busca la que cambia el tamaño.', 'Una homotecia cambia el tamaño: no es isometría.'),
    () => C('¿Qué transformación invierte la orientación de la figura (como en un espejo)?', 'La reflexión', ['La traslación', 'La rotación', 'Ninguna isometría la invierte', 'Todas la invierten'],
      'Piensa en tu mano derecha frente a un espejo.', 'La reflexión invierte la orientación; traslación y rotación la conservan.'),
    () => {
      const v1 = [nz(-5, 5), nz(-5, 5)], v2 = [nz(-5, 5), nz(-5, 5)];
      return D(`Se aplica a una figura la traslación ${pto(...v1)} y luego la traslación ${pto(...v2)}. ¿Qué única traslación da el mismo resultado?`, pto(v1[0] + v2[0], v1[1] + v2[1]),
        [pto(v1[0] - v2[0], v1[1] - v2[1]), pto(v1[0] * v2[0], v1[1] * v2[1]), pto(v1[1] + v2[1], v1[0] + v2[0])].filter((x) => x !== pto(v1[0] + v2[0], v1[1] + v2[1])), null,
        'Las traslaciones sucesivas se suman.', `${pto(...v1)} + ${pto(...v2)} = ${pto(v1[0] + v2[0], v1[1] + v2[1])}.`);
    },
  ];

  N8.u3.isometrias = [
    () => {
      const x = nz(-9, 9), y = nz(-9, 9);
      return D(`Refleja el punto ${pto(x, y)} respecto del eje x. ¿Qué punto se obtiene?`, pto(x, -y), [pto(-x, y), pto(-x, -y), pto(y, x)], null,
        'Al reflejar respecto del eje x, la abscisa se mantiene y la ordenada cambia de signo.', `${pto(x, y)} → ${pto(x, -y)}.`);
    },
    () => {
      const x = nz(-9, 9), y = nz(-9, 9); if (Math.abs(x) === Math.abs(y)) return null;
      return D(`Rota el punto ${pto(x, y)} en 90° en sentido horario con centro en el origen. ¿Qué punto se obtiene?`, pto(y, -x), [pto(-y, x), pto(-x, -y), pto(x, -y)], null,
        'Una rotación de 90° horaria transforma (x, y) en (y, −x).', `${pto(x, y)} → ${pto(y, -x)}.`);
    },
    () => {
      const x = nz(-9, 9), y = nz(-9, 9), vx = nz(-6, 6), vy = nz(-6, 6);
      return D(`El punto ${pto(x, y)} se trasladó a ${pto(x + vx, y + vy)}. ¿Cuál fue el vector de traslación?`, pto(vx, vy), [pto(-vx, -vy), pto(x + vx, y + vy), pto(vy, vx)], null,
        'Resta las coordenadas: final − inicial.', `${pto(x + vx, y + vy)} − ${pto(x, y)} = ${pto(vx, vy)}.`);
    },
    () => {
      const x = nz(-9, 9), y = nz(-9, 9);
      return D(`Refleja el punto ${pto(x, y)} respecto de la recta y = x. ¿Qué punto se obtiene?`, pto(y, x), [pto(-x, y), pto(x, -y), pto(-y, -x)].filter((p) => p !== pto(y, x)), null,
        'Al reflejar respecto de y = x se intercambian las coordenadas.', `${pto(x, y)} → ${pto(y, x)}.`);
    },
  ];

  N8.u3.volumen = [
    () => {
      const r = rnd(1, 6), h = rnd(2, 15), V = redondear(3.14 * r * r * h, 2);
      return D(`Un estanque cilíndrico tiene radio ${r} m y altura ${h} m. ¿Cuál es su volumen? (π ≈ 3,14)`, `${num(V)} m³`, [`${num(redondear(2 * 3.14 * r * h, 2))} m³`, `${num(redondear(3.14 * r * h, 2))} m³`, `${num(redondear(3.14 * 2 * r * h * r, 2))} m³`].filter((x) => x !== `${num(V)} m³`), null,
        'Volumen del cilindro = π · r² · h.', `3,14 · ${r}² · ${h} = ${num(V)} m³.`);
    },
    () => {
      const r = rnd(1, 8), h = rnd(2, 12), A = redondear(2 * 3.14 * r * r + 2 * 3.14 * r * h, 2);
      return D(`¿Cuál es el área total de un cilindro de radio ${r} cm y altura ${h} cm? (π ≈ 3,14)`, `${num(A)} cm²`, [`${num(redondear(2 * 3.14 * r * h, 2))} cm²`, `${num(redondear(3.14 * r * r * h, 2))} cm²`, `${num(redondear(3.14 * r * r + 2 * 3.14 * r * h, 2))} cm²`], null,
        'Área total = 2 · (área de la base) + área lateral = 2πr² + 2πrh.', `2·3,14·${r}² + 2·3,14·${r}·${h} = ${num(A)} cm².`);
    },
    () => {
      const B = rnd(6, 60), h = rnd(2, 15);
      return D(`Un prisma tiene una base de ${B} cm² de área y ${h} cm de altura. ¿Cuál es su volumen?`, `${B * h} cm³`, [`${B + h} cm³`, `${(B * h) / 2} cm³`.replace('.', ','), `${B * h * 2} cm³`], cerca(B * h, (v) => `${v} cm³`, h),
        'Volumen de un prisma = área de la base · altura.', `${B} · ${h} = ${B * h} cm³.`);
    },
    () => {
      const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9), V = a * b * c;
      return D(`Un acuario mide ${a} dm × ${b} dm × ${c} dm. ¿Cuántos litros de agua le caben? (1 dm³ = 1 L)`, `${V} L`, [`${a + b + c} L`, `${V * 10} L`, `${2 * (a * b + b * c + a * c)} L`], cerca(V, (v) => `${v} L`, 2),
        'Calcula el volumen en dm³: cada dm³ es un litro.', `${a}·${b}·${c} = ${V} dm³ = ${V} L.`);
    },
  ];

  // =====================================================================
  // UNIDAD 4 · ESTADÍSTICA
  // =====================================================================
  const intervalos = () => {
    const ini = pick([0, 10, 20, 30, 40, 50]), amp = pick([5, 10, 20]), f = [rnd(1, 8), rnd(3, 12), rnd(4, 14), rnd(2, 9)];
    return { ini, amp, f, ints: f.map((_, i) => [ini + i * amp, ini + (i + 1) * amp]) };
  };
  const tablaInt = (T, unidad) => T.ints.map(([a, b], i) => `[${a}, ${b}[ ${unidad}: ${T.f[i]}`).join('; ');
  N8.u4.tablas8 = [
    () => {
      const T = intervalos(), i = rnd(0, 3), [a, b] = T.ints[i], mc = (a + b) / 2;
      return D(`¿Cuál es la marca de clase del intervalo [${a}, ${b}[?`, num(mc), [String(b - a), num(a + b), String(b)], cerca(mc, num, T.amp / 2),
        'La marca de clase es el punto medio del intervalo.', `(${a} + ${b}) : 2 = ${num(mc)}.`);
    },
    () => {
      const T = intervalos(), k = rnd(1, 3), F = T.f.slice(0, k + 1).reduce((s, v) => s + v, 0);
      return D(`Puntajes de un juego: ${tablaInt(T, 'puntos')}. ¿Cuál es la frecuencia acumulada del intervalo [${T.ints[k][0]}, ${T.ints[k][1]}[?`, String(F), [String(T.f[k]), String(T.f.reduce((s, v) => s + v, 0)), String(F - T.f[0])], cerca(F),
        'Suma las frecuencias desde el primer intervalo hasta el indicado.', `${T.f.slice(0, k + 1).join(' + ')} = ${F}.`);
    },
    () => {
      const T = intervalos(), N = T.f.reduce((s, v) => s + v, 0), i = rnd(0, 3), pct = redondear((T.f[i] / N) * 100, 1);
      return D(`Tiempos de recorrido: ${tablaInt(T, 'min')}. ¿Qué porcentaje de los datos está en [${T.ints[i][0]}, ${T.ints[i][1]}[? (redondeado a la décima)`, `${num(pct)} %`, [`${T.f[i]} %`, `${num(redondear((T.f[i] / 100) * N, 1))} %`, `${num(redondear(100 - pct, 1))} %`], null,
        'Frecuencia relativa porcentual = f : total · 100.', `Total ${N}; ${T.f[i]} : ${N} · 100 ≈ ${num(pct)} %.`);
    },
    () => {
      const T = intervalos();
      return D(`En una tabla los intervalos son ${T.ints.map(([a, b]) => `[${a}, ${b}[`).join(', ')}. ¿Cuál es la amplitud de cada intervalo?`, String(T.amp), [String(T.amp * 4), String(T.ini + T.amp), num(T.amp / 2)], cerca(T.amp),
        'La amplitud es la diferencia entre el límite superior y el inferior.', `${T.ints[0][1]} − ${T.ints[0][0]} = ${T.amp}.`);
    },
    () => {
      const T = intervalos(), k = rnd(1, 3), menos = T.f.slice(0, k).reduce((s, v) => s + v, 0);
      return D(`Estaturas de un equipo: ${tablaInt(T, 'cm')}. ¿Cuántas personas miden menos de ${T.ints[k][0]} cm?`, String(menos), [String(menos + T.f[k]), String(T.f[k - 1]), String(T.f.reduce((s, v) => s + v, 0) - menos)].filter((x) => x !== String(menos)), cerca(menos),
        'Suma las frecuencias de los intervalos que están por debajo de ese valor.', `${T.f.slice(0, k).join(' + ')} = ${menos}.`);
    },
  ];

  N8.u4.graficos8 = [
    () => C('Para representar datos agrupados en intervalos (por ejemplo, estaturas), el gráfico más adecuado es:', 'Un histograma', ['Un pictograma', 'Un gráfico circular', 'Un diagrama de puntos sin escala', 'Una tabla de doble entrada'],
      'Tiene barras pegadas, una por intervalo.', 'El histograma muestra la frecuencia de cada intervalo con barras contiguas.'),
    () => {
      const N = pick([40, 60, 80, 120, 180, 360]), f = rnd(2, N / 3), g = redondear((f * 360) / N, 1);
      if (!Number.isInteger(g)) return null;
      return D(`En una encuesta a ${N} personas, ${f} prefieren el fútbol. ¿Cuántos grados mide ese sector en un gráfico circular?`, `${g}°`, [`${f}°`, `${num(redondear((f / N) * 100, 1))}°`, `${360 - g}°`], (k) => `${g + 5 * k}°`,
        'Grados = f : total · 360°.', `${f} : ${N} · 360° = ${g}°.`);
    },
    () => C('Un polígono de frecuencias se construye uniendo con segmentos los puntos que tienen como abscisa:', 'La marca de clase de cada intervalo', ['El límite inferior de cada intervalo', 'La frecuencia acumulada', 'El total de datos', 'La amplitud del intervalo'],
      'Se ubica en la mitad de cada barra del histograma.', 'Se usa la marca de clase (punto medio) de cada intervalo.'),
    () => {
      const T = intervalos(), i = T.f.indexOf(Math.max(...T.f));
      if (T.f.filter((v) => v === Math.max(...T.f)).length > 1) return null;
      return D(`Un histograma tiene estas alturas: ${tablaInt(T, '')}. ¿Qué intervalo tiene la barra más alta?`, `[${T.ints[i][0]}, ${T.ints[i][1]}[`, T.ints.filter((_, k) => k !== i).map(([a, b]) => `[${a}, ${b}[`), null,
        'La barra más alta corresponde a la mayor frecuencia.', `[${T.ints[i][0]}, ${T.ints[i][1]}[ tiene frecuencia ${T.f[i]}.`);
    },
    () => {
      const p = pick([10, 15, 20, 25, 30, 35, 40, 45]), N = pick([200, 300, 400, 500, 800]), r = (p * N) / 100;
      return D(`Un gráfico circular muestra que el ${p} % de ${N} turistas viajó en barco. ¿Cuántos turistas son?`, String(r), [String(p), String(N - r), String(r * 2)], cerca(r, String, 5),
        `Calcula el ${p} % de ${N}.`, `${N} · ${p} : 100 = ${r}.`);
    },
  ];

  N8.u4.tendencia8 = [
    () => {
      const vals = [rnd(1, 3), rnd(4, 6), rnd(7, 9), rnd(10, 12)], f = vals.map(() => rnd(1, 6)), N = f.reduce((a, b) => a + b, 0), S = vals.reduce((s, v, i) => s + v * f[i], 0);
      const m = redondear(S / N, 2);
      return D(`Goles por partido: ${vals.map((v, i) => `${v} goles → ${f[i]} ${f[i] === 1 ? 'partido' : 'partidos'}`).join('; ')}. ¿Cuál es el promedio (redondeado a la centésima)?`, num(m), [num(redondear(vals.reduce((a, b) => a + b, 0) / 4, 2)), num(redondear(S / 4, 2)), num(redondear(N / 4, 2))].filter((x) => x !== num(m)), null,
        'Multiplica cada valor por su frecuencia, suma y divide por el total de datos.', `${S} : ${N} ≈ ${num(m)}.`);
    },
    () => {
      const vals = [1, 2, 3, 4, 5], f = vals.map(() => rnd(1, 7)), N = f.reduce((a, b) => a + b, 0);
      const ord = []; vals.forEach((v, i) => { for (let k = 0; k < f[i]; k++) ord.push(v); });
      const med = N % 2 ? ord[(N - 1) / 2] : (ord[N / 2 - 1] + ord[N / 2]) / 2;
      return D(`Hermanos por estudiante: ${vals.map((v, i) => `${v} → ${f[i]} ${f[i] === 1 ? 'estudiante' : 'estudiantes'}`).join('; ')}. ¿Cuál es la mediana?`, num(med), ['1', '2', '3', '4', '5', '2,5', '3,5', '1,5', '4,5'].filter((x) => x !== num(med)).slice(0, 3), null,
        `Hay ${N} datos ordenados: la mediana está en la posición central.`, `Con ${N} datos la mediana es ${num(med)}.`);
    },
    () => {
      const T = intervalos(), i = T.f.indexOf(Math.max(...T.f));
      if (T.f.filter((v) => v === Math.max(...T.f)).length > 1) return null;
      return D(`Tiempos de espera: ${tablaInt(T, 'min')}. ¿Cuál es el intervalo modal?`, `[${T.ints[i][0]}, ${T.ints[i][1]}[`, T.ints.filter((_, k) => k !== i).map(([a, b]) => `[${a}, ${b}[`), null,
        'El intervalo modal es el de mayor frecuencia.', `[${T.ints[i][0]}, ${T.ints[i][1]}[ tiene la mayor frecuencia (${T.f[i]}).`);
    },
    () => {
      const T = intervalos(), N = T.f.reduce((s, v) => s + v, 0), S = T.ints.reduce((s, [a, b], i) => s + ((a + b) / 2) * T.f[i], 0), m = redondear(S / N, 1);
      return D(`Edades agrupadas: ${tablaInt(T, 'años')}. Usando las marcas de clase, ¿cuál es el promedio aproximado (a la décima)?`, num(m), [num(redondear(T.ints.reduce((s, [a, b]) => s + (a + b) / 2, 0) / 4, 1)), num(redondear(S / 4, 1)), num(redondear(m + T.amp / 2, 1))].filter((x) => x !== num(m)), null,
        'Multiplica cada marca de clase por su frecuencia, suma y divide por el total.', `${num(S)} : ${N} ≈ ${num(m)}.`);
    },
    () => {
      const n = rnd(4, 6), datos = Array.from({ length: n }, () => rnd(4, 12)), meta = Math.round(datos.reduce((a, b) => a + b, 0) / n) + rnd(1, 3);
      const falta = meta * (n + 1) - datos.reduce((a, b) => a + b, 0);
      return D(`Tus puntajes son: ${datos.join(', ')}. ¿Cuánto debes sacar en el siguiente juego para que tu promedio sea ${meta}?`, String(falta), [String(meta), String(falta - meta), String(meta * n - datos.reduce((a, b) => a + b, 0))].filter((x) => x !== String(falta)), cerca(falta),
        `Con ${n + 1} juegos la suma debe ser ${meta} · ${n + 1}.`, `${meta}·${n + 1} = ${meta * (n + 1)}; ${meta * (n + 1)} − ${datos.reduce((a, b) => a + b, 0)} = ${falta}.`);
    },
  ];

  const ordenados = (n) => Array.from({ length: n }, () => rnd(1, 50)).sort((a, b) => a - b);
  const medianaL = (l) => { const n = l.length; return n % 2 ? l[(n - 1) / 2] : (l[n / 2 - 1] + l[n / 2]) / 2; };
  N8.u4.posicion = [
    () => C('Si tu puntaje está en el percentil 80, significa que:', 'El 80 % de los puntajes es menor o igual que el tuyo', ['Obtuviste 80 puntos', 'Respondiste bien el 80 % de las preguntas', 'El 80 % de los puntajes es mayor que el tuyo', 'Quedaste en el lugar 80'],
      'Los percentiles dividen los datos ordenados en 100 partes.', 'El percentil 80 deja bajo él al 80 % de los datos.'),
    () => {
      const P = pick([[25, 'El primer cuartil (Q1)'], [50, 'El segundo cuartil (Q2), es decir, la mediana'], [75, 'El tercer cuartil (Q3)']]);
      return C(`¿A qué medida corresponde el percentil ${P[0]}?`, P[1], ['El primer cuartil (Q1)', 'El segundo cuartil (Q2), es decir, la mediana', 'El tercer cuartil (Q3)', 'El promedio', 'La moda'].filter((x) => x !== P[1]),
        'Los cuartiles dividen los datos en 4 partes: 25 %, 50 % y 75 %.', `P${P[0]} = ${P[1]}.`);
    },
    () => {
      const l = ordenados(8), q = pick([1, 3]), mitad = q === 1 ? l.slice(0, 4) : l.slice(4), r = medianaL(mitad);
      return D(`Datos ordenados: ${l.join(', ')}. ¿Cuál es ${q === 1 ? 'el primer cuartil (Q1)' : 'el tercer cuartil (Q3)'}? (mediana de la mitad ${q === 1 ? 'inferior' : 'superior'})`, num(r),
        [num(medianaL(l)), num(medianaL(q === 1 ? l.slice(4) : l.slice(0, 4))), num(q === 1 ? l[1] : l[6])].filter((x) => x !== num(r)), cerca(r, num, 0.5),
        'Separa los datos en dos mitades y busca la mediana de la mitad que corresponde.', `Mitad ${q === 1 ? 'inferior' : 'superior'}: ${mitad.join(', ')}; su mediana es ${num(r)}.`);
    },
    () => {
      const n = pick([20, 40, 100, 200]), p = pick([10, 25, 30, 50, 75, 90]), r = (n * p) / 100;
      return D(`En un grupo de ${n} estudiantes, ¿aproximadamente cuántos tienen una estatura menor o igual que el percentil ${p}?`, String(r), [String(p), String(n - r), String(r / 2)], cerca(r, String, 2),
        `El percentil ${p} deja bajo él al ${p} % de los datos.`, `${p} % de ${n} = ${r}.`);
    },
  ];

  N8.u4.cajon = [
    () => C('En un diagrama de cajón, ¿qué porcentaje de los datos queda dentro de la caja (entre Q1 y Q3)?', 'El 50 %', ['El 25 %', 'El 75 %', 'El 100 %', 'El 10 %'],
      'La caja va del primer al tercer cuartil.', 'Entre Q1 (25 %) y Q3 (75 %) está el 50 % central.'),
    () => {
      const q = pick([['por debajo de Q1', 'El 25 %'], ['por encima de Q3', 'El 25 %'], ['por debajo de la mediana', 'El 50 %'], ['por debajo de Q3', 'El 75 %']]);
      return C(`En un diagrama de cajón, ¿qué porcentaje de los datos está ${q[0]}?`, q[1], ['El 25 %', 'El 50 %', 'El 75 %', 'El 100 %'].filter((x) => x !== q[1]),
        'Cada parte del diagrama (bigote, media caja, media caja, bigote) tiene el 25 % de los datos.', `${q[1]} de los datos.`);
    },
    () => {
      const l = ordenados(7);
      return D(`Datos: ${shuffle([...l]).join(', ')}. ¿Cuál es la mediana que se marca en la caja?`, num(l[3]), [num(l[1]), num(l[5]), num(redondear(l.reduce((a, b) => a + b, 0) / 7, 1))].filter((x) => x !== num(l[3])), cerca(l[3]),
        'Ordena los datos y toma el del centro.', `Ordenados: ${l.join(', ')}; mediana ${l[3]}.`);
    },
    () => {
      const A = [rnd(10, 20), rnd(21, 30)], B = [rnd(10, 25), rnd(26, 45)];
      const ra = A[1] - A[0], rb = B[1] - B[0]; if (ra === rb) return null;
      const mayor = ra > rb ? 'El grupo A' : 'El grupo B';
      return C(`En dos diagramas de cajón: grupo A tiene Q1 = ${A[0]} y Q3 = ${A[1]}; grupo B tiene Q1 = ${B[0]} y Q3 = ${B[1]}. ¿Qué grupo tiene datos centrales más dispersos?`, mayor, [ra > rb ? 'El grupo B' : 'El grupo A', 'Ambos igual', 'No se puede saber'],
        'Compara el rango intercuartil (Q3 − Q1): la caja más larga es más dispersa.', `RIC A = ${ra}; RIC B = ${rb}. ${mayor} es más disperso.`);
    },
    () => {
      const l = ordenados(9);
      return D(`Con los datos ${l.join(', ')}, ¿qué valores tienen los extremos (bigotes) del diagrama de cajón?`, `${l[0]} y ${l[8]}`, [`${l[1]} y ${l[7]}`, `${num(medianaL(l.slice(0, 4)))} y ${num(medianaL(l.slice(5)))}`, `0 y ${l[8]}`].filter((x) => x !== `${l[0]} y ${l[8]}`), null,
        'Los bigotes llegan hasta el mínimo y el máximo (si no hay datos atípicos).', `Mínimo ${l[0]} y máximo ${l[8]}.`);
    },
  ];

  P.N8 = N8;
})(typeof window !== 'undefined' ? window : globalThis);
