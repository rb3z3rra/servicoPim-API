import { AppError } from '../errors/AppError.js';
import type { DataSource, EntityManager, Repository } from "typeorm";
import { OrdemServico } from "../entities/OrdemServico.js";
import { Equipamento } from "../entities/Equipamento.js";
import { Usuario } from "../entities/Usuario.js";
import { StatusOs } from "../types/os_status.js";
import { Perfil } from "../types/usr_perfil.js";
import { HistoricoOSService } from "./HistoricoOSService.js";

type CreateOrdemServicoDTO = {
  equipamentoId: number;
  solicitanteId: string;
  tipo_manutencao: OrdemServico["tipo_manutencao"];
  prioridade: OrdemServico["prioridade"];
  descricao_falha: string;
};

type AtribuirTecnicoDTO = {
  tecnicoId: string;
};

type AtualizarStatusDTO = {
  status: StatusOs;
};

type ConcluirOrdemServicoDTO = {
  descricao_servico: string;
  pecas_utilizadas?: string;
  horas_trabalhadas: number;
};

export class OrdemServicoService {
  private ordemServicoRepo: Repository<OrdemServico>;
  private equipamentoRepo: Repository<Equipamento>;
  private usuarioRepo: Repository<Usuario>;
  private historicoService: HistoricoOSService;

  constructor(
    appDataSource: DataSource,
    historicoService?: HistoricoOSService
  ) {
    this.ordemServicoRepo = appDataSource.getRepository(OrdemServico);
    this.equipamentoRepo = appDataSource.getRepository(Equipamento);
    this.usuarioRepo = appDataSource.getRepository(Usuario);
    this.historicoService = historicoService ?? new HistoricoOSService(appDataSource);
  }

  async getAll(): Promise<OrdemServico[]> {
    return await this.ordemServicoRepo.find({
      relations: ["equipamento", "solicitante", "tecnico"],
      order: { abertura_em: "DESC" },
    });
  }

  async getById(id: string): Promise<OrdemServico> {
    const ordemServico = await this.ordemServicoRepo.findOne({
      where: { id },
      relations: ["equipamento", "solicitante", "tecnico"],
    });

    if (!ordemServico) {
      throw new AppError("Ordem de serviço não encontrada");
    }

    return ordemServico;
  }

  async createOrdemServico(data: CreateOrdemServicoDTO): Promise<OrdemServico> {
    const ordemServicoId = await this.ordemServicoRepo.manager.transaction(
      async (manager) => {
        const equipamento = await manager.getRepository(Equipamento).findOne({
          where: { id: data.equipamentoId, ativo: true },
        });

        if (!equipamento) {
          throw new AppError("Equipamento não encontrado");
        }

        const solicitante = await manager.getRepository(Usuario).findOne({
          where: { id: data.solicitanteId, ativo: true },
        });

        if (!solicitante) {
          throw new AppError("Solicitante não encontrado");
        }

        const numero = await this.gerarNumeroOS(manager);
        const ordemServicoRepo = manager.getRepository(OrdemServico);
        const novaOrdemServico = ordemServicoRepo.create({
          numero,
          equipamento,
          solicitante,
          tecnico: null,
          tipo_manutencao: data.tipo_manutencao,
          prioridade: data.prioridade,
          status: StatusOs.ABERTA,
          descricao_falha: data.descricao_falha,
        });

        await ordemServicoRepo.save(novaOrdemServico);
        await this.historicoService.registrarHistorico(
          novaOrdemServico.id,
          solicitante.id,
          null,
          StatusOs.ABERTA,
          "Ordem de serviço criada",
          manager
        );

        return novaOrdemServico.id;
      }
    );

    return await this.getById(ordemServicoId);
  }

  async atribuirTecnico(
    id: string,
    data: AtribuirTecnicoDTO,
    usuarioId: string
  ): Promise<OrdemServico> {
    await this.ordemServicoRepo.manager.transaction(async (manager) => {
      const ordemServico = await this.getOrdemByIdOrFail(id, manager);
      const tecnico = await manager.getRepository(Usuario).findOne({
        where: { id: data.tecnicoId, ativo: true },
      });

      if (!tecnico) {
        throw new AppError("Técnico não encontrado");
      }

      if (tecnico.perfil !== Perfil.TECNICO) {
        throw new AppError("O usuário informado não é um técnico");
      }

      const statusAnterior = ordemServico.status;
      ordemServico.tecnico = tecnico;

      if (ordemServico.status === StatusOs.ABERTA) {
        ordemServico.status = StatusOs.EM_ANDAMENTO;
        ordemServico.inicio_em = new Date();
      }

      await manager.getRepository(OrdemServico).save(ordemServico);
      await this.historicoService.registrarHistorico(
        ordemServico.id,
        usuarioId,
        statusAnterior,
        ordemServico.status,
        `Técnico ${tecnico.nome} atribuído à OS`,
        manager
      );
    });

    return await this.getById(id);
  }

