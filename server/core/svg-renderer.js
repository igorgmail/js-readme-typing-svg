/**
 * SVG template generator based on prepared animation parameters
 */

import { escapeXml, validateAndSanitizeFontFamily } from '../utils/text-utils.js';
import { getCursorInfo } from '../effects/cursor/index.js';
import { parseStyleSegments, hasStyleMarkers } from '../processors/style-segments-parser.js';

/**
 * Generates <defs> section with optional font styles.
 * @param {string} fontCSS - CSS to insert (can be empty)
 * @returns {string} SVG markup for <defs> or empty string
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
 * Generates opacity animation for fade effect
 * @param {Object} config - fade animation configuration
 * @returns {string} SVG code for opacity animation
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
 * Generates content for textPath - either plain text or tspan elements with different styles
 * @param {string} line - line text
 * @param {string} defaultColor - default color
 * @returns {string} content for textPath
 */
function generateTextPathContent(line, defaultColor) {
  // Check for style markers
  if (!hasStyleMarkers(line)) {
    return escapeXml(line);
  }
  
  // Parse line into segments with different styles
  const segments = parseStyleSegments(line, defaultColor);
  
  // Generate tspan for each segment with all styles applied
  return segments.map(segment => {
    const escapedText = escapeXml(segment.text);
    const styles = segment.styles || {};
    const attributes = [];
    
    // Text color (fill)
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
    
    // If no attributes - return plain text
    if (attributes.length === 0) {
      return escapedText;
    }
    
    // Wrap in tspan with all styles
    return `<tspan ${attributes.join(' ')}>${escapedText}</tspan>`;
  }).join('');
}

/**
 * Generates text element with animation
 * @param {Object} lineData - data for text element generation
 * @returns {string} SVG code for text element
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
  
  // Generate content with color segments support
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
 * Generates single global cursor element
 * based on data from all lines
 * @param {Array<Object>} linesData - array of line parameters
 * @returns {string} SVG code for cursor element or empty string
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
 * Cursor for normal mode (single / replacing): separate animate for each line
 */
function generatePerLineCursor(linesData) {
  // Take the first line with calculated cursor animation
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

  // Determine if cursor should be hidden when all animation completes
  // hideWhenFinished is currently configured as { repeat: false } and implemented via cursorFillValue === 'remove'
  // when original fillValue !== 'remove'
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

    // X animation for this time range (line print/erase)
    animateXParts.push(`
      <animate attributeName="x" begin="${begin}"
        dur="${totalDuration}ms" fill="${cursorFill}"
        values="${cursorValues}" keyTimes="${cursorKeyTimes}" />`);

    // Y animation: fixed value for each key point
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

  // If cursor needs to be hidden after all lines complete — add
  // a separate opacity animation that triggers after the last line
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

  // Take common visual parameters from sample line
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
 * Cursor for multiline mode: one common x/y track for entire cycle
 */
function generateMultiLineCursor(linesData) {
  // Filter only lines with cursor and print data
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
   * Collect cursor activity intervals with detailed positions:
   * - line print [printStart, printEnd] with keyTimes and xPositions arrays
   * - line erase [eraseStart, eraseEnd] with keyTimes and xPositions arrays (if available)
   * Build unified x/y/opacity track based on these intervals.
   */
  const intervals = [];

  multiLines.forEach((lineData, index) => {
    const { 
      printStart, printEnd, eraseStart, eraseEnd,
      cursorPrintKeyTimes, cursorPrintXPositions,
      cursorEraseKeyTimes, cursorEraseXPositions
    } = lineData;

    // Add print interval if detailed data available
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

    // Add erase interval if detailed data available
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

  // Starting point: cursor is invisible before first activity
  pushPoint(0, lastX, lastY, 0);

  intervals.forEach((interval) => {
    const lineData = multiLines[interval.lineIndex];
    const lineY = lineData.y;
    const isPrintInterval = interval.type === 'print';
    const isEraseInterval = interval.type === 'erase';
    const isLastPrintInterval = isPrintInterval && lastPrintInterval === interval;

    // Use detailed positions from interval
    const detailedKeyTimes = interval.keyTimes;
    const detailedXPositions = interval.xPositions;

    // If there's a gap between previous end and interval start and cursor is visible —
    // explicitly fix current cursor position before interval starts
    if (interval.start > lastTime && lastOpacity > 0) {
      pushPoint(interval.start, lastX, lastY, lastOpacity);
    }

    // Teleport cursor to starting position invisible (if not already there)
    if (detailedXPositions[0] !== lastX || lineY !== lastY || lastOpacity !== 0) {
      pushPoint(detailedKeyTimes[0], detailedXPositions[0], lineY, 0);
    }
    
    // Make cursor visible at starting position
    // SVG supports multiple points with same keyTime for instant change
    pushPoint(detailedKeyTimes[0], detailedXPositions[0], lineY, 1);

    // Add all remaining points from detailed track
    for (let i = 1; i < detailedKeyTimes.length; i++) {
      const time = detailedKeyTimes[i];
      const x = detailedXPositions[i];
      
      // Last point - special handling for erase
      const isLastPoint = i === detailedKeyTimes.length - 1;
      
      if (isLastPoint && isEraseInterval) {
        // For erase: cursor is still visible at last point
        pushPoint(time, x, lineY, 1);
        // Then hide cursor - use same keyTime for instant change
        pushPoint(time, x, lineY, 0);
      } else if (isLastPoint && isLastPrintInterval && !hasEraseIntervals) {
        // For last print without erase: cursor fades at the end
        pushPoint(time, x, lineY, 1);
        // Hide cursor instantly
        pushPoint(time, x, lineY, 0);
      } else {
        // Regular point - cursor visible
        pushPoint(time, x, lineY, 1);
      }
    }
  });

  // Ensure point exists at end of timeline
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
 * Generates final SVG document
 * @param {Object} config - configuration for SVG generation
 * @returns {string} ready SVG code
 */
export function renderSVG(config) {
  const { width, height, background, linesData, fontCSS } = config;
  
  // Generate all text elements
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

