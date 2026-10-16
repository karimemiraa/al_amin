import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { UPLOAD_DIR } from '../../lib/server/db';

export const prerender = false;

const TYPES: Record<string, string> = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

/** Serves images uploaded in the admin (path traversal is rejected). */
export const GET: APIRoute = ({ params }) => {
  const file = path.resolve(UPLOAD_DIR, params.path ?? '');
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type || !file.startsWith(UPLOAD_DIR + path.sep) || !fs.existsSync(file)) return new Response('Not found', { status: 404 });
  return new Response(fs.readFileSync(file), {
    headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
  });
};
