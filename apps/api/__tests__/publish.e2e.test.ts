import nock from 'nock';
import { PlatformPublishService } from '../src/platform-publish.service';

// Minimal shapes to satisfy constructor
class MockTokenService {
  private orgId?: string;
  setOrgId(orgId: string) { this.orgId = orgId; }
  async getValidAccessToken() { return { accessToken: 'test_access', dummy: false }; }
}

class MockDbService {
  async getContentItem(_: string) {
    return { id: 'ci_1', title: 'Hello', type: 'SOCIAL', organization_id: 'org_1' };
  }
  async getCurrentContentVersion(_: string) {
    return { body: 'Test body', metadata: {} };
  }
  async getContentSchedules(_: string): Promise<any[]> { return []; }
}

class MockMetaClientService {
  async getUserPages(_: string) {
    return [{ id: 'page_1', name: 'Page', accessToken: 'page_token', category: 'Business' }];
  }
  async publishFacebookPost(_: string, __: string, payload: any) {
    return { success: true, postId: 'fb_123', platform: 'facebook' };
  }
}

class MockLinkedInClientService {}
class MockMediaProcessingService {}

describe('PlatformPublishService - integration behaviors', () => {
  it('happy path: publishes successfully to Facebook', async () => {
    const svc = new PlatformPublishService(
      new MockTokenService() as any,
      new MockDbService() as any,
      new MockMetaClientService() as any,
      new MockLinkedInClientService() as any,
      new MockMediaProcessingService() as any
    );

    const result = await svc.publishToPlatform({
      contentItemId: 'ci_1',
      platform: 'FACEBOOK',
      scheduledAt: new Date().toISOString(),
      scheduleId: 'sch_1',
      organizationId: 'org_1'
    });

    expect(result.success).toBe(true);
    expect(result.providerId).toBe('fb_123');
  });

  it('rate limit: returns retryAfter from 429', async () => {
    // Create a service with a meta client that simulates 429
    class RateLimitedMetaClient extends MockMetaClientService {
      async publishFacebookPost(): Promise<any> {
        const err: any = new Error('Rate limited');
        (err.isAxiosError = true);
        err.response = { status: 429, headers: { 'retry-after': '7' }, data: {} };
        throw err;
      }
    }

    const svc = new PlatformPublishService(
      new MockTokenService() as any,
      new MockDbService() as any,
      new RateLimitedMetaClient() as any,
      new MockLinkedInClientService() as any,
      new MockMediaProcessingService() as any
    );

    const result = await svc.publishToPlatform({
      contentItemId: 'ci_1',
      platform: 'FACEBOOK',
      scheduledAt: new Date().toISOString()
    });

    expect(result.success).toBe(false);
    expect(result.retryAfter).toBe(7);
  });

  it('idempotency: skips when schedule already published', async () => {
    class DbWithPublished extends MockDbService {
      async getContentSchedules(_: string): Promise<any[]> {
        return [{ id: 'sch_2', status: 'published', provider_id: 'already_1' }];
      }
    }
    const svc = new PlatformPublishService(
      new MockTokenService() as any,
      new DbWithPublished() as any,
      new MockMetaClientService() as any,
      new MockLinkedInClientService() as any,
      new MockMediaProcessingService() as any
    );

    const result = await svc.publishToPlatform({
      contentItemId: 'ci_1',
      platform: 'FACEBOOK',
      scheduledAt: new Date().toISOString(),
      scheduleId: 'sch_2'
    });
    expect(result.success).toBe(true);
    expect(result.providerId).toBe('already_1');
  });
});

describe('MetaClientService HTTP - nock', () => {
  afterEach(() => nock.cleanAll());

  it('getUserPages returns mapped pages from Graph API', async () => {
    const { MetaClientService } = await import('../src/platforms/meta/meta-client.service');
    const service = new MetaClientService();

    nock('https://graph.facebook.com')
      .get(/\/v18\.0\/me\/accounts/)
      .query(true)
      .reply(200, {
        data: [{ id: '1', name: 'Test', access_token: 'ptok', category: 'Bus' }]
      });

    const pages = await service.getUserPages('access');
    expect(pages[0]).toEqual({ id: '1', name: 'Test', accessToken: 'ptok', category: 'Bus' });
  });
});


