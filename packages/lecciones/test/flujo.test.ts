import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-fundamentos/mediatriz-segmento.json';
import { escribirJson, existentesDe, listarContenido } from '../src/almacen';
import { comprobarBorrador } from '../src/borrador';
import { leccionSchema } from '../src/esquema';
import { resumenEstado } from '../src/estado';
import { prepararPromocion } from '../src/promover';
import { marcarRevisada } from '../src/revisar';

const RUTA = 'bloque-1-fundamentos/mediatriz-prueba.json';

let raiz: string;

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'traze-'));
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

describe('flujo de un borrador hasta su revisión', () => {
  it('promueve, regenera y revisa una lección', () => {
    const borrador = JSON.stringify({ ...structuredClone(piloto), id: 'mediatriz-prueba' });

    // 1. Promoción de un borrador nuevo.
    const primera = comprobarBorrador(borrador, {
      idsExistentes: existentesDe(raiz).map((existente) => existente.id),
    });
    expect(primera.errores).toEqual([]);
    const promocion = prepararPromocion(primera, existentesDe(raiz), { reemplazar: false });
    if (!promocion.ok) throw new Error(promocion.errores.join('\n'));
    escribirJson(join(raiz, promocion.ruta), promocion.contenido);

    expect(listarContenido(raiz).map((archivo) => archivo.ruta)).toEqual([RUTA]);
    expect(existentesDe(raiz)).toEqual([{ id: 'mediatriz-prueba', ruta: RUTA, version: 1 }]);
    expect(readFileSync(join(raiz, RUTA), 'utf-8').endsWith('}\n')).toBe(true);

    // 2. No se promueve otra vez sin --reemplazar; con él sube la versión.
    const segunda = comprobarBorrador(borrador, { idsExistentes: ['mediatriz-prueba'] });
    expect(prepararPromocion(segunda, existentesDe(raiz), { reemplazar: false }).ok).toBe(false);
    const regenerada = prepararPromocion(segunda, existentesDe(raiz), { reemplazar: true });
    if (!regenerada.ok) throw new Error(regenerada.errores.join('\n'));
    expect(regenerada.version).toBe(2);
    escribirJson(join(raiz, regenerada.ruta), regenerada.contenido);

    // 3. Revisión humana.
    const [archivo] = listarContenido(raiz);
    const revision = marcarRevisada(archivo.datos as Record<string, unknown>, 'Ana', '2026-10-12');
    if (!revision.ok) throw new Error(revision.error);
    escribirJson(join(raiz, archivo.ruta), revision.datos);

    const leccion = leccionSchema.parse(listarContenido(raiz)[0].datos);
    expect(leccion.meta).toEqual({
      version: 2,
      revision: 'revisada',
      revisadaPor: 'Ana',
      revisadaEl: '2026-10-12',
    });
    expect(resumenEstado([leccion])).toContain('revisada (Ana, 2026-10-12)');
  });
});
