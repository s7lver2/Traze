import {
  distancia,
  interseccionCircunferencias,
  interseccionRectaCircunferencia,
  interseccionRectas,
  punto,
  type Punto,
} from '@traze/geometria';

/**
 * La escena del taller: puntos, rectas, segmentos y circunferencias, donde casi todo depende de otros
 * objetos. Si mueves un punto, lo que se construyó sobre él se recalcula, como en una hoja de papel
 * que se pudiera deformar.
 */

export type Id = string;
export type Estilo = 'construccion' | 'resultado';
export type Radio = { por: Id } | { mm: number };

export type Objeto =
  | { tipo: 'punto'; id: Id; x: number; y: number }
  | { tipo: 'corte'; id: Id; de: [Id, Id]; indice: 0 | 1 }
  | { tipo: 'segmento'; id: Id; a: Id; b: Id; estilo: Estilo }
  | { tipo: 'recta'; id: Id; a: Id; b: Id; estilo: Estilo }
  | {
      tipo: 'circulo';
      id: Id;
      centro: Id;
      radio: Radio;
      estilo: Estilo;
      /** Si está, solo se dibuja ese arco (ángulos continuos en radianes); si no, la circunferencia entera. */
      arco?: { desde: number; hasta: number };
    };

export interface Escena {
  objetos: Objeto[];
  /** Cuántos puntos se han nombrado: el siguiente es el de la letra que toque. */
  letras: number;
  /** Cuántas líneas y circunferencias se han creado, para dar ids distintos. */
  serie: number;
}

export const escenaVacia = (): Escena => ({ objetos: [], letras: 0, serie: 0 });

const EPSILON = 1e-9;
const DOS_PI = 2 * Math.PI;

export function nombrePunto(n: number): string {
  const letra = String.fromCharCode(65 + (n % 26));
  const vuelta = Math.floor(n / 26);
  return vuelta === 0 ? letra : `${letra}${vuelta}`;
}

// ---------- Construcción ----------

export function añadirPunto(escena: Escena, x: number, y: number): { escena: Escena; id: Id } {
  const id = nombrePunto(escena.letras);
  return {
    escena: { ...escena, objetos: [...escena.objetos, { tipo: 'punto', id, x, y }], letras: escena.letras + 1 },
    id,
  };
}

export function añadirCorte(
  escena: Escena,
  de: [Id, Id],
  indice: 0 | 1,
): { escena: Escena; id: Id } {
  const existente = escena.objetos.find(
    (objeto) =>
      objeto.tipo === 'corte' && objeto.indice === indice && objeto.de[0] === de[0] && objeto.de[1] === de[1],
  );
  if (existente) return { escena, id: existente.id };
  const id = nombrePunto(escena.letras);
  return {
    escena: {
      ...escena,
      objetos: [...escena.objetos, { tipo: 'corte', id, de, indice }],
      letras: escena.letras + 1,
    },
    id,
  };
}

export function añadirLinea(
  escena: Escena,
  tipo: 'segmento' | 'recta',
  a: Id,
  b: Id,
  estilo: Estilo,
): { escena: Escena; id: Id } {
  const id = `${tipo === 'segmento' ? 's' : 'r'}${escena.serie + 1}`;
  return {
    escena: { ...escena, objetos: [...escena.objetos, { tipo, id, a, b, estilo }], serie: escena.serie + 1 },
    id,
  };
}

export function añadirCirculo(
  escena: Escena,
  centro: Id,
  radio: Radio,
  estilo: Estilo,
  arco?: { desde: number; hasta: number },
): { escena: Escena; id: Id } {
  const id = `c${escena.serie + 1}`;
  const objeto: Objeto = { tipo: 'circulo', id, centro, radio, estilo, ...(arco ? { arco } : {}) };
  return { escena: { ...escena, objetos: [...escena.objetos, objeto], serie: escena.serie + 1 }, id };
}

