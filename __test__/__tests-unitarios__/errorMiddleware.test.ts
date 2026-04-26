import { jest } from "@jest/globals";
import { ZodError } from "zod";
import { AppError } from "../../src/errors/AppError.js";
import { errorMiddleware } from "../../src/middleware/errorMiddleware.js";

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

function createQueryFailedError(code: string) {
  const error = new Error("query failed") as Error & {
    name: string;
    driverError: { code: string };
  };

  error.name = "QueryFailedError";
  error.driverError = { code };

  return error;
}

describe("errorMiddleware", () => {
  const req = {} as any;
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("retorna status e mensagem de AppError", () => {
    const res = createResponse();

    errorMiddleware(new AppError("Falha de negócio", 422), req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ message: "Falha de negócio" });
  });

  test("retorna 400 para ZodError", () => {
    const res = createResponse();
    const error = new ZodError([
      {
        code: "custom",
        path: ["campo"],
        message: "inválido",
      },
    ]);

    errorMiddleware(error, req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Dados inválidos" })
    );
  });

  test("retorna 409 para conflito de unicidade no banco", () => {
    const res = createResponse();
    const error = createQueryFailedError("23505");

    errorMiddleware(error, req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: "Não foi possível concluir a operação por conflito de dados.",
    });
  });

  test("retorna 500 padronizado para erro genérico de banco", () => {
    const res = createResponse();
    const error = createQueryFailedError("99999");

    errorMiddleware(error, req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Não foi possível concluir a operação no momento.",
    });
  });

  test("retorna 500 padronizado para erro inesperado", () => {
    const res = createResponse();

    errorMiddleware(new Error("mensagem interna"), req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Erro interno do servidor",
    });
  });
});
