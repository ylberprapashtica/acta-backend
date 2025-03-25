import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Express } from 'express';
import { config } from 'dotenv';

// Only load .env file if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  config({ path: '.env' });
}

let app: NestExpressApplication;

async function bootstrap() {
  if (!app) {
    console.log('Starting application with environment:', {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL
    });

    app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn', 'debug', 'verbose'],
    });
    
    app.useGlobalPipes(new ValidationPipe());
    
    // Configure CORS
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? ['https://acta-frontend.vercel.app']
      : ['http://localhost:5173', 'http://127.0.0.1:5173'];

    app.enableCors({
      origin: allowedOrigins,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
      credentials: true,
    });

    // Initialize the application
    await app.init();
    
    // Only listen when not in production (local development)
    if (process.env.NODE_ENV !== 'production') {
      const port = process.env.PORT || 3000;
      await app.listen(port);
      console.log(`Application is running on port ${port}`);
    }
  }
  return app;
}

// For local development
if (process.env.NODE_ENV !== 'production') {
  bootstrap().catch(error => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}

// Export handler for Vercel
export default async function handler(req: any, res: any) {
  try {
    console.log('Incoming request:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body
    });

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    const app = await bootstrap();
    const expressApp = app.getHttpAdapter().getInstance() as Express;
    return expressApp(req, res);
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 