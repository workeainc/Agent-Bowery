import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { Readable } from 'stream';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface VideoProcessingOptions {
  width?: number;
  height?: number;
  bitrate?: string;
  format?: 'mp4' | 'webm' | 'mov';
}

export interface ProcessedVideo {
  buffer: Buffer;
  width: number;
  height: number;
  duration: number;
  format: string;
  size: number;
}

export interface VideoProcessingOptions {
  width?: number;
  height?: number;
  bitrate?: string;
  format?: 'mp4' | 'webm' | 'mov';
  quality?: 'low' | 'medium' | 'high';
  fps?: number;
}

@Injectable()
export class MediaProcessingService {
  private readonly logger = new Logger(MediaProcessingService.name);

  /**
   * Process image for different platforms
   */
  async processImage(imageBuffer: Buffer, platform: string, options?: ImageProcessingOptions): Promise<ProcessedImage> {
    try {
      const platformOptions = this.getPlatformImageOptions(platform);
      const finalOptions = { ...platformOptions, ...options };

      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      // Resize if needed
      if (finalOptions.width || finalOptions.height) {
        image.resize(finalOptions.width, finalOptions.height, {
          fit: finalOptions.fit || 'cover',
          withoutEnlargement: true
        });
      }

      // Convert format and apply quality
      if (finalOptions.format) {
        switch (finalOptions.format) {
          case 'jpeg':
            image.jpeg({ quality: finalOptions.quality || 85 });
            break;
          case 'png':
            image.png({ quality: finalOptions.quality || 90 });
            break;
          case 'webp':
            image.webp({ quality: finalOptions.quality || 80 });
            break;
        }
      }

      const processedBuffer = await image.toBuffer();
      const processedMetadata = await sharp(processedBuffer).metadata();

      return {
        buffer: processedBuffer,
        width: processedMetadata.width || 0,
        height: processedMetadata.height || 0,
        format: finalOptions.format || metadata.format || 'jpeg',
        size: processedBuffer.length
      };
    } catch (error: any) {
      this.logger.error('Image processing failed:', error);
      throw new Error(`Image processing failed: ${error?.message}`);
    }
  }

  /**
   * Generate thumbnail from image
   */
  async generateThumbnail(imageBuffer: Buffer, size: number = 300): Promise<ProcessedImage> {
    try {
      const thumbnail = await sharp(imageBuffer)
        .resize(size, size, {
          fit: 'cover',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      const metadata = await sharp(thumbnail).metadata();

      return {
        buffer: thumbnail,
        width: metadata.width || size,
        height: metadata.height || size,
        format: 'jpeg',
        size: thumbnail.length
      };
    } catch (error: any) {
      this.logger.error('Thumbnail generation failed:', error);
      throw new Error(`Thumbnail generation failed: ${error?.message}`);
    }
  }

  /**
   * Process video for different platforms
   */
  async processVideo(videoBuffer: Buffer, platform: string, options?: VideoProcessingOptions): Promise<ProcessedVideo> {
    try {
      const platformOptions = this.getPlatformVideoOptions(platform);
      const finalOptions = { ...platformOptions, ...options };

      // Create temporary files
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const inputPath = path.join(tempDir, `input_${Date.now()}.mp4`);
      const outputPath = path.join(tempDir, `output_${Date.now()}.${finalOptions.format || 'mp4'}`);

      // Write input buffer to file
      fs.writeFileSync(inputPath, videoBuffer);

      // Build FFmpeg command
      const ffmpegCmd = this.buildFFmpegCommand(inputPath, outputPath, finalOptions);

      // Execute FFmpeg
      await execAsync(ffmpegCmd);

      // Read processed video
      const processedBuffer = fs.readFileSync(outputPath);
      const metadata = await this.getVideoMetadata(outputPath);

      // Cleanup temporary files
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);

      return {
        buffer: processedBuffer,
        width: metadata.width,
        height: metadata.height,
        duration: metadata.duration,
        format: finalOptions.format || 'mp4',
        size: processedBuffer.length
      };
    } catch (error: any) {
      this.logger.error('Video processing failed:', error);
      throw new Error(`Video processing failed: ${error?.message}`);
    }
  }

  /**
   * Extract thumbnail from video using FFmpeg
   */
  async extractVideoThumbnail(videoBuffer: Buffer, timeOffset: number = 1): Promise<ProcessedImage> {
    try {
      // Create temporary files
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const inputPath = path.join(tempDir, `video_${Date.now()}.mp4`);
      const outputPath = path.join(tempDir, `thumb_${Date.now()}.jpg`);

      // Write input buffer to file
      fs.writeFileSync(inputPath, videoBuffer);

      // Extract thumbnail using FFmpeg
      const ffmpegCmd = `ffmpeg -i "${inputPath}" -ss ${timeOffset} -vframes 1 -q:v 2 "${outputPath}"`;
      await execAsync(ffmpegCmd);

      // Read thumbnail
      const thumbnailBuffer = fs.readFileSync(outputPath);
      const metadata = await sharp(thumbnailBuffer).metadata();

      // Cleanup temporary files
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);

      return {
        buffer: thumbnailBuffer,
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: 'jpeg',
        size: thumbnailBuffer.length
      };
    } catch (error: any) {
      this.logger.error('Video thumbnail extraction failed:', error);
      // Fallback to placeholder
      this.logger.warn('Using placeholder thumbnail due to FFmpeg error');
      
      const placeholder = await sharp({
        create: {
          width: 640,
          height: 360,
          channels: 3,
          background: { r: 128, g: 128, b: 128 }
        }
      })
        .jpeg()
        .toBuffer();

      return {
        buffer: placeholder,
        width: 640,
        height: 360,
        format: 'jpeg',
        size: placeholder.length
      };
    }
  }

