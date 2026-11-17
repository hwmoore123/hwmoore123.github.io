# Wood Moore — Computer Science, Economics, and Math Student @ MIT

A 1967 concert poster melting over a 1976 garage workbench. Astro static site, hand-written effects, ~4 KB of JS (gzipped).

## Run it

    npm install
    npm run dev       # http://localhost:4321
    npm run build     # static output in dist/ (deploy to Netlify / Vercel / GitHub Pages)

## Where things live

| What | File |
|---|---|
| Palette, type, materials (wood, paper, CRT, halftone) | `src/styles/global.css` |
| Shell: nav, footer, warp filter, tie-dye layer | `src/layouts/Base.astro` |
| Effects intensity (always Full trip; OS reduced-motion → Sober) | `src/scripts/dial.ts`, `src/scripts/dose.ts`, head script in `Base.astro` |
| Liquid light WebGL shader (+ fallbacks, fps guard) | `src/components/LiquidLight.astro`, `src/scripts/liquid.ts` |
| Project posters + kaleidoscope hover | `src/components/Poster.astro` |
| Terminal boot | `src/components/Terminal.astro` |
| Pages | `src/pages/` (index, about, setlist, notes, backstage, 404) |
| Writing (Markdown posts) | `src/content/notes/*.md` |

## Add a liner note

Drop a Markdown file in `src/content/notes/` with `title`, `date`, `track`, `kind`, `blurb` frontmatter.

## Still to fill in

- [ ] GitHub + LinkedIn URLs: top of `src/pages/contact.astro`
- [ ] Résumé PDF at `public/wood-moore-resume.pdf`
- [ ] Posterized self-portrait: replace the placeholder SVG in `src/pages/about.astro`
- [ ] Domain: set `site` in `astro.config.mjs`
