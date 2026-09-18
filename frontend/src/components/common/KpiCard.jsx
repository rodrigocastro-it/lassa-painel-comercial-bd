const TONE_STYLES = {
  blue: 'bg-lassa-blue-50 text-lassa-blue-700',
  green: 'bg-lassa-green-tint text-lassa-green-600',
  red: 'bg-lassa-red-tint text-lassa-red-600',
  neutral: 'bg-page text-ink-secondary',
};

export default function KpiCard({ label, value, icon: Icon, tone = 'blue', hint, loading }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-hairline bg-surface p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TONE_STYLES[tone]}`}>
        {Icon && <Icon size={18} />}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-ink-secondary">{label}</p>
        {loading ? (
          <div className="mt-1.5 h-6 w-24 animate-pulse rounded bg-page" />
        ) : (
          <p className="tabular break-words text-xl font-bold leading-tight text-ink-primary">{value}</p>
        )}
        {hint && <p className="mt-0.5 text-[11px] text-ink-muted">{hint}</p>}
      </div>
    </div>
  );
}
