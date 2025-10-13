import { Test, TestingModule } from '@nestjs/testing';
import { DbService } from '../src/db.service';

describe('DbService - Content Management', () => {
  let service: DbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DbService],
    }).compile();

    service = module.get<DbService>(DbService);
  });

  describe('createContentItem', () => {
    it('should create a content item with all required fields', async () => {
      const organizationId = 'org_test';
      const title = 'Test Content';
      const type = 'BLOG';
      const status = 'DRAFT';
      const authorId = 'user_test';

      const result = await service.createContentItem(
        organizationId,
        title,
        type,
        status,
        [],
        {},
        authorId
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^ci_/);
    });

    it('should handle missing optional parameters', async () => {
      const organizationId = 'org_test';
      const title = 'Test Content';
      const type = 'SOCIAL_POST';

      const result = await service.createContentItem(
        organizationId,
        title,
        type
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('createContentVersion', () => {
    it('should create a content version with proper version numbering', async () => {
      // First create a content item
      const contentItemId = await service.createContentItem(
        'org_test',
        'Test Content',
        'BLOG'
      );

      const body = 'Test content body';
      const title = 'Test Version Title';
      const summary = 'Test summary';

      const result = await service.createContentVersion(
        contentItemId,
        body,
        title,
        summary,
        ['http://example.com/image.jpg'],
        { test: 'metadata' }
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^cv_/);
    });
  });

  describe('approveContent', () => {
    it('should approve content and return true', async () => {
      // Create content item
      const contentItemId = await service.createContentItem(
        'org_test',
        'Test Content',
        'BLOG'
      );

      // Create version
      await service.createContentVersion(
        contentItemId,
        'Test body',
        'Test title'
      );

      const result = await service.approveContent(
        contentItemId,
        'admin_user',
        'Approved for publishing',
        { facebook: { text: 'adapted text' } }
      );

      expect(result).toBe(true);
    });

    it('should not approve already approved content', async () => {
      // Create and approve content
      const contentItemId = await service.createContentItem(
        'org_test',
        'Test Content',
        'BLOG'
      );

      await service.createContentVersion(contentItemId, 'Test body');
      await service.approveContent(contentItemId, 'admin_user');

      // Try to approve again
      const result = await service.approveContent(
        contentItemId,
        'admin_user2',
        'Second approval'
      );

      expect(result).toBe(false);
    });
  });

  describe('setCurrentContentVersion', () => {
    it('should set current version and return true', async () => {
      // Create content item and versions
      const contentItemId = await service.createContentItem(
        'org_test',
        'Test Content',
        'BLOG'
      );

      const versionId = await service.createContentVersion(
        contentItemId,
        'Test body',
        'Test title'
      );

      const result = await service.setCurrentContentVersion(
        contentItemId,
        versionId
      );

      expect(result).toBe(true);
    });

    it('should return false for non-existent content item', async () => {
      const result = await service.setCurrentContentVersion(
        'non_existent_id',
        'non_existent_version'
      );

      expect(result).toBe(false);
    });
  });

  describe('getContentPreviews', () => {
    it('should return empty object for content without previews', async () => {
      const contentItemId = await service.createContentItem(
        'org_test',
        'Test Content',
        'BLOG'
      );

      const result = await service.getContentPreviews(contentItemId);

      expect(result).toEqual({});
    });

    it('should return stored previews', async () => {
      const contentItemId = await service.createContentItem(
        'org_test',
        'Test Content',
        'BLOG'
      );

      const previews = {
        facebook: { text: 'Facebook adapted text' },
        linkedin: { text: 'LinkedIn adapted text' }
      };

      await service.storeAdaptedPreviews(contentItemId, previews);
      const result = await service.getContentPreviews(contentItemId);

      expect(result).toEqual(previews);
    });
  });
});
