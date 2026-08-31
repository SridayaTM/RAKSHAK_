"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Flame,
  Gauge,
  Info,
  RefreshCcw,
  ShieldAlert,
  Thermometer,
  TriangleAlert,
  Wind,
  X,
  Zap,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { SimState } from "../lib/simulation";

type HazardTone = "safe" | "caution" | "danger" | "critical";

type HistoryPoint = {
  t: number;
  ch4: number;
  co: number;
  co2: number;
};

type AtmosphereProps = {
  state: SimState;
  history: HistoryPoint[];
};

const HAZARD_CONFIG: Record<
  string,
  {
    tone: HazardTone;
    label: string;
    description: string;
    action: string;
  }
> = {
  SAFE: {
    tone: "safe",
    label: "ATMOSPHERE NORMAL",
    description: "No current atmospheric escalation condition.",
    action: "Continue mission monitoring",
  },
  CAUTION: {
    tone: "caution",
    label: "ATMOSPHERIC CAUTION",
    description: "Elevated indicator detected. Continue under observation.",
    action: "Proceed with caution",
  },
  DANGER: {
    tone: "danger",
    label: "ATMOSPHERIC DANGER",
    description: "One or more hazardous indicators require operational restriction.",
    action: "Restrict route / assess safety",
  },
  CRITICAL: {
    tone: "critical",
    label: "CRITICAL ATMOSPHERE",
    description: "Critical condition detected. Safety restrictions take priority.",
    action: "Maintain halt / await clearance",
  },
};

const TONE_TEXT: Record<HazardTone, string> = {
  safe: "text-emerald-400",
  caution: "text-amber-400",
  danger: "text-red-400",
  critical: "text-red-300",
};

const TONE_BORDER: Record<HazardTone, string> = {
  safe: "border-emerald-500/25",
  caution: "border-amber-500/25",
  danger: "border-red-500/25",
  critical: "border-red-400/35",
};

const TONE_BG: Record<HazardTone, string> = {
  safe: "bg-emerald-500/5",
  caution: "bg-amber-500/5",
  danger: "bg-red-500/5",
  critical: "bg-red-500/[0.07]",
};

