"use client";

import { useMemo, useState } from "react";
import { Scan, ZoomIn, ZoomOut } from "lucide-react";
import type { SimState } from "../lib/simulation";

type Props = {
  state: SimState;
  onOpenVision?: () => void;
  onOpenAtmosphere?: () => void;
  onOpenCommunication?: () => void;
  onOpenSafety?: () => void;
};

type Layer = "cloud" | "returns" | "route" | "risk" | "nodes";

const W = 1200;
const H = 720;
const GRID = 40;

/*
 * Reference mine layout.
 * The actual rover pose/path from simulation.ts is used when available.
 * These branches provide the mine structure that LiDAR progressively
 * reconstructs as the rover advances.
 */
const mineReference = [
  { x: 2, y: 15 },
  { x: 5, y: 15 },
  { x: 8, y: 15 },
  { x: 11, y: 15 },
  { x: 11, y: 10 },
  { x: 11, y: 5 },
  { x: 16, y: 5 },
  { x: 20, y: 5 },
  { x: 25, y: 5 },
  { x: 25, y: 10 },
  { x: 25, y: 20 },
  { x: 30, y: 20 },
  { x: 35, y: 20 },
  { x: 35, y: 10 },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatMissionTime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const secs = (total % 60).toString().padStart(2, "0");

  return `${minutes}:${secs}`;
}

