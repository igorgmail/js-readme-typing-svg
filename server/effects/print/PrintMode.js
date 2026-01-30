/**
 * Base class for text print modes
 * Uses Strategy pattern for different types of print animation
 * 
 * TODO: Add implementations of various print modes:
 * - TypewriterPrintMode (prints character by character)
 * - WordPrintMode (prints word by word)
 * - InstantPrintMode (instant appearance)
 * - FadeInPrintMode (appearance through fade-in)
 */
export class PrintMode {
  /**
   * Calculates print animation parameters
   * @param {Object} config - animation configuration
   * @returns {Object} animation parameters
   */
  calculateAnimation(config) {
    throw new Error('calculateAnimation must be implemented');
  }
}