export default function Atmosphere({
  state,
  history,
}: AtmosphereProps) {
  const { gas, fsm } = state;

  const hazard =
    HAZARD_CONFIG[gas.overall_hazard] ??
    HAZARD_CONFIG.CAUTION;

  const tone = hazard.tone;

  const methanePercent = gas.ch4_ndir;
  const coPercent = gas.co * 100;
  const oxygen = gas.o2;
  const carbonDioxide = gas.co2;

  const methaneStatus = getMethaneStatus(
    methanePercent,
  );

  const coStatus = getCOStatus(
    coPercent,
  );

  const oxygenStatus = getOxygenStatus(
    oxygen,
  );

  const co2Status = getCO2Status(
    carbonDioxide,
  );

  const classifiedHazards = [
    methaneStatus.state !== "NORMAL",
    coStatus.state !== "NORMAL",
    oxygenStatus.state !== "NORMAL",
  ].filter(Boolean).length;

  const grahamState =
    formatClassification(gas.graham_state);

  const cowardState =
    formatClassification(gas.coward_state);

  const trendDirection =
    getTrendDirection(history);

  const chartData = history.map(
    (point) => ({
      time: `${Math.floor(point.t)}s`,
      ch4: Number(point.ch4.toFixed(3)),
      co: Number(point.co.toFixed(3)),
      co2: Number(point.co2.toFixed(3)),
    }),
  );

  return (
    <div className="space-y-4 pb-2">
      {/* ================================================================= */}
      {/* HEADER                                                            */}
      {/* ================================================================= */}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-500">
            Environmental Operations
          </div>

          <h1 className="mt-1 text-[22px] font-bold tracking-tight text-white">
            Atmospheric Monitoring
          </h1>

          <div className="mt-1 text-[11px] text-slate-500">
            Gas state / fire indicators / sensor agreement / operational risk
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusChip
            label="ATMOSPHERE"
            value={gas.overall_hazard}
            tone={tone}
          />

          <StatusChip
            label="FSM"
            value={fsm.state}
            tone={
              fsm.state === "HALT"
                ? "critical"
                : fsm.state === "CAUTION"
                  ? "caution"
                  : "safe"
            }
          />

          <StatusChip
            label="SENSOR PATH"
            value={
              gas.sensor_fault
                ? "DISAGREEMENT"
                : "CONSISTENT"
            }
            tone={
              gas.sensor_fault
                ? "danger"
                : "safe"
            }
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* PRIMARY OPERATIONAL DECISION                                     */}
      {/* ================================================================= */}

      <section
        className={`overflow-hidden rounded-xl border ${TONE_BORDER[tone]} ${TONE_BG[tone]}`}
      >
        <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_1fr_0.8fr]">
          {/* Decision */}
          <div className="p-5 md:p-6">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  tone === "safe"
                    ? "bg-emerald-400"
                    : tone === "caution"
                      ? "bg-amber-400"
                      : "animate-pulse bg-red-400"
                }`}
              />

              <span
                className={`font-mono text-[9px] font-bold uppercase tracking-[0.2em] ${TONE_TEXT[tone]}`}
              >
                Atmospheric Decision
              </span>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border ${TONE_BORDER[tone]} bg-black/20`}
              >
                {tone === "safe" ? (
                  <CircleCheck
                    size={30}
                    className="text-emerald-400"
                  />
                ) : tone === "caution" ? (
                  <TriangleAlert
                    size={30}
                    className="text-amber-400"
                  />
                ) : (
                  <ShieldAlert
                    size={30}
                    className="text-red-400"
                  />
                )}
              </div>

              <div className="min-w-0">
                <div
                  className={`text-[27px] font-black tracking-tight ${TONE_TEXT[tone]}`}
                >
                  {hazard.label}
                </div>

                <div className="mt-2 max-w-[620px] text-[11px] leading-relaxed text-slate-400">
                  {hazard.description}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <DecisionMetric
                label="GRAHAM"
                value={gas.graham_ratio.toFixed(2)}
                tone={
                  gas.graham_ratio >= 2
                    ? "danger"
                    : gas.graham_ratio >= 1
                      ? "caution"
                      : "safe"
                }
              />

              <DecisionMetric
                label="HAZARD SIGNALS"
                value={`${classifiedHazards}/3`}
                tone={
                  classifiedHazards >= 2
                    ? "danger"
                    : classifiedHazards === 1
                      ? "caution"
                      : "safe"
                }
              />

              <DecisionMetric
                label="MOTOR"
                value={
                  fsm.motor_halt
                    ? "HALTED"
                    : "ACTIVE"
                }
                tone={
                  fsm.motor_halt
                    ? "danger"
                    : "safe"
                }
              />
            </div>
          </div>

          {/* Interpretation */}
          <div className="border-t border-[#26313b] p-5 xl:border-l xl:border-t-0">
            <div className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">
              Classification evidence
            </div>

            <div className="mt-4 space-y-2.5">
              <ClassificationRow
                label="Graham"
                value={grahamState}
                metric={gas.graham_ratio.toFixed(3)}
                status={
                  gas.graham_ratio >= 2
                    ? "danger"
                    : gas.graham_ratio >= 1
                      ? "caution"
                      : "safe"
                }
              />

              <ClassificationRow
                label="Willett"
                value={
                  gas.willett_ratio.toFixed(
                    3,
                  )
                }
                metric={
                  gas.willett_confirms
                    ? "CONFIRMED"
                    : "NOT CONFIRMED"
                }
                status={
                  gas.willett_confirms
                    ? "danger"
                    : "safe"
                }
              />

              <ClassificationRow
                label="Coward"
                value={cowardState}
                metric={`${gas.coward_c_eff.toFixed(
                  3,
                )}% / ${gas.coward_i_eff.toFixed(
                  3,
                )}%`}
                status={
                  gas.coward_state ===
                  "EXPLOSIVE"
                    ? "critical"
                    : gas.coward_state ===
                        "APPROACHING_EXPLOSIVE"
                      ? "danger"
                      : "safe"
                }
              />
            </div>
          </div>

          {/* Action */}
          <div className="border-t border-[#26313b] p-5 xl:border-l xl:border-t-0">
            <div className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">
              Operational response
            </div>

            <div
              className={`mt-4 text-[15px] font-bold ${TONE_TEXT[tone]}`}
            >
              {hazard.action}
            </div>

            <div className="mt-4 rounded-lg border border-[#27323c] bg-black/20 p-3">
              <div className="font-mono text-[8px] uppercase tracking-wider text-slate-600">
                Safety path
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    fsm.motor_halt
                      ? "bg-red-400"
                      : "bg-emerald-400"
                  }`}
                />

                <span
                  className={`font-mono text-[9px] font-bold ${
                    fsm.motor_halt
                      ? "text-red-400"
                      : "text-emerald-400"
                  }`}
                >
                  FSM {fsm.state}
                </span>
              </div>

              <div className="mt-2 text-[9px] leading-relaxed text-slate-500">
                {fsm.message}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* LIVE GAS INSTRUMENTATION                                         */}
      {/* ================================================================= */}

      <section className="rounded-xl border border-[#1c2732] bg-[#0a0e13]">
        <SectionHeader
          icon={<Gauge size={14} />}
          title="Live Gas Instrumentation"
          subtitle="Current sensor state"
          right={
            <div className="flex items-center gap-2">
              <span className="font-mono text-[7px] uppercase tracking-wider text-slate-700">
                CH4 / CO / O2 / CO2
              </span>

              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  gas.sensor_fault
                    ? "bg-red-400"
                    : "bg-emerald-400"
                }`}
              />
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          <GasInstrument
            label="CH₄"
            sublabel="NDIR trusted methane"
            value={methanePercent.toFixed(3)}
            unit="%"
            status={methaneStatus.label}
            tone={methaneStatus.tone}
            threshold="Warn 0.50% · Danger 1.00%"
            progress={Math.min(
              100,
              (methanePercent / 1.0) * 100,
            )}
          />

          <GasInstrument
            label="CO"
            sublabel="Carbon monoxide"
            value={coPercent.toFixed(3)}
            unit="%"
            status={coStatus.label}
            tone={coStatus.tone}
            threshold="Warning 0.005%"
            progress={Math.min(
              100,
              (coPercent / 0.05) * 100,
            )}
          />

          <GasInstrument
            label="O₂"
            sublabel="Atmospheric oxygen"
            value={oxygen.toFixed(2)}
            unit="%"
            status={oxygenStatus.label}
            tone={oxygenStatus.tone}
            threshold="Low 19.50% · Critical 16.00%"
            progress={Math.min(
              100,
              Math.max(
                0,
                ((oxygen - 12) /
                  (21 - 12)) *
                  100,
              ),
            )}
            reverseRisk
          />

          <GasInstrument
            label="CO₂"
            sublabel="Carbon dioxide"
            value={carbonDioxide.toFixed(3)}
            unit="%"
            status={co2Status.label}
            tone={co2Status.tone}
            threshold="Supporting evidence"
            progress={Math.min(
              100,
              (carbonDioxide / 1.0) * 100,
            )}
          />
        </div>
      </section>

      {/* ================================================================= */}
      {/* SENSOR AGREEMENT                                                  */}
      {/* ================================================================= */}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.35fr]">
        <section className="rounded-xl border border-[#1c2732] bg-[#0a0e13]">
          <SectionHeader
            icon={<Zap size={14} />}
            title="Methane Validation"
            subtitle="Dual-sensor agreement"
            right={
              gas.sensor_fault ? (
                <StatusBadge
                  label="DISAGREEMENT"
                  tone="danger"
                />
              ) : (
                <StatusBadge
                  label="AGREEMENT"
                  tone="safe"
                />
              )
            }
          />

          <div className="space-y-3 p-4">
            <DualSensor
              label="MQ-4"
              value={state.gas.ch4_mq}
              unit="%"
              accent="amber"
            />

            <DualSensor
              label="NDIR"
              value={state.gas.ch4_ndir}
              unit="%"
              accent="cyan"
            />

            <div className="rounded-lg border border-[#202b35] bg-[#080b0f] p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[8px] uppercase tracking-wider text-slate-600">
                  Validation state
                </span>

                <span
                  className={`font-mono text-[9px] font-bold ${
                    gas.sensor_fault
                      ? "text-red-400"
                      : "text-emerald-400"
                  }`}
                >
                  {gas.sensor_fault
                    ? "FAULT / FALLBACK"
                    : "VOTE ACCEPTED"}
                </span>
              </div>

              <div className="mt-2 text-[9px] leading-relaxed text-slate-500">
                {gas.sensor_fault
                  ? "Methane sensor disagreement detected. The trusted path remains under review and the disagreement should be treated as operational evidence."
                  : "MQ-4 and NDIR measurements are currently within the configured voting tolerance."}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <SmallValue
                label="TRUSTED CH₄"
                value={`${gas.ch4_ndir.toFixed(3)}%`}
              />

              <SmallValue
                label="FAULT"
                value={
                  gas.sensor_fault
                    ? "YES"
                    : "NO"
                }
              />
            </div>
          </div>
        </section>

        {/* Classification matrix */}
        <section className="rounded-xl border border-[#1c2732] bg-[#0a0e13]">
          <SectionHeader
            icon={<Activity size={14} />}
            title="Atmospheric Classification"
            subtitle="Evidence matrix"
            right={
              <span className="font-mono text-[7px] uppercase tracking-wider text-slate-700">
                LIVE
              </span>
            }
          />

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1b2530] text-left">
                  <th className="px-4 py-3 font-mono text-[7px] font-bold uppercase tracking-wider text-slate-700">
                    Method
                  </th>

                  <th className="px-4 py-3 font-mono text-[7px] font-bold uppercase tracking-wider text-slate-700">
                    Value
                  </th>

                  <th className="px-4 py-3 font-mono text-[7px] font-bold uppercase tracking-wider text-slate-700">
                    Interpretation
                  </th>

                  <th className="px-4 py-3 text-right font-mono text-[7px] font-bold uppercase tracking-wider text-slate-700">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                <ClassificationTableRow
                  method="Graham"
                  value={gas.graham_ratio.toFixed(4)}
                  interpretation={grahamState}
                  tone={
                    gas.graham_ratio >=
                    2
                      ? "danger"
                      : gas.graham_ratio >=
                          1
                        ? "caution"
                        : "safe"
                  }
                />

                <ClassificationTableRow
                  method="Willett"
                  value={gas.willett_ratio.toFixed(
                    4,
                  )}
                  interpretation={
                    gas.willett_confirms
                      ? "CONFIRMS"
                      : "NO CONFIRMATION"
                  }
                  tone={
                    gas.willett_confirms
                      ? "danger"
                      : "safe"
                  }
                />

                <ClassificationTableRow
                  method="Coward"
                  value={`${gas.coward_c_eff.toFixed(
                    3,
                  )}%`}
                  interpretation={
                    gas.coward_state.replaceAll(
                      "_",
                      " ",
                    )
                  }
                  tone={
                    gas.coward_state ===
                    "EXPLOSIVE"
                      ? "critical"
                      : gas.coward_state ===
                          "APPROACHING_EXPLOSIVE"
                        ? "danger"
                        : "safe"
                  }
                />

                <ClassificationTableRow
                  method="Overall"
                  value={
                    gas.overall_hazard
                  }
                  interpretation={
                    hazard.label
                  }
                  tone={tone}
                  last
                />
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ================================================================= */}
      {/* TREND / TRAJECTORY                                                */}
      {/* ================================================================= */}

      <section className="rounded-xl border border-[#1c2732] bg-[#0a0e13]">
        <SectionHeader
          icon={<Activity size={14} />}
          title="Atmospheric Trajectory"
          subtitle="Rolling mission trend"
          right={
            <div className="flex items-center gap-2">
              <TrendIndicator
                direction={trendDirection}
              />

              <span className="font-mono text-[7px] uppercase tracking-wider text-slate-700">
                {history.length} samples
              </span>
            </div>
          }
        />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_250px]">
          <div className="min-h-[310px] p-3 md:p-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={280}
              >
                <LineChart
                  data={chartData}
                  margin={{
                    top: 8,
                    right: 16,
                    left: -15,
                    bottom: 4,
                  }}
                >
                  <CartesianGrid
                    stroke="#1e2832"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="time"
                    tick={{
                      fill: "#64748b",
                      fontSize: 8,
                      fontFamily:
                        "monospace",
                    }}
                    axisLine={{
                      stroke: "#27313b",
                    }}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fill: "#64748b",
                      fontSize: 8,
                      fontFamily:
                        "monospace",
                    }}
                    axisLine={{
                      stroke: "#27313b",
                    }}
                    tickLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      background:
                        "#0b1015",
                      border:
                        "1px solid #26323d",
                      borderRadius: 8,
                      fontSize: 9,
                      fontFamily:
                        "monospace",
                    }}
                    labelStyle={{
                      color: "#94a3b8",
                    }}
                  />

                  <Legend
                    wrapperStyle={{
                      fontSize: 8,
                      fontFamily:
                        "monospace",
                    }}
                  />

                  <ReferenceLine
                    y={1.0}
                    stroke="#ef4444"
                    strokeDasharray="5 4"
                    label={{
                      value: "CH₄ danger",
                      fill: "#ef4444",
                      fontSize: 8,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="ch4"
                    name="CH₄ %"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 3,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="co"
                    name="CO %"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />

                  <Line
                    type="monotone"
                    dataKey="co2"
                    name="CO₂ %"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyTrend />
            )}
          </div>

          <div className="border-t border-[#1b2530] p-4 xl:border-l xl:border-t-0">
            <div className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-slate-600">
              Trajectory readout
            </div>

            <div className="mt-4 space-y-2">
              <TrendReadout
                label="CH₄"
                value={`${methanePercent.toFixed(
                  3,
                )}%`}
                direction={trendDirection}
              />

              <TrendReadout
                label="CO"
                value={`${coPercent.toFixed(
                  3,
                )}%`}
                direction={trendDirection}
              />

              <TrendReadout
                label="O₂"
                value={`${oxygen.toFixed(
                  2,
                )}%`}
                direction={
                  oxygen < 19.5
                    ? "down"
                    : "flat"
                }
              />

              <TrendReadout
                label="CO₂"
                value={`${carbonDioxide.toFixed(
                  3,
                )}%`}
                direction={trendDirection}
              />
            </div>

            <div className="mt-4 rounded-lg border border-[#202b35] bg-[#080b0f] p-3">
              <div className="font-mono text-[7px] uppercase tracking-wider text-slate-700">
                Interpretation
              </div>

              <div className="mt-2 text-[9px] leading-relaxed text-slate-500">
                {trendDirection ===
                "up"
                  ? "Atmospheric indicators are trending upward in the current simulation window."
                  : trendDirection ===
                      "down"
                    ? "Atmospheric indicators are trending toward recovery."
                    : "Current atmospheric trajectory is relatively stable."}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SAFETY THRESHOLD MATRIX                                           */}
      {/* ================================================================= */}

      <section className="rounded-xl border border-[#1c2732] bg-[#0a0e13]">
        <SectionHeader
          icon={<ShieldAlert size={14} />}
          title="Operational Threshold Matrix"
          subtitle="Prototype configured limits"
          right={
            <span className="font-mono text-[7px] uppercase tracking-wider text-amber-500">
              VERIFY BEFORE FIELD DEPLOYMENT
            </span>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          <ThresholdCell
            parameter="CH₄"
            current={`${methanePercent.toFixed(
              3,
            )}%`}
            warning="0.50%"
            danger="1.00%"
            state={methaneStatus.label}
            tone={methaneStatus.tone}
          />

          <ThresholdCell
            parameter="CO"
            current={`${coPercent.toFixed(
              3,
            )}%`}
            warning="0.005%"
            danger="—"
            state={coStatus.label}
            tone={coStatus.tone}
          />

          <ThresholdCell
            parameter="O₂"
            current={`${oxygen.toFixed(
              2,
            )}%`}
            warning="19.50%"
            danger="16.00%"
            state={oxygenStatus.label}
            tone={oxygenStatus.tone}
            inverse
          />

          <ThresholdCell
            parameter="GRAHAM"
            current={gas.graham_ratio.toFixed(
              2,
            )}
            warning="≥ 1.00"
            danger="≥ 2.00"
            state={grahamState}
            tone={
              gas.graham_ratio >= 2
                ? "danger"
                : gas.graham_ratio >= 1
                  ? "caution"
                  : "safe"
            }
          />
        </div>

        <div className="border-t border-[#1b2530] px-4 py-3">
          <div className="flex items-start gap-2">
            <Info
              size={12}
              className="mt-0.5 shrink-0 text-amber-400"
            />

            <div className="text-[9px] leading-relaxed text-slate-500">
              Prototype thresholds shown here come from
              the configured gas-engine profile. Deployment
              limits, sensor calibration, approved DGMS
              requirements and exact regulatory methodology
              must be independently verified before field use.
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* ENGINE / FSM TRACE                                                */}
      {/* ================================================================= */}

      <section className="rounded-xl border border-[#1c2732] bg-[#0a0e13]">
        <SectionHeader
          icon={<RefreshCcw size={14} />}
          title="Safety Transition Trace"
          subtitle="Atmosphere → safety path"
          right={
            <StatusBadge
              label={
                fsm.motor_halt
                  ? "HALT ACTIVE"
                  : "MOTOR ENABLED"
              }
              tone={
                fsm.motor_halt
                  ? "danger"
                  : "safe"
              }
            />
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4">
          <TraceStep
            number="01"
            title="SENSORS"
            detail={
              gas.sensor_fault
                ? "Disagreement detected"
                : "Sensor path accepted"
            }
            tone={
              gas.sensor_fault
                ? "danger"
                : "safe"
            }
          />

          <TraceStep
            number="02"
            title="CLASSIFICATION"
            detail={`${grahamState} · ${cowardState}`}
            tone={
              tone ===
              "critical"
                ? "critical"
                : tone
            }
          />

          <TraceStep
            number="03"
            title="HAZARD"
            detail={gas.overall_hazard}
            tone={tone}
          />

          <TraceStep
            number="04"
            title="FSM"
            detail={`${fsm.state} · ${
              fsm.motor_halt
                ? "motor halted"
                : "motor enabled"
            }`}
            tone={
              fsm.motor_halt
                ? "danger"
                : "safe"
            }
            last
          />
        </div>
      </section>
    </div>
  );
}

