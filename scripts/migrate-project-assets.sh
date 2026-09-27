#!/usr/bin/env bash
# The first argument points to the uploads directory.

set -euo pipefail

# Check if argument is missing
if [[ -z "${1:-}" ]]; then
    echo "No uploads directory specified."
    exit 1
fi

TARGET_DIR="$1"

if [ ! -d "$TARGET_DIR" ]; then
    echo "The specified uploads directory does not exist."
    exit 1
fi

DEST_DIR="$1/projects/unified-storage"
mkdir -p "$DEST_DIR"
moved_count=0

find "$TARGET_DIR" -type f -regextype posix-extended -regex '.*/projects/[0-9]+/[^/]+' | while read -r filepath; do
    full_filename="${filepath##*/}"
    filename="${full_filename%.*}"

    # Check if the base filename is a 32-character hex MD5 hash
    if [[ "$filename" =~ ^[a-fA-F0-9]{32}$ ]]; then
        first_char="${filename:0:1}"
        first_two="${filename:0:2}"
        
        target_subfolder="$DEST_DIR/$first_char/$first_two"
        
        # Skip if the file already exists in target unified storage location
        if [[ -e "$target_subfolder/$full_filename" ]]; then
            continue
        fi

        mkdir -p "$target_subfolder"
        mv "$filepath" "$target_subfolder/"
        ((moved_count++)) || true

        if (( moved_count % 100 == 0 )); then
            echo "$moved_count..."
        fi
    fi
done