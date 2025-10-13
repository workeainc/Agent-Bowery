import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../db.service';

export interface NotificationChannel {
  id: string;
  type: 'email' | 'slack' | 'teams' | 'webhook' | 'push';
  name: string;
  organizationId: string;
  configuration: Record<string, any>;
  enabled: boolean;
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'content_approval' | 'content_rejected' | 'content_published' | 'workflow_escalation' | 'schedule_reminder';
  subject?: string;
  body: string;
  variables: string[];
  organizationId: string;
  createdAt: string;
}

export interface NotificationRule {
  id: string;
  name: string;
  organizationId: string;
  trigger: 'content_created' | 'content_approved' | 'content_rejected' | 'content_published' | 'workflow_failed' | 'schedule_due';
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  channels: string[];
  template: string;
  enabled: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  organizationId: string;
  userId?: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
  channels: string[];
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  sentAt?: string;
  deliveredAt?: string;
  error?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  userId: string;
  organizationId: string;
  channels: {
    email: boolean;
    slack: boolean;
    teams: boolean;
    push: boolean;
    webhook: boolean;
  };
  types: {
    content_approval: boolean;
    content_rejected: boolean;
    content_published: boolean;
    workflow_escalation: boolean;
    schedule_reminder: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly db: DbService) {}

