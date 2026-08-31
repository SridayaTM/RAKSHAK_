"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Check,
  Circle,
  Gauge,
  HeartPulse,
  Link2,
  Radio,
  Server,
  Signal,
  TriangleAlert,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

import type { SimState } from "../lib/simulation";

type Tone = "green" | "cyan" | "amber" | "red" | "slate";
type NodeKind = "surface" | "gateway" | "relay" | "rover";
type SelectedLink = "gateway" | 1 | 2 | 3 | 4 | null;

const T: Record<Tone, string> = {
  green: "text-emerald-300",
  cyan: "text-cyan-300",
  amber: "text-amber-300",
  red: "text-red-300",
  slate: "text-slate-300",
};

const B: Record<Tone, string> = {
  green: "border-emerald-400/25",
  cyan: "border-cyan-400/25",
  amber: "border-amber-400/25",
  red: "border-red-400/30",
  slate: "border-slate-700/70",
};

const BG: Record<Tone, string> = {
  green: "bg-emerald-400/[0.035]",
  cyan: "bg-cyan-400/[0.035]",
  amber: "bg-amber-400/[0.04]",
  red: "bg-red-400/[0.045]",
  slate: "bg-slate-900/45",
};

export default function Communication({
  state,
}: {
  state: SimState;
}) {
  const [selected, setSelected] =
    useState<SelectedLink>(null);

  const nodes = state.comm.nodes;
  const activeNodes = nodes.filter(
    (node) => node.active,
  ).length;

  const currentMode = state.comm.mode;
  const degraded =
    currentMode !== "VIDEO" ||
    state.comm.bandwidth_kbps < 1.5;

  const networkTone: Tone =
    currentMode === "ALERT_ONLY"
      ? "red"
      : currentMode === "THERMAL_SNAPSHOT"
        ? "amber"
        : "green";

  const networkState =
    currentMode === "VIDEO"
      ? "LINK NOMINAL"
      : currentMode === "THERMAL_SNAPSHOT"
        ? "LINK DEGRADED"
        : "PRIORITY ONLY";

  const packets = useMemo(
    () =>
      [...state.comm.packet_log]
        .slice(-8)
        .reverse(),
    [state.comm.packet_log],
  );

  const avgRssi = useMemo(() => {
    const active = nodes.filter(
      (node) => node.active,
    );
    if (!active.length) return -99;
    return (
      active.reduce(
        (sum, node) => sum + node.rssi,
        0,
      ) / active.length
    );
  }, [nodes]);

  const selectedNode =
    selected === null
      ? null
      : selected === "gateway"
        ? {
            id: "GATEWAY",
            active: true,
            rssi: avgRssi,
            distance: 0,
          }
        : nodes.find(
              (node) => node.id === selected,
            ) ?? null;

  return (
    <div className="space-y-4 pb-3">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-cyan-300">
            Network Operations
          </div>
          <h1 className="mt-1 text-[23px] font-bold tracking-tight text-white">
            Communication &amp; Mesh
          </h1>
          <div className="mt-1 text-[10px] text-slate-600">
            Live underground link topology / relay health / adaptive transmission
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusChip
            label="NETWORK"
            value={networkState}
            tone={networkTone}
          />
          <StatusChip
            label="ACTIVE NODES"
            value={`${activeNodes}/4`}
            tone={activeNodes >= 3 ? "green" : "amber"}
          />
          <StatusChip
            label="BANDWIDTH"
            value={`${state.comm.bandwidth_kbps.toFixed(2)} kbps`}
            tone={
              state.comm.bandwidth_kbps < 1.5
                ? "amber"
                : "green"
            }
          />
          <StatusChip
            label="LATENCY"
            value={`${(state.comm.latency_ms / 1000).toFixed(2)} s`}
            tone={
              state.comm.latency_ms > 2200
                ? "amber"
                : "green"
            }
          />
        </div>
      </div>

      {/* Decision banner */}
      <section
        className={`border ${B[networkTone]} ${BG[networkTone]}`}
      >
        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr_0.8fr]">
          <div className="p-5">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  networkTone === "red"
                    ? "animate-pulse bg-red-300"
                    : networkTone === "amber"
                      ? "bg-amber-300"
                      : "bg-emerald-300"
                }`}
              />
              <span
                className={`font-mono text-[7px] font-bold uppercase tracking-[0.2em] ${T[networkTone]}`}
              >
                Communication decision
              </span>
            </div>

            <div
              className={`mt-4 font-mono text-[27px] font-black tracking-tight ${T[networkTone]}`}
            >
              {currentMode === "VIDEO"
                ? "FULL VIDEO"
                : currentMode ===
                    "THERMAL_SNAPSHOT"
                  ? "THERMAL PRIORITY"
                  : "ALERT PRIORITY"}
            </div>

            <div className="mt-2 max-w-xl text-[10px] leading-relaxed text-slate-500">
              {currentMode === "VIDEO"
                ? "Link capacity supports the normal visual mission stream."
                : currentMode === "THERMAL_SNAPSHOT"
                  ? "Available capacity is reduced. Preserve high-value thermal evidence and suppress bulk video."
                  : "Bandwidth is constrained. Preserve safety, alerts and essential evidence first."}
            </div>
          </div>

          <div className="border-t border-[#22303a] p-5 xl:border-l xl:border-t-0">
            <div className="font-mono text-[7px] font-bold uppercase tracking-[0.18em] text-slate-700">
              What reaches surface
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <TrafficState
                label="VIDEO"
                state={
                  currentMode === "VIDEO"
                    ? "LIVE"
                    : "HELD"
                }
                tone={
                  currentMode === "VIDEO"
                    ? "green"
                    : "slate"
                }
              />
              <TrafficState
                label="THERMAL"
                state={
                  currentMode ===
                    "THERMAL_SNAPSHOT" ||
                  currentMode === "VIDEO"
                    ? "AVAILABLE"
                    : "PRIORITY"
                }
                tone="amber"
              />
              <TrafficState
                label="ALERT"
                state="PRIORITY"
                tone="red"
              />
            </div>

            <div className="mt-3 text-[8px] leading-relaxed text-slate-700">
              Safety and high-priority packets remain visible even
              when bulk visual traffic is reduced.
            </div>
          </div>

          <div className="border-t border-[#22303a] p-5 xl:border-l xl:border-t-0">
            <div className="font-mono text-[7px] font-bold uppercase tracking-[0.18em] text-slate-700">
              Current link
            </div>

            <div className="mt-4 space-y-2">
              <InfoRow
                label="RSSI"
                value={`${avgRssi.toFixed(0)} dBm`}
                tone={
                  avgRssi < -82
                    ? "red"
                    : avgRssi < -75
                      ? "amber"
                      : "green"
                }
              />
              <InfoRow
                label="BANDWIDTH"
                value={`${state.comm.bandwidth_kbps.toFixed(2)} kbps`}
              />
              <InfoRow
                label="LATENCY"
                value={`${Math.round(state.comm.latency_ms)} ms`}
              />
              <InfoRow
                label="THERMAL"
                value={`${state.comm.last_thermal_s.toFixed(1)} s ago`}
                tone={
                  state.comm.last_thermal_s < 3
                    ? "green"
                    : "amber"
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* Topology + inspector */}
      <section className="overflow-hidden border border-[#1a2832] bg-[#04080c]">
        <div className="flex items-center justify-between border-b border-[#17232c] bg-[#070c11] px-4 py-3">
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-cyan-300" />
            <div>
              <div className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-slate-300">
                Underground mesh topology
              </div>
              <div className="mt-1 font-mono text-[6px] uppercase tracking-wider text-slate-700">
                Surface → gateway → relays → rover
              </div>
            </div>
          </div>

          <div className="font-mono text-[6px] uppercase tracking-[0.18em] text-slate-700">
            T+{formatTime(state.t)} / LIVE
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative min-h-[500px] bg-[#03070a]">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(39,65,77,.13) 1px, transparent 1px), linear-gradient(90deg, rgba(39,65,77,.13) 1px, transparent 1px)",
                backgroundSize: "30px 30px",
              }}
            />

            <MeshTopology
              state={state}
              selected={selected}
              onSelect={setSelected}
            />

            <div className="absolute left-4 top-4 border border-[#1d2c36] bg-[#061017]/90 px-3 py-2 backdrop-blur">
              <div className="font-mono text-[6px] uppercase tracking-[0.18em] text-slate-700">
                Network state
              </div>
              <div className={`mt-1 flex items-center gap-2 font-mono text-[8px] font-bold ${T[networkTone]}`}>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    networkTone === "red"
                      ? "animate-pulse bg-red-300"
                      : networkTone === "amber"
                        ? "bg-amber-300"
                        : "bg-emerald-300"
                  }`}
                />
                {networkState}
              </div>
            </div>

            <div className="absolute bottom-4 left-4 grid grid-cols-4 gap-2">
              <MapMetric
                label="ACTIVE"
                value={`${activeNodes}/4`}
              />
              <MapMetric
                label="RSSI"
                value={`${avgRssi.toFixed(0)} dBm`}
              />
              <MapMetric
                label="BW"
                value={`${state.comm.bandwidth_kbps.toFixed(2)}k`}
              />
              <MapMetric
                label="LAT"
                value={`${(state.comm.latency_ms / 1000).toFixed(2)}s`}
              />
            </div>
          </div>

          <aside className="border-t border-[#17232c] bg-[#070c11] xl:border-l xl:border-t-0">
            <div className="border-b border-[#17232c] p-4">
              <div className="font-mono text-[7px] font-bold uppercase tracking-[0.18em] text-slate-600">
                Selected link
              </div>

              {selectedNode ? (
                <div className="mt-3 border border-cyan-400/15 bg-cyan-400/[0.025] p-3">
                  <div className="flex items-center gap-2">
                    <Signal size={12} className="text-cyan-300" />
                    <span className="font-mono text-[9px] font-bold text-white">
                      {selectedNode.id === "GATEWAY"
                        ? "SURFACE GATEWAY"
                        : `RELAY NODE ${selectedNode.id}`}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <InfoRow
                      label="STATUS"
                      value={
                        selectedNode.active
                          ? "ACTIVE"
                          : "OFFLINE"
                      }
                      tone={
                        selectedNode.active
                          ? "green"
                          : "red"
                      }
                    />
                    <InfoRow
                      label="RSSI"
                      value={`${selectedNode.rssi.toFixed(0)} dBm`}
                      tone={
                        selectedNode.rssi < -82
                          ? "red"
                          : selectedNode.rssi < -75
                            ? "amber"
                            : "green"
                      }
                    />
                    <InfoRow
                      label="DISTANCE"
                      value={`${selectedNode.distance.toFixed(0)} m`}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-3 border border-[#202c35] bg-[#080d12] p-3">
                  <div className="font-mono text-[8px] uppercase tracking-wider text-slate-700">
                    Click a node
                  </div>
                  <div className="mt-2 text-[9px] leading-relaxed text-slate-600">
                    Inspect relay signal, distance and availability directly on the live topology.
                  </div>
                </div>
              )}
            </div>

            <div className="border-b border-[#17232c] p-4">
              <div className="font-mono text-[7px] font-bold uppercase tracking-[0.18em] text-slate-600">
                Link behavior
              </div>

              <div className="mt-3 space-y-2">
                <BehaviorRow
                  label="VIDEO STREAM"
                  value={
                    currentMode === "VIDEO"
                      ? "ENABLED"
                      : "REDUCED"
                  }
                  tone={
                    currentMode === "VIDEO"
                      ? "green"
                      : "amber"
                  }
                />
                <BehaviorRow
                  label="THERMAL SNAPSHOT"
                  value="PRIORITY"
                  tone="amber"
                />
                <BehaviorRow
                  label="ALERT PACKET"
                  value="PRIORITY"
                  tone="red"
                />
                <BehaviorRow
                  label="HEARTBEAT"
                  value="MAINTAINED"
                  tone="green"
                />
              </div>
            </div>

            <div className="p-4">
              <div className="font-mono text-[7px] font-bold uppercase tracking-[0.18em] text-slate-600">
                Network health
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <HealthBox
                  icon={<Radio size={11} />}
                  label="MESH"
                  value={degraded ? "DEGRADED" : "HEALTHY"}
                  tone={degraded ? "amber" : "green"}
                />
                <HealthBox
                  icon={<HeartPulse size={11} />}
                  label="HEARTBEAT"
                  value="ACTIVE"
                  tone="green"
                />
                <HealthBox
                  icon={<Zap size={11} />}
                  label="QUEUE"
                  value={`${packets.length} PACKETS`}
                  tone="cyan"
                />
                <HealthBox
                  icon={<Link2 size={11} />}
                  label="ROVER"
                  value="CONNECTED"
                  tone="green"
                />
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Traffic + packet log */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <TrafficPanel state={state} />
        <PacketPanel packets={packets} />
      </div>

      <div className="flex items-start gap-2 border border-amber-400/10 bg-amber-400/[0.02] px-3 py-2.5">
        <TriangleAlert
          size={11}
          className="mt-0.5 shrink-0 text-amber-300"
        />
        <div className="text-[8px] leading-relaxed text-slate-600">
          <span className="font-semibold text-amber-300">
            Prototype / simulation:
          </span>{" "}
          the dashboard visualizes the intended adaptive underground communication
          workflow. The current simulator deliberately degrades bandwidth after
          the mission progresses and changes transmission mode accordingly.
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Topology                                                                    */
/* -------------------------------------------------------------------------- */

function MeshTopology({
  state,
  selected,
  onSelect,
}: {
  state: SimState;
  selected: SelectedLink;
  onSelect: (value: SelectedLink) => void;
}) {
  const width = 900;
  const height = 500;

  const rover = {
    x: 760,
    y: 370,
  };

  const relayPositions = [
    { x: 470, y: 250 },
    { x: 575, y: 305 },
    { x: 680, y: 338 },
    rover,
  ];

  const gateway = { x: 280, y: 190 };
  const surface = { x: 90, y: 100 };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="commGlow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Mine corridor */}
      <path
        d="M280 190 C390 220 430 250 520 290 S650 340 760 370"
        fill="none"
        stroke="#52646b"
        strokeOpacity=".16"
        strokeWidth="54"
        strokeLinecap="round"
      />

      <path
        d="M280 190 C390 220 430 250 520 290 S650 340 760 370"
        fill="none"
        stroke="#73878e"
        strokeOpacity=".15"
        strokeWidth="2"
        strokeDasharray="5 7"
      />

      {/* Surface -> gateway */}
      <NetworkLink
        a={surface}
        b={gateway}
        strength={1}
        active
        selected={selected === "gateway"}
        onClick={() => onSelect("gateway")}
      />

      {/* Gateway -> relays */}
      {relayPositions.slice(0, 3).map((point, index) => {
        const node = state.comm.nodes[index];
        const nextPoint =
          index === 0
            ? gateway
            : relayPositions[index - 1];

        return (
          <NetworkLink
            key={`link-${index}`}
            a={nextPoint}
            b={point}
            strength={rssiStrength(
              node?.rssi ?? -85,
            )}
            active={Boolean(node?.active)}
            selected={selected === (index + 1)}
            onClick={() =>
              onSelect((index + 1) as 1 | 2 | 3)
            }
          />
        );
      })}

      {/* Last relay -> rover */}
      <NetworkLink
        a={relayPositions[2]}
        b={rover}
        strength={rssiStrength(
          state.comm.nodes[3]?.rssi ?? -85,
        )}
        active={Boolean(
          state.comm.nodes[3]?.active,
        )}
        selected={selected === 4}
        onClick={() => onSelect(4)}
      />

      {/* Surface */}
      <NetworkNode
        x={surface.x}
        y={surface.y}
        label="SURFACE CONTROL"
        subtitle="CONTROL ROOM"
        kind="surface"
        active
      />

      {/* Gateway */}
      <g
        onClick={() => onSelect("gateway")}
        className="cursor-pointer"
      >
        <circle
          cx={gateway.x}
          cy={gateway.y}
          r="30"
          fill="rgba(67,221,188,.055)"
          stroke={
            selected === "gateway"
              ? "#7aeed9"
              : "#45dcbf"
          }
          strokeWidth={
            selected === "gateway" ? "2" : "1"
          }
        />
        <rect
          x={gateway.x - 11}
          y={gateway.y - 11}
          width="22"
          height="22"
          fill="#071116"
          stroke="#45dcbf"
          strokeWidth="1.4"
        />
        <path
          d={`M ${gateway.x - 5} ${gateway.y + 2} H ${gateway.x + 5} M ${gateway.x - 3} ${gateway.y - 3} H ${gateway.x + 3}`}
          stroke="#45dcbf"
          strokeWidth="1.2"
        />
        <text
          x={gateway.x}
          y={gateway.y + 48}
          textAnchor="middle"
          fill="#78dfcf"
          fontSize="10"
          fontFamily="monospace"
        >
          GATEWAY
        </text>
      </g>

      {/* Relays */}
      {relayPositions.slice(0, 3).map(
        (point, index) => (
          <NetworkNode
            key={`relay-${index}`}
            x={point.x}
            y={point.y}
            label={`N${index + 1}`}
            subtitle={
              state.comm.nodes[index]
                ?.active
                ? "RELAY ACTIVE"
                : "OFFLINE"
            }
            kind="relay"
            active={Boolean(
              state.comm.nodes[index]
                ?.active,
            )}
            alert={
              (state.comm.nodes[index]
                ?.rssi ?? -99) < -82
            }
            selected={
              selected === index + 1
            }
            onClick={() =>
              onSelect(
                (index + 1) as
                  | 1
                  | 2
                  | 3,
              )
            }
          />
        ),
      )}

      {/* Rover */}
      <NetworkNode
        x={rover.x}
        y={rover.y}
        label="ROVER"
        subtitle={
          state.fsm.motor_halt
            ? "MOTOR HALT"
            : "CONNECTED"
        }
        kind="rover"
        active
        alert={state.fsm.motor_halt}
        selected={selected === 4}
        onClick={() => onSelect(4)}
      />

      {/* Data flow particles */}
      {[0, 1, 2, 3, 4, 5].map(
        (index) => {
          const progress =
            ((state.t * 0.6 +
              index * 0.17) %
              1);
          const points = [
            surface,
            gateway,
            relayPositions[0],
            relayPositions[1],
            relayPositions[2],
            rover,
          ];
          const from =
            points[Math.min(index, 4)];
          const to =
            points[Math.min(index + 1, 5)];

          const x =
            from.x +
            (to.x - from.x) *
              progress;
          const y =
            from.y +
            (to.y - from.y) *
              progress;

          return (
            <circle
              key={`packet-${index}`}
              cx={x}
              cy={y}
              r="2.2"
              fill={
                state.comm.mode ===
                  "ALERT_ONLY" &&
                index < 2
                  ? "#ff7272"
                  : "#55dfc4"
              }
              opacity=".7"
              filter="url(#commGlow)"
            />
          );
        },
      )}
    </svg>
  );
}

