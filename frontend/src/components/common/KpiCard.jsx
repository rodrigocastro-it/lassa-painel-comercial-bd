const ICON_TONES = {
  blue: 'bg-lassa-blue-tint text-lassa-blue-700',
  green: 'bg-lassa-green-tint text-lassa-green-600',
  red: 'bg-lassa-red-tint text-lassa-red-600',
  amber: 'bg-lassa-amber-tint text-ink-primary',
  violet: 'bg-lassa-violet-tint text-lassa-violet-500',
  neutral: 'bg-page-alt text-ink-secondary',
};

export default function KpiCard({ label, value, icon: Icon, tone = 'neutral', hint, trend, loading }) {
  return (
    <div className="card card-hover flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-semibold text-ink-secondary">{label}</p>
        {Icon && (
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${ICON_TONES[tone]}`}>
            <Icon size={16} strokeWidth={2.25} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-8 w-28 animate-pulse rounded bg-page" />
      ) : (
        <p className="tabular break-words text-xl font-extrabold leading-tight tracking-tight text-ink-primary sm:text-2xl xl:text-[26px] xl:leading-none">
          {value}
        </p>
      )}

      {(hint || trend) && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          {trend}
          {hint && <span>{hint}</span>}
        </div>
      )}
    </div>
  );
}
