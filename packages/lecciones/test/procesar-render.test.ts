import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import { procesarLeccion } from '../src/procesar';

describe('procesarLeccion con el chequeo de render', () => {
  it('sigue aceptando la lección piloto', () => {
    expect(procesarLeccion(piloto).ok).toBe(true);
  });

  it('rechaza una lección cuyo dibujo se sale del lienzo', () => {
    const datos: any = structuredClone(piloto);
    datos.datos.B = [205, 60];
    const resultado = procesarLeccion(datos);
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.errores.length).toBeGreaterThan(0);
    expect(resultado.errores.every((error) => error.startsWith('render: '))).toBe(true);
  });
});
