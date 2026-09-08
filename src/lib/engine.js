/**
 * engine.js - v1 Calculation Engine
 * -----------------------------------
 * Pure functions only. No DOM, no formatting, no hardcoded numbers.
 * Every number this module produces is traceable back to config.js.
 *
 * ARCHITECTURE NOTE (new decision made at this layer, not yet in the spec -
 * flagging for review): the locked spec's CHANNEL_BASE splits "Google" into
 * google_lsa and google_search, but the spec's example output format shows
 * a single blended "Google Ads" line. Something has to decide how much of
 * the Google budget goes to LSA vs Search. That split did not exist anywhere
 * in the locked spec, so it's introduced here as GOOGLE_MIX, tagged
 * DERIVED_LOGIC, and called out explicitly rather than buried.
 */

import {
  CHANNEL_BASE,
  STAGE_SPLIT,
  CTR_ASSUMPTIONS,
  SERVICES,
  OTHER_ARCHETYPES,
  LOCATIONS,
  CONVERSION_LOCATIONS,
  DIMINISHING_RETURNS
} from './config.js';

// ---------------------------------------------------------------------------
// NEW (this layer): Google internal mix - LSA vs Search share of Google $.
// Not in the locked spec. DERIVED_LOGIC. Needs explicit sign-off.
// ---------------------------------------------------------------------------
const GOOGLE_MIX = {
  A: { lsa: 0.60, search: 0.40 }, // emergency: LSA's pay-per-lead simplicity favored
  B: { lsa: 0.00, search: 1.00 }, // moderate-ticket install: LSA's close-rate evidence is repair-calibrated and
                                   // doesn't transfer to install-value leads at any weight (see config.js
                                   // comment on CHANNEL_BASE.B.google_lsa) - 100% of Google budget routes
                                   // through Search rather than misapplying repair economics.
  B_MAJOR: { lsa: 0.00, search: 1.00 }, // same reasoning as Band B, even more so at this ticket size
  // BUG FIX (found by exhaustive cross-product verification): this was
  // { lsa: 0.20, search: 0.80 }, but CHANNEL_BASE.C has no google_lsa entry
  // at all (see its comment: band C is deliberately not modeled as an
  // LSA-eligible category) - computeChannelFunnel returns null for a
  // channel with no CHANNEL_BASE row, and sumFunnels only totals non-null
  // funnels' budgets, so that 20% was being carved out of every Band C
  // service's Google budget and then silently dropped, never appearing in
  // google.total.budget, blended revenue, or ROAS. Routing all of Band C's
  // Google budget through Search (same fix already applied to B/B_MAJOR
  // above, for the identical reason) closes the leak.
  C: { lsa: 0.00, search: 1.00 }
};

// ---------------------------------------------------------------------------
// Range helpers - every quantity in this engine is a {low, mid, high} object
// ---------------------------------------------------------------------------
function toRangeObj(r) {
  if (r === null || r === undefined) return null;
  const [low, high] = r;
  return { low, mid: (low + high) / 2, high };
}

function mult(rangeObj, scalar) {
  if (!rangeObj) return null;
  return { low: rangeObj.low * scalar, mid: rangeObj.mid * scalar, high: rangeObj.high * scalar };
}

function applyCostMultiplier(baseRangeArr, multiplierRangeArr) {
  // baseRangeArr / multiplierRangeArr are raw [low, high] arrays from config
  if (!baseRangeArr) return null;
  const mLow = multiplierRangeArr ? multiplierRangeArr[0] : 1;
  const mHigh = multiplierRangeArr ? multiplierRangeArr[1] : 1;
  return {
    low: baseRangeArr[0] * mLow,
    mid: ((baseRangeArr[0] * mLow) + (baseRangeArr[1] * mHigh)) / 2,
    high: baseRangeArr[1] * mHigh
  };
}

function divideBudgetByCpl(budget, cplRangeObj) {
  // cheaper CPL (low) => more leads (high); expensive CPL (high) => fewer leads (low)
  if (!cplRangeObj || budget <= 0) return { low: 0, mid: 0, high: 0 };
  const leadsHigh = cplRangeObj.low > 0 ? budget / cplRangeObj.low : 0;
  const leadsLow  = cplRangeObj.high > 0 ? budget / cplRangeObj.high : 0;
  const leadsMid  = cplRangeObj.mid > 0 ? budget / cplRangeObj.mid : 0;
  return { low: leadsLow, mid: leadsMid, high: leadsHigh };
}

