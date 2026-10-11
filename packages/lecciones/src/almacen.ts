import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describirExistente, type Existente } from './promover';

export const RAIZ_REPOSITORIO = fileURLToPath(new URL('../../../', import.meta.url));
export const RAIZ_CONTENIDO = join(RAIZ_REPOSITORIO, 'contenido');
export const RAIZ_BORRADORES = join(RAIZ_REPOSITORIO, 'generacion', 'borradores');

export interface ArchivoJson {
  /** Ruta relativa a la carpeta raíz, siempre con «/». */
  ruta: string;
  datos: unknown;
  errorJson?: string;
}

export function rutasJson(carpeta: string): string[] {
  const archivos: string[] = [];
  for (const nombre of readdirSync(carpeta).sort()) {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) archivos.push(...rutasJson(ruta));
    else if (nombre.endsWith('.json')) archivos.push(ruta);
  }
  return archivos;
}

export function listarContenido(raiz: string = RAIZ_CONTENIDO): ArchivoJson[] {
  return rutasJson(raiz).map((archivo): ArchivoJson => {
    const ruta = relative(raiz, archivo).split('\\').join('/');
    try {
      return { ruta, datos: JSON.parse(readFileSync(archivo, 'utf-8')) as unknown };
    } catch (error) {
      return { ruta, datos: null, errorJson: (error as Error).message };
    }
  });
}

export function existentesDe(raiz: string = RAIZ_CONTENIDO): Existente[] {
  return listarContenido(raiz).flatMap(({ ruta, datos }) => {
    const existente = describirExistente(ruta, datos);
    return existente ? [existente] : [];
  });
}

export function escribirJson(archivo: string, datos: unknown): void {
  mkdirSync(dirname(archivo), { recursive: true });
  writeFileSync(archivo, `${JSON.stringify(datos, null, 2)}\n`, 'utf-8');
}

export function rutaDelUsuario(argumento: string): string {
  return resolve(process.env.INIT_CWD ?? process.cwd(), argumento);
}
