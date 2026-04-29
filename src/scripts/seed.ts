import "reflect-metadata";
import bcrypt from "bcryptjs";
import { In, Like } from "typeorm";
import { appDataSource } from "../database/appDataSource.js";
import { Usuario } from "../entities/Usuario.js";
import { Equipamento } from "../entities/Equipamento.js";
import { OrdemServico } from "../entities/OrdemServico.js";
import { HistoricoOS } from "../entities/HistoricoOS.js";
import { ApontamentoOS } from "../entities/ApontamentoOS.js";
import { Perfil } from "../types/usr_perfil.js";
import { StatusOs } from "../types/os_status.js";
import { Prioridade } from "../types/os_prioridade.js";
import { TipoManutencao } from "../types/os_tipoManutencao.js";

type SeedUser = {
  nome: string;
  email: string;
  matricula: string;
  perfil: Perfil;
  setor: string;
};

type SeedEquipamento = {
  codigo: string;
  nome: string;
  tipo: string;
  localizacao: string;
  setor: string;
  numero_patrimonio: string | null;
  fabricante: string | null;
  modelo: string | null;
  ativo: boolean;
  ultima_revisao: string | null;
};

type SeedOrdem = {
  numero: string;
  equipamentoCodigo: string;
  solicitanteEmail: string;
  tecnicoEmail: string | null;
  tipo_manutencao: TipoManutencao;
  prioridade: Prioridade;
  status: StatusOs;
  descricao_falha: string;
  abertura_em: Date;
  inicio_em: Date | null;
  conclusao_em: Date | null;
  descricao_servico: string | null;
  pecas_utilizadas: string | null;
  horas_trabalhadas: number | null;
  historico: Array<{
    usuarioEmail: string;
    statusAnterior: string | null;
    statusNovo: string;
    observacao: string;
    registradoEm: Date;
  }>;
  apontamentos?: Array<{
    tecnicoEmail: string;
    inicioEm: Date;
    fimEm: Date | null;
    observacao: string | null;
    criadoEm: Date;
  }>;
};

const SENHA_PADRAO = "seed123";

const seedUsers: SeedUser[] = [
  {
    nome: "Supervisor Demo",
    email: "supervisor@seed.local",
    matricula: "SEED-SUP-001",
    perfil: Perfil.SUPERVISOR,
    setor: "Operação",
  },
  {
    nome: "Gestor Demo",
    email: "gestor@seed.local",
    matricula: "SEED-GES-001",
    perfil: Perfil.GESTOR,
    setor: "Gestão",
  },
  {
    nome: "Tecnico Demo Norte",
    email: "tecnico.norte@seed.local",
    matricula: "SEED-TEC-001",
    perfil: Perfil.TECNICO,
    setor: "Manutenção",
  },
  {
    nome: "Tecnico Demo Sul",
    email: "tecnico.sul@seed.local",
    matricula: "SEED-TEC-002",
    perfil: Perfil.TECNICO,
    setor: "Manutenção",
  },
  {
    nome: "Solicitante Demo Linha 1",
    email: "solicitante.linha1@seed.local",
    matricula: "SEED-SOL-001",
    perfil: Perfil.SOLICITANTE,
    setor: "Produção",
  },
  {
    nome: "Solicitante Demo Linha 2",
    email: "solicitante.linha2@seed.local",
    matricula: "SEED-SOL-002",
    perfil: Perfil.SOLICITANTE,
    setor: "Expedição",
  },
];

