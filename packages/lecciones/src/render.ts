import type { LeccionResuelta, PrimitivaResuelta } from './interpretar';
import { cajaDeRotulo, type Caja } from './rotulos';

export const MARGEN_LIENZO = 3;
export const MARGEN_ROTULOS = 0.5;

export interface ProblemaRender {
  tipo: 'etiquetasSolapadas' | 'fueraDelLienzo';
  mensaje: string;
}

function cajaDePuntos(puntos: readonly { x: number; y: number }[]): Caja {
  const xs = puntos.map((p) => p.x);
  const ys = puntos.map((p) => p.y);
  return { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
}

function cajaDeArco(arco: Extract<PrimitivaResuelta, { tipo: 'arco' }>): Caja {
  const cuarto = Math.PI / 2;
  const desde = Math.min(arco.inicio, arco.fin);
  const hasta = Math.max(arco.inicio, arco.fin);
  const angulos = [arco.inicio, arco.fin];
  for (let k = Math.ceil(desde / cuarto); k * cuarto <= hasta; k++) angulos.push(k * cuarto);
  return cajaDePuntos(
    angulos.map((angulo) => ({
      x: arco.cx + arco.radio * Math.cos(angulo),
      y: arco.cy + arco.radio * Math.sin(angulo),
    })),
  );
}

function cajaDePrimitiva(primitiva: PrimitivaResuelta): Caja {
  switch (primitiva.tipo) {
    case 'punto':
    case 'marcaAnguloRecto':
      return cajaDePuntos([primitiva]);
    case 'segmento':
    case 'recta':
      return cajaDePuntos([
        { x: primitiva.x1, y: primitiva.y1 },
        { x: primitiva.x2, y: primitiva.y2 },
      ]);
    case 'marcaIgualdad':
      return cajaDePuntos([
        { x: (primitiva.x1 + primitiva.x2) / 2, y: (primitiva.y1 + primitiva.y2) / 2 },
      ]);
    case 'arco':
      return cajaDeArco(primitiva);
  }
}

function seSolapan(a: Caja, b: Caja): boolean {
  return (
    a.x1 < b.x2 + MARGEN_ROTULOS &&
    b.x1 < a.x2 + MARGEN_ROTULOS &&
    a.y1 < b.y2 + MARGEN_ROTULOS &&
    b.y1 < a.y2 + MARGEN_ROTULOS
  );
}

export function comprobarRender(leccion: LeccionResuelta): ProblemaRender[] {
  const { ancho, alto } = leccion.lienzo;
  const dentro = (caja: Caja): boolean =>
    caja.x1 >= MARGEN_LIENZO &&
    caja.y1 >= MARGEN_LIENZO &&
    caja.x2 <= ancho - MARGEN_LIENZO &&
    caja.y2 <= alto - MARGEN_LIENZO;

  const problemas: ProblemaRender[] = [];
  const etiquetas = new Map<string, Caja>();

  leccion.pasos.forEach((paso, i) => {
    paso.dibujo.forEach((primitiva, j) => {
      const ruta = `pasos.${i}.dibujo.${j}`;

      if (!dentro(cajaDePrimitiva(primitiva))) {
        problemas.push({
          tipo: 'fueraDelLienzo',
          mensaje: `${ruta}: el trazo «${primitiva.tipo}» se sale del lienzo (deja al menos ${MARGEN_LIENZO} mm de margen en un lienzo de ${ancho} × ${alto} mm)`,
        });
      }

      if (primitiva.tipo === 'punto') {
        const caja = cajaDeRotulo(primitiva.x, primitiva.y, primitiva.etiqueta);
        if (!dentro(caja)) {
          problemas.push({
            tipo: 'fueraDelLienzo',
            mensaje: `${ruta}: la etiqueta «${primitiva.id}» se sale del lienzo`,
          });
        }
        etiquetas.set(primitiva.id, caja);
      }
    });
  });

  const ids = [...etiquetas.keys()];
  for (let a = 0; a < ids.length; a++) {
    for (let b = a + 1; b < ids.length; b++) {
      if (seSolapan(etiquetas.get(ids[a])!, etiquetas.get(ids[b])!)) {
        problemas.push({
          tipo: 'etiquetasSolapadas',
          mensaje: `las etiquetas «${ids[a]}» y «${ids[b]}» se solapan`,
        });
      }
    }
  }

  return problemas;
}
