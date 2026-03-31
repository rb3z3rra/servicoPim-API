import { Router } from "express";
import { EquipamentoController } from "../controllers/EquipamentoController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { validarBody } from "../middlewares/validarBody.js";
import { createEquipamentoSchema, updateEquipamentoSchema } from "../dtos/EquipamentoSchemaDTO.js";

const equipamentoRoutes = Router();
const equipamentoController = new EquipamentoController();

equipamentoRoutes.post( "/",  authMiddleware, validarBody(createEquipamentoSchema), asyncHandler(equipamentoController.create.bind(equipamentoController)));

equipamentoRoutes.get("/", authMiddleware, asyncHandler(equipamentoController.getAll.bind(equipamentoController)));

equipamentoRoutes.get("/:id", authMiddleware, asyncHandler(equipamentoController.getById.bind(equipamentoController)));

equipamentoRoutes.put("/:id", authMiddleware, validarBody(updateEquipamentoSchema), asyncHandler(equipamentoController.update.bind(equipamentoController)));

equipamentoRoutes.delete("/:id", authMiddleware, asyncHandler(equipamentoController.delete.bind(equipamentoController)));
  
export { equipamentoRoutes };