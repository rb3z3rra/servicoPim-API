import { jest } from "@jest/globals";
import { Equipamento } from "../../src/entities/Equipamento.js";
import { OrdemServico } from "../../src/entities/OrdemServico.js";
import { Usuario } from "../../src/entities/Usuario.js";
import { ApontamentoOS } from "../../src/entities/ApontamentoOS.js";
import { ConfiguracaoPrazoAtendimento } from "../../src/entities/ConfiguracaoPrazoAtendimento.js";
import { OrdemServicoService } from "../../src/services/OrdemServicoService.js";
import { StatusOs } from "../../src/types/os_status.js";
import { StatusPrazoOS } from "../../src/types/os_status_prazo.js";
import { Prioridade } from "../../src/types/os_prioridade.js";
import { TipoManutencao } from "../../src/types/os_tipoManutencao.js";
import { Perfil } from "../../src/types/usr_perfil.js";
import { HistoricoOSService } from "../../src/services/HistoricoOSService.js";

const ordemRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  manager: {
    transaction: jest.fn(),
  },
};

const queryBuilder = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
};

const equipamentoRepo = {
  findOne: jest.fn(),
};

const usuarioRepo = {
  findOne: jest.fn(),
};

const apontamentoRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const configuracaoPrazoAtendimentoRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockManager = {
  getRepository: jest.fn((entity) => {
    if (entity === OrdemServico) {
      return ordemRepo;
    }

    if (entity === Equipamento) {
      return equipamentoRepo;
    }

    if (entity === Usuario) {
      return usuarioRepo;
    }

    if (entity === ApontamentoOS) {
      return apontamentoRepo;
    }

    if (entity === ConfiguracaoPrazoAtendimento) {
      return configuracaoPrazoAtendimentoRepo;
    }

    return undefined;
  }),
  query: jest.fn(),
};

const mockDataSource = {
  getRepository: jest.fn((entity) => {
    if (entity === OrdemServico) {
      return ordemRepo;
    }

    if (entity === Equipamento) {
      return equipamentoRepo;
    }

    if (entity === Usuario) {
      return usuarioRepo;
    }

    if (entity === ApontamentoOS) {
      return apontamentoRepo;
    }

    if (entity === ConfiguracaoPrazoAtendimento) {
      return configuracaoPrazoAtendimentoRepo;
    }

    return undefined;
  }),
};

const historicoService = {
  registrarHistorico: jest.fn().mockResolvedValue({}),
};

let ordemServicoService: OrdemServicoService;

beforeAll(() => {
  ordemRepo.manager.transaction.mockImplementation(async (callback) => callback(mockManager));
  ordemServicoService = new OrdemServicoService(
    mockDataSource as never,
    historicoService as never
  );
});

beforeEach(() => {
  jest.resetAllMocks();
  mockManager.getRepository.mockImplementation((entity) => {
    if (entity === OrdemServico) {
      return ordemRepo;
    }

    if (entity === Equipamento) {
      return equipamentoRepo;
    }

    if (entity === Usuario) {
      return usuarioRepo;
    }

    if (entity === ApontamentoOS) {
      return apontamentoRepo;
    }

    if (entity === ConfiguracaoPrazoAtendimento) {
      return configuracaoPrazoAtendimentoRepo;
    }

    return undefined;
  });
  mockDataSource.getRepository.mockImplementation((entity) => {
    if (entity === OrdemServico) {
      return ordemRepo;
    }

    if (entity === Equipamento) {
      return equipamentoRepo;
    }

    if (entity === Usuario) {
      return usuarioRepo;
    }

    if (entity === ApontamentoOS) {
      return apontamentoRepo;
    }

    if (entity === ConfiguracaoPrazoAtendimento) {
      return configuracaoPrazoAtendimentoRepo;
    }

    return undefined;
  });
  ordemRepo.manager.transaction.mockImplementation(async (callback) => callback(mockManager));
  ordemRepo.createQueryBuilder.mockReturnValue(queryBuilder);
  queryBuilder.leftJoinAndSelect.mockReturnThis();
  queryBuilder.where.mockReturnThis();
  queryBuilder.andWhere.mockReturnThis();
  queryBuilder.orderBy.mockReturnThis();
  queryBuilder.getMany.mockResolvedValue([]);
  apontamentoRepo.findOne.mockResolvedValue(null);
  apontamentoRepo.find.mockResolvedValue([]);
  configuracaoPrazoAtendimentoRepo.findOne.mockResolvedValue({ id: "prazo-1" });
  configuracaoPrazoAtendimentoRepo.find.mockResolvedValue([
    { prioridade: Prioridade.BAIXA, horas_limite: 72, ativo: true },
    { prioridade: Prioridade.MEDIA, horas_limite: 24, ativo: true },
    { prioridade: Prioridade.ALTA, horas_limite: 8, ativo: true },
    { prioridade: Prioridade.CRITICA, horas_limite: 4, ativo: true },
  ]);
  configuracaoPrazoAtendimentoRepo.create.mockImplementation((data) => data);
  configuracaoPrazoAtendimentoRepo.save.mockImplementation(async (data) => data);
});

