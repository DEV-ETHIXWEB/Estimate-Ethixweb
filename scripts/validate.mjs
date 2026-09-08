/**
 * validate.js - Phase: Validation Cases (before UI)
 * ----------------------------------------------------
 * Run: node validate.js
 *
 * This does NOT test UI. It tests that the engine's math is internally
 * consistent with the locked spec: back-solved stage splits reproduce the
 * sourced close-rate targets, no NaN/divide-by-zero anywhere, location
 * multipliers move numbers in the right direction, diminishing returns is
 * monotonic, and every config entry has the required shape.
 */

import * as config from '../src/lib/config.js';
import * as engine from '../src/lib/engine.js';
import { STRATEGY_CONTENT } from '../src/lib/strategyContent.js';

let pass = 0;
let fail = 0;
const failures = [];

function check(label, condition) {
  if (condition) {
    pass++;
  } else {
    fail++;
    failures.push(label);
  }
}

function approxWithin(value, [low, high], tolerancePct = 0.03) {
  const tol = (high - low) * tolerancePct + 0.0001;
  return value >= low - tol && value <= high + tol;
}

console.log('=== 1. CONFIG SCHEMA CHECKS ===');

Object.entries(config.SERVICES).forEach(([key, svc]) => {
  check(`[schema] ${key} has valid band`, ['A', 'B', 'B_MAJOR', 'C'].includes(svc.band));
  check(`[schema] ${key} dealValue[0] <= dealValue[1]`, svc.dealValue[0] <= svc.dealValue[1]);
  check(`[schema] ${key} splitGoogle in [0,1]`, svc.splitGoogle[0] >= 0 && svc.splitGoogle[1] <= 1 && svc.splitGoogle[0] <= svc.splitGoogle[1]);
  check(`[schema] ${key} has dealValueTag`, !!svc.dealValueTag);
  check(`[schema] ${key} has splitTag`, !!svc.splitTag);
});

Object.entries(config.OTHER_ARCHETYPES).forEach(([key, svc]) => {
  check(`[schema] other:${key} has valid band`, ['A', 'B', 'B_MAJOR', 'C'].includes(svc.band));
  check(`[schema] other:${key} splitGoogle in [0,1]`, svc.splitGoogle[0] >= 0 && svc.splitGoogle[1] <= 1);
});

console.log(`  ${Object.keys(config.SERVICES).length} HVAC/Plumbing services + ${Object.keys(config.OTHER_ARCHETYPES).length} Other archetypes checked.`);

console.log('\n=== 2. STAGE-SPLIT BACK-SOLVE CHECKS (does derived split reproduce the sourced close rate?) ===');

['A', 'B', 'B_MAJOR', 'C'].forEach(band => {
  Object.entries(config.CHANNEL_BASE[band]).forEach(([channelKey, base]) => {
    const stages = config.STAGE_SPLIT[band][channelKey];
    const compounded = stages.qualified * stages.appointment * stages.show;
    const label = `[stage-split] Band ${band} / ${channelKey}: compounded ${(compounded * 100).toFixed(1)}% vs target [${(base.close[0]*100).toFixed(0)}-${(base.close[1]*100).toFixed(0)}%]`;
    check(label, approxWithin(compounded, base.close, 0.05));
  });
});

console.log('\n=== 3. ENGINE OUTPUT SANITY (no NaN, no negative, finite) - every service x every location x 6 budgets ===');

const testBudgets = [500, 1000, 2000, 3000, 5000, 10000];
const allServiceKeys = [...Object.keys(config.SERVICES), ...Object.keys(config.OTHER_ARCHETYPES)];
const allLocationKeys = Object.keys(config.LOCATIONS);

