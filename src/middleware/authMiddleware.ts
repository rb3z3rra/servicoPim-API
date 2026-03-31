import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type TokenPayload = {
  sub: string;
  email: string;
  perfil: string;
};

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token não informado" });
  }

  const [, token] = authHeader.split(" ");

  if (!token) {
    return res.status(401).json({ message: "Token inválido" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenPayload;

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      perfil: decoded.perfil,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Token inválido ou expirado" });
  }
}