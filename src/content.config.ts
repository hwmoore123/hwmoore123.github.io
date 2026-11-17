import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Writing: drop a Markdown file in src/content/notes/ and it becomes a post at /writing/<file>/.
const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    track: z.number(),
    kind: z.enum(['paper', 'research log', 'markets', 'running', 'notes']),
    blurb: z.string(),
    external: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { notes };
