import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.js";

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

  return res.status(500).json({
    message: error.message ?? "Erro interno do servidor",
  });
}