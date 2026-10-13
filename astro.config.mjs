// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://www.igh-hannover.de',
  // Pages are prerendered (static HTML); only /api/* routes run on the server.
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'never',
  devToolbar: { enabled: false },
  // Behind Caddy: trust forwarded host/proto only for our own domain.
  security: { allowedDomains: [{ hostname: 'www.igh-hannover.de', protocol: 'https' }] },
  build: { format: 'file' },
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
