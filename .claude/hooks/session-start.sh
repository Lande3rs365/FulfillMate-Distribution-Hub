#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo '{"async": true, "asyncTimeout": 300000}'

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Skip if dependencies are already installed
if [ -d "node_modules/.bin" ] && [ -f "node_modules/.bin/vitest" ]; then
  echo "Dependencies already installed, skipping."
  exit 0
fi

# Install dependencies — prefer bun (lockfile is bun.lock / bun.lockb)
if command -v bun &>/dev/null && { [ -f "bun.lock" ] || [ -f "bun.lockb" ]; }; then
  bun install
elif [ -f "package-lock.json" ]; then
  npm install
elif [ -f "yarn.lock" ]; then
  yarn install --frozen-lockfile
else
  npm install
fi
