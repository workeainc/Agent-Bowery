import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../db.service';

export interface BrandRuleValidationResult {
  compliant: boolean;
  violations: string[];
  suggestions: string[];
  score: number;
}

@Injectable()
export class BrandRuleEnforcementService {
  private readonly logger = new Logger(BrandRuleEnforcementService.name);

  constructor(private readonly db: DbService) {}

  async validateContentAgainstBrandRules(content: string, organizationId: string): Promise<BrandRuleValidationResult> {
    const brandRules = await this.db.getBrandRules(organizationId);
    if (!brandRules) {
      return { compliant: true, violations: [], suggestions: [], score: 100 };
    }

    const violations: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Check restricted topics
    if (brandRules.restricted_topics && Array.isArray(brandRules.restricted_topics)) {
      const restrictedHits = brandRules.restricted_topics.filter((topic: any) => 
        content.toLowerCase().includes(topic.toLowerCase())
      );
      if (restrictedHits.length > 0) {
        violations.push(`Contains restricted topics: ${restrictedHits.join(', ')}`);
        score -= 30; // Major violation
      }
    }

    // Check tone compliance
    if (brandRules.tone) {
      const toneCompliant = this.checkToneCompliance(content, brandRules.tone);
      if (!toneCompliant) {
        violations.push(`Content doesn't match required tone: ${brandRules.tone}`);
        suggestions.push(`Adjust content to match ${brandRules.tone} tone`);
        score -= 20; // Moderate violation
      }
    }

    // Check dos/don'ts compliance
    if (brandRules.dos && Array.isArray(brandRules.dos)) {
      const dosCompliance = this.checkDosCompliance(content, brandRules.dos);
      if (dosCompliance.missing.length > 0) {
        suggestions.push(`Consider including: ${dosCompliance.missing.join(', ')}`);
        score -= 10; // Minor suggestion
      }
    }

    if (brandRules.donts && Array.isArray(brandRules.donts)) {
      const dontsViolations = brandRules.donts.filter((dont: any) => 
        content.toLowerCase().includes(dont.toLowerCase())
      );
      if (dontsViolations.length > 0) {
        violations.push(`Contains prohibited elements: ${dontsViolations.join(', ')}`);
        score -= 25; // Moderate violation
      }
    }

    // Check CTA compliance
    if (brandRules.approved_ctas && Array.isArray(brandRules.approved_ctas)) {
      const hasApprovedCTA = brandRules.approved_ctas.some((cta: any) => 
        content.toLowerCase().includes(cta.toLowerCase())
      );
      if (!hasApprovedCTA) {
        suggestions.push(`Consider adding one of these CTAs: ${brandRules.approved_ctas.join(', ')}`);
        score -= 5; // Minor suggestion
      }
    }

    // Check hashtag compliance
    if (brandRules.hashtags && Array.isArray(brandRules.hashtags)) {
      const contentHashtags = this.extractHashtags(content);
      const approvedHashtags = brandRules.hashtags.map((h: any) => h.toLowerCase());
      const unapprovedHashtags = contentHashtags.filter(h => 
        !approvedHashtags.includes(h.toLowerCase())
      );
      if (unapprovedHashtags.length > 0) {
        suggestions.push(`Consider using approved hashtags instead of: ${unapprovedHashtags.join(', ')}`);
        score -= 5; // Minor suggestion
      }
    }

    // Check handle compliance
    if (brandRules.handles && typeof brandRules.handles === 'object') {
      const handleViolations = this.checkHandleCompliance(content, brandRules.handles);
      if (handleViolations.length > 0) {
        violations.push(`Contains unapproved handles: ${handleViolations.join(', ')}`);
        score -= 15; // Moderate violation
      }
    }

    return {
      compliant: violations.length === 0,
      violations,
      suggestions,
      score: Math.max(0, score)
    };
  }

  private checkToneCompliance(content: string, tone: any): boolean {
    if (typeof tone === 'string') {
      // Basic keyword-based tone checking
      const toneKeywords: Record<string, string[]> = {
        'professional': ['professional', 'expert', 'industry', 'business', 'corporate'],
        'casual': ['casual', 'friendly', 'relaxed', 'easy', 'simple'],
        'authoritative': ['authority', 'expert', 'proven', 'research', 'data'],
        'friendly': ['friendly', 'warm', 'welcoming', 'helpful', 'supportive'],
        'urgent': ['urgent', 'immediate', 'now', 'quickly', 'asap'],
        'educational': ['learn', 'understand', 'knowledge', 'education', 'teach']
      };

      const keywords = toneKeywords[tone.toLowerCase()] || [];
      if (keywords.length === 0) return true; // Unknown tone, assume compliant

      const contentLower = content.toLowerCase();
      const keywordMatches = keywords.filter((keyword: string) => contentLower.includes(keyword));
      
      // Require at least one keyword match for tone compliance
      return keywordMatches.length > 0;
    }

    if (typeof tone === 'object' && tone.keywords) {
      const contentLower = content.toLowerCase();
      const keywordMatches = tone.keywords.filter((keyword: string) => 
        contentLower.includes(keyword.toLowerCase())
      );
      return keywordMatches.length >= (tone.minMatches || 1);
    }

    return true; // Unknown tone format, assume compliant
  }

