import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOtpVerifyAttempts1781700001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "otp_codes"
        ADD COLUMN "verify_attempts" INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN "verify_blocked_until" TIMESTAMPTZ
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "otp_codes"
        DROP COLUMN "verify_blocked_until",
        DROP COLUMN "verify_attempts"
    `);
  }
}
