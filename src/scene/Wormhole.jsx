import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TIEMPOS } from '../content.js'
import { useJourney } from '../useJourney.jsx'

/* El umbral: un disco oscuro con un anillo de luz alrededor, tipo Gargantua.
 *
 * No se mueve: crece. Arranca como un punto perdido a lo lejos y termina
 * comiéndose la pantalla justo antes del destello. Crece exponencialmente
 * porque así se siente que uno se acerca a algo enorme, no que una figura
 * se está agrandando. */

const Z_FIJO = -55

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3  uColor;
  uniform float uOpacidad;
  uniform float uTiempo;

  varying vec2 vUv;

  void main() {
    vec2 c = vUv - 0.5;
    float d = length(c) * 2.0;

    // El interior: negro opaco. Tapa las estrellas de atrás, y ese vacío
    // es lo que lo vuelve un agujero y no un aro.
    float disco = smoothstep(0.608, 0.565, d);

    // El anillo, fino y brillante.
    float banda = exp(-pow((d - 0.60) / 0.026, 2.0));

    // El halo alrededor, mucho más suave.
    float halo = exp(-pow((d - 0.60) / 0.17, 2.0)) * 0.34;

    // El disco de acreción: un estirón horizontal, como una lente sucia.
    float lente = exp(-pow((d - 0.60) / 0.055, 2.0))
                * smoothstep(0.34, 0.0, abs(c.y))
                * (0.75 + 0.25 * sin(uTiempo * 0.7));

    float brillo = clamp(banda + halo + lente * 0.85, 0.0, 1.6);

    vec3 col = uColor * brillo;
    float a = max(disco, min(brillo, 1.0)) * uOpacidad;
    if (a < 0.004) discard;

    gl_FragColor = vec4(col, a);
  }
`

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

export default function Wormhole() {
  const { est } = useJourney()
  const malla = useRef()

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color('#ffd98a') },
      uOpacidad: { value: 0 },
      uTiempo: { value: 0 },
    }),
    [],
  )

  useFrame((state) => {
    const m = malla.current
    if (!m) return

    const t = est.current.t
    const { anillo, atravesar } = TIEMPOS

    // Fuera de su ventana no existe: ni se dibuja ni cuesta nada.
    if (t < anillo - 2 || t > atravesar + 1.2) {
      m.visible = false
      return
    }
    m.visible = true

    const p = clamp01((t - anillo) / (atravesar - anillo))
    const escala = 0.3 * Math.pow(170, p) // 0.3 → ~51: de punto a pantalla entera

    m.scale.setScalar(escala)
    m.rotation.z = state.clock.elapsedTime * 0.04

    uniforms.uTiempo.value = state.clock.elapsedTime
    uniforms.uOpacidad.value =
      clamp01((t - (anillo - 1.5)) / 2.2) * (1 - clamp01((t - atravesar) / 0.5))
  })

  return (
    <mesh ref={malla} position={[0, 0, Z_FIJO]} frustumCulled={false} renderOrder={2}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        args={[{ vertexShader, fragmentShader, uniforms }]}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}
