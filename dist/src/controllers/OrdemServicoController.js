import { OrdemServicoService } from "../services/OrdemServicoService.js";
import { appDataSource } from "../database/appDataSource.js";
const ordemServicoService = new OrdemServicoService(appDataSource);
export class OrdemServicoController {
    async create(req, res) {
        const data = req.body;
        const ordemServico = await ordemServicoService.createOrdemServico(data);
        return res.status(201).json(ordemServico);
    }
    async getAll(req, res) {
        const ordensServico = await ordemServicoService.getAll();
        return res.status(200).json(ordensServico);
    }
    async getById(req, res) {
        const { id } = req.params;
        const ordemServico = await ordemServicoService.getById(id);
        return res.status(200).json(ordemServico);
    }
    async atribuirTecnico(req, res) {
        const { id } = req.params;
        const ordemServico = await ordemServicoService.atribuirTecnico(id, req.body);
        return res.status(200).json(ordemServico);
    }
    async atualizarStatus(req, res) {
        const { id } = req.params;
        const ordemServico = await ordemServicoService.atualizarStatus(id, req.body);
        return res.status(200).json(ordemServico);
    }
    async concluir(req, res) {
        const { id } = req.params;
        const ordemServico = await ordemServicoService.concluirOrdemServico(id, req.body);
        return res.status(200).json(ordemServico);
    }
}
//# sourceMappingURL=OrdemServicoController.js.map