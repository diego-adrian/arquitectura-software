import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'node:path';
import { AppModule } from './app.module';

// La API documentada con Swagger en /api/docs. Los controladores reciben `body: any`,
// así que aquí se describen los dos cuerpos que acepta la API, con un ejemplo cada uno.
function documentarApi(app: NestExpressApplication) {
  const opciones = new DocumentBuilder()
    .setTitle('Cupo · API')
    .setDescription('Inscripción de materias (datos ficticios). Entra con POST /api/login, copia el token y pégalo en "Authorize".')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();
  const documento = SwaggerModule.createDocument(app, opciones);
  const cuerpo = (ejemplo: object) => ({ required: true, content: { 'application/json': { schema: { type: 'object' }, example: ejemplo } } });
  const login = documento.paths['/api/login'].post!;
  login.requestBody = cuerpo({ codigo: '2023-1001', password: 'demo1234' });
  login.security = []; // el login no pide token
  documento.paths['/api/inscripciones'].post!.requestBody = cuerpo({ paralelos: ['SIS-211-B', 'ING-101-A'] });
  SwaggerModule.setup('api/docs', app, documento);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'public'));
  if (process.env.NODE_ENV !== 'production') documentarApi(app); // en producción no se publica la documentación
  await app.listen(3000);
  console.log('Cupo corriendo en http://localhost:3000 (API documentada en /api/docs)');
}
bootstrap();
