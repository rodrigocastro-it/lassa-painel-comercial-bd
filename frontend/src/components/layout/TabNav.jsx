export default function TabNav({ tabs, activeTab, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-hairline" role="tablist">
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
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              active
                ? 'border-lassa-blue-600 text-lassa-blue-700'
                : 'border-transparent text-ink-secondary hover:text-ink-primary'
            }`}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
