import type { DataSource, Repository } from "typeorm";
import { ConfiguracaoPrazoAtendimento } from "../entities/ConfiguracaoPrazoAtendimento.js";
import { Usuario } from "../entities/Usuario.js";
import { AppError } from "../errors/AppError.js";
import { Prioridade } from "../types/os_prioridade.js";

const PRAZO_ATENDIMENTO_PADRAO: Record<Prioridade, number> = {
  [Prioridade.BAIXA]: 72,
  [Prioridade.MEDIA]: 24,
  [Prioridade.ALTA]: 8,
  [Prioridade.CRITICA]: 4,
};

type AtualizarPrazoAtendimentoDTO = {
  horas_limite: number;
  ativo?: boolean;
};

export class ConfiguracaoPrazoAtendimentoService {
  private configuracaoPrazoAtendimentoRepo: Repository<ConfiguracaoPrazoAtendimento>;
  private usuarioRepo: Repository<Usuario>;

  constructor(appDataSource: DataSource) {
    this.configuracaoPrazoAtendimentoRepo = appDataSource.getRepository(ConfiguracaoPrazoAtendimento);
    this.usuarioRepo = appDataSource.getRepository(Usuario);
  }

  async getAll(): Promise<ConfiguracaoPrazoAtendimento[]> {
    await this.ensureDefaults();

    return this.configuracaoPrazoAtendimentoRepo.find({
      relations: ["atualizadoPor"],
      order: { horas_limite: "ASC" },
    });
  }

  async getMapaHoras(): Promise<Record<Prioridade, number>> {
    await this.ensureDefaults();
    const configuracoes = await this.configuracaoPrazoAtendimentoRepo.find({
      where: { ativo: true },
    });

    return configuracoes.reduce(
      (acc, configuracao) => {
        acc[configuracao.prioridade] = configuracao.horas_limite;
        return acc;
      },
      { ...PRAZO_ATENDIMENTO_PADRAO }
    );
  }

  async update(
    prioridade: Prioridade,
    data: AtualizarPrazoAtendimentoDTO,
    usuarioId: string
  ): Promise<ConfiguracaoPrazoAtendimento> {
    await this.ensureDefaults();

    const usuario = await this.usuarioRepo.findOne({
      where: { id: usuarioId, ativo: true },
    });

    if (!usuario) {
      throw new AppError("Usuário responsável não encontrado", 404);
    }

    const configuracao = await this.configuracaoPrazoAtendimentoRepo.findOne({
      where: { prioridade },
      relations: ["atualizadoPor"],
    });

    if (!configuracao) {
      throw new AppError("Configuração de prazo de atendimento não encontrada", 404);
    }

    configuracao.horas_limite = data.horas_limite;
    configuracao.ativo = data.ativo ?? configuracao.ativo;
    configuracao.atualizadoPor = usuario;

    return this.configuracaoPrazoAtendimentoRepo.save(configuracao);
  }

  private async ensureDefaults(): Promise<void> {
    for (const [prioridade, horasLimite] of Object.entries(PRAZO_ATENDIMENTO_PADRAO) as Array<[Prioridade, number]>) {
      const exists = await this.configuracaoPrazoAtendimentoRepo.findOne({
        where: { prioridade },
      });

      if (!exists) {
        await this.configuracaoPrazoAtendimentoRepo.save(
          this.configuracaoPrazoAtendimentoRepo.create({
            prioridade,
            horas_limite: horasLimite,
            ativo: true,
            atualizadoPor: null,
          })
        );
      }
    }
  }
}
