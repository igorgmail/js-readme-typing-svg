/**
 * Utilities for working with text and size calculations
 */

import { computeTextWidthPrecise, getApproximateCharWidth } from '../fonts/font-metrics.js';
import { parseStyleSegments, hasStyleMarkers } from '../processors/style-segments-parser.js';

/**
 * Escapes special characters for XML/SVG
 */
export function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Validates and sanitizes font-family value for use in SVG
 * @param {string} fontFamily - font-family value from user
 * @returns {string} valid font-family value for SVG attribute
 */
export function validateAndSanitizeFontFamily(fontFamily) {
  if (!fontFamily || typeof fontFamily !== 'string') {
    return 'monospace';
  }
  
  const trimmed = fontFamily.trim();
  if (!trimmed) {
    return 'monospace';
  }
  
  // Check for dangerous characters that can break XML
  if (/[<>&]/.test(trimmed)) {
    return 'monospace';
  }
  
  // Escape quotes for safe use in XML attribute
  const sanitized = trimmed
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  
  return sanitized;
}

/**
 * Processes background color for SVG
 * @param {string} background - background color (transparent, hex, hexa)
 * @returns {{fill: string, style: string}} object with fill and style attributes
 */
export function processBackground(background) {
  if (background === 'transparent') {
    return { fill: 'none', style: '' };
  }
  
  const hexWithoutHash = background.startsWith('#') ? background.substr(1) : background;
  
  // If this is hexa format (8 characters), use style with background-color
  if (hexWithoutHash.length === 8) {
    const hexaColor = background.startsWith('#') ? background : '#' + background;
    return { fill: 'none', style: `style="background-color: ${hexaColor};"` };
  }
  
  // For regular hex format use fill
  const hexColor = background.startsWith('#') ? background : '#' + background;
  return { fill: hexColor, style: '' };
}

/**
 * Parses letterSpacing value to pixels
 * @param {string|number} letterSpacing - letter-spacing value ('normal', '10px', '0.1em', or number)
 * @param {number} fontSize - font size (for converting em to px)
 * @returns {number} value in pixels
 */
