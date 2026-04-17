import "reflect-metadata";
import { appDataSource } from "../database/appDataSource.js";
import { Usuario } from "../entities/Usuario.js";
import { Equipamento } from "../entities/Equipamento.js";
import { OrdemServico } from "../entities/OrdemServico.js";
import { HistoricoOS } from "../entities/HistoricoOS.js";
import { ApontamentoOS } from "../entities/ApontamentoOS.js";
import { Perfil } from "../types/usr_perfil.js";
import { Prioridade } from "../types/os_prioridade.js";
import { StatusOs } from "../types/os_status.js";
import { TipoManutencao } from "../types/os_tipoManutencao.js";

const DEFAULT_COUNT = 200;

const falhas = [
  "Ruído anormal durante operação",
  "Falha intermitente no painel de comando",
  "Aquecimento acima do esperado",
  "Sensor sem leitura consistente",
  "Parada repentina durante produção",
  "Oscilação de pressão no sistema",
  "Desgaste visível em componente mecânico",
  "Erro recorrente no módulo elétrico",
];

const servicos = [
  "Ajuste e reaperto do conjunto",
  "Substituição de componente desgastado",
  "Reconfiguração do módulo de controle",
  "Limpeza técnica e calibração",
  "Troca de sensor e validação funcional",
  "Revisão corretiva com testes operacionais",
];

const pecas = [
  "Kit de vedação",
  "Sensor indutivo",
  "Relé de proteção",
  "Rolamento",
  "Correia",
  "Contator",
];

function int(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: T[]): T {
  return items[int(0, items.length - 1)]!;
}

