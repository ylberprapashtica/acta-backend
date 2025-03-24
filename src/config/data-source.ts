import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config();

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

console.log('Migration Configuration:', {
  isProduction,
  hasDatabaseUrl: !!databaseUrl,
  nodeEnv: process.env.NODE_ENV,
  databaseUrl: databaseUrl ? '***' : undefined
});

let dataSource: DataSource;

// Production configuration (Supabase)
if (isProduction) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required in production environment');
  }

  // Parse database URL
  const url = new URL(databaseUrl);
  const databaseName = url.pathname.slice(1);

  console.log('Using production database configuration:', {
    host: url.hostname,
    database: databaseName,
    schema: process.env.SCHEMA_NAME,
  });

  dataSource = new DataSource({
    type: 'postgres',
    url: databaseUrl,
    schema: process.env.SCHEMA_NAME,
    entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
    migrationsRun: true,
    synchronize: false,
    logging: true,
    ssl: false,
    extra: {
      max: 20,
      statement_timeout: 10000
    }
  });
} else {
  // Development configuration (Local container)
  const schemaName = process.env.SCHEMA_NAME || 'acta_foughtsave';
  
  console.log('Using development database configuration:', {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || '5432',
    database: process.env.POSTGRES_DB || 'acta_db',
    schema: schemaName
  });

  dataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'acta_user',
    password: process.env.POSTGRES_PASSWORD || 'acta_password',
    database: process.env.POSTGRES_DB || 'acta_db',
    schema: schemaName,
    entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
    migrationsRun: true,
    synchronize: false,
    logging: true,
    ssl: false,
    extra: {
      max: 20,
      statement_timeout: 10000
    }
  });
}

export default dataSource; 