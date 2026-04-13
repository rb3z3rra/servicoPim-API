import { DataSource } from "typeorm";
import { Equipamento } from "../entities/Equipamento.js";
import { OrdemServico } from "../entities/OrdemServico.js";
import { Usuario } from "../entities/Usuario.js";
import { HistoricoOS } from "../entities/HistoricoOS.js";
import { env } from "../config/env.js";
import { InitialSchema1712799600000 } from "./migrations/1712799600000-InitialSchema.js";
import { AddUsuarioMatricula1712983500000 } from "./migrations/1712983500000-AddUsuarioMatricula.js";

export const appDataSource = new DataSource({
  type: "postgres",
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  entities: [Equipamento, OrdemServico, Usuario, HistoricoOS],
  migrations: [InitialSchema1712799600000, AddUsuarioMatricula1712983500000],
  logging: env.DB_LOGGING,
  synchronize: false,
});