const seedEquipamentos: SeedEquipamento[] = [
  {
    codigo: "SEED-EQP-001",
    nome: "Prensa Hidráulica 01",
    tipo: "Prensa",
    localizacao: "Linha A",
    setor: "Produção",
    numero_patrimonio: "PAT-SEED-001",
    fabricante: "MetalWorks",
    modelo: "PX-900",
    ativo: true,
    ultima_revisao: "2026-03-10",
  },
  {
    codigo: "SEED-EQP-002",
    nome: "Esteira de Expedição",
    tipo: "Esteira",
    localizacao: "Doca 02",
    setor: "Expedição",
    numero_patrimonio: "PAT-SEED-002",
    fabricante: "FlowMove",
    modelo: "EST-420",
    ativo: true,
    ultima_revisao: "2026-02-22",
  },
  {
    codigo: "SEED-EQP-003",
    nome: "Compressor Central",
    tipo: "Compressor",
    localizacao: "Casa de Máquinas",
    setor: "Utilidades",
    numero_patrimonio: "PAT-SEED-003",
    fabricante: "AirOne",
    modelo: "COMP-75",
    ativo: true,
    ultima_revisao: "2026-01-15",
  },
  {
    codigo: "SEED-EQP-004",
    nome: "Painel Elétrico Linha B",
    tipo: "Painel",
    localizacao: "Linha B",
    setor: "Produção",
    numero_patrimonio: "PAT-SEED-004",
    fabricante: "Voltix",
    modelo: "VB-220",
    ativo: true,
    ultima_revisao: "2026-04-01",
  },
  {
    codigo: "SEED-EQP-005",
    nome: "Empilhadeira Elétrica",
    tipo: "Empilhadeira",
    localizacao: "Armazém",
    setor: "Logística",
    numero_patrimonio: "PAT-SEED-005",
    fabricante: "LiftPro",
    modelo: "EL-18",
    ativo: true,
    ultima_revisao: "2026-03-28",
  },
  {
    codigo: "SEED-EQP-006",
    nome: "Sensor Óptico Reserva",
    tipo: "Sensor",
    localizacao: "Almoxarifado",
    setor: "Automação",
    numero_patrimonio: "PAT-SEED-006",
    fabricante: "SenseIT",
    modelo: "OPT-11",
    ativo: false,
    ultima_revisao: "2025-12-05",
  },
];

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function minutesAfter(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

const seedOrdens: SeedOrdem[] = [
  {
    numero: "OS-SEED-0001",
    equipamentoCodigo: "SEED-EQP-001",
    solicitanteEmail: "solicitante.linha1@seed.local",
    tecnicoEmail: null,
    tipo_manutencao: TipoManutencao.CORRETIVA,
    prioridade: Prioridade.ALTA,
    status: StatusOs.ABERTA,
    descricao_falha: "Prensa com oscilação na pressão do cilindro principal.",
    abertura_em: hoursAgo(3),
    inicio_em: null,
    conclusao_em: null,
    descricao_servico: null,
    pecas_utilizadas: null,
    horas_trabalhadas: null,
    historico: [
      {
        usuarioEmail: "solicitante.linha1@seed.local",
        statusAnterior: null,
        statusNovo: StatusOs.ABERTA,
        observacao: "Ordem de serviço aberta para verificação da prensa.",
        registradoEm: hoursAgo(3),
      },
    ],
  },
  {
    numero: "OS-SEED-0002",
    equipamentoCodigo: "SEED-EQP-002",
    solicitanteEmail: "solicitante.linha2@seed.local",
    tecnicoEmail: "tecnico.norte@seed.local",
    tipo_manutencao: TipoManutencao.CORRETIVA,
    prioridade: Prioridade.CRITICA,
    status: StatusOs.EM_ANDAMENTO,
    descricao_falha: "Esteira parada sem resposta do inversor.",
    abertura_em: hoursAgo(7),
    inicio_em: hoursAgo(6),
    conclusao_em: null,
    descricao_servico: null,
    pecas_utilizadas: null,
    horas_trabalhadas: null,
    historico: [
      {
        usuarioEmail: "solicitante.linha2@seed.local",
        statusAnterior: null,
        statusNovo: StatusOs.ABERTA,
        observacao: "Falha crítica reportada na expedição.",
        registradoEm: hoursAgo(7),
      },
      {
        usuarioEmail: "supervisor@seed.local",
        statusAnterior: StatusOs.ABERTA,
        statusNovo: StatusOs.ABERTA,
        observacao: "Técnico Demo Norte atribuído à OS.",
        registradoEm: hoursAgo(6.5),
      },
      {
        usuarioEmail: "tecnico.norte@seed.local",
        statusAnterior: StatusOs.ABERTA,
        statusNovo: StatusOs.EM_ANDAMENTO,
        observacao: "Execução da ordem de serviço iniciada.",
        registradoEm: hoursAgo(6),
      },
    ],
    apontamentos: [
      {
        tecnicoEmail: "tecnico.norte@seed.local",
        inicioEm: hoursAgo(5.8),
        fimEm: hoursAgo(5),
        observacao: "Inspeção inicial do inversor e painel.",
        criadoEm: hoursAgo(5.8),
      },
      {
        tecnicoEmail: "tecnico.norte@seed.local",
        inicioEm: hoursAgo(2.2),
        fimEm: null,
        observacao: "Ajuste e testes finais em andamento.",
        criadoEm: hoursAgo(2.2),
      },
    ],
  },
  {
    numero: "OS-SEED-0003",
    equipamentoCodigo: "SEED-EQP-003",
    solicitanteEmail: "solicitante.linha1@seed.local",
    tecnicoEmail: "tecnico.sul@seed.local",
    tipo_manutencao: TipoManutencao.PREVENTIVA,
    prioridade: Prioridade.MEDIA,
    status: StatusOs.AGUARDANDO_PECA,
    descricao_falha: "Vazamento na linha de ar comprimido após manutenção preventiva.",
    abertura_em: hoursAgo(30),
    inicio_em: hoursAgo(26),
    conclusao_em: null,
    descricao_servico: null,
    pecas_utilizadas: null,
    horas_trabalhadas: 1.75,
    historico: [
      {
        usuarioEmail: "solicitante.linha1@seed.local",
        statusAnterior: null,
        statusNovo: StatusOs.ABERTA,
        observacao: "Solicitação aberta para inspeção do compressor.",
        registradoEm: hoursAgo(30),
      },
      {
        usuarioEmail: "supervisor@seed.local",
        statusAnterior: StatusOs.ABERTA,
        statusNovo: StatusOs.ABERTA,
        observacao: "Técnico Demo Sul atribuído à OS.",
        registradoEm: hoursAgo(28),
      },
      {
        usuarioEmail: "tecnico.sul@seed.local",
        statusAnterior: StatusOs.ABERTA,
        statusNovo: StatusOs.EM_ANDAMENTO,
        observacao: "Execução da ordem de serviço iniciada.",
        registradoEm: hoursAgo(26),
      },
      {
        usuarioEmail: "tecnico.sul@seed.local",
        statusAnterior: StatusOs.EM_ANDAMENTO,
        statusNovo: StatusOs.AGUARDANDO_PECA,
        observacao: "Aguardando kit de vedação do conjunto de válvulas.",
        registradoEm: hoursAgo(21),
      },
    ],
    apontamentos: [
      {
        tecnicoEmail: "tecnico.sul@seed.local",
        inicioEm: hoursAgo(25.5),
        fimEm: hoursAgo(24.2),
        observacao: "Desmontagem e inspeção do conjunto de vedação.",
        criadoEm: hoursAgo(25.5),
      },
      {
        tecnicoEmail: "tecnico.sul@seed.local",
        inicioEm: hoursAgo(22.8),
        fimEm: hoursAgo(22.3),
        observacao: "Medição e levantamento da peça.",
        criadoEm: hoursAgo(22.8),
      },
    ],
  },
  {
    numero: "OS-SEED-0004",
    equipamentoCodigo: "SEED-EQP-004",
    solicitanteEmail: "solicitante.linha1@seed.local",
    tecnicoEmail: "tecnico.norte@seed.local",
    tipo_manutencao: TipoManutencao.CORRETIVA,
    prioridade: Prioridade.BAIXA,
    status: StatusOs.CONCLUIDA,
    descricao_falha: "Disjuntor desarmando em partidas intermitentes.",
    abertura_em: hoursAgo(52),
    inicio_em: hoursAgo(49),
    conclusao_em: hoursAgo(45),
    descricao_servico: "Reaperto de bornes, substituição do disjuntor auxiliar e testes de partida.",
    pecas_utilizadas: "Disjuntor auxiliar 10A",
    horas_trabalhadas: 2.5,
    historico: [
      {
        usuarioEmail: "solicitante.linha1@seed.local",
        statusAnterior: null,
        statusNovo: StatusOs.ABERTA,
        observacao: "Painel com desarme intermitente.",
        registradoEm: hoursAgo(52),
      },
      {
        usuarioEmail: "supervisor@seed.local",
        statusAnterior: StatusOs.ABERTA,
        statusNovo: StatusOs.ABERTA,
        observacao: "Técnico Demo Norte atribuído à OS.",
        registradoEm: hoursAgo(50),
      },
      {
        usuarioEmail: "tecnico.norte@seed.local",
        statusAnterior: StatusOs.ABERTA,
        statusNovo: StatusOs.EM_ANDAMENTO,
        observacao: "Execução da ordem de serviço iniciada.",
        registradoEm: hoursAgo(49),
      },
      {
        usuarioEmail: "tecnico.norte@seed.local",
        statusAnterior: StatusOs.EM_ANDAMENTO,
        statusNovo: StatusOs.CONCLUIDA,
        observacao: "Ordem de serviço concluída.",
        registradoEm: hoursAgo(45),
      },
    ],
    apontamentos: [
      {
        tecnicoEmail: "tecnico.norte@seed.local",
        inicioEm: hoursAgo(48.5),
        fimEm: hoursAgo(47.3),
        observacao: "Diagnóstico elétrico e reaperto de bornes.",
        criadoEm: hoursAgo(48.5),
      },
      {
        tecnicoEmail: "tecnico.norte@seed.local",
        inicioEm: hoursAgo(46.8),
        fimEm: hoursAgo(45.5),
        observacao: "Substituição do componente e testes de partida.",
        criadoEm: hoursAgo(46.8),
      },
    ],
  },
  {
    numero: "OS-SEED-0005",
    equipamentoCodigo: "SEED-EQP-005",
    solicitanteEmail: "solicitante.linha2@seed.local",
    tecnicoEmail: "tecnico.sul@seed.local",
    tipo_manutencao: TipoManutencao.PREDITIVA,
    prioridade: Prioridade.ALTA,
    status: StatusOs.CONCLUIDA,
    descricao_falha: "Ruído anormal no motor de tração.",
    abertura_em: hoursAgo(96),
    inicio_em: hoursAgo(90),
    conclusao_em: hoursAgo(84),
    descricao_servico: "Ajuste de corrente no controlador e substituição de rolamento lateral.",
    pecas_utilizadas: "Rolamento lateral 6205",
    horas_trabalhadas: 3.2,
    historico: [
      {
        usuarioEmail: "solicitante.linha2@seed.local",
        statusAnterior: null,
        statusNovo: StatusOs.ABERTA,
        observacao: "Empilhadeira com ruído crescente em operação.",
        registradoEm: hoursAgo(96),
      },
      {
        usuarioEmail: "supervisor@seed.local",
        statusAnterior: StatusOs.ABERTA,
        statusNovo: StatusOs.ABERTA,
        observacao: "Técnico Demo Sul atribuído à OS.",
        registradoEm: hoursAgo(92),
      },
      {
        usuarioEmail: "tecnico.sul@seed.local",
        statusAnterior: StatusOs.ABERTA,
        statusNovo: StatusOs.EM_ANDAMENTO,
        observacao: "Execução da ordem de serviço iniciada.",
        registradoEm: hoursAgo(90),
      },
      {
        usuarioEmail: "tecnico.sul@seed.local",
        statusAnterior: StatusOs.EM_ANDAMENTO,
        statusNovo: StatusOs.CONCLUIDA,
        observacao: "Ordem de serviço concluída.",
        registradoEm: hoursAgo(84),
      },
    ],
    apontamentos: [
      {
        tecnicoEmail: "tecnico.sul@seed.local",
        inicioEm: hoursAgo(89),
        fimEm: hoursAgo(87.7),
        observacao: "Inspeção mecânica e desmontagem lateral.",
        criadoEm: hoursAgo(89),
      },
      {
        tecnicoEmail: "tecnico.sul@seed.local",
        inicioEm: hoursAgo(86.9),
        fimEm: hoursAgo(84.98),
        observacao: "Troca de rolamento e testes.",
        criadoEm: hoursAgo(86.9),
      },
    ],
  },
  {
    numero: "OS-SEED-0006",
    equipamentoCodigo: "SEED-EQP-001",
    solicitanteEmail: "solicitante.linha1@seed.local",
    tecnicoEmail: "tecnico.norte@seed.local",
    tipo_manutencao: TipoManutencao.PREVENTIVA,
    prioridade: Prioridade.MEDIA,
    status: StatusOs.CANCELADA,
    descricao_falha: "Inspeção preventiva reagendada pela produção.",
    abertura_em: hoursAgo(15),
    inicio_em: null,
    conclusao_em: null,
    descricao_servico: null,
    pecas_utilizadas: null,
    horas_trabalhadas: null,
    historico: [
      {
        usuarioEmail: "solicitante.linha1@seed.local",
        statusAnterior: null,
        statusNovo: StatusOs.ABERTA,
        observacao: "OS aberta para parada programada da prensa.",
        registradoEm: hoursAgo(15),
      },
      {
        usuarioEmail: "supervisor@seed.local",
        statusAnterior: StatusOs.ABERTA,
        statusNovo: StatusOs.ABERTA,
        observacao: "Técnico Demo Norte atribuído à OS.",
        registradoEm: hoursAgo(14),
      },
      {
        usuarioEmail: "supervisor@seed.local",
        statusAnterior: StatusOs.ABERTA,
        statusNovo: StatusOs.CANCELADA,
        observacao: "Cancelada por reprogramação da parada da linha.",
        registradoEm: hoursAgo(13),
      },
    ],
  },
];

async function clearPreviousSeedData() {
  const usuarioRepo = appDataSource.getRepository(Usuario);
  const equipamentoRepo = appDataSource.getRepository(Equipamento);
  const ordemRepo = appDataSource.getRepository(OrdemServico);
  const historicoRepo = appDataSource.getRepository(HistoricoOS);
  const apontamentoRepo = appDataSource.getRepository(ApontamentoOS);

  // Deletar em ordem para respeitar chaves estrangeiras
  await historicoRepo.createQueryBuilder().delete().execute();
  await apontamentoRepo.createQueryBuilder().delete().execute();
  await ordemRepo.createQueryBuilder().delete().execute();
  await equipamentoRepo.createQueryBuilder().delete().execute();
  await usuarioRepo.createQueryBuilder().delete().execute();
}

async function createUsers() {
  const repo = appDataSource.getRepository(Usuario);
  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);
  const users = new Map<string, Usuario>();

  for (const user of seedUsers) {
    const created = repo.create({
      ...user,
      senha_hash: senhaHash,
      ativo: true,
    });
    const saved = await repo.save(created);
    users.set(saved.email, saved);
  }

  return users;
}

