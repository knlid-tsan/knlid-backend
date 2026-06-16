import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeCompanyBinNullable1781510000000 implements MigrationInterface {
    name = 'MakeCompanyBinNullable1781510000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the plain unique constraint on bin
        await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT "UQ_865b1d35b662233422b15828b54"`);
        // Make bin nullable
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "bin" DROP NOT NULL`);
        // Re-add uniqueness only when bin is present (allows multiple NULLs)
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_companies_bin_notnull" ON "companies" ("bin") WHERE "bin" IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_companies_bin_notnull"`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "bin" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "companies" ADD CONSTRAINT "UQ_865b1d35b662233422b15828b54" UNIQUE ("bin")`);
    }

}
