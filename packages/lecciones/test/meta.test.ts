import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import { validarLeccion } from '../src/validar';

function copia(): any {
  return structuredClone(piloto);
}

function errores(datos: unknown): string[] {
  const resultado = validarLeccion(datos);
  return resultado.ok ? [] : resultado.errores;
}

describe('meta de la lección', () => {
  it('aplica los valores por defecto cuando la lección no trae meta', () => {
    const resultado = validarLeccion(piloto);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.leccion.meta).toEqual({ version: 1, revision: 'pendiente' });
  });

  it('acepta una lección revisada con su revisor y su fecha', () => {
    const datos = copia();
    datos.meta = { version: 3, revision: 'revisada', revisadaPor: 'Ana', revisadaEl: '2026-10-12' };
    const resultado = validarLeccion(datos);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.leccion.meta.version).toBe(3);
    expect(resultado.leccion.meta.revisadaPor).toBe('Ana');
  });

  it('rechaza una versión que no es un entero positivo', () => {
    const datos = copia();
    datos.meta = { version: 0 };
    expect(errores(datos).some((e) => e.startsWith('meta.version:'))).toBe(true);
  });

  it('rechaza una fecha de revisión mal escrita', () => {
    const datos = copia();
    datos.meta = { revision: 'revisada', revisadaPor: 'Ana', revisadaEl: '12/10/2026' };
    expect(errores(datos)).toContain('meta.revisadaEl: la fecha va como AAAA-MM-DD');
  });

  it('rechaza una lección marcada como revisada sin revisor ni fecha', () => {
    const datos = copia();
    datos.meta = { revision: 'revisada' };
    expect(errores(datos)).toContain('meta: una lección revisada necesita revisadaPor y revisadaEl');
  });
});