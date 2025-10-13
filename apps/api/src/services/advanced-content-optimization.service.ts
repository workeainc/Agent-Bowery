import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../db.service';
import { PerplexityService } from './perplexity.service';
import { ContentAdaptationService } from '../content-adaptation.service';

export interface OptimizationResult {
  optimizedContent: string;
  optimizationSuggestions: string[];
  predictedPerformance: number;
  changes: Array<{
    type: 'text' | 'hashtag' | 'structure' | 'tone' | 'length';
    description: string;
    impact: 'low' | 'medium' | 'high';
    before: string;
    after: string;
  }>;
  confidence: number;
}

export interface ABTestVariation {
  id: string;
  content: string;
  variation: string;
  description: string;
  predictedEngagement: number;
}

export interface ABTestPlan {
  testId: string;
  variations: ABTestVariation[];
  testPlan: {
    duration: number;
    trafficSplit: number[];
    successMetrics: string[];
    targetAudience?: string;
  };
}

@Injectable()
export class AdvancedContentOptimizationService {
  private readonly logger = new Logger(AdvancedContentOptimizationService.name);

  constructor(
    private readonly db: DbService,
    private readonly perplexity: PerplexityService,
    private readonly contentAdaptation: ContentAdaptationService,
  ) {}

  async optimizeContentForPerformance(
    content: string, 
    platform: string, 
    historicalData?: any
  ): Promise<OptimizationResult> {
    try {
      // Get platform-specific optimization guidelines
      const platformGuidelines = this.getPlatformOptimizationGuidelines(platform);
      
      // Create optimization prompt
      const optimizationPrompt = `Optimize this ${platform} content for maximum engagement and performance:

Original Content: "${content}"

Platform Guidelines:
${platformGuidelines}

Historical Performance Data: ${historicalData ? JSON.stringify(historicalData) : 'None available'}

Please provide:
1. Optimized content version
2. Specific changes made and why
3. Predicted performance improvement
4. Confidence level (1-10)

Focus on:
- Platform best practices
- Engagement optimization
- Audience appeal
- Current trends
- Content structure`;

      const optimization = await this.perplexity.answer(optimizationPrompt, [], { 
        maxTokens: 1500,
        temperature: 0.7 
      });

      const optimizedText = this.extractOptimizedContent(optimization.answer);
      const changes = this.analyzeChanges(content, optimizedText);
      const suggestions = this.extractSuggestions(optimization.answer);
      const predictedPerformance = this.calculatePredictedPerformance(content, optimizedText, platform);
      const confidence = this.extractConfidence(optimization.answer);

      return {
        optimizedContent: optimizedText,
        optimizationSuggestions: suggestions,
        predictedPerformance,
        changes,
        confidence
      };
    } catch (error) {
      this.logger.error(`Content optimization failed: ${error.message}`);
      throw new Error(`Content optimization failed: ${error.message}`);
    }
  }

