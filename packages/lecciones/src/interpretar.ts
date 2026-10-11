import {
  EPS,
  distancia,
  distanciaPuntoRecta,
  escala,
  escalar,
  interseccionCircunferencias,
  punto,
  puntoMedio,
  resta,
  suma,
  unitario,
  type Punto,
} from '@traze/geometria';
import type { Derivado, Estilo, Leccion, Primitiva } from './esquema';

export const TOLERANCIA = 1e-6;

export class ConstruccionImposible extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ConstruccionImposible';
  }
}

export type PrimitivaResuelta =
  | { tipo: 'punto'; id: string; etiqueta: string; x: number; y: number; estilo: Estilo }
  | { tipo: 'segmento'; x1: number; y1: number; x2: number; y2: number; estilo: Estilo }
  | { tipo: 'recta'; x1: number; y1: number; x2: number; y2: number; estilo: Estilo }
  | {
      tipo: 'arco';
      cx: number;
      cy: number;
      radio: number;
      inicio: number;
      fin: number;
      estilo: Estilo;
    }
  | {
      tipo: 'marcaAnguloRecto';
      x: number;
      y: number;
      ux1: number;
      uy1: number;
      ux2: number;
      uy2: number;
    }
  | { tipo: 'marcaIgualdad'; x1: number; y1: number; x2: number; y2: number };

export interface PasoResuelto {
  titulo: string;
  texto: string;
  porque: string;
  consejo?: string;
  dibujo: PrimitivaResuelta[];
}

export interface LeccionResuelta {
  id: string;
  titulo: string;
  lienzo: { ancho: number; alto: number };
  puntos: Record<string, Punto>;
  radios: Record<string, number>;
  pasos: PasoResuelto[];
}

export interface ResultadoComprobacion {
  descripcion: string;
  ok: boolean;
  detalle: string;
}

type Puntos = Readonly<Record<string, Punto>>;
type Radios = Readonly<Record<string, number>>;

function obtener(puntos: Puntos, nombre: string): Punto {
  if (!Object.hasOwn(puntos, nombre)) {
    throw new ConstruccionImposible(`El punto «${nombre}» no está construido`);
  }
  return puntos[nombre];
}

function obtenerRadio(radios: Radios, nombre: string): number {
  if (!Object.hasOwn(radios, nombre)) {
    throw new ConstruccionImposible(`El radio «${nombre}» no está definido`);
  }
  return radios[nombre];
}

function direccion(a: Punto, b: Punto): Punto | null {
  return distancia(a, b) < EPS ? null : unitario(resta(b, a));
}

function exigirDireccion(a: Punto, b: Punto, nombreA: string, nombreB: string): Punto {
  const resultado = direccion(a, b);
  if (!resultado) {
    throw new ConstruccionImposible(
      `Los puntos «${nombreA}» y «${nombreB}» coinciden: no definen una dirección`,
    );
  }
  return resultado;
}

function calcularRadios(
  leccion: Leccion,
  puntos: Puntos,
  factores: Readonly<Record<string, number>>,
): Record<string, number> {
  const radios: Record<string, number> = {};
  for (const [id, definicion] of Object.entries(leccion.radios)) {
    if ('mm' in definicion) {
      radios[id] = definicion.mm;
      continue;
    }
    const [nombreA, nombreB] = definicion.entre;
    const factor = Object.hasOwn(factores, id) ? factores[id] : definicion.factor;
    const radio = factor * distancia(obtener(puntos, nombreA), obtener(puntos, nombreB));
    if (!(radio > EPS)) {
      throw new ConstruccionImposible(`El radio «${id}» no es positivo`);
    }
    radios[id] = radio;
  }
  return radios;
}

