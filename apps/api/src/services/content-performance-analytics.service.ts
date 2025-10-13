import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../db.service';

export interface PerformanceMetrics {
  impressions: number;
  clicks: number;
  reactions: number;
  comments: number;
  shares: number;
  ctr: number;
  engagementRate: number;
}

export interface PlatformPerformance {
  platform: string;
  score: number;
  metrics: PerformanceMetrics;
  insights: string[];
  trends: Array<{
    date: string;
    score: number;
    engagement: number;
  }>;
}

export interface ContentPerformanceAnalysis {
  contentItemId: string;
  overallPerformance: number;
  platformPerformance: Record<string, PlatformPerformance>;
  optimizationOpportunities: string[];
  recommendations: string[];
  trends: Array<{
    date: string;
    overallScore: number;
    platformScores: Record<string, number>;
  }>;
  generatedAt: string;
}

export interface OptimizationEffectiveness {
  effectiveness: number;
  improvements: string[];
  metrics: {
    engagementImprovement: number;
    reachImprovement: number;
    clickImprovement: number;
    shareImprovement: number;
  };
  beforeAfter: {
    before: PerformanceMetrics;
    after: PerformanceMetrics;
  };
}

@Injectable()
export class ContentPerformanceAnalyticsService {
  private readonly logger = new Logger(ContentPerformanceAnalyticsService.name);

  constructor(private readonly db: DbService) {}

