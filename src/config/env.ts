import dotenv from "dotenv";

type EnvShape = {
  NODE_ENV: string;
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASS: string;
  DB_NAME: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  DB_LOGGING: boolean;
};

let dotenvLoaded = false;

function ensureDotenvLoaded() {
  if (!dotenvLoaded) {
    dotenv.config();
    dotenvLoaded = true;
  }
}

function getRequired(name: string): string {
  ensureDotenvLoaded();
  const value =
    process.env[name] ??
    (name === "JWT_ACCESS_SECRET" ? process.env.JWT_SECRET : undefined);

  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }

  return value;
}

function getNumber(name: string, defaultValue?: number): number {
  ensureDotenvLoaded();
  const raw = process.env[name];

  if (!raw && defaultValue !== undefined) {
    return defaultValue;
  }

  const value = Number(raw);
  if (Number.isNaN(value)) {
    throw new Error(`Variavel de ambiente invalida: ${name}`);
  }

  return value;
}

function getBoolean(name: string, defaultValue: boolean): boolean {
  ensureDotenvLoaded();
  const value = process.env[name];

  if (!value) {
    return defaultValue;
  }

  return value === "true";
}

export const env: EnvShape = {
  get NODE_ENV() {
    ensureDotenvLoaded();
    return process.env.NODE_ENV ?? "development";
  },
  get PORT() {
    return getNumber("PORT", 9090);
  },
  get DB_HOST() {
    return getRequired("DB_HOST");
  },
  get DB_PORT() {
    return getNumber("DB_PORT");
  },
  get DB_USER() {
    return getRequired("DB_USER");
  },
  get DB_PASS() {
    return getRequired("DB_PASS");
  },
  get DB_NAME() {
    return getRequired("DB_NAME");
  },
  get JWT_ACCESS_SECRET() {
    return getRequired("JWT_ACCESS_SECRET");
  },
  get JWT_REFRESH_SECRET() {
    return getRequired("JWT_REFRESH_SECRET");
  },
  get DB_LOGGING() {
    return getBoolean("DB_LOGGING", false);
  },
};

export function isTestEnv() {
  return env.NODE_ENV === "test";
}
