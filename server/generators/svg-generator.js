/**
 * Генератор SVG с SMIL анимацией эффекта печатающегося текста
 */

import { parseLines } from '../../shared/variables.js';

/**
 * Экранирование спецсимволов для XML/SVG
 */
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Конвертирует hexa цвет (8 символов) в rgba формат
 * @param {string} hexa - цвет в формате #RRGGBBAA или RRGGBBAA
 * @returns {string} цвет в формате rgba(r, g, b, a)
 */
function hexaToRgba(hexa) {
  // Убираем # если есть
  const hex = hexa.replace('#', '');
  
  if (hex.length !== 8) {
    return hexa; // Возвращаем как есть, если не hexa формат
  }
  
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const a = parseInt(hex.substr(6, 2), 16) / 255;
  
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

/**
 * Обрабатывает background цвет для SVG
 * @param {string} background - цвет фона (transparent, hex, hexa)
 * @returns {{fill: string, style: string}} объект с fill и style атрибутами
 */
function processBackground(background) {
  if (background === 'transparent') {
    return { fill: 'none', style: '' };
  }
  
  // Убираем # для проверки длины
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
function parseLetterSpacing(letterSpacing, fontSize) {
  if (typeof letterSpacing === 'number') {
    return letterSpacing;
  }
  if (letterSpacing === 'normal' || !letterSpacing) {
    return 0;
  }
  // Парсим строковые значения типа '10px', '0.1em'
  const str = String(letterSpacing).trim();
  if (str.endsWith('px')) {
    return parseFloat(str) || 0;
  }
  if (str.endsWith('em')) {
    return (parseFloat(str) || 0) * fontSize;
  }
  // Пытаемся распарсить как число
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
function computeTextWidth(text, fontSize, letterSpacing) {
  const charWidth = fontSize * 0.6; // примерная ширина символа в monospace
  const spacing = parseLetterSpacing(letterSpacing, fontSize);
  // Ширина = сумма ширин символов + расстояние между символами * (количество символов - 1)
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
function computeTextX(text, fontSize, horizontalAlign, width, paddingX, letterSpacing) {
  const textWidth = computeTextWidth(text, fontSize, letterSpacing);
  
  if (horizontalAlign === 'left') return paddingX;
  if (horizontalAlign === 'right') return width - paddingX - textWidth;
  return (width - textWidth) / 2; // center
}

/**
 * Вычисляет временные метки для fade эффекта стирания
 * @param {number} printDuration - длительность печати
 * @param {number} delayAfterBlockPrint - задержка после печати
 * @param {number} eraseDuration - длительность стирания
 * @param {number} delayAfterErase - задержка после стирания
 * @param {number} totalDuration - общая длительность
 * @returns {{start: number, end: number}} временные метки начала и конца fade
 */
function computeFadeEraseTimes(printDuration, delayAfterBlockPrint, eraseDuration, delayAfterErase, totalDuration) {
  const start = (printDuration + delayAfterBlockPrint) / totalDuration;
  const end = (printDuration + delayAfterBlockPrint + eraseDuration) / totalDuration;
  return { start, end };
}

/**
 * Обработчик режима стирания 'fade' для режима замены
 * @param {Object} config - конфигурация анимации
 * @returns {Object} параметры анимации
 */
function handleFadeEraseReplacingMode(config) {
  const {
    startX, y, textWidth, printDuration, delayAfterBlockPrint,
    eraseDuration, delayAfterErase, totalDuration
  } = config;
  
  const printEnd = printDuration / totalDuration;
  const fadeTimes = computeFadeEraseTimes(printDuration, delayAfterBlockPrint, eraseDuration, delayAfterErase, totalDuration);
  
  return {
    useFadeErase: true,
    fadeEraseStart: fadeTimes.start,
    fadeEraseEnd: fadeTimes.end,
    keyTimes: `0;${printEnd};${fadeTimes.start};${fadeTimes.end};1`,
    pathValues: `m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth}`
  };
}

/**
 * Обработчик режима стирания 'line' для режима замены
 * @param {Object} config - конфигурация анимации
 * @returns {Object} параметры анимации
 */
function handleLineEraseReplacingMode(config) {
  const {
    startX, y, textWidth, printDuration, delayAfterBlockPrint,
    eraseDuration, delayAfterErase, totalDuration
  } = config;
  
  const printEnd = printDuration / totalDuration;
  const fadeTimes = computeFadeEraseTimes(printDuration, delayAfterBlockPrint, eraseDuration, delayAfterErase, totalDuration);
  
  return {
    useFadeErase: false,
    fadeEraseStart: 0,
    fadeEraseEnd: 0,
    keyTimes: `0;${printEnd};${fadeTimes.start};${fadeTimes.end};1`,
    pathValues: `m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h0 ; m${startX},${y} h0`
  };
}

/**
 * Обработчик режима стирания 'line' для многострочного режима
 * @param {Object} config - конфигурация анимации
 * @returns {Object} параметры анимации
 */
function handleLineEraseMultiLineMode(config) {
  const {
    startX, y, textWidth, printStart, printEnd, eraseStart, eraseEnd
  } = config;
  
  return {
    useFadeErase: false,
    fadeEraseStart: 0,
    fadeEraseEnd: 0,
    keyTimes: `0;${printStart};${printEnd};${eraseStart};${eraseEnd};1`,
    pathValues: `m${startX},${y} h0 ; m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h0 ; m${startX},${y} h0`
  };
}

/**
 * Обработчик режима стирания 'block-line' для многострочного режима
 * @param {Object} config - конфигурация анимации
 * @returns {Object} параметры анимации
 */
function handleBlockLineEraseMultiLineMode(config) {
  const {
    startX, y, textWidth, printStart, printEnd, eraseStart, eraseEnd
  } = config;
  
  return {
    useFadeErase: false,
    fadeEraseStart: 0,
    fadeEraseEnd: 0,
    keyTimes: `0;${printStart};${printEnd};${eraseStart};${eraseEnd};1`,
    pathValues: `m${startX},${y} h0 ; m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h0 ; m${startX},${y} h0`
  };
}

/**
 * Обработчик режима стирания 'none' для многострочного режима
 * @param {Object} config - конфигурация анимации
 * @returns {Object} параметры анимации
 */
function handleNoneEraseMultiLineMode(config) {
  const {
    startX, y, textWidth, printStart, printEnd
  } = config;
  
  return {
    useFadeErase: false,
    fadeEraseStart: 0,
    fadeEraseEnd: 0,
    keyTimes: `0;${printStart};${printEnd};0.99;1`,
    pathValues: `m${startX},${y} h0 ; m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h0`
  };
}

/**
 * Обработчик режима стирания 'fade' для многострочного режима
 * @param {Object} config - конфигурация анимации
 * @returns {Object} параметры анимации
 */
function handleFadeEraseMultiLineMode(config) {
  const {
    startX, y, textWidth, printStart, printEnd, eraseStart, eraseEnd
  } = config;
  
  return {
    useFadeErase: true,
    fadeEraseStart: eraseStart,
    fadeEraseEnd: eraseEnd,
    keyTimes: `0;${printStart};${printEnd};${eraseStart};${eraseEnd};1`,
    pathValues: `m${startX},${y} h0 ; m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth}`
  };
}

/**
 * Обработчик режима стирания 'fade' для одной строки
 * @param {Object} config - конфигурация анимации
 * @returns {Object} параметры анимации
 */
function handleFadeEraseSingleLineMode(config) {
  const {
    startX, y, textWidth, printDuration, delayAfterBlockPrint,
    eraseDuration, delayAfterErase, totalDuration
  } = config;
  
  const printEnd = printDuration / totalDuration;
  const fadeTimes = computeFadeEraseTimes(printDuration, delayAfterBlockPrint, eraseDuration, delayAfterErase, totalDuration);
  
  return {
    useFadeErase: true,
    fadeEraseStart: fadeTimes.start,
    fadeEraseEnd: fadeTimes.end,
    keyTimes: `0;${printEnd};${fadeTimes.start};${fadeTimes.end};1`,
    pathValues: `m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth}`
  };
}

/**
 * Применяет параметры анимации стирания для режима замены
 * @param {Object} config - конфигурация анимации
 * @returns {Object} параметры анимации
 */
function applyEraseModeReplacingMode(config) {
  const { eraseMode = 'line' } = config;
  
  if (eraseMode === 'fade') {
    return handleFadeEraseReplacingMode(config);
  }
  
  return handleLineEraseReplacingMode(config);
}

/**
 * Применяет параметры анимации стирания для многострочного режима
 * @param {Object} config - конфигурация анимации
 * @returns {Object} параметры анимации
 */
function applyEraseModeMultiLineMode(config) {
  const { eraseMode = 'none' } = config;
  
  const handlers = {
    'line': handleLineEraseMultiLineMode,
    'block-line': handleBlockLineEraseMultiLineMode,
    'none': handleNoneEraseMultiLineMode,
    'fade': handleFadeEraseMultiLineMode
  };
  
  const handler = handlers[eraseMode] || handlers['block-line'];
  return handler(config);
}

/**
 * Применяет параметры анимации стирания для одной строки
 * @param {Object} config - конфигурация анимации
 * @returns {Object} параметры анимации
 */
function applyEraseModeSingleLineMode(config) {
  const { eraseMode = 'line' } = config;
  
  if (eraseMode === 'fade') {
    return handleFadeEraseSingleLineMode(config);
  }
  
  // Для других режимов используется стандартная логика без fade
  const {
    startX, y, textWidth, printDuration, totalDuration
  } = config;
  
  const printEnd = printDuration / totalDuration;
  
  return {
    useFadeErase: false,
    fadeEraseStart: 0,
    fadeEraseEnd: 0,
    keyTimes: `0;${printEnd};1;1`,
    pathValues: `m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h0`
  };
}

/**
 * Генерирует SVG код с SMIL анимацией печатающегося текста
 * @param {Object} params - параметры генерации
 * @returns {string} SVG код
 */
export function generateSVG(params) {
  // params.lines уже должен быть массивом после парсинга и применения дефолтов
  // Но на всякий случай обрабатываем и строку (для обратной совместимости)
  const rawLines = Array.isArray(params.lines) 
    ? params.lines 
    : (typeof params.lines === 'string' 
      ? params.lines.split(';').map(l => l.trim()).filter(l => l)
      : []);
  
  // Парсим переменные в строках ($DATE, $RELDATE)
  const lines = parseLines(rawLines);
  
  if (lines.length === 0) {
    lines.push('Add ?lines=Your+text+here');
  }
  
  // Приводим multiLine и repeat к boolean на случай, если пришли строки
  const multiLine = params.multiLine === true || params.multiLine === 'true' || params.multiLine === '1';
  const repeat = params.repeat === true || params.repeat === 'true' || params.repeat === '1';
  
  // Отладка: проверяем параметры
  console.log('generateSVG params:', {
    multiLine: params.multiLine,
    multiLineBool: multiLine,
    repeat: params.repeat,
    repeatBool: repeat,
    linesCount: lines.length,
    eraseMode: params.eraseMode
  });
  
  // Добавляем # к цветам если нужно
  const color = params.color === 'transparent' ? params.color : 
    (params.color.startsWith('#') ? params.color : '#' + params.color);
  
  // Обрабатываем background (может быть transparent, hex или hexa)
  const backgroundValue = params.background === 'transparent' ? params.background : 
    (params.background.startsWith('#') ? params.background : '#' + params.background);
  const background = processBackground(backgroundValue);
  
  // Вычисляем startY для вертикального выравнивания
  const totalTextHeight = multiLine 
    ? lines.length * params.fontSize * params.lineHeight 
    : params.fontSize;
  
  let startY = params.paddingY;
  if (params.verticalAlign === 'middle') {
    startY = (params.height - totalTextHeight) / 2 + params.fontSize;
  } else if (params.verticalAlign === 'bottom') {
    startY = params.height - totalTextHeight + params.fontSize / 2;
  }
  
  // Параметры анимации
  // printSpeed - общая длительность анимации печати строки в миллисекундах (duration)
  const printSpeed = params.printSpeed || 5000;
  const eraseSpeed = params.eraseSpeed || 50;
  const delayAfterBlockPrint = params.delayAfterBlockPrint || 800;
  const delayAfterErase = params.delayAfterErase || 500;
  
  // Генерируем пути и текстовые элементы с анимацией
  let pathsAndTexts = '';
  
  // Определяем, как обрабатывать строки
  // Если multiLine = false и строк несколько - заменяем друг друга на том же месте
  // Если multiLine = true - выводим друг под другом
  const isReplacingMode = !multiLine && lines.length > 1;
  
  lines.forEach((line, i) => {
    if (!line) return;
    
    // Для режима замены все строки на одной Y координате
    // Для многострочного режима - каждая строка на своей позиции
    const y = isReplacingMode ? startY : startY + i * params.fontSize * params.lineHeight;
    const letterSpacing = params.letterSpacing || 'normal';
    // Форматируем letterSpacing для SVG: если число - добавляем 'px', иначе оставляем как есть
    const letterSpacingValue = typeof letterSpacing === 'number' 
      ? `${letterSpacing}px` 
      : (letterSpacing || 'normal');
    const textWidth = computeTextWidth(line, params.fontSize, letterSpacing);
    const startX = computeTextX(line, params.fontSize, params.horizontalAlign, params.width, params.paddingX, letterSpacing);
    
    // Длительность анимации печати и стирания
    // printSpeed теперь это общая длительность анимации строки (duration в мс)
    const printDuration = printSpeed;
    const eraseDuration = line.length * eraseSpeed;
    
    const pathId = `path${i}`;
    const animateId = `d${i}`;
    
    // Определяем, последняя ли это строка в режиме замены
    const isLastLine = isReplacingMode && i === lines.length - 1;
    const lastLineIndex = lines.length - 1;
    
    let pathValues, keyTimes, totalDuration, begin;
    let useFadeErase = false; // Флаг для fade режима стирания
    let fadeEraseStart = 0; // Начало fade анимации (в долях от общей длительности)
    let fadeEraseEnd = 0; // Конец fade анимации (в долях от общей длительности)
    
    if (isReplacingMode) {
      // Режим замены: все строки имеют одинаковую структуру
      if (repeat) {
        // При repeat=true: все строки стираются, цикл повторяется бесконечно
        totalDuration = printDuration + delayAfterBlockPrint + eraseDuration + delayAfterErase;
        
        const eraseConfig = {
          startX, y, textWidth, printDuration, delayAfterBlockPrint,
          eraseDuration, delayAfterErase, totalDuration, eraseMode: params.eraseMode
        };
        
        const eraseResult = applyEraseModeReplacingMode(eraseConfig);
        useFadeErase = eraseResult.useFadeErase;
        fadeEraseStart = eraseResult.fadeEraseStart;
        fadeEraseEnd = eraseResult.fadeEraseEnd;
        keyTimes = eraseResult.keyTimes;
        pathValues = eraseResult.pathValues;
        
        // Начало анимации: первая строка начинается с 0s и после завершения последней строки
        // Остальные строки начинаются после завершения предыдущей
        if (i === 0) {
          begin = `0s;d${lastLineIndex}.end`;
        } else {
          begin = `d${i - 1}.end`;
        }
      } else {
        // При repeat=false: не последняя строка стирается, последняя остается
        if (!isLastLine) {
          // Не последняя строка: печать -> пауза -> стирание -> пауза после стирания
          totalDuration = printDuration + delayAfterBlockPrint + eraseDuration + delayAfterErase;
          
          const eraseConfig = {
            startX, y, textWidth, printDuration, delayAfterBlockPrint,
            eraseDuration, delayAfterErase, totalDuration, eraseMode: params.eraseMode
          };
          
          const eraseResult = applyEraseModeReplacingMode(eraseConfig);
          useFadeErase = eraseResult.useFadeErase;
          fadeEraseStart = eraseResult.fadeEraseStart;
          fadeEraseEnd = eraseResult.fadeEraseEnd;
          keyTimes = eraseResult.keyTimes;
          pathValues = eraseResult.pathValues;
          
          begin = i === 0 ? '0s' : `d${i - 1}.end`;
        } else {
          // Последняя строка: печать -> пауза -> остается на месте
          totalDuration = printDuration + delayAfterBlockPrint;
          
          const printEnd = printDuration / totalDuration;
          
          keyTimes = `0;${printEnd};1`;
          pathValues = `m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth}`;
          
          begin = i === 0 ? '0s' : `d${i - 1}.end`;
        }
      }
    } else if (multiLine) {
      // Многострочный режим: строки печатаются последовательно, стирание только после всех строк
      const isLastLineMulti = i === lines.length - 1;
      const lastLineIndex = lines.length - 1;
      
      // Вычисляем время начала печати этой строки (сумма длительностей всех предыдущих строк)
      const timeBeforeThisLine = i * (printDuration + delayAfterBlockPrint);
      
      if (repeat) {
        // При repeat=true: все строки печатаются, затем стираются (в зависимости от eraseMode)
        const totalPrintTime = lines.length * (printDuration + delayAfterBlockPrint);
        const eraseMode = params.eraseMode || 'none';
        
        let printStart, printEnd, eraseStart, eraseEnd;
        
        if (eraseMode === 'line') {
          // Стирание построчно, начиная с последней строки
          // Вычисляем время начала стирания для каждой строки (начиная с последней)
          
          // Время начала стирания этой строки = время печати всех + время стирания всех предыдущих (в обратном порядке)
          let eraseStartTime = totalPrintTime;
          // Проходим по всем строкам после текущей (в обратном порядке, начиная с последней)
          for (let j = lastLineIndex; j > i; j--) {
            eraseStartTime += lines[j].length * eraseSpeed;
            // Добавляем паузу после стирания каждой строки (пауза есть между всеми строками)
            eraseStartTime += delayAfterErase;
          }
          
          // Длительность стирания этой строки
          const thisEraseDuration = line.length * eraseSpeed;
          const totalEraseDuration = lines.reduce((sum, l) => sum + l.length * eraseSpeed, 0);
          // Паузы между стиранием строк (количество пауз = количество строк - 1)
          const totalErasePauses = (lines.length - 1) * delayAfterErase;
          
          // Общая длительность цикла: печать всех + стирание всех + паузы между стиранием + пауза после стирания последней
          totalDuration = totalPrintTime + totalEraseDuration + totalErasePauses + delayAfterErase;
          
          printStart = timeBeforeThisLine / totalDuration;
          printEnd = (timeBeforeThisLine + printDuration) / totalDuration;
          eraseStart = eraseStartTime / totalDuration;
          eraseEnd = (eraseStartTime + thisEraseDuration) / totalDuration;
        } else {
          // Для остальных режимов вычисляем общие параметры
          const totalEraseDuration = lines.reduce((sum, l) => sum + l.length * eraseSpeed, 0);
          totalDuration = totalPrintTime + totalEraseDuration + delayAfterErase;
          
          printStart = timeBeforeThisLine / totalDuration;
          printEnd = (timeBeforeThisLine + printDuration) / totalDuration;
          eraseStart = (totalPrintTime) / totalDuration;
          eraseEnd = (totalPrintTime + totalEraseDuration) / totalDuration;
        }
        
        const eraseConfig = {
          startX, y, textWidth, printStart, printEnd, eraseStart, eraseEnd,
          eraseMode: params.eraseMode
        };
        
        const eraseResult = applyEraseModeMultiLineMode(eraseConfig);
        useFadeErase = eraseResult.useFadeErase;
        fadeEraseStart = eraseResult.fadeEraseStart;
        fadeEraseEnd = eraseResult.fadeEraseEnd;
        keyTimes = eraseResult.keyTimes;
        pathValues = eraseResult.pathValues;
        
        // В многострочном режиме строки начинаются одновременно, задержка через keyTimes
        // Цикл повторяется после завершения последней строки
        begin = i === 0 ? `0s;d${lastLineIndex}.end` : `0s;d${lastLineIndex}.end`;
      } else {
        // При repeat=false: все строки печатаются последовательно и остаются на месте (без стирания)
        // Общая длительность: время печати всех строк
        const totalPrintTime = lines.length * (printDuration + delayAfterBlockPrint);
        totalDuration = totalPrintTime;
        
        const printStart = timeBeforeThisLine / totalDuration;
        const printEnd = (timeBeforeThisLine + printDuration) / totalDuration;
        
        // keyTimes: задержка -> печать -> остается на месте
        keyTimes = `0;${printStart};${printEnd};1`;
        pathValues = `m${startX},${y} h0 ; m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth}`;
        
        // В многострочном режиме строки начинаются одновременно, задержка через keyTimes
        begin = '0s';
      }
    } else {
      // Одна строка: печать -> пауза
      if (repeat) {
        // Если repeat = true: печать -> пауза -> стирание для повторения
        totalDuration = printDuration + delayAfterBlockPrint + eraseDuration + delayAfterErase;
        
        const eraseConfig = {
          startX, y, textWidth, printDuration, delayAfterBlockPrint,
          eraseDuration, delayAfterErase, totalDuration, eraseMode: params.eraseMode
        };
        
        const eraseResult = applyEraseModeSingleLineMode(eraseConfig);
        useFadeErase = eraseResult.useFadeErase;
        fadeEraseStart = eraseResult.fadeEraseStart;
        fadeEraseEnd = eraseResult.fadeEraseEnd;
        keyTimes = eraseResult.keyTimes;
        pathValues = eraseResult.pathValues;
      } else {
        // Если repeat = false: печать -> пауза -> остается на месте (без возврата)
        totalDuration = printDuration + delayAfterBlockPrint;
        const printEnd = printDuration / totalDuration;
        keyTimes = `0;${printEnd};1`;
        pathValues = `m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth}`;
      }
      
      // Одна строка - повторяем только если repeat = true
      begin = repeat ? `0s;${animateId}.end` : '0s';
    }
    
    // Определяем fill атрибут
    let fillValue = 'remove';
    if (!repeat) {
      if (isReplacingMode && isLastLine) {
        // Режим замены, последняя строка без repeat - остается
        fillValue = 'freeze';
      } else if (multiLine) {
        // Многострочный режим без repeat - строки остаются на месте (без стирания)
        fillValue = 'freeze';
      } else if (!isReplacingMode && !multiLine) {
        // Одна строка без repeat - остается
        fillValue = 'freeze';
      }
    }
    // При repeat=true все используют remove для зацикливания
    
    // Генерируем анимацию opacity для fade эффекта
    let opacityAnimation = '';
    if (useFadeErase) {
      const opacityId = `opacity${i}`;
      const opacityKeyTimes = `0;${fadeEraseStart};${fadeEraseEnd};1`;
      const opacityValues = '1;1;0;0'; // Полная непрозрачность до начала стирания, затем затухание до 0
      opacityAnimation = `
      <animate id="${opacityId}" attributeName="opacity" begin="${begin}"
        dur="${totalDuration}ms" fill="${fillValue}"
        values="${opacityValues}" keyTimes="${opacityKeyTimes}" />`;
    }
    
    pathsAndTexts += `
    <path id="${pathId}">
      <animate id="${animateId}" attributeName="d" begin="${begin}"
        dur="${totalDuration}ms" fill="${fillValue}"
        values="${pathValues}" keyTimes="${keyTimes}" />
    </path>
    <text font-family="${params.fontFamily || 'monospace'}" fill="${color}" font-size="${params.fontSize}" font-weight="${params.fontWeight || 800}"
      dominant-baseline="auto" x="0%" text-anchor="start" letter-spacing="${letterSpacingValue}"${useFadeErase ? ' opacity="1"' : ''}>${opacityAnimation}
      <textPath xlink:href="#${pathId}">
        ${escapeXml(line)}
      </textPath>
    </text>`;
  });
  
  // Генерируем SVG с SMIL анимацией
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    width="${params.width}" height="${params.height}" viewBox="0 0 ${params.width} ${params.height}" ${background.style}>
  <rect width="${params.width}" height="${params.height}" fill="${background.fill}"/>
  
  <g id="text-container">${pathsAndTexts}
  </g>
</svg>`;

  return svg;
}