export function moverPunto(escena: Escena, id: Id, x: number, y: number): Escena {
  const objeto = escena.objetos.find((candidato) => candidato.id === id);
  if (!objeto || objeto.tipo !== 'punto') return escena;
  return {
    ...escena,
    objetos: escena.objetos.map((candidato) => (candidato.id === id ? { ...objeto, x, y } : candidato)),
  };
}

function referencias(objeto: Objeto): Id[] {
  switch (objeto.tipo) {
    case 'punto':
      return [];
    case 'corte':
      return [...objeto.de];
    case 'segmento':
    case 'recta':
      return [objeto.a, objeto.b];
    case 'circulo':
      return 'por' in objeto.radio ? [objeto.centro, objeto.radio.por] : [objeto.centro];
  }
}

/** Todo lo que depende, directa o indirectamente, de un objeto. */
export function dependientes(escena: Escena, id: Id): Id[] {
  const resultado = new Set<Id>();
  const pendientes = [id];
  while (pendientes.length > 0) {
    const actual = pendientes.pop()!;
    for (const objeto of escena.objetos) {
      if (!resultado.has(objeto.id) && referencias(objeto).includes(actual)) {
        resultado.add(objeto.id);
        pendientes.push(objeto.id);
      }
    }
  }
  return [...resultado];
}

export function borrar(escena: Escena, id: Id): Escena {
  const fuera = new Set([id, ...dependientes(escena, id)]);
  return { ...escena, objetos: escena.objetos.filter((objeto) => !fuera.has(objeto.id)) };
}

// ---------- Cálculo ----------

type Geometria =
  | { tipo: 'linea'; p: Punto; q: Punto; segmento: boolean }
  | { tipo: 'circulo'; centro: Punto; radio: number; arco?: { desde: number; hasta: number } };

export interface Resuelta {
  puntos: Map<Id, Punto>;
  lineas: Map<Id, { p: Punto; q: Punto; segmento: boolean; estilo: Estilo }>;
  circulos: Map<Id, { centro: Punto; radio: number; estilo: Estilo; arco?: { desde: number; hasta: number } }>;
}

function enSegmento(geometria: Extract<Geometria, { tipo: 'linea' }>, p: Punto): boolean {
  if (!geometria.segmento) return true;
  const dx = geometria.q.x - geometria.p.x;
  const dy = geometria.q.y - geometria.p.y;
  const t = ((p.x - geometria.p.x) * dx + (p.y - geometria.p.y) * dy) / (dx * dx + dy * dy);
  return t >= -EPSILON && t <= 1 + EPSILON;
}

function enArco(geometria: Extract<Geometria, { tipo: 'circulo' }>, p: Punto): boolean {
  if (!geometria.arco) return true;
  const angulo = Math.atan2(p.y - geometria.centro.y, p.x - geometria.centro.x);
  const ancho = geometria.arco.hasta - geometria.arco.desde;
  if (ancho >= DOS_PI - EPSILON) return true;
  const recorrido = (((angulo - geometria.arco.desde) % DOS_PI) + DOS_PI) % DOS_PI;
  return recorrido <= ancho + 1e-6;
}

const dentro = (geometria: Geometria, p: Punto): boolean =>
  geometria.tipo === 'linea' ? enSegmento(geometria, p) : enArco(geometria, p);

/**
 * Los dos cortes posibles entre dos objetos, en un orden estable. Con `soloDibujado`, `null` si el corte cae
 * fuera del trozo que hay dibujado (un segmento o un arco); sin él, se cortan las rectas y circunferencias enteras.
 */
