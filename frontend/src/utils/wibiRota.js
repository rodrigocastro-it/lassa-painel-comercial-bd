// O ERP WiBi identifica a estrutura comercial de um cliente/vendedor por uma
// chave única concatenada por pontos, ex.: "001.A.0007.0007.0407":
//   Bloco 1 — Coligada/Região   (001)
//   Bloco 2 — Área              (A)     -> G = Grandes Redes; demais = Varejo
//   Bloco 3 — Zona              (0007)  -> célula do supervisor
//   Bloco 4 — Setor             (0007)  -> periodicidade da semana (3 dígitos = ímpar/todas, 4 = par)
//   Bloco 5 — Rota              (0407)  -> dia específico de atendimento
const CHAVE_ROTA_REGEX = /^\d+\.[A-Za-z0-9]+\.\d+\.\d+\.\d+$/;

/** Campos onde a chave bruta pode chegar, caso o backend não a separe ainda. */
const CAMPOS_CHAVE_CANDIDATOS = ['chave_rota', 'rota_completa', 'codigo_rota', 'chave'];

export function pareceChaveRota(valor) {
  return typeof valor === 'string' && CHAVE_ROTA_REGEX.test(valor.trim());
}

/** "0007" (4 dígitos) = semana par · "007"/"7" (até 3 dígitos) = ímpar/todas. */
export function periodicidadeSetor(setor) {
  if (!setor) return null;
  return String(setor).trim().length >= 4 ? 'Semana par' : 'Semana ímpar / todas';
}

/**
 * Quebra a chave "001.A.0007.0007.0407" em { coligada, area, zona, setor, rota }.
 * Retorna null se `chave` não tiver o formato esperado.
 */
export function parseChaveRota(chave) {
  if (!pareceChaveRota(chave)) return null;
  const [coligada, area, zona, setor, rota] = chave.trim().split('.');
  return { coligada, area, zona, setor, rota };
}

/**
 * Garante que um item vindo da API tenha `area`/`zona`/`setor`/`rota` como
 * valores simples, mesmo que o backend ainda envie a chave bruta do WiBi
 * (em `area` ou em um dos campos candidatos) em vez dos campos já separados.
 * Se os campos já vierem limpos, o item volta inalterado.
 */
export function normalizarRota(item) {
  if (!item) return item;
  if (item.area && !pareceChaveRota(item.area)) return item;

  const chave =
    (pareceChaveRota(item.area) && item.area) ||
    CAMPOS_CHAVE_CANDIDATOS.map((campo) => item[campo]).find(pareceChaveRota);

  const partes = chave ? parseChaveRota(chave) : null;
  if (!partes) return item;

  return {
    ...item,
    area: partes.area,
    zona: item.zona ?? partes.zona,
    setor: item.setor ?? partes.setor,
    rota: item.rota ?? partes.rota,
  };
}

export function normalizarRotaLista(itens) {
  return Array.isArray(itens) ? itens.map(normalizarRota) : itens;
}