  async atualizarStatus(
    id: string,
    data: AtualizarStatusDTO,
    usuarioId: string
  ): Promise<OrdemServico> {
    await this.ordemServicoRepo.manager.transaction(async (manager) => {
      const ordemServico = await this.getOrdemByIdOrFail(id, manager);

      if (ordemServico.status === StatusOs.CONCLUIDA) {
        throw new AppError("Não é possível alterar uma OS concluída");
      }

      if (ordemServico.status === StatusOs.CANCELADA) {
        throw new AppError("Não é possível alterar uma OS cancelada");
      }

      this.assertStatusTransition(ordemServico.status, data.status, ordemServico);

      const statusAnterior = ordemServico.status;
      ordemServico.status = data.status;

      if (data.status === StatusOs.EM_ANDAMENTO && !ordemServico.inicio_em) {
        ordemServico.inicio_em = new Date();
      }

      await manager.getRepository(OrdemServico).save(ordemServico);
      await this.historicoService.registrarHistorico(
        ordemServico.id,
        usuarioId,
        statusAnterior,
        ordemServico.status,
        `Status alterado de ${statusAnterior} para ${ordemServico.status}`,
        manager
      );
    });

    return await this.getById(id);
  }

  async concluirOrdemServico(
    id: string,
    data: ConcluirOrdemServicoDTO,
    usuarioId: string
  ): Promise<OrdemServico> {
    await this.ordemServicoRepo.manager.transaction(async (manager) => {
      const ordemServico = await this.getOrdemByIdOrFail(id, manager);

      if (!ordemServico.tecnico) {
        throw new AppError("Não é possível concluir uma OS sem técnico atribuído");
      }

      if (ordemServico.status === StatusOs.CANCELADA) {
        throw new AppError("Não é possível concluir uma OS cancelada");
      }

      if (!data.descricao_servico) {
        throw new AppError("Descrição do serviço é obrigatória");
      }

      if (
        data.horas_trabalhadas === undefined ||
        data.horas_trabalhadas === null
      ) {
        throw new AppError("Horas trabalhadas é obrigatório");
      }

      const statusAnterior = ordemServico.status;
      ordemServico.descricao_servico = data.descricao_servico;
      ordemServico.pecas_utilizadas = data.pecas_utilizadas ?? null;
      ordemServico.horas_trabalhadas = data.horas_trabalhadas;
      ordemServico.status = StatusOs.CONCLUIDA;
      ordemServico.conclusao_em = new Date();

      if (!ordemServico.inicio_em) {
        ordemServico.inicio_em = new Date();
      }

      await manager.getRepository(OrdemServico).save(ordemServico);
      await this.historicoService.registrarHistorico(
        ordemServico.id,
        usuarioId,
        statusAnterior,
        ordemServico.status,
        "Ordem de serviço concluída",
        manager
      );
    });

    return await this.getById(id);
  }

  private async getOrdemByIdOrFail(
    id: string,
    manager: EntityManager
  ): Promise<OrdemServico> {
    const ordemServico = await manager.getRepository(OrdemServico).findOne({
      where: { id },
      relations: ["equipamento", "solicitante", "tecnico"],
    });

    if (!ordemServico) {
      throw new AppError("Ordem de serviço não encontrada");
    }

    return ordemServico;
  }

  private assertStatusTransition(
    statusAtual: StatusOs,
    statusNovo: StatusOs,
    ordemServico: OrdemServico
  ) {
    if (statusAtual === statusNovo) {
      return;
    }

    if (
      statusNovo === StatusOs.EM_ANDAMENTO &&
      !ordemServico.tecnico
    ) {
      throw new AppError("Não é possível iniciar uma OS sem técnico atribuído");
    }

    if (
      statusAtual === StatusOs.ABERTA &&
      ![StatusOs.EM_ANDAMENTO, StatusOs.CANCELADA].includes(statusNovo)
    ) {
      throw new AppError("Transição de status inválida para OS aberta");
    }

    if (
      statusAtual === StatusOs.EM_ANDAMENTO &&
      ![
        StatusOs.AGUARDANDO_PECA,
        StatusOs.CANCELADA,
        StatusOs.CONCLUIDA,
      ].includes(statusNovo)
    ) {
      throw new AppError("Transição de status inválida para OS em andamento");
    }

    if (
      statusAtual === StatusOs.AGUARDANDO_PECA &&
      ![StatusOs.EM_ANDAMENTO, StatusOs.CANCELADA].includes(statusNovo)
    ) {
      throw new AppError("Transição de status inválida para OS aguardando peça");
    }
  }

  private async gerarNumeroOS(manager: EntityManager): Promise<string> {
    const [result] = await manager.query(
      `SELECT nextval('ordem_servico_numero_seq')::bigint AS value`
    );
    const nextValue = Number(result.value);

    return `OS-${String(nextValue).padStart(4, "0")}`;
  }
}
