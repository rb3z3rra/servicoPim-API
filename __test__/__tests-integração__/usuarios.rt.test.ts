import request from "supertest";
import { app } from "../../src/server.js";
import { appDataSource } from "../../src/database/appDataSource.js";
import { Usuario } from "../../src/entities/Usuario.js";
import { Perfil } from "../../src/types/usr_perfil.js";
import { Like } from "typeorm";
import bcrypt from "bcryptjs";

let accessToken: string;
let solicitanteToken: string;
let gestorToken: string;

async function criarUsuarioELogin(
    nome: string,
    email: string,
    perfil: Perfil,
    matricula: string
): Promise<string> {
    const repo = appDataSource.getRepository(Usuario);
    await repo.delete({ email });

    const senhaHash = await bcrypt.hash("senha123", 10);
    await repo.save({
        nome,
        email,
        matricula,
        senha_hash: senhaHash,
        perfil,
        setor: "TI",
        ativo: true,
    });

    const res = await request(app)
        .post("/auth/login")
        .send({ email, senha: "senha123" });

    return res.body.accessToken;
}

async function loginAndGetToken(): Promise<string> {
    return criarUsuarioELogin("Admin Auth", "admin-auth@teste.com", Perfil.SUPERVISOR, "ADM-RT-001");
}

