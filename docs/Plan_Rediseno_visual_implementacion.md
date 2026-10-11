# Rediseño visual de Traze: cuaderno de taller (implementación)

> **Para el agente que ejecuta este plan:** este plan lo ejecuta UN SOLO agente, de forma lineal, tarea por tarea y paso por paso, en el orden en que está escrito, SIN delegar en subagentes. No uses `superpowers:subagent-driven-development`. Si necesitas una guía de ejecución, usa `superpowers:executing-plans` en esta misma sesión. Los pasos usan casillas (`- [ ]`) para el seguimiento: marca cada una al terminarla. Todo el código de este plan está completo: cópialo tal cual. Si un comando no da el resultado esperado, DETENTE y cuéntalo; no improvises arreglos.

**Objetivo:** que portada, lección, reproductor y lienzo compartan un único sistema visual («cuaderno de taller»: hoja crema sobre mesa cálida, regla graduada, escuadra, cajetín, índice de pasos en círculos y banda de instrumentos), sin tocar la geometría, el motor, el esquema ni el contenido de las lecciones.

**Arquitectura:** los estilos salen de variables CSS en `:root` (`tokens.css`) y se reparten en archivos CSS pequeños de una sola responsabilidad dentro de `apps/web/src/estilos/`, importados desde `layout.tsx`. La lógica nueva (contraste, navegación, estado de los pasos, agrupación por bloques y banda de instrumentos) son funciones puras con test en `apps/web/src/`. Los componentes de React solo cambian de marcado y de clases. El archivo `globals.css` actual se retira al final, cuando todo lo suyo ya vive en los archivos nuevos.

**Stack:** el existente: Next 15 (export estático), React 19, TypeScript estricto, Vitest 2, pnpm 9. Única novedad: `next/font/google` (la fuente se descarga en el build y se aloja en la salida; sin peticiones externas en tiempo de ejecución). No se añade ninguna dependencia.

**Spec:** `docs/superpowers/specs/2026-10-11-rediseno-visual-design.md` (fuente de verdad; léelo antes de empezar).

## Global Constraints

Valores copiados del spec. Los requisitos de cada tarea los incluyen implícitamente.

- Todo sale de variables CSS en `:root`. Los componentes y los archivos CSS distintos de `tokens.css` no usan valores literales de color.
- Colores: `--papel #f7f0de`, `--papel-claro #fbf6e8`, `--mesa #e9dfc8`, `--papel-sombra #e1d6b8`, `--tinta #2b2b2b`, `--tinta-suave #5c5648`, `--azul-correccion #2f5d8c`, `--rojo-profe #b3261e` (solo avisos), `--margen #d9a5a0`, `--regla rgba(120, 95, 55, 0.55)`, `--exito-suave #dfe8d4` sobre `#3b5a2a`. Los `--grafito-*` no cambian.
- Radios: 6 px (cajetín, nota), 10 px (lienzo, banda), 12 px (hoja), 999 px (botones, pasos). Sombras en capas: `--sombra-hoja` (`0 1px 2px` y `0 12px 28px`, marrón al 12–14 %) y `--sombra-boton` (`0 1px 0`).
- Tipografía: serif para títulos, rotulación de la hoja y notas (Source Serif 4 con `next/font`, alternativa Georgia); sans del sistema para interfaz y etiquetas; la rotulación técnica solo dentro del dibujo. Etiquetas pequeñas en mayúsculas con 0,08 em de espaciado.
- Espacio: escala de 4 px (4, 8, 12, 16, 24, 32). Columna de lectura de 72 rem como máximo.
- Movimiento: 150 ms (controles) y 250 ms (paneles) con `cubic-bezier(0.2, 0, 0, 1)`; entrada de página: fundido de 200 ms; con `prefers-reduced-motion: reduce` todo pasa a 0 ms.
- Accesibilidad: botones y pasos de al menos 44 px; contraste AA (4,5:1) en los pares de texto principales; el estado del paso no depende solo del color (`aria-current` en el actual, indicador además del tono en los hechos); foco visible con contorno azul de 3 px; decoraciones (regla, escuadra, cuadrícula) `aria-hidden` o fondos CSS.
- Banda de instrumentos DERIVADA del dibujo del paso, sin ampliar el esquema: los campos que no se pueden deducir se omiten; si no hay ninguno, no hay banda.
- No se toca: el contenido de las lecciones (`contenido/`), el motor y el esquema (`packages/`), el filtro SVG de lápiz (`#grafito`), `docs/Plan_3_*`.
- Sin ninguna petición externa en tiempo de ejecución.
- Tras cada tarea: `pnpm test`, `pnpm typecheck` y `pnpm --filter @traze/web build` en verde.
- Commits en español, estilo `feat(web): ...`, con `git add` solo de los ficheros de la tarea, terminando con la línea `Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>`.

## Review Focus

Entradas o condiciones que el spec implica pero que ninguna tarea probaría por sí sola; cada línea tiene su test o comprobación en la tarea indicada.

1. Un paso del que no se puede deducir nada (solo marcas de ángulo recto o igualdad, o dibujo vacío) no muestra banda y no falla; una lección sin `radios` no muestra «Abertura» ni deslizador (Tarea 5, tests de `instrumentos`).
2. Una ruta con prefijo parecido (`/leccionfalsa`) o con barra final (`/leccion/x/`) no debe marcar mal la pestaña activa (Tarea 4, tests de `navegacion`).
3. Con `prefers-reduced-motion: reduce` las duraciones deben valer 0 ms (Tarea 1, test sobre `tokens.css`).
4. Ningún color literal fuera de `tokens.css` (rompería «los componentes no usan valores literales») (Tarea 1, test sobre `src/estilos/`).
5. Portada con lecciones de bloques desordenados o sin ninguna lección, y títulos largos en 375 px sin desbordar la página (Tarea 7, test de `agruparPorBloque`; Tarea 15, comprobación en el navegador).

---

## Mapa de archivos

| Archivo | Responsabilidad | Tarea |
| --- | --- | --- |
| `apps/web/src/estilos/tokens.css` | Variables CSS del sistema | 1 |
| `apps/web/src/accesibilidad/contraste.ts` | Contraste WCAG entre dos colores | 1 |
| `apps/web/test/contraste.test.ts`, `apps/web/test/tokens.test.ts` | Contraste AA de los pares de texto; tokens, movimiento reducido y ausencia de literales | 1 |
| `apps/web/src/estilos/base.css` | Mesa, tipografía, foco, etiquetas, movimiento | 2 |
| `apps/web/src/app/layout.tsx` | Fuente, hoja, cabecera, importación de estilos | 2, 3, 4 |
| `apps/web/src/estilos/hoja.css` | Hoja, margen, regla graduada, columna | 3 |
| `apps/web/src/navegacion.ts`, `apps/web/test/navegacion.test.ts` | Enlaces de la cabecera y pestaña activa | 4 |
| `apps/web/src/componentes/Cabecera.tsx`, `apps/web/src/estilos/cabecera.css` | Cabecera | 4 |
| `apps/web/src/reproductor/formato.ts` | Número con coma decimal | 5 |
| `apps/web/src/reproductor/instrumentos.ts`, `apps/web/test/instrumentos.test.ts` | Banda de instrumentos derivada | 5 |
| `apps/web/src/reproductor/indice.ts`, `apps/web/test/indice.test.ts` | Estado de cada paso del índice | 6 |
| `apps/web/src/portada.ts`, `apps/web/test/portada.test.ts` | Fichas agrupadas por bloque | 7 |
| `apps/web/src/estilos/lienzo.css` | Marco del lienzo, escuadra, clases del trazo | 8 |
| `apps/web/src/componentes/BandaInstrumentos.tsx` | Marcado de la banda | 9 |
| `apps/web/src/componentes/Reproductor.tsx` | Nuevo marcado del reproductor | 9 |
| `apps/web/src/estilos/panel.css` | Panel del paso, nota, índice de pasos, banda | 10 |
| `apps/web/src/estilos/controles.css`, `apps/web/src/estilos/deslizador.css` | Botones de píldora; deslizador del compás | 11 |
| `apps/web/src/app/leccion/[id]/page.tsx`, `apps/web/src/estilos/leccion.css` | Cabecera de lección y cajetín | 12 |
| `apps/web/src/app/page.tsx`, `apps/web/src/estilos/portada.css` | Portada con fichas | 13 |
| `apps/web/src/app/globals.css` | Se retira | 14 |

---

## Tarea 0: precondición y línea base

**Files:**
- Commit: `apps/web/src/app/globals.css`, `apps/web/tsconfig.json` (cambios ajenos a este plan, sin modificarlos)
- Commit: `apps/web/src/app/page.tsx`, `apps/web/src/app/leccion/`, `apps/web/src/componentes/Reproductor.tsx`, `apps/web/src/contenido.ts` (hoy sin versionar; hacen falta para que los diffs de las tareas siguientes tengan sentido)

**Interfaces:**
- Consumes: nada.
- Produces: una línea base commiteada sobre la que trabajan todas las tareas.

- [ ] **Paso 1: leer los cambios sin commitear**

Run: `git -C E:/Trazy status --short` y `git -C E:/Trazy diff -- apps/web/src/app/globals.css apps/web/tsconfig.json`
Expected: `globals.css` solo con líneas añadidas (clases del lienzo, portada, lección y controles) y `tsconfig.json` con `allowJs`, `incremental` y `exclude`. Si el diff contiene otra cosa (por ejemplo, líneas borradas en `globals.css` o claves nuevas distintas en `tsconfig.json`), DETENTE y cuéntalo.

- [ ] **Paso 2: comprobar que todo pasa con esos cambios**

Run: `pnpm test` (desde `E:/Trazy`)
Expected: todos los paquetes en verde; en `@traze/web` aparece `40 passed`.

Run: `pnpm typecheck`
Expected: sin errores.

Run: `pnpm --filter @traze/web build`
Expected: termina sin errores y lista las rutas `/` y `/leccion/[id]`.

Si alguno falla, DETENTE y cuenta cuál y con qué mensaje. No sigas.

- [ ] **Paso 3: commitear los dos ficheros ajenos tal cual**

```bash
git add apps/web/src/app/globals.css apps/web/tsconfig.json
git commit -m "chore(web): linea base antes del rediseno" -m "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"
```

- [ ] **Paso 4: commitear las fuentes de la web que aún no estaban versionadas**

Run: `git -C E:/Trazy status --short apps/web`
Expected: aparecen como `??` `apps/web/src/app/page.tsx`, `apps/web/src/app/leccion/`, `apps/web/src/componentes/Reproductor.tsx` y `apps/web/src/contenido.ts`. Si alguno ya está versionado, omítelo del `git add`.

```bash
git add apps/web/src/app/page.tsx "apps/web/src/app/leccion" apps/web/src/componentes/Reproductor.tsx apps/web/src/contenido.ts
git commit -m "chore(web): versiona portada, leccion y reproductor antes del rediseno" -m "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"
```

No añadas `contenido/`, `docs/` ni nada más.

- [ ] **Paso 5: comprobar que el árbol de `apps/web` está limpio**

Run: `git -C E:/Trazy status --short apps/web`
Expected: sin salida.

---

## Tarea 1: tokens y medida de contraste

