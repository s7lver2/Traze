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