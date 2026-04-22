import "reflect-metadata";
import bcrypt from "bcryptjs";
import { Like } from "typeorm";
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

/**
 * Seed sintético para indústria eletroeletrônica (Terminal Manaus).
 *
 * Características:
 *  - Idempotente: usa prefixo "SYN-" em códigos, matrículas e números de OS,
 *    e sufixo "@syn.local" nos emails. Não toca em nenhum registro pré-existente.
 *  - Seguro para rodar em homologação/produção: não deleta dados; aborta se
 *    encontrar colisões de identificadores sintéticos (a menos que --reset).
 *  - Determinístico: aceita --seed=<int> para reprodutibilidade.
 *  - Configurável via CLI/env:
 *      --equipamentos=<n>  (padrão 35)
 *      --ordens=<n>        (padrão 220)
 *      --meses=<n>         (padrão 12 — janela temporal para aberturas)
 *      --seed=<int>        (padrão 20260422)
 *      --reset             apaga APENAS registros com prefixo SYN- antes de inserir
 *      --dry-run           executa geração em memória e faz rollback da transação
 *
 * Senha padrão dos usuários sintéticos: "syn123"
 */

type Args = {
  equipamentos: number;
  ordens: number;
  meses: number;
  seed: number;
  reset: boolean;
  dryRun: boolean;
};

function parseArgs(): Args {
  const args: Args = {
    equipamentos: 35,
    ordens: 220,
    meses: 12,
    seed: 20260422,
    reset: false,
    dryRun: false,
  };

  for (const raw of process.argv.slice(2)) {
    if (raw === "--reset") args.reset = true;
    else if (raw === "--dry-run") args.dryRun = true;
    else {
      const match = raw.match(/^--(equipamentos|ordens|meses|seed)=(\d+)$/);
      if (match && match[1] && match[2]) {
        const key = match[1] as "equipamentos" | "ordens" | "meses" | "seed";
        args[key] = parseInt(match[2], 10);
      }
    }
  }

  return args;
}

/** mulberry32: PRNG determinístico simples. */
function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SYN_PREFIX = "SYN-";
const SYN_EMAIL_DOMAIN = "@syn.local";
const SENHA_PADRAO = "syn123";

// ----- Catálogo de equipamentos típicos de fábrica eletroeletrônica -----

type EquipamentoTemplate = {
  tipo: string;
  nomes: string[];
  fabricantes: string[];
  modelos: string[];
  setor: string;
  localizacoes: string[];
  falhas: string[];
};

