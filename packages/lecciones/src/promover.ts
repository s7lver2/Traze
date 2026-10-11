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
