Branding PDF Pack — Afrirent
============================

Drop-in contents:
- public/brand/logo.png
- src/lib/pdf/brand.ts           (CI colors + company info)
- src/lib/pdf/quoteTemplate.ts   (branded quote layout)
- src/lib/pdf/auditTemplate.ts   (branded inspection layout with thumbnails)
- src/app/api/quotes/pdf/route.ts
- src/app/api/audits/report/[id]/route.ts
- src/app/api/storage/signed-url/route.ts
- src/lib/signedUrl.ts

Install:
  npm i pdf-lib

Storage (optional but recommended):
  Create buckets: signed-quotes (private), audit-photos (private)
  Ensure your RLS/Storage policies permit server-side upload + signed URL creation.

Usage:
  POST /api/quotes/pdf            -> returns A4 PDF; ?download=1 for attachment
  GET  /api/audits/report/:id     -> returns audit PDF; ?download=1 for attachment
  POST /api/storage/signed-url    -> { bucket, path, expiresIn } -> { url }

Customize:
  - Swap the logo: replace public/brand/logo.png
  - Edit colors/address in src/lib/pdf/brand.ts
  - Tweak layout in template files.

Notes:
  - The quote route also attempts to save the generated PDF into `signed-quotes/{userId}/...` if buckets exist.
  - The audit route expects tables `vehicle_audits` and `vehicle_audit_photos` plus a storage bucket `audit-photos`.
