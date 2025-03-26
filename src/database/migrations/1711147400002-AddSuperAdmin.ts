import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from 'bcrypt';

export class AddSuperAdmin1711147400002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hashedPassword = await bcrypt.hash('Acta123!', 10);

        // Insert super admin user
        await queryRunner.query(`
            INSERT INTO "public".users (
                "firstName",
                "lastName",
                email,
                password,
                role,
                "isActive"
            ) VALUES (
                'Admin',
                'User',
                'admin@acta.com',
                '${hashedPassword}',
                'super_admin',
                true
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove super admin user
        await queryRunner.query(`
            DELETE FROM "public".users
            WHERE email = 'admin@acta.com'
        `);
    }
} 