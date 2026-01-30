/**
 * Base class for text erase modes
 * Uses Strategy pattern for different types of erase animation
 */
export class EraseMode {
  /**
   * Calculates erase animation parameters for replacing mode
   * @param {Object} config - animation configuration
   * @returns {Object} animation parameters (useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues)
   */
  calculateReplacingMode(config) {
    throw new Error('calculateReplacingMode must be implemented');
  }
  
  /**
   * Calculates erase animation parameters for multiline mode
   * @param {Object} config - animation configuration
   * @returns {Object} animation parameters (useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues)
   */
  calculateMultiLineMode(config) {
    throw new Error('calculateMultiLineMode must be implemented');
  }
  
  /**
   * Calculates erase animation parameters for single line mode
   * @param {Object} config - animation configuration
   * @returns {Object} animation parameters (useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues)
   */
  calculateSingleLineMode(config) {
    throw new Error('calculateSingleLineMode must be implemented');
  }
}

