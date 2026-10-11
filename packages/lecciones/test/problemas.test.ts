import { describe, expect, it } from 'vitest';
import { listarContenido } from '../src/almacen';
import { leccionSchema, type Leccion } from '../src/esquema';
import { ejecutarComprobaciones, interpretarLeccion } from '../src/interpretar';
import { comprobarRender } from '../src/render';
import { crearAzar, enunciadoDelProblema, generarProblema } from '../src/problemas';

const lecciones: Leccion[] = listarContenido().flatMap(({ datos }) => {
  const resultado = leccionSchema.safeParse(datos);
  return resultado.success ? [resultado.data] : [];
});

const SEMILLAS = [1, 2, 3, 7, 42, 2026];

describe('crearAzar', () => {
  it('repite la misma secuencia con la misma semilla y cambia con otra', () => {
    const a = crearAzar(5);
    const b = crearAzar(5);
    const c = crearAzar(6);
    const secuenciaA = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(secuenciaA);
    expect([c(), c(), c()]).not.toEqual(secuenciaA);
  });

  it('da números en [0, 1)', () => {
    const azar = crearAzar(99);
    for (let i = 0; i < 1000; i++) {
      const valor = azar();
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThan(1);
    }
  });
});

describe('generarProblema con las lecciones reales', () => {
  it('hay lecciones con las que probar', () => {
    expect(lecciones.length).toBeGreaterThan(10);
  });

  it.each(lecciones.map((leccion) => [leccion.id, leccion] as const))(
    '%s: genera problemas posibles con cualquier semilla',
    (_id, leccion) => {
      for (const semilla of SEMILLAS) {
        const problema = generarProblema(leccion, semilla);
        expect(problema, `semilla ${semilla}`).not.toBeNull();
        if (!problema) continue;
        const resuelta = interpretarLeccion(problema.leccion);
        expect(
          ejecutarComprobaciones(problema.leccion, resuelta.puntos, resuelta.radios).every((c) => c.ok),
          `semilla ${semilla}`,
        ).toBe(true);
        expect(comprobarRender(resuelta), `semilla ${semilla}`).toEqual([]);
      }
    },
  );

  it('es determinista: la misma semilla da el mismo problema', () => {
    const leccion = lecciones[0];
    expect(generarProblema(leccion, 11)?.leccion.datos).toEqual(generarProblema(leccion, 11)?.leccion.datos);
  });

  it('semillas distintas dan problemas distintos', () => {
    const leccion = lecciones.find((candidata) => candidata.id === 'mediatriz-segmento') ?? lecciones[0];
    const vistos = new Set(SEMILLAS.map((semilla) => JSON.stringify(generarProblema(leccion, semilla)?.leccion.datos)));
    expect(vistos.size).toBe(SEMILLAS.length);
  });

  it('no modifica la lección original', () => {
    const leccion = structuredClone(lecciones[0]);
    generarProblema(leccion, 3);
    expect(leccion).toEqual(lecciones[0]);
  });

  it('devuelve null si no hay ningún intento disponible', () => {
    expect(generarProblema(lecciones[0], 3, 0)).toBeNull();
  });
});

describe('enunciadoDelProblema', () => {
  it('añade las medidas fijas en mm y no toca un enunciado sin ellas', () => {
    const conMm = lecciones.find((leccion) => Object.values(leccion.radios).some((radio) => 'mm' in radio));
    if (conMm) {
      const problema = generarProblema(conMm, 4)!;
      expect(enunciadoDelProblema(problema)).toContain('Medidas dadas:');
      expect(enunciadoDelProblema(problema)).toContain(' mm');
    }
    const sinMm = lecciones.find((leccion) => Object.values(leccion.radios).every((radio) => !('mm' in radio)))!;
    expect(enunciadoDelProblema(generarProblema(sinMm, 4)!)).toBe(sinMm.enunciado);
  });
});