describe("Testes de Integração - Rotas de Usuários (Banco Real)", () => {
    beforeAll(async () => {
        if (!appDataSource.isInitialized) {
            await appDataSource.initialize();
            await appDataSource.runMigrations();
        }
        accessToken = await loginAndGetToken();
        solicitanteToken = await criarUsuarioELogin(
            "Solicitante Auth",
            "solicitante-auth@teste.com",
            Perfil.SOLICITANTE,
            "SOL-RT-001"
        );
        gestorToken = await criarUsuarioELogin(
            "Gestor Auth",
            "gestor-auth@teste.com",
            Perfil.GESTOR,
            "GES-RT-001"
        );
    });

    afterAll(async () => {
        if (appDataSource.isInitialized) {
            const repo = appDataSource.getRepository(Usuario);
            await repo.delete({ email: Like("%@teste.com") });
            await appDataSource.destroy();
        }
    });

    beforeEach(async () => {
        const repo = appDataSource.getRepository(Usuario);
        await repo.delete({ email: Like("%usuario-rt@teste.com") });
    });

    // CREATE
    test("POST /usuarios - Deve criar um novo usuário com sucesso", async () => {
        const response = await request(app)
            .post("/usuarios")
            .send({
                nome: "Novo Usuario",
                email: "criar-usuario-rt@teste.com",
                matricula: "USR-RT-001",
                senha: "senha123",
                perfil: "SOLICITANTE",
                setor: "TI",
            })
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("id");
        expect(response.body.nome).toBe("Novo Usuario");
        expect(response.body.email).toBe("criar-usuario-rt@teste.com");
        expect(response.body.matricula).toBe("USR-RT-001");
        expect(response.body.perfil).toBe("SOLICITANTE");
    });

    test("POST /usuarios - Supervisor não deve criar gestor", async () => {
        const response = await request(app)
            .post("/usuarios")
            .send({
                nome: "Gestor Bloqueado",
                email: "gestor-bloqueado-usuario-rt@teste.com",
                matricula: "USR-RT-GES-BLOCK",
                senha: "senha123",
                perfil: Perfil.GESTOR,
                setor: "Gestão",
            })
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(403);
        expect(response.body.message).toBe("Perfil não permitido para o usuário autenticado");
    });

    test("POST /usuarios - Supervisor não deve criar supervisor", async () => {
        const response = await request(app)
            .post("/usuarios")
            .send({
                nome: "Supervisor Bloqueado",
                email: "supervisor-bloqueado-usuario-rt@teste.com",
                matricula: "USR-RT-SUP-BLOCK",
                senha: "senha123",
                perfil: Perfil.SUPERVISOR,
                setor: "Operação",
            })
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(403);
        expect(response.body.message).toBe("Perfil não permitido para o usuário autenticado");
    });

    test("POST /usuarios - Gestor deve criar supervisor", async () => {
        const response = await request(app)
            .post("/usuarios")
            .send({
                nome: "Supervisor Criado Por Gestor",
                email: "supervisor-gestor-usuario-rt@teste.com",
                matricula: "USR-RT-GES-SUP",
                senha: "senha123",
                perfil: Perfil.SUPERVISOR,
                setor: "Operação",
            })
            .set("Authorization", `Bearer ${gestorToken}`);

        expect(response.status).toBe(201);
        expect(response.body.perfil).toBe(Perfil.SUPERVISOR);
    });

    test("POST /usuarios - Gestor deve criar técnico", async () => {
        const response = await request(app)
            .post("/usuarios")
            .send({
                nome: "Tecnico Criado Por Gestor",
                email: "tecnico-gestor-usuario-rt@teste.com",
                matricula: "USR-RT-GES-TEC",
                senha: "senha123",
                perfil: Perfil.TECNICO,
                setor: "Manutenção",
            })
            .set("Authorization", `Bearer ${gestorToken}`);

        expect(response.status).toBe(201);
        expect(response.body.perfil).toBe(Perfil.TECNICO);
    });

    test("POST /usuarios - Gestor deve criar solicitante", async () => {
        const response = await request(app)
            .post("/usuarios")
            .send({
                nome: "Solicitante Criado Por Gestor",
                email: "solicitante-gestor-usuario-rt@teste.com",
                matricula: "USR-RT-GES-SOL",
                senha: "senha123",
                perfil: Perfil.SOLICITANTE,
                setor: "Produção",
            })
            .set("Authorization", `Bearer ${gestorToken}`);

        expect(response.status).toBe(201);
        expect(response.body.perfil).toBe(Perfil.SOLICITANTE);
    });

    test("POST /usuarios - Gestor não deve criar outro gestor", async () => {
        const response = await request(app)
            .post("/usuarios")
            .send({
                nome: "Outro Gestor Bloqueado",
                email: "outro-gestor-bloqueado-usuario-rt@teste.com",
                matricula: "USR-RT-GES-GES",
                senha: "senha123",
                perfil: Perfil.GESTOR,
                setor: "Gestão",
            })
            .set("Authorization", `Bearer ${gestorToken}`);

        expect(response.status).toBe(403);
        expect(response.body.message).toBe("Perfil não permitido para o usuário autenticado");
    });

    test("POST /usuarios - Deve falhar com email duplicado", async () => {
        await request(app)
            .post("/usuarios")
            .send({
                nome: "Usuario Original",
                email: "duplicado-usuario-rt@teste.com",
                matricula: "USR-RT-002",
                senha: "senha123",
                perfil: "SOLICITANTE",
                setor: "TI",
            })
            .set("Authorization", `Bearer ${accessToken}`);

        const response = await request(app)
            .post("/usuarios")
            .send({
                nome: "Usuario Duplicado",
                email: "duplicado-usuario-rt@teste.com",
                matricula: "USR-RT-003",
                senha: "senha123",
                perfil: "SOLICITANTE",
                setor: "TI",
            })
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Email já cadastrado");
    });

    test("POST /usuarios - Deve falhar com dados inválidos", async () => {
        const response = await request(app)
            .post("/usuarios")
            .send({
                nome: "AB",
                email: "email-invalido",
                senha: "123",
                perfil: "INVALIDO",
            })
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Dados inválidos");
        expect(response.body).toHaveProperty("errors");
    });

    // READ
    test("GET /usuarios - Deve listar todos os usuários", async () => {
        const response = await request(app)
            .get("/usuarios")
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test("GET /usuarios - Deve falhar sem token de autenticação", async () => {
        const response = await request(app).get("/usuarios");

        expect(response.status).toBe(401);
    });

    test("GET /usuarios/:id - Deve buscar usuário por ID", async () => {
        const createRes = await request(app)
            .post("/usuarios")
            .send({
                nome: "Buscar Por Id",
                email: "buscar-usuario-rt@teste.com",
                matricula: "USR-RT-004",
                senha: "senha123",
                perfil: "SOLICITANTE",
                setor: "TI",
            })
            .set("Authorization", `Bearer ${accessToken}`);

        const response = await request(app)
            .get(`/usuarios/${createRes.body.id}`)
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(createRes.body.id);
        expect(response.body.nome).toBe("Buscar Por Id");
    });

    test("GET /usuarios/:id - Deve falhar com ID inexistente", async () => {
        const response = await request(app)
            .get("/usuarios/00000000-0000-0000-0000-000000000000")
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Usuário não encontrado");
    });

    // UPDATE
    test("PUT /usuarios/:id - Deve atualizar usuário", async () => {
        const createRes = await request(app)
            .post("/usuarios")
            .send({
                nome: "Antes Update",
                email: "update-usuario-rt@teste.com",
                matricula: "USR-RT-005",
                senha: "senha123",
                perfil: "SOLICITANTE",
                setor: "TI",
            })
            .set("Authorization", `Bearer ${accessToken}`);

        const response = await request(app)
            .put(`/usuarios/${createRes.body.id}`)
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                nome: "Depois Update",
                matricula: "USR-RT-005-ALT",
                setor: "RH",
            });

        expect(response.status).toBe(200);
        expect(response.body.nome).toBe("Depois Update");
        expect(response.body.matricula).toBe("USR-RT-005-ALT");
        expect(response.body.setor).toBe("RH");
    });

    test("POST /usuarios - Deve falhar com matrícula duplicada", async () => {
        await request(app)
            .post("/usuarios")
            .send({
                nome: "Usuario Matricula Original",
                email: "matricula-original-usuario-rt@teste.com",
                matricula: "USR-RT-006",
                senha: "senha123",
                perfil: "SOLICITANTE",
                setor: "TI",
            })
            .set("Authorization", `Bearer ${accessToken}`);

        const response = await request(app)
            .post("/usuarios")
            .send({
                nome: "Usuario Matricula Duplicada",
                email: "matricula-duplicada-usuario-rt@teste.com",
                matricula: "USR-RT-006",
                senha: "senha123",
                perfil: "SOLICITANTE",
                setor: "TI",
            })
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Matrícula já cadastrada");
    });

    // AUTORIZAÇÃO (403 - ensureRole)
    test("POST /usuarios - Deve retornar 403 para perfil SOLICITANTE", async () => {
        const response = await request(app)
            .post("/usuarios")
            .send({
                nome: "Tentativa",
                email: "tentativa-usuario-rt@teste.com",
                matricula: "USR-RT-007",
                senha: "senha123",
                perfil: "SOLICITANTE",
                setor: "TI",
            })
            .set("Authorization", `Bearer ${solicitanteToken}`);

        expect(response.status).toBe(403);
        expect(response.body.message).toBe("Acesso negado");
    });

    test("GET /usuarios - Deve retornar 403 para perfil SOLICITANTE", async () => {
        const response = await request(app)
            .get("/usuarios")
            .set("Authorization", `Bearer ${solicitanteToken}`);

        expect(response.status).toBe(403);
        expect(response.body.message).toBe("Acesso negado");
    });

    test("GET /usuarios/:id - Deve retornar 403 para perfil SOLICITANTE", async () => {
        const response = await request(app)
            .get("/usuarios/00000000-0000-0000-0000-000000000000")
            .set("Authorization", `Bearer ${solicitanteToken}`);

        expect(response.status).toBe(403);
        expect(response.body.message).toBe("Acesso negado");
    });

    test("DELETE /usuarios/:id - Deve retornar 403 para perfil SOLICITANTE", async () => {
        const response = await request(app)
            .delete("/usuarios/00000000-0000-0000-0000-000000000000")
            .set("Authorization", `Bearer ${solicitanteToken}`);

        expect(response.status).toBe(403);
        expect(response.body.message).toBe("Acesso negado");
    });

    test("PUT /usuarios/:id - Deve bloquear solicitante ao alterar campos administrativos do próprio perfil", async () => {
        const repo = appDataSource.getRepository(Usuario);
        const solicitante = await repo.findOneOrFail({
            where: { email: "solicitante-auth@teste.com" },
        });

        const response = await request(app)
            .put(`/usuarios/${solicitante.id}`)
            .set("Authorization", `Bearer ${solicitanteToken}`)
            .send({
                perfil: "SUPERVISOR",
                ativo: false,
                matricula: "SOL-RT-ADMIN",
            });

        expect(response.status).toBe(403);
        expect(response.body.message).toBe(
            "Acesso negado: campos administrativos só podem ser alterados por supervisor"
        );

        const persisted = await repo.findOneOrFail({ where: { id: solicitante.id } });
        expect(persisted.perfil).toBe(Perfil.SOLICITANTE);
        expect(persisted.ativo).toBe(true);
        expect(persisted.matricula).toBe("SOL-RT-001");
    });

    // DELETE
    test("DELETE /usuarios/:id - Deve desativar usuário e bloquear novo login", async () => {
        const createRes = await request(app)
            .post("/usuarios")
            .send({
                nome: "Para Deletar",
                email: "deletar-usuario-rt@teste.com",
                matricula: "USR-RT-008",
                senha: "senha123",
                perfil: "SOLICITANTE",
                setor: "TI",
            })
            .set("Authorization", `Bearer ${accessToken}`);

        const response = await request(app)
            .delete(`/usuarios/${createRes.body.id}`)
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(204);

        const getRes = await request(app)
            .get(`/usuarios/${createRes.body.id}`)
            .set("Authorization", `Bearer ${accessToken}`);

        expect(getRes.status).toBe(200);
        expect(getRes.body.ativo).toBe(false);

        const loginRes = await request(app)
            .post("/auth/login")
            .send({
                email: "deletar-usuario-rt@teste.com",
                senha: "senha123",
            });

        expect(loginRes.status).toBe(403);
        expect(loginRes.body.message).toBe("Usuário inativo");
    });
});
