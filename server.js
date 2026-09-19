const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { getConnection } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8787;

// Rota de teste simples
app.get('/api/status', (req, res) => {
    res.json({ status: 'API Lassa Dashboard Operacional 🚀', timestamp: new Date() });
});

// --- Autenticação (acesso compartilhado do piloto) ---
// Checagem simples de usuário/senha em memória, configurável via AUTH_USERS
// no .env ("usuario:senha,usuario:senha,..."). Sem isso, usa os usuários
// padrão combinados com a Lassa, todos com o mesmo nível de acesso. Não é
// um sistema de contas de verdade (sem hash, sem sessão/token) — serve só
// como porta de entrada para a equipe de validação do piloto; os demais
// endpoints da API continuam abertos como sempre.
function parseAuthUsers(raw) {
    const pares = (raw || '')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => p.split(':'));
    const map = new Map();
    pares.forEach(([usuario, senha]) => {
        if (usuario && senha) map.set(usuario.trim().toLowerCase(), senha);
    });
    return map;
}

const AUTH_USERS_PADRAO = new Map([
    ['lassa', 'lassaleite'],
    ['moacirneto', 'moacirnetoleite'],
    ['moacirfilho', 'moacirfilholeite'],
    ['zuleika', 'zuleikaleite'],
]);

const AUTH_USERS = (() => {
    const doEnv = parseAuthUsers(process.env.AUTH_USERS);
    return doEnv.size > 0 ? doEnv : AUTH_USERS_PADRAO;
})();

app.post('/api/auth/login', (req, res) => {
    const { usuario, senha } = req.body || {};
    if (!usuario || !senha) {
        return res.status(400).json({ ok: false, error: 'Informe usuário e senha.' });
    }
    const chave = String(usuario).trim().toLowerCase();
    const senhaEsperada = AUTH_USERS.get(chave);
    if (!senhaEsperada || senhaEsperada !== senha) {
        return res.status(401).json({ ok: false, error: 'Usuário ou senha incorretos.' });
    }
    res.json({ ok: true, usuario: chave });
});

// Endpoint 1: Totais de Faturamento e Margem (Query kpi_totais)
app.get('/api/kpis/totais', async (req, res) => {
    try {
        const pool = await getConnection();
        const { dataInicio = '2026-09-01', dataFim = '2026-09-30' } = req.query;

        const query = `
            SELECT 
                ISNULL(SUM(v.valor_total), 0) AS total_vendas,
                COUNT(DISTINCT v.id_venda) AS total_pedidos,
                CASE 
                    WHEN COUNT(DISTINCT v.id_venda) > 0 THEN SUM(v.valor_total) / COUNT(DISTINCT v.id_venda) 
                    ELSE 0 
                END AS ticket_medio,
                CASE 
                    WHEN SUM(v.valor_total) > 0 THEN (SUM(v.valor_total) - SUM(v.quantidade)) / SUM(v.valor_total) * 100 
                    ELSE 0 
                END AS margem_media
            FROM bi.wbx_vw_vendas_validas v
            WHERE v.is_deleted = 0
              AND CAST(v.data_venda AS DATE) BETWEEN CAST(@dataInicio AS DATE) AND CAST(@dataFim AS DATE)
              AND v.status IN (2, 3, 4)
              AND v.bonif = 0
              AND v.troca = 0
        `;

        const result = await pool.request()
            .input('dataInicio', dataInicio)
            .input('dataFim', dataFim)
            .query(query);

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Erro na rota /api/kpis/totais:', error);
        res.status(500).json({ error: 'Erro ao consultar KPIs totais', details: error.message });
    }
});

