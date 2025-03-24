import { registerAs } from '@nestjs/config';
import { join } from 'path';

export default registerAs('database', () => {
  const schemaName = process.env.POSTGRES_USER || 'acta_foughtsave';
  
  return {
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'acta_user',
    password: process.env.POSTGRES_PASSWORD || 'acta_password',
    database: process.env.POSTGRES_DB || 'acta_db',
    schema: schemaName,
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    synchronize: false,
    logging: true,
    ssl: false,
    extra: {
      max: 20,
      statement_timeout: 10000
    }
  };
}); 