/**
 * Генератор SVG шаблона на основе готовых параметров анимации
 */

import { escapeXml, validateAndSanitizeFontFamily } from '../utils/text-utils.js';
import { getCursorInfo } from '../effects/cursor/index.js';
import { parseStyleSegments, hasStyleMarkers } from '../processors/style-segments-parser.js';

/**
 * Генерирует секцию <defs> с опциональными стилями шрифта.
 * @param {string} fontCSS - CSS для вставки (может быть пустым)
 * @returns {string} SVG-разметка для <defs> или пустая строка
 */
function generateDefs(fontCSS) {
  const hasFontCSS = typeof fontCSS === 'string' && fontCSS.trim().length > 0;

  if (!hasFontCSS) {
    return '';
  }

  const trimmedCSS = fontCSS.trim();

  return `<defs>
  <style type="text/css"><![CDATA[
${trimmedCSS}
  ]]></style>
</defs>
`;
}

/**
 * Генерирует анимацию opacity для fade эффекта
 * @param {Object} config - конфигурация fade анимации
 * @returns {string} SVG код анимации opacity
 */
function generateOpacityAnimation(config) {
  const { index, begin, totalDuration, fillValue, fadeEraseStart, fadeEraseEnd } = config;
  
  const opacityId = `opacity${index}`;
  const opacityKeyTimes = `0;${fadeEraseStart};${fadeEraseEnd};1`;
  const opacityValues = '1;1;0;0';
  
  return `
      <animate id="${opacityId}" attributeName="opacity" begin="${begin}"
        dur="${totalDuration}ms" fill="${fillValue}"
        values="${opacityValues}" keyTimes="${opacityKeyTimes}" />`;
}

/**
 * Генерирует контент для textPath - либо простой текст, либо tspan элементы с разными стилями
 * @param {string} line - текст строки
 * @param {string} defaultColor - цвет по умолчанию
 * @returns {string} содержимое для textPath
 */
function generateTextPathContent(line, defaultColor) {
  // Проверяем наличие маркеров стилей
  if (!hasStyleMarkers(line)) {
    return escapeXml(line);
  }
  
  // Парсим строку на сегменты с разными стилями
  const segments = parseStyleSegments(line, defaultColor);
  
  // Генерируем tspan для каждого сегмента с применением всех стилей
  return segments.map(segment => {
    const escapedText = escapeXml(segment.text);
    const styles = segment.styles || {};
    const attributes = [];
    
    // Цвет текста (fill)
    if (segment.color && segment.color !== defaultColor) {
      attributes.push(`fill="${segment.color}"`);
    }
    
    // Font Weight
    if (styles.fontWeight) {
      attributes.push(`font-weight="${styles.fontWeight}"`);
    }
    
    // Font Size
    if (styles.fontSize) {
      attributes.push(`font-size="${styles.fontSize}"`);
    }
    
    // Font Family
    if (styles.fontFamily) {
      const sanitizedFont = validateAndSanitizeFontFamily(styles.fontFamily);
      attributes.push(`font-family="${sanitizedFont}"`);
    }
    
    // Opacity
    if (styles.opacity) {
      attributes.push(`opacity="${styles.opacity}"`);
    }
    
    // Font Style (italic)
    if (styles.italic) {
      attributes.push(`font-style="italic"`);
    }
    
    // Text Decoration (underline, strikethrough)
    const decorations = [];
    if (styles.underline) decorations.push('underline');
    if (styles.strikethrough) decorations.push('line-through');
    if (decorations.length > 0) {
      attributes.push(`text-decoration="${decorations.join(' ')}"`);
    }
    
    // Если нет атрибутов - возвращаем просто текст
    if (attributes.length === 0) {
      return escapedText;
    }
    
    // Оборачиваем в tspan со всеми стилями
    return `<tspan ${attributes.join(' ')}>${escapedText}</tspan>`;
  }).join('');
}

/**
 * Генерирует текстовый элемент с анимацией
 * @param {Object} lineData - данные для генерации текстового элемента
 * @returns {string} SVG код текстового элемента
 */
