import { AppError } from '../errors/AppError.js';
import type { DataSource, EntityManager, Repository } from "typeorm";
import { appDataSource } from "../database/appDataSource.js";
import { HistoricoOS } from "../entities/HistoricoOS.js";
import { OrdemServico } from "../entities/OrdemServico.js";
import { Usuario } from "../entities/Usuario.js";

export class HistoricoOSService {
  private historicoRepo: Repository<HistoricoOS>;
  private ordemServicoRepo: Repository<OrdemServico>;
  private usuarioRepo: Repository<Usuario>;

  constructor(dataSource: DataSource = appDataSource) {
    this.historicoRepo = dataSource.getRepository(HistoricoOS);
    this.ordemServicoRepo = dataSource.getRepository(OrdemServico);
    this.usuarioRepo = dataSource.getRepository(Usuario);
  }

  async registrarHistorico(
    osId: string,
    usuarioId: string,
    statusAnterior: string | null,
    statusNovo: string,
    observacao?: string,
    manager?: EntityManager
  ) {
    const historicoRepo = manager?.getRepository(HistoricoOS) ?? this.historicoRepo;
    const ordemServicoRepo = manager?.getRepository(OrdemServico) ?? this.ordemServicoRepo;
    const usuarioRepo = manager?.getRepository(Usuario) ?? this.usuarioRepo;

    const ordemServico = await ordemServicoRepo.findOne({ where: { id: osId } });
    if (!ordemServico) {
      throw new AppError("Ordem de serviço não encontrada");
    }

    const usuario = await usuarioRepo.findOne({ where: { id: usuarioId } });
    if (!usuario) {
      throw new AppError("Usuário não encontrado");
    }

    const historico = historicoRepo.create({
      osId,
      usuarioId,
      statusAnterior,
      statusNovo,
      observacao: observacao ?? null,
    });

    return await historicoRepo.save(historico);
  }

  async getAll() {
    return await this.historicoRepo.find({
      relations: ["ordemServico", "usuario"],
      order: { registradoEm: "DESC" },
    });
  }

  async getById(id: string) {
    const historico = await this.historicoRepo.findOne({
      where: { id },
      relations: ["ordemServico", "usuario"],
    });

    if (!historico) {
      throw new AppError("Histórico não encontrado");
    }

    return historico;
  }

  async getByOsId(osId: string) {
    return await this.historicoRepo.find({
      where: { osId },
      relations: ["usuario"],
      order: { registradoEm: "ASC" },
    });
  }

  async getByUsuario(usuarioId: string) {
    return await this.historicoRepo.find({
      where: { usuarioId },
      relations: ["ordemServico"],
      order: { registradoEm: "DESC" },
    });
  }
}
