import { describe, expect, it } from 'vitest';
import { ENLACES, enlacesVisibles, esActivo } from '../src/navegacion';

const lecciones = ENLACES.find((enlace) => enlace.texto === 'Lecciones')!;

describe('enlacesVisibles', () => {
  it('hoy solo muestra Lecciones (las páginas del Plan 3 aún no existen)', () => {
    expect(enlacesVisibles().map((enlace) => enlace.texto)).toEqual(['Lecciones']);
  });

  it('los enlaces están en el orden del spec', () => {
    expect(ENLACES.map((enlace) => enlace.texto)).toEqual([
      'Temario',
      'Lecciones',
      'Consejos',
      'Mi carpeta',
    ]);
  });

  it('muestra un enlace en cuanto está disponible', () => {
    const todos = ENLACES.map((enlace) => ({ ...enlace, disponible: true }));
    expect(enlacesVisibles(todos)).toHaveLength(4);
  });
});

describe('esActivo', () => {
  it('Lecciones está activa en la portada y en cualquier lección', () => {
    expect(esActivo(lecciones, '/')).toBe(true);
    expect(esActivo(lecciones, '/leccion/mediatriz-segmento')).toBe(true);
  });

  it('tolera la barra final', () => {
    expect(esActivo(lecciones, '/leccion/mediatriz-segmento/')).toBe(true);
  });

  it('no se activa con un prefijo parecido ni en otras secciones', () => {
    expect(esActivo(lecciones, '/leccionfalsa')).toBe(false);
    expect(esActivo(lecciones, '/consejos')).toBe(false);
    expect(esActivo(lecciones, '/temario')).toBe(false);
  });
});
