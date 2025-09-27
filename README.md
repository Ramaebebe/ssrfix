# Afrirent Portal

Stack: **Next.js 14**, **TypeScript**, **Tailwind**, **Supabase**, **(Optional) External BI: Metabase / Superset / Redash / Looker Studio**

## Quick Start
1. Copy `.env.example` → `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (optional BI) `NEXT_PUBLIC_MB_FLEET_URL`, `NEXT_PUBLIC_SUPERSET_URL`, etc.
2. Run SQL:
   - `supabase/schema_extended.sql`
   - (plus your existing core schema)
3. `npm i`
4. `npm run dev`
5. Visit `/login`, `/client/quoting`, `/client/analytics`

## Notes
- Supabase clients are centralized in `src/lib/supabase/*`.
- Quoting UI calls `/api/quotes/price` (server-calculated).
- Analytics page embeds external BI tools via iframe.
- Charts & tables are typed and reusable.
