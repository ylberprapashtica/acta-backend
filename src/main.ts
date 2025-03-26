import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { config } from 'dotenv';
import { join } from 'path';

// Only load .env file if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  config({ path: '.env' });
}

async function bootstrap() {
  console.log('Starting application with environment:', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? '***' : undefined
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'debug', 'verbose'],
  });
  
  app.useGlobalPipes(new ValidationPipe());
  
  // Configure CORS
  app.enableCors({
    origin: true, // Allow all origins
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Tenant-ID'],
    exposedHeaders: ['Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Initialize the application
  await app.init();
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on port ${port}`);
}

bootstrap(); 