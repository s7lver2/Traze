'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import type { Leccion, LeccionResuelta } from '@traze/lecciones';
import { nombreDelBloque } from '@traze/lecciones/bloques';
import {
  accionActual,
  barrer,
  clic,
  construido,
  crearEstado,
  crearReto,
  fijarAbertura,
  guiaDeAbertura,
  guiaDeArco,
  instruccion,
  pedirPista,
  resaltados,
  resumen,
  trazarArco,
  type EstadoReto,
  type NivelReto,
  type Reto,
} from '@traze/lecciones/reto';
import { registrarEstado } from '../progreso-navegador';
import type { HerramientaActiva } from '../reproductor/herramientas';
import { clavesDeLosPuntos, useDestacados } from '../reproductor/useDestacados';
import {
  enLaCircunferencia,
  iniciarBarrido,
  moverBarrido,
  recorrido,
  type Barrido,
} from '../taller/barrido';
import { Lienzo } from './Lienzo';
import { TextoConPuntos } from './TextoConPuntos';

const NIVELES: { nivel: NivelReto; titulo: string; descripcion: string }[] = [
  {
    nivel: 'guiado',
    titulo: 'Guiado',
    descripcion: 'Te digo qué hacer en cada paso y te señalo los puntos. Para aprender el proceso.',
  },
  {
    nivel: 'memoria',
    titulo: 'De memoria',
    descripcion: 'Solo ves el título de cada paso. Tú pones los puntos y las medidas.',
  },
  {
    nivel: 'examen',
    titulo: 'Examen',
    descripcion: 'Solo ves el enunciado. Cada fallo y cada pista cuentan.',
  },
];

const NOMBRE_INSTRUMENTO = { regla: 'la regla', compas: 'el compás', lapiz: 'el lápiz' } as const;
const ABERTURA_VISTA = 25;

type Posicion = { x: number; y: number };

/** El compás ya abierto: su radio real y dónde está la mina ahora. */
interface CompasAbierto {
  radio: number;
  angulo: number;
}

/** El instrumento que el alumno tiene en la mano: sigue al puntero una vez pinchado el primer punto. */
function herramientaEnMano(
  estado: EstadoReto,
  reto: Reto,
  cursor: Posicion | null,
  abierto: CompasAbierto | null,
): HerramientaActiva | null {
  const accion = accionActual(reto, estado);
  if (!accion || estado.clics.length === 0) return null;
  const primero = estado.clics[0];
  if (accion.tipo === 'compas') {
    if (estado.aberturaFijada !== null && abierto) {
      return { tipo: 'compas', aguja: primero, mina: enLaCircunferencia(primero, abierto.radio, abierto.angulo) };
    }
    return {
      tipo: 'compas',
      aguja: primero,
      mina: cursor ?? { x: primero.x + ABERTURA_VISTA, y: primero.y },
    };
  }
  if (accion.tipo === 'compasEntre') {
    const mina = estado.clics[1] ?? cursor ?? { x: primero.x + ABERTURA_VISTA, y: primero.y };
    return { tipo: 'compas', aguja: primero, mina };
  }
  if (accion.tipo === 'regla' && cursor) {
    return { tipo: 'regla', tramo: { x1: primero.x, y1: primero.y, x2: cursor.x, y2: cursor.y } };
  }
  return null;
}

const UMBRAL_ARRASTRE_MM = 2;
const distanciaEntre = (a: Posicion, b: Posicion): number => Math.hypot(a.x - b.x, a.y - b.y);

interface Propiedades {
  leccion: Leccion;
  resuelta: LeccionResuelta;
  enunciado: string;
  /** Si es un problema generado, su semilla; la lámina de la lección no lleva. */
  semilla: number | null;
  alOtroProblema?: () => void;
}

