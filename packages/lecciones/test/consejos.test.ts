import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-fundamentos/mediatriz-segmento.json';
import {
  TEMA_GENERAL,
  buscarConsejos,
  normalizar,
  temasDisponibles,
  type ConsejoBiblioteca,
} from '../src/consejos-busqueda';
import { consejosGeneralesSchema, reunirConsejos } from '../src/consejos';
import type { Leccion } from '../src/esquema';
import { validarLeccion } from '../src/validar';

const GENERALES = consejosGeneralesSchema.parse({
  consejos: [
    { id: 'material-lapices', tipo: 'material', texto: 'Lápiz 2H para construcción y HB para el resultado.' },
    { id: 'precision-cortes', tipo: 'precision', texto: 'Corta los arcos con ángulo abierto, cerca de 90°.' },
  ],
  listaComprobacion: ['Todos los puntos tienen su letra'],
});

function leccion(id: string, bloque: number, consejos: (string | undefined)[]): Leccion {
  const datos: any = { ...structuredClone(piloto), id, bloque };
  datos.pasos = consejos.map((consejo, i) => ({
    titulo: `Paso ${i + 1}`,
    texto: 'Texto.',
    porque: 'Porque sí.',
    ...(consejo ? { consejo } : {}),
    dibujo: [{ tipo: 'punto', id: 'A' }],
  }));
  const r = validarLeccion(datos);
  if (!r.ok) throw new Error(r.errores.join('\n'));
  return r.leccion;
}

describe('consejosGeneralesSchema', () => {
  it('rechaza un consejo que no cabe en dos líneas', () => {
    const r = consejosGeneralesSchema.safeParse({
      consejos: [{ id: 'largo', tipo: 'material', texto: 'x'.repeat(161) }],
      listaComprobacion: ['a'],
    });
    expect(r.success).toBe(false);
  });

  it('rechaza un tipo desconocido y un id repetido', () => {
    expect(
      consejosGeneralesSchema.safeParse({
        consejos: [{ id: 'a', tipo: 'magia', texto: 'Texto.' }],
        listaComprobacion: ['a'],
      }).success,
    ).toBe(false);
    expect(
      consejosGeneralesSchema.safeParse({
        consejos: [
          { id: 'a', tipo: 'material', texto: 'Uno.' },
          { id: 'a', tipo: 'material', texto: 'Dos.' },
        ],
        listaComprobacion: ['a'],
      }).success,
    ).toBe(false);
  });
});

describe('reunirConsejos', () => {
  it('pone primero los generales y luego los de cada paso, con su origen', () => {
    const lista = reunirConsejos(GENERALES, [
      leccion('bisectriz-angulo', 1, ['Gira desde la cabeza.', undefined, 'Cierra con trazo grueso.']),
    ]);
    expect(lista).toEqual([
      {
        id: 'material-lapices',
        tipo: 'material',
        tema: TEMA_GENERAL,
        texto: 'Lápiz 2H para construcción y HB para el resultado.',
        leccion: null,
      },
      {
        id: 'precision-cortes',
        tipo: 'precision',
        tema: TEMA_GENERAL,
        texto: 'Corta los arcos con ángulo abierto, cerca de 90°.',
        leccion: null,
      },
      {
        id: 'bisectriz-angulo-1',
        tipo: null,
        tema: 'Elementos fundamentales y lugar geométrico',
        texto: 'Gira desde la cabeza.',
        leccion: { id: 'bisectriz-angulo', titulo: 'Mediatriz de un segmento', paso: 1 },
      },
      {
        id: 'bisectriz-angulo-3',
        tipo: null,
        tema: 'Elementos fundamentales y lugar geométrico',
        texto: 'Cierra con trazo grueso.',
        leccion: { id: 'bisectriz-angulo', titulo: 'Mediatriz de un segmento', paso: 3 },
      },
    ]);
  });

  it('no repite un consejo que ya está (ignorando mayúsculas y acentos)', () => {
    const lista = reunirConsejos(GENERALES, [
      leccion('a', 1, ['LÁPIZ 2h para construcción y hb para el resultado.']),
    ]);
    expect(lista).toHaveLength(2);
  });
});

describe('normalizar y buscarConsejos', () => {
  const lista: ConsejoBiblioteca[] = reunirConsejos(GENERALES, [
    leccion('seccion-aurea', 7, ['La sección áurea divide el segmento en media y extrema razón.']),
  ]);

  it('normaliza sin acentos ni mayúsculas', () => {
    expect(normalizar('Sección ÁUREA')).toBe('seccion aurea');
  });

  it('encuentra «aurea», «ÁUREA» y «seccion aurea» igual que «sección áurea»', () => {
    for (const consulta of ['aurea', 'ÁUREA', 'seccion aurea', 'sección áurea']) {
      expect(buscarConsejos(lista, { consulta, tema: '' }).map((c) => c.id), consulta).toEqual([
        'seccion-aurea-1',
      ]);
    }
  });

  it('exige que aparezcan todas las palabras', () => {
    expect(buscarConsejos(lista, { consulta: 'aurea compas', tema: '' })).toEqual([]);
  });

  it('busca también en el nombre del tipo y en el tema', () => {
    expect(buscarConsejos(lista, { consulta: 'precision', tema: '' }).map((c) => c.id)).toEqual([
      'precision-cortes',
    ]);
    expect(buscarConsejos(lista, { consulta: 'proporcionalidad', tema: '' }).map((c) => c.id)).toEqual([
      'seccion-aurea-1',
    ]);
  });

  it('filtra por tema y sin consulta devuelve todo el tema', () => {
    expect(buscarConsejos(lista, { consulta: '', tema: TEMA_GENERAL })).toHaveLength(2);
    expect(buscarConsejos(lista, { consulta: '  ', tema: '' })).toHaveLength(3);
  });

  it('lista los temas con el general primero', () => {
    expect(temasDisponibles(lista)).toEqual([TEMA_GENERAL, 'Proporcionalidad']);
  });
});
