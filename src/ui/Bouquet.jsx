import { useCallback, useRef, useState } from 'react'

/* El ramo, dibujado en SVG.
 *
 * Nueve flores en un racimo desparejo: los tallos se dibujan solos de abajo
 * hacia arriba y después cada flor se abre, una atrás de la otra. Lo desparejo
 * es a propósito — un ramo simétrico se ve hecho por una máquina. */

const FLORES = [
  { x: 200, y: 96, r: 46, giro: -6, retraso: 0.0, petalos: 10 },
  { x: 132, y: 128, r: 40, giro: 14, retraso: 0.11, petalos: 9 },
  { x: 268, y: 126, r: 41, giro: -18, retraso: 0.18, petalos: 10 },
  { x: 176, y: 180, r: 37, giro: 22, retraso: 0.26, petalos: 9 },
  { x: 248, y: 188, r: 36, giro: -10, retraso: 0.33, petalos: 9 },
  { x: 96, y: 192, r: 31, giro: 30, retraso: 0.41, petalos: 8 },
  { x: 306, y: 190, r: 32, giro: -26, retraso: 0.48, petalos: 8 },
  { x: 212, y: 246, r: 29, giro: 8, retraso: 0.56, petalos: 8 },
  { x: 148, y: 250, r: 26, giro: -16, retraso: 0.63, petalos: 8 },
]

const BASE_Y = 406

function Flor({ r, petalos }) {
  const exteriores = Array.from({ length: petalos }, (_, i) => (i * 360) / petalos)
  const interiores = exteriores.map((a) => a + 180 / petalos)

  return (
    <g>
      {exteriores.map((a, i) => (
        <ellipse
          key={`e${i}`}
          cx="0"
          cy={-r * 0.56}
          rx={r * 0.23}
          ry={r * 0.5}
          fill="url(#petaloExterior)"
          transform={`rotate(${a})`}
        />
      ))}

      {interiores.map((a, i) => (
        <ellipse
          key={`i${i}`}
          cx="0"
          cy={-r * 0.37}
          rx={r * 0.16}
          ry={r * 0.33}
          fill="url(#petaloInterior)"
          transform={`rotate(${a})`}
        />
      ))}

      <circle r={r * 0.27} fill="url(#centro)" />
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2
        const d = r * 0.15
        return (
          <circle
            key={`s${i}`}
            cx={Math.cos(a) * d}
            cy={Math.sin(a) * d}
            r={r * 0.032}
            fill="#6b3f0c"
            opacity="0.55"
          />
        )
      })}
    </g>
  )
}

export default function Bouquet() {
  const [petalosSueltos, setPetalosSueltos] = useState([])
  const siguienteId = useRef(0)

  // Si la toca, se le sueltan pétalos. Nada más. Pero es lo que hace que
  // el ramo se sienta un objeto y no una imagen.
  const soltarPetalos = useCallback(() => {
    const nuevos = Array.from({ length: 7 }, () => ({
      id: siguienteId.current++,
      izq: 12 + Math.random() * 76,
      demora: Math.random() * 0.5,
      duracion: 4 + Math.random() * 2.5,
      deriva: (Math.random() - 0.5) * 120,
      giro: (Math.random() - 0.5) * 720,
      escala: 0.6 + Math.random() * 0.7,
    }))

    setPetalosSueltos((prev) => [...prev, ...nuevos])
    const ids = new Set(nuevos.map((p) => p.id))
    setTimeout(() => {
      setPetalosSueltos((prev) => prev.filter((p) => !ids.has(p.id)))
    }, 7000)
  }, [])

  return (
    <div className="ramo-envoltorio">
      <svg
        className="ramo"
        viewBox="0 0 400 430"
        role="img"
        aria-label="Un ramo de flores amarillas"
        onClick={soltarPetalos}
      >
        <defs>
          {/* El gradiente sigue la caja de cada pétalo, así que rota con él:
              siempre oscuro en la base y luminoso en la punta. */}
          <linearGradient id="petaloExterior" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#e08900" />
            <stop offset="45%" stopColor="#ffc93c" />
            <stop offset="100%" stopColor="#fff3b0" />
          </linearGradient>

          <linearGradient id="petaloInterior" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#c97600" />
            <stop offset="100%" stopColor="#ffd23f" />
          </linearGradient>

          <radialGradient id="centro">
            <stop offset="0%" stopColor="#d99a22" />
            <stop offset="65%" stopColor="#a86a1f" />
            <stop offset="100%" stopColor="#7a4a12" />
          </radialGradient>

          <linearGradient id="tallo" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#24401f" />
            <stop offset="100%" stopColor="#4a7d42" />
          </linearGradient>
        </defs>

        {/* Los tallos, primero: se dibujan de la base hacia las flores. */}
        <g className="ramo__tallos">
          {FLORES.map((f, i) => {
            const baseX = 200 + (i % 2 ? 1 : -1) * (3 + i * 1.7)
            const cx = (f.x + baseX) / 2 + (f.x - 200) * 0.2
            const cy = (f.y + BASE_Y) / 2
            return (
              <path
                key={i}
                d={`M ${baseX} ${BASE_Y} Q ${cx} ${cy} ${f.x} ${f.y}`}
                stroke="url(#tallo)"
                strokeWidth={3.4 - i * 0.12}
                strokeLinecap="round"
                fill="none"
                style={{ animationDelay: `${0.15 + i * 0.07}s` }}
              />
            )
          })}
        </g>

        {/* Unas hojas sueltas, para que el verde no sea sólo palitos. */}
        <g className="ramo__hojas">
          {[
            { x: 168, y: 318, rot: -34, s: 1 },
            { x: 236, y: 336, rot: 40, s: 0.85 },
            { x: 150, y: 366, rot: -18, s: 0.7 },
          ].map((h, i) => (
            <path
              key={i}
              d="M0 0 C 16 -14 44 -16 58 -2 C 44 12 16 14 0 0 Z"
              fill="#3f6b3a"
              transform={`translate(${h.x} ${h.y}) rotate(${h.rot}) scale(${h.s})`}
              style={{ animationDelay: `${1.0 + i * 0.16}s` }}
            />
          ))}
        </g>

        {/* Y recién ahí, las flores. Cada una se abre con su propio retraso. */}
        {FLORES.map((f, i) => (
          <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${f.giro})`}>
            <g
              className="ramo__flor"
              style={{ animationDelay: `${0.85 + f.retraso}s, ${2.6 + i * 0.3}s` }}
            >
              <Flor r={f.r} petalos={f.petalos} />
            </g>
          </g>
        ))}
      </svg>

      {petalosSueltos.map((p) => (
        <span
          key={p.id}
          className="petalo-cae"
          style={{
            left: `${p.izq}%`,
            animationDelay: `${p.demora}s`,
            animationDuration: `${p.duracion}s`,
            '--deriva': `${p.deriva}px`,
            '--giro': `${p.giro}deg`,
            '--escala': p.escala,
          }}
        />
      ))}
    </div>
  )
}
