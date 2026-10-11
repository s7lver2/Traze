export const MARCA_VOCABULARIO = 'VOCABULARIO_INSUFICIENTE';

export { BLOQUES_TEMARIO } from './bloques';

export interface EntradaVocabulario {
  tipo: string;
  campos: string;
  descripcion: string;
  ejemplo: unknown;
}

export interface CampoLeccion {
  nombre: string;
  obligatorio: boolean;
  descripcion: string;
}

export const CAMPOS_LECCION: readonly CampoLeccion[] = [
  {
    nombre: 'id',
    obligatorio: true,
    descripcion: 'Identificador en minúsculas y con guiones, por ejemplo «mediatriz-segmento».',
  },
  {
    nombre: 'bloque',
    obligatorio: true,
    descripcion: 'Número del bloque del temario, de 1 a 10 (tabla más abajo).',
  },
  {
    nombre: 'titulo',
    obligatorio: true,
    descripcion: 'Título corto de la lección, por ejemplo «Mediatriz de un segmento».',
  },
  {
    nombre: 'enunciado',
    obligatorio: true,
    descripcion: 'Qué datos hay y qué se pide, en una o dos frases.',
  },
  {
    nombre: 'ideaClave',
    obligatorio: true,
    descripcion: 'La propiedad geométrica que sostiene el trazado, en una línea.',
  },
  {
    nombre: 'requisitos',
    obligatorio: false,
    descripcion: 'Lista de ids de lecciones previas que ya existan; [] si no hay ninguna.',
  },
  {
    nombre: 'lienzo',
    obligatorio: false,
    descripcion: '{ "ancho": 210, "alto": 140 } en milímetros. No lo cambies sin necesidad.',
  },
  {
    nombre: 'datos',
    obligatorio: true,
    descripcion:
      'Puntos de partida, por ejemplo { "A": [60, 70] }, en milímetros. Son las únicas coordenadas de la lección.',
  },
  {
    nombre: 'radios',
    obligatorio: false,
    descripcion:
      'Aberturas de compás. Relativa a dos datos: { "r": { "entre": ["A", "B"], "factor": 0.75 } }, vale factor × distancia(A, B). Fija: { "s": { "mm": 30 } }. Solo pueden usar puntos de «datos»; para un radio que depende de puntos calculados usa el derivado «radio». Opcional en los relativos: "deslizador": { "min": 0.55, "max": 0.85 }, solo si cualquier valor del rango da una construcción válida (por ejemplo, para cortar dos arcos hace falta un radio mayor que la mitad de la distancia entre los centros).',
  },
  {
    nombre: 'derivados',
    obligatorio: false,
    descripcion:
      'Puntos que calcula el programa, en orden: cada uno solo puede usar puntos ya definidos en «datos» o en derivados anteriores.',
  },
  {
    nombre: 'pasos',
    obligatorio: true,
    descripcion:
      'De 6 a 10 pasos. Cada paso lleva «titulo», «texto», «porque», «consejo» y «dibujo» (lista de primitivas).',
  },
  {
    nombre: 'errores',
    obligatorio: false,
    descripcion: 'Errores frecuentes del alumno: 2 o 3 frases concretas.',
  },
  {
    nombre: 'comprobaciones',
    obligatorio: true,
    descripcion: 'Al menos 2 propiedades que el programa verifica numéricamente.',
  },
];

export const PRIMITIVAS: readonly EntradaVocabulario[] = [
  {
    tipo: 'punto',
    campos: 'id, etiqueta (opcional), estilo (opcional; por defecto «dato»)',
    descripcion:
      'Dibuja un punto ya definido (en «datos» o en «derivados») y rotula su letra. Si omites «etiqueta», se usa el id.',
    ejemplo: { tipo: 'punto', id: 'A' },
  },
  {
    tipo: 'segmento',
    campos: 'desde, hasta, estilo (opcional; por defecto «dato»)',
    descripcion: 'Dibuja el segmento entre dos puntos.',
    ejemplo: { tipo: 'segmento', desde: 'A', hasta: 'B', estilo: 'dato' },
  },
  {
    tipo: 'recta',
    campos: 'por [P, Q], extension (opcional, mm), estilo (opcional; por defecto «resultado»)',
    descripcion:
      'Dibuja la recta que pasa por dos puntos. «extension» son los milímetros que se prolonga por cada extremo.',
    ejemplo: { tipo: 'recta', por: ['M', 'N'], extension: 8, estilo: 'resultado' },
  },
  {
    tipo: 'arco',
    campos:
      'centro, radio (id de un radio), hacia (punto), amplitud (opcional, radianes), estilo (opcional; por defecto «construccion»)',
    descripcion:
      'Arco de compás con centro en un punto y el radio indicado. «hacia» debe estar exactamente a esa distancia del centro: el arco se dibuja alrededor de ese punto, con «amplitud» radianes a cada lado (por defecto 0.32).',
    ejemplo: { tipo: 'arco', centro: 'A', radio: 'r', hacia: 'M' },
  },
  {
    tipo: 'arcoEntre',
    campos: 'centro, desde, hasta, pasaPor (opcional), estilo (opcional; por defecto «construccion»)',
    descripcion:
      'Arco de circunferencia con ese centro que va del punto «desde» al punto «hasta», que deben estar a la misma distancia del centro. Por defecto es el arco corto. Para el arco largo, y siempre en una media circunferencia, indica «pasaPor» con un punto ya definido que esté en el arco que quieres. Úsalo para enlaces, óvalos, arcos capaces y circunferencias completas por tramos.',
    ejemplo: { tipo: 'arcoEntre', centro: 'O', desde: 'A', hasta: 'B', pasaPor: 'P', estilo: 'resultado' },
  },
  {
    tipo: 'marcaAnguloRecto',
    campos: 'vertice, hacia1, hacia2',
    descripcion:
      'Cuadradito de ángulo recto en el vértice, entre las direcciones hacia dos puntos.',
    ejemplo: { tipo: 'marcaAnguloRecto', vertice: 'O', hacia1: 'B', hacia2: 'M' },
  },
  {
    tipo: 'marcaIgualdad',
    campos: 'segmento [P, Q]',
    descripcion:
      'Pequeña marca transversal en el punto medio de un segmento. Dos segmentos con la marca se leen como iguales.',
    ejemplo: { tipo: 'marcaIgualdad', segmento: ['A', 'O'] },
  },
];

