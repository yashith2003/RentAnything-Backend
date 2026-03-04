
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ItemService } from './src/item/item.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const itemService = app.get(ItemService);
  
  console.log('--- Checking All Items ---');
  const result = await itemService.findAll();
  result.items.forEach(item => {
    console.log(`ID: ${item.id}, Title: ${item.title}, ImageUrl: ${item.imageUrl}`);
  });
  
  await app.close();
}
bootstrap();
