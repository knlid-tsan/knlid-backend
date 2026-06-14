import { MigrationInterface, QueryRunner } from "typeorm";

export class AddArchivedUserStatus1781422798561 implements MigrationInterface {
    name = 'AddArchivedUserStatus1781422798561'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."users_status_enum" ADD VALUE 'archived'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum_old" AS ENUM('new', 'pending', 'active', 'blocked')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" TYPE "public"."users_status_enum_old" USING "status"::"text"::"public"."users_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_status_enum_old" RENAME TO "users_status_enum"`);
    }

}
