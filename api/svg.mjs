/**
 * Vercel Serverless Function for generating SVG
 * API Endpoint: /svg или /api/svg
 */

import { generateSVG } from '../server/core/svg-generator.js';
import { parseQueryParams } from '../server/config/params-parser.js';
import { applyDefaults } from '../server/config/defaults.js';

/**
 * Vercel Serverless Handler
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
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
    res.status(200).send(svg);
  } catch (error) {
    console.error('Error generating SVG:', error);
    res.status(500).send('Error generating SVG');
  }
}
