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
  bodyClassName = 'p-5',
  dense,
}) {
  const captureRef = useRef(null);

  return (
    <section className="card overflow-hidden">
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-hairline ${dense ? 'px-4 py-2.5' : 'px-5 py-3.5'}`}>
        <div>
          <h3 className="text-[13px] font-bold text-ink-primary">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {headerExtra}
          <ExportButtons title={title} subtitle={subtitle} columns={columns} rows={rows} captureRef={captureRef} />
        </div>
      </div>
      <div ref={captureRef} className={`capture-surface ${bodyClassName}`}>
        {loading && <LoadingState />}
        {!loading && error && <ErrorState message={error} onRetry={onRetry} />}
        {!loading && !error && isEmpty && <EmptyState message={emptyMessage} />}
        {!loading && !error && !isEmpty && children}
      </div>
    </section>
  );
}