**Files:**
- Create: `apps/web/src/estilos/tokens.css`
- Create: `apps/web/src/accesibilidad/contraste.ts`
- Test: `apps/web/test/contraste.test.ts`, `apps/web/test/tokens.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `luminancia(hex: string): number`, `contraste(a: string, b: string): number`, `MINIMO_AA = 4.5` (de `contraste.ts`); las variables CSS que usan todas las tareas siguientes: `--papel`, `--papel-claro`, `--mesa`, `--papel-sombra`, `--tinta`, `--tinta-suave`, `--azul-correccion`, `--rojo-profe`, `--margen`, `--regla`, `--exito-suave`, `--exito-texto`, `--nota-fondo`, `--velo`, `--rejilla-mesa`, `--escuadra`, `--cuadricula`, `--grafito-*`, `--rotulacion`, `--interfaz`, `--serif`, `--radio-chico`, `--radio-medio`, `--radio-hoja`, `--radio-pildora`, `--sombra-hoja`, `--sombra-suave`, `--sombra-boton`, `--e1`…`--e6`, `--t-control`, `--t-panel`, `--t-entrada`, `--curva`.

- [ ] **Paso 1: escribir los tests que fallan**

`apps/web/test/contraste.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MINIMO_AA, contraste, luminancia } from '../src/accesibilidad/contraste';

const css = readFileSync(
  fileURLToPath(new URL('../src/estilos/tokens.css', import.meta.url)),
  'utf-8',
);

