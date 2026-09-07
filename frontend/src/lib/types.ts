export interface SkinTone {
  fitzpatrick_label: string;
  fitzpatrick_type: string;
  monk_scale: number;
  monk_rgb: [number, number, number];
  ita_degrees: number;
  mean_rgb: [number, number, number];
}

export interface FaceAnalysis {
  age: number;
  gender: string;
  gender_confidence_pct: number;
  skin_tone: SkinTone;
}

export interface Measurements {
  height_cm: number;
  shoulder_width_cm: number;
  chest_circumference_cm: number;
  waist_circumference_cm: number;
  hip_circumference_cm: number;
  inseam_cm: number;
  torso_length_cm: number;
  arm_length_cm: number;
  neck_circumference_cm: number;
  thigh_circumference_cm: number;
}

export interface Sizing {
  recommended_size: string;
  bmi_estimate: number;
}

export interface Product {
  _id?: string;
  name?: string;
  brand?: string;
  price?: number;
  images?: string[];
  match_score: number;
  display_name?: string;
  display_price?: number | string;
  display_url?: string;
  display_images?: string[];
  [key: string]: unknown;
}

export interface AnalyzeResponse {
  face: FaceAnalysis;
  measurements: Measurements;
  sizing: Sizing;
  confidence_pct: number;
  warnings: string[];
  annotated_image_b64?: string;
  event: string;
  recommendations: Product[];
  recommendations_error?: string | null;
  disclaimer: string;
}

export interface ApiError {
  error: string;
}
