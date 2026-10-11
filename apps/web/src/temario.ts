import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { comprobarCobertura, formatearIssue, temarioSchema, type Temario } from '@traze/lecciones';
import { cargarLecciones } from './contenido';

const RUTA = join(process.cwd(), '..', '..', 'temario', 'temario.json');

let memoria: Temario | null = null;

export function cargarTemario(): Temario {
  if (memoria) return memoria;

  const resultado = temarioSchema.safeParse(JSON.parse(readFileSync(RUTA, 'utf-8')));
  if (!resultado.success) {
    throw new Error(`Temario inválido:\n- ${resultado.error.issues.map(formatearIssue).join('\n- ')}`);
  }

  const cobertura = comprobarCobertura(
    resultado.data,
    cargarLecciones().map(({ leccion }) => leccion),
  );
  if (cobertura.errores.length > 0) {
    throw new Error(`Las lecciones no cumplen el temario:\n- ${cobertura.errores.join('\n- ')}`);
  }

  memoria = resultado.data;
  return memoria;
}
