import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:3000');

  // Security Hardening
  app.use(helmet());

  // CORS Configuration
  app.enableCors({
    origin: [corsOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-BFF-Source', 'X-Telegram-Init-Data'],
  });

  // Global DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Graceful Shutdown Hooks
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');
  logger.log(`🐾 Smart Pet Feeder NestJS API running on: http://0.0.0.0:${port}`);
}

bootstrap();
