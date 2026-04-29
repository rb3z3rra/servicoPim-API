import { z } from "zod";

export const updateConfiguracaoPrazoAtendimentoSchemaDTO = z.object({
  horas_limite: z.number().int().min(1).max(720),
  ativo: z.boolean().optional(),
});

export type UpdateConfiguracaoPrazoAtendimentoSchemaDTO = z.infer<
  typeof updateConfiguracaoPrazoAtendimentoSchemaDTO
>;
