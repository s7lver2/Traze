# Plan 3: temario, mapa, consejos y SEO (implementación)

Oct 11, 2026 · @s7lver

> **Para el agente que ejecuta este plan:** este plan lo ejecuta UN SOLO agente, de forma lineal, tarea por tarea y paso por paso, en el orden en que está escrito, SIN delegar en subagentes. No uses `superpowers:subagent-driven-development`. Si necesitas una guía de ejecución, usa `superpowers:executing-plans` en esta misma sesión. Los pasos usan casillas (`- [ ]`) para el seguimiento: marca cada una al terminarla. Todo el código está completo: cópialo tal cual. Si un comando no da el resultado esperado, DETENTE y cuéntalo; no improvises arreglos.
>
> **Paradas con revisión humana.** Los lotes C (Tarea 8) y D (Tarea 9) generan lecciones de tangencias y de diédrico que debe revisar una persona. El agente NUNCA ejecuta `pnpm revisar` en nombre de nadie: al llegar a un paso marcado «PARADA», termina de confirmar lo que haya y AVISA AL USUARIO con el texto indicado en ese paso; no sigue con la tarea siguiente hasta que el usuario conteste. Si el usuario responde que continúe sin revisar, el plan sigue y esas lecciones quedan pendientes (el estado se ve en la Tarea 15).

Objetivo: dejar publicadas en Traze las 22 lecciones del temario (las 2 que ya existen y 20 nuevas), generadas con el pipeline del Plan 2, con el vocabulario ampliado que piden (tangencias, diédrico...), un mapa del temario con progreso «vista», una biblioteca de consejos con buscador y el SEO de cada página.

Arquitectura: primero se amplía el vocabulario declarativo (esquema Zod, intérprete, comprobaciones, catálogo del prompt) con lo mínimo que necesitan las lecciones nuevas, siempre con tests numéricos. Después un único archivo de datos, `temario/temario.json`, fija las 22 lecciones (orden, bloque, requisitos, encargo para Claude y tipos de comprobación que cada una debe llevar) y un comando `pnpm temario` lo cruza con `contenido/`. Las lecciones se generan por lotes con `pnpm comprobar` y `pnpm promover`. Por último, la web añade mapa, biblioteca de consejos y metadatos SEO, todo estático, sin dependencias nuevas, sobre el sistema visual ya implantado en `apps/web` («cuaderno de taller»: tokens CSS, `.pagina`/`.hoja`, fichas, post-its y escenario de la lección; estilos en `apps/web/src/estilos/`).

Stack: el del Plan 1 y el Plan 2 (TypeScript estricto, pnpm 9, Node 20, Vitest 2, Zod 3, tsx, Next.js 15 con React 19, SVG). No se añade ninguna dependencia.

Spec: `docs/Spec web para aprender Dibujo Técnico (1º Bachillerato).md`

Requisito previo (estado real del repositorio al revisar este plan; la Tarea 0 lo comprueba):

- Plan 1 ejecutado y rediseño visual («Plan_Rediseno_visual») ejecutado y confirmado: `apps/web` ya no tiene `globals.css`; los estilos viven en `apps/web/src/estilos/` (`tokens`, `base`, `hoja`, `cabecera`, `escenario`, `lienzo`, `panel`, `controles`, `deslizador`, `leccion`, `portada`), importados desde `apps/web/src/app/layout.tsx`.
- Plan 2 ejecutado hasta la Tarea 9 (queda solo su Tarea 10, la prueba real). Existen `pnpm validar`, `prompt`, `comprobar`, `promover`, `revisar` y `estado`, la carpeta `generacion/` (`LEEME.md`, `prompt-leccion.md`, `skill/dibujo-tecnico/SKILL.md`, `borradores/`) y en `packages/lecciones/src/` los módulos `almacen`, `borrador`, `estado`, `extraer`, `promover`, `prompt`, `render`, `revisar`, `rotulos` y `vocabulario`. La suite de partida: 101 tests en `packages/lecciones`, 172 en `apps/web`, todo en verde.
- `contenido/` tiene hoy DOS lecciones, no una: `bloque-1-trazados/mediatriz-segmento.json` (la piloto) y `bloque-1-trazados/dividir-segmento-dos-partes.json` (resultado de la prueba real del Plan 2, aún sin confirmar en git). Este plan incorpora la segunda al temario (Tarea 5) para que el build de la web no falle por «lección que no figura en el temario».
- Hay otros ficheros sin confirmar (`docs/Plan_*.md` y el spec en `docs/`): este plan NO los confirma. Cada commit usa `git add` con rutas explícitas.

## Global Constraints

Cada tarea las cumple además de sus propios requisitos. Los valores salen tal cual del spec y de los planes 1 y 2.

- «Exactitud geométrica: todo se calcula con geometría real, nunca a ojo. Un trazado incorrecto es peor que ninguno.»
- Demostración animada: «6-10 pasos». «Si pasa de 10 pasos se divide en dos.»
- Las lecciones son datos JSON en el repositorio: «un archivo declarativo por lección que el motor interpreta». La IA describe construcciones, nunca coordenadas calculadas.
- Tests numéricos obligatorios por lección, con tolerancia 1e-6. Las comprobaciones nunca se debilitan para que una lección pase.
- Coordenadas en milímetros de papel; lienzo por defecto de 210 × 140 mm.
- «Cada consejo cabe en dos líneas» (máximo 160 caracteres en este plan).
- «Idioma: español de España».
- «Progreso: `localStorage`», «sin cuentas ni servidor de usuarios». «Sin publicidad y sin rastreo de terceros.»
- «Calma de cuaderno: sin gamificación ruidosa.» El progreso se muestra como un cuaderno que se va llenando; sin rachas ni puntos.
- Accesibilidad: contraste mínimo AA, navegación completa con teclado, botones de al menos 44 px de alto y respeto de `prefers-reduced-motion`.
- «Lecciones en SVG ligero, sin librerías pesadas»: el código del navegador no importa Zod (los módulos del cliente usan subrutas del paquete sin dependencias).
- SEO: «una URL por lección con título y descripción propios» y «los pasos escritos en HTML».
- Solo los archivos `*-cli.ts` y `almacen.ts` del paquete `lecciones` tocan el sistema de archivos; la web los lee solo en el servidor (build).
- Las lecciones se etiquetan con su bloque oficial para poder reordenarlas o regenerarlas cuando se confirme el currículo de Castilla y León.
- Interfaz (todas las tareas de `apps/web`): se usa el sistema visual existente. Cada página nueva envuelve su contenido en `<div className="pagina"><div className="hoja">…</div></div>` (el `<main>` del layout no lleva hoja). Los estilos nuevos van en un fichero de `apps/web/src/estilos/` importado desde `apps/web/src/app/layout.tsx` (después de `portada.css`), nunca en un `globals.css` (ya no existe). Solo se usan variables de `tokens.css` (`var(--papel-claro)`, `var(--e3)`, `var(--radio-medio)`…): `test/tokens.test.ts` falla con cualquier `#hex`, `rgb()` o `rgba()` fuera de `tokens.css`. Si una tarea necesita un color nuevo, se añade como variable a `tokens.css` y a la lista `NECESARIOS` de `test/tokens.test.ts`; si usa un par texto/fondo nuevo, se añade a `PARES` de `test/contraste.test.ts` (AA, 4,5:1) en la misma tarea.
- Interfaz, accesibilidad: todo elemento interactivo mide al menos 44 px de alto (`min-height: 44px`); el enlace de la sección actual lleva `aria-current="page"` (ya lo hace `Cabecera` con `esActivo`); el foco visible lo da `base.css` (no lo quites); el estado no depende solo del color (los sellos llevan texto); con `prefers-reduced-motion` las duraciones salen de los tokens `--t-*`. Se reutilizan las clases existentes: `.ficha`/`.fichas`/`.bloque` (portada), `.boton`/`.boton-principal`/`.campo`/`.selector` (controles), `.postit` (notas), `.etiqueta`, `.cajetin`.
- Comprobación por tarea de código: `pnpm test`, `pnpm typecheck` y, si se toca `apps/web`, `pnpm --filter @traze/web build` en verde antes de confirmar.

## Review Focus

Entradas o condiciones que el spec da por supuestas y que ninguna tarea probaría por defecto. Cada línea tiene su test en la tarea que se indica.

1. Un trazo tangente exacto (por ejemplo, una recta que toca justo a un arco): debe dar `ConstruccionImposible`, nunca un punto duplicado ni `NaN`. Test en la Tarea 2.
2. Un derivado que reutiliza el id de un dato o de otro derivado: debe rechazarse en la validación, no sobrescribir el punto en silencio. Test en la Tarea 1.
3. Un arco entre dos puntos diametralmente opuestos (media circunferencia): es ambiguo y debe pedir `pasaPor`, no elegir un lado al azar. Test en la Tarea 3.
4. `localStorage` vacío, con JSON corrupto o inaccesible (navegación privada): el mapa debe mostrarse igual, sin errores. Tests en la Tarea 11.
5. Buscar «aurea», «ÁUREA» o «seccion aurea» en la biblioteca de consejos: debe encontrar lo mismo que «sección áurea». Test en la Tarea 10.

---

## Alcance y decisiones fijadas

| Cubre este plan | Queda para los planes siguientes |
| --- | --- |
| Las 22 lecciones del temario (2 ya existentes y 20 nuevas) generadas con el pipeline del Plan 2, en cuatro lotes, con revisión humana prioritaria de tangencias y diédrico | Puntos arrastrables y lienzo de práctica con corrección (Plan 4 y siguientes), pasos «practicada» y «dominada» |
| Ampliación del vocabulario (derivados, arco entre puntos y ocho comprobaciones nuevas) para esas lecciones | PWA, auditorías (accesibilidad, rendimiento), texto alternativo del dibujo y lanzamiento (Plan 4) |
| `temario/temario.json`, `pnpm temario` y comprobación cruzada con `contenido/` | Lecciones restantes del spec (bloques 8 y 9, láminas de síntesis, el resto de lecciones de cada bloque) |
| Mapa del temario con estado «vista» en `localStorage`, navegación anterior/siguiente y requisitos en cada lección | Ruta de examen, repaso espaciado, modo examen, exportación e importación del cuaderno |
| Biblioteca de consejos con buscador y lista de comprobación de lámina | Modo «ojo de profe» (necesita el lienzo de práctica) |
| SEO: título y descripción propios, canonical, Open Graph, datos estructurados HowTo, sitemap y robots | Elegir hosting y dominio definitivo |

Cobertura del spec:

| Requisito del spec | Dónde se cumple |
| --- | --- |
| «Todo el temario de 1º en una ruta ordenada» (sección Temario y rutas) | Tarea 5 (`temario.json`, ruta por defecto y requisitos), Tareas 6 a 9 (20 lecciones nuevas), Tarea 12 (mapa) |
| Cada lección declara sus requisitos para sugerir un repaso | Tarea 12: «Si te atascas, repasa» en cada lección |
| Generación con IA: tests numéricos, render, revisión humana prioritaria, versionado | Tareas 1 a 4 (comprobaciones), Tareas 6 a 9 (lotes), Tarea 5 (`comprobarRevision`) |
| Mapa del temario con estado por lección (vista) | Tareas 11 y 12 |
| Biblioteca de consejos consultable por tema, con buscador | Tareas 10 y 13 |
| Consejos de oficio: material, técnica, precisión, limpieza, atajo mental, error típico | Tarea 10 (consejos generales con tipo) y consejos de cada paso (ya en las lecciones) |
| Lista de comprobación final por lámina | Tarea 10 (datos) y Tarea 13 (página) |
| SEO: una URL por lección, título y descripción propios, pasos en HTML | Tarea 14 |
| Cada lección guarda su versión | Ya cumplido por el Plan 2; este plan lo usa al promover |

Decisiones fijadas para todo el plan (las marcadas con ⚠ no las define el spec y conviene revisarlas):

- ⚠ Las 22 lecciones no están enumeradas en el spec (que habla de unas 60). Esta es la lista elegida: bloque 0 (1), bloque 1 (7, incluida `dividir-segmento-dos-partes`, que ya existía), bloque 2 (3), bloque 3 (3), bloque 4 (2), bloque 5 (3), bloque 6 (1), bloque 7 (2). Quedan fuera los bloques 8 y 9, las láminas de síntesis y el resto de trazados de cada bloque. La lista completa está en la Tarea 5.
- ⚠ Del bloque 0 solo entra el uso del compás. Material, tipos de línea y rotulación no son un trazado: se cubren con la biblioteca de consejos (Tarea 10).
- Solo se amplía el vocabulario que piden estas lecciones. Si Claude responde `VOCABULARIO_INSUFICIENTE` durante un lote, se amplía con el procedimiento de `generacion/LEEME.md` (esquema, intérprete, vocabulario, `pnpm prompt`, con tests) en un commit propio y se retoma el lote. Nunca se resuelve cambiando una comprobación.
- Todo lo que una lección calcula sigue siendo geometría exacta del motor. Los puntos nuevos se obtienen de los mismos cuatro cálculos de siempre: distancias, intersecciones recta-recta, recta-arco y arco-arco.
- Los radios pueden ser fijos en milímetros (`{ "mm": 30 }`) o definirse a partir de puntos ya calculados (derivado `radio`). El deslizador del compás pasa a ser opcional: solo aparece si el radio lleva `deslizador` (las dos lecciones que ya existen lo reciben). Con 22 lecciones, un deslizador universal con rango 0,3 a 0,85 dejaría de tener sentido.
- Un derivado nunca puede reutilizar el id de otro punto ni de otro radio.
- Orden de los cortes: `interseccionArcos` y `cortesCirculos` devuelven primero el corte que queda a la izquierda al mirar del primer centro al segundo en pantalla; `interseccionRectaArco` los devuelve en el orden en que se recorre la recta de su primer a su segundo punto. Es una convención determinista; el validador y la revisión humana detectan si una lección eligió el corte equivocado.
- Un arco entre dos puntos (`arcoEntre`) elige por defecto el arco corto; para elegir el otro, y en las medias circunferencias, se indica con `pasaPor` un punto del arco deseado.
- ⚠ `temario/temario.json` vive fuera de `contenido/` (cada `.json` de `contenido/` se trata como lección). Cada entrada lleva `exige`: los tipos de comprobación que la lección debe contener. `pnpm temario` y el build de la web fallan si una lección publicada no cumple su entrada; así una IA no puede entregar una lección con las comprobaciones «aligeradas».
- ⚠ Regla de publicación: se puede desplegar cuando `pnpm temario --publicable` pasa: las 22 lecciones existen, todas las de los bloques 5 y 7 están revisadas por una persona y, en los demás bloques, al menos una de cada tres. El spec deja sin decidir quién revisa; este plan solo fija la regla y el comando. El agente que ejecuta el plan nunca ejecuta `pnpm revisar` en nombre de nadie.
- El progreso es solo «vista» (se marca al llegar al último paso o al pulsar «Ver solución completa»). Los estados «practicada» y «dominada» existen en el tipo pero no se escriben hasta que haya lienzo de práctica.
- ⚠ Los consejos de cada paso (`consejo`) no llevan tipo: aparecen en la biblioteca bajo el bloque de su lección. Los 17 consejos generales sí llevan tipo (los seis del spec). No se toca el esquema de la lección ni el prompt para esto.
- ⚠ Título SEO: `«<título>»: trazado paso a paso` y descripción: enunciado más idea clave, recortada a 155 caracteres. No reproduce literalmente «Cómo trazar la mediatriz de un segmento paso a paso» del spec, porque requeriría un campo nuevo por lección.
- La dirección pública del sitio sale de `NEXT_PUBLIC_SITE_URL` (hosting sin decidir). Por defecto `http://localhost:3000`; hay que definirla en el build de producción.
- Los módulos de `packages/lecciones` que usa el navegador (`rotulos`, `consejos-busqueda`) no importan Zod. La web los importa por subruta.
- Todos los números de test de este plan son relativos («los N tests nuevos»). El total depende del estado exacto tras el Plan 2.

## Mapa de archivos

| Archivo | Responsabilidad | Tarea |
| --- | --- | --- |
| `packages/lecciones/src/esquema.ts` (modificar) | Radios absolutos, derivado `radio`, derivados nuevos, primitiva `arcoEntre` y comprobaciones nuevas | 1 a 4 |
| `packages/lecciones/src/interpretar.ts` (modificar) | Resuelve los derivados, `arcoEntre` y ejecuta las comprobaciones nuevas | 1 a 4 |
| `packages/lecciones/src/procesar.ts` (modificar) | Pasa los radios a las comprobaciones | 4 |
| `packages/lecciones/src/vocabulario.ts` (modificar) | Catálogo ampliado (el test de sincronía obliga) | 1 a 4 |
| `contenido/bloque-1-trazados/mediatriz-segmento.json`, `dividir-segmento-dos-partes.json` (modificar) | Las dos lecciones existentes declaran su deslizador | 1 |
| `apps/web/src/reproductor/instrumentos.ts`, `apps/web/test/instrumentos.test.ts` (modificar) | La banda de instrumentos entiende radios fijos (`mm`) | 1 |
| `apps/web/src/componentes/Reproductor.tsx` (modificar) | Deslizador del post-it `.postit-datos` solo para radios con `deslizador`; marca «vista» | 1 y 11 |
| `temario/temario.json` | Las 22 lecciones: orden, bloque, requisitos, encargo y comprobaciones exigidas | 5 |
| `packages/lecciones/src/temario.ts` | Esquema del temario, cobertura, encargos, agrupación por bloques, vecinas y regla de revisión | 5 |
| `packages/lecciones/src/temario-cli.ts` | Comando `pnpm temario` | 5 |
| `generacion/LEEME.md` (modificar) | Flujo por temario y guía de revisión | 5 |
| `contenido/bloque-N-*/<id>.json` | Las 20 lecciones nuevas, generadas y promovidas por lotes | 6 a 9 |
| `consejos/generales.json` | 17 consejos de oficio con tipo y lista de comprobación de lámina | 10 |
| `packages/lecciones/src/consejos-busqueda.ts` | Tipos, normalización y búsqueda de consejos (sin dependencias) | 10 |
| `packages/lecciones/src/consejos.ts` | Esquema de los consejos generales y reunión con los de las lecciones | 10 |
| `apps/web/src/progreso.ts` | Funciones puras del progreso del alumno | 11 |
| `apps/web/src/progreso-navegador.ts` | Lectura y escritura en `localStorage`, tolerante a fallos | 11 |
| `apps/web/src/temario.ts` | Carga y valida el temario en el servidor | 12 |
| `apps/web/src/componentes/MapaTemario.tsx`, `apps/web/src/app/temario/page.tsx` | Mapa del temario (sobre `.pagina` / `.hoja`) | 12 |
| `apps/web/src/estilos/temario.css` | Estilos del mapa y de la navegación entre lecciones, con tokens | 12 |
| `apps/web/src/estilos/controles.css`, `apps/web/src/estilos/portada.css` (modificar) | Enlaces con aspecto de botón; fila de acciones de la portada | 12 |
| `apps/web/src/navegacion.ts`, `apps/web/test/navegacion.test.ts` (modificar) | Activa «Temario» y «Consejos» en la cabecera (`aria-current`) | 12 y 13 |
| `apps/web/src/app/page.tsx`, `app/layout.tsx`, `app/leccion/[id]/page.tsx` (modificar) | Portada con «Empezar»; importación de los CSS nuevos; requisitos y lección anterior/siguiente en la hoja bajo el escenario | 12 |
| `apps/web/src/consejos.ts`, `componentes/BibliotecaConsejos.tsx`, `app/consejos/page.tsx`, `estilos/consejos.css` | Biblioteca de consejos | 13 |
| `apps/web/src/seo.ts`, `app/sitemap.ts`, `app/robots.ts` | SEO | 14 |

Los tests nuevos viven en `packages/lecciones/test/` y `apps/web/test/`.

---

## Tarea 0: precondición y línea base

Archivos: ninguno. No se confirma nada en esta tarea.

- [ ] Paso 1: comprobar el estado de partida

```bash
git status --short
pnpm test
pnpm typecheck
pnpm validar
pnpm --filter @traze/web build
```

Esperado: `git status --short` solo lista `contenido/bloque-1-trazados/dividir-segmento-dos-partes.json` y ficheros de `docs/` sin seguimiento (no los toques); `pnpm test` y `pnpm typecheck` en verde (101 tests en `packages/lecciones` y 172 en `apps/web`, o más); `pnpm validar` termina con `Lecciones válidas: 2 de 2`; el build de la web termina sin errores. Si algo falla, DETENTE y cuéntalo.

- [ ] Paso 2: comprobar que el código que este plan da por existente está ahí

```bash
ls apps/web/src/estilos apps/web/src/componentes apps/web/src/reproductor
ls packages/lecciones/src generacion
```

Esperado: `apps/web/src/estilos` contiene `tokens.css`, `base.css`, `hoja.css`, `cabecera.css`, `escenario.css`, `lienzo.css`, `panel.css`, `controles.css`, `deslizador.css`, `leccion.css` y `portada.css` (y no hay `apps/web/src/app/globals.css`); `componentes` contiene `Reproductor.tsx`, `Lienzo.tsx`, `Cabecera.tsx`, `Herramienta.tsx` y `BandaInstrumentos.tsx`; `reproductor` contiene `instrumentos.ts`; `packages/lecciones/src` contiene `almacen.ts`, `estado.ts`, `vocabulario.ts`, `promover.ts` y los `*-cli.ts` de `comprobar`, `promover`, `revisar`, `estado`, `prompt` y `validar`; `generacion` contiene `LEEME.md`, `prompt-leccion.md` y `skill/`.

- [ ] Paso 3: confirmar que nada depende ya de `globals.css`

```bash
grep -rn "globals.css" apps/web/src
```

Esperado: sin resultados. Todos los estilos de este plan irán a `apps/web/src/estilos/`.

## Tarea 1: radios fijos, derivado `radio` y ids que no se pisan

Archivos:

- Modificar: `packages/lecciones/src/esquema.ts`, `packages/lecciones/src/interpretar.ts`, `packages/lecciones/src/vocabulario.ts`
- Modificar: `contenido/bloque-1-trazados/mediatriz-segmento.json`, `contenido/bloque-1-trazados/dividir-segmento-dos-partes.json`
- Modificar: `apps/web/src/componentes/Reproductor.tsx`, `apps/web/src/reproductor/instrumentos.ts`, `apps/web/test/instrumentos.test.ts`
- Regenerar: `generacion/prompt-leccion.md`, `generacion/skill/dibujo-tecnico/SKILL.md`
- Test: `packages/lecciones/test/radios.test.ts`

Interfaces:

- Consume: `leccionSchema`, `derivadoSchema`, `interpretarLeccion(leccion, factores)` y `calcularRadios` del Plan 1 y 2.
- Produce: `Derivado` (tipo exportado); `radios` admite `{ entre, factor, deslizador? }` o `{ mm }` (y `RadioDeclarado` de `apps/web/src/reproductor/instrumentos.ts` pasa a aceptar ambas formas); derivado `{ tipo: 'radio', id, entre: [P, Q], factor }`; la función interna `usoDeDerivado` y el helper `parEn` en `esquema.ts` (las Tareas 2 a 4 los amplían); la función interna `resolverDerivado(derivado, puntos, radios, factores)` en `interpretar.ts` (la Tarea 2 la amplía).

Las demás tareas necesitan radios de tres clases: en milímetros (la abertura es un dato), relativos a dos datos (como el de la mediatriz) y relativos a puntos que la propia construcción calcula (la tangente desde un punto exterior usa el radio entre el punto medio y el centro). Esta tarea también refactoriza la validación y la resolución de derivados a una función por derivado, para que las tareas siguientes solo añadan casos, y cierra el agujero de los ids repetidos.

- [ ] Paso 1: escribir el test que falla

`packages/lecciones/test/radios.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { distancia } from '@traze/geometria';
import dividir from '../../../contenido/bloque-1-trazados/dividir-segmento-dos-partes.json';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import type { Leccion } from '../src/esquema';
import { interpretarLeccion } from '../src/interpretar';
import { validarLeccion } from '../src/validar';

function copia(): any {
  return structuredClone(piloto);
}

function cargar(datos: unknown): Leccion {
  const resultado = validarLeccion(datos);
  if (!resultado.ok) throw new Error(resultado.errores.join('\n'));
  return resultado.leccion;
}

function errores(datos: unknown): string[] {
  const resultado = validarLeccion(datos);
  return resultado.ok ? [] : resultado.errores;
}

describe('radios fijos y deslizador', () => {
  it('acepta un radio fijo en milímetros', () => {
    const datos = copia();
    datos.radios.s = { mm: 30 };
    expect(interpretarLeccion(cargar(datos)).radios.s).toBeCloseTo(30, 9);
  });

  it('rechaza un radio que no es ni relativo ni fijo', () => {
    const datos = copia();
    datos.radios.s = { entre: ['A', 'B'] };
    expect(errores(datos)).toContain('radios.s: un radio lleva «entre» y «factor», o bien «mm»');
  });

  it('rechaza un radio fijo que no es positivo', () => {
    const datos = copia();
    datos.radios.s = { mm: 0 };
    expect(errores(datos).some((e) => e.startsWith('radios.s:'))).toBe(true);
  });

  it('conserva el deslizador de la lección piloto', () => {
    const leccion = cargar(piloto);
    expect(leccion.radios.r).toMatchObject({ deslizador: { min: 0.55, max: 0.85 } });
  });

  it('la otra lección existente también declara su deslizador', () => {
    const leccion = cargar(dividir);
    expect(leccion.radios.r).toMatchObject({ deslizador: { min: 0.55, max: 0.85 } });
  });

  it('todo el rango de los deslizadores da una construcción válida', () => {
    for (const datos of [piloto, dividir]) {
      const leccion = cargar(datos);
      const { min, max } = (leccion.radios.r as { deslizador: { min: number; max: number } }).deslizador;
      for (const factor of [min, (min + max) / 2, max]) {
        expect(() => interpretarLeccion(leccion, { r: factor })).not.toThrow();
      }
    }
  });
});

describe('derivado radio', () => {
  it('define un radio a partir de dos puntos calculados', () => {
    const datos = copia();
    datos.derivados.push({ tipo: 'radio', id: 't', entre: ['M', 'N'], factor: 0.5 });
    const resuelta = interpretarLeccion(cargar(datos));
    expect(resuelta.radios.t).toBeCloseTo(0.5 * distancia(resuelta.puntos.M, resuelta.puntos.N), 9);
  });

  it('aplica el factor del deslizador también a un radio derivado', () => {
    const datos = copia();
    datos.derivados.push({ tipo: 'radio', id: 't', entre: ['M', 'N'], factor: 0.5 });
    const resuelta = interpretarLeccion(cargar(datos), { t: 1 });
    expect(resuelta.radios.t).toBeCloseTo(distancia(resuelta.puntos.M, resuelta.puntos.N), 9);
  });

  it('no deja usar un radio antes de definirlo', () => {
    const datos = copia();
    datos.derivados.unshift({ tipo: 'interseccionArcos', ids: ['P', 'Q'], centros: ['A', 'B'], radio: 't' });
    datos.derivados.push({ tipo: 'radio', id: 't', entre: ['A', 'B'], factor: 0.75 });
    expect(errores(datos)).toContain('derivados.0.radio: El radio «t» no está definido');
  });
});

describe('ids que no se pisan', () => {
  it('rechaza un radio derivado con el id de otro radio', () => {
    const datos = copia();
    datos.derivados.push({ tipo: 'radio', id: 'r', entre: ['M', 'N'], factor: 0.5 });
    expect(errores(datos)).toContain('derivados.2.id: El radio «r» ya está definido');
  });

  it('rechaza un derivado que sobrescribe un dato', () => {
    const datos = copia();
    datos.derivados.push({ tipo: 'puntoMedio', id: 'A', entre: ['A', 'B'] });
    expect(errores(datos)).toContain('derivados.2: El punto «A» ya está definido');
  });

  it('rechaza un derivado que repite otro derivado', () => {
    const datos = copia();
    datos.derivados.push({ tipo: 'puntoMedio', id: 'M', entre: ['A', 'B'] });
    expect(errores(datos)).toContain('derivados.2: El punto «M» ya está definido');
  });
});
```

- [ ] Paso 2: ejecutar el test y comprobar que falla

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: los 12 tests de `radios.test.ts` FALLAN (los radios `mm` y el derivado `radio` aún no existen; los de «deslizador» fallan porque las dos lecciones todavía no lo traen); el resto sigue pasando.

- [ ] Paso 3: el esquema de radios y el derivado `radio`

En `packages/lecciones/src/esquema.ts`, justo antes de `export const derivadoSchema`, inserta:

```ts
const radioSchema = z.union(
  [
    z.object({
      entre: parDeIds,
      factor: z.number().positive(),
      deslizador: z
        .object({ min: z.number().positive(), max: z.number().positive() })
        .optional(),
    }),
    z.object({ mm: z.number().positive() }),
  ],
  { errorMap: () => ({ message: 'un radio lleva «entre» y «factor», o bien «mm»' }) },
);
```

Antes:

```ts
  z.object({ tipo: z.literal('interseccionArcos'), ids: parDeIds, centros: parDeIds, radio: id }),
]);
```

Después:

```ts
  z.object({ tipo: z.literal('interseccionArcos'), ids: parDeIds, centros: parDeIds, radio: id }),
  z.object({ tipo: z.literal('radio'), id, entre: parDeIds, factor: z.number().positive() }),
]);
```

