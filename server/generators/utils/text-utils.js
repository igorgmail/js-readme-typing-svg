/**
 * Утилиты для работы с текстом и вычислений размеров
 */

/**
 * Экранирование спецсимволов для XML/SVG
 */
export function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Валидирует и санитизирует значение font-family для использования в SVG
 * @param {string} fontFamily - значение font-family от пользователя
 * @returns {string} валидное значение font-family для SVG атрибута
 */
export function validateAndSanitizeFontFamily(fontFamily) {
  if (!fontFamily || typeof fontFamily !== 'string') {
    return 'monospace';
  }
  
  const trimmed = fontFamily.trim();
  if (!trimmed) {
    return 'monospace';
  }
  
  // Проверяем на наличие опасных символов, которые могут сломать XML
  if (/[<>&]/.test(trimmed)) {
    return 'monospace';
  }
  
  // Экранируем кавычки для безопасного использования в XML атрибуте
  const sanitized = trimmed
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  
  return sanitized;
}

/**
 * Обрабатывает background цвет для SVG
 * @param {string} background - цвет фона (transparent, hex, hexa)
 * @returns {{fill: string, style: string}} объект с fill и style атрибутами
 */
export function processBackground(background) {
  if (background === 'transparent') {
    return { fill: 'none', style: '' };
  }
  
  const hexWithoutHash = background.startsWith('#') ? background.substr(1) : background;
  
  // Если это hexa формат (8 символов), используем style с background-color
  if (hexWithoutHash.length === 8) {
    const hexaColor = background.startsWith('#') ? background : '#' + background;
    return { fill: 'none', style: `style="background-color: ${hexaColor};"` };
  }
  
  // Для обычного hex формата используем fill
  const hexColor = background.startsWith('#') ? background : '#' + background;
  return { fill: hexColor, style: '' };
}

/**
 * Парсит значение letterSpacing в пиксели
 * @param {string|number} letterSpacing - значение letter-spacing ('normal', '10px', '0.1em', или число)
 * @param {number} fontSize - размер шрифта (для конвертации em в px)
 * @returns {number} значение в пикселях
 */
export function parseLetterSpacing(letterSpacing, fontSize) {
  if (typeof letterSpacing === 'number') {
    return letterSpacing;
  }
  if (letterSpacing === 'normal' || !letterSpacing) {
    return 0;
  }
  const str = String(letterSpacing).trim();
  if (str.endsWith('px')) {
    return parseFloat(str) || 0;
  }
  if (str.endsWith('em')) {
    return (parseFloat(str) || 0) * fontSize;
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Вычисляет приблизительную ширину текста
 * @param {string} text - текст
 * @param {number} fontSize - размер шрифта
 * @param {string|number} letterSpacing - расстояние между символами
 * @returns {number} ширина текста
 */
export function computeTextWidth(text, fontSize, letterSpacing) {
  const charWidth = fontSize * 0.6; // примерная ширина символа в monospace
  const spacing = parseLetterSpacing(letterSpacing, fontSize);
  return text.length * charWidth + (text.length > 0 ? (text.length - 1) * spacing : 0);
}

/**
 * Вычисляет позицию X для текста в зависимости от выравнивания
 * @param {string} text - текст
 * @param {number} fontSize - размер шрифта
 * @param {string} horizontalAlign - выравнивание (left, center, right)
 * @param {number} width - ширина SVG
 * @param {number} paddingX - горизонтальный отступ
 * @param {string|number} letterSpacing - расстояние между символами
 * @returns {number} позиция X
 */
export function computeTextX(text, fontSize, horizontalAlign, width, paddingX, letterSpacing) {
  const textWidth = computeTextWidth(text, fontSize, letterSpacing);
  
  if (horizontalAlign === 'left') return paddingX;
  if (horizontalAlign === 'right') return width - paddingX - textWidth;
  return (width - textWidth) / 2; // center
}

/**
 * Форматирует letterSpacing для использования в SVG
 * @param {string|number} letterSpacing - значение letter-spacing
 * @returns {string} форматированное значение для SVG атрибута
 */
export function formatLetterSpacingForSVG(letterSpacing) {
  return typeof letterSpacing === 'number' 
    ? `${letterSpacing}px` 
    : (letterSpacing || 'normal');
}

