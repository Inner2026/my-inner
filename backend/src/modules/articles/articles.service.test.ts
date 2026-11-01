jest.mock('../../models/Article', () => ({ Article: { findOne: jest.fn(), create: jest.fn(), findById: jest.fn(), find: jest.fn(), findByIdAndDelete: jest.fn() } }));
jest.mock('../../models/Test', () => ({ Test: { exists: jest.fn() } }));

import { Article } from '../../models/Article';
import { Test } from '../../models/Test';
import { createArticle, updateArticle } from './articles.service';

const mocked = Article as unknown as Record<string, jest.Mock>;
const lean = (value: unknown) => ({ select: () => ({ lean: async () => value }), lean: async () => value });
const base = { title: 'What Is My Love Language?', excerpt: 'e'.repeat(60), content: 'c'.repeat(300), coverImageUrl: '', coverImageAlt: '', relatedTestSlug: '' };

beforeEach(() => jest.resetAllMocks());

describe('createArticle', () => {
  it('derives the slug from the title and stamps publishedAt when published', async () => {
    mocked.findOne.mockReturnValue(lean(null));
    mocked.create.mockImplementation(async (doc) => ({ toObject: () => doc }));
    const article = await createArticle({ ...base, status: 'published' } as any);
    expect(article.slug).toBe('what-is-my-love-language');
    expect(article.publishedAt).toBeInstanceOf(Date);
  });

  it('keeps drafts unpublished', async () => {
    mocked.findOne.mockReturnValue(lean(null));
    mocked.create.mockImplementation(async (doc) => ({ toObject: () => doc }));
    const article = await createArticle({ ...base, status: 'draft' } as any);
    expect(article.publishedAt).toBeNull();
  });

  it('rejects a slug that is already used', async () => {
    mocked.findOne.mockReturnValue(lean({ _id: 'other' }));
    await expect(createArticle({ ...base, status: 'draft' } as any)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects an unknown related test', async () => {
    mocked.findOne.mockReturnValue(lean(null));
    (Test.exists as jest.Mock).mockResolvedValue(null);
    await expect(createArticle({ ...base, relatedTestSlug: 'nope', status: 'draft' } as any)).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('updateArticle', () => {
  const id = '64b7f0c2a1b2c3d4e5f60718';

  it('keeps the original publish date when a published article is edited', async () => {
    const original = new Date('2026-01-01');
    const doc: any = { slug: 'a', status: 'published', publishedAt: original, save: jest.fn(), toObject() { return { ...this }; } };
    mocked.findById.mockResolvedValue(doc);
    const { article, wasPublished } = await updateArticle(id, { title: 'New title here' });
    expect(wasPublished).toBe(true);
    expect(article.publishedAt).toBe(original);
    expect(article.title).toBe('New title here');
  });

  it('stamps publishedAt the first time a draft is published', async () => {
    const doc: any = { slug: 'a', status: 'draft', publishedAt: null, save: jest.fn(), toObject() { return { ...this }; } };
    mocked.findById.mockResolvedValue(doc);
    const { article, wasPublished } = await updateArticle(id, { status: 'published' });
    expect(wasPublished).toBe(false);
    expect(article.publishedAt).toBeInstanceOf(Date);
  });

  it('returns 404 for an invalid id', async () => {
    mocked.findById.mockResolvedValue(null);
    await expect(updateArticle('not-an-id', { title: 'Something' })).rejects.toMatchObject({ statusCode: 404 });
  });
});
