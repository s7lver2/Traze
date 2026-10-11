# Plan 1: núcleo de Traze (implementación)

Oct 11, 2026 · @s7lver

> Para agentes: SUBSKILL REQUERIDA: usar superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para implementar este plan tarea a tarea. Los pasos usan casillas (`- [ ]`) para el seguimiento.

Objetivo: construir el núcleo de Traze: un motor de geometría probado, un formato de lección validado y un reproductor SVG que anima paso a paso la lección piloto «Mediatriz de un segmento».

Arquitectura: monorepo pnpm con tres piezas. `packages/geometria` calcula (funciones puras), `packages/lecciones` define el esquema Zod, interpreta las lecciones y ejecuta sus comprobaciones, y `apps/web` (Next.js) exporta un sitio estático. Las lecciones son JSON en `contenido/`; el motor calcula todas las coordenadas y el reproductor solo pinta.

Stack: TypeScript estricto, pnpm 9, Node 20, Vitest 2, Zod 3, Next.js 15 con React 19, SVG.

## Alcance y decisiones fijadas

| Cubre este plan | Queda para los planes siguientes |
| --- | --- |
| Hitos 0 a 4 del plan maestro: cimientos, motor, formato, reproductor y lección piloto | Pipeline de generación con IA (Plan 2) |
| Una lección completa y publicable en local | Las 21 lecciones, mapa del temario, biblioteca de consejos y SEO (Plan 3) |
| Deslizador del radio del compás | Puntos arrastrables, PWA, auditorías y lanzamiento (Plan 4) |

Decisiones fijadas para todo el plan:

- Las coordenadas de las lecciones están en milímetros de papel y el lienzo por defecto mide 210 × 140 mm.
- Si una construcción es imposible con los datos dados, el intérprete lanza `ConstruccionImposible`; nunca devuelve valores a medias.
- «Reproducir todo» solo encadena los pasos. Cada paso se anima siempre al entrar en él, también con los botones manuales.
- Las lecciones describen construcciones, nunca coordenadas calculadas: eso lo hace el motor.
- Tolerancia de las comprobaciones geométricas: 1e-6.
- El deslizador del compás recalcula la construcción en el navegador con el mismo intérprete. Con un radio imposible muestra un aviso y conserva el último trazado válido.
- Con `prefers-reduced-motion`, cada paso aparece terminado sin animar.

## Mapa de archivos

Cada archivo tiene una sola responsabilidad. El paquete `geometria` no importa nada de React ni del navegador, y `lecciones` no importa nada de `fs` (solo el comando `validar-cli.ts` lo hace).

| Archivo | Responsabilidad | Tarea |
| --- | --- | --- |
| `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore` | Monorepo y configuración común | 1 |
| `packages/geometria/src/vec.ts` | Tipos `Punto`, `Recta`, `Circunferencia` y operaciones con vectores | 2 |
| `packages/geometria/src/interseccion.ts` | Intersección de rectas y circunferencias | 3 |
| `packages/geometria/src/construcciones.ts` | Mediatriz | 4 |
| `packages/lecciones/src/esquema.ts` | Esquema Zod de lección y validación de referencias | 5 |
| `packages/lecciones/src/validar.ts` | `validarLeccion` con errores legibles | 5 |
| `contenido/bloque-1-trazados/mediatriz-segmento.json` | Lección piloto | 5 |
| `packages/lecciones/src/interpretar.ts` | Convierte una lección en primitivas con coordenadas y ejecuta comprobaciones | 6 |
| `packages/lecciones/src/procesar.ts` | Valida, interpreta y comprueba una lección de una vez (lo usan el comando y la web) | 6 |
| `packages/lecciones/src/validar-cli.ts` | Comando que valida todo `contenido/` | 6 |
| `apps/web/package.json`, `tsconfig.json`, `next.config.mjs` | Proyecto Next.js con exportación estática | 7 |
| `apps/web/src/reproductor/tiempos.ts` | Duración y progreso de cada primitiva | 7 |
| `apps/web/src/reproductor/estado.ts` | Reductor del reproductor: paso, tiempo, velocidad | 7 |
| `apps/web/src/reproductor/trazado.ts` | Funciones puras: punta del lápiz, caminos SVG, marcas y tamaño de los puntos | 8 |
| `apps/web/src/componentes/Lienzo.tsx` | Pinta las primitivas en SVG según su progreso | 8 |
| `apps/web/src/app/globals.css`, `layout.tsx` | Estilos lápiz, controles y estructura HTML | 8 y 9 |
| `apps/web/src/contenido.ts` | Carga y valida el contenido en el servidor | 9 |
| `apps/web/src/componentes/Reproductor.tsx` | Controles, animación y panel de explicación | 9 |
| `apps/web/src/app/page.tsx`, `leccion/[id]/page.tsx` | Portada y página de cada lección | 9 |

Todos los tests viven en una carpeta `test/` junto a `src/` de cada paquete.

## Tarea 1: monorepo y herramientas

Archivos a crear:

- `.gitignore`, `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`
- `packages/geometria/package.json`, `packages/geometria/tsconfig.json`, `packages/geometria/src/index.ts`
- `packages/lecciones/package.json`, `packages/lecciones/tsconfig.json`, `packages/lecciones/src/index.ts`

* [ ] Paso 1: crear los archivos de la raíz

`.gitignore`:

```text
node_modules
.next
out
dist
*.log
.DS_Store
```

`package.json`:

```json
{
  "name": "traze",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "engines": { "node": ">=20" },
  "scripts": {
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck",
    "validar": "pnpm --filter @traze/lecciones validar",
    "web": "pnpm --filter @traze/web dev"
  }
}
```

`pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
```

- [ ] Paso 2: crear el paquete `geometria`

`packages/geometria/package.json`:

