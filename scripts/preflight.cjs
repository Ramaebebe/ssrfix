// scripts/preflight.cjs
// Cross-platform preflight used by Vercel and local builds
const REQUIRED_NODE_MAJOR = 20;

(function checkNode() {
  const v = process.version;           // e.g. v20.17.0
  const major = Number(v.replace(/^v/, '').split('.')[0]);
  if (major !== REQUIRED_NODE_MAJOR) {
    console.warn(`⚠️ Recommended Node major is ${REQUIRED_NODE_MAJOR}. Detected ${v}. Vercel uses Node 20 by default, which is fine.`);
  }
})();

(function checkEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
  if (missing.length) {
    console.warn('⚠️ Missing env vars (build may fail at runtime): ' + missing.join(', '));
    // If you want to hard-fail CI, uncomment the next line:
    // process.exit(1);
  }
})();
