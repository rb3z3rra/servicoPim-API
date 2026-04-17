import { z } from "zod";

export const listarHistoricoQuerySchemaDTO = z.object({
  busca: z.string().trim().max(255).optional(),
  statusNovo: z.string().trim().max(50).optional(),
  prioridade: z.string().trim().max(50).optional(),
  usuarioId: z.string().uuid().optional(),
  osId: z.string().uuid().optional(),
  dataInicio: z.string().date().optional(),
  dataFim: z.string().date().optional(),
});

export type ListarHistoricoQuerySchemaDTO = z.infer<
  typeof listarHistoricoQuerySchemaDTO
>;
