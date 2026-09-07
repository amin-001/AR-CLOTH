# Avatar Asset Detector — Setup & Usage

A local Python service that identifies which catalog assets an avatar is wearing,
using CLIP embeddings for image similarity matching.

---

## 1. Prerequisites

- Python 3.9+ (3.10 recommended)
- pip
- Git

---

## 2. Create a virtual environment

```bash
# Create venv
python -m venv venv

# crete with version (3.10 recommended)


# Activate (Mac/Linux)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate
```

---

## 3. Install dependencies

```bash
pip install -r requirements.txt
```

> First run downloads the CLIP model weights (~340 MB). This only happens once.

---

## 4. Prepare your catalog images

Create this folder structure next to `main.py`:

```
catalog_images/
  head/
    red_cap__id_001.png
    blue_hat__id_002.png
  torso/
    white_shirt__id_003.png
    black_hoodie__id_004.png
  legs/
    dark_jeans__id_005.png
  feet/
    white_sneakers__id_006.png
```

**Naming rule:** `<any_descriptive_name>__<asset_id>.<ext>`
- Double underscore `__` separates name from ID
- Asset ID is what gets returned in the API response
- Supported formats: `.png`, `.jpg`, `.jpeg`, `.webp`

If your filenames don't have `__`, the whole filename becomes the asset ID.

---

## 5. Start the service

```bash
python main.py
```

You should see:
```
[startup] Loading CLIP model 'ViT-B/32' on cpu ...
[startup] No catalog index found — call POST /build-catalog first
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Auto-reload is on — any change to `main.py` restarts the server automatically.

---

## 6. Postman — Step by step

### Step A: Build the catalog (run once, or after adding new assets)

| Field    | Value                          |
|----------|--------------------------------|
| Method   | `POST`                         |
| URL      | `http://localhost:8000/build-catalog` |
| Body     | none                           |

Expected response:
```json
{
  "status": "ok",
  "assets_indexed": 6,
  "errors": [],
  "catalog_file": "catalog.pt"
}
```

---

### Step B: Identify assets in an avatar image

| Field        | Value                              |
|--------------|------------------------------------|
| Method       | `POST`                             |
| URL          | `http://localhost:8000/identify`   |
| Body type    | `form-data`                        |
| Key          | `file` (type: File)                |
| Value        | *(select your avatar PNG)*         |

Expected response:
```json
{
  "status": "ok",
  "avatar_size": { "width": 512, "height": 512 },
  "matches": {
    "head":  { "asset_id": "id_001", "name": "red cap",       "confidence": 0.9134 },
    "torso": { "asset_id": "id_003", "name": "white shirt",   "confidence": 0.8871 },
    "legs":  { "asset_id": "id_005", "name": "dark jeans",    "confidence": 0.8543 },
    "feet":  { "asset_id": null,     "name": null,            "confidence": 0.7210 }
  }
}
```

`asset_id: null` means no match met the confidence threshold (0.82 by default).

---

### Step C: Debug mode — see crop boundaries

| Field        | Value                                   |
|--------------|-----------------------------------------|
| Method       | `POST`                                  |
| URL          | `http://localhost:8000/identify-raw`    |
| Body type    | `form-data`                             |
| Key          | `file` (type: File)                     |

Returns the same matches plus the pixel crop coordinates used — useful for tuning
the `CROP_REGIONS` ratios in `main.py`.

---

### Step D: List indexed catalog assets

| Field  | Value                              |
|--------|------------------------------------|
| Method | `GET`                              |
| URL    | `http://localhost:8000/catalog`    |

---

### Step E: Health check

| Field  | Value                             |
|--------|-----------------------------------|
| Method | `GET`                             |
| URL    | `http://localhost:8000/health`    |

---

## 7. Tuning

### Adjust crop regions
In `main.py`, edit `CROP_REGIONS` — values are `(left%, top%, right%, bottom%)` as fractions of image size:

```python
CROP_REGIONS = {
    "head":   (0.20, 0.00, 0.80, 0.32),
    "torso":  (0.10, 0.28, 0.90, 0.62),
    "legs":   (0.10, 0.58, 0.90, 0.82),
    "feet":   (0.10, 0.80, 0.90, 1.00),
}
```

Use `/identify-raw` to see current crop pixel coords and adjust.

### Confidence threshold
Lower = more permissive (more matches, more false positives)
Higher = more strict (fewer matches, higher precision)

```python
CONFIDENCE_THRESHOLD = 0.82   # good starting point
```

### Upgrade to a more accurate model
```python
CLIP_MODEL = "ViT-L/14"   # ~900 MB, noticeably more accurate
```
Remember to delete `catalog.pt` and rebuild after changing the model.

### Multiple reference images per asset
Put multiple images of the same asset in the same slot folder with the same asset ID:

```
torso/
  white_shirt_front__id_003.png
  white_shirt_zoomed__id_003.png   ← same ID, different angle
```

The service averages their embeddings automatically if you add this to `build_catalog()`:
```python
# Group by asset_id and average embeddings
# (extend build_catalog() in main.py if needed)
```

---

## 8. Interactive API docs

FastAPI ships with auto-generated docs — open in browser:

```
http://localhost:8000/docs
```

You can test all endpoints directly from the browser without Postman.

---

## File structure

```
avatar_asset_service/
  main.py              ← FastAPI service
  requirements.txt     ← dependencies
  README.md            ← this file
  catalog.pt           ← auto-generated after /build-catalog
  catalog_images/      ← your reference asset images (you create this)
    head/
    torso/
    legs/
    feet/
```
