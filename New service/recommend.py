# backend/recommend.py — replace the entire file with this

"""
recommend.py
=============
Queries the 'product' collection (in the 'test' database, per MONGO_URI)
and ranks products against the detected gender, recommended size, and
skin tone of the uploaded photo.

Schema assumptions (adjust the field names below to match your actual
'product' documents — these are the common e-commerce field names):

    {
        "name": str,
        "brand": str,
        "category": str,           # e.g. "shirt", "dress", "jeans"
        "gender": str,              # "male" | "female" | "unisex"
        "sizes": [str, ...],        # e.g. ["S", "M", "L"]
        "colors": [str, ...],       # e.g. ["navy", "olive", "white"]
        "price": number,
        "images": [str, ...],       # URLs
        "age_group": str,           # optional: "adult" | "teen" | "kids"
    }

If your documents use different field names, update FIELD_* constants
below rather than rewriting the query/scoring logic.
"""

import os
import re
import json
import logging
from typing import Optional

from pymongo import MongoClient
from bson import ObjectId

log = logging.getLogger("recommend")

# ── Field name mapping (edit to match your real schema) ───────────────────
FIELD_GENDER = "gender"
FIELD_SIZES = "sizes"
FIELD_COLORS = "colors"
FIELD_AGE_GROUP = "age_group"
# Additional fields consulted for free-text prompt matching. Any of these
# that are missing on a document are simply skipped - safe to leave as-is
# even if your schema only has some of them.
FIELD_NAME = "name"
FIELD_BRAND = "brand"
FIELD_CATEGORY = "category"
FIELD_TAGS = "tags"
FIELD_DESCRIPTION = "description"
FIELD_OCCASION = "occasion"

DB_NAME = os.environ.get("MONGO_DB_NAME", "test")
COLLECTION_NAME = os.environ.get("MONGO_COLLECTION_NAME", "products")

_client: Optional[MongoClient] = None
_checked_collection = False

_STOPWORDS = {
    "a", "an", "the", "for", "to", "of", "with", "in", "on", "at", "and",
    "or", "me", "my", "i", "want", "need", "looking", "something", "some",
    "please", "recommend", "suggest", "wear", "outfit", "clothes", "clothing",
}

# Occasion / style keyword expansion so a prompt like "summer wedding"
# also matches products tagged "formal", "linen", "light", etc. without
# needing an LLM. Extend freely as you learn your catalog's vocabulary.
_KEYWORD_EXPANSIONS = {
    
     "eid": ["eid", "eid al-fitr", "eid al-adha"] ,
  "wedding": ["wedding", "marriage", "bridal", "groom"] ,
  "party": ["party", "celebration", "celebrate", "event"],
   "traditional": ["traditional", "culture", "cultural", "heritage"] ,
   "casual": ["casual", "everyday", "informal"],
   "formal": ["formal", "business", "office", "professional"] ,
   "sports": ["sports", "athletic", "exercise", "workout"] ,
   "mehendi": ["mehendi", "Dolki", "dolki", "pithi"] 
}


def get_collection():
    global _client, _checked_collection
    if _client is None:
        uri = os.environ.get("MONGO_URI")
        if not uri:
            raise RuntimeError(
                "MONGO_URI is not set. Add it to your .env file (see .env.example)."
            )
        _client = MongoClient(uri)

    coll = _client[DB_NAME][COLLECTION_NAME]

    if not _checked_collection:
        _checked_collection = True
        try:
            count = coll.count_documents({})
        except Exception as e:
            log.error("Could not reach MongoDB collection '%s.%s': %s", DB_NAME, COLLECTION_NAME, e)
            raise
        if count == 0:
            all_collections = _client[DB_NAME].list_collection_names()
            log.warning(
                "Configured collection '%s.%s' has 0 documents. "
                "Collections that actually exist in database '%s': %s. "
                "Set MONGO_COLLECTION_NAME in .env to the correct one if it's not '%s'.",
                DB_NAME, COLLECTION_NAME, DB_NAME, all_collections, COLLECTION_NAME,
            )
        else:
            log.info("Connected to '%s.%s' — %d documents found.", DB_NAME, COLLECTION_NAME, count)

    return coll


# ── Skin-tone -> color palette heuristic ───────────────────────────────────
_MONK_PALETTES = {
    range(1, 4):  ["pastel", "light blue", "lavender", "soft pink", "mint", "cream", "beige"],
    range(4, 7):  ["olive", "mustard", "rust", "denim", "camel", "terracotta", "forest green"],
    range(7, 11): ["burgundy", "emerald", "royal blue", "black", "white", "gold", "crimson"],
}


def _palette_for_monk_scale(monk_scale: int):
    for band, palette in _MONK_PALETTES.items():
        if monk_scale in band:
            return palette
    return []


def _size_score(product_sizes, target_size: str) -> float:
    if not product_sizes:
        return 0.0
    sizes = [str(s).upper() for s in product_sizes]
    order = ["XS", "S", "M", "L", "XL", "2XL", "3XL"]
    if target_size.upper() in sizes:
        return 2.0
    if target_size.upper() in order:
        idx = order.index(target_size.upper())
        for s in sizes:
            if s in order and abs(order.index(s) - idx) == 1:
                return 1.0
    return 0.0


def _color_score(product_colors, palette) -> float:
    if not product_colors or not palette:
        return 0.0
    product_colors_lc = {str(c).lower() for c in product_colors}
    palette_lc = {p.lower() for p in palette}
    return float(len(product_colors_lc & palette_lc))


