import { z } from "zod";
import { Perfil } from "../types/usr_perfil.js";
export declare const createUserSchemaDTO: z.ZodObject<{
    nome: z.ZodString;
    email: z.ZodEmail;
    senha_hash: z.ZodString;
    perfil: z.ZodEnum<typeof Perfil>;
    setor: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ativo: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const updateUserSchemaDTO: z.ZodObject<{
    nome: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodEmail>;
    senha_hash: z.ZodOptional<z.ZodString>;
    perfil: z.ZodOptional<z.ZodEnum<typeof Perfil>>;
    setor: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    ativo: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export type CreateUserSchemaDTO = z.infer<typeof createUserSchemaDTO>;
export type UpdateUserSchemaDTO = z.infer<typeof updateUserSchemaDTO>;
//# sourceMappingURL=CreateUserSchemaDTO.d.ts.map