// Endpoint 2: Resumo de Vendedores (Query Nativa do WiBi Web)
app.get('/api/vendedores/resumo', async (req, res) => {
    try {
        const pool = await getConnection();
        const { dataInicio = '2026-09-01', dataFim = '2026-09-30' } = req.query;

        const query = `
            WITH vendedores_universe AS (
                SELECT DISTINCT b.vn_codigo AS id_vendedor 
                FROM bi.wbx_vw_clientes c 
                INNER JOIN v_clientes_rotas b ON b.cl_codigo = c.id_cliente 
                WHERE c.is_deleted = 0 
                  AND CAST(c.datacadas AS DATE) BETWEEN CAST(@dataInicio AS DATE) AND CAST(@dataFim AS DATE)
                UNION 
                SELECT DISTINCT v.id_vendedor 
                FROM bi.wbx_vw_vendas_validas v 
                WHERE v.is_deleted = 0 
                  AND CAST(v.data_venda AS DATE) BETWEEN CAST(@dataInicio AS DATE) AND CAST(@dataFim AS DATE)
                  AND v.status IN (2, 3, 4) 
                  AND v.bonif = 0 
                  AND v.troca = 0 
            ), 
            vendas_agg AS ( 
                SELECT 
                    v.id_vendedor, 
                    SUM(v.valor_total) AS valor_total_raw, 
                    COUNT(DISTINCT v.id_venda) AS quantidade_pedidos, 
                    COUNT(DISTINCT v.id_cliente) AS clientes_atendidos 
                FROM bi.wbx_vw_vendas_validas v 
                WHERE v.is_deleted = 0 
                  AND CAST(v.data_venda AS DATE) BETWEEN CAST(@dataInicio AS DATE) AND CAST(@dataFim AS DATE)
                  AND v.status IN (2, 3, 4) 
                  AND v.bonif = 0 
                  AND v.troca = 0 
                GROUP BY v.id_vendedor 
            ), 
            novos_agg AS (
                SELECT
                    b.vn_codigo AS id_vendedor,
                    COUNT(DISTINCT c.id_cliente) AS clientes_novos
                FROM bi.wbx_vw_clientes c
                INNER JOIN v_clientes_rotas b ON b.cl_codigo = c.id_cliente
                WHERE c.is_deleted = 0
                  AND CAST(c.datacadas AS DATE) BETWEEN CAST(@dataInicio AS DATE) AND CAST(@dataFim AS DATE)
                GROUP BY b.vn_codigo
            ),
            area_agg AS (
                -- Chave de roteirização do WiBi (Coligada.Área.Zona.Setor.Rota, ex.: "001.A.0007.0007.0407").
                -- Um vendedor pode ter clientes em rotas ligeiramente diferentes; MAX() escolhe uma
                -- chave representativa por vendedor, suficiente para classificar Área/Zona/Setor/Rota.
                SELECT
                    b.vn_codigo AS id_vendedor,
                    MAX(b.es_codigo) AS area
                FROM v_clientes_rotas b
                GROUP BY b.vn_codigo
            )
            SELECT
                ISNULL(vd.nome_abreviado, ISNULL(vd.nome_completo, '—')) AS nome_vendedor,
                ISNULL(aa.area, '') AS area,
                ISNULL(va.valor_total_raw, 0) AS valor_total_raw,
                ISNULL(va.quantidade_pedidos, 0) AS quantidade_pedidos,
                ISNULL(va.clientes_atendidos, 0) AS clientes_atendidos,
                ISNULL(na.clientes_novos, 0) AS clientes_novos,
                CASE
                    WHEN ISNULL(va.quantidade_pedidos, 0) > 0 THEN va.valor_total_raw / va.quantidade_pedidos
                    ELSE 0
                END AS ticket_medio
            FROM vendedores_universe u
            LEFT JOIN bi.wbx_vw_vendedores vd ON vd.id_vendedor = u.id_vendedor
            LEFT JOIN vendas_agg va ON va.id_vendedor = u.id_vendedor
            LEFT JOIN novos_agg na ON na.id_vendedor = u.id_vendedor
            LEFT JOIN area_agg aa ON aa.id_vendedor = u.id_vendedor
            ORDER BY ISNULL(na.clientes_novos, 0) DESC, ISNULL(va.valor_total_raw, 0) DESC
        `;

        const result = await pool.request()
            .input('dataInicio', dataInicio)
            .input('dataFim', dataFim)
            .query(query);

        res.json(result.recordset);
    } catch (error) {
        console.error('Erro na rota /api/vendedores/resumo:', error);
        res.status(500).json({ error: 'Erro ao consultar resumo de vendedores', details: error.message });
    }
});

