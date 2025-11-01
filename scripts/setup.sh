#!/usr/bin/env bash
set -euo pipefail

# setup.sh - install dependencies and do initial project setup
# Usage: bash scripts/setup.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Detected project root: $ROOT_DIR"

# Detect package manager
if command -v pnpm >/dev/null 2>&1; then
  PKG_MANAGER=pnpm
  INSTALL_CMD="pnpm install"
elif command -v yarn >/dev/null 2>&1 && yarn -v | grep -qv "npm"; then
  PKG_MANAGER=yarn
  INSTALL_CMD="yarn install"
else
  PKG_MANAGER=npm
  INSTALL_CMD="npm install"
fi

echo "Using package manager: $PKG_MANAGER"

# Install dependencies
echo "Installing dependencies..."
$INSTALL_CMD

# Create .env.local from .env.example if present
if [ -f .env.example ] && [ ! -f .env.local ]; then
  echo "Creating .env.local from .env.example"
  cp .env.example .env.local
fi

# If TypeScript is configured, run a typecheck
if [ -f tsconfig.json ]; then
  echo "Running typecheck (tsc --noEmit)"
  if command -v npx >/dev/null 2>&1; then
    npx tsc --noEmit || true
  else
    echo "npx not found — skipping typecheck"
  fi
fi

# Optional: build a small static check
if command -v git >/dev/null 2>&1; then
  echo "Project branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
fi

cat <<EOF
Setup finished.
Next steps:
  - Start the dev server: npm run dev (or ${PKG_MANAGER} dev)
  - Build for production: npm run build
  - Run tests: npm run test

If you need to use a different package manager, run the install command of your choice.
EOF
