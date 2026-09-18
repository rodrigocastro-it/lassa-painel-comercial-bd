import { useState } from 'react';
import { LayoutDashboard, TrendingUp, Users, Layers } from 'lucide-react';
import Header from './components/layout/Header';
import MacroFilterBar from './components/layout/MacroFilterBar';
import FiltersBar from './components/layout/FiltersBar';
import TabNav from './components/layout/TabNav';
import ConceitosInfo from './components/layout/ConceitosInfo';
import VisaoExecutiva from './components/tabs/VisaoExecutiva';
import EvolucaoDiaria from './components/tabs/EvolucaoDiaria';
import RankingVendedores from './components/tabs/RankingVendedores';
import CanaisProdutos from './components/tabs/CanaisProdutos';
import { FilterProvider } from './context/FilterContext';
import { SharedDataProvider } from './context/SharedDataContext';

const TABS = [
  { id: 'visao-executiva', label: 'Visão Executiva', icon: LayoutDashboard, Component: VisaoExecutiva },
  { id: 'evolucao-diaria', label: 'Evolução Diária', icon: TrendingUp, Component: EvolucaoDiaria },
  { id: 'ranking-vendedores', label: 'Ranking de Vendedores', icon: Users, Component: RankingVendedores },
  { id: 'canais-produtos', label: 'Canais e Produtos', icon: Layers, Component: CanaisProdutos },
];

function DashboardShell() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.Component ?? VisaoExecutiva;

  return (
    <div className="min-h-screen bg-page">
      <Header />
      <main className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MacroFilterBar />
          <ConceitosInfo />
        </div>

        <FiltersBar />

        <div className="rounded-xl border border-hairline bg-surface">
          <TabNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
          <div className="p-4 sm:p-5">
            <ActiveComponent />
          </div>
        </div>
      </main>
      <footer className="mx-auto max-w-[1600px] px-4 pb-8 pt-2 text-center text-[11px] text-ink-muted sm:px-6">
        Lassa · Painel de Inteligência Comercial — dados em tempo real via API interna
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <FilterProvider>
      <SharedDataProvider>
        <DashboardShell />
      </SharedDataProvider>
    </FilterProvider>
  );
}
