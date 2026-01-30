/**
 * Module for precise text metrics calculation using opentype.js
 * Replaces approximate coefficients with real metrics from fonts
 */

import { parseLetterSpacing } from '../utils/text-utils.js';
import { parseStyleSegments, hasStyleMarkers, stripStyleMarkers } from '../processors/style-segments-parser.js';

/**
 * Regular expression for detecting emoji
 */
const EMOJI_REGEX = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u;

/**
 * Fallback coefficient for calculating character width without loaded font
 * Based on average character width in popular proportional fonts
 */
const FALLBACK_CHAR_WIDTH_COEFFICIENT = 0.5;

/**
 * Fallback coefficient for calculating ascent (height above baseline)
 * Based on average metrics of popular fonts (typically ascent is ~0.8-0.9 of font size)
 */
const FALLBACK_ASCENT_COEFFICIENT = 0.85;

/**
 * Gets width of a single character using font metrics
 * 
 * @param {string} char - character to measure
 * @param {number} fontSize - font size in pixels
 * @param {object|null} font - opentype.Font object or null
 * @param {string|number} letterSpacing - letter spacing
 * @returns {number} character width in pixels
 */
export function getCharWidth(char, fontSize, font, letterSpacing) {
  const letterSpacingPx = parseLetterSpacing(letterSpacing, fontSize);
  
  // Handle emoji specially - their width is usually larger than regular characters
  // Use coefficient 1.4 for more accurate calculation of actual rendering width
  const isEmoji = EMOJI_REGEX.test(char);
  if (isEmoji) {
    return fontSize * 1.4 + letterSpacingPx;
  }
  
  // If font is loaded, use real metrics from opentype.js
  if (font && font.charToGlyph && font.unitsPerEm) {
    try {
      const glyph = font.charToGlyph(char);
      
      if (glyph && typeof glyph.advanceWidth === 'number') {
        // advanceWidth - this is glyph width in font units
        // Convert to pixels: (advanceWidth / unitsPerEm) * fontSize
        const scale = fontSize / font.unitsPerEm;
        const charWidth = glyph.advanceWidth * scale;
        
        return charWidth + letterSpacingPx;
      }
    } catch (error) {
      // If error occurred while getting glyph, use fallback
      console.warn(`Failed to get glyph for character "${char}":`, error.message);
    }
  }
  
  // Fallback: approximate calculation if font is not loaded or glyph not found
  return getApproximateCharWidth(fontSize) + letterSpacingPx;
}

/**
 * Approximate calculation of character width without font metrics
 * Used as fallback when font is not loaded or parsing failed
 * 
 * @param {number} fontSize - font size in pixels
 * @returns {number} approximate character width
 */
export function getApproximateCharWidth(fontSize) {
  return fontSize * FALLBACK_CHAR_WIDTH_COEFFICIENT;
}

/**
 * Calculates precise text line width using font metrics
 * 
 * @param {string} text - text to measure
 * @param {number} fontSize - font size in pixels
 * @param {object|null} font - opentype.Font object or null
 * @param {string|number} letterSpacing - letter spacing
 * @returns {number} total text width in pixels
 */
export function computeTextWidthPrecise(text, fontSize, font, letterSpacing) {
  if (!text || text.length === 0) {
    return 0;
  }
  
  // Split text into character array (supports emoji and combined characters)
  const chars = [...text];
  
  let totalWidth = 0;
  
  // Sum width of each character
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const charWidth = getCharWidth(char, fontSize, font, 0); // letterSpacing will be added separately
    totalWidth += charWidth;
  }
  
  // Add letterSpacing between characters (not after last one)
  if (chars.length > 1) {
    const letterSpacingPx = parseLetterSpacing(letterSpacing, fontSize);
    totalWidth += letterSpacingPx * (chars.length - 1);
  }
  
  return totalWidth;
}

/**
 * Calculates array of accumulated widths for each position in text considering style segments
 * Used for precise cursor positioning and erase animation
 * 
 * @param {string} text - text to measure (may contain style markers)
 * @param {number} defaultFontSize - default font size
 * @param {object|null} font - opentype.Font object or null
 * @param {string|number} letterSpacing - letter spacing
 * @returns {Array<number>} array of accumulated widths [0, width1, width1+width2, ...]
 */
