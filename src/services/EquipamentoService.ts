import { appDataSource } from "../database/appDataSource.js";
import { Equipamento } from "../entities/Equipamento.js";

export class EquipamentoService {
    private equipamentosRepository = appDataSource.getRepository(Equipamento);

    public async findAll(): Promise<Equipamento[]> {
        return await this.equipamentosRepository.find();
    }

    public async findById(id: number): Promise<Equipamento> {
        const equipamento = await this.equipamentosRepository.findOne({ where: { id } })
        if (!equipamento) {
            throw new Error("Equipamento não encontrado")
        }
        return equipamento;
    }

    public async create(data: Equipamento): Promise<Equipamento> {
        const novoEquipamento = this.equipamentosRepository.create(data);
        await this.equipamentosRepository.save(novoEquipamento);

        return novoEquipamento;
    }
}