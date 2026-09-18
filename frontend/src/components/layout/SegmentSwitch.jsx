import { useFilters } from '../../context/FilterContext';
import { MACRO_FILTERS } from '../../utils/businessRules';

const OPTIONS = [
  { id: MACRO_FILTERS.GRANDES_REDES, label: 'Grandes Redes' },
  { id: MACRO_FILTERS.VAREJO, label: 'Varejo' },
];

/**
 * Switch segmentado de dois estados — a lente principal do painel.
 * Substitui os antigos três botões macro (Visão Geral/Grandes Redes/Varejo)
 * por um controle compacto, sempre em um dos dois modelos de negócio.
 */
export default function SegmentSwitch() {
  const { filters, setMacroFilter } = useFilters();
  const activeIndex = OPTIONS.findIndex((o) => o.id === filters.macroFilter);

  return (
    <div
      role="tablist"
      aria-label="Modelo de negócio"
      className="relative inline-flex rounded-pill border border-hairline bg-page-alt p-1"
    >
      <div
        aria-hidden
        className="absolute inset-y-1 rounded-pill bg-lassa-blue-700 shadow-blue transition-transform duration-200 ease-out"
        style={{
          width: `calc(50% - 4px)`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {OPTIONS.map((opt) => {
        const active = opt.id === filters.macroFilter;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setMacroFilter(opt.id)}
            className={`focus-ring relative z-10 min-w-[132px] rounded-pill px-5 py-2 text-sm font-semibold transition-colors duration-200 ${
              active ? 'text-white' : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
