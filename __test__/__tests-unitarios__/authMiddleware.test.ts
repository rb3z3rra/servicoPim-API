import { jest } from '@jest/globals';
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../../src/middleware/authMiddleware.js";

// Guardar o JWT_SECRET original e definir um para os testes
const ORIGINAL_ENV = process.env;

beforeAll(() => {
    process.env = { ...ORIGINAL_ENV, JWT_SECRET: "test-secret" };
});

afterAll(() => {
    process.env = ORIGINAL_ENV;
});

function mockReqResNext() {
    const req = {
        headers: {},
    } as unknown as Request;

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const next = jest.fn() as unknown as NextFunction;

    return { req, res, next };
}

describe("Testes Unitários - authMiddleware (bloqueio sem Token)", () => {

    test("Deve retornar 401 quando o header Authorization não está presente", () => {
        const { req, res, next } = mockReqResNext();

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Token não informado" });
        expect(next).not.toHaveBeenCalled();
    });

    test("Deve retornar 401 quando o header Authorization está vazio", () => {
        const { req, res, next } = mockReqResNext();
        req.headers.authorization = "";

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test("Deve retornar 401 quando o token está ausente após 'Bearer '", () => {
        const { req, res, next } = mockReqResNext();
        req.headers.authorization = "Bearer ";

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Token inválido" });
        expect(next).not.toHaveBeenCalled();
    });

    test("Deve retornar 401 quando o token é inválido", () => {
        const { req, res, next } = mockReqResNext();
        req.headers.authorization = "Bearer token_invalido_qualquer";

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Token inválido ou expirado" });
        expect(next).not.toHaveBeenCalled();
    });

    test("Deve retornar 401 quando o token está expirado", () => {
        const { req, res, next } = mockReqResNext();

        const tokenExpirado = jwt.sign(
            { sub: "user-123", email: "teste@teste.com", perfil: "SOLICITANTE" },
            "test-secret",
            { expiresIn: "0s" }
        );
        req.headers.authorization = `Bearer ${tokenExpirado}`;

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Token inválido ou expirado" });
        expect(next).not.toHaveBeenCalled();
    });

    test("Deve chamar next() e popular req.user quando o token é válido", () => {
        const { req, res, next } = mockReqResNext();

        const tokenValido = jwt.sign(
            { sub: "user-123", email: "teste@teste.com", perfil: "TECNICO" },
            "test-secret",
            { expiresIn: "1h" }
        );
        req.headers.authorization = `Bearer ${tokenValido}`;

        authMiddleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect((req as any).user).toEqual({
            id: "user-123",
            email: "teste@teste.com",
            perfil: "TECNICO",
        });
    });

    test("Deve retornar 401 quando o token foi assinado com secret diferente", () => {
        const { req, res, next } = mockReqResNext();

        const tokenOutroSecret = jwt.sign(
            { sub: "user-123", email: "teste@teste.com", perfil: "SOLICITANTE" },
            "outro-secret-diferente",
            { expiresIn: "1h" }
        );
        req.headers.authorization = `Bearer ${tokenOutroSecret}`;

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Token inválido ou expirado" });
        expect(next).not.toHaveBeenCalled();
    });
});
