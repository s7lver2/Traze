import type { Leccion, Primitiva } from './esquema';
import type { LeccionResuelta, PrimitivaResuelta } from './interpretar';

/** Un reto es una lección que el alumno construye: la app le dice qué hacer y comprueba cada clic. */
export type NivelReto = 'guiado' | 'memoria' | 'examen';
export type Instrumento = 'regla' | 'compas' | 'lapiz';

export const TOLERANCIA_CLIC_MM = 5;
export const ABERTURA_INICIAL_MM = 30;

export interface PuntoReto {
  id: string;
  x: number;
  y: number;
}

export type AccionReto =
  | {
      tipo: 'regla';
      desde: PuntoReto;
      hasta: PuntoReto;
      primitiva: number;
      texto: string;
    }
  | {
      tipo: 'compas';
      centro: PuntoReto;
      /** Abertura que hay que dar, en mm. */
      abertura: number;
      descripcionAbertura: string;
      primitiva: number;
      texto: string;
    }
  | {
      tipo: 'compasEntre';
      centro: PuntoReto;
      desde: PuntoReto;
      hasta: PuntoReto;
      primitiva: number;
      texto: string;
    }
  | { tipo: 'marcar'; punto: PuntoReto; primitiva: number; texto: string };

export interface PasoReto {
  titulo: string;
  texto: string;
  porque: string;
  consejo?: string;
  /** Primitivas que salen solas al empezar el paso: los datos. */
  automaticas: number[];
  acciones: AccionReto[];
  /** Marcas de ángulo recto y de igualdad: aparecen al completar el paso. */
  marcas: number[];
}

export interface Reto {
  leccionId: string;
  titulo: string;
  enunciado: string;
  lienzo: { ancho: number; alto: number };
  pasos: PasoReto[];
  dibujos: PrimitivaResuelta[][];
  /** Todos los puntos de la construcción: a los que se puede pinchar. */
  puntos: PuntoReto[];
}

export interface Mensaje {
  tipo: 'ok' | 'error' | 'info';
  texto: string;
}

export interface EstadoReto {
  nivel: NivelReto;
  paso: number;
  /** Orden en que se completan las acciones del paso en curso (los puntos consecutivos se admiten sin orden). */
  orden: number[];
  accion: number;
  /** Índices de primitiva del paso en curso que ya están dibujados. */
  hechas: number[];
  instrumento: Instrumento | null;
  clics: PuntoReto[];
  abertura: number;
  errores: number;
  pistas: number;
  pista: boolean;
  mensaje: Mensaje | null;
  terminado: boolean;
}

export type EstadoProgreso = 'practicada' | 'dominada';

export interface ResumenReto {
  nivel: NivelReto;
  errores: number;
  pistas: number;
  progreso: EstadoProgreso;
}

const decimal = (numero: number, cifras = 2): string =>
  numero.toFixed(cifras).replace(/\.?0+$/, '').replace('.', ',');

const nombreDeRadio = (leccion: Leccion, idRadio: string): string => {
  const declarado = leccion.radios[idRadio];
  if (declarado) {
    if ('mm' in declarado) return `${decimal(declarado.mm, 1)} mm`;
    return relacion(declarado.factor, declarado.entre);
  }
  const derivado = leccion.derivados.find(
    (candidato) => candidato.tipo === 'radio' && candidato.id === idRadio,
  );
  if (derivado && derivado.tipo === 'radio') return relacion(derivado.factor, derivado.entre);
  return `el radio ${idRadio}`;
};

function relacion(factor: number, entre: readonly [string, string]): string {
  const segmento = entre.join('');
  return factor === 1 ? `la distancia ${segmento}` : `${decimal(factor)} × ${segmento}`;
}