```json
{
  "name": "@traze/geometria",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "test": "vitest run --passWithNoTests",
    "typecheck": "tsc --noEmit -p tsconfig.json"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

`packages/geometria/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src", "test"]
}
```

`packages/geometria/src/index.ts`:

```ts
export {};
```

- [ ] Paso 3: crear el paquete `lecciones`

`packages/lecciones/package.json`:

```json
{
  "name": "@traze/lecciones",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "test": "vitest run --passWithNoTests",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "validar": "tsx src/validar-cli.ts"
  },
  "dependencies": {
    "@traze/geometria": "workspace:*",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

`packages/lecciones/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "types": ["node"] },
  "include": ["src", "test"]
}
```

`packages/lecciones/src/index.ts`:

```ts
export {};
```

- [ ] Paso 4: inicializar git e instalar dependencias

Ejecuta:

```bash
git init
pnpm install
```

Esperado: `pnpm install` termina con `Done in ...` y crea `node_modules` en cada paquete.

- [ ] Paso 5: comprobar que los tipos compilan

Ejecuta: `pnpm typecheck`

Esperado: los dos paquetes ejecutan `tsc --noEmit` sin ningún error.

- [ ] Paso 6: confirmar

```bash
git add .gitignore package.json pnpm-workspace.yaml tsconfig.base.json packages pnpm-lock.yaml
git commit -m "chore: monorepo pnpm con paquetes geometria y lecciones"
```

## Tarea 2: vectores y tipos base del motor

Archivos:

- Crear: `packages/geometria/src/vec.ts`
- Modificar: `packages/geometria/src/index.ts`
- Test: `packages/geometria/test/vec.test.ts`

* [ ] Paso 1: escribir el test que falla

`packages/geometria/test/vec.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  distancia,
  distanciaPuntoRecta,
  escalar,
  normalIzquierda,
  punto,
  puntoMedio,
  unitario,
} from '../src/vec';

describe('vec', () => {
  it('calcula la distancia entre dos puntos', () => {
    expect(distancia(punto(0, 0), punto(3, 4))).toBe(5);
  });

  it('calcula el punto medio', () => {
    expect(puntoMedio(punto(0, 0), punto(4, 2))).toEqual(punto(2, 1));
  });

  it('normaliza un vector', () => {
    expect(unitario(punto(0, 5))).toEqual(punto(0, 1));
  });

  it('rechaza normalizar un vector nulo', () => {
    expect(() => unitario(punto(0, 0))).toThrow('vector nulo');
  });

  it('la normal es perpendicular al vector', () => {
    const v = punto(3, 4);
    expect(escalar(v, normalIzquierda(v))).toBe(0);
  });

  it('mide la distancia de un punto a una recta', () => {
    const recta = { p: punto(-1, 0), q: punto(5, 0) };
    expect(distanciaPuntoRecta(punto(0, 3), recta)).toBe(3);
  });

  it('rechaza una recta definida por dos puntos iguales', () => {
    const recta = { p: punto(1, 1), q: punto(1, 1) };
    expect(() => distanciaPuntoRecta(punto(0, 0), recta)).toThrow('dos puntos iguales');
  });
});
```

- [ ] Paso 2: ejecutar el test y comprobar que falla

Ejecuta: `pnpm --filter @traze/geometria test`

Esperado: FALLA con un error de importación porque `../src/vec` no existe.

- [ ] Paso 3: escribir la implementación mínima

`packages/geometria/src/vec.ts`:

```ts
export interface Punto {
  x: number;
  y: number;
}

export interface Recta {
  p: Punto;
  q: Punto;
}

export interface Circunferencia {
  centro: Punto;
  radio: number;
}

export const EPS = 1e-9;

export const punto = (x: number, y: number): Punto => ({ x, y });
export const suma = (a: Punto, b: Punto): Punto => punto(a.x + b.x, a.y + b.y);
export const resta = (a: Punto, b: Punto): Punto => punto(a.x - b.x, a.y - b.y);
export const escala = (a: Punto, k: number): Punto => punto(a.x * k, a.y * k);
export const escalar = (a: Punto, b: Punto): number => a.x * b.x + a.y * b.y;
export const cruz = (a: Punto, b: Punto): number => a.x * b.y - a.y * b.x;
export const longitud = (a: Punto): number => Math.hypot(a.x, a.y);
export const distancia = (a: Punto, b: Punto): number => Math.hypot(a.x - b.x, a.y - b.y);
export const puntoMedio = (a: Punto, b: Punto): Punto => punto((a.x + b.x) / 2, (a.y + b.y) / 2);

export function unitario(v: Punto): Punto {
  const n = longitud(v);
  if (n < EPS) throw new Error('No se puede normalizar un vector nulo');
  return punto(v.x / n, v.y / n);
}

export const normalIzquierda = (v: Punto): Punto => punto(v.y, -v.x);

export function distanciaPuntoRecta(p: Punto, recta: Recta): number {
  const d = resta(recta.q, recta.p);
  const n = longitud(d);
  if (n < EPS) throw new Error('La recta está definida por dos puntos iguales');
  return Math.abs(cruz(d, resta(p, recta.p))) / n;
}
```

`packages/geometria/src/index.ts`:

```ts
export * from './vec';
```

- [ ] Paso 4: ejecutar el test y comprobar que pasa

Ejecuta: `pnpm --filter @traze/geometria test`

Esperado: `7 passed`.

- [ ] Paso 5: confirmar

```bash
git add packages/geometria
git commit -m "feat(geometria): vectores, tipos base y distancia a recta"
```

## Tarea 3: intersecciones

Archivos:

- Crear: `packages/geometria/src/interseccion.ts`
- Modificar: `packages/geometria/src/index.ts`
- Test: `packages/geometria/test/interseccion.test.ts`

Los casos sin solución (paralelas, circunferencias que no se cortan) devuelven `null` o una lista vacía: son un resultado válido, no un error.

- [ ] Paso 1: escribir el test que falla

`packages/geometria/test/interseccion.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  interseccionCircunferencias,
  interseccionRectaCircunferencia,
  interseccionRectas,
} from '../src/interseccion';
import { punto } from '../src/vec';

describe('interseccionCircunferencias', () => {
  it('devuelve los dos cortes, el primero a la izquierda de la dirección A→B', () => {
    const cortes = interseccionCircunferencias(
      { centro: punto(0, 0), radio: Math.SQRT2 },
      { centro: punto(2, 0), radio: Math.SQRT2 },
    );
    expect(cortes).not.toBeNull();
    const [primero, segundo] = cortes!;
    expect(primero.x).toBeCloseTo(1, 9);
    expect(primero.y).toBeCloseTo(-1, 9);
    expect(segundo.x).toBeCloseTo(1, 9);
    expect(segundo.y).toBeCloseTo(1, 9);
  });

  it('devuelve el mismo punto dos veces si son tangentes', () => {
    const cortes = interseccionCircunferencias(
      { centro: punto(0, 0), radio: 1 },
      { centro: punto(2, 0), radio: 1 },
    );
    expect(cortes).not.toBeNull();
    expect(cortes![0].x).toBeCloseTo(1, 9);
    expect(cortes![0].y).toBeCloseTo(0, 9);
    expect(cortes![1].x).toBeCloseTo(1, 9);
    expect(cortes![1].y).toBeCloseTo(0, 9);
  });

  it('devuelve null si están demasiado lejos', () => {
    expect(
      interseccionCircunferencias(
        { centro: punto(0, 0), radio: 1 },
        { centro: punto(10, 0), radio: 1 },
      ),
    ).toBeNull();
  });

  it('devuelve null si son concéntricas', () => {
    expect(
      interseccionCircunferencias(
        { centro: punto(0, 0), radio: 1 },
        { centro: punto(0, 0), radio: 2 },
      ),
    ).toBeNull();
  });

  it('devuelve null si una está dentro de la otra', () => {
    expect(
      interseccionCircunferencias(
        { centro: punto(0, 0), radio: 5 },
        { centro: punto(1, 0), radio: 1 },
      ),
    ).toBeNull();
  });
});

describe('interseccionRectaCircunferencia', () => {
  const circunferencia = { centro: punto(0, 0), radio: 1 };

  it('devuelve dos puntos si la recta es secante', () => {
    const cortes = interseccionRectaCircunferencia({ p: punto(-2, 0), q: punto(2, 0) }, circunferencia);
    expect(cortes).toHaveLength(2);
    expect(cortes[0].x).toBeCloseTo(-1, 9);
    expect(cortes[1].x).toBeCloseTo(1, 9);
  });

  it('devuelve un punto si la recta es tangente', () => {
    const cortes = interseccionRectaCircunferencia({ p: punto(-2, 1), q: punto(2, 1) }, circunferencia);
    expect(cortes).toHaveLength(1);
    expect(cortes[0].x).toBeCloseTo(0, 9);
    expect(cortes[0].y).toBeCloseTo(1, 9);
  });

  it('devuelve una lista vacía si no se cortan', () => {
    expect(interseccionRectaCircunferencia({ p: punto(-2, 2), q: punto(2, 2) }, circunferencia)).toEqual([]);
  });
});

describe('interseccionRectas', () => {
  it('devuelve el punto de corte', () => {
    const corte = interseccionRectas(
      { p: punto(0, 0), q: punto(1, 1) },
      { p: punto(0, 2), q: punto(2, 0) },
    );
    expect(corte).not.toBeNull();
    expect(corte!.x).toBeCloseTo(1, 9);
    expect(corte!.y).toBeCloseTo(1, 9);
  });

  it('devuelve null si son paralelas', () => {
    expect(
      interseccionRectas({ p: punto(0, 0), q: punto(1, 0) }, { p: punto(0, 1), q: punto(1, 1) }),
    ).toBeNull();
  });
});
```

- [ ] Paso 2: ejecutar el test y comprobar que falla

Ejecuta: `pnpm --filter @traze/geometria test`

Esperado: FALLA porque `../src/interseccion` no existe.

- [ ] Paso 3: escribir la implementación

`packages/geometria/src/interseccion.ts`:

```ts
import { EPS, distancia, punto, type Circunferencia, type Punto, type Recta } from './vec';

export function interseccionCircunferencias(
  a: Circunferencia,
  b: Circunferencia,
): [Punto, Punto] | null {
  const d = distancia(a.centro, b.centro);
  if (d < EPS) return null;
  if (d > a.radio + b.radio + EPS) return null;
  if (d < Math.abs(a.radio - b.radio) - EPS) return null;

  const x = (d * d + a.radio * a.radio - b.radio * b.radio) / (2 * d);
  const h = Math.sqrt(Math.max(0, a.radio * a.radio - x * x));
  const ux = (b.centro.x - a.centro.x) / d;
  const uy = (b.centro.y - a.centro.y) / d;
  const base = punto(a.centro.x + ux * x, a.centro.y + uy * x);

  return [
    punto(base.x + uy * h, base.y - ux * h),
    punto(base.x - uy * h, base.y + ux * h),
  ];
}

export function interseccionRectaCircunferencia(recta: Recta, c: Circunferencia): Punto[] {
  const dx = recta.q.x - recta.p.x;
  const dy = recta.q.y - recta.p.y;
  const fx = recta.p.x - c.centro.x;
  const fy = recta.p.y - c.centro.y;

  const a = dx * dx + dy * dy;
  if (a < EPS) return [];
  const b = 2 * (fx * dx + fy * dy);
  const cc = fx * fx + fy * fy - c.radio * c.radio;
  const discriminante = b * b - 4 * a * cc;

  if (discriminante < -EPS) return [];
  if (discriminante <= EPS) {
    const t = -b / (2 * a);
    return [punto(recta.p.x + t * dx, recta.p.y + t * dy)];
  }

  const raiz = Math.sqrt(discriminante);
  const t1 = (-b - raiz) / (2 * a);
  const t2 = (-b + raiz) / (2 * a);
  return [
    punto(recta.p.x + t1 * dx, recta.p.y + t1 * dy),
    punto(recta.p.x + t2 * dx, recta.p.y + t2 * dy),
  ];
}

export function interseccionRectas(r1: Recta, r2: Recta): Punto | null {
  const d1x = r1.q.x - r1.p.x;
  const d1y = r1.q.y - r1.p.y;
  const d2x = r2.q.x - r2.p.x;
  const d2y = r2.q.y - r2.p.y;
  const denominador = d1x * d2y - d1y * d2x;
  if (Math.abs(denominador) < EPS) return null;

  const t = ((r2.p.x - r1.p.x) * d2y - (r2.p.y - r1.p.y) * d2x) / denominador;
  return punto(r1.p.x + t * d1x, r1.p.y + t * d1y);
}
```

`packages/geometria/src/index.ts`:

```ts
export * from './vec';
export * from './interseccion';
```

- [ ] Paso 4: ejecutar el test y comprobar que pasa

Ejecuta: `pnpm --filter @traze/geometria test`

Esperado: `17 passed` (7 de `vec` y 10 de `interseccion`).

- [ ] Paso 5: confirmar

```bash
git add packages/geometria
git commit -m "feat(geometria): intersecciones de rectas y circunferencias"
```

## Tarea 4: mediatriz

Archivos:

- Crear: `packages/geometria/src/construcciones.ts`
- Modificar: `packages/geometria/src/index.ts`
- Test: `packages/geometria/test/construcciones.test.ts`

La mediatriz se construye como en papel: dos arcos del mismo radio desde A y desde B, y la recta por sus cortes M y N. El test de propiedades usa un generador pseudoaleatorio con semilla fija para que nunca sea inestable.

- [ ] Paso 1: escribir el test que falla

`packages/geometria/test/construcciones.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mediatriz } from '../src/construcciones';
import { distancia, distanciaPuntoRecta, escalar, punto, resta, unitario } from '../src/vec';

function generador(semilla: number) {
  let estado = semilla >>> 0;
  return () => {
    estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0;
    return estado / 4294967296;
  };
}

describe('mediatriz', () => {
  it('construye M y N en una configuración conocida', () => {
    const resultado = mediatriz(punto(0, 0), punto(2, 0), Math.SQRT1_2);
    expect(resultado).not.toBeNull();
    expect(resultado!.m.x).toBeCloseTo(1, 9);
    expect(resultado!.m.y).toBeCloseTo(-1, 9);
    expect(resultado!.n.x).toBeCloseTo(1, 9);
    expect(resultado!.n.y).toBeCloseTo(1, 9);
    expect(resultado!.medio).toEqual(punto(1, 0));
  });

  it('M y N equidistan de A y B y la recta MN es perpendicular por el punto medio', () => {
    const azar = generador(42);
    for (let i = 0; i < 100; i++) {
      const a = punto(azar() * 200, azar() * 200);
      const b = punto(azar() * 200, azar() * 200);
      if (distancia(a, b) < 5) continue;
      const factor = 0.55 + azar() * 0.45;

      const resultado = mediatriz(a, b, factor);
      expect(resultado).not.toBeNull();
      const { m, n, radio, recta, medio } = resultado!;

      expect(Math.abs(distancia(m, a) - radio)).toBeLessThan(1e-6);
      expect(Math.abs(distancia(m, b) - radio)).toBeLessThan(1e-6);
      expect(Math.abs(distancia(n, a) - radio)).toBeLessThan(1e-6);
      expect(Math.abs(distancia(n, b) - radio)).toBeLessThan(1e-6);
      expect(Math.abs(escalar(unitario(resta(n, m)), unitario(resta(b, a))))).toBeLessThan(1e-6);
      expect(distanciaPuntoRecta(medio, recta)).toBeLessThan(1e-6);
    }
  });

  it('devuelve null si el radio es menor que la mitad del segmento', () => {
    expect(mediatriz(punto(0, 0), punto(10, 0), 0.4)).toBeNull();
  });

  it('devuelve null si el radio es exactamente la mitad (los arcos solo se tocan)', () => {
    expect(mediatriz(punto(0, 0), punto(10, 0), 0.5)).toBeNull();
  });

  it('devuelve null si A y B coinciden', () => {
    expect(mediatriz(punto(3, 3), punto(3, 3), 0.75)).toBeNull();
  });
});
```

- [ ] Paso 2: ejecutar el test y comprobar que falla

Ejecuta: `pnpm --filter @traze/geometria test`

Esperado: FALLA porque `../src/construcciones` no existe.

- [ ] Paso 3: escribir la implementación

`packages/geometria/src/construcciones.ts`:

```ts
import { interseccionCircunferencias } from './interseccion';
import { EPS, distancia, puntoMedio, type Punto, type Recta } from './vec';

export interface Mediatriz {
  m: Punto;
  n: Punto;
  radio: number;
  recta: Recta;
  medio: Punto;
}

export function mediatriz(a: Punto, b: Punto, factorRadio = 0.75): Mediatriz | null {
  const d = distancia(a, b);
  if (d < EPS) return null;

  const radio = factorRadio * d;
  const cortes = interseccionCircunferencias({ centro: a, radio }, { centro: b, radio });
  if (!cortes) return null;

  const [m, n] = cortes;
  if (distancia(m, n) < EPS) return null;

  return { m, n, radio, recta: { p: m, q: n }, medio: puntoMedio(a, b) };
}
```

`packages/geometria/src/index.ts`:

```ts
export * from './vec';
export * from './interseccion';
export * from './construcciones';
```

- [ ] Paso 4: ejecutar el test y comprobar que pasa

Ejecuta: `pnpm --filter @traze/geometria test`

Esperado: `22 passed`.

- [ ] Paso 5: comprobar tipos y confirmar

```bash
pnpm --filter @traze/geometria typecheck
git add packages/geometria
git commit -m "feat(geometria): mediatriz con tests de propiedades"
```

## Tarea 5: esquema de lección, validador y lección piloto

Archivos:

- Crear: `contenido/bloque-1-trazados/mediatriz-segmento.json`
- Crear: `packages/lecciones/src/esquema.ts`, `packages/lecciones/src/validar.ts`
- Modificar: `packages/lecciones/src/index.ts`
- Test: `packages/lecciones/test/validar.test.ts`

Una lección declara datos, radios y puntos derivados. Los pasos solo hacen referencia a esos nombres: ninguna coordenada de resultado se escribe a mano. El esquema comprueba que cada nombre usado esté definido y dice en qué paso y campo falla.

- [ ] Paso 1: crear la lección piloto

`contenido/bloque-1-trazados/mediatriz-segmento.json`:

```json
{
  "id": "mediatriz-segmento",
  "bloque": 1,
  "titulo": "Mediatriz de un segmento",
  "enunciado": "Dado el segmento AB, traza su mediatriz con regla y compás.",
  "ideaClave": "La mediatriz es el lugar geométrico de los puntos que equidistan de A y de B.",
  "requisitos": [],
  "datos": { "A": [60, 70], "B": [140, 60] },
  "radios": { "r": { "entre": ["A", "B"], "factor": 0.75 } },
  "derivados": [
    { "tipo": "interseccionArcos", "ids": ["M", "N"], "centros": ["A", "B"], "radio": "r" },
    { "tipo": "puntoMedio", "id": "O", "entre": ["A", "B"] }
  ],
  "pasos": [
    {
      "titulo": "Los datos",
      "texto": "Tenemos el segmento AB. Hay que trazar su mediatriz con regla y compás.",
      "porque": "La mediatriz es la recta perpendicular a AB que pasa por su punto medio.",
      "consejo": "Marca A y B con un punto fino y rotúlalos en mayúscula.",
      "dibujo": [
        { "tipo": "segmento", "desde": "A", "hasta": "B", "estilo": "dato" },
        { "tipo": "punto", "id": "A" },
        { "tipo": "punto", "id": "B" }
      ]
    },
    {
      "titulo": "Arcos con centro en A",
      "texto": "Pincha el compás en A y ábrelo más de la mitad de AB. Traza un arco a cada lado del segmento.",
      "porque": "Todos los puntos de un arco están a la misma distancia de su centro: el radio.",
      "consejo": "Gira el compás desde la cabeza, con una sola mano y sin apretar el lápiz.",
      "dibujo": [
        { "tipo": "arco", "centro": "A", "radio": "r", "hacia": "M" },
        { "tipo": "arco", "centro": "A", "radio": "r", "hacia": "N" }
      ]
    },
    {
      "titulo": "Arcos con centro en B",
      "texto": "Sin cambiar la abertura, pincha en B y traza otros dos arcos que corten a los primeros.",
      "porque": "Con el mismo radio desde A y desde B, los cortes están a igual distancia de los dos extremos.",
      "consejo": "Comprueba que la abertura no se ha movido antes de pinchar en B.",
      "dibujo": [
        { "tipo": "arco", "centro": "B", "radio": "r", "hacia": "M" },
        { "tipo": "arco", "centro": "B", "radio": "r", "hacia": "N" }
      ]
    },
    {
      "titulo": "Marca los cortes M y N",
      "texto": "Los arcos se cortan en dos puntos. Llámalos M y N.",
      "porque": "M y N equidistan de A y de B, así que los dos pertenecen a la mediatriz.",
      "consejo": "Cuanto más abierto es el ángulo con que se cortan los arcos, más preciso sale el punto.",
      "dibujo": [
        { "tipo": "punto", "id": "M", "estilo": "construccion" },
        { "tipo": "punto", "id": "N", "estilo": "construccion" }
      ]
    },
    {
      "titulo": "Une M con N",
      "texto": "Apoya la regla en M y N y traza la recta que pasa por ambos.",
      "porque": "Dos puntos determinan una recta. Esa recta es la mediatriz.",
      "consejo": "Dibuja el resultado en trazo grueso y la construcción en trazo fino.",
      "dibujo": [
        { "tipo": "recta", "por": ["M", "N"], "extension": 8, "estilo": "resultado" }
      ]
    },
    {
      "titulo": "Comprueba el resultado",
      "texto": "La mediatriz corta a AB en su punto medio O y forma 90° con el segmento: AO = OB.",
      "porque": "Por eso la mediatriz sirve también para dividir un segmento en dos partes iguales.",
      "consejo": "Si dudas, mide AO y OB con la regla: deben coincidir.",
      "dibujo": [
        { "tipo": "punto", "id": "O", "estilo": "resultado" },
        { "tipo": "marcaAnguloRecto", "vertice": "O", "hacia1": "B", "hacia2": "M" },
        { "tipo": "marcaIgualdad", "segmento": ["A", "O"] },
        { "tipo": "marcaIgualdad", "segmento": ["O", "B"] }
      ]
    }
  ],
  "errores": [
    "Abrir el compás menos de la mitad de AB: los arcos no se cortan.",
    "Cambiar la abertura al pasar de A a B: M y N dejan de estar en la mediatriz."
  ],
  "comprobaciones": [
    { "tipo": "equidistante", "punto": "M", "a": "A", "b": "B" },
    { "tipo": "equidistante", "punto": "N", "a": "A", "b": "B" },
    { "tipo": "perpendicular", "recta": ["M", "N"], "segmento": ["A", "B"] },
    { "tipo": "pasaPorPuntoMedio", "recta": ["M", "N"], "segmento": ["A", "B"] }
  ]
}
```

- [ ] Paso 2: escribir el test que falla

`packages/lecciones/test/validar.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import { validarLeccion } from '../src/validar';

function copia(): any {
  return structuredClone(piloto);
}

function errores(datos: unknown): string[] {
  const resultado = validarLeccion(datos);
  return resultado.ok ? [] : resultado.errores;
}

describe('validarLeccion', () => {
  it('acepta la lección piloto y aplica los valores por defecto', () => {
    const resultado = validarLeccion(piloto);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.leccion.pasos).toHaveLength(6);
    expect(resultado.leccion.lienzo).toEqual({ ancho: 210, alto: 140 });
    const arco = resultado.leccion.pasos[1].dibujo[0];
    expect(arco.tipo === 'arco' && arco.amplitud).toBe(0.32);
  });

  it('rechaza un id de lección con mayúsculas', () => {
    const datos = copia();
    datos.id = 'Mediatriz';
    expect(errores(datos)).toContain('id: el id de lección va en minúsculas y con guiones');
  });

  it('señala un punto no definido con su paso y su campo', () => {
    const datos = copia();
    datos.pasos[0].dibujo[0] = { tipo: 'segmento', desde: 'A', hasta: 'Z' };
    expect(errores(datos)).toContain('pasos.0.dibujo.0.hasta: El punto «Z» no está definido');
  });

  it('señala un radio no definido en un arco', () => {
    const datos = copia();
    datos.pasos[1].dibujo[0].radio = 'q';
    expect(errores(datos)).toContain('pasos.1.dibujo.0.radio: El radio «q» no está definido');
  });

  it('rechaza más de 10 pasos', () => {
    const datos = copia();
    datos.pasos = Array.from({ length: 11 }, () => datos.pasos[0]);
    expect(errores(datos).some((e) => e.startsWith('pasos:'))).toBe(true);
  });

  it('rechaza una lección sin comprobaciones', () => {
    const datos = copia();
    datos.comprobaciones = [];
    expect(errores(datos).some((e) => e.startsWith('comprobaciones:'))).toBe(true);
  });
});
```

- [ ] Paso 3: ejecutar el test y comprobar que falla

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: FALLA porque `../src/validar` no existe.

- [ ] Paso 4: escribir el esquema

`packages/lecciones/src/esquema.ts`:

```ts
import { z } from 'zod';

const id = z
  .string()
  .regex(/^[A-Za-z][A-Za-z0-9']*$/, 'identificador no válido (letras, cifras y apóstrofo)');
const parDeIds = z.tuple([id, id]);
const estilo = z.enum(['dato', 'construccion', 'resultado']);

export const primitivaSchema = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal('punto'),
    id,
    etiqueta: z.string().optional(),
    estilo: estilo.default('dato'),
  }),
  z.object({
    tipo: z.literal('segmento'),
    desde: id,
    hasta: id,
    estilo: estilo.default('dato'),
  }),
  z.object({
    tipo: z.literal('recta'),
    por: parDeIds,
    extension: z.number().min(0).default(0),
    estilo: estilo.default('resultado'),
  }),
  z.object({
    tipo: z.literal('arco'),
    centro: id,
    radio: id,
    hacia: id,
    amplitud: z.number().positive().max(Math.PI).default(0.32),
    estilo: estilo.default('construccion'),
  }),
  z.object({ tipo: z.literal('marcaAnguloRecto'), vertice: id, hacia1: id, hacia2: id }),
  z.object({ tipo: z.literal('marcaIgualdad'), segmento: parDeIds }),
]);

export const pasoSchema = z.object({
  titulo: z.string().min(1),
  texto: z.string().min(1),
  porque: z.string().min(1),
  consejo: z.string().optional(),
  dibujo: z.array(primitivaSchema).min(1),
});

const derivadoSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('puntoMedio'), id, entre: parDeIds }),
  z.object({ tipo: z.literal('interseccionArcos'), ids: parDeIds, centros: parDeIds, radio: id }),
]);

const comprobacionSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('equidistante'), punto: id, a: id, b: id }),
  z.object({ tipo: z.literal('perpendicular'), recta: parDeIds, segmento: parDeIds }),
  z.object({ tipo: z.literal('pasaPorPuntoMedio'), recta: parDeIds, segmento: parDeIds }),
]);

export type Primitiva = z.infer<typeof primitivaSchema>;
export type TipoPrimitiva = Primitiva['tipo'];
export type Estilo = z.infer<typeof estilo>;
export type Paso = z.infer<typeof pasoSchema>;
type Comprobacion = z.infer<typeof comprobacionSchema>;
type Ruta = (string | number)[];
type Referencia = { ruta: Ruta; nombre: string };

function referenciasDePrimitiva(p: Primitiva): Referencia[] {
  switch (p.tipo) {
    case 'punto':
      return [{ ruta: ['id'], nombre: p.id }];
    case 'segmento':
      return [
        { ruta: ['desde'], nombre: p.desde },
        { ruta: ['hasta'], nombre: p.hasta },
      ];
    case 'recta':
      return [
        { ruta: ['por', 0], nombre: p.por[0] },
        { ruta: ['por', 1], nombre: p.por[1] },
      ];
    case 'arco':
      return [
        { ruta: ['centro'], nombre: p.centro },
        { ruta: ['hacia'], nombre: p.hacia },
      ];
    case 'marcaAnguloRecto':
      return [
        { ruta: ['vertice'], nombre: p.vertice },
        { ruta: ['hacia1'], nombre: p.hacia1 },
        { ruta: ['hacia2'], nombre: p.hacia2 },
      ];
    case 'marcaIgualdad':
      return [
        { ruta: ['segmento', 0], nombre: p.segmento[0] },
        { ruta: ['segmento', 1], nombre: p.segmento[1] },
      ];
  }
}

function referenciasDeComprobacion(c: Comprobacion): Referencia[] {
  switch (c.tipo) {
    case 'equidistante':
      return [
        { ruta: ['punto'], nombre: c.punto },
        { ruta: ['a'], nombre: c.a },
        { ruta: ['b'], nombre: c.b },
      ];
    case 'perpendicular':
    case 'pasaPorPuntoMedio':
      return [
        { ruta: ['recta', 0], nombre: c.recta[0] },
        { ruta: ['recta', 1], nombre: c.recta[1] },
        { ruta: ['segmento', 0], nombre: c.segmento[0] },
        { ruta: ['segmento', 1], nombre: c.segmento[1] },
      ];
  }
}

export const leccionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'el id de lección va en minúsculas y con guiones'),
    bloque: z.number().int().min(0).max(9),
    titulo: z.string().min(1),
    enunciado: z.string().min(1),
    ideaClave: z.string().min(1),
    requisitos: z.array(z.string()).default([]),
    lienzo: z
      .object({ ancho: z.number().positive(), alto: z.number().positive() })
      .default({ ancho: 210, alto: 140 }),
    datos: z.record(id, z.tuple([z.number(), z.number()])),
    radios: z.record(id, z.object({ entre: parDeIds, factor: z.number().positive() })).default({}),
    derivados: z.array(derivadoSchema).default([]),
    pasos: z.array(pasoSchema).min(1).max(10),
    errores: z.array(z.string()).default([]),
    comprobaciones: z.array(comprobacionSchema).min(1),
  })
  .superRefine((leccion, ctx) => {
    const falta = (ruta: Ruta, tipo: string, nombre: string, conocidos: ReadonlySet<string>) => {
      if (!conocidos.has(nombre)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ruta,
          message: `${tipo} «${nombre}» no está definido`,
        });
      }
    };

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

    leccion.pasos.forEach((paso, i) => {
      paso.dibujo.forEach((primitiva, j) => {
        for (const ref of referenciasDePrimitiva(primitiva)) {
          falta(['pasos', i, 'dibujo', j, ...ref.ruta], 'El punto', ref.nombre, definidos);
        }
        if (primitiva.tipo === 'arco') {
          falta(['pasos', i, 'dibujo', j, 'radio'], 'El radio', primitiva.radio, radios);
        }
      });
    });

    leccion.comprobaciones.forEach((comprobacion, i) => {
      for (const ref of referenciasDeComprobacion(comprobacion)) {
        falta(['comprobaciones', i, ...ref.ruta], 'El punto', ref.nombre, definidos);
      }
    });
  });

export type Leccion = z.infer<typeof leccionSchema>;
```

`packages/lecciones/src/validar.ts`:

```ts
import type { ZodIssue } from 'zod';
import { leccionSchema, type Leccion } from './esquema';

export type ResultadoValidacion =
  | { ok: true; leccion: Leccion }
  | { ok: false; errores: string[] };

export function formatearIssue(issue: ZodIssue): string {
  const ruta = issue.path.length > 0 ? issue.path.join('.') : '(raíz)';
  return `${ruta}: ${issue.message}`;
}

export function validarLeccion(datos: unknown): ResultadoValidacion {
  const resultado = leccionSchema.safeParse(datos);
  if (resultado.success) return { ok: true, leccion: resultado.data };
  return { ok: false, errores: resultado.error.issues.map(formatearIssue) };
}
```

`packages/lecciones/src/index.ts`:

```ts
export * from './esquema';
export * from './validar';
```

- [ ] Paso 5: ejecutar el test y comprobar que pasa

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `6 passed`.

- [ ] Paso 6: comprobar tipos y confirmar

```bash
pnpm --filter @traze/lecciones typecheck
git add contenido packages/lecciones
git commit -m "feat(lecciones): esquema, validador y leccion piloto de la mediatriz"
```

## Tarea 6: intérprete de lecciones, comprobaciones y comando de validación

Archivos:

- Crear: `packages/lecciones/src/interpretar.ts`, `packages/lecciones/src/procesar.ts`, `packages/lecciones/src/validar-cli.ts`
- Modificar: `packages/lecciones/package.json`, `packages/lecciones/src/index.ts`
- Test: `packages/lecciones/test/interpretar.test.ts`

El intérprete es la única pieza que convierte nombres en coordenadas: recibe una `Leccion` ya validada y devuelve primitivas con números (milímetros de papel) que el reproductor solo tiene que pintar. Acepta un segundo argumento opcional, `factores`, que sustituye el factor de un radio (lo usará el deslizador de la Tarea 9). Todo lo que no se pueda construir lanza `ConstruccionImposible`. `procesarLeccion` encadena validar, interpretar y comprobar, y lo usan tanto el comando como la web, así la regla «un trazado incorrecto no se publica» vive en un solo sitio.

El navegador necesita llamar a `interpretarLeccion` sin arrastrar Zod, por eso el paso 1 añade una exportación propia `@traze/lecciones/interpretar`.

- [ ] Paso 1: exponer el intérprete como subruta del paquete

`packages/lecciones/package.json`:

```json
{
  "name": "@traze/lecciones",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./interpretar": "./src/interpretar.ts"
  },
  "scripts": {
    "test": "vitest run --passWithNoTests",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "validar": "tsx src/validar-cli.ts"
  },
  "dependencies": {
    "@traze/geometria": "workspace:*",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] Paso 2: escribir el test que falla

`packages/lecciones/test/interpretar.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { distancia } from '@traze/geometria';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import type { Leccion } from '../src/esquema';
import {
  ConstruccionImposible,
  ejecutarComprobaciones,
  interpretarLeccion,
} from '../src/interpretar';
import { procesarLeccion } from '../src/procesar';
import { validarLeccion } from '../src/validar';

function copia(): any {
  return structuredClone(piloto);
}

function cargar(datos: unknown): Leccion {
  const resultado = validarLeccion(datos);
  if (!resultado.ok) throw new Error(resultado.errores.join('\n'));
  return resultado.leccion;
}

describe('interpretarLeccion', () => {
  it('calcula los puntos derivados M, N y O', () => {
    const { puntos } = interpretarLeccion(cargar(piloto));
    expect(puntos.O.x).toBeCloseTo(100, 9);
    expect(puntos.O.y).toBeCloseTo(65, 9);

    const radio = 0.75 * distancia(puntos.A, puntos.B);
    for (const nombre of ['M', 'N']) {
      expect(distancia(puntos[nombre], puntos.A)).toBeCloseTo(radio, 9);
      expect(distancia(puntos[nombre], puntos.B)).toBeCloseTo(radio, 9);
    }
  });

  it('resuelve el arco centrado en la dirección de su punto de destino', () => {
    const resuelta = interpretarLeccion(cargar(piloto));
    const arco = resuelta.pasos[1].dibujo[0];
    if (arco.tipo !== 'arco') throw new Error('se esperaba un arco');

    expect(arco.fin - arco.inicio).toBeCloseTo(0.64, 9);
    const medio = (arco.inicio + arco.fin) / 2;
    expect(arco.cx + arco.radio * Math.cos(medio)).toBeCloseTo(resuelta.puntos.M.x, 6);
    expect(arco.cy + arco.radio * Math.sin(medio)).toBeCloseTo(resuelta.puntos.M.y, 6);
  });

  it('prolonga la recta por la extensión indicada en cada extremo', () => {
    const resuelta = interpretarLeccion(cargar(piloto));
    const recta = resuelta.pasos[4].dibujo[0];
    if (recta.tipo !== 'recta') throw new Error('se esperaba una recta');

    const largo = Math.hypot(recta.x2 - recta.x1, recta.y2 - recta.y1);
    const { M, N } = resuelta.puntos;
    expect(largo).toBeCloseTo(distancia(M, N) + 16, 6);
  });

  it('conserva etiquetas y estilos, con sus valores por defecto', () => {
    const resuelta = interpretarLeccion(cargar(piloto));
    const [segmento, puntoA] = resuelta.pasos[0].dibujo;
    expect(segmento).toMatchObject({ tipo: 'segmento', estilo: 'dato' });
    expect(puntoA).toMatchObject({ tipo: 'punto', id: 'A', etiqueta: 'A', x: 60, y: 70 });
  });

  it('normaliza las direcciones de la marca de ángulo recto', () => {
    const resuelta = interpretarLeccion(cargar(piloto));
    const marca = resuelta.pasos[5].dibujo[1];
    if (marca.tipo !== 'marcaAnguloRecto') throw new Error('se esperaba una marca de ángulo recto');

    expect(marca.x).toBeCloseTo(100, 9);
    expect(Math.hypot(marca.ux1, marca.uy1)).toBeCloseTo(1, 9);
    expect(Math.hypot(marca.ux2, marca.uy2)).toBeCloseTo(1, 9);
    expect(marca.ux1 * marca.ux2 + marca.uy1 * marca.uy2).toBeCloseTo(0, 9);
  });

  it('aplica un factor de radio distinto al de la lección', () => {
    const resuelta = interpretarLeccion(cargar(piloto), { r: 0.6 });
    const arco = resuelta.pasos[1].dibujo[0];
    if (arco.tipo !== 'arco') throw new Error('se esperaba un arco');

    expect(arco.radio).toBeCloseTo(0.6 * distancia(resuelta.puntos.A, resuelta.puntos.B), 9);
    expect(distancia(resuelta.puntos.M, resuelta.puntos.A)).toBeCloseTo(arco.radio, 9);
  });

  it('lanza ConstruccionImposible si los arcos no se cortan', () => {
    const leccion = cargar(piloto);
    expect(() => interpretarLeccion(leccion, { r: 0.4 })).toThrow(ConstruccionImposible);
    expect(() => interpretarLeccion(leccion, { r: 0.4 })).toThrow('no se cortan');
  });

  it('lanza ConstruccionImposible si un arco no pasa por su punto de destino', () => {
    const datos = copia();
    datos.pasos[1].dibujo[0].hacia = 'B';
    expect(() => interpretarLeccion(cargar(datos))).toThrow(ConstruccionImposible);
    expect(() => interpretarLeccion(cargar(datos))).toThrow('no pasa por');
  });
});

describe('ejecutarComprobaciones', () => {
  it('cumple las cuatro comprobaciones de la lección piloto', () => {
    const leccion = cargar(piloto);
    const { puntos } = interpretarLeccion(leccion);
    const resultados = ejecutarComprobaciones(leccion, puntos);

    expect(resultados.map((r) => r.descripcion)).toEqual([
      'M equidista de A y B',
      'N equidista de A y B',
      'MN ⟂ AB',
      'MN pasa por el punto medio de AB',
    ]);
    expect(resultados.every((r) => r.ok)).toBe(true);
  });

  it('detecta una comprobación que no se cumple', () => {
    const datos = copia();
    datos.comprobaciones = [{ tipo: 'equidistante', punto: 'A', a: 'A', b: 'B' }];
    const leccion = cargar(datos);
    const { puntos } = interpretarLeccion(leccion);

    const [resultado] = ejecutarComprobaciones(leccion, puntos);
    expect(resultado.ok).toBe(false);
  });

  it('no da por buena una recta definida por dos puntos iguales', () => {
    const datos = copia();
    datos.comprobaciones = [{ tipo: 'perpendicular', recta: ['A', 'A'], segmento: ['A', 'B'] }];
    const leccion = cargar(datos);
    const { puntos } = interpretarLeccion(leccion);

    const [resultado] = ejecutarComprobaciones(leccion, puntos);
    expect(resultado.ok).toBe(false);
    expect(resultado.detalle).toBe('hay dos puntos coincidentes');
  });
});

describe('procesarLeccion', () => {
  it('procesa la lección piloto', () => {
    const resultado = procesarLeccion(piloto);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.resuelta.pasos).toHaveLength(6);
    expect(resultado.comprobaciones).toHaveLength(4);
  });

  it('convierte una construcción imposible en un error legible', () => {
    const datos = copia();
    datos.radios.r.factor = 0.4;
    const resultado = procesarLeccion(datos);
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.errores[0]).toContain('construcción imposible:');
  });

  it('devuelve los errores de validación sin intentar interpretar', () => {
    const datos = copia();
    datos.id = 'Mediatriz';
    const resultado = procesarLeccion(datos);
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.errores).toContain('id: el id de lección va en minúsculas y con guiones');
  });

  it('rechaza una lección cuya comprobación falla', () => {
    const datos = copia();
    datos.comprobaciones = [{ tipo: 'equidistante', punto: 'A', a: 'A', b: 'B' }];
    const resultado = procesarLeccion(datos);
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.errores[0]).toContain('A equidista de A y B');
  });
});
```

- [ ] Paso 3: ejecutar el test y comprobar que falla

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `interpretar.test.ts` FALLA porque `../src/interpretar` no existe; los 6 tests de `validar` siguen pasando.

- [ ] Paso 4: escribir el intérprete

`packages/lecciones/src/interpretar.ts`:

```ts
import {
  EPS,
  distancia,
  distanciaPuntoRecta,
  escala,
  escalar,
  interseccionCircunferencias,
  punto,
  puntoMedio,
  resta,
  suma,
  unitario,
  type Punto,
} from '@traze/geometria';
import type { Estilo, Leccion, Primitiva } from './esquema';

