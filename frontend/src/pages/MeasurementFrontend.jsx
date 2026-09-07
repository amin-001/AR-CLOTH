import { useState, useRef, useCallback } from "react";

// ── Design system ─────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:    #0a0a0f;
    --paper:  #f4f1eb;
    --clay:   #c8b89a;
    --rust:   #c4501a;
    --sage:   #4a7c6f;
    --slate:  #2d3a4a;
    --mist:   #e8e4dc;
    --glow:   #ffde8a;
    --r:      8px;
  }

  body {
    font-family: 'Syne', sans-serif;
    background: var(--paper);
    color: var(--ink);
    min-height: 100vh;
    overflow-x: hidden;
  }

  .mono { font-family: 'DM Mono', monospace; }

  /* Header */
  .header {
    padding: 28px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1.5px solid var(--ink);
    background: var(--paper);
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .logo { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
  .logo span { color: var(--rust); }
  .badge {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    background: var(--ink);
    color: var(--glow);
    padding: 4px 12px;
    border-radius: 100px;
    letter-spacing: 0.5px;
  }

  /* Layout */
  .main { max-width: 1200px; margin: 0 auto; padding: 48px 24px; }
  .hero { text-align: center; margin-bottom: 56px; }
  .hero h1 {
    font-size: clamp(36px, 6vw, 72px);
    font-weight: 800;
    line-height: 0.95;
    letter-spacing: -2px;
    color: var(--ink);
  }
  .hero h1 em { font-style: normal; color: var(--rust); }
  .hero p {
    margin-top: 20px;
    font-size: 16px;
    color: #5a5a68;
    max-width: 520px;
    margin-inline: auto;
    line-height: 1.6;
    font-family: 'DM Mono', monospace;
    font-weight: 300;
  }

  /* Upload area */
  .upload-zone {
    border: 2px dashed var(--clay);
    border-radius: var(--r);
    padding: 56px 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--mist);
    position: relative;
    overflow: hidden;
  }
  .upload-zone:hover, .upload-zone.dragging {
    border-color: var(--rust);
    background: #ede9e0;
  }
  .upload-zone .icon { font-size: 48px; margin-bottom: 16px; }
  .upload-zone h3 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
  .upload-zone p  { font-size: 13px; color: #7a7a88; font-family: 'DM Mono', monospace; }

  /* Preview */
  .preview-wrap {
    position: relative;
    border-radius: var(--r);
    overflow: hidden;
    border: 1.5px solid var(--ink);
  }
  .preview-wrap img { width: 100%; display: block; max-height: 420px; object-fit: cover; }
  .preview-change {
    position: absolute;
    bottom: 12px;
    right: 12px;
    background: var(--ink);
    color: var(--paper);
    border: none;
    padding: 8px 16px;
    border-radius: 100px;
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .preview-change:hover { background: var(--rust); }

  /* Form inputs */
  .inputs-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 20px;
  }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--slate);
    font-family: 'DM Mono', monospace;
  }
  .field input, .field select {
    background: var(--mist);
    border: 1.5px solid var(--clay);
    border-radius: 6px;
    padding: 10px 14px;
    font-family: 'DM Mono', monospace;
    font-size: 14px;
    color: var(--ink);
    outline: none;
    transition: border-color 0.2s;
  }
  .field input:focus, .field select:focus { border-color: var(--rust); }

  /* CTA button */
  .cta {
    width: 100%;
    margin-top: 20px;
    padding: 16px;
    background: var(--ink);
    color: var(--glow);
    border: none;
    border-radius: 8px;
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .cta:hover:not(:disabled) { background: var(--rust); color: white; }
  .cta:disabled { opacity: 0.5; cursor: not-allowed; }

  /* API notice */
  .api-note {
    margin-top: 12px;
    padding: 10px 14px;
    background: #fff8e8;
    border: 1px solid var(--glow);
    border-radius: 6px;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: #7a6000;
    line-height: 1.5;
  }

  /* Loading spinner */
  .spinner {
    width: 20px;
    height: 20px;
    border: 2.5px solid rgba(255,222,138,0.3);
    border-top-color: var(--glow);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Results panel */
  .results {
    animation: fadeUp 0.4s ease;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .results-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 1.5px solid var(--ink);
  }
  .results-header h2 { font-size: 28px; font-weight: 800; letter-spacing: -1px; }
  .confidence-pill {
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    padding: 6px 16px;
    border-radius: 100px;
    font-weight: 500;
  }
  .conf-high { background: #d4edda; color: #1a6630; }
  .conf-mid  { background: #fff3cd; color: #856404; }
  .conf-low  { background: #f8d7da; color: #721c24; }

  /* Size hero */
  .size-hero {
    background: var(--ink);
    color: var(--glow);
    border-radius: var(--r);
    padding: 32px;
    text-align: center;
    margin-bottom: 24px;
  }
  .size-hero .label { font-family: 'DM Mono', monospace; font-size: 12px; opacity: 0.7; letter-spacing: 1px; text-transform: uppercase; }
  .size-hero .value { font-size: 80px; font-weight: 800; line-height: 1; letter-spacing: -4px; margin: 8px 0; }
  .size-hero .sub   { font-family: 'DM Mono', monospace; font-size: 13px; opacity: 0.8; }

  /* Measurement grid */
  .meas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
  }
  .meas-card {
    background: var(--mist);
    border: 1.5px solid var(--clay);
    border-radius: var(--r);
    padding: 16px;
    transition: border-color 0.2s;
  }
  .meas-card:hover { border-color: var(--slate); }
  .meas-card .m-label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.5px;
    color: #7a7a88;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .meas-card .m-value { font-size: 26px; font-weight: 800; letter-spacing: -1px; color: var(--ink); }
  .meas-card .m-unit  { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--clay); }

  /* Annotated photo */
  .annotated-wrap {
    border: 1.5px solid var(--clay);
    border-radius: var(--r);
    overflow: hidden;
    margin-bottom: 24px;
  }
  .annotated-wrap img { width: 100%; display: block; max-height: 380px; object-fit: contain; background: #1a1a22; }
  .annotated-wrap .caption {
    padding: 10px 16px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #7a7a88;
    border-top: 1px solid var(--clay);
  }

  /* Warnings */
  .warnings { margin-bottom: 24px; }
  .warning-item {
    padding: 10px 14px;
    background: #fff8e8;
    border-left: 3px solid var(--glow);
    border-radius: 0 6px 6px 0;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: #7a5c00;
    margin-bottom: 8px;
    line-height: 1.5;
  }

  /* SMPL betas */
  .betas-wrap {
    background: #f0ede6;
    border: 1.5px solid var(--clay);
    border-radius: var(--r);
    padding: 20px;
    margin-bottom: 24px;
  }
  .betas-wrap h3 { font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 14px; color: var(--slate); }
  .betas-grid {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .beta-chip {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    background: var(--paper);
    border: 1px solid var(--clay);
    border-radius: 4px;
    padding: 4px 10px;
    color: var(--slate);
  }
  .beta-chip b { color: var(--rust); }

  /* Two-column layout */
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    gap: 32px;
    align-items: start;
  }

  /* Limitations banner */
  .limits {
    background: var(--slate);
    color: var(--mist);
    border-radius: var(--r);
    padding: 24px 28px;
    margin-top: 40px;
  }
  .limits h3 { font-size: 14px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; color: var(--glow); }
  .limits ul { list-style: none; }
  .limits li {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    padding: 5px 0;
    padding-left: 18px;
    position: relative;
    line-height: 1.5;
    opacity: 0.85;
  }
  .limits li::before { content: "→"; position: absolute; left: 0; color: var(--glow); }

  @media (max-width: 700px) {
    .two-col { grid-template-columns: 1fr; }
    .inputs-row { grid-template-columns: 1fr; }
    .header { padding: 20px; }
  }
`;

// ── Measurement metadata ──────────────────────────────────────────────────────
const MEASUREMENTS = [
  { key: "height_cm",              label: "Height",         icon: "↕" },
  { key: "shoulder_width_cm",      label: "Shoulder",       icon: "↔" },
  { key: "chest_circumference_cm", label: "Chest",          icon: "⊙" },
  { key: "waist_circumference_cm", label: "Waist",          icon: "⊘" },
  { key: "hip_circumference_cm",   label: "Hip",            icon: "◎" },
  { key: "inseam_cm",              label: "Inseam",         icon: "⬇" },
  { key: "torso_length_cm",        label: "Torso",          icon: "▭" },
  { key: "arm_length_cm",          label: "Arm Length",     icon: "↗" },
  { key: "neck_circumference_cm",  label: "Neck",           icon: "○" },
  { key: "thigh_circumference_cm", label: "Thigh",          icon: "◑" },
];

// ── Simulated response (when no backend is available) ─────────────────────────
function simulateAnalysis(heightCm, gender) {
  const base = gender === "female"
    ? { chest: 90, waist: 74, hip: 96 }
    : { chest: 98, waist: 82, hip: 98 };
  const h = parseFloat(heightCm) || 170;
  const scale = h / 170;
  return {
    success: true,
    measurements: {
      height_cm:              h,
      shoulder_width_cm:      Math.round(scale * (gender === "female" ? 37 : 42) * 10) / 10,
      chest_circumference_cm: Math.round(scale * base.chest * 10) / 10,
      waist_circumference_cm: Math.round(scale * base.waist * 10) / 10,
      hip_circumference_cm:   Math.round(scale * base.hip * 10) / 10,
      inseam_cm:              Math.round(scale * (gender === "female" ? 76 : 81) * 10) / 10,
      torso_length_cm:        Math.round(scale * 56 * 10) / 10,
      arm_length_cm:          Math.round(scale * 60 * 10) / 10,
      neck_circumference_cm:  Math.round(scale * (gender === "female" ? 33 : 38) * 10) / 10,
      thigh_circumference_cm: Math.round(scale * (gender === "female" ? 56 : 54) * 10) / 10,
    },
    sizing: { recommended_size: scale > 1.05 ? "L" : scale < 0.95 ? "S" : "M", bmi_estimate: 22.4 },
    smpl_betas: [0.12, -0.34, 0.56, -0.11, 0.08, 0.03, -0.02, 0.01, 0.00],
    confidence_pct: 78.3,
    warnings: [
      "DEMO MODE — backend not connected. Measurements are illustrative only.",
      "Connect the Flask backend (app.py) for real MediaPipe analysis.",
    ],
    annotated_image_b64: null,
  };
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function MeasurementFrontend() {
  const [image, setImage]       = useState(null);       // { file, url }
  const [height, setHeight]     = useState("170");
  const [gender, setGender]     = useState("neutral");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const API_BASE = "http://localhost:5001";

  const loadImage = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage({ file, url });
    setResult(null);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) loadImage(file);
  }, []);

  const analyse = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);

    try {
      const form = new FormData();
      form.append("file", image.file);
      form.append("height_cm", height || "170");
      form.append("gender", gender);
      form.append("complexity", "2");

      const res = await fetch(`${API_BASE}/api/measure`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult({ ...data, _demo: false });
    } catch {
      // Backend not available → show demo simulation
      const demo = simulateAnalysis(height, gender);
      setResult({ ...demo, _demo: true });
    } finally {
      setLoading(false);
    }
  };

  const confClass = (c) => c >= 70 ? "conf-high" : c >= 45 ? "conf-mid" : "conf-low";
  const confLabel = (c) => c >= 70 ? "High confidence" : c >= 45 ? "Medium confidence" : "Low confidence";

  return (
    <>
      <style>{styles}</style>

      {/* Header */}
      {/* <header className="header">
        <div className="logo">Body<span>Fit</span>.ai</div>
        <span className="badge">FYP · AI E-Commerce</span>
      </header> */}

      <main className="main">
        {/* Hero */}
        <section className="">
          <h1 className="text-3xl font-bold">Your perfect size,<br/>from a <em>single photo.</em></h1>
          <p>
            MediaPipe pose estimation + SMPL-inspired shape modelling
            extracts 10 body measurements from one image in seconds.
          </p>
        </section>

        {/* Two-column layout */}
        <div className="two-col">

          {/* LEFT — upload + controls */}
          <div>
            {!image ? (
              <div
                className={`upload-zone${dragging ? " dragging" : ""}`}
                onClick={() => fileRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <div className="icon">📷</div>
                <h3>Upload a full-body photo</h3>
                <p>JPEG · PNG · WebP · drag or click<br/>Best: neutral pose, plain background</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => loadImage(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="preview-wrap">
                <img src={image.url} alt="preview" />
                <button className="preview-change" onClick={() => { setImage(null); setResult(null); }}>
                  Change photo
                </button>
              </div>
            )}

            <div className="inputs-row">
              <div className="field">
                <label>Your Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  min="120" max="220"
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 170"
                />
              </div>
              <div className="field">
                <label>Gender (for sizing)</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="neutral">Neutral / Unisex</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <button className="cta" disabled={!image || loading} onClick={analyse}>
              {loading
                ? <><div className="spinner" /> Analysing body…</>
                : "→ Measure My Body"}
            </button>

            <div className="api-note">
              <b>To use real MediaPipe analysis:</b> run <code>python3 app.py</code> on
              localhost:5001. Without the backend, a demo simulation is shown so you
              can explore the UI.
            </div>

            {/* Limitations */}
            <div className="limits">
              <h3>Accuracy Notes</h3>
              <ul>
                <li>Single frontal photo: ±3–7 cm (depth ambiguity)</li>
                <li>With height provided: ±2–4 cm</li>
                <li>Front + side inputs: ±1–3 cm (future roadmap)</li>
                <li>Plain background + neutral pose improves detection</li>
                <li>Circumferences use SMPL-linear model + ellipse geometry</li>
                <li>Thigh/neck are model-estimated, not directly measured</li>
              </ul>
            </div>
          </div>

          {/* RIGHT — results */}
          <div>
            {!result && !loading && (
              <div style={{ color: "#aaa", textAlign: "center", paddingTop: 80, fontFamily: "'DM Mono', monospace", fontSize: 14 }}>
                Upload a photo and tap Measure →<br/>
                <span style={{ fontSize: 48, display: "block", marginTop: 24 }}>🧍</span>
              </div>
            )}

            {loading && (
              <div style={{ textAlign: "center", paddingTop: 80 }}>
                <div className="spinner" style={{ margin: "0 auto 20px", width: 40, height: 40, borderWidth: 4, borderTopColor: "var(--rust)", borderColor: "rgba(196,80,26,0.2)" }} />
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#888" }}>
                  Running pose detection + measurement extraction…
                </p>
              </div>
            )}

            {result && (
              <div className="results">
                <div className="results-header">
                  <h2>{result._demo ? "Demo Results" : "Your Measurements"}</h2>
                  <span className={`confidence-pill ${confClass(result.confidence_pct)}`}>
                    {confLabel(result.confidence_pct)} — {result.confidence_pct}%
                  </span>
                </div>

                {/* Warnings */}
                {result.warnings?.length > 0 && (
                  <div className="warnings">
                    {result.warnings.map((w, i) => (
                      <div key={i} className="warning-item">⚠ {w}</div>
                    ))}
                  </div>
                )}

                {/* Annotated photo */}
                {(() => {
                  const raw =
                    result?.annotated_image_b64 ??
                    result?.annotated_image ??
                    result?.annotated_image_base64;
                  const src = raw
                    ? raw.startsWith("data:")
                      ? raw
                      : `data:image/jpeg;base64,${raw}`
                    : null;

                  return src ? (
                    <div className="annotated-wrap">
                      <img src={src} alt="annotated pose" />
                      <div className="caption">
                        Green dots = MediaPipe landmarks · Yellow = connections · Blue = measurement lines
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Size hero */}
                <div className="size-hero">
                  <div className="label">Recommended Size</div>
                  <div className="value">{result.sizing?.recommended_size}</div>
                  <div className="sub">
                    Chest {result.measurements?.chest_circumference_cm} cm ·
                    Waist {result.measurements?.waist_circumference_cm} cm ·
                    Hip {result.measurements?.hip_circumference_cm} cm
                  </div>
                </div>

                {/* Measurement grid */}
                <div className="meas-grid">
                  {MEASUREMENTS.map(({ key, label, icon }) => {
                    const val = result.measurements?.[key];
                    return (
                      <div key={key} className="meas-card">
                        <div className="m-label">{icon} {label}</div>
                        <div className="m-value">{val ?? "–"}</div>
                        <div className="m-unit">cm</div>
                      </div>
                    );
                  })}
                </div>

                {/* SMPL betas */}
                {result.smpl_betas?.length > 0 && (
                  <div className="betas-wrap">
                    <h3>SMPL Shape Parameters (β-vector)</h3>
                    <div className="betas-grid">
                      {result.smpl_betas.map((b, i) => (
                        <div key={i} className="beta-chip">
                          β{i}: <b>{b > 0 ? "+" : ""}{b}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