Antes:

```ts
export type Paso = z.infer<typeof pasoSchema>;
```

Después:

```ts
export type Paso = z.infer<typeof pasoSchema>;
export type Derivado = z.infer<typeof derivadoSchema>;
```

En el esquema de la lección.

Antes:

```ts
    radios: z.record(id, z.object({ entre: parDeIds, factor: z.number().positive() })).default({}),
```

Después:

```ts
    radios: z.record(id, radioSchema).default({}),
```

- [ ] Paso 4: validar un derivado por función

En el mismo archivo, justo antes de `export const metaSchema`, inserta:

```ts
const parEn = (base: Ruta, nombres: readonly [string, string]): Referencia[] => [
  { ruta: [...base, 0], nombre: nombres[0] },
  { ruta: [...base, 1], nombre: nombres[1] },
];

interface UsoDeDerivado {
  puntos: Referencia[];
  radios: Referencia[];
  crea: string[];
  creaRadio?: string;
}

function usoDeDerivado(derivado: Derivado): UsoDeDerivado {
  switch (derivado.tipo) {
    case 'puntoMedio':
      return { puntos: parEn(['entre'], derivado.entre), radios: [], crea: [derivado.id] };
    case 'interseccionArcos':
      return {
        puntos: parEn(['centros'], derivado.centros),
        radios: [{ ruta: ['radio'], nombre: derivado.radio }],
        crea: [...derivado.ids],
      };
    case 'radio':
      return {
        puntos: parEn(['entre'], derivado.entre),
        radios: [],
        crea: [],
        creaRadio: derivado.id,
      };
  }
}
```

Sustituye el cuerpo de `superRefine` de la lección desde `const datos = new Set(...)` hasta el cierre del bucle de los derivados.

Antes:

```ts
    const datos = new Set(Object.keys(leccion.datos));
    const radios = new Set(Object.keys(leccion.radios));

    for (const [idRadio, radio] of Object.entries(leccion.radios)) {
      radio.entre.forEach((nombre, i) =>
        falta(['radios', idRadio, 'entre', i], 'El punto', nombre, datos),
      );
    }

    const definidos = new Set(datos);
    leccion.derivados.forEach((derivado, i) => {
      if (derivado.tipo === 'puntoMedio') {
        derivado.entre.forEach((nombre, j) =>
          falta(['derivados', i, 'entre', j], 'El punto', nombre, definidos),
        );
        definidos.add(derivado.id);
      } else {
        derivado.centros.forEach((nombre, j) =>
          falta(['derivados', i, 'centros', j], 'El punto', nombre, definidos),
        );
        falta(['derivados', i, 'radio'], 'El radio', derivado.radio, radios);
        derivado.ids.forEach((nombre) => definidos.add(nombre));
      }
    });
```

Después:

```ts
    const datos = new Set(Object.keys(leccion.datos));
    const radios = new Set(Object.keys(leccion.radios));

    for (const [idRadio, radio] of Object.entries(leccion.radios)) {
      if ('entre' in radio) {
        radio.entre.forEach((nombre, i) =>
          falta(['radios', idRadio, 'entre', i], 'El punto', nombre, datos),
        );
      }
    }

    const definidos = new Set(datos);
    leccion.derivados.forEach((derivado, i) => {
      const uso = usoDeDerivado(derivado);
      for (const ref of uso.puntos) {
        falta(['derivados', i, ...ref.ruta], 'El punto', ref.nombre, definidos);
      }
      for (const ref of uso.radios) {
        falta(['derivados', i, ...ref.ruta], 'El radio', ref.nombre, radios);
      }
      for (const nombre of uso.crea) {
        if (definidos.has(nombre)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['derivados', i],
            message: `El punto «${nombre}» ya está definido`,
          });
        }
        definidos.add(nombre);
      }
      if (uso.creaRadio !== undefined) {
        if (radios.has(uso.creaRadio)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['derivados', i, 'id'],
            message: `El radio «${uso.creaRadio}» ya está definido`,
          });
        }
        radios.add(uso.creaRadio);
      }
    });
```

El bucle de los pasos y el de las comprobaciones que vienen después no cambian: siguen usando `definidos` y `radios`, que ahora incluyen lo que crean los derivados.

- [ ] Paso 5: el intérprete resuelve radios fijos y el derivado `radio`

En `packages/lecciones/src/interpretar.ts`.

Antes:

```ts
import type { Estilo, Leccion, Primitiva } from './esquema';
```

Después:

```ts
import type { Derivado, Estilo, Leccion, Primitiva } from './esquema';
```

Sustituye `calcularRadios` entera.

Antes:

```ts
  const radios: Record<string, number> = {};
  for (const [id, definicion] of Object.entries(leccion.radios)) {
    const [nombreA, nombreB] = definicion.entre;
```

Después:

```ts
  const radios: Record<string, number> = {};
  for (const [id, definicion] of Object.entries(leccion.radios)) {
    if ('mm' in definicion) {
      radios[id] = definicion.mm;
      continue;
    }
    const [nombreA, nombreB] = definicion.entre;
```

El resto de `calcularRadios` queda igual.

Justo antes de `export function interpretarLeccion`, inserta:

```ts
function resolverDerivado(
  derivado: Derivado,
  puntos: Record<string, Punto>,
  radios: Record<string, number>,
  factores: Readonly<Record<string, number>>,
): void {
  switch (derivado.tipo) {
    case 'puntoMedio': {
      const [nombreA, nombreB] = derivado.entre;
      puntos[derivado.id] = puntoMedio(obtener(puntos, nombreA), obtener(puntos, nombreB));
      return;
    }
    case 'interseccionArcos': {
      const [nombreA, nombreB] = derivado.centros;
      const radio = obtenerRadio(radios, derivado.radio);
      const cortes = interseccionCircunferencias(
        { centro: obtener(puntos, nombreA), radio },
        { centro: obtener(puntos, nombreB), radio },
      );
      const mensaje =
        `Los arcos con centro en «${nombreA}» y «${nombreB}» y radio «${derivado.radio}» no se cortan: ` +
        'el radio debe ser mayor que la mitad de la distancia entre los centros';
      if (!cortes) throw new ConstruccionImposible(mensaje);
      const [primero, segundo] = cortes;
      if (distancia(primero, segundo) < EPS) throw new ConstruccionImposible(mensaje);
      puntos[derivado.ids[0]] = primero;
      puntos[derivado.ids[1]] = segundo;
      return;
    }
    case 'radio': {
      const [nombreA, nombreB] = derivado.entre;
      const factor = Object.hasOwn(factores, derivado.id) ? factores[derivado.id] : derivado.factor;
      const radio = factor * distancia(obtener(puntos, nombreA), obtener(puntos, nombreB));
      if (!(radio > EPS)) {
        throw new ConstruccionImposible(`El radio «${derivado.id}» no es positivo`);
      }
      radios[derivado.id] = radio;
      return;
    }
  }
}
```

En `interpretarLeccion`, sustituye el bucle de los derivados (desde `for (const derivado of leccion.derivados) {` hasta su llave de cierre, justo antes de `const pasos`).

Después:

```ts
  for (const derivado of leccion.derivados) {
    resolverDerivado(derivado, puntos, radios, factores);
  }
```

- [ ] Paso 6: las dos lecciones existentes declaran su deslizador

El rango empieza en 0,55 y no en 0,3 porque la construcción exige un radio mayor que la mitad de AB (con 0,5 × AB los arcos son tangentes y con menos no se cortan); así todo el rango da una construcción válida, que es la regla del vocabulario.

En `contenido/bloque-1-trazados/mediatriz-segmento.json`.

Antes:

```json
  "radios": { "r": { "entre": ["A", "B"], "factor": 0.75 } },
```

Después:

```json
  "radios": {
    "r": { "entre": ["A", "B"], "factor": 0.75, "deslizador": { "min": 0.55, "max": 0.85 } }
  },
```

En `contenido/bloque-1-trazados/dividir-segmento-dos-partes.json` (este archivo está escrito con una cifra por línea).

Antes:

```json
  "radios": {
    "r": {
      "entre": [
        "A",
        "B"
      ],
      "factor": 0.6
    }
  },
```

Después:

```json
  "radios": {
    "r": {
      "entre": [
        "A",
        "B"
      ],
      "factor": 0.6,
      "deslizador": {
        "min": 0.55,
        "max": 0.85
      }
    }
  },
```

Son las dos únicas ediciones a mano de lecciones en `contenido/` que permite este plan: cambian el formato del deslizador, no la construcción ni la versión.

- [ ] Paso 7: el reproductor solo muestra el deslizador de los radios con `deslizador`

El deslizador del compás vive en el post-it `.postit-datos` («Prueba otros datos») del reproductor. Sus estilos (`deslizador.css`, `escenario.css`) no cambian: solo cambia cuándo aparece y qué rango tiene.

En `apps/web/src/componentes/Reproductor.tsx`.

Antes:

```tsx
const FACTOR_MIN = 0.3;
const FACTOR_MAX = 0.85;
const MAX_SALTO_MS = 100;
```

Después:

```tsx
const MAX_SALTO_MS = 100;
```

Antes:

```tsx
  const [factores, setFactores] = useState<Record<string, number>>(() =>
    Object.fromEntries(Object.entries(leccion.radios).map(([id, radio]) => [id, radio.factor])),
  );
```

Después:

```tsx
  const [factores, setFactores] = useState<Record<string, number>>(() => {
    const iniciales: Record<string, number> = {};
    for (const [id, radio] of Object.entries(leccion.radios)) {
      if ('factor' in radio) iniciales[id] = radio.factor;
    }
    return iniciales;
  });
  const deslizadores = Object.entries(leccion.radios).flatMap(([id, radio]) =>
    'deslizador' in radio && radio.deslizador
      ? [{ id, entre: radio.entre, min: radio.deslizador.min, max: radio.deslizador.max }]
      : [],
  );
```

Antes:

```tsx
        {Object.keys(leccion.radios).length > 0 && (
          <aside className="postit postit-datos datos-modificables">
            <h3>Prueba otros datos</h3>
            {Object.entries(leccion.radios).map(([id, radio]) => (
              <label key={id} className="deslizador">
                <span>
                  Abertura del compás ({id}): {decimal(factores[id], 2)} × {radio.entre.join('')}
                </span>
                <input
                  type="range"
                  min={FACTOR_MIN}
                  max={FACTOR_MAX}
                  step={0.01}
                  value={factores[id]}
                  onChange={(evento) => cambiarFactor(id, Number(evento.target.value))}
                />
              </label>
            ))}
```

Después:

```tsx
        {deslizadores.length > 0 && (
          <aside className="postit postit-datos datos-modificables">
            <h3>Prueba otros datos</h3>
            {deslizadores.map(({ id, entre, min, max }) => (
              <label key={id} className="deslizador">
                <span>
                  Abertura del compás ({id}): {decimal(factores[id], 2)} × {entre.join('')}
                </span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={0.01}
                  value={factores[id]}
                  onChange={(evento) => cambiarFactor(id, Number(evento.target.value))}
                />
              </label>
            ))}
```

El resto del post-it (el aviso `.aviso` con `role="alert"`) no cambia. El `<label>` conserva su `input` de 44 px de alto (`deslizador.css`). La banda de instrumentos del post-it del paso (`derivarBanda(dibujos[estado.paso], vista.radios, leccion.radios, factores)`) sigue recibiendo `leccion.radios`: el paso siguiente la adapta a los radios fijos.

- [ ] Paso 7b: la banda de instrumentos entiende los radios fijos

Con la unión de radios, `RadioDeclarado` ya no puede exigir `entre` y `factor` en todos (el typecheck falla en `Reproductor.tsx`). Un radio fijo se muestra como «30 mm». Los radios que crea un derivado `radio` no están en `leccion.radios`, así que no salen en la banda (el principio del rediseño: lo que no se puede deducir se omite).

En `apps/web/src/reproductor/instrumentos.ts`.

Antes:

```ts
export interface RadioDeclarado {
  entre: readonly [string, string];
  factor: number;
}
```

Después:

```ts
export type RadioDeclarado =
  | { entre: readonly [string, string]; factor: number }
  | { mm: number };
```

Antes:

```ts
    .map((id) => `${decimal(factores[id] ?? radios[id].factor, 2)} × ${radios[id].entre.join('')}`);
```

Después:

```ts
    .map((id) => {
      const radio = radios[id];
      if ('mm' in radio) return `${decimal(radio.mm, 1).replace(/,0$/, '')} mm`;
      return `${decimal(factores[id] ?? radio.factor, 2)} × ${radio.entre.join('')}`;
    });
```

En `apps/web/test/instrumentos.test.ts`, dentro de `describe('aberturaDelPaso', …)`, añade antes del último `it` («solo cuenta los radios que el paso usa»):

```ts
  it('un radio fijo se muestra en milímetros', () => {
    const radios = { f: { mm: 30 } };
    expect(aberturaDelPaso([arco(30)], { f: 30 }, radios, {})).toBe('30 mm');
    expect(aberturaDelPaso([arco(12.5)], { f: 12.5 }, radios, {})).toBe('12,5 mm');
  });

  it('mezcla radios relativos y fijos en el orden en que se declaran', () => {
    const radios = { ...RADIOS, f: { mm: 30 } };
    expect(aberturaDelPaso([arco(53.5), arco(30)], { r: 53.5, f: 30 }, radios, { r: 0.75 })).toBe(
      '0,75 × AB, 30 mm',
    );
  });
```

- [ ] Paso 8: documentar los radios en el vocabulario

En `packages/lecciones/src/vocabulario.ts`, en `CAMPOS_LECCION`.

Antes:

```ts
    descripcion:
      'Aberturas de compás: { "r": { "entre": ["A", "B"], "factor": 0.75 } }. El radio vale factor × distancia(A, B).',
```

Después:

```ts
    descripcion:
      'Aberturas de compás. Relativa a dos datos: { "r": { "entre": ["A", "B"], "factor": 0.75 } }, vale factor × distancia(A, B). Fija: { "s": { "mm": 30 } }. Solo pueden usar puntos de «datos»; para un radio que depende de puntos calculados usa el derivado «radio». Opcional en los relativos: "deslizador": { "min": 0.55, "max": 0.85 }, solo si cualquier valor del rango da una construcción válida (por ejemplo, para cortar dos arcos hace falta un radio mayor que la mitad de la distancia entre los centros).',
```

En `DERIVADOS`, añade al final de la lista (antes del `];`):

```ts
  {
    tipo: 'radio',
    campos: 'id, entre [P, Q], factor',
    descripcion:
      'Define un radio que vale factor × distancia(P, Q), con P y Q ya definidos (datos o derivados anteriores). Úsalo cuando la abertura del compás depende de un punto calculado.',
    ejemplo: { tipo: 'radio', id: 't', entre: ['M', 'N'], factor: 0.5 },
  },
```

- [ ] Paso 9: regenerar el prompt y la skill

Ejecuta: `pnpm prompt`

Esperado: se reescriben `generacion/prompt-leccion.md` y `generacion/skill/dibujo-tecnico/SKILL.md` (llevan el ejemplo piloto y el catálogo nuevos).

- [ ] Paso 10: ejecutar los tests y comprobar que pasan

Ejecuta: `pnpm test` y `pnpm typecheck`

Esperado: los 12 tests nuevos de `radios.test.ts` y los 2 nuevos de `instrumentos.test.ts` pasan y todo lo anterior sigue en verde (las dos lecciones siguen siendo válidas y el test «el prompt está al día» pasa tras `pnpm prompt`). Después ejecuta `pnpm --filter @traze/web build` (sin errores). Con `pnpm web` y en `http://localhost:3000/leccion/mediatriz-segmento`, el post-it «Prueba otros datos» sigue apareciendo con el deslizador de la abertura (rango 0,55 a 0,85, sin avisos al recorrerlo entero); lo mismo en `/leccion/dividir-segmento-dos-partes`.

- [ ] Paso 11: confirmar

```bash
git add packages/lecciones apps/web/src/componentes/Reproductor.tsx apps/web/src/reproductor/instrumentos.ts apps/web/test/instrumentos.test.ts contenido generacion
git commit -m "feat(lecciones): radios fijos, derivado radio y validacion de ids repetidos"
```

## Tarea 2: derivados de puntos para tangencias, proporciones y transformaciones

Archivos:

- Modificar: `packages/lecciones/src/esquema.ts`, `packages/lecciones/src/interpretar.ts`, `packages/lecciones/src/vocabulario.ts`
- Regenerar: `generacion/prompt-leccion.md`, `generacion/skill/dibujo-tecnico/SKILL.md`
- Test: `packages/lecciones/test/derivados.test.ts`

Interfaces:

- Consume: `usoDeDerivado`, `parEn`, `resolverDerivado` y `Derivado` de la Tarea 1; `interseccionRectas`, `interseccionRectaCircunferencia`, `interseccionCircunferencias`, `normalIzquierda` de `@traze/geometria`.
- Produce: siete derivados nuevos: `puntoEnDireccion`, `pie`, `simetrico`, `homotetico`, `interseccionRectas`, `interseccionRectaArco` y `cortesCirculos`.

Con estos siete derivados y los dos que ya existen se construyen las 20 lecciones nuevas: llevar una abertura del compás sobre una recta (`puntoEnDireccion`), paralelas y perpendiculares (también `puntoEnDireccion`, con `perpendicular`), cortes de rectas y arcos, pies de perpendicular, simétricos y homotecias. Ninguno recibe coordenadas: todos describen una construcción.

Convención de cortes (ya vigente en `interseccionArcos`): el primer punto queda a la izquierda al mirar del primer centro al segundo en pantalla (con el eje y hacia abajo, «a la izquierda» de una dirección horizontal hacia la derecha es arriba). En `interseccionRectaArco`, los puntos salen en el orden en que se recorre la recta del primer al segundo punto que la definen.

- [ ] Paso 1: escribir el test que falla

`packages/lecciones/test/derivados.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { distancia } from '@traze/geometria';
import type { Leccion } from '../src/esquema';
import { ConstruccionImposible, interpretarLeccion } from '../src/interpretar';
import { validarLeccion } from '../src/validar';

const DATOS = {
  A: [20, 100],
  B: [100, 100],
  C: [60, 30],
  D: [60, 60],
  E: [100, 30],
};
const RADIOS = {
  r: { mm: 30 },
  g: { mm: 80 },
  h: { mm: 50 },
  u: { mm: 40 },
  t: { mm: 70 },
};

function leccionCon(derivados: unknown[]): any {
  return {
    id: 'prueba',
    bloque: 1,
    titulo: 'Prueba',
    enunciado: 'Enunciado.',
    ideaClave: 'Idea.',
    datos: DATOS,
    radios: RADIOS,
    derivados,
    pasos: [{ titulo: 't', texto: 't', porque: 'p', dibujo: [{ tipo: 'punto', id: 'A' }] }],
    comprobaciones: [{ tipo: 'equidistante', punto: 'C', a: 'A', b: 'B' }],
  };
}

function cargar(datos: unknown): Leccion {
  const resultado = validarLeccion(datos);
  if (!resultado.ok) throw new Error(resultado.errores.join('\n'));
  return resultado.leccion;
}

function puntosDe(derivados: unknown[]) {
  return interpretarLeccion(cargar(leccionCon(derivados))).puntos;
}

function errores(derivados: unknown[]): string[] {
  const resultado = validarLeccion(leccionCon(derivados));
  return resultado.ok ? [] : resultado.errores;
}

describe('puntoEnDireccion', () => {
  it('lleva la abertura sobre la dirección de dos puntos', () => {
    const { X } = puntosDe([
      { tipo: 'puntoEnDireccion', id: 'X', origen: 'A', direccion: ['A', 'B'], radio: 'r' },
    ]);
    expect(X.x).toBeCloseTo(50, 9);
    expect(X.y).toBeCloseTo(100, 9);
  });

  it('traza la perpendicular hacia la izquierda de la dirección (arriba en pantalla)', () => {
    const { X } = puntosDe([
      {
        tipo: 'puntoEnDireccion',
        id: 'X',
        origen: 'A',
        direccion: ['A', 'B'],
        radio: 'r',
        perpendicular: true,
      },
    ]);
    expect(X.x).toBeCloseTo(20, 9);
    expect(X.y).toBeCloseTo(70, 9);
  });

  it('con sentido -1 va hacia atrás', () => {
    const { X } = puntosDe([
      { tipo: 'puntoEnDireccion', id: 'X', origen: 'B', direccion: ['A', 'B'], radio: 'r', sentido: -1 },
    ]);
    expect(X.x).toBeCloseTo(70, 9);
    expect(X.y).toBeCloseTo(100, 9);
  });

  it('sirve para trazar una paralela por otro punto', () => {
    const { X } = puntosDe([
      { tipo: 'puntoEnDireccion', id: 'X', origen: 'C', direccion: ['A', 'B'], radio: 'r' },
    ]);
    expect(X.x).toBeCloseTo(90, 9);
    expect(X.y).toBeCloseTo(30, 9);
  });

  it('rechaza una dirección definida por dos puntos iguales', () => {
    expect(() =>
      puntosDe([{ tipo: 'puntoEnDireccion', id: 'X', origen: 'A', direccion: ['A', 'A'], radio: 'r' }]),
    ).toThrow(ConstruccionImposible);
  });
});

describe('pie, simétrico y homotético', () => {
  it('calcula el pie de la perpendicular', () => {
    const { F } = puntosDe([{ tipo: 'pie', id: 'F', punto: 'C', recta: ['A', 'B'] }]);
    expect(F.x).toBeCloseTo(60, 9);
    expect(F.y).toBeCloseTo(100, 9);
  });

  it('calcula el simétrico respecto de un eje', () => {
    const { S } = puntosDe([{ tipo: 'simetrico', id: 'S', punto: 'C', eje: ['A', 'B'] }]);
    expect(S.x).toBeCloseTo(60, 9);
    expect(S.y).toBeCloseTo(170, 9);
  });

  it('calcula el homotético con una razón dada', () => {
    const { H } = puntosDe([{ tipo: 'homotetico', id: 'H', punto: 'C', centro: 'A', razon: 0.5 }]);
    expect(H.x).toBeCloseTo(40, 9);
    expect(H.y).toBeCloseTo(65, 9);
  });

  it('rechaza la razón 0', () => {
    expect(
      errores([{ tipo: 'homotetico', id: 'H', punto: 'C', centro: 'A', razon: 0 }]),
    ).toContain('derivados.0.razon: la razón no puede ser 0');
  });
});

describe('interseccionRectas', () => {
  it('corta dos rectas', () => {
    const { P } = puntosDe([
      { tipo: 'interseccionRectas', id: 'P', rectas: [['A', 'B'], ['C', 'D']] },
    ]);
    expect(P.x).toBeCloseTo(60, 9);
    expect(P.y).toBeCloseTo(100, 9);
  });

  it('rechaza dos rectas paralelas', () => {
    expect(() =>
      puntosDe([{ tipo: 'interseccionRectas', id: 'P', rectas: [['A', 'B'], ['C', 'E']] }]),
    ).toThrow(ConstruccionImposible);
  });
});

describe('interseccionRectaArco', () => {
  it('devuelve los cortes en el orden en que se recorre la recta', () => {
    const { X, Y } = puntosDe([
      { tipo: 'interseccionRectaArco', ids: ['X', 'Y'], recta: ['A', 'B'], centro: 'C', radio: 'g' },
    ]);
    const mitad = Math.sqrt(80 * 80 - 70 * 70);
    expect(X.x).toBeCloseTo(60 - mitad, 9);
    expect(Y.x).toBeCloseTo(60 + mitad, 9);
    expect(X.y).toBeCloseTo(100, 9);
    expect(distancia(X, { x: 60, y: 30 })).toBeCloseTo(80, 9);
  });

  it('rechaza un arco que no llega a la recta', () => {
    expect(() =>
      puntosDe([
        { tipo: 'interseccionRectaArco', ids: ['X', 'Y'], recta: ['A', 'B'], centro: 'C', radio: 'r' },
      ]),
    ).toThrow(ConstruccionImposible);
  });

  it('rechaza un arco tangente a la recta: un solo punto no sirve', () => {
    expect(() =>
      puntosDe([
        { tipo: 'interseccionRectaArco', ids: ['X', 'Y'], recta: ['A', 'B'], centro: 'C', radio: 't' },
      ]),
    ).toThrow(ConstruccionImposible);
  });
});

describe('cortesCirculos', () => {
  it('con radios iguales sitúa el primer corte arriba y el segundo abajo', () => {
    const { X, Y } = puntosDe([
      { tipo: 'cortesCirculos', ids: ['X', 'Y'], centros: ['A', 'B'], radios: ['h', 'h'] },
    ]);
    expect(X.x).toBeCloseTo(60, 9);
    expect(X.y).toBeCloseTo(70, 9);
    expect(Y.x).toBeCloseTo(60, 9);
    expect(Y.y).toBeCloseTo(130, 9);
  });

  it('admite radios distintos', () => {
    const { X } = puntosDe([
      { tipo: 'cortesCirculos', ids: ['X', 'Y'], centros: ['A', 'B'], radios: ['g', 'h'] },
    ]);
    expect(distancia(X, { x: 20, y: 100 })).toBeCloseTo(80, 9);
    expect(distancia(X, { x: 100, y: 100 })).toBeCloseTo(50, 9);
  });

  it('rechaza dos circunferencias que no se cortan', () => {
    expect(() =>
      puntosDe([
        { tipo: 'cortesCirculos', ids: ['X', 'Y'], centros: ['A', 'B'], radios: ['r', 'r'] },
      ]),
    ).toThrow(ConstruccionImposible);
  });

  it('rechaza dos circunferencias tangentes: un solo punto no sirve', () => {
    expect(() =>
      puntosDe([
        { tipo: 'cortesCirculos', ids: ['X', 'Y'], centros: ['A', 'B'], radios: ['u', 'u'] },
      ]),
    ).toThrow(ConstruccionImposible);
  });
});

describe('validación de los derivados nuevos', () => {
  it('señala un punto no definido con su campo', () => {
    expect(errores([{ tipo: 'pie', id: 'F', punto: 'Z', recta: ['A', 'B'] }])).toEqual([
      'derivados.0.punto: El punto «Z» no está definido',
    ]);
  });

  it('señala un radio no definido', () => {
    expect(
      errores([{ tipo: 'puntoEnDireccion', id: 'X', origen: 'A', direccion: ['A', 'B'], radio: 'q' }]),
    ).toEqual(['derivados.0.radio: El radio «q» no está definido']);
  });

  it('permite encadenar derivados', () => {
    const { Q } = puntosDe([
      { tipo: 'pie', id: 'F', punto: 'C', recta: ['A', 'B'] },
      { tipo: 'simetrico', id: 'Q', punto: 'C', eje: ['A', 'F'] },
    ]);
    expect(Q.x).toBeCloseTo(60, 9);
    expect(Q.y).toBeCloseTo(170, 9);
  });
});
```

- [ ] Paso 2: ejecutar el test y comprobar que falla

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `derivados.test.ts` FALLA en todos sus tests (los derivados no existen en el esquema); lo anterior sigue pasando.

- [ ] Paso 3: añadir los derivados al esquema

En `packages/lecciones/src/esquema.ts`.

Antes:

```ts
  z.object({ tipo: z.literal('radio'), id, entre: parDeIds, factor: z.number().positive() }),
]);
```

Después:

```ts
  z.object({ tipo: z.literal('radio'), id, entre: parDeIds, factor: z.number().positive() }),
  z.object({
    tipo: z.literal('puntoEnDireccion'),
    id,
    origen: id,
    direccion: parDeIds,
    radio: id,
    perpendicular: z.boolean().default(false),
    sentido: z.union([z.literal(1), z.literal(-1)]).default(1),
  }),
  z.object({ tipo: z.literal('pie'), id, punto: id, recta: parDeIds }),
  z.object({ tipo: z.literal('simetrico'), id, punto: id, eje: parDeIds }),
  z.object({
    tipo: z.literal('homotetico'),
    id,
    punto: id,
    centro: id,
    razon: z.number().refine((razon) => razon !== 0, 'la razón no puede ser 0'),
  }),
  z.object({
    tipo: z.literal('interseccionRectas'),
    id,
    rectas: z.tuple([parDeIds, parDeIds]),
  }),
  z.object({
    tipo: z.literal('interseccionRectaArco'),
    ids: parDeIds,
    recta: parDeIds,
    centro: id,
    radio: id,
  }),
  z.object({
    tipo: z.literal('cortesCirculos'),
    ids: parDeIds,
    centros: parDeIds,
    radios: parDeIds,
  }),
]);
```

En `usoDeDerivado`, añade estos casos después del de `'radio'` (TypeScript avisa si falta alguno):

