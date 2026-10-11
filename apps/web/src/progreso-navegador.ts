import {
  CLAVE_PROGRESO,
  leerProgreso,
  progresoVacio,
  registrar,
  serializar,
  type EstadoLeccion,
  type Progreso,
} from './progreso';

export function cargarProgresoNavegador(): Progreso {
  try {
    return leerProgreso(window.localStorage);
  } catch {
    return progresoVacio();
  }
}

export function registrarEstado(id: string, estado: EstadoLeccion): void {
  try {
    const actual = cargarProgresoNavegador();
    const nuevo = registrar(actual, id, estado, new Date().toISOString().slice(0, 10));
    if (nuevo !== actual) window.localStorage.setItem(CLAVE_PROGRESO, serializar(nuevo));
  } catch {
    // Sin almacenamiento (navegación privada, cuota o bloqueo): la lección funciona igual.
  }
}

export function registrarVista(id: string): void {
  registrarEstado(id, 'vista');
}
