import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Drawer({ open, onClose, title, subtitle, children, actions }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  // Portal direto para <body>: um overlay `fixed` nunca deve depender de
  // nenhum ancestral React estar livre de `transform`/`filter` (o que
  // criaria um containing block e quebraria o `inset-0`).
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(12,18,32,0.35)] animate-fade-in"
      />
      <div className="relative flex h-full w-full max-w-xl animate-slide-in-right flex-col bg-surface shadow-lg">
        <div className="flex items-start justify-between gap-3 border-b border-hairline px-6 py-5">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-ink-primary">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-ink-secondary">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-page-alt hover:text-ink-primary"
            aria-label="Fechar painel"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {actions && <div className="border-t border-hairline px-6 py-4">{actions}</div>}
      </div>
    </div>,
    document.body,
  );
}
