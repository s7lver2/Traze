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