/**
 * SVG generator with SMIL animation for typing text effect
 * 
 * Coordinates module operations:
 * - text-utils: text manipulation utilities
 * - svg-template: SVG template rendering
 * - erase-modes: text erasing strategies
 * - animation-calculator: animation parameters calculation
 */

import { parseLines } from '../processors/variables-parser.js';
import { processBackground } from '../utils/text-utils.js';
import { renderSVG } from './svg-renderer.js';
import { calculateStartY, calculateLinesAnimation } from './animation-calculator.js';
import { getEmbeddedFontCSS, getMultipleEmbeddedFontsCSS } from '../fonts/font-embed.js';
import { extractFontFamiliesFromStyles } from '../processors/style-segments-parser.js';

/**
 * Generates SVG code with SMIL animation for typing text
 * @param {Object} params - generation parameters
 * @returns {string} SVG code
 */
export async function generateSVG(params) {
  // Parse text lines
  const rawLines = Array.isArray(params.lines) 
    ? params.lines 
    : (typeof params.lines === 'string' 
      ? params.lines.split(';').map(l => l.trim()).filter(l => l)
      : []);
  
  const lines = parseLines(rawLines);
  
  if (lines.length === 0) {
    lines.push('Your+text+here');
  }
  
  // Normalize parameters
  const normalizedParams = {
    ...params,
    multiLine: params.multiLine === true || params.multiLine === 'true' || params.multiLine === '1',
    repeat: params.repeat === true || params.repeat === 'true' || params.repeat === '1',
    color: params.color === 'transparent' ? params.color : 
      (params.color.startsWith('#') ? params.color : '#' + params.color),
    printSpeed: params.printSpeed || 5000,
    eraseSpeed: params.eraseSpeed || 50,
    delayBetweenLines: params.delayBetweenLines || 800,
    letterSpacing: params.letterSpacing || 'normal'
  };
  
  // Process background
  const backgroundValue = params.background === 'transparent' ? params.background : 
    (params.background.startsWith('#') ? params.background : '#' + params.background);
  const background = processBackground(backgroundValue);
  
  // Attempt to fetch font CSS, embed it in SVG and parse to get metrics.
  // Logic is optional: on error, simply generate SVG without embedded font.
  // IMPORTANT: load font BEFORE calling calculateStartY to use metrics for position calculation
  
  // Extract all unique fontFamily from $STYLE style segments
  const styleFontFamilies = extractFontFamiliesFromStyles(lines);
  
  // Collect list of all fonts to load: main + from styles
  const fontsToLoad = [];
  
  // Add main font
  if (normalizedParams.fontFamily) {
    fontsToLoad.push({
      fontFamily: normalizedParams.fontFamily,
      fontWeight: normalizedParams.fontWeight,
      lines,
    });
  }
  
  // Add fonts from styles (if they differ from main)
  for (const styleFontFamily of styleFontFamilies) {
    // Check if this is not the main font
    if (normalizedParams.fontFamily) {
      const normalizedMain = normalizedParams.fontFamily.split(',')[0].trim().replace(/["']/g, '').toLowerCase();
      const normalizedStyle = styleFontFamily.split(',')[0].trim().replace(/["']/g, '').toLowerCase();
      
      if (normalizedMain !== normalizedStyle) {
        fontsToLoad.push({
          fontFamily: styleFontFamily,
          fontWeight: normalizedParams.fontWeight,
          lines,
        });
      }
    } else {
      // If there's no main font, add all from styles
      fontsToLoad.push({
        fontFamily: styleFontFamily,
        fontWeight: normalizedParams.fontWeight,
        lines,
      });
    }
  }
  
  let fontCSS = '';
  let parsedFont = null;
  // Map for storing metrics of all fonts: fontFamily -> parsedFont
  const fontsMap = new Map();
  
  try {
    // Load all fonts (main + from styles) and combine CSS
    if (fontsToLoad.length > 0) {
      fontCSS = await getMultipleEmbeddedFontsCSS(fontsToLoad);
      
      // Load metrics for all fonts in parallel
      const fontMetricsPromises = fontsToLoad.map(async (fontConfig) => {
        try {
          const fontData = await getEmbeddedFontCSS(fontConfig);
          if (fontData.parsedFont) {
            // Normalize font name for key (remove quotes, take first family)
            const normalizedName = fontConfig.fontFamily.split(',')[0].trim().replace(/["']/g, '').toLowerCase();
            fontsMap.set(normalizedName, fontData.parsedFont);
          }
          return fontData;
        } catch (error) {
          // Ignore individual font loading errors
          return null;
        }
      });
      
      await Promise.all(fontMetricsPromises);
      
      // Set main parsedFont for backward compatibility
      if (normalizedParams.fontFamily) {
        const normalizedMain = normalizedParams.fontFamily.split(',')[0].trim().replace(/["']/g, '').toLowerCase();
        parsedFont = fontsMap.get(normalizedMain) || null;
      }
    } else if (normalizedParams.fontFamily) {
      // If no fonts from styles, load only main
      const mainFontData = await getEmbeddedFontCSS({
        fontFamily: normalizedParams.fontFamily,
        fontWeight: normalizedParams.fontWeight,
        lines,
      });
      fontCSS = mainFontData.css || '';
      parsedFont = mainFontData.parsedFont || null;
      
      if (parsedFont) {
        const normalizedMain = normalizedParams.fontFamily.split(',')[0].trim().replace(/["']/g, '').toLowerCase();
        fontsMap.set(normalizedMain, parsedFont);
      }
    }
  } catch (error) {
    console.warn('Failed to load fonts:', error);
    fontCSS = '';
    parsedFont = null;
  }
  
  // Calculate starting Y position (now with font metrics)
  const startY = calculateStartY({
    verticalAlign: normalizedParams.verticalAlign,
    height: normalizedParams.height,
    paddingY: normalizedParams.paddingY,
    fontSize: normalizedParams.fontSize,
    lineHeight: normalizedParams.lineHeight,
    multiLine: normalizedParams.multiLine,
    linesCount: lines.length,
    parsedFont
  });
  
  // Calculate animation parameters for all lines using font metrics
  const linesData = calculateLinesAnimation(normalizedParams, lines, startY, parsedFont, fontsMap);
  
  // Render final SVG
  return renderSVG({
    width: normalizedParams.width,
    height: normalizedParams.height,
    background,
    linesData,
    fontCSS,
  });
}