// Endpoint 3: Top Clientes (Query Nativa do WiBi Web)
app.get('/api/clientes/top', async (req, res) => {
    try {
        const pool = await getConnection();
        const { dataInicio = '2026-09-01', dataFim = '2026-09-30', limit = 15 } = req.query;

        const query = `
            WITH area_por_cliente AS (
                -- Uma chave de roteirização representativa por cliente, agregada à parte
                -- para não multiplicar as linhas de venda no JOIN abaixo caso um cliente
                -- tenha mais de uma linha em v_clientes_rotas.
                SELECT
                    b.cl_codigo AS id_cliente,
                    MAX(b.es_codigo) AS area
                FROM v_clientes_rotas b
                GROUP BY b.cl_codigo
            )
            SELECT TOP (${parseInt(limit)})
                ISNULL(MAX(c.nome_abreviado), MAX(c.nome_completo)) AS nome_cliente,
                ISNULL(MAX(ac.area), '') AS area,
                SUM(v.valor_total) AS valor_total_raw,
                COUNT(DISTINCT v.id_venda) AS quantidade_pedidos,
                CASE
                    WHEN COUNT(DISTINCT v.id_venda) > 0 THEN SUM(v.valor_total) / COUNT(DISTINCT v.id_venda)
                    ELSE 0
                END AS ticket_medio
            FROM bi.wbx_vw_vendas_validas v
            LEFT JOIN bi.wbx_vw_clientes c
                ON c.id_coligada = v.id_coligada AND c.id_cliente = v.id_cliente
            LEFT JOIN area_por_cliente ac
                ON ac.id_cliente = v.id_cliente
            WHERE v.is_deleted = 0
              AND CAST(v.data_venda AS DATE) BETWEEN CAST(@dataInicio AS DATE) AND CAST(@dataFim AS DATE)
              AND v.status IN (2, 3, 4)
              AND v.bonif = 0
              AND v.troca = 0
            GROUP BY v.id_cliente
            ORDER BY SUM(v.valor_total) DESC
        `;

        const result = await pool.request()
            .input('dataInicio', dataInicio)
            .input('dataFim', dataFim)
            .query(query);

        res.json(result.recordset);
    } catch (error) {
        console.error('Erro na rota /api/clientes/top:', error);
        res.status(500).json({ error: 'Erro ao consultar top clientes', details: error.message });
    }
});

// Endpoint 4: Cobertura e Base de Clientes (Positivação)
app.get('/api/kpis/cobertura', async (req, res) => {
    try {
        const pool = await getConnection();
        const { dataInicio = '2026-09-01', dataFim = '2026-09-30' } = req.query;

        const query = `
            SELECT 
                (
                    SELECT COUNT(DISTINCT v.id_cliente)
                    FROM bi.wbx_vw_vendas_validas v
                    WHERE v.is_deleted = 0
                      AND CAST(v.data_venda AS DATE) BETWEEN CAST(@dataInicio AS DATE) AND CAST(@dataFim AS DATE)
                      AND v.status IN (2, 3, 4)
                      AND v.bonif = 0
                      AND v.troca = 0
                ) AS clientes_compraram,
                (
                    SELECT ISNULL(MAX(v.base_clientes_ativos), 0)
                    FROM bi.wbx_vw_vendas_validas v
                    WHERE v.is_deleted = 0
                ) AS total_clientes_ativos
        `;

        const result = await pool.request()
            .input('dataInicio', dataInicio)
            .input('dataFim', dataFim)
            .query(query);

        const data = result.recordset[0];
        const percentualCobertura = data.total_clientes_ativos > 0 
            ? (data.clientes_compraram / data.total_clientes_ativos) * 100 
            : 0;

        res.json({
            clientes_compraram: data.clientes_compraram,
            total_clientes_ativos: data.total_clientes_ativos,
            percentual_cobertura: parseFloat(percentualCobertura.toFixed(2))
        });
    } catch (error) {
        console.error('Erro na rota /api/kpis/cobertura:', error);
        res.status(500).json({ error: 'Erro ao consultar cobertura de clientes', details: error.message });
    }
});

// Endpoint 5: Resumo por Canal (Grandes Redes vs. Varejo Tradicional)
app.get('/api/canais/resumo', async (req, res) => {
    try {
        const pool = await getConnection();
        const { dataInicio = '2026-09-01', dataFim = '2026-09-30' } = req.query;

        const query = `
            SELECT 
                CASE 
                    WHEN UPPER(c.nome_abreviado) LIKE '%ASSAI%' 
                      OR UPPER(c.nome_abreviado) LIKE '%FRANGOLANDIA%' 
                      OR UPPER(c.nome_abreviado) LIKE '%MATEUS%' 
                      OR UPPER(c.nome_abreviado) LIKE '%SÃO LUIZ%' 
                      OR UPPER(c.nome_abreviado) LIKE '%SAO LUIZ%' 
                      OR UPPER(c.nome_abreviado) LIKE '%LAGOA%' 
                      OR UPPER(c.nome_abreviado) LIKE '%EXTRA%' THEN 'Grandes Redes'
                    ELSE 'Varejo Tradicional'
                END AS canal,
                SUM(v.valor_total) AS total_vendas,
                COUNT(DISTINCT v.id_venda) AS total_pedidos,
                COUNT(DISTINCT v.id_cliente) AS clientes_atendidos
            FROM bi.wbx_vw_vendas_validas v
            LEFT JOIN bi.wbx_vw_clientes c 
                ON c.id_coligada = v.id_coligada AND c.id_cliente = v.id_cliente
            WHERE v.is_deleted = 0
              AND CAST(v.data_venda AS DATE) BETWEEN CAST(@dataInicio AS DATE) AND CAST(@dataFim AS DATE)
              AND v.status IN (2, 3, 4)
              AND v.bonif = 0
              AND v.troca = 0
            GROUP BY 
                CASE 
                    WHEN UPPER(c.nome_abreviado) LIKE '%ASSAI%' 
                      OR UPPER(c.nome_abreviado) LIKE '%FRANGOLANDIA%' 
                      OR UPPER(c.nome_abreviado) LIKE '%MATEUS%' 
                      OR UPPER(c.nome_abreviado) LIKE '%SÃO LUIZ%' 
                      OR UPPER(c.nome_abreviado) LIKE '%SAO LUIZ%' 
                      OR UPPER(c.nome_abreviado) LIKE '%LAGOA%' 
                      OR UPPER(c.nome_abreviado) LIKE '%EXTRA%' THEN 'Grandes Redes'
                    ELSE 'Varejo Tradicional'
                END
        `;

        const result = await pool.request()
            .input('dataInicio', dataInicio)
            .input('dataFim', dataFim)
            .query(query);

        res.json(result.recordset);
    } catch (error) {
        console.error('Erro na rota /api/canais/resumo:', error);
        res.status(500).json({ error: 'Erro ao consultar resumo por canal', details: error.message });
    }
});

