import { jest } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ensureAuth } from "../../src/middleware/authMiddleware.js";
import { AppError } from "../../src/errors/AppError.js";

const ORIGINAL_ENV = process.env;

beforeAll(() => {
  process.env = { ...ORIGINAL_ENV, JWT_ACCESS_SECRET: "test-access-secret" };
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

describe("Testes Unitários - ensureAuth", () => {
  test("Deve chamar next(AppError 401) quando Authorization não está presente", () => {
    const { req, res, next } = mockReqResNext();

    ensureAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const erro = (next as jest.Mock).mock.calls[0]![0] as AppError;
    expect(erro.statusCode).toBe(401);
    expect(erro.message).toBe("Token ausente");
  });

  test("Deve chamar next(AppError 401) quando Authorization não começa com Bearer", () => {
    const { req, res, next } = mockReqResNext();
    req.headers.authorization = "Basic abc123";

    ensureAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const erro = (next as jest.Mock).mock.calls[0]![0] as AppError;
    expect(erro.statusCode).toBe(401);
    expect(erro.message).toBe("Token ausente");
  });

  test("Deve chamar next(AppError 401) quando o token está vazio após Bearer", () => {
    const { req, res, next } = mockReqResNext();
    req.headers.authorization = "Bearer ";

    ensureAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const erro = (next as jest.Mock).mock.calls[0]![0] as AppError;
    expect(erro.statusCode).toBe(401);
    expect(erro.message).toBe("Token ausente");
  });

  test("Deve chamar next(AppError 401) quando o token é inválido", () => {
    const { req, res, next } = mockReqResNext();
    req.headers.authorization = "Bearer token_invalido";

    ensureAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const erro = (next as jest.Mock).mock.calls[0]![0] as AppError;
    expect(erro.statusCode).toBe(401);
    expect(erro.message).toBe("Token invalido");
  });

  test("Deve chamar next(AppError 401) quando o token está expirado", () => {
    const { req, res, next } = mockReqResNext();
    const tokenExpirado = jwt.sign(
      { sub: "user-123", email: "teste@teste.com", perfil: "SOLICITANTE" },
      "test-access-secret",
      { expiresIn: "0s" }
    );
    req.headers.authorization = `Bearer ${tokenExpirado}`;

    ensureAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const erro = (next as jest.Mock).mock.calls[0]![0] as AppError;
    expect(erro.statusCode).toBe(401);
    expect(erro.message).toBe("Token invalido");
  });

  test("Deve chamar next(AppError 401) quando o token foi assinado com secret diferente", () => {
    const { req, res, next } = mockReqResNext();
    const tokenOutroSecret = jwt.sign(
      { sub: "user-123", email: "teste@teste.com", perfil: "TECNICO" },
      "outro-secret",
      { expiresIn: "1h" }
    );
    req.headers.authorization = `Bearer ${tokenOutroSecret}`;

    ensureAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const erro = (next as jest.Mock).mock.calls[0]![0] as AppError;
    expect(erro.statusCode).toBe(401);
    expect(erro.message).toBe("Token invalido");
  });

  test("Deve popular req.auth e chamar next() quando o token é válido", () => {
    const { req, res, next } = mockReqResNext();
    const payload = { sub: "user-123", email: "teste@teste.com", perfil: "SUPERVISOR" };
    const tokenValido = jwt.sign(payload, "test-access-secret", { expiresIn: "1h" });
    req.headers.authorization = `Bearer ${tokenValido}`;

    ensureAuth(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
    expect((req as any).auth).toMatchObject({
      sub: "user-123",
      email: "teste@teste.com",
      perfil: "SUPERVISOR",
    });
  });
});
