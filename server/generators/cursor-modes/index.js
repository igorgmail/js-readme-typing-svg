/**
 * Конфигурация типов курсора
 */
export const CURSOR_OPTIONS = {
  none: {
    value: 'none',
    label: 'None',
    icon: '',
  },
  straight: {
    value: 'straight',
    label: 'Straight',
    icon: '|',
  },
  underlined: {
    value: 'underlined',
    label: 'Underlined',
    icon: '_',
  },
  block: {
    value: 'block',
    label: 'Block',
    icon: '█',
  },
  emoji: {
    value: 'emoji',
    label: 'Emoji',
    icon: '🔥',
  },
  custom: {
    value: 'custom',
    label: 'Custom',
    icon: '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 0L100 100H0L50 0Z" fill="currentColor" /></svg>',
  }

};

/** Значение параметров для скрытия курсора при завершении (достижения конца строк*/
const hideWhenFinished = [{
  repeat: true,
}];

/** Значение параметров для отображения курсора при имитации печати*/
const allowOptions = [{
  eraseMode: 'line',
}];

/**
 * Получает информацию о типе курсора
 * @param {string} cursorStyle - тип курсора
 * @returns {Object} информация о курсоре
 */
export function getCursorInfo(cursorStyle) {
  return CURSOR_OPTIONS[cursorStyle] || CURSOR_OPTIONS.none;
}