// Endpoint Auxiliar: Evolução Diária de Vendas (para Gráficos)
app.get('/api/vendas/diario', async (req, res) => {
    try {
        const pool = await getConnection();
        const { dataInicio = '2026-09-01', dataFim = '2026-09-30' } = req.query;

        const query = `
            WITH area_por_cliente AS (
                -- Uma chave de roteirização representativa por cliente, agregada à parte
                -- para não multiplicar as linhas de venda no JOIN abaixo caso um cliente
                -- tenha mais de uma linha em v_clientes_rotas.
                SELECT
                    b.cl_codigo AS id_cliente,
                    MAX(b.es_codigo) AS area
                FROM v_clientes_rotas b
                GROUP BY b.cl_codigo
            )
            SELECT
                CAST(v.data_venda AS DATE) AS dia,
                ISNULL(ac.area, '') AS area,
                SUM(v.valor_total) AS total_vendas,
                COUNT(DISTINCT v.id_venda) AS total_pedidos
            FROM bi.wbx_vw_vendas_validas v
            LEFT JOIN area_por_cliente ac
                ON ac.id_cliente = v.id_cliente
            WHERE v.is_deleted = 0
              AND CAST(v.data_venda AS DATE) BETWEEN CAST(@dataInicio AS DATE) AND CAST(@dataFim AS DATE)
              AND v.status IN (2, 3, 4)
              AND v.bonif = 0
              AND v.troca = 0
            GROUP BY CAST(v.data_venda AS DATE), ac.area
            ORDER BY dia ASC
        `;

        const result = await pool.request()
            .input('dataInicio', dataInicio)
            .input('dataFim', dataFim)
            .query(query);

        res.json(result.recordset);
    } catch (error) {
        console.error('Erro na rota /api/vendas/diario:', error);
        res.status(500).json({ error: 'Erro ao consultar vendas diárias', details: error.message });
    }
});

// Endpoint: KPI Cancelamentos (Query kpi_cancelamentos)
app.get('/api/kpis/cancelamentos', async (req, res) => {
    try {
        const pool = await getConnection();
        const { dataInicio = '2026-09-01', dataFim = '2026-09-30' } = req.query;

        const query = `
            SELECT 
                COUNT(DISTINCT v.id_venda) AS cancelamentos
            FROM bi.wbx_vw_vendas_validas v
            WHERE v.is_deleted = 0
              AND CAST(v.data_venda AS DATE) BETWEEN CAST(@dataInicio AS DATE) AND CAST(@dataFim AS DATE)
              AND v.status = 12
              AND v.bonif = 0
              AND v.troca = 0
        `;

        const result = await pool.request()
            .input('dataInicio', dataInicio)
            .input('dataFim', dataFim)
            .query(query);

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Erro na rota /api/kpis/cancelamentos:', error);
        res.status(500).json({ error: 'Erro ao consultar KPI de cancelamentos', details: error.message });
    }
});

