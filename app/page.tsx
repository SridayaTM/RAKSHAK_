"use client";

import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Camera,
  ChevronRight,
  CircleCheck,
  CircleX,
  Cpu,
  Crosshair,
  Eye,
  Gauge,
  LockKeyhole,
  Map,
  Pause,
  Radio,
  Route,
  RotateCcw,
  Shield,
  Siren,
  Thermometer,
  TriangleAlert,
  Wind,
  Wifi,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import Atmosphere from "./components/Atmosphere";
import Cameras from "./components/Cameras";
import Communication from "./components/Communication";
import Safety from "./components/Safety";
import SLAM from "./components/SLAM";
import { useSimulation } from "./hooks/useSimulation";
import type { SimState } from "./lib/simulation";

type SectionId =
  | "overview"
  | "atmosphere"
  | "slam"
  | "vision"
  | "communication"
  | "safety";

type Tone = "cyan" | "green" | "amber" | "red" | "slate";

const NAVIGATION: Array<{
  id: SectionId;
  label: string;
  short: string;
  icon: typeof Activity;
}> = [
    { id: "overview", label: "Overview", short: "CTRL", icon: Activity },
    { id: "atmosphere", label: "Atmospheric Monitoring", short: "GAS", icon: Wind },
    { id: "slam", label: "SLAM & Navigation", short: "NAV", icon: Map },
    { id: "vision", label: "Vision & Thermal", short: "VIS", icon: Camera },
    { id: "communication", label: "Communication", short: "COM", icon: Radio },
    { id: "safety", label: "Safety & FSM", short: "SAFE", icon: Shield },
  ];

const toneClasses: Record<
  Tone,
  {
    text: string;
    border: string;
    bg: string;
    soft: string;
    dot: string;
  }
> = {
  cyan: {
    text: "text-cyan-400",
    border: "border-cyan-500/25",
    bg: "bg-cyan-500/10",
    soft: "bg-cyan-500/5",
    dot: "bg-cyan-400",
  },
  green: {
    text: "text-emerald-400",
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/10",
    soft: "bg-emerald-500/5",
    dot: "bg-emerald-400",
  },
  amber: {
    text: "text-amber-400",
    border: "border-amber-500/25",
    bg: "bg-amber-500/10",
    soft: "bg-amber-500/5",
    dot: "bg-amber-400",
  },
  red: {
    text: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    soft: "bg-red-500/5",
    dot: "bg-red-400",
  },
  slate: {
    text: "text-slate-300",
    border: "border-slate-700/60",
    bg: "bg-slate-700/20",
    soft: "bg-slate-900/40",
    dot: "bg-slate-400",
  },
};