function cortesCrudos(a: Geometria, b: Geometria, soloDibujado: boolean): [Punto | null, Punto | null] {
  let crudos: (Punto | null)[] = [];
  if (a.tipo === 'linea' && b.tipo === 'linea') {
    crudos = [interseccionRectas({ p: a.p, q: a.q }, { p: b.p, q: b.q })];
  } else if (a.tipo === 'linea' && b.tipo === 'circulo') {
    crudos = interseccionRectaCircunferencia({ p: a.p, q: a.q }, { centro: b.centro, radio: b.radio });
  } else if (a.tipo === 'circulo' && b.tipo === 'linea') {
    crudos = interseccionRectaCircunferencia({ p: b.p, q: b.q }, { centro: a.centro, radio: a.radio });
  } else if (a.tipo === 'circulo' && b.tipo === 'circulo') {
    crudos =
      interseccionCircunferencias(
        { centro: a.centro, radio: a.radio },
        { centro: b.centro, radio: b.radio },
      ) ?? [];
  }
  const filtrar = (p: Punto | null | undefined): Punto | null =>
    p && (!soloDibujado || (dentro(a, p) && dentro(b, p))) ? punto(p.x, p.y) : null;
  return [filtrar(crudos[0]), filtrar(crudos[1])];
}

function geometriaDe(resuelta: Resuelta, id: Id): Geometria | null {
  const linea = resuelta.lineas.get(id);
  if (linea) return { tipo: 'linea', p: linea.p, q: linea.q, segmento: linea.segmento };
  const circulo = resuelta.circulos.get(id);
  if (circulo) {
    return {
      tipo: 'circulo',
      centro: circulo.centro,
      radio: circulo.radio,
      ...(circulo.arco ? { arco: circulo.arco } : {}),
    };
  }
  return null;
}

export function resolver(escena: Escena): Resuelta {
  const resuelta: Resuelta = { puntos: new Map(), lineas: new Map(), circulos: new Map() };
  for (const objeto of escena.objetos) {
    switch (objeto.tipo) {
      case 'punto':
        resuelta.puntos.set(objeto.id, punto(objeto.x, objeto.y));
        break;
      case 'corte': {
        const a = geometriaDe(resuelta, objeto.de[0]);
        const b = geometriaDe(resuelta, objeto.de[1]);
        // Un punto ya creado sigue al corte aunque el arco o el segmento ya no llegue hasta él.
        const cortado = a && b ? cortesCrudos(a, b, false)[objeto.indice] : null;
        if (cortado) resuelta.puntos.set(objeto.id, cortado);
        break;
      }
      case 'segmento':
      case 'recta': {
        const p = resuelta.puntos.get(objeto.a);
        const q = resuelta.puntos.get(objeto.b);
        if (p && q && distancia(p, q) > EPSILON) {
          resuelta.lineas.set(objeto.id, { p, q, segmento: objeto.tipo === 'segmento', estilo: objeto.estilo });
        }
        break;
      }
      case 'circulo': {
        const centro = resuelta.puntos.get(objeto.centro);
        const por = 'por' in objeto.radio ? resuelta.puntos.get(objeto.radio.por) : undefined;
        const radio = 'por' in objeto.radio ? (centro && por ? distancia(centro, por) : 0) : objeto.radio.mm;
        if (centro && radio > EPSILON) {
          resuelta.circulos.set(objeto.id, {
            centro,
            radio,
            estilo: objeto.estilo,
            ...(objeto.arco ? { arco: objeto.arco } : {}),
          });
        }
        break;
      }
    }
  }
  return resuelta;
}

// ---------- Cortes posibles, imán y selección ----------

export interface Candidato {
  de: [Id, Id];
  indice: 0 | 1;
  x: number;
  y: number;
}