const TEMPLATES: EquipamentoTemplate[] = [
  {
    tipo: "Pick and Place",
    nomes: ["Pick and Place SMT"],
    fabricantes: ["Yamaha", "Panasonic", "Fuji", "Juki"],
    modelos: ["YSM20", "NPM-W2", "NXT-III", "RS-1R"],
    setor: "SMT",
    localizacoes: ["Linha SMT 1", "Linha SMT 2", "Linha SMT 3"],
    falhas: [
      "Bico de sucção entupido causando desvio de componente",
      "Alimentador com erro de avanço intermitente",
      "Câmera de visão fora de calibração após troca de feeder",
      "Eixo Y com ruído e travamento ocasional",
      "Erro de reconhecimento de fiducial em placas novas",
    ],
  },
  {
    tipo: "Forno de Refusão",
    nomes: ["Forno de Refusão"],
    fabricantes: ["Heller", "BTU", "Rehm"],
    modelos: ["1913 MK5", "Pyramax 98N", "VXP+"],
    setor: "SMT",
    localizacoes: ["Linha SMT 1", "Linha SMT 2", "Linha SMT 3"],
    falhas: [
      "Zona 4 não atinge temperatura de setpoint",
      "Exaustor com ruído anormal — rolamento suspeito",
      "Esteira com variação de velocidade na saída",
      "Termopar da zona 2 com leitura errática",
      "Sistema de refrigeração perdendo eficiência",
    ],
  },
  {
    tipo: "AOI",
    nomes: ["Inspeção Óptica Automática"],
    fabricantes: ["Koh Young", "Omron", "Viscom"],
    modelos: ["Zenith Alpha", "VT-S730", "S3088"],
    setor: "SMT",
    localizacoes: ["Linha SMT 1", "Linha SMT 2"],
    falhas: [
      "Alto índice de falso positivo em componentes 0402",
      "Iluminação lateral com LED queimado",
      "Falha de comunicação com servidor de receitas",
      "Eixo Z travando em posição de scan",
    ],
  },
  {
    tipo: "SPI",
    nomes: ["Inspeção de Pasta de Solda"],
    fabricantes: ["Koh Young", "CyberOptics"],
    modelos: ["aSPIre3", "SE600"],
    setor: "SMT",
    localizacoes: ["Linha SMT 1", "Linha SMT 2"],
    falhas: [
      "Medição de altura inconsistente em placas grandes",
      "Limpeza automática do stencil não está acionando",
      "Perda de referência após reinicialização",
    ],
  },
  {
    tipo: "Stencil Printer",
    nomes: ["Impressora de Pasta de Solda"],
    fabricantes: ["DEK", "MPM", "Ekra"],
    modelos: ["NeoHorizon", "Edison", "X5"],
    setor: "SMT",
    localizacoes: ["Linha SMT 1", "Linha SMT 2", "Linha SMT 3"],
    falhas: [
      "Desgaste do squeegee provocando falha de deposição",
      "Sistema de limpeza understencil sem solvente",
      "Alinhamento da placa fora de tolerância",
      "Sensor de presença de stencil intermitente",
    ],
  },
  {
    tipo: "ICT",
    nomes: ["Testador In-Circuit"],
    fabricantes: ["Keysight", "Teradyne", "SPEA"],
    modelos: ["i3070", "TestStation", "4060"],
    setor: "Teste",
    localizacoes: ["Bancada Teste 1", "Bancada Teste 2"],
    falhas: [
      "Probes com contato intermitente no fixture",
      "Falha no vácuo de fixação do fixture",
      "Software travando durante carregamento de programa",
    ],
  },
  {
    tipo: "Testador Funcional",
    nomes: ["Testador Funcional"],
    fabricantes: ["Interno", "Teradyne"],
    modelos: ["FCT-Gen2", "TSK-300"],
    setor: "Teste",
    localizacoes: ["Bancada Teste 1", "Bancada Teste 2", "Bancada Teste 3"],
    falhas: [
      "Fonte programável sem saída no canal 2",
      "Relé de carga colado após falha de sobrecorrente",
      "Comunicação RS-232 com DUT instável",
    ],
  },
  {
    tipo: "Câmara Climática",
    nomes: ["Câmara Climática"],
    fabricantes: ["Weiss", "Espec", "Thermotron"],
    modelos: ["WK3-340", "SH-641", "8200"],
    setor: "Qualidade",
    localizacoes: ["Lab Qualidade"],
    falhas: [
      "Compressor não inicia — pressostato de alta atuando",
      "Umidificador com baixo fornecimento de vapor",
      "Controlador perdendo setpoint durante rampa",
    ],
  },
  {
    tipo: "Esteira",
    nomes: ["Esteira Transportadora"],
    fabricantes: ["Nutek", "Asys", "Simplimatic"],
    modelos: ["NTM-1000", "STR-250", "SLI-200"],
    setor: "Montagem",
    localizacoes: ["Linha Montagem 1", "Linha Montagem 2", "Doca de Expedição"],
    falhas: [
      "Motor trifásico com sobreaquecimento",
      "Sensor de fim de curso desalinhado",
      "Correia com desgaste gerando desvio lateral",
      "Inversor de frequência acusando falha F0001",
    ],
  },
  {
    tipo: "Parafusadeira",
    nomes: ["Estação de Parafusadeira Automática"],
    fabricantes: ["Bosch Rexroth", "Atlas Copco"],
    modelos: ["EC-Driver", "MicroTorque"],
    setor: "Montagem",
    localizacoes: ["Linha Montagem 1", "Linha Montagem 2"],
    falhas: [
      "Torque fora de janela em ciclo de verificação",
      "Bit com desgaste causando cam-out frequente",
      "Alimentador de parafusos travando com frequência",
    ],
  },
  {
    tipo: "Estação de Solda",
    nomes: ["Estação de Solda Manual"],
    fabricantes: ["Weller", "Hakko", "JBC"],
    modelos: ["WX2", "FM-206", "DDE-2B"],
    setor: "Retrabalho",
    localizacoes: ["Bancada Retrabalho 1", "Bancada Retrabalho 2"],
    falhas: [
      "Ferro de solda sem aquecimento — elemento suspeito",
      "Sugador de solda com perda de vácuo",
      "Display do controlador com pixels queimados",
    ],
  },
  {
    tipo: "Compressor",
    nomes: ["Compressor de Ar Central"],
    fabricantes: ["Atlas Copco", "Ingersoll Rand", "Schulz"],
    modelos: ["GA-30", "R-Series", "SRP 3030"],
    setor: "Utilidades",
    localizacoes: ["Casa de Máquinas"],
    falhas: [
      "Perda de pressão na rede durante pico de consumo",
      "Vazamento detectado no secador de ar",
      "Alarme de temperatura de óleo",
    ],
  },
  {
    tipo: "Chiller",
    nomes: ["Chiller de Água Gelada"],
    fabricantes: ["Trane", "Carrier"],
    modelos: ["CGAM", "30RB"],
    setor: "Utilidades",
    localizacoes: ["Casa de Máquinas"],
    falhas: [
      "Baixa pressão no circuito de refrigerante",
      "Bomba secundária com vibração elevada",
    ],
  },
  {
    tipo: "Nobreak",
    nomes: ["Nobreak Industrial"],
    fabricantes: ["APC", "Eaton"],
    modelos: ["Symmetra LX", "9395"],
    setor: "Utilidades",
    localizacoes: ["Sala Elétrica", "Data Center"],
    falhas: [
      "Bateria sinalizando fim de vida útil",
      "Bypass estático acionado após surto",
    ],
  },
];

