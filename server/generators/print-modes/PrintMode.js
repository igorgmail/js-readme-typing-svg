/**
 * Базовый класс для режимов печати текста
 * Использует паттерн Strategy для различных типов анимации печати
 * 
 * TODO: Добавить реализации различных режимов печати:
 * - TypewriterPrintMode (печатает символ за символом)
 * - WordPrintMode (печатает слово за словом)
 * - InstantPrintMode (мгновенное появление)
 * - FadeInPrintMode (появление через затухание)
 */
export class PrintMode {
  /**
   * Вычисляет параметры анимации печати
   * @param {Object} config - конфигурация анимации
   * @returns {Object} параметры анимации
   */
  calculateAnimation(config) {
    throw new Error('calculateAnimation must be implemented');
  }
}

