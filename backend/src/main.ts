import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { setupTelemetry } from './telemetry';

async function bootstrap() {
  await setupTelemetry();

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Client Intake & Proposal Assistant API')
    .setDescription(
      `Internal CRM and AI-assisted proposal platform.

## Authentication
- Register via \`POST /auth/signup\` (creates SALES users)
- Login via \`POST /auth/login\` — returns **accessToken** and **refreshToken**
- Send \`Authorization: Bearer <accessToken>\` on protected routes
- Rotate sessions via \`POST /auth/refresh\` (refresh token rotation enabled)
- Logout via \`POST /auth/logout\`

## Roles
- **ADMIN** — full access
- **SALES** — leads, inquiries, proposals, files
- **DEVELOPER** — qualified leads, technical notes, read-only proposals`,
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT access token',
      },
      'access-token',
    )
    .addTag('Auth', 'Authentication and session management')
    .addTag('Users', 'User profile and administration')
    .addTag('Leads', 'Client lead management')
    .addTag('Inquiries', 'Project inquiry management')
    .addTag('Proposals', 'AI proposal brief generation and editing')
    .addTag('Files', 'Inquiry file attachments')
    .addTag('Dashboard', 'Analytics and metrics')
    .addTag('Activity', 'Audit trail and activity logs')
    .addTag('Health', 'Service health checks')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
}

bootstrap();
