import { useMemo, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Banknote, ClipboardList, Gift, UserPlus, XCircle, ChevronRight } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useSharedData } from '../../context/SharedDataContext';
import { useApiData } from '../../hooks/useApiData';
import { getKpisBonificacoes, getKpisClientesNovos, getKpisCancelamentos, getVendasDiario } from '../../services/api';
import { formatCurrency, formatCurrencyCompact, formatDateShort, formatInt } from '../../utils/format';
import { filtrarPorMacro, rotuloMacroFiltro } from '../../utils/businessRules';
import { normalizarRotaLista } from '../../utils/wibiRota';
import KpiCard from '../common/KpiCard';
import TrendBadge from '../common/TrendBadge';
import SectionCard from '../common/SectionCard';
import PositivacaoHero from '../common/PositivacaoHero';

function kpiVal(hookState, formatter) {
  if (hookState.loading) return '';
  if (hookState.error || hookState.data == null) return '—';
  return formatter(hookState.data);
}

function withAnomalias(rows, metricKey) {
  if (rows.length < 3) return rows.map((r) => ({ ...r, pico: false }));
  const valores = rows.map((r) => r[metricKey]);
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  const variancia = valores.reduce((a, b) => a + (b - media) ** 2, 0) / valores.length;
  const desvio = Math.sqrt(variancia);
  const limite = media + 1.5 * desvio;
  return rows.map((r) => ({ ...r, pico: desvio > 0 && r[metricKey] > limite }));
}

function agregarPorDia(rows) {
  const porDia = new Map();
  rows.forEach((r) => {
    const atual = porDia.get(r.dia) ?? { dia: r.dia, total_vendas: 0, total_pedidos: 0 };
    atual.total_vendas += Number(r.total_vendas) || 0;
    atual.total_pedidos += Number(r.total_pedidos) || 0;
    porDia.set(r.dia, atual);
  });
  return Array.from(porDia.values()).sort((a, b) => (a.dia < b.dia ? -1 : a.dia > b.dia ? 1 : 0));
}

const METRICAS = [
  { key: 'total_vendas', label: 'Faturamento', format: formatCurrency, formatCompact: formatCurrencyCompact },
  { key: 'total_pedidos', label: 'Pedidos', format: formatInt, formatCompact: formatInt },
];

