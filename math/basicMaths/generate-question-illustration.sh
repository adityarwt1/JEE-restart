#!/usr/bin/env bash
set -euo pipefail

slides_dir="${1:-notes}"
output_file="${2:-illustration.md}"
pattern="${3:-*question.png}"

if [ "$slides_dir" = "-h" ] || [ "$slides_dir" = "--help" ]; then
  cat <<'EOF'
Usage: ./generate-question-illustration.sh [slides-dir] [output-file] [pattern]

slides-dir   Directory to scan recursively for question images.
output-file  Markdown file to generate (default: illustration.md).
pattern      Filename pattern to match question images (default: '*question.png').

Example:
  ./generate-question-illustration.sh notes/typeOfChargesAndTheirProperties illustration.md
  ./generate-question-illustration.sh notes illustration.md '*question.png'
EOF
  exit 0
fi

if [ ! -d "$slides_dir" ]; then
  echo "Error: slides directory not found: $slides_dir" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is required. Install Node.js to continue." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/question-illustration.js" "$slides_dir" "$output_file" "$pattern"
exit $?
