/**
 * Режим стирания 'block-line' - текст стирается блоками построчно
 */
import { EraseMode } from './EraseMode.js';
import { parseLetterSpacing } from '../utils/text-utils.js';

/**
 * Генерирует посимвольное стирание справа налево
 * @param {Object} config - конфигурация
 * @returns {Object} keyTimes и pathValues для посимвольного стирания
 */
function generateCharByCharErase(config) {
  const {
    startX, y, textWidth, line, fontSize, letterSpacing, eraseSpeed,
    eraseStart, eraseEnd, totalDuration
  } = config;
  
  const spacing = parseLetterSpacing(letterSpacing, fontSize);
  const charBaseWidth = fontSize * 0.6;
  const charCount = line.length;
  
  // Если строка пустая, возвращаем простую анимацию
  if (charCount === 0) {
    return {
      keyTimes: '0;1',
      pathValues: `m${startX},${y} h0 ; m${startX},${y} h0`
    };
  }
  
  // Вычисляем keyTimes и pathValues для посимвольного стирания
  const keyTimes = [];
  const pathValues = [];
  
  // Добавляем начальные точки (до стирания)
  keyTimes.push(0);
  pathValues.push(`m${startX},${y} h0`);
  
  // Если есть printStart и printEnd, добавляем их (для многострочного режима)
  if (config.printStart !== undefined && config.printEnd !== undefined) {
    keyTimes.push(config.printStart);
    pathValues.push(`m${startX},${y} h0`);
    keyTimes.push(config.printEnd);
    pathValues.push(`m${startX},${y} h${textWidth}`);
  } else if (config.printEnd !== undefined) {
    // Если есть только printEnd (для single line или replacing mode)
    keyTimes.push(config.printEnd);
    pathValues.push(`m${startX},${y} h${textWidth}`);
  }
  
  // Добавляем точку начала стирания (текст еще полностью виден)
  keyTimes.push(eraseStart);
  pathValues.push(`m${startX},${y} h${textWidth}`);
  
  // Генерируем промежуточные точки для каждого символа (стираем справа налево)
  // Начинаем с charCount - 1, чтобы не дублировать точку начала стирания
  for (let i = charCount - 1; i >= 0; i--) {
    // Вычисляем оставшуюся ширину: i символов * (ширина символа + spacing) - spacing для последнего символа
    const remainingWidth = i > 0 
      ? i * charBaseWidth + (i - 1) * spacing
      : 0;
    
    const charIndex = charCount - i;
    const timeProgress = charIndex / charCount;
    const currentTime = eraseStart + (eraseEnd - eraseStart) * timeProgress;
    
    keyTimes.push(currentTime);
    pathValues.push(`m${startX},${y} h${remainingWidth}`);
  }
  
  // Добавляем финальную точку для завершения анимации
  if (keyTimes[keyTimes.length - 1] < 1) {
    keyTimes.push(1);
    pathValues.push(`m${startX},${y} h0`);
  }
  
  return {
    keyTimes: keyTimes.join(';'),
    pathValues: pathValues.join(' ; ')
  };
}

export class BlockLineEraseMode extends EraseMode {
  calculateReplacingMode(config) {
    // Для режима замены block-line работает так же как line
    const {
      startX, y, textWidth, printDuration, delayAfterBlockPrint,
      eraseDuration, delayAfterErase, totalDuration, line, fontSize, letterSpacing, eraseSpeed
    } = config;
    
    const printEnd = printDuration / totalDuration;
    const eraseStart = (printDuration + delayAfterBlockPrint) / totalDuration;
    const eraseEnd = (printDuration + delayAfterBlockPrint + eraseDuration) / totalDuration;
    
    // Генерируем посимвольное стирание
    const eraseAnimation = generateCharByCharErase({
      startX, y, textWidth, line, fontSize, letterSpacing, eraseSpeed,
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
  
  calculateMultiLineMode(config) {
    const {
      startX, y, textWidth, printStart, printEnd, eraseStart, eraseEnd,
      line, fontSize, letterSpacing, eraseSpeed, totalDuration
    } = config;
    
    // Генерируем посимвольное стирание
    const eraseAnimation = generateCharByCharErase({
      startX, y, textWidth, line, fontSize, letterSpacing, eraseSpeed,
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
      line, fontSize, letterSpacing, eraseSpeed, eraseDuration, delayAfterBlockPrint, delayAfterErase
    } = config;
    
    const printEnd = printDuration / totalDuration;
    const eraseStart = (printDuration + delayAfterBlockPrint) / totalDuration;
    const eraseEnd = (printDuration + delayAfterBlockPrint + eraseDuration) / totalDuration;
    
    // Генерируем посимвольное стирание
    const eraseAnimation = generateCharByCharErase({
      startX, y, textWidth, line, fontSize, letterSpacing, eraseSpeed,
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

