import { DataSource } from "typeorm";
import { Equipamento } from "../entities/Equipamento.js";
import { OrdemServico } from "../entities/OrdemServico.js";
import { Usuario } from "../entities/Usuario.js";
import { HistoricoOS } from "../entities/HistoricoOS.js";
import { ApontamentoOS } from "../entities/ApontamentoOS.js";
import { RefreshToken } from "../entities/RefreshToken.js";
import { env } from "../config/env.js";
import { InitialSchema1712799600000 } from "./migrations/1712799600000-InitialSchema.js";
import { AddUsuarioMatricula1712983500000 } from "./migrations/1712983500000-AddUsuarioMatricula.js";
import { AddEquipamentoMetadata1713060000000 } from "./migrations/1713060000000-AddEquipamentoMetadata.js";
import { CreateApontamentoOSTable1713070000000 } from "./migrations/1713070000000-CreateApontamentoOSTable.js";
import { CreateRefreshTokenTable1713080000000 } from "./migrations/1713080000000-CreateRefreshTokenTable.js";

export const appDataSource = new DataSource({
  type: "postgres",
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  entities: [Equipamento, OrdemServico, Usuario, HistoricoOS, ApontamentoOS, RefreshToken],
  migrations: [
    InitialSchema1712799600000,
    AddUsuarioMatricula1712983500000,
    AddEquipamentoMetadata1713060000000,
    CreateApontamentoOSTable1713070000000,
    CreateRefreshTokenTable1713080000000,
  ],
  logging: env.DB_LOGGING,
  synchronize: false,
});
