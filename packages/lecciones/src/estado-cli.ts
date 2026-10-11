import { listarContenido } from './almacen';
import { leccionSchema, type Leccion } from './esquema';
import { resumenEstado } from './estado';

function main(): number {
  const lecciones: Leccion[] = [];
  let invalidas = 0;

  for (const { ruta, datos } of listarContenido()) {
    const resultado = leccionSchema.safeParse(datos);
    if (resultado.success) {
      lecciones.push(resultado.data);
    } else {
      invalidas++;
      console.error(`✘ ${ruta}: no es una lección válida (ejecuta pnpm validar)`);
    }
  }

  console.log(resumenEstado(lecciones));
  return invalidas === 0 ? 0 : 1;
}

process.exitCode = main();
