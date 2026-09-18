# Lassa · Painel de Inteligência Comercial (Front-end)

Dashboard executivo em React + Vite + Tailwind CSS para a diretoria da Lassa,
consumindo a API Node.js/Express do repositório (`server.js` na raiz).

## Stack

- React 19 + Vite
- Tailwind CSS v4 (tema de marca Lassa definido em `src/index.css`)
- Recharts (gráficos)
- lucide-react (ícones)
- axios (cliente HTTP)
- xlsx, jspdf + jspdf-autotable, html2canvas (exportação Excel / PDF / PNG)

## Como rodar

```bash
# 1) Backend (na raiz do repositório)
npm install
cp .env.example .env   # preencha DB_USER, DB_PASSWORD, DB_SERVER, DB_DATABASE
npm start              # sobe em http://localhost:3000

# 2) Front-end (nesta pasta /frontend)
cd frontend
npm install
cp .env.example .env   # já aponta para http://localhost:3000/api
npm run dev            # abre em http://localhost:5173
```

O front-end lê a URL base da API de `VITE_API_BASE_URL` (arquivo `.env`).

## Logo

Coloque o arquivo PNG da logo (fundo transparente) em:

```
frontend/public/logo-lassa.png
```

O `Header` (`src/components/layout/Header.jsx`) já está preparado para
carregar esse arquivo automaticamente. Enquanto ele não existir, é exibido um
logotipo textual "LASSA" como placeholder — nenhuma alteração de código é
necessária ao adicionar o PNG.

## Estrutura de pastas

```
src/
  services/api.js           # todas as chamadas HTTP para a API (uma função por rota)
  context/
    FilterContext.jsx       # estado global: macro filtro, período, área/zona/setor/rota/vendedor
    SharedDataContext.jsx   # dados usados em mais de uma tela (vendedores/resumo, canais/resumo)
  hooks/
    useApiData.js           # fetch genérico com estados loading/error/refetch
    useApiStatus.js         # ping em /api/status para o indicador "API conectada/offline"
  utils/
    businessRules.js        # classificação Grandes Redes x Varejo
    wibiRota.js              # parse da chave de roteirização do WiBi (área/zona/setor/rota)
    dateRange.js             # presets de período e cálculo de dias
    format.js                # formatação pt-BR (moeda, número, data)
    exportUtils.js           # exportação Excel / PDF / PNG
  components/
    layout/                 # Header, MacroFilterBar, FiltersBar, TabNav, ConceitosInfo
    common/                 # KpiCard, Table, SectionCard, ExportButtons, estados de loading/erro
    tabs/                   # as 4 abas do dashboard
```

## Chave de roteirização do WiBi

O ERP WiBi identifica Área/Zona/Setor/Rota por uma chave única concatenada
por pontos, ex.: `001.A.0007.0007.0407`:

| Bloco | Exemplo | Significado |
|---|---|---|
| 1 | `001` | Coligada / Região |
| 2 | `A` | **Área** — `G` (ou "Especiais") = Grandes Redes; qualquer outra = Varejo |
| 3 | `0007` | **Zona** — célula do supervisor |
| 4 | `0007` | **Setor** — periodicidade da semana: 3 dígitos = ímpar/todas, 4 dígitos = par |
| 5 | `0407` | **Rota** — dia específico de atendimento |

`src/utils/wibiRota.js` faz o parse dessa chave (`parseChaveRota`) e expõe
`normalizarRota(item)` / `normalizarRotaLista(itens)`, que aceitam tanto os
campos já separados (`area`, `zona`, `setor`, `rota`) quanto a chave bruta —
em `item.area` ou em um campo candidato (`chave_rota`, `rota_completa`,
`codigo_rota`, `chave`) — e sempre devolvem o item com os 4 campos limpos.
Isso é aplicado automaticamente em `SharedDataContext` (vendedores) e em
`EvolucaoDiaria` (vendas diárias), então os componentes de UI nunca
trabalham com a chave bruta diretamente.

## Grandes Redes x Varejo

Regra de negócio (ver também o botão "O que é Grandes Redes / Varejo?" no
próprio dashboard):

