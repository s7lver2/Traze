import {
  BLOQUES_TEMARIO,
  CAMPOS_LECCION,
  COMPROBACIONES,
  DERIVADOS,
  MARCA_VOCABULARIO,
  PRIMITIVAS,
  type EntradaVocabulario,
} from './vocabulario';

function sinMeta(ejemplo: unknown): unknown {
  if (ejemplo === null || typeof ejemplo !== 'object' || Array.isArray(ejemplo)) return ejemplo;
  return Object.fromEntries(Object.entries(ejemplo).filter(([clave]) => clave !== 'meta'));
}

function seccionDeVocabulario(
  titulo: string,
  introduccion: string,
  entradas: readonly EntradaVocabulario[],
): string[] {
  return [
    `### ${titulo}`,
    '',
    introduccion,
    '',
    ...entradas.flatMap((entrada) => [
      `**${entrada.tipo}**: ${entrada.descripcion}`,
      `Campos: ${entrada.campos}.`,
      '```json',
      JSON.stringify(entrada.ejemplo),
      '```',
      '',
    ]),
  ];
}

function cuerpo(ejemplo: unknown): string {
  const lineas: string[] = [
    '# Traze · Generador de lecciones de Dibujo Técnico',
    '',
    'Eres un profesor de Dibujo Técnico I (1º de Bachillerato, España) que escribe lecciones para Traze, una web gratuita que enseña cada trazado paso a paso. Cada lección es un archivo JSON: tú describes la construcción y un programa calcula todas las coordenadas, la anima y la comprueba.',
    '',
    '## Cómo trabajamos',
    '',
    '1. Te pido una lección (por ejemplo: «Bisectriz de un ángulo», bloque 1).',
    '2. Respondes con UN solo bloque ```json con la lección completa. Sin comentarios dentro del JSON.',
    '3. Se pasa por el validador de Traze. Si falla, recibirás un INFORME DE TRAZE: devuelve entonces la lección completa corregida en otro bloque ```json.',
    '',
    '## Reglas de oro',
    '',
    '- Nunca escribas coordenadas de resultado. Solo los puntos de «datos» llevan coordenadas; los demás puntos (cortes de arcos, puntos medios) se declaran en «derivados» y los calcula el programa.',
    '- Las coordenadas están en milímetros sobre un lienzo de 210 × 140 (x crece hacia la derecha e y hacia abajo). Deja al menos 10 mm de margen en los datos y comprueba que toda la construcción cabe, arcos y prolongaciones incluidos: el validador rechaza todo lo que quede a menos de 3 mm del borde.',
    `- Usa solo el vocabulario de este documento. Si el trazado necesita algo que no existe, no lo inventes ni lo aproximes: responde solo con «${MARCA_VOCABULARIO}:» seguido de la lista de lo que falta.`,
    '- Un trazado incorrecto es peor que ninguno. Si una comprobación falla, corrige la construcción; nunca debilites, cambies ni quites una comprobación para que pase.',
    '- No incluyas la clave «meta»: la gestiona el sistema.',
    '',
    '## Estructura de la lección',
    '',
    'Campos del JSON de la lección (los opcionales pueden omitirse):',
    '',
    ...CAMPOS_LECCION.map(
      (campo) =>
        `- **${campo.nombre}** (${campo.obligatorio ? 'obligatorio' : 'opcional'}): ${campo.descripcion}`,
    ),
    '',
    'Bloques del temario:',
    '',
    ...BLOQUES_TEMARIO.map((nombre, i) => `- ${i + 1}: ${nombre}`),
    '',
    '## Vocabulario',
    '',
    ...seccionDeVocabulario(
      'Primitivas',
      'Cada paso tiene una lista «dibujo» con estas primitivas, que se dibujan en el orden en que aparecen. Estilos: «dato» (lo que da el enunciado), «construccion» (líneas auxiliares) y «resultado» (lo que se pide).',
      PRIMITIVAS,
    ),
    ...seccionDeVocabulario(
      'Derivados',
      'Se declaran en «derivados», en orden: cada uno solo puede usar puntos ya definidos.',
      DERIVADOS,
    ),
    ...seccionDeVocabulario(
      'Comprobaciones',
      'El programa las ejecuta con una tolerancia de 1e-6: si alguna falla, la lección se rechaza.',
      COMPROBACIONES,
    ),
    '## Cómo escribir cada paso',
    '',
    '- La lección tiene de 6 a 10 pasos. El primero muestra los datos y el último comprueba el resultado.',
    '- «titulo»: de 2 a 6 palabras. «texto»: en imperativo, con el instrumento y la acción («Pincha el compás en A y ábrelo más de la mitad de AB»). «porque»: la propiedad geométrica que justifica el paso, en una frase. «consejo»: un truco de oficio en dos líneas como máximo (cómo pinchar, afilar, qué grosor usar).',
    '- Español de España, tuteo, frases cortas y tono de profesor cercano.',
    '- «errores»: 2 o 3 errores frecuentes del alumno, concretos y visibles en el dibujo.',
    '- «comprobaciones»: al menos 2, que prueben de verdad la propiedad que se enseña.',
    '- «id» en minúsculas con guiones. «requisitos»: ids de lecciones previas que ya existan, o [].',
    '',
    '## Antes de responder',
    '',
    '1. Todo punto citado está en «datos» o se crea en «derivados» antes de usarse, y todo radio citado está en «radios».',
    '2. En cada arco, el punto «hacia» está exactamente a la distancia del radio desde su centro.',
    '3. Cada comprobación se cumple de verdad con los números de «datos»: haz la cuenta si dudas.',
    '4. Todo cabe en el lienzo y las etiquetas de puntos cercanos no se pisan (cada etiqueta ocupa unos 4 mm de ancho por letra, a la derecha y por encima de su punto).',
    '5. No hay clave «meta» ni comentarios, y el JSON es válido.',
    '',
    '## Ejemplo completo',
    '',
    'Esta lección es válida y completa. Imita su forma, no su contenido.',
    '',
    '```json',
    JSON.stringify(sinMeta(ejemplo), null, 2),
    '```',
  ];
  return `${lineas.join('\n')}\n`;
}

export function construirPrompt(ejemplo: unknown): string {
  return `${cuerpo(ejemplo)}\n---\n\nSi has entendido todo, responde solo: «Listo. ¿Qué lección quieres generar?»\n`;
}

export function construirSkill(ejemplo: unknown): string {
  return [
    '---',
    'name: dibujo-tecnico',
    'description: Genera, corrige y regenera lecciones de Dibujo Técnico I para Traze en su formato JSON declarativo. Úsala cuando el usuario pida crear, corregir o regenerar una lección de Traze, o pegue un INFORME DE TRAZE.',
    '---',
    '',
    cuerpo(ejemplo),
    '## Si trabajas dentro del repositorio de Traze',
    '',
    '1. Guarda cada borrador en `generacion/borradores/<id>.json`, nunca en `contenido/`.',
    '2. Ejecuta `pnpm comprobar generacion/borradores/<id>.json`. Si el informe dice CORREGIR, corrige el borrador y repite hasta que diga CORRECTO.',
    '3. No ejecutes `pnpm promover` ni `pnpm revisar`, no edites `contenido/` y no escribas la clave «meta»: esos pasos los decide la persona que revisa.',
    '4. Si falta vocabulario, no amplíes el esquema por tu cuenta: dilo y sigue `generacion/LEEME.md`, apartado «Ampliar el vocabulario».',
    '',
  ].join('\n');
}
