import { useMemo } from 'react'
import { JourneyProvider, useJourney } from './useJourney.jsx'
import Scene from './scene/Scene.jsx'
import Intro from './ui/Intro.jsx'
import PoemLines from './ui/PoemLines.jsx'
import Constellation from './ui/Constellation.jsx'
import Bouquet from './ui/Bouquet.jsx'
import FinalMessage from './ui/FinalMessage.jsx'
import { useAmbient } from './audio/useAmbient.js'
import { PERSONA, TIEMPOS } from './content.js'

function Experiencia() {
  const { est, fase, reloj, arrancar, reiniciar } = useJourney()
  const audio = useAmbient(est)

  // En el celular bajamos partículas y resolución: que no se le queme
  // la batería ni le vaya a tirones cuando lo abra desde la cama.
  const movil = useMemo(
    () => window.matchMedia('(max-width: 820px)').matches || navigator.maxTouchPoints > 1,
    [],
  )

  const empezar = () => {
    arrancar()
    audio.arrancar() // el audio sólo puede nacer de un gesto del usuario
  }

  const enViaje = fase === 'despegue' || fase === 'viaje'
  const llego = fase === 'llegada' || fase === 'florecer' || fase === 'mensaje'
  const destello = reloj >= TIEMPOS.atravesar && reloj < TIEMPOS.atravesar + 2.5

  return (
    <>
      <Scene movil={movil} />

      {llego && <div className="resplandor" />}

      <div className="capa">
        {fase === 'intro' && <Intro onArrancar={empezar} />}

        {enViaje && (
          <>
            <PoemLines reloj={reloj} />
            <Constellation reloj={reloj} />
          </>
        )}

        {llego && (
          <div className={`llegada${fase === 'mensaje' ? ' llegada--con-mensaje' : ''}`}>
            {reloj >= TIEMPOS.florecer && <Bouquet />}
            {fase === 'mensaje' && <FinalMessage />}
          </div>
        )}
      </div>

      {destello && <div className="destello" />}

      {llego && (
        <p className="coordenadas">
          {PERSONA.coordenadas} · {PERSONA.fecha}
        </p>
      )}

      <div className="controles">
        {audio.disponible && (
          <button className="boton" onClick={audio.alternarSilencio}>
            {audio.silenciado ? 'sonido' : 'silencio'}
          </button>
        )}
        {fase === 'mensaje' && (
          <button className="boton" onClick={reiniciar}>
            volver a viajar
          </button>
        )}
      </div>
    </>
  )
}

export default function App() {
  return (
    <JourneyProvider>
      <Experiencia />
    </JourneyProvider>
  )
}
