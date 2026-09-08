import { useState } from 'react';
import DoubleCheckIcon from './icons/DoubleCheckIcon.jsx';
import { conversionLocationLabel } from '../lib/uiLabels.js';

function tagStyle(tag) {
  if (/BENCHMARK/.test(tag)) return { label: 'Benchmark', cls: 'tag-solid' };
  if (/ESTIMATE/.test(tag)) return { label: 'Estimate', cls: 'tag-outline' };
  if (/WEAK/.test(tag)) return { label: 'Weak evidence', cls: 'tag-weak' };
  return { label: 'Derived', cls: 'tag-dashed' };
}

function Tag({ tag }) {
  const t = tagStyle(tag);
  return <span className={'tag ' + t.cls}>{t.label}</span>;
}

// Collapsed by default: this is the technical layer (CPL/close-rate sourcing,
// stage-split derivation, confidence tags) - useful, but the main experience
// above it is designed to stand on its own without it.
export default function Methodology({ result, loc, dealValueInfo, splitGoogleRange }) {
  const [open, setOpen] = useState(false);
  const m = result.meta.funnel;
  const compoundedPct = m.leads.mid > 0 ? (m.bookedJobs.mid / m.leads.mid * 100) : 0;
  const mixPct = Math.round(result.google.mix.lsa * 100);

  return (
    <div className="card methodology-card">
      <button className="methodology-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <DoubleCheckIcon size={14} />
        How this forecast works
        <span className={'methodology-chevron' + (open ? ' open' : '')} aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="methodology-body">
          <div className="method-row">
            <span className="method-label">Average revenue per job</span>
            <span>{'$' + Math.round(dealValueInfo.low).toLocaleString()} &ndash; {'$' + Math.round(dealValueInfo.high).toLocaleString()}</span>
            <Tag tag={dealValueInfo.tag} />
          </div>
          <div className="method-row">
            <span className="method-label">Modeled Google / Meta split</span>
            <span>{Math.round(splitGoogleRange[0]*100)}&ndash;{Math.round(splitGoogleRange[1]*100)}% Google</span>
            <Tag tag="DERIVED_LOGIC" />
          </div>
          <div className="method-row">
            <span className="method-label">Google routing</span>
            <span>{mixPct === 0 ? 'All Google budget routes through Search' : `${mixPct}% Local Services Ads, ${100 - mixPct}% Search`}</span>
            <Tag tag="DERIVED_LOGIC" />
          </div>
          <div className="method-row">
            <span className="method-label">Meta setup</span>
            <span>{conversionLocationLabel(result.meta.conversionLocation)}</span>
          </div>
          <div className="method-row">
            <span className="method-label">Location cost adjustment</span>
            <span>{loc.costMultiplier ? `×${loc.costMultiplier[0].toFixed(2)}–${loc.costMultiplier[1].toFixed(2)}` : 'No adjustment (insufficient evidence)'}</span>
            {loc.costMultiplier && <Tag tag={loc.costMultiplierTag || 'ESTIMATE_PROVISIONAL'} />}
          </div>
          <div className="method-row">
            <span className="method-label">Meta lead→booked-job rate (sourced endpoint)</span>
            <span>{(m.combinedCloseRateTarget[0]*100).toFixed(1)}&ndash;{(m.combinedCloseRateTarget[1]*100).toFixed(1)}%</span>
            <Tag tag={m.combinedCloseRateTag} />
          </div>
          <p className="method-note">
            The lead-to-job funnel above is blended across both channels; this row is Meta's own sourced endpoint specifically - its Qualified/Appointments split is our own derived breakdown (compounding to {compoundedPct.toFixed(1)}% end to end, matched by construction) - treat the exact stage boundaries as illustrative, not independently measured. {loc.hasEvidence ? loc.note : 'This market has no local ad-cost evidence - figures use national benchmarks with a generic fallback-tier adjustment.'}
          </p>
          <p className="method-footer">Built on the locked v1 data specification and validated calculation engine (26,000+ automated checks, 0 failures). Figures are directional planning estimates synthesized from third-party industry research - no platform publishes official benchmarks for this exact industry.</p>
        </div>
      )}
    </div>
  );
}
