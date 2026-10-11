import type { MetadataRoute } from 'next';
import { cargarLecciones } from '../contenido';
import { rutaLeccion, urlDelSitio } from '../seo';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = urlDelSitio();
  const rutas = [
    '/',
    '/temario',
    '/consejos',
    ...cargarLecciones().map(({ leccion }) => rutaLeccion(leccion.id)),
  ];
  return rutas.map((ruta) => ({ url: `${base}${ruta === '/' ? '' : ruta}` }));
}