function token(nombre: string): string {
  const coincidencia = new RegExp(`--${nombre}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(css);
  if (!coincidencia) throw new Error(`Falta el token de color --${nombre} (seis cifras hex)`);
  return coincidencia[1];
}

describe('contraste', () => {
  it('negro sobre blanco vale 21', () => {
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });

  it('el mismo color consigo mismo vale 1', () => {
    expect(contraste('#f7f0de', '#f7f0de')).toBeCloseTo(1, 5);
  });

  it('no depende del orden de los colores', () => {
    expect(contraste('#2b2b2b', '#f7f0de')).toBeCloseTo(contraste('#f7f0de', '#2b2b2b'), 10);
  });

  it('rechaza un color que no sea #rrggbb', () => {
    expect(() => luminancia('rojo')).toThrow('Color no válido');
    expect(() => luminancia('#fff')).toThrow('Color no válido');
  });
});

const PARES: readonly [texto: string, fondo: string][] = [
  ['tinta', 'papel'],
  ['tinta', 'papel-claro'],
  ['tinta', 'papel-sombra'],
  ['tinta', 'mesa'],
  ['tinta', 'nota-fondo'],
  ['tinta-suave', 'papel'],
  ['tinta-suave', 'papel-claro'],
  ['tinta-suave', 'mesa'],
  ['azul-correccion', 'papel'],
  ['azul-correccion', 'papel-claro'],
  ['azul-correccion', 'nota-fondo'],
  ['azul-correccion', 'mesa'],
  ['rojo-profe', 'papel'],
  ['papel', 'tinta'],
  ['papel', 'azul-correccion'],
  ['papel', 'tinta-suave'],
  ['exito-texto', 'exito-suave'],
];

describe('contraste AA de los pares de texto principales', () => {
  it.each(PARES)('%s sobre %s llega a 4,5:1', (texto, fondo) => {
    expect(contraste(token(texto), token(fondo))).toBeGreaterThanOrEqual(MINIMO_AA);
  });
});
```

`apps/web/test/tokens.test.ts`:

```ts
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const carpeta = fileURLToPath(new URL('../src/estilos/', import.meta.url));
const tokens = readFileSync(`${carpeta}tokens.css`, 'utf-8');

const NECESARIOS = [
  'papel',
  'papel-claro',
  'mesa',
  'papel-sombra',
  'tinta',
  'tinta-suave',
  'azul-correccion',
  'rojo-profe',
  'margen',
  'regla',
  'exito-suave',
  'exito-texto',
  'nota-fondo',
  'velo',
  'rejilla-mesa',
  'escuadra',
  'cuadricula',
  'grafito-dato',
  'grafito-construccion',
  'grafito-resultado',
  'rotulacion',
  'interfaz',
  'serif',
  'radio-chico',
  'radio-medio',
  'radio-hoja',
  'radio-pildora',
  'sombra-hoja',
  'sombra-suave',
  'sombra-boton',
  'e1',
  'e2',
  'e3',
  'e4',
  'e5',
  'e6',
  't-control',
  't-panel',
  't-entrada',
  'curva',
];

describe('tokens.css', () => {
  it.each(NECESARIOS)('define --%s', (nombre) => {
    expect(tokens).toContain(`--${nombre}:`);
  });

  it('con prefers-reduced-motion: reduce todas las duraciones pasan a 0 ms', () => {
    const bloque = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/.exec(tokens);
    expect(bloque).not.toBeNull();
    for (const nombre of ['t-control', 't-panel', 't-entrada']) {
      expect(bloque![1]).toMatch(new RegExp(`--${nombre}:\\s*0ms;`));
    }
  });
});

describe('el resto de archivos CSS', () => {
  const otros = readdirSync(carpeta).filter(
    (nombre) => nombre.endsWith('.css') && nombre !== 'tokens.css',
  );

  it.each(otros.length > 0 ? otros : ['(aún no hay otros archivos)'])(
    '%s no usa colores literales',
    (nombre) => {
      if (otros.length === 0) return;
      const sinComentarios = readFileSync(`${carpeta}${nombre}`, 'utf-8').replace(
        /\/\*[\s\S]*?\*\//g,
        '',
      );
      expect(sinComentarios).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
    },
  );
});
```

- [ ] **Paso 2: ejecutarlos y ver que fallan**

Run: `pnpm --filter @traze/web test`
Expected: FAIL en `contraste.test.ts` y `tokens.test.ts` (no se puede resolver `../src/accesibilidad/contraste` y no existe `tokens.css`).

- [ ] **Paso 3: crear `apps/web/src/accesibilidad/contraste.ts`**

```ts
export const MINIMO_AA = 4.5;

function canal(hex: string, desde: number): number {
  const valor = parseInt(hex.slice(desde, desde + 2), 16) / 255;
  return valor <= 0.03928 ? valor / 12.92 : ((valor + 0.055) / 1.055) ** 2.4;
}

export function luminancia(hex: string): number {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new Error(`Color no válido: ${hex}`);
  return 0.2126 * canal(hex, 1) + 0.7152 * canal(hex, 3) + 0.0722 * canal(hex, 5);
}

export function contraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
```

- [ ] **Paso 4: crear `apps/web/src/estilos/tokens.css`**

```css
:root {
  /* Color: superficie */
  --papel: #f7f0de;
  --papel-claro: #fbf6e8;
  --mesa: #e9dfc8;
  --papel-sombra: #e1d6b8;
  --margen: #d9a5a0;
  --regla: rgba(120, 95, 55, 0.55);
  --velo: rgba(255, 255, 255, 0.35);
  --rejilla-mesa: rgba(120, 95, 55, 0.07);
  --escuadra: rgba(47, 93, 140, 0.12);
  --cuadricula: #b9ad8c;

  /* Color: texto y acento */
  --tinta: #2b2b2b;
  --tinta-suave: #5c5648;
  --azul-correccion: #2f5d8c;
  --rojo-profe: #b3261e;
  --nota-fondo: #ecebdc;
  --exito-suave: #dfe8d4;
  --exito-texto: #3b5a2a;

  /* Color: trazo del dibujo (no cambian) */
  --grafito-dato: #4a4a4a;
  --grafito-construccion: #5f82aa;
  --grafito-resultado: #111111;

  /* Tipografía */
  --rotulacion: 'ISOCPEUR', 'Osifont', 'Arial Narrow', Arial, sans-serif;
  --interfaz: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --serif: var(--fuente-serif), Georgia, 'Times New Roman', serif;

  /* Forma y profundidad */
  --radio-chico: 6px;
  --radio-medio: 10px;
  --radio-hoja: 12px;
  --radio-pildora: 999px;
  --sombra-hoja: 0 1px 2px rgba(80, 60, 25, 0.14), 0 12px 28px rgba(80, 60, 25, 0.12);
  --sombra-suave: 0 1px 2px rgba(80, 60, 25, 0.1), 0 4px 12px rgba(80, 60, 25, 0.08);
  --sombra-boton: 0 1px 0 rgba(80, 60, 25, 0.25);

  /* Espacio (escala de 4 px) */
  --e1: 4px;
  --e2: 8px;
  --e3: 12px;
  --e4: 16px;
  --e5: 24px;
  --e6: 32px;

  /* Movimiento */
  --t-control: 150ms;
  --t-panel: 250ms;
  --t-entrada: 200ms;
  --curva: cubic-bezier(0.2, 0, 0, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --t-control: 0ms;
    --t-panel: 0ms;
    --t-entrada: 0ms;
  }
}
```

- [ ] **Paso 5: ejecutar los tests y ver que pasan**

Run: `pnpm --filter @traze/web test`
Expected: PASS, sin ningún test fallido; `contraste.test.ts` y `tokens.test.ts` aparecen en la lista. Si un par de contraste falla, DETENTE y cuéntalo con el par concreto.

- [ ] **Paso 6: tipos y commit**

Run: `pnpm typecheck`
Expected: sin errores.

```bash
git add apps/web/src/estilos/tokens.css apps/web/src/accesibilidad/contraste.ts apps/web/test/contraste.test.ts apps/web/test/tokens.test.ts
git commit -m "feat(web): tokens del rediseno y medida de contraste AA" -m "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"
```

---

## Tarea 2: fuentes, mesa y base tipográfica

**Files:**
- Create: `apps/web/src/estilos/base.css`
- Modify (reescribir entero): `apps/web/src/app/layout.tsx`

**Interfaces:**
- Consumes: tokens de la Tarea 1; la variable `--fuente-serif` que crea `next/font`.
- Produces: la clase `.etiqueta` (etiqueta pequeña en mayúsculas), la animación `entrada`, y el orden de importación de estilos en `layout.tsx` (las tareas siguientes añaden su línea tras la del archivo anterior).

- [ ] **Paso 1: crear `apps/web/src/estilos/base.css`**

```css
* {
  box-sizing: border-box;
}

html {
  background: var(--mesa);
}

/* Mesa: fondo cálido con una cuadrícula de 22 px casi invisible */
body {
  margin: 0;
  color: var(--tinta);
  font-family: var(--interfaz);
  line-height: 1.55;
  background-color: var(--mesa);
  background-image:
    linear-gradient(var(--rejilla-mesa) 1px, transparent 1px),
    linear-gradient(90deg, var(--rejilla-mesa) 1px, transparent 1px);
  background-size: 22px 22px;
}

:focus-visible {
  outline: 3px solid var(--azul-correccion);
  outline-offset: 2px;
}

a {
  color: var(--azul-correccion);
}

h1,
h2,
h3 {
  font-family: var(--serif);
  font-weight: 600;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

h1 {
  margin: 0 0 var(--e2);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
}

h2 {
  font-size: 1.35rem;
}

.etiqueta {
  margin: 0;
  font-family: var(--interfaz);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tinta-suave);
}

@keyframes entrada {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0ms !important;
    animation-delay: 0ms !important;
    transition-duration: 0ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Paso 2: reescribir `apps/web/src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { Source_Serif_4 } from 'next/font/google';
import Link from 'next/link';
import type { ReactNode } from 'react';
import './globals.css';
import '../estilos/tokens.css';
import '../estilos/base.css';

const serif = Source_Serif_4({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--fuente-serif',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

export const metadata: Metadata = {
  title: { default: 'Traze: Dibujo Técnico paso a paso', template: '%s · Traze' },
  description:
    'Aprende los trazados de Dibujo Técnico de 1º de Bachillerato viendo cómo se construyen, paso a paso.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-ES" className={serif.variable}>
      <body>
        <header className="cabecera">
          <Link className="logo" href="/">
            Traze
          </Link>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Paso 3: comprobar tests, tipos y build**

Run: `pnpm test`
Expected: todo en verde (el test de `tokens.test.ts` ahora revisa también `base.css`: sin literales de color).

Run: `pnpm typecheck`
Expected: sin errores.

Run: `pnpm --filter @traze/web build`
Expected: termina sin errores. Esta es la primera vez que se descarga la fuente: necesita red durante el build. Si falla por no poder descargarla (mensaje sobre `fonts.googleapis.com` o `Source Serif 4`), DETENTE y cuéntalo; no cambies de fuente por tu cuenta.

- [ ] **Paso 4: comprobar que no hay peticiones externas en la salida**

Run: `grep -rl "fonts.gstatic.com" apps/web/out || echo "sin peticiones externas"`
Expected: `sin peticiones externas`.

- [ ] **Paso 5: commit**

```bash
git add apps/web/src/estilos/base.css apps/web/src/app/layout.tsx
git commit -m "feat(web): fuente serif con next/font, mesa y base tipografica" -m "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"
```

---

## Tarea 3: hoja sobre la mesa, con margen y regla graduada

**Files:**
- Create: `apps/web/src/estilos/hoja.css`
- Modify (reescribir entero): `apps/web/src/app/layout.tsx`

**Interfaces:**
- Consumes: tokens, `entrada` (Tarea 2).
- Produces: la clase `.hoja` que envuelve el contenido de todas las páginas (portada, lección y las futuras del Plan 3), puesta en el layout para no repetirla en cada página; el estilo de `main`.

- [ ] **Paso 1: crear `apps/web/src/estilos/hoja.css`**

```css
main {
  max-width: 72rem;
  margin: 0 auto;
  padding: var(--e4) clamp(var(--e4), 4vw, 2.5rem) calc(var(--e6) * 2);
}

/* Hoja: papel con sombra en capas, línea de margen y regla graduada superior (solo CSS) */
.hoja {
  position: relative;
  overflow: hidden;
  padding: calc(var(--e6) + var(--e5)) clamp(var(--e4), 4vw, 2.5rem) var(--e6)
    clamp(2.25rem, 6vw, 4rem);
  border-radius: var(--radio-hoja);
  background: var(--papel);
  box-shadow: var(--sombra-hoja);
  animation: entrada var(--t-entrada) var(--curva) both;
}

.hoja > * {
  position: relative;
  z-index: 1;
}

.hoja::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: clamp(1.5rem, 4.5vw, 3rem);
  width: 1px;
  background: var(--margen);
  pointer-events: none;
}

.hoja::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 14px;
  border-bottom: 1px solid var(--papel-sombra);
  background-image:
    repeating-linear-gradient(90deg, var(--regla) 0 1px, transparent 1px 8px),
    repeating-linear-gradient(90deg, var(--regla) 0 1px, transparent 1px 40px);
  background-size:
    100% 6px,
    100% 12px;
  background-repeat: no-repeat;
  pointer-events: none;
}
```

- [ ] **Paso 2: reescribir `apps/web/src/app/layout.tsx`** (envuelve `children` en la hoja y añade la importación del CSS nuevo)

```tsx
import type { Metadata } from 'next';
import { Source_Serif_4 } from 'next/font/google';
import Link from 'next/link';
import type { ReactNode } from 'react';
import './globals.css';
import '../estilos/tokens.css';
import '../estilos/base.css';
import '../estilos/hoja.css';

const serif = Source_Serif_4({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--fuente-serif',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

export const metadata: Metadata = {
  title: { default: 'Traze: Dibujo Técnico paso a paso', template: '%s · Traze' },
  description:
    'Aprende los trazados de Dibujo Técnico de 1º de Bachillerato viendo cómo se construyen, paso a paso.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-ES" className={serif.variable}>
      <body>
        <header className="cabecera">
          <Link className="logo" href="/">
            Traze
          </Link>
        </header>
        <main>
          <div className="hoja">{children}</div>
        </main>
      </body>
    </html>
  );
}
```

- [ ] **Paso 3: comprobar**

Run: `pnpm test` → todo en verde (el test de literales ya revisa `hoja.css`).
Run: `pnpm typecheck` → sin errores.
Run: `pnpm --filter @traze/web build` → sin errores.

- [ ] **Paso 4: commit**

```bash
git add apps/web/src/estilos/hoja.css apps/web/src/app/layout.tsx
git commit -m "feat(web): hoja sobre la mesa con margen y regla graduada" -m "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"
```

---

## Tarea 4: cabecera con navegación

**Files:**
- Create: `apps/web/src/navegacion.ts`
- Create: `apps/web/src/componentes/Cabecera.tsx`
- Create: `apps/web/src/estilos/cabecera.css`
- Modify (reescribir entero): `apps/web/src/app/layout.tsx`
- Test: `apps/web/test/navegacion.test.ts`

**Interfaces:**
- Consumes: tokens; `.hoja` (Tarea 3).
- Produces: `interface Enlace { texto: string; href: string; disponible: boolean; coincide: (ruta: string) => boolean }`, `ENLACES: readonly Enlace[]`, `enlacesVisibles(enlaces?: readonly Enlace[]): Enlace[]`, `esActivo(enlace: Enlace, ruta: string): boolean`; el componente `Cabecera`. Para activar un enlace del Plan 3 basta cambiar su `disponible` a `true`.

- [ ] **Paso 1: escribir el test que falla**

`apps/web/test/navegacion.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ENLACES, enlacesVisibles, esActivo } from '../src/navegacion';

const lecciones = ENLACES.find((enlace) => enlace.texto === 'Lecciones')!;

describe('enlacesVisibles', () => {
  it('hoy solo muestra Lecciones (las páginas del Plan 3 aún no existen)', () => {
    expect(enlacesVisibles().map((enlace) => enlace.texto)).toEqual(['Lecciones']);
  });

  it('los enlaces están en el orden del spec', () => {
    expect(ENLACES.map((enlace) => enlace.texto)).toEqual([
      'Temario',
      'Lecciones',
      'Consejos',
      'Mi carpeta',
    ]);
  });

  it('muestra un enlace en cuanto está disponible', () => {
    const todos = ENLACES.map((enlace) => ({ ...enlace, disponible: true }));
    expect(enlacesVisibles(todos)).toHaveLength(4);
  });
});

describe('esActivo', () => {
  it('Lecciones está activa en la portada y en cualquier lección', () => {
    expect(esActivo(lecciones, '/')).toBe(true);
    expect(esActivo(lecciones, '/leccion/mediatriz-segmento')).toBe(true);
  });

  it('tolera la barra final', () => {
    expect(esActivo(lecciones, '/leccion/mediatriz-segmento/')).toBe(true);
  });

  it('no se activa con un prefijo parecido ni en otras secciones', () => {
    expect(esActivo(lecciones, '/leccionfalsa')).toBe(false);
    expect(esActivo(lecciones, '/consejos')).toBe(false);
    expect(esActivo(lecciones, '/temario')).toBe(false);
  });
});
```

- [ ] **Paso 2: ejecutarlo y ver que falla**

Run: `pnpm --filter @traze/web test`
Expected: FAIL en `navegacion.test.ts` (no se puede resolver `../src/navegacion`).

- [ ] **Paso 3: crear `apps/web/src/navegacion.ts`**

```ts
export interface Enlace {
  texto: string;
  href: string;
  disponible: boolean;
  coincide: (ruta: string) => boolean;
}

const seccion = (base: string) => (ruta: string) => ruta === base || ruta.startsWith(`${base}/`);

export const ENLACES: readonly Enlace[] = [
  { texto: 'Temario', href: '/temario', disponible: false, coincide: seccion('/temario') },
  {
    texto: 'Lecciones',
    href: '/',
    disponible: true,
    coincide: (ruta) => ruta === '/' || seccion('/leccion')(ruta),
  },
  { texto: 'Consejos', href: '/consejos', disponible: false, coincide: seccion('/consejos') },
  { texto: 'Mi carpeta', href: '/carpeta', disponible: false, coincide: seccion('/carpeta') },
];

export function enlacesVisibles(enlaces: readonly Enlace[] = ENLACES): Enlace[] {
  return enlaces.filter((enlace) => enlace.disponible);
}

export function esActivo(enlace: Enlace, ruta: string): boolean {
  const normalizada = ruta.replace(/\/+$/, '') || '/';
  return enlace.coincide(normalizada);
}
```

- [ ] **Paso 4: crear `apps/web/src/componentes/Cabecera.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { enlacesVisibles, esActivo } from '../navegacion';

export function Cabecera() {
  const ruta = usePathname() ?? '/';

  return (
    <header className="cabecera">
      <Link className="logo" href="/">
        Traze
      </Link>
      <nav className="navegacion" aria-label="Principal">
        <ul>
          {enlacesVisibles().map((enlace) => (
            <li key={enlace.href}>
              <Link href={enlace.href} aria-current={esActivo(enlace, ruta) ? 'page' : undefined}>
                {enlace.texto}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
```

- [ ] **Paso 5: crear `apps/web/src/estilos/cabecera.css`**

```css
.cabecera {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--e4);
  max-width: 72rem;
  margin: 0 auto;
  padding: var(--e3) clamp(var(--e4), 4vw, 2.5rem);
}

.logo {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-family: var(--serif);
  font-size: 1.75rem;
  font-style: italic;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--tinta);
  text-decoration: none;
}

.navegacion ul {
  display: flex;
  gap: var(--e2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.navegacion a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--e3);
  border-bottom: 3px solid transparent;
  color: var(--tinta-suave);
  text-decoration: none;
  transition:
    color var(--t-control) var(--curva),
    border-color var(--t-control) var(--curva);
}

.navegacion a:hover {
  color: var(--tinta);
}

.navegacion a[aria-current='page'] {
  border-bottom-color: var(--azul-correccion);
  color: var(--tinta);
  font-weight: 600;
}
```

- [ ] **Paso 6: reescribir `apps/web/src/app/layout.tsx`** (usa `Cabecera`; ya no importa `Link`)

```tsx
import type { Metadata } from 'next';
import { Source_Serif_4 } from 'next/font/google';
import type { ReactNode } from 'react';
import { Cabecera } from '../componentes/Cabecera';
import './globals.css';
import '../estilos/tokens.css';
import '../estilos/base.css';
import '../estilos/hoja.css';
import '../estilos/cabecera.css';

const serif = Source_Serif_4({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--fuente-serif',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

export const metadata: Metadata = {
  title: { default: 'Traze: Dibujo Técnico paso a paso', template: '%s · Traze' },
  description:
    'Aprende los trazados de Dibujo Técnico de 1º de Bachillerato viendo cómo se construyen, paso a paso.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-ES" className={serif.variable}>
      <body>
        <Cabecera />
        <main>
          <div className="hoja">{children}</div>
        </main>
      </body>
    </html>
  );
}
```

- [ ] **Paso 7: comprobar**

Run: `pnpm test` → todo en verde, incluido `navegacion.test.ts`.
Run: `pnpm typecheck` → sin errores.
Run: `pnpm --filter @traze/web build` → sin errores.

- [ ] **Paso 8: commit**

```bash
git add apps/web/src/navegacion.ts apps/web/src/componentes/Cabecera.tsx apps/web/src/estilos/cabecera.css apps/web/src/app/layout.tsx apps/web/test/navegacion.test.ts
git commit -m "feat(web): cabecera con navegacion y pestana activa" -m "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"
```

---

## Tarea 5: banda de instrumentos derivada del dibujo

Nombres reales de las primitivas del dibujo, confirmados en `packages/lecciones/src/interpretar.ts` (tipo `PrimitivaResuelta`): `punto`, `segmento`, `recta`, `arco`, `marcaAnguloRecto`, `marcaIgualdad`. No existe una primitiva «circunferencia»: los arcos son lo único que se dibuja con compás. Estilos (`Estilo`): `dato`, `construccion`, `resultado`; solo `punto`, `segmento`, `recta` y `arco` tienen `estilo`. El arco trae el radio ya resuelto en `radio` (número), y `LeccionResuelta.radios` es `Record<string, number>` con el mismo número, por lo que se enlaza el arco con su radio declarado comparando ambos valores.

Reglas fijadas (sin decisiones abiertas):
- **Instrumento:** hay algún `arco` → `Compás`; si no, hay algún `segmento` o `recta` → `Regla`; si no (solo puntos o marcas), ninguno.
- **Lápiz:** se miran los estilos de las primitivas que lo tienen; si no hay ninguno, ninguno; si todos son `construccion` → `2H`; en cualquier otro caso (hay `resultado` o `dato`) → `HB`.
- **Abertura:** por cada radio declarado en `leccion.radios` cuyo valor resuelto coincide (diferencia menor que 1e-6) con el `radio` de algún arco del paso: `«factor» × «A»«B»`, con coma decimal y dos cifras (por ejemplo `0,75 × AB`), usando el factor actual (el del deslizador) o, si no se pasa, el declarado. Varios radios se unen con `, `.

**Files:**
- Create: `apps/web/src/reproductor/formato.ts`
- Create: `apps/web/src/reproductor/instrumentos.ts`
- Test: `apps/web/test/instrumentos.test.ts`

**Interfaces:**
- Consumes: `PrimitivaResuelta` de `@traze/lecciones`.
- Produces: `decimal(numero: number, cifras: number): string`; `interface RadioDeclarado { entre: readonly [string, string]; factor: number }`; `interface Banda { instrumento?: string; lapiz?: string; abertura?: string }`; `instrumentoDelPaso(dibujo)`, `lapizDelPaso(dibujo)`, `aberturaDelPaso(dibujo, resueltos, radios, factores)` y `derivarBanda(dibujo, resueltos, radios, factores): Banda | null`.

- [ ] **Paso 1: escribir el test que falla**

`apps/web/test/instrumentos.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { PrimitivaResuelta } from '@traze/lecciones';
import {
  aberturaDelPaso,
  derivarBanda,
  instrumentoDelPaso,
  lapizDelPaso,
} from '../src/reproductor/instrumentos';

type Estilo = 'dato' | 'construccion' | 'resultado';

const punto = (estilo: Estilo): PrimitivaResuelta => ({
  tipo: 'punto',
  id: 'M',
  etiqueta: 'M',
  x: 0,
  y: 0,
  estilo,
});
const segmento = (estilo: Estilo): PrimitivaResuelta => ({
  tipo: 'segmento',
  x1: 0,
  y1: 0,
  x2: 10,
  y2: 0,
  estilo,
});
const recta = (estilo: Estilo): PrimitivaResuelta => ({
  tipo: 'recta',
  x1: 0,
  y1: 0,
  x2: 10,
  y2: 10,
  estilo,
});
const arco = (radio: number, estilo: Estilo = 'construccion'): PrimitivaResuelta => ({
  tipo: 'arco',
  cx: 0,
  cy: 0,
  radio,
  inicio: 0,
  fin: 1,
  estilo,
});
const marcaRecto: PrimitivaResuelta = {
  tipo: 'marcaAnguloRecto',
  x: 0,
  y: 0,
  ux1: 1,
  uy1: 0,
  ux2: 0,
  uy2: 1,
};
const marcaIgualdad: PrimitivaResuelta = {
  tipo: 'marcaIgualdad',
  x1: 0,
  y1: 0,
  x2: 10,
  y2: 0,
};

const RADIOS = { r: { entre: ['A', 'B'] as const, factor: 0.75 } };
const RESUELTOS = { r: 53.5 };
const FACTORES = { r: 0.75 };

describe('instrumentoDelPaso', () => {
  it('los arcos se hacen con compás', () => {
    expect(instrumentoDelPaso([arco(53.5), arco(53.5)])).toBe('Compás');
  });

  it('las rectas y los segmentos se hacen con regla', () => {
    expect(instrumentoDelPaso([segmento('dato'), punto('dato')])).toBe('Regla');
    expect(instrumentoDelPaso([recta('resultado')])).toBe('Regla');
  });

  it('si hay arcos y rectas, gana el compás', () => {
    expect(instrumentoDelPaso([recta('resultado'), arco(10)])).toBe('Compás');
  });

  it('con solo puntos, marcas o nada, no hay instrumento', () => {
    expect(instrumentoDelPaso([punto('construccion')])).toBeUndefined();
    expect(instrumentoDelPaso([marcaRecto, marcaIgualdad])).toBeUndefined();
    expect(instrumentoDelPaso([])).toBeUndefined();
  });
});

describe('lapizDelPaso', () => {
  it('todo construcción se dibuja con 2H', () => {
    expect(lapizDelPaso([arco(10), punto('construccion')])).toBe('2H');
  });

  it('resultado y dato se dibujan con HB', () => {
    expect(lapizDelPaso([recta('resultado')])).toBe('HB');
    expect(lapizDelPaso([segmento('dato'), punto('dato')])).toBe('HB');
  });

  it('si se mezcla construcción con otro trazo, HB', () => {
    expect(lapizDelPaso([arco(10), segmento('dato')])).toBe('HB');
  });

  it('las marcas no tienen estilo: sin otros trazos no se deduce nada', () => {
    expect(lapizDelPaso([marcaRecto])).toBeUndefined();
    expect(lapizDelPaso([])).toBeUndefined();
  });
});

describe('aberturaDelPaso', () => {
  it('muestra el factor y los puntos del radio que usa un arco', () => {
    expect(aberturaDelPaso([arco(53.5)], RESUELTOS, RADIOS, FACTORES)).toBe('0,75 × AB');
  });

  it('usa el factor actual del deslizador', () => {
    expect(aberturaDelPaso([arco(53.5)], RESUELTOS, RADIOS, { r: 0.5 })).toBe('0,50 × AB');
  });

  it('si no se pasa el factor actual, usa el declarado', () => {
    expect(aberturaDelPaso([arco(53.5)], RESUELTOS, RADIOS, {})).toBe('0,75 × AB');
  });

  it('un paso sin arcos, o con un arco de otro radio, no tiene abertura', () => {
    expect(aberturaDelPaso([recta('resultado')], RESUELTOS, RADIOS, FACTORES)).toBeUndefined();
    expect(aberturaDelPaso([arco(99)], RESUELTOS, RADIOS, FACTORES)).toBeUndefined();
  });

  it('una lección sin radios declarados nunca tiene abertura', () => {
    expect(aberturaDelPaso([arco(53.5)], {}, {}, {})).toBeUndefined();
  });

  it('solo cuenta los radios que el paso usa', () => {
    const radios = { ...RADIOS, s: { entre: ['C', 'D'] as const, factor: 0.4 } };
    const resueltos = { r: 53.5, s: 20 };
    expect(aberturaDelPaso([arco(20)], resueltos, radios, { r: 0.75, s: 0.4 })).toBe('0,40 × CD');
    expect(aberturaDelPaso([arco(53.5), arco(20)], resueltos, radios, { r: 0.75, s: 0.4 })).toBe(
      '0,75 × AB, 0,40 × CD',
    );
  });
});

describe('derivarBanda', () => {
  it('un paso de compás tiene los tres campos', () => {
    expect(derivarBanda([arco(53.5)], RESUELTOS, RADIOS, FACTORES)).toEqual({
      instrumento: 'Compás',
      lapiz: '2H',
      abertura: '0,75 × AB',
    });
  });

  it('omite los campos que no se pueden deducir', () => {
    expect(derivarBanda([punto('construccion')], RESUELTOS, RADIOS, FACTORES)).toEqual({
      lapiz: '2H',
    });
  });

  it('si no se deduce nada, no hay banda', () => {
    expect(derivarBanda([marcaRecto, marcaIgualdad], RESUELTOS, RADIOS, FACTORES)).toBeNull();
    expect(derivarBanda([], RESUELTOS, RADIOS, FACTORES)).toBeNull();
  });
});
```

- [ ] **Paso 2: ejecutarlo y ver que falla**

Run: `pnpm --filter @traze/web test`
Expected: FAIL en `instrumentos.test.ts` (no se puede resolver `../src/reproductor/instrumentos`).

- [ ] **Paso 3: crear `apps/web/src/reproductor/formato.ts`**

```ts
export const decimal = (numero: number, cifras: number): string =>
  numero.toFixed(cifras).replace('.', ',');
```

- [ ] **Paso 4: crear `apps/web/src/reproductor/instrumentos.ts`**

```ts
import type { PrimitivaResuelta } from '@traze/lecciones';
import { decimal } from './formato';

export interface RadioDeclarado {
  entre: readonly [string, string];
  factor: number;
}

export interface Banda {
  instrumento?: string;
  lapiz?: string;
  abertura?: string;
}

type Dibujo = readonly PrimitivaResuelta[];

const TOLERANCIA = 1e-6;

export function instrumentoDelPaso(dibujo: Dibujo): string | undefined {
  if (dibujo.some((primitiva) => primitiva.tipo === 'arco')) return 'Compás';
  if (dibujo.some((primitiva) => primitiva.tipo === 'segmento' || primitiva.tipo === 'recta')) {
    return 'Regla';
  }
  return undefined;
}

export function lapizDelPaso(dibujo: Dibujo): string | undefined {
  const estilos = dibujo.flatMap((primitiva) => ('estilo' in primitiva ? [primitiva.estilo] : []));
  if (estilos.length === 0) return undefined;
  return estilos.every((estilo) => estilo === 'construccion') ? '2H' : 'HB';
}

export function aberturaDelPaso(
  dibujo: Dibujo,
  resueltos: Readonly<Record<string, number>>,
  radios: Readonly<Record<string, RadioDeclarado>>,
  factores: Readonly<Record<string, number>>,
): string | undefined {
  const textos = Object.keys(radios)
    .filter(
      (id) =>
        Object.hasOwn(resueltos, id) &&
        dibujo.some(
          (primitiva) =>
            primitiva.tipo === 'arco' && Math.abs(primitiva.radio - resueltos[id]) < TOLERANCIA,
        ),
    )
    .map((id) => `${decimal(factores[id] ?? radios[id].factor, 2)} × ${radios[id].entre.join('')}`);
  return textos.length > 0 ? textos.join(', ') : undefined;
}

export function derivarBanda(
  dibujo: Dibujo,
  resueltos: Readonly<Record<string, number>>,
  radios: Readonly<Record<string, RadioDeclarado>>,
  factores: Readonly<Record<string, number>>,
): Banda | null {
  const banda: Banda = {};
  const instrumento = instrumentoDelPaso(dibujo);
  const lapiz = lapizDelPaso(dibujo);
  const abertura = aberturaDelPaso(dibujo, resueltos, radios, factores);
  if (instrumento) banda.instrumento = instrumento;
  if (lapiz) banda.lapiz = lapiz;
  if (abertura) banda.abertura = abertura;
  return Object.keys(banda).length > 0 ? banda : null;
}
```

- [ ] **Paso 5: ejecutar los tests y ver que pasan**

Run: `pnpm --filter @traze/web test`
Expected: PASS, sin ningún test fallido.

Run: `pnpm typecheck`
Expected: sin errores.

- [ ] **Paso 6: commit**

```bash
git add apps/web/src/reproductor/formato.ts apps/web/src/reproductor/instrumentos.ts apps/web/test/instrumentos.test.ts
git commit -m "feat(web): banda de instrumentos derivada del dibujo del paso" -m "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"
```

---

## Tarea 6: estado de cada paso del índice

**Files:**
- Create: `apps/web/src/reproductor/indice.ts`
- Test: `apps/web/test/indice.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `type SituacionPaso = 'hecho' | 'actual' | 'pendiente'`, `situacionPaso(indice: number, actual: number): SituacionPaso`, `etiquetaPaso(indice: number, titulo: string, situacion: SituacionPaso): string`.

- [ ] **Paso 1: escribir el test que falla**

`apps/web/test/indice.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { etiquetaPaso, situacionPaso } from '../src/reproductor/indice';

describe('situacionPaso', () => {
  it('los pasos anteriores al actual están hechos', () => {
    expect(situacionPaso(0, 2)).toBe('hecho');
    expect(situacionPaso(1, 2)).toBe('hecho');
  });

  it('el paso en curso es el actual', () => {
    expect(situacionPaso(2, 2)).toBe('actual');
    expect(situacionPaso(0, 0)).toBe('actual');
  });

  it('los siguientes están pendientes', () => {
    expect(situacionPaso(3, 2)).toBe('pendiente');
  });
});

describe('etiquetaPaso', () => {
  it('numera desde 1 e incluye el título', () => {
    expect(etiquetaPaso(0, 'Los datos', 'actual')).toBe('Ir al paso 1: Los datos');
  });

  it('avisa por texto de que el paso está hecho, sin depender del color', () => {
    expect(etiquetaPaso(1, 'Arcos con centro en A', 'hecho')).toBe(
      'Ir al paso 2: Arcos con centro en A (hecho)',
    );
  });

  it('un paso pendiente no añade nada', () => {
    expect(etiquetaPaso(4, 'Une M con N', 'pendiente')).toBe('Ir al paso 5: Une M con N');
  });
});
```

- [ ] **Paso 2: ejecutarlo y ver que falla**

Run: `pnpm --filter @traze/web test`
Expected: FAIL en `indice.test.ts` (no se puede resolver `../src/reproductor/indice`).

- [ ] **Paso 3: crear `apps/web/src/reproductor/indice.ts`**

```ts
export type SituacionPaso = 'hecho' | 'actual' | 'pendiente';

export function situacionPaso(indice: number, actual: number): SituacionPaso {
  if (indice < actual) return 'hecho';
  if (indice === actual) return 'actual';
  return 'pendiente';
}

export function etiquetaPaso(indice: number, titulo: string, situacion: SituacionPaso): string {
  const base = `Ir al paso ${indice + 1}: ${titulo}`;
  return situacion === 'hecho' ? `${base} (hecho)` : base;
}
```

- [ ] **Paso 4: comprobar**

Run: `pnpm --filter @traze/web test` → PASS.
Run: `pnpm typecheck` → sin errores.

- [ ] **Paso 5: commit**

```bash
git add apps/web/src/reproductor/indice.ts apps/web/test/indice.test.ts
git commit -m "feat(web): estado de cada paso del indice (hecho, actual, pendiente)" -m "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"
```

---

## Tarea 7: agrupar las fichas de la portada por bloque

**Files:**
- Create: `apps/web/src/portada.ts`
- Test: `apps/web/test/portada.test.ts`

**Interfaces:**
- Consumes: nada (es genérica sobre cualquier objeto `{ leccion: { bloque: number } }`, como `LeccionCargada` de `contenido.ts`).
- Produces: `interface GrupoBloque<T> { bloque: number; items: T[] }`, `agruparPorBloque<T extends { leccion: { bloque: number } }>(items: readonly T[]): GrupoBloque<T>[]` (bloques en orden ascendente; dentro de cada bloque se conserva el orden de entrada) y `textoPasos(total: number): string`.

- [ ] **Paso 1: escribir el test que falla**

`apps/web/test/portada.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { agruparPorBloque, textoPasos } from '../src/portada';

const ficha = (id: string, bloque: number) => ({ leccion: { id, bloque } });

describe('agruparPorBloque', () => {
  it('agrupa por bloque en orden ascendente aunque lleguen desordenados', () => {
    const grupos = agruparPorBloque([ficha('c', 3), ficha('a', 1), ficha('b', 3), ficha('d', 1)]);
    expect(grupos.map((grupo) => grupo.bloque)).toEqual([1, 3]);
  });

  it('conserva el orden de entrada dentro de cada bloque', () => {
    const grupos = agruparPorBloque([ficha('c', 3), ficha('a', 1), ficha('b', 3), ficha('d', 1)]);
    expect(grupos[0].items.map((item) => item.leccion.id)).toEqual(['a', 'd']);
    expect(grupos[1].items.map((item) => item.leccion.id)).toEqual(['c', 'b']);
  });

  it('sin lecciones devuelve una lista vacía', () => {
    expect(agruparPorBloque([])).toEqual([]);
  });
});

describe('textoPasos', () => {
  it('singular y plural', () => {
    expect(textoPasos(1)).toBe('1 paso');
    expect(textoPasos(5)).toBe('5 pasos');
  });
});
```

- [ ] **Paso 2: ejecutarlo y ver que falla**

Run: `pnpm --filter @traze/web test`
Expected: FAIL en `portada.test.ts` (no se puede resolver `../src/portada`).

- [ ] **Paso 3: crear `apps/web/src/portada.ts`**

```ts
export interface GrupoBloque<T> {
  bloque: number;
  items: T[];
}

export function agruparPorBloque<T extends { leccion: { bloque: number } }>(
  items: readonly T[],
): GrupoBloque<T>[] {
  const grupos = new Map<number, T[]>();
  for (const item of items) {
    const grupo = grupos.get(item.leccion.bloque);
    if (grupo) grupo.push(item);
    else grupos.set(item.leccion.bloque, [item]);
  }
  return [...grupos.entries()]
    .sort(([a], [b]) => a - b)
    .map(([bloque, lista]) => ({ bloque, items: lista }));
}

export function textoPasos(total: number): string {
  return total === 1 ? '1 paso' : `${total} pasos`;
}
```

- [ ] **Paso 4: comprobar**

Run: `pnpm --filter @traze/web test` → PASS.
Run: `pnpm typecheck` → sin errores.

- [ ] **Paso 5: commit**

```bash
git add apps/web/src/portada.ts apps/web/test/portada.test.ts
git commit -m "feat(web): agrupar las lecciones de la portada por bloque" -m "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"
```

---

## Tarea 8: marco del lienzo y escuadra decorativa (estilos)

El componente `Lienzo.tsx` NO se modifica (el filtro `#grafito` y las etiquetas quedan intactos). El marco y la escuadra los pone el reproductor en la Tarea 9; aquí se escribe el CSS, que también recoge las clases del trazo que hoy están en `globals.css`.

**Files:**
- Create: `apps/web/src/estilos/lienzo.css`

**Interfaces:**
- Consumes: tokens.
- Produces: las clases `.lienzo-marco` (contenedor) y `.escuadra` (decoración), más las clases del SVG que ya usa `Lienzo.tsx`: `.lienzo`, `.papel`, `.cuadricula-linea`, `.trazo`, `.trazo-dato`, `.trazo-construccion`, `.trazo-resultado`, `.punto-dato`, `.punto-construccion`, `.punto-resultado`, `.marca`, `.radio-compas`, `.punta`, `.rotulo`.

- [ ] **Paso 1: crear `apps/web/src/estilos/lienzo.css`**

```css
/* Marco del lienzo: 10 px de radio, fondo papel-claro y escuadra decorativa */
.lienzo-marco {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--papel-sombra);
  border-radius: var(--radio-medio);
  background: var(--papel-claro);
  box-shadow: var(--sombra-suave);
}

.lienzo {
  display: block;
  width: 100%;
  height: auto;
}

/* Escuadra translúcida en la esquina: puramente decorativa (aria-hidden en el marcado) */
.escuadra {
  position: absolute;
  right: var(--e3);
  bottom: var(--e3);
  width: 84px;
  height: 84px;
  background: var(--escuadra);
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
  pointer-events: none;
}

/* Dibujo (los colores del trazo no cambian) */

.papel {
  fill: var(--papel-claro);
}

.cuadricula-linea {
  fill: none;
  stroke: var(--cuadricula);
  stroke-width: 0.12;
  opacity: 0.5;
}

.trazo {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.trazo-dato {
  stroke: var(--grafito-dato);
  stroke-width: 2px;
}

.trazo-construccion {
  stroke: var(--grafito-construccion);
  stroke-width: 1px;
}

.trazo-resultado {
  stroke: var(--grafito-resultado);
  stroke-width: 3px;
}

.punto-dato {
  fill: var(--grafito-dato);
}

.punto-construccion {
  fill: var(--grafito-construccion);
}

.punto-resultado {
  fill: var(--grafito-resultado);
}

.marca {
  fill: none;
  stroke: var(--grafito-resultado);
  stroke-width: 1.5px;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.radio-compas {
  fill: none;
  stroke: var(--grafito-construccion);
  stroke-width: 1px;
  stroke-dasharray: 3 3;
  opacity: 0.7;
  vector-effect: non-scaling-stroke;
}

.punta {
  fill: var(--azul-correccion);
}

.rotulo {
  font-family: var(--rotulacion);
  font-style: italic;
  fill: var(--grafito-resultado);
}
```

- [ ] **Paso 2: importarlo en `layout.tsx`**

Edit `apps/web/src/app/layout.tsx`: justo después de la línea `import '../estilos/cabecera.css';` añade la línea `import '../estilos/lienzo.css';`.

- [ ] **Paso 3: comprobar**

Run: `pnpm test` → verde (el test de literales revisa `lienzo.css`: no debe haber `#...` ni `rgba(`).
Run: `pnpm typecheck` → sin errores.
Run: `pnpm --filter @traze/web build` → sin errores.

- [ ] **Paso 4: commit**

```bash
git add apps/web/src/estilos/lienzo.css apps/web/src/app/layout.tsx
git commit -m "feat(web): marco del lienzo con escuadra decorativa" -m "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"
```

---

## Tarea 9: marcado del reproductor y banda de instrumentos

**Files:**
- Create: `apps/web/src/componentes/BandaInstrumentos.tsx`
- Modify (reescribir entero): `apps/web/src/componentes/Reproductor.tsx`

**Interfaces:**
- Consumes: `derivarBanda`, `Banda` (Tarea 5); `decimal` (Tarea 5); `situacionPaso`, `etiquetaPaso` (Tarea 6); clases `.lienzo-marco`, `.escuadra` (Tarea 8).
- Produces: el componente `BandaInstrumentos({ banda }: { banda: Banda })` y las clases de marcado que estilan las Tareas 10 y 11: `.texto-paso`, `.porque`, `.nota-profe`, `.indice-pasos`, `.paso-boton`, `.paso-hecho`, `.paso-actual`, `.paso-pendiente`, `.paso-circulo`, `.boton`, `.boton-principal`, `.selector`, `.campo`, `.banda`, `.datos-modificables`, `.deslizador`, `.aviso`. La lógica del reproductor (estado, bucle de animación, deslizador, `prefers-reduced-motion`) no cambia.

- [ ] **Paso 1: crear `apps/web/src/componentes/BandaInstrumentos.tsx`**

```tsx
import type { Banda } from '../reproductor/instrumentos';

export function BandaInstrumentos({ banda }: { banda: Banda }) {
  const campos = [
    ['Instrumento', banda.instrumento],
    ['Lápiz', banda.lapiz],
    ['Abertura', banda.abertura],
  ] as const;

  return (
    <dl className="banda" aria-label="Instrumentos de este paso">
      {campos.map(([nombre, valor]) =>
        valor ? (
          <div key={nombre}>
            <dt>{nombre}</dt>
            <dd>{valor}</dd>
          </div>
        ) : null,
      )}
    </dl>
  );
}
```

- [ ] **Paso 2: reescribir `apps/web/src/componentes/Reproductor.tsx`**

```tsx
'use client';

import { useEffect, useMemo, useReducer, useState } from 'react';
import type { Leccion, LeccionResuelta } from '@traze/lecciones';
import { ConstruccionImposible, interpretarLeccion } from '@traze/lecciones/interpretar';
import { crearEstado, reductor, VELOCIDADES } from '../reproductor/estado';
import { decimal } from '../reproductor/formato';
import { etiquetaPaso, situacionPaso } from '../reproductor/indice';
import { derivarBanda } from '../reproductor/instrumentos';
import { duracionPaso } from '../reproductor/tiempos';
import { BandaInstrumentos } from './BandaInstrumentos';
import { Lienzo } from './Lienzo';

const FACTOR_MIN = 0.3;
const FACTOR_MAX = 0.85;
const MAX_SALTO_MS = 100;

interface Propiedades {
  leccion: Leccion;
  resuelta: LeccionResuelta;
}

export function Reproductor({ leccion, resuelta }: Propiedades) {
  const total = resuelta.pasos.length;
  const [estado, despachar] = useReducer(reductor, total, (pasos) => crearEstado(pasos));
  const [vista, setVista] = useState<LeccionResuelta>(resuelta);
  const [factores, setFactores] = useState<Record<string, number>>(() =>
    Object.fromEntries(Object.entries(leccion.radios).map(([id, radio]) => [id, radio.factor])),
  );
  const [aviso, setAviso] = useState<string | null>(null);

  const dibujos = useMemo(() => vista.pasos.map((paso) => paso.dibujo), [vista]);
  const pasoActual = vista.pasos[estado.paso];
  const duracion = duracionPaso(dibujos[estado.paso]);
  const banda = useMemo(
    () => derivarBanda(dibujos[estado.paso], vista.radios, leccion.radios, factores),
    [dibujos, estado.paso, vista.radios, leccion.radios, factores],
  );

  useEffect(() => {
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (consulta.matches) despachar({ tipo: 'animar', valor: false });
  }, []);

  useEffect(() => {
    if (!estado.reproduciendo) return;

    let anterior = performance.now();
    let cuadro = 0;
    const bucle = (ahora: number) => {
      despachar({
        tipo: 'avanzar',
        ms: Math.min(MAX_SALTO_MS, ahora - anterior),
        duracionPasoMs: duracion,
      });
      anterior = ahora;
      cuadro = requestAnimationFrame(bucle);
    };
    cuadro = requestAnimationFrame(bucle);
    return () => cancelAnimationFrame(cuadro);
  }, [estado.reproduciendo, estado.paso, duracion]);

  function cambiarFactor(id: string, valor: number) {
    const nuevos = { ...factores, [id]: valor };
    setFactores(nuevos);
    try {
      setVista(interpretarLeccion(leccion, nuevos));
      setAviso(null);
    } catch (error) {
      if (!(error instanceof ConstruccionImposible)) throw error;
      setAviso(error.message);
    }
  }

  return (
    <section className="reproductor" aria-label="Demostración animada">
      <div className="sala">
        <div className="lienzo-marco">
          <Lienzo
            ancho={vista.lienzo.ancho}
            alto={vista.lienzo.alto}
            dibujos={dibujos}
            paso={estado.paso}
            progreso={estado.progreso}
            ocultarConstruccion={estado.ocultarConstruccion}
            descripcion={`Paso ${estado.paso + 1} de ${total}: ${pasoActual.titulo}`}
          />
          <span className="escuadra" aria-hidden="true" />
        </div>

        <div className="panel-paso">
          <p className="etiqueta" aria-live="polite">
            Paso {estado.paso + 1} de {total}
          </p>
          <h2>{pasoActual.titulo}</h2>
          <p className="texto-paso">{pasoActual.texto}</p>
          <p className="porque">
            <strong>Por qué.</strong> {pasoActual.porque}
          </p>
          {pasoActual.consejo && (
            <details className="nota-profe">
              <summary>Consejo del profe</summary>
              <p>{pasoActual.consejo}</p>
            </details>
          )}
        </div>
      </div>

      <ol className="indice-pasos" aria-label="Pasos de la lección">
        {vista.pasos.map((paso, i) => {
          const situacion = situacionPaso(i, estado.paso);
          return (
            <li key={i}>
              <button
                type="button"
                className={`paso-boton paso-${situacion}`}
                aria-current={situacion === 'actual' ? 'step' : undefined}
                aria-label={etiquetaPaso(i, paso.titulo, situacion)}
                onClick={() => despachar({ tipo: 'irA', paso: i })}
              >
                <span className="paso-circulo" aria-hidden="true">
                  {situacion === 'hecho' ? '✓' : i + 1}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="controles" role="group" aria-label="Controles de la lección">
        <button
          type="button"
          className="boton"
          disabled={estado.paso === 0}
          onClick={() => despachar({ tipo: 'anterior' })}
        >
          ← Anterior
        </button>
        <button
          type="button"
          className="boton boton-principal"
          disabled={!estado.animar}
          onClick={() => despachar({ tipo: 'alternarReproduccion' })}
        >
          {estado.reproduciendo ? 'Pausar' : 'Reproducir todo'}
        </button>
        <button
          type="button"
          className="boton"
          disabled={estado.paso === total - 1}
          onClick={() => despachar({ tipo: 'siguiente' })}
        >
          Siguiente →
        </button>
        <button type="button" className="boton" onClick={() => despachar({ tipo: 'reiniciar' })}>
          Reiniciar
        </button>
        <button type="button" className="boton" onClick={() => despachar({ tipo: 'verSolucion' })}>
          Ver solución completa
        </button>

        <label className="campo">
          Velocidad
          <select
            className="selector"
            value={estado.velocidad}
            onChange={(evento) => {
              const valor = VELOCIDADES.find((v) => v === Number(evento.target.value));
              if (valor) despachar({ tipo: 'velocidad', valor });
            }}
          >
            {VELOCIDADES.map((v) => (
              <option key={v} value={v}>
                {decimal(v, 1).replace(',0', '')}×
              </option>
            ))}
          </select>
        </label>

        <label className="campo">
          <input
            type="checkbox"
            checked={estado.ocultarConstruccion}
            onChange={() => despachar({ tipo: 'alternarConstruccion' })}
          />
          Ocultar construcción
        </label>
      </div>

      {banda && <BandaInstrumentos banda={banda} />}

      {Object.keys(leccion.radios).length > 0 && (
        <div className="datos-modificables">
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
          {aviso && (
            <p className="aviso" role="alert">
              {aviso}. Se muestra el último trazado válido.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Paso 3: comprobar**

Run: `pnpm test` → todo en verde (los 40 tests previos de la web siguen pasando).
Run: `pnpm typecheck` → sin errores. Si falla porque `leccion.radios` no es asignable a `Readonly<Record<string, RadioDeclarado>>`, DETENTE y cuéntalo con el mensaje exacto.
Run: `pnpm --filter @traze/web build` → sin errores.

- [ ] **Paso 4: commit**

```bash
git add apps/web/src/componentes/BandaInstrumentos.tsx apps/web/src/componentes/Reproductor.tsx
git commit -m "feat(web): marcado del reproductor con indice de pasos, boton principal y banda de instrumentos" -m "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"
```

---

## Tarea 10: panel del paso, nota desplegable, índice de pasos y banda (estilos)

**Files:**
- Create: `apps/web/src/estilos/panel.css`
- Modify: `apps/web/src/app/layout.tsx` (una línea)

**Interfaces:**
- Consumes: clases de marcado de la Tarea 9; tokens.
- Produces: el aspecto de `.sala`, `.panel-paso`, `.texto-paso`, `.porque`, `.nota-profe`, `.indice-pasos`, `.paso-*`, `.banda`.

- [ ] **Paso 1: crear `apps/web/src/estilos/panel.css`**

```css
.sala {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: var(--e5);
  align-items: start;
}

@media (max-width: 800px) {
  .sala {
    grid-template-columns: 1fr;
  }
}

/* Panel del paso */

.panel-paso h2 {
  margin: var(--e1) 0 var(--e2);
}

.texto-paso {
  margin: 0 0 var(--e3);
}

.porque {
  margin: 0 0 var(--e4);
  color: var(--tinta-suave);
}

/* Nota del profe: bloque con banda azul que se despliega con animación */

.nota-profe {
  padding: 0;
  border-left: 4px solid var(--azul-correccion);
  border-radius: var(--radio-chico);
  background: var(--nota-fondo);
  color: var(--azul-correccion);
}

.nota-profe summary {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--e4);
  cursor: pointer;
  font-family: var(--serif);
  font-style: italic;
}

.nota-profe[open] > p {
  margin: 0;
  padding: 0 var(--e4) var(--e4);
  color: var(--tinta);
  animation: nota-abrir var(--t-panel) var(--curva) both;
}

@keyframes nota-abrir {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* Índice de pasos: círculos de 30 px dentro de una zona táctil de 44 px */

.indice-pasos {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e1);
  margin: var(--e5) 0 0;
  padding: 0;
  list-style: none;
}

.paso-boton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: var(--radio-pildora);
  background: transparent;
  cursor: pointer;
  font: inherit;
}

.paso-boton:hover:not(:disabled) {
  background: transparent;
}

.paso-circulo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--tinta-suave);
  border-radius: var(--radio-pildora);
  background: var(--papel);
  color: var(--tinta);
  font-size: 0.875rem;
  transition:
    background var(--t-control) var(--curva),
    box-shadow var(--t-control) var(--curva);
}

.paso-pendiente:hover .paso-circulo {
  background: var(--papel-sombra);
}

.paso-hecho .paso-circulo {
  border-color: var(--exito-texto);
  background: var(--exito-suave);
  color: var(--exito-texto);
}

.paso-actual .paso-circulo {
  border-color: var(--tinta);
  background: var(--tinta);
  box-shadow: var(--sombra-boton);
  color: var(--papel);
  font-weight: 700;
}

/* Banda de instrumentos */

.banda {
  display: flex;
  flex-wrap: wrap;
  gap: var(--e2) var(--e5);
  margin: 0 0 var(--e4);
  padding: var(--e3) var(--e4);
  border: 1px solid var(--papel-sombra);
  border-radius: var(--radio-medio);
  background: var(--papel-claro);
}

.banda > div {
  display: flex;
  flex-direction: column;
}

.banda dt {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tinta-suave);
}

