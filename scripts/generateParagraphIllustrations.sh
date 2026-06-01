#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/public/assets/generated/paragraphs"
IMAGE_CLI="$HOME/.codex/skills/imagegen/scripts/image_gen.py"

mkdir -p "$OUT_DIR"

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY is missing. Set it and rerun."
  exit 1
fi

if [[ ! -f "$IMAGE_CLI" ]]; then
  echo "Image CLI not found at: $IMAGE_CLI"
  exit 1
fi

COMMON_STYLE="dark fantasy book illustration, dramatic but elegant, detailed brushwork, cohesive style across all assets, cinematic lighting, no watermark, no logos, no text overlays"
COMMON_NEGATIVE="modern city, sci-fi elements, photoreal stock image vibe, blurry, extra fingers, watermark, signature, UI text"

generate() {
  local file="$1"
  local size="$2"
  local prompt="$3"
  local composition="$4"
  local lighting="$5"
  local palette="$6"

  python3 "$IMAGE_CLI" generate \
    --model gpt-image-1-mini \
    --quality medium \
    --size "$size" \
    --output-format png \
    --force \
    --out "$OUT_DIR/$file" \
    --prompt "$prompt" \
    --use-case "illustration-story" \
    --style "$COMMON_STYLE" \
    --composition "$composition" \
    --lighting "$lighting" \
    --palette "$palette" \
    --constraints "single scene illustration tied to one gamebook paragraph, central subject clear, no frame text" \
    --negative "$COMMON_NEGATIVE"
}

generate "p044-magic-brush.png" "1024x1024" \
  "inside a cramped painter hut, a glowing enchanted paintbrush flies in midair, dodging a hero's sword strike while still painting a portrait on canvas" \
  "medium shot, dynamic diagonal motion, brush and canvas both clearly visible" \
  "warm candlelight mixed with eerie magic glow" \
  "amber, umber, charcoal, pale magical teal"

generate "p067-portrait-double.png" "1024x1024" \
  "a painted portrait pulls itself out of a canvas and becomes a living doppelganger of the hero, in a tense confrontation inside a dark hut" \
  "hero and doppelganger face-to-face, canvas behind them, dramatic perspective" \
  "contrasting warm interior light and cold supernatural glow" \
  "dark brown, muted gold, steel gray, spectral blue"

generate "p096-fire-artist-show.png" "1024x1024" \
  "street fire artist in the city of traps performs controlled magical flames in white, green, blue and black hues before an intrigued traveler" \
  "street performance composition with artist foreground and subtle crowd silhouettes" \
  "night scene lit by layered magical fire light" \
  "black, deep blue, green fire accents, bronze highlights"

generate "p176-painter-hut.png" "1024x1024" \
  "painter's hut walls packed with artworks, at center a floating cursed brush rapidly paints on an easel while an unfinished portrait of the hero appears" \
  "interior establishing shot, easel centered, walls full of paintings" \
  "moody indoor lantern light with magical highlights" \
  "sepia, dark wood, parchment beige, subtle mystical cyan"

generate "p336-rune-sequence.png" "1024x1024" \
  "close view of a scholar desk with an ancient parchment showing a sequence of arcane runes puzzle, one missing next symbol implied" \
  "top-down tabletop composition, runes arranged clearly in sequence" \
  "soft study lamp over parchment, shadowed room around" \
  "aged parchment, dark ink, bronze desk details"

echo "Done. Paragraph illustrations generated in: $OUT_DIR"
