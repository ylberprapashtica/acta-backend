import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeCompanyRequiredInArticle1743025493125 implements MigrationInterface {
    name = 'MakeCompanyRequiredInArticle1743025493125'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_tenant"`);
        await queryRunner.query(`ALTER TABLE "invoice" DROP CONSTRAINT "FK_invoice_issuer"`);
        await queryRunner.query(`ALTER TABLE "invoice" DROP CONSTRAINT "FK_invoice_recipient"`);
        await queryRunner.query(`ALTER TABLE "invoice_item" DROP CONSTRAINT "FK_invoice_item_invoice"`);
        await queryRunner.query(`ALTER TABLE "invoice_item" DROP CONSTRAINT "FK_invoice_item_article"`);
        await queryRunner.query(`ALTER TABLE "article" DROP CONSTRAINT "FK_article_company"`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_enum" RENAME TO "user_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('super_admin', 'admin', 'user')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "businessType"`);
        await queryRunner.query(`CREATE TYPE "public"."company_businesstype_enum" AS ENUM('Sole Proprietorship', 'Partnership', 'Limited Liability Company', 'Corporation')`);
        await queryRunner.query(`ALTER TABLE "company" ADD "businessType" "public"."company_businesstype_enum" NOT NULL DEFAULT 'Sole Proprietorship'`);
        await queryRunner.query(`COMMENT ON COLUMN "invoice_item"."unitPrice" IS 'If not set, defaults to article.basePrice'`);
        await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "vatCode"`);
        await queryRunner.query(`CREATE TYPE "public"."article_vatcode_enum" AS ENUM('0', '8', '18')`);
        await queryRunner.query(`ALTER TABLE "article" ADD "vatCode" "public"."article_vatcode_enum" NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_c58f7e88c286e5e3478960a998b" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice" ADD CONSTRAINT "FK_098e2b1653b00e9cfd9af43703e" FOREIGN KEY ("issuerId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice" ADD CONSTRAINT "FK_d2ed2157b656774df5dae689ecc" FOREIGN KEY ("recipientId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice_item" ADD CONSTRAINT "FK_553d5aac210d22fdca5c8d48ead" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice_item" ADD CONSTRAINT "FK_7435d71ea2016e0d41ccf3de4cd" FOREIGN KEY ("articleId") REFERENCES "article"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article" ADD CONSTRAINT "FK_425485b29ca22fa3e35c422231b" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "article" DROP CONSTRAINT "FK_425485b29ca22fa3e35c422231b"`);
        await queryRunner.query(`ALTER TABLE "invoice_item" DROP CONSTRAINT "FK_7435d71ea2016e0d41ccf3de4cd"`);
        await queryRunner.query(`ALTER TABLE "invoice_item" DROP CONSTRAINT "FK_553d5aac210d22fdca5c8d48ead"`);
        await queryRunner.query(`ALTER TABLE "invoice" DROP CONSTRAINT "FK_d2ed2157b656774df5dae689ecc"`);
        await queryRunner.query(`ALTER TABLE "invoice" DROP CONSTRAINT "FK_098e2b1653b00e9cfd9af43703e"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_c58f7e88c286e5e3478960a998b"`);
        await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "vatCode"`);
        await queryRunner.query(`DROP TYPE "public"."article_vatcode_enum"`);
        await queryRunner.query(`ALTER TABLE "article" ADD "vatCode" integer NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "invoice_item"."unitPrice" IS NULL`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "businessType"`);
        await queryRunner.query(`DROP TYPE "public"."company_businesstype_enum"`);
        await queryRunner.query(`ALTER TABLE "company" ADD "businessType" character varying NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum_old" AS ENUM('super_admin', 'admin', 'user')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."user_role_enum_old" USING "role"::"text"::"public"."user_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_enum_old" RENAME TO "user_role_enum"`);
        await queryRunner.query(`ALTER TABLE "article" ADD CONSTRAINT "FK_article_company" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice_item" ADD CONSTRAINT "FK_invoice_item_article" FOREIGN KEY ("articleId") REFERENCES "article"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice_item" ADD CONSTRAINT "FK_invoice_item_invoice" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice" ADD CONSTRAINT "FK_invoice_recipient" FOREIGN KEY ("recipientId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice" ADD CONSTRAINT "FK_invoice_issuer" FOREIGN KEY ("issuerId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
