// Math World — generador de desafíos matemáticos.
// Cada tema produce problemas nuevos cada vez (números al azar), así no se pueden memorizar.
// Formato de cada desafío:
//   { tema, titulo, enunciado, opciones: [texto x4], correcta: índice, pista, explicacion }
// En los textos: "a/b" se dibuja como fracción y "x^n" como potencia (ver juego.js).
(function (global) {
  'use strict';

  // ---------- utilidades ----------
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; };
  const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  const redondear = (x, d = 4) => Math.round(x * 10 ** d) / 10 ** d;

  // Números al estilo chileno: coma decimal, punto de miles, signo menos tipográfico.
  function num(x) {
    x = redondear(x, 4);
    const neg = x < 0;
    const [ent, dec] = Math.abs(x).toString().split('.');
    const miles = ent.length > 4 ? ent.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ent;
    return (neg ? '−' : '') + miles + (dec ? ',' + dec : '');
  }
  // Número entre paréntesis si es negativo: 5 + (−3)
  const par = (x) => (x < 0 ? '(' + num(x) + ')' : num(x));

  function frac(n, d) {
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
  }
  function fracTxt(f) {
    if (f.d === 1) return num(f.n);
    return (f.n < 0 ? '−' : '') + Math.abs(f.n) + '/' + f.d;
  }

  // Arma las 4 alternativas: la correcta + distractores distintos entre sí.
  function opciones(correcta, distractores, relleno) {
    const set = [correcta];
    for (const d of distractores) if (d != null && !set.includes(d)) set.push(d);
    let k = 1;
    while (set.length < 4 && k < 50) {
      const extra = relleno(k++);
      if (extra != null && !set.includes(extra)) set.push(extra);
    }
    const lista = shuffle(set.slice(0, 4));
    return { opciones: lista, correcta: lista.indexOf(correcta) };
  }
  // Relleno numérico genérico: valores cercanos al correcto
  const cerca = (v, fmt = num, paso = 1) => (k) => fmt(v + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * paso);

  function desafio(tema, titulo, enunciado, corr, distr, relleno, pista, explicacion) {
    const o = opciones(corr, distr, relleno);
    return { tema, titulo, enunciado, opciones: o.opciones, correcta: o.correcta, pista, explicacion };
  }

  // =====================================================================
  // 7° BÁSICO · UNIDAD 1 · NÚMEROS
  // =====================================================================
  const T7 = {
    enteros: {
      titulo: 'Números enteros: adición y sustracción',
      gen(dif) {
        const v = pick(dif === 1 ? [1, 3] : [1, 2, 3]);
        if (v === 1) {
          const t0 = rnd(dif === 1 ? 2 : -6, 12), b = rnd(dif === 1 ? 3 : 6, dif === 3 ? 22 : 14);
          const r = t0 - b;
          return desafio('enteros', this.titulo,
            `Al anochecer, el termómetro de tu campamento marca ${num(t0)} °C. Durante la noche la temperatura baja ${b} °C. ¿Qué temperatura marca al amanecer?`,
            num(r) + ' °C', [num(t0 + b) + ' °C', num(b - t0) + ' °C', num(-(t0 + b)) + ' °C'],
            cerca(r, (x) => num(x) + ' °C'),
            `Bajar ${b} grados es restar: ${num(t0)} − ${b}. Puedes contar hacia abajo en la recta numérica.`,
            `${num(t0)} − ${b} = ${num(r)}. La temperatura al amanecer es ${num(r)} °C.`);
        }
        if (v === 2) {
          const p = rnd(3, dif === 3 ? 18 : 9), h = rnd(4, dif === 3 ? 25 : 12);
          return desafio('enteros', this.titulo,
            `El fondo del lago está a ${num(-p)} m (bajo el nivel del sendero) y la copa de un pino está a ${h} m sobre el sendero. ¿Cuántos metros hay desde el fondo del lago hasta la copa?`,
            num(h + p) + ' m', [num(h - p) + ' m', num(p - h) + ' m', num(-(h + p)) + ' m'],
            cerca(h + p, (x) => num(x) + ' m'),
            `La diferencia se calcula restando: ${h} − (${num(-p)}). Restar un negativo es sumar.`,
            `${h} − (${num(-p)}) = ${h} + ${p} = ${h + p} m.`);
        }
        // operación directa
        const lim = dif === 1 ? 10 : dif === 2 ? 25 : 40;
        const a = rnd(-lim, lim) || 3, b = rnd(-lim, lim) || -4;
        const resta = Math.random() < 0.5;
        const r = resta ? a - b : a + b;
        const op = resta ? '−' : '+';
        return desafio('enteros', this.titulo,
          `Calcula: ${num(a)} ${op} ${par(b)}`,
          num(r), [num(resta ? a + b : a - b), num(-r), num(Math.abs(a) + Math.abs(b))],
          cerca(r),
          resta ? 'Restar un número es lo mismo que sumar su opuesto.' : 'Si los signos son distintos, resta los valores absolutos y conserva el signo del mayor.',
          resta ? `${num(a)} − ${par(b)} = ${num(a)} + ${par(-b)} = ${num(r)}` : `${num(a)} + ${par(b)} = ${num(r)}`);
      },
    },

    fracdec: {
      titulo: 'Multiplicación y división de fracciones y decimales',
      gen(dif) {
        const v = pick(dif === 1 ? [3, 1] : [1, 2, 3, 4]);
        if (v === 1) {
          const b = pick([3, 4, 5, 6]), d = pick([2, 3, 4, 5].filter((x) => x !== b));
          const a = rnd(1, b - 1), c = rnd(1, d - 1);
          const r = frac(a * c, b * d);
          return desafio('fracdec', this.titulo,
            `Cada tronco pesa ${a}/${b} kg. ¿Cuánto pesan ${c}/${d} de un tronco?`,
            fracTxt(r) + ' kg',
            [fracTxt(frac(a + c, b + d)) + ' kg', fracTxt(frac(a * d, b * c)) + ' kg', fracTxt(frac(a + c, b * d)) + ' kg'],
            (k) => fracTxt(frac(r.n + k, r.d + 1)) + ' kg',
            `"${c}/${d} de" significa multiplicar: ${a}/${b} · ${c}/${d}. Multiplica numeradores entre sí y denominadores entre sí.`,
            `${a}/${b} · ${c}/${d} = ${a * c}/${b * d}` + (r.d !== b * d ? ` = ${fracTxt(r)}` : '') + ' kg.');
        }
        if (v === 2) {
          const d = pick([6, 8, 10, 12]);
          const bs = [2, 3, 4, 5, 6].filter((x) => d % x === 0 && x < d);
          const b = pick(bs); let a = rnd(1, b - 1); while (gcd(a, b) !== 1) a = rnd(1, b - 1);
          const r = a * (d / b);
          return desafio('fracdec', this.titulo,
            `Tienes ${a}/${b} de un saco de piedras y llenas bolsitas de 1/${d} de saco. ¿Cuántas bolsitas llenas?`,
            num(r), [fracTxt(frac(a, b * d)), num(r + d), num(Math.max(1, d - a))],
            cerca(r),
            `Hay que dividir: ${a}/${b} : 1/${d}. Dividir por una fracción es multiplicar por su inverso.`,
            `${a}/${b} : 1/${d} = ${a}/${b} · ${d}/1 = ${a * d}/${b} = ${r} bolsitas.`);
        }
        if (v === 3) {
          const x = pick(dif === 1 ? [2, 4, 6, 10] : [2.5, 1.5, 3.2, 4.8, 1.2]), y = pick(dif === 1 ? [0.5] : [0.5, 0.4, 0.25, 0.3]);
          const r = redondear(x * y);
          return desafio('fracdec', this.titulo,
            `Tu balde tiene ${num(x)} L de agua. ¿Cuántos litros hay en ${num(y)} del balde?`,
            num(r) + ' L', [num(redondear(x + y)) + ' L', num(redondear(x / y)) + ' L', num(redondear(r * 10)) + ' L'],
            (k) => num(redondear(r + k * 0.1)) + ' L',
            `"${num(y)} del balde" significa multiplicar ${num(x)} · ${num(y)}. Multiplica sin la coma y después ubícala.`,
            `${num(x)} · ${num(y)} = ${num(r)} L.`);
        }
        const y = pick([0.2, 0.5, 0.25, 1.5]), k = rnd(3, dif === 3 ? 12 : 8);
        const x = redondear(y * k);
        return desafio('fracdec', this.titulo,
          `Repartes ${num(x)} kg de cristales en bolsas de ${num(y)} kg cada una. ¿Cuántas bolsas llenas?`,
          num(k), [num(redondear(x * y)), num(k * 10), num(k + 1)],
          cerca(k),
          `Divide ${num(x)} : ${num(y)}. Puedes multiplicar ambos números por 10 o 100 para quitar las comas.`,
          `${num(x)} : ${num(y)} = ${k} bolsas.`);
      },
    },

    porcentajes: {
      titulo: 'Porcentajes',
      gen(dif) {
        const v = pick([1, 2, 3]);
        const ps = dif === 1 ? [10, 25, 50] : dif === 2 ? [10, 20, 25, 50, 75] : [15, 30, 40, 35, 60];
        const p = pick(ps);
        if (v === 1) {
          const N = 20 * rnd(1, dif === 3 ? 10 : 5);
          const desc = (p * N) / 100, r = N - desc;
          const item = pick(['un hacha nueva', 'una carpa', 'un balde', 'una mochila']);
          return desafio('porcentajes', this.titulo,
            `El mercader del bosque vende ${item} a ${N} de madera, pero hoy tiene un ${p} % de descuento. ¿Cuánta madera pagas?`,
            num(r), [num(desc), num(N - p), num(N + desc)],
            cerca(r),
            `Calcula primero el ${p} % de ${N} y réstalo al precio.`,
            `${p} % de ${N} = ${num(desc)}. Pagas ${N} − ${num(desc)} = ${num(r)} de madera.`);
        }
        if (v === 2) {
          const total = pick([20, 40, 50, 80, 200]);
          const parte = (p * total) / 100;
          if (!Number.isInteger(parte)) return this.gen(dif);
          return desafio('porcentajes', this.titulo,
            `De los ${total} árboles de esta zona, ${parte} son manzanos. ¿Qué porcentaje de los árboles son manzanos?`,
            p + ' %', [parte + ' %', redondear((total / parte)) + ' %', (100 - p) + ' %'],
            (k) => (p + 5 * k) + ' %',
            `Divide la parte por el total y multiplica por 100: ${parte} : ${total} · 100.`,
            `${parte} : ${total} = ${num(parte / total)}, y ${num(parte / total)} · 100 = ${p} %.`);
        }
        const N = pick([40, 60, 80, 120, 200, 300]);
        const r = (p * N) / 100;
        return desafio('porcentajes', this.titulo,
          `En tu cofre guardas ${N} piedras. Usarás el ${p} % para construir. ¿Cuántas piedras usarás?`,
          num(r), [num(N - r), num(p), num(redondear(N / p))],
          cerca(r),
          `El ${p} % es ${p}/100. Multiplica ${N} · ${p} y divide por 100.`,
          `${N} · ${p} : 100 = ${num(r)} piedras.`);
      },
    },

    potencias10: {
      titulo: 'Potencias de base 10',
      gen(dif) {
        const v = pick(dif === 1 ? [3, 1] : [1, 2, 3]);
        if (v === 1) {
          const a = pick([3.4, 2.5, 7.1, 1.25, 4.06]), n = rnd(dif === 1 ? 2 : 3, 5);
          const r = redondear(a * 10 ** n);
          return desafio('potencias10', this.titulo,
            `Un explorador anotó que en el bosque hay ${num(a)} · 10^${n} hojas caídas. ¿Qué número es ese?`,
            num(r), [num(redondear(a * 10 ** (n - 1))), num(redondear(a * 10 ** (n + 1))), num(redondear(a * 10 * n))],
            (k) => num(redondear(r + k * 10)),
            `Multiplicar por 10^${n} corre la coma ${n} lugares a la derecha.`,
            `${num(a)} · 10^${n} = ${num(r)}.`);
        }
        if (v === 2) {
          const a = pick([4.5, 3.2, 6.7, 1.8, 2.05]), n = rnd(3, 6);
          const N = redondear(a * 10 ** n);
          return desafio('potencias10', this.titulo,
            `En la zona hay ${num(N)} hormigas. ¿Cómo se escribe ese número con una potencia de 10?`,
            `${num(a)} · 10^${n}`, [`${num(a)} · 10^${n - 1}`, `${num(a)} · 10^${n + 1}`, `${num(a * 10)} · 10^${n + 1}`],
            (k) => `${num(a)} · 10^${n + k + 1}`,
            `Cuenta cuántos lugares debes mover la coma para que quede un solo dígito antes de ella.`,
            `${num(N)} = ${num(a)} · 10^${n}, porque la coma se movió ${n} lugares.`);
        }
        const n = rnd(2, dif === 3 ? 8 : 5);
        return desafio('potencias10', this.titulo,
          `¿Qué número es 10^${n}?`,
          num(10 ** n), [num(10 * n), num(10 ** (n - 1)), num(10 ** (n + 1))],
          (k) => num(10 ** n + k),
          `10^${n} es multiplicar 10 por sí mismo ${n} veces: un 1 seguido de ${n} ceros.`,
          `10^${n} = ${num(10 ** n)}.`);
      },
    },
  };

  // =====================================================================
  // 8° BÁSICO · UNIDAD 1 · NÚMEROS
  // =====================================================================
  const T8 = {
    multdiv: {
      titulo: 'Multiplicación y división de números enteros',
      gen(dif) {
        const v = pick([1, 2, 3]);
        if (v === 1) {
          const lim = dif === 1 ? 9 : 15;
          let a = rnd(2, lim), b = rnd(2, lim);
          const sa = pick([-1, 1]), sb = sa === 1 ? -1 : pick([-1, 1]);
          a *= sa; b *= sb;
          if (dif === 3) {
            const c = rnd(2, 5) * pick([-1, 1]);
            const r = a * b * c;
            return desafio('multdiv', this.titulo, `Calcula: ${par(a)} · ${par(b)} · ${par(c)}`,
              num(r), [num(-r), num(a * b + c), num(Math.abs(a) + Math.abs(b) + Math.abs(c))], cerca(r),
              'Cuenta los factores negativos: si son pares el resultado es positivo; si son impares, negativo.',
              `${par(a)} · ${par(b)} = ${num(a * b)}; luego ${num(a * b)} · ${par(c)} = ${num(r)}.`);
          }
          const r = a * b;
          return desafio('multdiv', this.titulo, `Calcula: ${par(a)} · ${par(b)}`,
            num(r), [num(-r), num(a + b), num(a - b)], cerca(r),
            'Signos iguales dan positivo; signos distintos dan negativo.',
            `${par(a)} · ${par(b)} = ${num(r)}.`);
        }
        if (v === 2) {
          const q = rnd(2, dif === 1 ? 9 : 14) * pick([-1, 1]), d = rnd(2, 9) * pick([-1, 1]);
          const D = q * d;
          return desafio('multdiv', this.titulo, `Calcula: ${par(D)} : ${par(d)}`,
            num(q), [num(-q), num(D - d), num(D * d)], cerca(q),
            'En la división la regla de signos es la misma que en la multiplicación.',
            `${par(D)} : ${par(d)} = ${num(q)}.`);
        }
        const baja = rnd(2, 6), noches = rnd(3, 9);
        return desafio('multdiv', this.titulo,
          `Cada noche la temperatura del bosque cambia ${num(-baja)} °C. ¿Cuál es el cambio total después de ${noches} noches?`,
          num(-baja * noches) + ' °C', [num(baja * noches) + ' °C', num(-baja - noches) + ' °C', num(-baja + noches) + ' °C'],
          cerca(-baja * noches, (x) => num(x) + ' °C'),
          `Repetir ${noches} veces un cambio de ${num(-baja)} es multiplicar: ${noches} · ${par(-baja)}.`,
          `${noches} · ${par(-baja)} = ${num(-baja * noches)} °C.`);
      },
    },

    racionales: {
      titulo: 'Operaciones con números racionales',
      gen(dif) {
        const v = pick([1, 2, 3]);
        if (v === 1) {
          const b = pick([2, 3, 4]), d = pick([4, 6, 8].filter((x) => x % b === 0 || dif > 1));
          const a = -rnd(1, b - 1), c = rnd(1, d - 1);
          const r = frac(a * d + c * b, b * d);
          return desafio('racionales', this.titulo, `Calcula: ${fracTxt(frac(a, b))} + ${c}/${d}`,
            fracTxt(r), [fracTxt(frac(a + c, b + d)), fracTxt(frac(-a * d + c * b, b * d)), fracTxt(frac(a * d - c * b, b * d))],
            (k) => fracTxt(frac(r.n + k, r.d)),
            'Busca un denominador común, transforma ambas fracciones y luego suma los numeradores con su signo.',
            `Con denominador común ${b * d}: ${num(a * d)}/${b * d} + ${c * b}/${b * d} = ${num(a * d + c * b)}/${b * d}` + (r.d !== b * d ? ` = ${fracTxt(r)}.` : '.'));
        }
        if (v === 2) {
          const x = -pick([0.5, 1.5, 2.5, 0.2]), y = pick([1.2, 0.4, 3, 2.5]);
          const r = redondear(x * y);
          return desafio('racionales', this.titulo, `Calcula: ${par(x)} · ${num(y)}`,
            num(r), [num(-r), num(redondear(x + y)), num(redondear(r * 10))],
            (k) => num(redondear(r + k * 0.1)),
            'Multiplica como si no hubiera coma, ubica la coma al final y aplica la regla de signos.',
            `${par(x)} · ${num(y)} = ${num(r)}.`);
        }
        const t0 = -pick([2.5, 1.75, 3.5, 0.5]), s = pick([3.75, 2.5, 4.25, 1.5]);
        const r = redondear(t0 + s);
        return desafio('racionales', this.titulo,
          `En la mañana, el hielo del lago está a ${num(t0)} °C y al mediodía su temperatura sube ${num(s)} °C. ¿A qué temperatura queda?`,
          num(r) + ' °C', [num(redondear(t0 - s)) + ' °C', num(redondear(-t0 + s)) + ' °C', num(-r) + ' °C'],
          (k) => num(redondear(r + k * 0.25)) + ' °C',
          `Subir es sumar: ${num(t0)} + ${num(s)}. Como los signos son distintos, resta y conserva el signo del mayor.`,
          `${num(t0)} + ${num(s)} = ${num(r)} °C.`);
      },
    },

    potencias: {
      titulo: 'Potencias',
      gen(dif) {
        const v = pick([1, 2, 3]);
        if (v === 1) {
          const a = pick([2, 3, 5, 7]), m = rnd(2, 6), n = rnd(2, 6);
          return desafio('potencias', this.titulo, `Escribe como una sola potencia: ${a}^${m} · ${a}^${n}`,
            `${a}^${m + n}`, [`${a}^${m * n}`, `${a * a}^${m + n}`, `${a}^${Math.abs(m - n) || 1}`],
            (k) => `${a}^${m + n + k}`,
            'Al multiplicar potencias de igual base, se conserva la base y se suman los exponentes.',
            `Se suman los exponentes: ${m} + ${n} = ${m + n}. Entonces ${a}^${m} · ${a}^${n} = ${a}^${m + n}.`);
        }
        if (v === 2) {
          const a = rnd(2, dif === 1 ? 3 : 5), n = pick([2, 3, 4]);
          const r = (-a) ** n;
          return desafio('potencias', this.titulo, `Calcula: (−${a})^${n}`,
            num(r), [num(-r), num(-a * n), num(a * n)], cerca(r),
            'Una base negativa con exponente par da un resultado positivo; con exponente impar, negativo.',
            `(−${a})^${n} = ${Array(n).fill('(−' + a + ')').join(' · ')} = ${num(r)}.`);
        }
        const a = pick([2, 3, 10]), m = rnd(5, 9), n = rnd(2, m - 1);
        return desafio('potencias', this.titulo, `Escribe como una sola potencia: ${a}^${m} : ${a}^${n}`,
          `${a}^${m - n}`, [`${a}^${m + n}`, `1^${m - n}`, `${a}^${Math.round(m / n)}`],
          (k) => `${a}^${m - n + k}`,
          'Al dividir potencias de igual base, se conserva la base y se restan los exponentes.',
          `${a}^${m} : ${a}^${n} = ${a}^${m - n}.`);
      },
    },

    raiz: {
      titulo: 'Raíz cuadrada',
      gen(dif) {
        const v = pick(dif === 1 ? [1, 2] : [1, 2, 3]);
        if (v === 1) {
          const n = rnd(dif === 1 ? 2 : 6, dif === 1 ? 10 : 20);
          return desafio('raiz', this.titulo, `Calcula: √${n * n}`,
            num(n), [num((n * n) / 2), num(n * n), num(n + 1)], cerca(n),
            `Busca el número que multiplicado por sí mismo da ${n * n}.`,
            `${n} · ${n} = ${n * n}, entonces √${n * n} = ${n}.`);
        }
        if (v === 2) {
          const l = rnd(4, dif === 3 ? 25 : 15);
          return desafio('raiz', this.titulo,
            `Quieres construir un corral cuadrado de ${l * l} m² de área. ¿Cuánto debe medir cada lado?`,
            l + ' m', [(l * l) / 4 + ' m', l * 2 + ' m', (l + 2) + ' m'], (k) => (l + k) + ' m',
            'El área de un cuadrado es lado · lado. Busca la raíz cuadrada del área.',
            `√${l * l} = ${l}, porque ${l} · ${l} = ${l * l}. Cada lado mide ${l} m.`);
        }
        const n = rnd(3, 12), N = n * n + rnd(1, 2 * n);
        return desafio('raiz', this.titulo, `¿Entre qué números enteros consecutivos está √${N}?`,
          `${n} y ${n + 1}`, [`${n - 1} y ${n}`, `${n + 1} y ${n + 2}`, `${Math.floor(N / 2)} y ${Math.floor(N / 2) + 1}`],
          (k) => `${n + k + 1} y ${n + k + 2}`,
          `Busca los cuadrados perfectos más cercanos a ${N}.`,
          `${n}² = ${n * n} y ${n + 1}² = ${(n + 1) * (n + 1)}. Como ${N} está entre ellos, √${N} está entre ${n} y ${n + 1}.`);
      },
    },

    variacion: {
      titulo: 'Variaciones porcentuales',
      gen(dif) {
        const v = pick([1, 2, 3]);
        const p = pick(dif === 1 ? [10, 20, 50] : [5, 15, 20, 25, 30, 40]);
        if (v === 1) {
          const P = 20 * rnd(2, 10), r = P * (1 + p / 100);
          return desafio('variacion', this.titulo,
            `Una carpa costaba ${P} de madera y el mercader subió su precio un ${p} %. ¿Cuál es el nuevo precio?`,
            num(r), [num(P + p), num((P * p) / 100), num(P * (1 - p / 100))], cerca(r, num, 2),
            `Calcula el ${p} % de ${P} y súmalo, o multiplica directamente por ${num(1 + p / 100)}.`,
            `${P} · ${num(1 + p / 100)} = ${num(r)} de madera.`);
        }
        if (v === 2) {
          const A = pick([20, 40, 50, 80, 200]), r = (A * p) / 100;
          if (!Number.isInteger(r)) return this.gen(dif);
          const B = A + r;
          return desafio('variacion', this.titulo,
            `Tu cofre tenía ${A} piedras y ahora tiene ${B}. ¿En qué porcentaje aumentaron?`,
            p + ' %', [r + ' %', num(redondear((r / B) * 100, 1)) + ' %', (100 + p) + ' %'], (k) => (p + 5 * k) + ' %',
            `Divide el aumento (${r}) por la cantidad inicial (${A}) y multiplica por 100.`,
            `${r} : ${A} = ${num(r / A)} → ${p} %.`);
        }
        const P = 20 * rnd(2, 10), r = P * (1 - p / 100);
        return desafio('variacion', this.titulo,
          `En invierno los manzanos producen un ${p} % menos. Si en verano diste ${P} manzanas, ¿cuántas esperas en invierno?`,
          num(r), [num(P - p), num((P * p) / 100), num(P * (1 + p / 100))], cerca(r, num, 2),
          `Una baja del ${p} % deja el ${100 - p} % de la cantidad: multiplica por ${num(1 - p / 100)}.`,
          `${P} · ${num(1 - p / 100)} = ${num(r)} manzanas.`);
      },
    },
  };

  const BANCO = { '7basico': { u1: T7 }, '8basico': { u1: T8 } };

  // Elige un tema: los temas con menor porcentaje de acierto aparecen más seguido.
  function nuevo(curso, unidad, dif, stats) {
    const temas = BANCO[curso] && BANCO[curso][unidad];
    if (!temas) return null;
    const claves = Object.keys(temas);
    const pesos = claves.map((k) => {
      const s = (stats && stats[k]) || { a: 0, i: 0 };
      const acierto = s.i ? s.a / s.i : 0.5;
      return 0.4 + (1 - acierto) + (s.i < 3 ? 0.5 : 0);
    });
    let x = Math.random() * pesos.reduce((a, b) => a + b, 0);
    let k = claves[claves.length - 1];
    for (let i = 0; i < claves.length; i++) { x -= pesos[i]; if (x <= 0) { k = claves[i]; break; } }
    for (let intento = 0; intento < 20; intento++) {
      const d = temas[k].gen(Math.max(1, Math.min(3, dif)));
      if (d && new Set(d.opciones).size === 4 && d.correcta >= 0) return d;
    }
    return temas[k].gen(1);
  }

  const titulos = (curso, unidad) => {
    const t = BANCO[curso] && BANCO[curso][unidad];
    return t ? Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v.titulo])) : {};
  };

  const api = { nuevo, titulos, BANCO, _num: num };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.Preguntas = api;
})(typeof window !== 'undefined' ? window : globalThis);
