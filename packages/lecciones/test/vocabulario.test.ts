import { describe, expect, it } from 'vitest';
import {
  comprobacionSchema,
  derivadoSchema,
  leccionSchema,
  primitivaSchema,
} from '../src/esquema';
import {
  CAMPOS_LECCION,
  COMPROBACIONES,
  DERIVADOS,
  PRIMITIVAS,
  type EntradaVocabulario,
} from '../src/vocabulario';

type Opcion = { shape: { tipo: { value: string } } };

const tiposDelVocabulario = (entradas: readonly EntradaVocabulario[]) =>
  entradas.map((entrada) => entrada.tipo).sort();
const tiposDelEsquema = (opciones: readonly Opcion[]) =>
  opciones.map((opcion) => opcion.shape.tipo.value).sort();

describe('sincronía del vocabulario con el esquema', () => {
  it('documenta exactamente las primitivas del esquema', () => {
    expect(tiposDelVocabulario(PRIMITIVAS)).toEqual(tiposDelEsquema(primitivaSchema.options));
  });

  it('documenta exactamente los derivados del esquema', () => {
    expect(tiposDelVocabulario(DERIVADOS)).toEqual(tiposDelEsquema(derivadoSchema.options));
  });

  it('documenta exactamente las comprobaciones del esquema', () => {
    expect(tiposDelVocabulario(COMPROBACIONES)).toEqual(
      tiposDelEsquema(comprobacionSchema.options),
    );
  });

  it('documenta exactamente los campos de la lección, salvo meta', () => {
    const delEsquema = Object.keys(leccionSchema.innerType().shape)
      .filter((campo) => campo !== 'meta')
      .sort();
    expect(CAMPOS_LECCION.map((campo) => campo.nombre).sort()).toEqual(delEsquema);
  });

  it('describe cada entrada con campos y descripción', () => {
    for (const entrada of [...PRIMITIVAS, ...DERIVADOS, ...COMPROBACIONES]) {
      expect(entrada.campos.length, entrada.tipo).toBeGreaterThan(0);
      expect(entrada.descripcion.length, entrada.tipo).toBeGreaterThan(0);
    }
    for (const campo of CAMPOS_LECCION) {
      expect(campo.descripcion.length, campo.nombre).toBeGreaterThan(0);
    }
  });
});

describe('ejemplos del vocabulario', () => {
  for (const entrada of PRIMITIVAS) {
    it(`el ejemplo de la primitiva ${entrada.tipo} es válido`, () => {
      expect(primitivaSchema.safeParse(entrada.ejemplo).success).toBe(true);
    });
  }

  for (const entrada of DERIVADOS) {
    it(`el ejemplo del derivado ${entrada.tipo} es válido`, () => {
      expect(derivadoSchema.safeParse(entrada.ejemplo).success).toBe(true);
    });
  }

  for (const entrada of COMPROBACIONES) {
    it(`el ejemplo de la comprobación ${entrada.tipo} es válido`, () => {
      expect(comprobacionSchema.safeParse(entrada.ejemplo).success).toBe(true);
    });
  }
});