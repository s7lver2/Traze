import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Traze: Dibujo Técnico paso a paso', template: '%s · Traze' },
  description:
    'Aprende los trazados de Dibujo Técnico de 1º de Bachillerato viendo cómo se construyen, paso a paso.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-ES">
      <body>
        <header className="cabecera">
          <Link className="logo" href="/">
            Traze
          </Link>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}