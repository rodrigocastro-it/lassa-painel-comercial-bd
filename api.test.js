process.env.NODE_ENV = 'test';
const request = require('supertest');
const { app, server } = require('./server');

describe('TestSuite - Automação da API Lassa', () => {
    
    const paramsAno = { ano: '2026' };
    const paramsPeriodo = { dataInicio: '2026-09-01', dataFim: '2026-09-30' };

    afterAll((done) => {
        if (server) {
            server.close(done);
        } else {
            done();
        }
    });

    // --- Status e KPIs ---
    test('GET /api/status', async () => {
        const res = await request(app).get('/api/status');
        expect(res.statusCode).toBe(200);
    });

    test('GET /api/kpis/totais', async () => {
        const res = await request(app).get('/api/kpis/totais').query(paramsPeriodo);
        expect(res.statusCode).toBe(200);
    });

    test('GET /api/kpis/cobertura', async () => {
        const res = await request(app).get('/api/kpis/cobertura').query(paramsPeriodo);
        expect(res.statusCode).toBe(200);
    });

    test('GET /api/kpis/cancelamentos', async () => {
        const res = await request(app).get('/api/kpis/cancelamentos').query(paramsPeriodo);
        expect(res.statusCode).toBe(200);
    });

    test('GET /api/kpis/clientes-novos', async () => {
        const res = await request(app).get('/api/kpis/clientes-novos').query(paramsPeriodo);
        expect(res.statusCode).toBe(200);
    });

    test('GET /api/kpis/trocas', async () => {
        const res = await request(app).get('/api/kpis/trocas').query(paramsPeriodo);
        expect(res.statusCode).toBe(200);
    });

    test('GET /api/kpis/bonificacoes', async () => {
        const res = await request(app).get('/api/kpis/bonificacoes').query(paramsPeriodo);
        expect(res.statusCode).toBe(200);
    });

    // --- Vendas e Gráficos ---
    test('GET /api/vendas/diario', async () => {
        const res = await request(app).get('/api/vendas/diario').query(paramsPeriodo);
        expect(res.statusCode).toBe(200);
    });

    test('GET /api/vendas/mes', async () => {
        const res = await request(app).get('/api/vendas/mes').query(paramsAno);
        expect(res.statusCode).toBe(200);
    });

    test('GET /api/vendas/produtos-mes', async () => {
        const res = await request(app).get('/api/vendas/produtos-mes').query(paramsAno);
        expect(res.statusCode).toBe(200);
    });

    test('GET /api/canais/resumo', async () => {
        const res = await request(app).get('/api/canais/resumo').query(paramsPeriodo);
        expect(res.statusCode).toBe(200);
    });

    // --- Produtos ---
    test('GET /api/produtos/lista', async () => {
        const res = await request(app).get('/api/produtos/lista').query(paramsAno);
        expect(res.statusCode).toBe(200);
    });

    // --- Clientes ---
    test('GET /api/clientes/top', async () => {
        const res = await request(app).get('/api/clientes/top').query(paramsPeriodo);
        expect(res.statusCode).toBe(200);
    });

    test('GET /api/clientes/novos-periodo', async () => {
        const res = await request(app).get('/api/clientes/novos-periodo').query(paramsPeriodo);
        expect(res.statusCode).toBe(200);
    });

    test('GET /api/clientes/top-troca', async () => {
        const res = await request(app).get('/api/clientes/top-troca').query(paramsPeriodo);
        expect(res.statusCode).toBe(200);
    });

    test('GET /api/clientes/top-bonificacao', async () => {
        const res = await request(app).get('/api/clientes/top-bonificacao').query(paramsPeriodo);
        expect(res.statusCode).toBe(200);
    });

    // --- Vendedores ---
    test('GET /api/vendedores/top', async () => {
        const res = await request(app).get('/api/vendedores/top').query(paramsPeriodo);
        expect(res.statusCode).toBe(200);
    });

    test('GET /api/vendedores/resumo', async () => {
        const res = await request(app).get('/api/vendedores/resumo').query(paramsPeriodo);
        expect(res.statusCode).toBe(200);
    });

    test('GET /api/vendedores/clientes-novos-mes', async () => {
        const res = await request(app).get('/api/vendedores/clientes-novos-mes').query(paramsAno);
        expect(res.statusCode).toBe(200);
    });
});