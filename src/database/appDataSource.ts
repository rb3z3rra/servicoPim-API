import { DataSource } from "typeorm";
import dotenv from "dotenv";

// importando as entidades para o DataSource
import { Equipamento } from "../entities/Equipamento.js";
import { OrdemServico } from "../entities/OrdemServico.js";
import { Usuario } from "../entities/Usuario.js";
import { HistoricoOS } from "../entities/HistoricoOS.js";

dotenv.config();

export const appDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST  as string,
  port: Number(process.env.DB_PORT as string),
  username: process.env.DB_USER as string,
  password: process.env.DB_PASS as string,
  database: process.env.DB_NAME as string,

  entities: [Equipamento, OrdemServico, Usuario,  HistoricoOS],
  logging: true,
  synchronize: process.env.NODE_ENV !== "production",

});

