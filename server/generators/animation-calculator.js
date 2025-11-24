/**
 * Калькулятор параметров анимации для различных режимов работы
 */

import { computeTextWidth, computeTextX, formatLetterSpacingForSVG } from './utils/text-utils.js';
import { getEraseMode } from './erase-modes/index.js';
import { isCursorAllowed, shouldHideCursorWhenFinished } from './cursor-modes/index.js';

/**
 * Вычисляет стартовую позицию Y для вертикального выравнивания
 * @param {Object} config - конфигурация
 * @returns {number} стартовая позиция Y
 */
export function calculateStartY(config) {
  const { verticalAlign, height, paddingY, fontSize, lineHeight, multiLine, linesCount } = config;
  
  const totalTextHeight = multiLine 
    ? linesCount * fontSize * lineHeight 
    : fontSize;
  
  let startY = paddingY;
  if (verticalAlign === 'middle') {
    startY = (height - totalTextHeight) / 2 + fontSize;
  } else if (verticalAlign === 'bottom') {
    startY = height - totalTextHeight + fontSize / 2;
  }
  
  return startY;
}

/**
 * Вычисляет параметры анимации для одной строки в режиме замены (replacing mode)
 * @param {Object} config - конфигурация анимации
 * @returns {Object} параметры анимации для строки
 */
