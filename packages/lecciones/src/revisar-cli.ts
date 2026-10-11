import { join } from 'node:path';
import { RAIZ_CONTENIDO, escribirJson, listarContenido } from './almacen';
import { marcarRevisada } from './revisar';
import { validarLeccion } from './validar';

function valorDe(argumentos: string[], opcion: string): string | undefined {
  const indice = argumentos.indexOf(opcion);
  return indice === -1 ? undefined : argumentos[indice + 1];
}

function main(argumentos: string[]): number {
  const [id] = argumentos;
  const por = valorDe(argumentos, '--por');
  if (!id || id.startsWith('--') || !por) {
    console.error('Uso: pnpm revisar <id-de-leccion> --por <tu nombre>');
    return 2;
  }

  const archivo = listarContenido().find(
    ({ datos }) => typeof datos === 'object' && datos !== null && (datos as { id?: unknown }).id === id,
  );
  if (!archivo) {
    console.error(`No hay ninguna lección con id «${id}» en contenido/`);
    return 1;
  }

  const fecha = new Date().toISOString().slice(0, 10);
  const revision = marcarRevisada(archivo.datos as Record<string, unknown>, por, fecha);
  if (!revision.ok) {
    console.error(revision.error);
    return 1;
  }

  const validada = validarLeccion(revision.datos);
  if (!validada.ok) {
    console.error(validada.errores.join('\n'));
    return 1;
  }

  escribirJson(join(RAIZ_CONTENIDO, archivo.ruta), revision.datos);
  console.log(`✔ ${archivo.ruta} revisada por ${por} el ${fecha}`);
  return 0;
}

process.exitCode = main(process.argv.slice(2));
