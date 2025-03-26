import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { join } from 'path';

config();

const configService = new ConfigService();
const isProduction = configService.get('NODE_ENV') === 'production';

export default new DataSource({
  type: 'postgres',
  url: configService.get('DATABASE_URL'),
  ssl: isProduction ? {
    rejectUnauthorized: false
  } : false,
  schema: 'public',
  entities: [join(__dirname, 'src', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'src', 'database', 'migrations', '*.{ts,js}')],
  logging: true,
}); 