function accionesDe(
  primitiva: Primitiva,
  indice: number,
  leccion: Leccion,
  resuelta: LeccionResuelta,
  punto: (id: string) => PuntoReto,
): AccionReto | null {
  switch (primitiva.tipo) {
    case 'punto':
      return leccion.datos[primitiva.id]
        ? null
        : {
            tipo: 'marcar',
            punto: punto(primitiva.id),
            primitiva: indice,
            texto: `Marca el punto ${primitiva.etiqueta ?? primitiva.id}.`,
          };
    case 'segmento':
      return {
        tipo: 'regla',
        desde: punto(primitiva.desde),
        hasta: punto(primitiva.hasta),
        primitiva: indice,
        texto: `Une ${primitiva.desde} con ${primitiva.hasta} con la regla.`,
      };
    case 'recta':
      return {
        tipo: 'regla',
        desde: punto(primitiva.por[0]),
        hasta: punto(primitiva.por[1]),
        primitiva: indice,
        texto: `Traza con la regla la recta que pasa por ${primitiva.por[0]} y ${primitiva.por[1]}, prolongándola un poco.`,
      };
    case 'arco': {
      const descripcion = nombreDeRadio(leccion, primitiva.radio);
      return {
        tipo: 'compas',
        centro: punto(primitiva.centro),
        abertura: resuelta.radios[primitiva.radio],
        descripcionAbertura: descripcion,
        primitiva: indice,
        texto: `Pincha el compás en ${primitiva.centro}, ábrelo ${descripcion} y traza un arco hacia ${primitiva.hacia}.`,
      };
    }
    case 'arcoEntre':
      return {
        tipo: 'compasEntre',
        centro: punto(primitiva.centro),
        desde: punto(primitiva.desde),
        hasta: punto(primitiva.hasta),
        primitiva: indice,
        texto: `Con el compás pinchado en ${primitiva.centro}, traza el arco que va de ${primitiva.desde} a ${primitiva.hasta}.`,
      };
    case 'marcaAnguloRecto':
    case 'marcaIgualdad':
      return null;
  }
}

export function crearReto(
  leccion: Leccion,
  resuelta: LeccionResuelta,
  enunciado: string = leccion.enunciado,
): Reto {
  const punto = (id: string): PuntoReto => ({ id, x: resuelta.puntos[id].x, y: resuelta.puntos[id].y });
  const pasos: PasoReto[] = leccion.pasos.map((paso, i) => {
    const automaticas: number[] = [];
    const marcas: number[] = [];
    const acciones: AccionReto[] = [];
    paso.dibujo.forEach((primitiva, j) => {
      if (primitiva.tipo === 'marcaAnguloRecto' || primitiva.tipo === 'marcaIgualdad') {
        marcas.push(j);
        return;
      }
      const accion = accionesDe(primitiva, j, leccion, resuelta, punto);
      if (accion) acciones.push(accion);
      else automaticas.push(j);
    });
    return {
      titulo: resuelta.pasos[i].titulo,
      texto: resuelta.pasos[i].texto,
      porque: resuelta.pasos[i].porque,
      ...(resuelta.pasos[i].consejo ? { consejo: resuelta.pasos[i].consejo } : {}),
      automaticas,
      acciones,
      marcas,
    };
  });

  return {
    leccionId: leccion.id,
    titulo: leccion.titulo,
    enunciado,
    lienzo: { ...resuelta.lienzo },
    pasos,
    dibujos: resuelta.pasos.map((paso) => paso.dibujo),
    puntos: Object.keys(resuelta.puntos).map(punto),
  };
}

export function instrumentoDe(accion: AccionReto): Instrumento {
  switch (accion.tipo) {
    case 'regla':
      return 'regla';
    case 'compas':
    case 'compasEntre':
      return 'compas';
    case 'marcar':
      return 'lapiz';
  }
}

export const NOMBRE_INSTRUMENTO: Record<Instrumento, string> = {
  regla: 'la regla',
  compas: 'el compás',
  lapiz: 'el lápiz',
};

function empezarPaso(reto: Reto, paso: number): Pick<EstadoReto, 'paso' | 'orden' | 'accion' | 'hechas' | 'clics'> {
  return {
    paso,
    orden: reto.pasos[paso].acciones.map((_, i) => i),
    accion: 0,
    hechas: [...reto.pasos[paso].automaticas],
    clics: [],
  };
}

