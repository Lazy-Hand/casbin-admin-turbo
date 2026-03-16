import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { apiReference } from '@scalar/nestjs-api-reference';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { mw } from 'request-ip';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.useStaticAssets(
    join(process.cwd(), configService.get<string>('upload.dir', 'uploads')),
  );

  app.setGlobalPrefix(configService.get<string>('globalPrefix', '/api'));

  // 使用 Winston logger 替换 NestJS 默认 logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      // forbidNonWhitelisted: true,
    }),
  );
  app.use(mw());

  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('API 文档')
    .setDescription('统一响应格式的 API 文档')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: '输入 JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  app.use(
    '/reference',
    apiReference({
      content: document,
    }),
  );

  const port = configService.get('port') || 8080;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api-docs`);
  console.log(`Scalar Api documentation: http://localhost:${port}/reference`);
}
bootstrap();