// Endpoint: Vendas por Mês (Query vendas_mes)
app.get('/api/vendas/mes', async (req, res) => {
    try {
        const pool = await getConnection();
        const { ano = '2026' } = req.query;

        const query = `
            SELECT 
                MONTH(v.data_venda) AS mes_num,
                SUM(v.valor_total) AS faturamento,
                COUNT(DISTINCT v.id_venda) AS pedidos,
                SUM(v.quantidade) AS quantidade,
                COUNT(DISTINCT v.id_cliente) AS clientes
            FROM bi.wbx_vw_vendas_validas v
            WHERE v.is_deleted = 0
              AND YEAR(v.data_venda) = @ano
              AND v.status IN (2, 3, 4)
              AND v.bonif = 0
              AND v.troca = 0
            GROUP BY MONTH(v.data_venda)
            ORDER BY MONTH(v.data_venda)
        `;

        const result = await pool.request()
            .input('ano', ano)
            .query(query);

        res.json(result.recordset);
    } catch (error) {
        console.error('Erro na rota /api/vendas/mes:', error);
        res.status(500).json({ error: 'Erro ao consultar vendas por mês', details: error.message });
    }
});

// Endpoint: Vendas por Produto e Mês (Query vendas_produto_mes)
app.get('/api/vendas/produtos-mes', async (req, res) => {
    try {
        const pool = await getConnection();
        const { ano = '2026' } = req.query;

        const query = `
            SELECT 
                v.id_produto AS id_produto, 
                ISNULL(MAX(p.descricao), '—') AS produto, 
                LTRIM(RTRIM(ISNULL(pu.un_sigla, ''))) AS unidade, 
                MONTH(v.data_venda) AS mes_num, 
                SUM(
                    v.quantidade * CASE 
                        WHEN ISNULL(pu.pu_fatorunidade_divisor, 0) = 1 THEN 1.0 / NULLIF(ISNULL(pu.pu_fatorUnidade, 1), 0) 
                        ELSE ISNULL(NULLIF(pu.pu_fatorUnidade, 0), 1) 
                    END
                ) AS quantidade 
            FROM bi.wbx_vw_vendas_validas v 
            LEFT JOIN bi.wbx_vw_produtos p 
                ON p.id_coligada = v.id_coligada 
               AND p.id_empresa = v.id_empresa 
               AND p.id_produto = v.id_produto 
            LEFT JOIN dbo.t_produtos_detalhes pd 
                ON pd.pr_codigo = v.id_produto 
               AND pd.em_codigo = v.id_empresa 
            LEFT JOIN dbo.t_produtos_unidades pu 
                ON pu.prd_id = pd.prd_id 
            WHERE v.is_deleted = 0 
              AND YEAR(v.data_venda) = @ano 
              AND v.status IN (2, 3, 4) 
              AND v.bonif = 0 
              AND v.troca = 0 
            GROUP BY 
                v.id_produto, 
                LTRIM(RTRIM(ISNULL(pu.un_sigla, ''))), 
                MONTH(v.data_venda) 
            ORDER BY 
                v.id_produto, 
                unidade
        `;

        const result = await pool.request()
            .input('ano', ano)
            .query(query);

        res.json(result.recordset);
    } catch (error) {
        console.error('Erro na rota /api/vendas/produtos-mes:', error);
        res.status(500).json({ error: 'Erro ao consultar vendas por produto e mês', details: error.message });
    }
});

// Endpoint: Lista Geral de Produtos por Faturamento (Query produtos_lista)
app.get('/api/produtos/lista', async (req, res) => {
    try {
        const pool = await getConnection();
        const { ano = '2026' } = req.query;

        const query = `
            SELECT 
                v.id_produto AS id_produto, 
                ISNULL(MAX(p.descricao), '—') AS descricao_produto, 
                SUM(v.valor_total) AS faturamento
            FROM bi.wbx_vw_vendas_validas v
            LEFT JOIN bi.wbx_vw_produtos p 
                ON p.id_coligada = v.id_coligada 
               AND p.id_empresa = v.id_empresa 
               AND p.id_produto = v.id_produto
            WHERE v.is_deleted = 0 
              AND YEAR(v.data_venda) = @ano 
              AND v.status IN (2, 3, 4) 
              AND v.bonif = 0 
              AND v.troca = 0
            GROUP BY v.id_produto
            ORDER BY SUM(v.valor_total) DESC
        `;

        const result = await pool.request()
            .input('ano', ano)
            .query(query);

        res.json(result.recordset);
    } catch (error) {
        console.error('Erro na rota /api/produtos/lista:', error);
        res.status(500).json({ error: 'Erro ao consultar lista de produtos', details: error.message });
    }
});

