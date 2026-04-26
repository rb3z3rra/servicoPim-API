import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRefreshTokenTable1713080000000 implements MigrationInterface {
  name = "CreateRefreshTokenTable1713080000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_token" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "jti" uuid NOT NULL,
        "tokenHash" character varying(64) NOT NULL,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "revokedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "usuario_id" uuid NOT NULL,
        CONSTRAINT "UQ_refresh_token_jti" UNIQUE ("jti"),
        CONSTRAINT "PK_refresh_token_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_token_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_refresh_token_jti" ON "refresh_token" ("jti")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_refresh_token_usuario_id" ON "refresh_token" ("usuario_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refresh_token_usuario_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refresh_token_jti"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_token"`);
  }
}
