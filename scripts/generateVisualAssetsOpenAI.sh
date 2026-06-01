#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/public/assets/generated"
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

COMMON_STYLE="dark fantasy mobile game UI concept art, premium cinematic lighting, antique parchment textures, black iron frame, bronze-gold trims, coherent visual language, no watermark, no logos, no readable text"
COMMON_NEGATIVE="flat lighting, cartoonish proportions, neon cyberpunk colors, blurry details, modern sci-fi interface, watermark, signature"

generate() {
  local file="$1"
  local size="$2"
  local prompt="$3"
  local use_case="$4"
  local composition="$5"
  local lighting="$6"
  local palette="$7"

  python3 "$IMAGE_CLI" generate \
    --model gpt-image-1-mini \
    --quality medium \
    --size "$size" \
    --output-format png \
    --force \
    --out "$OUT_DIR/$file" \
    --prompt "$prompt" \
    --use-case "$use_case" \
    --style "$COMMON_STYLE" \
    --composition "$composition" \
    --lighting "$lighting" \
    --palette "$palette" \
    --constraints "shared art direction across all assets for one game; keep center area usable for UI overlays" \
    --negative "$COMMON_NEGATIVE"
}

generate "bg-home-castle.png" "1024x1536" \
  "moonlit fortress skyline above dark mountains with mist and distant dragons, foreground vignette for title screen" \
  "ui-mockup" \
  "vertical mobile background, high detail at top and edges, clean darker center" \
  "cold moonlight with warm torch accents" \
  "black, charcoal, bronze, muted amber"

generate "hero-character-sheet.png" "1024x1024" \
  "front-facing hooded adventurer portrait with leather armor and subtle rune pendant, neutral expression, card-friendly framing" \
  "stylized-concept" \
  "medium close-up portrait, centered, breathing room around silhouette" \
  "soft warm rim light, dark background separation" \
  "brown leather, dark steel, antique gold"

generate "combat-sheet.png" "1024x1536" \
  "ornate parchment battle ledger page with decorative borders, empty framed zones for stats and notes, aged paper texture" \
  "ui-mockup" \
  "vertical page, symmetrical frame design, high contrast edges" \
  "warm candlelight and subtle paper shadows" \
  "parchment beige, sepia, bronze"

generate "world-map-ancient.png" "1536x1024" \
  "hand-drawn fantasy world map on old parchment, rivers, mountains, forests, roads and city markers, adventurous route path" \
  "illustration-story" \
  "landscape map layout with clear visual landmarks and navigational flow" \
  "warm diffuse light, gentle shadowing on creases" \
  "sepia parchment, deep brown ink, muted olive accents"

generate "dice-tray-topdown.png" "1024x1024" \
  "top-down dark wooden dice tray with embossed bronze ring, empty center for overlaying dice UI" \
  "product-mockup" \
  "centered circular tray, clean composition" \
  "dramatic overhead spot light with soft falloff" \
  "walnut brown, burnt umber, bronze highlights"

generate "enemy-goblin-portrait.png" "1024x1024" \
  "close-up portrait of a vicious goblin warrior, scarred skin, sharp teeth, dark fantasy art style" \
  "stylized-concept" \
  "head and shoulders, centered portrait crop" \
  "side key light with moody shadows" \
  "olive skin, rusty armor, charcoal background"

generate "enemy-wraith-portrait.png" "1024x1024" \
  "ghostly death spirit portrait with skull-like face and smoky aura, ominous dark fantasy mood" \
  "stylized-concept" \
  "head and shoulders, centered portrait crop" \
  "cold backlight with spectral haze" \
  "icy cyan glow, black smoke, desaturated stone tones"

echo "Done. Generated assets in: $OUT_DIR"
