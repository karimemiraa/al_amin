/**
 * Admin UI translations (German / Arabic). Each area keeps its strings in its own file;
 * all are merged here. Missing Arabic strings fall back to German.
 */
import core from './core';
import content from './content';
import settings from './settings';
import people from './people';

export type AdminLang = 'de' | 'ar';
type Dict = { de: Record<string, string>; ar: Record<string, string> };

const all: Dict[] = [core, content, settings, people];
const de: Record<string, string> = Object.assign({}, ...all.map((d) => d.de));
const ar: Record<string, string> = Object.assign({}, ...all.map((d) => d.ar));

export function adminT(lang: AdminLang) {
  return (key: string, vars?: Record<string, string | number>) => {
    let s = (lang === 'ar' ? ar[key] : undefined) ?? de[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
}
export type T = ReturnType<typeof adminT>;
