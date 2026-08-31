"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Aperture,
  Check,
  ChevronDown,
  Crosshair,
  Eye,
  Grid3X3,
  Info,
  Layers3,
  Minus,
  Plus,
  RotateCcw,
  ScanSearch,
  Signal,
  ShieldAlert as ShieldAlertIcon,
  Target,
  Thermometer,
  Waves,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import type { SimState } from "../lib/simulation";

type ViewMode = "thermal" | "night" | "fused" | "review";

type Tone = "green" | "cyan" | "amber" | "red" | "slate";

const tone: Record<Tone, string> = {
  green: "text-emerald-400",
  cyan: "text-cyan-400",
  amber: "text-amber-400",
  red: "text-red-400",
  slate: "text-slate-400",
};

const toneBorder: Record<Tone, string> = {
  green: "border-emerald-500/25",
  cyan: "border-cyan-500/25",
  amber: "border-amber-500/25",
  red: "border-red-500/30",
  slate: "border-slate-700/60",
};

const toneBg: Record<Tone, string> = {
  green: "bg-emerald-500/8",
  cyan: "bg-cyan-500/8",
  amber: "bg-amber-500/8",
  red: "bg-red-500/8",
  slate: "bg-slate-800/20",
};

type CamerasProps = {
  state: SimState;
  onOpenSLAM?: () => void;
  onOpenAtmosphere?: () => void;
  onOpenSafety?: () => void;
};

