import { Router } from "express";
import { HistoricoOSController } from "../controllers/HistoricoOSController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const historicoRouter = Router();
const controller = new HistoricoOSController();

historicoRouter.get("/",  authMiddleware,
  asyncHandler(controller.getAll.bind(controller))
);

historicoRouter.get("/ordem-servico/:osId",   authMiddleware,
  asyncHandler(controller.getByOsId.bind(controller))
);

historicoRouter.get("/usuario/:usuarioId",  authMiddleware,
  asyncHandler(controller.getByUsuario.bind(controller))
);

historicoRouter.get("/:id", authMiddleware,
  asyncHandler(controller.getById.bind(controller))
);

export { historicoRouter };