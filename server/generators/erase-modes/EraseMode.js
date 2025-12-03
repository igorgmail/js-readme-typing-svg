/**
 * Базовый класс для режимов стирания текста
 * Использует паттерн Strategy для различных типов анимации стирания
 */
export class EraseMode {
  /**
   * Вычисляет параметры анимации стирания для режима замены (replacing mode)
   * @param {Object} config - конфигурация анимации
   * @returns {Object} параметры анимации (useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues)
   */
  calculateReplacingMode(config) {
    throw new Error('calculateReplacingMode must be implemented');
  }
  
  /**
   * Вычисляет параметры анимации стирания для многострочного режима (multiline mode)
   * @param {Object} config - конфигурация анимации
   * @returns {Object} параметры анимации (useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues)
   */
  calculateMultiLineMode(config) {
    throw new Error('calculateMultiLineMode must be implemented');
  }
  
  /**
   * Вычисляет параметры анимации стирания для одной строки (single line mode)
   * @param {Object} config - конфигурация анимации
   * @returns {Object} параметры анимации (useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues)
   */
  calculateSingleLineMode(config) {
    throw new Error('calculateSingleLineMode must be implemented');
  }
}

