/**
 * Генератор SVG с SMIL анимацией эффекта печатающегося текста
 * 
 * Координирует работу модулей:
 * - text-utils: утилиты для работы с текстом
 * - svg-template: рендеринг SVG шаблона
 * - erase-modes: стратегии стирания текста
 * - animation-calculator: вычисление параметров анимации
 */

import { parseLines } from '../utils/variables.js';
import { processBackground } from './utils/text-utils.js';
import { renderSVG } from './svg-template.js';
import { calculateStartY, calculateLinesAnimation } from './animation-calculator.js';

/**
 * Генерирует SVG код с SMIL анимацией печатающегося текста
 * @param {Object} params - параметры генерации
 * @returns {string} SVG код
 */
export function generateSVG(params) {
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
  
  // Вычисление стартовой позиции Y
  const startY = calculateStartY({
    verticalAlign: normalizedParams.verticalAlign,
    height: normalizedParams.height,
    paddingY: normalizedParams.paddingY,
    fontSize: normalizedParams.fontSize,
    lineHeight: normalizedParams.lineHeight,
    multiLine: normalizedParams.multiLine,
    linesCount: lines.length
  });
  
  // Вычисление параметров анимации для всех строк
  const linesData = calculateLinesAnimation(normalizedParams, lines, startY);
  
  // Рендеринг итогового SVG
  return renderSVG({
    width: normalizedParams.width,
    height: normalizedParams.height,
    background,
    linesData
  });
}

