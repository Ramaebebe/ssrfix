PORTAL EXTENSIONS – Server PDFs, Signed URLs, Tight RLS
======================================================

1) Dependencies
---------------
Add one small server-side PDF lib:
  npm i pdf-lib

(You already have: jspdf, html2canvas – those remain for client PDFs.)

2) Files to drop in
-------------------
- src/app/api/quotes/pdf/route.ts
- src/app/api/audits/report/[id]/route.ts
- src/app/api/storage/signed-url/route.ts
- src/lib/supabaseServer.ts
- src/lib/signedUrl.ts
- supabase/rls_tighten.sql

3) Environment
--------------
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # required for signed URL API and privileged server tasks

4) Usage
--------
a) Quotes – Server PDF
   POST /api/quotes/pdf
   Body: {
     quoteId?, customer, vehicle, term, accessories[], pricing { ... options[], evAlternative? }
   }
   -> returns application/pdf

b) Audits – Single Inspection PDF
   GET /api/audits/report/:id
   -> streams a PDF with thumbnails of photos from 'audit-photos' bucket

c) Signed URL helper (client-side)
   import { getSignedUrl } from "@/lib/signedUrl"
   const url = await getSignedUrl("audit-photos", "user-uid/IMG_1.jpg", 120);

5) RLS Tightening
-----------------
In Supabase SQL Editor, run:
  supabase/rls_tighten.sql
Adjust bucket names if needed. This version restricts reads to owners and relies on
signed URLs for sharing. Tables now enforce owner writes via auth.uid().

6) Notes
--------
- All APIs use `export const runtime = "nodejs"` to avoid Edge binary issues.
- The storage signed URL endpoint prefers SERVICE_ROLE if configured.
- If your project uses different helper names, align imports or rename exported functions accordingly.