```ts
    case 'puntoEnDireccion':
      return {
        puntos: [{ ruta: ['origen'], nombre: derivado.origen }, ...parEn(['direccion'], derivado.direccion)],
        radios: [{ ruta: ['radio'], nombre: derivado.radio }],
        crea: [derivado.id],
      };
    case 'pie':
      return {
        puntos: [{ ruta: ['punto'], nombre: derivado.punto }, ...parEn(['recta'], derivado.recta)],
        radios: [],
        crea: [derivado.id],
      };
    case 'simetrico':
      return {
        puntos: [{ ruta: ['punto'], nombre: derivado.punto }, ...parEn(['eje'], derivado.eje)],
        radios: [],
        crea: [derivado.id],
      };
    case 'homotetico':
      return {
        puntos: [
          { ruta: ['punto'], nombre: derivado.punto },
          { ruta: ['centro'], nombre: derivado.centro },
        ],
        radios: [],
        crea: [derivado.id],
      };
    case 'interseccionRectas':
      return {
        puntos: [
          ...parEn(['rectas', 0], derivado.rectas[0]),
          ...parEn(['rectas', 1], derivado.rectas[1]),
        ],
        radios: [],
        crea: [derivado.id],
      };
    case 'interseccionRectaArco':
      return {
        puntos: [...parEn(['recta'], derivado.recta), { ruta: ['centro'], nombre: derivado.centro }],
        radios: [{ ruta: ['radio'], nombre: derivado.radio }],
        crea: [...derivado.ids],
      };
    case 'cortesCirculos':
      return {
        puntos: parEn(['centros'], derivado.centros),
        radios: [
          { ruta: ['radios', 0], nombre: derivado.radios[0] },
          { ruta: ['radios', 1], nombre: derivado.radios[1] },
        ],
        crea: [...derivado.ids],
      };
```

- [ ] Paso 4: resolverlos en el intérprete

En `packages/lecciones/src/interpretar.ts`, amplía la importación de `@traze/geometria`.

Antes:

```ts
  interseccionCircunferencias,
  punto,
```

Después:

```ts
  interseccionCircunferencias,
  interseccionRectaCircunferencia,
  interseccionRectas,
  normalIzquierda,
  punto,
```

Justo antes de `resolverDerivado`, inserta:

```ts
function pieDe(p: Punto, a: Punto, u: Punto): Punto {
  return suma(a, escala(u, escalar(resta(p, a), u)));
}
```

En `resolverDerivado`, añade estos casos después del de `'radio'`:

```ts
    case 'puntoEnDireccion': {
      const [nombreA, nombreB] = derivado.direccion;
      const sentido = exigirDireccion(
        obtener(puntos, nombreA),
        obtener(puntos, nombreB),
        nombreA,
        nombreB,
      );
      const u = derivado.perpendicular ? normalIzquierda(sentido) : sentido;
      const largo = derivado.sentido * obtenerRadio(radios, derivado.radio);
      puntos[derivado.id] = suma(obtener(puntos, derivado.origen), escala(u, largo));
      return;
    }
    case 'pie': {
      const [nombreA, nombreB] = derivado.recta;
      const a = obtener(puntos, nombreA);
      const u = exigirDireccion(a, obtener(puntos, nombreB), nombreA, nombreB);
      puntos[derivado.id] = pieDe(obtener(puntos, derivado.punto), a, u);
      return;
    }
    case 'simetrico': {
      const [nombreA, nombreB] = derivado.eje;
      const a = obtener(puntos, nombreA);
      const u = exigirDireccion(a, obtener(puntos, nombreB), nombreA, nombreB);
      const p = obtener(puntos, derivado.punto);
      const pie = pieDe(p, a, u);
      puntos[derivado.id] = punto(2 * pie.x - p.x, 2 * pie.y - p.y);
      return;
    }
    case 'homotetico': {
      const centro = obtener(puntos, derivado.centro);
      const p = obtener(puntos, derivado.punto);
      puntos[derivado.id] = suma(centro, escala(resta(p, centro), derivado.razon));
      return;
    }
    case 'interseccionRectas': {
      const [[nombreP, nombreQ], [nombreR, nombreS]] = derivado.rectas;
      const corte = interseccionRectas(
        { p: obtener(puntos, nombreP), q: obtener(puntos, nombreQ) },
        { p: obtener(puntos, nombreR), q: obtener(puntos, nombreS) },
      );
      if (!corte) {
        throw new ConstruccionImposible(
          `Las rectas «${nombreP}${nombreQ}» y «${nombreR}${nombreS}» no se cortan en un punto (son paralelas, coinciden o les falta una dirección)`,
        );
      }
      puntos[derivado.id] = corte;
      return;
    }
    case 'interseccionRectaArco': {
      const [nombreP, nombreQ] = derivado.recta;
      const cortes = interseccionRectaCircunferencia(
        { p: obtener(puntos, nombreP), q: obtener(puntos, nombreQ) },
        { centro: obtener(puntos, derivado.centro), radio: obtenerRadio(radios, derivado.radio) },
      );
      if (cortes.length !== 2) {
        throw new ConstruccionImposible(
          `La recta «${nombreP}${nombreQ}» no corta en dos puntos al arco con centro «${derivado.centro}» y radio «${derivado.radio}»`,
        );
      }
      puntos[derivado.ids[0]] = cortes[0];
      puntos[derivado.ids[1]] = cortes[1];
      return;
    }
    case 'cortesCirculos': {
      const [nombreA, nombreB] = derivado.centros;
      const cortes = interseccionCircunferencias(
        { centro: obtener(puntos, nombreA), radio: obtenerRadio(radios, derivado.radios[0]) },
        { centro: obtener(puntos, nombreB), radio: obtenerRadio(radios, derivado.radios[1]) },
      );
      const mensaje =
        `Los arcos con centro en «${nombreA}» y «${nombreB}» y radios «${derivado.radios[0]}» y «${derivado.radios[1]}» no se cortan en dos puntos`;
      if (!cortes) throw new ConstruccionImposible(mensaje);
      const [primero, segundo] = cortes;
      if (distancia(primero, segundo) < EPS) throw new ConstruccionImposible(mensaje);
      puntos[derivado.ids[0]] = primero;
      puntos[derivado.ids[1]] = segundo;
      return;
    }
```

- [ ] Paso 5: documentarlos en el vocabulario

En `packages/lecciones/src/vocabulario.ts`, añade al final de `DERIVADOS` (antes del `];`):

```ts
  {
    tipo: 'puntoEnDireccion',
    campos:
      'id, origen, direccion [P, Q], radio (id de un radio), perpendicular (opcional; por defecto false), sentido (opcional; 1 o -1; por defecto 1)',
    descripcion:
      'Crea el punto que está a la distancia del radio desde el origen, en la dirección de P a Q (con sentido -1, al revés). Con perpendicular: true, en la dirección perpendicular, hacia la izquierda de P→Q en pantalla (arriba si P→Q va hacia la derecha). Sirve para llevar la abertura del compás sobre una recta, para trazar paralelas (otra dirección, otro origen) y perpendiculares.',
    ejemplo: {
      tipo: 'puntoEnDireccion',
      id: 'D',
      origen: 'C',
      direccion: ['C', 'E'],
      radio: 'r',
      perpendicular: false,
      sentido: 1,
    },
  },
  {
    tipo: 'pie',
    campos: 'id, punto, recta [P, Q]',
    descripcion: 'Crea el pie de la perpendicular trazada desde «punto» a la recta PQ.',
    ejemplo: { tipo: 'pie', id: 'F', punto: 'C', recta: ['A', 'B'] },
  },
  {
    tipo: 'simetrico',
    campos: 'id, punto, eje [P, Q]',
    descripcion: 'Crea el simétrico de «punto» respecto del eje PQ.',
    ejemplo: { tipo: 'simetrico', id: "C'", punto: 'C', eje: ['A', 'B'] },
  },
  {
    tipo: 'homotetico',
    campos: 'id, punto, centro, razon (número distinto de 0; negativo invierte)',
    descripcion: 'Crea el homotético de «punto» con el centro y la razón dados.',
    ejemplo: { tipo: 'homotetico', id: "A'", punto: 'A', centro: 'O', razon: 2 },
  },
  {
    tipo: 'interseccionRectas',
    campos: 'id, rectas [[P, Q], [R, S]]',
    descripcion:
      'Crea el punto donde se cortan las rectas PQ y RS. Si son paralelas o coinciden, la construcción es imposible.',
    ejemplo: { tipo: 'interseccionRectas', id: 'X', rectas: [['A', 'B'], ['C', 'D']] },
  },
  {
    tipo: 'interseccionRectaArco',
    campos: 'ids [X, Y], recta [P, Q], centro, radio (id de un radio)',
    descripcion:
      'Crea los dos puntos donde la recta PQ corta a la circunferencia con ese centro y ese radio. X es el que se encuentra primero al recorrer la recta de P a Q. Si no la corta en dos puntos (o la toca en uno), la construcción es imposible.',
    ejemplo: {
      tipo: 'interseccionRectaArco',
      ids: ['X', 'Y'],
      recta: ['A', 'B'],
      centro: 'C',
      radio: 'r',
    },
  },
  {
    tipo: 'cortesCirculos',
    campos: 'ids [X, Y], centros [P, Q], radios [r1, r2] (ids de radios)',
    descripcion:
      'Crea los dos puntos donde se cortan las circunferencias de centro P y radio r1 y de centro Q y radio r2 (pueden ser radios distintos). X queda a la izquierda al mirar de P a Q en pantalla e Y a la derecha. Si no se cortan en dos puntos (o son tangentes), la construcción es imposible.',
    ejemplo: {
      tipo: 'cortesCirculos',
      ids: ['X', 'Y'],
      centros: ['A', 'B'],
      radios: ['r', 'r'],
    },
  },
```

- [ ] Paso 6: regenerar, ejecutar los tests y comprobar tipos

```bash
pnpm prompt
pnpm test
pnpm typecheck
```

Esperado: los 21 tests de `derivados.test.ts` pasan; el test de sincronía del vocabulario, los ejemplos y el «prompt al día» siguen en verde. Si `prompt.test.ts` dice que el prompt supera el límite de longitud de un mensaje de chat, acorta las descripciones; no subas el límite.

- [ ] Paso 7: confirmar

```bash
git add packages/lecciones generacion
git commit -m "feat(lecciones): derivados de punto en direccion, pie, simetrico, homotetico y cortes"
```

## Tarea 3: arco entre dos puntos

Archivos:

- Modificar: `packages/lecciones/src/esquema.ts`, `packages/lecciones/src/interpretar.ts`, `packages/lecciones/src/vocabulario.ts`
- Regenerar: `generacion/prompt-leccion.md`, `generacion/skill/dibujo-tecnico/SKILL.md`
- Test: `packages/lecciones/test/arco-entre.test.ts`

Interfaces:

- Consume: `referenciasDePrimitiva` y `resolverPrimitiva` existentes.
- Produce: primitiva `{ tipo: 'arcoEntre', centro, desde, hasta, pasaPor?, estilo? }`. Se resuelve a la primitiva `arco` de siempre (`inicio` < `fin`), así que `comprobarRender`, el reproductor y el lienzo no cambian.

Los enlaces, el óvalo, el arco capaz y la circunferencia circunscrita dibujan arcos que van de un punto a otro con un centro dado, no «alrededor» de un punto como `arco`. Por defecto se dibuja el arco corto. Para el largo, y para las medias circunferencias (donde los dos lados miden lo mismo), se indica un punto del arco con `pasaPor`.

- [ ] Paso 1: escribir el test que falla

`packages/lecciones/test/arco-entre.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Leccion } from '../src/esquema';
import { ConstruccionImposible, interpretarLeccion } from '../src/interpretar';
import { validarLeccion } from '../src/validar';

function leccionCon(dibujo: unknown): any {
  return {
    id: 'prueba',
    bloque: 1,
    titulo: 'Prueba',
    enunciado: 'Enunciado.',
    ideaClave: 'Idea.',
    datos: {
      O: [50, 70],
      A: [80, 70],
      B: [50, 40],
      P: [50, 100],
      C: [20, 70],
      Q: [100, 70],
    },
    pasos: [{ titulo: 't', texto: 't', porque: 'p', dibujo: [dibujo] }],
    comprobaciones: [{ tipo: 'equidistante', punto: 'A', a: 'B', b: 'P' }],
  };
}

function cargar(datos: unknown): Leccion {
  const resultado = validarLeccion(datos);
  if (!resultado.ok) throw new Error(resultado.errores.join('\n'));
  return resultado.leccion;
}

function arcoDe(dibujo: unknown) {
  const primitiva = interpretarLeccion(cargar(leccionCon(dibujo))).pasos[0].dibujo[0];
  if (primitiva.tipo !== 'arco') throw new Error('se esperaba un arco');
  return primitiva;
}

describe('arcoEntre', () => {
  it('dibuja el arco corto por defecto', () => {
    const arco = arcoDe({ tipo: 'arcoEntre', centro: 'O', desde: 'A', hasta: 'B' });
    expect(arco.cx).toBeCloseTo(50, 9);
    expect(arco.cy).toBeCloseTo(70, 9);
    expect(arco.radio).toBeCloseTo(30, 9);
    expect(arco.inicio).toBeCloseTo(-Math.PI / 2, 9);
    expect(arco.fin).toBeCloseTo(0, 9);
  });

  it('da el mismo arco corto al invertir los extremos', () => {
    const arco = arcoDe({ tipo: 'arcoEntre', centro: 'O', desde: 'B', hasta: 'A' });
    expect(arco.inicio).toBeCloseTo(-Math.PI / 2, 9);
    expect(arco.fin).toBeCloseTo(0, 9);
  });

  it('dibuja el arco largo si pasa por un punto del lado largo', () => {
    const arco = arcoDe({ tipo: 'arcoEntre', centro: 'O', desde: 'A', hasta: 'B', pasaPor: 'P' });
    expect(arco.fin - arco.inicio).toBeCloseTo((3 * Math.PI) / 2, 9);
  });

  it('exige pasaPor en una media circunferencia', () => {
    expect(() =>
      interpretarLeccion(cargar(leccionCon({ tipo: 'arcoEntre', centro: 'O', desde: 'A', hasta: 'C' }))),
    ).toThrow(ConstruccionImposible);
    expect(() =>
      interpretarLeccion(cargar(leccionCon({ tipo: 'arcoEntre', centro: 'O', desde: 'A', hasta: 'C' }))),
    ).toThrow(/pasaPor/);
  });

  it('elige el lado de una media circunferencia con pasaPor', () => {
    const porAbajo = arcoDe({ tipo: 'arcoEntre', centro: 'O', desde: 'A', hasta: 'C', pasaPor: 'P' });
    expect(porAbajo.fin - porAbajo.inicio).toBeCloseTo(Math.PI, 9);
    expect(Math.sin((porAbajo.inicio + porAbajo.fin) / 2)).toBeCloseTo(1, 9);

    const porArriba = arcoDe({ tipo: 'arcoEntre', centro: 'O', desde: 'A', hasta: 'C', pasaPor: 'B' });
    expect(porArriba.fin - porArriba.inicio).toBeCloseTo(Math.PI, 9);
    expect(Math.sin((porArriba.inicio + porArriba.fin) / 2)).toBeCloseTo(-1, 9);
  });

  it('rechaza dos extremos a distinta distancia del centro', () => {
    expect(() =>
      interpretarLeccion(cargar(leccionCon({ tipo: 'arcoEntre', centro: 'O', desde: 'A', hasta: 'Q' }))),
    ).toThrow(ConstruccionImposible);
  });

  it('rechaza dos extremos que coinciden', () => {
    expect(() =>
      interpretarLeccion(cargar(leccionCon({ tipo: 'arcoEntre', centro: 'O', desde: 'A', hasta: 'A' }))),
    ).toThrow(ConstruccionImposible);
  });

  it('valida los puntos que nombra, incluido pasaPor', () => {
    const resultado = validarLeccion(
      leccionCon({ tipo: 'arcoEntre', centro: 'O', desde: 'A', hasta: 'B', pasaPor: 'Z' }),
    );
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.errores).toEqual(['pasos.0.dibujo.0.pasaPor: El punto «Z» no está definido']);
  });
});
```

- [ ] Paso 2: ejecutar el test y comprobar que falla

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `arco-entre.test.ts` FALLA (la primitiva no existe); lo anterior sigue pasando.

- [ ] Paso 3: el esquema

En `packages/lecciones/src/esquema.ts`.

Antes:

```ts
  z.object({ tipo: z.literal('marcaAnguloRecto'), vertice: id, hacia1: id, hacia2: id }),
```

Después:

```ts
  z.object({
    tipo: z.literal('arcoEntre'),
    centro: id,
    desde: id,
    hasta: id,
    pasaPor: id.optional(),
    estilo: estilo.default('construccion'),
  }),
  z.object({ tipo: z.literal('marcaAnguloRecto'), vertice: id, hacia1: id, hacia2: id }),
```

En `referenciasDePrimitiva`, añade antes del caso `'marcaAnguloRecto'`:

```ts
    case 'arcoEntre':
      return [
        { ruta: ['centro'], nombre: p.centro },
        { ruta: ['desde'], nombre: p.desde },
        { ruta: ['hasta'], nombre: p.hasta },
        ...(p.pasaPor !== undefined ? [{ ruta: ['pasaPor'], nombre: p.pasaPor }] : []),
      ];
```

- [ ] Paso 4: el intérprete

En `packages/lecciones/src/interpretar.ts`, justo antes de `function resolverPrimitiva`, inserta:

```ts
const VUELTA = 2 * Math.PI;
const giroPositivo = (angulo: number): number => ((angulo % VUELTA) + VUELTA) % VUELTA;
```

En `resolverPrimitiva`, añade antes del caso `'marcaAnguloRecto'`:

```ts
    case 'arcoEntre': {
      const centro = obtener(puntos, primitiva.centro);
      const desde = obtener(puntos, primitiva.desde);
      const hasta = obtener(puntos, primitiva.hasta);
      const radio = distancia(centro, desde);
      if (radio < EPS || Math.abs(distancia(centro, hasta) - radio) > TOLERANCIA) {
        throw new ConstruccionImposible(
          `El arco con centro «${primitiva.centro}» no une «${primitiva.desde}» y «${primitiva.hasta}»: no están a la misma distancia del centro`,
        );
      }
      const angulo1 = Math.atan2(desde.y - centro.y, desde.x - centro.x);
      const angulo2 = Math.atan2(hasta.y - centro.y, hasta.x - centro.x);
      const barrido = giroPositivo(angulo2 - angulo1);
      if (barrido < 1e-9 || VUELTA - barrido < 1e-9) {
        throw new ConstruccionImposible(
          `Los puntos «${primitiva.desde}» y «${primitiva.hasta}» coinciden: no definen un arco`,
        );
      }

      let enSentidoPositivo: boolean;
      if (primitiva.pasaPor !== undefined) {
        const pasa = obtener(puntos, primitiva.pasaPor);
        const anguloPasa = Math.atan2(pasa.y - centro.y, pasa.x - centro.x);
        enSentidoPositivo = giroPositivo(anguloPasa - angulo1) <= barrido + 1e-9;
      } else {
        if (Math.abs(barrido - Math.PI) < 1e-9) {
          throw new ConstruccionImposible(
            `El arco entre «${primitiva.desde}» y «${primitiva.hasta}» es una media circunferencia: indica por qué punto pasa con «pasaPor»`,
          );
        }
        enSentidoPositivo = barrido < Math.PI;
      }

      const inicio = enSentidoPositivo ? angulo1 : angulo2;
      const fin = inicio + (enSentidoPositivo ? barrido : VUELTA - barrido);
      return {
        tipo: 'arco',
        cx: centro.x,
        cy: centro.y,
        radio,
        inicio,
        fin,
        estilo: primitiva.estilo,
      };
    }
```

- [ ] Paso 5: documentarla en el vocabulario

En `packages/lecciones/src/vocabulario.ts`, en `PRIMITIVAS`, añade antes de `marcaAnguloRecto`:

```ts
  {
    tipo: 'arcoEntre',
    campos: 'centro, desde, hasta, pasaPor (opcional), estilo (opcional; por defecto «construccion»)',
    descripcion:
      'Arco de circunferencia con ese centro que va del punto «desde» al punto «hasta», que deben estar a la misma distancia del centro. Por defecto es el arco corto. Para el arco largo, y siempre en una media circunferencia, indica «pasaPor» con un punto ya definido que esté en el arco que quieres. Úsalo para enlaces, óvalos, arcos capaces y circunferencias completas por tramos.',
    ejemplo: { tipo: 'arcoEntre', centro: 'O', desde: 'A', hasta: 'B', pasaPor: 'P', estilo: 'resultado' },
  },
```

- [ ] Paso 6: regenerar, ejecutar los tests y comprobar tipos

```bash
pnpm prompt
pnpm test
pnpm typecheck
pnpm --filter @traze/web typecheck
```

Esperado: los 8 tests nuevos pasan y todo lo demás sigue en verde.

- [ ] Paso 7: confirmar

```bash
git add packages/lecciones generacion
git commit -m "feat(lecciones): primitiva arcoEntre con pasaPor para arcos largos y medias circunferencias"
```

## Tarea 4: ocho comprobaciones nuevas

Archivos:

- Modificar: `packages/lecciones/src/esquema.ts`, `packages/lecciones/src/interpretar.ts`, `packages/lecciones/src/procesar.ts`, `packages/lecciones/src/vocabulario.ts`
- Regenerar: `generacion/prompt-leccion.md`, `generacion/skill/dibujo-tecnico/SKILL.md`
- Test: `packages/lecciones/test/comprobaciones-nuevas.test.ts`

Interfaces:

- Consume: `ejecutarComprobaciones(leccion, puntos)` y `procesarLeccion` del Plan 1 y 2; `cruz`, `escalar` de `@traze/geometria`.
- Produce: `ejecutarComprobaciones(leccion, puntos, radios = {})` (el tercer parámetro es nuevo y opcional); comprobaciones `tangente`, `puntoEnCircunferencia`, `igualLongitud`, `proporcion`, `colineales`, `paralelas`, `angulo` e `igualAngulo`.

Las propiedades de las 20 lecciones nuevas necesitan estas ocho: tangencia (el punto está en la recta y es perpendicular al radio), punto en una circunferencia, longitudes iguales, proporciones (Thales, media proporcional, sección áurea, homotecia), alineación, paralelismo y ángulos (por valor o iguales entre sí). Son las que impiden que una IA entregue una construcción «que se ve bien» y falla en números.

- [ ] Paso 1: escribir el test que falla

`packages/lecciones/test/comprobaciones-nuevas.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Leccion } from '../src/esquema';
import { ejecutarComprobaciones, interpretarLeccion } from '../src/interpretar';
import { procesarLeccion } from '../src/procesar';
import { validarLeccion } from '../src/validar';

const DATOS = {
  A: [20, 100],
  B: [100, 100],
  C: [60, 30],
  D: [60, 60],
  E: [100, 30],
  F: [60, 100],
  G: [60, 90],
};
const RADIOS = { g: { mm: 70 } };

function leccionCon(comprobacion: unknown): any {
  return {
    id: 'prueba',
    bloque: 1,
    titulo: 'Prueba',
    enunciado: 'Enunciado.',
    ideaClave: 'Idea.',
    datos: DATOS,
    radios: RADIOS,
    pasos: [{ titulo: 't', texto: 't', porque: 'p', dibujo: [{ tipo: 'punto', id: 'A' }] }],
    comprobaciones: [comprobacion],
  };
}

function cargar(datos: unknown): Leccion {
  const resultado = validarLeccion(datos);
  if (!resultado.ok) throw new Error(resultado.errores.join('\n'));
  return resultado.leccion;
}

function resultado(comprobacion: unknown) {
  const leccion = cargar(leccionCon(comprobacion));
  const resuelta = interpretarLeccion(leccion);
  return ejecutarComprobaciones(leccion, resuelta.puntos, resuelta.radios)[0];
}

const CASOS: { nombre: string; correcta: unknown; fallida: unknown }[] = [
  {
    nombre: 'tangente',
    correcta: { tipo: 'tangente', recta: ['A', 'B'], centro: 'C', punto: 'F' },
    fallida: { tipo: 'tangente', recta: ['A', 'B'], centro: 'C', punto: 'A' },
  },
  {
    nombre: 'puntoEnCircunferencia',
    correcta: { tipo: 'puntoEnCircunferencia', punto: 'F', centro: 'C', radio: 'g' },
    fallida: { tipo: 'puntoEnCircunferencia', punto: 'A', centro: 'C', radio: 'g' },
  },
  {
    nombre: 'igualLongitud',
    correcta: { tipo: 'igualLongitud', segmentos: [['A', 'F'], ['F', 'B']] },
    fallida: { tipo: 'igualLongitud', segmentos: [['A', 'F'], ['A', 'B']] },
  },
  {
    nombre: 'proporcion',
    correcta: { tipo: 'proporcion', a: ['A', 'F'], b: ['A', 'B'], c: ['C', 'D'], d: ['C', 'G'] },
    fallida: { tipo: 'proporcion', a: ['A', 'F'], b: ['A', 'B'], c: ['C', 'D'], d: ['C', 'F'] },
  },
  {
    nombre: 'colineales',
    correcta: { tipo: 'colineales', puntos: ['A', 'F', 'B'] },
    fallida: { tipo: 'colineales', puntos: ['A', 'F', 'C'] },
  },
  {
    nombre: 'paralelas',
    correcta: { tipo: 'paralelas', rectas: [['A', 'B'], ['C', 'E']] },
    fallida: { tipo: 'paralelas', rectas: [['A', 'B'], ['C', 'D']] },
  },
  {
    nombre: 'angulo',
    correcta: { tipo: 'angulo', vertice: 'F', a: 'A', b: 'D', grados: 90 },
    fallida: { tipo: 'angulo', vertice: 'F', a: 'A', b: 'D', grados: 60 },
  },
  {
    nombre: 'igualAngulo',
    correcta: { tipo: 'igualAngulo', angulos: [['A', 'F', 'D'], ['B', 'F', 'D']] },
    fallida: { tipo: 'igualAngulo', angulos: [['A', 'F', 'D'], ['A', 'B', 'C']] },
  },
];

describe('comprobaciones nuevas', () => {
  for (const caso of CASOS) {
    it(`${caso.nombre}: acepta una construcción correcta`, () => {
      const r = resultado(caso.correcta);
      expect(r.ok, r.detalle).toBe(true);
      expect(r.descripcion.length).toBeGreaterThan(0);
    });

    it(`${caso.nombre}: rechaza una construcción incorrecta`, () => {
      expect(resultado(caso.fallida).ok).toBe(false);
    });
  }

  it('colineales no da por buena una terna con dos puntos iguales', () => {
    expect(resultado({ tipo: 'colineales', puntos: ['A', 'A', 'B'] }).ok).toBe(false);
  });

  it('proporcion no da por buena una razón con un segmento de longitud cero', () => {
    expect(
      resultado({ tipo: 'proporcion', a: ['A', 'F'], b: ['A', 'A'], c: ['C', 'D'], d: ['C', 'G'] }).ok,
    ).toBe(false);
  });
});

describe('validación de las comprobaciones nuevas', () => {
  it('señala un punto no definido con su posición', () => {
    const r = validarLeccion(leccionCon({ tipo: 'colineales', puntos: ['A', 'F', 'Z'] }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errores).toEqual(['comprobaciones.0.puntos.2: El punto «Z» no está definido']);
  });

  it('señala un radio no definido', () => {
    const r = validarLeccion(
      leccionCon({ tipo: 'puntoEnCircunferencia', punto: 'F', centro: 'C', radio: 'q' }),
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errores).toEqual(['comprobaciones.0.radio: El radio «q» no está definido']);
  });

  it('procesarLeccion usa los radios y rechaza una lección cuya comprobación falla', () => {
    const buena = leccionCon({ tipo: 'puntoEnCircunferencia', punto: 'F', centro: 'C', radio: 'g' });
    expect(procesarLeccion(buena).ok).toBe(true);

    const mala = leccionCon({ tipo: 'puntoEnCircunferencia', punto: 'A', centro: 'C', radio: 'g' });
    const r = procesarLeccion(mala);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errores[0].startsWith('comprobaciones: ')).toBe(true);
  });
});
```

- [ ] Paso 2: ejecutar el test y comprobar que falla

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `comprobaciones-nuevas.test.ts` FALLA (las comprobaciones no existen en el esquema); lo anterior sigue pasando.

- [ ] Paso 3: el esquema

En `packages/lecciones/src/esquema.ts`.

Antes:

```ts
  z.object({ tipo: z.literal('pasaPorPuntoMedio'), recta: parDeIds, segmento: parDeIds }),
]);
```

Después:

```ts
  z.object({ tipo: z.literal('pasaPorPuntoMedio'), recta: parDeIds, segmento: parDeIds }),
  z.object({ tipo: z.literal('tangente'), recta: parDeIds, centro: id, punto: id }),
  z.object({ tipo: z.literal('puntoEnCircunferencia'), punto: id, centro: id, radio: id }),
  z.object({ tipo: z.literal('igualLongitud'), segmentos: z.tuple([parDeIds, parDeIds]) }),
  z.object({ tipo: z.literal('proporcion'), a: parDeIds, b: parDeIds, c: parDeIds, d: parDeIds }),
  z.object({ tipo: z.literal('colineales'), puntos: z.tuple([id, id, id]) }),
  z.object({ tipo: z.literal('paralelas'), rectas: z.tuple([parDeIds, parDeIds]) }),
  z.object({
    tipo: z.literal('angulo'),
    vertice: id,
    a: id,
    b: id,
    grados: z.number().positive().max(180),
  }),
  z.object({
    tipo: z.literal('igualAngulo'),
    angulos: z.tuple([z.tuple([id, id, id]), z.tuple([id, id, id])]),
  }),
]);
```

En `referenciasDeComprobacion`, añade estos casos después del grupo `'perpendicular'` / `'pasaPorPuntoMedio'`:

