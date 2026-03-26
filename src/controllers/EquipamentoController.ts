import type { Request, Response } from "express";
import type { EquipamentoService } from "../services/EquipamentoService.js";
import { number } from "zod";

export class EquipamentoController {
    private equipamentoService: EquipamentoService;

    constructor(equipamentoService: EquipamentoService) {
        this.equipamentoService = equipamentoService
    }

    public async findAll(req: Request, res: Response) {
        const equipamentos = await this.equipamentoService.findAll();
        res.status(200).json(equipamentos);
    }

    public async findById(req: Request, res: Response) {
        const { id } = req.params;
        const equipamento = await this.equipamentoService.findById(Number(id))
        res.status(200).json(equipamento);
    }

    public async create(req: Request, res: Response) {
        const { data } = req.body;
        const equipamento = await this.equipamentoService.create(data);
        res.status(201).json(equipamento);
    }

}