/**
 * Модуль для загрузки дефолтных значений с сервера
 * 
 * Дефолты загружаются с API endpoint /api/defaults один раз при инициализации.
 * Если API недоступен, используются захардкоженные fallback значения.
 */

/**
 * Fallback дефолты (используются если API недоступен)
 * Синхронизированы с server/config/defaults.js
 */
const FALLBACK_DEFAULTS = {
  lines: 'Your text here',
  color: '000000',
  background: 'transparent',
  fontSize: 16,
  fontWeight: 700,
  fontFamily: 'Roboto',
  letterSpacing: 0,

  width: 800,
  height: 200,

  // printSpeed и eraseSpeed - количество символов в секунду (characters per second)
  printSpeed: 10,
  eraseSpeed: 10,

  delayBetweenLines: 800,

  repeat: false,
  verticalAlign: 'top',
  horizontalAlign: 'left',

  multiLine: false,
  eraseMode: 'line', // none | line | fade
  cursorStyle: 'none' // none | straight | underlined | block
};

let cachedDefaults = null;

/**
 * Загружает дефолтные параметры с сервера
 * @returns {Promise<Object>} дефолтные параметры
 */
export async function fetchDefaults() {
  if (cachedDefaults) {
    return cachedDefaults;
  }

  try {
    const response = await fetch('/api/defaults', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      // Таймаут 3 секунды
      signal: AbortSignal.timeout(3000)
    });

    if (!response.ok) {
      console.warn('Failed to fetch defaults from API, using fallback');
      cachedDefaults = FALLBACK_DEFAULTS;
      return cachedDefaults;
    }

    const defaults = await response.json();
    cachedDefaults = defaults;
    return defaults;
  } catch (error) {
    console.warn('Error fetching defaults, using fallback:', error.message);
    cachedDefaults = FALLBACK_DEFAULTS;
    return cachedDefaults;
  }
}

/**
 * Синхронный доступ к дефолтам (возвращает fallback до загрузки)
 * @deprecated Используйте fetchDefaults() для гарантированно актуальных данных
 */
export const DEFAULT_PARAMS = cachedDefaults || FALLBACK_DEFAULTS;