  /**
   * Get video metadata using FFprobe
   */
  async getVideoMetadata(videoPath: string): Promise<{ width: number; height: number; duration: number; format: string }> {
    try {
      const ffprobeCmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`;
      const { stdout } = await execAsync(ffprobeCmd);
      const metadata = JSON.parse(stdout);

      const videoStream = metadata.streams.find((stream: any) => stream.codec_type === 'video');
      
      return {
        width: videoStream?.width || 0,
        height: videoStream?.height || 0,
        duration: parseFloat(metadata.format?.duration || '0'),
        format: metadata.format?.format_name || 'unknown'
      };
    } catch (error) {
      this.logger.error('Failed to get video metadata:', error);
      return { width: 0, height: 0, duration: 0, format: 'unknown' };
    }
  }

  /**
   * Build FFmpeg command for video processing
   */
  private buildFFmpegCommand(inputPath: string, outputPath: string, options: VideoProcessingOptions): string {
    let cmd = `ffmpeg -i "${inputPath}"`;

    // Video codec and quality
    if (options.format === 'mp4') {
      cmd += ' -c:v libx264';
    } else if (options.format === 'webm') {
      cmd += ' -c:v libvpx-vp9';
    }

    // Resolution
    if (options.width && options.height) {
      cmd += ` -vf scale=${options.width}:${options.height}`;
    }

    // Bitrate
    if (options.bitrate) {
      cmd += ` -b:v ${options.bitrate}`;
    } else if (options.quality) {
      const bitrates = { low: '500k', medium: '1000k', high: '2000k' };
      cmd += ` -b:v ${bitrates[options.quality]}`;
    }

    // FPS
    if (options.fps) {
      cmd += ` -r ${options.fps}`;
    }

    // Audio
    cmd += ' -c:a aac -b:a 128k';

    // Output
    cmd += ` -y "${outputPath}"`;

    return cmd;
  }

  /**
   * Get platform-specific video options
   */
  private getPlatformVideoOptions(platform: string): VideoProcessingOptions {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return {
          width: 1080,
          height: 1080,
          format: 'mp4',
          quality: 'high',
          fps: 30
        };
      case 'facebook':
        return {
          width: 1280,
          height: 720,
          format: 'mp4',
          quality: 'medium',
          fps: 30
        };
      case 'youtube':
        return {
          width: 1920,
          height: 1080,
          format: 'mp4',
          quality: 'high',
          fps: 30
        };
      default:
        return {
          format: 'mp4',
          quality: 'medium',
          fps: 30
        };
    }
  }

  /**
   * Validate image file
   */
  async validateImage(imageBuffer: Buffer): Promise<{ valid: boolean; error?: string; metadata?: any }> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      // Check if it's a valid image
      if (!metadata.width || !metadata.height) {
        return { valid: false, error: 'Invalid image dimensions' };
      }

      // Check file size (max 10MB)
      if (imageBuffer.length > 10 * 1024 * 1024) {
        return { valid: false, error: 'Image too large (max 10MB)' };
      }

      // Check dimensions (max 4096x4096)
      if (metadata.width > 4096 || metadata.height > 4096) {
        return { valid: false, error: 'Image dimensions too large (max 4096x4096)' };
      }

      return { valid: true, metadata };
    } catch (error) {
      return { valid: false, error: 'Invalid image file' };
    }
  }

  /**
   * Get platform-specific image requirements
   */
  private getPlatformImageOptions(platform: string): ImageProcessingOptions {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return {
          width: 1200,
          height: 630,
          quality: 85,
          format: 'jpeg',
          fit: 'cover'
        };

      case 'instagram':
        return {
          width: 1080,
          height: 1080,
          quality: 90,
          format: 'jpeg',
          fit: 'cover'
        };

      case 'linkedin':
        return {
          width: 1200,
          height: 627,
          quality: 85,
          format: 'jpeg',
          fit: 'cover'
        };

      case 'twitter':
        return {
          width: 1200,
          height: 675,
          quality: 85,
          format: 'jpeg',
          fit: 'cover'
        };

      default:
        return {
          quality: 85,
          format: 'jpeg',
          fit: 'cover'
        };
    }
  }

  /**
   * Convert image to base64 data URL
   */
  async imageToBase64(imageBuffer: Buffer, mimeType: string = 'image/jpeg'): Promise<string> {
    const base64 = imageBuffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Convert base64 data URL to buffer
   */
  base64ToBuffer(dataUrl: string): Buffer {
    const base64Data = dataUrl.split(',')[1];
    return Buffer.from(base64Data, 'base64');
  }

  /**
   * Get image metadata without processing
   */
  async getImageMetadata(imageBuffer: Buffer): Promise<any> {
    try {
      return await sharp(imageBuffer).metadata();
    } catch (error) {
      this.logger.error('Failed to get image metadata:', error);
      return null;
    }
  }

  /**
   * Create image collage (multiple images in one)
   */
  async createImageCollage(images: Buffer[], layout: 'horizontal' | 'vertical' | 'grid' = 'horizontal'): Promise<ProcessedImage> {
    try {
      const processedImages = await Promise.all(
        images.map(img => this.processImage(img, 'default', { width: 400, height: 400 }))
      );

      let collageWidth: number;
      let collageHeight: number;
      let collageBuffer: Buffer;

      switch (layout) {
        case 'horizontal':
          collageWidth = processedImages.reduce((sum, img) => sum + img.width, 0);
          collageHeight = Math.max(...processedImages.map(img => img.height));
          collageBuffer = await sharp({
            create: {
              width: collageWidth,
              height: collageHeight,
              channels: 3,
              background: { r: 255, g: 255, b: 255 }
            }
          })
            .composite(
              processedImages.map((img, index) => ({
                input: img.buffer,
                left: processedImages.slice(0, index).reduce((sum, i) => sum + i.width, 0),
                top: 0
              }))
            )
            .jpeg()
            .toBuffer();
          break;

        case 'vertical':
          collageWidth = Math.max(...processedImages.map(img => img.width));
          collageHeight = processedImages.reduce((sum, img) => sum + img.height, 0);
          collageBuffer = await sharp({
            create: {
              width: collageWidth,
              height: collageHeight,
              channels: 3,
              background: { r: 255, g: 255, b: 255 }
            }
          })
            .composite(
              processedImages.map((img, index) => ({
                input: img.buffer,
                left: 0,
                top: processedImages.slice(0, index).reduce((sum, i) => sum + i.height, 0)
              }))
            )
            .jpeg()
            .toBuffer();
          break;

        case 'grid':
          const cols = Math.ceil(Math.sqrt(processedImages.length));
          const rows = Math.ceil(processedImages.length / cols);
          collageWidth = cols * 400;
          collageHeight = rows * 400;
          collageBuffer = await sharp({
            create: {
              width: collageWidth,
              height: collageHeight,
              channels: 3,
              background: { r: 255, g: 255, b: 255 }
            }
          })
            .composite(
              processedImages.map((img, index) => ({
                input: img.buffer,
                left: (index % cols) * 400,
                top: Math.floor(index / cols) * 400
              }))
            )
            .jpeg()
            .toBuffer();
          break;
      }

      return {
        buffer: collageBuffer,
        width: collageWidth,
        height: collageHeight,
        format: 'jpeg',
        size: collageBuffer.length
      };
    } catch (error: any) {
      this.logger.error('Image collage creation failed:', error);
      throw new Error(`Image collage creation failed: ${error?.message}`);
    }
  }

  /**
   * Add watermark to image
   */
  async addWatermark(imageBuffer: Buffer, watermarkBuffer: Buffer, position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'bottom-right'): Promise<ProcessedImage> {
    try {
      const image = sharp(imageBuffer);
      const imageMetadata = await image.metadata();
      
      // Resize watermark to 10% of image size
      const watermarkSize = Math.min(imageMetadata.width!, imageMetadata.height!) * 0.1;
      const watermark = await sharp(watermarkBuffer)
        .resize(watermarkSize, watermarkSize, { fit: 'inside' })
        .png()
        .toBuffer();

      let left: number;
      let top: number;

      switch (position) {
        case 'top-left':
          left = 10;
          top = 10;
          break;
        case 'top-right':
          left = imageMetadata.width! - watermarkSize - 10;
          top = 10;
          break;
        case 'bottom-left':
          left = 10;
          top = imageMetadata.height! - watermarkSize - 10;
          break;
        case 'bottom-right':
          left = imageMetadata.width! - watermarkSize - 10;
          top = imageMetadata.height! - watermarkSize - 10;
          break;
      }

      const watermarkedBuffer = await image
        .composite([{
          input: watermark,
          left: left,
          top: top
        }])
        .jpeg()
        .toBuffer();

      return {
        buffer: watermarkedBuffer,
        width: imageMetadata.width!,
        height: imageMetadata.height!,
        format: 'jpeg',
        size: watermarkedBuffer.length
      };
    } catch (error: any) {
      this.logger.error('Watermark addition failed:', error);
      throw new Error(`Watermark addition failed: ${error?.message}`);
    }
  }
}