  async sendNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'status'>): Promise<string> {
    try {
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      
      const fullNotification: Notification = {
        id: notificationId,
        ...notification,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Store notification
      await this.db.createNotification(fullNotification);

      // Process notification through channels
      await this.processNotification(fullNotification);

      this.logger.log(`Sent notification: ${notificationId}`);
      return notificationId;
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
      throw new Error(`Failed to send notification: ${error.message}`);
    }
  }

  async createNotificationChannel(channel: Omit<NotificationChannel, 'id' | 'createdAt'>): Promise<string> {
    try {
      const channelId = `channel_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      
      await this.db.createNotificationChannel({
        id: channelId,
        ...channel,
        createdAt: new Date().toISOString()
      });

      this.logger.log(`Created notification channel: ${channelId}`);
      return channelId;
    } catch (error) {
      this.logger.error(`Failed to create notification channel: ${error.message}`);
      throw new Error(`Failed to create notification channel: ${error.message}`);
    }
  }

  async createNotificationTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt'>): Promise<string> {
    try {
      const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      
      await this.db.createNotificationTemplate({
        id: templateId,
        ...template,
        createdAt: new Date().toISOString()
      });

      this.logger.log(`Created notification template: ${templateId}`);
      return templateId;
    } catch (error) {
      this.logger.error(`Failed to create notification template: ${error.message}`);
      throw new Error(`Failed to create notification template: ${error.message}`);
    }
  }

  async createNotificationRule(rule: Omit<NotificationRule, 'id' | 'createdAt'>): Promise<string> {
    try {
      const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      
      await this.db.createNotificationRule({
        id: ruleId,
        ...rule,
        createdAt: new Date().toISOString()
      });

      this.logger.log(`Created notification rule: ${ruleId}`);
      return ruleId;
    } catch (error) {
      this.logger.error(`Failed to create notification rule: ${error.message}`);
      throw new Error(`Failed to create notification rule: ${error.message}`);
    }
  }

  async triggerNotificationRule(trigger: string, data: Record<string, any>, organizationId: string): Promise<void> {
    try {
      const rules = await this.db.getNotificationRules(organizationId, trigger);
      
      for (const rule of rules) {
        if (await this.evaluateRuleConditions(rule, data)) {
          await this.executeNotificationRule(rule, data);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to trigger notification rules: ${error.message}`);
    }
  }

  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      await this.db.updateNotificationPreferences(preferences);
      this.logger.log(`Updated notification preferences for user ${preferences.userId}`);
    } catch (error) {
      this.logger.error(`Failed to update notification preferences: ${error.message}`);
      throw new Error(`Failed to update notification preferences: ${error.message}`);
    }
  }

  async getNotificationHistory(userId: string, organizationId: string, limit: number = 50): Promise<Notification[]> {
    try {
      return await this.db.getNotificationHistory(userId, organizationId, limit);
    } catch (error) {
      this.logger.error(`Failed to get notification history: ${error.message}`);
      throw new Error(`Failed to get notification history: ${error.message}`);
    }
  }

  async getNotificationAnalytics(organizationId: string, days: number = 30): Promise<{
    totalNotifications: number;
    sentNotifications: number;
    failedNotifications: number;
    deliveryRate: number;
    channelBreakdown: Record<string, number>;
    typeBreakdown: Record<string, number>;
    trends: Array<{
      date: string;
      sent: number;
      failed: number;
      deliveryRate: number;
    }>;
  }> {
    try {
      const notifications = await this.db.getNotificationAnalytics(organizationId, days);
      
      const totalNotifications = notifications.length;
      const sentNotifications = notifications.filter(n => n.status === 'sent' || n.status === 'delivered').length;
      const failedNotifications = notifications.filter(n => n.status === 'failed').length;
      const deliveryRate = totalNotifications > 0 ? (sentNotifications / totalNotifications) * 100 : 0;

      // Channel breakdown
      const channelBreakdown: Record<string, number> = {};
      notifications.forEach(n => {
        n.channels.forEach(channel => {
          channelBreakdown[channel] = (channelBreakdown[channel] || 0) + 1;
        });
      });

      // Type breakdown
      const typeBreakdown: Record<string, number> = {};
      notifications.forEach(n => {
        typeBreakdown[n.type] = (typeBreakdown[n.type] || 0) + 1;
      });

      // Generate trends
      const trends = this.generateNotificationTrends(notifications, days);

      return {
        totalNotifications,
        sentNotifications,
        failedNotifications,
        deliveryRate: Math.round(deliveryRate),
        channelBreakdown,
        typeBreakdown,
        trends
      };
    } catch (error) {
      this.logger.error(`Failed to get notification analytics: ${error.message}`);
      throw new Error(`Failed to get notification analytics: ${error.message}`);
    }
  }

  private async processNotification(notification: Notification): Promise<void> {
    try {
      // Check user preferences
      const preferences = await this.db.getNotificationPreferences(notification.userId, notification.organizationId);
      
      if (preferences && !this.shouldSendNotification(notification, preferences)) {
        await this.db.updateNotificationStatus(notification.id, 'failed', 'User preferences block this notification');
        return;
      }

      // Send through each channel
      for (const channelId of notification.channels) {
        try {
          const channel = await this.db.getNotificationChannel(channelId);
          if (!channel || !channel.enabled) {
            continue;
          }

          await this.sendThroughChannel(channel, notification);
        } catch (error) {
          this.logger.error(`Failed to send through channel ${channelId}: ${error.message}`);
        }
      }

      await this.db.updateNotificationStatus(notification.id, 'sent', null, new Date().toISOString());
    } catch (error) {
      await this.db.updateNotificationStatus(notification.id, 'failed', error.message);
      throw error;
    }
  }

  private async sendThroughChannel(channel: NotificationChannel, notification: Notification): Promise<void> {
    switch (channel.type) {
      case 'email':
        await this.sendEmail(channel.configuration, notification);
        break;
      case 'slack':
        await this.sendSlackMessage(channel.configuration, notification);
        break;
      case 'teams':
        await this.sendTeamsMessage(channel.configuration, notification);
        break;
      case 'webhook':
        await this.sendWebhook(channel.configuration, notification);
        break;
      case 'push':
        await this.sendPushNotification(channel.configuration, notification);
        break;
      default:
        this.logger.warn(`Unknown channel type: ${channel.type}`);
    }
  }

  private async sendEmail(config: any, notification: Notification): Promise<void> {
    // Mock email sending - in real implementation, use SendGrid, AWS SES, etc.
    this.logger.log(`Sending email to ${config.email}: ${notification.title}`);
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendSlackMessage(config: any, notification: Notification): Promise<void> {
    // Mock Slack message - in real implementation, use Slack Web API
    this.logger.log(`Sending Slack message to ${config.channel}: ${notification.title}`);
    
    // Simulate Slack API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendTeamsMessage(config: any, notification: Notification): Promise<void> {
    // Mock Teams message - in real implementation, use Teams Webhook API
    this.logger.log(`Sending Teams message to ${config.webhookUrl}: ${notification.title}`);
    
    // Simulate Teams API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendWebhook(config: any, notification: Notification): Promise<void> {
    // Mock webhook - in real implementation, use HTTP client
    this.logger.log(`Sending webhook to ${config.url}: ${notification.title}`);
    
    // Simulate webhook call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendPushNotification(config: any, notification: Notification): Promise<void> {
    // Mock push notification - in real implementation, use FCM, APNS, etc.
    this.logger.log(`Sending push notification to ${config.deviceToken}: ${notification.title}`);
    
    // Simulate push notification
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private shouldSendNotification(notification: Notification, preferences: NotificationPreferences): boolean {
    // Check if notification type is enabled
    if (!preferences.types[notification.type as keyof typeof preferences.types]) {
      return false;
    }

    // Check quiet hours
    if (preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        timeZone: preferences.quietHours.timezone 
      });
      
      if (this.isInQuietHours(currentTime, preferences.quietHours.start, preferences.quietHours.end)) {
        return false;
      }
    }

    return true;
  }

  private isInQuietHours(currentTime: string, startTime: string, endTime: string): boolean {
    const current = this.timeToMinutes(currentTime);
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    
    if (start <= end) {
      return current >= start && current <= end;
    } else {
      // Quiet hours span midnight
      return current >= start || current <= end;
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private async evaluateRuleConditions(rule: NotificationRule, data: Record<string, any>): Promise<boolean> {
    for (const condition of rule.conditions) {
      const fieldValue = this.getFieldValue(data, condition.field);
      
      if (!this.evaluateCondition(fieldValue, condition.operator, condition.value)) {
        return false;
      }
    }
    
    return true;
  }

  private evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'not_equals':
        return fieldValue !== expectedValue;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(expectedValue).toLowerCase());
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(expectedValue).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(expectedValue);
      case 'less_than':
        return Number(fieldValue) < Number(expectedValue);
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(expectedValue) && !expectedValue.includes(fieldValue);
      default:
        return false;
    }
  }

  private getFieldValue(data: Record<string, any>, field: string): any {
    const fields = field.split('.');
    let value = data;
    
    for (const f of fields) {
      if (value && typeof value === 'object') {
        value = value[f];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private async executeNotificationRule(rule: NotificationRule, data: Record<string, any>): Promise<void> {
    try {
      const template = await this.db.getNotificationTemplate(rule.template);
      if (!template) {
        this.logger.warn(`Template ${rule.template} not found for rule ${rule.id}`);
        return;
      }

      const renderedMessage = this.renderTemplate(template.body, data);
      const renderedSubject = template.subject ? this.renderTemplate(template.subject, data) : undefined;

      await this.sendNotification({
        organizationId: rule.organizationId,
        type: template.type,
        title: renderedSubject || template.name,
        message: renderedMessage,
        data,
        channels: rule.channels
      });
    } catch (error) {
      this.logger.error(`Failed to execute notification rule ${rule.id}: ${error.message}`);
    }
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    let rendered = template;
    
    // Replace variables in template (e.g., {{content.title}}, {{user.name}})
    const variableRegex = /\{\{([^}]+)\}\}/g;
    rendered = rendered.replace(variableRegex, (match, variable) => {
      const value = this.getFieldValue(data, variable.trim());
      return value !== undefined ? String(value) : match;
    });
    
    return rendered;
  }

  private generateNotificationTrends(notifications: Notification[], days: number): Array<{
    date: string;
    sent: number;
    failed: number;
    deliveryRate: number;
  }> {
    const trends = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayNotifications = notifications.filter(n => 
        n.createdAt.startsWith(dateStr)
      );
      
      const sent = dayNotifications.filter(n => n.status === 'sent' || n.status === 'delivered').length;
      const failed = dayNotifications.filter(n => n.status === 'failed').length;
      const deliveryRate = dayNotifications.length > 0 ? (sent / dayNotifications.length) * 100 : 0;
      
      trends.push({
        date: dateStr,
        sent,
        failed,
        deliveryRate: Math.round(deliveryRate)
      });
    }
    
    return trends;
  }
}
