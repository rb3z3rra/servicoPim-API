import { DataSource } from "typeorm";
import dotenv from "dotenv";

// importando as entidades para o DataSource
import { Equipamento } from "../entities/Equipamento.js";
import { OrdemServico } from "../entities/OrdemServico.js";
import { Usuario } from "../entities/Usuario.js";

dotenv.config();

export const appDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "postgres",
  database: process.env.DB_NAME || "servicopim",

  entities: [Equipamento, OrdemServico, Usuario],
  logging: true,
  synchronize: process.env.NODE_ENV !== "production",

});

