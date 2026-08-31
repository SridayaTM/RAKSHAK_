// RAKSHAK Simulation Engine
// Generates realistic, time-progressing sensor data for the dashboard demo.
// All values are hardcoded simulation — no hardware required.

export interface GasState {
  ch4_mq: number;
  ch4_ndir: number;
  co: number;
  o2: number;
  co2: number;
  n2: number;
  graham_ratio: number;
  graham_state: string;
  willett_ratio: number;
  willett_confirms: boolean;
  coward_c_eff: number;
  coward_i_eff: number;
  coward_state: string;
  sensor_fault: boolean;
  overall_hazard: 'SAFE' | 'CAUTION' | 'DANGER' | 'CRITICAL';
}

export interface FSMState {
  state: 'NORMAL' | 'CAUTION' | 'HALT' | 'RESUME';
  motor_halt: boolean;
  halt_count: number;
  message: string;
}

export interface RoverPosition {
  x: number;
  y: number;
  heading: number;
  distance_traveled: number;
  speed: number;
}

export interface SLAMState {
  grid: number[][];  // 0=unknown, 1=free, 2=obstacle, 3=hazard, 4=survivor
  rover: RoverPosition;
  path: {x: number; y: number}[];
  nodes_deployed: number;
  drift_percent: number;
  scsr_remaining: number;
}

export interface CommState {
  nodes: {id: number; active: boolean; rssi: number; distance: number}[];
  bandwidth_kbps: number;
  mode: 'VIDEO' | 'THERMAL_SNAPSHOT' | 'ALERT_ONLY';
  latency_ms: number;
  packet_log: {time: string; type: string; size: number; latency: number}[];
  last_thermal_s: number;
}

export interface DetectionState {
  person_detected: boolean;
  thermal_confidence: number;
  nv_confidence: number;
  co2_spike: number;
  two_of_three: boolean;
  breathing_rate: number | null;
  hotspots: {x: number; y: number; intensity: number}[];
}

export interface AlertEntry {
  time: string;
  level: 'critical' | 'warning' | 'info' | 'success';
  message: string;
}

export interface SimState {
  t: number;  // seconds since mission start
  gas: GasState;
  fsm: FSMState;
  slam: SLAMState;
  comm: CommState;
  detection: DetectionState;
  alerts: AlertEntry[];
  mission_phase: string;
}

// ─── helpers ──────────────────────────────────────────────────
const noise = (val: number, std: number) =>
  val + (Math.random() - 0.5) * 2 * std;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

const O2_N2_RATIO = 20.9 / 79.0;

function grahamRatio(co: number, o2: number, n2: number): [number, string] {
  const deltaO2 = O2_N2_RATIO * n2 - o2;
  if (deltaO2 < 1e-6) return [0, 'NORMAL'];
  const gr = (co / deltaO2) * 100;
  if (gr <= 0.4) return [gr, 'NORMAL'];
  if (gr <= 1.0) return [gr, 'CHECK_REQUIRED'];
  if (gr <= 2.0) return [gr, 'HEATING_DETECTED'];
  if (gr <= 3.0) return [gr, 'SERIOUS_HEATING'];
  return [gr, 'ACTIVE_FIRE'];
}

function cowardState(ch4: number, co: number, o2: number): string {
  const c_eff = ch4 + co;
  if (o2 < 12) return 'INERT_SAFE';
  if (c_eff < 4.0) return 'SAFE';
  if (c_eff < 5.0) return 'APPROACHING_EXPLOSIVE';
  if (c_eff <= 15.0) return 'EXPLOSIVE';
  return 'ABOVE_UEL_DANGEROUS';
}

