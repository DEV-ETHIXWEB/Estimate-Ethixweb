import LayersIcon from './icons/LayersIcon.jsx';

function fmtNum(n, d) { d = d || 0; return Number(n.toFixed(d)).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }

// ---------------------------------------------------------------------------
// A single compact chain rather than four large bars/lines: at a glance,
// "how many leads turn into a booked job" is one sentence, not a chart - the
// four-bar version buried that behind more visual weight than the number
// warranted. The full stage-by-stage split derivation (and its sourcing
// caveats) still lives in Methodology, for anyone who wants it.
// ---------------------------------------------------------------------------
const STAGES = [
  { key: 'leads', label: 'Leads' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'booked', label: 'Booked jobs' }
];

export default function FunnelChart({ leads, qualified, appointments, booked }) {
  const values = { leads, qualified, appointments, booked };
  const bookedPct = leads > 0 ? (booked / leads) * 100 : 0;

  return (
    <div className="card funnel-card">
      <div className="card-label"><LayersIcon size={14} /> Lead-to-job funnel</div>
      <div className="funnel-chain">
        {STAGES.map((stage, i) => (
          <span className="funnel-chain-item" key={stage.key}>
            {i > 0 && <span className="funnel-chain-arrow" aria-hidden="true">→</span>}
            <span className="funnel-chain-value">{fmtNum(values[stage.key], stage.key === 'booked' ? 1 : 0)}</span>
            <span className="funnel-chain-label">{stage.label}</span>
          </span>
        ))}
      </div>
      <div className="funnel-rate">{fmtNum(bookedPct, 1)}% lead-to-booked rate</div>
    </div>
  );
}
