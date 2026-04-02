#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INPUT_FILE="${1:-test.json}"
OUTPUT_DIR="${2:-test-images}"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is required to run this script." >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "Error: curl is required to download images." >&2
  exit 1
fi

if [ ! -f "$INPUT_FILE" ]; then
  echo "Error: JSON file not found: $INPUT_FILE" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "Parsing $INPUT_FILE and categorizing images by subject..."

NODE_OUTPUT=$(node "$SCRIPT_DIR/testImage.js" "$INPUT_FILE")

if [ -z "$NODE_OUTPUT" ]; then
  echo "No image URLs were found in $INPUT_FILE." >&2
  exit 1
fi

printf '%s\n' "$NODE_OUTPUT" | while IFS=$'\t' read -r section url target; do
  if [ -z "$url" ] || [ -z "$target" ]; then
    continue
  fi

  target_path="$OUTPUT_DIR/$target"
  mkdir -p "$(dirname "$target_path")"

  if [ -f "$target_path" ]; then
    echo "Skipping existing file: $target_path"
    continue
  fi

  echo "Downloading $url -> $target_path"
  curl -L --fail -o "$target_path" "$url"

done

echo "Download complete. Images saved under $OUTPUT_DIR/"
