import { useRef } from 'react';
import ExportButtons from './ExportButtons';
import { LoadingState, ErrorState, EmptyState } from './StatusState';

export default function SectionCard({
  title,
  subtitle,
  columns,
  rows,
  loading,
  error,
  onRetry,
  isEmpty,
  emptyMessage,
  children,
  headerExtra,
}) {
  const captureRef = useRef(null);

  return (
    <section className="rounded-xl border border-hairline bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-ink-primary">{title}</h3>
          {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {headerExtra}
          <ExportButtons title={title} subtitle={subtitle} columns={columns} rows={rows} captureRef={captureRef} />
        </div>
      </div>
      <div ref={captureRef} className="capture-surface p-4">
        {loading && <LoadingState />}
        {!loading && error && <ErrorState message={error} onRetry={onRetry} />}
        {!loading && !error && isEmpty && <EmptyState message={emptyMessage} />}
        {!loading && !error && !isEmpty && children}
      </div>
    </section>
  );
}
