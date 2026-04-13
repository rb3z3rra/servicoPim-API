import { jest } from "@jest/globals";
import { HistoricoOSService } from "../../src/services/HistoricoOSService.js";
import { HistoricoOS } from "../../src/entities/HistoricoOS.js";
import { OrdemServico } from "../../src/entities/OrdemServico.js";
import { Usuario } from "../../src/entities/Usuario.js";
import { appDataSource } from "../../src/database/appDataSource.js";

const historicoRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const ordemServicoRepo = {
  findOne: jest.fn(),
};

const usuarioRepo = {
  findOne: jest.fn(),
};

const manager = {
  getRepository: jest.fn((entity) => {
    if (entity === HistoricoOS) return historicoRepo;
    if (entity === OrdemServico) return ordemServicoRepo;
    if (entity === Usuario) return usuarioRepo;
    return undefined;
  }),
};

const dataSource = {
  getRepository: jest.fn((entity) => {
    if (entity === HistoricoOS) return historicoRepo;
    if (entity === OrdemServico) return ordemServicoRepo;
    if (entity === Usuario) return usuarioRepo;
    return undefined;
  }),
};

let service: HistoricoOSService;

beforeAll(() => {
  service = new HistoricoOSService(dataSource as never);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("HistoricoOSService", () => {
  test("usa o datasource padrão quando nenhum é informado", async () => {
    const spy = jest
      .spyOn(appDataSource, "getRepository")
      .mockImplementation((entity: never) => {
        if (entity === HistoricoOS) return historicoRepo as never;
        if (entity === OrdemServico) return ordemServicoRepo as never;
        if (entity === Usuario) return usuarioRepo as never;
        return undefined as never;
      });

    const defaultService = new HistoricoOSService();

    historicoRepo.find.mockResolvedValue([]);
    await defaultService.getAll();

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test("registra histórico com sucesso usando repositories padrão", async () => {
    ordemServicoRepo.findOne.mockResolvedValue({ id: "os-1" });
    usuarioRepo.findOne.mockResolvedValue({ id: "user-1" });
    historicoRepo.create.mockImplementation((data) => ({ ...data }));
    historicoRepo.save.mockImplementation(async (data) => ({ id: "hist-1", ...data }));

    const result = await service.registrarHistorico(
      "os-1",
      "user-1",
      null,
      "ABERTA",
      "Criada"
    );

    expect(result.id).toBe("hist-1");
    expect(historicoRepo.save).toHaveBeenCalled();
  });

  test("registra histórico com manager quando fornecido", async () => {
    ordemServicoRepo.findOne.mockResolvedValue({ id: "os-1" });
    usuarioRepo.findOne.mockResolvedValue({ id: "user-1" });
    historicoRepo.create.mockImplementation((data) => ({ ...data }));
    historicoRepo.save.mockImplementation(async (data) => ({ id: "hist-2", ...data }));

    const result = await service.registrarHistorico(
      "os-1",
      "user-1",
      "ABERTA",
      "EM_ANDAMENTO",
      undefined,
      manager as never
    );

    expect(result.id).toBe("hist-2");
    expect(manager.getRepository).toHaveBeenCalled();
  });

  test("falha ao registrar histórico com OS inexistente", async () => {
    ordemServicoRepo.findOne.mockResolvedValue(null);

    await expect(
      service.registrarHistorico("os-404", "user-1", null, "ABERTA")
    ).rejects.toThrow("Ordem de serviço não encontrada");
  });

  test("falha ao registrar histórico com usuário inexistente", async () => {
    ordemServicoRepo.findOne.mockResolvedValue({ id: "os-1" });
    usuarioRepo.findOne.mockResolvedValue(null);

    await expect(
      service.registrarHistorico("os-1", "user-404", null, "ABERTA")
    ).rejects.toThrow("Usuário não encontrado");
  });

  test("lista todos os históricos", async () => {
    historicoRepo.find.mockResolvedValue([{ id: "hist-1" }]);

    const result = await service.getAll();

    expect(result).toEqual([{ id: "hist-1" }]);
  });

  test("busca histórico por id", async () => {
    historicoRepo.findOne.mockResolvedValue({ id: "hist-1" });

    const result = await service.getById("hist-1");

    expect(result.id).toBe("hist-1");
  });

  test("falha ao buscar histórico inexistente", async () => {
    historicoRepo.findOne.mockResolvedValue(null);

    await expect(service.getById("hist-404")).rejects.toThrow("Histórico não encontrado");
  });

  test("lista histórico por OS", async () => {
    historicoRepo.find.mockResolvedValue([{ id: "hist-os-1" }]);

    const result = await service.getByOsId("os-1");

    expect(result).toEqual([{ id: "hist-os-1" }]);
  });

  test("lista histórico por usuário", async () => {
    historicoRepo.find.mockResolvedValue([{ id: "hist-user-1" }]);

    const result = await service.getByUsuario("user-1");

    expect(result).toEqual([{ id: "hist-user-1" }]);
  });
});
