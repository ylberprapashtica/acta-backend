import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

let app: any;

async function bootstrap() {
  app = await NestFactory.create(AppModule);
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
  
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(process.env.PORT || 3000);
  }
  
  return app;
}

const appPromise = bootstrap();

// Export handler for Vercel
export default async (req: any, res: any) => {
  const app = await appPromise;
  return app.handle(req, res);
}; 