/**
 * Модуль для точного расчёта метрик текста с использованием opentype.js
 * Заменяет приближенные коэффициенты на реальные метрики из шрифтов
 */

import { parseLetterSpacing } from '../utils/text-utils.js';
import { parseStyleSegments, hasStyleMarkers } from '../processors/style-segments-parser.js';

/**
 * Регулярное выражение для определения emoji
 */
const EMOJI_REGEX = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u;

/**
 * Fallback коэффициент для расчёта ширины символа без загруженного шрифта
 * Основан на средней ширине символов в популярных пропорциональных шрифтах
 */
const FALLBACK_CHAR_WIDTH_COEFFICIENT = 0.5;

/**
 * Fallback коэффициент для расчёта ascent (высоты над базовой линией)
 * Основан на средних метриках популярных шрифтов (обычно ascent составляет ~0.8-0.9 от размера шрифта)
 */
const FALLBACK_ASCENT_COEFFICIENT = 0.85;

/**
 * Получает ширину одного символа используя метрики шрифта
 * 
 * @param {string} char - символ для измерения
 * @param {number} fontSize - размер шрифта в пикселях
 * @param {object|null} font - объект opentype.Font или null
 * @param {string|number} letterSpacing - межбуквенный интервал
 * @returns {number} ширина символа в пикселях
 */
export function getCharWidth(char, fontSize, font, letterSpacing) {
  const letterSpacingPx = parseLetterSpacing(letterSpacing, fontSize);
  
  // Emoji обрабатываем особым образом - их ширина обычно больше чем у обычных символов
  // Используем коэффициент 1.4 для более точного расчёта реальной ширины при отрисовке
  const isEmoji = EMOJI_REGEX.test(char);
  if (isEmoji) {
    return fontSize * 1.4 + letterSpacingPx;
  }
  
  // Если шрифт загружен, используем реальные метрики из opentype.js
  if (font && font.charToGlyph && font.unitsPerEm) {
    try {
      const glyph = font.charToGlyph(char);
      
      if (glyph && typeof glyph.advanceWidth === 'number') {
        // advanceWidth - это ширина глифа в font units
        // Конвертируем в пиксели: (advanceWidth / unitsPerEm) * fontSize
        const scale = fontSize / font.unitsPerEm;
        const charWidth = glyph.advanceWidth * scale;
        
        return charWidth + letterSpacingPx;
      }
    } catch (error) {
      // Если произошла ошибка при получении глифа, используем fallback
      console.warn(`Failed to get glyph for character "${char}":`, error.message);
    }
  }
  
  // Fallback: приближенный расчёт если шрифт не загружен или глиф не найден
  return getApproximateCharWidth(fontSize) + letterSpacingPx;
}

/**
 * Приближенный расчёт ширины символа без метрик шрифта
 * Используется как fallback когда шрифт не загружен или парсинг не удался
 * 
 * @param {number} fontSize - размер шрифта в пикселях
 * @returns {number} приближенная ширина символа
 */
export function getApproximateCharWidth(fontSize) {
  return fontSize * FALLBACK_CHAR_WIDTH_COEFFICIENT;
}

/**
 * Вычисляет точную ширину строки текста используя метрики шрифта
 * 
 * @param {string} text - текст для измерения
 * @param {number} fontSize - размер шрифта в пикселях
 * @param {object|null} font - объект opentype.Font или null
 * @param {string|number} letterSpacing - межбуквенный интервал
 * @returns {number} общая ширина текста в пикселях
 */
export function computeTextWidthPrecise(text, fontSize, font, letterSpacing) {
  if (!text || text.length === 0) {
    return 0;
  }
  
  // Разбиваем текст на массив символов (поддержка emoji и комбинированных символов)
  const chars = [...text];
  
  let totalWidth = 0;
  
  // Суммируем ширину каждого символа
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const charWidth = getCharWidth(char, fontSize, font, 0); // letterSpacing добавим отдельно
    totalWidth += charWidth;
  }
  
  // Добавляем letterSpacing между символами (не после последнего)
  if (chars.length > 1) {
    const letterSpacingPx = parseLetterSpacing(letterSpacing, fontSize);
    totalWidth += letterSpacingPx * (chars.length - 1);
  }
  
  return totalWidth;
}

/**
 * Вычисляет массив накопленных ширин для каждой позиции в тексте с учетом сегментов стилей
 * Используется для точного позиционирования курсора и анимации стирания
 * 
 * @param {string} text - текст для измерения (может содержать маркеры стилей)
 * @param {number} defaultFontSize - размер шрифта по умолчанию
 * @param {object|null} font - объект opentype.Font или null
 * @param {string|number} letterSpacing - межбуквенный интервал
 * @returns {Array<number>} массив накопленных ширин [0, width1, width1+width2, ...]
 */
