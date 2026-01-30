/**
 * Module for parsing and processing variables in strings
 */

/**
 * Parses parameters from a string in the format {key: value, key2: value2}
 * Supports quotes for values with commas: text: "Hello, World"
 * @param {string} paramsStr - string with parameters
 * @returns {Object} object with parsed parameters
 */
function parseParams(paramsStr) {
  const params = {};
  
  if (!paramsStr) return params;
  
  // Split by commas, but ignore commas inside quotes
  const pairs = [];
  let currentPair = '';
  let inQuotes = false;
  let quoteChar = '';
  
  for (let i = 0; i < paramsStr.length; i++) {
    const char = paramsStr[i];
    
    // Check for opening/closing quotes
    if ((char === '"' || char === "'") && (i === 0 || paramsStr[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
      }
    }
    
    // If comma is outside quotes - it's a pair separator
    if (char === ',' && !inQuotes) {
      if (currentPair.trim()) {
        pairs.push(currentPair.trim());
      }
      currentPair = '';
    } else {
      currentPair += char;
    }
  }
  
  // Add the last pair
  if (currentPair.trim()) {
    pairs.push(currentPair.trim());
  }
  
  // Parse each key: value pair
  pairs.forEach(pair => {
    const colonIndex = pair.indexOf(':');
    if (colonIndex === -1) return;
    
    const key = pair.substring(0, colonIndex).trim();
    let value = pair.substring(colonIndex + 1).trim();
    
    // Remove quotes from value
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
 * Processes the $DATE variable
 * Uses native Intl.DateTimeFormat API
 * @param {Object} params - parameters from curly braces
 * @returns {string} formatted date
 */
function processDateVariable(params) {
  const date = new Date();
  const locale = params.locale || 'en';
  
  // If using preset style (full, long, medium, short)
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
 * Normalizes color to #RRGGBB or #RRGGBBAA format
 * @param {string} color - color in any format
 * @returns {string} normalized color
 */
function normalizeColor(color) {
  if (!color) return null;
  
  const trimmed = color.trim();
  
  // If already starts with # - return as is
  if (trimmed.startsWith('#')) {
    return trimmed;
  }
  
  // Add # if it's missing
  return '#' + trimmed;
}

/**
 * Processes the $STYLE variable
 * Generates a special marker for subsequent processing in svg-renderer
 * @param {Object} params - parameters from curly braces
 * @returns {string} style marker for subsequent processing
 */
function processStyleVariable(params) {
  // If there's a text parameter - this is inline style
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
    
    // Create a JSON marker that will be recognized during SVG generation
    // Use special characters to avoid conflicts
    const styleMarker = `\x00STYLE_START\x00${JSON.stringify(styles)}\x00${params.text}\x00STYLE_END\x00`;
    return styleMarker;
  }
  
  // If there are no parameters - this might be a closing tag (for future use)
  return '';
}

/**
 * Processes the $RELATIVE_DATE variable
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
  // If date for comparison is specified - calculate the difference
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
 * Finds variables in a string considering nested braces
 * @param {string} str - string to search in
 * @returns {Array} array of objects {start, end, varName, paramsStr}
 */
function findVariablesWithBalancedBraces(str) {
  const variables = [];
  const varNameRegex = /\$(\w+)/g;
  let match;
  
  // Find all potential variable starts
  while ((match = varNameRegex.exec(str)) !== null) {
    const varName = match[1];
    const startPos = match.index;
    const afterVarPos = match.index + match[0].length;
    
    // Check if there's an opening brace after the variable name
    if (str[afterVarPos] === '{') {
      // Find the matching closing brace considering balance
      let braceCount = 0;
      let endPos = afterVarPos;
      let inQuotes = false;
      let quoteChar = '';
      
      for (let i = afterVarPos; i < str.length; i++) {
        const char = str[i];
        
        // Handle quotes
        if ((char === '"' || char === "'") && (i === 0 || str[i - 1] !== '\\')) {
          if (!inQuotes) {
            inQuotes = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuotes = false;
            quoteChar = '';
          }
        }
        
        // Count braces only outside quotes
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
      
      // If we found the closing brace
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
      // Variable without parameters (e.g., $DATE without braces)
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
 * Checks if a string contains variables
 * @param {string} str - string to check
 * @returns {boolean} true if contains variables
 */
function hasVariables(str) {
  return /\$\w+/.test(str);
}

/**
 * Main function for parsing variables in a string
 * Supports nested variables through multi-pass parsing
 * @param {string} str - string with variables
 * @param {number} maxIterations - maximum number of iterations (protection against infinite loops)
 * @returns {string} string with replaced variables
 */
export function parseVariables(str, maxIterations = 10) {
  let result = str;
  let iterations = 0;
  
  // Parse while there are variables and haven't reached iteration limit
  while (hasVariables(result) && iterations < maxIterations) {
    const prevResult = result;
    
    // Find all variables considering nested braces
    const variables = findVariablesWithBalancedBraces(result);
    
    if (variables.length === 0) {
      break; // No variables to replace
    }
    
    // Look for the "innermost" variable (one that doesn't contain other variables in parameters)
    let targetVariable = null;
    for (const variable of variables) {
      // Check if there are nested variables in parameters
      if (!hasVariables(variable.paramsStr)) {
        targetVariable = variable;
        break; // Found the innermost variable
      }
    }
    
    // If we didn't find a variable without nested ones, take the first one
    // (this could be a variable without parameters or with already processed parameters)
    if (!targetVariable && variables.length > 0) {
      targetVariable = variables[0];
    }
    
    if (!targetVariable) {
      break; // Nothing to replace
    }
    
    // Process the found variable
    const params = parseParams(targetVariable.paramsStr);
    let replacement = targetVariable.fullMatch;
    
    // Process different types of variables
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
      
      // Other variables can be added here
      // case 'TIME':
      //   replacement = processTimeVariable(params);
      //   break;
      // case 'USER':
      //   replacement = processUserVariable(params);
      //   break;
      
      default:
        // If variable is not recognized, leave as is
        replacement = targetVariable.fullMatch;
    }
    
    // Replace the variable with the result
    result = result.substring(0, targetVariable.start) + replacement + result.substring(targetVariable.end);
    
    // Check for infinite loop - if string hasn't changed, exit
    if (result === prevResult) {
      break;
    }
    
    iterations++;
  }
  
  // Warning to console if limit reached (possible infinite loop)
  if (iterations >= maxIterations && hasVariables(result)) {
    console.warn('parseVariables: iteration limit reached. Possible infinite loop in variables.');
  }
  
  return result;
}

/**
 * Parses an array of strings, replacing variables
 * @param {Array<string>} lines - array of strings
 * @returns {Array<string>} array with processed strings
 */
export function parseLines(lines) {
  return lines.map(line => parseVariables(line));
}

