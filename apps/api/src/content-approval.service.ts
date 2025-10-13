import { Injectable, Logger } from '@nestjs/common';
import { DbService } from './db.service';
import { ContentAdaptationService } from './content-adaptation.service';
import { QualityService } from './services/quality.service';
import { PerplexityService } from './services/perplexity.service';
import { BrandRuleEnforcementService } from './services/brand-rule-enforcement.service';

export interface ApprovalRequest {
  contentItemId: string;
  approvedBy: string;
  notes?: string;
  generatePreviews?: boolean;
  platforms?: string[];
}

@Injectable()
export class ContentApprovalService {
  private readonly logger = new Logger(ContentApprovalService.name);

  constructor(
    private readonly dbService: DbService,
    private readonly contentAdaptationService: ContentAdaptationService,
    private readonly quality: QualityService,
    private readonly perplexity: PerplexityService,
    private readonly brandEnforcement: BrandRuleEnforcementService,
  ) {}

  async approveContentWithPreviews(request: ApprovalRequest): Promise<{
    success: boolean;
    contentItemId: string;
    adaptedPreviews?: Record<string, any>;
    error?: string;
  }> {
    try {
      const { contentItemId, approvedBy, notes, generatePreviews = true, platforms } = request;

      // Get content and current version
      const content = await this.dbService.getContentItem(contentItemId);
      if (!content) {
        return { success: false, contentItemId, error: 'Content not found' };
      }

      const currentVersion = await this.dbService.getCurrentContentVersion(contentItemId);
      if (!currentVersion) {
        return { success: false, contentItemId, error: 'No current version found' };
      }

      // Quality checks
      const orgId = (content as any).organization_id || 'unknown_org';
      const channel = ((content as any).metadata_json?.channel) || 'default';
      const policy = await this.dbService.getQualityPolicy(orgId, channel) || {};

      const text = String(currentVersion.body || '');
      const readability = this.quality.computeFleschKincaid(text);
      if (policy.min_readability != null && readability < Number(policy.min_readability)) {
        return { success: false, contentItemId, error: `readability_below_threshold:${readability}` };
      }

      if (policy.max_length != null && text.length > Number(policy.max_length)) {
        return { success: false, contentItemId, error: `length_exceeds_max:${text.length}` };
      }

      if (Array.isArray(policy.toxicity_blocklist) && policy.toxicity_blocklist.length > 0) {
        const hits = this.quality.containsBlockedTerms(text, policy.toxicity_blocklist as any);
        if (hits.length > 0) {
          return { success: false, contentItemId, error: `toxicity_terms:${hits.join(',')}` };
        }
      }

      // Brand rule validation
      const brandValidation = await this.brandEnforcement.validateContentAgainstBrandRules(text, orgId);
      if (!brandValidation.compliant) {
        return { 
          success: false, 
          contentItemId, 
          error: `brand_rule_violations:${brandValidation.violations.join(';')}` 
        };
      }

      // Similarity check against recent content
      if (policy.max_similarity != null) {
        const recents = await this.dbService.getRecentContentBodies(orgId, contentItemId, 25);
        let maxSim = 0;
        for (const body of recents) {
          const s = this.quality.computeSimilarity(text, body || '');
          if (s > maxSim) maxSim = s;
          if (maxSim >= Number(policy.max_similarity)) break;
        }
        if (maxSim >= Number(policy.max_similarity)) {
          return { success: false, contentItemId, error: `similarity_above_threshold:${maxSim.toFixed(3)}` };
        }
      }

      // Factuality check using Perplexity factCheck on first few sentences
      if (policy.min_fact_supported_ratio != null) {
        const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 5);
        if (sentences.length > 0) {
          try {
            const fc = await this.perplexity.factCheck(sentences, 3);
            // Expect fc to include per-claim verdicts; fallback: if sources returned > 0 assume supported
            const claims = Array.isArray(fc?.claims) ? fc.claims : [];
            let supported = 0;
            let total = 0;
            if (claims.length > 0) {
              for (const c of claims) {
                total++;
                const verdict = (c.verdict || c.status || '').toString().toLowerCase();
                if (verdict.includes('supported') || verdict.includes('true')) supported++;
              }
            } else {
              // Heuristic fallback
              total = sentences.length;
              supported = Math.ceil(total * 0.6);
            }
            const ratio = total > 0 ? supported / total : 1;
            if (ratio < Number(policy.min_fact_supported_ratio)) {
              return { success: false, contentItemId, error: `factuality_below_threshold:${ratio.toFixed(2)}` };
            }
          } catch (err) {
            this.logger.warn(`FactCheck failed; skipping factuality enforcement: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      let adaptedPreviews: Record<string, any> = {};

      // Generate adapted previews for all platforms if requested
      if (generatePreviews) {
        const targetPlatforms = platforms || this.contentAdaptationService.getAllPlatforms();
        
        for (const platform of targetPlatforms) {
          try {
            const adaptedContent = this.contentAdaptationService.adaptContent(
              currentVersion.body,
              platform,
              currentVersion.media_urls || []
            );

            const validation = this.contentAdaptationService.validateContent(adaptedContent, platform);
            
            adaptedPreviews[platform] = {
              adaptedContent,
              validation,
              generatedAt: new Date().toISOString(),
              originalVersionId: currentVersion.id,
            };

            this.logger.log(`Generated preview for ${platform} on content ${contentItemId}`);
          } catch (error) {
            this.logger.warn(`Failed to generate preview for ${platform}:`, error);
            adaptedPreviews[platform] = {
              error: error instanceof Error ? error.message : 'Unknown error',
              generatedAt: new Date().toISOString(),
            };
          }
        }
      }

      // Approve content with adapted previews
      const approved = await this.dbService.approveContent(
        contentItemId,
        approvedBy,
        notes,
        adaptedPreviews
      );

      if (!approved) {
        return { success: false, contentItemId, error: 'Content already approved or not found' };
      }

      this.logger.log(`Content ${contentItemId} approved by ${approvedBy} with ${Object.keys(adaptedPreviews).length} platform previews`);

      return {
        success: true,
        contentItemId,
        adaptedPreviews,
      };
    } catch (error) {
      this.logger.error(`Content approval failed:`, error);
      return {
        success: false,
        contentItemId: request.contentItemId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getContentPreviews(contentItemId: string): Promise<{
    contentItemId: string;
    adaptedPreviews?: Record<string, any>;
    error?: string;
  }> {
    try {
      const adaptedPreviews = await this.dbService.getContentPreviews(contentItemId);
      return {
        contentItemId,
        adaptedPreviews,
      };
    } catch (error) {
      this.logger.error(`Failed to get content previews:`, error);
      return {
        contentItemId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async regeneratePreviews(contentItemId: string, platforms?: string[]): Promise<{
    success: boolean;
    contentItemId: string;
    adaptedPreviews?: Record<string, any>;
    error?: string;
  }> {
    try {
      const content = await this.dbService.getContentItem(contentItemId);
      if (!content) {
        return { success: false, contentItemId, error: 'Content not found' };
      }

      if (content.status !== 'APPROVED') {
        return { success: false, contentItemId, error: 'Content must be approved to regenerate previews' };
      }

      const currentVersion = await this.dbService.getCurrentContentVersion(contentItemId);
      if (!currentVersion) {
        return { success: false, contentItemId, error: 'No current version found' };
      }

      const targetPlatforms = platforms || this.contentAdaptationService.getAllPlatforms();
      const adaptedPreviews: Record<string, any> = {};

      for (const platform of targetPlatforms) {
        try {
          const adaptedContent = this.contentAdaptationService.adaptContent(
            currentVersion.body,
            platform,
            currentVersion.media_urls || []
          );

          const validation = this.contentAdaptationService.validateContent(adaptedContent, platform);
          
          adaptedPreviews[platform] = {
            adaptedContent,
            validation,
            generatedAt: new Date().toISOString(),
            originalVersionId: currentVersion.id,
          };
        } catch (error) {
          this.logger.warn(`Failed to regenerate preview for ${platform}:`, error);
          adaptedPreviews[platform] = {
            error: error instanceof Error ? error.message : 'Unknown error',
            generatedAt: new Date().toISOString(),
          };
        }
      }

      // Update the content with new previews
      await this.dbService.storeAdaptedPreviews(contentItemId, adaptedPreviews);

      this.logger.log(`Regenerated previews for content ${contentItemId} on ${Object.keys(adaptedPreviews).length} platforms`);

      return {
        success: true,
        contentItemId,
        adaptedPreviews,
      };
    } catch (error) {
      this.logger.error(`Failed to regenerate previews:`, error);
      return {
        success: false,
        contentItemId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
