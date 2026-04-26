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

    test("POST /auth/login - Deve retornar accessToken e setar cookie httpOnly com refreshToken", async () => {
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
            .send({ email, senha: "senha123" });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("accessToken");
        expect(response.body).not.toHaveProperty("refreshToken");

        const setCookieHeader = response.headers["set-cookie"] as string[] | string | undefined;
        expect(setCookieHeader).toBeDefined();

        const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader!];
        const refreshCookie = cookies.find((c) => c.startsWith("refreshToken="));
        expect(refreshCookie).toBeDefined();
        expect(refreshCookie).toMatch(/HttpOnly/i);

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
            .send({ email, senha: "senha_errada" });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Email ou senha inválidos");

        await repo.delete({ email });
    });

    test("POST /auth/refresh - Deve retornar novo accessToken se o cookie refreshToken for válido", async () => {
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

        const setCookieHeader = loginResponse.headers["set-cookie"] as string[] | string;
        const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

        const response = await request(app)
            .post("/auth/refresh")
            .set("Cookie", cookies);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("accessToken");
        expect(response.body).not.toHaveProperty("refreshToken");

        const newSetCookie = response.headers["set-cookie"] as string[] | string | undefined;
        expect(newSetCookie).toBeDefined();

        await repo.delete({ email });
    });

    test("POST /auth/refresh - Deve falhar sem cookie de refreshToken", async () => {
        const response = await request(app)
            .post("/auth/refresh");

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Refresh Token ausente");
    });

    test("POST /auth/logout - Deve limpar o cookie de refreshToken", async () => {
        const response = await request(app)
            .post("/auth/logout");

        expect(response.status).toBe(204);

        const setCookieHeader = response.headers["set-cookie"] as string[] | string | undefined;
        expect(setCookieHeader).toBeDefined();

        const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader!];
        const refreshCookie = cookies.find((c) => c.startsWith("refreshToken="));
        expect(refreshCookie).toMatch(/expires=Thu, 01 Jan 1970/i);
    });

    test("POST /auth/logout - Deve revogar o refreshToken no servidor", async () => {
        const email = "logout-revoga@teste.com";
        const repo = appDataSource.getRepository(Usuario);
        const senhaHash = await bcrypt.hash("senha123", 10);

        await repo.save({
            nome: "Usuario Logout",
            email,
            matricula: "AUTH-RT-004",
            senha_hash: senhaHash,
            perfil: Perfil.SOLICITANTE,
            setor: "TI",
            ativo: true,
        });

        const loginResponse = await request(app)
            .post("/auth/login")
            .send({ email, senha: "senha123" });

        const setCookieHeader = loginResponse.headers["set-cookie"] as string[] | string;
        const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

        await request(app)
            .post("/auth/logout")
            .set("Cookie", cookies)
            .expect(204);

        const refreshResponse = await request(app)
            .post("/auth/refresh")
            .set("Cookie", cookies);

        expect(refreshResponse.status).toBe(400);
        expect(refreshResponse.body.message).toBe("Refresh Token inválido ou expirado");
    });
});
