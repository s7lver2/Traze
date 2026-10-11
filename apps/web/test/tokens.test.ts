import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const carpeta = fileURLToPath(new URL('../src/estilos/', import.meta.url));
const tokens = readFileSync(`${carpeta}tokens.css`, 'utf-8');

const NECESARIOS = [
  'papel',
  'papel-claro',
  'mesa',
  'papel-sombra',
  'tinta',
  'tinta-suave',
  'azul-correccion',
  'rojo-profe',
  'margen',
  'regla',
  'exito-suave',
  'exito-texto',
  'nota-fondo',
  'velo',
  'rejilla-mesa',
  'escuadra',
  'cuadricula',
  'cuadricula-gruesa',
  'postit-amarillo',
  'postit-rosa',
  'postit-azul',
  'radio-postit',
  'grafito-dato',
  'grafito-construccion',
  'grafito-resultado',
  'rotulacion',
  'interfaz',
  'serif',
  'radio-chico',
  'radio-medio',
  'radio-hoja',
  'radio-pildora',
  'sombra-hoja',
  'sombra-suave',
  'sombra-boton',
  'e1',
  'e2',
  'e3',
  'e4',
  'e5',
  'e6',
  't-control',
  't-panel',
  't-entrada',
  'curva',
];

describe('tokens.css', () => {
  it.each(NECESARIOS)('define --%s', (nombre) => {
    expect(tokens).toContain(`--${nombre}:`);
  });

  it('con prefers-reduced-motion: reduce todas las duraciones pasan a 0 ms', () => {
    const bloque = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/.exec(tokens);
    expect(bloque).not.toBeNull();
    for (const nombre of ['t-control', 't-panel', 't-entrada']) {
      expect(bloque![1]).toMatch(new RegExp(`--${nombre}:\\s*0ms;`));
    }
  });
});

describe('el resto de archivos CSS', () => {
  const otros = readdirSync(carpeta).filter(
    (nombre) => nombre.endsWith('.css') && nombre !== 'tokens.css',
  );

  it.each(otros.length > 0 ? otros : ['(aún no hay otros archivos)'])(
    '%s no usa colores literales',
    (nombre) => {
      if (otros.length === 0) return;
      const sinComentarios = readFileSync(`${carpeta}${nombre}`, 'utf-8').replace(
        /\/\*[\s\S]*?\*\//g,
        '',
      );
      expect(sinComentarios).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
    },
  );
});
