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

  // Schema should be 'public' (or SCHEMA_NAME if set), not the database name
  // The database name is in the DATABASE_URL path, but schema is separate
  const schemaName = process.env.SCHEMA_NAME || 'public';
  
  return {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    schema: schemaName,
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    synchronize: false,
    logging: true,
    ssl: false,
//    ssl: isProduction ? {
//      rejectUnauthorized: false
//    } : false,
    extra: {
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000,
      statement_timeout: 30000
    }
  };
}); 