export default function Cameras({
  state,
  onOpenSLAM,
  onOpenAtmosphere,
  onOpenSafety,
}: CamerasProps) {
  const [view, setView] = useState<ViewMode>("fused");
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [showDetections, setShowDetections] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showPipeline, setShowPipeline] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(
    state.detection.person_detected ? "survivor" : "none",
  );

  const detected = state.detection.person_detected;

  useEffect(() => {
    setSelectedTarget((current) =>
      detected ? current : "none",
    );
  }, [detected]);

  const thermalPass =
    state.detection.thermal_confidence > 0.6;

  const nvPass =
    state.detection.nv_confidence > 0.6;

  const co2Pass =
    state.detection.co2_spike > 0.6;

  const evidenceCount = [thermalPass, nvPass, co2Pass].filter(
    Boolean,
  ).length;

  const decisionTone: Tone = detected
    ? "red"
    : evidenceCount >= 1
      ? "amber"
      : "green";

  const targetConfidence = detected
    ? Math.round(state.detection.thermal_confidence * 100)
    : 0;

  const targetLocation = detected
    ? "ZONE D · 35,20"
    : "NO ACTIVE TARGET";

  const viewMeta = useMemo(() => {
    if (view === "thermal") {
      return {
        label: "THERMAL IR",
        sensor: "MLX90640",
        resolution: "32 × 24",
        color: "amber" as Tone,
      };
    }

    if (view === "night") {
      return {
        label: "NIGHT VISION",
        sensor: "ACTIVE IR / 850nm",
        resolution: "MONO",
        color: "cyan" as Tone,
      };
    }

    if (view === "review") {
      return {
        label: "DETECTION REVIEW",
        sensor: "MULTIMODAL EVIDENCE",
        resolution: "ANALYSIS",
        color: "red" as Tone,
      };
    }

    return {
      label: "FUSED VIEW",
      sensor: "THERMAL + ACTIVE IR",
      resolution: "REGISTERED",
      color: "green" as Tone,
    };
  }, [view]);

  function increaseZoom() {
    setZoom((value) => Math.min(2.5, Number((value + 0.25).toFixed(2))));
  }

  function decreaseZoom() {
    setZoom((value) => Math.max(0.75, Number((value - 0.25).toFixed(2))));
  }

  function resetView() {
    setZoom(1);
    setShowGrid(true);
    setShowDetections(true);
    setShowHotspots(true);
  }

  return (
    <div className="rakshak-camera space-y-4 pb-2">
      <style jsx global>{`
        .rakshak-camera [class*="rounded"] { border-radius: 0 !important; }
        .rakshak-camera [class*="shadow"] { box-shadow: none !important; }
        .rakshak-camera [class*="text-[6px]"] { font-size: 9px !important; }
        .rakshak-camera [class*="text-[7px]"] { font-size: 10px !important; }
        .rakshak-camera [class*="text-[8px]"] { font-size: 11px !important; }
        .rakshak-camera [class*="text-[9px]"] { font-size: 12px !important; }
      `}</style>

      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#2a353d] pb-4">
        <div>
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
            VISION OPERATIONS
          </div>
          <h1 className="mt-1 text-[28px] font-semibold text-slate-100">
            Live Video &amp; Thermal
          </h1>
          <div className="mt-1 text-[11px] text-slate-500">
            Live IR video feed / continuous mission state
          </div>
        </div>
        <div className="font-mono text-[8px] font-bold uppercase tracking-wider text-slate-500">
          T+{formatMissionTime(state.t)}
        </div>
      </header>

      {/* PRIMARY LIVE VIDEO — SINGLE IR / NIGHT-VISION FEED */}
      <section className="w-full">
        <LiveCameraPanel
          state={state}
          channel="front"
          title="LIVE VIDEO / IR NIGHT VISION"
          subtitle="PRIMARY LIVE FEED"
        />
      </section>

      {/* Operator workstation */}
      <section className="grid overflow-hidden border border-[#2a353d] bg-[#0a1014] xl:grid-cols-[minmax(0,1fr)_355px]">
        <div className="min-w-0 border-b border-[#26323a] xl:border-b-0 xl:border-r">
          <div className="flex items-center gap-2 border-b border-[#26323a] bg-[#0d1419] px-4 py-3">
            <span className={`h-2 w-2 ${detected ? "bg-red-300" : "bg-emerald-300"}`} />
            <span className={`font-mono text-[9px] font-bold uppercase tracking-wider ${tone[viewMeta.color]}`}>
              {viewMeta.label}
            </span>
            <span className="font-mono text-[8px] uppercase tracking-wider text-slate-600">
              {viewMeta.sensor}
            </span>

            <div className="ml-auto flex items-center gap-1">
              <ToolButton active={showGrid} onClick={() => setShowGrid((v) => !v)} title="Grid"><Grid3X3 size={13} /></ToolButton>
              <ToolButton active={showDetections} onClick={() => setShowDetections((v) => !v)} title="Detections"><Target size={13} /></ToolButton>
              <ToolButton active={showHotspots} onClick={() => setShowHotspots((v) => !v)} title="Hotspots"><Aperture size={13} /></ToolButton>
              <ToolButton onClick={decreaseZoom} title="Zoom out"><ZoomOut size={13} /></ToolButton>
              <span className="min-w-[42px] text-center font-mono text-[8px] text-slate-500">{Math.round(zoom * 100)}%</span>
              <ToolButton onClick={increaseZoom} title="Zoom in"><ZoomIn size={13} /></ToolButton>
              <ToolButton onClick={resetView} title="Reset"><RotateCcw size={13} /></ToolButton>
            </div>
          </div>

          <div className="relative min-h-[520px]">
            <CameraViewport
              state={state}
              view={view}
              zoom={zoom}
              showGrid={showGrid}
              showDetections={showDetections}
              showHotspots={showHotspots}
              selectedTarget={selectedTarget}
              onSelectTarget={setSelectedTarget}
            />
            <HeadingWidget heading={state.slam.rover.heading} />
          </div>
        </div>

        <aside className="bg-[#0b1217] p-4">
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
            TARGET ASSESSMENT
          </div>

          <div className={`mt-3 border-l-4 p-4 ${
            decisionTone === "red"
              ? "border-red-300 bg-[#151112]"
              : decisionTone === "amber"
                ? "border-amber-300 bg-[#14130d]"
                : "border-emerald-300 bg-[#0e1511]"
          }`}>
            <div className="font-mono text-[8px] uppercase tracking-wider text-slate-500">CURRENT STATE</div>
            <div className={`mt-2 text-[21px] font-black ${tone[decisionTone]}`}>
              {detected ? "PERSON DETECTED" : "AREA SCANNING"}
            </div>
            <div className="mt-2 text-[10px] leading-relaxed text-slate-400">
              {detected
                ? "Potential survivor candidate. Verify against independent evidence."
                : "No active person candidate in the current field of view."}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <MetricBlock label="CONFIDENCE" value={detected ? `${targetConfidence}%` : "--"} tone={detected ? "red" : "slate"} />
            <MetricBlock label="EVIDENCE" value={`${evidenceCount} / 3`} tone={evidenceCount >= 2 ? "green" : evidenceCount === 1 ? "amber" : "slate"} />
            <MetricBlock label="LOCATION" value={targetLocation} tone="cyan" />
            <MetricBlock label="HEADING" value={`${state.slam.rover.heading.toFixed(0)}°`} tone="cyan" />
          </div>

          <div className="mt-4">
            <div className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
              EVIDENCE CHANNELS
            </div>
            <EvidenceLine label="THERMAL" value={`${Math.round(state.detection.thermal_confidence * 100)}%`} passed={thermalPass} detail="thermal sensor" />
            <EvidenceLine label="NIGHT VISION" value={`${Math.round(state.detection.nv_confidence * 100)}%`} passed={nvPass} detail="visual structure" />
            <EvidenceLine label="CO₂ SIGNAL" value={`${Math.round(state.detection.co2_spike * 100)}%`} passed={co2Pass} detail="atmospheric cue" />
          </div>

          <div className="mt-4 border border-[#26323a] bg-[#080e12] p-3">
            <div className="font-mono text-[8px] uppercase text-slate-600">DECISION THRESHOLD</div>
            <div className={`mt-2 text-[10px] font-bold uppercase ${state.detection.two_of_three ? "text-emerald-300" : "text-amber-300"}`}>
              {state.detection.two_of_three ? "2 / 3 AGREEMENT SATISFIED" : "ADDITIONAL EVIDENCE REQUIRED"}
            </div>
          </div>
        </aside>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-[1.15fr_1fr]">
        <div className="border border-[#2a353d] bg-[#0b1116] p-4">
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">VIEW MODE</div>
          <div className="mt-3 grid grid-cols-4 gap-1">
            <ViewButton active={view === "thermal"} onClick={() => setView("thermal")} icon={<Thermometer size={13} />} label="THERMAL" sub="MLX90640" />
            <ViewButton active={view === "night"} onClick={() => setView("night")} icon={<Eye size={13} />} label="NIGHT" sub="850nm IR" />
            <ViewButton active={view === "fused"} onClick={() => setView("fused")} icon={<Layers3 size={13} />} label="FUSED" sub="REGISTERED" />
            <ViewButton active={view === "review"} onClick={() => setView("review")} icon={<Crosshair size={13} />} label="REVIEW" sub={detected ? "TARGET" : "CLEAR"} alert={detected} />
          </div>
        </div>

        <div className="border border-[#2a353d] bg-[#0b1116] p-4">
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">SENSOR TELEMETRY</div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
            <CameraTelemetry label="THERMAL" value="32×24" />
            <CameraTelemetry label="NIGHT VISION" value="850 nm" />
            <CameraTelemetry label="FOV" value="55°×35°" />
            <CameraTelemetry label="HOTSPOTS" value={`${state.detection.hotspots.length}`} />
            <CameraTelemetry label="TARGET" value={detected ? "ACTIVE" : "NONE"} />
            <CameraTelemetry label="SLAM DRIFT" value={`${state.slam.drift_percent.toFixed(2)}%`} />
          </div>
        </div>
      </section>
    </div>
  );
}