// Endpoint: Top 10 Vendedores (Query top_vendedores)
app.get('/api/vendedores/top', async (req, res) => {
    try {
        const pool = await getConnection();
        const { dataInicio = '2026-09-01', dataFim = '2026-09-30' } = req.query;

        const query = `
            WITH area_agg AS (
                -- Uma chave de roteirização (área/zona/setor/rota) representativa por vendedor.
                -- Agregada à parte para não multiplicar as linhas de venda no JOIN abaixo
                -- (um vendedor tem vários clientes/rotas em v_clientes_rotas).
                SELECT
                    b.vn_codigo AS id_vendedor,
                    MAX(b.es_codigo) AS area
                FROM v_clientes_rotas b
                GROUP BY b.vn_codigo
            )
            SELECT TOP 10
                ISNULL(MAX(vd.nome_abreviado), MAX(vd.nome_completo)) AS nome_vendedor,
                ISNULL(MAX(aa.area), '') AS area,
                SUM(v.valor_total) AS valor_total_raw,
                COUNT(DISTINCT v.id_venda) AS quantidade_pedidos
            FROM bi.wbx_vw_vendas_validas v
            LEFT JOIN bi.wbx_vw_vendedores vd
                ON vd.id_coligada = v.id_coligada
               AND vd.id_vendedor = v.id_vendedor
            LEFT JOIN area_agg aa
                ON aa.id_vendedor = v.id_vendedor
            WHERE v.is_deleted = 0
              AND CAST(v.data_venda AS DATE) BETWEEN CAST(@dataInicio AS DATE) AND CAST(@dataFim AS DATE)
              AND v.status IN (2, 3, 4)
              AND v.bonif = 0
              AND v.troca = 0
            GROUP BY v.id_vendedor
            ORDER BY SUM(v.valor_total) DESC
        `;

        const result = await pool.request()
            .input('dataInicio', dataInicio)
            .input('dataFim', dataFim)
            .query(query);

        res.json(result.recordset);
    } catch (error) {
        console.error('Erro na rota /api/vendedores/top:', error);
        res.status(500).json({ error: 'Erro ao consultar top vendedores', details: error.message });
    }
});

// Endpoint: Clientes Novos no Período (Query clientes_novos_periodo)
app.get('/api/clientes/novos-periodo', async (req, res) => {
    try {
        const pool = await getConnection();
        const { dataInicio = '2026-09-01', dataFim = '2026-09-30' } = req.query;

        const query = `
            WITH area_por_cliente AS (
                -- Uma chave de roteirização representativa por cliente, agregada à parte
                -- para não multiplicar as linhas de venda no JOIN abaixo caso um cliente
                -- tenha mais de uma linha em v_clientes_rotas.
                SELECT
                    b.cl_codigo AS id_cliente,
                    MAX(b.es_codigo) AS area
                FROM v_clientes_rotas b
                GROUP BY b.cl_codigo
            )
            SELECT
                ISNULL(MAX(c.nome_abreviado), MAX(c.nome_completo)) AS nome_cliente,
                ISNULL(MAX(ac.area), '') AS area,
                ISNULL(SUM(v.valor_total), 0) AS valor_total_raw,
                ISNULL(COUNT(DISTINCT v.id_venda), 0) AS quantidade_pedidos,
                CASE
                    WHEN COUNT(DISTINCT v.id_venda) > 0 THEN SUM(v.valor_total) / COUNT(DISTINCT v.id_venda)
                    ELSE 0
                END AS ticket_medio
            FROM bi.wbx_vw_clientes c
            LEFT JOIN bi.wbx_vw_vendas_validas v
                ON v.id_coligada = c.id_coligada
               AND v.id_cliente = c.id_cliente
               AND v.is_deleted = 0
               AND CAST(v.data_venda AS DATE) BETWEEN CAST(@dataInicio AS DATE) AND CAST(@dataFim AS DATE)
               AND v.status IN (2, 3, 4)
               AND v.bonif = 0
               AND v.troca = 0
            LEFT JOIN area_por_cliente ac
                ON ac.id_cliente = c.id_cliente
            WHERE c.is_deleted = 0
              AND CAST(c.datacadas AS DATE) BETWEEN CAST(@dataInicio AS DATE) AND CAST(@dataFim AS DATE)
            GROUP BY c.id_cliente
            ORDER BY ISNULL(SUM(v.valor_total), 0) DESC, MAX(c.nome_completo)
        `;

        const result = await pool.request()
            .input('dataInicio', dataInicio)
            .input('dataFim', dataFim)
            .query(query);

        res.json(result.recordset);
    } catch (error) {
        console.error('Erro na rota /api/clientes/novos-periodo:', error);
        res.status(500).json({ error: 'Erro ao consultar clientes novos do período', details: error.message });
    }
});

