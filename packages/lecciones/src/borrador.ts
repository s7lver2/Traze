import type { Leccion } from './esquema';
import { extraerJson } from './extraer';
import { procesarLeccion } from './procesar';
import { MARCA_VOCABULARIO } from './vocabulario';

export interface ContextoBorrador {
  idsExistentes: readonly string[];
}

export interface InformeBorrador {
  id: string | null;
  errores: string[];
  avisos: string[];
  datos: Record<string, unknown> | null;
  leccion: Leccion | null;
}

export function avisosDeLeccion(leccion: Leccion, contexto: ContextoBorrador): string[] {
  const avisos: string[] = [];

  if (leccion.pasos.length < 6) {
    avisos.push(`pasos: la lección tiene ${leccion.pasos.length}; lo habitual son de 6 a 10`);
  }
  leccion.pasos.forEach((paso, i) => {
    if (!paso.consejo) avisos.push(`pasos.${i}.consejo: falta el consejo de este paso`);
  });
  if (leccion.errores.length < 2 || leccion.errores.length > 3) {
    avisos.push(`errores: la lección lista ${leccion.errores.length}; lo habitual son 2 o 3`);
  }
  if (leccion.comprobaciones.length < 2) {
    avisos.push(
      `comprobaciones: solo hay ${leccion.comprobaciones.length}; conviene comprobar al menos 2 propiedades`,
    );
  }
  const conocidos = new Set(contexto.idsExistentes);
  leccion.requisitos.forEach((requisito, i) => {
    if (!conocidos.has(requisito)) {
      avisos.push(`requisitos.${i}: «${requisito}» no existe todavía en contenido/`);
    }
  });

  return avisos;
}

export function comprobarBorrador(texto: string, contexto: ContextoBorrador): InformeBorrador {
  const sinNada: Omit<InformeBorrador, 'errores'> = {
    id: null,
    avisos: [],
    datos: null,
    leccion: null,
  };

  const extraccion = extraerJson(texto);
  if (!extraccion.ok) {
    const indice = texto.indexOf(MARCA_VOCABULARIO);
    if (indice !== -1) {
      const detalle = texto
        .slice(indice + MARCA_VOCABULARIO.length)
        .replace(/^[:\s]+/, '')
        .trim()
        .slice(0, 400);
      return {
        ...sinNada,
        errores: [
          `vocabulario: Claude indica que el vocabulario no alcanza para esta lección${detalle ? ` (${detalle})` : ''}`,
        ],
      };
    }
    return { ...sinNada, errores: [`json: ${extraccion.error}`] };
  }

  const datos = extraccion.datos;
  const errores: string[] = [];
  if (Object.hasOwn(datos, 'meta')) {
    errores.push('meta: la gestiona el sistema; elimina esta clave');
  }

  const proceso = procesarLeccion(datos);
  if (!proceso.ok) errores.push(...proceso.errores);

  return {
    id: typeof datos.id === 'string' ? datos.id : null,
    errores,
    avisos: proceso.ok ? avisosDeLeccion(proceso.leccion, contexto) : [],
    datos,
    leccion: proceso.ok && errores.length === 0 ? proceso.leccion : null,
  };
}

const PISTAS: readonly { patron: RegExp; texto: string }[] = [
  {
    patron: /no está definido/,
    texto:
      'Define cada punto en «datos» o créalo en «derivados» antes de usarlo, y cada radio en «radios».',
  },
  {
    patron: /^construcción imposible/,
    texto:
      'Cambia los datos o el factor del radio para que la construcción exista. Las coordenadas están en milímetros y el lienzo mide 210 × 140.',
  },
  {
    patron: /^comprobaciones:/,
    texto:
      'La construcción no cumple la propiedad. No toques la comprobación: corrige la construcción.',
  },
  {
    patron: /^render:/,
    texto: 'Mueve o reduce los datos para que todo quepa en el lienzo y las etiquetas no se pisen.',
  },
];

const plural = (n: number, singular: string, varios: string): string =>
  `${n} ${n === 1 ? singular : varios}`;

export function formatearInforme(informe: InformeBorrador): string {
  const lineas: string[] = [`INFORME DE TRAZE · ${informe.id ?? 'lección sin id'}`];
  const avisos = plural(informe.avisos.length, 'aviso', 'avisos');

  if (informe.errores.length === 0) {
    lineas.push(`Resultado: CORRECTO (${avisos})`);
  } else {
    const errores = plural(informe.errores.length, 'error', 'errores');
    lineas.push(`Resultado: CORREGIR (${errores}, ${avisos})`, '', 'Errores (corrígelos todos):');
    informe.errores.forEach((error, i) => lineas.push(`${i + 1}. ${error}`));

    const pistas = PISTAS.filter(({ patron }) => informe.errores.some((e) => patron.test(e)));
    if (pistas.length > 0) {
      lineas.push('', 'Pistas:');
      pistas.forEach(({ texto }) => lineas.push(`- ${texto}`));
    }
  }

  if (informe.avisos.length > 0) {
    lineas.push('', 'Avisos (no bloquean, pero mejóralos si puedes):');
    informe.avisos.forEach((aviso) => lineas.push(`- ${aviso}`));
  }

  const pideCorreccion =
    informe.errores.length > 0 && !informe.errores.some((e) => e.startsWith('vocabulario:'));
  if (pideCorreccion) {
    lineas.push(
      '',
      'Devuelve la lección completa corregida en un único bloque ```json, sin comentarios y sin la clave «meta».',
    );
  }

  return lineas.join('\n');
}