export const TOLERANCIA = 1e-6;

export class ConstruccionImposible extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ConstruccionImposible';
  }
}

export type PrimitivaResuelta =
  | { tipo: 'punto'; id: string; etiqueta: string; x: number; y: number; estilo: Estilo }
  | { tipo: 'segmento'; x1: number; y1: number; x2: number; y2: number; estilo: Estilo }
  | { tipo: 'recta'; x1: number; y1: number; x2: number; y2: number; estilo: Estilo }
  | {
      tipo: 'arco';
      cx: number;
      cy: number;
      radio: number;
      inicio: number;
      fin: number;
      estilo: Estilo;
    }
  | {
      tipo: 'marcaAnguloRecto';
      x: number;
      y: number;
      ux1: number;
      uy1: number;
      ux2: number;
      uy2: number;
    }
  | { tipo: 'marcaIgualdad'; x1: number; y1: number; x2: number; y2: number };

export interface PasoResuelto {
  titulo: string;
  texto: string;
  porque: string;
  consejo?: string;
  dibujo: PrimitivaResuelta[];
}

export interface LeccionResuelta {
  id: string;
  titulo: string;
  lienzo: { ancho: number; alto: number };
  puntos: Record<string, Punto>;
  radios: Record<string, number>;
  pasos: PasoResuelto[];
}

