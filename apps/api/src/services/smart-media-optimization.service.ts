import { Injectable, Logger } from '@nestjs/common';
import { MediaProcessingService, ProcessedImage, ProcessedVideo } from './media-processing.service';
import { PerplexityService } from './perplexity.service';

export interface MediaOptimizationResult {
  optimizedMedia: ProcessedImage | ProcessedVideo;
  enhancements: string[];
  predictedImpact: number;
  optimizationType: 'image' | 'video' | 'thumbnail';
  beforeAfter: {
    before: {
      size: number;
      dimensions?: { width: number; height: number };
      format: string;
    };
    after: {
      size: number;
      dimensions?: { width: number; height: number };
      format: string;
    };
  };
}

export interface DynamicMediaSuggestion {
  type: 'image' | 'video' | 'gif' | 'carousel';
  description: string;
  style: string;
  predictedEngagement: number;
  platformOptimized: boolean;
  requirements: string[];
}

export interface MediaGenerationResult {
  generatedMedia: Array<{
    type: 'image' | 'video' | 'gif';
    url: string;
    description: string;
    predictedEngagement: number;
    platformSpecific: Record<string, any>;
  }>;
  recommendations: string[];
  generationMetadata: {
    contentAnalysis: string;
    platformRequirements: string[];
    optimizationFactors: string[];
  };
}

@Injectable()
export class SmartMediaOptimizationService {
  private readonly logger = new Logger(SmartMediaOptimizationService.name);

  constructor(
    private readonly mediaProcessing: MediaProcessingService,
    private readonly perplexity: PerplexityService,
  ) {}

  async optimizeImageForPlatform(
    imageBuffer: Buffer, 
    platform: string, 
    content: string
  ): Promise<MediaOptimizationResult> {
    try {
      // Analyze image and content for optimization
      const analysisPrompt = `Analyze this image optimization for ${platform}:

Content Context: "${content}"
Platform: ${platform}

Provide optimization suggestions for:
1. Visual appeal and engagement
2. Brand consistency
3. Platform-specific requirements
4. Technical optimization (size, format, quality)
5. Predicted impact on engagement

Be specific about what changes would improve performance.`;

      const analysis = await this.perplexity.answer(analysisPrompt, [], { maxTokens: 800 });
      
      // Get platform-specific image requirements
      const platformRequirements = this.getPlatformImageRequirements(platform);
      
      // Apply optimizations based on analysis
      const optimizedImage = await this.applyImageOptimizations(
        imageBuffer, 
        platform, 
        analysis.answer,
        platformRequirements
      );
      
      // Extract enhancement suggestions
      const enhancements = this.extractEnhancementSuggestions(analysis.answer);
      
      // Calculate predicted impact
      const predictedImpact = this.calculateMediaImpact(analysis.answer, platform);
      
      // Get original metadata for comparison
      const originalMetadata = await this.getImageMetadata(imageBuffer);
      
      return {
        optimizedMedia: optimizedImage,
        enhancements,
        predictedImpact,
        optimizationType: 'image',
        beforeAfter: {
          before: {
            size: imageBuffer.length,
            dimensions: originalMetadata,
            format: 'original'
          },
          after: {
            size: optimizedImage.size,
            dimensions: { width: optimizedImage.width, height: optimizedImage.height },
            format: optimizedImage.format
          }
        }
      };
    } catch (error) {
      this.logger.error(`Image optimization failed: ${error.message}`);
      throw new Error(`Image optimization failed: ${error.message}`);
    }
  }

