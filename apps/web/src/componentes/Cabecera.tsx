'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { enlacesVisibles, esActivo } from '../navegacion';

export function Cabecera() {
  const ruta = usePathname() ?? '/';

  return (
    <header className="cabecera">
      <Link className="logo" href="/" aria-label="Traze, inicio">
        <span className="logo-texto" aria-hidden="true">
          Traze
        </span>
        <span className="logo-linea" aria-hidden="true" />
        <svg className="logo-lapiz" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <g transform="rotate(45 16 16)">
            <g className="lapiz-menear">
              <rect className="lapiz-goma" x="13" y="2" width="6" height="4" rx="1.5" />
              <rect className="lapiz-virola" x="13" y="6" width="6" height="3" />
              <rect className="lapiz-cuerpo" x="13" y="9" width="6" height="13" />
              <path className="lapiz-veta" d="M16 9v13" />
              <path className="lapiz-madera" d="M13 22h6l-3 8z" />
              <path className="lapiz-mina" d="M15 27.6h2L16 30z" />
            </g>
          </g>
        </svg>
      </Link>
      <nav className="navegacion" aria-label="Principal">
        <ul>
          {enlacesVisibles().map((enlace) => (
            <li key={enlace.href}>
              <Link href={enlace.href} aria-current={esActivo(enlace, ruta) ? 'page' : undefined}>
                {enlace.texto}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
