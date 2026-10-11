import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  consejosGeneralesSchema,
  formatearIssue,
  reunirConsejos,
  type ConsejoBiblioteca,
  type ConsejosGenerales,
} from '@traze/lecciones';
import { cargarLecciones } from './contenido';

const RUTA = join(process.cwd(), '..', '..', 'consejos', 'generales.json');

let memoria: ConsejosGenerales | null = null;

export function cargarConsejosGenerales(): ConsejosGenerales {
  if (memoria) return memoria;
  const resultado = consejosGeneralesSchema.safeParse(JSON.parse(readFileSync(RUTA, 'utf-8')));
  if (!resultado.success) {
    throw new Error(`Consejos inválidos:\n- ${resultado.error.issues.map(formatearIssue).join('\n- ')}`);
  }
  memoria = resultado.data;
  return memoria;
}

export function cargarBiblioteca(): ConsejoBiblioteca[] {
  return reunirConsejos(
    cargarConsejosGenerales(),
    cargarLecciones().map(({ leccion }) => leccion),
  );
}
