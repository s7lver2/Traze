import {
  geometriaCompas,
  geometriaRegla,
  type HerramientaActiva,
} from '../reproductor/herramientas';

const camino = (puntos: readonly { x: number; y: number }[]): string =>
  puntos.map((punto, i) => `${i === 0 ? 'M' : 'L'} ${punto.x} ${punto.y}`).join(' ');

export function Herramienta({ activa }: { activa: HerramientaActiva }) {
  if (activa.tipo === 'compas') {
    const compas = geometriaCompas(activa.aguja, activa.mina);
    if (!compas) return null;
    const { aguja, mina, bisagra, mango } = compas;
    return (
      <g className="herramienta herramienta-compas" aria-hidden="true">
        <path className="herramienta-pata" d={camino([aguja, bisagra, mina])} />
        <path className="herramienta-mango" d={camino([bisagra, mango])} />
        <circle className="herramienta-bisagra" cx={bisagra.x} cy={bisagra.y} r={1.6} />
        <circle className="herramienta-aguja" cx={aguja.x} cy={aguja.y} r={0.7} />
        <circle className="herramienta-mina" cx={mina.x} cy={mina.y} r={1.2} />
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
