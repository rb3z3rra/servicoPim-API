import { z } from "zod";
import { Perfil } from "../types/usr_perfil.js";

export const createUserSchemaDTO = z.object({
  nome: z.string().trim().min(3).max(255),
  email: z.email("Email inválido"),
  matricula: z.string().trim().min(3).max(50),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  perfil: z.enum(Perfil),
  setor: z.string().trim().min(2).max(255).nullable().optional(),
  ativo: z.boolean().optional(),
});

export const updateUserSchemaDTO = createUserSchemaDTO.partial();

export type CreateUserSchemaDTO = z.infer<typeof createUserSchemaDTO>;
export type UpdateUserSchemaDTO = z.infer<typeof updateUserSchemaDTO>;
