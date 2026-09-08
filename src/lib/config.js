/**
 * config.js - v1 Data Configuration
 * ----------------------------------
 * Pure data. No calculation logic lives here.
 * Every numeric value is a [low, high] range and carries a confidence tag.
 * Tags: 'BENCHMARK' | 'ESTIMATE' | 'DERIVED_LOGIC' | 'WEAK'
 *
 * This file is the direct machine-readable form of:
 * Marketing_Calculator_v1_Data_Spec.md (locked, review pass 1 complete)
 *
 * When a real number changes because of new research or validated campaign
 * data, THIS is the only file that should need editing - engine.js should
 * never contain a hardcoded number.
 */

// ---------------------------------------------------------------------------
// BANDS - the three intent classifications every service inherits from
// ---------------------------------------------------------------------------
const BANDS = {
  A: {
    id: 'A',
    name: 'Demand Capture / Emergency',
    description: 'Customer already has the problem and is actively searching. Google/LSA should dominate spend.'
  },
  B: {
    id: 'B',
    name: 'Balanced / Considered Purchase',
    description: 'Moderate ticket ($1,400-$5,600), days-to-weeks consideration window. Both channels contribute meaningfully.'
  },
  B_MAJOR: {
    id: 'B_MAJOR',
    name: 'Balanced / Considered Purchase - Major Install',
    description: 'Big-ticket ($4,000+) full-system replacement or major project. Same demand-creation logic as Band B, but close rates are materially lower per lead because the decision involves more deliberation, competing quotes, and financing - modeled separately after validation showed reusing Band B numbers here produced implausible 40-80x ROAS.'
  },
  C: {
    id: 'C',
    name: 'Proactive / Demand Creation',
    description: 'Low-commitment, seasonal or preventive. Meta can create the demand before it is felt.'
  }
};

