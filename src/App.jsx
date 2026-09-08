import { useState, useMemo } from 'react';
import * as C from './lib/config.js';
import * as E from './lib/engine.js';
import { STRATEGY_CONTENT } from './lib/strategyContent.js';
import { ThemeProvider } from './lib/ThemeContext.jsx';

import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Reveal from './components/Reveal.jsx';
import Controls from './components/Controls.jsx';
import RecommendedPlan from './components/RecommendedPlan.jsx';
import FunnelChart from './components/FunnelChart.jsx';
import ChannelCards from './components/ChannelCards.jsx';
import Methodology from './components/Methodology.jsx';
import Strategy from './components/Strategy.jsx';

function Calculator() {
  const [state, setState] = useState({
    category: 'hvac', serviceKey: 'hvac_emergency_ac',
    locationKey: 'seattle_wa', budget: 3000, conv: 'landing',
    // Budget allocation: 'recommended' (default, matches the modeled split),
    // 'google' (100/0), 'meta' (0/100), or 'custom' (customGooglePct/rest).
    // customGooglePct is seeded from the recommended split the first time
    // someone switches to Custom (see Controls.jsx), then left alone.
    allocationMode: 'recommended', customGooglePct: null,
  });

  const svcDef = E.resolveService(state.serviceKey);
  const recommendedGoogleSplit = (svcDef.splitGoogle[0] + svcDef.splitGoogle[1]) / 2;

  // The one functional addition engine.js gained for this: googleSplitOverride.
  // 'recommended' passes nothing through, so computeServiceForecast runs its
  // original, validated default path unchanged - override only ever applies
  // when the person explicitly picks Google-only / Meta-only / a custom %.
  const googleSplitOverride =
    state.allocationMode === 'google' ? 1 :
    state.allocationMode === 'meta' ? 0 :
    state.allocationMode === 'custom' ? (state.customGooglePct ?? Math.round(recommendedGoogleSplit * 100)) / 100 :
    undefined;

  const result = useMemo(() => E.computeServiceForecast({
    serviceKey: state.serviceKey, budgetTotal: state.budget,
    locationKey: state.locationKey, conversionLocationKey: state.conv,
    googleSplitOverride,
  }), [state.serviceKey, state.budget, state.locationKey, state.conv, googleSplitOverride]);

  const strat = STRATEGY_CONTENT[state.serviceKey] || {};
  const loc = C.LOCATIONS[state.locationKey];
  const dealValueInfo = E.resolveLocationAndDealValue(state.locationKey, svcDef).dealValueRangeObj;

  const b = result.blended, g = result.google.total, m = result.meta.funnel;
  const isOverridden = state.allocationMode !== 'recommended';
  const activeGooglePct = Math.round(result.activeSplitGoogle * 100);

  return (
    <main className="main" id="calculator">
      <Reveal>
        <Controls state={state} setState={setState} recommendedGoogleSplit={recommendedGoogleSplit} />
      </Reveal>

      {result.band === 'A' && (
        <Reveal delay={0.05}>
          <div className="warning">
            <strong>Weak fit for Meta.</strong> This is an emergency / demand-capture service - Google and Local Services Ads should carry most of the budget. The Meta figures below are shown for comparison, not as a recommendation to lead with Meta spend here.
          </div>
        </Reveal>
      )}

      <Reveal delay={0.05}>
        <RecommendedPlan
          isOverridden={isOverridden} googlePct={activeGooglePct}
          roas={b.roas} revenue={b.revenue} reason={strat.splitReason}
        />
      </Reveal>

      <Reveal>
        <ChannelCards google={g} meta={m} googlePct={activeGooglePct} />
      </Reveal>

      <Reveal>
        <FunnelChart
          leads={b.leads.mid} qualified={b.qualifiedLeads.mid} appointments={b.appointments.mid} booked={b.bookedJobs.mid}
        />
      </Reveal>

      <Reveal>
        <div id="strategy"><Strategy strat={strat} /></div>
      </Reveal>

      <Reveal>
        <div id="methodology">
          <Methodology result={result} loc={loc} dealValueInfo={dealValueInfo} splitGoogleRange={result.splitGoogleRange} />
        </div>
      </Reveal>
    </main>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <div className="app">
        <Navbar />
        <Hero />
        <Calculator />
        <footer className="site-footer">
          Figures are directional planning estimates synthesized from third-party industry research - always range and midpoint, never false precision.
        </footer>
      </div>
    </ThemeProvider>
  );
}
