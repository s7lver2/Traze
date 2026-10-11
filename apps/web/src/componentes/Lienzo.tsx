import type { PrimitivaResuelta } from '@traze/lecciones';
import { ROTULO } from '@traze/lecciones/rotulos';
import { herramientaActiva } from '../reproductor/herramientas';
import { primitivasVisibles, type PrimitivaAnimada } from '../reproductor/tiempos';
import {
  descripcionAnguloRecto,
  descripcionArco,
  descripcionMarcaIgualdad,
  esConstruccion,
  puntaDe,
  puntaSegmento,
  radioPunto,
} from '../reproductor/trazado';
import { Herramienta } from './Herramienta';

interface Propiedades {
  ancho: number;
  alto: number;
  dibujos: readonly (readonly PrimitivaResuelta[])[];
  paso: number;
  progreso: number;
  ocultarConstruccion: boolean;
  descripcion: string;
}

function Trazo({ animada }: { animada: PrimitivaAnimada }) {
  const { primitiva, progreso, delPasoActual } = animada;
  const posicion = delPasoActual && progreso < 1 ? puntaDe(primitiva, progreso) : null;

  switch (primitiva.tipo) {
    case 'punto':
      return (
        <circle
          className={`punto punto-${primitiva.estilo}`}
          cx={primitiva.x}
          cy={primitiva.y}
          r={radioPunto(0.9, progreso)}
        />
      );
    case 'segmento':
    case 'recta': {
      const final = puntaSegmento(primitiva, progreso);
      return (
        <g>
          <path
            className={`trazo trazo-${primitiva.estilo}`}
            d={`M ${primitiva.x1} ${primitiva.y1} L ${final.x} ${final.y}`}
          />
          {posicion && <circle className="punta" cx={posicion.x} cy={posicion.y} r={0.8} />}
        </g>
      );
    }
    case 'arco':
      return (
        <g>
          <path
            className={`trazo trazo-${primitiva.estilo}`}
            d={descripcionArco(primitiva, progreso)}
          />
          {posicion && (
            <>
              <path
                className="radio-compas"
                d={`M ${primitiva.cx} ${primitiva.cy} L ${posicion.x} ${posicion.y}`}
              />
              <circle className="punta" cx={posicion.x} cy={posicion.y} r={0.8} />
            </>
          )}
        </g>
      );
    case 'marcaAnguloRecto':
      return <path className="marca" d={descripcionAnguloRecto(primitiva)} opacity={progreso} />;
    case 'marcaIgualdad':
      return <path className="marca" d={descripcionMarcaIgualdad(primitiva)} opacity={progreso} />;
  }
}

export function Lienzo({
  ancho,
  alto,
  dibujos,
  paso,
  progreso,
  ocultarConstruccion,
  descripcion,
}: Propiedades) {
  const visibles = primitivasVisibles(dibujos, paso, progreso).filter(
    ({ primitiva }) => !(ocultarConstruccion && esConstruccion(primitiva)),
  );

  const activa = herramientaActiva(visibles);

  return (
    <svg
      className="lienzo"
      viewBox={`0 0 ${ancho} ${alto}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={descripcion}
    >
      <defs>
        <filter id="grafito" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            seed={7}
            result="ruido"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="ruido"
            scale={0.35}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>

      <g filter="url(#grafito)">
        {visibles.map((animada) => (
          <Trazo key={animada.clave} animada={animada} />
        ))}
      </g>

      {activa && <Herramienta activa={activa} />}

      <g className="rotulos">
        {visibles.map(({ clave, primitiva }) =>
          primitiva.tipo === 'punto' ? (
            <text
              key={clave}
              className="rotulo"
              x={primitiva.x + ROTULO.dx}
              y={primitiva.y + ROTULO.dy}
              fontSize={ROTULO.tamano}
            >
              {primitiva.etiqueta}
            </text>
          ) : null,
        )}
      </g>
    </svg>
  );
}