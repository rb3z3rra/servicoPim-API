import { AppError } from '../errors/AppError.js';
import type { Repository, DataSource } from "typeorm";
import { Equipamento } from "../entities/Equipamento.js";
import { StatusOs } from "../types/os_status.js";

type ListarEquipamentosFilters = {
  busca?: string;
  setor?: string;
  ativo?: boolean;
  comOsAbertas?: boolean;
};

export class EquipamentoService {
  private equipamentoRepo: Repository<Equipamento>;

  constructor(appDataSource: DataSource) {
    this.equipamentoRepo = appDataSource.getRepository(Equipamento);
  }

  async getAll(filters: ListarEquipamentosFilters = {}): Promise<Equipamento[]> {
    const query = this.equipamentoRepo
      .createQueryBuilder("equipamento")
      .loadRelationCountAndMap(
        "equipamento.os_abertas_count",
        "equipamento.ordensServico",
        "ordemAberta",
        (qb) =>
          qb.where("ordemAberta.status IN (:...statuses)", {
            statuses: [StatusOs.ABERTA, StatusOs.EM_ANDAMENTO, StatusOs.AGUARDANDO_PECA],
          })
      )
      .orderBy("equipamento.nome", "ASC");

    if (filters.busca?.trim()) {
      query.andWhere(
        `(equipamento.codigo ILIKE :busca OR equipamento.nome ILIKE :busca OR equipamento.numero_patrimonio ILIKE :busca)`,
        { busca: `%${filters.busca.trim()}%` }
      );
    }

    if (filters.setor?.trim()) {
      query.andWhere("equipamento.setor ILIKE :setor", {
        setor: `%${filters.setor.trim()}%`,
      });
    }

    if (typeof filters.ativo === "boolean") {
      query.andWhere("equipamento.ativo = :ativo", { ativo: filters.ativo });
    }

    if (filters.comOsAbertas) {
      query.andWhere(
        `EXISTS (
          SELECT 1
          FROM ordem_servico ordem
          WHERE ordem.equipamento_id = equipamento.id
            AND ordem.status IN (:...statusesAbertos)
        )`,
        {
          statusesAbertos: [StatusOs.ABERTA, StatusOs.EM_ANDAMENTO, StatusOs.AGUARDANDO_PECA],
        }
      );
    }

    return await query.getMany();
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

  async getDetailsById(id: number): Promise<Equipamento> {
    const equipamento = await this.equipamentoRepo.findOne({
      where: { id },
      relations: [
        "ordensServico",
        "ordensServico.solicitante",
        "ordensServico.tecnico",
      ],
      order: {
        ordensServico: {
          abertura_em: "DESC",
        },
      },
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

    if (!equipamento.ativo) {
      return;
    }

    equipamento.ativo = false;
    await this.equipamentoRepo.save(equipamento);
  }
}