const SOLICITANTE_OBSERVACOES = [
  "Operação interrompida, necessária verificação urgente.",
  "Linha parada aguardando diagnóstico da manutenção.",
  "Problema recorrente, já foi reportado no turno anterior.",
  "Impacta meta de produção do turno.",
  "Aberto conforme procedimento de inspeção diária.",
];

const CONCLUSAO_DESCRICOES = [
  "Componente substituído e parâmetros recalibrados conforme manual.",
  "Ajuste fino realizado após análise da causa raiz, equipamento liberado.",
  "Limpeza, lubrificação e teste funcional concluídos com sucesso.",
  "Firmware atualizado e verificação de funcionamento aprovada.",
  "Substituição preventiva do item crítico e validação em produção.",
];

const PECAS_COMUNS = [
  "Rolamento 6205-2Z",
  "Filtro de ar HEPA",
  "Termopar tipo K",
  "Fusível 10A ultra-rápido",
  "Contator LC1D25",
  "Sensor indutivo M12",
  "Válvula solenoide 24Vdc",
  "LED de iluminação AOI",
  "Squeegee 350mm",
  "Kit de vedação do secador",
];

// ----- Utilitários -----

function pick<T>(rng: () => number, arr: T[]): T {
  if (arr.length === 0) throw new Error("pick: array vazio");
  return arr[Math.floor(rng() * arr.length)] as T;
}

function weighted<T>(rng: () => number, pairs: Array<[T, number]>): T {
  if (pairs.length === 0) throw new Error("weighted: sem opções");
  const total = pairs.reduce((sum, [, w]) => sum + w, 0);
  let r = rng() * total;
  for (const [value, w] of pairs) {
    r -= w;
    if (r <= 0) return value;
  }
  return (pairs[pairs.length - 1] as [T, number])[0];
}

function pad(n: number, len: number): string {
  return n.toString().padStart(len, "0");
}

function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60 * 1000);
}

function randomDateWithinMonths(rng: () => number, months: number): Date {
  const now = Date.now();
  const past = now - months * 30 * 24 * 60 * 60 * 1000;
  const ts = past + rng() * (now - past);
  const d = new Date(ts);
  // Concentrar em horário comercial (06:00–22:00)
  const hour = 6 + Math.floor(rng() * 16);
  const minute = Math.floor(rng() * 60);
  d.setHours(hour, minute, Math.floor(rng() * 60), 0);
  return d;
}

// ----- Geração -----

type GeneratedUser = {
  nome: string;
  email: string;
  matricula: string;
  perfil: Perfil;
  setor: string;
};

