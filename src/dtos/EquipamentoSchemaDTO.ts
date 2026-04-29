import { z } from "zod";

export const createEquipamentoSchemaDTO = z.object({
  codigo: z.string().trim().min(2).max(100).optional(),
  nome: z.string().trim().min(2).max(255),
  tipo: z.string().trim().min(2).max(100),
  localizacao: z.string().trim().min(2).max(255),
  setor: z.string().trim().min(2).max(100).optional(),
  numero_patrimonio: z.string().trim().max(100).optional().nullable(),
  fabricante: z.string().trim().max(255).optional().nullable(),
  modelo: z.string().trim().max(255).optional().nullable(),
  ultima_revisao: z.string().date().optional().nullable(),
  ativo: z.boolean().optional(),
});

export const updateEquipamentoSchemaDTO =
  createEquipamentoSchemaDTO.partial();

const parseBooleanQuery = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return value;
}, z.boolean().optional());

export const listarEquipamentosQuerySchemaDTO = z.object({
  busca: z.string().trim().max(255).optional(),
  setor: z.string().trim().max(100).optional(),
  ativo: parseBooleanQuery,
  comOsAbertas: parseBooleanQuery,
});

export type CreateEquipamentoSchemaDTO = z.infer<
  typeof createEquipamentoSchemaDTO
>;
export type UpdateEquipamentoSchemaDTO = z.infer<
  typeof updateEquipamentoSchemaDTO
>;
export type ListarEquipamentosQuerySchemaDTO = z.infer<
  typeof listarEquipamentosQuerySchemaDTO
>;
