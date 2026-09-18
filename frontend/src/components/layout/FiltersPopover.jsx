import { useMemo, useState } from 'react';
import { Calendar, ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useSharedData } from '../../context/SharedDataContext';
import { PERIOD_PRESETS } from '../../utils/dateRange';
import { periodicidadeSetor } from '../../utils/wibiRota';

function distinctValues(list, field) {
  const values = new Set();
  list.forEach((item) => {
    if (item[field]) values.add(String(item[field]));
  });
  return Array.from(values).sort();
}

function restringirPorFiltrosSuperiores(list, filtrosSuperiores) {
  return list.filter((item) => filtrosSuperiores.every(([campo, valor]) => !valor || String(item[campo]) === valor));
}

function CascadeSelect({ label, value, options, onChange, disabled, hint }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-ink-secondary">{label}</span>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="focus-ring w-full appearance-none rounded-md border border-hairline bg-surface px-3 py-2 pr-8 text-sm text-ink-primary disabled:cursor-not-allowed disabled:bg-page disabled:text-ink-muted"
        >
          <option value="">Todos</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
      </div>
      {hint && <span className="text-[11px] text-ink-muted">{hint}</span>}
    </label>
  );
}

function PeriodoPopover() {
  const { filters, setPeriod } = useFilters();
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(filters.periodPreset === 'custom');
  const ativo = PERIOD_PRESETS.find((p) => p.id === filters.periodPreset);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex items-center gap-2 rounded-md border border-hairline bg-surface px-3.5 py-2 text-sm font-medium text-ink-primary shadow-xs transition-colors hover:border-hairline-strong"
      >
        <Calendar size={15} className="text-ink-muted" />
        {ativo?.label ?? 'Período'}
        <ChevronDown size={14} className="text-ink-muted" />
      </button>
      {open && (
        <>
          <button aria-hidden className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="animate-fade-in absolute left-0 z-50 mt-2 w-72 rounded-lg border border-hairline bg-surface p-3 shadow-lg">
            <div className="flex flex-col gap-1">
              {PERIOD_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    if (preset.id === 'custom') {
                      setCustomOpen(true);
                      setPeriod('custom', null);
                    } else {
                      setCustomOpen(false);
                      setPeriod(preset.id, preset.getRange());
                      setOpen(false);
                    }
                  }}
                  className={`rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                    filters.periodPreset === preset.id
                      ? 'bg-lassa-blue-tint text-lassa-blue-700'
                      : 'text-ink-secondary hover:bg-page-alt'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {customOpen && (
              <div className="mt-2 flex items-end gap-2 border-t border-hairline pt-3">
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-[11px] font-medium text-ink-secondary">Início</span>
                  <input
                    type="date"
                    value={filters.dataInicio}
                    onChange={(e) => setPeriod('custom', { dataInicio: e.target.value, dataFim: filters.dataFim })}
                    className="focus-ring rounded-md border border-hairline px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-[11px] font-medium text-ink-secondary">Fim</span>
                  <input
                    type="date"
                    value={filters.dataFim}
                    onChange={(e) => setPeriod('custom', { dataInicio: filters.dataInicio, dataFim: e.target.value })}
                    className="focus-ring rounded-md border border-hairline px-2 py-1.5 text-sm"
                  />
                </label>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function FiltrosAvancadosPopover() {
  const { filters, setCascadeFilter, resetCascadeFilters, filtrosAtivos } = useFilters();
  const { vendedores } = useSharedData();
  const [open, setOpen] = useState(false);

  const areas = useMemo(() => distinctValues(vendedores, 'area'), [vendedores]);
  const zonas = useMemo(
    () => distinctValues(restringirPorFiltrosSuperiores(vendedores, [['area', filters.area]]), 'zona'),
    [vendedores, filters.area],
  );
  const setores = useMemo(
    () =>
      distinctValues(
        restringirPorFiltrosSuperiores(vendedores, [
          ['area', filters.area],
          ['zona', filters.zona],
        ]),
        'setor',
      ),
    [vendedores, filters.area, filters.zona],
  );
  const rotas = useMemo(
    () =>
      distinctValues(
        restringirPorFiltrosSuperiores(vendedores, [
          ['area', filters.area],
          ['zona', filters.zona],
          ['setor', filters.setor],
        ]),
        'rota',
      ),
    [vendedores, filters.area, filters.zona, filters.setor],
  );
  const nomesVendedores = useMemo(() => distinctValues(vendedores, 'nome_vendedor'), [vendedores]);
  const gapHint = 'Aguardando o backend';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex items-center gap-2 rounded-md border border-hairline bg-surface px-3.5 py-2 text-sm font-medium text-ink-primary shadow-xs transition-colors hover:border-hairline-strong"
      >
        <SlidersHorizontal size={15} className="text-ink-muted" />
        Filtros
        {filtrosAtivos > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-lassa-blue-600 px-1 text-[11px] font-bold text-white">
            {filtrosAtivos}
          </span>
        )}
      </button>
      {open && (
        <>
          <button aria-hidden className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="animate-fade-in absolute right-0 z-50 mt-2 w-[min(560px,90vw)] rounded-lg border border-hairline bg-surface p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-primary">Filtros avançados</p>
              <button
                type="button"
                onClick={resetCascadeFilters}
                className="flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-lassa-red-600"
              >
                <RotateCcw size={12} />
                Limpar
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <CascadeSelect
                label="Área"
                value={filters.area}
                options={areas}
                onChange={(v) => {
                  setCascadeFilter('area', v);
                  setCascadeFilter('zona', '');
                  setCascadeFilter('setor', '');
                  setCascadeFilter('rota', '');
                }}
                disabled={areas.length === 0}
                hint={areas.length === 0 ? gapHint : undefined}
              />
              <CascadeSelect
                label="Zona"
                value={filters.zona}
                options={zonas}
                onChange={(v) => {
                  setCascadeFilter('zona', v);
                  setCascadeFilter('setor', '');
                  setCascadeFilter('rota', '');
                }}
                disabled={zonas.length === 0}
                hint={zonas.length === 0 ? gapHint : undefined}
              />
              <CascadeSelect
                label="Setor"
                value={filters.setor}
                options={setores}
                onChange={(v) => {
                  setCascadeFilter('setor', v);
                  setCascadeFilter('rota', '');
                }}
                disabled={setores.length === 0}
                hint={setores.length === 0 ? gapHint : periodicidadeSetor(filters.setor) ?? undefined}
              />
              <CascadeSelect
                label="Rota"
                value={filters.rota}
                options={rotas}
                onChange={(v) => setCascadeFilter('rota', v)}
                disabled={rotas.length === 0}
                hint={rotas.length === 0 ? gapHint : undefined}
              />
              <CascadeSelect
                label="Vendedor"
                value={filters.vendedor}
                options={nomesVendedores}
                onChange={(v) => setCascadeFilter('vendedor', v)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function FiltersPopover() {
  return (
    <div className="flex items-center gap-2">
      <PeriodoPopover />
      <FiltrosAvancadosPopover />
    </div>
  );
}