function generateTextElement(lineData) {
  const {
    index,
    pathId,
    animateId,
    line,
    fontFamily,
    color,
    fontSize,
    fontWeight,
    letterSpacingValue,
    begin,
    totalDuration,
    fillValue,
    pathValues,
    keyTimes,
    useFadeErase,
    fadeEraseStart,
    fadeEraseEnd
  } = lineData;
  
  const safeFontFamily = validateAndSanitizeFontFamily(fontFamily);
  
  const opacityAnimation = useFadeErase 
    ? generateOpacityAnimation({ index, begin, totalDuration, fillValue, fadeEraseStart, fadeEraseEnd })
    : '';
  
  const opacityAttr = useFadeErase ? ' opacity="1"' : '';
  
  // Генерируем контент с поддержкой цветовых сегментов
  const textContent = generateTextPathContent(line, color);

  return `
    <path id="${pathId}">
      <animate id="${animateId}" attributeName="d" begin="${begin}"
        dur="${totalDuration}ms" fill="${fillValue}"
        values="${pathValues}" keyTimes="${keyTimes}" />
    </path>
    <text font-family="${safeFontFamily}" fill="${color}" font-size="${fontSize}" font-weight="${fontWeight}"
      dominant-baseline="auto" x="0%" text-anchor="start" letter-spacing="${letterSpacingValue}"${opacityAttr}>${opacityAnimation}
      <textPath xlink:href="#${pathId}">
        ${textContent}
      </textPath>
    </text>`;
}

/**
 * Генерирует единственный глобальный элемент курсора
 * на основе данных по всем строкам
 * @param {Array<Object>} linesData - массив параметров строк
 * @returns {string} SVG код элемента курсора или пустая строка
 */
function generateCursorElement(linesData) {
  if (!Array.isArray(linesData) || linesData.length === 0) {
    return '';
  }

  const hasMultiLine = linesData.some((lineData) => lineData && lineData.multiLine);

  if (hasMultiLine) {
    return generateMultiLineCursor(linesData);
  }

  return generatePerLineCursor(linesData);
}

/**
 * Курсор для обычного режима (single / replacing): отдельные animate для каждой строки
 */
function generatePerLineCursor(linesData) {
  // Берем первую строку, в которой есть рассчитанная анимация курсора
  const sampleLine = linesData.find(
    (lineData) =>
      lineData &&
      lineData.cursorValues &&
      lineData.cursorKeyTimes &&
      lineData.cursorStyle &&
      lineData.cursorStyle !== 'none',
  );

  if (!sampleLine) {
    return '';
  }

  const cursorInfo = getCursorInfo(sampleLine.cursorStyle);
  if (!cursorInfo || cursorInfo.value === 'none') {
    return '';
  }

  const safeCursorIcon = escapeXml(cursorInfo.icon || '|');

  const animateXParts = [];
  const animateYParts = [];
  let hideOpacityAnimation = '';

  // Определяем, нужно ли скрывать курсор по завершении всей анимации
  // hideWhenFinished сейчас настроен как { repeat: false } и реализован через cursorFillValue === 'remove'
  // при исходном fillValue !== 'remove'
  const hideOnFinish =
    sampleLine.cursorFillValue === 'remove' &&
    typeof sampleLine.fillValue !== 'undefined' &&
    sampleLine.fillValue !== 'remove';

  linesData.forEach((lineData) => {
    const {
      cursorValues,
      cursorKeyTimes,
      cursorFillValue,
      begin,
      totalDuration,
      y,
      fillValue,
    } = lineData || {};

    if (!cursorValues || !cursorKeyTimes || !begin || !totalDuration || typeof y !== 'number') {
      return;
    }

    const cursorFill = cursorFillValue || fillValue || 'remove';

    // Анимация X для данного диапазона времени (печать/стирание строки)
    animateXParts.push(`
      <animate attributeName="x" begin="${begin}"
        dur="${totalDuration}ms" fill="${cursorFill}"
        values="${cursorValues}" keyTimes="${cursorKeyTimes}" />`);

    // Анимация Y: фиксированное значение для каждой ключевой точки
    const keyCount = cursorKeyTimes.split(';').filter(Boolean).length;
    const yValues = Array(keyCount).fill(String(y)).join(';');

    animateYParts.push(`
      <animate attributeName="y" begin="${begin}"
        dur="${totalDuration}ms" fill="${cursorFill}"
        values="${yValues}" keyTimes="${cursorKeyTimes}" />`);
  });

  if (animateXParts.length === 0 || animateYParts.length === 0) {
    return '';
  }

  // Если нужно скрыть курсор после завершения всех строк — вешаем
  // отдельную анимацию opacity, которая срабатывает после последней строки
  if (hideOnFinish) {
    const lastLineWithCursor = [...linesData]
      .reverse()
      .find(
        (lineData) =>
          lineData &&
          lineData.cursorValues &&
          lineData.cursorKeyTimes &&
          typeof lineData.y === 'number' &&
          lineData.animateId,
      );

    if (lastLineWithCursor) {
      hideOpacityAnimation = `
      <animate attributeName="opacity" begin="${lastLineWithCursor.animateId}.end"
        dur="1ms" fill="freeze"
        values="1;0" keyTimes="0;1" />`;
    }
  }

  // Общие визуальные параметры берем из примера строки
  const { color, fontSize, fontWeight } = sampleLine;

  return `
    <text id="typing-cursor" fill="${color}" font-size="${fontSize}" font-weight="${fontWeight}"
      dominant-baseline="auto" text-anchor="start">
      ${animateXParts.join('')}
      ${animateYParts.join('')}
      ${hideOpacityAnimation}
      ${safeCursorIcon}
    </text>`;
}

