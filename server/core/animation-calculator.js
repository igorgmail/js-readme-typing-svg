/**
 * Animation parameters calculator for various operation modes
 */

import { computeTextWidth, computeTextWidthWithStyles, computeTextX, formatLetterSpacingForSVG } from '../utils/text-utils.js';
import { getEraseMode } from '../effects/erase/index.js';
import { isCursorAllowed, shouldHideCursorWhenFinished } from '../effects/cursor/index.js';
import { stripStyleMarkers, hasStyleMarkers } from '../processors/style-segments-parser.js';
import { getCharacterWidths, getCharacterWidthsWithStyles, getFontAscent } from '../fonts/font-metrics.js';

/**
 * Calculates starting Y position for vertical alignment
 * @param {Object} config - configuration
 * @param {string} config.verticalAlign - vertical alignment (top, middle, bottom)
 * @param {number} config.height - SVG height
 * @param {number} config.paddingY - vertical padding
 * @param {number} config.fontSize - font size
 * @param {number} config.lineHeight - line height
 * @param {boolean} config.multiLine - multiline mode
 * @param {number} config.linesCount - number of lines
 * @param {object|null} config.parsedFont - opentype.Font object or null
 * @returns {number} starting Y position
 */
export function calculateStartY(config) {
  const { verticalAlign, height, paddingY, fontSize, lineHeight, multiLine, linesCount, parsedFont } = config;
  
  const totalTextHeight = multiLine 
    ? linesCount * fontSize * lineHeight 
    : fontSize;
  
  let startY = paddingY;
  
  if (verticalAlign === 'top') {
    // For top alignment, need to account for font ascent so top part of text is not clipped
    // In SVG, Y coordinate for text is the baseline, so need to add ascent
    const fontAscent = getFontAscent(fontSize, parsedFont);
    startY = paddingY + fontAscent;
  } else if (verticalAlign === 'middle') {
    startY = (height - totalTextHeight) / 2 + fontSize;
  } else if (verticalAlign === 'bottom') {
    startY = height - totalTextHeight + fontSize / 2;
  }
  
  return startY;
}

/**
 * Calculates detailed cursor positions for text printing (character by character)
 * @param {Object} config - configuration
 * @returns {Object} object with keyTimes and xPositions arrays
 */
function calculatePrintCursorPositions(config) {
  const { line, startX, printStart, printEnd, fontSize, letterSpacing, parsedFont, fontsMap } = config;
  
  if (!line || line.length === 0) {
    return {
      keyTimes: [printStart, printEnd],
      xPositions: [startX, startX]
    };
  }
  
  // For time calculation use clean text (without markers)
  const cleanLine = stripStyleMarkers(line);
  const chars = [...cleanLine];
  
  // Get accumulated widths for each position in text
  // Use version with styles if markers are present
  const widths = hasStyleMarkers(line)
    ? getCharacterWidthsWithStyles(line, fontSize, parsedFont, letterSpacing, fontsMap)
    : getCharacterWidths(cleanLine, fontSize, parsedFont, letterSpacing);
  
  // Check that widths array has correct length
  const expectedLength = chars.length + 1; // +1 for initial position 0
  if (widths.length !== expectedLength) {
    console.warn(`calculatePrintCursorPositions: lengths don't match. Expected ${expectedLength}, got ${widths.length}. Line: "${cleanLine.substring(0, 50)}"`);
    // Use last width value for all missing positions
    const lastWidth = widths.length > 0 ? widths[widths.length - 1] : 0;
    while (widths.length < expectedLength) {
      widths.push(lastWidth);
    }
  }
  
  const keyTimes = [];
  const xPositions = [];
  
  // Create keyframe for each character
  for (let i = 0; i <= chars.length; i++) {
    const progress = chars.length > 0 ? i / chars.length : 0;
    const time = printStart + (printEnd - printStart) * progress;
    // Use last value if out of array bounds
    const width = i < widths.length ? widths[i] : (widths.length > 0 ? widths[widths.length - 1] : 0);
    const x = startX + width;
    
    keyTimes.push(time);
    xPositions.push(x);
  }
  
  return { keyTimes, xPositions };
}

/**
 * Calculates detailed cursor positions for text erasing (character by character)
 * @param {Object} config - configuration
 * @returns {Object} object with keyTimes and xPositions arrays
 */