def _heuristic_keywords(prompt: str) -> list:
    tokens = re.findall(r"[a-zA-Z']+", prompt.lower())
    keywords = {t for t in tokens if t not in _STOPWORDS and len(t) > 2}
    expanded = set(keywords)
    for tok in keywords:
        if tok in _KEYWORD_EXPANSIONS:
            expanded.update(_KEYWORD_EXPANSIONS[tok])
    return sorted(expanded)


def _llm_keywords(prompt: str) -> Optional[list]:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": (
                    "Extract 3-10 short shopping keywords (occasion, style, "
                    "category, color) from this request. Respond ONLY with "
                    f"a JSON array of lowercase strings, nothing else.\n\nRequest: {prompt}"
                ),
            }],
        )
        text = "".join(b.text for b in resp.content if getattr(b, "type", None) == "text")
        keywords = json.loads(text.strip().strip("`"))
        if isinstance(keywords, list):
            return [str(k).lower() for k in keywords]
    except Exception as e:
        log.warning("LLM keyword extraction unavailable, using heuristic fallback: %s", e)
    return None


def _extract_prompt_keywords(prompt: str) -> list:
    if not prompt or not prompt.strip():
        return []
    return _llm_keywords(prompt) or _heuristic_keywords(prompt)


def _document_haystack(doc: dict) -> str:
    parts = []
    for key, val in doc.items():
        if key == "_id":
            continue
        if isinstance(val, str):
            parts.append(val.lower())
        elif isinstance(val, (list, tuple)):
            parts.extend(str(v).lower() for v in val if isinstance(v, (str, int, float)))
        elif isinstance(val, dict):
            for sub_val in val.values():
                if isinstance(sub_val, str):
                    parts.append(sub_val.lower())
    return " ".join(parts)


def _prompt_score(doc: dict, keywords: list) -> float:
    if not keywords:
        return 0.0
    haystack = _document_haystack(doc)
    if not haystack:
        return 0.0
    return float(sum(1 for kw in keywords if kw in haystack))


def _find_field(doc: dict, name_substrings: list, value_types=(str, int, float)):
    for key, val in doc.items():
        key_lc = key.lower()
        if any(sub in key_lc for sub in name_substrings) and isinstance(val, value_types):
            if isinstance(val, str) and not val.strip():
                continue
            return val
    return None


def _find_list_field(doc: dict, name_substrings: list):
    for key, val in doc.items():
        key_lc = key.lower()
        if any(sub in key_lc for sub in name_substrings) and isinstance(val, (list, tuple)) and val:
            return list(val)
    return None


def _serialize(doc: dict) -> dict:
    doc = dict(doc)
    if "_id" in doc and isinstance(doc["_id"], ObjectId):
        doc["_id"] = str(doc["_id"])

    doc["display_name"] = (
        _find_field(doc, ["name", "title"]) or doc.get(FIELD_NAME) or "Untitled item"
    )
    doc["display_price"] = _find_field(doc, ["price", "cost", "mrp", "amount"])
    doc["display_url"] = _find_field(doc, ["producturl", "product_url", "url", "link", "href"])
    images = _find_list_field(doc, ["image", "img", "photo", "picture"])
    if not images:
        single_image = _find_field(doc, ["image", "img", "photo", "picture"])
        images = [single_image] if single_image else []
    doc["display_images"] = images

    return doc


def recommend_products(
    gender: str,
    size_label: str,
    monk_scale: int,
    event: str,
    limit: int = 12,
    candidate_pool: int = 300,
) -> list:
    coll = get_collection()

    total_count = coll.count_documents({})
    if total_count == 0:
        all_collections = _client[DB_NAME].list_collection_names()
        counts = {name: _client[DB_NAME][name].count_documents({}) for name in all_collections}
        raise RuntimeError(
            f"Collection '{DB_NAME}.{COLLECTION_NAME}' has 0 documents. "
            f"Collections that actually exist in database '{DB_NAME}': {counts}. "
            f"Set MONGO_COLLECTION_NAME in backend/.env to the correct name and restart the app."
        )

    gender = (gender or "neutral").lower()
    query = {}
    if gender in ("male", "female"):
        query[FIELD_GENDER] = {"$in": [gender, "unisex", None]}

    candidates = list(coll.find(query).limit(candidate_pool))

    if not candidates:
        log.warning("No products matched gender filter %s, falling back to unfiltered query.", gender)
        candidates = list(coll.find({}).limit(candidate_pool))

    palette = _palette_for_monk_scale(monk_scale)
    keywords = _extract_prompt_keywords(event)

    if event:
        log.info("Event %r -> keywords: %s", event, keywords)
    log.info("Scoring %d candidate products (gender filter=%s)", len(candidates), gender)

    scored = []
    for doc in candidates:
        s_score = _size_score(doc.get(FIELD_SIZES), size_label)
        c_score = _color_score(doc.get(FIELD_COLORS), palette)
        p_score = _prompt_score(doc, keywords)
        scored.append((s_score, c_score, p_score, doc))

    matched = [row for row in scored if row[2] > 0]

    if keywords:
        if matched:
            pool = matched
        else:
            log.warning(
                "Event keywords %s matched NOTHING in any of %d products - "
                "falling back to gender/size/color ranking only. Run "
                "debug_recommend.py to check your catalog's text fields.",
                keywords, len(candidates),
            )
            pool = scored
    else:
        pool = scored

    ranked = sorted(
        pool,
        key=lambda row: (row[0] * 2 + row[2] * 2 + row[1]),
        reverse=True,
    )

    results = []
    for s_score, c_score, p_score, doc in ranked[:limit]:
        item = _serialize(doc)
        item["match_score"] = round(s_score * 2 + p_score * 2 + c_score, 2)
        results.append(item)

    log.info("Top result scores: %s", [r["match_score"] for r in results[:5]])
    return results