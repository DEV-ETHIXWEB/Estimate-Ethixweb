/**
 * uiLabels.js - presentation-only display-text overrides.
 * ---------------------------------------------------------
 * config.js stays the single source of truth for CONVERSION_LOCATIONS (and
 * everything else) - its keys, structure, and the values engine.js reads
 * are untouched. This module only renames a couple of labels for display,
 * so a wording preference in the UI never risks touching calculation logic.
 */

const CONVERSION_LOCATION_DISPLAY = {
  form: 'Instant Lead Form',
  landing: 'Landing page',
  meta_form: 'Instant Lead Form',
  meta_landing: 'Landing page'
};

// Accepts either the state key ('form' | 'landing') or the engine's channel
// key ('meta_form' | 'meta_landing') - callers use whichever they already have.
function conversionLocationLabel(key) {
  return CONVERSION_LOCATION_DISPLAY[key] || key;
}

export { conversionLocationLabel };
