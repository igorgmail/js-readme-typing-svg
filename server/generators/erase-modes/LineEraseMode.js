/**
 * Режим стирания 'line' - текст стирается построчно
 */
import { EraseMode } from './EraseMode.js';

/**
 * Вычисляет временные метки для эффекта стирания
 */
function computeEraseTimes(printDuration, delayAfterBlockPrint, eraseDuration, delayAfterErase, totalDuration) {
  const start = (printDuration + delayAfterBlockPrint) / totalDuration;
  const end = (printDuration + delayAfterBlockPrint + eraseDuration) / totalDuration;
  return { start, end };
}

export class LineEraseMode extends EraseMode {
  calculateReplacingMode(config) {
    const {
      startX, y, textWidth, printDuration, delayAfterBlockPrint,
      eraseDuration, delayAfterErase, totalDuration
    } = config;
    
    const printEnd = printDuration / totalDuration;
    const eraseTimes = computeEraseTimes(printDuration, delayAfterBlockPrint, eraseDuration, delayAfterErase, totalDuration);
    
    return {
      useFadeErase: false,
      fadeEraseStart: 0,
      fadeEraseEnd: 0,
      keyTimes: `0;${printEnd};${eraseTimes.start};${eraseTimes.end};1`,
      pathValues: `m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h0 ; m${startX},${y} h0`
    };
  }
  
  calculateMultiLineMode(config) {
    const {
      startX, y, textWidth, printStart, printEnd, eraseStart, eraseEnd
    } = config;
    
    return {
      useFadeErase: false,
      fadeEraseStart: 0,
      fadeEraseEnd: 0,
      keyTimes: `0;${printStart};${printEnd};${eraseStart};${eraseEnd};1`,
      pathValues: `m${startX},${y} h0 ; m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h0 ; m${startX},${y} h0`
    };
  }
  
  calculateSingleLineMode(config) {
    const {
      startX, y, textWidth, printDuration, totalDuration
    } = config;
    
    const printEnd = printDuration / totalDuration;
    
    return {
      useFadeErase: false,
      fadeEraseStart: 0,
      fadeEraseEnd: 0,
      keyTimes: `0;${printEnd};1;1`,
      pathValues: `m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h0`
    };
  }
}

