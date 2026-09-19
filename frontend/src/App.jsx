import { useState } from 'react';
import { LayoutDashboard, Users, UserSquare2, Package, LogOut } from 'lucide-react';
import Header from './components/layout/Header';
import SegmentSwitch from './components/layout/SegmentSwitch';
import FiltersPopover from './components/layout/FiltersPopover';
import TabNav from './components/layout/TabNav';
import ConceitosInfo from './components/layout/ConceitosInfo';
import Login from './components/auth/Login';
import VisaoGeral from './components/tabs/VisaoGeral';
import Vendedores from './components/tabs/Vendedores';
import Clientes from './components/tabs/Clientes';
import Produtos from './components/tabs/Produtos';
import { FilterProvider } from './context/FilterContext';
import { SharedDataProvider } from './context/SharedDataContext';
import { useAuth } from './hooks/useAuth';

const TABS = [
  { id: 'visao-geral', label: 'Visão Geral', icon: LayoutDashboard, Component: VisaoGeral },
  { id: 'vendedores', label: 'Vendedores', icon: Users, Component: Vendedores },
  { id: 'clientes', label: 'Clientes', icon: UserSquare2, Component: Clientes },
  { id: 'produtos', label: 'Produtos', icon: Package, Component: Produtos },
];

function DashboardShell({ usuario, onLogout }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.Component ?? VisaoGeral;

  return (
    <div className="min-h-screen bg-page">
      <Header
        right={
          <>
            <ConceitosInfo />
            <button
              type="button"
              onClick={onLogout}
              title={`Sair (${usuario})`}
              aria-label="Sair"
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-page-alt hover:text-lassa-red-600"
            >
              <LogOut size={16} />
            </button>
          </>
        }
      />

      <div className="sticky top-[57px] z-20 border-b border-hairline bg-surface">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <SegmentSwitch />
          <FiltersPopover />
        </div>
      </div>

      <main className="mx-auto flex max-w-[1680px] flex-col gap-5 px-5 py-6 sm:px-8">
        <TabNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        <div className="animate-fade-in">
          <ActiveComponent onVerVendedores={() => setActiveTab('vendedores')} />
        </div>
      </main>

      <footer className="mx-auto max-w-[1680px] px-5 pb-8 pt-2 text-center text-[11px] text-ink-muted sm:px-8">
        Lassa · Painel de Inteligência Comercial — dados em tempo real via API interna
      </footer>
    </div>
  );
}

export default function App() {
  const { session, login, logout } = useAuth();

  if (!session) {
    return <Login onSuccess={login} />;
  }

  return (
    <FilterProvider>
      <SharedDataProvider>
        <DashboardShell usuario={session.usuario} onLogout={logout} />
      </SharedDataProvider>
    </FilterProvider>
  );
}