function generateUsers(): GeneratedUser[] {
  const users: GeneratedUser[] = [];

  // 1 supervisor
  users.push({
    nome: "Supervisor Sintético",
    email: `supervisor${SYN_EMAIL_DOMAIN}`,
    matricula: `${SYN_PREFIX}SUP-001`,
    perfil: Perfil.SUPERVISOR,
    setor: "Manutenção",
  });

  // 6 técnicos (2 por turno, 3 turnos)
  const nomesTec = [
    "Ana Lima", "Carlos Souza", "Davi Pereira",
    "Eduarda Rocha", "Felipe Araújo", "Gabriela Nunes",
  ];
  nomesTec.forEach((nome, i) => {
    users.push({
      nome,
      email: `tec${i + 1}${SYN_EMAIL_DOMAIN}`,
      matricula: `${SYN_PREFIX}TEC-${pad(i + 1, 3)}`,
      perfil: Perfil.TECNICO,
      setor: "Manutenção",
    });
  });

  // 15 solicitantes (líderes de linha, qualidade, produção)
  const setores = ["SMT", "Montagem", "Teste", "Qualidade", "Expedição"];
  for (let i = 0; i < 15; i++) {
    users.push({
      nome: `Solicitante ${i + 1}`,
      email: `sol${i + 1}${SYN_EMAIL_DOMAIN}`,
      matricula: `${SYN_PREFIX}SOL-${pad(i + 1, 3)}`,
      perfil: Perfil.SOLICITANTE,
      setor: setores[i % setores.length] as string,
    });
  }

  return users;
}

type GeneratedEquipamento = {
  codigo: string;
  nome: string;
  tipo: string;
  localizacao: string;
  setor: string;
  numero_patrimonio: string;
  fabricante: string;
  modelo: string;
  ativo: boolean;
  ultima_revisao: string;
  falhas: string[];
};