export interface ResultadoComprobacion {
  descripcion: string;
  ok: boolean;
  detalle: string;
}

type Puntos = Readonly<Record<string, Punto>>;
type Radios = Readonly<Record<string, number>>;

function obtener(puntos: Puntos, nombre: string): Punto {
  if (!Object.hasOwn(puntos, nombre)) {
    throw new ConstruccionImposible(`El punto «${nombre}» no está construido`);
  }
  return puntos[nombre];
}

function obtenerRadio(radios: Radios, nombre: string): number {
  if (!Object.hasOwn(radios, nombre)) {
    throw new ConstruccionImposible(`El radio «${nombre}» no está definido`);
  }
  return radios[nombre];
}

function direccion(a: Punto, b: Punto): Punto | null {
  return distancia(a, b) < EPS ? null : unitario(resta(b, a));
}

function exigirDireccion(a: Punto, b: Punto, nombreA: string, nombreB: string): Punto {
  const resultado = direccion(a, b);
  if (!resultado) {
    throw new ConstruccionImposible(
      `Los puntos «${nombreA}» y «${nombreB}» coinciden: no definen una dirección`,
    );
  }
  return resultado;
}

function calcularRadios(
  leccion: Leccion,
  puntos: Puntos,
  factores: Readonly<Record<string, number>>,
): Record<string, number> {
  const radios: Record<string, number> = {};
  for (const [id, definicion] of Object.entries(leccion.radios)) {
    const [nombreA, nombreB] = definicion.entre;
    const factor = Object.hasOwn(factores, id) ? factores[id] : definicion.factor;
    const radio = factor * distancia(obtener(puntos, nombreA), obtener(puntos, nombreB));
    if (!(radio > EPS)) {
      throw new ConstruccionImposible(`El radio «${id}» no es positivo`);
    }
    radios[id] = radio;
  }
  return radios;
}

function resolverPrimitiva(
  primitiva: Primitiva,
  puntos: Puntos,
  radios: Radios,
): PrimitivaResuelta {
  switch (primitiva.tipo) {
    case 'punto': {
      const p = obtener(puntos, primitiva.id);
      return {
        tipo: 'punto',
        id: primitiva.id,
        etiqueta: primitiva.etiqueta ?? primitiva.id,
        x: p.x,
        y: p.y,
        estilo: primitiva.estilo,
      };
    }
    case 'segmento': {
      const a = obtener(puntos, primitiva.desde);
      const b = obtener(puntos, primitiva.hasta);
      return { tipo: 'segmento', x1: a.x, y1: a.y, x2: b.x, y2: b.y, estilo: primitiva.estilo };
    }
    case 'recta': {
      const [nombreP, nombreQ] = primitiva.por;
      const p = obtener(puntos, nombreP);
      const q = obtener(puntos, nombreQ);
      const u = exigirDireccion(p, q, nombreP, nombreQ);
      const desde = resta(p, escala(u, primitiva.extension));
      const hasta = suma(q, escala(u, primitiva.extension));
      return {
        tipo: 'recta',
        x1: desde.x,
        y1: desde.y,
        x2: hasta.x,
        y2: hasta.y,
        estilo: primitiva.estilo,
      };
    }
    case 'arco': {
      const centro = obtener(puntos, primitiva.centro);
      const destino = obtener(puntos, primitiva.hacia);
      const radio = obtenerRadio(radios, primitiva.radio);
      if (Math.abs(distancia(centro, destino) - radio) > TOLERANCIA) {
        throw new ConstruccionImposible(
          `El arco con centro «${primitiva.centro}» no pasa por «${primitiva.hacia}»`,
        );
      }
      const angulo = Math.atan2(destino.y - centro.y, destino.x - centro.x);
      return {
        tipo: 'arco',
        cx: centro.x,
        cy: centro.y,
        radio,
        inicio: angulo - primitiva.amplitud,
        fin: angulo + primitiva.amplitud,
        estilo: primitiva.estilo,
      };
    }
    case 'marcaAnguloRecto': {
      const vertice = obtener(puntos, primitiva.vertice);
      const u1 = exigirDireccion(
        vertice,
        obtener(puntos, primitiva.hacia1),
        primitiva.vertice,
        primitiva.hacia1,
      );
      const u2 = exigirDireccion(
        vertice,
        obtener(puntos, primitiva.hacia2),
        primitiva.vertice,
        primitiva.hacia2,
      );
      return {
        tipo: 'marcaAnguloRecto',
        x: vertice.x,
        y: vertice.y,
        ux1: u1.x,
        uy1: u1.y,
        ux2: u2.x,
        uy2: u2.y,
      };
    }
    case 'marcaIgualdad': {
      const a = obtener(puntos, primitiva.segmento[0]);
      const b = obtener(puntos, primitiva.segmento[1]);
      return { tipo: 'marcaIgualdad', x1: a.x, y1: a.y, x2: b.x, y2: b.y };
    }
  }
}

export function interpretarLeccion(
  leccion: Leccion,
  factores: Readonly<Record<string, number>> = {},
): LeccionResuelta {
  const puntos: Record<string, Punto> = {};
  for (const [id, [x, y]] of Object.entries(leccion.datos)) {
    puntos[id] = punto(x, y);
  }

  const radios = calcularRadios(leccion, puntos, factores);

  for (const derivado of leccion.derivados) {
    if (derivado.tipo === 'puntoMedio') {
      const [nombreA, nombreB] = derivado.entre;
      puntos[derivado.id] = puntoMedio(obtener(puntos, nombreA), obtener(puntos, nombreB));
      continue;
    }

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
  }

  const pasos = leccion.pasos.map((paso): PasoResuelto => ({
    titulo: paso.titulo,
    texto: paso.texto,
    porque: paso.porque,
    ...(paso.consejo ? { consejo: paso.consejo } : {}),
    dibujo: paso.dibujo.map((primitiva) => resolverPrimitiva(primitiva, puntos, radios)),
  }));

  return {
    id: leccion.id,
    titulo: leccion.titulo,
    lienzo: { ...leccion.lienzo },
    puntos,
    radios,
    pasos,
  };
}

