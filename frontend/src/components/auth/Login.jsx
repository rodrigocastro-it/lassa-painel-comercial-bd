import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginPiloto } from '../../services/api';

const BARRAS = [36, 52, 46, 84, 100, 116, 148];

function BarrasDecorativas() {
  return (
    <div className="flex items-end gap-3">
      {BARRAS.map((altura, idx) => (
        <div
          key={idx}
          className={`w-7 rounded-t-sm sm:w-9 ${idx === BARRAS.length - 1 ? 'bg-lassa-rose-500' : 'bg-white/15'}`}
          style={{ height: altura }}
        />
      ))}
    </div>
  );
}

function PainelMarca() {
  return (
    <div className="relative flex w-full flex-col justify-center overflow-hidden bg-lassa-navy-950 px-8 py-14 text-white sm:px-12 lg:w-[52%] lg:px-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(60% 50% at 15% 0%, rgba(42,120,214,0.25) 0%, transparent 60%), radial-gradient(45% 40% at 100% 100%, rgba(236,111,146,0.12) 0%, transparent 60%)',
        }}
      />

      <div className="relative mx-auto w-full max-w-[520px]">
        <img src="/logo-lassa.png" alt="Lassa" className="h-20 w-auto object-contain sm:h-24" />

        <p className="mt-8 text-xs font-bold uppercase tracking-[0.14em] text-lassa-blue-200">Análise comercial</p>
        <h1 className="mt-2 text-[38px] font-extrabold leading-[1.08] tracking-tight sm:text-[48px]">
          Clareza para cada
          <br />
          <span className="text-lassa-rose-500">decisão comercial.</span>
        </h1>
        <p className="mt-5 max-w-sm text-base leading-relaxed text-white/60">
          Resultados, equipes e clientes. Uma visão mais simples do seu negócio.
        </p>

        <div className="mt-12">
          <BarrasDecorativas />
          <p className="mt-3 text-xs text-white/40">Lassa · Gestão comercial</p>
        </div>
      </div>
    </div>
  );
}

export default function Login({ onSuccess }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usuario.trim() || !senha) {
      setErro('Informe usuário e senha.');
      return;
    }
    setLoading(true);
    setErro('');
    try {
      const resultado = await loginPiloto(usuario.trim(), senha);
      onSuccess(resultado.usuario ?? usuario.trim());
    } catch (err) {
      setErro(
        err?.response?.status === 401
          ? 'Usuário ou senha incorretos.'
          : 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface lg:flex-row">
      <PainelMarca />

      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-[420px]">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-lassa-maroon-600">Piloto Lassa</p>
          <h2 className="mt-2 text-[30px] font-extrabold leading-tight text-ink-primary sm:text-[32px]">
            Acessar análise comercial
          </h2>
          <p className="mt-2 text-[15px] text-ink-secondary">Use o acesso compartilhado com a equipe de validação.</p>

          <form onSubmit={handleSubmit} className="mt-9 flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-ink-primary">Usuário</span>
              <input
                type="text"
                autoComplete="username"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="focus-ring rounded-md border border-hairline-strong px-4 py-3.5 text-base text-ink-primary"
                placeholder=""
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-ink-primary">Senha</span>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="focus-ring w-full rounded-md border border-hairline-strong px-4 py-3.5 pr-12 text-base text-ink-primary"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-muted hover:text-ink-primary"
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {erro && (
              <p className="rounded-md border border-lassa-red-tint-border bg-lassa-red-tint px-3.5 py-2.5 text-sm font-medium text-lassa-red-600">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="focus-ring flex items-center justify-center gap-2 rounded-md bg-lassa-maroon-700 py-3.5 text-base font-bold text-white shadow-sm transition-colors hover:bg-lassa-maroon-600 disabled:opacity-70"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>Entrar <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="mt-7 text-sm leading-relaxed text-ink-muted">
            Acesso restrito à equipe de teste. O módulo executivo usa dados reais do WiBi; use seu usuário e senha
            combinados com a Lassa para entrar.
          </p>
        </div>
      </div>
    </div>
  );
}