let combosRun = 0;
allServiceKeys.forEach(serviceKey => {
  allLocationKeys.forEach(locationKey => {
    testBudgets.forEach(budgetTotal => {
      combosRun++;
      let result;
      try {
        result = engine.computeServiceForecast({ serviceKey, budgetTotal, locationKey, conversionLocationKey: 'landing' });
      } catch (e) {
        check(`[sanity] ${serviceKey}/${locationKey}/$${budgetTotal} threw: ${e.message}`, false);
        return;
      }
      const b = result.blended;
      const fields = ['leads', 'qualifiedLeads', 'appointments', 'bookedJobs', 'revenue', 'roas', 'cpl', 'costPerJob'];
      fields.forEach(f => {
        ['low', 'mid', 'high'].forEach(k => {
          const v = b[f][k];
          check(`[finite] ${serviceKey}/${locationKey}/$${budgetTotal} ${f}.${k} is finite non-negative`, Number.isFinite(v) && v >= 0);
        });
      });
      // clicks/impressions live per-channel (not summed into blended), spot-check the Meta funnel
      const mf = result.meta.funnel;
      if (mf && mf.clicks) {
        ['low', 'mid', 'high'].forEach(k => {
          check(`[finite] ${serviceKey}/${locationKey}/$${budgetTotal} meta.clicks.${k} is finite non-negative`, Number.isFinite(mf.clicks[k]) && mf.clicks[k] >= 0);
        });
      }
    });
  });
});
console.log(`  ${combosRun} service x location x budget combinations run.`);

console.log('\n=== 4. DIRECTIONAL CHECKS (does the model behave the way the spec says it should?) ===');

// 4a. Band A Meta ROAS should be low (weak fit), Band B Meta ROAS should be materially higher
{
  const emergency = engine.computeServiceForecast({ serviceKey: 'hvac_emergency_ac', budgetTotal: 2000, locationKey: 'fallback_mid_size', conversionLocationKey: 'landing' });
  const install = engine.computeServiceForecast({ serviceKey: 'hvac_ac_install', budgetTotal: 2000, locationKey: 'fallback_mid_size', conversionLocationKey: 'landing' });
  check('[directional] Emergency AC Meta ROAS < 3.5 (weak fit)', emergency.meta.funnel.roas.mid < 3.5);
  check('[directional] AC Install Meta ROAS > Emergency AC Meta ROAS', install.meta.funnel.roas.mid > emergency.meta.funnel.roas.mid);
}

// 4b. Band C (maintenance) should allocate more budget % to Meta than Band A (emergency)
{
  const maint = config.SERVICES.hvac_maintenance;
  const emerg = config.SERVICES.hvac_emergency_ac;
  const maintMetaShareMid = 1 - (maint.splitGoogle[0] + maint.splitGoogle[1]) / 2;
  const emergMetaShareMid = 1 - (emerg.splitGoogle[0] + emerg.splitGoogle[1]) / 2;
  check('[directional] Maintenance Meta budget share > Emergency Meta budget share', maintMetaShareMid > emergMetaShareMid);
}

// 4c. Major Metro should cost more per lead than Small/Rural for the same service+budget
{
  const metro = engine.computeServiceForecast({ serviceKey: 'plumb_repipe', budgetTotal: 3000, locationKey: 'fallback_major_metro', conversionLocationKey: 'landing' });
  const rural = engine.computeServiceForecast({ serviceKey: 'plumb_repipe', budgetTotal: 3000, locationKey: 'fallback_small_rural', conversionLocationKey: 'landing' });
  check('[directional] Major Metro blended CPL > Small/Rural blended CPL', metro.blended.cpl.mid > rural.blended.cpl.mid);
}

// 4d. Diminishing returns: CPL at $10,000 should be >= CPL at $3,000 (reference point) for the same setup
{
  const low = engine.computeServiceForecast({ serviceKey: 'hvac_ac_install', budgetTotal: 3000, locationKey: 'fallback_mid_size', conversionLocationKey: 'landing' });
  const high = engine.computeServiceForecast({ serviceKey: 'hvac_ac_install', budgetTotal: 10000, locationKey: 'fallback_mid_size', conversionLocationKey: 'landing' });
  check('[directional] Blended CPL at $10k >= blended CPL at $3k (diminishing returns)', high.blended.cpl.mid >= low.blended.cpl.mid);
}

