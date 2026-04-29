import { AppError } from "../errors/AppError.js";
import { Brackets, type DataSource, type EntityManager, type Repository, type SelectQueryBuilder } from "typeorm";
import { OrdemServico } from "../entities/OrdemServico.js";
import { Equipamento } from "../entities/Equipamento.js";
import { Usuario } from "../entities/Usuario.js";
import { StatusOs } from "../types/os_status.js";
import { Perfil } from "../types/usr_perfil.js";
import { HistoricoOSService } from "./HistoricoOSService.js";
import { Prioridade } from "../types/os_prioridade.js";
import { ApontamentoOSService } from "./ApontamentoOSService.js";
import { ApontamentoOS } from "../entities/ApontamentoOS.js";
import { ConfiguracaoPrazoAtendimentoService } from "./ConfiguracaoPrazoAtendimentoService.js";
import { StatusPrazoOS } from "../types/os_status_prazo.js";

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
  observacao?: string | null;
};

type ListarOrdensServicoFilters = {
  status: StatusOs | undefined;
  prioridade: Prioridade | undefined;
  tecnicoId: string | undefined;
  setor: string | undefined;
  busca: string | undefined;
  dataInicio?: string | undefined;
  dataFim?: string | undefined;
};

type ConcluirOrdemServicoDTO = {
  descricao_servico: string;
  pecas_utilizadas?: string;
};

export type DashboardIndicadores = {
  abertas: number;
  em_andamento: number;
  aguardando_peca: number;
  concluidas_mes: number;
  criticas_abertas: number;
  sem_tecnico: number;
  disponiveis_para_assumir: number;
  minhas_atribuidas: number;
  apontamento_aberto: boolean;
  tempo_medio_execucao_horas: number;
  tempo_medio_ate_inicio_horas: number;
  tempo_medio_ate_conclusao_horas: number;
  tempo_medio_trabalho_horas: number;
  prazo_horas: Record<Prioridade, number>;
};

type OrdemServicoComMetricas = OrdemServico & {
  duracao_execucao_minutos?: number | null;
  duracao_execucao_formatada?: string | null;
  total_trabalhado_minutos?: number;
  total_trabalhado_formatado?: string;
  apontamento_aberto?: boolean;
  apontamentos?: ApontamentoOS[];
  prazo_limite_em?: Date;
};

export class OrdemServicoService {
  private ordemServicoRepo: Repository<OrdemServico>;
  private historicoService: HistoricoOSService;
  private apontamentoService: ApontamentoOSService;
  private configuracaoPrazoAtendimentoService: ConfiguracaoPrazoAtendimentoService;

  constructor(appDataSource: DataSource, historicoService?: HistoricoOSService) {
    this.ordemServicoRepo = appDataSource.getRepository(OrdemServico);
    this.historicoService =
      historicoService ?? new HistoricoOSService(appDataSource);
    this.apontamentoService = new ApontamentoOSService(
      appDataSource,
      this.historicoService
    );
    this.configuracaoPrazoAtendimentoService = new ConfiguracaoPrazoAtendimentoService(appDataSource);
  }

