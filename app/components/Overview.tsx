'use client';
import { SimState } from '../lib/simulation';


const hazardColor = (h: string) => {
  if (h === 'CRITICAL') return '#EF4444';
  if (h === 'DANGER')   return '#F59E0B';
  if (h === 'CAUTION')  return '#06B6D4';
  return '#10B981';
};

const fsmColor = (s: string) => {
  if (s === 'HALT')    return '#EF4444';
  if (s === 'CAUTION') return '#F59E0B';
  if (s === 'RESUME')  return '#10B981';
  return '#06B6D4';
};

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="card" style={{ borderColor: color + '40', flex: 1 }}>
      <div className="card-title">{label}</div>
      <div className="mono" style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function MiniGauge({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(1, value / max);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
        <span className="mono" style={{ fontSize: 11, color }}>{value.toFixed(3)}%</span>
      </div>
      <div style={{ height: 4, background: 'var(--coal-5)', borderRadius: 2 }}>
        <div style={{ width: `${pct * 100}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

export default function Overview({ state }: { state: SimState }) {
  const { gas, fsm, detection, slam, comm, t } = state;

  const mins = Math.floor(t / 60).toString().padStart(2, '0');
  const secs = Math.floor(t % 60).toString().padStart(2, '0');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            Mission Status
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{state.mission_phase}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Mission Time</div>
          <div className="mono" style={{ fontSize: 32, fontWeight: 700, color: 'var(--cyan)' }}>{mins}:{secs}</div>
        </div>
      </div>

      {/* Big 3 stat cards */}
      <div style={{ display: 'flex', gap: 12 }}>
        <StatCard
          label="Hazard Level"
          value={gas.overall_hazard}
          color={hazardColor(gas.overall_hazard)}
          sub={`Graham's Ratio: ${gas.graham_ratio.toFixed(3)}`}
        />
        <StatCard
          label="Safety FSM"
          value={fsm.state}
          color={fsmColor(fsm.state)}
          sub={fsm.motor_halt ? '⛔ Motor halted' : '✓ Motor running'}
        />
        <StatCard
          label="Survivors"
          value={detection.person_detected ? '1 DETECTED' : 'SCANNING'}
          color={detection.person_detected ? '#EF4444' : '#06B6D4'}
          sub={detection.person_detected ? `${detection.breathing_rate?.toFixed(0)} bpm — Alive` : 'No detection'}
        />
      </div>

      {/* Two column lower */}
      <div style={{ display: 'flex', gap: 12, flex: 1 }}>
        {/* Gas mini */}
        <div className="card" style={{ flex: 1 }}>
          <div className="card-title">Gas Readings</div>
          <MiniGauge label="CH₄ (Methane)"     value={gas.ch4_ndir} max={2}    color="#F59E0B" />
          <MiniGauge label="CO (Carbon Monoxide)" value={gas.co * 100} max={5}  color="#EF4444" />
          <MiniGauge label="O₂ (Oxygen)"        value={20.9 - gas.o2} max={5}  color="#06B6D4" />
          <MiniGauge label="CO₂"                value={gas.co2}      max={2}   color="#8B5CF6" />
          <div style={{ marginTop: 12, padding: '8px 10px', background: 'var(--coal-3)', borderRadius: 6 }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Graham's Classification</div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: hazardColor(gas.overall_hazard) }}>
              {gas.graham_state.replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        {/* SLAM mini */}
        <div className="card" style={{ flex: 1 }}>
          <div className="card-title">Navigation</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['Position', `(${slam.rover.x}, ${slam.rover.y})`],
              ['Heading', `${slam.rover.heading.toFixed(0)}°`],
              ['Distance', `${slam.rover.distance_traveled.toFixed(0)}m`],
              ['Speed', `${slam.rover.speed.toFixed(2)} m/s`],
              ['SLAM Drift', `${slam.drift_percent.toFixed(2)}%`],
              ['Nodes Out', `${slam.nodes_deployed}/4`],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: '8px 10px', background: 'var(--coal-3)', borderRadius: 6 }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{k}</div>
                <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--cyan)' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>SCSR Time Remaining</div>
            <div style={{ height: 6, background: 'var(--coal-5)', borderRadius: 3 }}>
              <div style={{
                width: `${(slam.scsr_remaining / 60) * 100}%`,
                height: '100%', borderRadius: 3,
                background: slam.scsr_remaining > 30 ? '#10B981' : slam.scsr_remaining > 15 ? '#F59E0B' : '#EF4444',
                transition: 'width 0.6s ease'
              }} />
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              {slam.scsr_remaining.toFixed(1)} min remaining
            </div>
          </div>
        </div>

        {/* Comms mini */}
        <div className="card" style={{ flex: 1 }}>
          <div className="card-title">Communication</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {comm.nodes.map(n => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: n.active ? '#10B981' : '#EF4444',
                  boxShadow: n.active ? '0 0 6px #10B981' : 'none'
                }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>Node {n.id}</span>
                <span className="mono" style={{ fontSize: 11, color: n.active ? 'var(--text-primary)' : 'var(--text-dim)' }}>
                  {n.active ? `${n.rssi.toFixed(0)} dBm` : 'OFFLINE'}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: '8px 10px', background: 'var(--coal-3)', borderRadius: 6 }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Bandwidth</div>
            <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--cyan)' }}>
              {comm.bandwidth_kbps.toFixed(2)} kbps
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>Mode: {comm.mode.replace(/_/g, ' ')}</div>
          </div>
        </div>
      </div>

      {/* Recent alerts */}
      <div className="card">
        <div className="card-title">Recent Alerts</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {state.alerts.slice(0, 4).map((a, i) => (
            <div key={i} className={`alert-entry ${a.level}`}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', marginRight: 8 }}>{a.time}</span>
              <span style={{ fontSize: 12 }}>{a.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}