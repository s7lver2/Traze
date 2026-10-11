import type { Metadata } from 'next';
import { Taller } from '../../componentes/Taller';

export const metadata: Metadata = {
  alternates: { canonical: '/taller' },
  title: 'Taller de dibujo libre',
  description:
    'Una lámina libre con regla, compás y puntos que se enganchan a los cortes: prueba construcciones y mueve los puntos para ver cómo cambian.',
};

export default function PaginaTaller() {
  return (
    <article className="leccion">
      <Taller />
    </article>
  );
}
