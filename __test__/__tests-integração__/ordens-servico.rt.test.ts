import request from "supertest";
import { app } from "../../src/server.js";
import { appDataSource } from "../../src/database/appDataSource.js";
import { Usuario } from "../../src/entities/Usuario.js";
import { Equipamento } from "../../src/entities/Equipamento.js";
import { OrdemServico } from "../../src/entities/OrdemServico.js";
import { HistoricoOS } from "../../src/entities/HistoricoOS.js";
import { ApontamentoOS } from "../../src/entities/ApontamentoOS.js";
import { Perfil } from "../../src/types/usr_perfil.js";
import { StatusPrazoOS } from "../../src/types/os_status_prazo.js";
import { Like } from "typeorm";
import bcrypt from "bcryptjs";

let solicitanteToken: string;
let outroSolicitanteToken: string;
let supervisorToken: string;
let tecnicoToken: string;
let solicitanteId: string;
let outroSolicitanteId: string;
let tecnicoId: string;
let outroTecnicoId: string;
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
        const apontamentoRepo = appDataSource.getRepository(ApontamentoOS);
        const equipRepo = appDataSource.getRepository(Equipamento);
        const userRepo = appDataSource.getRepository(Usuario);

        // Limpar na ordem correta (respeitar FKs)
        await historicoRepo.createQueryBuilder().delete().execute();
        await apontamentoRepo.createQueryBuilder().delete().execute();
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
        outroSolicitanteId = await criarUsuario(
            "Outro Solicitante OS",
            "outro-solicitante-os-rt@teste.com",
            Perfil.SOLICITANTE,
            "OS-USER-004"
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
        outroTecnicoId = await criarUsuario(
            "Outro Tecnico OS",
            "outro-tecnico-os-rt@teste.com",
            Perfil.TECNICO,
            "OS-USER-005"
        );

        solicitanteToken = await login("solicitante-os-rt@teste.com");
        outroSolicitanteToken = await login("outro-solicitante-os-rt@teste.com");
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
            const apontamentoRepo = appDataSource.getRepository(ApontamentoOS);
            const equipRepo = appDataSource.getRepository(Equipamento);
            const userRepo = appDataSource.getRepository(Usuario);

            await historicoRepo.createQueryBuilder().delete().execute();
            await apontamentoRepo.createQueryBuilder().delete().execute();
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

    test("POST /ordens-servico - Deve criar OS mesmo com sequence do número atrasada", async () => {
        const primeira = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                equipamentoId,
                tipo_manutencao: "PREVENTIVA",
                prioridade: "MÉDIA",
                descricao_falha: "Validação de sequência sincronizada",
            });

        expect(primeira.status).toBe(201);

        await appDataSource.query(`SELECT setval('ordem_servico_numero_seq', 1, true)`);

        const segunda = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                equipamentoId,
                tipo_manutencao: "CORRETIVA",
                prioridade: "ALTA",
                descricao_falha: "Validação após atraso manual da sequência",
            });

        expect(segunda.status).toBe(201);
        expect(segunda.body.numero).not.toBe(primeira.body.numero);
    });

    // READ
    test("GET /ordens-servico - Deve listar todas as OS", async () => {
        const response = await request(app)
            .get("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test("GET /ordens-servico - Solicitante deve ver apenas as próprias OS", async () => {
        const createOwnRes = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                equipamentoId,
                tipo_manutencao: "CORRETIVA",
                prioridade: "ALTA",
                descricao_falha: "OS do solicitante autenticado",
            });

        const createOtherRes = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${outroSolicitanteToken}`)
            .send({
                equipamentoId,
                tipo_manutencao: "CORRETIVA",
                prioridade: "BAIXA",
                descricao_falha: "OS de outro solicitante",
            });

        const response = await request(app)
            .get("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`);

        expect(response.status).toBe(200);
        expect(response.body.some((os: any) => os.id === createOwnRes.body.id)).toBe(true);
        expect(response.body.some((os: any) => os.id === createOtherRes.body.id)).toBe(false);
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

    test("GET /ordens-servico - Deve buscar por número ou descrição", async () => {
        const createRes = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                equipamentoId,
                tipo_manutencao: "CORRETIVA",
                prioridade: "ALTA",
                descricao_falha: "Falha específica no motor principal da esteira",
            });

        const byNumber = await request(app)
            .get("/ordens-servico")
            .query({ busca: createRes.body.numero })
            .set("Authorization", `Bearer ${solicitanteToken}`);

        expect(byNumber.status).toBe(200);
        expect(byNumber.body.some((os: any) => os.id === createRes.body.id)).toBe(true);

        const byDescription = await request(app)
            .get("/ordens-servico")
            .query({ busca: "motor principal" })
            .set("Authorization", `Bearer ${solicitanteToken}`);

        expect(byDescription.status).toBe(200);
        expect(byDescription.body.some((os: any) => os.id === createRes.body.id)).toBe(true);
    });

    test("GET /ordens-servico - Deve filtrar por período de abertura", async () => {
        const createRes = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                equipamentoId,
                tipo_manutencao: "CORRETIVA",
                prioridade: "MÉDIA",
                descricao_falha: "OS para validar filtro por período de abertura",
            });

        const dataAbertura = String(createRes.body.abertura_em).slice(0, 10);
        const dataFutura = new Date(createRes.body.abertura_em);
        dataFutura.setDate(dataFutura.getDate() + 1);
        const dataFuturaIso = dataFutura.toISOString().slice(0, 10);

        const dentroPeriodo = await request(app)
            .get("/ordens-servico")
            .query({ dataInicio: dataAbertura, dataFim: dataAbertura })
            .set("Authorization", `Bearer ${solicitanteToken}`);

        const foraPeriodo = await request(app)
            .get("/ordens-servico")
            .query({ dataInicio: dataFuturaIso, dataFim: dataFuturaIso })
            .set("Authorization", `Bearer ${solicitanteToken}`);

        expect(dentroPeriodo.status).toBe(200);
        expect(dentroPeriodo.body.some((os: any) => os.id === createRes.body.id)).toBe(true);
        expect(foraPeriodo.status).toBe(200);
        expect(foraPeriodo.body.some((os: any) => os.id === createRes.body.id)).toBe(false);
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

    test("GET /ordens-servico/:id - Solicitante não deve acessar OS de outro solicitante", async () => {
        const createRes = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${outroSolicitanteToken}`)
            .send({
                equipamentoId,
                tipo_manutencao: "PREVENTIVA",
                prioridade: "MÉDIA",
                descricao_falha: "OS privada de outro solicitante",
            });

        const response = await request(app)
            .get(`/ordens-servico/${createRes.body.id}`)
            .set("Authorization", `Bearer ${solicitanteToken}`);

        expect(response.status).toBe(403);
        expect(response.body.message).toBe("Acesso negado");
    });

    test("PATCH /ordens-servico/:id/assumir - Técnico deve conseguir assumir OS aberta disponível", async () => {
        const createRes = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                equipamentoId,
                tipo_manutencao: "CORRETIVA",
                prioridade: "ALTA",
                descricao_falha: "OS para ser assumida pelo técnico",
            });

        const response = await request(app)
            .patch(`/ordens-servico/${createRes.body.id}/assumir`)
            .set("Authorization", `Bearer ${tecnicoToken}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("ABERTA");
        expect(response.body.tecnico).toBeDefined();
        expect(response.body.tecnico.id).toBe(tecnicoId);
    });

    // FLUXO COMPLETO: Criar -> Atribuir Técnico -> Concluir
    describe("Fluxo completo de OS", () => {
        let osId: string;
        let apontamentoId: string;

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
            expect(response.body.status).toBe("ABERTA");
            expect(response.body.tecnico).toBeDefined();
            expect(response.body.tecnico.id).toBe(tecnicoId);
            expect(response.body.inicio_em).toBeNull();
        });

        test("PATCH /ordens-servico/:id/iniciar - Deve iniciar a OS", async () => {
            const response = await request(app)
                .patch(`/ordens-servico/${osId}/iniciar`)
                .set("Authorization", `Bearer ${tecnicoToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe("EM_ANDAMENTO");
            expect(response.body.inicio_em).toBeDefined();
        });

        test("POST /ordens-servico/:id/apontamentos/iniciar - Deve iniciar apontamento", async () => {
            const response = await request(app)
                .post(`/ordens-servico/${osId}/apontamentos/iniciar`)
                .set("Authorization", `Bearer ${tecnicoToken}`)
                .send({ observacao: "Início do diagnóstico do servidor" });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].fimEm).toBeNull();
            apontamentoId = response.body[0].id;
        });

        test("POST /ordens-servico/:id/apontamentos/iniciar - Deve falhar com apontamento já aberto", async () => {
            const response = await request(app)
                .post(`/ordens-servico/${osId}/apontamentos/iniciar`)
                .set("Authorization", `Bearer ${tecnicoToken}`)
                .send({ observacao: "Tentativa duplicada" });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Já existe um apontamento de trabalho em aberto para esta OS");
        });

        test("GET /ordens-servico/:id/apontamentos - Deve listar apontamentos da OS", async () => {
            const response = await request(app)
                .get(`/ordens-servico/${osId}/apontamentos`)
                .set("Authorization", `Bearer ${tecnicoToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body[0].id).toBe(apontamentoId);
        });

        test("PATCH /ordens-servico/:id/apontamentos/finalizar - Deve finalizar apontamento", async () => {
            const apontamentoRepo = appDataSource.getRepository(ApontamentoOS);
            const apontamento = await apontamentoRepo.findOneByOrFail({ id: apontamentoId });
            apontamento.inicioEm = new Date(Date.now() - 2 * 60 * 60 * 1000);
            await apontamentoRepo.save(apontamento);

            const response = await request(app)
                .patch(`/ordens-servico/${osId}/apontamentos/finalizar`)
                .set("Authorization", `Bearer ${tecnicoToken}`)
                .send({ observacao: "Diagnóstico concluído" });

            expect(response.status).toBe(200);
            expect(response.body[0].fimEm).toBeDefined();
        });

        test("PATCH /ordens-servico/:id/atribuir-tecnico - Deve falhar ao transferir com apontamento em aberto", async () => {
            const response = await request(app)
                .post("/ordens-servico")
                .set("Authorization", `Bearer ${solicitanteToken}`)
                .send({
                    equipamentoId,
                    tipo_manutencao: "CORRETIVA",
                    prioridade: "ALTA",
                    descricao_falha: "Teste de transferência com apontamento aberto",
                });

            const osTransferenciaId = response.body.id;

            await request(app)
                .patch(`/ordens-servico/${osTransferenciaId}/atribuir-tecnico`)
                .set("Authorization", `Bearer ${supervisorToken}`)
                .send({ tecnicoId });

            await request(app)
                .patch(`/ordens-servico/${osTransferenciaId}/iniciar`)
                .set("Authorization", `Bearer ${tecnicoToken}`);

            await request(app)
                .post(`/ordens-servico/${osTransferenciaId}/apontamentos/iniciar`)
                .set("Authorization", `Bearer ${tecnicoToken}`)
                .send({ observacao: "Apontamento ainda aberto" });

            const transferResponse = await request(app)
                .patch(`/ordens-servico/${osTransferenciaId}/atribuir-tecnico`)
                .set("Authorization", `Bearer ${supervisorToken}`)
                .send({ tecnicoId: outroTecnicoId });

            expect(transferResponse.status).toBe(400);
            expect(transferResponse.body.message).toBe(
                "Finalize o apontamento de trabalho em aberto antes de transferir a OS para outro técnico"
            );
        });

        test("PATCH /ordens-servico/:id/atribuir-tecnico - Deve permitir transferir após fechar apontamento", async () => {
            const response = await request(app)
                .post("/ordens-servico")
                .set("Authorization", `Bearer ${solicitanteToken}`)
                .send({
                    equipamentoId,
                    tipo_manutencao: "CORRETIVA",
                    prioridade: "ALTA",
                    descricao_falha: "Teste de transferência após fechar apontamento",
                });

            const osTransferenciaId = response.body.id;

            await request(app)
                .patch(`/ordens-servico/${osTransferenciaId}/atribuir-tecnico`)
                .set("Authorization", `Bearer ${supervisorToken}`)
                .send({ tecnicoId });

            await request(app)
                .patch(`/ordens-servico/${osTransferenciaId}/iniciar`)
                .set("Authorization", `Bearer ${tecnicoToken}`);

            await request(app)
                .post(`/ordens-servico/${osTransferenciaId}/apontamentos/iniciar`)
                .set("Authorization", `Bearer ${tecnicoToken}`)
                .send({ observacao: "Apontamento a ser encerrado" });

            await request(app)
                .patch(`/ordens-servico/${osTransferenciaId}/apontamentos/finalizar`)
                .set("Authorization", `Bearer ${tecnicoToken}`)
                .send({ observacao: "Encerrado antes da transferência" });

            const transferResponse = await request(app)
                .patch(`/ordens-servico/${osTransferenciaId}/atribuir-tecnico`)
                .set("Authorization", `Bearer ${supervisorToken}`)
                .send({ tecnicoId: outroTecnicoId });

            expect(transferResponse.status).toBe(200);
            expect(transferResponse.body.tecnico.id).toBe(outroTecnicoId);
        });

        test("PATCH /ordens-servico/:id/status - Deve atualizar status", async () => {
            const response = await request(app)
                .patch(`/ordens-servico/${osId}/status`)
                .set("Authorization", `Bearer ${tecnicoToken}`)
                .send({
                    status: "AGUARDANDO_PECA",
                    observacao: "Aguardando chegada do SSD 1TB Samsung EVO",
                });

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
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe("CONCLUIDA");
            expect(response.body.descricao_servico).toBe(
                "Substituição do disco rígido e reinstalação do sistema"
            );
            expect(response.body.pecas_utilizadas).toBe("SSD 1TB Samsung EVO");
            expect(Number(response.body.horas_trabalhadas)).toBeGreaterThanOrEqual(2);
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
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
            "Não é possível concluir uma OS sem técnico atribuído"
        );
    });

    test("PATCH /ordens-servico/:id/concluir - Deve falhar com apontamento em aberto", async () => {
        const createRes = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                equipamentoId,
                tipo_manutencao: "PREVENTIVA",
                prioridade: "ALTA",
                descricao_falha: "Teste de apontamento aberto",
            });

        const osId = createRes.body.id;

        await request(app)
            .patch(`/ordens-servico/${osId}/atribuir-tecnico`)
            .set("Authorization", `Bearer ${supervisorToken}`)
            .send({ tecnicoId });

        await request(app)
            .patch(`/ordens-servico/${osId}/iniciar`)
            .set("Authorization", `Bearer ${tecnicoToken}`);

        await request(app)
            .post(`/ordens-servico/${osId}/apontamentos/iniciar`)
            .set("Authorization", `Bearer ${tecnicoToken}`)
            .send({ observacao: "Atendimento em curso" });

        const response = await request(app)
            .patch(`/ordens-servico/${osId}/concluir`)
            .set("Authorization", `Bearer ${tecnicoToken}`)
            .send({
                descricao_servico: "Tentativa de conclusão com apontamento aberto",
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
            "Finalize o apontamento de trabalho em aberto antes de concluir a OS"
        );
    });

    test("PATCH /ordens-servico/:id/status - Deve impedir cancelamento por técnico", async () => {
        const createRes = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                equipamentoId,
                tipo_manutencao: "CORRETIVA",
                prioridade: "ALTA",
                descricao_falha: "Teste de cancelamento por técnico",
            });

        await request(app)
            .patch(`/ordens-servico/${createRes.body.id}/atribuir-tecnico`)
            .set("Authorization", `Bearer ${supervisorToken}`)
            .send({ tecnicoId });

        await request(app)
            .patch(`/ordens-servico/${createRes.body.id}/iniciar`)
            .set("Authorization", `Bearer ${tecnicoToken}`);

        const response = await request(app)
            .patch(`/ordens-servico/${createRes.body.id}/status`)
            .set("Authorization", `Bearer ${tecnicoToken}`)
            .send({ status: "CANCELADA" });

        expect(response.status).toBe(403);
        expect(response.body.message).toBe("Apenas o supervisor pode cancelar uma OS");
    });

    test("PATCH /ordens-servico/:id/status - Supervisor pode cancelar OS", async () => {
        const createRes = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                equipamentoId,
                tipo_manutencao: "CORRETIVA",
                prioridade: "ALTA",
                descricao_falha: "Teste de cancelamento por supervisor",
            });

        const response = await request(app)
            .patch(`/ordens-servico/${createRes.body.id}/status`)
            .set("Authorization", `Bearer ${supervisorToken}`)
            .send({ status: "CANCELADA" });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("CANCELADA");
    });

    test("PATCH /ordens-servico/:id/concluir - OS estourada continua com prazo estourado ao concluir", async () => {
        const createRes = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                equipamentoId,
                tipo_manutencao: "CORRETIVA",
                prioridade: "CRÍTICA",
                descricao_falha: "Teste prazo estourado ao concluir",
            });

        const osRepo = appDataSource.getRepository(OrdemServico);
        await osRepo.update(createRes.body.id, {
            abertura_em: new Date(Date.now() - 8 * 60 * 60 * 1000),
        });

        await request(app)
            .patch(`/ordens-servico/${createRes.body.id}/atribuir-tecnico`)
            .set("Authorization", `Bearer ${supervisorToken}`)
            .send({ tecnicoId });

        await request(app)
            .patch(`/ordens-servico/${createRes.body.id}/iniciar`)
            .set("Authorization", `Bearer ${tecnicoToken}`);

        const response = await request(app)
            .patch(`/ordens-servico/${createRes.body.id}/concluir`)
            .set("Authorization", `Bearer ${tecnicoToken}`)
            .send({
                descricao_servico: "Conclusão após prazo limite",
            });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("CONCLUIDA");
        expect(response.body.status_prazo).toBe(
            StatusPrazoOS.CONCLUIDA_COM_PRAZO_ESTOURADO
        );
    });
});
