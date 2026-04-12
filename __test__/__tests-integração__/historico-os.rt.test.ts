import request from "supertest";
import { app } from "../../src/server.js";
import { appDataSource } from "../../src/database/appDataSource.js";
import { Usuario } from "../../src/entities/Usuario.js";
import { Equipamento } from "../../src/entities/Equipamento.js";
import { OrdemServico } from "../../src/entities/OrdemServico.js";
import { HistoricoOS } from "../../src/entities/HistoricoOS.js";
import { Perfil } from "../../src/types/usr_perfil.js";
import { Like } from "typeorm";
import bcrypt from "bcryptjs";

let supervisorToken: string;
let solicitanteToken: string;
let tecnicoToken: string;
let solicitanteId: string;
let tecnicoId: string;
let equipamentoId: number;
let osId: string;

async function criarUsuario(
    nome: string,
    email: string,
    perfil: Perfil
): Promise<string> {
    const repo = appDataSource.getRepository(Usuario);
    const senhaHash = await bcrypt.hash("senha123", 10);
    const user = await repo.save({
        nome,
        email,
        senha_hash: senhaHash,
        perfil,
        setor: "TI",
        ativo: true,
    });
    return user.id;
}

async function login(email: string): Promise<string> {
    const res = await request(app)
        .post("/auth/login")
        .send({ email, senha: "senha123" });

    return res.body.accessToken;
}

describe("Testes de Integração - Rotas de Histórico de OS (Banco Real)", () => {
    beforeAll(async () => {
        if (!appDataSource.isInitialized) {
            await appDataSource.initialize();
            await appDataSource.runMigrations();
        }

        // Limpar dados de teste anteriores
        const historicoRepo = appDataSource.getRepository(HistoricoOS);
        const osRepo = appDataSource.getRepository(OrdemServico);
        const equipRepo = appDataSource.getRepository(Equipamento);
        const userRepo = appDataSource.getRepository(Usuario);

        await historicoRepo.createQueryBuilder().delete().execute();
        await osRepo.createQueryBuilder().delete().execute();
        await equipRepo.delete({ codigo: Like("TESTE-HIST-%") });
        await userRepo.delete({ email: Like("%hist-rt@teste.com") });

        // Criar usuários de teste
        solicitanteId = await criarUsuario(
            "Solicitante Hist",
            "solicitante-hist-rt@teste.com",
            Perfil.SOLICITANTE
        );
        await criarUsuario(
            "Supervisor Hist",
            "supervisor-hist-rt@teste.com",
            Perfil.SUPERVISOR
        );
        tecnicoId = await criarUsuario(
            "Tecnico Hist",
            "tecnico-hist-rt@teste.com",
            Perfil.TECNICO
        );

        solicitanteToken = await login("solicitante-hist-rt@teste.com");
        supervisorToken = await login("supervisor-hist-rt@teste.com");
        tecnicoToken = await login("tecnico-hist-rt@teste.com");

        // Criar equipamento de teste
        const equipRes = await request(app)
            .post("/equipamentos")
            .set("Authorization", `Bearer ${supervisorToken}`)
            .send({
                codigo: "TESTE-HIST-001",
                nome: "Equipamento para Historico",
                tipo: "Servidor",
                localizacao: "Datacenter",
            });
        equipamentoId = equipRes.body.id;

        // Criar OS (gera histórico de criação automaticamente)
        const osRes = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                equipamentoId,
                tipo_manutencao: "CORRETIVA",
                prioridade: "ALTA",
                descricao_falha: "Falha para teste de histórico",
            });
        osId = osRes.body.id;

        // Atribuir técnico (gera mais um registro de histórico)
        await request(app)
            .patch(`/ordens-servico/${osId}/atribuir-tecnico`)
            .set("Authorization", `Bearer ${supervisorToken}`)
            .send({ tecnicoId });

        // Atualizar status (gera mais um registro de histórico)
        await request(app)
            .patch(`/ordens-servico/${osId}/status`)
            .set("Authorization", `Bearer ${tecnicoToken}`)
            .send({ status: "AGUARDANDO_PECA" });
    });

    afterAll(async () => {
        if (appDataSource.isInitialized) {
            const historicoRepo = appDataSource.getRepository(HistoricoOS);
            const osRepo = appDataSource.getRepository(OrdemServico);
            const equipRepo = appDataSource.getRepository(Equipamento);
            const userRepo = appDataSource.getRepository(Usuario);

            await historicoRepo.createQueryBuilder().delete().execute();
            await osRepo.createQueryBuilder().delete().execute();
            await equipRepo.delete({ codigo: Like("TESTE-HIST-%") });
            await userRepo.delete({ email: Like("%hist-rt@teste.com") });
            await appDataSource.destroy();
        }
    });

    // LISTAR TODOS
    test("GET /historico-os - Deve listar todos os históricos", async () => {
        const response = await request(app)
            .get("/historico-os")
            .set("Authorization", `Bearer ${supervisorToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(3);
    });

    // BUSCAR POR OS
    test("GET /historico-os/ordem-servico/:osId - Deve listar históricos da OS", async () => {
        const response = await request(app)
            .get(`/historico-os/ordem-servico/${osId}`)
            .set("Authorization", `Bearer ${supervisorToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(3);

        // Verificar ordem cronológica (ASC)
        const datas = response.body.map((h: any) => new Date(h.registradoEm).getTime());
        for (let i = 1; i < datas.length; i++) {
            expect(datas[i]).toBeGreaterThanOrEqual(datas[i - 1]);
        }

        // Verificar transições de status
        const statusNovos = response.body.map((h: any) => h.statusNovo);
        expect(statusNovos).toContain("ABERTA");
        expect(statusNovos).toContain("EM_ANDAMENTO");
        expect(statusNovos).toContain("AGUARDANDO_PECA");
    });

    // BUSCAR POR ID
    test("GET /historico-os/:id - Deve buscar histórico por ID", async () => {
        const listRes = await request(app)
            .get(`/historico-os/ordem-servico/${osId}`)
            .set("Authorization", `Bearer ${supervisorToken}`);

        const historicoId = listRes.body[0].id;

        const response = await request(app)
            .get(`/historico-os/${historicoId}`)
            .set("Authorization", `Bearer ${supervisorToken}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(historicoId);
        expect(response.body).toHaveProperty("statusNovo");
        expect(response.body).toHaveProperty("ordemServico");
        expect(response.body).toHaveProperty("usuario");
    });

    test("GET /historico-os/:id - Deve falhar com ID inexistente", async () => {
        const response = await request(app)
            .get("/historico-os/00000000-0000-0000-0000-000000000000")
            .set("Authorization", `Bearer ${supervisorToken}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Histórico não encontrado");
    });

    // BUSCAR POR USUÁRIO
    test("GET /historico-os/usuario/:usuarioId - Deve listar históricos do usuário", async () => {
        const response = await request(app)
            .get(`/historico-os/usuario/${solicitanteId}`)
            .set("Authorization", `Bearer ${supervisorToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(1);
        expect(response.body[0]).toHaveProperty("ordemServico");
    });

    // SEM AUTENTICAÇÃO
    test("GET /historico-os - Deve falhar sem autenticação", async () => {
        const response = await request(app).get("/historico-os");

        expect(response.status).toBe(401);
    });

    test("GET /historico-os/ordem-servico/:osId - Deve falhar sem autenticação", async () => {
        const response = await request(app)
            .get(`/historico-os/ordem-servico/${osId}`);

        expect(response.status).toBe(401);
    });
});
