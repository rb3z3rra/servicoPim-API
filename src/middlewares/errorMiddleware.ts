import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import { z } from "zod";

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response {
  // Se for um erro customizado mapeado (regra de negócios, autenticação, etc)
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: "error",
      message: error.message,
      details: error.details,
    }) as unknown as Response;
  }

  // Se for um erro do Zod (validação de dados na rota)
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      status: "validation_error",
      message: "Erro na validação de inputs inseridos",
      details: error.flatten().fieldErrors,
    }) as unknown as Response;
  }

  // Se for qualquer outro erro bizarro ou não tratado (Ex: Banco de dados offline)
  console.error("🔥 ERRO INTERNO DO SERVIDOR: ", error);

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  }) as unknown as Response;
}