function resolverPrimitiva(
  primitiva: Primitiva,
  puntos: Puntos,
  radios: Radios,
): PrimitivaResuelta {
  switch (primitiva.tipo) {
    case 'punto': {
      const p = obtener(puntos, primitiva.id);
      return {
        tipo: 'punto',
        id: primitiva.id,
        etiqueta: primitiva.etiqueta ?? primitiva.id,
        x: p.x,
        y: p.y,
        estilo: primitiva.estilo,
      };
    }
    case 'segmento': {
      const a = obtener(puntos, primitiva.desde);
      const b = obtener(puntos, primitiva.hasta);
      return { tipo: 'segmento', x1: a.x, y1: a.y, x2: b.x, y2: b.y, estilo: primitiva.estilo };
    }
    case 'recta': {
      const [nombreP, nombreQ] = primitiva.por;
      const p = obtener(puntos, nombreP);
      const q = obtener(puntos, nombreQ);
      const u = exigirDireccion(p, q, nombreP, nombreQ);
      const desde = resta(p, escala(u, primitiva.extension));
      const hasta = suma(q, escala(u, primitiva.extension));
      return {
        tipo: 'recta',
        x1: desde.x,
        y1: desde.y,
        x2: hasta.x,
        y2: hasta.y,
        estilo: primitiva.estilo,
      };
    }
    case 'arco': {
      const centro = obtener(puntos, primitiva.centro);
      const destino = obtener(puntos, primitiva.hacia);
      const radio = obtenerRadio(radios, primitiva.radio);
      if (Math.abs(distancia(centro, destino) - radio) > TOLERANCIA) {
        throw new ConstruccionImposible(
          `El arco con centro «${primitiva.centro}» no pasa por «${primitiva.hacia}»`,
        );
      }
      const angulo = Math.atan2(destino.y - centro.y, destino.x - centro.x);
      return {
        tipo: 'arco',
        cx: centro.x,
        cy: centro.y,
        radio,
        inicio: angulo - primitiva.amplitud,
        fin: angulo + primitiva.amplitud,
        estilo: primitiva.estilo,
      };
    }
    case 'marcaAnguloRecto': {
      const vertice = obtener(puntos, primitiva.vertice);
      const u1 = exigirDireccion(
        vertice,
        obtener(puntos, primitiva.hacia1),
        primitiva.vertice,
        primitiva.hacia1,
      );
      const u2 = exigirDireccion(
        vertice,
        obtener(puntos, primitiva.hacia2),
        primitiva.vertice,
        primitiva.hacia2,
      );
      return {
        tipo: 'marcaAnguloRecto',
        x: vertice.x,
        y: vertice.y,
        ux1: u1.x,
        uy1: u1.y,
        ux2: u2.x,
        uy2: u2.y,
      };
    }
    case 'marcaIgualdad': {
      const a = obtener(puntos, primitiva.segmento[0]);
      const b = obtener(puntos, primitiva.segmento[1]);
      return { tipo: 'marcaIgualdad', x1: a.x, y1: a.y, x2: b.x, y2: b.y };
    }
  }
}

function resolverDerivado(
  derivado: Derivado,
  puntos: Record<string, Punto>,
  radios: Record<string, number>,
  factores: Readonly<Record<string, number>>,
): void {
  switch (derivado.tipo) {
    case 'puntoMedio': {
      const [nombreA, nombreB] = derivado.entre;
      puntos[derivado.id] = puntoMedio(obtener(puntos, nombreA), obtener(puntos, nombreB));
      return;
    }
    case 'interseccionArcos': {
      const [nombreA, nombreB] = derivado.centros;
      const radio = obtenerRadio(radios, derivado.radio);
      const cortes = interseccionCircunferencias(
        { centro: obtener(puntos, nombreA), radio },
        { centro: obtener(puntos, nombreB), radio },
      );
      const mensaje =
        `Los arcos con centro en «${nombreA}» y «${nombreB}» y radio «${derivado.radio}» no se cortan: ` +
        'el radio debe ser mayor que la mitad de la distancia entre los centros';
      if (!cortes) throw new ConstruccionImposible(mensaje);
      const [primero, segundo] = cortes;
      if (distancia(primero, segundo) < EPS) throw new ConstruccionImposible(mensaje);
      puntos[derivado.ids[0]] = primero;
      puntos[derivado.ids[1]] = segundo;
      return;
    }
    case 'radio': {
      const [nombreA, nombreB] = derivado.entre;
      const factor = Object.hasOwn(factores, derivado.id) ? factores[derivado.id] : derivado.factor;
      const radio = factor * distancia(obtener(puntos, nombreA), obtener(puntos, nombreB));
      if (!(radio > EPS)) {
        throw new ConstruccionImposible(`El radio «${derivado.id}» no es positivo`);
      }
      radios[derivado.id] = radio;
      return;
    }
  }
}

