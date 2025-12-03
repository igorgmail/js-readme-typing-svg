/**
 * Режим стирания 'fade' - текст исчезает путем затухания (opacity)
 */
import { EraseMode } from './EraseMode.js';

/**
 * Вычисляет временные метки для fade эффекта стирания
 */
function computeFadeEraseTimes(printDuration, delayAfterBlockPrint, eraseDuration, delayAfterErase, totalDuration) {
  const start = (printDuration + delayAfterBlockPrint) / totalDuration;
  const end = (printDuration + delayAfterBlockPrint + eraseDuration) / totalDuration;
  return { start, end };
}

export class FadeEraseMode extends EraseMode {
  calculateReplacingMode(config) {
    const {
      startX, y, textWidth, printDuration, delayAfterBlockPrint,
      eraseDuration, delayAfterErase, totalDuration
    } = config;
    
    const printEnd = printDuration / totalDuration;
    const fadeTimes = computeFadeEraseTimes(printDuration, delayAfterBlockPrint, eraseDuration, delayAfterErase, totalDuration);
    
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
      startX, y, textWidth, printDuration, delayAfterBlockPrint,
      eraseDuration, delayAfterErase, totalDuration
    } = config;
    
    const printEnd = printDuration / totalDuration;
    const fadeTimes = computeFadeEraseTimes(printDuration, delayAfterBlockPrint, eraseDuration, delayAfterErase, totalDuration);
    
    return {
      useFadeErase: true,
      fadeEraseStart: fadeTimes.start,
      fadeEraseEnd: fadeTimes.end,
      keyTimes: `0;${printEnd};${fadeTimes.start};${fadeTimes.end};1`,
      pathValues: `m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth}`
    };
  }
}

