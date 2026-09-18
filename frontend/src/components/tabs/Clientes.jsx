import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useApiData } from '../../hooks/useApiData';
import { getClientesNovosPeriodo, getClientesTop } from '../../services/api';
import { formatCurrency, formatInt } from '../../utils/format';
import { filtrarPorMacro, rotuloMacroFiltro } from '../../utils/businessRules';
import { normalizarRotaLista } from '../../utils/wibiRota';
import SectionCard from '../common/SectionCard';
import Table from '../common/Table';
import Badge from '../common/Badge';

const topColumns = [
  { key: 'nome_cliente', label: 'Cliente', align: 'left' },
  {
    key: 'area',
    label: 'Área',
    align: 'left',
    format: (v) => (v ? <Badge tone="blue">{v}</Badge> : <span className="text-ink-muted">—</span>),
  },
  { key: 'valor_total_raw', label: 'Faturamento', align: 'right', format: formatCurrency },
  { key: 'quantidade_pedidos', label: 'Pedidos', align: 'right', format: formatInt },
  { key: 'ticket_medio', label: 'Ticket Médio', align: 'right', format: formatCurrency },
];

const novosColumns = [
  { key: 'nome_cliente', label: 'Cliente', align: 'left' },
  {
    key: 'novo',
    label: 'Status',
    align: 'left',
    format: () => <Badge tone="green">Cliente novo</Badge>,
  },
  { key: 'valor_total_raw', label: 'Faturamento', align: 'right', format: formatCurrency },
  { key: 'quantidade_pedidos', label: 'Pedidos', align: 'right', format: formatInt },
];

export default function Clientes() {
  const { periodo, filters } = useFilters();
  const [busca, setBusca] = useState('');

  const top = useApiData(() => getClientesTop({ ...periodo, limit: 50 }), [periodo.dataInicio, periodo.dataFim], {
    initialData: [],
  });
  const novos = useApiData(() => getClientesNovosPeriodo(periodo), [periodo.dataInicio, periodo.dataFim], {
    initialData: [],
  });

  const topRows = useMemo(() => {
    const normalizados = normalizarRotaLista(top.data) ?? [];
    let rows = filtrarPorMacro(normalizados, filters.macroFilter, { areaField: 'area' });
    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      rows = rows.filter((r) => r.nome_cliente?.toLowerCase().includes(termo));
    }
    return rows.slice(0, 30);
  }, [top.data, filters.macroFilter, busca]);

  const novosRows = useMemo(() => {
    const normalizados = normalizarRotaLista(novos.data) ?? [];
    return filtrarPorMacro(normalizados, filters.macroFilter, { areaField: 'area' }).slice(0, 20);
  }, [novos.data, filters.macroFilter]);

  return (
    <div className="flex flex-col gap-5">
      <SectionCard
        title="Clientes por Faturamento"
        subtitle={rotuloMacroFiltro(filters.macroFilter)}
        columns={topColumns}
        rows={topRows}
        loading={top.loading}
        error={top.error}
        onRetry={top.refetch}
        isEmpty={topRows.length === 0}
        bodyClassName="p-3"
        headerExtra={
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar cliente..."
              className="focus-ring rounded-md border border-hairline bg-surface py-1.5 pl-8 pr-3 text-xs text-ink-primary"
            />
          </div>
        }
      >
        <Table columns={topColumns} rows={topRows} rowKey="nome_cliente" dense />
      </SectionCard>

      <SectionCard
        title="Clientes Novos no Período"
        subtitle={`${rotuloMacroFiltro(filters.macroFilter)} · cadastrados na janela selecionada`}
        columns={novosColumns}
        rows={novosRows}
        loading={novos.loading}
        error={novos.error}
        onRetry={novos.refetch}
        isEmpty={novosRows.length === 0}
        bodyClassName="p-3"
      >
        <Table columns={novosColumns} rows={novosRows} rowKey="nome_cliente" dense />
      </SectionCard>
    </div>
  );
}
