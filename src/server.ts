import { appDataSource } from "./database/appDataSource.js";
import { app } from "./app.js";
import { env, isTestEnv } from "./config/env.js";

export async function startServer() {
  await appDataSource.initialize();
  await appDataSource.runMigrations();

  return app.listen(env.PORT, () => {
    console.log(`Servidor rodando na porta ${env.PORT}`);
  });
}

if (!isTestEnv()) {
  startServer().catch((error) => {
    console.error("Erro ao iniciar a aplicacao:", error);
    process.exit(1);
  });
}

export { app };
