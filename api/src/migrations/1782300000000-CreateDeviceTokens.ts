import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDeviceTokens1782300000000 implements MigrationInterface {
    name = 'CreateDeviceTokens1782300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "device_tokens" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "token" character varying NOT NULL,
                "platform" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_device_tokens" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_device_tokens_token" UNIQUE ("token")
            )
        `);
        await queryRunner.query(
            `CREATE INDEX "IDX_device_tokens_user_id" ON "device_tokens" ("user_id")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "device_tokens"`);
    }
}
