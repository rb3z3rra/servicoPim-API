import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: 'servicopim',
  password: 'admin',
  port: 5433,
});

async function test() {
  try {
    await client.connect();
    console.log("Conectado com SUCESSO!");
    await client.end();
  } catch (err) {
    console.error("ERRO na conexão:", err.message);
    process.exit(1);
  }
}

test();
