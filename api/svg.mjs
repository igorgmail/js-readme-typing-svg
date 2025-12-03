/**
 * Vercel Serverless Function для генерации SVG
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
    // Парсим query параметры
    const parsedParams = parseQueryParams(req.query);
    
    // Применяем дефолтные значения
    const params = applyDefaults(parsedParams);
    
    // Генерируем SVG (c возможной асинхронной загрузкой шрифтов)
    const svg = await generateSVG(params);
    
    // Отправляем с правильным Content-Type
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(svg);
  } catch (error) {
    console.error('Error generating SVG:', error);
    res.status(500).send('Error generating SVG');
  }
}
