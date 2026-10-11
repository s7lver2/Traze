import { describe, expect, it } from 'vitest';
import {
  añadirCirculo,
  añadirCorte,
  añadirLinea,
  añadirPunto,
  borrar,
  cortesPosibles,
  dependientes,
  escenaVacia,
  imantar,
  moverPunto,
  nombrePunto,
  objetoEn,
  resolver,
  tomarPunto,
  type Escena,
} from '../src/taller/escena';

function dosPuntos(): { escena: Escena; a: string; b: string } {
  let escena = escenaVacia();
  const a = añadirPunto(escena, 0, 0);
  escena = a.escena;
  const b = añadirPunto(escena, 10, 0);
  return { escena: b.escena, a: a.id, b: b.id };
}

describe('nombrePunto', () => {
  it('va de la A a la Z y luego sigue con cifras', () => {
    expect(nombrePunto(0)).toBe('A');
    expect(nombrePunto(1)).toBe('B');
    expect(nombrePunto(25)).toBe('Z');
    expect(nombrePunto(26)).toBe('A1');
    expect(nombrePunto(27)).toBe('B1');
    expect(nombrePunto(52)).toBe('A2');
  });
});

describe('puntos libres', () => {
  it('se nombran en orden y se resuelven con sus coordenadas', () => {
    const { escena, a, b } = dosPuntos();
    expect([a, b]).toEqual(['A', 'B']);
    const resuelta = resolver(escena);
    expect(resuelta.puntos.get('A')).toEqual({ x: 0, y: 0 });
    expect(resuelta.puntos.get('B')).toEqual({ x: 10, y: 0 });
  });

  it('mover un punto no modifica la escena anterior', () => {
    const { escena } = dosPuntos();
    const movida = moverPunto(escena, 'A', 3, 4);
    expect(resolver(escena).puntos.get('A')).toEqual({ x: 0, y: 0 });
    expect(resolver(movida).puntos.get('A')).toEqual({ x: 3, y: 4 });
  });

  it('no se puede mover un punto que depende de otros', () => {
    let { escena } = dosPuntos();
    const r = añadirCirculo(escena, 'A', { por: 'B' }, 'construccion');
    const s = añadirCirculo(r.escena, 'B', { por: 'A' }, 'construccion');
    const corte = añadirCorte(s.escena, [r.id, s.id], 0);
    escena = corte.escena;
    expect(moverPunto(escena, corte.id, 100, 100)).toBe(escena);
  });
});

