import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { AppError } from "../errors/AppError.js";
import { Perfil } from "../types/usr_perfil.js";

// ─── Tipos compartilhados ────────────────────────────────────────────────────

type TokenPayload = {
  sub: string;
  email: string;
  perfil: Perfil;
};

export interface AuthPayload extends JwtPayload {
  sub: string;
  perfil: Perfil;
}

// ─── Extensão global do Express.Request ─────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        perfil: Perfil;
      };
      auth?: AuthPayload;
    }
  }
}

// ─── authMiddleware (padrão legado: req.user + JWT_SECRET) ───────────────────

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

// ─── ensureAuth (padrão novo: req.auth + JWT_ACCESS_SECRET + AppError) ───────

const getAccessSecret = (): string => {
  const value = process.env.JWT_ACCESS_SECRET;
  if (!value) throw new AppError("JWT_ACCESS_SECRET nao definido", 500);
  return value;
};

export const ensureAuth: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Token ausente", 401));
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return next(new AppError("Token ausente", 401));
  }

  try {
    const payload = jwt.verify(token, getAccessSecret()) as AuthPayload;
    req.auth = payload;
    return next();
  } catch {
    return next(new AppError("Token invalido", 401));
  }
};