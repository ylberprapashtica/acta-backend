import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyLogo1711147400003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "company"
      ADD COLUMN "logo" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "company"
      DROP COLUMN "logo"
    `);
  }
} 