import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1711147400000 implements MigrationInterface {
    name = 'InitialSchema1711147400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const schemaName = process.env.SCHEMA_NAME;

        // Create schema if it doesn't exist
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
        
        // Create uuid-ossp extension in public schema if it doesn't exist
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public`);
        
        // Set the search path to include both schemas
        await queryRunner.query(`SET search_path TO "${schemaName}", public`);

        // Create migrations table in our schema
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "${schemaName}"."migrations" (
                id SERIAL PRIMARY KEY,
                "timestamp" bigint NOT NULL,
                name character varying NOT NULL
            )
        `);

        // Create tables in our schema
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "${schemaName}".users (
                id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
                "firstName" character varying NOT NULL,
                "lastName" character varying NOT NULL,
                email character varying NOT NULL UNIQUE,
                password character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_users" PRIMARY KEY (id)
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "${schemaName}".company (
                id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
                "businessName" character varying NOT NULL,
                "tradeName" character varying,
                "businessType" character varying NOT NULL,
                "uniqueIdentificationNumber" character varying NOT NULL UNIQUE,
                "businessNumber" character varying UNIQUE,
                "fiscalNumber" character varying UNIQUE,
                "vatNumber" character varying,
                "registrationDate" date NOT NULL,
                municipality character varying NOT NULL,
                address character varying NOT NULL,
                "phoneNumber" character varying NOT NULL,
                email character varying NOT NULL,
                "bankAccount" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_company" PRIMARY KEY (id)
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "${schemaName}".article (
                id SERIAL NOT NULL,
                name character varying NOT NULL,
                unit character varying NOT NULL,
                code character varying NOT NULL,
                "vatCode" integer NOT NULL,
                "basePrice" numeric(10,2) NOT NULL,
                CONSTRAINT "PK_article" PRIMARY KEY (id)
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "${schemaName}".invoice (
                id SERIAL NOT NULL,
                "invoiceNumber" character varying NOT NULL,
                "issueDate" date NOT NULL,
                "dueDate" date NOT NULL,
                "issuerId" uuid,
                "recipientId" uuid,
                "totalAmount" numeric(10,2) NOT NULL,
                "totalVat" numeric(10,2) NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_invoice" PRIMARY KEY (id),
                CONSTRAINT "FK_invoice_issuer" FOREIGN KEY ("issuerId") REFERENCES "${schemaName}".company(id),
                CONSTRAINT "FK_invoice_recipient" FOREIGN KEY ("recipientId") REFERENCES "${schemaName}".company(id)
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "${schemaName}".invoice_item (
                id SERIAL NOT NULL,
                "invoiceId" integer,
                "articleId" integer,
                quantity numeric(10,2) NOT NULL,
                "unitPrice" numeric(10,2) NOT NULL,
                "totalPrice" numeric(10,2) NOT NULL,
                "vatAmount" numeric(10,2) NOT NULL,
                CONSTRAINT "PK_invoice_item" PRIMARY KEY (id),
                CONSTRAINT "FK_invoice_item_invoice" FOREIGN KEY ("invoiceId") REFERENCES "${schemaName}".invoice(id) ON DELETE CASCADE,
                CONSTRAINT "FK_invoice_item_article" FOREIGN KEY ("articleId") REFERENCES "${schemaName}".article(id) ON DELETE SET NULL
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const schemaName = process.env.SCHEMA_NAME;
        
        // Drop tables in reverse order
        await queryRunner.query(`DROP TABLE IF EXISTS "${schemaName}".invoice_item CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "${schemaName}".invoice CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "${schemaName}".article CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "${schemaName}".company CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "${schemaName}".users CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "${schemaName}".migrations CASCADE`);
        
        // Drop the schema and its contents
        await queryRunner.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    }
} 