function calculateReplacingModeLineAnimation(config) {
  const {
    line, index, lastLineIndex, startX, y, textWidth,
    printDuration, eraseDuration, delayAfterBlockPrint, delayAfterErase,
    repeat, eraseMode, fontSize, letterSpacing, eraseSpeed
  } = config;
  
  const isLastLine = index === lastLineIndex;
  const eraseModeInstance = getEraseMode(eraseMode);
  
  let totalDuration, begin, keyTimes, pathValues, useFadeErase, fadeEraseStart, fadeEraseEnd;
  
  if (repeat) {
    // При repeat=true: все строки стираются, цикл повторяется бесконечно
    totalDuration = printDuration + delayAfterBlockPrint + eraseDuration + delayAfterErase;
    const cyclePause = delayAfterBlockPrint > 0 ? delayAfterBlockPrint : 0;
    const repeatSuffix = cyclePause > 0 ? `+${cyclePause}ms` : '';
    
    const eraseConfig = {
      startX, y, textWidth, printDuration, delayAfterBlockPrint,
      eraseDuration, delayAfterErase, totalDuration, line, fontSize, letterSpacing, eraseSpeed
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
      totalDuration = printDuration + delayAfterBlockPrint + eraseDuration + delayAfterErase;
      
      const eraseConfig = {
        startX, y, textWidth, printDuration, delayAfterBlockPrint,
        eraseDuration, delayAfterErase, totalDuration, line, fontSize, letterSpacing, eraseSpeed
      };
      
      const eraseResult = eraseModeInstance.calculateReplacingMode(eraseConfig);
      ({ useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues } = eraseResult);
      
      begin = index === 0 ? '0s' : `d${index - 1}.end`;
    } else {
      // Последняя строка: печать -> пауза -> остается на месте
      totalDuration = printDuration + delayAfterBlockPrint;
      
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
    printDuration, eraseSpeed, delayAfterBlockPrint, delayAfterErase,
    repeat, eraseMode, fontSize, letterSpacing
  } = config;
  
  const lastLineIndex = lines.length - 1;
  const timeBeforeThisLine = index * (printDuration + delayAfterBlockPrint);
  
  let totalDuration, begin, keyTimes, pathValues, useFadeErase, fadeEraseStart, fadeEraseEnd;
  // Глобальные значения начала/конца печати строки (0–1 относительно totalDuration)
  let cursorPrintStart;
  let cursorPrintEnd;
  // Границы стирания строки (0–1 относительно totalDuration) — только для eraseMode='line'
  let cursorEraseStart;
  let cursorEraseEnd;
  
  if (repeat) {
    const totalPrintTime = lines.length * (printDuration + delayAfterBlockPrint);
    const eraseModeInstance = getEraseMode(eraseMode);
    
    let printStart, printEnd, eraseStart, eraseEnd;
    
    if (eraseMode === 'line') {
      // Стирание построчно, начиная с последней строки
      let eraseStartTime = totalPrintTime;
      for (let j = lastLineIndex; j > index; j--) {
        eraseStartTime += lines[j].length * eraseSpeed;
        eraseStartTime += delayAfterErase;
      }
      
      const thisEraseDuration = line.length * eraseSpeed;
      const totalEraseDuration = lines.reduce((sum, l) => sum + l.length * eraseSpeed, 0);
      const totalErasePauses = (lines.length - 1) * delayAfterErase;
      
      totalDuration = totalPrintTime + totalEraseDuration + totalErasePauses + delayAfterErase;
      
      printStart = timeBeforeThisLine / totalDuration;
      printEnd = (timeBeforeThisLine + printDuration) / totalDuration;
      eraseStart = eraseStartTime / totalDuration;
      eraseEnd = (eraseStartTime + thisEraseDuration) / totalDuration;

      cursorPrintStart = printStart;
      cursorPrintEnd = printEnd;
      cursorEraseStart = eraseStart;
      cursorEraseEnd = eraseEnd;
    } else {
      const totalEraseDuration = lines.reduce((sum, l) => sum + l.length * eraseSpeed, 0);
      totalDuration = totalPrintTime + totalEraseDuration + delayAfterErase;
      
      printStart = timeBeforeThisLine / totalDuration;
      printEnd = (timeBeforeThisLine + printDuration) / totalDuration;
      eraseStart = totalPrintTime / totalDuration;
      eraseEnd = (totalPrintTime + totalEraseDuration) / totalDuration;

      cursorPrintStart = printStart;
      cursorPrintEnd = printEnd;
    }
    
    const eraseConfig = {
      startX, y, textWidth, printStart, printEnd, eraseStart, eraseEnd,
      line, fontSize, letterSpacing, eraseSpeed, totalDuration
    };
    
    const eraseResult = eraseModeInstance.calculateMultiLineMode(eraseConfig);
    ({ useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues } = eraseResult);
    
    // Для repeat=true добавляем паузу между циклами после завершения последней строки
    const cyclePause = delayAfterBlockPrint > 0 ? delayAfterBlockPrint : 0;
    const repeatSuffix = cyclePause > 0 ? `+${cyclePause}ms` : '';
    const baseBegin = `0s;d${lastLineIndex}.end`;
    begin = repeatSuffix ? `${baseBegin}${repeatSuffix}` : baseBegin;
  } else {
    // При repeat=false: строки печатаются и остаются на месте
    const totalPrintTime = lines.length * printDuration + (lines.length - 1) * delayAfterBlockPrint;
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
    eraseEnd: cursorEraseEnd
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
    delayAfterBlockPrint, delayAfterErase, repeat, eraseMode,
    line, fontSize, letterSpacing, eraseSpeed
  } = config;
  
  const eraseModeInstance = getEraseMode(eraseMode);
  
  let totalDuration, begin, keyTimes, pathValues, useFadeErase, fadeEraseStart, fadeEraseEnd;
  
  if (repeat) {
    totalDuration = printDuration + delayAfterBlockPrint + eraseDuration + delayAfterErase;
    const cyclePause = delayAfterBlockPrint > 0 ? delayAfterBlockPrint : 0;
    const repeatSuffix = cyclePause > 0 ? `+${cyclePause}ms` : '';
    
    const eraseConfig = {
      startX, y, textWidth, printDuration, delayAfterBlockPrint,
      eraseDuration, delayAfterErase, totalDuration, line, fontSize, letterSpacing, eraseSpeed
    };
    
    const eraseResult = eraseModeInstance.calculateSingleLineMode(eraseConfig);
    ({ useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues } = eraseResult);
    
    // Повторяем цикл с дополнительной паузой между циклами
    begin = repeatSuffix ? `0s;d0.end${repeatSuffix}` : '0s;d0.end';
  } else {
    totalDuration = printDuration + delayAfterBlockPrint;
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
 * @returns {Array<Object>} массив параметров анимации для каждой строки
 */
export function calculateLinesAnimation(params, lines, startY) {
  const {
    multiLine, repeat, eraseMode,
    printSpeed, eraseSpeed, delayAfterBlockPrint, delayAfterErase,
    fontSize, lineHeight, horizontalAlign, width, paddingX, letterSpacing,
    fontFamily, color, fontWeight, cursorStyle,
  } = params;
  const cursorEnabledForParams = isCursorAllowed(params);
  const hideCursorOnFinish = shouldHideCursorWhenFinished(params);
  
  // printSpeed теперь интерпретируем как общую длительность печати всех строк.
  // Чтобы сохранить относительные временные соотношения и упростить логику,
  // печать одной строки занимает долю от общего времени пропорционально количеству строк.
  // При одной строке поведение остаётся прежним.
  const linesCount = Array.isArray(lines) ? lines.length : 0;
  const perLinePrintDuration = linesCount > 0 ? printSpeed / linesCount : printSpeed;
  
  const isReplacingMode = !multiLine && lines.length > 1;
  const lastLineIndex = lines.length - 1;
  
  return lines.map((line, index) => {
    if (!line) return null;
    
    // Вычисляем позицию строки
    const y = isReplacingMode ? startY : startY + index * fontSize * lineHeight;
    const textWidth = computeTextWidth(line, fontSize, letterSpacing);
    const startX = computeTextX(line, fontSize, horizontalAlign, width, paddingX, letterSpacing);
    
    // Параметры анимации
    const printDuration = perLinePrintDuration;
    const eraseDuration = line.length * eraseSpeed;
    
    const pathId = `path${index}`;
    const animateId = `d${index}`;
    
    let animationParams;
    
    // Выбираем режим вычисления в зависимости от типа анимации
    if (isReplacingMode) {
      animationParams = calculateReplacingModeLineAnimation({
        line, index, lastLineIndex, startX, y, textWidth,
        printDuration, eraseDuration, delayAfterBlockPrint, delayAfterErase,
        repeat, eraseMode, fontSize, letterSpacing, eraseSpeed
      });
    } else if (multiLine) {
      animationParams = calculateMultiLineModeLineAnimation({
        line, index, lines, startX, y, textWidth,
        printDuration, eraseSpeed, delayAfterBlockPrint, delayAfterErase,
        repeat, eraseMode, fontSize, letterSpacing
      });
    } else {
      animationParams = calculateSingleLineModeAnimation({
        startX, y, textWidth, printDuration, eraseDuration,
        delayAfterBlockPrint, delayAfterErase, repeat, eraseMode,
        line, fontSize, letterSpacing, eraseSpeed
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