/* ==========================================================================
   COMPONENTS
   ========================================================================== */

function SectionHeader({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-[#1b2530] px-4 py-3">
      <span className="text-cyan-500">
        {icon}
      </span>

      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-300">
          {title}
        </div>

        <div className="font-mono text-[7px] uppercase tracking-wider text-slate-700">
          {subtitle}
        </div>
      </div>

      {right && (
        <div className="ml-auto">
          {right}
        </div>
      )}
    </div>
  );
}

function StatusChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: HazardTone;
}) {
  return (
    <div
      className={`rounded-md border px-2.5 py-1.5 ${TONE_BORDER[tone]} ${TONE_BG[tone]}`}
    >
      <span className="font-mono text-[7px] uppercase tracking-wider text-slate-600">
        {label}
      </span>

      <span
        className={`ml-2 font-mono text-[7px] font-bold ${TONE_TEXT[tone]}`}
      >
        {value}
      </span>
    </div>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: HazardTone;
}) {
  return (
    <span
      className={`rounded border px-2 py-1 font-mono text-[7px] font-bold uppercase tracking-wider ${TONE_BORDER[tone]} ${TONE_BG[tone]} ${TONE_TEXT[tone]}`}
    >
      {label}
    </span>
  );
}

function DecisionMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: HazardTone;
}) {
  return (
    <div className="rounded-md border border-[#202a35] bg-black/15 px-3 py-2">
      <div className="font-mono text-[7px] uppercase tracking-wider text-slate-700">
        {label}
      </div>

      <div
        className={`mt-1 font-mono text-[9px] font-bold ${TONE_TEXT[tone]}`}
      >
        {value}
      </div>
    </div>
  );
}

