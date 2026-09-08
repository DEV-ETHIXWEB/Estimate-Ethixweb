/**
 * haptics.js - best-effort tactile feedback for slider drags.
 * --------------------------------------------------------------
 * Important platform reality, stated plainly rather than papered over:
 * there is no public web API for iOS's Taptic Engine. Apple has never
 * implemented the Vibration API in Safari/WebKit on iOS, on ANY browser
 * (Chrome/Firefox/Edge on iOS are all WebKit under the hood, so this
 * applies to every browser on an iPhone/iPad, not just Safari) - a website
 * cannot trigger a haptic tap on iOS, and there is no workaround at the
 * web-platform level today. This is a platform limitation, not a bug here.
 *
 * What the web actually offers is the Vibration API (navigator.vibrate),
 * which Android's Chrome and other Chromium-based browsers implement and
 * which does drive the real vibration motor - so this module gives real
 * tactile feedback on Android, and is a silent, harmless no-op everywhere
 * that doesn't support it (iOS, desktop, embedded contexts that block it).
 * Every call is feature-detected and try/caught so it can never throw or
 * interrupt the slider interaction it's attached to.
 */

let lastTick = 0;

/**
 * Fire one short tactile pulse. Call this only when a value actually
 * crosses to a new, user-perceptible step (see Controls.jsx) - not on
 * every pixel of drag - so it reads as one tick per step, the same feel
 * as a native picker/slider detent, rather than a constant buzz.
 */
function hapticTick(durationMs = 8) {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    // A fast drag can call this many times per second; without a floor a
    // burst of near-simultaneous vibrate() calls just blurs into one
    // continuous buzz instead of discrete ticks (and needlessly spins the
    // motor). ~1 tick per animation frame is the practical ceiling for
    // still feeling like distinct pulses.
    const now = Date.now();
    if (now - lastTick < 16) return;
    lastTick = now;
    navigator.vibrate(durationMs);
  } catch {
    // Some embedded/locked-down contexts (e.g. an iframe without the
    // "vibrate" permissions-policy feature) throw here - a feedback nicety
    // must never be able to break the actual control it's attached to.
  }
}

export { hapticTick };
