// Math World — banco de tareas de la Guerra de clanes.
// Lo usan el portal docente (para lanzarlas) y el juego (para saber qué acciones suman).
// acciones: lo que cuenta el juego con contar(); pts: puntos para el clan por cada acción; seg: duración sugerida.
(function (global) {
  'use strict';
  global.TAREAS_GUERRA = [
    { id: 'talar', nombre: 'Leñadores', icono: '🪓', acciones: ['talar'], pts: 1, seg: 180, desc: 'Talen árboles y recolecten cactus, hongos y bayas.' },
    { id: 'picar', nombre: 'Mineros', icono: '⛏️', acciones: ['picar', 'veta', 'obsidiana', 'magma', 'hielo_eterno'], pts: 1, seg: 180, desc: 'Piquen rocas y vetas en cualquier mundo.' },
    { id: 'agua', nombre: 'Aguateros', icono: '💧', acciones: ['agua'], pts: 2, seg: 150, desc: 'Saquen agua de los lagos con el balde.' },
    { id: 'aciertos', nombre: 'Mentes brillantes', icono: '🧠', acciones: ['acierto'], pts: 1, seg: 120, desc: 'Respondan bien cualquier pregunta del juego.' },
    { id: 'enemigos', nombre: 'Cazadores', icono: '⚔️', acciones: ['vencer'], pts: 2, seg: 180, desc: 'Venzan a cualquier enemigo.' },
    { id: 'jabalis', nombre: 'Caza de jabalíes', icono: '🐗', acciones: ['bicho'], pts: 4, seg: 180, desc: 'Venzan jabalíes salvajes en el Bosque de los Enteros.' },
    { id: 'aranas', nombre: 'Cazadores de arañas', icono: '🕷️', acciones: ['arana'], pts: 5, seg: 180, desc: 'Venzan arañas del Bosque profundo (caen de los árboles).' },
    { id: 'duendes', nombre: 'Duendes traviesos', icono: '🧌', acciones: ['arbusto'], pts: 3, seg: 150, desc: 'Venzan duendes del bosque escondidos en los arbustos.' },
    { id: 'escorpiones', nombre: 'Escorpiones', icono: '🦂', acciones: ['escorpion'], pts: 4, seg: 180, desc: 'Venzan escorpiones en el Desierto Algebraico.' },
    { id: 'murcielagos', nombre: 'Murciélagos', icono: '🦇', acciones: ['murcielago'], pts: 4, seg: 180, desc: 'Venzan murciélagos en la Mina de las Formas.' },
    { id: 'lobos', nombre: 'Lobos de las nieves', icono: '🐺', acciones: ['lobo_nieve'], pts: 5, seg: 180, desc: 'Venzan lobos de las nieves en el Glaciar de los Datos.' },
    { id: 'cofres', nombre: 'Cazatesoros', icono: '🧰', acciones: ['cofre'], pts: 4, seg: 240, desc: 'Abran cofres escondidos en los mundos.' },
    { id: 'pesca', nombre: 'Gran pesca', icono: '🎣', acciones: ['pescar'], pts: 4, seg: 240, desc: 'Pesquen en el muelle del gran lago del Bosque (necesitan caña).' },
    { id: 'excavar', nombre: 'Arqueólogos', icono: '🏺', acciones: ['excavar'], pts: 5, seg: 240, desc: 'Excaven sitios arqueológicos en el Valle de la Esfinge.' },
    { id: 'fabricar', nombre: 'Artesanos', icono: '🔨', acciones: ['fabricar'], pts: 3, seg: 180, desc: 'Fabriquen adornos y muebles en la fogata de la base.' },
    { id: 'aporte', nombre: 'Constructores', icono: '🏗️', acciones: ['aporte'], pts: 1, seg: 180, desc: 'Aporten recursos a las obras del grupo (1 punto por recurso).' },
  ];
})(window);
