/**
 * Module for parsing and processing variables in strings
 * Works both on server (Node.js) and in browser
 */

/**
 * Parses parameters from string in format {key: value, key2: value2}
 * @param {string} paramsStr - string with parameters
 * @returns {Object} object with parsed parameters
 */
function parseParams(paramsStr) {
  const params = {};
  
  if (!paramsStr) return params;
  
  // split by commas and parse key: value pairs
  const pairs = paramsStr.split(',').map(p => p.trim());
  
  pairs.forEach(pair => {
    const [key, ...valueParts] = pair.split(':');
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim();
      params[key.trim()] = value;
    }
  });
  
  return params;
}

/**
 * Processes $DATE variable
 * Uses native Intl.DateTimeFormat API
 * @param {Object} params - parameters from curly braces
 * @returns {string} formatted date
 */
function processDateVariable(params) {
  const date = new Date();
  const locale = params.locale || 'en';
  
  // If preset style is used (full, long, medium, short)
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
  
  // Otherwise use detailed component options
  try {
    const options = {};
    
    // Date options
    if (params.year) options.year = params.year; // numeric, 2-digit
    if (params.month) options.month = params.month; // numeric, 2-digit, long, short, narrow
    if (params.day) options.day = params.day; // numeric, 2-digit
    if (params.weekday) options.weekday = params.weekday; // long, short, narrow
    
    // Time options
    if (params.hour) options.hour = params.hour; // numeric, 2-digit
    if (params.minute) options.minute = params.minute; // numeric, 2-digit
    if (params.second) options.second = params.second; // numeric, 2-digit
    
    // Additional options
    if (params.timeZone) options.timeZone = params.timeZone;
    if (params.hour12 !== undefined) options.hour12 = params.hour12 === 'true';
    
    // If options are not specified, use defaults
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
 * Processes $RELATIVE_DATE variable
 * Uses native Intl.RelativeTimeFormat API
 * @param {Object} params - parameters from curly braces
 * @returns {string} formatted relative time
 */
function processRelativeDateVariable(params) {
  const locale = params.locale || 'en';
  const numeric = params.numeric || 'auto'; // auto | always
  const style = params.style || 'long'; // long | short | narrow
  const unit = params.unit || 'day'; // year | quarter | month | week | day | hour | minute | second
  
  let value = 0;
  
  // If value is specified directly
  if (params.value !== undefined) {
    value = parseInt(params.value, 10);
  }
  // If date for comparison is specified - calculate difference
  else if (params.date) {
    const targetDate = new Date(params.date);
    const now = new Date();
    const diffMs = targetDate - now;
    
    // Simple calculation of difference in specified units
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
  
  // Use native Intl.RelativeTimeFormat - it does all the work
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric, style });
    return rtf.format(value, unit);
  } catch (error) {
    console.error('RelativeTimeFormat error:', error);
    // Fallback to simple formatting
    return `${value} ${unit}${Math.abs(value) !== 1 ? 's' : ''}`;
  }
}

/**
 * Main function for parsing variables in string
 * @param {string} str - string with variables
 * @returns {string} string with replaced variables
 */
export function parseVariables(str) {
  // Regular expression to find variables in format $VAR{params}
  const variableRegex = /\$(\w+)(?:\{([^}]*)\})?/g;
  
  return str.replace(variableRegex, (match, varName, paramsStr) => {
    const params = parseParams(paramsStr);
    
    // Process different types of variables
    switch (varName.toUpperCase()) {
      case 'DATE':
        return processDateVariable(params);
      
      case 'RELATIVE_DATE':
      case 'RELDATE':
        return processRelativeDateVariable(params);
      
      // Other variables can be added here
      // case 'TIME':
      //   return processTimeVariable(params);
      // case 'USER':
      //   return processUserVariable(params);
      
      default:
        // If variable is not recognized, leave as is
        return match;
    }
  });
}

/**
 * Parses array of strings, replacing variables
 * @param {Array<string>} lines - array of strings
 * @returns {Array<string>} array with processed strings
 */
export function parseLines(lines) {
  return lines.map(line => parseVariables(line));
}

