import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-fundamentos/mediatriz-segmento.json';
import type { Leccion } from '../src/esquema';
import {
  MAX_CARACTERES_CONSEJO,
  agruparPorBloque,
  comprobarCobertura,
  comprobarRevision,
  encargoDe,
  formatearTemario,
  temarioSchema,
  vecinas,
  type Temario,
} from '../src/temario';
import { validarLeccion } from '../src/validar';

const ENCARGO = 'Traza el resultado con regla y compás y explica la propiedad que lo sostiene.';

function entrada(id: string, bloque: number, requisitos: string[] = [], exige = ['equidistante']) {
  return { id, bloque, titulo: `Título de ${id}`, requisitos, encargo: ENCARGO, exige };
}

function temarioCon(...entradas: ReturnType<typeof entrada>[]): Temario {
  return temarioSchema.parse({ lecciones: entradas });
}

const TEMARIO = temarioCon(
  entrada('mediatriz-segmento', 1, [], ['equidistante', 'perpendicular']),
  entrada('bisectriz-angulo', 1, ['mediatriz-segmento']),
  entrada('tangente-recta', 9, ['bisectriz-angulo']),
);

function leccion(id: string, bloque: number, cambios: Record<string, unknown> = {}): Leccion {
  const datos: any = { ...structuredClone(piloto), id, bloque, ...cambios };
  const resultado = validarLeccion(datos);
  if (!resultado.ok) throw new Error(resultado.errores.join('\n'));
  return resultado.leccion;
}

const REVISADA = { version: 1, revision: 'revisada', revisadaPor: 'Ana', revisadaEl: '2026-10-12' };

describe('temarioSchema', () => {
  it('acepta un temario ordenado', () => {
    expect(temarioSchema.safeParse(TEMARIO).success).toBe(true);
  });

  function errores(entradas: unknown[]): string[] {
    const r = temarioSchema.safeParse({ lecciones: entradas });
    return r.success ? [] : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  }

  it('rechaza un id repetido', () => {
    expect(errores([entrada('a', 1), entrada('a', 1)])).toEqual([
      'lecciones.1.id: el id «a» está repetido',
    ]);
  });

  it('rechaza un requisito que no aparece antes en el temario', () => {
    expect(errores([entrada('a', 1, ['b']), entrada('b', 1)])).toEqual([
      'lecciones.0.requisitos.0: «b» debe aparecer antes en el temario',
    ]);
  });

  it('rechaza un temario desordenado por bloques', () => {
    expect(errores([entrada('a', 9), entrada('b', 1)])).toEqual([
      'lecciones.1.bloque: el temario va ordenado por bloques',
    ]);
  });

  it('rechaza una comprobación exigida que no existe en el vocabulario', () => {
    const mensajes = errores([entrada('a', 1, [], ['magia'])]);
    expect(mensajes).toEqual(['lecciones.0.exige.0: no es un tipo de comprobación del vocabulario']);
  });
});

describe('comprobarCobertura', () => {
  it('separa publicadas y pendientes, y no da errores ni avisos', () => {
    const cobertura = comprobarCobertura(TEMARIO, [leccion('mediatriz-segmento', 1)]);
    expect(cobertura.errores).toEqual([]);
    expect(cobertura.avisos).toEqual([]);
    expect(cobertura.publicadas).toEqual(['mediatriz-segmento']);
    expect(cobertura.pendientes).toEqual(['bisectriz-angulo', 'tangente-recta']);
  });

  it('rechaza una lección que no figura en el temario', () => {
    expect(comprobarCobertura(TEMARIO, [leccion('otra', 1)]).errores).toEqual([
      '«otra» no figura en el temario',
    ]);
  });

  it('rechaza una lección en otro bloque', () => {
    const cobertura = comprobarCobertura(TEMARIO, [
      leccion('bisectriz-angulo', 2, { requisitos: ['mediatriz-segmento'] }),
    ]);
    expect(cobertura.errores).toEqual([
      '«bisectriz-angulo»: está en el bloque 2 y el temario la sitúa en el 1',
    ]);
  });

  it('rechaza una lección sin una comprobación exigida', () => {
    const temario = temarioCon(entrada('mediatriz-segmento', 1, [], ['equidistante', 'tangente']));
    expect(comprobarCobertura(temario, [leccion('mediatriz-segmento', 1)]).errores).toEqual([
      '«mediatriz-segmento»: falta una comprobación de tipo «tangente»',
    ]);
  });

  it('rechaza requisitos distintos de los del temario', () => {
    const cobertura = comprobarCobertura(TEMARIO, [leccion('bisectriz-angulo', 1, { requisitos: [] })]);
    expect(cobertura.errores).toEqual([
      '«bisectriz-angulo»: los requisitos de la lección (ninguno) no coinciden con los del temario (mediatriz-segmento)',
    ]);
  });

  it('avisa de un consejo demasiado largo', () => {
    const datos: any = structuredClone(piloto);
    datos.pasos[0].consejo = 'x'.repeat(MAX_CARACTERES_CONSEJO + 1);
    const cobertura = comprobarCobertura(TEMARIO, [leccion('mediatriz-segmento', 1, { pasos: datos.pasos })]);
    expect(cobertura.errores).toEqual([]);
    expect(cobertura.avisos).toEqual([
      `«mediatriz-segmento» paso 1: el consejo tiene ${MAX_CARACTERES_CONSEJO + 1} caracteres (máximo recomendado ${MAX_CARACTERES_CONSEJO})`,
    ]);
  });
});

