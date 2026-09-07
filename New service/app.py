"""
Unified Flask API — Face + Body Analysis + Clothing Recommendation
====================================================================
Single endpoint that:
  1. Takes an uploaded photo + the user's height
  2. Detects age, gender, and skin tone (DeepFace + ITA/Monk scale)
  3. Estimates body measurements (MediaPipe + SMPL-approx)
  4. Recommends clothing from MongoDB based on gender, size, and skin tone

Endpoints:
  POST /api/analyze     — full pipeline: photo + height_cm + event -> analysis + recommendations
  GET  /api/health       — liveness probe
  GET  /api/size-guide   — standard size chart
  GET  /                 — serves the built React frontend (frontend/dist)

Run:
  pip install -r requirements.txt
  cp .env.example .env   # fill in MONGO_URI if not already set
  cd ../frontend && npm install && npm run build && cd ../backend
  python3 app.py
"""

import os
import tempfile
import logging

from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify, send_from_directory

from face_analysis import analyze_face
from measurement_engine import analyse_image, MeasurementResult
from recommend import recommend_products

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("app")

FRONTEND_DIST = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist"
)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB max upload


@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response


@app.route("/api/analyze", methods=["OPTIONS"])
def analyze_preflight():
    return "", 204


@app.route("/api/analyze", methods=["POST"])
def analyze():
    """
    Accepts multipart/form-data with:
      - file        : image (JPEG/PNG) — required
      - height_cm   : float, user's known height — required
      - event       : occasion/event, e.g. "wedding", "office", "gym", "casual outing" — required
      - complexity  : (optional) 0|1|2, MediaPipe model complexity
      - limit       : (optional) max number of recommended products (default 12)
    """
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Use form-data key 'file'."}), 400

    img_file = request.files["file"]
    if img_file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    allowed = {"image/jpeg", "image/png", "image/webp"}
    ct = img_file.content_type or ""
    if ct not in allowed and not img_file.filename.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
        return jsonify({"error": f"Unsupported image type: {ct}"}), 415

    height_raw = request.form.get("height_cm", "").strip()
    if not height_raw:
        return jsonify({"error": "height_cm is required."}), 400
    try:
        height_cm = float(height_raw)
    except ValueError:
        return jsonify({"error": "height_cm must be a number."}), 400

    event = request.form.get("event", "").strip()
    if not event:
        return jsonify({"error": "event is required (e.g. 'wedding', 'office', 'gym')."}), 400

    try:
        complexity = int(request.form.get("complexity", 2))
        complexity = max(0, min(2, complexity))
    except ValueError:
        complexity = 2

    try:
        limit = int(request.form.get("limit", 12))
    except ValueError:
        limit = 12

    image_bytes = img_file.read()

    # DeepFace / skin tone need a file path; measurement engine takes raw bytes.
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name

        # ── Stage 1: face analysis (age, gender, skin tone) ──────────────
        try:
            face = analyze_face(tmp_path)
        except ValueError as e:
            return jsonify({"error": f"Face analysis failed: {e}"}), 422

        # ── Stage 2: body measurements, using detected gender ────────────
        measurements: MeasurementResult = analyse_image(
            image_bytes,
            user_height_cm=height_cm,
            gender=face.gender_normalized,
            model_complexity=complexity,
        )

        # ── Stage 3: clothing recommendations from MongoDB ───────────────
        try:
            recommendations = recommend_products(
                gender=face.gender_normalized,
                size_label=measurements.size_label,
                monk_scale=face.skin_tone.monk_scale,
                event=event,
                limit=limit,
            )
            rec_error = None
        except Exception as e:
            log.exception("Recommendation lookup failed")
            recommendations = []
            rec_error = str(e)

    except Exception as exc:
        log.exception("Analysis pipeline failed")
        return jsonify({"error": f"Analysis failed: {exc}"}), 500
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)

    payload = {
        "face": {
            "age": face.age,
            "gender": face.gender,
            "gender_confidence_pct": face.gender_confidence,
            "skin_tone": {
                "fitzpatrick_label": face.skin_tone.fitzpatrick_label,
                "fitzpatrick_type": face.skin_tone.fitzpatrick_type,
                "monk_scale": face.skin_tone.monk_scale,
                "monk_rgb": face.skin_tone.monk_rgb,
                "ita_degrees": face.skin_tone.ita_degrees,
                "mean_rgb": face.skin_tone.mean_rgb,
            },
        },
        "measurements": {
            "height_cm": measurements.height_cm,
            "shoulder_width_cm": measurements.shoulder_width_cm,
            "chest_circumference_cm": measurements.chest_circumference_cm,
            "waist_circumference_cm": measurements.waist_circumference_cm,
            "hip_circumference_cm": measurements.hip_circumference_cm,
            "inseam_cm": measurements.inseam_cm,
            "torso_length_cm": measurements.torso_length_cm,
            "arm_length_cm": measurements.arm_length_cm,
            "neck_circumference_cm": measurements.neck_circumference_cm,
            "thigh_circumference_cm": measurements.thigh_circumference_cm,
        },
        "sizing": {
            "recommended_size": measurements.size_label,
            "bmi_estimate": measurements.bmi_estimate,
        },
        "confidence_pct": measurements.confidence,
        "warnings": measurements.warnings,
        "annotated_image_b64": measurements.annotated_image_b64,
        "event": event,
        "recommendations": recommendations,
        "recommendations_error": rec_error,
        "disclaimer": (
            "Age, gender, skin tone, and body measurements are model estimates, "
            "not verified facts. Accuracy varies with lighting, pose, and image quality."
        ),
    }

    return jsonify(payload), 200


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "engine": "DeepFace+ITA/Monk+MediaPipe+SMPL-approx v1.0"}), 200


