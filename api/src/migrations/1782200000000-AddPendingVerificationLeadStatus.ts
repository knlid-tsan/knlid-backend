import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPendingVerificationLeadStatus1782200000000 implements MigrationInterface {
    name = 'AddPendingVerificationLeadStatus1782200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "leads_status_enum" ADD VALUE IF NOT EXISTS 'pending_verification'`,
        );
        // У lead_status_history свои enum-типы для from/to — без них
        // вставка строк истории с новым статусом упадёт
        await queryRunner.query(
            `ALTER TYPE "lead_status_history_from_status_enum" ADD VALUE IF NOT EXISTS 'pending_verification'`,
        );
        await queryRunner.query(
            `ALTER TYPE "lead_status_history_to_status_enum" ADD VALUE IF NOT EXISTS 'pending_verification'`,
        );
    }

    public async down(): Promise<void> {
        // Удаление значения из enum PostgreSQL не поддерживается;
        // 'pending_verification' остаётся в типе.
    }
}
