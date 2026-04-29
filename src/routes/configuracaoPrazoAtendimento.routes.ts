import { Router } from "express";
import { ensureAuth } from "../middleware/authMiddleware.js";
import { ensureRole } from "../middleware/ensureRole.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validarBody } from "../middleware/validarBody.js";
import { ConfiguracaoPrazoAtendimentoController } from "../controllers/ConfiguracaoPrazoAtendimentoController.js";
import { updateConfiguracaoPrazoAtendimentoSchemaDTO } from "../dtos/ConfiguracaoPrazoAtendimentoSchemaDTO.js";
import { Perfil } from "../types/usr_perfil.js";

const configuracaoPrazoAtendimentoRoutes = Router();
const configuracaoPrazoAtendimentoController = new ConfiguracaoPrazoAtendimentoController();

configuracaoPrazoAtendimentoRoutes.get(
  "/",
  ensureAuth,
  ensureRole(Perfil.GESTOR),
  asyncHandler(configuracaoPrazoAtendimentoController.getAll.bind(configuracaoPrazoAtendimentoController))
);

configuracaoPrazoAtendimentoRoutes.put(
  "/:prioridade",
  ensureAuth,
  ensureRole(Perfil.GESTOR),
  validarBody(updateConfiguracaoPrazoAtendimentoSchemaDTO),
  asyncHandler(configuracaoPrazoAtendimentoController.update.bind(configuracaoPrazoAtendimentoController))
);

export { configuracaoPrazoAtendimentoRoutes };