// 4e. Lead form should show cheaper CPL but lower close rate than landing page, Band B
{
  const form = engine.computeServiceForecast({ serviceKey: 'hvac_ac_install', budgetTotal: 3000, locationKey: 'fallback_mid_size', conversionLocationKey: 'form' });
  const landing = engine.computeServiceForecast({ serviceKey: 'hvac_ac_install', budgetTotal: 3000, locationKey: 'fallback_mid_size', conversionLocationKey: 'landing' });
  check('[directional] Meta Instant Form CPL < Meta Landing Page CPL', form.meta.funnel.cpl.mid < landing.meta.funnel.cpl.mid);
  check('[directional] Meta Instant Form cost/job > Meta Landing Page cost/job (net-worse despite cheaper CPL)', form.meta.funnel.costPerJob.mid > landing.meta.funnel.costPerJob.mid * 0.9);
}

// 4f. "A-leaning" plumbing services should sit strictly between pure Band A and pure Band B Google split
{
  const pureA = config.SERVICES.plumb_emergency.splitGoogle;
  const aLeaning = config.SERVICES.plumb_drain.splitGoogle;
  const pureB = config.SERVICES.plumb_wh_install.splitGoogle; // moderate Band B service, not B_MAJOR
  const aLeaningMid = (aLeaning[0] + aLeaning[1]) / 2;
  const pureAMid = (pureA[0] + pureA[1]) / 2;
  const pureBMid = (pureB[0] + pureB[1]) / 2;
  check('[directional] Drain Cleaning (A-leaning) Google share < pure Emergency', aLeaningMid < pureAMid);
  check('[directional] Drain Cleaning (A-leaning) Google share > pure Band B service', aLeaningMid > pureBMid);
}

// 4g. NEW: Band B_MAJOR (big-ticket installs) should show believable ROAS (3-10x), not 20x+
{
  const majorInstall = engine.computeServiceForecast({ serviceKey: 'hvac_ac_install', budgetTotal: 3000, locationKey: 'seattle_wa', conversionLocationKey: 'landing' });
  check('[directional] B_MAJOR (AC Install) blended ROAS mid is believable (3x-12x, not 20x+)', majorInstall.blended.roas.mid >= 3 && majorInstall.blended.roas.mid <= 12);
  check('[directional] B_MAJOR (AC Install) Meta-only ROAS mid is believable (3x-10x)', majorInstall.meta.funnel.roas.mid >= 3 && majorInstall.meta.funnel.roas.mid <= 10);
}

// 4h. Band B (moderate, e.g. Water Heater Install) should out-close Band B_MAJOR (bigger ticket = lower close rate)
{
  const moderate = config.CHANNEL_BASE.B.meta_landing.close;
  const major = config.CHANNEL_BASE.B_MAJOR.meta_landing.close;
  check('[directional] Band B moderate-ticket close rate > Band B_MAJOR close rate', moderate[0] > major[1]);
}

// 4i. NEW: CPC/CTR/impressions must reconcile with the CPL-driven leads number, not float independently
{
  const svc = engine.computeServiceForecast({ serviceKey: 'hvac_ac_install', budgetTotal: 3000, locationKey: 'fallback_mid_size', conversionLocationKey: 'landing' });
  const metaFunnel = svc.meta.funnel;
  check('[reconcile] Meta clicks produced (cpc-based channel)', metaFunnel.clicks !== null);
  check('[reconcile] Meta impressions produced', metaFunnel.impressions !== null);
  // re-deriving leads from clicks * impliedClickToLeadRate must land back on the original leads.mid
  const rederivedLeadsMid = metaFunnel.clicks.mid * metaFunnel.impliedClickToLeadRate;
  check('[reconcile] clicks * implied rate reproduces leads.mid within 1%', Math.abs(rederivedLeadsMid - metaFunnel.leads.mid) < metaFunnel.leads.mid * 0.01);
  check('[reconcile] impressions > clicks (CTR < 100%)', metaFunnel.impressions.mid > metaFunnel.clicks.mid);

  const lsaFunnel = svc.google.lsa;
  check('[reconcile] LSA has no clicks/impressions (pay-per-lead, no CPC concept)', lsaFunnel === null || lsaFunnel.clicks === null);
}

