/**
 * Модуль для парсинга query параметров на сервере
 * Адаптированная версия url-parser.js для работы без window
 */

/**
 * Парсит строку lines (разделитель: точка с запятой)
 * @param {string} linesStr - строка с текстом, разделенным ;
 * @returns {Array<string>} массив строк (или пустой массив если строка пустая)
 */
function parseLines(linesStr) {
  if (!linesStr || typeof linesStr !== 'string') return [];
  
  // Разбиваем по ; на отдельные строки
  const parsed = linesStr.split(';').map(line => line.trim()).filter(line => line);
  return parsed.length > 0 ? parsed : [];
}

/**
 * Преобразует строковые значения параметров в нужные типы
 * @param {string} key - ключ параметра
 * @param {string} value - значение параметра
 * @returns {*} преобразованное значение
 */
function convertParamType(key, value) {
  // Булевы параметры
  const booleanParams = ['multiLine', 'showCaret', 'repeat'];
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
    'fontWeight',
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
  
  // Цветовые параметры - оставляем как есть (без #, т.к. это может быть transparent)
  const colorParams = ['color', 'background'];
  if (colorParams.includes(key)) {
    if (value === 'transparent') return value;
    // Если уже есть #, оставляем, иначе не добавляем (будет добавлено в генераторе при необходимости)
    return value;
  }
  
  // Для остальных возвращаем строку
  return value;
}

/**
 * Преобразует query параметры Express в объект опций для генераторов SVG
 * @param {Object} query - объект req.query из Express
 * @returns {Object} объект опций для генераторов
 */
export function parseQueryParams(query) {
  const options = {};
  
  // Обрабатываем lines (специальный параметр)
  // Если lines передан - парсим его в массив
  // Если не передан - оставляем undefined (будет использован дефолт)
  if (query.lines !== undefined && query.lines !== null) {
    const parsed = parseLines(query.lines);
    // Сохраняем только если есть хотя бы одна строка
    if (parsed.length > 0) {
      options.lines = parsed;
    }
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
    font: 'fontSize', // алиас для fontSize
    fontWeight: 'fontWeight',
    fontFamily: 'fontFamily',
    lineHeight: 'lineHeight',
    letterSpacing: 'letterSpacing',

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
    showCaret: 'showCaret',
    repeat: 'repeat'
  };
  
  // Применяем маппинг
  for (const [urlKey, optionKey] of Object.entries(paramMapping)) {
    if (query[urlKey] !== undefined && optionKey !== null) {
      const value = convertParamType(optionKey, query[urlKey]);
      // Отладка для multiLine
      // if (optionKey === 'multiLine') {
      //   console.log(`parseQueryParams - urlKey: ${urlKey}, query[urlKey]: ${query[urlKey]}, value: ${value}`);
      // }
      if (value !== undefined) {
        options[optionKey] = value;
      }
    }
  }
  
  // Специальная обработка center
  if (query.center === 'true' || query.center === '1') {
    options.horizontalAlign = 'center';
    options.verticalAlign = 'middle';
  }
  
  return options;
}

