import { Router } from "express";
import { UsuarioController } from "../controllers/UsuarioController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ensureAuth } from "../middleware/authMiddleware.js";
import { ensureRole } from "../middleware/ensureRole.js";
import { validarBody } from "../middleware/validarBody.js";
import { createUserSchemaDTO, updateUserSchemaDTO } from "../dtos/CreateUserSchemaDTO.js";
import { Perfil } from "../types/usr_perfil.js";


const usuarioRoutes = Router();
const usuarioController = new UsuarioController();

// POST /usuarios — apenas SUPERVISOR pode criar usuários
usuarioRoutes.post("/",
  ensureAuth,
  ensureRole(Perfil.SUPERVISOR),
  validarBody(createUserSchemaDTO),
  asyncHandler(usuarioController.create.bind(usuarioController))
);

// GET /usuarios — apenas SUPERVISOR pode listar todos os usuários
usuarioRoutes.get("/",
  ensureAuth,
  ensureRole(Perfil.SUPERVISOR),
  asyncHandler(usuarioController.getAll.bind(usuarioController))
);

usuarioRoutes.get("/:id/detalhes",
  ensureAuth,
  ensureRole(Perfil.SUPERVISOR),
  asyncHandler(usuarioController.getDetails.bind(usuarioController))
);

// GET /usuarios/:id — apenas SUPERVISOR pode buscar outro usuário pelo id
usuarioRoutes.get("/:id",
  ensureAuth,
  ensureRole(Perfil.SUPERVISOR),
  asyncHandler(usuarioController.getById.bind(usuarioController))
);

// PUT /usuarios/:id — SUPERVISOR edita qualquer um; usuário edita a si mesmo (verificado no controller)
usuarioRoutes.put("/:id",
  ensureAuth,
  validarBody(updateUserSchemaDTO),
  asyncHandler(usuarioController.update.bind(usuarioController))
);

// DELETE /usuarios/:id — apenas SUPERVISOR pode excluir
usuarioRoutes.delete("/:id",
  ensureAuth,
  ensureRole(Perfil.SUPERVISOR),
  asyncHandler(usuarioController.delete.bind(usuarioController))
);

export { usuarioRoutes };
