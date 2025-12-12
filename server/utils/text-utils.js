/**
 * Утилиты для работы с текстом и вычислений размеров
 */

import { computeTextWidthPrecise, getApproximateCharWidth } from '../fonts/font-metrics.js';
import { parseStyleSegments, hasStyleMarkers } from '../processors/style-segments-parser.js';

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
 * Вычисляет ширину текста с учетом сегментов стилей (разные fontSize и fontFamily)
 * @param {string} text - текст с маркерами стилей
 * @param {number} defaultFontSize - размер шрифта по умолчанию
 * @param {string|number} letterSpacing - расстояние между символами
 * @param {string} fontFamily - семейство шрифта (для логирования)
 * @param {object|null} parsedFont - объект opentype.Font или null (основной шрифт)
 * @param {Map<string, object>|null} fontsMap - карта fontFamily -> parsedFont для шрифтов из стилей
 * @returns {number} ширина текста
 */
export function computeTextWidthWithStyles(text, defaultFontSize, letterSpacing, fontFamily, parsedFont, fontsMap = null) {
  if (!text || text.length === 0) {
    return 0;
  }
  
  // Если нет маркеров стилей - используем обычный расчет
  if (!hasStyleMarkers(text)) {
    return computeTextWidth(text, defaultFontSize, letterSpacing, fontFamily, parsedFont);
  }
  
  // Парсим сегменты стилей
  const segments = parseStyleSegments(text, '#000000');
  let totalWidth = 0;
  
  for (const segment of segments) {
    // Определяем fontSize для сегмента
    let segmentFontSize = defaultFontSize;
    if (segment.styles?.fontSize) {
      const fontSizeValue = segment.styles.fontSize;
      // Поддерживаем разные форматы: число, строка с "px", просто число
      const parsed = typeof fontSizeValue === 'number' 
        ? fontSizeValue 
        : parseFloat(String(fontSizeValue).replace(/px$/i, ''));
      if (!isNaN(parsed) && parsed > 0) {
        segmentFontSize = parsed;
      }
    }
    
    // Определяем letterSpacing для сегмента (если указан в стилях)
    const segmentLetterSpacing = segment.styles?.letterSpacing || letterSpacing;
    
    // Определяем parsedFont для сегмента (если указан fontFamily в стилях)
    let segmentParsedFont = parsedFont;
    if (segment.styles?.fontFamily && fontsMap) {
      const segmentFontFamily = segment.styles.fontFamily;
      const normalizedSegmentFont = segmentFontFamily.split(',')[0].trim().replace(/["']/g, '').toLowerCase();
      segmentParsedFont = fontsMap.get(normalizedSegmentFont) || parsedFont;
    }
    
    // Вычисляем ширину сегмента
    if (segmentParsedFont) {
      totalWidth += computeTextWidthPrecise(segment.text, segmentFontSize, segmentParsedFont, segmentLetterSpacing);
    } else {
      const chars = [...segment.text];
      const spacing = parseLetterSpacing(segmentLetterSpacing, segmentFontSize);
      const charWidth = getApproximateCharWidth(segmentFontSize);
      totalWidth += chars.length * charWidth + (chars.length > 1 ? (chars.length - 1) * spacing : 0);
    }
  }
  
  return totalWidth;
}

/**
 * Вычисляет ширину текста используя точные метрики шрифта или fallback
 * @param {string} text - текст
 * @param {number} fontSize - размер шрифта
 * @param {string|number} letterSpacing - расстояние между символами
 * @param {string} fontFamily - семейство шрифта (для логирования)
 * @param {object|null} parsedFont - объект opentype.Font или null
 * @returns {number} ширина текста
 */
export function computeTextWidth(text, fontSize, letterSpacing, fontFamily, parsedFont) {
  if (!text || text.length === 0) {
    return 0;
  }
  
  // Если шрифт загружен и распарсен, используем точные метрики
  if (parsedFont) {
    return computeTextWidthPrecise(text, fontSize, parsedFont, letterSpacing);
  }
  
  // Fallback: приближенный расчёт если шрифт не загружен
  const chars = [...text];
  const spacing = parseLetterSpacing(letterSpacing, fontSize);
  const charWidth = getApproximateCharWidth(fontSize);
  
  return chars.length * charWidth + (chars.length > 1 ? (chars.length - 1) * spacing : 0);
}

/**
 * Вычисляет позицию X для текста в зависимости от выравнивания
 * @param {string} text - текст (может содержать маркеры стилей)
 * @param {number} fontSize - размер шрифта по умолчанию
 * @param {string} horizontalAlign - выравнивание (left, center, right)
 * @param {number} width - ширина SVG
 * @param {number} paddingX - горизонтальный отступ
 * @param {string|number} letterSpacing - расстояние между символами
 * @param {string} fontFamily - семейство шрифта (для логирования)
 * @param {object|null} parsedFont - объект opentype.Font или null
 * @returns {number} позиция X
 */
export function computeTextX(text, fontSize, horizontalAlign, width, paddingX, letterSpacing, fontFamily, parsedFont, fontsMap = null) {
  // Используем функцию с учетом стилей, если есть маркеры
  const textWidth = hasStyleMarkers(text)
    ? computeTextWidthWithStyles(text, fontSize, letterSpacing, fontFamily, parsedFont, fontsMap)
    : computeTextWidth(text, fontSize, letterSpacing, fontFamily, parsedFont);
  
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

