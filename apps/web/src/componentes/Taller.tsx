'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { ROTULO } from '@traze/lecciones/rotulos';
import {
  añadirCirculo,
  añadirLinea,
  borrar,
  escenaVacia,
  imantar,
  moverPunto,
  objetoEn,
  resolver,
  tomarPunto,
  type Escena,
  type Estilo,
  type Id,
  type Imantado,
  type Radio,
} from '../taller/escena';
import {
  enLaCircunferencia,
  iniciarBarrido,
  moverBarrido,
  type Barrido,
} from '../taller/barrido';
import type { HerramientaActiva } from '../reproductor/herramientas';
import { descripcionArco } from '../reproductor/trazado';
import { Herramienta } from './Herramienta';

const ANCHO = 297;
const ALTO = 210;
const TOLERANCIA_MM = 4;
const UMBRAL_ARRASTRE_MM = 2;
const CLAVE_TALLER = 'traze:taller';
const DOS_PI = 2 * Math.PI;

type Pos = { x: number; y: number };
type Util = 'mover' | 'punto' | 'regla' | 'compas' | 'borrar';

const UTILES: { util: Util; nombre: string; ayuda: string }[] = [
  { util: 'mover', nombre: 'Mover', ayuda: 'Arrastra un punto libre: todo lo construido sobre él se recalcula.' },
  { util: 'punto', nombre: 'Punto', ayuda: 'Toca para marcar un punto. Se engancha a los puntos y a los cortes.' },
  {
    util: 'regla',
    nombre: 'Regla',
    ayuda: 'Arrastra de un punto a otro, o toca dos puntos, para trazar con la regla.',
  },
  {
    util: 'compas',
    nombre: 'Compás',
    ayuda:
      'Arrastra desde el centro para abrirlo; arrastra para girarlo y dibujar el arco; toca otro punto para llevar allí la aguja con la misma abertura.',
  },
  { util: 'borrar', nombre: 'Borrar', ayuda: 'Toca un punto, una línea o un arco para quitarlo, con todo lo que dependa de él.' },
];

interface CompasAbierto {
  aguja: Id;
  radio: Radio;
  mm: number;
  /** Ángulo en el que está ahora la mina. */
  angulo: number;
}

interface Pila {
  pasado: Escena[];
  presente: Escena;
  futuro: Escena[];
}

function leerEscena(): Escena {
  try {
    const texto = window.localStorage.getItem(CLAVE_TALLER);
    if (!texto) return escenaVacia();
    const datos = JSON.parse(texto) as Partial<Escena>;
    if (!Array.isArray(datos.objetos) || typeof datos.letras !== 'number' || typeof datos.serie !== 'number') {
      return escenaVacia();
    }
    return datos as Escena;
  } catch {
    return escenaVacia();
  }
}

function guardarEscena(escena: Escena): void {
  try {
    window.localStorage.setItem(CLAVE_TALLER, JSON.stringify(escena));
  } catch {
    // Sin almacenamiento: el taller funciona igual, pero no se recuerda.
  }
}

const decimal = (mm: number): string => mm.toFixed(1).replace('.', ',');

