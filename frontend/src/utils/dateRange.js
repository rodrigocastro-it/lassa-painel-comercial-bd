function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

export function mesAtualRange() {
  const now = new Date();
  const ref = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  return { dataInicio: toISODate(startOfMonth(ref)), dataFim: toISODate(endOfMonth(ref)) };
}

export function mesAnteriorRange() {
  const now = new Date();
  const ref = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
  return { dataInicio: toISODate(startOfMonth(ref)), dataFim: toISODate(endOfMonth(ref)) };
}

export function anoAtualRange() {
  const now = new Date();
  return {
    dataInicio: `${now.getFullYear()}-01-01`,
    dataFim: toISODate(new Date(Date.UTC(now.getFullYear(), 11, 31))),
  };
}

/** Número de dias corridos entre duas datas ISO (inclusive). */
export function diasNoPeriodo(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) return 0;
  const inicio = new Date(`${dataInicio}T00:00:00Z`);
  const fim = new Date(`${dataFim}T00:00:00Z`);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) return 0;
  const diff = Math.round((fim - inicio) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(diff, 1);
}

export function anoDaData(dataISO) {
  if (!dataISO) return String(new Date().getFullYear());
  return dataISO.slice(0, 4);
}

/**
 * Período imediatamente anterior, com a mesma duração (em dias corridos) do
 * período informado — usado para calcular variações ("+4,8% vs período
 * anterior") sem depender de nenhum endpoint novo no backend.
 */
export function periodoAnteriorEquivalente(dataInicio, dataFim) {
  const dias = diasNoPeriodo(dataInicio, dataFim);
  const inicio = new Date(`${dataInicio}T00:00:00Z`);
  const fimAnterior = new Date(inicio);
  fimAnterior.setUTCDate(fimAnterior.getUTCDate() - 1);
  const inicioAnterior = new Date(fimAnterior);
  inicioAnterior.setUTCDate(inicioAnterior.getUTCDate() - (dias - 1));
  return { dataInicio: toISODate(inicioAnterior), dataFim: toISODate(fimAnterior) };
}

export const PERIOD_PRESETS = [
  { id: 'mes-atual', label: 'Mês Atual', getRange: mesAtualRange },
  { id: 'mes-anterior', label: 'Mês Anterior', getRange: mesAnteriorRange },
  { id: 'ano-atual', label: 'Ano Atual', getRange: anoAtualRange },
  { id: 'custom', label: 'Personalizado', getRange: null },
];