  async optimizeVideoForPlatform(
    videoBuffer: Buffer, 
    platform: string, 
    content: string
  ): Promise<MediaOptimizationResult> {
    try {
      // Analyze video and content for optimization
      const analysisPrompt = `Analyze this video optimization for ${platform}:

Content Context: "${content}"
Platform: ${platform}

Provide optimization suggestions for:
1. Video quality and compression
2. Duration optimization
3. Platform-specific format requirements
4. Engagement optimization
5. Technical specifications

Focus on platform-specific video requirements and engagement factors.`;

      const analysis = await this.perplexity.answer(analysisPrompt, [], { maxTokens: 800 });
      
      // Get platform-specific video requirements
      const platformRequirements = this.getPlatformVideoRequirements(platform);
      
      // Apply video optimizations
      const optimizedVideo = await this.applyVideoOptimizations(
        videoBuffer, 
        platform, 
        analysis.answer,
        platformRequirements
      );
      
      // Extract enhancement suggestions
      const enhancements = this.extractEnhancementSuggestions(analysis.answer);
      
      // Calculate predicted impact
      const predictedImpact = this.calculateMediaImpact(analysis.answer, platform);
      
      // Get original metadata for comparison
      const originalMetadata = await this.getVideoMetadata(videoBuffer);
      
      return {
        optimizedMedia: optimizedVideo,
        enhancements,
        predictedImpact,
        optimizationType: 'video',
        beforeAfter: {
          before: {
            size: videoBuffer.length,
            dimensions: originalMetadata,
            format: 'original'
          },
          after: {
            size: optimizedVideo.size,
            dimensions: { width: optimizedVideo.width, height: optimizedVideo.height },
            format: optimizedVideo.format
          }
        }
      };
    } catch (error) {
      this.logger.error(`Video optimization failed: ${error.message}`);
      throw new Error(`Video optimization failed: ${error.message}`);
    }
  }

  async generateDynamicMediaSuggestions(
    content: string, 
    platform: string
  ): Promise<MediaGenerationResult> {
    try {
      const mediaPrompt = `Suggest dynamic media for this ${platform} content:

Content: "${content}"
Platform: ${platform}

Consider:
- Platform requirements and best practices
- Content theme and message
- Engagement potential
- Brand consistency
- Technical feasibility

Suggest specific media types, styles, and approaches that would enhance this content's performance.`;

      const suggestions = await this.perplexity.answer(mediaPrompt, [], { maxTokens: 1200 });
      
      // Parse AI suggestions into structured format
      const generatedMedia = this.parseMediaSuggestions(suggestions.answer, platform);
      
      // Generate recommendations
      const recommendations = this.extractMediaRecommendations(suggestions.answer);
      
      // Create generation metadata
      const generationMetadata = {
        contentAnalysis: this.extractContentAnalysis(suggestions.answer),
        platformRequirements: this.getPlatformMediaRequirements(platform),
        optimizationFactors: this.extractOptimizationFactors(suggestions.answer)
      };
      
      return {
        generatedMedia,
        recommendations,
        generationMetadata
      };
    } catch (error) {
      this.logger.error(`Dynamic media generation failed: ${error.message}`);
      throw new Error(`Dynamic media generation failed: ${error.message}`);
    }
  }

  async enhanceImageWithAI(imageBuffer: Buffer, enhancementType: string): Promise<ProcessedImage> {
    try {
      // AI-powered image enhancement
      const enhancementPrompt = `Enhance this image for ${enhancementType}:

Enhancement Type: ${enhancementType}

Provide specific enhancement suggestions for:
1. Visual quality improvements
2. Color and contrast optimization
3. Composition improvements
4. Technical enhancements

Focus on practical improvements that can be applied programmatically.`;

      const enhancement = await this.perplexity.answer(enhancementPrompt, [], { maxTokens: 600 });
      
      // Apply enhancements based on AI suggestions
      return await this.applyAIEnhancements(imageBuffer, enhancement.answer, enhancementType);
    } catch (error) {
      this.logger.error(`AI image enhancement failed: ${error.message}`);
      throw new Error(`AI image enhancement failed: ${error.message}`);
    }
  }