/**
 * Курсор для multiline режима: один общий трек x/y на весь цикл
 */
function generateMultiLineCursor(linesData) {
  // Фильтруем только строки, для которых есть данные курсора и печати
  const multiLines = linesData.filter(
    (lineData) =>
      lineData &&
      lineData.multiLine &&
      lineData.cursorStyle &&
      lineData.cursorStyle !== 'none' &&
      typeof lineData.y === 'number' &&
      typeof lineData.printStart === 'number' &&
      typeof lineData.printEnd === 'number' &&
      typeof lineData.startX === 'number' &&
      lineData.totalDuration &&
      Array.isArray(lineData.cursorPrintKeyTimes) &&
      Array.isArray(lineData.cursorPrintXPositions),
  );

  if (multiLines.length === 0) {
    return '';
  }

  const sampleLine = multiLines[0];
  const cursorInfo = getCursorInfo(sampleLine.cursorStyle);
  if (!cursorInfo || cursorInfo.value === 'none') {
    return '';
  }

  const safeCursorIcon = escapeXml(cursorInfo.icon || '|');
  const totalDuration = sampleLine.totalDuration;
  const beginValue = sampleLine.begin || '0s';
  const fill = sampleLine.cursorFillValue || sampleLine.fillValue || 'remove';

  /**
   * Собираем интервалы активности курсора с детальными позициями:
   * - печать строки [printStart, printEnd] с массивами keyTimes и xPositions
   * - стирание строки [eraseStart, eraseEnd] с массивами keyTimes и xPositions (если есть)
   * На основе этих интервалов строим единый трек x/y/opacity.
   */
  const intervals = [];

  multiLines.forEach((lineData, index) => {
    const { 
      printStart, printEnd, eraseStart, eraseEnd,
      cursorPrintKeyTimes, cursorPrintXPositions,
      cursorEraseKeyTimes, cursorEraseXPositions
    } = lineData;

    // Добавляем интервал печати если есть детальные данные
    if (
      typeof printStart === 'number' && 
      typeof printEnd === 'number' && 
      printEnd > printStart &&
      Array.isArray(cursorPrintKeyTimes) &&
      Array.isArray(cursorPrintXPositions) &&
      cursorPrintKeyTimes.length > 0 &&
      cursorPrintKeyTimes.length === cursorPrintXPositions.length
    ) {
      intervals.push({
        start: printStart,
        end: printEnd,
        lineIndex: index,
        type: 'print',
        keyTimes: cursorPrintKeyTimes,
        xPositions: cursorPrintXPositions,
      });
    }

    // Добавляем интервал стирания если есть детальные данные
    if (
      typeof eraseStart === 'number' && 
      typeof eraseEnd === 'number' && 
      eraseEnd > eraseStart &&
      Array.isArray(cursorEraseKeyTimes) &&
      Array.isArray(cursorEraseXPositions) &&
      cursorEraseKeyTimes.length > 0 &&
      cursorEraseKeyTimes.length === cursorEraseXPositions.length
    ) {
      intervals.push({
        start: eraseStart,
        end: eraseEnd,
        lineIndex: index,
        type: 'erase',
        keyTimes: cursorEraseKeyTimes,
        xPositions: cursorEraseXPositions,
      });
    }
  });

  if (intervals.length === 0) {
    return '';
  }

  intervals.sort((a, b) => {
    if (a.start === b.start) {
      return a.end - b.end;
    }
    return a.start - b.start;
  });

  const hasEraseIntervals = intervals.some((interval) => interval.type === 'erase');
  const printIntervals = intervals.filter((interval) => interval.type === 'print');
  const lastPrintInterval = printIntervals[printIntervals.length - 1] || null;

  const keyTimes = [];
  const xValues = [];
  const yValues = [];
  const opacityValues = [];

  let lastTime = 0;
  let lastX = multiLines[0].startX;
  let lastY = multiLines[0].y;
  let lastOpacity = 0;

  function pushPoint(time, x, y, opacity) {
    const clampedTime = Math.max(0, Math.min(1, time));

    keyTimes.push(String(clampedTime));
    xValues.push(String(x));
    yValues.push(String(y));
    opacityValues.push(String(opacity));

    lastTime = clampedTime;
    lastX = x;
    lastY = y;
    lastOpacity = opacity;
  }

  // Стартовая точка: до первой активности курсора он невидим
  pushPoint(0, lastX, lastY, 0);

  intervals.forEach((interval) => {
    const lineData = multiLines[interval.lineIndex];
    const lineY = lineData.y;
    const isPrintInterval = interval.type === 'print';
    const isEraseInterval = interval.type === 'erase';
    const isLastPrintInterval = isPrintInterval && lastPrintInterval === interval;

    // Используем детальные позиции из interval
    const detailedKeyTimes = interval.keyTimes;
    const detailedXPositions = interval.xPositions;

    // Если есть "дырка" между предыдущим концом и началом интервала и курсор видим —
    // явно фиксируем текущую позицию курсора до начала интервала
    if (interval.start > lastTime && lastOpacity > 0) {
      pushPoint(interval.start, lastX, lastY, lastOpacity);
    }

    // Телепортируем курсор в начальную позицию невидимым (если он еще не там)
    if (detailedXPositions[0] !== lastX || lineY !== lastY || lastOpacity !== 0) {
      pushPoint(detailedKeyTimes[0], detailedXPositions[0], lineY, 0);
    }
    
    // Делаем курсор видимым в начальной позиции
    // SVG поддерживает несколько точек с одинаковым keyTime для мгновенного изменения
    pushPoint(detailedKeyTimes[0], detailedXPositions[0], lineY, 1);

    // Добавляем все остальные точки из детального трека
    for (let i = 1; i < detailedKeyTimes.length; i++) {
      const time = detailedKeyTimes[i];
      const x = detailedXPositions[i];
      
      // Последняя точка - особая обработка для стирания
      const isLastPoint = i === detailedKeyTimes.length - 1;
      
      if (isLastPoint && isEraseInterval) {
        // Для стирания: в последней точке курсор еще видим
        pushPoint(time, x, lineY, 1);
        // Затем гасим курсор - используем тот же keyTime для мгновенного изменения
        pushPoint(time, x, lineY, 0);
      } else if (isLastPoint && isLastPrintInterval && !hasEraseIntervals) {
        // Для последней печати без стирания: курсор гаснет в конце
        pushPoint(time, x, lineY, 1);
        // Гасим курсор мгновенно
        pushPoint(time, x, lineY, 0);
      } else {
        // Обычная точка - курсор видим
        pushPoint(time, x, lineY, 1);
      }
    }
  });

  // Гарантируем наличие точки в конце шкалы времени
  if (lastTime < 1) {
    pushPoint(1, lastX, lastY, lastOpacity);
  }

  const { color, fontSize, fontWeight } = sampleLine;

  return `
    <text id="typing-cursor" fill="${color}" font-size="${fontSize}" font-weight="${fontWeight}"
      dominant-baseline="auto" text-anchor="start">
      <animate attributeName="x" begin="${beginValue}"
        dur="${totalDuration}ms" fill="${fill}"
        values="${xValues.join(';')}" keyTimes="${keyTimes.join(';')}" />
      <animate attributeName="y" begin="${beginValue}"
        dur="${totalDuration}ms" fill="${fill}"
        values="${yValues.join(';')}" keyTimes="${keyTimes.join(';')}" />
      <animate attributeName="opacity" begin="${beginValue}"
        dur="${totalDuration}ms" fill="freeze"
        values="${opacityValues.join(';')}" keyTimes="${keyTimes.join(';')}" />
      ${safeCursorIcon}
    </text>`;
}

/**
 * Генерирует финальный SVG документ
 * @param {Object} config - конфигурация для генерации SVG
 * @returns {string} готовый SVG код
 */
export function renderSVG(config) {
  const { width, height, background, linesData, fontCSS } = config;
  
  // Генерируем все текстовые элементы
  const pathsAndTexts = linesData.map((lineData) => generateTextElement(lineData)).join('');
  const cursorElement = generateCursorElement(linesData);
  const defs = generateDefs(fontCSS);
  
  return `<svg xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" ${background.style}>
  ${defs}<rect width="${width}" height="${height}" fill="${background.fill}"/>
  
  <g id="text-container">${pathsAndTexts}${cursorElement}
  </g>
</svg>`;
}

