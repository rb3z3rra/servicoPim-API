import { Router } from "express";
import { OrdemServicoController } from "../controllers/OrdemServicoController.js";
import { ensureAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validarBody } from "../middleware/validarBody.js";
import { ensureRole } from "../middleware/ensureRole.js";
import {
  createOrdemServicoSchemaDTO,
  atribuirTecnicoSchemaDTO,
  atualizarStatusSchemaDTO,
  concluirOrdemServicoSchemaDTO,
} from "../dtos/OrdemServicoSchemaDTO.js";
import { Perfil } from "../types/usr_perfil.js";

const ordemServicoRoutes = Router();
const ordemServicoController = new OrdemServicoController();

ordemServicoRoutes.post(
  "/",
  ensureAuth,
  ensureRole(Perfil.SOLICITANTE, Perfil.SUPERVISOR),
  validarBody(createOrdemServicoSchemaDTO),
  asyncHandler(ordemServicoController.create.bind(ordemServicoController))
);

ordemServicoRoutes.get(
  "/",
  ensureAuth,
  asyncHandler(ordemServicoController.getAll.bind(ordemServicoController))
);

ordemServicoRoutes.get(
  "/:id",
  ensureAuth,
  asyncHandler(ordemServicoController.getById.bind(ordemServicoController))
);

ordemServicoRoutes.patch(
  "/:id/atribuir-tecnico",
  ensureAuth,
  ensureRole(Perfil.SUPERVISOR),
  validarBody(atribuirTecnicoSchemaDTO),
  asyncHandler(
    ordemServicoController.atribuirTecnico.bind(ordemServicoController)
  )
);

ordemServicoRoutes.patch(
  "/:id/status",
  ensureAuth,
  ensureRole(Perfil.TECNICO, Perfil.SUPERVISOR),
  validarBody(atualizarStatusSchemaDTO),
  asyncHandler(
    ordemServicoController.atualizarStatus.bind(ordemServicoController)
  )
);

ordemServicoRoutes.patch(
  "/:id/concluir",
  ensureAuth,
  ensureRole(Perfil.TECNICO, Perfil.SUPERVISOR),
  validarBody(concluirOrdemServicoSchemaDTO),
  asyncHandler(ordemServicoController.concluir.bind(ordemServicoController))
);

export { ordemServicoRoutes };
