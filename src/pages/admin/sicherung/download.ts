import type { APIRoute } from 'astro';
import fs from 'node:fs';
import { Readable } from 'node:stream';
import { guardArea, guardSudo, currentUser, clientIp } from '../../../admin/util';
import { audit, ownerEmails } from '../../../lib/server/auth';
import { alertOwners } from '../../../lib/server/mail';
import { snapshotToTemp, backupPath, berlinDate } from '../../../lib/server/backup';

export const prerender = false;

/**
 * GET /admin/sicherung/download            -> fresh snapshot (VACUUM INTO a temp file, deleted after sending)
 * GET /admin/sicherung/download?datei=NAME -> one of the nightly backups in BACKUP_DIR (strict name check)
 */
export const GET: APIRoute = (ctx) => {
  const denied = guardArea(ctx, 'backup');
  if (denied) return denied;
  const sudo = guardSudo(ctx);
  if (sudo) return sudo;
  const { user } = currentUser(ctx);

  const requested = ctx.url.searchParams.get('datei');
  let file: string;
  let name: string;
  let temp = false;
  if (requested !== null) {
    const p = backupPath(requested);
    if (!p) return new Response('Not found', { status: 404 });
    file = p;
    name = requested;
  } else {
    file = snapshotToTemp();
    name = `igh-backup-${berlinDate()}.sqlite`;
    temp = true;
  }

  const size = fs.statSync(file).size;
  const stream = fs.createReadStream(file);
  if (temp) stream.on('close', () => fs.rm(file, { force: true }, () => {}));

  audit(user, 'backup.download', name, { file: name, size, ip: clientIp(ctx) }, true);
  void alertOwners(ownerEmails(), 'Backup heruntergeladen', `${user.name} (${user.email}) hat ein Backup der Datenbank heruntergeladen (${name}).`);

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      'Content-Type': 'application/vnd.sqlite3',
      'Content-Length': String(size),
      'Content-Disposition': `attachment; filename="${name}"`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
