/**
 * Генератор SVG с SMIL анимацией эффекта печатающегося текста
 * 
 * Координирует работу модулей:
 * - text-utils: утилиты для работы с текстом
 * - svg-template: рендеринг SVG шаблона
 * - erase-modes: стратегии стирания текста
 * - animation-calculator: вычисление параметров анимации
 */

import { parseLines } from '../processors/variables-parser.js';
import { processBackground } from '../utils/text-utils.js';
import { renderSVG } from './svg-renderer.js';
import { calculateStartY, calculateLinesAnimation } from './animation-calculator.js';
import { getEmbeddedFontCSS, getMultipleEmbeddedFontsCSS } from '../fonts/font-embed.js';
import { extractFontFamiliesFromStyles } from '../processors/style-segments-parser.js';

/**
 * Генерирует SVG код с SMIL анимацией печатающегося текста
 * @param {Object} params - параметры генерации
 * @returns {string} SVG код
 */
export async function generateSVG(params) {
  // Парсинг строк текста
  const rawLines = Array.isArray(params.lines) 
    ? params.lines 
    : (typeof params.lines === 'string' 
      ? params.lines.split(';').map(l => l.trim()).filter(l => l)
      : []);
  
  const lines = parseLines(rawLines);
  
  if (lines.length === 0) {
    lines.push('Your+text+here');
  }
  
  // Нормализация параметров
  const normalizedParams = {
    ...params,
    multiLine: params.multiLine === true || params.multiLine === 'true' || params.multiLine === '1',
    repeat: params.repeat === true || params.repeat === 'true' || params.repeat === '1',
    color: params.color === 'transparent' ? params.color : 
      (params.color.startsWith('#') ? params.color : '#' + params.color),
    printSpeed: params.printSpeed || 5000,
    eraseSpeed: params.eraseSpeed || 50,
    delayBetweenLines: params.delayBetweenLines || 800,
    letterSpacing: params.letterSpacing || 'normal'
  };
  
  // Обработка фона
  const backgroundValue = params.background === 'transparent' ? params.background : 
    (params.background.startsWith('#') ? params.background : '#' + params.background);
  const background = processBackground(backgroundValue);
  
  // Попытка подтянуть CSS шрифта, встроить его в SVG и распарсить для получения метрик.
  // Логика опциональная: при ошибке просто генерируем SVG без встроенного шрифта.
  // ВАЖНО: загружаем шрифт ДО вызова calculateStartY, чтобы использовать метрики для расчета позиции
  
  // Извлекаем все уникальные fontFamily из сегментов стилей $STYLE
  const styleFontFamilies = extractFontFamiliesFromStyles(lines);
  
  // Собираем список всех шрифтов для загрузки: основной + из стилей
  const fontsToLoad = [];
  
  // Добавляем основной шрифт
  if (normalizedParams.fontFamily) {
    fontsToLoad.push({
      fontFamily: normalizedParams.fontFamily,
      fontWeight: normalizedParams.fontWeight,
      lines,
    });
  }
  
  // Добавляем шрифты из стилей (если они отличаются от основного)
  for (const styleFontFamily of styleFontFamilies) {
    // Проверяем, не является ли это основным шрифтом
    if (normalizedParams.fontFamily) {
      const normalizedMain = normalizedParams.fontFamily.split(',')[0].trim().replace(/["']/g, '').toLowerCase();
      const normalizedStyle = styleFontFamily.split(',')[0].trim().replace(/["']/g, '').toLowerCase();
      
      if (normalizedMain !== normalizedStyle) {
        fontsToLoad.push({
          fontFamily: styleFontFamily,
          fontWeight: normalizedParams.fontWeight,
          lines,
        });
      }
    } else {
      // Если основного шрифта нет, добавляем все из стилей
      fontsToLoad.push({
        fontFamily: styleFontFamily,
        fontWeight: normalizedParams.fontWeight,
        lines,
      });
    }
  }
  
  let fontCSS = '';
  let parsedFont = null;
  // Карта для хранения метрик всех шрифтов: fontFamily -> parsedFont
  const fontsMap = new Map();
  
  try {
    // Загружаем все шрифты (основной + из стилей) и объединяем CSS
    if (fontsToLoad.length > 0) {
      fontCSS = await getMultipleEmbeddedFontsCSS(fontsToLoad);
      
      // Загружаем метрики для всех шрифтов параллельно
      const fontMetricsPromises = fontsToLoad.map(async (fontConfig) => {
        try {
          const fontData = await getEmbeddedFontCSS(fontConfig);
          if (fontData.parsedFont) {
            // Нормализуем имя шрифта для ключа (убираем кавычки, берем первое семейство)
            const normalizedName = fontConfig.fontFamily.split(',')[0].trim().replace(/["']/g, '').toLowerCase();
            fontsMap.set(normalizedName, fontData.parsedFont);
          }
          return fontData;
        } catch (error) {
          // Игнорируем ошибки загрузки отдельных шрифтов
          return null;
        }
      });
      
      await Promise.all(fontMetricsPromises);
      
      // Устанавливаем основной parsedFont для обратной совместимости
      if (normalizedParams.fontFamily) {
        const normalizedMain = normalizedParams.fontFamily.split(',')[0].trim().replace(/["']/g, '').toLowerCase();
        parsedFont = fontsMap.get(normalizedMain) || null;
      }
    } else if (normalizedParams.fontFamily) {
      // Если нет шрифтов из стилей, загружаем только основной
      const mainFontData = await getEmbeddedFontCSS({
        fontFamily: normalizedParams.fontFamily,
        fontWeight: normalizedParams.fontWeight,
        lines,
      });
      fontCSS = mainFontData.css || '';
      parsedFont = mainFontData.parsedFont || null;
      
      if (parsedFont) {
        const normalizedMain = normalizedParams.fontFamily.split(',')[0].trim().replace(/["']/g, '').toLowerCase();
        fontsMap.set(normalizedMain, parsedFont);
      }
    }
  } catch (error) {
    console.warn('Failed to load fonts:', error);
    fontCSS = '';
    parsedFont = null;
  }
  
  // Вычисление стартовой позиции Y (теперь с учетом метрик шрифта)
  const startY = calculateStartY({
    verticalAlign: normalizedParams.verticalAlign,
    height: normalizedParams.height,
    paddingY: normalizedParams.paddingY,
    fontSize: normalizedParams.fontSize,
    lineHeight: normalizedParams.lineHeight,
    multiLine: normalizedParams.multiLine,
    linesCount: lines.length,
    parsedFont
  });
  
  // Вычисление параметров анимации для всех строк с использованием метрик шрифта
  const linesData = calculateLinesAnimation(normalizedParams, lines, startY, parsedFont, fontsMap);
  
  // Рендеринг итогового SVG
  return renderSVG({
    width: normalizedParams.width,
    height: normalizedParams.height,
    background,
    linesData,
    fontCSS,
  });
}

