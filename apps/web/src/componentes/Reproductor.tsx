'use client';

import { useEffect, useMemo, useReducer, useState } from 'react';
import type { Leccion, LeccionResuelta } from '@traze/lecciones';
import { ConstruccionImposible, interpretarLeccion } from '@traze/lecciones/interpretar';
import { crearEstado, reductor, VELOCIDADES } from '../reproductor/estado';
import { decimal } from '../reproductor/formato';
import { etiquetaPaso, situacionPaso } from '../reproductor/indice';
import { derivarBanda } from '../reproductor/instrumentos';
import { duracionPaso } from '../reproductor/tiempos';
import { BandaInstrumentos } from './BandaInstrumentos';
import { Lienzo } from './Lienzo';

const FACTOR_MIN = 0.3;
const FACTOR_MAX = 0.85;
const MAX_SALTO_MS = 100;

interface Propiedades {
  leccion: Leccion;
  resuelta: LeccionResuelta;
}

export function Reproductor({ leccion, resuelta }: Propiedades) {
  const total = resuelta.pasos.length;
  const [estado, despachar] = useReducer(reductor, total, (pasos) => crearEstado(pasos));
  const [vista, setVista] = useState<LeccionResuelta>(resuelta);
  const [factores, setFactores] = useState<Record<string, number>>(() =>
    Object.fromEntries(Object.entries(leccion.radios).map(([id, radio]) => [id, radio.factor])),
  );
  const [aviso, setAviso] = useState<string | null>(null);

  const dibujos = useMemo(() => vista.pasos.map((paso) => paso.dibujo), [vista]);
  const pasoActual = vista.pasos[estado.paso];
  const duracion = duracionPaso(dibujos[estado.paso]);
  const banda = useMemo(
    () => derivarBanda(dibujos[estado.paso], vista.radios, leccion.radios, factores),
    [dibujos, estado.paso, vista.radios, leccion.radios, factores],
  );

  useEffect(() => {
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (consulta.matches) despachar({ tipo: 'animar', valor: false });
  }, []);

  useEffect(() => {
    if (!estado.reproduciendo) return;

    let anterior = performance.now();
    let cuadro = 0;
    const bucle = (ahora: number) => {
      despachar({
        tipo: 'avanzar',
        ms: Math.min(MAX_SALTO_MS, ahora - anterior),
        duracionPasoMs: duracion,
      });
      anterior = ahora;
      cuadro = requestAnimationFrame(bucle);
    };
    cuadro = requestAnimationFrame(bucle);
    return () => cancelAnimationFrame(cuadro);
  }, [estado.reproduciendo, estado.paso, duracion]);

  function cambiarFactor(id: string, valor: number) {
    const nuevos = { ...factores, [id]: valor };
    setFactores(nuevos);
    try {
      setVista(interpretarLeccion(leccion, nuevos));
      setAviso(null);
    } catch (error) {
      if (!(error instanceof ConstruccionImposible)) throw error;
      setAviso(error.message);
    }
  }

  return (
    <section className="reproductor" aria-label="Demostración animada">
      <div className="sala">
        <div className="lienzo-marco">
          <Lienzo
            ancho={vista.lienzo.ancho}
            alto={vista.lienzo.alto}
            dibujos={dibujos}
            paso={estado.paso}
            progreso={estado.progreso}
            ocultarConstruccion={estado.ocultarConstruccion}
            descripcion={`Paso ${estado.paso + 1} de ${total}: ${pasoActual.titulo}`}
          />
          <span className="escuadra" aria-hidden="true" />
        </div>

        <div className="panel-paso">
          <p className="etiqueta" aria-live="polite">
            Paso {estado.paso + 1} de {total}
          </p>
          <h2>{pasoActual.titulo}</h2>
          <p className="texto-paso">{pasoActual.texto}</p>
          <p className="porque">
            <strong>Por qué.</strong> {pasoActual.porque}
          </p>
          {pasoActual.consejo && (
            <details className="nota-profe">
              <summary>Consejo del profe</summary>
              <p>{pasoActual.consejo}</p>
            </details>
          )}
        </div>
      </div>

      <ol className="indice-pasos" aria-label="Pasos de la lección">
        {vista.pasos.map((paso, i) => {
          const situacion = situacionPaso(i, estado.paso);
          return (
            <li key={i}>
              <button
                type="button"
                className={`paso-boton paso-${situacion}`}
                aria-current={situacion === 'actual' ? 'step' : undefined}
                aria-label={etiquetaPaso(i, paso.titulo, situacion)}
                onClick={() => despachar({ tipo: 'irA', paso: i })}
              >
                <span className="paso-circulo" aria-hidden="true">
                  {situacion === 'hecho' ? '✓' : i + 1}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="controles" role="group" aria-label="Controles de la lección">
        <button
          type="button"
          className="boton"
          disabled={estado.paso === 0}
          onClick={() => despachar({ tipo: 'anterior' })}
        >
          ← Anterior
        </button>
        <button
          type="button"
          className="boton boton-principal"
          disabled={!estado.animar}
          onClick={() => despachar({ tipo: 'alternarReproduccion' })}
        >
          {estado.reproduciendo ? 'Pausar' : 'Reproducir todo'}
        </button>
        <button
          type="button"
          className="boton"
          disabled={estado.paso === total - 1}
          onClick={() => despachar({ tipo: 'siguiente' })}
        >
          Siguiente →
        </button>
        <button type="button" className="boton" onClick={() => despachar({ tipo: 'reiniciar' })}>
          Reiniciar
        </button>
        <button type="button" className="boton" onClick={() => despachar({ tipo: 'verSolucion' })}>
          Ver solución completa
        </button>

        <label className="campo">
          Velocidad
          <select
            className="selector"
            value={estado.velocidad}
            onChange={(evento) => {
              const valor = VELOCIDADES.find((v) => v === Number(evento.target.value));
              if (valor) despachar({ tipo: 'velocidad', valor });
            }}
          >
            {VELOCIDADES.map((v) => (
              <option key={v} value={v}>
                {decimal(v, 1).replace(',0', '')}×
              </option>
            ))}
          </select>
        </label>

        <label className="campo">
          <input
            type="checkbox"
            checked={estado.ocultarConstruccion}
            onChange={() => despachar({ tipo: 'alternarConstruccion' })}
          />
          Ocultar construcción
        </label>
      </div>

      {banda && <BandaInstrumentos banda={banda} />}

      {Object.keys(leccion.radios).length > 0 && (
        <div className="datos-modificables">
          <h3>Prueba otros datos</h3>
          {Object.entries(leccion.radios).map(([id, radio]) => (
            <label key={id} className="deslizador">
              <span>
                Abertura del compás ({id}): {decimal(factores[id], 2)} × {radio.entre.join('')}
              </span>
              <input
                type="range"
                min={FACTOR_MIN}
                max={FACTOR_MAX}
                step={0.01}
                value={factores[id]}
                onChange={(evento) => cambiarFactor(id, Number(evento.target.value))}
              />
            </label>
          ))}
          {aviso && (
            <p className="aviso" role="alert">
              {aviso}. Se muestra el último trazado válido.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
