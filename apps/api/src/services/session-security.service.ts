import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

export interface SessionInfo {
  userId: string;
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
  ip: string;
  userAgent: string;
}

@Injectable()
export class SessionSecurityService {
  private redis: Redis;
  private readonly sessionTimeout = 24 * 60 * 60; // 24 hours in seconds
  private readonly maxConcurrentSessions = 3; // Maximum concurrent sessions per user

  constructor() {
    const url = process.env.REDIS_URL || 'redis://redis:6379';
    this.redis = new Redis(url);
  }

  /**
   * Create a new session
   */
  async createSession(
    userId: string,
    sessionId: string,
    ip: string,
    userAgent: string
  ): Promise<void> {
    const sessionInfo: SessionInfo = {
      userId,
      sessionId,
      createdAt: new Date(),
      lastActivity: new Date(),
      ip,
      userAgent,
    };

    // Store session info
    const sessionKey = `session:${sessionId}`;
    await this.redis.setex(
      sessionKey,
      this.sessionTimeout,
      JSON.stringify(sessionInfo)
    );

    // Add to user's session list
    const userSessionsKey = `user_sessions:${userId}`;
    await this.redis.sadd(userSessionsKey, sessionId);
    await this.redis.expire(userSessionsKey, this.sessionTimeout);

    // Enforce concurrent session limit
    await this.enforceConcurrentSessionLimit(userId);
  }

  /**
   * Validate and update session activity
   */
  async validateSession(sessionId: string): Promise<SessionInfo | null> {
    const sessionKey = `session:${sessionId}`;
    const sessionData = await this.redis.get(sessionKey);

    if (!sessionData) {
      return null;
    }

    const sessionInfo: SessionInfo = JSON.parse(sessionData);
    
    // Update last activity
    sessionInfo.lastActivity = new Date();
    await this.redis.setex(
      sessionKey,
      this.sessionTimeout,
      JSON.stringify(sessionInfo)
    );

    return sessionInfo;
  }

  /**
   * Invalidate a session
   */
  async invalidateSession(sessionId: string): Promise<void> {
    const sessionKey = `session:${sessionId}`;
    const sessionData = await this.redis.get(sessionKey);

    if (sessionData) {
      const sessionInfo: SessionInfo = JSON.parse(sessionData);
      
      // Remove from user's session list
      const userSessionsKey = `user_sessions:${sessionInfo.userId}`;
      await this.redis.srem(userSessionsKey, sessionId);
    }

    // Remove session data
    await this.redis.del(sessionKey);
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    const userSessionsKey = `user_sessions:${userId}`;
    const sessionIds = await this.redis.smembers(userSessionsKey);

    // Remove all session data
    const pipeline = this.redis.pipeline();
    for (const sessionId of sessionIds) {
      pipeline.del(`session:${sessionId}`);
    }
    pipeline.del(userSessionsKey);
    await pipeline.exec();
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    const userSessionsKey = `user_sessions:${userId}`;
    const sessionIds = await this.redis.smembers(userSessionsKey);

    const sessions: SessionInfo[] = [];
    for (const sessionId of sessionIds) {
      const sessionData = await this.redis.get(`session:${sessionId}`);
      if (sessionData) {
        sessions.push(JSON.parse(sessionData));
      }
    }

    return sessions;
  }

  /**
   * Check if session has timed out
   */
  async isSessionExpired(sessionId: string): Promise<boolean> {
    const sessionKey = `session:${sessionId}`;
    const exists = await this.redis.exists(sessionKey);
    return exists === 0;
  }

  /**
   * Enforce concurrent session limit
   */
  private async enforceConcurrentSessionLimit(userId: string): Promise<void> {
    const userSessionsKey = `user_sessions:${userId}`;
    const sessionIds = await this.redis.smembers(userSessionsKey);

    if (sessionIds.length > this.maxConcurrentSessions) {
      // Get session info for all sessions
      const sessions: { sessionId: string; lastActivity: Date }[] = [];
      
      for (const sessionId of sessionIds) {
        const sessionData = await this.redis.get(`session:${sessionId}`);
        if (sessionData) {
          const sessionInfo: SessionInfo = JSON.parse(sessionData);
          sessions.push({
            sessionId,
            lastActivity: new Date(sessionInfo.lastActivity),
          });
        }
      }

      // Sort by last activity (oldest first)
      sessions.sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime());

      // Remove oldest sessions
      const sessionsToRemove = sessions.slice(0, sessions.length - this.maxConcurrentSessions);
      
      for (const session of sessionsToRemove) {
        await this.invalidateSession(session.sessionId);
      }
    }
  }

  /**
   * Clean up expired sessions (can be called periodically)
   */
  async cleanupExpiredSessions(): Promise<void> {
    // This is a simple cleanup - in production, you might want to use Redis TTL
    // or implement a more sophisticated cleanup mechanism
    const keys = await this.redis.keys('session:*');
    
    for (const key of keys) {
      const ttl = await this.redis.ttl(key);
      if (ttl === -1) {
        // Key exists but has no TTL, set one
        await this.redis.expire(key, this.sessionTimeout);
      }
    }
  }
}
