import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../db.service';

export interface PipelineStage {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PipelineProgress {
  pipelineId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStage: number;
  totalStages: number;
  progress: number;
  stages: PipelineStage[];
  startedAt?: string;
  completedAt?: string;
  estimatedTimeRemaining?: number;
  metadata?: Record<string, any>;
}

export interface PipelineMetrics {
  pipelineId: string;
  totalDuration: number;
  stageMetrics: Array<{
    stageName: string;
    duration: number;
    success: boolean;
    error?: string;
  }>;
  success: boolean;
  error?: string;
}

export interface PipelineAnalytics {
  timeRange: {
    start: string;
    end: string;
  };
  totalPipelines: number;
  successfulPipelines: number;
  failedPipelines: number;
  successRate: number;
  averageDuration: number;
  stagePerformance: Array<{
    stageName: string;
    averageDuration: number;
    successRate: number;
    failureRate: number;
  }>;
  trends: Array<{
    date: string;
    pipelines: number;
    successRate: number;
    averageDuration: number;
  }>;
}

export interface PipelineConfiguration {
  stages: Array<{
    id: string;
    name: string;
    timeout?: number;
    retryable?: boolean;
    critical?: boolean;
  }>;
  options: {
    timeout?: number;
    retryPolicy?: {
      maxRetries: number;
      backoffMultiplier: number;
    };
    notifications?: {
      onFailure: boolean;
      onCompletion: boolean;
    };
  };
}

@Injectable()
export class PipelineMonitoringService {
  private readonly logger = new Logger(PipelineMonitoringService.name);
  private readonly activePipelines: Map<string, PipelineProgress> = new Map();

  constructor(private readonly db: DbService) {}

