import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Enable full logging
  });
  app.useGlobalPipes(new ValidationPipe());
  
  // Configure CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    credentials: true,
  });
  
  // Log environment variables (excluding sensitive data)
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_HOST: process.env.POSTGRES_HOST,
    DATABASE_PORT: process.env.POSTGRES_PORT,
  });

  await app.listen(process.env.PORT || 3000);
}

bootstrap(); 