import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, AlertCircle } from "lucide-react";
import type { AnalyzeResponse, ApiError, Product } from "@/lib/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001";

/* ────────────────────────────────────────────────────────────────────────
   UploadForm — Upload Image card + Details card (height, event)
   ──────────────────────────────────────────────────────────────────────── */

interface UploadFormProps {
  onSubmit: (file: File, heightCm: string, event: string) => void;
  isLoading: boolean;
}

function UploadForm({ onSubmit, isLoading }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [heightCm, setHeightCm] = useState("");
  const [event, setEvent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setHeightCm("");
    setEvent("");
    setValidationError(null);
  }

  function handleSubmit() {
    if (!file) {
      setValidationError("Please choose a photo first.");
      return;
    }
    if (!heightCm) {
      setValidationError("Please enter your height in cm.");
      return;
    }
    if (!event.trim()) {
      setValidationError("Please enter an event or occasion (e.g. wedding, office, gym).");
      return;
    }
    setValidationError(null);
    onSubmit(file, heightCm, event.trim());
  }

  return (
    <div className="space-y-4 text-slate-100">
      <Card className="border border-slate-700/70 bg-[#071c2d]/90 text-slate-100 shadow-lg shadow-sky-950/20">
        <CardHeader>
          <CardTitle>Upload Image</CardTitle>
          <CardDescription>Choose a clear, front-facing, full-body photo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <label className="w-full">
              <div className="flex h-64 w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/80 transition-colors duration-300 hover:border-primary">
                {preview ? (
                  <img src={preview} alt="preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">No image selected</div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="sr-only"
              />
            </label>
            <div className="flex w-full gap-2">
              <Button
                onClick={() => fileRef.current?.click()}
                className="h-11 flex-1 bg-sky-500 text-black hover:bg-sky-400"
              >
                Choose Image
              </Button>
              <Button
                onClick={reset}
                className="h-11 bg-sky-500 text-black hover:bg-sky-400"
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-700/70 bg-[#071c2d]/90 text-slate-100 shadow-lg shadow-sky-950/20">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Your height and the occasion you're shopping for.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              min={100}
              max={230}
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="e.g. 175"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="event">Event / occasion</Label>
            <Input
              id="event"
              type="text"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              placeholder="e.g. wedding, office, gym, casual outing"
              className="mt-2"
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3">
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="h-11 w-full bg-sky-500 text-black hover:bg-sky-400 font-semibold"
          >
            {isLoading ? "Analyzing…" : "Details & Recommendations"}
          </Button>
          {validationError && <p className="text-sm text-destructive">{validationError}</p>}
          <p className="text-xs leading-relaxed text-muted-foreground">
            Estimates only — accuracy depends on lighting, pose, and photo
            quality. Photos are processed for this analysis and not stored
            beyond the request.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   MeasurementsPanel — "Body Measurements" card: measurements grid only
   ──────────────────────────────────────────────────────────────────────── */

interface MeasurementsPanelProps {
  data: AnalyzeResponse;
}

const MEASUREMENTS: { key: keyof AnalyzeResponse["measurements"]; label: string }[] = [
  { key: "height_cm", label: "Height" },
  { key: "shoulder_width_cm", label: "Shoulder" },
  { key: "waist_circumference_cm", label: "Waist" },
  { key: "arm_length_cm", label: "Arm length" },
  { key: "chest_circumference_cm", label: "Chest" },
  { key: "hip_circumference_cm", label: "Hip" },
  { key: "inseam_cm", label: "Inseam" },
  { key: "torso_length_cm", label: "Torso" },
  { key: "neck_circumference_cm", label: "Neck" },
  { key: "thigh_circumference_cm", label: "Thigh" },
];

const cmToInch = (cm: number) => (cm * 0.393701).toFixed(1);

function MeasurementsPanel({ data }: MeasurementsPanelProps) {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const { measurements: m, sizing } = data;
  const { face } = data;
  const annotatedSrc = data.annotated_image_b64
    ? `data:image/jpeg;base64,${data.annotated_image_b64}`
    : null;

  return (
    <>
      <Card className="border border-slate-700/70 bg-[#071c2d]/90 text-slate-100 shadow-lg shadow-sky-950/20">
        <CardHeader>
          <CardTitle>Body Measurements</CardTitle>
          <CardDescription>
            Recommended size: <span className="font-semibold text-foreground">{sizing.recommended_size}</span>
            {" · "}confidence {data.confidence_pct}%
            <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>Age: <strong className="text-foreground">{face.age ? `${face.age} years` : "N/A"}</strong></span>
              <span>Gender: <strong className="capitalize text-foreground">{face.gender || "N/A"}</strong></span>
              <span>Skin tone: <strong className="text-foreground">{face.skin_tone?.fitzpatrick_label || "N/A"}</strong></span>
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {MEASUREMENTS.map(({ key, label }) => {
              const cm = m[key];
              return (
                <div key={key} className="rounded-2xl border border-slate-700/70 bg-slate-950/70 p-4 text-center shadow-sm">
                  <div className="text-xs font-semibold text-muted-foreground uppercase">{label}</div>
                  <div className="mt-2 text-lg font-semibold">{cm ? `${cm} cm` : "N/A"}</div>
                  <div className="text-xs text-muted-foreground">{cm ? `${cmToInch(cm)} in` : ""}</div>
                </div>
              );
            })}
          </div>

          {annotatedSrc && (
            <div className="mt-5">
              <div
                onClick={() => setIsImageOpen(true)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-700/70 bg-[#0b1f32]/80 shadow-sm transition-shadow hover:shadow-md"
              >
                <img src={annotatedSrc} alt="Pose landmarks used for measurement" className="h-48 w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="rounded-full bg-secondary/90 px-3 py-1 text-sm font-semibold">
                    View full image
                  </span>
                </div>
              </div>
            </div>
          )}

          {data.warnings?.length > 0 && (
            <div className="mt-4 rounded-2xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {data.warnings.map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Body measurement annotation</DialogTitle>
          </DialogHeader>
          {annotatedSrc && (
            <img src={annotatedSrc} alt="Pose landmarks used for measurement" className="w-full rounded-2xl" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   RecommendationsPanel — product grid: tag chips, "View product" button
   ──────────────────────────────────────────────────────────────────────── */

interface RecommendationsPanelProps {
  data: AnalyzeResponse;
}

function TagRow({ label, values }: { label: string; values?: unknown }) {
  const list = Array.isArray(values) ? values.filter((v) => typeof v === "string" || typeof v === "number") : [];
  if (list.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs text-muted-foreground">{label}:</span>
      {list.map((v, i) => (
        <span key={i} className="rounded-md bg-secondary px-2 py-1 text-xs">
          {String(v)}
        </span>
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const image =
    (product.display_images && product.display_images[0]) ||
    (Array.isArray(product.images) ? product.images[0] : undefined);
  const name = product.display_name || product.name || "Untitled item";
  const price = product.display_price ?? product.price;
  const url = product.display_url;

  function goToProduct() {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-700/70 bg-[#0a1d2d]/80 shadow-lg shadow-sky-950/10">
      <button
        type="button"
        onClick={goToProduct}
        disabled={!url}
        className="relative mx-3 mt-3 flex h-48 overflow-hidden rounded-xl disabled:cursor-default"
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary text-xs text-muted-foreground">
            No image
          </div>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-3">
        <button type="button" onClick={goToProduct} disabled={!url} className="text-left disabled:cursor-default">
          <h5 className="text-base font-semibold leading-snug">{name}</h5>
        </button>

        <div className="flex flex-col gap-2">
          <TagRow label="Sizes" values={product.sizes} />
          <TagRow label="Colors" values={product.colors} />
        </div>

        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="font-mono text-sm text-muted-foreground">
            {product.brand ? `${product.brand}` : ""}
            {price ? ` · $${price}` : ""}
          </span>
          <span className="font-mono text-[10px] text-primary">match {product.match_score}</span>
        </div>

        <button
          type="button"
          onClick={goToProduct}
          disabled={!url}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-sky-500 px-5 py-2.5 text-center text-sm font-medium text-black transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingBag className="h-4 w-4" />
          {url ? "View product" : "No link available"}
        </button>
      </div>
    </div>
  );
}

function RecommendationsPanel({ data }: RecommendationsPanelProps) {
  return (
    <Card className="border border-slate-700/70 bg-[#071c2d]/90 text-slate-100 shadow-lg shadow-sky-950/20">
      <CardHeader>
        <CardTitle>Recommended Products</CardTitle>
        <CardDescription>
          Matching your size, gender, skin tone{data.event ? `, and event: "${data.event}"` : ""}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.recommendations_error ? (
          <div className="flex gap-3 rounded-2xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="mb-1 font-medium">Couldn't load recommendations</p>
              <p>{data.recommendations_error}</p>
            </div>
          </div>
        ) : data.recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No matching products found in the catalog yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.recommendations.map((p, i) => (
              <ProductCard key={p._id ?? i} product={p} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   App — layout + API call + state
   ──────────────────────────────────────────────────────────────────────── */

export default function App() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleAnalyze(file: File, heightCm: string, event: string) {
    setIsLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append("file", file);
    form.append("height_cm", heightCm);
    form.append("event", event);

    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as AnalyzeResponse | ApiError;

      if (!res.ok || "error" in data) {
        setError("error" in data ? data.error : "Analysis failed.");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? `Network error: ${err.message}` : "Network error.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020d1a] text-white">
      <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-72" />

      <div className="relative mx-auto max-w-6xl p-6 pb-16">
        <div className="mb-6 rounded-[2rem] border border-sky-400/20 bg-[#0c1d2d]/95 p-8 shadow-xl shadow-sky-950/30 backdrop-blur-xl">
          
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-white">
            Image AI Outfit Finder
          </h1>
          <p className="mt-3 max-w-2xl text-slate-100">
            Upload a full-body photo, your height, and the occasion — we'll
            estimate your age, gender, skin tone, and body measurements,
            then match products from the catalog.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <aside>
            <UploadForm onSubmit={handleAnalyze} isLoading={isLoading} />
          </aside>

          <main className="space-y-6 lg:col-span-2">
            {!result && !isLoading && !error && (
              <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-dashed border-border font-mono text-sm text-muted-foreground">
                Body measurements and analysis will appear here
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-card/90 p-7 backdrop-blur-xl">
                <Skeleton className="h-6 w-40" />
                <div className="grid grid-cols-3 gap-4">
                  {Array(9).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              </div>
            )}

            {error && !isLoading && (
              <div className="rounded-3xl border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive">
                {error}
              </div>
            )}

            {result && !isLoading && (
              <MeasurementsPanel data={result} />
            )}
          </main>
        </div>

        {result && !isLoading && (
          <div className="mt-8 space-y-6">
            <RecommendationsPanel data={result} />
          </div>
        )}
      </div>
    </div>
  );
}
