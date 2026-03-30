import { z } from "zod";

export const createEquipamentoSchema = z.object({
  codigo: z.string().min(2, "Código obrigatório"),
  nome: z.string().min(2, "Nome obrigatório"),
  tipo: z.string().min(2, "Tipo obrigatório"),
  localizacao: z.string().min(2, "Localização obrigatória"),
  fabricante: z.string().optional(),
  modelo: z.string().optional(),
  ativo: z.boolean().optional(),
});

export const updateEquipamentoSchema = z.object({
  codigo: z.string().min(2).optional(),
  nome: z.string().min(2).optional(),
  tipo: z.string().min(2).optional(),
  localizacao: z.string().min(2).optional(),
  fabricante: z.string().optional(),
  modelo: z.string().optional(),
  ativo: z.boolean().optional(),
});