function GasInstrument({
  label,
  sublabel,
  value,
  unit,
  status,
  tone,
  threshold,
  progress,
  reverseRisk = false,
}: {
  label: string;
  sublabel: string;
  value: string;
  unit: string;
  status: string;
  tone: HazardTone;
  threshold: string;
  progress: number;
  reverseRisk?: boolean;
}) {
  return (
    <div className="border-r border-b border-[#1b2530] p-4 last:border-r-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[13px] font-bold text-slate-200">
            {label}
          </div>

          <div className="mt-0.5 font-mono text-[7px] uppercase tracking-wider text-slate-700">
            {sublabel}
          </div>
        </div>

        <span
          className={`rounded border px-2 py-1 font-mono text-[7px] font-bold uppercase tracking-wider ${TONE_BORDER[tone]} ${TONE_BG[tone]} ${TONE_TEXT[tone]}`}
        >
          {status}
        </span>
      </div>

      <div className="mt-5 flex items-baseline gap-1">
        <span
          className={`font-mono text-[28px] font-black tracking-tight ${TONE_TEXT[tone]}`}
        >
          {value}
        </span>

        <span className="font-mono text-[9px] text-slate-700">
          {unit}
        </span>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#202a35]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            tone === "safe"
              ? "bg-emerald-400"
              : tone === "caution"
                ? "bg-amber-400"
                : "bg-red-500"
          }`}
          style={{
            width: `${Math.max(
              2,
              Math.min(100, progress),
            )}%`,
          }}
        />
      </div>

      <div className="mt-2 font-mono text-[7px] text-slate-700">
        {reverseRisk
          ? `Normal ≥ 19.50% · ${threshold}`
          : threshold}
      </div>
    </div>
  );
}

function DualSensor({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: number;
  unit: string;
  accent: "cyan" | "amber";
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#202a35] bg-[#080b0f] p-3">
      <div
        className={`h-2 w-2 rounded-full ${
          accent === "cyan"
            ? "bg-cyan-400"
            : "bg-amber-400"
        }`}
      />

      <div className="min-w-0 flex-1">
        <div className="font-mono text-[8px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </div>

        <div className="mt-0.5 font-mono text-[7px] text-slate-700">
          methane channel
        </div>
      </div>

      <div className="font-mono text-sm font-bold text-slate-200">
        {value.toFixed(4)}
        <span className="ml-1 text-[8px] text-slate-700">
          {unit}
        </span>
      </div>
    </div>
  );
}

function ClassificationRow({
  label,
  value,
  metric,
  status,
}: {
  label: string;
  value: string;
  metric: string;
  status: HazardTone;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-[#1c2732] bg-[#080b0f] px-3 py-2.5">
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-md ${TONE_BG[status]} ${TONE_TEXT[status]}`}
      >
        {status === "safe" ? (
          <Check size={11} />
        ) : (
          <AlertTriangle size={11} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-mono text-[8px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </div>

        <div className="mt-0.5 truncate text-[8px] text-slate-600">
          {value}
        </div>
      </div>

      <div
        className={`font-mono text-[8px] font-bold ${TONE_TEXT[status]}`}
      >
        {metric}
      </div>
    </div>
  );
}

function ClassificationTableRow({
  method,
  value,
  interpretation,
  tone,
  last = false,
}: {
  method: string;
  value: string;
  interpretation: string;
  tone: HazardTone;
  last?: boolean;
}) {
  return (
    <tr
      className={
        last
          ? ""
          : "border-b border-[#161f28]"
      }
    >
      <td className="px-4 py-3 font-mono text-[8px] font-bold text-slate-400">
        {method}
      </td>

      <td className="px-4 py-3 font-mono text-[8px] text-slate-500">
        {value}
      </td>

      <td className="px-4 py-3 text-[9px] text-slate-500">
        {interpretation}
      </td>

      <td className="px-4 py-3 text-right">
        <span
          className={`font-mono text-[7px] font-bold uppercase tracking-wider ${TONE_TEXT[tone]}`}
        >
          {tone === "safe"
            ? "NORMAL"
            : tone === "caution"
              ? "WATCH"
              : tone === "danger"
                ? "ALERT"
                : "CRITICAL"}
        </span>
      </td>
    </tr>
  );
}

function SmallValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-[#1c2732] bg-[#080b0f] p-2.5">
      <div className="font-mono text-[7px] uppercase tracking-wider text-slate-700">
        {label}
      </div>

      <div className="mt-1 font-mono text-[9px] font-bold text-slate-300">
        {value}
      </div>
    </div>
  );
}

