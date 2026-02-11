/**
 * Default parameter values for SVG generators
 * 
 * ⚠️ SINGLE SOURCE OF TRUTH: These values are primary for the entire application.
 * Client receives defaults via API endpoint /api/defaults
 * 
 * Server-only parameters (not sent to client):
 * - paddingX, paddingY - used only in server-side calculations
 * - lineHeight - used only in server-side calculations
 */

export const DEFAULT_PARAMS = {
  // lines can be a string or an array
  // If string - will be parsed in params-parser
  // If array - used as is
  lines: 'You text here;' +
    '$STYLE{text:\'H\', color:FFB84CFF}' +
    '$STYLE{text:\'e\', color: F266AB}' +
    '$STYLE{text:\'ll\', color: A459D1}' +
    '$STYLE{text:\'o\', color: 2CD3E1}',
  color: '6F08FF',
  background: 'FFFFFF',
  fontSize: 48,
  fontWeight: 800,
  fontFamily: 'Roboto',
  letterSpacing: 0,

  width: 800,
  height: 100,

  // printSpeed and eraseSpeed - characters per second
  printSpeed: 10,
  eraseSpeed: 10,

  delayBetweenLines: 800,

  repeat: true,
  verticalAlign: 'middle',
  horizontalAlign: 'center',

  multiLine: true,
  eraseMode: 'line', // none | line | fade
  cursorStyle: 'none', // none | straight | underlined | block

  // Not in generator, but can be passed in URL
  paddingX: 16,
  paddingY: 20,
  lineHeight: 1.35,
};

/**
 * Applies default values to provided parameters
 * @param {Object} params - user parameters (after parsing)
 * @returns {Object} parameters with defaults applied
 */
export function applyDefaults(params) {
  const result = {
    ...DEFAULT_PARAMS,
    ...params
  };
  
  // If lines is not provided or empty array - use default
  if (!params.lines || (Array.isArray(params.lines) && params.lines.length === 0)) {
    // Parse default string into array
    result.lines = typeof DEFAULT_PARAMS.lines === 'string' 
      ? DEFAULT_PARAMS.lines.split(';').map(l => l.trim()).filter(l => l)
      : DEFAULT_PARAMS.lines;
  }
  
  return result;
}

/**
 * Returns default parameters for client (without server-only fields)
 * @returns {Object} parameters for client
 */
export function getClientDefaults() {
  const { paddingX, paddingY, lineHeight, ...clientParams } = DEFAULT_PARAMS;
  
  // Convert ; to \n for textarea display on client
  if (typeof clientParams.lines === 'string') {
    clientParams.lines = clientParams.lines.replace(/;/g, '\n');
  }
  
  return clientParams;
}

