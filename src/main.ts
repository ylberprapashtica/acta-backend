import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

let app: any;

async function bootstrap() {
  app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(process.env.PORT || 3000);
  }
  
  return app;
}

const appPromise = bootstrap();

export default appPromise;

// Export handler for Vercel
export const handler = async (req: any, res: any) => {
  const app = await appPromise;
  return app.handle(req, res);
}; 