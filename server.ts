import express from "express";
import { appDataSource } from "./src/database/appDataSource.js";
import { usuarioRoutes } from "./src/routes/usuario.routes.js";
import { equipamentoRoutes } from "./src/routes/equipamento.routes.js";
import { ordemServicoRoutes } from "./src/routes/ordemServico.routes.js";
import { authRoutes } from "./src/routes/auth.routes.js";
import { historicoRouter } from "./src/routes/HistoricoOSroutes.js";
import { errorMiddleware } from "./src/middleware/errorMiddleware.js";

//libs de segurança e performance
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from 'compression';

// morgan e fs para logs
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Em ES Modules, precisamos definir __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- CONFIGURAÇÃO DO MORGAN ---
// 1. Criar a pasta 'logs' automaticamente caso ela não exista
// Usamos process.cwd() para garantir que a pasta logs seja criada na raiz do projeto,
// mesmo quando rodando a versão compilada dentro da pasta 'dist' no Docker.
const logDirectory = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

// 2. Definir o local e a permissão de onde o arquivo de texto será gerado
const accessLogStream = fs.createWriteStream(
    path.join(logDirectory, 'access.log'), 
    { flags: 'a' } // O 'a' garante que novos logs sejam empilhados sem apagar os antigos
);

// 3. Salvar o log completo das requisições no arquivo local
app.use(morgan('combined', { stream: accessLogStream }));

// 4. (Opcional) Printar o log colorido e simplificado no terminal do seu editor
app.use(morgan('dev'));
// ------------------------------

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
}));

app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(compression({ threshold: 1024 }))

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/equipamentos", equipamentoRoutes);
app.use("/ordens-servico", ordemServicoRoutes);
app.use("/historico-os", historicoRouter);
app.get("/teste", (req, res) => {
  res.send("mudou");
});

app.use(errorMiddleware);

const PORT = 9090;

if (process.env.NODE_ENV !== 'test') {
  appDataSource.initialize()
    .then(() => {
      console.log("Banco conectado com sucesso!");

      app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
      });
    })
    .catch((error) => {
      console.error("Erro ao conectar no banco:", error);
    });
}

export { app };