export const DERIVADOS: readonly EntradaVocabulario[] = [
  {
    tipo: 'puntoMedio',
    campos: 'id, entre [P, Q]',
    descripcion: 'Crea el punto medio del segmento PQ.',
    ejemplo: { tipo: 'puntoMedio', id: 'O', entre: ['A', 'B'] },
  },
  {
    tipo: 'interseccionArcos',
    campos: 'ids [M, N], centros [P, Q], radio (id de un radio)',
    descripcion:
      'Crea los dos puntos donde se cortan los arcos de ese radio con centro en P y en Q. El primero (M) queda a la izquierda al mirar de P a Q en pantalla y el segundo (N) a la derecha. Si el radio no es mayor que la mitad de PQ, la construcción es imposible.',
    ejemplo: { tipo: 'interseccionArcos', ids: ['M', 'N'], centros: ['A', 'B'], radio: 'r' },
  },
  {
    tipo: 'radio',
    campos: 'id, entre [P, Q], factor',
    descripcion:
      'Define un radio que vale factor × distancia(P, Q), con P y Q ya definidos (datos o derivados anteriores). Úsalo cuando la abertura del compás depende de un punto calculado.',
    ejemplo: { tipo: 'radio', id: 't', entre: ['M', 'N'], factor: 0.5 },
  },
  {
    tipo: 'puntoEnDireccion',
    campos:
      'id, origen, direccion [P, Q], radio (id de un radio), perpendicular (opcional; por defecto false), sentido (opcional; 1 o -1; por defecto 1)',
    descripcion:
      'Crea el punto que está a la distancia del radio desde el origen, en la dirección de P a Q (con sentido -1, al revés). Con perpendicular: true, en la dirección perpendicular, hacia la izquierda de P→Q en pantalla (arriba si P→Q va hacia la derecha). Sirve para llevar la abertura del compás sobre una recta, para trazar paralelas (otra dirección, otro origen) y perpendiculares.',
    ejemplo: {
      tipo: 'puntoEnDireccion',
      id: 'D',
      origen: 'C',
      direccion: ['C', 'E'],
      radio: 'r',
      perpendicular: false,
      sentido: 1,
    },
  },
  {
    tipo: 'pie',
    campos: 'id, punto, recta [P, Q]',
    descripcion: 'Crea el pie de la perpendicular trazada desde «punto» a la recta PQ.',
    ejemplo: { tipo: 'pie', id: 'F', punto: 'C', recta: ['A', 'B'] },
  },
  {
    tipo: 'simetrico',
    campos: 'id, punto, eje [P, Q]',
    descripcion: 'Crea el simétrico de «punto» respecto del eje PQ.',
    ejemplo: { tipo: 'simetrico', id: "C'", punto: 'C', eje: ['A', 'B'] },
  },
  {
    tipo: 'homotetico',
    campos: 'id, punto, centro, razon (número distinto de 0; negativo invierte)',
    descripcion: 'Crea el homotético de «punto» con el centro y la razón dados.',
    ejemplo: { tipo: 'homotetico', id: "A'", punto: 'A', centro: 'O', razon: 2 },
  },
  {
    tipo: 'interseccionRectas',
    campos: 'id, rectas [[P, Q], [R, S]]',
    descripcion:
      'Crea el punto donde se cortan las rectas PQ y RS. Si son paralelas o coinciden, la construcción es imposible.',
    ejemplo: { tipo: 'interseccionRectas', id: 'X', rectas: [['A', 'B'], ['C', 'D']] },
  },
  {
    tipo: 'interseccionRectaArco',
    campos: 'ids [X, Y], recta [P, Q], centro, radio (id de un radio)',
    descripcion:
      'Crea los dos puntos donde la recta PQ corta a la circunferencia con ese centro y ese radio. X es el que se encuentra primero al recorrer la recta de P a Q. Si no la corta en dos puntos (o la toca en uno), la construcción es imposible.',
    ejemplo: {
      tipo: 'interseccionRectaArco',
      ids: ['X', 'Y'],
      recta: ['A', 'B'],
      centro: 'C',
      radio: 'r',
    },
  },
  {
    tipo: 'cortesCirculos',
    campos: 'ids [X, Y], centros [P, Q], radios [r1, r2] (ids de radios)',
    descripcion:
      'Crea los dos puntos donde se cortan las circunferencias de centro P y radio r1 y de centro Q y radio r2 (pueden ser radios distintos). X queda a la izquierda al mirar de P a Q en pantalla e Y a la derecha. Si no se cortan en dos puntos (o son tangentes), la construcción es imposible.',
    ejemplo: {
      tipo: 'cortesCirculos',
      ids: ['X', 'Y'],
      centros: ['A', 'B'],
      radios: ['r', 'r'],
    },
  },
];