const formato = (valor: number): string => valor.toExponential(2);

export function ejecutarComprobaciones(
  leccion: Leccion,
  puntos: Puntos,
): ResultadoComprobacion[] {
  return leccion.comprobaciones.map((comprobacion): ResultadoComprobacion => {
    switch (comprobacion.tipo) {
      case 'equidistante': {
        const p = obtener(puntos, comprobacion.punto);
        const a = obtener(puntos, comprobacion.a);
        const b = obtener(puntos, comprobacion.b);
        const diferencia = Math.abs(distancia(p, a) - distancia(p, b));
        return {
          descripcion: `${comprobacion.punto} equidista de ${comprobacion.a} y ${comprobacion.b}`,
          ok: diferencia < TOLERANCIA,
          detalle: `diferencia de distancias ${formato(diferencia)}`,
        };
      }
      case 'perpendicular': {
        const [nombreP, nombreQ] = comprobacion.recta;
        const [nombreA, nombreB] = comprobacion.segmento;
        const descripcion = `${nombreP}${nombreQ} ⟂ ${nombreA}${nombreB}`;
        const dirRecta = direccion(obtener(puntos, nombreP), obtener(puntos, nombreQ));
        const dirSegmento = direccion(obtener(puntos, nombreA), obtener(puntos, nombreB));
        if (!dirRecta || !dirSegmento) {
          return { descripcion, ok: false, detalle: 'hay dos puntos coincidentes' };
        }
        const producto = Math.abs(escalar(dirRecta, dirSegmento));
        return {
          descripcion,
          ok: producto < TOLERANCIA,
          detalle: `producto escalar ${formato(producto)}`,
        };
      }
      case 'pasaPorPuntoMedio': {
        const [nombreP, nombreQ] = comprobacion.recta;
        const [nombreA, nombreB] = comprobacion.segmento;
        const descripcion = `${nombreP}${nombreQ} pasa por el punto medio de ${nombreA}${nombreB}`;
        const p = obtener(puntos, nombreP);
        const q = obtener(puntos, nombreQ);
        if (!direccion(p, q)) {
          return { descripcion, ok: false, detalle: 'hay dos puntos coincidentes' };
        }
        const medio = puntoMedio(obtener(puntos, nombreA), obtener(puntos, nombreB));
        const separacion = distanciaPuntoRecta(medio, { p, q });
        return {
          descripcion,
          ok: separacion < TOLERANCIA,
          detalle: `distancia al punto medio ${formato(separacion)}`,
        };
      }
    }
  });
}
```

`packages/lecciones/src/procesar.ts`:

```ts
import type { Leccion } from './esquema';
import {
  ConstruccionImposible,
  ejecutarComprobaciones,
  interpretarLeccion,
  type LeccionResuelta,
  type ResultadoComprobacion,
} from './interpretar';
import { validarLeccion } from './validar';

export type ResultadoProceso =
  | {
      ok: true;
      leccion: Leccion;
      resuelta: LeccionResuelta;
      comprobaciones: ResultadoComprobacion[];
    }
  | { ok: false; errores: string[] };

export function procesarLeccion(datos: unknown): ResultadoProceso {
  const validada = validarLeccion(datos);
  if (!validada.ok) return { ok: false, errores: validada.errores };

  try {
    const resuelta = interpretarLeccion(validada.leccion);
    const comprobaciones = ejecutarComprobaciones(validada.leccion, resuelta.puntos);
    const fallos = comprobaciones
      .filter((comprobacion) => !comprobacion.ok)
      .map((comprobacion) => `comprobaciones: ${comprobacion.descripcion} (${comprobacion.detalle})`);
    if (fallos.length > 0) return { ok: false, errores: fallos };
    return { ok: true, leccion: validada.leccion, resuelta, comprobaciones };
  } catch (error) {
    if (error instanceof ConstruccionImposible) {
      return { ok: false, errores: [`construcción imposible: ${error.message}`] };
    }
    throw error;
  }
}
```

`packages/lecciones/src/index.ts`:

```ts
export * from './esquema';
export * from './validar';
export * from './interpretar';
export * from './procesar';
```

- [ ] Paso 5: ejecutar el test y comprobar que pasa

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `21 passed` (6 de `validar` y 15 de `interpretar`).

- [ ] Paso 6: escribir el comando que valida todo `contenido/`

Es el único archivo de `lecciones` que toca el sistema de archivos. Recorre `contenido/`, procesa cada JSON y termina con código 1 si alguna lección falla o se repite un id.

`packages/lecciones/src/validar-cli.ts`:

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { procesarLeccion } from './procesar';

const raiz = fileURLToPath(new URL('../../../contenido', import.meta.url));

function archivosJson(carpeta: string): string[] {
  const archivos: string[] = [];
  for (const nombre of readdirSync(carpeta).sort()) {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) archivos.push(...archivosJson(ruta));
    else if (nombre.endsWith('.json')) archivos.push(ruta);
  }
  return archivos;
}

function main(): number {
  const archivos = archivosJson(raiz);
  if (archivos.length === 0) {
    console.error('No hay ninguna lección en contenido/');
    return 1;
  }

  const idsVistos = new Set<string>();
  let validas = 0;

  for (const archivo of archivos) {
    const nombre = relative(raiz, archivo).split('\\').join('/');

    let datos: unknown;
    try {
      datos = JSON.parse(readFileSync(archivo, 'utf-8'));
    } catch (error) {
      console.error(`✘ ${nombre}`);
      console.error(`    JSON no válido: ${(error as Error).message}`);
      continue;
    }

    const resultado = procesarLeccion(datos);
    if (!resultado.ok) {
      console.error(`✘ ${nombre}`);
      for (const error of resultado.errores) console.error(`    ${error}`);
      continue;
    }

    const id = resultado.leccion.id;
    if (idsVistos.has(id)) {
      console.error(`✘ ${nombre}`);
      console.error(`    id: «${id}» está repetido`);
      continue;
    }
    idsVistos.add(id);

    validas++;
    console.log(
      `✔ ${nombre} (${resultado.leccion.pasos.length} pasos, ${resultado.comprobaciones.length} comprobaciones)`,
    );
  }

  console.log(`Lecciones válidas: ${validas} de ${archivos.length}`);
  return validas === archivos.length ? 0 : 1;
}

process.exitCode = main();
```

- [ ] Paso 7: ejecutar el comando con la lección piloto

Ejecuta: `pnpm validar`

Esperado (pnpm antepone un par de líneas con el nombre del script):

```text
✔ bloque-1-trazados/mediatriz-segmento.json (6 pasos, 4 comprobaciones)
Lecciones válidas: 1 de 1
```

- [ ] Paso 8: comprobar tipos y confirmar

```bash
pnpm --filter @traze/lecciones typecheck
git add packages/lecciones
git commit -m "feat(lecciones): interprete, comprobaciones y comando de validacion"
```

- [ ] Paso 9: comprobar que detecta una construcción imposible

Con la tarea ya confirmada, abre `contenido/bloque-1-trazados/mediatriz-segmento.json`, cambia `"factor": 0.75` por `"factor": 0.4` y ejecuta `pnpm validar`.

Esperado: pnpm termina con `ELIFECYCLE Command failed with exit code 1` y la salida incluye:

```text
✘ bloque-1-trazados/mediatriz-segmento.json
    construcción imposible: Los arcos con centro en «A» y «B» y radio «r» no se cortan: el radio debe ser mayor que la mitad de la distancia entre los centros
Lecciones válidas: 0 de 1
```

Deshaz el cambio con `git checkout contenido/bloque-1-trazados/mediatriz-segmento.json`.

## Tarea 7: proyecto web, tiempos y estado del reproductor

Archivos:

- Crear: `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/next.config.mjs`
- Crear: `apps/web/src/reproductor/tiempos.ts`, `apps/web/src/reproductor/estado.ts`
- Modificar: `.gitignore`
- Test: `apps/web/test/tiempos.test.ts`, `apps/web/test/estado.test.ts`

Dos módulos puros, sin React:

- `tiempos.ts` reparte el tiempo de un paso entre sus primitivas, que se dibujan una detrás de otra como lo haría un profesor, y decide qué se ve y con qué progreso.
- `estado.ts` es el reductor del reproductor. Todo lo que cambia el estado (paso, progreso, velocidad, cadena de «reproducir todo») son acciones puras, y entrar en un paso siempre lo reinicia a progreso 0, salvo cuando se piden animaciones desactivadas (`prefers-reduced-motion`): entonces el paso aparece terminado.

- [ ] Paso 1: crear el proyecto web

`apps/web/package.json`:

```json
{
  "name": "@traze/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "vitest run --passWithNoTests",
    "typecheck": "tsc --noEmit -p tsconfig.json"
  },
  "dependencies": {
    "@traze/geometria": "workspace:*",
    "@traze/lecciones": "workspace:*",
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

`apps/web/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "src", "test", ".next/types/**/*.ts"]
}
```

`apps/web/next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  transpilePackages: ['@traze/geometria', '@traze/lecciones'],
};

export default config;
```

`.gitignore`:

```text
node_modules
.next
out
dist
*.log
.DS_Store
next-env.d.ts
*.tsbuildinfo
```

- [ ] Paso 2: instalar dependencias

Ejecuta: `pnpm install`

Esperado: termina con `Done in ...` y crea `apps/web/node_modules`.

- [ ] Paso 3: escribir los tests que fallan

`apps/web/test/tiempos.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { PrimitivaResuelta } from '@traze/lecciones';
import {
  DURACION_MS,
  duracionPaso,
  primitivasVisibles,
  progresoPrimitivas,
} from '../src/reproductor/tiempos';

const puntoA: PrimitivaResuelta = {
  tipo: 'punto',
  id: 'A',
  etiqueta: 'A',
  x: 0,
  y: 0,
  estilo: 'dato',
};
const arco: PrimitivaResuelta = {
  tipo: 'arco',
  cx: 0,
  cy: 0,
  radio: 10,
  inicio: 0,
  fin: 1,
  estilo: 'construccion',
};

describe('duracionPaso', () => {
  it('suma la duración de cada primitiva', () => {
    expect(duracionPaso([puntoA, arco])).toBe(DURACION_MS.punto + DURACION_MS.arco);
  });

  it('es cero si el paso no tiene primitivas', () => {
    expect(duracionPaso([])).toBe(0);
  });
});

describe('progresoPrimitivas', () => {
  it('va de nada a todo entre el principio y el final del paso', () => {
    expect(progresoPrimitivas([puntoA, arco], 0)).toEqual([0, 0]);
    expect(progresoPrimitivas([puntoA, arco], 1)).toEqual([1, 1]);
  });

  it('dibuja las primitivas una detrás de otra', () => {
    const total = duracionPaso([puntoA, arco]);
    const progreso = (DURACION_MS.punto + DURACION_MS.arco / 2) / total;
    const [primera, segunda] = progresoPrimitivas([puntoA, arco], progreso);
    expect(primera).toBe(1);
    expect(segunda).toBeCloseTo(0.5, 9);
  });

  it('limita el progreso fuera del rango 0-1', () => {
    expect(progresoPrimitivas([puntoA, arco], -3)).toEqual([0, 0]);
    expect(progresoPrimitivas([puntoA, arco], 7)).toEqual([1, 1]);
  });
});

describe('primitivasVisibles', () => {
  const dibujos = [[puntoA], [puntoA, arco]];

  it('muestra completos los pasos anteriores y oculta los posteriores', () => {
    const alFinal = primitivasVisibles(dibujos, 1, 1);
    expect(alFinal.map((v) => v.clave)).toEqual(['0-0', '1-0', '1-1']);
    expect(alFinal.map((v) => v.progreso)).toEqual([1, 1, 1]);
    expect(alFinal.map((v) => v.delPasoActual)).toEqual([false, true, true]);

    expect(primitivasVisibles(dibujos, 0, 1).map((v) => v.clave)).toEqual(['0-0']);
  });

  it('omite las primitivas del paso actual que todavía no han empezado', () => {
    expect(primitivasVisibles(dibujos, 1, 0).map((v) => v.clave)).toEqual(['0-0']);

    const total = duracionPaso(dibujos[1]);
    const visibles = primitivasVisibles(dibujos, 1, DURACION_MS.punto / 2 / total);
    expect(visibles.map((v) => v.clave)).toEqual(['0-0', '1-0']);
    expect(visibles[1].progreso).toBeCloseTo(0.5, 9);
  });
});
```

`apps/web/test/estado.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { crearEstado, reductor, type EstadoReproductor } from '../src/reproductor/estado';

const TOTAL = 3;
const nuevo = () => crearEstado(TOTAL);
const avanzar = (estado: EstadoReproductor, ms: number) =>
  reductor(estado, { tipo: 'avanzar', ms, duracionPasoMs: 1000 });
const alternar = (estado: EstadoReproductor) =>
  reductor(estado, { tipo: 'alternarReproduccion' });
const encadenando = (): EstadoReproductor => alternar(alternar(nuevo()));

describe('crearEstado', () => {
  it('empieza en el primer paso, animándolo', () => {
    expect(nuevo()).toEqual({
      totalPasos: 3,
      paso: 0,
      progreso: 0,
      reproduciendo: true,
      encadenar: false,
      velocidad: 1,
      ocultarConstruccion: false,
      animar: true,
    });
  });

  it('rechaza una lección sin pasos', () => {
    expect(() => crearEstado(0)).toThrow('al menos un paso');
  });

  it('sin animaciones, el primer paso aparece terminado', () => {
    expect(crearEstado(TOTAL, false)).toMatchObject({
      progreso: 1,
      reproduciendo: false,
      animar: false,
    });
  });
});

