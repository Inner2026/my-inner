import { z } from 'zod';

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Turns a title into a URL slug: "What Is My Love Language?" -> "what-is-my-love-language". */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === '' || (value.startsWith('/') && !value.startsWith('//')) || /^https?:\/\//i.test(value), 'Image URL must be a web link or an uploaded image.');

export const articleInputSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters.').max(120, 'Title must be 120 characters or fewer.'),
  slug: z.string().trim().toLowerCase().max(80).regex(SLUG_PATTERN, 'URL may only contain lowercase letters, numbers and single hyphens.').optional().or(z.literal('')),
  excerpt: z.string().trim().min(50, 'Summary must be at least 50 characters so Google has a useful description.').max(170, 'Summary must be 170 characters or fewer (Google cuts longer descriptions).'),
  content: z.string().trim().min(300, 'Article body must be at least 300 characters.').max(100_000),
  coverImageUrl: imageUrl.optional().default(''),
  coverImageAlt: z.string().trim().max(160).optional().default(''),
  relatedTestSlug: z.string().trim().toLowerCase().max(80).optional().default(''),
  status: z.enum(['draft', 'published']).optional().default('draft')
});

export const articlePatchSchema = articleInputSchema.partial();

export type ArticleInput = z.infer<typeof articleInputSchema>;
export type ArticlePatch = z.infer<typeof articlePatchSchema>;

/** Collects zod issues into a single readable message for the admin UI. */
export function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(' ');
}
