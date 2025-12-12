/**
 * Калькулятор параметров анимации для различных режимов работы
 */

import { computeTextWidth, computeTextWidthWithStyles, computeTextX, formatLetterSpacingForSVG } from '../utils/text-utils.js';
import { getEraseMode } from '../effects/erase/index.js';
import { isCursorAllowed, shouldHideCursorWhenFinished } from '../effects/cursor/index.js';
import { stripStyleMarkers, hasStyleMarkers } from '../processors/style-segments-parser.js';
import { getCharacterWidths, getCharacterWidthsWithStyles, getFontAscent } from '../fonts/font-metrics.js';

/**
 * Вычисляет стартовую позицию Y для вертикального выравнивания
 * @param {Object} config - конфигурация
 * @param {string} config.verticalAlign - вертикальное выравнивание (top, middle, bottom)
 * @param {number} config.height - высота SVG
 * @param {number} config.paddingY - вертикальный отступ
 * @param {number} config.fontSize - размер шрифта
 * @param {number} config.lineHeight - межстрочный интервал
 * @param {boolean} config.multiLine - многострочный режим
 * @param {number} config.linesCount - количество строк
 * @param {object|null} config.parsedFont - объект opentype.Font или null
 * @returns {number} стартовая позиция Y
 */
export function calculateStartY(config) {
  const { verticalAlign, height, paddingY, fontSize, lineHeight, multiLine, linesCount, parsedFont } = config;
  
  const totalTextHeight = multiLine 
    ? linesCount * fontSize * lineHeight 
    : fontSize;
  
  let startY = paddingY;
  
  if (verticalAlign === 'top') {
    // Для top выравнивания нужно учесть ascent шрифта, чтобы верхняя часть текста не обрезалась
    // В SVG координата Y для текста - это базовая линия (baseline), поэтому нужно добавить ascent
    const fontAscent = getFontAscent(fontSize, parsedFont);
    startY = paddingY + fontAscent;
  } else if (verticalAlign === 'middle') {
    startY = (height - totalTextHeight) / 2 + fontSize;
  } else if (verticalAlign === 'bottom') {
    startY = height - totalTextHeight + fontSize / 2;
  }
  
  return startY;
}

/**
 * Вычисляет детальные позиции курсора для печати текста (посимвольно)
 * @param {Object} config - конфигурация
 * @returns {Object} объект с массивами keyTimes и xPositions
 */
function calculatePrintCursorPositions(config) {
  const { line, startX, printStart, printEnd, fontSize, letterSpacing, parsedFont, fontsMap } = config;
  
  if (!line || line.length === 0) {
    return {
      keyTimes: [printStart, printEnd],
      xPositions: [startX, startX]
    };
  }
  
  // Получаем накопленные ширины для каждой позиции в тексте
  // Используем версию с учетом стилей, если есть маркеры
  const widths = hasStyleMarkers(line)
    ? getCharacterWidthsWithStyles(line, fontSize, parsedFont, letterSpacing, fontsMap)
    : getCharacterWidths(line, fontSize, parsedFont, letterSpacing);
  
  // Для расчета времени используем чистый текст (без маркеров)
  const cleanLine = stripStyleMarkers(line);
  const chars = [...cleanLine];
  
  const keyTimes = [];
  const xPositions = [];
  
  // Для каждого символа создаем ключевую точку
  for (let i = 0; i <= chars.length; i++) {
    const progress = chars.length > 0 ? i / chars.length : 0;
    const time = printStart + (printEnd - printStart) * progress;
    const x = startX + widths[i];
    
    keyTimes.push(time);
    xPositions.push(x);
  }
  
  return { keyTimes, xPositions };
}

/**
 * Вычисляет детальные позиции курсора для стирания текста (посимвольно)
 * @param {Object} config - конфигурация
 * @returns {Object} объект с массивами keyTimes и xPositions
 */
