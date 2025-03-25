import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { config } from 'dotenv';

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
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://acta-frontend.vercel.app', 'https://acta-frontend-ylberprapashtica.vercel.app']
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://acta-frontend.vercel.app', 'https://acta-frontend-ylberprapashtica.vercel.app'];

  console.log('Allowed Origins:', allowedOrigins);
  console.log('Current Environment:', process.env.NODE_ENV);

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Tenant-ID'],
    exposedHeaders: ['Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // Initialize the application
  await app.init();
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on port ${port}`);
}

bootstrap(); 