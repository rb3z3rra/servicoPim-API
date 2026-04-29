import { jest } from "@jest/globals";
import { ConfiguracaoPrazoAtendimento } from "../../src/entities/ConfiguracaoPrazoAtendimento.js";
import { Usuario } from "../../src/entities/Usuario.js";
import { ConfiguracaoPrazoAtendimentoService } from "../../src/services/ConfiguracaoPrazoAtendimentoService.js";
import { Prioridade } from "../../src/types/os_prioridade.js";

const configuracaoPrazoAtendimentoRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const usuarioRepo = {
  findOne: jest.fn(),
};

const mockDataSource = {
  getRepository: jest.fn((entity) => {
    if (entity === ConfiguracaoPrazoAtendimento) {
      return configuracaoPrazoAtendimentoRepo;
    }

    if (entity === Usuario) {
      return usuarioRepo;
    }

    return undefined;
  }),
};

let service: ConfiguracaoPrazoAtendimentoService;

beforeAll(() => {
  service = new ConfiguracaoPrazoAtendimentoService(mockDataSource as never);
});

beforeEach(() => {
  jest.clearAllMocks();
  configuracaoPrazoAtendimentoRepo.create.mockImplementation((data) => data);
  configuracaoPrazoAtendimentoRepo.save.mockImplementation(async (data) => data);
});

describe("ConfiguracaoPrazoAtendimentoService", () => {
  test("lista configurações criando defaults quando ausentes", async () => {
    configuracaoPrazoAtendimentoRepo.findOne.mockResolvedValue(null);
    configuracaoPrazoAtendimentoRepo.find.mockResolvedValue([
      { prioridade: Prioridade.CRITICA, horas_limite: 4 },
      { prioridade: Prioridade.ALTA, horas_limite: 8 },
    ]);

    const result = await service.getAll();

    expect(configuracaoPrazoAtendimentoRepo.save).toHaveBeenCalledTimes(4);
    expect(result).toHaveLength(2);
    expect(configuracaoPrazoAtendimentoRepo.find).toHaveBeenCalledWith({
      relations: ["atualizadoPor"],
      order: { horas_limite: "ASC" },
    });
  });

  test("retorna mapa de horas com valores configurados e fallback padrão", async () => {
    configuracaoPrazoAtendimentoRepo.findOne.mockResolvedValue({ id: "prazo-1" });
    configuracaoPrazoAtendimentoRepo.find.mockResolvedValue([
      { prioridade: Prioridade.ALTA, horas_limite: 10, ativo: true },
    ]);

    const result = await service.getMapaHoras();

    expect(result[Prioridade.ALTA]).toBe(10);
    expect(result[Prioridade.CRITICA]).toBe(4);
    expect(result[Prioridade.MEDIA]).toBe(24);
    expect(result[Prioridade.BAIXA]).toBe(72);
  });

  test("atualiza prazo de atendimento registrando usuário responsável", async () => {
    const gestor = { id: "gestor-1", ativo: true };
    const configuracao = {
      id: "prazo-1",
      prioridade: Prioridade.ALTA,
      horas_limite: 8,
      ativo: true,
      atualizadoPor: null,
    };

    configuracaoPrazoAtendimentoRepo.findOne
      .mockResolvedValueOnce({ id: "existing" })
      .mockResolvedValueOnce({ id: "existing" })
      .mockResolvedValueOnce({ id: "existing" })
      .mockResolvedValueOnce({ id: "existing" })
      .mockResolvedValueOnce(configuracao);
    usuarioRepo.findOne.mockResolvedValue(gestor);

    const result = await service.update(Prioridade.ALTA, { horas_limite: 12 }, "gestor-1");

    expect(result).toEqual(
      expect.objectContaining({
        prioridade: Prioridade.ALTA,
        horas_limite: 12,
        atualizadoPor: gestor,
      })
    );
  });

  test("falha ao atualizar quando gestor não existe", async () => {
    configuracaoPrazoAtendimentoRepo.findOne.mockResolvedValue({ id: "existing" });
    usuarioRepo.findOne.mockResolvedValue(null);

    await expect(
      service.update(Prioridade.ALTA, { horas_limite: 12 }, "gestor-inexistente")
    ).rejects.toThrow("Usuário responsável não encontrado");
  });
});
