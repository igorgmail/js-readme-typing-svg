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
  
  // Добавляем # к цветам если нужно
  const color = params.color === 'transparent' ? params.color : 
    (params.color.startsWith('#') ? params.color : '#' + params.color);
  const background = params.background === 'transparent' ? params.background : 
    (params.background.startsWith('#') ? params.background : '#' + params.background);
  
  // Вычисляем startY для вертикального выравнивания
  const totalTextHeight = params.multiLine 
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
  const repeat = params.repeat === true || params.repeat === 'true';
  
  // Генерируем пути и текстовые элементы с анимацией
  let pathsAndTexts = '';
  
  // Определяем, как обрабатывать строки
  // Если multiLine = false и строк несколько - заменяем друг друга на том же месте
  // Если multiLine = true - выводим друг под другом
  const isReplacingMode = !params.multiLine && lines.length > 1;
  
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
    
    if (isReplacingMode) {
      // Режим замены: все строки имеют одинаковую структуру
      if (repeat) {
        // При repeat=true: все строки стираются, цикл повторяется бесконечно
        totalDuration = printDuration + delayAfterBlockPrint + eraseDuration + delayAfterErase;
        
        // Вычисляем моменты времени в долях от общей длительности
        const printEnd = printDuration / totalDuration;
        const eraseStart = (printDuration + delayAfterBlockPrint) / totalDuration;
        const eraseEnd = (printDuration + delayAfterBlockPrint + eraseDuration) / totalDuration;
        
        // keyTimes: начало, конец печати, начало стирания, конец стирания, конец
        keyTimes = `0;${printEnd};${eraseStart};${eraseEnd};1`;
        // pathValues: начальная точка (0), полная длина (печать), полная длина (пауза), 0 (стирание), 0 (пауза после стирания)
        pathValues = `m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h0 ; m${startX},${y} h0`;
        
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
          
          const printEnd = printDuration / totalDuration;
          const eraseStart = (printDuration + delayAfterBlockPrint) / totalDuration;
          const eraseEnd = (printDuration + delayAfterBlockPrint + eraseDuration) / totalDuration;
          
          keyTimes = `0;${printEnd};${eraseStart};${eraseEnd};1`;
          pathValues = `m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h0 ; m${startX},${y} h0`;
          
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
    } else if (params.multiLine) {
      // Многострочный режим: строки печатаются последовательно, стирание только после всех строк
      const isLastLineMulti = i === lines.length - 1;
      const lastLineIndex = lines.length - 1;
      
      // Вычисляем время начала печати этой строки (сумма длительностей всех предыдущих строк)
      const timeBeforeThisLine = i * (printDuration + delayAfterBlockPrint);
      
      if (repeat) {
        // При repeat=true: все строки печатаются, затем стираются (в зависимости от eraseMode)
        const totalPrintTime = lines.length * (printDuration + delayAfterBlockPrint);
        const eraseMode = params.eraseMode || 'none';
        
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
          
          const printStart = timeBeforeThisLine / totalDuration;
          const printEnd = (timeBeforeThisLine + printDuration) / totalDuration;
          const eraseStart = eraseStartTime / totalDuration;
          const eraseEnd = (eraseStartTime + thisEraseDuration) / totalDuration;
          
          keyTimes = `0;${printStart};${printEnd};${eraseStart};${eraseEnd};1`;
          pathValues = `m${startX},${y} h0 ; m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h0 ; m${startX},${y} h0`;
        } else if (eraseMode === 'block-line') {
          // Стирание всех строк одновременно (блоком)
          const totalEraseDuration = lines.reduce((sum, l) => sum + l.length * eraseSpeed, 0);
          totalDuration = totalPrintTime + totalEraseDuration + delayAfterErase;
          
          const printStart = timeBeforeThisLine / totalDuration;
          const printEnd = (timeBeforeThisLine + printDuration) / totalDuration;
          const eraseStart = (totalPrintTime) / totalDuration;
          const eraseEnd = (totalPrintTime + totalEraseDuration) / totalDuration;
          
          keyTimes = `0;${printStart};${printEnd};${eraseStart};${eraseEnd};1`;
          pathValues = `m${startX},${y} h0 ; m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h0 ; m${startX},${y} h0`;
        } else if (eraseMode === 'none') {
          // Без анимации стирания - текст просто исчезает мгновенно
          // Общая длительность: время печати всех строк + небольшая пауза перед новым циклом
          totalDuration = totalPrintTime + delayAfterErase;
          
          const printStart = timeBeforeThisLine / totalDuration;
          const printEnd = (timeBeforeThisLine + printDuration) / totalDuration;
          
          // keyTimes: задержка -> печать -> остается -> мгновенное исчезновение
          keyTimes = `0;${printStart};${printEnd};0.99;1`;
          pathValues = `m${startX},${y} h0 ; m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h0`;
        } else {
          // По умолчанию используем 'block-line' (стирание всех строк одновременно)
          const totalEraseDuration = lines.reduce((sum, l) => sum + l.length * eraseSpeed, 0);
          totalDuration = totalPrintTime + totalEraseDuration + delayAfterErase;
          
          const printStart = timeBeforeThisLine / totalDuration;
          const printEnd = (timeBeforeThisLine + printDuration) / totalDuration;
          const eraseStart = (totalPrintTime) / totalDuration;
          const eraseEnd = (totalPrintTime + totalEraseDuration) / totalDuration;
          
          keyTimes = `0;${printStart};${printEnd};${eraseStart};${eraseEnd};1`;
          pathValues = `m${startX},${y} h0 ; m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h0 ; m${startX},${y} h0`;
        }
        
        // Все строки начинаются одновременно, цикл повторяется после завершения последней
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
        
        // Все строки начинаются одновременно
        begin = '0s';
      }
    } else {
      // Одна строка: печать -> пауза
      totalDuration = printDuration + delayAfterBlockPrint;
      
      const printEnd = printDuration / totalDuration;
      
      if (repeat) {
        // Если repeat = true: печать -> пауза -> возврат к началу для повторения
        keyTimes = `0;${printEnd};1;1`;
        pathValues = `m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h0`;
      } else {
        // Если repeat = false: печать -> пауза -> остается на месте (без возврата)
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
      } else if (params.multiLine) {
        // Многострочный режим без repeat - строки остаются на месте (без стирания)
        fillValue = 'freeze';
      } else if (!isReplacingMode && !params.multiLine) {
        // Одна строка без repeat - остается
        fillValue = 'freeze';
      }
    }
    // При repeat=true все используют remove для зацикливания
    
    pathsAndTexts += `
    <path id="${pathId}">
      <animate id="${animateId}" attributeName="d" begin="${begin}"
        dur="${totalDuration}ms" fill="${fillValue}"
        values="${pathValues}" keyTimes="${keyTimes}" />
    </path>
    <text font-family="${params.fontFamily || 'monospace'}" fill="${color}" font-size="${params.fontSize}" font-weight="${params.fontWeight || 800}"
      dominant-baseline="auto" x="0%" text-anchor="start" letter-spacing="${letterSpacingValue}">
      <textPath xlink:href="#${pathId}">
        ${escapeXml(line)}
      </textPath>
    </text>`;
  });
  
  // Генерируем SVG с SMIL анимацией
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    width="${params.width}" height="${params.height}" viewBox="0 0 ${params.width} ${params.height}">
  <rect width="${params.width}" height="${params.height}" fill="${background}"/>
  
  <g id="text-container">${pathsAndTexts}
  </g>
</svg>`;

  return svg;
}

