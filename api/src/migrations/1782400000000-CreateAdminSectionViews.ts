import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminSectionViews1782400000000 implements MigrationInterface {
  name = 'CreateAdminSectionViews1782400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "admin_section_views" (
        "admin_id" uuid NOT NULL,
        "section" character varying(32) NOT NULL,
        "viewed_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admin_section_views" PRIMARY KEY ("admin_id", "section"),
        CONSTRAINT "FK_admin_section_views_user" FOREIGN KEY ("admin_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "admin_section_views"`);
  }
}
