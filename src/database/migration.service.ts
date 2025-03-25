import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class MigrationService implements OnApplicationBootstrap {
  constructor(private dataSource: DataSource) {}

  async onApplicationBootstrap() {
    try {
      console.log('Running pending migrations...');
      const migrations = await this.dataSource.runMigrations();
      console.log('Migrations completed:', migrations.map(m => m.name));
    } catch (error) {
      console.error('Error running migrations:', error);
      throw error;
    }
  }
} 