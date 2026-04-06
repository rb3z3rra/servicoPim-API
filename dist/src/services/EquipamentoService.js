import { Equipamento } from "../entities/Equipamento.js";
export class EquipamentoService {
    equipamentoRepo;
    constructor(appDataSource) {
        this.equipamentoRepo = appDataSource.getRepository(Equipamento);
    }
    async getAll() {
        return await this.equipamentoRepo.find();
    }
    async getById(id) {
        const equipamento = await this.equipamentoRepo.findOne({
            where: { id },
        });
        if (!equipamento) {
            throw new Error("Equipamento não encontrado");
        }
        return equipamento;
    }
    async getByCodigo(codigo) {
        const equipamento = await this.equipamentoRepo.findOne({
            where: { codigo },
        });
        if (!equipamento) {
            throw new Error("Equipamento não encontrado");
        }
        return equipamento;
    }
    async createEquipamento(data) {
        const codigoExistente = await this.equipamentoRepo.findOne({
            where: { codigo: data.codigo },
        });
        if (codigoExistente) {
            throw new Error("Código do equipamento já cadastrado");
        }
        const novoEquipamento = this.equipamentoRepo.create(data);
        await this.equipamentoRepo.save(novoEquipamento);
        return novoEquipamento;
    }
    async updateEquipamento(id, data) {
        const equipamento = await this.getById(id);
        if (data.codigo && data.codigo !== equipamento.codigo) {
            const codigoExistente = await this.equipamentoRepo.findOne({
                where: { codigo: data.codigo },
            });
            if (codigoExistente) {
                throw new Error("Código do equipamento já cadastrado");
            }
        }
        Object.assign(equipamento, data);
        await this.equipamentoRepo.save(equipamento);
        return equipamento;
    }
    async deleteEquipamento(id) {
        const equipamento = await this.getById(id);
        await this.equipamentoRepo.remove(equipamento);
    }
}
//# sourceMappingURL=EquipamentoService.js.map