SIZE_GUIDE = {
    "male": [
        {"size": "XS", "chest": "80-88", "waist": "64-72", "hip": "84-92"},
        {"size": "S", "chest": "88-96", "waist": "72-80", "hip": "92-100"},
        {"size": "M", "chest": "96-104", "waist": "80-88", "hip": "100-108"},
        {"size": "L", "chest": "104-112", "waist": "88-96", "hip": "108-116"},
        {"size": "XL", "chest": "112-120", "waist": "96-104", "hip": "116-124"},
        {"size": "2XL", "chest": "120-128", "waist": "104-112", "hip": "124-132"},
        {"size": "3XL", "chest": "128+", "waist": "112+", "hip": "132+"},
    ],
    "female": [
        {"size": "XS", "chest": "76-84", "waist": "60-68", "hip": "84-92"},
        {"size": "S", "chest": "84-92", "waist": "68-76", "hip": "92-100"},
        {"size": "M", "chest": "92-100", "waist": "76-84", "hip": "100-108"},
        {"size": "L", "chest": "100-108", "waist": "84-92", "hip": "108-116"},
        {"size": "XL", "chest": "108-116", "waist": "92-100", "hip": "116-124"},
        {"size": "2XL", "chest": "116+", "waist": "100+", "hip": "124+"},
    ],
}


@app.route("/api/size-guide", methods=["GET"])
def size_guide():
    gender = request.args.get("gender", "male").lower()
    guide = SIZE_GUIDE.get(gender, SIZE_GUIDE["male"])
    return jsonify({"gender": gender, "unit": "cm", "guide": guide}), 200


# ── Serve the frontend ──────────────────────────────────────────────────────
@app.route("/", methods=["GET"])
def index():
    return send_from_directory(FRONTEND_DIST, "index.html")


@app.route("/assets/<path:filename>", methods=["GET"])
def assets(filename):
    return send_from_directory(os.path.join(FRONTEND_DIST, "assets"), filename)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))

    print("\n🔎 Checking MongoDB connection...")
    try:
        from recommend import get_collection
        get_collection()  # triggers the connectivity + document-count diagnostic log
        print("   (see log line above for collection/document status)\n")
    except Exception as e:
        print(f"   ⚠️  MongoDB check failed: {e}\n")

    print(f"🚀 Unified analysis + recommendation API running on http://localhost:{port}")
    print("   POST /api/analyze    — upload photo + height_cm -> full analysis + recommendations")
    print("   GET  /api/health     — health check")
    print("   GET  /api/size-guide — size chart")
    print("   GET  /               — frontend UI\n")
    app.run(host="0.0.0.0", port=port, debug=False)
