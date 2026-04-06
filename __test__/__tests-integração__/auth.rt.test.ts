import request from "supertest";
import { app } from "../../server.js";
import { appDataSource } from "../../src/database/appDataSource.js";
import { Usuario } from "../../src/entities/Usuario.js";
import { Perfil } from "../../src/types/usr_perfil.js";
import bcrypt from "bcryptjs";

describe("Testes de Integração - Rotas de Autenticação (Banco Real)", () => {
    
    // Antes de todos os testes, conectamos no banco real do Docker
    beforeAll(async () => {
        if (!appDataSource.isInitialized) {
            await appDataSource.initialize();
        }
    });

    // Depois de todos os testes, limpamos os dados de teste e fechamos a conexão
    afterAll(async () => {
        if (appDataSource.isInitialized) {
            const repo = appDataSource.getRepository(Usuario);
            await repo.delete({ email: "integracao@teste.com" });
            await appDataSource.destroy();
        }
    });

    test("POST /auth/login - Deve retornar accessToken e refreshToken REAIS do banco", async () => {
        const repo = appDataSource.getRepository(Usuario);
        
        // Garantimos que o usuário existe no banco real
        await repo.delete({ email: "integracao@teste.com" });
        
        const senhaHash = await bcrypt.hash("senha123", 10);
        await repo.save({
            nome: "Usuario Integracao",
            email: "integracao@teste.com",
            senha_hash: senhaHash,
            perfil: Perfil.SOLICITANTE,
            setor: "TI",
            ativo: true
        });

        // Agora sim: Chamada real para a API
        const response = await request(app)
            .post("/auth/login")
            .send({
                email: "integracao@teste.com",
                senha: "senha123"
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("accessToken");
        expect(response.body).toHaveProperty("refreshToken");
        expect(response.body.usuario.email).toBe("integracao@teste.com");
    });

    test("POST /auth/login - Deve falhar com senha errada batendo no banco real", async () => {
        const response = await request(app)
            .post("/auth/login")
            .send({
                email: "integracao@teste.com",
                senha: "senha_totalmente_errada"
            });

        expect(response.status).toBe(400); 
        expect(response.body.message).toBe("Email ou senha inválidos");
    });
});
