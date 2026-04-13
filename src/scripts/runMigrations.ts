import { appDataSource } from "../database/appDataSource.js";

async function run() {
  await appDataSource.initialize();
  await appDataSource.runMigrations();
  await appDataSource.destroy();
}

run().catch((error) => {
  console.error("Erro ao executar migrations:", error);
  process.exit(1);
});