function calculateEraseCursorPositions(config) {
  const { line, startX, eraseStart, eraseEnd, fontSize, letterSpacing, parsedFont, fontsMap } = config;
  
  if (!line || line.length === 0) {
    return {
      keyTimes: [eraseStart, eraseEnd],
      xPositions: [startX, startX]
    };
  }
  
  // For time calculation use clean text (without markers)
  const cleanLine = stripStyleMarkers(line);
  const chars = [...cleanLine];
  
  // Get accumulated widths for each position in text
  // Use version with styles if markers are present
  const widths = hasStyleMarkers(line)
    ? getCharacterWidthsWithStyles(line, fontSize, parsedFont, letterSpacing, fontsMap)
    : getCharacterWidths(cleanLine, fontSize, parsedFont, letterSpacing);
  
  // Check that widths array has correct length
  const expectedLength = chars.length + 1; // +1 for initial position 0
  if (widths.length !== expectedLength) {
    console.warn(`calculateEraseCursorPositions: lengths don't match. Expected ${expectedLength}, got ${widths.length}. Line: "${cleanLine.substring(0, 50)}"`);
    // Use last width value for all missing positions
    const lastWidth = widths.length > 0 ? widths[widths.length - 1] : 0;
    while (widths.length < expectedLength) {
      widths.push(lastWidth);
    }
  }
  
  const keyTimes = [];
  const xPositions = [];
  
  // For erasing, move from end to start
  for (let i = chars.length; i >= 0; i--) {
    const progress = chars.length > 0 ? (chars.length - i) / chars.length : 0;
    const time = eraseStart + (eraseEnd - eraseStart) * progress;
    // Use last value if out of array bounds
    const width = i < widths.length ? widths[i] : (widths.length > 0 ? widths[widths.length - 1] : 0);
    const x = startX + width;
    
    keyTimes.push(time);
    xPositions.push(x);
  }
  
  return { keyTimes, xPositions };
}

/**
 * Calculates animation parameters for one line in replacing mode
 * @param {Object} config - animation configuration
 * @returns {Object} animation parameters for line
 */
