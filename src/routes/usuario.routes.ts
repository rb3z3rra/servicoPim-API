import { Router } from "express";
import { UsuarioController } from "../controllers/UsuarioController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validarBody } from "../middleware/validarBody.js";
import {  createUserSchemaDTO,  updateUserSchemaDTO,} from "../dtos/CreateUserSchemaDTO.js";

const usuarioRoutes = Router();
const usuarioController = new UsuarioController();

usuarioRoutes.post("/",  validarBody(createUserSchemaDTO),
  asyncHandler(usuarioController.create.bind(usuarioController))
);

usuarioRoutes.get("/",  authMiddleware,
  asyncHandler(usuarioController.getAll.bind(usuarioController))
);

usuarioRoutes.get("/:id",  authMiddleware,
  asyncHandler(usuarioController.getById.bind(usuarioController))
);

usuarioRoutes.put("/:id",  authMiddleware,
  validarBody(updateUserSchemaDTO),
  asyncHandler(usuarioController.update.bind(usuarioController))
);

usuarioRoutes.delete("/:id",  authMiddleware,
  asyncHandler(usuarioController.delete.bind(usuarioController))
);

export { usuarioRoutes };