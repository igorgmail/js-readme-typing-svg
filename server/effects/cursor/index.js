/**
 * Cursor types configuration
 */
export const CURSOR_OPTIONS = {
  none: {
    value: 'none',
    label: 'None',
    icon: '',
  },
  straight: {
    value: 'straight',
    label: 'Straight',
    icon: '|',
  },
  underlined: {
    value: 'underlined',
    label: 'Underlined',
    icon: '_',
  },
  block: {
    value: 'block',
    label: 'Block',
    icon: '█',
  },
  emoji: {
    value: 'emoji',
    label: 'Emoji 🔥',
    icon: '🔥',
  },
  custom: {
    value: 'custom',
    label: 'Custom',
    // For custom, keep SVG icon as string for now.
    // In current generator it's not used directly.
    icon: '👀',
    // icon: '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 0L100 100H0L50 0Z" fill="currentColor" /></svg>',
  },
};

/**
 * Parameter values when cursor should disappear
 * after animation completes (reaching end of lines)
 */
const hideWhenFinished = [
  {
    repeat: false,
  },
];

/**
 * Parameter values when cursor display is allowed
 * (typing simulation + supported erase modes)
 */
const allowOptions = [
  {
    eraseMode: 'line',
  },
];

/**
 * Gets cursor type information
 * @param {string} cursorStyle - cursor type
 * @returns {Object} cursor information
 */
export function getCursorInfo(cursorStyle) {
  return CURSOR_OPTIONS[cursorStyle] || CURSOR_OPTIONS.none;
}

/**
 * Checks if cursor display is allowed for given parameters
 * @param {Object} params - normalized generator parameters
 * @returns {boolean}
 */
export function isCursorAllowed(params) {
  if (!params || !params.cursorStyle || params.cursorStyle === 'none') {
    return false;
  }

  return allowOptions.some((rule) =>
    Object.entries(rule).every(([key, value]) => params[key] === value),
  );
}

/**
 * Checks if cursor should be hidden after animation completes
 * @param {Object} params - normalized generator parameters
 * @returns {boolean}
 */
export function shouldHideCursorWhenFinished(params) {
  if (!params) {
    return false;
  }

  return hideWhenFinished.some((rule) =>
    Object.entries(rule).every(([key, value]) => params[key] === value),
  );
}

