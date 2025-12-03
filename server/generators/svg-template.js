/**
 * Генератор SVG шаблона на основе готовых параметров анимации
 */

import { escapeXml, validateAndSanitizeFontFamily } from './utils/text-utils.js';
import { getCursorInfo } from './cursor-modes/index.js';

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

  return `
    <path id="${pathId}">
      <animate id="${animateId}" attributeName="d" begin="${begin}"
        dur="${totalDuration}ms" fill="${fillValue}"
        values="${pathValues}" keyTimes="${keyTimes}" />
    </path>
    <text font-family="${safeFontFamily}" fill="${color}" font-size="${fontSize}" font-weight="${fontWeight}"
      dominant-baseline="auto" x="0%" text-anchor="start" letter-spacing="${letterSpacingValue}"${opacityAttr}>${opacityAnimation}
      <textPath xlink:href="#${pathId}">
        ${escapeXml(line)}
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
      lineData.cursorValues &&
      lineData.cursorKeyTimes &&
      lineData.cursorStyle &&
      lineData.cursorStyle !== 'none' &&
      typeof lineData.y === 'number' &&
      typeof lineData.printStart === 'number' &&
      typeof lineData.printEnd === 'number' &&
      typeof lineData.startX === 'number' &&
      typeof lineData.textWidth === 'number' &&
      lineData.totalDuration,
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
   * Собираем интервалы активности курсора:
   * - печать строки [printStart, printEnd]
   * - стирание строки [eraseStart, eraseEnd] (если есть)
   * На основе этих интервалов строим единый трек x/y/opacity.
   */
  const intervals = [];

  multiLines.forEach((lineData, index) => {
    const { printStart, printEnd, eraseStart, eraseEnd } = lineData;

    if (typeof printStart === 'number' && typeof printEnd === 'number' && printEnd > printStart) {
      intervals.push({
        start: printStart,
        end: printEnd,
        lineIndex: index,
        type: 'print',
      });
    }

    if (typeof eraseStart === 'number' && typeof eraseEnd === 'number' && eraseEnd > eraseStart) {
      intervals.push({
        start: eraseStart,
        end: eraseEnd,
        lineIndex: index,
        type: 'erase',
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
    const lineStartX = lineData.startX;
    const lineEndX = lineData.startX + lineData.textWidth;
    const lineY = lineData.y;
    const isPrintInterval = interval.type === 'print';
    const isEraseInterval = interval.type === 'erase';
    const isLastPrintInterval = isPrintInterval && lastPrintInterval === interval;

    const beforeX = isPrintInterval ? lineStartX : lineEndX;
    const afterX = isPrintInterval ? lineEndX : lineStartX;

    // Если есть "дырка" между предыдущим концом и началом интервала —
    // явно фиксируем, что курсор в этот период невидим.
    if (interval.start > lastTime) {
      // Держим курсор в конце предыдущей строки видимым
      // до момента старта следующего интервала
      pushPoint(interval.start, lastX, lastY, lastOpacity);
    }

    // В начале интервала сначала "телепортируем" курсор в новую точку
    // пока он невидим, а затем включаем его в этой же позиции.
    pushPoint(interval.start, beforeX, lineY, 0);
    pushPoint(interval.start, beforeX, lineY, 1);

    // Момент окончания активности интервала:
    // - для печати промежуточных строк курсор остаётся видимым в конце строки;
    // - для последней печати без этапа стирания (repeat=false) курсор гасим в конце;
    // - для любого этапа стирания курсор гасим в конце.
    if (isEraseInterval) {
      pushPoint(interval.end, afterX, lineY, 1);
      pushPoint(interval.end, afterX, lineY, 0);
    } else if (isLastPrintInterval && !hasEraseIntervals) {
      // repeat=false: последняя строка, после неё нет стирания — курсор убираем
      pushPoint(interval.end, afterX, lineY, 1);
      pushPoint(interval.end, afterX, lineY, 0);
    } else {
      // Обычный случай печати строки: оставляем курсор видимым в конце строки
      pushPoint(interval.end, afterX, lineY, 1);
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
  const { width, height, background, linesData } = config;
  
  // Генерируем все текстовые элементы
  const pathsAndTexts = linesData.map(lineData => generateTextElement(lineData)).join('');
  const cursorElement = generateCursorElement(linesData);
  
  return `<svg xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" ${background.style}>
  <rect width="${width}" height="${height}" fill="${background.fill}"/>
  
  <g id="text-container">${pathsAndTexts}${cursorElement}
  </g>
</svg>`;
}

