#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JOBS_FILE="$ROOT_DIR/scripts/generated/visual-jobs-medium.jsonl"
OUT_DIR="$ROOT_DIR/public/assets/generated"
IMAGE_CLI="$HOME/.codex/skills/imagegen/scripts/image_gen.py"

if [[ ! -f "$JOBS_FILE" ]]; then
  echo "Missing jobs file: $JOBS_FILE"
  echo "Run: npm run images:plan"
  exit 1
fi

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY is missing. Export it and rerun."
  exit 1
fi

if [[ ! -f "$IMAGE_CLI" ]]; then
  echo "Image CLI not found at: $IMAGE_CLI"
  exit 1
fi

mkdir -p "$OUT_DIR/paragraphs" "$OUT_DIR/characters" "$OUT_DIR/items"

python3 "$IMAGE_CLI" generate-batch \
  --model gpt-image-1-mini \
  --quality medium \
  --size 1024x1024 \
  --output-format png \
  --out-dir "$OUT_DIR" \
  --input "$JOBS_FILE" \
  --concurrency 2 \
  --max-attempts 6 \
  --force \
  --no-augment

# The bundled batch CLI flattens paths when --out-dir is set.
# Re-route files into the structure the app expects.
for file in "$OUT_DIR"/*.png; do
  [[ -e "$file" ]] || continue
  base="$(basename "$file")"

  if [[ "$base" =~ ^p[0-9]{3}-scene\.png$ ]]; then
    mv -f "$file" "$OUT_DIR/paragraphs/$base"
    continue
  fi

  if [[ "$base" =~ ^enemy_ ]] || [[ "$base" =~ ^npc_ ]] || [[ "$base" =~ ^hero_ ]]; then
    mv -f "$file" "$OUT_DIR/characters/$base"
    continue
  fi

  mv -f "$file" "$OUT_DIR/items/$base"
done

echo "ALL_PLANNED_IMAGES_DONE out=$OUT_DIR"
