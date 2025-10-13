import { Injectable, Logger } from '@nestjs/common';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

export interface ErrorContext {
  correlationId: string;
  operation: string;
  timestamp: string;
  userId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDuration: number;
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime?: string;
  nextAttemptTime?: string;
}

@Injectable()
export class EnhancedErrorHandlingService {
  private readonly logger = new Logger(EnhancedErrorHandlingService.name);
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private readonly defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 'rate_limit', 'timeout', 'temporary']
  };

  private readonly defaultCircuitBreakerConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    monitoringPeriod: 300000 // 5 minutes
  };

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    config?: Partial<RetryConfig>,
    context?: ErrorContext
  ): Promise<RetryResult<T>> {
    const retryConfig = { ...this.defaultRetryConfig, ...config };
    const correlationId = context?.correlationId || this.generateCorrelationId();
    const startTime = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        this.logger.log(`Attempting ${operationName} (attempt ${attempt}/${retryConfig.maxAttempts})`, {
          correlationId,
          attempt,
          operation: operationName
        });

        const result = await operation();
        
        this.logger.log(`Successfully completed ${operationName}`, {
          correlationId,
          attempt,
          duration: Date.now() - startTime
        });

        return {
          success: true,
          result,
          attempts: attempt,
          totalDuration: Date.now() - startTime
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        this.logger.warn(`Attempt ${attempt} failed for ${operationName}`, {
          correlationId,
          attempt,
          error: lastError.message,
          errorType: lastError.constructor.name
        });

        // Check if error is retryable
        if (!this.isRetryableError(lastError, retryConfig.retryableErrors)) {
          this.logger.error(`Non-retryable error in ${operationName}`, {
            correlationId,
            error: lastError.message,
            errorType: lastError.constructor.name
          });
          break;
        }

        // Don't delay after the last attempt
        if (attempt < retryConfig.maxAttempts) {
          const delay = this.calculateDelay(attempt, retryConfig);
          this.logger.log(`Waiting ${delay}ms before retry`, {
            correlationId,
            attempt,
            delay
          });
          await this.delay(delay);
        }
      }
    }

    this.logger.error(`All retry attempts failed for ${operationName}`, {
      correlationId,
      attempts: retryConfig.maxAttempts,
      totalDuration: Date.now() - startTime,
      lastError: lastError?.message
    });

    return {
      success: false,
      error: lastError,
      attempts: retryConfig.maxAttempts,
      totalDuration: Date.now() - startTime
    };
  }

  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    operationName: string,
    config?: Partial<CircuitBreakerConfig>,
    context?: ErrorContext
  ): Promise<T> {
    const circuitConfig = { ...this.defaultCircuitBreakerConfig, ...config };
    const circuitKey = `${operationName}_circuit`;
    const correlationId = context?.correlationId || this.generateCorrelationId();

    // Check circuit breaker state
    const circuitState = this.getCircuitBreakerState(circuitKey);
    
    if (circuitState.state === 'OPEN') {
      if (Date.now() < new Date(circuitState.nextAttemptTime || 0).getTime()) {
        throw new Error(`Circuit breaker is OPEN for ${operationName}. Next attempt allowed at ${circuitState.nextAttemptTime}`);
      } else {
        // Transition to HALF_OPEN
        circuitState.state = 'HALF_OPEN';
        circuitState.failureCount = 0;
        this.circuitBreakers.set(circuitKey, circuitState);
        
        this.logger.log(`Circuit breaker transitioning to HALF_OPEN for ${operationName}`, {
          correlationId,
          circuitKey
        });
      }
    }

    try {
      const result = await operation();
      
      // Success - reset circuit breaker if it was HALF_OPEN
      if (circuitState.state === 'HALF_OPEN') {
        circuitState.state = 'CLOSED';
        circuitState.failureCount = 0;
        circuitState.lastFailureTime = undefined;
        circuitState.nextAttemptTime = undefined;
        this.circuitBreakers.set(circuitKey, circuitState);
        
        this.logger.log(`Circuit breaker reset to CLOSED for ${operationName}`, {
          correlationId,
          circuitKey
        });
      }
      
      return result;
    } catch (error) {
      // Failure - update circuit breaker state
      circuitState.failureCount++;
      circuitState.lastFailureTime = new Date().toISOString();
      
      if (circuitState.failureCount >= circuitConfig.failureThreshold) {
        circuitState.state = 'OPEN';
        circuitState.nextAttemptTime = new Date(Date.now() + circuitConfig.recoveryTimeout).toISOString();
        
        this.logger.error(`Circuit breaker opened for ${operationName}`, {
          correlationId,
          circuitKey,
          failureCount: circuitState.failureCount,
          threshold: circuitConfig.failureThreshold,
          nextAttemptTime: circuitState.nextAttemptTime
        });
      }
      
      this.circuitBreakers.set(circuitKey, circuitState);
      throw error;
    }
  }

  async executeWithGracefulDegradation<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    operationName: string,
    context?: ErrorContext
  ): Promise<T> {
    const correlationId = context?.correlationId || this.generateCorrelationId();
    
    try {
      this.logger.log(`Attempting primary operation for ${operationName}`, {
        correlationId,
        operation: operationName
      });
      
      return await primaryOperation();
    } catch (error) {
      this.logger.warn(`Primary operation failed for ${operationName}, attempting fallback`, {
        correlationId,
        error: error instanceof Error ? error.message : String(error),
        operation: operationName
      });
      
      try {
        return await fallbackOperation();
      } catch (fallbackError) {
        this.logger.error(`Both primary and fallback operations failed for ${operationName}`, {
          correlationId,
          primaryError: error instanceof Error ? error.message : String(error),
          fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          operation: operationName
        });
        
        throw fallbackError;
      }
    }
  }

  createErrorContext(
    operation: string,
    userId?: string,
    organizationId?: string,
    metadata?: Record<string, any>
  ): ErrorContext {
    return {
      correlationId: this.generateCorrelationId(),
      operation,
      timestamp: new Date().toISOString(),
      userId,
      organizationId,
      metadata
    };
  }

  logError(error: Error, context: ErrorContext, additionalData?: Record<string, any>): void {
    this.logger.error(`Error occurred in ${context.operation}`, {
      correlationId: context.correlationId,
      operation: context.operation,
      timestamp: context.timestamp,
      userId: context.userId,
      organizationId: context.organizationId,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.constructor.name
      },
      metadata: context.metadata,
      additionalData
    });
  }

  getCircuitBreakerState(circuitKey: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(circuitKey)) {
      this.circuitBreakers.set(circuitKey, {
        state: 'CLOSED',
        failureCount: 0
      });
    }
    
    return this.circuitBreakers.get(circuitKey)!;
  }

  resetCircuitBreaker(circuitKey: string): void {
    this.circuitBreakers.set(circuitKey, {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: undefined,
      nextAttemptTime: undefined
    });
    
    this.logger.log(`Circuit breaker reset for ${circuitKey}`);
  }

  getCircuitBreakerMetrics(): Record<string, CircuitBreakerState> {
    return Object.fromEntries(this.circuitBreakers.entries());
  }

  private isRetryableError(error: Error, retryableErrors: string[]): boolean {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.constructor.name.toLowerCase();
    
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase()) ||
      errorName.includes(retryableError.toLowerCase())
    );
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
    return Math.min(exponentialDelay + jitter, config.maxDelay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }
}
