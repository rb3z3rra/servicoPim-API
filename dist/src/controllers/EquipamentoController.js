import { EquipamentoService } from "../services/EquipamentoService.js";
import { appDataSource } from "../database/appDataSource.js";
const equipamentoService = new EquipamentoService(appDataSource);
export class EquipamentoController {
    async create(req, res) {
        const data = req.body;
        const equipamento = await equipamentoService.createEquipamento(data);
        return res.status(201).json(equipamento);
    }
    async getAll(req, res) {
        const equipamentos = await equipamentoService.getAll();
        return res.status(200).json(equipamentos);
    }
    async getById(req, res) {
        const { id } = req.params;
        const equipamento = await equipamentoService.getById(Number(id));
        return res.status(200).json(equipamento);
    }
    async update(req, res) {
        const { id } = req.params;
        const data = req.body;
        const equipamento = await equipamentoService.updateEquipamento(Number(id), data);
        return res.status(200).json(equipamento);
    }
    async delete(req, res) {
        const { id } = req.params;
        await equipamentoService.deleteEquipamento(Number(id));
        return res.status(204).send();
    }
}
//# sourceMappingURL=EquipamentoController.js.map