function calculateEraseCursorPositions(config) {
  const { line, startX, eraseStart, eraseEnd, fontSize, letterSpacing, parsedFont, fontsMap } = config;
  
  if (!line || line.length === 0) {
    return {
      keyTimes: [eraseStart, eraseEnd],
      xPositions: [startX, startX]
    };
  }
  
  // Получаем накопленные ширины для каждой позиции в тексте
  // Используем версию с учетом стилей, если есть маркеры
  const widths = hasStyleMarkers(line)
    ? getCharacterWidthsWithStyles(line, fontSize, parsedFont, letterSpacing, fontsMap)
    : getCharacterWidths(line, fontSize, parsedFont, letterSpacing);
  
  // Для расчета времени используем чистый текст (без маркеров)
  const cleanLine = stripStyleMarkers(line);
  const chars = [...cleanLine];
  
  const keyTimes = [];
  const xPositions = [];
  
  // При стирании движемся от конца к началу
  for (let i = chars.length; i >= 0; i--) {
    const progress = chars.length > 0 ? (chars.length - i) / chars.length : 0;
    const time = eraseStart + (eraseEnd - eraseStart) * progress;
    const x = startX + widths[i];
    
    keyTimes.push(time);
    xPositions.push(x);
  }
  
  return { keyTimes, xPositions };
}

/**
 * Вычисляет параметры анимации для одной строки в режиме замены (replacing mode)
 * @param {Object} config - конфигурация анимации
 * @returns {Object} параметры анимации для строки
 */
function calculateReplacingModeLineAnimation(config) {
  const {
    line, index, lastLineIndex, startX, y, textWidth,
    printDuration, eraseDuration, delayBetweenLines,
    repeat, eraseMode, fontSize, letterSpacing, eraseSpeed, fontFamily, parsedFont
  } = config;
  
  const isLastLine = index === lastLineIndex;
  const eraseModeInstance = getEraseMode(eraseMode);
  
  let totalDuration, begin, keyTimes, pathValues, useFadeErase, fadeEraseStart, fadeEraseEnd;
  
  if (repeat) {
    // При repeat=true: все строки стираются, цикл повторяется бесконечно
    totalDuration = printDuration + delayBetweenLines + eraseDuration + delayBetweenLines;
    const cyclePause = delayBetweenLines > 0 ? delayBetweenLines : 0;
    const repeatSuffix = cyclePause > 0 ? `+${cyclePause}ms` : '';
    
    const eraseConfig = {
      startX, y, textWidth, printDuration, delayBetweenLines,
      eraseDuration, totalDuration, line, fontSize, letterSpacing, eraseSpeed, fontFamily, parsedFont
    };
    
    const eraseResult = eraseModeInstance.calculateReplacingMode(eraseConfig);
    ({ useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues } = eraseResult);
    
    // Начало анимации:
    // - первый цикл: 0s
    // - последующие циклы: после завершения последней строки + пауза между циклами
    if (index === 0) {
      begin = repeatSuffix ? `0s;d${lastLineIndex}.end${repeatSuffix}` : `0s;d${lastLineIndex}.end`;
    } else {
      begin = `d${index - 1}.end`;
    }
  } else {
    // При repeat=false: не последняя строка стирается, последняя остается
    if (!isLastLine) {
      totalDuration = printDuration + delayBetweenLines + eraseDuration + delayBetweenLines;
      
      const eraseConfig = {
        startX, y, textWidth, printDuration, delayBetweenLines,
        eraseDuration, totalDuration, line, fontSize, letterSpacing, eraseSpeed, fontFamily, parsedFont
      };
      
      const eraseResult = eraseModeInstance.calculateReplacingMode(eraseConfig);
      ({ useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues } = eraseResult);
      
      begin = index === 0 ? '0s' : `d${index - 1}.end`;
    } else {
      // Последняя строка: печать -> пауза -> остается на месте
      totalDuration = printDuration + delayBetweenLines;
      
      const printEnd = printDuration / totalDuration;
      
      useFadeErase = false;
      fadeEraseStart = 0;
      fadeEraseEnd = 0;
      keyTimes = `0;${printEnd};1`;
      pathValues = `m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth}`;
      
      begin = index === 0 ? '0s' : `d${index - 1}.end`;
    }
  }
  
  // Определяем fill атрибут
  const fillValue = (!repeat && isLastLine) ? 'freeze' : 'remove';
  
  return {
    totalDuration,
    begin,
    keyTimes,
    pathValues,
    useFadeErase,
    fadeEraseStart,
    fadeEraseEnd,
    fillValue
  };
}

