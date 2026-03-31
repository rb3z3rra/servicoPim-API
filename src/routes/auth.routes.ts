import { Router } from "express";
import { AuthController } from "../controllers/AuthController.js";

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post("/login", (req, res) => authController.login(req, res));
authRoutes.post("/refresh", (req, res) => authController.refreshToken(req, res));

export { authRoutes };