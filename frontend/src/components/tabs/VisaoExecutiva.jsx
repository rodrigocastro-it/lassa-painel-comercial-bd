import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Banknote, ClipboardList, Users, TrendingUp, Percent, UserPlus, Undo2, Gift, XCircle } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useSharedData } from '../../context/SharedDataContext';
import { useApiData } from '../../hooks/useApiData';
import {
  getKpisTotais,
  getKpisCobertura,
  getKpisCancelamentos,
  getKpisClientesNovos,
  getKpisTrocas,
  getKpisBonificacoes,
  getVendasMes,
} from '../../services/api';
import { formatCurrency, formatCurrencyCompact, formatDecimal, formatInt, formatPercent } from '../../utils/format';
import { diasNoPeriodo } from '../../utils/dateRange';
import { filtrarPorMacro, MACRO_FILTERS } from '../../utils/businessRules';
import KpiCard from '../common/KpiCard';
import SectionCard from '../common/SectionCard';
import Table from '../common/Table';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function buildResumoAreaRows(vendedores, canais, macroFilter) {
  const hasArea = vendedores.some((v) => v.area);

  if (hasArea) {
    const grupos = new Map();
    vendedores.forEach((v) => {
      const chave = `${v.area ?? '—'}|${v.supervisor ?? '—'}`;
      if (!grupos.has(chave)) {
        grupos.set(chave, {
          area: v.area ?? '—',
          supervisor: v.supervisor ?? '—',
          valor_total: 0,
          pedidos: 0,
          clientes: 0,
        });
      }
      const g = grupos.get(chave);
      g.valor_total += Number(v.valor_total_raw) || 0;
      g.pedidos += Number(v.quantidade_pedidos) || 0;
      g.clientes += Number(v.clientes_atendidos) || 0;
    });
    return filtrarPorMacro(Array.from(grupos.values()), macroFilter, { areaField: 'area' });
  }

  const rows = canais.map((c) => ({
    area: c.canal,
    supervisor: '—',
    valor_total: Number(c.total_vendas) || 0,
    pedidos: Number(c.total_pedidos) || 0,
    clientes: Number(c.clientes_atendidos) || 0,
  }));
  return filtrarPorMacro(rows, macroFilter, { areaField: 'area', canalField: 'area' });
}

/** Evita mostrar "R$ 0,00" / "0" quando o dado não pôde ser carregado. */
function kpiVal(hookState, formatter) {
  if (hookState.loading) return '';
  if (hookState.error || hookState.data == null) return '—';
  return formatter(hookState.data);
}

const resumoColumns = [
  { key: 'area', label: 'Área', align: 'left' },
  { key: 'supervisor', label: 'Gerente / Supervisor', align: 'left' },
  { key: 'valor_total', label: 'VL Total s/ ICMS', align: 'right', format: formatCurrency },
  { key: 'pedidos', label: 'Pedidos Lançados', align: 'right', format: formatInt },
  { key: 'clientes', label: 'Clientes Atendidos', align: 'right', format: formatInt },
];

