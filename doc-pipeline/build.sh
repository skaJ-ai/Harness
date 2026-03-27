#!/bin/bash
# ═══════════════════════════════════════════════════
# HARP Document Pipeline: MD → PDF
#
# Prerequisites:
#   - Typst CLI: https://github.com/typst/typst
#     Install: cargo install typst-cli
#     Or: brew install typst (macOS)
#     Or: winget install --id Typst.Typst (Windows)
#
#   - Pandoc (optional, for MD → Typst conversion):
#     https://pandoc.org/installing.html
#
# Usage:
#   ./doc-pipeline/build.sh                    # Build all docs
#   ./doc-pipeline/build.sh docs/03-cps-prd/   # Build specific dir
#   ./doc-pipeline/build.sh path/to/file.md    # Build single file
# ═══════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE="$SCRIPT_DIR/templates/default.typ"
OUTPUT_DIR="$SCRIPT_DIR/output"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check for typst
if ! command -v typst &> /dev/null; then
    echo -e "${RED}Error: typst is not installed.${NC}"
    echo ""
    echo "Install Typst:"
    echo "  macOS:   brew install typst"
    echo "  Windows: winget install --id Typst.Typst"
    echo "  Cargo:   cargo install typst-cli"
    echo "  Manual:  https://github.com/typst/typst/releases"
    exit 1
fi

# Check for pandoc (optional, for MD → Typst)
HAS_PANDOC=false
if command -v pandoc &> /dev/null; then
    HAS_PANDOC=true
fi

build_md_to_pdf() {
    local md_file="$1"
    local basename=$(basename "$md_file" .md)
    local dir_name=$(basename "$(dirname "$md_file")")
    local output_name="${dir_name}--${basename}"
    local typ_file="$OUTPUT_DIR/${output_name}.typ"
    local pdf_file="$OUTPUT_DIR/${output_name}.pdf"

    echo -e "  ${YELLOW}→${NC} Building: $md_file"

    if [ "$HAS_PANDOC" = true ]; then
        # Use Pandoc to convert MD → Typst markup
        pandoc "$md_file" -t typst -o "$typ_file" 2>/dev/null
        typst compile "$typ_file" "$pdf_file" 2>/dev/null
        rm -f "$typ_file"  # Clean up intermediate file
    else
        # Direct typst compilation (requires manual typst formatting)
        echo -e "  ${YELLOW}⚠${NC}  Pandoc not found. Copying MD as-is (limited formatting)."
        cp "$md_file" "$OUTPUT_DIR/${output_name}.md"
        echo -e "  ${YELLOW}⚠${NC}  Output: $OUTPUT_DIR/${output_name}.md (install Pandoc for PDF)"
        return
    fi

    if [ -f "$pdf_file" ]; then
        echo -e "  ${GREEN}✓${NC} Output: $pdf_file"
    else
        echo -e "  ${RED}✗${NC} Failed: $md_file"
    fi
}

# Determine what to build
TARGET="${1:-$PROJECT_ROOT/docs}"

echo ""
echo "📄 HARP Document Pipeline"
echo "════════════════════════════"

if [ -f "$TARGET" ]; then
    # Single file
    build_md_to_pdf "$TARGET"
elif [ -d "$TARGET" ]; then
    # Directory - find all .md files
    FILE_COUNT=$(find "$TARGET" -name "*.md" -not -path "*/node_modules/*" | wc -l)
    echo "  Found $FILE_COUNT markdown files in: $TARGET"
    echo ""

    find "$TARGET" -name "*.md" -not -path "*/node_modules/*" | sort | while read -r file; do
        build_md_to_pdf "$file"
    done
else
    echo -e "${RED}Error: $TARGET not found${NC}"
    exit 1
fi

echo ""
echo "════════════════════════════"
echo -e "${GREEN}Done.${NC} Output directory: $OUTPUT_DIR"
