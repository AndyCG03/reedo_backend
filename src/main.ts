import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/express-api-reference';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Global DTO validation: strip unknown props and reject non-whitelisted ones.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Surface the reason of any unhandled error (see AllExceptionsFilter).
  app.useGlobalFilters(new AllExceptionsFilter());

  // Build the OpenAPI document that Scalar will render.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Reading Platform API')
    .setDescription(
      'Backend for a reading application. Built with NestJS using ' +
        'Vertical Slice Architecture, CQRS and TDD.',
    )
    .setVersion('1.0.0')
    .addTag('user-profile')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Serve the interactive API reference (Scalar) instead of Swagger UI.
  const docsPath = app.get(ConfigService).get<string>('docsPath') ?? 'docs';
  app.use(`/${docsPath}`, apiReference({ content: document }));

  const port = app.get(ConfigService).get<number>('port') ?? 3000;
  await app.listen(port);
}

void bootstrap();
