import type { Metadata } from 'next';
import { Source_Serif_4 } from 'next/font/google';
import type { ReactNode } from 'react';
import { Cabecera } from '../componentes/Cabecera';
import '../estilos/tokens.css';
import '../estilos/base.css';
import '../estilos/hoja.css';
import '../estilos/cabecera.css';
import '../estilos/lienzo.css';
import '../estilos/escenario.css';
import '../estilos/panel.css';
import '../estilos/controles.css';
import '../estilos/deslizador.css';
import '../estilos/leccion.css';
import '../estilos/portada.css';
import '../estilos/temario.css';
import '../estilos/consejos.css';
import '../estilos/reto.css';
import { urlDelSitio } from '../seo';

const serif = Source_Serif_4({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--fuente-serif',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

export const metadata: Metadata = {
  metadataBase: new URL(urlDelSitio()),
  title: { default: 'Traze: Dibujo Técnico paso a paso', template: '%s · Traze' },
  description:
    'Aprende los trazados de Dibujo Técnico de 1º de Bachillerato viendo cómo se construyen, paso a paso.',
  openGraph: { siteName: 'Traze', locale: 'es_ES', type: 'website' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-ES" className={serif.variable}>
      <body>
        <Cabecera />
        <main>{children}</main>
      </body>
    </html>
  );
}
