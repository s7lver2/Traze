import { describe, expect, it } from 'vitest';
import { trocearTexto } from '../src/reproductor/enlaces';

const IDS = ['A', 'B', 'M', 'N', 'O', "A'", 'PA', 'N1'];

const puntos = (texto: string) =>
  trocearTexto(texto, IDS)
    .filter((trozo) => trozo.puntos)
    .map((trozo) => [trozo.texto, trozo.puntos]);

describe('trocearTexto', () => {
  it('no cambia un texto sin puntos y lo deja entero', () => {
    const trozos = trocearTexto('Traza una recta cualquiera.', IDS);
    expect(trozos.map((trozo) => trozo.texto).join('')).toBe('Traza una recta cualquiera.');
    expect(trozos.every((trozo) => !trozo.puntos)).toBe(true);
  });

  it('reconoce un punto suelto', () => {
    expect(puntos('Une A con B con la regla.')).toEqual([
      ['A', ['A']],
      ['B', ['B']],
    ]);
  });

  it('reconoce un segmento como los dos puntos que lo forman', () => {
    expect(puntos('Abre el compás 0,75 × AB.')).toEqual([['AB', ['A', 'B']]]);
  });

  it('reconoce ids de varias letras, con cifras y con apóstrofo', () => {
    expect(puntos("Une PA con N1 y A'.")).toEqual([
      ['PA', ['PA']],
      ['N1', ['N1']],
      ["A'", ["A'"]],
    ]);
  });

  it('no confunde palabras con puntos', () => {
    expect(puntos('Pincha en el Mono de la Mano, sin Nada.')).toEqual([]);
  });

  it('una A que es la preposición al empezar una frase no es el punto A', () => {
    expect(puntos('A cada lado del segmento traza un arco.')).toEqual([]);
    expect(puntos('Traza el arco. A continuación, marca M.')).toEqual([['M', ['M']]]);
  });

  it('una A sola que es el punto sí lo es, aunque empiece la frase', () => {
    expect(puntos('A con B se une con la regla.')).toEqual([
      ['A', ['A']],
      ['B', ['B']],
    ]);
  });

  it('conserva todos los caracteres, en orden', () => {
    const texto = "Pincha en A y abre hasta B; luego AB, M (N1) y A'.";
    expect(trocearTexto(texto, IDS).map((trozo) => trozo.texto).join('')).toBe(texto);
  });

  it('no inventa puntos que no existen', () => {
    expect(puntos('Marca Z y la W.')).toEqual([]);
  });
});