```ts
    case 'tangente':
      return [
        ...parEn(['recta'], c.recta),
        { ruta: ['centro'], nombre: c.centro },
        { ruta: ['punto'], nombre: c.punto },
      ];
    case 'puntoEnCircunferencia':
      return [
        { ruta: ['punto'], nombre: c.punto },
        { ruta: ['centro'], nombre: c.centro },
      ];
    case 'igualLongitud':
      return [
        ...parEn(['segmentos', 0], c.segmentos[0]),
        ...parEn(['segmentos', 1], c.segmentos[1]),
      ];
    case 'proporcion':
      return [
        ...parEn(['a'], c.a),
        ...parEn(['b'], c.b),
        ...parEn(['c'], c.c),
        ...parEn(['d'], c.d),
      ];
    case 'colineales':
      return c.puntos.map((nombre, i) => ({ ruta: ['puntos', i], nombre }));
    case 'paralelas':
      return [...parEn(['rectas', 0], c.rectas[0]), ...parEn(['rectas', 1], c.rectas[1])];
    case 'angulo':
      return [
        { ruta: ['vertice'], nombre: c.vertice },
        { ruta: ['a'], nombre: c.a },
        { ruta: ['b'], nombre: c.b },
      ];
    case 'igualAngulo':
      return c.angulos.flatMap((terna, i) =>
        terna.map((nombre, j) => ({ ruta: ['angulos', i, j], nombre })),
      );
```

`parEn` está definido más abajo en el archivo que `referenciasDeComprobacion`; como son declaraciones de función y constantes usadas dentro de funciones que se llaman después, no hay problema de orden. Si el compilador protesta por usar `parEn` antes de su declaración, mueve `parEn` justo debajo de `type Referencia`.

En el bucle de las comprobaciones del `superRefine`.

Antes:

```ts
    leccion.comprobaciones.forEach((comprobacion, i) => {
      for (const ref of referenciasDeComprobacion(comprobacion)) {
        falta(['comprobaciones', i, ...ref.ruta], 'El punto', ref.nombre, definidos);
      }
    });
```

Después:

```ts
    leccion.comprobaciones.forEach((comprobacion, i) => {
      for (const ref of referenciasDeComprobacion(comprobacion)) {
        falta(['comprobaciones', i, ...ref.ruta], 'El punto', ref.nombre, definidos);
      }
      if (comprobacion.tipo === 'puntoEnCircunferencia') {
        falta(['comprobaciones', i, 'radio'], 'El radio', comprobacion.radio, radios);
      }
    });
```

- [ ] Paso 4: ejecutarlas en el intérprete

En `packages/lecciones/src/interpretar.ts`, añade `cruz` a la importación de `@traze/geometria` (en orden alfabético, antes de `distancia`).

Cambia la firma de `ejecutarComprobaciones`.

Antes:

```ts
export function ejecutarComprobaciones(
  leccion: Leccion,
  puntos: Puntos,
): ResultadoComprobacion[] {
```

Después:

```ts
const nombreDe = (extremos: readonly string[]): string => extremos.join('');
const longitudDe = (puntos: Puntos, extremos: readonly [string, string]): number =>
  distancia(obtener(puntos, extremos[0]), obtener(puntos, extremos[1]));

function anguloEn(puntos: Puntos, a: string, vertice: string, b: string): number | null {
  const v = obtener(puntos, vertice);
  const ua = direccion(v, obtener(puntos, a));
  const ub = direccion(v, obtener(puntos, b));
  if (!ua || !ub) return null;
  return (Math.atan2(Math.abs(cruz(ua, ub)), escalar(ua, ub)) * 180) / Math.PI;
}

export function ejecutarComprobaciones(
  leccion: Leccion,
  puntos: Puntos,
  radios: Radios = {},
): ResultadoComprobacion[] {
```

Y añade los casos nuevos al final del `switch`, después de `'pasaPorPuntoMedio'`:

```ts
      case 'tangente': {
        const [nombreP, nombreQ] = comprobacion.recta;
        const descripcion = `${nombreP}${nombreQ} es tangente en ${comprobacion.punto} a la circunferencia de centro ${comprobacion.centro}`;
        const p = obtener(puntos, nombreP);
        const q = obtener(puntos, nombreQ);
        const t = obtener(puntos, comprobacion.punto);
        const dirRecta = direccion(p, q);
        const dirRadio = direccion(obtener(puntos, comprobacion.centro), t);
        if (!dirRecta || !dirRadio) {
          return { descripcion, ok: false, detalle: 'hay dos puntos coincidentes' };
        }
        const sobreLaRecta = distanciaPuntoRecta(t, { p, q });
        const producto = Math.abs(escalar(dirRecta, dirRadio));
        return {
          descripcion,
          ok: sobreLaRecta < TOLERANCIA && producto < TOLERANCIA,
          detalle: `distancia a la recta ${formato(sobreLaRecta)}, producto escalar con el radio ${formato(producto)}`,
        };
      }
      case 'puntoEnCircunferencia': {
        const radio = obtenerRadio(radios, comprobacion.radio);
        const separacion = Math.abs(
          distancia(obtener(puntos, comprobacion.punto), obtener(puntos, comprobacion.centro)) - radio,
        );
        return {
          descripcion: `${comprobacion.punto} está en la circunferencia de centro ${comprobacion.centro} y radio ${comprobacion.radio}`,
          ok: separacion < TOLERANCIA,
          detalle: `diferencia con el radio ${formato(separacion)}`,
        };
      }
      case 'igualLongitud': {
        const [primero, segundo] = comprobacion.segmentos;
        const diferencia = Math.abs(longitudDe(puntos, primero) - longitudDe(puntos, segundo));
        return {
          descripcion: `${nombreDe(primero)} = ${nombreDe(segundo)}`,
          ok: diferencia < TOLERANCIA,
          detalle: `diferencia de longitudes ${formato(diferencia)}`,
        };
      }
      case 'proporcion': {
        const descripcion = `${nombreDe(comprobacion.a)}/${nombreDe(comprobacion.b)} = ${nombreDe(comprobacion.c)}/${nombreDe(comprobacion.d)}`;
        const la = longitudDe(puntos, comprobacion.a);
        const lb = longitudDe(puntos, comprobacion.b);
        const lc = longitudDe(puntos, comprobacion.c);
        const ld = longitudDe(puntos, comprobacion.d);
        if (lb < EPS || ld < EPS) {
          return { descripcion, ok: false, detalle: 'un denominador tiene longitud cero' };
        }
        const diferencia = Math.abs(la * ld - lb * lc);
        return {
          descripcion,
          ok: diferencia < TOLERANCIA * Math.max(1, lb * lc),
          detalle: `diferencia de productos cruzados ${formato(diferencia)}`,
        };
      }
      case 'colineales': {
        const [nombreP, nombreQ, nombreR] = comprobacion.puntos;
        const descripcion = `${nombreP}, ${nombreQ} y ${nombreR} están alineados`;
        const p = obtener(puntos, nombreP);
        const q = obtener(puntos, nombreQ);
        if (!direccion(p, q)) {
          return { descripcion, ok: false, detalle: `«${nombreP}» y «${nombreQ}» coinciden` };
        }
        const separacion = distanciaPuntoRecta(obtener(puntos, nombreR), { p, q });
        return { descripcion, ok: separacion < TOLERANCIA, detalle: `distancia a la recta ${formato(separacion)}` };
      }
      case 'paralelas': {
        const [primera, segunda] = comprobacion.rectas;
        const descripcion = `${nombreDe(primera)} ∥ ${nombreDe(segunda)}`;
        const d1 = direccion(obtener(puntos, primera[0]), obtener(puntos, primera[1]));
        const d2 = direccion(obtener(puntos, segunda[0]), obtener(puntos, segunda[1]));
        if (!d1 || !d2) return { descripcion, ok: false, detalle: 'hay dos puntos coincidentes' };
        const producto = Math.abs(cruz(d1, d2));
        return { descripcion, ok: producto < TOLERANCIA, detalle: `producto vectorial ${formato(producto)}` };
      }
      case 'angulo': {
        const descripcion = `el ángulo ${comprobacion.a}${comprobacion.vertice}${comprobacion.b} mide ${comprobacion.grados}°`;
        const actual = anguloEn(puntos, comprobacion.a, comprobacion.vertice, comprobacion.b);
        if (actual === null) return { descripcion, ok: false, detalle: 'hay dos puntos coincidentes' };
        const diferencia = Math.abs(actual - comprobacion.grados);
        return { descripcion, ok: diferencia < TOLERANCIA, detalle: `mide ${actual.toFixed(6)}°` };
      }
      case 'igualAngulo': {
        const [[a1, v1, b1], [a2, v2, b2]] = comprobacion.angulos;
        const descripcion = `${a1}${v1}${b1} = ${a2}${v2}${b2}`;
        const primero = anguloEn(puntos, a1, v1, b1);
        const segundo = anguloEn(puntos, a2, v2, b2);
        if (primero === null || segundo === null) {
          return { descripcion, ok: false, detalle: 'hay dos puntos coincidentes' };
        }
        const diferencia = Math.abs(primero - segundo);
        return {
          descripcion,
          ok: diferencia < TOLERANCIA,
          detalle: `${primero.toFixed(6)}° y ${segundo.toFixed(6)}°`,
        };
      }
```

`Radios` ya es el tipo `Readonly<Record<string, number>>` declarado arriba en el archivo.

- [ ] Paso 5: que `procesarLeccion` pase los radios

En `packages/lecciones/src/procesar.ts`.

Antes:

```ts
    const comprobaciones = ejecutarComprobaciones(validada.leccion, resuelta.puntos);
```

Después:

```ts
    const comprobaciones = ejecutarComprobaciones(validada.leccion, resuelta.puntos, resuelta.radios);
```

- [ ] Paso 6: documentarlas en el vocabulario

En `packages/lecciones/src/vocabulario.ts`, añade al final de `COMPROBACIONES` (antes del `];`):

```ts
  {
    tipo: 'tangente',
    campos: 'recta [P, Q], centro, punto',
    descripcion:
      'Comprueba que la recta PQ es tangente en «punto» a la circunferencia de ese centro que pasa por «punto»: «punto» está en la recta y el radio es perpendicular a ella.',
    ejemplo: { tipo: 'tangente', recta: ['P', 'T'], centro: 'C', punto: 'T' },
  },
  {
    tipo: 'puntoEnCircunferencia',
    campos: 'punto, centro, radio (id de un radio)',
    descripcion: 'Comprueba que «punto» está a la distancia del radio del centro.',
    ejemplo: { tipo: 'puntoEnCircunferencia', punto: 'T', centro: 'C', radio: 'r' },
  },
  {
    tipo: 'igualLongitud',
    campos: 'segmentos [[P, Q], [R, S]]',
    descripcion: 'Comprueba que los segmentos PQ y RS miden lo mismo.',
    ejemplo: { tipo: 'igualLongitud', segmentos: [['A', 'O'], ['O', 'B']] },
  },
  {
    tipo: 'proporcion',
    campos: 'a [P, Q], b [R, S], c [T, U], d [V, W]',
    descripcion: 'Comprueba la proporción PQ/RS = TU/VW (los cuatro segmentos con longitud mayor que cero en los denominadores).',
    ejemplo: { tipo: 'proporcion', a: ['O', 'A'], b: ['O', 'B'], c: ['O', 'C'], d: ['O', 'X'] },
  },
  {
    tipo: 'colineales',
    campos: 'puntos [P, Q, R]',
    descripcion: 'Comprueba que los tres puntos están alineados. P y Q no pueden coincidir.',
    ejemplo: { tipo: 'colineales', puntos: ['M', 'N', 'P'] },
  },
  {
    tipo: 'paralelas',
    campos: 'rectas [[P, Q], [R, S]]',
    descripcion: 'Comprueba que las rectas PQ y RS son paralelas.',
    ejemplo: { tipo: 'paralelas', rectas: [['A', 'B'], ['P', 'Q']] },
  },
  {
    tipo: 'angulo',
    campos: 'vertice, a, b, grados (de 0 a 180)',
    descripcion: 'Comprueba que el ángulo con vértice en «vertice» y lados hacia «a» y «b» mide esos grados.',
    ejemplo: { tipo: 'angulo', vertice: 'B', a: 'A', b: 'C', grados: 120 },
  },
  {
    tipo: 'igualAngulo',
    campos: 'angulos [[a1, vertice1, b1], [a2, vertice2, b2]]',
    descripcion:
      'Comprueba que los dos ángulos miden lo mismo. Cada ángulo se escribe como [punto de un lado, vértice, punto del otro lado].',
    ejemplo: { tipo: 'igualAngulo', angulos: [['P', 'V', 'Z'], ['Z', 'V', 'Q']] },
  },
```

- [ ] Paso 7: regenerar, ejecutar los tests y comprobar tipos

```bash
pnpm prompt
pnpm test
pnpm typecheck
```

Esperado: los 21 tests nuevos de `comprobaciones-nuevas.test.ts` pasan (16 casos, 2 de casos límite y 3 de validación) y el resto sigue en verde.

- [ ] Paso 8: confirmar

```bash
git add packages/lecciones generacion
git commit -m "feat(lecciones): comprobaciones de tangencia, proporcion, alineacion, paralelismo y angulos"
```

## Tarea 5: el temario, su comando y la guía de revisión

Archivos:

- Crear: `temario/temario.json`, `packages/lecciones/src/temario.ts`, `packages/lecciones/src/temario-cli.ts`
- Modificar: `packages/lecciones/src/index.ts`, `packages/lecciones/package.json`, `package.json`, `generacion/LEEME.md`
- Test: `packages/lecciones/test/temario.test.ts`, `packages/lecciones/test/temario-real.test.ts`

Interfaces:

- Consume: `comprobacionSchema`, `Leccion`, `BLOQUES_PRIORITARIOS` (de `estado.ts`), `BLOQUES_TEMARIO` (de `vocabulario.ts`), `listarContenido` y `RAIZ_REPOSITORIO` (de `almacen.ts`), `formatearIssue` (de `validar.ts`).
- Produce (todo exportado desde `@traze/lecciones`): `TIPOS_COMPROBACION`, `MAX_CARACTERES_CONSEJO`, `temarioSchema`, `Temario`, `EntradaTemario`, `comprobarCobertura(temario, lecciones): Cobertura`, `Cobertura`, `encargoDe(entrada, publicadas): string`, `agruparPorBloque(temario, publicadas): BloqueDeMapa[]`, `BloqueDeMapa`, `EntradaDeMapa`, `vecinas(temario, publicadas, id)`, `comprobarRevision(lecciones)`, `formatearTemario(temario, cobertura)`. Comando `pnpm temario`.

El temario es la única fuente de verdad de qué lecciones hay, en qué orden, con qué requisitos y qué debe verificar cada una. Lo usan el comando, el build de la web y el mapa.

- [ ] Paso 1: escribir el test de las funciones puras (falla)

`packages/lecciones/test/temario.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import type { Leccion } from '../src/esquema';
import {
  MAX_CARACTERES_CONSEJO,
  agruparPorBloque,
  comprobarCobertura,
  comprobarRevision,
  encargoDe,
  formatearTemario,
  temarioSchema,
  vecinas,
  type Temario,
} from '../src/temario';
import { validarLeccion } from '../src/validar';

const ENCARGO = 'Traza el resultado con regla y compás y explica la propiedad que lo sostiene.';

function entrada(id: string, bloque: number, requisitos: string[] = [], exige = ['equidistante']) {
  return { id, bloque, titulo: `Título de ${id}`, requisitos, encargo: ENCARGO, exige };
}

function temarioCon(...entradas: ReturnType<typeof entrada>[]): Temario {
  return temarioSchema.parse({ lecciones: entradas });
}

const TEMARIO = temarioCon(
  entrada('mediatriz-segmento', 1, [], ['equidistante', 'perpendicular']),
  entrada('bisectriz-angulo', 1, ['mediatriz-segmento']),
  entrada('tangente-recta', 5, ['bisectriz-angulo']),
);

function leccion(id: string, bloque: number, cambios: Record<string, unknown> = {}): Leccion {
  const datos: any = { ...structuredClone(piloto), id, bloque, ...cambios };
  const resultado = validarLeccion(datos);
  if (!resultado.ok) throw new Error(resultado.errores.join('\n'));
  return resultado.leccion;
}

const REVISADA = { version: 1, revision: 'revisada', revisadaPor: 'Ana', revisadaEl: '2026-10-12' };

describe('temarioSchema', () => {
  it('acepta un temario ordenado', () => {
    expect(temarioSchema.safeParse(TEMARIO).success).toBe(true);
  });

  function errores(entradas: unknown[]): string[] {
    const r = temarioSchema.safeParse({ lecciones: entradas });
    return r.success ? [] : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  }

  it('rechaza un id repetido', () => {
    expect(errores([entrada('a', 1), entrada('a', 1)])).toEqual([
      'lecciones.1.id: el id «a» está repetido',
    ]);
  });

  it('rechaza un requisito que no aparece antes en el temario', () => {
    expect(errores([entrada('a', 1, ['b']), entrada('b', 1)])).toEqual([
      'lecciones.0.requisitos.0: «b» debe aparecer antes en el temario',
    ]);
  });

  it('rechaza un temario desordenado por bloques', () => {
    expect(errores([entrada('a', 5), entrada('b', 1)])).toEqual([
      'lecciones.1.bloque: el temario va ordenado por bloques',
    ]);
  });

  it('rechaza una comprobación exigida que no existe en el vocabulario', () => {
    const mensajes = errores([entrada('a', 1, [], ['magia'])]);
    expect(mensajes).toEqual(['lecciones.0.exige.0: no es un tipo de comprobación del vocabulario']);
  });
});

describe('comprobarCobertura', () => {
  it('separa publicadas y pendientes, y no da errores ni avisos', () => {
    const cobertura = comprobarCobertura(TEMARIO, [leccion('mediatriz-segmento', 1)]);
    expect(cobertura.errores).toEqual([]);
    expect(cobertura.avisos).toEqual([]);
    expect(cobertura.publicadas).toEqual(['mediatriz-segmento']);
    expect(cobertura.pendientes).toEqual(['bisectriz-angulo', 'tangente-recta']);
  });

  it('rechaza una lección que no figura en el temario', () => {
    expect(comprobarCobertura(TEMARIO, [leccion('otra', 1)]).errores).toEqual([
      '«otra» no figura en el temario',
    ]);
  });

  it('rechaza una lección en otro bloque', () => {
    const cobertura = comprobarCobertura(TEMARIO, [
      leccion('bisectriz-angulo', 2, { requisitos: ['mediatriz-segmento'] }),
    ]);
    expect(cobertura.errores).toEqual([
      '«bisectriz-angulo»: está en el bloque 2 y el temario la sitúa en el 1',
    ]);
  });

  it('rechaza una lección sin una comprobación exigida', () => {
    const temario = temarioCon(entrada('mediatriz-segmento', 1, [], ['equidistante', 'tangente']));
    expect(comprobarCobertura(temario, [leccion('mediatriz-segmento', 1)]).errores).toEqual([
      '«mediatriz-segmento»: falta una comprobación de tipo «tangente»',
    ]);
  });

  it('rechaza requisitos distintos de los del temario', () => {
    const cobertura = comprobarCobertura(TEMARIO, [leccion('bisectriz-angulo', 1, { requisitos: [] })]);
    expect(cobertura.errores).toEqual([
      '«bisectriz-angulo»: los requisitos de la lección (ninguno) no coinciden con los del temario (mediatriz-segmento)',
    ]);
  });

  it('avisa de un consejo demasiado largo', () => {
    const datos: any = structuredClone(piloto);
    datos.pasos[0].consejo = 'x'.repeat(MAX_CARACTERES_CONSEJO + 1);
    const cobertura = comprobarCobertura(TEMARIO, [leccion('mediatriz-segmento', 1, { pasos: datos.pasos })]);
    expect(cobertura.errores).toEqual([]);
    expect(cobertura.avisos).toEqual([
      `«mediatriz-segmento» paso 1: el consejo tiene ${MAX_CARACTERES_CONSEJO + 1} caracteres (máximo recomendado ${MAX_CARACTERES_CONSEJO})`,
    ]);
  });
});

describe('encargoDe', () => {
  it('compone el texto que se pega en Claude', () => {
    const texto = encargoDe(TEMARIO.lecciones[1], ['mediatriz-segmento']);
    expect(texto.split('\n')).toEqual([
      'Genera la lección «Título de bisectriz-angulo».',
      'id: bisectriz-angulo · bloque: 1 (Trazados fundamentales)',
      'requisitos: mediatriz-segmento',
      '',
      ENCARGO,
      '',
      'La lección debe incluir comprobaciones de estos tipos: equidistante.',
      'Entre 6 y 10 pasos, cada uno con consejo, y 2 o 3 errores frecuentes.',
    ]);
  });

  it('avisa de un requisito que todavía no existe', () => {
    const texto = encargoDe(TEMARIO.lecciones[2], []);
    expect(texto).toContain('requisitos: bisectriz-angulo (todavía no existe)');
  });

  it('dice «ninguno» cuando no hay requisitos', () => {
    expect(encargoDe(TEMARIO.lecciones[0], [])).toContain('requisitos: ninguno');
  });
});

describe('agruparPorBloque y vecinas', () => {
  const publicadas = new Set(['mediatriz-segmento', 'tangente-recta']);

  it('agrupa por bloque con su nombre y marca las publicadas', () => {
    expect(agruparPorBloque(TEMARIO, publicadas)).toEqual([
      {
        bloque: 1,
        nombre: 'Trazados fundamentales',
        lecciones: [
          { id: 'mediatriz-segmento', titulo: 'Título de mediatriz-segmento', publicada: true, requisitos: [] },
          {
            id: 'bisectriz-angulo',
            titulo: 'Título de bisectriz-angulo',
            publicada: false,
            requisitos: ['mediatriz-segmento'],
          },
        ],
      },
      {
        bloque: 5,
        nombre: 'Tangencias y enlaces',
        lecciones: [
          {
            id: 'tangente-recta',
            titulo: 'Título de tangente-recta',
            publicada: true,
            requisitos: ['bisectriz-angulo'],
          },
        ],
      },
    ]);
  });

  it('da la anterior y la siguiente entre las publicadas, saltando las pendientes', () => {
    expect(vecinas(TEMARIO, publicadas, 'mediatriz-segmento')).toEqual({
      anterior: null,
      siguiente: TEMARIO.lecciones[2],
    });
    expect(vecinas(TEMARIO, publicadas, 'tangente-recta')).toEqual({
      anterior: TEMARIO.lecciones[0],
      siguiente: null,
    });
  });

  it('devuelve vacío para una lección que no está publicada', () => {
    expect(vecinas(TEMARIO, publicadas, 'bisectriz-angulo')).toEqual({ anterior: null, siguiente: null });
  });
});

describe('comprobarRevision', () => {
  it('exige revisar todas las prioritarias y una de cada tres de las demás', () => {
    const lecciones = [
      leccion('a', 1, { meta: REVISADA }),
      leccion('b', 1),
      leccion('c', 2),
      leccion('d', 5),
      leccion('e', 7, { meta: REVISADA }),
    ];
    expect(comprobarRevision(lecciones)).toEqual({
      ok: false,
      faltan: ['d: bloque 5, prioritaria y sin revisar'],
    });
  });

  it('pide más revisiones de muestra si no llegan a una de cada tres', () => {
    const lecciones = [leccion('a', 1), leccion('b', 1), leccion('c', 2), leccion('d', 3)];
    expect(comprobarRevision(lecciones)).toEqual({
      ok: false,
      faltan: ['revisión de muestra: 0 de 2 lecciones (una de cada tres) revisadas en los demás bloques'],
    });
  });

  it('da por buena una revisión completa', () => {
    const lecciones = [leccion('a', 1, { meta: REVISADA }), leccion('b', 1), leccion('c', 5, { meta: REVISADA })];
    expect(comprobarRevision(lecciones)).toEqual({ ok: true, faltan: [] });
  });
});

describe('formatearTemario', () => {
  it('lista el temario por bloques, con errores y avisos', () => {
    const cobertura = comprobarCobertura(TEMARIO, [leccion('mediatriz-segmento', 1), leccion('otra', 1)]);
    expect(formatearTemario(TEMARIO, cobertura).split('\n')).toEqual([
      'Temario: 1 de 3 lecciones generadas',
      '',
      'Bloque 1 · Trazados fundamentales',
      '  ✔ mediatriz-segmento',
      '  · bisectriz-angulo (pendiente)',
      '',
      'Bloque 5 · Tangencias y enlaces',
      '  · tangente-recta (pendiente)',
      '',
      'Errores:',
      '- «otra» no figura en el temario',
    ]);
  });
});
```

- [ ] Paso 2: ejecutar el test y comprobar que falla

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `temario.test.ts` FALLA porque `../src/temario` no existe.

- [ ] Paso 3: escribir el módulo del temario

`packages/lecciones/src/temario.ts`:

```ts
import { z } from 'zod';
import { comprobacionSchema, type Leccion } from './esquema';
import { BLOQUES_PRIORITARIOS } from './estado';
import { BLOQUES_TEMARIO } from './vocabulario';

export const MAX_CARACTERES_CONSEJO = 160;

export const TIPOS_COMPROBACION: readonly string[] = (
  comprobacionSchema.options as readonly { shape: { tipo: { value: string } } }[]
).map((opcion) => opcion.shape.tipo.value);

export const entradaTemarioSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'el id va en minúsculas y con guiones'),
  bloque: z.number().int().min(0).max(9),
  titulo: z.string().min(1),
  requisitos: z.array(z.string()),
  encargo: z.string().min(40, 'el encargo debe explicar el trazado con detalle'),
  exige: z
    .array(
      z.string().refine((tipo) => TIPOS_COMPROBACION.includes(tipo), {
        message: 'no es un tipo de comprobación del vocabulario',
      }),
    )
    .min(1),
});

export const temarioSchema = z
  .object({ lecciones: z.array(entradaTemarioSchema).min(1) })
  .superRefine((temario, ctx) => {
    const vistos = new Set<string>();
    temario.lecciones.forEach((entrada, i) => {
      if (vistos.has(entrada.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lecciones', i, 'id'],
          message: `el id «${entrada.id}» está repetido`,
        });
      }
      entrada.requisitos.forEach((requisito, j) => {
        if (!vistos.has(requisito)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['lecciones', i, 'requisitos', j],
            message: `«${requisito}» debe aparecer antes en el temario`,
          });
        }
      });
      if (i > 0 && entrada.bloque < temario.lecciones[i - 1].bloque) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lecciones', i, 'bloque'],
          message: 'el temario va ordenado por bloques',
        });
      }
      vistos.add(entrada.id);
    });
  });

export type Temario = z.infer<typeof temarioSchema>;
export type EntradaTemario = Temario['lecciones'][number];

export interface Cobertura {
  errores: string[];
  avisos: string[];
  publicadas: string[];
  pendientes: string[];
}

const listar = (ids: readonly string[]): string => (ids.length === 0 ? 'ninguno' : ids.join(', '));

export function comprobarCobertura(temario: Temario, lecciones: readonly Leccion[]): Cobertura {
  const errores: string[] = [];
  const avisos: string[] = [];
  const porId = new Map(temario.lecciones.map((entrada) => [entrada.id, entrada] as const));
  const presentes = new Set<string>();

  for (const leccion of lecciones) {
    const entrada = porId.get(leccion.id);
    if (!entrada) {
      errores.push(`«${leccion.id}» no figura en el temario`);
      continue;
    }
    presentes.add(leccion.id);

    if (leccion.bloque !== entrada.bloque) {
      errores.push(
        `«${leccion.id}»: está en el bloque ${leccion.bloque} y el temario la sitúa en el ${entrada.bloque}`,
      );
    }

    if ([...leccion.requisitos].sort().join() !== [...entrada.requisitos].sort().join()) {
      errores.push(
        `«${leccion.id}»: los requisitos de la lección (${listar(leccion.requisitos)}) no coinciden con los del temario (${listar(entrada.requisitos)})`,
      );
    }

    const tipos = new Set(leccion.comprobaciones.map((comprobacion) => comprobacion.tipo as string));
    for (const tipo of entrada.exige) {
      if (!tipos.has(tipo)) errores.push(`«${leccion.id}»: falta una comprobación de tipo «${tipo}»`);
    }

    if (leccion.pasos.length < 6) {
      avisos.push(`«${leccion.id}»: tiene ${leccion.pasos.length} pasos; lo habitual son de 6 a 10`);
    }
    leccion.pasos.forEach((paso, i) => {
      if (paso.consejo && paso.consejo.length > MAX_CARACTERES_CONSEJO) {
        avisos.push(
          `«${leccion.id}» paso ${i + 1}: el consejo tiene ${paso.consejo.length} caracteres (máximo recomendado ${MAX_CARACTERES_CONSEJO})`,
        );
      }
    });
  }

  const ids = temario.lecciones.map((entrada) => entrada.id);
  return {
    errores,
    avisos,
    publicadas: ids.filter((id) => presentes.has(id)),
    pendientes: ids.filter((id) => !presentes.has(id)),
  };
}

export function nombreDeBloque(bloque: number): string {
  return BLOQUES_TEMARIO[bloque];
}

export function encargoDe(entrada: EntradaTemario, publicadas: readonly string[]): string {
  const requisitos =
    entrada.requisitos.length === 0
      ? 'ninguno'
      : entrada.requisitos
          .map((id) => (publicadas.includes(id) ? id : `${id} (todavía no existe)`))
          .join(', ');
  return [
    `Genera la lección «${entrada.titulo}».`,
    `id: ${entrada.id} · bloque: ${entrada.bloque} (${nombreDeBloque(entrada.bloque)})`,
    `requisitos: ${requisitos}`,
    '',
    entrada.encargo,
    '',
    `La lección debe incluir comprobaciones de estos tipos: ${entrada.exige.join(', ')}.`,
    'Entre 6 y 10 pasos, cada uno con consejo, y 2 o 3 errores frecuentes.',
  ].join('\n');
}

export interface EntradaDeMapa {
  id: string;
  titulo: string;
  publicada: boolean;
  requisitos: string[];
}

export interface BloqueDeMapa {
  bloque: number;
  nombre: string;
  lecciones: EntradaDeMapa[];
}

export function agruparPorBloque(temario: Temario, publicadas: ReadonlySet<string>): BloqueDeMapa[] {
  const bloques: BloqueDeMapa[] = [];
  for (const entrada of temario.lecciones) {
    let actual = bloques.find((bloque) => bloque.bloque === entrada.bloque);
    if (!actual) {
      actual = { bloque: entrada.bloque, nombre: nombreDeBloque(entrada.bloque), lecciones: [] };
      bloques.push(actual);
    }
    actual.lecciones.push({
      id: entrada.id,
      titulo: entrada.titulo,
      publicada: publicadas.has(entrada.id),
      requisitos: [...entrada.requisitos],
    });
  }
  return bloques;
}

export function vecinas(
  temario: Temario,
  publicadas: ReadonlySet<string>,
  id: string,
): { anterior: EntradaTemario | null; siguiente: EntradaTemario | null } {
  const visibles = temario.lecciones.filter((entrada) => publicadas.has(entrada.id));
  const posicion = visibles.findIndex((entrada) => entrada.id === id);
  if (posicion === -1) return { anterior: null, siguiente: null };
  return { anterior: visibles[posicion - 1] ?? null, siguiente: visibles[posicion + 1] ?? null };
}

export function comprobarRevision(lecciones: readonly Leccion[]): { ok: boolean; faltan: string[] } {
  const faltan: string[] = [];
  const revisada = (leccion: Leccion): boolean => leccion.meta.revision === 'revisada';
  const prioritarias = lecciones.filter((leccion) => BLOQUES_PRIORITARIOS.includes(leccion.bloque));
  const otras = lecciones.filter((leccion) => !BLOQUES_PRIORITARIOS.includes(leccion.bloque));

  for (const leccion of prioritarias) {
    if (!revisada(leccion)) {
      faltan.push(`${leccion.id}: bloque ${leccion.bloque}, prioritaria y sin revisar`);
    }
  }

  const necesarias = Math.ceil(otras.length / 3);
  const hechas = otras.filter(revisada).length;
  if (hechas < necesarias) {
    faltan.push(
      `revisión de muestra: ${hechas} de ${necesarias} lecciones (una de cada tres) revisadas en los demás bloques`,
    );
  }
  return { ok: faltan.length === 0, faltan };
}

export function formatearTemario(temario: Temario, cobertura: Cobertura): string {
  const lineas = [
    `Temario: ${cobertura.publicadas.length} de ${temario.lecciones.length} lecciones generadas`,
  ];
  for (const bloque of agruparPorBloque(temario, new Set(cobertura.publicadas))) {
    lineas.push('', `Bloque ${bloque.bloque} · ${bloque.nombre}`);
    for (const leccion of bloque.lecciones) {
      lineas.push(leccion.publicada ? `  ✔ ${leccion.id}` : `  · ${leccion.id} (pendiente)`);
    }
  }
  if (cobertura.errores.length > 0) {
    lineas.push('', 'Errores:', ...cobertura.errores.map((error) => `- ${error}`));
  }
  if (cobertura.avisos.length > 0) {
    lineas.push('', 'Avisos:', ...cobertura.avisos.map((aviso) => `- ${aviso}`));
  }
  return lineas.join('\n');
}
```

