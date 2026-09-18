# Lassa · Painel de Inteligência Comercial (Front-end)

Dashboard executivo em React + Vite + Tailwind CSS para a diretoria da Lassa,
consumindo a API Node.js/Express do repositório (`server.js` na raiz).

## Estrutura do painel (IA)

O painel é organizado em 4 telas, todas sempre dentro de um dos dois modelos
de negócio (ver seção "Grandes Redes x Varejo" abaixo):

1. **Visão Geral** — hero de Positivação (indicador central, com anel de
   progresso), KPIs principais, evolução diária (Faturamento/Pedidos com
   toggle) e um preview dos top 5 vendedores do segmento selecionado.
2. **Vendedores** — ranking visual (barras horizontais) agrupado por Área;
   clicar em um vendedor abre um drawer com o detalhamento disponível.
3. **Clientes** — clientes por faturamento e clientes novos no período,
   ambos filtráveis por Grandes Redes/Varejo.
4. **Produtos** — contexto comparativo de faturamento por segmento,
   evolução mensal do ano e ranking de produtos.

Os antigos 4 KPIs/abas ("Visão Executiva", "Evolução Diária", "Ranking de
Vendedores", "Canais e Produtos") foram redistribuídos nessa nova IA — a
lógica de negócio e os dados são os mesmos, só a apresentação mudou.

## Stack

- React 19 + Vite
- Tailwind CSS v4 (tema de marca Lassa definido em `src/index.css`)
- Recharts (gráficos)
- lucide-react (ícones)
- axios (cliente HTTP)
- xlsx, jspdf + jspdf-autotable, html2canvas (exportação Excel / PDF / PNG)

## Como rodar

Rode em **dois terminais simultâneos**:

```bash
# Terminal 1 — Backend (na raiz do repositório)
npm install
cp .env.example .env   # preencha DB_USER, DB_PASSWORD, DB_SERVER, DB_DATABASE
node server.js          # sobe em http://localhost:8787

# Terminal 2 — Front-end (obrigatoriamente dentro de /frontend, é onde fica o Vite)
cd frontend
npm install
cp .env.example .env   # já aponta para http://localhost:8787/api
npm run dev             # abre em http://localhost:5173
```

O front-end lê a URL base da API de `VITE_API_BASE_URL` (arquivo `.env`).
A porta `8787` é o padrão fixo em `server.js` (`process.env.PORT || 8787`) —
se seu `.env` da raiz não definir `PORT`, é essa a porta que sobe. Se o
indicador no canto superior direito do painel ficar em "API offline" mesmo
com o backend rodando, o motivo quase sempre é esse descompasso de porta
entre os dois `.env`.

## Logo

A logo oficial (PNG, fundo transparente) já está em
`frontend/public/logo-lassa.png` e é carregada automaticamente pelo
`Header` (`src/components/layout/Header.jsx`). Os favicons
(`favicon-16.png`, `favicon-32.png`, `favicon-180.png`) foram recortados a
partir dela (o ícone do copo/gota). Para trocar a logo no futuro, basta
substituir esse arquivo — nenhuma alteração de código é necessária; se o
arquivo estiver ausente, o Header cai automaticamente para um logotipo
textual "LASSA" como placeholder.

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
    layout/                 # Header, SegmentSwitch, FiltersPopover, TabNav, ConceitosInfo
    common/                 # KpiCard, PositivacaoHero, RadialProgress, TrendBadge, Badge,
                             # Drawer, Table, SectionCard, ExportButtons, estados de loading/erro
    tabs/                   # VisaoGeral, Vendedores, Clientes, Produtos
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
`VisaoGeral.jsx` (vendas diárias), então os componentes de UI nunca
trabalham com a chave bruta diretamente.

## Grandes Redes x Varejo

Regra de negócio (ver também o botão "O que é Grandes Redes / Varejo?" no
próprio dashboard):

- **Grandes Redes**: Área que **começa com `G`** (ou é classificada como
  **Especiais**) no ERP WiBi.
- **Varejo**: **catch-all** — todas as demais Áreas (A, B, C, E e quaisquer
  outras que existam ou venham a existir).

A classificação (`classificarArea` em `src/utils/businessRules.js`) é feita
pelo campo `area` já normalizado (ver seção acima). O `SegmentSwitch`
(`src/components/layout/SegmentSwitch.jsx`) é um controle de 2 estados só
— Grandes Redes ou Varejo, sempre um dos dois, nunca "geral" — que dirige
o que é mostrado em Vendedores, Clientes, Evolução Diária (via
`filtrarPorMacro`) e no card de contexto em Produtos (via `canal`, já
calculado por `/api/canais/resumo`, que classifica por nome do cliente).
**Os KPIs de topo e o hero de Positivação continuam com o total da
empresa**, já que `/api/kpis/totais` e `/api/kpis/cobertura` não aceitam
filtro por área — isso é indicado explicitamente na UI ("base total da
empresa").

## Filtros em cascata (Área → Zona → Setor → Rota)

`FiltersPopover` (`src/components/layout/FiltersPopover.jsx`) implementa
cascata real: escolher uma Área restringe as opções de Zona às que
pertencem àquela área; escolher uma Zona restringe Setor; escolher um
Setor restringe Rota — e trocar um nível de cima limpa os níveis abaixo
automaticamente. As opções vêm de `/api/vendedores/resumo` (campo `area`,
já parseado pelo front em zona/setor/rota — ver seção acima); um vendedor
sem vínculo de rota não aparece nos filtros nem nos segmentos Grandes
Redes/Varejo.

## Status do campo `area` no backend

`v_clientes_rotas.es_codigo` é a coluna real que guarda a chave WiBi
(`001.A.0007.0007.0307`). O `server.js` já foi ajustado para devolver
`area` (a chave bruta, parseada no front por `wibiRota.js`) nestes
endpoints, sempre a partir de uma CTE que pré-agrega `v_clientes_rotas`
por vendedor/cliente **antes** de cruzar com as vendas — para não
multiplicar `SUM(valor_total)` caso um cliente/vendedor tenha mais de uma
linha na tabela de rotas:

| Endpoint | O que mudou |
|---|---|
| `/api/vendedores/resumo` | + coluna `area` |
| `/api/vendedores/top` | coluna `area` deixou de vir fixa como `''` |
| `/api/vendedores/clientes-novos-mes` | + coluna `area` (quebra o agrupamento por área também) |
| `/api/vendas/diario` | passou a retornar **uma linha por dia + área** (antes era uma linha por dia). O front (`VisaoGeral.jsx`) já soma de volta para uma linha por dia depois de aplicar o macro filtro — ver `agregarPorDia()`. |
| `/api/clientes/top`, `/api/clientes/novos-periodo`, `/api/clientes/top-troca`, `/api/clientes/top-bonificacao` | + coluna `area` |

Quando não há vínculo de rota para o cliente/vendedor, a API manda
`area: ''` (string vazia, não `'—'`) — o front trata isso como "não
classificado": o registro some dos filtros Grandes Redes/Varejo (para não
inflar nenhum dos dois grupos) e só aparece na Visão Geral, com "—" exibido
na tabela (`Table.jsx` converte `''`/`null` em "—" na hora de renderizar).

**O que ainda falta** (nenhuma é bug, só ausência de dado no backend — o
drawer de detalhe do vendedor em `Vendedores.jsx` já mostra uma nota curta
sobre isso para quem usa o painel, em vez de fingir que o dado existe):

- `supervisor` — não identificamos uma coluna equivalente a `es_codigo`
  para isso em `v_clientes_rotas` ou `wbx_vw_vendedores` ainda.
- **Carteira completa por vendedor** (clientes previstos vs. positivados
  vs. não positivados, individualmente) — nenhum endpoint atual expõe a
  base de clientes *esperada* de um vendedor, só quem *de fato* comprou.
  Precisaria de um novo agregado no backend (algo como "clientes
  atribuídos por vendedor/rota", cruzando `v_clientes_rotas` com a base
  ativa de clientes).
- A métrica "dias com venda na área" (dias distintos com pelo menos um
  pedido por vendedor) não é calculável com os endpoints atuais — seria
  necessário um novo agregado no backend.
- Removidas duas rotas duplicadas em `server.js` (`/api/vendedores/resumo`
  e `/api/clientes/top` estavam definidas duas vezes; o Express só usa a
  primeira, a segunda nunca era executada).

**Importante:** essas queries foram revisadas com cuidado (evitando o
padrão de JOIN direto que multiplicaria valores), mas não puderam ser
testadas contra o SQL Server real neste ambiente — rode a suíte local
(`npm test` na raiz, com `.env` apontando para o banco) ou teste manualmente
antes de considerar isso validado em produção.

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

## Design system

Tokens centralizados em `src/index.css` (`@theme`): paleta de marca
(`--color-lassa-*`), superfícies/tinta neutras, escalas de raio
(`--radius-sm` a `--radius-pill`) e sombra (`--shadow-xs` a `--shadow-lg`),
e utilitários (`.card`, `.card-hover`, `.focus-ring`, `.animate-fade-in`,
`.animate-slide-in-right`). Os componentes em `common/` (`KpiCard`,
`SectionCard`, `Table`, `Badge`, `TrendBadge`, `Drawer`, `RadialProgress`)
são os blocos reaproveitados por todas as telas — para manter consistência
visual, prefira editar esses componentes em vez de estilizar caso a caso
dentro de cada aba.

> **Gotcha de CSS a não reintroduzir:** um wrapper com `animation`/
> `transform` (como `.animate-fade-in`, usado para envolver o conteúdo de
> cada aba) vira *containing block* para qualquer `position: fixed`
> descendente — inclusive `translateY(0)` parado já conta. Isso quebrava o
> `Drawer` (ficava preso à altura do conteúdo, não da viewport). Por isso
> `.animate-fade-in` não usa mais `transform`, e o `Drawer` é renderizado
> via `createPortal(..., document.body)` — nunca dependa de nenhum
> ancestral estar "limpo" para um overlay `fixed` funcionar.

## Segmento único, sem "Visão Geral"

Por pedido explícito da diretoria, o filtro macro deixou de ter 3 estados
(Visão Geral/Grandes Redes/Varejo) e agora é um switch de 2 estados só —
o painel está sempre em um dos dois segmentos (`FilterContext` inicia em
Varejo). Isso significa que qualquer tela cujo dado real dependa de uma
visão consolidada dos dois segmentos ao mesmo tempo (ex.: o comparativo
Grandes Redes vs. Varejo em Produtos) usa a fonte de dado que **não**
depende do switch (`/api/canais/resumo`, chamado uma vez, mostrando os
dois números lado a lado) — não há mais um lugar para "ver tudo junto"
nas telas que dependem do campo `area`.
