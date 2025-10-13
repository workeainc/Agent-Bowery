import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class StorageManagementService {
  private readonly logger = new Logger(StorageManagementService.name);
  private readonly tempDir = path.join(process.cwd(), 'temp');
  private readonly maxFileAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor() {
    this.ensureTempDirectory();
  }

  /**
   * Ensure temp directory exists
   */
  private ensureTempDirectory(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
      this.logger.log(`Created temp directory: ${this.tempDir}`);
    }
  }

  /**
   * Store temporary file
   */
  async storeTempFile(buffer: Buffer, filename: string): Promise<string> {
    this.ensureTempDirectory();
    
    const filePath = path.join(this.tempDir, filename);
    fs.writeFileSync(filePath, buffer);
    
    this.logger.debug(`Stored temporary file: ${filename}`);
    return filePath;
  }

  /**
   * Get temporary file
   */
  async getTempFile(filename: string): Promise<Buffer | null> {
    const filePath = path.join(this.tempDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    return fs.readFileSync(filePath);
  }

  /**
   * Delete temporary file
   */
  async deleteTempFile(filename: string): Promise<boolean> {
    const filePath = path.join(this.tempDir, filename);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.debug(`Deleted temporary file: ${filename}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Failed to delete temporary file ${filename}:`, error);
      return false;
    }
  }

  /**
   * Clean up old temporary files
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldFiles(): Promise<void> {
    try {
      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > this.maxFileAge) {
          fs.unlinkSync(filePath);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.logger.log(`Cleaned up ${cleanedCount} old temporary files`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old files:', error);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    oldestFile: Date | null;
    newestFile: Date | null;
  }> {
    try {
      const files = fs.readdirSync(this.tempDir);
      let totalSize = 0;
      let oldestFile: Date | null = null;
      let newestFile: Date | null = null;

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        
        totalSize += stats.size;
        
        if (!oldestFile || stats.mtime < oldestFile) {
          oldestFile = stats.mtime;
        }
        
        if (!newestFile || stats.mtime > newestFile) {
          newestFile = stats.mtime;
        }
      }

      return {
        totalFiles: files.length,
        totalSize,
        oldestFile,
        newestFile
      };
    } catch (error) {
      this.logger.error('Failed to get storage stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        oldestFile: null,
        newestFile: null
      };
    }
  }

  /**
   * Clean up all temporary files
   */
  async cleanupAllFiles(): Promise<number> {
    try {
      const files = fs.readdirSync(this.tempDir);
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        fs.unlinkSync(filePath);
        cleanedCount++;
      }

      this.logger.log(`Cleaned up all ${cleanedCount} temporary files`);
      return cleanedCount;
    } catch (error) {
      this.logger.error('Failed to cleanup all files:', error);
      return 0;
    }
  }
}
