#!/usr/bin/env bash
set -euo pipefail

pdf_source="${1:-source.pdf}"
out_dir="${2:-notes}"
pages="${3:-all}"

tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

if [[ "$pdf_source" =~ ^https?:// ]]; then
  pdf_file="$tmp_dir/source.pdf"
  if command -v curl >/dev/null 2>&1; then
    curl -L -o "$pdf_file" "$pdf_source"
  elif command -v wget >/dev/null 2>&1; then
    wget -O "$pdf_file" "$pdf_source"
  else
    echo "Error: curl or wget is required to download PDF from URL." >&2
    exit 1
  fi
else
  pdf_file="$pdf_source"
fi

mkdir -p "$out_dir"

manifest_file="$out_dir/.pdf-to-slides-state.json"
next_slide_index=1
slide_offset=0

load_state() {
  if [ ! -f "$manifest_file" ]; then
    return
  fi

  local stored
  stored=$(grep -o '"next_slide_index"[[:space:]]*:[[:space:]]*[0-9]\+' "$manifest_file" | grep -o '[0-9]\+' | tail -n1 || true)
  if [[ "$stored" =~ ^[0-9]+$ ]] && [ "$stored" -ge 1 ]; then
    next_slide_index="$stored"
  fi
}

write_state() {
  printf '{\n  "next_slide_index": %s\n}\n' "$next_slide_index" > "$manifest_file"
}

load_state
slide_offset=$((next_slide_index - 1))

parse_pages() {
  if [ "$pages" = "all" ]; then
    start=1
    end=0
    return
  fi

  if [[ "$pages" =~ ^([0-9]+)-([0-9]+)$ ]]; then
    start=${BASH_REMATCH[1]}
    end=${BASH_REMATCH[2]}
  elif [[ "$pages" =~ ^([0-9]+)$ ]]; then
    start=${BASH_REMATCH[1]}
    end=$start
  else
    echo "Error: unsupported page selection '$pages'. Use 'all', a page number, or a page range like '2-5'." >&2
    exit 1
  fi

  if [ "$end" -ne 0 ] && [ "$end" -lt "$start" ]; then
    echo "Error: invalid page range '$pages'." >&2
    exit 1
  fi
}

get_total_pages() {
  if [ "$pages" = "all" ]; then
    if command -v pdfinfo >/dev/null 2>&1; then
      local page_count
      page_count=$(pdfinfo "$pdf_file" 2>/dev/null | awk '/^Pages:/ {print $2}')
      if [[ "$page_count" =~ ^[0-9]+$ ]]; then
        total_pages="$page_count"
      else
        total_pages=0
      fi
    else
      total_pages=0
    fi
  else
    total_pages=$((end - start + 1))
  fi
}

move_converted_slides() {
  local seq=0
  local img
  copied_count=0
  last_output_index=$slide_offset

  while IFS= read -r -d '' img; do
    seq=$((seq + 1))
    local output_index=$((slide_offset + seq))
    local output_file="$out_dir/slide${output_index}.png"
    cp -f "$img" "$output_file"
    copied_count=$((copied_count + 1))
    last_output_index=$output_index
  done < <(find "$tmp_dir" -maxdepth 1 -type f -name 'slide*.png' -print0 | sort -z -V)
}

to_native_path() {
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -w "$1"
  else
    printf '%s' "$1"
  fi
}

parse_pages
get_total_pages

convert_with_pdftoppm() {
  local args=( -png -r 200 )
  if [ "$pages" != "all" ]; then
    args+=( -f "$start" -l "$end" )
  fi
  local native_pdf_file
  native_pdf_file=$(to_native_path "$pdf_file")
  local native_output_prefix
  native_output_prefix=$(to_native_path "$tmp_dir/slide")
  args+=( "$native_pdf_file" "$native_output_prefix" )
  pdftoppm "${args[@]}"
}

convert_with_imagemagick() {
  local range=""
  if [ "$pages" != "all" ]; then
    if [ "$start" -eq "$end" ]; then
      range="[$((start - 1))]"
    else
      range="[$((start - 1))-$((end - 1))]"
    fi
  fi
  local native_pdf_file
  native_pdf_file=$(to_native_path "$pdf_file")
  local native_output_file
  native_output_file=$(to_native_path "$tmp_dir/slide-%03d.png")
  magick -density 200 "$native_pdf_file$range" "$native_output_file"
}

convert_with_ghostscript() {
  local gs_args=( -dNOPAUSE -dBATCH -sDEVICE=pngalpha -r200 )
  if [ "$pages" != "all" ]; then
    gs_args+=( -dFirstPage="$start" -dLastPage="$end" )
  fi
  local native_pdf_file
  native_pdf_file=$(to_native_path "$pdf_file")
  local native_output_file
  native_output_file=$(to_native_path "$tmp_dir/slide-%03d.png")
  gs "${gs_args[@]}" -sOutputFile="$native_output_file" "$native_pdf_file"
}

is_imagemagick_convert() {
  if ! command -v convert >/dev/null 2>&1; then
    return 1
  fi
  local version
  version=$(convert --version 2>/dev/null || true)
  printf '%s' "$version" | grep -qi 'ImageMagick'
}

if command -v pdftoppm >/dev/null 2>&1; then
  convert_with_pdftoppm
elif command -v magick >/dev/null 2>&1; then
  convert_with_imagemagick
elif is_imagemagick_convert; then
  magick() { convert "$@"; }
  convert_with_imagemagick
elif command -v gs >/dev/null 2>&1; then
  convert_with_ghostscript
else
  if command -v convert >/dev/null 2>&1; then
    echo "Error: found Windows built-in 'convert' command, which is not ImageMagick. Install 'pdftoppm' (poppler), ImageMagick, or Ghostscript." >&2
  else
    echo "Error: no PDF rasterizer found. Install 'pdftoppm' (poppler), ImageMagick, or Ghostscript." >&2
  fi
  exit 1
fi

move_converted_slides
next_slide_index=$((last_output_index + 1))
write_state

echo "Created ${copied_count:-0} slide images in '$out_dir' from '$pdf_file', starting at slide $((slide_offset + 1))."
