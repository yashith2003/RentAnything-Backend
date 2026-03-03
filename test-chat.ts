

import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ChatService } from './src/chat/chat.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const chatService = app.get(ChatService);
  const msgs = await chatService.getThreadMessages(7);
  console.log(JSON.stringify(msgs, null, 2));
  await app.close();
}
run();
