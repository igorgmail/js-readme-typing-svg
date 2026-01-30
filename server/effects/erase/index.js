/**
 * Factory for creating erase mode instances
 */
import { FadeEraseMode } from './FadeEraseMode.js';
import { LineEraseMode } from './LineEraseMode.js';
import { NoneEraseMode } from './NoneEraseMode.js';

// Cache of mode instances (singleton pattern)
const eraseModeInstances = {
  fade: new FadeEraseMode(),
  line: new LineEraseMode(),
  none: new NoneEraseMode()
};

/**
 * Gets erase mode instance by name
 * @param {string} modeName - mode name ('fade', 'line', 'none')
 * @returns {EraseMode} erase mode instance
 */
export function getEraseMode(modeName) {
  const mode = eraseModeInstances[modeName];
  if (!mode) {
    // Use 'line' as default
    return eraseModeInstances.line;
  }
  return mode;
}

/**
 * Gets available erase modes
 * @returns {string[]} array of mode names
 */
export function getAvailableEraseModes() {
  return Object.keys(eraseModeInstances);
}