/** Salta los pasos que no piden ninguna acción (solo datos): se enseñan y se sigue. */
function saltarPasosSinAcciones(reto: Reto, estado: EstadoReto): EstadoReto {
  let actual = estado;
  while (!actual.terminado && actual.orden.length === 0) {
    if (actual.paso >= reto.pasos.length - 1) return { ...actual, terminado: true };
    actual = { ...actual, ...empezarPaso(reto, actual.paso + 1) };
  }
  return actual;
}

export function crearEstado(reto: Reto, nivel: NivelReto): EstadoReto {
  const inicial: EstadoReto = {
    nivel,
    ...empezarPaso(reto, 0),
    instrumento: null,
    abertura: ABERTURA_INICIAL_MM,
    errores: 0,
    pistas: 0,
    pista: false,
    mensaje: null,
    terminado: false,
  };
  return alEmpezarAccion(reto, saltarPasosSinAcciones(reto, inicial));
}

/** En el nivel guiado la app pone el instrumento que toca; en los demás lo elige el alumno. */
function alEmpezarAccion(reto: Reto, estado: EstadoReto): EstadoReto {
  if (estado.terminado) return estado;
  const accion = accionActual(reto, estado);
  if (estado.nivel === 'guiado' && accion) return { ...estado, instrumento: instrumentoDe(accion) };
  return estado;
}

export function accionActual(reto: Reto, estado: EstadoReto): AccionReto | null {
  if (estado.terminado) return null;
  const indice = estado.orden[estado.accion];
  return indice === undefined ? null : reto.pasos[estado.paso].acciones[indice];
}

export function elegirInstrumento(estado: EstadoReto, instrumento: Instrumento): EstadoReto {
  if (estado.terminado || estado.instrumento === instrumento) return estado;
  return { ...estado, instrumento, clics: [], mensaje: null };
}

export function fijarAbertura(estado: EstadoReto, mm: number): EstadoReto {
  return { ...estado, abertura: mm };
}

export function toleranciaAbertura(objetivo: number): number {
  return Math.max(1.5, objetivo * 0.06);
}

const distanciaEntre = (a: { x: number; y: number }, b: { x: number; y: number }): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

/** El punto que se pincha es siempre uno de los de la construcción: se compara por posición exacta. */
const mismo = (a: { x: number; y: number }, b: { x: number; y: number }): boolean =>
  distanciaEntre(a, b) < 1e-6;

function puntoCercano(reto: Reto, clic: { x: number; y: number }): PuntoReto | null {
  let mejor: PuntoReto | null = null;
  let distanciaMejor = Infinity;
  for (const candidato of reto.puntos) {
    const d = distanciaEntre(candidato, clic);
    if (d <= TOLERANCIA_CLIC_MM && d < distanciaMejor) {
      mejor = candidato;
      distanciaMejor = d;
    }
  }
  return mejor;
}

export interface ResultadoClic {
  estado: EstadoReto;
  /** `acierto` y `completada` cuentan para el alumno; `nada` no cuenta como error. */
  evento: 'acierto' | 'completada' | 'paso' | 'fin' | 'error' | 'nada';
}

function conError(estado: EstadoReto, texto: string): ResultadoClic {
  return {
    estado: { ...estado, errores: estado.errores + 1, mensaje: { tipo: 'error', texto } },
    evento: 'error',
  };
}

function conInfo(estado: EstadoReto, texto: string): ResultadoClic {
  return { estado: { ...estado, mensaje: { tipo: 'info', texto } }, evento: 'nada' };
}

function completar(reto: Reto, estado: EstadoReto, accion: AccionReto): ResultadoClic {
  const hechas = [...estado.hechas, accion.primitiva];
  const siguiente: EstadoReto = {
    ...estado,
    hechas,
    accion: estado.accion + 1,
    clics: [],
    pista: false,
    mensaje: { tipo: 'ok', texto: 'Muy bien.' },
  };
  const paso = reto.pasos[estado.paso];
  if (siguiente.accion < estado.orden.length) {
    return { estado: alEmpezarAccion(reto, siguiente), evento: 'completada' };
  }

  const conMarcas: EstadoReto = { ...siguiente, hechas: [...hechas, ...paso.marcas] };
  if (estado.paso >= reto.pasos.length - 1) {
    return {
      estado: { ...conMarcas, terminado: true, mensaje: { tipo: 'ok', texto: '¡Reto completado!' } },
      evento: 'fin',
    };
  }
  const siguientePaso = saltarPasosSinAcciones(reto, {
    ...conMarcas,
    ...empezarPaso(reto, estado.paso + 1),
    mensaje: { tipo: 'ok', texto: `Paso completado: ${paso.titulo}.` },
  });
  return {
    estado: alEmpezarAccion(reto, siguientePaso),
    evento: siguientePaso.terminado ? 'fin' : 'paso',
  };
}

