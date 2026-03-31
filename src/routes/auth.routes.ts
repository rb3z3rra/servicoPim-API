import { Router } from "express";
import { AuthController } from "../controllers/AuthController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validarBody } from "../middleware/validarBody.js";
import { loginSchemaDTO } from "../dtos/AuthDTO.js";

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post("/login",  validarBody(loginSchemaDTO),
  asyncHandler(authController.login.bind(authController))
);

export { authRoutes };