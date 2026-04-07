import { z } from "zod";

export const loginSchemaDTO = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export const refreshTokenSchemaDTO = z.object({
  refreshToken: z.string().min(1, "O Refresh Token é obrigatório"),
});

export type LoginSchemaDTO = z.infer<typeof loginSchemaDTO>;
export type RefreshTokenSchemaDTO = z.infer<typeof refreshTokenSchemaDTO>;