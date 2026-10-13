import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const announcements = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/announcements' }),
  schema: z.object({
    date: z.coerce.date(),
    category: z.enum(['news', 'campaign', 'event', 'ramadan']).default('news'),
    eventDate: z.string().optional(),
    title_de: z.string(),
    title_ar: z.string().optional(),
    text_de: z.string(),
    text_ar: z.string().optional(),
    image: z.string().optional(),
    pinned: z.boolean().default(false),
    published: z.boolean().default(true),
  }),
});

const program = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/program' }),
  schema: z.object({
    weekday: z.number().int().min(0).max(6),
    after: z.enum(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'time']),
    time: z.string().optional(),
    title_de: z.string(),
    title_ar: z.string(),
    desc_de: z.string().optional(),
    desc_ar: z.string().optional(),
    language: z.enum(['de', 'ar', 'de-ar']),
    audience: z.enum(['all', 'men', 'women', 'kids', 'youth']).default('all'),
    teacher: z.string().optional(),
    active: z.boolean().default(true),
  }),
});

const videos = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/videos' }),
  schema: z.object({
    youtubeId: z.string(),
    date: z.coerce.date(),
    title_de: z.string(),
    title_ar: z.string().optional(),
    series: z.enum(['khutbah', 'sirah', 'aqidah', 'tazkiyah', 'quran', 'campaign', 'other']).default('other'),
    language: z.enum(['de', 'ar', 'de-ar']),
    speaker: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { announcements, program, videos };
