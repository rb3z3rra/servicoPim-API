import { Router } from "express";
import { OrdemServicoController } from "../controllers/OrdemServicoController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const ordemServicoRoutes = Router();
const ordemServicoController = new OrdemServicoController();

ordemServicoRoutes.post( "/",  authMiddleware,  asyncHandler(ordemServicoController.create.bind(ordemServicoController)));

ordemServicoRoutes.get("/", authMiddleware, asyncHandler(ordemServicoController.getAll.bind(ordemServicoController)));

ordemServicoRoutes.get("/:id", authMiddleware, asyncHandler(ordemServicoController.getById.bind(ordemServicoController)));

ordemServicoRoutes.patch("/:id/atribuir-tecnico", authMiddleware, asyncHandler(ordemServicoController.atribuirTecnico.bind(ordemServicoController)));

ordemServicoRoutes.patch("/:id/status", authMiddleware, asyncHandler(ordemServicoController.atualizarStatus.bind(ordemServicoController)));
  
ordemServicoRoutes.patch("/:id/concluir", authMiddleware, asyncHandler(ordemServicoController.concluir.bind(ordemServicoController)));

export { ordemServicoRoutes };