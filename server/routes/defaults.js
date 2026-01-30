/**
 * Route for getting default parameters
 */

import { getClientDefaults } from '../config/defaults.js';

/**
 * Handler for GET /defaults
 * Returns default parameters for the client
 */
export function handleDefaults(req, res) {
  try {
    const defaults = getClientDefaults();
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.json(defaults);
  } catch (error) {
    console.error('Error getting defaults:', error);
    res.status(500).json({ error: 'Error getting defaults' });
  }
}