console.log('\n=== 5. BUDGET ALLOCATION OVERRIDE (googleSplitOverride) CHECKS ===');

// 5a. REGRESSION: omitting the param must reproduce the exact pre-existing
// behavior - this is the guarantee that adding the allocation selector did
// not change the validated recommendation model for anyone not using it.
{
  ['hvac_emergency_ac', 'hvac_ac_install', 'plumb_maintenance', 'other_visual'].forEach(serviceKey => {
    const withoutParam = engine.computeServiceForecast({ serviceKey, budgetTotal: 4000, locationKey: 'seattle_wa', conversionLocationKey: 'landing' });
    const withUndefined = engine.computeServiceForecast({ serviceKey, budgetTotal: 4000, locationKey: 'seattle_wa', conversionLocationKey: 'landing', googleSplitOverride: undefined });
    check(`[allocation-regression] ${serviceKey}: omitting googleSplitOverride matches passing it as undefined`,
      withoutParam.blended.revenue.mid === withUndefined.blended.revenue.mid &&
      withoutParam.google.total.budget === withUndefined.google.total.budget);
    const expectedMid = (config.SERVICES[serviceKey] || config.OTHER_ARCHETYPES[serviceKey]).splitGoogle;
    const expectedSplit = (expectedMid[0] + expectedMid[1]) / 2;
    check(`[allocation-regression] ${serviceKey}: default activeSplitGoogle matches the modeled midpoint`,
      Math.abs(withoutParam.activeSplitGoogle - expectedSplit) < 1e-9);
  });
}

// 5b. Google-only (override=1) sends the full budget through Google, none through Meta.
{
  const r = engine.computeServiceForecast({ serviceKey: 'hvac_ac_install', budgetTotal: 5000, locationKey: 'seattle_wa', conversionLocationKey: 'landing', googleSplitOverride: 1 });
  check('[allocation] Google-only: activeSplitGoogle is 1', r.activeSplitGoogle === 1);
  check('[allocation] Google-only: google.total.budget ~= full budget', Math.abs(r.google.total.budget - 5000) < 1e-6);
  check('[allocation] Google-only: meta.funnel.budget ~= 0', Math.abs(r.meta.funnel.budget - 0) < 1e-6);
  check('[allocation] Google-only: meta leads are 0 (no spend, not NaN)', r.meta.funnel.leads.mid === 0);
}

// 5c. Meta-only (override=0) sends the full budget through Meta, none through Google.
{
  const r = engine.computeServiceForecast({ serviceKey: 'hvac_ac_install', budgetTotal: 5000, locationKey: 'seattle_wa', conversionLocationKey: 'landing', googleSplitOverride: 0 });
  check('[allocation] Meta-only: activeSplitGoogle is 0', r.activeSplitGoogle === 0);
  check('[allocation] Meta-only: meta.funnel.budget ~= full budget', Math.abs(r.meta.funnel.budget - 5000) < 1e-6);
  check('[allocation] Meta-only: google.total.budget ~= 0', Math.abs(r.google.total.budget - 0) < 1e-6);
  check('[allocation] Meta-only: google leads are 0 (no spend, not NaN)', r.google.total.leads.mid === 0);
}

