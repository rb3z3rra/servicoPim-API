import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";

type QueryLikeError = Error & {
  name?: string;
  driverError?: {
    code?: string;
  };
};

function isQueryFailedError(error: Error): error is QueryLikeError {
  return error.name === "QueryFailedError";
}

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response {
  console.error(error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({ message: "Dados inválidos", issues: error.issues });
  }

  if (isQueryFailedError(error)) {
    const driverError = error.driverError;

    if (driverError?.code === "23505") {
      return res.status(409).json({
        message: "Não foi possível concluir a operação por conflito de dados.",
      });
    }

    return res.status(500).json({
      message: "Não foi possível concluir a operação no momento.",
    });
  }

  return res.status(500).json({
    message: "Erro interno do servidor",
  });
}
