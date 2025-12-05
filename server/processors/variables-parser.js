/**
 * Модуль для парсинга и обработки переменных в строках
 */

/**
 * Парсит параметры из строки формата {key: value, key2: value2}
 * Поддерживает кавычки для значений с запятыми: text: "Hello, World"
 * @param {string} paramsStr - строка с параметрами
 * @returns {Object} объект с распарсенными параметрами
 */
function parseParams(paramsStr) {
  const params = {};
  
  if (!paramsStr) return params;
  
  // Разбиваем по запятым, но игнорируем запятые внутри кавычек
  const pairs = [];
  let currentPair = '';
  let inQuotes = false;
  let quoteChar = '';
  
  for (let i = 0; i < paramsStr.length; i++) {
    const char = paramsStr[i];
    
    // Проверяем открытие/закрытие кавычек
    if ((char === '"' || char === "'") && (i === 0 || paramsStr[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
      }
    }
    
    // Если запятая вне кавычек - это разделитель пар
    if (char === ',' && !inQuotes) {
      if (currentPair.trim()) {
        pairs.push(currentPair.trim());
      }
      currentPair = '';
    } else {
      currentPair += char;
    }
  }
  
  // Добавляем последнюю пару
  if (currentPair.trim()) {
    pairs.push(currentPair.trim());
  }
  
  // Парсим каждую пару key: value
  pairs.forEach(pair => {
    const colonIndex = pair.indexOf(':');
    if (colonIndex === -1) return;
    
    const key = pair.substring(0, colonIndex).trim();
    let value = pair.substring(colonIndex + 1).trim();
    
    // Убираем кавычки из значения
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    if (key) {
      params[key] = value;
    }
  });
  
  return params;
}

/**
 * Обрабатывает переменную $DATE
 * Использует нативный Intl.DateTimeFormat API
 * @param {Object} params - параметры из фигурных скобок
 * @returns {string} отформатированная дата
 */
function processDateVariable(params) {
  const date = new Date();
  const locale = params.locale || 'en';
  
  // Если используется preset стиль (full, long, medium, short)
  if (params.dateStyle || params.timeStyle) {
    try {
      const options = {};
      if (params.dateStyle) options.dateStyle = params.dateStyle; // full, long, medium, short
      if (params.timeStyle) options.timeStyle = params.timeStyle; // full, long, medium, short
      if (params.timeZone) options.timeZone = params.timeZone;
      
      return new Intl.DateTimeFormat(locale, options).format(date);
    } catch (error) {
      console.error('DateTimeFormat error:', error);
      return date.toLocaleDateString(locale);
    }
  }
  
  // Иначе используем детальные опции компонентов
  try {
    const options = {};
    
    // Опции даты
    if (params.year) options.year = params.year; // numeric, 2-digit
    if (params.month) options.month = params.month; // numeric, 2-digit, long, short, narrow
    if (params.day) options.day = params.day; // numeric, 2-digit
    if (params.weekday) options.weekday = params.weekday; // long, short, narrow
    
    // Опции времени
    if (params.hour) options.hour = params.hour; // numeric, 2-digit
    if (params.minute) options.minute = params.minute; // numeric, 2-digit
    if (params.second) options.second = params.second; // numeric, 2-digit
    
    // Дополнительные опции
    if (params.timeZone) options.timeZone = params.timeZone;
    if (params.hour12 !== undefined) options.hour12 = params.hour12 === 'true';
    
    // Если опции не указаны, используем дефолтные
    if (Object.keys(options).length === 0) {
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
    }
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    console.error('DateTimeFormat error:', error);
    return date.toLocaleDateString(locale);
  }
}

/**
 * Нормализует цвет в формат #RRGGBB или #RRGGBBAA
 * @param {string} color - цвет в любом формате
 * @returns {string} нормализованный цвет
 */
function normalizeColor(color) {
  if (!color) return null;
  
  const trimmed = color.trim();
  
  // Если уже начинается с # - возвращаем как есть
  if (trimmed.startsWith('#')) {
    return trimmed;
  }
  
  // Добавляем # если его нет
  return '#' + trimmed;
}

/**
 * Обрабатывает переменную $STYLE
 * Генерирует специальный маркер для последующей обработки в svg-renderer
 * @param {Object} params - параметры из фигурных скобок
 * @returns {string} маркер стиля для последующей обработки
 */
function processStyleVariable(params) {
  // Если есть параметр text - это inline стиль
  if (params.text) {
    const styles = {
      color: params.color ? normalizeColor(params.color) : null,
      background: params.background || params.bg || null,
      fontSize: params.fontSize || params.size || null,
      fontWeight: params.weight || params.fontWeight || null,
      opacity: params.opacity || null,
      italic: params.italic === 'true',
      underline: params.underline === 'true',
      strikethrough: params.strikethrough === 'true',
      fontFamily: params.fontFamily || params.font || null
    };
    
    // Создаем JSON-маркер который будет распознан при генерации SVG
    // Используем специальные символы для избежания конфликтов
    const styleMarker = `\x00STYLE_START\x00${JSON.stringify(styles)}\x00${params.text}\x00STYLE_END\x00`;
    return styleMarker;
  }
  
  // Если параметров нет - это может быть закрывающий тег (для будущего использования)
  return '';
}

/**
 * Обрабатывает переменную $RELATIVE_DATE
 * Использует нативный Intl.RelativeTimeFormat API
 * @param {Object} params - параметры из фигурных скобок
 * @returns {string} отформатированное относительное время
 */
function processRelativeDateVariable(params) {
  const locale = params.locale || 'en';
  const numeric = params.numeric || 'auto'; // auto | always
  const style = params.style || 'long'; // long | short | narrow
  const unit = params.unit || 'day'; // year | quarter | month | week | day | hour | minute | second
  
  let value = 0;
  
  // Если указано значение напрямую
  if (params.value !== undefined) {
    value = parseInt(params.value, 10);
  }
  // Если указана дата для сравнения - вычисляем разницу
  else if (params.date) {
    const targetDate = new Date(params.date);
    const now = new Date();
    const diffMs = targetDate - now;
    
    // Простое вычисление разницы в указанных единицах
    const msPerUnit = {
      year: 1000 * 60 * 60 * 24 * 365,
      quarter: 1000 * 60 * 60 * 24 * 91,
      month: 1000 * 60 * 60 * 24 * 30,
      week: 1000 * 60 * 60 * 24 * 7,
      day: 1000 * 60 * 60 * 24,
      hour: 1000 * 60 * 60,
      minute: 1000 * 60,
      second: 1000
    };
    
    value = Math.round(diffMs / (msPerUnit[unit] || msPerUnit.day));
  }
  
  // Используем нативный Intl.RelativeTimeFormat - он делает всю работу
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric, style });
    return rtf.format(value, unit);
  } catch (error) {
    console.error('RelativeTimeFormat error:', error);
    // Fallback на простое форматирование
    return `${value} ${unit}${Math.abs(value) !== 1 ? 's' : ''}`;
  }
}

/**
 * Основная функция парсинга переменных в строке
 * @param {string} str - строка с переменными
 * @returns {string} строка с замененными переменными
 */
export function parseVariables(str) {
  // Регулярка для поиска переменных вида $VAR{params}
  const variableRegex = /\$(\w+)(?:\{([^}]*)\})?/g;
  
  return str.replace(variableRegex, (match, varName, paramsStr) => {
    const params = parseParams(paramsStr);
    
    // Обработка различных типов переменных
    switch (varName.toUpperCase()) {
      case 'DATE':
        return processDateVariable(params);
      
      case 'RELATIVE_DATE':
      case 'RELDATE':
        return processRelativeDateVariable(params);
      
      case 'STYLE':
        return processStyleVariable(params);
      
      // Здесь можно добавить другие переменные
      // case 'TIME':
      //   return processTimeVariable(params);
      // case 'USER':
      //   return processUserVariable(params);
      
      default:
        // Если переменная не распознана, оставляем как есть
        return match;
    }
  });
}

/**
 * Парсит массив строк, заменяя переменные
 * @param {Array<string>} lines - массив строк
 * @returns {Array<string>} массив с обработанными строками
 */
export function parseLines(lines) {
  return lines.map(line => parseVariables(line));
}

