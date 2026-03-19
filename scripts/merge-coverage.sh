#!/usr/bin/env bash
# Merge coverage JSON from all workspaces into a single report.
# Run: pnpm test:coverage:combined

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MERGED="$ROOT/.nyc_output"

rm -rf "$MERGED" "$ROOT/coverage"
mkdir -p "$MERGED"

# Copy each workspace's coverage-final.json with a unique name
for dir in packages/engine apps/web apps/server; do
  json="$ROOT/$dir/coverage/coverage-final.json"
  if [ -f "$json" ]; then
    name=$(echo "$dir" | tr '/' '-')
    cp "$json" "$MERGED/$name.json"
    echo "✓ Copied $dir coverage"
  else
    echo "⚠ No coverage found for $dir"
  fi
done

# Generate merged report
cd "$ROOT"
npx nyc report --reporter=text --reporter=html --temp-dir=.nyc_output --report-dir=coverage

echo ""
echo "Combined HTML report: coverage/index.html"
