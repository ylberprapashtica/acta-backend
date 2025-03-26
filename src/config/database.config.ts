import { registerAs } from '@nestjs/config';
import { join } from 'path';

export default registerAs('database', () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log('Database Configuration:', {
    isProduction,
    hasDatabaseUrl: process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV
  });
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  // Extract database name from DATABASE_URL to use as schema
  const url = new URL(process.env.DATABASE_URL);
  const databaseName = url.pathname.slice(1); // Remove leading slash
  
  return {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    schema: databaseName,
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    synchronize: false,
    logging: true,
    ssl: isProduction ? {
      rejectUnauthorized: false
    } : false,
    extra: {
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000,
      statement_timeout: 30000
    }
  };
}); 