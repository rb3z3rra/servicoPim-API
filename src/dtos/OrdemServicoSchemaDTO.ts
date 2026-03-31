import { z } from "zod";
import { Prioridade } from "../types/os_prioridade.js";
import { TipoManutencao } from "../types/os_tipoManutencao.js";
import { StatusOs } from "../types/os_status.js";

export const createOrdemServicoSchemaDTO = z.object({
  equipamentoId: z.number().int().positive(),
  solicitanteId: z.uuid(),
  tipo_manutencao: z.enum(TipoManutencao),
  prioridade: z.enum(Prioridade),
  descricao_falha: z.string().trim().min(5).max(1000),
});

export const atribuirTecnicoSchemaDTO = z.object({
  tecnicoId: z.uuid(),
});

export const atualizarStatusSchemaDTO = z.object({
  status: z.enum(StatusOs),
});

export const concluirOrdemServicoSchemaDTO = z.object({
  descricao_servico: z.string().trim().min(5).max(1000),
  pecas_utilizadas: z.string().trim().max(1000).optional().nullable(),
  horas_trabalhadas: z.number().positive(),
});

export type CreateOrdemServicoSchemaDTO = z.infer<
  typeof createOrdemServicoSchemaDTO
>;
export type AtribuirTecnicoSchemaDTO = z.infer<
  typeof atribuirTecnicoSchemaDTO
>;
export type AtualizarStatusSchemaDTO = z.infer<
  typeof atualizarStatusSchemaDTO
>;
export type ConcluirOrdemServicoSchemaDTO = z.infer<
  typeof concluirOrdemServicoSchemaDTO
>;