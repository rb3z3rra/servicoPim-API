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

let solicitanteToken: string;
let supervisorToken: string;
let tecnicoToken: string;
let solicitanteId: string;
let tecnicoId: string;
let equipamentoId: number;

async function criarUsuario(
    nome: string,
    email: string,
    perfil: Perfil,
    matricula: string
): Promise<string> {
    const repo = appDataSource.getRepository(Usuario);
    const senhaHash = await bcrypt.hash("senha123", 10);
    const user = await repo.save({
        nome,
        email,
        matricula,
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

describe("Testes de Integração - Rotas de Ordens de Serviço (Banco Real)", () => {
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

        // Limpar na ordem correta (respeitar FKs)
        await historicoRepo.createQueryBuilder().delete().execute();
        await osRepo.createQueryBuilder().delete().execute();
        await equipRepo.delete({ codigo: Like("TESTE-OS-%") });
        await userRepo.delete({ email: Like("%os-rt@teste.com") });

        // Criar usuários de teste
        solicitanteId = await criarUsuario(
            "Solicitante OS",
            "solicitante-os-rt@teste.com",
            Perfil.SOLICITANTE,
            "OS-USER-001"
        );
        const supervisorId = await criarUsuario(
            "Supervisor OS",
            "supervisor-os-rt@teste.com",
            Perfil.SUPERVISOR,
            "OS-USER-002"
        );
        tecnicoId = await criarUsuario(
            "Tecnico OS",
            "tecnico-os-rt@teste.com",
            Perfil.TECNICO,
            "OS-USER-003"
        );

        solicitanteToken = await login("solicitante-os-rt@teste.com");
        supervisorToken = await login("supervisor-os-rt@teste.com");
        tecnicoToken = await login("tecnico-os-rt@teste.com");

        // Criar equipamento de teste
        const equipRes = await request(app)
            .post("/equipamentos")
            .set("Authorization", `Bearer ${supervisorToken}`)
            .send({
                codigo: "TESTE-OS-001",
                nome: "Equipamento para OS",
                tipo: "Servidor",
                localizacao: "Datacenter",
            });
        equipamentoId = equipRes.body.id;
    });

    afterAll(async () => {
        if (appDataSource.isInitialized) {
            const historicoRepo = appDataSource.getRepository(HistoricoOS);
            const osRepo = appDataSource.getRepository(OrdemServico);
            const equipRepo = appDataSource.getRepository(Equipamento);
            const userRepo = appDataSource.getRepository(Usuario);

            await historicoRepo.createQueryBuilder().delete().execute();
            await osRepo.createQueryBuilder().delete().execute();
            await equipRepo.delete({ codigo: Like("TESTE-OS-%") });
            await userRepo.delete({ email: Like("%os-rt@teste.com") });
            await appDataSource.destroy();
        }
    });

    // CREATE
    test("POST /ordens-servico - Deve criar uma nova OS com sucesso", async () => {
        const response = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                equipamentoId,
                tipo_manutencao: "CORRETIVA",
                prioridade: "ALTA",
                descricao_falha: "Servidor não responde às requisições",
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("id");
        expect(response.body).toHaveProperty("numero");
        expect(response.body.status).toBe("ABERTA");
        expect(response.body.tipo_manutencao).toBe("CORRETIVA");
        expect(response.body.prioridade).toBe("ALTA");
        expect(response.body.equipamento).toBeDefined();
        expect(response.body.solicitante).toBeDefined();
        expect(response.body.tecnico).toBeNull();
    });

    test("POST /ordens-servico - Deve falhar com equipamento inexistente", async () => {
        const response = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                equipamentoId: 999999,
                tipo_manutencao: "PREVENTIVA",
                prioridade: "BAIXA",
                descricao_falha: "Teste com equipamento inexistente",
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Equipamento não encontrado");
    });

    test("POST /ordens-servico - Deve falhar sem autenticação", async () => {
        const response = await request(app)
            .post("/ordens-servico")
            .send({
                equipamentoId,
                tipo_manutencao: "CORRETIVA",
                prioridade: "ALTA",
                descricao_falha: "Sem token de auth",
            });

        expect(response.status).toBe(401);
    });

    test("POST /ordens-servico - Deve falhar com dados inválidos", async () => {
        const response = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                equipamentoId: -1,
                descricao_falha: "abc",
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Dados inválidos");
    });

    // READ
    test("GET /ordens-servico - Deve listar todas as OS", async () => {
        const response = await request(app)
            .get("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test("GET /ordens-servico - Deve filtrar por status e prioridade", async () => {
        await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                equipamentoId,
                tipo_manutencao: "CORRETIVA",
                prioridade: "CRÍTICA",
                descricao_falha: "Falha para validar filtro de listagem",
            });

        const response = await request(app)
            .get("/ordens-servico")
            .query({ status: "ABERTA", prioridade: "CRÍTICA" })
            .set("Authorization", `Bearer ${solicitanteToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body.every((os: any) => os.status === "ABERTA")).toBe(true);
        expect(response.body.every((os: any) => os.prioridade === "CRÍTICA")).toBe(true);
    });

    test("GET /ordens-servico/:id - Deve buscar OS por ID", async () => {
        const createRes = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                equipamentoId,
                tipo_manutencao: "PREVENTIVA",
                prioridade: "BAIXA",
                descricao_falha: "Manutenção preventiva agendada para o servidor",
            });

        const response = await request(app)
            .get(`/ordens-servico/${createRes.body.id}`)
            .set("Authorization", `Bearer ${solicitanteToken}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(createRes.body.id);
        expect(response.body.numero).toBe(createRes.body.numero);
    });

    test("GET /ordens-servico/:id - Deve falhar com ID inexistente", async () => {
        const response = await request(app)
            .get("/ordens-servico/00000000-0000-0000-0000-000000000000")
            .set("Authorization", `Bearer ${solicitanteToken}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Ordem de serviço não encontrada");
    });

    // FLUXO COMPLETO: Criar -> Atribuir Técnico -> Concluir
    describe("Fluxo completo de OS", () => {
        let osId: string;

        test("PATCH /ordens-servico/:id/atribuir-tecnico - Deve atribuir técnico", async () => {
            const createRes = await request(app)
                .post("/ordens-servico")
                .set("Authorization", `Bearer ${solicitanteToken}`)
                .send({
                    equipamentoId,
                    tipo_manutencao: "CORRETIVA",
                    prioridade: "ALTA",
                    descricao_falha: "Falha crítica no servidor de produção",
                });

            osId = createRes.body.id;

            const response = await request(app)
                .patch(`/ordens-servico/${osId}/atribuir-tecnico`)
                .set("Authorization", `Bearer ${supervisorToken}`)
                .send({ tecnicoId });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe("EM_ANDAMENTO");
            expect(response.body.tecnico).toBeDefined();
            expect(response.body.tecnico.id).toBe(tecnicoId);
            expect(response.body.inicio_em).toBeDefined();
        });

        test("PATCH /ordens-servico/:id/status - Deve atualizar status", async () => {
            const response = await request(app)
                .patch(`/ordens-servico/${osId}/status`)
                .set("Authorization", `Bearer ${tecnicoToken}`)
                .send({ status: "AGUARDANDO_PECA" });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe("AGUARDANDO_PECA");
        });

        test("PATCH /ordens-servico/:id/status - Deve voltar para EM_ANDAMENTO", async () => {
            const response = await request(app)
                .patch(`/ordens-servico/${osId}/status`)
                .set("Authorization", `Bearer ${tecnicoToken}`)
                .send({ status: "EM_ANDAMENTO" });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe("EM_ANDAMENTO");
        });

        test("PATCH /ordens-servico/:id/concluir - Deve concluir a OS", async () => {
            const response = await request(app)
                .patch(`/ordens-servico/${osId}/concluir`)
                .set("Authorization", `Bearer ${tecnicoToken}`)
                .send({
                    descricao_servico: "Substituição do disco rígido e reinstalação do sistema",
                    pecas_utilizadas: "SSD 1TB Samsung EVO",
                    horas_trabalhadas: 3,
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe("CONCLUIDA");
            expect(response.body.descricao_servico).toBe(
                "Substituição do disco rígido e reinstalação do sistema"
            );
            expect(response.body.pecas_utilizadas).toBe("SSD 1TB Samsung EVO");
            expect(Number(response.body.horas_trabalhadas)).toBe(3);
            expect(response.body.conclusao_em).toBeDefined();
        });

        test("PATCH /ordens-servico/:id/status - Deve falhar ao alterar OS concluída", async () => {
            const response = await request(app)
                .patch(`/ordens-servico/${osId}/status`)
                .set("Authorization", `Bearer ${tecnicoToken}`)
                .send({ status: "EM_ANDAMENTO" });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Não é possível alterar uma OS concluída");
        });
    });

    // VALIDAÇÕES DE NEGÓCIO
    test("PATCH /ordens-servico/:id/atribuir-tecnico - Deve falhar com técnico inexistente", async () => {
        const createRes = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                equipamentoId,
                tipo_manutencao: "CORRETIVA",
                prioridade: "ALTA",
                descricao_falha: "Teste com técnico inexistente no sistema",
            });

        const response = await request(app)
            .patch(`/ordens-servico/${createRes.body.id}/atribuir-tecnico`)
            .set("Authorization", `Bearer ${supervisorToken}`)
            .send({ tecnicoId: "00000000-0000-0000-0000-000000000000" });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Técnico não encontrado");
    });

    test("PATCH /ordens-servico/:id/atribuir-tecnico - Deve falhar ao atribuir não-técnico", async () => {
        const createRes = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                equipamentoId,
                tipo_manutencao: "CORRETIVA",
                prioridade: "ALTA",
                descricao_falha: "Teste atribuindo solicitante como técnico",
            });

        const response = await request(app)
            .patch(`/ordens-servico/${createRes.body.id}/atribuir-tecnico`)
            .set("Authorization", `Bearer ${supervisorToken}`)
            .send({ tecnicoId: solicitanteId });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("O usuário informado não é um técnico");
    });

    test("PATCH /ordens-servico/:id/concluir - Deve falhar sem técnico atribuído", async () => {
        const createRes = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                equipamentoId,
                tipo_manutencao: "PREVENTIVA",
                prioridade: "BAIXA",
                descricao_falha: "Teste conclusão sem técnico atribuído",
            });

        const response = await request(app)
            .patch(`/ordens-servico/${createRes.body.id}/concluir`)
            .set("Authorization", `Bearer ${tecnicoToken}`)
            .send({
                descricao_servico: "Tentativa de conclusão sem técnico",
                horas_trabalhadas: 1,
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
            "Não é possível concluir uma OS sem técnico atribuído"
        );
    });
});
