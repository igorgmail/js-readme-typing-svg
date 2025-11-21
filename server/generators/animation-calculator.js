/**
 * Калькулятор параметров анимации для различных режимов работы
 */

import { computeTextWidth, computeTextX, formatLetterSpacingForSVG } from './utils/text-utils.js';
import { getEraseMode } from './erase-modes/index.js';

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
    repeat, eraseMode
  } = config;
  
  const isLastLine = index === lastLineIndex;
  const eraseModeInstance = getEraseMode(eraseMode);
  
  let totalDuration, begin, keyTimes, pathValues, useFadeErase, fadeEraseStart, fadeEraseEnd;
  
  if (repeat) {
    // При repeat=true: все строки стираются, цикл повторяется бесконечно
    totalDuration = printDuration + delayAfterBlockPrint + eraseDuration + delayAfterErase;
    
    const eraseConfig = {
      startX, y, textWidth, printDuration, delayAfterBlockPrint,
      eraseDuration, delayAfterErase, totalDuration
    };
    
    const eraseResult = eraseModeInstance.calculateReplacingMode(eraseConfig);
    ({ useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues } = eraseResult);
    
    // Начало анимации: первая строка начинается с 0s и после завершения последней строки
    begin = index === 0 ? `0s;d${lastLineIndex}.end` : `d${index - 1}.end`;
  } else {
    // При repeat=false: не последняя строка стирается, последняя остается
    if (!isLastLine) {
      totalDuration = printDuration + delayAfterBlockPrint + eraseDuration + delayAfterErase;
      
      const eraseConfig = {
        startX, y, textWidth, printDuration, delayAfterBlockPrint,
        eraseDuration, delayAfterErase, totalDuration
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
    repeat, eraseMode
  } = config;
  
  const lastLineIndex = lines.length - 1;
  const timeBeforeThisLine = index * (printDuration + delayAfterBlockPrint);
  
  let totalDuration, begin, keyTimes, pathValues, useFadeErase, fadeEraseStart, fadeEraseEnd;
  
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
    } else {
      const totalEraseDuration = lines.reduce((sum, l) => sum + l.length * eraseSpeed, 0);
      totalDuration = totalPrintTime + totalEraseDuration + delayAfterErase;
      
      printStart = timeBeforeThisLine / totalDuration;
      printEnd = (timeBeforeThisLine + printDuration) / totalDuration;
      eraseStart = totalPrintTime / totalDuration;
      eraseEnd = (totalPrintTime + totalEraseDuration) / totalDuration;
    }
    
    const eraseConfig = {
      startX, y, textWidth, printStart, printEnd, eraseStart, eraseEnd
    };
    
    const eraseResult = eraseModeInstance.calculateMultiLineMode(eraseConfig);
    ({ useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues } = eraseResult);
    
    begin = `0s;d${lastLineIndex}.end`;
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
 * Вычисляет параметры анимации для одной строки (single line mode)
 * @param {Object} config - конфигурация анимации
 * @returns {Object} параметры анимации для строки
 */
function calculateSingleLineModeAnimation(config) {
  const {
    startX, y, textWidth, printDuration, eraseDuration,
    delayAfterBlockPrint, delayAfterErase, repeat, eraseMode
  } = config;
  
  const eraseModeInstance = getEraseMode(eraseMode);
  
  let totalDuration, begin, keyTimes, pathValues, useFadeErase, fadeEraseStart, fadeEraseEnd;
  
  if (repeat) {
    totalDuration = printDuration + delayAfterBlockPrint + eraseDuration + delayAfterErase;
    
    const eraseConfig = {
      startX, y, textWidth, printDuration, delayAfterBlockPrint,
      eraseDuration, delayAfterErase, totalDuration
    };
    
    const eraseResult = eraseModeInstance.calculateSingleLineMode(eraseConfig);
    ({ useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues } = eraseResult);
    
    begin = '0s;d0.end';
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
    fontFamily, color, fontWeight
  } = params;
  
  const isReplacingMode = !multiLine && lines.length > 1;
  const lastLineIndex = lines.length - 1;
  
  return lines.map((line, index) => {
    if (!line) return null;
    
    // Вычисляем позицию строки
    const y = isReplacingMode ? startY : startY + index * fontSize * lineHeight;
    const textWidth = computeTextWidth(line, fontSize, letterSpacing);
    const startX = computeTextX(line, fontSize, horizontalAlign, width, paddingX, letterSpacing);
    
    // Параметры анимации
    const printDuration = printSpeed;
    const eraseDuration = line.length * eraseSpeed;
    
    const pathId = `path${index}`;
    const animateId = `d${index}`;
    
    let animationParams;
    
    // Выбираем режим вычисления в зависимости от типа анимации
    if (isReplacingMode) {
      animationParams = calculateReplacingModeLineAnimation({
        line, index, lastLineIndex, startX, y, textWidth,
        printDuration, eraseDuration, delayAfterBlockPrint, delayAfterErase,
        repeat, eraseMode
      });
    } else if (multiLine) {
      animationParams = calculateMultiLineModeLineAnimation({
        line, index, lines, startX, y, textWidth,
        printDuration, eraseSpeed, delayAfterBlockPrint, delayAfterErase,
        repeat, eraseMode
      });
    } else {
      animationParams = calculateSingleLineModeAnimation({
        startX, y, textWidth, printDuration, eraseDuration,
        delayAfterBlockPrint, delayAfterErase, repeat, eraseMode
      });
    }
    
    // Формируем итоговый объект с параметрами для рендера
    return {
      index,
      pathId,
      animateId,
      line,
      fontFamily,
      color,
      fontSize,
      fontWeight,
      letterSpacingValue: formatLetterSpacingForSVG(letterSpacing),
      ...animationParams
    };
  }).filter(Boolean);
}