export function interpretarLeccion(
  leccion: Leccion,
  factores: Readonly<Record<string, number>> = {},
): LeccionResuelta {
  const puntos: Record<string, Punto> = {};
  for (const [id, [x, y]] of Object.entries(leccion.datos)) {
    puntos[id] = punto(x, y);
  }

  const radios = calcularRadios(leccion, puntos, factores);

  for (const derivado of leccion.derivados) {
    resolverDerivado(derivado, puntos, radios, factores);
  }

  const pasos = leccion.pasos.map((paso): PasoResuelto => ({
    titulo: paso.titulo,
    texto: paso.texto,
    porque: paso.porque,
    ...(paso.consejo ? { consejo: paso.consejo } : {}),
    dibujo: paso.dibujo.map((primitiva) => resolverPrimitiva(primitiva, puntos, radios)),
  }));

  return {
    id: leccion.id,
    titulo: leccion.titulo,
    lienzo: { ...leccion.lienzo },
    puntos,
    radios,
    pasos,
  };
}

const formato = (valor: number): string => valor.toExponential(2);

export function ejecutarComprobaciones(
  leccion: Leccion,
  puntos: Puntos,
): ResultadoComprobacion[] {
  return leccion.comprobaciones.map((comprobacion): ResultadoComprobacion => {
    switch (comprobacion.tipo) {
      case 'equidistante': {
        const p = obtener(puntos, comprobacion.punto);
        const a = obtener(puntos, comprobacion.a);
        const b = obtener(puntos, comprobacion.b);
        const diferencia = Math.abs(distancia(p, a) - distancia(p, b));
        return {
          descripcion: `${comprobacion.punto} equidista de ${comprobacion.a} y ${comprobacion.b}`,
          ok: diferencia < TOLERANCIA,
          detalle: `diferencia de distancias ${formato(diferencia)}`,
        };
      }
      case 'perpendicular': {
        const [nombreP, nombreQ] = comprobacion.recta;
        const [nombreA, nombreB] = comprobacion.segmento;
        const descripcion = `${nombreP}${nombreQ} ⟂ ${nombreA}${nombreB}`;
        const dirRecta = direccion(obtener(puntos, nombreP), obtener(puntos, nombreQ));
        const dirSegmento = direccion(obtener(puntos, nombreA), obtener(puntos, nombreB));
        if (!dirRecta || !dirSegmento) {
          return { descripcion, ok: false, detalle: 'hay dos puntos coincidentes' };
        }
        const producto = Math.abs(escalar(dirRecta, dirSegmento));
        return {
          descripcion,
          ok: producto < TOLERANCIA,
          detalle: `producto escalar ${formato(producto)}`,
        };
      }
      case 'pasaPorPuntoMedio': {
        const [nombreP, nombreQ] = comprobacion.recta;
        const [nombreA, nombreB] = comprobacion.segmento;
        const descripcion = `${nombreP}${nombreQ} pasa por el punto medio de ${nombreA}${nombreB}`;
        const p = obtener(puntos, nombreP);
        const q = obtener(puntos, nombreQ);
        if (!direccion(p, q)) {
          return { descripcion, ok: false, detalle: 'hay dos puntos coincidentes' };
        }
        const medio = puntoMedio(obtener(puntos, nombreA), obtener(puntos, nombreB));
        const separacion = distanciaPuntoRecta(medio, { p, q });
        return {
          descripcion,
          ok: separacion < TOLERANCIA,
          detalle: `distancia al punto medio ${formato(separacion)}`,
        };
      }
    }
  });
}