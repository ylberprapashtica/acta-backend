import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Express } from 'express';
import { config } from 'dotenv';

// Load the appropriate .env file based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
config({ path: envFile });

let app: NestExpressApplication;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create<NestExpressApplication>(AppModule);
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
      DATABASE_URL: process.env.DATABASE_URL ? '***' : undefined,
    });
    
    if (process.env.NODE_ENV !== 'production') {
      await app.listen(process.env.PORT || 3000);
    }
  }
  return app;
}

// Export handler for Vercel
export default async (req: any, res: any) => {
  const app = await bootstrap();
  const expressApp = app.getHttpAdapter().getInstance() as Express;
  return expressApp(req, res);
}; 