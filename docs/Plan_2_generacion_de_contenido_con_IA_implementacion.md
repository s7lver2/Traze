# Plan 2: generación de contenido con IA (implementación)

Oct 11, 2026 · @s7lver

> Para agentes: SUBSKILL REQUERIDA: usar superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para implementar este plan tarea a tarea. Los pasos usan casillas (`- [ ]`) para el seguimiento.

Objetivo: construir el pipeline que permite generar lecciones de Traze con Claude desde una sesión normal de Claude Code o desde un chat de una cuenta gratuita, y que solo deja entrar en `contenido/` las que pasan todos los controles del spec.

Arquitectura: Claude es el generador y el repositorio pone las herramientas, sin claves de API ni llamadas de red. Un «prompt maestro» (y una skill para Claude Code) se genera a partir de un catálogo de vocabulario que se comprueba contra el esquema Zod. El validador del Plan 1 se amplía con un chequeo de render y un informe de texto pensado para pegarlo de vuelta en el chat. Los borradores viven en `generacion/borradores/` y un comando los promueve a `contenido/` solo si no tienen errores, anotando versión y estado de revisión en la propia lección.

Stack: el del Plan 1 (TypeScript estricto, pnpm 9, Node 20, Vitest 2, Zod 3, tsx). No se añade ninguna dependencia.

Requisito previo: el Plan 1 está ejecutado y `pnpm test` pasa en verde (22 tests en `geometria`, 21 en `lecciones` y 40 en `web`).

## Alcance y decisiones fijadas

| Cubre este plan | Queda para los planes siguientes |
| --- | --- |
| Los cinco controles de «Generación del contenido con IA» del spec: borrador, tests numéricos, render, revisión humana y versionado | Generar las lecciones del temario, mapa del temario, biblioteca de consejos y SEO (Plan 3) |
| Prompt maestro y skill `dibujo-tecnico` generados del mismo vocabulario | Ampliar el vocabulario (tangencias, diédrico...) según lo pida cada lección (Plan 3). Este plan deja listo el proceso para hacerlo |
| Informe de errores para pegar en el chat, promoción, revisión y versionado | Puntos arrastrables, PWA, auditorías y lanzamiento (Plan 4) |

Cobertura del spec:

| Control del spec («Generación del contenido con IA») | Dónde se cumple |
| --- | --- |
| 1. La skill produce el borrador en el formato declarativo | Tareas 2 y 8: vocabulario, prompt maestro y skill |
| 2. Tests numéricos de cada propiedad geométrica | Plan 1 (`ejecutarComprobaciones`); este plan los incorpora al informe (Tarea 5) |
| 3. Renderizado automático: sin etiquetas solapadas ni trazos fuera del lienzo | Tarea 4: `comprobarRender`, que forma parte de `procesarLeccion` |
| 4. Revisión humana de muestra, con prioridad en tangencias y diédrico | Tarea 7: `meta.revision`, `pnpm revisar` y `pnpm estado` (bloques 5 y 7 con prioridad) |
| 5. Cada lección guarda su versión para regenerarla | Tareas 1 y 6: `meta.version` y `pnpm promover --reemplazar` |

Decisiones fijadas para todo el plan:

- Claude es el generador: el repositorio no llama a ninguna API ni guarda claves. El flujo funciona igual con Claude Code (la skill escribe el borrador y ejecuta el validador) que con un chat gratuito (el prompt maestro se pega y la persona hace de puente con el validador).
- La IA describe construcciones, nunca coordenadas calculadas. Si un trazado necesita algo que el vocabulario no tiene, Claude responde `VOCABULARIO_INSUFICIENTE:` en lugar de inventar. El validador reconoce esa marca.
- El prompt maestro y la skill se generan con `pnpm prompt` a partir de `vocabulario.ts`, y un test comprueba que el catálogo coincide con el esquema Zod y que los archivos generados están al día. Así el prompt nunca se desincroniza del esquema.
- Barrera física: `contenido/` solo recibe lecciones que pasan `procesarLeccion` (esquema, intérprete, comprobaciones numéricas y chequeo de render). Los borradores viven en `generacion/borradores/`, fuera de `contenido/`, y la web no cambia.
- La clave `meta` de la lección (`version` y `revision`) la escribe solo el sistema. Un borrador que traiga `meta` se rechaza, para que una IA no pueda marcarse una lección como revisada.
- Las comprobaciones nunca se debilitan para que una lección pase: el informe lo recuerda y el prompt lo prohíbe.
- El informe del validador es texto plano con formato estable: está pensado para pegarse tal cual en el chat y recibir la lección corregida.
- Los avisos (consejo ausente, pocos pasos, requisitos desconocidos...) no bloquean; los errores sí.
- Los bloques 5 (tangencias) y 7 (diédrico) tienen prioridad de revisión humana, como pide el spec.
- Solo los archivos `*-cli.ts` y `almacen.ts` del paquete `lecciones` tocan el sistema de archivos. Ninguno de ellos se exporta desde `index.ts`, y la web no los importa.
- Los comandos que reciben rutas las resuelven desde el directorio donde se lanzó pnpm (`INIT_CWD`), porque `pnpm --filter` cambia el directorio de trabajo.

## Mapa de archivos

Cada archivo tiene una sola responsabilidad. Los tests nuevos viven en `packages/lecciones/test/`.

| Archivo | Responsabilidad | Tarea |
| --- | --- | --- |
| `packages/lecciones/src/esquema.ts` (modificar) | Exporta los esquemas de derivados y comprobaciones y añade `meta` a la lección | 1 |
| `packages/lecciones/src/vocabulario.ts` | Catálogo de primitivas, derivados, comprobaciones y campos, con descripción y ejemplo | 2 |
| `packages/lecciones/src/extraer.ts` | Saca el JSON de un texto pegado desde un chat | 3 |
| `packages/lecciones/src/rotulos.ts` | Medidas de las etiquetas, compartidas por el chequeo y por el lienzo | 4 |
| `packages/lecciones/src/render.ts` | `comprobarRender`: etiquetas solapadas y trazos fuera del lienzo | 4 |
| `packages/lecciones/src/procesar.ts` (modificar) | Añade el chequeo de render a `procesarLeccion` | 4 |
| `apps/web/src/componentes/Lienzo.tsx`, `apps/web/src/app/globals.css` (modificar) | El lienzo usa las medidas compartidas de las etiquetas | 4 |
| `packages/lecciones/src/borrador.ts` | `comprobarBorrador`, avisos e informe de texto | 5 |
| `packages/lecciones/src/promover.ts` | Reglas de promoción, carpetas por bloque y versionado | 6 |
| `packages/lecciones/src/revisar.ts` | Marca una lección como revisada | 7 |
| `packages/lecciones/src/estado.ts` | Resumen del estado de revisión con prioridades | 7 |
| `packages/lecciones/src/prompt.ts` | Construye el prompt maestro y la skill | 8 |
| `packages/lecciones/src/prompt-cli.ts` | Comando `pnpm prompt`: escribe el prompt y la skill | 8 |
| `generacion/prompt-leccion.md`, `generacion/skill/dibujo-tecnico/SKILL.md` | Archivos generados (se versionan) | 8 |
| `packages/lecciones/src/almacen.ts` | Único módulo de lectura y escritura de archivos del paquete, junto con los comandos | 9 |
| `packages/lecciones/src/comprobar-cli.ts`, `promover-cli.ts`, `revisar-cli.ts`, `estado-cli.ts` | Comandos `pnpm comprobar`, `promover`, `revisar` y `estado` | 9 |
| `generacion/LEEME.md`, `generacion/borradores/.gitkeep`, `.gitignore` | Guía de uso y carpeta de borradores | 9 |

## Tarea 1: `meta` en la lección y esquemas exportables

Archivos:

- Modificar: `packages/lecciones/src/esquema.ts`
- Test: `packages/lecciones/test/meta.test.ts`

`meta` guarda la versión de la lección y su estado de revisión. Es opcional en el JSON (por defecto, versión 1 y revisión pendiente), así que la lección piloto no cambia. Los esquemas de derivados y comprobaciones se exportan porque la Tarea 2 los usa para comprobar el vocabulario.

- [ ] Paso 1: escribir el test que falla

`packages/lecciones/test/meta.test.ts`:

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

