#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
out_dir="${1:-notes}"
links_file="$script_dir/pdflinks.js"
converter="$script_dir/pdf-to-slides.sh"

tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

if [ ! -f "$links_file" ]; then
  echo "Error: links file not found: $links_file" >&2
  exit 1
fi

if [ ! -f "$converter" ]; then
  echo "Error: converter not found: $converter" >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "Error: curl is required to download PDFs." >&2
  exit 1
fi

mkdir -p "$out_dir"

readarray -t links < <(node -e '
const fs = require("fs");
const path = require("path");
const file = process.argv[1];
if (!file) {
  console.error("Error: missing links file path argument");
  process.exit(1);
}
const text = fs.readFileSync(file, "utf8");
const match = text.match(/const\s+links\s*=\s*(\[[\s\S]*?\])/);
if (!match) {
  console.error("Error: failed to parse links array from " + file);
  process.exit(1);
}
const links = eval(match[1]);
if (!Array.isArray(links)) {
  console.error("Error: links value is not an array");
  process.exit(1);
}
for (const url of links) {
  console.log(url);
}
' "$links_file")

if [ "${#links[@]}" -eq 0 ]; then
  echo "Error: no PDF links found in $links_file" >&2
  exit 1
fi

echo "Found ${#links[@]} PDF link(s)."

for idx in "${!links[@]}"; do
  url="${links[$idx]}"
  if [ -z "$url" ]; then
    continue
  fi
  pdf_name="pdf-$((idx + 1)).pdf"
  pdf_path="$tmp_dir/$pdf_name"

  echo "Downloading PDF #$((idx + 1)): $url"
  curl -L -f -o "$pdf_path" "$url"

  echo "Converting PDF #$((idx + 1)) to slides into $out_dir"
  bash "$converter" "$pdf_path" "$out_dir"
  echo "Finished PDF #$((idx + 1))"
  echo
done

echo "All PDFs converted. Slides are in $out_dir with continuous numbering."