/**
 * Вычисляет параметры анимации для одной строки в многострочном режиме (multiline mode)
 * @param {Object} config - конфигурация анимации
 * @returns {Object} параметры анимации для строки
 */
function calculateMultiLineModeLineAnimation(config) {
  const {
    line, index, lines, startX, y, textWidth,
    printDuration, eraseSpeed, delayBetweenLines,
    repeat, eraseMode, fontSize, letterSpacing, fontFamily, parsedFont, printSpeed
  } = config;
  
  // Очищаем все строки от маркеров стилей для корректного расчета длительности
  const cleanLines = lines.map(l => stripStyleMarkers(l));
  const lastLineIndex = cleanLines.length - 1;
  
  // Рассчитываем длительность печати каждой строки
  const msPerCharPrint = 1000 / printSpeed;
  const lineDurations = cleanLines.map(l => l.length * msPerCharPrint);
  
  // Вычисляем время начала текущей строки как сумму длительностей всех предыдущих строк + паузы
  let timeBeforeThisLine = 0;
  for (let i = 0; i < index; i++) {
    timeBeforeThisLine += lineDurations[i] + delayBetweenLines;
  }
  
  let totalDuration, begin, keyTimes, pathValues, useFadeErase, fadeEraseStart, fadeEraseEnd;
  // Глобальные значения начала/конца печати строки (0–1 относительно totalDuration)
  let cursorPrintStart;
  let cursorPrintEnd;
  // Границы стирания строки (0–1 относительно totalDuration) — только для eraseMode='line'
  let cursorEraseStart;
  let cursorEraseEnd;
  // Детальные позиции курсора для печати и стирания
  let cursorPrintKeyTimes;
  let cursorPrintXPositions;
  let cursorEraseKeyTimes;
  let cursorEraseXPositions;
  
  if (repeat) {
    // Общее время печати всех строк = сумма длительностей всех строк + паузы между ними
    const totalPrintTime = lineDurations.reduce((sum, dur) => sum + dur, 0) + (cleanLines.length - 1) * delayBetweenLines;
    const eraseModeInstance = getEraseMode(eraseMode);
    
    let printStart, printEnd, eraseStart, eraseEnd;
    
    if (eraseMode === 'line') {
      // Стирание построчно, начиная с последней строки
      const msPerCharErase = 1000 / eraseSpeed;
      // После печати последней строки добавляем паузу перед началом стирания
      let eraseStartTime = totalPrintTime + delayBetweenLines;
      for (let j = lastLineIndex; j > index; j--) {
        eraseStartTime += cleanLines[j].length * msPerCharErase;
        eraseStartTime += delayBetweenLines;
      }
      
      const thisEraseDuration = line.length * msPerCharErase;
      const totalEraseDuration = cleanLines.reduce((sum, l) => sum + l.length * msPerCharErase, 0);
      // Паузы: перед началом стирания + между строками при стирании
      const totalErasePauses = cleanLines.length * delayBetweenLines;
      
      totalDuration = totalPrintTime + totalEraseDuration + totalErasePauses;
      
      printStart = timeBeforeThisLine / totalDuration;
      printEnd = (timeBeforeThisLine + printDuration) / totalDuration;
      eraseStart = eraseStartTime / totalDuration;
      eraseEnd = (eraseStartTime + thisEraseDuration) / totalDuration;

      cursorPrintStart = printStart;
      cursorPrintEnd = printEnd;
      cursorEraseStart = eraseStart;
      cursorEraseEnd = eraseEnd;
      
      // Рассчитываем детальные позиции курсора для печати
      const printCursorData = calculatePrintCursorPositions({
        line, startX, printStart, printEnd, fontSize, letterSpacing, parsedFont, fontsMap
      });
      cursorPrintKeyTimes = printCursorData.keyTimes;
      cursorPrintXPositions = printCursorData.xPositions;
      
      // Рассчитываем детальные позиции курсора для стирания
      const eraseCursorData = calculateEraseCursorPositions({
        line, startX, eraseStart, eraseEnd, fontSize, letterSpacing, parsedFont, fontsMap
      });
      cursorEraseKeyTimes = eraseCursorData.keyTimes;
      cursorEraseXPositions = eraseCursorData.xPositions;
    } else {
      const msPerCharErase = 1000 / eraseSpeed;
      const totalEraseDuration = cleanLines.reduce((sum, l) => sum + l.length * msPerCharErase, 0);
      // Пауза перед началом стирания + пауза после стирания
      totalDuration = totalPrintTime + delayBetweenLines + totalEraseDuration + delayBetweenLines;
      
      printStart = timeBeforeThisLine / totalDuration;
      printEnd = (timeBeforeThisLine + printDuration) / totalDuration;
      // Стирание начинается после паузы
      eraseStart = (totalPrintTime + delayBetweenLines) / totalDuration;
      eraseEnd = (totalPrintTime + delayBetweenLines + totalEraseDuration) / totalDuration;

      cursorPrintStart = printStart;
      cursorPrintEnd = printEnd;
      
      // Рассчитываем детальные позиции курсора для печати (для других режимов стирания курсор движется только при печати)
      const printCursorData = calculatePrintCursorPositions({
        line, startX, printStart, printEnd, fontSize, letterSpacing, parsedFont, fontsMap
      });
      cursorPrintKeyTimes = printCursorData.keyTimes;
      cursorPrintXPositions = printCursorData.xPositions;
    }
    
    const eraseConfig = {
      startX, y, textWidth, printStart, printEnd, eraseStart, eraseEnd,
      line, fontSize, letterSpacing, eraseSpeed, totalDuration, fontFamily, parsedFont
    };
    
    const eraseResult = eraseModeInstance.calculateMultiLineMode(eraseConfig);
    ({ useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues } = eraseResult);
    
    // Для repeat=true добавляем паузу между циклами после завершения последней строки
    const cyclePause = delayBetweenLines > 0 ? delayBetweenLines : 0;
    const repeatSuffix = cyclePause > 0 ? `+${cyclePause}ms` : '';
    const baseBegin = `0s;d${lastLineIndex}.end`;
    begin = repeatSuffix ? `${baseBegin}${repeatSuffix}` : baseBegin;
  } else {
    // При repeat=false: строки печатаются и остаются на месте
    // Общее время печати всех строк = сумма длительностей всех строк + паузы между ними
    const totalPrintTime = lineDurations.reduce((sum, dur) => sum + dur, 0) + (cleanLines.length - 1) * delayBetweenLines;
    totalDuration = totalPrintTime;
    
    const printStart = timeBeforeThisLine / totalDuration;
    const printEnd = (timeBeforeThisLine + printDuration) / totalDuration;
    
    useFadeErase = false;
    fadeEraseStart = 0;
    fadeEraseEnd = 0;
    
    if (index === 0) {
      keyTimes = `0;0;${printEnd};1`;
      pathValues = `m${startX},${y} h0 ; m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth}`;
    } else {
      keyTimes = `0;${printStart};${printEnd};1`;
      pathValues = `m${startX},${y} h0 ; m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth}`;
    }
    
    begin = '0s';
    cursorPrintStart = printStart;
    cursorPrintEnd = printEnd;
    
    // Рассчитываем детальные позиции курсора для печати
    const printCursorData = calculatePrintCursorPositions({
      line, startX, printStart, printEnd, fontSize, letterSpacing, parsedFont
    });
    cursorPrintKeyTimes = printCursorData.keyTimes;
    cursorPrintXPositions = printCursorData.xPositions;
  }
  
  const fillValue = repeat ? 'remove' : 'freeze';
  
  return {
    totalDuration,
    begin,
    keyTimes,
    pathValues,
    useFadeErase,
    fadeEraseStart,
    fadeEraseEnd,
    fillValue,
    // Дополнительные данные для курсора в multiline режиме
    printStart: cursorPrintStart,
    printEnd: cursorPrintEnd,
    eraseStart: cursorEraseStart,
    eraseEnd: cursorEraseEnd,
    // Детальные позиции курсора
    cursorPrintKeyTimes,
    cursorPrintXPositions,
    cursorEraseKeyTimes,
    cursorEraseXPositions
  };
}