// ---------------------------------------------------------------------------
// CHANNEL_BASE - per band, per channel: cpc, cpl, close rate, cost/job, roas
// Source: cross-market research synthesis (Tier 2-3, tagged BENCHMARK except
// where explicitly marked otherwise). See spec §4-6.
// ---------------------------------------------------------------------------
const CHANNEL_BASE = {
  A: {
    google_lsa:     { cpc: null,           cpl: [25, 80],   close: [0.40, 0.45], costPerJob: [180, 220], roas: null, tag: 'BENCHMARK' },
    google_search:  { cpc: [12, 35],       cpl: [120, 180], close: [0.30, 0.40], costPerJob: [320, 450], roas: null, tag: 'ESTIMATE' },
    meta_form:       { cpc: [1.20, 2.80],  cpl: [40, 120],  close: [0.05, 0.08], costPerJob: [450, 700], roas: [1.5, 3.0], tag: 'DERIVED_LOGIC' },
    meta_landing:    { cpc: [1.20, 2.80],  cpl: [60, 110],  close: [0.10, 0.15], costPerJob: [400, 600], roas: [1.5, 3.0], tag: 'DERIVED_LOGIC' }
  },
  B: {
    // NOTE (found in validation, not in original spec): the source's LSA
    // close-rate (35-45%) and Search close-rate (28-38%) were explicitly
    // labeled "(Repairs/Service)" and "(Blended Trades)" respectively -
    // i.e. calibrated on small-ticket/mixed work, NOT install-specific.
    // Applying them at face value to a $6k-18k install deal value produced
    // an ~84x ROAS in validation. Meta's Band B numbers, by contrast, WERE
    // explicitly labeled "(Installs/Packages)" / "(Planned Work)" in the
    // same source - so only the Google side needed correction here.
    // google_search.close below is corrected to an install-plausible level.
    // IMPORTANT: as of the second validation pass, Band B is now reserved
    // for MODERATE-ticket considered purchases (~$1,400-$5,600, e.g. Water
    // Heater Install) where the source's own implied deal value (back-solved
    // from its stated ROAS band, ≈$1,400) roughly matches. Big-ticket
    // installs ($4,000+: AC/Furnace Install, Sewer, Repiping) were moved to
    // Band B_MAJOR below, which has its own, lower, DERIVED_LOGIC close rate.
    google_lsa:     { cpc: null,           cpl: [25, 80],   close: [0.35, 0.45], costPerJob: [180, 240], roas: [5.5, 8.5], tag: 'BENCHMARK (repair-calibrated - excluded from Band B via GOOGLE_MIX, see engine.js)' },
    google_search:  { cpc: [9.30, 10.49],  cpl: [104, 149], close: [0.08, 0.15], costPerJob: [300, 420], roas: [4.0, 6.5], tag: 'DERIVED_LOGIC (corrected from sourced 28-38% blended-trades figure - see comment above)' },
    meta_form:       { cpc: [1.20, 2.80],  cpl: [28, 42],   close: [0.10, 0.15], costPerJob: [280, 420], roas: [3.5, 6.0], tag: 'BENCHMARK' },
    meta_landing:    { cpc: [1.20, 2.80],  cpl: [52, 78],   close: [0.20, 0.30], costPerJob: [260, 390], roas: [4.0, 7.0], tag: 'BENCHMARK' }
  },
  B_MAJOR: {
    // Big-ticket installs ($4,000+ deal value: AC/Furnace Install, Sewer,
    // Repiping). Back-solving Band B's sourced ROAS band against its own
    // CPL/close-rate implies a ~$1,400 deal value - far below these
    // services' real $6k-18k tickets, which produced 39-84x ROAS in
    // validation (implausible; no case study anywhere reports that).
    // Close rates here are DERIVED_LOGIC, calibrated so ROAS lands in the
    // 4-8x range corroborated by: Ascenditt (~7x HVAC/plumbing), Elev8
    // Operations (4-6x HVAC replacement funnels specifically), and the
    // source document's OWN worked example ($20k revenue / $2k spend = 10x).
    // This also resolves the "2-4% vs 28-38%" tension the original spec
    // brief flagged and couldn't reconcile - 2-4% is correct for this
    // ticket size; 28-38% was never meant to apply to it.
    google_search:  { cpc: [9.30, 10.49],  cpl: [104, 149], close: [0.030, 0.060], costPerJob: null, roas: [4.0, 8.0], tag: 'DERIVED_LOGIC' },
    meta_form:       { cpc: [1.20, 2.80],  cpl: [28, 42],   close: [0.015, 0.030], costPerJob: null, roas: [4.0, 8.0], tag: 'DERIVED_LOGIC' },
    meta_landing:    { cpc: [1.20, 2.80],  cpl: [52, 78],   close: [0.035, 0.060], costPerJob: null, roas: [4.0, 8.0], tag: 'DERIVED_LOGIC' }
  },
  C: {
    // No LSA row: maintenance/tune-up is not treated as an emergency-eligible
    // LSA category in this model (a deliberate scope choice, not a universal fact).
    google_search:  { cpc: [6, 12],   cpl: [35, 75],  close: [0.25, 0.35], costPerJob: [150, 280], roas: null, tag: 'ESTIMATE' },
    meta_form:       { cpc: [1.00, 2.20], cpl: [35, 65],  close: [0.12, 0.18], costPerJob: [200, 350], roas: null, tag: 'DERIVED_LOGIC' },
    meta_landing:    { cpc: [1.00, 2.20], cpl: [55, 90],  close: [0.22, 0.32], costPerJob: [190, 300], roas: null, tag: 'DERIVED_LOGIC' }
  }
};

// ---------------------------------------------------------------------------
// STAGE_SPLIT - back-solved 3-way breakdown of each channel's close rate.
// qualified * appointment * show  ≈  the close rate midpoint in CHANNEL_BASE.
// ALL values here are DERIVED_LOGIC regardless of what the parent close-rate
// tag says - see spec §3. The combined rate is the only sourced number.
// ---------------------------------------------------------------------------
const STAGE_SPLIT = {
  A: {
    google_lsa:    { qualified: 0.65, appointment: 0.75, show: 0.85 },
    google_search: { qualified: 0.60, appointment: 0.68, show: 0.82 },
    meta_form:      { qualified: 0.35, appointment: 0.45, show: 0.42 },
    meta_landing:   { qualified: 0.45, appointment: 0.55, show: 0.50 }
  },
  B: {
    google_lsa:    { qualified: 0.60, appointment: 0.75, show: 0.80 },
    google_search: { qualified: 0.55, appointment: 0.50, show: 0.42 },
    meta_form:      { qualified: 0.45, appointment: 0.55, show: 0.50 },
    meta_landing:   { qualified: 0.55, appointment: 0.65, show: 0.65 }
  },
  B_MAJOR: {
    google_search: { qualified: 0.45, appointment: 0.35, show: 0.29 },
    meta_form:      { qualified: 0.30, appointment: 0.30, show: 0.25 },
    meta_landing:   { qualified: 0.40, appointment: 0.40, show: 0.30 }
  },
  C: {
    google_search: { qualified: 0.60, appointment: 0.68, show: 0.75 },
    meta_form:      { qualified: 0.55, appointment: 0.65, show: 0.42 },
    meta_landing:   { qualified: 0.65, appointment: 0.72, show: 0.58 }
  }
};

