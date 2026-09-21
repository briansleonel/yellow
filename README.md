# Flores amarillas

Un viaje de un minuto a través de un mar de estrellas que termina en un ramo
de flores amarillas y un poema.

## Correrlo

```bash
npm install
npm run dev
```

Y abrir la dirección que imprime en la terminal.

## Qué editar

**Todo el contenido está en `src/content.js`.** No hace falta tocar ningún otro
archivo para cambiar el regalo:

| Qué | Dónde |
|---|---|
| El nombre, la firma, la inicial, la fecha, las coordenadas | `PERSONA` |
| Lo que dice la portada | `INTRO` |
| Las líneas del poema que pasan volando durante el viaje | `LINEAS_VIAJE` |
| Lo que se lee cuando el ramo termina de abrirse | `LLEGADA` |
| El mensaje final | `MENSAJE_FINAL` |
| Que el viaje dure más o menos | `TIEMPOS` |

Las líneas de `LINEAS_VIAJE` tienen que ser **cortas**: se leen en tres segundos
mientras te pasan al lado. El campo `at` es el segundo exacto en que aparece cada
una, y cada línea vive cinco segundos.

## Publicarlo

```bash
npm run build
```

Queda todo en `dist/`, que es HTML y JS estático: se sube tal cual a Vercel,
Netlify o GitHub Pages sin configurar nada (las rutas ya son relativas).

En Vercel o Netlify se puede arrastrar la carpeta `dist/` directamente a la web
y sale un link en menos de un minuto.

## Cómo está armado

- **`useJourney.js`** — un único reloj maneja todo el viaje. El tiempo exacto
  vive en un `ref` que lee el bucle de render 3D en cada cuadro; sólo la fase y
  un reloj grueso a 10fps se publican como estado de React. Por eso no se
  re-renderiza React sesenta veces por segundo.
- **`scene/Starfield.jsx`** — cada estrella es un cuadrilátero instanciado
  (16.000 en escritorio, 6.000 en celular). El vertex shader lo estira hacia
  atrás según la velocidad: a velocidad cero son puntos, a warp son trazos.
- **`scene/Wormhole.jsx`** — el disco oscuro con el anillo de luz. No se mueve:
  crece exponencialmente, que es lo que hace sentir que uno se acerca a algo
  enorme en vez de que una figura se agranda.
- **`ui/Bouquet.jsx`** — el ramo es SVG, no 3D. Queda más cálido, pesa nada y
  en el celular vuela.
- **`audio/useAmbient.js`** — el sonido está generado con osciladores, sin
  archivos ni derechos de autor. Durante el viaje suena un acorde abierto sin
  tercera; al llegar, la voz de arriba se desliza y el acorde se vuelve mayor
  justo cuando las flores se abren.