  async analyzeContentPerformance(contentItemId: string, days: number = 30): Promise<ContentPerformanceAnalysis> {
    try {
      // Get content performance data
      const performanceData = await this.getContentPerformanceData(contentItemId, days);
      
      // Calculate overall performance score
      const overallPerformance = this.calculateOverallPerformanceScore(performanceData);
      
      // Analyze platform-specific performance
      const platformPerformance = await this.analyzePlatformPerformance(performanceData);
      
      // Identify optimization opportunities
      const optimizationOpportunities = this.identifyOptimizationOpportunities(performanceData);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(performanceData, platformPerformance);
      
      // Analyze trends
      const trends = this.analyzeTrends(performanceData, days);
      
      return {
        contentItemId,
        overallPerformance,
        platformPerformance,
        optimizationOpportunities,
        recommendations,
        trends,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Content performance analysis failed: ${error.message}`);
      throw new Error(`Content performance analysis failed: ${error.message}`);
    }
  }

  async trackOptimizationEffectiveness(
    contentItemId: string,
    optimizationDate: string,
    beforeMetrics: PerformanceMetrics,
    afterMetrics: PerformanceMetrics
  ): Promise<OptimizationEffectiveness> {
    try {
      // Calculate improvements
      const engagementImprovement = this.calculateImprovement(beforeMetrics.engagementRate, afterMetrics.engagementRate);
      const reachImprovement = this.calculateImprovement(beforeMetrics.impressions, afterMetrics.impressions);
      const clickImprovement = this.calculateImprovement(beforeMetrics.clicks, afterMetrics.clicks);
      const shareImprovement = this.calculateImprovement(beforeMetrics.shares, afterMetrics.shares);
      
      // Calculate overall effectiveness
      const effectiveness = this.calculateOverallEffectiveness({
        engagementImprovement,
        reachImprovement,
        clickImprovement,
        shareImprovement
      });
      
      // Generate improvement insights
      const improvements = this.generateImprovementInsights({
        engagementImprovement,
        reachImprovement,
        clickImprovement,
        shareImprovement
      });
      
      // Store optimization tracking data
      await this.storeOptimizationTracking(contentItemId, optimizationDate, {
        before: beforeMetrics,
        after: afterMetrics,
        effectiveness,
        improvements: {
          engagementImprovement,
          reachImprovement,
          clickImprovement,
          shareImprovement
        }
      });
      
      return {
        effectiveness,
        improvements,
        metrics: {
          engagementImprovement,
          reachImprovement,
          clickImprovement,
          shareImprovement
        },
        beforeAfter: {
          before: beforeMetrics,
          after: afterMetrics
        }
      };
    } catch (error) {
      this.logger.error(`Optimization effectiveness tracking failed: ${error.message}`);
      throw new Error(`Optimization effectiveness tracking failed: ${error.message}`);
    }
  }

  async getContentPerformanceTrends(contentItemId: string, days: number = 30): Promise<{
    trends: Array<{
      date: string;
      overallScore: number;
      platformScores: Record<string, number>;
      metrics: PerformanceMetrics;
    }>;
    insights: string[];
    predictions: Array<{
      date: string;
      predictedScore: number;
      confidence: number;
    }>;
  }> {
    try {
      const trends = await this.getPerformanceTrends(contentItemId, days);
      const insights = this.generateTrendInsights(trends);
      const predictions = this.generatePerformancePredictions(trends);
      
      return {
        trends,
        insights,
        predictions
      };
    } catch (error) {
      this.logger.error(`Performance trends analysis failed: ${error.message}`);
      throw new Error(`Performance trends analysis failed: ${error.message}`);
    }
  }

  async compareContentPerformance(contentItemIds: string[]): Promise<{
    comparison: Array<{
      contentItemId: string;
      title: string;
      overallScore: number;
      platformScores: Record<string, number>;
      strengths: string[];
      weaknesses: string[];
      recommendations: string[];
    }>;
    winner: string;
    insights: string[];
  }> {
    try {
      const comparisons = await Promise.all(
        contentItemIds.map(async (id) => {
          const analysis = await this.analyzeContentPerformance(id);
          const content = await this.db.getContentItem(id);
          
          return {
            contentItemId: id,
            title: content?.title || 'Unknown',
            overallScore: analysis.overallPerformance,
            platformScores: Object.fromEntries(
              Object.entries(analysis.platformPerformance).map(([platform, perf]) => [platform, perf.score])
            ),
            strengths: this.identifyStrengths(analysis),
            weaknesses: this.identifyWeaknesses(analysis),
            recommendations: analysis.recommendations
          };
        })
      );
      
      // Find winner
      const winner = comparisons.reduce((best, current) => 
        current.overallScore > best.overallScore ? current : best
      );
      
      // Generate insights
      const insights = this.generateComparisonInsights(comparisons);
      
      return {
        comparison: comparisons,
        winner: winner.contentItemId,
        insights
      };
    } catch (error) {
      this.logger.error(`Content comparison failed: ${error.message}`);
      throw new Error(`Content comparison failed: ${error.message}`);
    }
  }

  private async getContentPerformanceData(contentItemId: string, days: number): Promise<any[]> {
    // This would typically query a performance metrics table
    // For now, return mock data structure
    return [
      {
        date: new Date().toISOString(),
        platform: 'FACEBOOK',
        impressions: 1000,
        clicks: 50,
        reactions: 25,
        comments: 10,
        shares: 5,
        ctr: 5.0,
        engagementRate: 4.0
      },
      {
        date: new Date().toISOString(),
        platform: 'INSTAGRAM',
        impressions: 800,
        clicks: 40,
        reactions: 30,
        comments: 15,
        shares: 8,
        ctr: 5.0,
        engagementRate: 6.6
      }
    ];
  }

  private calculateOverallPerformanceScore(performanceData: any[]): number {
    if (performanceData.length === 0) return 0;
    
    const totalScore = performanceData.reduce((sum, data) => {
      const platformScore = this.calculatePlatformScore(data);
      return sum + platformScore;
    }, 0);
    
    return Math.round(totalScore / performanceData.length);
  }

  private calculatePlatformScore(data: any): number {
    // Weighted scoring based on different metrics
    const weights = {
      impressions: 0.2,
      clicks: 0.3,
      reactions: 0.2,
      comments: 0.15,
      shares: 0.15
    };
    
    // Normalize metrics (simplified)
    const normalizedImpressions = Math.min(data.impressions / 1000, 1) * 100;
    const normalizedClicks = Math.min(data.clicks / 100, 1) * 100;
    const normalizedReactions = Math.min(data.reactions / 50, 1) * 100;
    const normalizedComments = Math.min(data.comments / 20, 1) * 100;
    const normalizedShares = Math.min(data.shares / 10, 1) * 100;
    
    return Math.round(
      normalizedImpressions * weights.impressions +
      normalizedClicks * weights.clicks +
      normalizedReactions * weights.reactions +
      normalizedComments * weights.comments +
      normalizedShares * weights.shares
    );
  }

  private async analyzePlatformPerformance(performanceData: any[]): Promise<Record<string, PlatformPerformance>> {
    const platformPerformance: Record<string, PlatformPerformance> = {};
    
    for (const data of performanceData) {
      const platform = data.platform;
      const score = this.calculatePlatformScore(data);
      const insights = this.generatePlatformInsights(data);
      const trends = await this.getPlatformTrends(platform, 7);
      
      platformPerformance[platform] = {
        platform,
        score,
        metrics: {
          impressions: data.impressions,
          clicks: data.clicks,
          reactions: data.reactions,
          comments: data.comments,
          shares: data.shares,
          ctr: data.ctr,
          engagementRate: data.engagementRate
        },
        insights,
        trends
      };
    }
    
    return platformPerformance;
  }

  private identifyOptimizationOpportunities(performanceData: any[]): string[] {
    const opportunities = [];
    
    for (const data of performanceData) {
      if (data.ctr < 3) {
        opportunities.push(`Low CTR (${data.ctr}%) on ${data.platform} - consider improving headline or call-to-action`);
      }
      
      if (data.engagementRate < 2) {
        opportunities.push(`Low engagement rate (${data.engagementRate}%) on ${data.platform} - consider more interactive content`);
      }
      
      if (data.comments < 5) {
        opportunities.push(`Few comments on ${data.platform} - consider asking questions or encouraging discussion`);
      }
      
      if (data.shares < 3) {
        opportunities.push(`Low share rate on ${data.platform} - consider more shareable content`);
      }
    }
    
    return opportunities.length > 0 ? opportunities : ['Content performing well across all platforms'];
  }

  private generateRecommendations(performanceData: any[], platformPerformance: Record<string, PlatformPerformance>): string[] {
    const recommendations = [];
    
    // Find best performing platform
    const bestPlatform = Object.entries(platformPerformance).reduce((best, [platform, perf]) => 
      perf.score > best.score ? { platform, score: perf.score } : best, 
      { platform: '', score: 0 }
    );
    
    if (bestPlatform.platform) {
      recommendations.push(`Focus more content on ${bestPlatform.platform} - highest performing platform`);
    }
    
    // Generate platform-specific recommendations
    for (const [platform, perf] of Object.entries(platformPerformance)) {
      if (perf.metrics.ctr < 3) {
        recommendations.push(`Improve ${platform} content headlines and CTAs`);
      }
      
      if (perf.metrics.engagementRate < 3) {
        recommendations.push(`Increase engagement on ${platform} with interactive content`);
      }
      
      if (perf.metrics.shares < 5) {
        recommendations.push(`Create more shareable content for ${platform}`);
      }
    }
    
    return recommendations.length > 0 ? recommendations : ['Content is performing well - maintain current strategy'];
  }

  private analyzeTrends(performanceData: any[], days: number): Array<{
    date: string;
    overallScore: number;
    platformScores: Record<string, number>;
  }> {
    // Mock trend analysis - in real implementation, this would analyze historical data
    const trends = [];
    const today = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      trends.push({
        date: date.toISOString().split('T')[0],
        overallScore: 60 + Math.random() * 20, // Mock score
        platformScores: {
          'FACEBOOK': 55 + Math.random() * 20,
          'INSTAGRAM': 65 + Math.random() * 20,
          'LINKEDIN': 50 + Math.random() * 20
        }
      });
    }
    
    return trends;
  }

  private calculateImprovement(before: number, after: number): number {
    if (before === 0) return after > 0 ? 100 : 0;
    return Math.round(((after - before) / before) * 100);
  }

  private calculateOverallEffectiveness(improvements: any): number {
    const weights = {
      engagementImprovement: 0.4,
      reachImprovement: 0.3,
      clickImprovement: 0.2,
      shareImprovement: 0.1
    };
    
    return Math.round(
      improvements.engagementImprovement * weights.engagementImprovement +
      improvements.reachImprovement * weights.reachImprovement +
      improvements.clickImprovement * weights.clickImprovement +
      improvements.shareImprovement * weights.shareImprovement
    );
  }

  private generateImprovementInsights(improvements: any): string[] {
    const insights = [];
    
    if (improvements.engagementImprovement > 20) {
      insights.push(`Excellent engagement improvement: +${improvements.engagementImprovement}%`);
    } else if (improvements.engagementImprovement > 0) {
      insights.push(`Good engagement improvement: +${improvements.engagementImprovement}%`);
    } else {
      insights.push(`Engagement decreased: ${improvements.engagementImprovement}%`);
    }
    
    if (improvements.reachImprovement > 15) {
      insights.push(`Strong reach improvement: +${improvements.reachImprovement}%`);
    }
    
    if (improvements.clickImprovement > 10) {
      insights.push(`Good click improvement: +${improvements.clickImprovement}%`);
    }
    
    return insights;
  }

  private async storeOptimizationTracking(contentItemId: string, optimizationDate: string, data: any): Promise<void> {
    // Store optimization tracking data in database
    // This would typically insert into an optimization_tracking table
    this.logger.log(`Stored optimization tracking for content ${contentItemId}`);
  }

  private generatePlatformInsights(data: any): string[] {
    const insights = [];
    
    if (data.ctr > 5) {
      insights.push(`Strong CTR performance: ${data.ctr}%`);
    }
    
    if (data.engagementRate > 5) {
      insights.push(`High engagement rate: ${data.engagementRate}%`);
    }
    
    if (data.shares > 10) {
      insights.push(`Good shareability: ${data.shares} shares`);
    }
    
    return insights.length > 0 ? insights : ['Standard performance metrics'];
  }

  private async getPlatformTrends(platform: string, days: number): Promise<Array<{
    date: string;
    score: number;
    engagement: number;
  }>> {
    // Mock trend data - in real implementation, this would query historical data
    const trends = [];
    const today = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      trends.push({
        date: date.toISOString().split('T')[0],
        score: 50 + Math.random() * 30,
        engagement: 2 + Math.random() * 5
      });
    }
    
    return trends;
  }

  private generateTrendInsights(trends: any[]): string[] {
    const insights = [];
    
    if (trends.length < 2) return ['Insufficient data for trend analysis'];
    
    const latest = trends[trends.length - 1];
    const previous = trends[trends.length - 2];
    
    if (latest.overallScore > previous.overallScore) {
      insights.push('Performance trending upward');
    } else if (latest.overallScore < previous.overallScore) {
      insights.push('Performance trending downward');
    } else {
      insights.push('Performance stable');
    }
    
    return insights;
  }

  private generatePerformancePredictions(trends: any[]): Array<{
    date: string;
    predictedScore: number;
    confidence: number;
  }> {
    // Simple linear prediction based on recent trends
    const predictions = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      predictions.push({
        date: date.toISOString().split('T')[0],
        predictedScore: 60 + Math.random() * 20, // Mock prediction
        confidence: 70 + Math.random() * 20 // Mock confidence
      });
    }
    
    return predictions;
  }

  private identifyStrengths(analysis: ContentPerformanceAnalysis): string[] {
    const strengths = [];
    
    if (analysis.overallPerformance > 70) {
      strengths.push('High overall performance');
    }
    
    const platforms = Object.values(analysis.platformPerformance);
    const highPerformingPlatforms = platforms.filter(p => p.score > 70);
    
    if (highPerformingPlatforms.length > 0) {
      strengths.push(`Strong performance on ${highPerformingPlatforms.map(p => p.platform).join(', ')}`);
    }
    
    return strengths.length > 0 ? strengths : ['Consistent performance'];
  }

  private identifyWeaknesses(analysis: ContentPerformanceAnalysis): string[] {
    const weaknesses = [];
    
    if (analysis.overallPerformance < 50) {
      weaknesses.push('Low overall performance');
    }
    
    const platforms = Object.values(analysis.platformPerformance);
    const lowPerformingPlatforms = platforms.filter(p => p.score < 50);
    
    if (lowPerformingPlatforms.length > 0) {
      weaknesses.push(`Poor performance on ${lowPerformingPlatforms.map(p => p.platform).join(', ')}`);
    }
    
    return weaknesses.length > 0 ? weaknesses : ['No significant weaknesses identified'];
  }

  private generateComparisonInsights(comparisons: any[]): string[] {
    const insights = [];
    
    const scores = comparisons.map(c => c.overallScore);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    insights.push(`Average performance score: ${Math.round(avgScore)}`);
    
    const bestPerformer = comparisons.reduce((best, current) => 
      current.overallScore > best.overallScore ? current : best
    );
    
    insights.push(`Best performer: ${bestPerformer.title} (${bestPerformer.overallScore})`);
    
    return insights;
  }
}
