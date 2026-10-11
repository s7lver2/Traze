import {
  geometriaCompas,
  geometriaRegla,
  patasCompas,
  type HerramientaActiva,
} from '../reproductor/herramientas';
import type { Posicion } from '../reproductor/trazado';

const poligono = (puntos: readonly Posicion[]): string =>
  puntos.map((punto) => `${punto.x},${punto.y}`).join(' ');

const camino = (puntos: readonly Posicion[]): string =>
  puntos.map((punto, i) => `${i === 0 ? 'M' : 'L'} ${punto.x} ${punto.y}`).join(' ');

const entre = (a: Posicion, b: Posicion, t: number): Posicion => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

/** Raya corta, perpendicular a la dirección a→b, centrada en el punto de esa dirección. */
function raya(a: Posicion, b: Posicion, t: number, semilargo: number): string {
  const centro = entre(a, b, t);
  const largo = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const n = { x: -(b.y - a.y) / largo, y: (b.x - a.x) / largo };
  return `M ${centro.x - n.x * semilargo} ${centro.y - n.y * semilargo} L ${centro.x + n.x * semilargo} ${centro.y + n.y * semilargo}`;
}

export function Herramienta({ activa }: { activa: HerramientaActiva }) {
  if (activa.tipo === 'compas') {
    const compas = geometriaCompas(activa.aguja, activa.mina);
    if (!compas) return null;
    const { aguja, mina, bisagra, mango } = compas;
    const patas = patasCompas(compas);

    return (
      <g className="herramienta herramienta-compas" aria-hidden="true">
        <polygon className="compas-cuerpo" points={poligono(patas.aguja.cuerpo)} />
        <polygon className="compas-aguja" points={poligono(patas.aguja.punta)} />

        <polygon className="compas-cuerpo" points={poligono(patas.mina.cuerpo)} />
        <path className="compas-banda" d={raya(bisagra, mina, 0.62, 1.2)} />
        <path className="compas-banda" d={raya(bisagra, mina, 0.68, 1.2)} />
        <polygon className="compas-portaminas" points={poligono(patas.mina.punta)} />

        <path className="compas-mango" d={camino([bisagra, mango])} />
        <path className="compas-detalle" d={raya(bisagra, mango, 0.45, 1.3)} />
        <path className="compas-detalle" d={raya(bisagra, mango, 0.65, 1.3)} />
        <path className="compas-detalle" d={raya(bisagra, mango, 0.85, 1.3)} />
        <circle className="compas-pomo" cx={mango.x} cy={mango.y} r={1.8} />

        <circle className="compas-bisagra" cx={bisagra.x} cy={bisagra.y} r={2.6} />
        <circle className="compas-tornillo" cx={bisagra.x} cy={bisagra.y} r={1.1} />
        <path
          className="compas-detalle"
          d={`M ${bisagra.x - 0.8} ${bisagra.y} L ${bisagra.x + 0.8} ${bisagra.y}`}
        />

        <circle className="compas-apoyo" cx={aguja.x} cy={aguja.y} r={0.7} />
        <circle className="compas-mina" cx={mina.x} cy={mina.y} r={1.4} />
      </g>
    );
  }

  const regla = geometriaRegla(activa.tramo);
  if (!regla) return null;
  return (
    <g className="herramienta herramienta-regla" aria-hidden="true">
      <path className="herramienta-cuerpo" d={`${camino(regla.esquinas)} Z`} />
      {regla.marcas.map((marca, i) => (
        <path
          key={i}
          className="herramienta-marca"
          d={`M ${marca.x1} ${marca.y1} L ${marca.x2} ${marca.y2}`}
        />
      ))}
    </g>
  );
}
