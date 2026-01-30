/**
 * Module for parsing query parameters on server
 * Adapted version of url-parser.js to work without window
 */

/**
 * Parses lines string (separator: semicolon)
 * @param {string} linesStr - string with text separated by ;
 * @returns {Array<string>} array of strings (or empty array if string is empty)
 */
function parseLines(linesStr) {
  if (!linesStr || typeof linesStr !== 'string') return [];
  
  // Split by ; into separate lines
  const parsed = linesStr.split(';').map(line => line.trim()).filter(line => line);
  return parsed.length > 0 ? parsed : [];
}

/**
 * Converts string parameter values to required types
 * @param {string} key - parameter key
 * @param {string} value - parameter value
 * @returns {*} converted value
 */
function convertParamType(key, value) {
  // Boolean parameters
  const booleanParams = ['multiLine', 'showCaret', 'repeat'];
  if (booleanParams.includes(key)) {
    return value === 'true' || value === '1';
  }
  
  // Number parameters
  const numberParams = [
    'printSpeed', 
    'eraseSpeed', 
    'delayBetweenLines',
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
  
  // Color parameters - leave as is (without #, since it can be transparent)
  const colorParams = ['color', 'background'];
  if (colorParams.includes(key)) {
    if (value === 'transparent') return value;
    // If # already exists, keep it, otherwise don't add (will be added in generator if needed)
    return value;
  }
  
  // For others return string
  return value;
}

/**
 * Converts Express query parameters to options object for SVG generators
 * @param {Object} query - req.query object from Express
 * @returns {Object} options object for generators
 */
export function parseQueryParams(query) {
  const options = {};
  
  // Process lines (special parameter)
  // If lines is provided - parse it to array
  // If not provided - leave undefined (default will be used)
  if (query.lines !== undefined && query.lines !== null) {
    const parsed = parseLines(query.lines);
    // Save only if there's at least one line
    if (parsed.length > 0) {
      options.lines = parsed;
    }
  }
  
  // Mapping URL parameters -> function options
  const paramMapping = {
    // Animation
    printSpeed: 'printSpeed',
    eraseSpeed: 'eraseSpeed',
    duration: 'printSpeed', // alias
    delayBetweenLines: 'delayBetweenLines',
    pause: 'delayBetweenLines', // alias
    
    // Visual parameters
    fontSize: 'fontSize',
    font: 'fontSize', // alias for fontSize
    fontWeight: 'fontWeight',
    fontFamily: 'fontFamily',
    lineHeight: 'lineHeight',
    letterSpacing: 'letterSpacing',

    color: 'color',
    background: 'background',
    
    // Dimensions
    width: 'width',
    height: 'height',
    paddingX: 'paddingX',
    paddingY: 'paddingY',
    
    // Alignment
    verticalAlign: 'verticalAlign',
    vAlign: 'verticalAlign', // alias
    horizontalAlign: 'horizontalAlign',
    hAlign: 'horizontalAlign', // alias
    center: null, // handled separately
    
    // Modes
    typingMode: 'typingMode',
    eraseMode: 'eraseMode',
    cursorStyle: 'cursorStyle',
    multiLine: 'multiLine',
    showCaret: 'showCaret',
    repeat: 'repeat'
  };
  
  // Apply mapping
  for (const [urlKey, optionKey] of Object.entries(paramMapping)) {
    if (query[urlKey] !== undefined && optionKey !== null) {
      const value = convertParamType(optionKey, query[urlKey]);

      if (value !== undefined) {
        options[optionKey] = value;
      }
    }
  }
  
  // Special handling for center
  if (query.center === 'true' || query.center === '1') {
    options.horizontalAlign = 'center';
    options.verticalAlign = 'middle';
  }
  
  return options;
}