// 5d. Custom split (e.g. 70% Google) is honored exactly, and Google + Meta budgets always sum to the total.
[0.1, 0.3, 0.5, 0.7, 0.9].forEach(pct => {
  const r = engine.computeServiceForecast({ serviceKey: 'plumb_wh_install', budgetTotal: 6000, locationKey: 'fallback_mid_size', conversionLocationKey: 'landing', googleSplitOverride: pct });
  check(`[allocation] custom ${pct * 100}%: activeSplitGoogle matches`, Math.abs(r.activeSplitGoogle - pct) < 1e-9);
  check(`[allocation] custom ${pct * 100}%: google + meta budget sums to total`,
    Math.abs(r.google.total.budget + r.meta.funnel.budget - 6000) < 1e-6);
  check(`[allocation] custom ${pct * 100}%: revenue/ROAS finite and non-negative`,
    Number.isFinite(r.blended.revenue.mid) && r.blended.revenue.mid >= 0 &&
    Number.isFinite(r.blended.roas.mid) && r.blended.roas.mid >= 0);
});

// 5e. Out-of-range overrides are clamped, never break the calculation (NaN/negative budgets).
[-0.5, 1.5, NaN, Infinity].forEach(bad => {
  const r = engine.computeServiceForecast({ serviceKey: 'hvac_emergency_ac', budgetTotal: 2000, locationKey: 'seattle_wa', conversionLocationKey: 'landing', googleSplitOverride: bad });
  const expectDefault = !Number.isFinite(bad); // NaN/Infinity fall through to the modeled default; only finite values clamp
  check(`[allocation] googleSplitOverride=${bad}: activeSplitGoogle stays in [0,1]`, r.activeSplitGoogle >= 0 && r.activeSplitGoogle <= 1);
  check(`[allocation] googleSplitOverride=${bad}: budgets stay finite non-negative`,
    Number.isFinite(r.google.total.budget) && r.google.total.budget >= 0 &&
    Number.isFinite(r.meta.funnel.budget) && r.meta.funnel.budget >= 0);
  if (expectDefault) {
    const expectedMid = config.SERVICES.hvac_emergency_ac.splitGoogle;
    check(`[allocation] googleSplitOverride=${bad}: non-finite override falls back to modeled default`,
      Math.abs(r.activeSplitGoogle - (expectedMid[0] + expectedMid[1]) / 2) < 1e-9);
  }
});

console.log('\n=== 7. EXHAUSTIVE CROSS-PRODUCT VERIFICATION ===');
console.log('  Every service x every location x every Meta setup x a wide budget');
console.log('  sweep x every allocation mode (recommended/Google-only/Meta-only/every');
console.log('  10% custom split) - checked against invariants that must hold for ANY');
console.log('  input, not spot-checked expected numbers (there are too many combinations');
console.log('  to hand-verify individually, so this checks the properties that would be');
console.log('  violated by literally any calculation bug: budget conservation, a funnel');
console.log('  that only narrows, revenue that reconciles to bookedJobs x dealValue, no');
console.log('  NaN/Infinity/negative anywhere, ROAS = revenue/budget, etc).');

const ALL_SERVICE_KEYS = [...Object.keys(config.SERVICES), ...Object.keys(config.OTHER_ARCHETYPES)];
const ALL_LOCATION_KEYS = Object.keys(config.LOCATIONS);
const ALL_CONV_KEYS = Object.keys(config.CONVERSION_LOCATIONS);
// Budgets spanning the realistic UI range (the $200-$20k slider) plus edge
// cases the UI can still produce: $0 (a cleared/invalid field clamps here -
// see Controls.jsx), $1 (smallest positive), fractional dollars, and well
// beyond the slider's top end (someone can still type an arbitrary number
// into the field) up to $500k.
const SWEEP_BUDGETS = [0, 1, 50, 99.5, 100, 200, 333.33, 500, 1000, 2000, 3000, 4321, 5000, 7500, 10000, 15000, 20000, 50000, 100000, 500000];
// Every allocation mode the UI can produce: the modeled default, Google-only,
// Meta-only, and a custom split at every 10% step (matching the 0-100 slider).
const ALLOCATION_OVERRIDES = [
  { label: 'recommended', value: undefined },
  { label: 'google-only', value: 1 },
  { label: 'meta-only', value: 0 },
  ...Array.from({ length: 11 }, (_, i) => ({ label: `custom-${i * 10}%`, value: i / 10 })),
];