function scaleRangeObj(rangeObj, factor) {
  if (!rangeObj) return null;
  return { low: rangeObj.low * factor, mid: rangeObj.mid * factor, high: rangeObj.high * factor };
}

function safeDivide(a, b) {
  return b > 0 ? a / b : 0;
}

// ---------------------------------------------------------------------------
// Diminishing returns - spec §11. CPL escalates as budget rises past the
// reference point. DERIVED_LOGIC. Returns a scalar >= 1.
// ---------------------------------------------------------------------------
function diminishingReturnsFactor(budget) {
  const ref = DIMINISHING_RETURNS.referenceBudget;
  if (budget <= ref) return 1;
  const [lowInc, highInc] = DIMINISHING_RETURNS.perDoublingCplIncrease;
  const midInc = (lowInc + highInc) / 2;
  const doublings = Math.log2(budget / ref);
  return 1 + midInc * doublings;
}

// ---------------------------------------------------------------------------
// Core single-channel funnel calculator
//
// RECONCILIATION DECISION (review pass 2): CPL and CPC were both
// independently sourced, so displaying them side by side without connecting
// them risked a client assuming the CPC -> clicks -> leads chain agreed with
// the CPL -> leads figure when nothing forced them to. Fix: CPL remains the
// authoritative driver of `leads` (unchanged, already validated). Clicks and
// impressions are now derived BACKWARD from that same leads number using an
// implied click-to-lead rate = CPC / CPL, so the two numbers can never
// disagree. That implied rate is DERIVED_LOGIC (back-calculated, not itself
// an independently sourced conversion rate) and is NOT the same thing as the
// "instant form submission rate" figures from research, which measure a
// later, narrower funnel stage (form-opened -> submitted, not ad-click ->
// submitted) - flagged here so nobody mistakes one for the other later.
// LSA has no CPC/CTR concept at all (pay-per-lead), so clicks/impressions
// are simply not produced for that channel.
// ---------------------------------------------------------------------------
function computeChannelFunnel({ band, channelKey, budgetForChannel, costMultiplierRange, dealValueRangeObj }) {
  const base = CHANNEL_BASE[band] && CHANNEL_BASE[band][channelKey];
  if (!base) return null; // e.g., LSA doesn't exist for band C

  const stages = STAGE_SPLIT[band][channelKey];
  const drFactor = diminishingReturnsFactor(budgetForChannel);

  // CPL after location cost multiplier and diminishing-returns escalation
  let cpl = applyCostMultiplier(base.cpl, costMultiplierRange);
  cpl = scaleRangeObj(cpl, drFactor);

  const leads = divideBudgetByCpl(budgetForChannel, cpl);

  // Clicks/impressions: derived backward from leads for guaranteed consistency.
  // Not produced for pay-per-lead channels (no cpc concept).
  let clicks = null, impressions = null, impliedClickToLeadRate = null;
  if (base.cpc) {
    const cpc = applyCostMultiplier(base.cpc, costMultiplierRange);
    impliedClickToLeadRate = cpc.mid / cpl.mid; // DERIVED_LOGIC - see comment above
    clicks = {
      low: safeDivide(leads.low, impliedClickToLeadRate),
      mid: safeDivide(leads.mid, impliedClickToLeadRate),
      high: safeDivide(leads.high, impliedClickToLeadRate)
    };
    const ctrConfig = CTR_ASSUMPTIONS[channelKey];
    if (ctrConfig && ctrConfig.ctr) {
      const ctrMid = (ctrConfig.ctr[0] + ctrConfig.ctr[1]) / 2;
      impressions = {
        low: safeDivide(clicks.low, ctrMid),
        mid: safeDivide(clicks.mid, ctrMid),
        high: safeDivide(clicks.high, ctrMid)
      };
    }
  }

  const qualifiedLeads = scaleRangeObj(leads, stages.qualified);
  const appointments = scaleRangeObj(qualifiedLeads, stages.appointment);
  const bookedJobs = scaleRangeObj(appointments, stages.show);

  const costPerJob = {
    low: safeDivide(budgetForChannel, bookedJobs.high),  // most bookings => cheapest per job
    mid: safeDivide(budgetForChannel, bookedJobs.mid),
    high: safeDivide(budgetForChannel, bookedJobs.low)   // fewest bookings => most expensive per job
  };

  const revenue = {
    low: bookedJobs.low * dealValueRangeObj.low,
    mid: bookedJobs.mid * dealValueRangeObj.mid,
    high: bookedJobs.high * dealValueRangeObj.high
  };

  const roas = {
    low: safeDivide(revenue.low, budgetForChannel),
    mid: safeDivide(revenue.mid, budgetForChannel),
    high: safeDivide(revenue.high, budgetForChannel)
  };

  return {
    channelKey,
    budget: budgetForChannel,
    cpl, clicks, impressions, leads, qualifiedLeads, appointments, bookedJobs, costPerJob, revenue, roas,
    impliedClickToLeadRate,
    impliedClickToLeadRateTag: 'DERIVED_LOGIC (back-calculated as CPC/CPL for display consistency - not an independently measured conversion rate)',
    combinedCloseRateTarget: base.close, // the sourced end-to-end number, for validation/display
    combinedCloseRateTag: base.tag,
    stageSplitTag: 'DERIVED_LOGIC',
    dealValueTag: dealValueRangeObj.tag,
    cplTag: base.tag,
    diminishingReturnsFactor: drFactor
  };
}

