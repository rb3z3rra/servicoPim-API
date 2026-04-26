import { jest } from '@jest/globals';
import { AuthService } from "../../src/services/AuthService.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";
import { Perfil } from "../../src/types/usr_perfil.js";

let authService: AuthService;
let mockDataSource: any;
let userRepo: any;
let refreshTokenRepo: any;

beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    userRepo = {
        findOne: jest.fn(),
    };
    refreshTokenRepo = {
        findOne: jest.fn(),
        create: jest.fn((data: unknown) => data),
        save: jest.fn(),
    };
    mockDataSource = {
        getRepository: jest.fn((entity: { name?: string }) =>
            entity?.name === "RefreshToken" ? refreshTokenRepo : userRepo
        )
    };
    authService = new AuthService(mockDataSource);
});

beforeEach(() => {
    jest.restoreAllMocks();
    userRepo.findOne.mockReset();
    refreshTokenRepo.findOne.mockReset();
    refreshTokenRepo.create.mockClear();
    refreshTokenRepo.save.mockReset();
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
        userRepo.findOne.mockResolvedValue(mockUserData);
        
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
        userRepo.findOne.mockResolvedValue(null);

        await expect(authService.login({ email: "invalido@teste.com", senha: "123" }))
            .rejects.toThrow("Email ou senha inválidos");
    });

    test("Deve bloquear usuário inativo no login", async () => {
        userRepo.findOne.mockResolvedValue({
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
        userRepo.findOne.mockResolvedValue({
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
        const token = "refresh_token_valido";
        const tokenHash = createHash("sha256").update(token).digest("hex");

        refreshTokenRepo.findOne.mockResolvedValue({
            jti: "jti-123",
            tokenHash,
            expiresAt: new Date(Date.now() + 60_000),
            revokedAt: null,
            usuario: { id: "user-123" },
        });
        userRepo.findOne.mockResolvedValue({
            id: "user-123",
            nome: "Usuario Teste",
            email: "teste@teste.com",
            perfil: Perfil.SUPERVISOR,
            setor: "TI",
            ativo: true
        });

        jest.spyOn(jwt, "verify").mockReturnValue({ sub: "user-123", jti: "jti-123" } as never);
        jest.spyOn(jwt, "sign")
            .mockReturnValueOnce("new_access_token" as never)
            .mockReturnValueOnce("new_refresh_token" as never);

        const result = await authService.refresh(token);

        expect(result).toEqual(expect.objectContaining({
            accessToken: "new_access_token",
            refreshToken: "new_refresh_token"
        }));
        expect(result.usuario.email).toBe("teste@teste.com");
        expect(refreshTokenRepo.save).toHaveBeenCalledTimes(2);
    });

    test("Deve falhar no refresh com token inválido", async () => {
        jest.spyOn(jwt, "verify").mockImplementation(() => {
            throw new Error("invalid token");
        });

        await expect(authService.refresh("token_invalido"))
            .rejects.toThrow("Refresh Token inválido ou expirado");
    });

    test("Deve falhar no refresh com usuário inexistente ou inativo", async () => {
        const token = "refresh_token_valido";
        const tokenHash = createHash("sha256").update(token).digest("hex");

        jest.spyOn(jwt, "verify").mockReturnValue({ sub: "user-123", jti: "jti-123" } as never);
        refreshTokenRepo.findOne.mockResolvedValue({
            jti: "jti-123",
            tokenHash,
            expiresAt: new Date(Date.now() + 60_000),
            revokedAt: null,
            usuario: { id: "user-123" },
        });
        userRepo.findOne.mockResolvedValue(null);

        await expect(authService.refresh(token))
            .rejects.toThrow("Usuário inválido ou inativo");
    });
});
