import { describe, expect, it } from 'vitest';
import { listarContenido } from '../src/almacen';
import { leccionSchema, type Leccion } from '../src/esquema';
import { interpretarLeccion } from '../src/interpretar';
import { generarProblema } from '../src/problemas';
import {
  ABERTURA_INICIAL_MM,
  accionActual,
  clic,
  construido,
  crearEstado,
  crearReto,
  elegirInstrumento,
  fijarAbertura,
  guiaDeAbertura,
  instruccion,
  instrumentoDe,
  pedirPista,
  resaltados,
  resumen,
  trazarArco,
  type AccionReto,
  type EstadoReto,
  type NivelReto,
  type Reto,
} from '../src/reto';

const lecciones: Leccion[] = listarContenido().flatMap(({ datos }) => {
  const resultado = leccionSchema.safeParse(datos);
  return resultado.success ? [resultado.data] : [];
});

const NIVELES: NivelReto[] = ['guiado', 'memoria', 'examen'];

function retoDe(leccion: Leccion): Reto {
  return crearReto(leccion, interpretarLeccion(leccion));
}

/** Hace una acción sin equivocarse y devuelve el estado resultante. */
function jugarAccion(estado: EstadoReto, reto: Reto, accion: AccionReto): EstadoReto {
  let siguiente = elegirInstrumento(estado, instrumentoDe(accion));
  switch (accion.tipo) {
    case 'regla':
      siguiente = clic(siguiente, reto, accion.desde).estado;
      siguiente = clic(siguiente, reto, accion.hasta).estado;
      break;
    case 'compas':
      siguiente = clic(siguiente, reto, accion.centro).estado;
      siguiente = fijarAbertura(siguiente, accion.abertura);
      siguiente = trazarArco(siguiente, reto).estado;
      break;
    case 'compasEntre':
      for (const punto of [accion.centro, accion.desde, accion.hasta]) {
        siguiente = clic(siguiente, reto, punto).estado;
      }
      break;
    case 'marcar':
      siguiente = clic(siguiente, reto, accion.punto).estado;
      break;
  }
  return siguiente;
}

/** Juega la lámina sin equivocarse y devuelve el estado final. */
function jugarPerfecto(reto: Reto, nivel: NivelReto): EstadoReto {
  let estado = crearEstado(reto, nivel);
  for (let vuelta = 0; !estado.terminado && vuelta < 2000; vuelta++) {
    const accion = accionActual(reto, estado);
    if (!accion) break;
    estado = jugarAccion(estado, reto, accion);
  }
  return estado;
}

describe('con las lecciones reales', () => {
  it.each(lecciones.map((leccion) => [leccion.id, leccion] as const))(
    '%s: se puede completar con acciones exactas en los tres niveles',
    (_id, leccion) => {
      const reto = retoDe(leccion);
      for (const nivel of NIVELES) {
        const estado = jugarPerfecto(reto, nivel);
        expect(estado.terminado, nivel).toBe(true);
        expect(estado.errores, nivel).toBe(0);
        expect(construido(estado, reto).flat().length, nivel).toBe(reto.dibujos.flat().length);
      }
    },
  );

  it.each(lecciones.map((leccion) => [leccion.id, leccion] as const))(
    '%s: también con un problema generado',
    (_id, leccion) => {
      const problema = generarProblema(leccion, 5);
      expect(problema).not.toBeNull();
      if (!problema) return;
      const reto = crearReto(problema.leccion, problema.resuelta);
      expect(jugarPerfecto(reto, 'examen').terminado).toBe(true);
    },
  );
});

