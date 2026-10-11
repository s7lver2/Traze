import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { consejosGeneralesSchema } from '../src/consejos';
import { TIPOS_CONSEJO } from '../src/consejos-busqueda';
import { formatearIssue } from '../src/validar';

const archivo = fileURLToPath(new URL('../../../consejos/generales.json', import.meta.url));
const resultado = consejosGeneralesSchema.safeParse(JSON.parse(readFileSync(archivo, 'utf-8')));

describe('consejos/generales.json', () => {
  it('es válido', () => {
    expect(resultado.success, resultado.success ? '' : resultado.error.issues.map(formatearIssue).join('\n')).toBe(true);
  });

  it('cubre los seis tipos de consejo del spec', () => {
    if (!resultado.success) throw new Error('consejos inválidos');
    const tipos = new Set(resultado.data.consejos.map((consejo) => consejo.tipo));
    expect([...tipos].sort()).toEqual([...TIPOS_CONSEJO].sort());
  });

  it('trae la lista de comprobación de la lámina', () => {
    if (!resultado.success) throw new Error('consejos inválidos');
    expect(resultado.data.listaComprobacion.length).toBeGreaterThanOrEqual(5);
  });
});
