import { useRef } from 'react';
import * as C from '../lib/config.js';
import { conversionLocationLabel } from '../lib/uiLabels.js';
import { hapticTick } from '../lib/haptics.js';
import SlidersIcon from './icons/SlidersIcon.jsx';

const CATEGORY_LABELS = { hvac: 'HVAC', plumbing: 'Plumbing', other: 'Other' };
const LOCATION_ORDER = ['seattle_wa','utah_wasatch','colorado_springs','oregon_portland','fallback_major_metro','fallback_mid_size','fallback_small_rural'];
export const PRESETS = [500, 1000, 2000, 3000, 5000, 10000];

// ---------------------------------------------------------------------------
// Budget slider - log-scaled over a fixed $200-$20k window. Log rather than
// linear because a linear slider over a 100x range gives almost no
// resolution down at the $200-$3,000 end where most services actually live -
// a few pixels of drag would jump hundreds of dollars. Log spacing gives
// every doubling of spend the same amount of slider travel, so small
// budgets stay easy to fine-tune.
// ---------------------------------------------------------------------------
const BUDGET_SLIDER_MIN = 200;
const BUDGET_SLIDER_MAX = 20000;
const SLIDER_STEPS = 1000;
const LOG_MIN = Math.log(BUDGET_SLIDER_MIN);
const LOG_MAX = Math.log(BUDGET_SLIDER_MAX);

