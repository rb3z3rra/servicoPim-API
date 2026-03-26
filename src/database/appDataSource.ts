import { DataSource } from "typeorm";
import dotenv from "dotenv";

// immportar entities
import { Equipamento } from "../entities/Equipamento.js";
import { OrdemServico } from "../entities/OrdemServico.js";
import { Usuario } from "../entities/Usuario.js";

dotenv.config();

export const appDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST as string,
    port: Number(process.env.DB_PORT as string),
    username: process.env.DN_USER as string,
    password: process.env.DB_PASS as string,
    database: process.env.DB_NAME as string,

    entities: [Equipamento, OrdemServico, Usuario],

    logging: true,
    synchronize: process.env.NODE_ENV !== "production",

});

