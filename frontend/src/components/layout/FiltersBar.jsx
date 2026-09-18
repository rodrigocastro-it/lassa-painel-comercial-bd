import { useMemo, useState } from 'react';
import { Calendar, ChevronDown, RotateCcw } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useSharedData } from '../../context/SharedDataContext';
import { PERIOD_PRESETS } from '../../utils/dateRange';

function distinctValues(list, field) {
  const values = new Set();
  list.forEach((item) => {
    if (item[field]) values.add(String(item[field]));
  });
  return Array.from(values).sort();
}

function CascadeSelect({ label, value, options, onChange, disabled, hint }) {
  return (
    <label className="flex min-w-[150px] flex-col gap-1">
      <span className="text-xs font-medium text-ink-secondary">{label}</span>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-hairline bg-surface px-3 py-2 pr-8 text-sm text-ink-primary disabled:cursor-not-allowed disabled:bg-page disabled:text-ink-muted"
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
      {disabled && hint && <span className="text-[11px] text-ink-muted">{hint}</span>}
    </label>
  );
}

export default function FiltersBar() {
  const { filters, setPeriod, setCascadeFilter, resetCascadeFilters } = useFilters();
  const { vendedores } = useSharedData();
  const [showCustom, setShowCustom] = useState(filters.periodPreset === 'custom');

  const areas = useMemo(() => distinctValues(vendedores, 'area'), [vendedores]);
  const zonas = useMemo(() => distinctValues(vendedores, 'zona'), [vendedores]);
  const setores = useMemo(() => distinctValues(vendedores, 'setor'), [vendedores]);
  const rotas = useMemo(() => distinctValues(vendedores, 'rota'), [vendedores]);
  const nomesVendedores = useMemo(
    () => distinctValues(vendedores, 'nome_vendedor'),
    [vendedores],
  );

  const cascadeGapHint = 'Aguardando o backend retornar este campo (ver README)';

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-secondary">Período</span>
          <div className="flex flex-wrap gap-1.5">
            {PERIOD_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  if (preset.id === 'custom') {
                    setShowCustom(true);
                    setPeriod('custom', null);
                  } else {
                    setShowCustom(false);
                    setPeriod(preset.id, preset.getRange());
                  }
                }}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  filters.periodPreset === preset.id
                    ? 'border-lassa-blue-600 bg-lassa-blue-50 text-lassa-blue-700'
                    : 'border-hairline text-ink-secondary hover:border-lassa-blue-400'
                }`}
              >
                {preset.id === 'custom' && <Calendar size={13} />}
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {showCustom && (
          <div className="flex items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-ink-secondary">Data início</span>
              <input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => setPeriod('custom', { dataInicio: e.target.value, dataFim: filters.dataFim })}
                className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-ink-primary"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-ink-secondary">Data fim</span>
              <input
                type="date"
                value={filters.dataFim}
                onChange={(e) => setPeriod('custom', { dataInicio: filters.dataInicio, dataFim: e.target.value })}
                className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-ink-primary"
              />
            </label>
          </div>
        )}

        <div className="ml-auto flex items-end">
          <button
            type="button"
            onClick={resetCascadeFilters}
            className="flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-2 text-xs font-medium text-ink-secondary hover:border-lassa-red-500 hover:text-lassa-red-600"
          >
            <RotateCcw size={13} />
            Limpar filtros
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-hairline pt-3">
        <CascadeSelect
          label="Área"
          value={filters.area}
          options={areas}
          onChange={(v) => setCascadeFilter('area', v)}
          disabled={areas.length === 0}
          hint={cascadeGapHint}
        />
        <CascadeSelect
          label="Zona"
          value={filters.zona}
          options={zonas}
          onChange={(v) => setCascadeFilter('zona', v)}
          disabled={zonas.length === 0}
          hint={cascadeGapHint}
        />
        <CascadeSelect
          label="Setor"
          value={filters.setor}
          options={setores}
          onChange={(v) => setCascadeFilter('setor', v)}
          disabled={setores.length === 0}
          hint={cascadeGapHint}
        />
        <CascadeSelect
          label="Rota"
          value={filters.rota}
          options={rotas}
          onChange={(v) => setCascadeFilter('rota', v)}
          disabled={rotas.length === 0}
          hint={cascadeGapHint}
        />
        <CascadeSelect
          label="Vendedor"
          value={filters.vendedor}
          options={nomesVendedores}
          onChange={(v) => setCascadeFilter('vendedor', v)}
        />
      </div>
    </div>
  );
}
