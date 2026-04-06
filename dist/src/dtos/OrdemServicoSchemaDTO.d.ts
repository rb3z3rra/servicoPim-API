import { z } from "zod";
import { Prioridade } from "../types/os_prioridade.js";
import { TipoManutencao } from "../types/os_tipoManutencao.js";
import { StatusOs } from "../types/os_status.js";
export declare const createOrdemServicoSchemaDTO: z.ZodObject<{
    equipamentoId: z.ZodNumber;
    solicitanteId: z.ZodUUID;
    tipo_manutencao: z.ZodEnum<typeof TipoManutencao>;
    prioridade: z.ZodEnum<typeof Prioridade>;
    descricao_falha: z.ZodString;
}, z.core.$strip>;
export declare const atribuirTecnicoSchemaDTO: z.ZodObject<{
    tecnicoId: z.ZodUUID;
}, z.core.$strip>;
export declare const atualizarStatusSchemaDTO: z.ZodObject<{
    status: z.ZodEnum<typeof StatusOs>;
}, z.core.$strip>;
export declare const concluirOrdemServicoSchemaDTO: z.ZodObject<{
    descricao_servico: z.ZodString;
    pecas_utilizadas: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    horas_trabalhadas: z.ZodNumber;
}, z.core.$strip>;
export type CreateOrdemServicoSchemaDTO = z.infer<typeof createOrdemServicoSchemaDTO>;
export type AtribuirTecnicoSchemaDTO = z.infer<typeof atribuirTecnicoSchemaDTO>;
export type AtualizarStatusSchemaDTO = z.infer<typeof atualizarStatusSchemaDTO>;
export type ConcluirOrdemServicoSchemaDTO = z.infer<typeof concluirOrdemServicoSchemaDTO>;
//# sourceMappingURL=OrdemServicoSchemaDTO.d.ts.map