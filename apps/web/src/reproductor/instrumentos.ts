import type { PrimitivaResuelta } from '@traze/lecciones';
import { decimal } from './formato';

export type RadioDeclarado =
  | { entre: readonly [string, string]; factor: number }
  | { mm: number };

export interface Banda {
  instrumento?: string;
  lapiz?: string;
  abertura?: string;
}

type Dibujo = readonly PrimitivaResuelta[];

const TOLERANCIA = 1e-6;

export function instrumentoDelPaso(dibujo: Dibujo): string | undefined {
  if (dibujo.some((primitiva) => primitiva.tipo === 'arco')) return 'Compás';
  if (dibujo.some((primitiva) => primitiva.tipo === 'segmento' || primitiva.tipo === 'recta')) {
    return 'Regla';
  }
  return undefined;
}

export function lapizDelPaso(dibujo: Dibujo): string | undefined {
  const estilos = dibujo.flatMap((primitiva) => ('estilo' in primitiva ? [primitiva.estilo] : []));
  if (estilos.length === 0) return undefined;
  return estilos.every((estilo) => estilo === 'construccion') ? '2H' : 'HB';
}

export function aberturaDelPaso(
  dibujo: Dibujo,
  resueltos: Readonly<Record<string, number>>,
  radios: Readonly<Record<string, RadioDeclarado>>,
  factores: Readonly<Record<string, number>>,
): string | undefined {
  const textos = Object.keys(radios)
    .filter(
      (id) =>
        Object.hasOwn(resueltos, id) &&
        dibujo.some(
          (primitiva) =>
            primitiva.tipo === 'arco' && Math.abs(primitiva.radio - resueltos[id]) < TOLERANCIA,
        ),
    )
    .map((id) => {
      const radio = radios[id];
      if ('mm' in radio) return `${decimal(resueltos[id], 1).replace(/,0$/, '')} mm`;
      return `${decimal(factores[id] ?? radio.factor, 2)} × ${radio.entre.join('')}`;
    });
  return textos.length > 0 ? textos.join(', ') : undefined;
}

export function derivarBanda(
  dibujo: Dibujo,
  resueltos: Readonly<Record<string, number>>,
  radios: Readonly<Record<string, RadioDeclarado>>,
  factores: Readonly<Record<string, number>>,
): Banda | null {
  const banda: Banda = {};
  const instrumento = instrumentoDelPaso(dibujo);
  const lapiz = lapizDelPaso(dibujo);
  const abertura = aberturaDelPaso(dibujo, resueltos, radios, factores);
  if (instrumento) banda.instrumento = instrumento;
  if (lapiz) banda.lapiz = lapiz;
  if (abertura) banda.abertura = abertura;
  return Object.keys(banda).length > 0 ? banda : null;
}
