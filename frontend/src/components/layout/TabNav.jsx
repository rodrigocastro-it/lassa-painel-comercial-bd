export default function TabNav({ tabs, activeTab, onChange }) {
  return (
    <nav role="tablist" aria-label="Navegação" className="flex flex-wrap items-center gap-1">
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`focus-ring flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors ${
              active ? 'bg-lassa-blue-tint text-lassa-blue-700' : 'text-ink-secondary hover:bg-page-alt hover:text-ink-primary'
            }`}
          >
            <Icon size={16} strokeWidth={2.25} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
