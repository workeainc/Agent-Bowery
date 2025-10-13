import { Injectable, Logger } from '@nestjs/common';
import { PerplexityService } from './perplexity.service';
import { DbService } from '../db.service';
import { TemplateRenderService } from './template-render.service';
import { BrandRuleEnforcementService } from './brand-rule-enforcement.service';
import { EnhancedErrorHandlingService } from './enhanced-error-handling.service';
import { PipelineMonitoringService } from './pipeline-monitoring.service';

interface GenerateInput {
  kind: 'BLOG' | 'NEWSLETTER' | 'SOCIAL';
  brief: string;
  angle?: string;
  organizationId: string;
  channel?: string; // template channel, e.g., 'default'
  platform?: string; // for social content: 'FACEBOOK', 'INSTAGRAM', 'LINKEDIN', etc.
}

@Injectable()
export class ContentGenerationService {
  private readonly logger = new Logger(ContentGenerationService.name);

  constructor(
    private readonly perplexity: PerplexityService,
    private readonly db: DbService,
    private readonly renderer: TemplateRenderService,
    private readonly brandEnforcement: BrandRuleEnforcementService,
    private readonly errorHandling: EnhancedErrorHandlingService,
    private readonly pipelineMonitoring: PipelineMonitoringService,
  ) {}

