import { jest } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";
import { ensureRole } from "../../src/middleware/ensureRole.js";
import { AppError } from "../../src/errors/AppError.js";
import { Perfil } from "../../src/types/usr_perfil.js";

function mockReqResNext(auth?: { sub: string; perfil: Perfil }) {
  const req = {
    headers: {},
    auth: auth ?? undefined,
  } as unknown as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const next = jest.fn() as unknown as NextFunction;

  return { req, res, next };
}

describe("Testes Unitários - ensureRole", () => {
  test("Deve retornar 401 quando req.auth não está definido", () => {
    const { req, res, next } = mockReqResNext();
    const middleware = ensureRole(Perfil.SUPERVISOR);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const erro = (next as jest.Mock).mock.calls[0]![0] as AppError;
    expect(erro.statusCode).toBe(401);
    expect(erro.message).toBe("Autenticação requerida");
  });

  test("Deve retornar 403 quando o perfil não está na lista permitida", () => {
    const { req, res, next } = mockReqResNext({
      sub: "user-1",
      perfil: Perfil.SOLICITANTE,
    });
    const middleware = ensureRole(Perfil.SUPERVISOR);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const erro = (next as jest.Mock).mock.calls[0]![0] as AppError;
    expect(erro.statusCode).toBe(403);
    expect(erro.message).toBe("Acesso negado");
  });

  test("Deve retornar 403 quando TECNICO tenta acessar rota de SUPERVISOR", () => {
    const { req, res, next } = mockReqResNext({
      sub: "user-2",
      perfil: Perfil.TECNICO,
    });
    const middleware = ensureRole(Perfil.SUPERVISOR);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const erro = (next as jest.Mock).mock.calls[0]![0] as AppError;
    expect(erro.statusCode).toBe(403);
    expect(erro.message).toBe("Acesso negado");
  });

  test("Deve chamar next() quando o perfil é permitido (único perfil)", () => {
    const { req, res, next } = mockReqResNext({
      sub: "user-3",
      perfil: Perfil.SUPERVISOR,
    });
    const middleware = ensureRole(Perfil.SUPERVISOR);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("Deve chamar next() quando o perfil está entre os múltiplos permitidos", () => {
    const { req, res, next } = mockReqResNext({
      sub: "user-4",
      perfil: Perfil.TECNICO,
    });
    const middleware = ensureRole(Perfil.SUPERVISOR, Perfil.TECNICO);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  test("Deve retornar 403 quando perfil não está entre os múltiplos permitidos", () => {
    const { req, res, next } = mockReqResNext({
      sub: "user-5",
      perfil: Perfil.SOLICITANTE,
    });
    const middleware = ensureRole(Perfil.SUPERVISOR, Perfil.TECNICO);

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const erro = (next as jest.Mock).mock.calls[0]![0] as AppError;
    expect(erro.statusCode).toBe(403);
    expect(erro.message).toBe("Acesso negado");
  });
});
