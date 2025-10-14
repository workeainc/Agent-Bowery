import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../db.service';

export interface PerformanceMetrics {
  impressions: number;
  clicks: number;
  reactions: number;
  comments: number;
  shares: number;
  ctr: number;
}

export interface TemplatePerformanceData {
  templateId: string;
  templateVersion: string;
  platform: string;
  organizationId?: string;
  channel?: string;
  totalPosts: number;
  avgImpressions: number;
  avgClicks: number;
  avgReactions: number;
  avgComments: number;
  avgShares: number;
  avgCtr: number;
  performanceScore: number;
  sampleSize: number;
}

@Injectable()
export class TemplateTuningService {
  private readonly logger = new Logger(TemplateTuningService.name);

  constructor(private readonly dbService: DbService) {}

  /**
   * Calculate performance score based on engagement metrics
   * Higher score = better performance
   */
  calculatePerformanceScore(metrics: PerformanceMetrics): number {
    // Weighted scoring: CTR (40%), engagement rate (30%), reach (20%), virality (10%)
    const ctrScore = Math.min(metrics.ctr * 100, 10); // Max 10 points for CTR
    const engagementRate = (metrics.reactions + metrics.comments + metrics.shares) / Math.max(metrics.impressions, 1) * 100;
    const engagementScore = Math.min(engagementRate * 2, 10); // Max 10 points for engagement
    const reachScore = Math.min(metrics.impressions / 1000, 10); // Max 10 points for reach
    const viralityScore = Math.min(metrics.shares / 10, 10); // Max 10 points for shares

    return ctrScore * 0.4 + engagementScore * 0.3 + reachScore * 0.2 + viralityScore * 0.1;
  }

  /**
   * Record post metrics after publishing
   */
  async recordPostMetrics(data: {
    contentItemId: string;
    platform: string;
    templateVersionId?: string;
    metrics: PerformanceMetrics;
    postedAt: Date;
  }) {
    try {
      await this.dbService.createPostMetrics({
        contentItemId: data.contentItemId,
        platform: data.platform,
        templateVersionId: data.templateVersionId,
        impressions: data.metrics.impressions,
        clicks: data.metrics.clicks,
        reactions: data.metrics.reactions,
        comments: data.metrics.comments,
        shares: data.metrics.shares,
        ctr: data.metrics.ctr,
        postedAt: data.postedAt,
      });

      this.logger.log(`Recorded metrics for content ${data.contentItemId} on ${data.platform}`);
    } catch (error) {
      this.logger.error(`Failed to record post metrics:`, error);
    }
  }

  /**
   * Calculate and update template performance scores
   */
  async updateTemplatePerformance(templateId: string, platform: string, organizationId?: string, channel?: string) {
    try {
      // Get all metrics for this template/platform/org/channel combination
      const client = await this.dbService.pool.connect();
      let sql = `
        SELECT 
          template_version_id,
          COUNT(*) as total_posts,
          AVG(impressions) as avg_impressions,
          AVG(clicks) as avg_clicks,
          AVG(reactions) as avg_reactions,
          AVG(comments) as avg_comments,
          AVG(shares) as avg_shares,
          AVG(ctr) as avg_ctr
        FROM post_metrics pm
        JOIN content_versions cv ON pm.content_item_id = cv.content_item_id
        WHERE cv.metadata_json->>'template_id' = $1 AND pm.platform = $2
      `;
      const params = [templateId, platform];
      let paramIndex = 3;

      if (organizationId) {
        sql += ` AND cv.metadata_json->>'organization_id' = $${paramIndex}`;
        params.push(organizationId);
        paramIndex++;
      }

      if (channel) {
        sql += ` AND cv.metadata_json->>'channel' = $${paramIndex}`;
        params.push(channel);
        paramIndex++;
      }

      sql += ` GROUP BY template_version_id`;

      const { rows } = await client.query(sql, params);
      client.release();

      // Update performance for each template version
      for (const row of rows) {
        if (!row.template_version_id) continue;

        const performanceScore = this.calculatePerformanceScore({
          impressions: parseFloat(row.avg_impressions) || 0,
          clicks: parseFloat(row.avg_clicks) || 0,
          reactions: parseFloat(row.avg_reactions) || 0,
          comments: parseFloat(row.avg_comments) || 0,
          shares: parseFloat(row.avg_shares) || 0,
          ctr: parseFloat(row.avg_ctr) || 0,
        });

        await this.dbService.upsertTemplatePerformance({
          templateId,
          templateVersion: row.template_version_id,
          platform,
          organizationId,
          channel,
          totalPosts: parseInt(row.total_posts),
          avgImpressions: parseFloat(row.avg_impressions) || 0,
          avgClicks: parseFloat(row.avg_clicks) || 0,
          avgReactions: parseFloat(row.avg_reactions) || 0,
          avgComments: parseFloat(row.avg_comments) || 0,
          avgShares: parseFloat(row.avg_shares) || 0,
          avgCtr: parseFloat(row.avg_ctr) || 0,
          performanceScore,
          sampleSize: parseInt(row.total_posts),
        });
      }

      this.logger.log(`Updated performance for template ${templateId} on ${platform}`);
    } catch (error) {
      this.logger.error(`Failed to update template performance:`, error);
    }
  }

  /**
   * Get top performing templates for a platform/org/channel
   */
  async getTopTemplates(platform: string, organizationId?: string, channel?: string, limit = 10) {
    try {
      const performance = await this.dbService.getTemplatePerformance('', platform, organizationId, channel);
      return performance
        .filter(p => p.sample_size >= 5) // Minimum sample size
        .sort((a, b) => b.performance_score - a.performance_score)
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to get top templates:`, error);
      return [];
    }
  }

  /**
   * Get template recommendations based on performance
   */
  async getTemplateRecommendations(platform: string, organizationId?: string, channel?: string) {
    try {
      const topTemplates = await this.getTopTemplates(platform, organizationId, channel, 5);
      const allTemplates = await this.dbService.getTemplatePerformance('', platform, organizationId, channel);
      
      const underperformers = allTemplates
        .filter(t => t.sample_size >= 3 && t.performance_score < 2.0)
        .sort((a, b) => a.performance_score - b.performance_score)
        .slice(0, 3);

      return {
        topPerformers: topTemplates,
        underperformers,
        recommendations: {
          promote: topTemplates.slice(0, 2).map(t => ({
            templateId: t.template_id,
            templateVersion: t.template_version,
            reason: 'High performance score',
            score: t.performance_score,
          })),
          review: underperformers.map(t => ({
            templateId: t.template_id,
            templateVersion: t.template_version,
            reason: 'Low performance score',
            score: t.performance_score,
          })),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get template recommendations:`, error);
      return { topPerformers: [], underperformers: [], recommendations: { promote: [], review: [] } };
    }
  }
}





