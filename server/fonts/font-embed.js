/**
 * Utility for loading font CSS from Google Fonts
 * and replacing font-file links with embedded data-URI.
 * Also parses font through opentype.js to extract metrics.
 *
 * IMPORTANT:
 * - Logic is optional: if something goes wrong, return empty string
 *   and don't break SVG generation.
 * - Assume that one font-family is used from generator parameters.
 */

import { Buffer } from 'node:buffer';
import * as opentype from 'opentype.js';

const GOOGLE_FONTS_API = 'https://fonts.googleapis.com/css2';

// Flag for one-time warning about missing fetch
let fetchWarningShown = false;

/**
 * Normalizes font-family value for use in Google Fonts request:
 * - takes only the first family before comma
 * - removes quotes
 * - capitalizes each word to "FirstLetterUpperCase, rest lowercase"
 * Examples:
 *   `"pacifico", cursive` -> `Pacifico`
 *   `"roboto slab", serif` -> `Roboto Slab`
 *   `Roboto` -> `Roboto`
 * @param {string} fontFamily
 * @returns {string}
 */
function normalizeFontFamilyForGoogle(fontFamily) {
  if (!fontFamily || typeof fontFamily !== 'string') {
    return '';
  }

  const primary = fontFamily.split(',')[0].trim();
  const withoutQuotes = primary.replace(/["']/g, '').trim();

  if (!withoutQuotes) {
    return '';
  }

  const words = withoutQuotes.split(/\s+/).filter(Boolean);

  // Keep spaces inside value — URLSearchParams will convert them to '+'
  // family=Roboto Slab -> family=Roboto+Slab in final URL
  // IMPORTANT: don't change case, so name matches what Google Fonts expects
  const normalized = words.join(' ');

  return normalized;
}

/**
 * Checks if font name is a "generic" CSS font,
 * for which it makes no sense to fetch from Google Fonts.
 * @param {string} fontFamily
 * @returns {boolean}
 */
function isGenericFontFamily(fontFamily) {
  const normalized = normalizeFontFamilyForGoogle(fontFamily).toLowerCase();

  if (!normalized) {
    return true;
  }

  // Basic set of generic fonts
  const genericFamilies = [
    'monospace',
    'serif',
    'sans-serif',
    'system-ui',
    'ui-monospace',
    'ui-sans-serif',
  ];

  return genericFamilies.includes(normalized);
}

/**
 * Builds URL for Google Fonts API.
 * @param {string} fontFamily
 * @param {string|number} fontWeight
 * @param {string[]} lines
 * @returns {string}
 */
function buildGoogleFontsUrl(fontFamily, fontWeight, lines) {
  const normalizedFamily = normalizeFontFamilyForGoogle(fontFamily);
  if (!normalizedFamily) {
    return GOOGLE_FONTS_API;
  }

  const allText = Array.isArray(lines) ? lines.join(' ') : '';
  // Keep only unique characters to reduce font size
  const uniqueChars = allText ? [...new Set(allText)].join('') : '';

  // Build URL with font weight and unique characters for optimization
  const url = `${GOOGLE_FONTS_API}?${new URLSearchParams({
    family: `${normalizedFamily}:wght@${fontWeight}`,
    text: uniqueChars,
    display: 'fallback',
  })}`;

  return url;
}

/**
 * Loads CSS from Google Fonts, replaces font-file links
 * with embedded data-URI and parses first font through opentype.js.
 *
 * @param {Object} options
 * @param {string} options.fontFamily
 * @param {string|number} options.fontWeight
 * @param {string[]} options.lines
 * @returns {Promise<{css: string, parsedFont: object|null}>} CSS and parsed font
 */
export async function getEmbeddedFontCSS(options) {
  const { fontFamily, fontWeight, lines } = options || {};

  if (!fontFamily || isGenericFontFamily(fontFamily)) {
    return { css: '', parsedFont: null };
  }

  // If fetch is unavailable (old Node) — show warning
  if (typeof fetch !== 'function') {
    if (!fetchWarningShown) {
      console.warn('⚠️  Cannot load Google Font: fetch API unavailable (Node.js < 18)');
      fetchWarningShown = true;
    }
    return { css: '', parsedFont: null };
  }

  try {
    const url = buildGoogleFontsUrl(fontFamily, fontWeight, lines);

    const response = await fetch(url, {
      headers: {
        // Without proper User-Agent Google Fonts sometimes returns empty response
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      return { css: '', parsedFont: null };
    }

    let css = await response.text();
    let parsedFont = null;
    let firstFontBuffer = null;

    // Find all font-file links and replace them with data-URI
    const urlRegex =
      /url\((https:\/\/fonts\.gstatic\.com[^)]+)\)\s+format\(['"]([^'"]+)['"]\)/g;
    const matches = [...css.matchAll(urlRegex)];

    for (const match of matches) {
      const [, fontUrl, fontFormat] = match;

      try {
        const fontResponse = await fetch(fontUrl);
        if (!fontResponse.ok) {
          continue;
        }

        const fontBuffer = await fontResponse.arrayBuffer();
        
        // Save first loaded font for parsing
        if (!firstFontBuffer) {
          firstFontBuffer = fontBuffer;
        }
        
        const base64Font = Buffer.from(fontBuffer).toString('base64');
        const dataUri = `data:font/${fontFormat};base64,${base64Font}`;

        css = css.replace(fontUrl, dataUri);
      } catch (fontError) {
        // Don't log in production to avoid spamming console
      }
    }

    // Parse first loaded font through opentype.js to get metrics
    if (firstFontBuffer) {
      try {
        parsedFont = opentype.parse(firstFontBuffer);
      } catch (parseError) {
        console.warn(`Failed to parse font ${fontFamily}:`, parseError.message);
        // parsedFont remains null, fallback will be used
      }
    }

    return { css, parsedFont };
  } catch (error) {
    // On any error just return empty values
    return { css: '', parsedFont: null };
  }
}

/**
 * Loads CSS for multiple fonts and combines them into one CSS block
 * @param {Array<{fontFamily: string, fontWeight: string|number, lines: string[]}>} fonts - array of objects with font parameters
 * @returns {Promise<string>} combined CSS for all fonts
 */
export async function getMultipleEmbeddedFontsCSS(fonts) {
  if (!Array.isArray(fonts) || fonts.length === 0) {
    return '';
  }
  
  // Remove duplicate fonts before loading
  const uniqueFonts = [];
  const seenFonts = new Set();
  
  for (const font of fonts) {
    if (!font.fontFamily) continue;
    
    const normalized = normalizeFontFamilyForGoogle(font.fontFamily).toLowerCase();
    if (normalized && !seenFonts.has(normalized)) {
      seenFonts.add(normalized);
      uniqueFonts.push(font);
    }
  }
  
  if (uniqueFonts.length === 0) {
    return '';
  }
  
  // Load all fonts in parallel
  const cssPromises = uniqueFonts.map(font => getEmbeddedFontCSS(font));
  const results = await Promise.all(cssPromises);
  
  // Combine all CSS
  const allCSS = results.map(r => r.css).filter(Boolean).join('\n');
  
  // Remove duplicate @font-face with same font-family and font-weight
  const fontFaceRegex = /@font-face\s*\{[^}]*\}/gs;
  const fontFaces = new Map();
  
  const matches = allCSS.matchAll(fontFaceRegex);
  for (const match of matches) {
    const fontFace = match[0];
    // Extract font-family and font-weight from @font-face for unique identification
    const familyMatch = fontFace.match(/font-family:\s*['"]?([^'";}]+)['"]?/i);
    const weightMatch = fontFace.match(/font-weight:\s*([^;}+]+)/i);
    
    if (familyMatch) {
      const family = familyMatch[1].trim().toLowerCase();
      const weight = weightMatch ? weightMatch[1].trim() : 'normal';
      const key = `${family}:${weight}`;
      
      // Save first variant (they are all identical after loading)
      if (!fontFaces.has(key)) {
        fontFaces.set(key, fontFace);
      }
    }
  }
  
  // Combine unique @font-face
  return Array.from(fontFaces.values()).join('\n');
}