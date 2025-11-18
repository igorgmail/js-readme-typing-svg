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
 * Вычисляет приблизительную ширину текста
 * @param {string} text - текст
 * @param {number} fontSize - размер шрифта
 * @returns {number} ширина текста
 */
function computeTextWidth(text, fontSize) {
  const charWidth = fontSize * 0.6; // примерная ширина символа в monospace
  return text.length * charWidth;
}

/**
 * Вычисляет позицию X для текста в зависимости от выравнивания
 * @param {string} text - текст
 * @param {number} fontSize - размер шрифта
 * @param {string} horizontalAlign - выравнивание (left, center, right)
 * @param {number} width - ширина SVG
 * @param {number} paddingX - горизонтальный отступ
 * @returns {number} позиция X
 */
function computeTextX(text, fontSize, horizontalAlign, width, paddingX) {
  const textWidth = computeTextWidth(text, fontSize);
  
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
  const printSpeed = params.printSpeed || 80;
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
    const textWidth = computeTextWidth(line, params.fontSize);
    const startX = computeTextX(line, params.fontSize, params.horizontalAlign, params.width, params.paddingX);
    
    // Длительность анимации печати и стирания
    const printDuration = line.length * printSpeed;
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
    } else {
      // Многострочный режим или одна строка: печать -> пауза
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
      
      // Для многострочного режима - последовательно друг за другом
      if (params.multiLine) {
        begin = i === 0 ? '0s' : `d${i - 1}.end`;
        // Если это последняя строка в многострочном режиме и repeat = true, зацикливаем
        if (repeat && i === lines.length - 1) {
          begin = `${begin};d0.end`;
        }
      } else {
        // Одна строка - повторяем только если repeat = true
        begin = repeat ? `0s;${animateId}.end` : '0s';
      }
    }
    
    // Определяем fill атрибут: для последней строки без repeat - freeze (остается на месте), иначе - remove
    // При repeat=true все строки используют remove для зацикливания
    const isLastLineNoRepeat = !repeat && (
      (isReplacingMode && isLastLine) || 
      (params.multiLine && i === lines.length - 1) ||
      (!isReplacingMode && !params.multiLine)
    );
    const fillValue = isLastLineNoRepeat ? 'freeze' : 'remove';
    
    pathsAndTexts += `
    <path id="${pathId}">
      <animate id="${animateId}" attributeName="d" begin="${begin}"
        dur="${totalDuration}ms" fill="${fillValue}"
        values="${pathValues}" keyTimes="${keyTimes}" />
    </path>
    <text font-family="monospace" fill="${color}" font-size="${params.fontSize}" font-weight="${params.fontWeight || 800}"
      dominant-baseline="auto" x="0%" text-anchor="start" letter-spacing="normal">
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

