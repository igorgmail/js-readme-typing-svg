/**
 * Дефолтные значения параметров для генератора SVG
 * 
 * ⚠️ ВАЖНО: Эти значения должны быть синхронизированы с server/utils/defaults.js
 * При изменении дефолтов здесь - обязательно обновите их и на сервере!
 * Для проверки синхронизации используйте: npm run check:defaults
 */

export const DEFAULT_PARAMS = {
  lines: 'Your text here',
  color: '000000',
  background: 'transparent',
  fontSize: 16,
  fontWeight: 800,
  fontFamily: 'monospace',
  lineHeight: 1.35,
  letterSpacing: 10,

  width: 800,
  height: 200,

  printSpeed: 1000,
  eraseSpeed: 50,

  delayBetweenLines: 800,

  repeat: false,
  verticalAlign: 'top',
  horizontalAlign: 'left',

  multiLine: false,
  eraseMode: 'line', // none | line | fade
  cursorStyle: 'none' // none | straight | underlined | block
};

