# Math World

Material pedagógico de matemáticas para **7° y 8° básico** — mathworld.cl

## Estructura

- `contenido.json` — cursos, unidades y materiales. Es lo único que hay que editar.
- `materiales/<curso>/<unidad>/` — archivos descargables (PDF, PPT, controles, juegos).
  Ej: `materiales/7basico/u1/guia-enteros.pdf`

## Habilitar una unidad

En `contenido.json`, cambiar `"habilitada": false` a `"habilitada": true`.
Las unidades no habilitadas aparecen como "Próximamente" y no se pueden abrir.

## Agregar un material

Dentro de `"materiales"` de la unidad:

```json
{
  "titulo": "Guía: suma y resta de enteros",
  "descripcion": "Ejercicios con recta numérica y problemas.",
  "tipo": "Guía",
  "archivo": "materiales/7basico/u1/guia-enteros.pdf"
}
```

`tipo`: Guía, Presentación, Control o Juego.

## Juego (`juego/`)

Juego de mundo abierto en `mathworld.cl/juego/`, hecho con Phaser 3 (incluido en `juego/assets/vendor`, sin instalar nada).

- `juego/juego.js` — mundo, personaje, recolección, base y menús.
- `juego/preguntas.js` — generadores de desafíos por curso y unidad. Para agregar una unidad nueva, sumar sus temas en `BANCO`.
- El mapa del juego lee `contenido.json`: las unidades habilitadas aparecen abiertas en el mapa.
- Cada estudiante tiene su base propia (fogata para fabricar, cofre y portal) y viaja por el portal a los mundos de las unidades habilitadas.
- Enemigos (arbustos, niebla, arañas que caen de los árboles): cada acierto les quita vida y cada error quita un corazón al jugador. Si pierde, vuelve a su base sin lo que llevaba en la mochila; lo guardado en el cofre se conserva.
- Desafíos de las 4 unidades de 7° y 8° en `preguntas.js` (Unidad 1) y `preguntas_u234.js` (Unidades 2 a 4).
- Inicio de sesión con RUT y clave propia, y portal docente (`juego/docente.html`), usando Supabase. La conexión se configura en `juego/config.js` y el esquema está en `supabase/esquema.sql`. Si `config.js` está vacío, el juego funciona sin conexión (progreso local con apodo).
- Las listas de estudiantes y la cuenta docente se cargan directamente en la base de datos: nunca se suben a este repositorio, que es público.
- Arte: personajes LPC (créditos en `juego/creditos.html`) y Roguelike Pack de Kenney (CC0).

Cada cambio en `main` se publica automáticamente en Vercel.
