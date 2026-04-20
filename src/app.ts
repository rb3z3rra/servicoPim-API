import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import morgan from "morgan";
import { authRoutes } from "./routes/auth.routes.js";
import { usuarioRoutes } from "./routes/usuario.routes.js";
import { equipamentoRoutes } from "./routes/equipamento.routes.js";
import { ordemServicoRoutes } from "./routes/ordemServico.routes.js";
import { historicoRouter } from "./routes/HistoricoOSroutes.js";
import { dashboardRoutes } from "./routes/dashboard.routes.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { isTestEnv } from "./config/env.js";

export function createApp() {
  const app = express();
  app.disable("etag");

  const loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Muitas tentativas de login. Tente novamente em alguns minutos." },
  });

  const apiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === "/auth/login",
    message: { message: "Muitas requisições. Aguarde alguns instantes e tente novamente." },
  });

  if (!isTestEnv()) {
    app.use(morgan("dev"));
  }

  if (process.env.DISABLE_RATE_LIMIT !== "true") {
    app.use("/auth/login", loginRateLimit);
    app.use(apiRateLimit);
  } else {
    console.log(">>> RATE LIMIT DESATIVADO (DISABLE_RATE_LIMIT=true)");
  }

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );

  app.use(compression({ threshold: 1024 }));
  app.use(express.json());

  app.use((req, res, next) => {
    if (req.path === "/health") {
      return next();
    }

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/auth", authRoutes);
  app.use("/usuarios", usuarioRoutes);
  app.use("/equipamentos", equipamentoRoutes);
  app.use("/ordens-servico", ordemServicoRoutes);
  app.use("/historico-os", historicoRouter);
  app.use("/dashboard", dashboardRoutes);
  app.use(errorMiddleware);

  return app;
}

export const app = createApp();
