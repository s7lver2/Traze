'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Leccion, LeccionResuelta } from '@traze/lecciones';
import { enunciadoDelProblema, generarProblema } from '@traze/lecciones/problemas';
import { RetoInteractivo } from './RetoInteractivo';

const SEMILLA = /^\d{1,9}$/;

function semillaDeLaDireccion(): number | null {
  const valor = new URLSearchParams(window.location.search).get('semilla');
  return valor !== null && SEMILLA.test(valor) ? Number(valor) : null;
}

function escribirSemilla(semilla: number | null): void {
  const direccion = new URL(window.location.href);
  if (semilla === null) direccion.searchParams.delete('semilla');
  else direccion.searchParams.set('semilla', String(semilla));
  window.history.replaceState(null, '', direccion);
}

/** El reto de una lección: con sus datos, o con un problema aleatorio si la dirección lleva una semilla. */
export function PaginaReto({ leccion, resuelta }: { leccion: Leccion; resuelta: LeccionResuelta }) {
  const [semilla, setSemilla] = useState<number | null>(null);

  useEffect(() => {
    setSemilla(semillaDeLaDireccion());
  }, []);

  const problema = useMemo(() => (semilla === null ? null : generarProblema(leccion, semilla)), [leccion, semilla]);

  function otroProblema() {
    const nueva = Math.floor(Math.random() * 1_000_000);
    escribirSemilla(nueva);
    setSemilla(nueva);
  }

  if (semilla !== null && problema) {
    return (
      <RetoInteractivo
        key={`problema-${semilla}`}
        leccion={problema.leccion}
        resuelta={problema.resuelta}
        enunciado={enunciadoDelProblema(problema)}
        semilla={semilla}
        alOtroProblema={otroProblema}
      />
    );
  }

  return (
    <RetoInteractivo
      key="leccion"
      leccion={leccion}
      resuelta={resuelta}
      enunciado={leccion.enunciado}
      semilla={null}
      alOtroProblema={otroProblema}
    />
  );
}
