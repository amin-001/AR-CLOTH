"""
face_analysis.py
=================
Combines the two face-level detectors from the original project:

  - DeepFace (age + gender), from Detector.py
  - ITA / Monk-scale skin tone estimation, from Skin_tone.py

into a single call that the unified API can use alongside the body
measurement engine.
"""

from dataclasses import dataclass, asdict

import cv2

from skin_tone import analyze_skin_tone, SkinToneResult


@dataclass
class FaceAnalysis:
    age: int
    gender: str                 # "Man" | "Woman" (DeepFace's own labels)
    gender_normalized: str       # "male" | "female" - used to query measurement engine / products
    gender_confidence: float
    skin_tone: SkinToneResult

    def to_dict(self):
        d = asdict(self)
        d["skin_tone"] = asdict(self.skin_tone)
        return d


def _normalize_gender(deepface_label: str) -> str:
    label = deepface_label.strip().lower()
    if label.startswith("m"):
        return "male"
    if label.startswith("w") or label.startswith("f"):
        return "female"
    return "neutral"


def analyze_face(image_path: str) -> FaceAnalysis:
    """
    Args:
        image_path: path to a JPG/PNG file on disk (DeepFace needs a path,
                    same as in the original Detector.py).

    Returns:
        FaceAnalysis

    Raises:
        ValueError if no face / image could not be read.
    """
    from deepface import DeepFace

    bgr_image = cv2.imread(image_path)
    if bgr_image is None:
        raise ValueError(f"Could not read image at {image_path}")

    analysis = DeepFace.analyze(
        img_path=image_path,
        actions=["age", "gender"],
        enforce_detection=True,
        detector_backend="opencv",
    )
    result = analysis[0] if isinstance(analysis, list) else analysis

    gender_scores = result["gender"]
    dominant_gender = result["dominant_gender"]
    gender_confidence = round(gender_scores[dominant_gender], 1)

    skin = analyze_skin_tone(bgr_image)

    return FaceAnalysis(
        age=int(result["age"]),
        gender=dominant_gender,
        gender_normalized=_normalize_gender(dominant_gender),
        gender_confidence=gender_confidence,
        skin_tone=skin,
    )
