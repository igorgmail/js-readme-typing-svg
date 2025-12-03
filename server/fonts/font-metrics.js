/**
 * Модуль для точного расчёта метрик текста с использованием opentype.js
 * Заменяет приближенные коэффициенты на реальные метрики из шрифтов
 */

import { parseLetterSpacing } from '../utils/text-utils.js';

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
  
  // Emoji обрабатываем особым образом - их ширина примерно равна fontSize
  const isEmoji = EMOJI_REGEX.test(char);
  if (isEmoji) {
    return fontSize + letterSpacingPx;
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

