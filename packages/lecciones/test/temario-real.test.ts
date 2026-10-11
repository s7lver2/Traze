import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { listarContenido } from '../src/almacen';
import { leccionSchema, type Leccion } from '../src/esquema';
import { comprobarCobertura, temarioSchema } from '../src/temario';
import { formatearIssue } from '../src/validar';

const archivo = fileURLToPath(new URL('../../../temario/temario.json', import.meta.url));
const resultado = temarioSchema.safeParse(JSON.parse(readFileSync(archivo, 'utf-8')));

describe('temario/temario.json', () => {
  it('es válido', () => {
    expect(resultado.success, resultado.success ? '' : resultado.error.issues.map(formatearIssue).join('\n')).toBe(true);
  });

  it('tiene las 57 lecciones del temario', () => {
    if (!resultado.success) throw new Error('temario inválido');
    expect(resultado.data.lecciones.length).toBe(57);
  });

  it('empieza por el uso del compás y recorre los 10 bloques', () => {
    if (!resultado.success) throw new Error('temario inválido');
    const bloques = new Set(resultado.data.lecciones.map((entrada) => entrada.bloque));
    expect(resultado.data.lecciones[0].id).toBe('compas-basico');
    expect([...bloques].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('las lecciones que ya existen cumplen su entrada', () => {
    if (!resultado.success) throw new Error('temario inválido');
    const lecciones: Leccion[] = listarContenido().flatMap(({ datos }) => {
      const r = leccionSchema.safeParse(datos);
      return r.success ? [r.data] : [];
    });
    expect(comprobarCobertura(resultado.data, lecciones).errores).toEqual([]);
  });
});
