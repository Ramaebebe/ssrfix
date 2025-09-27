# Audit PDF Template Fix

This replaces `src/lib/pdf/auditTemplate.ts` to fix:
- TypeScript syntax (`//` comments instead of `#`),
- `const page` reassignment (now `let page`),
- safe pagination for long findings and photo grids.

## How to use

Your API route (e.g. `/api/audits/report/[id]`) should:
1) fetch the audit record + photo blobs from Supabase,
2) call `buildAuditPdf(audit, photos)`,
3) return the PDF as an ArrayBuffer/Uint8Array response.

Example (edge/server route sketch):

```ts
import { NextResponse } from "next/server";
import { buildAuditPdf } from "@/lib/pdf/auditTemplate";
import { supabase } from "@/lib/supabaseClient";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const { data: audit } = await supabase.from("vehicle_audits").select("*").eq("id", id).single();
  if (!audit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch photos from storage (example bucket 'audits')
  const { data: list } = await supabase.storage.from("audits").list(id);
  const photos = [] as { filename: string; bytes: Uint8Array }[];
  for (const f of list ?? []) {
    const { data: file } = await supabase.storage.from("audits").download(`${id}/${f.name}`);
    if (file) {
      const buf = new Uint8Array(await file.arrayBuffer());
      photos.push({ filename: f.name, bytes: buf });
    }
  }

  const pdf = await buildAuditPdf(audit, photos);
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="audit-${id}.pdf"`,
    },
  });
}
```
