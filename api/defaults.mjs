/**
 * Vercel Serverless Function for getting default parameters
 * API Endpoint: /api/defaults
 */

import { getClientDefaults } from '../server/config/defaults.js';

/**
 * Vercel Serverless Handler
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default function handler(req, res) {
  try {
    const defaults = getClientDefaults();
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.status(200).json(defaults);
  } catch (error) {
    console.error('Error getting defaults:', error);
    res.status(500).json({ error: 'Error getting defaults' });
  }
}