// ---------------------------------------------------------------------------
// CTR + landing/form conversion rate - needed only for the display-only
// "impressions" figure and for internal consistency. Not load-bearing for
// the core funnel (which runs off CPL directly), per spec §3.
// ---------------------------------------------------------------------------
const CTR_ASSUMPTIONS = {
  google_lsa:    { ctr: null },                     // pay-per-lead, no CTR concept
  google_search: { ctr: [0.0497, 0.0908], tag: 'BENCHMARK' }, // 4.97%-9.08% range from research
  meta_form:      { ctr: [0.0194, 0.0306], tag: 'BENCHMARK' }, // home-improvement to FB-local-service range
  meta_landing:   { ctr: [0.0068, 0.0259], tag: 'BENCHMARK' }  // IG-local-service to all-industry-leads range
};

// ---------------------------------------------------------------------------
// SERVICES - the 16 locked HVAC + Plumbing services
// splitGoogle / splitMeta are DERIVED_LOGIC in every case (see spec §7)
// dealValue tags vary per service - see individual comments
// ---------------------------------------------------------------------------
const SERVICES = {
  // ---------------- HVAC ----------------
  hvac_emergency_ac: {
    label: 'Emergency AC Repair', category: 'hvac', band: 'A',
    dealValue: [300, 1200], dealValueTag: 'BENCHMARK',
    splitGoogle: [0.80, 0.90], splitTag: 'DERIVED_LOGIC',
    seasonal: 'summer_spike'
  },
  hvac_emergency_heat: {
    label: 'Emergency Heating Repair', category: 'hvac', band: 'A',
    dealValue: [300, 1200], dealValueTag: 'BENCHMARK',
    splitGoogle: [0.80, 0.90], splitTag: 'DERIVED_LOGIC',
    seasonal: 'winter_spike'
  },
  hvac_ac_install: {
    label: 'AC Installation / Replacement', category: 'hvac', band: 'B_MAJOR',
    dealValue: [6000, 15000], dealValueTag: 'ESTIMATE', // Seattle heat pump avg $10,218 sits inside this range (BENCHMARK anchor)
    splitGoogle: [0.55, 0.70], splitTag: 'DERIVED_LOGIC',
    seasonal: 'ramp_6to8wk_before_summer'
  },
  hvac_furnace_install: {
    label: 'Furnace / Heating Installation / Replacement', category: 'hvac', band: 'B_MAJOR',
    dealValue: [4700, 18000], dealValueTag: 'BENCHMARK', // Seattle furnace avg $4,683; dual-fuel/heat pump systems to $18k
    splitGoogle: [0.55, 0.70], splitTag: 'DERIVED_LOGIC',
    seasonal: 'ramp_6to8wk_before_winter'
  },
  hvac_maintenance: {
    label: 'HVAC Maintenance / Tune-Up', category: 'hvac', band: 'C',
    dealValue: [59, 149], dealValueTag: 'BENCHMARK', // promo ticket only - no upsell modeled, locked decision
    splitGoogle: [0.40, 0.55], splitTag: 'DERIVED_LOGIC',
    seasonal: 'ramp_6to8wk_before_both_peaks'
  },
  hvac_other: {
    label: 'Other HVAC service', category: 'hvac', band: 'B',
    dealValue: [200, 2000], dealValueTag: 'WEAK',
    splitGoogle: [0.55, 0.70], splitTag: 'DERIVED_LOGIC',
    seasonal: null,
    note: 'Includes Heat Pump Install/Replace pending its own v1.1 service line.'
  },

  // ---------------- PLUMBING ----------------
  plumb_emergency: {
    label: 'Emergency Plumbing', category: 'plumbing', band: 'A',
    dealValue: [350, 900], dealValueTag: 'BENCHMARK',
    splitGoogle: [0.80, 0.90], splitTag: 'DERIVED_LOGIC',
    seasonal: null
  },
  plumb_drain: {
    label: 'Drain Cleaning', category: 'plumbing', band: 'A', bandNote: 'A-leaning',
    dealValue: [250, 600], dealValueTag: 'ESTIMATE',
    splitGoogle: [0.70, 0.80], splitTag: 'DERIVED_LOGIC',
    seasonal: null
  },
  plumb_sewer: {
    label: 'Sewer / Main Line', category: 'plumbing', band: 'B_MAJOR',
    dealValue: [4000, 12000], dealValueTag: 'BENCHMARK', // Seattle trenchless sewer $7,500-$11,500 anchors upper range
    splitGoogle: [0.55, 0.70], splitTag: 'DERIVED_LOGIC',
    seasonal: null
  },
  plumb_wh_repair: {
    label: 'Water Heater Repair', category: 'plumbing', band: 'A', bandNote: 'A-leaning',
    dealValue: [150, 500], dealValueTag: 'ESTIMATE',
    splitGoogle: [0.70, 0.80], splitTag: 'DERIVED_LOGIC',
    seasonal: null
  },
  plumb_wh_install: {
    label: 'Water Heater Installation', category: 'plumbing', band: 'B',
    dealValue: [1400, 5600], dealValueTag: 'BENCHMARK', // Seattle hybrid HP water heater $3,200-$4,600 anchors mid-upper range
    splitGoogle: [0.55, 0.70], splitTag: 'DERIVED_LOGIC',
    seasonal: null
  },
  plumb_leak: {
    label: 'Leak Repair', category: 'plumbing', band: 'A', bandNote: 'A-leaning',
    dealValue: [200, 800], dealValueTag: 'ESTIMATE',
    splitGoogle: [0.70, 0.80], splitTag: 'DERIVED_LOGIC',
    seasonal: null
  },
  plumb_repipe: {
    label: 'Repiping', category: 'plumbing', band: 'B_MAJOR',
    dealValue: [4500, 16000], dealValueTag: 'BENCHMARK', // Seattle whole-home repipe $6,500-$12,000 anchors range
    splitGoogle: [0.55, 0.70], splitTag: 'DERIVED_LOGIC',
    seasonal: null
  },
  plumb_fixture: {
    label: 'Fixture / General Plumbing', category: 'plumbing', band: 'A', bandNote: 'A-leaning',
    dealValue: [150, 500], dealValueTag: 'ESTIMATE',
    splitGoogle: [0.65, 0.75], splitTag: 'DERIVED_LOGIC',
    seasonal: null
  },
  plumb_maintenance: {
    label: 'Plumbing Maintenance', category: 'plumbing', band: 'C',
    dealValue: [1200, 3500], dealValueTag: 'BENCHMARK', // whole-home softener installed; smaller recurring service is $100-$300 (ESTIMATE, not the default shown)
    splitGoogle: [0.40, 0.55], splitTag: 'DERIVED_LOGIC',
    seasonal: null,
    note: 'Strongest documented Meta creative angle in the entire spec where local water hardness is evidenced (Utah).'
  },
  plumb_other: {
    label: 'Other Plumbing service', category: 'plumbing', band: 'B',
    dealValue: [200, 2000], dealValueTag: 'WEAK',
    splitGoogle: [0.55, 0.70], splitTag: 'DERIVED_LOGIC',
    seasonal: null
  }
};

