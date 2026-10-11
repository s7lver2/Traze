import type { Leccion } from './esquema';

/** Bloques que el spec manda revisar con prioridad: tangencias (9). */
export const BLOQUES_PRIORITARIOS: readonly number[] = [9];

export function esPrioritaria(leccion: Leccion): boolean {
  return leccion.meta.revision === 'pendiente' && BLOQUES_PRIORITARIOS.includes(leccion.bloque);
}

function rango(leccion: Leccion): number {
  if (leccion.meta.revision === 'revisada') return 2;
  return esPrioritaria(leccion) ? 0 : 1;
}

export function resumenEstado(lecciones: readonly Leccion[]): string {
  if (lecciones.length === 0) return 'No hay ninguna lección en contenido/';

  const ordenadas = [...lecciones].sort(
    (a, b) => rango(a) - rango(b) || a.bloque - b.bloque || a.id.localeCompare(b.id),
  );
  const ancho = Math.max(...ordenadas.map((leccion) => leccion.id.length));
  const pendientes = lecciones.filter((leccion) => leccion.meta.revision === 'pendiente').length;
  const prioritarias = lecciones.filter(esPrioritaria).length;

  const lineas = [
    `Lecciones: ${lecciones.length} · revisadas: ${lecciones.length - pendientes} · pendientes: ${pendientes} · prioritarias: ${prioritarias}`,
    '',
  ];
  for (const leccion of ordenadas) {
    const marca = esPrioritaria(leccion) ? '⚑' : ' ';
    const revision =
      leccion.meta.revision === 'revisada'
        ? `revisada (${leccion.meta.revisadaPor}, ${leccion.meta.revisadaEl})`
        : 'pendiente';
    lineas.push(
      `${marca} ${leccion.id.padEnd(ancho)}  bloque ${leccion.bloque}  v${leccion.meta.version}  ${revision}`,
    );
  }
  return lineas.join('\n');
}
