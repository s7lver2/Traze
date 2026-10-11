import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import { comprobarBorrador } from '../src/borrador';
import { carpetaDeBloque, describirExistente, prepararPromocion } from '../src/promover';

const RUTA = 'bloque-1-trazados/mediatriz-segmento.json';

function informe(datos: unknown = piloto) {
  return comprobarBorrador(JSON.stringify(datos), { idsExistentes: [] });
}

describe('prepararPromocion', () => {
  it('promueve un borrador nuevo a la carpeta de su bloque con versión 1', () => {
    const promocion = prepararPromocion(informe(), [], { reemplazar: false });
    expect(promocion.ok).toBe(true);
    if (!promocion.ok) return;
    expect(promocion).toMatchObject({ ruta: RUTA, version: 1, reemplaza: false });
    expect(promocion.contenido.meta).toEqual({ version: 1, revision: 'pendiente' });
  });

  it('conserva las claves del borrador y deja meta al final', () => {
    const promocion = prepararPromocion(informe(), [], { reemplazar: false });
    if (!promocion.ok) throw new Error('se esperaba una promoción válida');
    expect(Object.keys(promocion.contenido)).toEqual([...Object.keys(piloto), 'meta']);
  });

  it('no pisa una lección que ya existe sin --reemplazar', () => {
    const existentes = [{ id: 'mediatriz-segmento', ruta: RUTA, version: 2 }];
    expect(prepararPromocion(informe(), existentes, { reemplazar: false })).toEqual({
      ok: false,
      errores: ['ya existe «mediatriz-segmento» (versión 2); usa --reemplazar para regenerarla'],
    });
  });

  it('con --reemplazar sube la versión y vuelve a dejar la revisión pendiente', () => {
    const existentes = [{ id: 'mediatriz-segmento', ruta: RUTA, version: 2 }];
    const promocion = prepararPromocion(informe(), existentes, { reemplazar: true });
    expect(promocion.ok).toBe(true);
    if (!promocion.ok) return;
    expect(promocion).toMatchObject({ ruta: RUTA, version: 3, reemplaza: true });
    expect(promocion.contenido.meta).toEqual({ version: 3, revision: 'pendiente' });
  });

  it('no cambia una lección de bloque al regenerarla', () => {
    const existentes = [
      { id: 'mediatriz-segmento', ruta: 'bloque-2-poligonos/mediatriz-segmento.json', version: 1 },
    ];
    const promocion = prepararPromocion(informe(), existentes, { reemplazar: true });
    expect(promocion.ok).toBe(false);
    if (promocion.ok) return;
    expect(promocion.errores[0]).toContain('cambiar de bloque');
  });

  it('no promueve un borrador con errores', () => {
    const datos: any = structuredClone(piloto);
    datos.id = 'Mal';
    expect(prepararPromocion(informe(datos), [], { reemplazar: false })).toEqual({
      ok: false,
      errores: ['el borrador tiene errores: pasa `pnpm comprobar` y corrígelos antes de promover'],
    });
  });
});

describe('carpetaDeBloque', () => {
  it('nombra la carpeta con el número y el nombre del bloque', () => {
    expect(carpetaDeBloque(0)).toBe('bloque-0-primeros-pasos');
    expect(carpetaDeBloque(5)).toBe('bloque-5-tangencias');
    expect(carpetaDeBloque(7)).toBe('bloque-7-diedrico');
  });
});

describe('describirExistente', () => {
  it('lee el id y la versión de una lección válida', () => {
    expect(describirExistente('x/y.json', piloto)).toEqual({
      id: 'mediatriz-segmento',
      ruta: 'x/y.json',
      version: 1,
    });
  });

  it('devuelve null si el contenido no es una lección válida', () => {
    expect(describirExistente('x/y.json', {})).toBeNull();
  });
});
