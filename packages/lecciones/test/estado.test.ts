import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-fundamentos/mediatriz-segmento.json';
import type { Leccion } from '../src/esquema';
import { resumenEstado } from '../src/estado';
import { validarLeccion } from '../src/validar';

const REVISADA = { version: 2, revision: 'revisada', revisadaPor: 'Ana', revisadaEl: '2026-10-12' };

function leccion(id: string, bloque: number, meta?: unknown): Leccion {
  const datos: any = { ...structuredClone(piloto), id, bloque };
  if (meta) datos.meta = meta;
  const resultado = validarLeccion(datos);
  if (!resultado.ok) throw new Error(resultado.errores.join('\n'));
  return resultado.leccion;
}

describe('resumenEstado', () => {
  it('ordena por prioridad de revisión y marca las prioritarias', () => {
    const resumen = resumenEstado([
      leccion('bisectriz-angulo', 1, REVISADA),
      leccion('mediatriz-segmento', 1),
      leccion('tangencia-recta', 9),
    ]);
    const ancho = 'mediatriz-segmento'.length;
    expect(resumen.split('\n')).toEqual([
      'Lecciones: 3 · revisadas: 1 · pendientes: 2 · prioritarias: 1',
      '',
      `⚑ ${'tangencia-recta'.padEnd(ancho)}  bloque 9  v1  pendiente`,
      `  ${'mediatriz-segmento'.padEnd(ancho)}  bloque 1  v1  pendiente`,
      `  ${'bisectriz-angulo'.padEnd(ancho)}  bloque 1  v2  revisada (Ana, 2026-10-12)`,
    ]);
  });

  it('no marca como prioritaria una lección que ya está revisada', () => {
    const resumen = resumenEstado([leccion('tangencia-circunferencia', 9, REVISADA)]);
    expect(resumen).not.toContain('⚑');
    expect(resumen).toContain('prioritarias: 0');
  });

  it('avisa cuando no hay lecciones', () => {
    expect(resumenEstado([])).toBe('No hay ninguna lección en contenido/');
  });
});