/**
 * Вычисляет параметры анимации для одной строки (single line mode)
 * @param {Object} config - конфигурация анимации
 * @returns {Object} параметры анимации для строки
 */
function calculateSingleLineModeAnimation(config) {
  const {
    startX, y, textWidth, printDuration, eraseDuration,
    delayBetweenLines, repeat, eraseMode,
    line, fontSize, letterSpacing, eraseSpeed, fontFamily, parsedFont
  } = config;
  
  const eraseModeInstance = getEraseMode(eraseMode);
  
  let totalDuration, begin, keyTimes, pathValues, useFadeErase, fadeEraseStart, fadeEraseEnd;
  
  if (repeat) {
    totalDuration = printDuration + delayBetweenLines + eraseDuration + delayBetweenLines;
    const cyclePause = delayBetweenLines > 0 ? delayBetweenLines : 0;
    const repeatSuffix = cyclePause > 0 ? `+${cyclePause}ms` : '';
    
    const eraseConfig = {
      startX, y, textWidth, printDuration, delayBetweenLines,
      eraseDuration, totalDuration, line, fontSize, letterSpacing, eraseSpeed, fontFamily, parsedFont
    };
    
    const eraseResult = eraseModeInstance.calculateSingleLineMode(eraseConfig);
    ({ useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues } = eraseResult);
    
    // Повторяем цикл с дополнительной паузой между циклами
    begin = repeatSuffix ? `0s;d0.end${repeatSuffix}` : '0s;d0.end';
  } else {
    totalDuration = printDuration + delayBetweenLines;
    const printEnd = printDuration / totalDuration;
    
    useFadeErase = false;
    fadeEraseStart = 0;
    fadeEraseEnd = 0;
    keyTimes = `0;${printEnd};1`;
    pathValues = `m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth}`;
    
    begin = '0s';
  }
  
  const fillValue = repeat ? 'remove' : 'freeze';
  
  return {
    totalDuration,
    begin,
    keyTimes,
    pathValues,
    useFadeErase,
    fadeEraseStart,
    fadeEraseEnd,
    fillValue
  };
}

