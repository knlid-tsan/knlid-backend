import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserConsents1781700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_consents" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL,
        "consent_type" VARCHAR NOT NULL,
        "document_version" VARCHAR NOT NULL DEFAULT '1.0',
        "agreed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_user_consents" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_consents_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_consents_user"
        ON "user_consents" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_consents_user_type"
        ON "user_consents" ("user_id", "consent_type")
    `);

    await queryRunner.query(`
      ALTER TABLE "leads"
        ADD COLUMN "client_consent_confirmed" BOOLEAN NOT NULL DEFAULT FALSE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "client_consent_confirmed"`);
    await queryRunner.query(`DROP INDEX "IDX_user_consents_user_type"`);
    await queryRunner.query(`DROP INDEX "IDX_user_consents_user"`);
    await queryRunner.query(`DROP TABLE "user_consents"`);
  }
}
