import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompanyContactFields1781900000000 implements MigrationInterface {
    name = 'AddCompanyContactFields1781900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companies" ADD COLUMN "contact_name" character varying`);
        await queryRunner.query(`ALTER TABLE "companies" ADD COLUMN "contact_phone" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "contact_phone"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "contact_name"`);
    }
}
