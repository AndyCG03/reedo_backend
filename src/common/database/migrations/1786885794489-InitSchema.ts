import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1786885794489 implements MigrationInterface {
  name = 'InitSchema1786885794489';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_profiles" ("id" uuid NOT NULL, "username" character varying(30) NOT NULL, "display_name" character varying(60) NOT NULL, "bio" character varying(280), "avatar_url" character varying(500), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7bdaa0714f4c1087a926a2d8369" UNIQUE ("username"), CONSTRAINT "PK_1ec6662219f4605723f1e41b6cb" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_profiles"`);
  }
}