function generateEquipamentos(rng: () => number, qty: number): GeneratedEquipamento[] {
  const out: GeneratedEquipamento[] = [];
  const counters = new Map<string, number>();

  for (let i = 0; i < qty; i++) {
    const tpl = TEMPLATES[i % TEMPLATES.length] as EquipamentoTemplate;
    const idx = (counters.get(tpl.tipo) ?? 0) + 1;
    counters.set(tpl.tipo, idx);

    out.push({
      codigo: `${SYN_PREFIX}EQP-${pad(i + 1, 4)}`,
      nome: `${tpl.nomes[0]} ${pad(idx, 2)}`,
      tipo: tpl.tipo,
      localizacao: pick(rng, tpl.localizacoes),
      setor: tpl.setor,
      numero_patrimonio: `PAT-${SYN_PREFIX}${pad(i + 1, 5)}`,
      fabricante: pick(rng, tpl.fabricantes),
      modelo: pick(rng, tpl.modelos),
      ativo: rng() > 0.05, // ~5% inativos
      ultima_revisao: new Date(
        Date.now() - Math.floor(rng() * 180) * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .slice(0, 10),
      falhas: tpl.falhas,
    });
  }

  return out;
}

type GeneratedOrdem = {
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
  apontamentos: Array<{
    tecnicoEmail: string;
    inicioEm: Date;
    fimEm: Date | null;
    observacao: string | null;
    criadoEm: Date;
  }>;
};

function generateOrdens(
  rng: () => number,
  equipamentos: GeneratedEquipamento[],
  users: GeneratedUser[],
  qty: number,
  meses: number
): GeneratedOrdem[] {
  const tecnicos = users.filter((u) => u.perfil === Perfil.TECNICO);
  const solicitantes = users.filter((u) => u.perfil === Perfil.SOLICITANTE);
  const supervisor = users.find((u) => u.perfil === Perfil.SUPERVISOR)!;
  const equipAtivos = equipamentos.filter((e) => e.ativo);

  const ordens: GeneratedOrdem[] = [];

  for (let i = 0; i < qty; i++) {
    const equipamento = pick(rng, equipAtivos);
    const solicitante = pick(rng, solicitantes);
    const tipo = weighted(rng, [
      [TipoManutencao.CORRETIVA, 70],
      [TipoManutencao.PREVENTIVA, 25],
      [TipoManutencao.PREDITIVA, 5],
    ]);
    const prioridade = weighted(rng, [
      [Prioridade.BAIXA, 20],
      [Prioridade.MEDIA, 45],
      [Prioridade.ALTA, 25],
      [Prioridade.CRITICA, 10],
    ]);
    const status = weighted(rng, [
      [StatusOs.CONCLUIDA, 72],
      [StatusOs.EM_ANDAMENTO, 10],
      [StatusOs.AGUARDANDO_PECA, 6],
      [StatusOs.ABERTA, 6],
      [StatusOs.CANCELADA, 6],
    ]);

    const abertura = randomDateWithinMonths(rng, meses);
    const descricaoFalha = pick(rng, equipamento.falhas);
    const numero = `OS-${SYN_PREFIX}${pad(i + 1, 5)}`;

    const historico: GeneratedOrdem["historico"] = [];
    const apontamentos: GeneratedOrdem["apontamentos"] = [];

    historico.push({
      usuarioEmail: solicitante.email,
      statusAnterior: null,
      statusNovo: StatusOs.ABERTA,
      observacao: pick(rng, SOLICITANTE_OBSERVACOES),
      registradoEm: abertura,
    });

    let tecnicoEmail: string | null = null;
    let inicio: Date | null = null;
    let conclusao: Date | null = null;
    let descricaoServico: string | null = null;
    let pecasUtilizadas: string | null = null;
    let horasTrabalhadas: number | null = null;

    if (status === StatusOs.ABERTA) {
      // sem atribuição
    } else if (status === StatusOs.CANCELADA) {
      const tCancel = addMinutes(abertura, 30 + Math.floor(rng() * 240));
      historico.push({
        usuarioEmail: supervisor.email,
        statusAnterior: StatusOs.ABERTA,
        statusNovo: StatusOs.CANCELADA,
        observacao: "Cancelada por reprogramação da parada de linha.",
        registradoEm: tCancel,
      });
    } else {
      // EM_ANDAMENTO, AGUARDANDO_PECA ou CONCLUIDA — precisa de técnico
      const tecnico = pick(rng, tecnicos);
      tecnicoEmail = tecnico.email;

      const tAtribuicao = addMinutes(abertura, 15 + Math.floor(rng() * 120));
      historico.push({
        usuarioEmail: supervisor.email,
        statusAnterior: StatusOs.ABERTA,
        statusNovo: StatusOs.ABERTA,
        observacao: `Técnico ${tecnico.nome} atribuído à OS.`,
        registradoEm: tAtribuicao,
      });

      inicio = addMinutes(tAtribuicao, 10 + Math.floor(rng() * 90));
      historico.push({
        usuarioEmail: tecnico.email,
        statusAnterior: StatusOs.ABERTA,
        statusNovo: StatusOs.EM_ANDAMENTO,
        observacao: "Execução da ordem de serviço iniciada.",
        registradoEm: inicio,
      });

      const duracaoBaseMin = 30 + Math.floor(rng() * 240); // 0.5h–4.5h
      const ap1Ini = addMinutes(inicio, 5 + Math.floor(rng() * 20));
      const ap1Fim = addMinutes(ap1Ini, Math.floor(duracaoBaseMin * 0.6));
      apontamentos.push({
        tecnicoEmail: tecnico.email,
        inicioEm: ap1Ini,
        fimEm: ap1Fim,
        observacao: "Diagnóstico inicial e inspeção do equipamento.",
        criadoEm: ap1Ini,
      });

      if (status === StatusOs.AGUARDANDO_PECA) {
        const tAguard = addMinutes(ap1Fim, 15 + Math.floor(rng() * 60));
        historico.push({
          usuarioEmail: tecnico.email,
          statusAnterior: StatusOs.EM_ANDAMENTO,
          statusNovo: StatusOs.AGUARDANDO_PECA,
          observacao: `Aguardando peça: ${pick(rng, PECAS_COMUNS)}.`,
          registradoEm: tAguard,
        });
        horasTrabalhadas = Math.round(((ap1Fim.getTime() - ap1Ini.getTime()) / 3600000) * 100) / 100;
      } else if (status === StatusOs.EM_ANDAMENTO) {
        const ap2Ini = addMinutes(ap1Fim, 60 + Math.floor(rng() * 180));
        apontamentos.push({
          tecnicoEmail: tecnico.email,
          inicioEm: ap2Ini,
          fimEm: null,
          observacao: "Ajustes finais em andamento.",
          criadoEm: ap2Ini,
        });
      } else if (status === StatusOs.CONCLUIDA) {
        const ap2Ini = addMinutes(ap1Fim, 10 + Math.floor(rng() * 60));
        const ap2Fim = addMinutes(ap2Ini, Math.floor(duracaoBaseMin * 0.5));
        apontamentos.push({
          tecnicoEmail: tecnico.email,
          inicioEm: ap2Ini,
          fimEm: ap2Fim,
          observacao: "Substituição do item e testes finais.",
          criadoEm: ap2Ini,
        });
        conclusao = addMinutes(ap2Fim, 5 + Math.floor(rng() * 20));
        descricaoServico = pick(rng, CONCLUSAO_DESCRICOES);
        pecasUtilizadas = rng() > 0.3 ? pick(rng, PECAS_COMUNS) : null;
        const workedMs =
          ap1Fim.getTime() - ap1Ini.getTime() + (ap2Fim.getTime() - ap2Ini.getTime());
        horasTrabalhadas = Math.round((workedMs / 3600000) * 100) / 100;
        historico.push({
          usuarioEmail: tecnico.email,
          statusAnterior: StatusOs.EM_ANDAMENTO,
          statusNovo: StatusOs.CONCLUIDA,
          observacao: "Ordem de serviço concluída.",
          registradoEm: conclusao,
        });
      }
    }

    ordens.push({
      numero,
      equipamentoCodigo: equipamento.codigo,
      solicitanteEmail: solicitante.email,
      tecnicoEmail,
      tipo_manutencao: tipo,
      prioridade,
      status,
      descricao_falha: descricaoFalha,
      abertura_em: abertura,
      inicio_em: inicio,
      conclusao_em: conclusao,
      descricao_servico: descricaoServico,
      pecas_utilizadas: pecasUtilizadas,
      horas_trabalhadas: horasTrabalhadas,
      historico,
      apontamentos,
    });
  }

  ordens.sort((a, b) => a.abertura_em.getTime() - b.abertura_em.getTime());
  ordens.forEach((o, i) => (o.numero = `OS-${SYN_PREFIX}${pad(i + 1, 5)}`));
  return ordens;
}

// ----- Persistência -----

async function assertNoCollisions() {
  const usuarioRepo = appDataSource.getRepository(Usuario);
  const equipRepo = appDataSource.getRepository(Equipamento);
  const ordemRepo = appDataSource.getRepository(OrdemServico);

  const [uCount, eCount, oCount] = await Promise.all([
    usuarioRepo.count({ where: { email: Like(`%${SYN_EMAIL_DOMAIN}`) } }),
    equipRepo.count({ where: { codigo: Like(`${SYN_PREFIX}%`) } }),
    ordemRepo.count({ where: { numero: Like(`OS-${SYN_PREFIX}%`) } }),
  ]);

  if (uCount + eCount + oCount > 0) {
    throw new Error(
      `Colisão: já existem registros sintéticos (usuarios=${uCount}, equipamentos=${eCount}, ordens=${oCount}). Use --reset para removê-los antes de inserir.`
    );
  }
}

async function resetSyntheticData() {
  await appDataSource.transaction(async (m) => {
    await m.getRepository(HistoricoOS).createQueryBuilder("h")
      .delete()
      .where("h.os_id IN (SELECT id FROM ordem_servico WHERE numero LIKE :p)", { p: `OS-${SYN_PREFIX}%` })
      .execute();
    await m.getRepository(ApontamentoOS).createQueryBuilder("a")
      .delete()
      .where("a.os_id IN (SELECT id FROM ordem_servico WHERE numero LIKE :p)", { p: `OS-${SYN_PREFIX}%` })
      .execute();
    await m.getRepository(OrdemServico).createQueryBuilder()
      .delete().where("numero LIKE :p", { p: `OS-${SYN_PREFIX}%` }).execute();
    await m.getRepository(Equipamento).createQueryBuilder()
      .delete().where("codigo LIKE :p", { p: `${SYN_PREFIX}%` }).execute();
    await m.getRepository(Usuario).createQueryBuilder()
      .delete().where("email LIKE :p", { p: `%${SYN_EMAIL_DOMAIN}` }).execute();
  });
}

async function insertAll(
  users: GeneratedUser[],
  equipamentos: GeneratedEquipamento[],
  ordens: GeneratedOrdem[],
  dryRun: boolean
) {
  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);

  await appDataSource.transaction(async (m) => {
    const usuarioRepo = m.getRepository(Usuario);
    const equipRepo = m.getRepository(Equipamento);
    const ordemRepo = m.getRepository(OrdemServico);
    const histRepo = m.getRepository(HistoricoOS);
    const apRepo = m.getRepository(ApontamentoOS);

    const userMap = new Map<string, Usuario>();
    for (const u of users) {
      const saved = await usuarioRepo.save(
        usuarioRepo.create({ ...u, senha_hash: senhaHash, ativo: true })
      );
      userMap.set(saved.email, saved);
    }

    const equipMap = new Map<string, Equipamento>();
    for (const e of equipamentos) {
      const { falhas: _unused, ...rest } = e;
      void _unused;
      const saved = await equipRepo.save(equipRepo.create(rest));
      equipMap.set(saved.codigo, saved);
    }

    for (const o of ordens) {
      const solicitante = userMap.get(o.solicitanteEmail)!;
      const tecnico = o.tecnicoEmail ? userMap.get(o.tecnicoEmail)! : null;
      const equipamento = equipMap.get(o.equipamentoCodigo)!;

      const saved = await ordemRepo.save(
        ordemRepo.create({
          numero: o.numero,
          equipamento,
          solicitante,
          tecnico,
          tipo_manutencao: o.tipo_manutencao,
          prioridade: o.prioridade,
          status: o.status,
          descricao_falha: o.descricao_falha,
          abertura_em: o.abertura_em,
          inicio_em: o.inicio_em,
          conclusao_em: o.conclusao_em,
          descricao_servico: o.descricao_servico,
          pecas_utilizadas: o.pecas_utilizadas,
          horas_trabalhadas: o.horas_trabalhadas,
        })
      );

      for (const h of o.historico) {
        const usuario = userMap.get(h.usuarioEmail)!;
        await histRepo.save(
          histRepo.create({
            osId: saved.id,
            usuarioId: usuario.id,
            statusAnterior: h.statusAnterior,
            statusNovo: h.statusNovo,
            observacao: h.observacao,
            registradoEm: h.registradoEm,
          })
        );
      }

      for (const ap of o.apontamentos) {
        const tec = userMap.get(ap.tecnicoEmail)!;
        await apRepo.save(
          apRepo.create({
            osId: saved.id,
            tecnicoId: tec.id,
            inicioEm: ap.inicioEm,
            fimEm: ap.fimEm,
            observacao: ap.observacao,
            criadoEm: ap.criadoEm,
          })
        );
      }
    }

    if (dryRun) {
      throw new Error("__DRY_RUN_ROLLBACK__");
    }
  });
}