// ---------------------------------------------------------------------------
// OTHER_ARCHETYPES - generic non-HVAC/Plumbing fallback (spec §10)
// ---------------------------------------------------------------------------
const OTHER_ARCHETYPES = {
  other_emergency:      { label: 'Emergency / urgent',        band: 'A', dealValue: [200, 1500], dealValueTag: 'WEAK', splitGoogle: [0.80, 0.90], splitTag: 'DERIVED_LOGIC' },
  other_install:        { label: 'Installation / replacement', band: 'B', dealValue: [1000, 10000], dealValueTag: 'WEAK', splitGoogle: [0.55, 0.70], splitTag: 'DERIVED_LOGIC' },
  other_hightick:       { label: 'High-ticket project',        band: 'B', dealValue: [5000, 20000], dealValueTag: 'WEAK', splitGoogle: [0.55, 0.70], splitTag: 'DERIVED_LOGIC' },
  other_maintenance:    { label: 'Maintenance',                 band: 'C', dealValue: [100, 500], dealValueTag: 'WEAK', splitGoogle: [0.40, 0.55], splitTag: 'DERIVED_LOGIC' },
  other_local:          { label: 'Local service (general)',    band: 'B', dealValue: [500, 3000], dealValueTag: 'WEAK', splitGoogle: [0.55, 0.70], splitTag: 'DERIVED_LOGIC' },
  other_visual:         { label: 'Discretionary / visual',     band: 'C', dealValue: [500, 5000], dealValueTag: 'WEAK', splitGoogle: [0.30, 0.40], splitTag: 'DERIVED_LOGIC',
                          note: 'Meta weighted higher than standard Band C - extrapolated from adjacent-trade evidence (landscaping/roofing), not this-archetype evidence.' },
  other_misc:           { label: 'Other',                       band: 'B', dealValue: [200, 5000], dealValueTag: 'WEAK', splitGoogle: [0.55, 0.70], splitTag: 'DERIVED_LOGIC' }
};

