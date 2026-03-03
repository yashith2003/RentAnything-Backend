<<<<<<< HEAD
//RentAnything/src/common/services/image-processing.service.ts
=======
//RentAnything-Backend/src/common/services/image-processing.service.ts
>>>>>>> 5b3aa7733a696cb8cea4b3144771ecdd6f0008a4

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

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    // Disable sharp cache to prevent file locking on Windows
    sharp.cache(false);
  }

  /**
   * Processes an image buffer: strips EXIF, resizes, and re-encodes.
   * @param buffer Input image buffer.
   * @param options Compression and format options.
   * @returns Processed image buffer.
   */
  async processBuffer(
    buffer: Buffer,
    options: ImageProcessOptions = {}
  ): Promise<Buffer> {
    const { format = 'jpeg', quality = 82, maxWidth = 1600 } = options;

    try {
<<<<<<< HEAD
      const cachedResult = await this.cacheManager.get<string>(cacheKey);
      if (cachedResult && fs.existsSync(path.join(process.cwd(), cachedResult))) {
        this.logger.log(`Using cached image for ${absoluteFilePath}`);
        return cachedResult;
      }

      const dir = path.dirname(absoluteFilePath);
      const ext = path.extname(absoluteFilePath);
      // Create a unique name for the processed file to avoid EPERM when overwriting same file on Windows
      const newFilename = `${path.basename(absoluteFilePath, ext)}_${crypto.randomBytes(4).toString('hex')}.${format}`;
      const newPath = path.join(dir, newFilename);

      // Read file into buffer to avoid file lock on Windows
      const inputBuffer = fs.readFileSync(absoluteFilePath);

      let transform = sharp(inputBuffer)
        .rotate() // Auto-rotate based on EXIF before stripping
=======
      let transform = sharp(buffer)
        .rotate()
>>>>>>> 5b3aa7733a696cb8cea4b3144771ecdd6f0008a4
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

      if (options.watermarkText) {
        const metadata = await transform.metadata();
        const width = metadata.width || maxWidth;
        const height = metadata.height || Math.floor(width * 0.75);

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
              }
            </style>
            <text x="${width - padding}" y="${height - padding}" text-anchor="end" class="text">
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

      return await transform.toBuffer();
    } catch (error) {
      this.logger.error(`Error processing image buffer: ${error.message}`);
      throw error;
    }
  }

<<<<<<< HEAD
      // Always delete the original upload as we now have a processed version with a unique name
      fs.unlink(absoluteFilePath, (err) => {
        if (err) this.logger.error(`Failed to delete original file ${absoluteFilePath}: ${err.message}`);
      });

      // Return the path relative to the project root (starting from 'uploads')
      const relativePath = path.relative(process.cwd(), newPath).replace(/\\/g, '/');
      
      await this.cacheManager.set(cacheKey, relativePath, 3600 * 1000);
      return relativePath;
    } catch (error) {
      this.logger.error(`Error processing image ${absoluteFilePath}: ${error.message}`);
      
      // Fallback: Try to return a relative path to the original file if processing failed
      try {
        const relativeOriginal = path.relative(process.cwd(), absoluteFilePath).replace(/\\/g, '/');
        return relativeOriginal;
      } catch (e) {
        return absoluteFilePath; // Absolute path as last resort
      }
=======
  /**
   * Processes a buffer and saves it to a designated relative path under 'uploads'
   * @param buffer Input image buffer.
   * @param relativePath Target relative path (e.g. 'dp/62/avatar.jpg')
   * @param options Options for processing.
   * @returns The relative path starting with 'uploads/'
   */
  async processAndSave(
    buffer: Buffer,
    relativePath: string,
    options: ImageProcessOptions = {}
  ): Promise<string> {
    const processedBuffer = await this.processBuffer(buffer, options);
    
    // Ensure relativePath doesn't start with / or uploads/ for consistency
    let cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    if (cleanPath.startsWith('uploads/')) {
        cleanPath = cleanPath.substring(8);
    }
    
    const absolutePath = path.join(process.cwd(), 'uploads', cleanPath);
    const dir = path.dirname(absolutePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await fs.promises.writeFile(absolutePath, processedBuffer);
    
    const finalRelativePath = `uploads/${cleanPath.replace(/\\/g, '/')}`;
    return finalRelativePath;
  }

  /**
   * Legacy method - refactored to be EPERM safe on Windows.
   * Processes an image: strips EXIF, resizes, and re-encodes.
   * Replaces the original file and returns the relative path for the DB.
   */
  async processAndReplace(
    absoluteFilePath: string,
    options: ImageProcessOptions = {}
  ): Promise<string> {
    try {
      const buffer = await fs.promises.readFile(absoluteFilePath);
      const { format = 'jpeg' } = options;
      
      const dir = path.dirname(absoluteFilePath);
      const ext = path.extname(absoluteFilePath);
      const filename = path.basename(absoluteFilePath, ext);
      const newFilename = `${filename}.${format}`;
      const newPath = path.join(dir, newFilename);

      const processedBuffer = await this.processBuffer(buffer, options);
      await fs.promises.writeFile(newPath, processedBuffer);

      // Successfully wrote new file, now try to delete old one if different
      if (absoluteFilePath !== newPath) {
        try {
          await fs.promises.unlink(absoluteFilePath);
        } catch (unlinkError) {
          this.logger.warn(`Failed to delete original file ${absoluteFilePath}: ${unlinkError.message}`);
        }
      }

      const uploadsIndex = newPath.indexOf('uploads');
      return uploadsIndex !== -1 ? newPath.substring(uploadsIndex).replace(/\\/g, '/') : newPath;
    } catch (error) {
      this.logger.error(`Error in processAndReplace for ${absoluteFilePath}: ${error.message}`);
      return absoluteFilePath;
>>>>>>> 5b3aa7733a696cb8cea4b3144771ecdd6f0008a4
    }
  }
}