function calculateReplacingModeLineAnimation(config) {
  const {
    line, index, lastLineIndex, startX, y, textWidth,
    printDuration, eraseDuration, delayBetweenLines,
    repeat, eraseMode, fontSize, letterSpacing, eraseSpeed, fontFamily, parsedFont, fontsMap
  } = config;
  
  const isLastLine = index === lastLineIndex;
  const eraseModeInstance = getEraseMode(eraseMode);
  
  let totalDuration, begin, keyTimes, pathValues, useFadeErase, fadeEraseStart, fadeEraseEnd;
  
  if (repeat) {
    // When repeat=true: all lines are erased, cycle repeats infinitely
    totalDuration = printDuration + delayBetweenLines + eraseDuration + delayBetweenLines;
    const cyclePause = delayBetweenLines > 0 ? delayBetweenLines : 0;
    const repeatSuffix = cyclePause > 0 ? `+${cyclePause}ms` : '';
    
    const eraseConfig = {
      startX, y, textWidth, printDuration, delayBetweenLines,
      eraseDuration, totalDuration, line, fontSize, letterSpacing, eraseSpeed, fontFamily, parsedFont, fontsMap
    };
    
    const eraseResult = eraseModeInstance.calculateReplacingMode(eraseConfig);
    ({ useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues } = eraseResult);
    
    // Animation start:
    // - first cycle: 0s
    // - subsequent cycles: after last line ends + pause between cycles
    if (index === 0) {
      begin = repeatSuffix ? `0s;d${lastLineIndex}.end${repeatSuffix}` : `0s;d${lastLineIndex}.end`;
    } else {
      begin = `d${index - 1}.end`;
    }
  } else {
    // When repeat=false: non-last line is erased, last line remains
    if (!isLastLine) {
      totalDuration = printDuration + delayBetweenLines + eraseDuration + delayBetweenLines;
      
      const eraseConfig = {
        startX, y, textWidth, printDuration, delayBetweenLines,
        eraseDuration, totalDuration, line, fontSize, letterSpacing, eraseSpeed, fontFamily, parsedFont
      };
      
      const eraseResult = eraseModeInstance.calculateReplacingMode(eraseConfig);
      ({ useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues } = eraseResult);
      
      begin = index === 0 ? '0s' : `d${index - 1}.end`;
    } else {
      // Last line: print -> pause -> remains in place
      totalDuration = printDuration + delayBetweenLines;
      
      const printEnd = printDuration / totalDuration;
      
      useFadeErase = false;
      fadeEraseStart = 0;
      fadeEraseEnd = 0;
      keyTimes = `0;${printEnd};1`;
      pathValues = `m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth}`;
      
      begin = index === 0 ? '0s' : `d${index - 1}.end`;
    }
  }
  
  // Determine fill attribute
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
 * Calculates animation parameters for one line in multiline mode
 * @param {Object} config - animation configuration
 * @returns {Object} animation parameters for line
 */
function calculateMultiLineModeLineAnimation(config) {
  const {
    line, index, lines, startX, y, textWidth,
    printDuration, eraseSpeed, delayBetweenLines,
    repeat, eraseMode, fontSize, letterSpacing, fontFamily, parsedFont, printSpeed, fontsMap
  } = config;
  
  // Remove style markers from all lines for correct duration calculation
  const cleanLines = lines.map(l => stripStyleMarkers(l));
  const lastLineIndex = cleanLines.length - 1;
  
  // Calculate print duration for each line
  const msPerCharPrint = 1000 / printSpeed;
  const lineDurations = cleanLines.map(l => l.length * msPerCharPrint);
  
  // Calculate start time of current line as sum of all previous line durations + pauses
  let timeBeforeThisLine = 0;
  for (let i = 0; i < index; i++) {
    timeBeforeThisLine += lineDurations[i] + delayBetweenLines;
  }
  
  let totalDuration, begin, keyTimes, pathValues, useFadeErase, fadeEraseStart, fadeEraseEnd;
  // Global start/end values for line printing (0–1 relative to totalDuration)
  let cursorPrintStart;
  let cursorPrintEnd;
  // Line erase boundaries (0–1 relative to totalDuration) — only for eraseMode='line'
  let cursorEraseStart;
  let cursorEraseEnd;
  // Detailed cursor positions for printing and erasing
  let cursorPrintKeyTimes;
  let cursorPrintXPositions;
  let cursorEraseKeyTimes;
  let cursorEraseXPositions;
  
  if (repeat) {
    // Total print time for all lines = sum of all line durations + pauses between them
    const totalPrintTime = lineDurations.reduce((sum, dur) => sum + dur, 0) + (cleanLines.length - 1) * delayBetweenLines;
    const eraseModeInstance = getEraseMode(eraseMode);
    
    let printStart, printEnd, eraseStart, eraseEnd;
    
    if (eraseMode === 'line') {
      // Erase line by line, starting from last line
      const msPerCharErase = 1000 / eraseSpeed;
      // After printing last line, add pause before starting erase
      let eraseStartTime = totalPrintTime + delayBetweenLines;
      for (let j = lastLineIndex; j > index; j--) {
        eraseStartTime += cleanLines[j].length * msPerCharErase;
        eraseStartTime += delayBetweenLines;
      }
      
      const thisEraseDuration = cleanLines[index].length * msPerCharErase;
      const totalEraseDuration = cleanLines.reduce((sum, l) => sum + l.length * msPerCharErase, 0);
      // Pauses: before erase starts + between lines during erase
      const totalErasePauses = cleanLines.length * delayBetweenLines;
      
      totalDuration = totalPrintTime + totalEraseDuration + totalErasePauses;
      
      printStart = timeBeforeThisLine / totalDuration;
      printEnd = (timeBeforeThisLine + printDuration) / totalDuration;
      eraseStart = eraseStartTime / totalDuration;
      eraseEnd = (eraseStartTime + thisEraseDuration) / totalDuration;

      cursorPrintStart = printStart;
      cursorPrintEnd = printEnd;
      cursorEraseStart = eraseStart;
      cursorEraseEnd = eraseEnd;
      
      // Calculate detailed cursor positions for printing
      const printCursorData = calculatePrintCursorPositions({
        line, startX, printStart, printEnd, fontSize, letterSpacing, parsedFont, fontsMap
      });
      cursorPrintKeyTimes = printCursorData.keyTimes;
      cursorPrintXPositions = printCursorData.xPositions;
      
      // Calculate detailed cursor positions for erasing
      const eraseCursorData = calculateEraseCursorPositions({
        line, startX, eraseStart, eraseEnd, fontSize, letterSpacing, parsedFont, fontsMap
      });
      cursorEraseKeyTimes = eraseCursorData.keyTimes;
      cursorEraseXPositions = eraseCursorData.xPositions;
    } else {
      const msPerCharErase = 1000 / eraseSpeed;
      const totalEraseDuration = cleanLines.reduce((sum, l) => sum + l.length * msPerCharErase, 0);
      // Pause before erase starts + pause after erase
      totalDuration = totalPrintTime + delayBetweenLines + totalEraseDuration + delayBetweenLines;
      
      printStart = timeBeforeThisLine / totalDuration;
      printEnd = (timeBeforeThisLine + printDuration) / totalDuration;
      // Erase starts after pause
      eraseStart = (totalPrintTime + delayBetweenLines) / totalDuration;
      eraseEnd = (totalPrintTime + delayBetweenLines + totalEraseDuration) / totalDuration;

      cursorPrintStart = printStart;
      cursorPrintEnd = printEnd;
      
      // Calculate detailed cursor positions for printing (for other erase modes cursor moves only during print)
      const printCursorData = calculatePrintCursorPositions({
        line, startX, printStart, printEnd, fontSize, letterSpacing, parsedFont, fontsMap
      });
      cursorPrintKeyTimes = printCursorData.keyTimes;
      cursorPrintXPositions = printCursorData.xPositions;
    }
    
    const eraseConfig = {
      startX, y, textWidth, printStart, printEnd, eraseStart, eraseEnd,
      line, fontSize, letterSpacing, eraseSpeed, totalDuration, fontFamily, parsedFont, fontsMap
    };
    
    const eraseResult = eraseModeInstance.calculateMultiLineMode(eraseConfig);
    ({ useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues } = eraseResult);
    
    // For repeat=true add pause between cycles after last line completes
    const cyclePause = delayBetweenLines > 0 ? delayBetweenLines : 0;
    const repeatSuffix = cyclePause > 0 ? `+${cyclePause}ms` : '';
    const baseBegin = `0s;d${lastLineIndex}.end`;
    begin = repeatSuffix ? `${baseBegin}${repeatSuffix}` : baseBegin;
  } else {
    // When repeat=false: lines are printed and remain in place
    // Total print time for all lines = sum of all line durations + pauses between them
    const totalPrintTime = lineDurations.reduce((sum, dur) => sum + dur, 0) + (cleanLines.length - 1) * delayBetweenLines;
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
    
    // Calculate detailed cursor positions for printing
    const printCursorData = calculatePrintCursorPositions({
      line, startX, printStart, printEnd, fontSize, letterSpacing, parsedFont, fontsMap
    });
    cursorPrintKeyTimes = printCursorData.keyTimes;
    cursorPrintXPositions = printCursorData.xPositions;
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
    // Additional data for cursor in multiline mode
    printStart: cursorPrintStart,
    printEnd: cursorPrintEnd,
    eraseStart: cursorEraseStart,
    eraseEnd: cursorEraseEnd,
    // Detailed cursor positions
    cursorPrintKeyTimes,
    cursorPrintXPositions,
    cursorEraseKeyTimes,
    cursorEraseXPositions
  };
}

/**
 * Calculates animation parameters for single line (single line mode)
 * @param {Object} config - animation configuration
 * @returns {Object} animation parameters for line
 */
function calculateSingleLineModeAnimation(config) {
  const {
    startX, y, textWidth, printDuration, eraseDuration,
    delayBetweenLines, repeat, eraseMode,
    line, fontSize, letterSpacing, eraseSpeed, fontFamily, parsedFont, fontsMap
  } = config;
  
  const eraseModeInstance = getEraseMode(eraseMode);
  
  let totalDuration, begin, keyTimes, pathValues, useFadeErase, fadeEraseStart, fadeEraseEnd;
  
  if (repeat) {
    totalDuration = printDuration + delayBetweenLines + eraseDuration + delayBetweenLines;
    const cyclePause = delayBetweenLines > 0 ? delayBetweenLines : 0;
    const repeatSuffix = cyclePause > 0 ? `+${cyclePause}ms` : '';
    
    const eraseConfig = {
      startX, y, textWidth, printDuration, delayBetweenLines,
      eraseDuration, totalDuration, line, fontSize, letterSpacing, eraseSpeed, fontFamily, parsedFont, fontsMap
    };
    
    const eraseResult = eraseModeInstance.calculateSingleLineMode(eraseConfig);
    ({ useFadeErase, fadeEraseStart, fadeEraseEnd, keyTimes, pathValues } = eraseResult);
    
    // Repeat cycle with additional pause between cycles
    begin = repeatSuffix ? `0s;d0.end${repeatSuffix}` : '0s;d0.end';
  } else {
    totalDuration = printDuration + delayBetweenLines;
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
 * Calculates animation parameters for all lines
 * @param {Object} params - generation parameters
 * @param {Array<string>} lines - array of text lines
 * @param {number} startY - starting Y position
 * @param {object|null} parsedFont - opentype.Font object or null
 * @returns {Array<Object>} array of animation parameters for each line
 */
export function calculateLinesAnimation(params, lines, startY, parsedFont = null, fontsMap = null) {
  const {
    multiLine, repeat, eraseMode,
    printSpeed, eraseSpeed, delayBetweenLines,
    fontSize, lineHeight, horizontalAlign, width, paddingX, letterSpacing,
    fontFamily, color, fontWeight, cursorStyle,
  } = params;
  const cursorEnabledForParams = isCursorAllowed(params);
  const hideCursorOnFinish = shouldHideCursorWhenFinished(params);
  
  // printSpeed and eraseSpeed - characters per second.
  // Duration to print/erase one character = 1000 / speed milliseconds
  // Duration to print/erase line = (number of characters * 1000) / speed
  
  const isReplacingMode = !multiLine && lines.length > 1;
  const lastLineIndex = lines.length - 1;
  
  return lines.map((line, index) => {
    if (!line) return null;
    
    // Remove style markers for duration calculation
    // Original line (with markers) will be used for rendering and width calculation
    const cleanLine = stripStyleMarkers(line);
    
    // Calculate line position
    const y = isReplacingMode ? startY : startY + index * fontSize * lineHeight;
    
    // Calculate text width with styles (if markers present)
    const textWidth = hasStyleMarkers(line)
      ? computeTextWidthWithStyles(line, fontSize, letterSpacing, fontFamily, parsedFont, fontsMap)
      : computeTextWidth(cleanLine, fontSize, letterSpacing, fontFamily, parsedFont);
    
    // Calculate X position with styles (computeTextX already supports styles)
    const startX = computeTextX(line, fontSize, horizontalAlign, width, paddingX, letterSpacing, fontFamily, parsedFont, fontsMap);
    
    // Animation parameters
    // printSpeed and eraseSpeed - characters per second, calculate milliseconds per character
    const msPerCharPrint = 1000 / printSpeed;
    const msPerCharErase = 1000 / eraseSpeed;
    const printDuration = cleanLine.length * msPerCharPrint;
    const eraseDuration = cleanLine.length * msPerCharErase;
    
    const pathId = `path${index}`;
    const animateId = `d${index}`;
    
    let animationParams;
    
    // Choose calculation mode based on animation type
    if (isReplacingMode) {
      animationParams = calculateReplacingModeLineAnimation({
        line, index, lastLineIndex, startX, y, textWidth,
        printDuration, eraseDuration, delayBetweenLines,
        repeat, eraseMode, fontSize, letterSpacing, eraseSpeed, fontFamily, parsedFont, fontsMap
      });
    } else if (multiLine) {
      animationParams = calculateMultiLineModeLineAnimation({
        line, index, lines, startX, y, textWidth,
        printDuration, eraseSpeed, delayBetweenLines,
        repeat, eraseMode, fontSize, letterSpacing, fontFamily, parsedFont, printSpeed, fontsMap
      });
    } else {
      animationParams = calculateSingleLineModeAnimation({
        startX, y, textWidth, printDuration, eraseDuration,
        delayBetweenLines, repeat, eraseMode,
        line, fontSize, letterSpacing, eraseSpeed, fontFamily, parsedFont, fontsMap
      });
    }

    // Cursor animation configuration — build based on pathValues/keyTimes
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

        // Base fill value for cursor taken from line animation
        cursorFillValue = animationParams.fillValue;

        // In repeat mode cursor should not "rollback" to (0,0) in pauses between cycles,
        // so we freeze last position to avoid jump.
        if (repeat) {
          cursorFillValue = 'freeze';
        }

        // For final state (repeat=false) explicitly hide cursor if needed
        if (hideCursorOnFinish) {
          cursorFillValue = 'remove';
        }
      }
    }

    // Form final object with parameters for render
    return {
      index,
      pathId,
      animateId,
      line,
      // Line geometry
      startX,
      y,
      textWidth,
      fontFamily,
      color,
      fontSize,
      fontWeight,
      letterSpacingValue: formatLetterSpacingForSVG(letterSpacing),
      // Mode flag for subsequent cursor assembly
      multiLine,
      isReplacingMode,
      // Cursor parameters (if calculated)
      cursorStyle: cursorStyle || 'none',
      cursorKeyTimes,
      cursorValues,
      cursorFillValue,
      ...animationParams
    };
  }).filter(Boolean);
}

