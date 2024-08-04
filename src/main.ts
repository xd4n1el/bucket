import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { ReaderModule } from '@reader/reader.module';

function resolvePort(port: any) {
  return parseInt(port);
}

async function bootstrap() {
  const { PORT, READER_PORT } = process.env || {};

  const app_port = resolvePort(PORT);
  const reader_port = resolvePort(READER_PORT);

  const app = await NestFactory.create(AppModule);
  const reader = await NestFactory.create(ReaderModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  reader.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  reader.enableCors({
    origin: process.env.CORS_ORIGIN,
    methods: 'GET',
    optionsSuccessStatus: 200,
  });

  const config = new DocumentBuilder()
    .setTitle('Files API')
    .setDescription(
      'A REST API for file storage and hosting, similar to a cloud service. This API allows users to securely upload, manage and access their files.',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  const favicon =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgdmlld0JveD0iMCAwIDMyIDMyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxnIGNsaXAtcGF0aD0idXJsKCNhKSI+CiAgICA8cGF0aCBkPSJNMzEgNHYyMmMwIC41NS0uNDUgMS0xIDFoLTRWOGMwLS41NS0uNDUtMS0xLTFoLTRWM2g5Yy41NSAwIDEgLjQ1IDEgMSIgZmlsbD0iIzY2ODA3NyIvPgogICAgPHBhdGggZD0iTTI2IDI3djNjMCAuNTUtLjQ1IDEtMSAxSDdjLS41NSAwLTEtLjQ1LTEtMVY4YzAtLjU1LjQ1LTEgMS0xaDE4Yy41NSAwIDEgLjQ1IDEgMXoiIGZpbGw9IiNGRkU2RUEiLz4KICAgIDxwYXRoIGQ9Ik0yMSAzdjRIN2MtLjU1IDAtMSAuNDUtMSAxdjE3SDJjLTEgMC0xLTEtMS0xVjJjMC0uNTUuNDUtMSAxLTFoMThjLjU1IDAgMSAuNDUgMSAxeiIgZmlsbD0iI0ZGQzQ0RCIvPgogICAgPHBhdGggZD0iTTEyIDEzaDNtLTMgM2g4bS04IDRoOG0tOCA0aDhtMS0xN1YyYTEgMSAwIDAgMC0xLTFIMmExIDEgMCAwIDAtMSAxdjIyczAgMSAxIDFoMW0yMyAyaDRhMSAxIDAgMCAwIDEtMVY0YTEgMSAwIDAgMC0xLTFoLTZtMiAyN2ExIDEgMCAwIDEtMSAxSDdhMSAxIDAgMCAxLTEtMVY4YTEgMSAwIDAgMSAxLTFoMThhMSAxIDAgMCAxIDEgMXoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KICA8L2c+CiAgPGRlZnM+CiAgICA8Y2xpcFBhdGggaWQ9ImEiPgogICAgICA8cGF0aCBmaWxsPSIjZmZmIiBkPSJNMCAwaDMydjMySDB6Ii8+CiAgICA8L2NsaXBQYXRoPgogIDwvZGVmcz4KPC9zdmc+Cg==';

  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Files API',
    customfavIcon: favicon,
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'method',
      defaultModelsExpandDepth: -1,
    },
  });

  console.log(`Files API is running on port: ${resolvePort(app_port)}.`);
  console.log(`Reader API is running on port: ${resolvePort(reader_port)}.`);

  await app.listen(app_port);
  await reader.listen(reader_port);
}

bootstrap();
