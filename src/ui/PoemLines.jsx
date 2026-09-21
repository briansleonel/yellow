import { LINEAS_VIAJE } from '../content.js'

const DURACION = 7.5 // tiene que coincidir con la animación `pasar` del CSS

/* Cada línea nace chiquita y lejos, crece y te pasa al lado.
 *
 * El `animationDelay` negativo es el truco clave: adelanta la animación
 * hasta el punto exacto en que debería estar. Así el texto queda siempre
 * sincronizado con el reloj del viaje aunque el reloj se publique a 10fps
 * y aunque se reinicie el viaje a mitad de camino. */
export default function PoemLines({ reloj }) {
  return (
    <>
      {LINEAS_VIAJE.map((linea, i) => {
        const transcurrido = reloj - linea.at
        if (transcurrido < 0 || transcurrido > DURACION) return null

        // Si todas vinieran por el centro exacto se sentiría una lista,
        // no un viaje. Cada una entra por un punto de fuga distinto.
        // Los corrimientos son chicos a propósito: con más, en un celular
        // angosto las líneas largas se salen de la pantalla.
        const dx = [0, -5, 4, -3, 5, -5, 3, 1][i % 8]
        const dy = [0, 4, -5, 5, -3, 4, -5, 2][i % 8]

        return (
          <p
            key={`${i}-${linea.at}`}
            className="linea"
            style={{
              marginLeft: `${dx}vw`,
              marginTop: `${dy}vh`,
              animationDelay: `${-transcurrido}s`,
            }}
          >
            {linea.texto}
          </p>
        )
      })}
    </>
  )
}
