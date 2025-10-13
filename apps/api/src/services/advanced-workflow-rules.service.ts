import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../db.service';

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  priority: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  type: 'approve' | 'reject' | 'escalate' | 'notify' | 'schedule' | 'assign' | 'add_tag' | 'change_status';
  parameters: Record<string, any>;
  delay?: number; // seconds
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'content_approval' | 'publishing' | 'quality_check' | 'escalation';
  rules: WorkflowRule[];
  isDefault: boolean;
  createdAt: string;
}

export interface WorkflowExecution {
  id: string;
  contentItemId: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  currentStep: number;
  executedActions: WorkflowAction[];
  pendingActions: WorkflowAction[];
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface WorkflowAnalytics {
  workflowId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  mostCommonFailures: string[];
  performanceTrends: Array<{
    date: string;
    executions: number;
    successRate: number;
    averageTime: number;
  }>;
}

@Injectable()
export class AdvancedWorkflowRulesService {
  private readonly logger = new Logger(AdvancedWorkflowRulesService.name);

  constructor(private readonly db: DbService) {}

  async createWorkflowRule(rule: Omit<WorkflowRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const ruleId = `wf_rule_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      
      await this.db.createWorkflowRule({
        id: ruleId,
        ...rule,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      this.logger.log(`Created workflow rule: ${ruleId}`);
      return ruleId;
    } catch (error) {
      this.logger.error(`Failed to create workflow rule: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error(`Failed to create workflow rule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async executeWorkflowRules(contentItemId: string, organizationId: string): Promise<WorkflowExecution> {
    try {
      const executionId = `wf_exec_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      
      // Get applicable workflow rules
      const rules = await this.getApplicableWorkflowRules(organizationId);
      
      // Get content item data
      const contentItem = await this.db.getContentItem(contentItemId);
      if (!contentItem) {
        throw new Error('Content item not found');
      }

      const execution: WorkflowExecution = {
        id: executionId,
        contentItemId,
        workflowId: 'combined_rules',
        status: 'running',
        currentStep: 0,
        executedActions: [],
        pendingActions: [],
        startedAt: new Date().toISOString()
      };

      // Execute rules in priority order
      const sortedRules = rules.sort((a, b) => b.priority - a.priority);
      
      for (const rule of sortedRules) {
        if (await this.evaluateRuleConditions(rule, contentItem)) {
          this.logger.log(`Rule ${rule.id} conditions met for content ${contentItemId}`);
          
          // Execute rule actions
          for (const action of rule.actions) {
            try {
              await this.executeAction(action, contentItemId, organizationId);
              execution.executedActions.push(action);
              this.logger.log(`Executed action ${action.type} for content ${contentItemId}`);
            } catch (error) {
              this.logger.error(`Failed to execute action ${action.type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              execution.pendingActions.push(action);
            }
          }
        }
      }

      execution.status = execution.pendingActions.length > 0 ? 'failed' : 'completed';
      execution.completedAt = new Date().toISOString();

      // Store execution record
      await this.db.storeWorkflowExecution(execution);

      return execution;
    } catch (error) {
      this.logger.error(`Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error(`Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createWorkflowTemplate(template: Omit<WorkflowTemplate, 'id' | 'createdAt'>): Promise<string> {
    try {
      const templateId = `wf_template_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      
      await this.db.createWorkflowTemplate({
        id: templateId,
        ...template,
        createdAt: new Date().toISOString()
      });

      this.logger.log(`Created workflow template: ${templateId}`);
      return templateId;
    } catch (error) {
      this.logger.error(`Failed to create workflow template: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error(`Failed to create workflow template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async applyWorkflowTemplate(templateId: string, organizationId: string): Promise<string[]> {
    try {
      const template = await this.db.getWorkflowTemplate(templateId);
      if (!template) {
        throw new Error('Workflow template not found');
      }

      const createdRuleIds: string[] = [];

      for (const rule of template.rules) {
        const ruleId = await this.createWorkflowRule({
          ...rule,
          organizationId,
          id: undefined // Will be generated
        });
        createdRuleIds.push(ruleId);
      }

      this.logger.log(`Applied template ${templateId} to organization ${organizationId}, created ${createdRuleIds.length} rules`);
      return createdRuleIds;
    } catch (error) {
      this.logger.error(`Failed to apply workflow template: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error(`Failed to apply workflow template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWorkflowAnalytics(workflowId: string, days: number = 30): Promise<WorkflowAnalytics> {
    try {
      const executions = await this.db.getWorkflowExecutions(workflowId, days);
      
      const totalExecutions = executions.length;
      const successfulExecutions = executions.filter(e => e.status === 'completed').length;
      const failedExecutions = executions.filter(e => e.status === 'failed').length;
      
      const averageExecutionTime = executions.reduce((sum, e) => {
        const start = new Date(e.startedAt).getTime();
        const end = e.completedAt ? new Date(e.completedAt).getTime() : Date.now();
        return sum + (end - start);
      }, 0) / totalExecutions;

      const failureReasons = executions
        .filter(e => e.status === 'failed')
        .map(e => e.error || 'Unknown error')
        .reduce((acc, error) => {
          acc[error] = (acc[error] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      const mostCommonFailures = Object.entries(failureReasons)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([error]) => error);

      // Generate performance trends
      const trends = this.generatePerformanceTrends(executions, days);

      return {
        workflowId,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        averageExecutionTime: Math.round(averageExecutionTime),
        mostCommonFailures,
        performanceTrends: trends
      };
    } catch (error) {
      this.logger.error(`Failed to get workflow analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error(`Failed to get workflow analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async escalateStuckContent(organizationId: string, hoursThreshold: number = 24): Promise<{
    escalatedItems: string[];
    escalationActions: string[];
  }> {
    try {
      const stuckContent = await this.db.getStuckContentItems(organizationId, hoursThreshold);
      const escalatedItems: string[] = [];
      const escalationActions: string[] = [];

      for (const contentItem of stuckContent) {
        // Apply escalation rules
        const escalationRules = await this.getEscalationRules(organizationId);
        
        for (const rule of escalationRules) {
          if (await this.evaluateRuleConditions(rule, contentItem)) {
            for (const action of rule.actions) {
              try {
                await this.executeAction(action, contentItem.id, organizationId);
                escalationActions.push(`${action.type} for content ${contentItem.id}`);
            } catch (error) {
              this.logger.error(`Escalation action failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            }
            escalatedItems.push(contentItem.id);
            break; // Only apply first matching escalation rule
          }
        }
      }

      this.logger.log(`Escalated ${escalatedItems.length} stuck content items`);
      return { escalatedItems, escalationActions };
    } catch (error) {
      this.logger.error(`Escalation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error(`Escalation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getApplicableWorkflowRules(organizationId: string): Promise<WorkflowRule[]> {
    // Get enabled workflow rules for organization
    return await this.db.getWorkflowRules(organizationId, true);
  }

  private async evaluateRuleConditions(rule: WorkflowRule, contentItem: any): Promise<boolean> {
    let result = true;
    let logicalOperator: 'AND' | 'OR' = 'AND';

    for (const condition of rule.conditions) {
      const conditionResult = this.evaluateCondition(condition, contentItem);
      
      if (logicalOperator === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }
      
      logicalOperator = condition.logicalOperator || 'AND';
    }

    return result;
  }

  private evaluateCondition(condition: WorkflowCondition, contentItem: any): boolean {
    const fieldValue = this.getFieldValue(contentItem, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      default:
        return false;
    }
  }

  private getFieldValue(contentItem: any, field: string): any {
    // Support nested field access (e.g., 'metadata.channel', 'status')
    const fields = field.split('.');
    let value = contentItem;
    
    for (const f of fields) {
      if (value && typeof value === 'object') {
        value = value[f];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private async executeAction(action: WorkflowAction, contentItemId: string, organizationId: string): Promise<void> {
    // Add delay if specified
    if (action.delay !== undefined && action.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, action.delay * 1000));
    }

    switch (action.type) {
      case 'approve':
        await this.db.approveContent(contentItemId, 'workflow_rule', action.parameters.notes);
        break;
      case 'reject':
        await this.db.rejectContent(contentItemId, 'workflow_rule', action.parameters.reason);
        break;
      case 'escalate':
        await this.db.escalateContent(contentItemId, action.parameters.escalateTo, action.parameters.reason);
        break;
      case 'notify':
        await this.sendNotification(action.parameters, contentItemId, organizationId);
        break;
      case 'schedule':
        await this.db.createSchedule(
          contentItemId,
          action.parameters.platform,
          new Date(action.parameters.scheduledAt),
          action.parameters.mediaUrls || [],
          action.parameters.adaptedContent
        );
        break;
      case 'assign':
        await this.db.assignContent(contentItemId, action.parameters.assignee, action.parameters.notes);
        break;
      case 'add_tag':
        await this.db.addContentTag(contentItemId, action.parameters.tag);
        break;
      case 'change_status':
        await this.db.updateContentItem(contentItemId, { status: action.parameters.status });
        break;
      default:
        this.logger.warn(`Unknown action type: ${action.type}`);
    }
  }

  private async sendNotification(parameters: any, contentItemId: string, organizationId: string): Promise<void> {
    // This would integrate with the notification service
    this.logger.log(`Sending notification: ${parameters.type} for content ${contentItemId}`);
  }

  private async getEscalationRules(organizationId: string): Promise<WorkflowRule[]> {
    // Get escalation-specific workflow rules
    return await this.db.getWorkflowRules(organizationId, true, 'escalation');
  }

  private generatePerformanceTrends(executions: WorkflowExecution[], days: number): Array<{
    date: string;
    executions: number;
    successRate: number;
    averageTime: number;
  }> {
    const trends = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayExecutions = executions.filter(e => 
        e.startedAt.startsWith(dateStr)
      );
      
      const successfulExecutions = dayExecutions.filter(e => e.status === 'completed');
      const successRate = dayExecutions.length > 0 
        ? (successfulExecutions.length / dayExecutions.length) * 100 
        : 0;
      
      const averageTime = dayExecutions.length > 0
        ? dayExecutions.reduce((sum, e) => {
            const start = new Date(e.startedAt).getTime();
            const end = e.completedAt ? new Date(e.completedAt).getTime() : Date.now();
            return sum + (end - start);
          }, 0) / dayExecutions.length
        : 0;
      
      trends.push({
        date: dateStr,
        executions: dayExecutions.length,
        successRate: Math.round(successRate),
        averageTime: Math.round(averageTime)
      });
    }
    
    return trends;
  }
}
