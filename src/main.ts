// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cron from 'node-cron';
import { GiftsService } from './gifts/gifts.service';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['https://vemprocasorio.netlify.app', 'http://localhost:5173', 'https://casamento-jn43.vercel.app/luis-vitoria','https://casamento-jn43.vercel.app'], // ou use '*' para permitir qualquer origem (apenas em dev!)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true, // se estiver usando cookies/autenticação
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  cron.schedule('*/30 * * * *', async () => {
    const giftsService = app.get(GiftsService);
    console.log('[CRON] Atualizando cache...');
    try {
      await giftsService.refreshCache();
      console.log('[CRON] Cache atualizado com sucesso!');
    } catch (error) {
      console.error('[CRON] Erro ao atualizar cache:', error);
    }
  });

  const config = new DocumentBuilder()
    .setTitle('Wedding Gift Registry API')
    .setDescription('API for managing wedding gifts')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);



  await app.listen(process.env.PORT || 3000);
}
bootstrap();
