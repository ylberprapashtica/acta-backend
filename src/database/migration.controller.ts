import { Controller, Post, UseGuards } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('migrations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MigrationController {
  constructor(private dataSource: DataSource) {}

  @Post('run')
  @Roles(UserRole.SUPER_ADMIN)
  async runMigrations() {
    try {
      console.log('Running pending migrations...');
      const migrations = await this.dataSource.runMigrations();
      console.log('Migrations completed:', migrations.map(m => m.name));
      return {
        success: true,
        migrations: migrations.map(m => m.name)
      };
    } catch (error) {
      console.error('Error running migrations:', error);
      throw error;
    }
  }

  @Post('revert')
  @Roles(UserRole.SUPER_ADMIN)
  async revertLastMigration() {
    try {
      console.log('Reverting last migration...');
      await this.dataSource.undoLastMigration();
      return {
        success: true,
        message: 'Last migration reverted successfully'
      };
    } catch (error) {
      console.error('Error reverting migration:', error);
      throw error;
    }
  }
} 