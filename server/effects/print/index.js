/**
 * Фабрика для создания экземпляров режимов печати
 * 
 * TODO: Добавить импорты и регистрацию новых режимов печати
 */

// import { TypewriterPrintMode } from './TypewriterPrintMode.js';
// import { WordPrintMode } from './WordPrintMode.js';
// import { InstantPrintMode } from './InstantPrintMode.js';
// import { FadeInPrintMode } from './FadeInPrintMode.js';

// Кэш экземпляров режимов (singleton pattern)
const printModeInstances = {
  // typewriter: new TypewriterPrintMode(),
  // word: new WordPrintMode(),
  // instant: new InstantPrintMode(),
  // fadein: new FadeInPrintMode()
};

/**
 * Получает экземпляр режима печати по имени
 * @param {string} modeName - название режима
 * @returns {PrintMode} экземпляр режима печати
 */
export function getPrintMode(modeName) {
  const mode = printModeInstances[modeName];
  if (!mode) {
    // TODO: По умолчанию возвращать typewriter mode
    return null;
  }
  return mode;
}

/**
 * Получает доступные режимы печати
 * @returns {string[]} массив названий режимов
 */
export function getAvailablePrintModes() {
  return Object.keys(printModeInstances);
}