.banda dd {
  margin: 0;
  font-family: var(--serif);
}
```

- [ ] **Paso 2: importarlo en `layout.tsx`**

Edit `apps/web/src/app/layout.tsx`: tras la línea `import '../estilos/lienzo.css';` añade `import '../estilos/panel.css';`.

- [ ] **Paso 3: comprobar**

Run: `pnpm test` → verde. Run: `pnpm typecheck` → sin errores. Run: `pnpm --filter @traze/web build` → sin errores.

- [ ] **Paso 4: commit**

```bash
git add apps/web/src/estilos/panel.css apps/web/src/app/layout.tsx
git commit -m "feat(web): estilos del panel del paso, la nota, el indice de pasos y la banda" -m "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"
```

---

## Tarea 11: controles de píldora y deslizador del compás (estilos)

**Files:**
- Create: `apps/web/src/estilos/controles.css`
- Create: `apps/web/src/estilos/deslizador.css`
- Modify: `apps/web/src/app/layout.tsx` (dos líneas)

**Interfaces:**
- Consumes: clases `.controles`, `.boton`, `.boton-principal`, `.selector`, `.campo`, `.datos-modificables`, `.deslizador`, `.aviso` (Tarea 9); tokens.
- Produces: botones de píldora de al menos 44 px (solo «Reproducir todo» relleno); deslizador con marco de ficha, pista de 4 px y mando de 22 px.

- [ ] **Paso 1: crear `apps/web/src/estilos/controles.css`**

```css
.controles {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--e2);
  margin: var(--e4) 0;
}