describe('cortes entre objetos', () => {
  it('dos circunferencias con el mismo radio se cortan en los vértices del triángulo equilátero', () => {
    const { escena } = dosPuntos();
    const c1 = añadirCirculo(escena, 'A', { por: 'B' }, 'construccion');
    const c2 = añadirCirculo(c1.escena, 'B', { por: 'A' }, 'construccion');
    const cortes = cortesPosibles(c2.escena, resolver(c2.escena));
    expect(cortes).toHaveLength(2);
    const ys = cortes.map((corte) => corte.y).sort((p, q) => p - q);
    expect(cortes.every((corte) => Math.abs(corte.x - 5) < 1e-9)).toBe(true);
    expect(ys[0]).toBeCloseTo(-Math.sqrt(75), 9);
    expect(ys[1]).toBeCloseTo(Math.sqrt(75), 9);
  });

  it('una recta y una circunferencia se cortan en dos puntos', () => {
    const { escena } = dosPuntos();
    const recta = añadirLinea(escena, 'recta', 'A', 'B', 'resultado');
    const circulo = añadirCirculo(recta.escena, 'A', { mm: 4 }, 'construccion');
    const cortes = cortesPosibles(circulo.escena, resolver(circulo.escena));
    const xs = cortes.map((corte) => corte.x).sort((p, q) => p - q);
    expect(xs[0]).toBeCloseTo(-4, 9);
    expect(xs[1]).toBeCloseTo(4, 9);
  });

  it('dos rectas se cortan en un punto', () => {
    let { escena } = dosPuntos();
    const c = añadirPunto(escena, 4, 5);
    const d = añadirPunto(c.escena, 4, -5);
    const r1 = añadirLinea(d.escena, 'recta', 'A', 'B', 'resultado');
    const r2 = añadirLinea(r1.escena, 'recta', c.id, d.id, 'resultado');
    const cortes = cortesPosibles(r2.escena, resolver(r2.escena));
    expect(cortes).toHaveLength(1);
    expect(cortes[0].x).toBeCloseTo(4, 9);
    expect(cortes[0].y).toBeCloseTo(0, 9);
  });

  it('un segmento solo se corta dentro de sus extremos, una recta en toda su longitud', () => {
    let { escena } = dosPuntos();
    const centro = añadirPunto(escena, 20, 0);
    escena = centro.escena;
    const segmento = añadirLinea(escena, 'segmento', 'A', 'B', 'resultado');
    const circulo = añadirCirculo(segmento.escena, centro.id, { mm: 5 }, 'construccion');
    expect(cortesPosibles(circulo.escena, resolver(circulo.escena))).toHaveLength(0);

    const recta = añadirLinea(escena, 'recta', 'A', 'B', 'resultado');
    const circulo2 = añadirCirculo(recta.escena, centro.id, { mm: 5 }, 'construccion');
    expect(cortesPosibles(circulo2.escena, resolver(circulo2.escena))).toHaveLength(2);
  });

  it('un arco solo corta donde está dibujado', () => {
    const { escena } = dosPuntos();
    const recta = añadirLinea(escena, 'recta', 'A', 'B', 'resultado');
    // Arco de 60° a 120° (por arriba) con centro en A: la recta AB (eje x) no lo toca.
    const arco = añadirCirculo(recta.escena, 'A', { mm: 5 }, 'construccion', {
      desde: Math.PI / 3,
      hasta: (2 * Math.PI) / 3,
    });
    expect(cortesPosibles(arco.escena, resolver(arco.escena))).toHaveLength(0);
    // Arco de −30° a 30°: contiene el punto (5, 0).
    const arcoAbierto = añadirCirculo(recta.escena, 'A', { mm: 5 }, 'construccion', {
      desde: -Math.PI / 6,
      hasta: Math.PI / 6,
    });
    const cortes = cortesPosibles(arcoAbierto.escena, resolver(arcoAbierto.escena));
    expect(cortes).toHaveLength(1);
    expect(cortes[0].x).toBeCloseTo(5, 9);
  });

  it('un corte elegido se convierte en un punto y se reutiliza al elegirlo otra vez', () => {
    const { escena } = dosPuntos();
    const c1 = añadirCirculo(escena, 'A', { por: 'B' }, 'construccion');
    const c2 = añadirCirculo(c1.escena, 'B', { por: 'A' }, 'construccion');
    const primero = añadirCorte(c2.escena, [c1.id, c2.id], 0);
    const repetido = añadirCorte(primero.escena, [c1.id, c2.id], 0);
    expect(repetido.id).toBe(primero.id);
    expect(repetido.escena).toBe(primero.escena);
    expect(cortesPosibles(primero.escena, resolver(primero.escena))).toHaveLength(1);
  });

  it('el punto de corte sigue a la construcción cuando se mueve un punto', () => {
    const { escena } = dosPuntos();
    const c1 = añadirCirculo(escena, 'A', { por: 'B' }, 'construccion');
    const c2 = añadirCirculo(c1.escena, 'B', { por: 'A' }, 'construccion');
    const corte = añadirCorte(c2.escena, [c1.id, c2.id], 0);
    const antes = resolver(corte.escena).puntos.get(corte.id)!;
    const movida = moverPunto(corte.escena, 'B', 20, 0);
    const despues = resolver(movida).puntos.get(corte.id)!;
    expect(despues.x).toBeCloseTo(10, 9);
    expect(Math.abs(despues.y)).toBeGreaterThan(Math.abs(antes.y));
  });

  it('un punto de corte sigue a las circunferencias aunque el arco dibujado ya no llegue hasta él', () => {
    const { escena } = dosPuntos();
    const c1 = añadirCirculo(escena, 'A', { por: 'B' }, 'construccion', { desde: -1.2, hasta: -0.9 });
    const c2 = añadirCirculo(c1.escena, 'B', { mm: 10 }, 'construccion', { desde: -2.3, hasta: -1.9 });
    const corte = añadirCorte(c2.escena, [c1.id, c2.id], 0);
    // Se mueve B: el corte se aleja de lo dibujado, pero el punto no desaparece.
    const movida = moverPunto(corte.escena, 'B', 12, 2);
    expect(resolver(movida).puntos.has(corte.id)).toBe(true);
    // Y el imán no ofrece cortes donde no hay trazo.
    expect(cortesPosibles(movida, resolver(movida)).length).toBeLessThanOrEqual(1);
  });

  it('si las circunferencias dejan de cortarse, el punto desaparece sin romper nada', () => {
    const { escena } = dosPuntos();
    const c1 = añadirCirculo(escena, 'A', { mm: 6 }, 'construccion');
    const c2 = añadirCirculo(c1.escena, 'B', { mm: 6 }, 'construccion');
    const corte = añadirCorte(c2.escena, [c1.id, c2.id], 0);
    expect(resolver(corte.escena).puntos.has(corte.id)).toBe(true);
    const lejos = moverPunto(corte.escena, 'B', 100, 0);
    const resuelta = resolver(lejos);
    expect(resuelta.puntos.has(corte.id)).toBe(false);
    expect(resuelta.puntos.has('A')).toBe(true);
  });
});