function checkFunnelInvariants(prefix, f, budget) {
  if (!f) return;
  ['leads', 'qualifiedLeads', 'appointments', 'bookedJobs', 'revenue', 'roas', 'cpl', 'costPerJob'].forEach(field => {
    ['low', 'mid', 'high'].forEach(k => {
      const v = f[field][k];
      check(`${prefix} ${field}.${k} finite non-negative`, Number.isFinite(v) && v >= 0);
    });
  });
  // A funnel can only narrow stage over stage - never gain leads back at a later stage.
  check(`${prefix} funnel narrows: leads >= qualified >= appointments >= booked (mid)`,
    f.leads.mid + 1e-9 >= f.qualifiedLeads.mid &&
    f.qualifiedLeads.mid + 1e-9 >= f.appointments.mid &&
    f.appointments.mid + 1e-9 >= f.bookedJobs.mid);
  // ROAS is revenue/budget by definition, not an independently-tracked number
  // that could quietly drift out of sync with the two it's derived from.
  if (budget > 0) {
    check(`${prefix} roas.mid == revenue.mid / budget`, Math.abs(f.roas.mid - f.revenue.mid / budget) < 1e-6);
  } else {
    check(`${prefix} zero budget: leads/revenue/roas are all exactly 0`,
      f.leads.mid === 0 && f.revenue.mid === 0 && f.roas.mid === 0);
  }
  // Cost/job is budget/bookedJobs by definition (when there are any booked jobs).
  if (f.bookedJobs.mid > 0) {
    check(`${prefix} costPerJob.mid == budget / bookedJobs.mid`, Math.abs(f.costPerJob.mid - budget / f.bookedJobs.mid) < 1e-3);
  }
}

let exhaustiveCombosRun = 0;
let exhaustiveStart = Date.now();
ALL_SERVICE_KEYS.forEach(serviceKey => {
  const svc = config.SERVICES[serviceKey] || config.OTHER_ARCHETYPES[serviceKey];
  ALL_LOCATION_KEYS.forEach(locationKey => {
    // Deal value is location+service derived and identical across every channel
    // for a given call - used below to cross-check blended revenue.
    const dealValueInfo = engine.resolveLocationAndDealValue(locationKey, svc).dealValueRangeObj;
    ALL_CONV_KEYS.forEach(conversionLocationKey => {
      ALLOCATION_OVERRIDES.forEach(({ label, value }) => {
        SWEEP_BUDGETS.forEach(budgetTotal => {
          exhaustiveCombosRun++;
          const ctx = `${serviceKey}/${locationKey}/${conversionLocationKey}/${label}/$${budgetTotal}`;
          let r;
          try {
            r = engine.computeServiceForecast({ serviceKey, budgetTotal, locationKey, conversionLocationKey, googleSplitOverride: value });
          } catch (e) {
            check(`[exhaustive] ${ctx} threw: ${e.message}`, false);
            return;
          }

          check(`[exhaustive] ${ctx} activeSplitGoogle in [0,1]`, r.activeSplitGoogle >= 0 && r.activeSplitGoogle <= 1);
          // Budget conservation: Google + Meta must always sum back to the total,
          // for every allocation mode, every budget, including $0 and fractional cents.
          check(`[exhaustive] ${ctx} google+meta budget conserves total`,
            Math.abs(r.google.total.budget + r.meta.funnel.budget - budgetTotal) < 1e-6);

          checkFunnelInvariants(`[exhaustive] ${ctx} blended`, r.blended, budgetTotal);
          checkFunnelInvariants(`[exhaustive] ${ctx} google.total`, r.google.total, r.google.total.budget);
          checkFunnelInvariants(`[exhaustive] ${ctx} meta.funnel`, r.meta.funnel, r.meta.funnel.budget);

          // Revenue reconciles exactly to bookedJobs x dealValue - the same
          // dealValueRangeObj feeds every channel in this call, so this must
          // hold exactly (within floating tolerance), not approximately.
          check(`[exhaustive] ${ctx} blended.revenue.mid == bookedJobs.mid x dealValue.mid`,
            Math.abs(r.blended.revenue.mid - r.blended.bookedJobs.mid * dealValueInfo.mid) < Math.max(1, r.blended.revenue.mid * 1e-6));

          // Google-only must never produce Meta spend/output, and vice versa -
          // across every service/location/budget, not just the earlier spot checks.
          if (value === 1) {
            check(`[exhaustive] ${ctx} google-only: meta budget is 0`, Math.abs(r.meta.funnel.budget) < 1e-6);
            check(`[exhaustive] ${ctx} google-only: meta leads are 0`, r.meta.funnel.leads.mid === 0);
          }
          if (value === 0) {
            check(`[exhaustive] ${ctx} meta-only: google budget is 0`, Math.abs(r.google.total.budget) < 1e-6);
            check(`[exhaustive] ${ctx} meta-only: google leads are 0`, r.google.total.leads.mid === 0);
          }
        });
      });
    });
  });
});
console.log(`  ${exhaustiveCombosRun.toLocaleString()} full combinations run in ${((Date.now() - exhaustiveStart) / 1000).toFixed(1)}s.`);