describe('meta de la lección', () => {
  it('aplica los valores por defecto cuando la lección no trae meta', () => {
    const resultado = validarLeccion(piloto);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.leccion.meta).toEqual({ version: 1, revision: 'pendiente' });
  });

  it('acepta una lección revisada con su revisor y su fecha', () => {
    const datos = copia();
    datos.meta = { version: 3, revision: 'revisada', revisadaPor: 'Ana', revisadaEl: '2026-10-12' };
    const resultado = validarLeccion(datos);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.leccion.meta.version).toBe(3);
    expect(resultado.leccion.meta.revisadaPor).toBe('Ana');
  });

  it('rechaza una versión que no es un entero positivo', () => {
    const datos = copia();
    datos.meta = { version: 0 };
    expect(errores(datos).some((e) => e.startsWith('meta.version:'))).toBe(true);
  });

  it('rechaza una fecha de revisión mal escrita', () => {
    const datos = copia();
    datos.meta = { revision: 'revisada', revisadaPor: 'Ana', revisadaEl: '12/10/2026' };
    expect(errores(datos)).toContain('meta.revisadaEl: la fecha va como AAAA-MM-DD');
  });

  it('rechaza una lección marcada como revisada sin revisor ni fecha', () => {
    const datos = copia();
    datos.meta = { revision: 'revisada' };
    expect(errores(datos)).toContain('meta: una lección revisada necesita revisadaPor y revisadaEl');
  });
});
```

- [ ] Paso 2: ejecutar el test y comprobar que falla

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: los 5 tests de `meta.test.ts` FALLAN (la lección todavía no tiene `meta`); los 21 anteriores siguen pasando.

- [ ] Paso 3: exportar los esquemas de derivados y comprobaciones

En `packages/lecciones/src/esquema.ts`, cambia estas dos líneas.

Antes:

```ts
const derivadoSchema = z.discriminatedUnion('tipo', [
```

Después:

```ts
export const derivadoSchema = z.discriminatedUnion('tipo', [
```

Antes:

```ts
const comprobacionSchema = z.discriminatedUnion('tipo', [
```

Después:

```ts
export const comprobacionSchema = z.discriminatedUnion('tipo', [
```

- [ ] Paso 4: añadir el esquema de `meta`

En el mismo archivo, justo antes de `export const leccionSchema = z`, inserta el esquema.

Antes:

```ts
export const leccionSchema = z
  .object({
```

Después:

```ts
export const metaSchema = z
  .object({
    version: z.number().int().min(1).default(1),
    revision: z.enum(['pendiente', 'revisada']).default('pendiente'),
    revisadaPor: z.string().min(1).optional(),
    revisadaEl: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'la fecha va como AAAA-MM-DD')
      .optional(),
  })
  .superRefine((meta, ctx) => {
    if (meta.revision === 'revisada' && (!meta.revisadaPor || !meta.revisadaEl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'una lección revisada necesita revisadaPor y revisadaEl',
      });
    }
  });

export const leccionSchema = z
  .object({
```

- [ ] Paso 5: añadir `meta` al esquema de la lección

En el mismo archivo.

Antes:

```ts
    comprobaciones: z.array(comprobacionSchema).min(1),
  })
  .superRefine((leccion, ctx) => {
```

Después:

```ts
    comprobaciones: z.array(comprobacionSchema).min(1),
    meta: metaSchema.default({}),
  })
  .superRefine((leccion, ctx) => {
```

- [ ] Paso 6: ejecutar el test y comprobar que pasa

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `26 passed` (21 anteriores y 5 de `meta`).

- [ ] Paso 7: comprobar tipos y confirmar

```bash
pnpm --filter @traze/lecciones typecheck
git add packages/lecciones
git commit -m "feat(lecciones): meta de version y revision, y esquemas exportables"
```

## Tarea 2: vocabulario y su sincronía con el esquema

Archivos:

- Crear: `packages/lecciones/src/vocabulario.ts`
- Test: `packages/lecciones/test/vocabulario.test.ts`

El vocabulario es lo único que el prompt maestro le cuenta a Claude sobre el formato. Si el esquema cambia y el vocabulario no, los tests fallan: así el prompt nunca enseña algo que el validador rechaza. Cada ejemplo se valida contra su esquema.

- [ ] Paso 1: escribir el test que falla

`packages/lecciones/test/vocabulario.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  comprobacionSchema,
  derivadoSchema,
  leccionSchema,
  primitivaSchema,
} from '../src/esquema';
import {
  CAMPOS_LECCION,
  COMPROBACIONES,
  DERIVADOS,
  PRIMITIVAS,
  type EntradaVocabulario,
} from '../src/vocabulario';

type Opcion = { shape: { tipo: { value: string } } };

const tiposDelVocabulario = (entradas: readonly EntradaVocabulario[]) =>
  entradas.map((entrada) => entrada.tipo).sort();
const tiposDelEsquema = (opciones: readonly Opcion[]) =>
  opciones.map((opcion) => opcion.shape.tipo.value).sort();

describe('sincronía del vocabulario con el esquema', () => {
  it('documenta exactamente las primitivas del esquema', () => {
    expect(tiposDelVocabulario(PRIMITIVAS)).toEqual(tiposDelEsquema(primitivaSchema.options));
  });

  it('documenta exactamente los derivados del esquema', () => {
    expect(tiposDelVocabulario(DERIVADOS)).toEqual(tiposDelEsquema(derivadoSchema.options));
  });

  it('documenta exactamente las comprobaciones del esquema', () => {
    expect(tiposDelVocabulario(COMPROBACIONES)).toEqual(
      tiposDelEsquema(comprobacionSchema.options),
    );
  });

  it('documenta exactamente los campos de la lección, salvo meta', () => {
    const delEsquema = Object.keys(leccionSchema.innerType().shape)
      .filter((campo) => campo !== 'meta')
      .sort();
    expect(CAMPOS_LECCION.map((campo) => campo.nombre).sort()).toEqual(delEsquema);
  });

  it('describe cada entrada con campos y descripción', () => {
    for (const entrada of [...PRIMITIVAS, ...DERIVADOS, ...COMPROBACIONES]) {
      expect(entrada.campos.length, entrada.tipo).toBeGreaterThan(0);
      expect(entrada.descripcion.length, entrada.tipo).toBeGreaterThan(0);
    }
    for (const campo of CAMPOS_LECCION) {
      expect(campo.descripcion.length, campo.nombre).toBeGreaterThan(0);
    }
  });
});

describe('ejemplos del vocabulario', () => {
  for (const entrada of PRIMITIVAS) {
    it(`el ejemplo de la primitiva ${entrada.tipo} es válido`, () => {
      expect(primitivaSchema.safeParse(entrada.ejemplo).success).toBe(true);
    });
  }

  for (const entrada of DERIVADOS) {
    it(`el ejemplo del derivado ${entrada.tipo} es válido`, () => {
      expect(derivadoSchema.safeParse(entrada.ejemplo).success).toBe(true);
    });
  }

  for (const entrada of COMPROBACIONES) {
    it(`el ejemplo de la comprobación ${entrada.tipo} es válido`, () => {
      expect(comprobacionSchema.safeParse(entrada.ejemplo).success).toBe(true);
    });
  }
});
```

- [ ] Paso 2: ejecutar el test y comprobar que falla

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `vocabulario.test.ts` FALLA con un error de importación porque `../src/vocabulario` no existe; los 26 anteriores siguen pasando.

- [ ] Paso 3: escribir el vocabulario

`packages/lecciones/src/vocabulario.ts`:

```ts
export const MARCA_VOCABULARIO = 'VOCABULARIO_INSUFICIENTE';

export const BLOQUES_TEMARIO = [
  'Primeros pasos',
  'Trazados fundamentales',
  'Polígonos',
  'Proporcionalidad y escalas',
  'Transformaciones',
  'Tangencias y enlaces',
  'Curvas técnicas y cónicas',
  'Sistema diédrico',
  'Axonometría y caballera',
  'Normalización',
] as const;

export interface EntradaVocabulario {
  tipo: string;
  campos: string;
  descripcion: string;
  ejemplo: unknown;
}

export interface CampoLeccion {
  nombre: string;
  obligatorio: boolean;
  descripcion: string;
}

export const CAMPOS_LECCION: readonly CampoLeccion[] = [
  {
    nombre: 'id',
    obligatorio: true,
    descripcion: 'Identificador en minúsculas y con guiones, por ejemplo «mediatriz-segmento».',
  },
  {
    nombre: 'bloque',
    obligatorio: true,
    descripcion: 'Número del bloque del temario, de 0 a 9 (tabla más abajo).',
  },
  {
    nombre: 'titulo',
    obligatorio: true,
    descripcion: 'Título corto de la lección, por ejemplo «Mediatriz de un segmento».',
  },
  {
    nombre: 'enunciado',
    obligatorio: true,
    descripcion: 'Qué datos hay y qué se pide, en una o dos frases.',
  },
  {
    nombre: 'ideaClave',
    obligatorio: true,
    descripcion: 'La propiedad geométrica que sostiene el trazado, en una línea.',
  },
  {
    nombre: 'requisitos',
    obligatorio: false,
    descripcion: 'Lista de ids de lecciones previas que ya existan; [] si no hay ninguna.',
  },
  {
    nombre: 'lienzo',
    obligatorio: false,
    descripcion: '{ "ancho": 210, "alto": 140 } en milímetros. No lo cambies sin necesidad.',
  },
  {
    nombre: 'datos',
    obligatorio: true,
    descripcion:
      'Puntos de partida, por ejemplo { "A": [60, 70] }, en milímetros. Son las únicas coordenadas de la lección.',
  },
  {
    nombre: 'radios',
    obligatorio: false,
    descripcion:
      'Aberturas de compás: { "r": { "entre": ["A", "B"], "factor": 0.75 } }. El radio vale factor × distancia(A, B).',
  },
  {
    nombre: 'derivados',
    obligatorio: false,
    descripcion:
      'Puntos que calcula el programa, en orden: cada uno solo puede usar puntos ya definidos en «datos» o en derivados anteriores.',
  },
  {
    nombre: 'pasos',
    obligatorio: true,
    descripcion:
      'De 6 a 10 pasos. Cada paso lleva «titulo», «texto», «porque», «consejo» y «dibujo» (lista de primitivas).',
  },
  {
    nombre: 'errores',
    obligatorio: false,
    descripcion: 'Errores frecuentes del alumno: 2 o 3 frases concretas.',
  },
  {
    nombre: 'comprobaciones',
    obligatorio: true,
    descripcion: 'Al menos 2 propiedades que el programa verifica numéricamente.',
  },
];

export const PRIMITIVAS: readonly EntradaVocabulario[] = [
  {
    tipo: 'punto',
    campos: 'id, etiqueta (opcional), estilo (opcional; por defecto «dato»)',
    descripcion:
      'Dibuja un punto ya definido (en «datos» o en «derivados») y rotula su letra. Si omites «etiqueta», se usa el id.',
    ejemplo: { tipo: 'punto', id: 'A' },
  },
  {
    tipo: 'segmento',
    campos: 'desde, hasta, estilo (opcional; por defecto «dato»)',
    descripcion: 'Dibuja el segmento entre dos puntos.',
    ejemplo: { tipo: 'segmento', desde: 'A', hasta: 'B', estilo: 'dato' },
  },
  {
    tipo: 'recta',
    campos: 'por [P, Q], extension (opcional, mm), estilo (opcional; por defecto «resultado»)',
    descripcion:
      'Dibuja la recta que pasa por dos puntos. «extension» son los milímetros que se prolonga por cada extremo.',
    ejemplo: { tipo: 'recta', por: ['M', 'N'], extension: 8, estilo: 'resultado' },
  },
  {
    tipo: 'arco',
    campos:
      'centro, radio (id de un radio), hacia (punto), amplitud (opcional, radianes), estilo (opcional; por defecto «construccion»)',
    descripcion:
      'Arco de compás con centro en un punto y el radio indicado. «hacia» debe estar exactamente a esa distancia del centro: el arco se dibuja alrededor de ese punto, con «amplitud» radianes a cada lado (por defecto 0.32).',
    ejemplo: { tipo: 'arco', centro: 'A', radio: 'r', hacia: 'M' },
  },
  {
    tipo: 'marcaAnguloRecto',
    campos: 'vertice, hacia1, hacia2',
    descripcion:
      'Cuadradito de ángulo recto en el vértice, entre las direcciones hacia dos puntos.',
    ejemplo: { tipo: 'marcaAnguloRecto', vertice: 'O', hacia1: 'B', hacia2: 'M' },
  },
  {
    tipo: 'marcaIgualdad',
    campos: 'segmento [P, Q]',
    descripcion:
      'Pequeña marca transversal en el punto medio de un segmento. Dos segmentos con la marca se leen como iguales.',
    ejemplo: { tipo: 'marcaIgualdad', segmento: ['A', 'O'] },
  },
];

export const DERIVADOS: readonly EntradaVocabulario[] = [
  {
    tipo: 'puntoMedio',
    campos: 'id, entre [P, Q]',
    descripcion: 'Crea el punto medio del segmento PQ.',
    ejemplo: { tipo: 'puntoMedio', id: 'O', entre: ['A', 'B'] },
  },
  {
    tipo: 'interseccionArcos',
    campos: 'ids [M, N], centros [P, Q], radio (id de un radio)',
    descripcion:
      'Crea los dos puntos donde se cortan los arcos de ese radio con centro en P y en Q. El primero (M) queda a la izquierda al mirar de P a Q en pantalla y el segundo (N) a la derecha. Si el radio no es mayor que la mitad de PQ, la construcción es imposible.',
    ejemplo: { tipo: 'interseccionArcos', ids: ['M', 'N'], centros: ['A', 'B'], radio: 'r' },
  },
];

export const COMPROBACIONES: readonly EntradaVocabulario[] = [
  {
    tipo: 'equidistante',
    campos: 'punto, a, b',
    descripcion: 'Comprueba que «punto» está a la misma distancia de «a» que de «b».',
    ejemplo: { tipo: 'equidistante', punto: 'M', a: 'A', b: 'B' },
  },
  {
    tipo: 'perpendicular',
    campos: 'recta [P, Q], segmento [A, B]',
    descripcion: 'Comprueba que la recta PQ es perpendicular al segmento AB.',
    ejemplo: { tipo: 'perpendicular', recta: ['M', 'N'], segmento: ['A', 'B'] },
  },
  {
    tipo: 'pasaPorPuntoMedio',
    campos: 'recta [P, Q], segmento [A, B]',
    descripcion: 'Comprueba que la recta PQ pasa por el punto medio del segmento AB.',
    ejemplo: { tipo: 'pasaPorPuntoMedio', recta: ['M', 'N'], segmento: ['A', 'B'] },
  },
];
```

- [ ] Paso 4: ejecutar el test y comprobar que pasa

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `42 passed` (26 anteriores y 16 de `vocabulario`: 5 de sincronía y 11 ejemplos).

- [ ] Paso 5: comprobar tipos y confirmar

```bash
pnpm --filter @traze/lecciones typecheck
git add packages/lecciones
git commit -m "feat(lecciones): catalogo de vocabulario sincronizado con el esquema"
```

## Tarea 3: extraer el JSON de un texto pegado

Archivos:

- Crear: `packages/lecciones/src/extraer.ts`
- Test: `packages/lecciones/test/extraer.test.ts`

Desde un chat se copia la respuesta entera de Claude, con su bloque de código y a veces una frase antes y otra después. `extraerJson` busca el objeto: prefiere el último bloque de código que sea un objeto JSON válido (si Claude ha corregido varias veces, vale la última), y si no hay bloques usa lo que haya entre la primera `{` y la última `}`.

- [ ] Paso 1: escribir el test que falla

`packages/lecciones/test/extraer.test.ts`:

````ts
import { describe, expect, it } from 'vitest';
import { extraerJson } from '../src/extraer';

describe('extraerJson', () => {
  it('lee un objeto JSON plano', () => {
    expect(extraerJson('{ "id": "a" }')).toEqual({ ok: true, datos: { id: 'a' } });
  });

  it('lee el bloque ```json de una respuesta con texto alrededor', () => {
    const respuesta = 'Aquí tienes:\n\n```json\n{ "id": "a" }\n```\n\n¿Quieres cambios?';
    expect(extraerJson(respuesta)).toEqual({ ok: true, datos: { id: 'a' } });
  });

  it('lee un bloque de código sin indicar el lenguaje', () => {
    expect(extraerJson('```\n{ "id": "a" }\n```')).toEqual({ ok: true, datos: { id: 'a' } });
  });

  it('con varios bloques se queda con el último válido', () => {
    const respuesta = '```json\n{ "version": 1 }\n```\ncorrección:\n```json\n{ "version": 2 }\n```';
    expect(extraerJson(respuesta)).toEqual({ ok: true, datos: { version: 2 } });
  });

  it('lee el objeto aunque no haya bloque de código', () => {
    expect(extraerJson('Mira esto: { "id": "a" } y ya.')).toEqual({
      ok: true,
      datos: { id: 'a' },
    });
  });

  it('ignora una marca de orden de bytes al principio', () => {
    expect(extraerJson('\uFEFF{ "id": "a" }')).toEqual({ ok: true, datos: { id: 'a' } });
  });

  it('rechaza un texto vacío', () => {
    expect(extraerJson('   \n ')).toEqual({ ok: false, error: 'el texto está vacío' });
  });

  it('rechaza un texto sin ningún objeto', () => {
    expect(extraerJson('hola')).toEqual({
      ok: false,
      error: 'no se encuentra ningún objeto JSON (falta el bloque ```json)',
    });
  });

  it('explica por qué un JSON roto no es válido', () => {
    const resultado = extraerJson('```json\n{ "id": \n```');
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.error.startsWith('JSON no válido:')).toBe(true);
  });

  it('rechaza un JSON que no es un objeto', () => {
    expect(extraerJson('```json\n[1, 2]\n```')).toEqual({
      ok: false,
      error: 'el JSON no es un objeto',
    });
  });
});
````

- [ ] Paso 2: ejecutar el test y comprobar que falla

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `extraer.test.ts` FALLA porque `../src/extraer` no existe; los 42 anteriores siguen pasando.

- [ ] Paso 3: escribir la implementación

`packages/lecciones/src/extraer.ts`:

````ts
export type ResultadoExtraccion =
  | { ok: true; datos: Record<string, unknown> }
  | { ok: false; error: string };

const BLOQUE_CODIGO = /```[A-Za-z]*[ \t]*\r?\n([\s\S]*?)```/g;

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

export function extraerJson(texto: string): ResultadoExtraccion {
  const limpio = texto.replace(/^\uFEFF/, '').trim();
  if (limpio === '') return { ok: false, error: 'el texto está vacío' };

  const bloques = [...limpio.matchAll(BLOQUE_CODIGO)].map((m) => m[1].trim()).reverse();
  const inicio = limpio.indexOf('{');
  const fin = limpio.lastIndexOf('}');
  const entreLlaves = inicio !== -1 && fin > inicio ? [limpio.slice(inicio, fin + 1)] : [];
  const candidatos = [...bloques, ...entreLlaves];

  if (candidatos.length === 0) {
    return { ok: false, error: 'no se encuentra ningún objeto JSON (falta el bloque ```json)' };
  }

  let motivo = '';
  for (const candidato of candidatos) {
    try {
      const datos: unknown = JSON.parse(candidato);
      if (esObjeto(datos)) return { ok: true, datos };
      motivo = 'el JSON no es un objeto';
    } catch (error) {
      motivo = `JSON no válido: ${(error as Error).message}`;
    }
  }
  return { ok: false, error: motivo };
}
````

- [ ] Paso 4: ejecutar el test y comprobar que pasa

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `52 passed` (42 anteriores y 10 de `extraer`).

- [ ] Paso 5: comprobar tipos y confirmar

```bash
pnpm --filter @traze/lecciones typecheck
git add packages/lecciones
git commit -m "feat(lecciones): extraer el json de una respuesta pegada desde un chat"
```

## Tarea 4: chequeo de render y medidas compartidas de las etiquetas

Archivos:

- Crear: `packages/lecciones/src/rotulos.ts`, `packages/lecciones/src/render.ts`
- Modificar: `packages/lecciones/src/procesar.ts`, `packages/lecciones/package.json`
- Modificar: `apps/web/src/componentes/Lienzo.tsx`, `apps/web/src/app/globals.css`
- Test: `packages/lecciones/test/rotulos.test.ts`, `packages/lecciones/test/render.test.ts`, `packages/lecciones/test/procesar-render.test.ts`

Es el control 3 del spec: sin etiquetas solapadas ni trazos fuera del lienzo. `comprobarRender` trabaja sobre la lección ya interpretada y se llama desde `procesarLeccion`, así que lo ejecutan por igual el comando de validación, el de comprobación de borradores y el `build` de la web (la regla «un trazado incorrecto no se publica» sigue viviendo en un solo sitio).

Para saber dónde cae cada etiqueta hacen falta sus medidas. El `Lienzo` las tenía escritas a mano (`x + 2`, `y - 2.5` y `font-size: 5px` en el CSS), así que este plan las mueve a `rotulos.ts` y el `Lienzo` las lee de ahí: no pueden descuadrarse. La caja de una etiqueta es una aproximación (el ancho de la letra depende de la fuente), por eso el chequeo deja `MARGEN_ROTULOS` de holgura.

Decisiones de esta tarea:

- Margen mínimo respecto al borde del lienzo: 3 mm (grosor del trazo y desplazamiento del filtro de lápiz).
- Se comprueba el dibujo completo de la lección. Como cada paso conserva visibles los anteriores, las etiquetas que conviven al final son las únicas que pueden pisarse.
- Las marcas de ángulo recto y de igualdad se comprueban solo por su punto de anclaje: son pequeñas y se anclan a puntos que ya están dentro.

- [ ] Paso 1: escribir los tests que fallan

`packages/lecciones/test/rotulos.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ROTULO, cajaDeRotulo } from '../src/rotulos';

describe('cajaDeRotulo', () => {
  it('coloca la caja a la derecha y por encima del punto', () => {
    const caja = cajaDeRotulo(10, 20, 'A');
    expect(caja.x1).toBeCloseTo(10 + ROTULO.dx, 9);
    expect(caja.x2).toBeCloseTo(10 + ROTULO.dx + ROTULO.tamano * ROTULO.anchoCaracter, 9);
    expect(caja.y1).toBeCloseTo(20 + ROTULO.dy - ROTULO.ascenso * ROTULO.tamano, 9);
    expect(caja.y2).toBeCloseTo(20 + ROTULO.dy + ROTULO.descenso * ROTULO.tamano, 9);
  });

  it('ensancha la caja con cada letra de la etiqueta', () => {
    const una = cajaDeRotulo(0, 0, 'A');
    const dos = cajaDeRotulo(0, 0, 'T1');
    expect(dos.x2 - dos.x1).toBeCloseTo(2 * (una.x2 - una.x1), 9);
  });
});
```

`packages/lecciones/test/render.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import { interpretarLeccion, type LeccionResuelta, type PrimitivaResuelta } from '../src/interpretar';
import { comprobarRender } from '../src/render';
import { validarLeccion } from '../src/validar';

function pilotoResuelto(): LeccionResuelta {
  const resultado = validarLeccion(piloto);
  if (!resultado.ok) throw new Error(resultado.errores.join('\n'));
  return interpretarLeccion(resultado.leccion);
}

function leccionCon(...pasos: PrimitivaResuelta[][]): LeccionResuelta {
  return {
    id: 'prueba',
    titulo: 'Prueba',
    lienzo: { ancho: 210, alto: 140 },
    puntos: {},
    radios: {},
    pasos: pasos.map((dibujo) => ({ titulo: 't', texto: 't', porque: 'p', dibujo })),
  };
}

const punto = (id: string, x: number, y: number): PrimitivaResuelta => ({
  tipo: 'punto',
  id,
  etiqueta: id,
  x,
  y,
  estilo: 'dato',
});

describe('comprobarRender', () => {
  it('no encuentra problemas en la lección piloto', () => {
    expect(comprobarRender(pilotoResuelto())).toEqual([]);
  });

  it('detecta etiquetas que se pisan', () => {
    const problemas = comprobarRender(leccionCon([punto('A', 50, 50), punto('B', 52, 50)]));
    expect(problemas).toEqual([
      { tipo: 'etiquetasSolapadas', mensaje: 'las etiquetas «A» y «B» se solapan' },
    ]);
  });

  it('acepta etiquetas separadas', () => {
    expect(comprobarRender(leccionCon([punto('A', 50, 50), punto('B', 80, 50)]))).toEqual([]);
  });

  it('no solapa un punto consigo mismo cuando se repite en dos pasos', () => {
    expect(comprobarRender(leccionCon([punto('A', 50, 50)], [punto('A', 50, 50)]))).toEqual([]);
  });

  it('detecta un segmento que se sale del lienzo', () => {
    const problemas = comprobarRender(
      leccionCon([{ tipo: 'segmento', x1: 20, y1: 20, x2: 215, y2: 20, estilo: 'dato' }]),
    );
    expect(problemas).toHaveLength(1);
    expect(problemas[0].tipo).toBe('fueraDelLienzo');
    expect(problemas[0].mensaje).toContain('pasos.0.dibujo.0');
  });

  it('mide el arco por sus extremos y por su punto más alto', () => {
    const arco = (radio: number): PrimitivaResuelta => ({
      tipo: 'arco',
      cx: 100,
      cy: 70,
      radio,
      inicio: -Math.PI / 2 - 0.3,
      fin: -Math.PI / 2 + 0.3,
      estilo: 'construccion',
    });
    expect(comprobarRender(leccionCon([arco(60)]))).toEqual([]);
    expect(comprobarRender(leccionCon([arco(68)]))).toHaveLength(1);
  });

  it('detecta una etiqueta que se sale por la derecha aunque su punto esté dentro', () => {
    expect(comprobarRender(leccionCon([punto('A', 207, 70)]))).toEqual([
      {
        tipo: 'fueraDelLienzo',
        mensaje: 'pasos.0.dibujo.0: la etiqueta «A» se sale del lienzo',
      },
    ]);
  });
});
```

`packages/lecciones/test/procesar-render.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import { procesarLeccion } from '../src/procesar';

describe('procesarLeccion con el chequeo de render', () => {
  it('sigue aceptando la lección piloto', () => {
    expect(procesarLeccion(piloto).ok).toBe(true);
  });

  it('rechaza una lección cuyo dibujo se sale del lienzo', () => {
    const datos: any = structuredClone(piloto);
    datos.datos.B = [205, 60];
    const resultado = procesarLeccion(datos);
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.errores.length).toBeGreaterThan(0);
    expect(resultado.errores.every((error) => error.startsWith('render: '))).toBe(true);
  });
});
```

- [ ] Paso 2: ejecutar los tests y comprobar que fallan

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `rotulos.test.ts` y `render.test.ts` FALLAN por importación (no existen `../src/rotulos` ni `../src/render`) y el segundo test de `procesar-render.test.ts` FALLA (todavía no hay chequeo de render); los 52 anteriores siguen pasando.

- [ ] Paso 3: escribir las medidas de las etiquetas

`packages/lecciones/src/rotulos.ts`:

```ts
/**
 * Medidas de las etiquetas de los puntos, en milímetros de papel.
 * Las usan el chequeo de render y el Lienzo de la web: así no pueden descuadrarse.
 * El ancho de la letra es una aproximación para rotulación en mayúscula.
 */
export const ROTULO = {
  dx: 2,
  dy: -2.5,
  tamano: 5,
  anchoCaracter: 0.7,
  ascenso: 0.8,
  descenso: 0.2,
} as const;

export interface Caja {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function cajaDeRotulo(x: number, y: number, etiqueta: string): Caja {
  const base = y + ROTULO.dy;
  return {
    x1: x + ROTULO.dx,
    y1: base - ROTULO.ascenso * ROTULO.tamano,
    x2: x + ROTULO.dx + etiqueta.length * ROTULO.tamano * ROTULO.anchoCaracter,
    y2: base + ROTULO.descenso * ROTULO.tamano,
  };
}
```

- [ ] Paso 4: escribir el chequeo de render

`packages/lecciones/src/render.ts`:

```ts
import type { LeccionResuelta, PrimitivaResuelta } from './interpretar';
import { cajaDeRotulo, type Caja } from './rotulos';

export const MARGEN_LIENZO = 3;
export const MARGEN_ROTULOS = 0.5;

export interface ProblemaRender {
  tipo: 'etiquetasSolapadas' | 'fueraDelLienzo';
  mensaje: string;
}

function cajaDePuntos(puntos: readonly { x: number; y: number }[]): Caja {
  const xs = puntos.map((p) => p.x);
  const ys = puntos.map((p) => p.y);
  return { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
}

function cajaDeArco(arco: Extract<PrimitivaResuelta, { tipo: 'arco' }>): Caja {
  const cuarto = Math.PI / 2;
  const desde = Math.min(arco.inicio, arco.fin);
  const hasta = Math.max(arco.inicio, arco.fin);
  const angulos = [arco.inicio, arco.fin];
  for (let k = Math.ceil(desde / cuarto); k * cuarto <= hasta; k++) angulos.push(k * cuarto);
  return cajaDePuntos(
    angulos.map((angulo) => ({
      x: arco.cx + arco.radio * Math.cos(angulo),
      y: arco.cy + arco.radio * Math.sin(angulo),
    })),
  );
}

function cajaDePrimitiva(primitiva: PrimitivaResuelta): Caja {
  switch (primitiva.tipo) {
    case 'punto':
    case 'marcaAnguloRecto':
      return cajaDePuntos([primitiva]);
    case 'segmento':
    case 'recta':
      return cajaDePuntos([
        { x: primitiva.x1, y: primitiva.y1 },
        { x: primitiva.x2, y: primitiva.y2 },
      ]);
    case 'marcaIgualdad':
      return cajaDePuntos([
        { x: (primitiva.x1 + primitiva.x2) / 2, y: (primitiva.y1 + primitiva.y2) / 2 },
      ]);
    case 'arco':
      return cajaDeArco(primitiva);
  }
}

function seSolapan(a: Caja, b: Caja): boolean {
  return (
    a.x1 < b.x2 + MARGEN_ROTULOS &&
    b.x1 < a.x2 + MARGEN_ROTULOS &&
    a.y1 < b.y2 + MARGEN_ROTULOS &&
    b.y1 < a.y2 + MARGEN_ROTULOS
  );
}

export function comprobarRender(leccion: LeccionResuelta): ProblemaRender[] {
  const { ancho, alto } = leccion.lienzo;
  const dentro = (caja: Caja): boolean =>
    caja.x1 >= MARGEN_LIENZO &&
    caja.y1 >= MARGEN_LIENZO &&
    caja.x2 <= ancho - MARGEN_LIENZO &&
    caja.y2 <= alto - MARGEN_LIENZO;

  const problemas: ProblemaRender[] = [];
  const etiquetas = new Map<string, Caja>();

  leccion.pasos.forEach((paso, i) => {
    paso.dibujo.forEach((primitiva, j) => {
      const ruta = `pasos.${i}.dibujo.${j}`;

      if (!dentro(cajaDePrimitiva(primitiva))) {
        problemas.push({
          tipo: 'fueraDelLienzo',
          mensaje: `${ruta}: el trazo «${primitiva.tipo}» se sale del lienzo (deja al menos ${MARGEN_LIENZO} mm de margen en un lienzo de ${ancho} × ${alto} mm)`,
        });
      }

      if (primitiva.tipo === 'punto') {
        const caja = cajaDeRotulo(primitiva.x, primitiva.y, primitiva.etiqueta);
        if (!dentro(caja)) {
          problemas.push({
            tipo: 'fueraDelLienzo',
            mensaje: `${ruta}: la etiqueta «${primitiva.id}» se sale del lienzo`,
          });
        }
        etiquetas.set(primitiva.id, caja);
      }
    });
  });

  const ids = [...etiquetas.keys()];
  for (let a = 0; a < ids.length; a++) {
    for (let b = a + 1; b < ids.length; b++) {
      if (seSolapan(etiquetas.get(ids[a])!, etiquetas.get(ids[b])!)) {
        problemas.push({
          tipo: 'etiquetasSolapadas',
          mensaje: `las etiquetas «${ids[a]}» y «${ids[b]}» se solapan`,
        });
      }
    }
  }

  return problemas;
}
```

- [ ] Paso 5: integrar el chequeo en `procesarLeccion`

Sustituye el contenido de `packages/lecciones/src/procesar.ts` por:

```ts
import type { Leccion } from './esquema';
import {
  ConstruccionImposible,
  ejecutarComprobaciones,
  interpretarLeccion,
  type LeccionResuelta,
  type ResultadoComprobacion,
} from './interpretar';
import { comprobarRender } from './render';
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

    const problemas = comprobarRender(resuelta).map((problema) => `render: ${problema.mensaje}`);
    if (problemas.length > 0) return { ok: false, errores: problemas };

    return { ok: true, leccion: validada.leccion, resuelta, comprobaciones };
  } catch (error) {
    if (error instanceof ConstruccionImposible) {
      return { ok: false, errores: [`construcción imposible: ${error.message}`] };
    }
    throw error;
  }
}
```

- [ ] Paso 6: exponer las medidas como subruta del paquete

`rotulos.ts` no importa nada, así que el navegador puede cargarlo sin arrastrar Zod. En `packages/lecciones/package.json`.

Antes:

```json
    "./interpretar": "./src/interpretar.ts"
```

Después:

```json
    "./interpretar": "./src/interpretar.ts",
    "./rotulos": "./src/rotulos.ts"
```

- [ ] Paso 7: ejecutar los tests y comprobar que pasan

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `63 passed` (52 anteriores y 11 nuevos: 2 de `rotulos`, 7 de `render` y 2 de `procesar-render`).

- [ ] Paso 8: hacer que el `Lienzo` use las medidas compartidas

En `apps/web/src/componentes/Lienzo.tsx`.

Antes:

```tsx
import type { PrimitivaResuelta } from '@traze/lecciones';
```

Después:

```tsx
import type { PrimitivaResuelta } from '@traze/lecciones';
import { ROTULO } from '@traze/lecciones/rotulos';
```

Antes:

```tsx
            <text key={clave} className="rotulo" x={primitiva.x + 2} y={primitiva.y - 2.5}>
```

Después:

```tsx
            <text
              key={clave}
              className="rotulo"
              x={primitiva.x + ROTULO.dx}
              y={primitiva.y + ROTULO.dy}
              fontSize={ROTULO.tamano}
            >
```

En `apps/web/src/app/globals.css`, quita el tamaño fijo (ahora lo pone el atributo `fontSize`; un `font-size` en el CSS lo pisaría).

Antes:

```css
.rotulo {
  font-family: var(--rotulacion);
  font-size: 5px;
  font-style: italic;
  fill: var(--grafito-resultado);
}
```

Después:

```css
.rotulo {
  font-family: var(--rotulacion);
  font-style: italic;
  fill: var(--grafito-resultado);
}
```

- [ ] Paso 9: comprobar la web

Ejecuta:

```bash
pnpm --filter @traze/web typecheck
pnpm --filter @traze/web test
pnpm --filter @traze/web build
```

Esperado: tipos sin errores, `40 passed` en la web y `build` terminado sin errores (la lección piloto pasa el chequeo de render). Después, con `pnpm web`, abre `http://localhost:3000/leccion/mediatriz-segmento` y comprueba a ojo que las letras A, B, M, N y O tienen el mismo tamaño y posición que antes.

- [ ] Paso 10: confirmar

```bash
pnpm --filter @traze/lecciones typecheck
git add packages/lecciones apps/web
git commit -m "feat(lecciones): chequeo de render y medidas compartidas de las etiquetas"
```

## Tarea 5: comprobar un borrador y escribir el informe

Archivos:

- Crear: `packages/lecciones/src/borrador.ts`
- Test: `packages/lecciones/test/borrador.test.ts`

`comprobarBorrador` recibe el texto pegado (con bloque de código, con prosa alrededor o solo el JSON) y devuelve un informe: errores que bloquean y avisos que no. Encadena todo lo anterior: extraer el JSON, rechazar la clave `meta`, y `procesarLeccion` (esquema, intérprete, comprobaciones numéricas y render). `formatearInforme` lo convierte en texto con formato estable, pensado para pegarlo de vuelta en el chat.

Decisiones de esta tarea:

- Una lección con la clave `meta` se rechaza: la versión y el estado de revisión los escribe solo el sistema.
- Si no hay JSON pero el texto trae `VOCABULARIO_INSUFICIENTE`, el informe lo dice como error y no pide corregir el JSON (hay que ampliar el vocabulario o elegir otro trazado).
- Avisos que no bloquean: menos de 6 pasos, paso sin consejo, número de errores frecuentes distinto de 2 o 3, menos de 2 comprobaciones y requisitos que todavía no existen en `contenido/`.
- Las pistas del informe son una por tipo de error y la de las comprobaciones recuerda que no se debilitan.

- [ ] Paso 1: escribir el test que falla

`packages/lecciones/test/borrador.test.ts`:

````ts
import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import { comprobarBorrador, formatearInforme } from '../src/borrador';

const sinContexto = { idsExistentes: [] as string[] };

function copia(): any {
  return structuredClone(piloto);
}

const texto = (datos: unknown): string => JSON.stringify(datos);

describe('comprobarBorrador', () => {
  it('acepta la lección piloto sin errores ni avisos', () => {
    const informe = comprobarBorrador(texto(piloto), sinContexto);
    expect(informe.errores).toEqual([]);
    expect(informe.avisos).toEqual([]);
    expect(informe.id).toBe('mediatriz-segmento');
    expect(informe.leccion).not.toBeNull();
  });

  it('extrae el JSON de una respuesta con texto y bloque de código', () => {
    const respuesta =
      'Aquí tienes la lección:\n\n```json\n' +
      JSON.stringify(piloto, null, 2) +
      '\n```\n\nDime si quieres cambios.';
    expect(comprobarBorrador(respuesta, sinContexto).errores).toEqual([]);
  });

  it('rechaza la clave meta: la gestiona el sistema', () => {
    const datos = copia();
    datos.meta = { version: 1, revision: 'pendiente' };
    const informe = comprobarBorrador(texto(datos), sinContexto);
    expect(informe.errores).toContain('meta: la gestiona el sistema; elimina esta clave');
    expect(informe.leccion).toBeNull();
  });

  it('señala un punto no definido con su paso y su campo', () => {
    const datos = copia();
    datos.pasos[0].dibujo[0] = { tipo: 'segmento', desde: 'A', hasta: 'Z' };
    const informe = comprobarBorrador(texto(datos), sinContexto);
    expect(informe.errores).toEqual(['pasos.0.dibujo.0.hasta: El punto «Z» no está definido']);
  });

  it('señala una construcción imposible', () => {
    const datos = copia();
    datos.radios.r.factor = 0.4;
    const informe = comprobarBorrador(texto(datos), sinContexto);
    expect(informe.errores[0]).toContain('construcción imposible:');
  });

  it('avisa cuando no hay ningún JSON', () => {
    const informe = comprobarBorrador('hola', sinContexto);
    expect(informe.errores).toEqual([
      'json: no se encuentra ningún objeto JSON (falta el bloque ```json)',
    ]);
    expect(informe.id).toBeNull();
  });

  it('reconoce que Claude pide ampliar el vocabulario', () => {
    const informe = comprobarBorrador(
      'VOCABULARIO_INSUFICIENTE: falta la bisectriz de un ángulo',
      sinContexto,
    );
    expect(informe.errores).toEqual([
      'vocabulario: Claude indica que el vocabulario no alcanza para esta lección (falta la bisectriz de un ángulo)',
    ]);
  });

  it('da avisos que no bloquean', () => {
    const datos = copia();
    delete datos.pasos[1].consejo;
    datos.errores = ['Solo uno.'];
    datos.requisitos = ['compas-basico'];
    const informe = comprobarBorrador(texto(datos), sinContexto);
    expect(informe.errores).toEqual([]);
    expect(informe.avisos).toEqual([
      'pasos.1.consejo: falta el consejo de este paso',
      'errores: la lección lista 1; lo habitual son 2 o 3',
      'requisitos.0: «compas-basico» no existe todavía en contenido/',
    ]);
  });

  it('no avisa de un requisito que ya existe', () => {
    const datos = copia();
    datos.requisitos = ['compas-basico'];
    const informe = comprobarBorrador(texto(datos), { idsExistentes: ['compas-basico'] });
    expect(informe.avisos).toEqual([]);
  });
});

describe('formatearInforme', () => {
  it('resume una lección correcta', () => {
    const informe = comprobarBorrador(texto(piloto), sinContexto);
    expect(formatearInforme(informe)).toBe(
      'INFORME DE TRAZE · mediatriz-segmento\nResultado: CORRECTO (0 avisos)',
    );
  });

  it('lista los errores, las pistas y la petición de corrección', () => {
    const datos = copia();
    datos.pasos[0].dibujo[0] = { tipo: 'segmento', desde: 'A', hasta: 'Z' };
    const informe = comprobarBorrador(texto(datos), sinContexto);
    expect(formatearInforme(informe).split('\n')).toEqual([
      'INFORME DE TRAZE · mediatriz-segmento',
      'Resultado: CORREGIR (1 error, 0 avisos)',
      '',
      'Errores (corrígelos todos):',
      '1. pasos.0.dibujo.0.hasta: El punto «Z» no está definido',
      '',
      'Pistas:',
      '- Define cada punto en «datos» o créalo en «derivados» antes de usarlo, y cada radio en «radios».',
      '',
      'Devuelve la lección completa corregida en un único bloque ```json, sin comentarios y sin la clave «meta».',
    ]);
  });

  it('lista los avisos aunque la lección sea correcta', () => {
    const datos = copia();
    datos.errores = ['Solo uno.'];
    const informe = comprobarBorrador(texto(datos), sinContexto);
    expect(formatearInforme(informe).split('\n')).toEqual([
      'INFORME DE TRAZE · mediatriz-segmento',
      'Resultado: CORRECTO (1 aviso)',
      '',
      'Avisos (no bloquean, pero mejóralos si puedes):',
      '- errores: la lección lista 1; lo habitual son 2 o 3',
    ]);
  });

  it('no pide corregir el JSON cuando falta vocabulario', () => {
    const informe = comprobarBorrador('VOCABULARIO_INSUFICIENTE: falta la bisectriz', sinContexto);
    const salida = formatearInforme(informe);
    expect(salida.startsWith('INFORME DE TRAZE · lección sin id')).toBe(true);
    expect(salida).toContain('1. vocabulario: Claude indica');
    expect(salida).not.toContain('Devuelve la lección completa');
  });
});
````

- [ ] Paso 2: ejecutar el test y comprobar que falla

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `borrador.test.ts` FALLA porque `../src/borrador` no existe; los 63 anteriores siguen pasando.

- [ ] Paso 3: escribir la implementación

`packages/lecciones/src/borrador.ts`:

````ts
import type { Leccion } from './esquema';
import { extraerJson } from './extraer';
import { procesarLeccion } from './procesar';
import { MARCA_VOCABULARIO } from './vocabulario';

export interface ContextoBorrador {
  idsExistentes: readonly string[];
}

export interface InformeBorrador {
  id: string | null;
  errores: string[];
  avisos: string[];
  datos: Record<string, unknown> | null;
  leccion: Leccion | null;
}

export function avisosDeLeccion(leccion: Leccion, contexto: ContextoBorrador): string[] {
  const avisos: string[] = [];

  if (leccion.pasos.length < 6) {
    avisos.push(`pasos: la lección tiene ${leccion.pasos.length}; lo habitual son de 6 a 10`);
  }
  leccion.pasos.forEach((paso, i) => {
    if (!paso.consejo) avisos.push(`pasos.${i}.consejo: falta el consejo de este paso`);
  });
  if (leccion.errores.length < 2 || leccion.errores.length > 3) {
    avisos.push(`errores: la lección lista ${leccion.errores.length}; lo habitual son 2 o 3`);
  }
  if (leccion.comprobaciones.length < 2) {
    avisos.push(
      `comprobaciones: solo hay ${leccion.comprobaciones.length}; conviene comprobar al menos 2 propiedades`,
    );
  }
  const conocidos = new Set(contexto.idsExistentes);
  leccion.requisitos.forEach((requisito, i) => {
    if (!conocidos.has(requisito)) {
      avisos.push(`requisitos.${i}: «${requisito}» no existe todavía en contenido/`);
    }
  });

  return avisos;
}

export function comprobarBorrador(texto: string, contexto: ContextoBorrador): InformeBorrador {
  const sinNada: Omit<InformeBorrador, 'errores'> = {
    id: null,
    avisos: [],
    datos: null,
    leccion: null,
  };

  const extraccion = extraerJson(texto);
  if (!extraccion.ok) {
    const indice = texto.indexOf(MARCA_VOCABULARIO);
    if (indice !== -1) {
      const detalle = texto
        .slice(indice + MARCA_VOCABULARIO.length)
        .replace(/^[:\s]+/, '')
        .trim()
        .slice(0, 400);
      return {
        ...sinNada,
        errores: [
          `vocabulario: Claude indica que el vocabulario no alcanza para esta lección${detalle ? ` (${detalle})` : ''}`,
        ],
      };
    }
    return { ...sinNada, errores: [`json: ${extraccion.error}`] };
  }

  const datos = extraccion.datos;
  const errores: string[] = [];
  if (Object.hasOwn(datos, 'meta')) {
    errores.push('meta: la gestiona el sistema; elimina esta clave');
  }

  const proceso = procesarLeccion(datos);
  if (!proceso.ok) errores.push(...proceso.errores);

  return {
    id: typeof datos.id === 'string' ? datos.id : null,
    errores,
    avisos: proceso.ok ? avisosDeLeccion(proceso.leccion, contexto) : [],
    datos,
    leccion: proceso.ok && errores.length === 0 ? proceso.leccion : null,
  };
}

const PISTAS: readonly { patron: RegExp; texto: string }[] = [
  {
    patron: /no está definido/,
    texto:
      'Define cada punto en «datos» o créalo en «derivados» antes de usarlo, y cada radio en «radios».',
  },
  {
    patron: /^construcción imposible/,
    texto:
      'Cambia los datos o el factor del radio para que la construcción exista. Las coordenadas están en milímetros y el lienzo mide 210 × 140.',
  },
  {
    patron: /^comprobaciones:/,
    texto:
      'La construcción no cumple la propiedad. No toques la comprobación: corrige la construcción.',
  },
  {
    patron: /^render:/,
    texto: 'Mueve o reduce los datos para que todo quepa en el lienzo y las etiquetas no se pisen.',
  },
];

const plural = (n: number, singular: string, varios: string): string =>
  `${n} ${n === 1 ? singular : varios}`;

export function formatearInforme(informe: InformeBorrador): string {
  const lineas: string[] = [`INFORME DE TRAZE · ${informe.id ?? 'lección sin id'}`];
  const avisos = plural(informe.avisos.length, 'aviso', 'avisos');

  if (informe.errores.length === 0) {
    lineas.push(`Resultado: CORRECTO (${avisos})`);
  } else {
    const errores = plural(informe.errores.length, 'error', 'errores');
    lineas.push(`Resultado: CORREGIR (${errores}, ${avisos})`, '', 'Errores (corrígelos todos):');
    informe.errores.forEach((error, i) => lineas.push(`${i + 1}. ${error}`));

    const pistas = PISTAS.filter(({ patron }) => informe.errores.some((e) => patron.test(e)));
    if (pistas.length > 0) {
      lineas.push('', 'Pistas:');
      pistas.forEach(({ texto }) => lineas.push(`- ${texto}`));
    }
  }

  if (informe.avisos.length > 0) {
    lineas.push('', 'Avisos (no bloquean, pero mejóralos si puedes):');
    informe.avisos.forEach((aviso) => lineas.push(`- ${aviso}`));
  }

  const pideCorreccion =
    informe.errores.length > 0 && !informe.errores.some((e) => e.startsWith('vocabulario:'));
  if (pideCorreccion) {
    lineas.push(
      '',
      'Devuelve la lección completa corregida en un único bloque ```json, sin comentarios y sin la clave «meta».',
    );
  }

  return lineas.join('\n');
}
````

- [ ] Paso 4: ejecutar el test y comprobar que pasa

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `76 passed` (63 anteriores y 13 de `borrador`: 9 de `comprobarBorrador` y 4 de `formatearInforme`).

- [ ] Paso 5: comprobar tipos y confirmar

```bash
pnpm --filter @traze/lecciones typecheck
git add packages/lecciones
git commit -m "feat(lecciones): comprobar borradores y escribir el informe para pegar en el chat"
```

## Tarea 6: promover un borrador a `contenido/`

Archivos:

- Crear: `packages/lecciones/src/promover.ts`
- Test: `packages/lecciones/test/promover.test.ts`

`prepararPromocion` es la barrera: decide, sin tocar archivos, si un borrador puede entrar en `contenido/`, en qué carpeta, con qué versión y con qué contenido. Un borrador con errores no entra. Si el id ya existe, solo entra con `reemplazar` (regenerar), y la versión sube. La lección promovida siempre sale con `revision: pendiente`, aunque sea una regeneración de otra ya revisada: hay que volver a revisarla.

Las carpetas de `contenido/` siguen el patrón de la lección piloto, `bloque-<número>-<nombre>`. Cambiar una lección de bloque al regenerarla no se soporta: obligaría a borrar la antigua, y eso lo decide una persona.

- [ ] Paso 1: escribir el test que falla

`packages/lecciones/test/promover.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import { comprobarBorrador } from '../src/borrador';
import { carpetaDeBloque, describirExistente, prepararPromocion } from '../src/promover';

const RUTA = 'bloque-1-trazados/mediatriz-segmento.json';

function informe(datos: unknown = piloto) {
  return comprobarBorrador(JSON.stringify(datos), { idsExistentes: [] });
}

describe('prepararPromocion', () => {
  it('promueve un borrador nuevo a la carpeta de su bloque con versión 1', () => {
    const promocion = prepararPromocion(informe(), [], { reemplazar: false });
    expect(promocion.ok).toBe(true);
    if (!promocion.ok) return;
    expect(promocion).toMatchObject({ ruta: RUTA, version: 1, reemplaza: false });
    expect(promocion.contenido.meta).toEqual({ version: 1, revision: 'pendiente' });
  });

  it('conserva las claves del borrador y deja meta al final', () => {
    const promocion = prepararPromocion(informe(), [], { reemplazar: false });
    if (!promocion.ok) throw new Error('se esperaba una promoción válida');
    expect(Object.keys(promocion.contenido)).toEqual([...Object.keys(piloto), 'meta']);
  });

  it('no pisa una lección que ya existe sin --reemplazar', () => {
    const existentes = [{ id: 'mediatriz-segmento', ruta: RUTA, version: 2 }];
    expect(prepararPromocion(informe(), existentes, { reemplazar: false })).toEqual({
      ok: false,
      errores: ['ya existe «mediatriz-segmento» (versión 2); usa --reemplazar para regenerarla'],
    });
  });

  it('con --reemplazar sube la versión y vuelve a dejar la revisión pendiente', () => {
    const existentes = [{ id: 'mediatriz-segmento', ruta: RUTA, version: 2 }];
    const promocion = prepararPromocion(informe(), existentes, { reemplazar: true });
    expect(promocion.ok).toBe(true);
    if (!promocion.ok) return;
    expect(promocion).toMatchObject({ ruta: RUTA, version: 3, reemplaza: true });
    expect(promocion.contenido.meta).toEqual({ version: 3, revision: 'pendiente' });
  });

  it('no cambia una lección de bloque al regenerarla', () => {
    const existentes = [
      { id: 'mediatriz-segmento', ruta: 'bloque-2-poligonos/mediatriz-segmento.json', version: 1 },
    ];
    const promocion = prepararPromocion(informe(), existentes, { reemplazar: true });
    expect(promocion.ok).toBe(false);
    if (promocion.ok) return;
    expect(promocion.errores[0]).toContain('cambiar de bloque');
  });

  it('no promueve un borrador con errores', () => {
    const datos: any = structuredClone(piloto);
    datos.id = 'Mal';
    expect(prepararPromocion(informe(datos), [], { reemplazar: false })).toEqual({
      ok: false,
      errores: ['el borrador tiene errores: pasa `pnpm comprobar` y corrígelos antes de promover'],
    });
  });
});

describe('carpetaDeBloque', () => {
  it('nombra la carpeta con el número y el nombre del bloque', () => {
    expect(carpetaDeBloque(0)).toBe('bloque-0-primeros-pasos');
    expect(carpetaDeBloque(5)).toBe('bloque-5-tangencias');
    expect(carpetaDeBloque(7)).toBe('bloque-7-diedrico');
  });
});

describe('describirExistente', () => {
  it('lee el id y la versión de una lección válida', () => {
    expect(describirExistente('x/y.json', piloto)).toEqual({
      id: 'mediatriz-segmento',
      ruta: 'x/y.json',
      version: 1,
    });
  });

  it('devuelve null si el contenido no es una lección válida', () => {
    expect(describirExistente('x/y.json', {})).toBeNull();
  });
});
```

- [ ] Paso 2: ejecutar el test y comprobar que falla

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `promover.test.ts` FALLA porque `../src/promover` no existe; los 76 anteriores siguen pasando.

- [ ] Paso 3: escribir la implementación

`packages/lecciones/src/promover.ts`:

```ts
import type { InformeBorrador } from './borrador';
import { leccionSchema } from './esquema';

export const CARPETAS_BLOQUE = [
  'primeros-pasos',
  'trazados',
  'poligonos',
  'proporcionalidad',
  'transformaciones',
  'tangencias',
  'curvas',
  'diedrico',
  'axonometria',
  'normalizacion',
] as const;

export function carpetaDeBloque(bloque: number): string {
  return `bloque-${bloque}-${CARPETAS_BLOQUE[bloque]}`;
}

export interface Existente {
  id: string;
  ruta: string;
  version: number;
}

export function describirExistente(ruta: string, datos: unknown): Existente | null {
  const resultado = leccionSchema.safeParse(datos);
  if (!resultado.success) return null;
  return { id: resultado.data.id, ruta, version: resultado.data.meta.version };
}

export type Promocion =
  | {
      ok: true;
      ruta: string;
      version: number;
      reemplaza: boolean;
      contenido: Record<string, unknown>;
    }
  | { ok: false; errores: string[] };

export function prepararPromocion(
  informe: InformeBorrador,
  existentes: readonly Existente[],
  opciones: { reemplazar: boolean },
): Promocion {
  if (informe.errores.length > 0 || !informe.leccion || !informe.datos) {
    return {
      ok: false,
      errores: ['el borrador tiene errores: pasa `pnpm comprobar` y corrígelos antes de promover'],
    };
  }

  const { id, bloque } = informe.leccion;
  const ruta = `${carpetaDeBloque(bloque)}/${id}.json`;
  const previa = existentes.find((existente) => existente.id === id);

  if (previa && !opciones.reemplazar) {
    return {
      ok: false,
      errores: [`ya existe «${id}» (versión ${previa.version}); usa --reemplazar para regenerarla`],
    };
  }
  if (previa && previa.ruta !== ruta) {
    return {
      ok: false,
      errores: [
        `la lección «${id}» está en ${previa.ruta} y el borrador la sitúa en ${ruta}; cambiar de bloque no está soportado: borra la antigua a mano`,
      ],
    };
  }

  const version = previa ? previa.version + 1 : 1;
  return {
    ok: true,
    ruta,
    version,
    reemplaza: previa !== undefined,
    contenido: { ...informe.datos, meta: { version, revision: 'pendiente' } },
  };
}
```

- [ ] Paso 4: ejecutar el test y comprobar que pasa

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `85 passed` (76 anteriores y 9 de `promover`).

- [ ] Paso 5: comprobar tipos y confirmar

```bash
pnpm --filter @traze/lecciones typecheck
git add packages/lecciones
git commit -m "feat(lecciones): promover borradores a contenido con versionado"
```

## Tarea 7: revisión humana y estado de las lecciones

Archivos:

- Crear: `packages/lecciones/src/revisar.ts`, `packages/lecciones/src/estado.ts`
- Test: `packages/lecciones/test/revisar.test.ts`, `packages/lecciones/test/estado.test.ts`

Es el control 4 del spec. `marcarRevisada` deja constancia de quién revisó una lección y cuándo. `resumenEstado` lista las lecciones con su versión y su revisión, y pone primero (con la marca ⚑) las pendientes de los bloques 5 (tangencias) y 7 (diédrico), que son los que el spec manda revisar con prioridad. Ninguna de las dos funciones toca archivos: la fecha la pasa quien las llama.

- [ ] Paso 1: escribir los tests que fallan

`packages/lecciones/test/revisar.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import { marcarRevisada } from '../src/revisar';
import { validarLeccion } from '../src/validar';

function base(meta?: unknown): Record<string, unknown> {
  return { ...structuredClone(piloto), ...(meta ? { meta } : {}) };
}

describe('marcarRevisada', () => {
  it('firma la revisión y conserva la versión', () => {
    const resultado = marcarRevisada(base({ version: 2, revision: 'pendiente' }), 'Ana', '2026-10-12');
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.datos.meta).toEqual({
      version: 2,
      revision: 'revisada',
      revisadaPor: 'Ana',
      revisadaEl: '2026-10-12',
    });
  });

  it('parte de la versión 1 si la lección no tenía meta', () => {
    const resultado = marcarRevisada(base(), 'Ana', '2026-10-12');
    if (!resultado.ok) throw new Error('se esperaba una revisión válida');
    expect(resultado.datos.meta).toMatchObject({ version: 1, revision: 'revisada' });
  });

  it('exige el nombre del revisor', () => {
    expect(marcarRevisada(base(), '   ', '2026-10-12')).toEqual({
      ok: false,
      error: 'falta el nombre del revisor (--por)',
    });
  });

  it('exige una fecha con formato AAAA-MM-DD', () => {
    expect(marcarRevisada(base(), 'Ana', '12/10/2026')).toEqual({
      ok: false,
      error: 'la fecha va como AAAA-MM-DD',
    });
  });

  it('deja una lección que sigue siendo válida', () => {
    const resultado = marcarRevisada(base(), 'Ana', '2026-10-12');
    if (!resultado.ok) throw new Error('se esperaba una revisión válida');
    expect(validarLeccion(resultado.datos).ok).toBe(true);
  });
});
```

`packages/lecciones/test/estado.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import type { Leccion } from '../src/esquema';
import { resumenEstado } from '../src/estado';
import { validarLeccion } from '../src/validar';

const REVISADA = { version: 2, revision: 'revisada', revisadaPor: 'Ana', revisadaEl: '2026-10-12' };

function leccion(id: string, bloque: number, meta?: unknown): Leccion {
  const datos: any = { ...structuredClone(piloto), id, bloque };
  if (meta) datos.meta = meta;
  const resultado = validarLeccion(datos);
  if (!resultado.ok) throw new Error(resultado.errores.join('\n'));
  return resultado.leccion;
}

describe('resumenEstado', () => {
  it('ordena por prioridad de revisión y marca las prioritarias', () => {
    const resumen = resumenEstado([
      leccion('bisectriz-angulo', 1, REVISADA),
      leccion('mediatriz-segmento', 1),
      leccion('tangencia-recta', 5),
    ]);
    const ancho = 'mediatriz-segmento'.length;
    expect(resumen.split('\n')).toEqual([
      'Lecciones: 3 · revisadas: 1 · pendientes: 2 · prioritarias: 1',
      '',
      `⚑ ${'tangencia-recta'.padEnd(ancho)}  bloque 5  v1  pendiente`,
      `  ${'mediatriz-segmento'.padEnd(ancho)}  bloque 1  v1  pendiente`,
      `  ${'bisectriz-angulo'.padEnd(ancho)}  bloque 1  v2  revisada (Ana, 2026-10-12)`,
    ]);
  });

  it('no marca como prioritaria una lección que ya está revisada', () => {
    const resumen = resumenEstado([leccion('diedrico-punto', 7, REVISADA)]);
    expect(resumen).not.toContain('⚑');
    expect(resumen).toContain('prioritarias: 0');
  });

  it('avisa cuando no hay lecciones', () => {
    expect(resumenEstado([])).toBe('No hay ninguna lección en contenido/');
  });
});
```

- [ ] Paso 2: ejecutar los tests y comprobar que fallan

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `revisar.test.ts` y `estado.test.ts` FALLAN porque no existen `../src/revisar` ni `../src/estado`; los 85 anteriores siguen pasando.

- [ ] Paso 3: escribir la implementación de la revisión

`packages/lecciones/src/revisar.ts`:

```ts
export type ResultadoRevision =
  | { ok: true; datos: Record<string, unknown> }
  | { ok: false; error: string };

export function marcarRevisada(
  datos: Record<string, unknown>,
  por: string,
  fecha: string,
): ResultadoRevision {
  const nombre = por.trim();
  if (nombre === '') return { ok: false, error: 'falta el nombre del revisor (--por)' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { ok: false, error: 'la fecha va como AAAA-MM-DD' };
  }

  const previa =
    typeof datos.meta === 'object' && datos.meta !== null
      ? (datos.meta as Record<string, unknown>)
      : {};

  return {
    ok: true,
    datos: {
      ...datos,
      meta: { version: 1, ...previa, revision: 'revisada', revisadaPor: nombre, revisadaEl: fecha },
    },
  };
}
```

- [ ] Paso 4: escribir el resumen de estado

`packages/lecciones/src/estado.ts`:

```ts
import type { Leccion } from './esquema';

/** Bloques que el spec manda revisar con prioridad: tangencias (5) y diédrico (7). */
export const BLOQUES_PRIORITARIOS: readonly number[] = [5, 7];

export function esPrioritaria(leccion: Leccion): boolean {
  return leccion.meta.revision === 'pendiente' && BLOQUES_PRIORITARIOS.includes(leccion.bloque);
}

function rango(leccion: Leccion): number {
  if (leccion.meta.revision === 'revisada') return 2;
  return esPrioritaria(leccion) ? 0 : 1;
}

export function resumenEstado(lecciones: readonly Leccion[]): string {
  if (lecciones.length === 0) return 'No hay ninguna lección en contenido/';

  const ordenadas = [...lecciones].sort(
    (a, b) => rango(a) - rango(b) || a.bloque - b.bloque || a.id.localeCompare(b.id),
  );
  const ancho = Math.max(...ordenadas.map((leccion) => leccion.id.length));
  const pendientes = lecciones.filter((leccion) => leccion.meta.revision === 'pendiente').length;
  const prioritarias = lecciones.filter(esPrioritaria).length;

  const lineas = [
    `Lecciones: ${lecciones.length} · revisadas: ${lecciones.length - pendientes} · pendientes: ${pendientes} · prioritarias: ${prioritarias}`,
    '',
  ];
  for (const leccion of ordenadas) {
    const marca = esPrioritaria(leccion) ? '⚑' : ' ';
    const revision =
      leccion.meta.revision === 'revisada'
        ? `revisada (${leccion.meta.revisadaPor}, ${leccion.meta.revisadaEl})`
        : 'pendiente';
    lineas.push(
      `${marca} ${leccion.id.padEnd(ancho)}  bloque ${leccion.bloque}  v${leccion.meta.version}  ${revision}`,
    );
  }
  return lineas.join('\n');
}
```

- [ ] Paso 5: ejecutar los tests y comprobar que pasan

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `93 passed` (85 anteriores, 5 de `revisar` y 3 de `estado`).

- [ ] Paso 6: comprobar tipos y confirmar

```bash
pnpm --filter @traze/lecciones typecheck
git add packages/lecciones
git commit -m "feat(lecciones): revision humana y resumen de estado con prioridades"
```

## Tarea 8: prompt maestro y skill generados del vocabulario

Archivos:

- Crear: `packages/lecciones/src/prompt.ts`, `packages/lecciones/src/prompt-cli.ts`
- Crear (los genera el comando): `generacion/prompt-leccion.md`, `generacion/skill/dibujo-tecnico/SKILL.md`
- Modificar: `packages/lecciones/package.json`, `package.json`
- Test: `packages/lecciones/test/prompt.test.ts`

El prompt maestro es todo lo que necesita un chat gratuito para generar una lección válida sin ver el repositorio: el rol, las reglas, el vocabulario completo y la lección piloto como ejemplo. La skill para Claude Code lleva el mismo cuerpo más un apartado de uso dentro del repositorio (guardar el borrador, ejecutar `pnpm comprobar` y no tocar `meta` ni `contenido/`). Ambos salen de las mismas funciones, así que no pueden contradecirse.

Los dos archivos generados se versionan y un test comprueba que están al día: si se cambia el vocabulario y se olvida `pnpm prompt`, la suite falla. El ejemplo se incluye sin su clave `meta` aunque la lección piloto la gane algún día.

- [ ] Paso 1: escribir el test que falla

`packages/lecciones/test/prompt.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import { construirPrompt, construirSkill } from '../src/prompt';
import { COMPROBACIONES, DERIVADOS, MARCA_VOCABULARIO, PRIMITIVAS } from '../src/vocabulario';

function leer(ruta: string): string {
  const archivo = fileURLToPath(new URL(`../../../${ruta}`, import.meta.url));
  return readFileSync(archivo, 'utf-8').replace(/\r\n/g, '\n');
}

describe('construirPrompt', () => {
  it('describe cada entrada del vocabulario', () => {
    const prompt = construirPrompt(piloto);
    for (const entrada of [...PRIMITIVAS, ...DERIVADOS, ...COMPROBACIONES]) {
      expect(prompt, entrada.tipo).toContain(`**${entrada.tipo}**`);
    }
  });

  it('incluye el ejemplo completo sin su clave meta', () => {
    const prompt = construirPrompt({ ...piloto, meta: { version: 2 } });
    expect(prompt).toContain(JSON.stringify(piloto, null, 2));
    expect(prompt).not.toContain('"meta"');
  });

  it('explica la marca de vocabulario insuficiente y prohíbe la clave meta', () => {
    const prompt = construirPrompt(piloto);
    expect(prompt).toContain(MARCA_VOCABULARIO);
    expect(prompt).toContain('No incluyas la clave «meta»');
  });

  it('cabe holgadamente en un mensaje de chat', () => {
    expect(construirPrompt(piloto).length).toBeLessThan(30000);
  });
});

describe('construirSkill', () => {
  it('lleva cabecera de skill y el apartado de uso dentro del repositorio', () => {
    const skill = construirSkill(piloto);
    expect(skill.startsWith('---\nname: dibujo-tecnico\n')).toBe(true);
    expect(skill).toContain('generacion/borradores/');
    expect(skill).toContain('pnpm comprobar');
  });
});

describe('archivos generados', () => {
  it('el prompt maestro está al día', () => {
    expect(leer('generacion/prompt-leccion.md'), 'prompt desactualizado: ejecuta pnpm prompt').toBe(
      construirPrompt(piloto),
    );
  });

  it('la skill está al día', () => {
    expect(
      leer('generacion/skill/dibujo-tecnico/SKILL.md'),
      'skill desactualizada: ejecuta pnpm prompt',
    ).toBe(construirSkill(piloto));
  });
});
```

- [ ] Paso 2: ejecutar el test y comprobar que falla

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `prompt.test.ts` FALLA porque `../src/prompt` no existe; los 93 anteriores siguen pasando.

- [ ] Paso 3: escribir el constructor del prompt

`packages/lecciones/src/prompt.ts`:

````ts
import {
  BLOQUES_TEMARIO,
  CAMPOS_LECCION,
  COMPROBACIONES,
  DERIVADOS,
  MARCA_VOCABULARIO,
  PRIMITIVAS,
  type EntradaVocabulario,
} from './vocabulario';

function sinMeta(ejemplo: unknown): unknown {
  if (ejemplo === null || typeof ejemplo !== 'object' || Array.isArray(ejemplo)) return ejemplo;
  return Object.fromEntries(Object.entries(ejemplo).filter(([clave]) => clave !== 'meta'));
}

function seccionDeVocabulario(
  titulo: string,
  introduccion: string,
  entradas: readonly EntradaVocabulario[],
): string[] {
  return [
    `### ${titulo}`,
    '',
    introduccion,
    '',
    ...entradas.flatMap((entrada) => [
      `**${entrada.tipo}**: ${entrada.descripcion}`,
      `Campos: ${entrada.campos}.`,
      '```json',
      JSON.stringify(entrada.ejemplo),
      '```',
      '',
    ]),
  ];
}

function cuerpo(ejemplo: unknown): string {
  const lineas: string[] = [
    '# Traze · Generador de lecciones de Dibujo Técnico',
    '',
    'Eres un profesor de Dibujo Técnico I (1º de Bachillerato, España) que escribe lecciones para Traze, una web gratuita que enseña cada trazado paso a paso. Cada lección es un archivo JSON: tú describes la construcción y un programa calcula todas las coordenadas, la anima y la comprueba.',
    '',
    '## Cómo trabajamos',
    '',
    '1. Te pido una lección (por ejemplo: «Bisectriz de un ángulo», bloque 1).',
    '2. Respondes con UN solo bloque ```json con la lección completa. Sin comentarios dentro del JSON.',
    '3. Se pasa por el validador de Traze. Si falla, recibirás un INFORME DE TRAZE: devuelve entonces la lección completa corregida en otro bloque ```json.',
    '',
    '## Reglas de oro',
    '',
    '- Nunca escribas coordenadas de resultado. Solo los puntos de «datos» llevan coordenadas; los demás puntos (cortes de arcos, puntos medios) se declaran en «derivados» y los calcula el programa.',
    '- Las coordenadas están en milímetros sobre un lienzo de 210 × 140 (x crece hacia la derecha e y hacia abajo). Deja al menos 10 mm de margen en los datos y comprueba que toda la construcción cabe, arcos y prolongaciones incluidos: el validador rechaza todo lo que quede a menos de 3 mm del borde.',
    `- Usa solo el vocabulario de este documento. Si el trazado necesita algo que no existe, no lo inventes ni lo aproximes: responde solo con «${MARCA_VOCABULARIO}:» seguido de la lista de lo que falta.`,
    '- Un trazado incorrecto es peor que ninguno. Si una comprobación falla, corrige la construcción; nunca debilites, cambies ni quites una comprobación para que pase.',
    '- No incluyas la clave «meta»: la gestiona el sistema.',
    '',
    '## Estructura de la lección',
    '',
    'Campos del JSON de la lección (los opcionales pueden omitirse):',
    '',
    ...CAMPOS_LECCION.map(
      (campo) =>
        `- **${campo.nombre}** (${campo.obligatorio ? 'obligatorio' : 'opcional'}): ${campo.descripcion}`,
    ),
    '',
    'Bloques del temario:',
    '',
    ...BLOQUES_TEMARIO.map((nombre, i) => `- ${i}: ${nombre}`),
    '',
    '## Vocabulario',
    '',
    ...seccionDeVocabulario(
      'Primitivas',
      'Cada paso tiene una lista «dibujo» con estas primitivas, que se dibujan en el orden en que aparecen. Estilos: «dato» (lo que da el enunciado), «construccion» (líneas auxiliares) y «resultado» (lo que se pide).',
      PRIMITIVAS,
    ),
    ...seccionDeVocabulario(
      'Derivados',
      'Se declaran en «derivados», en orden: cada uno solo puede usar puntos ya definidos.',
      DERIVADOS,
    ),
    ...seccionDeVocabulario(
      'Comprobaciones',
      'El programa las ejecuta con una tolerancia de 1e-6: si alguna falla, la lección se rechaza.',
      COMPROBACIONES,
    ),
    '## Cómo escribir cada paso',
    '',
    '- La lección tiene de 6 a 10 pasos. El primero muestra los datos y el último comprueba el resultado.',
    '- «titulo»: de 2 a 6 palabras. «texto»: en imperativo, con el instrumento y la acción («Pincha el compás en A y ábrelo más de la mitad de AB»). «porque»: la propiedad geométrica que justifica el paso, en una frase. «consejo»: un truco de oficio en dos líneas como máximo (cómo pinchar, afilar, qué grosor usar).',
    '- Español de España, tuteo, frases cortas y tono de profesor cercano.',
    '- «errores»: 2 o 3 errores frecuentes del alumno, concretos y visibles en el dibujo.',
    '- «comprobaciones»: al menos 2, que prueben de verdad la propiedad que se enseña.',
    '- «id» en minúsculas con guiones. «requisitos»: ids de lecciones previas que ya existan, o [].',
    '',
    '## Antes de responder',
    '',
    '1. Todo punto citado está en «datos» o se crea en «derivados» antes de usarse, y todo radio citado está en «radios».',
    '2. En cada arco, el punto «hacia» está exactamente a la distancia del radio desde su centro.',
    '3. Cada comprobación se cumple de verdad con los números de «datos»: haz la cuenta si dudas.',
    '4. Todo cabe en el lienzo y las etiquetas de puntos cercanos no se pisan (cada etiqueta ocupa unos 4 mm de ancho por letra, a la derecha y por encima de su punto).',
    '5. No hay clave «meta» ni comentarios, y el JSON es válido.',
    '',
    '## Ejemplo completo',
    '',
    'Esta lección es válida y completa. Imita su forma, no su contenido.',
    '',
    '```json',
    JSON.stringify(sinMeta(ejemplo), null, 2),
    '```',
  ];
  return `${lineas.join('\n')}\n`;
}

export function construirPrompt(ejemplo: unknown): string {
  return `${cuerpo(ejemplo)}\n---\n\nSi has entendido todo, responde solo: «Listo. ¿Qué lección quieres generar?»\n`;
}

export function construirSkill(ejemplo: unknown): string {
  return [
    '---',
    'name: dibujo-tecnico',
    'description: Genera, corrige y regenera lecciones de Dibujo Técnico I para Traze en su formato JSON declarativo. Úsala cuando el usuario pida crear, corregir o regenerar una lección de Traze, o pegue un INFORME DE TRAZE.',
    '---',
    '',
    cuerpo(ejemplo),
    '## Si trabajas dentro del repositorio de Traze',
    '',
    '1. Guarda cada borrador en `generacion/borradores/<id>.json`, nunca en `contenido/`.',
    '2. Ejecuta `pnpm comprobar generacion/borradores/<id>.json`. Si el informe dice CORREGIR, corrige el borrador y repite hasta que diga CORRECTO.',
    '3. No ejecutes `pnpm promover` ni `pnpm revisar`, no edites `contenido/` y no escribas la clave «meta»: esos pasos los decide la persona que revisa.',
    '4. Si falta vocabulario, no amplíes el esquema por tu cuenta: dilo y sigue `generacion/LEEME.md`, apartado «Ampliar el vocabulario».',
    '',
  ].join('\n');
}
````

- [ ] Paso 4: escribir el comando que genera los archivos

Es un comando suelto (solo escribe archivos) y por eso no usa `almacen.ts`, que llega en la Tarea 9.

`packages/lecciones/src/prompt-cli.ts`:

```ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { construirPrompt, construirSkill } from './prompt';

const raiz = fileURLToPath(new URL('../../../', import.meta.url));
const piloto: unknown = JSON.parse(
  readFileSync(join(raiz, 'contenido', 'bloque-1-trazados', 'mediatriz-segmento.json'), 'utf-8'),
);

const salidas = [
  ['generacion/prompt-leccion.md', construirPrompt(piloto)],
  ['generacion/skill/dibujo-tecnico/SKILL.md', construirSkill(piloto)],
] as const;

for (const [ruta, texto] of salidas) {
  const destino = join(raiz, ruta);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, texto, 'utf-8');
  console.log(`✔ ${ruta} (${texto.length} caracteres)`);
}
```

- [ ] Paso 5: añadir el script `prompt`

En `packages/lecciones/package.json`.

Antes:

```json
    "validar": "tsx src/validar-cli.ts"
```

Después:

```json
    "validar": "tsx src/validar-cli.ts",
    "prompt": "tsx src/prompt-cli.ts"
```

En `package.json` de la raíz.

Antes:

```json
    "validar": "pnpm --filter @traze/lecciones validar",
```

Después:

```json
    "validar": "pnpm --filter @traze/lecciones validar",
    "prompt": "pnpm --filter @traze/lecciones prompt",
```

- [ ] Paso 6: generar los archivos

Ejecuta: `pnpm prompt`

Esperado (pnpm antepone un par de líneas con el nombre del script; los recuentos exactos dependen del texto, y cada uno queda por debajo de 30 000 caracteres):

```text
✔ generacion/prompt-leccion.md (… caracteres)
✔ generacion/skill/dibujo-tecnico/SKILL.md (… caracteres)
```

Abre `generacion/prompt-leccion.md` y comprueba a ojo que se lee bien: rol, reglas de oro, estructura, vocabulario con un ejemplo por entrada, cómo escribir cada paso, lista de comprobación y la lección piloto al final.

- [ ] Paso 7: ejecutar los tests y comprobar que pasan

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `100 passed` (93 anteriores y 7 de `prompt`).

- [ ] Paso 8: comprobar tipos y confirmar

```bash
pnpm --filter @traze/lecciones typecheck
git add generacion package.json packages/lecciones
git commit -m "feat(lecciones): prompt maestro y skill generados del vocabulario"
```

## Tarea 9: almacén, comandos y guía de uso

Archivos:

- Crear: `packages/lecciones/src/almacen.ts`
- Crear: `packages/lecciones/src/comprobar-cli.ts`, `promover-cli.ts`, `revisar-cli.ts`, `estado-cli.ts`
- Crear: `generacion/LEEME.md`, `generacion/borradores/.gitkeep`
- Modificar: `packages/lecciones/package.json`, `package.json`, `.gitignore`
- Test: `packages/lecciones/test/flujo.test.ts`

Aquí se conectan las piezas puras con el sistema de archivos. `almacen.ts` es el único módulo (junto con los `*-cli.ts`) que lee y escribe archivos, y recibe la carpeta raíz como parámetro para poder probarlo con una carpeta temporal. El test de `flujo` recorre el ciclo completo con las funciones reales: comprobar, promover, regenerar y revisar.

Los comandos resuelven las rutas que escribe la persona desde `INIT_CWD`, el directorio donde lanzó `pnpm`, porque `pnpm --filter` ejecuta el script dentro de `packages/lecciones`.

- [ ] Paso 1: escribir el test que falla

`packages/lecciones/test/flujo.test.ts`:

```ts
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import { escribirJson, existentesDe, listarContenido } from '../src/almacen';
import { comprobarBorrador } from '../src/borrador';
import { leccionSchema } from '../src/esquema';
import { resumenEstado } from '../src/estado';
import { prepararPromocion } from '../src/promover';
import { marcarRevisada } from '../src/revisar';

const RUTA = 'bloque-1-trazados/mediatriz-prueba.json';

let raiz: string;

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'traze-'));
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

describe('flujo de un borrador hasta su revisión', () => {
  it('promueve, regenera y revisa una lección', () => {
    const borrador = JSON.stringify({ ...structuredClone(piloto), id: 'mediatriz-prueba' });

    // 1. Promoción de un borrador nuevo.
    const primera = comprobarBorrador(borrador, {
      idsExistentes: existentesDe(raiz).map((existente) => existente.id),
    });
    expect(primera.errores).toEqual([]);
    const promocion = prepararPromocion(primera, existentesDe(raiz), { reemplazar: false });
    if (!promocion.ok) throw new Error(promocion.errores.join('\n'));
    escribirJson(join(raiz, promocion.ruta), promocion.contenido);

    expect(listarContenido(raiz).map((archivo) => archivo.ruta)).toEqual([RUTA]);
    expect(existentesDe(raiz)).toEqual([{ id: 'mediatriz-prueba', ruta: RUTA, version: 1 }]);
    expect(readFileSync(join(raiz, RUTA), 'utf-8').endsWith('}\n')).toBe(true);

    // 2. No se promueve otra vez sin --reemplazar; con él sube la versión.
    const segunda = comprobarBorrador(borrador, { idsExistentes: ['mediatriz-prueba'] });
    expect(prepararPromocion(segunda, existentesDe(raiz), { reemplazar: false }).ok).toBe(false);
    const regenerada = prepararPromocion(segunda, existentesDe(raiz), { reemplazar: true });
    if (!regenerada.ok) throw new Error(regenerada.errores.join('\n'));
    expect(regenerada.version).toBe(2);
    escribirJson(join(raiz, regenerada.ruta), regenerada.contenido);

    // 3. Revisión humana.
    const [archivo] = listarContenido(raiz);
    const revision = marcarRevisada(archivo.datos as Record<string, unknown>, 'Ana', '2026-10-12');
    if (!revision.ok) throw new Error(revision.error);
    escribirJson(join(raiz, archivo.ruta), revision.datos);

    const leccion = leccionSchema.parse(listarContenido(raiz)[0].datos);
    expect(leccion.meta).toEqual({
      version: 2,
      revision: 'revisada',
      revisadaPor: 'Ana',
      revisadaEl: '2026-10-12',
    });
    expect(resumenEstado([leccion])).toContain('revisada (Ana, 2026-10-12)');
  });
});
```

- [ ] Paso 2: ejecutar el test y comprobar que falla

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `flujo.test.ts` FALLA porque `../src/almacen` no existe; los 100 anteriores siguen pasando.

- [ ] Paso 3: escribir el almacén

`packages/lecciones/src/almacen.ts`:

```ts
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describirExistente, type Existente } from './promover';

export const RAIZ_REPOSITORIO = fileURLToPath(new URL('../../../', import.meta.url));
export const RAIZ_CONTENIDO = join(RAIZ_REPOSITORIO, 'contenido');
export const RAIZ_BORRADORES = join(RAIZ_REPOSITORIO, 'generacion', 'borradores');

export interface ArchivoJson {
  /** Ruta relativa a la carpeta raíz, siempre con «/». */
  ruta: string;
  datos: unknown;
  errorJson?: string;
}

export function rutasJson(carpeta: string): string[] {
  const archivos: string[] = [];
  for (const nombre of readdirSync(carpeta).sort()) {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) archivos.push(...rutasJson(ruta));
    else if (nombre.endsWith('.json')) archivos.push(ruta);
  }
  return archivos;
}

export function listarContenido(raiz: string = RAIZ_CONTENIDO): ArchivoJson[] {
  return rutasJson(raiz).map((archivo): ArchivoJson => {
    const ruta = relative(raiz, archivo).split('\\').join('/');
    try {
      return { ruta, datos: JSON.parse(readFileSync(archivo, 'utf-8')) as unknown };
    } catch (error) {
      return { ruta, datos: null, errorJson: (error as Error).message };
    }
  });
}

export function existentesDe(raiz: string = RAIZ_CONTENIDO): Existente[] {
  return listarContenido(raiz).flatMap(({ ruta, datos }) => {
    const existente = describirExistente(ruta, datos);
    return existente ? [existente] : [];
  });
}

export function escribirJson(archivo: string, datos: unknown): void {
  mkdirSync(dirname(archivo), { recursive: true });
  writeFileSync(archivo, `${JSON.stringify(datos, null, 2)}\n`, 'utf-8');
}

export function rutaDelUsuario(argumento: string): string {
  return resolve(process.env.INIT_CWD ?? process.cwd(), argumento);
}
```

- [ ] Paso 4: ejecutar el test y comprobar que pasa

Ejecuta: `pnpm --filter @traze/lecciones test`

Esperado: `101 passed` (100 anteriores y 1 de `flujo`).

- [ ] Paso 5: escribir los comandos

`packages/lecciones/src/comprobar-cli.ts`:

```ts
import { readFileSync } from 'node:fs';
import { existentesDe, rutaDelUsuario } from './almacen';
import { comprobarBorrador, formatearInforme } from './borrador';

function main(argumentos: string[]): number {
  const [origen] = argumentos;
  if (!origen) {
    console.error('Uso: pnpm comprobar <archivo> | pnpm comprobar -   («-» lee la entrada estándar)');
    return 2;
  }

  let texto: string;
  try {
    texto = origen === '-' ? readFileSync(0, 'utf-8') : readFileSync(rutaDelUsuario(origen), 'utf-8');
  } catch (error) {
    console.error(`No se puede leer «${origen}»: ${(error as Error).message}`);
    return 2;
  }

  const informe = comprobarBorrador(texto, {
    idsExistentes: existentesDe().map((existente) => existente.id),
  });
  console.log(formatearInforme(informe));

  if (informe.errores.length > 0) return 1;
  if (origen !== '-') console.log(`\nSiguiente paso: pnpm promover ${origen}`);
  return 0;
}

process.exitCode = main(process.argv.slice(2));
```

`packages/lecciones/src/promover-cli.ts`:

```ts
import { readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import {
  RAIZ_BORRADORES,
  RAIZ_CONTENIDO,
  escribirJson,
  existentesDe,
  rutaDelUsuario,
} from './almacen';
import { comprobarBorrador, formatearInforme } from './borrador';
import { prepararPromocion } from './promover';

function main(argumentos: string[]): number {
  const reemplazar = argumentos.includes('--reemplazar');
  const [origen] = argumentos.filter((argumento) => !argumento.startsWith('--'));
  if (!origen) {
    console.error('Uso: pnpm promover <borrador.json> [--reemplazar]');
    return 2;
  }

  const archivo = rutaDelUsuario(origen);
  let texto: string;
  try {
    texto = readFileSync(archivo, 'utf-8');
  } catch (error) {
    console.error(`No se puede leer «${origen}»: ${(error as Error).message}`);
    return 2;
  }

  const existentes = existentesDe();
  const informe = comprobarBorrador(texto, {
    idsExistentes: existentes.map((existente) => existente.id),
  });
  const promocion = prepararPromocion(informe, existentes, { reemplazar });

  if (!promocion.ok) {
    console.error(informe.errores.length > 0 ? formatearInforme(informe) : promocion.errores.join('\n'));
    return 1;
  }

  escribirJson(join(RAIZ_CONTENIDO, promocion.ruta), promocion.contenido);
  if (archivo.startsWith(RAIZ_BORRADORES)) unlinkSync(archivo);

  console.log(`✔ ${promocion.ruta} (versión ${promocion.version}, revisión pendiente)`);
  console.log('Siguiente paso: pnpm validar y, tras revisarla a mano, pnpm revisar <id> --por <tu nombre>');
  return 0;
}

process.exitCode = main(process.argv.slice(2));
```

`packages/lecciones/src/revisar-cli.ts`:

```ts
import { join } from 'node:path';
import { RAIZ_CONTENIDO, escribirJson, listarContenido } from './almacen';
import { marcarRevisada } from './revisar';
import { validarLeccion } from './validar';

function valorDe(argumentos: string[], opcion: string): string | undefined {
  const indice = argumentos.indexOf(opcion);
  return indice === -1 ? undefined : argumentos[indice + 1];
}

function main(argumentos: string[]): number {
  const [id] = argumentos;
  const por = valorDe(argumentos, '--por');
  if (!id || id.startsWith('--') || !por) {
    console.error('Uso: pnpm revisar <id-de-leccion> --por <tu nombre>');
    return 2;
  }

  const archivo = listarContenido().find(
    ({ datos }) => typeof datos === 'object' && datos !== null && (datos as { id?: unknown }).id === id,
  );
  if (!archivo) {
    console.error(`No hay ninguna lección con id «${id}» en contenido/`);
    return 1;
  }

  const fecha = new Date().toISOString().slice(0, 10);
  const revision = marcarRevisada(archivo.datos as Record<string, unknown>, por, fecha);
  if (!revision.ok) {
    console.error(revision.error);
    return 1;
  }

  const validada = validarLeccion(revision.datos);
  if (!validada.ok) {
    console.error(validada.errores.join('\n'));
    return 1;
  }

  escribirJson(join(RAIZ_CONTENIDO, archivo.ruta), revision.datos);
  console.log(`✔ ${archivo.ruta} revisada por ${por} el ${fecha}`);
  return 0;
}

process.exitCode = main(process.argv.slice(2));
```

`packages/lecciones/src/estado-cli.ts`:

```ts
import { listarContenido } from './almacen';
import { leccionSchema, type Leccion } from './esquema';
import { resumenEstado } from './estado';

function main(): number {
  const lecciones: Leccion[] = [];
  let invalidas = 0;

  for (const { ruta, datos } of listarContenido()) {
    const resultado = leccionSchema.safeParse(datos);
    if (resultado.success) {
      lecciones.push(resultado.data);
    } else {
      invalidas++;
      console.error(`✘ ${ruta}: no es una lección válida (ejecuta pnpm validar)`);
    }
  }

  console.log(resumenEstado(lecciones));
  return invalidas === 0 ? 0 : 1;
}

process.exitCode = main();
```

- [ ] Paso 6: añadir los scripts

En `packages/lecciones/package.json`.

Antes:

```json
    "prompt": "tsx src/prompt-cli.ts"
```

Después:

```json
    "prompt": "tsx src/prompt-cli.ts",
    "comprobar": "tsx src/comprobar-cli.ts",
    "promover": "tsx src/promover-cli.ts",
    "revisar": "tsx src/revisar-cli.ts",
    "estado": "tsx src/estado-cli.ts"
```

En `package.json` de la raíz.

Antes:

```json
    "prompt": "pnpm --filter @traze/lecciones prompt",
```

Después:

```json
    "prompt": "pnpm --filter @traze/lecciones prompt",
    "comprobar": "pnpm --filter @traze/lecciones comprobar",
    "promover": "pnpm --filter @traze/lecciones promover",
    "revisar": "pnpm --filter @traze/lecciones revisar",
    "estado": "pnpm --filter @traze/lecciones estado",
```

- [ ] Paso 7: preparar la carpeta de borradores

Los borradores son archivos de trabajo: se ignoran en git, pero la carpeta existe en el repositorio.

Añade al final de `.gitignore`:

```text
generacion/borradores/*
!generacion/borradores/.gitkeep
```

Crea el archivo vacío `generacion/borradores/.gitkeep`:

```bash
mkdir -p generacion/borradores
touch generacion/borradores/.gitkeep
```

- [ ] Paso 8: escribir la guía de uso

`generacion/LEEME.md`:

````markdown
# Generar lecciones de Traze con Claude

Las lecciones las escribe Claude y el repositorio las valida. No hace falta clave de API: sirve una sesión de Claude Code o un chat de una cuenta gratuita.

Antes de empezar, ejecuta `pnpm install` una vez.

## Modo A: Claude Code (con la skill)

1. Instala la skill `dibujo-tecnico` a partir de `generacion/skill/dibujo-tecnico/SKILL.md` (por ejemplo, en `.claude/skills/dibujo-tecnico/SKILL.md` dentro de este repositorio).
2. En una sesión de Claude Code abierta en el repositorio, pide la lección: «Genera la lección "Mediatriz de un segmento" del bloque 1».
3. Claude guarda el borrador en `generacion/borradores/<id>.json`, ejecuta `pnpm comprobar` y corrige hasta que el informe diga CORRECTO.
4. Tú ejecutas `pnpm promover generacion/borradores/<id>.json`.

## Modo B: chat de una cuenta gratuita

1. Abre un chat nuevo y pega el contenido de `generacion/prompt-leccion.md`. Claude responde «Listo».
2. Pide una sola lección por chat: «Bisectriz de un ángulo, bloque 1».
3. Copia la respuesta entera (vale con la prosa y el bloque de código) y guárdala en `generacion/borradores/<id>.json`. También puedes enviarla por la entrada estándar: `pnpm comprobar -`.
4. Ejecuta `pnpm comprobar generacion/borradores/<id>.json`.
   - Si dice CORRECTO, sigue en «Promover».
   - Si dice CORREGIR, copia el informe entero, pégalo en el mismo chat y guarda la nueva respuesta. Repite.
5. Si Claude responde `VOCABULARIO_INSUFICIENTE`, el trazado necesita algo que Traze todavía no sabe dibujar: mira «Ampliar el vocabulario».

## Promover, revisar y consultar el estado

- `pnpm comprobar <archivo>`: valida un borrador (esquema, construcción, comprobaciones numéricas y render) y escribe el informe.
- `pnpm promover <archivo>`: si no hay errores, lo copia a `contenido/bloque-N-nombre/` con `meta.version` 1 y la revisión pendiente, y borra el borrador.
- `pnpm promover <archivo> --reemplazar`: regenera una lección que ya existe. Sube la versión y vuelve a dejar la revisión pendiente.
- `pnpm revisar <id> --por <nombre>`: anota que una persona ha revisado la lección a mano (con la fecha de hoy).
- `pnpm estado`: lista las lecciones. Las marcadas con ⚑ son del bloque 5 (tangencias) o del 7 (diédrico) y están pendientes de revisión: se revisan primero.
- `pnpm validar`: valida todo `contenido/`.

Una lección solo está lista para publicar cuando aparece como revisada en `pnpm estado`.

## Ampliar el vocabulario

Cuando una lección necesita algo nuevo (por ejemplo, la bisectriz o una tangente):

1. Añade la variante al esquema en `packages/lecciones/src/esquema.ts` (primitiva, derivado o comprobación).
2. Enséñale al intérprete a resolverla en `packages/lecciones/src/interpretar.ts` y al lienzo a dibujarla (`apps/web`), con tests.
3. Añade su entrada, con descripción y ejemplo, en `packages/lecciones/src/vocabulario.ts`. Hasta que lo hagas, `pnpm test` falla: es la señal de que prompt y esquema se han desincronizado.
4. Ejecuta `pnpm prompt` para regenerar el prompt maestro y la skill, y vuelve a instalar la skill.

## Reglas que no se saltan

- Los borradores nunca se escriben a mano en `contenido/`.
- La clave `meta` solo la escriben `promover` y `revisar`.
- Si una comprobación falla, se corrige la construcción; nunca se quita ni se debilita la comprobación.
````

- [ ] Paso 9: probar los comandos a mano

Desde la raíz del repositorio.

1. Estado: `pnpm estado`

Esperado (pnpm antepone un par de líneas con el nombre del script):

```text
Lecciones: 1 · revisadas: 0 · pendientes: 1 · prioritarias: 0

  mediatriz-segmento  bloque 1  v1  pendiente
```

2. Un borrador correcto: `pnpm comprobar contenido/bloque-1-trazados/mediatriz-segmento.json`

Esperado:

```text
INFORME DE TRAZE · mediatriz-segmento
Resultado: CORRECTO (0 avisos)

Siguiente paso: pnpm promover contenido/bloque-1-trazados/mediatriz-segmento.json
```

3. Un borrador con una construcción imposible:

```bash
node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync('contenido/bloque-1-trazados/mediatriz-segmento.json','utf8'));d.radios.r.factor=0.4;fs.writeFileSync('generacion/borradores/prueba.json',JSON.stringify(d,null,2))"
pnpm comprobar generacion/borradores/prueba.json
```

Esperado: pnpm termina con `ELIFECYCLE Command failed with exit code 1` y la salida incluye:

```text
INFORME DE TRAZE · mediatriz-segmento
Resultado: CORREGIR (1 error, 0 avisos)

Errores (corrígelos todos):
1. construcción imposible: Los arcos con centro en «A» y «B» y radio «r» no se cortan: el radio debe ser mayor que la mitad de la distancia entre los centros
```

4. La barrera de promoción: `pnpm promover generacion/borradores/prueba.json`

Esperado: sale el mismo informe, el código de salida es 1 y no aparece ninguna lección nueva en `contenido/` (`pnpm estado` sigue mostrando una sola).

5. Limpieza: `rm generacion/borradores/prueba.json`

- [ ] Paso 10: comprobar tipos y confirmar

```bash
pnpm --filter @traze/lecciones typecheck
git add .gitignore generacion package.json packages/lecciones
git commit -m "feat(lecciones): almacen, comandos de comprobar, promover, revisar y estado, y guia de uso"
```

## Tarea 10: verificación final y prueba real con Claude

Archivos: ninguno nuevo. Esta tarea comprueba que todo el plan funciona junto, incluida una sesión real con Claude.

- [ ] Paso 1: la suite completa

Ejecuta: `pnpm test`

Esperado: los tres paquetes en verde: `22 passed` en `geometria`, `101 passed` en `lecciones` y `40 passed` en `web`.

- [ ] Paso 2: tipos y contenido

Ejecuta:

```bash
pnpm typecheck
pnpm validar
```

Esperado: tipos sin errores y, al final de `validar`:

```text
✔ bloque-1-trazados/mediatriz-segmento.json (6 pasos, 4 comprobaciones)
Lecciones válidas: 1 de 1
```

- [ ] Paso 3: los archivos generados están al día

Ejecuta: `pnpm prompt` y después `git status --short generacion`

Esperado: la segunda orden no muestra ningún cambio (si lo muestra, el último cambio del vocabulario no se había regenerado: confírmalo).

- [ ] Paso 4: prueba negativa con un chat gratuito

1. Abre un chat nuevo de claude.ai y pega el contenido de `generacion/prompt-leccion.md`. Esperado: Claude responde solo «Listo. ¿Qué lección quieres generar?».
2. Pide: «Bisectriz de un ángulo, bloque 1». Esperado: Claude responde con `VOCABULARIO_INSUFICIENTE:` y una lista de lo que falta (por ejemplo, cortes de una recta con un arco o una bisectriz), sin inventar primitivas.
3. Copia la respuesta a `generacion/borradores/bisectriz.txt` y ejecuta `pnpm comprobar generacion/borradores/bisectriz.txt`. Esperado: código de salida 1 y un informe cuyo único error empieza por `vocabulario: Claude indica que el vocabulario no alcanza para esta lección`, sin la petición de devolver el JSON.
4. Borra el archivo: `rm generacion/borradores/bisectriz.txt`.

- [ ] Paso 5: prueba positiva con el bucle de corrección

1. En el mismo chat, pide: «Dividir un segmento en dos partes iguales, bloque 1» (con el vocabulario actual se construye como la mediatriz).
2. Copia la respuesta entera a `generacion/borradores/dividir-segmento.json` y ejecuta `pnpm comprobar generacion/borradores/dividir-segmento.json`.
3. Si dice CORREGIR, copia el informe entero, pégalo en el chat, guarda la nueva respuesta en el mismo archivo y repite. Esperado: en como mucho dos o tres vueltas el informe dice `Resultado: CORRECTO`.
4. Ejecuta `pnpm promover generacion/borradores/dividir-segmento.json`. Esperado:

```text
✔ bloque-1-trazados/dividir-segmento.json (versión 1, revisión pendiente)
```

y el borrador desaparece de `generacion/borradores/`.

5. Ejecuta `pnpm validar`. Esperado: `Lecciones válidas: 2 de 2`.
6. Ejecuta `pnpm estado`. Esperado: dos lecciones pendientes, ninguna prioritaria.
7. Ejecuta `pnpm revisar dividir-segmento --por <tu nombre>`. Esperado: `✔ bloque-1-trazados/dividir-segmento.json revisada por <tu nombre> el <fecha de hoy>`; `pnpm estado` la muestra ya como revisada.
8. Regeneración: pide a Claude la misma lección otra vez, guarda la respuesta en `generacion/borradores/dividir-segmento.json` y ejecuta `pnpm promover generacion/borradores/dividir-segmento.json`. Esperado: error `ya existe «dividir-segmento» (versión 1); usa --reemplazar para regenerarla`. Con `--reemplazar`, sale `versión 2, revisión pendiente`.

- [ ] Paso 6: probar la ruta de Claude Code

En una sesión de Claude Code abierta en el repositorio, con la skill instalada, pide una lección. Esperado: Claude guarda el borrador en `generacion/borradores/`, ejecuta `pnpm comprobar` por su cuenta, corrige hasta que diga CORRECTO y te deja el `pnpm promover` a ti, sin tocar `contenido/` ni la clave `meta`.

- [ ] Paso 7: limpiar la prueba y confirmar

Las lecciones de prueba no forman parte del plan: el contenido real llega en el Plan 3.

```bash
rm contenido/bloque-1-trazados/dividir-segmento.json
pnpm validar
git status --short
```

Esperado: `Lecciones válidas: 1 de 1` y un árbol de trabajo limpio (los borradores se ignoran en git). Si algo quedó sin confirmar, haz el commit con `git add -A && git commit -m "chore: cierre del plan 2"`.

Con esto, el Plan 2 queda cerrado: cualquier persona con una sesión de Claude Code o una cuenta gratuita puede generar una lección, validarla con los mismos controles que el resto del contenido, promoverla con versión y dejar constancia de su revisión.
