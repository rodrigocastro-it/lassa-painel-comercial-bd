import { useMemo, useState } from 'react';
import { Search, Banknote, ShoppingBag, Users, UserPlus, TrendingUp, Info } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useSharedData } from '../../context/SharedDataContext';
import { formatCurrency, formatDecimal, formatInt } from '../../utils/format';
import { diasNoPeriodo } from '../../utils/dateRange';
import { filtrarPorMacro, rotuloMacroFiltro } from '../../utils/businessRules';
import SectionCard from '../common/SectionCard';
import Badge from '../common/Badge';
import Drawer from '../common/Drawer';

function VendedorRow({ v, max, onClick }) {
  const pct = Math.max(4, ((v.valor_total_raw || 0) / max) * 100);
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring group flex w-full items-center gap-4 rounded-md px-3 py-3 text-left transition-colors hover:bg-page-alt"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-semibold text-ink-primary">{v.nome_vendedor}</p>
          <p className="tabular shrink-0 text-sm font-bold text-ink-primary">{formatCurrency(v.valor_total_raw)}</p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-page-alt">
          <div className="h-full rounded-pill bg-lassa-blue-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ink-muted">
          <span>{formatInt(v.quantidade_pedidos)} pedidos</span>
          <span>{formatInt(v.clientes_atendidos)} clientes</span>
          <span>{formatInt(v.clientes_novos)} novos</span>
          <span className="tabular">Tíquete {formatCurrency(v.ticket_medio)}</span>
        </div>
      </div>
    </button>
  );
}

function DetalheStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-md border border-hairline bg-page-alt px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
        <Icon size={13} />
        {label}
      </div>
      <p className="tabular mt-1 text-lg font-bold text-ink-primary">{value}</p>
    </div>
  );
}

export default function Vendedores() {
  const { filters } = useFilters();
  const { vendedores, loadingVendedores, errorVendedores } = useSharedData();
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState(null);

  const dias = diasNoPeriodo(filters.dataInicio, filters.dataFim);

  const filtrados = useMemo(() => {
    let rows = filtrarPorMacro(vendedores, filters.macroFilter, { areaField: 'area' });
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
  }, [vendedores, filters, busca]);

  const grupos = useMemo(() => {
    const hasArea = filtrados.some((v) => v.area);
    if (!hasArea) return [{ area: null, rows: filtrados }];
    const map = new Map();
    filtrados.forEach((row) => {
      const key = row.area || '—';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    });
    return Array.from(map.entries()).map(([area, rows]) => ({ area, rows }));
  }, [filtrados]);

  const maxGlobal = Math.max(...filtrados.map((v) => v.valor_total_raw || 0), 1);

  const exportColumns = [
    { key: 'nome_vendedor', label: 'Vendedor' },
    { key: 'area', label: 'Área' },
    { key: 'valor_total_raw', label: 'Venda Total s/ ICMS', format: formatCurrency },
    { key: 'quantidade_pedidos', label: 'Pedidos', format: formatInt },
    { key: 'clientes_atendidos', label: 'Clientes Atendidos', format: formatInt },
    { key: 'clientes_novos', label: 'Clientes Novos', format: formatInt },
    { key: 'ticket_medio', label: 'Ticket Médio', format: formatCurrency },
  ];

  const mediaPedidosDiaSelecionado = selecionado ? (Number(selecionado.quantidade_pedidos) || 0) / (dias || 1) : 0;

  return (
    <div className="flex flex-col gap-5">
      <SectionCard
        title="Vendedores"
        subtitle={`${rotuloMacroFiltro(filters.macroFilter)} · ordenado por faturamento`}
        columns={exportColumns}
        rows={filtrados}
        loading={loadingVendedores}
        error={errorVendedores}
        isEmpty={filtrados.length === 0}
        bodyClassName="p-3"
        headerExtra={
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar vendedor..."
              className="focus-ring rounded-md border border-hairline bg-surface py-1.5 pl-8 pr-3 text-xs text-ink-primary"
            />
          </div>
        }
      >
        <div className="flex flex-col divide-y divide-hairline">
          {grupos.map(({ area, rows }) => (
            <div key={area ?? 'todos'} className="py-2 first:pt-0 last:pb-0">
              {area && (
                <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-lassa-blue-700">
                  Área {area} · {rows.length}
                </p>
              )}
              <div className="flex flex-col">
                {rows.map((v) => (
                  <VendedorRow key={v.nome_vendedor} v={v} max={maxGlobal} onClick={() => setSelecionado(v)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <Drawer
        open={Boolean(selecionado)}
        onClose={() => setSelecionado(null)}
        title={selecionado?.nome_vendedor}
        subtitle={selecionado?.area ? `Área ${selecionado.area}` : undefined}
      >
        {selecionado && (
          <div className="flex flex-col gap-5">
            <div className="rounded-md border border-hairline bg-page-alt px-4 py-4">
              <p className="text-xs font-semibold text-ink-muted">Venda total s/ ICMS no período</p>
              <p className="tabular mt-1 text-3xl font-extrabold text-ink-primary">{formatCurrency(selecionado.valor_total_raw)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <DetalheStat icon={ShoppingBag} label="Pedidos" value={formatInt(selecionado.quantidade_pedidos)} />
              <DetalheStat icon={Banknote} label="Ticket Médio" value={formatCurrency(selecionado.ticket_medio)} />
              <DetalheStat icon={Users} label="Clientes Atendidos" value={formatInt(selecionado.clientes_atendidos)} />
              <DetalheStat icon={UserPlus} label="Clientes Novos" value={formatInt(selecionado.clientes_novos)} />
              <DetalheStat icon={TrendingUp} label={`Média Pedidos/Dia (${dias}d)`} value={formatDecimal(mediaPedidosDiaSelecionado)} />
              {selecionado.zona && <DetalheStat icon={Info} label="Zona" value={selecionado.zona} />}
            </div>

            {(selecionado.zona || selecionado.setor || selecionado.rota) && (
              <div className="flex flex-wrap gap-2">
                {selecionado.area && <Badge tone="blue">Área {selecionado.area}</Badge>}
                {selecionado.zona && <Badge tone="neutral">Zona {selecionado.zona}</Badge>}
                {selecionado.setor && <Badge tone="neutral">Setor {selecionado.setor}</Badge>}
                {selecionado.rota && <Badge tone="neutral">Rota {selecionado.rota}</Badge>}
              </div>
            )}

            <p className="rounded-md border border-hairline bg-page-alt px-3.5 py-3 text-xs leading-relaxed text-ink-muted">
              A carteira completa deste vendedor (clientes previstos, positivados e não positivados
              individualmente) depende de um agregado que a API ainda não expõe — hoje o que existe é o
              total de clientes que <strong>de fato compraram</strong> no período (acima). Assim que o
              backend tiver esse endpoint, a lista de clientes aparece aqui automaticamente.
            </p>
          </div>
        )}
      </Drawer>
    </div>
  );
}
