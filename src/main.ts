import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/express-api-reference';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { scalarConfig, sortOpenApiDocument } from './common/config/scalar.config';

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
  const document = SwaggerModule.createDocument(app, scalarConfig);
  sortOpenApiDocument(document);

  // Serve the interactive API reference (Scalar) instead of Swagger UI.
  const docsPath = app.get(ConfigService).get<string>('docsPath') ?? 'docs';
  app.use(`/${docsPath}`, apiReference({ content: document }));

  const port = app.get(ConfigService).get<number>('port') ?? 3000;
  await app.listen(port);
}

void bootstrap();