describe('avanzar', () => {
  it('suma progreso según el tiempo y la velocidad', () => {
    expect(avanzar(nuevo(), 250).progreso).toBeCloseTo(0.25, 9);
    const rapido = reductor(nuevo(), { tipo: 'velocidad', valor: 2 });
    expect(avanzar(rapido, 250).progreso).toBeCloseTo(0.5, 9);
  });

  it('se detiene al terminar el paso si no está encadenando', () => {
    expect(avanzar(nuevo(), 1500)).toMatchObject({
      paso: 0,
      progreso: 1,
      reproduciendo: false,
      encadenar: false,
    });
  });

  it('pasa al siguiente paso si está encadenando', () => {
    expect(avanzar(encadenando(), 1000)).toMatchObject({
      paso: 1,
      progreso: 0,
      reproduciendo: true,
      encadenar: true,
    });
  });

  it('se detiene tras el último paso aunque esté encadenando', () => {
    const final = avanzar(avanzar(avanzar(encadenando(), 1000), 1000), 1000);
    expect(final).toMatchObject({
      paso: 2,
      progreso: 1,
      reproduciendo: false,
      encadenar: false,
    });
  });

  it('no cambia nada si está en pausa', () => {
    const pausado = alternar(nuevo());
    expect(avanzar(pausado, 500)).toBe(pausado);
  });

  it('ignora los tiempos negativos', () => {
    expect(avanzar(nuevo(), -100).progreso).toBe(0);
  });
});

describe('navegación manual', () => {
  it('siguiente entra en el paso animándolo, sin encadenar', () => {
    const siguiente = reductor(avanzar(nuevo(), 600), { tipo: 'siguiente' });
    expect(siguiente).toMatchObject({
      paso: 1,
      progreso: 0,
      reproduciendo: true,
      encadenar: false,
    });
  });

  it('siguiente y anterior no se salen de los límites', () => {
    const primero = nuevo();
    expect(reductor(primero, { tipo: 'anterior' })).toBe(primero);

    const ultimo = reductor(primero, { tipo: 'irA', paso: TOTAL - 1 });
    expect(reductor(ultimo, { tipo: 'siguiente' })).toBe(ultimo);
  });

  it('anterior vuelve a animar el paso al que entra', () => {
    const terminado = avanzar(reductor(nuevo(), { tipo: 'irA', paso: 2 }), 1000);
    expect(terminado.progreso).toBe(1);
    expect(reductor(terminado, { tipo: 'anterior' })).toMatchObject({
      paso: 1,
      progreso: 0,
      reproduciendo: true,
    });
  });

  it('irA limita el paso al rango de la lección', () => {
    expect(reductor(nuevo(), { tipo: 'irA', paso: 99 }).paso).toBe(2);
    expect(reductor(nuevo(), { tipo: 'irA', paso: -5 }).paso).toBe(0);
  });

  it('reiniciar vuelve al primer paso y cancela la cadena', () => {
    const enMedio = avanzar(encadenando(), 1000);
    expect(enMedio.paso).toBe(1);
    expect(reductor(enMedio, { tipo: 'reiniciar' })).toMatchObject({
      paso: 0,
      progreso: 0,
      reproduciendo: true,
      encadenar: false,
    });
  });

  it('ver la solución completa deja el último paso terminado', () => {
    expect(reductor(nuevo(), { tipo: 'verSolucion' })).toMatchObject({
      paso: 2,
      progreso: 1,
      reproduciendo: false,
      encadenar: false,
    });
  });
});

describe('reproducir todo', () => {
  it('pausa y reanuda continuando por donde iba', () => {
    const pausado = alternar(avanzar(nuevo(), 400));
    expect(pausado).toMatchObject({ reproduciendo: false, encadenar: false });

    const reanudado = alternar(pausado);
    expect(reanudado.paso).toBe(0);
    expect(reanudado.progreso).toBeCloseTo(0.4, 9);
    expect(reanudado).toMatchObject({ reproduciendo: true, encadenar: true });
  });

  it('continúa en el siguiente paso si el actual ya terminó', () => {
    const terminado = avanzar(nuevo(), 1000);
    expect(terminado).toMatchObject({ paso: 0, progreso: 1, reproduciendo: false });
    expect(alternar(terminado)).toMatchObject({
      paso: 1,
      progreso: 0,
      reproduciendo: true,
      encadenar: true,
    });
  });

  it('empieza de nuevo si ya se llegó al final', () => {
    const alFinal = avanzar(reductor(nuevo(), { tipo: 'irA', paso: 2 }), 1000);
    expect(alFinal).toMatchObject({ paso: 2, progreso: 1, reproduciendo: false });
    expect(alternar(alFinal)).toMatchObject({
      paso: 0,
      progreso: 0,
      reproduciendo: true,
      encadenar: true,
    });
  });
});

describe('ajustes', () => {
  it('cambia la velocidad y alterna la visibilidad de la construcción', () => {
    expect(reductor(nuevo(), { tipo: 'velocidad', valor: 0.5 }).velocidad).toBe(0.5);

    const oculta = reductor(nuevo(), { tipo: 'alternarConstruccion' });
    expect(oculta.ocultarConstruccion).toBe(true);
    expect(reductor(oculta, { tipo: 'alternarConstruccion' }).ocultarConstruccion).toBe(false);
  });

  it('sin animaciones, los pasos aparecen terminados y reproducir no hace nada', () => {
    const sinAnimar = crearEstado(TOTAL, false);
    expect(reductor(sinAnimar, { tipo: 'siguiente' })).toMatchObject({
      paso: 1,
      progreso: 1,
      reproduciendo: false,
    });
    expect(alternar(sinAnimar)).toBe(sinAnimar);
  });

  it('desactivar la animación termina el paso en curso', () => {
    expect(reductor(encadenando(), { tipo: 'animar', valor: false })).toMatchObject({
      animar: false,
      progreso: 1,
      reproduciendo: false,
      encadenar: false,
    });
  });
});
```

- [ ] Paso 4: ejecutar los tests y comprobar que fallan

Ejecuta: `pnpm --filter @traze/web test`

Esperado: FALLAN los dos archivos porque `../src/reproductor/tiempos` y `../src/reproductor/estado` no existen.

- [ ] Paso 5: escribir los módulos

`apps/web/src/reproductor/tiempos.ts`:

```ts
import type { PrimitivaResuelta } from '@traze/lecciones';

export const DURACION_MS: Record<PrimitivaResuelta['tipo'], number> = {
  punto: 400,
  segmento: 900,
  recta: 1200,
  arco: 1400,
  marcaAnguloRecto: 500,
  marcaIgualdad: 400,
};

export const clamp01 = (valor: number): number => Math.min(1, Math.max(0, valor));

export interface PrimitivaAnimada {
  clave: string;
  primitiva: PrimitivaResuelta;
  progreso: number;
  delPasoActual: boolean;
}

export function duracionPaso(dibujo: readonly PrimitivaResuelta[]): number {
  return dibujo.reduce((total, primitiva) => total + DURACION_MS[primitiva.tipo], 0);
}

export function progresoPrimitivas(
  dibujo: readonly PrimitivaResuelta[],
  progresoPaso: number,
): number[] {
  const transcurrido = clamp01(progresoPaso) * duracionPaso(dibujo);
  let inicio = 0;
  return dibujo.map((primitiva) => {
    const duracion = DURACION_MS[primitiva.tipo];
    const progreso = clamp01((transcurrido - inicio) / duracion);
    inicio += duracion;
    return progreso;
  });
}

export function primitivasVisibles(
  dibujos: readonly (readonly PrimitivaResuelta[])[],
  paso: number,
  progreso: number,
): PrimitivaAnimada[] {
  const visibles: PrimitivaAnimada[] = [];
  dibujos.forEach((dibujo, i) => {
    if (i > paso) return;
    const progresos = i < paso ? dibujo.map(() => 1) : progresoPrimitivas(dibujo, progreso);
    dibujo.forEach((primitiva, j) => {
      if (progresos[j] > 0) {
        visibles.push({
          clave: `${i}-${j}`,
          primitiva,
          progreso: progresos[j],
          delPasoActual: i === paso,
        });
      }
    });
  });
  return visibles;
}
```

`apps/web/src/reproductor/estado.ts`:

```ts
export const VELOCIDADES = [0.5, 1, 2] as const;
export type Velocidad = (typeof VELOCIDADES)[number];

export interface EstadoReproductor {
  totalPasos: number;
  paso: number;
  progreso: number;
  reproduciendo: boolean;
  encadenar: boolean;
  velocidad: Velocidad;
  ocultarConstruccion: boolean;
  animar: boolean;
}

export type Accion =
  | { tipo: 'avanzar'; ms: number; duracionPasoMs: number }
  | { tipo: 'siguiente' }
  | { tipo: 'anterior' }
  | { tipo: 'irA'; paso: number }
  | { tipo: 'reiniciar' }
  | { tipo: 'verSolucion' }
  | { tipo: 'alternarReproduccion' }
  | { tipo: 'velocidad'; valor: Velocidad }
  | { tipo: 'alternarConstruccion' }
  | { tipo: 'animar'; valor: boolean };

export function crearEstado(totalPasos: number, animar = true): EstadoReproductor {
  if (totalPasos < 1) throw new Error('Una lección necesita al menos un paso');
  return {
    totalPasos,
    paso: 0,
    progreso: animar ? 0 : 1,
    reproduciendo: animar,
    encadenar: false,
    velocidad: 1,
    ocultarConstruccion: false,
    animar,
  };
}

function entrar(estado: EstadoReproductor, paso: number, encadenar: boolean): EstadoReproductor {
  const limitado = Math.min(Math.max(Math.trunc(paso), 0), estado.totalPasos - 1);
  return {
    ...estado,
    paso: limitado,
    progreso: estado.animar ? 0 : 1,
    reproduciendo: estado.animar,
    encadenar: estado.animar && encadenar,
  };
}

export function reductor(estado: EstadoReproductor, accion: Accion): EstadoReproductor {
  switch (accion.tipo) {
    case 'avanzar': {
      if (!estado.reproduciendo) return estado;
      const ms = Math.max(0, accion.ms);
      const delta = accion.duracionPasoMs > 0 ? (ms * estado.velocidad) / accion.duracionPasoMs : 1;
      const progreso = Math.min(1, estado.progreso + delta);
      if (progreso < 1) return { ...estado, progreso };
      if (estado.encadenar && estado.paso < estado.totalPasos - 1) {
        return entrar(estado, estado.paso + 1, true);
      }
      return { ...estado, progreso: 1, reproduciendo: false, encadenar: false };
    }
    case 'siguiente':
      return estado.paso >= estado.totalPasos - 1 ? estado : entrar(estado, estado.paso + 1, false);
    case 'anterior':
      return estado.paso <= 0 ? estado : entrar(estado, estado.paso - 1, false);
    case 'irA':
      return entrar(estado, accion.paso, false);
    case 'reiniciar':
      return entrar(estado, 0, false);
    case 'verSolucion':
      return {
        ...estado,
        paso: estado.totalPasos - 1,
        progreso: 1,
        reproduciendo: false,
        encadenar: false,
      };
    case 'alternarReproduccion': {
      if (!estado.animar) return estado;
      if (estado.reproduciendo) {
        return { ...estado, reproduciendo: false, encadenar: false };
      }
      if (estado.progreso >= 1) {
        const siguiente = estado.paso < estado.totalPasos - 1 ? estado.paso + 1 : 0;
        return entrar(estado, siguiente, true);
      }
      return { ...estado, reproduciendo: true, encadenar: true };
    }
    case 'velocidad':
      return { ...estado, velocidad: accion.valor };
    case 'alternarConstruccion':
      return { ...estado, ocultarConstruccion: !estado.ocultarConstruccion };
    case 'animar':
      return accion.valor
        ? { ...estado, animar: true }
        : { ...estado, animar: false, progreso: 1, reproduciendo: false, encadenar: false };
  }
}
```

- [ ] Paso 6: ejecutar los tests y comprobar que pasan

Ejecuta: `pnpm --filter @traze/web test`

Esperado: `28 passed` (7 de `tiempos` y 21 de `estado`).

- [ ] Paso 7: comprobar tipos y confirmar

```bash
pnpm --filter @traze/web typecheck
git add .gitignore apps/web pnpm-lock.yaml
git commit -m "feat(web): proyecto Next.js, tiempos y estado del reproductor"
```

## Tarea 8: lienzo SVG y estilos de lápiz

Archivos:

- Crear: `apps/web/src/reproductor/trazado.ts`
- Crear: `apps/web/src/componentes/Lienzo.tsx`
- Crear: `apps/web/src/app/globals.css`, `apps/web/src/app/layout.tsx`
- Test: `apps/web/test/trazado.test.ts`

`trazado.ts` concentra las cuentas del dibujo (punta del lápiz, caminos SVG, tamaño de los puntos) en funciones puras que sí se pueden probar. `Lienzo.tsx` solo decide qué pintar y con qué clase CSS. El aspecto lápiz sale de un filtro SVG (`feTurbulence` más `feDisplacementMap`) aplicado a los trazos, nunca a las etiquetas: la geometría es exacta aunque el trazo parezca hecho a mano.

El `Lienzo` no tiene test automático: se verifica a ojo en la Tarea 9 y con Playwright en el Plan 4.

- [ ] Paso 1: escribir el test que falla

`apps/web/test/trazado.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  descripcionAnguloRecto,
  descripcionArco,
  descripcionMarcaIgualdad,
  esConstruccion,
  puntaArco,
  puntaSegmento,
  radioPunto,
} from '../src/reproductor/trazado';

describe('puntaSegmento', () => {
  const tramo = { x1: 0, y1: 0, x2: 10, y2: 20 };

  it('recorre el segmento según el progreso y no se sale de él', () => {
    expect(puntaSegmento(tramo, 0.5)).toEqual({ x: 5, y: 10 });
    expect(puntaSegmento(tramo, 2)).toEqual({ x: 10, y: 20 });
    expect(puntaSegmento(tramo, -1)).toEqual({ x: 0, y: 0 });
  });
});