  async generateABTestVariations(content: string, platform: string): Promise<ABTestPlan> {
    try {
      const testId = `ab_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      
      // Generate different types of variations
      const variationTypes = ['headline', 'hashtags', 'tone', 'length', 'structure'];
      const variations: ABTestVariation[] = [];

      for (const type of variationTypes) {
        try {
          const variation = await this.generateVariation(content, platform, type);
          variations.push({
            id: `${testId}_${type}`,
            content: variation.content,
            variation: type,
            description: variation.description,
            predictedEngagement: variation.predictedEngagement
          });
        } catch (error) {
          this.logger.warn(`Failed to generate ${type} variation: ${error.message}`);
        }
      }

      // Ensure we have at least 2 variations
      if (variations.length < 2) {
        // Fallback: create simple variations
        variations.push({
          id: `${testId}_original`,
          content: content,
          variation: 'original',
          description: 'Original content',
          predictedEngagement: 50
        });
        
        variations.push({
          id: `${testId}_optimized`,
          content: await this.simpleOptimization(content, platform),
          variation: 'optimized',
          description: 'Basic optimization',
          predictedEngagement: 65
        });
      }

      return {
        testId,
        variations,
        testPlan: {
          duration: 7, // days
          trafficSplit: this.calculateTrafficSplit(variations.length),
          successMetrics: ['engagement', 'reach', 'clicks', 'shares'],
          targetAudience: 'all'
        }
      };
    } catch (error) {
      this.logger.error(`AB test generation failed: ${error.message}`);
      throw new Error(`AB test generation failed: ${error.message}`);
    }
  }

  async analyzeContentPerformance(content: string, platform: string): Promise<{
    readabilityScore: number;
    engagementScore: number;
    platformCompliance: number;
    optimizationOpportunities: string[];
    recommendations: string[];
  }> {
    try {
      const analysisPrompt = `Analyze this ${platform} content for performance optimization:

Content: "${content}"

Provide analysis on:
1. Readability score (1-10)
2. Engagement potential (1-10)
3. Platform compliance (1-10)
4. Specific optimization opportunities
5. Actionable recommendations

Be specific and actionable.`;

      const analysis = await this.perplexity.answer(analysisPrompt, [], { 
        maxTokens: 1000,
        temperature: 0.5 
      });

      return {
        readabilityScore: this.extractScore(analysis.answer, 'readability'),
        engagementScore: this.extractScore(analysis.answer, 'engagement'),
        platformCompliance: this.extractScore(analysis.answer, 'compliance'),
        optimizationOpportunities: this.extractOpportunities(analysis.answer),
        recommendations: this.extractRecommendations(analysis.answer)
      };
    } catch (error) {
      this.logger.error(`Content analysis failed: ${error.message}`);
      return {
        readabilityScore: 5,
        engagementScore: 5,
        platformCompliance: 5,
        optimizationOpportunities: ['Unable to analyze content'],
        recommendations: ['Manual review recommended']
      };
    }
  }

  private getPlatformOptimizationGuidelines(platform: string): string {
    const guidelines = {
      'FACEBOOK': `
- Use engaging headlines (40-80 characters)
- Include clear call-to-actions
- Use emotional language
- Include relevant hashtags (3-5)
- Ask questions to encourage engagement
- Use line breaks for readability`,
      
      'INSTAGRAM': `
- Write compelling captions (125-150 characters optimal)
- Use relevant hashtags (5-10)
- Include emojis strategically
- Use line breaks for visual appeal
- Include location tags when relevant
- Encourage user-generated content`,
      
      'LINKEDIN': `
- Professional tone
- Industry-specific language
- Include data and insights
- Use professional hashtags (3-5)
- Encourage professional discussion
- Share thought leadership content`,
      
      'TWITTER': `
- Concise and punchy (under 280 characters)
- Use trending hashtags (1-2)
- Include mentions when relevant
- Use action words
- Create urgency or FOMO
- Encourage retweets`,
      
      'YOUTUBE': `
- Compelling video descriptions
- Relevant tags and keywords
- Clear call-to-actions
- Timestamps for long videos
- Encourage subscriptions
- Include links in description`
    };

    return guidelines[platform] || guidelines['FACEBOOK'];
  }

  private async generateVariation(content: string, platform: string, type: string): Promise<{
    content: string;
    description: string;
    predictedEngagement: number;
  }> {
    const prompts = {
      headline: `Rewrite the headline/opening of this ${platform} content for better engagement: "${content}"`,
      hashtags: `Optimize hashtags for this ${platform} content: "${content}"`,
      tone: `Adjust the tone of this ${platform} content for better performance: "${content}"`,
      length: `Optimize the length of this ${platform} content: "${content}"`,
      structure: `Improve the structure and flow of this ${platform} content: "${content}"`
    };

    const result = await this.perplexity.answer(prompts[type], [], { maxTokens: 500 });
    
    return {
      content: this.extractOptimizedContent(result.answer),
      description: `Optimized ${type} for ${platform}`,
      predictedEngagement: this.calculateEngagementScore(result.answer)
    };
  }

  private async simpleOptimization(content: string, platform: string): Promise<string> {
    // Simple optimization without AI
    let optimized = content;
    
    // Add line breaks for better readability
    optimized = optimized.replace(/\. /g, '.\n');
    
    // Ensure proper hashtag formatting
    const hashtags = optimized.match(/#[\w\u0590-\u05ff]+/g) || [];
    if (hashtags.length > 0) {
      optimized = optimized.replace(/#[\w\u0590-\u05ff]+/g, '').trim();
      optimized += '\n\n' + hashtags.join(' ');
    }
    
    return optimized;
  }

  private calculateTrafficSplit(variationCount: number): number[] {
    const split = 100 / variationCount;
    return Array(variationCount).fill(Math.round(split));
  }

  private extractOptimizedContent(text: string): string {
    // Extract the optimized content from AI response
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('optimized') || line.toLowerCase().includes('improved')) {
        return line.replace(/^(optimized|improved)[:\s]*/i, '').trim();
      }
    }
    
    // Fallback: return first substantial line
    const substantialLines = lines.filter(line => line.trim().length > 20);
    return substantialLines[0] || text;
  }

  private analyzeChanges(original: string, optimized: string): Array<{
    type: 'text' | 'hashtag' | 'structure' | 'tone' | 'length';
    description: string;
    impact: 'low' | 'medium' | 'high';
    before: string;
    after: string;
  }> {
    const changes = [];
    
    // Length change
    if (Math.abs(original.length - optimized.length) > 50) {
      changes.push({
        type: 'length',
        description: `Content length ${optimized.length > original.length ? 'increased' : 'decreased'} by ${Math.abs(original.length - optimized.length)} characters`,
        impact: 'medium',
        before: original.substring(0, 100) + '...',
        after: optimized.substring(0, 100) + '...'
      });
    }
    
    // Structure change (line breaks)
    const originalBreaks = (original.match(/\n/g) || []).length;
    const optimizedBreaks = (optimized.match(/\n/g) || []).length;
    if (Math.abs(originalBreaks - optimizedBreaks) > 2) {
      changes.push({
        type: 'structure',
        description: `Content structure improved with better line breaks`,
        impact: 'medium',
        before: original.substring(0, 100) + '...',
        after: optimized.substring(0, 100) + '...'
      });
    }
    
    // Hashtag changes
    const originalHashtags = (original.match(/#[\w\u0590-\u05ff]+/g) || []).length;
    const optimizedHashtags = (optimized.match(/#[\w\u0590-\u05ff]+/g) || []).length;
    if (originalHashtags !== optimizedHashtags) {
      changes.push({
        type: 'hashtag',
        description: `Hashtag count ${optimizedHashtags > originalHashtags ? 'increased' : 'decreased'} from ${originalHashtags} to ${optimizedHashtags}`,
        impact: 'high',
        before: original.substring(0, 100) + '...',
        after: optimized.substring(0, 100) + '...'
      });
    }
    
    return changes;
  }

  private extractSuggestions(text: string): string[] {
    const suggestions = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('suggest') || 
          line.toLowerCase().includes('recommend') ||
          line.toLowerCase().includes('consider')) {
        suggestions.push(line.trim());
      }
    }
    
    return suggestions.length > 0 ? suggestions : ['Review content for optimization opportunities'];
  }

  private calculatePredictedPerformance(original: string, optimized: string, platform: string): number {
    // Simple performance prediction based on content characteristics
    let score = 50; // Base score
    
    // Length optimization
    const platformLimits = {
      'FACEBOOK': 63206,
      'INSTAGRAM': 2200,
      'LINKEDIN': 3000,
      'TWITTER': 280,
      'YOUTUBE': 5000
    };
    
    const limit = platformLimits[platform] || 3000;
    const optimizedLength = optimized.length;
    
    if (optimizedLength <= limit * 0.8) {
      score += 10; // Good length
    } else if (optimizedLength > limit) {
      score -= 15; // Too long
    }
    
    // Hashtag optimization
    const hashtags = (optimized.match(/#[\w\u0590-\u05ff]+/g) || []).length;
    const optimalHashtags = {
      'FACEBOOK': 5,
      'INSTAGRAM': 10,
      'LINKEDIN': 3,
      'TWITTER': 2,
      'YOUTUBE': 5
    };
    
    const optimal = optimalHashtags[platform] || 5;
    if (hashtags === optimal) {
      score += 15;
    } else if (Math.abs(hashtags - optimal) <= 2) {
      score += 10;
    }
    
    // Structure (line breaks)
    const lineBreaks = (optimized.match(/\n/g) || []).length;
    if (lineBreaks > 2) {
      score += 10; // Good structure
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private extractConfidence(text: string): number {
    // Extract confidence level from AI response
    const confidenceMatch = text.match(/confidence[:\s]*(\d+)/i);
    if (confidenceMatch) {
      return parseInt(confidenceMatch[1]);
    }
    
    // Default confidence based on response quality
    return text.length > 200 ? 8 : 6;
  }

  private extractScore(text: string, type: string): number {
    const scoreMatch = new RegExp(`${type}[^\\d]*(\\d+)`, 'i').exec(text);
    return scoreMatch ? parseInt(scoreMatch[1]) : 5;
  }

  private extractOpportunities(text: string): string[] {
    const opportunities = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('opportunity') || 
          line.toLowerCase().includes('improve') ||
          line.toLowerCase().includes('enhance')) {
        opportunities.push(line.trim());
      }
    }
    
    return opportunities.length > 0 ? opportunities : ['Review content for improvement opportunities'];
  }

  private extractRecommendations(text: string): string[] {
    const recommendations = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('recommend') || 
          line.toLowerCase().includes('suggest') ||
          line.toLowerCase().includes('should')) {
        recommendations.push(line.trim());
      }
    }
    
    return recommendations.length > 0 ? recommendations : ['Manual review recommended'];
  }

  private calculateEngagementScore(text: string): number {
    // Simple engagement score calculation
    let score = 50;
    
    // Check for engagement triggers
    if (text.includes('?')) score += 10; // Questions
    if (text.includes('!')) score += 5; // Excitement
    if (text.match(/#[\w\u0590-\u05ff]+/g)) score += 10; // Hashtags
    if (text.includes('@')) score += 5; // Mentions
    
    return Math.max(0, Math.min(100, score));
  }
}
