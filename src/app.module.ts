import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import { User } from './user/user.entity';
import { CompanyModule } from './company/company.module';
import { Company } from './company/company.entity';
import { ArticleModule } from './article/article.module';
import { Article } from './article/article.entity';
import { Invoice } from './invoice/invoice.entity';
import { InvoiceItem } from './invoice/invoice-item.entity';
import { InvoiceModule } from './invoice/invoice.module';
import { Tenant } from './tenant/tenant.entity';
import { LoggerService } from './common/services/logger.service';
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
          schema: schemaName,
          synchronize: false
        };

        return config;
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Tenant]),
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
      useClass: TenantGuard,
    },
  ],
})
export class AppModule {} 