.boton {
  min-width: 44px;
  min-height: 44px;
  padding: 0 var(--e4);
  border: 1px solid var(--tinta);
  border-radius: var(--radio-pildora);
  background: var(--papel);
  box-shadow: var(--sombra-boton);
  color: var(--tinta);
  font: inherit;
  cursor: pointer;
  transition:
    background var(--t-control) var(--curva),
    transform var(--t-control) var(--curva);
}

.boton:hover:not(:disabled) {
  background: var(--papel-sombra);
}

.boton:active:not(:disabled) {
  transform: translateY(1px);
}

.boton:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Un solo acento por vista */
.boton-principal {
  background: var(--tinta);
  color: var(--papel);
}

.boton-principal:hover:not(:disabled) {
  background: var(--tinta-suave);
}

.selector {
  min-width: 44px;
  min-height: 44px;
  padding: 0 var(--e4);
  border: 1px solid var(--tinta);
  border-radius: var(--radio-pildora);
  background: var(--papel);
  color: var(--tinta);
  font: inherit;
  cursor: pointer;
}

.campo {
  display: inline-flex;
  align-items: center;
  gap: var(--e2);
  min-height: 44px;
}

.campo input[type='checkbox'] {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: var(--azul-correccion);
}
```

- [ ] **Paso 2: crear `apps/web/src/estilos/deslizador.css`**

```css
/* Marco de ficha */
.datos-modificables {
  margin-top: var(--e5);
  padding: var(--e4);
  border: 1px solid var(--papel-sombra);
  border-radius: var(--radio-medio);
  background: var(--papel-claro);
}

