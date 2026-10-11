export const VELOCIDADES = [0.5, 1, 2] as const;
export type Velocidad = (typeof VELOCIDADES)[number];

export interface EstadoReproductor {
  totalPasos: number;
  paso: number;
  progreso: number;
  reproduciendo: boolean;
  encadenar: boolean;
  velocidad: Velocidad;
  ocultarConstruccion: boolean;
  animar: boolean;
}

export type Accion =
  | { tipo: 'avanzar'; ms: number; duracionPasoMs: number }
  | { tipo: 'siguiente' }
  | { tipo: 'anterior' }
  | { tipo: 'irA'; paso: number }
  | { tipo: 'reiniciar' }
  | { tipo: 'verSolucion' }
  | { tipo: 'alternarReproduccion' }
  | { tipo: 'velocidad'; valor: Velocidad }
  | { tipo: 'alternarConstruccion' }
  | { tipo: 'animar'; valor: boolean };

export function crearEstado(totalPasos: number, animar = true): EstadoReproductor {
  if (totalPasos < 1) throw new Error('Una lección necesita al menos un paso');
  return {
    totalPasos,
    paso: 0,
    progreso: animar ? 0 : 1,
    reproduciendo: animar,
    encadenar: false,
    velocidad: 1,
    ocultarConstruccion: false,
    animar,
  };
}

function entrar(estado: EstadoReproductor, paso: number, encadenar: boolean): EstadoReproductor {
  const limitado = Math.min(Math.max(Math.trunc(paso), 0), estado.totalPasos - 1);
  return {
    ...estado,
    paso: limitado,
    progreso: estado.animar ? 0 : 1,
    reproduciendo: estado.animar,
    encadenar: estado.animar && encadenar,
  };
}

export function reductor(estado: EstadoReproductor, accion: Accion): EstadoReproductor {
  switch (accion.tipo) {
    case 'avanzar': {
      if (!estado.reproduciendo) return estado;
      const ms = Math.max(0, accion.ms);
      const delta = accion.duracionPasoMs > 0 ? (ms * estado.velocidad) / accion.duracionPasoMs : 1;
      const progreso = Math.min(1, estado.progreso + delta);
      if (progreso < 1) return { ...estado, progreso };
      if (estado.encadenar && estado.paso < estado.totalPasos - 1) {
        return entrar(estado, estado.paso + 1, true);
      }
      return { ...estado, progreso: 1, reproduciendo: false, encadenar: false };
    }
    case 'siguiente':
      return estado.paso >= estado.totalPasos - 1 ? estado : entrar(estado, estado.paso + 1, false);
    case 'anterior':
      return estado.paso <= 0 ? estado : entrar(estado, estado.paso - 1, false);
    case 'irA':
      return entrar(estado, accion.paso, false);
    case 'reiniciar':
      return entrar(estado, 0, false);
    case 'verSolucion':
      return {
        ...estado,
        paso: estado.totalPasos - 1,
        progreso: 1,
        reproduciendo: false,
        encadenar: false,
      };
    case 'alternarReproduccion': {
      if (!estado.animar) return estado;
      if (estado.reproduciendo) {
        return { ...estado, reproduciendo: false, encadenar: false };
      }
      if (estado.progreso >= 1) {
        const siguiente = estado.paso < estado.totalPasos - 1 ? estado.paso + 1 : 0;
        return entrar(estado, siguiente, true);
      }
      return { ...estado, reproduciendo: true, encadenar: true };
    }
    case 'velocidad':
      return { ...estado, velocidad: accion.valor };
    case 'alternarConstruccion':
      return { ...estado, ocultarConstruccion: !estado.ocultarConstruccion };
    case 'animar':
      return accion.valor
        ? { ...estado, animar: true }
        : { ...estado, animar: false, progreso: 1, reproduciendo: false, encadenar: false };
  }
}