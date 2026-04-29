import type { Request, Response } from "express";
import { appDataSource } from "../database/appDataSource.js";
import { ConfiguracaoPrazoAtendimentoService } from "../services/ConfiguracaoPrazoAtendimentoService.js";
import { Prioridade } from "../types/os_prioridade.js";
import { AppError } from "../errors/AppError.js";

const configuracaoPrazoAtendimentoService = new ConfiguracaoPrazoAtendimentoService(appDataSource);

export class ConfiguracaoPrazoAtendimentoController {
  async getAll(_req: Request, res: Response): Promise<Response> {
    const configuracoes = await configuracaoPrazoAtendimentoService.getAll();
    return res.status(200).json(configuracoes);
  }

  async update(req: Request, res: Response): Promise<Response> {
    if (!req.auth) {
      throw new AppError("Usuário não autenticado", 401);
    }

    const prioridade = req.params.prioridade as Prioridade;

    if (!Object.values(Prioridade).includes(prioridade)) {
      throw new AppError("Prioridade inválida", 400);
    }

    const configuracao = await configuracaoPrazoAtendimentoService.update(
      prioridade,
      req.body,
      req.auth.sub
    );

    return res.status(200).json(configuracao);
  }
}
