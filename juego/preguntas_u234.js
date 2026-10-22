// Math World — desafíos de las unidades 2, 3 y 4 (7° y 8° básico).
// Se agregan al banco de preguntas.js. Mismo formato de desafío.
(function (global) {
  'use strict';
  const P = global.Preguntas || (typeof module !== 'undefined' ? require('./preguntas.js') : null);
  const { rnd, pick, num, par, frac, fracTxt, cerca, desafio, redondear } = P.h;

  // ax + b escrito bonito: 2x + 5, x − 3, −x + 4, 3x
  function lineal(a, b, v = 'x') {
    let t = a === 1 ? v : a === -1 ? '−' + v : a === 0 ? '' : num(a) + v;
    if (b === 0) return t || '0';
    if (!t) return num(b);
    return t + (b > 0 ? ' + ' : ' − ') + Math.abs(b);
  }
  const PI = 3.14;
  const punto = (x, y) => `(${num(x)}, ${num(y)})`;

  // =====================================================================
  // 7° BÁSICO
  // =====================================================================
  const U2_7 = {
    lenguaje: {
      titulo: 'Lenguaje algebraico',
      gen() {
        const a = rnd(2, 5), b = rnd(1, 9);
        const v = pick([1, 2, 3]);
        if (v === 1) return desafio('lenguaje', this.titulo,
          `En las Cumbres, un guía dice: "${['el doble', 'el triple', 'el cuádruple', 'el quíntuple'][a - 2]} de un número, aumentado en ${b}". ¿Cómo se escribe con lenguaje algebraico?`,
          lineal(a, b), [`${a}(x + ${b})`, lineal(1, a + b), lineal(a, -b)], (k) => lineal(a + k, b),
          'Primero multiplica el número (x) y después suma.', `"${['El doble', 'El triple', 'El cuádruple', 'El quíntuple'][a - 2]} de un número" es ${a}x; aumentado en ${b} queda ${lineal(a, b)}.`);
        if (v === 2) return desafio('lenguaje', this.titulo,
          `Tienes x piedras y regalas ${b}. Después juntas ${a} veces lo que te quedó. ¿Qué expresión representa lo que tienes?`,
          `${a}(x − ${b})`, [lineal(a, -b), `${a}x + ${b}`, `x − ${a * b + 1}`], (k) => `${a + k}(x − ${b})`,
          'Lo que te queda va entre paréntesis y luego se multiplica.', `Te quedan x − ${b} piedras, y ${a} veces eso es ${a}(x − ${b}).`);
        return desafio('lenguaje', this.titulo,
          `¿Qué significa la expresión ${lineal(1, -b)}?`,
          `Un número disminuido en ${b}`, [`${b} disminuido en un número`, `Un número aumentado en ${b}`, `${b} veces un número`],
          (k) => `Un número dividido en ${b + k}`,
          'El signo menos después de x indica que al número se le quita algo.', `x − ${b} es un número al que se le restan ${b}.`);
      },
    },
    expresiones7: {
      titulo: 'Expresiones algebraicas',
      gen(dif) {
        if (Math.random() < 0.5) {
          const a = rnd(2, 6), b = rnd(-9, 9) || 2, x = rnd(dif === 1 ? 1 : -4, 6);
          const r = a * x + b;
          return desafio('expresiones7', this.titulo, `Valora la expresión ${lineal(a, b)} cuando x = ${num(x)}.`,
            num(r), [num(a + x + b), num(a * (x + b)), num(-r)], cerca(r),
            `Reemplaza x por ${num(x)}: ${a} · ${par(x)} ${b < 0 ? '−' : '+'} ${Math.abs(b)}.`, `${a} · ${par(x)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${num(a * x)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${num(r)}.`);
        }
        const a = rnd(2, 7), b = rnd(1, 6), c = rnd(1, a + b - 1);
        const r = a + b - c;
        return desafio('expresiones7', this.titulo, `Reduce: ${a}x + ${b}x − ${c}x`,
          lineal(r, 0), [lineal(a + b + c, 0), `${r}x³`, lineal(a * b - c, 0)], (k) => lineal(r + k, 0),
          'Son términos semejantes: suma y resta solo los coeficientes.', `${a} + ${b} − ${c} = ${r}, entonces queda ${lineal(r, 0)}.`);
      },
    },
    proporcion: {
      titulo: 'Proporcionalidad directa e inversa',
      gen() {
        if (Math.random() < 0.55) {
          const u = rnd(2, 6), p = rnd(2, 5) * 2, n = rnd(u + 1, u + 6);
          const r = (p / u) * n;
          if (!Number.isInteger(r)) return this.gen();
          return desafio('proporcion', this.titulo, `Si ${u} antorchas cuestan ${p} de madera, ¿cuánto cuestan ${n} antorchas?`,
            num(r), [num(p + (n - u)), num((p * u) / n), num(p * n)], cerca(r),
            'Es proporcionalidad directa: si hay más antorchas, cuestan más en la misma razón.', `Cada antorcha cuesta ${num(p / u)}; ${n} · ${num(p / u)} = ${num(r)}.`);
        }
        const t = pick([2, 3, 4, 6]), d = pick([6, 8, 12]), t2 = pick([2, 3, 4, 6, 8, 12].filter((x) => x !== t && (t * d) % x === 0));
        const r = (t * d) / t2;
        return desafio('proporcion', this.titulo, `${t} constructores levantan un muro en ${d} días. ¿Cuántos días demoran ${t2} constructores trabajando al mismo ritmo?`,
          num(r), [num((d * t2) / t), num(d + t - t2), num(d)], cerca(r),
          'Es proporcionalidad inversa: más constructores demoran menos. El producto constructores · días se mantiene.', `${t} · ${d} = ${t * d}, y ${t * d} : ${t2} = ${num(r)} días.`);
      },
    },
    ecuaciones7: {
      titulo: 'Ecuaciones e inecuaciones',
      gen(dif) {
        const v = pick(dif === 1 ? [1, 2] : [1, 2, 3]);
        const x = rnd(-5, 12) || 3;
        if (v === 1) {
          const b = rnd(2, 15);
          return desafio('ecuaciones7', this.titulo, `Resuelve: x + ${b} = ${num(x + b)}`,
            `x = ${num(x)}`, [`x = ${num(x + 2 * b)}`, `x = ${num(-x)}`, `x = ${num(x + b)}`], (k) => `x = ${num(x + k)}`,
            `Resta ${b} a ambos lados para dejar x sola.`, `x = ${num(x + b)} − ${b} = ${num(x)}.`);
        }
        if (v === 2) {
          const a = rnd(2, 6), b = rnd(-9, 9) || 4;
          const c = a * x + b;
          return desafio('ecuaciones7', this.titulo, `Resuelve: ${lineal(a, b)} = ${num(c)}`,
            `x = ${num(x)}`, [`x = ${num(redondear((c + b) / a, 2))}`, `x = ${num(c - b - a)}`, `x = ${num(-x)}`], (k) => `x = ${num(x + k)}`,
            `Primero despeja el término con x (${b > 0 ? 'resta' : 'suma'} ${Math.abs(b)}) y luego divide por ${a}.`, `${a}x = ${num(c - b)}, entonces x = ${num(c - b)} : ${a} = ${num(x)}.`);
        }
        const b = rnd(2, 9), c = rnd(b + 1, b + 12);
        return desafio('ecuaciones7', this.titulo, `¿Qué valores cumplen la inecuación x + ${b} > ${c}?`,
          `x > ${c - b}`, [`x < ${c - b}`, `x > ${c + b}`, `x = ${c - b}`], (k) => `x > ${c - b + k}`,
          `Resuelve como una ecuación: resta ${b} a ambos lados y mantén el signo >.`, `x > ${c} − ${b}, es decir, x > ${c - b}.`);
      },
    },
  };

  const U3_7 = {
    angulos: {
      titulo: 'Ángulos en polígonos',
      gen() {
        if (Math.random() < 0.5) {
          const a = rnd(30, 90), b = rnd(20, 150 - a);
          const r = 180 - a - b;
          return desafio('angulos', this.titulo, `Un triángulo tiene dos ángulos de ${a}° y ${b}°. ¿Cuánto mide el tercer ángulo?`,
            r + '°', [(360 - a - b) + '°', (a + b) + '°', (90 - Math.abs(a - b)) + '°'], (k) => (r + k * 5) + '°',
            'Los ángulos interiores de un triángulo suman 180°.', `180° − ${a}° − ${b}° = ${r}°.`);
        }
        const n = pick([4, 5, 6, 8, 10]);
        const nombre = { 4: 'cuadrilátero', 5: 'pentágono', 6: 'hexágono', 8: 'octágono', 10: 'decágono' }[n];
        const r = (n - 2) * 180;
        return desafio('angulos', this.titulo, `El jardín de tu base tiene forma de ${nombre}. ¿Cuánto suman sus ángulos interiores?`,
          r + '°', [n * 180 + '°', '360°', (n - 1) * 180 + '°'], (k) => (r + k * 90) + '°',
          'Un polígono de n lados se divide en (n − 2) triángulos desde un vértice.', `(${n} − 2) · 180° = ${r}°.`);
      },
    },
    circulo: {
      titulo: 'El círculo: perímetro y área',
      gen() {
        const r = rnd(1, 10);
        if (Math.random() < 0.5) {
          const res = redondear(2 * PI * r, 2);
          return desafio('circulo', this.titulo, `Una fogata circular tiene radio ${r} m. Usando π ≈ 3,14, ¿cuál es su perímetro?`,
            num(res) + ' m', [num(redondear(PI * r * r, 2)) + ' m', num(redondear(PI * r, 2)) + ' m', num(redondear(2 * PI + r, 2)) + ' m'], (k) => num(redondear(res + k, 2)) + ' m',
            'El perímetro de un círculo es 2 · π · r.', `2 · 3,14 · ${r} = ${num(res)} m.`);
        }
        const res = redondear(PI * r * r, 2);
        return desafio('circulo', this.titulo, `Un huerto circular tiene radio ${r} m. Usando π ≈ 3,14, ¿cuál es su área?`,
          num(res) + ' m²', [num(redondear(2 * PI * r, 2)) + ' m²', num(redondear(PI * 2 * r, 2) + 1) + ' m²', num(redondear(PI * r * r * 2, 2)) + ' m²'], (k) => num(redondear(res + k, 2)) + ' m²',
          'El área de un círculo es π · r · r.', `3,14 · ${r} · ${r} = ${num(res)} m².`);
      },
    },
    areas: {
      titulo: 'Área de triángulos, paralelogramos y trapecios',
      gen() {
        const v = pick([1, 2, 3]);
        if (v === 1) {
          const b = rnd(2, 12) * 2, h = rnd(2, 12);
          return desafio('areas', this.titulo, `Una bandera triangular tiene base ${b} cm y altura ${h} cm. ¿Cuál es su área?`,
            num((b * h) / 2) + ' cm²', [num(b * h) + ' cm²', num(b + h) + ' cm²', num(2 * (b + h)) + ' cm²'], (k) => num((b * h) / 2 + k) + ' cm²',
            'El área del triángulo es base · altura : 2.', `${b} · ${h} : 2 = ${num((b * h) / 2)} cm².`);
        }
        if (v === 2) {
          const b = rnd(3, 15), h = rnd(2, 10);
          return desafio('areas', this.titulo, `Un paralelogramo de piedra tiene base ${b} m y altura ${h} m. ¿Cuál es su área?`,
            num(b * h) + ' m²', [num((b * h) / 2) + ' m²', num(2 * (b + h)) + ' m²', num(b + h) + ' m²'], (k) => num(b * h + k) + ' m²',
            'El área del paralelogramo es base · altura.', `${b} · ${h} = ${num(b * h)} m².`);
        }
        const B = rnd(6, 14), b = rnd(2, B - 2), h = rnd(2, 8) * 2;
        const r = ((B + b) * h) / 2;
        return desafio('areas', this.titulo, `Un trapecio tiene bases ${B} m y ${b} m, y altura ${h} m. ¿Cuál es su área?`,
          num(r) + ' m²', [num((B + b) * h) + ' m²', num(B * b * h) + ' m²', num(B * h) + ' m²'], (k) => num(r + k) + ' m²',
          'Área del trapecio = (base mayor + base menor) · altura : 2.', `(${B} + ${b}) · ${h} : 2 = ${num(r)} m².`);
      },
    },
    cartesiano: {
      titulo: 'Plano cartesiano',
      gen() {
        const x = rnd(-6, 6), y = rnd(-6, 6), dx = rnd(-5, 5) || 3, dy = rnd(-5, 5) || -2;
        if (Math.random() < 0.6) {
          const mov = `${Math.abs(dx)} ${Math.abs(dx) === 1 ? 'casilla' : 'casillas'} a la ${dx > 0 ? 'derecha' : 'izquierda'} y ${Math.abs(dy)} ${dy > 0 ? 'hacia arriba' : 'hacia abajo'}`;
          return desafio('cartesiano', this.titulo, `Estás en el punto ${punto(x, y)} y te mueves ${mov}. ¿En qué punto quedas?`,
            punto(x + dx, y + dy), [punto(x + dy, y + dx), punto(x - dx, y - dy), punto(x + dx, y - dy)], (k) => punto(x + dx + k, y + dy),
            'Moverse a la derecha o izquierda cambia la primera coordenada (x); arriba o abajo cambia la segunda (y).', `x: ${num(x)} ${dx > 0 ? '+' : '−'} ${Math.abs(dx)} = ${num(x + dx)}; y: ${num(y)} ${dy > 0 ? '+' : '−'} ${Math.abs(dy)} = ${num(y + dy)}.`);
        }
        const px = rnd(1, 8) * pick([-1, 1]), py = rnd(1, 8) * pick([-1, 1]);
        const q = px > 0 ? (py > 0 ? 'Primer' : 'Cuarto') : (py > 0 ? 'Segundo' : 'Tercer');
        return desafio('cartesiano', this.titulo, `¿En qué cuadrante está el punto ${punto(px, py)}?`,
          q + ' cuadrante', ['Primer cuadrante', 'Segundo cuadrante', 'Tercer cuadrante', 'Cuarto cuadrante'].filter((c) => !c.startsWith(q)), null,
          'Primer cuadrante: (+, +). Segundo: (−, +). Tercero: (−, −). Cuarto: (+, −).', `x es ${px > 0 ? 'positivo' : 'negativo'} e y es ${py > 0 ? 'positivo' : 'negativo'}: ${q.toLowerCase()} cuadrante.`);
      },
    },
  };

  function datos(n, min, max) { const a = []; for (let i = 0; i < n; i++) a.push(rnd(min, max)); return a; }
  const lista = (a) => a.map(num).join(', ');

  const U4_7 = {
    tendencia: {
      titulo: 'Medidas de tendencia central y rango',
      gen() {
        const v = pick([1, 2, 3, 4]);
        if (v === 1) {
          let a = datos(5, 2, 12);
          const s = a.reduce((x, y) => x + y, 0);
          if (s % 5) a[0] += 5 - (s % 5);
          const m = a.reduce((x, y) => x + y, 0) / 5;
          return desafio('tendencia', this.titulo, `En 5 días recolectaste estas maderas: ${lista(a)}. ¿Cuál es el promedio (media)?`,
            num(m), [num(Math.max(...a) - Math.min(...a)), num(a.reduce((x, y) => x + y, 0)), num(m + 1)], cerca(m),
            'Suma todos los datos y divide por la cantidad de datos.', `(${a.join(' + ')}) : 5 = ${a.reduce((x, y) => x + y, 0)} : 5 = ${num(m)}.`);
        }
        if (v === 2) {
          const a = datos(7, 1, 20), o = [...a].sort((x, y) => x - y);
          return desafio('tendencia', this.titulo, `¿Cuál es la mediana de estos datos? ${lista(a)}`,
            num(o[3]), [num(a[3]), num(redondear(a.reduce((x, y) => x + y, 0) / 7, 1)), num(o[6] - o[0])], cerca(o[3]),
            'Ordena los datos de menor a mayor y busca el que queda al centro.', `Ordenados: ${lista(o)}. El del centro es ${num(o[3])}.`);
        }
        if (v === 3) {
          const m = rnd(3, 9);
          const a = [m, m, m, ...datos(4, 1, 12).map((x) => (x === m ? x + 1 : x))];
          const cuenta = (x) => a.filter((y) => y === x).length;
          if (a.some((x) => x !== m && cuenta(x) >= 3)) return this.gen();
          const mez = a.sort(() => Math.random() - 0.5);
          return desafio('tendencia', this.titulo, `¿Cuál es la moda de estos datos? ${lista(mez)}`,
            num(m), [num(Math.max(...a)), num(mez[0] === m ? mez[1] : mez[0]), num(a.length)], cerca(m),
            'La moda es el dato que más se repite.', `${num(m)} aparece 3 veces, más que cualquier otro dato.`);
        }
        const a = datos(6, 1, 30), r = Math.max(...a) - Math.min(...a);
        return desafio('tendencia', this.titulo, `¿Cuál es el rango de estos datos? ${lista(a)}`,
          num(r), [num(Math.max(...a)), num(Math.max(...a) + Math.min(...a)), num(a.length)], cerca(r),
          'El rango es el dato mayor menos el dato menor.', `${Math.max(...a)} − ${Math.min(...a)} = ${r}.`);
      },
    },
    probabilidad7: {
      titulo: 'Probabilidad',
      gen() {
        const r = rnd(2, 6), v = rnd(2, 6), a = rnd(2, 6), t = r + v + a;
        const col = pick([['rojas', r], ['verdes', v], ['azules', a]]);
        const f = frac(col[1], t);
        return desafio('probabilidad7', this.titulo, `Un cofre tiene ${r} gemas rojas, ${v} verdes y ${a} azules. Si sacas una sin mirar, ¿cuál es la probabilidad de que sea ${col[0].slice(0, -1)}?`,
          fracTxt(f), [fracTxt(frac(col[1], t - col[1])), `${col[1]}/${3}`, fracTxt(frac(t - col[1], t))], (k) => fracTxt(frac(col[1] + k, t + k)),
          'Probabilidad = casos favorables : casos totales.', `Hay ${col[1]} gemas ${col[0]} de ${t} en total: ${col[1]}/${t}${f.d !== t ? ' = ' + fracTxt(f) : ''}.`);
      },
    },
    tablas: {
      titulo: 'Tablas y gráficos',
      gen() {
        const total = pick([20, 25, 40, 50]), n = pick([5, 10, 4, 2].filter((x) => total % x === 0 && x < total));
        const p = (n / total) * 100;
        const cosa = pick(['eligieron el pino', 'eligieron el manzano', 'prefieren picar rocas', 'prefieren pescar']);
        return desafio('tablas', this.titulo, `En una encuesta a ${total} exploradores, ${n} ${cosa}. ¿Cuál es la frecuencia relativa en porcentaje?`,
          num(p) + ' %', [n + ' %', num(redondear(total / n, 2)) + ' %', num(100 - p) + ' %'], (k) => num(p + k * 5) + ' %',
          'Frecuencia relativa = frecuencia : total. Para porcentaje, multiplica por 100.', `${n} : ${total} = ${num(n / total)} → ${num(p)} %.`);
      },
    },
  };

  // =====================================================================
  // 8° BÁSICO
  // =====================================================================
  const U2_8 = {
    expresiones8: {
      titulo: 'Expresiones algebraicas',
      gen() {
        if (Math.random() < 0.5) {
          const a = rnd(2, 6), b = rnd(1, 9) * pick([-1, 1]);
          return desafio('expresiones8', this.titulo, `Multiplica: ${a}(x ${b < 0 ? '−' : '+'} ${Math.abs(b)})`,
            lineal(a, a * b), [lineal(a, b), lineal(a + 1, a * b), lineal(a, -a * b)], (k) => lineal(a, a * b + k),
            'Multiplica el número de afuera por cada término del paréntesis.', `${a} · x = ${a}x y ${a} · ${par(b)} = ${num(a * b)}: ${lineal(a, a * b)}.`);
        }
        const a = rnd(2, 7), b = rnd(1, 9), c = rnd(1, 5), d = rnd(1, 9);
        return desafio('expresiones8', this.titulo, `Reduce: ${a}x + ${b} − ${c}x + ${d}`,
          lineal(a - c, b + d), [lineal(a + c, b + d), lineal(a - c, b - d), lineal(a - c + b + d, 0)], (k) => lineal(a - c, b + d + k),
          'Junta los términos con x por un lado y los números por otro.', `${a}x − ${c}x = ${lineal(a - c, 0)} y ${b} + ${d} = ${b + d}.`);
      },
    },
    funcion: {
      titulo: 'Concepto de función',
      gen() {
        const a = rnd(2, 5), b = rnd(-6, 8) || 1, x = rnd(-3, 6);
        const r = a * x + b;
        return desafio('funcion', this.titulo, `La función f(x) = ${lineal(a, b)} calcula cuántas gemas produce una mina. ¿Cuánto es f(${num(x)})?`,
          num(r), [num(a + x + b), num(a * (x + b)), num(r + a)], cerca(r),
          `Reemplaza x por ${num(x)} en la fórmula.`, `f(${num(x)}) = ${a} · ${par(x)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${num(r)}.`);
      },
    },
    ecuaciones8: {
      titulo: 'Ecuaciones e inecuaciones lineales',
      gen() {
        if (Math.random() < 0.55) {
          const x = rnd(-6, 10), a = rnd(3, 7), c = rnd(1, a - 1), b = rnd(-8, 8);
          const d = (a - c) * x + b;
          return desafio('ecuaciones8', this.titulo, `Resuelve: ${lineal(a, b)} = ${lineal(c, d)}`,
            `x = ${num(x)}`, [`x = ${num(-x)}`, `x = ${num(redondear((d + b) / (a + c), 2))}`, `x = ${num(x + 2)}`], (k) => `x = ${num(x + k)}`,
            'Deja los términos con x a un lado y los números al otro.', `${lineal(a, 0)} − ${lineal(c, 0)} = ${num(d)} − ${par(b)} → ${lineal(a - c, 0)} = ${num(d - b)} → x = ${num(x)}.`);
        }
        const a = rnd(2, 6), r = rnd(-5, 5) || 2, c = -a * r;
        return desafio('ecuaciones8', this.titulo, `Resuelve la inecuación: −${a}x < ${num(c)}`,
          `x > ${num(r)}`, [`x < ${num(r)}`, `x > ${num(-r)}`, `x < ${num(-r)}`], (k) => `x > ${num(r + k)}`,
          'Al dividir por un número negativo, el signo de la desigualdad se da vuelta.', `Divide por −${a}: x > ${num(c)} : (−${a}) = ${num(r)}.`);
      },
    },
    linealafin: {
      titulo: 'Función lineal y función afín',
      gen() {
        const v = pick([1, 2]);
        const m = rnd(-5, 5) || 2, n = rnd(-8, 8) || 3;
        if (v === 1) return desafio('linealafin', this.titulo, `¿Cuál es la pendiente de la recta y = ${lineal(m, n)}?`,
          num(m), [num(n), num(-m), num(m + n)], cerca(m),
          'En y = mx + n, la pendiente es el número que acompaña a x.', `La pendiente es m = ${num(m)}.`);
        return desafio('linealafin', this.titulo, '¿Cuál de estas funciones es lineal (pasa por el origen)?',
          `y = ${lineal(m, 0)}`, [`y = ${lineal(m, n)}`, `y = ${lineal(1, Math.abs(n) || 1)}`, `y = ${num(n || 4)}`], (k) => `y = ${lineal(m + k, k + 2)}`,
          'Una función lineal es de la forma y = mx, sin número sumado.', `y = ${lineal(m, 0)} no tiene término independiente, por eso pasa por (0, 0).`);
      },
    },
  };

  const U3_8 = {
    volumen: {
      titulo: 'Área y volumen de prismas y cilindros',
      gen() {
        const v = pick([1, 2, 3]);
        if (v === 1) {
          const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9);
          return desafio('volumen', this.titulo, `Un cofre tiene forma de prisma de ${a} cm × ${b} cm × ${c} cm. ¿Cuál es su volumen?`,
            num(a * b * c) + ' cm³', [num(a + b + c) + ' cm³', num(2 * (a * b + b * c + a * c)) + ' cm³', num(a * b) + ' cm³'], (k) => num(a * b * c + k * 2) + ' cm³',
            'El volumen del prisma rectangular es largo · ancho · alto.', `${a} · ${b} · ${c} = ${num(a * b * c)} cm³.`);
        }
        if (v === 2) {
          const r = rnd(1, 5), h = rnd(2, 10), res = redondear(PI * r * r * h, 2);
          return desafio('volumen', this.titulo, `Un pozo cilíndrico tiene radio ${r} m y altura ${h} m. Con π ≈ 3,14, ¿cuál es su volumen?`,
            num(res) + ' m³', [num(redondear(2 * PI * r * h, 2)) + ' m³', num(redondear(PI * r * h, 2)) + ' m³', num(redondear(PI * r * r, 2)) + ' m³'], (k) => num(redondear(res + k, 2)) + ' m³',
            'Volumen del cilindro = área de la base (π · r · r) · altura.', `3,14 · ${r} · ${r} · ${h} = ${num(res)} m³.`);
        }
        const a = rnd(2, 9);
        return desafio('volumen', this.titulo, `Una caja cúbica tiene arista ${a} cm. ¿Cuál es el área de toda su superficie?`,
          num(6 * a * a) + ' cm²', [num(a * a * a) + ' cm²', num(4 * a * a) + ' cm²', num(6 * a) + ' cm²'], (k) => num(6 * a * a + k * 6) + ' cm²',
          'Un cubo tiene 6 caras cuadradas iguales.', `6 · ${a} · ${a} = ${num(6 * a * a)} cm².`);
      },
    },
    pitagoras: {
      titulo: 'Teorema de Pitágoras',
      gen() {
        const [p, q, r] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20]]);
        if (Math.random() < 0.5) return desafio('pitagoras', this.titulo, `Una escalera se apoya en un muro: su pie está a ${p} m del muro y llega a ${q} m de altura. ¿Cuánto mide la escalera?`,
          r + ' m', [(p + q) + ' m', (q - p) + ' m', num(redondear(Math.sqrt(q * q - p * p), 1)) + ' m'], (k) => (r + k) + ' m',
          'La escalera es la hipotenusa: c² = a² + b².', `${p}² + ${q}² = ${p * p} + ${q * q} = ${r * r}, y √${r * r} = ${r} m.`);
        return desafio('pitagoras', this.titulo, `Un triángulo rectángulo tiene hipotenusa ${r} cm y un cateto de ${p} cm. ¿Cuánto mide el otro cateto?`,
          q + ' cm', [(r - p) + ' cm', (r + p) + ' cm', num(redondear(Math.sqrt(r * r + p * p), 1)) + ' cm'], (k) => (q + k) + ' cm',
          'Despeja: cateto² = hipotenusa² − cateto².', `${r}² − ${p}² = ${r * r} − ${p * p} = ${q * q}, y √${q * q} = ${q} cm.`);
      },
    },
    isometrias: {
      titulo: 'Transformaciones isométricas',
      gen() {
        const x = rnd(-6, 6) || 2, y = rnd(-6, 6) || -3;
        const v = pick([1, 2, 3]);
        if (v === 1) {
          const a = rnd(-5, 5) || 4, b = rnd(-5, 5) || -1;
          return desafio('isometrias', this.titulo, `Trasladas el punto ${punto(x, y)} según el vector (${num(a)}, ${num(b)}). ¿Dónde queda?`,
            punto(x + a, y + b), [punto(x - a, y - b), punto(x + b, y + a), punto(x * a, y * b)], (k) => punto(x + a + k, y + b),
            'En una traslación se suma el vector a las coordenadas del punto.', `(${num(x)} + ${par(a)}, ${num(y)} + ${par(b)}) = ${punto(x + a, y + b)}.`);
        }
        if (v === 2) {
          const eje = pick(['x', 'y']);
          const r = eje === 'x' ? punto(x, -y) : punto(-x, y);
          return desafio('isometrias', this.titulo, `Reflejas el punto ${punto(x, y)} respecto del eje ${eje}. ¿Cuál es el punto reflejado?`,
            r, [eje === 'x' ? punto(-x, y) : punto(x, -y), punto(-x, -y), punto(y, x)], (k) => punto(x + k, y + k),
            `Al reflejar respecto del eje ${eje}, cambia de signo la coordenada ${eje === 'x' ? 'y' : 'x'}.`, `El reflejo de ${punto(x, y)} respecto del eje ${eje} es ${r}.`);
        }
        return desafio('isometrias', this.titulo, `Rotas el punto ${punto(x, y)} en 180° con centro en el origen. ¿Dónde queda?`,
          punto(-x, -y), [punto(-y, x), punto(x, -y), punto(-x, y)], (k) => punto(-x + k, -y),
          'Una rotación de 180° en torno al origen cambia el signo de ambas coordenadas.', `${punto(x, y)} → ${punto(-x, -y)}.`);
      },
    },
  };

  const U4_8 = {
    posicion: {
      titulo: 'Medidas de posición',
      gen() {
        const a = datos(8, 1, 40);
        const o = [...a].sort((x, y) => x - y);
        const q1 = (o[1] + o[2]) / 2, q3 = (o[5] + o[6]) / 2;
        if (Math.random() < 0.5) return desafio('posicion', this.titulo, `Ordena y calcula el primer cuartil (Q1) usando la mediana de la mitad inferior: ${lista(a)}`,
          num(q1), [num(o[1]), num((o[3] + o[4]) / 2), num(q3)], (k) => num(q1 + k),
          'Q1 es la mediana de los 4 datos más pequeños.', `Ordenados: ${lista(o)}. Mitad inferior: ${lista(o.slice(0, 4))}, su mediana es (${o[1]} + ${o[2]}) : 2 = ${num(q1)}.`);
        return desafio('posicion', this.titulo, `Ordena y calcula el tercer cuartil (Q3) usando la mediana de la mitad superior: ${lista(a)}`,
          num(q3), [num(o[6]), num((o[3] + o[4]) / 2), num(q1)], (k) => num(q3 + k),
          'Q3 es la mediana de los 4 datos más grandes.', `Ordenados: ${lista(o)}. Mitad superior: ${lista(o.slice(4))}, su mediana es (${o[5]} + ${o[6]}) : 2 = ${num(q3)}.`);
      },
    },
    cajon: {
      titulo: 'Diagrama de cajón',
      gen() {
        const q1 = rnd(5, 20), q3 = q1 + rnd(4, 20), min = q1 - rnd(1, 5), max = q3 + rnd(1, 8);
        return desafio('cajon', this.titulo, `En un diagrama de cajón, el mínimo es ${min}, Q1 = ${q1}, Q3 = ${q3} y el máximo es ${max}. ¿Cuál es el rango intercuartil?`,
          num(q3 - q1), [num(max - min), num(q3 + q1), num(max - q1)], cerca(q3 - q1),
          'El rango intercuartil es Q3 − Q1: el largo de la caja.', `${q3} − ${q1} = ${q3 - q1}.`);
      },
    },
    multiplicativo: {
      titulo: 'Principio multiplicativo',
      gen() {
        const a = rnd(2, 6), b = rnd(2, 6), c = rnd(1, 4);
        if (c === 1) return desafio('multiplicativo', this.titulo, `Tienes ${a} cascos y ${b} capas distintas. ¿De cuántas formas puedes vestir a tu personaje con un casco y una capa?`,
          num(a * b), [num(a + b), num(a * b - 1), num(2 * (a + b))], cerca(a * b),
          'Para cada casco hay ' + b + ' capas posibles: multiplica.', `${a} · ${b} = ${a * b} formas.`);
        return desafio('multiplicativo', this.titulo, `Para viajar eliges 1 de ${a} portales, 1 de ${b} caminos y 1 de ${c + 1} puentes. ¿Cuántos recorridos distintos hay?`,
          num(a * b * (c + 1)), [num(a + b + c + 1), num(a * b), num(a * b + c + 1)], cerca(a * b * (c + 1)),
          'Multiplica la cantidad de opciones de cada etapa.', `${a} · ${b} · ${c + 1} = ${a * b * (c + 1)}.`);
      },
    },
    probabilidad8: {
      titulo: 'Probabilidad',
      gen() {
        const v = pick([1, 2, 3]);
        if (v === 1) {
          const n = rnd(1, 4);
          const f = frac(6 - n, 6);
          return desafio('probabilidad8', this.titulo, `Lanzas un dado. ¿Cuál es la probabilidad de obtener un número mayor que ${n}?`,
            fracTxt(f), [fracTxt(frac(n, 6)), `${6 - n}/${n}`, fracTxt(frac(1, 6))], (k) => fracTxt(frac(6 - n + k, 6 + k)),
            'Cuenta los resultados favorables y divide por los 6 posibles.', `Mayores que ${n}: ${Array.from({ length: 6 - n }, (_, i) => n + i + 1).join(', ')}. Son ${6 - n} de 6: ${fracTxt(f)}.`);
        }
        if (v === 2) return desafio('probabilidad8', this.titulo, 'Lanzas dos monedas. ¿Cuál es la probabilidad de obtener dos caras?',
          '1/4', ['1/2', '1/3', '3/4'], null,
          'Los resultados posibles son CC, CS, SC y SS.', 'Hay 4 resultados igualmente probables y solo CC sirve: 1/4.');
        const r = rnd(2, 6), a = rnd(2, 6);
        return desafio('probabilidad8', this.titulo, `Una bolsa tiene ${r} gemas rojas y ${a} azules. Sacas una, la devuelves y sacas otra. ¿Probabilidad de sacar dos rojas?`,
          fracTxt(frac(r * r, (r + a) * (r + a))), [fracTxt(frac(2 * r, r + a)), fracTxt(frac(r, r + a)), fracTxt(frac(r * (r - 1), (r + a) * (r + a - 1)))], (k) => fracTxt(frac(r * r + k, (r + a) * (r + a))),
          'Con devolución, las extracciones son independientes: multiplica las probabilidades.', `${r}/${r + a} · ${r}/${r + a} = ${r * r}/${(r + a) * (r + a)}${frac(r * r, (r + a) * (r + a)).d !== (r + a) * (r + a) ? ' = ' + fracTxt(frac(r * r, (r + a) * (r + a))) : ''}.`);
      },
    },
  };

  Object.assign(P.BANCO['7basico'], { u2: U2_7, u3: U3_7, u4: U4_7 });
  Object.assign(P.BANCO['8basico'], { u2: U2_8, u3: U3_8, u4: U4_8 });
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
