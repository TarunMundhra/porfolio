# SEO Strategy for Single-Page Portfolio

## Overview
Optimize the portfolio to rank highly for the personal brand "Tarun Mundhra" and related broad professional titles (e.g., "Full-Stack Developer", "Software Engineer"). The architecture remains a Single Page Application (SPA), focusing entirely on the main entry point to consolidate page authority.

## Goals
- Rank #1 for name-based queries.
- Clearly present professional identity (Developer, IIT Kharagpur) to search engine crawlers.
- Ensure excellent Core Web Vitals (performance, accessibility) as ranking factors.

## Technical Metadata & Foundation
- **`app/layout.tsx` Updates**:
  - `title`: "Tarun Mundhra | Full-Stack Developer & Software Engineer"
  - `description`: "Portfolio of Tarun Mundhra, a Full-Stack Developer and Software Engineer at IIT Kharagpur specializing in trading systems, scalable backend architectures, and cross-platform applications."
  - **OpenGraph & Twitter Cards**: Update to match the refined description.
- **Static Assets**:
  - Add `public/sitemap.xml` pointing to the root domain.
  - Add `public/robots.txt` allowing all crawlers and linking to the sitemap.

## Schema Markup (JSON-LD)
- Inject a `Person` schema script into the `<head>` or body of `layout.tsx`.
- Include properties: `name`, `url`, `jobTitle`, `alumniOf` (IIT Kharagpur), and `sameAs` (GitHub, LinkedIn).

## Semantic HTML & Content Adjustments
- **`HeroSection.tsx`**:
  - Convert the `<img>` tag to Next.js `<Image>` component for automatic optimization (WebP/AVIF, proper sizing) to improve LCP (Largest Contentful Paint).
  - Ensure the name "Tarun Mundhra" is wrapped in an `<h1>` (already done).
  - Wrap the subtitle ("Building high-performance...") or a new visually-hidden but screen-reader/SEO-accessible element in an `<h2>` emphasizing "Full-Stack Developer".
  - Ensure `alt` text on the profile image is descriptive: "Tarun Mundhra - Full-Stack Developer".

## Post-Deployment Actions (For the User)
1. Ensure the site is deployed (e.g., to Vercel/Netlify) and has a custom or provided domain.
2. Sign in to **Google Search Console** (search.google.com/search-console).
3. Add the website property using Domain or URL Prefix verification.
4. Navigate to the **Sitemaps** section in the left sidebar.
5. Enter `sitemap.xml` in the "Add a new sitemap" field and click Submit.
6. Use the **URL Inspection** tool on the root URL to request indexing immediately.
