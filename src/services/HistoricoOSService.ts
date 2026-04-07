import { Repository } from "typeorm";
import { appDataSource } from "../database/appDataSource.js";
import { HistoricoOS } from "../entities/HistoricoOS.js";
import { OrdemServico } from "../entities/OrdemServico.js";
import { Usuario } from "../entities/Usuario.js";

export class HistoricoOSService {
  private historicoRepo: Repository<HistoricoOS>;
  private ordemServicoRepo: Repository<OrdemServico>;
  private usuarioRepo: Repository<Usuario>;

  constructor() {
    this.historicoRepo = appDataSource.getRepository(HistoricoOS);
    this.ordemServicoRepo = appDataSource.getRepository(OrdemServico);
    this.usuarioRepo = appDataSource.getRepository(Usuario);
  }

  async registrarHistorico(
    osId: string,
    usuarioId: string,
    statusAnterior: string | null,
    statusNovo: string,
    observacao?: string
  ) {
    const ordemServico = await this.ordemServicoRepo.findOne({ where: { id: osId } });
    if (!ordemServico) {
      throw new Error("Ordem de serviço não encontrada");
    }

    const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId } });
    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    const historico = this.historicoRepo.create({
      osId,
      usuarioId,
      statusAnterior,
      statusNovo,
      observacao: observacao ?? null,
    });

    return await this.historicoRepo.save(historico);
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
      throw new Error("Histórico não encontrado");
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