// ---------------------------------------------------------------------------
// Sum multiple channel-funnel results into one blended total (e.g. LSA+Search)
// ---------------------------------------------------------------------------
function sumFunnels(funnels) {
  const valid = funnels.filter(Boolean);
  if (valid.length === 0) return null;

  const sumField = (field) => valid.reduce((acc, f) => ({
    low: acc.low + f[field].low,
    mid: acc.mid + f[field].mid,
    high: acc.high + f[field].high
  }), { low: 0, mid: 0, high: 0 });

  const budget = valid.reduce((a, f) => a + f.budget, 0);
  const leads = sumField('leads');
  const qualifiedLeads = sumField('qualifiedLeads');
  const appointments = sumField('appointments');
  const bookedJobs = sumField('bookedJobs');
  const revenue = sumField('revenue');

  const cpl = {
    low: safeDivide(budget, leads.high),
    mid: safeDivide(budget, leads.mid),
    high: safeDivide(budget, leads.low)
  };
  const costPerJob = {
    low: safeDivide(budget, bookedJobs.high),
    mid: safeDivide(budget, bookedJobs.mid),
    high: safeDivide(budget, bookedJobs.low)
  };
  const roas = {
    low: safeDivide(revenue.low, budget),
    mid: safeDivide(revenue.mid, budget),
    high: safeDivide(revenue.high, budget)
  };

  return { budget, cpl, leads, qualifiedLeads, appointments, bookedJobs, costPerJob, revenue, roas };
}

// ---------------------------------------------------------------------------
// Resolve a service by key from either the HVAC/Plumbing table or Other
// ---------------------------------------------------------------------------
function resolveService(serviceKey) {
  if (SERVICES[serviceKey]) return SERVICES[serviceKey];
  if (OTHER_ARCHETYPES[serviceKey]) return OTHER_ARCHETYPES[serviceKey];
  throw new Error(`Unknown serviceKey: ${serviceKey}`);
}

// ---------------------------------------------------------------------------
// Resolve location + apply deal-value skew (simple, disclosed interpretation
// of the spec's qualitative "use upper-middle of range" instruction)
// ---------------------------------------------------------------------------
function resolveLocationAndDealValue(locationKey, service) {
  const location = LOCATIONS[locationKey] || LOCATIONS.fallback_mid_size;
  const [dvLow, dvHigh] = service.dealValue;
  const dvMidRaw = (dvLow + dvHigh) / 2;

  let dealValueRangeObj;
  if (location.dealValueSkew === 'upper') {
    dealValueRangeObj = { low: dvMidRaw, mid: (dvMidRaw + dvHigh) / 2, high: dvHigh * 1.05 };
  } else {
    dealValueRangeObj = { low: dvLow, mid: dvMidRaw, high: dvHigh };
  }
  dealValueRangeObj.tag = service.dealValueTag;

  return { location, dealValueRangeObj };
}

