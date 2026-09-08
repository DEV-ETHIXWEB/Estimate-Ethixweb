/**
 * strategy-content.js - Dynamic Strategy Recommendation Copy
 * -------------------------------------------------------------
 * Pure presentational content. No numbers, no calculation logic.
 * Keyed by the same serviceKey used in config.js SERVICES / OTHER_ARCHETYPES,
 * so the UI can look up { offer, googleAngle, metaAngle, landingPage, seasonal }
 * for whatever the person selected, without engine.js knowing this exists.
 *
 * splitReason: the one-sentence "why this split" line shown on the main
 * Recommended plan card. It explains the same band-driven logic that
 * already sets each service's splitGoogle range in config.js, just in
 * plain language - it does not encode a number itself (the split shown
 * alongside it always comes from the engine), so it can't drift out of
 * sync with the actual calculated split.
 */

const STRATEGY_CONTENT = {
  hvac_emergency_ac: {
    offer: '"Guaranteed 2-Hour Response" - same-day dispatch, no vague "call for quote."',
    googleAngle: 'Own "AC repair near me" and "no cool [city]" terms. Prioritize Local Services Ads for the verified badge and pay-per-lead pricing.',
    metaAngle: 'Retargeting and brand-recall only - not a primary lead-gen budget. A crisis in progress rarely waits for a scrolled-past ad.',
    landingPage: 'Phone number and live-availability status above the fold. Nothing else competes for attention.',
    seasonal: 'Summer spike. Costs typically ease 30-50% during active heat waves as urgency peaks, then rise 25-60% in the April-May and Sept-Oct shoulder seasons.',
    splitReason: 'Google should carry most of the budget because this service captures existing search demand - a broken AC drives an immediate search, not a considered one.'
  },
  hvac_emergency_heat: {
    offer: '"Furnace Down? We\'re On Our Way" - same posture as AC emergency, winter framing.',
    googleAngle: 'Own "furnace repair," "no heat [city]," and emergency heating terms. LSA priority.',
    metaAngle: 'Retargeting and brand-recall only, mirroring Emergency AC Repair.',
    landingPage: 'Phone-first, live availability, same structure as Emergency AC.',
    seasonal: 'Winter spike - inverse curve to Emergency AC Repair. Ramp visibility 6-8 weeks before the cold season arrives.',
    splitReason: 'Google should carry most of the budget here too - a cold house drives an immediate search the moment it happens, the same demand-capture pattern as any emergency repair.'
  },
  hvac_ac_install: {
    offer: '"$0 Down, $89/mo" financing, or a utility rebate stack where documented (see location notes).',
    googleAngle: '"AC replacement cost [city]" and similar considered-purchase search terms; Performance Max for incremental reach.',
    metaAngle: 'Before/after install photography or short video, financing-forward creative, lookalike audience built from past install customers.',
    landingPage: 'Financing calculator, warranty terms, service-area map, and real reviews - this is a researched purchase, treat the page like one.',
    seasonal: 'Ramp spend 6-8 weeks ahead of summer demand.',
    splitReason: 'Google should carry the larger share because this is a big-ticket, considered purchase people actively search and compare quotes for - though Meta\'s before/after creative earns a real share of the budget too.'
  },
  hvac_furnace_install: {
    offer: 'Financing plus utility rebate combo - dual-fuel rebates are real and documented in WA/UT markets specifically.',
    googleAngle: 'Mirrors AC Installation, swapped to heating-replacement search terms.',
    metaAngle: 'Same creative approach as AC Installation - before/after, financing, lookalikes - timed to the opposite season.',
    landingPage: 'Same structure as AC Installation.',
    seasonal: 'Ramp spend 6-8 weeks ahead of winter demand.',
    splitReason: 'Google should lead here too - a furnace replacement is a big-ticket, considered purchase, though Meta\'s financing-forward creative still earns a meaningful share.'
  },
  hvac_maintenance: {
    offer: '"$69 Pre-Season 21-Point Inspection" - calendar-driven, not urgency-driven.',
    googleAngle: 'Low-competition, long-tail maintenance terms - this category isn\'t fought over the way "emergency" or "replacement" terms are.',
    metaAngle: 'Seasonal push timed to the calendar, membership/maintenance-plan upsell framing, short video of the inspection process itself.',
    landingPage: 'Keep it simple - price up front, one-click booking, no long-form pitch needed for a $69-149 decision.',
    seasonal: 'Two ramps per year: spring pre-cooling and fall pre-heating, each starting 6-8 weeks ahead.',
    note: 'This service is priced and modeled as a customer-acquisition play, not a same-visit profit center - expect thin or sub-1x direct ROAS by design. The value shows up in the next AC/furnace replacement or repeat maintenance visit, which this tool does not currently quantify (see spec: no upsell modeled in v1).',
    splitReason: 'Meta carries relatively more of the budget here - a tune-up is low-urgency, so the demand usually has to be created with a seasonal offer rather than captured from an active search.'
  },
  hvac_other: {
    offer: 'Service-specific - recommend gathering more detail on the exact HVAC service before committing budget.',
    googleAngle: 'Generic HVAC terms until the specific service is known.',
    metaAngle: 'Generic HVAC awareness content until the specific service is known.',
    landingPage: 'Generic HVAC service page.',
    seasonal: null,
    splitReason: 'Google leads by a moderate margin as a general default - treat this split as a placeholder until the specific HVAC service is known.'
  },

  plumb_emergency: {
    offer: '"24/7 Dispatch - On-Site in 60 Minutes."',
    googleAngle: 'Own "emergency plumber [city]," burst pipe, and sewer-backup terms. LSA primary.',
    metaAngle: 'Retargeting only, same posture as Emergency HVAC.',
    landingPage: 'Phone-first, live dispatch status.',
    seasonal: 'Some winter spike around frozen-pipe events; otherwise fairly stable year-round.',
    splitReason: 'Google should carry most of the budget because this is a true emergency - a burst pipe or backup drives an immediate search, not a considered one.'
  },
  plumb_drain: {
    offer: 'Flat-rate drain clearing with a camera-inspection upsell offer.',
    googleAngle: '"Clogged drain [city]" - high-intent but not full emergency pricing.',
    metaAngle: 'Preventive framing ("before it backs up") paired with hydro-jetting before/after video - this service carries real Meta upside beyond pure emergency capture.',
    landingPage: 'Flat-rate price up front, camera-inspection add-on clearly offered.',
    seasonal: null,
    splitReason: 'Google should lead, though less dominantly than a true emergency - a clogged drain is urgent, but there\'s more room here for Meta\'s preventive-framing creative.'
  },
  plumb_sewer: {
    offer: 'Free camera inspection as the entry offer.',
    googleAngle: '"Sewer repair/replacement [city]," "trenchless sewer [city]."',
    metaAngle: 'Education on non-invasive trenchless technology, root-intrusion visuals, financing messaging - a genuinely strong Meta fit for a big-ticket, considered purchase.',
    landingPage: 'Before/after trenchless visuals, financing terms, clear distinction from disruptive dig-up methods.',
    seasonal: null,
    splitReason: 'Google should carry the larger share because sewer repair is a big-ticket, considered purchase - though Meta\'s trenchless-education creative earns real budget at this deal size.'
  },
  plumb_wh_repair: {
    offer: 'Same-day repair, diagnostic fee waived when repair is completed.',
    googleAngle: '"No hot water [city]" - urgency-adjacent but not full emergency pricing.',
    metaAngle: 'Light retargeting plus age-of-unit awareness content nudging toward replacement rather than repeat repair.',
    landingPage: 'Same-day availability emphasized, repair-vs-replace guidance offered.',
    seasonal: null,
    splitReason: 'Google should lead - no hot water reads as urgent even if it\'s not a full emergency, so Meta keeps a modest, secondary presence.'
  },
  plumb_wh_install: {
    offer: '"$250 off tank / $1,000 off tankless" style offer, plus utility rebate stack where documented.',
    googleAngle: '"Water heater replacement [city]," "tankless installation [city]."',
    metaAngle: '"Ran out of hot water?" hook, energy-savings framing, before/after installation photos.',
    landingPage: 'Tank-vs-tankless comparison, rebate amounts, warranty terms.',
    seasonal: null,
    splitReason: 'Google and Meta both contribute meaningfully because this is a moderate-ticket, considered purchase - Meta\'s before/after creative can genuinely influence a multi-day decision.'
  },
  plumb_leak: {
    offer: 'Free leak detection bundled with the repair.',
    googleAngle: '"Water leak repair [city]," "slab leak [city]."',
    metaAngle: 'Retargeting plus hard-water/pipe-damage visual education - especially strong where local water hardness is documented (see Utah location notes).',
    landingPage: 'Free-detection offer up front, urgency without full emergency framing.',
    seasonal: null,
    splitReason: 'Google should lead - a leak is urgent enough to search for immediately, though Meta\'s damage-education creative still earns a real share.'
  },
  plumb_repipe: {
    offer: 'Free plumbing inspection for homes over a certain age.',
    googleAngle: '"Repiping cost [city]," "whole home repipe [city]."',
    metaAngle: 'Pipe-corrosion and mineral-damage before/after visuals, financing, an educational "how old is too old" hook.',
    landingPage: 'Financing terms, before/after imagery, clear project-timeline expectations for a multi-day job.',
    seasonal: null,
    splitReason: 'Google should carry the larger share because repiping is a big-ticket, considered purchase - though Meta\'s before/after and financing creative meaningfully influences the decision.'
  },
  plumb_fixture: {
    offer: 'Flat-rate fixture install/repair pricing.',
    googleAngle: 'Long-tail fixture-specific terms.',
    metaAngle: 'Low priority for dedicated budget - this service usually rides along with other campaigns rather than earning its own spend.',
    landingPage: 'Simple flat-rate pricing page.',
    seasonal: null,
    splitReason: 'Google should lead by a wide margin - fixture work is search-driven, and this service rarely earns its own dedicated Meta budget.'
  },
  plumb_maintenance: {
    offer: 'Free water test / softener consultation.',
    googleAngle: '"Hard water [city]," "water softener installation [city]."',
    metaAngle: 'Mineral-damage visuals on pipes, fixtures, and water-heater scale - the strongest documented Meta creative angle in this entire tool where local water hardness is evidenced (Utah especially).',
    landingPage: 'Visual damage comparison, free-test offer, clear explanation of local water conditions.',
    seasonal: null,
    note: 'Strongest documented Meta creative angle in the entire spec where local water hardness is evidenced (Utah).',
    splitReason: 'Meta carries relatively more of the budget here - softener demand usually has to be created with visual, water-hardness-driven content rather than captured from an active search.'
  },
  plumb_other: {
    offer: 'Service-specific - recommend gathering more detail before committing budget.',
    googleAngle: 'Generic plumbing terms until the specific service is known.',
    metaAngle: 'Generic plumbing awareness content until the specific service is known.',
    landingPage: 'Generic plumbing service page.',
    seasonal: null,
    splitReason: 'Google leads by a moderate margin as a general default - treat this split as a placeholder until the specific plumbing service is known.'
  },

  // ---- Other / generic archetypes ----
  other_emergency:   {
    offer: 'Fast-response guarantee, framed for the specific trade.', googleAngle: 'Own the "[service] near me" / emergency search terms.', metaAngle: 'Retargeting and brand-recall only.', landingPage: 'Phone-first, availability-forward.', seasonal: null,
    splitReason: 'Google should carry most of the budget - this reads as an emergency search, not a considered one.'
  },
  other_install:     {
    offer: 'Financing or bundled-package offer.', googleAngle: 'Considered-purchase search terms for the specific service.', metaAngle: 'Before/after creative, lookalike from past customers.', landingPage: 'Financing calculator, warranty, reviews.', seasonal: null,
    splitReason: 'Google and Meta both contribute meaningfully - this is a considered purchase, and Meta\'s before/after creative can influence the decision.'
  },
  other_hightick:    {
    offer: 'Financing-forward, large-project framing.', googleAngle: 'High-intent, considered-purchase terms.', metaAngle: 'Project showcase creative, strong lookalike targeting.', landingPage: 'Portfolio/before-after gallery, financing terms.', seasonal: null,
    splitReason: 'Google should lead - a high-ticket project is search-driven and compared across quotes, though Meta\'s project-showcase creative still earns a real share.'
  },
  other_maintenance: {
    offer: 'Low-commitment seasonal or recurring offer.', googleAngle: 'Long-tail, low-competition terms.', metaAngle: 'Calendar-driven seasonal push, membership framing if applicable.', landingPage: 'Simple, price-forward booking.', seasonal: null,
    splitReason: 'Meta carries relatively more of the budget here - low-commitment, seasonal demand usually has to be created rather than captured from search.'
  },
  other_local:       {
    offer: 'Generic local-service offer.', googleAngle: 'Local intent search terms.', metaAngle: 'Local awareness and retargeting.', landingPage: 'Standard local-service page.', seasonal: null,
    splitReason: 'Google and Meta both contribute meaningfully for a general local service - search leads, but Meta adds local awareness.'
  },
  other_visual:      {
    offer: 'Visually-led promotional offer.', googleAngle: 'Secondary to Meta for this archetype.', metaAngle: 'This is where Meta typically performs best of any archetype in this tool - lead with strong photo/video creative.', landingPage: 'Visual-gallery-forward page.', seasonal: null,
    note: 'Meta weighted higher than standard Band C - extrapolated from adjacent-trade evidence (landscaping/roofing), not this-archetype evidence.',
    splitReason: 'Meta should carry the larger share here - this is a visually-led, discretionary purchase, and Meta typically outperforms Google for this archetype.'
  },
  other_misc:        {
    offer: 'Not enough information to recommend a specific offer - treat all figures as rough order of magnitude.', googleAngle: 'Generic.', metaAngle: 'Generic.', landingPage: 'Generic.', seasonal: null,
    splitReason: 'Google leads by a moderate margin as a general default - there isn\'t enough information yet to recommend a more specific split.'
  }
};

export { STRATEGY_CONTENT };
