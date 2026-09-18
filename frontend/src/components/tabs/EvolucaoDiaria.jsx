import { useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useFilters } from '../../context/FilterContext';
import { useApiData } from '../../hooks/useApiData';
import { getVendasDiario } from '../../services/api';
import { formatCurrency, formatCurrencyCompact, formatDateShort, formatInt } from '../../utils/format';
import { filtrarPorMacro, MACRO_FILTERS } from '../../utils/businessRules';
import { normalizarRotaLista } from '../../utils/wibiRota';
import SectionCard from '../common/SectionCard';
import Table from '../common/Table';

/**
 * `/api/vendas/diario` retorna uma linha por dia+área (para permitir o corte
 * Grandes Redes/Varejo). Depois de aplicar o macro filtro, soma de volta para
 * uma linha por dia — o gráfico e a detecção de picos trabalham no total do
 * dia (ou do segmento selecionado), nunca em linhas fragmentadas por área.
 */
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

function withAnomalias(rows) {
  if (rows.length < 3) return rows.map((r) => ({ ...r, pico: false }));
  const valores = rows.map((r) => r.total_pedidos);
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  const variancia = valores.reduce((a, b) => a + (b - media) ** 2, 0) / valores.length;
  const desvio = Math.sqrt(variancia);
  const limite = media + 1.5 * desvio;
  return rows.map((r) => ({ ...r, pico: desvio > 0 && r.total_pedidos > limite }));
}

const crosstabColumns = [
  { key: 'dia', label: 'Dia', align: 'left', format: formatDateShort },
  { key: 'total_pedidos', label: 'Pedidos', align: 'right', format: formatInt },
  { key: 'total_vendas', label: 'Faturamento', align: 'right', format: formatCurrency },
  {
    key: 'pico',
    label: 'Classificação',
    align: 'left',
    format: (v) =>
      v ? (
        <span className="rounded-full bg-lassa-orange-tint px-2 py-0.5 text-xs font-semibold text-lassa-orange-500">
          Pico
        </span>
      ) : (
        <span className="text-xs text-ink-muted">Normal</span>
      ),
  },
];

export default function EvolucaoDiaria() {
  const { periodo, filters } = useFilters();
  const { data, loading, error, refetch } = useApiData(
    () => getVendasDiario(periodo),
    [periodo.dataInicio, periodo.dataFim],
    { initialData: [] },
  );

  const rows = useMemo(() => normalizarRotaLista(data) ?? [], [data]);
  const hasArea = rows.some((r) => r.area);

  const filteredRows = useMemo(() => {
    if (!hasArea) return rows;
    return filtrarPorMacro(rows, filters.macroFilter, { areaField: 'area' });
  }, [rows, hasArea, filters.macroFilter]);

  const porDia = useMemo(() => agregarPorDia(filteredRows), [filteredRows]);
  const comAnomalias = useMemo(() => withAnomalias(porDia), [porDia]);
  const picos = comAnomalias.filter((r) => r.pico);
  const showMacroGapNotice = !hasArea && filters.macroFilter !== MACRO_FILTERS.GERAL;

  return (
    <div className="flex flex-col gap-6">
      {showMacroGapNotice && (
        <p className="rounded-lg border border-lassa-amber-tint-border bg-lassa-amber-tint px-3 py-2 text-xs text-ink-secondary">
          A evolução diária ainda não pode ser segmentada por Grandes Redes / Varejo: o endpoint{' '}
          <code>/api/vendas/diario</code> não retorna o campo <code>area</code> por linha. Exibindo o total da
          empresa.
        </p>
      )}

      <SectionCard
        title="Evolução Diária de Pedidos"
        subtitle="Quantidade de pedidos lançados por dia — dias em destaque (laranja) indicam picos (> média + 1,5 desvio padrão)"
        columns={crosstabColumns}
        rows={comAnomalias}
        loading={loading}
        error={error}
        onRetry={refetch}
        isEmpty={comAnomalias.length === 0}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={comAnomalias} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e3e7ee" vertical={false} />
            <XAxis dataKey="dia" tickFormatter={formatDateShort} tick={{ fontSize: 11, fill: '#4b5565' }} axisLine={{ stroke: '#c3c9d4' }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#4b5565' }} axisLine={false} tickLine={false} width={48} allowDecimals={false} />
            <Tooltip
              labelFormatter={formatDateShort}
              formatter={(value, name) => [formatInt(value), name === 'total_pedidos' ? 'Pedidos' : name]}
            />
            <Bar dataKey="total_pedidos" radius={[4, 4, 0, 0]} maxBarSize={22} name="Pedidos">
              {comAnomalias.map((entry) => (
                <Cell key={entry.dia} fill={entry.pico ? '#eb6834' : '#2a78d6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-lassa-orange-500" />
          Dia de pico de pedidos ({picos.length} no período)
        </div>
      </SectionCard>

      <SectionCard
        title="Evolução Diária de Faturamento"
        subtitle="Faturamento s/ ICMS por dia no período selecionado"
        loading={loading}
        error={error}
        onRetry={refetch}
        isEmpty={comAnomalias.length === 0}
      >
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={comAnomalias} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e3e7ee" vertical={false} />
            <XAxis dataKey="dia" tickFormatter={formatDateShort} tick={{ fontSize: 11, fill: '#4b5565' }} axisLine={{ stroke: '#c3c9d4' }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12, fill: '#4b5565' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCurrencyCompact(v)}
              width={64}
            />
            <Tooltip labelFormatter={formatDateShort} formatter={(value) => formatCurrency(value)} />
            <Area type="monotone" dataKey="total_vendas" stroke="#1c5cab" strokeWidth={2} fill="#2a78d6" fillOpacity={0.1} name="Faturamento" />
          </AreaChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard
        title="Tabela Cruzada — Dias x Pedidos"
        subtitle="Detalhamento diário para exportação"
        columns={crosstabColumns}
        rows={comAnomalias}
        loading={loading}
        error={error}
        onRetry={refetch}
        isEmpty={comAnomalias.length === 0}
      >
        <Table columns={crosstabColumns} rows={comAnomalias} rowKey="dia" dense />
      </SectionCard>
    </div>
  );
}
