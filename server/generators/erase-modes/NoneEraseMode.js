/**
 * Режим стирания 'none' - текст не стирается
 */
import { EraseMode } from './EraseMode.js';

export class NoneEraseMode extends EraseMode {
  calculateReplacingMode(config) {
    // Для режима замены без стирания - просто остается на месте
    const { startX, y, textWidth, printDuration, totalDuration } = config;
    
    const printEnd = printDuration / totalDuration;
    
    return {
      useFadeErase: false,
      fadeEraseStart: 0,
      fadeEraseEnd: 0,
      keyTimes: `0;${printEnd};1`,
      pathValues: `m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth}`
    };
  }
  
  calculateMultiLineMode(config) {
    const {
      startX, y, textWidth, printStart, printEnd
    } = config;
    
    return {
      useFadeErase: false,
      fadeEraseStart: 0,
      fadeEraseEnd: 0,
      keyTimes: `0;${printStart};${printEnd};0.99;1`,
      pathValues: `m${startX},${y} h0 ; m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth} ; m${startX},${y} h0`
    };
  }
  
  calculateSingleLineMode(config) {
    const { startX, y, textWidth, printDuration, totalDuration } = config;
    
    const printEnd = printDuration / totalDuration;
    
    return {
      useFadeErase: false,
      fadeEraseStart: 0,
      fadeEraseEnd: 0,
      keyTimes: `0;${printEnd};1`,
      pathValues: `m${startX},${y} h0 ; m${startX},${y} h${textWidth} ; m${startX},${y} h${textWidth}`
    };
  }
}

