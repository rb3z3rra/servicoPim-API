import { z } from "zod";
import { Prioridade } from "../types/os_prioridade.js";
import { TipoManutencao } from "../types/os_tipoManutencao.js";
import { StatusOs } from "../types/os_status.js";

export const createOrdemServicoSchema = z.object({
  equipamentoId: z.number("equipamentoId deve ser número"),
  solicitanteId: z.uuid("solicitanteId inválido"),
  tipo_manutencao: z.enum(TipoManutencao),
  prioridade: z.enum(Prioridade),
  descricao_falha: z.string().min(5, "Descrição da falha muito curta"),
});

export const atribuirTecnicoSchema = z.object({
  tecnicoId: z.uuid("tecnicoId inválido"),
});

export const atualizarStatusSchema = z.object({
  status: z.enum(StatusOs),
});

export const concluirOrdemServicoSchema = z.object({
  descricao_servico: z.string().min(5, "Descrição do serviço muito curta"),
  pecas_utilizadas: z.string().optional(),
  horas_trabalhadas: z.number().positive("Horas trabalhadas deve ser maior que zero"),
});