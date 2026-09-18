// Regra de negócio Lassa: classificação de Área comercial.
// Área "G" (ou "ESPECIAIS") = Grandes Redes. Áreas A, B, C, E = Varejo.
// Ver README > "Grandes Redes x Varejo" para a definição usada pela diretoria.
export const MACRO_FILTERS = {
  GERAL: 'geral',
  GRANDES_REDES: 'grandes',
  VAREJO: 'varejo',
};

const GRANDES_REDES_AREAS = new Set(['G', 'ESPECIAIS']);
const VAREJO_AREAS = new Set(['A', 'B', 'C', 'E']);

/**
 * Classifica um código de área em 'grandes' | 'varejo' | null (não classificado).
 */
export function classificarArea(area) {
  if (!area) return null;
  const codigo = String(area).trim().toUpperCase();
  if (GRANDES_REDES_AREAS.has(codigo)) return MACRO_FILTERS.GRANDES_REDES;
  if (VAREJO_AREAS.has(codigo)) return MACRO_FILTERS.VAREJO;
  return null;
}

/**
 * Classifica pelo campo `canal` já calculado pelo backend em /api/canais/resumo
 * ("Grandes Redes" | "Varejo Tradicional"), usado como fallback enquanto os
 * demais endpoints não retornam o campo `area`.
 */
export function classificarCanal(canal) {
  if (!canal) return null;
  return canal.toLowerCase().includes('grande') ? MACRO_FILTERS.GRANDES_REDES : MACRO_FILTERS.VAREJO;
}

export function rotuloMacroFiltro(macro) {
  switch (macro) {
    case MACRO_FILTERS.GRANDES_REDES:
      return 'Grandes Redes (Área G / Especiais)';
    case MACRO_FILTERS.VAREJO:
      return 'Varejo (Áreas A, B, C, E)';
    default:
      return 'Visão Geral';
  }
}

/**
 * Filtra uma lista de itens pelo macro filtro selecionado, usando o campo
 * `area` do próprio item quando presente, com fallback opcional para um
 * classificador de canal (usado nos blocos de Canais).
 */
export function filtrarPorMacro(itens, macro, { areaField = 'area', canalField } = {}) {
  if (!Array.isArray(itens)) return [];
  if (macro === MACRO_FILTERS.GERAL) return itens;
  return itens.filter((item) => {
    const grupoArea = classificarArea(item[areaField]);
    if (grupoArea) return grupoArea === macro;
    if (canalField && item[canalField]) {
      return classificarCanal(item[canalField]) === macro;
    }
    return false;
  });
}
