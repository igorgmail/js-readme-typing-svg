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
    label: 'Emoji 🔥',
    icon: '🔥',
  },
  custom: {
    value: 'custom',
    label: 'Custom',
    // Для custom пока оставляем SVG-иконку как строку.
    // В текущем генераторе она не используется напрямую.
    icon: '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 0L100 100H0L50 0Z" fill="currentColor" /></svg>',
  },
};

/**
 * Значение параметров, при которых курсор по завершении
 * анимации должен пропадать (достижение конца строк)
 */
const hideWhenFinished = [
  {
    repeat: false,
  },
];

/**
 * Значение параметров, при которых допустимо отображение курсора
 * (имитация печати + поддерживаемые режимы стирания)
 */
const allowOptions = [
  {
    eraseMode: 'line',
  },
];

/**
 * Получает информацию о типе курсора
 * @param {string} cursorStyle - тип курсора
 * @returns {Object} информация о курсоре
 */
export function getCursorInfo(cursorStyle) {
  return CURSOR_OPTIONS[cursorStyle] || CURSOR_OPTIONS.none;
}

/**
 * Проверяет, разрешено ли отображение курсора для переданных параметров
 * @param {Object} params - нормализованные параметры генератора
 * @returns {boolean}
 */
export function isCursorAllowed(params) {
  if (!params || !params.cursorStyle || params.cursorStyle === 'none') {
    return false;
  }

  return allowOptions.some((rule) =>
    Object.entries(rule).every(([key, value]) => params[key] === value),
  );
}

/**
 * Проверяет, нужно ли скрывать курсор после завершения анимации
 * @param {Object} params - нормализованные параметры генератора
 * @returns {boolean}
 */
export function shouldHideCursorWhenFinished(params) {
  if (!params) {
    return false;
  }

  return hideWhenFinished.some((rule) =>
    Object.entries(rule).every(([key, value]) => params[key] === value),
  );
}

