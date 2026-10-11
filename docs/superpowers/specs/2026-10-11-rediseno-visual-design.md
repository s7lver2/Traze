# Rediseño visual de Traze: cuaderno de taller

## Objetivo

Que toda la app se vea más visual, suave y pulida, manteniendo la identidad del spec general (un cuaderno dibujado a lápiz, con calma y sin gamificación) y añadiéndole el aire de un taller de arquitecto. Se hace antes de ejecutar el Plan 3, para que las páginas nuevas (mapa, consejos) nazcan ya con este sistema.

Aprobado en conversación el 2026-10-11 a partir de una maqueta. Dirección elegida: papel crema, mesa cálida, esquinas redondeadas, botones de píldora y sombras difusas, con toques sutiles de taller. Se descartó la variante de mesa verde con esquinas rectas.

## Criterios de éxito

1. Portada, lección, reproductor y lienzo comparten un mismo sistema visual, sin estilos sueltos.
2. La lección se ve como la maqueta aprobada: hoja sobre mesa, regla graduada, escuadra, cajetín, índice de pasos en círculos y banda de instrumentos.
3. Se mantienen los requisitos del spec general: botones de al menos 44 px, contraste AA, el color nunca es el único indicador, `prefers-reduced-motion` respetado.
4. Los 40 tests de `apps/web`, `pnpm typecheck` y `pnpm build` siguen pasando. La geometría y el contenido de las lecciones no cambian.
5. Ninguna petición externa en tiempo de ejecución (las fuentes se alojan en el build).

## Fuera de alcance

Sonido, ilustraciones nuevas, modo oscuro, cambios en el contenido de las lecciones y en el motor, y el lienzo de práctica (Plan 4).

## Sistema de diseño

Todo sale de variables CSS en `:root`. Los componentes no usan valores literales.

**Color** (se conservan los actuales y se añaden los de superficie):

| Token | Valor | Uso |
| --- | --- | --- |
| `--papel` | `#f7f0de` | Hoja |
| `--papel-claro` | `#fbf6e8` | Fondo del lienzo |
| `--mesa` | `#e9dfc8` | Fondo de la app |
| `--papel-sombra` | `#e1d6b8` | Líneas finas, hover |
| `--tinta` | `#2b2b2b` | Texto y botón principal |
| `--tinta-suave` | `#5c5648` | Texto secundario |
| `--azul-correccion` | `#2f5d8c` | Acento, notas del profe, foco |
| `--rojo-profe` | `#b3261e` | Solo avisos |
| `--margen` | `#d9a5a0` | Línea de margen de la hoja |
| `--regla` | `rgba(120, 95, 55, 0.55)` | Graduaciones |
| `--exito-suave` | `#dfe8d4` sobre `#3b5a2a` | Paso completado |

Los colores del trazo (`--grafito-*`) no cambian.

**Forma y profundidad:** radios 6 px (cajetín, nota), 10 px (lienzo, banda), 12 px (hoja) y 999 px (botones, pasos). Sombras en capas: `--sombra-hoja` (`0 1px 2px` y `0 12px 28px`, marrón al 12–14 %) y `--sombra-boton` (`0 1px 0`).

**Tipografía:** serif para títulos, rotulación de la hoja y notas (Source Serif 4 con `next/font`, alternativa Georgia); sans del sistema para interfaz y etiquetas; la rotulación técnica solo dentro del dibujo, como ya está. Etiquetas pequeñas en mayúsculas con 0,08 em de espaciado.

**Espacio:** escala de 4 px (4, 8, 12, 16, 24, 32). Una columna de lectura de 72 rem como máximo.

**Movimiento:** transiciones de 150 ms (controles) y 250 ms (paneles) con `cubic-bezier(0.2, 0, 0, 1)`. La entrada de página es un fundido de 200 ms. Con `prefers-reduced-motion: reduce` todo pasa a 0 ms.

## Componentes y pantallas

Cada uno es una clase CSS o un componente pequeño; se reparten en archivos con una sola responsabilidad.

