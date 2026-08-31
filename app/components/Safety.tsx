"use client";

import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Shield,
  ShieldAlert,
  Siren,
  TimerReset,
  TriangleAlert,
  UnlockKeyhole,
} from "lucide-react";

import type { ReactNode } from "react";

import type { SimState } from "../lib/simulation";

type Tone = "green" | "amber" | "red" | "cyan" | "slate";

const text: Record<Tone, string> = {
  green: "text-emerald-300",
  amber: "text-amber-300",
  red: "text-red-300",
  cyan: "text-cyan-300",
  slate: "text-slate-300",
};

const border: Record<Tone, string> = {
  green: "border-emerald-400/25",
  amber: "border-amber-400/25",
  red: "border-red-400/35",
  cyan: "border-cyan-400/25",
  slate: "border-slate-700/70",
};

const soft: Record<Tone, string> = {
  green: "bg-emerald-400/[0.035]",
  amber: "bg-amber-400/[0.04]",
  red: "bg-red-400/[0.05]",
  cyan: "bg-cyan-400/[0.035]",
  slate: "bg-slate-900/45",
};

export default function Safety({
  state,
}: {
  state: SimState;
}) {
  const halted = state.fsm.motor_halt;
  const caution =
    state.fsm.state === "CAUTION";
  const resumed =
    state.fsm.state === "RESUME";

  const tone: Tone = halted
    ? "red"
    : caution
      ? "amber"
      : "green";

  const authority = halted
    ? "MOTOR AUTHORITY REVOKED"
    : caution
      ? "MOTOR AUTHORITY CONDITIONAL"
      : resumed
        ? "RESUME SIGNAL ACTIVE"
        : "MOTOR AUTHORITY GRANTED";

  const nextAction = halted
    ? "HOLD ROVER"
    : caution
      ? "MONITOR / PROCEED"
      : resumed
        ? "RESUME MISSION"
        : "CONTINUE MISSION";

  const currentIndex =
    state.fsm.state === "NORMAL"
      ? 0
      : state.fsm.state === "CAUTION"
        ? 1
        : state.fsm.state === "HALT"
          ? 2
          : 3;

  const resumeReady =
    state.gas.graham_ratio < 1.0;

  return (
    <div className="space-y-4 pb-3">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-300">
            Safety Authority
          </div>
          <h1 className="mt-1 text-[28px] font-bold tracking-tight text-white">
            Safety &amp; FSM
          </h1>
          <p className="mt-1 text-[11px] text-slate-500">
            Independent motor authority / atmospheric interlock / recovery state
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <HeaderChip
            label="FSM"
            value={state.fsm.state}
            tone={tone}
          />
          <HeaderChip
            label="MOTOR"
            value={halted ? "HALT" : "RUN"}
            tone={halted ? "red" : "green"}
          />
          <HeaderChip
            label="HALTS"
            value={`${state.fsm.halt_count}`}
            tone={state.fsm.halt_count > 0 ? "amber" : "green"}
          />
        </div>
      </header>

      {/* Primary authority block */}
      <section
        className={`overflow-hidden border ${border[tone]} ${soft[tone]}`}
      >
        <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.15fr_0.8fr]">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-14 w-14 items-center justify-center border ${border[tone]} bg-black/15`}
              >
                {halted ? (
                  <LockKeyhole
                    size={29}
                    className="text-red-300"
                    strokeWidth={1.5}
                  />
                ) : caution ? (
                  <ShieldAlert
                    size={29}
                    className="text-amber-300"
                    strokeWidth={1.5}
                  />
                ) : (
                  <UnlockKeyhole
                    size={29}
                    className="text-emerald-300"
                    strokeWidth={1.5}
                  />
                )}
              </div>

              <div>
                <div className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-slate-700">
                  Current authority
                </div>
                <div
                  className={`mt-1 text-[20px] font-black tracking-tight ${text[tone]}`}
                >
                  {authority}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="font-mono text-[7px] font-bold uppercase tracking-[0.18em] text-slate-700">
                Operator action
              </div>
              <div
                className={`mt-2 font-mono text-[26px] font-black tracking-tight ${text[tone]}`}
              >
                {nextAction}
              </div>
            </div>

            <div className="mt-5 border-l-2 border-current pl-3 text-[10px] leading-relaxed text-slate-500">
              {state.fsm.message}
            </div>
          </div>

          <div className="border-t border-[#27333d] p-6 xl:border-l xl:border-t-0">
            <div className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-slate-700">
              Safety state machine
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute left-[7%] right-[7%] top-[27px] h-px bg-[#26343e]" />
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      "NORMAL",
                      "CAUTION",
                      "HALT",
                      "RESUME",
                    ] as const
                  ).map((node, index) => {
                    const active =
                      currentIndex === index;
                    const nodeTone: Tone =
                      node === "HALT"
                        ? "red"
                        : node === "CAUTION"
                          ? "amber"
                          : "green";

                    return (
                      <div
                        key={node}
                        className="relative z-10 flex flex-col items-center"
                      >
                        <div
                          className={`flex h-14 w-14 items-center justify-center border ${
                            active
                              ? `${border[nodeTone]} ${soft[nodeTone]}`
                              : "border-[#27343e] bg-[#080d12]"
                          }`}
                        >
                          <span
                            className={`font-mono text-[9px] font-black ${
                              active
                                ? text[nodeTone]
                                : "text-slate-700"
                            }`}
                          >
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </div>

                        <div
                          className={`mt-3 text-[8px] font-bold tracking-wider ${
                            active
                              ? text[nodeTone]
                              : "text-slate-600"
                          }`}
                        >
                          {node}
                        </div>

                        <div className="mt-1 text-center font-mono text-[6px] uppercase tracking-wider text-slate-800">
                          {node === "NORMAL"
                            ? "monitor"
                            : node === "CAUTION"
                              ? "elevated"
                              : node === "HALT"
                                ? "motor stop"
                                : "recovery"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-7 border border-[#202d36] bg-[#080d12] p-4">
                <div className="flex items-start gap-3">
                  <Activity
                    size={15}
                    className="mt-0.5 text-cyan-300"
                  />
                  <div>
                    <div className="font-mono text-[7px] font-bold uppercase tracking-wider text-slate-600">
                      Transition rule
                    </div>
                    <div className="mt-1 text-[10px] leading-relaxed text-slate-400">
                      CAUTION escalates to HALT when Graham reaches the hard-stop
                      threshold with the required sensor agreement. HALT remains
                      authoritative until the recovery condition is satisfied.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#27333d] p-6 xl:border-l xl:border-t-0">
            <div className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-slate-700">
              Immediate interlocks
            </div>

            <div className="mt-4 space-y-2">
              <Interlock
                label="Motor"
                value={
                  halted ? "STOPPED" : "ENABLED"
                }
                tone={
                  halted ? "red" : "green"
                }
                icon={<Shield size={13} />}
              />

              <Interlock
                label="Graham"
                value={
                  state.gas.graham_ratio >= 2
                    ? "HARD LIMIT"
                    : state.gas.graham_ratio >= 1
                      ? "CAUTION"
                      : "CLEAR"
                }
                tone={
                  state.gas.graham_ratio >= 2
                    ? "red"
                    : state.gas.graham_ratio >= 1
                      ? "amber"
                      : "green"
                }
                icon={<GaugeIcon />}
              />

              <Interlock
                label="O₂"
                value={
                  state.gas.o2 < 16
                    ? "CRITICAL"
                    : state.gas.o2 < 19.5
                      ? "LOW"
                      : "NORMAL"
                }
                tone={
                  state.gas.o2 < 16
                    ? "red"
                    : state.gas.o2 < 19.5
                      ? "amber"
                      : "green"
                }
                icon={<Activity size={13} />}
              />

              <Interlock
                label="Sensor path"
                value={
                  state.gas.sensor_fault
                    ? "FAULT"
                    : "CONSISTENT"
                }
                tone={
                  state.gas.sensor_fault
                    ? "amber"
                    : "green"
                }
                icon={<TriangleAlert size={13} />}
              />
            </div>

            <div
              className={`mt-4 border p-4 ${resumeReady && halted ? "border-amber-400/20 bg-amber-400/[0.03]" : "border-[#202d36] bg-[#080d12]"}`}
            >
              <div className="flex items-center gap-2">
                <Clock3
                  size={12}
                  className={
                    resumeReady
                      ? "text-amber-300"
                      : "text-slate-700"
                  }
                />
                <span className="font-mono text-[7px] font-bold uppercase tracking-wider text-slate-600">
                  Recovery gate
                </span>
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="font-mono text-[21px] font-black text-slate-300">
                    {resumeReady
                      ? "READY"
                      : "BLOCKED"}
                  </div>
                  <div className="mt-1 text-[8px] text-slate-700">
                    {halted
                      ? "Recovery requires sustained clear conditions."
                      : "No recovery timer active."}
                  </div>
                </div>

                <TimerReset
                  size={25}
                  className={
                    resumeReady
                      ? "text-amber-300"
                      : "text-slate-800"
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Evidence board */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.78fr]">
        <section className="border border-[#1a2832] bg-[#070c11]">
          <SectionHeader
            icon={<AlertOctagon size={14} />}
            title="Safety evidence"
            subtitle="Signals presented to the independent authority"
          />

          <div className="grid grid-cols-2 md:grid-cols-4">
            <EvidenceCard
              label="GRAHAM RATIO"
              value={state.gas.graham_ratio.toFixed(2)}
              detail={state.gas.graham_state.replace(
                /_/g,
                " ",
              )}
              tone={
                state.gas.graham_ratio >= 2
                  ? "red"
                  : state.gas.graham_ratio >= 1
                    ? "amber"
                    : "green"
              }
            />

            <EvidenceCard
              label="CH₄ NDIR"
              value={`${state.gas.ch4_ndir.toFixed(3)}%`}
              detail="trusted path"
              tone={
                state.gas.ch4_ndir > 0.5
                  ? "amber"
                  : "green"
              }
            />

            <EvidenceCard
              label="O₂"
              value={`${state.gas.o2.toFixed(2)}%`}
              detail={
                state.gas.o2 < 16
                  ? "critical low"
                  : state.gas.o2 < 19.5
                    ? "low"
                    : "normal"
              }
              tone={
                state.gas.o2 < 16
                  ? "red"
                  : state.gas.o2 < 19.5
                    ? "amber"
                    : "green"
              }
            />

            <EvidenceCard
              label="OVERALL HAZARD"
              value={state.gas.overall_hazard}
              detail="combined classification"
              tone={getHazardTone(
                state.gas.overall_hazard,
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-px bg-[#16232c] md:grid-cols-3">
            <EvidenceStatus
              label="WILLETT"
              value={
                state.gas.willett_confirms
                  ? "CONFIRMS"
                  : "DOES NOT CONFIRM"
              }
              tone={
                state.gas.willett_confirms
                  ? "red"
                  : "green"
              }
            />
            <EvidenceStatus
              label="COWARD"
              value={state.gas.coward_state.replace(
                /_/g,
                " ",
              )}
              tone={
                state.gas.coward_state ===
                "EXPLOSIVE"
                  ? "red"
                  : state.gas.coward_state.includes(
                        "APPROACHING",
                      )
                    ? "amber"
                    : "green"
              }
            />
            <EvidenceStatus
              label="SENSOR FAULT"
              value={
                state.gas.sensor_fault
                  ? "ACTIVE"
                  : "NONE"
              }
              tone={
                state.gas.sensor_fault
                  ? "amber"
                  : "green"
              }
            />
          </div>
        </section>

        <section className="border border-[#1a2832] bg-[#070c11]">
          <SectionHeader
            icon={<Shield size={14} />}
            title="Authority record"
            subtitle="Current state, action and mission context"
          />

          <div className="p-5">
            <div className="grid grid-cols-2 gap-3">
              <LargeValue
                label="FSM STATE"
                value={state.fsm.state}
                tone={tone}
              />
              <LargeValue
                label="MOTOR"
                value={halted ? "HALTED" : "RUNNING"}
                tone={halted ? "red" : "green"}
              />
              <LargeValue
                label="HALT COUNT"
                value={`${state.fsm.halt_count}`}
                tone="amber"
              />
              <LargeValue
                label="MISSION"
                value={state.mission_phase}
                tone="cyan"
              />
            </div>

            <div className="mt-4 border border-[#202d36] bg-[#080d12] p-4">
              <div className="font-mono text-[7px] font-bold uppercase tracking-wider text-slate-700">
                Authority message
              </div>
              <div className="mt-2 text-[11px] leading-relaxed text-slate-400">
                {state.fsm.message}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Explicit doctrine */}
      <section className="border border-[#1a2832] bg-[#070c11]">
        <SectionHeader
          icon={<ShieldAlert size={14} />}
          title="Safety doctrine"
          subtitle="Decision authority is explicit; perception supports it"
        />

        <div className="grid grid-cols-1 gap-px bg-[#16232c] md:grid-cols-3">
          <Doctrine
            title="INDEPENDENT PATH"
            text="The safety state remains separate from the perception presentation. A UI state does not grant motor authority."
          />
          <Doctrine
            title="EVIDENCE BEFORE ACTION"
            text="Atmospheric values, classification outputs and sensor agreement remain visible behind the current safety state."
          />
          <Doctrine
            title="RECOVERY IS GUARDED"
            text="A HALT state is not cleared simply because one instantaneous reading improves; the underlying FSM owns recovery timing."
          />
        </div>
      </section>

      <div className="flex items-start gap-2 border border-amber-400/10 bg-amber-400/[0.02] px-3 py-2.5">
        <ShieldAlert
          size={11}
          className="mt-0.5 shrink-0 text-amber-300"
        />
        <div className="text-[8px] leading-relaxed text-slate-600">
          <span className="font-semibold text-amber-300">
            Prototype / simulation:
          </span>{" "}
          this page renders the existing safety FSM state. The project architecture
          explicitly keeps safety-critical motor control on the independent safety
          controller path, separate from the higher-level perception compute.
        </div>
      </div>
    </div>
  );
}

function HeaderChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className={`border ${border[tone]} ${soft[tone]} px-3 py-2`}>
      <span className="font-mono text-[6px] uppercase tracking-wider text-slate-700">
        {label}
      </span>
      <span className={`ml-2 font-mono text-[8px] font-bold ${text[tone]}`}>
        {value}
      </span>
    </div>
  );
}

function Interlock({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: Tone;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border border-[#202d36] bg-[#080d12] p-3">
      <span className={text[tone]}>{icon}</span>
      <span className="flex-1 font-mono text-[7px] font-bold uppercase tracking-wider text-slate-600">
        {label}
      </span>
      <span className={`font-mono text-[8px] font-bold ${text[tone]}`}>
        {value}
      </span>
    </div>
  );
}

function EvidenceCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
}) {
  return (
    <div className="border-r border-b border-[#17232c] p-5">
      <div className="font-mono text-[7px] font-bold uppercase tracking-wider text-slate-700">
        {label}
      </div>
      <div className={`mt-3 font-mono text-[20px] font-black ${text[tone]}`}>
        {value}
      </div>
      <div className="mt-1 text-[8px] uppercase tracking-wider text-slate-700">
        {detail}
      </div>
    </div>
  );
}

function EvidenceStatus({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className="bg-[#080d12] p-4">
      <div className="font-mono text-[6px] font-bold uppercase tracking-wider text-slate-700">
        {label}
      </div>
      <div className={`mt-2 font-mono text-[8px] font-bold uppercase ${text[tone]}`}>
        {value}
      </div>
    </div>
  );
}

function LargeValue({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className="border border-[#202d36] bg-[#080d12] p-4">
      <div className="font-mono text-[7px] uppercase tracking-wider text-slate-700">
        {label}
      </div>
      <div className={`mt-2 truncate font-mono text-[13px] font-black uppercase ${text[tone]}`}>
        {value}
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-[#17232c] px-5 py-4">
      <span className="text-cyan-300">{icon}</span>
      <div>
        <div className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-slate-300">
          {title}
        </div>
        <div className="mt-1 font-mono text-[6px] uppercase tracking-wider text-slate-700">
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function Doctrine({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="bg-[#080d12] p-5">
      <div className="font-mono text-[7px] font-black uppercase tracking-[0.18em] text-cyan-300">
        {title}
      </div>
      <div className="mt-2 text-[9px] leading-relaxed text-slate-600">
        {text}
      </div>
    </div>
  );
}

function GaugeIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 18 18"
      aria-hidden="true"
    >
      <path
        d="M3 12.5a6 6 0 1 1 12 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M9 9l3-2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function getHazardTone(
  hazard: SimState["gas"]["overall_hazard"],
): Tone {
  if (hazard === "CRITICAL" || hazard === "DANGER")
    return "red";
  if (hazard === "CAUTION") return "amber";
  return "green";
}
