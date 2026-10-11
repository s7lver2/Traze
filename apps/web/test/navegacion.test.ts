import { describe, expect, it } from 'vitest';
import { ENLACES, enlacesVisibles, esActivo } from '../src/navegacion';

const lecciones = ENLACES.find((enlace) => enlace.texto === 'Lecciones')!;

describe('enlacesVisibles', () => {
  it('muestra Temario, Lecciones y Consejos (Mi carpeta aún no existe)', () => {
    expect(enlacesVisibles().map((enlace) => enlace.texto)).toEqual([
      'Temario',
      'Lecciones',
      'Consejos',
    ]);
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

  it('Temario está activo en /temario (con o sin barra final) y no en las lecciones', () => {
    const temario = ENLACES.find((enlace) => enlace.texto === 'Temario')!;
    expect(esActivo(temario, '/temario')).toBe(true);
    expect(esActivo(temario, '/temario/')).toBe(true);
    expect(esActivo(temario, '/temarioviejo')).toBe(false);
    expect(esActivo(temario, '/leccion/mediatriz-segmento')).toBe(false);
  });

  it('Consejos está activo en /consejos y no en otras secciones', () => {
    const consejos = ENLACES.find((enlace) => enlace.texto === 'Consejos')!;
    expect(esActivo(consejos, '/consejos')).toBe(true);
    expect(esActivo(consejos, '/consejos/')).toBe(true);
    expect(esActivo(consejos, '/consejosviejos')).toBe(false);
    expect(esActivo(consejos, '/temario')).toBe(false);
  });
});
