import {
  EPS,
  distancia,
  distanciaPuntoRecta,
  escala,
  escalar,
  cruz,
  interseccionCircunferencias,
  interseccionRectaCircunferencia,
  interseccionRectas,
  normalIzquierda,
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

const VUELTA = 2 * Math.PI;
const giroPositivo = (angulo: number): number => ((angulo % VUELTA) + VUELTA) % VUELTA;

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
    case 'arcoEntre': {
      const centro = obtener(puntos, primitiva.centro);
      const desde = obtener(puntos, primitiva.desde);
      const hasta = obtener(puntos, primitiva.hasta);
      const radio = distancia(centro, desde);
      if (radio < EPS || Math.abs(distancia(centro, hasta) - radio) > TOLERANCIA) {
        throw new ConstruccionImposible(
          `El arco con centro «${primitiva.centro}» no une «${primitiva.desde}» y «${primitiva.hasta}»: no están a la misma distancia del centro`,
        );
      }
      const angulo1 = Math.atan2(desde.y - centro.y, desde.x - centro.x);
      const angulo2 = Math.atan2(hasta.y - centro.y, hasta.x - centro.x);
      const barrido = giroPositivo(angulo2 - angulo1);
      if (barrido < 1e-9 || VUELTA - barrido < 1e-9) {
        throw new ConstruccionImposible(
          `Los puntos «${primitiva.desde}» y «${primitiva.hasta}» coinciden: no definen un arco`,
        );
      }

      let enSentidoPositivo: boolean;
      if (primitiva.pasaPor !== undefined) {
        const pasa = obtener(puntos, primitiva.pasaPor);
        const anguloPasa = Math.atan2(pasa.y - centro.y, pasa.x - centro.x);
        enSentidoPositivo = giroPositivo(anguloPasa - angulo1) <= barrido + 1e-9;
      } else {
        if (Math.abs(barrido - Math.PI) < 1e-9) {
          throw new ConstruccionImposible(
            `El arco entre «${primitiva.desde}» y «${primitiva.hasta}» es una media circunferencia: indica por qué punto pasa con «pasaPor»`,
          );
        }
        enSentidoPositivo = barrido < Math.PI;
      }

      const inicio = enSentidoPositivo ? angulo1 : angulo2;
      const fin = inicio + (enSentidoPositivo ? barrido : VUELTA - barrido);
      return {
        tipo: 'arco',
        cx: centro.x,
        cy: centro.y,
        radio,
        inicio,
        fin,
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

function pieDe(p: Punto, a: Punto, u: Punto): Punto {
  return suma(a, escala(u, escalar(resta(p, a), u)));
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
    case 'puntoEnDireccion': {
      const [nombreA, nombreB] = derivado.direccion;
      const sentido = exigirDireccion(
        obtener(puntos, nombreA),
        obtener(puntos, nombreB),
        nombreA,
        nombreB,
      );
      const u = derivado.perpendicular ? normalIzquierda(sentido) : sentido;
      const largo = derivado.sentido * obtenerRadio(radios, derivado.radio);
      puntos[derivado.id] = suma(obtener(puntos, derivado.origen), escala(u, largo));
      return;
    }
    case 'pie': {
      const [nombreA, nombreB] = derivado.recta;
      const a = obtener(puntos, nombreA);
      const u = exigirDireccion(a, obtener(puntos, nombreB), nombreA, nombreB);
      puntos[derivado.id] = pieDe(obtener(puntos, derivado.punto), a, u);
      return;
    }
    case 'simetrico': {
      const [nombreA, nombreB] = derivado.eje;
      const a = obtener(puntos, nombreA);
      const u = exigirDireccion(a, obtener(puntos, nombreB), nombreA, nombreB);
      const p = obtener(puntos, derivado.punto);
      const pie = pieDe(p, a, u);
      puntos[derivado.id] = punto(2 * pie.x - p.x, 2 * pie.y - p.y);
      return;
    }
    case 'homotetico': {
      const centro = obtener(puntos, derivado.centro);
      const p = obtener(puntos, derivado.punto);
      puntos[derivado.id] = suma(centro, escala(resta(p, centro), derivado.razon));
      return;
    }
    case 'interseccionRectas': {
      const [[nombreP, nombreQ], [nombreR, nombreS]] = derivado.rectas;
      const corte = interseccionRectas(
        { p: obtener(puntos, nombreP), q: obtener(puntos, nombreQ) },
        { p: obtener(puntos, nombreR), q: obtener(puntos, nombreS) },
      );
      if (!corte) {
        throw new ConstruccionImposible(
          `Las rectas «${nombreP}${nombreQ}» y «${nombreR}${nombreS}» no se cortan en un punto (son paralelas, coinciden o les falta una dirección)`,
        );
      }
      puntos[derivado.id] = corte;
      return;
    }
    case 'interseccionRectaArco': {
      const [nombreP, nombreQ] = derivado.recta;
      const cortes = interseccionRectaCircunferencia(
        { p: obtener(puntos, nombreP), q: obtener(puntos, nombreQ) },
        { centro: obtener(puntos, derivado.centro), radio: obtenerRadio(radios, derivado.radio) },
      );
      if (cortes.length !== 2) {
        throw new ConstruccionImposible(
          `La recta «${nombreP}${nombreQ}» no corta en dos puntos al arco con centro «${derivado.centro}» y radio «${derivado.radio}»`,
        );
      }
      puntos[derivado.ids[0]] = cortes[0];
      puntos[derivado.ids[1]] = cortes[1];
      return;
    }
    case 'cortesCirculos': {
      const [nombreA, nombreB] = derivado.centros;
      const cortes = interseccionCircunferencias(
        { centro: obtener(puntos, nombreA), radio: obtenerRadio(radios, derivado.radios[0]) },
        { centro: obtener(puntos, nombreB), radio: obtenerRadio(radios, derivado.radios[1]) },
      );
      const mensaje =
        `Los arcos con centro en «${nombreA}» y «${nombreB}» y radios «${derivado.radios[0]}» y «${derivado.radios[1]}» no se cortan en dos puntos`;
      if (!cortes) throw new ConstruccionImposible(mensaje);
      const [primero, segundo] = cortes;
      if (distancia(primero, segundo) < EPS) throw new ConstruccionImposible(mensaje);
      puntos[derivado.ids[0]] = primero;
      puntos[derivado.ids[1]] = segundo;
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

const nombreDe = (extremos: readonly string[]): string => extremos.join('');
const longitudDe = (puntos: Puntos, extremos: readonly [string, string]): number =>
  distancia(obtener(puntos, extremos[0]), obtener(puntos, extremos[1]));

function anguloEn(puntos: Puntos, a: string, vertice: string, b: string): number | null {
  const v = obtener(puntos, vertice);
  const ua = direccion(v, obtener(puntos, a));
  const ub = direccion(v, obtener(puntos, b));
  if (!ua || !ub) return null;
  return (Math.atan2(Math.abs(cruz(ua, ub)), escalar(ua, ub)) * 180) / Math.PI;
}

export function ejecutarComprobaciones(
  leccion: Leccion,
  puntos: Puntos,
  radios: Radios = {},
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
      case 'tangente': {
        const [nombreP, nombreQ] = comprobacion.recta;
        const descripcion = `${nombreP}${nombreQ} es tangente en ${comprobacion.punto} a la circunferencia de centro ${comprobacion.centro}`;
        const p = obtener(puntos, nombreP);
        const q = obtener(puntos, nombreQ);
        const t = obtener(puntos, comprobacion.punto);
        const dirRecta = direccion(p, q);
        const dirRadio = direccion(obtener(puntos, comprobacion.centro), t);
        if (!dirRecta || !dirRadio) {
          return { descripcion, ok: false, detalle: 'hay dos puntos coincidentes' };
        }
        const sobreLaRecta = distanciaPuntoRecta(t, { p, q });
        const producto = Math.abs(escalar(dirRecta, dirRadio));
        return {
          descripcion,
          ok: sobreLaRecta < TOLERANCIA && producto < TOLERANCIA,
          detalle: `distancia a la recta ${formato(sobreLaRecta)}, producto escalar con el radio ${formato(producto)}`,
        };
      }
      case 'puntoEnCircunferencia': {
        const radio = obtenerRadio(radios, comprobacion.radio);
        const separacion = Math.abs(
          distancia(obtener(puntos, comprobacion.punto), obtener(puntos, comprobacion.centro)) - radio,
        );
        return {
          descripcion: `${comprobacion.punto} está en la circunferencia de centro ${comprobacion.centro} y radio ${comprobacion.radio}`,
          ok: separacion < TOLERANCIA,
          detalle: `diferencia con el radio ${formato(separacion)}`,
        };
      }
      case 'igualLongitud': {
        const [primero, segundo] = comprobacion.segmentos;
        const diferencia = Math.abs(longitudDe(puntos, primero) - longitudDe(puntos, segundo));
        return {
          descripcion: `${nombreDe(primero)} = ${nombreDe(segundo)}`,
          ok: diferencia < TOLERANCIA,
          detalle: `diferencia de longitudes ${formato(diferencia)}`,
        };
      }
      case 'proporcion': {
        const descripcion = `${nombreDe(comprobacion.a)}/${nombreDe(comprobacion.b)} = ${nombreDe(comprobacion.c)}/${nombreDe(comprobacion.d)}`;
        const la = longitudDe(puntos, comprobacion.a);
        const lb = longitudDe(puntos, comprobacion.b);
        const lc = longitudDe(puntos, comprobacion.c);
        const ld = longitudDe(puntos, comprobacion.d);
        if (lb < EPS || ld < EPS) {
          return { descripcion, ok: false, detalle: 'un denominador tiene longitud cero' };
        }
        const diferencia = Math.abs(la * ld - lb * lc);
        return {
          descripcion,
          ok: diferencia < TOLERANCIA * Math.max(1, lb * lc),
          detalle: `diferencia de productos cruzados ${formato(diferencia)}`,
        };
      }
      case 'colineales': {
        const [nombreP, nombreQ, nombreR] = comprobacion.puntos;
        const descripcion = `${nombreP}, ${nombreQ} y ${nombreR} están alineados`;
        const p = obtener(puntos, nombreP);
        const q = obtener(puntos, nombreQ);
        if (!direccion(p, q)) {
          return { descripcion, ok: false, detalle: `«${nombreP}» y «${nombreQ}» coinciden` };
        }
        const separacion = distanciaPuntoRecta(obtener(puntos, nombreR), { p, q });
        return { descripcion, ok: separacion < TOLERANCIA, detalle: `distancia a la recta ${formato(separacion)}` };
      }
      case 'paralelas': {
        const [primera, segunda] = comprobacion.rectas;
        const descripcion = `${nombreDe(primera)} ∥ ${nombreDe(segunda)}`;
        const d1 = direccion(obtener(puntos, primera[0]), obtener(puntos, primera[1]));
        const d2 = direccion(obtener(puntos, segunda[0]), obtener(puntos, segunda[1]));
        if (!d1 || !d2) return { descripcion, ok: false, detalle: 'hay dos puntos coincidentes' };
        const producto = Math.abs(cruz(d1, d2));
        return { descripcion, ok: producto < TOLERANCIA, detalle: `producto vectorial ${formato(producto)}` };
      }
      case 'angulo': {
        const descripcion = `el ángulo ${comprobacion.a}${comprobacion.vertice}${comprobacion.b} mide ${comprobacion.grados}°`;
        const actual = anguloEn(puntos, comprobacion.a, comprobacion.vertice, comprobacion.b);
        if (actual === null) return { descripcion, ok: false, detalle: 'hay dos puntos coincidentes' };
        const diferencia = Math.abs(actual - comprobacion.grados);
        return { descripcion, ok: diferencia < TOLERANCIA, detalle: `mide ${actual.toFixed(6)}°` };
      }
      case 'igualAngulo': {
        const [[a1, v1, b1], [a2, v2, b2]] = comprobacion.angulos;
        const descripcion = `${a1}${v1}${b1} = ${a2}${v2}${b2}`;
        const primero = anguloEn(puntos, a1, v1, b1);
        const segundo = anguloEn(puntos, a2, v2, b2);
        if (primero === null || segundo === null) {
          return { descripcion, ok: false, detalle: 'hay dos puntos coincidentes' };
        }
        const diferencia = Math.abs(primero - segundo);
        return {
          descripcion,
          ok: diferencia < TOLERANCIA,
          detalle: `${primero.toFixed(6)}° y ${segundo.toFixed(6)}°`,
        };
      }
    }
  });
}