import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSupportChat1781600000000 implements MigrationInterface {
    name = 'AddSupportChat1781600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "sender_type_enum" AS ENUM ('user', 'support')`);

        await queryRunner.query(`
            CREATE TABLE "conversations" (
              "id"                 UUID        NOT NULL DEFAULT gen_random_uuid(),
              "user_id"            UUID        NOT NULL,
              "created_at"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              "last_message_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              "unread_for_user"    INT         NOT NULL DEFAULT 0,
              "unread_for_support" INT         NOT NULL DEFAULT 0,
              CONSTRAINT "PK_conversations" PRIMARY KEY ("id"),
              CONSTRAINT "UQ_conversations_user_id" UNIQUE ("user_id"),
              CONSTRAINT "FK_conversations_user" FOREIGN KEY ("user_id")
                REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "messages" (
              "id"              UUID               NOT NULL DEFAULT gen_random_uuid(),
              "conversation_id" UUID               NOT NULL,
              "sender_type"     "sender_type_enum" NOT NULL,
              "sender_id"       UUID,
              "text"            TEXT               NOT NULL,
              "created_at"      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
              "is_read"         BOOLEAN            NOT NULL DEFAULT FALSE,
              CONSTRAINT "PK_messages" PRIMARY KEY ("id"),
              CONSTRAINT "FK_messages_conversation" FOREIGN KEY ("conversation_id")
                REFERENCES "conversations"("id") ON DELETE CASCADE,
              CONSTRAINT "FK_messages_sender" FOREIGN KEY ("sender_id")
                REFERENCES "users"("id") ON DELETE SET NULL
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_messages_conversation_created"
              ON "messages" ("conversation_id", "created_at")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_conversations_last_message"
              ON "conversations" ("last_message_at" DESC)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_last_message"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_conversation_created"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "messages"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "conversations"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "sender_type_enum"`);
    }
}
