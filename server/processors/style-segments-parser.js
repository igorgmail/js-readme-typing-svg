/**
 * Module for parsing strings with style markers into segments
 * Processes special markers created by parseVariables($STYLE{...})
 */

/**
 * Parses a string with style markers into an array of segments
 * @param {string} text - string with style markers
 * @param {string} defaultColor - default color for segments without styles
 * @returns {Array<Object>} array of segments {text, color, styles}
 */
export function parseStyleSegments(text, defaultColor = '#000000') {
  const segments = [];
  
  // Regex for finding style markers
  const styleMarkerRegex = /\x00STYLE_START\x00(.*?)\x00(.*?)\x00STYLE_END\x00/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = styleMarkerRegex.exec(text)) !== null) {
    const startIndex = match.index;
    const endIndex = styleMarkerRegex.lastIndex;
    
    // Add text before the marker (if any)
    if (startIndex > lastIndex) {
      const plainText = text.substring(lastIndex, startIndex);
      if (plainText) {
        segments.push({
          text: plainText,
          color: defaultColor,
          styles: {}
        });
      }
    }
    
    // Parse styles from the marker
    try {
      const stylesJson = match[1];
      const styledText = match[2];
      const styles = JSON.parse(stylesJson);
      
      segments.push({
        text: styledText,
        color: styles.color || defaultColor,
        styles: styles
      });
    } catch (error) {
      console.error('Error parsing style marker:', error);
      // In case of error, add as plain text
      segments.push({
        text: match[2] || '',
        color: defaultColor,
        styles: {}
      });
    }
    
    lastIndex = endIndex;
  }
  
  // Add remaining text after the last marker
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      segments.push({
        text: remainingText,
        color: defaultColor,
        styles: {}
      });
    }
  }
  
  // If there were no markers, return the entire string as one segment
  if (segments.length === 0 && text) {
    segments.push({
      text: text,
      color: defaultColor,
      styles: {}
    });
  }
  
  return segments;
}

/**
 * Checks if a string contains style markers
 * @param {string} text - string to check
 * @returns {boolean} true if the string contains style markers
 */
export function hasStyleMarkers(text) {
  return text.includes('\x00STYLE_START\x00');
}

/**
 * Removes style markers from text, leaving only "clean" text
 * Used for calculating text width
 * @param {string} text - string with markers
 * @returns {string} string without markers, only text content
 */
export function stripStyleMarkers(text) {
  if (!hasStyleMarkers(text)) {
    return text;
  }
  
  // Extract text from all style markers
  const styleMarkerRegex = /\x00STYLE_START\x00(.*?)\x00(.*?)\x00STYLE_END\x00/g;
  
  return text.replace(styleMarkerRegex, (match, stylesJson, styledText) => {
    return styledText;
  });
}

/**
 * Extracts all unique fontFamily values from style markers in strings
 * @param {Array<string>} lines - array of strings with style markers
 * @returns {Set<string>} set of unique fontFamily values
 */
export function extractFontFamiliesFromStyles(lines) {
  const fontFamilies = new Set();
  
  if (!Array.isArray(lines)) {
    return fontFamilies;
  }
  
  const styleMarkerRegex = /\x00STYLE_START\x00(.*?)\x00(.*?)\x00STYLE_END\x00/g;
  
  for (const line of lines) {
    if (!hasStyleMarkers(line)) {
      continue;
    }
    
    let match;
    while ((match = styleMarkerRegex.exec(line)) !== null) {
      try {
        const stylesJson = match[1];
        const styles = JSON.parse(stylesJson);
        
        if (styles.fontFamily && typeof styles.fontFamily === 'string') {
          const trimmed = styles.fontFamily.trim();
          if (trimmed) {
            fontFamilies.add(trimmed);
          }
        }
      } catch (error) {
        // Ignore parsing errors for individual markers
      }
    }
  }
  
  return fontFamilies;
}
