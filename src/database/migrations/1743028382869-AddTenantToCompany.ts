import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantToCompany1743028382869 implements MigrationInterface {
    name = 'AddTenantToCompany1743028382869'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company" ADD "tenantId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "FK_3eb2fdec484e573c795ea379403" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT "FK_3eb2fdec484e573c795ea379403"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "tenantId"`);
    }
}
