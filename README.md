<div align="center">
  <img src="public/Tarun.jpeg" alt="Tarun Mundhra" width="150" height="150" style="border-radius: 50%; box-shadow: 0 0 20px rgba(17,153,142,0.5);" />
  
  <br />

  # 🚀 Tarun Mundhra's Universe
  
  **Building high-performance trading systems, scalable backend architectures, and cross-platform applications.**

  [![Portfolio](https://img.shields.io/badge/Live_Portfolio-020617?style=for-the-badge&logo=react&logoColor=11998e)](https://tarunmundhra.tech)
  [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/TarunMundhra)
  [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/tarun-mundhra-0a0a5629a)

  <br />

  ### [✨ Enter the Portal ✨](https://tarunmundhra.tech)
</div>

---

## 🌌 About This Repository
This isn't just a portfolio; it's a **Next.js-powered command center** built with a mesmerizing teal-green glassmorphism aesthetic. Designed for speed, SEO, and maximum visual impact.

## ⚡ Hyper-Features
- **Blazing Fast SPA:** Seamless, fluid page transitions powered by `framer-motion`.
- **Glassmorphism UI:** Translucent cards, floating navbars, and ambient gradients.
- **SEO Optimized:** Next.js Image optimization, JSON-LD Schema, and semantic markup built-in.
- **Vercel Server Deployment:** The chat API requires a non-static Next.js deployment.

## 🛠️ The Tech Engine
| Core Framework | Styling & UI | State & Animations |
|----------------|--------------|--------------------|
| **Next.js 15 (App Router)** | **Tailwind CSS** | **Zustand** |
| **React 19 & TypeScript** | **Lucide Icons** | **Framer Motion** |

## 🚀 Ignition Sequence (Run Locally)

Ready to boot up the warp drive?
```bash
# Clone the repository
git clone https://github.com/TarunMundhra/portfolio.git

# Install dependencies
npm install

# Start the dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) and prepare to be wowed.

## 🏗️ Build & Deploy

The portfolio uses a standard Next.js server deployment on Vercel. Static export is
intentionally disabled because `/api/chat` and the owner-only analytics routes need
server-side secrets, streaming, and database access. Configure the Vercel project to
use the repository build command (`npm run build`) and do not set `output: "export"`.

```bash
# Generate the optimized static export
npm run build
```
For a static-only preview, existing generated assets can still be inspected in `out/`,
but production chat functionality is served by Vercel Functions.

## 🔐 Chat operations and deployment

### Environment separation

Copy `.env.example` for local development. Set `DATABASE_URL`, `GEMINI_API_KEY`,
`GROQ_API_KEY`, and `CHAT_ADMIN_SECRET` only in the server environment. In Vercel,
configure every variable independently for **Preview** and **Production**; do not
copy production credentials into Preview. `CHAT_ALLOWED_ORIGINS` must contain the
exact production origin (comma-separated for approved local/preview origins).
No chat secret uses a `NEXT_PUBLIC_` prefix.

### Protected indexing and approved sources

`npm run index:knowledge` is a protected CI/manual operation. Run it only with
the intended database URL and server credentials, review the source manifest in
`src/data/knowledge/manifest.ts`, and activate one complete index version at a
time. The approved v1 scope is the portfolio pages, public project descriptions,
and the resume; it excludes transcripts, arbitrary uploads, private data, tools,
web search, and unrelated websites. Review source URLs and hashes before activation.

### Migrations and retention

Apply `scripts/migrations/001_chat.sql` with the managed Postgres migration
workflow before enabling chat. Schedule `purge_expired_chat_data()` with the
provider scheduler, and verify `CHAT_ANALYTICS_RETENTION_DAYS` matches the approved
retention policy. The owner can explicitly delete one conversation or purge expired
records at `DELETE /api/admin/chat/delete` using an `Authorization: Bearer ...`
header. Query-string credentials are never accepted.

### Keys, origin, headers, and streaming checks

Rotate Gemini, Groq, database, and `CHAT_ADMIN_SECRET` values in the provider
secret manager, deploy, smoke-test, then revoke the old values. Verify that an
approved origin succeeds and an untrusted origin fails; inspect
`X-Content-Type-Options`, cache-control, and NDJSON streaming in a production
smoke test. Confirm the admin route returns aggregates and redacted metadata only:
never embeddings, provider responses, IP addresses, or unredacted content. Verify
conversation deletion and retention purge against a non-production database.

### Incident response

For a leaked key, revoke it immediately, rotate the replacement, redeploy, and
review provider/database audit logs. For abuse, restrict origins, apply rate limits,
preserve correlation IDs, and remove affected records. For bad corpus data, disable
index activation, identify the manifest entry, rebuild from reviewed sources, and
purge contaminated analytics if required. Record the incident, affected
environment, remediation, and post-incident verification.

## 👽 Architecture Breakdown
- **`src/app/`**: Next.js App Router setup, layout configs, and global SEO metadata.
- **`src/components/portfolio/`**: The core glassmorphism UI components (`HeroSection`, `GlassCard`, etc.).
- **`src/store/`**: Zustand state management for seamless SPA client-side navigation.
- **`public/`**: Static assets, SEO configurations (`sitemap.xml`, `robots.txt`), and the resume.

---
<div align="center">
  <i>"Code is poetry. Architecture is art."</i><br>
  <b>© Tarun Mundhra. All rights reserved.</b>
</div>
