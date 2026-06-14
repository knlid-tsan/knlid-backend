import { MigrationInterface, QueryRunner } from "typeorm";

export class PartialUniquePhoneIndexes1781423243378 implements MigrationInterface {
    name = 'PartialUniquePhoneIndexes1781423243378'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_a000cca60bcf04454e727699490"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_tariff_city"`);
        await queryRunner.query(`ALTER TABLE "reward_tariffs" ALTER COLUMN "city" SET DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "companies" DROP CONSTRAINT "UQ_d477050c058ca769d3808caef51"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_phone_active" ON "users"  ("phone") WHERE "status" != 'archived'`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_tariff_city" ON "reward_tariffs"  ("lead_type", "city") WHERE "city" IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_companies_phone_active" ON "companies"  ("phone") WHERE "status" != 'rejected'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_companies_phone_active"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_tariff_city"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_users_phone_active"`);
        await queryRunner.query(`ALTER TABLE "companies" ADD CONSTRAINT "UQ_d477050c058ca769d3808caef51" UNIQUE ("phone")`);
        await queryRunner.query(`ALTER TABLE "reward_tariffs" ALTER COLUMN "city" DROP DEFAULT`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_tariff_city" ON "reward_tariffs" USING btree ("city", "lead_type") WHERE (city IS NOT NULL)`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone")`);
    }

}
