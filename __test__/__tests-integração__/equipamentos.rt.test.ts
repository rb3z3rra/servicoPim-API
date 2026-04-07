import request from "supertest";
import { app } from "../../server.js";
import { appDataSource } from "../../src/database/appDataSource.js";
import { Usuario } from "../../src/entities/Usuario.js";
import { Equipamento } from "../../src/entities/Equipamento.js";
import { Perfil } from "../../src/types/usr_perfil.js";
import { Like } from "typeorm";
import bcrypt from "bcryptjs";

let accessToken: string;

async function loginAndGetToken(): Promise<string> {
    const email = "admin-equip@teste.com";
    const repo = appDataSource.getRepository(Usuario);
    await repo.delete({ email });

    const senhaHash = await bcrypt.hash("senha123", 10);
    await repo.save({
        nome: "Admin Equip",
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

describe("Testes de Integração - Rotas de Equipamentos (Banco Real)", () => {
    beforeAll(async () => {
        if (!appDataSource.isInitialized) {
            await appDataSource.initialize();
        }
        accessToken = await loginAndGetToken();
    });

    afterAll(async () => {
        if (appDataSource.isInitialized) {
            const equipRepo = appDataSource.getRepository(Equipamento);
            await equipRepo.delete({ codigo: Like("TESTE-%") });
            const userRepo = appDataSource.getRepository(Usuario);
            await userRepo.delete({ email: Like("%@teste.com") });
            await appDataSource.destroy();
        }
    });

    beforeEach(async () => {
        const repo = appDataSource.getRepository(Equipamento);
        await repo.delete({ codigo: Like("TESTE-%") });
    });

    // CREATE
    test("POST /equipamentos - Deve criar um novo equipamento com sucesso", async () => {
        const response = await request(app)
            .post("/equipamentos")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                codigo: "TESTE-001",
                nome: "Notebook Dell",
                tipo: "Notebook",
                localizacao: "Sala 101",
                fabricante: "Dell",
                modelo: "Inspiron 15",
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("id");
        expect(response.body.codigo).toBe("TESTE-001");
        expect(response.body.nome).toBe("Notebook Dell");
        expect(response.body.tipo).toBe("Notebook");
        expect(response.body.localizacao).toBe("Sala 101");
    });

    test("POST /equipamentos - Deve falhar com código duplicado", async () => {
        await request(app)
            .post("/equipamentos")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                codigo: "TESTE-DUP",
                nome: "Equip Original",
                tipo: "Impressora",
                localizacao: "Sala 201",
            });

        const response = await request(app)
            .post("/equipamentos")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                codigo: "TESTE-DUP",
                nome: "Equip Duplicado",
                tipo: "Impressora",
                localizacao: "Sala 202",
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Código do equipamento já cadastrado");
    });

    test("POST /equipamentos - Deve falhar sem autenticação", async () => {
        const response = await request(app)
            .post("/equipamentos")
            .send({
                codigo: "TESTE-NOAUTH",
                nome: "Equip Sem Auth",
                tipo: "Monitor",
                localizacao: "Sala 301",
            });

        expect(response.status).toBe(401);
    });

    test("POST /equipamentos - Deve falhar com dados inválidos", async () => {
        const response = await request(app)
            .post("/equipamentos")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                codigo: "A",
                nome: "",
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Dados inválidos");
    });

    // READ
    test("GET /equipamentos - Deve listar todos os equipamentos", async () => {
        await request(app)
            .post("/equipamentos")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                codigo: "TESTE-LIST",
                nome: "Equip Lista",
                tipo: "Mouse",
                localizacao: "Sala 101",
            });

        const response = await request(app)
            .get("/equipamentos")
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    test("GET /equipamentos/:id - Deve buscar equipamento por ID", async () => {
        const createRes = await request(app)
            .post("/equipamentos")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                codigo: "TESTE-GETID",
                nome: "Equip GetById",
                tipo: "Teclado",
                localizacao: "Sala 102",
            });

        const response = await request(app)
            .get(`/equipamentos/${createRes.body.id}`)
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(createRes.body.id);
        expect(response.body.codigo).toBe("TESTE-GETID");
    });

    test("GET /equipamentos/:id - Deve falhar com ID inexistente", async () => {
        const response = await request(app)
            .get("/equipamentos/999999")
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Equipamento não encontrado");
    });

    // UPDATE
    test("PUT /equipamentos/:id - Deve atualizar equipamento", async () => {
        const createRes = await request(app)
            .post("/equipamentos")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                codigo: "TESTE-UPD",
                nome: "Antes Update",
                tipo: "Monitor",
                localizacao: "Sala 103",
            });

        const response = await request(app)
            .put(`/equipamentos/${createRes.body.id}`)
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                nome: "Depois Update",
                localizacao: "Sala 999",
            });

        expect(response.status).toBe(200);
        expect(response.body.nome).toBe("Depois Update");
        expect(response.body.localizacao).toBe("Sala 999");
        expect(response.body.codigo).toBe("TESTE-UPD");
    });

    // DELETE
    test("DELETE /equipamentos/:id - Deve deletar equipamento", async () => {
        const createRes = await request(app)
            .post("/equipamentos")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                codigo: "TESTE-DEL",
                nome: "Para Deletar",
                tipo: "Webcam",
                localizacao: "Sala 104",
            });

        const response = await request(app)
            .delete(`/equipamentos/${createRes.body.id}`)
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(204);

        const getRes = await request(app)
            .get(`/equipamentos/${createRes.body.id}`)
            .set("Authorization", `Bearer ${accessToken}`);

        expect(getRes.status).toBe(400);
        expect(getRes.body.message).toBe("Equipamento não encontrado");
    });
});