En `packages/lecciones/src/index.ts`, añade al final:

```ts
export * from './temario';
```

- [ ] Paso 4: ejecutar el test y comprobar que pasa

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: los 21 tests de `temario.test.ts` pasan (5 del esquema, 6 de cobertura, 3 de encargo, 3 de agrupación y vecinas, 3 de revisión y 1 de formato).

- [ ] Paso 5: escribir `temario/temario.json`

Crea `temario/temario.json` con este contenido exacto. Los encargos son lo único que el agente sabrá de cada lección además del vocabulario: describen el método, nombran los derivados que conviene usar y las comprobaciones que pide la propiedad geométrica.

```json
{
  "lecciones": [
    {
      "id": "compas-basico",
      "bloque": 0,
      "titulo": "Uso del compás: transportar un segmento",
      "requisitos": [],
      "encargo": "Transporta con el compás un segmento dado AB sobre una semirrecta de origen C. Datos: A, B y los puntos C y E, que fijan la semirrecta CE. Define un radio igual a AB (entre A y B, factor 1) y sitúa con un derivado el punto D de la semirrecta a esa distancia de C. Explica cómo se pincha el compás en C, cómo se copia la abertura sin cambiarla y por qué el arco corta a la semirrecta en D con CD = AB. Insiste en los consejos de material (mina afilada, compás firme) y de técnica del compás.",
      "exige": ["igualLongitud", "colineales"]
    },
    {
      "id": "mediatriz-segmento",
      "bloque": 1,
      "titulo": "Mediatriz de un segmento",
      "requisitos": [],
      "encargo": "Lección piloto ya publicada: la mediatriz de un segmento AB con regla y compás. No se regenera salvo que cambie el vocabulario.",
      "exige": ["equidistante", "perpendicular", "pasaPorPuntoMedio"]
    },
    {
      "id": "dividir-segmento-dos-partes",
      "bloque": 1,
      "titulo": "Dividir un segmento en dos partes iguales",
      "requisitos": [],
      "encargo": "Lección ya publicada (resultado de la prueba real del Plan 2): dividir un segmento AB en dos partes iguales hallando su punto medio O con la mediatriz. No se regenera salvo que cambie el vocabulario.",
      "exige": ["equidistante", "perpendicular", "pasaPorPuntoMedio"]
    },
    {
      "id": "bisectriz-angulo",
      "bloque": 1,
      "titulo": "Bisectriz de un ángulo",
      "requisitos": ["compas-basico"],
      "encargo": "Traza la bisectriz de un ángulo de vértice V y lados VP y VQ. Un arco con centro en V corta los lados en X e Y (puntoEnDireccion con un radio fijo en mm, en las direcciones VP y VQ). Dos arcos del mismo radio con centros en X e Y, mayor que la mitad de XY, se cortan en Z (cortesCirculos; elige el corte que queda dentro del ángulo). La bisectriz es la recta VZ. Idea clave: los puntos de la bisectriz equidistan de los dos lados. Comprueba que los ángulos XVZ y ZVY son iguales.",
      "exige": ["igualAngulo"]
    },
    {
      "id": "perpendicular-por-punto",
      "bloque": 1,
      "titulo": "Perpendicular a una recta por un punto exterior",
      "requisitos": ["mediatriz-segmento"],
      "encargo": "Traza la perpendicular a una recta r (datos A y B) por un punto exterior P. Un arco con centro en P y radio mayor que la distancia de P a r la corta en X e Y (interseccionRectaArco). Desde X e Y, dos arcos del mismo radio se cortan en M y N (cortesCirculos). La recta MN pasa por P y es la perpendicular. Idea clave: P está a igual distancia de X e Y, luego está en la mediatriz de XY, que es perpendicular a r. Marca el ángulo recto. Comprueba que MN es perpendicular a AB y que M, N y P están alineados.",
      "exige": ["perpendicular", "colineales"]
    },
    {
      "id": "paralela-por-punto",
      "bloque": 1,
      "titulo": "Paralela a una recta por un punto",
      "requisitos": ["compas-basico"],
      "encargo": "Traza la paralela a una recta AB por un punto P exterior con regla y compás completando el paralelogramo ABQP. Q es un corte de un arco con centro en P y radio AB y de un arco con centro en B y radio AP (cortesCirculos con dos radios definidos con «entre»; elige el corte que deja el paralelogramo sin cruzarse). La paralela es PQ. Idea clave: los lados opuestos de un paralelogramo son iguales y paralelos. Comprueba que PQ es paralela a AB y que PQ = AB.",
      "exige": ["paralelas", "igualLongitud"]
    },
    {
      "id": "division-segmento-thales",
      "bloque": 1,
      "titulo": "División de un segmento con el teorema de Thales",
      "requisitos": ["paralela-por-punto"],
      "encargo": "Divide un segmento AB en tres partes iguales con el teorema de Thales. Desde A traza una semirrecta auxiliar AC (dato C). Con una abertura fija del compás (radio en mm) lleva tres veces la misma medida sobre ella con puntoEnDireccion encadenado y obtén P1, P2 y P3. Une P3 con B. Las paralelas a P3B por P2 y P1 (puntoEnDireccion con la dirección [P3, B] e interseccionRectas con AB) cortan a AB en D2 y D1. Idea clave: tres paralelas cortan a dos secantes en segmentos proporcionales. Comprueba que AD1, D1D2 y D2B son iguales y que AD1/AB = AP1/AP3.",
      "exige": ["proporcion", "igualLongitud"]
    },
    {
      "id": "arco-capaz",
      "bloque": 1,
      "titulo": "Arco capaz de un ángulo",
      "requisitos": ["mediatriz-segmento", "perpendicular-por-punto", "bisectriz-angulo"],
      "encargo": "Traza el arco capaz de un ángulo α sobre un segmento AB: el lugar de los puntos desde los que AB se ve bajo el ángulo α. El ángulo viene dado por tres datos V, P y Q. Traslada α a A: arcos del mismo radio con centros en V y en A y cortesCirculos dan el segundo lado AY. Traza la perpendicular a AY por A y la mediatriz de AB: su corte es el centro O. El arco capaz es el arco de centro O entre A y B por el lado de un punto X, corte de la mediatriz con la circunferencia (arcoEntre con pasaPor). Idea clave: ángulo central doble que el inscrito. Comprueba que el ángulo AXB es igual al ángulo PVQ y que X está en la circunferencia. Si no cabe en 10 pasos, divide la lección en dos y actualiza el temario.",
      "exige": ["igualAngulo", "puntoEnCircunferencia"]
    },
    {
      "id": "circuncentro-triangulo",
      "bloque": 2,
      "titulo": "Circuncentro y circunferencia circunscrita",
      "requisitos": ["mediatriz-segmento"],
      "encargo": "Halla el circuncentro de un triángulo acutángulo ABC y dibuja su circunferencia circunscrita. Traza las mediatrices de AB y BC (cortesCirculos con radio mayor que la mitad del lado); su corte O (interseccionRectas) equidista de los tres vértices. Define el radio entre O y A y dibuja la circunferencia como un arco con centro O hacia A y amplitud 3.14159. Idea clave: el circuncentro es el centro de la circunferencia que pasa por los tres vértices. Comprueba que OA = OB = OC y que A, B y C están en la circunferencia.",
      "exige": ["equidistante", "puntoEnCircunferencia"]
    },
    {
      "id": "hexagono-regular",
      "bloque": 2,
      "titulo": "Hexágono regular inscrito",
      "requisitos": ["compas-basico"],
      "encargo": "Traza un hexágono regular inscrito en una circunferencia de centro O y radio R (datos O y A, con A en la circunferencia; define el radio entre O y A, factor 1). El lado del hexágono es igual al radio: con el mismo radio y centros en O y en cada vértice se obtienen B, C, D, E y F (cortesCirculos con dos radios iguales a R; en cada corte, uno de los dos puntos es el vértice anterior). Une los vértices con segmentos de resultado. Idea clave: el triángulo OAB es equilátero. Comprueba que los seis lados son iguales, que los vértices están en la circunferencia y que el ángulo interior mide 120°.",
      "exige": ["igualLongitud", "puntoEnCircunferencia", "angulo"]
    },
    {
      "id": "pentagono-regular",
      "bloque": 2,
      "titulo": "Pentágono regular inscrito",
      "requisitos": ["mediatriz-segmento", "perpendicular-por-punto"],
      "encargo": "Traza un pentágono regular inscrito en una circunferencia de centro O. Datos: O, B (extremo derecho de un diámetro horizontal) y C (extremo superior del diámetro vertical), con OB = OC = R. Método clásico: M es el punto medio de OB; el arco con centro M y radio MC corta al diámetro por el lado izquierdo en N (interseccionRectaArco); el lado del pentágono es CN. Lleva el lado con el compás sobre la circunferencia a partir de C (cortesCirculos con centros C y O y radios CN y R; repite desde cada vértice). Idea clave: CN es el lado del pentágono inscrito. Comprueba que los cinco lados son iguales, que los vértices están en la circunferencia y que el ángulo interior mide 108°. Si no cabe en 10 pasos, agrupa varios arcos por paso.",
      "exige": ["igualLongitud", "puntoEnCircunferencia", "angulo"]
    },
    {
      "id": "cuarta-proporcional",
      "bloque": 3,
      "titulo": "Cuarta proporcional",
      "requisitos": ["division-segmento-thales"],
      "encargo": "Halla la cuarta proporcional x de tres segmentos a, b y c: a/b = c/x. Datos: O y los puntos A y B sobre una semirrecta (OA = a, OB = b) y C sobre otra semirrecta de origen O (OC = c). Une A con C. La paralela a AC por B (puntoEnDireccion con la dirección [A, C] e interseccionRectas con la semirrecta OC) corta a esta en X, y OX es x. Idea clave: el teorema de Thales. Comprueba que OA/OB = OC/OX y que BX es paralela a AC.",
      "exige": ["proporcion", "paralelas"]
    },
    {
      "id": "media-proporcional",
      "bloque": 3,
      "titulo": "Media proporcional",
      "requisitos": ["perpendicular-por-punto"],
      "encargo": "Halla la media proporcional h de dos segmentos m y n: m/h = h/n. Sobre una recta lleva los segmentos consecutivos AJ = m y JB = n (datos A, J y B). O es el punto medio de AB (puntoMedio). Dibuja la semicircunferencia de diámetro AB (arcoEntre con pasaPor). La perpendicular a AB por J (puntoEnDireccion con perpendicular) corta a la semicircunferencia en H (interseccionRectaArco; elige el corte del lado de la semicircunferencia). JH es la media proporcional. Idea clave: en un triángulo rectángulo, la altura es media proporcional entre las proyecciones de los catetos. Comprueba que AJ/JH = JH/JB y que H está en la circunferencia.",
      "exige": ["proporcion", "puntoEnCircunferencia"]
    },
    {
      "id": "seccion-aurea",
      "bloque": 3,
      "titulo": "Sección áurea de un segmento",
      "requisitos": ["media-proporcional"],
      "encargo": "Divide un segmento AB en media y extrema razón (sección áurea): AB/AC = AC/CB. Método clásico: por B traza la perpendicular a AB y lleva sobre ella BD = AB/2 (puntoEnDireccion con perpendicular y un radio entre A y B con factor 0.5). Une A con D. El arco con centro D y radio DB corta a AD en E, el corte más próximo a A (interseccionRectaArco). El arco con centro A y radio AE corta a AB en C, el corte de la derecha de A (interseccionRectaArco con la recta AB). Idea clave: C divide AB de modo que el todo es a la parte mayor como la parte mayor es a la menor. Comprueba que AB/AC = AC/CB.",
      "exige": ["proporcion"]
    },
    {
      "id": "simetria-axial",
      "bloque": 4,
      "titulo": "Simetría axial de un triángulo",
      "requisitos": ["perpendicular-por-punto"],
      "encargo": "Dibuja el simétrico de un triángulo ABC respecto de un eje e (datos E1 y E2, que fijan la recta). Para cada vértice, traza la perpendicular al eje (derivado pie) y lleva con el compás la misma distancia al otro lado (derivado simetrico, ids A', B' y C'). Une los simétricos. Idea clave: el eje es la mediatriz de cada segmento que une un punto con su simétrico. Comprueba que AA' es perpendicular al eje, que el eje pasa por el punto medio de AA' y que los lados correspondientes son iguales (AB = A'B').",
      "exige": ["perpendicular", "pasaPorPuntoMedio", "igualLongitud"]
    },
    {
      "id": "homotecia",
      "bloque": 4,
      "titulo": "Homotecia de un triángulo",
      "requisitos": ["paralela-por-punto"],
      "encargo": "Aplica a un triángulo ABC una homotecia de centro O y razón 2 (derivado homotetico, ids A', B' y C'). Traza las rectas OA, OB y OC y lleva con el compás cada distancia desde el vértice (puntoEnDireccion con un radio entre O y el vértice). Une A', B' y C'. Elige los datos para que el triángulo ampliado quepa en el lienzo. Idea clave: la homotecia conserva los ángulos, multiplica las longitudes por la razón y da lados paralelos. Comprueba que O, A y A' están alineados, que OA'/OA = OB'/OB y que A'B' es paralela a AB.",
      "exige": ["colineales", "proporcion", "paralelas"]
    },
    {
      "id": "tangente-en-punto",
      "bloque": 5,
      "titulo": "Tangente a una circunferencia en uno de sus puntos",
      "requisitos": ["perpendicular-por-punto"],
      "encargo": "Traza la tangente a una circunferencia de centro C en uno de sus puntos T (datos C y T; define el radio entre C y T). La tangente es perpendicular al radio CT en T: dibuja la circunferencia (arco con amplitud 3.14159) y el radio y, por T, la perpendicular con puntoEnDireccion (direccion [C, T], perpendicular: true, un radio en mm y sentido 1 y -1 para los dos extremos). Marca el ángulo recto y el punto de tangencia. Idea clave: la tangente es perpendicular al radio en el punto de tangencia. Comprueba que la recta es tangente en T y que T está en la circunferencia.",
      "exige": ["tangente", "puntoEnCircunferencia"]
    },
    {
      "id": "tangentes-desde-punto-exterior",
      "bloque": 5,
      "titulo": "Tangentes desde un punto exterior",
      "requisitos": ["tangente-en-punto", "mediatriz-segmento"],
      "encargo": "Traza las tangentes a una circunferencia de centro C (que pasa por D) desde un punto exterior P. M es el punto medio de PC (puntoMedio). El arco con centro M y radio MC (radio entre M y C) corta a la circunferencia en T1 y T2 (cortesCirculos con centros C y M y los radios CD y MC). Las rectas PT1 y PT2 son las tangentes. Idea clave: el ángulo C T1 P está inscrito en una semicircunferencia de diámetro PC, luego mide 90°. Marca los puntos de tangencia y los ángulos rectos. Comprueba que las dos rectas son tangentes en T1 y T2, que T1 y T2 están en la circunferencia y que el ángulo CT1P mide 90°.",
      "exige": ["tangente", "puntoEnCircunferencia", "angulo"]
    },
    {
      "id": "enlace-dos-rectas",
      "bloque": 5,
      "titulo": "Enlace de dos rectas con un arco",
      "requisitos": ["tangente-en-punto", "paralela-por-punto"],
      "encargo": "Enlaza dos rectas que se cortan en V (datos V, A en una y B en la otra) con un arco de radio R dado (radio fijo en mm). El centro O está a distancia R de las dos rectas: traza la paralela a cada recta a distancia R (puntoEnDireccion con perpendicular: true y el radio R, y un segundo puntoEnDireccion para tener dos puntos de cada paralela) y su corte es O (interseccionRectas). Elige el lado para que O quede dentro del ángulo AVB. Los puntos de tangencia T1 y T2 son los pies de las perpendiculares desde O a las rectas (pie). Dibuja el arco de centro O entre T1 y T2 (arcoEntre, estilo resultado). Marca T1 y T2. Idea clave: el centro del enlace equidista R de las dos rectas y los puntos de tangencia son los pies de las perpendiculares. Comprueba que las dos rectas son tangentes al arco en T1 y T2 y que OT1 = OT2.",
      "exige": ["tangente", "igualLongitud"]
    },
    {
      "id": "ovalo-eje-mayor",
      "bloque": 6,
      "titulo": "Óvalo dado el eje mayor",
      "requisitos": ["compas-basico", "tangente-en-punto"],
      "encargo": "Traza un óvalo dado su eje mayor AB con cuatro centros. Divide AB en tres partes iguales (homotetico con centro A y razones 1/3 y 2/3 sobre B, ids C y D). Las circunferencias de radio AC con centros en C y en D se cortan en O1 y O2 (cortesCirculos). Las rectas O1C, O1D, O2C y O2D, prolongadas, cortan a esas circunferencias en los puntos de enlace E, F, G y H (puntoEnDireccion desde C o D en la dirección opuesta a O1 o a O2). Dibuja con arcoEntre: arcos con centro C (de A a E y de A a G), con centro D (de B a F y de B a H) y con centros O1 y O2 (de E a F y de G a H). Agrupa los arcos para no pasar de 10 pasos. Idea clave: en cada punto de enlace los dos centros y el punto están alineados, así que los arcos son tangentes. Comprueba que esas ternas están alineadas y que los puntos de enlace están en sus circunferencias.",
      "exige": ["colineales", "puntoEnCircunferencia"]
    },
    {
      "id": "diedrico-punto",
      "bloque": 7,
      "titulo": "Punto en el sistema diédrico",
      "requisitos": ["perpendicular-por-punto"],
      "encargo": "Representa en diédrico un punto A del primer diedro con alejamiento 30 mm y cota 20 mm. Datos: la línea de tierra (L1 y L2, horizontal) y un punto X de ella. La línea de referencia es la perpendicular a la línea de tierra por X (puntoEnDireccion con direccion [L1, L2] y perpendicular: true). Hacia arriba (sentido 1) se lleva la cota: alzado A2 con etiqueta «A''». Hacia abajo (sentido -1) se lleva el alejamiento: planta A1 con etiqueta «A'». Usa dos radios fijos en mm. Dibuja la línea de tierra con el estilo de dato, la línea de referencia y las dos proyecciones. Idea clave: las dos proyecciones de un punto están siempre en la misma perpendicular a la línea de tierra. Comprueba que A1A2 es perpendicular a la línea de tierra y que A1, A2 y X están alineados.",
      "exige": ["perpendicular", "colineales"]
    },
    {
      "id": "diedrico-trazas-recta",
      "bloque": 7,
      "titulo": "Trazas de una recta en el sistema diédrico",
      "requisitos": ["diedrico-punto"],
      "encargo": "Halla las trazas de una recta r del primer diedro dada por sus proyecciones: r' = A1B1 (planta) y r'' = A2B2 (alzado), con la línea de tierra horizontal (datos L1 y L2). Traza vertical V: r' corta a la línea de tierra en V' (interseccionRectas) y V'' está en r'' sobre la perpendicular a la línea de tierra por V' (puntoEnDireccion con perpendicular e interseccionRectas con r''). Traza horizontal H: r'' corta a la línea de tierra en H'' (interseccionRectas) y H' está en r' sobre la perpendicular por H''. Elige los datos para que las cuatro trazas queden dentro del lienzo. Idea clave: una traza es el punto donde la recta corta a un plano de proyección; su otra proyección está en la línea de tierra. Comprueba que H'' y V' están en la línea de tierra, que H' está en r', que V'' está en r'' y que las líneas de referencia son perpendiculares a la línea de tierra.",
      "exige": ["colineales", "perpendicular"]
    }
  ]
}
```

- [ ] Paso 6: test del temario real

`packages/lecciones/test/temario-real.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { listarContenido } from '../src/almacen';
import { leccionSchema, type Leccion } from '../src/esquema';
import { comprobarCobertura, temarioSchema } from '../src/temario';
import { formatearIssue } from '../src/validar';

const archivo = fileURLToPath(new URL('../../../temario/temario.json', import.meta.url));
const resultado = temarioSchema.safeParse(JSON.parse(readFileSync(archivo, 'utf-8')));

describe('temario/temario.json', () => {
  it('es válido', () => {
    expect(resultado.success, resultado.success ? '' : resultado.error.issues.map(formatearIssue).join('\n')).toBe(true);
  });

  it('tiene al menos las 22 lecciones del plan', () => {
    if (!resultado.success) throw new Error('temario inválido');
    expect(resultado.data.lecciones.length).toBeGreaterThanOrEqual(22);
  });

  it('empieza por el uso del compás y no se salta el bloque 7', () => {
    if (!resultado.success) throw new Error('temario inválido');
    const bloques = new Set(resultado.data.lecciones.map((entrada) => entrada.bloque));
    expect(resultado.data.lecciones[0].id).toBe('compas-basico');
    expect([...bloques].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('las lecciones que ya existen cumplen su entrada', () => {
    if (!resultado.success) throw new Error('temario inválido');
    const lecciones: Leccion[] = listarContenido().flatMap(({ datos }) => {
      const r = leccionSchema.safeParse(datos);
      return r.success ? [r.data] : [];
    });
    expect(comprobarCobertura(resultado.data, lecciones).errores).toEqual([]);
  });
});
```

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: los 4 tests pasan (hoy solo existen `mediatriz-segmento` y `dividir-segmento-dos-partes`, y las dos cumplen su entrada).

- [ ] Paso 7: el comando `pnpm temario`

`packages/lecciones/src/temario-cli.ts`:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ_REPOSITORIO, listarContenido } from './almacen';
import { leccionSchema, type Leccion } from './esquema';
import {
  comprobarCobertura,
  comprobarRevision,
  encargoDe,
  formatearTemario,
  temarioSchema,
} from './temario';
import { formatearIssue } from './validar';

function main(argumentos: string[]): number {
  const resultado = temarioSchema.safeParse(
    JSON.parse(readFileSync(join(RAIZ_REPOSITORIO, 'temario', 'temario.json'), 'utf-8')),
  );
  if (!resultado.success) {
    console.error('temario/temario.json no es válido:');
    for (const issue of resultado.error.issues) console.error(`- ${formatearIssue(issue)}`);
    return 1;
  }
  const temario = resultado.data;

  const lecciones: Leccion[] = [];
  let invalidas = 0;
  for (const { ruta, datos } of listarContenido()) {
    const r = leccionSchema.safeParse(datos);
    if (r.success) lecciones.push(r.data);
    else {
      invalidas++;
      console.error(`✘ ${ruta}: no es una lección válida (ejecuta pnpm validar)`);
    }
  }
  const cobertura = comprobarCobertura(temario, lecciones);

  if (argumentos[0] === 'encargo') {
    const entrada = temario.lecciones.find((candidata) => candidata.id === argumentos[1]);
    if (!entrada) {
      console.error('Uso: pnpm temario encargo <id-de-leccion> (el id debe estar en temario/temario.json)');
      return 2;
    }
    console.log(encargoDe(entrada, cobertura.publicadas));
    return 0;
  }

  console.log(formatearTemario(temario, cobertura));
  let fallo = invalidas > 0 || cobertura.errores.length > 0;

  if (argumentos.includes('--completo') || argumentos.includes('--publicable')) {
    if (cobertura.pendientes.length > 0) {
      console.error(`\nFaltan ${cobertura.pendientes.length} lecciones: ${cobertura.pendientes.join(', ')}`);
      fallo = true;
    }
  }
  if (argumentos.includes('--publicable')) {
    const revision = comprobarRevision(lecciones);
    if (!revision.ok) {
      console.error('\nRevisión humana pendiente:');
      for (const falta of revision.faltan) console.error(`- ${falta}`);
      fallo = true;
    }
  }
  return fallo ? 1 : 0;
}

process.exitCode = main(process.argv.slice(2));
```

En `packages/lecciones/package.json`.

Antes:

```json
    "estado": "tsx src/estado-cli.ts"
```

Después:

```json
    "estado": "tsx src/estado-cli.ts",
    "temario": "tsx src/temario-cli.ts"
```

En `package.json` de la raíz.

Antes:

```json
    "estado": "pnpm --filter @traze/lecciones estado",
```

Después:

```json
    "estado": "pnpm --filter @traze/lecciones estado",
    "temario": "pnpm --filter @traze/lecciones temario",
```

- [ ] Paso 8: probar el comando a mano

```bash
pnpm temario
pnpm temario encargo bisectriz-angulo
pnpm temario encargo no-existe
pnpm temario --completo
```

Esperado:

1. `pnpm temario` lista los bloques 0 a 7; solo `mediatriz-segmento` y `dividir-segmento-dos-partes` salen con ✔; cabecera `Temario: 2 de 22 lecciones generadas`; código de salida 0.
2. El encargo de la bisectriz empieza por `Genera la lección «Bisectriz de un ángulo».` y trae `requisitos: compas-basico (todavía no existe)`.
3. El id inexistente muestra el uso y sale con 2.
4. `--completo` termina con `Faltan 20 lecciones: ...` y código 1 (22 del temario menos las 2 que ya existen).

- [ ] Paso 9: ampliar la guía de generación

Añade al final de `generacion/LEEME.md`:

```markdown

## Generar con el temario

El temario (`temario/temario.json`) fija las lecciones, su orden y las comprobaciones que cada una debe llevar.

- `pnpm temario`: estado del temario, por bloques, con errores y avisos. Falla si una lección de `contenido/` no cumple su entrada.
- `pnpm temario encargo <id>`: imprime el texto de encargo para generar esa lección (se pega en Claude en el Modo B, o lo lee el agente en el Modo A).
- `pnpm temario --completo`: falla si falta alguna lección.
- `pnpm temario --publicable`: además, falla si la revisión humana no llega al mínimo (todas las de los bloques 5 y 7, y una de cada tres de las demás).

Se generan en el orden del temario: una lección solo puede pedir como requisito otra que ya exista. Si una lección necesita más de 10 pasos, se divide en dos: se añade la segunda al temario, justo después, con la primera como requisito.

## Qué mirar al revisar una lección (bloques 5 y 7 primero)

