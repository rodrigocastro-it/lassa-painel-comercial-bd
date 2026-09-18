import { useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useApiStatus } from '../../hooks/useApiStatus';

function LassaLogoFallback() {
  return (
    <div className="flex items-baseline gap-1 select-none" aria-label="Lassa">
      <span className="text-2xl font-extrabold tracking-tight text-lassa-blue-700">LASSA</span>
      <span className="h-2 w-2 rounded-full bg-lassa-red-500" />
    </div>
  );
}

export default function Header() {
  const [logoFailed, setLogoFailed] = useState(false);
  const { online } = useApiStatus();

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-surface">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          {logoFailed ? (
            <LassaLogoFallback />
          ) : (
            <img
              src="/logo-lassa.png"
              alt="Lassa"
              className="h-10 w-auto object-contain"
              onError={() => setLogoFailed(true)}
            />
          )}
          <div className="hidden border-l border-hairline pl-3 sm:block">
            <p className="text-sm font-semibold text-ink-primary">Painel de Inteligência Comercial</p>
            <p className="text-xs text-ink-muted">Visão executiva para a diretoria</p>
          </div>
        </div>

        <div
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
            online
              ? 'border-lassa-green-tint-border bg-lassa-green-tint text-lassa-green-600'
              : 'border-lassa-red-tint-border bg-lassa-red-tint text-lassa-red-600'
          }`}
          title={online ? 'Conectado à API do backend' : 'Sem conexão com a API do backend'}
        >
          {online ? <Wifi size={14} /> : <WifiOff size={14} />}
          {online ? 'API conectada' : 'API offline'}
        </div>
      </div>
    </header>
  );
}
