Portal Modules — Quotes + Audits

This package adds:
1) Electronic Quotation Engine (three options + EV alternative, PDF export, signed PDF upload)
   - File: src/app/client/quoting/page.tsx (replace your existing page)
2) Maintenance & Technical Audits (geo/photo capture, list, PDF export)
   - File: src/app/client/audits/page.tsx (new route at /client/audits)
3) Supabase SQL for tables, RLS, and helper function
   - File: supabase/portal_ext.sql

Setup
-----
1) Dependencies (client-only; safe for Vercel):
   npm i jspdf html2canvas

2) Supabase
   - Run supabase/portal_ext.sql in SQL Editor.
   - Create storage buckets:
     • signed-quotes (public or restricted; if restricted, use signed URLs)
     • audit-photos  (ditto)
   - (Optional) Seed 'vehicles' with EV flag for an EV Alternative card.

3) Env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...

4) Auth / Guards
   - Ensure your /client/* layout protects routes (we provided an auth-guard pack earlier).

Notes
-----
- PDF exports are rendered client-side via html2canvas + jsPDF — no server dependencies.
- Signed PDFs are uploaded directly to Supabase Storage and logged in signed_quote_uploads.
- Audits capture geolocation if permitted by the browser; otherwise, location is blank.
- RLS policies are permissive for speed. Tighten to role/email as required.
