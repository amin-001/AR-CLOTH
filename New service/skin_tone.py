"""
skin_tone.py

Detects skin tone from a face photo using a dermatology-standard technique:

1. Locate the face with OpenCV's Haar cascade (no extra model download needed).
2. Within the face box, isolate skin-colored pixels with an HSV/YCrCb mask
   (this filters out eyes, hair, background, shadows, etc).
3. Average the remaining pixels in CIE-Lab color space.
4. Compute the Individual Typology Angle (ITA):

       ITA = atan((L* - 50) / b*) * 180 / pi

   ITA is a standard, lighting-normalized measure of skin tone used in
   dermatology and skin-tone-in-imaging research. Higher ITA = lighter skin,
   lower/negative ITA = darker skin.
5. Map the ITA value to both a 6-point Fitzpatrick-like scale and the
   10-point Google Monk Skin Tone (MST) scale, which is the more modern,
   inclusive standard used in a lot of recent CV fairness work.

This module has no dependency on DeepFace - it only needs OpenCV + numpy,
so it stays lightweight and fast.
"""

from dataclasses import dataclass
import math
import cv2
import numpy as np

# Haar cascade shipped with opencv-python - no separate download required.
_FACE_CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# ITA thresholds (degrees) -> Fitzpatrick-like labels.
# These are the commonly cited boundaries from skin-tone-classification literature.
_ITA_BANDS = [
    (55, "Very Light", "I"),
    (41, "Light", "II"),
    (28, "Intermediate", "III"),
    (10, "Tan", "IV"),
    (-30, "Brown", "V"),
    (-float("inf"), "Dark", "VI"),
]

# Approximate Monk Skin Tone (MST) swatch RGB values (1-10, light to dark).
# Used to snap our estimated color to the nearest official MST scale point.
_MONK_SWATCHES = [
    (1, (246, 237, 228)),
    (2, (243, 231, 219)),
    (3, (247, 234, 208)),
    (4, (234, 218, 186)),
    (5, (215, 189, 150)),
    (6, (160, 126, 86)),
    (7, (130, 92, 67)),
    (8, (96, 65, 52)),
    (9, (58, 49, 42)),
    (10, (41, 36, 32)),
]


@dataclass
class SkinToneResult:
    mean_rgb: tuple
    ita_degrees: float
    fitzpatrick_label: str
    fitzpatrick_type: str
    monk_scale: int
    monk_rgb: tuple
    face_box: tuple  # (x, y, w, h)


def _detect_face_box(bgr_image: np.ndarray):
    gray = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    faces = _FACE_CASCADE.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=6, minSize=(80, 80)
    )
    if len(faces) == 0:
        return None
    # Take the largest detected face (by area) in case of multiple faces.
    faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
    return tuple(faces[0])


def _skin_mask(bgr_face: np.ndarray) -> np.ndarray:
    """Combine HSV + YCrCb thresholds, the standard two-space approach for
    robust skin segmentation under varied lighting/skin colors."""
    hsv = cv2.cvtColor(bgr_face, cv2.COLOR_BGR2HSV)
    ycrcb = cv2.cvtColor(bgr_face, cv2.COLOR_BGR2YCrCb)

    lower_hsv = np.array([0, 15, 40], dtype=np.uint8)
    upper_hsv = np.array([35, 180, 255], dtype=np.uint8)
    mask_hsv = cv2.inRange(hsv, lower_hsv, upper_hsv)

    lower_ycrcb = np.array([0, 135, 85], dtype=np.uint8)
    upper_ycrcb = np.array([255, 180, 135], dtype=np.uint8)
    mask_ycrcb = cv2.inRange(ycrcb, lower_ycrcb, upper_ycrcb)

    mask = cv2.bitwise_and(mask_hsv, mask_ycrcb)

    # Shrink toward the center of the face box a bit and erode to reduce
    # picking up hair/background/eyebrows at the edges.
    h, w = mask.shape[:2]
    center_mask = np.zeros_like(mask)
    cv2.ellipse(
        center_mask,
        (w // 2, int(h * 0.55)),
        (int(w * 0.32), int(h * 0.42)),
        0,
        0,
        360,
        255,
        -1,
    )
    mask = cv2.bitwise_and(mask, center_mask)
    mask = cv2.erode(mask, np.ones((3, 3), np.uint8), iterations=1)
    return mask


def _closest_monk_swatch(rgb: tuple):
    best_idx, best_dist = 1, float("inf")
    for idx, swatch in _MONK_SWATCHES:
        dist = sum((a - b) ** 2 for a, b in zip(rgb, swatch))
        if dist < best_dist:
            best_dist, best_idx, best_rgb = dist, idx, swatch
    return best_idx, best_rgb


def analyze_skin_tone(bgr_image: np.ndarray) -> SkinToneResult:
    """
    Args:
        bgr_image: image as loaded by cv2.imread (BGR channel order).

    Returns:
        SkinToneResult, or raises ValueError if no face is found.
    """
    box = _detect_face_box(bgr_image)
    if box is None:
        raise ValueError("No face detected in image.")

    x, y, w, h = box
    face = bgr_image[y : y + h, x : x + w]

    mask = _skin_mask(face)
    skin_pixels = face[mask > 0]

    if skin_pixels.size == 0:
        # Fallback: just use the whole face box if the mask was too strict.
        skin_pixels = face.reshape(-1, 3)

    mean_bgr = skin_pixels.mean(axis=0)
    mean_rgb = (float(mean_bgr[2]), float(mean_bgr[1]), float(mean_bgr[0]))

    # Convert the single averaged color to Lab for the ITA formula.
    swatch_bgr = np.uint8([[[mean_bgr[0], mean_bgr[1], mean_bgr[2]]]])
    lab = cv2.cvtColor(swatch_bgr, cv2.COLOR_BGR2Lab)[0][0]
    # OpenCV Lab: L in [0,255] -> scale to [0,100]; a,b centered at 128.
    L = float(lab[0]) * 100.0 / 255.0
    b_star = float(lab[2]) - 128.0

    # Avoid divide-by-zero for near-neutral b*.
    b_star = b_star if abs(b_star) > 1e-6 else 1e-6
    ita = math.degrees(math.atan((L - 50.0) / b_star))

    label, ftype = next(lbl for lbl in _ITA_BANDS if ita >= lbl[0])[1:]

    monk_idx, monk_rgb = _closest_monk_swatch(mean_rgb)

    return SkinToneResult(
        mean_rgb=tuple(round(c) for c in mean_rgb),
        ita_degrees=round(ita, 1),
        fitzpatrick_label=label,
        fitzpatrick_type=ftype,
        monk_scale=monk_idx,
        monk_rgb=monk_rgb,
        face_box=box,
    )