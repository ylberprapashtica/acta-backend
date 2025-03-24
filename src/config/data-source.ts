import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();

const schemaName = process.env.SCHEMA_NAME || 'acta_foughtsave';

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  schema: schemaName,
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
  migrationsRun: true,
  synchronize: false,
}); 