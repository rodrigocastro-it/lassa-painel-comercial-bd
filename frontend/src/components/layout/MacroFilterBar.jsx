import { Building2, LayoutGrid, Store } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { MACRO_FILTERS } from '../../utils/businessRules';

const OPTIONS = [
  { id: MACRO_FILTERS.GERAL, label: 'Visão Geral', icon: LayoutGrid },
  { id: MACRO_FILTERS.GRANDES_REDES, label: 'Grandes Redes (Área G / Especiais)', icon: Building2 },
  { id: MACRO_FILTERS.VAREJO, label: 'Varejo (demais áreas)', icon: Store },
];

export default function MacroFilterBar() {
  const { filters, setMacroFilter } = useFilters();

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtro macro de negócio">
      {OPTIONS.map(({ id, label, icon: Icon }) => {
        const active = filters.macroFilter === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setMacroFilter(id)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? 'border-lassa-blue-600 bg-lassa-blue-600 text-white shadow-sm'
                : 'border-hairline bg-surface text-ink-secondary hover:border-lassa-blue-400 hover:text-lassa-blue-700'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
