import { useMemo } from 'react'
import { PERSONA, TIEMPOS } from '../content.js'

const DURACION = 9

/* A mitad del viaje, un grupo de estrellas se conecta y dibuja su inicial.
 *
 * La primera versión era una letra enorme y brillante: no se leía como una
 * constelación, se leía como un error. Ahora la letra va tenue y atrás, y
 * lo que manda son los puntos y las líneas finitas que los unen — que es
 * como se ve una constelación de verdad.
 *
 * Si no la quieren, `PERSONA.inicial = ''` y desaparece. */
export default function Constellation({ reloj }) {
  const transcurrido = reloj - TIEMPOS.constelacion

  // Puntos fijos (no aleatorios): tienen que parecer un dibujo intencional,
  // y encima así no bailan entre renders.
  const puntos = useMemo(
    () => [
      { x: 38, y: 54 },
      { x: 74, y: 32 },
      { x: 118, y: 44 },
      { x: 146, y: 82 },
      { x: 128, y: 126 },
      { x: 84, y: 146 },
      { x: 44, y: 118 },
    ],
    [],
  )

  if (!PERSONA.inicial || transcurrido < 0 || transcurrido > DURACION) return null

  return (
    <svg
      className="constelacion"
      viewBox="0 0 200 200"
      aria-hidden="true"
      style={{ animationDelay: `${-transcurrido}s` }}
    >
      <text className="constelacion__letra" x="100" y="128" textAnchor="middle">
        {PERSONA.inicial}
      </text>

      <polyline
        className="constelacion__lineas"
        points={puntos.map((p) => `${p.x},${p.y}`).join(' ')}
      />

      {puntos.map((p, i) => (
        <circle
          key={i}
          className="constelacion__estrella"
          cx={p.x}
          cy={p.y}
          r={i % 3 === 0 ? 2.1 : 1.4}
          style={{ animationDelay: `${i * 0.38}s` }}
        />
      ))}
    </svg>
  )
}
