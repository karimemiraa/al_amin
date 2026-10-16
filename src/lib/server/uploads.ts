/**
 * Image uploads from the admin: validated, re-encoded (strips EXIF/GPS metadata),
 * resized and stored in DATA_DIR/uploads. Served by src/pages/uploads/[...path].ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { UPLOAD_DIR } from './db';

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export class UploadError extends Error {}

export async function saveImage(file: File, maxWidth = 1600): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new UploadError('type');
  if (file.size > MAX_BYTES) throw new UploadError('size');
  const input = Buffer.from(await file.arrayBuffer());
  const output = await sharp(input, { failOn: 'error' }).rotate().resize({ width: maxWidth, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  const now = new Date();
  const dir = path.join(UPLOAD_DIR, String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'));
  fs.mkdirSync(dir, { recursive: true });
  const name = `${crypto.randomBytes(8).toString('hex')}.webp`;
  fs.writeFileSync(path.join(dir, name), output);
  return `/uploads/${path.relative(UPLOAD_DIR, path.join(dir, name)).split(path.sep).join('/')}`;
}

/** Deletes an uploaded file referenced by its public path (ignores anything outside UPLOAD_DIR). */
export function deleteImage(publicPath: string | undefined) {
  if (!publicPath?.startsWith('/uploads/')) return;
  const file = path.resolve(UPLOAD_DIR, publicPath.slice('/uploads/'.length));
  if (file.startsWith(UPLOAD_DIR + path.sep) && fs.existsSync(file)) fs.unlinkSync(file);
}
