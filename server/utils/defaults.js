/**
 * Дефолтные значения параметров для генераторов SVG
 */

export const DEFAULT_PARAMS = {
  // lines может быть строкой или массивом
  // Если строка - будет распарсена в params-parser
  // Если массив - используется как есть
  lines: 'Add ?lines=Your+text+here',
  color: '000000',
  background: 'transparent',
  fontSize: 16,
  fontWeight: 800,
  lineHeight: 1.35,

  width: 800,
  height: 200,

  printSpeed: 80,
  eraseSpeed: 50,

  delayAfterBlockPrint: 800,
  delayAfterErase: 500,

  repeat: false,

  paddingX: 16,
  paddingY: 20,
  verticalAlign: 'top',
  horizontalAlign: 'left',
  multiLine: false,
  typingMode: 'expand',
  eraseMode: 'line',
  showCaret: true
};

/**
 * Применяет дефолтные значения к переданным параметрам
 * @param {Object} params - параметры от пользователя (после парсинга)
 * @returns {Object} параметры с примененными дефолтами
 */
export function applyDefaults(params) {
  const result = {
    ...DEFAULT_PARAMS,
    ...params
  };
  
  // Если lines не передан или пустой массив - используем дефолт
  if (!params.lines || (Array.isArray(params.lines) && params.lines.length === 0)) {
    // Парсим дефолтную строку в массив
    result.lines = typeof DEFAULT_PARAMS.lines === 'string' 
      ? DEFAULT_PARAMS.lines.split(';').map(l => l.trim()).filter(l => l)
      : DEFAULT_PARAMS.lines;
  }
  
  return result;
}

