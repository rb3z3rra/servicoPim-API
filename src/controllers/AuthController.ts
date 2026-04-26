import type { Request, Response } from "express";
import { AuthService } from "../services/AuthService.js";
import { appDataSource } from "../database/appDataSource.js";
import { AppError } from "../errors/AppError.js";

const authService = new AuthService(appDataSource);

const COOKIE_NAME = "refreshToken";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export class AuthController {
  async login(req: Request, res: Response): Promise<Response> {
    const result = await authService.login(req.body);

    res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

    return res.status(200).json({
      usuario: result.usuario,
      accessToken: result.accessToken,
    });
  }

  async refresh(req: Request, res: Response): Promise<Response> {
    const token = req.cookies?.[COOKIE_NAME] as string | undefined;

    if (!token) {
      throw new AppError("Refresh Token ausente", 401);
    }

    const result = await authService.refresh(token);

    res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);

    return res.status(200).json({
    usuario: result.usuario,
    accessToken: result.accessToken,
  });

  }

  async logout(_req: Request, res: Response): Promise<Response> {
    const token = _req.cookies?.[COOKIE_NAME] as string | undefined;
    await authService.revokeRefreshToken(token);

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    });
    return res.status(204).send();
  }
}
