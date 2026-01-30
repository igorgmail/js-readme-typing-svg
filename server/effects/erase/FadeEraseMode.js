/**
 * Erase mode 'fade' - text disappears by fading out (opacity)
 */
import { EraseMode } from './EraseMode.js';

/**
 * Calculates time marks for fade erase effect
 */
function computeFadeEraseTimes(printDuration, delayBetweenLines, eraseDuration, totalDuration) {
  const start = (printDuration + delayBetweenLines) / totalDuration;
  const end = (printDuration + delayBetweenLines + eraseDuration) / totalDuration;
  return { start, end };
}

export class FadeEraseMode extends EraseMode {
  calculateReplacingMode(config) {
    const {
      startX, y, textWidth, printDuration, delayBetweenLines,
      eraseDuration, totalDuration
    } = config;
    
    const printEnd = printDuration / totalDuration;
    const fadeTimes = computeFadeEraseTimes(printDuration, delayBetweenLines, eraseDuration, totalDuration);
    
    return {
      useFadeErase: true,
      fadeEraseStart: fadeTimes.start,
      fadeEraseEnd: fadeTimes.end,
      keyTimes: `0;${printEnd};${fadeTimes.start};${fadeTimes.end};1`,
      pathValues: `m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth}`
    };
  }
  
  calculateMultiLineMode(config) {
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
  
  calculateSingleLineMode(config) {
    const {
      startX, y, textWidth, printDuration, delayBetweenLines,
      eraseDuration, totalDuration
    } = config;
    
    const printEnd = printDuration / totalDuration;
    const fadeTimes = computeFadeEraseTimes(printDuration, delayBetweenLines, eraseDuration, totalDuration);
    
    return {
      useFadeErase: true,
      fadeEraseStart: fadeTimes.start,
      fadeEraseEnd: fadeTimes.end,
      keyTimes: `0;${printEnd};${fadeTimes.start};${fadeTimes.end};1`,
      pathValues: `m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth}`
    };
  }
}

