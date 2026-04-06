import type { Request, Response } from "express";
import { HistoricoOSService } from "../services/HistoricoOSService.js";


export class HistoricoOSController {
  private historicoService = new HistoricoOSService();

  async getAll(req: Request, res: Response) {
    const historicos = await this.historicoService.getAll();
    return res.status(200).json(historicos);
  }

  async getById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const historico = await this.historicoService.getById(id as string);
    return res.status(200).json(historico);
  }

  async getByOsId(req: Request, res: Response): Promise<Response> {
    const { osId } = req.params;
    const historicos = await this.historicoService.getByOsId(osId as string);
    return res.status(200).json(historicos);
  }

  async getByUsuario(req: Request, res: Response): Promise<Response> {
    const { usuarioId } = req.params;
    const historicos = await this.historicoService.getByUsuario(usuarioId as string);
    return res.status(200).json(historicos);
  }
}