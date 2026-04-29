import { Router } from "express";
import { HistoricoOSController } from "../controllers/HistoricoOSController.js";
import { ensureAuth } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ensureRole } from "../middleware/ensureRole.js";
import { Perfil } from "../types/usr_perfil.js";

const historicoRouter = Router();
const controller = new HistoricoOSController();

historicoRouter.get(
  "/",
  ensureAuth,
  ensureRole(Perfil.SUPERVISOR, Perfil.TECNICO, Perfil.GESTOR),
  asyncHandler(controller.getAll.bind(controller))
);

historicoRouter.get(
  "/ordem-servico/:osId",
  ensureAuth,
  ensureRole(Perfil.SUPERVISOR, Perfil.TECNICO, Perfil.GESTOR),
  asyncHandler(controller.getByOsId.bind(controller))
);

historicoRouter.get(
  "/usuario/:usuarioId",
  ensureAuth,
  ensureRole(Perfil.SUPERVISOR, Perfil.TECNICO, Perfil.GESTOR),
  asyncHandler(controller.getByUsuario.bind(controller))
);

historicoRouter.get(
  "/:id",
  ensureAuth,
  ensureRole(Perfil.SUPERVISOR, Perfil.TECNICO, Perfil.GESTOR),
  asyncHandler(controller.getById.bind(controller))
);

export { historicoRouter };
