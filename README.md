Portal2509 (Next.js + Tailwind + Supabase)
Vercel-ready MVP with Afrirent branding.

### Quick Start
```bash
npm install
npm run dev
# open http://localhost:3000
```
Env vars (Vercel Project Settings → Environment Variables, or `.env.local`):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_SITE_URL (e.g. https://your-project.vercel.app)

### Pages
- / — Landing (branded hero)
- /login — Magic link sign-in (lion + logo)
- /client/dashboard — KPIs, charts, table (watermark)
- /client/quoting — Quote calculator
- /api/health — JSON health check

### Brand Assets
`public/brand/` contains: logo, holdings photo, lion, login background, paw watermark, placeholders.