describe('encargoDe', () => {
  it('compone el texto que se pega en Claude', () => {
    const texto = encargoDe(TEMARIO.lecciones[1], ['mediatriz-segmento']);
    expect(texto.split('\n')).toEqual([
      'Genera la lección «Título de bisectriz-angulo».',
      'id: bisectriz-angulo · bloque: 1 (Elementos fundamentales y lugar geométrico)',
      'requisitos: mediatriz-segmento',
      '',
      ENCARGO,
      '',
      'La lección debe incluir comprobaciones de estos tipos: equidistante.',
      'Entre 6 y 10 pasos, cada uno con consejo, y 2 o 3 errores frecuentes.',
    ]);
  });

  it('avisa de un requisito que todavía no existe', () => {
    const texto = encargoDe(TEMARIO.lecciones[2], []);
    expect(texto).toContain('requisitos: bisectriz-angulo (todavía no existe)');
  });

  it('dice «ninguno» cuando no hay requisitos', () => {
    expect(encargoDe(TEMARIO.lecciones[0], [])).toContain('requisitos: ninguno');
  });
});

describe('agruparPorBloque y vecinas', () => {
  const publicadas = new Set(['mediatriz-segmento', 'tangente-recta']);

  it('agrupa por bloque con su nombre y marca las publicadas', () => {
    expect(agruparPorBloque(TEMARIO, publicadas)).toEqual([
      {
        bloque: 1,
        nombre: 'Elementos fundamentales y lugar geométrico',
        lecciones: [
          { id: 'mediatriz-segmento', titulo: 'Título de mediatriz-segmento', publicada: true, requisitos: [] },
          {
            id: 'bisectriz-angulo',
            titulo: 'Título de bisectriz-angulo',
            publicada: false,
            requisitos: ['mediatriz-segmento'],
          },
        ],
      },
      {
        bloque: 9,
        nombre: 'Tangencias',
        lecciones: [
          {
            id: 'tangente-recta',
            titulo: 'Título de tangente-recta',
            publicada: true,
            requisitos: ['bisectriz-angulo'],
          },
        ],
      },
    ]);
  });

  it('da la anterior y la siguiente entre las publicadas, saltando las pendientes', () => {
    expect(vecinas(TEMARIO, publicadas, 'mediatriz-segmento')).toEqual({
      anterior: null,
      siguiente: TEMARIO.lecciones[2],
    });
    expect(vecinas(TEMARIO, publicadas, 'tangente-recta')).toEqual({
      anterior: TEMARIO.lecciones[0],
      siguiente: null,
    });
  });

  it('devuelve vacío para una lección que no está publicada', () => {
    expect(vecinas(TEMARIO, publicadas, 'bisectriz-angulo')).toEqual({ anterior: null, siguiente: null });
  });
});

describe('comprobarRevision', () => {
  it('exige revisar todas las prioritarias y una de cada tres de las demás', () => {
    const lecciones = [
      leccion('a', 1, { meta: REVISADA }),
      leccion('b', 1),
      leccion('c', 2),
      leccion('d', 9),
      leccion('e', 8, { meta: REVISADA }),
    ];
    expect(comprobarRevision(lecciones)).toEqual({
      ok: false,
      faltan: ['d: bloque 9, prioritaria y sin revisar'],
    });
  });

  it('pide más revisiones de muestra si no llegan a una de cada tres', () => {
    const lecciones = [leccion('a', 1), leccion('b', 1), leccion('c', 2), leccion('d', 3)];
    expect(comprobarRevision(lecciones)).toEqual({
      ok: false,
      faltan: ['revisión de muestra: 0 de 2 lecciones (una de cada tres) revisadas en los demás bloques'],
    });
  });

  it('da por buena una revisión completa', () => {
    const lecciones = [leccion('a', 1, { meta: REVISADA }), leccion('b', 1), leccion('c', 9, { meta: REVISADA })];
    expect(comprobarRevision(lecciones)).toEqual({ ok: true, faltan: [] });
  });
});

describe('formatearTemario', () => {
  it('lista el temario por bloques, con errores y avisos', () => {
    const cobertura = comprobarCobertura(TEMARIO, [leccion('mediatriz-segmento', 1), leccion('otra', 1)]);
    expect(formatearTemario(TEMARIO, cobertura).split('\n')).toEqual([
      'Temario: 1 de 3 lecciones generadas',
      '',
      'Bloque 1 · Elementos fundamentales y lugar geométrico',
      '  ✔ mediatriz-segmento',
      '  · bisectriz-angulo (pendiente)',
      '',
      'Bloque 9 · Tangencias',
      '  · tangente-recta (pendiente)',
      '',
      'Errores:',
      '- «otra» no figura en el temario',
    ]);
  });
});