async function createEquipamentos() {
  const repo = appDataSource.getRepository(Equipamento);
  const equipamentos = new Map<string, Equipamento>();

  for (const equipamento of seedEquipamentos) {
    const created = repo.create({
      ...equipamento,
      data_cadastro: minutesAfter(new Date("2026-01-05T08:00:00.000Z"), equipamentos.size * 120),
    });
    const saved = await repo.save(created);
    equipamentos.set(saved.codigo, saved);
  }

  return equipamentos;
}

async function createOrdens(
  users: Map<string, Usuario>,
  equipamentos: Map<string, Equipamento>
) {
  const ordemRepo = appDataSource.getRepository(OrdemServico);
  const historicoRepo = appDataSource.getRepository(HistoricoOS);
  const apontamentoRepo = appDataSource.getRepository(ApontamentoOS);

  for (const ordem of seedOrdens) {
    const solicitante = users.get(ordem.solicitanteEmail);
    const tecnico = ordem.tecnicoEmail ? users.get(ordem.tecnicoEmail) : null;
    const equipamento = equipamentos.get(ordem.equipamentoCodigo);

    if (!solicitante || !equipamento) {
      throw new Error(`Dependência de seed ausente para ${ordem.numero}`);
    }

    const novaOrdem = ordemRepo.create({
      numero: ordem.numero,
      equipamento,
      solicitante,
      tecnico: tecnico ?? null,
      tipo_manutencao: ordem.tipo_manutencao,
      prioridade: ordem.prioridade,
      status: ordem.status,
      descricao_falha: ordem.descricao_falha,
      abertura_em: ordem.abertura_em,
      inicio_em: ordem.inicio_em,
      conclusao_em: ordem.conclusao_em,
      descricao_servico: ordem.descricao_servico,
      pecas_utilizadas: ordem.pecas_utilizadas,
      horas_trabalhadas: ordem.horas_trabalhadas,
    });

    const savedOrdem = await ordemRepo.save(novaOrdem);

    for (const evento of ordem.historico) {
      const usuario = users.get(evento.usuarioEmail);
      if (!usuario) {
        throw new Error(`Usuário do histórico ausente para ${ordem.numero}`);
      }

      const historico = historicoRepo.create({
        osId: savedOrdem.id,
        usuarioId: usuario.id,
        statusAnterior: evento.statusAnterior,
        statusNovo: evento.statusNovo,
        observacao: evento.observacao,
        registradoEm: evento.registradoEm,
      });

      await historicoRepo.save(historico);
    }

    for (const apontamento of ordem.apontamentos ?? []) {
      const tecnicoApontamento = users.get(apontamento.tecnicoEmail);
      if (!tecnicoApontamento) {
        throw new Error(`Técnico do apontamento ausente para ${ordem.numero}`);
      }

      const created = apontamentoRepo.create({
        osId: savedOrdem.id,
        tecnicoId: tecnicoApontamento.id,
        inicioEm: apontamento.inicioEm,
        fimEm: apontamento.fimEm,
        observacao: apontamento.observacao,
        criadoEm: apontamento.criadoEm,
      });

      await apontamentoRepo.save(created);
    }
  }
}

async function main() {
  await appDataSource.initialize();

  try {
    await clearPreviousSeedData();
    const users = await createUsers();
    const equipamentos = await createEquipamentos();
    await createOrdens(users, equipamentos);

    console.log("Seed concluído com sucesso.");
    console.log(`Senha padrão dos usuários seed: ${SENHA_PADRAO}`);
    console.log(`Usuários seed criados: ${seedUsers.length}`);
    console.log(`Equipamentos seed criados: ${seedEquipamentos.length}`);
    console.log(`Ordens de serviço seed criadas: ${seedOrdens.length}`);
  } finally {
    if (appDataSource.isInitialized) {
      await appDataSource.destroy();
    }
  }
}

main().catch((error) => {
  console.error("Falha ao executar seed:", error);
  process.exit(1);
});
