const TONES = {
  neutral: 'bg-page-alt text-ink-secondary border-hairline',
  blue: 'bg-lassa-blue-tint text-lassa-blue-700 border-lassa-blue-tint-border',
  green: 'bg-lassa-green-tint text-lassa-green-600 border-lassa-green-tint-border',
  red: 'bg-lassa-red-tint text-lassa-red-600 border-lassa-red-tint-border',
  amber: 'bg-lassa-amber-tint text-ink-primary border-lassa-amber-tint-border',
  violet: 'bg-lassa-violet-tint text-lassa-violet-500 border-lassa-violet-tint',
};

export default function Badge({ tone = 'neutral', children, icon: Icon }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${TONES[tone]}`}
    >
      {Icon && <Icon size={11} strokeWidth={2.5} />}
      {children}
    </span>
  );
}
