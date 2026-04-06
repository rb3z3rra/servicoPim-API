import { Router } from "express";
import { OrdemServicoController } from "../controllers/OrdemServicoController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validarBody } from "../middleware/validarBody.js";
import { createOrdemServicoSchemaDTO, atribuirTecnicoSchemaDTO, atualizarStatusSchemaDTO, concluirOrdemServicoSchemaDTO, } from "../dtos/OrdemServicoSchemaDTO.js";
const ordemServicoRoutes = Router();
const ordemServicoController = new OrdemServicoController();
ordemServicoRoutes.post("/", authMiddleware, validarBody(createOrdemServicoSchemaDTO), asyncHandler(ordemServicoController.create.bind(ordemServicoController)));
ordemServicoRoutes.get("/", authMiddleware, asyncHandler(ordemServicoController.getAll.bind(ordemServicoController)));
ordemServicoRoutes.get("/:id", authMiddleware, asyncHandler(ordemServicoController.getById.bind(ordemServicoController)));
ordemServicoRoutes.patch("/:id/atribuir-tecnico", authMiddleware, validarBody(atribuirTecnicoSchemaDTO), asyncHandler(ordemServicoController.atribuirTecnico.bind(ordemServicoController)));
ordemServicoRoutes.patch("/:id/status", authMiddleware, validarBody(atualizarStatusSchemaDTO), asyncHandler(ordemServicoController.atualizarStatus.bind(ordemServicoController)));
ordemServicoRoutes.patch("/:id/concluir", authMiddleware, validarBody(concluirOrdemServicoSchemaDTO), asyncHandler(ordemServicoController.concluir.bind(ordemServicoController)));
export { ordemServicoRoutes };
//# sourceMappingURL=ordemServico.routes.js.map