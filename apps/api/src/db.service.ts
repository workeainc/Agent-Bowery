import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { loadEnv } from '../../../packages/config/env';

const env = loadEnv();

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;

  async onModuleInit() {
    this.pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  private ensurePool() {
    if (!this.pool) {
      this.pool = new Pool({
        connectionString: env.DATABASE_URL,
        max: 5,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 2000,
      });
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query(text: string, params?: any[]) {
    this.ensurePool();
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  async upsertSocialAccount(organizationId: string, platform: string, externalId: string, displayName: string) {
    this.ensurePool();
    const client = await this.pool.connect();
    try {
      const id = `sa_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      const sql = `
        INSERT INTO social_accounts (id, organization_id, platform, external_id, display_name, created_at, updated_at)
        VALUES ($1, $2, $3::platform, $4, $5, now(), now())
        ON CONFLICT (organization_id, platform, external_id) 
        DO UPDATE SET display_name = $5, updated_at = now()
        RETURNING id;
      `;
      const { rows } = await client.query(sql, [id, organizationId, platform, externalId, displayName]);
      return rows[0].id as string;
    } finally {
      client.release();
    }
  }

  async insertToken(socialAccountId: string, accessTokenEnc: string, refreshTokenEnc: string | null, expiresAt: Date | null, scopes: string | null = null) {
    this.ensurePool();
    const client = await this.pool.connect();
    try {
      const id = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      const sql = `
        INSERT INTO tokens (id, social_account_id, access_token_enc, refresh_token_enc, expires_at, scopes, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, now());
      `;
      await client.query(sql, [id, socialAccountId, accessTokenEnc, refreshTokenEnc, expiresAt, scopes]);
      return id;
    } finally {
      client.release();
    }
  }

  async getLatestTokenForPlatform(organizationId: string, platform: string) {
    this.ensurePool();
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT t.id, t.access_token_enc, t.refresh_token_enc, t.expires_at, t.scopes, t.created_at,
               sa.platform, sa.external_id, sa.display_name
        FROM tokens t
        JOIN social_accounts sa ON t.social_account_id = sa.id
        WHERE sa.platform = $1::platform AND sa.organization_id = $2
        ORDER BY t.created_at DESC
        LIMIT 1;
      `;
      const { rows } = await client.query(sql, [platform, organizationId]);
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Token audit helpers
  async insertTokenAudit(params: {
    id?: string;
    orgId: string;
    provider: string;
    socialAccountId: string;
    event: string;
    success: boolean;
    reason?: string | null;
    expiresAt?: Date | null;
    scopes?: string | null;
    correlationId?: string | null;
  }) {
    this.ensurePool();
    const client = await this.pool.connect();
    try {
      const id = params.id || `ta_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const sql = `
        INSERT INTO token_audit (id, organization_id, provider, social_account_id, event, success, reason, expires_at, scopes, correlation_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
      `;
      await client.query(sql, [id, params.orgId, params.provider, params.socialAccountId, params.event, params.success, params.reason || null, params.expiresAt || null, params.scopes || null, params.correlationId || null]);
      return id;
    } finally {
      client.release();
    }
  }

  async getTokenAudit(orgId: string, provider: string, opts: { limit?: number } = {}) {
    this.ensurePool();
    const client = await this.pool.connect();
    try {
      const limit = opts.limit || 50;
      const sql = `
        SELECT * FROM token_audit WHERE organization_id = $1 AND provider = $2 ORDER BY created_at DESC LIMIT $3
      `;
      const { rows } = await client.query(sql, [orgId, provider, limit]);
      return rows;
    } finally {
      client.release();
    }
  }

  // Persistent idempotency for exchanges (optional)
  async insertTokenExchange(provider: string, codeHash: string, orgId: string, correlationId?: string) {
    this.ensurePool();
    const client = await this.pool.connect();
    try {
      const id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const sql = `
        INSERT INTO token_exchanges (id, provider, authorization_code_hash, org_id, correlation_id, created_at)
        VALUES ($1, $2, $3, $4, $5, now())
        ON CONFLICT (provider, authorization_code_hash) DO NOTHING
        RETURNING id;
      `;
      const { rows } = await client.query(sql, [id, provider, codeHash, orgId, correlationId || null]);
      return rows[0]?.id || null;
    } finally {
      client.release();
    }
  }

  async createSchedule(
    contentItemId: string,
    platform: string,
    scheduledAt: Date,
    mediaUrls: string[] = [],
    adaptedContent?: any
  ) {
    const client = await this.pool.connect();
    try {
      const id = `sch_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      const sql = `
        INSERT INTO schedules (id, content_item_id, platform, scheduled_at, status, media_urls, adapted_content, created_at, updated_at)
        VALUES ($1, $2, $3::platform, $4, 'pending', $5, $6, now(), now())
        RETURNING id;
      `;
      const { rows } = await client.query(sql, [
        id,
        contentItemId,
        platform,
        scheduledAt,
        mediaUrls,
        adaptedContent ? JSON.stringify(adaptedContent) : null
      ]);
      return rows[0].id as string;
    } finally {
      client.release();
    }
  }

  async getDueSchedules() {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT s.id, s.content_item_id, s.platform, s.scheduled_at, s.status, s.media_urls, s.adapted_content,
               ci.title, ci.type, ci.organization_id
        FROM schedules s
        JOIN content_items ci ON s.content_item_id = ci.id
        WHERE s.status = 'pending' AND s.scheduled_at <= now()
        ORDER BY s.scheduled_at ASC
        LIMIT 50;
      `;
      const { rows } = await client.query(sql);
      return rows;
    } finally {
      client.release();
    }
  }

  async markScheduleQueued(scheduleId: string) {
    const client = await this.pool.connect();
    try {
      const sql = `UPDATE schedules SET status = 'queued', updated_at = now() WHERE id = $1`;
      await client.query(sql, [scheduleId]);
    } finally {
      client.release();
    }
  }

  async updateScheduleStatus(scheduleId: string, status: string, metadata?: {
    providerId?: string;
    errorMessage?: string;
    jobId?: string;
    duration?: number;
    statusCode?: number;
    retryAfter?: number;
  }) {
    const client = await this.pool.connect();
    try {
      const sql = `
        UPDATE schedules 
        SET status = $2, 
            provider_id = $3,
            error_message = $4,
            job_id = $5,
            duration_ms = $6,
            status_code = $7,
            retry_after_seconds = $8,
            updated_at = now()
        WHERE id = $1;
      `;
      await client.query(sql, [
        scheduleId,
        status,
        metadata?.providerId,
        metadata?.errorMessage,
        metadata?.jobId,
        metadata?.duration,
        metadata?.statusCode,
        metadata?.retryAfter
      ]);
    } finally {
      client.release();
    }
  }

  async insertPublishDlq(scheduleId: string | null, platform: string, errorMessage: string, payload: any) {
    const client = await this.pool.connect();
    try {
      const id = `pdlq_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      const sql = `
        INSERT INTO publish_dlq (id, schedule_id, platform, error, payload, created_at)
        VALUES ($1, $2, $3, $4, $5, now())
      `;
      await client.query(sql, [id, scheduleId, platform, errorMessage, JSON.stringify(payload || {})]);
      return id;
    } finally {
      client.release();
    }
  }

  async storeWebhookEvent(
    id: string,
    organizationId: string,
    platform: string,
    eventType: string,
    payload: any,
    headers: any,
    signature: string | null,
    computedIdempotencyKey: string
  ) {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO webhook_events (id, organization_id, platform, event_type, payload, headers, signature, computed_idempotency_key, status, attempts, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', 0, now(), now())
        ON CONFLICT (computed_idempotency_key) DO NOTHING
        RETURNING id;
      `;
      const { rows } = await client.query(sql, [
        id,
        organizationId,
        platform,
        eventType,
        JSON.stringify(payload),
        JSON.stringify(headers),
        signature,
        computedIdempotencyKey
      ]);
      return rows[0]?.id;
    } finally {
      client.release();
    }
  }

  async markWebhookEventProcessed(idemKey: string) {
    const client = await this.pool.connect();
    try {
      const sql = `UPDATE webhook_events SET status = 'processed', updated_at = now() WHERE computed_idempotency_key = $1`;
      await client.query(sql, [idemKey]);
    } finally {
      client.release();
    }
  }

  async moveWebhookToDLQ(id: string, errorMessage: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const selectSql = `SELECT * FROM webhook_events WHERE id = $1 FOR UPDATE`;
      const { rows: eventRows } = await client.query(selectSql, [id]);
      const event = eventRows[0];

      if (event) {
        const dlqId = `dlq_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        const insertDlqSql = `
          INSERT INTO webhook_dlq (id, webhook_event_id, organization_id, platform, event_type, payload, headers, signature, computed_idempotency_key, error_message, failed_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
        `;
        await client.query(insertDlqSql, [
          dlqId,
          event.id,
          event.organization_id,
          event.platform,
          event.event_type,
          event.payload,
          event.headers,
          event.signature,
          event.computed_idempotency_key,
          errorMessage,
        ]);

        const updateEventSql = `UPDATE webhook_events SET status = 'dlq', updated_at = now() WHERE id = $1`;
        await client.query(updateEventSql, [id]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Content Repository Methods
  async createContentItem(
    organizationId: string, 
    title: string, 
    type: string, 
    status: string = 'DRAFT', 
    tags: string[] = [], 
    metadata: Record<string, any> = {},
    authorId: string = 'system'
  ) {
    this.ensurePool();
    const client = await this.pool.connect();
    try {
      const id = `ci_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      const sql = `
        INSERT INTO content_items (id, organization_id, title, type, status, author_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4::content_type, $5, $6, now(), now())
        RETURNING id;
      `;
      const { rows } = await client.query(sql, [id, organizationId, title, type, status, authorId]);
      
      if (rows.length === 0) {
        throw new Error('Failed to create content item');
      }
      
      return rows[0].id as string;
    } catch (error) {
      console.error('Error creating content item:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getContentItem(id: string) {
    this.ensurePool();
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT ci.*, cv.title as version_title, cv.body as version_body, cv.summary, cv.media_urls, cv.metadata
        FROM content_items ci
        LEFT JOIN content_versions cv ON ci.current_version_id = cv.id
        WHERE ci.id = $1;
      `;
      const { rows } = await client.query(sql, [id]);
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getContentItems(
    organizationId: string, 
    status?: string, 
    type?: string, 
    page: number = 1, 
    limit: number = 20
  ) {
    const client = await this.pool.connect();
    try {
      const offset = (page - 1) * limit;
      let sql = `
        SELECT ci.*, cv.title as version_title, cv.body as version_body, cv.summary, cv.media_urls, cv.metadata
        FROM content_items ci
        LEFT JOIN content_versions cv ON ci.current_version_id = cv.id
        WHERE ci.organization_id = $1
      `;
      const params: any[] = [organizationId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        sql += ` AND ci.status = $${paramCount}`;
        params.push(status);
      }

      if (type) {
        paramCount++;
        sql += ` AND ci.type = $${paramCount}::content_type`;
        params.push(type);
      }

      sql += ` ORDER BY ci.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const { rows } = await client.query(sql, params);
      return rows;
    } finally {
      client.release();
    }
  }

  async updateContentItem(id: string, updates: { 
    title?: string; 
    status?: string; 
    adaptedPreviews?: any;
    currentVersionId?: string;
  }) {
    const client = await this.pool.connect();
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (updates.title !== undefined) {
        fields.push(`title = $${paramCount++}`);
        values.push(updates.title);
      }
      if (updates.status !== undefined) {
        fields.push(`status = $${paramCount++}`);
        values.push(updates.status);
      }
      if (updates.adaptedPreviews !== undefined) {
        fields.push(`adapted_previews = $${paramCount++}`);
        values.push(JSON.stringify(updates.adaptedPreviews));
      }
      if (updates.currentVersionId !== undefined) {
        fields.push(`current_version_id = $${paramCount++}`);
        values.push(updates.currentVersionId);
      }

      fields.push(`updated_at = now()`);
      values.push(id);

      const sql = `UPDATE content_items SET ${fields.join(', ')} WHERE id = $${paramCount}`;
      await client.query(sql, values);
      return true;
    } finally {
      client.release();
    }
  }

  async deleteContentItem(id: string) {
    const client = await this.pool.connect();
    try {
      const sql = `DELETE FROM content_items WHERE id = $1`;
      await client.query(sql, [id]);
    } finally {
      client.release();
    }
  }

  async createContentVersion(
    contentItemId: string, 
    body: string, 
    title?: string, 
    summary?: string, 
    mediaUrls: string[] = [], 
    metadata: any = {}
  ) {
    const client = await this.pool.connect();
    try {
      // Get the next version number
      const versionSql = `
        SELECT COALESCE(MAX(version), 0) + 1 as next_version 
        FROM content_versions 
        WHERE content_item_id = $1;
      `;
      const { rows: versionRows } = await client.query(versionSql, [contentItemId]);
      const nextVersion = versionRows[0].next_version;

      const id = `cv_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      const sql = `
        INSERT INTO content_versions (id, content_item_id, version, title, body, summary, media_urls, metadata_json, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
        RETURNING id;
      `;
      const { rows } = await client.query(sql, [
        id,
        contentItemId,
        nextVersion,
        title || null,
        body,
        summary || null,
        mediaUrls,
        JSON.stringify(metadata)
      ]);
      
      if (rows.length === 0) {
        throw new Error('Failed to create content version');
      }
      
      return rows[0].id as string;
    } catch (error) {
      console.error('Error creating content version:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getContentVersions(contentItemId: string) {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT * FROM content_versions 
        WHERE content_item_id = $1 
        ORDER BY created_at DESC;
      `;
      const { rows } = await client.query(sql, [contentItemId]);
      return rows;
    } finally {
      client.release();
    }
  }

  async getRecentContentBodies(organizationId: string, excludeContentItemId?: string, limit: number = 20): Promise<string[]> {
    const client = await this.pool.connect();
    try {
      let sql = `
        SELECT cv.body
        FROM content_versions cv
        JOIN content_items ci ON ci.id = cv.content_item_id
        WHERE ci.organization_id = $1
      `;
      const params: any[] = [organizationId];
      if (excludeContentItemId) {
        sql += ` AND ci.id <> $2`;
        params.push(excludeContentItemId);
      }
      sql += ` ORDER BY cv.created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);
      const { rows } = await client.query(sql, params);
      return rows.map(r => (r.body || '').toString());
    } finally {
      client.release();
    }
  }

  async getCurrentContentVersion(contentItemId: string) {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT cv.* FROM content_versions cv
        JOIN content_items ci ON cv.id = ci.current_version_id
        WHERE ci.id = $1;
      `;
      const { rows } = await client.query(sql, [contentItemId]);
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  async setCurrentContentVersion(contentItemId: string, versionId: string) {
    this.ensurePool();
    const client = await this.pool.connect();
    try {
      const sql = `UPDATE content_items SET current_version_id = $2, updated_at = now() WHERE id = $1`;
      const result = await client.query(sql, [contentItemId, versionId]);
      return (result?.rowCount ?? 0) > 0;
    } finally {
      client.release();
    }
  }

  async approveContent(contentItemId: string, approvedBy: string, notes?: string, adaptedPreviews?: any) {
    const client = await this.pool.connect();
    try {
      const sql = `
        UPDATE content_items 
        SET status = 'APPROVED', 
            approved_by = $2, 
            approved_at = now(),
            approval_notes = $3,
            adapted_previews = $4,
            updated_at = now()
        WHERE id = $1 AND status != 'APPROVED'
        RETURNING *;
      `;
      const { rows } = await client.query(sql, [
        contentItemId, 
        approvedBy, 
        notes || null, 
        adaptedPreviews ? JSON.stringify(adaptedPreviews) : null
      ]);
      return rows.length > 0;
    } finally {
      client.release();
    }
  }

  async getContentSchedules(contentItemId: string) {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT * FROM schedules 
        WHERE content_item_id = $1 
        ORDER BY scheduled_at ASC;
      `;
      const { rows } = await client.query(sql, [contentItemId]);
      return rows;
    } finally {
      client.release();
    }
  }

  async getSocialAccountsByOrganization(organizationId: string) {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT sa.id, sa.organization_id, sa.platform, sa.external_id, sa.display_name, sa.created_at
        FROM social_accounts sa
        WHERE sa.organization_id = $1
        ORDER BY sa.platform, sa.display_name;
      `;
      const { rows } = await client.query(sql, [organizationId]);
      return rows;
    } finally {
      client.release();
    }
  }

  async deleteSocialAccount(organizationId: string, platform: string, externalId: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get social account ID
      const accountSql = `
        SELECT id FROM social_accounts 
        WHERE organization_id = $1 AND platform = $2 AND external_id = $3;
      `;
      const { rows: accountRows } = await client.query(accountSql, [organizationId, platform, externalId]);
      
      if (accountRows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const socialAccountId = accountRows[0].id;

      // Delete tokens
      await client.query('DELETE FROM tokens WHERE social_account_id = $1', [socialAccountId]);

      // Delete social account
      await client.query('DELETE FROM social_accounts WHERE id = $1', [socialAccountId]);

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Additional methods for CMS functionality
  async getContentPreviews(contentItemId: string) {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT adapted_previews 
        FROM content_items 
        WHERE id = $1;
      `;
      const { rows } = await client.query(sql, [contentItemId]);
      return rows[0]?.adapted_previews || {};
    } finally {
      client.release();
    }
  }

  async storeAdaptedPreviews(contentItemId: string, previews: any) {
    const client = await this.pool.connect();
    try {
      const sql = `
        UPDATE content_items 
        SET adapted_previews = $2, updated_at = now()
        WHERE id = $1;
      `;
      await client.query(sql, [contentItemId, JSON.stringify(previews)]);
      return true;
    } finally {
      client.release();
    }
  }

  async getContentItemWithVersions(contentItemId: string) {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT 
          ci.*,
          cv.id as current_version_id,
          cv.title as current_version_title,
          cv.body as current_version_body,
          cv.summary as current_version_summary,
          cv.media_urls as current_version_media_urls,
          cv.metadata_json as current_version_metadata
        FROM content_items ci
        LEFT JOIN content_versions cv ON ci.current_version_id = cv.id
        WHERE ci.id = $1;
      `;
      const { rows } = await client.query(sql, [contentItemId]);
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getContentItemCount(organizationId: string, status?: string, type?: string) {
    const client = await this.pool.connect();
    try {
      let sql = `SELECT COUNT(*) as count FROM content_items WHERE organization_id = $1`;
      const params: any[] = [organizationId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        sql += ` AND status = $${paramCount}`;
        params.push(status);
      }

      if (type) {
        paramCount++;
        sql += ` AND type = $${paramCount}::content_type`;
        params.push(type);
      }

      const { rows } = await client.query(sql, params);
      return parseInt(rows[0].count);
    } finally {
      client.release();
    }
  }

  async getContentItemByIds(contentItemIds: string[]) {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT 
          ci.*,
          cv.title as current_version_title,
          cv.body as current_version_body,
          cv.summary as current_version_summary,
          cv.media_urls as current_version_media_urls
        FROM content_items ci
        LEFT JOIN content_versions cv ON ci.current_version_id = cv.id
        WHERE ci.id = ANY($1);
      `;
      const { rows } = await client.query(sql, [contentItemIds]);
      return rows;
    } finally {
      client.release();
    }
  }

  // Prompt Templates
  async createPromptTemplate(params: {
    name: string;
    version: string;
    channel: string;
    inputSchema?: any;
    template: string;
    outputSchema?: any;
  }) {
    const client = await this.pool.connect();
    try {
      const id = `pt_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      const sql = `
        INSERT INTO prompt_templates (id, name, version, channel, input_schema, template, output_schema, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
        RETURNING id;
      `;
      const { rows } = await client.query(sql, [
        id,
        params.name,
        params.version,
        params.channel,
        JSON.stringify(params.inputSchema || {}),
        params.template,
        JSON.stringify(params.outputSchema || {}),
      ]);
      return rows[0].id as string;
    } finally {
      client.release();
    }
  }

  async updatePromptTemplate(id: string, updates: {
    inputSchema?: any;
    template?: string;
    outputSchema?: any;
  }) {
    const client = await this.pool.connect();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let i = 1;
      if (updates.inputSchema !== undefined) {
        fields.push(`input_schema = $${i++}`);
        values.push(JSON.stringify(updates.inputSchema));
      }
      if (updates.template !== undefined) {
        fields.push(`template = $${i++}`);
        values.push(updates.template);
      }
      if (updates.outputSchema !== undefined) {
        fields.push(`output_schema = $${i++}`);
        values.push(JSON.stringify(updates.outputSchema));
      }
      fields.push(`updated_at = now()`);
      values.push(id);
      const sql = `UPDATE prompt_templates SET ${fields.join(', ')} WHERE id = $${i}`;
      await client.query(sql, values);
      return true;
    } finally {
      client.release();
    }
  }

  async getPromptTemplate(id: string) {
    const client = await this.pool.connect();
    try {
      const sql = `SELECT * FROM prompt_templates WHERE id = $1`;
      const { rows } = await client.query(sql, [id]);
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getLatestPromptTemplateByName(name: string, channel: string) {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT * FROM prompt_templates 
        WHERE name = $1 AND channel = $2
        ORDER BY created_at DESC
        LIMIT 1;
      `;
      const { rows } = await client.query(sql, [name, channel]);
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  async listPromptTemplates(params: { name?: string; channel?: string; limit?: number } = {}) {
    const client = await this.pool.connect();
    try {
      let sql = `SELECT * FROM prompt_templates WHERE 1=1`;
      const values: any[] = [];
      let i = 1;
      if (params.name) { sql += ` AND name = $${i++}`; values.push(params.name); }
      if (params.channel) { sql += ` AND channel = $${i++}`; values.push(params.channel); }
      sql += ` ORDER BY updated_at DESC LIMIT $${i}`; values.push(params.limit || 50);
      const { rows } = await client.query(sql, values);
      return rows;
    } finally {
      client.release();
    }
  }

  async getBrandRules(organizationId: string) {
    const client = await this.pool.connect();
    try {
      const sql = `SELECT * FROM brand_rules WHERE organization_id = $1`;
      const { rows } = await client.query(sql, [organizationId]);
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  async upsertBrandRules(organizationId: string, rules: {
    tone?: any;
    dos?: any[];
    donts?: any[];
    approved_ctas?: any[];
    handles?: Record<string, string>;
    hashtags?: any[];
    restricted_topics?: any[];
  }) {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO brand_rules (organization_id, tone, dos, donts, approved_ctas, handles, hashtags, restricted_topics, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
        ON CONFLICT (organization_id) DO UPDATE SET
          tone = COALESCE(EXCLUDED.tone, brand_rules.tone),
          dos = COALESCE(EXCLUDED.dos, brand_rules.dos),
          donts = COALESCE(EXCLUDED.donts, brand_rules.donts),
          approved_ctas = COALESCE(EXCLUDED.approved_ctas, brand_rules.approved_ctas),
          handles = COALESCE(EXCLUDED.handles, brand_rules.handles),
          hashtags = COALESCE(EXCLUDED.hashtags, brand_rules.hashtags),
          restricted_topics = COALESCE(EXCLUDED.restricted_topics, brand_rules.restricted_topics),
          updated_at = now()
        RETURNING *;
      `;
      const values = [
        organizationId,
        rules.tone ? JSON.stringify(rules.tone) : null,
        rules.dos ? JSON.stringify(rules.dos) : null,
        rules.donts ? JSON.stringify(rules.donts) : null,
        rules.approved_ctas ? JSON.stringify(rules.approved_ctas) : null,
        rules.handles ? JSON.stringify(rules.handles) : null,
        rules.hashtags ? JSON.stringify(rules.hashtags) : null,
        rules.restricted_topics ? JSON.stringify(rules.restricted_topics) : null,
      ];
      const { rows } = await client.query(sql, values);
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getQualityPolicy(organizationId: string, channel: string) {
    const client = await this.pool.connect();
    try {
      const sql = `SELECT * FROM quality_policies WHERE organization_id = $1 AND channel = $2`;
      const { rows } = await client.query(sql, [organizationId, channel]);
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  async upsertQualityPolicy(organizationId: string, channel: string, policy: {
    min_readability?: number | null;
    max_similarity?: number | null;
    min_fact_supported_ratio?: number | null;
    toxicity_blocklist?: string[];
    language?: string | null;
    max_length?: number | null;
  }) {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO quality_policies (organization_id, channel, min_readability, max_similarity, min_fact_supported_ratio, toxicity_blocklist, language, max_length, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
        ON CONFLICT (organization_id, channel) DO UPDATE SET
          min_readability = COALESCE(EXCLUDED.min_readability, quality_policies.min_readability),
          max_similarity = COALESCE(EXCLUDED.max_similarity, quality_policies.max_similarity),
          min_fact_supported_ratio = COALESCE(EXCLUDED.min_fact_supported_ratio, quality_policies.min_fact_supported_ratio),
          toxicity_blocklist = COALESCE(EXCLUDED.toxicity_blocklist, quality_policies.toxicity_blocklist),
          language = COALESCE(EXCLUDED.language, quality_policies.language),
          max_length = COALESCE(EXCLUDED.max_length, quality_policies.max_length),
          updated_at = now()
        RETURNING *;
      `;
      const values = [
        organizationId,
        channel,
        policy.min_readability ?? null,
        policy.max_similarity ?? null,
        policy.min_fact_supported_ratio ?? null,
        policy.toxicity_blocklist ? JSON.stringify(policy.toxicity_blocklist) : null,
        policy.language ?? null,
        policy.max_length ?? null,
      ];
      const { rows } = await client.query(sql, values);
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getAutopostSettings(organizationId: string) {
    const client = await this.pool.connect();
    try {
      const sql = `SELECT * FROM autopost_settings WHERE organization_id = $1`;
      const { rows } = await client.query(sql, [organizationId]);
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  async upsertAutopostSettings(organizationId: string, settings: { autopost_enabled?: boolean; dry_run?: boolean }) {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO autopost_settings (organization_id, autopost_enabled, dry_run, updated_at)
        VALUES ($1, COALESCE($2, false), COALESCE($3, true), now())
        ON CONFLICT (organization_id) DO UPDATE SET
          autopost_enabled = COALESCE(EXCLUDED.autopost_enabled, autopost_settings.autopost_enabled),
          dry_run = COALESCE(EXCLUDED.dry_run, autopost_settings.dry_run),
          updated_at = now()
        RETURNING *;
      `;
      const { rows } = await client.query(sql, [organizationId, settings.autopost_enabled ?? null, settings.dry_run ?? null]);
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getAutoapprovePolicy(organizationId: string) {
    const client = await this.pool.connect();
    try {
      const sql = `SELECT organization_id, enabled, min_confidence FROM autoapprove_policies WHERE organization_id = $1`;
      const { rows } = await client.query(sql, [organizationId]);
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  async upsertAutoapprovePolicy(organizationId: string, body: { enabled?: boolean; min_confidence?: number }) {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO autoapprove_policies (organization_id, enabled, min_confidence, updated_at)
        VALUES ($1, COALESCE($2, false), COALESCE($3, 0.8), now())
        ON CONFLICT (organization_id) DO UPDATE SET
          enabled = COALESCE(EXCLUDED.enabled, autoapprove_policies.enabled),
          min_confidence = COALESCE(EXCLUDED.min_confidence, autoapprove_policies.min_confidence),
          updated_at = now()
        RETURNING organization_id, enabled, min_confidence;
      `;
      const { rows } = await client.query(sql, [organizationId, body.enabled ?? null, body.min_confidence ?? null]);
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getEscalationRules(organizationId: string) {
    const client = await this.pool.connect();
    try {
      const sql = `SELECT * FROM escalation_rules WHERE organization_id = $1`;
      const { rows } = await client.query(sql, [organizationId]);
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  async upsertEscalationRules(organizationId: string, body: {
    vip_accounts?: string[];
    risky_topics?: string[];
    max_toxicity?: number;
    max_similarity?: number;
    min_fact_supported_ratio?: number;
    blocklist?: string[];
    manual_channels?: string[];
  }) {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO escalation_rules (
          organization_id, vip_accounts, risky_topics, max_toxicity, max_similarity, min_fact_supported_ratio, blocklist, manual_channels, updated_at
        ) VALUES (
          $1, COALESCE($2, '{}'), COALESCE($3, '{}'), $4, $5, $6, COALESCE($7, '{}'), COALESCE($8, '{}'), now()
        )
        ON CONFLICT (organization_id) DO UPDATE SET
          vip_accounts = COALESCE(EXCLUDED.vip_accounts, escalation_rules.vip_accounts),
          risky_topics = COALESCE(EXCLUDED.risky_topics, escalation_rules.risky_topics),
          max_toxicity = COALESCE(EXCLUDED.max_toxicity, escalation_rules.max_toxicity),
          max_similarity = COALESCE(EXCLUDED.max_similarity, escalation_rules.max_similarity),
          min_fact_supported_ratio = COALESCE(EXCLUDED.min_fact_supported_ratio, escalation_rules.min_fact_supported_ratio),
          blocklist = COALESCE(EXCLUDED.blocklist, escalation_rules.blocklist),
          manual_channels = COALESCE(EXCLUDED.manual_channels, escalation_rules.manual_channels),
          updated_at = now()
        RETURNING *;
      `;
      const params = [
        organizationId,
        body.vip_accounts ?? null,
        body.risky_topics ?? null,
        body.max_toxicity ?? null,
        body.max_similarity ?? null,
        body.min_fact_supported_ratio ?? null,
        body.blocklist ?? null,
        body.manual_channels ?? null,
      ];
      const { rows } = await client.query(sql, params);
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getSystemFlags() {
    const client = await this.pool.connect();
    try {
      const sql = `SELECT * FROM system_flags WHERE id = 'global'`;
      const { rows } = await client.query(sql);
      return rows[0] || { id: 'global', global_pause: false };
    } finally {
      client.release();
    }
  }

  async updateGlobalPause(paused: boolean) {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO system_flags (id, global_pause, updated_at) VALUES ('global', $1, now())
        ON CONFLICT (id) DO UPDATE SET global_pause = $1, updated_at = now()
        RETURNING *;
      `;
      const { rows } = await client.query(sql, [paused]);
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Post metrics
  async createPostMetrics(data: {
    contentItemId: string;
    platform: string;
    templateVersionId?: string;
    impressions?: number;
    clicks?: number;
    reactions?: number;
    comments?: number;
    shares?: number;
    ctr?: number;
    postedAt: Date;
  }) {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO post_metrics (
          content_item_id, platform, template_version_id, impressions, clicks, reactions, comments, shares, ctr, posted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `;
      const { rows } = await client.query(sql, [
        data.contentItemId,
        data.platform,
        data.templateVersionId || null,
        data.impressions || 0,
        data.clicks || 0,
        data.reactions || 0,
        data.comments || 0,
        data.shares || 0,
        data.ctr || 0.0,
        data.postedAt,
      ]);
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getTemplatePerformance(templateId: string, platform?: string, organizationId?: string, channel?: string) {
    const client = await this.pool.connect();
    try {
      let sql = `
        SELECT * FROM template_performance 
        WHERE template_id = $1
      `;
      const params = [templateId];
      let paramIndex = 2;

      if (platform) {
        sql += ` AND platform = $${paramIndex}`;
        params.push(platform);
        paramIndex++;
      }

      if (organizationId) {
        sql += ` AND organization_id = $${paramIndex}`;
        params.push(organizationId);
        paramIndex++;
      }

      if (channel) {
        sql += ` AND channel = $${paramIndex}`;
        params.push(channel);
        paramIndex++;
      }

      sql += ` ORDER BY performance_score DESC, last_updated DESC`;

      const { rows } = await client.query(sql, params);
      return rows;
    } finally {
      client.release();
    }
  }

  async upsertTemplatePerformance(data: {
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
  }) {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO template_performance (
          template_id, template_version, platform, organization_id, channel,
          total_posts, avg_impressions, avg_clicks, avg_reactions, avg_comments, avg_shares, avg_ctr,
          performance_score, sample_size, last_updated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now())
        ON CONFLICT (template_id, template_version, platform, organization_id, channel) 
        DO UPDATE SET
          total_posts = EXCLUDED.total_posts,
          avg_impressions = EXCLUDED.avg_impressions,
          avg_clicks = EXCLUDED.avg_clicks,
          avg_reactions = EXCLUDED.avg_reactions,
          avg_comments = EXCLUDED.avg_comments,
          avg_shares = EXCLUDED.avg_shares,
          avg_ctr = EXCLUDED.avg_ctr,
          performance_score = EXCLUDED.performance_score,
          sample_size = EXCLUDED.sample_size,
          last_updated = now()
        RETURNING *;
      `;
      const { rows } = await client.query(sql, [
        data.templateId,
        data.templateVersion,
        data.platform,
        data.organizationId || null,
        data.channel || null,
        data.totalPosts,
        data.avgImpressions,
        data.avgClicks,
        data.avgReactions,
        data.avgComments,
        data.avgShares,
        data.avgCtr,
        data.performanceScore,
        data.sampleSize,
      ]);
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  async updateContentItem(contentItemId: string, updates: Partial<any>): Promise<void> {
    const client = await this.pool.connect();
    try {
      const updateFields = Object.keys(updates).map((key, index) => 
        `${key} = $${index + 2}`
      ).join(', ');
      
      const sql = `
        UPDATE content_items 
        SET ${updateFields}
        WHERE id = $1
      `;
      
      const values = [contentItemId, ...Object.values(updates)];
      await client.query(sql, values);
    } finally {
      client.release();
    }
  }

  async getContentItem(contentItemId: string): Promise<any> {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT ci.*, cv.title as version_title, cv.body as version_body, cv.summary, cv.media_urls, cv.metadata
        FROM content_items ci
        LEFT JOIN content_versions cv ON ci.current_version_id = cv.id
        WHERE ci.id = $1
      `;
      const { rows } = await client.query(sql, [contentItemId]);
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getContentPerformanceMetrics(contentItemId: string, days: number = 30): Promise<any[]> {
    // Mock implementation - in real system, this would query performance metrics table
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
      }
    ];
  }

  async storeOptimizationTracking(contentItemId: string, optimizationData: any): Promise<void> {
    // Store optimization tracking data
    // This would typically insert into an optimization_tracking table
    console.log(`Stored optimization tracking for content ${contentItemId}`);
  }

  // Workflow Rules Methods
  async createWorkflowRule(rule: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO workflow_rules (id, name, description, organization_id, conditions, actions, priority, enabled, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;
      await client.query(sql, [
        rule.id,
        rule.name,
        rule.description,
        rule.organizationId,
        JSON.stringify(rule.conditions),
        JSON.stringify(rule.actions),
        rule.priority,
        rule.enabled,
        rule.createdAt,
        rule.updatedAt
      ]);
    } finally {
      client.release();
    }
  }

  async getWorkflowRules(organizationId: string, enabled?: boolean, category?: string): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      let sql = `SELECT * FROM workflow_rules WHERE organization_id = $1`;
      const params: any[] = [organizationId];
      let paramIndex = 2;

      if (enabled !== undefined) {
        sql += ` AND enabled = $${paramIndex}`;
        params.push(enabled);
        paramIndex++;
      }

      if (category) {
        sql += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      sql += ` ORDER BY priority DESC`;
      const { rows } = await client.query(sql, params);
      return rows.map(row => ({
        ...row,
        conditions: JSON.parse(row.conditions || '[]'),
        actions: JSON.parse(row.actions || '[]')
      }));
    } finally {
      client.release();
    }
  }

  async storeWorkflowExecution(execution: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO workflow_executions (id, content_item_id, workflow_id, status, current_step, executed_actions, pending_actions, error, started_at, completed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;
      await client.query(sql, [
        execution.id,
        execution.contentItemId,
        execution.workflowId,
        execution.status,
        execution.currentStep,
        JSON.stringify(execution.executedActions),
        JSON.stringify(execution.pendingActions),
        execution.error,
        execution.startedAt,
        execution.completedAt
      ]);
    } finally {
      client.release();
    }
  }

  async getWorkflowExecutions(workflowId: string, days: number): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT * FROM workflow_executions 
        WHERE workflow_id = $1 AND started_at >= NOW() - INTERVAL '${days} days'
        ORDER BY started_at DESC
      `;
      const { rows } = await client.query(sql, [workflowId]);
      return rows.map(row => ({
        ...row,
        executedActions: JSON.parse(row.executed_actions || '[]'),
        pendingActions: JSON.parse(row.pending_actions || '[]')
      }));
    } finally {
      client.release();
    }
  }

  async createWorkflowTemplate(template: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO workflow_templates (id, name, description, category, rules, is_default, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await client.query(sql, [
        template.id,
        template.name,
        template.description,
        template.category,
        JSON.stringify(template.rules),
        template.isDefault,
        template.createdAt
      ]);
    } finally {
      client.release();
    }
  }

  async getWorkflowTemplate(templateId: string): Promise<any> {
    const client = await this.pool.connect();
    try {
      const sql = `SELECT * FROM workflow_templates WHERE id = $1`;
      const { rows } = await client.query(sql, [templateId]);
      if (rows.length === 0) return null;
      
      const row = rows[0];
      return {
        ...row,
        rules: JSON.parse(row.rules || '[]')
      };
    } finally {
      client.release();
    }
  }

  async getStuckContentItems(organizationId: string, hoursThreshold: number): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT ci.* FROM content_items ci
        WHERE ci.organization_id = $1 
        AND ci.status IN ('DRAFT', 'PENDING_APPROVAL')
        AND ci.updated_at < NOW() - INTERVAL '${hoursThreshold} hours'
        ORDER BY ci.updated_at ASC
      `;
      const { rows } = await client.query(sql, [organizationId]);
      return rows;
    } finally {
      client.release();
    }
  }

  // Notification Methods
  async createNotification(notification: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO notifications (id, organization_id, user_id, type, title, message, data, channels, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;
      await client.query(sql, [
        notification.id,
        notification.organizationId,
        notification.userId,
        notification.type,
        notification.title,
        notification.message,
        JSON.stringify(notification.data),
        JSON.stringify(notification.channels),
        notification.status,
        notification.createdAt
      ]);
    } finally {
      client.release();
    }
  }

  async createNotificationChannel(channel: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO notification_channels (id, type, name, organization_id, configuration, enabled, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await client.query(sql, [
        channel.id,
        channel.type,
        channel.name,
        channel.organizationId,
        JSON.stringify(channel.configuration),
        channel.enabled,
        channel.createdAt
      ]);
    } finally {
      client.release();
    }
  }

  async createNotificationTemplate(template: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO notification_templates (id, name, type, subject, body, variables, organization_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      await client.query(sql, [
        template.id,
        template.name,
        template.type,
        template.subject,
        template.body,
        JSON.stringify(template.variables),
        template.organizationId,
        template.createdAt
      ]);
    } finally {
      client.release();
    }
  }

  async createNotificationRule(rule: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO notification_rules (id, name, organization_id, trigger, conditions, channels, template, enabled, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      await client.query(sql, [
        rule.id,
        rule.name,
        rule.organizationId,
        rule.trigger,
        JSON.stringify(rule.conditions),
        JSON.stringify(rule.channels),
        rule.template,
        rule.enabled,
        rule.createdAt
      ]);
    } finally {
      client.release();
    }
  }

  async getNotificationRules(organizationId: string, trigger: string): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT * FROM notification_rules 
        WHERE organization_id = $1 AND trigger = $2 AND enabled = true
        ORDER BY created_at ASC
      `;
      const { rows } = await client.query(sql, [organizationId, trigger]);
      return rows.map(row => ({
        ...row,
        conditions: JSON.parse(row.conditions || '[]'),
        channels: JSON.parse(row.channels || '[]')
      }));
    } finally {
      client.release();
    }
  }

  async getNotificationChannel(channelId: string): Promise<any> {
    const client = await this.pool.connect();
    try {
      const sql = `SELECT * FROM notification_channels WHERE id = $1`;
      const { rows } = await client.query(sql, [channelId]);
      if (rows.length === 0) return null;
      
      const row = rows[0];
      return {
        ...row,
        configuration: JSON.parse(row.configuration || '{}')
      };
    } finally {
      client.release();
    }
  }

  async getNotificationTemplate(templateId: string): Promise<any> {
    const client = await this.pool.connect();
    try {
      const sql = `SELECT * FROM notification_templates WHERE id = $1`;
      const { rows } = await client.query(sql, [templateId]);
      if (rows.length === 0) return null;
      
      const row = rows[0];
      return {
        ...row,
        variables: JSON.parse(row.variables || '[]')
      };
    } finally {
      client.release();
    }
  }

  async updateNotificationStatus(notificationId: string, status: string, error?: string, sentAt?: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      const sql = `
        UPDATE notifications 
        SET status = $2, error = $3, sent_at = $4
        WHERE id = $1
      `;
      await client.query(sql, [notificationId, status, error, sentAt]);
    } finally {
      client.release();
    }
  }

  async getNotificationPreferences(userId: string, organizationId: string): Promise<any> {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT * FROM notification_preferences 
        WHERE user_id = $1 AND organization_id = $2
      `;
      const { rows } = await client.query(sql, [userId, organizationId]);
      if (rows.length === 0) return null;
      
      const row = rows[0];
      return {
        ...row,
        channels: JSON.parse(row.channels || '{}'),
        types: JSON.parse(row.types || '{}'),
        quietHours: JSON.parse(row.quiet_hours || '{}')
      };
    } finally {
      client.release();
    }
  }

  async updateNotificationPreferences(preferences: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO notification_preferences (user_id, organization_id, channels, types, quiet_hours, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (user_id, organization_id) 
        DO UPDATE SET 
          channels = EXCLUDED.channels,
          types = EXCLUDED.types,
          quiet_hours = EXCLUDED.quiet_hours,
          updated_at = EXCLUDED.updated_at
      `;
      await client.query(sql, [
        preferences.userId,
        preferences.organizationId,
        JSON.stringify(preferences.channels),
        JSON.stringify(preferences.types),
        JSON.stringify(preferences.quietHours)
      ]);
    } finally {
      client.release();
    }
  }

  async getNotificationHistory(userId: string, organizationId: string, limit: number): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT * FROM notifications 
        WHERE user_id = $1 AND organization_id = $2
        ORDER BY created_at DESC
        LIMIT $3
      `;
      const { rows } = await client.query(sql, [userId, organizationId, limit]);
      return rows.map(row => ({
        ...row,
        data: JSON.parse(row.data || '{}'),
        channels: JSON.parse(row.channels || '[]')
      }));
    } finally {
      client.release();
    }
  }

  async getNotificationAnalytics(organizationId: string, days: number): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT * FROM notifications 
        WHERE organization_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'
        ORDER BY created_at DESC
      `;
      const { rows } = await client.query(sql, [organizationId]);
      return rows.map(row => ({
        ...row,
        data: JSON.parse(row.data || '{}'),
        channels: JSON.parse(row.channels || '[]')
      }));
    } finally {
      client.release();
    }
  }

  // Smart Scheduling Methods
  async getPlatformPerformanceData(platform: string, organizationId: string, days: number): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT s.scheduled_at as published_at, s.engagement, s.status
        FROM schedules s
        JOIN content_items ci ON s.content_item_id = ci.id
        WHERE s.platform = $1 AND ci.organization_id = $2
        AND s.scheduled_at >= NOW() - INTERVAL '${days} days'
        AND s.status = 'published'
        ORDER BY s.scheduled_at DESC
      `;
      const { rows } = await client.query(sql, [platform, organizationId]);
      return rows;
    } finally {
      client.release();
    }
  }

  async getAudienceData(organizationId: string, platform: string): Promise<any> {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT COUNT(*) as size, AVG(engagement) as avg_engagement
        FROM schedules s
        JOIN content_items ci ON s.content_item_id = ci.id
        WHERE s.platform = $1 AND ci.organization_id = $2
        AND s.status = 'published'
      `;
      const { rows } = await client.query(sql, [platform, organizationId]);
      return rows[0] || { size: 0, avg_engagement: 0 };
    } finally {
      client.release();
    }
  }

  async getSchedulesInTimeRange(organizationId: string, platform: string, scheduledAt: string, hoursWindow: number): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT s.* FROM schedules s
        JOIN content_items ci ON s.content_item_id = ci.id
        WHERE s.platform = $1 AND ci.organization_id = $2
        AND s.scheduled_at BETWEEN $3 - INTERVAL '${hoursWindow} hours' AND $3 + INTERVAL '${hoursWindow} hours'
        AND s.status IN ('pending', 'queued')
        ORDER BY s.scheduled_at ASC
      `;
      const { rows } = await client.query(sql, [platform, organizationId, scheduledAt]);
      return rows;
    } finally {
      client.release();
    }
  }

  async createRecurringSchedule(schedule: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO recurring_schedules (id, name, organization_id, template, content_template, enabled, next_execution, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      await client.query(sql, [
        schedule.id,
        schedule.name,
        schedule.organizationId,
        JSON.stringify(schedule.template),
        JSON.stringify(schedule.contentTemplate),
        schedule.enabled,
        schedule.nextExecution,
        schedule.createdAt
      ]);
    } finally {
      client.release();
    }
  }

  async getDueRecurringSchedules(): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT * FROM recurring_schedules 
        WHERE enabled = true AND next_execution <= NOW()
        ORDER BY next_execution ASC
      `;
      const { rows } = await client.query(sql);
      return rows.map(row => ({
        ...row,
        template: JSON.parse(row.template || '{}'),
        contentTemplate: JSON.parse(row.content_template || '{}')
      }));
    } finally {
      client.release();
    }
  }

  async updateRecurringSchedule(scheduleId: string, updates: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      const updateFields = Object.keys(updates).map((key, index) => 
        `${key} = $${index + 2}`
      ).join(', ');
      
      const sql = `
        UPDATE recurring_schedules 
        SET ${updateFields}
        WHERE id = $1
      `;
      
      const values = [scheduleId, ...Object.values(updates)];
      await client.query(sql, values);
    } finally {
      client.release();
    }
  }

  async getScheduleAnalytics(platform: string, organizationId: string, days: number): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT s.* FROM schedules s
        JOIN content_items ci ON s.content_item_id = ci.id
        WHERE s.platform = $1 AND ci.organization_id = $2
        AND s.scheduled_at >= NOW() - INTERVAL '${days} days'
        ORDER BY s.scheduled_at DESC
      `;
      const { rows } = await client.query(sql, [platform, organizationId]);
      return rows;
    } finally {
      client.release();
    }
  }

  // Additional helper methods
  async rejectContent(contentItemId: string, rejectedBy: string, reason: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      const sql = `
        UPDATE content_items 
        SET status = 'REJECTED', 
            rejected_by = $2, 
            rejected_at = NOW(),
            rejection_reason = $3,
            updated_at = NOW()
        WHERE id = $1
      `;
      await client.query(sql, [contentItemId, rejectedBy, reason]);
    } finally {
      client.release();
    }
  }

  async escalateContent(contentItemId: string, escalateTo: string, reason: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      const sql = `
        UPDATE content_items 
        SET status = 'ESCALATED', 
            escalated_to = $2, 
            escalated_at = NOW(),
            escalation_reason = $3,
            updated_at = NOW()
        WHERE id = $1
      `;
      await client.query(sql, [contentItemId, escalateTo, reason]);
    } finally {
      client.release();
    }
  }

  async assignContent(contentItemId: string, assignee: string, notes: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      const sql = `
        UPDATE content_items 
        SET assigned_to = $2, 
            assigned_at = NOW(),
            assignment_notes = $3,
            updated_at = NOW()
        WHERE id = $1
      `;
      await client.query(sql, [contentItemId, assignee, notes]);
    } finally {
      client.release();
    }
  }

  async addContentTag(contentItemId: string, tag: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO content_tags (content_item_id, tag, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (content_item_id, tag) DO NOTHING
      `;
      await client.query(sql, [contentItemId, tag]);
    } finally {
      client.release();
    }
  }

  // Batch Generation Methods
  async createBatchGenerationJob(job: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO batch_generation_jobs (id, organization_id, status, total_items, completed_items, failed_items, progress, results, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      `;
      await client.query(sql, [
        job.id,
        job.organizationId,
        job.status,
        job.totalItems,
        job.completedItems,
        job.failedItems,
        job.progress,
        JSON.stringify(job.results),
        JSON.stringify(job.metadata)
      ]);
    } finally {
      client.release();
    }
  }

  async updateBatchGenerationJob(jobId: string, updates: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      const updateFields = Object.keys(updates).map((key, index) => 
        `${key} = $${index + 2}`
      ).join(', ');
      
      const sql = `
        UPDATE batch_generation_jobs 
        SET ${updateFields}
        WHERE id = $1
      `;
      
      const values = [jobId, ...Object.values(updates)];
      await client.query(sql, values);
    } finally {
      client.release();
    }
  }

  async getBatchGenerationJob(jobId: string): Promise<any> {
    const client = await this.pool.connect();
    try {
      const sql = `SELECT * FROM batch_generation_jobs WHERE id = $1`;
      const { rows } = await client.query(sql, [jobId]);
      if (rows.length === 0) return null;
      
      const row = rows[0];
      return {
        ...row,
        results: JSON.parse(row.results || '[]'),
        metadata: JSON.parse(row.metadata || '{}')
      };
    } finally {
      client.release();
    }
  }

  // Pipeline Monitoring Methods
  async createPipelineProgress(progress: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      const sql = `
        INSERT INTO pipeline_progress (pipeline_id, status, current_stage, total_stages, progress, stages, started_at, completed_at, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      `;
      await client.query(sql, [
        progress.pipelineId,
        progress.status,
        progress.currentStage,
        progress.totalStages,
        progress.progress,
        JSON.stringify(progress.stages),
        progress.startedAt,
        progress.completedAt,
        JSON.stringify(progress.metadata || {})
      ]);
    } finally {
      client.release();
    }
  }

  async updatePipelineProgress(pipelineId: string, updates: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      const updateFields = Object.keys(updates).map((key, index) => 
        `${key} = $${index + 2}`
      ).join(', ');
      
      const sql = `
        UPDATE pipeline_progress 
        SET ${updateFields}
        WHERE pipeline_id = $1
      `;
      
      const values = [pipelineId, ...Object.values(updates)];
      await client.query(sql, values);
    } finally {
      client.release();
    }
  }

  async updatePipelineStage(pipelineId: string, stageId: string, updates: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Get current stages
      const getSql = `SELECT stages FROM pipeline_progress WHERE pipeline_id = $1`;
      const { rows } = await client.query(getSql, [pipelineId]);
      
      if (rows.length === 0) return;
      
      const stages = JSON.parse(rows[0].stages || '[]');
      const stageIndex = stages.findIndex((s: any) => s.id === stageId);
      
      if (stageIndex !== -1) {
        stages[stageIndex] = { ...stages[stageIndex], ...updates };
        
        const updateSql = `UPDATE pipeline_progress SET stages = $2 WHERE pipeline_id = $1`;
        await client.query(updateSql, [pipelineId, JSON.stringify(stages)]);
      }
    } finally {
      client.release();
    }
  }

  async getPipelineAnalytics(organizationId: string, timeRange: { start: string; end: string }): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT * FROM pipeline_progress 
        WHERE created_at BETWEEN $1 AND $2
        ORDER BY created_at DESC
      `;
      const { rows } = await client.query(sql, [timeRange.start, timeRange.end]);
      return rows.map(row => ({
        ...row,
        stages: JSON.parse(row.stages || '[]'),
        metadata: JSON.parse(row.metadata || '{}')
      }));
    } finally {
      client.release();
    }
  }

  async rescheduleContent(scheduleId: string, newScheduledAt: string, reason?: string, organizationId?: string) {
    const client = await this.pool.connect();
    try {
      let sql = `
        UPDATE schedules 
        SET scheduled_at = $1, 
            status = 'pending',
            updated_at = NOW(),
            error_message = $2
        WHERE id = $3
      `;
      const params = [newScheduledAt, reason || null, scheduleId];

      if (organizationId) {
        sql += ` AND organization_id = $4`;
        params.push(organizationId);
      }

      sql += ` RETURNING id, scheduled_at, status`;

      const { rows } = await client.query(sql, params);
      if (rows.length === 0) {
        throw new Error('Schedule not found or access denied');
      }
      return rows[0];
    } finally {
      client.release();
    }
  }

  async cancelSchedule(scheduleId: string, reason?: string, organizationId?: string) {
    const client = await this.pool.connect();
    try {
      let sql = `
        UPDATE schedules 
        SET status = 'cancelled',
            updated_at = NOW(),
            error_message = $1
        WHERE id = $2 AND status IN ('pending', 'queued')
      `;
      const params = [reason || 'Cancelled by user', scheduleId];

      if (organizationId) {
        sql += ` AND organization_id = $3`;
        params.push(organizationId);
      }

      sql += ` RETURNING id, status`;

      const { rows } = await client.query(sql, params);
      if (rows.length === 0) {
        throw new Error('Schedule not found, already processed, or access denied');
      }
      return rows[0];
    } finally {
      client.release();
    }
  }

  async searchContentItems(organizationId: string, query: string, filters: any = {}, page: number = 1, limit: number = 20) {
    const client = await this.pool.connect();
    try {
      const offset = (page - 1) * limit;
      let sql = `
        SELECT ci.*, cv.title as version_title, cv.body as version_body, cv.summary, cv.media_urls, cv.metadata
        FROM content_items ci
        LEFT JOIN content_versions cv ON ci.current_version_id = cv.id
        WHERE ci.organization_id = $1
        AND (
          ci.title ILIKE $2 OR 
          cv.body ILIKE $2 OR 
          cv.summary ILIKE $2 OR
          ci.tags::text ILIKE $2
        )
      `;
      const params: any[] = [organizationId, `%${query}%`];
      let paramCount = 2;

      // Apply filters
      if (filters.status) {
        paramCount++;
        sql += ` AND ci.status = $${paramCount}`;
        params.push(filters.status);
      }

      if (filters.type) {
        paramCount++;
        sql += ` AND ci.type = $${paramCount}::content_type`;
        params.push(filters.type);
      }

      if (filters.authorId) {
        paramCount++;
        sql += ` AND ci.author_id = $${paramCount}`;
        params.push(filters.authorId);
      }

      if (filters.dateFrom) {
        paramCount++;
        sql += ` AND ci.created_at >= $${paramCount}`;
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        paramCount++;
        sql += ` AND ci.created_at <= $${paramCount}`;
        params.push(filters.dateTo);
      }

      sql += ` ORDER BY ci.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const { rows } = await client.query(sql, params);
      return rows;
    } finally {
      client.release();
    }
  }

  async createTargetAccount(
    organizationId: string,
    platform: string,
    accountId: string,
    accountName: string,
    accountType: string,
    accountMetadata: any = {}
  ) {
    const client = await this.pool.connect();
    try {
      const id = `ta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const sql = `
        INSERT INTO target_accounts (
          id, organization_id, platform, account_id, account_name, 
          account_type, account_metadata, is_active, last_synced_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *
      `;
      const { rows } = await client.query(sql, [
        id, organizationId, platform, accountId, accountName, 
        accountType, JSON.stringify(accountMetadata), true
      ]);
      return rows[0];
    } finally {
      client.release();
    }
  }

  async getTargetAccounts(organizationId: string, platform?: string) {
    const client = await this.pool.connect();
    try {
      let sql = `
        SELECT * FROM target_accounts 
        WHERE organization_id = $1 AND is_active = true
      `;
      const params: any[] = [organizationId];

      if (platform) {
        sql += ` AND platform = $2`;
        params.push(platform);
      }

      sql += ` ORDER BY account_name ASC`;

      const { rows } = await client.query(sql, params);
      return rows.map(row => ({
        ...row,
        account_metadata: JSON.parse(row.account_metadata || '{}')
      }));
    } finally {
      client.release();
    }
  }

  async updateTargetAccount(id: string, updates: {
    accountName?: string;
    accountType?: string;
    accountMetadata?: any;
    isActive?: boolean;
  }) {
    const client = await this.pool.connect();
    try {
      const setClauses: string[] = [];
      const params: any[] = [];
      let paramCount = 0;

      if (updates.accountName !== undefined) {
        paramCount++;
        setClauses.push(`account_name = $${paramCount}`);
        params.push(updates.accountName);
      }

      if (updates.accountType !== undefined) {
        paramCount++;
        setClauses.push(`account_type = $${paramCount}`);
        params.push(updates.accountType);
      }

      if (updates.accountMetadata !== undefined) {
        paramCount++;
        setClauses.push(`account_metadata = $${paramCount}`);
        params.push(JSON.stringify(updates.accountMetadata));
      }

      if (updates.isActive !== undefined) {
        paramCount++;
        setClauses.push(`is_active = $${paramCount}`);
        params.push(updates.isActive);
      }

      if (setClauses.length === 0) {
        throw new Error('No updates provided');
      }

      paramCount++;
      setClauses.push(`updated_at = NOW()`);
      params.push(id);

      const sql = `
        UPDATE target_accounts 
        SET ${setClauses.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const { rows } = await client.query(sql, params);
      if (rows.length === 0) {
        throw new Error('Target account not found');
      }
      return {
        ...rows[0],
        account_metadata: JSON.parse(rows[0].account_metadata || '{}')
      };
    } finally {
      client.release();
    }
  }

  async updateScheduleTargetAccount(scheduleId: string, targetAccountId: string, organizationId?: string) {
    const client = await this.pool.connect();
    try {
      // First get the target account details
      const accountSql = `SELECT * FROM target_accounts WHERE id = $1 AND is_active = true`;
      const { rows: accountRows } = await client.query(accountSql, [targetAccountId]);
      
      if (accountRows.length === 0) {
        throw new Error('Target account not found or inactive');
      }

      const account = accountRows[0];

      // Update the schedule
      let sql = `
        UPDATE schedules 
        SET target_account_id = $1,
            target_account_name = $2,
            target_account_type = $3,
            target_account_metadata = $4,
            updated_at = NOW()
        WHERE id = $5
      `;
      const params = [
        targetAccountId,
        account.account_name,
        account.account_type,
        account.account_metadata,
        scheduleId
      ];

      if (organizationId) {
        sql += ` AND organization_id = $6`;
        params.push(organizationId);
      }

      sql += ` RETURNING id, target_account_id, target_account_name, target_account_type`;

      const { rows } = await client.query(sql, params);
      if (rows.length === 0) {
        throw new Error('Schedule not found or access denied');
      }
      return rows[0];
    } finally {
      client.release();
    }
  }

  // User management methods
  async createUser(userData: {
    email: string;
    name: string;
    role: 'admin' | 'editor' | 'viewer';
    organizationId: string;
    passwordHash: string;
  }) {
    this.ensurePool();
    const client = await this.pool.connect();
    try {
      const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      const now = new Date();
      
      const query = `
        INSERT INTO users (id, email, display_name, role, organization_id, password_hash, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const result = await client.query(query, [
        id,
        userData.email,
        userData.name,
        userData.role,
        userData.organizationId,
        userData.passwordHash,
        now,
        now,
      ]);
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async findUserByEmail(email: string) {
    this.ensurePool();
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT id, email, display_name as name, role, organization_id, password_hash, created_at, updated_at
        FROM users
        WHERE email = $1
      `;
      
      const result = await client.query(query, [email]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async findUserById(id: string) {
    this.ensurePool();
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT id, email, display_name as name, role, organization_id, password_hash, created_at, updated_at
        FROM users
        WHERE id = $1
      `;
      
      const result = await client.query(query, [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async updateUserPassword(userId: string, passwordHash: string) {
    this.ensurePool();
    const client = await this.pool.connect();
    try {
      const query = `
        UPDATE users
        SET password_hash = $1, updated_at = $2
        WHERE id = $3
      `;
      
      await client.query(query, [passwordHash, new Date(), userId]);
    } finally {
      client.release();
    }
  }
}