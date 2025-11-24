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

  // Общие визуальные параметры берем из примера строки
  const { color, fontSize, fontWeight } = sampleLine;

  return `
    <text id="typing-cursor" fill="${color}" font-size="${fontSize}" font-weight="${fontWeight}"
      dominant-baseline="auto" text-anchor="start">
      ${animateXParts.join('')}
      ${animateYParts.join('')}
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

  const elements = multiLines
    .map((lineData) => {
      const {
        cursorValues,
        cursorKeyTimes,
        cursorFillValue,
        begin,
        totalDuration: lineTotalDuration,
        y,
        fillValue,
        color,
        fontSize,
        fontWeight,
        printStart,
        printEnd,
        eraseStart,
        eraseEnd,
      } = lineData;

      if (
        !cursorValues ||
        !cursorKeyTimes ||
        !lineTotalDuration ||
        typeof y !== 'number' ||
        typeof printStart !== 'number' ||
        typeof printEnd !== 'number'
      ) {
        return '';
      }

      const fill = cursorFillValue || fillValue || 'remove';
      const beginValue = begin || '0s';

      // Делаем курсор видимым:
      // - во время печати строки [printStart, printEnd]
      // - и, если есть, во время стирания [eraseStart, eraseEnd] для eraseMode='line'
      let opacityKeyTimes;
      let opacityValues;

      if (typeof eraseStart === 'number' && typeof eraseEnd === 'number') {
        opacityKeyTimes = `0;${printStart};${printStart};${printEnd};${printEnd};${eraseStart};${eraseStart};${eraseEnd};${eraseEnd};1`;
        opacityValues = '0;0;1;1;0;0;1;1;0;0';
      } else {
        opacityKeyTimes = `0;${printStart};${printStart};${printEnd};${printEnd};1`;
        opacityValues = '0;0;1;1;0;0';
      }

      return `
    <text fill="${color}" font-size="${fontSize}" font-weight="${fontWeight}"
      dominant-baseline="auto" text-anchor="start" y="${y}">
      <animate attributeName="x" begin="${beginValue}"
        dur="${lineTotalDuration}ms" fill="${fill}"
        values="${cursorValues}" keyTimes="${cursorKeyTimes}" />
      <animate attributeName="opacity" begin="${beginValue}"
        dur="${lineTotalDuration}ms" fill="remove"
        values="${opacityValues}" keyTimes="${opacityKeyTimes}" />
      ${safeCursorIcon}
    </text>`;
    })
    .filter(Boolean)
    .join('');

  return elements;
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

