import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '../db.service';
import { logJson } from '../utils/logger';

export type TokenAuditEvent =
  | 'acquire'
  | 'refresh'
  | 'failure'
  | 'proactive_refresh'
  | 'reactive_refresh'
  | 'refresh_attempt'
  | 'refresh_success'
  | 'refresh_failure'
  | 'select_page';

export interface TokenAuditRecord {
  orgId: string;
  provider: string;
  socialAccountId: string;
  success: boolean;
  reason?: string;
  correlationId?: string;
  expiresAt?: Date | null;
  scopes?: string | null;
}

@Injectable()
export class TokenAuditService {
  private readonly logger = new Logger(TokenAuditService.name);

  constructor(private readonly db: DbService) {}

  async record(event: TokenAuditEvent, data: TokenAuditRecord): Promise<void> {
    try {
      const id = `ta_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const sql = `
        INSERT INTO token_audit
          (id, organization_id, provider, social_account_id, event, success, reason, expires_at, scopes, correlation_id, created_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
      `;
      await this.db.query(sql, [
        id,
        data.orgId,
        data.provider,
        data.socialAccountId,
        event,
        data.success,
        data.reason || null,
        data.expiresAt || null,
        data.scopes || null,
        data.correlationId || null,
      ]);
      logJson(this.logger, 'log', 'token_audit_record', { event, orgId: data.orgId, provider: data.provider, socialAccountId: data.socialAccountId, success: data.success });
    } catch (error) {
      logJson(this.logger, 'error', 'token_audit_record_failed', { error: (error as Error).message });
    }
  }
}