  async getAll(
    filters: ListarOrdensServicoFilters = {
      status: undefined,
      prioridade: undefined,
      tecnicoId: undefined,
      setor: undefined,
      busca: undefined,
      dataInicio: undefined,
      dataFim: undefined,
    },
    usuarioId?: string,
    usuarioPerfil?: Perfil
  ): Promise<OrdemServico[]> {
    const busca = filters.busca?.trim();

    const query = this.ordemServicoRepo
      .createQueryBuilder("ordemServico")
      .leftJoinAndSelect("ordemServico.equipamento", "equipamento")
      .leftJoinAndSelect("ordemServico.solicitante", "solicitante")
      .leftJoinAndSelect("ordemServico.tecnico", "tecnico")
      .leftJoinAndSelect("ordemServico.apontamentos", "apontamentos")
      .leftJoinAndSelect("apontamentos.tecnico", "apontamentoTecnico");

    if (usuarioPerfil === Perfil.SOLICITANTE && usuarioId) {
      query.andWhere("solicitante.id = :usuarioId", { usuarioId });
    }

    if (usuarioPerfil === Perfil.TECNICO && usuarioId) {
      query.andWhere(
        new Brackets((builder) => {
          builder
            .where("tecnico.id = :usuarioId", { usuarioId })
            .orWhere(
              new Brackets((subBuilder) => {
                subBuilder
                  .where("ordemServico.status = :statusAberta", { statusAberta: StatusOs.ABERTA })
                  .andWhere("tecnico.id IS NULL");
              })
            );
        })
      );
    }

    if (busca) {
      query.andWhere(
        new Brackets((builder) => {
          builder
            .where("ordemServico.numero ILIKE :busca", { busca: `%${busca}%` })
            .orWhere("ordemServico.descricao_falha ILIKE :busca", {
              busca: `%${busca}%`,
            });
        })
      );
    }

    if (filters.status) {
      query.andWhere("ordemServico.status = :status", { status: filters.status });
    }

    if (filters.prioridade) {
      query.andWhere("ordemServico.prioridade = :prioridade", {
        prioridade: filters.prioridade,
      });
    }

    if (filters.tecnicoId) {
      query.andWhere("tecnico.id = :tecnicoId", {
        tecnicoId: filters.tecnicoId,
      });
    }

    if (filters.setor) {
      query.andWhere("equipamento.setor ILIKE :setor", {
        setor: `%${filters.setor}%`,
      });
    }

    if (filters.dataInicio) {
      query.andWhere("ordemServico.abertura_em >= :dataInicio", {
        dataInicio: this.inicioDoDia(filters.dataInicio),
      });
    }

    if (filters.dataFim) {
      query.andWhere("ordemServico.abertura_em <= :dataFim", {
        dataFim: this.fimDoDia(filters.dataFim),
      });
    }

    const ordens = await query
      .orderBy("ordemServico.abertura_em", "DESC")
      .getMany();

    return ordens.map((ordem) => this.attachMetricas(ordem));
  }

