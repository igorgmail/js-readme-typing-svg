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
 * Находит переменные в строке с учетом вложенных скобок
 * @param {string} str - строка для поиска
 * @returns {Array} массив объектов {start, end, varName, paramsStr}
 */
function findVariablesWithBalancedBraces(str) {
  const variables = [];
  const varNameRegex = /\$(\w+)/g;
  let match;
  
  // Находим все потенциальные начала переменных
  while ((match = varNameRegex.exec(str)) !== null) {
    const varName = match[1];
    const startPos = match.index;
    const afterVarPos = match.index + match[0].length;
    
    // Проверяем, есть ли после имени переменной открывающая скобка
    if (str[afterVarPos] === '{') {
      // Ищем соответствующую закрывающую скобку с учетом баланса
      let braceCount = 0;
      let endPos = afterVarPos;
      let inQuotes = false;
      let quoteChar = '';
      
      for (let i = afterVarPos; i < str.length; i++) {
        const char = str[i];
        
        // Обрабатываем кавычки
        if ((char === '"' || char === "'") && (i === 0 || str[i - 1] !== '\\')) {
          if (!inQuotes) {
            inQuotes = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuotes = false;
            quoteChar = '';
          }
        }
        
        // Считаем скобки только вне кавычек
        if (!inQuotes) {
          if (char === '{') {
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              endPos = i;
              break;
            }
          }
        }
      }
      
      // Если нашли закрывающую скобку
      if (braceCount === 0 && endPos > afterVarPos) {
        const paramsStr = str.substring(afterVarPos + 1, endPos);
        variables.push({
          start: startPos,
          end: endPos + 1,
          varName: varName,
          paramsStr: paramsStr,
          fullMatch: str.substring(startPos, endPos + 1)
        });
      }
    } else {
      // Переменная без параметров (например, $DATE без скобок)
      variables.push({
        start: startPos,
        end: afterVarPos,
        varName: varName,
        paramsStr: '',
        fullMatch: match[0]
      });
    }
  }
  
  return variables;
}

/**
 * Проверяет, содержит ли строка переменные
 * @param {string} str - строка для проверки
 * @returns {boolean} true если содержит переменные
 */
function hasVariables(str) {
  return /\$\w+/.test(str);
}

/**
 * Основная функция парсинга переменных в строке
 * Поддерживает вложенные переменные через многопроходный парсинг
 * @param {string} str - строка с переменными
 * @param {number} maxIterations - максимальное количество итераций (защита от бесконечных циклов)
 * @returns {string} строка с замененными переменными
 */
export function parseVariables(str, maxIterations = 10) {
  let result = str;
  let iterations = 0;
  
  // Парсим пока есть переменные и не достигли лимита итераций
  while (hasVariables(result) && iterations < maxIterations) {
    const prevResult = result;
    
    // Находим все переменные с учетом вложенных скобок
    const variables = findVariablesWithBalancedBraces(result);
    
    if (variables.length === 0) {
      break; // Нет переменных для замены
    }
    
    // Ищем "самую внутреннюю" переменную (которая не содержит других переменных в параметрах)
    let targetVariable = null;
    for (const variable of variables) {
      // Проверяем, есть ли вложенные переменные в параметрах
      if (!hasVariables(variable.paramsStr)) {
        targetVariable = variable;
        break; // Нашли самую внутреннюю переменную
      }
    }
    
    // Если не нашли переменную без вложенных, берем первую
    // (это может быть переменная без параметров или с уже обработанными параметрами)
    if (!targetVariable && variables.length > 0) {
      targetVariable = variables[0];
    }
    
    if (!targetVariable) {
      break; // Нечего заменять
    }
    
    // Обрабатываем найденную переменную
    const params = parseParams(targetVariable.paramsStr);
    let replacement = targetVariable.fullMatch;
    
    // Обработка различных типов переменных
    switch (targetVariable.varName.toUpperCase()) {
      case 'DATE':
        replacement = processDateVariable(params);
        break;
      
      case 'RELATIVE_DATE':
      case 'RELDATE':
        replacement = processRelativeDateVariable(params);
        break;
      
      case 'STYLE':
        replacement = processStyleVariable(params);
        break;
      
      // Здесь можно добавить другие переменные
      // case 'TIME':
      //   replacement = processTimeVariable(params);
      //   break;
      // case 'USER':
      //   replacement = processUserVariable(params);
      //   break;
      
      default:
        // Если переменная не распознана, оставляем как есть
        replacement = targetVariable.fullMatch;
    }
    
    // Заменяем переменную на результат
    result = result.substring(0, targetVariable.start) + replacement + result.substring(targetVariable.end);
    
    // Проверка на зацикливание - если строка не изменилась, выходим
    if (result === prevResult) {
      break;
    }
    
    iterations++;
  }
  
  // Предупреждение в консоль, если достигли лимита (возможно зацикливание)
  if (iterations >= maxIterations && hasVariables(result)) {
    console.warn('parseVariables: достигнут лимит итераций. Возможно зацикливание в переменных.');
  }
  
  return result;
}

/**
 * Парсит массив строк, заменяя переменные
 * @param {Array<string>} lines - массив строк
 * @returns {Array<string>} массив с обработанными строками
 */
export function parseLines(lines) {
  return lines.map(line => parseVariables(line));
}

