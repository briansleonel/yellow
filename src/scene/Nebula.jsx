import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useJourney } from '../useJourney.jsx'

/* Nubes de polvo estelar. Son poquísimas (9) y muy tenues, pero sin ellas
 * el viaje se siente plano: son las que dan la sensación de profundidad,
 * de estar atravesando algo y no sólo puntos flotando. */

const CANTIDAD = 9
const PROFUNDIDAD = 190

const vertexShader = /* glsl */ `
  attribute vec3  aSemilla;
  attribute float aTamano;
  attribute float aTono;

  uniform float uRecorrido;
  uniform float uProfundidad;
  uniform vec2  uRumbo;

  varying vec2  vUv;
  varying float vOpacidad;
  varying float vTono;

  void main() {
    vUv   = uv;
    vTono = aTono;

    // Las nubes están LEJOS, así que se mueven a una fracción de la velocidad
    // del viaje. Es paralaje de verdad —lo distante se desplaza menos— y de
    // paso mata el estroboscopio: a velocidad completa te pasaba una cada
    // 0,13s, o sea nueve destellos por segundo. Ahora el ciclo dura ~14s.
    float z = mod(aSemilla.z + uRecorrido * 0.12, uProfundidad) - uProfundidad;
    vec3 p  = vec3(aSemilla.xy + uRumbo * (-z / uProfundidad) * 20.0, z);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    mv.xy += position.xy * aTamano;   // cuadro siempre de frente a la cámara

    float distancia = -mv.z;

    // Y nunca se acercan. Una nube de 150 unidades a 20 de distancia tapa la
    // pantalla entera, y como se dibuja en modo aditivo la lava de luz: eso
    // no es un velo, es un flash. Se apagan del todo mucho antes de llegar.
    vOpacidad = smoothstep(50.0, 115.0, distancia)
              * smoothstep(uProfundidad, uProfundidad * 0.35, distancia);

    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTiempo;
  uniform float uVelocidad;
  uniform vec3  uColorA;
  uniform vec3  uColorB;

  varying vec2  vUv;
  varying float vOpacidad;
  varying float vTono;

  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float caida = pow(max(1.0 - d, 0.0), 2.6);

    // Turbulencia barata: dos capas de senos cruzados. No es ruido real,
    // pero detrás del bloom y a esta opacidad nadie nota la diferencia.
    float n = sin(vUv.x * 9.0 + uTiempo * 0.05) * sin(vUv.y * 7.0 - uTiempo * 0.04);
    n += 0.5 * sin(vUv.x * 19.0 - 1.7) * sin(vUv.y * 17.0 + 2.3);
    n = n * 0.5 + 0.5;

    // Al acelerar se retiran un poco más: están para dar profundidad en el
    // crucero, y durante el warp sólo ensucian los trazos.
    float a = caida * (0.45 + 0.55 * n) * vOpacidad * 0.13
            * (1.0 - 0.55 * min(uVelocidad, 1.0));
    if (a < 0.002) discard;

    gl_FragColor = vec4(mix(uColorA, uColorB, vTono), a);
  }
`

export default function Nebula({ movil }) {
  const { est } = useJourney()

  const geometria = useMemo(() => {
    const plano = new THREE.PlaneGeometry(1, 1)
    const g = new THREE.InstancedBufferGeometry()
    g.index = plano.index
    g.setAttribute('position', plano.attributes.position)
    g.setAttribute('uv', plano.attributes.uv)
    g.instanceCount = CANTIDAD

    const semillas = new Float32Array(CANTIDAD * 3)
    const tamanos = new Float32Array(CANTIDAD)
    const tonos = new Float32Array(CANTIDAD)

    for (let i = 0; i < CANTIDAD; i++) {
      const angulo = Math.random() * Math.PI * 2
      const radio = 10 + Math.random() * 40
      semillas[i * 3 + 0] = Math.cos(angulo) * radio
      semillas[i * 3 + 1] = Math.sin(angulo) * radio
      // Repartidas en profundidad, pero DESPAREJAS a propósito: equiespaciadas
      // exactas te dan un pulso regular, y el ojo detecta un ritmo al toque.
      semillas[i * 3 + 2] = ((i + Math.random() * 0.8) / CANTIDAD) * PROFUNDIDAD
      tamanos[i] = 70 + Math.random() * 90
      tonos[i] = Math.random()
    }

    g.setAttribute('aSemilla', new THREE.InstancedBufferAttribute(semillas, 3))
    g.setAttribute('aTamano', new THREE.InstancedBufferAttribute(tamanos, 1))
    g.setAttribute('aTono', new THREE.InstancedBufferAttribute(tonos, 1))
    plano.dispose()
    return g
  }, [])

  const uniforms = useMemo(
    () => ({
      uRecorrido: { value: 0 },
      uTiempo: { value: 0 },
      uVelocidad: { value: 0 },
      uProfundidad: { value: PROFUNDIDAD },
      uRumbo: { value: new THREE.Vector2() },
      uColorA: { value: new THREE.Color('#2a3d8f') },
      uColorB: { value: new THREE.Color('#7c3f9e') },
    }),
    [],
  )

  useFrame((state) => {
    const s = est.current
    uniforms.uRecorrido.value = s.recorrido
    uniforms.uTiempo.value = state.clock.elapsedTime
    uniforms.uVelocidad.value = s.velocidad
    uniforms.uRumbo.value.set(s.rumbo.x, s.rumbo.y)
  })

  if (movil && CANTIDAD > 9) return null

  return (
    <mesh geometry={geometria} frustumCulled={false} renderOrder={-1}>
      <shaderMaterial
        args={[{ vertexShader, fragmentShader, uniforms }]}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