  async generatePost(input: GenerateInput) {
    const pipelineId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    const context = this.errorHandling.createErrorContext(
      'content_generation',
      undefined,
      input.organizationId,
      { kind: input.kind, channel: input.channel }
    );

    try {
      // Start pipeline monitoring
      await this.pipelineMonitoring.startPipeline(pipelineId, {
        stages: [
          { id: 'search', name: 'Source Search', timeout: 30000, retryable: true },
          { id: 'outline', name: 'Outline Generation', timeout: 60000, retryable: true },
          { id: 'draft', name: 'Content Drafting', timeout: 120000, retryable: true },
          { id: 'factcheck', name: 'Fact Checking', timeout: 30000, retryable: true },
          { id: 'brand', name: 'Brand Validation', timeout: 15000, retryable: false }
        ],
        options: {
          timeout: 300000, // 5 minutes total
          retryPolicy: { maxRetries: 3, backoffMultiplier: 2 }
        }
      }, { input });

      const channel = input.channel || 'default';
      
      // Handle social content generation differently
      if (input.kind === 'SOCIAL') {
        return await this.generateSocialPostWithMonitoring(input, pipelineId, context);
      }

      // Original blog/newsletter generation logic
      return await this.generateLongFormContentWithMonitoring(input, pipelineId, context);
    } catch (error) {
      await this.pipelineMonitoring.updatePipelineStatus(pipelineId, 'failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async generateLongFormContentWithMonitoring(input: GenerateInput, pipelineId: string, context: any) {
    try {
      await this.pipelineMonitoring.startStage(pipelineId, 'search');
      
      const result = await this.errorHandling.executeWithRetry(
        () => this.generateLongFormContent(input),
        'long_form_content_generation',
        undefined,
        context
      );

      if (result.success) {
        await this.pipelineMonitoring.completeStage(pipelineId, 'search', true);
        await this.pipelineMonitoring.updatePipelineStatus(pipelineId, 'completed');
        return result.result;
      } else {
        await this.pipelineMonitoring.completeStage(pipelineId, 'search', false, result.error?.message);
        throw result.error;
      }
    } catch (error) {
      await this.pipelineMonitoring.completeStage(pipelineId, 'search', false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async generateSocialPostWithMonitoring(input: GenerateInput, pipelineId: string, context: any) {
    try {
      await this.pipelineMonitoring.startStage(pipelineId, 'search');
      
      const result = await this.errorHandling.executeWithRetry(
        () => this.generateSocialPost(input),
        'social_content_generation',
        undefined,
        context
      );

      if (result.success) {
        await this.pipelineMonitoring.completeStage(pipelineId, 'search', true);
        await this.pipelineMonitoring.updatePipelineStatus(pipelineId, 'completed');
        return result.result;
      } else {
        await this.pipelineMonitoring.completeStage(pipelineId, 'search', false, result.error?.message);
        throw result.error;
      }
    } catch (error) {
      await this.pipelineMonitoring.completeStage(pipelineId, 'search', false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async generateLongFormContent(input: GenerateInput) {
    const channel = input.channel || 'default';
    
    // 1) collect brief + angle (already provided in input)

    // 2) search sources (cached)
    const searchRes = await this.perplexity.search(`${input.kind} topic: ${input.brief} angle: ${input.angle || ''}`.trim());
    const sources: string[] = Array.isArray(searchRes?.data?.sources)
      ? searchRes.data.sources
      : (searchRes?.sources || []);

    // 3) synthesize outline with brand rules
    const outlineTemplate = await this.db.getLatestPromptTemplateByName('outline', channel);
    let outlinePrompt = outlineTemplate
      ? this.renderer.renderTemplate(outlineTemplate.template, { brief: input.brief, angle: input.angle, sources })
      : `Create a structured outline for a ${input.kind} based on these sources: ${JSON.stringify(sources)}. Brief: ${input.brief}. Angle: ${input.angle || ''}.`;
    
    // Enhance prompt with brand rules
    outlinePrompt = await this.brandEnforcement.generateBrandCompliantPrompt(outlinePrompt, input.organizationId);
    
    const outlineAns = await this.perplexity.answer(outlinePrompt, sources);

    // 4) draft with brand rules
    const draftTemplate = await this.db.getLatestPromptTemplateByName('draft', channel);
    let draftPrompt = draftTemplate
      ? this.renderer.renderTemplate(draftTemplate.template, { brief: input.brief, angle: input.angle, outline: outlineAns?.answer || outlineAns?.data || outlineAns })
      : `Write a full ${input.kind} draft using this outline: ${outlineAns?.answer || outlineAns?.data || outlineAns}.`;
    
    // Enhance prompt with brand rules
    draftPrompt = await this.brandEnforcement.generateBrandCompliantPrompt(draftPrompt, input.organizationId);
    
    const draftAns = await this.perplexity.answer(draftPrompt, sources);

    // 5) citations
    const citations = sources;

    // 6) fact-check pass (simple: check a few claims if present)
    const claims: string[] = [];
    const draftText = (draftAns?.answer || draftAns?.data || draftAns || '').toString();
    const sentences = draftText.split(/(?<=[.!?])\s+/).slice(0, 5);
    claims.push(...sentences);
    const factRes = await this.perplexity.factCheck(claims, 3);

    // 7) brand rule validation
    const brandValidation = await this.brandEnforcement.validateContentAgainstBrandRules(draftText, input.organizationId);

    return {
      outline: outlineAns,
      draft: draftAns,
      citations,
      factCheck: factRes,
      sources,
      brandValidation,
    };
  }

  private async generateSocialPost(input: GenerateInput) {
    const channel = input.channel || 'default';
    const platform = input.platform || 'FACEBOOK';
    
    // Platform-specific character limits and requirements
    const platformLimits = {
      'FACEBOOK': { maxLength: 63206, hashtags: 30, requiresImage: false },
      'INSTAGRAM': { maxLength: 2200, hashtags: 30, requiresImage: true },
      'INSTAGRAM_STORY': { maxLength: 1000, hashtags: 10, requiresImage: true },
      'LINKEDIN': { maxLength: 3000, hashtags: 5, requiresImage: false },
      'TWITTER': { maxLength: 280, hashtags: 5, requiresImage: false },
      'TIKTOK': { maxLength: 2200, hashtags: 30, requiresImage: false }
    };

    const limits = platformLimits[platform] || platformLimits['FACEBOOK'];

    // 1) Search for trending/relevant content (shorter search for social)
    const searchRes = await this.perplexity.search(`${platform} social media post about: ${input.brief}`, { topK: 5 });
    const sources: string[] = Array.isArray(searchRes?.data?.sources)
      ? searchRes.data.sources
      : (searchRes?.sources || []);

    // 2) Generate social-specific content
    const socialTemplate = await this.db.getLatestPromptTemplateByName(`social_${platform.toLowerCase()}`, channel) ||
                          await this.db.getLatestPromptTemplateByName('social', channel);
    
    let socialPrompt = socialTemplate
      ? this.renderer.renderTemplate(socialTemplate.template, { 
          brief: input.brief, 
          angle: input.angle, 
          platform,
          maxLength: limits.maxLength,
          maxHashtags: limits.hashtags,
          sources 
        })
      : `Create a ${platform} social media post about: ${input.brief}. 
         ${input.angle ? `Angle: ${input.angle}.` : ''}
         Keep it under ${limits.maxLength} characters.
         Include ${limits.hashtags} relevant hashtags.
         Make it engaging and platform-appropriate for ${platform}.`;

    // Enhance prompt with brand rules
    socialPrompt = await this.brandEnforcement.generateBrandCompliantPrompt(socialPrompt, input.organizationId);

    const socialAns = await this.perplexity.answer(socialPrompt, sources, { 
      maxTokens: Math.min(500, limits.maxLength / 2), // Conservative token limit
      temperature: 0.7 // More creative for social content
    });

    // 3) Extract hashtags and optimize content
    const generatedText = socialAns?.answer || socialAns?.data || '';
    const hashtags = this.extractHashtags(generatedText);
    const optimizedContent = this.optimizeForPlatform(generatedText, platform, limits);

    // 4) Generate platform-specific variations if needed
    const variations = await this.generatePlatformVariations(optimizedContent, platform, input);

    // 5) brand rule validation
    const brandValidation = await this.brandEnforcement.validateContentAgainstBrandRules(optimizedContent, input.organizationId);

    return {
      outline: null, // Social posts don't need outlines
      draft: { 
        answer: optimizedContent,
        platform,
        characterCount: optimizedContent.length,
        hashtags: hashtags.slice(0, limits.hashtags)
      },
      citations: sources.slice(0, 3), // Fewer citations for social
      factCheck: null, // Skip fact-checking for social posts
      sources,
      brandValidation,
      socialMetadata: {
        platform,
        characterCount: optimizedContent.length,
        hashtags: hashtags.slice(0, limits.hashtags),
        variations,
        limits
      }
    };
  }

  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    return text.match(hashtagRegex) || [];
  }

  private optimizeForPlatform(content: string, platform: string, limits: any): string {
    let optimized = content;
    
    // Remove excessive hashtags
    const hashtags = this.extractHashtags(optimized);
    if (hashtags.length > limits.hashtags) {
      const keepHashtags = hashtags.slice(0, limits.hashtags);
      const hashtagText = keepHashtags.join(' ');
      optimized = optimized.replace(/#[\w\u0590-\u05ff]+/g, '').trim() + '\n\n' + hashtagText;
    }

    // Truncate if too long
    if (optimized.length > limits.maxLength) {
      optimized = optimized.substring(0, limits.maxLength - 3) + '...';
    }

    // Platform-specific optimizations
    switch (platform) {
      case 'TWITTER':
        // Ensure it fits in Twitter's character limit
        if (optimized.length > 280) {
          optimized = optimized.substring(0, 277) + '...';
        }
        break;
      case 'INSTAGRAM':
        // Add line breaks for better readability
        optimized = optimized.replace(/\. /g, '.\n');
        break;
      case 'LINKEDIN':
        // More professional tone
        optimized = optimized.replace(/!/g, '.');
        break;
    }

    return optimized;
  }

  private async generatePlatformVariations(content: string, platform: string, input: GenerateInput): Promise<Record<string, string>> {
    const variations: Record<string, string> = {};
    
    // Generate variations for different platforms if not specified
    if (!input.platform) {
      const platforms = ['FACEBOOK', 'INSTAGRAM', 'LINKEDIN'];
      
      for (const targetPlatform of platforms) {
        if (targetPlatform !== platform) {
          const variationPrompt = `Adapt this social media post for ${targetPlatform}:
"${content}"

Make it appropriate for ${targetPlatform} while keeping the core message.`;
          
          try {
            const variation = await this.perplexity.answer(variationPrompt, [], { maxTokens: 200 });
            variations[targetPlatform] = variation?.answer || variation?.data || content;
          } catch (error) {
            this.logger.warn(`Failed to generate variation for ${targetPlatform}: ${error.message}`);
            variations[targetPlatform] = content; // Fallback to original
          }
        }
      }
    }

    return variations;
  }
}