describe('borrar', () => {
  it('borrar un punto borra todo lo que depende de él', () => {
    const { escena } = dosPuntos();
    const recta = añadirLinea(escena, 'recta', 'A', 'B', 'resultado');
    const c1 = añadirCirculo(recta.escena, 'A', { por: 'B' }, 'construccion');
    const c2 = añadirCirculo(c1.escena, 'B', { por: 'A' }, 'construccion');
    const corte = añadirCorte(c2.escena, [c1.id, c2.id], 0);
    expect(dependientes(corte.escena, 'A').sort()).toEqual(
      [recta.id, c1.id, c2.id, corte.id].sort(),
    );
    const sin = borrar(corte.escena, 'A');
    expect(sin.objetos.map((objeto) => objeto.id)).toEqual(['B']);
  });

  it('borrar un objeto no toca a los que no dependen de él', () => {
    const { escena } = dosPuntos();
    const c1 = añadirCirculo(escena, 'A', { por: 'B' }, 'construccion');
    const sin = borrar(c1.escena, c1.id);
    expect(sin.objetos.map((objeto) => objeto.id)).toEqual(['A', 'B']);
  });
});

describe('imán y selección', () => {
  function conCorte() {
    const { escena } = dosPuntos();
    const c1 = añadirCirculo(escena, 'A', { por: 'B' }, 'construccion');
    const c2 = añadirCirculo(c1.escena, 'B', { por: 'A' }, 'construccion');
    return c2.escena;
  }

  it('prefiere un punto que ya existe', () => {
    const escena = conCorte();
    const imantado = imantar(escena, resolver(escena), { x: 0.5, y: 0.5 }, 2);
    expect(imantado).toMatchObject({ tipo: 'punto', id: 'A' });
  });

  it('se engancha a un corte posible que todavía no es punto', () => {
    const escena = conCorte();
    const imantado = imantar(escena, resolver(escena), { x: 5.3, y: Math.sqrt(75) + 0.2 }, 2);
    expect(imantado?.tipo).toBe('corte');
  });

  it('no se engancha a nada lejos de todo', () => {
    const escena = conCorte();
    expect(imantar(escena, resolver(escena), { x: 200, y: 200 }, 2)).toBeNull();
  });

  it('tomarPunto crea el punto que haga falta y reutiliza el que existe', () => {
    const escena = conCorte();
    const resuelta = resolver(escena);
    const libre = tomarPunto(escena, null, { x: 50, y: 50 });
    expect(libre.id).toBe('C');
    expect(resolver(libre.escena).puntos.get('C')).toEqual({ x: 50, y: 50 });

    const existente = tomarPunto(escena, imantar(escena, resuelta, { x: 0, y: 0 }, 2), { x: 0, y: 0 });
    expect(existente.id).toBe('A');
    expect(existente.escena).toBe(escena);

    const corte = tomarPunto(escena, imantar(escena, resuelta, { x: 5, y: Math.sqrt(75) }, 2), { x: 5, y: 8 });
    expect(resolver(corte.escena).puntos.get(corte.id)!.x).toBeCloseTo(5, 9);
  });

  it('objetoEn encuentra puntos primero y luego líneas y circunferencias', () => {
    const { escena } = dosPuntos();
    const recta = añadirLinea(escena, 'recta', 'A', 'B', 'resultado');
    const circulo = añadirCirculo(recta.escena, 'A', { mm: 7 }, 'construccion');
    const resuelta = resolver(circulo.escena);
    expect(objetoEn(circulo.escena, resuelta, { x: 0.3, y: 0.2 }, 1)).toBe('A');
    expect(objetoEn(circulo.escena, resuelta, { x: 3, y: 0.4 }, 1)).toBe(recta.id);
    expect(objetoEn(circulo.escena, resuelta, { x: 0, y: 7.3 }, 1)).toBe(circulo.id);
    expect(objetoEn(circulo.escena, resuelta, { x: 50, y: 50 }, 1)).toBeNull();
  });
});

describe('guardado', () => {
  it('la escena sobrevive a pasar por JSON', () => {
    const { escena } = dosPuntos();
    const c1 = añadirCirculo(escena, 'A', { por: 'B' }, 'construccion');
    const c2 = añadirCirculo(c1.escena, 'B', { por: 'A' }, 'resultado', { desde: 0, hasta: 2 });
    const corte = añadirCorte(c2.escena, [c1.id, c2.id], 1);
    const vuelta = JSON.parse(JSON.stringify(corte.escena)) as Escena;
    expect(vuelta).toEqual(corte.escena);
    expect(resolver(vuelta).puntos.get(corte.id)).toEqual(resolver(corte.escena).puntos.get(corte.id));
  });
});
