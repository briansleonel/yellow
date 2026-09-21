import { useCallback, useEffect, useRef, useState } from 'react'
import { TIEMPOS } from '../content.js'

/* El sonido está generado en vivo con osciladores: no hay ningún archivo,
 * no hay nada que descargar y no hay derechos de autor de por medio.
 *
 * La idea musical: durante el viaje suena un acorde abierto (re + la, sin
 * tercera) que es ambiguo, ni alegre ni triste. Al llegar, la voz de arriba
 * se desliza un tono y medio y el acorde se vuelve MAYOR justo cuando las
 * flores se abren. Eso es lo que hace que la llegada se sienta como llegar. */

const ACORDE_VIAJE = [73.42, 110.0, 146.83] // re2 · la2 · re3  (quinta abierta)
const ACORDE_LLEGADA = [73.42, 110.0, 185.0] // re2 · la2 · fa#3 (re mayor)
const CAMPANAS = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33] // pentatónica de re

/* Una reverb sin archivo: ruido blanco que se apaga exponencialmente.
 * Es el truco de siempre, y suena a catedral. */
function crearImpulso(ctx, segundos = 3.8, decaimiento = 2.6) {
  const largo = Math.floor(ctx.sampleRate * segundos)
  const buffer = ctx.createBuffer(2, largo, ctx.sampleRate)
  for (let canal = 0; canal < 2; canal++) {
    const datos = buffer.getChannelData(canal)
    for (let i = 0; i < largo; i++) {
      datos[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, decaimiento)
    }
  }
  return buffer
}

export function useAmbient(est) {
  const audio = useRef(null)
  const [disponible, setDisponible] = useState(false)
  const [silenciado, setSilenciado] = useState(false)

  const arrancar = useCallback(() => {
    if (audio.current) return
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return

    const ctx = new Ctx()
    const ahora = ctx.currentTime

    const maestro = ctx.createGain()
    maestro.gain.setValueAtTime(0.0001, ahora)
    maestro.gain.exponentialRampToValueAtTime(0.85, ahora + 5)
    maestro.connect(ctx.destination)

    const reverb = ctx.createConvolver()
    reverb.buffer = crearImpulso(ctx)
    const envioReverb = ctx.createGain()
    envioReverb.gain.value = 0.55
    envioReverb.connect(reverb)
    reverb.connect(maestro)

    // El colchón grave: tres ondas apenas desafinadas entre sí. Ese batido
    // entre ellas es lo que lo hace respirar en vez de zumbar.
    const filtro = ctx.createBiquadFilter()
    filtro.type = 'lowpass'
    filtro.frequency.setValueAtTime(220, ahora)
    filtro.Q.value = 1.1

    const ganColchon = ctx.createGain()
    ganColchon.gain.value = 0.3
    filtro.connect(ganColchon)
    ganColchon.connect(maestro)
    ganColchon.connect(envioReverb)

    const osciladores = ACORDE_VIAJE.map((frecuencia, i) => {
      const osc = ctx.createOscillator()
      osc.type = i === 0 ? 'sine' : 'sawtooth'
      osc.frequency.setValueAtTime(frecuencia, ahora)
      osc.detune.setValueAtTime((i - 1) * 6, ahora)

      const g = ctx.createGain()
      g.gain.value = i === 0 ? 0.5 : 0.22
      osc.connect(g)
      g.connect(filtro)
      osc.start(ahora)
      return osc
    })

    audio.current = { ctx, maestro, filtro, envioReverb, osciladores, temporizadores: [], resuelto: false }

    // Campanas sueltas, cada tanto. Nunca en un pulso regular: si tuvieran
    // ritmo dejaría de ser espacio y sería una canción.
    const sonarCampana = () => {
      const a = audio.current
      if (!a || a.ctx.state === 'closed') return
      const t = a.ctx.currentTime
      const f = CAMPANAS[Math.floor(Math.random() * CAMPANAS.length)]

      const osc = a.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(f, t)

      const g = a.ctx.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.02) // ataque casi instantáneo
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5) // y una cola larguísima

      osc.connect(g)
      g.connect(a.maestro)
      g.connect(a.envioReverb)
      osc.start(t)
      osc.stop(t + 4.8)

      a.temporizadores.push(setTimeout(sonarCampana, 2600 + Math.random() * 4200))
    }
    audio.current.temporizadores.push(setTimeout(sonarCampana, 3000))

    setDisponible(true)
  }, [])

  /* El sonido sigue al viaje: al acelerar se abre el filtro y el colchón
   * crece; al llegar, el acorde se vuelve mayor. Diez veces por segundo
   * alcanza de sobra, y así no peleamos por cuadros con el render 3D. */
  useEffect(() => {
    const id = setInterval(() => {
      const a = audio.current
      if (!a || a.ctx.state !== 'running') return

      const s = est.current
      const t = a.ctx.currentTime
      const v = Math.min(s.velocidad, 1.2)

      a.filtro.frequency.setTargetAtTime(220 + v * 1500, t, 0.35)

      if (!a.resuelto && s.t >= TIEMPOS.llegada) {
        a.resuelto = true
        // El deslizamiento a mayor tarda lo que tarda el ramo en abrirse.
        const duracion = TIEMPOS.florecer - TIEMPOS.llegada
        a.osciladores.forEach((osc, i) => {
          osc.frequency.exponentialRampToValueAtTime(ACORDE_LLEGADA[i], t + duracion)
        })
        a.filtro.frequency.setTargetAtTime(900, t, 2.5)
      }
    }, 100)

    return () => clearInterval(id)
  }, [est])

  const alternarSilencio = useCallback(() => {
    const a = audio.current
    if (!a) return
    const proximo = !silenciado
    setSilenciado(proximo)
    a.maestro.gain.cancelScheduledValues(a.ctx.currentTime)
    a.maestro.gain.setTargetAtTime(proximo ? 0.0001 : 0.85, a.ctx.currentTime, 0.3)
  }, [silenciado])

  useEffect(
    () => () => {
      const a = audio.current
      if (!a) return
      a.temporizadores.forEach(clearTimeout)
      a.osciladores.forEach((o) => {
        try {
          o.stop()
        } catch {
          /* ya estaba detenido */
        }
      })
      a.ctx.close()
      audio.current = null
    },
    [],
  )

  return { arrancar, alternarSilencio, silenciado, disponible }
}
