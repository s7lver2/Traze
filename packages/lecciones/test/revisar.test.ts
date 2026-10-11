import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import { marcarRevisada } from '../src/revisar';
import { validarLeccion } from '../src/validar';

function base(meta?: unknown): Record<string, unknown> {
  return { ...structuredClone(piloto), ...(meta ? { meta } : {}) };
}

describe('marcarRevisada', () => {
  it('firma la revisión y conserva la versión', () => {
    const resultado = marcarRevisada(base({ version: 2, revision: 'pendiente' }), 'Ana', '2026-10-12');
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.datos.meta).toEqual({
      version: 2,
      revision: 'revisada',
      revisadaPor: 'Ana',
      revisadaEl: '2026-10-12',
    });
  });

  it('parte de la versión 1 si la lección no tenía meta', () => {
    const resultado = marcarRevisada(base(), 'Ana', '2026-10-12');
    if (!resultado.ok) throw new Error('se esperaba una revisión válida');
    expect(resultado.datos.meta).toMatchObject({ version: 1, revision: 'revisada' });
  });

  it('exige el nombre del revisor', () => {
    expect(marcarRevisada(base(), '   ', '2026-10-12')).toEqual({
      ok: false,
      error: 'falta el nombre del revisor (--por)',
    });
  });

  it('exige una fecha con formato AAAA-MM-DD', () => {
    expect(marcarRevisada(base(), 'Ana', '12/10/2026')).toEqual({
      ok: false,
      error: 'la fecha va como AAAA-MM-DD',
    });
  });

  it('deja una lección que sigue siendo válida', () => {
    const resultado = marcarRevisada(base(), 'Ana', '2026-10-12');
    if (!resultado.ok) throw new Error('se esperaba una revisión válida');
    expect(validarLeccion(resultado.datos).ok).toBe(true);
  });
});
