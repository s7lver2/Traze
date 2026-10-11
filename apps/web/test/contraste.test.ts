import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MINIMO_AA, contraste, luminancia } from '../src/accesibilidad/contraste';

const css = readFileSync(
  fileURLToPath(new URL('../src/estilos/tokens.css', import.meta.url)),
  'utf-8',
);

function token(nombre: string): string {
  const coincidencia = new RegExp(`--${nombre}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(css);
  if (!coincidencia) throw new Error(`Falta el token de color --${nombre} (seis cifras hex)`);
  return coincidencia[1];
}

describe('contraste', () => {
  it('negro sobre blanco vale 21', () => {
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });

  it('el mismo color consigo mismo vale 1', () => {
    expect(contraste('#f7f0de', '#f7f0de')).toBeCloseTo(1, 5);
  });

  it('no depende del orden de los colores', () => {
    expect(contraste('#2b2b2b', '#f7f0de')).toBeCloseTo(contraste('#f7f0de', '#2b2b2b'), 10);
  });

  it('rechaza un color que no sea #rrggbb', () => {
    expect(() => luminancia('rojo')).toThrow('Color no válido');
    expect(() => luminancia('#fff')).toThrow('Color no válido');
  });
});

const PARES: readonly [texto: string, fondo: string][] = [
  ['tinta', 'papel'],
  ['tinta', 'papel-claro'],
  ['tinta', 'papel-sombra'],
  ['tinta', 'mesa'],
  ['tinta', 'nota-fondo'],
  ['tinta-suave', 'papel'],
  ['tinta-suave', 'papel-claro'],
  ['tinta-suave', 'mesa'],
  ['azul-correccion', 'papel'],
  ['azul-correccion', 'papel-claro'],
  ['azul-correccion', 'nota-fondo'],
  ['azul-correccion', 'mesa'],
  ['rojo-profe', 'papel'],
  ['papel', 'tinta'],
  ['papel', 'azul-correccion'],
  ['papel', 'tinta-suave'],
  ['exito-texto', 'exito-suave'],
  ['tinta', 'postit-amarillo'],
  ['tinta', 'postit-rosa'],
  ['tinta', 'postit-azul'],
  ['tinta-suave', 'postit-amarillo'],
  ['tinta-suave', 'postit-rosa'],
  ['tinta-suave', 'postit-azul'],
  ['azul-correccion', 'postit-azul'],
];

describe('contraste AA de los pares de texto principales', () => {
  it.each(PARES)('%s sobre %s llega a 4,5:1', (texto, fondo) => {
    expect(contraste(token(texto), token(fondo))).toBeGreaterThanOrEqual(MINIMO_AA);
  });
});
