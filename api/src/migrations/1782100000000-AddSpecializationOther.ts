import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSpecializationOther1782100000000 implements MigrationInterface {
    name = 'AddSpecializationOther1782100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // PG >= 12: ADD VALUE допустим в транзакции, пока новое значение
        // не используется в той же транзакции
        await queryRunner.query(
            `ALTER TYPE "users_specialization_enum" ADD VALUE IF NOT EXISTS 'other'`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD COLUMN "specialization_other" character varying`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "specialization_other"`);
        // Удаление значения из enum PostgreSQL не поддерживает; 'other'
        // остаётся в типе — это безопасно, пока им никто не пользуется.
    }
}