function LiveCameraPanel({
  state,
  channel,
  title,
  subtitle,
}: {
  state: SimState;
  channel: "front" | "rear" | "down";
  title: string;
  subtitle: string;
}) {
  const target = state.detection.person_detected;
  const heat = state.detection.hotspots.length > 0;

  return (
    <article className="relative h-[390px] overflow-hidden border border-[#2b3941] bg-[#04080b]">
      <LiveCameraScene state={state} channel={channel} />

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-[#29363d] bg-[#071015]/95 px-3 py-2">
        <div>
          <div className="font-mono text-[9px] font-bold uppercase text-slate-200">{title}</div>
          <div className="mt-0.5 font-mono text-[7px] uppercase tracking-wider text-slate-600">{subtitle}</div>
        </div>
        <div className="flex items-center gap-2 font-mono text-[7px] font-bold uppercase">
          <span className={`h-1.5 w-1.5 ${target ? "animate-pulse bg-red-300" : "bg-emerald-300"}`} />
          <span className={target ? "text-red-300" : "text-emerald-300"}>{target ? "TARGET" : "LIVE"}</span>
        </div>
      </div>

      <div className="absolute bottom-2 left-2 z-20 font-mono text-[7px] uppercase tracking-wider text-slate-600">
        T+{formatMissionTime(state.t)}
      </div>
      <div className="absolute bottom-2 right-2 z-20 flex items-center gap-2">
        <span className="border border-[#2b3941] bg-[#071015]/90 px-2 py-1 font-mono text-[7px] text-slate-500">
          {channel === "down" ? "30 FPS" : "15 FPS"}
        </span>
        {heat && (
          <span className="border border-[#66533a] bg-[#17130e] px-2 py-1 font-mono text-[7px] uppercase text-amber-300">
            HEAT
          </span>
        )}
      </div>
    </article>
  );
}

function LiveCameraScene({
  state,
  channel,
}: {
  state: SimState;
  channel: "front" | "rear" | "down";
}) {
  const target = state.detection.person_detected;
  const heat = state.detection.hotspots.length > 0;
  const phase = state.t * 1.65 + (channel === "rear" ? 1.1 : channel === "down" ? 2.4 : 0);
  const swayX = Math.sin(phase) * 4.5;
  const swayY = Math.cos(phase * .7) * 2.2;
  const scanX = 12 + ((state.t * (channel === "down" ? 75 : 46)) % 616);

  return (
    <svg viewBox="0 0 640 300" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`live-video-bg-${channel}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={channel === "down" ? "#1b2022" : "#17242a"} />
          <stop offset="58%" stopColor="#0a1217" />
          <stop offset="100%" stopColor="#020405" />
        </linearGradient>
        <radialGradient id={`live-video-beam-${channel}`}>
          <stop offset="0%" stopColor="rgba(214,227,229,.15)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      <rect width="640" height="300" fill={`url(#live-video-bg-${channel})`} />

      <g transform={`translate(${swayX} ${swayY})`}>
        <ellipse cx="320" cy="150" rx="288" ry="180" fill={`url(#live-video-beam-${channel})`} />

        {channel !== "down" ? (
          <>
            {/* Irregular mine tunnel: rock walls, roof, floor and perspective */}
            <path
              d="M0 0 H640 V300 H0 Z"
              fill="#071014"
            />
            <path
              d="M0 0 H640
                 C565 28 515 58 454 103
                 C405 139 381 168 370 201
                 C430 226 510 258 640 300
                 H0
                 C130 258 210 226 270 201
                 C259 168 235 139 186 103
                 C125 58 75 28 0 0 Z"
              fill="#1a2529"
              opacity=".96"
            />
            <path
              d="M0 0
                 C76 29 129 62 182 108
                 C232 151 249 179 258 205
                 C193 231 111 267 0 300"
              fill="#111b1f"
              opacity=".95"
            />
            <path
              d="M640 0
                 C564 29 511 62 458 108
                 C408 151 391 179 382 205
                 C447 231 529 267 640 300"
              fill="#111b1f"
              opacity=".95"
            />
            {/* rock strata */}
            <path d="M18 58 Q95 86 163 145 T252 205" fill="none" stroke="#7e8b8d" strokeOpacity=".17" strokeWidth="2" />
            <path d="M622 54 Q545 84 477 143 T388 204" fill="none" stroke="#7e8b8d" strokeOpacity=".15" strokeWidth="2" />
            <path d="M8 92 Q74 111 134 159" fill="none" stroke="#879496" strokeOpacity=".11" strokeWidth="3" />
            <path d="M632 88 Q566 110 506 158" fill="none" stroke="#879496" strokeOpacity=".10" strokeWidth="3" />
            {/* roof ribs */}
            {[0,1,2,3,4,5].map((i) => {
              const x = 48 + i * 108;
              const depth = 42 + i * 4;
              return (
                <g key={`${channel}-rib-${i}`} opacity=".22">
                  <path
                    d={`M${x-54} ${depth+30} Q${x} ${depth-3} ${x+54} ${depth+30}`}
                    fill="none"
                    stroke="#a0abad"
                    strokeWidth="3"
                  />
                  <path
                    d={`M${x-54} ${depth+30} L${x-76} 226`}
                    fill="none"
                    stroke="#7c898d"
                    strokeWidth="2"
                  />
                  <path
                    d={`M${x+54} ${depth+30} L${x+76} 226`}
                    fill="none"
                    stroke="#7c898d"
                    strokeWidth="2"
                  />
                </g>
              );
            })}
            {/* tunnel floor and perspective tracks */}
            <path d="M0 300 H640 L381 204 H259 Z" fill="#0b1215" />
            <path d="M103 300 L281 204 M537 300 L359 204" stroke="#899496" strokeOpacity=".19" strokeWidth="3" />
            <path d="M132 300 L286 204 M508 300 L354 204" stroke="#657276" strokeOpacity=".10" strokeWidth="1" />
            {[0,1,2,3,4,5,6].map((i) => {
              const y = 214 + i * 14;
              const left = 267 - i * 21;
              const right = 373 + i * 21;
              return (
                <line
                  key={`${channel}-floor-${i}`}
                  x1={left}
                  y1={y}
                  x2={right}
                  y2={y}
                  stroke="#8d999b"
                  strokeOpacity=".10"
                  strokeWidth="2"
                />
              );
            })}
            {/* rock debris / acquisition returns */}
            {Array.from({ length: 70 }, (_, i) => {
              const side = i % 2 === 0 ? 1 : -1;
              const n = (i * 37) % 100;
              const x = side > 0 ? 8 + n * 1.15 : 632 - n * 1.15;
              const y = 72 + ((i * 43) % 145);
              const r = i % 9 === 0 ? 2 : .8;
              return (
                <circle
                  key={`${channel}-rock-${i}`}
                  cx={x}
                  cy={y}
                  r={r}
                  fill="#b7c0c1"
                  opacity={i % 5 === 0 ? ".18" : ".075"}
                />
              );
            })}
            {/* weak IR illumination in the tunnel */}
            <ellipse cx="320" cy="184" rx="235" ry="105" fill="url(#live-video-beam-front)" opacity=".55" />
          </>
        ) : (
          <>
            <path d="M70 28 H570 L520 275 H120 Z" fill="#151d21" stroke="#6b7a7f" strokeOpacity=".26" />
            <path d="M122 245 H518" stroke="#7d8b8f" strokeOpacity=".18" />
            <path d="M178 66 L214 248 M462 66 L426 248" stroke="#748489" strokeOpacity=".15" />
            <circle cx="190" cy="218" r="30" fill="#222c30" stroke="#7a888c" strokeOpacity=".36" />
            <circle cx="450" cy="218" r="30" fill="#222c30" stroke="#7a888c" strokeOpacity=".36" />
            <path d="M230 72 H410 M274 56 V250 M366 56 V250" stroke="#77858a" strokeOpacity=".11" />
          </>
        )}

        {/* Moving sensor scan + acquisition texture */}
        <rect x={scanX - 55} y="0" width="90" height="300" fill="rgba(219,230,232,.022)" />
        <line x1={scanX} y1="0" x2={scanX} y2="300" stroke="#91aaa6" strokeOpacity=".12" />

        {Array.from({ length: 48 }, (_, i) => {
          const x = ((i * 113 + Math.floor(state.t * 14)) % 620) + 10;
          const y = ((i * 61 + Math.floor(state.t * 9)) % 278) + 11;
          return (
            <circle
              key={`${channel}-texture-${i}`}
              cx={x}
              cy={y}
              r={i % 9 === 0 ? 1.2 : .55}
              fill="#b3c0c2"
              opacity={i % 6 === 0 ? ".14" : ".065"}
            />
          );
        })}

        {heat && (
          <>
            <circle
              cx={390 + Math.sin(state.t * .8) * 20}
              cy={124 + Math.cos(state.t * .6) * 13}
              r="45"
              fill="rgba(190,105,64,.18)"
            />
            <circle
              cx={390 + Math.sin(state.t * .8) * 20}
              cy={124 + Math.cos(state.t * .6) * 13}
              r="17"
              fill="rgba(223,171,72,.19)"
            />
          </>
        )}

        {target && (
          <g>
            <circle cx="320" cy="128" r={channel === "down" ? 18 : 27} fill={channel === "down" ? "rgba(201,183,113,.28)" : "rgba(214,224,226,.22)"} />
            <path
              d={channel === "down"
                ? "M300 148 Q320 140 340 148 L352 223 Q320 240 288 223 Z"
                : "M285 170 Q320 146 355 170 L365 260 Q320 281 275 260 Z"}
              fill={channel === "down" ? "rgba(177,151,85,.22)" : "rgba(198,210,213,.16)"}
            />
            <rect
              x={channel === "down" ? 284 : 244}
              y={channel === "down" ? 101 : 92}
              width={channel === "down" ? 72 : 152}
              height={channel === "down" ? 122 : 175}
              fill="none"
              stroke="#d78282"
              strokeWidth="2"
            />
            <text
              x={channel === "down" ? 284 : 244}
              y={channel === "down" ? 91 : 82}
              fill="#df9595"
              fontSize="10"
              fontFamily="monospace"
            >
              PERSON CANDIDATE
            </text>
          </g>
        )}
      </g>

      <rect x="8" y="8" width="624" height="284" fill="none" stroke="rgba(205,217,221,.13)" />
    </svg>
  );
}


function CameraTelemetry({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-[#19252c] pb-2">
      <div className="font-mono text-[7px] uppercase tracking-wider text-slate-600">
        {label}
      </div>
      <div className="mt-1 font-mono text-[11px] font-bold text-slate-300">
        {value}
      </div>
    </div>
  );
}

function formatMissionTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60).toString().padStart(2, "0");
  const secs = (total % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}


function CameraViewport({
  state,
  view,
  zoom,
  showGrid,
  showDetections,
  showHotspots,
  selectedTarget,
  onSelectTarget,
}: {
  state: SimState;
  view: ViewMode;
  zoom: number;
  showGrid: boolean;
  showDetections: boolean;
  showHotspots: boolean;
  selectedTarget: string;
  onSelectTarget: (target: string) => void;
}) {
  const detected = state.detection.person_detected;
  const thermal = state.detection.thermal_confidence;
  const nv = state.detection.nv_confidence;

  const isThermal = view === "thermal";
  const isNight = view === "night";
  const isReview = view === "review";

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#05070a]">
      {/* Main scene */}
      <div
        className="absolute inset-0 transition-transform duration-300"
        style={{
          transform: `translate(${((state.slam.rover.x % 5) - 2.5) * -2}px, ${((state.slam.rover.y % 5) - 2.5) * -2}px) scale(${zoom})`,
        }}
      >
        {isThermal ? (
          <ThermalScene
            state={state}
            showHotspots={showHotspots}
            showDetections={showDetections}
            selectedTarget={selectedTarget}
            onSelectTarget={onSelectTarget}
          />
        ) : isNight ? (
          <NightVisionScene
            state={state}
            showDetections={showDetections}
            selectedTarget={selectedTarget}
            onSelectTarget={onSelectTarget}
          />
        ) : (
          <FusedScene
            state={state}
            reviewMode={isReview}
            showHotspots={showHotspots}
            showDetections={showDetections}
            selectedTarget={selectedTarget}
            onSelectTarget={onSelectTarget}
          />
        )}
      </div>

      {/* Grid */}
      {showGrid && (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.25) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      )}

      {/* Center reticle */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute left-1/2 top-0 h-3 w-px bg-white/25" />
        <div className="absolute bottom-0 left-1/2 h-3 w-px bg-white/25" />
        <div className="absolute left-0 top-1/2 h-px w-3 bg-white/25" />
        <div className="absolute right-0 top-1/2 h-px w-3 bg-white/25" />
        <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40" />
      </div>

      {/* Top-left source label */}
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md border border-[#2a3540] bg-black/60 px-2.5 py-1.5 backdrop-blur-sm">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            detected ? "bg-red-400" : "bg-emerald-400"
          }`}
        />

        <span className="font-mono text-[8px] font-bold uppercase tracking-wider text-slate-300">
          {isReview
            ? "ANALYSIS MODE"
            : isThermal
              ? "THERMAL IR"
              : isNight
                ? "NIGHT VISION"
                : "FUSED SENSOR VIEW"}
        </span>
      </div>

      {/* Top right status */}
      <div className="absolute right-3 top-3 flex items-center gap-2 rounded-md border border-[#2a3540] bg-black/60 px-2.5 py-1.5 backdrop-blur-sm">
        <span className="font-mono text-[7px] uppercase tracking-wider text-slate-600">
          FRAME
        </span>

        <span className="font-mono text-[8px] font-bold text-cyan-400">
          SIM-{Math.floor(state.t * 10)
            .toString()
            .padStart(5, "0")}
        </span>
      </div>

      {/* Bottom view state */}
      <div className="absolute left-1/2 bottom-3 -translate-x-1/2 rounded-md border border-[#26323d] bg-black/65 px-3 py-1.5 backdrop-blur">
        <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-slate-500">
          {detected
            ? "TARGET TRACKING ACTIVE"
            : "CONTINUOUS AREA SCAN"}
        </span>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* THERMAL SCENE                                                             */
/* ========================================================================== */

function ThermalScene({
  state,
  showHotspots,
  showDetections,
  selectedTarget,
  onSelectTarget,
}: {
  state: SimState;
  showHotspots: boolean;
  showDetections: boolean;
  selectedTarget: string;
  onSelectTarget: (target: string) => void;
}) {
  const detected = state.detection.person_detected;

  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(circle at 50% 48%, rgba(255,174,35,.98) 0%, rgba(211,71,23,.90) 7%, rgba(104,37,91,.9) 24%, rgba(29,20,55,.95) 47%, rgba(8,10,18,1) 80%)",
      }}
    >
      {/* Thermal tunnel structure */}
      <div className="absolute inset-x-[8%] top-[8%] bottom-[10%] rounded-[48%] border border-orange-200/10 bg-purple-800/5" />
      <div className="absolute left-[11%] top-[23%] h-3 w-[65%] rotate-6 rounded-full bg-orange-400/10 blur-xl" />
      <div className="absolute right-[6%] bottom-[25%] h-5 w-[55%] -rotate-6 rounded-full bg-red-500/10 blur-2xl" />

      {showHotspots &&
        state.detection.hotspots.map((hotspot, index) => (
          <button
            key={`hotspot-${index}`}
            type="button"
            className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-200/70 bg-amber-300/15 shadow-[0_0_28px_rgba(245,158,11,.55)]"
            style={{
              left: `${35 + hotspot.x * 0.65}%`,
              top: `${20 + hotspot.y * 1.8}%`,
            }}
            title={`Thermal hotspot intensity ${Math.round(hotspot.intensity * 100)}%`}
          >
            <span className="mx-auto block h-1.5 w-1.5 rounded-full bg-yellow-200" />
          </button>
        ))}

      {detected && showDetections && (
        <button
          type="button"
          onClick={() =>
            onSelectTarget(
              selectedTarget === "survivor"
                ? "none"
                : "survivor",
            )
          }
          className={`absolute left-[53%] top-[28%] h-[45%] w-[23%] -translate-x-1/2 rounded-[45%] border-2 transition ${
            selectedTarget === "survivor"
              ? "border-red-300 bg-red-300/5 shadow-[0_0_40px_rgba(239,68,68,.35)]"
              : "border-red-400/70 bg-red-300/5"
          }`}
        >
          <div className="absolute -top-7 left-0 rounded border border-red-400/50 bg-red-500/80 px-2 py-1 font-mono text-[7px] font-bold text-white">
            PERSON ·{" "}
            {Math.round(
              state.detection.thermal_confidence * 100,
            )}
            %
          </div>

          <div className="absolute left-1/2 top-[6%] h-[21%] w-[43%] -translate-x-1/2 rounded-full bg-yellow-100/80 blur-[1px]" />

          <div className="absolute left-1/2 top-[27%] h-[53%] w-[55%] -translate-x-1/2 rounded-[45%] bg-orange-100/65 blur-[2px]" />

          <div className="absolute bottom-[0%] left-[15%] h-[32%] w-[24%] rotate-5 rounded-full bg-yellow-100/45 blur-[3px]" />

          <div className="absolute bottom-[0%] right-[15%] h-[32%] w-[24%] -rotate-5 rounded-full bg-yellow-100/45 blur-[3px]" />

          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 rounded border border-red-400/30 bg-black/65 px-2 py-1 font-mono text-[7px] text-red-300">
            TARGET SELECTED
          </div>
        </button>
      )}

      <div className="absolute left-5 bottom-20 h-20 w-20 rounded-full border border-orange-200/10" />

      {/* Thermal scale */}
      <div className="absolute right-5 top-1/2 flex -translate-y-1/2 items-stretch gap-2">
        <div
          className="h-44 w-2 rounded-full"
          style={{
            background:
              "linear-gradient(to bottom,#fff7ae,#ffb300,#e85c22,#8b2c6d,#24183f,#060912)",
          }}
        />

        <div className="flex h-44 flex-col justify-between font-mono text-[7px] text-slate-500">
          <span>45°</span>
          <span>35°</span>
          <span>25°</span>
          <span>15°</span>
        </div>
      </div>

      <div className="absolute left-1/2 top-[83%] -translate-x-1/2 rounded border border-white/10 bg-black/40 px-2 py-1 font-mono text-[7px] uppercase tracking-wider text-slate-600">
        THERMAL DIFFERENTIAL VIEW
      </div>
    </div>
  );
}

/* ========================================================================== */
/* NIGHT VISION SCENE                                                        */
/* ========================================================================== */

function NightVisionScene({
  state,
  showDetections,
  selectedTarget,
  onSelectTarget,
}: {
  state: SimState;
  showDetections: boolean;
  selectedTarget: string;
  onSelectTarget: (target: string) => void;
}) {
  const detected = state.detection.person_detected;

  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(circle at 50% 45%, rgba(46,97,81,.65), rgba(15,33,31,.92) 34%, rgba(4,12,13,1) 78%)",
      }}
    >
      {/* Tunnel walls */}
      <div className="absolute inset-x-[7%] top-[9%] bottom-[11%] rounded-[45%] border border-emerald-200/10" />

      <div className="absolute left-[16%] top-[18%] h-[58%] w-[1px] rotate-[11deg] bg-emerald-200/15" />

      <div className="absolute right-[18%] top-[22%] h-[52%] w-[1px] -rotate-[8deg] bg-emerald-200/15" />

      <div className="absolute left-[27%] bottom-[21%] h-1 w-[45%] rotate-[5deg] rounded-full bg-emerald-200/10 blur-sm" />

      {/* Human silhouette */}
      {detected && showDetections && (
        <button
          type="button"
          onClick={() =>
            onSelectTarget(
              selectedTarget === "survivor"
                ? "none"
                : "survivor",
            )
          }
          className={`absolute left-[53%] top-[25%] h-[51%] w-[18%] -translate-x-1/2 rounded-[42%] transition ${
            selectedTarget === "survivor"
              ? "border-2 border-cyan-300 bg-cyan-300/5 shadow-[0_0_35px_rgba(34,211,238,.25)]"
              : "border border-cyan-300/60"
          }`}
        >
          <div className="absolute left-1/2 top-[4%] h-[20%] w-[46%] -translate-x-1/2 rounded-full bg-slate-200/35" />

          <div className="absolute left-1/2 top-[25%] h-[53%] w-[54%] -translate-x-1/2 rounded-[40%] bg-slate-200/25" />

          <div className="absolute bottom-[0] left-[16%] h-[29%] w-[23%] rotate-4 rounded-full bg-slate-200/20" />

          <div className="absolute bottom-[0] right-[16%] h-[29%] w-[23%] -rotate-4 rounded-full bg-slate-200/20" />

          <div className="absolute -top-7 left-0 rounded border border-cyan-300/40 bg-cyan-500/70 px-2 py-1 font-mono text-[7px] font-bold text-white">
            HUMAN SHAPE ·{" "}
            {Math.round(
              state.detection.nv_confidence * 100,
            )}
            %
          </div>
        </button>
      )}

      {/* IR falloff */}
      <div className="absolute left-1/2 top-1/2 h-[70%] w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-emerald-300/5" />

      {/* Grayscale labels */}
      <div className="absolute left-5 bottom-20 flex items-center gap-2 rounded border border-emerald-300/10 bg-black/35 px-2 py-1.5">
        <div className="h-2 w-2 rounded-full bg-emerald-300/70" />
        <span className="font-mono text-[7px] uppercase tracking-wider text-emerald-300/70">
          850nm active illumination
        </span>
      </div>

      <div className="absolute right-5 top-1/2 flex -translate-y-1/2 flex-col justify-between rounded border border-emerald-200/10 bg-black/30 px-2 py-2 text-center font-mono text-[7px] text-emerald-300/50">
        <span>HIGH</span>
        <span>IR</span>
        <span>LOW</span>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* FUSED SCENE                                                               */
/* ========================================================================== */

function FusedScene({
  state,
  reviewMode,
  showHotspots,
  showDetections,
  selectedTarget,
  onSelectTarget,
}: {
  state: SimState;
  reviewMode: boolean;
  showHotspots: boolean;
  showDetections: boolean;
  selectedTarget: string;
  onSelectTarget: (target: string) => void;
}) {
  const detected = state.detection.person_detected;

  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(circle at 52% 44%, rgba(236,120,27,.68), rgba(61,52,84,.82) 24%, rgba(10,13,21,1) 75%)",
      }}
    >
      {/* registered visual planes */}
      <div className="absolute inset-x-[8%] top-[10%] bottom-[10%] rounded-[45%] border border-cyan-300/10" />

      <div className="absolute left-[11%] top-[20%] h-2 w-[68%] rotate-6 rounded-full bg-cyan-300/5 blur-lg" />

      <div className="absolute right-[8%] bottom-[25%] h-3 w-[52%] -rotate-5 rounded-full bg-orange-400/10 blur-lg" />

      {/* Registration boundary */}
      {reviewMode && (
        <>
          <div className="absolute inset-[11%] rounded-xl border border-cyan-400/20" />

          <div className="absolute left-[11%] top-[11%] font-mono text-[7px] uppercase tracking-widest text-cyan-400/60">
            registered thermal coordinate frame
          </div>
        </>
      )}

      {/* Hotspots */}
      {showHotspots &&
        state.detection.hotspots.map((hotspot, index) => (
          <div
            key={`fused-hotspot-${index}`}
            className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/70 bg-amber-300/10 shadow-[0_0_24px_rgba(245,158,11,.35)]"
            style={{
              left: `${35 + hotspot.x * 0.65}%`,
              top: `${21 + hotspot.y * 1.75}%`,
            }}
          >
            <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200" />
          </div>
        ))}

      {/* Fused target */}
      {detected && showDetections && (
        <button
          type="button"
          onClick={() =>
            onSelectTarget(
              selectedTarget === "survivor"
                ? "none"
                : "survivor",
            )
          }
          className={`absolute left-[53%] top-[27%] h-[47%] w-[20%] -translate-x-1/2 rounded-[44%] transition ${
            selectedTarget === "survivor"
              ? "border-2 border-red-300 bg-red-400/10 shadow-[0_0_45px_rgba(239,68,68,.3)]"
              : "border-2 border-red-400/65 bg-red-400/5"
          }`}
        >
          <div className="absolute -left-[2px] -top-8 rounded border border-red-400/50 bg-red-500/75 px-2 py-1 font-mono text-[7px] font-bold text-white">
            PERSON · FUSED
          </div>

          <div className="absolute left-1/2 top-[5%] h-[21%] w-[44%] -translate-x-1/2 rounded-full bg-orange-100/65 blur-[2px]" />

          <div className="absolute left-1/2 top-[28%] h-[50%] w-[55%] -translate-x-1/2 rounded-[45%] bg-orange-100/35 blur-[3px]" />

          <div className="absolute bottom-2 left-2 right-2 h-px bg-cyan-300/20" />

          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-[#31404c] bg-black/65 px-2 py-1 font-mono text-[7px] text-slate-400">
            THERMAL + NV REGISTERED
          </div>
        </button>
      )}

      {/* Fused weighting indicator */}
      <div className="absolute bottom-20 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-[#26333f] bg-black/55 px-3 py-2 backdrop-blur">
        <FusionPill
          label="THERMAL"
          value={`${Math.round(
            state.detection.thermal_confidence * 100,
          )}%`}
          active={
            state.detection.thermal_confidence > 0.6
          }
        />

        <div className="h-4 w-px bg-[#33404c]" />

        <FusionPill
          label="NV"
          value={`${Math.round(
            state.detection.nv_confidence * 100,
          )}%`}
          active={
            state.detection.nv_confidence > 0.6
          }
        />

        <div className="h-4 w-px bg-[#33404c]" />

        <span className="font-mono text-[7px] uppercase tracking-wider text-slate-500">
          FEATURE-LEVEL FUSION
        </span>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* PIPELINE INSPECTOR                                                         */
/* ========================================================================== */

function PipelineInspector({
  state,
  view,
}: {
  state: SimState;
  view: ViewMode;
}) {
  const steps = [
    {
      name: "THERMAL INPUT",
      status: "READY",
      detail: "MLX90640 / 32×24",
    },
    {
      name: "NV INPUT",
      status: "READY",
      detail: "Active IR / grayscale",
    },
    {
      name: "PREPROCESS",
      status: "ACTIVE",
      detail: "Normalization / denoising",
    },
    {
      name: "REGISTRATION",
      status: "3m REF.",
      detail: "Fixed homography",
    },
    {
      name: "FEATURE FUSION",
      status: "SE",
      detail: "Channel weighting",
    },
    {
      name: "DETECTION",
      status: "YOLOv8n",
      detail: "Person / no-person",
    },
    {
      name: "EVIDENCE",
      status: state.detection.two_of_three
        ? "2 / 3"
        : "REVIEW",
      detail: "Multimodal escalation",
    },
  ];

  return (
    <div className="mt-2 rounded-lg border border-[#202a35] bg-[#070a0e] p-3">
      <div className="grid gap-1.5">
        {steps.map((step, index) => (
          <div
            key={step.name}
            className="flex items-center gap-2"
          >
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${
                index === 6
                  ? state.detection.two_of_three
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400"
                  : "bg-cyan-500/5 text-cyan-500"
              }`}
            >
              {index === 6 ? (
                state.detection.two_of_three ? (
                  <Check size={10} />
                ) : (
                  <Info size={10} />
                )
              ) : (
                <span className="font-mono text-[7px] font-bold">
                  {index + 1}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-mono text-[7px] font-bold uppercase tracking-wider text-slate-500">
                {step.name}
              </div>
              <div className="truncate text-[8px] text-slate-700">
                {step.detail}
              </div>
            </div>

            <span className="font-mono text-[7px] font-bold text-slate-500">
              {step.status}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-md border border-[#202a35] bg-[#0a0e13] px-2.5 py-2">
        <div className="font-mono text-[7px] uppercase tracking-wider text-slate-700">
          Current workspace
        </div>

        <div className="mt-1 font-mono text-[8px] text-cyan-400">
          {view === "thermal"
            ? "THERMAL INSPECTION"
            : view === "night"
              ? "NIGHT-VISION INSPECTION"
              : view === "fused"
                ? "REGISTERED FUSION VIEW"
                : "DETECTION REVIEW"}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* HEADINGS / UI                                                              */
/* ========================================================================== */

function ViewButton({
  active,
  onClick,
  icon,
  label,
  sub,
  alert,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
  alert?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-w-[150px] flex-1 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
        active
          ? "border-cyan-500/25 bg-cyan-500/8"
          : "border-transparent hover:border-[#26313c] hover:bg-[#11161c]"
      }`}
    >
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-md ${
          active
            ? "bg-cyan-400/10 text-cyan-400"
            : "bg-[#11161d] text-slate-600"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <div
          className={`text-[10px] font-semibold ${
            active ? "text-white" : "text-slate-400"
          }`}
        >
          {label}
        </div>

        <div className="mt-0.5 truncate font-mono text-[7px] uppercase tracking-wider text-slate-700">
          {sub}
        </div>
      </div>

      {alert && (
        <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,.7)]" />
      )}
    </button>
  );
}

function ToolButton({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded-md border transition ${
        active
          ? "border-cyan-500/20 bg-cyan-500/8 text-cyan-400"
          : "border-[#202b35] bg-[#080b0f] text-slate-600 hover:text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}

function StatusChip({
  label,
  value,
  tone: chipTone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div
      className={`rounded-md border px-2.5 py-1.5 ${toneBorder[chipTone]} ${toneBg[chipTone]}`}
    >
      <span className="font-mono text-[7px] uppercase tracking-wider text-slate-600">
        {label}
      </span>

      <span
        className={`ml-2 font-mono text-[7px] font-bold ${tone[chipTone]}`}
      >
        {value}
      </span>
    </div>
  );
}

function MetricBlock({
  label,
  value,
  tone: metricTone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className="rounded-lg border border-[#1d2833] bg-[#080b0f] p-2.5">
      <div className="font-mono text-[7px] uppercase tracking-wider text-slate-700">
        {label}
      </div>

      <div
        className={`mt-1 truncate font-mono text-[9px] font-bold ${tone[metricTone]}`}
      >
        {value}
      </div>
    </div>
  );
}

function EvidenceLine({
  label,
  value,
  passed,
  detail,
}: {
  label: string;
  value: string;
  passed: boolean;
  detail: string;
}) {
  return (
    <div className="mb-1.5 flex items-center gap-2 rounded-md border border-[#1c2630] bg-[#080b0f] px-3 py-2">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded ${
          passed
            ? "bg-emerald-500/10 text-emerald-400"
            : "bg-slate-800/30 text-slate-600"
        }`}
      >
        {passed ? <Check size={10} /> : <X size={10} />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-medium text-slate-400">
          {label}
        </div>
        <div className="font-mono text-[7px] text-slate-700">
          {detail}
        </div>
      </div>

      <span
        className={`font-mono text-[9px] font-bold ${
          passed ? "text-emerald-400" : "text-slate-600"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function OverlayChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-[#28343f] bg-black/60 px-2 py-1.5 backdrop-blur">
      <span className="text-cyan-400">{icon}</span>

      <span className="font-mono text-[7px] uppercase tracking-wider text-slate-600">
        {label}
      </span>

      <span className="font-mono text-[8px] font-bold text-slate-300">
        {value}
      </span>
    </div>
  );
}

function HeadingWidget({ heading }: { heading: number }) {
  const normalized = ((heading % 360) + 360) % 360;

  return (
    <div className="absolute left-1/2 top-4 flex -translate-x-1/2 flex-col items-center">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#34414d] bg-black/55 backdrop-blur">
        <div
          className="absolute inset-2 rounded-full border border-cyan-400/15 transition-transform duration-500"
          style={{
            transform: `rotate(${normalized}deg)`,
          }}
        />

        <div className="font-mono text-[8px] font-bold text-cyan-400">
          {normalized.toFixed(0)}°
        </div>

        <div className="absolute -top-2 font-mono text-[6px] text-slate-600">
          N
        </div>
      </div>

      <span className="mt-1 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[6px] uppercase tracking-wider text-slate-600">
        rover heading
      </span>
    </div>
  );
}

function FusionPill({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-400" : "bg-slate-700"
        }`}
      />

      <span className="font-mono text-[7px] text-slate-500">
        {label}
      </span>

      <span
        className={`font-mono text-[8px] font-bold ${
          active ? "text-emerald-400" : "text-slate-600"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ContextLink({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="flex items-center gap-2 border border-[#22313d] bg-[#080b0f] px-3 py-2.5 text-left font-mono text-[7px] font-bold uppercase tracking-wider text-slate-500 transition hover:border-cyan-400/20 hover:text-cyan-300 disabled:cursor-default disabled:opacity-45"
    >
      <span className="text-cyan-400">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function TelemetryCell({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-r border-b border-[#1b2530] p-3 last:border-r-0">
      <div className="flex items-center gap-1.5">
        <span className="text-slate-600">{icon}</span>

        <span className="font-mono text-[7px] font-bold uppercase tracking-wider text-slate-600">
          {label}
        </span>
      </div>

      <div className="mt-2 font-mono text-[10px] font-bold text-slate-300">
        {value}
      </div>

      <div className="mt-0.5 font-mono text-[6px] uppercase tracking-wider text-slate-700">
        {detail}
      </div>
    </div>
  );
}