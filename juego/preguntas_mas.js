// Math World — segunda ampliación del banco de preguntas (todas las unidades de 7° y 8° básico).
// Agrega nuevas variantes a cada tema del currículum; la Unidad 1 usa contextos del bosque y la Unidad 2, del desierto.
// Cada variante es una función (dif, titulo, tema) que devuelve un desafío con el mismo formato.
(function (global) {
  'use strict';
  const P = global.Preguntas || (typeof module !== 'undefined' ? require('./preguntas_ext.js') : null);
  const { rnd, pick, gcd, num, par, frac, fracTxt, cerca, desafio, redondear } = P.h;
  const ftxt = (n, d) => fracTxt(frac(n, d));
  const pm = () => pick([-1, 1]);
  // a·v + b escrito de forma natural: "3x + 2", "x − 5", "−2x"
  const lineal = (a, b, v = 'x') => {
    let t = a === 1 ? v : a === -1 ? '−' + v : a === 0 ? '' : num(a) + v;
    if (b === 0) return t || '0';
    if (!t) return num(b);
    return t + (b > 0 ? ' + ' : ' − ') + num(Math.abs(b));
  };
  // a·x² + b·x + c
  const cuad = (a, b, c) => {
    let t = a === 1 ? 'x²' : a === -1 ? '−x²' : `${num(a)}x²`;
    if (b) t += (b > 0 ? ' + ' : ' − ') + (Math.abs(b) === 1 ? 'x' : `${num(Math.abs(b))}x`);
    if (c) t += (c > 0 ? ' + ' : ' − ') + num(Math.abs(c));
    return t;
  };
  const sumaL = (lista) => lista.reduce((a, b) => a + b, 0);
  const mediana = (l) => { const o = [...l].sort((a, b) => a - b), n = o.length; return n % 2 ? o[(n - 1) / 2] : (o[n / 2 - 1] + o[n / 2]) / 2; };

  function ampliar(curso, unidad, tema, extras, pesoOrig = 1) {
    const t = P.BANCO[curso] && P.BANCO[curso][unidad] && P.BANCO[curso][unidad][tema];
    if (!t) throw new Error(`Tema inexistente: ${curso} ${unidad} ${tema}`);
    const orig = t.gen.bind(t);
    const lista = [...Array(pesoOrig).fill(orig), ...extras.map((f) => (dif) => f(dif, t.titulo, tema))];
    t.gen = function (dif) { return pick(lista)(dif); };
  }

  // =====================================================================
  // 7° BÁSICO · UNIDAD 1 · NÚMEROS
  // =====================================================================
  ampliar('7basico', 'u1', 'enteros', [
    (dif, T, k) => {
      const dia = rnd(4, 14), baja = rnd(dia + 2, dia + 12), noche = dia - baja;
      return desafio(k, T, `En la cima del bosque, al mediodía la temperatura es ${dia} °C y en una noche de invierno baja ${baja} °C. ¿Qué temperatura hay en la noche?`,
        `${num(noche)} °C`, [`${num(dia + baja)} °C`, `${num(-noche)} °C`, `${num(noche - 10)} °C`], (j) => `${num(noche + j)} °C`,
        'Bajar la temperatura es restar: parte en la temperatura del día y resta lo que baja.', `${dia} − ${baja} = ${num(noche)} °C.`);
    },
    (dif, T, k) => {
      const a = rnd(-15, -2), b = rnd(-12, 12) || 4, c = rnd(-9, -1);
      const r = a - b + c;
      return desafio(k, T, `Calcula: ${num(a)} − ${par(b)} + ${par(c)}`,
        num(r), [num(a + b + c), num(a - b - c), num(-r)], cerca(r),
        'Restar un número es sumar su opuesto. Luego suma de izquierda a derecha.', `${num(a)} − ${par(b)} + ${par(c)} = ${num(a)} + ${par(-b)} + ${par(c)} = ${num(r)}.`);
    },
  ]);
  ampliar('7basico', 'u1', 'fracdec', [
    (dif, T, k) => {
      const d = pick([3, 4, 5, 6, 8]), n = rnd(1, d - 1), q = d * rnd(2, 6);
      return desafio(k, T, `Un leñador junta ${q} kg de madera y usa ${ftxt(n, d)} para construir un puente. ¿Cuántos kilos usa?`,
        `${num((q * n) / d)} kg`, [`${num(q / d)} kg`, `${num(q - (q * n) / d)} kg`, `${num(q * n)} kg`], (j) => `${num((q * n) / d + j)} kg`,
        `Calcular ${ftxt(n, d)} de una cantidad es dividir por ${d} y multiplicar por ${n}.`, `${q} : ${d} · ${n} = ${num((q * n) / d)} kg.`);
    },
    (dif, T, k) => {
      const a = rnd(11, 49) / 10, b = pick([2, 4, 5]);
      const r = redondear(a / b, 3);
      if (Math.round(r * 1000) !== r * 1000) return null;
      return desafio(k, T, `Reparte ${num(a)} litros de agua del lago en ${b} baldes iguales. ¿Cuántos litros lleva cada uno?`,
        `${num(r)} L`, [`${num(a * b)} L`, `${num(redondear(r * 10, 3))} L`, `${num(redondear(a - b, 3))} L`], (j) => `${num(redondear(r + j / 10, 3))} L`,
        'Divide el decimal por el número de baldes.', `${num(a)} : ${b} = ${num(r)} L.`);
    },
  ]);
  ampliar('7basico', 'u1', 'porcentajes', [
    (dif, T, k) => {
      const p = pick([10, 20, 25, 30, 40, 50]), P0 = 20 * rnd(2, 10);
      const r = P0 * (1 - p / 100);
      return desafio(k, T, `En la feria del bosque, un hacha cuesta ${P0} monedas y tiene ${p} % de descuento. ¿Cuánto se paga?`,
        `${num(r)} monedas`, [`${num((P0 * p) / 100)} monedas`, `${num(P0 - p)} monedas`, `${num(P0 + (P0 * p) / 100)} monedas`], (j) => `${num(r + j * 2)} monedas`,
        `Calcula el ${p} % del precio y réstalo, o calcula directamente el ${100 - p} %.`, `${p} % de ${P0} = ${num((P0 * p) / 100)}; ${P0} − ${num((P0 * p) / 100)} = ${num(r)}.`);
    },
    (dif, T, k) => {
      const tot = pick([20, 25, 40, 50]), parte = rnd(1, tot - 1);
      const r = (parte * 100) / tot;
      return desafio(k, T, `De ${tot} árboles del bosque, ${parte} son manzanos. ¿Qué porcentaje son manzanos?`,
        `${num(r)} %`, [`${num(parte)} %`, `${num(100 - r)} %`, `${num(redondear(tot / parte, 2))} %`], (j) => `${num(r + j)} %`,
        'Porcentaje = parte : total · 100.', `${parte} : ${tot} · 100 = ${num(r)} %.`);
    },
  ]);
  ampliar('7basico', 'u1', 'potencias10', [
    (dif, T, k) => {
      const a = rnd(2, 9), e = rnd(3, 7);
      const n = a * 10 ** e;
      return desafio(k, T, `En el bosque hay unas ${num(n)} hojas en los árboles. ¿Cómo se escribe ese número con potencia de 10?`,
        `${a} · 10^${e}`, [`${a} · 10^${e + 1}`, `${a} · 10^${e - 1}`, `${a * 10} · 10^${e}`], (j) => `${a} · 10^${e + j + 1}`,
        'Cuenta cuántos ceros hay después de la primera cifra: ese es el exponente.', `${num(n)} = ${a} · 10^${e} porque tiene ${e} ceros.`);
    },
  ]);

  // =====================================================================
  // 7° BÁSICO · UNIDAD 2 · ÁLGEBRA Y FUNCIONES (mundo del desierto)
  // =====================================================================
  ampliar('7basico', 'u2', 'lenguaje', [
    (dif, T, k) => {
      const b = rnd(2, 9);
      return desafio(k, T, `Una caravana tiene n camellos. Llegan ${b} camellos más y después el total se duplica. ¿Qué expresión representa los camellos que hay al final?`,
        `2(n + ${b})`, [`2n + ${b}`, `n + 2 · ${b}`, `2 + n + ${b}`], null,
        'Primero se suman los que llegan y después se duplica todo el resultado: usa paréntesis.', `(n + ${b}) duplicado es 2(n + ${b}).`);
    },
    (dif, T, k) => {
      const a = rnd(2, 6), b = rnd(1, 9);
      const nom = { 2: 'El doble', 3: 'El triple', 4: 'El cuádruple', 5: 'El quíntuple', 6: 'El séxtuple' }[a];
      return desafio(k, T, `¿Qué significa la expresión ${a}x − ${b}?`,
        `${nom} de un número, disminuido en ${b}`, [`Un número disminuido en ${b}, y luego multiplicado por ${a}`, `${b} veces un número, menos ${a}`, `${nom} de ${b}, menos un número`], null,
        'Lee primero la multiplicación (la letra con su coeficiente) y después la resta.', `${a}x es ${nom.toLowerCase()} de x; luego se le resta ${b}.`);
    },
    (dif, T, k) => desafio(k, T, 'Un terreno del oasis es un rectángulo de largo a y ancho b. ¿Qué expresión representa su perímetro?',
      '2a + 2b', ['a · b', 'a + b', '2ab'], null,
      'El perímetro es la suma de los cuatro lados: dos largos y dos anchos.', 'a + b + a + b = 2a + 2b.'),
    (dif, T, k) => {
      const d = rnd(2, 5), a = rnd(d + 1, d + 6);
      return desafio(k, T, `El día 1 el oasis tiene ${a} palmeras, el día 2 tiene ${a + d}, el día 3 tiene ${a + 2 * d}, y así sucesivamente. ¿Qué expresión da las palmeras del día n?`,
        lineal(d, a - d, 'n'), [lineal(a, d, 'n'), lineal(d, 0, 'n'), lineal(1, d, 'n')], (j) => lineal(d, a - d + j, 'n'),
        `Cada día aumentan ${d}: la expresión es ${d}n más un número fijo. Pruébala con n = 1.`, `${d} · 1 + ${a - d} = ${a}, ${d} · 2 + ${a - d} = ${a + d}. Entonces ${lineal(d, a - d, 'n')}.`);
    },
  ]);
  ampliar('7basico', 'u2', 'expresiones7', [
    (dif, T, k) => {
      const a = -rnd(2, 5), b = rnd(1, 9);
      const r = 2 * a * a - b;
      return desafio(k, T, `Valora 2a² − b si a = ${num(a)} y b = ${b}.`,
        num(r), [num(-2 * a * a - b), num(4 * a * a - b), num(2 * a - b)], cerca(r),
        'Primero calcula la potencia: un número negativo al cuadrado es positivo.', `2 · (${num(a)})² − ${b} = 2 · ${a * a} − ${b} = ${num(r)}.`);
    },
    (dif, T, k) => {
      const a = rnd(2, 5), b = rnd(1, 8), c = rnd(1, a - 1 || 1);
      return desafio(k, T, `Reduce: ${a}(x + ${b}) − ${c}x`,
        lineal(a - c, a * b), [lineal(a - c, b), lineal(a + c, a * b), lineal(a - c, a + b)], (j) => lineal(a - c, a * b + j),
        `Primero multiplica ${a} por cada término del paréntesis y después reduce los términos con x.`, `${a}x + ${a * b} − ${c}x = ${lineal(a - c, a * b)}.`);
    },
    (dif, T, k) => {
      const p = rnd(1, 6), q = rnd(1, 5);
      return desafio(k, T, `Los lados de un triángulo miden x + ${p}, 2x y x − ${q}. ¿Qué expresión representa su perímetro?`,
        lineal(4, p - q), [lineal(3, p - q), lineal(4, p + q), `${2}x²${p - q ? (p - q > 0 ? ' + ' : ' − ') + Math.abs(p - q) : ''}`], (j) => lineal(4, p - q + j),
        'Suma los tres lados y reduce los términos semejantes.', `x + ${p} + 2x + x − ${q} = ${lineal(4, p - q)}.`);
    },
    (dif, T, k) => desafio(k, T, '¿Cuál de estos términos es semejante a 5x²y?',
      '−2x²y', ['5xy²', '5x²', 'x²y²'], null,
      'Dos términos son semejantes si tienen las mismas letras con los mismos exponentes.', '−2x²y tiene x² e y, igual que 5x²y.'),
  ]);
  ampliar('7basico', 'u2', 'proporcion', [
    (dif, T, k) => {
      const c1 = pick([2, 3, 4, 6]), d1 = pick([4, 6, 8, 12]), c2 = pick([2, 3, 4, 6, 8, 12].filter((x) => x !== c1 && (c1 * d1) % x === 0));
      if (!c2) return null;
      const d2 = (c1 * d1) / c2;
      return desafio(k, T, `${c1} camellos tardan ${d1} días en transportar toda la carga. ¿Cuántos días tardarían ${c2} camellos? (proporcionalidad inversa)`,
        `${num(d2)} días`, [`${num((d1 * c2) / c1)} días`, `${num(d1 + c1 - c2)} días`, `${num(c1 * d1)} días`], (j) => `${num(d2 + j)} días`,
        'En la proporcionalidad inversa el producto se mantiene: camellos · días es siempre lo mismo.', `${c1} · ${d1} = ${c1 * d1}; ${c1 * d1} : ${c2} = ${num(d2)} días.`);
    },
    (dif, T, k) => {
      const l = rnd(2, 5), c = l * rnd(2, 5), l2 = rnd(6, 12);
      const r = (c / l) * l2;
      return desafio(k, T, `Con ${l} litros de agua se riegan ${c} cactus. ¿Cuántos cactus se riegan con ${l2} litros? (proporcionalidad directa)`,
        num(r), [num(c + l2 - l), num((l2 * l) / c), num(c * l2)], cerca(r),
        'Calcula cuántos cactus se riegan con 1 litro y multiplica.', `${c} : ${l} = ${c / l} cactus por litro; ${c / l} · ${l2} = ${num(r)}.`);
    },
    (dif, T, k) => desafio(k, T, '¿Cuál de estos pares de magnitudes es inversamente proporcional?',
      'Velocidad de una caravana y tiempo para recorrer la misma distancia', ['Cactus cortados y fibra obtenida', 'Kilos de oro y su precio total', 'Lado de un cuadrado y su perímetro'], null,
      'En la proporcionalidad inversa, cuando una magnitud aumenta al doble, la otra disminuye a la mitad.', 'Si la caravana va al doble de rápido, tarda la mitad del tiempo.'),
    (dif, T, k) => {
      const x1 = pick([2, 3, 4, 5]), y1 = pick([6, 12, 24, 30]), kk = x1 * y1, x2 = pick([1, 2, 3, 4, 6, 8, 10].filter((x) => x !== x1 && kk % x === 0));
      return desafio(k, T, `x e y son inversamente proporcionales. Si x = ${x1} cuando y = ${y1}, ¿cuánto vale y cuando x = ${x2}?`,
        num(kk / x2), [num((y1 * x2) / x1), num(y1 + x1 - x2), num(kk)], cerca(kk / x2),
        'En la proporcionalidad inversa x · y es constante.', `x · y = ${x1} · ${y1} = ${kk}; y = ${kk} : ${x2} = ${num(kk / x2)}.`);
    },
  ]);
  ampliar('7basico', 'u2', 'ecuaciones7', [
    (dif, T, k) => {
      const a = rnd(2, 9), x = rnd(2, 12), b = rnd(1, 20);
      return desafio(k, T, `Resuelve: ${a}x − ${b} = ${a * x - b}`,
        `x = ${x}`, [`x = ${(a * x - b - b) / a === x ? x + 1 : num(redondear((a * x - 2 * b) / a, 2))}`, `x = ${a * x}`, `x = ${num(a * x - b + a)}`], (j) => `x = ${x + j}`,
        `Suma ${b} a ambos lados y después divide por ${a}.`, `${a}x = ${a * x}, entonces x = ${x}.`);
    },
    (dif, T, k) => {
      const a = rnd(3, 8), c = rnd(1, a - 1), x = rnd(1, 9), b = rnd(1, 15), d = (a - c) * x + b;
      return desafio(k, T, `Resuelve: ${a}x + ${b} = ${c === 1 ? '' : c}x + ${d}`,
        `x = ${x}`, [`x = ${num(redondear((d - b) / (a + c), 2))}`, `x = ${d - b}`, `x = ${x + 2}`], (j) => `x = ${x + j}`,
        'Junta los términos con x en un lado y los números en el otro.', `${a}x − ${c}x = ${d} − ${b} → ${a - c}x = ${d - b} → x = ${x}.`);
    },
    (dif, T, k) => {
      const g = rnd(5, 20), r = rnd(g, 40), x = 2 * r - g;
      return desafio(k, T, `Un mercader tiene algunas monedas de oro. Gana ${g} monedas y luego gasta la mitad de lo que tiene. Le quedan ${r}. ¿Cuántas monedas tenía al principio?`,
        num(x), [num(2 * r + g), num(r - g), num(2 * r)], cerca(x),
        `Plantea (x + ${g}) : 2 = ${r} y despeja, o resuelve hacia atrás.`, `x + ${g} = ${2 * r}, entonces x = ${x}.`);
    },
    (dif, T, k) => {
      const f = rnd(2, 5), meta = rnd(10, 40);
      if (meta % f === 0) return null;
      const r = Math.floor(meta / f) + 1;
      return desafio(k, T, `Cada cactus da ${f} de fibra. ¿Cuántos cactus necesitas cortar, como mínimo, para tener MÁS de ${meta} de fibra?`,
        num(r), [num(r - 1), num(meta), num(meta - f)], cerca(r),
        `Plantea la inecuación ${f}x > ${meta} y busca el menor número entero que la cumple.`, `x > ${meta} : ${f} = ${num(redondear(meta / f, 2))}; el menor entero es ${r}.`);
    },
  ]);

  // =====================================================================
  // 7° BÁSICO · UNIDAD 3 · GEOMETRÍA
  // =====================================================================
  ampliar('7basico', 'u3', 'angulos', [
    (dif, T, k) => {
      const n = rnd(5, 12), r = (n - 2) * 180;
      return desafio(k, T, `¿Cuánto suman los ángulos interiores de un polígono de ${n} lados?`,
        `${num(r)}°`, [`${num(n * 180)}°`, `${num(360)}°`, `${num((n - 1) * 180)}°`], (j) => `${num(r + j * 90)}°`,
        'La suma de los ángulos interiores es (n − 2) · 180°.', `(${n} − 2) · 180° = ${num(r)}°.`);
    },
    (dif, T, k) => {
      const n = pick([5, 6, 8, 9, 10, 12, 15]);
      return desafio(k, T, `¿Cuánto mide cada ángulo exterior de un polígono regular de ${n} lados?`,
        `${num(360 / n)}°`, [`${num(180 - 360 / n)}°`, `${num(((n - 2) * 180) / n + 10)}°`, `${num(360 * n)}°`], (j) => `${num(360 / n + j * 3)}°`,
        'Los ángulos exteriores de cualquier polígono suman 360°.', `360° : ${n} = ${num(360 / n)}°.`);
    },
  ]);
  ampliar('7basico', 'u3', 'circulo', [
    (dif, T, k) => {
      const dm = 2 * rnd(2, 15), r = redondear(3.14 * dm, 2);
      return desafio(k, T, `Un pozo es circular y mide ${dm} m de diámetro. ¿Cuál es su perímetro? (usa π ≈ 3,14)`,
        `${num(r)} m`, [`${num(redondear(3.14 * dm * 2, 2))} m`, `${num(redondear(3.14 * (dm / 2) ** 2, 2))} m`, `${num(redondear(3.14 + dm, 2))} m`], (j) => `${num(redondear(r + j, 2))} m`,
        'Perímetro = π · diámetro.', `3,14 · ${dm} = ${num(r)} m.`);
    },
    (dif, T, k) => {
      const rr = rnd(2, 10), a = redondear(3.14 * rr * rr, 2);
      return desafio(k, T, `¿Cuál es el área de un círculo de radio ${rr} cm? (usa π ≈ 3,14)`,
        `${num(a)} cm²`, [`${num(redondear(3.14 * 2 * rr, 2))} cm²`, `${num(redondear(3.14 * rr, 2))} cm²`, `${num(redondear(3.14 * (2 * rr) ** 2, 2))} cm²`], (j) => `${num(redondear(a + j * 3, 2))} cm²`,
        'Área del círculo = π · r².', `3,14 · ${rr}² = 3,14 · ${rr * rr} = ${num(a)} cm².`);
    },
  ]);
  ampliar('7basico', 'u3', 'areas', [
    (dif, T, k) => {
      const B = rnd(6, 16), b = rnd(2, B - 2), h = 2 * rnd(2, 8), r = ((B + b) * h) / 2;
      return desafio(k, T, `Un trapecio tiene bases de ${B} cm y ${b} cm, y altura ${h} cm. ¿Cuál es su área?`,
        `${num(r)} cm²`, [`${num((B + b) * h)} cm²`, `${num(B * b * h)} cm²`, `${num(((B - b) * h) / 2)} cm²`], (j) => `${num(r + j * 2)} cm²`,
        'Área del trapecio = (base mayor + base menor) · altura : 2.', `(${B} + ${b}) · ${h} : 2 = ${num(r)} cm².`);
    },
    (dif, T, k) => {
      const b = rnd(4, 15), h = rnd(3, 12);
      return desafio(k, T, `Una alfombra con forma de paralelogramo tiene base ${b} dm y altura ${h} dm. ¿Cuál es su área?`,
        `${num(b * h)} dm²`, [`${num((b * h) / 2)} dm²`, `${num(2 * (b + h))} dm²`, `${num(b + h)} dm²`], (j) => `${num(b * h + j * 2)} dm²`,
        'Área del paralelogramo = base · altura.', `${b} · ${h} = ${b * h} dm².`);
    },
  ]);
  ampliar('7basico', 'u3', 'cartesiano', [
    (dif, T, k) => {
      const x = rnd(-6, 6) || 2, y = rnd(-6, 6) || -3, dx = rnd(-5, 5) || 3, dy = rnd(-5, 5) || -2;
      return desafio(k, T, `Un explorador está en (${num(x)}, ${num(y)}) y se traslada ${Math.abs(dx)} ${dx > 0 ? 'a la derecha' : 'a la izquierda'} y ${Math.abs(dy)} ${dy > 0 ? 'hacia arriba' : 'hacia abajo'}. ¿Dónde queda?`,
        `(${num(x + dx)}, ${num(y + dy)})`, [`(${num(x + dy)}, ${num(y + dx)})`, `(${num(x - dx)}, ${num(y - dy)})`, `(${num(x + dx)}, ${num(y - dy)})`], (j) => `(${num(x + dx + j)}, ${num(y + dy)})`,
        'Moverse a la derecha o izquierda cambia la primera coordenada; arriba o abajo, la segunda.', `(${num(x)} + ${par(dx)}, ${num(y)} + ${par(dy)}) = (${num(x + dx)}, ${num(y + dy)}).`);
    },
    (dif, T, k) => {
      const sx = pm(), sy = pm(), x = sx * rnd(1, 9), y = sy * rnd(1, 9);
      const q = sx > 0 ? (sy > 0 ? 'Primer cuadrante' : 'Cuarto cuadrante') : (sy > 0 ? 'Segundo cuadrante' : 'Tercer cuadrante');
      const todos = ['Primer cuadrante', 'Segundo cuadrante', 'Tercer cuadrante', 'Cuarto cuadrante'];
      return desafio(k, T, `¿En qué cuadrante está el punto (${num(x)}, ${num(y)})?`,
        q, todos.filter((t) => t !== q), null,
        'Primer cuadrante: (+, +); segundo: (−, +); tercero: (−, −); cuarto: (+, −).', `x es ${x > 0 ? 'positivo' : 'negativo'} e y es ${y > 0 ? 'positivo' : 'negativo'}: ${q.toLowerCase()}.`);
    },
  ]);

  // =====================================================================
  // 7° BÁSICO · UNIDAD 4 · PROBABILIDAD Y ESTADÍSTICA
  // =====================================================================
  ampliar('7basico', 'u4', 'tendencia', [
    (dif, T, k) => {
      const l = Array.from({ length: 5 }, () => rnd(1, 15));
      const o = [...l].sort((a, b) => a - b), m = mediana(l);
      return desafio(k, T, `Los ejercicios correctos de cinco jugadores fueron: ${l.join(', ')}. ¿Cuál es la mediana?`,
        num(m), [num(redondear(sumaL(l) / 5, 2)), num(o[4] - o[0]), num(l[2])].filter((x) => x !== num(m)), cerca(m),
        'Ordena los datos de menor a mayor: la mediana es el dato del centro.', `Ordenados: ${o.join(', ')}. El del centro es ${m}.`);
    },
    (dif, T, k) => {
      const l = Array.from({ length: 6 }, () => rnd(2, 30));
      const r = Math.max(...l) - Math.min(...l);
      return desafio(k, T, `Monedas reunidas por seis jugadores: ${l.join(', ')}. ¿Cuál es el rango?`,
        num(r), [num(Math.max(...l)), num(redondear(sumaL(l) / 6, 2)), num(Math.max(...l) + Math.min(...l))], cerca(r),
        'Rango = dato mayor − dato menor.', `${Math.max(...l)} − ${Math.min(...l)} = ${r}.`);
    },
  ]);
  ampliar('7basico', 'u4', 'probabilidad7', [
    (dif, T, k) => {
      const o = rnd(2, 6), c = rnd(2, 8), a = rnd(1, 5), t = o + c + a;
      return desafio(k, T, `Un cofre tiene ${o} monedas de oro, ${c} de cobre y ${a} de plata. Sacas una al azar. ¿Cuál es la probabilidad de que sea de cobre?`,
        ftxt(c, t), [ftxt(o, t), ftxt(c, o + a), ftxt(1, 3)].filter((x) => x !== ftxt(c, t)), (j) => ftxt(c + j, t + j),
        'Probabilidad = casos favorables : casos posibles.', `Hay ${c} de cobre de un total de ${t}: ${ftxt(c, t)}.`);
    },
  ]);
  ampliar('7basico', 'u4', 'tablas', [
    (dif, T, k) => {
      const tot = pick([20, 25, 40, 50]), f = rnd(1, tot - 1);
      return desafio(k, T, `En una encuesta a ${tot} viajeros, ${f} prefieren explorar de noche. ¿Cuál es la frecuencia relativa porcentual?`,
        `${num((f * 100) / tot)} %`, [`${num(f)} %`, `${num(100 - (f * 100) / tot)} %`, `${num(redondear(tot / f, 2))} %`], (j) => `${num((f * 100) / tot + j)} %`,
        'Frecuencia relativa = frecuencia : total; para el porcentaje, multiplícala por 100.', `${f} : ${tot} · 100 = ${num((f * 100) / tot)} %.`);
    },
  ]);

  // =====================================================================
  // 8° BÁSICO · UNIDAD 1 · NÚMEROS
  // =====================================================================
  ampliar('8basico', 'u1', 'multdiv', [
    (dif, T, k) => {
      const a = -rnd(2, 9), b = rnd(2, 9), c = -rnd(2, 6);
      const r = a * b * c;
      return desafio(k, T, `Calcula: ${par(a)} · ${par(b)} · ${par(c)}`,
        num(r), [num(-r), num(a * b + c), num(a + b + c)], cerca(r),
        'Cuenta los factores negativos: si son un número par, el resultado es positivo.', `${par(a)} · ${par(b)} = ${num(a * b)}; ${num(a * b)} · ${par(c)} = ${num(r)}.`);
    },
    (dif, T, k) => {
      const q = -rnd(2, 12), d = -rnd(2, 9);
      return desafio(k, T, `Calcula: ${num(q * d)} : ${par(d)}`,
        num(q), [num(-q), num(q * d * d), num(q - d)], cerca(q),
        'Signos iguales dan positivo; signos distintos dan negativo.', `${num(q * d)} : ${par(d)} = ${num(q)}.`);
    },
  ]);
  ampliar('8basico', 'u1', 'racionales', [
    (dif, T, k) => {
      const a = rnd(1, 5), b = pick([2, 3, 4, 5, 6]), c = rnd(1, 5), d = pick([2, 3, 4, 5, 6]);
      const r = frac(a * c, b * d);
      return desafio(k, T, `Calcula: ${ftxt(-a, b)} · ${ftxt(c, d)}`,
        fracTxt({ n: -r.n, d: r.d }), [fracTxt(r), ftxt(-(a + c), b + d), ftxt(-(a * d), b * c)], (j) => ftxt(-(a * c + j), b * d),
        'Multiplica numeradores y denominadores; negativo por positivo da negativo.', `${ftxt(-a, b)} · ${ftxt(c, d)} = ${ftxt(-a * c, b * d)}.`);
    },
  ]);
  ampliar('8basico', 'u1', 'potencias', [
    (dif, T, k) => {
      const a = pick([2, 3, 5]), m = rnd(2, 5);
      return desafio(k, T, `¿Cuál es el valor de ${a}^${m} · ${a}^0?`,
        num(a ** m), [num(0), num(a ** (m + 1)), num(a * m)], cerca(a ** m),
        'Toda potencia (con base distinta de cero) elevada a 0 vale 1.', `${a}^0 = 1, entonces ${a}^${m} · 1 = ${num(a ** m)}.`);
    },
  ]);
  ampliar('8basico', 'u1', 'raiz', [
    (dif, T, k) => {
      const r = rnd(4, 15);
      return desafio(k, T, `Un claro cuadrado del bosque tiene ${r * r} m² de área. ¿Cuánto mide cada lado?`,
        `${r} m`, [`${num((r * r) / 2)} m`, `${num((r * r) / 4)} m`, `${r * 2} m`], (j) => `${r + j} m`,
        'El lado de un cuadrado es la raíz cuadrada de su área.', `√${r * r} = ${r} m.`);
    },
  ]);
  ampliar('8basico', 'u1', 'variacion', [
    (dif, T, k) => {
      const P0 = 100 * rnd(2, 9), p = pick([10, 20, 25]), n = 2;
      const r = redondear(P0 * (1 + p / 100) ** n, 2);
      return desafio(k, T, `El precio de la madera sube ${p} % cada año. Si hoy una carga vale ${P0} monedas, ¿cuánto valdrá en ${n} años?`,
        `${num(r)} monedas`, [`${num(P0 + (2 * P0 * p) / 100)} monedas`, `${num(P0 * (1 + p / 100))} monedas`, `${num(redondear(r + P0 / 10, 2))} monedas`], (j) => `${num(redondear(r + j * 4, 2))} monedas`,
        `Cada año se multiplica por ${num(1 + p / 100)}: hazlo dos veces.`, `${P0} · ${num(1 + p / 100)} · ${num(1 + p / 100)} = ${num(r)}.`);
    },
  ]);

  // =====================================================================
  // 8° BÁSICO · UNIDAD 2 · ÁLGEBRA Y FUNCIONES (mundo del desierto)
  // =====================================================================
  ampliar('8basico', 'u2', 'expresiones8', [
    (dif, T, k) => {
      const a = rnd(1, 7), b = rnd(1, 7);
      return desafio(k, T, `Desarrolla: (x + ${a})(x + ${b})`,
        cuad(1, a + b, a * b), [cuad(1, 0, a * b), cuad(1, a * b, a + b), cuad(1, a + b, a + b)], (j) => cuad(1, a + b + j, a * b),
        'Multiplica cada término del primer paréntesis por cada término del segundo y reduce.', `x² + ${b}x + ${a}x + ${a * b} = ${cuad(1, a + b, a * b)}.`);
    },
    (dif, T, k) => {
      const a = rnd(2, 9);
      return desafio(k, T, `Desarrolla el cuadrado de binomio: (x + ${a})²`,
        cuad(1, 2 * a, a * a), [cuad(1, 0, a * a), cuad(1, a, a * a), cuad(1, 2 * a, 2 * a)], (j) => cuad(1, 2 * a, a * a + j),
        '(a + b)² = a² + 2ab + b²: no olvides el doble producto.', `x² + 2 · ${a} · x + ${a}² = ${cuad(1, 2 * a, a * a)}.`);
    },
    (dif, T, k) => {
      const a = rnd(2, 10);
      return desafio(k, T, `Desarrolla: (x + ${a})(x − ${a})`,
        cuad(1, 0, -a * a), [cuad(1, 0, a * a), cuad(1, -2 * a, -a * a), cuad(1, 0, -2 * a)], (j) => cuad(1, 0, -(a * a + j)),
        'Suma por diferencia: (a + b)(a − b) = a² − b².', `x² − ${a}x + ${a}x − ${a * a} = ${cuad(1, 0, -a * a)}.`);
    },
    (dif, T, k) => {
      const c = rnd(2, 5), p = rnd(1, 4), q = rnd(1, 6);
      if (gcd(p, q) !== 1) return null;
      return desafio(k, T, `Factoriza: ${cuad(c * p, c * q, 0)}`,
        `${c}x(${lineal(p, q)})`, [`${c}x(${lineal(p + 1, q)})`, `${c}x²(${lineal(p, q)})`, `${c + 1}x(${lineal(p, q)})`], (j) => `${c}x(${lineal(p, q + j)})`,
        'Busca el factor común de los números y la menor potencia de x que se repite.', `${cuad(c * p, c * q, 0)} = ${c}x · ${lineal(p, 0)} + ${c}x · ${q} = ${c}x(${lineal(p, q)}).`);
    },
    (dif, T, k) => {
      const a = rnd(2, 5), b = rnd(1, 9);
      return desafio(k, T, `Una alfombra rectangular mide x de ancho y (${lineal(a, b)}) de largo. ¿Qué expresión representa su área?`,
        cuad(a, b, 0), [lineal(a + 1, b), cuad(a, 0, b), `2x + 2(${lineal(a, b)})`], (j) => cuad(a, b + j, 0),
        'Área del rectángulo = largo · ancho: multiplica x por cada término.', `x · (${lineal(a, b)}) = ${cuad(a, b, 0)}.`);
    },
  ]);
  ampliar('8basico', 'u2', 'funcion', [
    (dif, T, k) => {
      const c = rnd(1, 9), x = -rnd(1, 6), r = x * x - c;
      return desafio(k, T, `Si f(x) = x² − ${c}, ¿cuánto vale f(${num(x)})?`,
        num(r), [num(-x * x - c), num(2 * x - c), num(x * x + c)], cerca(r),
        'Reemplaza x por el número (entre paréntesis): un negativo al cuadrado es positivo.', `f(${num(x)}) = (${num(x)})² − ${c} = ${x * x} − ${c} = ${num(r)}.`);
    },
    (dif, T, k) => desafio(k, T, '¿Cuál de estos conjuntos de pares ordenados NO representa una función?',
      '{(1, 2), (1, 3), (2, 4)}', ['{(1, 2), (2, 2), (3, 2)}', '{(0, 1), (1, 3), (2, 5)}', '{(−1, 1), (1, 1), (2, 4)}'], null,
      'En una función, a cada valor de x le corresponde un único valor de y.', 'En {(1, 2), (1, 3), (2, 4)} el x = 1 tiene dos imágenes: 2 y 3.'),
    (dif, T, k) => {
      const t0 = rnd(6, 18), s = rnd(2, 5);
      return desafio(k, T, `A las 6:00 la temperatura del desierto es ${t0} °C y sube ${s} °C cada hora. ¿Qué función da la temperatura T después de h horas?`,
        `T(h) = ${lineal(s, t0, 'h')}`, [`T(h) = ${lineal(t0, s, 'h')}`, `T(h) = ${s}(h + ${t0})`, `T(h) = ${lineal(s + t0, 0, 'h')}`], null,
        'Lo que cambia cada hora multiplica a h; el valor inicial se suma.', `Empieza en ${t0} y aumenta ${s} por hora: T(h) = ${lineal(s, t0, 'h')}.`);
    },
    (dif, T, k) => {
      const a = rnd(2, 5), b = rnd(-6, 6), xs = [rnd(-3, 0), rnd(1, 2), rnd(3, 5)], q = rnd(0, 2);
      return desafio(k, T, `En la tabla de f(x) = ${lineal(a, b)}, ¿qué valor corresponde a x = ${num(xs[q])}?`,
        num(a * xs[q] + b), [num(a * (xs[q] + b)), num(a + xs[q] + b), num(a * xs[q] - b)], cerca(a * xs[q] + b),
        'Reemplaza x por el número y calcula.', `f(${num(xs[q])}) = ${a} · ${par(xs[q])} + ${par(b)} = ${num(a * xs[q] + b)}.`);
    },
  ]);
  ampliar('8basico', 'u2', 'ecuaciones8', [
    (dif, T, k) => {
      const a = rnd(2, 6), b = rnd(1, 9), x = rnd(b + 1, b + 10), c = a * (x - b);
      return desafio(k, T, `Resuelve: ${a}(x − ${b}) = ${c}`,
        `x = ${x}`, [`x = ${num(redondear((c - b) / a, 2))}`, `x = ${c / a}`, `x = ${num(c + b)}`], (j) => `x = ${x + j}`,
        `Divide ambos lados por ${a} (o multiplica el paréntesis) y después suma ${b}.`, `x − ${b} = ${c / a}, entonces x = ${x}.`);
    },
    (dif, T, k) => {
      const [a, b] = pick([[2, 3], [3, 6], [2, 4], [4, 12], [3, 4]]), m = (a * b) / gcd(a, b), x = m * rnd(1, 6);
      const c = x / a + x / b;
      return desafio(k, T, `Resuelve: x/${a} + x/${b} = ${num(c)}`,
        `x = ${x}`, [`x = ${num(redondear(c * (a + b) / 2, 2))}`, `x = ${num(c * a * b)}`, `x = ${num(redondear(c / (a + b), 2))}`], (j) => `x = ${x + j * m}`,
        `Multiplica toda la ecuación por ${m} (el mínimo común múltiplo de ${a} y ${b}).`, `${m / a}x + ${m / b}x = ${num(c * m)} → ${m / a + m / b}x = ${num(c * m)} → x = ${x}.`);
    },
    (dif, T, k) => {
      const a = rnd(2, 6), r = rnd(-4, 6), b = rnd(1, 15), c = b - a * r;
      return desafio(k, T, `Resuelve la inecuación: ${num(b)} − ${a}x > ${num(c)}`,
        `x < ${num(r)}`, [`x > ${num(r)}`, `x < ${num(-r)}`, `x > ${num(-r)}`].filter((t) => t !== `x < ${num(r)}`), (j) => `x < ${num(r + j)}`,
        'Al multiplicar o dividir una inecuación por un número negativo, el signo de desigualdad se invierte.', `−${a}x > ${num(c - b)} → x < ${num(c - b)} : (−${a}) = ${num(r)}.`);
    },
    (dif, T, k) => {
      const d = rnd(2, 9), w = rnd(3, 15), Pm = 2 * (w + d) + 2 * w;
      return desafio(k, T, `Un corral rectangular del oasis tiene ${Pm} m de perímetro y su largo mide ${d} m más que el ancho. ¿Cuánto mide el ancho?`,
        `${w} m`, [`${w + d} m`, `${num(Pm / 4)} m`, `${num((Pm - d) / 2)} m`].filter((t) => t !== `${w} m`), (j) => `${w + j} m`,
        `Si el ancho es x, el largo es x + ${d}. Plantea 2x + 2(x + ${d}) = ${Pm}.`, `4x + ${2 * d} = ${Pm} → 4x = ${Pm - 2 * d} → x = ${w}.`);
    },
  ]);
  ampliar('8basico', 'u2', 'linealafin', [
    (dif, T, k) => {
      const m = (rnd(1, 6) * pm()), n = rnd(-9, 9) || 3;
      return desafio(k, T, `En la función f(x) = ${lineal(m, n)}, ¿cuál es el coeficiente de posición (donde corta al eje y)?`,
        num(n), [num(m), num(-n), num(m + n)], cerca(n),
        'En f(x) = mx + n, n es el coeficiente de posición: el valor de f(0).', `f(0) = ${num(n)}.`);
    },
    (dif, T, k) => {
      const a = rnd(2, 9);
      return desafio(k, T, '¿Cuál de estas funciones es una función lineal (de proporcionalidad directa)?',
        `f(x) = ${a}x`, [`f(x) = ${a}x + 1`, 'f(x) = x²', `f(x) = ${a}`], null,
        'Una función lineal tiene la forma f(x) = mx: su gráfico es una recta que pasa por el origen.', `f(x) = ${a}x pasa por (0, 0).`);
    },
    (dif, T, k) => {
      const m = rnd(-5, 6) || 2, a = rnd(1, 6), b = m * a;
      return desafio(k, T, `Una función lineal pasa por el origen y por el punto (${a}, ${num(b)}). ¿Cuál es su fórmula?`,
        `f(x) = ${lineal(m, 0)}`, [`f(x) = ${lineal(a, 0)}`, `f(x) = ${lineal(m, a)}`, `f(x) = ${lineal(-m, 0)}`].filter((t) => t !== `f(x) = ${lineal(m, 0)}`), (j) => `f(x) = ${lineal(m + j, 0)}`,
        'En una función lineal f(x) = mx, la pendiente es m = y : x.', `m = ${num(b)} : ${a} = ${num(m)}.`);
    },
    (dif, T, k) => {
      const m = rnd(1, 5) * pm(), r = rnd(-6, 6), n = -m * r;
      if (n === 0) return null;
      return desafio(k, T, `¿En qué valor de x la recta y = ${lineal(m, n)} corta al eje x?`,
        `x = ${num(r)}`, [`x = ${num(-r)}`, `x = ${num(n)}`, `x = ${num(m)}`].filter((t) => t !== `x = ${num(r)}`), (j) => `x = ${num(r + j)}`,
        'La recta corta al eje x cuando y = 0: resuelve la ecuación.', `${lineal(m, n)} = 0 → x = ${num(r)}.`);
    },
  ]);

  // =====================================================================
  // 8° BÁSICO · UNIDAD 3 · GEOMETRÍA
  // =====================================================================
  ampliar('8basico', 'u3', 'volumen', [
    (dif, T, k) => {
      const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9);
      return desafio(k, T, `Un cofre con forma de prisma rectangular mide ${a} dm × ${b} dm × ${c} dm. ¿Cuál es su volumen?`,
        `${a * b * c} dm³`, [`${a + b + c} dm³`, `${2 * (a * b + b * c + a * c)} dm³`, `${a * b} dm³`], (j) => `${a * b * c + j * 2} dm³`,
        'Volumen del prisma = área de la base · altura.', `${a} · ${b} · ${c} = ${a * b * c} dm³.`);
    },
    (dif, T, k) => {
      const r = rnd(1, 5), h = rnd(2, 10), v = redondear(3.14 * r * r * h, 2);
      return desafio(k, T, `Un pozo cilíndrico tiene radio ${r} m y profundidad ${h} m. ¿Cuál es su volumen? (usa π ≈ 3,14)`,
        `${num(v)} m³`, [`${num(redondear(3.14 * 2 * r * h, 2))} m³`, `${num(redondear(3.14 * r * h, 2))} m³`, `${num(redondear(3.14 * r * r, 2))} m³`].filter((t) => t !== `${num(v)} m³`), (j) => `${num(redondear(v + j * 3, 2))} m³`,
        'Volumen del cilindro = π · r² · h.', `3,14 · ${r}² · ${h} = ${num(v)} m³.`);
    },
  ]);
  ampliar('8basico', 'u3', 'pitagoras', [
    (dif, T, k) => {
      const [a, b, c] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20]]);
      return desafio(k, T, `Una escalera de ${c} m está apoyada en un muro. Su pie está a ${a} m del muro. ¿A qué altura llega?`,
        `${b} m`, [`${c - a} m`, `${c + a} m`, `${num(redondear(Math.sqrt(c * c + a * a), 2))} m`], (j) => `${b + j} m`,
        'La escalera es la hipotenusa: cateto² = hipotenusa² − otro cateto².', `√(${c}² − ${a}²) = √${c * c - a * a} = ${b} m.`);
    },
  ]);
  ampliar('8basico', 'u3', 'isometrias', [
    (dif, T, k) => {
      const x = rnd(-8, 8) || 3, y = rnd(-8, 8) || -2, eje = pick(['x', 'y']);
      const r = eje === 'x' ? [x, -y] : [-x, y];
      return desafio(k, T, `Refleja el punto (${num(x)}, ${num(y)}) respecto del eje ${eje}. ¿Qué punto se obtiene?`,
        `(${num(r[0])}, ${num(r[1])})`, [`(${num(-r[0])}, ${num(-r[1])})`, `(${num(-x)}, ${num(-y)})`, `(${num(y)}, ${num(x)})`], (j) => `(${num(r[0] + j)}, ${num(r[1])})`,
        `Al reflejar respecto del eje ${eje}, la coordenada ${eje} se mantiene y la otra cambia de signo.`, `(${num(x)}, ${num(y)}) → (${num(r[0])}, ${num(r[1])}).`);
    },
    (dif, T, k) => {
      const x = rnd(-8, 8) || 4, y = rnd(-8, 8) || 5;
      return desafio(k, T, `Rota el punto (${num(x)}, ${num(y)}) en 180° con centro en el origen. ¿Qué punto se obtiene?`,
        `(${num(-x)}, ${num(-y)})`, [`(${num(x)}, ${num(-y)})`, `(${num(-x)}, ${num(y)})`, `(${num(y)}, ${num(x)})`], (j) => `(${num(-x + j)}, ${num(-y)})`,
        'Una rotación de 180° en torno al origen cambia el signo de ambas coordenadas.', `(${num(x)}, ${num(y)}) → (${num(-x)}, ${num(-y)}).`);
    },
  ]);

  // =====================================================================
  // 8° BÁSICO · UNIDAD 4 · PROBABILIDAD Y ESTADÍSTICA
  // =====================================================================
  ampliar('8basico', 'u4', 'posicion', [
    (dif, T, k) => {
      const l = Array.from({ length: 7 }, () => rnd(1, 30)).sort((a, b) => a - b);
      return desafio(k, T, `Datos ordenados: ${l.join(', ')}. ¿Cuál es el segundo cuartil (Q2)?`,
        num(l[3]), [num(l[1]), num(l[5]), num(redondear(sumaL(l) / 7, 2))].filter((t) => t !== num(l[3])), cerca(l[3]),
        'El segundo cuartil es la mediana: deja el 50 % de los datos a cada lado.', `El dato central (el 4°) es ${l[3]}.`);
    },
  ]);
  ampliar('8basico', 'u4', 'cajon', [
    (dif, T, k) => {
      const q1 = rnd(5, 20), q3 = q1 + rnd(4, 20);
      return desafio(k, T, `En un diagrama de cajón, Q1 = ${q1} y Q3 = ${q3}. ¿Cuál es el rango intercuartil?`,
        num(q3 - q1), [num(q3 + q1), num((q3 + q1) / 2), num(q3)], cerca(q3 - q1),
        'Rango intercuartil = Q3 − Q1: es el largo de la caja.', `${q3} − ${q1} = ${q3 - q1}.`);
    },
  ]);
  ampliar('8basico', 'u4', 'multiplicativo', [
    (dif, T, k) => {
      const t = rnd(2, 5), c = rnd(2, 5), b = rnd(2, 4);
      return desafio(k, T, `Para tu personaje eliges 1 de ${t} sombreros, 1 de ${c} capas y 1 de ${b} mochilas. ¿Cuántas combinaciones distintas puedes formar?`,
        num(t * c * b), [num(t + c + b), num(t * c + b), num(t * c)], cerca(t * c * b),
        'Principio multiplicativo: multiplica las opciones de cada elección.', `${t} · ${c} · ${b} = ${t * c * b}.`);
    },
  ]);
  ampliar('8basico', 'u4', 'probabilidad8', [
    (dif, T, k) => {
      const s = rnd(1, 4);
      return desafio(k, T, `Lanzas un dado y una moneda. ¿Cuál es la probabilidad de obtener cara y un número menor que ${s + 1}?`,
        ftxt(s, 12), [ftxt(s, 6), ftxt(1, 2), ftxt(s + 1, 12)], (j) => ftxt(s + j, 12),
        'Hay 2 · 6 = 12 resultados posibles. Cuenta los que cumplen las dos condiciones.', `Cara con 1${s > 1 ? ` a ${s}` : ''}: ${s} casos de 12 → ${ftxt(s, 12)}.`);
    },
  ]);

  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
