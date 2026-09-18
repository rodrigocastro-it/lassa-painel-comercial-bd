import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

export default function ConceitosInfo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-2 text-xs font-medium text-ink-secondary hover:border-lassa-blue-400 hover:text-lassa-blue-700"
      >
        <HelpCircle size={14} />
        O que é Grandes Redes / Varejo?
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-hairline bg-surface p-4 text-sm shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold text-ink-primary">Definições comerciais</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar">
              <X size={16} className="text-ink-muted" />
            </button>
          </div>
          <div className="space-y-3 text-ink-secondary">
            <div>
              <p className="font-semibold text-lassa-blue-700">Grandes Redes</p>
              <p>
                Clientes cuja <strong>Área</strong> começa com <strong>G</strong> (ou é classificada como{' '}
                <strong>Especiais</strong>) no ERP WiBi — redes de supermercado e grandes contas com negociação
                centralizada (ex.: Assaí, Mateus, Extra).
              </p>
            </div>
            <div>
              <p className="font-semibold text-lassa-blue-700">Varejo</p>
              <p>
                <strong>Todas as demais Áreas</strong> (A, B, C, E e outras) — o varejo tradicional/pulverizado,
                atendido pela equipe de vendedores em rota.
              </p>
            </div>
            <p className="border-t border-hairline pt-2 text-[11px] text-ink-muted">
              A Área vem da chave de roteirização do WiBi (ex.: <code>001.A.0007.0007.0407</code>), no formato
              Coligada.Área.Zona.Setor.Rota. Classificação aplicada automaticamente pelo campo <code>area</code>{' '}
              retornado pela API. No bloco &quot;Canais&quot;, enquanto esse campo não está em todos os endpoints, a
              mesma regra é aplicada pelo nome do cliente (rota <code>/api/canais/resumo</code>).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
