import { useRef, type PointerEvent } from 'react';
import type { PrimitivaResuelta } from '@traze/lecciones';
import { ROTULO } from '@traze/lecciones/rotulos';
import { herramientaActiva, type HerramientaActiva } from '../reproductor/herramientas';
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

/** Lo que hace falta para trabajar sobre el dibujo: pinchar puntos y ver qué se señala. */
export interface Interaccion {
  alPulsar: (posicion: { x: number; y: number }) => void;
  /** Puntos que se señalan al alumno (pista). */
  resaltados: readonly { x: number; y: number }[];
  /** Puntos ya pinchados en la acción en curso. */
  elegidos: readonly { x: number; y: number }[];
  /** El instrumento que el alumno tiene en la mano (sustituye al que se deduce del dibujo). */
  herramienta: HerramientaActiva | null;
}

interface Propiedades {
  ancho: number;
  alto: number;
  dibujos: readonly (readonly PrimitivaResuelta[])[];
  paso: number;
  progreso: number;
  ocultarConstruccion: boolean;
  descripcion: string;
  interaccion?: Interaccion;
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
  interaccion,
}: Propiedades) {
  const visibles = primitivasVisibles(dibujos, paso, progreso).filter(
    ({ primitiva }) => !(ocultarConstruccion && esConstruccion(primitiva)),
  );

  const activa = interaccion ? interaccion.herramienta : herramientaActiva(visibles);
  const referencia = useRef<SVGSVGElement>(null);

  function pulsar(evento: PointerEvent<SVGSVGElement>) {
    const svg = referencia.current;
    const matriz = svg?.getScreenCTM();
    if (!interaccion || !svg || !matriz) return;
    const punto = svg.createSVGPoint();
    punto.x = evento.clientX;
    punto.y = evento.clientY;
    const enLienzo = punto.matrixTransform(matriz.inverse());
    interaccion.alPulsar({ x: enLienzo.x, y: enLienzo.y });
  }

  return (
    <svg
      ref={referencia}
      className={interaccion ? 'lienzo lienzo-interactivo' : 'lienzo'}
      onPointerDown={interaccion ? pulsar : undefined}
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

      {interaccion?.elegidos.map((punto, i) => (
        <circle key={`e${i}`} className="elegido" cx={punto.x} cy={punto.y} r={2.2} />
      ))}
      {interaccion?.resaltados.map((punto, i) => (
        <circle key={`r${i}`} className="resalte" cx={punto.x} cy={punto.y} r={3.6} />
      ))}

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