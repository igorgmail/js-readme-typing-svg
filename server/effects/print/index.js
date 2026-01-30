/**
 * Factory for creating print mode instances
 * 
 * TODO: Add imports and registration of new print modes
 */

// import { TypewriterPrintMode } from './TypewriterPrintMode.js';
// import { WordPrintMode } from './WordPrintMode.js';
// import { InstantPrintMode } from './InstantPrintMode.js';
// import { FadeInPrintMode } from './FadeInPrintMode.js';

// Cache of mode instances (singleton pattern)
const printModeInstances = {
  // typewriter: new TypewriterPrintMode(),
  // word: new WordPrintMode(),
  // instant: new InstantPrintMode(),
  // fadein: new FadeInPrintMode()
};

/**
 * Gets print mode instance by name
 * @param {string} modeName - mode name
 * @returns {PrintMode} print mode instance
 */
export function getPrintMode(modeName) {
  const mode = printModeInstances[modeName];
  if (!mode) {
    // TODO: Return typewriter mode as default
    return null;
  }
  return mode;
}

/**
 * Gets available print modes
 * @returns {string[]} array of mode names
 */
export function getAvailablePrintModes() {
  return Object.keys(printModeInstances);
}

