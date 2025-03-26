import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyToArticle1711147400001 implements MigrationInterface {
    name = 'AddCompanyToArticle1711147400001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add companyId column with foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "public".article
            ADD COLUMN "companyId" uuid NOT NULL,
            ADD CONSTRAINT "FK_article_company" 
            FOREIGN KEY ("companyId") 
            REFERENCES "public".company(id) ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the foreign key constraint and column
        await queryRunner.query(`
            ALTER TABLE "public".article
            DROP CONSTRAINT "FK_article_company",
            DROP COLUMN "companyId"
        `);
    }
} 