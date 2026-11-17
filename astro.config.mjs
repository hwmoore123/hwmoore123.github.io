import { defineConfig } from 'astro/config';

// Set `site` once you have a domain (e.g. https://woodmoore.com)
export default defineConfig({
  site: 'https://hwmoore123.github.io',
  build: { inlineStylesheets: 'auto' },
  // Old addresses keep working
  redirects: {
    '/setlist': '/projects/',
    '/backstage': '/contact/',
    '/notes': '/writing/',
    '/notes/weighted-palu': '/writing/weighted-palu/',
    '/notes/soundcheck': '/writing/soundcheck/',
  },
});