export default function Home() {
  const [active, setActive] = useState<SectionId>("overview");
  const {
    state,
    running,
    speedMultiplier,
    start,
    stop,
    reset,
    setSpeedMultiplier,
  } = useSimulation(800);

  if (!state) {
    return <BootScreen />;
  }

  const decision = buildDecision(state);
  const activeNav =
    NAVIGATION.find((item) => item.id === active) ?? NAVIGATION[0];

  const missionTime = formatMissionTime(state.t);

  return (
    <main className="rakshak-control-room min-h-screen bg-[#05070a] text-slate-100">
      <style jsx global>{`
        .rakshak-control-room {
          background: #070b0f !important;
          color: #d7dee1;
        }
        .rakshak-control-room [class*="text-[6px]"] {
          font-size: 9px !important; line-height: 1.25 !important;
        }
        .rakshak-control-room [class*="text-[7px]"] {
          font-size: 10px !important; line-height: 1.3 !important;
        }
        .rakshak-control-room [class*="text-[8px]"] {
          font-size: 11px !important; line-height: 1.35 !important;
        }
        .rakshak-control-room [class*="text-[9px]"] {
          font-size: 12px !important; line-height: 1.4 !important;
        }
        .rakshak-control-room [class*="rounded"] {
          border-radius: 0 !important;
        }
        .rakshak-control-room [class*="shadow"] {
          box-shadow: none !important;
        }
        .rakshak-control-room aside {
          background: #0a1014 !important;
          border-color: #2a353d !important;
        }
        .rakshak-control-room .text-cyan-400,
        .rakshak-control-room .text-cyan-300,
        .rakshak-control-room .text-cyan-500 {
          color: #8bb4ae !important;
        }
        .rakshak-control-room .text-emerald-400,
        .rakshak-control-room .text-emerald-300 {
          color: #8fc3a7 !important;
        }
        .rakshak-control-room .text-amber-400,
        .rakshak-control-room .text-amber-300 {
          color: #d4b76a !important;
        }
        .rakshak-control-room .text-red-400,
        .rakshak-control-room .text-red-300 {
          color: #dc8585 !important;
        }
        .rakshak-control-room .text-slate-500 { color: #8a969d !important; }
        .rakshak-control-room .text-slate-600 { color: #768189 !important; }
        .rakshak-control-room .text-slate-700 { color: #66727a !important; }
        .rakshak-control-room button:focus-visible {
          outline: 2px solid #8bb4ae;
          outline-offset: 2px;
        }
      `}</style>

      <div className="flex h-screen min-h-0 overflow-hidden">
        {/* ================================================================ */}
        {/* LEFT CONTROL RAIL                                                */}
        {/* ================================================================ */}

        <aside className="flex w-[286px] shrink-0 flex-col border-r border-[#1c2430] bg-[#0a0d12]">
          {/* Brand */}
          <div className="border-b border-[#1c2430] px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center  border border-cyan-400/25 bg-cyan-400/5">
                <Shield size={22} className="text-cyan-400" />
              </div>

              <div className="min-w-0">
                <div className="text-[20px] font-black tracking-[0.06em] text-white">
                  RAKSHAK
                </div>
                <div className="font-mono text-[8px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Autonomous Mine Rescue
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between  border border-emerald-500/15 bg-emerald-500/5 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 " />
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-400">
                  Simulation Active
                </span>
              </div>

              <span className={`font-mono text-[8px] ${
                running ? "text-emerald-400" : "text-amber-400"
              }`}>
                {running ? "LIVE" : "STANDBY"}
              </span>
            </div>
          </div>

          {/* Mission context */}
          <div className="border-b border-[#1c2430] px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-slate-600">
                Mission
              </span>
              <span className="font-mono text-[9px] text-cyan-400">
                01
              </span>
            </div>

            <div className="mt-1 text-[11px] font-semibold text-slate-200">
              Underground Rescue Mission
            </div>

            <div className="mt-0.5 font-mono text-[8px] uppercase tracking-wider text-slate-600">
              Sector D / Prototype Environment
            </div>
          </div>

          {/* Navigation */}
          <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <div className="mb-2 px-2 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-slate-600">
              Mission Control
            </div>

            <div className="space-y-1">
              {NAVIGATION.map((item) => {
                const Icon = item.icon;
                const selected = active === item.id;

                const stateTone = getNavigationTone(item.id, state);
                const stateLabel = getNavigationState(item.id, state);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActive(item.id)}
                    className={`group flex w-full items-center gap-3  border px-3 py-2.5 text-left transition-all ${selected
                      ? "border-cyan-400/25 bg-cyan-400/8"
                      : "border-transparent hover:border-[#202b37] hover:bg-[#11161d]"
                      }`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center  ${selected
                        ? "bg-cyan-400/10 text-cyan-400"
                        : "bg-[#11161d] text-slate-500 group-hover:text-slate-300"
                        }`}
                    >
                      <Icon size={15} strokeWidth={1.8} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        className={`truncate text-[11px] font-medium ${selected ? "text-slate-100" : "text-slate-400"
                          }`}
                      >
                        {item.label}
                      </div>
                      <div className="font-mono text-[7px] uppercase tracking-wider text-slate-700">
                        {item.short}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${toneClasses[stateTone].dot
                          } ${stateTone === "red" ? "animate-pulse" : ""}`}
                      />
                      <span
                        className={`hidden font-mono text-[7px] font-bold uppercase tracking-wider xl:inline ${toneClasses[stateTone].text
                          }`}
                      >
                        {stateLabel}
                      </span>
                    </div>

                    {selected && (
                      <ChevronRight
                        size={12}
                        className="shrink-0 text-cyan-500"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* System health */}
          <div className="border-t border-[#1c2430] px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-slate-600">
                System Health
              </span>
              <span className="font-mono text-[8px] text-emerald-400">
                6/6 ONLINE
              </span>
            </div>

            <div className="space-y-1.5">
              <HealthRow label="Jetson / Compute" />
              <HealthRow label="STM32 Safety MCU" />
              <HealthRow label="Gas Sensors" />
              <HealthRow label="Thermal Camera" />
              <HealthRow label="IR / NV Camera" />
              <HealthRow label="LoRa Mesh" />
            </div>
          </div>

          {/* Rover summary */}
          <div className="border-t border-[#1c2430] px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-slate-600">
                Rover
              </span>
              <span
                className={`font-mono text-[8px] font-bold ${state.fsm.motor_halt
                  ? "text-red-400"
                  : "text-emerald-400"
                  }`}
              >
                {state.fsm.motor_halt ? "STOPPED" : "ACTIVE"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <MiniRailValue
                label="POS"
                value={`${state.slam.rover.x},${state.slam.rover.y}`}
              />
              <MiniRailValue
                label="SPD"
                value={`${state.slam.rover.speed.toFixed(2)}m/s`}
              />
              <MiniRailValue
                label="SCSR"
                value={`${state.slam.scsr_remaining.toFixed(1)}m`}
              />
              <MiniRailValue
                label="NODES"
                value={`${state.slam.nodes_deployed}/4`}
              />
            </div>
          </div>

          <div className="border-t border-[#1c2430] px-4 py-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[7px] uppercase tracking-wider text-slate-700">
                RAKSHAK v1.0 / Prototype
              </span>
              <span className="font-mono text-[7px] text-slate-700">
                {missionTime}
              </span>
            </div>
          </div>
        </aside>

        {/* ================================================================ */}
        {/* MAIN AREA                                                         */}
        {/* ================================================================ */}

        <section className="flex min-w-0 flex-1 flex-col">
          {/* TOP COMMAND BAR */}
          <header className="flex min-h-[70px] shrink-0 items-center border-b border-[#1c2430] bg-[#090c11] px-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center  border border-cyan-400/20 bg-cyan-400/5">
                <activeNav.icon size={16} className="text-cyan-400" />
              </div>

              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-100">
                  {activeNav.label}
                </div>
                <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-slate-600">
                  RAKSHAK / Control Interface
                </div>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 overflow-hidden">
              <TopStatus
                label="ATMOSPHERE"
                value={state.gas.overall_hazard}
                tone={hazardToTone(state.gas.overall_hazard)}
              />

              <TopStatus
                label="FSM"
                value={state.fsm.state}
                tone={
                  state.fsm.state === "HALT"
                    ? "red"
                    : state.fsm.state === "CAUTION"
                      ? "amber"
                      : "green"
                }
              />

              <TopStatus
                label="VISION"
                value={
                  state.detection.person_detected
                    ? "PERSON"
                    : "SCANNING"
                }
                tone={
                  state.detection.person_detected ? "red" : "cyan"
                }
              />

              <TopStatus
                label="COMMS"
                value="LINKED"
                tone="green"
              />

              <div className="mx-1 h-7 w-px bg-[#1c2430]" />

              <div className="hidden text-right md:block">
                <div className="font-mono text-[7px] uppercase tracking-wider text-slate-600">
                  Mission Time
                </div>
                <div className="font-mono text-sm font-bold text-cyan-400">
                  T+{missionTime}
                </div>
              </div>

              <div className="flex items-center gap-1  border border-[#25303b] bg-[#0b1016] p-1">
                {running ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="flex items-center gap-1.5  border border-amber-500/20 bg-amber-500/8 px-2.5 py-2 font-mono text-[7px] font-bold uppercase tracking-wider text-amber-400 transition hover:bg-amber-500/12"
                    title="Stop simulation"
                  >
                    <Pause size={11} />
                    STOP
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={start}
                    className="flex items-center gap-1.5  border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-2 font-mono text-[7px] font-bold uppercase tracking-wider text-emerald-400 transition hover:bg-emerald-500/12"
                    title="Start simulation"
                  >
                    <span className="text-[9px]">▶</span>
                    START
                  </button>
                )}

                <button
                  type="button"
                  onClick={reset}
                  className="flex h-7 w-7 items-center justify-center  text-slate-600 transition hover:bg-white/[0.03] hover:text-cyan-400"
                  title="Reset mission"
                >
                  <RotateCcw size={12} />
                </button>

                {[1, 2, 4].map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => setSpeedMultiplier(speed)}
                    className={`hidden  px-2 py-2 font-mono text-[7px] font-bold tracking-wider transition lg:block ${
                      speedMultiplier === speed
                        ? "bg-cyan-400/10 text-cyan-400"
                        : "text-slate-700 hover:text-slate-400"
                    }`}
                    title={`${speed}x simulation speed`}
                  >
                    {speed}×
                  </button>
                ))}
              </div>

              <div className={`flex items-center gap-2  border px-2.5 py-2 ${
                running
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-amber-500/20 bg-amber-500/5"
              }`}>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="font-mono text-[8px] font-bold tracking-[0.12em] text-emerald-400">
                  LIVE
                </span>
              </div>
            </div>
          </header>

          {/* WORKSPACE */}
          <div className="min-h-0 flex-1 overflow-auto px-5 py-5 lg:px-7 lg:py-6">
            <div className="mx-auto max-w-[1920px]">
              {active === "overview" && (
                <OverviewWorkspace
                  state={state}
                  decision={decision}
                  onNavigate={setActive}
                />
              )}

              {active === "atmosphere" && (
                <div className="h-full">
                  <Atmosphere
                    state={state}
                    history={buildHistory(state)}
                  />
                </div>
              )}

              {active === "slam" && (
                <div className="h-full">
                  <SLAM
                    state={state}
                    onOpenVision={() => setActive("vision")}
                    onOpenAtmosphere={() => setActive("atmosphere")}
                    onOpenCommunication={() => setActive("communication")}
                    onOpenSafety={() => setActive("safety")}
                  />
                </div>
              )}
              {active === "vision" && (
                <div className="h-full">
                  <Cameras
                    state={state}
                    onOpenSLAM={() => setActive("slam")}
                    onOpenAtmosphere={() => setActive("atmosphere")}
                    onOpenSafety={() => setActive("safety")}
                  />
                </div>
              )}

              {active === "communication" && (
                <div className="h-full">
                  <Communication state={state} />
                </div>
              )}

              {active === "safety" && (
                <div className="h-full">
                  <Safety state={state} />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ========================================================================== */
/* OVERVIEW WORKSPACE                                                        */
/* ========================================================================== */

function OverviewWorkspace({
  state,
  decision,
  onNavigate,
}: {
  state: SimState;
  decision: DecisionState;
  onNavigate: (section: SectionId) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Workspace heading */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-500">
            Mission Control
          </div>

          <h1 className="mt-1 text-[22px] font-bold tracking-tight text-white">
            Mission Overview
          </h1>

          <div className="mt-1 text-[11px] text-slate-500">
            Operational situational awareness / decision support
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className=" border border-slate-700/60 bg-slate-900/50 px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-wider text-slate-500">
            Prototype telemetry
          </div>

          <div className=" border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-wider text-cyan-400">
            Decision path active
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* PRIMARY DECISION                                                 */}
      {/* ================================================================ */}

      <DecisionPanel
        decision={decision}
        state={state}
        onViewVision={() => onNavigate("vision")}
        onViewSafety={() => onNavigate("safety")}
        onViewMap={() => onNavigate("slam")}
      />

      {/* ================================================================ */}
      {/* MAIN 3-COLUMN SITUATIONAL AWARENESS                              */}
      {/* ================================================================ */}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.28fr_1fr]">
        <AtmosphereSummary
          state={state}
          onOpen={() => onNavigate("atmosphere")}
        />

        <SLAMSummary
          state={state}
          onOpen={() => onNavigate("slam")}
        />

        <VisionSummary
          state={state}
          onOpen={() => onNavigate("vision")}
        />
      </div>

      {/* ================================================================ */}
      {/* SECONDARY OPERATIONAL ROW                                       */}
      {/* ================================================================ */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CommunicationSummary
          state={state}
          onOpen={() => onNavigate("communication")}
        />

        <SafetySummary
          state={state}
          onOpen={() => onNavigate("safety")}
        />
      </div>

      {/* ================================================================ */}
      {/* EVENTS + EVIDENCE FOOTER                                        */}
      {/* ================================================================ */}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <EventTimeline state={state} />

        <DecisionEvidence state={state} decision={decision} />
      </div>
    </div>
  );
}

/* ========================================================================== */
/* DECISION PANEL                                                            */
/* ========================================================================== */

type DecisionState = {
  tone: Tone;
  title: string;
  subtitle: string;
  location: string;
  confidence: string;
  action: string;
  reason: string[];
};

function buildDecision(state: SimState): DecisionState {
  if (state.fsm.state === "HALT") {
    return {
      tone: "red",
      title: "HALT ROVER",
      subtitle: "Critical safety condition",
      location: `Rover (${state.slam.rover.x}, ${state.slam.rover.y})`,
      confidence: "HIGH",
      action: "Maintain halt / await clearance",
      reason: [
        `Safety FSM = ${state.fsm.state}`,
        `Atmospheric state = ${state.gas.overall_hazard}`,
        `Graham classification = ${state.gas.graham_state.replaceAll("_", " ")}`,
        state.gas.sensor_fault
          ? "Sensor disagreement detected"
          : "Gas sensor path currently consistent",
      ],
    };
  }

  if (state.detection.person_detected) {
    return {
      tone: "red",
      title: "PERSON DETECTED",
      subtitle: "Multimodal rescue candidate",
      location: `Zone D · (${state.slam.rover.x}, ${state.slam.rover.y})`,
      confidence: state.detection.two_of_three ? "HIGH" : "REVIEW",
      action: state.detection.two_of_three
        ? "Flag location / transmit rescue alert"
        : "Hold for additional confirmation",
      reason: [
        `Thermal evidence ${(state.detection.thermal_confidence * 100).toFixed(0)}%`,
        `Night-vision evidence ${(state.detection.nv_confidence * 100).toFixed(0)}%`,
        `CO₂ evidence ${(state.detection.co2_spike * 100).toFixed(0)}%`,
        `Multimodal agreement ${state.detection.two_of_three ? "2/3+" : "<2/3"}`,
      ],
    };
  }

  if (state.gas.overall_hazard === "DANGER") {
    return {
      tone: "red",
      title: "ROUTE RESTRICTED",
      subtitle: "Elevated atmospheric risk",
      location: `Rover (${state.slam.rover.x}, ${state.slam.rover.y})`,
      confidence: "HIGH",
      action: "Hold / avoid further exposure",
      reason: [
        `Atmospheric state = ${state.gas.overall_hazard}`,
        `Graham = ${state.gas.graham_ratio.toFixed(2)}`,
        `Coward = ${state.gas.coward_state.replaceAll("_", " ")}`,
        "Safety constraints active",
      ],
    };
  }

  if (
    state.gas.overall_hazard === "CAUTION" ||
    state.fsm.state === "CAUTION"
  ) {
    return {
      tone: "amber",
      title: "PROCEED WITH CAUTION",
      subtitle: "Elevated conditions under observation",
      location: `Rover (${state.slam.rover.x}, ${state.slam.rover.y})`,
      confidence: "MEDIUM",
      action: "Continue under caution",
      reason: [
        `Atmospheric state = ${state.gas.overall_hazard}`,
        `Safety FSM = ${state.fsm.state}`,
        `SLAM drift = ${state.slam.drift_percent.toFixed(2)}%`,
        "Continue monitoring before escalation",
      ],
    };
  }

  return {
    tone: "green",
    title: "CONTINUE EXPLORATION",
    subtitle: "No current escalation condition",
    location: `Rover (${state.slam.rover.x}, ${state.slam.rover.y})`,
    confidence: "NORMAL",
    action: "Continue mission",
    reason: [
      "Atmospheric state within current limits",
      `Safety FSM = ${state.fsm.state}`,
      "No confirmed survivor escalation",
      "Communication link available",
    ],
  };
}

function DecisionPanel({
  decision,
  state,
  onViewVision,
  onViewSafety,
  onViewMap,
}: {
  decision: DecisionState;
  state: SimState;
  onViewVision: () => void;
  onViewSafety: () => void;
  onViewMap: () => void;
}) {
  const tone = toneClasses[decision.tone];

  return (
    <section
      className={`overflow-hidden  border ${tone.border} ${tone.soft
        }`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_0.7fr]">
        {/* Decision */}
        <div className="relative p-5 md:p-6">
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${tone.dot} ${decision.tone === "red" ? "animate-pulse" : ""
                }`}
            />
            <span
              className={`font-mono text-[9px] font-bold uppercase tracking-[0.2em] ${tone.text}`}
            >
              Control Room Decision
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center  border ${tone.border} ${tone.bg}`}
            >
              {decision.tone === "green" ? (
                <CircleCheck size={30} className={tone.text} />
              ) : decision.tone === "amber" ? (
                <TriangleAlert size={30} className={tone.text} />
              ) : (
                <Siren size={30} className={tone.text} />
              )}
            </div>

            <div className="min-w-0">
              <div
                className={`text-[29px] font-black leading-none tracking-tight ${tone.text}`}
              >
                {decision.title}
              </div>

              <div className="mt-2 text-[12px] font-medium text-slate-300">
                {decision.subtitle}
              </div>

              <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-slate-500">
                {decision.location}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <DecisionMini
              label="FSM"
              value={state.fsm.state}
              tone={state.fsm.state === "HALT" ? "red" : "cyan"}
            />
            <DecisionMini
              label="MOTOR"
              value={state.fsm.motor_halt ? "STOPPED" : "ACTIVE"}
              tone={state.fsm.motor_halt ? "red" : "green"}
            />
            <DecisionMini
              label="CONF."
              value={decision.confidence}
              tone={decision.tone}
            />
          </div>
        </div>

        {/* Why */}
        <div className="border-t border-[#26303b] p-5 lg:border-l lg:border-t-0">
          <div className="mb-3 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Why this decision?
          </div>

          <div className="space-y-2">
            {decision.reason.map((reason, index) => (
              <div
                key={`${reason}-${index}`}
                className="flex items-start gap-2 text-[10px] leading-relaxed text-slate-400"
              >
                <CircleCheck
                  size={11}
                  className={`mt-0.5 shrink-0 ${index === decision.reason.length - 1 &&
                    state.gas.sensor_fault
                    ? "text-amber-400"
                    : "text-emerald-400"
                    }`}
                />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action */}
        <div className="border-t border-[#26303b] p-5 lg:border-l lg:border-t-0">
          <div className="mb-3 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Recommended action
          </div>

          <div className={`text-[13px] font-bold ${tone.text}`}>
            {decision.action}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {state.detection.person_detected && (
              <ActionButton
                label="Open Vision"
                tone="cyan"
                onClick={onViewVision}
              />
            )}

            {(state.fsm.state === "HALT" ||
              state.gas.overall_hazard !== "SAFE") && (
                <ActionButton
                  label="Open Safety"
                  tone="red"
                  onClick={onViewSafety}
                />
              )}

            <ActionButton
              label="View on Map"
              tone="amber"
              onClick={onViewMap}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* ATMOSPHERE SUMMARY                                                         */
/* ========================================================================== */

function AtmosphereSummary({
  state,
  onOpen,
}: {
  state: SimState;
  onOpen: () => void;
}) {
  const tone = hazardToTone(state.gas.overall_hazard);

  return (
    <Panel
      title="Atmospheric Monitoring"
      subtitle="Live gas state"
      icon={<Wind size={14} />}
      status={state.gas.overall_hazard}
      statusTone={tone}
      onOpen={onOpen}
    >
      <div className="grid grid-cols-2 gap-2">
        <SensorValue
          label="CH₄"
          value={`${state.gas.ch4_ndir.toFixed(3)}%`}
          tone={state.gas.ch4_ndir > 0.5 ? "red" : "amber"}
        />

        <SensorValue
          label="CO"
          value={`${(state.gas.co * 100).toFixed(2)}%`}
          tone={state.gas.co > 0.005 ? "red" : "green"}
        />

        <SensorValue
          label="O₂"
          value={`${state.gas.o2.toFixed(2)}%`}
          tone={state.gas.o2 < 19.5 ? "amber" : "green"}
        />

        <SensorValue
          label="CO₂"
          value={`${state.gas.co2.toFixed(3)}%`}
          tone="cyan"
        />
      </div>

      <div className="mt-3  border border-[#202a35] bg-[#080b0f] p-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[8px] uppercase tracking-wider text-slate-600">
            Graham Classification
          </span>
          <span className={`font-mono text-[9px] font-bold ${toneClasses[tone].text}`}>
            {state.gas.graham_state.replaceAll("_", " ")}
          </span>
        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#202834]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${tone === "red"
              ? "bg-red-500"
              : tone === "amber"
                ? "bg-amber-500"
                : tone === "cyan"
                  ? "bg-cyan-500"
                  : "bg-emerald-500"
              }`}
            style={{
              width: `${Math.min(
                100,
                Math.max(3, state.gas.graham_ratio * 25),
              )}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <ClassificationCell
          label="GRAHAM"
          value={state.gas.graham_ratio.toFixed(2)}
        />
        <ClassificationCell
          label="WILLETT"
          value={state.gas.willett_ratio.toFixed(2)}
        />
        <ClassificationCell
          label="COWARD"
          value={state.gas.coward_state.replaceAll("_", " ")}
        />
      </div>

      {state.gas.sensor_fault && (
        <div className="mt-3 flex items-center gap-2  border border-red-500/25 bg-red-500/5 px-3 py-2">
          <CircleX size={12} className="text-red-400" />
          <span className="font-mono text-[8px] font-semibold uppercase tracking-wider text-red-400">
            Sensor disagreement — NDIR fallback
          </span>
        </div>
      )}
    </Panel>
  );
}

/* ========================================================================== */
/* SLAM SUMMARY                                                               */
/* ========================================================================== */

function SLAMSummary({
  state,
  onOpen,
}: {
  state: SimState;
  onOpen: () => void;
}) {
  return (
    <Panel
      title="SLAM / Live Navigation"
      subtitle="Occupancy + rover pose"
      icon={<Map size={14} />}
      status="MAPPING"
      statusTone="green"
      onOpen={onOpen}
    >
      <div className="relative overflow-hidden  border border-[#1c2935] bg-[#05080b]">
        <MiniOccupancyMap state={state} />
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <MapMetric
          label="POS"
          value={`${state.slam.rover.x},${state.slam.rover.y}`}
        />
        <MapMetric
          label="HDG"
          value={`${state.slam.rover.heading.toFixed(0)}°`}
        />
        <MapMetric
          label="DRIFT"
          value={`${state.slam.drift_percent.toFixed(2)}%`}
        />
        <MapMetric
          label="NODES"
          value={`${state.slam.nodes_deployed}/4`}
        />
      </div>

      <div className="mt-3 flex items-center justify-between  border border-[#202a35] bg-[#080b0f] px-3 py-2">
        <div>
          <div className="font-mono text-[8px] uppercase tracking-wider text-slate-600">
            Distance traveled
          </div>
          <div className="mt-1 font-mono text-xs font-bold text-emerald-400">
            {state.slam.rover.distance_traveled.toFixed(0)} m
          </div>
        </div>

        <div className="h-6 w-px bg-[#202a35]" />

        <div>
          <div className="font-mono text-[8px] uppercase tracking-wider text-slate-600">
            SCSR remaining
          </div>
          <div className="mt-1 font-mono text-xs font-bold text-cyan-400">
            {state.slam.scsr_remaining.toFixed(1)} min
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ========================================================================== */
/* VISION SUMMARY                                                             */
/* ========================================================================== */

function VisionSummary({
  state,
  onOpen,
}: {
  state: SimState;
  onOpen: () => void;
}) {
  const detected = state.detection.person_detected;

  return (
    <Panel
      title="Vision / Thermal"
      subtitle="Multimodal perception"
      icon={<Camera size={14} />}
      status={detected ? "SURVIVOR" : "SCANNING"}
      statusTone={detected ? "red" : "cyan"}
      onOpen={onOpen}
    >
      <div className="relative overflow-hidden  border border-[#1c2935] bg-[#05070a]">
        <SimulatedThermalViewport state={state} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <EvidenceMini
          label="THERMAL"
          value={`${(state.detection.thermal_confidence * 100).toFixed(0)}%`}
          active={state.detection.thermal_confidence > 0.6}
        />
        <EvidenceMini
          label="NIGHT VISION"
          value={`${(state.detection.nv_confidence * 100).toFixed(0)}%`}
          active={state.detection.nv_confidence > 0.6}
        />
        <EvidenceMini
          label="CO₂"
          value={`${(state.detection.co2_spike * 100).toFixed(0)}%`}
          active={state.detection.co2_spike > 0.6}
        />
      </div>

      <div className="mt-3 flex items-center justify-between  border border-[#202a35] bg-[#080b0f] px-3 py-2">
        <div>
          <div className="font-mono text-[8px] uppercase tracking-wider text-slate-600">
            Evidence agreement
          </div>
          <div
            className={`mt-1 font-mono text-xs font-bold ${state.detection.two_of_three
              ? "text-emerald-400"
              : "text-amber-400"
              }`}
          >
            {state.detection.two_of_three ? "2 / 3 CONFIRMED" : "REVIEW"}
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-[8px] uppercase tracking-wider text-slate-600">
            Hotspots
          </div>
          <div className="mt-1 font-mono text-xs font-bold text-amber-400">
            {state.detection.hotspots.length}
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ========================================================================== */
/* COMMUNICATION SUMMARY                                                      */
/* ========================================================================== */

function CommunicationSummary({
  state,
  onOpen,
}: {
  state: SimState;
  onOpen: () => void;
}) {
  const activeNodes = state.comm.nodes.filter((node) => node.active).length;
  const tone: Tone =
    state.comm.bandwidth_kbps < 1.5 ? "amber" : "green";

  return (
    <Panel
      title="Communication / LoRa Mesh"
      subtitle="Network operations"
      icon={<Radio size={14} />}
      status={activeNodes >= 2 ? "LINKED" : "DEGRADED"}
      statusTone={tone}
      onOpen={onOpen}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr]">
        <div className="relative h-[180px] overflow-hidden  border border-[#202a35] bg-[#06090c]">
          <MiniMesh state={state} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NetworkMetric
            label="Bandwidth"
            value={`${state.comm.bandwidth_kbps.toFixed(2)} kbps`}
          />
          <NetworkMetric
            label="Latency"
            value={`${state.comm.latency_ms.toFixed(0)} ms`}
          />
          <NetworkMetric
            label="Active Nodes"
            value={`${activeNodes}/4`}
          />
          <NetworkMetric
            label="Mode"
            value={state.comm.mode.replaceAll("_", " ")}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2  border border-[#202a35] bg-[#080b0f] px-3 py-2">
        <Wifi size={12} className="text-emerald-400" />
        <span className="font-mono text-[8px] uppercase tracking-wider text-slate-500">
          Mesh heartbeat
        </span>
        <span className="ml-auto font-mono text-[9px] font-bold text-emerald-400">
          ACTIVE
        </span>
      </div>
    </Panel>
  );
}

/* ========================================================================== */
/* SAFETY SUMMARY                                                             */
/* ========================================================================== */

function SafetySummary({
  state,
  onOpen,
}: {
  state: SimState;
  onOpen: () => void;
}) {
  const halted = state.fsm.motor_halt;

  return (
    <Panel
      title="Safety & FSM"
      subtitle="Independent safety state"
      icon={<Shield size={14} />}
      status={halted ? "HALT" : state.fsm.state}
      statusTone={halted ? "red" : state.fsm.state === "CAUTION" ? "amber" : "green"}
      onOpen={onOpen}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[0.85fr_1.4fr]">
        <div
          className={` border p-4 ${halted
            ? "border-red-500/30 bg-red-500/5"
            : "border-emerald-500/20 bg-emerald-500/5"
            }`}
        >
          <div className="font-mono text-[8px] uppercase tracking-wider text-slate-600">
            Motor Authorization
          </div>

          <div
            className={`mt-3 text-xl font-black ${halted ? "text-red-400" : "text-emerald-400"
              }`}
          >
            {halted ? "REVOKED" : "ACTIVE"}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <LockKeyhole
              size={12}
              className={halted ? "text-red-400" : "text-emerald-400"}
            />
            <span className="font-mono text-[8px] text-slate-500">
              FSM {state.fsm.state}
            </span>
          </div>
        </div>

        <div>
          <div className="font-mono text-[8px] uppercase tracking-wider text-slate-600">
            State machine
          </div>

          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {(["NORMAL", "CAUTION", "HALT", "RESUME"] as const).map((node) => {
              const active = state.fsm.state === node;
              const nodeTone =
                node === "HALT"
                  ? "red"
                  : node === "CAUTION"
                    ? "amber"
                    : node === "RESUME"
                      ? "green"
                      : "cyan";

              return (
                <div
                  key={node}
                  className={` border px-2 py-2 text-center ${active
                    ? `${toneClasses[nodeTone].border} ${toneClasses[nodeTone].bg}`
                    : "border-[#202a35] bg-[#080b0f]"
                    }`}
                >
                  <div
                    className={`font-mono text-[8px] font-bold ${active
                      ? toneClasses[nodeTone].text
                      : "text-slate-700"
                      }`}
                  >
                    {node}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 font-mono text-[8px] leading-relaxed text-slate-500">
            {state.fsm.message}
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ========================================================================== */
/* EVENT TIMELINE                                                             */
/* ========================================================================== */

function EventTimeline({ state }: { state: SimState }) {
  return (
    <Panel
      title="Mission Events"
      subtitle="Recent operational events"
      icon={<Activity size={14} />}
      status={`${state.alerts.length} EVENTS`}
      statusTone="slate"
    >
      <div className="space-y-1.5">
        {state.alerts.slice(0, 7).map((alert, index) => {
          const eventTone =
            alert.level === "critical"
              ? "red"
              : alert.level === "warning"
                ? "amber"
                : alert.level === "success"
                  ? "green"
                  : "cyan";

          return (
            <div
              key={`${alert.time}-${index}-${alert.message}`}
              className="flex items-center gap-3  border border-[#1c2530] bg-[#080b0f] px-3 py-2.5"
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${toneClasses[eventTone].dot} ${eventTone === "red" ? "animate-pulse" : ""
                  }`}
              />

              <span className="w-[38px] shrink-0 font-mono text-[8px] text-slate-700">
                {alert.time}
              </span>

              <span className="min-w-0 flex-1 truncate text-[10px] text-slate-400">
                {alert.message}
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ========================================================================== */
/* DECISION EVIDENCE                                                          */
/* ========================================================================== */

function DecisionEvidence({
  state,
  decision,
}: {
  state: SimState;
  decision: DecisionState;
}) {
  const thermal = state.detection.thermal_confidence > 0.6;
  const nv = state.detection.nv_confidence > 0.6;
  const co2 = state.detection.co2_spike > 0.6;

  return (
    <Panel
      title="Decision Evidence"
      subtitle="Supporting signals"
      icon={<Crosshair size={14} />}
      status={decision.confidence}
      statusTone={decision.tone}
    >
      <div className="space-y-2">
        <EvidenceRow
          label="Thermal-YOLO"
          value={`${(state.detection.thermal_confidence * 100).toFixed(0)}%`}
          active={thermal}
        />

        <EvidenceRow
          label="Night Vision"
          value={`${(state.detection.nv_confidence * 100).toFixed(0)}%`}
          active={nv}
        />

        <EvidenceRow
          label="CO₂ evidence"
          value={`${(state.detection.co2_spike * 100).toFixed(0)}%`}
          active={co2}
        />

        <div className="mt-3  border border-[#202a35] bg-[#080b0f] p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[8px] uppercase tracking-wider text-slate-600">
              Multimodal agreement
            </span>

            <span
              className={`font-mono text-[10px] font-bold ${state.detection.two_of_three
                ? "text-emerald-400"
                : "text-amber-400"
                }`}
            >
              {state.detection.two_of_three ? "2 / 3" : "REVIEW"}
            </span>
          </div>

          <div className="mt-2 flex gap-1.5">
            {[thermal, nv, co2].map((active, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full ${active ? "bg-emerald-400" : "bg-[#27313c]"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ========================================================================== */
/* SHARED PANELS                                                              */
/* ========================================================================== */

function Panel({
  title,
  subtitle,
  icon,
  status,
  statusTone,
  onOpen,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  status: string;
  statusTone: Tone;
  onOpen?: () => void;
  children: ReactNode;
}) {
  const clickable = Boolean(onOpen);

  return (
    <section
      className={` border border-[#1c2631] bg-[#0a0e13] ${clickable ? "group" : ""
        }`}
    >
      <div className="flex items-center border-b border-[#18212a] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-cyan-500">{icon}</span>

          <div className="min-w-0">
            <div className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-300">
              {title}
            </div>
            <div className="truncate font-mono text-[7px] uppercase tracking-wider text-slate-700">
              {subtitle}
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span
            className={`rounded border px-2 py-1 font-mono text-[7px] font-bold uppercase tracking-wider ${toneClasses[statusTone].border} ${toneClasses[statusTone].bg} ${toneClasses[statusTone].text}`}
          >
            {status}
          </span>

          {clickable && (
            <button
              type="button"
              onClick={onOpen}
              aria-label={`Open ${title}`}
              className="flex h-6 w-6 items-center justify-center  border border-transparent text-slate-700 transition hover:border-[#26323e] hover:bg-[#10151c] hover:text-cyan-400"
            >
              <ChevronRight size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="p-4">{children}</div>
    </section>
  );
}

/* ========================================================================== */
/* VISUALIZATION COMPONENTS                                                   */
/* ========================================================================== */

function MiniOccupancyMap({ state }: { state: SimState }) {
  const cells = state.slam.grid;
  const path = state.slam.path;

  return (
    <div className="relative aspect-[1.55/1] w-full overflow-hidden">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(90,110,130,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(90,110,130,.14) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />

      <svg
        viewBox={`0 0 ${cells[0]?.length ?? 40} ${cells.length}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        {cells.map((row, y) =>
          row.map((cell, x) => {
            if (cell === 0) return null;

            const fill =
              cell === 2
                ? "#39434e"
                : cell === 3
                  ? "#7f1d1d"
                  : cell === 4
                    ? "#a21caf"
                    : "#12343a";

            return (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width={1}
                height={1}
                fill={fill}
                opacity={cell === 2 ? 0.9 : 0.8}
              />
            );
          }),
        )}

        {path.length > 1 && (
          <polyline
            points={path.map((point) => `${point.x + 0.5},${point.y + 0.5}`).join(" ")}
            fill="none"
            stroke="#22c55e"
            strokeWidth="0.45"
            vectorEffect="non-scaling-stroke"
          />
        )}

        <circle
          cx={state.slam.rover.x + 0.5}
          cy={state.slam.rover.y + 0.5}
          r="1.2"
          fill="#22c55e"
        />

        {state.detection.person_detected && (
          <circle
            cx="35.5"
            cy="20.5"
            r="1.2"
            fill="#ef4444"
            className="animate-pulse"
          />
        )}

        {state.detection.hotspots.map((hotspot, index) => (
          <circle
            key={`hotspot-${index}`}
            cx={hotspot.x + 0.5}
            cy={hotspot.y + 0.5}
            r="0.8"
            fill="#f59e0b"
          />
        ))}
      </svg>

      <div className="absolute bottom-2 left-2 flex items-center gap-3  border border-[#23303b] bg-black/60 px-2 py-1.5 backdrop-blur-sm">
        <LegendDot color="bg-emerald-400" label="ROVER" />
        <LegendDot color="bg-amber-400" label="HAZARD" />
        <LegendDot color="bg-red-400" label="SURVIVOR" />
      </div>

      <div className="absolute right-2 top-2  border border-[#23303b] bg-black/60 px-2 py-1 font-mono text-[7px] uppercase tracking-wider text-emerald-400 backdrop-blur-sm">
        LIVE MAP
      </div>
    </div>
  );
}

function SimulatedThermalViewport({ state }: { state: SimState }) {
  const detected = state.detection.person_detected;

  return (
    <div
      className="relative aspect-[1.4/1] w-full overflow-hidden"
      style={{
        background: detected
          ? "radial-gradient(circle at 60% 48%, rgba(255,180,30,.95) 0%, rgba(225,80,20,.9) 8%, rgba(80,30,100,.95) 28%, rgba(15,15,35,1) 70%)"
          : "radial-gradient(circle at 45% 52%, rgba(90,50,130,.75), rgba(8,10,18,1) 72%)",
      }}
    >
      {/* Tunnel-like visual structure */}
      <div className="absolute inset-x-[8%] top-[12%] h-[76%] rounded-[45%] border border-purple-300/10 bg-black/10" />
      <div className="absolute left-[10%] top-[25%] h-2 w-[60%] rotate-[7deg] rounded-full bg-orange-500/10 blur-md" />
      <div className="absolute bottom-[20%] right-[8%] h-3 w-[55%] -rotate-[8deg] rounded-full bg-fuchsia-500/10 blur-md" />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />

      {/* Simulated person */}
      {detected && (
        <div className="absolute left-[52%] top-[20%] h-[58%] w-[22%] -translate-x-1/2 rounded-[44%] border-2 border-red-300 bg-red-500/5 ">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded border border-red-400 bg-red-500/80 px-1.5 py-0.5 font-mono text-[7px] font-bold text-white">
            PERSON {(state.detection.thermal_confidence).toFixed(2)}
          </div>

          <div className="absolute left-1/2 top-[8%] h-[19%] w-[45%] -translate-x-1/2 rounded-full bg-orange-200/75 blur-[1px]" />
          <div className="absolute left-1/2 top-[28%] h-[55%] w-[56%] -translate-x-1/2 rounded-[45%] bg-orange-300/60 blur-[2px]" />
          <div className="absolute bottom-[1%] left-[16%] h-[34%] w-[24%] rotate-6 rounded-full bg-yellow-200/45 blur-[3px]" />
          <div className="absolute bottom-[1%] right-[16%] h-[34%] w-[24%] -rotate-6 rounded-full bg-yellow-200/45 blur-[3px]" />
        </div>
      )}

      <div className="absolute left-3 top-3  border border-[#26323e] bg-black/55 px-2 py-1 font-mono text-[7px] uppercase tracking-wider text-cyan-300 backdrop-blur-sm">
        THERMAL IR · 32×24
      </div>

      <div className="absolute bottom-3 left-3  border border-[#26323e] bg-black/55 px-2 py-1 font-mono text-[7px] uppercase tracking-wider text-slate-400 backdrop-blur-sm">
        {detected ? "TARGET TRACKING" : "SCANNING"}
      </div>

      <div className="absolute bottom-3 right-3  border border-[#26323e] bg-black/55 px-2 py-1 font-mono text-[7px] uppercase tracking-wider text-slate-400 backdrop-blur-sm">
        SIMULATION FEED
      </div>
    </div>
  );
}

function MiniMesh({ state }: { state: SimState }) {
  return (
    <svg viewBox="0 0 320 180" className="h-full w-full">
      <defs>
        <linearGradient id="meshLine" x1="0" x2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      <line x1="160" y1="25" x2="90" y2="75" stroke="url(#meshLine)" strokeWidth="1.5" />
      <line x1="160" y1="25" x2="230" y2="75" stroke="url(#meshLine)" strokeWidth="1.5" />
      <line x1="90" y1="75" x2="160" y2="130" stroke="url(#meshLine)" strokeWidth="1.5" />
      <line x1="230" y1="75" x2="160" y2="130" stroke="url(#meshLine)" strokeWidth="1.5" />
      <line x1="90" y1="75" x2="230" y2="75" stroke="#26333d" strokeWidth="1" />

      <MeshNode x={160} y={25} label="SURFACE" active />
      <MeshNode x={90} y={75} label="NODE 02" active={state.comm.nodes[1]?.active ?? false} />
      <MeshNode x={230} y={75} label="NODE 03" active={state.comm.nodes[2]?.active ?? false} />
      <MeshNode x={160} y={130} label="ROVER" active />
    </svg>
  );
}

function MeshNode({
  x,
  y,
  label,
  active,
}: {
  x: number;
  y: number;
  label: string;
  active: boolean;
}) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r="7"
        fill={active ? "#0f291e" : "#271319"}
        stroke={active ? "#22c55e" : "#ef4444"}
        strokeWidth="1.2"
      />
      <circle
        cx={x}
        cy={y}
        r="2.5"
        fill={active ? "#22c55e" : "#ef4444"}
      />
      <text
        x={x}
        y={y + 19}
        textAnchor="middle"
        fill="#64748b"
        fontSize="7"
        fontFamily="monospace"
      >
        {label}
      </text>
    </g>
  );
}

/* ========================================================================== */
/* SMALL UI COMPONENTS                                                        */
/* ========================================================================== */

function TopStatus({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div
      className={`hidden  border px-2.5 py-1.5 xl:block ${toneClasses[tone].border} ${toneClasses[tone].soft}`}
    >
      <span className="font-mono text-[7px] uppercase tracking-wider text-slate-600">
        {label}
      </span>
      <span className={`ml-2 font-mono text-[8px] font-bold ${toneClasses[tone].text}`}>
        {value}
      </span>
    </div>
  );
}

function HealthRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      <span className="min-w-0 flex-1 truncate text-[8px] text-slate-500">
        {label}
      </span>
      <span className="font-mono text-[7px] font-bold text-emerald-400">
        OK
      </span>
    </div>
  );
}

function MiniRailValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className=" border border-[#1b2530] bg-[#080b0f] px-2 py-1.5">
      <div className="font-mono text-[7px] text-slate-700">{label}</div>
      <div className="mt-0.5 truncate font-mono text-[8px] font-bold text-slate-400">
        {value}
      </div>
    </div>
  );
}

function DecisionMini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className=" border border-[#202a35] bg-black/15 px-2.5 py-2">
      <div className="font-mono text-[7px] uppercase tracking-wider text-slate-700">
        {label}
      </div>
      <div className={`mt-1 font-mono text-[9px] font-bold ${toneClasses[tone].text}`}>
        {value}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: Tone;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={` border px-2.5 py-2 font-mono text-[7px] font-bold uppercase tracking-wider transition hover:bg-white/5 ${toneClasses[tone].border} ${toneClasses[tone].text}`}
    >
      {label}
    </button>
  );
}

function SensorValue({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className=" border border-[#1d2833] bg-[#080b0f] p-3">
      <div className="font-mono text-[8px] uppercase tracking-wider text-slate-600">
        {label}
      </div>
      <div className={`mt-2 font-mono text-sm font-bold ${toneClasses[tone].text}`}>
        {value}
      </div>
    </div>
  );
}

function ClassificationCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className=" border border-[#1d2833] bg-[#080b0f] px-2 py-2">
      <div className="font-mono text-[7px] text-slate-700">{label}</div>
      <div className="mt-1 truncate font-mono text-[8px] font-bold text-slate-400">
        {value}
      </div>
    </div>
  );
}

function MapMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className=" border border-[#1d2833] bg-[#080b0f] px-2 py-2">
      <div className="font-mono text-[7px] text-slate-700">{label}</div>
      <div className="mt-1 font-mono text-[8px] font-bold text-cyan-400">
        {value}
      </div>
    </div>
  );
}

function EvidenceMini({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className=" border border-[#1d2833] bg-[#080b0f] p-2">
      <div className="font-mono text-[7px] uppercase tracking-wider text-slate-700">
        {label}
      </div>
      <div
        className={`mt-1 font-mono text-[9px] font-bold ${active ? "text-emerald-400" : "text-slate-600"
          }`}
      >
        {active ? "✓ " : ""}
        {value}
      </div>
    </div>
  );
}

function NetworkMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className=" border border-[#1d2833] bg-[#080b0f] p-3">
      <div className="font-mono text-[7px] uppercase tracking-wider text-slate-700">
        {label}
      </div>
      <div className="mt-1 font-mono text-[9px] font-bold text-cyan-400">
        {value}
      </div>
    </div>
  );
}

function EvidenceRow({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-3  border border-[#1c2530] bg-[#080b0f] px-3 py-2.5">
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-slate-700"
          }`}
      />

      <span className="flex-1 text-[9px] text-slate-400">{label}</span>

      <span
        className={`font-mono text-[9px] font-bold ${active ? "text-emerald-400" : "text-slate-600"
          }`}
      >
        {value}
      </span>
    </div>
  );
}

function LegendDot({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className={`h-1 w-1 rounded-full ${color}`} />
      <span className="font-mono text-[6px] text-slate-500">{label}</span>
    </div>
  );
}

/* ========================================================================== */
/* DECISION SUPPORT HELPERS                                                  */
/* ========================================================================== */

function hazardToTone(
  hazard: SimState["gas"]["overall_hazard"],
): Tone {
  switch (hazard) {
    case "CRITICAL":
    case "DANGER":
      return "red";
    case "CAUTION":
      return "amber";
    default:
      return "green";
  }
}

function getNavigationTone(
  section: SectionId,
  state: SimState,
): Tone {
  switch (section) {
    case "atmosphere":
      return hazardToTone(state.gas.overall_hazard);

    case "slam":
      return "green";

    case "vision":
      return state.detection.person_detected ? "red" : "cyan";

    case "communication":
      return state.comm.bandwidth_kbps < 1.5 ? "amber" : "green";

    case "safety":
      return state.fsm.state === "HALT"
        ? "red"
        : state.fsm.state === "CAUTION"
          ? "amber"
          : "green";

    default:
      return "cyan";
  }
}

function getNavigationState(
  section: SectionId,
  state: SimState,
): string {
  switch (section) {
    case "atmosphere":
      return state.gas.overall_hazard;

    case "slam":
      return "MAPPING";

    case "vision":
      return state.detection.person_detected
        ? "SURVIVOR"
        : "SCANNING";

    case "communication":
      return state.comm.bandwidth_kbps < 1.5
        ? "DEGRADED"
        : "LINKED";

    case "safety":
      return state.fsm.state;

    default:
      return "ACTIVE";
  }
}

function formatMissionTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");

  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${mins}:${secs}`;
}

/*
 * The current simulation is generated deterministically from mission time,
 * so a compact synthetic history is more useful than pretending we have a
 * remote telemetry database.
 */
function buildHistory(state: SimState) {
  const rows = [];
  const start = Math.max(0, state.t - 60);

  for (let i = 0; i < 61; i += 1) {
    const t = start + i;
    const phase =
      t < 15
        ? 0
        : t < 45
          ? ((t - 15) / 30) * 0.3
          : t < 80
            ? 0.3 + ((t - 45) / 35) * 0.5
            : t < 110
              ? 0.8 + ((t - 80) / 30) * 0.2
              : Math.max(0, 1 - ((t - 110) / 60) * 0.8);

    rows.push({
      t,
      ch4: 0.02 + Math.min(1, phase) * 0.4,
      co: (0.001 + Math.min(1, phase) * 0.09) * 100,
      co2: 0.04 + Math.min(1, phase) * 0.6,
    });
  }

  return rows;
}

function BootScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05070a]">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center  border border-cyan-400/20 bg-cyan-400/5">
          <Cpu size={22} className="animate-pulse text-cyan-400" />
        </div>

        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-400">
          Initializing RAKSHAK
        </div>

        <div className="mt-2 font-mono text-[8px] uppercase tracking-wider text-slate-700">
          Loading mission control telemetry
        </div>
      </div>
    </main>
  );
}