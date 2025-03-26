import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantAndRoles1711147400001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for user roles
        await queryRunner.query(`
            CREATE TYPE "public".user_role_enum AS ENUM ('super_admin', 'admin', 'user');
        `);

        // Create tenants table
        await queryRunner.query(`
            CREATE TABLE "public".tenants (
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
            ALTER TABLE "public".users 
            ADD COLUMN "role" "public".user_role_enum NOT NULL DEFAULT 'user',
            ADD COLUMN "tenantId" uuid,
            ADD COLUMN "isActive" boolean NOT NULL DEFAULT true,
            ADD CONSTRAINT "FK_users_tenant" FOREIGN KEY ("tenantId") REFERENCES "public".tenants("id") ON DELETE SET NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key and columns from users table
        await queryRunner.query(`
            ALTER TABLE "public".users 
            DROP CONSTRAINT "FK_users_tenant",
            DROP COLUMN "role",
            DROP COLUMN "tenantId",
            DROP COLUMN "isActive"
        `);

        // Drop tenants table
        await queryRunner.query(`
            DROP TABLE "public".tenants
        `);

        // Drop enum type
        await queryRunner.query(`
            DROP TYPE "public".user_role_enum
        `);
    }
} 