function overallHazard(
  gs: string, cs: string, wc: boolean, o2: number, ch4: number, co: number
): GasState['overall_hazard'] {
  if ((gs === 'SERIOUS_HEATING' || gs === 'ACTIVE_FIRE') && wc) return 'CRITICAL';
  if (cs === 'EXPLOSIVE') return 'CRITICAL';
  if (['HEATING_DETECTED','SERIOUS_HEATING','ACTIVE_FIRE'].includes(gs)) return 'DANGER';
  if (['APPROACHING_EXPLOSIVE','ABOVE_UEL_DANGEROUS'].includes(cs)) return 'DANGER';
  if (o2 < 16) return 'DANGER';
  if (gs === 'CHECK_REQUIRED') return 'CAUTION';
  if (o2 < 19.5) return 'CAUTION';
  if (ch4 > 0.5) return 'CAUTION';
  if (co > 0.005) return 'CAUTION';
  return 'SAFE';
}

// ─── SLAM grid initializer ────────────────────────────────────
function initGrid(W: number, H: number): number[][] {
  return Array.from({length: H}, () => Array(W).fill(0));
}

const GRID_W = 40;
const GRID_H = 30;

// Pre-defined tunnel walls
const WALLS = new Set<string>();
for (let y = 0; y < GRID_H; y++) {
  WALLS.add(`0,${y}`); WALLS.add(`${GRID_W-1},${y}`);
}
for (let x = 0; x < GRID_W; x++) {
  WALLS.add(`${x},0`); WALLS.add(`${x},${GRID_H-1}`);
}
// Internal wall segments (pillars / cross tunnels)
for (let y = 8; y < 22; y++) { WALLS.add(`15,${y}`); }
for (let x = 15; x < 30; x++) { WALLS.add(`${x},14`); }

// ─── Rover path (pre-computed waypoints) ──────────────────────
const ROVER_PATH: {x: number; y: number}[] = [
  {x: 2, y: 15},
  {x: 5, y: 15}, {x: 8, y: 15}, {x: 11, y: 15},
  {x: 11, y: 10}, {x: 11, y: 5},
  {x: 16, y: 5}, {x: 20, y: 5}, {x: 25, y: 5},
  {x: 25, y: 10}, {x: 25, y: 20},
  {x: 30, y: 20}, {x: 35, y: 20},
  {x: 35, y: 10},
];

// ─── Main simulation tick ─────────────────────────────────────
let _alerts: AlertEntry[] = [
  { time: '00:00', level: 'info', message: 'RAKSHAK rover deployed — mission started' },
  { time: '00:01', level: 'info', message: 'LoRa mesh initialized — 3 nodes active' },
  { time: '00:02', level: 'success', message: 'SLAM localization locked — drift 0.1%' },
];
let _haltCount = 0;
let _fsmState: FSMState['state'] = 'NORMAL';
let _belowResumeAt: number | null = null;
let _packetLog: CommState['packet_log'] = [];
let _grid = initGrid(GRID_W, GRID_H);
let _lastTickT = 0;
let _motionT = 0;

// Mark walls
for (const key of WALLS) {
  const [x, y] = key.split(',').map(Number);
  if (y >= 0 && y < GRID_H && x >= 0 && x < GRID_W) _grid[y][x] = 2;
}

function addAlert(time: string, level: AlertEntry['level'], message: string) {
  _alerts = [{ time, level, message }, ..._alerts].slice(0, 30);
}

function addPacket(type: string, size: number, latency: number, time: string) {
  _packetLog = [{ time, type, size, latency }, ..._packetLog].slice(0, 12);
}

