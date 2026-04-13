import request from "supertest";
import { app } from "../../src/server.js";
import { appDataSource } from "../../src/database/appDataSource.js";
import { Usuario } from "../../src/entities/Usuario.js";
import { Perfil } from "../../src/types/usr_perfil.js";
import { Like } from "typeorm";
import bcrypt from "bcryptjs";

describe("Testes de Integração - Rotas de Autenticação (Banco Real)", () => {

    beforeAll(async () => {
        if (!appDataSource.isInitialized) {
            await appDataSource.initialize();
            await appDataSource.runMigrations();
        }
    });

    afterAll(async () => {
        if (appDataSource.isInitialized) {
            const repo = appDataSource.getRepository(Usuario);
            await repo.delete({ email: Like("%@teste.com") });
            await appDataSource.destroy();
        }
    });

    beforeEach(async () => {
        if (appDataSource.isInitialized) {
            const repo = appDataSource.getRepository(Usuario);
            await repo.delete({ email: Like("%@teste.com") });
        }
    });

    test("POST /auth/login - Deve retornar accessToken e refreshToken REAIS do banco", async () => {
        const email = "login-sucesso@teste.com";
        const repo = appDataSource.getRepository(Usuario);

        await repo.delete({ email });

        const senhaHash = await bcrypt.hash("senha123", 10);
        await repo.save({
            nome: "Usuario Sucesso",
            email,
            matricula: "AUTH-RT-001",
            senha_hash: senhaHash,
            perfil: Perfil.SOLICITANTE,
            setor: "TI",
            ativo: true
        });

        const response = await request(app)
            .post("/auth/login")
            .send({
                email,
                senha: "senha123"
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("accessToken");
        expect(response.body).toHaveProperty("refreshToken");

        await repo.delete({ email });
    });

    test("POST /auth/login - Deve falhar com senha errada", async () => {
         const email = "login-falha@teste.com";
         const repo = appDataSource.getRepository(Usuario);
         await repo.delete({ email });

         const senhaHash = await bcrypt.hash("senha123", 10);
         await repo.save({
             nome: "Usuario Falha",
             email,
             matricula: "AUTH-RT-002",
             senha_hash: senhaHash,
             perfil: Perfil.SOLICITANTE,
             setor: "TI",
             ativo: true
         });

        const response = await request(app)
            .post("/auth/login")
            .send({
                email,
                senha: "senha_errada"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Email ou senha inválidos");

        await repo.delete({ email });
    });

    test("POST /auth/refresh - Deve retornar novos tokens se o refreshToken for válido", async () => {
        const email = "refresh-sucesso@teste.com";
        const repo = appDataSource.getRepository(Usuario);
        await repo.delete({ email });

        const senhaHash = await bcrypt.hash("senha123", 10);
        await repo.save({
            nome: "Usuario Refresh",
            email,
            matricula: "AUTH-RT-003",
            senha_hash: senhaHash,
            perfil: Perfil.SOLICITANTE,
            setor: "TI",
            ativo: true
        });

        const loginResponse = await request(app)
            .post("/auth/login")
            .send({ email, senha: "senha123" });

        const { refreshToken } = loginResponse.body;

        const response = await request(app)
            .post("/auth/refresh")
            .send({ refreshToken });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("accessToken");
        expect(response.body).toHaveProperty("refreshToken");

        await repo.delete({ email });
    });

    test("POST /auth/refresh - Deve falhar com refreshToken inválido", async () => {
        const response = await request(app)
            .post("/auth/refresh")
            .send({ refreshToken: "token_invalido_qualquer" });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Refresh Token inválido ou expirado");
    });
});
