/**
 * Safe Markdown for editor-written text (announcements). Used on the public site and in the
 * admin preview. Raw HTML is shown as text, and links/images may only point to http(s),
 * mailto:, tel: or site-relative URLs – so an editor account can never inject script.
 */
import { Marked } from 'marked';

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function isSafeUrl(href: string) {
  const url = href.trim();
  if (/^\/(?!\/)/.test(url) || url.startsWith('#')) return true; // site-relative, not protocol-relative
  return /^(https?:\/\/|mailto:|tel:)/i.test(url);
}

const md = new Marked({
  gfm: true,
  breaks: true,
  async: false,
  renderer: {
    html: ({ text }) => escapeHtml(text),
  },
  walkTokens(token) {
    if ((token.type === 'link' || token.type === 'image') && !isSafeUrl(token.href)) token.href = '#';
  },
  hooks: {
    // Open external links in a new tab without giving the target access to window.opener.
    postprocess: (html) => html.replace(/<a href="(https?:\/\/[^"]*)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer"'),
  },
});

export const renderMarkdown = (text: string) => md.parse(text ?? '') as string;
export const renderMarkdownInline = (text: string) => md.parseInline(text ?? '') as string;

/** JSON for <script type="application/json|ld+json"> blocks: "<" can never close the tag. */
export const jsonForScript = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');