/** Un clic sobre el lienzo, en milímetros. */
export function clic(estado: EstadoReto, reto: Reto, posicion: { x: number; y: number }): ResultadoClic {
  const accion = accionActual(reto, estado);
  if (!accion) return { estado, evento: 'nada' };

  if (estado.instrumento === null) {
    return conInfo(estado, 'Elige primero el instrumento con el que vas a trabajar.');
  }
  const necesario = instrumentoDe(accion);
  if (estado.instrumento !== necesario) {
    return conError(
      estado,
      estado.nivel === 'examen'
        ? 'Ese no es el instrumento que hace falta ahora.'
        : `Ahora hace falta ${NOMBRE_INSTRUMENTO[necesario]}.`,
    );
  }

  const pinchado = puntoCercano(reto, posicion);
  if (!pinchado) return conInfo(estado, 'Pincha justo sobre un punto del dibujo.');

  switch (accion.tipo) {
    case 'marcar': {
      // Los puntos que se marcan seguidos se aceptan en cualquier orden.
      const posiciones: number[] = [];
      for (let k = estado.accion; k < estado.orden.length; k++) {
        const candidata = reto.pasos[estado.paso].acciones[estado.orden[k]];
        if (candidata.tipo !== 'marcar') break;
        posiciones.push(k);
      }
      const acertada = posiciones.find((k) => {
        const candidata = reto.pasos[estado.paso].acciones[estado.orden[k]];
        return candidata.tipo === 'marcar' && mismo(candidata.punto, pinchado);
      });
      if (acertada === undefined) {
        return conError(estado, 'Ese no es el punto que hay que marcar.');
      }
      const orden = [...estado.orden];
      [orden[estado.accion], orden[acertada]] = [orden[acertada], orden[estado.accion]];
      const reordenado = { ...estado, orden };
      return completar(reto, reordenado, reto.pasos[estado.paso].acciones[orden[estado.accion]]);
    }
    case 'regla': {
      const esDesde = mismo(accion.desde, pinchado);
      const esHasta = mismo(accion.hasta, pinchado);
      if (!esDesde && !esHasta) return conError(estado, 'Esa recta no pasa por ese punto.');
      const previo = estado.clics[0];
      if (previo && mismo(previo, pinchado)) return conInfo(estado, 'Ese ya es el primer punto: pincha el otro extremo.');
      if (!previo) {
        return {
          estado: { ...estado, clics: [pinchado], pista: false, mensaje: null },
          evento: 'acierto',
        };
      }
      const completaPar =
        (mismo(previo, accion.desde) && esHasta) || (mismo(previo, accion.hasta) && esDesde);
      if (!completaPar) return conError({ ...estado, clics: [] }, 'Esos dos puntos no son los extremos de este trazo.');
      return completar(reto, estado, accion);
    }
    case 'compas': {
      if (estado.clics.length === 0) {
        if (!mismo(accion.centro, pinchado)) return conError(estado, 'Ese no es el centro del arco.');
        return {
          estado: {
            ...estado,
            clics: [pinchado],
            pista: false,
            mensaje: { tipo: 'info', texto: 'Ajusta la abertura del compás y pulsa «Trazar arco».' },
          },
          evento: 'acierto',
        };
      }
      return conInfo(estado, 'El compás ya está pinchado: ajusta la abertura y pulsa «Trazar arco».');
    }
    case 'compasEntre': {
      const esperado = [accion.centro, accion.desde, accion.hasta][estado.clics.length];
      if (!mismo(esperado, pinchado)) {
        const que = ['el centro', 'el punto de partida', 'el punto de llegada'][estado.clics.length];
        return conError(estado, `Ese no es ${que} del arco.`);
      }
      const clics = [...estado.clics, pinchado];
      if (clics.length < 3) {
        return { estado: { ...estado, clics, pista: false, mensaje: null }, evento: 'acierto' };
      }
      return completar(reto, estado, accion);
    }
  }
}

