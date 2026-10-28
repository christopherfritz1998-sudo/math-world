// Math World — juego de mundo abierto (Phaser 3).
// Cada estudiante tiene su propia base; desde el portal viaja a los mundos de cada unidad
// para recolectar recursos y enfrentar enemigos resolviendo ejercicios.
// Arte: personajes LPC (ver creditos.html) y Roguelike Pack de Kenney (CC0).
(() => {
  'use strict';

  // ===================================================================
  // Datos del juego
  // ===================================================================
  const PERSONAJES = [
    { id: 'zorro', nombre: 'Zorro' }, { id: 'luna', nombre: 'Luna' },
    { id: 'puma', nombre: 'Puma' }, { id: 'copihue', nombre: 'Copihue' },
    { id: 'condor', nombre: 'Cóndor' }, { id: 'huemul', nombre: 'Huemul' },
    { id: 'pudu', nombre: 'Pudú' }, { id: 'lobo', nombre: 'Lobo' },
  ];
  // Cada mundo tiene sus propios recursos (los mundos sin recursos propios usan los de la Unidad 1)
  const RECURSOS = [
    { id: 'madera', nombre: 'Madera', grupo: 'u1' }, { id: 'piedra', nombre: 'Piedra', grupo: 'u1' },
    { id: 'agua', nombre: 'Agua', grupo: 'u1' }, { id: 'cristal', nombre: 'Cristal', grupo: 'u1' },
    // Bosque profundo (al otro lado del puente)
    { id: 'resina', nombre: 'Resina', grupo: 'u1p' }, { id: 'miel', nombre: 'Miel', grupo: 'u1p' },
    { id: 'fibra', nombre: 'Fibra de cactus', corto: 'Fibra', grupo: 'u2' }, { id: 'arenisca', nombre: 'Arenisca', grupo: 'u2' },
    { id: 'cobre', nombre: 'Cobre', grupo: 'u2' }, { id: 'oro', nombre: 'Oro', grupo: 'u2' },
    // Valle de la Esfinge (sobre el acantilado del desierto)
    { id: 'obsidiana', nombre: 'Obsidiana', grupo: 'u2v' }, { id: 'fosil', nombre: 'Fósiles', grupo: 'u2v' },
    { id: 'carbon', nombre: 'Carbón', grupo: 'u3' }, { id: 'plata', nombre: 'Plata', grupo: 'u3' },
    { id: 'amatista', nombre: 'Amatista', grupo: 'u3' }, { id: 'hongo', nombre: 'Hongos luminosos', corto: 'Hongos', grupo: 'u3' },
    // Profundidades de la mina (bajo la fosa)
    { id: 'magma', nombre: 'Roca de magma', corto: 'Magma', grupo: 'u3p' }, { id: 'cristal_eco', nombre: 'Cristal resonante', corto: 'Cristal res.', grupo: 'u3p' },
    { id: 'baya', nombre: 'Bayas de invierno', corto: 'Bayas', grupo: 'u4' }, { id: 'hielo', nombre: 'Hielo', grupo: 'u4' },
    { id: 'escarcha', nombre: 'Cristal de escarcha', corto: 'Escarcha', grupo: 'u4' }, { id: 'zafiro', nombre: 'Zafiro', grupo: 'u4' },
    // Recurso exclusivo: solo se consigue en el desafío "Prisma estelar"
    { id: 'prisma', nombre: 'Prisma estelar', corto: 'Prisma', grupo: 'especial' },
    // Se atrapan en el desafío "Eclipse de luciérnagas"
    { id: 'luciernaga', nombre: 'Luciérnagas', grupo: 'especial' },
  ];
  const REC = Object.fromEntries(RECURSOS.map((r) => [r.id, r]));
  const nombreRec = (id) => (REC[id] ? REC[id].nombre.toLowerCase() : id);
  const ICONO = (id) => `assets/iconos/${id}.png`;

  // Herramientas y equipo (se fabrican una vez)
  const MEJORAS = [
    { id: 'pico', nombre: 'Pico de piedra', desc: 'Permite picar rocas para sacar piedra.', icono: 'pickaxe', costo: { madera: 12 } },
    { id: 'balde', nombre: 'Balde', desc: 'Permite sacar agua de los lagos.', icono: 'agua', costo: { madera: 10, piedra: 4 }, requiere: 'pico' },
    // Herramientas del Bosque profundo
    { id: 'ahumador', nombre: 'Ahumador', desc: 'Herramienta: calma a las abejas para recolectar miel de las colmenas del Bosque profundo.', icono: 'ahumador', costo: { madera: 12, piedra: 6, resina: 3 } },
    { id: 'hacha3', nombre: 'Hacha ancestral', desc: 'Más madera al talar y +2 de resina en los árboles gigantes del Bosque profundo.', icono: 'hacha3', costo: { resina: 12, madera: 30, cristal: 4 }, requiere: 'hacha2' },
    { id: 'amuleto', nombre: 'Amuleto ancestral', desc: 'Rompe el sello del santuario del Rey Jabalí Ancestral, en el Bosque profundo.', icono: 'amuleto', costo: { resina: 15, miel: 10, cristal: 6 } },
    { id: 'cana', nombre: 'Caña de pescar', desc: 'Herramienta: con ella puedes pescar en el muelle del gran lago del Bosque. No hace falta equiparla. Dura 5 pescas: cuando se rompe, fabrica otra.', icono: 'cana', costo: { madera: 14, agua: 4, cristal: 1 } },
    { id: 'espada', nombre: 'Espada de piedra', desc: 'Equipada, cada acierto en combate quita 2 de vida.', icono: 'espada', costo: { madera: 15, piedra: 10 }, requiere: 'pico' },
    { id: 'hacha2', nombre: 'Hacha de hierro', desc: 'Ganas 2 maderas más por cada árbol.', icono: 'axe', costo: { madera: 25, piedra: 15 }, requiere: 'pico' },
    { id: 'armadura', nombre: 'Armadura de cuero', desc: 'Equipada, tu vida máxima sube a 7 corazones.', icono: 'armadura', costo: { piedra: 25, agua: 6, cristal: 2 }, requiere: 'espada' },
    { id: 'pico2', nombre: 'Pico reforzado', desc: 'Más piedra y más cristales al picar rocas.', icono: 'pickaxe', costo: { madera: 20, piedra: 25, cristal: 2 }, requiere: 'hacha2' },
    { id: 'espada2', nombre: 'Espada de cristal', desc: 'Equipada, cada acierto en combate quita 3 de vida.', icono: 'espada', costo: { piedra: 20, cristal: 6 }, requiere: 'armadura' },
    { id: 'armadura2', nombre: 'Armadura de cristal', desc: 'Equipada, tu vida máxima sube a 9 corazones.', icono: 'armadura', costo: { agua: 12, cristal: 8 }, requiere: 'espada2' },
    // Equipo del desierto (Unidad 2)
    { id: 'cantimplora', nombre: 'Cantimplora', desc: 'Siempre activa: +1 corazón de vida máxima.', icono: 'cantimplora', costo: { fibra: 12, cobre: 4 }, requiere: 'pico' },
    // Herramientas del Valle de la Esfinge
    { id: 'pala', nombre: 'Pala de arqueólogo', desc: 'Herramienta: permite excavar en los sitios arqueológicos del Valle de la Esfinge (incluye la brocha).', icono: 'pala', costo: { fibra: 10, cobre: 6, arenisca: 10 }, requiere: 'pico' },
    { id: 'pala2', nombre: 'Pala de obsidiana', desc: 'Las excavaciones aguantan más golpes antes de derrumbarse y la pala cava más hondo.', icono: 'pala2', costo: { obsidiana: 10, fosil: 6, oro: 4 }, requiere: 'pala' },
    { id: 'antorcha_esfinge', nombre: 'Antorcha de la esfinge', desc: 'Ilumina el laberinto de la Gran Esfinge, en el Valle de la Esfinge: sin ella no puedes entrar.', icono: 'antorcha_esfinge', costo: { obsidiana: 6, fosil: 3, fibra: 8 } },
    { id: 'pico3', nombre: 'Pico de cobre', desc: 'Permite extraer oro de las vetas doradas y saca más arenisca y cobre.', icono: 'pickaxe', costo: { cobre: 10, arenisca: 15, fibra: 6 }, requiere: 'pico2' },
    { id: 'espada3', nombre: 'Espada de oro', desc: 'Equipada, cada acierto en combate quita 4 de vida.', icono: 'espada', costo: { oro: 8, cobre: 10 }, requiere: 'espada2' },
    { id: 'armadura3', nombre: 'Armadura de oro', desc: 'Equipada, tu vida máxima sube a 11 corazones.', icono: 'armadura', costo: { oro: 12, arenisca: 20, fibra: 10 }, requiere: 'armadura2' },
    // Equipo de la mina (Unidad 3)
    { id: 'casco', nombre: 'Casco de minero', desc: 'Siempre activo: +1 corazón de vida máxima y los gólems ya no te sorprenden.', icono: 'casco', costo: { carbon: 10, plata: 4, hongo: 4 }, requiere: 'pico' },
    // Herramientas de las Profundidades
    { id: 'guantes', nombre: 'Guantes térmicos', desc: 'Herramienta: protegen tus manos del calor para extraer roca de magma en las Profundidades de la mina.', icono: 'guantes', costo: { plata: 6, hongo: 8, carbon: 10 }, requiere: 'pico' },
    { id: 'cincel', nombre: 'Cincel de cristal', desc: 'Herramienta: permite desprender cristales resonantes de las Profundidades sin romperlos.', icono: 'cincel', costo: { plata: 8, carbon: 10, amatista: 2 }, requiere: 'pico' },
    { id: 'pico_magma', nombre: 'Pico de magma', desc: 'Saca más roca de magma y más carbón de las vetas de las Profundidades.', icono: 'pico_magma', costo: { magma: 12, plata: 10, cristal_eco: 4 }, requiere: 'pico4' },
    { id: 'corazon_cristal', nombre: 'Corazón de cristal', desc: 'Rompe el sello del Coloso de Magma, en la cámara de las Profundidades.', icono: 'corazon_cristal', costo: { cristal_eco: 12, magma: 10, amatista: 6 } },
    { id: 'pico4', nombre: 'Pico de plata', desc: 'Permite extraer amatista y saca más carbón y plata.', icono: 'pickaxe', costo: { plata: 10, carbon: 15, hongo: 6 }, requiere: 'pico2' },
    { id: 'espada4', nombre: 'Espada de amatista', desc: 'Equipada, cada acierto en combate quita 5 de vida.', icono: 'espada', costo: { amatista: 8, plata: 10 }, requiere: 'espada2' },
    { id: 'armadura4', nombre: 'Armadura de plata', desc: 'Equipada, tu vida máxima sube a 13 corazones.', icono: 'armadura', costo: { plata: 14, carbon: 20, amatista: 4 }, requiere: 'armadura2' },
    // Equipo del mundo helado (Unidad 4)
    { id: 'abrigo', nombre: 'Abrigo de piel', desc: 'Siempre activo: +1 corazón de vida máxima y la ventisca ya no te hace caminar lento.', icono: 'abrigo', costo: { baya: 8, hielo: 10, escarcha: 4 }, requiere: 'pico' },
    { id: 'pico5', nombre: 'Pico de escarcha', desc: 'Permite extraer zafiros y saca más hielo y escarcha.', icono: 'pickaxe', costo: { escarcha: 10, hielo: 15, baya: 6 }, requiere: 'pico2' },
    { id: 'espada5', nombre: 'Espada de hielo', desc: 'Equipada, cada acierto en combate quita 6 de vida.', icono: 'espada', costo: { zafiro: 8, escarcha: 10 }, requiere: 'espada2' },
    // Equipo exclusivo (Prisma estelar)
    { id: 'espada6', nombre: 'Espada prismática', desc: 'Exclusiva. Equipada, cada acierto en combate quita 10 de vida.', icono: 'espada_prisma', costo: { prisma: 10, cristal: 8, piedra: 20 }, requiere: 'espada2' },
    { id: 'armadura6', nombre: 'Armadura prismática', desc: 'Exclusiva. Equipada, tu vida máxima sube a 17 corazones.', icono: 'armadura_prisma', costo: { prisma: 10, cristal: 10, agua: 15 }, requiere: 'armadura2' },
    { id: 'armadura5', nombre: 'Armadura de escarcha', desc: 'Equipada, tu vida máxima sube a 15 corazones.', icono: 'armadura', costo: { escarcha: 14, hielo: 20, zafiro: 4 }, requiere: 'armadura2' },
  ];
  const NOMBRE_MEJORA = Object.fromEntries(MEJORAS.map((m) => [m.id, m.nombre]));
  // Equipo que se ve en el personaje
  const ARMAS = { espada: { nombre: 'Espada de piedra', danio: 2 }, espada2: { nombre: 'Espada de cristal', danio: 3 }, espada3: { nombre: 'Espada de oro', danio: 4 }, espada4: { nombre: 'Espada de amatista', danio: 5 }, espada5: { nombre: 'Espada de hielo', danio: 6 }, espada6: { nombre: 'Espada prismática', danio: 10 } };
  const ARMADURAS = { armadura: { nombre: 'Armadura de cuero', vida: 2, tex: 'cuero' }, armadura2: { nombre: 'Armadura de cristal', vida: 4, tex: 'cristal' }, armadura3: { nombre: 'Armadura de oro', vida: 6, tex: 'oro' }, armadura4: { nombre: 'Armadura de plata', vida: 8, tex: 'plata' }, armadura5: { nombre: 'Armadura de escarcha', vida: 10, tex: 'hielo' }, armadura6: { nombre: 'Armadura prismática', vida: 12, tex: 'prisma' } };
  const TEX_ARMADURA = ['nada', 'cuero', 'cristal', 'oro', 'plata', 'hielo', 'prisma'];
  const cuerpoDe = (pj) => (pj === 'luna' || pj === 'copihue' ? 'thin' : 'male');
  const texArmadura = (id) => (ARMADURAS[id] ? ARMADURAS[id].tex : 'nada');

  // Banco de decorativos y muebles (se pueden fabricar varias veces).
  // t: [columna, fila, ancho, alto] en la hoja ('o' = exterior, 'i' = interior). lugar: base, pieza o ambos.
  // pie: filas que ocupa en el suelo · piso: alfombra (se pisa) · pared: se cuelga · paso: se puede caminar encima
  // excl: solo se obtiene como premio al subir de nivel
  const D = (id, nombre, cat, lugar, h, t, costo, extra = {}) => ({ id, nombre, cat, lugar, h, t, costo, tex: `d_${id}`, ...extra });
  const OBJETOS = [
    // ----- Base (exterior)
    D('carpa_b', 'Carpa', 'Carpas', 'base', 'o', [48, 10, 2, 2], { madera: 20, piedra: 5 }, { carpa: true, pie: 1 }),
    D('carpa_v', 'Carpa verde', 'Carpas', 'base', 'o', [46, 10, 2, 2], { madera: 20, agua: 5 }, { carpa: true, pie: 1 }),
    D('flores', 'Flores rojas', 'Jardín', 'base', 'o', [29, 9, 1, 1], { agua: 1 }, { paso: true }),
    D('flor_a', 'Flores azules', 'Jardín', 'base', 'o', [28, 9, 1, 1], { agua: 1 }, { paso: true }),
    D('flor_m', 'Flores moradas', 'Jardín', 'base', 'o', [30, 9, 1, 1], { agua: 1 }, { paso: true }),
    D('flor_b', 'Flores blancas', 'Jardín', 'base', 'o', [31, 9, 1, 1], { agua: 1 }, { paso: true }),
    D('hongo', 'Hongo', 'Jardín', 'base', 'o', [48, 2, 1, 1], { agua: 1 }, { paso: true }),
    D('hongo2', 'Hongo moteado', 'Jardín', 'base', 'o', [48, 4, 1, 1], { agua: 2 }, { paso: true }),
    D('arbusto', 'Arbusto', 'Jardín', 'base', 'o', [19, 9, 1, 1], { agua: 2 }),
    D('arbusto_o', 'Arbusto otoñal', 'Jardín', 'base', 'o', [20, 9, 1, 1], { agua: 2 }),
    D('arbusto_f', 'Arbusto con frutos', 'Jardín', 'base', 'o', [24, 9, 1, 1], { agua: 3 }),
    D('arbusto_fl', 'Arbusto florido', 'Jardín', 'base', 'o', [25, 10, 1, 1], { agua: 3 }),
    D('manzano', 'Manzano', 'Árboles y rocas', 'base', 'o', [23, 10, 1, 2], { madera: 2, agua: 4 }),
    D('pino', 'Pino', 'Árboles y rocas', 'base', 'o', [18, 10, 1, 2], { madera: 2, agua: 3 }),
    D('arce', 'Arce otoñal', 'Árboles y rocas', 'base', 'o', [14, 10, 1, 2], { madera: 2, agua: 4 }),
    D('cactus', 'Cactus', 'Árboles y rocas', 'base', 'o', [22, 9, 1, 1], { agua: 2, piedra: 1 }),
    D('roca', 'Roca con musgo', 'Árboles y rocas', 'base', 'o', [54, 22, 1, 1], { piedra: 4 }),
    D('roca_gris', 'Roca gris', 'Árboles y rocas', 'base', 'o', [54, 21, 1, 1], { piedra: 3 }),
    D('cerco', 'Cerco', 'Construcción', 'base', 'o', [52, 23, 1, 1], { madera: 2 }),
    D('poste', 'Poste', 'Construcción', 'base', 'o', [50, 23, 1, 1], { madera: 1 }),
    D('letrero', 'Letrero', 'Construcción', 'base', 'o', [19, 0, 1, 1], { madera: 3 }),
    D('lena', 'Leña', 'Construcción', 'base', 'o', [13, 8, 1, 1], { madera: 3 }),
    D('barril', 'Barril', 'Construcción', 'ambos', 'o', [23, 0, 1, 1], { madera: 6 }),
    D('barril2', 'Barril pequeño', 'Construcción', 'ambos', 'o', [24, 0, 1, 1], { madera: 4 }),
    D('cajon', 'Cajón', 'Construcción', 'ambos', 'o', [27, 1, 1, 1], { madera: 5 }),
    D('mesa_ext', 'Mesa de trabajo', 'Construcción', 'base', 'o', [16, 0, 1, 1], { madera: 5 }),
    D('yunque', 'Yunque', 'Taller', 'base', 'o', [15, 0, 1, 1], { piedra: 8 }),
    D('horno', 'Horno de piedra', 'Taller', 'base', 'o', [13, 0, 1, 1], { piedra: 10, madera: 2 }),
    D('antorcha', 'Antorcha', 'Luces y fuego', 'base', 'o', [17, 8, 1, 1], { madera: 2, cristal: 1 }),
    D('fogata2', 'Fogata', 'Luces y fuego', 'base', 'o', [14, 8, 1, 1], { madera: 6, piedra: 2 }),
    D('candelabro', 'Candelabro', 'Luces y fuego', 'ambos', 'o', [19, 8, 1, 1], { piedra: 3, cristal: 1 }),
    // Desierto (se fabrican con los recursos de la Unidad 2)
    D('cactus_d', 'Cactus', 'Desierto', 'base', 'o', [22, 9, 1, 1], { fibra: 3 }),
    D('cactus_fruto', 'Cactus con fruto', 'Desierto', 'base', 'o', [26, 10, 1, 1], { fibra: 4, agua: 1 }),
    D('arbol_seco', 'Árbol seco', 'Desierto', 'base', 'o', [27, 9, 1, 1], { fibra: 2, arenisca: 2 }),
    D('roca_duna', 'Roca del desierto', 'Desierto', 'base', 'c', [3, 1, 1, 1], { arenisca: 5 }),
    D('aguja', 'Aguja de roca', 'Desierto', 'base', 'c', [0, 0, 1, 1], { arenisca: 4 }),
    D('columna', 'Columna de arenisca', 'Desierto', 'base', 'o', [13, 19, 1, 2], { arenisca: 8 }),
    D('columna_rota', 'Columna rota', 'Desierto', 'base', 'o', [14, 19, 1, 2], { arenisca: 6 }),
    D('escombros', 'Escombros de arenisca', 'Desierto', 'base', 'o', [13, 18, 1, 1], { arenisca: 3 }),
    D('calavera', 'Calavera', 'Desierto', 'base', 'c', [0, 2, 1, 1], { arenisca: 1, fibra: 1 }, { paso: true }),
    D('huesos', 'Huesos antiguos', 'Desierto', 'base', 'c', [3, 2, 1, 1], { arenisca: 2, fibra: 1 }, { paso: true }),
    D('brasero', 'Brasero de cobre', 'Desierto', 'ambos', 'c', [14, 17, 1, 1], { cobre: 4, arenisca: 2 }),
    D('vasija', 'Vasija de barro', 'Desierto', 'ambos', 'c', [14, 15, 1, 1], { arenisca: 4, cobre: 1 }),
    D('saco_oro', 'Saco de oro', 'Desierto', 'ambos', 'o', [43, 10, 1, 1], { oro: 3, fibra: 2 }),
    D('lingotes', 'Lingotes de oro', 'Desierto', 'ambos', 'o', [45, 11, 1, 1], { oro: 4, cobre: 2 }),
    D('monedas_oro', 'Monedas de oro', 'Desierto', 'ambos', 'o', [45, 10, 1, 1], { oro: 2 }, { paso: true }),
    // Mina (se fabrican con los recursos de la Unidad 3)
    D('entrada_mina', 'Entrada de túnel', 'Mina', 'base', 'c', [4, 7, 4, 3], { carbon: 12, plata: 2 }, { pie: 1 }),
    D('pilar_mina', 'Pilar de piedra', 'Mina', 'base', 'c', [0, 5, 1, 2], { carbon: 6, plata: 1 }),
    D('pilar_roto', 'Pilar agrietado', 'Mina', 'base', 'c', [3, 5, 1, 2], { carbon: 5 }),
    D('estalagmita', 'Estalagmita', 'Mina', 'base', 'c', [5, 0, 1, 1], { carbon: 3 }),
    D('roca_musgo_c', 'Roca con musgo', 'Mina', 'base', 'c', [6, 1, 1, 1], { carbon: 3, hongo: 1 }),
    D('caja_mina', 'Caja de la mina', 'Mina', 'ambos', 'c', [5, 5, 1, 1], { carbon: 3, madera: 2 }),
    D('cajones_mina', 'Cajones apilados', 'Mina', 'ambos', 'c', [6, 5, 1, 2], { carbon: 5, madera: 3 }),
    D('rieles', 'Rieles', 'Mina', 'base', 'c', [10, 16, 1, 1], { plata: 2, carbon: 2 }, { piso: true }),
    D('hongos_rojos', 'Hongos rojos', 'Mina', 'ambos', 'c', [1, 3, 1, 1], { hongo: 3 }, { paso: true }),
    D('hongos_blancos', 'Hongos blancos', 'Mina', 'ambos', 'c', [0, 3, 1, 1], { hongo: 3 }, { paso: true }),
    D('liana', 'Liana colgante', 'Mina', 'base', 'c', [4, 3, 1, 2], { hongo: 4 }),
    D('brasero_mina', 'Brasero de carbón', 'Mina', 'ambos', 'c', [14, 17, 1, 1], { carbon: 4, plata: 1 }),
    D('mineral_plata', 'Mineral de plata', 'Mina', 'ambos', 'c', [14, 16, 1, 1], { plata: 3 }, { paso: true }),
    D('geoda', 'Geoda de amatista', 'Mina', 'ambos', 'c', [10, 12, 1, 1], { amatista: 3, carbon: 2 }),
    // Invierno (se fabrican con los recursos de la Unidad 4)
    D('muneco_nieve', 'Muñeco de nieve', 'Invierno', 'base', 'n', [10, 1, 1, 1], { hielo: 3, baya: 1 }),
    D('iglu', 'Iglú', 'Invierno', 'base', 'n', [13, 1, 2, 1], { hielo: 14, escarcha: 2 }),
    D('pino_nevado', 'Pino nevado', 'Invierno', 'base', 'n', [4, 0, 1, 2], { hielo: 2, baya: 2 }),
    D('roble_nevado', 'Árbol nevado', 'Invierno', 'base', 'n', [6, 0, 1, 2], { hielo: 2, baya: 2 }),
    D('arbol_helado', 'Árbol seco nevado', 'Invierno', 'base', 'n', [10, 0, 1, 1], { hielo: 2 }),
    D('arbusto_nieve', 'Arbusto nevado', 'Invierno', 'base', 'n', [5, 1, 1, 1], { baya: 2, hielo: 1 }),
    D('monton_nieve', 'Montón de nieve', 'Invierno', 'base', 'n', [6, 1, 1, 1], { hielo: 1 }, { paso: true }),
    D('bloque_hielo', 'Bloque de hielo', 'Invierno', 'ambos', 'n', [7, 1, 1, 1], { hielo: 4 }),
    D('cerco_nevado', 'Cerco nevado', 'Invierno', 'base', 'n', [8, 1, 1, 1], { hielo: 1, madera: 1 }),
    D('trineo', 'Trineo', 'Invierno', 'ambos', 'n', [15, 1, 1, 1], { madera: 4, hielo: 2 }),
    D('pinguino', 'Pingüino', 'Invierno', 'ambos', 'n', [0, 2, 1, 1], { baya: 3, hielo: 2 }),
    D('cristal_escarcha', 'Cristal de escarcha', 'Invierno', 'ambos', 'n', [2, 1, 1, 1], { escarcha: 3 }, { paso: true }),
    D('zafiros', 'Zafiros', 'Invierno', 'ambos', 'n', [3, 1, 1, 1], { zafiro: 2, escarcha: 1 }, { paso: true }),
    // Bosque profundo: se fabrican con resina y miel (hoja propia)
    D('colmena_dec', 'Colmena', 'Bosque profundo', 'base', 'f', [2, 0, 1, 1], { miel: 3, madera: 3 }),
    D('tronco_gigante', 'Tocón ancestral', 'Bosque profundo', 'base', 'f', [11, 0, 2, 2], { resina: 4, madera: 10 }),
    D('columna_musgo', 'Columna con musgo', 'Bosque profundo', 'base', 'f', [9, 0, 1, 2], { resina: 2, piedra: 8 }),
    D('columna_rota_musgo', 'Columna rota con musgo', 'Bosque profundo', 'base', 'f', [10, 0, 1, 2], { resina: 2, piedra: 6 }),
    D('farol_ambar', 'Farol de ámbar', 'Bosque profundo', 'ambos', 'f', [13, 0, 1, 1], { resina: 4, cristal: 1 }, { brillo: 0xffb040 }),
    D('helecho', 'Helecho', 'Bosque profundo', 'base', 'f', [8, 0, 1, 1], { resina: 1, agua: 2 }, { paso: true }),
    D('arbusto_miel', 'Arbusto de miel', 'Bosque profundo', 'base', 'f', [8, 4, 1, 1], { miel: 3, agua: 2 }),
    D('altar_bosque', 'Altar del bosque', 'Bosque profundo', 'base', 'f', [7, 0, 1, 1], { resina: 6, piedra: 10 }),
    D('estatua_jabali', 'Estatua del Rey Jabalí', 'Bosque profundo', 'base', 'f', [4, 4, 2, 3], {}, { excl: true, trofeo: true, pie: 2 }),
    D('tarro_miel', 'Tarros de miel', 'Bosque profundo', 'pieza', 'f', [1, 4, 1, 1], { miel: 4 }),
    D('lampara_ambar', 'Lámpara de ámbar', 'Bosque profundo', 'pieza', 'f', [14, 0, 1, 2], { resina: 5, cristal: 1 }, { brillo: 0xffb040 }),
    D('mesa_raiz', 'Mesa de raíz', 'Bosque profundo', 'pieza', 'f', [15, 0, 1, 1], { resina: 3, madera: 8 }),
    D('sillon_musgo', 'Sillón de musgo', 'Bosque profundo', 'pieza', 'f', [0, 4, 1, 1], { resina: 2, madera: 6 }),
    D('cama_hojas', 'Cama de hojas', 'Bosque profundo', 'pieza', 'f', [6, 4, 1, 2], { resina: 4, madera: 10, miel: 2 }, { pie: 2 }),
    D('vela_miel', 'Vela de miel', 'Bosque profundo', 'pieza', 'f', [7, 4, 1, 1], { miel: 2 }, { paso: true, brillo: 0xffb040 }),
    D('alfombra_musgo', 'Alfombra de musgo', 'Bosque profundo', 'pieza', 'f', [9, 4, 3, 2], { resina: 3, agua: 4 }, { piso: true }),
    D('acuario', 'Acuario', 'Bosque profundo', 'pieza', 'f', [2, 4, 2, 1], {}, { excl: true, album: true }),
    // Exclusivos del Prisma estelar (hoja propia)
    D('cristal_prisma', 'Cristal prismático', 'Prismáticos', 'ambos', 'p', [0, 0, 1, 1], { prisma: 1, cristal: 2 }),
    D('estandarte_prisma', 'Estandarte arcoíris', 'Prismáticos', 'base', 'p', [1, 0, 1, 3], { prisma: 1, madera: 4 }),
    D('arbol_prisma', 'Árbol de cristal', 'Prismáticos', 'base', 'p', [2, 0, 1, 2], { prisma: 1, agua: 4 }),
    D('obelisco_prisma', 'Obelisco prismático', 'Prismáticos', 'base', 'p', [3, 0, 1, 2], { prisma: 1, piedra: 8 }),
    D('geoda_prisma', 'Cristales prismáticos', 'Prismáticos', 'ambos', 'p', [4, 0, 1, 1], { prisma: 1 }, { paso: true }),
    D('farol_prisma', 'Candelabro prismático', 'Prismáticos', 'ambos', 'p', [5, 0, 1, 1], { prisma: 1, piedra: 3 }),
    D('arbusto_prisma', 'Arbusto de cristal', 'Prismáticos', 'base', 'p', [6, 0, 1, 1], { prisma: 1, agua: 2 }),
    D('torre_prisma', 'Aguja de cristal', 'Prismáticos', 'base', 'p', [7, 0, 1, 1], { prisma: 1, piedra: 4 }),
    D('cama_prisma', 'Cama prismática', 'Prismáticos', 'pieza', 'p', [8, 0, 1, 2], { prisma: 1, madera: 8 }, { pie: 2 }),
    D('lampara_prisma', 'Lámpara prismática', 'Prismáticos', 'pieza', 'p', [9, 0, 1, 2], { prisma: 1, cristal: 2 }),
    D('espejo_prisma', 'Espejo arcoíris', 'Prismáticos', 'pieza', 'p', [10, 0, 1, 2], { prisma: 1, cristal: 2 }, { pared: true }),
    D('sillon_prisma', 'Sillón prismático', 'Prismáticos', 'pieza', 'p', [11, 0, 1, 1], { prisma: 1, madera: 4 }),
    D('alfombra_prisma', 'Alfombra arcoíris', 'Prismáticos', 'pieza', 'p', [0, 3, 3, 1], { prisma: 1, agua: 3 }, { piso: true }),
    D('piano_prisma', 'Piano de cristal', 'Prismáticos', 'pieza', 'p', [3, 3, 2, 2], { prisma: 2, madera: 10 }, { pie: 2 }),
    D('jarron_prisma', 'Jarrón prismático', 'Prismáticos', 'pieza', 'p', [5, 3, 1, 1], { prisma: 1 }),
    // De luciérnagas (se consiguen en el desafío del eclipse); brillan con luz propia
    D('frasco_luz', 'Frasco de luciérnagas', 'Luciérnagas', 'ambos', 'l', [0, 0, 1, 1], { luciernaga: 3 }, { brillo: true }),
    D('farol_luz', 'Farol de luciérnagas', 'Luciérnagas', 'base', 'l', [1, 0, 1, 1], { luciernaga: 3, madera: 2 }, { brillo: true }),
    D('arbol_luz', 'Árbol de luciérnagas', 'Luciérnagas', 'base', 'l', [2, 0, 1, 2], { luciernaga: 6, agua: 3 }, { brillo: true }),
    D('arbusto_luz', 'Arbusto luminoso', 'Luciérnagas', 'base', 'l', [3, 0, 1, 1], { luciernaga: 4, agua: 2 }, { brillo: true }),
    D('hongos_luz', 'Hongos brillantes', 'Luciérnagas', 'ambos', 'l', [4, 0, 1, 1], { luciernaga: 3 }, { brillo: true, paso: true }),
    D('poste_luz', 'Poste con luciérnagas', 'Luciérnagas', 'base', 'l', [5, 0, 1, 1], { luciernaga: 3, madera: 2 }, { brillo: true }),
    D('lampara_luz', 'Lámpara de luciérnagas', 'Luciérnagas', 'pieza', 'l', [6, 0, 1, 2], { luciernaga: 5, piedra: 3 }, { brillo: true }),
    D('velador_luz', 'Velador de luciérnagas', 'Luciérnagas', 'pieza', 'l', [7, 0, 1, 1], { luciernaga: 4, cristal: 1 }, { brillo: true }),
    D('cama_luz', 'Cama noche estrellada', 'Luciérnagas', 'pieza', 'l', [8, 0, 1, 2], { luciernaga: 8, madera: 10 }, { brillo: true, pie: 2 }),
    D('cuadro_luz', 'Cuadro de luciérnagas', 'Luciérnagas', 'pieza', 'l', [9, 0, 1, 1], { luciernaga: 4, madera: 2 }, { brillo: true, pared: true }),
    D('alfombra_luz', 'Alfombra nocturna', 'Luciérnagas', 'pieza', 'l', [0, 2, 3, 2], { luciernaga: 6, agua: 3 }, { brillo: true, piso: true }),
    D('planta_luz', 'Planta luminosa', 'Luciérnagas', 'pieza', 'l', [3, 2, 1, 1], { luciernaga: 3, agua: 2 }, { brillo: true }),
    // Valle de la Esfinge: se fabrican con obsidiana y fósiles (hoja propia)
    D('esfinge_mini', 'Esfinge de arenisca', 'Valle de la Esfinge', 'base', 'v', [2, 3, 2, 2], { arenisca: 12, fosil: 2, oro: 2 }, { pie: 1 }),
    D('piramide', 'Pirámide', 'Valle de la Esfinge', 'base', 'v', [4, 0, 3, 2], { arenisca: 16, oro: 2 }, { pie: 1 }),
    D('obelisco', 'Obelisco', 'Valle de la Esfinge', 'base', 'v', [8, 3, 1, 3], { obsidiana: 3, arenisca: 8 }),
    D('estatua_chacal', 'Estatua del chacal', 'Valle de la Esfinge', 'base', 'v', [10, 3, 1, 2], { obsidiana: 4, oro: 1 }),
    D('palmera', 'Palmera datilera', 'Valle de la Esfinge', 'base', 'v', [9, 3, 1, 2], { fibra: 4, agua: 2 }),
    D('papiro', 'Papiros', 'Valle de la Esfinge', 'base', 'v', [2, 6, 1, 1], { fibra: 2, agua: 1 }, { paso: true }),
    D('columna_jero', 'Columna con jeroglíficos', 'Valle de la Esfinge', 'base', 'v', [12, 3, 1, 2], { arenisca: 6, fosil: 1 }),
    D('columna_jero_rota', 'Columna rota con jeroglíficos', 'Valle de la Esfinge', 'base', 'v', [13, 3, 1, 2], { arenisca: 5, fosil: 1 }),
    D('esqueleto_dino', 'Esqueleto de dinosaurio', 'Valle de la Esfinge', 'base', 'v', [7, 0, 3, 2], { fosil: 8, arenisca: 4 }, { pie: 1 }),
    D('antorcha_obsidiana', 'Antorcha de obsidiana', 'Valle de la Esfinge', 'ambos', 'v', [8, 6, 1, 1], { obsidiana: 2, fibra: 2 }, { brillo: 0xff9a40 }),
    D('sarcofago', 'Sarcófago dorado', 'Valle de la Esfinge', 'ambos', 'v', [11, 3, 1, 2], { oro: 3, arenisca: 6 }),
    D('mesa_obsidiana', 'Mesa de obsidiana', 'Valle de la Esfinge', 'pieza', 'v', [6, 6, 1, 1], { obsidiana: 4, arenisca: 2 }),
    D('lampara_obsidiana', 'Lámpara de obsidiana', 'Valle de la Esfinge', 'pieza', 'v', [14, 3, 1, 2], { obsidiana: 3, cobre: 2 }, { brillo: 0xffd27a }),
    D('trono', 'Trono del faraón', 'Valle de la Esfinge', 'pieza', 'v', [5, 6, 1, 1], { oro: 3, arenisca: 4, fibra: 2 }),
    D('cofre_reliquias', 'Cofre de reliquias', 'Valle de la Esfinge', 'pieza', 'v', [4, 6, 1, 1], { fosil: 2, cobre: 3 }),
    D('jarron_dorado', 'Jarrón dorado', 'Valle de la Esfinge', 'ambos', 'v', [3, 6, 1, 1], { oro: 2 }),
    D('cuadro_fosil', 'Fósil enmarcado', 'Valle de la Esfinge', 'pieza', 'v', [7, 6, 1, 1], { fosil: 2, fibra: 1 }, { pared: true }),
    D('vitrina_fosiles', 'Vitrina de fósiles', 'Valle de la Esfinge', 'pieza', 'v', [15, 3, 1, 2], { fosil: 5, obsidiana: 2 }),
    D('alfombra_jero', 'Alfombra jeroglífica', 'Valle de la Esfinge', 'pieza', 'v', [10, 0, 3, 2], { fibra: 8, oro: 1 }, { piso: true }),
    D('vitrina_gemas', 'Vitrina de gemas', 'Valle de la Esfinge', 'pieza', 'v', [0, 3, 2, 2], {}, { excl: true, album: 'gemas', brillo: 0xc8a0ff }),
    // Profundidades de la mina: se fabrican con roca de magma y cristal resonante (hoja propia)
    D('brasero_magma', 'Brasero de magma', 'Profundidades', 'ambos', 'a', [6, 3, 1, 1], { magma: 3, carbon: 2 }, { brillo: 0xff7a20 }),
    D('columna_cristal', 'Columna de cristal', 'Profundidades', 'base', 'a', [11, 0, 1, 2], { cristal_eco: 3, plata: 2 }, { brillo: 0x8fd8ff }),
    D('estalagmita_magma', 'Estalagmita de magma', 'Profundidades', 'base', 'a', [2, 3, 1, 1], { magma: 2, carbon: 2 }),
    D('roca_lava', 'Roca de lava', 'Profundidades', 'base', 'a', [3, 3, 1, 1], { magma: 2 }),
    D('geoda', 'Geoda', 'Profundidades', 'ambos', 'a', [7, 3, 1, 1], { cristal_eco: 2, amatista: 1 }),
    D('cristal_flotante', 'Cristal flotante', 'Profundidades', 'ambos', 'a', [10, 3, 1, 1], { cristal_eco: 2 }, { brillo: 0x9fb8ff }),
    D('altar_cristal', 'Altar de cristal', 'Profundidades', 'base', 'a', [10, 0, 1, 2], { cristal_eco: 4, plata: 3 }, { brillo: 0x8fd8ff }),
    D('vagoneta', 'Vagoneta', 'Profundidades', 'ambos', 'a', [11, 3, 1, 1], { plata: 3, carbon: 4 }),
    D('lampara_cristal', 'Lámpara de cristal', 'Profundidades', 'pieza', 'a', [12, 0, 1, 2], { cristal_eco: 3, plata: 2 }, { brillo: 0x9fd8ff }),
    D('mesa_magma', 'Mesa de magma', 'Profundidades', 'pieza', 'a', [8, 3, 1, 1], { magma: 4, carbon: 3 }),
    D('sillon_piedra', 'Sillón de piedra', 'Profundidades', 'pieza', 'a', [9, 3, 1, 1], { carbon: 6, cristal_eco: 1 }),
    D('cama_cristal', 'Cama de cristal', 'Profundidades', 'pieza', 'a', [13, 0, 1, 2], { cristal_eco: 5, plata: 4, hongo: 2 }, { pie: 2 }),
    D('estante_geodas', 'Estante de geodas', 'Profundidades', 'pieza', 'a', [14, 0, 1, 2], { cristal_eco: 3, carbon: 4, madera: 2 }),
    D('alfombra_cristal', 'Alfombra de cristal', 'Profundidades', 'pieza', 'a', [3, 0, 3, 2], { cristal_eco: 4, hongo: 3 }, { piso: true }),
    D('estatua_coloso', 'Estatua del Coloso de Magma', 'Profundidades', 'base', 'a', [8, 0, 2, 3], {}, { excl: true, pie: 2, premio: 'Premio por vencer al Coloso de Magma' }),
    D('vagoneta_dorada', 'Vagoneta dorada', 'Profundidades', 'ambos', 'a', [12, 3, 1, 1], {}, { excl: true, premio: 'Premio por ganar tu primera carrera de vagonetas' }),
    D('band_r', 'Estandarte rojo', 'Exclusivos', 'base', 'o', [49, 0, 1, 3], {}, { excl: true }),
    D('band_t', 'Estandarte turquesa', 'Exclusivos', 'base', 'o', [49, 3, 1, 3], {}, { excl: true }),
    D('band_v', 'Estandarte verde', 'Exclusivos', 'base', 'o', [49, 6, 1, 3], {}, { excl: true }),
    D('cristal_g', 'Cristal gigante', 'Exclusivos', 'base', 'o', [50, 9, 1, 1], {}, { excl: true }),
    D('oro', 'Montón de oro', 'Exclusivos', 'ambos', 'o', [43, 11, 1, 1], {}, { excl: true }),
    // ----- Pieza (interior de la carpa)
    D('cama_n', 'Cama naranja', 'Camas', 'pieza', 'i', [14, 9, 1, 2], { madera: 12, agua: 4 }, { pie: 2 }),
    D('cama_v', 'Cama verde', 'Camas', 'pieza', 'i', [14, 11, 1, 2], { madera: 12, agua: 4 }, { pie: 2 }),
    D('mesa_oval', 'Mesa ovalada', 'Mesas y sillas', 'pieza', 'i', [3, 0, 2, 1], { madera: 10 }),
    D('mesa_larga', 'Mesa larga', 'Mesas y sillas', 'pieza', 'i', [0, 0, 3, 1], { madera: 14 }),
    D('mesa_red', 'Mesa redonda', 'Mesas y sillas', 'pieza', 'i', [7, 0, 1, 1], { madera: 6 }),
    D('escritorio', 'Escritorio', 'Mesas y sillas', 'pieza', 'i', [13, 12, 1, 1], { madera: 8 }),
    D('silla', 'Silla', 'Mesas y sillas', 'pieza', 'i', [0, 2, 1, 1], { madera: 3 }, { paso: true }),
    D('silla_l', 'Silla de lado', 'Mesas y sillas', 'pieza', 'i', [2, 2, 1, 1], { madera: 3 }, { paso: true }),
    D('sillon', 'Sillón', 'Mesas y sillas', 'pieza', 'i', [0, 6, 1, 1], { madera: 6, agua: 1 }),
    D('silla_b', 'Silla blanca', 'Mesas y sillas', 'pieza', 'i', [0, 8, 1, 1], { piedra: 3, madera: 1 }, { paso: true }),
    D('cocina', 'Cocina', 'Cocina', 'pieza', 'i', [14, 15, 1, 1], { piedra: 8, cristal: 1 }),
    D('lavaplatos', 'Lavaplatos', 'Cocina', 'pieza', 'i', [8, 12, 1, 1], { piedra: 6, agua: 3 }),
    D('encimera', 'Mueble con frascos', 'Cocina', 'pieza', 'i', [5, 12, 1, 1], { madera: 6, agua: 1 }),
    D('mueble', 'Mueble de cocina', 'Cocina', 'pieza', 'i', [0, 13, 1, 1], { madera: 6 }),
    D('refri', 'Refrigerador', 'Cocina', 'pieza', 'i', [25, 8, 1, 2], { piedra: 8, cristal: 2 }),
    D('olla', 'Olla', 'Cocina', 'pieza', 'i', [21, 4, 1, 1], { piedra: 2 }, { paso: true }),
    D('vela', 'Vela', 'Lámparas', 'pieza', 'i', [16, 6, 1, 1], { madera: 1, cristal: 1 }, { paso: true }),
    D('cand_mesa', 'Lámpara de tres velas', 'Lámparas', 'pieza', 'i', [16, 7, 1, 1], { piedra: 2, cristal: 1 }),
    D('cand_pl', 'Lámpara de plata', 'Lámparas', 'pieza', 'i', [19, 0, 1, 1], { piedra: 3, cristal: 1 }),
    D('pie_pl', 'Lámpara de pie', 'Lámparas', 'pieza', 'i', [19, 4, 1, 2], { piedra: 4, cristal: 2 }),
    D('ant_pared', 'Antorcha de pared', 'Lámparas', 'pieza', 'i', [21, 6, 1, 1], { madera: 2, cristal: 1 }, { pared: true }),
    D('alf_n', 'Alfombra naranja', 'Alfombras', 'pieza', 'i', [16, 8, 3, 2], { agua: 4, madera: 2 }, { piso: true }),
    D('alf_v', 'Alfombra verde', 'Alfombras', 'pieza', 'i', [16, 10, 3, 2], { agua: 4, madera: 2 }, { piso: true }),
    D('alf_oval', 'Alfombra ovalada', 'Alfombras', 'pieza', 'i', [19, 8, 2, 1], { agua: 3 }, { piso: true }),
    D('alf_ovalv', 'Alfombra ovalada verde', 'Alfombras', 'pieza', 'i', [19, 10, 2, 1], { agua: 3 }, { piso: true }),
    D('tapiz', 'Alfombra turquesa', 'Alfombras', 'pieza', 'i', [16, 14, 3, 1], { agua: 3, cristal: 1 }, { piso: true }),
    D('tapiz_n', 'Alfombra dorada', 'Alfombras', 'pieza', 'i', [16, 15, 3, 1], { agua: 3, cristal: 1 }, { piso: true }),
    D('tapiz_v', 'Alfombra de hojas', 'Alfombras', 'pieza', 'i', [16, 16, 3, 1], { agua: 3, cristal: 1 }, { piso: true }),
    D('cuadro_v', 'Cuadro de paisaje', 'Para la pared', 'pieza', 'i', [19, 12, 1, 1], { madera: 2, agua: 2 }, { pared: true }),
    D('cuadro_n', 'Cuadro del atardecer', 'Para la pared', 'pieza', 'i', [19, 13, 1, 1], { madera: 2, agua: 2 }, { pared: true }),
    D('cuadro_t', 'Cuadro del mar', 'Para la pared', 'pieza', 'i', [19, 14, 1, 1], { madera: 2, agua: 2 }, { pared: true }),
    D('escudo', 'Escudo redondo', 'Para la pared', 'pieza', 'i', [22, 8, 1, 1], { piedra: 4 }, { pared: true }),
    D('reloj', 'Reloj cucú', 'Para la pared', 'pieza', 'o', [26, 8, 1, 1], { madera: 6, cristal: 1 }, { pared: true }),
    D('chimenea', 'Chimenea', 'Para la pared', 'pieza', 'o', [54, 8, 1, 1], { piedra: 12, madera: 4 }, { pared: true }),
    D('planta', 'Planta', 'Adornos', 'pieza', 'i', [16, 0, 1, 1], { agua: 3 }),
    D('planta2', 'Helecho', 'Adornos', 'pieza', 'i', [17, 0, 1, 1], { agua: 3 }),
    D('libros', 'Estante con libros', 'Adornos', 'pieza', 'i', [20, 17, 1, 1], { madera: 8 }),
    D('libros2', 'Librero', 'Adornos', 'pieza', 'i', [21, 17, 1, 1], { madera: 8 }),
    D('jarron', 'Jarrón de cobre', 'Adornos', 'pieza', 'i', [16, 4, 1, 1], { cobre: 2, agua: 1 }),
    D('tapiz_fibra', 'Alfombra de fibra', 'Alfombras', 'pieza', 'i', [0, 9, 3, 1], { fibra: 6 }, { piso: true }),
    D('lampara_cobre', 'Lámpara de cobre', 'Lámparas', 'pieza', 'i', [16, 7, 1, 1], { cobre: 3, cristal: 1 }),
    D('cama_doble', 'Cama doble', 'Exclusivos', 'pieza', 'i', [14, 6, 2, 2], {}, { excl: true, pie: 2 }),
    D('piano', 'Piano', 'Exclusivos', 'pieza', 'i', [23, 8, 2, 2], {}, { excl: true, pie: 2 }),
    D('pie_or', 'Lámpara de oro', 'Exclusivos', 'pieza', 'i', [20, 4, 1, 2], {}, { excl: true }),
    D('jarron_p', 'Jarrón de plata', 'Exclusivos', 'pieza', 'i', [17, 4, 1, 1], {}, { excl: true }),
    D('mapa', 'Mapa enmarcado', 'Exclusivos', 'pieza', 'i', [20, 12, 2, 1], {}, { excl: true, pared: true }),
    D('espejo', 'Espejo', 'Exclusivos', 'pieza', 'i', [22, 14, 1, 2], {}, { excl: true, pared: true }),
    D('escudo2', 'Escudo real', 'Exclusivos', 'pieza', 'i', [22, 10, 1, 1], {}, { excl: true, pared: true }),
  ];
  const OBJ = Object.fromEntries(OBJETOS.map((o) => [o.id, o]));

  // Mundos: uno por unidad
  const MUNDOS = {
    u1: { nombre: { '7basico': 'Bosque de los Enteros', '8basico': 'Bosque de las Potencias' }, semilla: 11, fondo: '#2f6b47',
      suelo: [[5, 0, 1], [5, 1, 0.15]], arboles: ['arbol_manzano', 'arbol_redondo', 'arbol_pino', 'arbol_otono'], nArboles: 175,
      rocas: ['roca3'], nRocas: 48, lagos: 3, granLago: true, profundo: true, cofres: 9, arbustos: 14, nieblas: 5, bichos: 0.18 },
    // Unidad 2: desierto con recursos propios (fibra de cactus, arenisca, cobre y oro)
    u2: { nombre: { '7basico': 'Desierto Algebraico', '8basico': 'Dunas de las Funciones' }, tipo: 'desierto', recursos: 'u2', semilla: 22, fondo: '#d8c08a',
      suelo: [[8, 22, 1], [3, 19, 0.07]], valle: true, nCactus: 120, nRocas: 66, vetasCobre: 19, vetasOro: 9, oasis: 5, cofres: 11,
      escorpiones: 15, remolinos: 9, esqueletos: 12, cofre: { oro: 2, cobre: 3 }, tinte: [0xffb347, 0.08] },
    // Unidad 3: mina subterránea con recursos propios (carbón, plata, amatista y hongos luminosos)
    u3: { nombre: { '7basico': 'Mina de las Formas', '8basico': 'Mina de los Volúmenes' }, tipo: 'cueva', recursos: 'u3', semilla: 33, fondo: '#1a1a24',
      suelo: [[9, 2, 1], [9, 7, 0.08], [9, 3, 0.015]], nHongos: 112, nRocas: 72, vetasPlata: 19, vetasAmatista: 9, pozas: 5, cofres: 11,
      murcielagos: 12, golems: 11, mineros: 12, cofre: { plata: 2, amatista: 1 }, oscuridad: 0.5, abismo: true },
    // Unidad 4: mundo helado con ventiscas y recursos propios (bayas de invierno, hielo, escarcha y zafiros)
    u4: { nombre: { '7basico': 'Glaciar de los Datos', '8basico': 'Glaciar del Azar' }, tipo: 'hielo', recursos: 'u4', semilla: 44, fondo: '#e4eef7',
      suelo: [[0, 0, 1], [1, 0, 0.12], [2, 0, 0.06]], nPinos: 112, nArbustos: 88, nRocas: 66, vetasEscarcha: 19, vetasZafiro: 9, cofres: 11,
      lobos: 12, espiritus: 9, munecos: 12, cofre: { escarcha: 2, zafiro: 1 } },
  };
  // Cada mundo puede tener una zona extra con recursos propios (Bosque profundo, Valle de la Esfinge)
  const SUBZONA = { u1: 'u1p', u2: 'u2v', u3: 'u3p' };
  const recursosDe = (z) => { const g = (MUNDOS[z] && MUNDOS[z].recursos) || 'u1'; return RECURSOS.filter((r) => r.grupo === g || r.grupo === SUBZONA[g]); };
  const nombreZona = (z) => (z === 'base' ? 'Tu base' : z === 'pieza' ? 'Tu pieza' : typeof MUNDOS[z].nombre === 'string' ? MUNDOS[z].nombre : MUNDOS[z].nombre[S.curso]);

  // oculto: espera escondido y despierta al acercarse · flota: atraviesa obstáculos · anim: hoja animada (LPC)
  const ENEMIGOS = {
    // Bosque (Unidad 1): los identificadores se mantienen para no perder misiones guardadas
    arbusto: { nombre: 'Duende del bosque', vida: 3, dif: 1, botin: { madera: 3 }, xp: 15, vel: 62, oculto: true, tex: 'arbusto', anim: 'duende', retrato: 'duende_retrato', radio: 240 },
    niebla: { nombre: 'Hombre lobo', vida: 4, dif: 2, botin: { agua: 3, cristal: 1 }, xp: 22, vel: 66, anim: 'lobo', retrato: 'lobo_retrato', radio: 190 },
    bicho: { nombre: 'Jabalí salvaje', vida: 2, dif: 1, botin: { madera: 2 }, xp: 10, vel: 92, anim: 'jabali', retrato: 'jabali_retrato', radio: 240 },
    // Desierto (Unidad 2)
    escorpion: { nombre: 'Escorpión de las dunas', vida: 4, dif: 2, botin: { fibra: 2, cobre: 1 }, xp: 20, vel: 78, oculto: true, tex: 'monticulo', texVivo: 'escorpion', retrato: 'escorpion', radio: 220 },
    remolino: { nombre: 'Remolino de arena', vida: 5, dif: 2, botin: { arenisca: 3, oro: 1 }, xp: 26, vel: 50, flota: true, alfa: 0.9, radio: 170 },
    // Mundo helado (Unidad 4)
    lobo_nieve: { nombre: 'Lobo de las nieves', vida: 5, dif: 2, botin: { baya: 2, hielo: 1 }, xp: 22, vel: 82, anim: 'lobo_nieve', retrato: 'lobo_nieve_retrato', radio: 220 },
    espiritu: { nombre: 'Espíritu de la ventisca', vida: 5, dif: 3, botin: { escarcha: 2, hielo: 1 }, xp: 28, vel: 52, flota: true, alfa: 0.9, retrato: 'nv_espiritu', radio: 180 },
    muneco: { nombre: 'Muñeco de nieve furioso', vida: 6, dif: 3, botin: { hielo: 2, zafiro: 1 }, xp: 32, vel: 48, oculto: true, tex: 'nv_montonnieve', texVivo: 'nv_muneco_malo', retrato: 'nv_muneco_malo', radio: 200 },
    // Mina (Unidad 3)
    murcielago: { nombre: 'Murciélago de la mina', vida: 3, dif: 2, botin: { hongo: 2, carbon: 1 }, xp: 18, vel: 88, flota: true, radio: 190 },
    golem: { nombre: 'Gólem de roca', vida: 7, dif: 3, botin: { carbon: 2, plata: 1, amatista: 1 }, xp: 34, vel: 46, oculto: true, tex: 'golem_roca', texVivo: 'golem', retrato: 'golem', radio: 200 },
    minero: { nombre: 'Minero zombi', vida: 6, dif: 3, botin: { plata: 2, carbon: 2 }, xp: 30, vel: 56, anim: 'minero', retrato: 'minero_retrato', radio: 210 },
    // Bosque profundo
    arana: { nombre: 'Araña del bosque profundo', vida: 5, dif: 2, botin: { resina: 1, miel: 1 }, xp: 26, vel: 96, retrato: 'arana', radio: 230 },
    raiz: { nombre: 'Raíz viviente', vida: 7, dif: 3, botin: { resina: 2, madera: 3 }, xp: 34, vel: 50, oculto: true, tex: 'tocon_raiz', texVivo: 'raiz_viva', retrato: 'raiz_viva', radio: 200 },
    // Profundidades de la mina
    salamandra: { nombre: 'Salamandra de magma', vida: 6, dif: 3, botin: { magma: 1, carbon: 2 }, xp: 34, vel: 104, retrato: 'a_salamandra', texVivo: 'a_salamandra', radio: 220 },
    golem_cristal: { nombre: 'Gólem de cristal', vida: 9, dif: 3, botin: { cristal_eco: 1, amatista: 1 }, xp: 42, vel: 50, oculto: true, tex: 'a_cristal_n', texVivo: 'a_golem_cristal', retrato: 'a_golem_cristal', radio: 190 },
    // Desafío en vivo "Criatura dorada": huye del jugador
    dorado: { nombre: 'Criatura dorada', vida: 3, dif: 2, botin: {}, xp: 45, vel: 112, anim: 'jabali', retrato: 'jabali_retrato', radio: 3000 },
    // Valle de la Esfinge
    escarabajo: { nombre: 'Escarabajo del valle', vida: 5, dif: 2, botin: { obsidiana: 1, cobre: 1 }, xp: 26, vel: 100, retrato: 'v_escarabajo', texVivo: 'v_escarabajo', radio: 230 },
    momia: { nombre: 'Momia del valle', vida: 7, dif: 3, botin: { fosil: 1, fibra: 2 }, xp: 34, vel: 54, oculto: true, tex: 'v_sarcofago', anim: 'momia', retrato: 'momia_retrato', radio: 190 },
    esqueleto: { nombre: 'Esqueleto del desierto', vida: 6, dif: 3, botin: { cobre: 2, oro: 1 }, xp: 32, vel: 62, anim: 'esqueleto', retrato: 'esqueleto_retrato', radio: 210 },
  };
  const xpPara = (nivel) => 60 + 40 * nivel;
  const JEFES = {
    u1: { nombre: 'Troll Guardián del Bosque', color: '#7d8a7a', lpc: true, retrato: 'jefe_u1_retrato' },
    u2: { nombre: 'Rey Lagarto de las Dunas', color: '#c9a46b', lpc: true, retrato: 'jefe_u2_retrato', vida: 9, fases: true, premio: { oro: 6, cobre: 8, arenisca: 10 },
      furia: { titulo: '¡Tormenta de arena!', toast: 'desató una tormenta de arena', particula: 'p_arena', tinte: 0xffc07a, flash: [230, 170, 60] } },
    u3: { nombre: 'Minotauro de las Profundidades', color: '#8a7aa6', lpc: true, retrato: 'jefe_u3_retrato', vida: 10, fases: true, premio: { amatista: 5, plata: 8, carbon: 10 },
      furia: { titulo: '¡Derrumbe en la mina!', toast: 'provocó un derrumbe', particula: 'p_piedra', tinte: 0xc9b6ff, flash: [150, 130, 200] } },
    u4: { nombre: 'Yeti, Rey de la Escarcha', color: '#9fc6e6', lpc: true, retrato: 'jefe_u4_retrato', vida: 11, fases: true, premio: { zafiro: 5, escarcha: 8, hielo: 10 },
      furia: { titulo: '¡Ventisca helada!', toast: 'desató una ventisca helada', particula: 'p_nieve', tinte: 0xbfe8ff, flash: [210, 235, 255] } },
  };
  const VIDA_HUIR = 1, VIDA_COFRE = 2;
  const JEFE_MIN = 4, JEFE_VIDA_POR_JUGADOR = 6, JEFE_DESCANSO = 5 * 60000, JEFE_DANIO = 2;
  const JEFE_PREMIO = { cristal: 5, madera: 10, piedra: 10 };

  // ===================================================================
  // Utilidades
  // ===================================================================
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const mate = (s) => esc(s)
    .replace(/(\d+|\))\^(−?\d+)/g, '$1<sup>$2</sup>')
    .replace(/(−?\d+)\/(\d+)/g, '<span class="frac"><span>$1</span><span>$2</span></span>');
  const almacen = {
    leer(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    escribir(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
  };
  const tactil = () => window.matchMedia('(pointer: coarse)').matches;
  const corazon = (lleno) => `<svg class="cor ${lleno ? '' : 'vacio'}" viewBox="0 0 16 14" aria-hidden="true"><path d="M8 13.5 1.6 7.4A3.9 3.9 0 0 1 8 2.5a3.9 3.9 0 0 1 6.4 4.9z"/></svg>`;
  const corazones = (n, max) => Array.from({ length: max }, (_, i) => corazon(i < n)).join('');

  const sfx = (n) => { if (window.Sonido) Sonido.sfx(n); };
  function toast(msg, tipo = '') {
    const t = $('toast');
    t.textContent = msg;
    t.className = tipo;
    t.style.opacity = '1';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.classList.add('oculto'), 300); }, 2800);
  }

  // ===================================================================
  // Estado, sesión y guardado
  // ===================================================================
  let S = null;            // progreso del jugador (se guarda completo)
  let juegoCerrado = false; // el docente cerró el juego para este curso
  let escena = null;
  const sesion = { modo: 'local', token: null, claveLocal: null, ultimo: '', avisoSinRed: false };

  function estadoNuevo(curso, nombre, pj) {
    return {
      v: 2, curso, nombre, pj, seccion: '',
      mochila: Object.fromEntries(RECURSOS.map((r) => [r.id, 0])),
      cofre: Object.fromEntries(RECURSOS.map((r) => [r.id, 0])),
      mejoras: [], herramienta: 'hacha', arma: null, armadura: null, inventario: {}, colocados: [], pieza: [],
      misiones: {}, diaria: null, premiosNivel: 0, ofertaNivel: null,
      vida: 5, xp: 0, nivel: 1, stats: {}, vencidos: 0, muertes: 0, zona: 'base', creado: Date.now(),
    };
  }
  function normalizar(p, curso, nombre, pj) {
    if (!p || !p.v) return estadoNuevo(curso, nombre, pj);
    if (p.v === 1) { // partida antigua: los recursos pasan al cofre
      const n = estadoNuevo(p.curso || curso, nombre, p.pj || pj);
      n.cofre = { ...n.cofre, ...(p.recursos || {}) };
      n.mejoras = (p.mejoras || []).filter((m) => NOMBRE_MEJORA[m]);
      n.xp = p.xp || 0; n.nivel = p.nivel || 1; n.stats = p.stats || {};
      return n;
    }
    const base = estadoNuevo(curso, nombre, pj);
    const n = { ...base, ...p, mochila: { ...base.mochila, ...p.mochila }, cofre: { ...base.cofre, ...p.cofre }, nombre: nombre || p.nombre };
    // Partidas anteriores al panel de Equipo: se equipa lo mejor que ya tenían
    const tieneN = (id) => (n.mejoras || []).includes(id);
    if (n.arma === undefined) n.arma = tieneN('espada2') ? 'espada2' : tieneN('espada') ? 'espada' : null;
    if (n.armadura === undefined) n.armadura = tieneN('armadura2') ? 'armadura2' : tieneN('armadura') ? 'armadura' : null;
    if (n.herramienta === 'espada' && !n.arma) n.herramienta = 'hacha';
    if (!PERSONAJES.some((x) => x.id === n.pj)) n.pj = 'zorro';
    return n;
  }

  // El docente tiene todas las herramientas (para probar minijuegos y zonas); armas y armaduras las fabrica gratis
  const tiene = (id) => S.mejoras.includes(id) || (Boolean(S.docente) && !ARMAS[id] && !ARMADURAS[id]);
  const vidaMax = () => 5 + (S.armadura && ARMADURAS[S.armadura] ? ARMADURAS[S.armadura].vida : 0) + (tiene('cantimplora') ? 1 : 0) + (tiene('casco') ? 1 : 0) + (tiene('abrigo') ? 1 : 0);
  const danio = () => (S.arma && ARMAS[S.arma] ? ARMAS[S.arma].danio : 1);
  const esDocente = () => Boolean(S && S.docente);
  const total = (r) => (esDocente() ? Infinity : (S.mochila[r] || 0) + (S.cofre[r] || 0));
  const alcanza = (costo) => Object.entries(costo).every(([r, n]) => total(r) >= n);
  function pagar(costo) {
    if (esDocente()) return;
    for (const [r, n] of Object.entries(costo)) {
      const delCofre = Math.min(S.cofre[r] || 0, n);
      S.cofre[r] -= delCofre;
      S.mochila[r] -= n - delCofre;
    }
  }

  function guardar(inmediato = false) {
    if (!S) return;
    S.zona = escena ? escena.zona : S.zona;
    if (sesion.modo === 'local') { almacen.escribir(sesion.claveLocal, S); return; }
    if (inmediato) subir();
  }
  // Sube el progreso solo si cambió desde la última vez que se guardó en el sistema.
  async function subir(keepalive = false) {
    if ((sesion.modo !== 'nube' && sesion.modo !== 'docente') || !S) return;
    if (escena) S.zona = escena.zona;
    const txt = JSON.stringify(S);
    if (txt === sesion.ultimo) return;
    try {
      const ok = sesion.modo === 'docente'
        ? await Nube.docenteGuardar(sesion.token, S, zonaRed(), keepalive)
        : await Nube.guardar(sesion.token, S, zonaRed(), keepalive);
      if (ok === false) { sesionVencida(); return; }
      sesion.ultimo = txt;
      sesion.avisoSinRed = false;
    } catch (e) {
      if (!sesion.avisoSinRed) { sesion.avisoSinRed = true; toast('Sin conexión: tu avance se guardará cuando vuelva internet.', 'alerta'); }
    }
  }
  function sesionVencida() {
    const docente = sesion.modo === 'docente';
    ui.abrir(`<h2 id="modal-titulo">Tu sesión terminó</h2><p class="enunciado" style="font-size: 18px">Por seguridad, la sesión dura unas horas. Vuelve a entrar ${docente ? 'al portal docente con tu RUT y tu código' : 'con tu RUT y tu clave'} para seguir donde quedaste.</p>
      <div class="acciones"><span></span><button type="button" class="btn pri" id="sv-ok" data-foco>Volver a entrar</button></div>`);
    $('sv-ok').addEventListener('click', () => { if (docente) { try { sessionStorage.removeItem('mw_docente'); } catch (e) { /* */ } location.href = './'; } else location.reload(); });
  }
  setInterval(() => subir(), 10000);
  setInterval(() => latir(), 20000);
  // Latido: mantiene "en línea" al estudiante y lo saca del juego si el docente cierra su curso.
  async function latir() {
    if (sesion.modo !== 'nube' || !S || juegoCerrado) return;
    try {
      const r = await Nube.latido(sesion.token, zonaRed());
      if (r && r.abierto === false) cerrarPorDocente();
      else if (r && Array.isArray(r.mundos)) {
        const nuevos = r.mundos.filter((u) => !(sesion.mundos || []).includes(u) && MUNDOS[u]);
        sesion.mundos = r.mundos;
        if (nuevos.length) toast(`¡Tu profesor abrió un mundo nuevo: ${nuevos.map((u) => nombreZona(u)).join(', ')}! Viaja por el portal de tu base.`);
      }
    } catch (e) { /* sin red: se reintenta */ }
  }
  async function cerrarPorDocente() {
    if (juegoCerrado) return;
    juegoCerrado = true;
    if (escena && escena.canal) { escena.canal.salir(); escena.canal = null; }
    guardar(true);
    await subir();
    ui.abrir(`<h2 id="modal-titulo">El juego está cerrado</h2>
      <p class="enunciado" style="font-size: 18px">Tu profesor cerró el juego para tu curso. Tu avance quedó guardado: podrás seguir donde quedaste cuando lo vuelva a abrir.</p>
      <div class="acciones"><span></span><button type="button" class="btn pri" id="jc-ok" data-foco>Salir</button></div>`, 'bloqueo');
    $('jc-ok').addEventListener('click', () => location.reload());
  }
  // Zona que ve el docente: "base", "u1" (solo) o "u1-g3" (grupo 3)
  function zonaRed() {
    const z = escena ? escena.zona : (S && S.zona) || 'base';
    return z !== 'base' && S && S.grupo ? `${z}-g${S.grupo}` : z;
  }
  const idJuego = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now();
  const coopActivo = () => Boolean(window.Coop && Coop.disponible && (sesion.modo === 'nube' || sesion.modo === 'docente'));
  const nivelNum = () => (S.curso === '8basico' ? '8' : '7');
  window.addEventListener('pagehide', () => { guardar(); subir(true); });

  function sumar(recurso, n) {
    if (!vivo.premiando && n > 0) {
      if (desActivo('fiebre')) { n *= 2; if (escena && escena.jugador) escena.flotante(escena.jugador.x, escena.jugador.y - 74, '¡x2!', '#ffd27a'); }
      eventoDesafio('recurso', n);
    }
    S.mochila[recurso] = (S.mochila[recurso] || 0) + n;
    pintarHUD();
    const el = document.querySelector(`.recurso[data-r="${recurso}"]`);
    if (el) { el.classList.add('sube'); setTimeout(() => el.classList.remove('sube'), 350); }
  }
  function ganarXP(n) {
    S.xp += n;
    let subio = false;
    while (S.xp >= xpPara(S.nivel)) {
      S.xp -= xpPara(S.nivel); S.nivel += 1; subio = true;
      S.premiosNivel = (S.premiosNivel || 0) + 1;
      toast(`¡Subiste a nivel ${S.nivel}! Elige tu recompensa.`); sfx('nivel');
    }
    if (subio) premioPospuesto = false;
    pintarHUD();
    if (subio) revisarPendientes();
  }
  const difPara = (base) => Math.min(3, base + (S.nivel >= 6 ? 1 : 0));
  const unidadActual = () => (escena && MUNDOS[escena.zona] ? escena.zona : 'u1');
  const enCasa = () => !escena || escena.zona === 'base' || escena.zona === 'pieza';

  // ===================================================================
  // Misiones: 3 al azar por mundo (abren al jefe final) y una misión diaria
  // ===================================================================
  // mundos: en qué mundos puede salir la misión (sin "mundos" = en todos). El desierto tiene sus propias misiones.
  const desierto = (u) => Boolean(MUNDOS[u] && MUNDOS[u].tipo === 'desierto');
  const cueva = (u) => Boolean(MUNDOS[u] && MUNDOS[u].tipo === 'cueva');
  const helado = (u) => Boolean(MUNDOS[u] && MUNDOS[u].tipo === 'hielo');
  const bosque = (u) => !desierto(u) && !cueva(u) && !helado(u);
  const TIPOS_MISION = {
    talar: { n: [4, 6], txt: (m) => (desierto(m.u) ? `Corta ${m.n} cactus` : cueva(m.u) ? `Recolecta ${m.n} grupos de hongos luminosos` : helado(m.u) ? `Recolecta bayas de ${m.n} arbustos` : `Tala ${m.n} árboles`) },
    picar: { n: [3, 5], txt: (m) => (desierto(m.u) ? `Pica ${m.n} rocas de arenisca` : cueva(m.u) ? `Pica ${m.n} rocas de carbón` : helado(m.u) ? `Pica ${m.n} bloques de hielo` : `Pica ${m.n} rocas`), req: () => tiene('pico') },
    agua: { n: [2, 3], txt: (m) => `Saca agua del lago ${m.n} veces`, req: () => tiene('balde'), mundos: bosque },
    arana: { n: [2, 3], txt: (m) => `Vence ${m.n} arañas del bosque profundo`, mundos: (u) => bosque(u) && puenteListo() },
    raiz: { n: [1, 2], txt: (m) => (m.n === 1 ? 'Vence 1 raíz viviente' : `Vence ${m.n} raíces vivientes`), mundos: (u) => bosque(u) && puenteListo() },
    resina: { n: [2, 3], txt: (m) => `Saca resina de ${m.n} árboles gigantes`, req: () => tiene('hacha2'), mundos: (u) => bosque(u) && puenteListo() },
    colmena: { n: [2, 3], txt: (m) => `Recolecta miel de ${m.n} colmenas`, req: () => tiene('ahumador'), mundos: (u) => bosque(u) && puenteListo() },
    excavar: { n: [1, 2], txt: (m) => (m.n === 1 ? 'Excava en 1 sitio del Valle de la Esfinge' : `Excava en ${m.n} sitios del Valle de la Esfinge`), req: () => tiene('pala'), mundos: (u) => desierto(u) && valleListo() },
    laberinto: { n: [1, 1], txt: () => 'Supera el laberinto de la Gran Esfinge', req: () => tiene('antorcha_esfinge'), mundos: (u) => desierto(u) && valleListo() },
    obsidiana: { n: [2, 3], txt: (m) => `Extrae obsidiana de ${m.n} vetas del valle`, req: () => tiene('pico3'), mundos: (u) => desierto(u) && valleListo() },
    escarabajo: { n: [2, 3], txt: (m) => `Vence ${m.n} escarabajos del valle`, mundos: (u) => desierto(u) && valleListo() },
    momia: { n: [1, 2], txt: (m) => (m.n === 1 ? 'Vence 1 momia del valle' : `Vence ${m.n} momias del valle`), mundos: (u) => desierto(u) && valleListo() },
    carrera: { n: [1, 1], txt: () => 'Corre una carrera de vagonetas en la estación', mundos: cueva },
    cristales: { n: [1, 2], txt: (m) => (m.n === 1 ? 'Resuelve 1 rompecabezas de cristales' : `Resuelve ${m.n} rompecabezas de cristales`), mundos: (u) => cueva(u) && minaListo() },
    magma: { n: [2, 3], txt: (m) => `Extrae magma de ${m.n} vetas de las Profundidades`, req: () => tiene('guantes') && tiene('pico'), mundos: (u) => cueva(u) && minaListo() },
    salamandra: { n: [2, 3], txt: (m) => `Vence ${m.n} salamandras de magma`, mundos: (u) => cueva(u) && minaListo() },
    golem_cristal: { n: [1, 2], txt: (m) => (m.n === 1 ? 'Vence 1 gólem de cristal' : `Vence ${m.n} gólems de cristal`), mundos: (u) => cueva(u) && minaListo() },
    pescar: { n: [2, 3], txt: (m) => `Pesca ${m.n} veces en el muelle del gran lago`, req: () => tiene('cana'), mundos: bosque },
    cofre: { n: [1, 2], txt: (m) => (m.n === 1 ? 'Abre 1 cofre del mundo' : `Abre ${m.n} cofres del mundo`) },
    arbusto: { n: [2, 3], txt: (m) => `Vence ${m.n} duendes del bosque`, mundos: bosque },
    niebla: { n: [1, 2], txt: (m) => (m.n === 1 ? 'Vence 1 hombre lobo' : `Vence ${m.n} hombres lobo`), mundos: bosque },
    bicho: { n: [1, 1], txt: () => 'Vence 1 jabalí salvaje (sale de entre los árboles)', mundos: bosque },
    escorpion: { n: [2, 3], txt: (m) => `Vence ${m.n} escorpiones de las dunas`, mundos: desierto },
    remolino: { n: [1, 2], txt: (m) => (m.n === 1 ? 'Vence 1 remolino de arena' : `Vence ${m.n} remolinos de arena`), mundos: desierto },
    esqueleto: { n: [1, 2], txt: (m) => (m.n === 1 ? 'Vence 1 esqueleto del desierto' : `Vence ${m.n} esqueletos del desierto`), mundos: desierto },
    veta: { n: [2, 3], txt: (m) => `Extrae ${cueva(m.u) ? 'plata' : helado(m.u) ? 'escarcha' : 'cobre'} de ${m.n} vetas`, req: () => tiene('pico'), mundos: (u) => !bosque(u) },
    lobo_nieve: { n: [2, 3], txt: (m) => `Vence ${m.n} lobos de las nieves`, mundos: helado },
    espiritu: { n: [1, 2], txt: (m) => (m.n === 1 ? 'Vence 1 espíritu de la ventisca' : `Vence ${m.n} espíritus de la ventisca`), mundos: helado },
    muneco: { n: [1, 2], txt: (m) => (m.n === 1 ? 'Vence 1 muñeco de nieve furioso' : `Vence ${m.n} muñecos de nieve furiosos`), mundos: helado },
    murcielago: { n: [2, 3], txt: (m) => `Vence ${m.n} murciélagos de la mina`, mundos: cueva },
    golem: { n: [1, 2], txt: (m) => (m.n === 1 ? 'Vence 1 gólem de roca' : `Vence ${m.n} gólems de roca`), mundos: cueva },
    minero: { n: [1, 2], txt: (m) => (m.n === 1 ? 'Vence 1 minero zombi' : `Vence ${m.n} mineros zombis`), mundos: cueva },
    acierto: { n: [3, 4], txt: (m) => `Responde bien ${m.n} ejercicios de: ${m.titulo}` },
  };
  const azarEntre = ([a, b]) => a + Math.floor(Math.random() * (b - a + 1));
  const mezclar = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const MISIONES_JEFE = 4;
  function nuevaMision(t, u) {
    const m = { t, n: azarEntre(TIPOS_MISION[t].n), p: 0, u };
    if (t === 'acierto') {
      const temas = Object.entries(Preguntas.titulos(S.curso, u));
      const [tema, titulo] = temas[Math.floor(Math.random() * temas.length)] || ['', 'esta unidad'];
      m.tema = tema; m.titulo = titulo;
    }
    return m;
  }
  function nuevasMisiones(u) {
    const tipos = mezclar(Object.keys(TIPOS_MISION).filter((t) => (!TIPOS_MISION[t].req || TIPOS_MISION[t].req()) && (!TIPOS_MISION[t].mundos || TIPOS_MISION[t].mundos(u)))).slice(0, MISIONES_JEFE);
    return { lista: tipos.map((t) => nuevaMision(t, u)), ok: false };
  }
  function misionesDe(u) {
    S.misiones = S.misiones || {};
    if (!S.misiones[u]) S.misiones[u] = nuevasMisiones(u);
    const M = S.misiones[u];
    // Partidas con 3 misiones (versión anterior): se agrega la cuarta
    if (!M.ok && M.lista.length < MISIONES_JEFE) {
      const usados = new Set(M.lista.map((m) => m.t));
      const libres = mezclar(Object.keys(TIPOS_MISION).filter((t) => !usados.has(t) && (!TIPOS_MISION[t].req || TIPOS_MISION[t].req()) && (!TIPOS_MISION[t].mundos || TIPOS_MISION[t].mundos(u))));
      libres.slice(0, MISIONES_JEFE - M.lista.length).forEach((t) => M.lista.push(nuevaMision(t, u)));
    }
    return M;
  }
  const textoMision = (m) => TIPOS_MISION[m.t].txt(m);
  // Estado de las obras cooperativas (lo trae el servidor; en modo sin conexión es personal)
  const obraE = { puente: null, valle: null, mina: null };
  // El docente puede pasar aunque la obra de sus estudiantes no esté terminada (solo en su juego)
  const puenteListo = () => esDocente() || Boolean(obraE.puente && obraE.puente.completado);
  const valleListo = () => esDocente() || Boolean(obraE.valle && obraE.valle.completado);
  const minaListo = () => esDocente() || Boolean(obraE.mina && obraE.mina.completado);
  const misionesListas = (u) => esDocente() || Boolean(S.misiones && S.misiones[u] && S.misiones[u].ok);

  const TIPOS_DIARIA = {
    talar: { n: 6, txt: 'Recolecta 6 veces de árboles, cactus, hongos o bayas' },
    picar: { n: 5, txt: 'Pica 5 rocas', req: () => tiene('pico') },
    agua: { n: 3, txt: 'Saca agua del lago 3 veces', req: () => tiene('balde') },
    vencer: { n: 4, txt: 'Vence a 4 enemigos' },
    acierto: { n: 8, txt: 'Responde bien 8 ejercicios' },
    cofre: { n: 2, txt: 'Abre 2 cofres en los mundos' },
    fabricar: { n: 2, txt: 'Fabrica 2 decorativos o muebles' },
    decorar: { n: 3, txt: 'Coloca 3 objetos en tu base o tu pieza' },
  };
  const PREMIOS_DIARIA = [{ madera: 15, piedra: 10 }, { cristal: 4 }, { agua: 8, madera: 10 }, { piedra: 12, cristal: 2 }, { cobre: 5, arenisca: 8 }, { oro: 2, fibra: 6 }, { carbon: 8, hongo: 4 }, { plata: 4, amatista: 1 }, { hielo: 8, baya: 4 }, { escarcha: 4, zafiro: 1 }];
  const hoy = () => { try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date()); } catch (e) { return new Date().toISOString().slice(0, 10); } };
  function diaria() {
    const f = hoy();
    if (!S.diaria || S.diaria.fecha !== f) {
      const tipos = Object.keys(TIPOS_DIARIA).filter((t) => !TIPOS_DIARIA[t].req || TIPOS_DIARIA[t].req());
      const t = tipos[Math.floor(Math.random() * tipos.length)];
      const normales = OBJETOS.filter((o) => !o.excl);
      S.diaria = { fecha: f, t, n: TIPOS_DIARIA[t].n, p: 0, cobrada: false,
        premio: { rec: PREMIOS_DIARIA[Math.floor(Math.random() * PREMIOS_DIARIA.length)], obj: normales[Math.floor(Math.random() * normales.length)].id, xp: 50 } };
    }
    return S.diaria;
  }
  // Se llama cada vez que el jugador hace algo que puede contar para una misión
  function avanzarMision(ev, tema) {
    if (!S) return;
    const u = escena && MUNDOS[escena.zona] ? escena.zona : null;
    if (u) {
      const M = misionesDe(u);
      if (!M.ok) {
        let cambio = false;
        for (const m of M.lista) {
          if (m.p >= m.n || m.t !== ev || (ev === 'acierto' && m.tema !== tema)) continue;
          m.p += 1; cambio = true;
          if (m.p >= m.n) { toast(`Misión cumplida: ${textoMision(m)}`); sfx('mision'); }
        }
        if (cambio && M.lista.every((m) => m.p >= m.n)) {
          M.ok = true;
          setTimeout(() => toast(`¡Completaste tus misiones! Cuando ${JEFE_MIN} jugadores de tu grupo las cumplan, ${JEFES[u].nombre} aparecerá en algún lugar del mapa.`), 1200);
          ganarXP(30);
          if (escena) { escena.celebrar(); escena.avisarGuarida(); }
        }
      }
    }
    const Dd = diaria();
    const cuenta = Dd.t === ev || (Dd.t === 'vencer' && ENEMIGOS[ev]) || (Dd.t === 'picar' && ev === 'veta');
    if (cuenta && Dd.p < Dd.n) {
      Dd.p += 1;
      if (Dd.p >= Dd.n) setTimeout(() => toast('¡Misión diaria cumplida! Reclama tu recompensa en Misiones (tecla N).'), 900);
    }
    pintarMisiones();
  }
  let misionesPlegadas = false;
  function misionesOcultas() { try { const v = localStorage.getItem('mw_misiones_ocultas'); return v === null ? misionesPlegadas : v === '1'; } catch (e) { return misionesPlegadas; } }
  function pintarMisiones() {
    const el = $('hud-misiones');
    if (!el || !S) return;
    const u = escena && MUNDOS[escena.zona] ? escena.zona : null;
    const Dd = diaria();
    const fila = (txt, p, n) => `<li class="${p >= n ? 'ok' : ''}"><span>${esc(txt)}</span><b>${Math.min(p, n)}/${n}</b></li>`;
    let html = '';
    if (u) {
      const M = misionesDe(u);
      html += `<strong>${M.ok ? 'Jefe final desbloqueado' : 'Misiones para el jefe'}</strong><ul>${M.lista.map((m) => fila(textoMision(m), m.p, m.n)).join('')}</ul>`;
    }
    html += `<strong>Misión diaria${Dd.cobrada ? ' · cobrada' : Dd.p >= Dd.n ? ' · ¡reclámala!' : ''}</strong><ul>${fila(TIPOS_DIARIA[Dd.t].txt, Dd.p, Dd.n)}</ul>`;
    const oculto = misionesOcultas();
    const hechas = u ? misionesDe(u).lista.filter((m) => m.p >= m.n).length : null;
    const resumen = u ? `${hechas}/${misionesDe(u).lista.length}` : Dd.p >= Dd.n ? (Dd.cobrada ? '✓' : '¡lista!') : `${Math.min(Dd.p, Dd.n)}/${Dd.n}`;
    el.classList.toggle('plegado', oculto);
    el.innerHTML = `<div class="hm-cab"><span>Misiones${oculto ? ` · ${resumen}` : ''}</span><button type="button" class="hm-plegar" data-plegar aria-expanded="${!oculto}">${oculto ? 'Mostrar' : 'Ocultar'}</button></div>`
      + (oculto ? '' : `<button type="button" class="hm-cuerpo" data-ver-misiones aria-label="Ver detalle de tus misiones">${html}</button>`);
    const pend = (Dd.p >= Dd.n && !Dd.cobrada) || (S.premiosNivel || 0) > 0;
    $('btn-misiones').classList.toggle('alerta', pend);
  }
  const recHTML = (rec) => Object.entries(rec).map(([r, n]) => `<span class="pildora premio"><img class="px" src="${ICONO(r)}" alt="">+${n} ${nombreRec(r)}</span>`).join('');
  function sumarCofre(rec) { Object.entries(rec).forEach(([r, n]) => { S.cofre[r] = (S.cofre[r] || 0) + n; }); pintarHUD(); }
  function abrirMisiones() {
    const Dd = diaria();
    const u = escena && MUNDOS[escena.zona] ? escena.zona : null;
    const barra = (p, n) => `<div class="barra"><i style="width: ${Math.round((Math.min(p, n) / n) * 100)}%"></i></div>`;
    const lista = (M) => `<ul class="misiones">${M.lista.map((m) => `<li class="${m.p >= m.n ? 'ok' : ''}"><div class="fila"><span>${esc(textoMision(m))}</span><b>${Math.min(m.p, m.n)}/${m.n}</b></div>${barra(m.p, m.n)}</li>`).join('')}</ul>`;
    const mundos = Object.keys(MUNDOS).filter((z) => z !== u && S.misiones && S.misiones[z]).map((z) => `
      <details><summary><strong>${esc(nombreZona(z))}</strong> · ${S.misiones[z].ok ? '<span class="estado-ok">Jefe desbloqueado</span>' : `${S.misiones[z].lista.filter((m) => m.p >= m.n).length} de ${S.misiones[z].lista.length}`}</summary>${lista(S.misiones[z])}</details>`).join('');
    const p = Dd.premio;
    const premioD = `${recHTML(p.rec)}<span class="pildora premio"><img class="px" src="${escena.imagenTex(OBJ[p.obj].tex)}" alt="">${esc(OBJ[p.obj].nombre)}</span><span class="pildora premio">+${p.xp} XP</span>`;
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">Misiones</span><h2 id="modal-titulo">Tus misiones</h2></div><button type="button" class="btn" id="mi-cerrar">Cerrar</button></div>
      ${(S.premiosNivel || 0) > 0 ? `<div class="mensaje pista" style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap"><span>Tienes ${S.premiosNivel === 1 ? 'una recompensa' : `${S.premiosNivel} recompensas`} de nivel por elegir.</span><button type="button" class="btn pri" id="mi-nivel">Elegir</button></div>` : ''}
      <section class="tarjeta-mision diaria">
        <div class="fila"><strong>Misión diaria</strong><small>Se renueva cada día</small></div>
        <div class="fila"><span>${esc(TIPOS_DIARIA[Dd.t].txt)}</span><b>${Math.min(Dd.p, Dd.n)}/${Dd.n}</b></div>${barra(Dd.p, Dd.n)}
        <div class="pildoras">${premioD}</div>
        ${Dd.cobrada ? '<span class="estado-ok">Recompensa cobrada. Vuelve mañana por una nueva misión.</span>'
          : `<button type="button" class="btn pri" id="mi-cobrar" ${Dd.p >= Dd.n ? '' : 'disabled'}>${Dd.p >= Dd.n ? 'Reclamar recompensa' : 'Cúmplela para reclamar'}</button>`}
      </section>
      ${u ? `<section class="tarjeta-mision"><div class="fila"><strong>${esc(nombreZona(u))}: misiones para el jefe final</strong></div>
        <p class="nota">${misionesListas(u) ? `¡Listo! Cuando ${JEFE_MIN} jugadores de tu grupo cumplan sus misiones, ${esc(JEFES[u].nombre)} aparecerá en un lugar al azar del mapa. ¡Búsquenlo y derrótenlo juntos!` : `Cumple tus ${MISIONES_JEFE} misiones para invocar a ${esc(JEFES[u].nombre)}. Cada jugador recibe misiones distintas y se necesitan ${JEFE_MIN} jugadores del grupo con sus misiones cumplidas.`}</p>
        ${lista(misionesDe(u))}</section>`
        : '<p class="nota">Al entrar a cada mundo recibes ${MISIONES_JEFE} misiones al azar. Cúmplelas con tu grupo para invocar al jefe final: aparecerá en algún lugar del mapa.</p>'}
      ${mundos ? `<div class="unidades-avance">${mundos}</div>` : ''}`);
    $('mi-cerrar').addEventListener('click', () => ui.cerrar());
    const bn = $('mi-nivel'); if (bn) bn.addEventListener('click', () => { premioPospuesto = false; abrirPremioNivel(); });
    const bc = $('mi-cobrar');
    if (bc) bc.addEventListener('click', () => {
      if (Dd.cobrada || Dd.p < Dd.n) return;
      Dd.cobrada = true;
      sumarCofre(p.rec);
      S.inventario[p.obj] = (S.inventario[p.obj] || 0) + 1;
      guardar(true); escena.celebrar();
      toast(`Recompensa en tu cofre y ${OBJ[p.obj].nombre} en tus objetos. ¡Bien hecho!`);
      ganarXP(p.xp);
      pintarMisiones();
      if (ui.abierto) abrirMisiones();
    });
  }

  // ---------- Recompensa al subir de nivel: elegir 1 de 3 ----------
  let premioPospuesto = false;
  const cuantos = (id) => (S.inventario[id] || 0) + (S.colocados || []).filter((c) => c.k === id).length + (S.pieza || []).filter((c) => c.k === id).length;
  function nuevaOferta() {
    const L = S.nivel;
    const paquetes = mezclar([
      { madera: 12 + 3 * L, piedra: 8 + 2 * L }, { cristal: 2 + Math.floor(L / 2) },
      { agua: 8 + 2 * L, madera: 6 + L }, { piedra: 12 + 3 * L, cristal: 1 },
      ...(recursosVisibles().some((r) => r.grupo === 'u2') ? [{ cobre: 4 + L, arenisca: 10 + 2 * L }, { oro: 2 + Math.floor(L / 3), fibra: 6 + L }] : []),
      ...(recursosVisibles().some((r) => r.grupo === 'u4') ? [{ hielo: 10 + 2 * L, baya: 4 + L }, { escarcha: 3 + Math.floor(L / 2), zafiro: 1 + Math.floor(L / 4) }] : []),
      ...(recursosVisibles().some((r) => r.grupo === 'u3') ? [{ carbon: 10 + 2 * L, hongo: 4 + L }, { plata: 3 + Math.floor(L / 2), amatista: 1 + Math.floor(L / 4) }] : []),
    ]);
    const excl = mezclar(OBJETOS.filter((o) => o.excl && cuantos(o.id) === 0));
    const normales = mezclar(OBJETOS.filter((o) => !o.excl && !o.carpa));
    const ops = [{ tipo: 'rec', rec: paquetes[0] }];
    ops.push(excl.length ? { tipo: 'obj', id: excl[0].id, n: 1, excl: true } : { tipo: 'rec', rec: paquetes[1] });
    const o = normales[0];
    ops.push({ tipo: 'obj', id: o.id, n: Object.values(o.costo).reduce((a, b) => a + b, 0) <= 4 ? 3 : 1 });
    return mezclar(ops);
  }
  function abrirPremioNivel() {
    if (!(S.premiosNivel > 0)) return;
    if (!S.ofertaNivel) { S.ofertaNivel = nuevaOferta(); guardar(); }
    const ops = S.ofertaNivel;
    const tarjeta = (op, i) => {
      if (op.tipo === 'rec') return `<button type="button" class="premio-op" data-op="${i}"><small>RECURSOS AL COFRE</small><div class="iconos">${Object.keys(op.rec).map((r) => `<img class="px" src="${ICONO(r)}" alt="">`).join('')}</div><strong>${Object.entries(op.rec).map(([r, n]) => `${n} ${nombreRec(r)}`).join(' + ')}</strong></button>`;
      const o = OBJ[op.id];
      return `<button type="button" class="premio-op ${op.excl ? 'excl' : ''}" data-op="${i}"><small>${op.excl ? 'OBJETO EXCLUSIVO' : 'OBJETO'} · ${o.lugar === 'pieza' ? 'PARA TU PIEZA' : 'PARA TU BASE'}</small><div class="iconos"><img class="px" src="${escena.imagenTex(o.tex)}" alt=""></div><strong>${op.n > 1 ? `${op.n} × ` : ''}${esc(o.nombre)}</strong></button>`;
    };
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">Recompensa del nivel ${S.nivel - S.premiosNivel + 1}</span><h2 id="modal-titulo">¡Subiste de nivel! Elige tu recompensa</h2></div></div>
      <p class="nota">Solo puedes quedarte con una. Los objetos exclusivos no se pueden fabricar: solo se ganan subiendo de nivel.</p>
      <div class="premios">${ops.map(tarjeta).join('')}</div>
      <div class="acciones"><span class="nota">${S.premiosNivel > 1 ? `Te quedan ${S.premiosNivel} recompensas por elegir.` : ''}</span><button type="button" class="btn" id="pn-luego">Elegir más tarde</button></div>`);
    $('pn-luego').addEventListener('click', () => { premioPospuesto = true; ui.cerrar(); pintarMisiones(); });
    document.querySelectorAll('[data-op]').forEach((b) => b.addEventListener('click', () => {
      const op = ops[Number(b.dataset.op)];
      if (op.tipo === 'rec') { sumarCofre(op.rec); toast(`¡Recompensa guardada en tu cofre: ${Object.entries(op.rec).map(([r, n]) => `${n} ${nombreRec(r)}`).join(', ')}!`); }
      else { S.inventario[op.id] = (S.inventario[op.id] || 0) + op.n; toast(`¡Ganaste: ${OBJ[op.id].nombre}! Colócalo con Decorar (G).`); }
      S.premiosNivel -= 1; S.ofertaNivel = null;
      guardar(true); escena.celebrar(); pintarMisiones();
      ui.cerrar();
    }));
  }
  // Muestra lo que esté pendiente (recompensa de nivel) cuando no haya otra ventana abierta
  function revisarPendientes() {
    clearTimeout(revisarPendientes._t);
    revisarPendientes._t = setTimeout(() => {
      if (!S || ui.abierto || !escena || !escena.jugador || escena.enCombate || escena.enJefe || juegoCerrado || premioPospuesto || vivo.pendienteModal || vivo.resultadoModal) return;
      if ((S.premiosNivel || 0) > 0) abrirPremioNivel();
    }, 600);
  }

  // ===================================================================
  // Ingreso
  // ===================================================================
  const ingreso = { nivel: '7', pj: 'zorro', rut: null, estado: null };

  function prepararIngreso() {
    const cont = $('personajes');
    cont.innerHTML = PERSONAJES.map((p) => `
      <button type="button" class="opcion" data-pj="${p.id}" aria-pressed="false" aria-label="Personaje ${p.nombre}">
        <span class="retrato" style="background-image:url('assets/pj/${p.id}_nada.png')"></span>
        <span style="font-size: 12px">${p.nombre}</span>
      </button>`).join('');
    const marcar = () => {
      document.querySelectorAll('[data-nivel]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.nivel === ingreso.nivel)));
      document.querySelectorAll('[data-pj]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pj === ingreso.pj)));
    };
    document.querySelectorAll('[data-nivel]').forEach((b) => b.addEventListener('click', () => { ingreso.nivel = b.dataset.nivel; reiniciarPaso(); marcar(); }));
    document.querySelectorAll('[data-pj]').forEach((b) => b.addEventListener('click', () => { ingreso.pj = b.dataset.pj; marcar(); }));
    marcar();

    document.querySelectorAll('[data-pestana]').forEach((b) => b.addEventListener('click', () => {
      document.querySelectorAll('[data-pestana]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      $('form-estudiante').classList.toggle('oculto', b.dataset.pestana !== 'estudiante');
      $('form-docente').classList.toggle('oculto', b.dataset.pestana !== 'docente');
    }));

    if (!Nube.activo) {
      // Sin base de datos configurada: modo local con apodo
      document.querySelectorAll('.solo-nube').forEach((e) => e.classList.add('oculto'));
      document.querySelectorAll('.solo-local').forEach((e) => e.classList.remove('oculto'));
      $('bloque-pj').classList.remove('oculto');
      $('btn-entrar').textContent = 'Entrar al mundo';
    }
    $('rut').addEventListener('input', reiniciarPaso);
    entrarComoDocente();
    $('form-estudiante').addEventListener('submit', enviarEstudiante);
    $('form-docente').addEventListener('submit', enviarDocente);
  }
  function reiniciarPaso() {
    if (!Nube.activo) return;
    ingreso.estado = null;
    $('bloque-clave').classList.add('oculto');
    $('bloque-pj').classList.add('oculto');
    $('btn-entrar').textContent = 'Continuar';
    error('');
  }
  function error(msg, id = 'error-ingreso') {
    const e = $(id);
    e.textContent = msg;
    e.classList.toggle('oculto', !msg);
  }

  async function enviarEstudiante(ev) {
    ev.preventDefault();
    const btn = $('btn-entrar');
    const curso = ingreso.nivel === '7' ? '7basico' : '8basico';
    if (!Nube.activo) {
      const apodo = $('apodo').value.trim();
      if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_]{3,16}$/.test(apodo)) return error('El apodo debe tener entre 3 y 16 letras o números, sin espacios.');
      sesion.modo = 'local';
      sesion.claveLocal = `mathworld2:${curso}:${apodo.toLowerCase()}`;
      S = normalizar(almacen.leer(sesion.claveLocal), curso, apodo, ingreso.pj);
      S.pj = ingreso.pj;
      return empezar();
    }
    const rut = Nube.rut($('rut').value);
    if (!rut) return error('Revisa tu RUT: debe tener el dígito verificador, por ejemplo 12.345.678-5.');
    btn.disabled = true;
    try {
      if (!ingreso.estado || ingreso.rut !== rut) {
        const est = await Nube.estado(rut, ingreso.nivel);
        if (!est || !est.existe) return error(`Tu RUT no está en las listas de ${ingreso.nivel}° básico. Revisa el curso elegido o habla con tu profesor.`);
        if (est.abierto === false) return error(`El juego de ${est.curso[0]}°${est.curso[1]} está cerrado en este momento. Tu profesor lo abrirá en clases.`);
        ingreso.estado = est; ingreso.rut = rut;
        $('saludo').textContent = est.tiene_clave ? `Hola, ${est.nombre}. Escribe tu clave.` : `Hola, ${est.nombre}. Es tu primera vez: crea una clave de al menos 4 caracteres y elige tu personaje.`;
        $('bloque-clave').classList.remove('oculto');
        $('confirmar-fila').classList.toggle('oculto', est.tiene_clave);
        $('bloque-pj').classList.toggle('oculto', est.tiene_clave);
        $('clave').value = ''; $('clave2').value = '';
        btn.textContent = 'Entrar al mundo';
        $('clave').focus();
        return error('');
      }
      const clave = $('clave').value;
      if (!ingreso.estado.tiene_clave) {
        if (clave.length < 4) return error('La clave debe tener al menos 4 caracteres.');
        if (clave !== $('clave2').value) return error('Las dos claves no coinciden.');
      }
      const r = await Nube.entrar(rut, ingreso.nivel, clave);
      if (!r || !r.ok) {
        const msg = { clave_incorrecta: 'Clave incorrecta. Si la olvidaste, pide a tu profesor que la restablezca.', bloqueado: 'Demasiados intentos fallidos. Espera 10 minutos.', clave_corta: 'La clave debe tener al menos 4 caracteres.', cerrado: 'El juego de tu curso está cerrado en este momento. Tu profesor lo abrirá en clases.' };
        return error(msg[r && r.error] || 'No se pudo entrar. Inténtalo otra vez.');
      }
      // Partida reiniciada (o sin avance) y aún no elige personaje: se le muestra el selector antes de entrar
      if ((!r.progreso || !r.progreso.v) && $('bloque-pj').classList.contains('oculto')) {
        $('bloque-pj').classList.remove('oculto');
        $('saludo').textContent = `Hola, ${ingreso.estado.nombre}. Comienzas una aventura nueva: elige tu personaje y presiona Entrar al mundo.`;
        return error('');
      }
      sesion.modo = 'nube'; sesion.token = r.token; sesion.mundos = Array.isArray(r.mundos) ? r.mundos : null;
      const primerNombre = (r.nombre || '').split(' ')[2] || (r.nombre || '').split(' ')[0] || 'Explorador';
      S = normalizar(r.progreso, curso, primerNombre, ingreso.pj);
      S.seccion = r.curso;
      if (!r.progreso || !r.progreso.v) S.pj = ingreso.pj;
      guardar(true);
      empezar();
    } catch (e) {
      error('No hay conexión con el servidor. Revisa internet e inténtalo de nuevo.');
    } finally { btn.disabled = false; }
  }

  // Entrada del docente al juego desde el portal: docente.html → ./?docente=7&pj=zorro
  async function entrarComoDocente() {
    const q = new URLSearchParams(location.search);
    const nivel = q.get('docente');
    if (!nivel || !Nube.activo) return;
    let token = null;
    try { token = sessionStorage.getItem('mw_docente'); } catch (e) { /* */ }
    if (!token) { history.replaceState(null, '', './'); return; }
    $('ingreso').classList.add('oculto');
    try {
      const p = await Nube.docenteProgreso(token);
      if (p === null) { try { sessionStorage.removeItem('mw_docente'); } catch (e) { /* */ } location.replace('./'); return; }
      const curso = nivel === '8' ? '8basico' : '7basico';
      const pj = PERSONAJES.some((x) => x.id === q.get('pj')) ? q.get('pj') : (p.pj || 'zorro');
      sesion.modo = 'docente'; sesion.token = token;
      S = normalizar(p, curso, 'Profe', pj);
      S.curso = curso; S.pj = pj; S.docente = true; S.seccion = 'Docente'; S.nombre = 'Profe';
      history.replaceState(null, '', './');
      guardar(true);
      empezar();
    } catch (e) {
      $('ingreso').classList.remove('oculto');
      error('No hay conexión con el servidor.', 'error-ingreso');
    }
  }

  async function enviarDocente(ev) {
    ev.preventDefault();
    const rut = Nube.rut($('rut-docente').value);
    if (!rut) return error('Revisa el RUT.', 'error-docente');
    try {
      const r = await Nube.docenteEntrar(rut, $('codigo-docente').value);
      if (!r || !r.ok) return error(r && r.error === 'bloqueado' ? 'Demasiados intentos. Espera 15 minutos.' : 'RUT o código incorrecto.', 'error-docente');
      try { sessionStorage.setItem('mw_docente', r.token); } catch (e) { /* */ }
      location.href = 'docente.html';
    } catch (e) { error('No hay conexión con el servidor.', 'error-docente'); }
  }

  function empezar() {
    $('ingreso').classList.add('oculto');
    $('hud').classList.remove('oculto');
    if (tactil()) {
      $('tactil').classList.remove('oculto');
      document.querySelectorAll('.btn-hud kbd, .aviso kbd').forEach((k) => k.classList.add('oculto'));
    }
    // Al volver a abrir el juego siempre se aparece en la base (como si volviera por el portal)
    const venia = S.zona;
    let guardado = [];
    if (venia && venia !== 'base' && venia !== 'pieza') {
      guardado = RECURSOS.map((r) => [r.id, S.mochila[r.id] || 0]).filter(([, n]) => n > 0);
      guardado.forEach(([r, n]) => { S.cofre[r] = (S.cofre[r] || 0) + n; S.mochila[r] = 0; });
      S.vida = vidaMax();
    }
    S.zona = 'base'; S.grupo = 0;
    S.vida = Math.min(S.vida || vidaMax(), vidaMax());
    guardar(true);
    pintarHUD();
    iniciarPhaser('base');
    if (guardado.length) setTimeout(() => toast(`Volviste a tu base. Lo que llevabas quedó en tu cofre: ${guardado.map(([r, n]) => `${n} ${nombreRec(r)}`).join(', ')}.`), 3600);
    if (window.Sonido && !Sonido.cfg.on) setTimeout(() => toast('🔊 El juego tiene música y efectos: actívalos con el botón de sonido (arriba). En clases, usa audífonos.'), 7000);
    setTimeout(() => toast(esDocente() ? 'Modo docente: recursos ilimitados y fabricación sin desafíos.' : S.creado > Date.now() - 60000 ? `¡Bienvenido, ${S.nombre}! Esta es tu base. Camina al portal para viajar.` : `¡Hola de nuevo, ${S.nombre}!`), 700);
  }

  // ===================================================================
  // HUD
  // ===================================================================
  // En un mundo se ven sus recursos; en la base, los de la Unidad 1 y los de otros mundos ya abiertos o con algo guardado
  function recursosVisibles() {
    if (escena && MUNDOS[escena.zona]) return recursosDe(escena.zona);
    const grupos = new Set(['u1', 'u1p']);
    for (const r of RECURSOS) if ((S.cofre[r.id] || 0) + (S.mochila[r.id] || 0) > 0) grupos.add(r.grupo);
    for (const z of Object.keys(MUNDOS)) if (MUNDOS[z].recursos && mundoAbierto({ id: z, habilitada: false })) grupos.add(MUNDOS[z].recursos);
    for (const g of [...grupos]) if (SUBZONA[g]) grupos.add(SUBZONA[g]);
    return RECURSOS.filter((r) => grupos.has(r.grupo));
  }
  function pintarHUD() {
    if (!S) return;
    const enBase = enCasa();
    $('hud-foto').style.backgroundImage = `url('assets/pj/${S.pj}_${texArmadura(S.armadura)}.png')`;
    $('hud-apodo').textContent = S.nombre;
    $('hud-nivel').textContent = `Nivel ${S.nivel}`;
    $('hud-vida').innerHTML = corazones(S.vida, vidaMax());
    $('hud-vida').setAttribute('aria-label', `Vida: ${S.vida} de ${vidaMax()}`);
    $('hud-xpbar').style.width = `${Math.round((S.xp / xpPara(S.nivel)) * 100)}%`;
    $('hud-zona').textContent = escena ? nombreZona(escena.zona) : '';
    const fuente = enBase ? S.cofre : S.mochila;
    const lista = recursosVisibles();
    $('hud-recursos').classList.toggle('muchos', lista.length > 4);
    $('hud-recursos').innerHTML = `<span class="rot">${esDocente() ? 'Docente · ilimitado' : enBase ? 'Cofre' : 'Mochila'}</span>` + lista.map((r) => `
      <div class="recurso" data-r="${r.id}" title="${esc(r.nombre)}">
        <img class="px" src="${ICONO(r.id)}" alt="">
        <span><small>${r.corto || r.nombre}</small><b>${esDocente() ? '∞' : fuente[r.id] || 0}</b></span>
      </div>`).join('');
    const ranuras = [
      { id: 'hacha', icono: 'axe', tecla: '1', ok: true, nombre: tiene('hacha2') ? 'Hacha de hierro' : 'Hacha' },
      { id: 'pico', icono: 'pickaxe', tecla: '2', ok: tiene('pico'), nombre: tiene('pico2') ? 'Pico reforzado' : 'Pico' },
      { id: 'espada', icono: 'espada', tecla: '3', ok: Boolean(S.arma), nombre: S.arma ? ARMAS[S.arma].nombre : 'Espada (equípala en Equipo)' },
      { id: 'balde', icono: 'agua', tecla: '', ok: tiene('balde'), nombre: 'Balde' },
      { id: 'cana', icono: 'cana', tecla: '', ok: tiene('cana'), nombre: tiene('cana') ? `Caña de pescar: le quedan ${usosCana()} de ${CANA_USOS} usos (úsala en el muelle del lago del Bosque)` : 'Caña de pescar' },
    ];
    $('hud-herramientas').innerHTML = ranuras.map((r) => `
      <div class="ranura ${S.herramienta === r.id ? 'activa' : ''} ${r.ok ? '' : 'falta'}" title="${esc(r.ok ? r.nombre : r.nombre + ' (fabrícalo en tu base)')}">
        ${r.tecla ? `<small>${r.tecla}</small>` : ''}<img class="px" src="${ICONO(r.icono)}" alt="${esc(r.nombre)}">
      </div>`).join('');
    $('btn-base').classList.toggle('oculto', !enBase);
    $('btn-decorar').classList.toggle('oculto', !enBase);
    $('btn-portal').classList.toggle('oculto', !esDocente());
    pintarMisiones();
  }
  // Lo que lleva en la mano: hacha, pico o la espada equipada
  function equipar(h) {
    if (h === 'pico' && !tiene('pico')) { toast('Primero fabrica un pico en tu base.'); return; }
    if (h === 'espada' && !S.arma) { toast('No tienes una espada equipada. Ábrela en Equipo (tecla Q).'); return; }
    if (S.herramienta === h) return;
    S.herramienta = h;
    if (escena) escena.vestirJugador();
    pintarHUD();
  }
  // Equipar o quitar armas y armaduras fabricadas
  function ponerEquipo(id) {
    if (id && !tiene(id)) return;
    if (ARMAS[id]) { S.arma = id; S.herramienta = 'espada'; toast(`Equipaste: ${ARMAS[id].nombre}. Tu golpe quita ${danio()}.`); }
    else if (ARMADURAS[id]) {
      const antes = vidaMax(); S.armadura = id;
      S.vida = enCasa() ? Math.min(vidaMax(), S.vida + Math.max(0, vidaMax() - antes)) : Math.min(S.vida, vidaMax());
      toast(`Equipaste: ${ARMADURAS[id].nombre}. Vida máxima: ${vidaMax()} corazones.`);
    }
    if (escena) escena.vestirJugador();
    guardar(true); pintarHUD();
  }
  function quitarEquipo(tipo) {
    if (tipo === 'arma') { S.arma = null; if (S.herramienta === 'espada') S.herramienta = 'hacha'; }
    else { S.armadura = null; S.vida = Math.min(S.vida, vidaMax()); }
    if (escena) escena.vestirJugador();
    guardar(true); pintarHUD();
  }
  // Vista del personaje con su equipo (capas de la hoja, mirando al frente)
  function figuraHTML(pj, armadura, mano, arma, tam = 128) {
    const capa = (url) => `<span style="background-image:url('${url}');background-size:${tam * 9}px ${tam * 4}px;background-position:0 -${tam * 2}px"></span>`;
    let html = '';
    if (mano === 'espada' && arma) html += capa(`assets/capas/${arma}_bg.png`);
    html += capa(`assets/pj/${pj}_${texArmadura(armadura)}.png`);
    if (mano === 'espada' && arma) html += capa(`assets/capas/${arma}_fg.png`);
    else if (mano === 'hacha' || mano === 'pico') html += capa(`assets/capas/${mano}_${cuerpoDe(pj)}.png`);
    return `<div class="figura" style="width:${tam}px;height:${tam}px" role="img" aria-label="Tu personaje con su equipo">${html}</div>`;
  }
  function abrirEquipo() {
    const fila = (id, info, puesto, tipo) => `
      <div class="mejora ${puesto ? 'puesta' : ''}"><img class="ico px" src="${ICONO(tipo === 'arma' ? 'espada' : 'armadura')}" alt="">
        <div class="info"><strong>${esc(info.nombre)}</strong><span>${tipo === 'arma' ? `Cada acierto en combate quita ${info.danio} de vida` : `Vida máxima: ${5 + info.vida + (tiene('cantimplora') ? 1 : 0) + (tiene('casco') ? 1 : 0) + (tiene('abrigo') ? 1 : 0)} corazones`}</span></div>
        ${puesto ? `<button type="button" class="btn" data-quitar="${tipo}">Quitar</button>` : `<button type="button" class="btn pri" data-poner="${id}">Equipar</button>`}
      </div>`;
    const armas = Object.entries(ARMAS).filter(([id]) => tiene(id));
    const armaduras = Object.entries(ARMADURAS).filter(([id]) => tiene(id));
    const manos = [['hacha', 'Hacha', 'axe', true], ['pico', 'Pico', 'pickaxe', tiene('pico')], ['espada', 'Espada', 'espada', Boolean(S.arma)]];
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">Tu personaje</span><h2 id="modal-titulo">Equipo</h2></div><button type="button" class="btn" id="eq-cerrar">Cerrar</button></div>
      <div class="equipo">
        <div class="equipo-vista">
          ${figuraHTML(S.pj, S.armadura, S.herramienta, S.arma, 160)}
          <div class="pildoras"><span class="pildora">Golpe: ${danio()}</span><span class="pildora">Vida máx.: ${vidaMax()}</span></div>
        </div>
        <div class="equipo-listas">
          <h3>En la mano</h3>
          <div class="manos">${manos.map(([id, n, ico, ok]) => `<button type="button" class="obj mano" data-mano="${id}" aria-pressed="${S.herramienta === id}" ${ok ? '' : 'disabled'}><img class="px" src="${ICONO(ico)}" alt=""><span>${n}</span></button>`).join('')}</div>
          <h3>Arma</h3>
          ${armas.length ? armas.map(([id, a]) => fila(id, a, S.arma === id, 'arma')).join('') : '<p class="nota">Aún no tienes armas. Fabrica una espada en la fogata de tu base.</p>'}
          <h3>Armadura</h3>
          ${armaduras.length ? armaduras.map(([id, a]) => fila(id, a, S.armadura === id, 'armadura')).join('') : '<p class="nota">Aún no tienes armadura. Fabrícala en la fogata de tu base.</p>'}
        </div>
      </div>`);
    $('eq-cerrar').addEventListener('click', () => ui.cerrar());
    document.querySelectorAll('[data-poner]').forEach((b) => b.addEventListener('click', () => { ponerEquipo(b.dataset.poner); abrirEquipo(); }));
    document.querySelectorAll('[data-quitar]').forEach((b) => b.addEventListener('click', () => { quitarEquipo(b.dataset.quitar); abrirEquipo(); }));
    document.querySelectorAll('[data-mano]').forEach((b) => b.addEventListener('click', () => { equipar(b.dataset.mano); abrirEquipo(); }));
  }

  // ===================================================================
  // Modales
  // ===================================================================
  const ui = {
    abierto: false, alCerrar: null, teclas: null,
    abrir(html, clase = '', alCerrar = null) {
      if (juegoCerrado && clase !== 'bloqueo') return;
      const m = $('modal');
      m.className = 'modal ' + clase;
      m.innerHTML = html;
      $('capa').classList.remove('oculto');
      this.abierto = true; this.alCerrar = alCerrar; this.teclas = null;
      const foco = m.querySelector('[data-foco]') || m.querySelector('button');
      if (foco) foco.focus();
    },
    cerrar() {
      $('capa').classList.add('oculto');
      $('modal').innerHTML = '';
      this.abierto = false; this.teclas = null;
      const f = this.alCerrar; this.alCerrar = null;
      if (f) f();
      revisarPendientes();
    },
  };
  const unaVez = (f) => { let hecho = false; return (...a) => { if (!hecho) { hecho = true; f(...a); } }; };
  function registrar(tema, acierto) {
    const st = S.stats[tema] || (S.stats[tema] = { a: 0, i: 0 });
    st.i += 1; if (acierto) st.a += 1;
    if (acierto) avanzarMision('acierto', tema);
  }
  function alternativasHTML(d, elegida, fallidas, resuelto) {
    return `<div class="alternativas">${d.opciones.map((o, i) => {
      const cls = resuelto && i === d.correcta ? 'bien' : fallidas.has(i) ? 'mal' : '';
      return `<button type="button" class="alt ${cls}" data-i="${i}" aria-pressed="${elegida === i}" ${resuelto || fallidas.has(i) ? 'disabled' : ''}>${mate(o)}</button>`;
    }).join('')}</div>`;
  }

  // ---------- Desafío para recolectar o fabricar ----------
  function abrirDesafio({ accion, dif, premio, unidad, onOk }) {
    const pagarUnaVez = unaVez(onOk);
    const nuevo = () => Preguntas.nuevo(S.curso, unidad || unidadActual(), dif, S.stats);
    let d = nuevo(), elegida = null, fallos = 0, resuelto = false, pista = false, fallidas = new Set();
    const pintar = () => {
      let msg = '';
      if (resuelto) msg = `<div class="mensaje bien" role="status">¡Correcto! ${mate(d.explicacion)}</div>`;
      else if (fallos >= 2) msg = `<div class="mensaje mal" role="status">Revisemos juntos: ${mate(d.explicacion)} Puedes elegir esa respuesta o pedir otro desafío.</div>`;
      else if (fallos === 1) msg = `<div class="mensaje mal" role="status">Casi. ${mate(d.pista)} Inténtalo otra vez.</div>`;
      else if (pista) msg = `<div class="mensaje pista">${mate(d.pista)}</div>`;
      ui.abrir(`
        <div class="modal-cab">
          <div><span class="etq">${esc(d.titulo)}</span><h2 id="modal-titulo">${esc(accion)}</h2></div>
          <div class="pildoras"><span class="pildora">Dificultad ${dif} de 3</span><span class="pildora premio">${premio}</span></div>
        </div>
        <p class="enunciado">${mate(d.enunciado)}</p>
        ${alternativasHTML(d, elegida, fallidas, resuelto)}
        ${msg}
        <div class="acciones">
          <div>${resuelto ? '' : `<button type="button" class="btn sec" id="d-pista">${pista ? 'Ocultar pista' : 'Ver pista'}</button>`}
               ${!resuelto && fallos >= 2 ? '<button type="button" class="btn sec" id="d-otro">Otro desafío</button>' : ''}</div>
          <div>${resuelto ? '<button type="button" class="btn pri" id="d-seguir" data-foco>¡Seguir!</button>'
            : `<button type="button" class="btn" id="d-salir">Salir</button><button type="button" class="btn pri" id="d-ok" ${elegida === null ? 'disabled' : ''}>Comprobar</button>`}</div>
        </div>`);
      document.querySelectorAll('.alt').forEach((b) => b.addEventListener('click', () => { elegida = Number(b.dataset.i); pintar(); }));
      const on = (id, f) => { const el = $(id); if (el) el.addEventListener('click', f); };
      on('d-pista', () => { pista = !pista; pintar(); });
      on('d-salir', () => ui.cerrar());
      on('d-otro', () => { d = nuevo(); elegida = null; fallos = 0; fallidas = new Set(); pista = false; pintar(); });
      on('d-ok', comprobar);
      on('d-seguir', () => { ui.alCerrar = pagarUnaVez; ui.cerrar(); });
      ui.teclas = teclas;
    };
    const comprobar = () => {
      if (elegida === null || resuelto) return;
      const ok = elegida === d.correcta;
      registrar(d.tema, ok);
      if (ok) { resuelto = true; sfx('acierto'); ganarXP(8 + 6 * dif - Math.min(fallos, 2) * 4); }
      else { fallos += 1; sfx('error'); fallidas.add(elegida); elegida = null; }
      guardar();
      pintar();
    };
    const teclas = (e) => {
      if (/^[1-4]$/.test(e.key) && !resuelto) { const i = Number(e.key) - 1; if (!fallidas.has(i)) { elegida = i; pintar(); } }
      else if (e.key === 'Enter') { e.preventDefault(); if (resuelto) { ui.alCerrar = pagarUnaVez; ui.cerrar(); } else comprobar(); }
    };
    pintar();
  }

  // Aviso grande cuando el jefe aparece en el mapa
  function avisoJefe(nombre) { avisoGrande('¡El jefe ha aparecido!', 'Búscalo y derrótalo', nombre); }
  function avisoGrande(titulo, sub, pie, clase = '') {
    const a = $('aviso-jefe');
    a.querySelector('b').textContent = titulo;
    a.querySelector('span').textContent = sub;
    a.querySelector('small').textContent = pie;
    a.className = `aviso-jefe ${clase}`;
    a.classList.remove('oculto', 'sale'); void a.offsetWidth; a.classList.add('entra');
    clearTimeout(avisoJefe._t);
    avisoJefe._t = setTimeout(() => { a.classList.add('sale'); setTimeout(() => a.classList.add('oculto'), 600); }, 4200);
    if (navigator.vibrate) { try { navigator.vibrate([200, 80, 200]); } catch (e) { /* */ } }
  }

  // ---------- Obras cooperativas: el puente al Bosque profundo y el montacargas al Valle de la Esfinge ----------
  // Todo el nivel (7° u 8° básico) aporta recursos a la misma obra; el avance queda guardado en el sistema
  // y, cuando se completa, queda construida para siempre.
  const OBRAS = {
    puente: { id: 'puente_bosque', meta: { madera: 600, piedra: 350, agua: 150, cristal: 40 }, icono: '🌉', nombre: 'Puente al Bosque profundo', corto: 'el puente', al: 'al puente', local: 'obraLocal',
      intro: 'El río no se puede cruzar. Todos los estudiantes de tu nivel aportan recursos a este mismo puente: el avance se guarda y, cuando se completa, queda construido para siempre.',
      listo: 'El puente está construido para siempre: cruza el río por el camino hacia el Bosque profundo.', fin: '¡Puente terminado!' },
    valle: { id: 'montacargas_valle', meta: { fibra: 500, arenisca: 400, cobre: 200, oro: 60 }, icono: '🏗️', nombre: 'Montacargas al Valle de la Esfinge', corto: 'el montacargas', al: 'al montacargas', local: 'obraLocalValle',
      intro: 'El acantilado no se puede escalar. Todo tu nivel construye el montacargas de poleas: cuerdas de fibra, plataforma de arenisca, poleas de cobre y engranajes de oro. El avance se guarda y, cuando se completa, queda funcionando para siempre.',
      listo: 'El montacargas está terminado para siempre: sube por él hacia el Valle de la Esfinge.', fin: '¡Montacargas terminado!' },
    mina: { id: 'elevador_mina', meta: { carbon: 500, plata: 300, hongo: 150, amatista: 50 }, icono: '⛓️', nombre: 'Elevador a las Profundidades', corto: 'el elevador', al: 'al elevador', local: 'obraLocalMina',
      intro: 'La fosa no se puede bajar a pie. Todo tu nivel construye el elevador de la mina: carbón para la máquina, plata para los cables, hongos luminosos para alumbrar y amatista para el mecanismo. El avance se guarda y, cuando se completa, queda funcionando para siempre.',
      listo: 'El elevador está terminado para siempre: baja por él hacia las Profundidades.', fin: '¡Elevador terminado!' },
  };
  const obraDeEscena = () => (escena && escena.rio ? 'puente' : escena && escena.valle ? 'valle' : escena && escena.prof ? 'mina' : null);
  let cargandoObra = false;
  async function cargarObra(k = obraDeEscena()) {
    if (!S || !k || cargandoObra) return;
    const O = OBRAS[k], antes = obraE[k] ? Boolean(obraE[k].completado) : null;   // null: primera carga (no se celebra)
    let o = null;
    if (sesion.modo === 'nube' || sesion.modo === 'docente') {
      cargandoObra = true;
      try { o = await Nube.obra(sesion.token, O.id, nivelNum()); } catch (e) { o = null; }
      cargandoObra = false;
      if (!o || !o.ok) return;
    } else {
      const L = S[O.local] = S[O.local] || { aportes: {}, completado: false, mio: 0 };
      o = { meta: O.meta, aportes: L.aportes, completado: L.completado, mio: L.mio, top: [], aportantes: 1 };
    }
    obraE[k] = o;
    if (escena && obraDeEscena() === k) escena.actualizarObra(antes === false && Boolean(o.completado));
    if ($('obra-cuerpo')) pintarObra(k);
  }
  setInterval(() => { if (escena && obraDeEscena() && !document.hidden && !ui.abierto) cargarObra(); }, 15000);
  const metaObra = (k) => (obraE[k] && obraE[k].meta) || OBRAS[k].meta;
  const obraFalta = (k, r) => Math.max(0, metaObra(k)[r] - ((obraE[k] && obraE[k].aportes && obraE[k].aportes[r]) || 0));
  const pctObra = (k) => {
    const o = obraE[k]; if (o && o.completado) return 100;
    const meta = metaObra(k), ap = (o && o.aportes) || {};
    const tot = Object.values(meta).reduce((a, b) => a + b, 0), hecho = Object.entries(meta).reduce((a, [r, n]) => a + Math.min(n, ap[r] || 0), 0);
    return Math.floor((hecho / tot) * 100);
  };
  function pintarObra(k) {
    const O = OBRAS[k], o = obraE[k] || { meta: O.meta, aportes: {}, top: [], mio: 0, aportantes: 0 };
    const meta = o.meta || O.meta, ap = o.aportes || {}, pct = pctObra(k);
    const filas = Object.entries(meta).map(([r, n]) => {
      const v = Math.min(n, ap[r] || 0), tengo = esDocente() ? 0 : total_(r), max = Math.min(tengo, obraFalta(k, r));
      return `<div class="obra-fila"><img class="px" src="${ICONO(r)}" alt=""><div class="obra-info"><div class="fila"><strong>${esc(REC[r].nombre)}</strong><span>${v} de ${n}</span></div><div class="barra"><i style="width:${(v / n) * 100}%"></i></div></div>
        ${o.completado || esDocente() ? '' : `<div class="obra-aporte"><input type="number" min="0" max="${max}" value="0" data-obra="${r}" aria-label="Cuánto ${esc(REC[r].nombre.toLowerCase())} aportas" ${max ? '' : 'disabled'}><button type="button" class="btn sec chico" data-todo="${r}" ${max ? '' : 'disabled'}>Todo (${max})</button></div>`}</div>`;
    }).join('');
    const top = (o.top || []).map((x, i) => `<li><span>${['🥇', '🥈', '🥉'][i] || i + 1 + '.'}</span><span>${esc(x.nombre)}</span><b>${x.total}</b></li>`).join('');
    $('obra-cuerpo').innerHTML = `
      <div class="obra-total"><div class="fila"><strong>${o.completado ? O.fin : 'Avance de la obra'}</strong><span>${pct} %</span></div><div class="barra meta"><i style="width:${pct}%"></i></div></div>
      <div class="des-cols"><div class="obra-recursos">${filas}</div>
        <aside class="des-tabla"><span class="etq">Quienes más han aportado</span><ol class="des-ranking">${top || '<li class="vacio">Aún nadie aporta. ¡Sé el primero!</li>'}</ol>
          <span class="nota">Tu aporte: <b>${o.mio || 0}</b> recursos · ${o.aportantes || 0} ${o.aportantes === 1 ? 'estudiante ha' : 'estudiantes han'} aportado</span></aside></div>
      ${o.completado ? `<div class="mensaje bien" role="status">${O.listo}</div>`
        : esDocente() ? '<p class="nota">Como docente puedes ver el avance; los aportes los hacen tus estudiantes.</p>'
          : `<div class="acciones"><span class="nota">Elige cuánto aportar: se descuenta de tu cofre y tu mochila. Para aportar responde un desafío.</span><button type="button" class="btn pri" id="obra-aportar">Aportar ${O.al}</button></div>`}`;
    document.querySelectorAll('[data-todo]').forEach((b) => b.addEventListener('click', () => { const i = document.querySelector(`[data-obra="${b.dataset.todo}"]`); i.value = i.max; }));
    const bt = $('obra-aportar'); if (bt) bt.addEventListener('click', () => aportarObra(k));
  }
  const total_ = (r) => (S.mochila[r] || 0) + (S.cofre[r] || 0);
  function abrirObra(k = obraDeEscena()) {
    if (!k) return;
    const O = OBRAS[k];
    ui.abrir(`<div class="modal-cab"><div><span class="etq">Obra de todo ${S.curso === '8basico' ? '8°' : '7°'} básico · se completa entre todos</span><h2 id="modal-titulo">${O.icono} ${esc(O.nombre)}</h2></div><button type="button" class="btn" id="obra-cerrar">Cerrar</button></div>
      <p class="nota">${O.intro}</p>
      <div id="obra-cuerpo"></div>`, 'ancho');
    $('obra-cerrar').addEventListener('click', () => ui.cerrar());
    pintarObra(k);
    cargarObra(k);
  }
  function aportarObra(k) {
    const O = OBRAS[k], rec = {};
    document.querySelectorAll('[data-obra]').forEach((i) => {
      const r = i.dataset.obra, n = Math.max(0, Math.min(Math.floor(Number(i.value) || 0), total_(r), obraFalta(k, r)));
      if (n > 0) rec[r] = n;
    });
    if (!Object.keys(rec).length) return toast('Elige cuántos recursos quieres aportar (o usa «Todo»).', 'alerta');
    const resumen = Object.entries(rec).map(([r, n]) => `${n} ${nombreRec(r)}`).join(', ');
    abrirDesafio({ accion: `Aportar ${O.al}`, dif: difPara(2), premio: `Aporte: ${resumen}`, onOk: async () => {
      let r = null;
      if (sesion.modo === 'nube') {
        try { r = await Nube.obraAportar(sesion.token, O.id, rec); } catch (e) { r = null; }
        if (!r || !r.ok) { toast('No se pudo enviar tu aporte. Revisa tu conexión e inténtalo otra vez.', 'alerta'); return; }
      } else {
        const L = S[O.local] = S[O.local] || { aportes: {}, completado: false, mio: 0 }, acep = {};
        for (const [x, n] of Object.entries(rec)) { const d = Math.min(n, O.meta[x] - (L.aportes[x] || 0)); if (d > 0) { acep[x] = d; L.aportes[x] = (L.aportes[x] || 0) + d; L.mio += d; } }
        L.completado = Object.entries(O.meta).every(([x, n]) => (L.aportes[x] || 0) >= n);
        r = { ok: true, meta: O.meta, aportes: L.aportes, completado: L.completado, mio: L.mio, top: [], aportantes: 1, aceptado: acep };
      }
      const acep = r.aceptado || {};
      const antes = Boolean(obraE[k] && obraE[k].completado);
      pagar(acep); sfx('fabricar');
      const n = Object.values(acep).reduce((a, b) => a + b, 0);
      ganarXP(Math.min(60, 5 + Math.floor(n / 4)));
      obraE[k] = r; guardar(true); pintarHUD();
      if (escena && obraDeEscena() === k) escena.actualizarObra(!antes && Boolean(r.completado));
      if (escena && escena.canal) escena.canal.emitir('obra', {});
      toast(n ? `¡Aportaste ${Object.entries(acep).map(([x, v]) => `${v} ${nombreRec(x)}`).join(', ')} ${O.al}!` : `${O.corto[0].toUpperCase() + O.corto.slice(1)} ya tenía esos recursos completos.`);
      if (escena) escena.celebrar();
      setTimeout(() => { if (!ui.abierto) abrirObra(k); }, 400);
    } });
  }

  // ---------- Minijuego de pesca ----------
  // El pez se mueve por una barra vertical; con ESPACIO (o manteniendo presionado) se sube el aro.
  // Mientras el pez esté dentro del aro se llena la barra de captura; si sale, se vacía.
  const PECES = [
    { id: 'trucha', nombre: 'trucha', un: 'una', el: 'La', lo: 'la', peso: 40, dif: 1, vida: 2 },
    { id: 'carpa', nombre: 'carpa', un: 'una', el: 'La', lo: 'la', peso: 30, dif: 1.3, vida: 2 },
    { id: 'salmon', nombre: 'salmón', un: 'un', el: 'El', lo: 'lo', peso: 20, dif: 1.8, vida: 3 },
    { id: 'dorado', nombre: 'pez dorado', un: 'un', el: 'El', lo: 'lo', peso: 10, dif: 2.4, vida: 4 },
    // Solo en el estanque del Bosque profundo
    { id: 'luna', nombre: 'pez luna', un: 'un', el: 'El', lo: 'lo', peso: 30, dif: 2.0, vida: 3, profundo: true },
    { id: 'anguila', nombre: 'anguila de raíz', un: 'una', el: 'La', lo: 'la', peso: 22, dif: 2.6, vida: 3, profundo: true },
    { id: 'ancestral', nombre: 'carpa ancestral', un: 'una', el: 'La', lo: 'la', peso: 8, dif: 3.2, vida: 5, profundo: true },
  ];
  const DONDE_PEZ = (p) => (p.profundo ? 'Estanque del Bosque profundo' : 'Gran lago y estanque del bosque');
  function abrirAlbum() {
    const A = S.album || {}, tengo = PECES.filter((p) => A[p.id]).length;
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">Colección · ${tengo} de ${PECES.length} especies</span><h2 id="modal-titulo">📖 Álbum de peces</h2></div><button type="button" class="btn" id="al-cerrar">Cerrar</button></div>
      <p class="nota">Pesca cada especie al menos una vez para completar el álbum. Premio al completarlo: un acuario exclusivo para tu pieza y 100 de experiencia.${S.albumPremio ? ' <strong>¡Ya lo completaste!</strong>' : ''}</p>
      <div class="album">${PECES.map((p) => `<div class="pez-card ${A[p.id] ? '' : 'falta'}"><img class="px" src="${ICONO('pez_' + p.id)}" alt=""><strong>${A[p.id] ? esc(p.nombre[0].toUpperCase() + p.nombre.slice(1)) : '???'}</strong><small>${A[p.id] ? `Pescados: ${A[p.id]}` : esc(DONDE_PEZ(p))}</small></div>`).join('')}</div>`);
    $('al-cerrar').addEventListener('click', () => ui.cerrar());
  }
  function registrarPez(pez) {
    S.album = S.album || {};
    const nuevo = !S.album[pez.id];
    S.album[pez.id] = (S.album[pez.id] || 0) + 1;
    if (!S.albumPremio && PECES.every((p) => S.album[p.id])) {
      S.albumPremio = true;
      S.inventario.acuario = (S.inventario.acuario || 0) + 1;
      ganarXP(100);
      setTimeout(() => avisoGrande('¡Completaste el álbum de peces!', 'Ganaste un acuario exclusivo para tu pieza', '+100 de experiencia'), 900);
    }
    return nuevo;
  }
  // La caña dura 5 pescas; al agotarse se rompe y hay que fabricar otra
  const CANA_USOS = 5;
  function usosCana() { if (esDocente()) return CANA_USOS; return tiene('cana') ? (typeof S.canaUsos === 'number' ? S.canaUsos : CANA_USOS) : 0; }
  function gastarCana() {
    if (esDocente()) return false;   // la caña del docente no se rompe
    S.canaUsos = Math.max(0, usosCana() - 1);
    const rota = S.canaUsos === 0;
    if (rota) { S.mejoras = S.mejoras.filter((m) => m !== 'cana'); toast('¡Tu caña de pescar se rompió! Fabrica una nueva en la fogata de tu base.', 'alerta'); }
    pintarHUD(); guardar(true);
    return rota;
  }
  function abrirPesca(profundo = false) {
    if (!tiene('cana')) { toast('Necesitas una caña de pescar. Fabrícala en la fogata de tu base (pestaña Equipo).'); return; }
    const lista = PECES.filter((p) => (profundo ? p.profundo || p.id === 'dorado' : !p.profundo));
    let total = lista.reduce((a, p) => a + p.peso, 0), r = Math.random() * total, pez = lista[0];
    for (const p of lista) { if ((r -= p.peso) < 0) { pez = p; break; } }
    const H = 300, R = 44, PEZ = 30;
    const st = { fase: 'espera', aro: H - R, vAro: 0, pez: H * 0.6, vPez: 0, meta: H * 0.6, cambio: 0, prog: 0.3, sube: false, t0: performance.now(), pica: 800 + Math.random() * 1800 };
    let raf = 0, ultimo = performance.now(), fin = false;
    sfx('lanzar');
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">${profundo ? 'Estanque del Bosque profundo' : 'Gran lago del bosque'} · Caña: ${usosCana()} de ${CANA_USOS} usos</span><h2 id="modal-titulo">🎣 Pescar</h2></div><div><button type="button" class="btn sec" id="pz-album">📖 Álbum</button> <button type="button" class="btn" id="pz-salir">Salir</button></div></div>
      <div class="pesca">
        <div class="pesca-barra" id="pz-barra" aria-label="Barra de pesca"><div class="pesca-aro" id="pz-aro"></div><img class="pesca-pez px" id="pz-pez" src="${ICONO('pez')}" alt="Pez"></div>
        <div class="pesca-captura" aria-label="Captura"><i id="pz-prog"></i></div>
        <div class="pesca-info">
          <p class="enunciado" id="pz-estado">Lanzaste el anzuelo… espera a que pique.</p>
          <p class="nota">Mantén presionada la tecla <kbd>ESPACIO</kbd> (o el botón) para subir el aro; suéltala para que baje. Mantén al pez dentro del aro hasta llenar la barra verde.</p>
          <button type="button" class="btn pri pesca-btn" id="pz-subir">Mantén para subir el aro</button>
        </div>
      </div>`, 'pesca-modal', () => {
      fin = true; cancelAnimationFrame(raf); document.removeEventListener('keyup', soltar);
      if (st.fase === 'lucha') { st.fase = 'fin'; toast(`Soltaste la caña y ${pez.el.toLowerCase()} ${pez.nombre} se escapó.`); gastarCana(); }   // salir con el pez enganchado gasta un uso
    });
    const aro = $('pz-aro'), pezEl = $('pz-pez'), prog = $('pz-prog'), estado = $('pz-estado'), btn = $('pz-subir'), barra = $('pz-barra');
    if (document.activeElement) document.activeElement.blur();
    const soltar = (e) => { if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); st.sube = false; } };
    document.addEventListener('keyup', soltar);
    ui.teclas = (e) => { if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); st.sube = true; } };
    for (const el of [btn, barra]) {
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); st.sube = true; });
      el.addEventListener('pointerup', () => { st.sube = false; });
      el.addEventListener('pointerleave', () => { st.sube = false; });
      el.addEventListener('pointercancel', () => { st.sube = false; });
    }
    $('pz-salir').addEventListener('click', () => ui.cerrar());
    $('pz-album').addEventListener('click', () => { if (st.fase === 'espera') { ui.cerrar(); abrirAlbum(); } });
    const pintar = () => {
      aro.style.transform = `translateY(${st.aro - R}px)`;
      pezEl.style.transform = `translateY(${st.pez - PEZ / 2}px)`;
      prog.style.height = `${Math.round(st.prog * 100)}%`;
      const dentro = Math.abs(st.pez - st.aro) < R - 4;
      aro.classList.toggle('dentro', st.fase === 'lucha' && dentro);
      return dentro;
    };
    const terminar = (atrapado) => {
      st.fase = 'fin'; cancelAnimationFrame(raf);
      document.removeEventListener('keyup', soltar); ui.teclas = null;
      let msg, clase = 'bien';
      if (atrapado) {
        sfx('pesca'); avanzarMision('pescar'); ganarXP(6 + Math.round(pez.dif * 4));
        const nuevo = registrarPez(pez);
        if (S.vida < vidaMax() && Math.random() < 0.65) {
          const antes = S.vida; S.vida = Math.min(vidaMax(), S.vida + pez.vida); pintarHUD();
          const n = S.vida - antes;
          msg = `¡Pescaste ${pez.un} ${pez.nombre}!${nuevo ? ' (¡nueva en tu álbum!)' : ''} Te ${pez.lo} comiste y recuperaste ${n} ${n === 1 ? 'corazón' : 'corazones'}.`;
          if (escena) escena.flotante(escena.jugador.x, escena.jugador.y - 70, `+${n} ❤`, '#ff9a9a');
        } else {
          const lista = recursosDe(escena && MUNDOS[escena.zona] ? escena.zona : 'u1');
          const pool = []; lista.forEach((x, i) => { for (let k = 0; k < 4 - i; k++) pool.push(x.id); });
          const rec = pool[Math.floor(Math.random() * pool.length)];
          const cant = (rec === 'cristal' ? 1 : 2 + Math.floor(Math.random() * 2)) + (pez.id === 'dorado' ? 2 : 0);
          sumar(rec, cant);
          msg = `¡Pescaste ${pez.un} ${pez.nombre}!${nuevo ? ' (¡nueva en tu álbum!)' : ''} Junto a ${pez.lo === 'lo' ? 'él' : 'ella'} sacaste del fondo ${cant} ${nombreRec(rec)}.`;
          if (escena) escena.flotante(escena.jugador.x, escena.jugador.y - 70, `+${cant} ${nombreRec(rec)}`);
        }
        if (escena) escena.celebrar(escena.jugador.x, escena.jugador.y - 60);
        toast(msg);
        guardar(true);
      } else { sfx('error'); msg = `¡${pez.el} ${pez.nombre} se escapó! Inténtalo otra vez.`; clase = 'mal'; }
      const rota = gastarCana();
      const cana = rota ? '<div class="mensaje mal" role="status">¡Tu caña de pescar se rompió! Fabrica una nueva en la fogata de tu base para volver a pescar.</div>'
        : `<span class="nota">A tu caña le ${usosCana() === 1 ? 'queda 1 uso' : `quedan ${usosCana()} usos`}.</span>`;
      const etq = document.querySelector('#modal .modal-cab .etq');
      if (etq) etq.textContent = `Gran lago del bosque · Caña: ${usosCana()} de ${CANA_USOS} usos`;
      const info = document.querySelector('#modal .pesca-info');
      if (info) {
        info.innerHTML = `<div class="mensaje ${clase}" role="status" style="font-size:18px">${esc(msg)}</div>${cana}
          <div class="acciones">${rota ? '<span></span>' : '<button type="button" class="btn sec" id="pz-otra">Pescar otra vez</button>'}<button type="button" class="btn pri" id="pz-ok" data-foco>¡Listo!</button></div>`;
        $('pz-ok').addEventListener('click', () => ui.cerrar());
        if (!rota) $('pz-otra').addEventListener('click', () => { ui.alCerrar = null; ui.cerrar(); abrirPesca(profundo); });
        $('pz-ok').focus();
        ui.teclas = (e) => { if (e.key === 'Enter') { e.preventDefault(); ui.cerrar(); } };
      }
    };
    const paso = (ahora) => {
      if (fin || st.fase === 'fin') return;
      const dt = Math.min(0.05, (ahora - ultimo) / 1000); ultimo = ahora;
      // el aro: sube mientras se mantiene presionado, cae al soltar
      st.vAro += (st.sube ? -950 : 720) * dt;
      st.vAro = Math.max(-360, Math.min(360, st.vAro));
      st.aro += st.vAro * dt;
      if (st.aro < R) { st.aro = R; st.vAro *= -0.25; }
      if (st.aro > H - R) { st.aro = H - R; st.vAro *= -0.25; }
      if (st.fase === 'espera') {
        st.pez = H * 0.6 + Math.sin(ahora / 300) * 6;
        if (ahora - st.t0 > st.pica) { st.fase = 'lucha'; sfx('pica'); estado.textContent = `¡Picó ${pez.un} ${pez.nombre}! Mantenlo dentro del aro.`; if (escena) escena.cameras.main.shake(160, 0.004); }
      } else {
        // el pez cambia de rumbo cada cierto tiempo; los más difíciles son más rápidos y nerviosos
        st.cambio -= dt;
        if (st.cambio <= 0) { st.meta = PEZ + Math.random() * (H - 2 * PEZ); st.cambio = (0.8 + Math.random() * 1.4) / Math.sqrt(pez.dif); }
        const fuerza = (st.meta - st.pez) * 4 * pez.dif;
        st.vPez += fuerza * dt; st.vPez *= Math.pow(0.08, dt);
        const vmax = 70 + 60 * pez.dif; st.vPez = Math.max(-vmax, Math.min(vmax, st.vPez));
        st.pez = Math.max(PEZ / 2, Math.min(H - PEZ / 2, st.pez + st.vPez * dt));
      }
      const dentro = pintar();
      if (st.fase === 'lucha') {
        st.prog += (dentro ? 0.32 : -0.13 - 0.03 * pez.dif) * dt;
        if (st.prog >= 1) { st.prog = 1; pintar(); terminar(true); return; }
        if (st.prog <= 0) { st.prog = 0; pintar(); terminar(false); return; }
      }
      raf = requestAnimationFrame(paso);
    };
    pintar();
    raf = requestAnimationFrame(paso);
  }

  // ---------- Gemas del Valle de la Esfinge (álbum) ----------
  // Se consiguen al superar el laberinto de la Gran Esfinge (y, a veces, enterradas en las excavaciones).
  const GEMAS = [
    { id: 'cuarzo', nombre: 'Cuarzo rosado', rareza: 'Común', peso: 24 },
    { id: 'topacio', nombre: 'Topacio', rareza: 'Común', peso: 20 },
    { id: 'turquesa', nombre: 'Turquesa', rareza: 'Común', peso: 18 },
    { id: 'lapislazuli', nombre: 'Lapislázuli', rareza: 'Poco común', peso: 12 },
    { id: 'esmeralda', nombre: 'Esmeralda', rareza: 'Poco común', peso: 10 },
    { id: 'rubi', nombre: 'Rubí', rareza: 'Rara', peso: 7 },
    { id: 'zafiro_estrella', nombre: 'Zafiro estrella', rareza: 'Rara', peso: 5 },
    { id: 'opalo', nombre: 'Ópalo de fuego', rareza: 'Rara', peso: 4 },
    { id: 'diamante', nombre: 'Diamante del desierto', rareza: 'Épica', peso: 2 },
    { id: 'ojo_esfinge', nombre: 'Ojo de la Esfinge', rareza: 'Legendaria', peso: 1, solo: 'laberinto' },
  ];
  const CLASE_RAREZA = { 'Común': 'comun', 'Poco común': 'poco', 'Rara': 'rara', 'Épica': 'epica', 'Legendaria': 'legendaria' };
  // bono > 1 aumenta la probabilidad de las gemas raras; si sale una repetida se vuelve a sortear una vez
  function sortearGema(bono = 1, origen = 'laberinto') {
    const lista = GEMAS.filter((g) => !g.solo || g.solo === origen);
    const tirar = () => {
      const pesos = lista.map((g) => g.peso * (g.peso <= 7 ? bono : 1));
      let r = Math.random() * pesos.reduce((a, b) => a + b, 0);
      for (let i = 0; i < lista.length; i++) { if ((r -= pesos[i]) < 0) return lista[i]; }
      return lista[0];
    };
    let g = tirar();
    if (S.gemas && S.gemas[g.id] && Math.random() < 0.6) g = tirar();
    return g;
  }
  function registrarGema(g) {
    S.gemas = S.gemas || {};
    const nueva = !S.gemas[g.id];
    S.gemas[g.id] = (S.gemas[g.id] || 0) + 1;
    if (!S.gemasPremio && GEMAS.every((x) => S.gemas[x.id])) {
      S.gemasPremio = true;
      S.inventario.vitrina_gemas = (S.inventario.vitrina_gemas || 0) + 1;
      ganarXP(120);
      setTimeout(() => avisoGrande('¡Completaste el álbum de gemas!', 'Ganaste una vitrina de gemas exclusiva para tu pieza', '+120 de experiencia'), 1100);
    }
    return nueva;
  }
  function abrirAlbumGemas() {
    const A = S.gemas || {}, tengo = GEMAS.filter((g) => A[g.id]).length;
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">Colección · ${tengo} de ${GEMAS.length} gemas</span><h2 id="modal-titulo">💎 Álbum de gemas</h2></div><button type="button" class="btn" id="ag-cerrar">Cerrar</button></div>
      <p class="nota">Supera el laberinto de la Gran Esfinge para ganar gemas (las más raras salen cuando respondes bien a la primera). A veces también aparecen enterradas en las excavaciones. Premio al completar el álbum: una vitrina de gemas exclusiva y 120 de experiencia.${S.gemasPremio ? ' <strong>¡Ya lo completaste!</strong>' : ''}</p>
      <div class="album gemas">${GEMAS.map((g) => `<div class="pez-card ${A[g.id] ? '' : 'falta'}"><img class="px" src="${ICONO('gema_' + g.id)}" alt=""><strong>${A[g.id] ? esc(g.nombre) : '???'}</strong><small class="rareza ${CLASE_RAREZA[g.rareza]}">${esc(g.rareza)}</small><small>${A[g.id] ? `Tienes: ${A[g.id]}` : g.solo ? 'Solo en el laberinto' : 'Laberinto o excavación'}</small></div>`).join('')}</div>`);
    $('ag-cerrar').addEventListener('click', () => ui.cerrar());
  }

  // ---------- Minijuego de excavación ----------
  // Bajo la arena hay piezas enterradas. La brocha quita una capa de una casilla; la pala quita más, pero
  // hace temblar la excavación. Si la firmeza llega a 0, se derrumba y se pierde lo que quedó enterrado.
  const PIEZAS_EXC = [
    { id: 'fosil_g', nombre: 'Fósil de pez', w: 3, h: 2, peso: 12, rec: { fosil: 3 } },
    { id: 'fosil_m', nombre: 'Amonita fósil', w: 2, h: 2, peso: 16, rec: { fosil: 2 } },
    { id: 'hueso', nombre: 'Hueso fósil', w: 2, h: 1, peso: 20, rec: { fosil: 1 } },
    { id: 'obs_l', nombre: 'Trozo de obsidiana', w: 2, h: 1, peso: 14, rec: { obsidiana: 2 } },
    { id: 'obs_s', nombre: 'Esquirla de obsidiana', w: 1, h: 1, peso: 16, rec: { obsidiana: 1 } },
    { id: 'pepita', nombre: 'Pepita de oro', w: 1, h: 1, peso: 14, rec: { oro: 1 } },
    { id: 'escarabajo_oro', nombre: 'Escarabajo de oro', w: 2, h: 2, peso: 5, rec: { oro: 3 } },
    { id: 'vasija', nombre: 'Vasija antigua', w: 2, h: 2, peso: 9, rec: { cobre: 2, arenisca: 3 } },
    { id: 'gema', nombre: 'Gema', w: 1, h: 1, peso: 5, gema: true },
  ];
  function abrirExcavacion(alTerminar) {
    const W = 10, H = 7, capas = [], ocup = new Array(W * H).fill(-1), piezas = [];
    for (let i = 0; i < W * H; i++) capas.push(1 + (Math.random() < 0.55 ? 1 : 0) + (Math.random() < 0.25 ? 1 : 0));
    const nPiezas = 3 + (Math.random() < 0.5 ? 1 : 0) + (Math.random() < 0.25 ? 1 : 0);
    const totalPeso = PIEZAS_EXC.reduce((a, p) => a + p.peso, 0);
    for (let t = 0; t < 200 && piezas.length < nPiezas; t++) {
      let r = Math.random() * totalPeso, P = PIEZAS_EXC[0];
      for (const p of PIEZAS_EXC) { if ((r -= p.peso) < 0) { P = p; break; } }
      if (P.gema && piezas.some((x) => x.gema)) continue;
      const x = Math.floor(Math.random() * (W - P.w + 1)), y = Math.floor(Math.random() * (H - P.h + 1));
      let libre = true;
      for (let dy = 0; dy < P.h && libre; dy++) for (let dx = 0; dx < P.w && libre; dx++) if (ocup[(y + dy) * W + x + dx] >= 0) libre = false;
      if (!libre) continue;
      const k = piezas.length, celdas = [];
      for (let dy = 0; dy < P.h; dy++) for (let dx = 0; dx < P.w; dx++) { const i = (y + dy) * W + x + dx; ocup[i] = k; celdas.push(i); capas[i] = Math.max(2, capas[i]); }
      const g = P.gema ? sortearGema(1, 'excavacion') : null;
      piezas.push({ ...P, x, y, celdas, ok: false, g, brilla: celdas[Math.floor(Math.random() * celdas.length)] });
    }
    const fMax = tiene('pala2') ? 140 : 100;
    let firmeza = fMax, modo = 'brocha', fin = false;
    const hallado = [];
    const img = (p) => (p.gema ? `assets/excava/gema_${p.g.id}.png` : `assets/excava/${p.id}.png`);
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">Sitio arqueológico · Valle de la Esfinge</span><h2 id="modal-titulo">⛏️ Excavación</h2></div><button type="button" class="btn" id="ex-salir">Terminar</button></div>
      <div class="excava">
        <div class="ex-lado">
          <div class="ex-firmeza"><div class="fila"><strong>Firmeza de la excavación</strong><span id="ex-fn">${firmeza}</span></div><div class="barra"><i id="ex-fb" style="width:100%"></i></div></div>
          <div class="ex-herr" role="radiogroup" aria-label="Herramienta">
            <button type="button" class="obj" data-h="brocha" aria-pressed="true"><img class="px" src="${ICONO('brocha')}" alt=""><span>Brocha</span><small>1 capa · tiembla poco</small></button>
            <button type="button" class="obj" data-h="pala" aria-pressed="false"><img class="px" src="${ICONO(tiene('pala2') ? 'pala2' : 'pala')}" alt=""><span>Pala</span><small>Cava en cruz · tiembla más</small></button>
          </div>
          <p class="nota">Haz clic en la arena para cavar. Las piezas enterradas se recogen solas cuando quedan completamente descubiertas. <b>Pista:</b> donde algo brilla, hay algo enterrado. Teclas <kbd>1</kbd> brocha y <kbd>2</kbd> pala.</p>
          <ul class="ex-hallado" id="ex-hallado"><li class="vacio">Aún no encuentras nada.</li></ul>
        </div>
        <div class="ex-cuadro" id="ex-cuadro" style="aspect-ratio:${W}/${H}">
          ${piezas.map((p, k) => `<img class="ex-pieza px" id="ex-p${k}" src="${img(p)}" alt="" style="left:${(p.x / W) * 100}%;top:${(p.y / H) * 100}%;width:${(p.w / W) * 100}%;height:${(p.h / H) * 100}%">`).join('')}
          <div class="ex-celdas" style="grid-template-columns:repeat(${W},1fr)">${capas.map((c, i) => `<button type="button" class="ex-c c${c}" data-c="${i}" aria-label="Arena"></button>`).join('')}</div>
        </div>
      </div>
      <div id="ex-fin"></div>`, 'excava-modal', () => { if (!fin) terminar('salir', true); });
    const cuadro = $('ex-cuadro');
    const pintarCelda = (i) => {
      const b = cuadro.querySelector(`[data-c="${i}"]`); if (!b) return;
      const k = ocup[i];
      b.className = `ex-c c${capas[i]}${k >= 0 && piezas[k].brilla === i && capas[i] > 0 ? ' brilla' : ''}`;
    };
    for (let i = 0; i < W * H; i++) pintarCelda(i);
    const pintarFirmeza = () => {
      $('ex-fn').textContent = Math.max(0, firmeza);
      const b = $('ex-fb'); b.style.width = `${Math.max(0, (firmeza / fMax) * 100)}%`;
      b.parentElement.classList.toggle('peligro', firmeza < fMax * 0.3);
    };
    const pintarHallado = () => {
      $('ex-hallado').innerHTML = hallado.length ? hallado.map((p) => `<li><img class="px" src="${img(p)}" alt=""><span>${esc(p.gema ? p.g.nombre : p.nombre)}</span><b>${p.gema ? '💎 álbum' : Object.entries(p.rec).map(([r, n]) => `+${n} ${nombreRec(r)}`).join(', ')}</b></li>`).join('') : '<li class="vacio">Aún no encuentras nada.</li>';
    };
    const revisar = () => {
      piezas.forEach((p, k) => {
        if (p.ok || p.celdas.some((i) => capas[i] > 0)) return;
        p.ok = true; hallado.push(p); sfx('brillo');
        const el = $(`ex-p${k}`); if (el) el.classList.add('hallada');
        if (p.gema) {
          const nueva = registrarGema(p.g);
          toast(`¡Encontraste una gema enterrada: ${p.g.nombre}!${nueva ? ' Nueva en tu álbum.' : ''}`);
        } else Object.entries(p.rec).forEach(([r, n]) => sumar(r, n));
        pintarHallado();
      });
      if (piezas.every((p) => p.ok)) terminar('todo');
    };
    const cavar = (i) => {
      if (fin) return;
      const x = i % W, y = Math.floor(i / W);
      if (modo === 'brocha') {
        if (capas[i] <= 0) return;
        capas[i] -= 1; firmeza -= 2; sfx('recolectar'); pintarCelda(i);
      } else {
        const hondo = tiene('pala2') ? 3 : 2;
        capas[i] = Math.max(0, capas[i] - hondo); pintarCelda(i);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const j = yy * W + xx; capas[j] = Math.max(0, capas[j] - 1); pintarCelda(j);
        }
        firmeza -= tiene('pala2') ? 4 : 5; sfx('picar');
        cuadro.classList.remove('tiembla'); void cuadro.offsetWidth; cuadro.classList.add('tiembla');
      }
      pintarFirmeza();
      revisar();
      if (!fin && firmeza <= 0) terminar('derrumbe');
    };
    cuadro.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => cavar(Number(b.dataset.c))));
    const elegir = (h) => { modo = h; document.querySelectorAll('[data-h]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.h === h))); };
    document.querySelectorAll('[data-h]').forEach((b) => b.addEventListener('click', () => elegir(b.dataset.h)));
    ui.teclas = (e) => { if (e.key === '1') elegir('brocha'); else if (e.key === '2') elegir('pala'); };
    $('ex-salir').addEventListener('click', () => (fin ? ui.cerrar() : terminar('salir')));
    function terminar(motivo, cerrando = false) {
      if (fin) return;
      fin = true;
      const xp = hallado.length * 6 + (motivo === 'todo' ? 15 : 0);
      if (xp) ganarXP(xp);
      if (motivo === 'derrumbe') { sfx('boom'); if (escena) escena.cameras.main.shake(300, 0.006); } else if (motivo === 'todo') sfx('logro');
      guardar(true);
      if (alTerminar) alTerminar(hallado.length);
      if (cerrando) return;
      piezas.forEach((p, k) => { if (!p.ok) { const el = $(`ex-p${k}`); if (el) el.classList.add('perdida'); } });
      cuadro.querySelectorAll('.ex-c').forEach((b) => { b.disabled = true; if (motivo === 'derrumbe') b.className = 'ex-c c3'; else b.classList.add('fin'); });
      const msg = motivo === 'derrumbe' ? `¡La excavación se derrumbó! ${hallado.length ? `Alcanzaste a rescatar ${hallado.length} ${hallado.length === 1 ? 'pieza' : 'piezas'}.` : 'No alcanzaste a rescatar nada.'}`
        : motivo === 'todo' ? `¡Excelente! Desenterraste las ${hallado.length} piezas del sitio. (+${xp} de experiencia)` : `Terminaste la excavación con ${hallado.length} ${hallado.length === 1 ? 'pieza' : 'piezas'}.`;
      $('ex-fin').innerHTML = `<div class="mensaje ${motivo === 'derrumbe' ? 'mal' : 'bien'}" role="status">${esc(msg)}</div><div class="acciones"><span class="nota">El sitio quedará excavado por un rato: busca otro o vuelve más tarde.</span><button type="button" class="btn pri" id="ex-ok" data-foco>¡Listo!</button></div>`;
      $('ex-salir').textContent = 'Cerrar';
      $('ex-ok').addEventListener('click', () => ui.cerrar()); $('ex-ok').focus();
      ui.teclas = (e) => { if (e.key === 'Enter') { e.preventDefault(); ui.cerrar(); } };
    }
  }

  // ---------- Laberinto de la Gran Esfinge ----------
  // Cada vez se genera un laberinto nuevo. Está oscuro: solo se ve lo que alumbra la antorcha.
  // En el camino hay puertas selladas por la esfinge que se abren respondiendo bien un ejercicio.
  // Al llegar a la cámara del tesoro se gana una gema para el álbum.
  function crearLaberinto(cw, ch) {
    const GW = cw * 2 + 1, GH = ch * 2 + 1, g = Array.from({ length: GH }, () => new Array(GW).fill(1));
    const pila = [[Math.floor(Math.random() * cw), Math.floor(Math.random() * ch)]], vis = new Set([pila[0].join()]);
    g[pila[0][1] * 2 + 1][pila[0][0] * 2 + 1] = 0;
    while (pila.length) {
      const [x, y] = pila[pila.length - 1];
      const vec = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy, dx, dy]).filter(([a, b]) => a >= 0 && b >= 0 && a < cw && b < ch && !vis.has(`${a},${b}`));
      if (!vec.length) { pila.pop(); continue; }
      const [a, b, dx, dy] = vec[Math.floor(Math.random() * vec.length)];
      g[y * 2 + 1 + dy][x * 2 + 1 + dx] = 0; g[b * 2 + 1][a * 2 + 1] = 0;
      vis.add(`${a},${b}`); pila.push([a, b]);
    }
    return g;
  }
  function abrirLaberinto() {
    if (!tiene('antorcha_esfinge')) { toast('El laberinto está totalmente oscuro: fabrica la antorcha de la esfinge en la fogata de tu base.', 'alerta'); return; }
    const CW = 12, CH = 8, g = crearLaberinto(CW, CH), GW = CW * 2 + 1, GH = CH * 2 + 1;
    const ini = { x: Math.floor(CW / 2) * 2 + 1, y: GH - 2 }, meta = { x: Math.floor(CW / 2) * 2 + 1, y: 1 };
    // camino único del inicio a la meta (el laberinto es perfecto: las puertas no se pueden rodear)
    const prev = new Map([[`${ini.x},${ini.y}`, null]]), cola = [ini];
    while (cola.length) {
      const c = cola.shift(); if (c.x === meta.x && c.y === meta.y) break;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = { x: c.x + dx, y: c.y + dy }, k = `${n.x},${n.y}`;
        if (g[n.y][n.x] === 0 && !prev.has(k)) { prev.set(k, c); cola.push(n); }
      }
    }
    const camino = []; for (let c = meta; c; c = prev.get(`${c.x},${c.y}`)) camino.unshift(c);
    const enCamino = new Set(camino.map((c) => `${c.x},${c.y}`));
    const puertas = new Map();
    for (const f of [0.28, 0.55, 0.8]) { const c = camino[Math.max(2, Math.min(camino.length - 3, Math.floor(camino.length * f)))]; puertas.set(`${c.x},${c.y}`, { abierta: false }); }
    // tesoros en callejones sin salida fuera del camino
    const sinSalida = [];
    for (let y = 1; y < GH - 1; y += 2) for (let x = 1; x < GW - 1; x += 2) {
      if (enCamino.has(`${x},${y}`)) continue;
      const abiertos = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => g[y + dy][x + dx] === 0).length;
      if (abiertos === 1) sinSalida.push({ x, y });
    }
    const TESOROS = [{ oro: 2 }, { obsidiana: 2 }, { fosil: 1 }, { cobre: 3 }, { oro: 1, obsidiana: 1 }];
    const tesoros = new Map(mezclar(sinSalida).slice(0, 5).map((c) => [`${c.x},${c.y}`, TESOROS[Math.floor(Math.random() * TESOROS.length)]]));
    const st = { x: ini.x, y: ini.y, vx: ini.x, vy: ini.y, dir: 'up', tiempo: 150, fallos: 0, abiertas: 0, fase: 'juego', paso: 0, mov: null, ultimo: 0, tesoros: [], pregunta: null };
    const visto = new Set(), RADIO = 3.3;
    const T = 26, cv = document.createElement('canvas'); cv.width = GW * T; cv.height = GH * T;
    const imgs = {}; for (const k of ['oro', 'obsidiana', 'fosil', 'cobre']) { imgs[k] = new Image(); imgs[k].src = ICONO(k); }
    imgs.gema = new Image(); imgs.gema.src = ICONO('gema'); imgs.esfinge = new Image(); imgs.esfinge.src = ICONO('esfinge');
    const pjKey = `pj_${S.pj}_${texArmadura(S.armadura)}`, pjSrc = escena && escena.textures.exists(pjKey) ? escena.textures.get(pjKey).getSourceImage() : null;
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">Gran Esfinge · laberinto nuevo cada vez</span><h2 id="modal-titulo">🏺 Laberinto de la Esfinge</h2></div>
        <div class="pildoras"><span class="pildora" id="lb-tiempo">⏳ 2:30</span><span class="pildora" id="lb-puertas">🚪 0 de ${puertas.size}</span><span class="pildora" id="lb-tes">💰 0</span><button type="button" class="btn" id="lb-salir">Salir</button></div></div>
      <div class="lab">
        <div class="lab-cuadro" id="lb-cuadro"></div>
        <div class="lab-lado">
          <p class="nota">Muévete con las <kbd>flechas</kbd> o <kbd>W A S D</kbd> (o los botones). Llega a la <b>cámara del tesoro</b> (arriba) antes de que se apague la antorcha. Las <b>puertas de la esfinge</b> se abren respondiendo bien; cada error quita 15 segundos. En los callejones hay tesoros.</p>
          <div class="lab-cruz" aria-label="Controles">
            <span></span><button type="button" class="btn" data-mv="up" aria-label="Arriba">▲</button><span></span>
            <button type="button" class="btn" data-mv="left" aria-label="Izquierda">◀</button><span></span><button type="button" class="btn" data-mv="right" aria-label="Derecha">▶</button>
            <span></span><button type="button" class="btn" data-mv="down" aria-label="Abajo">▼</button><span></span>
          </div>
        </div>
      </div>`, 'laberinto', () => { st.fase = 'fin'; cancelAnimationFrame(raf); document.removeEventListener('keyup', soltar); });
    $('lb-cuadro').appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
    let raf = 0, t0 = performance.now();
    const TECLAS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
    const soltar = (e) => { if (TECLAS[e.key] === st.mov) st.mov = null; };
    document.addEventListener('keyup', soltar);
    const teclasJuego = (e) => { const d = TECLAS[e.key]; if (d && st.fase === 'juego') { e.preventDefault(); if (st.mov !== d) { st.mov = d; st.ultimo = 0; } } };
    ui.teclas = teclasJuego;
    document.querySelectorAll('[data-mv]').forEach((b) => {
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); st.mov = b.dataset.mv; st.ultimo = 0; });
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { if (st.mov === b.dataset.mv) st.mov = null; });
    });
    $('lb-salir').addEventListener('click', () => ui.cerrar());
    const alumbrar = () => {
      for (let y = Math.floor(st.y - RADIO); y <= st.y + RADIO; y++) for (let x = Math.floor(st.x - RADIO); x <= st.x + RADIO; x++) {
        if (x >= 0 && y >= 0 && x < GW && y < GH && Math.hypot(x - st.x, y - st.y) <= RADIO) visto.add(`${x},${y}`);
      }
    };
    alumbrar();
    const pintarInfo = () => {
      const s = Math.max(0, Math.ceil(st.tiempo));
      const el = $('lb-tiempo'); if (!el) return;
      el.textContent = `⏳ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; el.classList.toggle('urgente', s <= 20);
      $('lb-puertas').textContent = `🚪 ${st.abiertas} de ${puertas.size}`;
      $('lb-tes').textContent = `💰 ${st.tesoros.length}`;
    };
    const dibujar = (ahora) => {
      ctx.fillStyle = '#0b0806'; ctx.fillRect(0, 0, cv.width, cv.height);
      const luz = (x, y) => Math.hypot(x - st.vx, y - st.vy);
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
        const k = `${x},${y}`; if (!visto.has(k)) continue;
        const px = x * T, py = y * T;
        if (g[y][x]) {
          ctx.fillStyle = '#a07a44'; ctx.fillRect(px, py, T, T);
          ctx.fillStyle = '#d2ad6c'; ctx.fillRect(px, py, T, 6);
          ctx.fillStyle = '#4a3018'; ctx.fillRect(px, py + T - 4, T, 4);
          if ((x * 7 + y * 3) % 5 === 0) { ctx.fillStyle = '#2f4f9a'; ctx.fillRect(px + 9, py + 10, 3, 5); ctx.fillStyle = '#a8322a'; ctx.fillRect(px + 15, py + 12, 3, 3); }
        } else {
          ctx.fillStyle = (x + y) % 2 ? '#2a1d12' : '#261a10'; ctx.fillRect(px, py, T, T);
          const P = puertas.get(k);
          if (P && !P.abierta) {
            ctx.fillStyle = '#d9a63a'; ctx.fillRect(px + 2, py + 1, T - 4, T - 2);
            ctx.fillStyle = '#7a5214'; ctx.fillRect(px + 4, py + 3, T - 8, T - 6);
            ctx.fillStyle = '#f6e7b0'; ctx.fillRect(px + 8, py + 10, 10, 5); ctx.fillStyle = '#123'; ctx.fillRect(px + 11, py + 11, 4, 3);
          }
          const tes = tesoros.get(k);
          if (tes) { const r = Object.keys(tes)[0]; if (imgs[r].complete) ctx.drawImage(imgs[r], px + 3, py + 3 + Math.sin(ahora / 300 + x) * 2, T - 6, T - 6); }
          if (x === meta.x && y === meta.y) {
            ctx.fillStyle = `rgba(255,220,120,${0.35 + 0.2 * Math.sin(ahora / 260)})`; ctx.beginPath(); ctx.arc(px + T / 2, py + T / 2, T * 0.75, 0, Math.PI * 2); ctx.fill();
            if (imgs.gema.complete) ctx.drawImage(imgs.gema, px + 2, py + 2, T - 4, T - 4);
          }
        }
        const d = luz(x + 0.5, y + 0.5) - 0.5;
        const sombra = d > RADIO ? 0.72 : Math.max(0, (d - RADIO * 0.45) / (RADIO * 0.55)) * 0.6;
        if (sombra > 0) { ctx.fillStyle = `rgba(8,5,3,${sombra})`; ctx.fillRect(px, py, T, T); }
      }
      // personaje
      const cx = st.vx * T + T / 2, cy = st.vy * T + T / 2;
      ctx.fillStyle = `rgba(255,170,60,${0.18 + 0.05 * Math.sin(ahora / 90)})`; ctx.beginPath(); ctx.arc(cx, cy, T * 1.4, 0, Math.PI * 2); ctx.fill();
      if (pjSrc) {
        const fila = DIRS[st.dir], col = st.mov ? 1 + (Math.floor(ahora / 90) % 8) : 0, tam = T * 1.9;
        ctx.drawImage(pjSrc, col * 64, fila * 64, 64, 64, cx - tam / 2, cy - tam * 0.72, tam, tam);
      } else { ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.arc(cx, cy, T / 3, 0, Math.PI * 2); ctx.fill(); }
    };
    const mover = (dir) => {
      const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
      st.dir = dir;
      const nx = st.x + dx, ny = st.y + dy, k = `${nx},${ny}`;
      if (g[ny][nx]) return;
      const P = puertas.get(k);
      if (P && !P.abierta) { st.mov = null; return abrirPuerta(P); }
      st.x = nx; st.y = ny; alumbrar(); sfx('paso');
      const tes = tesoros.get(k);
      if (tes) {
        tesoros.delete(k); st.tesoros.push(tes); sfx('moneda');
        Object.entries(tes).forEach(([r, n]) => sumar(r, n));
        toast(`Tesoro: ${Object.entries(tes).map(([r, n]) => `+${n} ${nombreRec(r)}`).join(', ')}`);
      }
      if (nx === meta.x && ny === meta.y) ganar();
    };
    const paso = (ahora) => {
      if (st.fase === 'fin') return;
      const dt = Math.min(0.1, (ahora - t0) / 1000); t0 = ahora;
      if (st.fase === 'juego') {
        st.tiempo -= dt;
        if (st.tiempo <= 0) { st.tiempo = 0; pintarInfo(); return perder(); }
        if (st.mov && ahora - st.ultimo > 125) { st.ultimo = ahora; mover(st.mov); }
      }
      st.vx += (st.x - st.vx) * Math.min(1, dt * 16); st.vy += (st.y - st.vy) * Math.min(1, dt * 16);
      dibujar(ahora); pintarInfo();
      raf = requestAnimationFrame(paso);
    };
    // Puerta de la esfinge: una pregunta (el tiempo se detiene mientras se responde)
    const abrirPuerta = (P) => {
      st.fase = 'pregunta';
      let d = Preguntas.nuevo(S.curso, unidadActual(), difPara(2), S.stats), elegida = null, fallidas = new Set(), msg = '';
      const caja = document.createElement('div'); caja.className = 'lab-pregunta'; $('lb-cuadro').appendChild(caja);
      const pintarP = () => {
        caja.innerHTML = `<div class="lab-esfinge"><img class="px" src="${ICONO('esfinge')}" alt=""><div><span class="etq">La esfinge pregunta · ${esc(d.titulo)}</span><p class="enunciado">${mate(d.enunciado)}</p></div></div>
          ${alternativasHTML(d, elegida, fallidas, false)}${msg}
          <div class="acciones"><span class="nota">Cada error: −15 segundos.</span><button type="button" class="btn pri" id="lb-ok" ${elegida === null ? 'disabled' : ''}>Responder</button></div>`;
        caja.querySelectorAll('.alt').forEach((b) => b.addEventListener('click', () => { elegida = Number(b.dataset.i); pintarP(); }));
        caja.querySelector('#lb-ok').addEventListener('click', comprobar);
      };
      const comprobar = () => {
        if (elegida === null) return;
        const ok = elegida === d.correcta;
        registrar(d.tema, ok);
        if (ok) {
          P.abierta = true; st.abiertas += 1; sfx('portal'); ganarXP(8);
          caja.remove(); st.fase = 'juego'; st.ultimo = performance.now(); t0 = performance.now(); ui.teclas = teclasJuego; return;
        }
        st.fallos += 1; st.tiempo = Math.max(1, st.tiempo - 15); sfx('error');
        fallidas.add(elegida); elegida = null;
        msg = fallidas.size >= 2 ? `<div class="mensaje mal" role="status">Revisemos: ${mate(d.explicacion)}</div>` : `<div class="mensaje mal" role="status">Casi. ${mate(d.pista)}</div>`;
        if (fallidas.size >= d.opciones.length - 1) { d = Preguntas.nuevo(S.curso, unidadActual(), difPara(2), S.stats); fallidas = new Set(); }
        pintarP();
      };
      ui.teclas = (e) => {
        if (/^[1-4]$/.test(e.key)) { const i = Number(e.key) - 1; if (i < d.opciones.length && !fallidas.has(i)) { elegida = i; pintarP(); } }
        else if (e.key === 'Enter') { e.preventDefault(); comprobar(); }
      };
      pintarP();
    };
    const final = (html) => {
      st.fase = 'fin'; cancelAnimationFrame(raf); document.removeEventListener('keyup', soltar); dibujar(performance.now());
      const caja = document.createElement('div'); caja.className = 'lab-pregunta lab-final'; caja.innerHTML = html; $('lb-cuadro').appendChild(caja);
      const ok = caja.querySelector('#lb-fin'); ok.addEventListener('click', () => ui.cerrar()); ok.focus();
      const al = caja.querySelector('#lb-album'); if (al) al.addEventListener('click', () => { ui.cerrar(); abrirAlbumGemas(); });
      ui.teclas = (e) => { if (e.key === 'Enter') { e.preventDefault(); ui.cerrar(); } };
      guardar(true);
    };
    function ganar() {
      const perfecto = st.fallos === 0, gem = sortearGema(perfecto ? 2.5 : 1.3, 'laberinto'), nueva = registrarGema(gem);
      const xp = 40 + Math.floor(st.tiempo / 5);
      ganarXP(xp); avanzarMision('laberinto'); sfx('logro');
      if (escena) escena.celebrar(escena.jugador.x, escena.jugador.y - 60);
      final(`<div class="lab-premio"><img class="px gema-grande" src="${ICONO('gema_' + gem.id)}" alt=""><div>
          <span class="etq">¡Llegaste a la cámara del tesoro!${perfecto ? ' · respuestas perfectas' : ''}</span>
          <h3>${esc(gem.nombre)} <small class="rareza ${CLASE_RAREZA[gem.rareza]}">${esc(gem.rareza)}</small></h3>
          <p>${nueva ? '¡Gema nueva en tu álbum!' : 'Ya tenías esta gema: se suma a tu colección.'} +${xp} de experiencia${st.tesoros.length ? ` · ${st.tesoros.length} ${st.tesoros.length === 1 ? 'tesoro' : 'tesoros'} recogidos` : ''}.</p></div></div>
        <div class="acciones"><button type="button" class="btn sec" id="lb-album">💎 Ver álbum</button><button type="button" class="btn pri" id="lb-fin">¡Listo!</button></div>`);
    }
    function perder() {
      sfx('derrota');
      final(`<div class="mensaje mal" role="status">Tu antorcha se apagó y la esfinge te sacó del laberinto. ${st.tesoros.length ? 'Te quedas con los tesoros que recogiste.' : ''} ¡Inténtalo otra vez: el laberinto será distinto!</div>
        <div class="acciones"><span></span><button type="button" class="btn pri" id="lb-fin">Volver</button></div>`);
    }
    raf = requestAnimationFrame(paso);
  }

  // ---------- Carrera de vagonetas (zona principal de la mina) ----------
  // Los jugadores del mismo grupo (sala) que están en la estación corren juntos. Se salta (ESPACIO/↑) rocas y hoyos,
  // se agacha (↓) bajo las vigas, y en cada cambio de vías hay que responder un ejercicio: bien = turbo.
  // Sin compañeros se corre contra vagonetas fantasma.
  const CARRERA = { largo: 700, cruces: [170, 360, 550], plazo: 150 };
  const PREMIO_CARRERA = [{ plata: 4, amatista: 2, carbon: 6 }, { plata: 3, carbon: 5 }, { plata: 2, carbon: 4 }, { carbon: 3 }];
  const XP_CARRERA = [60, 40, 30, 20];
  let carrera = null;   // estado de la sala/carrera abierta
  function nombreJug() { return S.docente ? 'Profe' : String(S.nombre || 'Jugador').split(' ')[0]; }
  function pistaCarrera(semilla) {
    const rnd = azar(semilla), obs = [], gemas = [];
    for (let d = 45; d < CARRERA.largo - 30;) {
      d += 24 + rnd() * 22;
      if (CARRERA.cruces.some((c) => Math.abs(c - d) < 22)) continue;
      const r = rnd();
      obs.push({ d, t: r < 0.42 ? 'roca' : r < 0.72 ? 'viga' : 'hoyo' });
      if (rnd() < 0.55) { const g = d + 9 + rnd() * 6; gemas.push({ d: g, alto: rnd() < 0.5 }, { d: g + 1.6, alto: rnd() < 0.5 }); }
    }
    return { obs, gemas };
  }
  function recibirCarrera(d) {
    if (!d || d.id === idJuego || !carrera) return;
    const C = carrera;
    if (d.t === 'sala' && C.fase === 'sala') { C.sala.set(d.id, { nombre: d.nombre, pj: d.pj, visto: Date.now() }); pintarSala(); }
    else if (d.t === 'salir') { C.sala.delete(d.id); if (C.fase === 'sala') pintarSala(); }
    else if (d.t === 'inicio' && C.fase === 'sala' && (d.ids || []).includes(idJuego)) empezarCarrera(d.semilla, d.ids, d.nombres);
    else if (d.t === 'pos' && C.corredores && C.corredores.has(d.id)) { const r = C.corredores.get(d.id); r.d = d.d; r.visto = performance.now(); }
    else if (d.t === 'fin' && C.corredores && C.corredores.has(d.id)) { const r = C.corredores.get(d.id); if (d.tiempo != null) r.d = CARRERA.largo; r.tiempo = d.tiempo; revisarFinCarrera(); }
  }
  function emitirCarrera(datos) { if (escena && escena.canal) escena.canal.emitir('carrera', { id: idJuego, ...datos }); }
  function abrirCarrera() {
    carrera = { fase: 'sala', sala: new Map(), latido: 0 };
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">Estación de vagonetas · ${escena && escena.canal ? `Grupo ${S.grupo}` : 'sin grupo: corres contra vagonetas fantasma'}</span><h2 id="modal-titulo">🛤️ Carrera de vagonetas</h2></div><button type="button" class="btn" id="cr-salir">Salir</button></div>
      <div class="carrera-sala">
        <div><p class="nota">Esperen aquí a sus compañeros del grupo que estén en la estación y luego, cualquiera inicia la carrera. <b>Saltar:</b> <kbd>ESPACIO</kbd> o <kbd>↑</kbd> (rocas y hoyos) · <b>Agacharse:</b> mantén <kbd>↓</kbd> (vigas) · En cada <b>cambio de vías</b> responde un ejercicio: si aciertas, ¡turbo!</p>
          <ul class="carrera-lista" id="cr-lista"></ul></div>
        <div class="carrera-premios"><span class="etq">Premios</span><ol>${PREMIO_CARRERA.map((p, i) => `<li>${['🥇', '🥈', '🥉', '🏁'][i]} ${Object.entries(p).map(([r, n]) => `${n} ${nombreRec(r)}`).join(', ')} · ${XP_CARRERA[i]} xp</li>`).join('')}</ol>
          <span class="nota">Lo que recojas en la pista también es tuyo. Tu primer 1.er lugar: ¡una vagoneta dorada para tu base!</span></div>
      </div>
      <div class="acciones"><span class="nota" id="cr-nota"></span><button type="button" class="btn pri" id="cr-iniciar" data-foco>¡Iniciar carrera!</button></div>`, 'carrera', () => {
      if (!carrera) return;
      if (carrera.fase === 'carrera' && !carrera.yo.tiempo) emitirCarrera({ t: 'fin', tiempo: null });
      emitirCarrera({ t: 'salir' });
      clearInterval(carrera.latido); cancelAnimationFrame(carrera.raf); document.removeEventListener('keyup', carrera.soltar || (() => {}));
      carrera = null;
    });
    $('cr-salir').addEventListener('click', () => ui.cerrar());
    $('cr-iniciar').addEventListener('click', () => {
      const ids = [idJuego, ...[...carrera.sala.keys()]].slice(0, 6), nombres = { [idJuego]: nombreJug() };
      for (const [id, x] of carrera.sala) nombres[id] = x.nombre;
      const semilla = Math.floor(Math.random() * 1e9);
      emitirCarrera({ t: 'inicio', semilla, ids, nombres });
      empezarCarrera(semilla, ids, nombres);
    });
    ui.teclas = (e) => { if (e.key === 'Enter') { e.preventDefault(); $('cr-iniciar').click(); } };
    const latir = () => { if (!carrera || carrera.fase !== 'sala') return; emitirCarrera({ t: 'sala', nombre: nombreJug(), pj: S.pj }); for (const [id, x] of carrera.sala) if (Date.now() - x.visto > 5000) carrera.sala.delete(id); pintarSala(); };
    carrera.latido = setInterval(latir, 1500); latir();
  }
  function pintarSala() {
    const el = $('cr-lista'); if (!el || !carrera) return;
    const filas = [[nombreJug(), S.pj, true], ...[...carrera.sala.values()].map((x) => [x.nombre, x.pj, false])];
    el.innerHTML = filas.map(([n, pj, yo]) => `<li><span class="cr-cara" style="background-image:url('assets/pj/${esc(pj)}_nada.png')"></span><b>${esc(n)}</b>${yo ? ' <small>(tú)</small>' : ''}</li>`).join('');
    $('cr-nota').textContent = carrera.sala.size ? `${carrera.sala.size + 1} en la estación` : 'Si no llega nadie, correrás contra 2 vagonetas fantasma.';
  }
  function empezarCarrera(semilla, ids, nombres) {
    const C = carrera; if (!C || C.fase !== 'sala') return;
    clearInterval(C.latido);
    C.fase = 'cuenta'; C.pista = pistaCarrera(semilla); C.corredores = new Map();
    for (const id of ids) if (id !== idJuego) C.corredores.set(id, { nombre: (nombres && nombres[id]) || 'Compañero', d: 0, tiempo: undefined, real: true, visto: performance.now() });
    if (ids.length === 1) {   // sin compañeros: dos vagonetas fantasma
      const rnd = azar(semilla + 7);
      ['Fantasma minero', 'Fantasma de plata'].forEach((n, i) => C.corredores.set(`bot${i}`, { nombre: n, d: 0, tiempo: undefined, bot: true, v: 0, vmax: 12.4 + rnd() * 1.6 + i * 0.4, para: 0, cruce: 0 }));
    }
    C.yo = { d: 0, v: 0, y: 0, vy: 0, agachado: false, golpe: 0, turbo: 0, cruce: 0, pregunta: null, bloqueo: 0, gemas: 0, tiempo: undefined, t: 0, ultPos: 0, aciertos: 0 };
    C.cuenta = 3.4; C.t0 = performance.now();
    const m = $('modal');
    m.querySelector('.carrera-sala').outerHTML = `<div class="carrera-juego"><div class="cr-barra" id="cr-barra"></div><div class="cr-cuadro" id="cr-cuadro"><canvas id="cr-canvas" width="800" height="300"></canvas><div class="cr-cuenta" id="cr-cuenta">3</div></div>
      <div class="cr-controles"><button type="button" class="btn" id="cr-agacha">▼ Agacharse</button><button type="button" class="btn pri" id="cr-salta">▲ Saltar</button></div></div>`;
    m.querySelector('.acciones').innerHTML = '<span class="nota" id="cr-nota">¡Prepárate!</span><span></span>';
    const yo = C.yo;
    const saltar = () => { if (C.fase === 'carrera' && !yo.pregunta && yo.y <= 0.01) { yo.vy = 540; sfx('paso'); } };
    C.soltar = (e) => { if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') yo.agachado = false; };
    document.addEventListener('keyup', C.soltar);
    C.teclas = (e) => {
      if (yo.pregunta) return teclasPregunta(e);
      if ([' ', 'ArrowUp', 'w', 'W'].includes(e.key)) { e.preventDefault(); saltar(); }
      else if (['ArrowDown', 's', 'S'].includes(e.key)) { e.preventDefault(); yo.agachado = true; }
    };
    ui.teclas = C.teclas;
    $('cr-salta').addEventListener('pointerdown', (e) => { e.preventDefault(); saltar(); });
    const ag = $('cr-agacha');
    ag.addEventListener('pointerdown', (e) => { e.preventDefault(); yo.agachado = true; });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) ag.addEventListener(ev, () => { yo.agachado = false; });
    C.ctx = $('cr-canvas').getContext('2d'); C.ctx.imageSmoothingEnabled = false;
    const k = `pj_${S.pj}_${texArmadura(S.armadura)}`;
    C.pj = escena && escena.textures.exists(k) ? escena.textures.get(k).getSourceImage() : null;
    C.img = {}; for (const r of ['carbon', 'plata', 'piedra']) { C.img[r] = new Image(); C.img[r].src = ICONO(r); }
    let ultimo = performance.now();
    const bucle = (ahora) => {
      if (!carrera) return;
      const dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;   // en equipos lentos no se queda atrás
      pasoCarrera(dt, ahora); dibujarCarrera(ahora);
      C.raf = requestAnimationFrame(bucle);
    };
    C.raf = requestAnimationFrame(bucle);
    sfx('tick');
  }
  // Pregunta en el cambio de vías: la vagoneta se detiene hasta acertar
  let preguntaCarrera = null;
  function abrirCruce() {
    const C = carrera, yo = C.yo;
    const d = Preguntas.nuevo(S.curso, 'u3', difPara(1), S.stats);
    yo.pregunta = { d, fallidas: new Set() };
    const caja = document.createElement('div'); caja.className = 'cr-pregunta'; caja.id = 'cr-pregunta'; $('cr-cuadro').appendChild(caja);
    const pintarP = (msg = '') => {
      const P = yo.pregunta; if (!P) return;
      caja.innerHTML = `<span class="etq">🔀 Cambio de vías · ${esc(P.d.titulo)}</span><p class="enunciado">${mate(P.d.enunciado)}</p>${alternativasHTML(P.d, null, P.fallidas, false)}${msg}`;
      caja.querySelectorAll('.alt').forEach((b) => b.addEventListener('click', () => responderCruce(Number(b.dataset.i))));
    };
    preguntaCarrera = pintarP;
    pintarP();
  }
  function responderCruce(i) {
    const C = carrera, yo = C && C.yo, P = yo && yo.pregunta;
    if (!P || P.fallidas.has(i) || performance.now() < yo.bloqueo) return;
    const ok = i === P.d.correcta;
    registrar(P.d.tema, ok);
    if (ok) {
      sfx('acierto'); yo.pregunta = null; yo.turbo = performance.now() + 3000; yo.aciertos += 1; yo.v = Math.max(yo.v, 10);
      const c = $('cr-pregunta'); if (c) c.remove();
      ui.teclas = C.teclas;
    } else {
      sfx('error'); P.fallidas.add(i); yo.bloqueo = performance.now() + 1500;
      if (P.fallidas.size >= P.d.opciones.length - 1) { P.d = Preguntas.nuevo(S.curso, 'u3', difPara(1), S.stats); P.fallidas = new Set(); }
      preguntaCarrera(`<div class="mensaje mal" role="status">¡Vía equivocada! Espera un momento… ${mate(P.d.pista || '')}</div>`);
    }
  }
  function teclasPregunta(e) { if (/^[1-4]$/.test(e.key)) responderCruce(Number(e.key) - 1); }
  function pasoCarrera(dt, ahora) {
    const C = carrera, yo = C.yo;
    if (C.fase === 'cuenta') {
      C.cuenta -= dt;
      const el = $('cr-cuenta'), n = Math.ceil(C.cuenta);
      if (el && n > 0 && el.textContent !== String(n)) { el.textContent = String(n); sfx('tick'); }
      if (C.cuenta > 0) return;
      C.fase = 'carrera'; C.inicio = ahora; sfx('vamos');
      if (el) { el.textContent = '¡YA!'; setTimeout(() => el.remove(), 600); }
      const nota = $('cr-nota'); if (nota) nota.textContent = 'Salta con ESPACIO · agáchate con ↓';
    }
    if (C.fase !== 'carrera' && C.fase !== 'esperando') return;
    // fantasmas
    for (const r of C.corredores.values()) {
      if (!r.bot || r.tiempo !== undefined) continue;
      if (r.para > 0) { r.para -= dt; continue; }
      r.v = Math.min(r.vmax, r.v + 6 * dt); r.d += r.v * dt;
      if (r.cruce < CARRERA.cruces.length && r.d >= CARRERA.cruces[r.cruce]) { r.cruce += 1; r.para = 2.2 + Math.random() * 2.5; r.v = 6; }
      if (Math.random() < dt * 0.25) r.v = 4;
      if (r.d >= CARRERA.largo) { r.d = CARRERA.largo; r.tiempo = (ahora - C.inicio) / 1000; revisarFinCarrera(); }
    }
    if (yo.tiempo !== undefined) return;
    const t = (ahora - C.inicio) / 1000; yo.t = t;
    if (t > CARRERA.plazo) { yo.tiempo = null; emitirCarrera({ t: 'fin', tiempo: null }); revisarFinCarrera(true); return; }
    if (!yo.pregunta) {
      const vmax = ahora < yo.turbo ? 22 : 14;
      yo.v = Math.min(vmax, yo.v + (ahora < yo.golpe ? 2 : 7) * dt);
      if (ahora >= yo.turbo && yo.v > 14) yo.v = Math.max(14, yo.v - 10 * dt);
      const antes = yo.d; yo.d += yo.v * dt;
      if (yo.cruce < CARRERA.cruces.length && yo.d >= CARRERA.cruces[yo.cruce]) { yo.d = CARRERA.cruces[yo.cruce]; yo.cruce += 1; yo.v = 0; abrirCruce(); }
      // salto
      if (yo.y > 0 || yo.vy > 0) { yo.vy -= 1500 * dt; yo.y = Math.max(0, yo.y + yo.vy * dt); if (yo.y === 0) yo.vy = 0; }
      // choques (solo si no está aturdido)
      if (ahora > yo.golpe) {
        for (const o of C.pista.obs) {
          if (o.d < antes - 1.5 || o.d > yo.d + 0.6) continue;
          if (Math.abs(o.d - yo.d) > 1.1) continue;
          const choca = o.t === 'roca' ? yo.y < 34 : o.t === 'hoyo' ? yo.y < 6 : !yo.agachado;
          if (choca) { yo.golpe = ahora + 900; yo.v = o.t === 'hoyo' ? 0 : 3; sfx(o.t === 'hoyo' ? 'boom' : 'golpe'); if (escena) escena.cameras.main.shake(120, 0.003); break; }
        }
      }
      for (const g of C.pista.gemas) {
        if (g.tomada || Math.abs(g.d - yo.d) > 0.8) continue;
        const arriba = yo.y > 40;
        if (g.alto === arriba) { g.tomada = true; yo.gemas += 1; sfx('moneda'); }
      }
      if (yo.d >= CARRERA.largo) {
        yo.d = CARRERA.largo; yo.tiempo = Math.round(t * 10) / 10; sfx('victoria');
        emitirCarrera({ t: 'fin', tiempo: yo.tiempo }); C.fase = 'esperando';
        C.esperaHasta = ahora + 20000;
        $('cr-nota').textContent = `¡Llegaste en ${yo.tiempo.toFixed(1)} s! Esperando a los demás…`;
        revisarFinCarrera();
      }
    }
    if (ahora - yo.ultPos > 250) { yo.ultPos = ahora; emitirCarrera({ t: 'pos', d: Math.round(yo.d * 10) / 10 }); }
    // compañeros que se desconectan cuentan como no terminados
    for (const r of C.corredores.values()) if (r.real && r.tiempo === undefined && ahora - r.visto > 8000) { r.tiempo = null; revisarFinCarrera(); }
  }
  function revisarFinCarrera(forzar = false) {
    const C = carrera; if (!C || C.fase === 'fin' || C.yo.tiempo === undefined) return;
    const pend = [...C.corredores.values()].filter((r) => r.tiempo === undefined);
    if (pend.length && !forzar && performance.now() < (C.esperaHasta || 0)) { setTimeout(() => revisarFinCarrera(), 1000); return; }
    pend.forEach((r) => { r.tiempo = null; });
    C.fase = 'fin';
    const lista = [{ nombre: `${nombreJug()} (tú)`, tiempo: C.yo.tiempo, yo: true }, ...[...C.corredores.values()].map((r) => ({ nombre: r.nombre, tiempo: r.tiempo, bot: r.bot }))]
      .sort((a, b) => (a.tiempo == null) - (b.tiempo == null) || (a.tiempo || 0) - (b.tiempo || 0));
    const pos = lista.findIndex((x) => x.yo), terminado = C.yo.tiempo != null;
    const k = terminado ? Math.min(pos, 3) : 3, premio = { ...PREMIO_CARRERA[k] };
    if (C.yo.gemas) premio.carbon = (premio.carbon || 0) + Math.ceil(C.yo.gemas / 2), premio.plata = (premio.plata || 0) + Math.floor(C.yo.gemas / 4);
    Object.entries(premio).forEach(([r, n]) => { if (n) sumar(r, n); });
    ganarXP(XP_CARRERA[k]); avanzarMision('carrera');
    let extra = '';
    if (terminado && pos === 0 && !S.carreraGanada) { S.carreraGanada = true; S.inventario.vagoneta_dorada = (S.inventario.vagoneta_dorada || 0) + 1; extra = '<p class="nota">🏆 ¡Tu primera victoria! Ganaste la <b>vagoneta dorada</b> para tu base (Decorar).</p>'; }
    S.carreras = (S.carreras || 0) + 1; guardar(true);
    sfx(terminado && pos === 0 ? 'logro' : 'mision');
    const c = $('cr-pregunta'); if (c) c.remove();
    const caja = document.createElement('div'); caja.className = 'cr-pregunta cr-final';
    caja.innerHTML = `<h3>${terminado ? (pos === 0 ? '🥇 ¡Ganaste la carrera!' : `Llegaste en el lugar ${pos + 1}`) : 'No alcanzaste a llegar'}</h3>
      <ol class="cr-ranking">${lista.map((x, i) => `<li class="${x.yo ? 'yo' : ''}"><span>${x.tiempo == null ? '—' : ['🥇', '🥈', '🥉'][i] || i + 1 + '.'}</span><b>${esc(x.nombre)}${x.bot ? ' 👻' : ''}</b><span>${x.tiempo == null ? 'no llegó' : `${x.tiempo.toFixed(1)} s`}</span></li>`).join('')}</ol>
      <p>Premio: ${Object.entries(premio).filter(([, n]) => n).map(([r, n]) => `${n} ${nombreRec(r)}`).join(', ')} · ${XP_CARRERA[k]} de experiencia${C.yo.gemas ? ` (recogiste ${C.yo.gemas} minerales en la pista)` : ''}.</p>${extra}
      <div class="acciones"><span></span><button type="button" class="btn pri" id="cr-fin">¡Listo!</button></div>`;
    $('cr-cuadro').appendChild(caja);
    $('cr-fin').addEventListener('click', () => ui.cerrar()); $('cr-fin').focus();
    ui.teclas = (e) => { if (e.key === 'Enter') { e.preventDefault(); ui.cerrar(); } };
  }
  function dibujarCarrera(ahora) {
    const C = carrera, yo = C.yo, ctx = C.ctx, W = 800, H = 300, PX = 26, X0 = 170, RIEL = 232;
    const sx = (d) => X0 + (d - yo.d) * PX;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120d14'); g.addColorStop(1, '#2a1d17');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // estalactitas lejanas (paralaje) y vigas de soporte con faroles
    ctx.fillStyle = '#231a22';
    for (let i = -1; i < 20; i++) { const x = ((i * 70 - yo.d * PX * 0.3) % (W + 140) + W + 140) % (W + 140) - 70; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 18, 0); ctx.lineTo(x + 9, 38 + (i % 3) * 14); ctx.fill(); }
    for (let m = Math.floor((yo.d - 10) / 12) * 12; m < yo.d + 40; m += 12) {
      const x = sx(m); if (x < -40 || x > W + 40) continue;
      ctx.fillStyle = '#5b3b1d'; ctx.fillRect(x, 40, 10, RIEL - 40); ctx.fillRect(x - 30, 40, 70, 10);
      ctx.fillStyle = `rgba(255,190,90,${0.14 + 0.04 * Math.sin(ahora / 200 + m)})`; ctx.beginPath(); ctx.arc(x + 5, 64, 40, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd27a'; ctx.fillRect(x + 1, 56, 8, 10);
    }
    // vía
    ctx.fillStyle = '#3a2a1e'; ctx.fillRect(0, RIEL + 8, W, H - RIEL);
    for (let m = Math.floor(yo.d - 8); m < yo.d + 30; m += 1.2) { const x = sx(m); ctx.fillStyle = '#5e4128'; ctx.fillRect(x, RIEL + 4, 14, 8); }
    ctx.fillStyle = '#9aa1ad'; ctx.fillRect(0, RIEL + 2, W, 3);
    // meta y cambios de vías
    const marca = (d, col, txt) => { const x = sx(d); if (x < -60 || x > W + 60) return; ctx.fillStyle = col; ctx.fillRect(x - 3, 70, 6, RIEL - 66); ctx.font = 'bold 15px Fredoka, Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(txt, x, 64); };
    CARRERA.cruces.forEach((c, i) => marca(c, i < yo.cruce ? '#5c8a6a' : '#e0b040', '🔀 Cambio de vías'));
    const xm = sx(CARRERA.largo);
    if (xm < W + 60) { for (let j = 0; j < 8; j++) { ctx.fillStyle = j % 2 ? '#fff' : '#222'; ctx.fillRect(xm - 4, 70 + j * 20, 8, 20); } marca(CARRERA.largo, 'rgba(0,0,0,0)', '🏁 META'); }
    // obstáculos
    for (const o of C.pista.obs) {
      const x = sx(o.d); if (x < -60 || x > W + 60) continue;
      if (o.t === 'roca') { ctx.fillStyle = '#5c5560'; ctx.beginPath(); ctx.moveTo(x - 18, RIEL + 4); ctx.lineTo(x - 10, RIEL - 22); ctx.lineTo(x + 6, RIEL - 28); ctx.lineTo(x + 18, RIEL + 4); ctx.fill(); ctx.fillStyle = '#8a8290'; ctx.fillRect(x - 6, RIEL - 24, 8, 4); }
      else if (o.t === 'hoyo') { ctx.fillStyle = '#050304'; ctx.fillRect(x - 20, RIEL, 40, H - RIEL); ctx.fillStyle = '#ff7a2a'; ctx.fillRect(x - 20, H - 10, 40, 10); }
      else { ctx.fillStyle = '#6b4220'; ctx.fillRect(x - 26, RIEL - 92, 52, 16); ctx.fillStyle = '#3d250f'; ctx.fillRect(x - 26, RIEL - 78, 52, 3); ctx.fillStyle = '#5b3b1d'; ctx.fillRect(x - 4, 40, 8, RIEL - 132); }
    }
    for (const gm of C.pista.gemas) {
      if (gm.tomada) continue; const x = sx(gm.d); if (x < -30 || x > W + 30) continue;
      const im = C.img[gm.alto ? 'plata' : 'carbon']; const y = gm.alto ? RIEL - 110 : RIEL - 42;
      if (im.complete) ctx.drawImage(im, x - 12, y + Math.sin(ahora / 200 + gm.d) * 3, 24, 24);
    }
    // vagonetas de los demás (semitransparentes)
    const vagon = (x, y, alpha, color, agachado, pj, dibujarPj) => {
      ctx.globalAlpha = alpha;
      if (dibujarPj && pj) { const tam = 84, fila = 3, col = 0; ctx.drawImage(pj, col * 64, fila * 64, 64, agachado ? 46 : 64, x - tam / 2 + 4, y - (agachado ? 40 : 70), tam, agachado ? tam * 46 / 64 : tam); }
      else if (!dibujarPj) { ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.arc(x + 4, y - 32, 12, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x - 30, y - 30); ctx.lineTo(x + 30, y - 30); ctx.lineTo(x + 24, y); ctx.lineTo(x - 24, y); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x - 28, y - 30, 56, 4);
      ctx.fillStyle = '#18141a'; for (const dx of [-16, 16]) { ctx.beginPath(); ctx.arc(x + dx, y + 2, 7, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
    };
    for (const r of C.corredores.values()) { const x = sx(r.d); if (x > -50 && x < W + 50) vagon(x, RIEL - 2, 0.38, r.bot ? '#8fb8ff' : '#7ad8a0', false, null, false); }
    const temblor = ahora < yo.golpe ? Math.sin(ahora / 30) * 3 : 0;
    vagon(X0 + temblor, RIEL - 2 - yo.y, ahora < yo.golpe && Math.floor(ahora / 90) % 2 ? 0.5 : 1, ahora < yo.turbo ? '#ffb347' : '#9aa1ad', yo.agachado, C.pj, true);
    if (ahora < yo.turbo) { ctx.fillStyle = 'rgba(255,170,60,0.6)'; for (let i = 0; i < 6; i++) ctx.fillRect(X0 - 40 - Math.random() * 40, RIEL - 26 - yo.y + Math.random() * 22, 22, 3); }
    // barra de avance con todos los corredores
    const b = $('cr-barra');
    if (b) {
      const todos = [{ n: 'Tú', d: yo.d, yo: true }, ...[...C.corredores.values()].map((r) => ({ n: r.nombre, d: r.d, bot: r.bot }))];
      b.innerHTML = `<span class="cr-meta">🏁</span>${todos.map((x) => `<span class="cr-punto ${x.yo ? 'yo' : x.bot ? 'bot' : ''}" style="left:${Math.min(100, (x.d / CARRERA.largo) * 100)}%" title="${esc(x.n)}">${esc(x.n.slice(0, 10))}</span>`).join('')}`;
    }
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Fredoka, Nunito, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`${Math.floor(yo.d)} / ${CARRERA.largo} m · ${yo.t.toFixed(1)} s · ${Math.round(yo.v * 3.6)} km/h`, 14, 24);
  }

  // ---------- Rompecabezas de cristales (Profundidades) ----------
  // Un rayo de luz sale del emisor; hay que girar los espejos de cristal para que pase por todos los cristales apagados.
  const VEC = { r: [1, 0], l: [-1, 0], u: [0, -1], d: [0, 1] };
  const REFLEJO = { '/': { r: 'u', u: 'r', l: 'd', d: 'l' }, '\\': { r: 'd', d: 'r', l: 'u', u: 'l' } };
  function crearRompecabezas(nivel) {
    const N = Math.min(8, 6 + Math.floor(nivel / 2)), K = Math.min(3, 1 + Math.floor((nivel + 1) / 2)), decoys = Math.min(7, 2 + nivel);
    for (let intento = 0; intento < 300; intento++) {
      const fila = Math.floor(Math.random() * N), celdas = new Map(), camino = [];
      let x = 0, y = fila, dir = 'r', giros = 0, ok = true;
      const visit = new Set();
      for (let paso = 0; paso < N * 3; paso++) {
        const k = `${x},${y}`; if (visit.has(k)) { ok = false; break; }
        visit.add(k); camino.push({ x, y, dir });
        // decidir si girar aquí (no en la primera casilla)
        if (paso > 0 && Math.random() < 0.38) {
          const opciones = dir === 'r' || dir === 'l' ? ['u', 'd'] : ['r', 'l'];
          const nd = opciones[Math.floor(Math.random() * 2)];
          const m = REFLEJO['/'][dir] === nd ? '/' : '\\';
          const [vx, vy] = VEC[nd];
          if (x + vx >= 0 && x + vx < N && y + vy >= 0 && y + vy < N && !visit.has(`${x + vx},${y + vy}`)) { celdas.set(k, { t: 'espejo', ok: m }); dir = nd; giros += 1; camino[camino.length - 1].giro = true; }
        }
        const [vx, vy] = VEC[dir]; x += vx; y += vy;
        if (x < 0 || y < 0 || x >= N || y >= N) break;
      }
      if (!ok || giros < 2 + Math.min(2, nivel) || camino.length < N + 2) continue;
      const rectas = camino.filter((c, i) => !c.giro && i > 0);
      if (rectas.length < K) continue;
      const objetivos = [rectas[rectas.length - 1], ...mezclar(rectas.slice(0, -1)).slice(0, K - 1)];
      objetivos.forEach((c) => celdas.set(`${c.x},${c.y}`, { t: 'cristal' }));
      const enCamino = new Set(camino.map((c) => `${c.x},${c.y}`));
      const libres = []; for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) if (!enCamino.has(`${xx},${yy}`)) libres.push(`${xx},${yy}`);
      mezclar(libres).slice(0, decoys).forEach((k) => celdas.set(k, { t: 'espejo', ok: null }));
      mezclar(libres).slice(decoys, decoys + 3 + nivel).forEach((k) => { if (!celdas.has(k)) celdas.set(k, { t: 'roca' }); });
      // los espejos aparecen girados al azar (al menos uno mal)
      let alguno = false;
      for (const c of celdas.values()) if (c.t === 'espejo') { c.m = Math.random() < 0.5 ? '/' : '\\'; if (c.ok && c.m !== c.ok) alguno = true; }
      if (!alguno) { const e = [...celdas.values()].find((c) => c.ok); e.m = e.ok === '/' ? '\\' : '/'; }
      return { N, fila, celdas, K };
    }
    return null;
  }
  function trazarRayo(R) {
    let x = 0, y = R.fila, dir = 'r';
    const puntos = [[-0.5, R.fila]], encendidos = new Set();
    for (let paso = 0; paso < 200; paso++) {
      if (x < 0 || y < 0 || x >= R.N || y >= R.N) { puntos.push([x, y]); break; }
      const c = R.celdas.get(`${x},${y}`);
      if (c && c.t === 'roca') { puntos.push([x - VEC[dir][0] * 0.5, y - VEC[dir][1] * 0.5]); break; }
      if (c && c.t === 'cristal') encendidos.add(`${x},${y}`);
      if (c && c.t === 'espejo') { puntos.push([x, y]); dir = REFLEJO[c.m][dir]; }
      x += VEC[dir][0]; y += VEC[dir][1];
    }
    return { puntos, encendidos };
  }
  function abrirCristales(alTerminar) {
    const nivel = S.cristalNivel || 0, R = crearRompecabezas(nivel);
    if (!R) { toast('El altar no responde. Inténtalo otra vez.'); return; }
    let giros = 0, resuelto = false;
    const pintar = () => {
      const { puntos, encendidos } = trazarRayo(R);
      const cel = [];
      for (let y = 0; y < R.N; y++) for (let x = 0; x < R.N; x++) {
        const c = R.celdas.get(`${x},${y}`);
        cel.push(`<button type="button" class="cz-c ${c ? c.t : ''} ${c && c.t === 'cristal' && encendidos.has(`${x},${y}`) ? 'luz' : ''}" data-x="${x}" data-y="${y}" ${c && c.t === 'espejo' && !resuelto ? '' : 'tabindex="-1"'} aria-label="${c ? c.t : 'vacío'}">${c && c.t === 'espejo' ? `<i class="cz-espejo ${c.m === '/' ? 'a' : 'b'}"></i>` : c && c.t === 'cristal' ? `<img class="px" src="${ICONO('cristal_eco')}" alt="">` : c && c.t === 'roca' ? `<img class="px" src="${ICONO('piedra')}" alt="">` : ''}</button>`);
      }
      const pts = puntos.map(([x, y]) => `${(x + 0.5) * 10},${(y + 0.5) * 10}`).join(' ');
      $('cz-tablero').innerHTML = `<div class="cz-emisor" style="top:${((R.fila + 0.5) / R.N) * 100}%"></div><div class="cz-grid" style="grid-template-columns:repeat(${R.N},1fr)">${cel.join('')}</div>
        <svg class="cz-rayo" viewBox="0 0 ${R.N * 10} ${R.N * 10}" preserveAspectRatio="none"><polyline points="${pts}" /></svg>`;
      $('cz-info').textContent = `Cristales encendidos: ${encendidos.size} de ${R.K} · Giros: ${giros}`;
      document.querySelectorAll('.cz-c.espejo').forEach((b) => b.addEventListener('click', () => {
        if (resuelto) return;
        const c = R.celdas.get(`${b.dataset.x},${b.dataset.y}`); c.m = c.m === '/' ? '\\' : '/'; giros += 1; sfx('clic'); pintar();
      }));
      if (!resuelto && encendidos.size >= R.K) ganar();
    };
    const ganar = () => {
      resuelto = true; sfx('logro');
      const cant = 2 + R.K + (nivel >= 3 ? 1 : 0), xp = 25 + 10 * R.K;
      sumar('cristal_eco', cant); ganarXP(xp);
      S.cristalNivel = nivel + 1; avanzarMision('cristales'); guardar(true);
      if (alTerminar) alTerminar();
      $('cz-fin').innerHTML = `<div class="mensaje bien" role="status">¡El altar resuena! Ganaste ${cant} cristales resonantes y ${xp} de experiencia. ${S.cristalNivel % 2 === 0 ? 'Los próximos rompecabezas serán más difíciles.' : ''}</div><div class="acciones"><span></span><button type="button" class="btn pri" id="cz-ok" data-foco>¡Listo!</button></div>`;
      $('cz-ok').addEventListener('click', () => ui.cerrar()); $('cz-ok').focus();
      ui.teclas = (e) => { if (e.key === 'Enter') { e.preventDefault(); ui.cerrar(); } };
    };
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">Altar de cristal · Profundidades · nivel ${nivel + 1}</span><h2 id="modal-titulo">💎 Rompecabezas de cristales</h2></div><button type="button" class="btn" id="cz-salir">Salir</button></div>
      <div class="cristales">
        <div class="cz-tablero" id="cz-tablero"></div>
        <div class="cz-lado"><p class="nota">Del emisor (a la izquierda) sale un rayo de luz. Haz clic en los <b>espejos</b> para girarlos y lograr que el rayo pase por <b>todos los cristales</b>. Las rocas lo bloquean. Cada vez que completes uno, los siguientes serán más difíciles.</p>
          <p class="pildora" id="cz-info"></p></div>
      </div><div id="cz-fin"></div>`, 'cristales-modal');
    $('cz-salir').addEventListener('click', () => ui.cerrar());
    pintar();
  }

  // ---------- Coloso de Magma: jefe de las Profundidades (solo, 3 fases) ----------
  const COLOSO = { nombre: 'Coloso de Magma', vida: 42, premio: { magma: 10, cristal_eco: 8, amatista: 6, plata: 10 }, xp: 260 };
  function abrirColoso() {
    const sc = escena;
    if (S.arma && S.herramienta !== 'espada') equipar('espada');
    const J = { hp: COLOSO.vida, max: COLOSO.vida, fase: 1, coraza: 0, racha: 0, limite: 0, t0: 0 };
    let d = null, elegida = null, fallidas = new Set(), fin = null, ultimo = '', reloj = 0;
    const primeraVez = !S.colosoVencido;
    sc.enCombate = true;
    if (sc.coloso) { sc.coloso.setTint(0xffffff); sc.coloso.anims.play('jefe_u3b_down', true); sc.cameras.main.shake(500, 0.01); sfx('rugido'); }
    const nueva = () => {
      d = Preguntas.nuevo(S.curso, 'u3', J.fase === 1 ? 2 : 3, S.stats); elegida = null; fallidas = new Set();
      J.limite = J.fase === 1 ? 22000 : J.fase === 2 ? 16000 : 12000; J.t0 = performance.now();
    };
    const faseDe = () => (J.hp <= J.max / 3 ? 3 : J.hp <= (2 * J.max) / 3 ? 2 : 1);
    const cerrar = (res) => {
      clearInterval(reloj); sc.enCombate = false;
      if (res === 'victoria') {
        sfx('logro');
        Object.entries(COLOSO.premio).forEach(([r, n]) => sumar(r, n)); ganarXP(COLOSO.xp);
        S.colosoVencido = (S.colosoVencido || 0) + 1; S.colosoHasta = Date.now() + 10 * 60000;
        if (S.colosoVencido === 1) S.inventario.estatua_coloso = (S.inventario.estatua_coloso || 0) + 1;
        avanzarMision('coloso'); guardar(true);
        sc.celebrar(sc.coloso.x, sc.coloso.y - 80);
      } else if (res === 'derrota') { S.colosoHasta = Date.now() + 2 * 60000; guardar(true); }
      if (sc.actualizarColoso) sc.actualizarColoso();
      if (res === 'derrota') morir(COLOSO.nombre);
    };
    const pintar = () => {
      const pct = Math.max(0, J.hp) / J.max * 100;
      const banner = J.fase === 2 ? '<div class="mensaje pista rey-fase">🪨 ¡Coraza de magma! Rómpela con aciertos antes de poder herirlo. Cada error la endurece y quita 2 corazones.</div>'
        : J.fase === 3 ? '<div class="mensaje mal rey-fase">🌋 ¡Erupción! Solo lo hieres con <b>2 aciertos seguidos</b> (el segundo hace doble daño). Cada error quita 3 corazones y lo cura 3.</div>' : '';
      let cuerpo;
      if (fin === 'victoria') cuerpo = `<div class="mensaje bien" role="status" style="font-size:18px">¡Venciste al Coloso de Magma! Ganas ${Object.entries(COLOSO.premio).map(([r, n]) => `${n} ${nombreRec(r)}`).join(', ')} y ${COLOSO.xp} de experiencia.${primeraVez ? ' Además, ganaste la <strong>Estatua del Coloso</strong> para tu base (Decorar).' : ''} Volverá a encenderse en 10 minutos.</div><div class="acciones"><span></span><button type="button" class="btn pri" id="r-fin" data-foco>¡Celebrar!</button></div>`;
      else if (fin === 'derrota') cuerpo = '<div class="mensaje mal" role="status">Te quedaste sin corazones. Vuelves a tu base y pierdes lo que llevabas en la mochila. El Coloso descansará 2 minutos.</div><div class="acciones"><span></span><button type="button" class="btn pri" id="r-fin" data-foco>Volver a mi base</button></div>';
      else if (fin === 'huir') cuerpo = '<div class="mensaje pista" role="status">Te retiraste. El Coloso recuperó toda su vida.</div><div class="acciones"><span></span><button type="button" class="btn pri" id="r-fin" data-foco>Cerrar</button></div>';
      else cuerpo = `${banner}${ultimo}
          <div class="rey-tiempo"><i id="r-tiempo" style="width:100%"></i></div>
          <p class="enunciado">${mate(d.enunciado)}</p>
          ${alternativasHTML(d, elegida, fallidas, false)}
          <div class="acciones"><div><button type="button" class="btn" id="r-huir">Retirarse (−2 ❤)</button></div><div><button type="button" class="btn pri" id="r-ok" ${elegida === null ? 'disabled' : ''}>¡Atacar!</button></div></div>`;
      ui.abrir(`
        <div class="combate-cab">
          <div class="luchador"><img class="px" src="${sc.imagenTex('jefe_u3b_retrato')}" alt="" width="72" height="72">
            <div><span class="etq" style="color: var(--coral)">Jefe de las Profundidades · Fase ${J.fase} de 3 · ${esc(d ? d.titulo : '')}</span><h2 id="modal-titulo">${COLOSO.nombre}</h2>
              <div class="barra enemigo" role="img" aria-label="Vida del jefe: ${Math.max(0, J.hp)} de ${J.max}"><i style="width:${pct}%"></i></div>
              ${J.coraza > 0 ? `<span class="rey-escudo">🪨 Coraza de magma: ${J.coraza}</span>` : ''}${J.fase === 3 ? `<span class="rey-escudo">🔥 Racha: ${J.racha} de 2</span>` : ''}</div></div>
          <div class="tu-vida"><span class="etq">Tu vida</span><div class="corazones">${corazones(S.vida, vidaMax())}</div><span class="nota">Tu golpe quita ${danio()}</span></div>
        </div>${cuerpo}`, 'combate jefe rey coloso');
      document.querySelectorAll('.alt').forEach((b) => b.addEventListener('click', () => { elegida = Number(b.dataset.i); pintar(); }));
      const on = (id, f) => { const el = $(id); if (el) el.addEventListener('click', f); };
      on('r-ok', atacar);
      on('r-huir', () => { if (fin) return; fin = 'huir'; S.vida = Math.max(1, S.vida - 2); pintarHUD(); pintar(); });
      on('r-fin', () => { const f = fin; ui.alCerrar = () => cerrar(f); ui.cerrar(); });
      ui.teclas = (e) => {
        if (fin) { if (e.key === 'Enter') { e.preventDefault(); const f = fin; ui.alCerrar = () => cerrar(f); ui.cerrar(); } return; }
        if (/^[1-4]$/.test(e.key)) { elegida = Number(e.key) - 1; pintar(); } else if (e.key === 'Enter') { e.preventDefault(); atacar(); }
      };
    };
    const golpeRecibido = (motivo) => {
      sfx('dano'); J.racha = 0;
      if (escudoActivo()) { vivo.st.bloqueos = (vivo.st.bloqueos || 0) + 1; ultimo = `<div class="mensaje pista" role="status">${motivo} ¡Tu escudo de cristal bloqueó el golpe!</div>`; return; }
      const n = J.fase;
      S.vida = Math.max(0, S.vida - n); sc.dolor(); pintarHUD();
      if (J.fase === 3) J.hp = Math.min(J.max, J.hp + 3);
      if (J.fase === 2) J.coraza = Math.min(4, J.coraza + 1);
      ultimo = `<div class="mensaje mal" role="status">${motivo} ¡El Coloso te lanzó magma (−${n} ${n === 1 ? 'corazón' : 'corazones'})!${J.fase === 3 ? ' Y se curó 3.' : J.fase === 2 ? ' Su coraza se endureció.' : ''}</div>`;
      if (S.vida <= 0) fin = 'derrota';
    };
    const herir = (n) => {
      J.hp -= n;
      sc.flotante(sc.coloso.x, sc.coloso.y - 130, `−${n}`, '#ffd27a');
      sc.tweens.add({ targets: sc.coloso, x: sc.coloso.x + 5, duration: 50, yoyo: true, repeat: 2 });
    };
    const atacar = () => {
      if (fin || elegida === null) return;
      const ok = elegida === d.correcta;
      registrar(d.tema, ok);
      if (ok) {
        ganarXP(5 + 2 * J.fase); sfx('golpe');
        if (J.coraza > 0) { J.coraza -= 1; ultimo = `<div class="mensaje bien" role="status">¡Golpe! ${J.coraza ? `La coraza de magma resiste: le quedan ${J.coraza}.` : '¡Rompiste la coraza de magma!'}</div>`; }
        else if (J.fase === 3) {
          J.racha += 1;
          if (J.racha >= 2) { herir(danio() * 2); J.racha = 0; ultimo = `<div class="mensaje bien" role="status">¡Doble golpe! ${mate(d.explicacion)}</div>`; }
          else ultimo = '<div class="mensaje bien" role="status">¡Bien! Un acierto más seguido y le darás un doble golpe.</div>';
        } else { herir(danio()); ultimo = `<div class="mensaje bien" role="status">¡Golpe! ${mate(d.explicacion)}</div>`; }
        if (J.hp <= 0) fin = 'victoria';
      } else golpeRecibido(`La respuesta era ${mate(d.opciones[d.correcta])}.`);
      if (!fin) {
        const f = faseDe();
        if (f > J.fase) {
          J.fase = f; sc.cameras.main.shake(600, 0.012); sc.cameras.main.flash(300, 255, f === 3 ? 90 : 150, 30);
          sfx('rugido');
          if (f === 2) { J.coraza = 4; for (let i = 0; i < 2; i++) sc.soltarBichoJunto(); }
          if (f === 3) { sc.coloso.setTint(0xff7a3a); J.racha = 0; }
        }
        nueva();
      }
      pintar();
    };
    nueva();
    pintar();
    reloj = setInterval(() => {
      if (fin || !J.limite) return;
      const resto = J.limite - (performance.now() - J.t0), barra = $('r-tiempo');
      if (barra) barra.style.width = `${Math.max(0, (resto / J.limite) * 100)}%`;
      if (resto <= 0) { golpeRecibido('¡Se acabó el tiempo!'); if (!fin) nueva(); pintar(); }
    }, 200);
  }

  // ---------- Combate ----------
  function abrirCombate(enemigo, alTerminar) {
    const E = ENEMIGOS[enemigo.clase];
    const dif = difPara(E.dif);
    const nuevo = () => Preguntas.nuevo(S.curso, unidadActual(), dif, S.stats);
    let d = nuevo(), elegida = null, fallidas = new Set(), fase = 'pregunta', ultimo = '', pista = false;
    const retrato = escena.retrato(enemigo.clase);
    const fin = unaVez((r) => alTerminar(r));

    const pintar = () => {
      const vidaE = Math.max(0, enemigo.vida);
      let cuerpo;
      if (fase === 'victoria') {
        const botin = Object.entries(enemigo.botin || E.botin);
        cuerpo = `<div class="mensaje bien" role="status">¡Venciste ${enemigo.clase === 'dorado' ? 'a la' : 'al'} ${esc(E.nombre.toLowerCase())}! Ganas ${botin.length ? botin.map(([r, n]) => `${n} ${nombreRec(r)}`).join(' y ') + ' y ' : ''}${E.xp} de experiencia.</div>
          <div class="acciones"><span></span><button type="button" class="btn pri" id="c-fin" data-foco>¡Seguir!</button></div>`;
      } else if (fase === 'derrota') {
        cuerpo = `<div class="mensaje mal" role="status">Te quedaste sin corazones. Volverás a tu base y perderás lo que llevabas en la mochila.</div>
          <div class="acciones"><span></span><button type="button" class="btn pri" id="c-fin" data-foco>Volver a mi base</button></div>`;
      } else {
        cuerpo = `
          ${ultimo}
          <p class="enunciado">${mate(d.enunciado)}</p>
          ${alternativasHTML(d, elegida, fallidas, false)}
          ${pista ? `<div class="mensaje pista">${mate(d.pista)}</div>` : ''}
          <div class="acciones">
            <div><button type="button" class="btn sec" id="c-pista">${pista ? 'Ocultar pista' : 'Ver pista'}</button><button type="button" class="btn" id="c-huir" title="Huir te quita ${VIDA_HUIR} corazón">Huir (−${VIDA_HUIR} ❤)</button></div>
            <div><button type="button" class="btn pri" id="c-ok" ${elegida === null ? 'disabled' : ''}>¡Atacar!</button></div>
          </div>`;
      }
      ui.abrir(`
        <div class="combate-cab">
          <div class="luchador">
            <img class="px" src="${retrato}" alt="" width="72" height="72">
            <div><span class="etq" style="color: var(--coral)">Combate · ${esc(d.titulo)}</span><h2 id="modal-titulo">${esc(E.nombre)}</h2>
              <div class="barra enemigo" role="img" aria-label="Vida del enemigo: ${vidaE} de ${enemigo.vidaMax}"><i style="width: ${(vidaE / enemigo.vidaMax) * 100}%"></i></div></div>
          </div>
          <div class="tu-vida"><span class="etq">Tu vida</span><div class="corazones">${corazones(S.vida, vidaMax())}</div><span class="nota">Tu golpe quita ${danio()}</span></div>
        </div>
        ${cuerpo}`, 'combate');
      document.querySelectorAll('.alt').forEach((b) => b.addEventListener('click', () => { elegida = Number(b.dataset.i); pintar(); }));
      const on = (id, f) => { const el = $(id); if (el) el.addEventListener('click', f); };
      on('c-ok', atacar);
      on('c-pista', () => { pista = !pista; pintar(); });
      on('c-huir', () => { ui.alCerrar = () => fin('huir'); ui.cerrar(); });
      on('c-fin', () => { ui.alCerrar = () => fin(fase); ui.cerrar(); });
      ui.teclas = teclas;
    };
    const atacar = () => {
      if (elegida === null || fase !== 'pregunta') return;
      const ok = elegida === d.correcta;
      registrar(d.tema, ok);
      if (ok) {
        enemigo.vida -= danio(); sfx('golpe');
        ganarXP(4 + 2 * dif);
        escena.golpeEnemigo(enemigo, danio());
        ultimo = `<div class="mensaje bien" role="status">¡Golpe! ${mate(d.explicacion)}</div>`;
        if (enemigo.vida <= 0) { fase = 'victoria'; setTimeout(() => sfx('victoria'), 150); }
      } else if (escudoActivo()) {
        vivo.st.bloqueos = (vivo.st.bloqueos || 0) + 1;
        ultimo = `<div class="mensaje pista" role="status">¡Tu escudo de cristal bloqueó el golpe! La respuesta era ${mate(d.opciones[d.correcta])}. ${mate(d.explicacion)}</div>`;
      } else {
        S.vida -= 1; sfx('dano');
        escena.dolor();
        pintarHUD();
        ultimo = `<div class="mensaje mal" role="status">¡Te golpeó! La respuesta era ${mate(d.opciones[d.correcta])}. ${mate(d.explicacion)}</div>`;
        if (S.vida <= 0) fase = 'derrota';
      }
      guardar();
      d = nuevo(); elegida = null; fallidas = new Set(); pista = false;
      pintar();
    };
    const teclas = (e) => {
      if (fase !== 'pregunta') { if (e.key === 'Enter') { e.preventDefault(); ui.alCerrar = () => fin(fase); ui.cerrar(); } return; }
      if (/^[1-4]$/.test(e.key)) { elegida = Number(e.key) - 1; pintar(); }
      else if (e.key === 'Enter') { e.preventDefault(); atacar(); }
    };
    pintar();
  }

  // ---------- Rey Jabalí Ancestral (jefe del Bosque profundo, se enfrenta solo) ----------
  // Fase 1: preguntas normales. Fase 2 (≤ 2/3 de vida): llama a su manada y se cubre con un escudo de raíces que
  // hay que romper con aciertos seguidos; además cada pregunta tiene tiempo. Fase 3 (≤ 1/3): furia ancestral:
  // preguntas difíciles, menos tiempo, cada error quita 3 corazones y el jefe recupera vida.
  const REY = { nombre: 'Rey Jabalí Ancestral', vida: 30, premio: { resina: 10, miel: 8, cristal: 6, madera: 20 }, xp: 180 };
  function abrirReyJabali() {
    const sc = escena;
    if (S.arma && S.herramienta !== 'espada') equipar('espada');
    const J = { hp: REY.vida, max: REY.vida, fase: 1, escudo: 0, limite: 0, t0: 0 };
    let d = null, elegida = null, fallidas = new Set(), fin = null, ultimo = '', reloj = 0;
    const primeraVez = !S.reyVencido;
    sc.enCombate = true;
    if (sc.rey) { sc.rey.setTint(0xffffff); sc.rey.anims.play('jefe_u1b_down', true); sc.cameras.main.shake(400, 0.008); sfx('rugido'); }
    const nueva = () => {
      d = Preguntas.nuevo(S.curso, 'u1', J.fase === 3 ? 3 : 2, S.stats); elegida = null; fallidas = new Set();
      J.limite = J.fase === 1 ? 0 : J.fase === 2 ? 25000 : 18000; J.t0 = performance.now();
    };
    const danioRecibido = () => (J.fase === 1 ? 1 : J.fase === 2 ? 2 : 3);
    const faseDe = () => (J.hp <= J.max / 3 ? 3 : J.hp <= (2 * J.max) / 3 ? 2 : 1);
    const cerrar = (res) => {
      clearInterval(reloj); sc.enCombate = false;
      if (res === 'victoria') {
        sfx('logro');
        Object.entries(REY.premio).forEach(([r, n]) => sumar(r, n)); ganarXP(REY.xp);
        S.reyVencido = (S.reyVencido || 0) + 1; S.reyHasta = Date.now() + 10 * 60000;
        if (S.reyVencido === 1) { S.inventario.estatua_jabali = (S.inventario.estatua_jabali || 0) + 1; }
        avanzarMision('rey'); guardar(true);
        sc.celebrar(sc.rey.x, sc.rey.y - 80);
      } else if (res === 'derrota') { S.reyHasta = Date.now() + 2 * 60000; guardar(true); }
      if (sc.actualizarRey) sc.actualizarRey();
      if (res === 'derrota') morir(REY.nombre);
    };
    const pintar = () => {
      const pct = Math.max(0, J.hp) / J.max * 100;
      const banner = J.fase === 2 ? '<div class="mensaje pista rey-fase">🐗 ¡Llamó a su manada! Un escudo de raíces lo protege: rómpelo con aciertos. Cada pregunta tiene tiempo.</div>'
        : J.fase === 3 ? '<div class="mensaje mal rey-fase">🔥 ¡Furia ancestral! Preguntas difíciles, menos tiempo y cada error quita 3 corazones.</div>' : '';
      let cuerpo;
      if (fin === 'victoria') cuerpo = `<div class="mensaje bien" role="status" style="font-size:18px">¡Venciste al Rey Jabalí Ancestral! Ganas ${Object.entries(REY.premio).map(([r, n]) => `${n} ${nombreRec(r)}`).join(', ')} y ${REY.xp} de experiencia.${primeraVez ? ' Además, ganaste la <strong>Estatua del Rey Jabalí</strong> para tu base (Decorar).' : ''} Volverá a despertar en 10 minutos.</div><div class="acciones"><span></span><button type="button" class="btn pri" id="r-fin" data-foco>¡Celebrar!</button></div>`;
      else if (fin === 'derrota') cuerpo = '<div class="mensaje mal" role="status">Te quedaste sin corazones. Vuelves a tu base y pierdes lo que llevabas en la mochila. El Rey Jabalí descansará 2 minutos.</div><div class="acciones"><span></span><button type="button" class="btn pri" id="r-fin" data-foco>Volver a mi base</button></div>';
      else if (fin === 'huir') cuerpo = '<div class="mensaje pista" role="status">Te retiraste. El Rey Jabalí recuperó toda su vida.</div><div class="acciones"><span></span><button type="button" class="btn pri" id="r-fin" data-foco>Cerrar</button></div>';
      else cuerpo = `${banner}${ultimo}
          ${J.limite ? `<div class="rey-tiempo"><i id="r-tiempo" style="width:100%"></i></div>` : ''}
          <p class="enunciado">${mate(d.enunciado)}</p>
          ${alternativasHTML(d, elegida, fallidas, false)}
          <div class="acciones"><div><button type="button" class="btn" id="r-huir">Retirarse (−2 ❤)</button></div><div><button type="button" class="btn pri" id="r-ok" ${elegida === null ? 'disabled' : ''}>¡Atacar!</button></div></div>`;
      ui.abrir(`
        <div class="combate-cab">
          <div class="luchador"><img class="px" src="${sc.imagenTex('jefe_u1b_retrato')}" alt="" width="72" height="72">
            <div><span class="etq" style="color: var(--coral)">Jefe del Bosque profundo · Fase ${J.fase} de 3 · ${esc(d ? d.titulo : '')}</span><h2 id="modal-titulo">${REY.nombre}</h2>
              <div class="barra enemigo" role="img" aria-label="Vida del jefe: ${Math.max(0, J.hp)} de ${J.max}"><i style="width:${pct}%"></i></div>
              ${J.escudo > 0 ? `<span class="rey-escudo">🛡️ Escudo de raíces: ${J.escudo}</span>` : ''}</div></div>
          <div class="tu-vida"><span class="etq">Tu vida</span><div class="corazones">${corazones(S.vida, vidaMax())}</div><span class="nota">Tu golpe quita ${danio()}</span></div>
        </div>${cuerpo}`, 'combate jefe rey');
      document.querySelectorAll('.alt').forEach((b) => b.addEventListener('click', () => { elegida = Number(b.dataset.i); pintar(); }));
      const on = (id, f) => { const el = $(id); if (el) el.addEventListener('click', f); };
      on('r-ok', atacar);
      on('r-huir', () => { if (fin) return; fin = 'huir'; S.vida = Math.max(1, S.vida - 2); pintarHUD(); pintar(); });
      on('r-fin', () => { const f = fin; ui.alCerrar = () => cerrar(f); ui.cerrar(); });
      ui.teclas = (e) => {
        if (fin) { if (e.key === 'Enter') { e.preventDefault(); const f = fin; ui.alCerrar = () => cerrar(f); ui.cerrar(); } return; }
        if (/^[1-4]$/.test(e.key)) { elegida = Number(e.key) - 1; pintar(); } else if (e.key === 'Enter') { e.preventDefault(); atacar(); }
      };
    };
    const golpeRecibido = (motivo) => {
      sfx('dano');
      if (escudoActivo()) { vivo.st.bloqueos = (vivo.st.bloqueos || 0) + 1; ultimo = `<div class="mensaje pista" role="status">${motivo} ¡Tu escudo de cristal bloqueó el golpe!</div>`; return; }
      const n = danioRecibido();
      S.vida = Math.max(0, S.vida - n); sc.dolor(); pintarHUD();
      if (J.fase === 3) J.hp = Math.min(J.max, J.hp + 2);
      if (J.fase === 2) J.escudo = Math.min(3, J.escudo + 1);
      ultimo = `<div class="mensaje mal" role="status">${motivo} ¡El Rey Jabalí te embistió (−${n} ${n === 1 ? 'corazón' : 'corazones'})!${J.fase === 3 ? ' Y recuperó 2 de vida.' : J.fase === 2 ? ' Su escudo de raíces creció.' : ''}</div>`;
      if (S.vida <= 0) fin = 'derrota';
    };
    const atacar = () => {
      if (fin || elegida === null) return;
      const ok = elegida === d.correcta;
      registrar(d.tema, ok);
      if (ok) {
        ganarXP(4 + 2 * J.fase); sfx('golpe');
        if (J.escudo > 0) { J.escudo -= 1; ultimo = `<div class="mensaje bien" role="status">¡Golpe! ${J.escudo ? `El escudo de raíces resiste: le quedan ${J.escudo}.` : '¡Rompiste el escudo de raíces!'}</div>`; }
        else {
          J.hp -= danio();
          sc.flotante(sc.rey.x, sc.rey.y - 120, `−${danio()}`, '#ffd27a');
          sc.tweens.add({ targets: sc.rey, x: sc.rey.x + 5, duration: 50, yoyo: true, repeat: 2 });
          ultimo = `<div class="mensaje bien" role="status">¡Golpe! ${mate(d.explicacion)}</div>`;
        }
        if (J.hp <= 0) fin = 'victoria';
      } else golpeRecibido(`La respuesta era ${mate(d.opciones[d.correcta])}.`);
      if (!fin) {
        const f = faseDe();
        if (f > J.fase) {
          J.fase = f; sc.cameras.main.shake(500, 0.01); sc.cameras.main.flash(300, f === 3 ? 230 : 120, f === 3 ? 80 : 160, 60);
          sfx('rugido');
          if (f === 2) { J.escudo = 3; for (let i = 0; i < 2; i++) sc.soltarBichoJunto(); }
          if (f === 3) sc.rey.setTint(0xff9a7a);
        }
        nueva();
      }
      pintar();
    };
    nueva();
    pintar();
    reloj = setInterval(() => {
      if (fin || !J.limite) return;
      const resto = J.limite - (performance.now() - J.t0), barra = $('r-tiempo');
      if (barra) barra.style.width = `${Math.max(0, (resto / J.limite) * 100)}%`;
      if (resto <= 0) { golpeRecibido('¡Se acabó el tiempo!'); if (!fin) nueva(); pintar(); }
    }, 200);
  }

  // ---------- Jefe final cooperativo ----------
  let jefeUI = null;
  function abrirInfoJefe(zona) {
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq" style="color: var(--coral)">Jefe final</span><h2 id="modal-titulo">${esc(JEFES[zona].nombre)}</h2></div></div>
      <p class="enunciado" style="font-size: 18px">Este jefe no se puede vencer en solitario. Viaja a este mundo con un grupo y cuando al menos <strong>${JEFE_MIN} jugadores</strong> cumplan sus misiones de este mundo, el jefe aparecerá en un lugar al azar del mapa: búsquenlo y lleguen juntos hasta él. Cada uno responde sus ejercicios y todos los aciertos le quitan vida.</p>
      <div class="acciones"><span></span><button type="button" class="btn pri" id="ij-ok" data-foco>Entendido</button></div>`, 'jefe');
    $('ij-ok').addEventListener('click', () => ui.cerrar());
  }
  function abrirJefe() {
    const e = escena, J0 = JEFES[e.zona];
    // Jefes con fases: bajo la mitad de vida se enfurecen (preguntas más difíciles y golpes más fuertes)
    const enFuria = () => Boolean(J0.fases && e.jefe.max && e.jefe.hp <= e.jefe.max / 2 && e.jefe.hp > 0);
    const difAhora = () => (enFuria() ? 3 : difPara(2));
    const danioJefe = () => (enFuria() ? JEFE_DANIO + 1 : JEFE_DANIO);
    let furiaVista = enFuria();
    const nuevo = () => Preguntas.nuevo(S.curso, e.zona, difAhora(), S.stats);
    let d = nuevo(), elegida = null, ultimo = '', fase = 'pregunta', pagado = false;
    const retrato = e.textures.getBase64(J0.retrato || `jefe_${e.zona}`);
    const dif = difPara(2);
    const equipoHTML = () => e.jefe.part.map((id) => `<span class="pildora">${esc(e.nombreJugador(id))}</span>`).join('');
    const barra = () => { const J = e.jefe; return J.max ? Math.max(0, (J.hp / J.max) * 100) : 0; };
    const pintar = () => {
      let cuerpo;
      if (fase === 'victoria') {
        cuerpo = `<div class="mensaje bien" role="status">¡Su grupo venció al ${esc(J0.nombre.toLowerCase())}! Cada participante gana ${Object.entries(J0.premio || JEFE_PREMIO).map(([r, n]) => `${n} ${nombreRec(r)}`).join(', ')} y 80 de experiencia.</div>
          <div class="acciones"><span></span><button type="button" class="btn pri" id="j-fin" data-foco>¡Celebrar!</button></div>`;
      } else if (fase === 'caido') {
        cuerpo = `<div class="mensaje mal" role="status">Te quedaste sin corazones. Tu grupo sigue luchando; tú vuelves a tu base y pierdes lo que llevabas en la mochila. Para volver a enfrentar al jefe tendrás que cumplir nuevas misiones.</div>
          <div class="acciones"><span></span><button type="button" class="btn pri" id="j-fin" data-foco>Volver a mi base</button></div>`;
      } else if (fase === 'fin') {
        cuerpo = `<div class="mensaje pista" role="status">El combate terminó porque el grupo se separó. Pueden volver a intentarlo cuando estén ${JEFE_MIN} junto al jefe.</div>
          <div class="acciones"><span></span><button type="button" class="btn pri" id="j-fin" data-foco>Cerrar</button></div>`;
      } else {
        cuerpo = `${ultimo}
          <p class="enunciado">${mate(d.enunciado)}</p>
          ${alternativasHTML(d, elegida, new Set(), false)}
          <div class="acciones">
            <div><button type="button" class="btn" id="j-salir">Retirarse</button></div>
            <div><button type="button" class="btn pri" id="j-ok" ${elegida === null ? 'disabled' : ''}>¡Atacar!</button></div>
          </div>`;
      }
      ui.abrir(`
        <div class="combate-cab">
          <div class="luchador">
            <img class="px" src="${retrato}" alt="" width="72" height="72">
            <div><span class="etq" style="color: var(--coral)">Jefe final · ${esc(d.titulo)}</span><h2 id="modal-titulo">${esc(J0.nombre)}</h2>
              <div class="barra enemigo" role="img" aria-label="Vida del jefe"><i id="jefe-barra" style="width: ${barra()}%"></i></div>
              <span class="nota" id="jefe-hp">Vida: ${e.jefe.hp} de ${e.jefe.max}</span></div>
          </div>
          <div class="tu-vida"><span class="etq">Tu vida</span><div class="corazones">${corazones(S.vida, vidaMax())}</div><span class="nota">Tu golpe quita ${danio()} · si fallas pierdes ${danioJefe()}</span></div>
        </div>
        <div class="pildoras" id="jefe-equipo">${equipoHTML()}</div>
        ${enFuria() && fase === 'pregunta' ? `<div class="mensaje furia" role="status"><strong>${esc((J0.furia || {}).titulo || '¡Furia!')}</strong> ${esc(J0.nombre)} está furioso: las preguntas son más difíciles y si fallas pierdes ${danioJefe()} corazones.</div>` : ''}
        ${cuerpo}`, enFuria() ? 'combate furia' : 'combate');
      document.querySelectorAll('.alt').forEach((b) => b.addEventListener('click', () => { elegida = Number(b.dataset.i); pintar(); }));
      const on = (id, f) => { const el = $(id); if (el) el.addEventListener('click', f); };
      on('j-ok', atacar);
      on('j-salir', () => { e.salirDelJefe(); e.perderContraJefe(); jefeUI = null; ui.cerrar(); });
      on('j-fin', terminar);
      ui.teclas = (ev) => {
        if (fase !== 'pregunta') { if (ev.key === 'Enter') { ev.preventDefault(); terminar(); } return; }
        if (/^[1-4]$/.test(ev.key)) { elegida = Number(ev.key) - 1; pintar(); } else if (ev.key === 'Enter') { ev.preventDefault(); atacar(); }
      };
    };
    const terminar = () => {
      const f = fase; jefeUI = null; e.enJefe = false; ui.cerrar();
      if (f === 'caido') morir(J0.nombre.toLowerCase());
    };
    const atacar = () => {
      if (elegida === null || fase !== 'pregunta') return;
      const ok = elegida === d.correcta;
      registrar(d.tema, ok);
      if (ok) { sfx('golpe'); ganarXP(4 + 2 * dif); ultimo = `<div class="mensaje bien" role="status">¡Golpe! ${mate(d.explicacion)}</div>`; e.golpeLocal(danio()); }
      else {
        const dj = danioJefe(); sfx('dano');
        if (escudoActivo()) {
          vivo.st.bloqueos = (vivo.st.bloqueos || 0) + 1;
          ultimo = `<div class="mensaje pista" role="status">¡Tu escudo de cristal bloqueó el golpe del jefe! La respuesta era ${mate(d.opciones[d.correcta])}. ${mate(d.explicacion)}</div>`;
        } else {
          S.vida = Math.max(0, S.vida - dj); e.dolor(); pintarHUD();
          ultimo = `<div class="mensaje mal" role="status">¡El jefe te dio un golpe ${dj > JEFE_DANIO ? 'furioso' : 'doble'} (−${dj} corazones)! La respuesta era ${mate(d.opciones[d.correcta])}. ${mate(d.explicacion)}</div>`;
        }
        if (S.vida <= 0) { fase = 'caido'; e.salirDelJefe(); e.perderContraJefe(); }
      }
      guardar();
      d = nuevo(); elegida = null;
      if (fase === 'pregunta') revisar(); else pintar();
    };
    const revisar = () => {
      const J = e.jefe;
      if (fase === 'pregunta' && J.estado === 'vencido') {
        fase = 'victoria';
        if (!pagado) {
          pagado = true;
          Object.entries(J0.premio || JEFE_PREMIO).forEach(([r, n]) => sumar(r, n));
          S.jefes = S.jefes || {}; S.jefes[e.zona] = (S.jefes[e.zona] || 0) + 1;
          S.misiones[e.zona] = nuevasMisiones(e.zona);
          ganarXP(80); guardar(true);
          setTimeout(() => { toast('Recibiste nuevas misiones para volver a enfrentar al jefe.'); e.avisarGuarida(); pintarMisiones(); }, 2500);
          e.celebrar(e.jefeSpr ? e.jefeSpr.x : undefined, e.jefeSpr ? e.jefeSpr.y - 60 : undefined);
        }
        pintar(); return;
      }
      if (fase === 'pregunta' && (J.estado === 'libre' || !J.part.includes(idJuego))) { fase = 'fin'; e.enJefe = false; pintar(); return; }
      pintar();
    };
    jefeUI = () => {
      const b = $('jefe-barra'), t = $('jefe-hp'), q = $('jefe-equipo');
      if (b) b.style.width = `${barra()}%`;
      if (t) t.textContent = `Vida: ${e.jefe.hp} de ${e.jefe.max}`;
      if (q) q.innerHTML = equipoHTML();
      if (fase === 'pregunta' && (e.jefe.estado !== 'combate' || !e.jefe.part.includes(idJuego))) { revisar(); return; }
      if (fase === 'pregunta' && !furiaVista && enFuria()) { furiaVista = true; e.furiaJefe(); d = nuevo(); elegida = null; pintar(); }
    };
    pintar();
  }
  function actualizarJefeUI() { if (jefeUI) jefeUI(); }
  function pintarCoop() {
    const el = $('hud-coop'); if (!el) return;
    const e = escena;
    if (!e || !MUNDOS[e.zona]) { el.classList.add('oculto'); return; }
    el.classList.remove('oculto');
    if (!e.canal) { el.textContent = 'Explorando solo'; return; }
    el.textContent = e.canal.est === 'ok' ? `Grupo ${S.grupo} · ${1 + e.otros.size} en este mundo` : `Grupo ${S.grupo} · conectando…`;
  }

  // ---------- Fabricar (en la base) ----------
  function costoHTML(costo) {
    return Object.entries(costo).map(([r, n]) => `<span class="${total(r) < n ? 'falta' : ''}"><img class="px" src="${ICONO(r)}" alt="">${n} ${nombreRec(r)}</span>`).join('');
  }
  const lugarDe = (o) => (o.lugar === 'ambos' ? ['base', 'pieza'] : [o.lugar]);
  function catalogoHTML(lugar) {
    const items = OBJETOS.filter((o) => lugarDe(o).includes(lugar)).sort((x, y) => (x.lugar === 'ambos') - (y.lugar === 'ambos'));
    const cats = [...new Set(items.map((o) => o.cat))];
    return cats.map((cat) => `<h3 class="cat">${esc(cat)}</h3><div class="catalogo">${items.filter((o) => o.cat === cat).map((o) => {
      const n = S.inventario[o.id] || 0;
      const der = o.excl ? `<span class="nota">${cuantos(o.id) ? `Tienes ${cuantos(o.id)}` : o.premio ? o.premio : o.trofeo ? 'Premio por vencer al Rey Jabalí Ancestral' : o.album === 'gemas' ? 'Premio por completar el álbum de gemas' : o.album ? 'Premio por completar el álbum de peces' : 'Premio al subir de nivel'}</span>`
        : `<div class="costo">${costoHTML(o.costo)}</div><button type="button" class="btn pri chico" data-o="${o.id}" ${alcanza(o.costo) ? '' : 'disabled'}>Fabricar</button>`;
      return `<div class="item ${o.excl ? 'excl' : ''}"><img class="px" src="${escena.imagenTex(o.tex)}" alt=""><strong>${esc(o.nombre)}</strong><small>${n ? `${n} sin colocar` : ' '}</small>${der}</div>`;
    }).join('')}</div>`).join('');
  }
  // Recursos recolectados (cofre + mochila): se muestran al fabricar
  function recursosFabricarHTML() {
    const lista = RECURSOS.filter((r) => r.grupo === 'u1' || r.grupo === 'u1p' || recursosVisibles().includes(r) || (S.cofre[r.id] || 0) + (S.mochila[r.id] || 0) > 0);
    return `<section class="mis-recursos" aria-label="Tus recursos"><span class="etq">${esDocente() ? 'Tus recursos · docente: ilimitados' : 'Tus recursos recolectados'}</span>
      <div class="lista">${lista.map((r) => `<div class="recurso-fab" title="${esc(r.nombre)}"><img class="px" src="${ICONO(r.id)}" alt=""><span><small>${esc(r.corto || r.nombre)}</small><b>${esDocente() ? '∞' : (S.cofre[r.id] || 0) + (S.mochila[r.id] || 0)}</b></span></div>`).join('')}</div></section>`;
  }
  function abrirFabricar(pestana) {
    if (!pestana) pestana = escena && escena.zona === 'pieza' ? 'pieza' : 'equipo';
    const filasEquipo = MEJORAS.map((m) => {
      const hecha = tiene(m.id), bloq = m.requiere && !tiene(m.requiere);
      const equipable = ARMAS[m.id] || ARMADURAS[m.id];
      const puesta = S.arma === m.id || S.armadura === m.id;
      const der = hecha && equipable ? (puesta ? '<span class="estado-ok">Equipada</span>' : `<button type="button" class="btn sec" data-eq="${m.id}">Equipar</button>`)
        : hecha ? `<span class="estado-ok">${m.id === 'cana' ? `Fabricada · ${usosCana()} de ${CANA_USOS} usos` : 'Fabricado'}</span>`
        : bloq ? `<span class="nota" style="max-width: 150px">Primero: ${esc(NOMBRE_MEJORA[m.requiere])}</span>`
          : `<button type="button" class="btn pri" data-m="${m.id}" ${alcanza(m.costo) ? '' : 'disabled'}>Fabricar</button>`;
      return `<div class="mejora ${hecha ? 'hecha' : ''}"><img class="ico px" src="${ICONO(m.icono)}" alt="">
        <div class="info"><strong>${esc(m.nombre)}</strong><span>${esc(m.desc)}</span><div class="costo">${costoHTML(m.costo)}</div></div>${der}</div>`;
    }).join('');
    const cuerpo = pestana === 'equipo' ? `<div class="mejoras">${filasEquipo}</div>`
      : `<p class="nota">${pestana === 'base' ? 'Decora el exterior de tu base. Si fabricas una carpa, podrás entrar a tu propia pieza.' : 'Muebles para tu pieza: entra a una carpa de tu base para colocarlos.'} Los objetos fabricados se colocan con Decorar (G).</p>${catalogoHTML(pestana)}`;
    ui.abrir(`
      <div class="modal-cab">
        <div><span class="etq">${escena.zona === 'pieza' ? 'Tu pieza' : 'Tu base'} · Los recursos se toman del cofre y la mochila</span><h2 id="modal-titulo">Fabricar</h2></div>
        <button type="button" class="btn" id="f-cerrar">Cerrar</button>
      </div>
      ${recursosFabricarHTML()}
      <div class="pestanas" role="tablist">
        <button type="button" role="tab" data-p="equipo" aria-selected="${pestana === 'equipo'}">Equipo</button>
        <button type="button" role="tab" data-p="base" aria-selected="${pestana === 'base'}">Decorativos</button>
        <button type="button" role="tab" data-p="pieza" aria-selected="${pestana === 'pieza'}">Muebles</button>
      </div>
      ${cuerpo}`, 'ancho');
    $('f-cerrar').addEventListener('click', () => ui.cerrar());
    document.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => abrirFabricar(b.dataset.p)));
    document.querySelectorAll('[data-eq]').forEach((b) => b.addEventListener('click', () => { ponerEquipo(b.dataset.eq); abrirFabricar('equipo'); }));
    document.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => {
      const m = MEJORAS.find((x) => x.id === b.dataset.m);
      const hacer = () => {
        if (!alcanza(m.costo) || tiene(m.id)) return;
        pagar(m.costo); S.mejoras.push(m.id); sfx('fabricar');
        if (m.id === 'cana') S.canaUsos = CANA_USOS;
        guardar(true); pintarHUD(); escena.celebrar();
        toast(ARMAS[m.id] || ARMADURAS[m.id] ? `¡Fabricaste: ${m.nombre}! Equípala con el botón Equipar.` : `¡Fabricaste: ${m.nombre}!`);
      };
      if (esDocente()) { hacer(); abrirFabricar('equipo'); return; }
      abrirDesafio({ accion: `Fabricar: ${m.nombre}`, dif: difPara(2), premio: 'Premio: la mejora', onOk: hacer });
    }));
    document.querySelectorAll('[data-o]').forEach((b) => b.addEventListener('click', () => {
      const o = OBJ[b.dataset.o];
      if (!o || o.excl || !alcanza(o.costo)) return;
      const scroll = $('modal').scrollTop;
      pagar(o.costo);
      S.inventario[o.id] = (S.inventario[o.id] || 0) + 1; sfx('fabricar');
      guardar(true); pintarHUD();
      toast(`Fabricaste: ${o.nombre}. Colócalo con Decorar (G).`);
      avanzarMision('fabricar');
      abrirFabricar(pestana);
      $('modal').scrollTop = scroll;
    }));
  }

  // ---------- Decorar ----------
  function abrirDecorar() {
    const lugar = escena.zona === 'pieza' ? 'pieza' : 'base';
    const items = OBJETOS.filter((o) => S.inventario[o.id] > 0 && lugarDe(o).includes(lugar));
    const otros = OBJETOS.filter((o) => S.inventario[o.id] > 0 && !lugarDe(o).includes(lugar)).length;
    const obj = escena.objetivo && escena.objetivo.tipo === 'colocado' ? escena.objetivo : null;
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">${lugar === 'pieza' ? 'Tu pieza' : 'Tu base'}</span><h2 id="modal-titulo">Decorar</h2></div><button type="button" class="btn" id="g-cerrar">Cerrar</button></div>
      <p class="nota">Elige un objeto: se colocará justo delante de tu personaje.${lugar === 'pieza' ? ' Los cuadros, espejos y antorchas se cuelgan: párate junto a la pared de arriba mirándola.' : ''} Para guardar un objeto colocado, mira hacia él y presiona R.</p>
      ${obj ? `<button type="button" class="btn sec" id="g-guardar">Guardar ${esc(obj.nombre.toLowerCase())} (el que tienes al frente)</button>` : ''}
      ${items.length ? `<div class="objetos">${items.map((o) => `<button type="button" class="obj" data-o="${o.id}"><img class="px" src="${escena.imagenTex(o.tex)}" alt=""><span>${esc(o.nombre)}</span><small>× ${S.inventario[o.id]}</small></button>`).join('')}</div>`
        : `<div class="mensaje pista">No tienes objetos para ${lugar === 'pieza' ? 'tu pieza' : 'tu base'}. Fabrícalos con B, pestaña "${lugar === 'pieza' ? 'Muebles' : 'Decorativos'}".</div>`}
      ${otros ? `<p class="nota">Tienes ${otros} ${otros === 1 ? 'objeto' : 'objetos'} para ${lugar === 'pieza' ? 'el exterior de tu base' : 'tu pieza (entra a una carpa)'}.</p>` : ''}`);
    $('g-cerrar').addEventListener('click', () => ui.cerrar());
    const bg = $('g-guardar'); if (bg) bg.addEventListener('click', () => { ui.alCerrar = () => escena.quitar(obj); ui.cerrar(); });
    document.querySelectorAll('.obj[data-o]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.o;
      ui.alCerrar = () => { if (escena.colocar(id)) { S.inventario[id] -= 1; guardar(true); avanzarMision('decorar'); } };
      ui.cerrar();
    }));
  }

  // ---------- Portal ----------
  let contenido = null;
  // Mundos abiertos: los decide el docente por curso (la Unidad 1 siempre está abierta). El docente los ve todos.
  function mundoAbierto(u) {
    if (u.id === 'u1' || esDocente()) return true;
    if (sesion.modo === 'nube' && Array.isArray(sesion.mundos)) return sesion.mundos.includes(u.id);
    return Boolean(u.habilitada);
  }
  async function cargarContenido() {
    if (!contenido) {
      try { contenido = await (await fetch('../contenido.json', { cache: 'no-cache' })).json(); } catch (e) { contenido = { cursos: [] }; }
    }
    const c = (contenido.cursos || []).find((x) => x.id === S.curso);
    return c ? c.unidades : [];
  }
  async function abrirPortal() {
    const unidades = await cargarContenido();
    const enBase = escena.zona === 'base';
    const tarjetas = unidades.map((u) => {
      const ok = mundoAbierto(u) && MUNDOS[u.id];
      const aqui = escena.zona === u.id;
      return `<button type="button" class="zona ${ok ? '' : 'cerrada'} ${aqui ? 'aqui' : ''}" data-z="${u.id}" ${ok && !aqui ? '' : 'disabled'}>
        <small>UNIDAD ${u.numero} · ${esc(u.titulo).toUpperCase()}</small><strong>${esc(MUNDOS[u.id] ? nombreZona(u.id) : 'Zona nueva')}</strong>
        <span>${aqui ? 'Estás aquí' : ok ? 'Viajar a este mundo' : `Se abre cuando tu profesor habilite la Unidad ${u.numero}.`}</span></button>`;
    }).join('');
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">Portal</span><h2 id="modal-titulo">¿A dónde quieres ir?</h2></div><button type="button" class="btn" id="p-cerrar">Cerrar</button></div>
      ${enBase ? '' : `<button type="button" class="zona" id="p-base"><small>TU BASE</small><strong>Volver a tu base</strong><span>Lo que llevas en la mochila se guarda en tu cofre y recuperas toda tu vida.</span></button>`}
      <div class="zonas">${tarjetas}</div>
      ${enBase ? '' : '<p class="nota">En los mundos tu vida no se recupera sola: vuelve a tu base o abre los cofres con corazón. Huir de un enemigo te quita 1 corazón. Si pierdes un combate, vuelves a tu base sin lo que llevabas en la mochila.</p>'}`);
    $('p-cerrar').addEventListener('click', () => ui.cerrar());
    const pb = $('p-base');
    if (pb) pb.addEventListener('click', () => { ui.alCerrar = () => viajar('base'); ui.cerrar(); });
    document.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => {
      if (coopActivo()) elegirGrupo(b.dataset.z);
      else { ui.alCerrar = () => viajar(b.dataset.z, 0); ui.cerrar(); }
    }));
  }
  const MAX_GRUPO = 6, N_GRUPOS = 8;
  async function elegirGrupo(zona) {
    let cuentas = {};
    try { cuentas = (await Nube.grupos(sesion.token, nivelNum())) || {}; } catch (e) { /* sin datos: igual se puede elegir */ }
    const botones = Array.from({ length: N_GRUPOS }, (_, i) => {
      const g = i + 1, n = cuentas[`${zona}-g${g}`] || 0, lleno = n >= MAX_GRUPO && !esDocente();
      return `<button type="button" class="obj grupo" data-g="${g}" ${lleno ? 'disabled' : ''}><strong>Grupo ${g}</strong><small>${lleno ? 'Lleno' : n === 0 ? 'Vacío' : `${n} ${n === 1 ? 'jugador' : 'jugadores'}`}</small></button>`;
    }).join('');
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">${esc(nombreZona(zona))}</span><h2 id="modal-titulo">¿Con qué grupo vas?</h2></div><button type="button" class="btn" id="gr-volver">Volver</button></div>
      <p class="nota">Verás y jugarás con los compañeros de ${S.curso === '8basico' ? '8°' : '7°'} básico que elijan el mismo grupo (máximo ${MAX_GRUPO}). Para invocar y enfrentar al jefe final necesitan ser al menos ${JEFE_MIN} con sus misiones cumplidas.</p>
      <div class="objetos">${botones}</div>
      <div class="acciones"><span></span><button type="button" class="btn sec" id="gr-solo">Explorar solo</button></div>`);
    $('gr-volver').addEventListener('click', () => abrirPortal());
    $('gr-solo').addEventListener('click', () => { ui.alCerrar = () => viajar(zona, 0); ui.cerrar(); });
    document.querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => { ui.alCerrar = () => viajar(zona, Number(b.dataset.g)); ui.cerrar(); }));
  }
  function viajar(zona, grupo = 0) {
    const desde = escena.zona;
    S.grupo = zona === 'base' ? 0 : grupo;
    if (zona === 'base') {
      const guardado = RECURSOS.map((r) => [r.id, S.mochila[r.id] || 0]).filter(([, n]) => n > 0);
      guardado.forEach(([r, n]) => { S.cofre[r] += n; S.mochila[r] = 0; });
      S.vida = vidaMax();
      if (guardado.length) setTimeout(() => toast(`Guardaste en tu cofre: ${guardado.map(([r, n]) => `${n} ${nombreRec(r)}`).join(', ')}.`), 600);
    }
    S.zona = zona;
    guardar(true);
    sfx('portal');
    escena.scene.restart({ zona, desde });
  }

  function morir(enemigo) {
    sfx('derrota');
    const perdido = RECURSOS.map((r) => [r.id, S.mochila[r.id] || 0]).filter(([, n]) => n > 0);
    RECURSOS.forEach((r) => { S.mochila[r.id] = 0; });
    S.muertes = (S.muertes || 0) + 1;
    S.vida = vidaMax();
    S.zona = 'base'; S.grupo = 0;
    guardar(true);
    escena.scene.restart({ zona: 'base', desde: 'muerte' });
    setTimeout(() => toast(perdido.length ? `El ${enemigo} te venció. Perdiste: ${perdido.map(([r, n]) => `${n} ${nombreRec(r)}`).join(', ')}.` : `El ${enemigo} te venció. Vuelves a tu base.`, 'alerta'), 700);
  }

  // ---------- Mapa y avance ----------
  async function abrirMapa() {
    const unidades = await cargarContenido();
    const bloques = unidades.map((u) => {
      const titulos = Preguntas.titulos(S.curso, u.id);
      const filas = Object.entries(titulos).map(([k, t]) => {
        const s = S.stats[k] || { a: 0, i: 0 };
        const pct = s.i ? Math.round((s.a / s.i) * 100) : 0;
        return `<div><div class="fila"><span>${esc(t)}</span><span>${s.i ? `${s.a} de ${s.i} (${pct} %)` : 'Sin intentos'}</span></div><div class="barra"><i style="width: ${pct}%"></i></div></div>`;
      }).join('');
      return `<details ${escena.zona === u.id || (enCasa() && u.id === 'u1') ? 'open' : ''}><summary><strong>Unidad ${u.numero} · ${esc(u.titulo)}</strong> ${mundoAbierto(u) ? '' : '<span class="nota">(cerrada)</span>'}</summary><div class="avance">${filas}</div></details>`;
    }).join('');
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">${S.curso === '7basico' ? '7°' : '8°'} básico${S.seccion ? ' · ' + esc(S.seccion.slice(1)) : ''}</span><h2 id="modal-titulo">Tu avance</h2></div><button type="button" class="btn" id="m-cerrar">Cerrar</button></div>
      <div class="pildoras"><span class="pildora">Nivel ${S.nivel}</span><span class="pildora">Enemigos vencidos: ${S.vencidos || 0}</span><span class="pildora">Estás en: ${esc(nombreZona(escena.zona))}</span></div>
      <div class="unidades-avance">${bloques}</div>
      <div class="acciones"><span class="nota">${sesion.modo === 'local' ? 'Modo sin conexión: el avance se guarda solo en este navegador.' : 'Tu avance se guarda en el sistema: puedes seguir desde cualquier dispositivo.'}</span>
        <span><button type="button" class="btn sec" id="m-album">📖 Álbum de peces</button> <button type="button" class="btn sec" id="m-gemas">💎 Álbum de gemas</button> <button type="button" class="btn sec" id="m-salir">${esDocente() ? 'Volver al portal docente' : 'Cerrar sesión'}</button></span></div>`);
    $('m-album').addEventListener('click', () => { ui.cerrar(); abrirAlbum(); });
    $('m-gemas').addEventListener('click', () => { ui.cerrar(); abrirAlbumGemas(); });
    $('m-cerrar').addEventListener('click', () => ui.cerrar());
    $('m-salir').addEventListener('click', async () => {
      guardar(true); await subir();
      if (esDocente()) { volverAlPortal(); return; }
      if (sesion.modo === 'nube') { try { await Nube.salir(sesion.token); } catch (e) { /* */ } }
      try { localStorage.removeItem('mathworld2:cache'); } catch (e) { /* */ }
      location.reload();
    });
  }

  function abrirCofre() {
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">Tu base</span><h2 id="modal-titulo">Cofre</h2></div><button type="button" class="btn" id="k-cerrar">Cerrar</button></div>
      <p class="nota">Aquí se guarda todo lo que traes de los mundos. Lo del cofre está a salvo aunque pierdas un combate.</p>
      <div class="objetos">${recursosVisibles().map((r) => `<div class="obj"><img class="px" src="${ICONO(r.id)}" alt=""><span>${r.nombre}</span><small>${S.cofre[r.id] || 0}</small></div>`).join('')}</div>`);
    $('k-cerrar').addEventListener('click', () => ui.cerrar());
  }

  // Teclado global
  document.addEventListener('keydown', (e) => {
    if (!S || $('hud').classList.contains('oculto')) return;
    if (ui.abierto) {
      if (e.key === 'Escape' && !$('modal').classList.contains('combate') && !$('modal').classList.contains('bloqueo')) ui.cerrar();
      else if (ui.teclas) ui.teclas(e);
      return;
    }
    const k = e.key.toLowerCase();
    const enBase = escena && enCasa();
    if (k === 'b' && enBase) abrirFabricar();
    else if (k === 'g' && enBase) abrirDecorar();
    else if (k === 'n') abrirMisiones();
    else if (k === 'r' && escena && escena.objetivo && escena.objetivo.tipo === 'colocado') escena.quitar(escena.objetivo);
    else if (k === 'm') abrirMapa();
    else if (k === '1') equipar('hacha');
    else if (k === '2') equipar('pico');
    else if (k === '3') equipar('espada');
    else if (k === 'q') abrirEquipo();
  });
  $('btn-equipo').addEventListener('click', abrirEquipo);
  $('btn-base').addEventListener('click', () => abrirFabricar());
  $('btn-decorar').addEventListener('click', abrirDecorar);
  $('btn-mapa').addEventListener('click', abrirMapa);
  $('btn-misiones').addEventListener('click', abrirMisiones);
  $('hud-misiones').addEventListener('click', (ev) => {
    if (ev.target.closest('[data-plegar]')) { try { localStorage.setItem('mw_misiones_ocultas', misionesOcultas() ? '0' : '1'); } catch (e) { misionesPlegadas = !misionesPlegadas; } pintarMisiones(); }
    else if (ev.target.closest('[data-ver-misiones]')) abrirMisiones();
  });
  $('btn-portal').addEventListener('click', volverAlPortal);
  async function volverAlPortal() {
    const b = $('btn-portal'); b.disabled = true;
    guardar(true); await subir();
    location.href = 'docente.html';
  }
  $('capa').addEventListener('click', (e) => { if (e.target === $('capa') && !$('modal').classList.contains('combate') && !$('modal').classList.contains('bloqueo')) ui.cerrar(); });

  const palanca = { x: 0, y: 0 };
  (() => {
    const base = $('palanca'), perilla = base.querySelector('i');
    let id = null;
    const mover = (e) => {
      const r = base.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const len = Math.hypot(dx, dy), max = 45;
      if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
      perilla.style.transform = `translate(${dx}px, ${dy}px)`;
      palanca.x = dx / max; palanca.y = dy / max;
    };
    base.addEventListener('pointerdown', (e) => { id = e.pointerId; base.setPointerCapture(id); mover(e); });
    base.addEventListener('pointermove', (e) => { if (e.pointerId === id) mover(e); });
    const soltar = () => { id = null; palanca.x = palanca.y = 0; perilla.style.transform = ''; };
    base.addEventListener('pointerup', soltar);
    base.addEventListener('pointercancel', soltar);
    $('btn-accion').addEventListener('pointerdown', (e) => { e.preventDefault(); if (escena && !ui.abierto) escena.interactuar(); });
  })();

  // ===================================================================
  // Desafíos en vivo: los lanza el docente desde su portal. El juego consulta cada pocos
  // segundos el desafío de su curso; todos ven un contador de 10 s sincronizado con el servidor.
  // ===================================================================
  const DES = Object.fromEntries((window.DESAFIOS || []).map((d) => [d.id, d]));
  const vivo = { d: null, def: null, fase: null, st: {}, dif: 0, ultima: 0, consultando: false, pendienteModal: false, modal: false, premiando: false, resultado: '', hasta: 0, resultadoModal: null };
  const ahoraSrv = () => Date.now() + vivo.dif;
  const porServidor = (D) => D && (D.id === 'arena' || D.id === 'curso');   // resultado calculado por el servidor
  const desActivo = (id) => Boolean(vivo.def && vivo.fase === 'activo' && vivo.def.id === id);
  const unidadDesafio = () => (escena && MUNDOS[escena.zona] ? escena.zona : ['u4', 'u3', 'u2', 'u1'].find((u) => (u === 'u1' || (sesion.mundos || []).includes(u)) && MUNDOS[u]) || 'u1');
  const cobrado = (n) => (S.desafios || []).includes(n);
  const marcarCobrado = (n) => { S.desafios = [...(S.desafios || []).slice(-30), n]; };
  const plural = (n, p) => `${n} ${n === 1 ? p : p + 's'}`;
  const reloj = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  // Premio en recursos del mundo actual (o de todos los mundos abiertos)
  function paquete(cant, variedad = 2, todos = false) {
    const us = todos ? ['u1', 'u2', 'u3', 'u4'].filter((u) => u === 'u1' || (sesion.mundos || []).includes(u)) : [unidadDesafio()];
    const pool = [];
    for (const u of us) recursosDe(u).forEach((r, i) => { for (let k = 0; k < 4 - i; k++) pool.push([r.id, i]); });
    const out = {};
    for (let v = 0; v < variedad; v++) {
      const [id, i] = pool[Math.floor(Math.random() * pool.length)];
      out[id] = (out[id] || 0) + Math.max(1, Math.round(cant * (4 - i) / 4));
    }
    return out;
  }
  function darPremio(rec, xp = 0, final = true) {
    vivo.premiando = true;
    if (enCasa()) sumarCofre(rec); else Object.entries(rec).forEach(([r, n]) => sumar(r, n));
    vivo.premiando = false;
    if (xp) ganarXP(xp);
    guardar(final);
    return Object.entries(rec).map(([r, n]) => `${n} ${nombreRec(r)}`).join(', ');
  }
  function lograr(texto, rec, xp) {
    vivo.st.logrado = true;
    const txt = darPremio(rec, xp);
    toast(`¡${texto}! Ganas ${txt} y ${xp} de experiencia.`);
    if (escena && escena.jugador) { escena.celebrar(); escena.limpiarDesafio(); }
  }

  // Cada desafío: estado inicial, texto de progreso, montar (en la escena actual), tick, evento y cierre
  const IMPL = {
    // La horda no tiene límite: llegan enemigos nuevos sin parar hasta que se acaba el tiempo
    horda: {
      estado: () => ({ n: 0 }),
      progreso: (st) => `Vencidos: ${st.n} · ¡siguen llegando enemigos!`,
      montar: (sc) => { sc.soltarHorda(5); sc.des.hordaT = 7000; },
      tick(sc, dt) {
        sc.des.hordaT -= dt;
        if (sc.des.hordaT > 0) return;
        const vivos = sc.enemigos.filter((x) => x.horda && x.activo).length;
        sc.des.hordaT = vivos < 4 ? 4000 : 7000;
        if (vivos < 16) sc.soltarHorda(vivos < 4 ? 4 : 3, true);
      },
      evento(tipo, e, st) { if (tipo === 'vencer' && e.horda) st.n += 1; },
      fin(st) {
        if (!st.n) return 'La horda se retiró. Esta vez no venciste enemigos.';
        const xp = Math.min(200, 8 * st.n), txt = darPremio(paquete(Math.min(12, 2 + Math.ceil(st.n / 2)), 3), xp);
        return `¡La horda se retiró! Venciste a ${st.n} ${st.n === 1 ? 'enemigo' : 'enemigos'}: ganas ${txt} y ${xp} de experiencia.`;
      },
    },
    dorado: {
      estado: () => ({}),
      progreso: (st) => (st.logrado ? '¡Atrapaste a la criatura dorada!' : 'Atrápala: ¡huye de ti!'),
      montar: (sc) => sc.soltarDorada(),
      // Flecha dorada que indica hacia dónde escapó la criatura
      tick(sc) {
        const e = sc.enemigos.find((x) => x.dorada && x.activo), j = sc.jugador;
        if (!sc.des.flecha) { sc.des.flecha = sc.add.triangle(0, 0, 0, -9, 18, 0, 0, 9, 0xffd54a).setStrokeStyle(2, 0x5a3d00).setDepth(99998); sc.des.objs.push(sc.des.flecha); }
        const lejos = e && Phaser.Math.Distance.Between(j.x, j.y, e.s.x, e.s.y) > 150;
        sc.des.flecha.setVisible(Boolean(lejos));
        if (lejos) { const a = Phaser.Math.Angle.Between(j.x, j.y - 20, e.s.x, e.s.y - 10); sc.des.flecha.setPosition(j.x + Math.cos(a) * 46, j.y - 20 + Math.sin(a) * 46).setRotation(a); }
      },
      evento(tipo, e, st) { if (tipo === 'vencer' && e.dorada && !st.logrado) { st.logrado = true; toast('¡Atrapaste a la criatura dorada!'); escena.celebrar(); escena.limpiarDesafio(); } },
      fin: (st) => (st.logrado ? 'Atrapaste a la criatura dorada.' : 'La criatura dorada escapó.'),
    },
    meteoritos: {
      estado: () => ({ frag: 0, golpes: 0 }),
      progreso: (st) => `Fragmentos: ${st.frag} · Golpes: ${st.golpes}`,
      montar: (sc) => { sc.des.meteoT = 800; },
      tick(sc, dt, st) {
        sc.des.meteoT -= dt;
        if (sc.des.meteoT <= 0) { sc.des.meteoT = 520 + Math.random() * 380; sc.lanzarMeteorito(); }
        sc.recoger('frag', (o) => { st.frag += 1; sc.flotante(o.x, o.y - 30, '+1 fragmento', '#ffc27a'); });
      },
      fin(st) {
        if (!st.frag) return 'Terminó la lluvia. No recogiste fragmentos.';
        const txt = darPremio(paquete(Math.max(1, Math.ceil(st.frag / 2)), 2), 4 * st.frag);
        return `Terminó la lluvia: ${st.frag} fragmentos = ${txt}.`;
      },
    },
    cofres: {
      estado: () => ({ n: 0, meta: 6 }),
      progreso: (st) => (st.logrado ? '¡Abriste todos los cofres!' : `Cofres abiertos: ${st.n} de ${st.meta}`),
      montar(sc, st) { for (let i = 0; i < st.meta - st.n; i++) sc.time.delayedCall(250 + i * 380, () => sc.caerCofre()); },
      tick(sc, dt, st) {
        sc.recoger('cofre', (o) => {
          st.n += 1;
          const rec = paquete(2, 1), txt = darPremio(rec, 8, false);
          sc.flotante(o.x, o.y - 44, `+${txt}`, '#ffd27a');
          sc.add.particles(o.x, o.y - 16, 'p_brillo', { speed: { min: 60, max: 160 }, lifespan: 600, scale: { start: 1.5, end: 0 }, emitting: false }).setDepth(99999).explode(20);
          if (st.n >= st.meta) lograr('Abriste todos los cofres', paquete(3, 2), 30);
        });
      },
      fin: (st) => (st.logrado ? 'Abriste todos los cofres.' : `Se acabó el tiempo: abriste ${st.n} de ${st.meta} cofres.`),
    },
    eclipse: {
      estado: () => ({ n: 0, meta: 8 }),
      progreso: (st) => `Luciérnagas atrapadas: ${st.n}${st.n < st.meta ? ` · bono al llegar a ${st.meta}` : ' · ¡sigue atrapando!'}`,
      montar(sc) { sc.crearEclipse(); for (let i = 0; i < 8; i++) sc.soltarLuciernaga(); },
      tick(sc, dt, st) {
        if (sc.des.oscuro) sc.des.oscuro.setPosition(sc.jugador.x, sc.jugador.y - 16);
        sc.recoger('luz', (o) => {
          st.n += 1;
          vivo.premiando = true; sumarCofre({ luciernaga: 1 }); vivo.premiando = false;   // al cofre: no se pierden
          sc.flotante(o.x, o.y - 24, '+1 luciérnaga', '#fff3a0');
          sc.soltarLuciernaga();   // siempre aparece otra
          if (st.n === st.meta) { const txt = darPremio(paquete(5, 3), 50); toast(`¡${st.meta} luciérnagas! Bono: ${txt} y 50 de experiencia.`); sc.celebrar(); }
        });
      },
      fin: (st) => (st.n ? `Volvió la luz: atrapaste ${st.n} ${st.n === 1 ? 'luciérnaga' : 'luciérnagas'} (están en tu cofre). Úsalas para fabricar adornos y muebles que brillan.` : 'Volvió la luz y no atrapaste luciérnagas.'),
    },
    recolecta: {
      estado: () => ({ n: 0, meta: 12 }),
      progreso: (st) => (st.logrado ? '¡Meta de recolección cumplida!' : `Recursos: ${Math.min(st.n, st.meta)} de ${st.meta}`),
      evento(tipo, n, st) {
        if (tipo !== 'recurso' || st.logrado) return;
        st.n += n;
        if (st.n >= st.meta) lograr('Cumpliste la recolección exprés', paquete(5, 2), 40);
      },
      fin: (st) => (st.logrado ? 'Cumpliste la recolección exprés.' : `Se acabó el tiempo: juntaste ${st.n} de ${st.meta} recursos.`),
    },
    fiebre: { estado: () => ({}), progreso: () => 'Todo lo que recolectes vale el doble', fin: () => 'Terminó la fiebre del oro.' },
    turbo: {
      estado: () => ({}),
      progreso: () => 'Corres mucho más rápido',
      montar(sc) {
        sc.des.polvo = sc.add.particles(0, 0, 'p_nieve', { lifespan: 380, frequency: 40, speedX: { min: -30, max: 30 }, speedY: { min: -20, max: 0 }, scale: { start: 1.3, end: 0 }, alpha: { start: 0.7, end: 0 }, emitting: false }).setDepth(5).startFollow(sc.jugador, 0, -4);
        sc.des.objs.push(sc.des.polvo);
      },
      tick(sc) { if (sc.des.polvo) sc.des.polvo.emitting = sc.jugador.body.speed > 20; },
      fin: () => 'Se acabaron las botas de viento.',
    },
    escudo: {
      estado: () => ({ bloqueos: 0 }),
      progreso: (st) => `Los errores no te quitan corazones${st.bloqueos ? ` · Bloqueados: ${st.bloqueos}` : ''}`,
      montar(sc) {
        sc.des.burbuja = sc.add.image(0, 0, 'luz').setScale(0.42).setTint(0x7fe8ff).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.55);
        sc.tweens.add({ targets: sc.des.burbuja, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
        sc.des.objs.push(sc.des.burbuja);
      },
      tick(sc) { if (sc.des.burbuja) sc.des.burbuja.setPosition(sc.jugador.x, sc.jugador.y - 24).setDepth(sc.jugador.depth + 1); },
      fin: (st) => `Se apagó el escudo de cristal${st.bloqueos ? `: bloqueó ${st.bloqueos} ${st.bloqueos === 1 ? 'golpe' : 'golpes'}` : ''}.`,
    },
    relampago: {
      estado: () => ({}),
      progreso: (st) => (st.respondida ? (st.logrado ? '¡Correcto!' : 'Respondida') : '¡Responde rápido!'),
      fin: (st) => (st.respondida ? (st.logrado ? `Acertaste la pregunta relámpago: ${st.premio}.` : 'Esta vez no fue. ¡A la próxima!') : 'Se acabó el tiempo de la pregunta relámpago.'),
    },
    prisma: {
      estado: () => ({ p: 0, otros: {} }),
      progreso(st) {
        const z = vivo.d.mundo;
        if (st.gane) return '¡El prisma es tuyo! Está en tu cofre.';
        if (st.tomado) return `${st.tomado} se llevó el prisma de tu grupo.`;
        if (!escena || escena.zona !== z) return `Está en ${MUNDOS[z] ? nombreZona(z) : 'otro mundo'}: ¡viaja por el portal!`;
        return `¡Búscalo! Tu avance: ${st.p} de 5 respuestas`;
      },
      montar(sc, st) { if (sc.zona === vivo.d.mundo && !st.gane && !st.tomado) sc.soltarPrisma(); },
      tick(sc, dt, st) {
        const it = sc.des.prisma, j = sc.jugador;
        if (!it) return;
        if (!sc.des.flecha) { sc.des.flecha = sc.add.triangle(0, 0, 0, -9, 18, 0, 0, 9, 0xd7a8ff).setStrokeStyle(2, 0x3a1a5a).setDepth(99998); sc.des.objs.push(sc.des.flecha); }
        const lejos = Phaser.Math.Distance.Between(j.x, j.y, it.x, it.y) > 170;
        sc.des.flecha.setVisible(lejos);
        if (lejos) { const a = Phaser.Math.Angle.Between(j.x, j.y - 20, it.x, it.y - 10); sc.des.flecha.setPosition(j.x + Math.cos(a) * 46, j.y - 20 + Math.sin(a) * 46).setRotation(a); }
      },
      fin: (st) => (st.gane ? '¡Te llevaste el prisma estelar! Está guardado en tu cofre.' : st.tomado ? `${st.tomado} se llevó el prisma estelar de tu grupo.` : 'El prisma estelar desapareció.'),
    },
    arena: { estado: () => ({ mios: 0 }), progreso: () => `Tus aciertos: ${vivo.d.aciertos || 0}` },
    curso: { estado: () => ({ mios: 0 }), progreso: () => `Curso: ${vivo.d.total || 0} de ${vivo.d.meta} correctas` },
  };
  const escudoActivo = () => desActivo('escudo');
  function eventoDesafio(tipo, dato) {
    if (vivo.fase !== 'activo') return;
    const I = IMPL[vivo.def.id];
    if (I.evento) I.evento(tipo, dato, vivo.st);
  }

  async function consultarDesafio() {
    if (sesion.modo !== 'nube' || !S || juegoCerrado || vivo.consultando || !escena) return;
    vivo.consultando = true; vivo.ultima = Date.now();
    try { const r = await Nube.desafio(sesion.token); if (r && r.ok) recibirDesafio(r); } catch (e) { /* sin red: se reintenta */ }
    vivo.consultando = false; vivo.ultima = Date.now();
  }
  function recibirDesafio(r) {
    if (!r || !r.ok || !r.ahora) return;
    vivo.dif = r.ahora - Date.now();
    const d = r.desafio || null;
    if (!d || !DES[d.id]) { if (vivo.d && (vivo.fase === 'espera' || vivo.fase === 'activo')) cerrarDesafio('El desafío terminó.'); return; }
    if (!vivo.d || vivo.d.n !== d.n) {
      if (vivo.d && (vivo.fase === 'espera' || vivo.fase === 'activo')) cerrarDesafio(null);
      vivo.d = d; vivo.def = DES[d.id]; vivo.st = {}; vivo.resultado = ''; vivo.resultadoModal = null; vivo.pendienteModal = false;
      if (ahoraSrv() >= d.fin) { vivo.fase = porServidor(vivo.def) && d.aciertos > 0 && !cobrado(d.n) ? 'fin' : 'cerrado'; vivo.hasta = 0; }
      else vivo.fase = 'espera';
    } else Object.assign(vivo.d, d);
    if (porServidor(vivo.def)) pintarTablaDesafio();
    if (vivo.fase === 'fin' && porServidor(vivo.def)) resultadoPreguntas();
  }
  function iniciarDesafio() {
    vivo.fase = 'activo';
    const I = IMPL[vivo.def.id];
    vivo.st = I.estado ? I.estado() : {};
    sfx('inicio');
    if (vivo.def.id === 'prisma') {
      const z = vivo.d.mundo;
      avisoGrande('¡Apareció un recurso exclusivo!', `Prisma estelar en ${MUNDOS[z] ? nombreZona(z) : 'un mundo'}`, 'Dura 2 minutos · Responde bien 5 preguntas para llevártelo', 'prisma');
      if (escena && escena.jugador) escena.cameras.main.flash(500, 200, 160, 255);
    } else toast(`¡Comienza el desafío: ${vivo.def.nombre}!`);
    if (escena && escena.jugador) montarDesafio(escena);
    if (vivo.def.preguntas) vivo.pendienteModal = true;
  }
  function montarDesafio(sc) {
    if (vivo.fase !== 'activo' || vivo.st.logrado) return;
    const I = IMPL[vivo.def.id];
    if (I.montar) I.montar(sc, vivo.st);
  }
  function actualizarDesafio(sc, dt) {
    const I = IMPL[vivo.def.id];
    if (I.tick && !vivo.st.logrado) I.tick(sc, dt, vivo.st);
  }
  // Fin por tiempo (o porque el docente lo detuvo)
  function terminarDesafio() {
    const I = IMPL[vivo.def.id];
    if (escena && escena.jugador) escena.limpiarDesafio();
    if (vivo.def.id === 'prisma' && !vivo.st.reclamando && vivo.modal && ui.abierto && $('modal').classList.contains('prisma')) ui.cerrar();
    if (vivo.def.id === 'relampago' && !vivo.st.respondida && vivo.modal && ui.abierto && $('modal').classList.contains('desafio-vivo')) ui.cerrar();
    if (porServidor(vivo.def)) { vivo.fase = 'fin'; vivo.pendienteModal = false; pintarModalFin(); consultarDesafio(); return; }
    const txt = I.fin ? I.fin(vivo.st) : 'Terminó el desafío.';
    cerrarDesafio(vivo.d.detenido ? `Tu profesor detuvo el desafío. ${txt}` : txt);
  }
  function cerrarDesafio(texto) {
    if (escena && escena.jugador) escena.limpiarDesafio();
    if (vivo.modal && ui.abierto && $('modal').classList.contains('desafio-vivo') && !texto) ui.cerrar();
    vivo.fase = 'cerrado'; vivo.pendienteModal = false;
    vivo.resultado = texto || ''; vivo.hasta = texto ? Date.now() + 7000 : 0;
    if (texto) toast(texto);
  }
  // Resultado del duelo o de la meta del curso, calculado por el servidor
  function resultadoPreguntas() {
    const d = vivo.d;
    if (vivo.st.resuelto || ahoraSrv() < d.fin) return;
    if (d.id === 'arena' && d.gane === undefined) return;
    vivo.st.resuelto = true;
    let txt, gano = false;
    const top = (d.ranking || [])[0];
    if (d.id === 'arena') {
      if (d.gane && !cobrado(d.n)) {
        marcarCobrado(d.n); gano = true;
        txt = `¡Ganaste el duelo con ${plural(d.aciertos, 'acierto')}! Tu cofre de suministros trae ${darPremio(paquete(6, 4, true), 80)} y 80 de experiencia.`;
      } else if (d.gane) txt = '¡Ganaste el duelo! (El premio ya está en tu inventario.)';
      else if (d.ganador_nombre) txt = `Ganó ${d.ganador_nombre} con ${top ? plural(top.aciertos, 'acierto') : 'más aciertos'}. Tú lograste ${d.aciertos || 0}.`;
      else txt = 'Nadie acertó esta vez: el cofre queda para el próximo duelo.';
    } else {
      const logro = d.total >= d.meta;
      if (logro && d.aciertos > 0 && !cobrado(d.n)) {
        marcarCobrado(d.n); gano = true;
        txt = `¡El curso logró la meta (${d.total} de ${d.meta})! Tu premio: ${darPremio(paquete(4, 3, true), 50)} y 50 de experiencia.`;
      } else if (logro) txt = `¡El curso logró la meta (${d.total} de ${d.meta})!${d.aciertos > 0 ? '' : ' Para ganar premio hay que aportar al menos una respuesta correcta.'}`;
      else txt = `No alcanzaron la meta: ${d.total} de ${d.meta} respuestas correctas. ¡A la próxima!`;
    }
    vivo.fase = 'cerrado'; vivo.resultado = txt; vivo.hasta = Date.now() + 9000;
    sfx(gano ? 'logro' : 'mision');
    if (gano && escena && escena.jugador) escena.celebrar();
    guardar(true);
    if (vivo.modal && ui.abierto && $('modal').classList.contains('desafio-vivo')) pintarModalFin();
    else if (gano) vivo.resultadoModal = txt;
    else toast(txt);
  }

  // ---------- Modal del duelo y de la meta del curso ----------
  function tablaDesafioHTML() {
    const d = vivo.d;
    if (d.id === 'curso') {
      const pct = Math.min(100, Math.round(((d.total || 0) / Math.max(1, d.meta)) * 100));
      return `<span class="etq">Meta del curso</span><div class="des-meta"><b>${d.total || 0}</b> de ${d.meta}</div>
        <div class="barra meta" role="img" aria-label="Avance del curso: ${pct} %"><i style="width:${pct}%"></i></div>
        <span class="nota">Tú aportaste <b>${d.aciertos || 0}</b> · ${d.participantes || 0} participantes</span>`;
    }
    const filas = (d.ranking || []).map((r, i) => `<li class="${r.yo ? 'yo' : ''}"><span>${['🥇', '🥈', '🥉'][i] || i + 1 + '.'}</span><span>${esc(r.yo ? 'Tú' : r.nombre)}</span><b>${r.aciertos}</b></li>`).join('');
    return `<span class="etq">Ranking del curso</span><ol class="des-ranking">${filas || '<li class="vacio">Aún nadie acierta…</li>'}</ol><span class="nota">Tus aciertos: <b>${d.aciertos || 0}</b></span>`;
  }
  function pintarTablaDesafio() { const t = $('des-tabla'); if (t && vivo.d) t.innerHTML = tablaDesafioHTML(); }
  function abrirModalPreguntas() {
    vivo.pendienteModal = false;
    if (vivo.def.id === 'relampago') { abrirRelampago(); return; }
    vivo.modal = true;
    const D = vivo.def;
    let d = Preguntas.nuevo(S.curso, unidadDesafio(), D.id === 'arena' ? 2 : 1, S.stats), fb = '', espera = false;
    const pintar = () => {
      ui.abrir(`
        <div class="modal-cab"><div><span class="etq">Desafío de tu profesor · ${esc(d.titulo)}</span><h2 id="modal-titulo">${D.icono} ${esc(D.nombre)}</h2></div><div class="des-reloj" id="des-reloj">${reloj(vivo.d.fin - ahoraSrv())}</div></div>
        <div class="des-cols">
          <div class="des-preg">
            ${fb}
            <p class="enunciado">${mate(d.enunciado)}</p>
            ${alternativasHTML(d, null, new Set(), false)}
          </div>
          <aside class="des-tabla" id="des-tabla">${tablaDesafioHTML()}</aside>
        </div>
        <div class="acciones"><span class="nota">${D.id === 'arena' ? 'Toca la alternativa correcta: ¡gana quien más acierte en el curso!' : 'Cada respuesta correcta suma para todo el curso.'}</span><button type="button" class="btn" id="dv-salir">Salir del desafío</button></div>`, 'desafio-vivo', () => { vivo.modal = false; });
      document.querySelectorAll('.alt').forEach((b) => b.addEventListener('click', () => responder(Number(b.dataset.i))));
      $('dv-salir').addEventListener('click', () => ui.cerrar());
      ui.teclas = (e) => { if (/^[1-4]$/.test(e.key)) responder(Number(e.key) - 1); };
    };
    const responder = (i) => {
      if (espera || vivo.fase !== 'activo' || i >= d.opciones.length) return;
      const ok = i === d.correcta;
      registrar(d.tema, ok);
      if (ok) { ganarXP(3); vivo.d.aciertos = (vivo.d.aciertos || 0) + 1; if (D.id === 'curso') vivo.d.total = (vivo.d.total || 0) + 1; }
      Nube.desafioResponder(sesion.token, vivo.d.n, ok).then(recibirDesafio).catch(() => {});
      fb = ok ? '<div class="mensaje bien" role="status">¡Correcto! +1</div>' : `<div class="mensaje mal" role="status">La respuesta era ${mate(d.opciones[d.correcta])}.</div>`;
      d = Preguntas.nuevo(S.curso, unidadDesafio(), D.id === 'arena' ? 2 : 1, S.stats);
      if (ok) pintar();
      else { espera = true; pintar(); document.querySelectorAll('.alt').forEach((b) => { b.disabled = true; }); setTimeout(() => { espera = false; if (vivo.modal && vivo.fase === 'activo') { document.querySelectorAll('.alt').forEach((b) => { b.disabled = false; }); } }, 1200); }
    };
    pintar();
  }
  function pintarModalFin() {
    if (!vivo.modal || !ui.abierto || !$('modal').classList.contains('desafio-vivo')) return;
    const D = vivo.def;
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">Desafío de tu profesor</span><h2 id="modal-titulo">${D.icono} ${esc(D.nombre)}</h2></div><div class="des-reloj">0:00</div></div>
      <div class="des-cols">
        <div class="des-preg">${vivo.resultado ? `<div class="mensaje ${/^¡(Ganaste|El curso logró)/.test(vivo.resultado) ? 'bien' : ''}" role="status" style="font-size:18px">${esc(vivo.resultado)}</div>` : '<p class="enunciado">¡Se acabó el tiempo! Calculando el resultado del curso…</p>'}</div>
        <aside class="des-tabla" id="des-tabla">${tablaDesafioHTML()}</aside>
      </div>
      <div class="acciones"><span></span><button type="button" class="btn pri" id="dv-ok" data-foco>${vivo.resultado ? '¡Seguir jugando!' : 'Cerrar'}</button></div>`, 'desafio-vivo', () => { vivo.modal = false; });
    $('dv-ok').addEventListener('click', () => ui.cerrar());
  }
  function abrirRelampago() {
    const st = vivo.st;
    if (st.respondida) return;
    vivo.modal = true;
    const d = Preguntas.nuevo(S.curso, unidadDesafio(), 2, S.stats);
    ui.abrir(`
      <div class="modal-cab"><div><span class="etq">Desafío de tu profesor · ${esc(d.titulo)}</span><h2 id="modal-titulo">⚡ Pregunta relámpago</h2></div><div class="des-reloj" id="des-reloj">${reloj(vivo.d.fin - ahoraSrv())}</div></div>
      <p class="nota">Tienes una sola oportunidad: mientras más rápido aciertes, mayor es el premio.</p>
      <p class="enunciado">${mate(d.enunciado)}</p>
      ${alternativasHTML(d, null, new Set(), false)}
      <div class="acciones"><span></span><button type="button" class="btn" id="dv-salir">Salir</button></div>`, 'desafio-vivo', () => { vivo.modal = false; });
    const responder = (i) => {
      if (st.respondida || vivo.fase !== 'activo' || i >= d.opciones.length) return;
      st.respondida = true;
      const ok = i === d.correcta;
      registrar(d.tema, ok);
      let msg;
      if (ok) {
        st.logrado = true;
        const frac = Math.max(0.15, Math.min(1, (vivo.d.fin - ahoraSrv()) / (vivo.def.seg * 1000)));
        const xp = 15 + Math.round(35 * frac);
        st.premio = darPremio(paquete(2 + Math.round(4 * frac), 2), xp);
        msg = `<div class="mensaje bien" role="status">¡Correcto y rápido! Ganas ${esc(st.premio)} y ${xp} de experiencia. ${mate(d.explicacion)}</div>`;
        if (escena) escena.celebrar();
      } else msg = `<div class="mensaje mal" role="status">No era esa. La respuesta correcta es ${mate(d.opciones[d.correcta])}. ${mate(d.explicacion)}</div>`;
      document.querySelectorAll('.alt').forEach((b, k) => { b.disabled = true; if (k === d.correcta) b.classList.add('bien'); else if (k === i) b.classList.add('mal'); });
      const acc = document.querySelector('#modal .acciones');
      acc.insertAdjacentHTML('beforebegin', msg);
      acc.innerHTML = '<span></span><button type="button" class="btn pri" id="dv-ok" data-foco>¡Seguir!</button>';
      $('dv-ok').addEventListener('click', () => ui.cerrar());
      $('dv-ok').focus();
      ui.teclas = (e) => { if (e.key === 'Enter') { e.preventDefault(); ui.cerrar(); } };
    };
    document.querySelectorAll('.alt').forEach((b) => b.addEventListener('click', () => responder(Number(b.dataset.i))));
    $('dv-salir').addEventListener('click', () => ui.cerrar());
    ui.teclas = (e) => { if (/^[1-4]$/.test(e.key)) responder(Number(e.key) - 1); };
  }

  // ---------- Prisma estelar: el primero del grupo en responder bien 5 preguntas se lo lleva ----------
  const PRISMA_META = 5;
  const grupoPrisma = () => (S.grupo && escena && escena.canal ? `${escena.zona}-g${S.grupo}` : `solo-${idJuego}`);
  function tablaPrismaHTML() {
    const st = vivo.st, otros = Object.values(st.otros || {}).sort((a, b) => b.p - a.p);
    const pct = Math.round((st.p / PRISMA_META) * 100);
    return `<span class="etq">Tu avance</span><div class="des-meta"><b>${st.p}</b> de ${PRISMA_META}</div>
      <div class="barra meta" role="img" aria-label="Llevas ${st.p} de ${PRISMA_META}"><i style="width:${pct}%"></i></div>
      ${otros.length ? `<span class="etq">Tu grupo</span><ol class="des-ranking">${otros.map((o) => `<li><span>⚔️</span><span>${esc(o.nombre)}</span><b>${o.p}/${PRISMA_META}</b></li>`).join('')}</ol>` : '<span class="nota">Nadie más de tu grupo lo está intentando… ¡por ahora!</span>'}`;
  }
  function abrirPrisma() {
    const st = vivo.st;
    if (!desActivo('prisma') || st.gane || st.tomado || st.reclamando) return;
    if (sesion.modo !== 'nube') return toast('El prisma estelar solo se puede tomar con tu cuenta del curso.', 'alerta');
    vivo.modal = true;
    const u = unidadDesafio();
    let d = Preguntas.nuevo(S.curso, u, 2, S.stats), fb = '', espera = false;
    const pintar = () => {
      ui.abrir(`
        <div class="modal-cab"><div><span class="etq">Recurso exclusivo · ${esc(d.titulo)}</span><h2 id="modal-titulo">🌈 Prisma estelar</h2></div><div class="des-reloj" id="des-reloj">${reloj(vivo.d.fin - ahoraSrv())}</div></div>
        <div class="des-cols">
          <div class="des-preg">${fb}<p class="enunciado">${mate(d.enunciado)}</p>${alternativasHTML(d, null, new Set(), false)}</div>
          <aside class="des-tabla" id="prisma-tabla">${tablaPrismaHTML()}</aside>
        </div>
        <div class="acciones"><span class="nota">Responde bien ${PRISMA_META} preguntas antes que tus compañeros de grupo para llevártelo.</span><button type="button" class="btn" id="dv-salir">Salir</button></div>`, 'desafio-vivo prisma', () => { vivo.modal = false; });
      document.querySelectorAll('.alt').forEach((b) => b.addEventListener('click', () => responder(Number(b.dataset.i))));
      $('dv-salir').addEventListener('click', () => ui.cerrar());
      ui.teclas = (e) => { if (/^[1-4]$/.test(e.key)) responder(Number(e.key) - 1); };
    };
    const responder = (i) => {
      if (espera || !desActivo('prisma') || st.gane || st.tomado || st.reclamando || i >= d.opciones.length) return;
      const ok = i === d.correcta;
      registrar(d.tema, ok);
      if (ok) {
        st.p += 1; ganarXP(4);
        if (escena && escena.canal) escena.canal.emitir('prisma_prog', { n: vivo.d.n, id: idJuego, nombre: S.nombre, p: st.p });
        if (st.p >= PRISMA_META) { reclamarPrisma(); return; }
        fb = `<div class="mensaje bien" role="status">¡Correcto! Llevas ${st.p} de ${PRISMA_META}.</div>`;
      } else fb = `<div class="mensaje mal" role="status">No era esa: la respuesta era ${mate(d.opciones[d.correcta])}. ${mate(d.explicacion)}</div>`;
      d = Preguntas.nuevo(S.curso, u, 2, S.stats);
      pintar();
      if (!ok) { espera = true; document.querySelectorAll('.alt').forEach((b) => { b.disabled = true; }); setTimeout(() => { espera = false; document.querySelectorAll('#modal .alt').forEach((b) => { b.disabled = false; }); }, 1500); }
    };
    pintar();
  }
  async function reclamarPrisma() {
    const st = vivo.st, n = vivo.d.n;
    st.reclamando = true;
    ui.abrir(`<div class="modal-cab"><div><span class="etq">Recurso exclusivo</span><h2 id="modal-titulo">🌈 Prisma estelar</h2></div></div><p class="enunciado">¡${PRISMA_META} de ${PRISMA_META}! Tomando el prisma…</p>`, 'desafio-vivo prisma', () => { vivo.modal = false; });
    let r = null;
    try { r = await Nube.prismaReclamar(sesion.token, n, grupoPrisma()); } catch (e) { r = null; }
    st.reclamando = false;
    sfx(r && r.ok ? 'logro' : 'error');
    let html;
    if (r && r.ok) {
      st.gane = true;
      sumarCofre({ prisma: 1 }); ganarXP(60); guardar(true);
      if (escena && escena.canal) escena.canal.emitir('prisma_fin', { n, id: idJuego, nombre: S.nombre });
      if (escena && escena.jugador) { escena.celebrar(); escena.limpiarDesafio(); }
      avisoGrande('¡Es tuyo!', 'Conseguiste el Prisma estelar', 'Se guardó en tu cofre', 'prisma');
      html = `<div class="mensaje bien" role="status" style="font-size:18px">¡Te llevaste el Prisma estelar! Se guardó en tu cofre (no se pierde aunque caigas en combate) y ganaste 60 de experiencia. Úsalo en la fogata de tu base para fabricar la espada y la armadura prismáticas, y adornos y muebles exclusivos (pestaña «Prismáticos»).</div>`;
    } else if (r && r.nombre) {
      st.tomado = r.nombre;
      if (escena && escena.jugador) escena.limpiarDesafio();
      html = `<div class="mensaje mal" role="status" style="font-size:18px">¡Casi! ${esc(r.nombre)} se llevó el prisma de tu grupo justo antes que tú.</div>`;
    } else html = '<div class="mensaje mal" role="status" style="font-size:18px">Se acabó el tiempo o no hubo conexión: el prisma desapareció.</div>';
    ui.abrir(`<div class="modal-cab"><div><span class="etq">Recurso exclusivo</span><h2 id="modal-titulo">🌈 Prisma estelar</h2></div></div>${html}
      <div class="acciones"><span></span><button type="button" class="btn pri" id="dv-ok" data-foco>¡Seguir!</button></div>`, 'desafio-vivo prisma', () => { vivo.modal = false; });
    $('dv-ok').addEventListener('click', () => ui.cerrar());
  }
  function recibirPrismaProg(d) {
    if (!d || !vivo.d || d.n !== vivo.d.n || vivo.def.id !== 'prisma') return;
    vivo.st.otros = vivo.st.otros || {};
    vivo.st.otros[d.id] = { nombre: String(d.nombre || 'Compañero').slice(0, 24), p: Number(d.p) || 0 };
    const t = $('prisma-tabla'); if (t) t.innerHTML = tablaPrismaHTML();
  }
  function recibirPrismaFin(d) {
    if (!d || !vivo.d || d.n !== vivo.d.n || vivo.def.id !== 'prisma' || vivo.st.gane || vivo.st.reclamando) return;
    vivo.st.tomado = String(d.nombre || 'Un compañero').slice(0, 24);
    if (escena && escena.jugador) escena.limpiarDesafio();
    toast(`${vivo.st.tomado} se llevó el prisma estelar de tu grupo.`);
    if (vivo.modal && ui.abierto && $('modal').classList.contains('prisma')) {
      ui.abrir(`<div class="modal-cab"><div><span class="etq">Recurso exclusivo</span><h2 id="modal-titulo">🌈 Prisma estelar</h2></div></div>
        <div class="mensaje mal" role="status" style="font-size:18px">${esc(vivo.st.tomado)} respondió primero sus ${PRISMA_META} preguntas y se llevó el prisma de tu grupo.</div>
        <div class="acciones"><span></span><button type="button" class="btn pri" id="dv-ok" data-foco>Entendido</button></div>`, 'desafio-vivo prisma', () => { vivo.modal = false; });
      $('dv-ok').addEventListener('click', () => ui.cerrar());
    }
  }

  // ---------- Aviso en pantalla (contador y avance) ----------
  function pintarBanner() {
    const b = $('desafio'), cuenta = $('desafio-cuenta');
    const t = ahoraSrv();
    const mostrar = vivo.d && (vivo.fase === 'espera' || vivo.fase === 'activo' || vivo.fase === 'fin' || (vivo.fase === 'cerrado' && Date.now() < vivo.hasta));
    if (!mostrar || $('hud').classList.contains('oculto')) { b.classList.add('oculto'); cuenta.classList.add('oculto'); return; }
    const D = vivo.def;
    b.classList.remove('oculto');
    b.style.setProperty('--c', D.color || '#f2b544');
    b.querySelector('.ico').textContent = D.icono;
    b.querySelector('.nom').textContent = vivo.fase === 'espera' ? `¡Desafío! ${D.nombre}` : D.nombre;
    let det, rel = '', pct = 0;
    if (vivo.fase === 'espera') { det = D.resumen; rel = `${Math.min(10, Math.ceil((vivo.d.inicio - t) / 1000))}`; }
    else if (vivo.fase === 'activo') {
      det = IMPL[D.id].progreso(vivo.st);
      rel = reloj(vivo.d.fin - t);
      pct = Math.max(0, Math.min(100, ((vivo.d.fin - t) / (vivo.d.fin - vivo.d.inicio)) * 100));
    } else if (vivo.fase === 'fin') { det = 'Calculando el resultado…'; }
    else det = vivo.resultado;
    b.querySelector('.det').textContent = det;
    b.querySelector('.reloj').textContent = rel;
    b.querySelector('.bar i').style.width = `${pct}%`;
    b.classList.toggle('espera', vivo.fase === 'espera');
    b.classList.toggle('cerrado', vivo.fase === 'cerrado' || vivo.fase === 'fin');
    const entrar = D.preguntas && vivo.fase === 'activo' && !vivo.modal && !(D.id === 'relampago' && vivo.st.respondida);
    b.querySelector('.btn-des').classList.toggle('oculto', !entrar);
    // Contador grande de 10 segundos
    const seg = vivo.fase === 'espera' ? Math.min(10, Math.ceil((vivo.d.inicio - t) / 1000)) : 0;
    if (seg > 0) {
      cuenta.classList.remove('oculto');
      if (cuenta.dataset.n !== String(seg)) {
        cuenta.dataset.n = String(seg); sfx('tick');
        cuenta.querySelector('b').textContent = seg;
        cuenta.querySelector('small').textContent = `${D.icono} ${D.nombre}`;
        cuenta.classList.remove('late'); void cuenta.offsetWidth; cuenta.classList.add('late');
      }
    } else { cuenta.classList.add('oculto'); cuenta.dataset.n = ''; }
  }
  $('desafio').querySelector('.btn-des').addEventListener('click', () => { if (vivo.fase === 'activo' && vivo.def.preguntas && !ui.abierto) abrirModalPreguntas(); });
  setInterval(() => {
    if (!S || !escena) return;
    const t = Date.now();
    const rapido = vivo.d && (vivo.fase === 'espera' || vivo.fase === 'fin' || (vivo.fase === 'activo' && porServidor(vivo.def)));
    if (!document.hidden && t - vivo.ultima > (rapido ? 2000 : 4000)) consultarDesafio();
    if (vivo.d) {
      const ts = ahoraSrv();
      if (vivo.fase === 'espera' && ts >= vivo.d.inicio) iniciarDesafio();
      if (vivo.fase === 'activo' && ts >= vivo.d.fin) terminarDesafio();
      if (vivo.fase === 'activo' && vivo.pendienteModal && !ui.abierto && escena.jugador && !escena.enCombate && !escena.enJefe) abrirModalPreguntas();
      if (vivo.resultadoModal && !ui.abierto && escena.jugador && !escena.enCombate && !escena.enJefe) {
        const txt = vivo.resultadoModal; vivo.resultadoModal = null;
        ui.abrir(`<div class="modal-cab"><div><span class="etq">Desafío de tu profesor</span><h2 id="modal-titulo">${vivo.def.icono} ${esc(vivo.def.nombre)}</h2></div></div>
          <div class="mensaje bien" role="status" style="font-size:18px">${esc(txt)}</div>
          <div class="acciones"><span></span><button type="button" class="btn pri" id="dv-ok" data-foco>¡Genial!</button></div>`);
        $('dv-ok').addEventListener('click', () => ui.cerrar());
      }
      const r = $('des-reloj');
      if (r && vivo.fase === 'activo') r.textContent = reloj(vivo.d.fin - ts);
    }
    pintarBanner();
  }, 250);

  // ---------- Música: cambia según el mundo, el combate con jefes y los desafíos ----------
  function pistaActual() {
    if (!escena || !escena.jugador || $('hud').classList.contains('oculto')) return null;
    const z = escena.zona;
    if (escena.enJefe || (escena.enCombate && ui.abierto && $('modal').classList.contains('rey'))) return 'jefe';
    if (ui.abierto && $('modal').classList.contains('laberinto')) return 'laberinto';
    if (ui.abierto && $('modal').classList.contains('carrera')) return 'carrera';
    if (vivo.fase === 'activo') return 'desafio';
    if (z === 'base') return 'base';
    if (z === 'pieza') return 'pieza';
    if (z === 'u1') return escena.rio && escena.jugador.x > (escena.rio.RX + RIO_ANCHO) * TILE ? 'profundo' : 'bosque';
    if (z === 'u3' && escena.prof && escena.jugador.y > escena.prof.yb * TILE) return 'abismo';
    if (z === 'u2' && escena.valle && escena.jugador.y < escena.valle.cy0 * TILE) return 'valle';
    return { u2: 'desierto', u3: 'mina', u4: 'glaciar' }[z] || 'bosque';
  }
  setInterval(() => { if (window.Sonido) Sonido.musica(pistaActual()); }, 700);
  // Botón y panel de sonido
  function pintarSonido() {
    if (!window.Sonido) return;
    const c = Sonido.cfg, b = $('btn-sonido');
    b.textContent = c.on ? (c.musica || c.efectos ? '🔊' : '🔈') : '🔇';
    b.setAttribute('aria-label', c.on ? 'Sonido activado: abrir ajustes de sonido' : 'Sonido silenciado: abrir ajustes de sonido');
    b.classList.toggle('apagado', !c.on);
    const p = $('panel-sonido');
    p.querySelector('[data-s="on"]').textContent = c.on ? '🔇 Silenciar todo' : '🔊 Activar sonido';
    p.querySelector('[data-s="musica"]').setAttribute('aria-checked', String(c.musica));
    p.querySelector('[data-s="efectos"]').setAttribute('aria-checked', String(c.efectos));
    p.querySelector('input').value = Math.round(c.vol * 100);
  }
  $('btn-sonido').addEventListener('click', (e) => { e.stopPropagation(); $('panel-sonido').classList.toggle('oculto'); pintarSonido(); });
  $('panel-sonido').addEventListener('click', (e) => {
    e.stopPropagation();
    const k = e.target.closest('[data-s]'); if (!k || !window.Sonido) return;
    const c = Sonido.cfg;
    if (k.dataset.s === 'on') Sonido.config({ on: !c.on });
    else if (k.dataset.s === 'musica') Sonido.config({ musica: !c.musica, on: true });
    else if (k.dataset.s === 'efectos') Sonido.config({ efectos: !c.efectos, on: true });
    pintarSonido(); sfx('clic');
  });
  $('panel-sonido').querySelector('input').addEventListener('input', (e) => { if (window.Sonido) Sonido.config({ vol: Number(e.target.value) / 100, on: true }); pintarSonido(); });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#panel-sonido') && !e.target.closest('#btn-sonido')) $('panel-sonido').classList.add('oculto');
    if (e.target.closest('#modal .btn, #modal .alt, .btn-hud')) sfx('clic');
  });
  pintarSonido();

  // ===================================================================
  // Escena (Phaser): base o mundo según la zona
  // ===================================================================
  const TILE = 32;
  let ultimaCarpa = null;
  let combateActual = null;
  const COLS = 57;
  const fr = (c, r) => r * COLS + c;
  const DIRS = { up: 0, left: 1, down: 2, right: 3 };
  // Tamaño de los mundos (en casillas): portal a la izquierda y caminos en cruz
  const MAPA_W = 72, MAPA_H = 50, CENTRO_X = 36, PORTAL_Y = 24;
  const RIO_ANCHO = 3, PROFUNDO_W = 26;
  const VALLE_OY = 24;   // el desierto (Unidad 2) tiene arriba, tras un acantilado, el Valle de la Esfinge   // el bosque (Unidad 1) tiene un río y, al otro lado, el Bosque profundo
  const PASTO = [fr(5, 0), fr(5, 1), fr(7, 0), fr(8, 0)];
  const CAMINO = fr(6, 0);

  function azar(semilla) {
    return () => {
      semilla |= 0; semilla = (semilla + 0x6d2b79f5) | 0;
      let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class Juego extends Phaser.Scene {
    constructor() { super('juego'); }
    init(data) { this.zona = (data && data.zona) || 'base'; this.desde = data && data.desde; this.carpa = data && data.carpa; }

    preload() {
      if (!this.textures.exists('kenney')) this.load.image('kenney', 'assets/kenney_roguelike.png');
      if (!this.textures.exists('kenney_in')) this.load.image('kenney_in', 'assets/kenney_indoor.png');
      if (!this.textures.exists('kenney_cueva')) this.load.image('kenney_cueva', 'assets/kenney_cueva.png');
      if (!this.textures.exists('kenney_nieve')) this.load.image('kenney_nieve', 'assets/kenney_nieve.png');
      if (!this.textures.exists('kenney_prisma')) this.load.image('kenney_prisma', 'assets/kenney_prisma.png');
      if (!this.textures.exists('kenney_luz')) this.load.image('kenney_luz', 'assets/kenney_luz.png');
      if (!this.textures.exists('kenney_profundo')) this.load.image('kenney_profundo', 'assets/kenney_profundo.png');
      if (!this.textures.exists('kenney_valle')) this.load.image('kenney_valle', 'assets/kenney_valle.png');
      if (!this.textures.exists('kenney_abismo')) this.load.image('kenney_abismo', 'assets/kenney_abismo.png');
      if (!this.textures.exists('jefe_u1b_hoja')) this.load.spritesheet('jefe_u1b_hoja', 'assets/enemigos/jefe_u1b.png', { frameWidth: 64, frameHeight: 64 });
      if (!this.textures.exists('item_prisma')) this.load.image('item_prisma', 'assets/iconos/prisma.png');
      if (!this.textures.exists('jefe_u2_hoja')) this.load.spritesheet('jefe_u2_hoja', 'assets/enemigos/jefe_u2.png', { frameWidth: 64, frameHeight: 64 });
      for (const n of ['esqueleto', 'duende', 'lobo', 'jabali', 'jefe_u1', 'minero', 'jefe_u3', 'lobo_nieve', 'jefe_u4', 'momia', 'jefe_u3b']) if (!this.textures.exists(`${n}_hoja`)) this.load.spritesheet(`${n}_hoja`, `assets/enemigos/${n}.png`, { frameWidth: 64, frameHeight: 64 });
      const hoja = (key, url) => { if (!this.textures.exists(key)) this.load.spritesheet(key, url, { frameWidth: 64, frameHeight: 64 }); };
      for (const p of PERSONAJES) for (const a of TEX_ARMADURA) hoja(`pj_${p.id}_${a}`, `assets/pj/${p.id}_${a}.png`);
      for (const c of ['hacha_male', 'hacha_thin', 'pico_male', 'pico_thin', 'espada_fg', 'espada_bg', 'espada2_fg', 'espada2_bg', 'espada3_fg', 'espada3_bg', 'espada4_fg', 'espada4_bg', 'espada5_fg', 'espada5_bg', 'espada6_fg', 'espada6_bg']) hoja(`capa_${c}`, `assets/capas/${c}.png`);
    }

    create() {
      escena = this;
      this.crearTexturas();
      this.crearAnimaciones();
      this.obstaculos = this.physics.add.staticGroup();
      this.objetos = [];
      this.enemigos = [];
      this.lagos = [];
      this.aguas = [];   // rectángulos de agua: los enemigos que caminan no pueden entrar
      this.ocupado = new Set();
      if (!MUNDOS[this.zona] && this.zona !== 'pieza') this.zona = 'base';
      if (this.zona === 'base') this.crearBase(); else if (this.zona === 'pieza') this.crearPieza(); else this.crearMundo(MUNDOS[this.zona]);
      this.crearJugador();
      this.physics.world.setBounds(0, 0, this.ancho * TILE, this.alto * TILE);
      this.cameras.main.setBounds(0, 0, this.ancho * TILE, this.alto * TILE);
      this.cameras.main.startFollow(this.jugador, true, 0.15, 0.15);
      this.cameras.main.setRoundPixels(true);
      this.cameras.main.setBackgroundColor(this.zona === 'base' ? '#2f6b47' : this.zona === 'pieza' ? '#140d09' : MUNDOS[this.zona].fondo);
      this.cameras.main.fadeIn(350, 18, 32, 26);
      this.ajustarZoom();
      this.scale.on('resize', this.ajustarZoom, this);
      this.events.once('shutdown', () => this.scale.off('resize', this.ajustarZoom, this));

      this.teclas = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE');
      this.teclas.E.on('down', () => { if (!ui.abierto) this.interactuar(); });
      this.teclas.SPACE.on('down', () => { if (!ui.abierto) this.interactuar(); });
      this.dir = 'down';
      this.objetivo = null;
      this.enCombate = false;
      this.time.addEvent({ delay: 120, loop: true, callback: () => this.buscarObjetivo() });
      if (MUNDOS[this.zona]) {
        misionesDe(this.zona);
        setTimeout(() => toast('Cuida tu vida: aquí no se recupera sola. Vuelve a tu base o busca cofres con corazón.'), 2600);
      }
      this.otros = new Map();
      this.cambios = new Map();
      this.canal = null;
      if (MUNDOS[this.zona] && S.grupo && coopActivo()) this.iniciarCoop();
      this.events.once('shutdown', () => { if (this.canal) { this.canal.salir(); this.canal = null; } pintarCoop(); });
      pintarHUD();
      pintarCoop();
      latir();
      if (MUNDOS[this.zona]) this.actualizarSello();
      this.des = { objs: [], items: [] };
      if (obraDeEscena()) cargarObra();
      if (vivo.fase === 'activo') montarDesafio(this);
      if (this.zona === 'pieza' && !(S.pieza || []).length) setTimeout(() => toast('¡Esta es tu pieza! Fabrica muebles con B (pestaña Muebles) y colócalos con G.'), 700);
      revisarPendientes();
    }

    // ---------- texturas ----------
    tex(key, w, h, partes, hoja = 'kenney') {
      if (this.textures.exists(key)) return;
      const src = this.textures.get(hoja).getSourceImage();
      const t = this.textures.createCanvas(key, w * 16, h * 16);
      for (const [c, r, dx, dy] of partes) t.context.drawImage(src, c * 17, r * 17, 16, 16, dx * 16, dy * 16, 16, 16);
      t.refresh();
      return t;
    }
    pixeles(key, filas, paleta) {
      if (this.textures.exists(key)) return;
      const t = this.textures.createCanvas(key, filas[0].length, filas.length);
      filas.forEach((f, y) => [...f].forEach((ch, x) => { if (paleta[ch]) { t.context.fillStyle = paleta[ch]; t.context.fillRect(x, y, 1, 1); } }));
      t.refresh();
    }
    crearTexturas() {
      const T = (key, c, r) => this.tex(key, 1, 1, [[c, r, 0, 0]]);
      this.tex('arbol_manzano', 1, 2, [[23, 10, 0, 0], [23, 11, 0, 1]]);
      this.tex('arbol_redondo', 1, 2, [[13, 10, 0, 0], [13, 11, 0, 1]]);
      this.tex('arbol_pino', 1, 2, [[18, 10, 0, 0], [18, 11, 0, 1]]);
      this.tex('arbol_otono', 1, 2, [[14, 10, 0, 0], [14, 11, 0, 1]]);
      this.tex('cactus', 1, 1, [[22, 9, 0, 0]]);
      this.tex('carpa_b', 2, 2, [[48, 10, 0, 0], [49, 10, 1, 0], [48, 11, 0, 1], [49, 11, 1, 1]]);
      this.tex('carpa_v', 2, 2, [[46, 10, 0, 0], [47, 10, 1, 0], [46, 11, 0, 1], [47, 11, 1, 1]]);
      T('tocon', 53, 19); T('brote', 22, 11);
      T('roca3', 54, 21); T('roca2', 55, 21); T('roca1', 56, 21);
      T('roca_cafe3', 54, 19); T('roca_cafe2', 55, 19); T('roca_cafe1', 56, 19);
      T('roca_musgo3', 54, 22); T('roca_musgo2', 55, 22); T('roca_musgo1', 56, 22); T('roca_musgo', 54, 22);
      T('cofre', 37, 9); T('fogata', 14, 8); T('lena', 13, 8); T('cerco', 52, 23); T('letrero', 19, 0);
      T('arbusto', 19, 9); T('arbusto2', 24, 9); T('antorcha', 17, 8); T('barril', 23, 0);
      [28, 29, 30, 31].forEach((c, i) => T(`flor${i}`, c, 9));
      // Decorativos y muebles del catálogo
      for (const o of OBJETOS) {
        const [c, r, w, h] = o.t, partes = o.partes ? [...o.partes] : [];
        if (!o.partes) for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) partes.push([c + dx, r + dy, dx, dy]);
        this.tex(o.tex, w, h, partes, { i: 'kenney_in', c: 'kenney_cueva', n: 'kenney_nieve', p: 'kenney_prisma', l: 'kenney_luz', f: 'kenney_profundo', v: 'kenney_valle', a: 'kenney_abismo' }[o.h] || 'kenney');
      }
      this.tex('tapiz_pared', 1, 1, [[24, 1, 0, 0]], 'kenney_in');
      this.crearTexturasDesierto();
      this.crearTexturasCueva();
      this.crearTexturasHielo();
      // Bosque profundo (hoja propia)
      const PF = { arbol_gigante: [0, 0, 2, 4], colmena: [2, 0, 1, 1], colmena_vacia: [3, 0, 1, 1], arana: [4, 0, 1, 1], raiz_viva: [5, 0, 1, 1], tocon_raiz: [6, 0, 1, 1], altar: [7, 0, 1, 1], helecho: [8, 0, 1, 1], columna_musgo: [9, 0, 1, 2], columna_rota_musgo: [10, 0, 1, 2], tronco_gigante: [11, 0, 2, 2] };
      for (const [k, [c, r, w, h]] of Object.entries(PF)) { const partes = []; for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) partes.push([c + dx, r + dy, dx, dy]); this.tex(k, w, h, partes, 'kenney_profundo'); }
      // Valle de la Esfinge (hoja propia): se usan con el prefijo v_
      const PV = {"esfinge": [0, 0, 4, 3], "piramide": [4, 0, 3, 2], "esqueleto_dino": [7, 0, 3, 2], "alfombra_jero": [10, 0, 3, 2], "entrada_tumba": [13, 0, 2, 2], "vitrina_gemas": [0, 3, 2, 2], "esfinge_mini": [2, 3, 2, 2], "sitio": [4, 3, 2, 1], "sitio_vacio": [6, 3, 2, 1], "obelisco": [8, 3, 1, 3], "palmera": [9, 3, 1, 2], "estatua_chacal": [10, 3, 1, 2], "sarcofago": [11, 3, 1, 2], "columna_jero": [12, 3, 1, 2], "columna_jero_rota": [13, 3, 1, 2], "lampara_obsidiana": [14, 3, 1, 2], "vitrina_fosiles": [15, 3, 1, 2], "veta_obsidiana": [0, 6, 1, 1], "escarabajo": [1, 6, 1, 1], "papiro": [2, 6, 1, 1], "jarron_dorado": [3, 6, 1, 1], "cofre_reliquias": [4, 6, 1, 1], "trono": [5, 6, 1, 1], "mesa_obsidiana": [6, 6, 1, 1], "cuadro_fosil": [7, 6, 1, 1], "antorcha_obsidiana": [8, 6, 1, 1], "andamio": [9, 6, 1, 1], "polea": [10, 6, 1, 1], "cuerda": [11, 6, 1, 1], "plataforma": [12, 6, 1, 1], "escalon": [13, 6, 1, 1], "acant_borde": [14, 6, 1, 1], "acant_borde2": [15, 6, 1, 1], "acant_cara": [0, 7, 1, 1], "acant_cara2": [1, 7, 1, 1], "acant_pie": [2, 7, 1, 1]};
      for (const [k, [c, r, w, h]] of Object.entries(PV)) { const partes = []; for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) partes.push([c + dx, r + dy, dx, dy]); this.tex(`v_${k}`, w, h, partes, 'kenney_valle'); }
      for (const n of [1, 2]) this.tex(`veta_obsidiana${n}`, 1, 1, [[PV.veta_obsidiana[0], PV.veta_obsidiana[1], 0, 0]], 'kenney_valle');
      // Profundidades de la mina (hoja propia): prefijo a_
      const PA = {"puerta_sellada": [0, 0, 3, 2], "alfombra_cristal": [3, 0, 3, 2], "jaula": [6, 0, 2, 2], "estatua_coloso": [8, 0, 2, 3], "altar_cristal": [10, 0, 1, 2], "columna_cristal": [11, 0, 1, 2], "lampara_cristal": [12, 0, 1, 2], "cama_cristal": [13, 0, 1, 2], "estante_geodas": [14, 0, 1, 2], "veta_magma": [15, 0, 1, 1], "cristal_n": [0, 3, 1, 1], "cristal_vacio": [1, 3, 1, 1], "estalagmita_magma": [2, 3, 1, 1], "roca_lava": [3, 3, 1, 1], "salamandra": [4, 3, 1, 1], "golem_cristal": [5, 3, 1, 1], "brasero_magma": [6, 3, 1, 1], "geoda": [7, 3, 1, 1], "mesa_magma": [8, 3, 1, 1], "sillon_piedra": [9, 3, 1, 1], "cristal_flotante": [10, 3, 1, 1], "vagoneta": [11, 3, 1, 1], "vagoneta_dorada": [12, 3, 1, 1], "pared_borde": [13, 3, 1, 1], "pared_borde2": [14, 3, 1, 1], "pared_cara": [15, 3, 1, 1], "pared_cara2": [0, 4, 1, 1]};
      for (const [k, [c, r, w, h]] of Object.entries(PA)) { const partes = []; for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) partes.push([c + dx, r + dy, dx, dy]); this.tex(`a_${k}`, w, h, partes, 'kenney_abismo'); }
      for (const n of [1, 2]) this.tex(`veta_magma${n}`, 1, 1, [[PA.veta_magma[0], PA.veta_magma[1], 0, 0]], 'kenney_abismo');
      // Arbusto vivo: el mismo arbusto con ojos y boca
      if (!this.textures.exists('arbusto_vivo')) {
        const src = this.textures.get('kenney').getSourceImage();
        const t = this.textures.createCanvas('arbusto_vivo', 16, 16), c = t.context;
        c.drawImage(src, 19 * 17, 9 * 17, 16, 16, 0, 0, 16, 16);
        c.fillStyle = '#ffffff'; c.fillRect(4, 6, 3, 3); c.fillRect(9, 6, 3, 3);
        c.fillStyle = '#1b1a12'; c.fillRect(5, 7, 2, 2); c.fillRect(10, 7, 2, 2); c.fillRect(6, 11, 4, 1);
        c.fillStyle = '#b3261e'; c.fillRect(4, 5, 3, 1); c.fillRect(9, 5, 3, 1);
        t.refresh();
      }
      this.pixeles('bicho', [
        '..x......x..', '...x....x...', 'x...xxxx...x', '.x.xxxxxx.x.', '..xxrxxrxx..',
        '..xxxxxxxx..', '.x.xxxxxx.x.', 'x...xxxx...x', '...x....x...', '..x......x..',
      ], { x: '#2b1f2e', r: '#ff5a4d' });
      for (const [z, J] of Object.entries(JEFES)) this.pixeles(`jefe_${z}`, [
        '.....xxxxxxxx.....', '...xxggggggggxx...', '..xggggggggggggx..', '.xggeeggggggeeggx.', '.xggeeggggggeeggx.',
        '.xggggggggggggggx.', '.xgggmmmmmmmmgggx.', '..xggggggggggggx..', 'xxxxggggggggggxxxx', 'xggxggggggggggxggx',
        'xggxgggxxxxgggxggx', 'xggxggx....xggxggx', '.xx.xgx....xgx.xx.', '....xgx....xgx....', '...xggx....xggx...', '...xxxx....xxxx...',
      ], { x: '#1b1a12', g: J.color, e: '#ffd23f', m: '#3a1f22' });
      // Gran lago del bosque: tablas del muelle, postes, nenúfares y juncos
      this.pixeles('muelle', ['nccccccccccccccn', 'naaaaaaaaaaaaaan', 'naaaaaaaaaaaaaan', 'nbbbbbbbbbbbbbbn', 'nccccccccccccccn', 'naaaaaaakaaaaaan', 'naaaaaaaaaaaaaan', 'nbbbbbbbbbbbbbbn',
        'nccccccccccccccn', 'naaaaaaaaaaaaaan', 'naakaaaaaaaaaaan', 'nbbbbbbbbbbbbbbn', 'nccccccccccccccn', 'naaaaaaaaaaakaan', 'naaaaaaaaaaaaaan', 'nbbbbbbbbbbbbbbn'],
        { a: '#9a6638', b: '#5e3b1f', c: '#bf8a52', n: '#4a2e17', k: '#3a2412' });
      this.pixeles('poste', ['.kk.', 'kccn', 'kaan', 'kaan', 'kaan', 'kaan', 'kaan', 'wwww'], { a: '#7a4f2a', c: '#a8743f', k: '#3a2412', n: '#4a2e17', w: '#cfe9f5' });
      this.pixeles('nenufar', ['................', '................', '.....gggg.......', '...gggggggg.....', '..gggggllgggg...', '..ggglggggggg...', '.gggggggg..gg...', '.gggglggg.......', '..gggggggggg....',
        '...gggggggg.....', '.....gggg.......', '................'], { g: '#3f8f4a', l: '#6cbf6a' });
      this.pixeles('nenufar_flor', ['................', '.......pp.......', '......pwwp......', '...ggpwwwwpg....', '..gggpppppggg...', '.gggggggggg.gg..', '.ggglggg........', '..gggggggggg....', '...gggggggg.....', '.....gggg.......'],
        { g: '#3f8f4a', l: '#6cbf6a', p: '#f08cb4', w: '#ffe2ee' });
      this.pixeles('juncos', ['...c......c.....', '...c...c..c.....', '..gc...c..c..c..', '..g....c.gg..c..', '..g..g.g.g...c..', '.gg..g.g.g..g...', '.g..gg.g.g..g...', '.g..g..gg..gg...', '.g..g..g...g....', 'gg..g..g...g....',
        'g..gg..g..gg....', 'g..g...g..g.....', 'g..g..gg..g.....', 'gg.g..g..gg.....', '.ggg..g..g......', '..gggggggg......'], { g: '#4c8a3a', c: '#7a4a24' });
      this.pixeles('corazon', ['.rr.rr.', 'rwrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], { r: '#e8524a', w: '#ffd0c8' });
      this.pixeles('hilo', ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'], { x: '#e8e8e8' });
      this.pixeles('niebla', [
        '......wwwwww........', '....wwwwwwwwww......', '...wwwwwwwwwwwww....', '..wwwwwwwwwwwwwwww..',
        '.wwwwkkwwwwwkkwwwww.', 'wwwwwkkwwwwwkkwwwwww', 'wwwwwwwwwwwwwwwwwwww', 'wwwwwwwkkkkkkwwwwwww',
        '.wwwwwwwwwwwwwwwwww.', '..wwww.wwwwwww.www..', '...ww....www.....w..',
      ], { w: 'rgba(225,230,240,0.92)', k: '#2a2f3a' });
      this.pixeles('portal', [
        '....pppppp....', '..pp......pp..', '.p..tttttt..p.', '.p.t......t.p.', 'p.t..cccc..t.p', 'p.t.cc..cc.t.p',
        'p.t.c....c.t.p', 'p.t.c....c.t.p', 'p.t.cc..cc.t.p', 'p.t..cccc..t.p', '.p.t......t.p.', '.p..tttttt..p.', '..pp......pp..', '....pppppp....',
      ], { p: '#8a5cf6', t: '#5cc8b8', c: '#f2e27a' });
      const g = this.add.graphics();
      [['p_madera', 0x9b6b3f], ['p_piedra', 0x9aa198], ['p_agua', 0x4fa3c7], ['p_brillo', 0xf2e27a], ['p_hoja', 0x4c9a48], ['p_morado', 0xb79ce8], ['p_rojo', 0xee7b61]].forEach(([k, col]) => {
        if (this.textures.exists(k)) return;
        g.clear(); g.fillStyle(col, 1); g.fillRect(0, 0, 4, 4); g.generateTexture(k, 4, 4);
      });
      if (!this.textures.exists('humo')) {
        const t = this.textures.createCanvas('humo', 64, 64), c = t.context;
        const grad = c.createRadialGradient(32, 32, 2, 32, 32, 32);
        grad.addColorStop(0, 'rgba(230,234,240,0.55)'); grad.addColorStop(1, 'rgba(230,234,240,0)');
        c.fillStyle = grad; c.fillRect(0, 0, 64, 64); t.refresh();
        t.setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
      g.destroy();
    }
    // Arte del desierto (Unidad 2)
    crearTexturasDesierto() {
      const T = (key, c, r, hoja = 'kenney') => this.tex(key, 1, 1, [[c, r, 0, 0]], hoja);
      T('cactus_brote1', 22, 11); T('cactus_brote2', 22, 10); T('monticulo', 5, 2, 'kenney_cueva');
      T('veta_cobre1', 12, 13, 'kenney_cueva'); T('veta_cobre2', 12, 13, 'kenney_cueva');
      T('veta_oro1', 13, 12, 'kenney_cueva'); T('veta_oro2', 13, 12, 'kenney_cueva');
      this.pixeles('escorpion', [
        '.....ss.......', '....s..s......', '.......s......', '......ss......', '.....bbbb.....', '..l.bbbbbb.l..', '.l.lbbbbbbl.l.',
        'l..bbbbbbbb..l', '..lbbrbbrbbl..', '.l.bbbbbbbb.l.', 'cc..bbbbbb..cc', 'c.c..bbbb..c.c', 'cc..........cc',
      ], { b: '#8a4b1f', s: '#4a250c', r: '#ffd23f', l: '#5a2e10', c: '#b8652a' });
      this.pixeles('remolino', [
        '..wwwwwwwwwwww..', '.wwddwwwwwwddww.', 'wwwwkwwwwwwkwwww', '.wwwwddwwwwwww..', '..wwwwwwwwddww..', '...wwwwwwwwww...',
        '....wwddwwww....', '.....wwwwwww....', '......wwwdw.....', '......wwwww.....', '.......www......', '.......ww.......', '.......w........',
      ], { w: 'rgba(232,208,152,0.95)', d: '#b8935a', k: '#3a2a14' });
      const cuadro = (key, hoja, col, fila) => {
        if (this.textures.exists(key) || !this.textures.exists(hoja)) return;
        const src = this.textures.get(hoja).getSourceImage();
        const t = this.textures.createCanvas(key, 64, 64);
        t.context.drawImage(src, col * 64, fila * 64, 64, 64, 0, 0, 64, 64); t.refresh();
      };
      const LPC = ['esqueleto', 'duende', 'lobo', 'jabali', 'minero', 'lobo_nieve', 'jefe_u1', 'jefe_u2', 'jefe_u3', 'jefe_u4', 'jefe_u1b', 'momia', 'jefe_u3b'];
      for (const n of LPC) cuadro(`${n}_retrato`, `${n}_hoja`, 0, 2);
      for (const [k, h] of LPC.map((n) => [n, `${n}_hoja`])) {
        for (const [d, fila] of Object.entries(DIRS)) {
          if (!this.anims.exists(`${k}_${d}`)) this.anims.create({ key: `${k}_${d}`, frames: this.anims.generateFrameNumbers(h, { start: fila * 9 + 1, end: fila * 9 + 8 }), frameRate: k.startsWith('jefe') ? 7 : 10, repeat: -1 });
        }
      }
      const g = this.add.graphics();
      [['p_arena', 0xe3c88a], ['p_cobre', 0xd9772b]].forEach(([k, col]) => {
        if (this.textures.exists(k)) return;
        g.clear(); g.fillStyle(col, 1); g.fillRect(0, 0, 4, 4); g.generateTexture(k, 4, 4);
      });
      g.destroy();
    }
    // Arte de la mina (Unidad 3)
    crearTexturasCueva() {
      const T = (key, c, r) => this.tex(key, 1, 1, [[c, r, 0, 0]], 'kenney_cueva');
      T('hongos_n', 1, 3); T('hongos_t', 1, 4); T('hongos_b', 2, 3); T('golem_roca', 5, 1);
      T('veta_plata1', 11, 10); T('veta_plata2', 11, 10); T('veta_amatista1', 10, 12); T('veta_amatista2', 10, 12);
      this.pixeles('murcielago', [
        'b..............b', 'bb....b..b....bb', 'bbb..bbbbbb..bbb', 'bbbbbbrbbrbbbbbb', '.bbbbbbbbbbbbbb.', '..bbb.bbbb.bbb..', '...b...bb...b...',
      ], { b: '#4a3d5c', r: '#ff4d6d' });
      this.pixeles('golem', [
        '.....kkkkkk.....', '....kggggggk....', '....kgyggygk....', '....kggggggk....', '..kkkgddddgkkk..', '.kggggggggggggk.', 'kggg.gggggg.gggk',
        'kgg..gddddg..ggk', 'kg...gggggg...gk', '.....gg..gg.....', '....kgg..ggk....', '....kkk..kkk....',
      ], { g: '#8c8f99', d: '#5c5f6a', y: '#c9a0ff', k: '#2d2f38' });
      if (!this.textures.exists('luz')) {
        const t = this.textures.createCanvas('luz', 256, 256), c = t.context;
        const grad = c.createRadialGradient(128, 128, 8, 128, 128, 128);
        grad.addColorStop(0, 'rgba(255,230,180,0.85)'); grad.addColorStop(0.5, 'rgba(255,200,140,0.3)'); grad.addColorStop(1, 'rgba(255,200,140,0)');
        c.fillStyle = grad; c.fillRect(0, 0, 256, 256); t.refresh(); t.setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
      const g = this.add.graphics();
      if (!this.textures.exists('p_carbon')) { g.fillStyle(0x2d2d33, 1); g.fillRect(0, 0, 4, 4); g.generateTexture('p_carbon', 4, 4); }
      g.destroy();
    }
    // Arte del mundo helado (Unidad 4): hoja propia con tiles recoloreados
    crearTexturasHielo() {
      const NV = { nieve: [0, 0], nieve2: [1, 0], hielo_suelo: [2, 0], sendero: [3, 0], seco_n: [10, 0], tocon_n: [11, 0], brote_n: [12, 0], hielo3: [13, 0], hielo2: [14, 0], hielo1: [15, 0],
        veta_escarcha: [0, 1], veta_zafiro: [1, 1], arbusto_bayas: [4, 1], arbusto_nevado: [5, 1], montonnieve: [6, 1], bloque_hielo: [7, 1], muneco_malo: [11, 1], espiritu: [12, 1] };
      for (const [k, [c, r]] of Object.entries(NV)) this.tex(`nv_${k}`, 1, 1, [[c, r, 0, 0]], 'kenney_nieve');
      this.tex('nv_pino', 1, 2, [[4, 0, 0, 0], [5, 0, 0, 1]], 'kenney_nieve');
      this.tex('nv_roble', 1, 2, [[6, 0, 0, 0], [7, 0, 0, 1]], 'kenney_nieve');
      this.tex('nv_arce', 1, 2, [[8, 0, 0, 0], [9, 0, 0, 1]], 'kenney_nieve');
      for (const k of ['veta_escarcha', 'veta_zafiro']) for (const n of [1, 2]) this.tex(`${k}${n}`, 1, 1, [[NV[k][0], NV[k][1], 0, 0]], 'kenney_nieve');
      const g = this.add.graphics();
      if (!this.textures.exists('p_nieve')) { g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 4, 4); g.generateTexture('p_nieve', 4, 4); }
      g.destroy();
    }
    imagenTex(key) { return this.textures.getBase64(key); }
    retrato(clase) { return this.textures.getBase64((ENEMIGOS[clase] && ENEMIGOS[clase].retrato) || clase); }

    crearAnimaciones() {
      for (const p of PERSONAJES) for (const a of TEX_ARMADURA) {
        for (const [d, fila] of Object.entries(DIRS)) {
          const key = `pj_${p.id}_${a}_${d}`;
          if (!this.anims.exists(key)) this.anims.create({ key, frames: this.anims.generateFrameNumbers(`pj_${p.id}_${a}`, { start: fila * 9 + 1, end: fila * 9 + 8 }), frameRate: 12, repeat: -1 });
        }
      }
    }

    // ---------- utilidades de construcción ----------
    suelo(data, hoja = 'kenney') {
      this.terreno = data;
      const mapa = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
      const ts = mapa.addTilesetImage(hoja, hoja, 16, 16, 0, 1);
      mapa.createLayer(0, ts, 0, 0).setScale(2).setDepth(-10);
    }
    marcar(x, y) { this.ocupado.add(`${x},${y}`); }
    libre(x, y) {
      if (x < 2 || y < 2 || x >= this.ancho - 2 || y >= this.alto - 2) return false;
      if (this.ocupado.has(`${x},${y}`)) return false;
      return (this.pisables || PASTO).includes(this.terreno[y][x]);
    }
    sprite(key, tx, ty, ox = 0.5) {
      const s = this.add.image(tx * TILE + TILE / 2, (ty + 1) * TILE, key).setOrigin(ox, 1).setScale(2);
      s.setDepth(s.y);
      return s;
    }
    solido(x, y, w, h) { const z = this.add.zone(x, y, w, h); this.obstaculos.add(z); return z; }
    bordes() {
      for (let y = 0; y < this.alto; y++) for (let x = 0; x < this.ancho; x++) {
        if (x < 2 || y < 2 || x >= this.ancho - 2 || y >= this.alto - 2) this.sprite(this.rnd() < 0.7 ? 'arbol_pino' : 'arbol_redondo', x, y);
      }
      const W = this.ancho * TILE, H = this.alto * TILE;
      this.solido(W / 2, TILE, W, TILE * 2); this.solido(W / 2, H - TILE, W, TILE * 2);
      this.solido(TILE, H / 2, TILE * 2, H); this.solido(W - TILE, H / 2, TILE * 2, H);
    }
    lago(data, lx, ly, w, h, interactivo = true) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const tx = x === 0 ? 0 : x === w - 1 ? 2 : 1, ty = y === 0 ? 0 : y === h - 1 ? 2 : 1;
        data[ly + y][lx + x] = fr(2 + tx, ty);
      }
      this.obstaculos.add(this.add.zone((lx + w / 2) * TILE, (ly + h / 2) * TILE, w * TILE - 24, h * TILE - 24));
      if (interactivo) this.lagos.push({ x: lx * TILE, y: ly * TILE, w: w * TILE, h: h * TILE });
      this.aguas.push({ x0: lx * TILE + 6, y0: ly * TILE + 6, x1: (lx + w) * TILE - 6, y1: (ly + h) * TILE - 6 });
      for (let y = ly - 1; y <= ly + h; y++) for (let x = lx - 1; x <= lx + w; x++) this.marcar(x, y);
    }
    // Gran lago del bosque (no se puede cruzar) con un muelle para pescar
    prepararGranLago(data) {
      const w = 15, h = 9;
      let L = null;
      for (let t = 0; t < 300 && !L; t++) {
        const lx = 18 + Math.floor(this.rnd() * ((this.anchoUtil || this.ancho) - w - 22)), ly = 4 + Math.floor(this.rnd() * (this.alto - h - 10));
        if (lx <= CENTRO_X && lx + w >= CENTRO_X) continue;
        if (ly <= PORTAL_Y + 3 && ly + h + 3 >= PORTAL_Y) continue;
        let ok = true;
        for (let y = ly - 2; y <= ly + h + 3 && ok; y++) for (let x = lx - 2; x <= lx + w + 1 && ok; x++) if (this.ocupado.has(`${x},${y}`)) ok = false;
        if (ok) L = { lx, ly, w, h };
      }
      if (!L) L = { lx: CENTRO_X + 6, ly: 4, w, h };
      this.lagoMuelle(data, L, 5, false);
    }
    // Lago que no se puede cruzar, con un muelle que entra "largo" casillas al agua desde la orilla de abajo
    lagoMuelle(data, L, largo, profundo) {
      const { lx, ly, w, h } = L, dx = lx + Math.floor(w / 2), dTop = ly + h - largo;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const tx = x === 0 ? 0 : x === w - 1 ? 2 : 1, ty = y === 0 ? 0 : y === h - 1 ? 2 : 1;
        data[ly + y][lx + x] = fr(2 + tx, ty);
      }
      // zonas sólidas alrededor del muelle (por el agua no se puede pasar)
      const Z = (x0, y0, x1, y1) => { this.obstaculos.add(this.add.zone((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0)); this.aguas.push({ x0, y0, x1, y1 }); };
      Z(lx * TILE + 10, ly * TILE + 10, dx * TILE, (ly + h) * TILE - 12);
      Z((dx + 1) * TILE, ly * TILE + 10, (lx + w) * TILE - 10, (ly + h) * TILE - 12);
      Z(dx * TILE, ly * TILE + 10, (dx + 1) * TILE, dTop * TILE + 6);
      for (let y = ly - 1; y <= ly + h; y++) for (let x = lx - 1; x <= lx + w; x++) this.marcar(x, y);
      for (let y = ly + h; y <= ly + h + 2; y++) for (let x = dx - 1; x <= dx + 1; x++) this.marcar(x, y);   // acceso libre al muelle
      this.lagos.push({ x: lx * TILE, y: ly * TILE, w: w * TILE, h: h * TILE });
      const m = { ...L, dx, dTop, profundo };
      (this.muelles = this.muelles || []).push(m);
      if (!profundo) this.granLago = m;
      return m;
    }
    decorarGranLago(m) {
      const { lx, ly, w, h, dx, dTop, profundo } = m;
      for (let y = dTop; y < ly + h + 1; y++) this.add.image(dx * TILE + 16, y * TILE + 16, 'muelle').setScale(2).setDepth(-6);
      for (const [px, py] of [[dx * TILE + 3, dTop * TILE + 6], [(dx + 1) * TILE - 3, dTop * TILE + 6], [dx * TILE + 3, (dTop + 3) * TILE], [(dx + 1) * TILE - 3, (dTop + 3) * TILE]]) this.add.image(px, py + 14, 'poste').setScale(2).setDepth(py);
      // nenúfares sobre el agua (decorativos)
      for (let i = 0; i < (profundo ? 7 : 16); i++) {
        const x = lx + 1 + Math.floor(this.rnd() * (w - 2)), y = ly + 1 + Math.floor(this.rnd() * (h - 2));
        if (Math.abs(x - dx) < 2) continue;
        this.add.image(x * TILE + 16, y * TILE + 16, this.rnd() < 0.3 ? 'nenufar_flor' : 'nenufar').setScale(2).setDepth(-7).setFlipX(this.rnd() < 0.5);
      }
      // juncos en la orilla, un letrero y un barril junto al muelle
      for (let i = 0; i < (profundo ? 8 : 14); i++) {
        const lado = Math.floor(this.rnd() * 4);
        const x = lado < 2 ? lx + Math.floor(this.rnd() * w) : lado === 2 ? lx - 1 : lx + w;
        const y = lado === 0 ? ly - 1 : lado === 1 ? ly + h : ly + Math.floor(this.rnd() * h);
        if (Math.abs(x - dx) < 2 && y >= ly + h) continue;
        this.add.image(x * TILE + 16, (y + 1) * TILE, 'juncos').setOrigin(0.5, 1).setScale(2).setDepth((y + 1) * TILE - 4);
      }
      const le = this.sprite('letrero', dx - 1, ly + h); this.solido(le.x, le.y - 8, 18, 10);
      const ba = this.sprite('barril', dx + 1, ly + h); this.solido(ba.x, ba.y - 8, 18, 10);
      this.add.text(le.x, le.y - 44, profundo ? 'Estanque' : 'Muelle', { fontFamily: 'Fredoka, Nunito, sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#ffe9b8', stroke: '#2a1a0c', strokeThickness: 3 }).setOrigin(0.5).setResolution(3).setDepth(le.y + 1);
      this.objetos.push({ tipo: 'muelle', x: dx * TILE + 16, y: dTop * TILE + 20, activo: true, profundo });
      // de vez en cuando salta un pez
      this.time.addEvent({ delay: 3500, loop: true, callback: () => {
        const x = (lx + 1 + Math.random() * (w - 2)) * TILE, y = (ly + 1 + Math.random() * (h - 2)) * TILE;
        if (Math.abs(x - (dx * TILE + 16)) < 40) return;
        this.add.particles(x, y, 'p_agua', { speed: { min: 30, max: 90 }, angle: { min: 200, max: 340 }, gravityY: 220, lifespan: 600, scale: { start: 1.3, end: 0 }, emitting: false }).setDepth(-5).explode(12);
      } });
    }
    // ---------- río, puente cooperativo y Bosque profundo (Unidad 1) ----------
    planearProfundo(data, P) {
      const RX = MAPA_W - 1, by = P.y + 2;   // el río ocupa RX..RX+2; el puente cruza en las filas by y by+1
      this.rio = { RX, by };
      for (let y = 2; y < this.alto - 2; y++) for (let k = 0; k < RIO_ANCHO; k++) data[y][RX + k] = fr(2 + k, y === 2 ? 0 : y === this.alto - 3 ? 2 : 1);
      // agua sólida arriba y abajo del puente; el tramo del puente es sólido hasta que se termine
      const x0 = RX * TILE + 6, x1 = (RX + RIO_ANCHO) * TILE - 6;
      const Z = (y0, y1) => { const z = this.add.zone((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0); this.obstaculos.add(z); const a = { x0, y0, x1, y1 }; this.aguas.push(a); return { z, a }; };
      Z(2 * TILE, by * TILE);
      Z((by + 2) * TILE, (this.alto - 2) * TILE);
      this.tramoPuente = Z(by * TILE, (by + 2) * TILE);
      this.lagos.push({ x: RX * TILE, y: 2 * TILE, w: RIO_ANCHO * TILE, h: (this.alto - 4) * TILE });
      // el Bosque profundo queda reservado hasta poblarlo al final
      for (let y = 0; y < this.alto; y++) for (let x = RX - 1; x < this.ancho; x++) this.marcar(x, y);
      // santuario del Rey Jabalí y estanque profundo (posiciones fijas)
      const SX = this.ancho - 12, SY = P.y - 9;
      this.santuario = { x: SX, y: SY };
      for (let y = SY + 2; y <= by; y++) data[y][SX] = CAMINO;
      this.estanque = { lx: RX + 7, ly: this.alto - 16, w: 10, h: 6 };
    }
    decorarRio() {
      const { RX, by } = this.rio;
      // obra del puente en la orilla oeste
      const ox = RX - 2, oy = by;
      const le = this.sprite('letrero', ox, oy - 1); this.solido(le.x, le.y - 8, 18, 10);
      const ma = this.sprite('lena', ox - 1, oy + 2); const pi = this.sprite('roca2', ox, oy + 2); this.sprite('barril', ox - 1, oy - 1);
      this.solido(ma.x, ma.y - 8, 18, 10); this.solido(pi.x, pi.y - 8, 18, 10);
      this.obraTag = this.add.text(le.x, le.y - 50, 'Puente en construcción', { fontFamily: 'Fredoka, Nunito, sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#ffe9b8', stroke: '#2a1a0c', strokeThickness: 3, align: 'center' }).setOrigin(0.5).setResolution(3).setDepth(9999);
      this.objObra = { tipo: 'obra', x: (RX - 1) * TILE + 8, y: (by + 1) * TILE, activo: true };
      this.objetos.push(this.objObra);
      for (const yy of [by, by + 2]) this.add.image(RX * TILE + 2, yy * TILE + 4, 'poste').setScale(2).setDepth(yy * TILE);
      this.puenteSpr = [];
      this.actualizarPuente();
    }
    // Dibuja el avance del puente: tablas parciales mientras se construye, completo y transitable al terminar
    actualizarPuente(celebrar = false) {
      if (!this.rio || !this.puenteSpr) return;
      const { RX, by } = this.rio, o = obraE.puente;
      const metaT = o && o.meta ? Object.values(o.meta).reduce((a, b) => a + b, 0) : 1;
      const hecho = o && o.aportes ? Object.entries(o.meta || {}).reduce((a, [k, n]) => a + Math.min(n, o.aportes[k] || 0), 0) : 0;
      const listo = puenteListo();
      const pct = listo ? 100 : Math.floor((hecho / metaT) * 100);
      this.puenteSpr.forEach((sp) => sp.destroy()); this.puenteSpr = [];
      const tablas = listo ? RIO_ANCHO * 2 : Math.floor((pct / 100) * RIO_ANCHO * 2 * 0.99);
      let n = 0;
      for (let k = 0; k < RIO_ANCHO; k++) for (const yy of [by, by + 1]) {
        if (n++ >= tablas) continue;
        this.puenteSpr.push(this.add.image((RX + k) * TILE + 16, yy * TILE + 16, 'muelle').setScale(2).setAngle(90).setDepth(-6));
      }
      if (listo) for (const yy of [by, by + 2]) for (const xx of [RX + RIO_ANCHO]) this.puenteSpr.push(this.add.image(xx * TILE - 2, yy * TILE + 4, 'poste').setScale(2).setDepth(yy * TILE));
      if (listo && this.tramoPuente) {
        this.obstaculos.remove(this.tramoPuente.z, true, true);
        this.aguas = this.aguas.filter((a) => a !== this.tramoPuente.a);
        this.tramoPuente = null;
        if (celebrar) {
          this.cameras.main.shake(500, 0.006); this.celebrar(RX * TILE + 48, by * TILE);
          sfx('logro');
          avisoGrande('¡El puente está terminado!', 'Ya pueden cruzar al Bosque profundo', 'Gracias a los aportes de todo el nivel');
        }
      }
      if (this.obraTag) this.obraTag.setText(listo ? 'Puente al Bosque profundo' : `Puente en construcción\n${pct} % · E para aportar`);
      if (this.objObra) this.objObra.listo = listo;
    }
    crearBosqueProfundo(M) {
      const { RX, by } = this.rio, X0 = RX + RIO_ANCHO + 1, X1 = this.ancho - 3;
      for (const k of [...this.ocupado]) { const x = Number(k.split(',')[0]); if (x >= X0) this.ocupado.delete(k); }
      for (let x = X0; x <= X1; x++) { this.marcar(x, by); this.marcar(x, by + 1); }
      for (let y = this.santuario.y; y <= by; y++) { this.marcar(this.santuario.x, y); this.marcar(this.santuario.x, y + 1); }
      // sombra del bosque espeso y luciérnagas que flotan
      this.add.rectangle((RX + RIO_ANCHO) * TILE, 0, (this.ancho - RX - RIO_ANCHO) * TILE, this.alto * TILE, 0x0a1c22, 0.36).setOrigin(0).setDepth(9400);
      this.add.particles(0, 0, 'p_brillo', { x: { min: X0 * TILE, max: X1 * TILE }, y: { min: 2 * TILE, max: (this.alto - 3) * TILE }, lifespan: 4000, frequency: 260, speedX: { min: -10, max: 10 }, speedY: { min: -12, max: 4 }, scale: { start: 0.9, end: 0 }, alpha: { start: 0.9, end: 0 } }).setDepth(9401);
      const lugarP = (alto = 1, ancho = 1) => {
        for (let i = 0; i < 300; i++) {
          const x = X0 + Math.floor(this.rnd() * (X1 - X0)), y = 3 + Math.floor(this.rnd() * (this.alto - 6));
          let ok = true;
          for (let dy = 0; dy < alto && ok; dy++) for (let dx = 0; dx < ancho && ok; dx++) if (!this.libre(x + dx, y - dy)) ok = false;
          if (ok) return [x, y];
        }
        return null;
      };
      const reservar = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 2; dx++) this.marcar(x + dx, y + dy); };
      // santuario: círculo de columnas con musgo, altar y el Rey Jabalí dormido
      const { x: SX, y: SY } = this.santuario;
      for (let y = SY - 5; y <= SY + 3; y++) for (let x = SX - 5; x <= SX + 5; x++) this.marcar(x, y);
      for (const [dx, dy, k] of [[-3, -2, 'columna_musgo'], [3, -2, 'columna_musgo'], [-4, 1, 'columna_rota_musgo'], [4, 1, 'columna_musgo'], [-2, -4, 'columna_rota_musgo'], [2, -4, 'columna_musgo']]) {
        const c = this.sprite(k, SX + dx, SY + dy); this.solido(c.x, c.y - 10, 20, 14);
      }
      const al = this.sprite('altar', SX, SY + 1); this.solido(al.x, al.y - 8, 22, 12);
      const cx = SX * TILE + 16, cy = (SY - 1) * TILE + 30;
      this.rey = this.add.sprite(cx, cy, 'jefe_u1b_hoja', DIRS.down * 9).setOrigin(0.5, 0.92).setScale(2.3).setDepth(cy).setTint(0x8a8a8a);
      this.solido(cx, cy - 16, 50, 26);
      this.reyTag = this.add.text(cx, cy - 136, 'Rey Jabalí Ancestral\n(dormido · sellado)', { fontFamily: 'Fredoka, Nunito, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#ffd27a', stroke: '#12201a', strokeThickness: 4, align: 'center' }).setOrigin(0.5).setResolution(3).setDepth(9999);
      this.sello = this.add.particles(cx, cy - 30, 'p_morado', { x: { min: -60, max: 60 }, y: { min: -40, max: 30 }, lifespan: 1400, frequency: 90, speedY: { min: -20, max: -6 }, scale: { start: 1.2, end: 0 }, alpha: { start: 0.8, end: 0 } }).setDepth(9999);
      this.tweens.add({ targets: this.rey, scaleY: 2.36, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.objetos.push({ tipo: 'santuario', x: cx, y: cy + 6, activo: true });
      this.actualizarRey();
      const E = this.estanque;
      for (let y = E.ly - 2; y <= E.ly + E.h + 3; y++) for (let x = E.lx - 2; x <= E.lx + E.w + 1; x++) this.marcar(x, y);
      // enemigos del bosque profundo (antes que la vegetación, para que tengan espacio)
      for (let i = 0; i < 9; i++) {
        const p = lugarP(1); if (!p) break;
        const sp = this.add.image(p[0] * TILE + 16, (p[1] + 1) * TILE, 'arana').setOrigin(0.5, 1).setScale(2);
        sp.setDepth(sp.y);
        this.enemigos.push(this.nuevoEnemigo('arana', sp, { despierto: true, k: `p${i}` }));
      }
      for (let i = 0; i < 8; i++) {
        const p = lugarP(1); if (!p) break;
        const sp = this.add.sprite(p[0] * TILE + 16, (p[1] + 1) * TILE, 'tocon_raiz').setOrigin(0.5, 1).setScale(2);
        sp.setDepth(sp.y);
        this.marcar(p[0], p[1]);
        this.enemigos.push(this.nuevoEnemigo('raiz', sp, { despierto: false, k: `x${i}` }));
      }
      // árboles gigantes (resina, con hacha de hierro), colmenas (miel, con ahumador) y árboles oscuros
      for (let i = 0; i < 18; i++) {
        const p = lugarP(4, 2); if (!p) break;
        const sp = this.sprite('arbol_gigante', p[0], p[1], 0.25);
        const z = this.solido(sp.x + 16, sp.y - 14, 34, 18);
        reservar(p[0], p[1]);
        for (let dy = 1; dy <= 3; dy++) { this.marcar(p[0], p[1] - dy); this.marcar(p[0] + 1, p[1] - dy); }
        this.objetos.push({ tipo: 'arbol', key: 'arbol_gigante', nombre: 'árbol gigante', rec: 'resina', req: 'hacha2', texTocon: 'tronco_gigante', texBrote: 'tronco_gigante', s: sp, z, x: sp.x + 16, y: sp.y - 8, estado: 'arbol', activo: true, bicho: false });
      }
      for (let i = 0; i < 14; i++) {
        const p = lugarP(1); if (!p) break;
        const sp = this.sprite('colmena', p[0], p[1]);
        const z = this.solido(sp.x, sp.y - 8, 20, 12);
        reservar(p[0], p[1]);
        this.add.particles(sp.x, sp.y - 22, 'p_brillo', { x: { min: -12, max: 12 }, y: { min: -10, max: 6 }, lifespan: 700, frequency: 260, speedX: { min: -30, max: 30 }, speedY: { min: -20, max: 20 }, scale: { start: 0.6, end: 0.2 }, tint: 0x302010 }).setDepth(sp.y + 1);
        this.objetos.push({ tipo: 'arbol', key: 'colmena', nombre: 'colmena', rec: 'miel', req: 'ahumador', texTocon: 'colmena_vacia', texBrote: 'colmena_vacia', s: sp, z, x: sp.x, y: sp.y - 6, estado: 'arbol', activo: true, bicho: false });
      }
      for (let i = 0; i < 45; i++) {
        const key = this.rnd() < 0.6 ? 'arbol_pino' : 'arbol_redondo';
        const p = lugarP(2); if (!p) break;
        const sp = this.sprite(key, p[0], p[1]).setTint(0x6f9a72);
        const z = this.solido(sp.x, sp.y - 10, 18, 12);
        reservar(p[0], p[1]);
        this.objetos.push({ tipo: 'arbol', key, nombre: key === 'arbol_pino' ? 'pino' : 'roble', s: sp, z, x: sp.x, y: sp.y - 6, estado: 'arbol', activo: true, bicho: this.rnd() < 0.15 });
      }
      for (let i = 0; i < 8; i++) {
        const p = lugarP(1); if (!p) break;
        const sp = this.sprite('cofre', p[0], p[1]);
        const z = this.solido(sp.x, sp.y - 10, 26, 14);
        reservar(p[0], p[1]);
        const conVida = i % 2 === 0;
        let corazon = null;
        if (conVida) { corazon = this.add.image(sp.x, sp.y - 44, 'corazon').setScale(2).setDepth(9999); this.tweens.add({ targets: corazon, y: sp.y - 50, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' }); }
        this.objetos.push({ tipo: 'cofre', s: sp, z, x: sp.x, y: sp.y - 6, activo: true, vida: conVida, corazon });
      }
      for (let r = 0; r < 4; r++) {
        const p = lugarP(2); if (!p) break;
        for (let k = 0; k < 5; k++) {
          const x = p[0] - 2 + Math.floor(this.rnd() * 5), y = p[1] - 1 + Math.floor(this.rnd() * 3);
          if (!this.libre(x, y) || !this.libre(x, y - 1)) continue;
          const sp = this.sprite(this.rnd() < 0.5 ? 'columna_musgo' : 'columna_rota_musgo', x, y);
          this.solido(sp.x, sp.y - 10, 20, 14); this.marcar(x, y); this.marcar(x, y - 1);
        }
      }
      for (let i = 0; i < 60; i++) {
        const p = lugarP(1); if (!p) break;
        const k = this.rnd() < 0.7 ? 'helecho' : 'roca_musgo1';
        const sp = this.sprite(k, p[0], p[1]);
        if (k === 'helecho') sp.setDepth(-5); else { this.solido(sp.x, sp.y - 8, 18, 10); this.marcar(p[0], p[1]); }
      }
    }
    // Rey Jabalí: dormido y sellado (sin amuleto), despierto (listo para luchar) o descansando tras una batalla
    actualizarRey() {
      if (!this.rey) return;
      const descansa = (S.reyHasta || 0) > Date.now(), abierto = tiene('amuleto');
      const despierto = abierto && !descansa;
      this.rey.setTint(despierto ? 0xffffff : 0x8a8a8a);
      if (despierto) this.rey.anims.play('jefe_u1b_down', true); else { this.rey.anims.stop(); this.rey.setFrame(DIRS.down * 9); }
      this.sello.emitting = !abierto;
      this.reyTag.setText(`Rey Jabalí Ancestral\n(${!abierto ? 'sellado: necesitas el amuleto ancestral' : descansa ? `descansa: vuelve en ${Math.ceil(((S.reyHasta || 0) - Date.now()) / 60000)} min` : '¡despierto! E para desafiarlo'})`);
    }
    // ---------- acantilado, montacargas cooperativo y Valle de la Esfinge (Unidad 2) ----------
    planearValle(data, oy) {
      const gx = CENTRO_X, cy0 = oy - 2;
      this.valle = { oy, gx, cy0 };
      for (let y = 0; y < oy; y++) for (let x = 0; x < this.ancho; x++) this.marcar(x, y);
      // caminos del valle: de la esfinge al montacargas y una avenida de este a oeste
      for (let y = 7; y < cy0; y++) data[y][gx] = CAMINO;
      for (let x = 4; x < this.ancho - 4; x++) data[13][x] = CAMINO;
      // el acantilado bloquea el paso (también a los enemigos que caminan); el hueco del montacargas se abre al terminarlo
      const y0 = cy0 * TILE + 4, y1 = oy * TILE - 6;
      const Z = (x0, x1) => { const z = this.add.zone((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0); this.obstaculos.add(z); const a = { x0, y0, x1, y1 }; this.aguas.push(a); return { z, a }; };
      Z(0, gx * TILE); Z((gx + 2) * TILE, this.ancho * TILE);
      this.tramoValle = Z(gx * TILE, (gx + 2) * TILE);
      // poza con palmeras en el valle (decorativa)
      const lx = this.rnd() < 0.5 ? 8 + Math.floor(this.rnd() * 14) : this.ancho - 22 + Math.floor(this.rnd() * 10);
      this.pozaValle = { lx, ly: 16, w: 6, h: 3 };
      this.lago(data, lx, 16, 6, 3, false);
    }
    decorarAcantilado() {
      const { gx, cy0, oy } = this.valle;
      for (let x = 0; x < this.ancho; x++) {
        const hueco = x === gx || x === gx + 1;
        const a = this.add.image(x * TILE + 16, cy0 * TILE + 16, this.rnd() < 0.5 ? 'v_acant_borde' : 'v_acant_borde2').setScale(2).setDepth(cy0 * TILE + 8);
        const b = this.add.image(x * TILE + 16, (cy0 + 1) * TILE + 16, this.rnd() < 0.5 ? 'v_acant_cara' : 'v_acant_cara2').setScale(2).setDepth(oy * TILE - 2);
        if (hueco) (this.huecoSpr = this.huecoSpr || []).push(a, b);
      }
      this.add.rectangle(0, oy * TILE, this.ancho * TILE, 10, 0x000000, 0.18).setOrigin(0).setDepth(-8);
      // obra del montacargas al pie del acantilado
      const ox = gx + 3;
      const le = this.sprite('letrero', ox, oy); this.solido(le.x, le.y - 8, 18, 10);
      const f = this.sprite('cactus_brote1', ox + 1, oy + 1); const r = this.sprite('roca_cafe2', ox + 1, oy); this.sprite('barril', gx - 2, oy);
      this.solido(r.x, r.y - 8, 18, 10); f.setDepth(-5);
      for (let y = oy; y <= oy + 1; y++) for (let x = gx - 2; x <= ox + 1; x++) if (x !== gx) this.marcar(x, y);
      this.obraTag = this.add.text(le.x, le.y - 50, 'Montacargas en construcción', { fontFamily: 'Fredoka, Nunito, sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#ffe9b8', stroke: '#2a1a0c', strokeThickness: 3, align: 'center' }).setOrigin(0.5).setResolution(3).setDepth(9999);
      this.objObra = { tipo: 'obra', x: (gx + 1) * TILE + 16, y: oy * TILE + 16, activo: true };
      this.objetos.push(this.objObra);
      this.montaSpr = [];
      this.actualizarMontacargas();
    }
    actualizarObra(celebrar = false) { if (this.rio) this.actualizarPuente(celebrar); else if (this.valle) this.actualizarMontacargas(celebrar); else if (this.prof) this.actualizarElevador(celebrar); }
    // Avance del montacargas: andamios, poleas y cuerdas aparecen a medida que se aporta; al terminar se abre el paso
    actualizarMontacargas(celebrar = false) {
      if (!this.valle || !this.montaSpr) return;
      const { gx, cy0, oy } = this.valle, listo = valleListo(), pct = pctObra('valle');
      this.montaSpr.forEach((sp) => sp.destroy()); this.montaSpr = [];
      const pon = (key, x, y, prof) => this.montaSpr.push(this.add.image(x * TILE + 16, y * TILE + 16, key).setScale(2).setDepth(prof === undefined ? y * TILE + 20 : prof));
      if (listo) {
        (this.huecoSpr || []).forEach((sp) => sp.setVisible(false));
        for (const x of [gx, gx + 1]) for (const y of [cy0, cy0 + 1]) pon('v_escalon', x, y, -6);
        pon('v_polea', gx - 1, cy0 - 1); pon('v_polea', gx + 2, cy0 - 1);
        for (const x of [gx - 1, gx + 2]) { pon('v_cuerda', x, cy0); pon('v_cuerda', x, cy0 + 1); }
        pon('v_plataforma', gx - 1, oy, -6); pon('v_plataforma', gx + 2, oy - 0, -6);
      } else {
        const etapas = [[5, 'v_andamio', gx, cy0 + 1], [15, 'v_andamio', gx + 1, cy0 + 1], [28, 'v_andamio', gx, cy0], [40, 'v_andamio', gx + 1, cy0],
          [55, 'v_polea', gx, cy0 - 1], [62, 'v_polea', gx + 1, cy0 - 1], [72, 'v_cuerda', gx, cy0], [80, 'v_cuerda', gx + 1, cy0], [90, 'v_plataforma', gx, oy]];
        for (const [p, k, x, y] of etapas) if (pct >= p) pon(k, x, y, k === 'v_plataforma' ? -6 : oy * TILE + 2);
      }
      if (listo && this.tramoValle) {
        this.obstaculos.remove(this.tramoValle.z, true, true);
        this.aguas = this.aguas.filter((a) => a !== this.tramoValle.a);
        this.tramoValle = null;
        if (celebrar) {
          this.cameras.main.shake(500, 0.006); this.celebrar(gx * TILE + 32, oy * TILE);
          sfx('logro');
          avisoGrande('¡El montacargas está terminado!', 'Ya pueden subir al Valle de la Esfinge', 'Gracias a los aportes de todo el nivel');
        }
      }
      if (this.obraTag) this.obraTag.setText(listo ? 'Montacargas al Valle de la Esfinge' : `Montacargas en construcción\n${pct} % · E para aportar`);
      if (this.objObra) this.objObra.listo = listo;
    }
    // ¿Se puede llegar a este punto (en píxeles)? Las zonas tras una obra sin terminar no cuentan
    alcanzable(x, y) {
      if (this.valle && !valleListo() && y < this.valle.oy * TILE) return false;
      if (this.prof && !minaListo() && y > this.prof.yb * TILE) return false;
      if (this.rio && !puenteListo() && x > this.rio.RX * TILE) return false;
      return true;
    }
    crearValle() {
      const { oy, gx, cy0 } = this.valle, X0 = 3, X1 = this.ancho - 4, Y0 = 3, Y1 = cy0 - 1;
      for (const k of [...this.ocupado]) { const y = Number(k.split(',')[1]); if (y < cy0) this.ocupado.delete(k); }
      for (let y = 7; y < cy0; y++) { this.marcar(gx, y); this.marcar(gx, y + 1); }
      for (let x = 4; x < this.ancho - 4; x++) { this.marcar(x, 13); this.marcar(x, 14); }
      for (let y = cy0 - 1; y < cy0; y++) for (let x = gx - 2; x <= gx + 3; x++) this.marcar(x, y);
      const Pz = this.pozaValle;
      for (let y = Pz.ly - 1; y <= Pz.ly + Pz.h; y++) for (let x = Pz.lx - 1; x <= Pz.lx + Pz.w; x++) this.marcar(x, y);
      this.add.rectangle(0, 0, this.ancho * TILE, cy0 * TILE, 0x8a4a18, 0.13).setOrigin(0).setDepth(-9);
      const lugarV = (alto = 1, ancho = 1, y0 = Y0, y1 = Y1) => {
        for (let i = 0; i < 300; i++) {
          const x = X0 + Math.floor(this.rnd() * (X1 - X0 - ancho)), y = y0 + alto - 1 + Math.floor(this.rnd() * Math.max(1, y1 - y0 - alto + 1));
          let ok = true;
          for (let dy = 0; dy < alto && ok; dy++) for (let dx = 0; dx < ancho && ok; dx++) if (!this.libre(x + dx, y - dy)) ok = false;
          if (ok) return [x, y];
        }
        return null;
      };
      const reservar = (x, y, w = 1, h = 1) => { for (let dy = -h; dy <= 1; dy++) for (let dx = -1; dx <= w; dx++) this.marcar(x + dx, y + dy); };
      // la Gran Esfinge con la entrada al laberinto entre sus patas
      const ex = gx * TILE + 16, ey = 7 * TILE;
      const esf = this.add.image(ex, ey, 'v_esfinge').setOrigin(0.5, 1).setScale(2).setDepth(ey);
      this.solido(ex - 44, ey - 44, 40, 80); this.solido(ex + 44, ey - 44, 40, 80); this.solido(ex, ey - 70, 50, 40);
      for (let y = 3; y <= 6; y++) for (let x = gx - 3; x <= gx + 3; x++) this.marcar(x, y);
      this.add.text(ex, ey - 110, 'Gran Esfinge', { fontFamily: 'Fredoka, Nunito, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#ffd27a', stroke: '#2a1a0c', strokeThickness: 4 }).setOrigin(0.5).setResolution(3).setDepth(9999);
      this.add.particles(ex, ey - 30, 'p_brillo', { x: { min: -10, max: 10 }, lifespan: 1200, frequency: 300, speedY: { min: -20, max: -5 }, scale: { start: 0.8, end: 0 }, alpha: { start: 0.8, end: 0 } }).setDepth(ey + 1);
      this.objetos.push({ tipo: 'esfinge', x: ex, y: ey + 6, activo: true });
      for (const dx of [-3, 3]) { const c = this.sprite('v_estatua_chacal', gx + dx, 6); this.solido(c.x, c.y - 10, 18, 14); }
      // avenida de obeliscos y antorchas
      for (const y of [9, 11, 17, 19]) for (const dx of [-1, 1]) {
        if (y >= cy0 - 1) continue;
        const k = y % 4 === 1 ? 'v_obelisco' : 'v_antorcha_obsidiana';
        const sp = this.sprite(k, gx + dx, y); this.solido(sp.x, sp.y - 8, 16, 12); this.marcar(gx + dx, y);
        if (k === 'v_antorcha_obsidiana') this.add.particles(sp.x, sp.y - 26, 'p_rojo', { lifespan: 500, frequency: 140, speedY: { min: -30, max: -10 }, scale: { start: 0.8, end: 0 }, alpha: { start: 0.9, end: 0 } }).setDepth(sp.y + 1);
      }
      // tumbas excavadas en la pared norte
      for (let i = 0; i < 5; i++) {
        const x = 5 + Math.floor((i + 0.5) * (this.ancho - 10) / 5 + (this.rnd() - 0.5) * 4);
        if (Math.abs(x - gx) < 6) continue;
        if (!this.libre(x, 3) || !this.libre(x + 1, 3)) continue;
        const t = this.sprite('v_entrada_tumba', x, 3, 0.25); this.solido(t.x + 16, t.y - 20, 60, 36);
        reservar(x, 3, 2, 2);
      }
      // poza con palmeras y papiros
      for (let k = 0; k < 9; k++) {
        const x = Pz.lx - 1 + Math.floor(this.rnd() * (Pz.w + 2)), y = this.rnd() < 0.5 ? Pz.ly - 2 : Pz.ly + Pz.h + 1;
        if (!this.libre(x, y)) continue;
        const pal = this.rnd() < 0.5;
        const sp = this.sprite(pal ? 'v_palmera' : 'v_papiro', x, y);
        if (pal) this.solido(sp.x, sp.y - 8, 16, 10); else sp.setDepth(-5);
        this.marcar(x, y);
      }
      // pirámides y esqueletos de dinosaurio medio enterrados
      for (const [k, w, n] of [['v_piramide', 3, 2], ['v_esqueleto_dino', 3, 3]]) for (let i = 0; i < n; i++) {
        const p = lugarV(2, w); if (!p) break;
        const sp = this.sprite(k, p[0], p[1], 1 / 6); this.solido(sp.x + 32, sp.y - 14, w * TILE - 12, 26);
        reservar(p[0], p[1], w, 2);
      }
      // sitios de excavación
      for (let i = 0; i < 10; i++) {
        const p = lugarV(1, 2); if (!p) break;
        const sp = this.sprite('v_sitio', p[0], p[1], 0.25).setDepth(-4);
        reservar(p[0], p[1], 2, 1);
        this.objetos.push({ tipo: 'sitio', s: sp, x: sp.x + 16, y: sp.y - 10, activo: true, estado: 'listo' });
      }
      // vetas de obsidiana (pico de cobre)
      for (let i = 0; i < 16; i++) {
        const p = lugarV(1); if (!p) break;
        const sp = this.sprite('veta_obsidiana2', p[0], p[1]);
        const z = this.solido(sp.x, sp.y - 12, 26, 18);
        reservar(p[0], p[1]);
        this.objetos.push({ tipo: 'roca', base: 'veta_obsidiana', rec: 'obsidiana', req: 'pico3', extra: 'oro', evento: 'obsidiana', nombre: 'veta de obsidiana', s: sp, z, x: sp.x, y: sp.y - 8, nivel: 2, nivelMax: 2, activo: true });
      }
      // ruinas con jeroglíficos y sarcófagos
      for (let r = 0; r < 5; r++) {
        const p = lugarV(2); if (!p) break;
        for (let k = 0; k < 5; k++) {
          const x = p[0] - 2 + Math.floor(this.rnd() * 5), y = p[1] - 1 + Math.floor(this.rnd() * 3);
          if (!this.libre(x, y) || !this.libre(x, y - 1)) continue;
          const sp = this.sprite(this.rnd() < 0.5 ? 'v_columna_jero' : 'v_columna_jero_rota', x, y);
          this.solido(sp.x, sp.y - 10, 18, 14); this.marcar(x, y); this.marcar(x, y - 1);
        }
      }
      // cofres
      for (let i = 0; i < 6; i++) {
        const p = lugarV(1); if (!p) break;
        const sp = this.sprite('cofre', p[0], p[1]);
        const z = this.solido(sp.x, sp.y - 10, 26, 14);
        reservar(p[0], p[1]);
        const conVida = i % 2 === 0;
        let corazon = null;
        if (conVida) { corazon = this.add.image(sp.x, sp.y - 44, 'corazon').setScale(2).setDepth(sp.y + 1); this.tweens.add({ targets: corazon, y: sp.y - 50, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' }); }
        this.objetos.push({ tipo: 'cofre', s: sp, z, x: sp.x, y: sp.y - 6, activo: true, vida: conVida, corazon });
      }
      // enemigos del valle: escarabajos y momias dormidas en sus sarcófagos
      for (let i = 0; i < 9; i++) {
        const p = lugarV(1, 1, 8); if (!p) break;
        const sp = this.add.image(p[0] * TILE + 16, (p[1] + 1) * TILE, 'v_escarabajo').setOrigin(0.5, 1).setScale(2);
        sp.setDepth(sp.y);
        this.enemigos.push(this.nuevoEnemigo('escarabajo', sp, { despierto: true, k: `v${i}` }));
      }
      for (let i = 0; i < 7; i++) {
        const p = lugarV(2, 1, 4); if (!p) break;
        const sp = this.add.sprite(p[0] * TILE + 16, (p[1] + 1) * TILE, 'v_sarcofago').setOrigin(0.5, 1).setScale(2);
        sp.setDepth(sp.y);
        this.marcar(p[0], p[1]); this.marcar(p[0], p[1] - 1);
        this.enemigos.push(this.nuevoEnemigo('momia', sp, { despierto: false, k: `m${i}` }));
      }
      // adornos sueltos
      for (let i = 0; i < 40; i++) {
        const p = lugarV(1); if (!p) break;
        const k = ['v_papiro', 'd_calavera', 'd_huesos', 'v_palmera', 'd_vasija', 'monticulo'][Math.floor(this.rnd() * 6)];
        const sp = this.sprite(k, p[0], p[1]);
        if (['v_papiro', 'd_calavera', 'd_huesos', 'monticulo'].includes(k)) sp.setDepth(-5); else { this.solido(sp.x, sp.y - 8, 16, 10); this.marcar(p[0], p[1]); }
      }
      this.objetos.forEach((o, i) => { o.idx = i; });
    }
    // Un sitio excavado queda vacío unos minutos
    sitioExcavado(o) {
      o.estado = 'vacio'; o.s.setTexture('v_sitio_vacio');
      if (o.timer) o.timer.remove(false);
      o.timer = this.time.delayedCall(180000, () => { o.estado = 'listo'; o.s.setTexture('v_sitio'); });
    }
    // ---------- fosa, elevador cooperativo y Profundidades de la mina (Unidad 3) ----------
    planearProfundidades(data, fc) {
      const yb = MAPA_H, gx = CENTRO_X, y0 = yb + 2, RIEL = fc(10, 7);
      this.prof = { yb, gx, y0, fila: y0 + 9 };
      for (let y = yb; y < this.alto; y++) for (let x = 0; x < this.ancho; x++) this.marcar(x, y);
      const zy0 = yb * TILE + 4, zy1 = (yb + 2) * TILE - 4;
      const Z = (x0, x1) => { const z = this.add.zone((x0 + x1) / 2, (zy0 + zy1) / 2, x1 - x0, zy1 - zy0); this.obstaculos.add(z); const a = { x0, y0: zy0, x1, y1: zy1 }; this.aguas.push(a); return { z, a }; };
      Z(0, gx * TILE); Z((gx + 2) * TILE, this.ancho * TILE);
      this.tramoMina = Z(gx * TILE, (gx + 2) * TILE);
      // túnel de rieles de este a oeste en las profundidades
      for (let x = 4; x < this.ancho - 4; x++) data[this.prof.fila][x] = RIEL;
      // pozas de lava (no se pueden cruzar)
      this.lavas = [];
      for (let i = 0; i < 4; i++) {
        const w = 4 + Math.floor(this.rnd() * 3), h = 3;
        for (let t = 0; t < 80; t++) {
          const lx = 5 + Math.floor(this.rnd() * (this.ancho - w - 10)), ly = y0 + 1 + Math.floor(this.rnd() * (this.alto - y0 - h - 5));
          if (Math.abs(ly - this.prof.fila) < 3 + h && ly <= this.prof.fila + 1 && ly + h >= this.prof.fila - 1) continue;
          if (lx <= gx + 2 && lx + w >= gx - 1) continue;
          if (this.lavas.some((L) => lx < L.lx + L.w + 3 && lx + w + 3 > L.lx && ly < L.ly + L.h + 3 && ly + h + 3 > L.ly)) continue;
          if (lx + w > this.ancho - 18 && ly + h > this.alto - 14) continue;   // la cámara del coloso
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data[ly + y][lx + x] = fc(x === 0 ? 0 : x === w - 1 ? 2 : 1, y === 0 ? 10 : y === h - 1 ? 13 : 11);
          this.obstaculos.add(this.add.zone((lx + w / 2) * TILE, (ly + h / 2) * TILE, w * TILE - 20, h * TILE - 20));
          this.aguas.push({ x0: lx * TILE + 10, y0: ly * TILE + 10, x1: (lx + w) * TILE - 10, y1: (ly + h) * TILE - 10 });
          this.lavas.push({ lx, ly, w, h });
          break;
        }
      }
    }
    decorarFosa() {
      const { yb, gx } = this.prof;
      for (let x = 0; x < this.ancho; x++) {
        const hueco = x === gx || x === gx + 1;
        const a = this.add.image(x * TILE + 16, yb * TILE + 16, this.rnd() < 0.5 ? 'a_pared_borde' : 'a_pared_borde2').setScale(2).setDepth(yb * TILE + 8);
        const b = this.add.image(x * TILE + 16, (yb + 1) * TILE + 16, this.rnd() < 0.5 ? 'a_pared_cara' : 'a_pared_cara2').setScale(2).setDepth((yb + 2) * TILE - 2);
        if (hueco) (this.huecoMina = this.huecoMina || []).push(a, b);
      }
      // obra del elevador junto a la fosa
      const ox = gx + 3, oy = yb - 1;
      const le = this.sprite('letrero', ox, oy); this.solido(le.x, le.y - 8, 18, 10);
      const c1 = this.sprite('d_cajones_mina', ox + 1, oy); this.solido(c1.x, c1.y - 8, 18, 10); this.sprite('barril', gx - 2, oy);
      for (let x = gx - 2; x <= ox + 1; x++) if (x !== gx) { this.marcar(x, oy); this.marcar(x, oy - 1); }
      this.obraTag = this.add.text(le.x, le.y - 50, 'Elevador en construcción', { fontFamily: 'Fredoka, Nunito, sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#ffe9b8', stroke: '#2a1a0c', strokeThickness: 3, align: 'center' }).setOrigin(0.5).setResolution(3).setDepth(9999);
      this.objObra = { tipo: 'obra', x: (gx + 1) * TILE + 16, y: (yb - 1) * TILE + 16, activo: true };
      this.objetos.push(this.objObra);
      this.add.image((gx + 1) * TILE, yb * TILE, 'luz').setScale(1.3).setTint(0xff8a40).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.22).setDepth(9501);
      this.elevSpr = [];
      this.actualizarElevador();
    }
    actualizarElevador(celebrar = false) {
      if (!this.prof || !this.elevSpr) return;
      const { yb, gx } = this.prof, listo = minaListo(), pct = pctObra('mina');
      this.elevSpr.forEach((sp) => sp.destroy()); this.elevSpr = [];
      const pon = (key, x, y, prof) => this.elevSpr.push(this.add.image(x * TILE + 16, y * TILE + 16, key).setScale(2).setDepth(prof === undefined ? 9502 : prof));
      if (listo) {
        (this.huecoMina || []).forEach((sp) => sp.setVisible(false));
        for (const x of [gx, gx + 1]) for (const y of [yb, yb + 1]) pon('v_plataforma', x, y, -6);
        this.elevSpr.push(this.add.image((gx + 1) * TILE, (yb + 1) * TILE, 'a_jaula').setScale(2).setDepth(-5).setAlpha(0.9));
        pon('v_polea', gx - 1, yb - 1); pon('v_polea', gx + 2, yb - 1);
        for (const x of [gx - 1, gx + 2]) { pon('v_cuerda', x, yb); pon('v_cuerda', x, yb + 1); }
      } else {
        const etapas = [[5, 'v_andamio', gx, yb + 1], [15, 'v_andamio', gx + 1, yb + 1], [28, 'v_andamio', gx, yb], [40, 'v_andamio', gx + 1, yb],
          [55, 'v_polea', gx, yb - 1], [62, 'v_polea', gx + 1, yb - 1], [72, 'v_cuerda', gx, yb], [80, 'v_cuerda', gx + 1, yb], [90, 'v_plataforma', gx, yb - 1]];
        for (const [p, k, x, y] of etapas) if (pct >= p) pon(k, x, y, k === 'v_plataforma' ? -6 : (yb + 2) * TILE);
      }
      if (listo && this.tramoMina) {
        this.obstaculos.remove(this.tramoMina.z, true, true);
        this.aguas = this.aguas.filter((a) => a !== this.tramoMina.a);
        this.tramoMina = null;
        if (celebrar) {
          this.cameras.main.shake(500, 0.006); this.celebrar(gx * TILE + 32, yb * TILE);
          sfx('logro');
          avisoGrande('¡El elevador está terminado!', 'Ya pueden bajar a las Profundidades', 'Gracias a los aportes de todo el nivel');
        }
      }
      if (this.obraTag) this.obraTag.setText(listo ? 'Elevador a las Profundidades' : `Elevador en construcción\n${pct} % · E para aportar`);
      if (this.objObra) this.objObra.listo = listo;
    }
    // Estación de vagonetas: aquí empiezan las carreras entre los jugadores del grupo
    crearEstacion() {
      const { x: ex, y: ey } = this.estacion;
      for (let x = ex - 2; x <= ex + 2; x++) this.add.image(x * TILE + 16, ey * TILE + 16, 'd_rieles').setScale(2).setAngle(90).setDepth(-6);
      const v = this.sprite('a_vagoneta', ex, ey); this.solido(v.x, v.y - 8, 26, 12);
      const v2 = this.sprite('a_vagoneta', ex - 1, ey).setTint(0xb0d0ff); this.solido(v2.x, v2.y - 8, 26, 12);
      const le = this.sprite('letrero', ex + 2, ey - 1); this.solido(le.x, le.y - 8, 18, 10);
      this.add.text(v.x - 16, v.y - 60, 'Carreras de vagonetas', { fontFamily: 'Fredoka, Nunito, sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#ffe9b8', stroke: '#2a1a0c', strokeThickness: 3 }).setOrigin(0.5).setResolution(3).setDepth(9999);
      this.add.image(v.x - 16, v.y - 20, 'luz').setScale(1.2).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.28).setDepth(9501);
      this.objetos.push({ tipo: 'carrera', x: v.x - 16, y: v.y + 4, activo: true });
    }
    crearProfundidades() {
      const { yb, gx, y0, fila } = this.prof;
      for (const k of [...this.ocupado]) { const y = Number(k.split(',')[1]); if (y >= y0) this.ocupado.delete(k); }
      for (let y = y0; y < this.alto; y++) { this.marcar(gx, y); this.marcar(gx, y + 1); }
      for (let x = 4; x < this.ancho - 4; x++) { this.marcar(x, fila); this.marcar(x, fila + 1); this.add.image(x * TILE + 16, fila * TILE + 16, 'd_rieles').setScale(2).setAngle(90).setDepth(-7); }
      for (const L of this.lavas) for (let y = L.ly - 1; y <= L.ly + L.h; y++) for (let x = L.lx - 1; x <= L.lx + L.w; x++) this.marcar(x, y);
      const H0 = yb * TILE;
      this.add.rectangle(0, H0, this.ancho * TILE, this.alto * TILE - H0, 0x5a1800, 0.2).setOrigin(0).setDepth(-9);
      this.add.rectangle(0, H0, this.ancho * TILE, this.alto * TILE - H0, 0x120200, 0.22).setOrigin(0).setDepth(9500);
      // lava: brillo naranja y chispas
      for (const L of this.lavas) {
        const cx = (L.lx + L.w / 2) * TILE, cy = (L.ly + L.h / 2) * TILE;
        const r = this.add.rectangle(L.lx * TILE + 6, L.ly * TILE + 6, L.w * TILE - 12, L.h * TILE - 12, 0xff5a10, 0.75).setOrigin(0).setDepth(-8);
        this.tweens.add({ targets: r, alpha: 0.55, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        this.add.image(cx, cy, 'luz').setScale(1.2 + L.w * 0.18).setTint(0xff6a20).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.45).setDepth(9501);
        this.add.particles(cx, cy, 'p_rojo', { x: { min: -L.w * 14, max: L.w * 14 }, y: { min: -20, max: 20 }, speedY: { min: -60, max: -20 }, lifespan: 900, frequency: 120, scale: { start: 0.9, end: 0 } }).setDepth(9502);
      }
      const lugarP = (alto = 1, ancho = 1) => {
        for (let i = 0; i < 300; i++) {
          const x = 3 + Math.floor(this.rnd() * (this.ancho - 6 - ancho)), y = y0 + alto + Math.floor(this.rnd() * (this.alto - y0 - alto - 3));
          let ok = true;
          for (let dy = 0; dy < alto && ok; dy++) for (let dx = 0; dx < ancho && ok; dx++) if (!this.libre(x + dx, y - dy)) ok = false;
          if (ok) return [x, y];
        }
        return null;
      };
      const reservar = (x, y, w = 1, h = 1) => { for (let dy = -h; dy <= 1; dy++) for (let dx = -1; dx <= w; dx++) this.marcar(x + dx, y + dy); };
      const luz = (x, y, col, esc = 0.8, a = 0.3) => this.add.image(x, y, 'luz').setScale(esc).setTint(col).setBlendMode(Phaser.BlendModes.ADD).setAlpha(a).setDepth(9501);
      // cámara del Coloso de Magma (abajo a la derecha)
      const CX = this.ancho - 10, CY = this.alto - 6;
      for (let y = CY - 6; y <= CY + 2; y++) for (let x = CX - 6; x <= CX + 5; x++) this.marcar(x, y);
      for (let y = fila; y <= CY; y++) { this.marcar(CX, y); }
      for (const [dx, dy, k] of [[-4, -3, 'a_columna_cristal'], [4, -3, 'a_columna_cristal'], [-5, 0, 'a_brasero_magma'], [5, 0, 'a_brasero_magma'], [-3, -5, 'a_estalagmita_magma'], [3, -5, 'a_estalagmita_magma']]) {
        const c = this.sprite(k, CX + dx, CY + dy); this.solido(c.x, c.y - 10, 20, 14);
        luz(c.x, c.y - 20, k.includes('cristal') ? 0x8fd8ff : 0xff7a2a, 0.9, 0.35);
      }
      const cx = CX * TILE + 16, cy = (CY - 1) * TILE + 30;
      this.coloso = this.add.sprite(cx, cy, 'jefe_u3b_hoja', DIRS.down * 9).setOrigin(0.5, 0.92).setScale(2.4).setDepth(9503).setTint(0x7a7a7a);
      this.solido(cx, cy - 16, 52, 26);
      luz(cx, cy - 50, 0xff6a20, 1.8, 0.4);
      this.colosoTag = this.add.text(cx, cy - 140, '', { fontFamily: 'Fredoka, Nunito, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#ffd27a', stroke: '#12201a', strokeThickness: 4, align: 'center' }).setOrigin(0.5).setResolution(3).setDepth(9999);
      this.selloColoso = this.add.particles(cx, cy - 30, 'p_morado', { x: { min: -60, max: 60 }, y: { min: -40, max: 30 }, lifespan: 1400, frequency: 90, speedY: { min: -20, max: -6 }, scale: { start: 1.2, end: 0 }, alpha: { start: 0.8, end: 0 } }).setDepth(9999);
      this.tweens.add({ targets: this.coloso, scaleY: 2.46, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.objetos.push({ tipo: 'coloso', x: cx, y: cy + 6, activo: true });
      this.actualizarColoso();
      // altares de cristal (rompecabezas)
      for (let i = 0; i < 4; i++) {
        const p = lugarP(2); if (!p) break;
        const sp = this.sprite('a_altar_cristal', p[0], p[1]); const z = this.solido(sp.x, sp.y - 10, 22, 14);
        reservar(p[0], p[1], 1, 2);
        const l = luz(sp.x, sp.y - 40, 0x8fd8ff, 1, 0.4);
        this.objetos.push({ tipo: 'altar', s: sp, z, luz: l, x: sp.x, y: sp.y - 4, activo: true, estado: 'listo' });
      }
      // vetas de magma (con guantes térmicos) y cristales resonantes (con el cincel)
      for (let i = 0; i < 16; i++) {
        const p = lugarP(1); if (!p) break;
        const sp = this.sprite('veta_magma2', p[0], p[1]); const z = this.solido(sp.x, sp.y - 12, 26, 18);
        reservar(p[0], p[1]); luz(sp.x, sp.y - 14, 0xff6a20, 0.45, 0.3);
        this.objetos.push({ tipo: 'roca', base: 'veta_magma', rec: 'magma', req: 'guantes', picoBueno: 'pico_magma', extra: 'carbon', evento: 'magma', nombre: 'veta de magma', s: sp, z, x: sp.x, y: sp.y - 8, nivel: 2, nivelMax: 2, activo: true });
      }
      for (let i = 0; i < 16; i++) {
        const p = lugarP(1); if (!p) break;
        const sp = this.sprite('a_cristal_n', p[0], p[1]); const z = this.solido(sp.x, sp.y - 8, 20, 12);
        reservar(p[0], p[1]); luz(sp.x, sp.y - 14, 0x8fd8ff, 0.45, 0.3);
        this.objetos.push({ tipo: 'arbol', key: 'a_cristal_n', nombre: 'cristales resonantes', rec: 'cristal_eco', req: 'cincel', texTocon: 'a_cristal_vacio', texBrote: 'a_cristal_vacio', s: sp, z, x: sp.x, y: sp.y - 6, estado: 'arbol', activo: true, bicho: false });
      }
      // cofres
      for (let i = 0; i < 6; i++) {
        const p = lugarP(1); if (!p) break;
        const sp = this.sprite('cofre', p[0], p[1]); const z = this.solido(sp.x, sp.y - 10, 26, 14);
        reservar(p[0], p[1]);
        const conVida = i % 2 === 0;
        let corazon = null;
        if (conVida) { corazon = this.add.image(sp.x, sp.y - 44, 'corazon').setScale(2).setDepth(9502); this.tweens.add({ targets: corazon, y: sp.y - 50, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' }); }
        this.objetos.push({ tipo: 'cofre', s: sp, z, x: sp.x, y: sp.y - 6, activo: true, vida: conVida, corazon });
      }
      // enemigos: salamandras de magma y gólems de cristal (dormidos, parecen cristales)
      for (let i = 0; i < 9; i++) {
        const p = lugarP(1); if (!p) break;
        const sp = this.add.image(p[0] * TILE + 16, (p[1] + 1) * TILE, 'a_salamandra').setOrigin(0.5, 1).setScale(2); sp.setDepth(sp.y);
        this.enemigos.push(this.nuevoEnemigo('salamandra', sp, { despierto: true, k: `s${i}` }));
      }
      for (let i = 0; i < 7; i++) {
        const p = lugarP(1); if (!p) break;
        const sp = this.add.sprite(p[0] * TILE + 16, (p[1] + 1) * TILE, 'a_cristal_n').setOrigin(0.5, 1).setScale(2); sp.setDepth(sp.y);
        this.marcar(p[0], p[1]);
        this.enemigos.push(this.nuevoEnemigo('golem_cristal', sp, { despierto: false, k: `c${i}` }));
      }
      // adornos: columnas de cristal, geodas, rocas de lava, braseros y cristales flotantes
      for (let i = 0; i < 46; i++) {
        const p = lugarP(2); if (!p) break;
        const k = ['a_columna_cristal', 'a_estalagmita_magma', 'a_roca_lava', 'a_geoda', 'a_brasero_magma', 'a_cristal_flotante', 'd_huesos', 'd_calavera'][Math.floor(this.rnd() * 8)];
        const sp = this.sprite(k, p[0], p[1]);
        if (k.startsWith('d_')) { sp.setDepth(-5); continue; }
        this.solido(sp.x, sp.y - 8, 18, 10); this.marcar(p[0], p[1]);
        if (k === 'a_brasero_magma') luz(sp.x, sp.y - 18, 0xff7a2a, 0.9, 0.35);
        if (k === 'a_cristal_flotante' || k === 'a_columna_cristal') luz(sp.x, sp.y - 18, 0x9fb8ff, 0.6, 0.25);
      }
      this.objetos.forEach((o, i) => { o.idx = i; });
    }
    actualizarColoso() {
      if (!this.coloso) return;
      const descansa = (S.colosoHasta || 0) > Date.now(), abierto = tiene('corazon_cristal');
      const despierto = abierto && !descansa;
      this.coloso.setTint(despierto ? 0xffffff : 0x7a7a7a);
      if (despierto) this.coloso.anims.play('jefe_u3b_down', true); else { this.coloso.anims.stop(); this.coloso.setFrame(DIRS.down * 9); }
      this.selloColoso.emitting = !abierto;
      this.colosoTag.setText(`Coloso de Magma\n(${!abierto ? 'sellado: necesitas el corazón de cristal' : descansa ? `descansa: vuelve en ${Math.ceil(((S.colosoHasta || 0) - Date.now()) / 60000)} min` : '¡despierto! E para desafiarlo'})`);
    }
    altarUsado(o) {
      o.estado = 'vacio'; o.s.setTint(0x666688); if (o.luz) o.luz.setAlpha(0.08);
      if (o.timer) o.timer.remove(false);
      o.timer = this.time.delayedCall(180000, () => { o.estado = 'listo'; o.s.clearTint(); if (o.luz) o.luz.setAlpha(0.4); });
    }
    portal(tx, ty) {
      const p = this.add.image(tx * TILE + TILE / 2, ty * TILE + TILE / 2, 'portal').setScale(3).setDepth(-4);
      this.tweens.add({ targets: p, angle: 360, duration: 9000, repeat: -1 });
      this.add.particles(p.x, p.y, 'p_morado', { speed: { min: 10, max: 40 }, lifespan: 900, frequency: 120, scale: { start: 1.2, end: 0 }, alpha: { start: 0.9, end: 0 } }).setDepth(-3);
      const l = this.sprite('letrero', tx - 1, ty);
      this.solido(l.x, l.y - 8, 20, 12);
      this.objetos.push({ tipo: 'portal', x: p.x, y: p.y, activo: true });
      for (let y = ty - 2; y <= ty + 2; y++) for (let x = tx - 2; x <= tx + 2; x++) this.marcar(x, y);
      return p;
    }

    // ---------- base personal ----------
    crearBase() {
      this.ancho = 26; this.alto = 18;
      this.rnd = azar(5);
      const data = [];
      for (let y = 0; y < this.alto; y++) {
        const fila = [];
        for (let x = 0; x < this.ancho; x++) fila.push(this.rnd() < 0.18 ? fr(5, 1) : fr(5, 0));
        data.push(fila);
      }
      for (let x = 6; x <= 20; x++) data[11][x] = CAMINO;
      for (let y = 8; y <= 11; y++) data[y][12] = CAMINO;
      this.suelo(data);
      this.bordes();
      // fogata (fabricar y descansar), cofre y portal
      this.fogata = this.sprite('fogata', 12, 7);
      this.solido(this.fogata.x, this.fogata.y - 10, 24, 14);
      this.add.particles(this.fogata.x, this.fogata.y - 22, 'p_brillo', { speedY: { min: -40, max: -20 }, speedX: { min: -8, max: 8 }, lifespan: 700, frequency: 180, scale: { start: 1, end: 0 }, alpha: { start: 0.9, end: 0 } }).setDepth(this.fogata.y + 1);
      this.objetos.push({ tipo: 'fogata', x: this.fogata.x, y: this.fogata.y - 8, activo: true });
      const cofre = this.sprite('cofre', 15, 7);
      this.solido(cofre.x, cofre.y - 10, 26, 14);
      this.objetos.push({ tipo: 'cofre_base', x: cofre.x, y: cofre.y - 8, activo: true });
      for (let y = 5; y <= 9; y++) for (let x = 10; x <= 16; x++) this.marcar(x, y);
      this.portal(21, 11);
      for (let x = 2; x < this.ancho - 2; x++) this.marcar(x, 11);
      // objetos colocados por el estudiante
      this.limites = { x0: 2, y0: 2, x1: this.ancho - 3, y1: this.alto - 3 };
      this.ocupadoPiso = new Set(); this.ocupadoPared = new Set();
      (S.colocados || []).forEach((c) => this.dibujarColocado(c));
      this.inicio = this.desde && this.desde !== 'muerte' ? { x: 20 * TILE + 16, y: 12 * TILE + 24 } : { x: 12 * TILE + 16, y: 9 * TILE + 20 };
      if (this.desde === 'pieza' && this.carpa && !this.ocupado.has(`${this.carpa.x},${this.carpa.y + 1}`) && this.carpa.y + 1 <= this.limites.y1) {
        this.inicio = { x: this.carpa.x * TILE, y: (this.carpa.y + 1) * TILE + 26 };
      }
    }

    // ---------- pieza (dentro de la carpa) ----------
    crearPieza() {
      // Pieza amplia: el suelo va de x = 1..X1 e y = 3..Y1; la salida está abajo al centro
      const X1 = 24, Y1 = 15;
      this.ancho = X1 + 2; this.alto = Y1 + 2;
      this.rnd = azar(9);
      const PISO = fr(8, 2), PX = Math.floor(this.ancho / 2) - 1, YP = Y1 + 1;
      const data = [];
      for (let y = 0; y < this.alto; y++) {
        const fila = [];
        for (let x = 0; x < this.ancho; x++) fila.push((x >= 1 && x <= X1 && y >= 3 && y <= Y1) || (x === PX && y === YP) ? PISO : -1);
        data.push(fila);
      }
      this.suelo(data);
      const W = this.ancho * TILE, H = this.alto * TILE;
      // paredes: tapiz arriba, madera oscura alrededor
      for (let y = 1; y <= 2; y++) for (let x = 1; x <= X1; x++) this.add.image(x * TILE + 16, y * TILE + 16, 'tapiz_pared').setScale(2).setDepth(-9);
      const g = this.add.graphics().setDepth(-8);
      g.fillStyle(0x3b2618, 1);
      g.fillRect(0, 0, W, TILE); g.fillRect(0, 0, TILE, H); g.fillRect(W - TILE, 0, TILE, H);
      g.fillRect(0, YP * TILE, PX * TILE, TILE); g.fillRect((PX + 1) * TILE, YP * TILE, W - (PX + 1) * TILE, TILE);
      g.fillStyle(0x24160d, 1); g.fillRect(TILE, 3 * TILE - 4, X1 * TILE, 5);
      g.fillStyle(0x5a3a22, 1);
      g.fillRect(TILE - 4, TILE - 4, X1 * TILE + 8, 4); g.fillRect(TILE - 4, TILE - 4, 4, (YP - 1) * TILE + 8); g.fillRect((X1 + 1) * TILE, TILE - 4, 4, (YP - 1) * TILE + 8);
      g.fillRect(TILE - 4, YP * TILE, (PX - 1) * TILE + 4, 4); g.fillRect((PX + 1) * TILE, YP * TILE, (X1 - PX) * TILE + 4, 4);
      // salida
      this.add.image(PX * TILE + 16, YP * TILE + 16, 'd_alf_oval').setScale(1.4, 2).setDepth(-7).setAlpha(0.9);
      this.add.text(PX * TILE + 16, YP * TILE + 16, 'SALIDA', { fontFamily: 'Fredoka, Nunito, sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#fff3d6', stroke: '#24160d', strokeThickness: 3 }).setOrigin(0.5).setResolution(3).setDepth(-6);
      this.solido(W / 2, (3 * TILE - 6) / 2, W, 3 * TILE - 6);
      this.solido(TILE / 2, H / 2, TILE, H); this.solido(W - TILE / 2, H / 2, TILE, H);
      this.solido((PX * TILE) / 2, (YP + 0.5) * TILE, PX * TILE, TILE); this.solido((W + (PX + 1) * TILE) / 2, (YP + 0.5) * TILE, W - (PX + 1) * TILE, TILE);
      this.objetos.push({ tipo: 'puerta', x: PX * TILE + 16, y: YP * TILE + 6, activo: true });
      this.limites = { x0: 1, y0: 3, x1: X1, y1: Y1 };
      this.ocupadoPiso = new Set(); this.ocupadoPared = new Set();
      this.marcar(PX, Y1); this.ocupadoPiso.add(`${PX},${Y1}`);
      (S.pieza || []).forEach((c) => this.dibujarColocado(c));
      this.inicio = { x: PX * TILE + 16, y: Y1 * TILE + 26 };
    }

    // ---------- objetos colocados (base y pieza) ----------
    // (x, y) es la casilla de abajo a la derecha del objeto
    celdas(o, x, y) {
      const [, , w, h] = o.t, filas = o.pared ? h : o.piso ? h : (o.pie || 1), out = [];
      for (let dy = 0; dy < filas; dy++) for (let dx = 0; dx < w; dx++) out.push([x - dx, y - dy]);
      return out;
    }
    conjunto(o) { return o.pared ? this.ocupadoPared : o.piso ? this.ocupadoPiso : this.ocupado; }
    dibujarColocado(c) {
      const o = OBJ[c.k]; if (!o) return;
      const [, , w, h] = o.t, pie = o.pie || 1;
      const s = this.sprite(o.tex, c.x, c.y, 1 - 1 / (2 * w));
      if (o.piso) s.setDepth(-5); else if (o.pared) s.setDepth(-6);
      const cx = (c.x + 1) * TILE - w * 16;
      let z = null;
      if (!o.piso && !o.pared && !o.paso) {
        const alto = o.carpa ? 28 : pie * TILE - 12;
        z = this.solido(cx, (c.y + 1) * TILE - 2 - alto / 2, o.carpa ? 56 : Math.max(20, w * TILE - 10), alto);
      }
      const celdas = this.celdas(o, c.x, c.y), set = this.conjunto(o);
      celdas.forEach(([x, y]) => set.add(`${x},${y}`));
      const y = o.pared ? 3 * TILE - 4 : o.piso ? (c.y + 1) * TILE - (h * TILE) / 2 : (c.y + 1) * TILE - 10 - (pie - 1) * 16;
      let extra = null;
      if (o.brillo) {
        // los objetos de luciérnagas brillan y sueltan chispitas
        const by = (c.y + 1) * TILE - h * 16;
        const halo = this.add.image(cx, by, 'luz').setScale(0.36 + 0.12 * Math.max(w, h)).setTint(typeof o.brillo === 'number' ? o.brillo : 0xd8ff7a).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.24).setDepth(o.piso ? -4 : s.depth + 1);
        this.tweens.add({ targets: halo, alpha: 0.16, duration: 900 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        const chispas = this.add.particles(cx, by, 'p_brillo', { x: { min: -w * 12, max: w * 12 }, y: { min: -h * 10, max: h * 10 }, lifespan: 1300, frequency: 520, speedY: { min: -14, max: -4 }, speedX: { min: -8, max: 8 }, scale: { start: 0.9, end: 0 }, alpha: { start: 1, end: 0 } }).setDepth(s.depth + 2);
        extra = [halo, chispas];
      }
      this.objetos.push({ tipo: 'colocado', c, s, z, extra, x: cx, y, activo: true, nombre: o.nombre, carpa: Boolean(o.carpa), piso: Boolean(o.piso), celdas, set });
    }
    colocar(id) {
      const o = OBJ[id];
      const [, , w, h] = o.t;
      const L = this.limites;
      const lista = this.zona === 'pieza' ? (S.pieza = S.pieza || []) : (S.colocados = S.colocados || []);
      const tjx = Math.floor(this.jugador.x / TILE), tjy = Math.floor((this.jugador.y - 4) / TILE);
      let tx, ty;
      if (o.pared) {
        if (this.zona !== 'pieza' || tjy !== L.y0 || this.dir !== 'up') { toast('Esto se cuelga en la pared: párate junto a la pared de arriba y mira hacia ella.', 'alerta'); return false; }
        tx = tjx; ty = 2;
        if (tx - w + 1 < L.x0 && tx + w - 1 <= L.x1) tx = L.x0 + w - 1;
      } else {
        const filas = o.piso ? h : (o.pie || 1);
        tx = this.dir === 'right' ? tjx + w : this.dir === 'left' ? tjx - 1 : tjx + Math.floor((w - 1) / 2);
        ty = this.dir === 'up' ? tjy - 1 : this.dir === 'down' ? tjy + filas : tjy;
      }
      const celdas = this.celdas(o, tx, ty), set = this.conjunto(o);
      const fuera = ([x, y]) => x < L.x0 || x > L.x1 || (o.pared ? y < 1 || y > 2 : y < L.y0 || y > L.y1);
      const bloqueada = ([x, y]) => set.has(`${x},${y}`) || (!o.piso && !o.pared && Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y - 6, x * TILE + 16, y * TILE + 16) < 18);
      if (celdas.some(fuera) || celdas.some(bloqueada) || (!o.piso && !o.pared && ty - h + 1 < 1)) {
        toast(o.pared ? 'No hay espacio en esa parte de la pared. Muévete un poco.' : 'No hay espacio libre justo delante. Muévete a un lugar despejado.', 'alerta');
        return false;
      }
      const c = { k: id, x: tx, y: ty }; sfx('colocar');
      lista.push(c);
      this.dibujarColocado(c);
      this.celebrar((tx + 1) * TILE - w * 16, (ty + 1) * TILE - 20);
      return true;
    }
    quitar(obj) {
      if (!obj || !obj.activo) return;
      if (this.zona === 'pieza') S.pieza = (S.pieza || []).filter((c) => c !== obj.c);
      else S.colocados = S.colocados.filter((c) => c !== obj.c);
      S.inventario[obj.c.k] = (S.inventario[obj.c.k] || 0) + 1;
      obj.s.destroy(); if (obj.z) obj.z.destroy();
      (obj.extra || []).forEach((x) => x.destroy());
      obj.activo = false;
      obj.celdas.forEach(([x, y]) => obj.set.delete(`${x},${y}`));
      guardar(true);
      toast(`Guardaste: ${obj.nombre}. Puedes volver a colocarlo con Decorar (G).`);
    }
    entrarPieza(obj) {
      ultimaCarpa = { x: obj.c.x, y: obj.c.y };
      S.zona = 'pieza';
      guardar(true);
      this.scene.restart({ zona: 'pieza', desde: 'base' });
    }
    salirPieza() {
      S.zona = 'base';
      guardar(true);
      this.scene.restart({ zona: 'base', desde: 'pieza', carpa: ultimaCarpa });
    }

    // ---------- mundos ----------
    crearMundo(M) {
      if (M.tipo === 'desierto') return this.crearDesierto(M);
      if (M.tipo === 'cueva') return this.crearCueva(M);
      if (M.tipo === 'hielo') return this.crearHielo(M);
      this.ancho = MAPA_W + (M.profundo ? RIO_ANCHO + PROFUNDO_W : 0); this.alto = MAPA_H;
      this.anchoUtil = M.profundo ? MAPA_W - 1 : 0;
      this.rnd = azar(M.semilla + (S.curso === '8basico' ? 100 : 0));
      // suelo: el primero es la base y los demás se pintan en manchas redondeadas
      const data = [];
      const [c0, r0] = M.suelo[0];
      for (let y = 0; y < this.alto; y++) { const fila = []; for (let x = 0; x < this.ancho; x++) fila.push(fr(c0, r0)); data.push(fila); }
      for (const [c, r, p] of M.suelo.slice(1)) {
        let pintado = 0;
        const meta = p * this.ancho * this.alto;
        while (pintado < meta) {
          const cx = Math.floor(this.rnd() * this.ancho), cy = Math.floor(this.rnd() * this.alto), rad = 2 + this.rnd() * 4;
          for (let y = Math.floor(cy - rad); y <= cy + rad; y++) for (let x = Math.floor(cx - rad); x <= cx + rad; x++) {
            if (y < 0 || x < 0 || y >= this.alto || x >= this.ancho) continue;
            if (Math.hypot(x - cx, y - cy) <= rad + (this.rnd() - 0.5)) { if (data[y][x] !== fr(c, r)) pintado++; data[y][x] = fr(c, r); }
          }
        }
      }
      const P = { x: 6, y: PORTAL_Y };
      for (let x = 4; x < this.ancho - 3; x++) data[P.y + 2][x] = CAMINO;
      for (let y = 3; y < this.alto - 3; y++) data[y][CENTRO_X] = CAMINO;
      this.terreno = data;
      for (let y = 0; y < this.alto; y++) for (let x = 0; x < this.ancho; x++) if (data[y][x] === CAMINO) { this.marcar(x, y); this.marcar(x, y + 1); }
      for (let y = P.y - 3; y <= P.y + 4; y++) for (let x = P.x - 3; x <= P.x + 5; x++) this.marcar(x, y);
      if (M.profundo) this.planearProfundo(data, P);
      this.prepararLugaresJefe(P);
      if (M.granLago) this.prepararGranLago(data);
      if (M.profundo) this.lagoMuelle(data, this.estanque, 4, true);
      for (let i = 0; i < M.lagos; i++) {
        const w = 5 + Math.floor(this.rnd() * 5), h = 4 + Math.floor(this.rnd() * 3);
        for (let t = 0; t < 60; t++) {
          const lx = 4 + Math.floor(this.rnd() * (this.ancho - w - 8)), ly = 4 + Math.floor(this.rnd() * (this.alto - h - 8));
          let ok = true;
          for (let y = ly - 1; y <= ly + h && ok; y++) for (let x = lx - 1; x <= lx + w && ok; x++) if (this.ocupado.has(`${x},${y}`)) ok = false;
          if (ok) { this.lago(data, lx, ly, w, h); break; }
        }
      }
      this.suelo(data);
      if (M.tinte) this.add.rectangle(0, 0, this.ancho * TILE, this.alto * TILE, M.tinte[0], M.tinte[1]).setOrigin(0).setDepth(-9);
      (this.muelles || []).forEach((m) => this.decorarGranLago(m));
      if (M.profundo) this.decorarRio();
      this.bordes();
      this.portal(P.x, P.y);
      this.crearGuarida();
      this.inicio = { x: (P.x + 1) * TILE + 16, y: (P.y + 2) * TILE + 20 };

      const lugar = (alto = 2) => {
        for (let i = 0; i < 400; i++) {
          const x = 2 + Math.floor(this.rnd() * (this.ancho - 4)), y = 3 + Math.floor(this.rnd() * (this.alto - 5));
          if (this.libre(x, y) && (alto < 2 || this.libre(x, y - 1))) return [x, y];
        }
        return null;
      };
      const reservar = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) this.marcar(x + dx, y + dy); };
      const nombres = { arbol_manzano: 'manzano', arbol_redondo: 'roble', arbol_pino: 'pino', arbol_otono: 'arce', cactus: 'cactus' };
      for (let i = 0; i < M.nArboles; i++) {
        const key = M.arboles[Math.floor(this.rnd() * M.arboles.length)];
        const p = lugar(key === 'cactus' ? 1 : 2); if (!p) break;
        const s = this.sprite(key, p[0], p[1]);
        const z = this.solido(s.x, s.y - 10, 18, 12);
        reservar(p[0], p[1]);
        this.objetos.push({ tipo: 'arbol', key, nombre: nombres[key], s, z, x: s.x, y: s.y - 6, estado: 'arbol', activo: true, bicho: key !== 'cactus' && this.rnd() < M.bichos });
      }
      for (let i = 0; i < M.nRocas; i++) {
        const p = lugar(1); if (!p) break;
        const base = M.rocas[Math.floor(this.rnd() * M.rocas.length)].replace(/3$/, '');
        const s = this.sprite(base + '3', p[0], p[1]);
        const z = this.solido(s.x, s.y - 10, 26, 16);
        reservar(p[0], p[1]);
        this.objetos.push({ tipo: 'roca', base, s, z, x: s.x, y: s.y - 6, nivel: 3, activo: true });
      }
      for (let i = 0; i < M.cofres; i++) {
        const p = lugar(1); if (!p) break;
        const s = this.sprite('cofre', p[0], p[1]);
        const z = this.solido(s.x, s.y - 10, 26, 14);
        reservar(p[0], p[1]);
        const conVida = i % 2 === 0;
        let corazon = null;
        if (conVida) {
          corazon = this.add.image(s.x, s.y - 44, 'corazon').setScale(2).setDepth(s.y + 1);
          this.tweens.add({ targets: corazon, y: s.y - 50, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        }
        this.objetos.push({ tipo: 'cofre', s, z, x: s.x, y: s.y - 6, activo: true, vida: conVida, corazon });
      }
      // claros del bosque: hongos, arbustos de colores, troncos y rocas con musgo
      const elegirB = (lista) => lista[Math.floor(this.rnd() * lista.length)];
      for (let i = 0; i < 9; i++) {
        const p = lugar(1); if (!p) break;
        for (let k = 0; k < 7; k++) {
          const x = p[0] - 2 + Math.floor(this.rnd() * 5), y = p[1] - 2 + Math.floor(this.rnd() * 5);
          if (!this.libre(x, y)) continue;
          const key = elegirB(['d_hongo', 'd_hongo2', 'd_arbusto_o', 'd_arbusto_f', 'd_arbusto_fl', 'tocon', 'lena', 'd_roca', 'd_flor_a', 'd_flor_m']);
          const sp = this.sprite(key, x, y);
          if (['d_hongo', 'd_hongo2', 'd_flor_a', 'd_flor_m'].includes(key)) sp.setDepth(-5); else this.solido(sp.x, sp.y - 8, 18, 12);
          this.marcar(x, y);
        }
      }
      // campamento de leñadores abandonado
      for (let c = 0; c < 2; c++) {
        const p = lugar(2);
        if (!p || !this.libre(p[0] - 1, p[1]) || !this.libre(p[0] - 1, p[1] - 1)) continue;
        const carpa = this.sprite('carpa_v', p[0], p[1], 0.75); this.solido(carpa.x - 16, carpa.y - 16, 56, 28);
        for (const [dx, dy] of [[-1, 0], [0, 0], [-1, -1], [0, -1]]) this.marcar(p[0] + dx, p[1] + dy);
        for (const [dx, dy, key] of [[2, 0, 'lena'], [2, 1, 'barril'], [-2, 1, 'd_cajon'], [1, 1, 'tocon'], [3, -1, 'letrero']]) {
          const x = p[0] + dx, y = p[1] + dy;
          if (!this.libre(x, y)) continue;
          const sp = this.sprite(key, x, y); this.solido(sp.x, sp.y - 8, 20, 12); this.marcar(x, y);
        }
      }
      for (let i = 0; i < 95; i++) {
        const p = lugar(1); if (!p) break;
        const deco = this.rnd() < 0.7 ? `flor${Math.floor(this.rnd() * 4)}` : 'arbusto2';
        this.sprite(deco, p[0], p[1]).setDepth(deco.startsWith('flor') ? -5 : (p[1] + 1) * TILE);
        this.marcar(p[0], p[1]);
      }
      if (M.profundo) this.crearBosqueProfundo(M);
      this.objetos.forEach((o, i) => { o.idx = i; });
      // Enemigos: arbustos vivos escondidos y nieblas
      for (let i = 0; i < M.arbustos; i++) {
        const p = lugar(1); if (!p) break;
        if (Math.abs(p[0] - P.x) < 8 && Math.abs(p[1] - P.y) < 8) continue;
        const s = this.add.sprite(p[0] * TILE + TILE / 2, (p[1] + 1) * TILE, 'arbusto').setOrigin(0.5, 1).setScale(2);
        s.setDepth(s.y);
        this.marcar(p[0], p[1]);
        this.enemigos.push(this.nuevoEnemigo('arbusto', s, { despierto: false, k: `a${i}` }));
      }
      for (let i = 0; i < M.nieblas; i++) {
        const p = lugar(1); if (!p) break;
        if (Math.abs(p[0] - P.x) < 10 && Math.abs(p[1] - P.y) < 10) continue;
        const s = this.add.sprite(p[0] * TILE + 16, (p[1] + 1) * TILE, 'lobo_hoja', DIRS.down * 9).setOrigin(0.5, 0.9);
        s.setDepth(s.y);
        this.enemigos.push(this.nuevoEnemigo('niebla', s, { despierto: true, k: `n${i}` }));
      }
    }
    // ---------- mundo del desierto (Unidad 2) ----------
    crearDesierto(M) {
      const oy = M.valle ? VALLE_OY : 0;
      this.ancho = MAPA_W; this.alto = MAPA_H + oy; this.yUtil = oy;
      this.rnd = azar(M.semilla + (S.curso === '8basico' ? 100 : 0));
      const ARENA = fr(M.suelo[0][0], M.suelo[0][1]);
      this.pisables = [ARENA, ...M.suelo.slice(1).map(([c, r]) => fr(c, r))];
      const data = [];
      for (let y = 0; y < this.alto; y++) { const fila = []; for (let x = 0; x < this.ancho; x++) fila.push(ARENA); data.push(fila); }
      for (const [c, r, p] of M.suelo.slice(1)) {
        let pintado = 0;
        const meta = p * this.ancho * this.alto;
        while (pintado < meta) {
          const cx = Math.floor(this.rnd() * this.ancho), cy = Math.floor(this.rnd() * this.alto), rad = 2 + this.rnd() * 3;
          for (let y = Math.floor(cy - rad); y <= cy + rad; y++) for (let x = Math.floor(cx - rad); x <= cx + rad; x++) {
            if (y < 0 || x < 0 || y >= this.alto || x >= this.ancho) continue;
            if (Math.hypot(x - cx, y - cy) <= rad + (this.rnd() - 0.5)) { if (data[y][x] !== fr(c, r)) pintado++; data[y][x] = fr(c, r); }
          }
        }
      }
      // ruta de caravanas
      const P = { x: 6, y: PORTAL_Y + oy };
      for (let x = 4; x < this.ancho - 3; x++) data[P.y + 2][x] = CAMINO;
      for (let y = Math.max(3, oy); y < this.alto - 3; y++) data[y][CENTRO_X] = CAMINO;
      this.terreno = data;
      for (let y = 0; y < this.alto; y++) for (let x = 0; x < this.ancho; x++) if (data[y][x] === CAMINO) { this.marcar(x, y); this.marcar(x, y + 1); }
      for (let y = P.y - 3; y <= P.y + 4; y++) for (let x = P.x - 3; x <= P.x + 5; x++) this.marcar(x, y);
      if (M.valle) this.planearValle(data, oy);
      this.prepararLugaresJefe(P);
      // oasis (decorativos: el agua del desierto no se puede recolectar)
      const oasis = [];
      for (let i = 0; i < M.oasis; i++) {
        const w = 4 + Math.floor(this.rnd() * 3), h = 3 + Math.floor(this.rnd() * 2);
        for (let t = 0; t < 60; t++) {
          const lx = 4 + Math.floor(this.rnd() * (this.ancho - w - 8)), ly = 4 + Math.floor(this.rnd() * (this.alto - h - 8));
          let ok = true;
          for (let y = ly - 2; y <= ly + h + 1 && ok; y++) for (let x = lx - 2; x <= lx + w + 1 && ok; x++) if (this.ocupado.has(`${x},${y}`)) ok = false;
          if (ok) { this.lago(data, lx, ly, w, h, false); oasis.push({ lx, ly, w, h }); break; }
        }
      }
      this.suelo(data);
      if (M.tinte) this.add.rectangle(0, 0, this.ancho * TILE, this.alto * TILE, M.tinte[0], M.tinte[1]).setOrigin(0).setDepth(-9);
      this.bordesDesierto();
      if (M.valle) this.decorarAcantilado();
      this.portal(P.x, P.y);
      this.crearGuarida();
      this.inicio = { x: (P.x + 1) * TILE + 16, y: (P.y + 2) * TILE + 20 };

      const lugar = (alto = 1) => {
        for (let i = 0; i < 400; i++) {
          const x = 2 + Math.floor(this.rnd() * (this.ancho - 4)), y = 3 + Math.floor(this.rnd() * (this.alto - 5));
          if (this.libre(x, y) && (alto < 2 || this.libre(x, y - 1))) return [x, y];
        }
        return null;
      };
      const reservar = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) this.marcar(x + dx, y + dy); };
      const elegir = (lista) => lista[Math.floor(this.rnd() * lista.length)];
      // vegetación alrededor de los oasis
      for (const L of oasis) {
        for (let k = 0; k < 8; k++) {
          const x = L.lx - 2 + Math.floor(this.rnd() * (L.w + 4)), y = this.rnd() < 0.5 ? L.ly - 2 : L.ly + L.h + 1;
          if (!this.libre(x, y)) continue;
          const key = elegir(['arbusto', 'arbusto2', 'd_cactus_fruto', 'flor1', 'flor3', 'arbol_redondo']);
          const sp = this.sprite(key, x, y);
          if (key.startsWith('flor')) sp.setDepth(-5); else this.solido(sp.x, sp.y - 10, 18, 12);
          this.marcar(x, y);
        }
      }
      // ruinas de arenisca
      for (let i = 0; i < 8; i++) {
        const p = lugar(2); if (!p) break;
        for (let k = 0; k < 7; k++) {
          const x = p[0] - 2 + Math.floor(this.rnd() * 5), y = p[1] - 1 + Math.floor(this.rnd() * 4);
          if (!this.libre(x, y) || !this.libre(x, y - 1)) continue;
          const key = elegir(['d_columna', 'd_columna', 'd_columna_rota', 'd_escombros', 'd_escombros']);
          const sp = this.sprite(key, x, y);
          this.solido(sp.x, sp.y - 10, 20, 14);
          this.marcar(x, y); this.marcar(x, y - 1);
        }
      }
      // campamentos de caravana abandonados
      for (let c = 0; c < 2; c++) {
        const p = lugar(2);
        if (p && this.libre(p[0] - 1, p[1]) && this.libre(p[0] - 1, p[1] - 1)) {
          const carpa = this.sprite('carpa_b', p[0], p[1], 0.75); this.solido(carpa.x - 16, carpa.y - 16, 56, 28);
          for (const [dx, dy] of [[-1, 0], [0, 0], [-1, -1], [0, -1]]) this.marcar(p[0] + dx, p[1] + dy);
          for (const [dx, dy, key] of [[2, 0, 'barril'], [2, 1, 'd_vasija'], [-2, 1, 'd_brasero'], [1, 1, 'lena'], [3, 0, 'd_vasija'], [-2, 0, 'd_cajon']]) {
            const x = p[0] + dx, y = p[1] + dy;
            if (!this.libre(x, y)) continue;
            const sp = this.sprite(key, x, y); this.solido(sp.x, sp.y - 8, 20, 12); this.marcar(x, y);
          }
        }
      }
      // cactus: dan fibra de cactus (se cortan con el hacha y vuelven a crecer)
      for (let i = 0; i < M.nCactus; i++) {
        const p = lugar(1); if (!p) break;
        const sp = this.sprite('cactus', p[0], p[1]);
        const z = this.solido(sp.x, sp.y - 10, 18, 12);
        reservar(p[0], p[1]);
        this.objetos.push({ tipo: 'arbol', key: 'cactus', nombre: 'cactus', rec: 'fibra', texTocon: 'cactus_brote1', texBrote: 'cactus_brote2', s: sp, z, x: sp.x, y: sp.y - 6, estado: 'arbol', activo: true, bicho: false });
      }
      // rocas de arenisca (pueden soltar cobre)
      for (let i = 0; i < M.nRocas; i++) {
        const p = lugar(1); if (!p) break;
        const sp = this.sprite('roca_cafe3', p[0], p[1]);
        const z = this.solido(sp.x, sp.y - 10, 26, 16);
        reservar(p[0], p[1]);
        this.objetos.push({ tipo: 'roca', base: 'roca_cafe', rec: 'arenisca', extra: 'cobre', nombre: 'roca de arenisca', s: sp, z, x: sp.x, y: sp.y - 6, nivel: 3, nivelMax: 3, activo: true });
      }
      // vetas de cobre y de oro (el oro necesita el pico de cobre)
      for (const [n, base, rec, req, nombre] of [[M.vetasCobre, 'veta_cobre', 'cobre', null, 'veta de cobre'], [M.vetasOro, 'veta_oro', 'oro', 'pico3', 'veta de oro']]) {
        for (let i = 0; i < n; i++) {
          const p = lugar(1); if (!p) break;
          const sp = this.sprite(`${base}2`, p[0], p[1]);
          const z = this.solido(sp.x, sp.y - 14, 28, 22);
          reservar(p[0], p[1]);
          this.objetos.push({ tipo: 'roca', base, rec, req, evento: 'veta', nombre, s: sp, z, x: sp.x, y: sp.y - 8, nivel: 2, nivelMax: 2, activo: true });
        }
      }
      // cofres (la mitad tiene vida)
      for (let i = 0; i < M.cofres; i++) {
        const p = lugar(1); if (!p) break;
        const sp = this.sprite('cofre', p[0], p[1]);
        const z = this.solido(sp.x, sp.y - 10, 26, 14);
        reservar(p[0], p[1]);
        const conVida = i % 2 === 0;
        let corazon = null;
        if (conVida) {
          corazon = this.add.image(sp.x, sp.y - 44, 'corazon').setScale(2).setDepth(sp.y + 1);
          this.tweens.add({ targets: corazon, y: sp.y - 50, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        }
        this.objetos.push({ tipo: 'cofre', s: sp, z, x: sp.x, y: sp.y - 6, activo: true, vida: conVida, corazon });
      }
      // adornos: huesos, calaveras, árboles secos y agujas de roca
      for (let i = 0; i < 58; i++) {
        const p = lugar(1); if (!p) break;
        const key = elegir(['d_calavera', 'd_huesos', 'd_huesos', 'd_arbol_seco', 'd_aguja', 'd_roca_duna', 'escombros_suelo', 'd_cactus_fruto', 'd_vasija']);
        if (key === 'escombros_suelo') { this.sprite('monticulo', p[0], p[1]).setDepth(-5); continue; }
        const sp = this.sprite(key, p[0], p[1]);
        if (key === 'd_calavera' || key === 'd_huesos') sp.setDepth(-5); else { this.solido(sp.x, sp.y - 10, 20, 14); this.marcar(p[0], p[1]); }
      }
      this.objetos.forEach((o, i) => { o.idx = i; });
      // enemigos del desierto
      const lejos = (p, r) => Math.abs(p[0] - P.x) >= r || Math.abs(p[1] - P.y) >= r;
      for (let i = 0; i < M.escorpiones; i++) {
        const p = lugar(1); if (!p) break;
        if (!lejos(p, 8)) continue;
        const sp = this.sprite('monticulo', p[0], p[1]);
        this.marcar(p[0], p[1]);
        this.enemigos.push(this.nuevoEnemigo('escorpion', sp, { despierto: false, k: `e${i}` }));
      }
      for (let i = 0; i < M.remolinos; i++) {
        const p = lugar(1); if (!p) break;
        if (!lejos(p, 10)) continue;
        const sp = this.add.image(p[0] * TILE + 16, p[1] * TILE + 16, 'remolino').setScale(2).setAlpha(0.9).setDepth(9000);
        this.add.particles(0, 0, 'p_arena', { x: { min: -26, max: 26 }, y: { min: -10, max: 24 }, lifespan: 900, frequency: 90, speedX: { min: -40, max: 40 }, speedY: { min: -30, max: 0 }, scale: { start: 1.2, end: 0 }, alpha: { start: 0.8, end: 0 } }).setDepth(9001).startFollow(sp);
        this.tweens.add({ targets: sp, scaleX: 2.2, duration: 260, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        this.enemigos.push(this.nuevoEnemigo('remolino', sp, { despierto: true, k: `r${i}` }));
      }
      for (let i = 0; i < M.esqueletos; i++) {
        const p = lugar(1); if (!p) break;
        if (!lejos(p, 10)) continue;
        const sp = this.add.sprite(p[0] * TILE + 16, (p[1] + 1) * TILE, 'esqueleto_hoja', DIRS.down * 9).setOrigin(0.5, 0.9);
        sp.setDepth(sp.y);
        this.enemigos.push(this.nuevoEnemigo('esqueleto', sp, { despierto: true, k: `q${i}` }));
      }
      if (M.valle) this.crearValle();
    }
    // ---------- mundo de la mina (Unidad 3) ----------
    crearCueva(M) {
      this.ancho = MAPA_W; this.alto = MAPA_H + (M.abismo ? 24 : 0); this.altoUtil = MAPA_H;
      this.rnd = azar(M.semilla + (S.curso === '8basico' ? 100 : 0));
      const fc = (c, r) => r * 29 + c;   // índice en la hoja de la cueva (29 columnas)
      const BASE = fc(M.suelo[0][0], M.suelo[0][1]), RIEL = fc(10, 7);
      this.pisables = [BASE, ...M.suelo.slice(1).map(([c, r]) => fc(c, r))];
      const data = [];
      for (let y = 0; y < this.alto; y++) { const fila = []; for (let x = 0; x < this.ancho; x++) fila.push(BASE); data.push(fila); }
      for (const [c, r, p] of M.suelo.slice(1)) {
        let pintado = 0;
        const meta = p * this.ancho * this.alto;
        while (pintado < meta) {
          const cx = Math.floor(this.rnd() * this.ancho), cy = Math.floor(this.rnd() * this.alto), rad = 1 + this.rnd() * 3;
          for (let y = Math.floor(cy - rad); y <= cy + rad; y++) for (let x = Math.floor(cx - rad); x <= cx + rad; x++) {
            if (y < 0 || x < 0 || y >= this.alto || x >= this.ancho) continue;
            if (Math.hypot(x - cx, y - cy) <= rad + (this.rnd() - 0.5)) { if (data[y][x] !== fc(c, r)) pintado++; data[y][x] = fc(c, r); }
          }
        }
      }
      // túneles principales con rieles
      const P = { x: 6, y: PORTAL_Y };
      for (let x = 4; x < this.ancho - 3; x++) data[P.y + 2][x] = RIEL;
      for (let y = 3; y < this.alto - 3; y++) data[y][CENTRO_X] = RIEL;
      this.terreno = data;
      for (let y = 0; y < this.alto; y++) for (let x = 0; x < this.ancho; x++) if (data[y][x] === RIEL) { this.marcar(x, y); this.marcar(x, y + 1); }
      for (let y = P.y - 3; y <= P.y + 4; y++) for (let x = P.x - 3; x <= P.x + 5; x++) this.marcar(x, y);
      if (M.abismo) this.planearProfundidades(data, fc);
      this.estacion = { x: CENTRO_X + 5, y: P.y - 1 };
      for (let y = this.estacion.y - 3; y <= this.estacion.y + 1; y++) for (let x = this.estacion.x - 3; x <= this.estacion.x + 3; x++) this.marcar(x, y);
      this.prepararLugaresJefe(P);
      // pozas subterráneas (decorativas)
      for (let i = 0; i < M.pozas; i++) {
        const w = 3 + Math.floor(this.rnd() * 3), h = 3 + Math.floor(this.rnd() * 2);
        for (let t = 0; t < 60; t++) {
          const lx = 4 + Math.floor(this.rnd() * (this.ancho - w - 8)), ly = 4 + Math.floor(this.rnd() * (this.alto - h - 8));
          let ok = true;
          for (let y = ly - 2; y <= ly + h + 1 && ok; y++) for (let x = lx - 2; x <= lx + w + 1 && ok; x++) if (this.ocupado.has(`${x},${y}`)) ok = false;
          if (!ok) continue;
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data[ly + y][lx + x] = fc(x === 0 ? 0 : x === w - 1 ? 2 : 1, y === 0 ? 10 : y === h - 1 ? 13 : 11);
          this.obstaculos.add(this.add.zone((lx + w / 2) * TILE, (ly + h / 2) * TILE, w * TILE - 20, h * TILE - 20));
          this.aguas.push({ x0: lx * TILE + 10, y0: ly * TILE + 10, x1: (lx + w) * TILE - 10, y1: (ly + h) * TILE - 10 });
          for (let y = ly - 1; y <= ly + h; y++) for (let x = lx - 1; x <= lx + w; x++) this.marcar(x, y);
          break;
        }
      }
      this.suelo(data, 'kenney_cueva');
      for (let y = 3; y < this.alto - 3; y++) this.add.image(CENTRO_X * TILE + 16, y * TILE + 16, 'd_rieles').setScale(2).setDepth(-7);
      // oscuridad de la mina y luz que acompaña al jugador
      this.add.rectangle(0, 0, this.ancho * TILE, this.alto * TILE, 0x05060f, M.oscuridad).setOrigin(0).setDepth(9500);
      this.luz = this.add.image(0, 0, 'luz').setScale(2.6).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.3).setDepth(9501);
      this.bordesCueva();
      if (M.abismo) this.decorarFosa();
      this.crearEstacion();
      this.portal(P.x, P.y);
      this.crearGuarida();
      this.add.image(P.x * TILE + 16, P.y * TILE + 16, 'luz').setScale(1.4).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.18).setDepth(9501);
      this.inicio = { x: (P.x + 1) * TILE + 16, y: (P.y + 2) * TILE + 20 };

      const lugar = (alto = 1) => {
        for (let i = 0; i < 400; i++) {
          const x = 2 + Math.floor(this.rnd() * (this.ancho - 4)), y = 3 + Math.floor(this.rnd() * (this.alto - 5));
          if (this.libre(x, y) && (alto < 2 || this.libre(x, y - 1))) return [x, y];
        }
        return null;
      };
      const reservar = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) this.marcar(x + dx, y + dy); };
      const elegir = (lista) => lista[Math.floor(this.rnd() * lista.length)];
      const brasero = (x, y) => {
        const sp = this.sprite('d_brasero_mina', x, y); this.solido(sp.x, sp.y - 8, 18, 12); this.marcar(x, y);
        this.add.image(sp.x, sp.y - 20, 'luz').setScale(1.1).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.25).setDepth(9501);
        this.add.particles(sp.x, sp.y - 26, 'p_brillo', { speedY: { min: -40, max: -20 }, speedX: { min: -6, max: 6 }, lifespan: 600, frequency: 220, scale: { start: 0.9, end: 0 } }).setDepth(sp.y + 1);
      };
      // entradas de túneles y braseros junto al portal
      brasero(P.x - 2, P.y + 1); brasero(P.x + 4, P.y + 1);
      for (let i = 0; i < 5; i++) {
        const p = lugar(2); if (!p) break;
        if (![0, 1, 2, 3].every((dx) => this.libre(p[0] - dx, p[1]) && this.libre(p[0] - dx, p[1] - 1) && this.libre(p[0] - dx, p[1] - 2))) continue;
        const sp = this.sprite('d_entrada_mina', p[0], p[1], 1 - 1 / 8);
        this.solido((p[0] - 1) * TILE, (p[1] + 1) * TILE - 14, 4 * TILE - 10, 20);
        for (let dx = 0; dx < 4; dx++) for (let dy = 0; dy < 3; dy++) this.marcar(p[0] - dx, p[1] - dy);
        if (this.libre(p[0] + 1, p[1])) brasero(p[0] + 1, p[1]);
      }
      // campamentos mineros: cajones, rieles y un brasero
      for (let c = 0; c < 3; c++) {
        const p = lugar(2); if (!p) break;
        for (const [dx, dy, key] of [[0, 0, 'd_cajones_mina'], [1, 0, 'd_caja_mina'], [-1, 1, 'd_caja_mina'], [2, 1, 'barril'], [-2, 0, 'brasero'], [0, 2, 'd_rieles'], [1, 2, 'd_rieles']]) {
          const x = p[0] + dx, y = p[1] + dy;
          if (!this.libre(x, y)) continue;
          if (key === 'brasero') { brasero(x, y); continue; }
          const sp = this.sprite(key, x, y);
          if (key === 'd_rieles') sp.setDepth(-6); else this.solido(sp.x, sp.y - 8, 20, 12);
          this.marcar(x, y);
        }
      }
      // manchas de hongos rojos que brillan en la oscuridad
      for (let i = 0; i < 14; i++) {
        const p = lugar(1); if (!p) break;
        const sp = this.sprite('d_hongos_rojos', p[0], p[1]).setDepth(-5);
        this.add.image(sp.x, sp.y - 12, 'luz').setScale(0.5).setTint(0xff7a7a).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.22).setDepth(9501);
        this.marcar(p[0], p[1]);
      }
      // pilares, cajas, estalagmitas, lianas y huesos
      for (let i = 0; i < 64; i++) {
        const p = lugar(2); if (!p) break;
        const key = elegir(['d_pilar_mina', 'd_pilar_roto', 'd_estalagmita', 'd_estalagmita', 'd_caja_mina', 'd_cajones_mina', 'd_calavera', 'd_huesos', 'hongos_blancos', 'brasero']);
        if (key === 'brasero') { brasero(p[0], p[1]); continue; }
        const sp = this.sprite(key === 'hongos_blancos' ? 'd_hongos_blancos' : key, p[0], p[1]);
        if (['d_calavera', 'd_huesos', 'hongos_blancos'].includes(key)) sp.setDepth(-5);
        else { this.solido(sp.x, sp.y - 10, 20, 14); this.marcar(p[0], p[1]); if (key !== 'd_estalagmita' && key !== 'd_caja_mina') this.marcar(p[0], p[1] - 1); }
      }
      // hongos luminosos: se recolectan sin herramientas y vuelven a crecer
      for (let i = 0; i < M.nHongos; i++) {
        const p = lugar(1); if (!p) break;
        const sp = this.sprite('hongos_n', p[0], p[1]);
        const z = this.solido(sp.x, sp.y - 8, 16, 10);
        reservar(p[0], p[1]);
        this.objetos.push({ tipo: 'arbol', key: 'hongos_n', nombre: 'hongos', rec: 'hongo', texTocon: 'hongos_t', texBrote: 'hongos_b', s: sp, z, x: sp.x, y: sp.y - 6, estado: 'arbol', activo: true, bicho: false });
      }
      // rocas de carbón (pueden soltar plata)
      for (let i = 0; i < M.nRocas; i++) {
        const p = lugar(1); if (!p) break;
        const sp = this.sprite('roca3', p[0], p[1]).setTint(0x6f6a7a);
        const z = this.solido(sp.x, sp.y - 10, 26, 16);
        reservar(p[0], p[1]);
        this.objetos.push({ tipo: 'roca', base: 'roca', rec: 'carbon', extra: 'plata', picoBueno: 'pico4', nombre: 'roca de carbón', s: sp, z, x: sp.x, y: sp.y - 6, nivel: 3, nivelMax: 3, activo: true });
      }
      // vetas de plata y de amatista (la amatista necesita el pico de plata)
      for (const [n, base, rec, req, nombre] of [[M.vetasPlata, 'veta_plata', 'plata', null, 'veta de plata'], [M.vetasAmatista, 'veta_amatista', 'amatista', 'pico4', 'veta de amatista']]) {
        for (let i = 0; i < n; i++) {
          const p = lugar(1); if (!p) break;
          const sp = this.sprite(`${base}2`, p[0], p[1]);
          const z = this.solido(sp.x, sp.y - 14, 28, 22);
          reservar(p[0], p[1]);
          this.objetos.push({ tipo: 'roca', base, rec, req, picoBueno: 'pico4', evento: 'veta', nombre, s: sp, z, x: sp.x, y: sp.y - 8, nivel: 2, nivelMax: 2, activo: true });
        }
      }
      // cofres (la mitad tiene vida)
      for (let i = 0; i < M.cofres; i++) {
        const p = lugar(1); if (!p) break;
        const sp = this.sprite('cofre', p[0], p[1]);
        const z = this.solido(sp.x, sp.y - 10, 26, 14);
        reservar(p[0], p[1]);
        const conVida = i % 2 === 0;
        let corazon = null;
        if (conVida) {
          corazon = this.add.image(sp.x, sp.y - 44, 'corazon').setScale(2).setDepth(9502);
          this.tweens.add({ targets: corazon, y: sp.y - 50, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        }
        this.objetos.push({ tipo: 'cofre', s: sp, z, x: sp.x, y: sp.y - 6, activo: true, vida: conVida, corazon });
      }
      this.objetos.forEach((o, i) => { o.idx = i; });
      // enemigos de la mina
      const lejos = (p, r) => Math.abs(p[0] - P.x) >= r || Math.abs(p[1] - P.y) >= r;
      for (let i = 0; i < M.murcielagos; i++) {
        const p = lugar(1); if (!p) break;
        if (!lejos(p, 10)) continue;
        const sp = this.add.image(p[0] * TILE + 16, p[1] * TILE + 8, 'murcielago').setScale(2).setDepth(9000);
        this.tweens.add({ targets: sp, scaleY: 1.4, duration: 140, yoyo: true, repeat: -1 });
        this.enemigos.push(this.nuevoEnemigo('murcielago', sp, { despierto: true, k: `m${i}` }));
      }
      for (let i = 0; i < M.golems; i++) {
        const p = lugar(1); if (!p) break;
        if (!lejos(p, 8)) continue;
        const sp = this.add.sprite(p[0] * TILE + 16, (p[1] + 1) * TILE, 'golem_roca').setOrigin(0.5, 1).setScale(2);
        sp.setDepth(sp.y);
        this.marcar(p[0], p[1]);
        this.enemigos.push(this.nuevoEnemigo('golem', sp, { despierto: false, k: `g${i}` }));
      }
      for (let i = 0; i < M.mineros; i++) {
        const p = lugar(1); if (!p) break;
        if (!lejos(p, 10)) continue;
        const sp = this.add.sprite(p[0] * TILE + 16, (p[1] + 1) * TILE, 'minero_hoja', DIRS.down * 9).setOrigin(0.5, 0.9);
        sp.setDepth(sp.y);
        this.enemigos.push(this.nuevoEnemigo('minero', sp, { despierto: true, k: `z${i}` }));
      }
      if (M.abismo) this.crearProfundidades();
    }
    // ---------- mundo helado (Unidad 4) ----------
    crearHielo(M) {
      this.ancho = MAPA_W; this.alto = MAPA_H;
      this.rnd = azar(M.semilla + (S.curso === '8basico' ? 100 : 0));
      const fn = (c, r) => r * 16 + c;   // índice en la hoja de nieve (16 columnas)
      const BASE = fn(M.suelo[0][0], M.suelo[0][1]), SENDERO = fn(3, 0);
      this.pisables = [BASE, ...M.suelo.slice(1).map(([c, r]) => fn(c, r))];
      const data = [];
      for (let y = 0; y < this.alto; y++) { const fila = []; for (let x = 0; x < this.ancho; x++) fila.push(BASE); data.push(fila); }
      for (const [c, r, p] of M.suelo.slice(1)) {
        let pintado = 0;
        const meta = p * this.ancho * this.alto;
        while (pintado < meta) {
          const cx = Math.floor(this.rnd() * this.ancho), cy = Math.floor(this.rnd() * this.alto), rad = 2 + this.rnd() * 3;
          for (let y = Math.floor(cy - rad); y <= cy + rad; y++) for (let x = Math.floor(cx - rad); x <= cx + rad; x++) {
            if (y < 0 || x < 0 || y >= this.alto || x >= this.ancho) continue;
            if (Math.hypot(x - cx, y - cy) <= rad + (this.rnd() - 0.5)) { if (data[y][x] !== fn(c, r)) pintado++; data[y][x] = fn(c, r); }
          }
        }
      }
      const P = { x: 6, y: PORTAL_Y };
      for (let x = 4; x < this.ancho - 3; x++) data[P.y + 2][x] = SENDERO;
      for (let y = 3; y < this.alto - 3; y++) data[y][CENTRO_X] = SENDERO;
      this.terreno = data;
      for (let y = 0; y < this.alto; y++) for (let x = 0; x < this.ancho; x++) if (data[y][x] === SENDERO) { this.marcar(x, y); this.marcar(x, y + 1); }
      for (let y = P.y - 3; y <= P.y + 4; y++) for (let x = P.x - 3; x <= P.x + 5; x++) this.marcar(x, y);
      this.prepararLugaresJefe(P);
      this.suelo(data, 'kenney_nieve');
      // nieve que cae siempre (suave) y ventiscas de vez en cuando
      const cam = this.cameras.main;
      this.add.particles(0, 0, 'p_nieve', { x: { min: -50, max: cam.width + 50 }, y: -10, lifespan: 6000, frequency: 90, speedY: { min: 30, max: 70 }, speedX: { min: -15, max: 15 }, scale: { start: 0.9, end: 0.5 }, alpha: { start: 0.9, end: 0.2 } }).setScrollFactor(0).setDepth(99990);
      this.bordesHielo();
      this.portal(P.x, P.y);
      this.crearGuarida();
      this.inicio = { x: (P.x + 1) * TILE + 16, y: (P.y + 2) * TILE + 20 };
      this.ventisca = false;
      this.time.addEvent({ delay: 55000, loop: true, callback: () => this.empezarVentisca() });

      const lugar = (alto = 1) => {
        for (let i = 0; i < 400; i++) {
          const x = 2 + Math.floor(this.rnd() * (this.ancho - 4)), y = 3 + Math.floor(this.rnd() * (this.alto - 5));
          if (this.libre(x, y) && (alto < 2 || this.libre(x, y - 1))) return [x, y];
        }
        return null;
      };
      const reservar = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) this.marcar(x + dx, y + dy); };
      const elegir = (lista) => lista[Math.floor(this.rnd() * lista.length)];
      // campamento junto al portal: iglú, fogata y trineo
      {
        const ix = P.x + 4, iy = P.y - 1;
        const ig = this.sprite('d_iglu', ix, iy, 0.75); this.solido(ig.x - 16, ig.y - 12, 56, 20);
        const f = this.sprite('fogata', P.x - 2, P.y + 1); this.solido(f.x, f.y - 8, 20, 12);
        this.add.particles(f.x, f.y - 22, 'p_brillo', { speedY: { min: -40, max: -20 }, speedX: { min: -8, max: 8 }, lifespan: 700, frequency: 180, scale: { start: 1, end: 0 } }).setDepth(f.y + 1);
        this.sprite('d_trineo', P.x + 2, P.y - 2).setDepth((P.y - 1) * TILE);
      }
      // pinos nevados (decoración sólida) y otros adornos de invierno
      for (let i = 0; i < M.nPinos; i++) {
        const p = lugar(2); if (!p) break;
        const key = elegir(['nv_pino', 'nv_pino', 'nv_roble', 'nv_arce', 'nv_seco_n']);
        const sp = this.sprite(key, p[0], p[1]); this.solido(sp.x, sp.y - 10, 18, 12);
        this.marcar(p[0], p[1]); this.marcar(p[0], p[1] - 1);
      }
      // aldea de iglús abandonada
      for (let c = 0; c < 2; c++) {
        const p = lugar(2); if (!p) break;
        if (![0, 1].every((dx) => this.libre(p[0] - dx, p[1]) && this.libre(p[0] - dx, p[1] - 1))) continue;
        const ig = this.sprite('d_iglu', p[0], p[1], 0.75); this.solido(ig.x - 16, ig.y - 12, 56, 20);
        for (const [dx, dy] of [[-1, 0], [0, 0], [-1, -1], [0, -1]]) this.marcar(p[0] + dx, p[1] + dy);
        for (const [dx, dy, key] of [[2, 0, 'd_muneco_nieve'], [-3, 1, 'd_cerco_nevado'], [-2, 1, 'd_cerco_nevado'], [1, 1, 'd_trineo'], [3, 1, 'd_pinguino'], [2, -1, 'd_pinguino']]) {
          const x = p[0] + dx, y = p[1] + dy;
          if (!this.libre(x, y)) continue;
          const sp = this.sprite(key, x, y); this.solido(sp.x, sp.y - 8, 20, 12); this.marcar(x, y);
        }
      }
      for (let i = 0; i < 50; i++) {
        const p = lugar(1); if (!p) break;
        const key = elegir(['d_muneco_nieve', 'd_pinguino', 'd_bloque_hielo', 'd_monton_nieve', 'd_monton_nieve', 'd_cristal_escarcha', 'd_trineo']);
        const sp = this.sprite(key, p[0], p[1]);
        if (key === 'd_monton_nieve' || key === 'd_cristal_escarcha') sp.setDepth(-5); else { this.solido(sp.x, sp.y - 8, 20, 12); this.marcar(p[0], p[1]); }
      }
      // arbustos de bayas de invierno (se recolectan a mano y vuelven a dar bayas)
      for (let i = 0; i < M.nArbustos; i++) {
        const p = lugar(1); if (!p) break;
        const sp = this.sprite('nv_arbusto_bayas', p[0], p[1]);
        const z = this.solido(sp.x, sp.y - 8, 20, 12);
        reservar(p[0], p[1]);
        this.objetos.push({ tipo: 'arbol', key: 'nv_arbusto_bayas', nombre: 'arbusto de bayas', rec: 'baya', texTocon: 'nv_arbusto_nevado', texBrote: 'nv_arbusto_nevado', s: sp, z, x: sp.x, y: sp.y - 6, estado: 'arbol', activo: true, bicho: false });
      }
      // bloques de hielo (pueden soltar escarcha)
      for (let i = 0; i < M.nRocas; i++) {
        const p = lugar(1); if (!p) break;
        const sp = this.sprite('nv_hielo3', p[0], p[1]);
        const z = this.solido(sp.x, sp.y - 10, 26, 16);
        reservar(p[0], p[1]);
        this.objetos.push({ tipo: 'roca', base: 'nv_hielo', rec: 'hielo', extra: 'escarcha', picoBueno: 'pico5', nombre: 'bloque de hielo', s: sp, z, x: sp.x, y: sp.y - 6, nivel: 3, nivelMax: 3, activo: true });
      }
      // vetas de escarcha y de zafiro (el zafiro necesita el pico de escarcha)
      for (const [n, base, rec, req, nombre] of [[M.vetasEscarcha, 'veta_escarcha', 'escarcha', null, 'veta de escarcha'], [M.vetasZafiro, 'veta_zafiro', 'zafiro', 'pico5', 'veta de zafiro']]) {
        for (let i = 0; i < n; i++) {
          const p = lugar(1); if (!p) break;
          const sp = this.sprite(`${base}2`, p[0], p[1]);
          const z = this.solido(sp.x, sp.y - 14, 28, 22);
          reservar(p[0], p[1]);
          this.objetos.push({ tipo: 'roca', base, rec, req, picoBueno: 'pico5', evento: 'veta', nombre, s: sp, z, x: sp.x, y: sp.y - 8, nivel: 2, nivelMax: 2, activo: true });
        }
      }
      // cofres (la mitad tiene vida)
      for (let i = 0; i < M.cofres; i++) {
        const p = lugar(1); if (!p) break;
        const sp = this.sprite('cofre', p[0], p[1]);
        const z = this.solido(sp.x, sp.y - 10, 26, 14);
        reservar(p[0], p[1]);
        const conVida = i % 2 === 0;
        let corazon = null;
        if (conVida) {
          corazon = this.add.image(sp.x, sp.y - 44, 'corazon').setScale(2).setDepth(sp.y + 1);
          this.tweens.add({ targets: corazon, y: sp.y - 50, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        }
        this.objetos.push({ tipo: 'cofre', s: sp, z, x: sp.x, y: sp.y - 6, activo: true, vida: conVida, corazon });
      }
      this.objetos.forEach((o, i) => { o.idx = i; });
      // enemigos del mundo helado
      const lejos = (p, r) => Math.abs(p[0] - P.x) >= r || Math.abs(p[1] - P.y) >= r;
      for (let i = 0; i < M.lobos; i++) {
        const p = lugar(1); if (!p) break;
        if (!lejos(p, 10)) continue;
        const sp = this.add.sprite(p[0] * TILE + 16, (p[1] + 1) * TILE, 'lobo_nieve_hoja', DIRS.down * 9).setOrigin(0.5, 0.9);
        sp.setDepth(sp.y);
        this.enemigos.push(this.nuevoEnemigo('lobo_nieve', sp, { despierto: true, k: `w${i}` }));
      }
      for (let i = 0; i < M.espiritus; i++) {
        const p = lugar(1); if (!p) break;
        if (!lejos(p, 10)) continue;
        const sp = this.add.image(p[0] * TILE + 16, p[1] * TILE + 16, 'nv_espiritu').setScale(2.2).setAlpha(0.9).setDepth(9000);
        this.add.particles(0, 0, 'p_nieve', { x: { min: -24, max: 24 }, y: { min: -6, max: 20 }, lifespan: 900, frequency: 80, speedX: { min: -50, max: 50 }, speedY: { min: -20, max: 10 }, scale: { start: 1, end: 0 }, alpha: { start: 0.9, end: 0 } }).setDepth(9001).startFollow(sp);
        this.tweens.add({ targets: sp, y: sp.y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        this.enemigos.push(this.nuevoEnemigo('espiritu', sp, { despierto: true, k: `s${i}` }));
      }
      for (let i = 0; i < M.munecos; i++) {
        const p = lugar(1); if (!p) break;
        if (!lejos(p, 8)) continue;
        const sp = this.add.sprite(p[0] * TILE + 16, (p[1] + 1) * TILE, 'nv_montonnieve').setOrigin(0.5, 1).setScale(2);
        sp.setDepth(sp.y);
        this.marcar(p[0], p[1]);
        this.enemigos.push(this.nuevoEnemigo('muneco', sp, { despierto: false, k: `n${i}` }));
      }
    }
    bordesHielo() {
      const claves = ['nv_pino', 'nv_pino', 'nv_roble', 'nv_hielo3', 'nv_bloque_hielo'];
      for (let y = 0; y < this.alto; y++) for (let x = 0; x < this.ancho; x++) {
        if (x < 2 || y < 2 || x >= this.ancho - 2 || y >= this.alto - 2) this.sprite(claves[Math.floor(this.rnd() * claves.length)], x, y);
      }
      const W = this.ancho * TILE, H = this.alto * TILE;
      this.solido(W / 2, TILE, W, TILE * 2); this.solido(W / 2, H - TILE, W, TILE * 2);
      this.solido(TILE, H / 2, TILE * 2, H); this.solido(W - TILE, H / 2, TILE * 2, H);
    }
    // Ventisca: 15 segundos de viento con nieve; sin abrigo se camina más lento
    empezarVentisca() {
      if (this.ventisca || !this.jugador) return;
      this.ventisca = true; sfx('viento');
      toast(tiene('abrigo') ? '¡Ventisca! Tu abrigo de piel te protege del frío.' : '¡Ventisca! Caminas más lento. Un abrigo de piel te protegería.', 'alerta');
      const cam = this.cameras.main;
      const p = this.add.particles(0, 0, 'p_nieve', { x: -20, y: { min: 0, max: cam.height }, lifespan: 2200, frequency: 12, speedX: { min: 380, max: 620 }, speedY: { min: -30, max: 60 }, scale: { start: 1.5, end: 0.6 }, alpha: { start: 0.95, end: 0.2 } }).setScrollFactor(0).setDepth(99991);
      const velo = this.add.rectangle(0, 0, cam.width * 2, cam.height * 2, 0xffffff, 0).setOrigin(0).setScrollFactor(0).setDepth(99989);
      this.tweens.add({ targets: velo, fillAlpha: 0.32, duration: 1500 });
      this.time.delayedCall(15000, () => {
        this.tweens.add({ targets: velo, fillAlpha: 0, duration: 1500, onComplete: () => velo.destroy() });
        p.stop(); this.time.delayedCall(2500, () => p.destroy());
        this.ventisca = false;
      });
    }
    bordesCueva() {
      const claves = ['d_estalagmita', 'golem_roca', 'd_roca_musgo_c', 'roca3', 'd_pilar_roto'];
      for (let y = 0; y < this.alto; y++) for (let x = 0; x < this.ancho; x++) {
        if (x < 2 || y < 2 || x >= this.ancho - 2 || y >= this.alto - 2) this.sprite(claves[Math.floor(this.rnd() * claves.length)], x, y);
      }
      const W = this.ancho * TILE, H = this.alto * TILE;
      this.solido(W / 2, TILE, W, TILE * 2); this.solido(W / 2, H - TILE, W, TILE * 2);
      this.solido(TILE, H / 2, TILE * 2, H); this.solido(W - TILE, H / 2, TILE * 2, H);
      // las paredes de la mina quedan más oscuras
      const g = this.add.graphics().setDepth(9499);
      g.fillStyle(0x000000, 0.35); g.fillRect(0, 0, W, 2 * TILE); g.fillRect(0, H - 2 * TILE, W, 2 * TILE); g.fillRect(0, 2 * TILE, 2 * TILE, H - 4 * TILE); g.fillRect(W - 2 * TILE, 2 * TILE, 2 * TILE, H - 4 * TILE);
    }
    bordesDesierto() {
      const claves = ['d_roca_duna', 'd_aguja', 'roca_cafe3', 'd_arbol_seco', 'cactus'];
      for (let y = 0; y < this.alto; y++) for (let x = 0; x < this.ancho; x++) {
        if (x < 2 || y < 2 || x >= this.ancho - 2 || y >= this.alto - 2) {
          if (this.rnd() < 0.82) this.sprite(claves[Math.floor(this.rnd() * claves.length)], x, y);
        }
      }
      const W = this.ancho * TILE, H = this.alto * TILE;
      this.solido(W / 2, TILE, W, TILE * 2); this.solido(W / 2, H - TILE, W, TILE * 2);
      this.solido(TILE, H / 2, TILE * 2, H); this.solido(W - TILE, H / 2, TILE * 2, H);
    }
    // Fase de furia de los jefes con fases: tormenta de arena (desierto) o derrumbe (mina)
    furiaJefe() {
      sfx('rugido');
      const J = JEFES[this.zona], F = J.furia || { toast: 'se enfureció', particula: 'p_brillo', tinte: 0xff9f9f, flash: [200, 80, 80] };
      toast(`¡${J.nombre} ${F.toast}! Las preguntas son más difíciles.`, 'alerta');
      this.cameras.main.shake(500, 0.008); this.cameras.main.flash(300, ...F.flash);
      if (this.jefeSpr) this.jefeSpr.setTint(F.tinte);
      if (!this.tormenta) {
        const cam = this.cameras.main, cae = F.particula === 'p_piedra';
        this.tormenta = this.add.particles(0, 0, F.particula, { x: { min: 0, max: cam.width }, y: cae ? { min: -20, max: 0 } : { min: 0, max: cam.height }, lifespan: cae ? 1600 : 1400, frequency: 25,
          speedX: cae ? { min: -20, max: 20 } : { min: 160, max: 320 }, speedY: cae ? { min: 200, max: 420 } : { min: -20, max: 40 }, scale: { start: 1.6, end: 0.4 }, alpha: { start: 0.8, end: 0 } }).setScrollFactor(0).setDepth(99998);
        this.time.delayedCall(20000, () => { if (this.tormenta) { this.tormenta.destroy(); this.tormenta = null; } });
      }
    }
    // Claros repartidos por el mapa donde puede aparecer el jefe (los mismos para todo el grupo)
    prepararLugaresJefe(P) {
      this.lugaresJefe = [];
      const y0 = this.yUtil || 0, cols = 4, filas = 2, cw = ((this.anchoUtil || this.ancho) - 8) / cols, ch = ((this.altoUtil || this.alto) - y0 - 10) / filas;
      for (let fy = 0; fy < filas; fy++) for (let fx = 0; fx < cols; fx++) {
        for (let t = 0; t < 120; t++) {
          const x = Math.floor(4 + fx * cw + 2 + this.rnd() * (cw - 4)), y = Math.floor(y0 + 6 + fy * ch + 2 + this.rnd() * (ch - 4));
          if (Math.abs(x - P.x) < 14 && Math.abs(y - P.y) < 10) continue;
          let ok = true;
          for (let dy = -3; dy <= 1 && ok; dy++) for (let dx = -2; dx <= 2 && ok; dx++) if (!this.libre(x + dx, y + dy)) ok = false;
          if (!ok) continue;
          for (let dy = -4; dy <= 2; dy++) for (let dx = -3; dx <= 3; dx++) this.marcar(x + dx, y + dy);
          this.lugaresJefe.push({ x, y });
          break;
        }
      }
      if (!this.lugaresJefe.length) this.lugaresJefe.push({ x: CENTRO_X + 12, y: y0 + 10 });
    }
    // El jefe no tiene guarida visible: queda oculto hasta que el grupo lo invoca
    crearGuarida() {
      const J = JEFES[this.zona], des = desierto(this.zona), L = this.lugaresJefe[0];
      const cx = L.x * TILE + 16, cy = L.y * TILE + 30;
      if (J.lpc) {
        this.jefeEscala = 2.2;
        this.jefeSpr = this.add.sprite(cx, cy + 6, `jefe_${this.zona}_hoja`, DIRS.down * 9).setOrigin(0.5, 0.92).setScale(2.2).setDepth(cy);
        this.jefeSpr.anims.play(`jefe_${this.zona}_down`);
      } else {
        this.jefeEscala = 4;
        this.jefeSpr = this.add.image(cx, cy, `jefe_${this.zona}`).setOrigin(0.5, 1).setScale(4).setDepth(cy);
      }
      this.jefeSpr.setVisible(false).setAlpha(0); this.jefeVisto = false;
      this.jefeTag = this.add.text(cx, cy - (J.lpc ? 128 : 104), J.nombre, { fontFamily: 'Fredoka, Nunito, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#ffd27a', stroke: '#12201a', strokeThickness: 4 }).setOrigin(0.5).setResolution(3).setDepth(cy + 1).setVisible(false);
      this.jefeAura = this.add.particles(cx, cy - 20, des ? 'p_arena' : helado(this.zona) ? 'p_nieve' : 'p_morado', { x: { min: -46, max: 46 }, speedY: { min: -110, max: -40 }, lifespan: 1700, frequency: 70, scale: { start: 1.6, end: 0 }, alpha: { start: 0.85, end: 0 } }).setDepth(cy - 1);
      this.jefeAura.emitting = false;
      if (cueva(this.zona)) this.jefeLuz = this.add.image(cx, cy - 40, 'luz').setScale(2.2).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(9501);
      this.jefeLugar = null; this.jefeLugarPuesto = null; this.guarida = null;
      this.objJefe = { tipo: 'jefe', x: cx, y: cy + 4, activo: false };
      this.objetos.push(this.objJefe);
    }
    // Mueve al jefe (y su zona sólida) al claro elegido
    colocarJefe(i) {
      const J = JEFES[this.zona], L = this.lugaresJefe[i % this.lugaresJefe.length], cue = cueva(this.zona);
      const cx = L.x * TILE + 16, cy = L.y * TILE + 30;
      this.jefeSpr.setPosition(cx, J.lpc ? cy + 6 : cy).setDepth(cy);
      this.jefeTag.setPosition(cx, cy - (J.lpc ? 128 : 104)).setDepth(cue ? 9503 : cy + 1);
      this.jefeAura.setPosition(cx, cy - 20).setDepth(cue ? 9502 : cy - 1);
      if (this.jefeLuz) this.jefeLuz.setPosition(cx, cy - 40);
      this.quitarZonaJefe();
      this.jefeZona = this.solido(cx, cy - 18, 60, 30);
      this.guarida = { x: cx, y: cy - 20 };
      this.objJefe.x = cx; this.objJefe.y = cy + 4;
    }
    quitarZonaJefe() { if (this.jefeZona) { this.obstaculos.remove(this.jefeZona, true, true); this.jefeZona = null; } }
    nuevoEnemigo(clase, s, extra = {}) {
      const E = ENEMIGOS[clase];
      return { clase, s, vida: E.vida, vidaMax: E.vida, origen: { x: s.x, y: s.y }, activo: true, aturdido: 0, ...extra };
    }

    // ---------- jugador ----------
    crearJugador() {
      if (S.herramienta === 'pico' && !tiene('pico')) S.herramienta = 'hacha';
      this.jugador = this.physics.add.sprite(this.inicio.x, this.inicio.y, `pj_${S.pj}_${texArmadura(S.armadura)}`, DIRS.down * 9);
      this.jugador.setOrigin(0.5, 0.9);
      this.jugador.body.setSize(18, 10).setOffset(23, 50);
      this.jugador.setCollideWorldBounds(true);
      this.physics.add.collider(this.jugador, this.obstaculos);
      this.capasJ = this.crearCapas();
      this.vestirJugador();
    }
    // Capas que acompañan a un personaje: la parte trasera de la espada y lo que lleva en la mano
    crearCapas() {
      return { atras: this.add.sprite(0, 0, 'capa_espada_bg', 0).setOrigin(0.5, 0.9).setVisible(false), mano: this.add.sprite(0, 0, 'capa_hacha_male', 0).setOrigin(0.5, 0.9).setVisible(false) };
    }
    vestir(base, capas, pj, armadura, mano, arma) {
      const key = `pj_${pj}_${texArmadura(armadura)}`;
      if (base.texture.key !== key) { base.anims.stop(); base.setTexture(key, Number(base.frame.name) || 0); }
      const espada = mano === 'espada' && ARMAS[arma];
      capas.atras.setVisible(Boolean(espada));
      if (espada) capas.atras.setTexture(`capa_${arma}_bg`);
      const tex = espada ? `capa_${arma}_fg` : mano === 'hacha' || mano === 'pico' ? `capa_${mano}_${cuerpoDe(pj)}` : null;
      capas.mano.setVisible(Boolean(tex));
      if (tex) capas.mano.setTexture(tex);
      this.seguir(base, capas);
    }
    seguir(base, capas) {
      const f = base.frame.name;
      for (const [c, dz] of [[capas.atras, -0.01], [capas.mano, 0.01]]) {
        if (!c.visible) continue;
        c.setPosition(base.x, base.y).setFrame(f).setDepth(base.depth + dz).setAlpha(base.alpha);
      }
    }
    vestirJugador() {
      if (!this.jugador) return;
      this.vestir(this.jugador, this.capasJ, S.pj, S.armadura, S.herramienta, S.arma);
      if (this.ultimoMov) this.ultimoMov.t = 0;   // avisar el cambio al grupo
    }
    ajustarZoom() {
      const { width, height } = this.scale;
      const cam = this.cameras.main;
      cam.setZoom(Math.max(1, Math.min(3, Math.floor(Math.min(width / 560, height / 315) * 2) / 2)));
      if (this.zona === 'pieza' && this.jugador) {
        // La pieza siempre llena la pantalla: si hace falta se acerca la cámara, que sigue al jugador
        const W = this.ancho * TILE, H = this.alto * TILE;
        cam.setZoom(Math.max(cam.zoom, width / W, height / H));
        cam.setBounds(0, 0, W, H); cam.startFollow(this.jugador, true, 0.15, 0.15);
      }
    }

    update(t, dt) {
      const j = this.jugador;
      if (!j) return;
      let vx = 0, vy = 0;
      if (!ui.abierto) {
        const k = this.teclas;
        if (k.A.isDown || k.LEFT.isDown) vx -= 1;
        if (k.D.isDown || k.RIGHT.isDown) vx += 1;
        if (k.W.isDown || k.UP.isDown) vy -= 1;
        if (k.S.isDown || k.DOWN.isDown) vy += 1;
        if (palanca.x || palanca.y) { vx = palanca.x; vy = palanca.y; }
        if (this.aturdidoHasta > this.time.now) { vx = 0; vy = 0; }
      }
      const len = Math.hypot(vx, vy);
      if (len > 0.15) {
        const vel = desActivo('turbo') ? 255 : this.ventisca && !tiene('abrigo') ? 95 : 150;   // botas de viento > ventisca   // la ventisca hace caminar lento (salvo con abrigo)
        j.setVelocity((vx / Math.max(len, 1)) * vel, (vy / Math.max(len, 1)) * vel);
        this.dir = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'left' : 'right') : (vy < 0 ? 'up' : 'down');
        j.anims.play(`${j.texture.key}_${this.dir}`, true);
      } else { j.setVelocity(0, 0); j.anims.stop(); j.setFrame(DIRS[this.dir] * 9); }
      j.setDepth(j.y);
      this.seguir(j, this.capasJ);
      if (this.luz) this.luz.setPosition(j.x, j.y - 24);
      if (!ui.abierto && !this.enCombate) this.moverEnemigos(dt / 1000);
      if (vivo.fase === 'activo') actualizarDesafio(this, dt);
      if (this.canal) { this.enviarMovimiento(len > 0.15); this.moverOtros(dt / 1000); this.revisarGuarida(); }
    }

    // ---------- enemigos ----------
    // Posiciones de todos los jugadores del grupo en este mundo (yo + compañeros visibles)
    jugadoresCerca() {
      const j = this.jugador, lista = [{ id: idJuego, x: j.x, y: j.y, yo: true }];
      if (this.otros) for (const [id, o] of this.otros) if (o.visto) lista.push({ id, x: o.spr.x, y: o.spr.y, yo: false });
      return lista;
    }
    moverEnemigos(seg) {
      const ahora = this.time.now, todos = this.jugadoresCerca();
      for (const e of this.enemigos) {
        if (!e.activo || e.cayendo) continue;
        if (e.aturdido > ahora) continue;
        const E = ENEMIGOS[e.clase];
        // objetivo: si está luchando con un compañero, se queda con él; si no, persigue al jugador más cercano
        let obj = null, d = Infinity;
        const lista = e.soloYo ? [todos[0]] : todos;
        if (e.ocupado) { obj = lista.find((t) => t.id === e.ocupado) || null; if (!obj) e.ocupado = null; }
        if (obj) d = Phaser.Math.Distance.Between(obj.x, obj.y - 16, e.s.x, e.s.y - 10);
        else for (const t of lista) { const dd = Phaser.Math.Distance.Between(t.x, t.y - 16, e.s.x, e.s.y - 10); if (dd < d) { d = dd; obj = t; } }
        if (!obj) continue;
        if (E.oculto && !e.despierto) {
          if (e.clase === 'golem') { const marca = tiene('casco'); if (e.marcado !== marca) { e.marcado = marca; e.s.setTint(marca ? 0xc9a0ff : 0xffffff); } }
          if (d < 80) { this.despertar(e); this.flotante(e.s.x, e.s.y - 40, { escorpion: '¡Sssh!', golem: '¡GRRUM!' }[e.clase] || '¡Je, je!', '#ffb4a3'); }
          continue;
        }
        if (e.huye) { this.huir(e, obj, d, seg); continue; }
        const persigue = e.ocupado ? true : d < (e.radio || E.radio || 240);
        const destino = persigue ? { x: obj.x, y: obj.y - 8 } : e.origen;
        const dx = destino.x - e.s.x, dy = destino.y - e.s.y, l = Math.hypot(dx, dy);
        const mueve = l > (e.ocupado ? 26 : 4);
        if (mueve) this.pasoEnemigo(e, (dx / l) * E.vel * seg, (dy / l) * E.vel * seg, E.flota);
        if (E.anim && (!E.oculto || e.despierto)) {
          if (mueve) e.s.anims.play(`${E.anim}_${Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down')}`, true);
          else { e.s.anims.stop(); e.s.setFrame(DIRS.down * 9); }
        }
        if (!E.flota) e.s.setDepth(e.s.y);
        if (!persigue && E.oculto && l < 6) this.esconder(e);
        if (persigue && obj.yo && !e.ocupado && d < 30) this.empezarCombate(e);
      }
      // bichos que caen de los árboles cuando pasa cualquier jugador del grupo
      for (const o of this.objetos) {
        if (o.tipo !== 'arbol' || !o.bicho || o.estado !== 'arbol') continue;
        const t = todos.find((p) => Phaser.Math.Distance.Between(p.x, p.y, o.x, o.y) < 56);
        if (t) { this.soltarBicho(o); if (t.yo && this.canal) this.canal.emitir('bicho', { i: o.idx }); }
      }
    }
    enAgua(x, y) { return (this.aguas || []).some((a) => x > a.x0 && x < a.x1 && y > a.y0 && y < a.y1); }
    // Mueve a un enemigo; los que caminan no pueden entrar al agua (se deslizan por la orilla)
    pasoEnemigo(e, dx, dy, vuela) {
      const x = e.s.x, y = e.s.y;
      if (vuela || !this.aguas || !this.aguas.length || this.enAgua(x, y) || !this.enAgua(x + dx, y + dy)) { e.s.x = x + dx; e.s.y = y + dy; return; }
      if (dx && !this.enAgua(x + dx, y)) { e.s.x = x + dx; return; }
      if (dy && !this.enAgua(x, y + dy)) e.s.y = y + dy;
    }
    soltarBicho(arbol) {
      if (!arbol.bicho) return;
      arbol.bicho = false;
      const s = this.add.sprite(arbol.x, arbol.y - 4, 'jabali_hoja', DIRS.down * 9).setOrigin(0.5, 0.9).setDepth(arbol.y - 2);
      s.anims.play('jabali_down');
      const viejo = this.enemigos.findIndex((x) => x.k === `b${arbol.idx}`);
      if (viejo >= 0) this.enemigos.splice(viejo, 1);
      const e = this.nuevoEnemigo('bicho', s, { cayendo: true, k: `b${arbol.idx}` });
      this.enemigos.push(e);
      this.flotante(arbol.x, arbol.y - 90, '¡Cuidado!', '#ffb4a3');
      this.cameras.main.shake(120, 0.003);
      this.tweens.add({ targets: s, y: arbol.y + 40, duration: 380, ease: 'Quad.out', onUpdate: () => s.setDepth(s.y),
        onComplete: () => { e.cayendo = false; e.origen = { x: s.x, y: s.y }; } });
      this.time.delayedCall(120000, () => { arbol.bicho = true; });
    }
    empezarCombate(e) {
      if (this.enCombate || this.enJefe) return;
      if (S.arma && S.herramienta !== 'espada') equipar('espada');
      this.enCombate = true;
      this.jugador.setVelocity(0, 0);
      this.cameras.main.shake(150, 0.004); sfx('alerta');
      if (this.canal && e.k) this.canal.emitir('lucha', { k: e.k, id: idJuego });
      combateActual = e;
      abrirCombate(e, (resultado) => {
        this.enCombate = false; combateActual = null;
        const E = ENEMIGOS[e.clase];
        if (this.canal && e.k) this.canal.emitir(resultado === 'victoria' ? 'vencido' : 'libre', { k: e.k });
        if (e.desafio && resultado !== 'victoria' && vivo.fase !== 'activo') this.time.delayedCall(4200, () => this.limpiarDesafio());
        if (resultado === 'victoria') {
          Object.entries(e.botin || E.botin).forEach(([r, n], i) => { sumar(r, n); this.time.delayedCall(i * 300, () => this.flotante(e.s.x, e.s.y - 40 - i * 18, `+${n} ${r}`)); });
          S.vencidos = (S.vencidos || 0) + 1;
          ganarXP(E.xp);
          avanzarMision(e.clase);
          this.vencerEnemigo(e);
          if (e.desafio) eventoDesafio('vencer', e);
          guardar(true);
        } else if (resultado === 'huir') {
          if (escudoActivo()) toast('Huiste y tu escudo de cristal te protegió del golpe.');
          else {
            S.vida = Math.max(0, S.vida - VIDA_HUIR); pintarHUD(); this.dolor();
            if (S.vida <= 0) { morir(E.nombre.toLowerCase()); return; }
            toast(`Huiste, pero el ${E.nombre.toLowerCase()} te alcanzó a golpear: −${VIDA_HUIR} corazón.`, 'alerta');
          }
          guardar();
          e.aturdido = this.time.now + 4000;
          const ang = Phaser.Math.Angle.Between(e.s.x, e.s.y, this.jugador.x, this.jugador.y);
          this.jugador.x += Math.cos(ang) * 40; this.jugador.y += Math.sin(ang) * 40;
        } else if (resultado === 'derrota') {
          morir(E.nombre.toLowerCase());
        }
      });
    }
    // El enemigo desaparece (lo venció este jugador o un compañero) y reaparece más tarde
    vencerEnemigo(e) {
      if (!e.activo) return;
      e.activo = false; e.ocupado = null;
      this.add.particles(e.s.x, e.s.y - 10, 'p_morado', { speed: { min: 60, max: 160 }, lifespan: 700, scale: { start: 1.5, end: 0 }, emitting: false }).setDepth(99999).explode(24);
      this.tweens.add({ targets: e.s, alpha: 0, scale: 0.5, duration: 400, onComplete: () => e.s.setVisible(false) });
      const E = ENEMIGOS[e.clase];
      if (e.desafio) { this.time.delayedCall(450, () => { e.s.destroy(); if (e.extra) e.extra.destroy(); this.enemigos = this.enemigos.filter((x) => x !== e); }); return; }
      if (e.clase !== 'bicho') this.time.delayedCall(150000, () => { e.s.setPosition(e.origen.x, e.origen.y).setAlpha(E.alfa || 1).setScale(E.anim ? 1 : 2).setVisible(true); if (E.oculto) this.esconder(e); e.vida = e.vidaMax; e.activo = true; });
    }
    enemigo(k) { return this.enemigos.find((x) => x.k === k); }
    // Enemigos escondidos (arbusto o montículo): salen al acercarse y vuelven a esconderse
    despertar(e) {
      const E = ENEMIGOS[e.clase];
      e.despierto = true;
      if (e.marcado) { e.s.clearTint(); e.marcado = false; }
      if (E.anim) { e.s.setTexture(`${E.anim}_hoja`, DIRS.down * 9).setOrigin(0.5, 0.9).setScale(1); this.tweens.add({ targets: e.s, y: e.s.y + 4, duration: 90, yoyo: true }); }
      else { e.s.setTexture(E.texVivo); this.tweens.add({ targets: e.s, scaleX: 2.3, scaleY: 1.8, duration: 120, yoyo: true }); }
    }
    esconder(e) {
      const E = ENEMIGOS[e.clase];
      e.despierto = false;
      if (E.anim) { e.s.anims.stop(); e.s.setTexture(E.tex).setOrigin(0.5, 1).setScale(2); } else e.s.setTexture(E.tex);
    }
    golpeEnemigo(e, n) {
      this.flotante(e.s.x, e.s.y - 36, `−${n}`, '#ffd27a');
      this.tweens.add({ targets: e.s, x: e.s.x + 4, duration: 50, yoyo: true, repeat: 2 });
    }
    dolor() {
      this.cameras.main.shake(180, 0.006);
      this.cameras.main.flash(160, 180, 40, 30);
    }

    // ---------- interacción ----------
    buscarObjetivo() {
      if (!this.jugador) return;
      const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[this.dir];
      const px = this.jugador.x + v[0] * 22, py = this.jugador.y - 6 + v[1] * 18;
      let mejor = null, puntaje = Infinity;
      for (const o of this.objetos) {
        if (!o.activo) continue;
        const d = Phaser.Math.Distance.Between(px, py, o.x, o.y);
        const lim = o.tipo === 'jefe' || o.tipo === 'santuario' || o.tipo === 'coloso' ? 80 : o.tipo === 'esfinge' ? 60 : ['fogata', 'portal', 'cofre_base', 'puerta', 'prisma', 'muelle', 'obra', 'sitio', 'carrera', 'altar'].includes(o.tipo) || o.carpa ? 50 : o.piso ? 44 : 36;
        const pena = o.piso ? 30 : 0;
        if (d < lim && d - lim + pena < puntaje) { mejor = o; puntaje = d - lim + pena; }
      }
      if (!mejor) {
        for (const L of this.lagos) {
          if (px > L.x - 14 && px < L.x + L.w + 14 && py > L.y - 14 && py < L.y + L.h + 14) { mejor = { tipo: 'agua', x: px, y: py }; break; }
        }
      }
      this.objetivo = mejor;
      const txt = mejor ? this.textoAccion(mejor) : null;
      const aviso = $('aviso');
      if (txt && !ui.abierto) { $('aviso-txt').textContent = txt; aviso.classList.remove('oculto'); } else aviso.classList.add('oculto');
      $('btn-accion').textContent = txt ? txt.split(' ')[0] : 'Acción';
    }
    textoAccion(o) {
      switch (o.tipo) {
        case 'arbol':
          if (o.rec === 'fibra') return o.estado === 'arbol' ? 'Cortar cactus' : 'Cactus pequeño: está creciendo';
          if (o.rec === 'hongo') return o.estado === 'arbol' ? 'Recolectar hongos' : 'Hongos pequeños: están creciendo';
          if (o.rec === 'baya') return o.estado === 'arbol' ? 'Recolectar bayas' : 'Arbusto sin bayas: volverán a crecer';
          if (o.rec === 'resina') return o.estado !== 'arbol' ? 'Tocón ancestral: el árbol volverá a crecer' : tiene('hacha2') ? 'Sacar resina del árbol gigante' : 'Árbol gigante: necesitas el hacha de hierro';
          if (o.rec === 'cristal_eco') return o.estado !== 'arbol' ? 'Cristales pequeños: están volviendo a crecer' : tiene('cincel') ? 'Desprender cristales resonantes' : 'Cristales resonantes: necesitas un cincel de cristal';
          if (o.rec === 'miel') return o.estado !== 'arbol' ? 'Colmena vacía: las abejas están haciendo más miel' : tiene('ahumador') ? 'Recolectar miel' : 'Colmena: necesitas un ahumador';
          return o.estado === 'arbol' ? `Talar ${o.nombre}` : o.estado === 'tocon' ? 'Tocón: volverá a crecer' : 'Brote: está creciendo';
        case 'roca':
          if (o.req && !tiene(o.req)) return `${o.nombre}: necesitas ${NOMBRE_MEJORA[o.req].toLowerCase()}`;
          return tiene('pico') ? `Picar ${o.nombre || 'roca'}` : `${o.nombre || 'Roca'}: necesitas un pico`;
        case 'agua': return tiene('balde') ? 'Sacar agua' : 'Lago: necesitas un balde';
        case 'cofre': return o.vida ? 'Abrir cofre (tiene vida)' : 'Abrir cofre';
        case 'fogata': return 'Fabricar y descansar';
        case 'cofre_base': return 'Ver tu cofre';
        case 'portal': return 'Usar el portal';
        case 'jefe': return this.textoJefe();
        case 'prisma': return 'Tomar el prisma estelar (responde 5 preguntas)';
        case 'obra': return o.listo ? null : this.valle ? 'Ver y aportar al montacargas' : this.prof ? 'Ver y aportar al elevador' : 'Ver y aportar al puente';
        case 'santuario': return !tiene('amuleto') ? 'Santuario sellado: necesitas el amuleto ancestral' : (S.reyHasta || 0) > Date.now() ? 'El Rey Jabalí descansa' : '¡Desafiar al Rey Jabalí Ancestral!';
        case 'carrera': return 'Entrar a la estación de carreras de vagonetas';
        case 'altar': return o.estado === 'vacio' ? 'Altar apagado: vuelve más tarde' : 'Resolver el rompecabezas de cristales';
        case 'coloso': return !tiene('corazon_cristal') ? 'Coloso sellado: necesitas el corazón de cristal' : (S.colosoHasta || 0) > Date.now() ? 'El Coloso de Magma descansa' : '¡Desafiar al Coloso de Magma!';
        case 'esfinge': return tiene('antorcha_esfinge') ? 'Entrar al laberinto de la Gran Esfinge' : 'Gran Esfinge: necesitas la antorcha de la esfinge';
        case 'sitio': return o.estado === 'vacio' ? 'Sitio excavado: vuelve más tarde' : tiene('pala') ? 'Excavar el sitio arqueológico' : 'Sitio arqueológico: necesitas una pala de arqueólogo';
        case 'muelle': return tiene('cana') ? `Pescar (caña: ${usosCana()} de ${CANA_USOS} usos)` : 'Muelle: necesitas una caña de pescar';
        case 'colocado': return o.carpa ? 'Entrar a tu pieza (R: guardar la carpa)' : `Guardar ${o.nombre.toLowerCase()}`;
        case 'puerta': return 'Salir a tu base';
        default: return null;
      }
    }
    mirarA(o) {
      const dx = o.x - this.jugador.x, dy = o.y - this.jugador.y;
      this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      this.jugador.setFrame(DIRS[this.dir] * 9);
    }
    interactuar() {
      this.buscarObjetivo();
      const o = this.objetivo;
      if (!o) return;
      if (o.tipo === 'fogata') { if (S.vida < vidaMax()) { S.vida = vidaMax(); pintarHUD(); toast('Descansaste junto al fuego: recuperaste tu vida.'); } return abrirFabricar(); }
      if (o.tipo === 'cofre_base') return abrirCofre();
      if (o.tipo === 'portal') return abrirPortal();
      if (o.tipo === 'jefe') return this.pedirJefe();
      if (o.tipo === 'prisma') return abrirPrisma();
      if (o.tipo === 'obra') return o.listo ? null : abrirObra();
      if (o.tipo === 'santuario') {
        if (!tiene('amuleto')) return toast('El santuario está sellado. Fabrica el amuleto ancestral (resina y miel) en la fogata de tu base.', 'alerta');
        if ((S.reyHasta || 0) > Date.now()) return toast(`El Rey Jabalí Ancestral descansa. Vuelve en ${Math.ceil((S.reyHasta - Date.now()) / 60000)} min.`);
        return abrirReyJabali();
      }
      if (o.tipo === 'arbol' && (o.rec === 'resina' || o.rec === 'miel')) {
        if (o.estado !== 'arbol') return toast(o.rec === 'miel' ? 'Esta colmena está vacía: vuelve más tarde.' : 'Este árbol gigante todavía está creciendo.');
        if (!tiene(o.req)) return toast(o.rec === 'miel' ? 'Las abejas no te dejan acercarte: fabrica un ahumador en tu base.' : 'La corteza es muy dura: necesitas el hacha de hierro.', 'alerta');
        if (o.rec === 'resina') equipar('hacha');
        const dif = difPara(2), cant = o.rec === 'resina' ? 2 + (tiene('hacha3') ? 2 : 0) : 2 + (dif > 2 ? 1 : 0);
        return abrirDesafio({ accion: o.rec === 'resina' ? 'Sacar resina del árbol gigante' : 'Recolectar miel', dif, premio: `Premio: ${cant} ${o.rec}${o.rec === 'resina' ? ' + 2 madera' : ''}`, onOk: () => {
          this.golpe(o, o.rec, cant);
          if (o.rec === 'resina') { sumar('madera', 2); this.time.delayedCall(350, () => this.flotante(o.x, o.y - 58, '+2 madera')); }
          avanzarMision(o.rec === 'resina' ? 'resina' : 'colmena');
        } });
      }
      if (o.tipo === 'carrera') return abrirCarrera();
      if (o.tipo === 'altar') {
        if (o.estado === 'vacio') return toast('Este altar está apagado. Vuelve en unos minutos o busca otro.');
        this.mirarA(o);
        return abrirDesafio({ accion: 'Activar el altar de cristal', dif: difPara(2), premio: 'Premio: resolver el rompecabezas de cristales', onOk: () => abrirCristales(() => this.altarUsado(o)) });
      }
      if (o.tipo === 'coloso') {
        if (!tiene('corazon_cristal')) return toast('El Coloso está sellado. Fabrica el corazón de cristal (cristal resonante y magma) en la fogata de tu base.', 'alerta');
        if ((S.colosoHasta || 0) > Date.now()) return toast(`El Coloso de Magma descansa. Vuelve en ${Math.ceil((S.colosoHasta - Date.now()) / 60000)} min.`);
        return abrirColoso();
      }
      if (o.tipo === 'arbol' && o.rec === 'cristal_eco') {
        if (o.estado !== 'arbol') return toast('Estos cristales todavía están creciendo.');
        if (!tiene('cincel')) return toast('Se romperían en pedazos: necesitas un cincel de cristal. Fabrícalo en tu base.', 'alerta');
        const dif = difPara(2), cant = 2 + (dif > 2 ? 1 : 0);
        return abrirDesafio({ accion: 'Desprender cristales resonantes', dif, premio: `Premio: ${cant} cristales resonantes`, onOk: () => { this.golpe(o, 'cristal_eco', cant); avanzarMision('cristal_eco'); } });
      }
      if (o.tipo === 'esfinge') {
        if (!tiene('antorcha_esfinge')) return toast('Dentro de la esfinge está muy oscuro: fabrica la antorcha de la esfinge (obsidiana y fósiles) en la fogata de tu base.', 'alerta');
        this.dir = 'up';
        return abrirLaberinto();
      }
      if (o.tipo === 'sitio') {
        if (o.estado === 'vacio') return toast('Este sitio ya fue excavado. Vuelve en unos minutos o busca otro.');
        if (!tiene('pala')) return toast('Necesitas una pala de arqueólogo. Fabrícala en la fogata de tu base (pestaña Equipo).', 'alerta');
        this.mirarA(o);
        return abrirDesafio({ accion: 'Descifrar la inscripción del sitio', dif: difPara(2), premio: 'Premio: excavar el sitio arqueológico', onOk: () => abrirExcavacion((n) => { this.sitioExcavado(o); avanzarMision('excavar'); }) });
      }
      if (o.tipo === 'muelle') {
        if (!tiene('cana')) return toast('Necesitas una caña de pescar. Fabrícala en la fogata de tu base (pestaña Equipo).');
        this.dir = 'up';
        return abrirPesca(Boolean(o.profundo));
      }
      if (o.tipo === 'colocado') return o.carpa ? this.entrarPieza(o) : this.quitar(o);
      if (o.tipo === 'puerta') return this.salirPieza();
      if (o.tipo === 'arbol' && o.rec === 'baya') {
        if (o.estado !== 'arbol') return toast('Este arbusto todavía no tiene bayas.');
        const dif = difPara(1), cant = 2 + dif - 1;
        return abrirDesafio({ accion: 'Recolectar bayas de invierno', dif, premio: `Premio: ${cant} bayas de invierno`, onOk: () => this.golpe(o, 'baya', cant) });
      }
      if (o.tipo === 'arbol' && o.rec === 'hongo') {
        if (o.estado !== 'arbol') return toast('Estos hongos todavía están creciendo.');
        const dif = difPara(1), cant = 2 + dif - 1;
        return abrirDesafio({ accion: 'Recolectar hongos luminosos', dif, premio: `Premio: ${cant} hongos luminosos`, onOk: () => this.golpe(o, 'hongo', cant) });
      }
      if (o.tipo === 'arbol' && o.rec === 'fibra') {
        if (o.estado !== 'arbol') return toast('Este cactus todavía está creciendo.');
        equipar('hacha');
        const dif = difPara(1), cant = 2 + (tiene('hacha2') ? 1 : 0) + dif - 1;
        return abrirDesafio({ accion: 'Cortar cactus', dif, premio: `Premio: ${cant} fibra de cactus`, onOk: () => this.golpe(o, 'fibra', cant) });
      }
      if (o.tipo === 'roca' && o.rec) {
        if (!tiene('pico')) return toast('Necesitas un pico. Fabrícalo en la fogata de tu base.');
        if (o.req && !tiene(o.req)) return toast(o.rec === 'magma' ? 'La roca de magma quema: necesitas unos guantes térmicos. Fabrícalos en tu base.' : `Para picar esta veta necesitas ${NOMBRE_MEJORA[o.req].toLowerCase()}. Fabrícalo en tu base.`, 'alerta');
        equipar('pico');
        const comun = ['arenisca', 'carbon', 'hielo'].includes(o.rec), raro = ['oro', 'amatista', 'zafiro', 'obsidiana'].includes(o.rec);
        const cant = (raro ? 1 : 2) + (tiene(o.picoBueno || 'pico3') ? (comun ? 2 : 1) : 0);
        return abrirDesafio({ accion: `Picar ${o.nombre}`, dif: comun ? difPara(2) : 3, premio: `Premio: ${cant} ${nombreRec(o.rec)}${o.extra ? ` + posible ${nombreRec(o.extra)}` : ''}`, onOk: () => this.golpe(o, o.rec, cant) });
      }
      if (o.tipo === 'arbol') {
        if (o.estado !== 'arbol') return toast('Este árbol todavía está creciendo.');
        equipar('hacha');
        const dif = difPara(1), cant = 2 + (tiene('hacha2') ? 2 : 0) + (tiene('hacha3') ? 1 : 0) + dif - 1;
        return abrirDesafio({ accion: `Talar ${o.nombre}`, dif, premio: `Premio: ${cant} madera`, onOk: () => this.golpe(o, 'madera', cant) });
      }
      if (o.tipo === 'roca') {
        if (!tiene('pico')) return toast('Necesitas un pico. Fabrícalo en la fogata de tu base.');
        equipar('pico');
        const cant = 2 + (tiene('pico2') ? 2 : 0);
        return abrirDesafio({ accion: 'Picar roca', dif: difPara(2), premio: `Premio: ${cant} piedra + posible cristal`, onOk: () => this.golpe(o, 'piedra', cant) });
      }
      if (o.tipo === 'agua') {
        if (!tiene('balde')) return toast('Necesitas un balde. Fabrícalo en la fogata de tu base.');
        return abrirDesafio({ accion: 'Sacar agua del lago', dif: difPara(1), premio: 'Premio: 2 agua', onOk: () => this.golpe(o, 'agua', 2) });
      }
      if (o.tipo === 'cofre') {
        const premio = Object.entries((MUNDOS[this.zona] && MUNDOS[this.zona].cofre) || { cristal: 2, madera: 4 });
        return abrirDesafio({ accion: o.vida ? 'Abrir cofre con vida' : 'Abrir cofre', dif: 3, premio: `Premio: ${premio.map(([r, n]) => `${n} ${nombreRec(r)}`).join(' + ')}${o.vida ? ` + ${VIDA_COFRE} corazones` : ''}`, onOk: () => {
          this.golpe(o, premio[0][0], premio[0][1]); premio.slice(1).forEach(([r, n]) => sumar(r, n));
          if (o.vida) {
            const antes = S.vida; S.vida = Math.min(vidaMax(), S.vida + VIDA_COFRE); pintarHUD();
            this.time.delayedCall(600, () => this.flotante(o.x, o.y - 76, S.vida > antes ? `+${S.vida - antes} ❤` : 'Vida al máximo', '#ff9c8a'));
          }
        } });
      }
    }

    golpe(o, recurso, cant) {
      this.mirarA(o);
      sfx(o.tipo === 'roca' ? 'picar' : o.tipo === 'agua' ? 'agua' : o.tipo === 'cofre' ? 'cofre' : ['baya', 'hongo', 'miel'].includes(o.rec) ? 'recolectar' : 'talar');
      setTimeout(() => sfx('moneda'), 180);
      const j = this.jugador;
      this.tweens.add({ targets: j, y: j.y - 3, duration: 80, yoyo: true, repeat: 1 });
      const px = { resina: 'p_cobre', miel: 'p_brillo', madera: 'p_madera', piedra: 'p_piedra', agua: 'p_agua', cristal: 'p_brillo', fibra: 'p_hoja', arenisca: 'p_arena', cobre: 'p_cobre', oro: 'p_brillo', carbon: 'p_carbon', plata: 'p_piedra', amatista: 'p_morado', hongo: 'p_rojo', baya: 'p_rojo', hielo: 'p_nieve', escarcha: 'p_nieve', zafiro: 'p_agua', obsidiana: 'p_morado', fosil: 'p_arena', magma: 'p_rojo', cristal_eco: 'p_agua' }[recurso] || 'p_brillo';
      this.add.particles(o.x, o.y - 14, px, { speed: { min: 60, max: 150 }, angle: { min: 200, max: 340 }, gravityY: 320, lifespan: 600, scale: { start: 1.4, end: 0.4 }, emitting: false }).setDepth(o.y + 50).explode(16);
      if (o.s) this.tweens.add({ targets: o.s, x: o.s.x + 3, duration: 50, yoyo: true, repeat: 3 });
      sumar(recurso, cant);
      this.flotante(o.x, o.y - 40, `+${cant} ${nombreRec(recurso)}`);
      avanzarMision(o.evento || { arbol: 'talar', roca: 'picar', agua: 'agua', cofre: 'cofre' }[o.tipo]);
      const extra = o.rec ? o.extra : 'cristal';
      if (o.tipo === 'roca' && extra && this.rnd() < (tiene(o.rec ? (o.picoBueno || 'pico3') : 'pico2') ? 0.35 : 0.15)) {
        sumar(extra, 1);
        this.time.delayedCall(350, () => this.flotante(o.x, o.y - 58, `+1 ${nombreRec(extra)}`, extra === 'cobre' ? '#ffb27a' : extra === 'plata' ? '#e6ecff' : extra === 'escarcha' ? '#bff4ff' : '#9ff0e4'));
      }
      if (o.tipo === 'arbol' || o.tipo === 'roca' || o.tipo === 'cofre') {
        const n = o.tipo === 'roca' ? Math.max(0, o.nivel - 1) : o.tipo === 'arbol' ? 'tocon' : 'abierto';
        if (o.tipo === 'arbol') this.time.delayedCall(250, () => this.add.particles(o.x, o.y - 30, 'p_hoja', { speed: { min: 40, max: 110 }, lifespan: 700, gravityY: 200, emitting: false }).setDepth(o.y + 50).explode(14));
        this.aplicarNodo(o, n, 0);
        this.compartirNodo(o, n);
      }
      guardar();
    }
    // Estado de árboles, rocas y cofres; "edad" = ms desde que ocurrió (para compañeros que llegan tarde)
    aplicarNodo(o, n, edad = 0) {
      (o.timers || []).forEach((t) => t.remove(false));
      o.timers = [];
      const espera = (ms, f) => { if (ms > 0) o.timers.push(this.time.delayedCall(ms, f)); else f(); };
      if (o.tipo === 'arbol') {
        const aBrote = 45000 - edad, aArbol = 90000 - edad;
        if (aArbol <= 0) { o.estado = 'arbol'; o.s.setTexture(o.key); return; }
        o.estado = aBrote > 0 ? 'tocon' : 'brote';
        o.s.setTexture(o.estado === 'tocon' ? (o.texTocon || 'tocon') : (o.texBrote || 'brote'));
        if (aBrote > 0) espera(aBrote, () => { o.estado = 'brote'; o.s.setTexture(o.texBrote || 'brote'); });
        espera(aArbol, () => { o.estado = 'arbol'; o.s.setTexture(o.key); });
      } else if (o.tipo === 'roca') {
        const volver = () => { o.nivel = o.nivelMax || 3; o.s.setTexture(`${o.base}${o.nivel}`).setVisible(true); o.z.body.enable = true; o.activo = true; };
        o.nivel = n;
        if (n > 0) { o.s.setTexture(`${o.base}${n}`).setVisible(true); o.z.body.enable = true; o.activo = true; }
        else if (90000 - edad <= 0) volver();
        else { o.activo = false; o.s.setVisible(false); o.z.body.enable = false; espera(90000 - edad, volver); }
      } else if (o.tipo === 'cofre') {
        const volver = () => { o.s.setAlpha(1).setVisible(true); o.z.body.enable = true; o.activo = true; if (o.corazon) o.corazon.setVisible(true); };
        if (150000 - edad <= 0) { volver(); return; }
        o.activo = false; o.z.body.enable = false;
        if (o.corazon) o.corazon.setVisible(false);
        this.tweens.add({ targets: o.s, alpha: 0, duration: 500, onComplete: () => { if (!o.activo) o.s.setVisible(false); } });
        espera(150000 - edad, volver);
      }
    }
    // ---------- modo cooperativo ----------
    iniciarCoop() {
      const meta = { id: idJuego, nombre: S.docente ? 'Profe' : `${S.nombre}${S.seccion ? ' · ' + S.seccion : ''}`, pj: S.pj, docente: Boolean(S.docente) };
      this.jefe = { estado: 'libre', hp: 0, max: 0, part: [], lider: null, hasta: 0 };
      this.estadoJug = new Map(); this.yoEnGuarida = false; this.enJefe = false;
      this.ultimoMov = { t: 0, x: 0, y: 0, m: false };
      this.primeraPresencia = true;
      const c = new Coop.Canal(`mw-${nivelNum()}-${this.zona}-g${S.grupo}`, idJuego, meta);
      this.canal = c;
      c.alEstado = (e) => {
        if (e === 'ok') { c.emitir('hola', { id: idJuego }); this.ultimoMov.t = 0; this.avisarGuarida(); }
        if (e === 'error') toast('No se pudo conectar con tu grupo: por ahora juegas solo.', 'alerta');
        pintarCoop();
      };
      c.alCambiarPresencia = (p) => this.sincronizarPresencia(p);
      c.on('mov', (d) => this.recibirMov(d));
      c.on('nodo', (d) => { const o = this.objetos[d.i]; if (o && o.idx === d.i) { this.cambios.set(d.i, { n: d.n, t: Date.now() }); this.aplicarNodo(o, d.n, 0); } });
      c.on('hola', (d) => {
        this.ultimoMov.t = 0;
        this.avisarGuarida();
        const otros = Object.keys(c.presencia).filter((k) => k !== d.id).concat(idJuego).sort();
        if (otros[0] !== idJuego) return;
        c.emitir('estado', { para: d.id, nodos: [...this.cambios].map(([i, v]) => [i, v.n, Date.now() - v.t]).filter((x) => x[2] < 150000), jefe: this.jefeParaEnviar() });
      });
      c.on('estado', (d) => {
        if (d.para !== idJuego) return;
        (d.nodos || []).forEach(([i, n, e]) => { const o = this.objetos[i]; if (o && o.idx === i) { this.cambios.set(i, { n, t: Date.now() - e }); this.aplicarNodo(o, n, e); } });
        if (d.jefe) this.recibirJefe(d.jefe);
      });
      c.on('guarida', (d) => { if (d && d.id) this.estadoJug.set(d.id, { dentro: Boolean(d.dentro), listo: d.listo === true }); });
      c.on('jefe', (d) => this.recibirJefe(d));
      c.on('jefe_lugar', (d) => this.fijarLugarJefe(d, false));
      c.on('prisma_prog', (d) => recibirPrismaProg(d));
      c.on('obra', () => cargarObra());
      c.on('carrera', (d) => recibirCarrera(d));
      c.on('prisma_fin', (d) => recibirPrismaFin(d));
      // enemigos compartidos: cualquiera del grupo puede ser perseguido, y si alguien vence a uno desaparece para todos
      c.on('bicho', (d) => { const o = this.objetos[d.i]; if (o && o.idx === d.i && o.tipo === 'arbol' && o.estado === 'arbol') this.soltarBicho(o); });
      c.on('lucha', (d) => { const e = this.enemigo(d.k); if (e && e.activo) { e.ocupado = d.id; if (ENEMIGOS[e.clase].oculto && !e.despierto) this.despertar(e); } });
      c.on('libre', (d) => { const e = this.enemigo(d.k); if (e) { e.ocupado = null; e.aturdido = this.time.now + 3000; } });
      c.on('vencido', (d) => { const e = this.enemigo(d.k); if (e && !(this.enCombate && combateActual === e)) this.vencerEnemigo(e); });
      c.on('jefe_pedir', () => this.iniciarJefeSiLider());
      c.on('golpe', (d) => this.golpeAlJefe(d.dmg));
      c.on('caido', (d) => this.sacarDelJefe(d.id));
    }
    sincronizarPresencia(p) {
      const ids = new Set(Object.keys(p));
      if (this.primeraPresencia) {
        this.primeraPresencia = false;
        const otrosEst = Object.entries(p).filter(([id, m]) => id !== idJuego && !m.docente).length;
        if (otrosEst >= MAX_GRUPO && !S.docente) {
          toast(`El grupo ${S.grupo} ya tiene ${MAX_GRUPO} jugadores: exploras solo. Usa el portal para elegir otro grupo.`, 'alerta');
          this.canal.salir(); this.canal = null; S.grupo = 0; pintarCoop(); guardar(true);
          return;
        }
      }
      for (const [id, meta] of Object.entries(p)) if (id !== idJuego && !this.otros.has(id)) this.crearOtro(id, meta);
      for (const id of [...this.otros.keys()]) if (!ids.has(id)) this.quitarOtro(id);
      for (const id of [...this.estadoJug.keys()]) if (!ids.has(id)) this.estadoJug.delete(id);
      const J = this.jefe;
      if (J && J.estado === 'combate') {
        const antes = J.lider;
        J.part = J.part.filter((x) => ids.has(x) || x === idJuego);
        if (!J.part.includes(J.lider)) J.lider = [...J.part].sort()[0] || null;
        if (J.lider === idJuego && antes !== idJuego) { if (!J.part.length) J.estado = 'libre'; this.publicarJefe(); }
      }
      pintarCoop();
    }
    crearOtro(id, meta) {
      const pj = PERSONAJES.some((x) => x.id === meta.pj) ? meta.pj : 'zorro';
      const spr = this.add.sprite(this.inicio.x, this.inicio.y, `pj_${pj}_nada`, DIRS.down * 9).setOrigin(0.5, 0.9).setAlpha(0);
      const capas = this.crearCapas();
      const tag = this.add.text(spr.x, spr.y - 60, String(meta.nombre || 'Compañero').slice(0, 28), {
        fontFamily: 'Nunito, sans-serif', fontSize: '11px', fontStyle: 'bold', color: meta.docente ? '#ffd27a' : '#ffffff', backgroundColor: 'rgba(18,32,26,0.8)', padding: { x: 4, y: 1 },
      }).setOrigin(0.5).setResolution(3).setDepth(99990).setAlpha(0);
      this.otros.set(id, { spr, tag, capas, meta, pj, obj: { x: spr.x, y: spr.y }, dir: 'down', h: 'hacha', a: null, w: null, m: false, visto: false });
      this.vestir(spr, capas, pj, null, 'hacha', null);
    }
    quitarOtro(id) {
      const o = this.otros.get(id); if (!o) return;
      o.spr.destroy(); o.tag.destroy(); o.capas.atras.destroy(); o.capas.mano.destroy(); this.otros.delete(id);
    }
    recibirMov(d) {
      const o = this.otros.get(d.id); if (!o) return;
      const h = ['hacha', 'pico', 'espada'].includes(d.h) ? d.h : 'hacha';
      const a = ARMADURAS[d.a] ? d.a : null, w = ARMAS[d.w] ? d.w : null;
      if (h !== o.h || a !== o.a || w !== o.w) { o.h = h; o.a = a; o.w = w; this.vestir(o.spr, o.capas, o.pj, a, h, w); }
      o.obj = { x: Number(d.x) || 0, y: Number(d.y) || 0 }; o.dir = DIRS[d.d] !== undefined ? d.d : 'down'; o.m = Boolean(d.m);
      if (!o.visto || Phaser.Math.Distance.Between(o.spr.x, o.spr.y, o.obj.x, o.obj.y) > 400) { o.spr.setPosition(o.obj.x, o.obj.y); o.visto = true; o.spr.setAlpha(1); o.tag.setAlpha(1); }
    }
    moverOtros(seg) {
      for (const o of this.otros.values()) {
        if (!o.visto) continue;
        const dx = o.obj.x - o.spr.x, dy = o.obj.y - o.spr.y, dist = Math.hypot(dx, dy);
        if (dist > 2) {
          const paso = Math.min(dist, 170 * seg);
          o.spr.x += (dx / dist) * paso; o.spr.y += (dy / dist) * paso;
          const dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
          o.spr.anims.play(`${o.spr.texture.key}_${dir}`, true);
        } else if (!o.m) { o.spr.anims.stop(); o.spr.setFrame(DIRS[o.dir] * 9); }
        o.spr.setDepth(o.spr.y);
        this.seguir(o.spr, o.capas);
        o.tag.setPosition(o.spr.x, o.spr.y - 62);
      }
    }
    enviarMovimiento(moviendo) {
      const c = this.canal; if (!c || c.est !== 'ok') return;
      const u = this.ultimoMov, j = this.jugador, ahora = this.time.now;
      const n = 1 + this.otros.size;
      const intervalo = Math.max(400, Math.min(2000, (1000 * n * n * 0.5) / 12));
      if (u.t && ahora - u.t < intervalo) return;
      const dist = Math.hypot(j.x - u.x, j.y - u.y);
      if (u.t && !moviendo && !u.m && dist < 2) return;
      if (u.t && moviendo && dist < 4) return;
      u.t = ahora; u.x = j.x; u.y = j.y; u.m = moviendo;
      c.emitir('mov', { id: idJuego, x: Math.round(j.x), y: Math.round(j.y), d: this.dir, h: S.herramienta, a: S.armadura || '', w: S.arma || '', m: moviendo });
    }
    compartirNodo(o, n) {
      if (!this.canal || o.idx === undefined) return;
      this.cambios.set(o.idx, { n, t: Date.now() });
      this.canal.emitir('nodo', { i: o.idx, n });
    }

    // ---------- jefe final cooperativo ----------
    revisarGuarida() {
      if (!this.canal) return;
      const dentro = Boolean(this.guarida && this.jefeVisto) && Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y, this.guarida.x, this.guarida.y) < 170;
      if (dentro !== this.yoEnGuarida) { this.yoEnGuarida = dentro; this.avisarGuarida(); }
      this.actualizarSello();
    }
    // Avisa al grupo si estoy en la guarida y si ya cumplí mis misiones
    avisarGuarida() {
      this.actualizarSello();
      if (!this.canal) return;
      this.canal.emitir('guarida', { id: idJuego, dentro: Boolean(this.yoEnGuarida), listo: misionesListas(this.zona) });
      if (this.jefeLugar) this.canal.emitir('jefe_lugar', this.jefeLugar);
    }
    // Jugadores del grupo (en este mundo) que ya cumplieron sus misiones
    jugadoresListos() {
      const ids = [...this.estadoJug].filter(([id, st]) => st.listo && this.otros.has(id)).map(([id]) => id);
      if (misionesListas(this.zona)) ids.push(idJuego);
      return ids;
    }
    // Solo cuentan los jugadores que ya cumplieron sus misiones
    jugadoresEnGuarida() {
      const ids = [...this.estadoJug].filter(([id, st]) => st.listo && st.dentro && this.otros.has(id)).map(([id]) => id);
      if (this.yoEnGuarida && misionesListas(this.zona)) ids.push(idJuego);
      return ids;
    }
    // El jefe está oculto hasta que al menos JEFE_MIN jugadores del grupo cumplan sus misiones
    jefeVisible() {
      const J = this.jefe;
      if (!this.canal || !J) return false;
      if (J.estado === 'combate') return true;
      return this.jefeDisponible() && this.jugadoresListos().length >= JEFE_MIN;
    }
    // Elige el claro donde aparece el jefe: lo decide el jugador listo con menor id (los demás esperan su aviso)
    elegirLugarJefe() {
      const listos = this.jugadoresListos().sort(), ahora = Date.now();
      if (!this.esperaLugar) this.esperaLugar = ahora;
      if (listos[0] !== idJuego && ahora - this.esperaLugar < 3000) return;
      this.esperaLugar = 0;
      this.fijarLugarJefe({ i: Math.floor(Math.random() * this.lugaresJefe.length), de: idJuego }, true);
    }
    // Si dos jugadores eligen a la vez, gana el de menor id: así todo el grupo ve al jefe en el mismo lugar
    fijarLugarJefe(l, emitir) {
      if (!l || typeof l.i !== 'number' || !this.lugaresJefe) return;
      if (this.jefeLugar && String(this.jefeLugar.de) < String(l.de)) return;
      this.jefeLugar = { i: l.i, de: String(l.de) };
      if (emitir && this.canal) this.canal.emitir('jefe_lugar', this.jefeLugar);
      this.actualizarSello();
    }
    actualizarSello() {
      if (!this.jefeTag || !MUNDOS[this.zona]) return;
      const quiere = this.jefeVisible(), nombre = JEFES[this.zona].nombre;
      if (quiere) this.ocultoDesde = 0;
      else if (this.jefeLugar && !this.ocultoDesde) this.ocultoDesde = Date.now();
      // si pasa un rato oculto, la próxima vez aparecerá en otro lugar
      if (!quiere && this.jefeLugar && Date.now() - this.ocultoDesde > 15000) { this.jefeLugar = null; this.jefeLugarPuesto = null; }
      if (quiere && !this.jefeLugar) this.elegirLugarJefe();
      const vis = quiere && Boolean(this.jefeLugar);
      if (vis && this.jefeLugarPuesto !== this.jefeLugar.i) {
        this.jefeLugarPuesto = this.jefeLugar.i;
        this.colocarJefe(this.jefeLugar.i);
      }
      if (vis !== this.jefeVisto) {
        this.jefeVisto = vis;
        this.objJefe.activo = vis;
        this.tweens.killTweensOf(this.jefeSpr);
        this.jefeTag.setVisible(vis);
        this.jefeAura.emitting = vis;
        if (this.jefeLuz) this.jefeLuz.setAlpha(vis ? 0.32 : 0);
        if (vis) {
          this.jefeSpr.setVisible(true).setAlpha(0).setScale(this.jefeEscala);
          this.tweens.add({ targets: this.jefeSpr, alpha: 1, duration: 900 });
          this.tweens.add({ targets: this.jefeSpr, scaleY: this.jefeEscala * 1.04, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
          this.add.particles(this.jefeSpr.x, this.jefeSpr.y - 40, 'p_morado', { speed: { min: 60, max: 200 }, lifespan: 900, scale: { start: 2, end: 0 }, emitting: false }).setDepth(99999).explode(40);
          if (this.jefe.estado !== 'combate') {
            // temblor: el jefe acaba de aparecer en algún lugar del mapa
            this.cameras.main.shake(1400, 0.012); sfx('jefe');
            avisoJefe(nombre);
          }
        } else {
          this.add.particles(this.jefeSpr.x, this.jefeSpr.y - 40, 'p_morado', { speed: { min: 40, max: 140 }, lifespan: 800, scale: { start: 1.6, end: 0 }, emitting: false }).setDepth(this.jefeSpr.depth + 1).explode(30);
          this.jefeSpr.setVisible(false).setAlpha(0);
          this.quitarZonaJefe();
          this.yoEnGuarida = false;
        }
      }
      if (vis) {
        const n = this.jugadoresEnGuarida().length;
        const txt = this.jefe.estado === 'combate' ? nombre : `${nombre}\n(${Math.min(n, JEFE_MIN)} de ${JEFE_MIN} jugadores aquí)`;
        if (txt !== this.jefeTagTxt) { this.jefeTagTxt = txt; this.jefeTag.setText(txt).setAlign('center'); }
      }
    }
    // Perder contra el jefe (quedarse sin corazones o retirarse): hay que volver a cumplir misiones
    perderContraJefe() {
      if (esDocente() || !MUNDOS[this.zona]) return;
      S.misiones[this.zona] = nuevasMisiones(this.zona);
      guardar(true);
      this.avisarGuarida();
      pintarMisiones();
      setTimeout(() => toast('El jefe te venció y desapareció para ti. Cumple tus nuevas misiones para que vuelva a aparecer.', 'alerta'), 1500);
    }
    jefeDisponible() { const J = this.jefe; return J && (J.estado === 'libre' || (J.estado === 'vencido' && J.hasta <= Date.now())); }
    textoJefe() {
      if (!misionesListas(this.zona)) { const M = misionesDe(this.zona); return `Jefe final: cumple tus misiones para enfrentarlo (${M.lista.filter((m) => m.p >= m.n).length} de ${M.lista.length})`; }
      if (!this.canal) return 'Jefe final: viaja con un grupo';
      const J = this.jefe;
      if (J.estado === 'combate') return J.part.includes(idJuego) ? 'Volver al combate' : 'Tu grupo está luchando';
      if (!this.jefeDisponible()) return `Jefe derrotado: vuelve en ${Math.ceil((J.hasta - Date.now()) / 60000)} min`;
      if (!this.jefeVisible()) return `Jefe oculto: ${this.jugadoresListos().length} de ${JEFE_MIN} jugadores listos`;
      const n = this.jugadoresEnGuarida().length;
      return n >= JEFE_MIN ? `¡Desafiar al jefe! (${n} jugadores)` : `Jefe final: ${n} de ${JEFE_MIN} jugadores aquí`;
    }
    pedirJefe() {
      if (!misionesListas(this.zona)) { toast(`Para enfrentar al jefe primero cumple tus ${MISIONES_JEFE} misiones de este mundo.`, 'alerta'); return abrirMisiones(); }
      if (!this.canal) return abrirInfoJefe(this.zona);
      const J = this.jefe;
      if (S.arma && S.herramienta !== 'espada') equipar('espada');
      if (J.estado === 'combate') { if (J.part.includes(idJuego) && !this.enJefe) { this.enJefe = true; abrirJefe(); } return; }
      if (!this.jefeDisponible()) return toast('El jefe se está recuperando. Vuelve en unos minutos.');
      if (!this.jefeVisible()) return toast(`El jefe sigue oculto: aparecerá cuando ${JEFE_MIN} jugadores de tu grupo cumplan sus misiones (van ${this.jugadoresListos().length}).`);
      const n = this.jugadoresEnGuarida().length;
      if (n < JEFE_MIN) return toast(`Faltan ${JEFE_MIN - n} ${JEFE_MIN - n === 1 ? 'compañero' : 'compañeros'} junto al jefe con sus misiones cumplidas para desafiarlo.`);
      this.canal.emitir('jefe_pedir', { id: idJuego });
      this.iniciarJefeSiLider();
    }
    iniciarJefeSiLider() {
      if (!this.jefeDisponible()) return;
      const part = this.jugadoresEnGuarida().sort();
      if (part.length < JEFE_MIN || part[0] !== idJuego) return;
      const max = (JEFES[this.zona].vida || JEFE_VIDA_POR_JUGADOR) * part.length;
      this.jefe = { estado: 'combate', hp: max, max, part, lider: idJuego, hasta: 0 };
      this.publicarJefe();
    }
    jefeParaEnviar() { const J = this.jefe; return { estado: J.estado, hp: J.hp, max: J.max, part: J.part, lider: J.lider, resta: Math.max(0, J.hasta - Date.now()), lugar: this.jefeLugar }; }
    publicarJefe() { if (this.canal) this.canal.emitir('jefe', this.jefeParaEnviar()); this.alCambiarJefe(); }
    recibirJefe(d) {
      this.jefe = { estado: d.estado, hp: d.hp, max: d.max, part: d.part || [], lider: d.lider, hasta: Date.now() + (d.resta || 0) };
      if (d.lugar) this.fijarLugarJefe(d.lugar, false);
      this.alCambiarJefe();
    }
    alCambiarJefe() {
      const J = this.jefe;
      if (J.estado === 'combate' && J.part.includes(idJuego) && !this.enJefe) { this.enJefe = true; abrirJefe(); }
      this.actualizarSello();
      actualizarJefeUI();
    }
    golpeLocal(dmg) {
      if (this.jefe.lider === idJuego) this.golpeAlJefe(dmg);
      else { this.canal.emitir('golpe', { id: idJuego, dmg }); this.jefe.hp = Math.max(0, this.jefe.hp - dmg); actualizarJefeUI(); }
      if (this.jefeSpr) { this.tweens.add({ targets: this.jefeSpr, x: this.jefeSpr.x + 5, duration: 50, yoyo: true, repeat: 2 }); this.flotante(this.jefeSpr.x, this.jefeSpr.y - 90, `−${dmg}`, '#ffd27a'); }
    }
    golpeAlJefe(dmg) {
      const J = this.jefe;
      if (J.lider !== idJuego || J.estado !== 'combate') return;
      J.hp = Math.max(0, J.hp - (Number(dmg) || 0));
      if (J.hp === 0) { J.estado = 'vencido'; J.hasta = Date.now() + JEFE_DESCANSO; }
      this.publicarJefe();
    }
    sacarDelJefe(id) {
      const J = this.jefe;
      if (J.estado !== 'combate' || J.lider !== idJuego) return;
      J.part = J.part.filter((x) => x !== id);
      if (!J.part.length) J.estado = 'libre';
      else if (!J.part.includes(J.lider)) J.lider = [...J.part].sort()[0];
      this.publicarJefe();
    }
    salirDelJefe() {
      this.enJefe = false;
      if (!this.canal) return;
      if (this.jefe.lider === idJuego) this.sacarDelJefe(idJuego);
      else this.canal.emitir('caido', { id: idJuego });
      this.jefe.part = this.jefe.part.filter((x) => x !== idJuego);
    }
    nombreJugador(id) { if (id === idJuego) return 'Tú'; const o = this.otros.get(id); return o ? String(o.meta.nombre || 'Compañero') : 'Compañero'; }

    // ---------- desafíos en vivo ----------
    puntoLibre(rmin, rmax) {
      const j = this.jugador, W = this.ancho * TILE, H = this.alto * TILE, m = TILE * 2.6;
      for (let i = 0; i < 24; i++) {
        const a = Math.random() * Math.PI * 2, r = rmin + Math.random() * (rmax - rmin);
        const x = Phaser.Math.Clamp(j.x + Math.cos(a) * r, m, W - m), y = Phaser.Math.Clamp(j.y + Math.sin(a) * r, m + 16, H - m);
        if (this.alcanzable(j.x, j.y) && !this.alcanzable(x, y)) continue;
        if (!this.physics.overlapRect(x - 14, y - 18, 28, 26, false, true).length) return { x, y };
      }
      return { x: Phaser.Math.Clamp(j.x + 60, m, W - m), y: Phaser.Math.Clamp(j.y, m + 16, H - m) };
    }
    crearBichoDesafio(clase, x, y, extra = {}) {
      const E = ENEMIGOS[clase];
      let s;
      if (E.anim) s = this.add.sprite(x, y, `${E.anim}_hoja`, DIRS.down * 9).setOrigin(0.5, 0.9);
      else {
        s = this.add.image(x, y, E.texVivo || { espiritu: 'nv_espiritu' }[clase] || clase).setScale(clase === 'espiritu' ? 2.2 : 2).setAlpha(E.alfa || 1);
        if (!E.flota) s.setOrigin(0.5, 1);
      }
      s.setDepth(E.flota ? 9000 : y);
      const e = this.nuevoEnemigo(clase, s, { despierto: true, desafio: true, soloYo: true, radio: 3000, ...extra });
      if (extra.vida) e.vidaMax = extra.vida;
      this.enemigos.push(e);
      this.add.particles(x, y - 16, 'p_morado', { speed: { min: 40, max: 130 }, lifespan: 500, scale: { start: 1.5, end: 0 }, emitting: false }).setDepth(99999).explode(18);
      return e;
    }
    // La manada del Rey Jabalí: jabalíes que salen junto al santuario
    soltarBichoJunto() {
      if (!this.rey) return;
      const a = Math.random() * Math.PI * 2;
      const e = this.crearBichoDesafio('bicho', this.rey.x + Math.cos(a) * 110, this.rey.y + 60 + Math.sin(a) * 50, { vida: 2 });
      this.flotante(e.s.x, e.s.y - 50, '¡La manada!', '#ffb4a3');
    }
    soltarHorda(n, refuerzo = false) {
      const clases = { base: ['niebla', 'bicho', 'arbusto'], pieza: ['bicho', 'arbusto'], u1: ['niebla', 'bicho', 'arbusto'], u2: ['esqueleto', 'remolino', 'escorpion'], u3: ['murcielago', 'minero', 'golem'], u4: ['lobo_nieve', 'espiritu', 'muneco'] }[this.zona] || ['niebla', 'bicho'];
      const j = this.jugador, W = this.ancho * TILE, H = this.alto * TILE, m = TILE * 2.6;
      this.cameras.main.shake(refuerzo ? 150 : 260, refuerzo ? 0.003 : 0.006);
      this.flotante(j.x, j.y - 80, refuerzo ? '¡Llegan más enemigos!' : '¡Una horda te rodea!', '#ffb4a3');
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.4, r = 230 + Math.random() * 90;
        const x = Phaser.Math.Clamp(j.x + Math.cos(a) * r, m, W - m), y = Phaser.Math.Clamp(j.y + Math.sin(a) * r, m + 16, H - m);
        const clase = clases[i % clases.length], E = ENEMIGOS[clase];
        if (!E.flota && this.enAgua(x, y)) continue;
        this.time.delayedCall(i * 220, () => this.crearBichoDesafio(clase, x, y, { horda: true, vida: Math.max(2, E.vida - 2) }));
      }
    }
    soltarDorada() {
      const p = this.puntoLibre(230, 330);
      const e = this.crearBichoDesafio('dorado', p.x, p.y, { huye: true, dorada: true, botin: paquete(5, 3, true) });
      e.s.setTint(0xffd54a);
      e.extra = this.add.particles(0, 0, 'p_brillo', { x: { min: -16, max: 16 }, y: { min: -40, max: -6 }, lifespan: 600, frequency: 70, speedY: { min: -30, max: -10 }, scale: { start: 1.2, end: 0 } }).setDepth(9001).startFollow(e.s);
      this.flotante(p.x, p.y - 60, '¡Criatura dorada!', '#ffd27a');
    }
    // La criatura dorada escapa del jugador; si la alcanzas, empieza el combate
    huir(e, obj, d, seg) {
      const E = ENEMIGOS[e.clase], W = this.ancho * TILE, H = this.alto * TILE, m = TILE * 2.4;
      let dx = 0, dy = 0;
      if (!e.ocupado && obj && d < 300) {
        dx = e.s.x - obj.x; dy = e.s.y - obj.y;
        const l = Math.hypot(dx, dy) || 1;
        dx = (dx / l) * E.vel * seg; dy = (dy / l) * E.vel * seg;
        e.zig = (e.zig || 0) + seg;
        dx += Math.cos(e.zig * 3) * 30 * seg; dy += Math.sin(e.zig * 3) * 30 * seg;
        const nx = Phaser.Math.Clamp(e.s.x + dx, m, W - m), ny = Phaser.Math.Clamp(e.s.y + dy, m + 16, H - m);
        const x0 = e.s.x, y0 = e.s.y;
        this.pasoEnemigo(e, nx - x0, ny - y0, false);
        dx = e.s.x - x0; dy = e.s.y - y0;
      }
      const mueve = Math.hypot(dx, dy) > 0.2;
      if (mueve) e.s.anims.play(`${E.anim}_${Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down')}`, true);
      else { e.s.anims.stop(); e.s.setFrame(DIRS.down * 9); }
      e.s.setDepth(e.s.y);
      if (obj && obj.yo && !e.ocupado && d < 30) this.empezarCombate(e);
    }
    lanzarMeteorito() {
      const j = this.jugador, W = this.ancho * TILE, H = this.alto * TILE, m = TILE * 2.4;
      let p = Math.random() < 0.4 ? { x: j.x + j.body.velocity.x * 0.6, y: j.y + j.body.velocity.y * 0.6 } : this.puntoLibre(20, 240);
      p = { x: Phaser.Math.Clamp(p.x, m, W - m), y: Phaser.Math.Clamp(p.y, m + 16, H - m) };
      const sombra = this.add.ellipse(p.x, p.y, 22, 11, 0xa01010, 0.3).setDepth(-4);
      this.tweens.add({ targets: sombra, scaleX: 3, scaleY: 3, fillAlpha: 0.55, duration: 1100 });
      const met = this.add.image(p.x + 170, p.y - 430, 'roca3').setScale(2.2).setTint(0xff8a3a).setDepth(99990);
      const cola = this.add.particles(0, 0, 'p_rojo', { lifespan: 380, frequency: 22, speed: 24, scale: { start: 1.8, end: 0 }, alpha: { start: 1, end: 0 } }).setDepth(99989).startFollow(met);
      this.des.objs.push(sombra, met, cola);
      this.tweens.add({ targets: met, x: p.x, y: p.y, angle: 240, duration: 1100, ease: 'Quad.in', onComplete: () => {
        cola.destroy(); met.destroy(); sombra.destroy();
        if (vivo.fase !== 'activo' || !this.jugador) return;
        this.add.particles(p.x, p.y - 6, 'p_rojo', { speed: { min: 60, max: 200 }, angle: { min: 190, max: 350 }, gravityY: 300, lifespan: 600, scale: { start: 1.8, end: 0 }, emitting: false }).setDepth(99990).explode(26);
        const dj = Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y, p.x, p.y);
        if (dj < 500) sfx('boom');
        if (dj < 240) this.cameras.main.shake(140, dj < 70 ? 0.008 : 0.003);
        if (dj < 34) {
          vivo.st.golpes += 1; this.aturdidoHasta = this.time.now + 1100; this.dolor();
          this.flotante(this.jugador.x, this.jugador.y - 70, '¡Auch! Aturdido', '#ff9a8a');
        }
        const f = this.add.image(p.x, p.y, 'roca1').setScale(1.8).setTint(0xffb04a).setDepth(p.y);
        this.tweens.add({ targets: f, scale: 2.2, duration: 450, yoyo: true, repeat: -1 });
        const brillo = this.add.particles(p.x, p.y - 10, 'p_brillo', { lifespan: 500, frequency: 160, speedY: { min: -30, max: -10 }, speedX: { min: -10, max: 10 }, scale: { start: 1, end: 0 } }).setDepth(p.y + 1);
        const it = { tipo: 'frag', s: f, extra: brillo, x: p.x, y: p.y };
        this.des.items.push(it); this.des.objs.push(f, brillo);
        this.time.delayedCall(9000, () => this.quitarItem(it));
      } });
    }
    caerCofre() {
      if (vivo.fase !== 'activo' || !this.jugador) return;
      const p = this.puntoLibre(110, 360);
      const sombra = this.add.ellipse(p.x, p.y, 30, 12, 0x000000, 0.25).setDepth(-4);
      const c = this.add.image(p.x, p.y - 340, 'cofre').setOrigin(0.5, 1).setScale(2).setDepth(99990);
      this.des.objs.push(sombra, c);
      this.tweens.add({ targets: c, y: p.y, duration: 750, ease: 'Bounce.out', onComplete: () => {
        c.setDepth(p.y);
        const brillo = this.add.particles(p.x, p.y - 24, 'p_brillo', { x: { min: -14, max: 14 }, lifespan: 700, frequency: 120, speedY: { min: -40, max: -15 }, scale: { start: 1.1, end: 0 } }).setDepth(p.y + 1);
        const it = { tipo: 'cofre', s: c, extra: brillo, sombra, x: p.x, y: p.y };
        this.des.items.push(it); this.des.objs.push(brillo);
      } });
    }
    crearEclipse() {
      if (!this.textures.exists('eclipse')) {
        const t = this.textures.createCanvas('eclipse', 512, 512), c = t.context;
        c.fillStyle = 'rgba(6, 8, 20, 0.93)'; c.fillRect(0, 0, 512, 512);
        c.globalCompositeOperation = 'destination-out';
        const g = c.createRadialGradient(256, 256, 6, 256, 256, 19);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g; c.beginPath(); c.arc(256, 256, 19, 0, Math.PI * 2); c.fill();
        t.refresh(); t.setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
      this.des.oscuro = this.add.image(this.jugador.x, this.jugador.y - 16, 'eclipse').setScale(6.5).setDepth(9600).setAlpha(0);
      this.tweens.add({ targets: this.des.oscuro, alpha: 1, duration: 1200 });
      this.des.objs.push(this.des.oscuro);
    }
    soltarLuciernaga() {
      const p = this.puntoLibre(150, 520);
      const halo = this.add.image(p.x, p.y, 'luz').setScale(0.32).setTint(0xfff27a).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.85).setDepth(9700);
      const punto = this.add.image(p.x, p.y, 'p_brillo').setScale(2.2).setDepth(9701);
      this.tweens.add({ targets: halo, alpha: 0.45, duration: 500 + Math.random() * 400, yoyo: true, repeat: -1 });
      const it = { tipo: 'luz', s: punto, extra: halo, x: p.x, y: p.y };
      const vagar = () => {
        if (!punto.active) return;
        const q = { x: it.x + (Math.random() - 0.5) * 120, y: it.y + (Math.random() - 0.5) * 90 };
        this.tweens.add({ targets: [punto, halo], x: q.x, y: q.y, duration: 1800 + Math.random() * 1200, ease: 'Sine.inOut', onUpdate: () => { it.x = punto.x; it.y = punto.y; }, onComplete: vagar });
      };
      vagar();
      this.des.items.push(it); this.des.objs.push(halo, punto);
    }
    // El prisma aparece en el mismo lugar para todo el grupo (depende del desafío y del grupo)
    soltarPrisma() {
      if (this.des.prisma) return;
      const d = vivo.d, rnd = azar(d.n * 7919 + (S.grupo || 0) * 131 + (S.grupo ? 0 : Math.floor(Math.random() * 1e6)));
      let p = null;
      for (let i = 0; i < 600 && !p; i++) {
        const x = 3 + Math.floor(rnd() * (this.ancho - 6)), y = 4 + Math.floor(rnd() * (this.alto - 7));
        if (Math.abs(x - 6) < 14 && Math.abs(y - PORTAL_Y - (this.yUtil || 0)) < 10) continue;
        if (!this.alcanzable(x * TILE + 16, y * TILE + 24)) continue;
        if (this.libre(x, y) && this.libre(x, y - 1)) p = { x: x * TILE + 16, y: y * TILE + 24 };
      }
      if (!p) p = { x: CENTRO_X * TILE + 200, y: ((this.yUtil || 0) + 10) * TILE };
      const top = cueva(this.zona) ? 9503 : p.y + 2;
      const halo = this.add.image(p.x, p.y - 14, 'luz').setScale(0.9).setTint(0xd7a8ff).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.7).setDepth(cueva(this.zona) ? 9502 : p.y + 1);
      const gema = this.add.image(p.x, p.y - 16, 'item_prisma').setScale(0.75).setDepth(top);
      this.tweens.add({ targets: gema, y: p.y - 26, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.tweens.add({ targets: halo, alpha: 0.35, scale: 1.1, duration: 700, yoyo: true, repeat: -1 });
      const chispas = ['p_brillo', 'p_morado', 'p_agua'].map((k, i) => this.add.particles(p.x, p.y - 18, k, { x: { min: -22, max: 22 }, speedY: { min: -70, max: -25 }, lifespan: 1100, frequency: 140 + i * 40, scale: { start: 1.3, end: 0 }, alpha: { start: 0.9, end: 0 } }).setDepth(top + 1));
      const o = { tipo: 'prisma', x: p.x, y: p.y - 4, activo: true };
      this.objetos.push(o);
      this.des.prisma = { x: p.x, y: p.y, o };
      this.des.objs.push(halo, gema, ...chispas);
      this.add.particles(p.x, p.y - 20, 'p_brillo', { speed: { min: 60, max: 200 }, lifespan: 900, scale: { start: 2, end: 0 }, emitting: false }).setDepth(99999).explode(40);
    }
    recoger(tipo, fn) {
      const j = this.jugador;
      for (const it of [...this.des.items]) {
        if (it.tipo !== tipo) continue;
        if (Phaser.Math.Distance.Between(j.x, j.y - 10, it.x, it.y - 10) < 34) { this.quitarItem(it); sfx(tipo === 'cofre' ? 'cofre' : 'brillo'); fn(it); }
      }
    }
    quitarItem(it) {
      const i = this.des.items.indexOf(it);
      if (i < 0) return;
      this.des.items.splice(i, 1);
      for (const o of [it.s, it.extra, it.sombra]) if (o && o.active) o.destroy();
    }
    limpiarDesafio() {
      if (!this.des) return;
      for (const e of this.enemigos.filter((x) => x.desafio && x.activo)) {
        if (this.enCombate && combateActual === e) continue;
        e.activo = false;
        this.add.particles(e.s.x, e.s.y - 10, 'p_morado', { speed: { min: 40, max: 120 }, lifespan: 500, scale: { start: 1.3, end: 0 }, emitting: false }).setDepth(99999).explode(14);
        this.tweens.add({ targets: e.s, alpha: 0, duration: 400, onComplete: () => { e.s.destroy(); if (e.extra) e.extra.destroy(); } });
      }
      this.enemigos = this.enemigos.filter((x) => !x.desafio || x.activo || (this.enCombate && combateActual === x));
      const oscuro = this.des.oscuro;
      this.des.oscuro = null; this.des.burbuja = null; this.des.polvo = null;
      for (const o of this.des.objs) if (o && o.active && o !== oscuro) o.destroy();
      this.des.objs = []; this.des.items = [];
      this.des.flecha = null;
      if (this.des.prisma) { this.objetos = this.objetos.filter((o) => o !== this.des.prisma.o); this.des.prisma = null; }
      if (oscuro && oscuro.active) this.tweens.add({ targets: oscuro, alpha: 0, duration: 1000, onComplete: () => oscuro.destroy() });
    }
    flotante(x, y, txt, color = '#ffffff') {
      const t = this.add.text(x, y, txt, { fontFamily: 'Fredoka, Nunito, sans-serif', fontSize: '15px', fontStyle: 'bold', color, stroke: '#12201a', strokeThickness: 4 }).setOrigin(0.5).setResolution(3).setDepth(100000);
      this.tweens.add({ targets: t, y: y - 34, alpha: 0, duration: 1400, ease: 'Cubic.out', onComplete: () => t.destroy() });
    }
    celebrar(x, y) {
      const j = this.jugador;
      this.add.particles(x ?? j.x, y ?? j.y - 40, 'p_brillo', { speed: { min: 80, max: 180 }, lifespan: 900, gravityY: 150, scale: { start: 1.6, end: 0 }, emitting: false }).setDepth(100000).explode(30);
    }
  }

  function iniciarPhaser(zona) {
    const juego = new Phaser.Game({
      type: Phaser.AUTO, parent: 'juego', backgroundColor: '#2f6b47', pixelArt: true,
      scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
      physics: { default: 'arcade', arcade: { debug: false } },
    });
    juego.scene.add('juego', Juego, true, { zona });
  }

  // Acceso para pruebas y depuración desde la consola del navegador.
  window.MathWorld = { escena: () => escena, estado: () => S, sesion: () => sesion, vivo: () => vivo, consultarDesafio, eventoDesafio, mision: (ev, tema) => avanzarMision(ev, tema), xp: (n) => ganarXP(n) };

  prepararIngreso();
})();
