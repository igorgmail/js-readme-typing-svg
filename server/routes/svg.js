/**
 * Route for generating SVG
 */

import { generateSVG } from '../core/svg-generator.js';
import { parseQueryParams } from '../config/params-parser.js';
import { applyDefaults } from '../config/defaults.js';

/**
 * Handler for GET /svg
 * Generates SVG (without JavaScript)
 */
export async function handleSVG(req, res) {
  try {
    // Parse query parameters
    const parsedParams = parseQueryParams(req.query);
    
    // Apply default values
    const params = applyDefaults(parsedParams);
    
    // Generate SVG (with possible asynchronous font loading)
    const svg = await generateSVG(params);
    
    // Send with correct Content-Type
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(svg);
  } catch (error) {
    console.error('Error generating SVG:', error);
    res.status(500).send('Error generating SVG');
  }
}

