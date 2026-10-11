import type { Metadata } from 'next';
import { Source_Serif_4 } from 'next/font/google';
import Link from 'next/link';
import type { ReactNode } from 'react';
import './globals.css';
import '../estilos/tokens.css';
import '../estilos/base.css';
import '../estilos/hoja.css';

const serif = Source_Serif_4({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--fuente-serif',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

export const metadata: Metadata = {
  title: { default: 'Traze: Dibujo Técnico paso a paso', template: '%s · Traze' },
  description:
    'Aprende los trazados de Dibujo Técnico de 1º de Bachillerato viendo cómo se construyen, paso a paso.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-ES" className={serif.variable}>
      <body>
        <header className="cabecera">
          <Link className="logo" href="/">
            Traze
          </Link>
        </header>
        <main>
          <div className="hoja">{children}</div>
        </main>
      </body>
    </html>
  );
}