export function RetoInteractivo({ leccion, resuelta, enunciado, semilla, alOtroProblema }: Propiedades) {
  const reto = useMemo(() => crearReto(leccion, resuelta, enunciado), [leccion, resuelta, enunciado]);
  const [estado, setEstado] = useState<EstadoReto | null>(null);
  const [cursor, setCursor] = useState<Posicion | null>(null);
  const [abierto, setAbierto] = useState<CompasAbierto | null>(null);
  const [giro, setGiro] = useState<Barrido | null>(null);
  const bajada = useRef<Posicion | null>(null);
  const girando = useRef<Barrido | null>(null);

  const dibujos = useMemo(() => construido(estado ?? crearEstado(reto, 'examen'), reto), [estado, reto]);
  const accion = estado ? accionActual(reto, estado) : null;
  const total = reto.pasos.length;

  const claves = useMemo(() => clavesDeLosPuntos(reto.dibujos.flat()), [reto]);
  const visibles = useMemo(
    () =>
      new Set(
        dibujos.flat().flatMap((primitiva) => (primitiva.tipo === 'punto' ? [primitiva.id] : [])),
      ),
    [dibujos],
  );
  const coordenadas = useMemo(
    () => Object.fromEntries(reto.puntos.map((punto) => [punto.id, { x: punto.x, y: punto.y }])),
    [reto],
  );
  const { destacados, alResaltar } = useDestacados(coordenadas, claves, visibles);
  const conPuntos = (texto: string) => (
    <TextoConPuntos texto={texto} claves={Object.keys(claves)} alResaltar={alResaltar} />
  );

  function aplicar(resultado: { estado: EstadoReto; evento: string }) {
    if (resultado.estado.aberturaFijada === null) setAbierto(null);
    setEstado(resultado.estado);
    if (resultado.evento === 'fin' && semilla === null) {
      registrarEstado(leccion.id, resumen(resultado.estado).progreso);
    }
  }

  // Un clic o un arrastre: pinchar y soltar en otro sitio es lo mismo que pinchar los dos puntos.
  function alBajar(posicion: Posicion) {
    if (!estado || estado.terminado) return;
    bajada.current = posicion;
    const actual = accionActual(reto, estado);
    if (actual?.tipo === 'compas' && estado.aberturaFijada !== null) {
      girando.current = iniciarBarrido(actual.centro, posicion);
      setGiro(girando.current);
    }
  }

  function alMover(posicion: Posicion | null) {
    setCursor(posicion);
    if (girando.current && posicion) {
      girando.current = moverBarrido(girando.current, posicion);
      setGiro(girando.current);
    }
  }

  function alSubir(posicion: Posicion) {
    if (!estado || estado.terminado) return;
    const inicio = bajada.current;
    bajada.current = null;

    if (girando.current) {
      const barrido = girando.current;
      girando.current = null;
      setGiro(null);
      aplicar(barrer(estado, reto, recorrido(barrido)));
      return;
    }
    if (!inicio) return;

    const actual = accionActual(reto, estado);
    const arrastre = distanciaEntre(inicio, posicion) >= UMBRAL_ARRASTRE_MM;
    const sePuedeArrastrar =
      actual && (actual.tipo === 'regla' || (actual.tipo === 'compas' && estado.clics.length === 0));
    if (arrastre && sePuedeArrastrar) {
      const primero = clic(estado, reto, inicio);
      if (primero.evento === 'error') return aplicar(primero);
      const segundo = clic(primero.estado, reto, posicion);
      if (actual.tipo === 'compas' && segundo.estado.aberturaFijada !== null) {
        setAbierto({ radio: distanciaEntre(actual.centro, posicion), angulo: Math.atan2(posicion.y - actual.centro.y, posicion.x - actual.centro.x) });
      }
      return aplicar(segundo);
    }
    const resultado = clic(estado, reto, posicion);
    if (actual?.tipo === 'compas' && estado.clics.length === 1 && resultado.estado.aberturaFijada !== null) {
      setAbierto({ radio: distanciaEntre(actual.centro, posicion), angulo: Math.atan2(posicion.y - actual.centro.y, posicion.x - actual.centro.x) });
    }
    aplicar(resultado);
  }

  function empezar(nivel: NivelReto) {
    setAbierto(null);
    setGiro(null);
    girando.current = null;
    bajada.current = null;
    setCursor(null);
    setEstado(crearEstado(reto, nivel));
  }

  // Para quien no usa ratón: los puntos que ya están dibujados (y el que se indica, si hay ayuda).
  const puntosElegibles = useMemo(() => {
    if (!estado) return [];
    const lista = [...visibles].flatMap((id) => (coordenadas[id] ? [{ id, ...coordenadas[id] }] : []));
    for (const objetivo of resaltados(estado, reto)) {
      const punto = reto.puntos.find((candidato) => candidato.x === objetivo.x && candidato.y === objetivo.y);
      if (punto && !lista.some((visto) => visto.id === punto.id)) lista.push({ ...punto });
    }
    return lista;
  }, [estado, visibles, coordenadas, reto]);

  const resumenFinal = estado?.terminado ? resumen(estado) : null;
  const guia = estado ? guiaDeAbertura(estado, reto) : null;
  const guiaArco = estado ? guiaDeArco(estado, reto) : null;
  const actualRetoAccion = estado ? accionActual(reto, estado) : null;
  const arcoVivo =
    giro && abierto && actualRetoAccion?.tipo === 'compas'
      ? {
          x: actualRetoAccion.centro.x,
          y: actualRetoAccion.centro.y,
          radio: abierto.radio,
          desde: giro.minimo,
          hasta: giro.maximo,
        }
      : null;
  const anguloMina = giro && abierto ? giro.ultimo : abierto?.angulo ?? 0;
  const nombreDelNivel = estado ? NIVELES.find((n) => n.nivel === estado.nivel)?.titulo : null;

  return (
    <section className="escenario escenario-reto" aria-label="Reto de construcción">
      <header className="escenario-titulo">
        <p className="etiqueta">
          Reto · Bloque {leccion.bloque} · {nombreDelBloque(leccion.bloque)}
        </p>
        <h1>{reto.titulo}</h1>
        {semilla !== null && <p className="etiqueta">Problema aleatorio nº {semilla}</p>}
      </header>

      <div className="escenario-dibujo">
        <Lienzo
          ancho={reto.lienzo.ancho}
          alto={reto.lienzo.alto}
          dibujos={dibujos}
          paso={estado ? estado.paso : 0}
          progreso={1}
          ocultarConstruccion={false}
          descripcion={
            estado ? `Reto, paso ${estado.paso + 1} de ${total}` : 'Dibujo del reto: los datos de la lámina'
          }
          destacados={destacados}
          interaccion={
            estado && !estado.terminado
              ? {
                  alBajar,
                  alSubir,
                  alMover,
                  guia: guia ? { x: guia.centro.x, y: guia.centro.y, radio: guia.radio } : null,
                  guiaArco: guiaArco
                    ? { x: guiaArco.centro.x, y: guiaArco.centro.y, radio: guiaArco.radio, inicio: guiaArco.inicio, fin: guiaArco.fin }
                    : null,
                  arcoVivo,
                  resaltados: resaltados(estado, reto),
                  elegidos: estado.clics,
                  herramienta: herramientaEnMano(estado, reto, cursor, abierto ? { ...abierto, angulo: anguloMina } : null),
                }
              : undefined
          }
        />
      </div>

      <div className="notas notas-izquierda">
        {!estado && (
          <aside className="postit postit-paso">
            <p className="etiqueta">Elige cómo practicar</p>
            <ul className="niveles">
              {NIVELES.map(({ nivel, titulo, descripcion }) => (
                <li key={nivel}>
                  <button type="button" className="boton boton-nivel" onClick={() => empezar(nivel)}>
                    <span className="nivel-titulo">{titulo}</span>
                    <span className="nivel-texto">{descripcion}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {estado && !estado.terminado && (
          <aside key={`paso-${estado.paso}`} className="postit postit-paso">
            <p className="etiqueta" aria-live="polite">
              Paso {estado.paso + 1} de {total} · {nombreDelNivel}
            </p>
            <h2>{conPuntos(instruccion(estado, reto))}</h2>
            {accion && estado.nivel !== 'examen' && (
              <p className="instrumento-actual">Con {NOMBRE_INSTRUMENTO[estado.instrumento ?? 'lapiz']}</p>
            )}
            {estado.mensaje && (
              <p
                key={`mensaje-${estado.accion}-${estado.errores}-${estado.mensaje.texto}`}
                className={`mensaje mensaje-${estado.mensaje.tipo}`}
                role="status"
              >
                {conPuntos(estado.mensaje.texto)}
              </p>
            )}
          </aside>
        )}

        {resumenFinal && estado && (
          <aside key="fin" className="postit postit-datos">
            <h2>¡Lámina completada!</h2>
            <p>
              {resumenFinal.errores === 0
                ? 'Sin ningún fallo'
                : `${resumenFinal.errores} fallo${resumenFinal.errores === 1 ? '' : 's'}`}
              {resumenFinal.pistas > 0
                ? ` y ${resumenFinal.pistas} pista${resumenFinal.pistas === 1 ? '' : 's'}`
                : ''}
              .
            </p>
            <p>
              {resumenFinal.progreso === 'dominada'
                ? 'Esta lámina queda dominada: la has hecho de memoria y sin ayuda.'
                : estado.nivel === 'guiado'
                  ? 'Ahora prueba «De memoria» para fijarla.'
                  : 'Repítela sin fallos ni pistas para dominarla.'}
            </p>
            <div className="ajustes-botones">
              <button type="button" className="boton" onClick={() => empezar(estado.nivel)}>
                Repetir
              </button>
              <button type="button" className="boton" onClick={() => setEstado(null)}>
                Cambiar de nivel
              </button>
              {alOtroProblema && (
                <button type="button" className="boton boton-principal" onClick={alOtroProblema}>
                  Otro problema
                </button>
              )}
            </div>
          </aside>
        )}

        <aside className="postit postit-porque">
          <p className="etiqueta">Enunciado</p>
          <p>{conPuntos(reto.enunciado)}</p>
        </aside>
      </div>

      <div className="notas notas-derecha">
        {estado && !estado.terminado && estado.errores + estado.pistas > 0 && (
          <aside key={`marcador-${estado.errores}-${estado.pistas}`} className="postit postit-ajustes" aria-label="Marcador">
            <p>
              Fallos: {estado.errores} · Pistas: {estado.pistas}
            </p>
          </aside>
        )}

        {estado && !estado.terminado && (
          <details className="postit postit-ajustes">
            <summary>Sin ratón</summary>
            <p className="etiqueta">Elige un punto</p>
            <div className="ajustes-botones">
              {puntosElegibles.map((punto) => (
                <button
                  key={punto.id}
                  type="button"
                  className="boton"
                  onClick={() => aplicar(clic(estado, reto, punto))}
                >
                  {punto.id}
                </button>
              ))}
            </div>
            {accion?.tipo === 'compas' && estado.clics.length === 1 && (
              <div className="deslizador">
                <label>
                  <span>Abertura del compás: {estado.abertura.toFixed(1).replace('.', ',')} mm</span>
                  <input
                    type="range"
                    min={5}
                    max={Math.round(reto.lienzo.ancho)}
                    step={0.5}
                    value={estado.abertura}
                    onChange={(evento) => setEstado(fijarAbertura(estado, Number(evento.target.value)))}
                  />
                </label>
                <button type="button" className="boton" onClick={() => aplicar(trazarArco(estado, reto))}>
                  Abrir el compás así
                </button>
              </div>
            )}
          </details>
        )}
      </div>

      <div className="barra" role="group" aria-label="Controles del reto">
        {estado && !estado.terminado && estado.nivel !== 'guiado' && (
          <button type="button" className="boton" disabled={estado.pista} onClick={() => setEstado(pedirPista(estado))}>
            Pista
          </button>
        )}
        {estado && (
          <button type="button" className="boton" onClick={() => empezar(estado.nivel)}>
            Reiniciar
          </button>
        )}
        <Link className="boton" href={`/leccion/${leccion.id}`}>
          Ver la lección
        </Link>
        {alOtroProblema && !resumenFinal && (
          <button type="button" className="boton" onClick={alOtroProblema}>
            Otro problema
          </button>
        )}
      </div>
    </section>
  );
}
