'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { enlacesVisibles, esActivo } from '../navegacion';

export function Cabecera() {
  const ruta = usePathname() ?? '/';

  return (
    <header className="cabecera">
      <Link className="logo" href="/">
        Traze
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