/** El botón «Trazar arco»: comprueba la abertura del compás que el alumno ha fijado. */
export function trazarArco(estado: EstadoReto, reto: Reto): ResultadoClic {
  const accion = accionActual(reto, estado);
  if (!accion || accion.tipo !== 'compas') return { estado, evento: 'nada' };
  if (estado.instrumento !== 'compas') return conError(estado, 'Ahora hace falta el compás.');
  if (estado.clics.length === 0) return conInfo(estado, `Primero pincha el compás en ${accion.centro.id}.`);
  const diferencia = Math.abs(estado.abertura - accion.abertura);
  if (diferencia > toleranciaAbertura(accion.abertura)) {
    const sobra = estado.abertura > accion.abertura;
    const orientacion =
      estado.nivel === 'guiado'
        ? ` Debe ser ${accion.descripcionAbertura} (unos ${decimal(accion.abertura, 1)} mm).`
        : '';
    return conError(estado, `La abertura del compás es ${sobra ? 'demasiado grande' : 'demasiado pequeña'}.${orientacion}`);
  }
  return completar(reto, estado, accion);
}

export function pedirPista(estado: EstadoReto): EstadoReto {
  if (estado.terminado || estado.pista || estado.nivel === 'guiado') return estado;
  return { ...estado, pista: true, pistas: estado.pistas + 1 };
}

/** Puntos que hay que señalar al alumno: siempre en el nivel guiado y, en los demás, solo con pista. */
export function resaltados(estado: EstadoReto, reto: Reto): PuntoReto[] {
  const accion = accionActual(reto, estado);
  if (!accion || !(estado.nivel === 'guiado' || estado.pista)) return [];
  const pendientes = (puntos: PuntoReto[]): PuntoReto[] =>
    puntos.filter((punto) => !estado.clics.some((hecho) => mismo(hecho, punto)));
  switch (accion.tipo) {
    case 'marcar':
      return [accion.punto];
    case 'regla':
      return pendientes([accion.desde, accion.hasta]);
    case 'compas':
      return estado.clics.length === 0 ? [accion.centro] : [];
    case 'compasEntre':
      return pendientes([accion.centro, accion.desde, accion.hasta]).slice(0, 1);
  }
}

/** Texto que se enseña como instrucción de la acción en curso, según el nivel. */
export function instruccion(estado: EstadoReto, reto: Reto): string {
  if (estado.terminado) return 'Has terminado la lámina.';
  const accion = accionActual(reto, estado);
  const paso = reto.pasos[estado.paso];
  if (!accion) return paso.titulo;
  if (estado.nivel === 'guiado') return accion.texto;
  if (estado.nivel === 'memoria') return paso.titulo;
  return `Paso ${estado.paso + 1} de ${reto.pasos.length}`;
}

/** Las primitivas que ya existen en el dibujo, por paso: las del reto hasta ahora. */
export function construido(estado: EstadoReto, reto: Reto): PrimitivaResuelta[][] {
  if (estado.terminado) return reto.dibujos.map((dibujo) => [...dibujo]);
  return reto.dibujos.map((dibujo, i) => {
    if (i < estado.paso) return [...dibujo];
    if (i > estado.paso) return [];
    return dibujo.filter((_, j) => estado.hechas.includes(j));
  });
}

export function resumen(estado: EstadoReto): ResumenReto {
  const dominada = estado.nivel !== 'guiado' && estado.errores === 0 && estado.pistas === 0;
  return {
    nivel: estado.nivel,
    errores: estado.errores,
    pistas: estado.pistas,
    progreso: dominada ? 'dominada' : 'practicada',
  };
}
