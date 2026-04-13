import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import type { Perfil } from "../types/usr_perfil.js";


export const ensureRole = (...perfisPermitido: Perfil[]): RequestHandler => {
    return (req, res, next) => {

        if (!req.auth) {
            return next(new AppError('Autenticação requerida', 401));
        }

        if (!perfisPermitido.includes(req.auth.perfil)) {
            return next(new AppError("Acesso negado", 403));
        }

        return next();
    }
}
