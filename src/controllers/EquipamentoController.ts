import type { Request, Response } from "express";
import { EquipamentoService } from "../services/EquipamentoService.js";
import { appDataSource } from "../database/appDataSource.js";
import { listarEquipamentosQuerySchemaDTO } from "../dtos/EquipamentoSchemaDTO.js";

const equipamentoService = new EquipamentoService(appDataSource);

export class EquipamentoController {
  async create(req: Request, res: Response): Promise<Response> {
    const data = req.body;

    const equipamento = await equipamentoService.createEquipamento(data);

    return res.status(201).json(equipamento);
  }

  async getAll(req: Request, res: Response): Promise<Response> {
    const filtros = listarEquipamentosQuerySchemaDTO.parse(req.query);
    const equipamentos = await equipamentoService.getAll({
      ...(filtros.busca ? { busca: filtros.busca } : {}),
      ...(filtros.setor ? { setor: filtros.setor } : {}),
      ...(typeof filtros.ativo === "boolean" ? { ativo: filtros.ativo } : {}),
      ...(typeof filtros.comOsAbertas === "boolean"
        ? { comOsAbertas: filtros.comOsAbertas }
        : {}),
    });

    return res.status(200).json(equipamentos);
  }

  async getById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    const equipamento = await equipamentoService.getById(Number(id));

    return res.status(200).json(equipamento);
  }

  async getDetails(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    const equipamento = await equipamentoService.getDetailsById(Number(id));

    return res.status(200).json(equipamento);
  }

  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const data = req.body;

    const equipamento = await equipamentoService.updateEquipamento(
      Number(id),
      data
    );

    return res.status(200).json(equipamento);
  }

  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    await equipamentoService.deleteEquipamento(Number(id));

    return res.status(204).send();
  }
}
