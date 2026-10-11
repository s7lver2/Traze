export const MARCA_VOCABULARIO = 'VOCABULARIO_INSUFICIENTE';

export const BLOQUES_TEMARIO = [
  'Primeros pasos',
  'Trazados fundamentales',
  'Polígonos',
  'Proporcionalidad y escalas',
  'Transformaciones',
  'Tangencias y enlaces',
  'Curvas técnicas y cónicas',
  'Sistema diédrico',
  'Axonometría y caballera',
  'Normalización',
] as const;

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
    descripcion: 'Número del bloque del temario, de 0 a 9 (tabla más abajo).',
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
];