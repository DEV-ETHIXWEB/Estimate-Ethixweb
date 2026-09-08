import { SiGoogleads, SiMeta } from 'react-icons/si';
import { BRAND } from '../lib/theme.js';

function fmtMoney(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
function fmtNum(n, d) { d = d || 0; return Number(n.toFixed(d)).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
// Revenue can run into the tens/hundreds of thousands, so it reads better
// compact ($38.1k) - everything else on the card (budget, cost/job) stays in
// full dollar form since those numbers are small enough to just read directly.
function fmtCompactMoney(n) {
  if (n >= 1000) {
    const k = Math.round((n / 1000) * 10) / 10;
    return '$' + (Number.isInteger(k) ? k : k.toFixed(1)) + 'k';
  }
  return fmtMoney(n);
}

// Only the numbers someone would actually act on - internal routing details
// (LSA-vs-Search mix, which lead-capture format Meta uses) moved to
// Methodology, reachable but not front-and-center on first read.
function ChannelCard({ icon, name, brandColor, budget, pct, leads, costPerJob, revenue, roas }) {
  return (
    <div className="card channel-card">
      <div className="channel-card-head">
        <span className="channel-icon" style={{ color: brandColor }}>{icon}</span>
        <span className="channel-name">{name}</span>
        <span className="channel-pct">{pct}%</span>
      </div>
      <div className="channel-budget">{fmtMoney(budget)} / month</div>
      <div className="channel-stats">
        <div><span className="cs-label">Leads</span><span className="cs-value">{fmtNum(leads, 1)}</span></div>
        <div><span className="cs-label">Cost / booked job</span><span className="cs-value">{fmtMoney(costPerJob)}</span></div>
        <div><span className="cs-label">Revenue</span><span className="cs-value">{fmtCompactMoney(revenue)}</span></div>
        <div><span className="cs-label">ROAS</span><span className="cs-value">{roas.toFixed(1)}&times;</span></div>
      </div>
    </div>
  );
}

export default function ChannelCards({ google, meta, googlePct }) {
  return (
    <div className="channel-grid">
      <ChannelCard
        icon={<SiGoogleads size={16} />} name="Google Ads" brandColor={BRAND.google}
        budget={google.budget} pct={googlePct}
        leads={google.leads.mid} costPerJob={google.costPerJob.mid} revenue={google.revenue.mid} roas={google.roas.mid}
      />
      <ChannelCard
        icon={<SiMeta size={16} />} name="Meta Ads" brandColor={BRAND.meta}
        budget={meta.budget} pct={100 - googlePct}
        leads={meta.leads.mid} costPerJob={meta.costPerJob.mid} revenue={meta.revenue.mid} roas={meta.roas.mid}
      />
    </div>
  );
}
