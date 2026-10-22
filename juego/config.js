// Conexión a la base de datos (Supabase).
// La "clave pública" (anon) está pensada para ir en el navegador: las tablas no se
// pueden leer con ella, solo se pueden llamar las funciones mw_* que validan sesión.
// Si estos campos están vacíos, el juego funciona sin conexión (progreso local con apodo).
window.MW_CONFIG = {
  supabaseUrl: '',
  supabaseKey: '',
};
