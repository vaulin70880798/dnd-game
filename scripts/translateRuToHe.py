#!/usr/bin/env python3
import json
import re
import sys
import time
from pathlib import Path
from urllib.parse import quote

import requests

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
PARAGRAPHS_PATH = DATA_DIR / "paragraphs.json"
RULES_PATH = DATA_DIR / "rules.json"
BOOK_META_PATH = DATA_DIR / "bookMeta.json"
MAP_NODES_PATH = DATA_DIR / "mapNodes.json"
ITEMS_PATH = DATA_DIR / "items.json"
ENEMIES_PATH = DATA_DIR / "enemies.json"
CACHE_PATH = DATA_DIR / "translation-cache-ru-he.json"

TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, payload):
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def normalize_for_cache(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip())


def mask_sensitive(text: str):
    masks = {}
    idx = 0

    def repl(match):
        nonlocal idx
        token = f"__MASK_{idx}__"
        masks[token] = match.group(0)
        idx += 1
        return token

    masked = re.sub(r"\b[A-Z]{3}\b", repl, text)
    return masked, masks


def unmask_sensitive(text: str, masks):
    out = text
    for key, value in masks.items():
        out = out.replace(key, value)
    return out


def translate_http_once(text: str) -> str:
    params = {
        "client": "gtx",
        "sl": "ru",
        "tl": "iw",
        "dt": "t",
        "q": text,
    }
    response = requests.get(TRANSLATE_URL, params=params, timeout=20)
    response.raise_for_status()
    payload = response.json()

    if not payload or not isinstance(payload, list) or not payload[0]:
        return text

    translated_parts = []
    for part in payload[0]:
        if isinstance(part, list) and part and isinstance(part[0], str):
            translated_parts.append(part[0])

    if not translated_parts:
        return text

    return "".join(translated_parts)


def split_for_translation(text: str, max_len: int = 1600):
    if len(text) <= max_len:
        return [text]

    lines = text.split("\n")
    chunks = []
    current = []
    current_len = 0

    for line in lines:
        add_len = len(line) + 1
        if current and current_len + add_len > max_len:
            chunks.append("\n".join(current))
            current = [line]
            current_len = add_len
        else:
            current.append(line)
            current_len += add_len

    if current:
        chunks.append("\n".join(current))

    return chunks


def translate_text(text: str, cache: dict[str, str]) -> str:
    src = text.strip()
    if not src:
        return text

    key = normalize_for_cache(src)
    if key in cache:
        return cache[key]

    masked, masks = mask_sensitive(src)

    chunks = split_for_translation(masked)
    translated_chunks = []

    for chunk in chunks:
        max_retries = 5
        last_err = None
        translated_chunk = None
        for attempt in range(max_retries):
            try:
                translated_chunk = translate_http_once(chunk)
                break
            except Exception as err:  # noqa: BLE001
                last_err = err
                time.sleep(1.2 * (attempt + 1))

        if translated_chunk is None:
            print(f"TRANSLATE_FAIL: {chunk[:120]}", file=sys.stderr)
            if last_err:
                print(last_err, file=sys.stderr)
            translated_chunk = chunk

        translated_chunks.append(translated_chunk)

    translated = "\n".join(translated_chunks)
    translated = unmask_sensitive(translated, masks)
    cache[key] = translated
    return translated


def has_cyrillic(text: str) -> bool:
    return bool(re.search(r"[А-Яа-яЁё]", text))


def persist_all(paragraphs, rules, book_meta, map_nodes, items, enemies, cache):
    save_json(PARAGRAPHS_PATH, paragraphs)
    save_json(RULES_PATH, rules)
    save_json(BOOK_META_PATH, book_meta)
    save_json(MAP_NODES_PATH, map_nodes)
    save_json(ITEMS_PATH, items)
    save_json(ENEMIES_PATH, enemies)
    save_json(CACHE_PATH, cache)


def main():
    paragraphs = load_json(PARAGRAPHS_PATH)
    rules = load_json(RULES_PATH)
    book_meta = load_json(BOOK_META_PATH)
    map_nodes = load_json(MAP_NODES_PATH)
    items = load_json(ITEMS_PATH)
    enemies = load_json(ENEMIES_PATH)

    cache = {}
    if CACHE_PATH.exists():
        cache = load_json(CACHE_PATH)

    total = len(paragraphs)
    for i, p in enumerate(paragraphs, start=1):
        original = p.get("textOriginal", "")
        if not original and p.get("textHe"):
            original = p["textHe"]
            p["textOriginal"] = original

        title_text = p.get("title", "")
        if has_cyrillic(title_text):
            p["title"] = translate_text(title_text, cache)

        source_text = original or p.get("textHe", "")
        if has_cyrillic(source_text):
            p["textHe"] = translate_text(source_text, cache)
        else:
            p["textHe"] = source_text

        for idx, choice in enumerate(p.get("choices", []), start=1):
            target = choice.get("target")
            if isinstance(target, int):
                choice["label"] = f"עבור לפסקה {target}"
            else:
                label = choice.get("label", f"בחירה {idx}")
                choice["label"] = translate_text(label, cache) if has_cyrillic(label) else label

        if i % 10 == 0:
            print(f"TRANSLATE_PROGRESS {i}/{total}", flush=True)
            persist_all(paragraphs, rules, book_meta, map_nodes, items, enemies, cache)

    book_meta["titleHe"] = "חאר – עיר המלכודות"
    book_meta["language"] = "he"
    book_meta["rtl"] = True

    rules["titleHe"] = "חוקי המשחק: חאר – עיר המלכודות"
    rules["statsLabels"] = {
        "skill": "מיומנות",
        "stamina": "סיבולת",
        "luck": "מזל",
        "gold": "זהב",
        "food": "אספקה",
    }

    for node in map_nodes:
        node_name = node.get("nameHe", "")
        node["nameHe"] = translate_text(node_name, cache) if has_cyrillic(node_name) else node_name
        if node.get("descriptionHe"):
            desc = node["descriptionHe"]
            node["descriptionHe"] = translate_text(desc, cache) if has_cyrillic(desc) else desc

    for item in items:
        name = item.get("nameHe", "")
        desc = item.get("descriptionHe", "")
        item["nameHe"] = translate_text(name, cache) if has_cyrillic(name) else name
        item["descriptionHe"] = translate_text(desc, cache) if has_cyrillic(desc) else desc

    for enemy in enemies:
        name = enemy.get("nameHe", "")
        enemy["nameHe"] = translate_text(name, cache) if has_cyrillic(name) else name

    persist_all(paragraphs, rules, book_meta, map_nodes, items, enemies, cache)
    print(f"TRANSLATE_OK paragraphs={len(paragraphs)} cache={len(cache)}", flush=True)


if __name__ == "__main__":
    main()