describe('reglas del reto (lección piloto)', () => {
  const piloto = lecciones.find((leccion) => leccion.id === 'mediatriz-segmento')!;
  const reto = retoDe(piloto);

  it('empieza en un paso que pide alguna acción', () => {
    const estado = crearEstado(reto, 'guiado');
    expect(accionActual(reto, estado)).not.toBeNull();
  });

  it('en el nivel guiado pone el instrumento y señala el punto; en los demás, no', () => {
    const guiado = crearEstado(reto, 'guiado');
    const accion = accionActual(reto, guiado)!;
    expect(guiado.instrumento).toBe(instrumentoDe(accion));
    expect(resaltados(guiado, reto).length).toBeGreaterThan(0);

    const memoria = crearEstado(reto, 'memoria');
    expect(memoria.instrumento).toBe(instrumentoDe(accionActual(reto, memoria)!));
    expect(resaltados(memoria, reto)).toEqual([]);
  });

  it('con el instrumento equivocado cuenta un error y no avanza', () => {
    let estado = crearEstado(reto, 'memoria');
    const accion = accionActual(reto, estado)!;
    const equivocado = instrumentoDe(accion) === 'regla' ? 'compas' : 'regla';
    estado = elegirInstrumento(estado, equivocado);
    const punto =
      accion.tipo === 'marcar' ? accion.punto : accion.tipo === 'regla' ? accion.desde : accion.centro;
    const resultado = clic(estado, reto, punto);
    expect(resultado.evento).toBe('error');
    expect(resultado.estado.errores).toBe(1);
    expect(accionActual(reto, resultado.estado)).toBe(accion);
  });

  it('sin instrumento en la mano avisa sin contar error', () => {
    const estado = { ...crearEstado(reto, 'memoria'), instrumento: null };
    const resultado = clic(estado, reto, { x: 0, y: 0 });
    expect(resultado.evento).toBe('nada');
    expect(resultado.estado.errores).toBe(0);
    expect(resultado.estado.mensaje?.tipo).toBe('info');
  });

  it('un clic en un hueco no cuenta como error', () => {
    const estado = crearEstado(reto, 'guiado');
    expect(clic(estado, reto, { x: -500, y: -500 }).estado.errores).toBe(0);
  });

  it('un clic en otro punto del dibujo sí cuenta como error', () => {
    const estado = crearEstado(reto, 'guiado');
    const accion = accionActual(reto, estado)!;
    const esperados =
      accion.tipo === 'marcar'
        ? [accion.punto]
        : accion.tipo === 'regla'
          ? [accion.desde, accion.hasta]
          : [accion.centro];
    const otro = reto.puntos.find((punto) =>
      esperados.every((esperado) => Math.hypot(esperado.x - punto.x, esperado.y - punto.y) > 10),
    );
    expect(otro).toBeDefined();
    const resultado = clic(estado, reto, otro!);
    expect(resultado.evento).toBe('error');
    expect(resultado.estado.errores).toBe(1);
  });

  it('una abertura de compás equivocada es un error y la correcta avanza', () => {
    const conCompas = lecciones.find((leccion) =>
      leccion.pasos.some((paso) => paso.dibujo.some((primitiva) => primitiva.tipo === 'arco')),
    )!;
    const retoCompas = retoDe(conCompas);
    let estado = crearEstado(retoCompas, 'guiado');
    for (let vuelta = 0; vuelta < 500 && !estado.terminado; vuelta++) {
      const accion = accionActual(retoCompas, estado)!;
      if (accion.tipo === 'compas') {
        estado = clic(estado, retoCompas, accion.centro).estado;
        estado = fijarAbertura(estado, accion.abertura * 1.5);
        const mala = trazarArco(estado, retoCompas);
        expect(mala.evento).toBe('error');
        expect(mala.estado.errores).toBe(1);
        expect(mala.estado.mensaje?.texto).toContain('demasiado abierto');
        const buena = trazarArco(fijarAbertura(mala.estado, accion.abertura), retoCompas);
        expect(['completada', 'paso', 'fin']).toContain(buena.evento);
        return;
      }
      estado = jugarAccion(estado, retoCompas, accion);
    }
    throw new Error('no se encontró ningún arco');
  });

  it('el compás se abre pinchando a la distancia: bien avanza, mal es un error', () => {
    const conCompas = lecciones.find((leccion) =>
      leccion.pasos.some((paso) => paso.dibujo.some((primitiva) => primitiva.tipo === 'arco')),
    )!;
    const retoCompas = retoDe(conCompas);
    let estado = crearEstado(retoCompas, 'guiado');
    for (let vuelta = 0; vuelta < 500 && !estado.terminado; vuelta++) {
      const accion = accionActual(retoCompas, estado)!;
      if (accion.tipo === 'compas') {
        estado = clic(estado, retoCompas, accion.centro).estado;
        expect(guiaDeAbertura(estado, retoCompas)).toEqual({ centro: accion.centro, radio: accion.abertura });
        const corto = clic(estado, retoCompas, { x: accion.centro.x + accion.abertura * 0.5, y: accion.centro.y });
        expect(corto.evento).toBe('error');
        expect(corto.estado.mensaje?.texto).toContain('demasiado cerrado');
        const bueno = clic(corto.estado, retoCompas, { x: accion.centro.x, y: accion.centro.y + accion.abertura });
        expect(['completada', 'paso', 'fin']).toContain(bueno.evento);
        return;
      }
      estado = jugarAccion(estado, retoCompas, accion);
    }
    throw new Error('no se encontró ningún arco');
  });

  it('la guía de abertura solo se ve en guiado o con pista', () => {
    const conCompas = lecciones.find((leccion) =>
      leccion.pasos.some((paso) => paso.dibujo.some((primitiva) => primitiva.tipo === 'arco')),
    )!;
    const retoCompas = retoDe(conCompas);
    let estado = crearEstado(retoCompas, 'memoria');
    for (let vuelta = 0; vuelta < 500; vuelta++) {
      const accion = accionActual(retoCompas, estado)!;
      if (accion.tipo === 'compas') {
        estado = clic(estado, retoCompas, accion.centro).estado;
        expect(guiaDeAbertura(estado, retoCompas)).toBeNull();
        expect(guiaDeAbertura(pedirPista(estado), retoCompas)).not.toBeNull();
        return;
      }
      estado = jugarAccion(estado, retoCompas, accion);
    }
    throw new Error('no se encontró ningún arco');
  });

  it('en memoria y examen la pista se pide y se cuenta; en guiado no cuesta', () => {
    const memoria = pedirPista(crearEstado(reto, 'memoria'));
    expect(memoria.pistas).toBe(1);
    expect(resaltados(memoria, reto).length).toBeGreaterThan(0);
    expect(pedirPista(memoria).pistas).toBe(1);
    expect(pedirPista(crearEstado(reto, 'guiado')).pistas).toBe(0);
  });

  it('la instrucción depende del nivel', () => {
    const guiado = crearEstado(reto, 'guiado');
    expect(instruccion(guiado, reto)).toBe(accionActual(reto, guiado)!.texto);
    expect(instruccion(crearEstado(reto, 'examen'), reto)).toMatch(/^Paso \d+ de \d+$/);
  });

  it('el resumen premia hacerlo sin ayuda y sin fallos', () => {
    const limpio = jugarPerfecto(reto, 'examen');
    expect(resumen(limpio)).toMatchObject({ nivel: 'examen', progreso: 'dominada' });
    expect(resumen(jugarPerfecto(reto, 'guiado')).progreso).toBe('practicada');
    expect(resumen({ ...limpio, errores: 1 }).progreso).toBe('practicada');
    expect(resumen({ ...limpio, pistas: 1 }).progreso).toBe('practicada');
  });

  it('la abertura inicial no revela la respuesta', () => {
    expect(crearEstado(reto, 'examen').abertura).toBe(ABERTURA_INICIAL_MM);
  });

  it('los puntos que se marcan seguidos se aceptan en cualquier orden', () => {
    let estado = crearEstado(reto, 'memoria');
    for (let vuelta = 0; vuelta < 200 && !estado.terminado; vuelta++) {
      const accion = accionActual(reto, estado)!;
      const paso = reto.pasos[estado.paso];
      const siguientes = estado.orden.slice(estado.accion).map((k) => paso.acciones[k]);
      if (accion.tipo === 'marcar' && siguientes.length >= 2 && siguientes[1].tipo === 'marcar') {
        const preparado = elegirInstrumento(estado, 'lapiz');
        const resultado = clic(preparado, reto, siguientes[1].punto);
        expect(resultado.estado.errores).toBe(0);
        expect(resultado.evento).not.toBe('error');
        return;
      }
      estado = jugarAccion(estado, reto, accion);
    }
    throw new Error('la lección no tiene dos puntos seguidos que marcar');
  });
});
