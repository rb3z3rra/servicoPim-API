import request from "supertest";
import { app } from "../../src/server.js";
import { appDataSource } from "../../src/database/appDataSource.js";
import { Usuario } from "../../src/entities/Usuario.js";
import { Equipamento } from "../../src/entities/Equipamento.js";
import { OrdemServico } from "../../src/entities/OrdemServico.js";
import { HistoricoOS } from "../../src/entities/HistoricoOS.js";
import { ApontamentoOS } from "../../src/entities/ApontamentoOS.js";
import { Perfil } from "../../src/types/usr_perfil.js";
import { Prioridade } from "../../src/types/os_prioridade.js";
import { Like } from "typeorm";
import bcrypt from "bcryptjs";

let supervisorToken: string;
let solicitanteToken: string;
let tecnicoToken: string;
let gestorToken: string;
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

describe("Testes de Integração - Dashboard (Banco Real)", () => {
    beforeAll(async () => {
        if (!appDataSource.isInitialized) {
            await appDataSource.initialize();
            await appDataSource.runMigrations();
        }

        const historicoRepo = appDataSource.getRepository(HistoricoOS);
        const apontamentoRepo = appDataSource.getRepository(ApontamentoOS);
        const osRepo = appDataSource.getRepository(OrdemServico);
        const equipRepo = appDataSource.getRepository(Equipamento);
        const userRepo = appDataSource.getRepository(Usuario);

        await historicoRepo.createQueryBuilder().delete().execute();
        await apontamentoRepo.createQueryBuilder().delete().execute();
        await osRepo.createQueryBuilder().delete().execute();
        await equipRepo.delete({ codigo: Like("TESTE-DASH-%") });
        await userRepo.delete({ email: Like("%dash-rt@teste.com") });

        await criarUsuario(
            "Solicitante Dash",
            "solicitante-dash-rt@teste.com",
            Perfil.SOLICITANTE,
            "DASH-USER-001"
        );
        await criarUsuario(
            "Supervisor Dash",
            "supervisor-dash-rt@teste.com",
            Perfil.SUPERVISOR,
            "DASH-USER-002"
        );
        tecnicoId = await criarUsuario(
            "Tecnico Dash",
            "tecnico-dash-rt@teste.com",
            Perfil.TECNICO,
            "DASH-USER-003"
        );
        await criarUsuario(
            "Gestor Dash",
            "gestor-dash-rt@teste.com",
            Perfil.GESTOR,
            "DASH-USER-004"
        );

        solicitanteToken = await login("solicitante-dash-rt@teste.com");
        supervisorToken = await login("supervisor-dash-rt@teste.com");
        tecnicoToken = await login("tecnico-dash-rt@teste.com");
        gestorToken = await login("gestor-dash-rt@teste.com");

        const equipRes = await request(app)
            .post("/equipamentos")
            .set("Authorization", `Bearer ${supervisorToken}`)
            .send({
                codigo: "TESTE-DASH-001",
                nome: "Equipamento Dashboard",
                tipo: "Servidor",
                localizacao: "Datacenter",
            });
        equipamentoId = equipRes.body.id;

        const osRes = await request(app)
            .post("/ordens-servico")
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                equipamentoId,
                tipo_manutencao: "CORRETIVA",
                prioridade: "CRÍTICA",
                descricao_falha: "OS para indicadores do dashboard",
            });

        await request(app)
            .patch(`/ordens-servico/${osRes.body.id}/atribuir-tecnico`)
            .set("Authorization", `Bearer ${supervisorToken}`)
            .send({ tecnicoId });

        await request(app)
            .patch(`/ordens-servico/${osRes.body.id}/iniciar`)
            .set("Authorization", `Bearer ${tecnicoToken}`);
    });

    afterAll(async () => {
        if (appDataSource.isInitialized) {
            const historicoRepo = appDataSource.getRepository(HistoricoOS);
            const apontamentoRepo = appDataSource.getRepository(ApontamentoOS);
            const osRepo = appDataSource.getRepository(OrdemServico);
            const equipRepo = appDataSource.getRepository(Equipamento);
            const userRepo = appDataSource.getRepository(Usuario);

            await historicoRepo.createQueryBuilder().delete().execute();
            await apontamentoRepo.createQueryBuilder().delete().execute();
            await osRepo.createQueryBuilder().delete().execute();
            await equipRepo.delete({ codigo: Like("TESTE-DASH-%") });
            await userRepo.delete({ email: Like("%dash-rt@teste.com") });
            await appDataSource.destroy();
        }
    });

    test("GET /dashboard - Deve retornar os indicadores agregados para supervisor", async () => {
        const response = await request(app)
            .get("/dashboard")
            .set("Authorization", `Bearer ${supervisorToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("abertas");
        expect(response.body).toHaveProperty("em_andamento");
        expect(response.body).toHaveProperty("aguardando_peca");
        expect(response.body).toHaveProperty("concluidas_mes");
        expect(response.body).toHaveProperty("criticas_abertas");
        expect(response.body).toHaveProperty("sem_tecnico");
        expect(response.body).toHaveProperty("tempo_medio_ate_inicio_horas");
        expect(response.body).toHaveProperty("tempo_medio_ate_conclusao_horas");
        expect(response.body).toHaveProperty("prazo_horas");
    });

    test("GET /dashboard - Gestor deve visualizar indicadores gerais", async () => {
        const response = await request(app)
            .get("/dashboard")
            .set("Authorization", `Bearer ${gestorToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("abertas");
        expect(response.body).toHaveProperty("em_andamento");
        expect(response.body).toHaveProperty("criticas_abertas");
        expect(response.body).toHaveProperty("prazo_horas");
        expect(response.body.prazo_horas).toEqual(
            expect.objectContaining({
                [Prioridade.CRITICA]: expect.any(Number),
            })
        );
    });

    test("GET /dashboard - Deve retornar indicadores do técnico com campos específicos", async () => {
        const response = await request(app)
            .get("/dashboard")
            .set("Authorization", `Bearer ${tecnicoToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("disponiveis_para_assumir");
        expect(response.body).toHaveProperty("minhas_atribuidas");
        expect(response.body).toHaveProperty("apontamento_aberto");
        expect(response.body.minhas_atribuidas).toBeGreaterThanOrEqual(1);
    });

    test("GET /dashboard - Deve retornar indicadores do solicitante", async () => {
        const response = await request(app)
            .get("/dashboard")
            .set("Authorization", `Bearer ${solicitanteToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("abertas");
        expect(response.body).toHaveProperty("concluidas_mes");
        expect(response.body).toHaveProperty("tempo_medio_ate_conclusao_horas");
    });
});
