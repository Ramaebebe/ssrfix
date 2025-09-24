#!/usr/bin/env bash
set -euo pipefail
# Remove accidental .next commit and prevent future tracking

# Ensure .next is ignored
if ! grep -q '^\.next$' .gitignore 2>/dev/null; then
  echo ".next" >> .gitignore
fi

# Untrack .next if it was committed
git rm -r --cached .next || true

echo "Cleaned .next from git index. Commit the changes:"
echo "  git add .gitignore"
echo "  git commit -m 'chore: stop tracking .next build output'"