export default function VisaoGeral({ onVerVendedores }) {
  const { periodo, filters } = useFilters();
  const { totais, totaisAnterior, vendedores, loadingVendedores } = useSharedData();
  const [metrica, setMetrica] = useState('total_vendas');

  const clientesNovos = useApiData(() => getKpisClientesNovos(periodo), [periodo.dataInicio, periodo.dataFim]);
  const cancelamentos = useApiData(() => getKpisCancelamentos(periodo), [periodo.dataInicio, periodo.dataFim]);
  const bonificacoes = useApiData(() => getKpisBonificacoes(periodo), [periodo.dataInicio, periodo.dataFim]);

  const diario = useApiData(() => getVendasDiario(periodo), [periodo.dataInicio, periodo.dataFim], { initialData: [] });
  const diarioRows = useMemo(() => normalizarRotaLista(diario.data) ?? [], [diario.data]);
  const diarioFiltrado = useMemo(
    () => filtrarPorMacro(diarioRows, filters.macroFilter, { areaField: 'area' }),
    [diarioRows, filters.macroFilter],
  );
  const porDia = useMemo(() => agregarPorDia(diarioFiltrado), [diarioFiltrado]);
  const comAnomalias = useMemo(() => withAnomalias(porDia, metrica), [porDia, metrica]);

  const vendedoresSegmento = useMemo(
    () => filtrarPorMacro(vendedores, filters.macroFilter, { areaField: 'area' }),
    [vendedores, filters.macroFilter],
  );
  const topVendedores = useMemo(
    () => [...vendedoresSegmento].sort((a, b) => (b.valor_total_raw || 0) - (a.valor_total_raw || 0)).slice(0, 5),
    [vendedoresSegmento],
  );
  const maxVendedor = topVendedores[0]?.valor_total_raw || 1;

  return (
    <div className="flex flex-col gap-5">
      <PositivacaoHero />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Faturamento s/ ICMS"
          value={kpiVal(totais, (d) => formatCurrencyCompact(d.total_vendas))}
          icon={Banknote}
          tone="blue"
          loading={totais.loading}
          trend={<TrendBadge valorAtual={totais.data?.total_vendas} valorAnterior={totaisAnterior.data?.total_vendas} />}
        />
        <KpiCard
          label="Pedidos Lançados"
          value={kpiVal(totais, (d) => formatInt(d.total_pedidos))}
          icon={ClipboardList}
          tone="blue"
          loading={totais.loading}
          trend={<TrendBadge valorAtual={totais.data?.total_pedidos} valorAnterior={totaisAnterior.data?.total_pedidos} />}
        />
        <KpiCard
          label="Ticket Médio"
          value={kpiVal(totais, (d) => formatCurrency(d.ticket_medio))}
          icon={Banknote}
          tone="neutral"
          loading={totais.loading}
        />
        <KpiCard
          label="Clientes Novos"
          value={kpiVal(clientesNovos, (d) => formatInt(d.clientes_novos))}
          icon={UserPlus}
          tone="green"
          loading={clientesNovos.loading}
        />
        <KpiCard
          label="Cancelamentos"
          value={kpiVal(cancelamentos, (d) => formatInt(d.cancelamentos))}
          icon={XCircle}
          tone="red"
          loading={cancelamentos.loading}
          hint="requer atenção"
        />
        <KpiCard
          label="Bonificações"
          value={kpiVal(bonificacoes, (d) => formatCurrencyCompact(d.valor))}
          icon={Gift}
          tone="violet"
          loading={bonificacoes.loading}
          hint={bonificacoes.data ? `${formatInt(bonificacoes.data.qtd)} pedido(s)` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard
            title="Evolução Diária"
            subtitle={`${rotuloMacroFiltro(filters.macroFilter)} · dias em destaque indicam picos`}
            columns={[
              { key: 'dia', label: 'Dia', format: formatDateShort },
              { key: 'total_vendas', label: 'Faturamento', format: formatCurrency },
              { key: 'total_pedidos', label: 'Pedidos', format: formatInt },
            ]}
            rows={comAnomalias}
            loading={diario.loading}
            error={diario.error}
            onRetry={diario.refetch}
            isEmpty={comAnomalias.length === 0}
            headerExtra={
              <div className="flex rounded-md border border-hairline bg-page-alt p-0.5">
                {METRICAS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMetrica(m.key)}
                    className={`rounded-sm px-2.5 py-1 text-xs font-semibold transition-colors ${
                      metrica === m.key ? 'bg-surface text-lassa-blue-700 shadow-xs' : 'text-ink-muted hover:text-ink-primary'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={280}>
              {metrica === 'total_vendas' ? (
                <AreaChart data={comAnomalias} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillFaturamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2a78d6" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#2a78d6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6e9f0" vertical={false} />
                  <XAxis dataKey="dia" tickFormatter={formatDateShort} tick={{ fontSize: 11, fill: '#4d5666' }} axisLine={{ stroke: '#c3c9d4' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#4d5666' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v)} width={72} />
                  <Tooltip labelFormatter={formatDateShort} formatter={(value) => [formatCurrency(value), 'Faturamento']} />
                  <Area type="monotone" dataKey="total_vendas" stroke="#1c5cab" strokeWidth={2.5} fill="url(#fillFaturamento)" />
                </AreaChart>
              ) : (
                <BarChart data={comAnomalias} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6e9f0" vertical={false} />
                  <XAxis dataKey="dia" tickFormatter={formatDateShort} tick={{ fontSize: 11, fill: '#4d5666' }} axisLine={{ stroke: '#c3c9d4' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#4d5666' }} axisLine={false} tickLine={false} width={44} allowDecimals={false} />
                  <Tooltip labelFormatter={formatDateShort} formatter={(value) => [formatInt(value), 'Pedidos']} />
                  <Bar dataKey="total_pedidos" radius={[4, 4, 0, 0]} maxBarSize={22}>
                    {comAnomalias.map((entry) => (
                      <Cell key={entry.dia} fill={entry.pico ? '#eb6834' : '#2a78d6'} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </SectionCard>
        </div>

        <SectionCard
          title="Top Vendedores"
          subtitle={rotuloMacroFiltro(filters.macroFilter)}
          loading={loadingVendedores}
          isEmpty={topVendedores.length === 0}
          headerExtra={
            onVerVendedores && (
              <button
                type="button"
                onClick={onVerVendedores}
                className="flex items-center gap-0.5 text-xs font-semibold text-lassa-blue-700 hover:underline"
              >
                Ver todos
                <ChevronRight size={13} />
              </button>
            )
          }
        >
          <div className="flex flex-col gap-3">
            {topVendedores.map((v, idx) => (
              <div key={v.nome_vendedor} className="flex items-center gap-3">
                <span className="tabular w-4 text-xs font-bold text-ink-muted">{idx + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-ink-primary">{v.nome_vendedor}</p>
                    <p className="tabular shrink-0 text-sm font-bold text-ink-primary">{formatCurrencyCompact(v.valor_total_raw)}</p>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-pill bg-page-alt">
                    <div
                      className="h-full rounded-pill bg-lassa-blue-500"
                      style={{ width: `${Math.max(6, ((v.valor_total_raw || 0) / maxVendedor) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
