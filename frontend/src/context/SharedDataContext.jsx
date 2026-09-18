import { createContext, useContext, useMemo } from 'react';
import { useApiData } from '../hooks/useApiData';
import { getCanaisResumo, getKpisCobertura, getKpisTotais, getVendedoresResumo } from '../services/api';
import { normalizarRotaLista } from '../utils/wibiRota';
import { useFilters } from './FilterContext';

const SharedDataContext = createContext(null);

/**
 * Dados usados em múltiplas telas (hero de positivação, KPIs, filtros em
 * cascata, tabelas) para o mesmo período selecionado — e também para o
 * período anterior equivalente, para permitir comparações ("+4,8% vs
 * período anterior") sem endpoints novos no backend.
 */
export function SharedDataProvider({ children }) {
  const { periodo, periodoAnterior } = useFilters();

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

  const totais = useApiData(() => getKpisTotais(periodo), [periodo.dataInicio, periodo.dataFim]);
  const cobertura = useApiData(() => getKpisCobertura(periodo), [periodo.dataInicio, periodo.dataFim]);

  const totaisAnterior = useApiData(
    () => getKpisTotais(periodoAnterior),
    [periodoAnterior.dataInicio, periodoAnterior.dataFim],
  );
  const coberturaAnterior = useApiData(
    () => getKpisCobertura(periodoAnterior),
    [periodoAnterior.dataInicio, periodoAnterior.dataFim],
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
      totais,
      cobertura,
      totaisAnterior,
      coberturaAnterior,
    }),
    [
      vendedores.data,
      vendedores.loading,
      vendedores.error,
      canais.data,
      canais.loading,
      canais.error,
      totais,
      cobertura,
      totaisAnterior,
      coberturaAnterior,
    ],
  );

  return <SharedDataContext.Provider value={value}>{children}</SharedDataContext.Provider>;
}

export function useSharedData() {
  const ctx = useContext(SharedDataContext);
  if (!ctx) throw new Error('useSharedData deve ser usado dentro de SharedDataProvider');
  return ctx;
}