.datos-modificables h3 {
  margin: 0 0 var(--e2);
  font-size: 1.1rem;
}

.deslizador {
  display: grid;
  gap: var(--e1);
}

.deslizador input[type='range'] {
  width: 100%;
  min-height: 44px;
  background: transparent;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

/* Pista de 4 px */
.deslizador input[type='range']::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: var(--radio-pildora);
  background: var(--regla);
}

.deslizador input[type='range']::-moz-range-track {
  height: 4px;
  border-radius: var(--radio-pildora);
  background: var(--regla);
}

/* Mando de 22 px */
.deslizador input[type='range']::-webkit-slider-thumb {
  width: 22px;
  height: 22px;
  margin-top: -9px;
  border: 3px solid var(--papel-claro);
  border-radius: var(--radio-pildora);
  background: var(--azul-correccion);
  box-shadow: var(--sombra-boton);
  -webkit-appearance: none;
  appearance: none;
}

.deslizador input[type='range']::-moz-range-thumb {
  box-sizing: border-box;
  width: 22px;
  height: 22px;
  border: 3px solid var(--papel-claro);
  border-radius: var(--radio-pildora);
  background: var(--azul-correccion);
  box-shadow: var(--sombra-boton);
}

.aviso {
  margin: var(--e3) 0 0;
  color: var(--rojo-profe);
  font-weight: 600;
}
```

- [ ] **Paso 3: importarlos en `layout.tsx`**

Edit `apps/web/src/app/layout.tsx`: tras la línea `import '../estilos/panel.css';` añade estas dos líneas:

```tsx
import '../estilos/controles.css';
import '../estilos/deslizador.css';
```

- [ ] **Paso 4: comprobar**

Run: `pnpm test` → verde. Run: `pnpm typecheck` → sin errores. Run: `pnpm --filter @traze/web build` → sin errores.

- [ ] **Paso 5: commit**

```bash
git add apps/web/src/estilos/controles.css apps/web/src/estilos/deslizador.css apps/web/src/app/layout.tsx
git commit -m "feat(web): controles de pildora y deslizador del compas" -m "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"
```

---

## Tarea 12: cabecera de la lección y cajetín

**Files:**
- Modify (reescribir entero): `apps/web/src/app/leccion/[id]/page.tsx`
- Create: `apps/web/src/estilos/leccion.css`
- Modify: `apps/web/src/app/layout.tsx` (una línea)

**Interfaces:**
- Consumes: `cargarLeccion`, `cargarLecciones` (`contenido.ts`); `Reproductor` (Tarea 9); clase `.etiqueta` (Tarea 2).
- Produces: cajetín con filas Lámina / Escala / Formato separadas por líneas; clases `.leccion-cabecera`, `.leccion-titulo`, `.cajetin`, `.enunciado`, `.idea-clave`, `.errores`, `.pasos-escritos`. El formato se muestra en milímetros de papel (ancho × alto del lienzo, p. ej. `210 × 140 mm`).

- [ ] **Paso 1: reescribir `apps/web/src/app/leccion/[id]/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Reproductor } from '../../../componentes/Reproductor';
import { cargarLeccion, cargarLecciones } from '../../../contenido';

