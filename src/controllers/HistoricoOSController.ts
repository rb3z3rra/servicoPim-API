import type { Request, Response } from "express";
import { HistoricoOSService } from "../services/HistoricoOSService.js";
import { listarHistoricoQuerySchemaDTO } from "../dtos/HistoricoOSSchemaDTO.js";


export class HistoricoOSController {
  private historicoService = new HistoricoOSService();

  private buildAccess(req: Request) {
    return {
      ...(req.auth?.sub ? { usuarioId: req.auth.sub } : {}),
      ...(req.auth?.perfil ? { usuarioPerfil: req.auth.perfil } : {}),
    };
  }

  async getAll(req: Request, res: Response) {
    const filtros = listarHistoricoQuerySchemaDTO.parse(req.query);
    const historicos = await this.historicoService.getAllScoped(
      {
        ...(filtros.busca ? { busca: filtros.busca } : {}),
        ...(filtros.statusNovo ? { statusNovo: filtros.statusNovo } : {}),
        ...(filtros.prioridade ? { prioridade: filtros.prioridade } : {}),
        ...(filtros.usuarioId ? { usuarioId: filtros.usuarioId } : {}),
        ...(filtros.osId ? { osId: filtros.osId } : {}),
        ...(filtros.dataInicio ? { dataInicio: filtros.dataInicio } : {}),
        ...(filtros.dataFim ? { dataFim: filtros.dataFim } : {}),
      },
      {
        ...this.buildAccess(req),
      }
    );
    return res.status(200).json(historicos);
  }

  async getById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const historico = await this.historicoService.getById(id as string, this.buildAccess(req));
    return res.status(200).json(historico);
  }

  async getByOsId(req: Request, res: Response): Promise<Response> {
    const { osId } = req.params;
    const historicos = await this.historicoService.getByOsId(osId as string, this.buildAccess(req));
    return res.status(200).json(historicos);
  }

  async getByUsuario(req: Request, res: Response): Promise<Response> {
    const { usuarioId } = req.params;
    const historicos = await this.historicoService.getByUsuario(usuarioId as string, this.buildAccess(req));
    return res.status(200).json(historicos);
  }
}