function budgetToSliderPos(budget) {
  const b = Math.min(Math.max(budget || 0, BUDGET_SLIDER_MIN), BUDGET_SLIDER_MAX);
  return Math.round(((Math.log(b) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * SLIDER_STEPS);
}
function sliderPosToBudget(pos) {
  const t = pos / SLIDER_STEPS;
  const raw = Math.exp(LOG_MIN + t * (LOG_MAX - LOG_MIN));
  return Math.max(BUDGET_SLIDER_MIN, Math.round(raw / 50) * 50); // snap to clean $50 increments
}

const ALLOCATION_MODES = [
  { key: 'recommended', label: 'Recommended' },
  { key: 'google', label: 'Google only' },
  { key: 'meta', label: 'Meta only' },
  { key: 'custom', label: 'Custom' },
];

export function servicesForCategory(cat) {
  if (cat === 'other') return C.OTHER_ARCHETYPES;
  const out = {};
  Object.keys(C.SERVICES).forEach(k => { if (C.SERVICES[k].category === cat) out[k] = C.SERVICES[k]; });
  return out;
}

export default function Controls({ state, setState, recommendedGoogleSplit }) {
  const svcs = servicesForCategory(state.category);
  const recommendedPct = Math.round(recommendedGoogleSplit * 100);
  const customPct = state.customGooglePct ?? recommendedPct;

  // One tick per value that actually changes (a new $50 budget increment, a
  // new 1% allocation point) - not one per pixel of drag - so it feels like
  // distinct detents, matching a native slider/picker. Real vibration only
  // fires on Android; see haptics.js for why iOS has no equivalent.
  const prevBudgetRef = useRef(state.budget);
  const prevCustomPctRef = useRef(customPct);

  function setCategory(cat) {
    const newSvcs = servicesForCategory(cat);
    setState(s => ({ ...s, category: cat, serviceKey: Object.keys(newSvcs)[0] }));
  }

  function setAllocationMode(mode) {
    setState(s => ({
      ...s, allocationMode: mode,
      // Seed the custom % from the current recommendation only the first
      // time Custom is opened this session - after that, leave whatever the
      // person set alone, even if they switch away and back.
      customGooglePct: mode === 'custom' && s.customGooglePct == null ? recommendedPct : s.customGooglePct,
    }));
  }

  return (
    <section className="card controls-card">
      <div className="controls-head"><SlidersIcon size={15} /> Configure your forecast</div>
      <div className="controls">
        <div className="control-group">
          <label>Business</label>
          <div className="pill-row">
            {Object.keys(CATEGORY_LABELS).map(cat => (
              <button key={cat} className={'pill' + (state.category === cat ? ' active' : '')} onClick={() => setCategory(cat)}>
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label>{state.category === 'other' ? 'Intent archetype' : 'Service'}</label>
          <select value={state.serviceKey} onChange={e => setState(s => ({ ...s, serviceKey: e.target.value }))}>
            {Object.keys(svcs).map(k => <option key={k} value={k}>{svcs[k].label}</option>)}
          </select>
        </div>

        <div className="control-group">
          <label>Market</label>
          <select value={state.locationKey} onChange={e => setState(s => ({ ...s, locationKey: e.target.value }))}>
            <optgroup label="Evidence-backed markets">
              {LOCATION_ORDER.filter(k => C.LOCATIONS[k].hasEvidence).map(k => <option key={k} value={k}>{C.LOCATIONS[k].label}</option>)}
            </optgroup>
            <optgroup label="Fallback tiers">
              {LOCATION_ORDER.filter(k => !C.LOCATIONS[k].hasEvidence).map(k => <option key={k} value={k}>{C.LOCATIONS[k].label}</option>)}
            </optgroup>
          </select>
        </div>

        <div className="control-group">
          <label>Meta setup</label>
          <div className="pill-row">
            {Object.keys(C.CONVERSION_LOCATIONS).map(key => (
              <button key={key} className={'pill' + (state.conv === key ? ' active' : '')} onClick={() => setState(s => ({ ...s, conv: key }))}>
                {conversionLocationLabel(key)}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group allocation-group">
          <label>Budget allocation</label>
          <div className="pill-row">
            {ALLOCATION_MODES.map(({ key, label }) => (
              <button key={key} className={'pill' + (state.allocationMode === key ? ' active' : '')} onClick={() => setAllocationMode(key)}>
                {label}{key === 'recommended' ? ` (${recommendedPct}%)` : ''}
              </button>
            ))}
          </div>
          {state.allocationMode === 'custom' && (
            <div className="allocation-custom">
              <div className="allocation-custom-readout">
                <span className="allocation-custom-google">Google {customPct}%</span>
                <span className="allocation-custom-dot">·</span>
                <span className="allocation-custom-meta">Meta {100 - customPct}%</span>
              </div>
              <input
                type="range" className="allocation-slider" aria-label="Google budget share"
                min={0} max={100} step={1} value={customPct}
                style={{ '--fill-pct': `${customPct}%` }}
                onChange={e => {
                  const next = Number(e.target.value);
                  if (next !== prevCustomPctRef.current) { hapticTick(); prevCustomPctRef.current = next; }
                  setState(s => ({ ...s, customGooglePct: next }));
                }}
              />
            </div>
          )}
        </div>

        <div className="control-group budget-group">
          <div className="budget-head">
            <label>Monthly budget</label>
            <div className="budget-input">
              <span>$</span>
              <input type="number" min={200} step={50} value={state.budget} inputMode="numeric"
                onChange={e => {
                  const parsed = Number(e.target.value);
                  // Reject negatives/NaN so every downstream calculation always
                  // receives a valid budget - a stray "-" or empty field
                  // shouldn't be able to feed the engine a nonsensical spend.
                  const clamped = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
                  setState(s => ({ ...s, budget: clamped }));
                }} />
            </div>
          </div>
          <input
            type="range" className="budget-slider" aria-label="Monthly budget"
            min={0} max={SLIDER_STEPS} step={1}
            value={budgetToSliderPos(state.budget)}
            style={{ '--fill-pct': `${(budgetToSliderPos(state.budget) / SLIDER_STEPS) * 100}%` }}
            onChange={e => {
              const next = sliderPosToBudget(Number(e.target.value));
              if (next !== prevBudgetRef.current) { hapticTick(); prevBudgetRef.current = next; }
              setState(s => ({ ...s, budget: next }));
            }}
          />
          <div className="chip-row">
            {PRESETS.map(p => (
              <button key={p} className={'chip' + (state.budget === p ? ' active' : '')} onClick={() => setState(s => ({ ...s, budget: p }))}>
                ${p >= 1000 ? (p/1000) + 'k' : p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