export const COMPROBACIONES: readonly EntradaVocabulario[] = [
  {
    tipo: 'equidistante',
    campos: 'punto, a, b',
    descripcion: 'Comprueba que «punto» está a la misma distancia de «a» que de «b».',
    ejemplo: { tipo: 'equidistante', punto: 'M', a: 'A', b: 'B' },
  },
  {
    tipo: 'perpendicular',
    campos: 'recta [P, Q], segmento [A, B]',
    descripcion: 'Comprueba que la recta PQ es perpendicular al segmento AB.',
    ejemplo: { tipo: 'perpendicular', recta: ['M', 'N'], segmento: ['A', 'B'] },
  },
  {
    tipo: 'pasaPorPuntoMedio',
    campos: 'recta [P, Q], segmento [A, B]',
    descripcion: 'Comprueba que la recta PQ pasa por el punto medio del segmento AB.',
    ejemplo: { tipo: 'pasaPorPuntoMedio', recta: ['M', 'N'], segmento: ['A', 'B'] },
  },
  {
    tipo: 'tangente',
    campos: 'recta [P, Q], centro, punto',
    descripcion:
      'Comprueba que la recta PQ es tangente en «punto» a la circunferencia de ese centro que pasa por «punto»: «punto» está en la recta y el radio es perpendicular a ella.',
    ejemplo: { tipo: 'tangente', recta: ['P', 'T'], centro: 'C', punto: 'T' },
  },
  {
    tipo: 'puntoEnCircunferencia',
    campos: 'punto, centro, radio (id de un radio)',
    descripcion: 'Comprueba que «punto» está a la distancia del radio del centro.',
    ejemplo: { tipo: 'puntoEnCircunferencia', punto: 'T', centro: 'C', radio: 'r' },
  },
  {
    tipo: 'igualLongitud',
    campos: 'segmentos [[P, Q], [R, S]]',
    descripcion: 'Comprueba que los segmentos PQ y RS miden lo mismo.',
    ejemplo: { tipo: 'igualLongitud', segmentos: [['A', 'O'], ['O', 'B']] },
  },
  {
    tipo: 'proporcion',
    campos: 'a [P, Q], b [R, S], c [T, U], d [V, W]',
    descripcion: 'Comprueba la proporción PQ/RS = TU/VW (los cuatro segmentos con longitud mayor que cero en los denominadores).',
    ejemplo: { tipo: 'proporcion', a: ['O', 'A'], b: ['O', 'B'], c: ['O', 'C'], d: ['O', 'X'] },
  },
  {
    tipo: 'colineales',
    campos: 'puntos [P, Q, R]',
    descripcion: 'Comprueba que los tres puntos están alineados. P y Q no pueden coincidir.',
    ejemplo: { tipo: 'colineales', puntos: ['M', 'N', 'P'] },
  },
  {
    tipo: 'paralelas',
    campos: 'rectas [[P, Q], [R, S]]',
    descripcion: 'Comprueba que las rectas PQ y RS son paralelas.',
    ejemplo: { tipo: 'paralelas', rectas: [['A', 'B'], ['P', 'Q']] },
  },
  {
    tipo: 'angulo',
    campos: 'vertice, a, b, grados (de 0 a 180)',
    descripcion: 'Comprueba que el ángulo con vértice en «vertice» y lados hacia «a» y «b» mide esos grados.',
    ejemplo: { tipo: 'angulo', vertice: 'B', a: 'A', b: 'C', grados: 120 },
  },
  {
    tipo: 'igualAngulo',
    campos: 'angulos [[a1, vertice1, b1], [a2, vertice2, b2]]',
    descripcion:
      'Comprueba que los dos ángulos miden lo mismo. Cada ángulo se escribe como [punto de un lado, vértice, punto del otro lado].',
    ejemplo: { tipo: 'igualAngulo', angulos: [['P', 'V', 'Z'], ['Z', 'V', 'Q']] },
  },
];