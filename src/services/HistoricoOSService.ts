import { AppError } from '../errors/AppError.js';
import { Brackets, type DataSource, EntityManager, Repository } from "typeorm";
import { appDataSource } from "../database/appDataSource.js";
import { HistoricoOS } from "../entities/HistoricoOS.js";
import { OrdemServico } from "../entities/OrdemServico.js";
import { Usuario } from "../entities/Usuario.js";
import { Perfil } from "../types/usr_perfil.js";

type ListarHistoricoFilters = {
  busca?: string;
  statusNovo?: string;
  prioridade?: string;
  usuarioId?: string;
  osId?: string;
  dataInicio?: string;
  dataFim?: string;
};

type HistoricoAccess = {
  usuarioId?: string;
  usuarioPerfil?: Perfil;
};

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

  async getAll(filters: ListarHistoricoFilters = {}) {
    return this.getAllScoped(filters);
  }

  async getAllScoped(filters: ListarHistoricoFilters = {}, access: HistoricoAccess = {}) {
    const query = this.createHistoricoQuery();
    this.applyHistoricoAccess(query, access);

    if (filters.busca?.trim()) {
      const busca = `%${filters.busca.trim()}%`;
      query.andWhere(
        new Brackets((builder) => {
          builder
            .where("ordemServico.numero ILIKE :busca", { busca })
            .orWhere("usuario.nome ILIKE :busca", { busca })
            .orWhere("historico.observacao ILIKE :busca", { busca });
        })
      );
    }

    if (filters.statusNovo) {
      query.andWhere("historico.statusNovo = :statusNovo", {
        statusNovo: filters.statusNovo,
      });
    }

    if (filters.prioridade) {
      query.andWhere("ordemServico.prioridade = :prioridade", {
        prioridade: filters.prioridade,
      });
    }

    if (filters.usuarioId) {
      query.andWhere("historico.usuarioId = :usuarioId", {
        usuarioId: filters.usuarioId,
      });
    }

    if (filters.osId) {
      query.andWhere("historico.osId = :osId", {
        osId: filters.osId,
      });
    }

    if (filters.dataInicio) {
      query.andWhere("DATE(historico.registradoEm) >= :dataInicio", {
        dataInicio: filters.dataInicio,
      });
    }

    if (filters.dataFim) {
      query.andWhere("DATE(historico.registradoEm) <= :dataFim", {
        dataFim: filters.dataFim,
      });
    }

    return await query.getMany();
  }

  async getById(id: string, access: HistoricoAccess = {}) {
    const query = this.createHistoricoQuery().andWhere("historico.id = :id", { id });
    this.applyHistoricoAccess(query, access);
    const historico = await query.getOne();

    if (!historico) {
      throw new AppError("Histórico não encontrado");
    }

    return historico;
  }

  async getByOsId(osId: string, access: HistoricoAccess = {}) {
    const query = this.createHistoricoQuery("ASC").andWhere("historico.osId = :osId", { osId });
    this.applyHistoricoAccess(query, access);
    return await query.getMany();
  }

  async getByUsuario(usuarioId: string, access: HistoricoAccess = {}) {
    const query = this.createHistoricoQuery().andWhere("historico.usuarioId = :usuarioId", {
      usuarioId,
    });
    this.applyHistoricoAccess(query, access);
    return await query.getMany();
  }

  private createHistoricoQuery(order: "ASC" | "DESC" = "DESC") {
    return this.historicoRepo
      .createQueryBuilder("historico")
      .leftJoinAndSelect("historico.ordemServico", "ordemServico")
      .leftJoinAndSelect("historico.usuario", "usuario")
      .leftJoin("ordemServico.tecnico", "tecnicoAtual")
      .leftJoin("ordemServico.apontamentos", "apontamentoTecnico")
      .distinct(true)
      .orderBy("historico.registradoEm", order);
  }

  private applyHistoricoAccess(query: ReturnType<HistoricoOSService["createHistoricoQuery"]>, access: HistoricoAccess) {
    if (access.usuarioPerfil !== Perfil.TECNICO || !access.usuarioId) {
      return;
    }

    query.andWhere(
      new Brackets((builder) => {
        builder
          .where("tecnicoAtual.id = :usuarioId", { usuarioId: access.usuarioId })
          .orWhere("apontamentoTecnico.tecnicoId = :usuarioId", {
            usuarioId: access.usuarioId,
          });
      })
    );
  }
}
