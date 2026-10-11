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

export const derivadoSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('puntoMedio'), id, entre: parDeIds }),
  z.object({ tipo: z.literal('interseccionArcos'), ids: parDeIds, centros: parDeIds, radio: id }),
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

export const comprobacionSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('equidistante'), punto: id, a: id, b: id }),
  z.object({ tipo: z.literal('perpendicular'), recta: parDeIds, segmento: parDeIds }),
  z.object({ tipo: z.literal('pasaPorPuntoMedio'), recta: parDeIds, segmento: parDeIds }),
]);

export type Primitiva = z.infer<typeof primitivaSchema>;
export type TipoPrimitiva = Primitiva['tipo'];
export type Estilo = z.infer<typeof estilo>;
export type Paso = z.infer<typeof pasoSchema>;
export type Derivado = z.infer<typeof derivadoSchema>;
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
  }
}

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
    radios: z.record(id, radioSchema).default({}),
    derivados: z.array(derivadoSchema).default([]),
    pasos: z.array(pasoSchema).min(1).max(10),
    errores: z.array(z.string()).default([]),
    comprobaciones: z.array(comprobacionSchema).min(1),
    meta: metaSchema.default({}),
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