// Endpoint: KPI Clientes Novos (Query kpi_clientes_novos)
app.get('/api/kpis/clientes-novos', async (req, res) => {
    try {
        const pool = await getConnection();
        const { dataInicio = '2026-09-01', dataFim = '2026-09-30' } = req.query;

        const query = `
            SELECT 
                COUNT(DISTINCT c.id_cliente) AS clientes_novos
            FROM bi.wbx_vw_clientes c
            WHERE c.is_deleted = 0
              AND CAST(c.datacadas AS DATE) BETWEEN CAST(@dataInicio AS DATE) AND CAST(@dataFim AS DATE)
        `;

        const result = await pool.request()
            .input('dataInicio', dataInicio)
            .input('dataFim', dataFim)
            .query(query);

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Erro na rota /api/kpis/clientes-novos:', error);
        res.status(500).json({ error: 'Erro ao consultar KPI de clientes novos', details: error.message });
    }
});

// Endpoint: Novos Clientes por Vendedor e Mês (Query clientes_novos_vendedor_mes)
app.get('/api/vendedores/clientes-novos-mes', async (req, res) => {
    try {
        const pool = await getConnection();
        const { ano = '2026' } = req.query;

        const query = `
            SELECT
                MONTH(c.datacadas) AS mes_num,
                ISNULL(vn.nome_abreviado, ISNULL(vn.nome_completo, 'Sem vendedor')) AS nome_vendedor,
                ISNULL(b.es_codigo, '') AS area,
                COUNT(DISTINCT c.id_cliente) AS clientes_novos
            FROM bi.wbx_vw_clientes c
            LEFT JOIN v_clientes_rotas b
                ON b.cl_codigo = c.id_cliente
            LEFT JOIN bi.wbx_vw_vendedores vn
                ON vn.id_vendedor = b.vn_codigo
            WHERE c.is_deleted = 0
              AND YEAR(c.datacadas) = @ano
            GROUP BY
                MONTH(c.datacadas),
                vn.nome_abreviado,
                vn.nome_completo,
                b.es_codigo
            ORDER BY
                MONTH(c.datacadas),
                nome_vendedor
        `;

        const result = await pool.request()
            .input('ano', ano)
            .query(query);

        res.json(result.recordset);
    } catch (error) {
        console.error('Erro na rota /api/vendedores/clientes-novos-mes:', error);
        res.status(500).json({ error: 'Erro ao consultar clientes novos por vendedor e mês', details: error.message });
    }
});

// Endpoint: KPI de Trocas (Query kpi_trocas)
app.get('/api/kpis/trocas', async (req, res) => {
    try {
        const pool = await getConnection();
        const { dataInicio = '2026-09-01', dataFim = '2026-09-30' } = req.query;

        const query = `
            SELECT 
                ISNULL(CAST(SUM(v.valor_total) AS FLOAT), 0) AS valor, 
                COUNT(DISTINCT v.id_venda) AS qtd
            FROM bi.wbx_vw_vendas_validas v
            WHERE v.is_deleted = 0
              AND CAST(v.data_venda AS DATE) BETWEEN CAST(@dataInicio AS DATE) AND CAST(@dataFim AS DATE)
              AND v.status IN (2, 3, 4)
              AND v.troca = 1
        `;

        const result = await pool.request()
            .input('dataInicio', dataInicio)
            .input('dataFim', dataFim)
            .query(query);

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Erro na rota /api/kpis/trocas:', error);
        res.status(500).json({ error: 'Erro ao consultar KPI de trocas', details: error.message });
    }
});

// Endpoint: KPI de Bonificações (Query kpi_bonificacoes)
app.get('/api/kpis/bonificacoes', async (req, res) => {
    try {
        const pool = await getConnection();
        const { dataInicio = '2026-09-01', dataFim = '2026-09-30' } = req.query;

        const query = `
            SELECT 
                ISNULL(CAST(SUM(v.valor_total) AS FLOAT), 0) AS valor, 
                COUNT(DISTINCT v.id_venda) AS qtd
            FROM bi.wbx_vw_vendas_validas v
            WHERE v.is_deleted = 0
              AND CAST(v.data_venda AS DATE) BETWEEN CAST(@dataInicio AS DATE) AND CAST(@dataFim AS DATE)
              AND v.status IN (2, 3, 4)
              AND v.bonif = 1
        `;

        const result = await pool.request()
            .input('dataInicio', dataInicio)
            .input('dataFim', dataFim)
            .query(query);

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Erro na rota /api/kpis/bonificacoes:', error);
        res.status(500).json({ error: 'Erro ao consultar KPI de bonificações', details: error.message });
    }
});

