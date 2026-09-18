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

export default function Header({ right }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const { online } = useApiStatus();

  return (
    <header className="sticky top-0 z-30 bg-surface shadow-xs">
      <div className="h-[3px] bg-gradient-to-r from-lassa-blue-800 via-lassa-blue-500 to-lassa-blue-800" />
      <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <div className="flex items-center gap-3.5">
          {logoFailed ? (
            <LassaLogoFallback />
          ) : (
            <img
              src="/logo-lassa.png"
              alt="Lassa"
              className="h-11 w-auto object-contain"
              onError={() => setLogoFailed(true)}
            />
          )}
          <div className="hidden border-l border-hairline pl-3.5 sm:block">
            <p className="text-[15px] font-bold leading-tight text-ink-primary">Inteligência Comercial</p>
            <p className="text-xs text-ink-muted">Painel executivo</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {right}
          <div
            className={`flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-semibold ${
              online
                ? 'border-lassa-green-tint-border bg-lassa-green-tint text-lassa-green-600'
                : 'border-lassa-red-tint-border bg-lassa-red-tint text-lassa-red-600'
            }`}
            title={online ? 'Conectado à API do backend' : 'Sem conexão com a API do backend'}
          >
            {online ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span className="hidden sm:inline">{online ? 'Conectado' : 'Offline'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
