import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { procesarLeccion, type Leccion, type LeccionResuelta } from '@traze/lecciones';

export interface LeccionCargada {
  leccion: Leccion;
  resuelta: LeccionResuelta;
}

const RAIZ = join(process.cwd(), '..', '..', 'contenido');

let memoria: LeccionCargada[] | null = null;

function archivosJson(carpeta: string): string[] {
  const archivos: string[] = [];
  for (const nombre of readdirSync(carpeta).sort()) {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) archivos.push(...archivosJson(ruta));
    else if (nombre.endsWith('.json')) archivos.push(ruta);
  }
  return archivos;
}

export function cargarLecciones(): LeccionCargada[] {
  if (memoria) return memoria;

  const ids = new Set<string>();
  memoria = archivosJson(RAIZ).map((archivo) => {
    const resultado = procesarLeccion(JSON.parse(readFileSync(archivo, 'utf-8')));
    if (!resultado.ok) {
      throw new Error(`Lección inválida (${archivo}):\n- ${resultado.errores.join('\n- ')}`);
    }
    if (ids.has(resultado.leccion.id)) {
      throw new Error(`Id de lección repetido: ${resultado.leccion.id}`);
    }
    ids.add(resultado.leccion.id);
    return { leccion: resultado.leccion, resuelta: resultado.resuelta };
  });
  return memoria;
}

export function cargarLeccion(id: string): LeccionCargada | undefined {
  return cargarLecciones().find(({ leccion }) => leccion.id === id);
}