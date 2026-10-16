/**
 * Human-readable audit log lines. Each action has an i18n key `audit.<action>` with
 * {user} and {target} placeholders (defined in the area's i18n file).
 */
import type { AuditRow } from '../lib/server/auth';
import { adminT, type AdminLang } from './i18n';

export function auditLabel(row: AuditRow, lang: AdminLang) {
  const t = adminT(lang);
  const key = `audit.${row.action}`;
  const vars = { user: row.user_name ?? '—', target: row.target ?? '' };
  const text = t(key, vars);
  return text === key ? `${vars.user}: ${row.action}${row.target ? ` – ${row.target}` : ''}` : text;
}