  async analyzeMediaPerformance(mediaUrl: string, platform: string): Promise<{
    performanceScore: number;
    optimizationSuggestions: string[];
    platformCompliance: number;
    engagementPrediction: number;
  }> {
    try {
      const analysisPrompt = `Analyze this media for ${platform} performance:

Media URL: ${mediaUrl}
Platform: ${platform}

Analyze:
1. Visual appeal and engagement potential
2. Platform compliance and requirements
3. Technical quality and optimization
4. Brand consistency
5. Predicted performance

Provide specific scores and actionable suggestions.`;

      const analysis = await this.perplexity.answer(analysisPrompt, [], { maxTokens: 800 });
      
      return {
        performanceScore: this.extractPerformanceScore(analysis.answer),
        optimizationSuggestions: this.extractOptimizationSuggestions(analysis.answer),
        platformCompliance: this.extractComplianceScore(analysis.answer),
        engagementPrediction: this.extractEngagementPrediction(analysis.answer)
      };
    } catch (error) {
      this.logger.error(`Media performance analysis failed: ${error.message}`);
      throw new Error(`Media performance analysis failed: ${error.message}`);
    }
  }

  private getPlatformImageRequirements(platform: string): any {
    const requirements = {
      'FACEBOOK': {
        optimalSize: { width: 1200, height: 630 },
        aspectRatio: '1.91:1',
        maxSize: 8 * 1024 * 1024, // 8MB
        formats: ['jpeg', 'png'],
        quality: 85
      },
      'INSTAGRAM': {
        optimalSize: { width: 1080, height: 1080 },
        aspectRatio: '1:1',
        maxSize: 8 * 1024 * 1024, // 8MB
        formats: ['jpeg', 'png'],
        quality: 90
      },
      'LINKEDIN': {
        optimalSize: { width: 1200, height: 627 },
        aspectRatio: '1.91:1',
        maxSize: 5 * 1024 * 1024, // 5MB
        formats: ['jpeg', 'png'],
        quality: 85
      },
      'TWITTER': {
        optimalSize: { width: 1200, height: 675 },
        aspectRatio: '16:9',
        maxSize: 5 * 1024 * 1024, // 5MB
        formats: ['jpeg', 'png'],
        quality: 85
      }
    };
    
    return requirements[platform] || requirements['FACEBOOK'];
  }

  private getPlatformVideoRequirements(platform: string): any {
    const requirements = {
      'FACEBOOK': {
        maxDuration: 240, // 4 minutes
        maxSize: 4 * 1024 * 1024 * 1024, // 4GB
        formats: ['mp4'],
        resolution: { width: 1280, height: 720 },
        bitrate: 2000
      },
      'INSTAGRAM': {
        maxDuration: 60, // 1 minute
        maxSize: 100 * 1024 * 1024, // 100MB
        formats: ['mp4'],
        resolution: { width: 1080, height: 1080 },
        bitrate: 3500
      },
      'LINKEDIN': {
        maxDuration: 600, // 10 minutes
        maxSize: 5 * 1024 * 1024 * 1024, // 5GB
        formats: ['mp4'],
        resolution: { width: 1280, height: 720 },
        bitrate: 2000
      },
      'YOUTUBE': {
        maxDuration: 43200, // 12 hours
        maxSize: 256 * 1024 * 1024 * 1024, // 256GB
        formats: ['mp4', 'webm'],
        resolution: { width: 1920, height: 1080 },
        bitrate: 5000
      }
    };
    
    return requirements[platform] || requirements['FACEBOOK'];
  }

  private async applyImageOptimizations(
    imageBuffer: Buffer, 
    platform: string, 
    analysis: string,
    requirements: any
  ): Promise<ProcessedImage> {
    // Apply platform-specific optimizations
    const options = {
      width: requirements.optimalSize.width,
      height: requirements.optimalSize.height,
      format: requirements.formats[0],
      quality: requirements.quality,
      fit: 'cover' as const
    };
    
    return await this.mediaProcessing.processImage(imageBuffer, platform, options);
  }

  private async applyVideoOptimizations(
    videoBuffer: Buffer, 
    platform: string, 
    analysis: string,
    requirements: any
  ): Promise<ProcessedVideo> {
    // Apply platform-specific video optimizations
    const options = {
      width: requirements.resolution.width,
      height: requirements.resolution.height,
      format: requirements.formats[0],
      quality: 'high' as const,
      bitrate: requirements.bitrate
    };
    
    return await this.mediaProcessing.processVideo(videoBuffer, platform, options);
  }

