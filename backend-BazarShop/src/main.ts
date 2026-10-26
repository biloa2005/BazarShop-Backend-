import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express'; // <-- 1. Importez ce type
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'node:path';

async function bootstrap() {
  // 2.le type <NestExpressApplication> 
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  
  await app.listen(process.env.PORT ?? 3000, () => {
    console.log("je tourne sur le port 3000");
  });
}
await bootstrap();
