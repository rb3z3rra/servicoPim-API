import type { NextFunction, Request, Response } from "express";

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response {
  console.error(error);

  return res.status(400).json({
    message: error.message,
  });
}