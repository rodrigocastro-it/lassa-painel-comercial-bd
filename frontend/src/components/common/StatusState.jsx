import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';

export function LoadingState({ label = 'Carregando dados...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-ink-muted">
      <Loader2 size={22} className="animate-spin text-lassa-blue-500" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-lassa-red-tint-border bg-lassa-red-tint-soft py-14 text-center">
      <AlertTriangle size={22} className="text-lassa-red-600" />
      <p className="max-w-md text-sm text-ink-secondary">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 rounded-lg border border-lassa-red-tint-border px-3 py-1.5 text-xs font-semibold text-lassa-red-600 hover:bg-lassa-red-tint"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = 'Nenhum dado encontrado para o período/filtros selecionados.' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-ink-muted">
      <Inbox size={22} />
      <p className="text-sm">{message}</p>
    </div>
  );
}
