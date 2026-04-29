import { AppError } from '../errors/AppError.js';
import type { Request, Response } from "express";
import { OrdemServicoService } from "../services/OrdemServicoService.js";
import { appDataSource } from "../database/appDataSource.js";
import { listarOrdensServicoQuerySchemaDTO } from "../dtos/OrdemServicoSchemaDTO.js";

const ordemServicoService = new OrdemServicoService(appDataSource);

export class OrdemServicoController {
  async create(req: Request, res: Response): Promise<Response> {
    if (!req.auth) {
      throw new AppError("Usuário não autenticado", 401);
    }

    const data = {
      ...req.body,
      solicitanteId: req.auth.sub,
    };
    const ordemServico = await ordemServicoService.createOrdemServico(data);
    return res.status(201).json(ordemServico);
  }

  async getAll(req: Request, res: Response): Promise<Response> {
    if (!req.auth) {
      throw new AppError("Usuário não autenticado", 401);
    }

    const filtros = listarOrdensServicoQuerySchemaDTO.parse(req.query);
    const ordensServico = await ordemServicoService.getAll({
      status: filtros.status,
      prioridade: filtros.prioridade,
      tecnicoId: filtros.tecnicoId,
      setor: filtros.setor,
      busca: filtros.busca,
      dataInicio: filtros.dataInicio,
      dataFim: filtros.dataFim,
    }, req.auth.sub, req.auth.perfil);
    return res.status(200).json(ordensServico);
  }

  async getById(req: Request, res: Response): Promise<Response> {
    if (!req.auth) {
      throw new AppError("Usuário não autenticado", 401);
    }

    const { id } = req.params;
    const ordemServico = await ordemServicoService.getById(
      id as string,
      req.auth.sub,
      req.auth.perfil
    );
    return res.status(200).json(ordemServico);
  }

  async atribuirTecnico(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!req.auth) {
      throw new AppError("Usuário não autenticado");
    }

    const usuarioId = req.auth.sub;

    const ordemServico = await ordemServicoService.atribuirTecnico(
      id as string,
      req.body,
      usuarioId
  );

    return res.status(200).json(ordemServico);
}

  async autoAtribuir(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!req.auth) {
      throw new AppError("Usuário não autenticado");
    }

    const ordemServico = await ordemServicoService.autoAtribuir(
      id as string,
      req.auth.sub
    );

    return res.status(200).json(ordemServico);
  }

  async iniciar(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!req.auth) {
      throw new AppError("Usuário não autenticado");
    }

    const ordemServico = await ordemServicoService.iniciarOrdemServico(
      id as string,
      req.auth.sub,
      req.auth.perfil
    );

    return res.status(200).json(ordemServico);
  }

  async atualizarStatus(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!req.auth) {
      throw new AppError("Usuário não autenticado");
    }
    const usuarioId = req.auth.sub;

    const ordemServico = await ordemServicoService.atualizarStatus(
      id as string,
      req.body,
      usuarioId,
      req.auth.perfil
    );

    return res.status(200).json(ordemServico);
  }

  async concluir(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    if (!req.auth) {
       throw new AppError("Usuário não autenticado");
    }
    const usuarioId = req.auth.sub;

    const ordemServico = await ordemServicoService.concluirOrdemServico(
      id as string,
      req.body,
      usuarioId,
      req.auth.perfil
    );

    return res.status(200).json(ordemServico);
  }
}
