# Math World

Sitio de material pedagógico de matemáticas: **mathworld.cl**

- `materiales/` — archivos descargables (PDF, PPT, controles, juegos).
- `materiales.json` — lista de materiales que muestra la página. Cada entrada:

```json
{
  "titulo": "Guía de fracciones",
  "descripcion": "Ejercicios de suma y resta de fracciones.",
  "tipo": "Guía",
  "curso": "5° básico",
  "unidad": "Números",
  "archivo": "materiales/5basico/guia-fracciones.pdf"
}
```

`tipo` puede ser: Guía, Presentación, Control o Juego.

Cada cambio en la rama `main` se publica automáticamente en Vercel.
