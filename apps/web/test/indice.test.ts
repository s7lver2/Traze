import { describe, expect, it } from 'vitest';
import { etiquetaPaso, situacionPaso } from '../src/reproductor/indice';

describe('situacionPaso', () => {
  it('los pasos anteriores al actual están hechos', () => {
    expect(situacionPaso(0, 2)).toBe('hecho');
    expect(situacionPaso(1, 2)).toBe('hecho');
  });

  it('el paso en curso es el actual', () => {
    expect(situacionPaso(2, 2)).toBe('actual');
    expect(situacionPaso(0, 0)).toBe('actual');
  });

  it('los siguientes están pendientes', () => {
    expect(situacionPaso(3, 2)).toBe('pendiente');
  });
});

describe('etiquetaPaso', () => {
  it('numera desde 1 e incluye el título', () => {
    expect(etiquetaPaso(0, 'Los datos', 'actual')).toBe('Ir al paso 1: Los datos');
  });

  it('avisa por texto de que el paso está hecho, sin depender del color', () => {
    expect(etiquetaPaso(1, 'Arcos con centro en A', 'hecho')).toBe(
      'Ir al paso 2: Arcos con centro en A (hecho)',
    );
  });

  it('un paso pendiente no añade nada', () => {
    expect(etiquetaPaso(4, 'Une M con N', 'pendiente')).toBe('Ir al paso 5: Une M con N');
  });
});
