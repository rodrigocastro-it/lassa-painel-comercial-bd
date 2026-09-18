// Regra de negócio Lassa: classificação de Área comercial (chave WiBi, ver
// utils/wibiRota.js). Área que começa com "G" (ou "ESPECIAIS") = Grandes
// Redes. Qualquer outra área (A, B, C, E, ou futuras) = Varejo — é uma
// regra "catch-all": tudo que não é Grandes Redes é Varejo.
// Ver README > "Grandes Redes x Varejo" para a definição usada pela diretoria.
export const MACRO_FILTERS = {
  GERAL: 'geral',
  GRANDES_REDES: 'grandes',
  VAREJO: 'varejo',
};

const GRANDES_REDES_PREFIXOS = ['G', 'ESPECIAIS'];

/**
 * Classifica um código de área em 'grandes' | 'varejo' | null (área vazia).
 */
export function classificarArea(area) {
  if (!area) return null;
  const codigo = String(area).trim().toUpperCase();
  if (!codigo) return null;
  const ehGrandesRedes = GRANDES_REDES_PREFIXOS.some((prefixo) => codigo.startsWith(prefixo));
  return ehGrandesRedes ? MACRO_FILTERS.GRANDES_REDES : MACRO_FILTERS.VAREJO;
}

/**
 * Classifica pelo campo `canal` já calculado pelo backend em /api/canais/resumo
 * ("Grandes Redes" | "Varejo Tradicional"), usado enquanto os demais
 * endpoints não retornam o campo `area`.
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
      return 'Varejo (demais áreas)';
    default:
      return 'Visão Geral';
  }
}

/**
 * Filtra uma lista de itens pelo macro filtro selecionado.
 * - Se `areaField` estiver presente e for diferente de `canalField`, classifica
 *   pelo código de área real (`classificarArea`).
 * - Caso contrário (ou quando `areaField` === `canalField`, ou o item não tem
 *   área), cai para a classificação por canal já pronta do backend.
 */
export function filtrarPorMacro(itens, macro, { areaField = 'area', canalField } = {}) {
  if (!Array.isArray(itens)) return [];
  if (macro === MACRO_FILTERS.GERAL) return itens;
  return itens.filter((item) => {
    if (areaField && areaField !== canalField && item[areaField]) {
      return classificarArea(item[areaField]) === macro;
    }
    if (canalField && item[canalField]) {
      return classificarCanal(item[canalField]) === macro;
    }
    return false;
  });
}