La revisión humana comprueba lo que los tests numéricos no pueden:

1. Que la construcción es la que se enseña en clase y no otra que da el mismo resultado de forma rara.
2. Que el corte elegido entre dos posibles es el correcto (por ejemplo, el centro del enlace dentro del ángulo; el corte de la mediatriz del lado que corresponde).
3. Que los puntos de tangencia y los ángulos rectos están marcados.
4. Que el porqué de cada paso es cierto y no una frase hueca.
5. Que ningún paso afirma algo que el dibujo no muestra.

Cuando una lección está revisada, la persona revisora ejecuta `pnpm revisar <id> --por "<nombre>"`. Un agente nunca ejecuta ese comando por ella.
```

- [ ] Paso 10: tipos y confirmar

```bash
pnpm --filter @traze/lecciones typecheck
pnpm test
git add temario packages/lecciones package.json generacion/LEEME.md
git commit -m "feat(lecciones): temario de 22 lecciones, comando pnpm temario y guia de revision"
```

## Tarea 6: lote A, bloques 0 y 1 (6 lecciones)

Archivos:

- Crear (los genera `pnpm promover`): `contenido/bloque-0-primeros-pasos/compas-basico.json`, `contenido/bloque-1-trazados/bisectriz-angulo.json`, `perpendicular-por-punto.json`, `paralela-por-punto.json`, `division-segmento-thales.json`, `arco-capaz.json`

Interfaces:

- Consume: `pnpm temario encargo <id>`, `pnpm comprobar`, `pnpm promover`, el prompt maestro (`generacion/prompt-leccion.md`) o la skill `dibujo-tecnico`.
- Produce: 6 lecciones válidas en `contenido/`, cada una con `meta.version` 1 y revisión pendiente.

Esta tarea no escribe código: es el procedimiento del Plan 2 aplicado a seis lecciones, con criterios de aceptación por lección. El orden importa (cada lección pide como requisito otras ya existentes). El borrador lo escribe el propio agente que ejecuta el plan (Modo A del Plan 2), siguiendo el vocabulario y las reglas de `generacion/prompt-leccion.md` (o la skill `dibujo-tecnico`), sin chat aparte ni subagentes; el validador y las personas deciden si entra.

Procedimiento por lección (Modo A con la skill, o Modo B con el prompt maestro pegado en un chat nuevo):

1. `pnpm temario encargo <id>`: lee el encargo y escribe el borrador que pide.
2. Guarda el borrador en `generacion/borradores/<id>.json`.
3. `pnpm comprobar generacion/borradores/<id>.json`. Si dice CORREGIR, lee el informe entero, corrige el borrador y repite hasta CORRECTO. Si tras tres intentos sigue en CORREGIR, DETENTE y avisa al usuario con el informe.
4. Si el trazado necesita algo que el vocabulario no tiene (el borrador sería `VOCABULARIO_INSUFICIENTE`), sigue «Ampliar el vocabulario» de `generacion/LEEME.md`, con tests, en un commit aparte, y reintenta.
5. Cumple los criterios de aceptación de la lección (abajo).
6. `pnpm promover generacion/borradores/<id>.json`.

Criterios de aceptación comunes: informe sin avisos; entre 6 y 10 pasos, cada uno con consejo; 2 o 3 errores frecuentes; los tipos de comprobación de `exige` presentes (los exige `pnpm temario`); `requisitos` igual a los del temario; ninguna comprobación quitada o debilitada respecto a lo que pide el encargo.

Los «criterios visuales» de cada lección se miran en `pnpm web` (Browser pane o navegador) cuando el agente puede abrirlo; si no puede, lo anota en su informe final como pendiente para el usuario y sigue.

- [ ] Paso 1: `compas-basico`

Criterio visual extra tras el paso 6 (`pnpm web` y `http://localhost:3000/leccion/compas-basico`): se ve el arco con radio AB y el punto D sobre la semirrecta; los consejos de material y de técnica del compás aparecen en pasos distintos.

- [ ] Paso 2: `bisectriz-angulo`

Criterio visual: Z es el corte que queda dentro del ángulo y la recta VZ divide el ángulo en dos partes que se ven iguales; las etiquetas no se pisan.

- [ ] Paso 3: `perpendicular-por-punto`

Criterio visual: hay marca de ángulo recto en el corte de MN con la recta y los dos arcos centrados en X e Y se cruzan con ángulo abierto.

- [ ] Paso 4: `paralela-por-punto`

Criterio visual: ABQP se ve como un paralelogramo no cruzado (Q no es el corte equivocado).

- [ ] Paso 5: `division-segmento-thales`

Criterio visual: se ven tres unidades iguales sobre la auxiliar y las paralelas a P3B pasan por P1 y P2; D1 y D2 quedan sobre AB.

- [ ] Paso 6: `arco-capaz`

Criterio visual: el arco pasa por A, B y X y la lección no supera 10 pasos. Si no cabe, divide en dos según el procedimiento de `generacion/LEEME.md` (actualiza `temario/temario.json` con la segunda lección justo después y ajusta el test «22 lecciones» si procede, que ya admite más) y deja las dos promovidas.

- [ ] Paso 7: comprobar el lote

```bash
pnpm validar
pnpm temario
pnpm test
```

Esperado: `Lecciones válidas: 8 de 8`; `pnpm temario` con 8 lecciones ✔ y sin errores; `pnpm test` en verde.

- [ ] Paso 8: confirmar

```bash
git add contenido temario
git commit -m "feat(contenido): lote A, bloques 0 y 1 (compas, bisectriz, perpendicular, paralela, Thales y arco capaz)"
```

## Tarea 7: lote B, bloques 2 y 3 (6 lecciones)

Archivos:

- Crear (los genera `pnpm promover`): `contenido/bloque-2-poligonos/circuncentro-triangulo.json`, `hexagono-regular.json`, `pentagono-regular.json`, `contenido/bloque-3-proporcionalidad/cuarta-proporcional.json`, `media-proporcional.json`, `seccion-aurea.json`

Interfaces:

- Consume: el procedimiento y los criterios comunes de la Tarea 6.
- Produce: 6 lecciones más, hasta 14 en total.

Mismo procedimiento que la Tarea 6, en este orden.

- [ ] Paso 1: `circuncentro-triangulo`. Criterio visual: el triángulo es acutángulo, O queda dentro y la circunferencia pasa por A, B y C.
- [ ] Paso 2: `hexagono-regular`. Criterio visual: seis lados iguales sobre la circunferencia y vértices rotulados A a F sin solapes. Es la lección con más puntos: si el chequeo de render protesta por etiquetas, la solución es mover datos (radio mayor), no quitar etiquetas.
- [ ] Paso 3: `pentagono-regular`. Criterio visual: el lado CN se ve llevado sobre la circunferencia cinco veces y el pentágono cierra sin hueco.
- [ ] Paso 4: `cuarta-proporcional`. Criterio visual: las dos semirrectas y las dos paralelas (AC y la trazada por B) se leen sin confusión.
- [ ] Paso 5: `media-proporcional`. Criterio visual: H está en el lado correcto de la semicircunferencia y JH es perpendicular a AB.
- [ ] Paso 6: `seccion-aurea`. Criterio visual: C divide AB y AC es la parte mayor (más de la mitad del segmento).

- [ ] Paso 7: comprobar el lote

```bash
pnpm validar
pnpm temario
pnpm test
```

Esperado: `Lecciones válidas: 14 de 14`; `pnpm temario` con 14 ✔ y sin errores; `pnpm test` en verde.

- [ ] Paso 8: confirmar

```bash
git add contenido temario
git commit -m "feat(contenido): lote B, bloques 2 y 3 (circuncentro, hexagono, pentagono, proporcionales y seccion aurea)"
```

## Tarea 8: lote C, bloques 4 y 5 (5 lecciones)

Archivos:

- Crear (los genera `pnpm promover`): `contenido/bloque-4-transformaciones/simetria-axial.json`, `homotecia.json`, `contenido/bloque-5-tangencias/tangente-en-punto.json`, `tangentes-desde-punto-exterior.json`, `enlace-dos-rectas.json`

Interfaces:

- Consume: el procedimiento y los criterios comunes de la Tarea 6.
- Produce: 5 lecciones más, hasta 19 en total. Las tres del bloque 5 son de revisión prioritaria.

- [ ] Paso 1: `simetria-axial`. Criterio visual: la figura simétrica queda al otro lado del eje y las etiquetas A', B', C' se leen.
- [ ] Paso 2: `homotecia`. Criterio visual: el triángulo ampliado cabe en el lienzo y los lados correspondientes son paralelos.
- [ ] Paso 3: `tangente-en-punto`. Criterio visual: hay marca de ángulo recto en T y la tangente se prolonga por los dos lados.
- [ ] Paso 4: `tangentes-desde-punto-exterior`. Criterio visual: los puntos T1 y T2 están marcados, las dos tangentes se ven tocando la circunferencia y hay marcas de ángulo recto.
- [ ] Paso 5: `enlace-dos-rectas`. Criterio visual: el arco queda dentro del ángulo AVB y las dos rectas tocan el arco justo en T1 y T2.

- [ ] Paso 6: comprobar el lote

```bash
pnpm validar
pnpm temario
pnpm estado
pnpm test
```

Esperado: `Lecciones válidas: 19 de 19`; `pnpm temario` con 19 ✔ y sin errores; `pnpm estado` muestra con ⚑ las tres lecciones del bloque 5, pendientes; `pnpm test` en verde.

- [ ] Paso 7: confirmar

```bash
git add contenido temario
git commit -m "feat(contenido): lote C, bloques 4 y 5 (simetria, homotecia y tangencias)"
```

- [ ] Paso 8: PARADA, revisión humana (la hace una persona, no el agente)

El agente NO ejecuta `pnpm revisar`, ni siquiera si el usuario le da el nombre de alguien: la revisión consiste en mirar las lecciones, y eso no se delega. Detén la ejecución y avisa al usuario con este texto (rellena la lista con la salida de `pnpm estado`):

> Lote C terminado y confirmado (19 de 22 lecciones). Hay que revisar a mano, con prioridad, las tres lecciones de tangencias (marcadas ⚑ en `pnpm estado`): `tangente-en-punto`, `tangentes-desde-punto-exterior` y `enlace-dos-rectas`. Mira cada una en `pnpm web` siguiendo «Qué mirar al revisar una lección» de `generacion/LEEME.md` y, cuando esté bien, ejecuta `pnpm revisar <id> --por "<tu nombre>"`. Si encuentras un error, dime cuál y regenero la lección con `--reemplazar`. Dime «sigue» cuando quieras que continúe con el lote D (con o sin revisión hecha: lo que quede sin revisar se verá en la Tarea 15).

No pases a la Tarea 9 hasta que el usuario conteste. Si pide regenerar una lección, se repite el procedimiento de la Tarea 6 para ella con `pnpm promover generacion/borradores/<id>.json --reemplazar` (la nueva versión vuelve a quedar pendiente), se vuelve a confirmar y se vuelve a avisar.

## Tarea 9: lote D, bloques 6 y 7 (3 lecciones)

Archivos:

- Crear (los genera `pnpm promover`): `contenido/bloque-6-curvas/ovalo-eje-mayor.json`, `contenido/bloque-7-diedrico/diedrico-punto.json`, `diedrico-trazas-recta.json`

Interfaces:

- Consume: el procedimiento y los criterios comunes de la Tarea 6.
- Produce: las 3 últimas lecciones, hasta 22 en total. Las dos del bloque 7 son de revisión prioritaria.

- [ ] Paso 1: `ovalo-eje-mayor`. Criterio visual: el contorno es cerrado y liso; los arcos se encuentran en los puntos de enlace sin picos. Es la lección con más riesgo de pasar de 10 pasos: agrupa varios arcos por paso; si no cabe, divide en dos según el procedimiento de la Tarea 6.
- [ ] Paso 2: `diedrico-punto`. Criterio visual: línea de tierra horizontal, línea de referencia perpendicular, alzado arriba y planta abajo, etiquetas A' y A'' legibles.
- [ ] Paso 3: `diedrico-trazas-recta`. Criterio visual: las cuatro trazas (V', V'', H', H'') caen dentro del lienzo y cada línea de referencia es perpendicular a la línea de tierra.

- [ ] Paso 4: comprobar el temario completo

```bash
pnpm validar
pnpm temario --completo
pnpm estado
pnpm test
```

Esperado: `Lecciones válidas: 22 de 22`; `pnpm temario --completo` termina con código 0 y `Temario: 22 de 22 lecciones generadas` (con una lección dividida, el total es 23 y debe coincidir); `pnpm estado` muestra con ⚑ las cinco lecciones de los bloques 5 y 7 aún sin revisar; `pnpm test` en verde.

- [ ] Paso 5: confirmar

```bash
git add contenido temario
git commit -m "feat(contenido): lote D, bloques 6 y 7 (ovalo y sistema diedrico)"
```

- [ ] Paso 6: PARADA, revisión humana (la hace una persona, no el agente)

Como en la Tarea 8, el agente NO ejecuta `pnpm revisar`. Detén la ejecución y avisa al usuario con este texto (rellena las cifras con `pnpm temario --publicable`):

> Lote D terminado y confirmado: las 22 lecciones del temario existen. Quedan por revisar a mano, con prioridad, las dos del bloque 7 (`diedrico-punto` y `diedrico-trazas-recta`) y las tres del bloque 5 si aún no lo hiciste; después, al menos una de cada tres de las demás (6 de las 17 restantes con el mínimo actual). `pnpm temario --publicable` dice exactamente cuántas faltan. Revisa con `pnpm revisar <id> --por "<tu nombre>"` cuando cada una esté bien. Dime «sigue» para continuar con la biblioteca de consejos, la web y el SEO (Tareas 10 a 15); la revisión no bloquea esas tareas, solo el despliegue.

No pases a la Tarea 10 hasta que el usuario conteste.

## Tarea 10: biblioteca de consejos (datos y búsqueda)

Archivos:

- Crear: `consejos/generales.json`, `packages/lecciones/src/consejos-busqueda.ts`, `packages/lecciones/src/consejos.ts`
- Modificar: `packages/lecciones/package.json`, `packages/lecciones/src/index.ts`
- Test: `packages/lecciones/test/consejos.test.ts`, `packages/lecciones/test/consejos-real.test.ts`

Interfaces:

- Consume: `Leccion`, `MAX_CARACTERES_CONSEJO` (Tarea 5), `BLOQUES_TEMARIO`, `formatearIssue`.
- Produce: `consejos-busqueda.ts` (sin dependencias, subruta `@traze/lecciones/busqueda`): `TIPOS_CONSEJO`, `TipoConsejo`, `ETIQUETA_TIPO`, `TEMA_GENERAL`, `ConsejoBiblioteca`, `normalizar(texto)`, `buscarConsejos(lista, { consulta, tema })`, `temasDisponibles(lista)`. `consejos.ts` (con Zod): `consejosGeneralesSchema`, `ConsejosGenerales`, `reunirConsejos(generales, lecciones): ConsejoBiblioteca[]`.

La biblioteca reúne dos clases de consejos: los 17 generales de oficio (material, técnica, precisión, limpieza, atajo mental, error típico), con tipo, y los `consejo` de cada paso de cada lección, bajo el bloque de su lección. El buscador ignora mayúsculas y acentos. La parte de búsqueda no importa Zod para no cargarlo en el navegador.

- [ ] Paso 1: escribir los tests que fallan

`packages/lecciones/test/consejos.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import {
  TEMA_GENERAL,
  buscarConsejos,
  normalizar,
  temasDisponibles,
  type ConsejoBiblioteca,
} from '../src/consejos-busqueda';
import { consejosGeneralesSchema, reunirConsejos } from '../src/consejos';
import type { Leccion } from '../src/esquema';
import { validarLeccion } from '../src/validar';

const GENERALES = consejosGeneralesSchema.parse({
  consejos: [
    { id: 'material-lapices', tipo: 'material', texto: 'Lápiz 2H para construcción y HB para el resultado.' },
    { id: 'precision-cortes', tipo: 'precision', texto: 'Corta los arcos con ángulo abierto, cerca de 90°.' },
  ],
  listaComprobacion: ['Todos los puntos tienen su letra'],
});

function leccion(id: string, bloque: number, consejos: (string | undefined)[]): Leccion {
  const datos: any = { ...structuredClone(piloto), id, bloque };
  datos.pasos = consejos.map((consejo, i) => ({
    titulo: `Paso ${i + 1}`,
    texto: 'Texto.',
    porque: 'Porque sí.',
    ...(consejo ? { consejo } : {}),
    dibujo: [{ tipo: 'punto', id: 'A' }],
  }));
  const r = validarLeccion(datos);
  if (!r.ok) throw new Error(r.errores.join('\n'));
  return r.leccion;
}

describe('consejosGeneralesSchema', () => {
  it('rechaza un consejo que no cabe en dos líneas', () => {
    const r = consejosGeneralesSchema.safeParse({
      consejos: [{ id: 'largo', tipo: 'material', texto: 'x'.repeat(161) }],
      listaComprobacion: ['a'],
    });
    expect(r.success).toBe(false);
  });

  it('rechaza un tipo desconocido y un id repetido', () => {
    expect(
      consejosGeneralesSchema.safeParse({
        consejos: [{ id: 'a', tipo: 'magia', texto: 'Texto.' }],
        listaComprobacion: ['a'],
      }).success,
    ).toBe(false);
    expect(
      consejosGeneralesSchema.safeParse({
        consejos: [
          { id: 'a', tipo: 'material', texto: 'Uno.' },
          { id: 'a', tipo: 'material', texto: 'Dos.' },
        ],
        listaComprobacion: ['a'],
      }).success,
    ).toBe(false);
  });
});

describe('reunirConsejos', () => {
  it('pone primero los generales y luego los de cada paso, con su origen', () => {
    const lista = reunirConsejos(GENERALES, [
      leccion('bisectriz-angulo', 1, ['Gira desde la cabeza.', undefined, 'Cierra con trazo grueso.']),
    ]);
    expect(lista).toEqual([
      {
        id: 'material-lapices',
        tipo: 'material',
        tema: TEMA_GENERAL,
        texto: 'Lápiz 2H para construcción y HB para el resultado.',
        leccion: null,
      },
      {
        id: 'precision-cortes',
        tipo: 'precision',
        tema: TEMA_GENERAL,
        texto: 'Corta los arcos con ángulo abierto, cerca de 90°.',
        leccion: null,
      },
      {
        id: 'bisectriz-angulo-1',
        tipo: null,
        tema: 'Trazados fundamentales',
        texto: 'Gira desde la cabeza.',
        leccion: { id: 'bisectriz-angulo', titulo: 'Mediatriz de un segmento', paso: 1 },
      },
      {
        id: 'bisectriz-angulo-3',
        tipo: null,
        tema: 'Trazados fundamentales',
        texto: 'Cierra con trazo grueso.',
        leccion: { id: 'bisectriz-angulo', titulo: 'Mediatriz de un segmento', paso: 3 },
      },
    ]);
  });

  it('no repite un consejo que ya está (ignorando mayúsculas y acentos)', () => {
    const lista = reunirConsejos(GENERALES, [
      leccion('a', 1, ['LÁPIZ 2h para construcción y hb para el resultado.']),
    ]);
    expect(lista).toHaveLength(2);
  });
});

describe('normalizar y buscarConsejos', () => {
  const lista: ConsejoBiblioteca[] = reunirConsejos(GENERALES, [
    leccion('seccion-aurea', 3, ['La sección áurea divide el segmento en media y extrema razón.']),
  ]);

  it('normaliza sin acentos ni mayúsculas', () => {
    expect(normalizar('Sección ÁUREA')).toBe('seccion aurea');
  });

  it('encuentra «aurea», «ÁUREA» y «seccion aurea» igual que «sección áurea»', () => {
    for (const consulta of ['aurea', 'ÁUREA', 'seccion aurea', 'sección áurea']) {
      expect(buscarConsejos(lista, { consulta, tema: '' }).map((c) => c.id), consulta).toEqual([
        'seccion-aurea-1',
      ]);
    }
  });

  it('exige que aparezcan todas las palabras', () => {
    expect(buscarConsejos(lista, { consulta: 'aurea compas', tema: '' })).toEqual([]);
  });

  it('busca también en el nombre del tipo y en el tema', () => {
    expect(buscarConsejos(lista, { consulta: 'precision', tema: '' }).map((c) => c.id)).toEqual([
      'precision-cortes',
    ]);
    expect(buscarConsejos(lista, { consulta: 'proporcionalidad', tema: '' }).map((c) => c.id)).toEqual([
      'seccion-aurea-1',
    ]);
  });

  it('filtra por tema y sin consulta devuelve todo el tema', () => {
    expect(buscarConsejos(lista, { consulta: '', tema: TEMA_GENERAL })).toHaveLength(2);
    expect(buscarConsejos(lista, { consulta: '  ', tema: '' })).toHaveLength(3);
  });

  it('lista los temas con el general primero', () => {
    expect(temasDisponibles(lista)).toEqual([TEMA_GENERAL, 'Proporcionalidad y escalas']);
  });
});
```

`packages/lecciones/test/consejos-real.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { consejosGeneralesSchema } from '../src/consejos';
import { TIPOS_CONSEJO } from '../src/consejos-busqueda';
import { formatearIssue } from '../src/validar';

const archivo = fileURLToPath(new URL('../../../consejos/generales.json', import.meta.url));
const resultado = consejosGeneralesSchema.safeParse(JSON.parse(readFileSync(archivo, 'utf-8')));

describe('consejos/generales.json', () => {
  it('es válido', () => {
    expect(resultado.success, resultado.success ? '' : resultado.error.issues.map(formatearIssue).join('\n')).toBe(true);
  });

  it('cubre los seis tipos de consejo del spec', () => {
    if (!resultado.success) throw new Error('consejos inválidos');
    const tipos = new Set(resultado.data.consejos.map((consejo) => consejo.tipo));
    expect([...tipos].sort()).toEqual([...TIPOS_CONSEJO].sort());
  });

  it('trae la lista de comprobación de la lámina', () => {
    if (!resultado.success) throw new Error('consejos inválidos');
    expect(resultado.data.listaComprobacion.length).toBeGreaterThanOrEqual(5);
  });
});
```

- [ ] Paso 2: ejecutar los tests y comprobar que fallan

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: ambos archivos FALLAN por importación (no existen `consejos-busqueda`, `consejos` ni el JSON).

- [ ] Paso 3: la parte sin dependencias

`packages/lecciones/src/consejos-busqueda.ts`:

```ts
export const TIPOS_CONSEJO = [
  'material',
  'tecnica',
  'precision',
  'limpieza',
  'atajo',
  'error',
] as const;

export type TipoConsejo = (typeof TIPOS_CONSEJO)[number];

export const ETIQUETA_TIPO: Record<TipoConsejo, string> = {
  material: 'Material',
  tecnica: 'Técnica de instrumento',
  precision: 'Precisión',
  limpieza: 'Limpieza',
  atajo: 'Atajo mental',
  error: 'Error típico',
};

export const TEMA_GENERAL = 'Oficio general';

export interface ConsejoBiblioteca {
  id: string;
  tipo: TipoConsejo | null;
  tema: string;
  texto: string;
  leccion: { id: string; titulo: string; paso: number } | null;
}

export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function buscarConsejos(
  lista: readonly ConsejoBiblioteca[],
  filtro: { consulta: string; tema: string },
): ConsejoBiblioteca[] {
  const palabras = normalizar(filtro.consulta).split(/\s+/).filter(Boolean);
  return lista.filter((consejo) => {
    if (filtro.tema !== '' && consejo.tema !== filtro.tema) return false;
    const pajar = normalizar(
      [
        consejo.texto,
        consejo.tipo ? ETIQUETA_TIPO[consejo.tipo] : '',
        consejo.tema,
        consejo.leccion?.titulo ?? '',
      ].join(' '),
    );
    return palabras.every((palabra) => pajar.includes(palabra));
  });
}

export function temasDisponibles(lista: readonly ConsejoBiblioteca[]): string[] {
  const temas = [...new Set(lista.map((consejo) => consejo.tema))];
  return [...temas.filter((tema) => tema === TEMA_GENERAL), ...temas.filter((tema) => tema !== TEMA_GENERAL)];
}
```

- [ ] Paso 4: el esquema y la reunión

`packages/lecciones/src/consejos.ts`:

```ts
import { z } from 'zod';
import type { Leccion } from './esquema';
import {
  TEMA_GENERAL,
  TIPOS_CONSEJO,
  normalizar,
  type ConsejoBiblioteca,
} from './consejos-busqueda';
import { MAX_CARACTERES_CONSEJO } from './temario';
import { BLOQUES_TEMARIO } from './vocabulario';

export const consejosGeneralesSchema = z
  .object({
    consejos: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'el id va en minúsculas y con guiones'),
          tipo: z.enum(TIPOS_CONSEJO),
          texto: z
            .string()
            .min(1)
            .max(
              MAX_CARACTERES_CONSEJO,
              `un consejo cabe en dos líneas (máximo ${MAX_CARACTERES_CONSEJO} caracteres)`,
            ),
        }),
      )
      .min(1),
    listaComprobacion: z.array(z.string().min(1)).min(1),
  })
  .superRefine((datos, ctx) => {
    const vistos = new Set<string>();
    datos.consejos.forEach((consejo, i) => {
      if (vistos.has(consejo.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['consejos', i, 'id'],
          message: `el id «${consejo.id}» está repetido`,
        });
      }
      vistos.add(consejo.id);
    });
  });

export type ConsejosGenerales = z.infer<typeof consejosGeneralesSchema>;

export function reunirConsejos(
  generales: ConsejosGenerales,
  lecciones: readonly Leccion[],
): ConsejoBiblioteca[] {
  const lista: ConsejoBiblioteca[] = generales.consejos.map((consejo) => ({
    id: consejo.id,
    tipo: consejo.tipo,
    tema: TEMA_GENERAL,
    texto: consejo.texto,
    leccion: null,
  }));
  const vistos = new Set(lista.map((consejo) => normalizar(consejo.texto)));

  for (const leccion of lecciones) {
    leccion.pasos.forEach((paso, i) => {
      if (!paso.consejo) return;
      const clave = normalizar(paso.consejo);
      if (vistos.has(clave)) return;
      vistos.add(clave);
      lista.push({
        id: `${leccion.id}-${i + 1}`,
        tipo: null,
        tema: BLOQUES_TEMARIO[leccion.bloque],
        texto: paso.consejo,
        leccion: { id: leccion.id, titulo: leccion.titulo, paso: i + 1 },
      });
    });
  }
  return lista;
}
```

En `packages/lecciones/src/index.ts`, añade al final:

```ts
export * from './consejos-busqueda';
export * from './consejos';
```

En `packages/lecciones/package.json`.

Antes:

```json
    "./interpretar": "./src/interpretar.ts",
    "./rotulos": "./src/rotulos.ts"
```

Después:

```json
    "./interpretar": "./src/interpretar.ts",
    "./rotulos": "./src/rotulos.ts",
    "./busqueda": "./src/consejos-busqueda.ts"
```

- [ ] Paso 5: los consejos generales

`consejos/generales.json`:

```json
{
  "consejos": [
    {
      "id": "material-lapices",
      "tipo": "material",
      "texto": "Lápiz 2H para construcción y HB para el resultado. Afila la mina en bisel para que el trazo salga fino y uniforme."
    },
    {
      "id": "material-compas",
      "tipo": "material",
      "texto": "Compás con la mina de la misma dureza que el lápiz y afilada en bisel. Una mina roma abre el trazo y resta precisión."
    },
    {
      "id": "material-goma",
      "tipo": "material",
      "texto": "Usa goma blanda y papel limpio. Borra poco: una construcción llena de borrones pierde precisión y se lee peor."
    },
    {
      "id": "material-fijar",
      "tipo": "material",
      "texto": "Fija la lámina con cinta de pintor y tenla paralela al borde de la mesa para que la escuadra y el cartabón no bailen."
    },
    {
      "id": "tecnica-compas",
      "tipo": "tecnica",
      "texto": "Pincha el compás con firmeza y gira desde la cabeza con una sola mano, sin apretar el lápiz ni inclinar el compás."
    },
    {
      "id": "tecnica-escuadra",
      "tipo": "tecnica",
      "texto": "Apoya la escuadra contra la regla y desliza solo una de las dos: así los trazos paralelos salen realmente paralelos."
    },
    {
      "id": "tecnica-abertura",
      "tipo": "tecnica",
      "texto": "Antes de pinchar en un punto nuevo, comprueba que la abertura del compás no se ha movido."
    },
    {
      "id": "precision-cortes",
      "tipo": "precision",
      "texto": "Corta los arcos con ángulo abierto, cerca de 90°: dos arcos casi tangentes dan un punto impreciso."
    },
    {
      "id": "precision-rectas",
      "tipo": "precision",
      "texto": "Prolonga las rectas más allá de los puntos que unen: una recta larga corta mejor la siguiente y se nota si se tuerce."
    },
    {
      "id": "precision-puntos",
      "tipo": "precision",
      "texto": "Marca los puntos con un pinchazo fino o una cruz pequeña, nunca con un punto gordo: el error empieza ahí."
    },
    {
      "id": "limpieza-grosores",
      "tipo": "limpieza",
      "texto": "Resultado en trazo grueso y construcción en trazo fino. No borres las líneas auxiliares en un examen: demuestran el método."
    },
    {
      "id": "limpieza-rotulacion",
      "tipo": "limpieza",
      "texto": "Rotula en mayúscula, con letra pequeña y junto al punto, sin que el texto tape ningún trazo."
    },
    {
      "id": "limpieza-marcas",
      "tipo": "limpieza",
      "texto": "Marca siempre los puntos de tangencia y los ángulos rectos: es lo primero que se busca al corregir."
    },
    {
      "id": "atajo-mediatriz",
      "tipo": "atajo",
      "texto": "Dos arcos con el mismo radio desde cada extremo: los cortes equidistan de los dos, luego están en la mediatriz."
    },
    {
      "id": "atajo-tangente",
      "tipo": "atajo",
      "texto": "Tangente y radio forman 90° en el punto de tangencia: si tienes uno, el otro sale con la escuadra."
    },
    {
      "id": "error-abertura-corta",
      "tipo": "error",
      "texto": "Abrir el compás menos de la mitad del segmento: los arcos no se cortan. Ábrelo siempre algo más."
    },
    {
      "id": "error-abertura-cambiada",
      "tipo": "error",
      "texto": "Cambiar la abertura del compás a mitad de la construcción: los puntos dejan de estar a la distancia que crees."
    }
  ],
  "listaComprobacion": [
    "Todos los puntos tienen su letra, en mayúscula y sin tapar ningún trazo.",
    "El resultado está en trazo grueso y la construcción en trazo fino.",
    "Las líneas auxiliares siguen a la vista: no se han borrado.",
    "Los puntos de tangencia y los ángulos rectos están marcados.",
    "El cajetín está completo: título, tema, escala y número de lámina.",
    "Nada se sale del marco de la lámina."
  ]
}
```

