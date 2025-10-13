import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../db.service';

export interface OptimalTiming {
  platform: string;
  bestTimes: Array<{
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
    hour: number;       // 0-23
    engagementScore: number;
    audienceSize: number;
  }>;
  timezone: string;
  confidence: number;
}

export interface ScheduleRecommendation {
  contentItemId: string;
  platform: string;
  recommendedTimes: Array<{
    scheduledAt: string;
    engagementScore: number;
    reason: string;
    confidence: number;
  }>;
  alternativeTimes: Array<{
    scheduledAt: string;
    engagementScore: number;
    reason: string;
  }>;
}

export interface ScheduleConflict {
  contentItemId: string;
  platform: string;
  conflictingSchedules: Array<{
    scheduleId: string;
    scheduledAt: string;
    conflictType: 'same_time' | 'too_close' | 'audience_overlap';
    severity: 'low' | 'medium' | 'high';
  }>;
  resolution: {
    suggestedAction: 'reschedule' | 'delay' | 'cancel' | 'merge';
    newTime?: string;
    reason: string;
  };
}

export interface ScheduleAnalytics {
  platform: string;
  totalSchedules: number;
  successfulSchedules: number;
  failedSchedules: number;
  averageEngagement: number;
  bestPerformingTimes: Array<{
    dayOfWeek: number;
    hour: number;
    averageEngagement: number;
    scheduleCount: number;
  }>;
  trends: Array<{
    date: string;
    schedules: number;
    engagement: number;
    successRate: number;
  }>;
}

export interface RecurringSchedule {
  id: string;
  name: string;
  organizationId: string;
  template: {
    platforms: string[];
    frequency: 'daily' | 'weekly' | 'monthly';
    timeOfDay: string; // HH:MM format
    daysOfWeek?: number[]; // For weekly frequency
    dayOfMonth?: number;   // For monthly frequency
  };
  contentTemplate: {
    type: 'BLOG' | 'NEWSLETTER' | 'SOCIAL';
    brief: string;
    angle?: string;
  };
  enabled: boolean;
  nextExecution?: string;
  createdAt: string;
}

@Injectable()
export class SmartSchedulingService {
  private readonly logger = new Logger(SmartSchedulingService.name);

  constructor(private readonly db: DbService) {}

  async getOptimalTiming(platform: string, organizationId: string, timezone: string = 'UTC'): Promise<OptimalTiming> {
    try {
      // Get historical performance data
      const performanceData = await this.db.getPlatformPerformanceData(platform, organizationId, 90);
      
      // Analyze engagement patterns by day and hour
      const timingAnalysis = this.analyzeEngagementPatterns(performanceData, timezone);
      
      // Get audience data for confidence scoring
      const audienceData = await this.db.getAudienceData(organizationId, platform);
      
      const optimalTiming: OptimalTiming = {
        platform,
        bestTimes: timingAnalysis.bestTimes,
        timezone,
        confidence: this.calculateConfidence(timingAnalysis, audienceData)
      };

      this.logger.log(`Generated optimal timing for ${platform} with confidence ${optimalTiming.confidence}%`);
      return optimalTiming;
    } catch (error) {
      this.logger.error(`Failed to get optimal timing: ${error.message}`);
      throw new Error(`Failed to get optimal timing: ${error.message}`);
    }
  }

  async generateScheduleRecommendations(contentItemId: string, platforms: string[]): Promise<ScheduleRecommendation[]> {
    try {
      const recommendations: ScheduleRecommendation[] = [];
      
      for (const platform of platforms) {
        const contentItem = await this.db.getContentItem(contentItemId);
        if (!contentItem) {
          continue;
        }

        const organizationId = (contentItem as any).organization_id;
        const optimalTiming = await this.getOptimalTiming(platform, organizationId);
        
        const recommendedTimes = this.generateRecommendedTimes(optimalTiming, contentItem);
        const alternativeTimes = this.generateAlternativeTimes(optimalTiming, contentItem);

        recommendations.push({
          contentItemId,
          platform,
          recommendedTimes,
          alternativeTimes
        });
      }

      this.logger.log(`Generated schedule recommendations for ${contentItemId} on ${platforms.length} platforms`);
      return recommendations;
    } catch (error) {
      this.logger.error(`Failed to generate schedule recommendations: ${error.message}`);
      throw new Error(`Failed to generate schedule recommendations: ${error.message}`);
    }
  }

