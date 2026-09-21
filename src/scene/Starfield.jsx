import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useJourney } from '../useJourney.jsx'
import { RENDIMIENTO } from '../content.js'

/* El campo de estrellas.
 *
 * Cada estrella es un cuadrilátero instanciado que se estira hacia atrás
 * según la velocidad: a velocidad cero es un punto, a warp es un trazo.
 *
 * El trazo se arma en ESPACIO DE PANTALLA, no en el mundo. Esto importa:
 * la primera versión lo estiraba a lo largo del eje z del mundo, y quedaba
 * como una cinta acostada en el plano x-z. Como Three descarta las caras
 * traseras, las estrellas por debajo del centro le mostraban el dorso a la
 * cámara y directamente no se veían: sólo aparecía la mitad de arriba.
 *
 * Armándolo en pantalla —entre donde está la estrella y donde estaba hace
 * un instante— el trazo siempre mira a la cámara, y encima sale radial
 * desde el centro, que es justo como se ven los trazos de warp de verdad. */

const PROFUNDIDAD = 190

const vertexShader = /* glsl */ `
  attribute vec3  aSemilla;
  attribute float aEscala;
  attribute float aTono;

  uniform float uRecorrido;
  uniform float uVelocidad;
  uniform float uTiempo;
  uniform float uProfundidad;
  uniform float uAspecto;
  uniform float uPixelNDC;
  uniform vec2  uRumbo;

  varying vec2  vUv;
  varying float vBrillo;
  varying float vTono;

  void main() {
    vUv     = uv;
    vTono   = aTono;
    vBrillo = 0.0;

    // La z avanza con el viaje y da la vuelta: el campo nunca se termina.
    float z = mod(aSemilla.z + uRecorrido, uProfundidad) - uProfundidad;

    // Pilotear: las lejanas se desplazan más que las cercanas (paralaje).
    vec3 p = vec3(aSemilla.xy + uRumbo * (-z / uProfundidad) * 26.0, z);

    vec4 mvCabeza = modelViewMatrix * vec4(p, 1.0);
    float distancia = -mvCabeza.z;

    // Una estrella casi encima de la cámara proyecta a coordenadas enormes:
    // su cuadrilátero barre la pantalla entera durante un cuadro y eso se ve
    // como un parpadeo. La sacamos del volumen de recorte antes de que pase.
    if (distancia < 7.0) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      return;
    }

    // La cola es donde estaba la estrella hace un instante: más lejos.
    // El tope está en 22 y no más: un trazo largo cubre muchísima pantalla,
    // y con mezcla aditiva cada pixel que cubre se paga.
    float largo = mix(0.06, 22.0, uVelocidad * uVelocidad) * (0.6 + aEscala);
    vec4 mvCola = mvCabeza;
    mvCola.z -= largo;

    vec4 clipCabeza = projectionMatrix * mvCabeza;
    vec4 clipCola   = projectionMatrix * mvCola;

    // Trabajamos en NDC con la x corregida por el aspecto, para que la
    // perpendicular sea perpendicular de verdad y no se deforme el ancho.
    float wCabeza = max(clipCabeza.w, 0.001);
    float wCola   = max(clipCola.w, 0.001);
    vec2 aCabeza = vec2(clipCabeza.x / wCabeza * uAspecto, clipCabeza.y / wCabeza);
    vec2 aCola   = vec2(clipCola.x   / wCola   * uAspecto, clipCola.y   / wCola);

    // El ancho en pantalla sale del ancho en el mundo dividido la distancia:
    // así las cercanas son más gruesas. El mínimo va en PIXELES REALES, no
    // en una constante fija: una línea brillante de menos de un pixel de
    // ancho titila siempre, y el bloom lo amplifica.
    float ancho = (0.030 + 0.055 * aEscala) * (1.0 - 0.45 * min(uVelocidad, 1.0));
    float anchoA = max(ancho * projectionMatrix[1][1] / wCabeza, uPixelNDC * 1.6);

    vec2 delta = aCabeza - aCola;
    float largoA = length(delta);
    vec2 direccion = largoA > 1e-5 ? delta / largoA : vec2(0.0, 1.0);

    // A velocidad cero el trazo se hace más corto que ancho: lo frenamos
    // ahí para que siga siendo un puntito redondo y no desaparezca.
    largoA = max(largoA, anchoA);
    aCola = aCabeza - direccion * largoA;

    vec2 normal = vec2(-direccion.y, direccion.x);
    vec2 aPos = mix(aCola, aCabeza, uv.y) + normal * position.x * anchoA;

    float centelleo = 0.72 + 0.28 * sin(uTiempo * 2.3 + aSemilla.x * 7.0 + aSemilla.y * 3.0);

    vBrillo = (0.35 + aEscala) * centelleo
            * smoothstep(9.0, 36.0, distancia)                      // no brota encima
            * smoothstep(uProfundidad, uProfundidad * 0.45, distancia); // se apaga al fondo

    // z = 0 porque las estrellas no usan test de profundidad: el orden lo
    // decide renderOrder, y así el anillo siempre las tapa como corresponde.
    gl_Position = vec4(aPos.x / uAspecto, aPos.y, 0.0, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColorFrio;
  uniform vec3 uColorCalido;

  varying vec2  vUv;
  varying float vBrillo;
  varying float vTono;

  void main() {
    float transversal = abs(vUv.x - 0.5) * 2.0;
    float nucleo = pow(max(1.0 - transversal, 0.0), 2.4);
    float aloLargo = pow(vUv.y, 1.5);        // la cola se desvanece

    float a = nucleo * aloLargo * vBrillo;
    if (a < 0.003) discard;

    vec3 col = mix(uColorFrio, uColorCalido, vTono);
    col += vec3(1.0) * pow(nucleo, 6.0) * 0.6;   // el centro tira a blanco

    gl_FragColor = vec4(col, a);
  }
`

