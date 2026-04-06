import { DataSource } from "typeorm";
import dotenv from "dotenv";
// importando as entidades para o DataSource
import { Equipamento } from "../entities/Equipamento.js";
import { OrdemServico } from "../entities/OrdemServico.js";
import { Usuario } from "../entities/Usuario.js";
dotenv.config();
export const appDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: [Equipamento, OrdemServico, Usuario],
    logging: true,
    synchronize: process.env.NODE_ENV !== "production",
});
//# sourceMappingURL=appDataSource.js.map