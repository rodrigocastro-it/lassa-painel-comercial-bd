import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { formatDecimal } from '../../utils/format';

/**
 * Selo compacto de variação percentual vs. período anterior.
 * `positivoEhBom` inverte a semântica de cor (ex.: cancelamentos: subir é ruim).
 */
export default function TrendBadge({ valorAtual, valorAnterior, positivoEhBom = true, suffix = '% vs período anterior' }) {
  if (valorAnterior === undefined || valorAnterior === null || !Number.isFinite(valorAtual)) return null;
  if (!valorAnterior) return null;

  const variacao = ((valorAtual - valorAnterior) / Math.abs(valorAnterior)) * 100;
  if (!Number.isFinite(variacao)) return null;

  const estavel = Math.abs(variacao) < 0.05;
  const positivo = variacao > 0;
  const bom = estavel ? null : positivo === positivoEhBom;

  const Icon = estavel ? Minus : positivo ? ArrowUpRight : ArrowDownRight;
  const tone = estavel ? 'text-ink-muted' : bom ? 'text-lassa-green-600' : 'text-lassa-red-600';

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${tone}`}>
      <Icon size={13} strokeWidth={2.5} />
      {estavel ? 'Estável' : `${positivo ? '+' : ''}${formatDecimal(variacao)}${suffix}`}
    </span>
  );
}
