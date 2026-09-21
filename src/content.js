/* ============================================================
 *  TODO LO QUE SE EDITA ESTÁ EN ESTE ARCHIVO.
 *  No hace falta tocar ningún otro para cambiar el regalo.
 * ============================================================ */

export const PERSONA = {
  nombre: 'Danna',             // A quién va dirigido
  firma: 'Brian',              // Quién lo manda
  inicial: 'D',                // La letra que dibujan las estrellas a mitad de viaje
  fecha: '21 · 09 · 2026',     //   (dejalo en '' y la constelación no aparece)

  // El viaje entero, de donde estás vos a donde está ella.
  // Ahora dice Buenos Aires → Ciudad de México: cambialas por las de ustedes.
  coordenadas: '34°36′ S · 58°22′ O   →   19°26′ N · 99°08′ O',
}

export const INTRO = {
  dedicatoria: `Para ${PERSONA.nombre}`,
  invitacion: 'tocá para viajar',
}

/* Las líneas del poema que aparecen lejos, crecen y te pasan al lado.
 * `at` = segundo exacto en que aparece cada una. Cada línea vive 7,5s,
 * de los cuales unos 4,4s se leen a tamaño casi fijo.
 * Mantenelas CORTAS: se leen de un vistazo, no de a pedacitos. */
export const LINEAS_VIAJE = [
  { at: 8.0, texto: 'Dicen que hay dos billones de galaxias.' },
  { at: 13.5, texto: 'Las recorrí todas.' },
  { at: 19.0, texto: 'Buscaba algo que brillara como vos.' },
  { at: 24.5, texto: 'Tardé más de lo que pensaba.' },
  { at: 30.0, texto: 'Porque las estrellas se apagan.' },
  { at: 35.5, texto: 'Y vos no.' },
  { at: 41.0, texto: 'Así que volví.' },
  { at: 46.5, texto: 'Con lo único que crece en el vacío:' },
]

/* Ojo: la última línea termina en dos puntos a propósito. La respuesta no
 * es un texto, es el ramo abriéndose. La imagen cierra la frase, y por eso
 * debajo del ramo no va nada escrito. */

/* El mensaje final. Queda en pantalla para siempre.
 * Cada string es una línea; aparecen de a una. */
export const MENSAJE_FINAL = [
  `Para ${PERSONA.nombre}.`,
  'El amarillo es el color de lo que florece',
  'aunque nadie le haya dado permiso.',
  'Como vos.',
]

/* ============================================================
 *  LÍNEA DE TIEMPO (en segundos desde que toca "viajar").
 *  Tocá esto si querés el viaje más corto o más largo.
 *
 *  Ojo: la última línea del poema aparece a los 46,5s y dura 7,5s,
 *  así que `atravesar` no puede ser antes de 54 o se corta el poema.
 * ============================================================ */
export const TIEMPOS = {
  despegue: 0,      // las estrellas empiezan a moverse, lento
  viaje: 6,         // acelera: las estrellas se estiran en trazos
  constelacion: 22, // unas estrellas se conectan y dibujan la inicial
  anillo: 38,       // aparece el anillo de luz a lo lejos
  atravesar: 54,    // warp máximo + flash blanco
  llegada: 58,      // desaceleración, entra la luz dorada
  florecer: 64,     // el ramo se abre
  mensaje: 72,      // el texto final, línea por línea
}

export const DURACION_TOTAL = TIEMPOS.mensaje + 8

/* ============================================================
 *  RENDIMIENTO — si va a tirones, tocá esto y nada más.
 *
 *  Las estrellas se dibujan en modo aditivo sin test de profundidad: cada
 *  una pinta todos sus píxeles, ninguno se descarta por estar tapado. Así
 *  que lo que cuesta no son los vértices, es el RELLENO DE PÍXELES.
 *  Por eso bajar la nitidez rinde más que bajar la cantidad de estrellas.
 * ============================================================ */
export const RENDIMIENTO = {
  estrellasEscritorio: 700,
  estrellasMovil: 400,

  // Resolución máxima de render. 1 = la nativa del CSS; 2 = retina, que son
  // CUATRO veces los píxeles. Este es el número que más cambia la fluidez:
  // si todavía va a tirones, bajalo a 1.25 o a 1 antes de tocar lo de arriba.
  nitidezMaxima: 1.5,
  nitidezMaximaMovil: 1.25,
}

/* ============================================================
 *  PALETA — el contraste frío/cálido es lo que hace el efecto:
 *  todo el viaje es azul, y la llegada es dorada.
 * ============================================================ */
export const COLORES = {
  espacio: '#000005',
  estrella: '#dfe9ff',
  nebulosaA: '#2a3d8f',
  nebulosaB: '#7c3f9e',
  anillo: '#ffd98a',
  petalo: '#ffd23f',
  petaloClaro: '#fff3b0',
  petaloOscuro: '#f0a500',
  tallo: '#3f6b3a',
}