export function parseLetterSpacing(letterSpacing, fontSize) {
  if (typeof letterSpacing === 'number') {
    return letterSpacing;
  }
  if (letterSpacing === 'normal' || !letterSpacing) {
    return 0;
  }
  const str = String(letterSpacing).trim();
  if (str.endsWith('px')) {
    return parseFloat(str) || 0;
  }
  if (str.endsWith('em')) {
    return (parseFloat(str) || 0) * fontSize;
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Calculates text width considering style segments (different fontSize and fontFamily)
 * @param {string} text - text with style markers
 * @param {number} defaultFontSize - default font size
 * @param {string|number} letterSpacing - spacing between characters
 * @param {string} fontFamily - font family (for logging)
 * @param {object|null} parsedFont - opentype.Font object or null (main font)
 * @param {Map<string, object>|null} fontsMap - map of fontFamily -> parsedFont for fonts from styles
 * @returns {number} text width
 */
export function computeTextWidthWithStyles(text, defaultFontSize, letterSpacing, fontFamily, parsedFont, fontsMap = null) {
  if (!text || text.length === 0) {
    return 0;
  }
  
  // If there are no style markers - use regular calculation
  if (!hasStyleMarkers(text)) {
    return computeTextWidth(text, defaultFontSize, letterSpacing, fontFamily, parsedFont);
  }
  
  // Parse style segments
  const segments = parseStyleSegments(text, '#000000');
  let totalWidth = 0;
  
  for (const segment of segments) {
    // Determine fontSize for segment
    let segmentFontSize = defaultFontSize;
    if (segment.styles?.fontSize) {
      const fontSizeValue = segment.styles.fontSize;
      // Support different formats: number, string with "px", just number
      const parsed = typeof fontSizeValue === 'number' 
        ? fontSizeValue 
        : parseFloat(String(fontSizeValue).replace(/px$/i, ''));
      if (!isNaN(parsed) && parsed > 0) {
        segmentFontSize = parsed;
      }
    }
    
    // Determine letterSpacing for segment (if specified in styles)
    const segmentLetterSpacing = segment.styles?.letterSpacing || letterSpacing;
    
    // Determine parsedFont for segment (if fontFamily is specified in styles)
    let segmentParsedFont = parsedFont;
    if (segment.styles?.fontFamily && fontsMap) {
      const segmentFontFamily = segment.styles.fontFamily;
      const normalizedSegmentFont = segmentFontFamily.split(',')[0].trim().replace(/["']/g, '').toLowerCase();
      segmentParsedFont = fontsMap.get(normalizedSegmentFont) || parsedFont;
    }
    
    // Calculate segment width
    if (segmentParsedFont) {
      totalWidth += computeTextWidthPrecise(segment.text, segmentFontSize, segmentParsedFont, segmentLetterSpacing);
    } else {
      const chars = [...segment.text];
      const spacing = parseLetterSpacing(segmentLetterSpacing, segmentFontSize);
      const charWidth = getApproximateCharWidth(segmentFontSize);
      totalWidth += chars.length * charWidth + (chars.length > 1 ? (chars.length - 1) * spacing : 0);
    }
  }
  
  return totalWidth;
}

/**
 * Calculates text width using precise font metrics or fallback
 * @param {string} text - text
 * @param {number} fontSize - font size
 * @param {string|number} letterSpacing - spacing between characters
 * @param {string} fontFamily - font family (for logging)
 * @param {object|null} parsedFont - opentype.Font object or null
 * @returns {number} text width
 */
export function computeTextWidth(text, fontSize, letterSpacing, fontFamily, parsedFont) {
  if (!text || text.length === 0) {
    return 0;
  }
  
  // If font is loaded and parsed, use precise metrics
  if (parsedFont) {
    return computeTextWidthPrecise(text, fontSize, parsedFont, letterSpacing);
  }
  
  // Fallback: approximate calculation if font is not loaded
  const chars = [...text];
  const spacing = parseLetterSpacing(letterSpacing, fontSize);
  const charWidth = getApproximateCharWidth(fontSize);
  
  return chars.length * charWidth + (chars.length > 1 ? (chars.length - 1) * spacing : 0);
}

/**
 * Calculates X position for text based on alignment
 * @param {string} text - text (may contain style markers)
 * @param {number} fontSize - default font size
 * @param {string} horizontalAlign - alignment (left, center, right)
 * @param {number} width - SVG width
 * @param {number} paddingX - horizontal padding
 * @param {string|number} letterSpacing - spacing between characters
 * @param {string} fontFamily - font family (for logging)
 * @param {object|null} parsedFont - opentype.Font object or null
 * @returns {number} X position
 */
export function computeTextX(text, fontSize, horizontalAlign, width, paddingX, letterSpacing, fontFamily, parsedFont, fontsMap = null) {
  // Use function with styles support if there are markers
  const textWidth = hasStyleMarkers(text)
    ? computeTextWidthWithStyles(text, fontSize, letterSpacing, fontFamily, parsedFont, fontsMap)
    : computeTextWidth(text, fontSize, letterSpacing, fontFamily, parsedFont);
  
  if (horizontalAlign === 'left') return paddingX;
  if (horizontalAlign === 'right') return width - paddingX - textWidth;
  return (width - textWidth) / 2; // center
}

/**
 * Formats letterSpacing for use in SVG
 * @param {string|number} letterSpacing - letter-spacing value
 * @returns {string} formatted value for SVG attribute
 */
export function formatLetterSpacingForSVG(letterSpacing) {
  return typeof letterSpacing === 'number' 
    ? `${letterSpacing}px` 
    : (letterSpacing || 'normal');
}

