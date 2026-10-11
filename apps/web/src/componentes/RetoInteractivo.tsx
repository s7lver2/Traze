'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Leccion, LeccionResuelta } from '@traze/lecciones';
import { nombreDelBloque } from '@traze/lecciones/bloques';
import {
  accionActual,
  clic,
  construido,
  crearEstado,
  crearReto,
  elegirInstrumento,
  fijarAbertura,
  instruccion,
  pedirPista,
  resaltados,
  resumen,
  trazarArco,
  type EstadoReto,
  type Instrumento,
  type NivelReto,
  type Reto,
} from '@traze/lecciones/reto';
import { registrarEstado } from '../progreso-navegador';
import type { HerramientaActiva } from '../reproductor/herramientas';
import { Lienzo } from './Lienzo';

const NIVELES: { nivel: NivelReto; titulo: string; descripcion: string }[] = [
  {
    nivel: 'guiado',
    titulo: 'Guiado',
    descripcion: 'Te digo qué hacer en cada paso y te señalo los puntos. Para aprender el proceso.',
  },
  {
    nivel: 'memoria',
    titulo: 'De memoria',
    descripcion: 'Solo ves el título de cada paso. Tú eliges el instrumento y los puntos.',
  },
  {
    nivel: 'examen',
    titulo: 'Examen',
    descripcion: 'Solo ves el enunciado. Cada fallo y cada pista cuentan.',
  },
];

const INSTRUMENTOS: Instrumento[] = ['regla', 'compas', 'lapiz'];
const ETIQUETA_INSTRUMENTO: Record<Instrumento, string> = {
  regla: 'Regla',
  compas: 'Compás',
  lapiz: 'Lápiz (marcar un punto)',
};

const ABERTURA_VISTA = 25;

function herramientaEnMano(estado: EstadoReto, reto: Reto): HerramientaActiva | null {
  const accion = accionActual(reto, estado);
  if (estado.instrumento !== 'compas' || !accion || estado.clics.length === 0) return null;
  const aguja = estado.clics[0];
  if (accion.tipo === 'compas') {
    return { tipo: 'compas', aguja, mina: { x: aguja.x + estado.abertura, y: aguja.y } };
  }
  if (accion.tipo === 'compasEntre') {
    const mina = estado.clics[1] ?? { x: aguja.x + ABERTURA_VISTA, y: aguja.y };
    return { tipo: 'compas', aguja, mina };
  }
  return null;
}

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

  const dibujos = useMemo(() => construido(estado ?? crearEstado(reto, 'examen'), reto), [estado, reto]);
  const accion = estado ? accionActual(reto, estado) : null;
  const total = reto.pasos.length;

  function aplicar(resultado: { estado: EstadoReto; evento: string }) {
    setEstado(resultado.estado);
    if (resultado.evento === 'fin' && semilla === null) {
      registrarEstado(leccion.id, resumen(resultado.estado).progreso);
    }
  }

  function empezar(nivel: NivelReto) {
    setEstado(crearEstado(reto, nivel));
  }

  const puntosElegibles = useMemo(() => {
    if (!estado) return [];
    const visibles = dibujos
      .flat()
      .flatMap((primitiva) => (primitiva.tipo === 'punto' ? [{ id: primitiva.id, x: primitiva.x, y: primitiva.y }] : []));
    const objetivo = resaltados(estado, reto);
    for (const punto of reto.puntos) {
      if (objetivo.some((o) => o.x === punto.x && o.y === punto.y) && !visibles.some((v) => v.id === punto.id)) {
        visibles.push(punto);
      }
    }
    return visibles;
  }, [estado, dibujos, reto]);

  const resumenFinal = estado?.terminado ? resumen(estado) : null;

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
            estado
              ? `Reto, paso ${estado.paso + 1} de ${total}`
              : 'Dibujo del reto: los datos de la lámina'
          }
          interaccion={
            estado && !estado.terminado
              ? {
                  alPulsar: (posicion) => aplicar(clic(estado, reto, posicion)),
                  resaltados: resaltados(estado, reto),
                  elegidos: estado.clics,
                  herramienta: herramientaEnMano(estado, reto),
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
          <aside className="postit postit-paso">
            <p className="etiqueta" aria-live="polite">
              Paso {estado.paso + 1} de {total} · {NIVELES.find((n) => n.nivel === estado.nivel)?.titulo}
            </p>
            <h2>{instruccion(estado, reto)}</h2>
            {estado.mensaje && (
              <p className={`mensaje mensaje-${estado.mensaje.tipo}`} role="status">
                {estado.mensaje.texto}
              </p>
            )}
          </aside>
        )}

        {resumenFinal && estado && (
          <aside className="postit postit-datos">
            <h2>¡Lámina completada!</h2>
            <p>
              {resumenFinal.errores === 0 ? 'Sin ningún fallo' : `${resumenFinal.errores} fallo${resumenFinal.errores === 1 ? '' : 's'}`}
              {resumenFinal.pistas > 0 ? ` y ${resumenFinal.pistas} pista${resumenFinal.pistas === 1 ? '' : 's'}` : ''}.
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
          <p>{reto.enunciado}</p>
        </aside>
      </div>

      <div className="notas notas-derecha">
        {estado && !estado.terminado && (
          <>
            <aside className="postit postit-ajustes" aria-label="Instrumentos">
              <p className="etiqueta">Instrumento en la mano</p>
              <div className="ajustes-botones">
                {INSTRUMENTOS.map((instrumento) => (
                  <button
                    key={instrumento}
                    type="button"
                    className="boton"
                    aria-pressed={estado.instrumento === instrumento}
                    onClick={() => setEstado(elegirInstrumento(estado, instrumento))}
                  >
                    {ETIQUETA_INSTRUMENTO[instrumento]}
                  </button>
                ))}
              </div>

              {estado.instrumento === 'compas' && (
                <div className="deslizador">
                  <label>
                    <span>
                      Abertura del compás: {estado.abertura.toFixed(1).replace('.', ',')} mm
                    </span>
                    <input
                      type="range"
                      min={5}
                      max={Math.round(reto.lienzo.ancho)}
                      step={0.5}
                      value={estado.abertura}
                      onChange={(evento) => setEstado(fijarAbertura(estado, Number(evento.target.value)))}
                    />
                  </label>
                  {accion?.tipo === 'compas' && (
                    <button
                      type="button"
                      className="boton boton-principal"
                      onClick={() => aplicar(trazarArco(estado, reto))}
                    >
                      Trazar arco
                    </button>
                  )}
                </div>
              )}
            </aside>

            <details className="postit postit-ajustes">
              <summary>Elegir un punto sin ratón</summary>
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
            </details>
          </>
        )}
        {estado && estado.errores + estado.pistas > 0 && !estado.terminado && (
          <aside className="postit postit-ajustes" aria-label="Marcador">
            <p>
              Fallos: {estado.errores} · Pistas: {estado.pistas}
            </p>
          </aside>
        )}
      </div>

      <div className="barra" role="group" aria-label="Controles del reto">
        {estado && !estado.terminado && estado.nivel !== 'guiado' && (
          <button
            type="button"
            className="boton"
            disabled={estado.pista}
            onClick={() => setEstado(pedirPista(estado))}
          >
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
