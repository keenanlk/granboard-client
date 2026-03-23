#!/usr/bin/env bash
# Merge coverage JSON from all workspaces into a single report.

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MERGED="$ROOT/.nyc_output"

rm -rf "$MERGED" "$ROOT/coverage"
mkdir -p "$MERGED"

# Find all workspace coverage-final.json files dynamically
found=0
for json in "$ROOT"/packages/*/coverage/coverage-final.json "$ROOT"/apps/*/coverage/coverage-final.json; do
  if [ -f "$json" ]; then
    # Derive a unique name from the workspace path
    dir="${json#"$ROOT"/}"
    dir="${dir%/coverage/coverage-final.json}"
    name=$(echo "$dir" | tr '/' '-')
    cp "$json" "$MERGED/$name.json"
    echo "✓ Copied $dir coverage"
    found=$((found + 1))
  fi
done

if [ "$found" -eq 0 ]; then
  echo "⚠ No coverage files found"
  exit 0
fi

# Generate merged report
cd "$ROOT"
npx nyc report --reporter=text --reporter=html --temp-dir=.nyc_output --report-dir=coverage

echo ""
echo "Combined HTML report: coverage/index.html"
