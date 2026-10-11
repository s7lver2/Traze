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
        tema: BLOQUES_TEMARIO[leccion.bloque - 1],
        texto: paso.consejo,
        leccion: { id: leccion.id, titulo: leccion.titulo, paso: i + 1 },
      });
    });
  }
  return lista;
}