  async getById(
    id: string,
    usuarioId?: string,
    usuarioPerfil?: Perfil
  ): Promise<OrdemServico> {
    const ordemServico = await this.ordemServicoRepo.findOne({
      where: { id },
      relations: ["equipamento", "solicitante", "tecnico", "apontamentos", "apontamentos.tecnico"],
    });

    if (!ordemServico) {
      throw new AppError("Ordem de serviço não encontrada");
    }

    if (
      usuarioPerfil === Perfil.SOLICITANTE &&
      usuarioId &&
      ordemServico.solicitante.id !== usuarioId
    ) {
      throw new AppError("Acesso negado", 403);
    }

    return this.attachMetricas(ordemServico);
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

      if (
        ordemServico.tecnico &&
        ordemServico.tecnico.id !== tecnico.id
      ) {
        await this.apontamentoService.assertSemApontamentoAbertoParaTransferencia(
          ordemServico.id,
          manager
        );
      }

      const statusAnterior = ordemServico.status;
      ordemServico.tecnico = tecnico;

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

  async autoAtribuir(id: string, usuarioId: string): Promise<OrdemServico> {
    await this.ordemServicoRepo.manager.transaction(async (manager) => {
      const ordemServico = await this.getOrdemByIdOrFail(id, manager);
      const tecnico = await manager.getRepository(Usuario).findOne({
        where: { id: usuarioId, ativo: true },
      });

      if (!tecnico) {
        throw new AppError("Técnico não encontrado");
      }

      if (tecnico.perfil !== Perfil.TECNICO) {
        throw new AppError("Apenas técnicos podem assumir uma OS");
      }

      if (ordemServico.status !== StatusOs.ABERTA) {
        throw new AppError("Apenas OS abertas podem ser assumidas");
      }

      if (ordemServico.tecnico && ordemServico.tecnico.id !== usuarioId) {
        throw new AppError("Esta OS já possui técnico responsável");
      }

      ordemServico.tecnico = tecnico;
      await manager.getRepository(OrdemServico).save(ordemServico);
      await this.historicoService.registrarHistorico(
        ordemServico.id,
        usuarioId,
        ordemServico.status,
        ordemServico.status,
        `OS assumida pelo técnico ${tecnico.nome}`,
        manager
      );
    });

    return await this.getById(id);
  }

  async iniciarOrdemServico(
    id: string,
    usuarioId: string,
    usuarioPerfil: Perfil
  ): Promise<OrdemServico> {
    await this.ordemServicoRepo.manager.transaction(async (manager) => {
      const ordemServico = await this.getOrdemByIdOrFail(id, manager);

      this.assertOperadorAutorizado(ordemServico, usuarioId, usuarioPerfil);

      if (ordemServico.status !== StatusOs.ABERTA) {
        throw new AppError("Apenas OS abertas podem ser iniciadas");
      }

      if (!ordemServico.tecnico) {
        throw new AppError("Não é possível iniciar uma OS sem técnico atribuído");
      }

      const statusAnterior = ordemServico.status;
      ordemServico.status = StatusOs.EM_ANDAMENTO;
      ordemServico.inicio_em = ordemServico.inicio_em ?? new Date();

      await manager.getRepository(OrdemServico).save(ordemServico);
      await this.historicoService.registrarHistorico(
        ordemServico.id,
        usuarioId,
        statusAnterior,
        ordemServico.status,
        "Execução da ordem de serviço iniciada",
        manager
      );
    });

    return await this.getById(id);
  }

  async atualizarStatus(
    id: string,
    data: AtualizarStatusDTO,
    usuarioId: string,
    usuarioPerfil: Perfil
  ): Promise<OrdemServico> {
    await this.ordemServicoRepo.manager.transaction(async (manager) => {
      const ordemServico = await this.getOrdemByIdOrFail(id, manager);
      this.assertOperadorAutorizado(ordemServico, usuarioId, usuarioPerfil);

      if (ordemServico.status === StatusOs.CONCLUIDA) {
        throw new AppError("Não é possível alterar uma OS concluída");
      }

      if (ordemServico.status === StatusOs.CANCELADA) {
        throw new AppError("Não é possível alterar uma OS cancelada");
      }

      this.assertStatusTransition(ordemServico.status, data.status, ordemServico);

      if (
        data.status === StatusOs.CANCELADA &&
        usuarioPerfil !== Perfil.SUPERVISOR
      ) {
        throw new AppError("Apenas o supervisor pode cancelar uma OS", 403);
      }

      if (data.status !== StatusOs.EM_ANDAMENTO) {
        await this.apontamentoService.assertSemApontamentoAberto(id, manager);
      }

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
        data.observacao?.trim() ||
          `Status alterado de ${statusAnterior} para ${ordemServico.status}`,
        manager
      );
    });

    return await this.getById(id);
  }

