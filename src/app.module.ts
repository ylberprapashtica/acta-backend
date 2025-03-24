import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import { UsersModule } from './users/users.module';
import { User } from './entities/user.entity';
import { CompanyModule } from './company/company.module';
import { Company } from './company/entities/company.entity';
import { ArticleModule } from './article/article.module';
import { Article } from './entities/article.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { InvoiceModule } from './invoice/invoice.module';
import { InitialSchema1711147400000 } from './database/migrations/1711147400000-InitialSchema';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const schemaName = process.env.POSTGRES_USER || 'acta_foughtsave';
        
        // Base configuration
        const config = {
          ...configService.get('database'),
          entities: [User, Company, Article, Invoice, InvoiceItem],
          migrations: [InitialSchema1711147400000],
          migrationsRun: true,
          migrationsTableName: `${schemaName}.migrations`, // Use schema-qualified table name
          schema: schemaName // Set default schema
        };

        try {
          // Create initial connection to create schema
          const tempDataSource = new DataSource({
            type: 'postgres',
            host: process.env.POSTGRES_HOST,
            port: parseInt(process.env.POSTGRES_PORT || '5432'),
            username: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            database: process.env.POSTGRES_DB,
            ssl: false
          });

          await tempDataSource.initialize();
          
          // Create schema and extension
          await tempDataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
          await tempDataSource.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "${schemaName}"`);
          
          // Create migrations table manually since we don't have public schema access
          await tempDataSource.query(`
            CREATE TABLE IF NOT EXISTS "${schemaName}"."migrations" (
              "id" SERIAL PRIMARY KEY,
              "timestamp" bigint NOT NULL,
              "name" character varying NOT NULL
            )
          `);

          await tempDataSource.destroy();
        } catch (error) {
          console.error('Schema initialization error:', error);
          // Continue even if schema exists
        }

        return config;
      },
      inject: [ConfigService],
    }),
    UsersModule,
    CompanyModule,
    ArticleModule,
    InvoiceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {} 