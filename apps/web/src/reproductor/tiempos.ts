import type { PrimitivaResuelta } from '@traze/lecciones';

export const DURACION_MS: Record<PrimitivaResuelta['tipo'], number> = {
  punto: 400,
  segmento: 900,
  recta: 1200,
  arco: 1400,
  marcaAnguloRecto: 500,
  marcaIgualdad: 400,
};

export const clamp01 = (valor: number): number => Math.min(1, Math.max(0, valor));

export interface PrimitivaAnimada {
  clave: string;
  primitiva: PrimitivaResuelta;
  progreso: number;
  delPasoActual: boolean;
}

export function duracionPaso(dibujo: readonly PrimitivaResuelta[]): number {
  return dibujo.reduce((total, primitiva) => total + DURACION_MS[primitiva.tipo], 0);
}

export function progresoPrimitivas(
  dibujo: readonly PrimitivaResuelta[],
  progresoPaso: number,
): number[] {
  const transcurrido = clamp01(progresoPaso) * duracionPaso(dibujo);
  let inicio = 0;
  return dibujo.map((primitiva) => {
    const duracion = DURACION_MS[primitiva.tipo];
    const progreso = clamp01((transcurrido - inicio) / duracion);
    inicio += duracion;
    return progreso;
  });
}

export function primitivasVisibles(
  dibujos: readonly (readonly PrimitivaResuelta[])[],
  paso: number,
  progreso: number,
): PrimitivaAnimada[] {
  const visibles: PrimitivaAnimada[] = [];
  dibujos.forEach((dibujo, i) => {
    if (i > paso) return;
    const progresos = i < paso ? dibujo.map(() => 1) : progresoPrimitivas(dibujo, progreso);
    dibujo.forEach((primitiva, j) => {
      if (progresos[j] > 0) {
        visibles.push({
          clave: `${i}-${j}`,
          primitiva,
          progreso: progresos[j],
          delPasoActual: i === paso,
        });
      }
    });
  });
  return visibles;
}