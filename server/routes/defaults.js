/**
 * Роут для получения дефолтных параметров
 */

import { getClientDefaults } from '../config/defaults.js';

/**
 * Обработчик GET /defaults
 * Возвращает дефолтные параметры для клиента
 */
export function handleDefaults(req, res) {
  try {
    const defaults = getClientDefaults();
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Кеш на 1 час
    res.json(defaults);
  } catch (error) {
    console.error('Error getting defaults:', error);
    res.status(500).json({ error: 'Error getting defaults' });
  }
}

