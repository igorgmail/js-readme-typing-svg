/**
 * Erase mode 'line' - text is erased line by line
 */
import { EraseMode } from './EraseMode.js';
import { getRemainingTextWidth } from '../../fonts/font-metrics.js';
import { stripStyleMarkers } from '../../processors/style-segments-parser.js';

/**
 * Calculates time marks for erase effect
 */
function computeEraseTimes(printDuration, delayBetweenLines, eraseDuration, totalDuration) {
  const start = (printDuration + delayBetweenLines) / totalDuration;
  const end = (printDuration + delayBetweenLines + eraseDuration) / totalDuration;
  return { start, end };
}

/**
 * Generates character-by-character erase from right to left
 * @param {Object} config - configuration
 * @returns {Object} keyTimes and pathValues for character-by-character erase
 */
function generateCharByCharErase(config) {
  const {
    startX, y, textWidth, line, fontSize, letterSpacing, eraseSpeed,
    eraseStart, eraseEnd, totalDuration, fontFamily, parsedFont, fontsMap
  } = config;
  
  // Use cleanLine to count real characters (without style markers)
  const cleanLine = stripStyleMarkers(line);
  const chars = [...cleanLine];
  const charCount = chars.length;
  
  // If line is empty, return simple animation
  if (charCount === 0) {
    return {
      keyTimes: '0;1',
      pathValues: `m${startX},${y} h0 ; m${startX},${y} h0`
    };
  }
  
  // Calculate keyTimes and pathValues for character-by-character erase
  const keyTimes = [];
  const pathValues = [];
  
  // Add initial points (before erase)
  keyTimes.push(0);
  pathValues.push(`m${startX},${y} h0`);
  
  // If printStart and printEnd exist, add them (for multiline mode)
  if (config.printStart !== undefined && config.printEnd !== undefined) {
    keyTimes.push(config.printStart);
    pathValues.push(`m${startX},${y} h0`);
    keyTimes.push(config.printEnd);
    pathValues.push(`m${startX},${y} h${textWidth}`);
  } else if (config.printEnd !== undefined) {
    // If only printEnd exists (for single line or replacing mode)
    keyTimes.push(config.printEnd);
    pathValues.push(`m${startX},${y} h${textWidth}`);
  }
  
  // Add erase start point (text is still fully visible)
  keyTimes.push(eraseStart);
  pathValues.push(`m${startX},${y} h${textWidth}`);
  
  // Generate intermediate points for each character (erase from right to left)
  // Start from charCount - 1 to avoid duplicating erase start point
  for (let i = charCount - 1; i >= 0; i--) {
    // Calculate remaining width using precise font metrics with styles
    const remainingWidth = getRemainingTextWidth(line, i, fontSize, parsedFont, letterSpacing, fontsMap);
    
    const charIndex = charCount - i;
    const timeProgress = charIndex / charCount;
    const currentTime = eraseStart + (eraseEnd - eraseStart) * timeProgress;
    
    keyTimes.push(currentTime);
    pathValues.push(`m${startX},${y} h${remainingWidth}`);
  }
  
  // Add final point to complete animation
  if (keyTimes[keyTimes.length - 1] < 1) {
    keyTimes.push(1);
    pathValues.push(`m${startX},${y} h0`);
  }
  
  return {
    keyTimes: keyTimes.join(';'),
    pathValues: pathValues.join(' ; ')
  };
}

export class LineEraseMode extends EraseMode {
  calculateReplacingMode(config) {
    const {
      startX, y, textWidth, printDuration, delayBetweenLines,
      eraseDuration, totalDuration, line, fontSize, letterSpacing, eraseSpeed, fontFamily, parsedFont, fontsMap
    } = config;
    
    const printEnd = printDuration / totalDuration;
    const eraseTimes = computeEraseTimes(printDuration, delayBetweenLines, eraseDuration, totalDuration);
    
    // Generate character-by-character erase
    const eraseAnimation = generateCharByCharErase({
      startX, y, textWidth, line, fontSize, letterSpacing, eraseSpeed, fontFamily, parsedFont, fontsMap,
      eraseStart: eraseTimes.start, eraseEnd: eraseTimes.end, totalDuration, printEnd
    });
    
    return {
      useFadeErase: false,
      fadeEraseStart: 0,
      fadeEraseEnd: 0,
      keyTimes: eraseAnimation.keyTimes,
      pathValues: eraseAnimation.pathValues
    };
  }
  
  calculateMultiLineMode(config) {
    const {
      startX, y, textWidth, printStart, printEnd, eraseStart, eraseEnd,
      line, fontSize, letterSpacing, eraseSpeed, totalDuration, fontFamily, parsedFont, fontsMap
    } = config;
    
    // Generate character-by-character erase
    const eraseAnimation = generateCharByCharErase({
      startX, y, textWidth, line, fontSize, letterSpacing, eraseSpeed, fontFamily, parsedFont, fontsMap,
      eraseStart, eraseEnd, totalDuration, printStart, printEnd
    });
    
    return {
      useFadeErase: false,
      fadeEraseStart: 0,
      fadeEraseEnd: 0,
      keyTimes: eraseAnimation.keyTimes,
      pathValues: eraseAnimation.pathValues
    };
  }
  
  calculateSingleLineMode(config) {
    const {
      startX, y, textWidth, printDuration, totalDuration,
      line, fontSize, letterSpacing, eraseSpeed, eraseDuration, delayBetweenLines, fontFamily, parsedFont, fontsMap
    } = config;
    
    const printEnd = printDuration / totalDuration;
    const eraseStart = (printDuration + delayBetweenLines) / totalDuration;
    const eraseEnd = (printDuration + delayBetweenLines + eraseDuration) / totalDuration;
    
    // Generate character-by-character erase
    const eraseAnimation = generateCharByCharErase({
      startX, y, textWidth, line, fontSize, letterSpacing, eraseSpeed, fontFamily, parsedFont, fontsMap,
      eraseStart, eraseEnd, totalDuration, printEnd
    });
    
    return {
      useFadeErase: false,
      fadeEraseStart: 0,
      fadeEraseEnd: 0,
      keyTimes: eraseAnimation.keyTimes,
      pathValues: eraseAnimation.pathValues
    };
  }
}

