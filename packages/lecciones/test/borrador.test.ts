import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import { comprobarBorrador, formatearInforme } from '../src/borrador';

const sinContexto = { idsExistentes: [] as string[] };

function copia(): any {
  return structuredClone(piloto);
}

const texto = (datos: unknown): string => JSON.stringify(datos);

describe('comprobarBorrador', () => {
  it('acepta la lección piloto sin errores ni avisos', () => {
    const informe = comprobarBorrador(texto(piloto), sinContexto);
    expect(informe.errores).toEqual([]);
    expect(informe.avisos).toEqual([]);
    expect(informe.id).toBe('mediatriz-segmento');
    expect(informe.leccion).not.toBeNull();
  });

  it('extrae el JSON de una respuesta con texto y bloque de código', () => {
    const respuesta =
      'Aquí tienes la lección:\n\n```json\n' +
      JSON.stringify(piloto, null, 2) +
      '\n```\n\nDime si quieres cambios.';
    expect(comprobarBorrador(respuesta, sinContexto).errores).toEqual([]);
  });

  it('rechaza la clave meta: la gestiona el sistema', () => {
    const datos = copia();
    datos.meta = { version: 1, revision: 'pendiente' };
    const informe = comprobarBorrador(texto(datos), sinContexto);
    expect(informe.errores).toContain('meta: la gestiona el sistema; elimina esta clave');
    expect(informe.leccion).toBeNull();
  });

  it('señala un punto no definido con su paso y su campo', () => {
    const datos = copia();
    datos.pasos[0].dibujo[0] = { tipo: 'segmento', desde: 'A', hasta: 'Z' };
    const informe = comprobarBorrador(texto(datos), sinContexto);
    expect(informe.errores).toEqual(['pasos.0.dibujo.0.hasta: El punto «Z» no está definido']);
  });

  it('señala una construcción imposible', () => {
    const datos = copia();
    datos.radios.r.factor = 0.4;
    const informe = comprobarBorrador(texto(datos), sinContexto);
    expect(informe.errores[0]).toContain('construcción imposible:');
  });

  it('avisa cuando no hay ningún JSON', () => {
    const informe = comprobarBorrador('hola', sinContexto);
    expect(informe.errores).toEqual([
      'json: no se encuentra ningún objeto JSON (falta el bloque ```json)',
    ]);
    expect(informe.id).toBeNull();
  });

  it('reconoce que Claude pide ampliar el vocabulario', () => {
    const informe = comprobarBorrador(
      'VOCABULARIO_INSUFICIENTE: falta la bisectriz de un ángulo',
      sinContexto,
    );
    expect(informe.errores).toEqual([
      'vocabulario: Claude indica que el vocabulario no alcanza para esta lección (falta la bisectriz de un ángulo)',
    ]);
  });

  it('da avisos que no bloquean', () => {
    const datos = copia();
    delete datos.pasos[1].consejo;
    datos.errores = ['Solo uno.'];
    datos.requisitos = ['compas-basico'];
    const informe = comprobarBorrador(texto(datos), sinContexto);
    expect(informe.errores).toEqual([]);
    expect(informe.avisos).toEqual([
      'pasos.1.consejo: falta el consejo de este paso',
      'errores: la lección lista 1; lo habitual son 2 o 3',
      'requisitos.0: «compas-basico» no existe todavía en contenido/',
    ]);
  });

  it('no avisa de un requisito que ya existe', () => {
    const datos = copia();
    datos.requisitos = ['compas-basico'];
    const informe = comprobarBorrador(texto(datos), { idsExistentes: ['compas-basico'] });
    expect(informe.avisos).toEqual([]);
  });
});

describe('formatearInforme', () => {
  it('resume una lección correcta', () => {
    const informe = comprobarBorrador(texto(piloto), sinContexto);
    expect(formatearInforme(informe)).toBe(
      'INFORME DE TRAZE · mediatriz-segmento\nResultado: CORRECTO (0 avisos)',
    );
  });

  it('lista los errores, las pistas y la petición de corrección', () => {
    const datos = copia();
    datos.pasos[0].dibujo[0] = { tipo: 'segmento', desde: 'A', hasta: 'Z' };
    const informe = comprobarBorrador(texto(datos), sinContexto);
    expect(formatearInforme(informe).split('\n')).toEqual([
      'INFORME DE TRAZE · mediatriz-segmento',
      'Resultado: CORREGIR (1 error, 0 avisos)',
      '',
      'Errores (corrígelos todos):',
      '1. pasos.0.dibujo.0.hasta: El punto «Z» no está definido',
      '',
      'Pistas:',
      '- Define cada punto en «datos» o créalo en «derivados» antes de usarlo, y cada radio en «radios».',
      '',
      'Devuelve la lección completa corregida en un único bloque ```json, sin comentarios y sin la clave «meta».',
    ]);
  });

  it('lista los avisos aunque la lección sea correcta', () => {
    const datos = copia();
    datos.errores = ['Solo uno.'];
    const informe = comprobarBorrador(texto(datos), sinContexto);
    expect(formatearInforme(informe).split('\n')).toEqual([
      'INFORME DE TRAZE · mediatriz-segmento',
      'Resultado: CORRECTO (1 aviso)',
      '',
      'Avisos (no bloquean, pero mejóralos si puedes):',
      '- errores: la lección lista 1; lo habitual son 2 o 3',
    ]);
  });

  it('no pide corregir el JSON cuando falta vocabulario', () => {
    const informe = comprobarBorrador('VOCABULARIO_INSUFICIENTE: falta la bisectriz', sinContexto);
    const salida = formatearInforme(informe);
    expect(salida.startsWith('INFORME DE TRAZE · lección sin id')).toBe(true);
    expect(salida).toContain('1. vocabulario: Claude indica');
    expect(salida).not.toContain('Devuelve la lección completa');
  });
});
