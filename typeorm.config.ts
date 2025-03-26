import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { join } from 'path';

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  url: configService.get('DATABASE_URL'),
  entities: [join(__dirname, 'src', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'src', 'database', 'migrations', '*.{ts,js}')],
  logging: true,
}); 