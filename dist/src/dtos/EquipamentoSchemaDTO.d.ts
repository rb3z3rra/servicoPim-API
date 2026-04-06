import { z } from "zod";
export declare const createEquipamentoSchemaDTO: z.ZodObject<{
    codigo: z.ZodString;
    nome: z.ZodString;
    tipo: z.ZodString;
    localizacao: z.ZodString;
    fabricante: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    modelo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    ativo: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const updateEquipamentoSchemaDTO: z.ZodObject<{
    codigo: z.ZodOptional<z.ZodString>;
    nome: z.ZodOptional<z.ZodString>;
    tipo: z.ZodOptional<z.ZodString>;
    localizacao: z.ZodOptional<z.ZodString>;
    fabricante: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    modelo: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    ativo: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export type CreateEquipamentoSchemaDTO = z.infer<typeof createEquipamentoSchemaDTO>;
export type UpdateEquipamentoSchemaDTO = z.infer<typeof updateEquipamentoSchemaDTO>;
//# sourceMappingURL=EquipamentoSchemaDTO.d.ts.map