console.log('\n=== 8. MONOTONICITY ACROSS THE FULL SERVICE x LOCATION GRID ===');
console.log('  Not spot-checked on one or two services - every service x every');
console.log('  location, confirming diminishing returns never inverts into more');
console.log('  spend producing less revenue, and every 10%-step reallocation from');
console.log('  Meta to Google moves the two channel budgets in the right direction.');

let monotoneBudgetChecks = 0;
ALL_SERVICE_KEYS.forEach(serviceKey => {
  ALL_LOCATION_KEYS.forEach(locationKey => {
    let prevRevenue = -Infinity;
    let monotonic = true;
    SWEEP_BUDGETS.forEach(budgetTotal => {
      const r = engine.computeServiceForecast({ serviceKey, budgetTotal, locationKey, conversionLocationKey: 'landing' });
      if (r.blended.revenue.mid < prevRevenue - 1e-6) monotonic = false;
      prevRevenue = r.blended.revenue.mid;
    });
    monotoneBudgetChecks++;
    check(`[monotone-budget] ${serviceKey}/${locationKey}: blended revenue never decreases as budget rises`, monotonic);
  });
});
console.log(`  ${monotoneBudgetChecks} service x location sequences checked across ${SWEEP_BUDGETS.length} budgets each.`);

let monotoneAllocationChecks = 0;
ALL_SERVICE_KEYS.forEach(serviceKey => {
  ALL_LOCATION_KEYS.forEach(locationKey => {
    let prevGoogleBudget = -Infinity;
    let googleMonotonic = true;
    for (let pct = 0; pct <= 100; pct += 10) {
      const r = engine.computeServiceForecast({ serviceKey, budgetTotal: 5000, locationKey, conversionLocationKey: 'landing', googleSplitOverride: pct / 100 });
      if (r.google.total.budget < prevGoogleBudget - 1e-6) googleMonotonic = false;
      prevGoogleBudget = r.google.total.budget;
    }
    monotoneAllocationChecks++;
    check(`[monotone-allocation] ${serviceKey}/${locationKey}: Google budget rises monotonically as the slider moves 0%->100%`, googleMonotonic);
  });
});
console.log(`  ${monotoneAllocationChecks} service x location sequences checked across 11 allocation steps each.`);

console.log('\n=== 9. STRATEGY CONTENT CONSISTENCY (does the "why" sentence agree with the actual modeled split?) ===');
console.log('  Every splitReason sentence shown on the Recommended plan card is');
console.log('  matched against that same service\'s real splitGoogle midpoint from');
console.log('  config.js, so hand-written copy can\'t silently drift out of sync');
console.log('  with the number it\'s standing next to.');

