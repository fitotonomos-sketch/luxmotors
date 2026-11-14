
// @ts-check

import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sourceInfoIntegration from './src/plugins/source-info-integration.mjs';
import sitemap from '@astrojs/sitemap';

const enableSourceInfo = process.env.BUILD_DEV === 'true';

const siteUrl =
  process.env.PUBLIC_SITE_URL || 'https://luxmotors.onrender.com';

const excludedPaths = [
  '/cart',
  '/checkout',
  '/payment',
  '/auth/callback',
  '/auth/reset-password',
  '/robots.txt',
];

export default defineConfig({
  site: siteUrl,
  trailingSlash: 'never',

  integrations: [
    react(),

    sourceInfoIntegration({
      enabled: enableSourceInfo,
      hideToolbar: true,
    }),

    sitemap({
      lastmod: new Date(),
      filter: (page) => {
        const pathname =
          new URL(page).pathname.replace(/\/$/, '') || '/';

        return (
          !excludedPaths.includes(pathname) &&
          !pathname.startsWith('/modiriyatfrosh')
        );
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  devToolbar: {
    enabled: !enableSourceInfo,
  },
});