function formatTime(t: number): string {
  const m = Math.floor(t / 60).toString().padStart(2, '0');
  const s = Math.floor(t % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function resetSimulation(): void {
  _alerts = [
    { time: '00:00', level: 'info', message: 'RAKSHAK rover deployed — mission started' },
    { time: '00:01', level: 'info', message: 'LoRa mesh initialized — 3 nodes active' },
    { time: '00:02', level: 'success', message: 'SLAM localization locked — drift 0.1%' },
  ];
  _haltCount = 0;
  _fsmState = 'NORMAL';
  _belowResumeAt = null;
  _packetLog = [];
  _grid = initGrid(GRID_W, GRID_H);
  for (const key of WALLS) {
    const [x, y] = key.split(',').map(Number);
    if (y >= 0 && y < GRID_H && x >= 0 && x < GRID_W) _grid[y][x] = 2;
  }
  _lastTickT = 0;
  _motionT = 0;
}

export function tick(t: number): SimState {
  const timeStr = formatTime(t);

  // ── Gas progression ──────────────────────────────────────
  // Phases: 0-15s normal, 15-45s heating, 45-80s serious, 80-110s critical, 110+ clearing
  let progress = 0;
  let phase = 'Normal atmosphere';

  if (t < 15) {
    progress = 0;
    phase = 'Normal atmosphere';
  } else if (t < 45) {
    progress = ((t - 15) / 30) * 0.3;
    phase = 'Early heating detected';
  } else if (t < 80) {
    progress = 0.3 + ((t - 45) / 35) * 0.5;
    phase = 'Serious heating — fire developing';
  } else if (t < 110) {
    progress = 0.8 + ((t - 80) / 30) * 0.2;
    phase = 'Critical — active fire signatures';
  } else {
    // Gradual clearing
    progress = Math.max(0, 1.0 - ((t - 110) / 60) * 0.8);
    phase = 'Ventilation improving';
  }

  const p = Math.min(1, progress);

  const ch4_true = 0.02 + p * 0.4;
  const co_true  = 0.001 + p * 0.09;
  const o2_true  = 20.9 - p * 3.5;
  const co2_true = 0.04 + p * 0.6;
  const n2_true  = 79.0 + p * 0.4;

  // Sensor fault at t=25-30 (MQ drift)
  const fault_active = t > 25 && t < 32;
  const ch4_mq   = noise(fault_active ? 1.4 : ch4_true, 0.005);
  const ch4_ndir = noise(ch4_true, 0.002);
  const co       = noise(co_true,  0.0003);
  const o2       = noise(o2_true,  0.05);
  const co2      = co2_true;
  const n2       = n2_true;

  const [gr, gs]     = grahamRatio(co, o2, n2);
  const willett_r    = co / Math.max(1e-6, (Math.max(0, n2 - 79) + co2 + ch4_ndir));
  const willett_c    = willett_r > 0.4;
  const c_eff        = ch4_ndir + co;
  const i_eff        = co2 + Math.max(0, n2 - 79);
  const cs           = cowardState(ch4_ndir, co, o2);
  const hazard       = overallHazard(gs, cs, willett_c, o2, ch4_ndir, co);

  const gas: GasState = {
    ch4_mq: clamp(ch4_mq, 0, 100),
    ch4_ndir: clamp(ch4_ndir, 0, 100),
    co: clamp(co, 0, 10),
    o2: clamp(o2, 0, 25),
    co2, n2,
    graham_ratio: gr,
    graham_state: gs,
    willett_ratio: willett_r,
    willett_confirms: willett_c,
    coward_c_eff: c_eff,
    coward_i_eff: i_eff,
    coward_state: cs,
    sensor_fault: fault_active,
    overall_hazard: hazard,
  };

  // ── FSM ───────────────────────────────────────────────────
  let fsmMsg = '';
  const prevFSM = _fsmState;

  if (_fsmState === 'NORMAL') {
    if (gr >= 1.0 && !fault_active) {
      _fsmState = 'CAUTION';
      fsmMsg = `GR=${gr.toFixed(2)} ≥ 1.0 → CAUTION`;
      addAlert(timeStr, 'warning', `Safety FSM → CAUTION (GR=${gr.toFixed(2)})`);
    } else {
      fsmMsg = `GR=${gr.toFixed(2)} — Normal operation`;
    }
  } else if (_fsmState === 'CAUTION') {
    if (gr >= 2.0 && !fault_active) {
      _fsmState = 'HALT';
      _haltCount++;
      _belowResumeAt = null;
      fsmMsg = `GR=${gr.toFixed(2)} ≥ 2.0 → MOTOR HALTED`;
      addAlert(timeStr, 'critical', `MOTOR HALT #${_haltCount} — GR=${gr.toFixed(2)} — evacuate Zone C`);
    } else if (gr < 1.0) {
      _fsmState = 'NORMAL';
      fsmMsg = `GR cleared → NORMAL`;
    } else {
      fsmMsg = `GR=${gr.toFixed(2)} — Caution maintained`;
    }
  } else if (_fsmState === 'HALT') {
    if (gr < 1.0) {
      if (_belowResumeAt === null) _belowResumeAt = t;
      const elapsed = t - _belowResumeAt;
      if (elapsed >= 30) {
        _fsmState = 'RESUME';
        fsmMsg = 'GR clear 30s → RESUME';
        addAlert(timeStr, 'success', 'Conditions cleared — resuming mission');
      } else {
        fsmMsg = `GR clear — resume in ${(30 - elapsed).toFixed(0)}s`;
      }
    } else {
      _belowResumeAt = null;
      fsmMsg = `GR=${gr.toFixed(2)} elevated — HALT maintained`;
    }
  } else if (_fsmState === 'RESUME') {
    _fsmState = 'NORMAL';
    _belowResumeAt = null;
    fsmMsg = 'Resume signal sent → NORMAL';
  }

  const fsm: FSMState = {
    state: _fsmState,
    motor_halt: _fsmState === 'HALT',
    halt_count: _haltCount,
    message: fsmMsg,
  };

  // ── Alerts for specific events ────────────────────────────
  if (Math.abs(t - 25) < 1) addAlert(timeStr, 'warning', 'MQ-4 sensor drift detected — switching to NDIR');
  if (Math.abs(t - 60) < 1) addAlert(timeStr, 'critical', 'Thermal hotspot detected — Zone C coordinates (25, 10)');
  if (Math.abs(t - 75) < 1) addAlert(timeStr, 'critical', 'SURVIVOR DETECTED — Zone D — breathing 14 bpm');
  if (Math.abs(t - 90) < 1) addAlert(timeStr, 'warning', 'LoRa Node 2 RSSI degraded — —88 dBm');

  // ── SLAM ─────────────────────────────────────────────────
  const dt = Math.max(0, t - _lastTickT);
  const previousFSM = prevFSM;
  if (previousFSM !== 'HALT') {
    _motionT += dt;
  }
  _lastTickT = t;

  const routeTime = _motionT / 9;
  const path_idx = Math.min(
    Math.floor(routeTime),
    ROVER_PATH.length - 1
  );
  const segmentT = Math.min(1, Math.max(0, routeTime - path_idx));
  const rover_pos = ROVER_PATH[path_idx];
  const next_pos  = ROVER_PATH[Math.min(path_idx + 1, ROVER_PATH.length - 1)];
  const interpX = path_idx < ROVER_PATH.length - 1
    ? rover_pos.x + (next_pos.x - rover_pos.x) * segmentT
    : rover_pos.x;
  const interpY = path_idx < ROVER_PATH.length - 1
    ? rover_pos.y + (next_pos.y - rover_pos.y) * segmentT
    : rover_pos.y;
  const heading = Math.atan2(
    next_pos.y - rover_pos.y,
    next_pos.x - rover_pos.x
  ) * 180 / Math.PI;

  // Reveal cells around rover path up to current position
  const newGrid = _grid.map(r => [...r]);
  for (let i = 0; i <= path_idx; i++) {
    const p = ROVER_PATH[i];
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const nx = p.x + dx, ny = p.y + dy;
        if (nx > 0 && nx < GRID_W-1 && ny > 0 && ny < GRID_H-1 && !WALLS.has(`${nx},${ny}`)) {
          newGrid[ny][nx] = 1; // free
        }
      }
    }
  }

  // Hazard zones when heating
  if (t > 45) {
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const nx = 25 + dx, ny = 10 + dy;
        if (nx > 0 && nx < GRID_W && ny > 0 && ny < GRID_H && newGrid[ny][nx] === 1)
          newGrid[ny][nx] = 3; // hazard
      }
  }

  // Survivor location
  if (t > 70) {
    newGrid[20][35] = 4;
  }

  _grid = newGrid;

  const nodes_deployed = Math.min(Math.floor(t / 25), 4);

  const slam: SLAMState = {
    grid: _grid,
    rover: {
      x: interpX, y: interpY,
      heading,
      distance_traveled: Math.max(0, _motionT * 1.33) + noise(0, 0.08),
      speed: _fsmState === 'HALT' ? 0 : noise(0.8, 0.1),
    },
    path: ROVER_PATH.slice(0, path_idx + 1),
    nodes_deployed,
    drift_percent: noise(0.3, 0.05),
    scsr_remaining: Math.max(0, 60 - t / 60),
  };

  // ── Communication ─────────────────────────────────────────
  const depth_factor = path_idx / (ROVER_PATH.length - 1);
  const base_rssi = -60 - depth_factor * 35;

  const comm_nodes = Array.from({length: 4}, (_, i) => ({
    id: i + 1,
    active: i < nodes_deployed + 1,
    rssi: noise(base_rssi + i * 8, 3),
    distance: (i + 1) * 80,
  }));

  // Signal degrades at t=90
  if (t > 90) comm_nodes[1].rssi = noise(-88, 2);

  const bw = t > 90 ? noise(1.4, 0.1) : noise(1.76, 0.05);
  const mode = bw < 1.5 ? 'ALERT_ONLY' : (p > 0.5 ? 'THERMAL_SNAPSHOT' : 'VIDEO');

  // Add packets every few seconds
  if (Math.floor(t) % 3 === 0) {
    const types = ['GAS_STATE', 'THERMAL_FRAME', 'SLAM_POSE', 'ALERT', 'HEARTBEAT'];
    const sizes = [48, 768, 32, 24, 8];
    const ti = Math.floor(t / 3) % types.length;
    addPacket(types[ti], sizes[ti], noise(1840, 120), timeStr);
  }

  const comm: CommState = {
    nodes: comm_nodes,
    bandwidth_kbps: clamp(bw, 0.5, 2.0),
    mode,
    latency_ms: noise(1840, 150),
    packet_log: _packetLog,
    last_thermal_s: t % 4,
  };

  // ── Detection ─────────────────────────────────────────────
  const person_t = t > 70;
  const th_conf  = person_t ? noise(0.87, 0.04) : noise(0.12, 0.05);
  const nv_conf  = person_t ? noise(0.81, 0.05) : noise(0.09, 0.04);
  const co2_spk  = person_t ? noise(0.74, 0.06) : noise(0.08, 0.03);
  const two_of_3 = person_t && [th_conf, nv_conf, co2_spk].filter(v => v > 0.6).length >= 2;

  const hotspots = t > 45 ? [
    { x: 25, y: 10, intensity: noise(0.8, 0.05) },
    { x: 26, y: 11, intensity: noise(0.5, 0.08) },
  ] : [];

  const detection: DetectionState = {
    person_detected: person_t && two_of_3,
    thermal_confidence: clamp(th_conf, 0, 1),
    nv_confidence: clamp(nv_conf, 0, 1),
    co2_spike: clamp(co2_spk, 0, 1),
    two_of_three: two_of_3,
    breathing_rate: person_t ? noise(14, 1) : null,
    hotspots,
  };

  return {
    t,
    gas,
    fsm,
    slam,
    comm,
    detection,
    alerts: _alerts,
    mission_phase: phase,
  };
}

export const GRID_WIDTH  = GRID_W;
export const GRID_HEIGHT = GRID_H;