- [ ] Paso 6: ejecutar los tests y comprobar que pasan

Ejecuta: `pnpm --filter @traze/lecciones test` y `pnpm --filter @traze/lecciones typecheck`

Esperado: los 10 tests de `consejos.test.ts` y los 3 de `consejos-real.test.ts` pasan. Si el test del esquema dice que algún consejo general supera los 160 caracteres, acórtalo.

- [ ] Paso 7: confirmar

```bash
git add consejos packages/lecciones
git commit -m "feat(lecciones): biblioteca de consejos con tipos, lista de comprobacion y busqueda sin acentos"
```

## Tarea 11: progreso del alumno («vista»)

Archivos:

- Crear: `apps/web/src/progreso.ts`, `apps/web/src/progreso-navegador.ts`
- Modificar: `apps/web/src/componentes/Reproductor.tsx`
- Test: `apps/web/test/progreso.test.ts`

Interfaces:

- Consume: `localStorage` del navegador (solo en `progreso-navegador.ts`).
- Produce: `EstadoLeccion`, `Progreso`, `CLAVE_PROGRESO`, `progresoVacio()`, `registrar(progreso, id, estado, fecha): Progreso` (nunca baja de estado y devuelve el mismo objeto si no cambia nada), `estadoDe(progreso, id)`, `resumir(progreso, ids)`, `leerProgreso(almacen)` (tolerante a datos corruptos), `serializar(progreso)`; `cargarProgresoNavegador()` y `registrarVista(id)`.

El módulo puro no toca `localStorage`: recibe el almacén como parámetro, así se prueba con uno falso. El envoltorio del navegador captura cualquier error (navegación privada, cuota, bloqueo).

- [ ] Paso 1: escribir el test que falla

`apps/web/test/progreso.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  CLAVE_PROGRESO,
  estadoDe,
  leerProgreso,
  progresoVacio,
  registrar,
  resumir,
  serializar,
} from '../src/progreso';

const HOY = '2026-10-12';

describe('registrar', () => {
  it('anota una lección vista con su fecha', () => {
    const progreso = registrar(progresoVacio(), 'mediatriz-segmento', 'vista', HOY);
    expect(estadoDe(progreso, 'mediatriz-segmento')).toBe('vista');
    expect(progreso.lecciones['mediatriz-segmento']).toEqual({ estado: 'vista', fecha: HOY });
  });

  it('no modifica el progreso anterior', () => {
    const antes = progresoVacio();
    registrar(antes, 'a', 'vista', HOY);
    expect(antes.lecciones).toEqual({});
  });

  it('nunca baja de estado', () => {
    const practicada = registrar(progresoVacio(), 'a', 'practicada', HOY);
    const despues = registrar(practicada, 'a', 'vista', '2026-10-13');
    expect(despues).toBe(practicada);
    expect(estadoDe(despues, 'a')).toBe('practicada');
  });

  it('devuelve el mismo objeto si el estado no cambia', () => {
    const vista = registrar(progresoVacio(), 'a', 'vista', HOY);
    expect(registrar(vista, 'a', 'vista', '2026-10-13')).toBe(vista);
  });

  it('sube de estado y actualiza la fecha', () => {
    const vista = registrar(progresoVacio(), 'a', 'vista', HOY);
    const practicada = registrar(vista, 'a', 'practicada', '2026-10-13');
    expect(practicada.lecciones.a).toEqual({ estado: 'practicada', fecha: '2026-10-13' });
  });
});

describe('estadoDe y resumir', () => {
  it('da null para una lección sin registro, también con ids raros', () => {
    const progreso = registrar(progresoVacio(), 'a', 'vista', HOY);
    expect(estadoDe(progreso, 'b')).toBeNull();
    expect(estadoDe(progreso, 'toString')).toBeNull();
    expect(estadoDe(progreso, '__proto__')).toBeNull();
  });

  it('cuenta por estado solo las lecciones pedidas', () => {
    let progreso = registrar(progresoVacio(), 'a', 'vista', HOY);
    progreso = registrar(progreso, 'b', 'practicada', HOY);
    progreso = registrar(progreso, 'c', 'dominada', HOY);
    expect(resumir(progreso, ['a', 'b', 'x'])).toEqual({ vista: 1, practicada: 1, dominada: 0 });
  });
});

describe('leerProgreso', () => {
  const almacenCon = (valor: string | null) => ({ getItem: (clave: string) => (clave === CLAVE_PROGRESO ? valor : null) });

  it('lee lo que escribió serializar', () => {
    const progreso = registrar(progresoVacio(), 'a', 'vista', HOY);
    expect(leerProgreso(almacenCon(serializar(progreso)))).toEqual(progreso);
  });

  it('con el almacén vacío devuelve un progreso vacío', () => {
    expect(leerProgreso(almacenCon(null))).toEqual(progresoVacio());
  });

  it('con JSON corrupto devuelve un progreso vacío', () => {
    expect(leerProgreso(almacenCon('{no es json'))).toEqual(progresoVacio());
  });

  it('con una forma inesperada devuelve un progreso vacío', () => {
    for (const valor of [
      '[]',
      '"hola"',
      '{"version":2,"lecciones":{}}',
      '{"version":1,"lecciones":[]}',
      '{"version":1,"lecciones":{"a":{"estado":"genial","fecha":"hoy"}}}',
      '{"version":1,"lecciones":{"a":{"estado":"vista"}}}',
    ]) {
      expect(leerProgreso(almacenCon(valor)), valor).toEqual(progresoVacio());
    }
  });

  it('sin almacén (null) devuelve un progreso vacío', () => {
    expect(leerProgreso(null)).toEqual(progresoVacio());
  });

  it('si getItem lanza (almacenamiento bloqueado) devuelve un progreso vacío', () => {
    const bloqueado = {
      getItem: () => {
        throw new Error('SecurityError');
      },
    };
    expect(leerProgreso(bloqueado)).toEqual(progresoVacio());
  });
});
```

- [ ] Paso 2: ejecutar el test y comprobar que falla

Ejecuta: `pnpm --filter @traze/web test`

Esperado: `progreso.test.ts` FALLA porque `../src/progreso` no existe; los tests anteriores de la web siguen pasando.

- [ ] Paso 3: el módulo puro

`apps/web/src/progreso.ts`:

```ts
export type EstadoLeccion = 'vista' | 'practicada' | 'dominada';

const ORDEN: readonly EstadoLeccion[] = ['vista', 'practicada', 'dominada'];

export interface RegistroLeccion {
  estado: EstadoLeccion;
  fecha: string;
}

export interface Progreso {
  version: 1;
  lecciones: Record<string, RegistroLeccion>;
}

export const CLAVE_PROGRESO = 'traze:progreso';

export const progresoVacio = (): Progreso => ({ version: 1, lecciones: {} });

const esEstado = (valor: unknown): valor is EstadoLeccion =>
  typeof valor === 'string' && (ORDEN as readonly string[]).includes(valor);

export function estadoDe(progreso: Progreso, id: string): EstadoLeccion | null {
  return Object.hasOwn(progreso.lecciones, id) ? progreso.lecciones[id].estado : null;
}

export function registrar(
  progreso: Progreso,
  id: string,
  estado: EstadoLeccion,
  fecha: string,
): Progreso {
  const actual = estadoDe(progreso, id);
  if (actual !== null && ORDEN.indexOf(actual) >= ORDEN.indexOf(estado)) return progreso;
  return { ...progreso, lecciones: { ...progreso.lecciones, [id]: { estado, fecha } } };
}

export function resumir(
  progreso: Progreso,
  ids: readonly string[],
): Record<EstadoLeccion, number> {
  const cuentas: Record<EstadoLeccion, number> = { vista: 0, practicada: 0, dominada: 0 };
  for (const id of ids) {
    const estado = estadoDe(progreso, id);
    if (estado !== null) cuentas[estado]++;
  }
  return cuentas;
}

export function serializar(progreso: Progreso): string {
  return JSON.stringify(progreso);
}

export function leerProgreso(almacen: Pick<Storage, 'getItem'> | null): Progreso {
  try {
    const texto = almacen?.getItem(CLAVE_PROGRESO);
    if (!texto) return progresoVacio();
    const datos: unknown = JSON.parse(texto);
    if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) return progresoVacio();
    const { version, lecciones } = datos as { version?: unknown; lecciones?: unknown };
    if (version !== 1 || typeof lecciones !== 'object' || lecciones === null || Array.isArray(lecciones)) {
      return progresoVacio();
    }
    const limpio: Record<string, RegistroLeccion> = {};
    for (const [id, registro] of Object.entries(lecciones)) {
      const { estado, fecha } = (registro ?? {}) as { estado?: unknown; fecha?: unknown };
      if (!esEstado(estado) || typeof fecha !== 'string') return progresoVacio();
      limpio[id] = { estado, fecha };
    }
    return { version: 1, lecciones: limpio };
  } catch {
    return progresoVacio();
  }
}
```

- [ ] Paso 4: el envoltorio del navegador

`apps/web/src/progreso-navegador.ts`:

```ts
import {
  CLAVE_PROGRESO,
  leerProgreso,
  progresoVacio,
  registrar,
  serializar,
  type Progreso,
} from './progreso';

export function cargarProgresoNavegador(): Progreso {
  try {
    return leerProgreso(window.localStorage);
  } catch {
    return progresoVacio();
  }
}

export function registrarVista(id: string): void {
  try {
    const actual = cargarProgresoNavegador();
    const nuevo = registrar(actual, id, 'vista', new Date().toISOString().slice(0, 10));
    if (nuevo !== actual) window.localStorage.setItem(CLAVE_PROGRESO, serializar(nuevo));
  } catch {
    // Sin almacenamiento (navegación privada, cuota o bloqueo): la lección funciona igual.
  }
}
```

- [ ] Paso 5: marcar la lección como vista al llegar al último paso

La lección cuenta como vista cuando el reproductor llega al último paso, sea con la flecha de paso (`.flecha-siguiente`), con «Reproducir todo» o con «Ver solución completa»: los tres cambian `estado.paso`.

En `apps/web/src/componentes/Reproductor.tsx`.

Antes:

```tsx
import { duracionPaso } from '../reproductor/tiempos';
```

Después:

```tsx
import { registrarVista } from '../progreso-navegador';
import { duracionPaso } from '../reproductor/tiempos';
```

Antes:

```tsx
  useEffect(() => {
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
```

Después:

```tsx
  useEffect(() => {
    if (estado.paso === total - 1) registrarVista(leccion.id);
  }, [estado.paso, total, leccion.id]);

  useEffect(() => {
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
```

- [ ] Paso 6: ejecutar los tests y comprobar tipos

```bash
pnpm --filter @traze/web test
pnpm --filter @traze/web typecheck
pnpm --filter @traze/web build
```

Esperado: los 13 tests de `progreso.test.ts` pasan, los anteriores siguen en verde y el build termina sin errores (`localStorage` solo se toca dentro de funciones que se ejecutan en el navegador).

- [ ] Paso 7: confirmar

```bash
git add apps/web/src apps/web/test
git commit -m "feat(web): progreso del alumno en localStorage, tolerante a datos corruptos"
```

## Tarea 12: mapa del temario, portada y navegación entre lecciones

Archivos:

- Crear: `apps/web/src/temario.ts`, `apps/web/src/componentes/MapaTemario.tsx`, `apps/web/src/app/temario/page.tsx`, `apps/web/src/estilos/temario.css`
- Modificar: `apps/web/src/app/page.tsx`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/leccion/[id]/page.tsx`, `apps/web/src/navegacion.ts`, `apps/web/src/estilos/controles.css`, `apps/web/src/estilos/portada.css`, `apps/web/src/estilos/leccion.css`
- Test: `apps/web/test/navegacion.test.ts` (modificar)

Interfaces:

- Consume: `temarioSchema`, `comprobarCobertura`, `agruparPorBloque` (del temario; en la web se importa con el alias `agruparTemarioPorBloque` para no confundirlo con `agruparPorBloque` de `apps/web/src/portada.ts`), `vecinas`, `formatearIssue`, `BloqueDeMapa` (de `@traze/lecciones`); `cargarLecciones` (`apps/web/src/contenido.ts`); `estadoDe`, `progresoVacio`, `cargarProgresoNavegador` (Tarea 11); `ENLACES` de `apps/web/src/navegacion.ts`; las clases ya existentes `.pagina`, `.hoja`, `.bloque`, `.boton`, `.boton-principal`, `.etiqueta`, `.lema`.
- Produce: `cargarTemario(): Temario` (falla el build si `temario.json` es inválido o si alguna lección publicada no cumple su entrada); página `/temario` sobre la hoja; pestaña «Temario» activa en la cabecera (con `aria-current`); en cada lección, bajo el escenario y dentro de la hoja inferior, «Si te atascas, repasa», enlace al mapa y enlaces a la lección anterior y siguiente del temario (los pasos se recorren con las flechas del escenario, no con estos enlaces).

El estado del mapa («vista») lo pone el navegador tras cargar: el HTML estático no lo conoce, así que se lee en un efecto y no hay desajuste de hidratación. No se escribe test de componentes (el proyecto no tiene entorno de DOM para pruebas); la lógica está probada en las Tareas 5 y 11 y aquí se verifica con `build` y a ojo.

- [ ] Paso 1: cargar el temario en el servidor

`apps/web/src/temario.ts`:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { comprobarCobertura, formatearIssue, temarioSchema, type Temario } from '@traze/lecciones';
import { cargarLecciones } from './contenido';

const RUTA = join(process.cwd(), '..', '..', 'temario', 'temario.json');

let memoria: Temario | null = null;

export function cargarTemario(): Temario {
  if (memoria) return memoria;

  const resultado = temarioSchema.safeParse(JSON.parse(readFileSync(RUTA, 'utf-8')));
  if (!resultado.success) {
    throw new Error(`Temario inválido:\n- ${resultado.error.issues.map(formatearIssue).join('\n- ')}`);
  }

  const cobertura = comprobarCobertura(
    resultado.data,
    cargarLecciones().map(({ leccion }) => leccion),
  );
  if (cobertura.errores.length > 0) {
    throw new Error(`Las lecciones no cumplen el temario:\n- ${cobertura.errores.join('\n- ')}`);
  }

  memoria = resultado.data;
  return memoria;
}
```

- [ ] Paso 2: el componente del mapa

Cada lección del mapa es una fila (`.mapa-fila`) con el aspecto de las fichas de la portada. El enlace ocupa toda la fila en alto (44 px como mínimo) y el estado «Vista» se dice con texto, no solo con color.

`apps/web/src/componentes/MapaTemario.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { BloqueDeMapa } from '@traze/lecciones';
import { estadoDe, progresoVacio, type Progreso } from '../progreso';
import { cargarProgresoNavegador } from '../progreso-navegador';

const ETIQUETA = { vista: 'Vista', practicada: 'Practicada', dominada: 'Dominada' } as const;

export function MapaTemario({ bloques }: { bloques: BloqueDeMapa[] }) {
  const [progreso, setProgreso] = useState<Progreso>(progresoVacio);

  useEffect(() => {
    setProgreso(cargarProgresoNavegador());
  }, []);

  const publicadas = bloques.flatMap((bloque) => bloque.lecciones).filter((leccion) => leccion.publicada);
  const vistas = publicadas.filter((leccion) => estadoDe(progreso, leccion.id) !== null).length;

  return (
    <>
      <p className="mapa-resumen" aria-live="polite">
        Tu cuaderno: {vistas} de {publicadas.length} lecciones vistas.
      </p>
      {bloques.map((bloque) => (
        <section key={bloque.bloque} className="bloque" aria-labelledby={`bloque-${bloque.bloque}`}>
          <h2 id={`bloque-${bloque.bloque}`}>
            Bloque {bloque.bloque} · {bloque.nombre}
          </h2>
          <ol className="mapa-lista">
            {bloque.lecciones.map((leccion) => {
              const estado = estadoDe(progreso, leccion.id);
              return (
                <li
                  key={leccion.id}
                  className={leccion.publicada ? 'mapa-fila' : 'mapa-fila mapa-proxima'}
                >
                  {leccion.publicada ? (
                    <Link className="mapa-enlace" href={`/leccion/${leccion.id}`}>
                      {leccion.titulo}
                    </Link>
                  ) : (
                    <span className="mapa-enlace">{leccion.titulo}</span>
                  )}
                  {estado !== null && <span className="sello">{ETIQUETA[estado]}</span>}
                  {!leccion.publicada && <span className="mapa-nota">Próximamente</span>}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </>
  );
}
```

- [ ] Paso 3: la página del mapa

`apps/web/src/app/temario/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { agruparPorBloque as agruparTemarioPorBloque } from '@traze/lecciones';
import { MapaTemario } from '../../componentes/MapaTemario';
import { cargarLecciones } from '../../contenido';
import { cargarTemario } from '../../temario';

export const metadata: Metadata = {
  title: 'Temario',
  description:
    'Todo el temario de Dibujo Técnico de 1º de Bachillerato en una ruta ordenada, por bloques, con tu cuaderno de lecciones vistas.',
};

export default function PaginaTemario() {
  const publicadas = new Set(cargarLecciones().map(({ leccion }) => leccion.id));
  const bloques = agruparTemarioPorBloque(cargarTemario(), publicadas);

  return (
    <div className="pagina">
      <div className="hoja">
        <section className="temario">
          <h1>Temario de 1º de Bachillerato</h1>
          <p className="lema">
            Sigue la ruta de arriba abajo: cada lección se apoya en las anteriores. Tu progreso se
            guarda solo en este navegador.
          </p>
          <MapaTemario bloques={bloques} />
        </section>
      </div>
    </div>
  );
}
```

`.lema` está definido en `portada.css` solo dentro de `.portada`; para que también valga aquí, el Paso 6 lo generaliza.

- [ ] Paso 4: portada y pestaña «Temario»

La portada ya muestra las fichas agrupadas por bloque (`apps/web/src/portada.ts`); no se reescribe. Solo se le añade la fila de acciones con «Empezar por…» y «Ver el temario».

En `apps/web/src/app/page.tsx`.

Antes:

```tsx
import { cargarLecciones } from '../contenido';
import { agruparPorBloque, textoPasos } from '../portada';

export default function Portada() {
  const grupos = agruparPorBloque(cargarLecciones());
```

Después:

```tsx
import { cargarLecciones } from '../contenido';
import { agruparPorBloque, textoPasos } from '../portada';
import { cargarTemario } from '../temario';

export default function Portada() {
  const grupos = agruparPorBloque(cargarLecciones());
  const publicadas = new Set(grupos.flatMap((grupo) => grupo.items.map(({ leccion }) => leccion.id)));
  const primera = cargarTemario().lecciones.find((entrada) => publicadas.has(entrada.id));
```

Antes:

```tsx
          <p className="lema">Dibujo Técnico de 1º de Bachillerato, trazo a trazo.</p>
```

Después:

```tsx
          <p className="lema">Dibujo Técnico de 1º de Bachillerato, trazo a trazo.</p>

          <div className="acciones">
            {primera && (
              <Link className="boton boton-principal" href={`/leccion/${primera.id}`}>
                Empezar por «{primera.titulo}»
              </Link>
            )}
            <Link className="boton" href="/temario">
              Ver el temario
            </Link>
          </div>
```

En `apps/web/src/navegacion.ts` se activa la pestaña (`Cabecera` ya muestra solo las pestañas con `disponible: true` y marca la actual con `aria-current="page"`).

Antes:

```ts
  { texto: 'Temario', href: '/temario', disponible: false, coincide: seccion('/temario') },
```

Después:

```ts
  { texto: 'Temario', href: '/temario', disponible: true, coincide: seccion('/temario') },
```

En `apps/web/test/navegacion.test.ts`.

Antes:

```ts
  it('hoy solo muestra Lecciones (las páginas del Plan 3 aún no existen)', () => {
    expect(enlacesVisibles().map((enlace) => enlace.texto)).toEqual(['Lecciones']);
  });
```

Después:

```ts
  it('muestra Temario y Lecciones (Consejos y Mi carpeta aún no existen)', () => {
    expect(enlacesVisibles().map((enlace) => enlace.texto)).toEqual(['Temario', 'Lecciones']);
  });
```

Y, dentro de `describe('esActivo', …)`, añade al final:

```ts
  it('Temario está activo en /temario (con o sin barra final) y no en las lecciones', () => {
    const temario = ENLACES.find((enlace) => enlace.texto === 'Temario')!;
    expect(esActivo(temario, '/temario')).toBe(true);
    expect(esActivo(temario, '/temario/')).toBe(true);
    expect(esActivo(temario, '/temarioviejo')).toBe(false);
    expect(esActivo(temario, '/leccion/mediatriz-segmento')).toBe(false);
  });
```

El test existente «no se activa con un prefijo parecido ni en otras secciones» sigue valiendo tal cual (comprueba `/temario` contra «Lecciones», no contra «Temario»).

- [ ] Paso 5: requisitos y lección anterior/siguiente en la hoja bajo el escenario

La página de la lección ya es: el `Reproductor` (escenario a toda la página, con título, cajetín, post-its, flechas de paso y barra «Reproducir todo») y debajo una `.pagina > .hoja` con enunciado, errores y los pasos por escrito. Aquí solo se añade a esa hoja: «Si te atascas, repasa» dentro del enunciado y, al final, la navegación entre lecciones. El cajetín y el título los pone el escenario: no se duplican. La navegación entre pasos son las flechas del escenario; estos enlaces llevan de una lección a otra.

En `apps/web/src/app/leccion/[id]/page.tsx`.

Antes:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Reproductor } from '../../../componentes/Reproductor';
import { cargarLeccion, cargarLecciones } from '../../../contenido';
```

Después:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { vecinas } from '@traze/lecciones';
import { Reproductor } from '../../../componentes/Reproductor';
import { cargarLeccion, cargarLecciones } from '../../../contenido';
import { cargarTemario } from '../../../temario';
```

Antes:

```tsx
  const { leccion, resuelta } = cargada;

  return (
```

Después:

```tsx
  const { leccion, resuelta } = cargada;
  const temario = cargarTemario();
  const publicadas = new Set(cargarLecciones().map(({ leccion: otra }) => otra.id));
  const { anterior, siguiente } = vecinas(temario, publicadas, id);
  const requisitos = leccion.requisitos.flatMap((idRequisito) => {
    const entrada = temario.lecciones.find((candidata) => candidata.id === idRequisito);
    return entrada ? [entrada] : [];
  });

  return (
```

Antes:

```tsx
            <p className="idea-clave">
              <strong>Idea clave.</strong> {leccion.ideaClave}
            </p>
          </section>
```

Después:

```tsx
            <p className="idea-clave">
              <strong>Idea clave.</strong> {leccion.ideaClave}
            </p>
            {requisitos.length > 0 && (
              <div className="requisitos">
                <p className="etiqueta">Si te atascas, repasa</p>
                <ul>
                  {requisitos.map((requisito) => (
                    <li key={requisito.id}>
                      {publicadas.has(requisito.id) ? (
                        <Link href={`/leccion/${requisito.id}`}>{requisito.titulo}</Link>
                      ) : (
                        <span>{requisito.titulo} (próximamente)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
```

Antes:

```tsx
            </ol>
          </details>
        </div>
      </div>
    </article>
```

Después:

```tsx
            </ol>
          </details>

          <nav className="nav-leccion" aria-label="Lección anterior y siguiente">
            {anterior ? (
              <Link className="nav-leccion-enlace" href={`/leccion/${anterior.id}`} rel="prev">
                <span className="etiqueta">← Lección anterior</span>
                <span className="nav-leccion-titulo">{anterior.titulo}</span>
              </Link>
            ) : (
              <span />
            )}
            <Link className="boton" href="/temario">
              Ver el temario
            </Link>
            {siguiente ? (
              <Link
                className="nav-leccion-enlace nav-leccion-siguiente"
                href={`/leccion/${siguiente.id}`}
                rel="next"
              >
                <span className="etiqueta">Lección siguiente →</span>
                <span className="nav-leccion-titulo">{siguiente.titulo}</span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>
      </div>
    </article>
```

- [ ] Paso 6: estilos (todo con tokens, sin colores literales)

En `apps/web/src/estilos/controles.css`, añade al final (los enlaces con aspecto de botón, que `.boton` ya cubre para `<button>`):

```css

a.boton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}
```

En `apps/web/src/estilos/portada.css`.

Antes:

```css
.portada .lema {
  margin: 0 0 var(--e6);
```

Después:

```css
.lema {
  margin: 0 0 var(--e5);
```

(el resto de la regla, `font-family`, `font-size` y `color`, no cambia) y añade al final:

```css

.acciones {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e3);
  margin: 0 0 var(--e5);
}
```

En `apps/web/src/estilos/leccion.css`, añade al final:

```css

/* Si te atascas, repasa */
.requisitos {
  margin-top: var(--e4);
}

.requisitos ul {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e2);
  margin: var(--e1) 0 0;
  padding: 0;
  list-style: none;
}

.requisitos li > a,
.requisitos li > span {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--e3);
  border: 1px solid var(--papel-sombra);
  border-radius: var(--radio-pildora);
  background: var(--papel-claro);
}

.requisitos li > span {
  color: var(--tinta-suave);
}

/* Lección anterior y siguiente: bajo el escenario, al pie de la hoja */
.nav-leccion {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: stretch;
  gap: var(--e3);
  margin-top: var(--e6);
  padding-top: var(--e4);
  border-top: 1px solid var(--papel-sombra);
}

.nav-leccion-enlace {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--e1);
  min-height: 44px;
  padding: var(--e2) var(--e4);
  border: 1px solid var(--papel-sombra);
  border-radius: var(--radio-medio);
  background: var(--papel-claro);
  box-shadow: var(--sombra-boton);
  color: var(--tinta);
  text-decoration: none;
}

.nav-leccion-enlace:hover {
  border-color: var(--azul-correccion);
}

.nav-leccion-siguiente {
  text-align: right;
}

.nav-leccion-titulo {
  font-family: var(--serif);
  font-weight: 600;
}

.nav-leccion > .boton {
  align-self: center;
}

@media (max-width: 700px) {
  .nav-leccion {
    grid-template-columns: 1fr;
  }

  .nav-leccion-siguiente {
    text-align: left;
  }
}
```

Crea `apps/web/src/estilos/temario.css`:

```css
/* Mapa del temario: una fila por lección, con el aire de las fichas de la portada */
.mapa-resumen {
  margin: 0 0 var(--e5);
  color: var(--tinta-suave);
}

.mapa-lista {
  display: grid;
  gap: var(--e2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.mapa-fila {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--e3);
  min-height: 44px;
  padding: 0 var(--e4);
  border: 1px solid var(--papel-sombra);
  border-radius: var(--radio-medio);
  background: var(--papel-claro);
  box-shadow: var(--sombra-boton);
}

.mapa-enlace {
  display: flex;
  flex: 1 1 12rem;
  align-items: center;
  min-height: 44px;
  color: var(--tinta);
  font-family: var(--serif);
  font-size: 1.05rem;
  font-weight: 600;
  text-decoration: none;
}

a.mapa-enlace:hover {
  color: var(--azul-correccion);
  text-decoration: underline;
}

.mapa-proxima {
  border-style: dashed;
  background: transparent;
  box-shadow: none;
}

.mapa-proxima .mapa-enlace {
  color: var(--tinta-suave);
  font-weight: 400;
}

/* El estado se dice con texto además del color */
.sello {
  padding: var(--e1) var(--e3);
  border: 1px solid var(--exito-texto);
  border-radius: var(--radio-pildora);
  background: var(--exito-suave);
  color: var(--exito-texto);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mapa-nota {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tinta-suave);
}
```

Los pares de color que usa (tinta, azul-correccion y tinta-suave sobre papel y papel-claro; exito-texto sobre exito-suave) ya están en `PARES` de `apps/web/test/contraste.test.ts`: no hace falta añadir ninguno. Si al escribir el CSS cambias un fondo o un color de texto, añade su par ahí.

