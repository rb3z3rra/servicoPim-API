import { Router } from "express";
import { EquipamentoController } from "../controllers/EquipamentoController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const equipamentoRoutes = Router();
const equipamentoController = new EquipamentoController();

equipamentoRoutes.post( "/",  authMiddleware,  asyncHandler(equipamentoController.create.bind(equipamentoController)));

equipamentoRoutes.get("/", authMiddleware, asyncHandler(equipamentoController.getAll.bind(equipamentoController)));

equipamentoRoutes.get("/:id", authMiddleware, asyncHandler(equipamentoController.getById.bind(equipamentoController)));

equipamentoRoutes.put("/:id", authMiddleware, asyncHandler(equipamentoController.update.bind(equipamentoController)));

equipamentoRoutes.delete("/:id", authMiddleware, asyncHandler(equipamentoController.delete.bind(equipamentoController)));
  
export { equipamentoRoutes };