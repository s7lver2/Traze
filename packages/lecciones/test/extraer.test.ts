import { describe, expect, it } from 'vitest';
import { extraerJson } from '../src/extraer';

describe('extraerJson', () => {
  it('lee un objeto JSON plano', () => {
    expect(extraerJson('{ "id": "a" }')).toEqual({ ok: true, datos: { id: 'a' } });
  });

  it('lee el bloque ```json de una respuesta con texto alrededor', () => {
    const respuesta = 'Aquí tienes:\n\n```json\n{ "id": "a" }\n```\n\n¿Quieres cambios?';
    expect(extraerJson(respuesta)).toEqual({ ok: true, datos: { id: 'a' } });
  });

  it('lee un bloque de código sin indicar el lenguaje', () => {
    expect(extraerJson('```\n{ "id": "a" }\n```')).toEqual({ ok: true, datos: { id: 'a' } });
  });

  it('con varios bloques se queda con el último válido', () => {
    const respuesta = '```json\n{ "version": 1 }\n```\ncorrección:\n```json\n{ "version": 2 }\n```';
    expect(extraerJson(respuesta)).toEqual({ ok: true, datos: { version: 2 } });
  });

  it('lee el objeto aunque no haya bloque de código', () => {
    expect(extraerJson('Mira esto: { "id": "a" } y ya.')).toEqual({
      ok: true,
      datos: { id: 'a' },
    });
  });

  it('ignora una marca de orden de bytes al principio', () => {
    expect(extraerJson('\uFEFF{ "id": "a" }')).toEqual({ ok: true, datos: { id: 'a' } });
  });

  it('rechaza un texto vacío', () => {
    expect(extraerJson('   \n ')).toEqual({ ok: false, error: 'el texto está vacío' });
  });

  it('rechaza un texto sin ningún objeto', () => {
    expect(extraerJson('hola')).toEqual({
      ok: false,
      error: 'no se encuentra ningún objeto JSON (falta el bloque ```json)',
    });
  });

  it('explica por qué un JSON roto no es válido', () => {
    const resultado = extraerJson('```json\n{ "id": \n```');
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.error.startsWith('JSON no válido:')).toBe(true);
  });

  it('rechaza un JSON que no es un objeto', () => {
    expect(extraerJson('```json\n[1, 2]\n```')).toEqual({
      ok: false,
      error: 'el JSON no es un objeto',
    });
  });
});