// ---------------------------------------------------------------------------
// LOCATIONS - evidence markets + fallback tiers (spec §8)
// costMultiplier applies to CPC/CPL only. dealValueAdjust nudges the deal
// value range toward the local-evidence end where we have real project-cost
// data. ALL multipliers are PROVISIONAL PARAMETERS (locked decision) -
// never hardcode these into engine.js logic; always read from here.
// ---------------------------------------------------------------------------
const LOCATIONS = {
  seattle_wa: {
    label: 'Seattle / Western WA', hasEvidence: true,
    costMultiplier: [1.10, 1.20], costMultiplierTag: 'ESTIMATE_PROVISIONAL',
    dealValueSkew: 'upper', // use upper-middle of national range, not midpoint
    note: 'Real local project-cost evidence (heat pump $10,218 avg, furnace $4,683 avg, trenchless sewer $7.5-11.5k, repipe $6.5-12k). No direct local ad-cost evidence.'
  },
  utah_wasatch: {
    label: 'Utah / Wasatch Front', hasEvidence: true,
    costMultiplier: [1.10, 1.20], costMultiplierTag: 'ESTIMATE_PROVISIONAL',
    dealValueSkew: 'upper',
    boostServices: ['plumb_maintenance'], // water hardness makes this the strongest local angle
    note: 'Real local evidence: water hardness 13-30+ GPG, dual-fuel HVAC $7-16k, Rocky Mountain Power rebates.'
  },
  colorado_springs: {
    label: 'Colorado Springs / CO', hasEvidence: true,
    costMultiplier: [1.05, 1.15], costMultiplierTag: 'ESTIMATE_PROVISIONAL',
    dealValueSkew: 'mid',
    note: 'Weaker evidence than WA/UT: altitude affects AC sizing, job price range $150-$4,200 general.'
  },
  oregon_portland: {
    label: 'Oregon / Portland', hasEvidence: true,
    costMultiplier: null, // thinnest evidence - falls through to market tier, no OR-specific multiplier
    dealValueSkew: 'mid',
    note: 'Qualitative evidence only (4-season heat-pump market, competitive). No cost figures found - use tier fallback.'
  },
  fallback_major_metro: { label: 'Major Metro (unlisted)', hasEvidence: false, costMultiplier: [1.15, 1.30], costMultiplierTag: 'ESTIMATE_PROVISIONAL' },
  fallback_mid_size:     { label: 'Mid-size Market (unlisted)', hasEvidence: false, costMultiplier: [1.00, 1.00], costMultiplierTag: 'ESTIMATE_PROVISIONAL' },
  fallback_small_rural:  { label: 'Small / Rural (unlisted)', hasEvidence: false, costMultiplier: [0.75, 0.90], costMultiplierTag: 'ESTIMATE_PROVISIONAL', volumeWarning: true }
};

// ---------------------------------------------------------------------------
// CONVERSION_LOCATION - Meta-only choice, affects which meta_* row is used
// ---------------------------------------------------------------------------
const CONVERSION_LOCATIONS = {
  form: { key: 'meta_form', label: 'Instant Lead Form' },
  landing: { key: 'meta_landing', label: 'Dedicated Landing Page' }
};

// ---------------------------------------------------------------------------
// DIMINISHING_RETURNS - spec §11. Applied within a single service/location
// as budget rises. DERIVED_LOGIC, grounded in a directional pattern only.
// ---------------------------------------------------------------------------
const DIMINISHING_RETURNS = {
  // CPL escalates this % for every doubling of budget past the reference point
  perDoublingCplIncrease: [0.05, 0.08],
  referenceBudget: 3000,
  tag: 'DERIVED_LOGIC'
};

export {
  BANDS,
  CHANNEL_BASE,
  STAGE_SPLIT,
  CTR_ASSUMPTIONS,
  SERVICES,
  OTHER_ARCHETYPES,
  LOCATIONS,
  CONVERSION_LOCATIONS,
  DIMINISHING_RETURNS
};
