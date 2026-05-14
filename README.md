# Tarun Mundhra - Portfolio

A sleek, production-ready portfolio built with Next.js and a teal-green glassmorphism aesthetic. Includes static export for Netlify, live project demos, and a recruiter-friendly layout.

## Highlights

- Static export ready (Netlify friendly)
- Glassmorphism cards and floating navbar
- Fast, single-page navigation with smooth transitions
- Project links with live demos and repos
- Resume download and profile photo support

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Framer Motion

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Build and Export

```bash
npm run build
```

This generates a static export in the `out/` directory.

## Deploy to Netlify

1. Push this repo to GitHub.
2. In Netlify, add a new site from Git.
3. Set:
   - Build command: `npm run build`
   - Publish directory: `out`
4. Deploy.

The Netlify configuration is already included in `netlify.toml`.

## Project Structure

```
src/
  app/
  components/
  hooks/
  lib/
  store/
public/
```

## Assets

- Profile photo: `public/Tarun.jpeg`
- Resume PDF: `public/Tarun-Mundhra-Resume.pdf`

## Customization

- Update contact details in `src/components/portfolio/ContactPage.tsx`
- Update projects in `src/components/portfolio/ProjectsPage.tsx`
- Update achievements in `src/components/portfolio/AboutPage.tsx`

## License

Personal portfolio. All rights reserved.
