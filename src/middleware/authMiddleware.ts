import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { AppError } from "../errors/AppError.js";
import { Perfil } from "../types/usr_perfil.js";
import { env } from "../config/env.js";

export interface AuthPayload extends JwtPayload {
  sub: string;
  email: string;
  perfil: Perfil;
}

// ─── Extensão global do Express.Request ─────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

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
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
    req.auth = payload;
    return next();
  } catch {
    return next(new AppError("Token invalido ou expirado", 401));
  }
};
