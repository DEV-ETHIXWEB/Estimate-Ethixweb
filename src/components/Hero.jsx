import { motion } from 'motion/react';
import RocketIcon from './icons/RocketIcon.jsx';
import ArrowDownIcon from './icons/ArrowDownIcon.jsx';
import ethixwebLogo from '../assets/ethixweb-wordmark.png';

function scrollToCalculator() {
  document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 14, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export default function Hero() {
  return (
    <section className="hero" id="hero">
      <motion.div
        className="hero-content"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div className="hero-badge" variants={item}>
          <span className="hero-badge-name">Forecast</span>
          <span className="hero-badge-divider" aria-hidden="true" />
          <span className="hero-badge-by">by</span>
          <img src={ethixwebLogo} alt="Ethixweb" className="hero-badge-logo" />
        </motion.div>
        <motion.h1 variants={item}>
          Know what your ad budget buys
          {/* Break only where clause 1 already fits its own line (tablet/desktop) -
              on narrow phones this collapses so both clauses wrap and balance
              together instead of forcing a short, orphaned middle line. */}
          <br className="hero-break" />
          <span className="hero-h1-tail"> before you spend it.</span>
        </motion.h1>
        <motion.p className="hero-sub" variants={item}>One model for Google and Meta, built for HVAC and plumbing specifically.</motion.p>

        <motion.button className="hero-cta" variants={item} onClick={scrollToCalculator}>
          <RocketIcon size={18} />
          Run the model
        </motion.button>

        <motion.div className="hero-stats" variants={item}>
          <div className="hero-stat"><div className="hero-stat-num">16</div><div className="hero-stat-lbl">services modeled</div></div>
          <div className="hero-stat"><div className="hero-stat-num">7.6M+</div><div className="hero-stat-lbl">validated calculations</div></div>
          <div className="hero-stat"><div className="hero-stat-num">2</div><div className="hero-stat-lbl">channels, one budget</div></div>
        </motion.div>
      </motion.div>

      <motion.button
        className="scroll-cue" onClick={scrollToCalculator} aria-label="Scroll to calculator"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.7 }}
      >
        <ArrowDownIcon size={20} className="scroll-cue-icon" />
      </motion.button>
    </section>
  );
}
