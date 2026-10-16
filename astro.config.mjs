// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages test build: SITE_URL=https://karimemiraa.github.io SITE_BASE=/al_amin PUBLIC_DEMO=1
const site = process.env.SITE_URL || 'https://www.igh-hannover.de';
const base = process.env.SITE_BASE || '/';

export default defineConfig({
  site,
  base,
  // Production: pages are rendered on the server (content comes from the admin's database,
  // cached in src/middleware.ts). STATIC_BUILD=1 prerenders everything for GitHub Pages previews.
  output: process.env.STATIC_BUILD ? 'static' : 'server',
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'never',
  devToolbar: { enabled: false },
  // Behind Caddy: trust forwarded host/proto only for our own domain.
  security: { allowedDomains: [{ hostname: 'www.igh-hannover.de', protocol: 'https' }] },
  build: { format: 'preserve' },
  i18n: {
    locales: ['de', 'ar'],
    defaultLocale: 'de',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/danke') && !page.includes('/admin'),
      i18n: { defaultLocale: 'de', locales: { de: 'de-DE', ar: 'ar' } },
    }),
  ],
  image: { responsiveStyles: true },
  vite: { plugins: [tailwindcss()] },
});
