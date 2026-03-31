import type { Request, Response } from "express";
import { AuthService } from "../services/AuthService.js";
import { appDataSource } from "../database/appDataSource.js";

const authService = new AuthService(appDataSource);

export class AuthController {
  async login(req: Request, res: Response): Promise<Response> {
    const result = await authService.login(req.body);
    return res.status(200).json(result);
  }

  async refreshToken(req: Request, res: Response): Promise<Response> {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token não fornecido" });
    }

    const result = await authService.refreshToken(refreshToken);
    return res.status(200).json(result);
  }
}