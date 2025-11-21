/**
 * Генератор SVG шаблона на основе готовых параметров анимации
 */

import { escapeXml, validateAndSanitizeFontFamily } from './utils/text-utils.js';

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
 * Генерирует финальный SVG документ
 * @param {Object} config - конфигурация для генерации SVG
 * @returns {string} готовый SVG код
 */
export function renderSVG(config) {
  const { width, height, background, linesData } = config;
  
  // Генерируем все текстовые элементы
  const pathsAndTexts = linesData.map(lineData => generateTextElement(lineData)).join('');
  
  return `<svg xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" ${background.style}>
  <rect width="${width}" height="${height}" fill="${background.fill}"/>
  
  <g id="text-container">${pathsAndTexts}
  </g>
</svg>`;
}

