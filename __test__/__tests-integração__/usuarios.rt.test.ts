import request from "supertest";
import { app } from "../../server.js";
import { appDataSource } from "../../src/database/appDataSource.js";
import { Usuario } from "../../src/entities/Usuario.js";
import { Perfil } from "../../src/types/usr_perfil.js";
import { Like } from "typeorm";
import bcrypt from "bcryptjs";

let accessToken: string;

async function loginAndGetToken(): Promise<string> {
    const email = "admin-auth@teste.com";
    const repo = appDataSource.getRepository(Usuario);
    await repo.delete({ email });

    const senhaHash = await bcrypt.hash("senha123", 10);
    await repo.save({
        nome: "Admin Auth",
        email,
        senha_hash: senhaHash,
        perfil: Perfil.SOLICITANTE,
        setor: "TI",
        ativo: true,
    });

    const res = await request(app)
        .post("/auth/login")
        .send({ email, senha: "senha123" });

    return res.body.accessToken;
}

describe("Testes de Integração - Rotas de Usuários (Banco Real)", () => {
    beforeAll(async () => {
        if (!appDataSource.isInitialized) {
            await appDataSource.initialize();
        }
        accessToken = await loginAndGetToken();
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
                senha_hash: "senha123",
                perfil: "SOLICITANTE",
                setor: "TI",
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("id");
        expect(response.body.nome).toBe("Novo Usuario");
        expect(response.body.email).toBe("criar-usuario-rt@teste.com");
        expect(response.body.perfil).toBe("SOLICITANTE");
    });

    test("POST /usuarios - Deve falhar com email duplicado", async () => {
        await request(app)
            .post("/usuarios")
            .send({
                nome: "Usuario Original",
                email: "duplicado-usuario-rt@teste.com",
                senha_hash: "senha123",
                perfil: "SOLICITANTE",
                setor: "TI",
            });

        const response = await request(app)
            .post("/usuarios")
            .send({
                nome: "Usuario Duplicado",
                email: "duplicado-usuario-rt@teste.com",
                senha_hash: "senha123",
                perfil: "SOLICITANTE",
                setor: "TI",
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Email já cadastrado");
    });

    test("POST /usuarios - Deve falhar com dados inválidos", async () => {
        const response = await request(app)
            .post("/usuarios")
            .send({
                nome: "AB",
                email: "email-invalido",
                senha_hash: "123",
                perfil: "INVALIDO",
            });

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
                senha_hash: "senha123",
                perfil: "SOLICITANTE",
                setor: "TI",
            });

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
                senha_hash: "senha123",
                perfil: "SOLICITANTE",
                setor: "TI",
            });

        const response = await request(app)
            .put(`/usuarios/${createRes.body.id}`)
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                nome: "Depois Update",
                setor: "RH",
            });

        expect(response.status).toBe(200);
        expect(response.body.nome).toBe("Depois Update");
        expect(response.body.setor).toBe("RH");
    });

    // DELETE
    test("DELETE /usuarios/:id - Deve deletar usuário", async () => {
        const createRes = await request(app)
            .post("/usuarios")
            .send({
                nome: "Para Deletar",
                email: "deletar-usuario-rt@teste.com",
                senha_hash: "senha123",
                perfil: "SOLICITANTE",
                setor: "TI",
            });

        const response = await request(app)
            .delete(`/usuarios/${createRes.body.id}`)
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(204);

        const getRes = await request(app)
            .get(`/usuarios/${createRes.body.id}`)
            .set("Authorization", `Bearer ${accessToken}`);

        expect(getRes.status).toBe(400);
        expect(getRes.body.message).toBe("Usuário não encontrado");
    });
});
