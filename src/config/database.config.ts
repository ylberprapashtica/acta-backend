import { registerAs } from '@nestjs/config';
import { join } from 'path';

export default registerAs('database', () => {
  return {
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'acta_user',
    password: process.env.POSTGRES_PASSWORD || 'acta_password',
    database: process.env.POSTGRES_DB || 'acta_db',
    schema: process.env.POSTGRES_USER || 'acta_foughtsave',
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