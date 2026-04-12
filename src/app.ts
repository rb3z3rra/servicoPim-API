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
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { isTestEnv } from "./config/env.js";

export function createApp() {
  const app = express();

  if (!isTestEnv()) {
    app.use(morgan("dev"));
  }

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );

  app.use(compression({ threshold: 1024 }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/auth", authRoutes);
  app.use("/usuarios", usuarioRoutes);
  app.use("/equipamentos", equipamentoRoutes);
  app.use("/ordens-servico", ordemServicoRoutes);
  app.use("/historico-os", historicoRouter);
  app.use(errorMiddleware);

  return app;
}

export const app = createApp();
