QUOTES PDF – DROP-IN
--------------------
Adds: POST /api/quotes/pdf -> Generates branded quotation PDF, uploads to Storage, returns signed URL.
Also ships a small client button you can drop into your Quoting page to call it and render the link.

Storage:
- Create a bucket `signed-quotes` (private).

Env:
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

Install:
- npm i pdf-lib

How to use (client):
- Import and render <GenerateQuotePdfButton calc={yourCalculatedQuote} />
where `calc` has the structure shown in src/app/client/quoting/GenerateQuotePdfButton.tsx.
