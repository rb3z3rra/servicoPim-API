import { jest } from '@jest/globals';
import { AuthService } from "../../src/services/AuthService.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Perfil } from "../../src/types/usr_perfil.js";

let authService: AuthService;
let mockDataSource: any;

beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    mockDataSource = {
        getRepository: jest.fn().mockReturnValue({
            findOne: jest.fn(),
        })
    };
    authService = new AuthService(mockDataSource);
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe("Testes de Autenticação Unitários", () => {
    test("Deve retornar accessToken e refreshToken ao logar com sucesso", async () => {
        const mockUserData = {
            id: "user-123",
            nome: "Usuario Teste",
            email: "teste@teste.com",
            senha_hash: "$2a$10$hashed_senha",
            perfil: Perfil.SOLICITANTE,
            setor: "TI",
            ativo: true
        };

        // 1. Mentimos pro código dizendo que o Banco achou o usuário
        mockDataSource.getRepository().findOne.mockResolvedValue(mockUserData);
        
        // 2. Mentimos pro bcrypt dizendo que a senha descriptografada casou
        jest.spyOn(bcrypt, "compare").mockImplementation(() => Promise.resolve(true));
        
        // 3. Mentimos pro JWT para sabermos exatamente o que ele vai "gerar"
        jest.spyOn(jwt, "sign")
            .mockReturnValueOnce("fake_access_token" as never)
            .mockReturnValueOnce("fake_refresh_token" as never);

        // Act - executamos a função do seu service
        const resultado = await authService.login({ email: "teste@teste.com", senha: "senha_correta" });

        // Assert - verificamos se nossa task deu certo
        expect(resultado).toHaveProperty("accessToken", "fake_access_token");
        expect(resultado).toHaveProperty("refreshToken", "fake_refresh_token");
        expect(resultado.usuario.id).toBe("user-123");
        expect(resultado.usuario.email).toBe("teste@teste.com");
    });

    test("Deve lançar erro ao passar email inválido", async () => {
        mockDataSource.getRepository().findOne.mockResolvedValue(null);

        await expect(authService.login({ email: "invalido@teste.com", senha: "123" }))
            .rejects.toThrow("Email ou senha inválidos");
    });

    test("Deve bloquear usuário inativo no login", async () => {
        mockDataSource.getRepository().findOne.mockResolvedValue({
            id: "user-123",
            nome: "Usuario Inativo",
            email: "inativo@teste.com",
            senha_hash: "$2a$10$hashed_senha",
            perfil: Perfil.SOLICITANTE,
            setor: "TI",
            ativo: false
        });

        await expect(authService.login({ email: "inativo@teste.com", senha: "senha123" }))
            .rejects.toThrow("Usuário inativo");
    });

    test("Deve rejeitar senha incorreta no login", async () => {
        mockDataSource.getRepository().findOne.mockResolvedValue({
            id: "user-123",
            nome: "Usuario Teste",
            email: "teste@teste.com",
            senha_hash: "$2a$10$hashed_senha",
            perfil: Perfil.SOLICITANTE,
            setor: "TI",
            ativo: true
        });

        jest.spyOn(bcrypt, "compare").mockImplementation(() => Promise.resolve(false));

        await expect(authService.login({ email: "teste@teste.com", senha: "senha_errada" }))
            .rejects.toThrow("Email ou senha inválidos");
    });

    test("Deve gerar novos tokens no refresh com sucesso", async () => {
        mockDataSource.getRepository().findOne.mockResolvedValue({
            id: "user-123",
            nome: "Usuario Teste",
            email: "teste@teste.com",
            perfil: Perfil.SUPERVISOR,
            setor: "TI",
            ativo: true
        });

        jest.spyOn(jwt, "verify").mockReturnValue({ sub: "user-123" } as never);
        jest.spyOn(jwt, "sign")
            .mockReturnValueOnce("new_access_token" as never)
            .mockReturnValueOnce("new_refresh_token" as never);

        const result = await authService.refresh("refresh_token_valido");

        expect(result).toEqual({
            accessToken: "new_access_token",
            refreshToken: "new_refresh_token"
        });
    });

    test("Deve falhar no refresh com token inválido", async () => {
        jest.spyOn(jwt, "verify").mockImplementation(() => {
            throw new Error("invalid token");
        });

        await expect(authService.refresh("token_invalido"))
            .rejects.toThrow("Refresh Token inválido ou expirado");
    });

    test("Deve falhar no refresh com usuário inexistente ou inativo", async () => {
        jest.spyOn(jwt, "verify").mockReturnValue({ sub: "user-123" } as never);
        mockDataSource.getRepository().findOne.mockResolvedValue(null);

        await expect(authService.refresh("refresh_token_valido"))
            .rejects.toThrow("Usuário inválido ou inativo");
    });
});
