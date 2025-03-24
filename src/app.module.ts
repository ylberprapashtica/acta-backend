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
        const schemaName = process.env.SCHEMA_NAME || 'acta_foughtsave';
        
        // Base configuration
        const config = {
          ...configService.get('database'),
          entities: [User, Company, Article, Invoice, InvoiceItem],
          migrations: [InitialSchema1711147400000],
          migrationsRun: true,
          schema: schemaName,
          synchronize: true
        };

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