export const dynamicParams = false;

interface Propiedades {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return cargarLecciones().map(({ leccion }) => ({ id: leccion.id }));
}

export async function generateMetadata({ params }: Propiedades): Promise<Metadata> {
  const { id } = await params;
  const cargada = cargarLeccion(id);
  if (!cargada) return {};
  return { title: cargada.leccion.titulo, description: cargada.leccion.enunciado };
}

export default async function PaginaLeccion({ params }: Propiedades) {
  const { id } = await params;
  const cargada = cargarLeccion(id);
  if (!cargada) notFound();

  const { leccion, resuelta } = cargada;

  return (
    <article className="leccion">
      <header className="leccion-cabecera">
        <div className="leccion-titulo">
          <p className="etiqueta">Bloque {leccion.bloque}</p>
          <h1>{leccion.titulo}</h1>
        </div>
        <aside className="cajetin" aria-label="Cajetín de la lámina">
          <dl>
            <div>
              <dt>Lámina</dt>
              <dd>{leccion.titulo}</dd>
            </div>
            <div>
              <dt>Escala</dt>
              <dd>1:1</dd>
            </div>
            <div>
              <dt>Formato</dt>
              <dd>
                {resuelta.lienzo.ancho} × {resuelta.lienzo.alto} mm
              </dd>
            </div>
          </dl>
        </aside>
      </header>

      <section className="enunciado">
        <h2>Enunciado</h2>
        <p>{leccion.enunciado}</p>
        <p className="idea-clave">
          <strong>Idea clave.</strong> {leccion.ideaClave}
        </p>
      </section>

      <Reproductor leccion={leccion} resuelta={resuelta} />

      {leccion.errores.length > 0 && (
        <section className="errores">
          <h2>Errores frecuentes</h2>
          <ul>
            {leccion.errores.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      )}

      <details className="pasos-escritos">
        <summary>Los pasos por escrito</summary>
        <ol>
          {resuelta.pasos.map((paso) => (
            <li key={paso.titulo}>
              <strong>{paso.titulo}.</strong> {paso.texto} <em>{paso.porque}</em>
            </li>
          ))}
        </ol>
      </details>
    </article>
  );
}
```

- [ ] **Paso 2: crear `apps/web/src/estilos/leccion.css`**

```css
.leccion-cabecera {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--e5);
  margin-bottom: var(--e5);
}

.leccion-titulo {
  flex: 1 1 18rem;
  min-width: 0;
}

/* Cajetín: lámina, escala y formato con líneas separadoras */
.cajetin {
  min-width: 14rem;
  border: 2px solid var(--tinta);
  border-radius: var(--radio-chico);
  background: var(--velo);
  font-family: var(--serif);
  font-style: normal;
}

.cajetin dl {
  margin: 0;
}

.cajetin dl > div {
  display: flex;
  justify-content: space-between;
  gap: var(--e4);
  padding: var(--e1) var(--e3);
  border-bottom: 1px solid var(--tinta);
}

.cajetin dl > div:last-child {
  border-bottom: 0;
}

.cajetin dt {
  align-self: center;
  font-family: var(--interfaz);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tinta-suave);
}

.cajetin dd {
  margin: 0;
  font-style: italic;
  text-align: right;
}

@media (max-width: 600px) {
  .cajetin {
    width: 100%;
  }
}

.enunciado {
  margin-bottom: var(--e5);
}

.enunciado h2 {
  margin: 0 0 var(--e2);
}

.idea-clave {
  padding: var(--e3) var(--e4);
  border-left: 4px solid var(--azul-correccion);
  border-radius: var(--radio-chico);
  background: var(--nota-fondo);
}

.errores {
  margin-top: var(--e6);
}

.errores ul {
  padding-left: 1.25rem;
}

.pasos-escritos {
  margin-top: var(--e5);
}

