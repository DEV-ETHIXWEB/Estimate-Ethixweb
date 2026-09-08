# Forecast - HVAC & Plumbing Ad Budget Model

A budget forecasting tool for Google Ads + Meta Ads, built specifically for HVAC and
plumbing service lines, by Ethixweb. Built on a validated calculation engine
(7.6M+ automated checks across the full input space, 0 failures) - see
`scripts/validate.mjs`.

## Run locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Deploy to Vercel

**Option A - Vercel dashboard (easiest for sharing with a team):**
1. Push this repo to GitHub (already done if you're reading this from the repo).
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. Vercel auto-detects Vite - no configuration needed (a `vercel.json` is included
   anyway for clarity). Click **Deploy**.
4. Every push to the repo will auto-deploy a new version, and Vercel gives you a
   shareable preview URL per branch/PR - useful for showing teammates or clients
   a specific change before merging.

**Option B - Vercel CLI (fastest for a one-off deploy):**
```bash
npm install -g vercel
vercel
```
Follow the prompts. Running `vercel --prod` deploys to your production URL.

## What's in the app

- **Configure your forecast** - business type, service, market, Meta setup
  (Instant Lead Form vs. Landing Page), and a budget allocation selector
  (Recommended / Google only / Meta only / a custom 0-100% split via a
  log-scaled slider), plus the monthly budget itself (also a log-scaled
  slider, so small budgets stay easy to fine-tune on a 100x range).
- **Recommended plan** - the headline result: the active Google/Meta split as
  a meter (not a donut - a 2-category ratio reads faster as a bar), a
  one-sentence "why," and the expected ROAS/revenue range. Relabels to "Your
  plan" the moment the allocation is overridden away from the model's
  recommendation.
- **Google Ads / Meta Ads cards** - budget, leads, cost/booked job, revenue,
  ROAS per channel.
- **Lead-to-job funnel** - blended Leads -> Qualified -> Appointments ->
  Booked jobs as a compact chain, plus the end-to-end conversion rate.
- **Strategy for this service** - offer, Google angle, Meta angle, landing
  page guidance, and seasonal timing, per service.
- **How this forecast works** (collapsed by default) - full methodology:
  deal value range, modeled split, Google LSA/Search routing, Meta setup,
  location cost adjustment, the sourced close-rate endpoint, and a
  BENCHMARK/ESTIMATE/DERIVED_LOGIC/WEAK confidence tag on every figure.

Built mobile-first: a hamburger menu on phone-width screens, a log-scaled
drag slider tuned for touch, real vibration feedback on the sliders on
Android (there is no public web API for iOS's Taptic Engine, so this is a
platform-level no-op on iPhone, not a bug), and safe-area-aware layout for
notched devices.

## Project structure

```
src/
  lib/
    config.js           - the locked v1 data specification (bands, services,
                           channel benchmarks, location tiers). Pure data,
                           never edited by anything in this app's UI layer.
    engine.js            - pure calculation functions. No UI, no hardcoded
                           numbers - everything traces back to config.js.
                           computeServiceForecast() takes an optional
                           googleSplitOverride (0-1) for the allocation
                           selector; omitting it runs the original,
                           validated recommendation model unchanged.
    strategyContent.js   - per-service strategy copy (offer/Google angle/
                           Meta angle/landing page/seasonal/splitReason).
                           Pure content, no numbers.
    uiLabels.js          - presentation-only label overrides (e.g. "Landing
                           page" instead of config's internal label) so
                           wording preferences never touch config.js.
    haptics.js           - feature-detected, try/caught vibration feedback
                           for the sliders (Android; no-op on iOS/desktop).
    theme.js / ThemeContext.jsx - shared color tokens + the dark/light
                           toggle (defaults to dark, persisted to
                           localStorage, independent of OS preference).
  components/            - presentational React components. None of them
                           contain calculation logic - they call
                           computeServiceForecast() from engine.js and
                           render the result.
  App.jsx                - wires state (category/service/location/budget/
                           conversion type/allocation) to the engine and
                           passes results down to components.
public/
  favicon.svg            - the primary icon (adapts to light/dark via an
                           embedded media query); favicon.ico/.png and
                           apple-touch-icon.png are the fallback set.
scripts/
  validate.mjs           - the full test suite: config schema checks,
                           stage-split back-solve validation, an exhaustive
                           cross-product over every service x location x
                           Meta setup x allocation mode x a wide budget
                           sweep (budget conservation, funnel narrowing,
                           revenue reconciliation, no NaN/negative anywhere),
                           full-grid monotonicity checks, and a consistency
                           check that every strategy "why" sentence agrees
                           with its service's actual modeled split. Run with
                           `npm run validate` after changing anything in
                           `src/lib/`.
```

## Updating the underlying data/assumptions

Every number in this tool lives in `src/lib/config.js`, tagged as one of:
- **BENCHMARK** - reported by a named source
- **ESTIMATE** - reasoned from benchmarks
- **DERIVED_LOGIC** - our own construction (e.g., every Google/Meta budget split)
- **WEAK** - thin/generic evidence (mainly the "Other" archetypes)

If you update a number in `config.js`, run `npm run validate` before shipping -
it exhaustively checks that the model still holds together (budget conservation,
a funnel that only narrows, no service/location/budget/allocation combination
producing a NaN or a nonsensical ROAS, diminishing returns never inverting, and
so on) across the full input space, not a handful of samples.

## Known scope

- 16 HVAC + Plumbing services, plus a generic "Other" archetype system for
  everything else (23 services total).
- 4 evidence-backed markets (Seattle/Western WA, Utah/Wasatch Front, Colorado
  Springs, Portland/Oregon) plus 3 fallback market tiers for anywhere else.
- Location cost multipliers are explicitly provisional parameters, not
  validated facts - see the in-app "How this forecast works" panel.
- These are directional planning estimates synthesized from third-party
  industry research, not measurements from this tool's own ad spend - treat
  the confidence tag on each figure as a guide to how much weight to put on it.
