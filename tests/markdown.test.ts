import { describe, expect, it } from 'vitest';
import { isSafeUrl, jsonForScript, renderMarkdown, renderMarkdownInline } from '../src/lib/markdown';

describe('safe markdown', () => {
  it('renders normal formatting and safe links', () => {
    const html = renderMarkdown('**Eid** am [Sonntag](/gebetszeiten) – [Karte](https://maps.example.org)');
    expect(html).toContain('<strong>Eid</strong>');
    expect(html).toContain('<a href="/gebetszeiten">');
    expect(html).toContain('href="https://maps.example.org" target="_blank" rel="noopener noreferrer"');
  });

  it('shows raw HTML as text', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)"> <script>alert(1)</script>');
    expect(html).not.toMatch(/<img|<script/i);
    expect(html).toContain('&lt;img');
    expect(renderMarkdownInline('<b onmouseover=alert(1)>x</b>')).not.toContain('<b');
  });

  it('neutralises dangerous link and image URLs', () => {
    for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<script>', 'vbscript:x', '//evil.example']) {
      const html = renderMarkdown(`[x](${bad}) ![y](${bad})`);
      expect(html).not.toMatch(/javascript:|data:|vbscript:|\/\/evil/i);
    }
    expect(isSafeUrl('mailto:info@example.org')).toBe(true);
    expect(isSafeUrl('tel:+49511')).toBe(true);
  });

  it('JSON for script tags cannot close the tag', () => {
    const out = jsonForScript({ title: '</script><script>alert(1)</script>' });
    expect(out).not.toContain('</script');
    expect(JSON.parse(out).title).toBe('</script><script>alert(1)</script>');
  });
});
