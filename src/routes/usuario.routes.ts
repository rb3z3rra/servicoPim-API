import { Router } from "express";
import { UsuarioController } from "../controllers/UsuarioController.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validarBody } from "../middlewares/validarBody.js";
import { createUsuarioSchema, updateUsuarioSchema } from "../dtos/UsuarioSchemaDTO.js";

const usuarioRoutes = Router();
const usuarioController = new UsuarioController();

usuarioRoutes.post("/", validarBody(createUsuarioSchema), asyncHandler(usuarioController.create.bind(usuarioController)));
usuarioRoutes.get("/", authMiddleware, asyncHandler(usuarioController.getAll.bind(usuarioController)));
usuarioRoutes.get("/:id", authMiddleware, asyncHandler(usuarioController.getById.bind(usuarioController)));
usuarioRoutes.put("/:id", authMiddleware, validarBody(updateUsuarioSchema), asyncHandler(usuarioController.update.bind(usuarioController)));
usuarioRoutes.delete("/:id", authMiddleware, asyncHandler(usuarioController.delete.bind(usuarioController)));

export { usuarioRoutes };