export function getCharacterWidthsWithStyles(text, defaultFontSize, font, letterSpacing, fontsMap = null) {
  if (!text || text.length === 0) {
    return [0];
  }
  
  // If no style markers - use regular calculation
  if (!hasStyleMarkers(text)) {
    return getCharacterWidths(text, defaultFontSize, font, letterSpacing);
  }
  
  // Parse style segments
  const segments = parseStyleSegments(text, '#000000');
  const widths = [0]; // Start with 0
  let accumulated = 0;
  
  // Use default letterSpacing for calculation between segments
  const defaultLetterSpacingPx = parseLetterSpacing(letterSpacing, defaultFontSize);
  
  for (let segIndex = 0; segIndex < segments.length; segIndex++) {
    const segment = segments[segIndex];
    
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
    
    // Determine letterSpacing for segment
    const segmentLetterSpacing = segment.styles?.letterSpacing || letterSpacing;
    const letterSpacingPx = parseLetterSpacing(segmentLetterSpacing, segmentFontSize);
    
    // Determine font for segment (if fontFamily specified in styles)
    let segmentFont = font;
    if (segment.styles?.fontFamily && fontsMap) {
      const segmentFontFamily = segment.styles.fontFamily;
      const normalizedSegmentFont = segmentFontFamily.split(',')[0].trim().replace(/["']/g, '').toLowerCase();
      segmentFont = fontsMap.get(normalizedSegmentFont) || font;
    }
    
    const chars = [...segment.text];
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const charWidth = getCharWidth(char, segmentFontSize, segmentFont, 0);
      
      accumulated += charWidth;
      
      // Add letterSpacing after each character except last character of all text
      const isLastCharOfAll = (segIndex === segments.length - 1) && (i === chars.length - 1);
      if (!isLastCharOfAll) {
        if (i < chars.length - 1) {
          // Inside segment use segment's letterSpacing
          accumulated += letterSpacingPx;
        }
        // Don't add letterSpacing between segments, as there may be no characters between them
        // If there are characters between segments, they will be in next segment
      }
      
      widths.push(accumulated);
    }
  }
  
  // Check that number of elements matches number of characters in cleanLine
  // This is important for correct cursor positioning
  const cleanLine = stripStyleMarkers(text);
  const expectedLength = cleanLine.length + 1; // +1 for initial position 0
  
  if (widths.length !== expectedLength) {
    // If lengths don't match, this may be due to parsing issues
    // In this case use fallback calculation
    console.warn(`getCharacterWidthsWithStyles: lengths don't match. Expected ${expectedLength}, got ${widths.length}. Using fallback.`);
    return getCharacterWidths(cleanLine, defaultFontSize, font, letterSpacing);
  }
  
  return widths;
}

/**
 * Calculates array of accumulated widths for each position in text
 * Used for precise cursor positioning and erase animation
 * 
 * @param {string} text - text to measure
 * @param {number} fontSize - font size in pixels
 * @param {object|null} font - opentype.Font object or null
 * @param {string|number} letterSpacing - letter spacing
 * @returns {Array<number>} array of accumulated widths [0, width1, width1+width2, ...]
 */
export function getCharacterWidths(text, fontSize, font, letterSpacing) {
  if (!text || text.length === 0) {
    return [0];
  }
  
  const chars = [...text];
  const widths = [0]; // Start with 0
  const letterSpacingPx = parseLetterSpacing(letterSpacing, fontSize);
  
  let accumulated = 0;
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const charWidth = getCharWidth(char, fontSize, font, 0);
    
    accumulated += charWidth;
    
    // Add letterSpacing after each character except last one
    if (i < chars.length - 1) {
      accumulated += letterSpacingPx;
    }
    
    widths.push(accumulated);
  }
  
  return widths;
}

/**
 * Calculates width of remaining text when erasing character by character
 * Used in erase mode for precise animation calculation
 * 
 * @param {string} text - full text
 * @param {number} remainingChars - number of remaining characters
 * @param {number} fontSize - font size in pixels
 * @param {object|null} font - opentype.Font object or null
 * @param {string|number} letterSpacing - letter spacing
 * @returns {number} width of remaining text
 */
export function getRemainingTextWidth(text, remainingChars, fontSize, font, letterSpacing, fontsMap = null) {
  if (remainingChars <= 0) {
    return 0;
  }
  
  // If there are style markers and fontsMap, use calculation with styles
  if (hasStyleMarkers(text) && fontsMap) {
    // Extract cleanLine to work with character indices
    const cleanLine = stripStyleMarkers(text);
    const chars = [...cleanLine];
    
    // Take only first remainingChars characters
    const charsToMeasure = chars.slice(0, remainingChars);
    const remainingCleanText = charsToMeasure.join('');
    
    // Get widths for all characters considering styles
    const widths = getCharacterWidthsWithStyles(text, fontSize, font, letterSpacing, fontsMap);
    
    // Return width up to remainingChars position
    // widths[remainingChars] contains accumulated width up to this position
    if (remainingChars < widths.length) {
      return widths[remainingChars];
    }
    
    // If out of bounds, return last value
    return widths.length > 0 ? widths[widths.length - 1] : 0;
  }
  
  // Otherwise use regular calculation
  const chars = [...text];
  const charsToMeasure = chars.slice(0, remainingChars);
  const remainingText = charsToMeasure.join('');
  
  return computeTextWidthPrecise(remainingText, fontSize, font, letterSpacing);
}

/**
 * Gets font ascent (height above baseline) in pixels
 * Used for correct text positioning when verticalAlign=top
 * 
 * @param {number} fontSize - font size in pixels
 * @param {object|null} font - opentype.Font object or null
 * @returns {number} ascent in pixels
 */
export function getFontAscent(fontSize, font) {
  // If font is loaded, use real metrics from opentype.js
  if (font && typeof font.ascender === 'number' && font.unitsPerEm) {
    try {
      // ascender - this is height above baseline in font units
      // Convert to pixels: (ascender / unitsPerEm) * fontSize
      const scale = fontSize / font.unitsPerEm;
      const ascent = font.ascender * scale;
      
      return ascent;
    } catch (error) {
      // If error occurred, use fallback
      console.warn('Failed to get font ascent:', error.message);
    }
  }
  
  // Fallback: approximate calculation if font is not loaded
  return fontSize * FALLBACK_ASCENT_COEFFICIENT;
}

