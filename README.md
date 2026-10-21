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

Cada cambio en `main` se publica automáticamente en Vercel.