- **Mesa** (`body`): fondo `--mesa` con cuadrícula de 22 px casi invisible.
- **Hoja**: contenedor con sombra, margen rojo tenue a la izquierda y regla graduada superior (solo CSS, sin imágenes). Envuelve el contenido de portada y lección.
- **Cabecera**: logo en cursiva y navegación con la pestaña activa subrayada en azul. Enlaces: Temario, Lecciones, Consejos y Mi carpeta (los de Temario, Consejos y Mi carpeta se activan cuando el Plan 3 cree sus páginas; hasta entonces no se muestran).
- **Cajetín**: tabla de lámina, escala y formato con líneas separadoras, en la cabecera de la lección.
- **Lienzo**: marco de 10 px de radio, fondo `--papel-claro` y escuadra translúcida en la esquina (decorativa, `aria-hidden`).
- **Panel del paso**: etiqueta, título serif, texto, «Por qué» y nota del profe como bloque con banda azul que se despliega con animación.
- **Índice de pasos**: círculos de 30 px (en 44 px de zona táctil); hechos en verde suave, actual en tinta con sombra.
- **Controles**: botones de píldora; solo «Reproducir todo» va relleno (un acento por vista).
- **Banda de instrumentos**: debajo de los controles, con instrumento, lápiz y abertura del paso. Sus tres campos se derivan del dibujo del paso (ver Datos); los que no se pueden deducir se omiten.
- **Portada**: lema, índice de lecciones como fichas dentro de la hoja, agrupadas por bloque.
- **Deslizador del compás**: marco de ficha con pista de 4 px y mando de 22 px.

## Datos

El esquema de lecciones **no** guarda instrumento ni lápiz por paso (comprobado: solo aparecen en el texto libre de los consejos). Para no ampliar el esquema ni tocar el prompt ni las lecciones, la banda se deriva de lo que ya hay:

- **Instrumento:** de las primitivas del dibujo del paso (arcos y circunferencias, compás; rectas y segmentos, regla; puntos, ninguno).
- **Lápiz:** del tipo de trazo del paso (construcción, 2H; resultado, HB; dato, HB), según los consejos de material del spec general.
- **Abertura:** de `leccion.radios` cuando el paso usa un radio declarado, con su factor actual.

La derivación es una función pura con test (`apps/web/src/reproductor/instrumentos.ts`). Si un paso no permite deducir un campo, ese campo no se muestra; si no hay ninguno, no hay banda. El plan debe confirmar los nombres reales de las primitivas del dibujo antes de escribir el test.

## Accesibilidad

- Tamaño mínimo de 44 px en botones y pasos.
- Contraste AA para el texto sobre papel (la combinación `--tinta-suave` sobre `--papel` se mide en el plan).
- El estado del paso no depende solo del color: el actual lleva `aria-current`, los completados un indicador además del tono.
- Foco visible con contorno azul de 3 px.
- Las decoraciones (regla, escuadra, cuadrícula) son `aria-hidden` o fondos CSS.

## Verificación

- `pnpm test`, `pnpm typecheck` y `pnpm build` tras cada tarea.
- Revisión visual en el navegador de portada y `/leccion/mediatriz-segmento` a 1280, 768 y 375 px, con y sin `prefers-reduced-motion`.
- Comprobación de contraste AA de los pares de texto principales.

## Riesgos y orden

- `apps/web/src/app/globals.css` y `tsconfig.json` tienen cambios sin commitear ajenos a este trabajo. Hay que commitearlos o resolverlos antes de empezar el plan.
- La tarea 4 del Plan 2 tiene pendiente su comprobación visual de las etiquetas A, B, M, N y O; se hace con este rediseño.
- Las tareas 12, 13 y 14 del Plan 3 (mapa, consejos, SEO) escriben interfaz: tras este rediseño hay que ajustarlas para que usen estas clases y tokens.
- El filtro SVG de lápiz sobre el trazo no se toca; solo se retoca el marco que lo rodea.
