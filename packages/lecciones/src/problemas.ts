import { distancia, punto, type Punto } from '@traze/geometria';
import type { Leccion } from './esquema';
import {
  ConstruccionImposible,
  ejecutarComprobaciones,
  interpretarLeccion,
  type LeccionResuelta,
} from './interpretar';
import { comprobarRender } from './render';

export interface Problema {
  semilla: number;
  /** La lección con los datos nuevos: sirve igual que la original para el reproductor y el reto. */
  leccion: Leccion;
  resuelta: LeccionResuelta;
  /** `semejanza`: la figura original girada y escalada. `distinto`: además se han movido los datos. */
  variante: 'semejanza' | 'distinto';
}

export const INTENTOS_POR_DEFECTO = 300;
const INTENTOS_CON_VARIACION = 150;
const ESCALA_MIN = 0.7;
const ESCALA_MAX = 1.3;
const GIRO_SUAVE = (25 * Math.PI) / 180;
const VARIACION_RELATIVA = 0.12;
const DESVIACION_MAXIMA = 0.4;

/** Generador pseudoaleatorio con semilla (mulberry32): la misma semilla da siempre el mismo problema. */
export function crearAzar(semilla: number): () => number {
  let estado = semilla >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Semejanza {
  escala: number;
  giro: number;
  centro: Punto;
  destino: Punto;
}

function aplicar(semejanza: Semejanza, p: Punto): Punto {
  const dx = p.x - semejanza.centro.x;
  const dy = p.y - semejanza.centro.y;
  const cos = Math.cos(semejanza.giro);
  const sin = Math.sin(semejanza.giro);
  return punto(
    semejanza.destino.x + semejanza.escala * (dx * cos - dy * sin),
    semejanza.destino.y + semejanza.escala * (dx * sin + dy * cos),
  );
}

function cajaDe(puntos: readonly Punto[]): { x1: number; y1: number; x2: number; y2: number } {
  const xs = puntos.map((p) => p.x);
  const ys = puntos.map((p) => p.y);
  return { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
}

function variante(base: Leccion, datos: Record<string, [number, number]>, escala: number): Leccion {
  const copia = structuredClone(base);
  copia.datos = datos;
  for (const radio of Object.values(copia.radios)) {
    if ('mm' in radio) radio.mm *= escala;
  }
  return copia;
}

/**
 * Genera un problema de la misma clase que la lección: sus datos cambian de sitio, de tamaño y, a veces,
 * de forma. Solo se acepta si la construcción sale, todas las comprobaciones de la lección se cumplen y el
 * dibujo cabe en el lienzo; por eso el problema siempre tiene solución.
 */
export function generarProblema(
  base: Leccion,
  semilla: number,
  intentos: number = INTENTOS_POR_DEFECTO,
): Problema | null {
  const azar = crearAzar(semilla);
  const referencia = interpretarLeccion(base);
  const idsDatos = Object.keys(base.datos);
  const puntosDatos = idsDatos.map((id) => referencia.puntos[id]);
  const cajaBase = cajaDe(puntosDatos);
  const centro = punto((cajaBase.x1 + cajaBase.x2) / 2, (cajaBase.y1 + cajaBase.y2) / 2);
  const diametro = Math.max(cajaBase.x2 - cajaBase.x1, cajaBase.y2 - cajaBase.y1, 1);
  const derivados = Object.keys(referencia.puntos).filter((id) => !idsDatos.includes(id));
  const { ancho, alto } = base.lienzo;

  for (let intento = 0; intento < intentos; intento++) {
    const conVariacion = intento < INTENTOS_CON_VARIACION && azar() < 0.8;
    const escala = ESCALA_MIN + azar() * (ESCALA_MAX - ESCALA_MIN);
    const giro = azar() < 0.5 ? (azar() - 0.5) * 2 * GIRO_SUAVE : azar() * 2 * Math.PI;
    const destino = punto(ancho * (0.3 + azar() * 0.4), alto * (0.3 + azar() * 0.4));
    const semejanza: Semejanza = { escala, giro, centro, destino };

    const datos: Record<string, [number, number]> = {};
    for (const id of idsDatos) {
      let p = aplicar(semejanza, referencia.puntos[id]);
      if (conVariacion) {
        const amplitud = VARIACION_RELATIVA * diametro * escala;
        p = punto(p.x + (azar() - 0.5) * 2 * amplitud, p.y + (azar() - 0.5) * 2 * amplitud);
      }
      datos[id] = [p.x, p.y];
    }

    const candidata = variante(base, datos, escala);
    let resuelta: LeccionResuelta;
    try {
      resuelta = interpretarLeccion(candidata);
    } catch (error) {
      if (error instanceof ConstruccionImposible) continue;
      throw error;
    }

    let comprobaciones;
    try {
      comprobaciones = ejecutarComprobaciones(candidata, resuelta.puntos, resuelta.radios);
    } catch (error) {
      if (error instanceof ConstruccionImposible) continue;
      throw error;
    }
    if (!comprobaciones.every((comprobacion) => comprobacion.ok)) continue;
    if (comprobarRender(resuelta).length > 0) continue;

    // Los cortes entre dos posibles no pueden haberse cambiado por el otro: cada punto construido debe
    // quedar cerca de donde lo habría puesto la figura original girada y escalada.
    const cambiado = derivados.some((id) => {
      const esperado = aplicar(semejanza, referencia.puntos[id]);
      return distancia(resuelta.puntos[id], esperado) > DESVIACION_MAXIMA * diametro * escala;
    });
    if (cambiado) continue;

    return { semilla, leccion: candidata, resuelta, variante: conVariacion ? 'distinto' : 'semejanza' };
  }
  return null;
}

/** Texto del enunciado de un problema: el de la lección, más las medidas fijas que no se ven en el dibujo. */
export function enunciadoDelProblema(problema: Problema): string {
  const fijos = Object.entries(problema.resuelta.radios).filter(([id]) => {
    const radio = problema.leccion.radios[id];
    return radio !== undefined && 'mm' in radio;
  });
  const medidas = fijos.map(([id, mm]) => `${id} = ${mm.toFixed(1).replace('.', ',')} mm`);
  const cola = medidas.length > 0 ? ` Medidas dadas: ${medidas.join(', ')}.` : '';
  return `${problema.leccion.enunciado}${cola}`;
}