export function getCharacterWidthsWithStyles(text, defaultFontSize, font, letterSpacing, fontsMap = null) {
  if (!text || text.length === 0) {
    return [0];
  }
  
  // Если нет маркеров стилей - используем обычный расчет
  if (!hasStyleMarkers(text)) {
    return getCharacterWidths(text, defaultFontSize, font, letterSpacing);
  }
  
  // Парсим сегменты стилей
  const segments = parseStyleSegments(text, '#000000');
  const widths = [0]; // Начинаем с 0
  let accumulated = 0;
  
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
    
    // Определяем letterSpacing для сегмента
    const segmentLetterSpacing = segment.styles?.letterSpacing || letterSpacing;
    const letterSpacingPx = parseLetterSpacing(segmentLetterSpacing, segmentFontSize);
    
    // Определяем font для сегмента (если указан fontFamily в стилях)
    let segmentFont = font;
    if (segment.styles?.fontFamily && fontsMap) {
      const segmentFontFamily = segment.styles.fontFamily;
      const normalizedSegmentFont = segmentFontFamily.split(',')[0].trim().replace(/["']/g, '').toLowerCase();
      segmentFont = fontsMap.get(normalizedSegmentFont) || font;
    }
    
    const chars = [...segment.text];
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const charWidth = getCharWidth(char, segmentFontSize, segmentFont, 0);
      
      accumulated += charWidth;
      
      // Добавляем letterSpacing после каждого символа кроме последнего
      if (i < chars.length - 1) {
        accumulated += letterSpacingPx;
      }
      
      widths.push(accumulated);
    }
  }
  
  return widths;
}

/**
 * Вычисляет массив накопленных ширин для каждой позиции в тексте
 * Используется для точного позиционирования курсора и анимации стирания
 * 
 * @param {string} text - текст для измерения
 * @param {number} fontSize - размер шрифта в пикселях
 * @param {object|null} font - объект opentype.Font или null
 * @param {string|number} letterSpacing - межбуквенный интервал
 * @returns {Array<number>} массив накопленных ширин [0, width1, width1+width2, ...]
 */
export function getCharacterWidths(text, fontSize, font, letterSpacing) {
  if (!text || text.length === 0) {
    return [0];
  }
  
  const chars = [...text];
  const widths = [0]; // Начинаем с 0
  const letterSpacingPx = parseLetterSpacing(letterSpacing, fontSize);
  
  let accumulated = 0;
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const charWidth = getCharWidth(char, fontSize, font, 0);
    
    accumulated += charWidth;
    
    // Добавляем letterSpacing после каждого символа кроме последнего
    if (i < chars.length - 1) {
      accumulated += letterSpacingPx;
    }
    
    widths.push(accumulated);
  }
  
  return widths;
}

/**
 * Вычисляет ширину оставшегося текста при стирании посимвольно
 * Используется в режиме стирания для точного расчёта анимации
 * 
 * @param {string} text - полный текст
 * @param {number} remainingChars - количество оставшихся символов
 * @param {number} fontSize - размер шрифта в пикселях
 * @param {object|null} font - объект opentype.Font или null
 * @param {string|number} letterSpacing - межбуквенный интервал
 * @returns {number} ширина оставшегося текста
 */
export function getRemainingTextWidth(text, remainingChars, fontSize, font, letterSpacing) {
  if (remainingChars <= 0) {
    return 0;
  }
  
  const chars = [...text];
  const charsToMeasure = chars.slice(0, remainingChars);
  const remainingText = charsToMeasure.join('');
  
  return computeTextWidthPrecise(remainingText, fontSize, font, letterSpacing);
}

/**
 * Получает ascent (высоту над базовой линией) шрифта в пикселях
 * Используется для корректного позиционирования текста при verticalAlign=top
 * 
 * @param {number} fontSize - размер шрифта в пикселях
 * @param {object|null} font - объект opentype.Font или null
 * @returns {number} ascent в пикселях
 */
export function getFontAscent(fontSize, font) {
  // Если шрифт загружен, используем реальные метрики из opentype.js
  if (font && typeof font.ascender === 'number' && font.unitsPerEm) {
    try {
      // ascender - это высота над базовой линией в font units
      // Конвертируем в пиксели: (ascender / unitsPerEm) * fontSize
      const scale = fontSize / font.unitsPerEm;
      const ascent = font.ascender * scale;
      
      return ascent;
    } catch (error) {
      // Если произошла ошибка, используем fallback
      console.warn('Failed to get font ascent:', error.message);
    }
  }
  
  // Fallback: приближенный расчёт если шрифт не загружен
  return fontSize * FALLBACK_ASCENT_COEFFICIENT;
}