  async detectScheduleConflicts(contentItemId: string, platform: string, scheduledAt: string): Promise<ScheduleConflict | null> {
    try {
      const contentItem = await this.db.getContentItem(contentItemId);
      if (!contentItem) {
        return null;
      }

      const organizationId = (contentItem as any).organization_id;
      const existingSchedules = await this.db.getSchedulesInTimeRange(
        organizationId,
        platform,
        scheduledAt,
        2 // 2-hour window
      );

      if (existingSchedules.length === 0) {
        return null;
      }

      const conflicts = this.analyzeConflicts(existingSchedules, scheduledAt);
      
      if (conflicts.length === 0) {
        return null;
      }

      const resolution = this.generateConflictResolution(conflicts, scheduledAt);

      return {
        contentItemId,
        platform,
        conflictingSchedules: conflicts,
        resolution
      };
    } catch (error) {
      this.logger.error(`Failed to detect schedule conflicts: ${error.message}`);
      throw new Error(`Failed to detect schedule conflicts: ${error.message}`);
    }
  }

  async createRecurringSchedule(schedule: Omit<RecurringSchedule, 'id' | 'createdAt'>): Promise<string> {
    try {
      const scheduleId = `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      
      const nextExecution = this.calculateNextExecution(schedule.template);
      
      await this.db.createRecurringSchedule({
        id: scheduleId,
        ...schedule,
        nextExecution,
        createdAt: new Date().toISOString()
      });

      this.logger.log(`Created recurring schedule: ${scheduleId}`);
      return scheduleId;
    } catch (error) {
      this.logger.error(`Failed to create recurring schedule: ${error.message}`);
      throw new Error(`Failed to create recurring schedule: ${error.message}`);
    }
  }

  async processRecurringSchedules(): Promise<{
    processed: number;
    created: number;
    errors: number;
  }> {
    try {
      const dueSchedules = await this.db.getDueRecurringSchedules();
      let processed = 0;
      let created = 0;
      let errors = 0;

      for (const schedule of dueSchedules) {
        try {
          // Generate content for the schedule
          const contentItemId = await this.generateContentForSchedule(schedule);
          
          // Create individual schedules for each platform
          for (const platform of schedule.template.platforms) {
            const scheduledAt = this.calculateScheduleTime(schedule.template, platform);
            
            await this.db.createSchedule(
              contentItemId,
              platform,
              scheduledAt,
              [],
              null
            );
            
            created++;
          }

          // Update next execution time
          const nextExecution = this.calculateNextExecution(schedule.template);
          await this.db.updateRecurringSchedule(schedule.id, { nextExecution });

          processed++;
        } catch (error) {
          this.logger.error(`Failed to process recurring schedule ${schedule.id}: ${error.message}`);
          errors++;
        }
      }

      this.logger.log(`Processed ${processed} recurring schedules, created ${created} individual schedules, ${errors} errors`);
      return { processed, created, errors };
    } catch (error) {
      this.logger.error(`Failed to process recurring schedules: ${error.message}`);
      throw new Error(`Failed to process recurring schedules: ${error.message}`);
    }
  }

  async getScheduleAnalytics(platform: string, organizationId: string, days: number = 30): Promise<ScheduleAnalytics> {
    try {
      const schedules = await this.db.getScheduleAnalytics(platform, organizationId, days);
      
      const totalSchedules = schedules.length;
      const successfulSchedules = schedules.filter(s => s.status === 'published').length;
      const failedSchedules = schedules.filter(s => s.status === 'failed').length;
      
      const averageEngagement = schedules.reduce((sum, s) => sum + (s.engagement || 0), 0) / totalSchedules;
      
      const bestPerformingTimes = this.analyzeBestPerformingTimes(schedules);
      const trends = this.generateScheduleTrends(schedules, days);

      return {
        platform,
        totalSchedules,
        successfulSchedules,
        failedSchedules,
        averageEngagement: Math.round(averageEngagement),
        bestPerformingTimes,
        trends
      };
    } catch (error) {
      this.logger.error(`Failed to get schedule analytics: ${error.message}`);
      throw new Error(`Failed to get schedule analytics: ${error.message}`);
    }
  }

  async suggestOptimalSchedule(contentItemId: string, platform: string, preferredTime?: string): Promise<{
    suggestedTime: string;
    engagementScore: number;
    reason: string;
    alternatives: Array<{
      time: string;
      score: number;
      reason: string;
    }>;
  }> {
    try {
      const contentItem = await this.db.getContentItem(contentItemId);
      if (!contentItem) {
        throw new Error('Content item not found');
      }

      const organizationId = (contentItem as any).organization_id;
      const optimalTiming = await this.getOptimalTiming(platform, organizationId);
      
      let suggestedTime: string;
      let engagementScore: number;
      let reason: string;

      if (preferredTime) {
        // Check if preferred time is optimal
        const preferredScore = this.calculateEngagementScore(preferredTime, optimalTiming);
        if (preferredScore > 70) {
          suggestedTime = preferredTime;
          engagementScore = preferredScore;
          reason = 'Preferred time aligns with optimal engagement patterns';
        } else {
          // Find better time
          const bestTime = this.findBestTime(optimalTiming, preferredTime);
          suggestedTime = bestTime.time;
          engagementScore = bestTime.score;
          reason = `Optimized from preferred time for better engagement`;
        }
      } else {
        // Find best available time
        const bestTime = this.findBestAvailableTime(optimalTiming, contentItemId, platform);
        suggestedTime = bestTime.time;
        engagementScore = bestTime.score;
        reason = 'Best available time based on engagement patterns';
      }

      const alternatives = this.generateAlternatives(optimalTiming, suggestedTime);

      return {
        suggestedTime,
        engagementScore,
        reason,
        alternatives
      };
    } catch (error) {
      this.logger.error(`Failed to suggest optimal schedule: ${error.message}`);
      throw new Error(`Failed to suggest optimal schedule: ${error.message}`);
    }
  }

  private analyzeEngagementPatterns(performanceData: any[], timezone: string): {
    bestTimes: Array<{
      dayOfWeek: number;
      hour: number;
      engagementScore: number;
      audienceSize: number;
    }>;
  } {
    const patterns: Record<string, { engagement: number; count: number }> = {};
    
    for (const data of performanceData) {
      const date = new Date(data.publishedAt);
      const dayOfWeek = date.getDay();
      const hour = date.getHours();
      const key = `${dayOfWeek}_${hour}`;
      
      if (!patterns[key]) {
        patterns[key] = { engagement: 0, count: 0 };
      }
      
      patterns[key].engagement += data.engagement || 0;
      patterns[key].count += 1;
    }

    const bestTimes = Object.entries(patterns)
      .map(([key, data]) => {
        const [dayOfWeek, hour] = key.split('_').map(Number);
        return {
          dayOfWeek,
          hour,
          engagementScore: data.engagement / data.count,
          audienceSize: data.count
        };
      })
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 10);

    return { bestTimes };
  }

  private calculateConfidence(timingAnalysis: any, audienceData: any): number {
    // Confidence based on data quality and consistency
    let confidence = 50; // Base confidence
    
    if (timingAnalysis.bestTimes.length > 5) {
      confidence += 20; // Good data volume
    }
    
    if (audienceData && audienceData.size > 1000) {
      confidence += 15; // Large audience
    }
    
    // Check consistency of top times
    const topTimes = timingAnalysis.bestTimes.slice(0, 3);
    const scoreVariance = this.calculateVariance(topTimes.map(t => t.engagementScore));
    if (scoreVariance < 0.1) {
      confidence += 15; // Consistent performance
    }
    
    return Math.min(100, confidence);
  }

  private calculateVariance(scores: number[]): number {
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    return variance;
  }

  private generateRecommendedTimes(optimalTiming: OptimalTiming, contentItem: any): Array<{
    scheduledAt: string;
    engagementScore: number;
    reason: string;
    confidence: number;
  }> {
    const recommendations = [];
    const now = new Date();
    
    for (const bestTime of optimalTiming.bestTimes.slice(0, 3)) {
      const scheduledAt = this.calculateNextOccurrence(bestTime.dayOfWeek, bestTime.hour, now);
      
      recommendations.push({
        scheduledAt: scheduledAt.toISOString(),
        engagementScore: bestTime.engagementScore,
        reason: `Optimal ${optimalTiming.platform} engagement time (${this.getDayName(bestTime.dayOfWeek)} ${bestTime.hour}:00)`,
        confidence: optimalTiming.confidence
      });
    }
    
    return recommendations;
  }

  private generateAlternativeTimes(optimalTiming: OptimalTiming, contentItem: any): Array<{
    scheduledAt: string;
    engagementScore: number;
    reason: string;
  }> {
    const alternatives = [];
    const now = new Date();
    
    // Add some alternative times (next few days)
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dayOfWeek = futureDate.getDay();
      
      // Find best time for this day
      const bestTimeForDay = optimalTiming.bestTimes.find(t => t.dayOfWeek === dayOfWeek);
      if (bestTimeForDay) {
        const scheduledAt = new Date(futureDate);
        scheduledAt.setHours(bestTimeForDay.hour, 0, 0, 0);
        
        alternatives.push({
          scheduledAt: scheduledAt.toISOString(),
          engagementScore: bestTimeForDay.engagementScore,
          reason: `Alternative time for ${this.getDayName(dayOfWeek)}`
        });
      }
    }
    
    return alternatives;
  }

  private analyzeConflicts(existingSchedules: any[], scheduledAt: string): Array<{
    scheduleId: string;
    scheduledAt: string;
    conflictType: 'same_time' | 'too_close' | 'audience_overlap';
    severity: 'low' | 'medium' | 'high';
  }> {
    const conflicts = [];
    const scheduledTime = new Date(scheduledAt);
    
    for (const schedule of existingSchedules) {
      const existingTime = new Date(schedule.scheduledAt);
      const timeDiff = Math.abs(scheduledTime.getTime() - existingTime.getTime()) / (1000 * 60); // minutes
      
      if (timeDiff === 0) {
        conflicts.push({
          scheduleId: schedule.id,
          scheduledAt: schedule.scheduledAt,
          conflictType: 'same_time',
          severity: 'high'
        });
      } else if (timeDiff < 30) {
        conflicts.push({
          scheduleId: schedule.id,
          scheduledAt: schedule.scheduledAt,
          conflictType: 'too_close',
          severity: 'medium'
        });
      } else if (timeDiff < 60) {
        conflicts.push({
          scheduleId: schedule.id,
          scheduledAt: schedule.scheduledAt,
          conflictType: 'audience_overlap',
          severity: 'low'
        });
      }
    }
    
    return conflicts;
  }

  private generateConflictResolution(conflicts: any[], scheduledAt: string): {
    suggestedAction: 'reschedule' | 'delay' | 'cancel' | 'merge';
    newTime?: string;
    reason: string;
  } {
    const highSeverityConflicts = conflicts.filter(c => c.severity === 'high');
    const mediumSeverityConflicts = conflicts.filter(c => c.severity === 'medium');
    
    if (highSeverityConflicts.length > 0) {
      return {
        suggestedAction: 'reschedule',
        newTime: this.suggestNewTime(scheduledAt, 60), // 1 hour later
        reason: 'Exact time conflict detected'
      };
    } else if (mediumSeverityConflicts.length > 0) {
      return {
        suggestedAction: 'delay',
        newTime: this.suggestNewTime(scheduledAt, 30), // 30 minutes later
        reason: 'Too close to existing schedule'
      };
    } else {
      return {
        suggestedAction: 'merge',
        reason: 'Minor audience overlap, can proceed'
      };
    }
  }

  private suggestNewTime(scheduledAt: string, delayMinutes: number): string {
    const time = new Date(scheduledAt);
    time.setMinutes(time.getMinutes() + delayMinutes);
    return time.toISOString();
  }

  private calculateNextExecution(template: RecurringSchedule['template']): string {
    const now = new Date();
    
    switch (template.frequency) {
      case 'daily':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(parseInt(template.timeOfDay.split(':')[0]), parseInt(template.timeOfDay.split(':')[1]), 0, 0);
        return tomorrow.toISOString();
        
      case 'weekly':
        const nextWeek = new Date(now);
        const daysUntilNext = (7 - now.getDay() + template.daysOfWeek![0]) % 7;
        nextWeek.setDate(nextWeek.getDate() + daysUntilNext);
        nextWeek.setHours(parseInt(template.timeOfDay.split(':')[0]), parseInt(template.timeOfDay.split(':')[1]), 0, 0);
        return nextWeek.toISOString();
        
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(template.dayOfMonth!);
        nextMonth.setHours(parseInt(template.timeOfDay.split(':')[0]), parseInt(template.timeOfDay.split(':')[1]), 0, 0);
        return nextMonth.toISOString();
        
      default:
        return now.toISOString();
    }
  }

  private async generateContentForSchedule(schedule: RecurringSchedule): Promise<string> {
    // Generate content using the content generation service
    // This would integrate with ContentGenerationService
    const contentItemId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    // Mock content generation
    await this.db.createContentItem(
      schedule.organizationId,
      `Recurring: ${schedule.contentTemplate.brief}`,
      schedule.contentTemplate.type,
      'DRAFT',
      [],
      {
        recurringScheduleId: schedule.id,
        generated: true,
        brief: schedule.contentTemplate.brief,
        angle: schedule.contentTemplate.angle
      },
      'system'
    );
    
    return contentItemId;
  }

  private calculateScheduleTime(template: RecurringSchedule['template'], platform: string): Date {
    const now = new Date();
    const scheduledTime = new Date(now);
    
    // Set the time based on template
    const [hours, minutes] = template.timeOfDay.split(':').map(Number);
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    // Add platform-specific adjustments if needed
    // This could include timezone adjustments, platform-specific optimal times, etc.
    
    return scheduledTime;
  }

  private analyzeBestPerformingTimes(schedules: any[]): Array<{
    dayOfWeek: number;
    hour: number;
    averageEngagement: number;
    scheduleCount: number;
  }> {
    const timePerformance: Record<string, { engagement: number; count: number }> = {};
    
    for (const schedule of schedules) {
      const scheduledAt = new Date(schedule.scheduledAt);
      const dayOfWeek = scheduledAt.getDay();
      const hour = scheduledAt.getHours();
      const key = `${dayOfWeek}_${hour}`;
      
      if (!timePerformance[key]) {
        timePerformance[key] = { engagement: 0, count: 0 };
      }
      
      timePerformance[key].engagement += schedule.engagement || 0;
      timePerformance[key].count += 1;
    }
    
    return Object.entries(timePerformance)
      .map(([key, data]) => {
        const [dayOfWeek, hour] = key.split('_').map(Number);
        return {
          dayOfWeek,
          hour,
          averageEngagement: data.engagement / data.count,
          scheduleCount: data.count
        };
      })
      .sort((a, b) => b.averageEngagement - a.averageEngagement)
      .slice(0, 10);
  }

  private generateScheduleTrends(schedules: any[], days: number): Array<{
    date: string;
    schedules: number;
    engagement: number;
    successRate: number;
  }> {
    const trends = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySchedules = schedules.filter(s => 
        s.scheduledAt.startsWith(dateStr)
      );
      
      const successfulSchedules = daySchedules.filter(s => s.status === 'published');
      const successRate = daySchedules.length > 0 
        ? (successfulSchedules.length / daySchedules.length) * 100 
        : 0;
      
      const averageEngagement = daySchedules.length > 0
        ? daySchedules.reduce((sum, s) => sum + (s.engagement || 0), 0) / daySchedules.length
        : 0;
      
      trends.push({
        date: dateStr,
        schedules: daySchedules.length,
        engagement: Math.round(averageEngagement),
        successRate: Math.round(successRate)
      });
    }
    
    return trends;
  }

  private calculateEngagementScore(scheduledAt: string, optimalTiming: OptimalTiming): number {
    const scheduledTime = new Date(scheduledAt);
    const dayOfWeek = scheduledTime.getDay();
    const hour = scheduledTime.getHours();
    
    const matchingTime = optimalTiming.bestTimes.find(t => 
      t.dayOfWeek === dayOfWeek && t.hour === hour
    );
    
    return matchingTime ? matchingTime.engagementScore : 30; // Default low score
  }

  private findBestTime(optimalTiming: OptimalTiming, preferredTime?: string): { time: string; score: number } {
    const now = new Date();
    const bestTime = optimalTiming.bestTimes[0];
    
    const scheduledAt = this.calculateNextOccurrence(bestTime.dayOfWeek, bestTime.hour, now);
    
    return {
      time: scheduledAt.toISOString(),
      score: bestTime.engagementScore
    };
  }

  private findBestAvailableTime(optimalTiming: OptimalTiming, contentItemId: string, platform: string): { time: string; score: number } {
    // Find the best time that doesn't conflict with existing schedules
    const now = new Date();
    
    for (const bestTime of optimalTiming.bestTimes) {
      const scheduledAt = this.calculateNextOccurrence(bestTime.dayOfWeek, bestTime.hour, now);
      
      // Check for conflicts (simplified)
      const conflicts = this.detectScheduleConflicts(contentItemId, platform, scheduledAt.toISOString());
      if (!conflicts) {
        return {
          time: scheduledAt.toISOString(),
          score: bestTime.engagementScore
        };
      }
    }
    
    // Fallback to next available time
    const fallbackTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    return {
      time: fallbackTime.toISOString(),
      score: 50
    };
  }

  private generateAlternatives(optimalTiming: OptimalTiming, suggestedTime: string): Array<{
    time: string;
    score: number;
    reason: string;
  }> {
    const alternatives = [];
    const suggested = new Date(suggestedTime);
    
    // Add alternatives from other optimal times
    for (const bestTime of optimalTiming.bestTimes.slice(1, 4)) {
      const alternativeTime = this.calculateNextOccurrence(bestTime.dayOfWeek, bestTime.hour, suggested);
      
      alternatives.push({
        time: alternativeTime.toISOString(),
        score: bestTime.engagementScore,
        reason: `Alternative optimal time (${this.getDayName(bestTime.dayOfWeek)} ${bestTime.hour}:00)`
      });
    }
    
    return alternatives;
  }

  private calculateNextOccurrence(dayOfWeek: number, hour: number, fromDate: Date): Date {
    const nextOccurrence = new Date(fromDate);
    const daysUntilTarget = (dayOfWeek - fromDate.getDay() + 7) % 7;
    
    if (daysUntilTarget === 0 && fromDate.getHours() >= hour) {
      // If it's the same day but the hour has passed, schedule for next week
      nextOccurrence.setDate(nextOccurrence.getDate() + 7);
    } else {
      nextOccurrence.setDate(nextOccurrence.getDate() + daysUntilTarget);
    }
    
    nextOccurrence.setHours(hour, 0, 0, 0);
    return nextOccurrence;
  }

  private getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  }
}