.pasos-escritos summary {
  display: flex;
  align-items: center;
  min-height: 44px;
  cursor: pointer;
  color: var(--azul-correccion);
}
```

- [ ] **Paso 3: importarlo en `layout.tsx`**

Edit `apps/web/src/app/layout.tsx`: tras la línea `import '../estilos/deslizador.css';` añade `import '../estilos/leccion.css';`.

- [ ] **Paso 4: comprobar**

Run: `pnpm test` → verde. Run: `pnpm typecheck` → sin errores. Run: `pnpm --filter @traze/web build` → sin errores.

- [ ] **Paso 5: commit** (la ruta lleva corchetes: usa `:(literal)`)

```bash
git add ":(literal)apps/web/src/app/leccion/[id]/page.tsx" apps/web/src/estilos/leccion.css apps/web/src/app/layout.tsx
git commit -m "feat(web): cabecera de la leccion con cajetin de lamina, escala y formato" -m "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"
```

---

## Tarea 13: portada con fichas por bloque

**Files:**
- Modify (reescribir entero): `apps/web/src/app/page.tsx`
- Create: `apps/web/src/estilos/portada.css`
- Modify: `apps/web/src/app/layout.tsx` (una línea)

**Interfaces:**
- Consumes: `cargarLecciones` (`contenido.ts`); `agruparPorBloque`, `textoPasos` (Tarea 7).
- Produces: portada con lema y fichas agrupadas por bloque (el título del bloque es «Bloque N»: `BLOQUES_TEMARIO` con los nombres no está exportado por el paquete de lecciones y no se toca aquí).

- [ ] **Paso 1: reescribir `apps/web/src/app/page.tsx`**

```tsx
import Link from 'next/link';
import { cargarLecciones } from '../contenido';
import { agruparPorBloque, textoPasos } from '../portada';

export default function Portada() {
  const grupos = agruparPorBloque(cargarLecciones());

  return (
    <section className="portada">
      <h1>Traze</h1>
      <p className="lema">Dibujo Técnico de 1º de Bachillerato, trazo a trazo.</p>

      {grupos.length === 0 && <p>Todavía no hay lecciones publicadas.</p>}

      {grupos.map((grupo) => (
        <section
          key={grupo.bloque}
          className="bloque"
          aria-labelledby={`bloque-${grupo.bloque}`}
        >
          <h2 id={`bloque-${grupo.bloque}`}>Bloque {grupo.bloque}</h2>
          <ul className="fichas">
            {grupo.items.map(({ leccion, resuelta }) => (
              <li key={leccion.id}>
                <Link className="ficha" href={`/leccion/${leccion.id}`}>
                  <span className="ficha-titulo">{leccion.titulo}</span>
                  <span className="ficha-meta">{textoPasos(resuelta.pasos.length)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
```

- [ ] **Paso 2: crear `apps/web/src/estilos/portada.css`**

```css
.portada .lema {
  margin: 0 0 var(--e6);
  font-family: var(--serif);
  font-size: 1.2rem;
  color: var(--tinta-suave);
}

.bloque {
  margin-top: var(--e5);
}

.bloque h2 {
  margin: 0 0 var(--e3);
}

.fichas {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: var(--e3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.ficha {
  display: flex;
  flex-direction: column;
  gap: var(--e1);
  min-height: 44px;
  padding: var(--e3) var(--e4);
  border: 1px solid var(--papel-sombra);
  border-radius: var(--radio-medio);
  background: var(--papel-claro);
  box-shadow: var(--sombra-boton);
  color: var(--tinta);
  text-decoration: none;
  transition:
    transform var(--t-control) var(--curva),
    box-shadow var(--t-control) var(--curva),
    border-color var(--t-control) var(--curva);
}

.ficha:hover {
  border-color: var(--azul-correccion);
  box-shadow: var(--sombra-suave);
  transform: translateY(-2px);
}

.ficha-titulo {
  font-family: var(--serif);
  font-size: 1.1rem;
  font-weight: 600;
}

.ficha-meta {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tinta-suave);
}
```

- [ ] **Paso 3: importarlo en `layout.tsx`**

Edit `apps/web/src/app/layout.tsx`: tras la línea `import '../estilos/leccion.css';` añade `import '../estilos/portada.css';`.

- [ ] **Paso 4: comprobar**

Run: `pnpm test` → verde. Run: `pnpm typecheck` → sin errores. Run: `pnpm --filter @traze/web build` → sin errores.

- [ ] **Paso 5: commit**

```bash
git add apps/web/src/app/page.tsx apps/web/src/estilos/portada.css apps/web/src/app/layout.tsx
git commit -m "feat(web): portada con fichas agrupadas por bloque" -m "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"
```

---

## Tarea 14: retirar `globals.css`

Todo lo que contenía ya vive en `src/estilos/` (tokens, base, hoja, cabecera, lienzo, panel, controles, deslizador, lección y portada). Esta tarea lo elimina para que no queden estilos sueltos.

**Files:**
- Delete: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/app/layout.tsx` (quitar una línea)

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: un único sistema de estilos en `src/estilos/`.

- [ ] **Paso 1: quitar la importación**

Edit `apps/web/src/app/layout.tsx`: elimina la línea `import './globals.css';`.

- [ ] **Paso 2: borrar el archivo**

```bash
git rm apps/web/src/app/globals.css
```

- [ ] **Paso 3: comprobar**

Run: `pnpm test` → todo en verde.
Run: `pnpm typecheck` → sin errores.
Run: `pnpm --filter @traze/web build` → sin errores.

- [ ] **Paso 4: comprobar que no queda ninguna referencia**

Run: `grep -rn "globals.css" apps/web/src || echo "sin referencias"`
Expected: `sin referencias`.

- [ ] **Paso 5: commit**

```bash
git add apps/web/src/app/layout.tsx
git commit -m "refactor(web): retira globals.css, los estilos viven en src/estilos" -m "Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>"
```

(`git rm` ya dejó el borrado preparado; el commit lo incluye.)

---

## Tarea 15: verificación final

No crea ficheros. Si algún punto falla, DETENTE y cuéntalo; no modifiques código fuera de lo que diga la tarea que lo introdujo sin avisar.

- [ ] **Paso 1: batería completa**

Run: `pnpm test` → todos los paquetes en verde; `@traze/web` con los 40 tests previos más los nuevos, ninguno fallido.
Run: `pnpm typecheck` → sin errores.
Run: `pnpm --filter @traze/web build` → sin errores; rutas `/` y `/leccion/[id]` generadas.
Run: `grep -rl "fonts.gstatic.com" apps/web/out || echo "sin peticiones externas"` → `sin peticiones externas`.

- [ ] **Paso 2: arrancar la web**

Run (en segundo plano): `pnpm --filter @traze/web dev`
Expected: queda escuchando en `http://localhost:3000`.

- [ ] **Paso 3: revisión visual en el navegador**

Si dispones de herramientas de navegador, abre `http://localhost:3000/` y `http://localhost:3000/leccion/mediatriz-segmento`, y haz una captura de cada una a 1280, 768 y 375 px de ancho. Comprueba a ojo:
- Portada: hoja crema con margen rojo tenue a la izquierda y regla graduada arriba sobre la mesa cuadriculada; lema en serif; fichas agrupadas bajo «Bloque 1»; cabecera con «Traze» en cursiva y «Lecciones» subrayada en azul.
- Lección: etiqueta «Bloque 1», título serif, cajetín con Lámina / Escala / Formato separados por líneas, lienzo con esquinas redondeadas y escuadra translúcida en la esquina, panel del paso con nota del profe (se despliega con un fundido), índice de pasos en círculos (hechos en verde con ✓, actual en tinta), solo «Reproducir todo» relleno, banda de instrumentos bajo los controles, deslizador con marco de ficha.

Si no dispones de navegador, dilo y deja este paso como pendiente en el informe final.

- [ ] **Paso 4: comprobaciones medidas con JavaScript** (en la consola del navegador de `/leccion/mediatriz-segmento`, a 375 px y a 1280 px)

```js
({
  sinDesbordeHorizontal: document.documentElement.scrollWidth <= window.innerWidth,
  pequenos: [...document.querySelectorAll('button, select, summary, .navegacion a, .logo, .ficha')]
    .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44); })
    .map((e) => e.outerHTML.slice(0, 80)),
  actual: document.querySelectorAll('.indice-pasos [aria-current="step"]').length,
  decoraciones: [...document.querySelectorAll('.escuadra')].every((e) => e.getAttribute('aria-hidden') === 'true'),
})
```
Expected: `sinDesbordeHorizontal: true`, `pequenos: []`, `actual: 1`, `decoraciones: true`. En la portada (`/`), repite solo `sinDesbordeHorizontal` y `pequenos`.

- [ ] **Paso 5: movimiento reducido**

Si el navegador permite emular `prefers-reduced-motion: reduce`, actívalo y comprueba en `/leccion/mediatriz-segmento`: `getComputedStyle(document.documentElement).getPropertyValue('--t-control').trim()` devuelve `0ms`, el reproductor no se anima solo y el paso se muestra completo. Si no se puede emular, la garantía es el test de `tokens.test.ts` (Tarea 1); dilo en el informe.

- [ ] **Paso 6: etiquetas A, B, M, N y O (pendiente de la Tarea 4 del Plan 2)**

En `http://localhost:3000/leccion/mediatriz-segmento` pulsa «Ver solución completa» y ejecuta en la consola:

```js
[...document.querySelectorAll('.rotulos text')].map((t) => ({ letra: t.textContent, x: t.getAttribute('x'), y: t.getAttribute('y'), tamano: t.getAttribute('font-size') }))
```
Expected: cinco entradas con las letras A, B, M, N y O, todas con el mismo `tamano` (`5`). Haz una captura y comprueba a ojo que ninguna letra se pisa con un trazo ni con otra letra, y que el tamaño y la posición son los de siempre (desplazamiento `dx = 2`, `dy = -2.5` respecto de cada punto). Anota el resultado.

- [ ] **Paso 7: parar el servidor y comprobar el árbol**

Para el servidor de desarrollo.
Run: `git status --short`
Expected: sin cambios en `apps/web` (solo pueden aparecer los ficheros ajenos de siempre: `contenido/bloque-1-trazados/dividir-segmento-dos-partes.json` y `docs/`).

- [ ] **Paso 8: informe**

Cuenta: resultado de cada comprobación, capturas hechas o motivo de no hacerlas, y cualquier cosa que no coincida con lo esperado. No hagas más commits en esta tarea.

---

## Después de este plan

- Las tareas 12, 13 y 14 del Plan 3 (mapa del temario, página de consejos, SEO) escriben interfaz y deben ajustarse a estos tokens y clases (`.hoja`, `.etiqueta`, `.ficha`, `.boton`, variables `--e*`, `--radio-*`, `--serif`…) antes de ejecutarse. En concreto:
  - Tarea 12: ya no debe reescribir la portada ni la navegación desde cero; la navegación vive en `apps/web/src/navegacion.ts` (basta poner `disponible: true` en Temario) y la portada está en `apps/web/src/app/page.tsx` con `agruparPorBloque`.
  - Tarea 13: «Consejos» ya figura en `ENLACES` (`/consejos`); «Mi carpeta» apunta a `/carpeta` provisionalmente y la ruta real la fija el Plan 3.
  - Tarea 14 (SEO): modifica `layout.tsx`, que tras este plan importa fuentes y estilos; debe conservar esas líneas.
  - Los títulos de bloque de la portada y el mapa pueden usar `BLOQUES_TEMARIO` si el Plan 3 lo exporta; hoy la portada muestra «Bloque N».
- Cualquier CSS nuevo del Plan 3 va en archivos de `apps/web/src/estilos/`, sin colores literales (lo comprueba `tokens.test.ts`).
