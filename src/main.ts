import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

let app: any;

async function bootstrap() {
  console.log('Starting application bootstrap...');
  
  app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
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
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
  });

  // Only start the server in development
  if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
  } else {
    console.log('Running in production mode (serverless)');
  }

  return app;
}

// Initialize the application
const appPromise = bootstrap().catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});

// Export the app instance for Vercel
export default appPromise;

// Export a handler for Vercel
export const handler = async (req: any, res: any) => {
  const app = await appPromise;
  return app.handle(req, res);
}; 