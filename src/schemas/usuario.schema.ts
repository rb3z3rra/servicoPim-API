import { z } from "zod";
import { Perfil } from "../types/usr_perfil.js";

export const createUsuarioSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.email("Email inválido"),
  senha_hash: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  perfil: z.enum(Perfil),
  setor: z.string().min(2, "Setor deve ter no mínimo 2 caracteres"),
  ativo: z.boolean().optional(),
});

export const updateUsuarioSchema = z.object({
  nome: z.string().min(3).optional(),
  email: z.email().optional(),
  senha_hash: z.string().min(6).optional(),
  perfil: z.enum(Perfil).optional(),
  setor: z.string().min(2).optional(),
  ativo: z.boolean().optional(),
});