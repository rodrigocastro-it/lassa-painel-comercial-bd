import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { MACRO_FILTERS } from '../utils/businessRules';
import { mesAtualRange, anoDaData, periodoAnteriorEquivalente } from '../utils/dateRange';

const FilterContext = createContext(null);

const initialRange = mesAtualRange();

const initialState = {
  macroFilter: MACRO_FILTERS.VAREJO,
  periodPreset: 'mes-atual',
  dataInicio: initialRange.dataInicio,
  dataFim: initialRange.dataFim,
  area: '',
  zona: '',
  setor: '',
  rota: '',
  vendedor: '',
};

export function FilterProvider({ children }) {
  const [filters, setFilters] = useState(initialState);

  const setMacroFilter = useCallback((macroFilter) => {
    setFilters((prev) => ({ ...prev, macroFilter }));
  }, []);

  const setPeriod = useCallback((periodPreset, range) => {
    setFilters((prev) => ({
      ...prev,
      periodPreset,
      dataInicio: range?.dataInicio ?? prev.dataInicio,
      dataFim: range?.dataFim ?? prev.dataFim,
    }));
  }, []);

  const setCascadeFilter = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetCascadeFilters = useCallback(() => {
    setFilters((prev) => ({ ...prev, area: '', zona: '', setor: '', rota: '', vendedor: '' }));
  }, []);

  const periodo = useMemo(
    () => ({ dataInicio: filters.dataInicio, dataFim: filters.dataFim }),
    [filters.dataInicio, filters.dataFim],
  );

  const ano = useMemo(() => anoDaData(filters.dataFim), [filters.dataFim]);

  const periodoAnterior = useMemo(
    () => periodoAnteriorEquivalente(filters.dataInicio, filters.dataFim),
    [filters.dataInicio, filters.dataFim],
  );

  const filtrosAtivos = useMemo(
    () => [filters.area, filters.zona, filters.setor, filters.rota, filters.vendedor].filter(Boolean).length,
    [filters.area, filters.zona, filters.setor, filters.rota, filters.vendedor],
  );

  const value = useMemo(
    () => ({
      filters,
      periodo,
      periodoAnterior,
      ano,
      filtrosAtivos,
      setMacroFilter,
      setPeriod,
      setCascadeFilter,
      resetCascadeFilters,
    }),
    [filters, periodo, periodoAnterior, ano, filtrosAtivos, setMacroFilter, setPeriod, setCascadeFilter, resetCascadeFilters],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters deve ser usado dentro de FilterProvider');
  return ctx;
}
