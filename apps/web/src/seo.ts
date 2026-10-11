import type { Leccion, LeccionResuelta } from '@traze/lecciones';

const URL_POR_DEFECTO = 'http://localhost:3000';

export function urlDelSitio(env: string | undefined = process.env.NEXT_PUBLIC_SITE_URL): string {
  const base = (env ?? '').trim() || URL_POR_DEFECTO;
  return base.replace(/\/+$/, '');
}

export const rutaLeccion = (id: string): string => `/leccion/${id}`;

export const tituloSeo = (titulo: string): string => `${titulo}: trazado paso a paso`;

export function descripcionSeo(
  leccion: Pick<Leccion, 'enunciado' | 'ideaClave'>,
  maximo = 155,
): string {
  const texto = `${leccion.enunciado} ${leccion.ideaClave}`.replace(/\s+/g, ' ').trim();
  if (texto.length <= maximo) return texto;
  const corte = texto.slice(0, maximo - 1);
  const ultimoEspacio = corte.lastIndexOf(' ');
  const entero = ultimoEspacio > 0 ? corte.slice(0, ultimoEspacio) : corte;
  return `${entero.replace(/[\s,.;:]+$/, '')}…`;
}

export function datosEstructurados(leccion: Leccion, resuelta: LeccionResuelta, base: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: leccion.titulo,
    description: descripcionSeo(leccion),
    inLanguage: 'es-ES',
    url: `${base}${rutaLeccion(leccion.id)}`,
    step: resuelta.pasos.map((paso, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: paso.titulo,
      text: `${paso.texto} ${paso.porque}`,
    })),
  };
}

export function jsonLdSeguro(datos: unknown): string {
  return JSON.stringify(datos).replace(/</g, '\\u003c');
}
