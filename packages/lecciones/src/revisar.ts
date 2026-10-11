export type ResultadoRevision =
  | { ok: true; datos: Record<string, unknown> }
  | { ok: false; error: string };

export function marcarRevisada(
  datos: Record<string, unknown>,
  por: string,
  fecha: string,
): ResultadoRevision {
  const nombre = por.trim();
  if (nombre === '') return { ok: false, error: 'falta el nombre del revisor (--por)' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { ok: false, error: 'la fecha va como AAAA-MM-DD' };
  }

  const previa =
    typeof datos.meta === 'object' && datos.meta !== null
      ? (datos.meta as Record<string, unknown>)
      : {};

  return {
    ok: true,
    datos: {
      ...datos,
      meta: { version: 1, ...previa, revision: 'revisada', revisadaPor: nombre, revisadaEl: fecha },
    },
  };
}
