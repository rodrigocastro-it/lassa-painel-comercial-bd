import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useSharedData } from '../../context/SharedDataContext';
import { formatCurrency, formatDecimal, formatInt } from '../../utils/format';
import { diasNoPeriodo } from '../../utils/dateRange';
import { filtrarPorMacro } from '../../utils/businessRules';
import SectionCard from '../common/SectionCard';
import Table from '../common/Table';

function buildColumns(dias) {
  return [
    { key: 'nome_vendedor', label: 'Vendedor', align: 'left' },
    { key: 'area', label: 'Área', align: 'left' },
    { key: 'valor_total_raw', label: 'Venda Total s/ ICMS', align: 'right', format: formatCurrency },
    { key: 'quantidade_pedidos', label: 'Pedidos', align: 'right', format: formatInt },
    { key: 'clientes_atendidos', label: 'Clientes Atendidos', align: 'right', format: formatInt },
    { key: 'clientes_novos', label: 'Clientes Novos', align: 'right', format: formatInt },
    { key: 'ticket_medio', label: 'Ticket Médio', align: 'right', format: formatCurrency },
    {
      key: 'media_pedidos_dia',
      label: `Média Pedidos/Dia (${dias}d)`,
      align: 'right',
      format: formatDecimal,
    },
  ];
}

export default function RankingVendedores() {
  const { filters } = useFilters();
  const { vendedores, loadingVendedores, errorVendedores } = useSharedData();
  const [busca, setBusca] = useState('');

  const dias = diasNoPeriodo(filters.dataInicio, filters.dataFim);

  const enriquecidos = useMemo(
    () =>
      (vendedores ?? []).map((v) => ({
        ...v,
        area: v.area ?? '—',
        media_pedidos_dia: dias > 0 ? (Number(v.quantidade_pedidos) || 0) / dias : 0,
      })),
    [vendedores, dias],
  );

  const filtrados = useMemo(() => {
    let rows = filtrarPorMacro(enriquecidos, filters.macroFilter, { areaField: 'area' });
    if (filters.area) rows = rows.filter((r) => r.area === filters.area);
    if (filters.zona) rows = rows.filter((r) => r.zona === filters.zona);
    if (filters.setor) rows = rows.filter((r) => r.setor === filters.setor);
    if (filters.rota) rows = rows.filter((r) => r.rota === filters.rota);
    if (filters.vendedor) rows = rows.filter((r) => r.nome_vendedor === filters.vendedor);
    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      rows = rows.filter((r) => r.nome_vendedor?.toLowerCase().includes(termo));
    }
    return [...rows].sort((a, b) => (b.valor_total_raw || 0) - (a.valor_total_raw || 0));
  }, [enriquecidos, filters, busca]);

  const grupos = useMemo(() => {
    const hasArea = filtrados.some((v) => v.area && v.area !== '—');
    if (!hasArea) return [{ area: null, rows: filtrados }];
    const map = new Map();
    filtrados.forEach((row) => {
      const key = row.area || '—';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    });
    return Array.from(map.entries()).map(([area, rows]) => ({ area, rows }));
  }, [filtrados]);

  const columns = buildColumns(dias);

  const totalGeral = filtrados.reduce(
    (acc, r) => ({
      nome_vendedor: 'Total Geral',
      area: '',
      valor_total_raw: acc.valor_total_raw + (Number(r.valor_total_raw) || 0),
      quantidade_pedidos: acc.quantidade_pedidos + (Number(r.quantidade_pedidos) || 0),
      clientes_atendidos: acc.clientes_atendidos + (Number(r.clientes_atendidos) || 0),
      clientes_novos: acc.clientes_novos + (Number(r.clientes_novos) || 0),
      ticket_medio: 0,
      media_pedidos_dia: acc.media_pedidos_dia + (Number(r.media_pedidos_dia) || 0),
    }),
    {
      nome_vendedor: 'Total Geral',
      area: '',
      valor_total_raw: 0,
      quantidade_pedidos: 0,
      clientes_atendidos: 0,
      clientes_novos: 0,
      ticket_medio: 0,
      media_pedidos_dia: 0,
    },
  );
  totalGeral.ticket_medio = totalGeral.quantidade_pedidos > 0 ? totalGeral.valor_total_raw / totalGeral.quantidade_pedidos : 0;

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Ranking de Vendedores e Produtividade"
        subtitle="Venda total, positivação de clientes e produtividade por vendedor no período"
        columns={columns}
        rows={filtrados}
        loading={loadingVendedores}
        error={errorVendedores}
        isEmpty={filtrados.length === 0}
        headerExtra={
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar vendedor..."
              className="rounded-lg border border-hairline bg-surface py-1.5 pl-8 pr-3 text-xs text-ink-primary"
            />
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          {grupos.map(({ area, rows }) => {
            const subtotal = rows.reduce(
              (acc, r) => ({
                valor_total_raw: acc.valor_total_raw + (Number(r.valor_total_raw) || 0),
                quantidade_pedidos: acc.quantidade_pedidos + (Number(r.quantidade_pedidos) || 0),
                clientes_atendidos: acc.clientes_atendidos + (Number(r.clientes_atendidos) || 0),
                clientes_novos: acc.clientes_novos + (Number(r.clientes_novos) || 0),
                media_pedidos_dia: acc.media_pedidos_dia + (Number(r.media_pedidos_dia) || 0),
              }),
              { valor_total_raw: 0, quantidade_pedidos: 0, clientes_atendidos: 0, clientes_novos: 0, media_pedidos_dia: 0 },
            );
            return (
              <div key={area ?? 'todos'}>
                {area && (
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-lassa-blue-700">
                    Área {area} · {rows.length} vendedor(es)
                  </p>
                )}
                <Table
                  columns={columns}
                  rows={rows}
                  rowKey="nome_vendedor"
                  dense
                  totalsRow={
                    area
                      ? {
                          nome_vendedor: `Subtotal — Área ${area}`,
                          area: '',
                          ...subtotal,
                          ticket_medio: subtotal.quantidade_pedidos > 0 ? subtotal.valor_total_raw / subtotal.quantidade_pedidos : 0,
                        }
                      : undefined
                  }
                />
              </div>
            );
          })}
          {grupos.length > 1 && (
            <Table columns={columns} rows={[]} totalsRow={totalGeral} rowKey="nome_vendedor" dense />
          )}
        </div>
        <p className="mt-3 text-[11px] text-ink-muted">
          &quot;Média Pedidos/Dia&quot; considera os {dias} dia(s) corridos do período selecionado. A métrica de
          &quot;dias com venda na área&quot; (dias distintos com pelo menos um pedido por vendedor) depende de um
          novo agregado no backend — hoje não é exposta por nenhum endpoint.
        </p>
      </SectionCard>
    </div>
  );
}
