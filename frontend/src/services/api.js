import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

function clean(params = {}) {
  const out = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') out[key] = value;
  });
  return out;
}

async function get(path, params) {
  const { data } = await api.get(path, { params: clean(params) });
  return data;
}

// --- Status ---
export const getStatus = () => get('/status');

// --- Autenticação (acesso compartilhado do piloto) ---
export const loginPiloto = async (usuario, senha) => {
  const { data } = await api.post('/auth/login', { usuario, senha });
  return data;
};

// --- KPIs ---
export const getKpisTotais = (periodo) => get('/kpis/totais', periodo);
export const getKpisCobertura = (periodo) => get('/kpis/cobertura', periodo);
export const getKpisCancelamentos = (periodo) => get('/kpis/cancelamentos', periodo);
export const getKpisClientesNovos = (periodo) => get('/kpis/clientes-novos', periodo);
export const getKpisTrocas = (periodo) => get('/kpis/trocas', periodo);
export const getKpisBonificacoes = (periodo) => get('/kpis/bonificacoes', periodo);

// --- Vendas ---
export const getVendasDiario = (periodo) => get('/vendas/diario', periodo);
export const getVendasMes = (params) => get('/vendas/mes', params);
export const getVendasProdutosMes = (params) => get('/vendas/produtos-mes', params);

// --- Canais ---
export const getCanaisResumo = (periodo) => get('/canais/resumo', periodo);

// --- Produtos ---
export const getProdutosLista = (params) => get('/produtos/lista', params);

// --- Clientes ---
export const getClientesTop = (params) => get('/clientes/top', params);
export const getClientesNovosPeriodo = (periodo) => get('/clientes/novos-periodo', periodo);
export const getClientesTopTroca = (periodo) => get('/clientes/top-troca', periodo);
export const getClientesTopBonificacao = (periodo) => get('/clientes/top-bonificacao', periodo);

// --- Vendedores ---
export const getVendedoresTop = (periodo) => get('/vendedores/top', periodo);
export const getVendedoresResumo = (periodo) => get('/vendedores/resumo', periodo);
export const getVendedoresClientesNovosMes = (params) => get('/vendedores/clientes-novos-mes', params);
