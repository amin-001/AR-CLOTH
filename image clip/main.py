import io
import os
import json
import torch
import clip
import numpy as np
from PIL import Image
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# ─────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────
CATALOG_DIR   = Path("catalog_images")   # folder with your asset reference images
CATALOG_INDEX = Path("catalog.pt")       # pre-built embedding index (auto-generated)
CONFIDENCE_THRESHOLD = 0.82              # lower = more lenient matching
CLIP_MODEL = "ViT-B/32"                 # swap to "ViT-L/14" for higher accuracy (slower)

# Avatar crop regions as (left%, top%, right%, bottom%) fractions
# Tune these ratios to match your avatar's layout
CROP_REGIONS = {
    "head":   (0.20, 0.00, 0.80, 0.32),
    "torso":  (0.10, 0.28, 0.90, 0.62),
    "legs":   (0.10, 0.58, 0.90, 0.82),
    "feet":   (0.10, 0.80, 0.90, 1.00),
}

# ─────────────────────────────────────────────
# Globals (loaded once at startup)
# ─────────────────────────────────────────────
model       = None
preprocess  = None
catalog     = {}   # { asset_id: { "embedding": Tensor, "slot": str, "name": str } }

app = FastAPI(title="Avatar Asset Detector", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Startup: load CLIP + catalog
# ─────────────────────────────────────────────
@app.on_event("startup")
def startup():
    global model, preprocess, catalog

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[startup] Loading CLIP model '{CLIP_MODEL}' on {device} ...")
    model, preprocess = clip.load(CLIP_MODEL, device=device)
    model.eval()

    if CATALOG_INDEX.exists():
        print(f"[startup] Loading pre-built catalog from {CATALOG_INDEX}")
        catalog = torch.load(CATALOG_INDEX, map_location=device)
        print(f"[startup] Catalog loaded: {len(catalog)} assets")
    else:
        print("[startup] No catalog index found — call POST /build-catalog first")


# ─────────────────────────────────────────────
# Helper: encode a PIL image to a unit vector
# ─────────────────────────────────────────────
def encode_image(pil_img: Image.Image) -> torch.Tensor:
    device = next(model.parameters()).device
    tensor = preprocess(pil_img.convert("RGB")).unsqueeze(0).to(device)
    with torch.no_grad():
        emb = model.encode_image(tensor).float()
    return emb / emb.norm(dim=-1, keepdim=True)   # L2-normalise → cosine sim = dot product


# ─────────────────────────────────────────────
# Helper: crop avatar image into body regions
# ─────────────────────────────────────────────
def crop_regions(img: Image.Image) -> dict:
    w, h = img.size
    crops = {}
    for slot, (l, t, r, b) in CROP_REGIONS.items():
        box = (int(l * w), int(t * h), int(r * w), int(b * h))
        crops[slot] = img.crop(box)
    return crops


# ─────────────────────────────────────────────
# Helper: find best matching asset for a crop
# ─────────────────────────────────────────────
def find_best_match(crop_emb: torch.Tensor, slot: str):
    best_id, best_score, best_name = None, -1.0, None

    for asset_id, meta in catalog.items():
        # only compare same slot (if catalog has slot info), or compare all
        if meta.get("slot") and meta["slot"] != slot:
            continue

        score = (crop_emb @ meta["embedding"].T).item()
        if score > best_score:
            best_score = score
            best_id    = asset_id
            best_name  = meta.get("name", asset_id)

    if best_score >= CONFIDENCE_THRESHOLD:
        return {"asset_id": best_id, "name": best_name, "confidence": round(best_score, 4)}
    return {"asset_id": None, "name": None, "confidence": round(best_score, 4)}


# ─────────────────────────────────────────────
# POST /build-catalog
# Reads catalog_images/ folder, encodes each image, saves catalog.pt
#
# Expected folder structure:
#   catalog_images/
#     head/
#       hat_red__id_001.png
#       cap_blue__id_002.png
#     torso/
#       shirt_white__id_003.png
#     legs/
#       jeans_dark__id_004.png
#     feet/
#       sneakers_black__id_005.png
#
# File name format: <any_name>__<asset_id>.<ext>
# The slot is determined by the parent folder name.
# ─────────────────────────────────────────────
@app.post("/build-catalog")
def build_catalog():
    global catalog

    if not CATALOG_DIR.exists():
        raise HTTPException(
            status_code=400,
            detail=f"Catalog directory '{CATALOG_DIR}' not found. "
                   f"Create it and add sub-folders: head/, torso/, legs/, feet/"
        )

    new_catalog = {}
    errors = []

    for slot_dir in sorted(CATALOG_DIR.iterdir()):
        if not slot_dir.is_dir():
            continue
        slot = slot_dir.name   # head | torso | legs | feet

        for img_path in sorted(slot_dir.glob("*")):
            if img_path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
                continue

            # Parse asset_id from filename: <name>__<id>.ext
            stem = img_path.stem
            if "__" in stem:
                name, asset_id = stem.rsplit("__", 1)
            else:
                name = stem
                asset_id = stem

            try:
                img = Image.open(img_path)
                emb = encode_image(img)
                new_catalog[asset_id] = {
                    "embedding": emb,
                    "slot": slot,
                    "name": name.replace("_", " "),
                    "file": str(img_path),
                }
                print(f"  ✓ [{slot}] {name} → {asset_id}")
            except Exception as e:
                errors.append({"file": str(img_path), "error": str(e)})
                print(f"  ✗ {img_path}: {e}")

    torch.save(new_catalog, CATALOG_INDEX)
    catalog = new_catalog

    return {
        "status": "ok",
        "assets_indexed": len(new_catalog),
        "errors": errors,
        "catalog_file": str(CATALOG_INDEX),
    }


# ─────────────────────────────────────────────
# POST /identify
# Upload an avatar image → returns matched asset IDs per body slot
# ─────────────────────────────────────────────
@app.post("/identify")
async def identify(file: UploadFile = File(...)):
    if not catalog:
        raise HTTPException(
            status_code=400,
            detail="Catalog is empty. Call POST /build-catalog first."
        )

    # Read uploaded image
    try:
        raw = await file.read()
        img = Image.open(io.BytesIO(raw)).convert("RGBA")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot read image: {e}")

    # Crop avatar into body regions
    crops = crop_regions(img)

    # Match each crop against catalog
    results = {}
    for slot, crop in crops.items():
        crop_emb = encode_image(crop)
        results[slot] = find_best_match(crop_emb, slot)

    return JSONResponse({
        "status": "ok",
        "avatar_size": {"width": img.width, "height": img.height},
        "matches": results,
    })


# ─────────────────────────────────────────────
# POST /identify-raw
# Same as /identify but also returns crop dimensions (useful for debugging)
# ─────────────────────────────────────────────
@app.post("/identify-raw")
async def identify_raw(file: UploadFile = File(...)):
    if not catalog:
        raise HTTPException(status_code=400, detail="Catalog empty. Run /build-catalog first.")

    raw = await file.read()
    img = Image.open(io.BytesIO(raw)).convert("RGBA")
    crops = crop_regions(img)

    results = {}
    w, h = img.size
    for slot, (l, t, r, b) in CROP_REGIONS.items():
        crop = crops[slot]
        crop_emb = encode_image(crop)
        match = find_best_match(crop_emb, slot)
        results[slot] = {
            **match,
            "crop_box_px": {
                "left": int(l * w), "top": int(t * h),
                "right": int(r * w), "bottom": int(b * h),
            },
        }

    return JSONResponse({"status": "ok", "matches": results})


# ─────────────────────────────────────────────
# GET /catalog
# List all indexed assets
# ─────────────────────────────────────────────
@app.get("/catalog")
def list_catalog():
    return {
        "total": len(catalog),
        "assets": [
            {"asset_id": aid, "name": m.get("name"), "slot": m.get("slot"), "file": m.get("file")}
            for aid, m in catalog.items()
        ],
    }


# ─────────────────────────────────────────────
# GET /health
# ─────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": CLIP_MODEL,
        "catalog_size": len(catalog),
        "threshold": CONFIDENCE_THRESHOLD,
    }


# ─────────────────────────────────────────────
# Run
# ─────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