export function Taller() {
  const [pila, setPila] = useState<Pila>({ pasado: [], presente: escenaVacia(), futuro: [] });
  const [vivo, setVivo] = useState<Escena | null>(null);
  const [util, setUtil] = useState<Util>('regla');
  const [tipoLinea, setTipoLinea] = useState<'segmento' | 'recta'>('segmento');
  const [estilo, setEstilo] = useState<Estilo>('construccion');
  const [cursor, setCursor] = useState<Pos | null>(null);
  const [pendiente, setPendiente] = useState<Id | null>(null);
  const [regla, setRegla] = useState<{ desde: Pos } | null>(null);
  const [compas, setCompas] = useState<CompasAbierto | null>(null);
  const [apertura, setApertura] = useState<{ aguja: Pos } | null>(null);
  const [giro, setGiro] = useState<Barrido | null>(null);
  const [cargado, setCargado] = useState(false);

  const referencia = useRef<SVGSVGElement>(null);
  const bajada = useRef<{ pos: Pos; imantado: Imantado | null } | null>(null);
  const girando = useRef<Barrido | null>(null);
  const moviendo = useRef<Id | null>(null);

  const escena = vivo ?? pila.presente;
  const resuelta = useMemo(() => resolver(escena), [escena]);

  useEffect(() => {
    setPila({ pasado: [], presente: leerEscena(), futuro: [] });
    setCargado(true);
  }, []);

  useEffect(() => {
    if (cargado) guardarEscena(pila.presente);
  }, [pila.presente, cargado]);

  function confirmar(nueva: Escena) {
    setPila((anterior) => ({ pasado: [...anterior.pasado, anterior.presente].slice(-100), presente: nueva, futuro: [] }));
    setVivo(null);
  }

  function deshacer() {
    setPila((anterior) => {
      const previa = anterior.pasado[anterior.pasado.length - 1];
      if (!previa) return anterior;
      return { pasado: anterior.pasado.slice(0, -1), presente: previa, futuro: [anterior.presente, ...anterior.futuro] };
    });
    soltarTodo();
  }

  function rehacer() {
    setPila((anterior) => {
      const siguiente = anterior.futuro[0];
      if (!siguiente) return anterior;
      return { pasado: [...anterior.pasado, anterior.presente], presente: siguiente, futuro: anterior.futuro.slice(1) };
    });
    soltarTodo();
  }

  function limpiar() {
    if (pila.presente.objetos.length === 0) return;
    confirmar(escenaVacia());
    soltarTodo();
  }

  function soltarTodo() {
    setPendiente(null);
    setRegla(null);
    setCompas(null);
    setApertura(null);
    setGiro(null);
    girando.current = null;
    bajada.current = null;
    moviendo.current = null;
    setVivo(null);
  }

  function elegirUtil(nuevo: Util) {
    soltarTodo();
    setUtil(nuevo);
  }

  function aMilimetros(evento: PointerEvent<SVGSVGElement>): Pos | null {
    const svg = referencia.current;
    const matriz = svg?.getScreenCTM();
    if (!svg || !matriz) return null;
    const p = svg.createSVGPoint();
    p.x = evento.clientX;
    p.y = evento.clientY;
    const enLienzo = p.matrixTransform(matriz.inverse());
    return { x: enLienzo.x, y: enLienzo.y };
  }

  const imantarAhora = (e: Escena, pos: Pos) => imantar(e, resolver(e), pos, TOLERANCIA_MM);

  // ---------- Gestos ----------

  function alBajar(evento: PointerEvent<SVGSVGElement>) {
    const pos = aMilimetros(evento);
    if (!pos) return;
    evento.currentTarget.setPointerCapture?.(evento.pointerId);
    const base = pila.presente;
    bajada.current = { pos, imantado: imantarAhora(base, pos) };

    if (util === 'mover') {
      const id = objetoEn(base, resolver(base), pos, TOLERANCIA_MM);
      const objeto = base.objetos.find((candidato) => candidato.id === id);
      moviendo.current = objeto?.tipo === 'punto' ? objeto.id : null;
    } else if (util === 'regla') {
      setRegla({ desde: bajada.current.imantado ? { x: bajada.current.imantado.x, y: bajada.current.imantado.y } : pos });
    } else if (util === 'compas') {
      if (compas) {
        const centro = resuelta.puntos.get(compas.aguja);
        if (centro) {
          girando.current = iniciarBarrido(centro, pos);
          setGiro(girando.current);
        }
      } else {
        const aguja = bajada.current.imantado ? { x: bajada.current.imantado.x, y: bajada.current.imantado.y } : pos;
        setApertura({ aguja });
      }
    }
  }

  function alMover(evento: PointerEvent<SVGSVGElement>) {
    const pos = aMilimetros(evento);
    setCursor(pos);
    if (!pos) return;
    if (util === 'mover' && moviendo.current && bajada.current) {
      setVivo(moverPunto(pila.presente, moviendo.current, pos.x, pos.y));
    }
    if (girando.current) {
      girando.current = moverBarrido(girando.current, pos);
      setGiro(girando.current);
    }
  }

  function alSubir(evento: PointerEvent<SVGSVGElement>) {
    const pos = aMilimetros(evento);
    const inicio = bajada.current;
    bajada.current = null;
    if (!pos || !inicio) {
      soltarTodo();
      return;
    }
    const base = pila.presente;
    const arrastre = Math.hypot(pos.x - inicio.pos.x, pos.y - inicio.pos.y) >= UMBRAL_ARRASTRE_MM;

    switch (util) {
      case 'mover': {
        if (moviendo.current && vivo) confirmar(vivo);
        moviendo.current = null;
        setVivo(null);
        return;
      }
      case 'punto': {
        confirmar(tomarPunto(base, inicio.imantado, inicio.pos).escena);
        return;
      }
      case 'borrar': {
        const id = objetoEn(base, resolver(base), inicio.pos, TOLERANCIA_MM);
        if (id) confirmar(borrar(base, id));
        return;
      }
      case 'regla': {
        setRegla(null);
        const primero = tomarPunto(base, inicio.imantado, inicio.pos);
        if (arrastre) {
          const segundo = tomarPunto(primero.escena, imantarAhora(primero.escena, pos), pos);
          if (segundo.id === primero.id) return;
          confirmar(añadirLinea(segundo.escena, tipoLinea, primero.id, segundo.id, estilo).escena);
          setPendiente(null);
          return;
        }
        if (pendiente && pendiente !== primero.id) {
          confirmar(añadirLinea(primero.escena, tipoLinea, pendiente, primero.id, estilo).escena);
          setPendiente(null);
          return;
        }
        confirmar(primero.escena);
        setPendiente(primero.id);
        return;
      }
      case 'compas': {
        if (compas) {
          const centro = resuelta.puntos.get(compas.aguja);
          const barrido = girando.current;
          girando.current = null;
          setGiro(null);
          if (!centro) return;
          if (barrido && Math.abs(barrido.actual - barrido.inicial) >= 0.05) {
            // El arco va desde donde se agarró la mina hasta donde se soltó.
            const entera = Math.abs(barrido.actual - barrido.inicial) >= DOS_PI * 0.97;
            const desde = Math.min(barrido.inicial, barrido.actual);
            const hasta = Math.max(barrido.inicial, barrido.actual);
            const nueva = añadirCirculo(base, compas.aguja, compas.radio, estilo, entera ? undefined : { desde, hasta });
            confirmar(nueva.escena);
            setCompas({ ...compas, angulo: barrido.actual });
            return;
          }
          // Un toque: se lleva la aguja a otro punto con la misma abertura.
          const destino = tomarPunto(base, inicio.imantado, inicio.pos);
          confirmar(destino.escena);
          setCompas({ aguja: destino.id, radio: { mm: compas.mm }, mm: compas.mm, angulo: compas.angulo });
          return;
        }

        setApertura(null);
        if (!arrastre) {
          // Un toque con el compás cerrado: solo deja la aguja clavada en ese punto.
          const aguja = tomarPunto(base, inicio.imantado, inicio.pos);
          confirmar(aguja.escena);
          setCompas({ aguja: aguja.id, radio: { mm: 20 }, mm: 20, angulo: 0 });
          return;
        }
        const aguja = tomarPunto(base, inicio.imantado, inicio.pos);
        const centro = resolver(aguja.escena).puntos.get(aguja.id)!;
        const destino = imantarAhora(aguja.escena, pos);
        let escenaNueva = aguja.escena;
        let radio: Radio;
        let mm = Math.hypot(pos.x - centro.x, pos.y - centro.y);
        let ancla = pos;
        if (destino && !(destino.tipo === 'punto' && destino.id === aguja.id)) {
          const punto = tomarPunto(escenaNueva, destino, pos);
          escenaNueva = punto.escena;
          radio = { por: punto.id };
          ancla = { x: destino.x, y: destino.y };
          mm = Math.hypot(destino.x - centro.x, destino.y - centro.y);
        } else {
          radio = { mm };
        }
        if (mm < 1) return;
        confirmar(escenaNueva);
        setCompas({ aguja: aguja.id, radio, mm, angulo: Math.atan2(ancla.y - centro.y, ancla.x - centro.x) });
        return;
      }
    }
  }

  function alSalir() {
    setCursor(null);
  }

  function alTeclear(evento: React.KeyboardEvent) {
    if (evento.key === 'Escape') soltarTodo();
    if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'z') {
      evento.preventDefault();
      if (evento.shiftKey) rehacer();
      else deshacer();
    }
  }

  // ---------- Qué se ve ----------

  const imantadoVisible = cursor && util !== 'mover' && util !== 'borrar' ? imantar(escena, resuelta, cursor, TOLERANCIA_MM) : null;
  const centroCompas = compas ? resuelta.puntos.get(compas.aguja) : undefined;
  const radioCompas = compas ? compas.mm : 0;

  let herramienta: HerramientaActiva | null = null;
  let medida: { pos: Pos; texto: string } | null = null;
  let arcoVivo: { cx: number; cy: number; radio: number; desde: number; hasta: number } | null = null;

  if (util === 'regla' && regla && cursor && bajada.current) {
    herramienta = { tipo: 'regla', tramo: { x1: regla.desde.x, y1: regla.desde.y, x2: cursor.x, y2: cursor.y } };
    medida = { pos: cursor, texto: `${decimal(Math.hypot(cursor.x - regla.desde.x, cursor.y - regla.desde.y))} mm` };
  } else if (util === 'compas') {
    if (apertura && cursor) {
      herramienta = { tipo: 'compas', aguja: apertura.aguja, mina: cursor };
      medida = { pos: cursor, texto: `${decimal(Math.hypot(cursor.x - apertura.aguja.x, cursor.y - apertura.aguja.y))} mm` };
    } else if (compas && centroCompas) {
      const angulo = giro ? giro.actual : compas.angulo;
      herramienta = { tipo: 'compas', aguja: centroCompas, mina: enLaCircunferencia(centroCompas, radioCompas, angulo) };
      medida = { pos: enLaCircunferencia(centroCompas, radioCompas, angulo), texto: `${decimal(radioCompas)} mm` };
      if (giro) {
        arcoVivo = {
          cx: centroCompas.x,
          cy: centroCompas.y,
          radio: radioCompas,
          desde: Math.min(giro.inicial, giro.actual),
          hasta: Math.max(giro.inicial, giro.actual),
        };
      }
    }
  }

  const ayuda = UTILES.find((candidato) => candidato.util === util)!.ayuda;
  const hayObjetos = pila.presente.objetos.length > 0;

  return (
    <section className="escenario escenario-taller" aria-label="Taller de dibujo libre" onKeyDown={alTeclear}>
      <header className="escenario-titulo">
        <p className="etiqueta">Taller</p>
        <h1>Prueba lo que quieras</h1>
      </header>

      <div className="escenario-dibujo">
        <svg
          ref={referencia}
          className="lienzo lienzo-interactivo lienzo-taller"
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          preserveAspectRatio="xMidYMid meet"
          role="application"
          aria-label="Lámina de dibujo libre: se maneja con el ratón o con el dedo"
          onPointerDown={alBajar}
          onPointerMove={alMover}
          onPointerUp={alSubir}
          onPointerCancel={alSubir}
          onPointerLeave={alSalir}
        >
          <defs>
            <pattern id="taller-rejilla" width="10" height="10" patternUnits="userSpaceOnUse">
              <path className="rejilla-taller" d="M 10 0 L 0 0 0 10" />
            </pattern>
          </defs>
          <rect width={ANCHO} height={ALTO} className="papel-taller" />
          <rect width={ANCHO} height={ALTO} fill="url(#taller-rejilla)" />

          {escena.objetos.map((objeto) => {
            if (objeto.tipo === 'segmento' || objeto.tipo === 'recta') {
              const linea = resuelta.lineas.get(objeto.id);
              if (!linea) return null;
              const largo = Math.hypot(linea.q.x - linea.p.x, linea.q.y - linea.p.y);
              const ux = (linea.q.x - linea.p.x) / largo;
              const uy = (linea.q.y - linea.p.y) / largo;
              const alcance = ANCHO + ALTO;
              const p = linea.segmento ? linea.p : { x: linea.p.x - ux * alcance, y: linea.p.y - uy * alcance };
              const q = linea.segmento ? linea.q : { x: linea.q.x + ux * alcance, y: linea.q.y + uy * alcance };
              return (
                <path
                  key={objeto.id}
                  className={`trazo trazo-${linea.estilo}`}
                  d={`M ${p.x} ${p.y} L ${q.x} ${q.y}`}
                />
              );
            }
            if (objeto.tipo === 'circulo') {
              const circulo = resuelta.circulos.get(objeto.id);
              if (!circulo) return null;
              if (circulo.arco) {
                return (
                  <path
                    key={objeto.id}
                    className={`trazo trazo-${circulo.estilo}`}
                    d={descripcionArco(
                      {
                        tipo: 'arco',
                        cx: circulo.centro.x,
                        cy: circulo.centro.y,
                        radio: circulo.radio,
                        inicio: circulo.arco.desde,
                        fin: circulo.arco.hasta,
                        estilo: circulo.estilo,
                      },
                      1,
                    )}
                  />
                );
              }
              return (
                <circle
                  key={objeto.id}
                  className={`trazo trazo-${circulo.estilo}`}
                  cx={circulo.centro.x}
                  cy={circulo.centro.y}
                  r={circulo.radio}
                />
              );
            }
            return null;
          })}

          {arcoVivo && (
            <path
              className="arco-vivo"
              d={descripcionArco(
                {
                  tipo: 'arco',
                  cx: arcoVivo.cx,
                  cy: arcoVivo.cy,
                  radio: arcoVivo.radio,
                  inicio: arcoVivo.desde,
                  fin: arcoVivo.hasta,
                  estilo: 'construccion',
                },
                1,
              )}
            />
          )}

          {[...resuelta.puntos].map(([id, p]) => (
            <g key={id}>
              <circle
                className={`punto punto-${pendiente === id ? 'resultado' : 'dato'}`}
                cx={p.x}
                cy={p.y}
                r={pendiente === id ? 1.5 : 1.1}
              />
              <text className="rotulo" x={p.x + ROTULO.dx} y={p.y + ROTULO.dy} fontSize={ROTULO.tamano}>
                {id}
              </text>
            </g>
          ))}

          {herramienta && <Herramienta activa={herramienta} />}
          {imantadoVisible && (
            <circle
              className={imantadoVisible.tipo === 'punto' ? 'iman iman-punto' : 'iman iman-corte'}
              cx={imantadoVisible.x}
              cy={imantadoVisible.y}
              r={imantadoVisible.tipo === 'punto' ? 3.2 : 2.6}
            />
          )}
          {medida && (
            <text className="medida" x={medida.pos.x + 4} y={medida.pos.y - 4} fontSize={4}>
              {medida.texto}
            </text>
          )}
        </svg>
      </div>

      <div className="notas notas-izquierda">
        <aside className="postit postit-paso" aria-label="Herramientas">
          <p className="etiqueta">Herramientas</p>
          <div className="herramientas-taller">
            {UTILES.map(({ util: candidata, nombre }) => (
              <button
                key={candidata}
                type="button"
                className="boton"
                aria-pressed={util === candidata}
                onClick={() => elegirUtil(candidata)}
              >
                {nombre}
              </button>
            ))}
          </div>
        </aside>

        <aside key={util} className="postit postit-consejo" aria-live="polite">
          <p className="etiqueta">Cómo se usa</p>
          <p>{ayuda}</p>
        </aside>
      </div>

      <div className="notas notas-derecha">
        {util === 'regla' && (
          <aside className="postit postit-ajustes">
            <p className="etiqueta">La regla traza</p>
            <div className="ajustes-botones">
              <button type="button" className="boton" aria-pressed={tipoLinea === 'segmento'} onClick={() => setTipoLinea('segmento')}>
                Un segmento
              </button>
              <button type="button" className="boton" aria-pressed={tipoLinea === 'recta'} onClick={() => setTipoLinea('recta')}>
                Una recta
              </button>
            </div>
          </aside>
        )}

        <aside className="postit postit-ajustes">
          <p className="etiqueta">Lápiz</p>
          <div className="ajustes-botones">
            <button type="button" className="boton" aria-pressed={estilo === 'construccion'} onClick={() => setEstilo('construccion')}>
              2H · construcción
            </button>
            <button type="button" className="boton" aria-pressed={estilo === 'resultado'} onClick={() => setEstilo('resultado')}>
              HB · resultado
            </button>
          </div>
        </aside>

        {(pendiente || compas) && (
          <aside className="postit postit-datos">
            <p>
              {pendiente ? `Regla: toca otro punto para unirlo con ${pendiente}.` : 'Compás abierto: arrástralo para girarlo.'}
            </p>
            <button type="button" className="boton" onClick={soltarTodo}>
              Soltar
            </button>
          </aside>
        )}
      </div>

      <div className="barra" role="group" aria-label="Acciones del taller">
        <button type="button" className="boton" disabled={pila.pasado.length === 0} onClick={deshacer}>
          Deshacer
        </button>
        <button type="button" className="boton" disabled={pila.futuro.length === 0} onClick={rehacer}>
          Rehacer
        </button>
        <button type="button" className="boton" disabled={!hayObjetos} onClick={limpiar}>
          Limpiar lámina
        </button>
      </div>
    </section>
  );
}
