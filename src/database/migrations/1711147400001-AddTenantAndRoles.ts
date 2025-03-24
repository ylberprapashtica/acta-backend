import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantAndRoles1711147400001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const schemaName = process.env.SCHEMA_NAME;

        // Create enum type for user roles
        await queryRunner.query(`
            CREATE TYPE "${schemaName}".user_role_enum AS ENUM ('super_admin', 'admin', 'user');
        `);

        // Create tenants table
        await queryRunner.query(`
            CREATE TABLE "${schemaName}".tenants (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "description" character varying,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_tenants_slug" UNIQUE ("slug"),
                CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
            )
        `);

        // Add role and tenant columns to users table
        await queryRunner.query(`
            ALTER TABLE "${schemaName}".users 
            ADD COLUMN "role" "${schemaName}".user_role_enum NOT NULL DEFAULT 'user',
            ADD COLUMN "tenantId" uuid,
            ADD COLUMN "isActive" boolean NOT NULL DEFAULT true,
            ADD CONSTRAINT "FK_users_tenant" FOREIGN KEY ("tenantId") REFERENCES "${schemaName}".tenants("id") ON DELETE SET NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const schemaName = process.env.SCHEMA_NAME;

        // Remove foreign key and columns from users table
        await queryRunner.query(`
            ALTER TABLE "${schemaName}".users 
            DROP CONSTRAINT "FK_users_tenant",
            DROP COLUMN "role",
            DROP COLUMN "tenantId",
            DROP COLUMN "isActive"
        `);

        // Drop tenants table
        await queryRunner.query(`
            DROP TABLE "${schemaName}".tenants
        `);

        // Drop enum type
        await queryRunner.query(`
            DROP TYPE "${schemaName}".user_role_enum
        `);
    }
} 