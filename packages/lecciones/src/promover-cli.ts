import { readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import {
  RAIZ_BORRADORES,
  RAIZ_CONTENIDO,
  escribirJson,
  existentesDe,
  rutaDelUsuario,
} from './almacen';
import { comprobarBorrador, formatearInforme } from './borrador';
import { prepararPromocion } from './promover';

function main(argumentos: string[]): number {
  const reemplazar = argumentos.includes('--reemplazar');
  const [origen] = argumentos.filter((argumento) => !argumento.startsWith('--'));
  if (!origen) {
    console.error('Uso: pnpm promover <borrador.json> [--reemplazar]');
    return 2;
  }

  const archivo = rutaDelUsuario(origen);
  let texto: string;
  try {
    texto = readFileSync(archivo, 'utf-8');
  } catch (error) {
    console.error(`No se puede leer «${origen}»: ${(error as Error).message}`);
    return 2;
  }

  const existentes = existentesDe();
  const informe = comprobarBorrador(texto, {
    idsExistentes: existentes.map((existente) => existente.id),
  });
  const promocion = prepararPromocion(informe, existentes, { reemplazar });

  if (!promocion.ok) {
    console.error(informe.errores.length > 0 ? formatearInforme(informe) : promocion.errores.join('\n'));
    return 1;
  }

  escribirJson(join(RAIZ_CONTENIDO, promocion.ruta), promocion.contenido);
  if (archivo.startsWith(RAIZ_BORRADORES)) unlinkSync(archivo);

  console.log(`✔ ${promocion.ruta} (versión ${promocion.version}, revisión pendiente)`);
  console.log('Siguiente paso: pnpm validar y, tras revisarla a mano, pnpm revisar <id> --por <tu nombre>');
  return 0;
}

process.exitCode = main(process.argv.slice(2));