export default function VisaoExecutiva() {
  const { filters, periodo, ano } = useFilters();
  const { vendedores, canais, loadingCanais, errorCanais } = useSharedData();

  const totais = useApiData(() => getKpisTotais(periodo), [periodo.dataInicio, periodo.dataFim]);
  const cobertura = useApiData(() => getKpisCobertura(periodo), [periodo.dataInicio, periodo.dataFim]);
  const cancelamentos = useApiData(() => getKpisCancelamentos(periodo), [periodo.dataInicio, periodo.dataFim]);
  const clientesNovos = useApiData(() => getKpisClientesNovos(periodo), [periodo.dataInicio, periodo.dataFim]);
  const trocas = useApiData(() => getKpisTrocas(periodo), [periodo.dataInicio, periodo.dataFim]);
  const bonificacoes = useApiData(() => getKpisBonificacoes(periodo), [periodo.dataInicio, periodo.dataFim]);
  const vendasMes = useApiData(() => getVendasMes({ ano }), [ano], { initialData: [] });

  const dias = diasNoPeriodo(filters.dataInicio, filters.dataFim);
  const mediaPedidosDia = totais.data?.total_pedidos ? totais.data.total_pedidos / dias : 0;

  const resumoRows = useMemo(
    () => buildResumoAreaRows(vendedores, canais, filters.macroFilter),
    [vendedores, canais, filters.macroFilter],
  );

  const totalGeral = useMemo(
    () =>
      resumoRows.reduce(
        (acc, row) => ({
          area: 'Total Geral',
          supervisor: '',
          valor_total: acc.valor_total + row.valor_total,
          pedidos: acc.pedidos + row.pedidos,
          clientes: acc.clientes + row.clientes,
        }),
        { area: 'Total Geral', supervisor: '', valor_total: 0, pedidos: 0, clientes: 0 },
      ),
    [resumoRows],
  );

  const vendasMesChart = (vendasMes.data ?? []).map((row) => ({
    mes: MESES[(row.mes_num ?? 1) - 1],
    faturamento: Number(row.faturamento) || 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Faturamento Total s/ ICMS"
            value={kpiVal(totais, (d) => formatCurrency(d.total_vendas))}
            icon={Banknote}
            tone="blue"
            loading={totais.loading}
          />
          <KpiCard
            label="Pedidos Lançados"
            value={kpiVal(totais, (d) => formatInt(d.total_pedidos))}
            icon={ClipboardList}
            tone="blue"
            loading={totais.loading}
          />
          <KpiCard
            label="Clientes Atendidos"
            value={kpiVal(cobertura, (d) => formatInt(d.clientes_compraram))}
            icon={Users}
            tone="green"
            loading={cobertura.loading}
            hint={cobertura.data ? `Cobertura: ${formatPercent(cobertura.data.percentual_cobertura)}` : undefined}
          />
          <KpiCard
            label="Média de Pedidos / Dia"
            value={kpiVal(totais, () => formatDecimal(mediaPedidosDia))}
            icon={TrendingUp}
            tone="blue"
            loading={totais.loading}
            hint={`${dias} dia(s) corridos no período`}
          />
        </div>
        <p className="mt-2 text-[11px] text-ink-muted">
          Os indicadores acima refletem o total da empresa no período. O filtro Grandes Redes / Varejo já é aplicado
          na tabela e nos demais blocos abaixo; nos KPIs de topo será aplicado assim que o backend aceitar o
          parâmetro <code>area</code> nesses endpoints.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Ticket Médio"
          value={kpiVal(totais, (d) => formatCurrency(d.ticket_medio))}
          icon={Banknote}
          tone="neutral"
          loading={totais.loading}
        />
        <KpiCard
          label="Cobertura de Base"
          value={kpiVal(cobertura, (d) => formatPercent(d.percentual_cobertura))}
          icon={Percent}
          tone="neutral"
          loading={cobertura.loading}
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
        />
        <KpiCard
          label="Trocas"
          value={kpiVal(trocas, (d) => formatCurrencyCompact(d.valor))}
          icon={Undo2}
          tone="neutral"
          loading={trocas.loading}
          hint={trocas.data ? `${formatInt(trocas.data.qtd)} pedido(s)` : undefined}
        />
        <KpiCard
          label="Bonificações"
          value={kpiVal(bonificacoes, (d) => formatCurrencyCompact(d.valor))}
          icon={Gift}
          tone="neutral"
          loading={bonificacoes.loading}
          hint={bonificacoes.data ? `${formatInt(bonificacoes.data.qtd)} pedido(s)` : undefined}
        />
      </div>

      <SectionCard
        title="Resumo por Área / Supervisor"
        subtitle="Faturamento, pedidos e clientes atendidos no mês, consolidado como a diretoria acompanha hoje"
        columns={resumoColumns}
        rows={resumoRows}
        loading={loadingCanais}
        error={errorCanais}
        isEmpty={resumoRows.length === 0}
      >
        <Table columns={resumoColumns} rows={resumoRows} totalsRow={totalGeral} rowKey="area" />
        {filters.macroFilter !== MACRO_FILTERS.GERAL && resumoRows.length === 0 && (
          <p className="mt-2 text-xs text-ink-muted">
            Nenhuma linha classificada como {filters.macroFilter === MACRO_FILTERS.GRANDES_REDES ? 'Grandes Redes' : 'Varejo'} no período.
          </p>
        )}
      </SectionCard>

      <SectionCard
        title={`Faturamento Mensal — ${ano}`}
        subtitle="Evolução do faturamento s/ ICMS ao longo do ano (fonte: /api/vendas/mes)"
        loading={vendasMes.loading}
        error={vendasMes.error}
        isEmpty={vendasMesChart.length === 0}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={vendasMesChart} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e3e7ee" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#4b5565' }} axisLine={{ stroke: '#c3c9d4' }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12, fill: '#4b5565' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCurrencyCompact(v)}
              width={64}
            />
            <Tooltip formatter={(value) => formatCurrency(value)} labelStyle={{ color: '#0b0f19' }} />
            <Bar dataKey="faturamento" fill="#2a78d6" radius={[4, 4, 0, 0]} maxBarSize={28} name="Faturamento" />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>
    </div>
  );
}
