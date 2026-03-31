#!/usr/bin/env bash
set -euo pipefail

source_dir="${1:-questoinPractices}"
output_file="${2:-questionSheet.md}"
pattern="${3:-*.png}"

if [ "$source_dir" = "-h" ] || [ "$source_dir" = "--help" ]; then
  cat <<'EOF'
Usage: ./generate-question-practice-sheet.sh [source-dir] [output-file] [pattern]

source-dir   Directory containing practice question images.
output-file  Markdown file to write (default: questionSheet.md).
pattern      Filename glob to match images (default: '*.png').

Example:
  ./generate-question-practice-sheet.sh questoinPractices questionSheet.md
  ./generate-question-practice-sheet.sh questoinPractices questionSheet.md 'slide*question.png'
EOF
  exit 0
fi

if [ ! -d "$source_dir" ]; then
  echo "Error: source directory not found: $source_dir" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is required. Install Node.js to continue." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/question-practice-sheet.js" "$source_dir" "$output_file" "$pattern"
