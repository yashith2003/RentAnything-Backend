import { Module, Global } from '@nestjs/common';
import { ImageProcessingService } from './services/image-processing.service';

@Global()
@Module({
  providers: [ImageProcessingService],
  exports: [ImageProcessingService],
})
export class CommonModule {}
