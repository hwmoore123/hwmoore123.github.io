import { defineConfig } from 'astro/config';

// Set `site` once you have a domain (e.g. https://woodmoore.com)
export default defineConfig({
  site: 'https://hwmoore123.github.io',
  build: { inlineStylesheets: 'auto' },
  // Old addresses keep working
  redirects: {
    '/setlist': '/projects/',
    '/backstage': '/contact/',
    '/notes': '/publications/',
    '/notes/weighted-palu': '/publications/weighted-palu/',
    '/notes/soundcheck': '/publications/soundcheck/',
    '/writing': '/publications/',
    '/writing/weighted-palu': '/publications/weighted-palu/',
    '/writing/soundcheck': '/publications/soundcheck/',
  },
});
