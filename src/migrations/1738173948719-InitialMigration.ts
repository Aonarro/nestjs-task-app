import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1738173948719 implements MigrationInterface {
  name = 'InitialMigration1738173948719';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Создаем ENUM-тип перед таблицей tasks
    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE "public"."tasks_status_enum" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    );

    await queryRunner.query(`CREATE TABLE "labels" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "name" character varying NOT NULL, 
            "taskId" uuid NOT NULL, 
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
            "updatedAT" TIMESTAMP NOT NULL DEFAULT now(), 
            CONSTRAINT "UQ_8a2558dd2b38cf4d8edd6ee173d" UNIQUE ("name", "taskId"), 
            CONSTRAINT "PK_c0c4e97f76f1f3a268c7a70b925" PRIMARY KEY ("id")
        )`);

    await queryRunner.query(
      `CREATE INDEX "IDX_b7b8d73f9e094b7070d95c3a3c" ON "labels" ("taskId")`,
    );

    await queryRunner.query(`CREATE TABLE "tasks" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "title" character varying(100) NOT NULL, 
            "description" text NOT NULL, 
            "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'OPEN', 
            "userId" uuid NOT NULL, 
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
            "updatedAT" TIMESTAMP NOT NULL DEFAULT now(), 
            CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id")
        )`);

    await queryRunner.query(`CREATE TABLE "users" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
            "name" character varying NOT NULL, 
            "email" character varying NOT NULL, 
            "password" character varying NOT NULL, 
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(), 
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
            "roles" text array NOT NULL DEFAULT '{user}', 
            CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
        )`);

    await queryRunner.query(
      `ALTER TABLE "labels" ADD CONSTRAINT "FK_b7b8d73f9e094b7070d95c3a3c7" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_166bd96559cb38595d392f75a35" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_166bd96559cb38595d392f75a35"`,
    );
    await queryRunner.query(
      `ALTER TABLE "labels" DROP CONSTRAINT "FK_b7b8d73f9e094b7070d95c3a3c7"`,
    );

    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b7b8d73f9e094b7070d95c3a3c"`,
    );
    await queryRunner.query(`DROP TABLE "labels"`);

    // Удаляем ENUM-тип при откате миграции
    await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);
  }
}
