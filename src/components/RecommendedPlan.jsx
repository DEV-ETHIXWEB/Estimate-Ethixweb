import { SiGoogleads, SiMeta } from 'react-icons/si';
import { BRAND } from '../lib/theme.js';

function fmtCompactMoney(n) {
  if (n >= 1000) {
    const k = Math.round((n / 1000) * 10) / 10;
    return '$' + (Number.isInteger(k) ? k : k.toFixed(1)) + 'k';
  }
  return '$' + Math.round(n);
}

// ---------------------------------------------------------------------------
// The main result, up top - replaces the old revenue-vs-budget chart. A split
// this simple (two categories, one number each) doesn't need a chart to be
// legible; a bar/meter plus the numbers people actually came for (ROAS,
// revenue) says the same thing faster. Title and split/ROAS/revenue always
// reflect whatever allocation is currently active (recommended by default,
// or the user's override) - the "why" sentence stays about the underlying
// recommendation regardless, since that's a property of the service, not of
// whatever the person is currently trying.
// ---------------------------------------------------------------------------
export default function RecommendedPlan({ isOverridden, googlePct, roas, revenue, reason }) {
  const metaPct = 100 - googlePct;

  return (
    <section className="card plan-card">
      <div className="card-label">{isOverridden ? 'Your plan' : 'Recommended plan'}</div>

      <div className="plan-split">
        <span className="plan-split-google"><SiGoogleads size={15} color={BRAND.google} /> {googlePct}% Google</span>
        <span className="plan-split-dot">·</span>
        <span className="plan-split-meta"><SiMeta size={15} color={BRAND.meta} /> {metaPct}% Meta</span>
      </div>

      <div className="split-bar">
        <div className="split-bar-seg split-bar-google" style={{ width: `max(0px, calc(${googlePct}% - 1px))` }} />
        <div className="split-bar-seg split-bar-meta" style={{ width: `max(0px, calc(${metaPct}% - 1px))` }} />
      </div>

      {reason && <p className="plan-reason">{reason}</p>}

      <div className="plan-stats">
        <div className="plan-stat">
          <span className="plan-stat-label">Expected ROAS</span>
          <span className="plan-stat-value">{roas.low.toFixed(1)}×–{roas.high.toFixed(1)}×</span>
        </div>
        <div className="plan-stat">
          <span className="plan-stat-label">Expected revenue</span>
          <span className="plan-stat-value">{fmtCompactMoney(revenue.low)}–{fmtCompactMoney(revenue.high)}</span>
        </div>
      </div>
    </section>
  );
}
