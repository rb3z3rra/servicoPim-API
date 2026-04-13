import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1712799600000 implements MigrationInterface {
  name = "InitialSchema1712799600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usuario_perfil_enum') THEN
          CREATE TYPE "usuario_perfil_enum" AS ENUM ('SOLICITANTE', 'TÉCNICO', 'SUPERVISOR');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ordem_servico_tipo_manutencao_enum') THEN
          CREATE TYPE "ordem_servico_tipo_manutencao_enum" AS ENUM ('PREVENTIVA', 'CORRETIVA', 'PREDITIVA');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ordem_servico_prioridade_enum') THEN
          CREATE TYPE "ordem_servico_prioridade_enum" AS ENUM ('BAIXA', 'MÉDIA', 'ALTA', 'CRÍTICA');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ordem_servico_status_enum') THEN
          CREATE TYPE "ordem_servico_status_enum" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_PECA', 'CONCLUIDA', 'CANCELADA');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "equipamento" (
        "id" SERIAL NOT NULL,
        "codigo" character varying NOT NULL,
        "nome" character varying NOT NULL,
        "tipo" character varying NOT NULL,
        "localizacao" character varying NOT NULL,
        "fabricante" character varying,
        "modelo" character varying,
        "ativo" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_equipamento_codigo" UNIQUE ("codigo"),
        CONSTRAINT "PK_equipamento_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "usuario" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "nome" character varying NOT NULL,
        "email" character varying NOT NULL,
        "senha_hash" character varying NOT NULL,
        "perfil" "usuario_perfil_enum" NOT NULL DEFAULT 'SOLICITANTE',
        "setor" character varying,
        "ativo" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_usuario_email" UNIQUE ("email"),
        CONSTRAINT "PK_usuario_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE SEQUENCE IF NOT EXISTS "ordem_servico_numero_seq" START WITH 1 INCREMENT BY 1
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ordem_servico" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "numero" character varying NOT NULL,
        "tipo_manutencao" "ordem_servico_tipo_manutencao_enum" NOT NULL,
        "prioridade" "ordem_servico_prioridade_enum" NOT NULL,
        "status" "ordem_servico_status_enum" NOT NULL DEFAULT 'ABERTA',
        "descricao_falha" character varying NOT NULL,
        "abertura_em" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "inicio_em" TIMESTAMPTZ,
        "conclusao_em" TIMESTAMPTZ,
        "descricao_servico" character varying,
        "pecas_utilizadas" character varying,
        "horas_trabalhadas" numeric,
        "equipamento_id" integer NOT NULL,
        "solicitante_id" uuid NOT NULL,
        "tecnico_id" uuid,
        CONSTRAINT "UQ_ordem_servico_numero" UNIQUE ("numero"),
        CONSTRAINT "PK_ordem_servico_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ordem_servico_equipamento" FOREIGN KEY ("equipamento_id") REFERENCES "equipamento"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_ordem_servico_solicitante" FOREIGN KEY ("solicitante_id") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT "FK_ordem_servico_tecnico" FOREIGN KEY ("tecnico_id") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "historico_os" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "os_id" uuid NOT NULL,
        "usuario_id" uuid NOT NULL,
        "status_anterior" character varying(50),
        "status_novo" character varying(50) NOT NULL,
        "observacao" text,
        "registrado_em" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_historico_os_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_historico_os_ordem_servico" FOREIGN KEY ("os_id") REFERENCES "ordem_servico"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_historico_os_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "historico_os"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ordem_servico"`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS "ordem_servico_numero_seq"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "usuario"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "equipamento"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ordem_servico_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ordem_servico_prioridade_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ordem_servico_tipo_manutencao_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "usuario_perfil_enum"`);
  }
}