function NetworkLink({
  a,
  b,
  strength,
  active,
  selected,
  onClick,
}: {
  a: { x: number; y: number };
  b: { x: number; y: number };
  strength: number;
  active: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <g
      onClick={onClick}
      className="cursor-pointer"
    >
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke="transparent"
        strokeWidth="18"
      />
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={
          !active
            ? "#39464d"
            : strength < 0.35
              ? "#ff6f6f"
              : strength < 0.62
                ? "#f3c55b"
                : "#45dcbf"
        }
        strokeWidth={selected ? "4" : "2.2"}
        strokeDasharray={
          active ? "0" : "6 6"
        }
        opacity={active ? ".72" : ".28"}
      />
      <circle
        cx={(a.x + b.x) / 2}
        cy={(a.y + b.y) / 2}
        r="3"
        fill={
          !active
            ? "#445158"
            : strength < 0.35
              ? "#ff6f6f"
              : strength < 0.62
                ? "#f3c55b"
                : "#45dcbf"
        }
        opacity=".8"
      />
    </g>
  );
}

function NetworkNode({
  x,
  y,
  label,
  subtitle,
  kind,
  active,
  alert = false,
  selected = false,
  onClick,
}: {
  x: number;
  y: number;
  label: string;
  subtitle: string;
  kind: NodeKind;
  active: boolean;
  alert?: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  const color =
    alert
      ? "#ff7777"
      : kind === "surface"
        ? "#7f9aa4"
        : "#45dcbf";

  return (
    <g
      onClick={onClick}
      className={onClick ? "cursor-pointer" : ""}
    >
      <circle
        cx={x}
        cy={y}
        r={kind === "rover" ? 28 : 22}
        fill={
          alert
            ? "rgba(255,90,90,.06)"
            : "rgba(60,220,190,.045)"
        }
        stroke={selected ? color : `${color}99`}
        strokeWidth={selected ? "2" : "1"}
        strokeDasharray={
          active ? "0" : "4 5"
        }
      />

      {kind === "rover" ? (
        <path
          d={`M ${x} ${y - 12} L ${x + 7} ${y + 8} L ${x} ${y + 3} L ${x - 7} ${y + 8} Z`}
          fill={color}
        />
      ) : (
        <circle
          cx={x}
          cy={y}
          r="7"
          fill="#071116"
          stroke={color}
          strokeWidth="1.4"
        />
      )}

      <circle
        cx={x + 14}
        cy={y - 14}
        r="3"
        fill={
          active
            ? alert
              ? "#ff7777"
              : "#45dcbf"
            : "#4d5960"
        }
      />

      <text
        x={x}
        y={y + 39}
        textAnchor="middle"
        fill={active ? "#d1dddf" : "#69757b"}
        fontSize="10"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {label}
      </text>

      <text
        x={x}
        y={y + 52}
        textAnchor="middle"
        fill="#58666d"
        fontSize="7"
        fontFamily="monospace"
      >
        {subtitle}
      </text>
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/* Panels                                                                      */
/* -------------------------------------------------------------------------- */

function TrafficPanel({
  state,
}: {
  state: SimState;
}) {
  const mode = state.comm.mode;

  const rows: Array<{
    label: string;
    value: string;
    tone: Tone;
  }> = [
    {
      label: "Video stream",
      value:
        mode === "VIDEO"
          ? "FULL"
          : mode === "THERMAL_SNAPSHOT"
            ? "SUPPRESSED"
            : "HELD",
      tone: mode === "VIDEO" ? "green" : "amber",
    },
    {
      label: "Thermal evidence",
      value:
        mode === "ALERT_ONLY"
          ? "PRIORITY"
          : "AVAILABLE",
      tone: "amber",
    },
    {
      label: "Gas state",
      value: "PRIORITY",
      tone: "cyan",
    },
    {
      label: "Safety alert",
      value: "PRIORITY",
      tone: "red",
    },
    {
      label: "SLAM pose",
      value: "AVAILABLE",
      tone: "green",
    },
    {
      label: "Heartbeat",
      value: "ACTIVE",
      tone: "green",
    },
  ];

  return (
    <section className="border border-[#1a2832] bg-[#070c11]">
      <div className="border-b border-[#17232c] px-4 py-3">
        <div className="font-mono text-[7px] font-bold uppercase tracking-[0.18em] text-slate-600">
          Adaptive traffic policy
        </div>
        <div className="mt-1 text-[9px] text-slate-700">
          What the rover prioritizes under the present link condition
        </div>
      </div>

      <div className="divide-y divide-[#111c24]">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${row.tone === "red" ? "bg-red-300" : row.tone === "amber" ? "bg-amber-300" : row.tone === "green" ? "bg-emerald-300" : "bg-cyan-300"}`}
              />
              <span className="text-[9px] text-slate-500">
                {row.label}
              </span>
            </div>
            <span
              className={`font-mono text-[7px] font-bold uppercase ${T[row.tone]}`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PacketPanel({
  packets,
}: {
  packets: {
    time: string;
    type: string;
    size: number;
    latency: number;
  }[];
}) {
  return (
    <section className="border border-[#1a2832] bg-[#070c11]">
      <div className="border-b border-[#17232c] px-4 py-3">
        <div className="font-mono text-[7px] font-bold uppercase tracking-[0.18em] text-slate-600">
          Live packet stream
        </div>
        <div className="mt-1 text-[9px] text-slate-700">
          Latest traffic emitted by the mission simulator
        </div>
      </div>

      <div className="divide-y divide-[#111c24]">
        {packets.length ? (
          packets.map((packet, index) => (
            <div
              key={`${packet.time}-${packet.type}-${index}`}
              className="grid grid-cols-[58px_1fr_auto_auto] items-center gap-2 px-4 py-2.5"
            >
              <span className="font-mono text-[7px] text-slate-700">
                {packet.time}
              </span>
              <span className="font-mono text-[7px] font-bold text-slate-500">
                {packet.type}
              </span>
              <span className="font-mono text-[7px] text-slate-700">
                {packet.size} B
              </span>
              <span className="font-mono text-[7px] text-cyan-300">
                {packet.latency} ms
              </span>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center font-mono text-[7px] uppercase tracking-wider text-slate-800">
            Waiting for mission traffic
          </div>
        )}
      </div>
    </section>
  );
}

function StatusChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className={`border px-2.5 py-1.5 ${B[tone]} ${BG[tone]}`}>
      <span className="font-mono text-[6px] uppercase tracking-wider text-slate-700">
        {label}
      </span>
      <span className={`ml-2 font-mono text-[7px] font-bold uppercase ${T[tone]}`}>
        {value}
      </span>
    </div>
  );
}

function TrafficState({
  label,
  state,
  tone,
}: {
  label: string;
  state: string;
  tone: Tone;
}) {
  return (
    <div className={`border ${B[tone]} ${BG[tone]} p-2.5`}>
      <div className="font-mono text-[6px] uppercase tracking-wider text-slate-700">
        {label}
      </div>
      <div className={`mt-1 font-mono text-[7px] font-bold ${T[tone]}`}>
        {state}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  tone = "cyan",
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#101a22] pb-2">
      <span className="font-mono text-[6px] uppercase tracking-wider text-slate-700">
        {label}
      </span>
      <span className={`font-mono text-[8px] font-bold ${T[tone]}`}>
        {value}
      </span>
    </div>
  );
}

function BehaviorRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className="flex items-center justify-between border border-[#1c2832] bg-[#080d12] px-2.5 py-2">
      <span className="font-mono text-[6px] uppercase tracking-wider text-slate-700">
        {label}
      </span>
      <span className={`font-mono text-[7px] font-bold ${T[tone]}`}>
        {value}
      </span>
    </div>
  );
}

function HealthBox({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className="border border-[#1c2832] bg-[#080d12] p-2.5">
      <div className="flex items-center gap-1.5">
        <span className={T[tone]}>{icon}</span>
        <span className="font-mono text-[6px] uppercase tracking-wider text-slate-700">
          {label}
        </span>
      </div>
      <div className={`mt-2 font-mono text-[7px] font-bold ${T[tone]}`}>
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
    <div className="border border-[#1e2c35] bg-[#061017]/92 px-2.5 py-2">
      <div className="font-mono text-[6px] uppercase tracking-wider text-slate-700">
        {label}
      </div>
      <div className="mt-1 font-mono text-[8px] font-bold text-slate-300">
        {value}
      </div>
    </div>
  );
}

function rssiStrength(rssi: number) {
  if (rssi >= -72) return 1;
  if (rssi >= -82) return 0.55;
  return 0.22;
}

function formatTime(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const secs = (value % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${secs}`;
}
