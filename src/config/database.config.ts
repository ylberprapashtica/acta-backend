import { registerAs } from '@nestjs/config';
import { join } from 'path';

export default registerAs('database', () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Production configuration (Supabase)
  if (isProduction) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      schema: process.env.SCHEMA_NAME || 'public',
      entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
      synchronize: false, // Disable synchronize in production
      logging: false, // Disable logging in production
      ssl: true,
      extra: {
        ssl: {
          rejectUnauthorized: false
        },
        max: 20,
        statement_timeout: 10000
      }
    };
  }

  // Development configuration (Local container)
  return {
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'acta_user',
    password: process.env.POSTGRES_PASSWORD || 'acta_password',
    database: process.env.POSTGRES_DB || 'acta_db',
    schema: process.env.SCHEMA_NAME || 'acta_foughtsave',
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    synchronize: true,
    logging: true,
    ssl: false,
    extra: {
      max: 20,
      statement_timeout: 10000
    }
  };
}); 