En `apps/web/src/app/layout.tsx`, importa el CSS nuevo después del de la portada.

Antes:

```tsx
import '../estilos/portada.css';
```

Después:

```tsx
import '../estilos/portada.css';
import '../estilos/temario.css';
```

(`layout.tsx` no cambia de otro modo: la cabecera con la navegación y el logo de lápiz ya son el componente `Cabecera`.)

- [ ] Paso 7: comprobar tipos, tests y build

```bash
pnpm --filter @traze/web typecheck
pnpm --filter @traze/web test
pnpm --filter @traze/web build
```

Esperado: tipos y tests en verde (incluidos `tokens.test.ts`, que comprueba que `temario.css`, `leccion.css`, `portada.css` y `controles.css` no tienen colores literales, y `navegacion.test.ts`) y `build` sin errores. En el build aparecen `/`, `/temario` y una página por cada lección. Con la web ya con las 22 lecciones: `ls apps/web/out/leccion/*.html | wc -l` da 22 (23 con una lección dividida) y `apps/web/out/temario.html` existe.

- [ ] Paso 8: verificar a ojo con `pnpm web` (si el agente puede abrir el navegador; si no, lo anota como pendiente para el usuario)

En `http://localhost:3000/temario`: la hoja con los bloques 0 a 7 y sus lecciones en filas enlazadas, sin «Próximamente» (si el temario está completo), el contador «Tu cuaderno: 0 de 22 lecciones vistas», y la pestaña «Temario» subrayada en la cabecera. Abre una lección, llega al último paso con la flecha de paso sobre el plano (o con «Reproducir todo») y vuelve al mapa: esa lección muestra el sello «Vista» y el contador sube. Abre una ventana privada y comprueba que el mapa se muestra igual. En la lección: bajo el escenario, la hoja muestra el enunciado con «Si te atascas, repasa» (enlaces a los requisitos) y, al final, «Lección anterior», «Ver el temario» y «Lección siguiente». En la portada: el botón «Empezar por…» lleva a la primera lección de la ruta. Recorre la cabecera, el mapa y la navegación con el teclado (Tab) y comprueba que el foco azul se ve. Con la ventana a 375 px de ancho nada desborda y los enlaces miden al menos 44 px de alto.

- [ ] Paso 9: confirmar

```bash
git add apps/web/src apps/web/test
git commit -m "feat(web): mapa del temario con progreso vista, portada y navegacion entre lecciones"
```

## Tarea 13: página de consejos

Archivos:

- Crear: `apps/web/src/consejos.ts`, `apps/web/src/componentes/BibliotecaConsejos.tsx`, `apps/web/src/app/consejos/page.tsx`, `apps/web/src/estilos/consejos.css`
- Modificar: `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/navegacion.ts`, `apps/web/test/navegacion.test.ts`

Interfaces:

- Consume: `consejosGeneralesSchema`, `reunirConsejos`, `formatearIssue` (de `@traze/lecciones`); `buscarConsejos`, `temasDisponibles`, `ETIQUETA_TIPO`, `ConsejoBiblioteca` (de `@traze/lecciones/busqueda`, sin Zod); `cargarLecciones`.
- Produce: página `/consejos` (sobre `.pagina` / `.hoja`) con buscador, filtro por tema, consejos como post-its con enlace a su lección y la lista de comprobación final de lámina; pestaña «Consejos» activa en la cabecera.

- [ ] Paso 1: cargar los consejos en el servidor

`apps/web/src/consejos.ts`:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  consejosGeneralesSchema,
  formatearIssue,
  reunirConsejos,
  type ConsejoBiblioteca,
  type ConsejosGenerales,
} from '@traze/lecciones';
import { cargarLecciones } from './contenido';

const RUTA = join(process.cwd(), '..', '..', 'consejos', 'generales.json');

let memoria: ConsejosGenerales | null = null;

export function cargarConsejosGenerales(): ConsejosGenerales {
  if (memoria) return memoria;
  const resultado = consejosGeneralesSchema.safeParse(JSON.parse(readFileSync(RUTA, 'utf-8')));
  if (!resultado.success) {
    throw new Error(`Consejos inválidos:\n- ${resultado.error.issues.map(formatearIssue).join('\n- ')}`);
  }
  memoria = resultado.data;
  return memoria;
}

export function cargarBiblioteca(): ConsejoBiblioteca[] {
  return reunirConsejos(
    cargarConsejosGenerales(),
    cargarLecciones().map(({ leccion }) => leccion),
  );
}
```

- [ ] Paso 2: el componente con el buscador

Cada consejo es una nota adhesiva (`.postit`, la misma del escenario de la lección): amarilla para los consejos de oficio y azul (`.consejo-leccion`) para los de un paso de una lección, que llevan enlace. Así el enlace (azul de corrección) siempre va sobre el post-it azul, un par de colores que ya está en el test de contraste. El buscador y el selector reutilizan `.campo` y `.selector` de `controles.css`.

`apps/web/src/componentes/BibliotecaConsejos.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ETIQUETA_TIPO,
  buscarConsejos,
  temasDisponibles,
  type ConsejoBiblioteca,
} from '@traze/lecciones/busqueda';

export function BibliotecaConsejos({ consejos }: { consejos: ConsejoBiblioteca[] }) {
  const [consulta, setConsulta] = useState('');
  const [tema, setTema] = useState('');
  const temas = useMemo(() => temasDisponibles(consejos), [consejos]);
  const visibles = useMemo(
    () => buscarConsejos(consejos, { consulta, tema }),
    [consejos, consulta, tema],
  );

  return (
    <>
      <div className="consejos-filtros">
        <label className="campo">
          Buscar
          <input
            type="search"
            className="campo-texto"
            value={consulta}
            onChange={(evento) => setConsulta(evento.target.value)}
            placeholder="compás, tangente, grosor…"
          />
        </label>
        <label className="campo">
          Tema
          <select
            className="selector"
            value={tema}
            onChange={(evento) => setTema(evento.target.value)}
          >
            <option value="">Todos</option>
            {temas.map((nombre) => (
              <option key={nombre} value={nombre}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p role="status" className="mapa-resumen">
        {visibles.length === 1 ? '1 consejo' : `${visibles.length} consejos`}
      </p>

      {visibles.length === 0 ? (
        <p>No hay consejos con esa búsqueda. Prueba con otra palabra o quita el filtro de tema.</p>
      ) : (
        <ul className="consejos-lista">
          {visibles.map((consejo) => (
            <li
              key={consejo.id}
              className={consejo.leccion ? 'postit consejo consejo-leccion' : 'postit consejo'}
            >
              <p className="etiqueta">{consejo.tipo ? ETIQUETA_TIPO[consejo.tipo] : consejo.tema}</p>
              <p>{consejo.texto}</p>
              {consejo.leccion && (
                <p className="consejo-origen">
                  <Link href={`/leccion/${consejo.leccion.id}`}>
                    {consejo.leccion.titulo}, paso {consejo.leccion.paso}
                  </Link>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
```

- [ ] Paso 3: la página

`apps/web/src/app/consejos/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { BibliotecaConsejos } from '../../componentes/BibliotecaConsejos';
import { cargarBiblioteca, cargarConsejosGenerales } from '../../consejos';

export const metadata: Metadata = {
  title: 'Consejos para hacerlo perfecto',
  description:
    'Consejos de oficio para Dibujo Técnico: material, uso del compás y la escuadra, precisión y limpieza, y la lista de comprobación final de una lámina.',
};

export default function PaginaConsejos() {
  const biblioteca = cargarBiblioteca();
  const { listaComprobacion } = cargarConsejosGenerales();

  return (
    <div className="pagina">
      <div className="hoja">
        <section className="consejos">
          <h1>Consejos para hacerlo perfecto</h1>
          <p className="lema">
            Los de oficio y los de cada paso de cada lección. Cada uno cabe en dos líneas y se puede
            copiar al cuaderno.
          </p>

          <BibliotecaConsejos consejos={biblioteca} />

          <section className="lista-lamina" aria-labelledby="lista-lamina">
            <h2 id="lista-lamina">Lista de comprobación de una lámina</h2>
            <p>Antes de entregar, repasa:</p>
            <ul>
              {listaComprobacion.map((punto) => (
                <li key={punto}>{punto}</li>
              ))}
            </ul>
          </section>
        </section>
      </div>
    </div>
  );
}
```

- [ ] Paso 4: estilos, pestaña «Consejos» y enlace desde la portada

Crea `apps/web/src/estilos/consejos.css` (solo tokens; los pares de color que usa, tinta y tinta-suave sobre papel-claro, postit-amarillo y postit-azul y azul-correccion sobre postit-azul, ya están en `PARES` de `apps/web/test/contraste.test.ts`):

```css
.consejos-filtros {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e4);
  margin: 0 0 var(--e4);
}

.consejos-filtros .campo {
  flex-wrap: wrap;
}

.campo-texto {
  min-width: min(100%, 18rem);
  min-height: 44px;
  padding: 0 var(--e3);
  border: 1px solid var(--tinta);
  border-radius: var(--radio-pildora);
  background: var(--papel-claro);
  color: var(--tinta);
  font: inherit;
}

.consejos-lista {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: var(--e4);
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Notas adhesivas rectas: en una lista larga el giro del escenario estorba */
.consejo {
  --giro: 0deg;
  margin: 0;
}

.consejo-leccion {
  background: var(--postit-azul);
}

.consejo-origen a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
}

.lista-lamina {
  margin-top: var(--e6);
  padding: var(--e4);
  border: 2px solid var(--tinta);
  border-radius: var(--radio-chico);
  background: var(--papel-claro);
}

.lista-lamina h2 {
  margin-top: 0;
}

.lista-lamina li {
  margin-bottom: var(--e2);
}
```

En `apps/web/src/app/layout.tsx`.

Antes:

```tsx
import '../estilos/temario.css';
```

Después:

```tsx
import '../estilos/temario.css';
import '../estilos/consejos.css';
```

En `apps/web/src/navegacion.ts` se activa la pestaña (con `aria-current="page"` cuando se está en `/consejos`).

Antes:

```ts
  { texto: 'Consejos', href: '/consejos', disponible: false, coincide: seccion('/consejos') },
```

Después:

```ts
  { texto: 'Consejos', href: '/consejos', disponible: true, coincide: seccion('/consejos') },
```

En `apps/web/test/navegacion.test.ts`.

Antes:

```ts
  it('muestra Temario y Lecciones (Consejos y Mi carpeta aún no existen)', () => {
    expect(enlacesVisibles().map((enlace) => enlace.texto)).toEqual(['Temario', 'Lecciones']);
  });
```

Después:

```ts
  it('muestra Temario, Lecciones y Consejos (Mi carpeta aún no existe)', () => {
    expect(enlacesVisibles().map((enlace) => enlace.texto)).toEqual([
      'Temario',
      'Lecciones',
      'Consejos',
    ]);
  });
```

Y, dentro de `describe('esActivo', …)`, añade al final:

```ts
  it('Consejos está activo en /consejos y no en otras secciones', () => {
    const consejos = ENLACES.find((enlace) => enlace.texto === 'Consejos')!;
    expect(esActivo(consejos, '/consejos')).toBe(true);
    expect(esActivo(consejos, '/consejos/')).toBe(true);
    expect(esActivo(consejos, '/consejosviejos')).toBe(false);
    expect(esActivo(consejos, '/temario')).toBe(false);
  });
```

En `apps/web/src/app/page.tsx` (la fila de acciones de la Tarea 12).

Antes:

```tsx
            <Link className="boton" href="/temario">
              Ver el temario
            </Link>
          </div>
```

Después:

```tsx
            <Link className="boton" href="/temario">
              Ver el temario
            </Link>
            <Link className="boton" href="/consejos">
              Consejos para hacerlo perfecto
            </Link>
          </div>
```

- [ ] Paso 5: comprobar tipos, tests y build

```bash
pnpm --filter @traze/web typecheck
pnpm --filter @traze/web test
pnpm --filter @traze/web build
```

Esperado: sin errores (`tokens.test.ts` confirma que `consejos.css` no usa colores literales); el build incluye `/consejos`. Para confirmar que el cliente no carga Zod: `grep -l "ZodError" apps/web/.next/static/chunks/*.js` no debe encontrar ningún archivo (si lo encuentra, algún componente del cliente importa del barril `@traze/lecciones` en lugar de la subruta o de `import type`).

- [ ] Paso 6: verificar a ojo con `pnpm web` (si el agente puede abrir el navegador; si no, lo anota como pendiente para el usuario)

En `http://localhost:3000/consejos`: la pestaña «Consejos» subrayada, los consejos como post-its (amarillos los de oficio, con su tipo; azules los de cada lección, con su enlace «Lección, paso N»). Busca `aurea` y `ÁUREA` (mismos resultados), busca `compas` (encuentra «compás»), elige un tema en el desplegable, y comprueba que con una búsqueda sin resultados aparece el mensaje. Todo el formulario se maneja con teclado y el foco se ve. La lista de comprobación final aparece al pie. A 375 px de ancho no hay desbordamiento y el buscador y el selector miden al menos 44 px de alto.

- [ ] Paso 7: confirmar

```bash
git add apps/web/src apps/web/test
git commit -m "feat(web): biblioteca de consejos con buscador y lista de comprobacion de lamina"
```

## Tarea 14: SEO

Archivos:

- Crear: `apps/web/src/seo.ts`, `apps/web/src/app/sitemap.ts`, `apps/web/src/app/robots.ts`, `apps/web/.env.example`
- Modificar: `apps/web/src/app/layout.tsx`, `apps/web/src/app/leccion/[id]/page.tsx`, `apps/web/src/app/temario/page.tsx`, `apps/web/src/app/consejos/page.tsx`
- Test: `apps/web/test/seo.test.ts`

Interfaces:

- Consume: `Leccion`, `LeccionResuelta`, `procesarLeccion` (en el test) de `@traze/lecciones`; `cargarLecciones`.
- Produce: `urlDelSitio(env?)`, `rutaLeccion(id)`, `tituloSeo(titulo)`, `descripcionSeo(leccion, maximo?)`, `datosEstructurados(leccion, resuelta, base)` (HowTo de schema.org), `jsonLdSeguro(datos)`; `/sitemap.xml` y `/robots.txt` estáticos; metadatos propios por página.

Los pasos de cada lección ya están escritos en HTML (el reproductor se renderiza en el servidor y el desplegable «Los pasos por escrito» de la hoja inferior lleva todos, aunque esté cerrado); esta tarea no toca estilos ni el marcado visual de la lección, y añade lo que falta: título y descripción propios, canonical, Open Graph, datos estructurados, sitemap y robots.

- [ ] Paso 1: escribir el test que falla

`apps/web/test/seo.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { procesarLeccion } from '@traze/lecciones';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import {
  datosEstructurados,
  descripcionSeo,
  jsonLdSeguro,
  rutaLeccion,
  tituloSeo,
  urlDelSitio,
} from '../src/seo';

describe('urlDelSitio', () => {
  it('usa localhost si no hay variable', () => {
    expect(urlDelSitio(undefined)).toBe('http://localhost:3000');
    expect(urlDelSitio('   ')).toBe('http://localhost:3000');
  });

  it('quita la barra final', () => {
    expect(urlDelSitio('https://traze.example/')).toBe('https://traze.example');
    expect(urlDelSitio('https://traze.example///')).toBe('https://traze.example');
  });
});

describe('título y descripción', () => {
  it('compone el título con el nombre de la lección', () => {
    expect(tituloSeo('Mediatriz de un segmento')).toBe('Mediatriz de un segmento: trazado paso a paso');
  });

  it('deja intacta una descripción corta', () => {
    expect(descripcionSeo({ enunciado: 'Traza la mediatriz.', ideaClave: 'Equidistan de A y B.' })).toBe(
      'Traza la mediatriz. Equidistan de A y B.',
    );
  });

  it('recorta una descripción larga sin partir palabras ni pasarse', () => {
    const descripcion = descripcionSeo({
      enunciado: 'palabra '.repeat(30).trim(),
      ideaClave: 'otra '.repeat(10).trim(),
    });
    expect(descripcion.length).toBeLessThanOrEqual(155);
    expect(descripcion.endsWith('…')).toBe(true);
    expect(descripcion.slice(0, -1).trim().endsWith('palabra')).toBe(true);
  });

  it('colapsa los saltos de línea y los espacios repetidos', () => {
    expect(descripcionSeo({ enunciado: 'Uno\n\ndos', ideaClave: '  tres ' })).toBe('Uno dos tres');
  });
});

describe('datos estructurados', () => {
  const procesada = procesarLeccion(piloto);
  if (!procesada.ok) throw new Error(procesada.errores.join('\n'));
  const datos = datosEstructurados(procesada.leccion, procesada.resuelta, 'https://traze.example');

  it('describe la lección como un HowTo con un paso por cada paso', () => {
    expect(datos['@type']).toBe('HowTo');
    expect(datos.name).toBe('Mediatriz de un segmento');
    expect(datos.url).toBe(`https://traze.example${rutaLeccion('mediatriz-segmento')}`);
    expect(datos.step).toHaveLength(procesada.resuelta.pasos.length);
    expect(datos.step[0]).toMatchObject({ '@type': 'HowToStep', position: 1, name: 'Los datos' });
  });

  it('el JSON incrustado no puede cerrar la etiqueta script', () => {
    const texto = jsonLdSeguro({ texto: '</script><b>' });
    expect(texto).not.toContain('<');
    expect(JSON.parse(texto)).toEqual({ texto: '</script><b>' });
  });
});
```

- [ ] Paso 2: ejecutar el test y comprobar que falla

Ejecuta: `pnpm --filter @traze/web test`

Esperado: `seo.test.ts` FALLA porque `../src/seo` no existe; lo demás sigue pasando.

- [ ] Paso 3: el módulo de SEO

`apps/web/src/seo.ts`:

```ts
import type { Leccion, LeccionResuelta } from '@traze/lecciones';

const URL_POR_DEFECTO = 'http://localhost:3000';

export function urlDelSitio(env: string | undefined = process.env.NEXT_PUBLIC_SITE_URL): string {
  const base = (env ?? '').trim() || URL_POR_DEFECTO;
  return base.replace(/\/+$/, '');
}

export const rutaLeccion = (id: string): string => `/leccion/${id}`;

export const tituloSeo = (titulo: string): string => `${titulo}: trazado paso a paso`;

export function descripcionSeo(
  leccion: Pick<Leccion, 'enunciado' | 'ideaClave'>,
  maximo = 155,
): string {
  const texto = `${leccion.enunciado} ${leccion.ideaClave}`.replace(/\s+/g, ' ').trim();
  if (texto.length <= maximo) return texto;
  const corte = texto.slice(0, maximo - 1);
  const ultimoEspacio = corte.lastIndexOf(' ');
  const entero = ultimoEspacio > 0 ? corte.slice(0, ultimoEspacio) : corte;
  return `${entero.replace(/[\s,.;:]+$/, '')}…`;
}

export function datosEstructurados(leccion: Leccion, resuelta: LeccionResuelta, base: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: leccion.titulo,
    description: descripcionSeo(leccion),
    inLanguage: 'es-ES',
    url: `${base}${rutaLeccion(leccion.id)}`,
    step: resuelta.pasos.map((paso, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: paso.titulo,
      text: `${paso.texto} ${paso.porque}`,
    })),
  };
}

export function jsonLdSeguro(datos: unknown): string {
  return JSON.stringify(datos).replace(/</g, '\\u003c');
}
```

- [ ] Paso 4: ejecutar el test y comprobar que pasa

Ejecuta: `pnpm --filter @traze/web test`

Esperado: los 8 tests de `seo.test.ts` pasan.

- [ ] Paso 5: sitemap, robots y variable de entorno

`apps/web/src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next';
import { cargarLecciones } from '../contenido';
import { rutaLeccion, urlDelSitio } from '../seo';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = urlDelSitio();
  const rutas = [
    '/',
    '/temario',
    '/consejos',
    ...cargarLecciones().map(({ leccion }) => rutaLeccion(leccion.id)),
  ];
  return rutas.map((ruta) => ({ url: `${base}${ruta === '/' ? '' : ruta}` }));
}
```

`apps/web/src/app/robots.ts`:

```ts
import type { MetadataRoute } from 'next';
import { urlDelSitio } from '../seo';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${urlDelSitio()}/sitemap.xml`,
  };
}
```

`apps/web/.env.example`:

```text
# Dirección pública del sitio (sin barra final). Hay que definirla en el build de producción:
# la usan el sitemap, el robots, las URL canónicas y los datos estructurados.
NEXT_PUBLIC_SITE_URL=https://traze.example
```

- [ ] Paso 6: metadatos en el layout y en las páginas

En `apps/web/src/app/layout.tsx`.

Antes:

```tsx
import '../estilos/consejos.css';

export const metadata: Metadata = {
  title: { default: 'Traze: Dibujo Técnico paso a paso', template: '%s · Traze' },
  description:
    'Aprende los trazados de Dibujo Técnico de 1º de Bachillerato viendo cómo se construyen, paso a paso.',
};
```

Después:

```tsx
import '../estilos/consejos.css';
import { urlDelSitio } from '../seo';

export const metadata: Metadata = {
  metadataBase: new URL(urlDelSitio()),
  title: { default: 'Traze: Dibujo Técnico paso a paso', template: '%s · Traze' },
  description:
    'Aprende los trazados de Dibujo Técnico de 1º de Bachillerato viendo cómo se construyen, paso a paso.',
  openGraph: { siteName: 'Traze', locale: 'es_ES', type: 'website' },
};
```

En `apps/web/src/app/temario/page.tsx`, añade `alternates` al objeto `metadata`.

Antes:

```tsx
export const metadata: Metadata = {
  title: 'Temario',
```

Después:

```tsx
export const metadata: Metadata = {
  alternates: { canonical: '/temario' },
  title: 'Temario',
```

En `apps/web/src/app/consejos/page.tsx`.

Antes:

```tsx
export const metadata: Metadata = {
  title: 'Consejos para hacerlo perfecto',
```

Después:

```tsx
export const metadata: Metadata = {
  alternates: { canonical: '/consejos' },
  title: 'Consejos para hacerlo perfecto',
```

En `apps/web/src/app/leccion/[id]/page.tsx`.

Antes:

```tsx
import { Reproductor } from '../../../componentes/Reproductor';
import { cargarLeccion, cargarLecciones } from '../../../contenido';
import { cargarTemario } from '../../../temario';
```

Después:

```tsx
import { Reproductor } from '../../../componentes/Reproductor';
import { cargarLeccion, cargarLecciones } from '../../../contenido';
import {
  datosEstructurados,
  descripcionSeo,
  jsonLdSeguro,
  rutaLeccion,
  tituloSeo,
  urlDelSitio,
} from '../../../seo';
import { cargarTemario } from '../../../temario';
```

Antes:

```tsx
  if (!cargada) return {};
  return { title: cargada.leccion.titulo, description: cargada.leccion.enunciado };
}
```

Después:

```tsx
  if (!cargada) return {};
  const titulo = tituloSeo(cargada.leccion.titulo);
  const descripcion = descripcionSeo(cargada.leccion);
  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: rutaLeccion(id) },
    openGraph: { title: titulo, description: descripcion, url: rutaLeccion(id), type: 'article' },
  };
}
```

El bloque de datos estructurados va dentro del `<article>`, antes del escenario (el título y el cajetín los pone el `Reproductor`; no hay cabecera de lección aparte).

Antes:

```tsx
    <article className="leccion">
      <Reproductor leccion={leccion} resuelta={resuelta} />
```

Después:

```tsx
    <article className="leccion">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSeguro(datosEstructurados(leccion, resuelta, urlDelSitio())),
        }}
      />
      <Reproductor leccion={leccion} resuelta={resuelta} />
```

- [ ] Paso 7: comprobar tipos, tests y build

```bash
pnpm --filter @traze/web typecheck
pnpm --filter @traze/web test
NEXT_PUBLIC_SITE_URL=https://traze.example pnpm --filter @traze/web build
```

Esperado: sin errores. Después, desde la raíz:

```bash
ls apps/web/out/sitemap.xml apps/web/out/robots.txt
grep -c "<loc>" apps/web/out/sitemap.xml
grep -o "https://traze.example/leccion/bisectriz-angulo" apps/web/out/sitemap.xml
grep -o '<link rel="canonical" href="[^"]*"' apps/web/out/leccion/bisectriz-angulo.html
grep -o 'application/ld+json' apps/web/out/leccion/bisectriz-angulo.html | head -1
grep -o "<title>[^<]*</title>" apps/web/out/leccion/bisectriz-angulo.html
```

Esperado: los dos archivos existen; `<loc>` aparece 25 veces (portada, temario, consejos y 22 lecciones; 26 si se dividió una lección); la URL de la bisectriz aparece en el sitemap; el canonical apunta a `https://traze.example/leccion/bisectriz-angulo`; hay un bloque `application/ld+json`; el título es `Bisectriz de un ángulo: trazado paso a paso · Traze`. Si `bisectriz-angulo` no existe todavía en tu estado de ejecución, usa cualquier otra lección publicada.

- [ ] Paso 8: confirmar

```bash
git add apps/web
git commit -m "feat(web): SEO con titulo y descripcion propios, canonical, datos estructurados, sitemap y robots"
```

## Tarea 15: verificación final

Archivos: ninguno nuevo. Comprueba que todo el plan funciona junto.

- [ ] Paso 1: la suite completa, tipos y contenido

```bash
pnpm test
pnpm typecheck
pnpm validar
pnpm temario --completo
```

Esperado: los tres paquetes en verde; tipos sin errores; `pnpm validar` termina con `Lecciones válidas: 22 de 22` (el total que haya si se dividió alguna lección); `pnpm temario --completo` sale con 0 y sin errores ni avisos que sean errores (los avisos de consejos largos o de lecciones con menos de 6 pasos se corrigen regenerando la lección con `--reemplazar`).

- [ ] Paso 2: los archivos generados están al día

Ejecuta: `pnpm prompt` y después `git status --short generacion`

Esperado: sin cambios. Si hay cambios, el último cambio de vocabulario no se había regenerado: confírmalos.

- [ ] Paso 3: el estado de la revisión

```bash
pnpm estado
pnpm temario --publicable
```

Esperado: `pnpm estado` marca con ⚑ las lecciones de los bloques 5 y 7 que no estén revisadas. `pnpm temario --publicable` falla mientras la revisión humana no llegue al mínimo y lista exactamente qué falta (cada lección prioritaria sin revisar y cuántas de muestra faltan). Este comando no tiene que pasar para cerrar el plan: es la puerta del despliegue. Si la persona revisora ya ha terminado, debe salir con 0.

- [ ] Paso 4: construir el sitio completo

```bash
NEXT_PUBLIC_SITE_URL=https://traze.example pnpm --filter @traze/web build
ls apps/web/out/leccion/*.html | wc -l
grep -c "<loc>" apps/web/out/sitemap.xml
```

Esperado: `build` sin errores; 22 archivos de lección (o los que haya); 25 entradas en el sitemap (22 + 3).

- [ ] Paso 5: recorrido manual con `pnpm web`

1. Portada: el botón «Empezar por «Uso del compás: transportar un segmento»» lleva a la primera lección; el menú da acceso a Temario y Consejos.
2. Recorre en el navegador una lección de cada bloque (0 a 7): los pasos se animan, no hay etiquetas solapadas ni trazos fuera del lienzo, las flechas de paso aparecen sobre el plano y cada consejo aparece en el post-it de su paso. El post-it «Prueba otros datos» solo aparece en las lecciones cuyo radio declara `deslizador`. Prueba también con «prefers-reduced-motion» activado (se ve cada paso terminado sin animar). Bajo el escenario, la hoja muestra enunciado, requisitos, errores, pasos por escrito y los enlaces a la lección anterior y siguiente.
3. Temario: marca como vista la primera lección y comprueba el sello y el contador; en una ventana privada el mapa funciona con el contador a 0.
4. Consejos: busca «aurea», «tangente» y «compás»; filtra por un tema.
5. Navegación completa con teclado (Tab, Enter) en menú, mapa, buscador y controles de lección, con el foco visible.
6. En una pantalla de 375 px de ancho (vista móvil) las páginas de temario, consejos y lección se ven sin desbordar y los botones, enlaces y el buscador miden al menos 44 px de alto.
7. `pnpm --filter @traze/web test` en verde confirma además que no hay colores literales fuera de `tokens.css` y que los pares de contraste AA se cumplen.

Si el agente no puede abrir un navegador, deja los puntos 1 a 6 anotados como pendientes para el usuario en su informe final.

- [ ] Paso 6: limpiar y confirmar

```bash
git status --short
```

Esperado: solo quedan sin seguimiento los ficheros de `docs/` que ya estaban así al empezar (`apps/web/out` y `.next` están en `.gitignore`). Si algo de este plan quedó sin confirmar, añade esos ficheros por su ruta (nunca `git add -A`: arrastraría los de `docs/`) y confirma con `git commit -m "chore: cierre del plan 3"`.

Con esto, el Plan 3 queda cerrado: las 22 lecciones del temario existen, pasan todos los controles automáticos y las prioritarias esperan o tienen ya su revisión humana; la web ofrece el mapa del temario, la biblioteca de consejos y el SEO de cada página. Queda para el Plan 4: puntos arrastrables y práctica con corrección, PWA, texto alternativo de los dibujos, auditorías de accesibilidad y rendimiento, y el lanzamiento (hosting, dominio y la regla de publicación de `pnpm temario --publicable`).