describe('puntaArco', () => {
  it('sigue el barrido del arco', () => {
    const punta = puntaArco(
      { tipo: 'arco', cx: 0, cy: 0, radio: 10, inicio: 0, fin: Math.PI, estilo: 'construccion' },
      0.5,
    );
    expect(punta.x).toBeCloseTo(0, 9);
    expect(punta.y).toBeCloseTo(10, 9);
  });
});

describe('descripcionArco', () => {
  const arco = (fin: number) =>
    ({ tipo: 'arco', cx: 0, cy: 0, radio: 10, inicio: 0, fin, estilo: 'construccion' }) as const;

  it('dibuja un cuarto de circunferencia', () => {
    expect(descripcionArco(arco(Math.PI / 2), 1)).toBe(
      'M 10.000 0.000 A 10.000 10.000 0 0 1 0.000 10.000',
    );
  });

  it('recorta el arco según el progreso', () => {
    expect(descripcionArco(arco(Math.PI), 0.5)).toBe(
      'M 10.000 0.000 A 10.000 10.000 0 0 1 0.000 10.000',
    );
  });

  it('respeta el sentido negativo', () => {
    expect(descripcionArco(arco(-Math.PI / 2), 1)).toBe(
      'M 10.000 0.000 A 10.000 10.000 0 0 0 0.000 -10.000',
    );
  });

  it('divide el trazo en dos arcos si pasa de 180 grados', () => {
    expect(descripcionArco(arco(2 * Math.PI), 1)).toBe(
      'M 10.000 0.000 A 10.000 10.000 0 0 1 -10.000 0.000 A 10.000 10.000 0 0 1 10.000 0.000',
    );
  });

  it('devuelve una cadena vacía si todavía no hay recorrido', () => {
    expect(descripcionArco(arco(Math.PI), 0)).toBe('');
  });
});

describe('marcas', () => {
  it('dibuja el cuadradito del ángulo recto en el vértice', () => {
    const marca = {
      tipo: 'marcaAnguloRecto',
      x: 10,
      y: 10,
      ux1: 1,
      uy1: 0,
      ux2: 0,
      uy2: 1,
    } as const;
    expect(descripcionAnguloRecto(marca)).toBe('M 14.000 10.000 L 14.000 14.000 L 10.000 14.000');
  });

  it('dibuja la marca de igualdad perpendicular al segmento, en su punto medio', () => {
    const marca = { tipo: 'marcaIgualdad', x1: 0, y1: 0, x2: 10, y2: 0 } as const;
    expect(descripcionMarcaIgualdad(marca)).toBe('M 5.000 -3.000 L 5.000 3.000');
  });

  it('no dibuja la marca de igualdad de un segmento nulo', () => {
    const marca = { tipo: 'marcaIgualdad', x1: 4, y1: 4, x2: 4, y2: 4 } as const;
    expect(descripcionMarcaIgualdad(marca)).toBe('');
  });
});

describe('radioPunto', () => {
  it('hace un pequeño pulso y vuelve al tamaño base', () => {
    expect(radioPunto(2, 0)).toBe(2);
    expect(radioPunto(2, 0.5)).toBe(3);
    expect(radioPunto(2, 1)).toBeCloseTo(2, 9);
  });
});

describe('esConstruccion', () => {
  it('es cierto solo para las primitivas de estilo construcción', () => {
    expect(
      esConstruccion({
        tipo: 'punto',
        id: 'M',
        etiqueta: 'M',
        x: 0,
        y: 0,
        estilo: 'construccion',
      }),
    ).toBe(true);
    expect(
      esConstruccion({ tipo: 'segmento', x1: 0, y1: 0, x2: 1, y2: 1, estilo: 'dato' }),
    ).toBe(false);
    expect(esConstruccion({ tipo: 'marcaIgualdad', x1: 0, y1: 0, x2: 1, y2: 1 })).toBe(false);
  });
});
```

- [ ] Paso 2: ejecutar el test y comprobar que falla

Ejecuta: `pnpm --filter @traze/web test`

Esperado: `trazado.test.ts` FALLA porque `../src/reproductor/trazado` no existe; los 28 tests anteriores siguen pasando.

- [ ] Paso 3: escribir las funciones de trazado

`apps/web/src/reproductor/trazado.ts`:

```ts
import type { PrimitivaResuelta } from '@traze/lecciones';
import { clamp01 } from './tiempos';

type Resuelta<T extends PrimitivaResuelta['tipo']> = Extract<PrimitivaResuelta, { tipo: T }>;

