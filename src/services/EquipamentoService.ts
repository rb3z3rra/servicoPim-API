import { AppError } from '../errors/AppError.js';
import type { Repository, DataSource } from "typeorm";
import { Equipamento } from "../entities/Equipamento.js";

export class EquipamentoService {
  private equipamentoRepo: Repository<Equipamento>;

  constructor(appDataSource: DataSource) {
    this.equipamentoRepo = appDataSource.getRepository(Equipamento);
  }

  async getAll(): Promise<Equipamento[]> {
    return await this.equipamentoRepo.find();
  }

  async getById(id: number): Promise<Equipamento> {
    const equipamento = await this.equipamentoRepo.findOne({
      where: { id },
    });

    if (!equipamento) {
      throw new AppError("Equipamento não encontrado");
    }

    return equipamento;
  }

  async getByCodigo(codigo: string): Promise<Equipamento> {
    const equipamento = await this.equipamentoRepo.findOne({
      where: { codigo },
    });

    if (!equipamento) {
      throw new AppError("Equipamento não encontrado");
    }

    return equipamento;
  }

  async createEquipamento(data: Equipamento): Promise<Equipamento> {
    const codigoExistente = await this.equipamentoRepo.findOne({
      where: { codigo: data.codigo },
    });

    if (codigoExistente) {
      throw new AppError("Código do equipamento já cadastrado");
    }

    const novoEquipamento = this.equipamentoRepo.create(data);

    await this.equipamentoRepo.save(novoEquipamento);

    return novoEquipamento;
  }

  async updateEquipamento(
    id: number,
    data: Partial<Equipamento>
  ): Promise<Equipamento> {
    const equipamento = await this.getById(id);

    if (data.codigo && data.codigo !== equipamento.codigo) {
      const codigoExistente = await this.equipamentoRepo.findOne({
        where: { codigo: data.codigo },
      });

      if (codigoExistente) {
        throw new AppError("Código do equipamento já cadastrado");
      }
    }

    Object.assign(equipamento, data);

    await this.equipamentoRepo.save(equipamento);

    return equipamento;
  }

  async deleteEquipamento(id: number): Promise<void> {
    const equipamento = await this.getById(id);

    await this.equipamentoRepo.remove(equipamento);
  }
}