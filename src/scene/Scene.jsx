import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useJourney } from '../useJourney.jsx'
import { RENDIMIENTO } from '../content.js'
import Starfield from './Starfield.jsx'
import Nebula from './Nebula.jsx'
import Wormhole from './Wormhole.jsx'

/* La cámara está quieta en el origen mirando hacia -Z: son las estrellas
 * las que vienen hacia nosotros. Lo único que se mueve acá es el alabeo
 * (según hacia dónde apunta el dedo) y el campo de visión, que se abre con
 * la velocidad. Esa apertura es la que hace sentir el acelerón. */
function Camara() {
  const { est } = useJourney()

  useFrame((state, delta) => {
    const s = est.current
    const cam = state.camera
    const dt = Math.min(delta, 0.05)

    cam.rotation.z = THREE.MathUtils.damp(cam.rotation.z, -s.rumbo.x * 0.1, 3, dt)

    const fovDeseado = 70 + Math.min(s.velocidad, 1.15) * 26
    if (Math.abs(cam.fov - fovDeseado) > 0.02) {
      cam.fov = THREE.MathUtils.damp(cam.fov, fovDeseado, 2.6, dt)
      cam.updateProjectionMatrix()
    }
  })

  return null
}

export default function Scene({ movil }) {
  return (
    <Canvas
      className="escena"
      dpr={[1, movil ? RENDIMIENTO.nitidezMaximaMovil : RENDIMIENTO.nitidezMaxima]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ fov: 70, near: 0.1, far: 420, position: [0, 0, 0] }}
    >
      <color attach="background" args={['#000005']} />
      <Camara />

      <Nebula movil={movil} />
      <Starfield movil={movil} />
      <Wormhole />

      {/* El bloom es el 80% del look: hace que la luz se derrame
          fuera de los bordes, como en una lente de cine. */}
      <EffectComposer disableNormalPass multisampling={0}>
        <Bloom
          intensity={movil ? 0.95 : 1.3}
          luminanceThreshold={0.22}
          luminanceSmoothing={0.35}
          mipmapBlur
          radius={0.74}
        />
        <Vignette offset={0.24} darkness={0.82} />
      </EffectComposer>
    </Canvas>
  )
}
