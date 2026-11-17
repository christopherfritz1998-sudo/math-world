// Math World · catálogos del juego (datos puros: personajes, recursos, mundos, enemigos, dioses…).
// Separados de juego.js para que el código sea más fácil de mantener; juego.js los toma de window.MWDatos.
window.MWDatos = (function () {
  'use strict';
  // ===================================================================
  // Datos del juego
  // ===================================================================
  const PERSONAJES = [
    { id: 'zorro', nombre: 'Zorro' }, { id: 'luna', nombre: 'Luna' },
    { id: 'puma', nombre: 'Puma' }, { id: 'copihue', nombre: 'Copihue' },
    { id: 'condor', nombre: 'Cóndor' }, { id: 'huemul', nombre: 'Huemul' },
    { id: 'pudu', nombre: 'Pudú' }, { id: 'lobo', nombre: 'Lobo' },
    // Personajes especiales: se desbloquean por nivel y tienen una habilidad que quita una cantidad fija de vida
    { id: 'fenix', nombre: 'Fénix Llameante', nivel: 30, hab: { nombre: 'Llamarada del Fénix', icono: '🔥', clase: 'fuego', color: [255, 120, 40], dano: 10 } },
    { id: 'trueno', nombre: 'Centinela del Trueno', nivel: 40, hab: { nombre: 'Rayo Celestial', icono: '⚡', clase: 'rayo', color: [255, 230, 90], dano: 20 } },
    { id: 'sombra', nombre: 'Caballero de las Sombras', nivel: 50, hab: { nombre: 'Golpe Sombrío', icono: '🌑', clase: 'sombra', color: [150, 80, 220], dano: 30 } },
    { id: 'bosque', nombre: 'Guardiana del Bosque', nivel: 60, hab: { nombre: 'Furia de la Naturaleza', icono: '🌿', clase: 'bosque', color: [90, 200, 110], dano: 35 } },
    { id: 'cazadora', armaPropia: true, nombre: 'Cazadora Élfica', nivel: 70, hab: { nombre: 'Lluvia de Flechas', icono: '🏹', clase: 'flechas', color: [140, 210, 90], dano: 40 } },
    { id: 'ninja', armaPropia: true, nombre: 'Ninja Carmesí', nivel: 80, hab: { nombre: 'Danza de Katanas', icono: '🗡️', clase: 'katana', color: [230, 40, 60], dano: 45 } },
    { id: 'archimago', armaPropia: true, nombre: 'Archimago Celestial', nivel: 90, hab: { nombre: 'Tormenta Arcana', icono: '🔮', clase: 'arcano', color: [150, 90, 255], dano: 50 } },
    // Leyendas: los 3 personajes más fuertes del juego (nivel 100)
    { id: 'emperador', armaPropia: true, nombre: 'Emperador Dorado', nivel: 100, leyenda: true, hab: { nombre: 'Juicio del Emperador', icono: '👑', clase: 'dorado', color: [255, 200, 60], dano: 60, leyenda: true } },
    { id: 'esqueleto', armaPropia: true, nombre: 'Rey Esqueleto', nivel: 100, leyenda: true, hab: { nombre: 'Ejército de Huesos', icono: '💀', clase: 'huesos', color: [190, 80, 255], dano: 60, leyenda: true } },
    { id: 'minotauro', armaPropia: true, nombre: 'Minotauro Titán', nivel: 100, leyenda: true, hab: { nombre: 'Embestida del Titán', icono: '🐂', clase: 'titan', color: [235, 120, 40], dano: 60, leyenda: true } },
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
    // Cima del Glaciar (tras escalar la pared de hielo)
    { id: 'hielo_eterno', nombre: 'Hielo eterno', corto: 'H. eterno', grupo: 'u4c' }, { id: 'aurora', nombre: 'Polvo de aurora', corto: 'Aurora', grupo: 'u4c' },
    // Recurso exclusivo: solo se consigue en el desafío "Prisma estelar"
    { id: 'prisma', nombre: 'Prisma estelar', corto: 'Prisma', grupo: 'especial' },
    // Se atrapan en el desafío "Eclipse de luciérnagas"
    { id: 'luciernaga', nombre: 'Luciérnagas', grupo: 'especial' },
  ];
  // Guía «¿Dónde se consigue?» (D1): mundo, objeto y herramienta de cada recurso. {id} se reemplaza por el nombre de esa herramienta.
  // El juego agrega además los enemigos que lo sueltan y los minijuegos de ese mundo.
  const DONDE = {
    madera: { mundo: 'u1', txt: 'Tala árboles con el hacha (tecla 1 y E). Hay árboles en todos los mundos; en el Bosque hay más. Con el {hacha2} sacas más.' },
    piedra: { mundo: 'u1', txt: 'Pica rocas con el {pico} (tecla 2 y E) en cualquier mundo.' },
    agua: { mundo: 'u1', txt: 'Saca agua de los lagos y charcos con el {balde}.' },
    cristal: { mundo: 'u1', txt: 'A veces sale al picar rocas; con el {pico2} salen más.' },
    resina: { mundo: 'u1', lugar: 'Bosque profundo (cruza el puente)', txt: 'Tala los árboles gigantes con el {hacha2}.' },
    miel: { mundo: 'u1', lugar: 'Bosque profundo (cruza el puente)', txt: 'Recolecta las colmenas con el {ahumador} para calmar a las abejas.' },
    fibra: { mundo: 'u2', txt: 'Corta los cactus del desierto.' },
    arenisca: { mundo: 'u2', txt: 'Pica las rocas de arenisca del desierto.' },
    cobre: { mundo: 'u2', txt: 'Sale de las vetas de las rocas del desierto y en las excavaciones con la {pala}.' },
    oro: { mundo: 'u2', txt: 'Vetas doradas del desierto con el {pico3}; también en las excavaciones con la {pala}.' },
    obsidiana: { mundo: 'u2', lugar: 'Valle de la Esfinge (sube el acantilado del desierto)', txt: 'Pica las vetas de obsidiana con el {pico3}; también en las excavaciones.' },
    fosil: { mundo: 'u2', lugar: 'Valle de la Esfinge', txt: 'Excava los sitios arqueológicos con la {pala}.' },
    carbon: { mundo: 'u3', txt: 'Pica las rocas de carbón de la mina.' },
    plata: { mundo: 'u3', txt: 'Vetas de plata de la mina; con el {pico4} sacas más.' },
    amatista: { mundo: 'u3', txt: 'Vetas de amatista de la mina con el {pico4}.' },
    hongo: { mundo: 'u3', txt: 'Recolecta los hongos luminosos de la mina.' },
    magma: { mundo: 'u3', lugar: 'Profundidades (baja por la fosa de la mina)', txt: 'Extrae las vetas de magma con los {guantes}.' },
    cristal_eco: { mundo: 'u3', lugar: 'Profundidades', txt: 'Desprende los cristales resonantes con el {cincel}; también en el altar de cristal.' },
    baya: { mundo: 'u4', txt: 'Recolecta los arbustos de bayas del glaciar.' },
    hielo: { mundo: 'u4', txt: 'Pica los bloques de hielo del glaciar.' },
    escarcha: { mundo: 'u4', txt: 'Vetas de escarcha del glaciar.' },
    zafiro: { mundo: 'u4', txt: 'Vetas de zafiro del glaciar con el {pico5}.' },
    hielo_eterno: { mundo: 'u4', lugar: 'Cima del Glaciar (escala la pared de hielo)', txt: 'Pica los pilares de hielo eterno con el {pico5}.' },
    aurora: { mundo: 'u4', lugar: 'Cima del Glaciar', txt: 'Guarda el polvo de las flores de aurora con el {frasco_aurora}.' },
    prisma: { txt: 'Solo en el desafío en vivo «Prisma estelar» que lanza tu profesor.' },
    luciernaga: { txt: 'Se atrapan en el desafío «Eclipse de luciérnagas».' },
  };
  // Herramientas y equipo (se fabrican una vez)
  const MEJORAS = [
    { id: 'pico', nombre: 'Pico de piedra', desc: 'Permite picar rocas para sacar piedra.', icono: 'pickaxe', costo: { madera: 12 } },
    { id: 'balde', nombre: 'Balde', desc: 'Permite sacar agua de los lagos.', icono: 'agua', costo: { madera: 10, piedra: 4 }, requiere: 'pico' },
    { id: 'botas', nombre: 'Botas de viento', desc: 'Siempre activas: caminas un 30 % más rápido en todos los mundos.', icono: 'crampones', costo: { madera: 25, piedra: 15, cristal: 3 }, requiere: 'pico' },
    // Montura (D4): se fabrica al final del juego con recursos de las cuatro zonas difíciles; solo acelera en mundos que ya visitaste
    { id: 'montura', nombre: 'Montura de viaje', desc: 'Siempre activa: en los mundos que ya visitaste caminas el doble de rápido que sin botas (en un mundo nuevo, la primera vez, se explora a pie).', icono: 'crampones', costo: { obsidiana: 8, magma: 8, hielo_eterno: 8, aurora: 6, oro: 10 }, requiere: 'botas' },
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
    { id: 'ankh', nombre: 'Ankh de obsidiana', desc: 'Abre la tumba del Faraón de las Arenas Eternas, en el Valle de la Esfinge.', icono: 'ankh', costo: { obsidiana: 12, fosil: 8, oro: 6 } },
    { id: 'pico3', nombre: 'Pico de cobre', desc: 'Permite extraer oro de las vetas doradas y saca más arenisca y cobre.', icono: 'pickaxe', costo: { cobre: 10, arenisca: 15, fibra: 6 }, requiere: 'pico2' },
    { id: 'espada3', nombre: 'Espada de oro', desc: 'Equipada, cada acierto en combate quita 4 de vida. Requiere dominar 3 temas (🥉 bronce).', icono: 'espada', costo: { oro: 8, cobre: 10 }, requiere: 'espada2', dominio: 3 },
    { id: 'armadura3', nombre: 'Armadura de oro', desc: 'Equipada, tu vida máxima sube a 11 corazones. Requiere dominar 3 temas (🥉 bronce).', icono: 'armadura', costo: { oro: 12, arenisca: 20, fibra: 10 }, requiere: 'armadura2', dominio: 3 },
    // Equipo de la mina (Unidad 3)
    { id: 'casco', nombre: 'Casco de minero', desc: 'Siempre activo: +1 corazón de vida máxima y los gólems ya no te sorprenden.', icono: 'casco', costo: { carbon: 10, plata: 4, hongo: 4 }, requiere: 'pico' },
    // Herramientas de las Profundidades
    { id: 'guantes', nombre: 'Guantes térmicos', desc: 'Herramienta: protegen tus manos del calor para extraer roca de magma en las Profundidades de la mina.', icono: 'guantes', costo: { plata: 6, hongo: 8, carbon: 10 }, requiere: 'pico' },
    { id: 'cincel', nombre: 'Cincel de cristal', desc: 'Herramienta: permite desprender cristales resonantes de las Profundidades sin romperlos.', icono: 'cincel', costo: { plata: 8, carbon: 10, amatista: 2 }, requiere: 'pico' },
    { id: 'pico_magma', nombre: 'Pico de magma', desc: 'Saca más roca de magma y más carbón de las vetas de las Profundidades.', icono: 'pico_magma', costo: { magma: 12, plata: 10, cristal_eco: 4 }, requiere: 'pico4' },
    { id: 'corazon_cristal', nombre: 'Corazón de cristal', desc: 'Rompe el sello del Coloso de Magma, en la cámara de las Profundidades.', icono: 'corazon_cristal', costo: { cristal_eco: 12, magma: 10, amatista: 6 } },
    { id: 'pico4', nombre: 'Pico de plata', desc: 'Permite extraer amatista y saca más carbón y plata.', icono: 'pickaxe', costo: { plata: 10, carbon: 15, hongo: 6 }, requiere: 'pico2' },
    { id: 'espada4', nombre: 'Espada de amatista', desc: 'Equipada, cada acierto en combate quita 5 de vida. Requiere dominar 5 temas (🥉 bronce).', icono: 'espada', costo: { amatista: 8, plata: 10 }, requiere: 'espada2', dominio: 5 },
    { id: 'armadura4', nombre: 'Armadura de plata', desc: 'Equipada, tu vida máxima sube a 13 corazones. Requiere dominar 5 temas (🥉 bronce).', icono: 'armadura', costo: { plata: 14, carbon: 20, amatista: 4 }, requiere: 'armadura2', dominio: 5 },
    // Equipo del mundo helado (Unidad 4)
    // Escalada del glaciar y Cima
    { id: 'piolet', nombre: 'Piolet de escarcha', desc: 'Herramienta de escalada: con el piolet y los crampones puedes subir la pared del glaciar. Si resbalas, te sujetas respondiendo bien.', icono: 'piolet', costo: { hielo: 60, escarcha: 30, zafiro: 8, madera: 20 }, requiere: 'pico' },
    { id: 'crampones', nombre: 'Crampones de hielo', desc: 'Herramienta de escalada: puntas de metal para las botas. Se necesitan junto con el piolet para subir al glaciar.', icono: 'crampones', costo: { hielo: 50, escarcha: 25, baya: 20, piedra: 30 }, requiere: 'pico' },
    { id: 'frasco_aurora', nombre: 'Frasco de aurora', desc: 'Herramienta: guarda el polvo de aurora de las flores que brillan en la Cima del Glaciar.', icono: 'frasco_aurora', costo: { hielo: 12, escarcha: 8, cristal: 2 } },
    { id: 'pico_eterno', nombre: 'Pico de hielo eterno', desc: 'Saca más hielo eterno de los pilares de la Cima y más zafiros.', icono: 'pickaxe', costo: { hielo_eterno: 12, zafiro: 8, escarcha: 10 }, requiere: 'pico5' },
    { id: 'cetro_aurora', nombre: 'Cetro de la aurora', desc: 'Despierta al Dragón de la Aurora en su trono, en lo más alto de la Cima del Glaciar.', icono: 'cetro_aurora', costo: { aurora: 14, hielo_eterno: 12, zafiro: 8 } },
    { id: 'abrigo', nombre: 'Abrigo de piel', desc: 'Siempre activo: +1 corazón de vida máxima y la ventisca ya no te hace caminar lento.', icono: 'abrigo', costo: { baya: 8, hielo: 10, escarcha: 4 }, requiere: 'pico' },
    { id: 'pico5', nombre: 'Pico de escarcha', desc: 'Permite extraer zafiros y saca más hielo y escarcha.', icono: 'pickaxe', costo: { escarcha: 10, hielo: 15, baya: 6 }, requiere: 'pico2' },
    { id: 'espada5', nombre: 'Espada de hielo', desc: 'Equipada, cada acierto en combate quita 6 de vida.', icono: 'espada', costo: { zafiro: 8, escarcha: 10 }, requiere: 'espada2' },
    // Equipo exclusivo (Prisma estelar)
    { id: 'espada6', nombre: 'Espada prismática', desc: 'Exclusiva. Equipada, cada acierto en combate quita 10 de vida.', icono: 'espada_prisma', costo: { prisma: 10, cristal: 8, piedra: 20 }, requiere: 'espada2' },
    { id: 'armadura6', nombre: 'Armadura prismática', desc: 'Exclusiva. Equipada, tu vida máxima sube a 17 corazones.', icono: 'armadura_prisma', costo: { prisma: 10, cristal: 10, agua: 15 }, requiere: 'armadura2' },
    { id: 'armadura5', nombre: 'Armadura de escarcha', desc: 'Equipada, tu vida máxima sube a 15 corazones.', icono: 'armadura', costo: { escarcha: 14, hielo: 20, zafiro: 4 }, requiere: 'armadura2' },
  ];
  // Mundos: uno por unidad
  const MUNDOS = {
    u1: { nombre: { '7basico': 'Bosque de los Enteros', '8basico': 'Bosque de las Potencias' }, semilla: 11, fondo: '#2f6b47',
      suelo: [[5, 0, 1], [5, 1, 0.15]], arboles: ['arbol_manzano', 'arbol_redondo', 'arbol_pino', 'arbol_otono'], nArboles: 175,
      rocas: ['roca3'], nRocas: 48, lagos: 3, granLago: true, profundo: true, cofres: 9, arbustos: 9, nieblas: 4, bichos: 0.08 },
    // Unidad 2: desierto con recursos propios (fibra de cactus, arenisca, cobre y oro)
    u2: { nombre: { '7basico': 'Desierto Algebraico', '8basico': 'Dunas de las Funciones' }, tipo: 'desierto', recursos: 'u2', semilla: 22, fondo: '#d8c08a',
      suelo: [[8, 22, 1], [3, 19, 0.07]], valle: true, nCactus: 120, nRocas: 66, vetasCobre: 19, vetasOro: 9, oasis: 5, cofres: 11,
      escorpiones: 10, remolinos: 6, esqueletos: 8, cofre: { oro: 2, cobre: 3 }, tinte: [0xffb347, 0.08] },
    // Unidad 3: mina subterránea con recursos propios (carbón, plata, amatista y hongos luminosos)
    u3: { nombre: { '7basico': 'Mina de las Formas', '8basico': 'Mina de los Volúmenes' }, tipo: 'cueva', recursos: 'u3', semilla: 33, fondo: '#1a1a24',
      suelo: [[9, 2, 1], [9, 7, 0.08], [9, 3, 0.015]], nHongos: 112, nRocas: 72, vetasPlata: 19, vetasAmatista: 9, pozas: 5, cofres: 11,
      murcielagos: 8, golems: 7, mineros: 8, cofre: { plata: 2, amatista: 1 }, oscuridad: 0.5, abismo: true },
    // Unidad 4: mundo helado con ventiscas y recursos propios (bayas de invierno, hielo, escarcha y zafiros)
    u4: { nombre: { '7basico': 'Glaciar de los Datos', '8basico': 'Glaciar del Azar' }, tipo: 'hielo', recursos: 'u4', semilla: 44, fondo: '#e4eef7',
      suelo: [[0, 0, 1], [1, 0, 0.12], [2, 0, 0.06]], nPinos: 112, nArbustos: 88, nRocas: 66, vetasEscarcha: 19, vetasZafiro: 9, cofres: 11,
      lobos: 8, espiritus: 6, munecos: 8, cofre: { escarcha: 2, zafiro: 1 }, cima: true },
  };
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
    // Cima del Glaciar
    halcon: { nombre: 'Halcón de escarcha', vida: 6, dif: 3, botin: { aurora: 1, baya: 2 }, xp: 36, vel: 110, flota: true, retrato: 'g_halcon', texVivo: 'g_halcon', radio: 230 },
    golem_hielo: { nombre: 'Gólem de hielo eterno', vida: 10, dif: 3, botin: { hielo_eterno: 1, hielo: 3 }, xp: 46, vel: 48, oculto: true, tex: 'g_bloque_eterno', texVivo: 'g_golem_hielo', retrato: 'g_golem_hielo', radio: 190 },
    golem_cristal: { nombre: 'Gólem de cristal', vida: 9, dif: 3, botin: { cristal_eco: 1, amatista: 1 }, xp: 42, vel: 50, oculto: true, tex: 'a_cristal_n', texVivo: 'a_golem_cristal', retrato: 'a_golem_cristal', radio: 190 },
    // Desafío en vivo "Criatura dorada": huye del jugador
    dorado: { nombre: 'Criatura dorada', vida: 3, dif: 2, botin: {}, xp: 45, vel: 112, anim: 'jabali', retrato: 'jabali_retrato', radio: 3000 },
    // Valle de la Esfinge
    escarabajo: { nombre: 'Escarabajo del valle', vida: 5, dif: 2, botin: { obsidiana: 1, cobre: 1 }, xp: 26, vel: 100, retrato: 'v_escarabajo', texVivo: 'v_escarabajo', radio: 230 },
    momia: { nombre: 'Momia del valle', vida: 7, dif: 3, botin: { fosil: 1, fibra: 2 }, xp: 34, vel: 54, oculto: true, tex: 'v_sarcofago', anim: 'momia', retrato: 'momia_retrato', radio: 190 },
    esqueleto: { nombre: 'Esqueleto del desierto', vida: 6, dif: 3, botin: { cobre: 2, oro: 1 }, xp: 32, vel: 62, anim: 'esqueleto', retrato: 'esqueleto_retrato', radio: 210 },
  };
  const JEFES = {
    u1: { nombre: 'Troll Guardián del Bosque', color: '#7d8a7a', lpc: true, retrato: 'jefe_u1_retrato' },
    u2: { nombre: 'Rey Lagarto de las Dunas', color: '#c9a46b', lpc: true, retrato: 'jefe_u2_retrato', vida: 14, fases: true, premio: { oro: 6, cobre: 8, arenisca: 10 },
      furia: { titulo: '¡Tormenta de arena!', toast: 'desató una tormenta de arena', particula: 'p_arena', tinte: 0xffc07a, flash: [230, 170, 60] } },
    u3: { nombre: 'Minotauro de las Profundidades', color: '#8a7aa6', lpc: true, retrato: 'jefe_u3_retrato', vida: 15, fases: true, premio: { amatista: 5, plata: 8, carbon: 10 },
      furia: { titulo: '¡Derrumbe en la mina!', toast: 'provocó un derrumbe', particula: 'p_piedra', tinte: 0xc9b6ff, flash: [150, 130, 200] } },
    u4: { nombre: 'Yeti, Rey de la Escarcha', color: '#9fc6e6', lpc: true, retrato: 'jefe_u4_retrato', vida: 17, fases: true, premio: { zafiro: 5, escarcha: 8, hielo: 10 },
      furia: { titulo: '¡Ventisca helada!', toast: 'desató una ventisca helada', particula: 'p_nieve', tinte: 0xbfe8ff, flash: [210, 235, 255] } },
  };
  // ---------- Obras cooperativas: el puente al Bosque profundo y el montacargas al Valle de la Esfinge ----------
  // Todo el nivel (7° u 8° básico) aporta recursos a la misma obra; el avance queda guardado en el sistema
  // y, cuando se completa, queda construida para siempre.
  const OBRAS = {
    puente: { id: 'puente_bosque', meta: { madera: 540, piedra: 315, agua: 135, cristal: 36 }, icono: '🌉', nombre: 'Puente al Bosque profundo', corto: 'el puente', al: 'al puente', local: 'obraLocal',
      intro: 'El río no se puede cruzar. Tu grupo construye su propio puente aportando recursos: el avance se guarda y, cuando se completa, queda construido para siempre para tu grupo.',
      listo: 'El puente está construido para siempre: cruza el río por el camino hacia el Bosque profundo.', fin: '¡Puente terminado!' },
    valle: { id: 'montacargas_valle', meta: { fibra: 1500, arenisca: 1200, cobre: 600, oro: 180 }, icono: '🏗️', nombre: 'Montacargas al Valle de la Esfinge', corto: 'el montacargas', al: 'al montacargas', local: 'obraLocalValle',
      intro: 'El acantilado no se puede escalar. Tu grupo construye su montacargas de poleas: cuerdas de fibra, plataforma de arenisca, poleas de cobre y engranajes de oro. El avance se guarda y, cuando se completa, queda funcionando para siempre.',
      listo: 'El montacargas está terminado para siempre: sube por él hacia el Valle de la Esfinge.', fin: '¡Montacargas terminado!' },
    mina: { id: 'elevador_mina', meta: { carbon: 1500, plata: 975, hongo: 480, amatista: 165 }, icono: '⛓️', nombre: 'Elevador a las Profundidades', corto: 'el elevador', al: 'al elevador', local: 'obraLocalMina',
      intro: 'La fosa no se puede bajar a pie. Tu grupo construye su elevador de la mina: carbón para la máquina, plata para los cables, hongos luminosos para alumbrar y amatista para el mecanismo. El avance se guarda y, cuando se completa, queda funcionando para siempre.',
      listo: 'El elevador está terminado para siempre: baja por él hacia las Profundidades.', fin: '¡Elevador terminado!' },
    cima: { id: 'ruta_glaciar', meta: { hielo: 1500, escarcha: 840, baya: 480, zafiro: 165 }, icono: '🧗', nombre: 'Ruta de escalada del glaciar', corto: 'la ruta de escalada', al: 'a la ruta de escalada', local: 'obraLocalCima',
      intro: 'La pared del glaciar es demasiado alta y lisa. Tu grupo equipa su ruta de escalada: bloques de hielo para los peldaños, escarcha para fijar los anclajes, bayas para los escaladores y zafiros para los ganchos. El avance se guarda y, cuando se completa, la ruta queda lista para siempre. Además, cada escalador necesita su propio piolet y sus crampones.',
      listo: 'La ruta de escalada está lista para siempre: con piolet y crampones puedes subir a la Cima del Glaciar.', fin: '¡Ruta de escalada terminada!' },
  };
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
  // ---------- Copos de nieve (álbum): se ganan en el hielo movedizo ----------
  const COPOS = [
    { id: 'estrella', nombre: 'Copo estrella', rareza: 'Común', peso: 24 }, { id: 'aguja', nombre: 'Copo de agujas', rareza: 'Común', peso: 22 },
    { id: 'helecho', nombre: 'Copo helecho', rareza: 'Común', peso: 18 }, { id: 'diamante', nombre: 'Copo diamante', rareza: 'Poco común', peso: 12 },
    { id: 'flor', nombre: 'Copo flor', rareza: 'Poco común', peso: 10 }, { id: 'escarcha', nombre: 'Copo de escarcha', rareza: 'Rara', peso: 7 },
    { id: 'corona', nombre: 'Copo corona', rareza: 'Rara', peso: 5 }, { id: 'prisma', nombre: 'Copo prisma', rareza: 'Rara', peso: 4 },
    { id: 'aurora', nombre: 'Copo de aurora', rareza: 'Épica', peso: 2 }, { id: 'eterno', nombre: 'Copo eterno', rareza: 'Legendaria', peso: 1 },
  ];
  // ===================================================================
  // Pantalla de bienvenida (carga) al entrar al juego
  // ===================================================================
  const CONSEJOS = [
    'Responde bien las preguntas para recolectar más rápido: ¡cada acierto suma!',
    'Si te equivocas, lee la pista: te explica el paso que falta.',
    'Tu mochila se vacía al volver por el portal, pero todo queda guardado en el cofre comunitario de tu grupo.',
    'El cofre de la base es de todo tu grupo: lo que recolectas ayuda a tus compañeros, y lo que ellos traen te ayuda a ti.',
    'Las obras cooperativas (puente, montacargas, elevador, ruta del glaciar) se construyen entre todo el curso.',
    'Equipa una espada para quitarle más vida a los enemigos en cada acierto.',
    'Las armaduras te dan más corazones: fabrícalas en la fogata de tu base.',
    'Los jefes finales se vencen en grupo: busca compañeros en el mismo grupo del portal.',
    'Abre Logros (tecla L) y equipa un título para que aparezca sobre tu nombre.',
    'Desde el nivel 30 hay premios exclusivos cada 5 niveles.',
    'Las mascotas se ganan venciendo jefes finales y se equipan desde el nivel 30.',
    'Usa el chat 💬 (tecla T) para saludar y coordinarte con tu grupo.',
    '¿Encontraste un error? Avísale a tu profesor con el botón ⚠️.',
    '¿Tienes una idea para el juego? Escríbela en Novedades 💡.',
    'Decora tu base con los muebles que fabriques: tecla G.',
    'Las misiones (tecla N) te dan monedas y experiencia extra.',
    'Las potencias de igual base se multiplican sumando los exponentes.',
    'Para sumar fracciones, primero busca un denominador común.',
    'Un número negativo multiplicado por otro negativo da positivo.',
    'Revisa tu respuesta antes de confirmar: la calma también es una estrategia.',
    'En el glaciar, responder bien en los anclajes evita que te caigas.',
    'Los minijuegos dan coleccionables únicos para tus álbumes.',
    'Si tu profesor activa un desafío en vivo, ¡todo el curso suma para la meta!',
  ];
  // ===================================================================
  // Reportar un problema y Novedades (ideas para el profesor)
  // ===================================================================
  const NOVEDADES = [
    ['🎟️', 'Fichas de minijuego', 'Cada partida de los minijuegos de entretención usa una ficha. Ganas una ficha cada 3 respuestas correctas en cualquier parte del juego.'],
    ['💥', 'Combates con racha', 'Los enemigos aguantan más según tu espada (3 o 4 preguntas), pero 3 aciertos seguidos dan un golpe crítico doble.'],
    ['🔎', '¿Dónde se consigue?', 'Toca cualquier recurso de tu mochila o cofre para ver en qué mundo, objeto o minijuego se obtiene.'],
    ['🎁', 'Regalos al grupo', 'Al visitar la casa de un compañero de tu grupo puedes dejarle un regalo de tu cofre personal.'],
    ['🏰', 'Arena entre clanes', 'En la Arena, «Retar a otro clan» te junta con jugadores de otros grupos de tu curso. Ahí no se pierde la mochila.'],
    ['🐎', 'Montura de viaje', 'Al final del juego puedes fabricar una montura que te hace mucho más rápido en los mundos que ya visitaste.'],
    ['🏁', 'Modo competencia', 'En los minijuegos de entretención, «Competir con compañeros» crea una sala con código: todos juegan la misma partida a la vez y ven los puntos en vivo.'],
    ['🗺️', 'Minijuegos repartidos por el mapa', 'Ya no están juntos junto al portal: cada uno tiene su propio objeto (el muelle de pesca, la vagoneta, la diana…). Búscalos por su ícono en el minimapa.'],
    ['🎪', '16 minijuegos nuevos', 'Luciérnagas, tala, duende, tormenta, jeroglíficos, tesoro en la duna, vagoneta, linterna, derrumbe, trineo, pesca en el hielo, pingüinos, huerto, tiro al blanco, carrera de mascotas y trueno. Se juegan a pantalla completa.'],
    ['📖', '5 álbumes nuevos', 'Luciérnagas, amuletos, fósiles, peces bajo el hielo y cosechas: se llenan jugando. Míralos en Tu avance (tecla M).'],
    ['📦', 'Cofre personal y cofre del grupo', 'Lo que recolectas queda en tu cofre. Desde tu Equipo (Q) puedes compartir recursos con tu grupo: lo compartido lo puede usar cualquiera para fabricar.'],
    ['🤝', 'Reto en pareja', 'En tus Misiones: uno calcula y el otro verifica. Si aciertan 4 de 6, ¡ambos ganan premio!'],
    ['🔍', 'Tu error, explicado', 'Al equivocarte, el paso a paso ahora te dice qué se te pasó: el signo, la coma, la fracción invertida…'],
    ['✏️', 'Practicar un tema', 'En Mi progreso (tecla P), cada tema tiene un botón para practicarlo. Los temas dominados vuelven a repasarse cada cierto tiempo.'],
    ['🌾', 'Evento de la semana', 'Cada lunes cambia: doble cosecha, más experiencia o cofres en un mundo. Míralo en tus Misiones.'],
    ['🐾', 'Mascotas', 'Vence jefes finales para ganar 8 mascotas distintas. Se equipan desde el nivel 30 y te siguen por todo el mapa.'],
    ['💬', 'Chat seguro', 'Saluda y coordínate con tu grupo usando emoticones y frases (tecla T).'],
    ['🏆', 'Logros y títulos', 'Más de 70 logros. Cada uno desbloquea un título para mostrar sobre tu nombre.'],
    ['🎁', 'Premios de nivel', 'Desde el nivel 30, cada 5 niveles recibes un objeto exclusivo.'],
    ['🏔️', 'Cima del Glaciar', 'Escala el glaciar, juega guerra de bolas de nieve y hielo movedizo, y enfrenta al Dragón de la Aurora.'],
    ['⛏️', 'Profundidades de la mina', 'Carrera de carritos, rompecabezas de cristales y el Coloso de Magma.'],
    ['🏜️', 'Valle de la Esfinge', 'Excavaciones, laberintos aleatorios, el álbum de gemas y el Faraón de las Arenas Eternas.'],
    ['⚱️', 'Faraón de las Arenas Eternas', 'Nuevo jefe ancestral en el Valle de la Esfinge. Fabrica el ankh de obsidiana para despertarlo y gana al gato sagrado.'],
    ['👑', 'Gemas de los jefes y el 5to Mundo', 'Cada jefe deja caer una gema única. Reúne las 8 en tu álbum para despertar el misterioso 5to Mundo.'],
    ['🗺️', 'Minimapa', 'Arriba a la derecha ves todo el mundo: compañeros, enemigos, portal, cofres, jefes y desafíos. Haz clic para agrandarlo.'],
    ['🧭', '5 desafíos nuevos', 'Coordenadas perdidas, Burbujas del resultado, Cofres de verdad o mentira, Mascotas fugitivas y Sendero de las cifras.'],
    ['🎯', 'Desafíos en los mundos', 'Los desafíos en vivo se juegan en los mundos; solo el ladrón y la horda llegan a la base. En la horda tienes 20 segundos por pregunta.'],
  ];
  // ---------- Talentos: puntos por dominar temas (1 por plata, 2 por oro) ----------
  const TALENTOS = [
    { id: 'fuerza', ico: '⚔️', nombre: 'Fuerza', desc: '+1 de daño en cada golpe por punto.' },
    { id: 'vitalidad', ico: '❤️', nombre: 'Vitalidad', desc: '+1 corazón máximo por punto.' },
    { id: 'sabio', ico: '📖', nombre: 'Sabiduría', desc: '+10 % de experiencia por punto.' },
    { id: 'suerte', ico: '🍀', nombre: 'Suerte', desc: '6 % de probabilidad por punto de ganar un recurso extra al acertar.' },
  ];
  // ---------- Modo historia: un capítulo por mundo ----------
  const CAPITULOS = [
    { u: 'u1', titulo: 'Capítulo 1 · El bosque que olvidó contar', intro: 'La Sabia Euclidia te recibe en el bosque: «Desde que el Troll Guardián despertó, los árboles olvidaron sus números. Ayúdame a devolverle el orden al bosque».', fin: '«¡El bosque vuelve a contar! Pero escucho rumores extraños desde el desierto…»', obj: [['aciertos', 15, 'Responde bien 15 preguntas de esta unidad'], ['vencer', 5, 'Vence 5 enemigos'], ['recurso', 20, 'Recolecta 20 recursos']] },
    { u: 'u2', titulo: 'Capítulo 2 · Las dunas de las proporciones', intro: 'Euclidia te alcanza en el desierto: «Las caravanas se pierden porque nadie sabe repartir el agua. Demuestra que los números pueden guiarlas».', fin: '«¡Las caravanas encontraron su camino! Bajo la arena, la mina empieza a temblar…»', obj: [['aciertos', 20, 'Responde bien 20 preguntas de esta unidad'], ['vencer', 8, 'Vence 8 enemigos'], ['recurso', 30, 'Recolecta 30 recursos']] },
    { u: 'u3', titulo: 'Capítulo 3 · El eco de la mina', intro: 'En la oscuridad de la mina, Euclidia susurra: «Cada eco aquí es una ecuación sin resolver. Si las resolvemos, la mina dejará de derrumbarse».', fin: '«¡La mina está a salvo! Solo queda la cima helada… y lo que duerme allí».', obj: [['aciertos', 25, 'Responde bien 25 preguntas de esta unidad'], ['vencer', 10, 'Vence 10 enemigos'], ['recurso', 40, 'Recolecta 40 recursos']] },
    { u: 'u4', titulo: 'Capítulo 4 · La cima helada', intro: 'El viento del glaciar apaga casi todo, pero Euclidia sonríe: «Has aprendido mucho. Esta última prueba es para quienes ya no le temen a ningún número».', fin: '«Lo lograste: Math World vuelve a estar en equilibrio. Ahora tú eres quien guía a los demás».', obj: [['aciertos', 30, 'Responde bien 30 preguntas de esta unidad'], ['vencer', 12, 'Vence 12 enemigos'], ['recurso', 50, 'Recolecta 50 recursos']] },
  ];
  // ---------- Eventos del mundo: iguales para todo el curso (dependen de la hora) ----------
  const EVENTOS = [
    { id: 'xp2', ico: '⚡', nombre: 'Tormenta del saber', desc: 'Toda la experiencia vale el doble.' },
    { id: 'cristal', ico: '💎', nombre: 'Lluvia de cristales', desc: 'Cada respuesta correcta te da 1 cristal.' },
    { id: 'racha', ico: '🔥', nombre: 'Racha relámpago', desc: 'Cada 3 respuestas correctas seguidas ganas un cofre.' },
  ];
  // ===================================================================
  // Mundo 5: El Altar de los Dioses — 5 dioses en sus altares y Hades, el jefe final
  // Las preguntas mezclan todas las unidades. Cada dios tiene su propia dinámica.
  // ===================================================================
  const DIOSES = [
    { id: 'cerbero', nombre: 'Cerbero, Guardián de la Puerta', golpes: 14, dano: 2, tiempo: 20, dif: 2, color: 0xff4a3a, mec: 'cabezas', premio: 15, xp: 350,
      desc: 'Tiene <b>tres cabezas</b> con su propia vida. Cada cabeza que cae enfurece a las demás: tendrás menos tiempo para responder.' },
    { id: 'vampira', nombre: 'Lilith, Reina de la Noche', golpes: 16, dano: 2, tiempo: 18, dif: 2, color: 0xff3a8a, mec: 'drenaje', premio: 18, xp: 450,
      desc: 'Cada error o pregunta sin responder <b>la cura</b>. Con <b>3 aciertos seguidos</b> la atraviesas con una estaca de luz (daño triple).' },
    { id: 'ciclope', nombre: 'Polifemo, el Cíclope de Obsidiana', golpes: 18, dano: 3, tiempo: 17, dif: 3, color: 0xff8a1a, mec: 'escudo', premio: 21, xp: 550,
      desc: 'Su <b>piel de obsidiana</b> (4) bloquea tus golpes hasta que la rompas con aciertos, y <b>cada error la vuelve a endurecer</b> (+2). Si fallas, su <b>mirada petrificante</b> te deja solo 7 segundos en la siguiente.' },
    { id: 'segador', nombre: 'Tánatos, el Segador de Almas', golpes: 20, dano: 3, tiempo: 16, dif: 3, color: 0x4ae0d0, mec: 'reloj', premio: 24, xp: 650,
      desc: 'Un <b>reloj de arena</b> de 4 minutos marca todo el combate: cada acierto suma 6 s y cada error resta 12 s. Si la arena se acaba, te cosecha.' },
    { id: 'golem', nombre: 'El Gólem de las Almas Perdidas', golpes: 22, dano: 3, tiempo: 15, dif: 3, color: 0x5aff8a, mec: 'combo', premio: 27, xp: 750,
      desc: 'Cada 2 errores <b>absorbe tus fallos y crece</b> (recupera vida). Encadena aciertos para multiplicar tu daño: ×1 → ×1,5 → ×2 → ×3.' },
  ];
  const OFRENDAS = [
    { id: 'vida', ico: '❤️', nombre: 'Ofrenda de vida', desc: '+3 corazones de escudo solo para este combate.' },
    { id: 'furia', ico: '⚔️', nombre: 'Ofrenda de furia', desc: 'Tus golpes hacen 50 % más de daño.' },
    { id: 'tiempo', ico: '⏳', nombre: 'Ofrenda del tiempo', desc: '+6 segundos para cada pregunta.' },
  ];
  // ===================================================================
  // Ambición: Torre de los Dioses, reliquias divinas, ascensión, invasión semanal, ligas, estilo y duelos de fantasma
  // ===================================================================
  // ---------- Fragmentos y reliquias divinas ----------
  const RELIQUIAS = [
    { id: 'collar', dios: 'cerbero', ico: '🐺', nombre: 'Collar de Cerbero', efecto: '10 % de probabilidad de ganar un recurso extra con cada acierto.', frag: 4 },
    { id: 'capa', dios: 'vampira', ico: '🦇', nombre: 'Capa de Lilith', efecto: 'Bloquea un golpe que te iban a dar; se recarga con 5 aciertos.', frag: 4 },
    { id: 'ojo', dios: 'ciclope', ico: '👁️', nombre: 'Ojo de Polifemo', efecto: '+1 de daño en todos tus golpes.', frag: 4 },
    { id: 'reloj', dios: 'segador', ico: '⏳', nombre: 'Reloj de Tánatos', efecto: '+15 % de experiencia.', frag: 4 },
    { id: 'corazon', dios: 'golem', ico: '🗿', nombre: 'Corazón del Gólem', efecto: '+2 corazones máximos.', frag: 4 },
    { id: 'tridente', dios: 'hades', ico: '🔱', nombre: 'Tridente de Hades', efecto: 'Cada 3 aciertos seguidos recuperas 1 corazón.', frag: 3 },
  ];
  const REGLAS_TORRE = [
    { id: 'veloz', txt: '⚡ Solo 9 segundos por pregunta' },
    { id: 'escrita', txt: '✍️ Todas las respuestas se escriben' },
    { id: 'doble', txt: '💀 Cada error quita 2 corazones más' },
    { id: 'tema', txt: '📘 Todas las preguntas son de un solo tema' },
    { id: 'sinpista', txt: '🙈 Sin paso a paso: solo ves si acertaste' },
  ];
  return { PERSONAJES, RECURSOS, DONDE, MEJORAS, MUNDOS, ENEMIGOS, JEFES, OBRAS, PECES, GEMAS, PIEZAS_EXC, COPOS, CONSEJOS, NOVEDADES, TALENTOS, CAPITULOS, EVENTOS, DIOSES, OFRENDAS, RELIQUIAS, REGLAS_TORRE };
})();
