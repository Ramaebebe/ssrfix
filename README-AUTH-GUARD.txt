Auth Guard Pack (client-side) for /client/*

What this does
- Protects all /client/* pages with a session check in app/client/layout.tsx.
- If the user has no Supabase session, they are redirected to /login.
- Adds a null-safe Sign Out button in Topbar.tsx.

Requirements
- .env.local (and Vercel envs) must include:
  NEXT_PUBLIC_SUPABASE_URL=...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...

Install
- Drop these files into your repo (overwrite existing):
  - src/app/client/layout.tsx
  - src/components/Topbar.tsx

Notes
- This is a client-side guard. It doesn't require cookies or SSR helpers.
- If you want server-verified protection in the future, we can switch to @supabase/ssr + middleware.
