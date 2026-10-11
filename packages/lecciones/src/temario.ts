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
  bloque: z.number().int().min(1).max(10),
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
  return BLOQUES_TEMARIO[bloque - 1];
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