  private checkDosCompliance(content: string, dos: any[]): { missing: string[] } {
    const contentLower = content.toLowerCase();
    const missing = dos.filter((doItem: any) => {
      if (typeof doItem === 'string') {
        return !contentLower.includes(doItem.toLowerCase());
      }
      if (typeof doItem === 'object' && doItem.keyword) {
        return !contentLower.includes(doItem.keyword.toLowerCase());
      }
      return false;
    }).map((doItem: any) => typeof doItem === 'string' ? doItem : doItem.keyword);

    return { missing };
  }

  private checkHandleCompliance(content: string, handles: Record<string, string>): string[] {
    const violations: string[] = [];
    const contentLower = content.toLowerCase();
    
    // Extract @mentions from content
    const mentions = content.match(/@[\w]+/g) || [];
    
    for (const mention of mentions) {
      const handle = mention.toLowerCase();
      const platform = this.detectPlatformFromHandle(handle);
      
      if (platform && handles[platform] && handle !== handles[platform].toLowerCase()) {
        violations.push(`${mention} (expected: @${handles[platform]})`);
      }
    }
    
    return violations;
  }

  private detectPlatformFromHandle(handle: string): string | null {
    // Simple platform detection based on handle patterns
    if (handle.includes('facebook') || handle.includes('fb')) return 'facebook';
    if (handle.includes('instagram') || handle.includes('ig')) return 'instagram';
    if (handle.includes('linkedin') || handle.includes('li')) return 'linkedin';
    if (handle.includes('twitter') || handle.includes('tw')) return 'twitter';
    if (handle.includes('youtube') || handle.includes('yt')) return 'youtube';
    return null;
  }

  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    return content.match(hashtagRegex) || [];
  }

  async generateBrandCompliantPrompt(basePrompt: string, organizationId: string): Promise<string> {
    const brandRules = await this.db.getBrandRules(organizationId);
    if (!brandRules) return basePrompt;

    let enhancedPrompt = basePrompt;

    // Add tone guidance
    if (brandRules.tone) {
      if (typeof brandRules.tone === 'string') {
        enhancedPrompt += ` Write in a ${brandRules.tone} tone.`;
      } else if (brandRules.tone.description) {
        enhancedPrompt += ` ${brandRules.tone.description}`;
      }
    }

    // Add dos guidance
    if (brandRules.dos && Array.isArray(brandRules.dos)) {
      const dosList = brandRules.dos.map((doItem: any) => 
        typeof doItem === 'string' ? doItem : doItem.description || doItem.keyword
      ).join(', ');
      enhancedPrompt += ` Make sure to include: ${dosList}.`;
    }

    // Add don'ts guidance
    if (brandRules.donts && Array.isArray(brandRules.donts)) {
      const dontsList = brandRules.donts.map((dontItem: any) => 
        typeof dontItem === 'string' ? dontItem : dontItem.description || dontItem.keyword
      ).join(', ');
      enhancedPrompt += ` Avoid: ${dontsList}.`;
    }

    // Add CTA guidance
    if (brandRules.approved_ctas && Array.isArray(brandRules.approved_ctas)) {
      const ctaList = brandRules.approved_ctas.join(', ');
      enhancedPrompt += ` Use one of these CTAs: ${ctaList}.`;
    }

    // Add hashtag guidance
    if (brandRules.hashtags && Array.isArray(brandRules.hashtags)) {
      const hashtagList = brandRules.hashtags.map((h: any) => 
        typeof h === 'string' ? h : h.tag || h.keyword
      ).join(' ');
      enhancedPrompt += ` Include these hashtags: ${hashtagList}.`;
    }

    // Add handle guidance
    if (brandRules.handles && typeof brandRules.handles === 'object') {
      const handleList = Object.entries(brandRules.handles)
        .map(([platform, handle]) => `${platform}: @${handle}`)
        .join(', ');
      enhancedPrompt += ` Use these handles: ${handleList}.`;
    }

    return enhancedPrompt;
  }
}
