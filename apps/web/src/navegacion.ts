export interface Enlace {
  texto: string;
  href: string;
  disponible: boolean;
  coincide: (ruta: string) => boolean;
}

const seccion = (base: string) => (ruta: string) => ruta === base || ruta.startsWith(`${base}/`);

export const ENLACES: readonly Enlace[] = [
  { texto: 'Temario', href: '/temario', disponible: true, coincide: seccion('/temario') },
  {
    texto: 'Lecciones',
    href: '/',
    disponible: true,
    coincide: (ruta) => ruta === '/' || seccion('/leccion')(ruta),
  },
  { texto: 'Consejos', href: '/consejos', disponible: true, coincide: seccion('/consejos') },
  { texto: 'Mi carpeta', href: '/carpeta', disponible: false, coincide: seccion('/carpeta') },
];

export function enlacesVisibles(enlaces: readonly Enlace[] = ENLACES): Enlace[] {
  return enlaces.filter((enlace) => enlace.disponible);
}

export function esActivo(enlace: Enlace, ruta: string): boolean {
  const normalizada = ruta.replace(/\/+$/, '') || '/';
  return enlace.coincide(normalizada);
}
