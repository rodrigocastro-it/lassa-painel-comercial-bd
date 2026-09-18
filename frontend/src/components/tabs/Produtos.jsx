import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Search } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useSharedData } from '../../context/SharedDataContext';
import { useApiData } from '../../hooks/useApiData';
import { getProdutosLista, getVendasMes } from '../../services/api';
import { formatCurrency, formatCurrencyCompact, formatPercent } from '../../utils/format';
import SectionCard from '../common/SectionCard';
import Table from '../common/Table';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const produtosColumns = [
  { key: 'descricao_produto', label: 'Produto', align: 'left' },
  { key: 'faturamento', label: 'Faturamento no Ano', align: 'right', format: formatCurrency },
];

function SegmentoContext() {
  const { canais, loadingCanais } = useSharedData();
  const total = canais.reduce((acc, c) => acc + (Number(c.total_vendas) || 0), 0);

  if (loadingCanais || total === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-md border border-hairline bg-page-alt px-4 py-3 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Faturamento por segmento</span>
      {canais.map((c) => (
        <span key={c.canal} className="tabular font-semibold text-ink-primary">
          {c.canal}: {formatCurrencyCompact(c.total_vendas)}{' '}
          <span className="text-xs font-normal text-ink-muted">({formatPercent(((Number(c.total_vendas) || 0) / total) * 100)})</span>
        </span>
      ))}
    </div>
  );
}

export default function Produtos() {
  const { ano } = useFilters();
  const [busca, setBusca] = useState('');

  const produtos = useApiData(() => getProdutosLista({ ano }), [ano], { initialData: [] });
  const vendasMes = useApiData(() => getVendasMes({ ano }), [ano], { initialData: [] });

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const rows = (produtos.data ?? []).filter((p) => (termo ? p.descricao_produto?.toLowerCase().includes(termo) : true));
    return rows.slice(0, 40);
  }, [produtos.data, busca]);

  const vendasMesChart = (vendasMes.data ?? []).map((row) => ({
    mes: MESES[(row.mes_num ?? 1) - 1],
    faturamento: Number(row.faturamento) || 0,
  }));

  return (
    <div className="flex flex-col gap-5">
      <SegmentoContext />

      <SectionCard
        title={`Faturamento Mensal — ${ano}`}
        subtitle="Evolução do faturamento s/ ICMS ao longo do ano"
        loading={vendasMes.loading}
        error={vendasMes.error}
        onRetry={vendasMes.refetch}
        isEmpty={vendasMesChart.length === 0}
      >
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={vendasMesChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e9f0" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#4d5666' }} axisLine={{ stroke: '#c3c9d4' }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#4d5666' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyCompact(v)} width={72} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Bar dataKey="faturamento" fill="#2a78d6" radius={[4, 4, 0, 0]} maxBarSize={32} name="Faturamento" />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard
        title="Produtos Mais Vendidos"
        subtitle={`Ranking por faturamento no ano de ${ano}`}
        columns={produtosColumns}
        rows={produtosFiltrados}
        loading={produtos.loading}
        error={produtos.error}
        onRetry={produtos.refetch}
        isEmpty={produtosFiltrados.length === 0}
        bodyClassName="p-3"
        headerExtra={
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produto..."
              className="focus-ring rounded-md border border-hairline bg-surface py-1.5 pl-8 pr-3 text-xs text-ink-primary"
            />
          </div>
        }
      >
        <Table columns={produtosColumns} rows={produtosFiltrados} rowKey="id_produto" dense />
      </SectionCard>
    </div>
  );
}
