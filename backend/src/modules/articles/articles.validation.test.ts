import { articleInputSchema, slugify } from './articles.validation';

const validInput = {
  title: 'What Is My Love Language?',
  excerpt: 'Learn the five love languages, how to recognise yours, and why it matters in relationships.',
  content: 'x'.repeat(300)
};

describe('slugify', () => {
  it('creates clean URL slugs from titles', () => {
    expect(slugify('What Is My Love Language?')).toBe('what-is-my-love-language');
    expect(slugify("  INFJ vs INFP: What's the Difference  ")).toBe('infj-vs-infp-whats-the-difference');
    expect(slugify('Café & Self-Reflection')).toBe('cafe-self-reflection');
  });

  it('returns an empty string when the title has no Latin characters', () => {
    expect(slugify('ما هي لغة الحب')).toBe('');
  });
});

describe('articleInputSchema', () => {
  it('accepts a valid article and defaults to draft', () => {
    const result = articleInputSchema.parse(validInput);
    expect(result.status).toBe('draft');
    expect(result.coverImageUrl).toBe('');
  });

  it('rejects a summary that is too long for Google', () => {
    expect(articleInputSchema.safeParse({ ...validInput, excerpt: 'a'.repeat(171) }).success).toBe(false);
  });

  it('rejects invalid slugs and unsafe image URLs', () => {
    expect(articleInputSchema.safeParse({ ...validInput, slug: 'Bad Slug!' }).success).toBe(false);
    expect(articleInputSchema.safeParse({ ...validInput, coverImageUrl: 'javascript:alert(1)' }).success).toBe(false);
    expect(articleInputSchema.safeParse({ ...validInput, coverImageUrl: 'data:image/png;base64,AAAA' }).success).toBe(false);
  });

  it('accepts uploaded and web cover images (local uploads use http in development)', () => {
    expect(articleInputSchema.safeParse({ ...validInput, coverImageUrl: 'http://localhost:4000/api/uploads/a.png' }).success).toBe(true);
    expect(articleInputSchema.safeParse({ ...validInput, coverImageUrl: '/api/uploads/a.png' }).success).toBe(true);
    expect(articleInputSchema.safeParse({ ...validInput, coverImageUrl: 'https://res.cloudinary.com/x/a.png' }).success).toBe(true);
  });
});
