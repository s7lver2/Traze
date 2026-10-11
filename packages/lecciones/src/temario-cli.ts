import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ_REPOSITORIO, listarContenido } from './almacen';
import { leccionSchema, type Leccion } from './esquema';
import {
  comprobarCobertura,
  comprobarRevision,
  encargoDe,
  formatearTemario,
  temarioSchema,
} from './temario';
import { formatearIssue } from './validar';

function main(argumentos: string[]): number {
  const resultado = temarioSchema.safeParse(
    JSON.parse(readFileSync(join(RAIZ_REPOSITORIO, 'temario', 'temario.json'), 'utf-8')),
  );
  if (!resultado.success) {
    console.error('temario/temario.json no es válido:');
    for (const issue of resultado.error.issues) console.error(`- ${formatearIssue(issue)}`);
    return 1;
  }
  const temario = resultado.data;

  const lecciones: Leccion[] = [];
  let invalidas = 0;
  for (const { ruta, datos } of listarContenido()) {
    const r = leccionSchema.safeParse(datos);
    if (r.success) lecciones.push(r.data);
    else {
      invalidas++;
      console.error(`✘ ${ruta}: no es una lección válida (ejecuta pnpm validar)`);
    }
  }
  const cobertura = comprobarCobertura(temario, lecciones);

  if (argumentos[0] === 'encargo') {
    const entrada = temario.lecciones.find((candidata) => candidata.id === argumentos[1]);
    if (!entrada) {
      console.error('Uso: pnpm temario encargo <id-de-leccion> (el id debe estar en temario/temario.json)');
      return 2;
    }
    console.log(encargoDe(entrada, cobertura.publicadas));
    return 0;
  }

  console.log(formatearTemario(temario, cobertura));
  let fallo = invalidas > 0 || cobertura.errores.length > 0;

  if (argumentos.includes('--completo') || argumentos.includes('--publicable')) {
    if (cobertura.pendientes.length > 0) {
      console.error(`\nFaltan ${cobertura.pendientes.length} lecciones: ${cobertura.pendientes.join(', ')}`);
      fallo = true;
    }
  }
  if (argumentos.includes('--publicable')) {
    const revision = comprobarRevision(lecciones);
    if (!revision.ok) {
      console.error('\nRevisión humana pendiente:');
      for (const falta of revision.faltan) console.error(`- ${falta}`);
      fallo = true;
    }
  }
  return fallo ? 1 : 0;
}

process.exitCode = main(process.argv.slice(2));
