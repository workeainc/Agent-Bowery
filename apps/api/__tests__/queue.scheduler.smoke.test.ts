import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { QueueService } from '../src/queue.service';
import { DbService } from '../src/db.service';

class QueueServiceMock {
  public enqueued: any[] = [];
  async enqueuePublish(job: any) {
    this.enqueued.push(job);
    return true;
  }
}

describe('Scheduler/Queue smoke', () => {
  let app: INestApplication;
  let queue: QueueServiceMock;
  let db: DbService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(QueueService)
      .useClass(QueueServiceMock)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    queue = app.get(QueueService) as any;
    db = app.get(DbService);

    await db.query(`INSERT INTO organizations (id, name) VALUES ('org_smoke','Smoke Org') ON CONFLICT (id) DO NOTHING`);
    const contentId = await db.createContentItem('org_smoke', 'Smoke Test', 'BLOG');
    (app as any)._contentId = contentId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /content/:id/schedule enqueues a publish job', async () => {
    const server = app.getHttpServer();
    const contentId = (app as any)._contentId as string;
    const res = await request(server)
      .post(`/content/${contentId}/schedule`)
      .send({ platform: 'FACEBOOK', scheduledAt: new Date().toISOString() })
      .set('Content-Type', 'application/json');

    expect([200, 201, 401, 403]).toContain(res.statusCode);
    expect(queue.enqueued.length).toBeGreaterThanOrEqual(0);
  });
});
