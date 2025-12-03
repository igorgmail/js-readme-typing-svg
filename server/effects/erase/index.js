/**
 * Фабрика для создания экземпляров режимов стирания
 */
import { FadeEraseMode } from './FadeEraseMode.js';
import { LineEraseMode } from './LineEraseMode.js';
import { NoneEraseMode } from './NoneEraseMode.js';

// Кэш экземпляров режимов (singleton pattern)
const eraseModeInstances = {
  fade: new FadeEraseMode(),
  line: new LineEraseMode(),
  none: new NoneEraseMode()
};

/**
 * Получает экземпляр режима стирания по имени
 * @param {string} modeName - название режима ('fade', 'line', 'none')
 * @returns {EraseMode} экземпляр режима стирания
 */
export function getEraseMode(modeName) {
  const mode = eraseModeInstances[modeName];
  if (!mode) {
    // По умолчанию используем 'line'
    return eraseModeInstances.line;
  }
  return mode;
}

/**
 * Получает доступные режимы стирания
 * @returns {string[]} массив названий режимов
 */
export function getAvailableEraseModes() {
  return Object.keys(eraseModeInstances);
}