async function main() {
  const args = parseArgs();
  console.log("Config:", args);

  const rng = createRng(args.seed);

  await appDataSource.initialize();

  try {
    if (args.reset) {
      console.log("Removendo dados sintéticos anteriores...");
      await resetSyntheticData();
    }

    await assertNoCollisions();

    const users = generateUsers();
    const equipamentos = generateEquipamentos(rng, args.equipamentos);
    const ordens = generateOrdens(rng, equipamentos, users, args.ordens, args.meses);

    console.log(
      `Gerados: ${users.length} usuários, ${equipamentos.length} equipamentos, ${ordens.length} OS.`
    );

    try {
      await insertAll(users, equipamentos, ordens, args.dryRun);
      console.log(
        args.dryRun
          ? "Dry-run concluído (rollback aplicado — nada foi gravado)."
          : "Seed sintético aplicado com sucesso."
      );
    } catch (err) {
      if (args.dryRun && err instanceof Error && err.message === "__DRY_RUN_ROLLBACK__") {
        console.log("Dry-run concluído (rollback aplicado — nada foi gravado).");
      } else {
        throw err;
      }
    }

    console.log(`Senha padrão dos usuários sintéticos: ${SENHA_PADRAO}`);
  } finally {
    if (appDataSource.isInitialized) {
      await appDataSource.destroy();
    }
  }
}

main().catch((err) => {
  console.error("Falha ao executar seed sintético:", err);
  process.exit(1);
});
