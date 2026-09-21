import { MENSAJE_FINAL, PERSONA } from '../content.js'

export default function FinalMessage() {
  return (
    <div className="final">
      {MENSAJE_FINAL.map((linea, i) => (
        <p key={i} className="final__linea" style={{ animationDelay: `${i * 0.95}s` }}>
          {linea}
        </p>
      ))}

      <p
        className="final__firma"
        style={{ animationDelay: `${MENSAJE_FINAL.length * 0.95 + 0.7}s` }}
      >
        Te quiero mucho, {PERSONA.nombre}
      </p>
    </div>
  )
}
