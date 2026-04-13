import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsuarioMatricula1712983500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "usuario"
      ADD COLUMN IF NOT EXISTS "matricula" character varying
    `);

    await queryRunner.query(`
      UPDATE "usuario"
      SET "matricula" = 'LEGACY-' || SUBSTRING(REPLACE("id"::text, '-', '') FROM 1 FOR 8)
      WHERE "matricula" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "usuario"
      ALTER COLUMN "matricula" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_usuario_matricula"
      ON "usuario" ("matricula")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_usuario_matricula"`);
    await queryRunner.query(`
      ALTER TABLE "usuario"
      DROP COLUMN IF EXISTS "matricula"
    `);
  }
}
