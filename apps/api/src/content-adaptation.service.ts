import { Injectable } from '@nestjs/common';

export interface AdaptationRules {
  maxTextLength: number;
  maxHashtags: number;
  requiresImage: boolean;
  allowedMediaTypes: string[];
  linkPreview: boolean;
  emojiSupport: boolean;
}

export interface AdaptedContent {
  text: string;
  hashtags: string[];
  mediaUrls: string[];
  linkPreview?: string;
  platformSpecific: Record<string, any>;
}

@Injectable()
export class ContentAdaptationService {
  private readonly platformRules: Record<string, AdaptationRules> = {
    FACEBOOK: {
      maxTextLength: 63206,
      maxHashtags: 30,
      requiresImage: false,
      allowedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
      linkPreview: true,
      emojiSupport: true,
    },
    INSTAGRAM: {
      maxTextLength: 2200,
      maxHashtags: 30,
      requiresImage: true,
      allowedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
      linkPreview: false,
      emojiSupport: true,
    },
    INSTAGRAM_STORY: {
      maxTextLength: 1000,
      maxHashtags: 10,
      requiresImage: true,
      allowedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
      linkPreview: false,
      emojiSupport: true,
    },
    INSTAGRAM_REEL: {
      maxTextLength: 2200,
      maxHashtags: 30,
      requiresImage: false,
      allowedMediaTypes: ['video/mp4'],
      linkPreview: false,
      emojiSupport: true,
    },
    INSTAGRAM_IGTV: {
      maxTextLength: 2200,
      maxHashtags: 30,
      requiresImage: false,
      allowedMediaTypes: ['video/mp4'],
      linkPreview: false,
      emojiSupport: true,
    },
    INSTAGRAM_CAROUSEL: {
      maxTextLength: 2200,
      maxHashtags: 30,
      requiresImage: true,
      allowedMediaTypes: ['image/jpeg', 'image/png'],
      linkPreview: false,
      emojiSupport: true,
    },
    LINKEDIN: {
      maxTextLength: 3000,
      maxHashtags: 5,
      requiresImage: false,
      allowedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4', 'document/pdf'],
      linkPreview: true,
      emojiSupport: true,
    },
    YOUTUBE: {
      maxTextLength: 5000,
      maxHashtags: 15,
      requiresImage: false,
      allowedMediaTypes: ['video/mp4', 'video/webm'],
      linkPreview: false,
      emojiSupport: true,
    },
    GBP: {
      maxTextLength: 1500,
      maxHashtags: 10,
      requiresImage: false,
      allowedMediaTypes: ['image/jpeg', 'image/png'],
      linkPreview: false,
      emojiSupport: false,
    },
  };

  adaptContent(originalText: string, platform: string, mediaUrls: string[] = []): AdaptedContent {
    const rules = this.platformRules[platform];
    if (!rules) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Extract hashtags
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    const hashtags = originalText.match(hashtagRegex) || [];
    
    // Remove hashtags from text for length calculation
    const textWithoutHashtags = originalText.replace(hashtagRegex, '').trim();
    
    // Truncate text if needed
    let adaptedText = textWithoutHashtags;
    if (adaptedText.length > rules.maxTextLength) {
      adaptedText = adaptedText.substring(0, rules.maxTextLength - 3) + '...';
    }
    
    // Limit hashtags
    const adaptedHashtags = hashtags.slice(0, rules.maxHashtags);
    
    // Add hashtags back to text
    if (adaptedHashtags.length > 0) {
      adaptedText += '\n\n' + adaptedHashtags.join(' ');
    }
    
    // Filter media by platform rules
    const adaptedMediaUrls = mediaUrls.filter(url => {
      // Simple extension-based filtering (in real implementation, check MIME types)
      const extension = url.split('.').pop()?.toLowerCase();
      const allowedExtensions = rules.allowedMediaTypes.map(type => 
        type.split('/')[1].split(';')[0]
      );
      return extension && allowedExtensions.includes(extension);
    });
    
    // Platform-specific adaptations
    const platformSpecific: Record<string, any> = {};
    
    if (platform === 'FACEBOOK') {
      platformSpecific.allowComments = true;
      platformSpecific.scheduledPublish = true;
    } else if (platform === 'INSTAGRAM') {
      platformSpecific.caption = adaptedText;
      platformSpecific.hashtags = adaptedHashtags;
    } else if (platform === 'INSTAGRAM_STORY') {
      platformSpecific.caption = adaptedText;
      platformSpecific.hashtags = adaptedHashtags;
      platformSpecific.storyBackground = '#FFFFFF';
    } else if (platform === 'INSTAGRAM_REEL') {
      platformSpecific.caption = adaptedText;
      platformSpecific.hashtags = adaptedHashtags;
      platformSpecific.reelMusic = 'trending';
    } else if (platform === 'INSTAGRAM_IGTV') {
      platformSpecific.caption = adaptedText;
      platformSpecific.hashtags = adaptedHashtags;
      platformSpecific.title = adaptedText.substring(0, 100);
    } else if (platform === 'INSTAGRAM_CAROUSEL') {
      platformSpecific.caption = adaptedText;
      platformSpecific.hashtags = adaptedHashtags;
      platformSpecific.carouselCount = adaptedMediaUrls.length;
    } else if (platform === 'LINKEDIN') {
      platformSpecific.visibility = 'PUBLIC';
      platformSpecific.author = 'urn:li:person:1234567890';
    } else if (platform === 'YOUTUBE') {
      platformSpecific.privacyStatus = 'public';
      platformSpecific.categoryId = '22'; // People & Blogs
    } else if (platform === 'GBP') {
      platformSpecific.language = 'en';
      platformSpecific.location = 'New York, NY';
    }
    
    return {
      text: adaptedText,
      hashtags: adaptedHashtags,
      mediaUrls: adaptedMediaUrls,
      platformSpecific,
    };
  }

  validateContent(content: AdaptedContent, platform: string): { valid: boolean; errors: string[] } {
    const rules = this.platformRules[platform];
    const errors: string[] = [];
    
    if (!rules) {
      errors.push(`Unsupported platform: ${platform}`);
      return { valid: false, errors };
    }
    
    if (content.text.length > rules.maxTextLength) {
      errors.push(`Text exceeds maximum length of ${rules.maxTextLength} characters`);
    }
    
    if (content.hashtags.length > rules.maxHashtags) {
      errors.push(`Too many hashtags. Maximum allowed: ${rules.maxHashtags}`);
    }
    
    if (rules.requiresImage && content.mediaUrls.length === 0) {
      errors.push(`${platform} requires at least one image`);
    }
    
    if (content.mediaUrls.length > 0) {
      const invalidMedia = content.mediaUrls.filter(url => {
        const extension = url.split('.').pop()?.toLowerCase();
        const allowedExtensions = rules.allowedMediaTypes.map(type => 
          type.split('/')[1].split(';')[0]
        );
        return !extension || !allowedExtensions.includes(extension);
      });
      
      if (invalidMedia.length > 0) {
        errors.push(`Invalid media types: ${invalidMedia.join(', ')}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getPlatformRules(platform: string): AdaptationRules | null {
    return this.platformRules[platform] || null;
  }

  getAllPlatforms(): string[] {
    return Object.keys(this.platformRules);
  }
}
