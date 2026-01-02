import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { join } from 'path';

config();

const configService = new ConfigService();
const databaseUrl = configService.get('DATABASE_URL') || '';
const isProduction = configService.get('NODE_ENV') === 'production';
// Only enable SSL if explicitly required (e.g., remote databases with SSL)
// Local docker postgres doesn't support SSL, so check if URL contains sslmode or is remote
const requiresSSL = databaseUrl.includes('sslmode=require') || 
                    databaseUrl.includes('sslmode=prefer') ||
                    (isProduction && !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1') && !databaseUrl.includes('postgres:'));

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  ssl: requiresSSL ? {
    rejectUnauthorized: false
  } : false,
  schema: 'public',
  entities: [join(__dirname, 'src', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'src', 'database', 'migrations', '*.{ts,js}')],
  logging: true,
}); 