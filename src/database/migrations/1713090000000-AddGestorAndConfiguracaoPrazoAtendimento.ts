import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddGestorAndConfiguracaoPrazoAtendimento1713090000000 implements MigrationInterface {
  name = "AddGestorAndConfiguracaoPrazoAtendimento1713090000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "usuario_perfil_enum" ADD VALUE IF NOT EXISTS 'GESTOR'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "configuracao_prazo_atendimento" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "prioridade" "ordem_servico_prioridade_enum" NOT NULL,
        "horas_limite" integer NOT NULL,
        "ativo" boolean NOT NULL DEFAULT true,
        "atualizado_por_id" uuid,
        "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_configuracao_prazo_atendimento_prioridade" UNIQUE ("prioridade"),
        CONSTRAINT "PK_configuracao_prazo_atendimento_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_configuracao_prazo_atendimento_usuario" FOREIGN KEY ("atualizado_por_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      INSERT INTO "configuracao_prazo_atendimento" ("prioridade", "horas_limite")
      VALUES
        ('BAIXA', 72),
        ('MÉDIA', 24),
        ('ALTA', 8),
        ('CRÍTICA', 4)
      ON CONFLICT ("prioridade") DO NOTHING
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ordem_servico_status_prazo_enum') THEN
          CREATE TYPE "ordem_servico_status_prazo_enum" AS ENUM (
            'NO_PRAZO',
            'ESTOURADO',
            'CONCLUIDA_NO_PRAZO',
            'CONCLUIDA_COM_PRAZO_ESTOURADO'
          );
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "ordem_servico"
      ADD COLUMN IF NOT EXISTS "status_prazo" "ordem_servico_status_prazo_enum" NOT NULL DEFAULT 'NO_PRAZO'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ordem_servico" DROP COLUMN IF EXISTS "status_prazo"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ordem_servico_status_prazo_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "configuracao_prazo_atendimento"`);
  }
}
