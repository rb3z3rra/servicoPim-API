import { AppError } from '../errors/AppError.js';
import type { Request, Response } from "express";
import { OrdemServicoService } from "../services/OrdemServicoService.js";
import { appDataSource } from "../database/appDataSource.js";

const ordemServicoService = new OrdemServicoService(appDataSource);

export class OrdemServicoController {
  async create(req: Request, res: Response): Promise<Response> {
    const data = req.body;
    const ordemServico = await ordemServicoService.createOrdemServico(data);
    return res.status(201).json(ordemServico);
  }

  async getAll(req: Request, res: Response): Promise<Response> {
    const ordensServico = await ordemServicoService.getAll();
    return res.status(200).json(ordensServico);
  }

  async getById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const ordemServico = await ordemServicoService.getById(id as string);
    return res.status(200).json(ordemServico);
  }

  async atribuirTecnico(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError("Usuário não autenticado");
  }

    const usuarioId = req.user.id;

    const ordemServico = await ordemServicoService.atribuirTecnico(
      id as string,
      req.body,
      usuarioId
  );

    return res.status(200).json(ordemServico);
}

  async atualizarStatus(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError("Usuário não autenticado");
    }
    const usuarioId = req.user.id;

    const ordemServico = await ordemServicoService.atualizarStatus(
      id as string,
      req.body,
      usuarioId
    );

    return res.status(200).json(ordemServico);
  }

  async concluir(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!req.user) {
       throw new AppError("Usuário não autenticado");
  }
    const usuarioId = req.user.id;

    const ordemServico = await ordemServicoService.concluirOrdemServico(
      id as string,
      req.body,
      usuarioId
    );

    return res.status(200).json(ordemServico);
  }
}