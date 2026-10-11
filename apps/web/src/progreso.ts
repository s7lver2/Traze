export type EstadoLeccion = 'vista' | 'practicada' | 'dominada';

const ORDEN: readonly EstadoLeccion[] = ['vista', 'practicada', 'dominada'];

export interface RegistroLeccion {
  estado: EstadoLeccion;
  fecha: string;
}

export interface Progreso {
  version: 1;
  lecciones: Record<string, RegistroLeccion>;
}

export const CLAVE_PROGRESO = 'traze:progreso';

export const progresoVacio = (): Progreso => ({ version: 1, lecciones: {} });

const esEstado = (valor: unknown): valor is EstadoLeccion =>
  typeof valor === 'string' && (ORDEN as readonly string[]).includes(valor);

export function estadoDe(progreso: Progreso, id: string): EstadoLeccion | null {
  return Object.hasOwn(progreso.lecciones, id) ? progreso.lecciones[id].estado : null;
}

export function registrar(
  progreso: Progreso,
  id: string,
  estado: EstadoLeccion,
  fecha: string,
): Progreso {
  const actual = estadoDe(progreso, id);
  if (actual !== null && ORDEN.indexOf(actual) >= ORDEN.indexOf(estado)) return progreso;
  return { ...progreso, lecciones: { ...progreso.lecciones, [id]: { estado, fecha } } };
}

export function resumir(
  progreso: Progreso,
  ids: readonly string[],
): Record<EstadoLeccion, number> {
  const cuentas: Record<EstadoLeccion, number> = { vista: 0, practicada: 0, dominada: 0 };
  for (const id of ids) {
    const estado = estadoDe(progreso, id);
    if (estado !== null) cuentas[estado]++;
  }
  return cuentas;
}

export function serializar(progreso: Progreso): string {
  return JSON.stringify(progreso);
}

export function leerProgreso(almacen: Pick<Storage, 'getItem'> | null): Progreso {
  try {
    const texto = almacen?.getItem(CLAVE_PROGRESO);
    if (!texto) return progresoVacio();
    const datos: unknown = JSON.parse(texto);
    if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) return progresoVacio();
    const { version, lecciones } = datos as { version?: unknown; lecciones?: unknown };
    if (version !== 1 || typeof lecciones !== 'object' || lecciones === null || Array.isArray(lecciones)) {
      return progresoVacio();
    }
    const limpio: Record<string, RegistroLeccion> = {};
    for (const [id, registro] of Object.entries(lecciones)) {
      const { estado, fecha } = (registro ?? {}) as { estado?: unknown; fecha?: unknown };
      if (!esEstado(estado) || typeof fecha !== 'string') return progresoVacio();
      limpio[id] = { estado, fecha };
    }
    return { version: 1, lecciones: limpio };
  } catch {
    return progresoVacio();
  }
}
