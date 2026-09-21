import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { TIEMPOS } from './content.js'

/* Un solo reloj para todo el viaje.
 *
 * El truco de rendimiento: el tiempo exacto vive en un ref (lo lee el bucle
 * de render 3D en cada cuadro, sin re-renderizar React ni una vez), y sólo
 * la fase y un reloj grueso a 10fps se publican como estado para la UI.  */

const Ctx = createContext(null)
export const useJourney = () => useContext(Ctx)

export const UNIDADES_POR_SEG = 150 // a qué distancia equivale "velocidad 1"

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const suave = (a, b, t) => {
  const x = clamp01((t - a) / (b - a))
  return x * x * (3 - 2 * x)
}

/* Curva de velocidad. 0 = quieto · 1 = warp · ~1.1 = el pico al atravesar. */
export function velocidadEn(t) {
  const T = TIEMPOS
  if (t <= T.despegue) return 0

  let v = 0
  v += 0.2 * suave(T.despegue, T.viaje, t) // arranca
  v += 0.55 * suave(T.viaje, T.anillo, t) // crucero
  v += 0.35 * suave(T.anillo, T.atravesar, t) // el último tirón

  // Frenada al cruzar el anillo: de golpe, y después deriva suave.
  v *= 1 - 0.985 * suave(T.atravesar + 0.6, T.llegada + 3.5, t)

  return v + 0.015
}

export function faseEn(t, arrancado) {
  if (!arrancado) return 'intro'
  const T = TIEMPOS
  if (t < T.viaje) return 'despegue'
  if (t < T.atravesar) return 'viaje'
  if (t < T.llegada) return 'atravesar'
  if (t < T.florecer) return 'llegada'
  if (t < T.mensaje) return 'florecer'
  return 'mensaje'
}

export function JourneyProvider({ children }) {
  const [fase, setFase] = useState('intro')
  const [reloj, setReloj] = useState(0) // grueso, ~10fps, sólo para la UI

  const est = useRef({
    t: 0,
    arrancado: false,
    velocidad: 0,
    recorrido: 0,
    rumbo: { x: 0, y: 0 }, // suavizado
    rumboDestino: { x: 0, y: 0 }, // hacia dónde apunta el dedo/mouse
  })

  const arrancar = useCallback(() => {
    if (est.current.arrancado) return
    est.current.t = 0
    est.current.arrancado = true
    setFase('despegue')
  }, [])

  const reiniciar = useCallback(() => {
    est.current.t = 0
    est.current.velocidad = 0
    est.current.arrancado = true
    setFase('despegue')
    setReloj(0)
  }, [])

  /* Pilotear: la posición del dedo o del mouse inclina el rumbo.
   * Nunca puede trabar el viaje, sólo desviarlo. */
  useEffect(() => {
    const apuntar = (cx, cy) => {
      est.current.rumboDestino.x = (cx / window.innerWidth) * 2 - 1
      est.current.rumboDestino.y = -((cy / window.innerHeight) * 2 - 1)
    }
    const onMouse = (e) => apuntar(e.clientX, e.clientY)
    const onTouch = (e) => {
      const t = e.touches[0]
      if (t) apuntar(t.clientX, t.clientY)
    }
    const soltar = () => {
      est.current.rumboDestino.x = 0
      est.current.rumboDestino.y = 0
    }

    window.addEventListener('pointermove', onMouse, { passive: true })
    window.addEventListener('touchmove', onTouch, { passive: true })
    window.addEventListener('touchend', soltar, { passive: true })
    window.addEventListener('pointerleave', soltar, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMouse)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('touchend', soltar)
      window.removeEventListener('pointerleave', soltar)
    }
  }, [])

  /* El bucle maestro. Es el único que avanza el tiempo: el render 3D
   * sólo lee lo que este bucle dejó escrito. */
  useEffect(() => {
    let raf
    let anterior = performance.now()
    let ultimaPublicacion = 0

    const tic = (ahora) => {
      raf = requestAnimationFrame(tic)
      const dt = Math.min((ahora - anterior) / 1000, 0.05) // pestaña en segundo plano
      anterior = ahora

      const s = est.current
      if (s.arrancado) s.t += dt

      s.velocidad = velocidadEn(s.t)
      s.recorrido += s.velocidad * UNIDADES_POR_SEG * dt

      // El rumbo persigue al dedo con retardo: se siente una nave pesada.
      const k = Math.min(1, dt * 2.2)
      s.rumbo.x += (s.rumboDestino.x - s.rumbo.x) * k
      s.rumbo.y += (s.rumboDestino.y - s.rumbo.y) * k

      if (ahora - ultimaPublicacion > 100) {
        ultimaPublicacion = ahora
        setReloj(s.t)
        const f = faseEn(s.t, s.arrancado)
        setFase((prev) => (prev === f ? prev : f))
      }
    }

    raf = requestAnimationFrame(tic)
    return () => cancelAnimationFrame(raf)
  }, [])

  /* Sólo en desarrollo: desde la consola del navegador,
   *   __viaje.saltarA(51)
   * salta directo a ese segundo. Sirve para no tener que ver el viaje
   * entero cada vez que se retoca el mensaje final. */
  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.__viaje = {
      saltarA: (segundos) => {
        est.current.arrancado = true
        est.current.t = segundos
      },
      estado: est,
    }
  }, [])

  const valor = useMemo(
    () => ({ est, fase, reloj, arrancar, reiniciar }),
    [fase, reloj, arrancar, reiniciar],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}
