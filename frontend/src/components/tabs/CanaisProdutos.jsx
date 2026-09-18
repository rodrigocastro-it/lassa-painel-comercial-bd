import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Search } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useSharedData } from '../../context/SharedDataContext';
import { useApiData } from '../../hooks/useApiData';
import { getProdutosLista } from '../../services/api';
import { formatCurrency, formatCurrencyCompact, formatInt } from '../../utils/format';
import { filtrarPorMacro } from '../../utils/businessRules';
import SectionCard from '../common/SectionCard';
import Table from '../common/Table';

const canaisColumns = [
  { key: 'canal', label: 'Canal', align: 'left' },
  { key: 'total_vendas', label: 'Faturamento s/ ICMS', align: 'right', format: formatCurrency },
  { key: 'total_pedidos', label: 'Pedidos', align: 'right', format: formatInt },
  { key: 'clientes_atendidos', label: 'Clientes Atendidos', align: 'right', format: formatInt },
];

const produtosColumns = [
  { key: 'descricao_produto', label: 'Produto', align: 'left' },
  { key: 'faturamento', label: 'Faturamento no Ano', align: 'right', format: formatCurrency },
];

export default function CanaisProdutos() {
  const { filters, ano } = useFilters();
  const { canais, loadingCanais, errorCanais } = useSharedData();
  const [buscaProduto, setBuscaProduto] = useState('');

  const produtos = useApiData(() => getProdutosLista({ ano }), [ano], { initialData: [] });

  const canaisFiltrados = useMemo(
    () => filtrarPorMacro(canais ?? [], filters.macroFilter, { areaField: 'area', canalField: 'canal' }),
    [canais, filters.macroFilter],
  );

  const produtosFiltrados = useMemo(() => {
    const termo = buscaProduto.trim().toLowerCase();
    const rows = (produtos.data ?? []).filter((p) =>
      termo ? p.descricao_produto?.toLowerCase().includes(termo) : true,
    );
    return rows.slice(0, 30);
  }, [produtos.data, buscaProduto]);

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Resumo por Canal de Distribuição"
        subtitle="Grandes Redes vs. Varejo Tradicional — classificação automática pela carteira de clientes"
        columns={canaisColumns}
        rows={canaisFiltrados}
        loading={loadingCanais}
        error={errorCanais}
        isEmpty={canaisFiltrados.length === 0}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={canaisFiltrados} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e3e7ee" vertical={false} />
            <XAxis dataKey="canal" tick={{ fontSize: 12, fill: '#4b5565' }} axisLine={{ stroke: '#c3c9d4' }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 12, fill: '#4b5565' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCurrencyCompact(v)}
              width={64}
            />
            <Tooltip formatter={(value, name) => (name === 'total_vendas' ? formatCurrency(value) : formatInt(value))} />
            <Legend
              formatter={(value) => (value === 'total_vendas' ? 'Faturamento' : 'Pedidos')}
              wrapperStyle={{ fontSize: 12, color: '#4b5565' }}
            />
            <Bar dataKey="total_vendas" fill="#2a78d6" radius={[4, 4, 0, 0]} maxBarSize={48} name="total_vendas" />
          </BarChart>
        </ResponsiveContainer>
        <Table columns={canaisColumns} rows={canaisFiltrados} rowKey="canal" dense />
      </SectionCard>

      <SectionCard
        title="Produtos Mais Vendidos"
        subtitle={`Ranking por faturamento no ano de ${ano} (fonte: /api/produtos/lista)`}
        columns={produtosColumns}
        rows={produtosFiltrados}
        loading={produtos.loading}
        error={produtos.error}
        onRetry={produtos.refetch}
        isEmpty={produtosFiltrados.length === 0}
        headerExtra={
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              value={buscaProduto}
              onChange={(e) => setBuscaProduto(e.target.value)}
              placeholder="Buscar produto..."
              className="rounded-lg border border-hairline bg-surface py-1.5 pl-8 pr-3 text-xs text-ink-primary"
            />
          </div>
        }
      >
        <Table columns={produtosColumns} rows={produtosFiltrados} rowKey="id_produto" dense />
      </SectionCard>
    </div>
  );
}
