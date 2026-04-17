import { IsNull, type DataSource, type EntityManager, type Repository } from "typeorm";
import { AppError } from "../errors/AppError.js";
import { ApontamentoOS } from "../entities/ApontamentoOS.js";
import { OrdemServico } from "../entities/OrdemServico.js";
import { Perfil } from "../types/usr_perfil.js";
import { StatusOs } from "../types/os_status.js";
import { HistoricoOSService } from "./HistoricoOSService.js";

type ObservacaoDTO = {
  observacao?: string | null;
};

export class ApontamentoOSService {
  private apontamentoRepo: Repository<ApontamentoOS>;
  private ordemServicoRepo: Repository<OrdemServico>;
  private historicoService: HistoricoOSService;

  constructor(appDataSource: DataSource, historicoService?: HistoricoOSService) {
    this.apontamentoRepo = appDataSource.getRepository(ApontamentoOS);
    this.ordemServicoRepo = appDataSource.getRepository(OrdemServico);
    this.historicoService =
      historicoService ?? new HistoricoOSService(appDataSource);
  }

  async listByOs(osId: string): Promise<ApontamentoOS[]> {
    return this.apontamentoRepo.find({
      where: { osId },
      relations: ["tecnico"],
      order: { inicioEm: "ASC" },
    });
  }

  async iniciar(
    osId: string,
    usuarioId: string,
    usuarioPerfil: Perfil,
    data: ObservacaoDTO
  ): Promise<ApontamentoOS[]> {
    await this.apontamentoRepo.manager.transaction(async (manager) => {
      const ordemServico = await this.getOrdemByIdOrFail(osId, manager);
      this.assertTecnicoResponsavel(ordemServico, usuarioId, usuarioPerfil);

      if (ordemServico.status !== StatusOs.EM_ANDAMENTO) {
        throw new AppError("Apontamentos só podem ser iniciados com a OS em andamento");
      }

      const apontamentoAberto = await manager.getRepository(ApontamentoOS).findOne({
        where: { osId, fimEm: IsNull() },
      });

      if (apontamentoAberto) {
        throw new AppError("Já existe um apontamento de trabalho em aberto para esta OS");
      }

      const apontamento = manager.getRepository(ApontamentoOS).create({
        osId,
        tecnicoId: usuarioId,
        ordemServico,
        tecnico: ordemServico.tecnico!,
        inicioEm: new Date(),
        fimEm: null,
        observacao: data.observacao?.trim() || null,
      });

      await manager.getRepository(ApontamentoOS).save(apontamento);
      await this.historicoService.registrarHistorico(
        osId,
        usuarioId,
        ordemServico.status,
        ordemServico.status,
        data.observacao?.trim() || "Apontamento de trabalho iniciado",
        manager
      );
    });

    return this.listByOs(osId);
  }

  async finalizar(
    osId: string,
    usuarioId: string,
    usuarioPerfil: Perfil,
    data: ObservacaoDTO
  ): Promise<ApontamentoOS[]> {
    await this.apontamentoRepo.manager.transaction(async (manager) => {
      const ordemServico = await this.getOrdemByIdOrFail(osId, manager);
      this.assertTecnicoResponsavel(ordemServico, usuarioId, usuarioPerfil);

      const apontamentoAberto = await manager.getRepository(ApontamentoOS).findOne({
        where: { osId, tecnicoId: usuarioId, fimEm: IsNull() },
      });

      if (!apontamentoAberto) {
        throw new AppError("Não existe apontamento de trabalho em aberto para esta OS");
      }

      apontamentoAberto.fimEm = new Date();
      if (data.observacao?.trim()) {
        apontamentoAberto.observacao = apontamentoAberto.observacao
          ? `${apontamentoAberto.observacao}\nEncerramento: ${data.observacao.trim()}`
          : `Encerramento: ${data.observacao.trim()}`;
      }

      await manager.getRepository(ApontamentoOS).save(apontamentoAberto);
      await this.historicoService.registrarHistorico(
        osId,
        usuarioId,
        ordemServico.status,
        ordemServico.status,
        data.observacao?.trim() || "Apontamento de trabalho finalizado",
        manager
      );
    });

    return this.listByOs(osId);
  }

  async getResumo(osId: string): Promise<{
    total_trabalhado_minutos: number;
    total_trabalhado_formatado: string;
    apontamento_aberto: boolean;
  }> {
    const apontamentos = await this.listByOs(osId);
    const totalMinutos = apontamentos.reduce((acc, apontamento) => {
      if (!apontamento.fimEm) {
        return acc;
      }

      const diffMinutos = Math.max(
        0,
        Math.round(
          (apontamento.fimEm.getTime() - apontamento.inicioEm.getTime()) / (1000 * 60)
        )
      );

      return acc + diffMinutos;
    }, 0);

    return {
      total_trabalhado_minutos: totalMinutos,
      total_trabalhado_formatado: `${Math.floor(totalMinutos / 60)}h ${String(
        totalMinutos % 60
      ).padStart(2, "0")}min`,
      apontamento_aberto: apontamentos.some((apontamento) => !apontamento.fimEm),
    };
  }

  async hasOpenByTecnico(tecnicoId: string): Promise<boolean> {
    const apontamentoAberto = await this.apontamentoRepo.findOne({
      where: { tecnicoId, fimEm: IsNull() },
    });

    return !!apontamentoAberto;
  }

  async assertSemApontamentoAberto(osId: string, manager?: EntityManager): Promise<void> {
    return this.assertSemApontamentoAbertoComMensagem(
      osId,
      "Finalize o apontamento de trabalho em aberto antes de concluir a OS",
      manager
    );
  }

  async assertSemApontamentoAbertoParaTransferencia(
    osId: string,
    manager?: EntityManager
  ): Promise<void> {
    return this.assertSemApontamentoAbertoComMensagem(
      osId,
      "Finalize o apontamento de trabalho em aberto antes de transferir a OS para outro técnico",
      manager
    );
  }

  private async assertSemApontamentoAbertoComMensagem(
    osId: string,
    mensagem: string,
    manager?: EntityManager
  ): Promise<void> {
    const repo = manager?.getRepository(ApontamentoOS) ?? this.apontamentoRepo;
    const apontamentoAberto = await repo.findOne({
      where: { osId, fimEm: IsNull() },
    });

    if (apontamentoAberto) {
      throw new AppError(mensagem);
    }
  }

  private async getOrdemByIdOrFail(id: string, manager: EntityManager): Promise<OrdemServico> {
    const ordemServico = await manager.getRepository(OrdemServico).findOne({
      where: { id },
      relations: ["tecnico"],
    });

    if (!ordemServico) {
      throw new AppError("Ordem de serviço não encontrada");
    }

    return ordemServico;
  }

  private assertTecnicoResponsavel(
    ordemServico: OrdemServico,
    usuarioId: string,
    usuarioPerfil: Perfil
  ) {
    if (usuarioPerfil !== Perfil.TECNICO) {
      throw new AppError("Apenas o técnico responsável pode registrar apontamentos", 403);
    }

    if (!ordemServico.tecnico || ordemServico.tecnico.id !== usuarioId) {
      throw new AppError("Apenas o técnico responsável pode registrar apontamentos", 403);
    }
  }
}