  async concluirOrdemServico(
    id: string,
    data: ConcluirOrdemServicoDTO,
    usuarioId: string,
    usuarioPerfil: Perfil
  ): Promise<OrdemServico> {
    await this.ordemServicoRepo.manager.transaction(async (manager) => {
      const ordemServico = await this.getOrdemByIdOrFail(id, manager);

      if (!ordemServico.tecnico) {
        throw new AppError("Não é possível concluir uma OS sem técnico atribuído");
      }

      this.assertOperadorAutorizado(ordemServico, usuarioId, usuarioPerfil);
      await this.apontamentoService.assertSemApontamentoAberto(id, manager);

      if (ordemServico.status === StatusOs.CANCELADA) {
        throw new AppError("Não é possível concluir uma OS cancelada");
      }

      if (!data.descricao_servico) {
        throw new AppError("Descrição do serviço é obrigatória");
      }

      const statusAnterior = ordemServico.status;
      const conclusaoEm = new Date();
      const inicioCalculo = new Date(
        ordemServico.inicio_em ?? ordemServico.abertura_em
      );
      const prazoHoras = await this.configuracaoPrazoAtendimentoService.getMapaHoras();
      const resumoTrabalho = await this.apontamentoService.getResumo(id);
      ordemServico.descricao_servico = data.descricao_servico;
      ordemServico.pecas_utilizadas = data.pecas_utilizadas ?? null;
      ordemServico.horas_trabalhadas = Number(
        (resumoTrabalho.total_trabalhado_minutos / 60).toFixed(2)
      );
      ordemServico.status = StatusOs.CONCLUIDA;
      ordemServico.conclusao_em = conclusaoEm;
      ordemServico.status_prazo = this.calcularStatusPrazoConclusao(
        ordemServico.prioridade,
        ordemServico.abertura_em,
        conclusaoEm,
        prazoHoras
      );

      if (!ordemServico.inicio_em) {
        ordemServico.inicio_em = inicioCalculo;
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

  async getDashboard(
    usuarioId: string,
    usuarioPerfil: Perfil
  ): Promise<DashboardIndicadores> {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const scoped = this.createDashboardScopeQuery(usuarioId, usuarioPerfil);
    const prazoHoras = await this.configuracaoPrazoAtendimentoService.getMapaHoras();

    const raw = await scoped
      .select([
        `COUNT(*) FILTER (WHERE ordemServico.status = :statusAberta) AS abertas`,
        `COUNT(*) FILTER (WHERE ordemServico.status = :statusEmAndamento) AS em_andamento`,
        `COUNT(*) FILTER (WHERE ordemServico.status = :statusAguardandoPeca) AS aguardando_peca`,
        `COUNT(*) FILTER (WHERE ordemServico.status = :statusConcluida AND ordemServico.conclusao_em >= :inicioMes) AS concluidas_mes`,
        `COUNT(*) FILTER (
          WHERE ordemServico.prioridade = :prioridadeCritica
            AND ordemServico.status NOT IN (:...statusesFechados)
        ) AS criticas_abertas`,
        `COUNT(*) FILTER (
          WHERE ordemServico.status = :statusAberta
            AND ordemServico.tecnico_id IS NULL
        ) AS sem_tecnico`,
        `COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(ordemServico.conclusao_em, NOW()) - COALESCE(ordemServico.inicio_em, ordemServico.abertura_em))) / 3600)
          FILTER (WHERE ordemServico.status = :statusConcluida AND ordemServico.conclusao_em >= :inicioMes), 0) AS tempo_medio_execucao_horas`,
        `COALESCE(AVG(EXTRACT(EPOCH FROM (ordemServico.inicio_em - ordemServico.abertura_em)) / 3600)
          FILTER (WHERE ordemServico.inicio_em IS NOT NULL), 0) AS tempo_medio_ate_inicio_horas`,
        `COALESCE(AVG(EXTRACT(EPOCH FROM (ordemServico.conclusao_em - ordemServico.abertura_em)) / 3600)
          FILTER (WHERE ordemServico.status = :statusConcluida AND ordemServico.conclusao_em >= :inicioMes), 0) AS tempo_medio_ate_conclusao_horas`,
        `COALESCE(AVG(ordemServico.horas_trabalhadas)
          FILTER (WHERE ordemServico.status = :statusConcluida AND ordemServico.conclusao_em >= :inicioMes), 0) AS tempo_medio_trabalho_horas`,
      ])
      .setParameters({
        inicioMes,
        statusAberta: StatusOs.ABERTA,
        statusEmAndamento: StatusOs.EM_ANDAMENTO,
        statusAguardandoPeca: StatusOs.AGUARDANDO_PECA,
        statusConcluida: StatusOs.CONCLUIDA,
        prioridadeCritica: Prioridade.CRITICA,
        statusesFechados: [StatusOs.CONCLUIDA, StatusOs.CANCELADA],
      })
      .getRawOne<{
        abertas: string;
        em_andamento: string;
        aguardando_peca: string;
        concluidas_mes: string;
        criticas_abertas: string;
        sem_tecnico: string;
        tempo_medio_execucao_horas: string;
        tempo_medio_ate_inicio_horas: string;
        tempo_medio_ate_conclusao_horas: string;
        tempo_medio_trabalho_horas: string;
      }>();

    const disponiveisParaAssumir =
      usuarioPerfil === Perfil.TECNICO
        ? await this.ordemServicoRepo
            .createQueryBuilder("ordemServico")
            .where("ordemServico.status = :status", { status: StatusOs.ABERTA })
            .andWhere("ordemServico.tecnico_id IS NULL")
            .getCount()
        : 0;

    const minhasAtribuidas =
      usuarioPerfil === Perfil.TECNICO
        ? await this.ordemServicoRepo
            .createQueryBuilder("ordemServico")
            .leftJoin("ordemServico.tecnico", "tecnico")
            .where("tecnico.id = :usuarioId", { usuarioId })
            .getCount()
        : 0;

    const apontamentoAberto =
      usuarioPerfil === Perfil.TECNICO
        ? await this.apontamentoService.hasOpenByTecnico(usuarioId)
        : false;

    return {
      abertas: Number(raw?.abertas ?? 0),
      em_andamento: Number(raw?.em_andamento ?? 0),
      aguardando_peca: Number(raw?.aguardando_peca ?? 0),
      concluidas_mes: Number(raw?.concluidas_mes ?? 0),
      criticas_abertas: Number(raw?.criticas_abertas ?? 0),
      sem_tecnico: Number(raw?.sem_tecnico ?? 0),
      disponiveis_para_assumir: disponiveisParaAssumir,
      minhas_atribuidas: minhasAtribuidas,
      apontamento_aberto: apontamentoAberto,
      tempo_medio_execucao_horas: Number(Number(raw?.tempo_medio_execucao_horas ?? 0).toFixed(2)),
      tempo_medio_ate_inicio_horas: Number(Number(raw?.tempo_medio_ate_inicio_horas ?? 0).toFixed(2)),
      tempo_medio_ate_conclusao_horas: Number(Number(raw?.tempo_medio_ate_conclusao_horas ?? 0).toFixed(2)),
      tempo_medio_trabalho_horas: Number(Number(raw?.tempo_medio_trabalho_horas ?? 0).toFixed(2)),
      prazo_horas: prazoHoras,
    };
  }

  private createDashboardScopeQuery(
    usuarioId: string,
    usuarioPerfil: Perfil
  ): SelectQueryBuilder<OrdemServico> {
    const query = this.ordemServicoRepo
      .createQueryBuilder("ordemServico")
      .leftJoin("ordemServico.solicitante", "solicitante")
      .leftJoin("ordemServico.tecnico", "tecnico");

    if (usuarioPerfil === Perfil.SOLICITANTE) {
      query.where("solicitante.id = :usuarioId", { usuarioId });
    } else if (usuarioPerfil === Perfil.TECNICO) {
      query.where("tecnico.id = :usuarioId", { usuarioId });
    }

    return query;
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

    if (statusNovo === StatusOs.EM_ANDAMENTO && !ordemServico.tecnico) {
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
      ![StatusOs.AGUARDANDO_PECA, StatusOs.CANCELADA].includes(statusNovo)
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
    await manager.query(`
      SELECT setval(
        'ordem_servico_numero_seq',
        GREATEST(
          COALESCE((SELECT last_value FROM ordem_servico_numero_seq), 0),
          COALESCE(
            (
              SELECT MAX(CAST(SUBSTRING(numero FROM 'OS-(\\d+)$') AS bigint))
              FROM ordem_servico
              WHERE numero ~ '^OS-[0-9]+$'
            ),
            0
          )
        )
      )
    `);

    const [result] = await manager.query(
      `SELECT nextval('ordem_servico_numero_seq')::bigint AS value`
    );
    const nextValue = Number(result.value);

    return `OS-${String(nextValue).padStart(4, "0")}`;
  }

  private assertOperadorAutorizado(
    ordemServico: OrdemServico,
    usuarioId: string,
    usuarioPerfil: Perfil
  ) {
    if (usuarioPerfil === Perfil.SUPERVISOR) {
      return;
    }

    if (usuarioPerfil !== Perfil.TECNICO) {
      throw new AppError("Acesso negado", 403);
    }

    if (!ordemServico.tecnico || ordemServico.tecnico.id !== usuarioId) {
      throw new AppError("Apenas o técnico responsável pode operar esta OS", 403);
    }
  }

  private attachMetricas(ordemServico: OrdemServico): OrdemServico {
    const ordemComMetricas = ordemServico as OrdemServicoComMetricas;
    const inicioBase = ordemServico.inicio_em ?? ordemServico.abertura_em;
    const fimBase =
      ordemServico.conclusao_em ??
      (ordemServico.status === StatusOs.EM_ANDAMENTO ? new Date() : null);

    if (!inicioBase || !fimBase) {
      ordemComMetricas.duracao_execucao_minutos = null;
      ordemComMetricas.duracao_execucao_formatada = null;
      this.attachPrazoLimite(ordemComMetricas);
      this.attachResumoTrabalho(ordemComMetricas);
      return ordemComMetricas;
    }

    const minutos = Math.max(
      0,
      Math.round(
        (new Date(fimBase).getTime() - new Date(inicioBase).getTime()) /
          (1000 * 60)
      )
    );

    ordemComMetricas.duracao_execucao_minutos = minutos;
    ordemComMetricas.duracao_execucao_formatada = `${Math.floor(minutos / 60)}h ${String(
      minutos % 60
    ).padStart(2, "0")}min`;
    this.attachPrazoLimite(ordemComMetricas);

    this.attachResumoTrabalho(ordemComMetricas);
    return ordemComMetricas;
  }

  private calcularStatusPrazoConclusao(
    prioridade: Prioridade,
    aberturaEm: Date,
    conclusaoEm: Date,
    prazoHoras: Record<Prioridade, number>
  ): StatusPrazoOS {
    const prazoLimite = this.calcularPrazoLimite(
      aberturaEm,
      prazoHoras[prioridade] ?? this.prazoPadrao(prioridade)
    );

    return conclusaoEm.getTime() > prazoLimite.getTime()
      ? StatusPrazoOS.CONCLUIDA_COM_PRAZO_ESTOURADO
      : StatusPrazoOS.CONCLUIDA_NO_PRAZO;
  }

  private calcularPrazoLimite(aberturaEm: Date, prazoHoras: number): Date {
    return new Date(new Date(aberturaEm).getTime() + prazoHoras * 60 * 60 * 1000);
  }

  private attachPrazoLimite(ordemServico: OrdemServicoComMetricas): void {
    if (!ordemServico.abertura_em || !ordemServico.prioridade) {
      return;
    }

    ordemServico.prazo_limite_em = this.calcularPrazoLimite(
      ordemServico.abertura_em,
      this.prazoPadrao(ordemServico.prioridade)
    );
  }

  private prazoPadrao(prioridade: Prioridade): number {
    switch (prioridade) {
      case Prioridade.CRITICA:
        return 4;
      case Prioridade.ALTA:
        return 8;
      case Prioridade.MEDIA:
        return 24;
      case Prioridade.BAIXA:
        return 72;
    }
  }

  private calculateHorasTrabalhadas(inicio: Date, fim: Date): number {
    const diffHoras = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60);
    return Number(Math.max(diffHoras, 0).toFixed(2));
  }

  private attachResumoTrabalho(ordemServico: OrdemServicoComMetricas): void {
    const apontamentos = ordemServico.apontamentos ?? [];
    const totalMinutos = apontamentos.reduce((acc, apontamento) => {
      if (!apontamento.fimEm) {
        return acc;
      }

      return (
        acc +
        Math.max(
          0,
          Math.round(
            (new Date(apontamento.fimEm).getTime() - new Date(apontamento.inicioEm).getTime()) /
              (1000 * 60)
          )
        )
      );
    }, 0);

    ordemServico.total_trabalhado_minutos = totalMinutos;
    ordemServico.total_trabalhado_formatado = `${Math.floor(totalMinutos / 60)}h ${String(
      totalMinutos % 60
    ).padStart(2, "0")}min`;
    ordemServico.apontamento_aberto = apontamentos.some((apontamento) => !apontamento.fimEm);
  }

  private inicioDoDia(data: string): Date {
    return new Date(`${data}T00:00:00.000`);
  }

  private fimDoDia(data: string): Date {
    return new Date(`${data}T23:59:59.999`);
  }
}
