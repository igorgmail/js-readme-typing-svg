/**
 * Модуль для парсинга URL query параметров и генерации опций для SVG
 */

/**
 * Парсит URL query параметры в объект
 * @returns {Object} объект с параметрами из URL
 */
export function parseURLParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  
  return result;
}

/**
 * Парсит строку lines (разделитель: точка с запятой)
 * @param {string} linesStr - строка с текстом, разделенным ;
 * @returns {Array<string>} массив строк
 */
function parseLines(linesStr) {
  if (!linesStr) return [];
  
  // URLSearchParams уже декодирует значения автоматически,
  // поэтому не нужен decodeURIComponent
  // Разбиваем по ; на отдельные строки
  return linesStr.split(';').map(line => line.trim()).filter(line => line);
}

/**
 * Преобразует строковые значения параметров в нужные типы
 * @param {string} key - ключ параметра
 * @param {string} value - значение параметра
 * @returns {*} преобразованное значение
 */
function convertParamType(key, value) {
  // Булевы параметры
  const booleanParams = ['multiLine'];
  if (booleanParams.includes(key)) {
    return value === 'true' || value === '1';
  }
  
  // Числовые параметры
  const numberParams = [
    'printSpeed', 
    'eraseSpeed', 
    'delayAfterBlockPrint', 
    'delayAfterErase',
    'fontSize',
    'lineHeight',
    'width',
    'height',
    'paddingX',
    'paddingY'
  ];
  if (numberParams.includes(key)) {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  }
  
  // Цветовые параметры - добавляем # если его нет
  const colorParams = ['color', 'background'];
  if (colorParams.includes(key)) {
    if (value === 'transparent') return value;
    return value.startsWith('#') ? value : '#' + value;
  }
  
  // Для остальных возвращаем строку
  return value;
}

/**
 * Преобразует URL параметры в опции для createMultilineBlockTypingSVG
 * @param {Object} urlParams - объект с параметрами из URL
 * @returns {Object} объект опций для функции
 */
export function urlParamsToOptions(urlParams) {
  const options = {};
  
  // Обрабатываем lines (специальный параметр)
  if (urlParams.lines) {
    options.lines = parseLines(urlParams.lines);
  }
  
  // Маппинг параметров URL -> опции функции
  const paramMapping = {
    // Анимация
    printSpeed: 'printSpeed',
    eraseSpeed: 'eraseSpeed',
    duration: 'printSpeed', // алиас
    delayAfterBlockPrint: 'delayAfterBlockPrint',
    delayAfterErase: 'delayAfterErase',
    pause: 'delayAfterBlockPrint', // алиас
    
    // Визуальные параметры
    fontSize: 'fontSize',
    font: 'fontSize', // алиас
    lineHeight: 'lineHeight',
    color: 'color',
    background: 'background',
    
    // Размеры
    width: 'width',
    height: 'height',
    paddingX: 'paddingX',
    paddingY: 'paddingY',
    
    // Выравнивание
    verticalAlign: 'verticalAlign',
    vAlign: 'verticalAlign', // алиас
    horizontalAlign: 'horizontalAlign',
    hAlign: 'horizontalAlign', // алиас
    center: null, // обрабатывается отдельно
    
    // Режимы
    typingMode: 'typingMode',
    eraseMode: 'eraseMode',
    multiLine: 'multiLine',
    multiline: 'multiLine', // алиас
  };
  
  // Применяем маппинг
  for (const [urlKey, optionKey] of Object.entries(paramMapping)) {
    if (urlParams[urlKey] !== undefined && optionKey !== null) {
      const value = convertParamType(optionKey, urlParams[urlKey]);
      if (value !== undefined) {
        options[optionKey] = value;
      }
    }
  }
  
  // Специальная обработка center
  if (urlParams.center === 'true' || urlParams.center === '1') {
    options.horizontalAlign = 'center';
    options.verticalAlign = 'middle';
  }
  
  // Отладочное логирование
  console.log('URL params:', urlParams);
  console.log('Parsed options:', options);
  
  return options;
}

/**
 * Инициализирует SVG из URL параметров
 * @param {Function} createSVGFunction - функция создания SVG
 * @param {HTMLElement} container - контейнер для SVG
 * @returns {Object} опции, с которыми был создан SVG
 */
export function initFromURL(createSVGFunction, container = null) {
  const urlParams = parseURLParams();
  const options = urlParamsToOptions(urlParams);
  
  // Добавляем контейнер если указан
  if (container) {
    options.container = container;
  }
  
  // Проверяем наличие обязательных параметров
  if (!options.lines || options.lines.length === 0) {
    console.warn('No lines parameter in URL. Using default.');
    options.lines = ['Add ?lines=Your+text+here to URL'];
  }
  
  // Вызываем функцию создания SVG
  createSVGFunction(options);
  
  return options;
}

/**
 * Генерирует URL с параметрами на основе опций
 * @param {Object} options - опции для SVG
 * @param {string} baseURL - базовый URL (по умолчанию текущий)
 * @returns {string} полный URL с параметрами
 */
export function optionsToURL(options, baseURL = window.location.origin + window.location.pathname) {
  const params = new URLSearchParams();
  
  // lines - специальная обработка
  if (options.lines && options.lines.length > 0) {
    const linesStr = options.lines.join(';');
    params.append('lines', linesStr);
  }
  
  // Остальные параметры
  const simpleParams = [
    'printSpeed', 'eraseSpeed', 'delayAfterBlockPrint', 'delayAfterErase',
    'fontSize', 'lineHeight', 'color', 'background',
    'width', 'height', 'paddingX', 'paddingY',
    'verticalAlign', 'horizontalAlign',
    'typingMode', 'eraseMode', 'multiLine'
  ];
  
  simpleParams.forEach(key => {
    if (options[key] !== undefined) {
      params.append(key, options[key]);
    }
  });
  
  return `${baseURL}?${params.toString()}`;
}

