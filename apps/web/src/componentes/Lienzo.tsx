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
  /** Se baja el botón (o se toca) sobre el dibujo, en milímetros. */
  alBajar: (posicion: { x: number; y: number }) => void;
  /** Se suelta: si es cerca de donde se bajó es un clic; si no, un arrastre. */
  alSubir: (posicion: { x: number; y: number }) => void;
  /** Puntos que se señalan al alumno (pista). */
  resaltados: readonly { x: number; y: number }[];
  /** El ratón se mueve sobre el dibujo (para que el compás siga al puntero). */
  alMover?: (posicion: { x: number; y: number } | null) => void;
  /** Circunferencia guía de la abertura del compás. */
  guia?: { x: number; y: number; radio: number } | null;
  /** Arco guía: lo que hay que recorrer con el compás. */
  guiaArco?: { x: number; y: number; radio: number; inicio: number; fin: number } | null;
  /** El arco que el alumno está trazando ahora mismo con el compás. */
  arcoVivo?: { x: number; y: number; radio: number; desde: number; hasta: number } | null;
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
  /** Puntos que se enseñan resaltados (por ejemplo, al pasar el ratón por su nombre en un texto). */
  destacados?: readonly { x: number; y: number }[];
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
  destacados,
}: Propiedades) {
  const visibles = primitivasVisibles(dibujos, paso, progreso).filter(
    ({ primitiva }) => !(ocultarConstruccion && esConstruccion(primitiva)),
  );

  const activa = interaccion ? interaccion.herramienta : herramientaActiva(visibles);
  const referencia = useRef<SVGSVGElement>(null);

  function aLienzo(evento: PointerEvent<SVGSVGElement>): { x: number; y: number } | null {
    const svg = referencia.current;
    const matriz = svg?.getScreenCTM();
    if (!svg || !matriz) return null;
    const punto = svg.createSVGPoint();
    punto.x = evento.clientX;
    punto.y = evento.clientY;
    const enLienzo = punto.matrixTransform(matriz.inverse());
    return { x: enLienzo.x, y: enLienzo.y };
  }

  function bajar(evento: PointerEvent<SVGSVGElement>) {
    const posicion = aLienzo(evento);
    if (!interaccion || !posicion) return;
    // Con el puntero capturado, el arrastre sigue llegando aunque salga del dibujo.
    evento.currentTarget.setPointerCapture?.(evento.pointerId);
    interaccion.alBajar(posicion);
  }

  function subir(evento: PointerEvent<SVGSVGElement>) {
    const posicion = aLienzo(evento);
    if (interaccion && posicion) interaccion.alSubir(posicion);
  }

  function mover(evento: PointerEvent<SVGSVGElement>) {
    interaccion?.alMover?.(aLienzo(evento));
  }

  return (
    <svg
      ref={referencia}
      className={interaccion ? 'lienzo lienzo-interactivo' : 'lienzo'}
      onPointerDown={interaccion ? bajar : undefined}
      onPointerUp={interaccion ? subir : undefined}
      onPointerCancel={interaccion ? subir : undefined}
      onPointerMove={interaccion?.alMover ? mover : undefined}
      onPointerLeave={interaccion?.alMover ? () => interaccion.alMover?.(null) : undefined}
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

      {interaccion?.guia && (
        <circle
          className="guia-abertura"
          cx={interaccion.guia.x}
          cy={interaccion.guia.y}
          r={interaccion.guia.radio}
        />
      )}
      {interaccion?.guiaArco && (
        <path
          className="guia-abertura"
          d={descripcionArco(
            {
              tipo: 'arco',
              cx: interaccion.guiaArco.x,
              cy: interaccion.guiaArco.y,
              radio: interaccion.guiaArco.radio,
              inicio: interaccion.guiaArco.inicio,
              fin: interaccion.guiaArco.fin,
              estilo: 'construccion',
            },
            1,
          )}
        />
      )}
      {interaccion?.arcoVivo && (
        <path
          className="arco-vivo"
          d={descripcionArco(
            {
              tipo: 'arco',
              cx: interaccion.arcoVivo.x,
              cy: interaccion.arcoVivo.y,
              radio: interaccion.arcoVivo.radio,
              inicio: interaccion.arcoVivo.desde,
              fin: interaccion.arcoVivo.hasta,
              estilo: 'construccion',
            },
            1,
          )}
        />
      )}
      {interaccion?.elegidos.map((punto, i) => (
        <circle key={`e${i}`} className="elegido" cx={punto.x} cy={punto.y} r={2.2} />
      ))}
      {destacados?.map((punto, i) => (
        <circle key={`d${i}`} className="destacado" cx={punto.x} cy={punto.y} r={4.2} />
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