function maybe<T>(value: T, chance = 0.5): T | null {
  return Math.random() < chance ? value : null;
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function minutesAfter(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function nextStatusProfile(index: number): StatusOs {
  const mod = index % 10;
  if (mod <= 2) return StatusOs.ABERTA;
  if (mod <= 5) return StatusOs.EM_ANDAMENTO;
  if (mod <= 7) return StatusOs.AGUARDANDO_PECA;
  if (mod === 8) return StatusOs.CONCLUIDA;
  return StatusOs.CANCELADA;
}

function nextPrioridade(index: number): Prioridade {
  const items = [Prioridade.BAIXA, Prioridade.MEDIA, Prioridade.ALTA, Prioridade.CRITICA];
  return items[index % items.length]!;
}

function nextTipo(index: number): TipoManutencao {
  const items = [TipoManutencao.CORRETIVA, TipoManutencao.PREVENTIVA, TipoManutencao.PREDITIVA];
  return items[index % items.length]!;
}

async function getStartingSequence(ordemRepo: ReturnType<typeof appDataSource.getRepository<OrdemServico>>) {
  const latest = await ordemRepo
    .createQueryBuilder("ordem")
    .select("ordem.numero", "numero")
    .where("ordem.numero LIKE :prefix", { prefix: "OS-%" })
    .orderBy("ordem.numero", "DESC")
    .getRawOne<{ numero: string | null }>();

  const numero = latest?.numero ?? null;
  if (!numero) return 1;

  const match = numero.match(/OS-(\d+)/);
  return match ? Number(match[1]) + 1 : 1;
}

async function main() {
  const requested = Number(process.argv[2] ?? DEFAULT_COUNT);
  const count = Number.isFinite(requested) && requested > 0 ? Math.floor(requested) : DEFAULT_COUNT;

  await appDataSource.initialize();

  try {
    const usuarioRepo = appDataSource.getRepository(Usuario);
    const equipamentoRepo = appDataSource.getRepository(Equipamento);
    const ordemRepo = appDataSource.getRepository(OrdemServico);
    const historicoRepo = appDataSource.getRepository(HistoricoOS);
    const apontamentoRepo = appDataSource.getRepository(ApontamentoOS);

    const [solicitantes, tecnicos, supervisores, equipamentos] = await Promise.all([
      usuarioRepo.find({ where: { perfil: Perfil.SOLICITANTE, ativo: true } }),
      usuarioRepo.find({ where: { perfil: Perfil.TECNICO, ativo: true } }),
      usuarioRepo.find({ where: { perfil: Perfil.SUPERVISOR, ativo: true } }),
      equipamentoRepo.find({ where: { ativo: true } }),
    ]);

    if (!solicitantes.length) {
      throw new Error("Nenhum solicitante ativo encontrado para gerar O.S.");
    }

    if (!tecnicos.length) {
      throw new Error("Nenhum técnico ativo encontrado para gerar O.S.");
    }

    if (!supervisores.length) {
      throw new Error("Nenhum supervisor ativo encontrado para gerar O.S.");
    }

    if (!equipamentos.length) {
      throw new Error("Nenhum equipamento ativo encontrado para gerar O.S.");
    }

    let sequence = await getStartingSequence(ordemRepo);

    for (let index = 0; index < count; index += 1) {
      const status = nextStatusProfile(index);
      const prioridade = nextPrioridade(index);
      const tipo = nextTipo(index);
      const solicitante = solicitantes[index % solicitantes.length]!;
      const tecnico = tecnicos[index % tecnicos.length]!;
      const supervisor = supervisores[index % supervisores.length]!;
      const equipamento = equipamentos[index % equipamentos.length]!;

      const abertura = hoursAgo(int(6, 45 * 24));
      const inicio = status === StatusOs.ABERTA ? null : minutesAfter(abertura, int(20, 8 * 60));

      let conclusao: Date | null = null;
      if (status === StatusOs.CONCLUIDA || status === StatusOs.CANCELADA) {
        const base = inicio ?? abertura;
        conclusao = minutesAfter(base, int(60, 18 * 60));
      }

      const ordem = ordemRepo.create({
        numero: `OS-${String(sequence).padStart(4, "0")}`,
        equipamento,
        solicitante,
        tecnico: status === StatusOs.ABERTA ? null : tecnico,
        tipo_manutencao: tipo,
        prioridade,
        status,
        descricao_falha: `${pick(falhas)} - ${equipamento.nome}`,
        abertura_em: abertura,
        inicio_em: inicio,
        conclusao_em: conclusao,
        descricao_servico: status === StatusOs.CONCLUIDA ? `${pick(servicos)} no equipamento ${equipamento.nome}.` : null,
        pecas_utilizadas:
          status === StatusOs.CONCLUIDA || status === StatusOs.AGUARDANDO_PECA
            ? maybe(pick(pecas), 0.65)
            : null,
        horas_trabalhadas: null,
      });

      const savedOrdem = await ordemRepo.save(ordem);

      const historicos: Array<Partial<HistoricoOS>> = [
        {
          osId: savedOrdem.id,
          usuarioId: solicitante.id,
          statusAnterior: null,
          statusNovo: StatusOs.ABERTA,
          observacao: "Ordem de serviço criada automaticamente para ambiente de demonstração.",
          registradoEm: abertura,
        },
      ];

      if (savedOrdem.tecnico) {
        historicos.push({
          osId: savedOrdem.id,
          usuarioId: supervisor.id,
          statusAnterior: StatusOs.ABERTA,
          statusNovo: StatusOs.ABERTA,
          observacao: `Técnico ${tecnico.nome} atribuído à O.S.`,
          registradoEm: minutesAfter(abertura, int(5, 90)),
        });
      }

      if (inicio) {
        historicos.push({
          osId: savedOrdem.id,
          usuarioId: tecnico.id,
          statusAnterior: StatusOs.ABERTA,
          statusNovo: StatusOs.EM_ANDAMENTO,
          observacao: "Execução iniciada pelo técnico responsável.",
          registradoEm: inicio,
        });
      }

      let totalHoras = 0;

      if (status === StatusOs.AGUARDANDO_PECA && inicio) {
        const pausa = minutesAfter(inicio, int(40, 240));
        historicos.push({
          osId: savedOrdem.id,
          usuarioId: tecnico.id,
          statusAnterior: StatusOs.EM_ANDAMENTO,
          statusNovo: StatusOs.AGUARDANDO_PECA,
          observacao: `Aguardando peça: ${pick(pecas)}.`,
          registradoEm: pausa,
        });

        const apontamentoInicio = minutesAfter(inicio, 10);
        const apontamentoFim = minutesAfter(apontamentoInicio, int(30, 180));
        totalHoras += (apontamentoFim.getTime() - apontamentoInicio.getTime()) / (1000 * 60 * 60);
        await apontamentoRepo.save(
          apontamentoRepo.create({
            osId: savedOrdem.id,
            tecnicoId: tecnico.id,
            inicioEm: apontamentoInicio,
            fimEm: apontamentoFim,
            observacao: "Atuação inicial antes de aguardar peça.",
            criadoEm: apontamentoInicio,
          })
        );
      }

      if (status === StatusOs.EM_ANDAMENTO && inicio) {
        const apontamentoInicio = minutesAfter(inicio, 15);
        const apontamentoFim = minutesAfter(apontamentoInicio, int(45, 240));
        totalHoras += (apontamentoFim.getTime() - apontamentoInicio.getTime()) / (1000 * 60 * 60);
        await apontamentoRepo.save(
          apontamentoRepo.create({
            osId: savedOrdem.id,
            tecnicoId: tecnico.id,
            inicioEm: apontamentoInicio,
            fimEm: maybe(apontamentoFim, 0.7),
            observacao: "Apontamento em andamento para ambiente de demonstração.",
            criadoEm: apontamentoInicio,
          })
        );
      }

      if (status === StatusOs.CONCLUIDA && inicio && conclusao) {
        const apontamentoInicio = minutesAfter(inicio, 10);
        const apontamentoFim = minutesAfter(apontamentoInicio, int(60, 360));
        totalHoras += (apontamentoFim.getTime() - apontamentoInicio.getTime()) / (1000 * 60 * 60);
        await apontamentoRepo.save(
          apontamentoRepo.create({
            osId: savedOrdem.id,
            tecnicoId: tecnico.id,
            inicioEm: apontamentoInicio,
            fimEm: apontamentoFim,
            observacao: "Execução concluída com sucesso no ambiente de demonstração.",
            criadoEm: apontamentoInicio,
          })
        );

        historicos.push({
          osId: savedOrdem.id,
          usuarioId: tecnico.id,
          statusAnterior: StatusOs.EM_ANDAMENTO,
          statusNovo: StatusOs.CONCLUIDA,
          observacao: "Ordem concluída após execução e validação final.",
          registradoEm: conclusao,
        });
      }

      if (status === StatusOs.CANCELADA && conclusao) {
        historicos.push({
          osId: savedOrdem.id,
          usuarioId: supervisor.id,
          statusAnterior: inicio ? StatusOs.EM_ANDAMENTO : StatusOs.ABERTA,
          statusNovo: StatusOs.CANCELADA,
          observacao: "Cancelamento administrativo para fins de demonstração.",
          registradoEm: conclusao,
        });
      }

      if (totalHoras > 0) {
        savedOrdem.horas_trabalhadas = Number(totalHoras.toFixed(2));
        await ordemRepo.save(savedOrdem);
      }

      for (const historico of historicos) {
        await historicoRepo.save(historicoRepo.create(historico));
      }

      sequence += 1;
    }

    console.log(`Geração concluída com sucesso.`);
    console.log(`Ordens de serviço criadas: ${count}`);
    console.log(`Profissionais reaproveitados: ${solicitantes.length} solicitantes, ${tecnicos.length} técnicos, ${supervisores.length} supervisores`);
    console.log(`Equipamentos reutilizados: ${equipamentos.length}`);
  } finally {
    if (appDataSource.isInitialized) {
      await appDataSource.destroy();
    }
  }
}

main().catch((error) => {
  console.error("Falha ao gerar ordens de serviço de demonstração:", error);
  process.exit(1);
});
