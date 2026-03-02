import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

export interface ImageProcessOptions {
  format?: 'webp' | 'jpeg';
  quality?: number;
  maxWidth?: number;
  watermarkText?: string;
}

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Processes an image: strips EXIF, resizes, and re-encodes.
   * Replaces the original file and returns the relative path for the DB.
   * @param absoluteFilePath The full path to the file on disk.
   * @param options Compression and format options.
   * @returns The relative path to the new file.
   */
  async processAndReplace(
    absoluteFilePath: string,
    options: ImageProcessOptions = {}
  ): Promise<string> {
    const { format = 'jpeg', quality = 82, maxWidth = 1600 } = options;
    
    // Generate a cache key based on file path and options
    const cacheKey = `img_proc:${crypto.createHash('md5').update(`${absoluteFilePath}:${JSON.stringify(options)}`).digest('hex')}`;
    
    try {
      const cachedResult = await this.cacheManager.get<string>(cacheKey);
      if (cachedResult && fs.existsSync(path.join(process.cwd(), cachedResult))) {
        this.logger.log(`Using cached image for ${absoluteFilePath}`);
        return cachedResult;
      }

      const dir = path.dirname(absoluteFilePath);
      const ext = path.extname(absoluteFilePath);
      const filename = path.basename(absoluteFilePath, ext);
      const newFilename = `${filename}.${format}`;
      const newPath = path.join(dir, newFilename);

      let transform = sharp(absoluteFilePath)
        .rotate() // Auto-rotate based on EXIF before stripping
        .resize({
          width: maxWidth,
          withoutEnlargement: true,
          fit: 'inside',
        });

      if (format === 'webp') {
        transform = transform.webp({ quality });
      } else {
        transform = transform.jpeg({ quality, progressive: true });
      }

      // Apply watermark AFTER resize/compression if requested
      if (options.watermarkText) {
        const metadata = await transform.metadata();
        const width = metadata.width || maxWidth;
        const height = metadata.height || (width * 0.75); // Fallback aspect ratio

        // Dynamic scaling: 5% of width
        const fontSize = Math.floor(width * 0.05);
        const padding = Math.floor(width * 0.02);
        
        const svgWatermark = `
          <svg width="${width}" height="${height}">
            <style>
              .text { 
                fill: rgba(255, 255, 255, 0.35); 
                font-size: ${fontSize}px; 
                font-weight: bold; 
                font-family: sans-serif;
                filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.5));
              }
            </style>
            <text 
              x="${width - padding}" 
              y="${height - padding}" 
              text-anchor="end" 
              class="text"
            >
              ${options.watermarkText}
            </text>
          </svg>
        `;

        transform = transform.composite([
          {
            input: Buffer.from(svgWatermark),
            gravity: 'southeast',
          },
        ]);
      }

      await transform.toFile(newPath);

      // If the extension changed (e.g. .png to .webp), delete the old file
      if (absoluteFilePath !== newPath) {
        fs.unlinkSync(absoluteFilePath);
      }

      // Return the path relative to the uploads root for storage in DB
      const uploadsIndex = newPath.indexOf('uploads');
      const finalPath = uploadsIndex !== -1 ? newPath.substring(uploadsIndex) : newPath;
      
      await this.cacheManager.set(cacheKey, finalPath, 3600 * 1000); // Cache for 1 hour
      return finalPath;
    } catch (error) {
      this.logger.error(`Error processing image ${absoluteFilePath}: ${error.message}`);
      // If processing fails, return original if it still exists, otherwise throw
      return absoluteFilePath;
    }
  }
}
