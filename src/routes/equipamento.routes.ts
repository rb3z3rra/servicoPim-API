import { Router } from "express";
import { EquipamentoController } from "../controllers/EquipamentoController.js";
import { ensureAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validarBody } from "../middleware/validarBody.js";
import { ensureRole } from "../middleware/ensureRole.js";
import {  createEquipamentoSchemaDTO,  updateEquipamentoSchemaDTO,
} from "../dtos/EquipamentoSchemaDTO.js";
import { Perfil } from "../types/usr_perfil.js";

const equipamentoRoutes = Router();
const equipamentoController = new EquipamentoController();

equipamentoRoutes.post(
  "/",
  ensureAuth,
  ensureRole(Perfil.SUPERVISOR, Perfil.TECNICO),
  validarBody(createEquipamentoSchemaDTO),
  asyncHandler(equipamentoController.create.bind(equipamentoController))
);

equipamentoRoutes.get(
  "/",
  ensureAuth,
  asyncHandler(equipamentoController.getAll.bind(equipamentoController))
);

equipamentoRoutes.get(
  "/:id",
  ensureAuth,
  asyncHandler(equipamentoController.getById.bind(equipamentoController))
);

equipamentoRoutes.put(
  "/:id",
  ensureAuth,
  ensureRole(Perfil.SUPERVISOR, Perfil.TECNICO),
  validarBody(updateEquipamentoSchemaDTO),
  asyncHandler(equipamentoController.update.bind(equipamentoController))
);

equipamentoRoutes.delete(
  "/:id",
  ensureAuth,
  ensureRole(Perfil.SUPERVISOR),
  asyncHandler(equipamentoController.delete.bind(equipamentoController))
);

export { equipamentoRoutes };