function deterministicNoise(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export default function SLAM({ state }: Props) {
  const [zoom, setZoom] = useState(1);

  /*
   * IMPORTANT:
   * Global map is the default.
   * The world remains stationary and the rover moves through it.
   */
  const [follow, setFollow] = useState(false);

  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    cloud: true,
    returns: true,
    route: true,
    risk: true,
    nodes: true,
  });

  const rover = state.slam.rover;

  /*
   * This is the real pose history coming from the simulation.
   * We do NOT manufacture the rover's current position here.
   */
  const currentPath =
    state.slam.path && state.slam.path.length > 1
      ? state.slam.path
      : mineReference.slice(0, 2);

  const mappedCells = state.slam.grid
    .flat()
    .filter((cell) => cell !== 0).length;

  const totalCells = Math.max(
    1,
    state.slam.grid.flat().length,
  );

  const coverage = clamp(
    Math.round((mappedCells / totalCells) * 100),
    0,
    100,
  );

  /*
   * Accumulated mine point cloud.
   *
   * This is deliberately generated from the travelled pose history,
   * rather than using a giant static rectangle.
   *
   * Every travelled segment produces:
   * - left wall returns
   * - right wall returns
   * - ceiling returns
   * - floor returns
   * - irregular surface points
   */
  const pointCloud = useMemo(() => {
    const points: Array<{
      x: number;
      y: number;
      z: number;
      radius: number;
      opacity: number;
    }> = [];

    const addTunnelSegment = (
      a: { x: number; y: number },
      b: { x: number; y: number },
      segment: number,
    ) => {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy);

      if (length < 0.01) {
        return;
      }

      const nx = -dy / length;
      const ny = dx / length;

      const samples = Math.max(
        55,
        Math.floor(length * 42),
      );

      for (let i = 0; i < samples; i += 1) {
        const progress = i / Math.max(1, samples - 1);

        const cx = a.x + dx * progress;
        const cy = a.y + dy * progress;

        const noise =
          deterministicNoise(segment * 1000 + i);

        const wallWidth =
          1.8 + noise * 2.4;

        /*
         * Left wall.
         */
        points.push({
          x:
            cx +
            nx *
              (wallWidth +
                deterministicNoise(i + segment * 13) * 0.8),
          y:
            cy +
            ny *
              (wallWidth +
                deterministicNoise(i + segment * 13) * 0.8),
          z:
            0.3 +
            deterministicNoise(i + segment * 31) * 4.8,
          radius:
            0.6 +
            deterministicNoise(i + 7) * 1.0,
          opacity:
            0.35 +
            deterministicNoise(i + 19) * 0.55,
        });

        /*
         * Right wall.
         */
        points.push({
          x:
            cx -
            nx *
              (wallWidth +
                deterministicNoise(i + segment * 17) * 0.8),
          y:
            cy -
            ny *
              (wallWidth +
                deterministicNoise(i + segment * 17) * 0.8),
          z:
            0.3 +
            deterministicNoise(i + segment * 43) * 4.8,
          radius:
            0.6 +
            deterministicNoise(i + 23) * 1.0,
          opacity:
            0.32 +
            deterministicNoise(i + 37) * 0.55,
        });

        /*
         * Ceiling / roof points.
         */
        if (i % 2 === 0) {
          points.push({
            x:
              cx +
              (deterministicNoise(i + 51) - 0.5) *
                3.5,
            y:
              cy +
              (deterministicNoise(i + 67) - 0.5) *
                3.5,
            z:
              4.8 +
              deterministicNoise(i + 83) * 2.4,
            radius:
              0.5 +
              deterministicNoise(i + 97) * 0.8,
            opacity:
              0.25 +
              deterministicNoise(i + 101) * 0.5,
          });
        }

        /*
         * Floor / side rubble.
         */
        if (i % 3 === 0) {
          points.push({
            x:
              cx +
              (deterministicNoise(i + 111) - 0.5) *
                4,
            y:
              cy +
              (deterministicNoise(i + 127) - 0.5) *
                4,
            z:
              deterministicNoise(i + 139) * 1.4,
            radius:
              0.5 +
              deterministicNoise(i + 151) * 0.7,
            opacity:
              0.2 +
              deterministicNoise(i + 163) * 0.4,
          });
        }
      }
    };

    /*
     * Only the travelled portion becomes strongly reconstructed.
     */
    for (
      let i = 0;
      i < currentPath.length - 1;
      i += 1
    ) {
      addTunnelSegment(
        currentPath[i],
        currentPath[i + 1],
        i,
      );
    }

    /*
     * Additional branches become progressively visible
     * as mapping advances.
     */
    const branches = [
      [
        { x: 11, y: 5 },
        { x: 11, y: 2 },
        { x: 18, y: 2 },
      ],
      [
        { x: 25, y: 10 },
        { x: 29, y: 10 },
        { x: 35, y: 10 },
      ],
      [
        { x: 25, y: 20 },
        { x: 25, y: 25 },
        { x: 32, y: 25 },
      ],
    ];

    branches.forEach((branch, branchIndex) => {
      if (
        currentPath.length >
        5 + branchIndex * 2
      ) {
        for (
          let i = 0;
          i < branch.length - 1;
          i += 1
        ) {
          addTunnelSegment(
            branch[i],
            branch[i + 1],
            50 + branchIndex * 10 + i,
          );
        }
      }
    });

    return points;
  }, [currentPath]);

  /*
   * 360° LIVE LiDAR.
   *
   * This updates whenever:
   * - rover position changes
   * - rover heading changes
   * - simulation time changes
   *
   * So the scan visibly follows the moving rover.
   */
  const lidarReturns = useMemo(() => {
    const returns: Array<{
      x: number;
      y: number;
      range: number;
      hit: boolean;
      angle: number;
    }> = [];

    const heading =
      (rover.heading * Math.PI) / 180;

    for (let i = 0; i < 360; i += 1) {
      const angle =
        heading +
        (i / 360) * Math.PI * 2;

      /*
       * Irregular range pattern gives the tunnel walls
       * a non-perfect synthetic look.
       */
      const wallRange =
        4.5 +
        3.8 *
          Math.abs(
            Math.sin(i * 2.17),
          ) +
        2.8 *
          Math.abs(
            Math.cos(i * 0.61),
          );

      const animatedNoise =
        0.55 *
        Math.sin(
          state.t * 2.4 + i * 0.17,
        );

      const range = Math.max(
        2.5,
        wallRange + animatedNoise,
      );

      returns.push({
        x:
          rover.x +
          Math.cos(angle) * range,
        y:
          rover.y +
          Math.sin(angle) * range,
        range,
        angle,
        hit: i % 6 !== 0,
      });
    }

    return returns;
  }, [
    rover.x,
    rover.y,
    rover.heading,
    state.t,
  ]);

  /*
   * Fixed global engineering coordinate system.
   *
   * THIS is the important correction:
   * the world does not follow the rover.
   * The rover physically changes position on the map.
   */
  const project = (
    x: number,
    y: number,
    z = 0,
  ) => {
    const scaleX = 28 * zoom;
    const scaleY = 22 * zoom;

    const originX = 85;
    const originY = 85;

    if (follow) {
      return {
        x:
          W / 2 +
          (x - rover.x) * scaleX,
        y:
          H / 2 +
          (y - rover.y) * scaleY -
          z * 12,
      };
    }

    return {
      x:
        originX +
        x * scaleX,
      y:
        originY +
        y * scaleY -
        z * 12,
    };
  };

  const roverPosition = project(
    rover.x,
    rover.y,
    0,
  );

  const hazard =
    state.detection.hotspots[0];

  const toggleLayer = (layer: Layer) => {
    setLayers((previous) => ({
      ...previous,
      [layer]: !previous[layer],
    }));
  };

  const activeReturns =
    lidarReturns.filter(
      (item) => item.hit,
    ).length;

  return (
    <div className="space-y-3 pb-3">
      {/* =========================================================
          HEADER
      ========================================================= */}

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#26343b] pb-3">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
            Navigation / Spatial Intelligence
          </div>

          <h1 className="mt-1 text-[25px] font-semibold text-slate-100">
            SLAM — 3D LiDAR Reconstruction
          </h1>

          <div className="mt-1 text-[10px] text-slate-500">
            Global mine frame · live rover pose · accumulated
            point cloud · 360° LiDAR returns
          </div>
        </div>

        <div className="flex gap-2 font-mono text-[8px]">
          <span className="border border-[#29413a] bg-[#0b1511] px-3 py-2 text-emerald-300">
            POSE{" "}
            {state.slam.drift_percent < 0.5
              ? "LOCKED"
              : "STABLE"}
          </span>

          <span className="border border-[#293840] bg-[#091015] px-3 py-2 text-slate-300">
            T+
            {formatMissionTime(state.t)}
          </span>

          <span className="border border-[#293840] bg-[#091015] px-3 py-2 text-slate-300">
            {coverage}% MAPPED
          </span>
        </div>
      </div>

      {/* =========================================================
          MAIN SLAM VIEW
      ========================================================= */}

      <section className="overflow-hidden border border-[#28353d] bg-[#03070a]">
        {/* TOOLBAR */}

        <div className="flex flex-wrap items-center gap-2 border-b border-[#243139] bg-[#080e12] px-3 py-2">
          <Scan
            size={15}
            className="text-slate-300"
          />

          <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-300">
            LIVE 3D SLAM MAP
          </div>

          <span className="font-mono text-[7px] uppercase text-slate-600">
            POINT CLOUD + OCCUPANCY + POSE GRAPH
          </span>

          <div className="ml-auto flex flex-wrap gap-1">
            {(Object.keys(
              layers,
            ) as Layer[]).map((layer) => (
              <button
                key={layer}
                type="button"
                onClick={() =>
                  toggleLayer(layer)
                }
                className={`border px-2 py-1 font-mono text-[7px] uppercase ${
                  layers[layer]
                    ? "border-[#40545c] bg-[#10191e] text-slate-300"
                    : "border-[#202a30] text-slate-700"
                }`}
              >
                {layer}
              </button>
            ))}

            <button
              type="button"
              onClick={() =>
                setFollow(
                  (value) => !value,
                )
              }
              className={`border px-2 py-1 font-mono text-[7px] uppercase ${
                follow
                  ? "border-[#52766d] text-emerald-300"
                  : "border-[#29363d] text-slate-500"
              }`}
            >
              {follow
                ? "FOLLOW ON"
                : "GLOBAL MAP"}
            </button>

            <button
              type="button"
              aria-label="Zoom in"
              onClick={() =>
                setZoom(
                  (value) =>
                    Math.min(
                      1.5,
                      value + 0.1,
                    ),
                )
              }
              className="border border-[#29363d] px-2 text-slate-400"
            >
              <ZoomIn size={12} />
            </button>

            <button
              type="button"
              aria-label="Zoom out"
              onClick={() =>
                setZoom(
                  (value) =>
                    Math.max(
                      0.7,
                      value - 0.1,
                    ),
                )
              }
              className="border border-[#29363d] px-2 text-slate-400"
            >
              <ZoomOut size={12} />
            </button>
          </div>
        </div>

        {/* =======================================================
            MAP CANVAS
        ======================================================= */}

        <div className="relative h-[610px] overflow-hidden">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <radialGradient
                id="slamMapBackground"
              >
                <stop
                  offset="0%"
                  stopColor="#0b1519"
                />
                <stop
                  offset="100%"
                  stopColor="#020507"
                />
              </radialGradient>

              <filter id="slamSoftPoint">
                <feGaussianBlur stdDeviation="0.65" />
              </filter>

              <radialGradient id="slamHazard">
                <stop
                  offset="0%"
                  stopColor="rgba(197,132,75,.24)"
                />
                <stop
                  offset="60%"
                  stopColor="rgba(164,88,65,.10)"
                />
                <stop
                  offset="100%"
                  stopColor="rgba(0,0,0,0)"
                />
              </radialGradient>
            </defs>

            {/* Background */}

            <rect
              width={W}
              height={H}
              fill="url(#slamMapBackground)"
            />

            {/* =================================================
                ENGINEERING GRID
            ================================================= */}

            {Array.from(
              { length: 31 },
              (_, index) => (
                <line
                  key={`vertical-${index}`}
                  x1={index * GRID}
                  y1="0"
                  x2={index * GRID}
                  y2={H}
                  stroke="#53636a"
                  strokeOpacity=".065"
                />
              ),
            )}

            {Array.from(
              { length: 19 },
              (_, index) => (
                <line
                  key={`horizontal-${index}`}
                  x1="0"
                  y1={index * GRID}
                  x2={W}
                  y2={index * GRID}
                  stroke="#53636a"
                  strokeOpacity=".065"
                />
              ),
            )}

            {/* =================================================
                ACCUMULATED POINT CLOUD
            ================================================= */}

            {layers.cloud &&
              pointCloud.map(
                (point, index) => {
                  const position =
                    project(
                      point.x,
                      point.y,
                      point.z,
                    );

                  return (
                    <circle
                      key={`cloud-${index}`}
                      cx={position.x}
                      cy={position.y}
                      r={point.radius}
                      fill="#aab6b4"
                      opacity={
                        point.opacity
                      }
                      filter={
                        index % 17 === 0
                          ? "url(#slamSoftPoint)"
                          : undefined
                      }
                    />
                  );
                },
              )}

            {/* =================================================
                TRAVELLED POSE GRAPH
            ================================================= */}

            {layers.route &&
              currentPath.length > 1 && (
                <polyline
                  points={currentPath
                    .map((point) => {
                      const position =
                        project(
                          point.x,
                          point.y,
                          0.2,
                        );

                      return `${position.x},${position.y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#a9c0b5"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity=".9"
                />
              )}

            {layers.route &&
              currentPath.map(
                (point, index) => {
                  const position =
                    project(
                      point.x,
                      point.y,
                      0.2,
                    );

                  return (
                    <circle
                      key={`pose-${index}`}
                      cx={position.x}
                      cy={position.y}
                      r="2"
                      fill="#a8bdb4"
                      opacity=".72"
                    />
                  );
                },
              )}

            {/* =================================================
                LIVE 360° LiDAR
            ================================================= */}

            {layers.returns &&
              lidarReturns.map(
                (item, index) => {
                  const position =
                    project(
                      item.x,
                      item.y,
                      0.1,
                    );

                  return (
                    <g
                      key={`lidar-${index}`}
                    >
                      {/* faint measurement ray */}

                      <line
                        x1={
                          roverPosition.x
                        }
                        y1={
                          roverPosition.y
                        }
                        x2={position.x}
                        y2={position.y}
                        stroke="#8da6a0"
                        strokeOpacity={
                          item.hit
                            ? ".085"
                            : ".02"
                        }
                        strokeWidth="0.8"
                      />

                      {/* actual return */}

                      <circle
                        cx={position.x}
                        cy={position.y}
                        r={
                          item.hit
                            ? index % 12 ===
                              0
                              ? 2.2
                              : 1.15
                            : 0.65
                        }
                        fill={
                          item.hit
                            ? "#b7c9c2"
                            : "#667671"
                        }
                        opacity={
                          item.hit
                            ? 0.72 +
                              0.16 *
                                Math.sin(
                                  state.t *
                                    3 +
                                    index *
                                      0.2,
                                )
                            : 0.2
                        }
                      />

                      {/* occasional strong return ring */}

                      {item.hit &&
                        index % 18 ===
                          0 && (
                          <circle
                            cx={
                              position.x
                            }
                            cy={
                              position.y
                            }
                            r="3.5"
                            fill="none"
                            stroke="#8ea7a0"
                            strokeOpacity=".22"
                          />
                        )}
                    </g>
                  );
                },
              )}

            {/* =================================================
                ROTATING LiDAR SCAN SECTOR
            ================================================= */}

            {layers.returns && (
              <path
                d={`
                  M ${roverPosition.x}
                    ${roverPosition.y}

                  L ${
                    roverPosition.x +
                    Math.cos(
                      state.t * 1.8,
                    ) *
                      250
                  }
                    ${
                      roverPosition.y +
                      Math.sin(
                        state.t * 1.8,
                      ) *
                        250
                    }

                  A 250 250 0 0 0

                  ${
                    roverPosition.x +
                    Math.cos(
                      state.t * 1.8 +
                        0.16,
                    ) *
                      250
                  }

                    ${
                      roverPosition.y +
                      Math.sin(
                        state.t * 1.8 +
                          0.16,
                      ) *
                        250
                    }

                  Z
                `}
                fill="#8ca9a0"
                opacity=".045"
              />
            )}

            {/* =================================================
                RELAY NODES
            ================================================= */}

            {layers.nodes &&
              [1, 2, 3, 4].map(
                (node, index) => {
                  const positions = [
                    { x: 8, y: 15 },
                    { x: 11, y: 5 },
                    { x: 25, y: 10 },
                    { x: 30, y: 20 },
                  ];

                  const nodePosition =
                    project(
                      positions[index].x,
                      positions[index].y,
                      0.3,
                    );

                  const active =
                    node <=
                    state.slam
                      .nodes_deployed +
                      1;

                  return (
                    <g
                      key={`node-${node}`}
                      opacity={
                        active ? 1 : 0.28
                      }
                    >
                      <circle
                        cx={
                          nodePosition.x
                        }
                        cy={
                          nodePosition.y
                        }
                        r="8"
                        fill="#071014"
                        stroke="#8aa79d"
                        strokeWidth="1.3"
                      />

                      <circle
                        cx={
                          nodePosition.x
                        }
                        cy={
                          nodePosition.y
                        }
                        r="2"
                        fill="#8aa79d"
                      />

                      <path
                        d={`
                          M ${
                            nodePosition.x -
                            11
                          }
                            ${
                              nodePosition.y -
                              10
                            }

                          Q ${
                            nodePosition.x
                          }
                            ${
                              nodePosition.y -
                              18
                            }

                            ${
                              nodePosition.x +
                              11
                            }
                            ${
                              nodePosition.y -
                              10
                            }
                        `}
                        fill="none"
                        stroke="#8aa79d"
                        strokeOpacity=".6"
                      />

                      <text
                        x={
                          nodePosition.x +
                          13
                        }
                        y={
                          nodePosition.y +
                          3
                        }
                        fill="#9aa9a8"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        N{node}
                      </text>
                    </g>
                  );
                },
              )}

            {/* =================================================
                HAZARD VOLUME
            ================================================= */}

            {layers.risk &&
              hazard && (
                <g>
                  {(() => {
                    const position =
                      project(
                        hazard.x,
                        hazard.y,
                        0.2,
                      );

                    return (
                      <>
                        <circle
                          cx={
                            position.x
                          }
                          cy={
                            position.y
                          }
                          r="58"
                          fill="url(#slamHazard)"
                        />

                        <circle
                          cx={
                            position.x
                          }
                          cy={
                            position.y
                          }
                          r="28"
                          fill="none"
                          stroke="#c29163"
                          strokeWidth="1.5"
                          strokeDasharray="6 5"
                        />

                        <circle
                          cx={
                            position.x
                          }
                          cy={
                            position.y
                          }
                          r="5"
                          fill="#c29163"
                        />

                        <text
                          x={
                            position.x + 34
                          }
                          y={
                            position.y - 25
                          }
                          fill="#c9a173"
                          fontSize="10"
                          fontFamily="monospace"
                        >
                          HAZARD
                        </text>
                      </>
                    );
                  })()}
                </g>
              )}

            {/* =================================================
                SURVIVOR CANDIDATE
            ================================================= */}

            {layers.risk &&
              state.detection
                .person_detected && (
                <g>
                  {(() => {
                    const position =
                      project(
                        35,
                        20,
                        0.5,
                      );

                    return (
                      <>
                        <circle
                          cx={
                            position.x
                          }
                          cy={
                            position.y
                          }
                          r="20"
                          fill="rgba(190,160,91,.12)"
                          stroke="#c7ab6a"
                          strokeDasharray="5 5"
                        />

                        <circle
                          cx={
                            position.x
                          }
                          cy={
                            position.y - 5
                          }
                          r="5"
                          fill="#c7ab6a"
                        />

                        <path
                          d={`
                            M ${
                              position.x -
                              9
                            }
                              ${
                                position.y +
                                11
                              }

                            Q ${
                              position.x
                            }
                              ${
                                position.y -
                                2
                              }

                              ${
                                position.x +
                                9
                              }
                              ${
                                position.y +
                                11
                              }
                          `}
                          fill="none"
                          stroke="#c7ab6a"
                          strokeWidth="3"
                        />

                        <text
                          x={
                            position.x +
                            28
                          }
                          y={
                            position.y + 3
                          }
                          fill="#c7ab6a"
                          fontSize="10"
                          fontFamily="monospace"
                        >
                          SURVIVOR
                          {" "}
                          CANDIDATE
                        </text>
                      </>
                    );
                  })()}
                </g>
              )}

            {/* =================================================
                ROVER
            ================================================= */}

            <g
              transform={`
                translate(
                  ${roverPosition.x}
                  ${roverPosition.y}
                )
                rotate(${rover.heading})
              `}
            >
              {/* heading cone */}

              <path
                d="M 0 -46 L 16 -17 L -16 -17 Z"
                fill="rgba(165,187,179,.06)"
                stroke="#9db5ad"
                strokeOpacity=".4"
              />

              {/* rover chassis */}

              <path
                d="M 0 -19 L 14 12 L 0 8 L -14 12 Z"
                fill="#0a1215"
                stroke={
                  state.fsm.motor_halt
                    ? "#c98585"
                    : "#a5bbb3"
                }
                strokeWidth="2"
              />

              {/* rover body */}

              <rect
                x="-8"
                y="-7"
                width="16"
                height="17"
                fill="#111b1e"
                stroke="#a5bbb3"
                strokeWidth="1.3"
              />

              {/* wheels */}

              <circle
                cx="-8"
                cy="11"
                r="4"
                fill="#060a0c"
                stroke="#687a79"
              />

              <circle
                cx="8"
                cy="11"
                r="4"
                fill="#060a0c"
                stroke="#687a79"
              />

              {/* forward indicator */}

              <line
                x1="0"
                y1="-8"
                x2="0"
                y2="-28"
                stroke={
                  state.fsm.motor_halt
                    ? "#c98585"
                    : "#a5bbb3"
                }
                strokeWidth="2"
              />
            </g>

            {/* rover coordinate crosshair */}

            <g opacity=".42">
              <line
                x1={
                  roverPosition.x - 20
                }
                y1={
                  roverPosition.y
                }
                x2={
                  roverPosition.x + 20
                }
                y2={
                  roverPosition.y
                }
                stroke="#9db0ad"
              />

              <line
                x1={
                  roverPosition.x
                }
                y1={
                  roverPosition.y - 20
                }
                x2={
                  roverPosition.x
                }
                y2={
                  roverPosition.y + 20
                }
                stroke="#9db0ad"
              />
            </g>
          </svg>

          {/* =====================================================
              MAP IDENTIFICATION
          ===================================================== */}

          <div className="absolute left-4 top-4 border border-[#2b3941] bg-[#070d11]/95 px-3 py-2">
            <div className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-slate-300">
              {follow
                ? "ROVER-CENTRIC SLAM"
                : "GLOBAL MINE FRAME"}
            </div>

            <div className="mt-1 font-mono text-[7px] uppercase text-slate-600">
              {follow
                ? "Rover locked to centre"
                : "World fixed · rover pose updates"}
            </div>
          </div>

          {/* =====================================================
              LIVE LiDAR HUD
          ===================================================== */}

          <div className="absolute bottom-4 left-4 border border-[#29363d] bg-[#070d11]/95 p-3 font-mono text-[8px]">
            <div className="text-slate-600">
              LIVE LiDAR
            </div>

            <div className="mt-1 text-slate-300">
              {activeReturns} RETURNS
              {" · "}
              360°
              {" · "}
              {rover.speed.toFixed(2)} m/s
            </div>
          </div>

          {/* =====================================================
              ROVER TELEMETRY
          ===================================================== */}

          <div className="absolute right-4 top-4 w-[230px] border border-[#29363d] bg-[#070d11]/95 p-3 font-mono text-[8px]">
            <div className="text-slate-600">
              ROVER POSE
            </div>

            <div className="mt-2 grid grid-cols-2 gap-y-2">
              <span className="text-slate-600">
                X
              </span>

              <span className="text-right text-slate-300">
                {rover.x.toFixed(2)} m
              </span>

              <span className="text-slate-600">
                Y
              </span>

              <span className="text-right text-slate-300">
                {rover.y.toFixed(2)} m
              </span>

              <span className="text-slate-600">
                HDG
              </span>

              <span className="text-right text-slate-300">
                {rover.heading.toFixed(0)}°
              </span>

              <span className="text-slate-600">
                SPEED
              </span>

              <span className="text-right text-emerald-300">
                {rover.speed.toFixed(2)} m/s
              </span>

              <span className="text-slate-600">
                DIST
              </span>

              <span className="text-right text-slate-300">
                {rover.distance_traveled.toFixed(
                  1,
                )}{" "}
                m
              </span>

              <span className="text-slate-600">
                DRIFT
              </span>

              <span className="text-right text-slate-300">
                {state.slam.drift_percent.toFixed(
                  2,
                )}
                %
              </span>
            </div>
          </div>

          {/* =====================================================
              SCALE
          ===================================================== */}

          <div className="absolute bottom-4 right-4 border border-[#29363d] bg-[#070d11]/95 px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="h-[1px] w-[70px] bg-slate-500" />

              <span className="font-mono text-[8px] text-slate-500">
                5 m
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          TELEMETRY CARDS
      ========================================================= */}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <InfoCard
          label="POSITION"
          value={`${rover.x.toFixed(
            2,
          )}, ${rover.y.toFixed(2)}`}
        />

        <InfoCard
          label="HEADING"
          value={`${rover.heading.toFixed(
            0,
          )}°`}
        />

        <InfoCard
          label="DISTANCE"
          value={`${rover.distance_traveled.toFixed(
            1,
          )} m`}
        />

        <InfoCard
          label="MAPPED"
          value={`${coverage}%`}
        />
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-[#26333b] bg-[#080e12] p-3">
      <div className="font-mono text-[8px] uppercase tracking-wider text-slate-600">
        {label}
      </div>

      <div className="mt-1 font-mono text-[15px] font-bold text-slate-300">
        {value}
      </div>
    </div>
  );
}