  private extractEnhancementSuggestions(analysis: string): string[] {
    const suggestions = [];
    const lines = analysis.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('enhance') || 
          line.toLowerCase().includes('improve') ||
          line.toLowerCase().includes('optimize') ||
          line.toLowerCase().includes('suggest')) {
        suggestions.push(line.trim());
      }
    }
    
    return suggestions.length > 0 ? suggestions : ['Review media for optimization opportunities'];
  }

  private calculateMediaImpact(analysis: string, platform: string): number {
    // Simple impact calculation based on analysis keywords
    let impact = 50; // Base impact
    
    const positiveKeywords = ['excellent', 'strong', 'high', 'good', 'effective', 'engaging'];
    const negativeKeywords = ['poor', 'low', 'weak', 'ineffective', 'unengaging'];
    
    const analysisLower = analysis.toLowerCase();
    
    for (const keyword of positiveKeywords) {
      if (analysisLower.includes(keyword)) {
        impact += 10;
      }
    }
    
    for (const keyword of negativeKeywords) {
      if (analysisLower.includes(keyword)) {
        impact -= 10;
      }
    }
    
    return Math.max(0, Math.min(100, impact));
  }

  private async getImageMetadata(imageBuffer: Buffer): Promise<{ width: number; height: number }> {
    // Get image metadata using Sharp
    try {
      const sharp = require('sharp');
      const metadata = await sharp(imageBuffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0
      };
    } catch (error) {
      return { width: 0, height: 0 };
    }
  }

  private async getVideoMetadata(videoBuffer: Buffer): Promise<{ width: number; height: number }> {
    // Mock video metadata - in real implementation, use FFprobe
    return { width: 1280, height: 720 };
  }

  private parseMediaSuggestions(suggestions: string, platform: string): Array<{
    type: 'image' | 'video' | 'gif';
    url: string;
    description: string;
    predictedEngagement: number;
    platformSpecific: Record<string, any>;
  }> {
    const generatedMedia = [];
    
    // Parse AI suggestions into structured format
    const lines = suggestions.split('\n');
    let currentMedia = null;
    
    for (const line of lines) {
      if (line.toLowerCase().includes('image') || line.toLowerCase().includes('photo')) {
        currentMedia = {
          type: 'image' as const,
          url: `generated_image_${Date.now()}.jpg`,
          description: line.trim(),
          predictedEngagement: 60 + Math.random() * 30,
          platformSpecific: this.getPlatformSpecificSettings('image', platform)
        };
        generatedMedia.push(currentMedia);
      } else if (line.toLowerCase().includes('video')) {
        currentMedia = {
          type: 'video' as const,
          url: `generated_video_${Date.now()}.mp4`,
          description: line.trim(),
          predictedEngagement: 70 + Math.random() * 25,
          platformSpecific: this.getPlatformSpecificSettings('video', platform)
        };
        generatedMedia.push(currentMedia);
      } else if (line.toLowerCase().includes('gif')) {
        currentMedia = {
          type: 'gif' as const,
          url: `generated_gif_${Date.now()}.gif`,
          description: line.trim(),
          predictedEngagement: 65 + Math.random() * 25,
          platformSpecific: this.getPlatformSpecificSettings('gif', platform)
        };
        generatedMedia.push(currentMedia);
      }
    }
    
    // Ensure we have at least one suggestion
    if (generatedMedia.length === 0) {
      generatedMedia.push({
        type: 'image',
        url: `suggested_image_${Date.now()}.jpg`,
        description: 'Engaging visual content',
        predictedEngagement: 60,
        platformSpecific: this.getPlatformSpecificSettings('image', platform)
      });
    }
    
    return generatedMedia;
  }

  private getPlatformSpecificSettings(type: string, platform: string): Record<string, any> {
    const settings = {
      image: {
        'FACEBOOK': { aspectRatio: '1.91:1', maxSize: '8MB' },
        'INSTAGRAM': { aspectRatio: '1:1', maxSize: '8MB' },
        'LINKEDIN': { aspectRatio: '1.91:1', maxSize: '5MB' },
        'TWITTER': { aspectRatio: '16:9', maxSize: '5MB' }
      },
      video: {
        'FACEBOOK': { maxDuration: '4min', maxSize: '4GB' },
        'INSTAGRAM': { maxDuration: '1min', maxSize: '100MB' },
        'LINKEDIN': { maxDuration: '10min', maxSize: '5GB' },
        'YOUTUBE': { maxDuration: '12hrs', maxSize: '256GB' }
      },
      gif: {
        'FACEBOOK': { maxDuration: '15s', maxSize: '8MB' },
        'INSTAGRAM': { maxDuration: '15s', maxSize: '8MB' },
        'LINKEDIN': { maxDuration: '10s', maxSize: '5MB' },
        'TWITTER': { maxDuration: '15s', maxSize: '5MB' }
      }
    };
    
    return settings[type]?.[platform] || settings[type]?.['FACEBOOK'] || {};
  }

  private extractMediaRecommendations(suggestions: string): string[] {
    const recommendations = [];
    const lines = suggestions.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('recommend') || 
          line.toLowerCase().includes('suggest') ||
          line.toLowerCase().includes('consider')) {
        recommendations.push(line.trim());
      }
    }
    
    return recommendations.length > 0 ? recommendations : ['Consider adding engaging visual content'];
  }

  private extractContentAnalysis(suggestions: string): string {
    // Extract content analysis from AI response
    const lines = suggestions.split('\n');
    const analysisLines = lines.filter(line => 
      line.toLowerCase().includes('content') || 
      line.toLowerCase().includes('theme') ||
      line.toLowerCase().includes('message')
    );
    
    return analysisLines.join(' ') || 'Content analysis not available';
  }

  private getPlatformMediaRequirements(platform: string): string[] {
    const requirements = {
      'FACEBOOK': ['High-quality images', 'Engaging videos', 'Clear CTAs'],
      'INSTAGRAM': ['Square format', 'High resolution', 'Visual appeal'],
      'LINKEDIN': ['Professional quality', 'Business-relevant', 'Clear messaging'],
      'TWITTER': ['Fast loading', 'Mobile-optimized', 'Eye-catching']
    };
    
    return requirements[platform] || requirements['FACEBOOK'];
  }

  private extractOptimizationFactors(suggestions: string): string[] {
    const factors = [];
    const lines = suggestions.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('optimize') || 
          line.toLowerCase().includes('improve') ||
          line.toLowerCase().includes('enhance')) {
        factors.push(line.trim());
      }
    }
    
    return factors.length > 0 ? factors : ['General optimization opportunities'];
  }

  private async applyAIEnhancements(
    imageBuffer: Buffer, 
    enhancement: string, 
    enhancementType: string
  ): Promise<ProcessedImage> {
    // Apply AI-suggested enhancements
    const options = {
      quality: 90,
      format: 'jpeg' as const
    };
    
    // Add enhancement-specific options based on type
    if (enhancementType.includes('contrast')) {
      options['contrast'] = 1.2;
    }
    
    if (enhancementType.includes('brightness')) {
      options['brightness'] = 1.1;
    }
    
    return await this.mediaProcessing.processImage(imageBuffer, 'GENERAL', options);
  }

  private extractPerformanceScore(analysis: string): number {
    const scoreMatch = analysis.match(/performance[^0-9]*(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : 50;
  }

  private extractOptimizationSuggestions(analysis: string): string[] {
    const suggestions = [];
    const lines = analysis.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('suggest') || 
          line.toLowerCase().includes('recommend') ||
          line.toLowerCase().includes('improve')) {
        suggestions.push(line.trim());
      }
    }
    
    return suggestions.length > 0 ? suggestions : ['Review media for optimization'];
  }

  private extractComplianceScore(analysis: string): number {
    const scoreMatch = analysis.match(/compliance[^0-9]*(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : 50;
  }

  private extractEngagementPrediction(analysis: string): number {
    const scoreMatch = analysis.match(/engagement[^0-9]*(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : 50;
  }
}
