import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'path';

// Load environment variables
config();

async function runMigrations() {
  console.log('Starting migration process...');
  
  const isProduction = process.env.NODE_ENV === 'production';
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl && isProduction) {
    throw new Error('DATABASE_URL is required in production environment');
  }

  let dataSource: DataSource;

  try {
    // Create DataSource
    if (isProduction) {
      const url = new URL(databaseUrl!);
      const databaseName = url.pathname.slice(1);

      console.log('Configuring production database:', {
        host: url.hostname,
        database: databaseName,
        schema: process.env.SCHEMA_NAME,
      });

      dataSource = new DataSource({
        type: 'postgres',
        url: databaseUrl,
        schema: process.env.SCHEMA_NAME,
        entities: [join(__dirname, '../dist/**/*.entity.js')],
        migrations: [join(__dirname, '../dist/database/migrations/*.js')],
        migrationsRun: true,
        synchronize: false,
        ssl: false,
      });
    } else {
      const schemaName = process.env.SCHEMA_NAME || 'acta_foughtsave';
      
      console.log('Configuring development database:', {
        host: process.env.POSTGRES_HOST || 'localhost',
        database: process.env.POSTGRES_DB || 'acta_db',
        schema: schemaName,
      });

      dataSource = new DataSource({
        type: 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        username: process.env.POSTGRES_USER || 'acta_user',
        password: process.env.POSTGRES_PASSWORD || 'acta_password',
        database: process.env.POSTGRES_DB || 'acta_db',
        schema: schemaName,
        entities: [join(__dirname, '../dist/**/*.entity.js')],
        migrations: [join(__dirname, '../dist/database/migrations/*.js')],
        migrationsRun: true,
        synchronize: false,
        ssl: false,
      });
    }

    // Initialize connection
    await dataSource.initialize();
    console.log('Database connection established');

    // Run migrations
    const migrations = await dataSource.runMigrations();
    console.log('Migrations completed:', migrations.map(m => m.name));

    // Close connection
    await dataSource.destroy();
    console.log('Database connection closed');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations(); 