  async startPipeline(
    pipelineId: string,
    configuration: PipelineConfiguration,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const progress: PipelineProgress = {
        pipelineId,
        status: 'pending',
        currentStage: 0,
        totalStages: configuration.stages.length,
        progress: 0,
        stages: configuration.stages.map(stage => ({
          id: stage.id,
          name: stage.name,
          status: 'pending',
          metadata: { timeout: stage.timeout, retryable: stage.retryable, critical: stage.critical }
        })),
        metadata
      };

      this.activePipelines.set(pipelineId, progress);
      
      // Store in database
      await this.db.createPipelineProgress(progress);

      this.logger.log(`Started pipeline: ${pipelineId}`, {
        pipelineId,
        totalStages: configuration.stages.length,
        metadata
      });
    } catch (error) {
      this.logger.error(`Failed to start pipeline ${pipelineId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error(`Failed to start pipeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePipelineStatus(
    pipelineId: string,
    status: 'running' | 'completed' | 'failed' | 'cancelled',
    error?: string
  ): Promise<void> {
    try {
      const progress = this.activePipelines.get(pipelineId);
      if (!progress) {
        throw new Error(`Pipeline ${pipelineId} not found`);
      }

      progress.status = status;
      
      if (status === 'running' && !progress.startedAt) {
        progress.startedAt = new Date().toISOString();
      }
      
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        progress.completedAt = new Date().toISOString();
        progress.progress = 100;
      }

      if (error) {
        progress.metadata = { ...progress.metadata, error };
      }

      // Update in database
      await this.db.updatePipelineProgress(pipelineId, {
        status,
        startedAt: progress.startedAt,
        completedAt: progress.completedAt,
        progress: progress.progress,
        metadata: progress.metadata
      });

      this.logger.log(`Updated pipeline status: ${pipelineId} -> ${status}`, {
        pipelineId,
        status,
        error
      });
    } catch (error) {
      this.logger.error(`Failed to update pipeline status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async startStage(
    pipelineId: string,
    stageId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const progress = this.activePipelines.get(pipelineId);
      if (!progress) {
        throw new Error(`Pipeline ${pipelineId} not found`);
      }

      const stage = progress.stages.find(s => s.id === stageId);
      if (!stage) {
        throw new Error(`Stage ${stageId} not found in pipeline ${pipelineId}`);
      }

      stage.status = 'running';
      stage.startedAt = new Date().toISOString();
      stage.metadata = { ...stage.metadata, ...metadata };

      progress.status = 'running';
      if (!progress.startedAt) {
        progress.startedAt = new Date().toISOString();
      }

      // Update in database
      await this.db.updatePipelineStage(pipelineId, stageId, {
        status: 'running',
        startedAt: stage.startedAt,
        metadata: stage.metadata
      });

      this.logger.log(`Started stage: ${pipelineId}/${stageId}`, {
        pipelineId,
        stageId,
        stageName: stage.name
      });
    } catch (error) {
      this.logger.error(`Failed to start stage ${pipelineId}/${stageId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async completeStage(
    pipelineId: string,
    stageId: string,
    success: boolean,
    error?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const progress = this.activePipelines.get(pipelineId);
      if (!progress) {
        throw new Error(`Pipeline ${pipelineId} not found`);
      }

      const stage = progress.stages.find(s => s.id === stageId);
      if (!stage) {
        throw new Error(`Stage ${stageId} not found in pipeline ${pipelineId}`);
      }

      stage.status = success ? 'completed' : 'failed';
      stage.completedAt = new Date().toISOString();
      stage.duration = stage.startedAt 
        ? new Date(stage.completedAt).getTime() - new Date(stage.startedAt).getTime()
        : 0;
      
      if (error) {
        stage.error = error;
      }
      
      if (metadata) {
        stage.metadata = { ...stage.metadata, ...metadata };
      }

      // Update progress
      const completedStages = progress.stages.filter(s => s.status === 'completed' || s.status === 'failed').length;
      progress.currentStage = completedStages;
      progress.progress = Math.round((completedStages / progress.totalStages) * 100);

      // Check if pipeline is complete
      if (completedStages === progress.totalStages) {
        const hasFailures = progress.stages.some(s => s.status === 'failed');
        progress.status = hasFailures ? 'failed' : 'completed';
        progress.completedAt = new Date().toISOString();
      }

      // Update in database
      await this.db.updatePipelineStage(pipelineId, stageId, {
        status: stage.status,
        completedAt: stage.completedAt,
        duration: stage.duration,
        error: stage.error,
        metadata: stage.metadata
      });

      await this.db.updatePipelineProgress(pipelineId, {
        currentStage: progress.currentStage,
        progress: progress.progress,
        status: progress.status,
        completedAt: progress.completedAt
      });

      this.logger.log(`Completed stage: ${pipelineId}/${stageId}`, {
        pipelineId,
        stageId,
        stageName: stage.name,
        success,
        duration: stage.duration,
        error
      });
    } catch (error) {
      this.logger.error(`Failed to complete stage ${pipelineId}/${stageId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async getPipelineProgress(pipelineId: string): Promise<PipelineProgress> {
    const progress = this.activePipelines.get(pipelineId);
    if (!progress) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    // Calculate estimated time remaining
    if (progress.startedAt && progress.currentStage > 0) {
      const elapsed = Date.now() - new Date(progress.startedAt).getTime();
      const averageTimePerStage = elapsed / progress.currentStage;
      const remainingStages = progress.totalStages - progress.currentStage;
      progress.estimatedTimeRemaining = Math.round(averageTimePerStage * remainingStages);
    }

    return progress;
  }

  async getPipelineMetrics(pipelineId: string): Promise<PipelineMetrics> {
    const progress = this.activePipelines.get(pipelineId);
    if (!progress) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    const totalDuration = progress.startedAt && progress.completedAt
      ? new Date(progress.completedAt).getTime() - new Date(progress.startedAt).getTime()
      : 0;

    const stageMetrics = progress.stages.map(stage => ({
      stageName: stage.name,
      duration: stage.duration || 0,
      success: stage.status === 'completed',
      error: stage.error
    }));

    return {
      pipelineId,
      totalDuration,
      stageMetrics,
      success: progress.status === 'completed',
      error: progress.metadata?.error
    };
  }

  async getPipelineAnalytics(
    organizationId: string,
    timeRange: { start: string; end: string }
  ): Promise<PipelineAnalytics> {
    try {
      const pipelines = await this.db.getPipelineAnalytics(organizationId, timeRange);
      
      const totalPipelines = pipelines.length;
      const successfulPipelines = pipelines.filter(p => p.status === 'completed').length;
      const failedPipelines = pipelines.filter(p => p.status === 'failed').length;
      const successRate = totalPipelines > 0 ? (successfulPipelines / totalPipelines) * 100 : 0;
      
      const averageDuration = pipelines.length > 0
        ? pipelines.reduce((sum, p) => sum + (p.totalDuration || 0), 0) / pipelines.length
        : 0;

      // Calculate stage performance
      const stagePerformance = this.calculateStagePerformance(pipelines);

      // Generate trends
      const trends = this.generateTrends(pipelines, timeRange);

      return {
        timeRange,
        totalPipelines,
        successfulPipelines,
        failedPipelines,
        successRate: Math.round(successRate),
        averageDuration: Math.round(averageDuration),
        stagePerformance,
        trends
      };
    } catch (error) {
      this.logger.error(`Failed to get pipeline analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error(`Failed to get pipeline analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cancelPipeline(pipelineId: string, reason?: string): Promise<void> {
    try {
      const progress = this.activePipelines.get(pipelineId);
      if (!progress) {
        throw new Error(`Pipeline ${pipelineId} not found`);
      }

      if (progress.status === 'completed' || progress.status === 'failed') {
        throw new Error(`Cannot cancel completed pipeline ${pipelineId}`);
      }

      progress.status = 'cancelled';
      progress.completedAt = new Date().toISOString();
      progress.metadata = { ...progress.metadata, cancellationReason: reason };

      // Cancel any running stages
      progress.stages.forEach(stage => {
        if (stage.status === 'running') {
          stage.status = 'cancelled';
          stage.completedAt = new Date().toISOString();
        }
      });

      await this.db.updatePipelineProgress(pipelineId, {
        status: 'cancelled',
        completedAt: progress.completedAt,
        metadata: progress.metadata
      });

      this.logger.log(`Cancelled pipeline: ${pipelineId}`, {
        pipelineId,
        reason
      });
    } catch (error) {
      this.logger.error(`Failed to cancel pipeline ${pipelineId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private calculateStagePerformance(pipelines: any[]): Array<{
    stageName: string;
    averageDuration: number;
    successRate: number;
    failureRate: number;
  }> {
    const stageStats: Record<string, { durations: number[]; successes: number; failures: number }> = {};

    pipelines.forEach(pipeline => {
      pipeline.stages?.forEach((stage: any) => {
        if (!stageStats[stage.name]) {
          stageStats[stage.name] = { durations: [], successes: 0, failures: 0 };
        }
        
        stageStats[stage.name].durations.push(stage.duration || 0);
        
        if (stage.status === 'completed') {
          stageStats[stage.name].successes++;
        } else if (stage.status === 'failed') {
          stageStats[stage.name].failures++;
        }
      });
    });

    return Object.entries(stageStats).map(([stageName, stats]) => {
      const total = stats.successes + stats.failures;
      const averageDuration = stats.durations.length > 0 
        ? stats.durations.reduce((sum, duration) => sum + duration, 0) / stats.durations.length
        : 0;
      
      return {
        stageName,
        averageDuration: Math.round(averageDuration),
        successRate: total > 0 ? Math.round((stats.successes / total) * 100) : 0,
        failureRate: total > 0 ? Math.round((stats.failures / total) * 100) : 0
      };
    });
  }

  private generateTrends(pipelines: any[], timeRange: { start: string; end: string }): Array<{
    date: string;
    pipelines: number;
    successRate: number;
    averageDuration: number;
  }> {
    const trends = [];
    const startDate = new Date(timeRange.start);
    const endDate = new Date(timeRange.end);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayPipelines = pipelines.filter(p => 
        p.startedAt && p.startedAt.startsWith(dateStr)
      );
      
      const successfulPipelines = dayPipelines.filter(p => p.status === 'completed');
      const successRate = dayPipelines.length > 0 
        ? (successfulPipelines.length / dayPipelines.length) * 100 
        : 0;
      
      const averageDuration = dayPipelines.length > 0
        ? dayPipelines.reduce((sum, p) => sum + (p.totalDuration || 0), 0) / dayPipelines.length
        : 0;
      
      trends.push({
        date: dateStr,
        pipelines: dayPipelines.length,
        successRate: Math.round(successRate),
        averageDuration: Math.round(averageDuration)
      });
    }
    
    return trends;
  }
}
