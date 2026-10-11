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