export default function Starfield({ movil }) {
  const { est } = useJourney()
  const material = useRef()
  const cantidad = movil ? RENDIMIENTO.estrellasMovil : RENDIMIENTO.estrellasEscritorio

  const geometria = useMemo(() => {
    const plano = new THREE.PlaneGeometry(1, 1)
    const g = new THREE.InstancedBufferGeometry()
    g.index = plano.index
    g.setAttribute('position', plano.attributes.position)
    g.setAttribute('uv', plano.attributes.uv)
    g.instanceCount = cantidad

    const semillas = new Float32Array(cantidad * 3)
    const escalas = new Float32Array(cantidad)
    const tonos = new Float32Array(cantidad)

    for (let i = 0; i < cantidad; i++) {
      // Distribución en disco, más densa en el centro del túnel.
      const angulo = Math.random() * Math.PI * 2
      const radio = 2 + Math.pow(Math.random(), 0.65) * 62

      semillas[i * 3 + 0] = Math.cos(angulo) * radio
      semillas[i * 3 + 1] = Math.sin(angulo) * radio
      semillas[i * 3 + 2] = Math.random() * PROFUNDIDAD

      // Pocas grandes y muchas chicas: así se ve un cielo, no una grilla.
      escalas[i] = Math.pow(Math.random(), 2.6)
      tonos[i] = Math.pow(Math.random(), 2.0) // la mayoría frías, algunas cálidas
    }

    g.setAttribute('aSemilla', new THREE.InstancedBufferAttribute(semillas, 3))
    g.setAttribute('aEscala', new THREE.InstancedBufferAttribute(escalas, 1))
    g.setAttribute('aTono', new THREE.InstancedBufferAttribute(tonos, 1))
    plano.dispose()
    return g
  }, [cantidad])

  const uniforms = useMemo(
    () => ({
      uRecorrido: { value: 0 },
      uVelocidad: { value: 0 },
      uTiempo: { value: 0 },
      uProfundidad: { value: PROFUNDIDAD },
      uAspecto: { value: 1 },
      uPixelNDC: { value: 0.002 },
      uRumbo: { value: new THREE.Vector2() },
      uColorFrio: { value: new THREE.Color('#aecbff') },
      uColorCalido: { value: new THREE.Color('#ffe3b8') },
    }),
    [],
  )

  useFrame((state, dt) => {
    const s = est.current
    const u = uniforms
    u.uRecorrido.value = s.recorrido
    u.uTiempo.value = state.clock.elapsedTime
    u.uAspecto.value = state.size.width / Math.max(state.size.height, 1)
    // Cuánto mide un pixel en NDC: el eje y de NDC va de -1 a 1, o sea 2.
    u.uPixelNDC.value = 2 / Math.max(state.size.height, 1)
    // Suavizado extra: que el estirado no salte si se traba un cuadro.
    u.uVelocidad.value = THREE.MathUtils.damp(
      u.uVelocidad.value,
      s.velocidad,
      7,
      Math.min(dt, 0.05),
    )
    u.uRumbo.value.set(s.rumbo.x, s.rumbo.y)
  })

  return (
    <mesh geometry={geometria} frustumCulled={false} renderOrder={0}>
      <shaderMaterial
        ref={material}
        args={[{ vertexShader, fragmentShader, uniforms }]}
        transparent
        depthTest={false}
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
