import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVerifiedManually1781510001000 implements MigrationInterface {
    name = 'AddVerifiedManually1781510001000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "verified_manually" BOOLEAN NOT NULL DEFAULT FALSE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verified_manually"`);
    }

}
