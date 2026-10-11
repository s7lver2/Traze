import { readFileSync } from 'node:fs';
import { existentesDe, rutaDelUsuario } from './almacen';
import { comprobarBorrador, formatearInforme } from './borrador';

function main(argumentos: string[]): number {
  const [origen] = argumentos;
  if (!origen) {
    console.error('Uso: pnpm comprobar <archivo> | pnpm comprobar -   («-» lee la entrada estándar)');
    return 2;
  }

  let texto: string;
  try {
    texto = origen === '-' ? readFileSync(0, 'utf-8') : readFileSync(rutaDelUsuario(origen), 'utf-8');
  } catch (error) {
    console.error(`No se puede leer «${origen}»: ${(error as Error).message}`);
    return 2;
  }

  const informe = comprobarBorrador(texto, {
    idsExistentes: existentesDe().map((existente) => existente.id),
  });
  console.log(formatearInforme(informe));

  if (informe.errores.length > 0) return 1;
  if (origen !== '-') console.log(`\nSiguiente paso: pnpm promover ${origen}`);
  return 0;
}

process.exitCode = main(process.argv.slice(2));