// Endpoint: Top 20 Clientes com Maior Volume de Trocas (Query top_clientes_troca)
app.get('/api/clientes/top-troca', async (req, res) => {
    try {
        const pool = await getConnection();
        const { dataInicio = '2026-09-01', dataFim = '2026-09-30' } = req.query;

        const query = `
            WITH area_por_cliente AS (
                -- Uma chave de roteirização representativa por cliente, agregada à parte
                -- para não multiplicar as linhas de venda no JOIN abaixo caso um cliente
                -- tenha mais de uma linha em v_clientes_rotas.
                SELECT
                    b.cl_codigo AS id_cliente,
                    MAX(b.es_codigo) AS area
                FROM v_clientes_rotas b
                GROUP BY b.cl_codigo
            )
            SELECT TOP 20
                ISNULL(MAX(c.nome_abreviado), MAX(c.nome_completo)) AS nome_cliente,
                ISNULL(MAX(ac.area), '') AS area,
                ISNULL(CAST(SUM(v.quantidade) AS FLOAT), 0) AS sum_quantidade,
                COUNT(DISTINCT v.id_venda) AS count_vendas,
                ISNULL(CAST(SUM(v.valor_total) AS FLOAT), 0) AS sum_valor_total
            FROM bi.wbx_vw_vendas_validas v
            LEFT JOIN bi.wbx_vw_clientes c
                ON c.id_coligada = v.id_coligada
               AND c.id_cliente = v.id_cliente
            LEFT JOIN area_por_cliente ac
                ON ac.id_cliente = v.id_cliente
            WHERE v.is_deleted = 0
              AND CAST(v.data_venda AS DATE) BETWEEN CAST(@dataInicio AS DATE) AND CAST(@dataFim AS DATE)
              AND v.status IN (2, 3, 4)
              AND v.troca = 1
            GROUP BY v.id_cliente
            ORDER BY SUM(v.valor_total) DESC, COUNT(DISTINCT v.id_venda) DESC
        `;

        const result = await pool.request()
            .input('dataInicio', dataInicio)
            .input('dataFim', dataFim)
            .query(query);

        res.json(result.recordset);
    } catch (error) {
        console.error('Erro na rota /api/clientes/top-troca:', error);
        res.status(500).json({ error: 'Erro ao consultar top clientes por troca', details: error.message });
    }
});

// Endpoint: Top 20 Clientes por Bonificação (Query top_clientes_bonificacao)
app.get('/api/clientes/top-bonificacao', async (req, res) => {
    try {
        const pool = await getConnection();
        const { dataInicio = '2026-09-01', dataFim = '2026-09-30' } = req.query;

        const query = `
            WITH area_por_cliente AS (
                -- Uma chave de roteirização representativa por cliente, agregada à parte
                -- para não multiplicar as linhas de venda no JOIN abaixo caso um cliente
                -- tenha mais de uma linha em v_clientes_rotas.
                SELECT
                    b.cl_codigo AS id_cliente,
                    MAX(b.es_codigo) AS area
                FROM v_clientes_rotas b
                GROUP BY b.cl_codigo
            )
            SELECT TOP 20
                ISNULL(MAX(c.nome_abreviado), MAX(c.nome_completo)) AS nome_cliente,
                ISNULL(MAX(ac.area), '') AS area,
                ISNULL(CAST(SUM(v.quantidade) AS FLOAT), 0) AS sum_quantidade,
                COUNT(DISTINCT v.id_venda) AS count_vendas,
                ISNULL(CAST(SUM(v.valor_total) AS FLOAT), 0) AS sum_valor_total
            FROM bi.wbx_vw_vendas_validas v
            LEFT JOIN bi.wbx_vw_clientes c
                ON c.id_coligada = v.id_coligada
               AND c.id_cliente = v.id_cliente
            LEFT JOIN area_por_cliente ac
                ON ac.id_cliente = v.id_cliente
            WHERE v.is_deleted = 0
              AND CAST(v.data_venda AS DATE) BETWEEN CAST(@dataInicio AS DATE) AND CAST(@dataFim AS DATE)
              AND v.status IN (2, 3, 4)
              AND v.bonif = 1
            GROUP BY v.id_cliente
            ORDER BY SUM(v.valor_total) DESC, COUNT(DISTINCT v.id_venda) DESC
        `;

        const result = await pool.request()
            .input('dataInicio', dataInicio)
            .input('dataFim', dataFim)
            .query(query);

        res.json(result.recordset);
    } catch (error) {
        console.error('Erro na rota /api/clientes/top-bonificacao:', error);
        res.status(500).json({ error: 'Erro ao consultar top clientes por bonificação', details: error.message });
    }
});

// Apenas use a variável PORT que já foi declarada lá no topo:
let server;
if (process.env.NODE_ENV !== 'test') {
    server = app.listen(PORT, () => {
        console.log(`✅ Servidor rodando com sucesso na porta ${PORT}`);
    });
}

module.export = { app, server };
// Nota: Certifique-se também de que o export está como module.exports (no plural com 's'):
module.exports = { app, server };