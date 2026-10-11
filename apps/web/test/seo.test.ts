import { describe, expect, it } from 'vitest';
import { procesarLeccion } from '@traze/lecciones';
import piloto from '../../../contenido/bloque-1-fundamentos/mediatriz-segmento.json';
import {
  datosEstructurados,
  descripcionSeo,
  jsonLdSeguro,
  rutaLeccion,
  tituloSeo,
  urlDelSitio,
} from '../src/seo';

describe('urlDelSitio', () => {
  it('usa localhost si no hay variable', () => {
    expect(urlDelSitio(undefined)).toBe('http://localhost:3000');
    expect(urlDelSitio('   ')).toBe('http://localhost:3000');
  });

  it('quita la barra final', () => {
    expect(urlDelSitio('https://traze.example/')).toBe('https://traze.example');
    expect(urlDelSitio('https://traze.example///')).toBe('https://traze.example');
  });
});

describe('título y descripción', () => {
  it('compone el título con el nombre de la lección', () => {
    expect(tituloSeo('Mediatriz de un segmento')).toBe('Mediatriz de un segmento: trazado paso a paso');
  });

  it('deja intacta una descripción corta', () => {
    expect(descripcionSeo({ enunciado: 'Traza la mediatriz.', ideaClave: 'Equidistan de A y B.' })).toBe(
      'Traza la mediatriz. Equidistan de A y B.',
    );
  });

  it('recorta una descripción larga sin partir palabras ni pasarse', () => {
    const descripcion = descripcionSeo({
      enunciado: 'palabra '.repeat(30).trim(),
      ideaClave: 'otra '.repeat(10).trim(),
    });
    expect(descripcion.length).toBeLessThanOrEqual(155);
    expect(descripcion.endsWith('…')).toBe(true);
    expect(descripcion.slice(0, -1).trim().endsWith('palabra')).toBe(true);
  });

  it('colapsa los saltos de línea y los espacios repetidos', () => {
    expect(descripcionSeo({ enunciado: 'Uno\n\ndos', ideaClave: '  tres ' })).toBe('Uno dos tres');
  });
});

describe('datos estructurados', () => {
  const procesada = procesarLeccion(piloto);
  if (!procesada.ok) throw new Error(procesada.errores.join('\n'));
  const datos = datosEstructurados(procesada.leccion, procesada.resuelta, 'https://traze.example');

  it('describe la lección como un HowTo con un paso por cada paso', () => {
    expect(datos['@type']).toBe('HowTo');
    expect(datos.name).toBe('Mediatriz de un segmento');
    expect(datos.url).toBe(`https://traze.example${rutaLeccion('mediatriz-segmento')}`);
    expect(datos.step).toHaveLength(procesada.resuelta.pasos.length);
    expect(datos.step[0]).toMatchObject({ '@type': 'HowToStep', position: 1, name: 'Los datos' });
  });

  it('el JSON incrustado no puede cerrar la etiqueta script', () => {
    const texto = jsonLdSeguro({ texto: '</script><b>' });
    expect(texto).not.toContain('<');
    expect(JSON.parse(texto)).toEqual({ texto: '</script><b>' });
  });
});