describe("OrdemServicoService", () => {
  test("usa HistoricoOSService padrão quando não é injetado", () => {
    const service = new OrdemServicoService(mockDataSource as never);

    expect(service).toBeInstanceOf(OrdemServicoService);
  });

  test("lista ordens de serviço", async () => {
    queryBuilder.getMany.mockResolvedValue([{ id: "os-1" }]);

    const result = await ordemServicoService.getAll();

    expect(result).toEqual([
      {
        id: "os-1",
        duracao_execucao_minutos: null,
        duracao_execucao_formatada: null,
        total_trabalhado_minutos: 0,
        total_trabalhado_formatado: "0h 00min",
        apontamento_aberto: false,
      },
    ]);
  });

  test("lista ordens de serviço com filtros de status e prioridade", async () => {
    queryBuilder.getMany.mockResolvedValue([{ id: "os-2" }]);

    const result = await ordemServicoService.getAll({
      status: StatusOs.ABERTA,
      prioridade: Prioridade.ALTA,
      tecnicoId: undefined,
      setor: undefined,
      busca: undefined,
    });

    expect(result).toEqual([
      {
        id: "os-2",
        duracao_execucao_minutos: null,
        duracao_execucao_formatada: null,
        total_trabalhado_minutos: 0,
        total_trabalhado_formatado: "0h 00min",
        apontamento_aberto: false,
      },
    ]);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "ordemServico.status = :status",
      { status: StatusOs.ABERTA }
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "ordemServico.prioridade = :prioridade",
      { prioridade: Prioridade.ALTA }
    );
  });

  test("lista ordens de serviço com busca por número ou descrição", async () => {
    queryBuilder.getMany.mockResolvedValue([{ id: "os-busca" }]);

    const result = await ordemServicoService.getAll({
      status: StatusOs.ABERTA,
      prioridade: Prioridade.ALTA,
      tecnicoId: undefined,
      setor: undefined,
      busca: "servidor",
    });

    expect(result).toEqual([
      {
        id: "os-busca",
        duracao_execucao_minutos: null,
        duracao_execucao_formatada: null,
        total_trabalhado_minutos: 0,
        total_trabalhado_formatado: "0h 00min",
        apontamento_aberto: false,
      },
    ]);
    expect(ordemRepo.createQueryBuilder).toHaveBeenCalledWith("ordemServico");
    expect(queryBuilder.getMany).toHaveBeenCalled();
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      "ordemServico.abertura_em",
      "DESC"
    );
  });

  test("falha ao buscar ordem inexistente por id", async () => {
    ordemRepo.findOne.mockResolvedValue(null);

    await expect(ordemServicoService.getById("os-404")).rejects.toThrow(
      "Ordem de serviço não encontrada"
    );
  });

  test("cria ordem de serviço com número baseado em sequence", async () => {
    equipamentoRepo.findOne.mockResolvedValue({
      id: 1,
      codigo: "EQ-1",
      nome: "Servidor",
      ativo: true,
    });
    usuarioRepo.findOne.mockResolvedValue({
      id: "sol-1",
      nome: "Solicitante",
      perfil: Perfil.SOLICITANTE,
      ativo: true,
    });
    mockManager.query.mockResolvedValue([{ value: "1" }]);
    ordemRepo.create.mockImplementation((data) => ({ ...data }));
    ordemRepo.save.mockImplementation(async (data) => ({
      id: "os-1",
      abertura_em: new Date(),
      ...data,
    }));
    ordemRepo.findOne.mockResolvedValue({
      id: "os-1",
      numero: "OS-0001",
      equipamento: { id: 1 },
      solicitante: { id: "sol-1" },
      tecnico: null,
      status: StatusOs.ABERTA,
    });

    const result = await ordemServicoService.createOrdemServico({
      equipamentoId: 1,
      solicitanteId: "sol-1",
      tipo_manutencao: TipoManutencao.CORRETIVA,
      prioridade: Prioridade.ALTA,
      descricao_falha: "Parou de responder",
    });

    expect(mockManager.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("SELECT setval(")
    );
    expect(mockManager.query).toHaveBeenNthCalledWith(
      2,
      `SELECT nextval('ordem_servico_numero_seq')::bigint AS value`
    );
    expect(result.numero).toBe("OS-0001");
    expect(historicoService.registrarHistorico).toHaveBeenCalled();
  });

  test("falha ao criar OS com equipamento inativo ou inexistente", async () => {
    equipamentoRepo.findOne.mockResolvedValue(null);

    await expect(
      ordemServicoService.createOrdemServico({
        equipamentoId: 999,
        solicitanteId: "sol-1",
        tipo_manutencao: TipoManutencao.CORRETIVA,
        prioridade: Prioridade.ALTA,
        descricao_falha: "Falha",
      })
    ).rejects.toThrow("Equipamento não encontrado");
  });

  test("falha ao criar OS com solicitante inexistente ou inativo", async () => {
    equipamentoRepo.findOne.mockResolvedValue({
      id: 1,
      codigo: "EQ-1",
      nome: "Servidor",
      ativo: true,
    });
    usuarioRepo.findOne.mockResolvedValue(null);

    await expect(
      ordemServicoService.createOrdemServico({
        equipamentoId: 1,
        solicitanteId: "sol-404",
        tipo_manutencao: TipoManutencao.CORRETIVA,
        prioridade: Prioridade.ALTA,
        descricao_falha: "Falha",
      })
    ).rejects.toThrow("Solicitante não encontrado");
  });

  test("atribui técnico sem iniciar automaticamente", async () => {
    ordemRepo.findOne
      .mockResolvedValueOnce({
        id: "os-1",
        status: StatusOs.ABERTA,
        tecnico: null,
        equipamento: { id: 1 },
        solicitante: { id: "sol-1" },
      })
      .mockResolvedValueOnce({
        id: "os-1",
        status: StatusOs.ABERTA,
        tecnico: { id: "tec-1", nome: "Tecnico" },
        equipamento: { id: 1 },
        solicitante: { id: "sol-1" },
      });
    usuarioRepo.findOne.mockResolvedValue({
      id: "tec-1",
      nome: "Tecnico",
      perfil: Perfil.TECNICO,
      ativo: true,
    });
    ordemRepo.save.mockImplementation(async (data) => data);

    const result = await ordemServicoService.atribuirTecnico(
      "os-1",
      { tecnicoId: "tec-1" },
      "sup-1"
    );

    expect(result.status).toBe(StatusOs.ABERTA);
    expect(ordemRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        tecnico: expect.objectContaining({ id: "tec-1" }),
        status: StatusOs.ABERTA,
      })
    );
  });

  test("falha ao atribuir técnico para OS inexistente", async () => {
    ordemRepo.findOne.mockResolvedValue(null);

    await expect(
      ordemServicoService.atribuirTecnico("os-404", { tecnicoId: "tec-1" }, "sup-1")
    ).rejects.toThrow("Ordem de serviço não encontrada");
  });

  test("atribui técnico sem trocar status quando a OS não está aberta", async () => {
    ordemRepo.findOne
      .mockResolvedValueOnce({
        id: "os-1",
        status: StatusOs.AGUARDANDO_PECA,
        tecnico: null,
        equipamento: { id: 1 },
        solicitante: { id: "sol-1" },
      })
      .mockResolvedValueOnce({
        id: "os-1",
        status: StatusOs.AGUARDANDO_PECA,
        tecnico: { id: "tec-1", nome: "Tecnico" },
        equipamento: { id: 1 },
        solicitante: { id: "sol-1" },
      });
    usuarioRepo.findOne.mockResolvedValue({
      id: "tec-1",
      nome: "Tecnico",
      perfil: Perfil.TECNICO,
      ativo: true,
    });
    ordemRepo.save.mockImplementation(async (data) => data);

    const result = await ordemServicoService.atribuirTecnico(
      "os-1",
      { tecnicoId: "tec-1" },
      "sup-1"
    );

    expect(result.status).toBe(StatusOs.AGUARDANDO_PECA);
  });

  test("falha ao atribuir técnico inexistente", async () => {
    ordemRepo.findOne.mockResolvedValue({
      id: "os-1",
      status: StatusOs.ABERTA,
      tecnico: null,
      equipamento: { id: 1 },
      solicitante: { id: "sol-1" },
    });
    usuarioRepo.findOne.mockResolvedValue(null);

    await expect(
      ordemServicoService.atribuirTecnico("os-1", { tecnicoId: "tec-404" }, "sup-1")
    ).rejects.toThrow("Técnico não encontrado");
  });

  test("falha ao atribuir usuário que não é técnico", async () => {
    ordemRepo.findOne.mockResolvedValue({
      id: "os-1",
      status: StatusOs.ABERTA,
      tecnico: null,
      equipamento: { id: 1 },
      solicitante: { id: "sol-1" },
    });
    usuarioRepo.findOne.mockResolvedValue({
      id: "user-1",
      nome: "Supervisor",
      perfil: Perfil.SUPERVISOR,
      ativo: true,
    });

    await expect(
      ordemServicoService.atribuirTecnico("os-1", { tecnicoId: "user-1" }, "sup-1")
    ).rejects.toThrow("O usuário informado não é um técnico");
  });

  test("bloqueia transição inválida sem técnico", async () => {
    ordemRepo.findOne.mockResolvedValue({
      id: "os-1",
      status: StatusOs.ABERTA,
      tecnico: null,
      equipamento: { id: 1 },
      solicitante: { id: "sol-1" },
    });

    await expect(
      ordemServicoService.atualizarStatus(
        "os-1",
        { status: StatusOs.EM_ANDAMENTO },
        "sup-1",
        Perfil.SUPERVISOR
      )
    ).rejects.toThrow("Não é possível iniciar uma OS sem técnico atribuído");
  });

  test("não altera nada quando o status informado é o mesmo", async () => {
    ordemRepo.findOne
      .mockResolvedValueOnce({
        id: "os-1",
        status: StatusOs.EM_ANDAMENTO,
        tecnico: { id: "tec-1" },
        equipamento: { id: 1 },
        solicitante: { id: "sol-1" },
        inicio_em: new Date(),
        abertura_em: new Date(),
        prioridade: Prioridade.ALTA,
      })
      .mockResolvedValueOnce({
        id: "os-1",
        status: StatusOs.EM_ANDAMENTO,
        tecnico: { id: "tec-1" },
        equipamento: { id: 1 },
        solicitante: { id: "sol-1" },
        inicio_em: new Date(),
      });
    ordemRepo.save.mockImplementation(async (data) => data);

    const result = await ordemServicoService.atualizarStatus(
      "os-1",
      { status: StatusOs.EM_ANDAMENTO, observacao: "Peça já disponível" },
      "tec-1",
      Perfil.TECNICO
    );

    expect(result.status).toBe(StatusOs.EM_ANDAMENTO);
  });

  test("bloqueia alteração de OS concluída", async () => {
    ordemRepo.findOne.mockResolvedValue({
      id: "os-1",
      status: StatusOs.CONCLUIDA,
      tecnico: { id: "tec-1" },
      equipamento: { id: 1 },
      solicitante: { id: "sol-1" },
    });

    await expect(
      ordemServicoService.atualizarStatus("os-1", { status: StatusOs.EM_ANDAMENTO }, "tec-1", Perfil.TECNICO)
    ).rejects.toThrow("Não é possível alterar uma OS concluída");
  });

  test("bloqueia alteração de OS cancelada", async () => {
    ordemRepo.findOne.mockResolvedValue({
      id: "os-1",
      status: StatusOs.CANCELADA,
      tecnico: { id: "tec-1" },
      equipamento: { id: 1 },
      solicitante: { id: "sol-1" },
    });

    await expect(
      ordemServicoService.atualizarStatus("os-1", { status: StatusOs.EM_ANDAMENTO }, "tec-1", Perfil.TECNICO)
    ).rejects.toThrow("Não é possível alterar uma OS cancelada");
  });

  test("bloqueia transição inválida para OS aberta", async () => {
    ordemRepo.findOne.mockResolvedValue({
      id: "os-1",
      status: StatusOs.ABERTA,
      tecnico: { id: "tec-1" },
      equipamento: { id: 1 },
      solicitante: { id: "sol-1" },
    });

    await expect(
      ordemServicoService.atualizarStatus("os-1", { status: StatusOs.AGUARDANDO_PECA }, "tec-1", Perfil.TECNICO)
    ).rejects.toThrow("Transição de status inválida para OS aberta");
  });

  test("bloqueia transição inválida para OS em andamento", async () => {
    ordemRepo.findOne.mockResolvedValue({
      id: "os-1",
      status: StatusOs.EM_ANDAMENTO,
      tecnico: { id: "tec-1" },
      equipamento: { id: 1 },
      solicitante: { id: "sol-1" },
    });

    await expect(
      ordemServicoService.atualizarStatus("os-1", { status: StatusOs.ABERTA }, "tec-1", Perfil.TECNICO)
    ).rejects.toThrow("Transição de status inválida para OS em andamento");
  });

  test("bloqueia transição inválida para OS aguardando peça", async () => {
    ordemRepo.findOne.mockResolvedValue({
      id: "os-1",
      status: StatusOs.AGUARDANDO_PECA,
      tecnico: { id: "tec-1" },
      equipamento: { id: 1 },
      solicitante: { id: "sol-1" },
    });

    await expect(
      ordemServicoService.atualizarStatus("os-1", { status: StatusOs.ABERTA }, "tec-1", Perfil.TECNICO)
    ).rejects.toThrow("Transição de status inválida para OS aguardando peça");
  });

  test("bloqueia cancelamento por técnico", async () => {
    ordemRepo.findOne.mockResolvedValue({
      id: "os-1",
      status: StatusOs.EM_ANDAMENTO,
      tecnico: { id: "tec-1" },
      equipamento: { id: 1 },
      solicitante: { id: "sol-1" },
    });

    await expect(
      ordemServicoService.atualizarStatus(
        "os-1",
        { status: StatusOs.CANCELADA },
        "tec-1",
        Perfil.TECNICO
      )
    ).rejects.toThrow("Apenas o supervisor pode cancelar uma OS");
  });

  test("define inicio_em ao mover para EM_ANDAMENTO pela primeira vez", async () => {
    ordemRepo.findOne
      .mockResolvedValueOnce({
        id: "os-1",
        status: StatusOs.AGUARDANDO_PECA,
        tecnico: { id: "tec-1" },
        equipamento: { id: 1 },
        solicitante: { id: "sol-1" },
        inicio_em: null,
        abertura_em: new Date(),
        prioridade: Prioridade.MEDIA,
      })
      .mockResolvedValueOnce({
        id: "os-1",
        status: StatusOs.EM_ANDAMENTO,
        tecnico: { id: "tec-1" },
        equipamento: { id: 1 },
        solicitante: { id: "sol-1" },
        inicio_em: new Date(),
        abertura_em: new Date(),
        prioridade: Prioridade.MEDIA,
      });
    ordemRepo.save.mockImplementation(async (data) => data);

    const result = await ordemServicoService.atualizarStatus(
      "os-1",
      { status: StatusOs.EM_ANDAMENTO },
      "tec-1",
      Perfil.TECNICO
    );

    expect(result.status).toBe(StatusOs.EM_ANDAMENTO);
  });

  test("conclui ordem com transação e histórico", async () => {
    ordemRepo.findOne
      .mockResolvedValueOnce({
        id: "os-1",
        status: StatusOs.EM_ANDAMENTO,
        tecnico: { id: "tec-1" },
        equipamento: { id: 1 },
        solicitante: { id: "sol-1" },
        inicio_em: new Date(),
      })
      .mockResolvedValueOnce({
        id: "os-1",
        status: StatusOs.CONCLUIDA,
        tecnico: { id: "tec-1" },
        equipamento: { id: 1 },
        solicitante: { id: "sol-1" },
        descricao_servico: "Troca de placa",
        horas_trabalhadas: 3,
        abertura_em: new Date(),
        prioridade: Prioridade.ALTA,
      });
    ordemRepo.save.mockImplementation(async (data) => data);

    const result = await ordemServicoService.concluirOrdemServico(
      "os-1",
      {
        descricao_servico: "Troca de placa",
      },
      "tec-1",
      Perfil.TECNICO
    );

    expect(result.status).toBe(StatusOs.CONCLUIDA);
    expect(ordemRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status_prazo: StatusPrazoOS.CONCLUIDA_NO_PRAZO,
      })
    );
    expect(historicoService.registrarHistorico).toHaveBeenCalledWith(
      "os-1",
      "tec-1",
      StatusOs.EM_ANDAMENTO,
      StatusOs.CONCLUIDA,
      "Ordem de serviço concluída",
      mockManager
    );
  });

  test("mantém prazo estourado quando OS atrasada é concluída", async () => {
    const aberturaEm = new Date(Date.now() - 10 * 60 * 60 * 1000);

    ordemRepo.findOne
      .mockResolvedValueOnce({
        id: "os-1",
        status: StatusOs.EM_ANDAMENTO,
        tecnico: { id: "tec-1" },
        equipamento: { id: 1 },
        solicitante: { id: "sol-1" },
        inicio_em: new Date(),
        abertura_em: aberturaEm,
        prioridade: Prioridade.ALTA,
      })
      .mockResolvedValueOnce({
        id: "os-1",
        status: StatusOs.CONCLUIDA,
        status_prazo: StatusPrazoOS.CONCLUIDA_COM_PRAZO_ESTOURADO,
        tecnico: { id: "tec-1" },
        equipamento: { id: 1 },
        solicitante: { id: "sol-1" },
        inicio_em: new Date(),
        abertura_em: aberturaEm,
        prioridade: Prioridade.ALTA,
      });
    ordemRepo.save.mockImplementation(async (data) => data);

    const result = await ordemServicoService.concluirOrdemServico(
      "os-1",
      { descricao_servico: "Teste atraso" },
      "tec-1",
      Perfil.TECNICO
    );

    expect(result.status).toBe(StatusOs.CONCLUIDA);
    expect(ordemRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status_prazo: StatusPrazoOS.CONCLUIDA_COM_PRAZO_ESTOURADO,
      })
    );
  });

  test("bloqueia conclusão sem técnico", async () => {
    ordemRepo.findOne.mockResolvedValue({
      id: "os-1",
      status: StatusOs.EM_ANDAMENTO,
      tecnico: null,
      equipamento: { id: 1 },
      solicitante: { id: "sol-1" },
    });

    await expect(
      ordemServicoService.concluirOrdemServico(
        "os-1",
        { descricao_servico: "Teste" },
        "tec-1",
        Perfil.TECNICO
      )
    ).rejects.toThrow("Não é possível concluir uma OS sem técnico atribuído");
  });

  test("bloqueia conclusão de OS cancelada", async () => {
    ordemRepo.findOne.mockResolvedValue({
      id: "os-1",
      status: StatusOs.CANCELADA,
      tecnico: { id: "tec-1" },
      equipamento: { id: 1 },
      solicitante: { id: "sol-1" },
    });

    await expect(
      ordemServicoService.concluirOrdemServico(
        "os-1",
        { descricao_servico: "Teste" },
        "tec-1",
        Perfil.TECNICO
      )
    ).rejects.toThrow("Não é possível concluir uma OS cancelada");
  });

  test("bloqueia conclusão sem descrição", async () => {
    ordemRepo.findOne.mockResolvedValue({
      id: "os-1",
      status: StatusOs.EM_ANDAMENTO,
      tecnico: { id: "tec-1" },
      equipamento: { id: 1 },
      solicitante: { id: "sol-1" },
    });

    await expect(
      ordemServicoService.concluirOrdemServico(
        "os-1",
        { descricao_servico: "" },
        "tec-1",
        Perfil.TECNICO
      )
    ).rejects.toThrow("Descrição do serviço é obrigatória");
  });

  test("preenche inicio_em na conclusão quando ainda não existe", async () => {
    ordemRepo.findOne
      .mockResolvedValueOnce({
        id: "os-1",
        status: StatusOs.EM_ANDAMENTO,
        tecnico: { id: "tec-1" },
        equipamento: { id: 1 },
        solicitante: { id: "sol-1" },
        inicio_em: null,
      })
      .mockResolvedValueOnce({
        id: "os-1",
        status: StatusOs.CONCLUIDA,
        tecnico: { id: "tec-1" },
        equipamento: { id: 1 },
        solicitante: { id: "sol-1" },
        inicio_em: new Date(),
      });
    ordemRepo.save.mockImplementation(async (data) => data);

    const result = await ordemServicoService.concluirOrdemServico(
      "os-1",
      { descricao_servico: "Teste" },
      "tec-1",
      Perfil.TECNICO
    );

    expect(result.status).toBe(StatusOs.CONCLUIDA);
  });

  test("permite técnico assumir OS aberta para si", async () => {
    ordemRepo.findOne
      .mockResolvedValueOnce({
        id: "os-1",
        status: StatusOs.ABERTA,
        tecnico: null,
        equipamento: { id: 1 },
        solicitante: { id: "sol-1" },
      })
      .mockResolvedValueOnce({
        id: "os-1",
        status: StatusOs.ABERTA,
        tecnico: { id: "tec-1", nome: "Tecnico" },
        equipamento: { id: 1 },
        solicitante: { id: "sol-1" },
      });
    usuarioRepo.findOne.mockResolvedValue({
      id: "tec-1",
      nome: "Tecnico",
      perfil: Perfil.TECNICO,
      ativo: true,
    });
    ordemRepo.save.mockImplementation(async (data) => data);

    const result = await ordemServicoService.autoAtribuir("os-1", "tec-1");

    expect(result.tecnico).toEqual(expect.objectContaining({ id: "tec-1" }));
    expect(historicoService.registrarHistorico).toHaveBeenCalled();
  });

  test("inicia OS aberta com técnico atribuído", async () => {
    ordemRepo.findOne
      .mockResolvedValueOnce({
        id: "os-1",
        status: StatusOs.ABERTA,
        tecnico: { id: "tec-1" },
        equipamento: { id: 1 },
        solicitante: { id: "sol-1" },
        inicio_em: null,
      })
      .mockResolvedValueOnce({
        id: "os-1",
        status: StatusOs.EM_ANDAMENTO,
        tecnico: { id: "tec-1" },
        equipamento: { id: 1 },
        solicitante: { id: "sol-1" },
        inicio_em: new Date(),
      });
    ordemRepo.save.mockImplementation(async (data) => data);

    const result = await ordemServicoService.iniciarOrdemServico(
      "os-1",
      "tec-1",
      Perfil.TECNICO
    );

    expect(result.status).toBe(StatusOs.EM_ANDAMENTO);
  });
});