export interface Tramo {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Posicion {
  x: number;
  y: number;
}

const formatear = (n: number): string => (Math.abs(n) < 5e-4 ? '0.000' : n.toFixed(3));

export function puntaSegmento(tramo: Tramo, progreso: number): Posicion {
  const k = clamp01(progreso);
  return {
    x: tramo.x1 + (tramo.x2 - tramo.x1) * k,
    y: tramo.y1 + (tramo.y2 - tramo.y1) * k,
  };
}

export function puntaArco(arco: Resuelta<'arco'>, progreso: number): Posicion {
  const angulo = arco.inicio + (arco.fin - arco.inicio) * clamp01(progreso);
  return {
    x: arco.cx + arco.radio * Math.cos(angulo),
    y: arco.cy + arco.radio * Math.sin(angulo),
  };
}

export function puntaDe(primitiva: PrimitivaResuelta, progreso: number): Posicion | null {
  switch (primitiva.tipo) {
    case 'segmento':
    case 'recta':
      return puntaSegmento(primitiva, progreso);
    case 'arco':
      return puntaArco(primitiva, progreso);
    default:
      return null;
  }
}

export function descripcionArco(arco: Resuelta<'arco'>, progreso: number): string {
  const recorrido = (arco.fin - arco.inicio) * clamp01(progreso);
  if (Math.abs(recorrido) < 1e-9) return '';

  // Un arco SVG de más de 180° es ambiguo; se parte en dos mitades.
  const trozos = Math.abs(recorrido) > Math.PI ? 2 : 1;
  const sentido = recorrido > 0 ? 1 : 0;
  const en = (angulo: number): Posicion => ({
    x: arco.cx + arco.radio * Math.cos(angulo),
    y: arco.cy + arco.radio * Math.sin(angulo),
  });

  const origen = en(arco.inicio);
  let camino = `M ${formatear(origen.x)} ${formatear(origen.y)}`;
  for (let i = 1; i <= trozos; i++) {
    const destino = en(arco.inicio + (recorrido * i) / trozos);
    camino += ` A ${formatear(arco.radio)} ${formatear(arco.radio)} 0 0 ${sentido} ${formatear(destino.x)} ${formatear(destino.y)}`;
  }
  return camino;
}

export function descripcionAnguloRecto(marca: Resuelta<'marcaAnguloRecto'>, lado = 4): string {
  const a = { x: marca.x + marca.ux1 * lado, y: marca.y + marca.uy1 * lado };
  const b = { x: a.x + marca.ux2 * lado, y: a.y + marca.uy2 * lado };
  const c = { x: marca.x + marca.ux2 * lado, y: marca.y + marca.uy2 * lado };
  return `M ${formatear(a.x)} ${formatear(a.y)} L ${formatear(b.x)} ${formatear(b.y)} L ${formatear(c.x)} ${formatear(c.y)}`;
}

export function descripcionMarcaIgualdad(marca: Resuelta<'marcaIgualdad'>, semilargo = 3): string {
  const dx = marca.x2 - marca.x1;
  const dy = marca.y2 - marca.y1;
  const largo = Math.hypot(dx, dy);
  if (largo < 1e-9) return '';

  const mx = (marca.x1 + marca.x2) / 2;
  const my = (marca.y1 + marca.y2) / 2;
  const nx = -dy / largo;
  const ny = dx / largo;
  return `M ${formatear(mx - nx * semilargo)} ${formatear(my - ny * semilargo)} L ${formatear(mx + nx * semilargo)} ${formatear(my + ny * semilargo)}`;
}

export function radioPunto(base: number, progreso: number): number {
  return base * (1 + 0.5 * Math.sin(Math.PI * clamp01(progreso)));
}

export function esConstruccion(primitiva: PrimitivaResuelta): boolean {
  return 'estilo' in primitiva && primitiva.estilo === 'construccion';
}
```

- [ ] Paso 4: ejecutar el test y comprobar que pasa

Ejecuta: `pnpm --filter @traze/web test`

Esperado: `40 passed` (7 de `tiempos`, 21 de `estado` y 12 de `trazado`).

- [ ] Paso 5: escribir el componente del lienzo

`apps/web/src/componentes/Lienzo.tsx`:

```tsx
import type { PrimitivaResuelta } from '@traze/lecciones';
import { primitivasVisibles, type PrimitivaAnimada } from '../reproductor/tiempos';
import {
  descripcionAnguloRecto,
  descripcionArco,
  descripcionMarcaIgualdad,
  esConstruccion,
  puntaDe,
  puntaSegmento,
  radioPunto,
} from '../reproductor/trazado';

interface Propiedades {
  ancho: number;
  alto: number;
  dibujos: readonly (readonly PrimitivaResuelta[])[];
  paso: number;
  progreso: number;
  ocultarConstruccion: boolean;
  descripcion: string;
}

function Trazo({ animada }: { animada: PrimitivaAnimada }) {
  const { primitiva, progreso, delPasoActual } = animada;
  const posicion = delPasoActual && progreso < 1 ? puntaDe(primitiva, progreso) : null;

  switch (primitiva.tipo) {
    case 'punto':
      return (
        <circle
          className={`punto punto-${primitiva.estilo}`}
          cx={primitiva.x}
          cy={primitiva.y}
          r={radioPunto(0.9, progreso)}
        />
      );
    case 'segmento':
    case 'recta': {
      const final = puntaSegmento(primitiva, progreso);
      return (
        <g>
          <path
            className={`trazo trazo-${primitiva.estilo}`}
            d={`M ${primitiva.x1} ${primitiva.y1} L ${final.x} ${final.y}`}
          />
          {posicion && <circle className="punta" cx={posicion.x} cy={posicion.y} r={0.8} />}
        </g>
      );
    }
    case 'arco':
      return (
        <g>
          <path
            className={`trazo trazo-${primitiva.estilo}`}
            d={descripcionArco(primitiva, progreso)}
          />
          {posicion && (
            <>
              <path
                className="radio-compas"
                d={`M ${primitiva.cx} ${primitiva.cy} L ${posicion.x} ${posicion.y}`}
              />
              <circle className="punta" cx={posicion.x} cy={posicion.y} r={0.8} />
            </>
          )}
        </g>
      );
    case 'marcaAnguloRecto':
      return <path className="marca" d={descripcionAnguloRecto(primitiva)} opacity={progreso} />;
    case 'marcaIgualdad':
      return <path className="marca" d={descripcionMarcaIgualdad(primitiva)} opacity={progreso} />;
  }
}

export function Lienzo({
  ancho,
  alto,
  dibujos,
  paso,
  progreso,
  ocultarConstruccion,
  descripcion,
}: Propiedades) {
  const visibles = primitivasVisibles(dibujos, paso, progreso).filter(
    ({ primitiva }) => !(ocultarConstruccion && esConstruccion(primitiva)),
  );

  return (
    <svg
      className="lienzo"
      viewBox={`0 0 ${ancho} ${alto}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={descripcion}
    >
      <defs>
        <pattern id="cuadricula" width="5" height="5" patternUnits="userSpaceOnUse">
          <path className="cuadricula-linea" d="M 5 0 L 0 0 L 0 5" />
        </pattern>
        <filter id="grafito" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            seed={7}
            result="ruido"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="ruido"
            scale={0.35}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>

      <rect className="papel" width={ancho} height={alto} />
      <rect width={ancho} height={alto} fill="url(#cuadricula)" />

      <g filter="url(#grafito)">
        {visibles.map((animada) => (
          <Trazo key={animada.clave} animada={animada} />
        ))}
      </g>

      <g className="rotulos">
        {visibles.map(({ clave, primitiva }) =>
          primitiva.tipo === 'punto' ? (
            <text key={clave} className="rotulo" x={primitiva.x + 2} y={primitiva.y - 2.5}>
              {primitiva.etiqueta}
            </text>
          ) : null,
        )}
      </g>
    </svg>
  );
}
```

- [ ] Paso 6: escribir los estilos base y la estructura HTML

`apps/web/src/app/globals.css`:

```css
:root {
  --papel: #f4ecd8;
  --papel-sombra: #e6dcc0;
  --tinta: #2b2b2b;
  --tinta-suave: #5c5648;
  --azul-correccion: #2f5d8c;
  --rojo-profe: #b3261e;
  --grafito-dato: #4a4a4a;
  --grafito-construccion: #5f82aa;
  --grafito-resultado: #111111;
  --rotulacion: 'ISOCPEUR', 'Osifont', 'Arial Narrow', Arial, sans-serif;
  --interfaz: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

* {
  box-sizing: border-box;
}

html {
  background: var(--papel);
}

body {
  margin: 0;
  color: var(--tinta);
  font-family: var(--interfaz);
  line-height: 1.55;
  background-color: var(--papel);
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.35 0 0 0 0 0.3 0 0 0 0 0.2 0 0 0 0.09 0'/></filter><rect width='160' height='160' filter='url(%23g)'/></svg>");
}

:focus-visible {
  outline: 3px solid var(--azul-correccion);
  outline-offset: 2px;
}

a {
  color: var(--azul-correccion);
}

h1,
h2 {
  line-height: 1.2;
}

.cabecera {
  display: flex;
  align-items: center;
  padding: 0.75rem clamp(1rem, 4vw, 2.5rem);
  border-bottom: 1px solid var(--papel-sombra);
}

.logo {
  font-family: var(--rotulacion);
  font-size: 1.6rem;
  font-style: italic;
  letter-spacing: 0.04em;
  color: var(--tinta);
  text-decoration: none;
}

main {
  max-width: 72rem;
  margin: 0 auto;
  padding: 1.5rem clamp(1rem, 4vw, 2.5rem) 4rem;
}

/* Lienzo de dibujo */

.lienzo {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid var(--tinta-suave);
  box-shadow: 0 8px 24px rgba(60, 45, 20, 0.12);
}

.papel {
  fill: var(--papel);
}

.cuadricula-linea {
  fill: none;
  stroke: #b9ad8c;
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
  font-size: 5px;
  font-style: italic;
  fill: var(--grafito-resultado);
}
```

`apps/web/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Traze: Dibujo Técnico paso a paso', template: '%s · Traze' },
  description:
    'Aprende los trazados de Dibujo Técnico de 1º de Bachillerato viendo cómo se construyen, paso a paso.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-ES">
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

- [ ] Paso 7: comprobar tipos y confirmar

```bash
pnpm --filter @traze/web typecheck
git add apps/web
git commit -m "feat(web): lienzo SVG con estilo lapiz y funciones de trazado"
```

## Tarea 9: contenido, reproductor, páginas y deslizador del compás

Archivos:

- Crear: `apps/web/src/contenido.ts`
- Crear: `apps/web/src/componentes/Reproductor.tsx`
- Crear: `apps/web/src/app/page.tsx`, `apps/web/src/app/leccion/[id]/page.tsx`
- Modificar: `apps/web/src/app/globals.css`

Esta tarea une las piezas. El servidor carga y comprueba el contenido al construir el sitio (si una lección falla, el `build` falla y no se publica). El reproductor es el único componente de cliente: anima con `requestAnimationFrame`, traduce los botones en acciones del reductor y recalcula la construcción con el mismo intérprete cuando el alumno mueve el deslizador del compás.

Decisiones de esta tarea:

- Con un radio imposible, el deslizador muestra un aviso (`role="alert"`) y conserva el último trazado válido; no se dibuja nada a medias.
- El rango del deslizador es de 0,30 a 0,85 veces el segmento. Es el rango que mantiene el dibujo dentro del lienzo de 210 × 140 mm en la lección piloto; por debajo de 0,50 los arcos no se cortan, que es justo el error frecuente de la lección. Si otra lección necesita otro rango, se declarará en su JSON en el Plan 3.
- `contenido.ts` lee de `../../contenido` respecto al directorio de trabajo, así que el `build` y el `dev` se lanzan siempre desde `apps/web` (los scripts de pnpm ya lo hacen).
- El recorrido de carpetas de `contenido.ts` repite al de `validar-cli.ts` (8 líneas) a propósito: `lecciones` no puede importar `fs` salvo en su comando.

- [ ] Paso 1: escribir el cargador de contenido

`apps/web/src/contenido.ts`:

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { procesarLeccion, type Leccion, type LeccionResuelta } from '@traze/lecciones';

export interface LeccionCargada {
  leccion: Leccion;
  resuelta: LeccionResuelta;
}

const RAIZ = join(process.cwd(), '..', '..', 'contenido');

let memoria: LeccionCargada[] | null = null;

function archivosJson(carpeta: string): string[] {
  const archivos: string[] = [];
  for (const nombre of readdirSync(carpeta).sort()) {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) archivos.push(...archivosJson(ruta));
    else if (nombre.endsWith('.json')) archivos.push(ruta);
  }
  return archivos;
}

export function cargarLecciones(): LeccionCargada[] {
  if (memoria) return memoria;

  const ids = new Set<string>();
  memoria = archivosJson(RAIZ).map((archivo) => {
    const resultado = procesarLeccion(JSON.parse(readFileSync(archivo, 'utf-8')));
    if (!resultado.ok) {
      throw new Error(`Lección inválida (${archivo}):\n- ${resultado.errores.join('\n- ')}`);
    }
    if (ids.has(resultado.leccion.id)) {
      throw new Error(`Id de lección repetido: ${resultado.leccion.id}`);
    }
    ids.add(resultado.leccion.id);
    return { leccion: resultado.leccion, resuelta: resultado.resuelta };
  });
  return memoria;
}

export function cargarLeccion(id: string): LeccionCargada | undefined {
  return cargarLecciones().find(({ leccion }) => leccion.id === id);
}
```

- [ ] Paso 2: escribir el reproductor

`apps/web/src/componentes/Reproductor.tsx`:

```tsx
'use client';

import { useEffect, useMemo, useReducer, useState } from 'react';
import type { Leccion, LeccionResuelta } from '@traze/lecciones';
import { ConstruccionImposible, interpretarLeccion } from '@traze/lecciones/interpretar';
import { crearEstado, reductor, VELOCIDADES } from '../reproductor/estado';
import { duracionPaso } from '../reproductor/tiempos';
import { Lienzo } from './Lienzo';

const FACTOR_MIN = 0.3;
const FACTOR_MAX = 0.85;
const MAX_SALTO_MS = 100;

const decimal = (numero: number, cifras: number): string =>
  numero.toFixed(cifras).replace('.', ',');

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
        <Lienzo
          ancho={vista.lienzo.ancho}
          alto={vista.lienzo.alto}
          dibujos={dibujos}
          paso={estado.paso}
          progreso={estado.progreso}
          ocultarConstruccion={estado.ocultarConstruccion}
          descripcion={`Paso ${estado.paso + 1} de ${total}: ${pasoActual.titulo}`}
        />

        <div className="panel-paso">
          <p className="etiqueta" aria-live="polite">
            Paso {estado.paso + 1} de {total}
          </p>
          <h2>{pasoActual.titulo}</h2>
          <p>{pasoActual.texto}</p>
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
        {vista.pasos.map((paso, i) => (
          <li key={i}>
            <button
              type="button"
              className={i === estado.paso ? 'activo' : undefined}
              aria-current={i === estado.paso ? 'step' : undefined}
              aria-label={`Ir al paso ${i + 1}: ${paso.titulo}`}
              onClick={() => despachar({ tipo: 'irA', paso: i })}
            >
              {i + 1}
            </button>
          </li>
        ))}
      </ol>

      <div className="controles" role="group" aria-label="Controles de la lección">
        <button
          type="button"
          disabled={estado.paso === 0}
          onClick={() => despachar({ tipo: 'anterior' })}
        >
          ← Anterior
        </button>
        <button
          type="button"
          disabled={!estado.animar}
          onClick={() => despachar({ tipo: 'alternarReproduccion' })}
        >
          {estado.reproduciendo ? 'Pausar' : 'Reproducir todo'}
        </button>
        <button
          type="button"
          disabled={estado.paso === total - 1}
          onClick={() => despachar({ tipo: 'siguiente' })}
        >
          Siguiente →
        </button>
        <button type="button" onClick={() => despachar({ tipo: 'reiniciar' })}>
          Reiniciar
        </button>
        <button type="button" onClick={() => despachar({ tipo: 'verSolucion' })}>
          Ver solución completa
        </button>

        <label className="campo">
          Velocidad
          <select
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

- [ ] Paso 3: escribir la portada y la página de lección

`apps/web/src/app/page.tsx`:

```tsx
import Link from 'next/link';
import { cargarLecciones } from '../contenido';

export default function Portada() {
  const lecciones = cargarLecciones();

  return (
    <section className="portada">
      <h1>Traze</h1>
      <p className="lema">Dibujo Técnico de 1º de Bachillerato, trazo a trazo.</p>
      <ul className="indice">
        {lecciones.map(({ leccion }) => (
          <li key={leccion.id}>
            <Link href={`/leccion/${leccion.id}`}>{leccion.titulo}</Link>
            <span>Bloque {leccion.bloque}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

`apps/web/src/app/leccion/[id]/page.tsx`:

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
        <h1>{leccion.titulo}</h1>
        <aside className="cajetin" aria-label="Cajetín de la lámina">
          <dl>
            <div>
              <dt>Título</dt>
              <dd>{leccion.titulo}</dd>
            </div>
            <div>
              <dt>Tema</dt>
              <dd>Bloque {leccion.bloque}</dd>
            </div>
            <div>
              <dt>Escala</dt>
              <dd>1:1</dd>
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

- [ ] Paso 4: añadir los estilos del reproductor y las páginas

Añade al final de `apps/web/src/app/globals.css`:

```css
/* Portada */

.portada .lema {
  font-size: 1.15rem;
  color: var(--tinta-suave);
}

.indice {
  list-style: none;
  margin: 1.5rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.5rem;
}

.indice li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--papel-sombra);
  background: rgba(255, 255, 255, 0.35);
}

.indice span {
  color: var(--tinta-suave);
}

/* Lección */

.leccion-cabecera {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.cajetin {
  border: 2px solid var(--tinta);
  padding: 0.4rem 0.75rem;
  font-family: var(--rotulacion);
  font-style: italic;
  min-width: 14rem;
  background: rgba(255, 255, 255, 0.35);
}

.cajetin dl {
  margin: 0;
}

.cajetin dl > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--papel-sombra);
}

.cajetin dl > div:last-child {
  border-bottom: 0;
}

.cajetin dt {
  color: var(--tinta-suave);
}

.cajetin dd {
  margin: 0;
}

.idea-clave {
  border-left: 4px solid var(--azul-correccion);
  padding-left: 0.75rem;
}

.sala {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 800px) {
  .sala {
    grid-template-columns: 1fr;
  }
}

.panel-paso h2 {
  margin-top: 0.25rem;
}

.etiqueta {
  margin: 0;
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--tinta-suave);
}

.nota-profe {
  border-left: 3px solid var(--azul-correccion);
  padding-left: 0.75rem;
  color: var(--azul-correccion);
}

.nota-profe summary {
  cursor: pointer;
  font-style: italic;
}

/* Controles */

.indice-pasos {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0 0;
  padding: 0;
}

.controles {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
}

button,
select {
  min-height: 44px;
  min-width: 44px;
  padding: 0 1rem;
  border: 1px solid var(--tinta);
  border-radius: 4px;
  background: var(--papel);
  color: var(--tinta);
  font: inherit;
  cursor: pointer;
}

button:hover:not(:disabled) {
  background: var(--papel-sombra);
}

button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.indice-pasos button.activo {
  background: var(--tinta);
  color: var(--papel);
}

.campo {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
}

.campo input[type='checkbox'] {
  width: 1.25rem;
  height: 1.25rem;
}

.datos-modificables {
  margin-top: 1.5rem;
  padding: 1rem;
  border: 1px dashed var(--tinta-suave);
}

.datos-modificables h3 {
  margin: 0 0 0.5rem;
}

.deslizador {
  display: grid;
  gap: 0.25rem;
}

.deslizador input[type='range'] {
  width: 100%;
  min-height: 44px;
}

.aviso {
  margin: 0.75rem 0 0;
  color: var(--rojo-profe);
  font-weight: 600;
}

.errores ul {
  padding-left: 1.25rem;
}

.pasos-escritos {
  margin-top: 1.5rem;
}

.pasos-escritos summary {
  cursor: pointer;
  color: var(--azul-correccion);
}
```

- [ ] Paso 5: comprobar todo el monorepo

Ejecuta, en este orden:

```bash
pnpm typecheck
pnpm test
pnpm validar
```

Esperado:

- `pnpm typecheck`: los tres paquetes terminan con `Done` y sin errores.
- `pnpm test`: `22 passed` en `geometria`, `21 passed` en `lecciones` y `40 passed` en `web`.
- `pnpm validar`: `Lecciones válidas: 1 de 1`.

- [ ] Paso 6: generar el sitio estático

Ejecuta: `pnpm --filter @traze/web build`

Esperado: `next build` termina sin errores, la lista de rutas incluye `/` y `/leccion/mediatriz-segmento` como estáticas (`●` o `○`) y existe el archivo `apps/web/out/leccion/mediatriz-segmento.html`.

- [ ] Paso 7: comprobación visual de la lección piloto

Ejecuta: `pnpm web` y abre `http://localhost:3000/leccion/mediatriz-segmento`.

Comprueba, uno por uno:

1. El papel es crema con cuadrícula tenue, y el cajetín aparece arriba a la derecha con título, tema y escala.
2. Al cargar, el paso 1 se dibuja solo: primero el segmento AB y después los puntos A y B con su etiqueta.
3. «Reproducir todo» encadena los 6 pasos y se detiene al final del último; «Pausar» lo detiene a mitad de un trazo y «Reproducir todo» lo reanuda desde ahí.
4. «Siguiente» y los números del índice animan el paso al que entran, pero no encadenan el siguiente.
5. En los pasos 2 y 3 se ve el compás: un radio fino a trazos gira desde el centro mientras la punta azul avanza por el arco.
6. Con velocidad 2× el paso dura la mitad; con 0,5× el doble.
7. «Ocultar construcción» esconde los arcos y los puntos M y N, y deja los datos, la recta MN y las marcas.
8. «Ver solución completa» muestra los 6 pasos dibujados, con el ángulo recto en O y las marcas de igualdad en AO y OB.
9. El deslizador mueve los arcos y la recta MN con el compás. Por debajo de 0,50 aparece el aviso en rojo y el dibujo se queda en el último trazado válido; al volver a subir, el aviso desaparece.
10. «Consejo del profe» se despliega y se pliega con teclado (Tab y Enter).
11. «Los pasos por escrito», al final de la página, lista los 6 pasos en HTML.

- [ ] Paso 8: confirmar

```bash
git add apps/web
git commit -m "feat(web): reproductor, paginas de leccion y deslizador del compas"
```
