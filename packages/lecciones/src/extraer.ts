export type ResultadoExtraccion =
  | { ok: true; datos: Record<string, unknown> }
  | { ok: false; error: string };

const BLOQUE_CODIGO = /```[A-Za-z]*[ \t]*\r?\n([\s\S]*?)```/g;

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

export function extraerJson(texto: string): ResultadoExtraccion {
  const limpio = texto.replace(/^\uFEFF/, '').trim();
  if (limpio === '') return { ok: false, error: 'el texto está vacío' };

  const bloques = [...limpio.matchAll(BLOQUE_CODIGO)].map((m) => m[1].trim()).reverse();
  const inicio = limpio.indexOf('{');
  const fin = limpio.lastIndexOf('}');
  const entreLlaves = inicio !== -1 && fin > inicio ? [limpio.slice(inicio, fin + 1)] : [];
  const candidatos = [...bloques, ...entreLlaves];

  if (candidatos.length === 0) {
    return { ok: false, error: 'no se encuentra ningún objeto JSON (falta el bloque ```json)' };
  }

  let motivo = '';
  for (const candidato of candidatos) {
    try {
      const datos: unknown = JSON.parse(candidato);
      if (esObjeto(datos)) return { ok: true, datos };
      motivo = 'el JSON no es un objeto';
    } catch (error) {
      motivo = `JSON no válido: ${(error as Error).message}`;
    }
  }
  return { ok: false, error: motivo };
}