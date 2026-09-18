import { useRef } from 'react';
import { Users } from 'lucide-react';
import { useSharedData } from '../../context/SharedDataContext';
import { formatInt, formatPercent } from '../../utils/format';
import RadialProgress from './RadialProgress';
import TrendBadge from './TrendBadge';
import ExportButtons from './ExportButtons';
import { LoadingState, ErrorState } from './StatusState';

export default function PositivacaoHero() {
  const { cobertura, coberturaAnterior } = useSharedData();
  const captureRef = useRef(null);

  const loading = cobertura.loading;
  const data = cobertura.data;
  const pct = data?.percentual_cobertura ?? 0;
  const positivados = data?.clientes_compraram ?? 0;
  const base = data?.total_clientes_ativos ?? 0;
  const naoPositivados = Math.max(base - positivados, 0);

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-5 py-3.5">
        <div>
          <p className="text-sm font-bold text-ink-primary">Positivação</p>
          <p className="text-xs text-ink-muted">Clientes que compraram no período · base total da empresa</p>
        </div>
        <ExportButtons title="Positivacao" captureRef={captureRef} />
      </div>

      <div ref={captureRef} className="capture-surface px-6 py-6">
        {loading && <LoadingState label="Carregando positivação..." />}
        {!loading && cobertura.error && <ErrorState message={cobertura.error} onRetry={cobertura.refetch} />}
        {!loading && !cobertura.error && (
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
            <RadialProgress value={pct} label={formatPercent(pct)} sublabel="positivação" size={148} stroke={14} />

            <div className="hidden h-24 w-px bg-hairline sm:block" />

            <div className="flex flex-1 flex-col gap-4">
              <div>
                <p className="tabular text-2xl font-bold text-ink-primary">
                  {formatInt(positivados)} <span className="text-base font-medium text-ink-muted">de {formatInt(base)} clientes</span>
                </p>
                <div className="mt-1">
                  <TrendBadge valorAtual={pct} valorAnterior={coberturaAnterior.data?.percentual_cobertura} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-hairline bg-page-alt px-3.5 py-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-lassa-green-600">
                    <span className="h-2 w-2 rounded-full bg-lassa-green-500" />
                    Positivados
                  </div>
                  <p className="tabular mt-1 text-xl font-bold text-ink-primary">{formatInt(positivados)}</p>
                </div>
                <div className="rounded-md border border-hairline bg-page-alt px-3.5 py-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
                    <Users size={12} />
                    Não positivados
                  </div>
                  <p className="tabular mt-1 text-xl font-bold text-ink-primary">{formatInt(naoPositivados)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