// ---------------------------------------------------------------------------
// TOP-LEVEL: compute a full forecast for one service + budget + location
// ---------------------------------------------------------------------------
function computeServiceForecast({ serviceKey, budgetTotal, locationKey, conversionLocationKey, googleSplitOverride }) {
  const service = resolveService(serviceKey);
  const band = service.band;
  const { location, dealValueRangeObj } = resolveLocationAndDealValue(locationKey, service);
  const costMultiplierRange = location.costMultiplier || [1, 1];

  // DEFAULT (unchanged, validated): the modeled recommendation's midpoint -
  // exactly the calculation every existing caller and every check in
  // scripts/validate.mjs already exercises. googleSplitOverride is the one
  // functional addition for the UI's allocation selector (Google-only /
  // Meta-only / a custom %): when provided, it's an explicit user choice
  // that pins the split instead of the modeled one - it does not change the
  // recommendation model itself, and is only ever used when a caller opts in
  // by passing it. Clamped defensively; from here down it's still just a
  // fraction multiplying budgetTotal, so every downstream calculation
  // (diminishing returns, stage splits, deal value, GOOGLE_MIX, etc.) runs
  // through the identical, already-validated path either way.
  const splitGoogleMid = (typeof googleSplitOverride === 'number' && Number.isFinite(googleSplitOverride))
    ? Math.min(1, Math.max(0, googleSplitOverride))
    : (service.splitGoogle[0] + service.splitGoogle[1]) / 2;
  const googleBudget = budgetTotal * splitGoogleMid;
  const metaBudget = budgetTotal - googleBudget;

  const mix = GOOGLE_MIX[band];
  const lsaBudget = mix.lsa !== undefined ? googleBudget * mix.lsa : 0;
  const searchBudget = mix.search !== undefined ? googleBudget * mix.search : googleBudget;

  const lsaFunnel = computeChannelFunnel({ band, channelKey: 'google_lsa', budgetForChannel: lsaBudget, costMultiplierRange, dealValueRangeObj });
  const searchFunnel = computeChannelFunnel({ band, channelKey: 'google_search', budgetForChannel: searchBudget, costMultiplierRange, dealValueRangeObj });
  const googleTotal = sumFunnels([lsaFunnel, searchFunnel]);

  const convKey = (CONVERSION_LOCATIONS[conversionLocationKey] || CONVERSION_LOCATIONS.landing).key;
  const metaFunnel = computeChannelFunnel({ band, channelKey: convKey, budgetForChannel: metaBudget, costMultiplierRange, dealValueRangeObj });

  const blended = sumFunnels([lsaFunnel, searchFunnel, metaFunnel]);

  return {
    serviceKey,
    serviceLabel: service.label,
    band,
    location: location.label || locationKey,
    locationEvidence: !!location.hasEvidence,
    budgetTotal,
    splitGoogleRange: service.splitGoogle,
    activeSplitGoogle: splitGoogleMid, // the fraction actually used above - the modeled midpoint, or googleSplitOverride when passed
    splitTag: service.splitTag,
    google: { total: googleTotal, lsa: lsaFunnel, search: searchFunnel, mix },
    meta: { funnel: metaFunnel, conversionLocation: convKey },
    blended,
    tags: {
      dealValue: dealValueRangeObj.tag,
      split: service.splitTag,
      locationMultiplier: location.costMultiplierTag || 'N/A (no adjustment)',
      stageSplit: 'DERIVED_LOGIC - see combinedCloseRateTag on each funnel for the sourced endpoint'
    }
  };
}

export {
  toRangeObj,
  mult,
  applyCostMultiplier,
  divideBudgetByCpl,
  diminishingReturnsFactor,
  computeChannelFunnel,
  sumFunnels,
  resolveService,
  resolveLocationAndDealValue,
  computeServiceForecast,
  GOOGLE_MIX
};
