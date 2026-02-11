/**
 * Module for loading default values from server
 * 
 * Defaults are loaded from API endpoint /api/defaults once during initialization.
 * If API is unavailable, hardcoded fallback values are used.
 */

/**
 * Fallback defaults (used if API is unavailable)
 * Synchronized with server/config/defaults.js
 */
const FALLBACK_DEFAULTS = {
  lines: 'You text here\n' +
    '$STYLE{text:\'H\', color:FFB84CFF}' +
    '$STYLE{text:\'e\', color: F266AB}' +
    '$STYLE{text:\'ll\', color: A459D1}' +
    '$STYLE{text:\'o\', color: 2CD3E1}',
  color: '6F08FF',
  background: 'FFFFFF',
  fontSize: 48,
  fontWeight: 800,
  fontFamily: 'Roboto',
  letterSpacing: 0,

  width: 800,
  height: 100,

  // printSpeed and eraseSpeed - characters per second
  printSpeed: 10,
  eraseSpeed: 10,

  delayBetweenLines: 800,

  repeat: true,
  verticalAlign: 'middle',
  horizontalAlign: 'center',

  multiLine: true,
  eraseMode: 'line', // none | line | fade
  cursorStyle: 'none' // none | straight | underlined | block
};

let cachedDefaults = null;

/**
 * Loads default parameters from server
 * @returns {Promise<Object>} default parameters
 */
export async function fetchDefaults() {
  if (cachedDefaults) {
    return cachedDefaults;
  }

  try {
    const response = await fetch('/api/defaults', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      // 3 second timeout
      signal: AbortSignal.timeout(3000)
    });

    if (!response.ok) {
      console.warn('Failed to fetch defaults from API, using fallback');
      cachedDefaults = FALLBACK_DEFAULTS;
      return cachedDefaults;
    }

    const defaults = await response.json();
    cachedDefaults = defaults;
    return defaults;
  } catch (error) {
    console.warn('Error fetching defaults, using fallback:', error.message);
    cachedDefaults = FALLBACK_DEFAULTS;
    return cachedDefaults;
  }
}

/**
 * Synchronous access to defaults (returns fallback before loading)
 * @deprecated Use fetchDefaults() for guaranteed up-to-date data
 */
export const DEFAULT_PARAMS = cachedDefaults || FALLBACK_DEFAULTS;