function TrendIndicator({
  direction,
}: {
  direction: "up" | "down" | "flat";
}) {
  if (direction === "up") {
    return (
      <span className="flex items-center gap-1 font-mono text-[8px] font-bold text-red-400">
        <ArrowUp size={11} />
        RISING
      </span>
    );
  }

  if (direction === "down") {
    return (
      <span className="flex items-center gap-1 font-mono text-[8px] font-bold text-emerald-400">
        <ArrowDown size={11} />
        RECOVERING
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 font-mono text-[8px] font-bold text-slate-500">
      <Activity size={11} />
      STABLE
    </span>
  );
}

function TrendReadout({
  label,
  value,
  direction,
}: {
  label: string;
  value: string;
  direction: "up" | "down" | "flat";
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-[#1c2732] bg-[#080b0f] px-3 py-2.5">
      <span className="font-mono text-[8px] font-bold text-slate-500">
        {label}
      </span>

      <span className="ml-auto font-mono text-[9px] font-bold text-slate-300">
        {value}
      </span>

      {direction === "up" ? (
        <ArrowUp
          size={10}
          className="text-red-400"
        />
      ) : direction === "down" ? (
        <ArrowDown
          size={10}
          className="text-emerald-400"
        />
      ) : (
        <Activity
          size={10}
          className="text-slate-600"
        />
      )}
    </div>
  );
}

function EmptyTrend() {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-[#26313b] bg-[#080b0f]">
      <div className="text-center">
        <Activity
          size={20}
          className="mx-auto text-slate-700"
        />

        <div className="mt-2 font-mono text-[8px] uppercase tracking-wider text-slate-600">
          Waiting for trend history
        </div>
      </div>
    </div>
  );
}

function ThresholdCell({
  parameter,
  current,
  warning,
  danger,
  state,
  tone,
  inverse = false,
}: {
  parameter: string;
  current: string;
  warning: string;
  danger: string;
  state: string;
  tone: HazardTone;
  inverse?: boolean;
}) {
  return (
    <div className="border-r border-b border-[#1b2530] p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] font-bold text-slate-300">
          {parameter}
        </span>

        <span
          className={`font-mono text-[7px] font-bold uppercase tracking-wider ${TONE_TEXT[tone]}`}
        >
          {state}
        </span>
      </div>

      <div className="mt-3 font-mono text-[16px] font-bold text-slate-200">
        {current}
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex justify-between font-mono text-[7px] text-slate-700">
          <span>
            {inverse ? "LOW" : "WARN"}
          </span>
          <span>{warning}</span>
        </div>

        <div className="flex justify-between font-mono text-[7px] text-slate-700">
          <span>
            {inverse ? "CRITICAL" : "DANGER"}
          </span>
          <span>{danger}</span>
        </div>
      </div>
    </div>
  );
}

function TraceStep({
  number,
  title,
  detail,
  tone,
  last = false,
}: {
  number: string;
  title: string;
  detail: string;
  tone: HazardTone;
  last?: boolean;
}) {
  return (
    <div
      className={`relative p-4 ${
        last
          ? ""
          : "border-b border-[#1b2530] md:border-b-0 md:border-r"
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-md ${TONE_BG[tone]} ${TONE_TEXT[tone]}`}
        >
          <span className="font-mono text-[7px] font-bold">
            {number}
          </span>
        </div>

        <div className="font-mono text-[8px] font-bold uppercase tracking-wider text-slate-500">
          {title}
        </div>
      </div>

      <div className="mt-3 text-[9px] leading-relaxed text-slate-600">
        {detail}
      </div>
    </div>
  );
}

/* ==========================================================================
   STATE HELPERS
   ========================================================================== */

function getMethaneStatus(
  value: number,
): {
  label: string;
  tone: HazardTone;
  state: string;
} {
  if (value >= 1) {
    return {
      label: "DANGER",
      tone: "danger",
      state: "DANGER",
    };
  }

  if (value >= 0.5) {
    return {
      label: "WATCH",
      tone: "caution",
      state: "ELEVATED",
    };
  }

  return {
    label: "NORMAL",
    tone: "safe",
    state: "NORMAL",
  };
}

function getCOStatus(
  value: number,
): {
  label: string;
  tone: HazardTone;
  state: string;
} {
  if (value >= 0.05) {
    return {
      label: "HIGH",
      tone: "danger",
      state: "DANGER",
    };
  }

  if (value >= 0.005) {
    return {
      label: "ELEVATED",
      tone: "caution",
      state: "ELEVATED",
    };
  }

  return {
    label: "NORMAL",
    tone: "safe",
    state: "NORMAL",
  };
}

function getOxygenStatus(
  value: number,
): {
  label: string;
  tone: HazardTone;
  state: string;
} {
  if (value < 16) {
    return {
      label: "CRITICAL",
      tone: "critical",
      state: "CRITICAL",
    };
  }

  if (value < 19.5) {
    return {
      label: "LOW",
      tone: "caution",
      state: "ELEVATED",
    };
  }

  return {
    label: "NORMAL",
    tone: "safe",
    state: "NORMAL",
  };
}

function getCO2Status(
  value: number,
): {
  label: string;
  tone: HazardTone;
  state: string;
} {
  if (value >= 1) {
    return {
      label: "HIGH",
      tone: "danger",
      state: "DANGER",
    };
  }

  if (value >= 0.2) {
    return {
      label: "ELEVATED",
      tone: "caution",
      state: "ELEVATED",
    };
  }

  return {
    label: "NORMAL",
    tone: "safe",
    state: "NORMAL",
  };
}

function formatClassification(
  value: string,
): string {
  return value.replaceAll(
    "_",
    " ",
  );
}

function getTrendDirection(
  history: HistoryPoint[],
): "up" | "down" | "flat" {
  if (history.length < 8) {
    return "flat";
  }

  const first = history[0];
  const last =
    history[history.length - 1];

  const firstScore =
    first.ch4 +
    first.co +
    first.co2;

  const lastScore =
    last.ch4 +
    last.co +
    last.co2;

  const delta =
    lastScore - firstScore;

  if (delta > 0.05) {
    return "up";
  }

  if (delta < -0.05) {
    return "down";
  }

  return "flat";
}