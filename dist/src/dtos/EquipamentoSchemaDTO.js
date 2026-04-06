import { z } from "zod";
export const createEquipamentoSchemaDTO = z.object({
    codigo: z.string().trim().min(2).max(100),
    nome: z.string().trim().min(2).max(255),
    tipo: z.string().trim().min(2).max(100),
    localizacao: z.string().trim().min(2).max(255),
    fabricante: z.string().trim().max(255).optional().nullable(),
    modelo: z.string().trim().max(255).optional().nullable(),
    ativo: z.boolean().optional(),
});
export const updateEquipamentoSchemaDTO = createEquipamentoSchemaDTO.partial();
//# sourceMappingURL=EquipamentoSchemaDTO.js.map