/** Los cortes entre líneas y circunferencias que todavía no son un punto de la escena. */
export function cortesPosibles(escena: Escena, resuelta: Resuelta): Candidato[] {
  const geometricos = escena.objetos.filter(
    (objeto) => objeto.tipo === 'segmento' || objeto.tipo === 'recta' || objeto.tipo === 'circulo',
  );
  const existentes = new Set(
    escena.objetos.flatMap((objeto) => (objeto.tipo === 'corte' ? [`${objeto.de.join('|')}#${objeto.indice}`] : [])),
  );
  const candidatos: Candidato[] = [];
  geometricos.forEach((primero, i) => {
    const a = geometriaDe(resuelta, primero.id);
    if (!a) return;
    for (const segundo of geometricos.slice(i + 1)) {
      const b = geometriaDe(resuelta, segundo.id);
      if (!b) continue;
      cortesCrudos(a, b, true).forEach((corte, indice) => {
        if (!corte || existentes.has(`${primero.id}|${segundo.id}#${indice}`)) return;
        candidatos.push({ de: [primero.id, segundo.id], indice: indice as 0 | 1, x: corte.x, y: corte.y });
      });
    }
  });
  return candidatos;
}

export type Imantado =
  | { tipo: 'punto'; id: Id; x: number; y: number }
  | { tipo: 'corte'; de: [Id, Id]; indice: 0 | 1; x: number; y: number };

/** A qué se engancha el puntero: primero a un punto que existe y, si no, a un corte posible. */
export function imantar(
  escena: Escena,
  resuelta: Resuelta,
  posicion: { x: number; y: number },
  tolerancia: number,
): Imantado | null {
  let mejor: Imantado | null = null;
  let distanciaMejor = tolerancia;
  for (const [id, p] of resuelta.puntos) {
    const d = distancia(p, posicion);
    if (d <= distanciaMejor) {
      mejor = { tipo: 'punto', id, x: p.x, y: p.y };
      distanciaMejor = d;
    }
  }
  if (mejor) return mejor;
  for (const candidato of cortesPosibles(escena, resuelta)) {
    const d = distancia(candidato, posicion);
    if (d <= distanciaMejor) {
      mejor = { tipo: 'corte', de: candidato.de, indice: candidato.indice, x: candidato.x, y: candidato.y };
      distanciaMejor = d;
    }
  }
  return mejor;
}

/** El punto de la escena para ese lugar: el que se ha enganchado, o uno nuevo (libre o de corte). */
export function tomarPunto(
  escena: Escena,
  imantado: Imantado | null,
  posicion: { x: number; y: number },
): { escena: Escena; id: Id } {
  if (imantado?.tipo === 'punto') return { escena, id: imantado.id };
  if (imantado?.tipo === 'corte') return añadirCorte(escena, imantado.de, imantado.indice);
  return añadirPunto(escena, posicion.x, posicion.y);
}

function distanciaASegmento(p: Punto, a: Punto, b: Punto, segmento: boolean): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
  if (segmento) t = Math.min(1, Math.max(0, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** El objeto bajo el puntero (para seleccionarlo o borrarlo): los puntos primero. */
export function objetoEn(
  escena: Escena,
  resuelta: Resuelta,
  posicion: { x: number; y: number },
  tolerancia: number,
): Id | null {
  let punto_: Id | null = null;
  let mejorPunto = tolerancia;
  for (const [id, p] of resuelta.puntos) {
    const d = distancia(p, posicion);
    if (d <= mejorPunto) {
      punto_ = id;
      mejorPunto = d;
    }
  }
  if (punto_) return punto_;

  let mejor: Id | null = null;
  let mejorDistancia = tolerancia;
  for (const objeto of escena.objetos) {
    if (objeto.tipo === 'segmento' || objeto.tipo === 'recta') {
      const linea = resuelta.lineas.get(objeto.id);
      if (!linea) continue;
      const d = distanciaASegmento(posicion, linea.p, linea.q, linea.segmento);
      if (d <= mejorDistancia) {
        mejor = objeto.id;
        mejorDistancia = d;
      }
    } else if (objeto.tipo === 'circulo') {
      const circulo = resuelta.circulos.get(objeto.id);
      if (!circulo) continue;
      const d = Math.abs(distancia(posicion, circulo.centro) - circulo.radio);
      if (d <= mejorDistancia && enArco({ tipo: 'circulo', ...circulo }, posicion)) {
        mejor = objeto.id;
        mejorDistancia = d;
      }
    }
  }
  return mejor;
}
