import { createContext, useContext, useMemo } from 'react';
import { useApiData } from '../hooks/useApiData';
import { getCanaisResumo, getVendedoresResumo } from '../services/api';
import { normalizarRotaLista } from '../utils/wibiRota';
import { useFilters } from './FilterContext';

const SharedDataContext = createContext(null);

/**
 * Dados usados em múltiplas telas (filtros em cascata + tabelas) para o
 * mesmo período selecionado, evitando refetch duplicado da mesma consulta.
 */
export function SharedDataProvider({ children }) {
  const { periodo } = useFilters();

  const vendedores = useApiData(
    () => getVendedoresResumo(periodo),
    [periodo.dataInicio, periodo.dataFim],
    { initialData: [] },
  );

  const canais = useApiData(
    () => getCanaisResumo(periodo),
    [periodo.dataInicio, periodo.dataFim],
    { initialData: [] },
  );

  const value = useMemo(
    () => ({
      // Normaliza a chave de roteirização do WiBi (ex.: "001.A.0007.0007.0407")
      // em area/zona/setor/rota, caso o backend ainda não os separe.
      vendedores: normalizarRotaLista(vendedores.data) ?? [],
      loadingVendedores: vendedores.loading,
      errorVendedores: vendedores.error,
      canais: canais.data ?? [],
      loadingCanais: canais.loading,
      errorCanais: canais.error,
    }),
    [vendedores.data, vendedores.loading, vendedores.error, canais.data, canais.loading, canais.error],
  );

  return <SharedDataContext.Provider value={value}>{children}</SharedDataContext.Provider>;
}

export function useSharedData() {
  const ctx = useContext(SharedDataContext);
  if (!ctx) throw new Error('useSharedData deve ser usado dentro de SharedDataProvider');
  return ctx;
}