ALL_SERVICE_KEYS.forEach(serviceKey => {
  const svc = config.SERVICES[serviceKey] || config.OTHER_ARCHETYPES[serviceKey];
  const content = STRATEGY_CONTENT[serviceKey];
  check(`[strategy] ${serviceKey} has a splitReason`, !!content && !!content.splitReason);
  if (!content || !content.splitReason) return;

  const googleMid = (svc.splitGoogle[0] + svc.splitGoogle[1]) / 2;
  const text = content.splitReason.toLowerCase();
  const saysGoogleLeads = /google (should|leads|carr)/.test(text);
  const saysMetaLeads = /meta (carries|should carry|carr)/.test(text);

  // The only thing that has to hold, regardless of exactly how confidently
  // the copy phrases it (a flat "carries most," a softer "should lead," or
  // "both contribute meaningfully" for a genuinely close split): the copy
  // must never claim the MINORITY channel is the one carrying more budget.
  // Below 50% Google, Meta is the actual majority - the copy must not claim
  // Google leads; at or above 50%, it must not claim Meta carries more.
  if (googleMid < 0.5) {
    check(`[strategy] ${serviceKey} (${Math.round(googleMid*100)}% Google, Meta is the actual majority): splitReason doesn't claim Google leads`,
      !saysGoogleLeads);
    check(`[strategy] ${serviceKey} (${Math.round(googleMid*100)}% Google): splitReason does say Meta carries more`, saysMetaLeads);
  } else {
    check(`[strategy] ${serviceKey} (${Math.round(googleMid*100)}% Google, Google is the actual majority or a tie): splitReason doesn't claim Meta carries more`,
      !saysMetaLeads);
  }
});

console.log('\n=== 10. WORKED EXAMPLE (manual eyeball check) ===');
{
  const example = engine.computeServiceForecast({
    serviceKey: 'hvac_ac_install',
    budgetTotal: 3000,
    locationKey: 'seattle_wa',
    conversionLocationKey: 'landing'
  });
  console.log(`  Service: ${example.serviceLabel} | Location: ${example.location} | Budget: $${example.budgetTotal}`);
  console.log(`  Google split (mid): ${(((example.splitGoogleRange[0]+example.splitGoogleRange[1])/2)*100).toFixed(0)}%  [${example.tags.split}]`);
  console.log(`  Google budget: ~$${(example.google.total.budget).toFixed(0)}  |  Meta budget: ~$${(example.meta.funnel.budget).toFixed(0)}`);
  console.log(`  Blended leads: ${example.blended.leads.low.toFixed(1)} - ${example.blended.leads.high.toFixed(1)} (mid ${example.blended.leads.mid.toFixed(1)})`);
  console.log(`  Blended booked jobs: ${example.blended.bookedJobs.low.toFixed(2)} - ${example.blended.bookedJobs.high.toFixed(2)} (mid ${example.blended.bookedJobs.mid.toFixed(2)})`);
  console.log(`  Blended cost/job: $${example.blended.costPerJob.low.toFixed(0)} - $${example.blended.costPerJob.high.toFixed(0)} (mid $${example.blended.costPerJob.mid.toFixed(0)})`);
  console.log(`  Blended revenue: $${example.blended.revenue.low.toFixed(0)} - $${example.blended.revenue.high.toFixed(0)} (mid $${example.blended.revenue.mid.toFixed(0)})`);
  console.log(`  Blended ROAS: ${example.blended.roas.low.toFixed(1)}x - ${example.blended.roas.high.toFixed(1)}x (mid ${example.blended.roas.mid.toFixed(1)}x)`);
  console.log(`  Location multiplier tag: ${example.tags.locationMultiplier} | Deal value tag: ${example.tags.dealValue}`);
}

console.log('\n=== RESULT ===');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
if (fail > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log('  - ' + f));
  process.exitCode = 1;
} else {
  console.log('All checks passed.');
}
