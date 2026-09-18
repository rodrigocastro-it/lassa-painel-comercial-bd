/** Anel de progresso desenhado à mão em SVG — sem dependências extras. */
export default function RadialProgress({ value, size = 132, stroke = 12, label, sublabel }) {
  const pct = Math.max(0, Math.min(100, value || 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);
  const center = size / 2;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-lassa-blue-100)" strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-lassa-blue-600)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 500ms cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-[28px] font-extrabold leading-none text-ink-primary">{label}</span>
        {sublabel && <span className="mt-1 text-[11px] font-medium text-ink-muted">{sublabel}</span>}
      </div>
    </div>
  );
}
