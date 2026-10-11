import { describe, expect, it } from 'vitest';
import {
  CLAVE_PROGRESO,
  estadoDe,
  leerProgreso,
  progresoVacio,
  registrar,
  resumir,
  serializar,
} from '../src/progreso';

const HOY = '2026-10-12';

describe('registrar', () => {
  it('anota una lección vista con su fecha', () => {
    const progreso = registrar(progresoVacio(), 'mediatriz-segmento', 'vista', HOY);
    expect(estadoDe(progreso, 'mediatriz-segmento')).toBe('vista');
    expect(progreso.lecciones['mediatriz-segmento']).toEqual({ estado: 'vista', fecha: HOY });
  });

  it('no modifica el progreso anterior', () => {
    const antes = progresoVacio();
    registrar(antes, 'a', 'vista', HOY);
    expect(antes.lecciones).toEqual({});
  });

  it('nunca baja de estado', () => {
    const practicada = registrar(progresoVacio(), 'a', 'practicada', HOY);
    const despues = registrar(practicada, 'a', 'vista', '2026-10-13');
    expect(despues).toBe(practicada);
    expect(estadoDe(despues, 'a')).toBe('practicada');
  });

  it('devuelve el mismo objeto si el estado no cambia', () => {
    const vista = registrar(progresoVacio(), 'a', 'vista', HOY);
    expect(registrar(vista, 'a', 'vista', '2026-10-13')).toBe(vista);
  });

  it('sube de estado y actualiza la fecha', () => {
    const vista = registrar(progresoVacio(), 'a', 'vista', HOY);
    const practicada = registrar(vista, 'a', 'practicada', '2026-10-13');
    expect(practicada.lecciones.a).toEqual({ estado: 'practicada', fecha: '2026-10-13' });
  });
});

describe('estadoDe y resumir', () => {
  it('da null para una lección sin registro, también con ids raros', () => {
    const progreso = registrar(progresoVacio(), 'a', 'vista', HOY);
    expect(estadoDe(progreso, 'b')).toBeNull();
    expect(estadoDe(progreso, 'toString')).toBeNull();
    expect(estadoDe(progreso, '__proto__')).toBeNull();
  });

  it('cuenta por estado solo las lecciones pedidas', () => {
    let progreso = registrar(progresoVacio(), 'a', 'vista', HOY);
    progreso = registrar(progreso, 'b', 'practicada', HOY);
    progreso = registrar(progreso, 'c', 'dominada', HOY);
    expect(resumir(progreso, ['a', 'b', 'x'])).toEqual({ vista: 1, practicada: 1, dominada: 0 });
  });
});

describe('leerProgreso', () => {
  const almacenCon = (valor: string | null) => ({ getItem: (clave: string) => (clave === CLAVE_PROGRESO ? valor : null) });

  it('lee lo que escribió serializar', () => {
    const progreso = registrar(progresoVacio(), 'a', 'vista', HOY);
    expect(leerProgreso(almacenCon(serializar(progreso)))).toEqual(progreso);
  });

  it('con el almacén vacío devuelve un progreso vacío', () => {
    expect(leerProgreso(almacenCon(null))).toEqual(progresoVacio());
  });

  it('con JSON corrupto devuelve un progreso vacío', () => {
    expect(leerProgreso(almacenCon('{no es json'))).toEqual(progresoVacio());
  });

  it('con una forma inesperada devuelve un progreso vacío', () => {
    for (const valor of [
      '[]',
      '"hola"',
      '{"version":2,"lecciones":{}}',
      '{"version":1,"lecciones":[]}',
      '{"version":1,"lecciones":{"a":{"estado":"genial","fecha":"hoy"}}}',
      '{"version":1,"lecciones":{"a":{"estado":"vista"}}}',
    ]) {
      expect(leerProgreso(almacenCon(valor)), valor).toEqual(progresoVacio());
    }
  });

  it('sin almacén (null) devuelve un progreso vacío', () => {
    expect(leerProgreso(null)).toEqual(progresoVacio());
  });

  it('si getItem lanza (almacenamiento bloqueado) devuelve un progreso vacío', () => {
    const bloqueado = {
      getItem: () => {
        throw new Error('SecurityError');
      },
    };
    expect(leerProgreso(bloqueado)).toEqual(progresoVacio());
  });
});
