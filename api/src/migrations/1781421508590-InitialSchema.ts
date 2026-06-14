import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781421508590 implements MigrationInterface {
    name = 'InitialSchema1781421508590'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_tariff_city"`);
        await queryRunner.query(`ALTER TABLE "reward_tariffs" ALTER COLUMN "city" SET DEFAULT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_tariff_city" ON "reward_tariffs"  ("lead_type", "city") WHERE "city" IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_tariff_city"`);
        await queryRunner.query(`ALTER TABLE "reward_tariffs" ALTER COLUMN "city" DROP DEFAULT`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_tariff_city" ON "reward_tariffs" USING btree ("city", "lead_type") WHERE (city IS NOT NULL)`);
    }

}
