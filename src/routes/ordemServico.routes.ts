import { Router } from "express";
import { OrdemServicoController } from "../controllers/OrdemServicoController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { validarBody } from "../middlewares/validarBody.js";
import { createOrdemServicoSchema, atribuirTecnicoSchema, atualizarStatusSchema, concluirOrdemServicoSchema } from "../dtos/OrdemServicoSchemaDTO.js";

const ordemServicoRoutes = Router();
const ordemServicoController = new OrdemServicoController();

ordemServicoRoutes.post( "/",  authMiddleware, validarBody(createOrdemServicoSchema), asyncHandler(ordemServicoController.create.bind(ordemServicoController)));

ordemServicoRoutes.get("/", authMiddleware, asyncHandler(ordemServicoController.getAll.bind(ordemServicoController)));

ordemServicoRoutes.get("/:id", authMiddleware, asyncHandler(ordemServicoController.getById.bind(ordemServicoController)));

ordemServicoRoutes.patch("/:id/atribuir-tecnico", authMiddleware, validarBody(atribuirTecnicoSchema), asyncHandler(ordemServicoController.atribuirTecnico.bind(ordemServicoController)));

ordemServicoRoutes.patch("/:id/status", authMiddleware, validarBody(atualizarStatusSchema), asyncHandler(ordemServicoController.atualizarStatus.bind(ordemServicoController)));
  
ordemServicoRoutes.patch("/:id/concluir", authMiddleware, validarBody(concluirOrdemServicoSchema), asyncHandler(ordemServicoController.concluir.bind(ordemServicoController)));

export { ordemServicoRoutes };