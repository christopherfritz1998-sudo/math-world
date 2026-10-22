// Conexión a la base de datos (Supabase).
// La "clave pública" (anon) está pensada para ir en el navegador: las tablas no se
// pueden leer con ella, solo se pueden llamar las funciones mw_* que validan sesión.
// Si estos campos están vacíos, el juego funciona sin conexión (progreso local con apodo).
window.MW_CONFIG = {
  supabaseUrl: 'https://ajwhgbnfomlaovaeogma.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqd2hnYm5mb21sYW92YWVvZ21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MTA0MzgsImV4cCI6MjEwODI4NjQzOH0.gE2-OmlkP_SJ4z09dUH9AW1TZxlj294_PPd8tVCwcZ8',
};
