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
    console.log('Starting application with environment:', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DATABASE_URL: process.env.DATABASE_URL ? '***' : undefined,
      envFile
    });

    app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.useGlobalPipes(new ValidationPipe());
    
    // Configure CORS
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
      credentials: true,
    });
    
    // Always listen in production
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Application is running on port ${port}`);
  }
  return app;
}

bootstrap().catch(error => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

// Export handler for Vercel
export default async (req: any, res: any) => {
  const app = await bootstrap();
  const expressApp = app.getHttpAdapter().getInstance() as Express;
  return expressApp(req, res);
}; 