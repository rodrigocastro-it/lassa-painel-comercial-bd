import { useCallback, useState } from 'react';

const STORAGE_KEY = 'lassa_session';

function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Sessão simples de acesso compartilhado do piloto (ver /api/auth/login). */
export function useAuth() {
  const [session, setSession] = useState(readSession);

  const login = useCallback((usuario) => {
    const value = { usuario, loggedInAt: new Date().toISOString() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // localStorage indisponível (ex.: navegação privada) — segue só em memória.
    }
    setSession(value);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignora
    }
    setSession(null);
  }, []);

  return { session, login, logout };
}
