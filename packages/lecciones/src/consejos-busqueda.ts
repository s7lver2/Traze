export const TIPOS_CONSEJO = [
  'material',
  'tecnica',
  'precision',
  'limpieza',
  'atajo',
  'error',
] as const;

export type TipoConsejo = (typeof TIPOS_CONSEJO)[number];

export const ETIQUETA_TIPO: Record<TipoConsejo, string> = {
  material: 'Material',
  tecnica: 'Técnica de instrumento',
  precision: 'Precisión',
  limpieza: 'Limpieza',
  atajo: 'Atajo mental',
  error: 'Error típico',
};

export const TEMA_GENERAL = 'Oficio general';

export interface ConsejoBiblioteca {
  id: string;
  tipo: TipoConsejo | null;
  tema: string;
  texto: string;
  leccion: { id: string; titulo: string; paso: number } | null;
}

export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function buscarConsejos(
  lista: readonly ConsejoBiblioteca[],
  filtro: { consulta: string; tema: string },
): ConsejoBiblioteca[] {
  const palabras = normalizar(filtro.consulta).split(/\s+/).filter(Boolean);
  return lista.filter((consejo) => {
    if (filtro.tema !== '' && consejo.tema !== filtro.tema) return false;
    const pajar = normalizar(
      [
        consejo.texto,
        consejo.tipo ? ETIQUETA_TIPO[consejo.tipo] : '',
        consejo.tema,
        consejo.leccion?.titulo ?? '',
      ].join(' '),
    );
    return palabras.every((palabra) => pajar.includes(palabra));
  });
}

export function temasDisponibles(lista: readonly ConsejoBiblioteca[]): string[] {
  const temas = [...new Set(lista.map((consejo) => consejo.tema))];
  return [...temas.filter((tema) => tema === TEMA_GENERAL), ...temas.filter((tema) => tema !== TEMA_GENERAL)];
}