/**
 * Вычисляет параметры анимации для всех строк
 * @param {Object} params - параметры генерации
 * @param {Array<string>} lines - массив строк текста
 * @param {number} startY - стартовая позиция Y
 * @param {object|null} parsedFont - объект opentype.Font или null
 * @returns {Array<Object>} массив параметров анимации для каждой строки
 */
export function calculateLinesAnimation(params, lines, startY, parsedFont = null, fontsMap = null) {
  const {
    multiLine, repeat, eraseMode,
    printSpeed, eraseSpeed, delayBetweenLines,
    fontSize, lineHeight, horizontalAlign, width, paddingX, letterSpacing,
    fontFamily, color, fontWeight, cursorStyle,
  } = params;
  const cursorEnabledForParams = isCursorAllowed(params);
  const hideCursorOnFinish = shouldHideCursorWhenFinished(params);
  
  // printSpeed и eraseSpeed - это количество символов в секунду.
  // Длительность печати/стирания одного символа = 1000 / speed миллисекунд
  // Длительность печати/стирания строки = (количество символов * 1000) / speed
  
  const isReplacingMode = !multiLine && lines.length > 1;
  const lastLineIndex = lines.length - 1;
  
  return lines.map((line, index) => {
    if (!line) return null;
    
    // Удаляем маркеры стилей для расчета длительности
    // Оригинальная строка (с маркерами) будет использована при рендеринге и расчете ширины
    const cleanLine = stripStyleMarkers(line);
    
    // Вычисляем позицию строки
    const y = isReplacingMode ? startY : startY + index * fontSize * lineHeight;
    
    // Вычисляем ширину текста с учетом стилей (если есть маркеры)
    const textWidth = hasStyleMarkers(line)
      ? computeTextWidthWithStyles(line, fontSize, letterSpacing, fontFamily, parsedFont, fontsMap)
      : computeTextWidth(cleanLine, fontSize, letterSpacing, fontFamily, parsedFont);
    
    // Вычисляем позицию X с учетом стилей (computeTextX уже поддерживает стили)
    const startX = computeTextX(line, fontSize, horizontalAlign, width, paddingX, letterSpacing, fontFamily, parsedFont, fontsMap);
    
    // Параметры анимации
    // printSpeed и eraseSpeed - символов в секунду, вычисляем миллисекунды на символ
    const msPerCharPrint = 1000 / printSpeed;
    const msPerCharErase = 1000 / eraseSpeed;
    const printDuration = cleanLine.length * msPerCharPrint;
    const eraseDuration = cleanLine.length * msPerCharErase;
    
    const pathId = `path${index}`;
    const animateId = `d${index}`;
    
    let animationParams;
    
    // Выбираем режим вычисления в зависимости от типа анимации
    if (isReplacingMode) {
      animationParams = calculateReplacingModeLineAnimation({
        line: cleanLine, index, lastLineIndex, startX, y, textWidth,
        printDuration, eraseDuration, delayBetweenLines,
        repeat, eraseMode, fontSize, letterSpacing, eraseSpeed, fontFamily, parsedFont
      });
    } else if (multiLine) {
      animationParams = calculateMultiLineModeLineAnimation({
        line: cleanLine, index, lines, startX, y, textWidth,
        printDuration, eraseSpeed, delayBetweenLines,
        repeat, eraseMode, fontSize, letterSpacing, fontFamily, parsedFont, printSpeed
      });
    } else {
      animationParams = calculateSingleLineModeAnimation({
        startX, y, textWidth, printDuration, eraseDuration,
        delayBetweenLines, repeat, eraseMode,
        line: cleanLine, fontSize, letterSpacing, eraseSpeed, fontFamily, parsedFont
      });
    }

    // Конфигурация анимации курсора — строим на основе pathValues/keyTimes
    let cursorKeyTimes;
    let cursorValues;
    let cursorFillValue;

    if (cursorEnabledForParams && cursorStyle && cursorStyle !== 'none' && animationParams.pathValues && animationParams.keyTimes) {
      const pathSegments = String(animationParams.pathValues)
        .split(';')
        .map((segment) => segment.trim())
        .filter(Boolean);
      const keyTimesParts = String(animationParams.keyTimes)
        .split(';')
        .map((value) => value.trim())
        .filter(Boolean);

      if (pathSegments.length === keyTimesParts.length) {
        const cursorPositions = pathSegments.map((segment) => {
          const match = segment.match(/h(-?\d+(\.\d+)?)/i);
          const length = match ? parseFloat(match[1]) : 0;
          const safeLength = Number.isNaN(length) ? 0 : length;
          return startX + safeLength;
        });

        cursorKeyTimes = keyTimesParts.join(';');
        cursorValues = cursorPositions.join(';');

        // Базовое значение fill для курсора берём из анимации строки
        cursorFillValue = animationParams.fillValue;

        // В repeat-режиме курсор не должен "откатываться" в (0,0) в паузах между циклами,
        // поэтому фиксируем последнюю позицию (freeze), чтобы избежать скачка.
        if (repeat) {
          cursorFillValue = 'freeze';
        }

        // Для конечного состояния (repeat=false) при необходимости явно скрываем курсор
        if (hideCursorOnFinish) {
          cursorFillValue = 'remove';
        }
      }
    }

    // Формируем итоговый объект с параметрами для рендера
    return {
      index,
      pathId,
      animateId,
      line,
      // Геометрия строки
      startX,
      y,
      textWidth,
      fontFamily,
      color,
      fontSize,
      fontWeight,
      letterSpacingValue: formatLetterSpacingForSVG(letterSpacing),
      // Флаг режима для последующей сборки курсора
      multiLine,
      isReplacingMode,
      // Параметры курсора (если они рассчитаны)
      cursorStyle: cursorStyle || 'none',
      cursorKeyTimes,
      cursorValues,
      cursorFillValue,
      ...animationParams
    };
  }).filter(Boolean);
}

