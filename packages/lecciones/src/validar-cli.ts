import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { procesarLeccion } from './procesar';

const raiz = fileURLToPath(new URL('../../../contenido', import.meta.url));

function archivosJson(carpeta: string): string[] {
  const archivos: string[] = [];
  for (const nombre of readdirSync(carpeta).sort()) {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) archivos.push(...archivosJson(ruta));
    else if (nombre.endsWith('.json')) archivos.push(ruta);
  }
  return archivos;
}

function main(): number {
  const archivos = archivosJson(raiz);
  if (archivos.length === 0) {
    console.error('No hay ninguna lección en contenido/');
    return 1;
  }

  const idsVistos = new Set<string>();
  let validas = 0;

  for (const archivo of archivos) {
    const nombre = relative(raiz, archivo).split('\\').join('/');

    let datos: unknown;
    try {
      datos = JSON.parse(readFileSync(archivo, 'utf-8'));
    } catch (error) {
      console.error(`✘ ${nombre}`);
      console.error(`    JSON no válido: ${(error as Error).message}`);
      continue;
    }

    const resultado = procesarLeccion(datos);
    if (!resultado.ok) {
      console.error(`✘ ${nombre}`);
      for (const error of resultado.errores) console.error(`    ${error}`);
      continue;
    }

    const id = resultado.leccion.id;
    if (idsVistos.has(id)) {
      console.error(`✘ ${nombre}`);
      console.error(`    id: «${id}» está repetido`);
      continue;
    }
    idsVistos.add(id);

    validas++;
    console.log(
      `✔ ${nombre} (${resultado.leccion.pasos.length} pasos, ${resultado.comprobaciones.length} comprobaciones)`,
    );
  }

  console.log(`Lecciones válidas: ${validas} de ${archivos.length}`);
  return validas === archivos.length ? 0 : 1;
}

process.exitCode = main();