- **Grandes Redes**: Área que **começa com `G`** (ou é classificada como
  **Especiais**) no ERP WiBi.
- **Varejo**: **catch-all** — todas as demais Áreas (A, B, C, E e quaisquer
  outras que existam ou venham a existir).

A classificação (`classificarArea` em `src/utils/businessRules.js`) é feita
pelo campo `area` já normalizado (ver seção acima). Enquanto esse campo não
estiver presente em todos os endpoints (ver seção abaixo), o bloco "Canais e
Produtos" usa como alternativa o campo `canal` já calculado por
`/api/canais/resumo` (que classifica por nome do cliente).

## Filtros em cascata (Área → Zona → Setor → Rota)

`FiltersBar` já implementa cascata real: escolher uma Área restringe as
opções de Zona às que pertencem àquela área; escolher uma Zona restringe
Setor; escolher um Setor restringe Rota — e trocar um nível de cima limpa
os níveis abaixo automaticamente. Hoje as opções vêm vazias (ver lacunas
abaixo) porque `/api/vendedores/resumo` ainda não retorna esses campos;
assim que retornar (limpos ou como chave bruta — ambos são aceitos, ver
seção acima), a cascata funciona sem nenhuma mudança de código.

## Lacunas conhecidas no backend (não são bugs do front)

O front-end já foi construído **esperando** os campos abaixo — assim que o
backend passar a retorná-los (limpos ou como a chave bruta do WiBi, ver
acima), os filtros e agrupamentos correspondentes ativam automaticamente,
sem nenhuma alteração de código:

| Campo esperado | Onde é usado | Endpoints que precisam passar a retorná-lo |
|---|---|---|
| `area` (ou chave bruta) | Filtro macro Grandes Redes/Varejo, coluna "Área" | `/api/vendedores/resumo`, `/api/vendas/diario` |
| `supervisor` | Coluna "Gerente/Supervisor" na Visão Executiva | `/api/vendedores/resumo` |
| `zona`, `setor`, `rota` (ou chave bruta) | Filtros em cascata | `/api/vendedores/resumo` |

Até lá:

- A tabela "Resumo por Área/Supervisor" usa `/api/canais/resumo` como
  origem (Grandes Redes vs. Varejo Tradicional), com a coluna Supervisor
  vazia.
- Os filtros de Área/Zona/Setor/Rota aparecem desabilitados com a nota
  "Aguardando o backend retornar este campo".
- O Ranking de Vendedores exibe uma lista única "Todos os Vendedores" em
  vez de agrupada por área/supervisor.
- A métrica "dias com venda na área" (dias distintos com pelo menos um
  pedido por vendedor) não é calculável com os endpoints atuais — seria
  necessário um novo agregado no backend.

Do lado do backend, falta apenas eu saber **em que coluna** de
`v_clientes_rotas` está a chave `001.A.0007.0007.0407` (ex.: `sp_columns
'v_clientes_rotas'`) para eu montar o `JOIN`/`SUBSTRING` em `server.js` e
os endpoints passarem a devolver esses campos de verdade.

## Exportação (Excel / PDF / PNG)

Todo bloco do dashboard tem os três botões no cabeçalho da seção. Detalhes
de implementação em `src/utils/exportUtils.js`:

- **Excel**: gera `.xlsx` com as mesmas colunas exibidas na tela.
- **PDF**: relatório com cabeçalho "Lassa — Painel de Inteligência
  Comercial", tabela formatada e rodapé com data/paginação.
- **Imagem (PNG)**: usa `html2canvas` para fotografar o bloco exatamente
  como está na tela — pronto para colar no grupo do WhatsApp.

> **Atenção ao editar estilos:** o Tailwind v4 usa `color-mix(in oklab, …)`
> para o modificador de opacidade `bg-cor/50`, `border-cor/30` etc. — uma
> função CSS que o `html2canvas` não consegue interpretar e que quebra a
> exportação em PNG do bloco. Por isso, **não use o modificador `/NN`** nos
> componentes; em vez disso, use um token sólido em hex definido em
> `src/index.css` (ex.: `bg-lassa-red-tint` em vez de `bg-lassa-red-500/10`).
