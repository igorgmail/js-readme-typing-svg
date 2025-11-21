/**
 * Режим стирания 'block-line' - текст стирается блоками построчно
 */
import { EraseMode } from './EraseMode.js';

export class BlockLineEraseMode extends EraseMode {
  calculateReplacingMode(config) {
    // Для режима замены block-line работает так же как line
    const {
      startX, y, textWidth, printDuration, delayAfterBlockPrint,
      eraseDuration, delayAfterErase, totalDuration
    } = config;
    
    const printEnd = printDuration / totalDuration;
    const eraseStart = (printDuration + delayAfterBlockPrint) / totalDuration;
    const eraseEnd = (printDuration + delayAfterBlockPrint + eraseDuration) / totalDuration;
    
    return {
      useFadeErase: false,
      fadeEraseStart: 0,
      fadeEraseEnd: 0,
      keyTimes: `0;${printEnd};${eraseStart};${eraseEnd};1`,
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

