import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
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
import { DataSource } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { LoggerService } from './common/services/logger.service';
import { RolesGuard } from './common/guards/roles.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { TenantModule } from './tenant/tenant.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const schemaName = process.env.SCHEMA_NAME || 'public';
        
        // Base configuration
        const config = {
          ...configService.get('database'),
          entities: [User, Company, Article, Invoice, InvoiceItem, Tenant],
          migrationsRun: true,
          schema: schemaName,
          synchronize: false
        };

        return config;
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User]),
    AuthModule,
    TenantModule,
    UserModule,
    CompanyModule,
    ArticleModule,
    InvoiceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    LoggerService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
})
export class AppModule {} 